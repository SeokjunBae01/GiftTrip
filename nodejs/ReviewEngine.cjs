// nodejs/ReviewEngine.cjs
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

/* ===================== OpenAI ===================== */
const OPENAI_KEY_PRESENT = !!process.env.OPENAI_API_KEY;
let openai = null;
if (OPENAI_KEY_PRESENT) {
  const { OpenAI } = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/* ===================== 캐시 기본 설정 ===================== */
// TTL: 15분, 최대 파일 수: 500, 루트 디렉토리: nodejs/cache/reviews
const REVIEW_CACHE_TTL_MS = Number(process.env.REVIEW_CACHE_TTL_MS || 15 * 60 * 1000);
const REVIEW_CACHE_MAX    = Number(process.env.REVIEW_CACHE_MAX || 500);
const REVIEW_CACHE_DIR    = process.env.REVIEW_CACHE_DIR || path.join(__dirname, "cache", "reviews");

// 폴더 보장
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDirSync(REVIEW_CACHE_DIR);

/* ===================== 경로 유틸 (요청 포맷 적용) ===================== */
// cc → 하위 폴더명 (예: "jp")
function ccFolder(cc = "") {
  return String(cc || "").toLowerCase() || "xx";
}
// category → 하위 폴더명 (예: "activity", "food", "stay", "spots")
function catFolder(cat = "") {
  const k = String(cat || "").toLowerCase();
  if (["stay", "activity", "food", "spots"].includes(k)) return k;
  return "unknown";
}
// 사진 제목을 안전한 파일명으로
function toSafeFilename(title = "") {
  let name = String(title || "").trim();
  // OS 위험 문자 제거/치환
  name = name
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, " ") // 제어문자/금지문자 공백
    .replace(/\s+/g, " ")                        // 다중 공백 정리
    .replace(/\./g, "·")                         // 확장자 구분과 혼동 방지
    .trim();

  // 너무 길면 앞부분 + 해시로 축약
  const MAX_BASENAME = 120;
  if (name.length > MAX_BASENAME) {
    const hash = crypto.createHash("sha1").update(name).digest("hex").slice(0, 8);
    name = name.slice(0, MAX_BASENAME - 9).trim() + "_" + hash;
  }
  if (!name) name = "untitled";
  return name;
}

// 표준화된 파일 경로 생성: cache/<cc>/<category>/<title>.json
function cacheFilePath({ cc, categoryKey, title }) {
  const dir = path.join(REVIEW_CACHE_DIR, ccFolder(cc), catFolder(categoryKey));
  ensureDirSync(dir);
  const filename = `${toSafeFilename(title)}.json`;
  return path.join(dir, filename);
}

