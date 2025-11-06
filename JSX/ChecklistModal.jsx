import React from "react";
import "../CSS/ChecklistModal.css";
import { checklistData } from "./ChecklistData.jsx";

// 다운로드 및 체크리스트 확인가능하도록
export function ChecklistContent({ countryCode }) {
  // 1. 공통 준비물 데이터
  const commonData = checklistData.common;
  // 2. 국가 코드에 맞는 국가별 준비물 데이터
  const countryData = countryCode ? checklistData.countries[countryCode] : null;

  // 팝업 내부 렌더링
  const renderCountryContent = () => {
    if (!countryCode) {
      return (
        <p className="ModalError">
          국가 코드가 선택되지 않았습니다.
        </p>
      );
    }
    if (!countryData) {
      return (
        <p className="ModalError">
          '{countryCode}'에 해당하는 준비물 정보를 찾을 수 없습니다.
        </p>
      );
    }

    return (
      <>
        <h3>{countryData.name}</h3>
        {countryData.visa && <p><strong>비자/허가:</strong> {countryData.visa}</p>}
        <h4>필수 준비물</h4>
        <ul>
          {countryData.prep.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </>
    );
  };

  return (
    // <React.Fragment>로 감싸서 내용만 반환
    <React.Fragment>
      {/* 1. 공통 준비물 */}
      <h3>{commonData.title}</h3>
      <ul>
        {commonData.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* 2. 국가별 준비물 */}
      {renderCountryContent()}
    </React.Fragment>
  );
}

// 3. 기존 default export는 ChecklistContent 사용하도록 수정
export default function ChecklistModal({ show, onClose, countryCode }) {
  if (!show) {
    return null;
  }

  return (
    <div className="ModalOverlay" onClick={onClose}>
      <div className="ModalContent" onClick={(e) => e.stopPropagation()}>
        <button className="ModalCloseBtn" onClick={onClose}>
          &times;
        </button>

        {/* 4. 위에서 만든 알맹이 컴포넌트 호출. */}
        <ChecklistContent countryCode={countryCode} />

      </div>
    </div>
  );
}
