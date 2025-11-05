import React from "react";
import "../CSS/ChecklistModal.css";
import { checklistData } from "./ChecklistData.jsx";

export default function ChecklistModal({ show, onClose, countryCode }) {
  // show가 false면 아무것도 렌더링하지 않음
  if (!show) {
    return null;
  }

  // 1. 공통 준비물 데이터
  const commonData = checklistData.common;

  // 2. 국가 코드에 맞는 국가별 준비물 데이터
  //    (countryCode가 'JP'면 'JP' 데이터, 없으면 null)
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
    // 모달 배경 (클릭 시 닫힘)
    <div className="ModalOverlay" onClick={onClose}>
      
      {/* 모달 본체 (이벤트 버블링 차단) */}
      <div className="ModalContent" onClick={(e) => e.stopPropagation()}>
        
        {/* 닫기 버튼 */}
        <button className="ModalCloseBtn" onClick={onClose}>
          &times;
        </button>

        {/* 1. 공통 준비물 */}
        <h3>{commonData.title}</h3>
        <ul>
          {commonData.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        {/* 2. 국가별 준비물 */}
        {renderCountryContent()}

      </div>
    </div>
  );
}