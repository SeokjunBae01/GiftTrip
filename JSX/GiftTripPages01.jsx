import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/GiftTripPages01.css";

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

  const handleAnswer = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate("/page2"); 
    }
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page01_main">
        <p className="Page01_description">질문을 읽으시고 답변을 골라주세요.</p>
        <div className="Page01_questionBox">{questions[currentIndex]}</div>
        <div className="Page01_Actions">
          <button className="Page01_btn" onClick={handleAnswer}>
            Yes
          </button>
          <button className="Page01_btn" onClick={handleAnswer}>
            No
          </button>
        </div>
        <div className="Page01_progressStatus">
          {currentIndex + 1} / {questions.length}
        </div>
      </main>
    </div>
  );
}
