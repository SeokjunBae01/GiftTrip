const express = require("express");
const router = express.Router();
const { getCountryCode, categories } = require("./Manager.cjs");
const fs = require("fs");
const path = require("path");

// 국가 코드 무엇인지 받아오는 API
router.get("/CountryCode", (req, res) => {
    try{
        const code = getCountryCode();
        res.json({ code});
    } catch(e){
        res.status(500).json({ error: "국가 코드를 가져올 수 없습니다." });
    }
});

// 카테고리 받아오기
router.get("/TripCategories", (req, res) => {
    try{
        const type = categories;
        res.json({type});
    } catch(e){
        res.status(500).json({ error: "카테고리 불러오기 불가능"});
    }
});

const app = express();
// 대표 이미지 세팅 API
app.use(express.static(path.join(__dirname, "public")));

module.exports = router;