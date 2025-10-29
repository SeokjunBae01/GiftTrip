import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "../CSS/GiftTripPages00.css";
import "../CSS/Common.css";

// 백엔드 API 기본 URL 설정
const API_BASE_URL = 'http://localhost:3000/api/page0';

// 국가명 하드코딩
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

export default function GiftTripPages00() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 필터링된 선택지 목록 상태
  const [filteredOptions, setFilteredOptions] = useState([]);
  // 선택지 목록을 보여줄지 여부
  const [showOptions, setShowOptions] = useState(false); 
  // 선택지 목록 컨테이너의 ref
  const wrapperRef = useRef(null);

  const isValidDestination = COUNTRY_OPTIONS.some(
    (country) => country.name === destination.trim()
  );

  const selectedCountry = isValidDestination 
    ? COUNTRY_OPTIONS.find((country) => country.name === destination.trim()) 
    : null;
  const selectedCountryCode = selectedCountry ? selectedCountry.code : null;

  // 밖을 클릭했을 때 목록 숨기기
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // 입력 필드 포커스 시 전체 목록을 표시
  const handleInputFocus = () => {
    if (destination.trim() === '') {
      setFilteredOptions(COUNTRY_OPTIONS);
    } 
    setShowOptions(true);
  };


// 입력 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    
    // 입력 값에 따라 목록 필터링
    if (value.trim().length > 0) {
      const filtered = COUNTRY_OPTIONS.filter(country =>
        // 대소문자 구분 없이 검색
        country.name.toLowerCase().includes(value.toLowerCase()) 
      );
      setFilteredOptions(filtered);
      setShowOptions(true);
    }
  };
  
  // 선택지 클릭 핸들러
  const handleOptionClick = (countryName) => {
    setDestination(countryName);
    setShowOptions(false); 
    setFilteredOptions([]);  // 필터링 목록 비우기
  };

  // 버튼 텍스트 변경
  const buttonText = isValidDestination
    ? '초안 만들기'
    : '여행지가 정해지지 않았어요.';

  // 버튼 활성화 여부 결정
  const isButtonEnabled = isLoading === false && (isValidDestination || destination.trim() === '');

  // 버튼 동작 정의
  const handleButtonClick = async () => {
    if (isLoading || !isButtonEnabled) return;

    const countryName = destination.trim();
    const countryCode = selectedCountryCode; // selectedCountryCode 사용

    if (isValidDestination) {
      // 1. 여행지가 유효하게 선택된 경우: 백엔드에 저장 요청
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/country`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ countryName: countryName, countryCode: countryCode }),
        });

        if (!response.ok) {
          throw new Error('데이터 저장 실패. 서버 응답이 올바르지 않습니다.');
        }

        const data = await response.json();
        navigate(data.next, { 
          state: { selectedCode: countryCode } 
        });

      } catch (error) {
        console.error('여행지 데이터 저장 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }

    } else {
      // 2. 여행지가 정해지지 않은 경우: 바로 /page1로 이동 (백엔드 통신 없음)
      navigate('/page1');
    }
  };

  return (
    <div className="CommonPage">
      {/* 최상단 영역 */}
      <header className="CommonHeader">
        {/* 중앙 상단: 타이틀 */}
        <h1 className="CommonLogo CommonLogo_Middle">Gift Trip</h1>
        {/* 우측 상단: 로그인 */}
        <button className="CommonLoginBtn">로그인</button>
      </header>

      {/* 메인 */}
      <main className="Page00_Main">
        {/* 질문 + 인풋은 붙여두기 */}
        <div className="Page00_QuestionGroup" ref={wrapperRef}>
          <p className="Page00_Question">어디로 여행을 떠나실 계획이신가요?</p>
          <input
            className="Page00_Input"
            placeholder="여행지를 입력하고 목록에서 선택해주세요."
            value={destination}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={isLoading}
            autoFocus
          />

          {(showOptions && filteredOptions.length > 0) && (
            <div className="Page00_AutoCompleteList">
              {filteredOptions.map((country) => (
                <div 
                  key={country.code} 
                  className="Page00_OptionItem"
                  onClick={() => handleOptionClick(country.name)}
                >
                  {country.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 쪽에 분리된 액션 영역 */}
        <div className="Page00_ActionArea">
          <button
            className="Page00_ActionBtn"
            onClick={handleButtonClick}
            disabled={!isButtonEnabled}
          >
            {/* 로딩 상태에 따라 텍스트 변경 */}
            {isLoading ? '데이터 저장 중...' : buttonText} 
          </button>
        </div>
      </main>
    </div>
  );
}
