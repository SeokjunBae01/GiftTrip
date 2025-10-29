import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Common.css";
import "../CSS/GiftTripPages03.css";

export default function GiftTripPages03() {
  const navigate = useNavigate();
  
  // 백엔드에서 받아올 값 저장용 상태
  const [info, setInfo] = useState({
    countryName: "",
    typeSummary: "",
    tags: [],
  });

  // 페이지 로드 시 GET 요청
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/page3/recommendations");
        if (!res.ok) throw new Error("서버 응답 오류");
        const data = await res.json();
        console.log("백엔드로부터 받은 데이터:", data);
        setInfo(data);
      } catch (e) {
        console.error("데이터 불러오기 실패:", e);
      }
    };
    fetchRecommendation();
  }, []);

  // 유튜브 검색 링크
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${info.countryName} 풍경`
  )}`;

  return (
    <div className="CommonPage pg03">
      {/* 헤더 */}
      <header className="CommonHeader">
        <div className="CommonLogo CommonLogo_Left">Gift Trip</div>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      {/* 본문 */}
      <main className="content">
        <h2 className="title">사용자님을 위한 추천 여행지✈️</h2>

        {/* 나라 이름: 버튼이 아닌 배지 형태 텍스트 */}
        <div className="city-label">{info.countryName}</div>

        {/* 안내 문구: 클릭 시 유튜브 검색 링크 */}
        <a
          className="yt-link"
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
        >
          여행지가 어떤 모습일지 궁금하시다면, 여기를 클릭하세요!!
        </a>

        {/* LLM 여행 타입 요약 텍스트 공간 (회색 박스) */}
        <div className="type-summary" aria-live="polite">
          {info.typeSummary}
        </div>

        {/* 여행 타입 해시태그 */}
        <section className="type">
          <span className="type-label">AI가 분석한 사용자님의 여행타입은?</span>
          <div className="type-tags">
            {info.tags.map((t) => (
              <span className="tag" key={t}>#{t}</span>
            ))}
          </div>
        </section>

        {/* 하단 CTA */}
        <div className="actions">
          <button className="btn primary" onClick={() => navigate("/page2")}>초안 만들기 시작</button>
          <button className="btn secondary" onClick={() => navigate("/page2")}>다시 답변하고 재추천 받기</button>
        </div>
      </main>
    </div>
  );
}