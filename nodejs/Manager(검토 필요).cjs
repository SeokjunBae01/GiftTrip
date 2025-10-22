const path = require("path");

// ====================================================================
// 세션 데이터 및 관리 로직 (Page00, 01)
// ====================================================================

const sessionData = {
    countryName: "Tokyo",
    questionAnswers: [],
    request: "",
    
    recommendation: {
        city: "Tokyo",
        typeSummary: "도보 이동과 미식 탐방을 즐기는 타입이에요.",
        tags: ["미식", "도시", "야경"],
    },
    
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
    sessionData.countryName = "Tokyo";
    sessionData.questionAnswers = [];
    sessionData.request = "";
    sessionData.recommendation.city = "Tokyo";
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
const saveCountryData = (countryName) => {
    if (countryName && countryName.trim().length > 0) {
        setData('countryName', countryName);
        
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
// 카테고리 및 이미지 경로 관리 로직 (Page04, 05)
// ====================================================================

// 전역 카테고리 목록
const categories = ["Stay", "Activity", "Food", "Spots"];

// 전역 카테고리 이미지 경로
const categoriesPicture = {
    Stay: [
        path.join(__dirname, "../public/Picture/Stay/stay1.png"),
        path.join(__dirname, "../public/Picture/Stay/stay2.png"),
    ],
    Activity: [
        path.join(__dirname, "../public/Picture/Activity/activity1.png"),
        path.join(__dirname, "../public/Picture/Activity/activity2.png"),
    ],
    Food: [
        path.join(__dirname, "../public/Picture/Food/food1.png"),
        path.join(__dirname, "../public/Picture/Food/food2.png"),
    ],
    Spots: [
        path.join(__dirname, "../public/Picture/Spots/spot1.png"),
        path.join(__dirname, "../public/Picture/Spots/spot2.png"),
    ],
};

// 인덱스로 카테고리 이름 가져오기
function getCategoryName(index) {
    return categories[index] || null;
}

// 카테고리명으로 이미지 경로 배열 가져오기
function getCategoryPictures(categoryName) {
    return categoriesPicture[categoryName] || [];
}

// 카테고리명으로 이미지 개수 가져오기
function getCategoryPictureCount(categoryName) {
    return categoriesPicture[categoryName]
        ? categoriesPicture[categoryName].length
        : 0;
}



module.exports = {
    // 세션 데이터 관리 함수
    initializeData,
    getData,
    setData,
    saveCountryData,
    saveQuestionAnswers,
    
    // 카테고리/이미지 데이터 및 함수
    categories,
    categoriesPicture,
    getCategoryName,
    getCategoryPictures,
    getCategoryPictureCount,
};