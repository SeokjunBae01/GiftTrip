// GiftTripPages06.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../JSX/Data.jsx";
import "../CSS/GiftTripPages06.css";
import "../CSS/Common.css";

const categories = ["도시", "액티비티", "음식", "인기 스팟"];
const sortOptions = ["인기순", "평점순"];

const korToEng = {
  "도시": "Stay",
  "액티비티": "Activity",
  "음식": "Food",
  "인기 스팟": "Spots",
};

const SESSION_KEY = "gt.selectedCode";

// ✅ 파일명 파싱: "제목-내용.확장자" → {title, desc}
function parseTitleAndDesc(url) {
  try {
    const decoded = decodeURIComponent(url || "");
    const base = (decoded.split("/").pop() || "").split("?")[0];
    const noExt = base.replace(/\.[^/.]+$/, "");
    const parts = noExt.split("-");
    if (parts.length === 1) return { title: parts[0].trim(), desc: "" };
    const title = parts[0].trim();
    const desc = parts.slice(1).join("-").trim();
    return { title, desc };
  } catch {
    return { title: "", desc: "" };
  }
}

export default function MySelectionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { countryCode } = useAppData();

  const selectedCodeFromState = location.state?.selectedCode || null;

  const sessionCode = (() => {
    try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
  })();

  // 🇯🇵 최종 국가 코드 결정
  const effectiveCode = useMemo(
    () => selectedCodeFromState || sessionCode || countryCode || "",
    [selectedCodeFromState, sessionCode, countryCode]
  );

  // 세션에 최신 코드 백업
  useEffect(() => {
    if (effectiveCode) {
      try { sessionStorage.setItem(SESSION_KEY, effectiveCode); } catch {}
    }
  }, [effectiveCode]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("도시");
  const [selectedSort, setSelectedSort] = useState("인기순");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // ✅ 추천 문장(처음 1회만 고정)
  const [tagline, setTagline] = useState("");
  const taglineFrozenRef = useRef(false);

  // 국가 코드 바뀌면 문장 초기화(새 국가에서만 재생성)
  useEffect(() => {
    taglineFrozenRef.current = false;
    setTagline("");
  }, [effectiveCode]);

  // 🔄 좋아요 목록 로드 (카테고리/정렬 바뀔 때 재조회 OK)
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setError("");

        const params = new URLSearchParams();
        if (effectiveCode) params.set("countryCode", effectiveCode);

        const categoryKey = korToEng[selectedCategory];
        if (categoryKey) params.set("categoryKey", categoryKey);
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

    if (effectiveCode) load();

    return () => { ignore = true; };
  }, [effectiveCode, selectedCategory, selectedSort]);

  // 탭 필터
  const filtered = useMemo(() => {
    return items.filter(it => it.type === selectedCategory);
  }, [items, selectedCategory]);

  // ✅ 상단 도시 설명(첫 이미지의 “내용” 부분)
  const headerDesc = useMemo(() => {
    const target = filtered[0] || items[0];
    if (!target) return "";
    const { desc } = parseTitleAndDesc(target.imageUrl);
    return desc;
  }, [filtered, items]);

  // ✅ 추천 문장: effectiveCode 바뀔 때 '최초 1회'만 로드 (카테고리 변화 무시)
  useEffect(() => {
    let ignore = false;

    async function loadTaglineOnce() {
      if (!effectiveCode) return;
      if (taglineFrozenRef.current) return; // 이미 고정되었으면 스킵

      try {
        const params = new URLSearchParams({ countryCode: effectiveCode });
        const res = await fetch(`http://localhost:3000/api/page6/tagline?${params.toString()}`);
        if (!res.ok) throw new Error(`tagline API ${res.status}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setTagline(data.tagline || "");
          taglineFrozenRef.current = true; // 🔒 고정
        }
      } catch (e) {
        console.error("[Page06] tagline error:", e);
        if (!ignore) {
          setTagline("");              // 표시는 생략(원하면 폴백 문장 넣기 가능)
          taglineFrozenRef.current = true; // 실패했어도 탭 전환마다 재시도하지 않음
        }
      }
    }

    loadTaglineOnce();
    return () => { ignore = true; };
  }, [effectiveCode]); // ❗카테고리/정렬/아이템 의존성 넣지 말기

  const handleCardClick = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCreate = () => {
    navigate("/page7", { state: { selectedItemIds: selectedItems, selectedCode: effectiveCode } });
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo CommonLogo_Left">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page06_Main">
        <h2 className="Page06_Title">나의 선택</h2>
        {/* ✅ 추천 문장: 카테고리 바꿔도 그대로 유지 */}
        {tagline && (
          <p className="Page06_Subtitle" style={{ marginTop: 4, opacity: 0.8 }}>
            {tagline}
          </p>
        )}
        {/* (옵션) 도시 설명이 있으면 표시하고 싶다면 아래 주석 해제
        {headerDesc && (
          <p className="Page06_Subtitle" style={{ marginTop: 2, opacity: 0.7 }}>
            {headerDesc}
          </p>
        )}
        */}

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
              const { title, desc } = parseTitleAndDesc(selection.imageUrl);

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
                      alt={title}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="Page06_CardImageWrapper">
                      <img
                        className="Page06_CardImage"
                        src={selection.imageUrl || "https://via.placeholder.com/480x640?text=No+Image"}
                        alt={title}
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/480x640?text=No+Image"; }}
                      />
                    </div>
                  )}

                  {/* 내용 */}
                  <div className="Page06_CardContent">
                    <h3 className="Page06_CardTitle">{title}</h3>
                    {desc && <p className="Page06_CardDescription">{desc}</p>}
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
