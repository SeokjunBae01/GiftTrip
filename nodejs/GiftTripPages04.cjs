const express = require("express");
const router = express.Router();
const { categories, getCategoryName } = require("./Manager.cjs");

// 전체 카테고리 목록 반환
router.get("/categories", (req, res) => {
  return res.json({
    success: true,
    categories,
  });
});

// 시작하기 클릭 시: 카테고리 인덱스를 이름으로 변환
router.get("/start/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const categoryName = getCategoryName(index);

  if (!categoryName) {
    return res.status(400).json({
      success: false,
      error: "잘못된 인덱스입니다.",
    });
  }

  return res.json({
    success: true,
    categoryIndex: index,
    categoryName,
    message: `${categoryName} 여행을 시작합니다!`,
  });
});

module.exports = router;