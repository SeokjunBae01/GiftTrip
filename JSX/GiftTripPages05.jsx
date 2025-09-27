import "../CSS/GiftTripPages05.css";
import "../CSS/Common.css"

export default function GiftTripPages05() {
  const imageSrc = "https://picsum.photos/800/500";
  const totalSteps = 8;
  const activeSteps = 2;

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

       <main className="Page05_Container">
        <section className="Page05_Main">
          <img src={imageSrc} alt="destination" className="Page05_MainImage" />
          <div className="Page05_Action">
            <button className="CommonFrame Page05_BtnLike">좋아요</button>
            <button className="CommonFrame Page05_BtnDisLike">싫어요</button>
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
        <div className="Page05_Process">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`Page05_Dot ${i < activeSteps ? "Page05_DotActive" : ""}`} />
          ))}
        </div>
      </footer>
    </div>
  );
}
