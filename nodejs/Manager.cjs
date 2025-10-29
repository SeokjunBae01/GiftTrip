const sessionData = {
    countryName: "일본",
    countryCode: "JP",
    questionAnswers: [],
    request: "",
    
    recommendation: {
        typeSummary: "도보 이동과 미식 탐방을 즐기는 타입이에요.",
        tags: ["미식", "도시", "야경"]
    },
};//city 변수 없앰

const setData = (key, value) => {
    if (sessionData.hasOwnProperty(key)) {
        sessionData[key]=value;
        return true;
    }
    return false;
};

const saveAdditionalRequest = (request) => {
    if (request && request.trim().length>0) {
        setData('request', request);
        return true;
    }
    setData('request', 'No Additional Request');
    return false;
};//추가요청사항 저장

const getData = () => ({...sessionData});

function getAdditionalRequest() {
    return sessionData.request;
}//추가요청사항 불러옴

module.exports={
    getData,
    setData,
    saveAdditionalRequest,
    getAdditionalRequest,
};