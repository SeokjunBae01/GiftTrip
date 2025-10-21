import React, { useEffect, useState } from "react";
import "../CSS/common.css";
import "../CSS/GiftTripPages02.css";

export default function GiftTripPages02() {
  const [note, setNote] = useState("");
  const examples = [
    "예: 도쿄 제외, 아시아 내에서만",
    "예: 동유럽 위주, 야경이 멋진 도시",
    "예: 걷기 좋은 곳, 대중교통 편리한 도시",
  ];
  const [examplesIdx, setExamplesIdx] = useState(0);

  // Placeholder 힌트 3초마다 순환
  useEffect(() => {
    const id = setInterval(
      () => setExamplesIdx((i) => (i + 1) % examples.length),
      3000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="CommonPage pg02">
      {/* 헤더 */}
      <header className="CommonHeader">
        <div className="CommonLogo CommonLogo_Left">Gift Trip</div>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      {/* 본문 카드 */}
      <main className="card">
        <p className="subtle">3단계 중 마지막 단계 · 곧 결과가 생성됩니다 ✨</p>

        <label className="label" htmlFor="req">추가 요청 사항</label>
        <textarea
          id="req"
          className="input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={examples[examplesIdx]}
        />
        <p className="hint">
          특별히 원하는 조건이나 제외할 내용을 자유롭게 적어주세요.
          <br />입력하지 않아도 바로 추천을 받을 수 있어요.
        </p>

        <div className="actions">
          <button
            className="cta"
            type="button"
            onClick={() => {
              /* 데모용: 동작 없음 */
            }}
          >
            추천받기
          </button>
        </div>

        <p className="progress">Gift Trip · 빠르고 간편한 여행 초안</p>
      </main>
    </div>
  );
}
