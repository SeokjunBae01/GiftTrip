// GiftTripPages05.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../JSX/Data.jsx";
import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css";

export default function GiftTripPages05() {
  const location = useLocation();
  const navigate = useNavigate();
  const { countryCode, loading } = useAppData(); // JP/KR 등

  // Page04에서 넘어온 값 (한글 이름)
  const { categoryName } = location.state || {};

  // 한→영 매핑 (폴더/카테고리 키와 정확히 일치해야 함)
  const apiCategoryKey = useMemo(() => {
    const map = { 숙박: "Stay", 액티비티: "Activity", 음식: "Food", 인기스팟: "Spots" };
    return map[categoryName] || categoryName || "";
  }, [categoryName]);

  const [pictures, setPictures] = useState([]); // 이미지 배열(URL)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // 이미지 제목 상태
  const [imageTitle, setImageTitle] = useState("");

  // 리뷰 상태
  const [goodReviews, setGoodReviews] = useState([]);
  const [badReviews, setBadReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 필수 파라미터 없으면 되돌리기
  useEffect(() => {
    if (!loading && !categoryName) navigate("/page4");
  }, [loading, categoryName, navigate]);

  // 이미지 배열 불러오기 (UpLoadingImages 엔드포인트 사용)
  useEffect(() => {
    if (loading) return;
    if (!countryCode) {
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
        const url = `http://localhost:3000/api/page4/pictures/${countryCode}/${apiCategoryKey}`;
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
  }, [loading, countryCode, apiCategoryKey]);

  // ✅ 현재 이미지 파일명 → 제목 추출(확장자 제거, _,- 를 공백으로)
  useEffect(() => {
    if (!pictures.length) {
      setImageTitle("");
      return;
    }
    const url = pictures[currentIndex];
    if (!url) return;

    try {
      const decoded = decodeURIComponent(url);
      const base = (decoded.split("/").pop() || "").split("?")[0];
      const noExt = base.replace(/\.[^/.]+$/, "");
      const pretty = noExt.replace(/[_-]+/g, " ").trim();
      setImageTitle(pretty);
    } catch {
      setImageTitle("");
    }
  }, [pictures, currentIndex]);

  // 현재 이미지가 바뀔 때 리뷰 조회
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
        const res = await fetch("http://localhost:3000/api/page5/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: img,
            countryCode,
            categoryKey: apiCategoryKey,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`리뷰 API 실패: ${res.status}`);
        const data = await res.json(); // { success, title, positives, negatives, ... }
        if (!data.success) throw new Error("리뷰 조회 실패");
        setGoodReviews(data.positives || []);
        setBadReviews(data.negatives || []);
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
  }, [pictures, currentIndex, countryCode, apiCategoryKey]);

  // 완료 상태 저장
  const markCompleted = () => {
    const prev = JSON.parse(localStorage.getItem("completedCategories")) || [];
    const next = Array.from(new Set([...prev, categoryName].filter(Boolean)));
    localStorage.setItem("completedCategories", JSON.stringify(next));
  };

  // 진행 공통
  const advance = () => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 마지막 이미지까지 판정했으면 완료 처리 후 Page04로 복귀
      markCompleted();
      navigate("/page4");
    }
  };

  const sendVerdict = async (verdict) => {
    const payload = {
      countryCode, // "JP"
      categoryKey: apiCategoryKey, // "Stay" | "Activity" | ...
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
