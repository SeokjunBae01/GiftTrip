const express = require('express');
const {getData} = require('./Manager.cjs');
const router = express.Router();

router.get('/recommendations', (req, res) => {
    const { countryName, recommendation: { typeSummary, tags } } = getData();//프론트엔드로 돌려보낼 데이터
    return res.json({countryName, typeSummary, tags});
});

module.exports=router;