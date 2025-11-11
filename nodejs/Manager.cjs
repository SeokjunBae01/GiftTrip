// Manager.cjs
// ====================================================================
// 세션 데이터 및 관리 로직 (Page00, 01)
// ====================================================================

const sessionData = {
    countryName: "일본",
    countryCode: "JP",
    questions: [  "영어가 공용어인 여행지를 선호하시나요?",
                  "높은 빌딩과 스카이라인이 아름다운 야경이 있는 대도시 여행을 좋아하시나요?",
                  "해변과 따뜻한 햇살이 있는 지중해 인근 휴양지를 좋아하시나요?",
                  "박물관을 방문해 서양 예술 작품이나 역사 전시를 감상하는 것을 즐기시나요?",
                  "중화권 국가 여행에 관심이 있으신가요?",
                  "조용하고 자연이 중심인 평온한 여행을 원하시나요?",
                  "현지 음식과 디저트를 탐방하는 미식 여행을 즐기시나요?",
                  "고대 로마 유적이나 르네상스 예술에 특히 관심이 있으신가요?",
                  "비교적 넓은 면적의 나라에서 다채로운 여행을 즐기고 싶으신가요?",
                  "쇼핑거리나 브랜드 매장을 둘러보는 걸 즐기시나요?",
                  "넓은 자연과 다양한 기후 속에서 여러 지역을 탐험하며 여행하는 것을 좋아하시나요?",
                  "비행 시간이 길지 않은 아시아 여행지를 선호하시나요?",
                  "고성이나 중세도시 같은 고전적인 유럽 감성을 느끼고 싶으신가요?",
                  "교회나 성당 같은 종교 건축물에 흥미가 있으신가요?",
                  "혼자 떠나는 여행을 선호하시나요?",
                  "계획을 꼼꼼하고 철저하게 세우고 따르는 것을 좋아하시나요?"
                ],
    questionAnswers: [""],
    request: "",
    recommendation: {
        typeSummary: "",
        tags: [""]
    },
    categoryProgress: {
        "도시": false,
        "액티비티": false,
        "음식": false,
        "인기스팟": false,
    },
    preferenceAnswers: {
        "도시": [],
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
    sessionData.preferenceAnswers = { "도시": [], "액티비티": [], "음식": [], "인기스팟": [] };
    sessionData.categoryProgress = { "도시": false, "액티비티": false, "음식": false, "인기스팟": false };
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
    if (questionAnswers && Array.isArray(questionAnswers) && questionAnswers.length === 16) {
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
  { key: "Stay", name: "도시" },
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
    type: typeName,         // "도시" 등
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
    type: x.type,          // "도시" 등
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