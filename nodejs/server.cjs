// server.cjs
const express = require("express");
const cors = require("cors");
const path = require("path");

const page00Router = require("./GiftTripPages00.cjs");
const page01Router = require("./GiftTripPages01.cjs");
const page02Router = require("./GiftTripPages02.cjs");
const page03Router = require("./GiftTripPages03.cjs");
const page04Router = require("./GiftTripPages04.cjs"); // ⚠️ pictures 라우트는 제거된 버전
const page05Router = require("./GiftTripPages05.cjs");
const page06Router = require("./GiftTripPages06.cjs");
const API = require("./InitialSettingAPI.cjs");

const { requestLogger, adminRouter, log } = require("./AdminLogger.cjs");
const AdminPage = require("./AdminPage.cjs");
const { attachImageAPIs } = require("./UpLoadingImages.cjs");

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일 (public/KR/Stay/xxx.jpg 등)
const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/", express.static(PUBLIC_DIR));

// 요청 로깅
app.use(requestLogger({ onlyPrefixes: ["/api", "/KR", "/JP"] }));

// 일반 API 라우터
app.use("/api", page00Router);
app.use("/api", page01Router);
app.use("/api", page02Router);
app.use("/api", page03Router);
app.use("/api", page04Router);
app.use("/api", page05Router);
app.use("/api", page06Router);
app.use("/api", API);

// ✅ 이미지 API: /api/page4/pictures/:country/:category 제공
attachImageAPIs(app, { publicDir: PUBLIC_DIR });

// 관리자 페이지/로그
app.use(AdminPage);
app.use(adminRouter);

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
  log("server.cjs started");
});