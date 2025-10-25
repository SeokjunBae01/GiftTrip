// routes/api.js (현재 파일)
const express = require("express");
const router = express.Router();
const {
  categories,
  getCategoryName,
  getCategoryPictures,     // ✅ 추가
} = require("./Manager.cjs");

// 전체 카테고리 목록
router.get("/categories", (req, res) => {
  return res.json({ success: true, categories });
});

// 시작하기: 인덱스를 이름으로 변환
router.get("/start/:index", (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index < 0 || index >= categories.length) {
    return res.status(400).json({ success: false, error: "잘못된 인덱스입니다." });
  }
  const categoryName = getCategoryName(index);
  return res.json({
    success: true,
    categoryIndex: index,
    categoryName,
    message: `${categoryName} 여행을 시작합니다!`,
  });
});

// ✅ 카테고리별 이미지 목록 제공
router.get("/pictures/:CountryCode/:category", (req, res) => {
  const { countryCode, category } = req.params;
  try {
    // countryCode는 현재 세션값 검증용으로만 사용(필요시 검증 로직 추가)
    const pictures = getCategoryPictures(category) || [];
    return res.json({ success: true, countryCode, category, pictures });
  } catch (e) {
    return res.status(500).json({ success: false, error: "이미지를 가져올 수 없습니다." });
  }
});

module.exports = router;