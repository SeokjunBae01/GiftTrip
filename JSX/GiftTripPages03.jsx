import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Common.css";
import "../CSS/GiftTripPages03.css";

const SESSION_KEY = "gt.selectedCode";

export default function GiftTripPages03() {
  const navigate = useNavigate();
  const [info, setInfo] = useState({
    countryName: "",
    typeSummary: "",
    tags: [],
    // 서버가 countryCode를 같이 내려줄 수 있으면 여기에 붙음
    countryCode: "", 
  });

  // 공통: 서버에서 CountryCode 보조 조회
  const fetchCountryCode = async () => {
    try {
      const r = await fetch("http://localhost:3000/api/CountryCode");
      if (!r.ok) throw new Error("CountryCode API 실패");
      const j = await r.json(); // { code: 'JP' }
      return j.code || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/page3/recommendations");
        if (!res.ok) throw new Error("서버 응답 오류");
        const data = await res.json();
        setInfo(data);

        // ✅ 1) 서버가 countryCode를 내려주면 그걸 사용
        let code = data.countryCode || "";
        // ✅ 2) 없으면 백업 API로 획득
        if (!code) code = await fetchCountryCode();
        // ✅ 3) 그래도 없으면 빈 문자열(그냥 진행)
        if (code) {
          try { sessionStorage.setItem(SESSION_KEY, code); } catch {}
        }
      } catch (e) {
        console.error("데이터 불러오기 실패:", e);
      }
    };
    fetchRecommendation();
  }, []);

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${info.countryName} 풍경`
  )}`;

  const goPage4 = () => {
    // ✅ 세션에서 최신 코드 읽어 state로 넘김(페이지4가 우선 사용)
    let selectedCode = "";
    try { selectedCode = sessionStorage.getItem(SESSION_KEY) || ""; } catch {}
    navigate("/page4", { state: { selectedCode } });
  };

  return (
    <div className="CommonPage pg03">
      <header className="CommonHeader">
        <div className="CommonLogo CommonLogo_Left">Gift Trip</div>
        {/*<button className="CommonLoginBtn">로그인</button>*/}
      </header>

      <main className="content">
        <h2 className="title">사용자님을 위한 추천 여행지✈️</h2>

        <div className="city-label">{info.countryName}</div>

        <a className="yt-link" href={youtubeUrl} target="_blank" rel="noreferrer">
          여행지가 어떤 모습일지 궁금하시다면, 여기를 클릭하세요!!
        </a>

        <div className="type-summary" aria-live="polite">
          {info.typeSummary}
        </div>

        <section className="type">
          <span className="type-label">AI가 분석한 사용자님의 여행타입은?</span>
          <div className="type-tags">
            {info.tags.map((t) => (
              <span className="tag" key={t}>#{t}</span>
            ))}
          </div>
        </section>

        <div className="actions">
          <button className="btn primary" onClick={goPage4}>초안 만들기 시작</button>
          <button className="btn secondary" onClick={() => navigate("/page1")}>다시 답변하고 재추천 받기</button>
        </div>
      </main>
    </div>
  );
}