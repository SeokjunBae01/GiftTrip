// GiftTripPages06.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../JSX/Data.jsx";  // countryCode
import "../CSS/GiftTripPages06.css";
import "../CSS/Common.css";

const categories = ["숙박", "액티비티", "음식", "인기 스팟"];
const sortOptions = ["인기순", "평점순"]; // 평점순은 동일 동작(확장 예정)

const korToEng = {
  "숙박": "Stay",
  "액티비티": "Activity",
  "음식": "Food",
  "인기 스팟": "Spots",
};

export default function MySelectionsPage() {
  const navigate = useNavigate();
  const { countryCode } = useAppData();

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("숙박");
  const [selectedSort, setSelectedSort] = useState("인기순");

  const [items, setItems] = useState([]);      // 서버에서 받은 전체 아이템
  const [error, setError] = useState("");

  // 서버에서 좋아요 목록 로드
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setError("");
        const params = new URLSearchParams();
        if (countryCode) params.set("countryCode", countryCode);

        // 선택된 카테고리만 서버로 필터하려면 아래 주석 해제
        const categoryKey = korToEng[selectedCategory];
        if (categoryKey) params.set("categoryKey", categoryKey);

        // 인기순/평점순 → 서버쪽은 임시로 동일 동작(최근순)
        params.set("sort", selectedSort === "인기순" ? "popular" : "recent");

        const url = `http://localhost:3000/api/page6/selections?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API 실패: ${res.status}`);
        const data = await res.json();
        if (!ignore) setItems(data.items || []);
      } catch (e) {
        console.error("[Page06] load error:", e);
        if (!ignore) setError("목록을 불러오지 못했습니다.");
      }
    };

    load();
    return () => { ignore = true; };
  }, [countryCode, selectedCategory, selectedSort]);

  // 탭 필터(클라이언트 단에서 한 번 더 필터링; 서버에서 필터했으면 사실상 동일)
  const filtered = useMemo(() => {
    return items.filter(it => it.type === selectedCategory);
  }, [items, selectedCategory]);

  const handleCardClick = (itemId) => {
    setSelectedItems(prev => prev.includes(itemId)
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]);
  };

  const handleCreate = () => {
    // 선택된 아이템 id 목록을 다음 페이지로 전달
    navigate("/page7", { state: { selectedItemIds: selectedItems, countryCode: countryCode } });
    console.log(selectedItems);
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

        {error && <p style={{ color: "tomato" }}>{error}</p>}

        <div className="Page06_CardsGrid">
          {filtered.length > 0 ? (
            filtered.map((selection) => {
              const isSelected = selectedItems.includes(selection.id);
              return (
                <div
                  className={`Page06_Card ${isSelected ? "Page06_SelectedCard" : ""}`}
                  key={selection.id}
                  onClick={() => handleCardClick(selection.id)}
                >
                  {/* 이미지 */}
                  {selection.imageUrl ? (
                    <img
                      className="Page06_CardImage"
                      src={selection.imageUrl}
                      alt={selection.name}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="Page06_CardImageWrapper">
                      <img
                        className="Page06_CardImage"
                        src={selection.imageUrl || "https://via.placeholder.com/480x640?text=No+Image"}
                        alt={selection.name}
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/480x640?text=No+Image"; }}
                      />
                    </div>
                  )}

                  {/* 내용 */}
                  <div className="Page06_CardContent">
                    <h3 className="Page06_CardTitle">{selection.name}</h3>
                    <p className="Page06_CardDescription">{selection.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p>선택된 항목이 없습니다.</p>
          )}
        </div>

        <div className="Page06_Actions">
          <button className="Page06_btn Page06_CreateBtn" onClick={handleCreate} disabled={!selectedItems.length}>
            초안 만들기
          </button>
        </div>
      </main>
    </div>
  );
}