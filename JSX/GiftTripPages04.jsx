import { useNavigate, useLocation } from "react-router-dom"; // 새로고침 이슈: useLocation 추가
import { useEffect, useState } from "react";
import { useAppData } from "../JSX/Data.jsx";              // ✅ Context에서 전역 데이터 사용
import "../CSS/GiftTripPages04.css";
import "../CSS/Common.css";

export default function GiftTripPages04() {
  const navigate = useNavigate();
  const location = useLocation(); //새로고침 이슈: location 객체 가져오기

  // 새로고침 이슈: Page00에서 state로 넘겨준 코드를 이 변수에 저장
  const codeFromState = location.state?.selectedCode;

  // ─────────────────────────────────────────
  // API 받아온거 변수에 각각 저장하기 (Context 사용)
  const { loading, countryCode, categories } = useAppData(); // ← { code, categories }
  const [thumbnails, setThumbnails] = useState({});          // { [title]: url }
  const [completed, setCompleted] = useState([]);            // ["Stay", ...]

  // ─────────────────────────────────────────
  // 각 카테고리 첫 번째 이미지 가져오기
  
  useEffect(() => {
    // 새로고침 이슈: state로 받은 값(codeFromState)이 있으면 그것을 최우선으로 사용,
    //              없으면(예: 뒤로 가기) Context의 값(countryCode)을 사용
    const effectiveCode = codeFromState || countryCode;
    // 새로고침 이슈: 로딩 중이거나, 최종 코드(effectiveCode)가 없으면 중단
    if (loading) return;                   // 아직 로딩 중이면 대기
    if (!effectiveCode || categories.length === 0) return;

    const fetchThumbnails = async () => {
      const newThumbs = {};
      // 새로고침 이슈: API 호출 시 effectiveCode 사용
      console.log("받은 코드 : ", effectiveCode);

      // 2️⃣ 받아온 countryCode로 fetch
      for (const { key, name } of categories) {    // ✅ categories.type ❌  그냥 배열
        try {
          // 새로고침 이슈: API 호출 시 effectiveCode 사용
          const url = `http://localhost:3000/api/${effectiveCode}/${key}`;
          console.log("시도 중 페이지 : ", url);
          const res = await fetch(url);
          const data = await res.json();   // { success, country, category, images: [...] }
          newThumbs[key] = data.images?.[0] || null;  // ✅ 첫 번째 이미지
        } catch (e) {
          console.error(`${name} 썸네일 불러오기 실패`, e);
          newThumbs[key] = null;
        }
      }

      setThumbnails(newThumbs);
    };

    fetchThumbnails();
    // 새로고침 이슈: 의존성 배열에 Context의 'countryCode'와 location의 'codeFromState' 둘 다 포함
  }, [loading, countryCode, categories, codeFromState]);

  // ─────────────────────────────────────────
  // 완료 상태 업데이트 감지
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("completedCategories")) || [];
    setCompleted(stored);
  }, []);

  // ─────────────────────────────────────────
  // 페이지 이동 시 완료 상태 저장
  const handleStart = (name, index) => {
    navigate("/page5", {
      state: { categoryIndex: index, categoryName: name },
    });
  };

  // ─────────────────────────────────────────
  useEffect(() => {
    // 페이지 새로고침 시 완료 상태 초기화 (필요 여부 확인 권장)
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
      {loading ? (
        <div className="Page04_ThumbnailPlaceholder">로딩 중…</div>
      ) : categories.length === 0 ? (
        <div className="Page04_ThumbnailPlaceholder">카테고리가 없습니다</div>
      ) : (
        categories.map(({ key, name }, index) => (
          <section className="Page04_Card" key={key}>
            <div className="CommonFrame Page04_TitleFrame">{name}</div>

            {/* 대표 이미지 출력 */}
            <div className="Page04_Thumbnail">
              {thumbnails?.[key] ? (
                <img
                  src={thumbnails[key]}
                  alt={`${name} 썸네일`}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="Page04_ThumbnailPlaceholder">이미지 없음</div>
              )}
            </div>

            {/* 완료 상태에 따라 버튼 변경 */}
            <button
              className={`CommonFrame Page04_ActionFrame ${
                completed.includes(name) ? "Completed" : ""
              }`}
              onClick={() => handleStart(name, index)}
              disabled={completed.includes(name)}
            >
              {completed.includes(name) ? "완료" : "시작하기"}
            </button>
          </section>
        ))
      )}
    </main>

    <footer className="Pages04_Footer">
      선호도를 입력하고 맞춤형 여행 초안을 받아보세요!
    </footer>
  </div>
)};
