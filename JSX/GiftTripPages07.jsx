// GiftTripPages07.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/GiftTripPages07.css";
import "../CSS/common.css";

export default function GiftTripPages07() {
  // --- 1. React Hooks 및 상태 관리 ---

  const location = useLocation();
  const navigate = useNavigate(); // 현재 사용되진 않지만, 향후 '로그인' 등 라우팅에 필요할 수 있어 유지

  // Page 06에서 navigate state로 전달받은 ID 목록
  const { selectedItemIds } = location.state || {};

  // 서버에서 받아온 데이터를 카테고리별로 그룹화하여 저장할 상태
  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- 2. 정적 데이터 ---

  // TODO: 이 텍스트는 API 응답(AI 요약)으로 대체될 수 있습니다.
  const hypeText =
    "당신의 여행은 야경과 미식을 즐기는 리듬으로 흘러가요. 도보와 대중교통으로 가볍고 자유롭게 도시를 탐험하게 될 거예요!";

  // --- 3. 데이터 Fetching 및 처리 ---

  useEffect(() => {
    // 3-1. ID 목록 유효성 검사
    if (!selectedItemIds || selectedItemIds.length === 0) {
      setError("선택된 항목이 없습니다. 이전 페이지로 돌아가 다시 선택해주세요.");
      setIsLoading(false);
      // (이전에 주석 처리되었던 불필요한 setTimeout 코드 제거)
      return;
    }

    // 3-2. ID 목록 기반으로 상세 정보를 요청하는 비동기 함수
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError("");

        // [백엔드 연동] ID 목록을 POST body로 보내 상세 정보를 요청
        const res = await fetch("http://localhost:3000/api/page7/details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedItemIds }),
        });

        if (!res.ok) {
          throw new Error(`서버 응답 실패: ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || !Array.isArray(data.items)) {
          throw new Error("데이터 형식이 올바르지 않습니다.");
        }

        const items = data.items; // (e.g., [item1, item2, ...])

        // 3-3. 데이터 가공: 카테고리별 그룹화 (reduce 활용)
        const grouped = items.reduce((acc, item) => {
          const category = item.type || "기타"; // 'type'은 "숙박", "액티비티" 등
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {});

        // 3-4. 데이터 가공: 카테고리 순서 정렬 (Page06 순서와 일치)
        const categoryOrder = ["숙박", "액티비티", "음식", "인기 스팟", "기타"];
        const orderedGroupedItems = {};

        categoryOrder.forEach(category => {
          if (grouped[category]) {
            orderedGroupedItems[category] = grouped[category];
          }
        });

        setGroupedItems(orderedGroupedItems);

      } catch (e) {
        console.error("[Page07] fetchDetails error:", e);
        setError("선택한 항목의 세부 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedItemIds]); // selectedItemIds가 변경될 때만 이 effect를 재실행

  // --- 4. 조건부 UI 렌더링 함수 ---

  const renderContent = () => {
    // 4-1. 로딩 중
    if (isLoading) {
      return <p>최종 초안을 생성 중입니다...</p>;
    }

    // 4-2. 에러 발생 시
    if (error) {
      return <p style={{ color: "tomato" }}>{error}</p>;
    }

    // 4-3. 데이터가 없을 때 (정상 응답이지만 빈 배열)
    if (Object.keys(groupedItems).length === 0) {
      return <p>표시할 항목이 없습니다.</p>;
    }

    // 4-4. (정상) 그룹화된 데이터를 기반으로 섹션과 카드 렌더링
    return Object.entries(groupedItems).map(([category, items]) => (
      <section className="Page07_Section" key={category}>
        <h3 className="Page07_SectionTitle">{category}</h3>
        <div className="Page07_CardsGrid">
          {items.map((item) => (
            <div className="Page07_Card" key={item.id}>
              <img
                className="Page07_CardImage"
                src={item.imageUrl || "https://via.placeholder.com/480x320?text=No+Image"}
                alt={item.name}
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/480x320?text=No+Image"; }}
              />
              <div className="Page07_CardContent">
                <div className="Page07_CardHeader">
                  <h4 className="Page07_CardTitle">{item.name}</h4>
                  <a
                    className="Page07_Link"
                    // TODO: 백엔드 API 응답에 'link' 속성이 포함되어야 함
                    href={item.link || "#"}
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
    ));
  };

  // --- 5. 최종 컴포넌트 JSX 반환 ---

  return (
    <div className="CommonPage">
      {/* 5-1. 공통 헤더 */}
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      {/* 5-2. 메인 컨텐츠 */}
      <main className="Page07_Main">
        <h2 className="Page07_Title">최종 초안</h2>
        <h3 className="Page07_Subtitle">AI가 생각한 당신의 여행</h3>
        <div className="Page07_Hype">{hypeText}</div>

        {renderContent()}


        <div className="Page07_Actions">
          <button className="Page07_Btn primary" type="button">공유하기</button>
          <button className="Page07_Btn secondary" type="button">체크리스트 확인</button>
        </div>
      </main>
    </div>
  );
}
