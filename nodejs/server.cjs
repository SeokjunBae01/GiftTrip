const express = require("express");
const cors = require("cors");
const path = require("path");
const page04Router = require("./GiftTripPages04.cjs");
const page05Router = require("./GiftTripPages05.cjs");

const app = express();
app.use(cors());
app.use(express.json());

// 정적 폴더
app.use("/Picture", express.static(path.join(__dirname, "../public/Picture")));

// 라우터 등록
app.use("/api", page04Router);
app.use("/api", page05Router);

const PORT = 3000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));