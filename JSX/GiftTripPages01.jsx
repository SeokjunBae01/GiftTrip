import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/GiftTripPages01.css";
import "../CSS/common.css"

const API_BASE_URL = "http://localhost:3000/api/page1";

const questions = [
  "영어가 공용어인 여행지를 선호하시나요?",
  "높은 빌딩과 스카이라인이 아름다운 야경이 있는 대도시 여행을 좋아하시나요?",
  "해변과 따뜻한 햇살이 있는 지중해 인근 휴양지를 좋아하시나요?",
  "박물관을 방문해 서양 예술 작품이나 역사 전시를 감상하는 것을 즐기시나요?",
  "중화권 국가 여행에 관심이 있으신가요?",
  "조용하고 자연이 중심인 평온한 여행을 원하시나요?",
  "현지 음식과 디저트를 탐방하는 미식 여행을 즐기시나요?",
  "고대 로마 유적이나 르네상스 예술에 특히 관심이 있으신가요?",
  "비교적 넓은 면적의 나라에서 다채로운 여행을 즐기고 싶으신가요?",
  "쇼핑거리나 브랜드 매장을 둘러보는 걸 즐기시나요?",
  "넓은 자연과 다양한 기후 속에서 여러 지역을 탐험하며 여행하는 것을 좋아하시나요?",
  "비행 시간이 길지 않은 아시아 여행지를 선호하시나요?",
  "고성이나 중세도시 같은 고전적인 유럽 감성을 느끼고 싶으신가요?",
  "교회나 성당 같은 종교 건축물에 흥미가 있으신가요?",
  "혼자 떠나는 여행을 선호하시나요?",
  "계획을 꼼꼼하고 철저하게 세우고 따르는 것을 좋아하시나요?"
];

export default function QuestionPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 답변을 백엔드로 전송하고 페이지 이동
  const sendAnswersAndNavigate = async (finalAnswers) => {
    setIsLoading(true);
    try {
      const payload = { questionAnswers: finalAnswers };
      await axios.post(`${API_BASE_URL}/answers`, payload);
      navigate("/page2"); 
    } catch (error) {
      console.error("1단계 답변 저장 실패:", error);
      alert("답변 저장 중 오류가 발생했습니다. 서버 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 답변 응답
  const handleAnswer = (answerValue) => {
    const newAnswers = [...answers, answerValue];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      sendAnswersAndNavigate(newAnswers);
    }
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo">Gift Trip</h1>
        {/*<button className="CommonLoginBtn">로그인</button>*/}
      </header>

      <main className="Page01_Main">
        <p className="Page01_Description">질문을 읽으시고 답변을 골라주세요.</p>
        <div className="Page01_QuestionBox">{questions[currentIndex]}</div>
        <div className="Page01_Actions">
          <button 
            className="Page01_Btn" 
            onClick={() => handleAnswer(true)}
            disabled={isLoading}
          >
            Yes
          </button>
          <button 
            className="Page01_Btn" 
            onClick={() => handleAnswer(false)}
            disabled={isLoading}
          >
            No
          </button>
        </div>
        <div className="Page01_ProgressStatus">
          {currentIndex + 1} / {questions.length}
        </div>
        {isLoading && <p style={{ textAlign: 'center', marginTop: '20px' }}>처리 중...</p>}
      </main>
    </div>
  );
}
