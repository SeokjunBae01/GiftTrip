// GiftTripPages04.cjs
const express = require("express");
const router = express.Router();
const { categories, getCategoryName } = require("./Manager.cjs");

// 전체 카테고리 목록
router.get("/page4/categories", (req, res) => {
  return res.json({ success: true, categories });
});

// 시작하기: 인덱스 → 이름
router.get("/start/:index", (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index < 0 || index >= categories.length) {
    return res.status(400).json({ success: false, error: "잘못된 인덱스입니다." });
  }
  const cat = getCategoryName(index); // { key, name }
  return res.json({
    success: true,
    categoryIndex: index,
    categoryName: cat?.name ?? String(cat),
    message: `${cat?.name ?? cat} 여행을 시작합니다!`,
  });
});

// ⚠️ 여기엔 더 이상 /page4/pictures 라우트가 없습니다 (UpLoadingImages가 담당)

module.exports = router;