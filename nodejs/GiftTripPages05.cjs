const express = require("express");
const router = express.Router();
const { getCategoryPictures } = require("./Manager.cjs");

// 05 페이지용 – 카테고리별 이미지 배열 반환 API
router.get("/pictures/:category", (req, res) => {
  const categoryName = req.params.category?.trim();
  const pictures = getCategoryPictures(categoryName);

  if (!pictures || pictures.length === 0) {
    return res.status(404).json({ error: "이미지를 찾을 수 없습니다." });
  }

  // ✅ 로컬 경로를 URL 경로로 변환
  const publicPaths = pictures.map((picPath) => {
    return "/Picture" + picPath.split("Picture")[1].replace(/\\/g, "/");
  });

  res.json({
    category: categoryName,
    pictures: publicPaths,
    count: publicPaths.length,
  });
});

module.exports = router;