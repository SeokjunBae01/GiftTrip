import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/GiftTripPages07.css";
import "../CSS/common.css";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import ChecklistModal from "./ChecklistModal.jsx";
import "../CSS/ChecklistModal.css"
// ---------------------------------

export default function GiftTripPages07() {
  // --- 1. React Hooks 및 상태 관리 ---

  const location = useLocation();

  const { selectedItemIds, countryCode } = location.state || {};

  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- 추가: PDF로 변환할 DOM 요소를 참조하기 위한 ref ---
  const mainContentRef = useRef(null);

  // --- 2. 정적 데이터 ---
  const hypeText =
    "당신의 여행은 야경과 미식을 즐기는 리듬으로 흘러가요. 도보와 대중교통으로 가볍고 자유롭게 도시를 탐험하게 될 거예요!";

  // --- 3. 데이터 Fetching 및 처리 ---
  useEffect(() => {
    if (!selectedItemIds || selectedItemIds.length === 0) {
      setError("선택된 항목이 없습니다. 이전 페이지로 돌아가 다시 선택해주세요.");
      setIsLoading(false);
      return;
    }
    if (!countryCode) {
      setError("국가 코드가 누락되었습니다. 이전 페이지부터 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError("");

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

        //******************************************
        // id에서 받아온 데이터들 카테고리별로 소팅
        const items = data.items;

        const grouped = items.reduce((acc, item) => {
          const category = item.type || "기타";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {});
        //*****************************************


        //*****************************************
        // 카테고리 순서 정리
        const categoryOrder = ["숙박", "액티비티", "음식", "인기 스팟", "기타"];
        const orderedGroupedItems = {};

        categoryOrder.forEach(category => {
          if (grouped[category]) {
            orderedGroupedItems[category] = grouped[category];
          }
        });

        setGroupedItems(orderedGroupedItems);
        //*****************************************

      } catch (e) {
        console.error("[Page07] fetchDetails error:", e);
        setError("선택한 항목의 세부 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedItemIds, countryCode]);

  // --- 4. 조건부 UI 렌더링 함수 ---

  const renderContent = () => {
    if (isLoading) {
      return <p>최종 초안을 생성 중입니다...</p>;
    }

    if (error) {
      return <p style={{ color: "tomato" }}>{error}</p>;
    }

    if (Object.keys(groupedItems).length === 0) {
      return <p>표시할 항목이 없습니다.</p>;
    }

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
  
// --- 수정: PDF 다운로드 핸들러 (한 페이지 버전) ---
  const handlePdfDownload = async () => {
    // 1. PDF로 만들 DOM 요소를 가져옵니다.
    const element = mainContentRef.current;
    if (!element) return;

    setIsDownloading(true);

    try {
      // 2. html2canvas로 DOM을 캔버스(이미지)로 변환
      const canvas = await html2canvas(element, { 
        useCORS: true,
        scale: 2 // 해상도를 2배로 높여 품질 개선
      }); 

      // 3. 캔버스에서 이미지 데이터(Data URL) 추출 (jspdf 사용가능하도록)
      const imgData = canvas.toDataURL("image/png");

      // 4. 캔버스 사이즈 조절
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      // (임시 jsPDF 객체를 만들어 A4 너비 값을 mm 단위로 가져옴)
      const pdfWidthMm = new jsPDF().internal.pageSize.getWidth();

      const ratio = imgHeightPx / imgWidthPx;
      const pdfHeightMm = pdfWidthMm * ratio;

      // 8. jsPDF 객체 생성 시, format에 [너비, 높이]를 배열로 전달하여
      //      "세로로 긴" 커스텀 용지 크기를 지정
      const pdf = new jsPDF({
        orientation: "p", // "p" (portrait, 세로)
        unit: "mm",       // 단위: 밀리미터
        format: [pdfWidthMm, pdfHeightMm] // [너비, 높이]
      });
      
      // 9. (0, 0) 위치에서 시작하여 PDF 용지를 꽉 채우도록 그림
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);

      // 10. PDF 파일 저장 (이름 변경)
      pdf.save("GiftTrip-초안.pdf");

    } catch (e) {
      console.error("PDF 생성 중 오류 발생:", e);
      setError("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
    }
  };
  // ---------------------------------

  // --- 5. 최종 컴포넌트 JSX 반환 ---
  return (
    <div className="CommonPage">
      {/* 5-1. 공통 헤더 */}
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      {/* 5-2. 메인 컨텐츠 */}
      <main className="Page07_Main" ref={mainContentRef}>
        <h2 className="Page07_Title">최종 초안</h2>
        <h3 className="Page07_Subtitle">AI가 생각한 당신의 여행</h3>
        <div className="Page07_Hype">{hypeText}</div>

        {renderContent()}


        <div className="Page07_Actions">
          
          {/* 공유하기 버튼 */}
          <button 
            className="Page07_Btn primary" 
            type="button"
            onClick={handlePdfDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "PDF 생성 중..." : "공유하기 (PDF)"}
          </button>

          {/* 체크리스트 버튼 */}
          <button
            className="Page07_Btn secondary"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            체크리스트 확인
          </button>

        </div>
      </main>
      {/* 모달 컴포넌트 렌더링 */}
      <ChecklistModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        countryCode={countryCode}
      />
    </div>
  );
}