import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/GiftTripPages01.css";
import "../CSS/common.css"

const API_BASE_URL = "http://localhost:3000/api/page1";

const questions = [
  "해변에 있는 휴양지를 원하시나요?",
  "산이나 자연을 즐기고 싶으신가요?",
  "액티비티(스포츠, 레저)를 좋아하시나요?",
  "도시 관광을 선호하시나요?",
  "맛집 탐방을 중요하게 생각하시나요?",
  "역사적 유적지를 좋아하시나요?",
  "쇼핑을 즐기시나요?",
  "야경과 야경 명소를 좋아하시나요?",
  "온천이나 휴식을 중요하게 생각하시나요?",
  "혼자보다는 사람 많은 곳을 선호하시나요?",
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
        <button className="CommonLoginBtn">로그인</button>
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
