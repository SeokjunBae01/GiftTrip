import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../CSS/GiftTripPages04.css";
import "../CSS/Common.css";

export default function GiftTripPages04() {
  const navigate = useNavigate();
  const categories = ["숙박", "액티비티", "음식", "인기스팟"];
  const apiKeyMap = { 숙박: "Stay", 액티비티: "Activity", 음식: "Food", 인기스팟: "Spots" };

  // 완료 여부 저장
  const [completed, setCompleted] = useState(
    JSON.parse(localStorage.getItem("completedCategories")) || []
  );

  // 각 카테고리별 대표 이미지 저장
  const [thumbnails, setThumbnails] = useState({});

  // 각 카테고리 첫 번째 이미지 가져오기
  useEffect(() => {
    const fetchThumbnails = async () => {
      const newThumbs = {};
      for (const title of categories) {
        try {
          const key = apiKeyMap[title];
          const res = await fetch(`http://localhost:3000/api/pictures/${key}`); // TODO : 폰트번호 통일하기
          const data = await res.json();
          newThumbs[title] = data.pictures?.[0] || null;
        } catch (e) {
          console.error(`${title} 썸네일 불러오기 실패`, e);
        }
      }
      setThumbnails(newThumbs);
    };
    fetchThumbnails();
  }, []);

  // 완료 상태 업데이트 감지
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("completedCategories")) || [];
    setCompleted(stored);
  }, []);

  // 페이지 이동 시 완료 상태 저장
  const handleStart = (title, index) => {
    navigate("/page5", {
      state: { categoryIndex: index, categoryName: title },
    });
  };
  useEffect(() => {
    // 페이지 새로고침 시 완료 상태 초기화
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo Page04_Logo">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page04_Main">
        {categories.map((title, index) => (
          <section className="Page04_Card" key={index}>
            <div className="CommonFrame Page04_TitleFrame">{title}</div>

            {/* 대표 이미지 출력 */}
            <div className="Page04_Thumbnail">
              {thumbnails[title] ? (
                <img src={thumbnails[title]} alt={`${title} 썸네일`} />
              ) : (
                <div className="Page04_ThumbnailPlaceholder">이미지 없음</div>
              )}
            </div>

            {/* 완료 상태에 따라 버튼 변경 */}
            <button
              className={`CommonFrame Page04_ActionFrame ${
                completed.includes(title) ? "Completed" : ""
              }`}
              onClick={() => handleStart(title, index)}
              disabled={completed.includes(title)} // 완료 시 비활성화(선택)
            >
              {completed.includes(title) ? "완료" : "시작하기"}
            </button>
          </section>
        ))}
      </main>

      <footer className="Pages04_Footer">
        선호도를 입력하고 맞춤형 여행 초안을 받아보세요!
      </footer>
    </div>
  );
}
