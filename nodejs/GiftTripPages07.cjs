// GiftTripPages07.cjs (또는 기존 라우터 파일에 추가)

const express = require("express");
const router = express.Router();
const { getLikes } = require("./LikedStore.cjs");
const { getData } = require("./Manager.cjs");

/*
  Page 06에서 사용했던 함수
  이미지 URL에서 파일 이름을 추출하여 'name'으로 사용
 */
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

// 폴백 문구
function buildFallbackTaglineAll(titlesByCategory) {
  const flat = [
    ...(titlesByCategory.Stay || []),
    ...(titlesByCategory.Food || []),
    ...(titlesByCategory.Activity || []),
    ...(titlesByCategory.Spots || []),
  ].filter(Boolean);
  const uniq = Array.from(new Set(flat)).slice(0, 3);
  const joined = uniq.length ? uniq.join("·") : (countryName || "이곳");
  return `${joined}에서의 멋진 여행이 완성되었습니다!`;
}

// LLM 호출
async function generateTaglineWithLLM({ titlesByCategory, countryName, recommendationType }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return buildFallbackTaglineAll(titlesByCategory, countryName);

  const system = `너는 여행 계획을 요약하고 기대감을 불어넣는 여행 플래너야.
규칙:
- 항상 한국어로, 2~3문장 이내로 친근하고 따뜻한 톤으로 작성.
- 사용자가 고른 항목(도시, 음식, 스팟 등) 중 가장 눈에 띄는 1~2개를 언급하며 "멋진 [항목]을(를) 고르셨네요."라고 시작.
- 그 다음, "이번 [국가명] 여행에서는 [선택한 항목들을 조합한 기대되는 점] 점이 특히 기대돼요!"라고 기대감을 표현.
- 만약 '여행 타입' 정보가 '없음'이 아니라면, "이 선택은 '[여행 타입]'과도 정말 잘 어울려요."라고 덧붙이기.
- '여행 타입' 정보가 '없음'이라면 이 문장은 아예 생략.
- 느낌표, 물결표 사용 가능 (단, 합쳐서 최대 2개).`;

  const user = `
국가명: ${countryName || "이번"}
여행 타입: ${recommendationType || "없음"}
도시: ${titlesByCategory.Stay?.join(" · ") || "없음"}
음식: ${titlesByCategory.Food?.join(" · ") || "없음"}
액티비티: ${titlesByCategory.Activity?.join(" · ") || "없음"}
인기 스팟: ${titlesByCategory.Spots?.join(" · ") || "없음"}

위 정보를 바탕으로 '시스템 규칙'에 맞춰서 요약 및 기대 문구를 작성해줘.`;

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
        max_tokens: 150,
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || buildFallbackTaglineAll(titlesByCategory);
  } catch (e) {
    console.error("[generateTagline] LLM error:", e.message);
    return buildFallbackTaglineAll(titlesByCategory);
  }
}
// --- 끝: Page 6에서 복사 ---

// --- 2. API 엔드포인트 정의 ---
router.post("/page7/details", async (req, res) => {
  try {
    // --- 2-1. 요청 본문(Body) 파싱 및 유효성 검사 ---
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "요청이 잘못되었습니다. 'ids' 배열이 필요합니다.",
      });
    }

    // --- 2-2. 데이터 조회 ---

    // [전제] getLikes()는 Page 06에서 저장된 모든 '좋아요' 항목을 반환
    const allLikes = getLikes();
    // Set을 사용하면 filter 내부의 .has() 연산이 O(1)로 매우 빨라집니다.
    const requestedIdSet = new Set(ids);
    // allLikes 배열에서 클라이언트가 요청한 ID(requestedIdSet)에 해당하는 항목만 필터링
    const foundItems = allLikes.filter(like => requestedIdSet.has(like.id));

    const sessionData = getData();
    const countryName = sessionData.countryName || "";
    const recommendationType = sessionData.recommendation?.typeSummary || ""; // Manager.cjs의 여행 타입

    // AI Hype Text 생성 로직
    const titlesByCategory = { Stay: [], Activity: [], Food: [], Spots: [] };
    for (const x of foundItems) {
      const title = titleOnlyFromUrl(x.imageUrl); // 복사해온 함수 사용
      if (!title) continue;
      const key = x.categoryKey;
      if (titlesByCategory[key]) {
        titlesByCategory[key].push(title);
      }
    }
    // LLM 호출 (await)
    const hypeText = await generateTaglineWithLLM({ titlesByCategory, countryName, recommendationType }); // 복사해온 함수 사용

    // --- 2-3. 응답 데이터 가공 (프론트엔드 형식에 맞게) ---
    // (Page 06의 데이터 가공 로직과 거의 동일)
    const result = foundItems.map(x => ({
      id: x.id,
      type: x.categoryName || x.categoryKey,
      name: fileNameFromUrl(x.imageUrl) || x.categoryName || x.categoryKey,
      description: `${x.countryCode || ""} / ${x.categoryKey || ""}`.trim(),
      imageUrl: x.imageUrl,
      createdAt: x.createdAt,
      link: x.link || x.sourceUrl || "#", // 상세 링크 추가
    }));

    // --- 2-4. 성공 응답 전송 ---
    return res.json({ success: true,
                      items: result, 
                      countryName: countryName,
                      hypeText: hypeText,
                    });

  } catch (e) {
    // --- 2-5. 서버 오류 처리 ---
    console.error("[/page7/details] error:", e);
    return res.status(500).json({
      success: false,
      error: "항목의 세부 정보를 불러올 수 없습니다.",
    });
  }
});

module.exports = router;