import "../CSS/GiftTripPages00.css";
import "../CSS/Common.css";

export default function GiftTripPages00() {

  return (
    <div className="CommonPage">
      {/* 최상단 영역 */}
      <header className="CommonHeader">
        {/* 중앙 상단: 타이틀 */}
        <h1 className="CommonLogo CommonLogo_Middle">Gift Trip</h1>
        {/* 우측 상단: 로그인 */}
        <button className="CommonLoginBtn">로그인</button>
      </header>

      {/* 메인 */}
      <main className="Page00_Main">
        {/* 질문 + 인풋은 붙여두기 */}
        <div className="Page00_QuestionGroup">
          <p className="Page00_Question">어디로 여행을 떠나실 계획이신가요?</p>
          <input className="Page00_Input" placeholder="여행지를 입력해보세요." />
        </div>

        {/* 하단 쪽에 분리된 액션 영역 */}
        <div className="Page00_ActionArea">
          <button className="Page00_ActionBtn">여행지가 정해지지 않았어요.</button>
        </div>
      </main>
    </div>
  );
}
