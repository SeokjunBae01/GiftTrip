import React, { useEffect, useState } from "react";
import "./CSS/GiftTripPages03.css";

export default function GiftTripPages03() {
  // 데모용 더미 데이터 (백엔드 붙으면 교체)
  const city = "추천 여행지 이름";
  const tags = ["하이킹", "미식", "야경"];
  const typeSummary =
    "도보 이동과 대중교통을 선호하고, 야경과 미식 탐방을 즐기는 타입이에요.";

  // 유튜브 검색 링크
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${city} landscape`
  )}`;

  return (
    <div className="pg03">
      {/* 헤더 */}
      <header className="header">
        <div className="logo">Gift Trip</div>
        <button className="login" type="button">로그인</button>
      </header>

      {/* 본문 */}
      <main className="content">
        <h2 className="title">사용자님을 위한 추천 여행지✈️</h2>

        {/* 도시 이름: 버튼이 아닌 배지 형태 텍스트 */}
        <div className="city-label">{city}</div>

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
          {typeSummary}
        </div>

        {/* 여행 타입 해시태그 */}
        <section className="type">
          <span className="type-label">AI가 분석한 사용자님의 여행타입은?</span>
          <div className="type-tags">
            {tags.map((t) => (
              <span className="tag" key={t}>#{t}</span>
            ))}
          </div>
        </section>

        {/* 하단 CTA */}
        <div className="actions">
          <button className="btn primary" type="button">초안 만들기 시작</button>
          <button className="btn secondary" type="button">다시 답변하고 재추천 받기</button>
        </div>
      </main>
    </div>
  );
}