// Manager.cjs
// ====================================================================
// 세션 데이터 및 관리 로직 (Page00, 01)
// ====================================================================

const sessionData = {
    countryName: "일본",
    countryCode: "JP",
    questionAnswers: [],
    request: "",
    
    categoryProgress: {
        "숙박": false,
        "액티비티": false,
        "음식": false,
        "인기스팟": false,
    },
    preferenceAnswers: {
        "숙박": [],
        "액티비티": [],
        "음식": [],
        "인기스팟": [],
    },
    finalSelections: [],
    checklistContent: [],
};

const initializeData = () => {
    sessionData.countryName = "일본";
    sessionData.countryCode = "JP";
    sessionData.questionAnswers = [];
    sessionData.request = "";
    sessionData.preferenceAnswers = { "숙박": [], "액티비티": [], "음식": [], "인기스팟": [] };
    sessionData.categoryProgress = { "숙박": false, "액티비티": false, "음식": false, "인기스팟": false };
    sessionData.finalSelections = [];
    sessionData.checklistContent = [];
};

const getData = () => ({ ...sessionData }); 

/**
 * 특정 키 데이터 설정
 */
const setData = (key, value) => {
    if (sessionData.hasOwnProperty(key)) {
        sessionData[key] = value;
        return true;
    }
    return false;
};

/**
 * 여행지 이름 관련 데이터 저장
 */
const saveCountryData = (countryName, countryCode) => {
    if (countryName && countryName.trim().length > 0) {
        setData('countryName', countryName);
        setData('countryCode', countryCode);
        
        setData('recommendation', { 
            ...sessionData.recommendation,
            city: countryName 
        });
        
        return true;
    }
    return false;
};

/**
 * 질문 답변 저장
 */
const saveQuestionAnswers = (questionAnswers) => {
    if (questionAnswers && Array.isArray(questionAnswers) && questionAnswers.length === 10) {
        setData('questionAnswers', questionAnswers);
        return true;
    }
    return false;
};
// ====================================================================
// 추천 사항 api 전달 (Page 02, 03)
// ====================================================================

// 추가 요청 사항 저장
const saveAdditionalRequest = (request) => {
    if (request && request.trim().length>0) {
        setData('request', request);
        return true;
    }
    setData('request', 'No Additional Request');
    return false;
};

// 추가 요청 사항 로드
function getAdditionalRequest() {
    return sessionData.request;
}

// ====================================================================
// 카테고리 및 이미지 경로 관리 로직 (Page04, 05)
// ====================================================================

// 전역 카테고리 목록
const categories = [
  { key: "Stay", name: "숙박" },
  { key: "Activity", name: "액티비티" },
  { key: "Food", name: "음식" },
  { key: "Spots", name: "인기스팟" },
];

function getCategoryName(index) {
    return categories[index] || null;
}

function getCountryCode(){
  return sessionData.countryCode;
}

// Like 부분
const page5Store = []; 
function addPage5Verdict({ countryCode, categoryKey, imageUrl, verdict }) {
  if (!imageUrl || !categoryKey || !verdict) return null;
  const typeName = (categories.find(c => c.key === categoryKey)?.name) || categoryKey; // 한글명
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  page5Store.push({
    id,
    verdict,                // 'like' | 'dislike'
    country: countryCode || "JP",
    type: typeName,         // "숙박" 등
    imageUrl,
    ts: Date.now(),
  });
  return id;
}

// Page6에서 조회용 (기본은 'like'만 반환)
function getPage6Selections({ countryCode, categoryKey, sort = "popular" }) {
  // 카테고리키는 영문("Stay")로 들어오므로 한글 이름 변환
  const typeName = categoryKey
    ? (categories.find(c => c.key === categoryKey)?.name) || categoryKey
    : null;

  let arr = page5Store.filter(x => x.verdict === "like");
  if (countryCode) arr = arr.filter(x => x.country === countryCode);
  if (typeName) arr = arr.filter(x => x.type === typeName);

  // 정렬: 인기순(최근 것 우선으로 간단 처리) / 평점순(동일 처리)
  arr.sort((a, b) => b.ts - a.ts);

  // 프론트에서 쓰기 좋게 맵핑
  return arr.map(x => ({
    id: x.id,
    type: x.type,          // "숙박" 등
    country: x.country,    // "JP"
    imageUrl: x.imageUrl,
    // name/description은 프론트에서 파일명으로 렌더링하므로 생략 가능
  }));
}

// 선택 초기화(디버깅용)
function clearPage5Selections() {
  page5Store.length = 0;
}

module.exports = {
    // 세션 데이터 관리 함수
    initializeData,
    getData,
    setData,
    saveCountryData,
    saveQuestionAnswers,
    getAdditionalRequest,
    saveAdditionalRequest,
    
    // 카테고리/이미지 데이터 및 함수
    categories,
    getCategoryName,
    getCountryCode,

    //Like
    
    addPage5Verdict,
    getPage6Selections,
    clearPage5Selections,
};