// server.cjs (발췌)
const express = require("express");
const cors = require("cors");
const path = require("path");

const page04Router = require("./GiftTripPages04.cjs");
const page05Router = require("./GiftTripPages05.cjs");
const API = require("./InitialSettingAPI.cjs");

// ⬇ 추가
const { requestLogger, adminRouter, log } = require("./AdminLogger.cjs");
const AdminPage = require("./AdminPage.cjs");
const { attachImageAPIs } = require("./UpLoadingImages.cjs");

const app = express();
app.use(cors());
app.use(express.json());

// 정적
const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/", express.static(PUBLIC_DIR));

// 요청 로거: /api와 국가 정적 경로만 추적
app.use(requestLogger({ onlyPrefixes: ["/api", "/KR", "/JP"] }));

// 기존 API
app.use("/api", page04Router);
app.use("/api", page05Router);
app.use("/api", API);

// 이미지 API 부착 (레지스트리/엔드포인트)
attachImageAPIs(app, { publicDir: path.join(__dirname, "../public") });

// 관리자 페이지 + 로그 API 부착
app.use(AdminPage);   // /admin
app.use(adminRouter); // /admin/api/logs ...

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
  log("server.cjs started");
});
