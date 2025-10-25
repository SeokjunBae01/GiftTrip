import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAppData } from "../JSX/Data.jsx";  // ✅ 전역(countryCode) 사용
import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css";

export default function GiftTripPages05() {
  const location = useLocation();
  const navigate = useNavigate();
  const { countryCode, loading } = useAppData(); // ✅ JP/KR 등

  // Page04에서 넘긴 값(영/한 혼용 대비)
  const { categoryName } = location.state || {};

  // 한→영 매핑 (없으면 그대로 사용)
  const apiCategoryKey = useMemo(() => {
    const map = { "숙박": "Stay", "액티비티": "Activity", "음식": "Food", "인기스팟": "Spots" };
    return map[categoryName] || categoryName || ""; // categoryName 없을 수도 있으니 안전하게
  }, [categoryName]);

  const [pictures, setPictures] = useState([]);  // 이미지 배열
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // 서버에서 이미지 배열 불러오기
  useEffect(() => {
    // 필수 값 검증
    if (loading) return;
    if (!countryCode) return setErrorMsg("국가 코드를 불러오지 못했습니다.");
    if (!apiCategoryKey) return setErrorMsg("카테고리 정보가 없습니다.");

    const ctrl = new AbortController();

    (async () => {
      try {
        setErrorMsg("");
        // ✅ UpLoadingImages API에 맞춰 country 포함
        const url = `http://localhost:3000/api/${countryCode}/${apiCategoryKey}`;
        console.log("[Page05] fetch:", url);
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`이미지 API 실패: ${res.status}`);
        const data = await res.json();        // { success, country, category, images: [...] }
        const imgs = data.images || [];
        setPictures(imgs);
        setCurrentIndex(0);
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

  // 완료 상태 저장 helper (중복 제거)
  const markCompleted = () => {
    const prev = JSON.parse(localStorage.getItem("completedCategories")) || [];
    const next = Array.from(new Set([...prev, categoryName].filter(Boolean)));
    localStorage.setItem("completedCategories", JSON.stringify(next));
  };

  // 좋아요 / 싫어요 공통 진행
  const advance = () => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      markCompleted();
      navigate("/"); // 마지막이면 홈으로
    }
  };

  const handleLike = () => advance();
  const handleDislike = () => advance();

  // 필수 파라미터 없으면 돌아가기
  useEffect(() => {
    if (!loading && !categoryName) {
      navigate("/"); // state 없이 들어온 경우 홈
    }
  }, [loading, categoryName, navigate]);

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
            <img
              src={pictures[currentIndex]}
              alt={`${categoryName || apiCategoryKey} 이미지`}
              className="Page05_MainImage"
              onError={(e) => {
                // 현재 이미지 깨지면 다음으로 넘김
                console.warn("[Page05] 이미지 에러, 다음으로 진행:", pictures[currentIndex]);
                e.currentTarget.style.display = "none";
                advance();
              }}
            />
          ) : (
            <p>이미지가 없습니다.</p>
          )}

          <div className="Page05_Action">
            <button className="CommonFrame Page05_BtnLike" onClick={handleLike} disabled={!pictures.length}>
              좋아요
            </button>
            <button className="CommonFrame Page05_BtnDisLike" onClick={handleDislike} disabled={!pictures.length}>
              싫어요
            </button>
          </div>
        </section>

        <aside className="Page05_Review">
          <div className="Page05_ReviewBox">
            <span className="Page05_ReviewBoxTitle">good reviews</span>
            <p className="Page05_ReviewDesc">여기에 긍정 리뷰가 들어옵니다 (준비중)</p>
          </div>
          <div className="Page05_ReviewBox">
            <span className="Page05_ReviewBoxTitle">bad reviews</span>
            <p className="Page05_ReviewDesc">여기에 부정 리뷰가 들어옵니다 (준비중)</p>
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