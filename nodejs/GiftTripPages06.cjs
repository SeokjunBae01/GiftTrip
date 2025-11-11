// GiftTripPages06.cjs
const express = require("express");
const router = express.Router();
const { getLikes } = require("./LikedStore.cjs");

// ===== 공통 유틸 =====
const normCode = (s) => (s || "").toUpperCase();

function fileNameFromUrl(url) {
  if (!url) return "";
  try {
    const last = url.split("/").pop().split("?")[0];
    const base = last.includes(".") ? last.slice(0, last.lastIndexOf(".")) : last;
    return decodeURIComponent(base).replace(/[_-]+/g, " ").trim();
  } catch {
    return "";
  }
}

// "제목-설명.확장자" → "제목"
function titleOnlyFromUrl(url) {
  const base = fileNameFromUrl(url);
  if (!base) return "";
  const [title] = base.split("-").map((s) => s.trim());
  return title || "";
}

// 한글 표시용 매핑 (UI용)
const korFromKey = (key) =>
  ({
    Stay: "도시",
    Activity: "액티비티",
    Food: "음식",
    Spots: "인기 스팟",
  }[key] || key);

// ===== 목록 API =====
// GET /api/page6/selections?countryCode=JP&categoryKey=Stay&sort=popular|recent
router.get("/page6/selections", (req, res) => {
  try {
    const rawCountry = req.query.countryCode || undefined;
    const rawCat = req.query.categoryKey || undefined;
    const sort = req.query.sort || "recent";

    const countryCode = rawCountry ? normCode(rawCountry) : undefined; // ✅ 대문자 정규화
    const categoryKey = rawCat || undefined;

    console.log("[/page6/selections] IN:", { rawCountry, countryCode, categoryKey, sort });

    let items = getLikes({
      countryCode, // ✅ 정규화된 코드로 필터
      categoryKey,
    });

    // 정렬(지금은 최근순=인기순 동일 처리)
    items.sort((a, b) => b.createdAt - a.createdAt);

    console.log("[/page6/selections] matched:", items.length, "first:", items[0]);

    const result = items.map((x) => ({
      id: x.id,
      // UI 탭 필터용 (한글)
      type: korFromKey(x.categoryKey),
      // 프론트 로직용(필요 시)
      categoryKey: x.categoryKey,
      name: fileNameFromUrl(x.imageUrl) || x.categoryName || x.categoryKey,
      // JP / Activity 같은 기술적 표시는 제거
      description: "",
      imageUrl: x.imageUrl,
      createdAt: x.createdAt,
    }));

    return res.json({ success: true, items: result, count: result.length });
  } catch (e) {
    console.error("[/page6/selections] error:", e);
    return res.status(500).json({ success: false, error: "목록을 불러올 수 없습니다." });
  }
});

// ===== 태그라인 API (전체 합친 한 문장) =====

function buildFallbackTaglineAll(titlesByCategory) {
  const flat = [
    ...(titlesByCategory.Stay || []),
    ...(titlesByCategory.Food || []),
    ...(titlesByCategory.Activity || []),
    ...(titlesByCategory.Spots || []),
  ].filter(Boolean);

  const uniq = Array.from(new Set(flat)).slice(0, 3);
  const joined = uniq.length ? uniq.join("·") : "이곳";
  return `당신은 ${joined}를 여행하는 것을 추천합니다.`;
}

async function generateTaglineWithLLM({ titlesByCategory }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildFallbackTaglineAll(titlesByCategory);

  const system = `너는 여행 앱의 여행 추천 문구를 작성하는 카피라이터야.
규칙:
#은 줄바꿈(\n)으로 처리한다.
한국어 한 문장만 작성한다.
75자 내외, 자연스럽고 따뜻한 어조로 쓴다.

입력된 도시, 스팟 이름 중에서
가장 많이 등장하거나 겹치는(빈도수가 가장 높은) 도시명을 중심으로 문장을 작성한다.
빈도수는 문자열 일치 기준으로 계산하며,
도시명은 대소문자를 구분하지 않는다.
겹치는 횟수가 동일할 경우 첫 번째로 등장한 도시명을 우선한다.

도시명과 인기 스팟의 '내용 부분'이 완전히 일치할 때만
해당 스팟을 '인기 스팟'으로 간주하며, 아래 구조를 사용한다:
당신은 [도시명]을 여행하는 것을 추천합니다.# 마침 [도시명] 도시에 인기 스팟인 [스팟명]이 존재합니다.
이때 [스팟명]이 여러 개라면 쉼표로 구분하여 모두 나열한다.

‘완전히 일치’란 의미적 유사성이 아닌 **문자열이 정확히 동일한 경우**만을 뜻한다.
예를 들어 '서울'과 '서울타워'는 다른 단어이며, '서울'과 '서울'만 일치로 본다.

단, '근교', '외곽', '주변' 등의 단어가 도시명 뒤에 붙은 경우
예: '도쿄근교', '파리 외곽', '오사카 주변'
→ 해당 명칭은 원래 도시명(도쿄, 파리, 오사카)으로 간주한다.

도시명과 스팟명이 다를 경우에는 아래 구조를 사용한다:
당신은 [도시명]을 여행하는 것을 추천합니다.# [해당 도시의 설명 또는 분위기 소개]

주소상 [도시명] 내부에 인기 스팟이 없을 경우 ‘인기 스팟’이라는 단어는 절대 사용하지 않는다.

문장은 자연스럽고 따뜻하게 연결되며, 쉼표는 1~2개만 사용한다.
물결(~)과 느낌표(!)는 절대 사용하지 않는다.`;

  const user = `
도시: ${titlesByCategory.Stay?.join(" · ") || "없음"}
음식: ${titlesByCategory.Food?.join(" · ") || "없음"}
액티비티: ${titlesByCategory.Activity?.join(" · ") || "없음"}
인기 스팟: ${titlesByCategory.Spots?.join(" · ") || "없음"}

위 정보를 참고하여 한 문장의 한국어 문장으로 작성해줘.`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: 80,
      }),
    });

    if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || buildFallbackTaglineAll(titlesByCategory);
  } catch (e) {
    console.error("[/page6/tagline] LLM error:", e.message);
    return buildFallbackTaglineAll(titlesByCategory);
  }
}

// GET /api/page6/tagline?countryCode=JP
router.get("/page6/tagline", async (req, res) => {
  try {
    const rawCountry = req.query.countryCode || undefined;
    const countryCode = rawCountry ? normCode(rawCountry) : undefined; // ✅ 대문자 정규화
    console.log("[/page6/tagline] IN:", { rawCountry, countryCode });

    const items = getLikes({ countryCode });
    console.log(
      "[/page6/tagline] like items:",
      items.length,
      { sample: items[0] && { cc: items[0].countryCode, cat: items[0].categoryKey } }
    );

    const titlesByCategory = { Stay: [], Activity: [], Food: [], Spots: [] };
    for (const x of items) {
      const title = titleOnlyFromUrl(x.imageUrl);
      if (!title) continue;
      const key = x.categoryKey || "Stay";
      if (titlesByCategory[key]) titlesByCategory[key].push(title);
    }

    const tagline = await generateTaglineWithLLM({ titlesByCategory });
    console.log("[/page6/tagline] OUT:", { hasTagline: !!tagline });

    return res.json({ success: true, tagline, titlesByCategory });
  } catch (e) {
    console.error("[/page6/tagline] error:", e);
    return res.status(500).json({ success: false, error: "태그라인을 생성할 수 없습니다." });
  }
});

module.exports = router;