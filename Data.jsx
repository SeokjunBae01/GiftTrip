import { createContext, useContext, useEffect, useRef, useState } from "react";

const AppDataCtx = createContext(null);

export function AppDataProvider({ children }) {
  const [countryCode, setCountryCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 개발 모드 StrictMode로 인한 중복 실행 방지 (선택)
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;   // dev에서 두 번 실행되는 것 막기
    didInit.current = true;

    (async () => {
      try {
        console.log("[AppDataProvider] API 요청 시작");

        const [r1, r2] = await Promise.all([
          fetch("http://localhost:3000/api/TripCategories"),
          fetch("http://localhost:3000/api/CountryCode"),
        ]);

        const cats = await r1.json();   // 실제 응답: { type:[...] }
        const code = await r2.json();   // { code:"JP" }

        console.log("[TripCategories 응답]", cats);
        console.log("[CountryCode 응답]", code);

        // ✅ 다양한 응답 키 방어적으로 처리
        const catsArr =
          Array.isArray(cats.categories) ? cats.categories :
          Array.isArray(cats.type) ? cats.type :
          Array.isArray(cats.data?.categories) ? cats.data.categories :
          [];

        setCategories(catsArr);
        setCountryCode(code.code ?? code.countryCode ?? "");
      } catch (e) {
        console.error("[AppDataProvider] 초기 데이터 로드 실패:", e);
        setCategories([]);
        setCountryCode("");
      } finally {
        setLoading(false);
        console.log("[AppDataProvider] 로딩 완료");
      }
    })();
  }, []);

  return (
    <AppDataCtx.Provider value={{ loading, countryCode, categories }}>
      {children}
    </AppDataCtx.Provider>
  );
}

export const useAppData = () => useContext(AppDataCtx);