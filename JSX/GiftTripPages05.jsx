import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css";

export default function GiftTripPages05() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryName } = location.state || {};

  const apiCategoryKey = useMemo(() => {
    const map = { "숙박": "Stay", "액티비티": "Activity", "음식": "Food", "인기스팟": "Spots" };
    return map[categoryName] || categoryName;
  }, [categoryName]);

  const [pictures, setPictures] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  //Test
  //useEffect(() => {
  //  // 실제 서버 fetch 대신 테스트용 20개 생성
  //  const testPictures = Array.from({ length: 20 }, (_, i) => `/test${i + 1}.png`);
  //  setPictures(testPictures);
  //  setCurrentIndex(0);
  //}, []);
  // 서버에서 이미지 배열 불러오기
  useEffect(() => {
    if (!apiCategoryKey) return;
    (async () => {
      const res = await fetch(`http://localhost:3000/api/pictures/${apiCategoryKey}`);
      const data = await res.json();
      setPictures(data.pictures || []);
      setCurrentIndex(0);
    })();
  }, [apiCategoryKey]);

  // 좋아요 클릭 시 다음 사진 또는 이전 페이지로
  const handleLike = () => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 완료 상태 저장
      localStorage.setItem(
        "completedCategories",
        JSON.stringify([
          ...(JSON.parse(localStorage.getItem("completedCategories")) || []),
          categoryName,
        ])
      );
      navigate("/");
    }
  };
  
  const handleDislike = () => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 완료 상태 저장
      localStorage.setItem(
        "completedCategories",
        JSON.stringify([
          ...(JSON.parse(localStorage.getItem("completedCategories")) || []),
          categoryName,
        ])
      );
      navigate("/");
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
          {pictures.length > 0 ? (
            <img
              src={pictures[currentIndex]}
              alt={`${categoryName} 이미지`}
              className="Page05_MainImage"
            />
          ) : (
            <p>이미지를 불러오는 중...</p>
          )}
          <div className="Page05_Action">
            <button
              className="CommonFrame Page05_BtnLike"
              onClick={handleLike}
            >
              좋아요
            </button>
            <button
              className="CommonFrame Page05_BtnDisLike"
              onClick={handleDislike}
            >
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
