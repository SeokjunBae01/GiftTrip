const express = require('express');
const { saveQuestionAnswers } = require('./Manager.cjs');
const router = express.Router();

// 10개 질문 답변 저장
router.post('/page1/answers', (req, res) => {
    const { questionAnswers } = req.body;
    
    if (saveQuestionAnswers(questionAnswers)) {
        res.status(200).json({ message: '10개 답변 저장 완료', next: '/page2' });
    } else {
        res.status(400).json({ error: '답변 배열이 올바르지 않습니다.' });
    }
});

module.exports = router;
