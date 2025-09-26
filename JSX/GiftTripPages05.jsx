import "./CSS/GiftTripPages05.css";

export default function PageFour() {
  const imageSrc = "https://picsum.photos/800/500";
  const totalSteps = 8;
  const activeSteps = 2;

  return (
    <div className="pg2 page">   {/* ← 여기 pg2 추가 */}
      <header className="header">
        <h1 className="logo">Gift Trip</h1>
        <button className="loginBtn">로그인</button>
      </header>

      <main className="main">
        <section className="leftCol">
          <div className="imageWrap">
            <img src={imageSrc} alt="destination" className="image" />
          </div>
          <div className="actions">
            <button className="btn btnLike">좋아요</button>
            <button className="btn btnDislike">싫어요</button>
          </div>
        </section>

        <aside className="rightCol">
          <div className="reviewBox">
            <span className="reviewTitle">good reviews</span>
            <p className="reviewHint">여기에 긍정 리뷰가 들어옵니다 (준비중)</p>
          </div>
          <div className="reviewBox">
            <span className="reviewTitle">bad reviews</span>
            <p className="reviewHint">여기에 부정 리뷰가 들어옵니다 (준비중)</p>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <div className="progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`dot ${i < activeSteps ? "dotActive" : ""}`} />
          ))}
        </div>
      </footer>
    </div>
  );
}
