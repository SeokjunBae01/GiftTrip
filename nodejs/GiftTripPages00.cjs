const express = require('express');
const { saveCountryData } = require('./Manager.cjs'); 
const router = express.Router();

// 여행지 입력 및 저장
router.post('/page0/country', (req, res) => {
    const { countryName, countryCode } = req.body;
    
    if (countryName) {
        saveCountryData(countryName, countryCode); 
        
        res.status(200).json({ message: `여행지: ${countryName} (${countryCode}) 저장됨`, next: '/page4' });
    } else {
        res.status(200).json({ message: '여행지 미정, 1페이지로 이동', next: '/page1' });
    }
});

module.exports = router;
