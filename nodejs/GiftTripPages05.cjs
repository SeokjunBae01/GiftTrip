// GiftTripPages05.cjs
const express = require("express");
const router = express.Router();
const { addLike, addDislike, clearLikes } = require("./LikedStore.cjs");

// 👍 좋아요 저장
router.post("/page5/like", (req, res) => {
  try {
    const { countryCode, categoryKey, imageUrl } = req.body || {};
    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    const id = addLike({ countryCode, categoryKey, imageUrl });
    if (!id) return res.status(500).json({ success: false, error: "저장 실패" });
    return res.json({ success: true, id });
  } catch (e) {
    console.error("[/page5/like] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

// 👎 싫어요 (원하면 기록/무시)
router.post("/page5/dislike", (req, res) => {
  try {
    const { countryCode, categoryKey, imageUrl } = req.body || {};
    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    addDislike({ countryCode, categoryKey, imageUrl });
    return res.json({ success: true });
  } catch (e) {
    console.error("[/page5/dislike] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

// 🧹 좋아요 전체 초기화 (디버깅용) — 프론트에서 호출 중인 경로와 동일
router.post("/page5/likes/reset", (req, res) => {
  try {
    clearLikes();
    return res.json({ success: true, cleared: true });
  } catch (e) {
    console.error("[/page5/likes/reset] error:", e);
    return res.status(500).json({ success: false, error: "초기화 실패" });
  }
});

module.exports = router;