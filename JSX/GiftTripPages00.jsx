import { useNavigate } from "react-router-dom";
import "./CSS/GiftTripPages00.css";

export default function PageOne() {
  const navigate = useNavigate();

  return (
    <div className="page">
      {/* 상단 헤더 (로고 중앙, 로그인 우상단) */}
      <header className="header">
        <h1 className="logo">Gift Trip</h1>
        <button className="loginBtn">로그인</button>
      </header>

      {/* 메인 */}
      <main className="main">
        {/* 질문 + 인풋은 붙여두기 */}
        <div className="questionGroup">
          <p className="question">어디로 여행을 떠나실 계획이신가요?</p>
          <input className="input" placeholder="여행지를 입력해보세요." />
        </div>

        {/* 하단 쪽에 분리된 액션 영역 */}
        <div className="actionArea">
          <button className="actionBtn">여행지가 정해지지 않았어요.</button>
        </div>
      </main>

      {/* 오른쪽 하단 네비 버튼 (page2로 이동) */}
      <button className="navBtn" onClick={() => navigate("/page2")}>
        ➡ 다음 페이지
      </button>
    </div>
  );
}
