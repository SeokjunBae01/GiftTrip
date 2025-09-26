import React, { useState } from "react";
import "../CSS/GiftTripPages06.css";

const mockSelections = [
  { id: 1, type: "숙박", name: "숙박1", description: "숙박1 설명" },
  { id: 2, type: "액티비티", name: "액티비티1", description: "액티비티1 설명" },
  { id: 3, type: "음식", name: "음식1", description: "음식1 설명" },
  { id: 4, type: "인기 스팟", name: "스팟1", description: "스팟1 설명" },
  { id: 5, type: "숙박", name: "숙박2", description: "숙박2 설명" },
  { id: 6, type: "액티비티", name: "액티비티2", description: "액티비티2 설명" },
  { id: 7, type: "음식", name: "음식2", description: "음식2 설명" },
  { id: 8, type: "인기 스팟", name: "스팟2", description: "스팟2 설명" },
  { id: 9, type: "숙박", name: "숙박3", description: "숙박3 설명" }
];

const categories = ["숙박", "액티비티", "음식", "인기 스팟"];
const sortOptions = ["인기순", "평점순"];

export default function MySelectionsPage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("숙박");
  const [selectedSort, setSelectedSort] = useState("인기순");

  const getFilteredSelections = () => {
    return mockSelections.filter((selection) => selection.type === selectedCategory);
  };

  const handleCardClick = (itemId) => {
    setSelectedItems((prevSelectedItems) => {
      if (prevSelectedItems.includes(itemId)) {
        return prevSelectedItems.filter((id) => id !== itemId);
      } else {
        return [...prevSelectedItems, itemId];
      }
    });
  };

  return (
    <div className="pg06 page">
      <header className="header">
        <h1 className="logo">Gift Trip</h1>
        <button className="loginBtn">로그인</button>
      </header>
      
      <main className="main">
        <h2 className="title">나의 선택</h2>
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`btn category-btn ${selectedCategory === category ? "btn-bold" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="sort-container">
          {sortOptions.map((option) => (
            <button
              key={option}
              className={`sort-btn ${selectedSort === option ? "btn-bold" : ""}`}
              onClick={() => setSelectedSort(option)}
            >
              {option}
            </button>
          ))}
        </div>
        
        <div className="cards-grid">
          {getFilteredSelections().map((selection) => {
            const isSelected = selectedItems.includes(selection.id);
            return (
              <div
                className={`card ${isSelected ? "selected-card" : ""}`}
                key={selection.id}
                onClick={() => handleCardClick(selection.id)}
              >
                <div className="card-image-placeholder"></div>
                <div className="card-content">
                  <h3 className="card-title">{selection.name}</h3>
                  <p className="card-description">{selection.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="actions">
          <button className="btn create-draft-btn">초안 만들기</button>
        </div>
      </main>
    </div>
  );
}
