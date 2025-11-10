// GiftTripPages04.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../JSX/Data.jsx";
import "../CSS/GiftTripPages04.css";
import "../CSS/Common.css";

export default function GiftTripPages04() {
  const navigate = useNavigate();
  const location = useLocation();

  // Page00 또는 이전 페이지에서 전달받은 코드 우선
  const codeFromState = location.state?.selectedCode;

  // Context: { loading, countryCode, categories: [{key,name}] }
  const { loading, countryCode, categories } = useAppData();

  const [thumbnails, setThumbnails] = useState({}); // { [key]: url|null }
  const [completed, setCompleted] = useState([]);   // ["도시","액티비티","음식","인기스팟"]

  // ✅ 최상위에서만 훅 호출: 유효 국가코드
  const effectiveCode = useMemo(
    () => codeFromState || countryCode,
    [codeFromState, countryCode]
  );

  // 완료 상태 로드
  useEffect(() => {
    const loadCompleted = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("completedCategories")) || [];
        setCompleted(Array.isArray(stored) ? stored : []);
      } catch {
        setCompleted([]);
      }
    };
    loadCompleted();
    const onFocus = () => loadCompleted();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [location.key]);

  // ✅ Page04: 진입 시 자동 초기화 (0→4, 3→4는 초기화 / 5→4, reload는 스킵)
  useEffect(() => {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const isReload = nav && nav.type === "reload";
    if (isReload) return; // 새로고침은 유지

    const fromState = location.state?.from;
    const fromPage5Flag = sessionStorage.getItem("gt.fromPage5") === "1";

    // 1) page0/page3에서 왔으면 항상 초기화 (플래그 잔여 무시)
    if (fromState === "page0" || fromState === "page3") {
      sessionStorage.removeItem("gt.fromPage5");
      (async () => {
        try {
          localStorage.removeItem("completedCategories");
          setCompleted([]);
          const res = await fetch("http://localhost:3000/api/page5/likes/reset", { method: "POST" });
          await res.json().catch(() => ({}));
        } catch (e) {
          console.warn("[Page04] 강제 초기화 오류(무시 가능)", e);
        }
      })();
      return;
    }

    // 2) 5→4 복귀면 초기화 스킵
    if (fromState === "page5" || fromPage5Flag) {
      sessionStorage.removeItem("gt.fromPage5"); // 일회성 플래그 정리
      return;
    }

    // 3) 그 외 진입(예: 직접 이동 등)에는 기본 초기화
    (async () => {
      try {
        localStorage.removeItem("completedCategories");
        setCompleted([]);
        const res = await fetch("http://localhost:3000/api/page5/likes/reset", { method: "POST" });
        await res.json().catch(() => ({}));
      } catch (e) {
        console.warn("[Page04] 초기화 중 오류(무시 가능)", e);
      } finally {
        // 혹시 남아있을 수 있는 플래그 정리
        sessionStorage.removeItem("gt.fromPage5");
      }
    })();
  }, [location.key, location.state?.from]);

  // 썸네일 로딩
  useEffect(() => {
    if (loading) return;
    if (!effectiveCode || categories.length === 0) return;

    const fetchThumbnails = async () => {
      const newThumbs = {};
      for (const { key, name } of categories) {
        try {
          const url = `http://localhost:3000/api/page4/pictures/${effectiveCode}/${key}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json(); // { success, country, category, pictures: [...] }
          newThumbs[key] = data.pictures?.[0] || null;
        } catch (e) {
          console.error(`${name} 썸네일 불러오기 실패`, e);
          newThumbs[key] = null;
        }
      }
      setThumbnails(newThumbs);
    };

    fetchThumbnails();
  }, [loading, categories, effectiveCode]);

  // 전부 완료?
  const allDone = useMemo(() => {
    if (!categories || categories.length === 0) return false;
    const done = new Set(completed); // 이름(name) 기준 저장 가정
    return categories.every(({ name }) => done.has(name));
  }, [categories, completed]);

  // 카테고리 시작 버튼
  const handleStart = (name, index) => {
    navigate("/page5", {
      state: {
        categoryIndex: index,
        categoryName: name,
        selectedCode: effectiveCode, // ✅ 최신 코드 함께 전달
      },
    });
  };

  const handleNext = () => {
    navigate("/page6", { state: { from: "page4", selectedCode: effectiveCode } });
  };

  return (
    <div className="CommonPage">
      <header className="CommonHeader">
        <h1 className="CommonLogo Page04_Logo">Gift Trip</h1>
        <button className="CommonLoginBtn">로그인</button>
      </header>

      <main className="Page04_Main">
        {loading ? (
          <div className="Page04_ThumbnailPlaceholder">로딩 중…</div>
        ) : categories.length === 0 ? (
          <div className="Page04_ThumbnailPlaceholder">카테고리가 없습니다</div>
        ) : (
          categories.map(({ key, name }, index) => {
            const isDone = completed.includes(name);
            return (
              <section className="Page04_Card" key={key}>
                <div className="CommonFrame Page04_TitleFrame">{name}</div>

                <div className="Page04_Thumbnail">
                  {thumbnails?.[key] ? (
                    <img
                      src={thumbnails[key]}
                      alt={`${name} 썸네일`}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="Page04_ThumbnailPlaceholder">이미지 없음</div>
                  )}
                </div>

                <button
                  className={`CommonFrame Page04_ActionFrame ${isDone ? "Completed" : ""}`}
                  onClick={() => handleStart(name, index)}
                  disabled={isDone}
                >
                  {isDone ? "완료" : "시작하기"}
                </button>
              </section>
            );
          })
        )}
      </main>

      {/* ✅ 전부 완료 시 바텀 CTA */}
      {allDone && (
        <div className="Page04_FooterCTA">
          <button className="btn primary Page04_NextBtn" onClick={handleNext}>
            다음 넘어가기
          </button>
        </div>
      )}

      <footer className="Pages04_Footer">
        선호도를 입력하고 맞춤형 여행 초안을 받아보세요!
      </footer>
    </div>
  );
}