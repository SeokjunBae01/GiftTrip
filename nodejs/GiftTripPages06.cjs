// GiftTripPages06.cjs
const express = require("express");
const router = express.Router();
const { getLikes } = require("./LikedStore.cjs");

// ===== 공통 유틸 =====
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
  const [title] = base.split("-").map(s => s.trim());
  return title || "";
}

// ===== 기존 목록 API (변경 없음) =====
// GET /api/page6/selections?countryCode=JP&categoryKey=Stay&sort=popular|recent
router.get("/page6/selections", (req, res) => {
  try {
    const { countryCode, categoryKey, sort = "recent" } = req.query;
    let items = getLikes({
      countryCode: countryCode || undefined,
      categoryKey: categoryKey || undefined,
    });

    // 정렬(지금은 최근순=인기순)
    items.sort((a, b) => b.createdAt - a.createdAt);

    const result = items.map(x => ({
      id: x.id,
      type: x.categoryName || x.categoryKey, // "도시"/"액티비티"/"음식"/"인기 스팟" 혹은 영문키
      name: fileNameFromUrl(x.imageUrl) || x.categoryName || x.categoryKey,
      description: `${x.countryCode || ""} / ${x.categoryKey || ""}`.trim(),
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

// 폴백 문구(전체 기준)
function buildFallbackTaglineAll(titlesByCategory) {
  const flat = [
    ...(titlesByCategory.Stay || []),
    ...(titlesByCategory.Food || []),
    ...(titlesByCategory.Activity || []),
    ...(titlesByCategory.Spots || []),
  ].filter(Boolean);

  const uniq = Array.from(new Set(flat)).slice(0, 3);
  const joined = uniq.length ? uniq.join("·") : "이곳";
  // 30자 내외, 한 문장
  return `당신은 ${joined}를 여행하는 것을 추천합니다.`;
}

// LLM 호출(전체 합쳐 한 문장)
async function generateTaglineWithLLM({ titlesByCategory }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildFallbackTaglineAll(titlesByCategory);

  const system = `너는 여행 앱의 여행 추천 문구를 작성하는 카피라이터야.
규칙:
- 한국어 한 문장만 작성.
- 30자 내외로, 자연스럽고 따뜻한 톤으로.
- 사용자가 고른 도시, 음식, 액티비티, 스팟 이름들을 종합해 한 문장으로 표현하기.
- '당신은 ~을 여행하는 것을 추천합니다.' 또는 유사한 구조로 시작.
- 뒤에는 음식/액티비티/스팟을 자연스럽게 이어서 소개.
- 쉼표는 1~2개만, 물결/느낌표 금지.`;

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
    const { countryCode } = req.query;

    // 좋아요 전체(국가 기준) 수집
    const items = getLikes({ countryCode: countryCode || undefined });

    // 카테고리별 제목 모으기 (파일명 → "제목-설명" 중 "제목"만)
    const titlesByCategory = { Stay: [], Activity: [], Food: [], Spots: [] };
    for (const x of items) {
      const title = titleOnlyFromUrl(x.imageUrl);
      if (!title) continue;
      const key = x.categoryKey || "Stay";
      if (titlesByCategory[key]) titlesByCategory[key].push(title);
    }

    // LLM 문구 생성(전체 한 문장)
    const tagline = await generateTaglineWithLLM({ titlesByCategory });

    return res.json({ success: true, tagline, titlesByCategory });
  } catch (e) {
    console.error("[/page6/tagline] error:", e);
    return res.status(500).json({ success: false, error: "태그라인을 생성할 수 없습니다." });
  }
});

module.exports = router;
