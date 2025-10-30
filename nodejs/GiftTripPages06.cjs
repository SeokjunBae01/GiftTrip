// GiftTripPages06.cjs
const express = require("express");
const router = express.Router();
const { getLikes } = require("./LikedStore.cjs");

// 파일명(확장자 제거) → 카드 타이틀
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
      type: x.categoryName || x.categoryKey,            // "숙박"/"액티비티"/"음식"/"인기 스팟"
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

module.exports = router;