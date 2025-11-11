// nodejs/GiftTripPages05.cjs
require("dotenv").config();

const express = require("express");
const router  = express.Router();
const { addLike, addDislike, clearLikes, dumpLikes } = require("./LikedStore.cjs");
const {
  getReviewsGPTCached,
  normalizeTitle,
  normalizeCategoryKey,
  fallbackReviews,
  clearReviewCache,
  cacheStats,
} = require("./ReviewEngine.cjs");

// 소문자 허용 키(검증용)
const ALLOWED_LOWER = new Set(["stay", "activity", "food", "spots"]);

/* --------------------- 파일명/제목 유틸 --------------------- */
function fileNameFromUrl(url) {
  if (!url) return "";
  try {
    const last = url.split("/").pop().split("?")[0];
    const base = last.includes(".") ? last.slice(0, last.lastIndexOf(".")) : last;
    return decodeURIComponent(base).trim();
  } catch {
    return "";
  }
}

// JP / [JP] / (JP) / JP- / JP_ / JP· / "JP " 등 제거
function stripCountryPrefix(text = "") {
  return text
    .replace(/^\s*[\[\(]\s*[A-Z]{2,3}\s*[\]\)]\s*[-_.]?\s*/i, "")
    .replace(/^\s*[A-Z]{2,3}\s*(?:[-_.·]|\s)\s*/i, "")
    .trim();
}

// "제목-내용.확장자" 케이스 우선, 없으면 첫 공백 기준으로 제목만 추출
function titleOnlyFromUrl(url = "") {
  const base = fileNameFromUrl(url);
  if (!base) return "";
  const cleaned = stripCountryPrefix(base);

  const dashIdx = cleaned.search(/[-–—]/);
  if (dashIdx > -1) return cleaned.slice(0, dashIdx).trim();

  const spaceIdx = cleaned.indexOf(" ");
  if (spaceIdx > -1) return cleaned.slice(0, spaceIdx).trim();

  return cleaned.trim();
}

/* ===================== 좋아요 / 싫어요 ===================== */

router.post("/page5/like", (req, res) => {
  try {
    let { countryCode, categoryKey, imageUrl } = req.body || {};
    console.log("[/page5/like] IN:", req.body);

    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    categoryKey = normalizeCategoryKey(categoryKey);

    const allowed = new Set(["Stay", "Activity", "Food", "Spots"]);
    if (!allowed.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    const cc = (countryCode || "JP").toUpperCase();
    const id = addLike({ countryCode: cc, categoryKey, imageUrl });
    if (!id) return res.status(500).json({ success: false, error: "저장 실패" });

    console.log("[/page5/like] OK id:", id, "cc:", cc, "cat:", categoryKey);
    return res.json({ success: true, id });
  } catch (e) {
    console.error("[/page5/like] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

router.post("/page5/dislike", (req, res) => {
  try {
    let { countryCode, categoryKey, imageUrl } = req.body || {};
    console.log("[/page5/dislike] IN:", req.body);

    if (!categoryKey || !imageUrl) {
      return res.status(400).json({ success: false, error: "categoryKey, imageUrl는 필수입니다." });
    }
    categoryKey = normalizeCategoryKey(categoryKey);

    const allowed = new Set(["Stay", "Activity", "Food", "Spots"]);
    if (!allowed.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    const cc = (countryCode || "JP").toUpperCase();
    addDislike({ countryCode: cc, categoryKey, imageUrl });
    return res.json({ success: true });
  } catch (e) {
    console.error("[/page5/dislike] error:", e);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});

router.post("/page5/likes/reset", (req, res) => {
  try {
    console.log("[/page5/likes/reset] called");
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
    let   { categoryKey } = req.body || {};
    const hasUrl = !!imageUrl;

    // 카테고리 키 소문자 정규화
    categoryKey = (normalizeCategoryKey(categoryKey) || "").toLowerCase();

    // 제목은 이미지 URL에서 추출 → 제목만 (대시 우선, 없으면 첫 공백)
    const titleOnly = titleOnlyFromUrl(imageUrl || "");
    // 필요하면 추가 정규화
    const title = normalizeTitle(titleOnly);

    console.log("[/page5/reviews] IN:", { hasUrl, countryCode, categoryKey, title });

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "imageUrl는 필수입니다." });
    }
    if (categoryKey && !ALLOWED_LOWER.has(categoryKey)) {
      return res.status(400).json({ success: false, error: `허용되지 않은 categoryKey 입니다. (${categoryKey})` });
    }

    const result = await getReviewsGPTCached({
      title,       // ↩️ 제목만 전달
      imageUrl,
      countryCode,
      categoryKey, // 'activity' 등 소문자
    });

    const to2  = (arr, fb) => (Array.isArray(arr) && arr.length === 2 ? arr : fb);
    const safe = fallbackReviews(result.title);

    const out = {
      title: result.title, // 서버도 “제목만”
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

/* ===================== 캐시 관리 유틸 ===================== */
router.post("/page5/reviews/cache/clear", async (req, res) => {
  try {
    const result = await clearReviewCache();
    return res.json({ success: true, ...result });
  } catch (e) {
    console.error("[/page5/reviews/cache/clear] error:", e);
    return res.status(500).json({ success: false, error: "캐시 삭제 실패" });
  }
});

router.get("/page5/reviews/cache/stats", async (req, res) => {
  try {
    const s = await cacheStats();
    return res.json({ success: true, ...s });
  } catch (e) {
    console.error("[/page5/reviews/cache/stats] error:", e);
    return res.status(500).json({ success: false, error: "캐시 상태 조회 실패" });
  }
});

// ===== 디버그: 현재 좋아요 전체 덤프 =====
router.get("/page6/debug/likes", (req, res) => {
  const all = dumpLikes();
  return res.json({ success: true, total: all.length, items: all });
});

module.exports = router;
