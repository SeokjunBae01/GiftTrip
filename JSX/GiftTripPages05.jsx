// GiftTripPages05.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../JSX/Data.jsx";
import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css";

export default function GiftTripPages05() {
  const location = useLocation();
  const navigate = useNavigate();
  const { countryCode, loading } = useAppData();

  const { categoryName, selectedCode } = location.state || {};
  const apiCategoryKey = useMemo(() => {
    const map = { 도시: "Stay", 액티비티: "Activity", 음식: "Food", 인기스팟: "Spots", "인기 스팟": "Spots" };
    return map[categoryName] || categoryName || "";
  }, [categoryName]);
  const effectiveCode = useMemo(() => selectedCode || countryCode, [selectedCode, countryCode]);

  const [pictures, setPictures] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [goodReviews, setGoodReviews] = useState([]);
  const [badReviews, setBadReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ---------------- 캐시 관리 ----------------
  const REV_CACHE_KEY = "gt.reviewCache.v1";
  const REV_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const stripQuery = (url = "") => (url.split("?")[0] || "");
  const cacheKeyOf = (code, cat, url) => `${code || ""}|${cat || ""}|${stripQuery(url || "")}`;
  const readReviewCache = () => {
    try { return JSON.parse(localStorage.getItem(REV_CACHE_KEY)) || {}; }
    catch { return {}; }
  };
  const writeReviewCache = (obj) => {
    try { localStorage.setItem(REV_CACHE_KEY, JSON.stringify(obj)); } catch {}
  };
  const getCachedReview = (code, cat, url) => {
    const map = readReviewCache();
    const key = cacheKeyOf(code, cat, url);
    const v = map[key];
    if (!v) return null;
    if (REV_TTL_MS > 0 && Date.now() - (v.ts || 0) > REV_TTL_MS) return null;
    return v;
  };
  const setCachedReview = (code, cat, url, positives, negatives) => {
    const map = readReviewCache();
    const key = cacheKeyOf(code, cat, url);
    map[key] = { positives, negatives, ts: Date.now() };
    writeReviewCache(map);
  };

  // ---------------- 파일명 파싱 ----------------
  const stripCountryPrefix = (s = "") =>
    s.replace(/^\s*[\[\(]?[A-Z]{2,3}[\]\)]?\s*[-_.·]?\s*/i, "").trim();

  const titleFromUrl = (url = "") => {
    try {
      const fileName = url.split("/").pop().split("?")[0];
      const decoded = decodeURIComponent(fileName);
      const noExt = decoded.replace(/\.[^/.]+$/, "");
      const cleaned = stripCountryPrefix(noExt);
      const idx = cleaned.search(/[-–—]/);
      return (idx === -1 ? cleaned : cleaned.slice(0, idx)).trim();
    } catch {
      return "";
    }
  };

  // ---------------- 기본 로직 ----------------
  useEffect(() => {
    if (!loading && !categoryName) navigate("/page4");
  }, [loading, categoryName, navigate]);

  useEffect(() => {
    if (loading) return;
    if (!effectiveCode || !apiCategoryKey) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/page4/pictures/${effectiveCode}/${apiCategoryKey}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("이미지 로드 실패");
        const data = await res.json();
        const imgs = data.pictures || [];
        setPictures(imgs);
        setCurrentIndex(0);
        if (!imgs.length) setErrorMsg("이미지가 없습니다.");
      } catch (e) {
        if (e.name !== "AbortError") {
          setErrorMsg("이미지를 불러오지 못했습니다.");
          console.error(e);
        }
      }
    })();
    return () => ctrl.abort();
  }, [loading, effectiveCode, apiCategoryKey]);

  // ---------------- 제목 갱신 ----------------
  useEffect(() => {
    if (!pictures.length) return;
    const current = pictures[currentIndex];
    setImageTitle(titleFromUrl(current));
  }, [pictures, currentIndex]);

  // ---------------- 리뷰 로드 ----------------
  useEffect(() => {
    if (!pictures.length) return;
    const img = pictures[currentIndex];
    if (!img) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setReviewLoading(true);
        const cached = getCachedReview(effectiveCode, apiCategoryKey, img);
        if (cached) {
          setGoodReviews(cached.positives || []);
          setBadReviews(cached.negatives || []);
          setReviewLoading(false);
          return;
        }

        const res = await fetch("http://localhost:3000/api/page5/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: img, countryCode: effectiveCode, categoryKey: apiCategoryKey }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("리뷰 API 실패");
        const data = await res.json();
        if (!data.success) throw new Error("리뷰 실패");

        setGoodReviews(data.positives || []);
        setBadReviews(data.negatives || []);
        setCachedReview(effectiveCode, apiCategoryKey, img, data.positives, data.negatives);
      } catch (e) {
        if (e.name !== "AbortError") {
          setGoodReviews([]);
          setBadReviews([]);
          console.error(e);
        }
      } finally {
        setReviewLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [pictures, currentIndex, effectiveCode, apiCategoryKey]);

  // ---------------- 버튼 동작 ----------------
  const markCompleted = () => {
    const prev = JSON.parse(localStorage.getItem("completedCategories")) || [];
    const next = Array.from(new Set([...prev, categoryName].filter(Boolean)));
    localStorage.setItem("completedCategories", JSON.stringify(next));
  };
  const advance = () => {
    if (currentIndex < pictures.length - 1) setCurrentIndex((p) => p + 1);
    else {
      markCompleted();
      sessionStorage.setItem("gt.fromPage5", "1");
      navigate("/page4", { state: { from: "page5", selectedCode: effectiveCode } });
    }
  };
  const sendVerdict = async (verdict) => {
    const res = await fetch(`http://localhost:3000/api/page5/${verdict}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        countryCode: effectiveCode,
        categoryKey: apiCategoryKey,
        imageUrl: pictures[currentIndex],
      }),
    });
    if (!res.ok) throw new Error("API 실패");
    return res.json();
  };
  const handleLike = async () => {
    try { await sendVerdict("like"); } catch (e) { console.error(e); } finally { advance(); }
  };
  const handleDislike = async () => {
    try { await sendVerdict("dislike"); } catch (e) { console.error(e); } finally { advance(); }
  };

  // ---------------- 렌더 ----------------
  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page05_Container">
        <section className="Page05_Main">
          {loading ? (
            <p>불러오는 중...</p>
          ) : errorMsg ? (
            <p>{errorMsg}</p>
          ) : pictures.length > 0 ? (
            <div className="Page05_ImageCard">
              {/* ✅ 제목 오버레이 */}
              {imageTitle && <div className="Page05_ImageTitle">{imageTitle}</div>}

              <img
                src={pictures[currentIndex]}
                alt={`${categoryName || apiCategoryKey} 이미지`}
                className="Page05_MainImage"
                onError={(e) => {
                  // 깨진 이미지면 다음으로 자동 진행
                  console.warn("[Page05] 이미지 에러, 다음으로 진행:", pictures[currentIndex]);
                  e.currentTarget.style.display = "none";
                  advance();
                }}
              />
            </div>
          ) : (
            <p>이미지가 없습니다.</p>
          )}
          </section>

          <div className="Page05_ActionReviewWrapper">
          {/* 1. 좋아요 + 굿 리뷰 */}
          <div className="Page05_ActionColumn">
            <button
              className="CommonFrame Page05_BtnLike"
              onClick={handleLike}
              disabled={!pictures.length}
            >
              좋아요
            </button>
            <div className="Page05_ReviewBox">
              <span className="Page05_ReviewBoxTitle">good reviews</span>
              {reviewLoading ? (
                <p className="Page05_ReviewDesc">불러오는 중...</p>
              ) : goodReviews.length ? (
                <ul className="Page05_ReviewList">
                  {goodReviews.map((t, i) => (
                    <li key={`g${i}`}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="Page05_ReviewDesc">긍정 리뷰가 아직 없어요.</p>
              )}
            </div>
          </div>

          {/* 2. 싫어요 + 배드 리뷰 */}
          <div className="Page05_ActionColumn">
            <button
              className="CommonFrame Page05_BtnDisLike"
              onClick={handleDislike}
              disabled={!pictures.length}
            t >
              싫어요
            </button>
            <div className="Page05_ReviewBox">
              <span className="Page05_ReviewBoxTitle">bad reviews</span>
              {reviewLoading ? (
                <p className="Page05_ReviewDesc">불러오는 중...</p>
              ) : badReviews.length ? (
                <ul className="Page05_ReviewList">
                  {badReviews.map((t, i) => (
                    <li key={`b${i}`}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="Page05_ReviewDesc">부정 리뷰가 아직 없어요.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="Page05_Footer">
        <div className="Page05_Process" aria-label="progress">
          {pictures.map((_, i) => (
            <div
              key={i}
              className={`Page05_Dot ${i <= currentIndex ? "Page05_DotDone" : ""}`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
