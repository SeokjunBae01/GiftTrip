// nodejs/GiftTripPages05.cjs
require("dotenv").config();

const express = require("express");
const router  = express.Router();
const { addLike, addDislike, clearLikes } = require("./LikedStore.cjs");
const {
  getReviewsGPTCached,
  extractTitleFromUrl,
  normalizeTitle,
  normalizeCategoryKey,
  fallbackReviews,
  clearReviewCache,
  cacheStats,
} = require("./ReviewEngine.cjs");

/* ===================== 좋아요 / 싫어요 / 리셋 ===================== */

router.post("/page5/like", (req, res) => {
  try {
    let { countryCode, categoryKey, imageUrl } = req.body || {};
    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    categoryKey = normalizeCategoryKey(categoryKey);
    const allowed = new Set(["Stay", "Activity", "Food", "Spots"]);
    if (!allowed.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    const id = addLike({ countryCode, categoryKey, imageUrl });
    if (!id) return res.status(500).json({ success: false, error: "저장 실패" });
    return res.json({ success: true, id });
  } catch (e) {
    console.error("[/page5/like] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

router.post("/page5/dislike", (req, res) => {
  try {
    let { countryCode, categoryKey, imageUrl } = req.body || {};
    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    categoryKey = normalizeCategoryKey(categoryKey);
    const allowed = new Set(["Stay", "Activity", "Food", "Spots"]);
    if (!allowed.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    addDislike({ countryCode, categoryKey, imageUrl });
    return res.json({ success: true });
  } catch (e) {
    console.error("[/page5/dislike] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

router.post("/page5/likes/reset", (req, res) => {
  try {
    clearLikes();
    return res.json({ success: true, cleared: true });
  } catch (e) {
    console.error("[/page5/likes/reset] error:", e);
    return res.status(500).json({ success: false, error: "초기화 실패" });
  }
});

/* ===================== 리뷰(GPT + 캐시) ===================== */

router.post("/page5/reviews", async (req, res) => {
  try {
    const { imageUrl, countryCode } = req.body || {};
    let { categoryKey } = req.body || {};
    const hasUrl = !!imageUrl;

    categoryKey = normalizeCategoryKey(categoryKey);
    const raw   = extractTitleFromUrl(imageUrl || "");
    const title = normalizeTitle(raw);

    console.log("[/page5/reviews] IN:", { hasUrl, countryCode, categoryKey, title });

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "imageUrl는 필수입니다." });
    }

    const allowed = new Set(["Stay", "Activity", "Food", "Spots"]);
    if (categoryKey && !allowed.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    // 🔥 캐시된 GPT 결과 사용 (미스 시 GPT 호출 후 저장)
    const result = await getReviewsGPTCached({
      title,
      imageUrl,
      countryCode,
      categoryKey,
    });

    // 2문장 보장
    const to2 = (arr, fb) => (Array.isArray(arr) && arr.length === 2 ? arr : fb);
    const safe = fallbackReviews(result.title);

    const out = {
      title: result.title,
      positives: to2(result.positives, safe.positives),
      negatives: to2(result.negatives, safe.negatives),
      provider: result.provider || "gpt",
      lang: "ko",
    };

    console.log("[/page5/reviews] OUT:", {
      title: out.title,
      provider: out.provider,
      pos: out.positives.length,
      neg: out.negatives.length,
    });

    return res.json({ success: true, ...out });
  } catch (e) {
    console.error("[/page5/reviews] error:", e);
    return res.status(500).json({ success: false, error: "리뷰 조회 실패" });
  }
});

/* ===================== 캐시 관리 유틸(선택) ===================== */

// 캐시 비우기
router.post("/page5/reviews/cache/clear", async (req, res) => {
  try {
    const result = await clearReviewCache();
    return res.json({ success: true, ...result });
  } catch (e) {
    console.error("[/page5/reviews/cache/clear] error:", e);
    return res.status(500).json({ success: false, error: "캐시 삭제 실패" });
  }
});

// 캐시 상태 확인
router.get("/page5/reviews/cache/stats", async (req, res) => {
  try {
    const s = await cacheStats();
    return res.json({ success: true, ...s });
  } catch (e) {
    console.error("[/page5/reviews/cache/stats] error:", e);
    return res.status(500).json({ success: false, error: "캐시 상태 조회 실패" });
  }
});

module.exports = router;
