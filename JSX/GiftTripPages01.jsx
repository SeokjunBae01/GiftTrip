import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/GiftTripPages01.css";

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

export default function QuestionPage({ setAnswers, setPage }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState(
    Array(questions.length).fill(null)
  );

  const handleAnswer = (answer) => {
    const newAnswers = [...localAnswers];
    newAnswers[currentIndex] = answer;
    setLocalAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAnswers(newAnswers);
      navigate("/") // 이동할 페이지 입력 
    }
  };

  return (
    <div className="pg01 page">
      <header className="header">
        <h1 className="logo">Gift Trip</h1>
        <button className="loginBtn">로그인</button>
      </header>

      <main className="main">
        <p className="description">질문을 읽으시고 답변을 골라주세요.</p>
        <div className="questionBox">{questions[currentIndex]}</div>
        <div className="actions">
          <button className="btn" onClick={() => handleAnswer("Yes")}>
            Yes
          </button>
          <button className="btn" onClick={() => handleAnswer("No")}>
            No
          </button>
        </div>
        <div className="progressStatus">
          {currentIndex + 1} / {questions.length}
        </div>
      </main>
    </div>
  );
}