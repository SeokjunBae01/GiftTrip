// GiftTripPages00.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "../CSS/GiftTripPages00.css";
import "../CSS/Common.css";

const API_BASE_URL = 'http://localhost:3000/api/page0';

const COUNTRY_OPTIONS = [
  { name: '일본', code: 'JP' },
  { name: '중국', code: 'CN' },
  { name: '대만', code: 'TW' },
  { name: '미국', code: 'US' },
  { name: '캐나다', code: 'CA' },
  { name: '프랑스', code: 'FR' },
  { name: '영국', code: 'GB' },
  { name: '독일', code: 'DE' },
  { name: '이탈리아', code: 'IT' },
  { name: '스페인', code: 'ES' },
];


function flagIconURL(cc = "") {
  const code = cc.toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`; // 40px짜리 국기
}

export default function GiftTripPages00() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  const isValidDestination = COUNTRY_OPTIONS.some(
    (country) => country.name === destination.trim()
  );

  const selectedCountry = isValidDestination
    ? COUNTRY_OPTIONS.find((country) => country.name === destination.trim())
    : null;
  const selectedCountryCode = selectedCountry ? selectedCountry.code : null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (destination.trim() === '') setFilteredOptions(COUNTRY_OPTIONS);
    setShowOptions(true);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    if (value.trim().length > 0) {
      const filtered = COUNTRY_OPTIONS.filter(country =>
        country.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowOptions(true);
    } else {
      setFilteredOptions([]);
    }
  };

  const handleOptionClick = (countryName) => {
    setDestination(countryName);
    setShowOptions(false);
    setFilteredOptions([]);
  };

  const buttonText = isValidDestination ? '초안 만들기' : '여행지가 정해지지 않았어요.';
  const isButtonEnabled = !isLoading && (isValidDestination || destination.trim() === '');

  const handleButtonClick = async () => {
    if (isLoading || !isButtonEnabled) return;  

    const countryName = destination.trim();
    const countryCode = selectedCountryCode;  

    if (isValidDestination) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/country`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryName, countryCode }),
        });
        if (!response.ok) throw new Error('데이터 저장 실패');
        const data = await response.json(); 

        // ✅ 5→4 복귀 플래그 제거 (0→4 진입 시 초기화가 스킵되지 않도록)
        sessionStorage.removeItem("gt.fromPage5");  

        // ✅ Page04에서 'page0에서 왔다'로 인식 → 강제 초기화 트리거
        navigate(data.next, { state: { from: "page0", selectedCode: countryCode } });
      } catch (err) {
        console.error('여행지 데이터 저장 중 오류:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate('/page1');
    }
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Middle">Gift Trip</h1>
        {/*<button className="CommonLoginBtn">로그인</button>*/}
      </header>

      <main className="Page00_Main">
        <div className="Page00_QuestionGroup" ref={wrapperRef}>
          <p className="Page00_Question">어디로 여행을 떠나실 계획이신가요?</p>

          <div className="Page00_InputWrap">
            <input
              className="Page00_Input"
              placeholder="여행지를 입력하고 목록에서 선택해주세요."
              value={destination}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {(showOptions && filteredOptions.length > 0) && (
            <div className="Page00_AutoCompleteList">
              {filteredOptions.map((country) => (
                <div
                  key={country.code}
                  className="Page00_OptionItem"
                  onClick={() => handleOptionClick(country.name)}
                >
                  {/* ✅ 왼쪽 국기 + 이름 */}
                  <span className="Page00_OptionFlag" aria-hidden="true">
                    {
                      <img src={flagIconURL(country.code)} alt="" className="Page00_OptionFlagImg" />
                    }
                  </span>
                  <span className="Page00_OptionName">{country.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="Page00_ActionArea">
          <button
            className="Page00_ActionBtn"
            onClick={handleButtonClick}
            disabled={!isButtonEnabled}
          >
            {isLoading ? '데이터 저장 중...' : buttonText}
          </button>
        </div>
      </main>
    </div>
  );
}
