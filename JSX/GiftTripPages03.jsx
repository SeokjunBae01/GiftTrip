import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Common.css";
import "../CSS/GiftTripPages03.css";

const API_BASE_URL = "http://localhost:3000/api/page3"; // -> /recommendations 붙여서 호출

export default function GiftTripPages03() {
  const navigate = useNavigate();

  const [info, setInfo] = useState({
    countryName: "",
    typeSummary: "",
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/recommendations`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
        const data = await res.json();
        console.log("백엔드로부터 받은 데이터:", data);
        // 방어 코드: 누락 필드에 기본값 채우기
        setInfo({
          countryName: data.countryName ?? "",
          typeSummary: data.typeSummary ?? "",
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("데이터 불러오기 실패:", e);
          setError("추천 정보를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${info.countryName} 풍경`
  )}`;

  return (
    <div className="CommonPage pg03">
      {/* 헤더 */}
      <header className="CommonHeader">
        <div className="CommonLogo CommonLogo_Left">Gift Trip</div>
        <button className="CommonLoginBtn" type="button">
          로그인
        </button>
      </header>

      {/* 본문 */}
      <main className="content">
        <h2 className="title">사용자님을 위한 추천 여행지✈️</h2>

        {loading ? (
          <div className="type-summary" aria-busy="true">
            불러오는 중...
          </div>
        ) : error ? (
          <div className="type-summary" role="alert">
            {error}
          </div>
        ) : (
          <>
            {/* 나라 이름: 배지 */}
            <div className="city-label">{info.countryName || "—"}</div>

            {/* 유튜브 링크 */}
            <a className="yt-link" href={youtubeUrl} target="_blank" rel="noreferrer">
              여행지가 어떤 모습일지 궁금하시다면, 여기를 클릭하세요!!
            </a>

            {/* 요약 */}
            <div className="type-summary" aria-live="polite">
              {info.typeSummary || "여행 타입 요약이 곧 도착합니다."}
            </div>

            {/* 여행 타입 해시태그 */}
            <section className="type">
              <span className="type-label">AI가 분석한 사용자님의 여행타입은?</span>
              <div className="type-tags">
                {(info.tags ?? []).length === 0 ? (
                  <span className="tag">#추천준비중</span>
                ) : (
                  info.tags.map((t, i) => (
                    <span className="tag" key={`${t}-${i}`}>
                      #{t}
                    </span>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* 하단 CTA */}
        <div className="actions">
          <button className="btn primary" onClick={() => navigate("/page4")}>
            초안 만들기 시작
          </button>
          <button className="btn secondary" onClick={() => navigate("/page2")}>
            다시 답변하고 재추천 받기
          </button>
        </div>
      </main>
    </div>
  );
}