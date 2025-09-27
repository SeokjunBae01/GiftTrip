import "../CSS/GiftTripPages04.css";
import "../CSS/Common.css"

export default function GiftTripPages04() {
  const navigate = useNavigate();
  const categories = ["숙박", "액티비티", "음식", "인기스팟"];

  return (
    <div className="CommonPage">
      {/* 최상단 영역 */}
      <header className="CommonHeader">
        {/* 좌측 상단: 타이틀 */}
        <h1 className="CommonLogo Page04_Logo">Gift Trip</h1>

        {/* 우측 상단: 로그인 */}
        <button className="CommonLoginBtn">로그인</button>
      </header>

      {/* 메인 */}
      <main className="Page04_Main">
        {categories.map((title) => (
          <section className="Page04_Card" key={title}>
            <div className="CommonFrame Page04_TitleFrame">{title}</div>
            <div className="Page04_Thumbnail"/>
            <button className="CommonFrame Page04_ActionFrame">시작하기</button>
          </section>
        ))}
      </main>

      {/* 아래 문구 */}
      <footer className="Pages04_Footer">
        선호도를 입력하고 맞춤형 여행 초안을 받아보세요!
      </footer>
    </div>
  );
}
