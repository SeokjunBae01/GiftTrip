// GiftTripPages07.jsx
import { useCallback } from "react";
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

// 파일명 안전하게
function safeFileName(s = "") {
  return String(s).replace(/[\\/:*?"<>|]/g, "_").trim();
}

// 아주 간단한 이메일 체크
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ⭐ 공통: DOM을 캔버스로 캡처 → 다운스케일 → JPEG dataURL 반환
async function captureElementToJpegDataURL(element, {
  captureScale = 1.1,       // html2canvas 캡처 스케일
  maxWidth = 1280,          // 다운스케일 가로 최대
  jpegQuality = 0.68        // JPEG 품질
} = {}) {
  const srcCanvas = await html2canvas(element, { useCORS: true, scale: captureScale });
  const ratio = srcCanvas.height / srcCanvas.width;
  const w = Math.min(srcCanvas.width, maxWidth);
  const h = Math.round(w * ratio);

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");
  ctx.drawImage(srcCanvas, 0, 0, w, h);

  return off.toDataURL("image/jpeg", jpegQuality);
}

// ⭐ 공통: JPEG dataURL → PDF Blob 생성
function jpegDataURLToPdfBlob(imgDataUrl, {
  pageWidthMm, // jsPDF의 page width(mm)
  imgPixelWidth, // 다운스케일된 가로 px
  imgPixelHeight // 다운스케일된 세로 px
}) {
  const ratio = imgPixelHeight / imgPixelWidth;
  const pdfHeightMm = pageWidthMm * ratio;

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [pageWidthMm, pdfHeightMm],
    compress: true,
  });

  pdf.addImage(imgDataUrl, "JPEG", 0, 0, pageWidthMm, pdfHeightMm);
  return pdf.output("blob");
}

