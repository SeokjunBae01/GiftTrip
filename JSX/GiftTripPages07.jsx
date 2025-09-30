import React from "react";
import "./CSS/GiftTripPages07.css";
import "./CSS/common.css";

const finalSelections = {
  "숙박": [
    { name: "숙박1", description: "숙박1 설명", link: "#" },
    { name: "숙박2", description: "숙박2 설명", link: "#" },
  ],
  "액티비티": [
    { name: "액티비티1", description: "액티비티1 설명", link: "#" },
    { name: "액티비티2", description: "액티비티2 설명", link: "#" },
    { name: "액티비티3", description: "액티비티3 설명", link: "#" },
    { name: "액티비티4", description: "액티비티4 설명", link: "#" },
    { name: "액티비티5", description: "액티비티5 설명", link: "#" },
  ],
  "음식": [
    { name: "음식1", description: "음식1 설명", link: "#" },
    { name: "음식2", description: "음식2 설명", link: "#" },
    { name: "음식3", description: "음식3 설명", link: "#" },
    { name: "음식4", description: "음식4 설명", link: "#" },
  ],
  "인기 스팟": [
    { name: "스팟1", description: "스팟1 설명", link: "#" },
    { name: "스팟2", description: "스팟2 설명", link: "#" },
    { name: "스팟3", description: "스팟3 설명", link: "#" },
  ],
};

export default function GiftTripPages07() {
  const hypeText =
    "당신의 여행은 야경과 미식을 즐기는 리듬으로 흘러가요. 도보와 대중교통으로 가볍고 자유롭게 도시를 탐험하게 될 거예요!";

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      <main className="Page07_Main">
        <h2 className="Page07_Title">최종 초안</h2>

        {Object.entries(finalSelections).map(([category, items]) => (
          <section className="Page07_Section" key={category}>
            <h3 className="Page07_SectionTitle">{category}</h3>
            <div className="Page07_CardsGrid">
              {items.map((item, idx) => (
                <div className="Page07_Card" key={`${category}-${idx}`}>
                  <div className="Page07_CardImagePlaceholder" />
                  <div className="Page07_CardContent">
                    <div className="Page07_CardHeader">
                      <h4 className="Page07_CardTitle">{item.name}</h4>
                      <a
                        className="Page07_Link"
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        상세보기
                      </a>
                    </div>
                    <p className="Page07_CardDescription">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <h3 className="Page07_Subtitle">사용자님의 여행에 대하여</h3>
        <div className="Page07_Hype">{hypeText}</div>

        <div className="Page07_Actions">
          <button className="Page07_Btn primary" type="button">공유하기</button>
          <button className="Page07_Btn secondary" type="button">체크리스트 확인</button>
        </div>
      </main>
    </div>
  );
}