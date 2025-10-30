    const express = require('express');
    const {saveAdditionalRequest, getData} = require('./Manager.cjs');
    const router = express.Router();

    //추가요청사항 입력 및 저장
    router.post('/page2/request', (req, res) => {
        const {request} = req.body;
        console.log("[백엔드 로그] 받은 추가요청사항:", request);  // 👈 여기에 찍힘
        
        if (request) {
            saveAdditionalRequest(request);
            res.status(200).json({ message: `추가요청사항: ${request} 저장됨`, next: '/page3' });
        } else {
            saveAdditionalRequest('');
            res.status(200).json({message: `추가요청사항 없음`, next: '/page3'});
        }

        const {questionAnswers } = getData();//LLM에게 보낼 데이터
        /*LLM API로 추천 받고, Manager.cjs에 countryName, recommendation의 tags, recommendation의 typeSummary 저장*/
    });


    module.exports=router;