// GiftTripPages05.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../JSX/Data.jsx";
import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css";

export default function GiftTripPages05() {
  const location = useLocation();
  const navigate = useNavigate();
  const { countryCode, loading } = useAppData(); // JP/KR 등 (컨텍스트)

  // Page04에서 넘어온 값
  const { categoryName, selectedCode } = location.state || {};

  // 한→영 매핑 (폴더/카테고리 키와 정확히 일치)
  const apiCategoryKey = useMemo(() => {
    const map = { 도시: "Stay", 액티비티: "Activity", 음식: "Food", 인기스팟: "Spots" };
    return map[categoryName] || categoryName || "";
  }, [categoryName]);

  // ✅ 국가코드 결정: state 우선, 없으면 context
  const effectiveCode = useMemo(
    () => selectedCode || countryCode,
    [selectedCode, countryCode]
  );

  const [pictures, setPictures] = useState([]); // 이미지 배열(URL)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // 이미지 제목 상태
  const [imageTitle, setImageTitle] = useState("");
  const [imageDesc, setImageDesc] = useState(""); // (필요시 확장 가능, 지금은 표시 안 함)

  // 리뷰 상태
  const [goodReviews, setGoodReviews] = useState([]);
  const [badReviews, setBadReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  /* --------------------- 🔒 프론트 리뷰 캐시 --------------------- */
  const REV_CACHE_KEY = "gt.reviewCache.v1";
  const REV_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일 (필요 없으면 0)

  const stripQuery = (url = "") => {
    try { return url.split("?")[0]; } catch { return url || ""; }
  };
  const cacheKeyOf = (code, cat, url) =>
    `${code || ""}|${cat || ""}|${stripQuery(url || "")}`;

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
    if (REV_TTL_MS > 0 && Date.now() - (v.ts || 0) > REV_TTL_MS) return null; // 만료
    return v;
  };
  const setCachedReview = (code, cat, url, payload) => {
    const map = readReviewCache();
    const key = cacheKeyOf(code, cat, url);
    map[key] = { ...payload, ts: Date.now() };
    writeReviewCache(map);
  };
  /* ------------------------------------------------------------ */

  // 필수 파라미터 없으면 되돌리기
  useEffect(() => {
    if (!loading && !categoryName) navigate("/page4");
  }, [loading, categoryName, navigate]);

  // 이미지 배열 불러오기 (UpLoadingImages 엔드포인트 사용)
  useEffect(() => {
    if (loading) return;
    if (!effectiveCode) {
      setErrorMsg("국가 코드를 불러오지 못했습니다.");
      return;
    }
    if (!apiCategoryKey) {
      setErrorMsg("카테고리 정보가 없습니다.");
      return;
    }

    const ctrl = new AbortController();

    (async () => {
      try {
        setErrorMsg("");
        const url = `http://localhost:3000/api/page4/pictures/${effectiveCode}/${apiCategoryKey}`;
        console.log("[Page05] fetch:", url);
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`이미지 API 실패: ${res.status}`);
        const data = await res.json(); // { success, country, category, pictures: [...] }
        const imgs = data.pictures || [];
        setPictures(imgs);
        setCurrentIndex(0);

        if (imgs.length === 0) {
          setErrorMsg("이미지가 없습니다.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[Page05] 이미지 로드 실패:", err);
          setErrorMsg("이미지를 불러오지 못했습니다.");
          setPictures([]);
        }
      }
    })();

    return () => ctrl.abort();
  }, [loading, effectiveCode, apiCategoryKey]); // ✅ countryCode → effectiveCode

  // ✅ 현재 이미지 파일명 → 제목 추출(확장자 제거, _,- 를 공백으로)
  useEffect(() => {
    if (!pictures.length) {
      setImageTitle("");
      setImageDesc("");
      return;
    }
    const url = pictures[currentIndex];
    if (!url) return;

    try {
      const decoded = decodeURIComponent(url);
      const base = (decoded.split("/").pop() || "").split("?")[0];
      const noExt = base.replace(/\.[^/.]+$/, ""); // 확장자 제거
      const [rawTitle, ...rest] = noExt.split("-");
      const title = (rawTitle || "").trim();
      const desc = (rest.join("-") || "").trim(); // '-'가 여러개여도 뒤쪽 전부 설명으로

      setImageTitle(title);   // ✅ 제목만 노출
      setImageDesc(desc);     // (지금은 미노출)
    } catch {
      setImageTitle("");
      setImageDesc("");
    }
  }, [pictures, currentIndex]);

  // 현재 이미지가 바뀔 때 리뷰 조회 (⚡ 캐시 선조회)
  useEffect(() => {
    if (!pictures.length) {
      setGoodReviews([]);
      setBadReviews([]);
      return;
    }
    const img = pictures[currentIndex];
    if (!img) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        setReviewLoading(true);

        // ① 프론트 캐시 HIT이면 즉시 사용하고 서버 호출 스킵
        const cached = getCachedReview(effectiveCode, apiCategoryKey, img);
        if (cached) {
          setGoodReviews(cached.positives || []);
          setBadReviews(cached.negatives || []);
          // 서버 포맷의 title이 있으면 오버레이도 동기화
          if (cached.title) setImageTitle((t) => cached.title || t);
          setReviewLoading(false);
          return;
        }

        // ② 캐시 MISS → 서버 호출
        const res = await fetch("http://localhost:3000/api/page5/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: img,
            countryCode: effectiveCode,   // ✅ 여기도 effectiveCode
            categoryKey: apiCategoryKey,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`리뷰 API 실패: ${res.status}`);
        const data = await res.json(); // { success, title, positives, negatives, ... }
        if (!data.success) throw new Error("리뷰 조회 실패");

        setGoodReviews(data.positives || []);
        setBadReviews(data.negatives || []);

        // ③ 성공 시 프론트 캐시에 저장
        setCachedReview(effectiveCode, apiCategoryKey, img, {
          title: data.title,
          positives: data.positives,
          negatives: data.negatives,
        });
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("[Page05] 리뷰 불러오기 실패:", e);
          setGoodReviews([]);
          setBadReviews([]);
        }
      } finally {
        setReviewLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [pictures, currentIndex, effectiveCode, apiCategoryKey]);

  // 완료 상태 저장
  const markCompleted = () => {
    const prev = JSON.parse(localStorage.getItem("completedCategories")) || [];
    const next = Array.from(new Set([...prev, categoryName].filter(Boolean)));
    localStorage.setItem("completedCategories", JSON.stringify(next));
  };

  // ✅ 진행 공통
  const advance = () => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // ✅ 카테고리 완료 저장
      markCompleted();

      // ✅ 5→4 복귀 플래그 설정 (초기화 방지용)
      sessionStorage.setItem("gt.fromPage5", "1");

      // ✅ Page04로 이동 (state에 from도 함께 전달)
      navigate("/page4", {
        state: { from: "page5", selectedCode: effectiveCode },
      });
    }
  };

  const sendVerdict = async (verdict) => {
    const payload = {
      countryCode: effectiveCode,        // ✅ 여기도 effectiveCode
      categoryKey: apiCategoryKey,       // "Stay" | "Activity" | ...
      imageUrl: pictures[currentIndex],
    };

    const res = await fetch(`http://localhost:3000/api/page5/${verdict}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`API 실패: ${res.status}`);
    return res.json();
  };

  const handleLike = async () => {
    try {
      await sendVerdict("like");
    } catch (e) {
      console.error(e);
    } finally {
      advance(); // 다음 이미지로
    }
  };

  const handleDislike = async () => {
    try {
      await sendVerdict("dislike");
    } catch (e) {
      console.error(e);
    } finally {
      advance();
    }
  };

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

          <div className="Page05_Action">
            <button
              className="CommonFrame Page05_BtnLike"
              onClick={handleLike}
              disabled={!pictures.length}
            >
              좋아요
            </button>
            <button
              className="CommonFrame Page05_BtnDisLike"
              onClick={handleDislike}
              disabled={!pictures.length}
            >
              싫어요
            </button>
          </div>
        </section>

        <aside className="Page05_Review">
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
        </aside>
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
