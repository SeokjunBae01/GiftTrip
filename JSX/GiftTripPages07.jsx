import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/GiftTripPages07.css";
import "../CSS/common.css";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import ChecklistModal, { ChecklistContent } from "./ChecklistModal.jsx";
import "../CSS/ChecklistModal.css";

function parseTitleAndDesc(url) {
  try {
    const decoded = decodeURIComponent(url || "");
    const base = (decoded.split("/").pop() || "").split("?")[0];
    const noExt = base.replace(/\.[^/.]+$/, "");
    const parts = noExt.split("-");
    if (parts.length === 1) return { title: parts[0].trim(), desc: "" };
    const title = parts[0].trim();
    const desc = parts.slice(1).join("-").trim();
    return { title, desc };
  } catch {
    return { title: "", desc: "" };
  }
}

export default function GiftTripPages07() {
  const location = useLocation();
  const { selectedItemIds, selectedCode } = location.state || {};

  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryName, setCountryName] = useState("");
  const mainContentRef = useRef(null);

  const hypeText =
    "당신의 여행은 야경과 미식을 즐기는 리듬으로 흘러가요. 도보와 대중교통으로 가볍고 자유롭게 도시를 탐험하게 될 거예요!";

  useEffect(() => {
    if (!selectedItemIds || selectedItemIds.length === 0) {
      setError("선택된 항목이 없습니다. 이전 페이지로 돌아가 다시 선택해주세요.");
      setIsLoading(false);
      return;
    }
    if (!selectedCode) {
      setError("국가 코드(SelectedCode)가 누락되었습니다. 이전 페이지부터 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch("http://localhost:3000/api/page7/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedItemIds }),
        });
        if (!res.ok) throw new Error(`서버 응답 실패: ${res.status}`);

        const data = await res.json();
        if (!data.success || !Array.isArray(data.items)) {
          throw new Error("데이터 형식이 올바르지 않습니다.");
        }

        const grouped = data.items.reduce((acc, item) => {
          const category = item.type || "기타";
          (acc[category] ||= []).push(item);
          return acc;
        }, {});

        const categoryOrder = ["도시", "액티비티", "음식", "인기 스팟", "기타"];
        const ordered = {};
        categoryOrder.forEach((c) => { if (grouped[c]) ordered[c] = grouped[c]; });

        setGroupedItems(ordered);
        setCountryName(data.countryName || "");
      } catch (e) {
        console.error("[Page07] fetchDetails error:", e);
        setError("선택한 항목의 세부 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedItemIds, selectedCode]);

  const renderContent = () => {
    if (isLoading) return <p>최종 초안을 생성 중입니다...</p>;
    if (error) return <p style={{ color: "tomato" }}>{error}</p>;
    if (Object.keys(groupedItems).length === 0) return <p>표시할 항목이 없습니다.</p>;

    return Object.entries(groupedItems).map(([category, items]) => (
      <section className="Page07_Section" key={category}>
        <h3 className="Page07_SectionTitle">{category}</h3>
        <div className="Page07_CardsGrid">
          {items.map((item) => {
            const isCity = item.type === "도시";
            const { title: splitTitle, desc: splitDesc } = isCity ? parseTitleAndDesc(item.imageUrl) : { title: "", desc: "" };
            const finalTitle = isCity ? (splitTitle || item.name) : item.name;
            const finalDesc  = isCity ? splitDesc : item.description;

            return (
              <div className="Page07_Card" key={item.id}>
                <img
                  className="Page07_CardImage"
                  src={item.imageUrl || "https://via.placeholder.com/480x320?text=No+Image"}
                  alt={finalTitle}
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/480x320?text=No+Image"; }}
                />
                <div className="Page07_CardContent">
                  <div className="Page07_CardHeader">
                    <h4 className="Page07_CardTitle">{finalTitle}</h4>
                    <a
                      className="Page07_Link"
                      href={getDynamicLink(item, finalTitle)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      상세보기
                    </a>
                  </div>
                  {finalDesc && <p className="Page07_CardDescription">{finalDesc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ));
  };

  const getDynamicLink = (item, titleForSearch) => {
    const baseUrlGoogle = "https://www.google.com/search?q=";
    const baseUrlYouTube = "https://www.youtube.com/results?search_query=";
    const searchTerm = encodeURIComponent(`${countryName || ""} ${titleForSearch || item.name}`.trim());

    switch (item.type) {
      case "도시":
      case "액티비티":
        return `${baseUrlYouTube}${searchTerm}`;
      case "음식":
      case "인기 스팟":
        return `${baseUrlGoogle}${searchTerm}`;
      default:
        if (item.link && item.link !== "#") return item.link;
        return `${baseUrlGoogle}${searchTerm}`;
    }
  };

  const handlePdfDownload = async () => {
    const element = mainContentRef.current;
    if (!element) return;

    setIsDownloading(true);
    document.body.classList.add("pdf-capturing");
    try {
      const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pdfWidthMm = new jsPDF().internal.pageSize.getWidth();
      const ratio = imgHeightPx / imgWidthPx;
      const pdfHeightMm = pdfWidthMm * ratio;

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: [pdfWidthMm, pdfHeightMm] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
      pdf.save("GiftTrip-초안.pdf");
    } catch (e) {
      console.error("PDF 생성 중 오류 발생:", e);
      setError("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDownloading(false);
      document.body.classList.remove("pdf-capturing");
    }
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn" type="button">로그인</button>
      </header>

      <main className="Page07_Main" ref={mainContentRef}>
        <h2 className="Page07_Title">최종 초안</h2>
        <h3 className="Page07_Subtitle">AI가 생각한 당신의 여행</h3>
        <div className="Page07_Hype">{hypeText}</div>

        {renderContent()}

        <div className="Page07_ChecklistPrintSection">
          <h2 className="Page07_Title" style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            여행 준비물 체크리스트
          </h2>

          <div className="ModalContent" style={{ border: 'none', boxShadow: 'none', position: 'static', transform: 'none', padding: '0 10px' }}>
            <ChecklistContent countryCode={selectedCode} />
          </div>
        </div>

        <div className="Page07_Actions">
          <button
            className="Page07_Btn primary"
            type="button"
            onClick={handlePdfDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "PDF 생성 중..." : "공유하기 (PDF)"}
          </button>

          <button
            className="Page07_Btn secondary"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            체크리스트 확인
          </button>
        </div>
      </main>

      <ChecklistModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        countryCode={selectedCode}
      />
    </div>
  );
}