export default function GiftTripPages07() {
  const location = useLocation();
  const { selectedItemIds, selectedCode } = location.state || {};

  const [groupedItems, setGroupedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryName, setCountryName] = useState("");
  const mainContentRef = useRef(null);

  // Hype 텍스트
  const [hypeText, setHypeText] = useState("AI가 여행 초안을 요약 중입니다...");

  // ===== 공유(메일 전송) UI 상태 =====
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNickname, setShareNickname] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareSending, setShareSending] = useState(false);
  const [shareMsg, setShareMsg] = useState(""); // 성공/실패 메시지

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
        setHypeText("AI가 여행 초안을 요약 중입니다...");

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

        if (data.hypeText) setHypeText(data.hypeText);
        else setHypeText("당신만의 멋진 여행 계획이 완성되었습니다.");
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
            // 🔹 파일명 파싱을 적용할 타입 정의: 도시 + 인기 스팟(영/한)
            const shouldParseFromImage =
              item.type === "도시" || item.type === "인기 스팟" || item.type === "Spots";
                    
            const { title: splitTitle, desc: splitDesc } = shouldParseFromImage
              ? parseTitleAndDesc(item.imageUrl)
              : { title: "", desc: "" };
                    
            const finalTitle = splitTitle || item.name;
                    
            // 🔹 파일명에서 설명을 읽어오되, 그 외 타입은 기존 description 사용
            const rawDesc = shouldParseFromImage ? splitDesc : item.description;
                    
            // (주소처럼 보이는 텍스트는 숨김 로직 유지)
            const isAddressLike =
              typeof rawDesc === "string" &&
              /^\s*[A-Z]{2}\s*\/\s*(Stay|Activity|Food|Spots)\s*$/i.test(rawDesc);
            const finalDesc = isAddressLike ? "" : rawDesc;
                    
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

  // ===== 로컬 저장 (용량 줄인 버전) =====
  const handlePdfDownload = async (customFileName) => {
    const element = mainContentRef.current;
    if (!element) return;

    const fileName = "GiftTrip-Draft.pdf";
    formData.append("file", pdfBlob, fileName);

    document.body.classList.add("pdf-capturing");
    try {
      // 캡처 → 다운스케일 → JPEG
      const imgData = await captureElementToJpegDataURL(element, {
        captureScale: 1.1,
        maxWidth: 1280,
        jpegQuality: 0.68,
      });

      // 다운스케일 결과 사이즈 얻기
      const tmpImg = new Image();
      const dims = await new Promise((resolve) => {
        tmpImg.onload = () => resolve({ w: tmpImg.naturalWidth, h: tmpImg.naturalHeight });
        tmpImg.src = imgData;
      });

      const pageWidthMm = new jsPDF().internal.pageSize.getWidth();
      const pdfBlob = jpegDataURLToPdfBlob(imgData, {
        pageWidthMm,
        imgPixelWidth: dims.w,
        imgPixelHeight: dims.h,
      });

      // 저장
      const pdf = new jsPDF();
      // 주의: 위에서 만든 blob을 파일 저장하려면 a태그로 저장하거나, 아래처럼 다시 생성해서 저장
      // 간단히는 dataURL 저장:
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF 생성 중 오류 발생:", e);
      setError("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      document.body.classList.remove("pdf-capturing");
    }
  };

  // ===== 공유(메일 전송) 플로우 =====
  const openShare = () => {
    setShareMsg("");
    setShareOpen(true);
  };

  const closeShare = () => {
    if (shareSending) return;
    setShareOpen(false);
  };

  const handleShareSubmit = async (e) => {
    e?.preventDefault?.();
    setShareMsg("");

    const nick = shareNickname.trim();
    const email = shareEmail.trim();

    if (!nick) {
      setShareMsg("닉네임을 입력해주세요.");
      return;
    }
    if (!email || !isValidEmail(email)) {
      setShareMsg("올바른 이메일을 입력해주세요.");
      return;
    }

    const element = mainContentRef.current;
    if (!element) {
      setShareMsg("페이지 렌더링 상태를 확인해주세요.");
      return;
    }

    setShareSending(true);
    document.body.classList.add("pdf-capturing");

    try {
      // 1) 캡처 → 다운스케일 → JPEG
      const imgData = await captureElementToJpegDataURL(element, {
        captureScale: 1.1,
        maxWidth: 1280,
        jpegQuality: 0.68,
      });

      // 2) 다운스케일 결과 사이즈 얻기
      const dims = await new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
        i.src = imgData;
      });

      // 3) JPEG → PDF(압축) → Blob
      const pageWidthMm = new jsPDF().internal.pageSize.getWidth();
      const pdfBlob = jpegDataURLToPdfBlob(imgData, {
        pageWidthMm,
        imgPixelWidth: dims.w,
        imgPixelHeight: dims.h,
      });

      // 4) FormData 구성
      const fileName = `GiftTrip-${safeFileName(nick)}.pdf`;
      const formData = new FormData();
      formData.append("nickname", nick);
      formData.append("email", email);
      formData.append("countryCode", selectedCode || "");
      formData.append("file", pdfBlob, fileName);

      // 5) 서버 전송
      const res = await fetch("http://localhost:3000/api/page7/share", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`업로드 실패: ${res.status} ${txt}`);
      }

      const json = await res.json().catch(() => ({}));
      if (!json.success) {
        throw new Error(json.message || "전송 처리에 실패했습니다.");
      }

      setShareMsg("공유가 완료되었습니다. 메일함을 확인해주세요.");
    } catch (e) {
      console.error("[share] error:", e);
      setShareMsg(e.message || "공유 중 오류가 발생했습니다.");
    } finally {
      setShareSending(false);
      document.body.classList.remove("pdf-capturing");
    }
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
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
            className="Page07_Btn secondary"
            type="button"
            onClick={() => handlePdfDownload("GiftTrip-(사용자이름).pdf")}
          >
            내 PC에 저장 (PDF)
          </button>

          <button
            className="Page07_Btn primary"
            type="button"
            onClick={openShare}
          >
            공유하기 (메일)
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

      {shareOpen && (
        <div id="share-modal-backdrop" className="share-modal-backdrop" onClick={closeShare}>
          <div id="share-modal" className="share-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="share-title">
            <h3 id="share-title" className="share-title">PDF 공유</h3>
            <p className="share-desc">이메일로 PDF를 전송합니다.</p>

            <form onSubmit={(e) => { e.preventDefault(); handleShareSubmit(); }}>
              <label className="share-label">
                닉네임
                <input
                  id="share-nick"
                  className="share-input"
                  type="text"
                  placeholder="예) 사과"
                  value={shareNickname}
                  onChange={(e) => setShareNickname(e.target.value)}
                  disabled={shareSending}
                />
              </label>

              <label className="share-label">
                이메일
                <input
                  className="share-input"
                  type="email"
                  placeholder="example@email.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  disabled={shareSending}
                />
              </label>

              <div className="share-filehint">
                파일명: <strong>{`GiftTrip-Draft.pdf`}</strong>
              </div>

              {shareMsg && (
                <div className={`share-msg ${shareMsg.includes("완료") ? "ok" : "err"}`}>
                  {shareMsg}
                </div>
              )}

              <div className="share-actions">
                <button type="button" className="Page07_Btn secondary" onClick={closeShare} disabled={shareSending}>
                  취소
                </button>
                <button type="submit" className="Page07_Btn primary" disabled={shareSending}>
                  {shareSending ? "전송 중..." : "완료하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
