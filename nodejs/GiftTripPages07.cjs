// GiftTripPages07.cjs (또는 기존 라우터 파일에 추가)

const express = require("express");
const router = express.Router();
const { getLikes } = require("./LikedStore.cjs");
const { getData } = require("./Manager.cjs");

/**
 * Page 06에서 사용했던 헬퍼 함수
 * 이미지 URL에서 파일 이름을 추출하여 'name'으로 사용합니다.
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

// --- 2. API 엔드포인트 정의 ---
router.post("/page7/details", (req, res) => {
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

    const sessionData = getData();
    const countryName = sessionData.countryName;

    // --- 2-4. 성공 응답 전송 ---
    return res.json({ success: true, items: result, countryName: countryName });

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
