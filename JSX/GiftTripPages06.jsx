import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const handleCreate = () => {
    navigate("/page7");
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page06_Main">
        <h2 className="Page06_Title">나의 선택</h2>
        <div className="Page06_CategoryTabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`Page06_Btn Page06_CategoryBtn ${selectedCategory === category ? "btn-bold" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="Page06_SortContainer">
          {sortOptions.map((option) => (
            <button
              key={option}
              className={`Page06_SortBtn ${selectedSort === option ? "btn-bold" : ""}`}
              onClick={() => setSelectedSort(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="Page06_CardsGrid">
          {getFilteredSelections().map((selection) => {
            const isSelected = selectedItems.includes(selection.id);
            return (
              <div
                className={`Page06_Card ${isSelected ? "Page06_SelectedCard" : ""}`}
                key={selection.id}
                onClick={() => handleCardClick(selection.id)}
              >
                <div className="Page06_CardImagePlaceholder"></div>
                <div className="Page06_CardContent">
                  <h3 className="Page06_CardTitle">{selection.name}</h3>
                  <p className="Page06_CardDescription">{selection.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="Page06_Actions">
          <button className="Page06_btn Page06_CreateBtn" onClick={handleCreate}>
            초안 만들기
          </button>
        </div>
      </main>
    </div>
  );
}