/* ===================== 메모리 캐시 (키: cc|cat|title) ===================== */
const memCache = new Map();
function makeKey({ cc = "", cat = "", title = "" }) {
  return [String(cc).toUpperCase(), String(cat), String(title)].join("|");
}
function getMemCached(key) {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > REVIEW_CACHE_TTL_MS) {
    memCache.delete(key);
    return null;
  }
  return hit.value;
}
function setMemCached(key, value) {
  if (memCache.size >= REVIEW_CACHE_MAX) {
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(key, { ts: Date.now(), value });
}

/* ===================== 디스크 캐시 (요청 포맷) ===================== */
async function readDiskCacheByTitle({ cc, categoryKey, title }) {
  try {
    const fp = cacheFilePath({ cc, categoryKey, title });
    const stat = await fsp.stat(fp).catch(() => null);
    if (!stat) return null;
    if (Date.now() - stat.mtimeMs > REVIEW_CACHE_TTL_MS) {
      // TTL 만료 → 삭제
      fsp.unlink(fp).catch(() => {});
      return null;
    }
    const raw = await fsp.readFile(fp, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeDiskCacheByTitle({ cc, categoryKey, title, value }) {
  try {
    const fp = cacheFilePath({ cc, categoryKey, title });
    const payload = JSON.stringify(value, null, 2);
    await fsp.writeFile(fp, payload, "utf8");
    // 전체 용량 관리
    pruneDiskCache().catch(() => {});
  } catch {
    // ignore
  }
}

// 디스크 캐시 파일 전수 조사
async function listJsonFilesRecursively(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let ents = [];
    try { ents = await fsp.readdir(cur, { withFileTypes: true }); } catch { continue; }
    for (const ent of ents) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.endsWith(".json")) out.push(full);
    }
  }
  return out;
}

// 오래된 파일 정리 및 MAX 유지
async function pruneDiskCache() {
  const files = await listJsonFilesRecursively(REVIEW_CACHE_DIR);
  if (!files.length) return;

  const now = Date.now();
  const items = [];
  for (const fp of files) {
    try {
      const stat = await fsp.stat(fp);
      const ts = stat.mtimeMs || 0;
      // TTL 만료 우선 제거
      if (now - ts > REVIEW_CACHE_TTL_MS) {
        await fsp.unlink(fp).catch(() => {});
      } else {
        items.push({ fp, ts });
      }
    } catch {
      // ignore broken files
    }
  }

  // 갱신 후 살아있는 파일이 MAX 초과면 오래된 것부터 제거
  if (items.length > REVIEW_CACHE_MAX) {
    items.sort((a, b) => b.ts - a.ts); // 최신 우선
    const keep = new Set(items.slice(0, REVIEW_CACHE_MAX).map(i => i.fp));
    for (const it of items) {
      if (!keep.has(it.fp)) await fsp.unlink(it.fp).catch(() => {});
    }
  }
}

async function clearReviewCache() {
  const mem = memCache.size;
  memCache.clear();

  const files = await listJsonFilesRecursively(REVIEW_CACHE_DIR);
  let removed = 0;
  for (const fp of files) {
    try { await fsp.unlink(fp); removed++; } catch {}
  }
  return { mem_removed: mem, disk_removed: removed };
}

async function cacheStats() {
  const files = await listJsonFilesRecursively(REVIEW_CACHE_DIR);
  return {
    mem_size: memCache.size,
    disk_files: files.length,
    ttl_ms: REVIEW_CACHE_TTL_MS,
    max: REVIEW_CACHE_MAX,
    dir: REVIEW_CACHE_DIR,
  };
}

/* ===================== 문자열/카테고리 유틸 ===================== */
function extractTitleFromUrl(imageUrl = "") {
  try {
    const decoded = decodeURIComponent(imageUrl);
    const base = (decoded.split("/").pop() || "").split("?")[0];
    const noExt = base.replace(/\.[a-zA-Z0-9]+$/, "");
    return noExt.replace(/[_-]+/g, " ").trim();
  } catch {
    return "";
  }
}

function normalizeTitle(raw = "") {
  return String(raw)
    .replace(/[&|·]/g, " ")
    .replace(/\s*투어\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeCategoryKey(key = "") {
  const k = String(key).trim();
  const map = {
    Stay: "Stay",
    Activity: "Activity",
    Food: "Food",
    Spots: "Spots",
    Spot: "Spots",
    숙박: "Stay",
    액티비티: "Activity",
    음식: "Food",
    "인기스팟": "Spots",
    "인기 스팟": "Spots",
  };
  return map[k] || k;
}

/* ===================== Fallback ===================== */
function fallbackReviews(title) {
  const t = title || "이 장소";
  return {
    title: t,
    positives: [
      `${t}의 분위기가 좋아 사진 찍기에도 훌륭했어요.`,
      `${t} 주변 동선이 편하고 전반적으로 만족스러웠습니다.`,
    ],
    negatives: [
      `${t}에 사람이 몰릴 때가 있어 조용한 방문은 어려울 수 있어요.`,
      `${t} 인근 편의시설이 적어 아쉬웠어요.`,
    ],
    provider: "gpt-fallback",
    lang: "ko",
  };
}

/* ===================== GPT 리뷰 생성 ===================== */
async function getReviewsGPT({ title, imageUrl, countryCode, categoryKey }) {
  const cc  = String(countryCode || "").toUpperCase();
  const cat = normalizeCategoryKey(categoryKey);
  const base = title || extractTitleFromUrl(imageUrl || "");
  const picked = normalizeTitle(base) || "이 장소";

  if (!openai) return fallbackReviews(`${cc} ${picked}`.trim());

  const system = `너는 여행 큐레이션 서비스를 돕는 한국어 어시스턴트야.
입력된 "제목"은 사진 파일명에서 온 장소/음식/액티비티/스팟 이름이야.
한국 여행자 관점에서 현실적인 느낌의 리뷰를 생성해.`;

  const user = `다음 정보를 참고해 리뷰를 만들어줘.
- 국가 코드: ${cc || "N/A"}
- 카테고리: ${cat || "N/A"}
- 제목: ${picked}

요구사항:
1) 한국어로만 작성.
2) 긍정 2문장, 부정 2문장.
3) 사실 단정/허위 지양, 일반적 경험/느낌 위주.
4) 문장 앞에 번호/불릿/따옴표 없이.
5) JSON으로만 반환(키: title, positives, negatives). 각 배열 길이=2.

반환 예시:
{
  "title": "JP 도쿄 스카이트리",
  "positives": ["...", "..."],
  "negatives": ["...", "..."]
}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = resp.choices?.[0]?.message?.content || "";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const lines = content.split("\n").map(s => s.trim()).filter(Boolean);
    const pos = lines.slice(0, 2);
    const neg = lines.slice(2, 4);
    return {
      title: `${cc} ${picked}`.trim(),
      positives: pos.length === 2 ? pos : fallbackReviews(picked).positives,
      negatives: neg.length === 2 ? neg : fallbackReviews(picked).negatives,
      provider: "gpt-loose",
      lang: "ko",
    };
  }

  const positives = Array.isArray(parsed.positives) ? parsed.positives.slice(0, 2) : [];
  const negatives = Array.isArray(parsed.negatives) ? parsed.negatives.slice(0, 2) : [];
  const safe = fallbackReviews(`${cc} ${picked}`.trim());

  return {
    title: parsed.title || `${cc} ${picked}`.trim(),
    positives: positives.length === 2 ? positives : safe.positives,
    negatives: negatives.length === 2 ? negatives : safe.negatives,
    provider: "gpt",
    lang: "ko",
  };
}

/* ===================== 캐시 래퍼 (메모리 + 디스크 폴더 구조) ===================== */
async function getCachedByTitle({ cc, categoryKey, title }) {
  const key = makeKey({ cc, cat: categoryKey, title });
  // 1) 메모리
  const mem = getMemCached(key);
  if (mem) return mem;

  // 2) 디스크 (cache/<cc>/<category>/<title>.json)
  const disk = await readDiskCacheByTitle({ cc, categoryKey, title });
  if (disk) {
    setMemCached(key, disk);
    return disk;
  }
  return null;
}

async function setCachedByTitle({ cc, categoryKey, title, value }) {
  const key = makeKey({ cc, cat: categoryKey, title });
  setMemCached(key, value);
  await writeDiskCacheByTitle({ cc, categoryKey, title, value });
}

// 공개 API: GPT + 캐시
async function getReviewsGPTCached({ title, imageUrl, countryCode, categoryKey }) {
  const cc  = String(countryCode || "").toUpperCase();
  const cat = normalizeCategoryKey(categoryKey);
  const base = title || extractTitleFromUrl(imageUrl || "");
  const picked = normalizeTitle(base) || "이 장소";

  // 캐시 조회
  const hit = await getCachedByTitle({ cc, categoryKey: cat, title: picked });
  if (hit) return { ...hit, provider: (hit.provider || "gpt") + "+cache" };

  // 생성 → 캐시 저장
  const fresh = await getReviewsGPT({ title: picked, imageUrl, countryCode: cc, categoryKey: cat });
  await setCachedByTitle({ cc, categoryKey: cat, title: picked, value: fresh });
  return fresh;
}

/* ===================== exports ===================== */
module.exports = {
  // gpt
  getReviewsGPT,
  getReviewsGPTCached,

  // utils
  extractTitleFromUrl,
  normalizeTitle,
  normalizeCategoryKey,
  fallbackReviews,

  // cache ops
  clearReviewCache,
  cacheStats,
};
