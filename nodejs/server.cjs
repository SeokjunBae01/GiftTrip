// server.cjs
require("dotenv").config();               // ✅ .env 로드 (맨 위에!)
const express = require("express");
const cors = require("cors");
const path = require("path");

const page00Router = require("./GiftTripPages00.cjs");
const page01Router = require("./GiftTripPages01.cjs");
const page02Router = require("./GiftTripPages02.cjs");
const page03Router = require("./GiftTripPages03.cjs");
const page04Router = require("./GiftTripPages04.cjs");
const page05Router = require("./GiftTripPages05.cjs");
const page06Router = require("./GiftTripPages06.cjs");
const page07Router = require("./GiftTripPages07.cjs");
const API = require("./InitialSettingAPI.cjs");
const page7ShareRouter = require("./page7Share.cjs");
const mailer = require("./mailer.cjs");   // ✅ 함수 모듈

const { requestLogger, adminRouter, log } = require("./AdminLogger.cjs");
const AdminPage = require("./AdminPage.cjs");
const { attachImageAPIs } = require("./UpLoadingImages.cjs");

const app = express();
app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/", express.static(PUBLIC_DIR));

app.use(requestLogger({ onlyPrefixes: ["/api", "/KR", "/JP"] }));

// 일반 API 라우터
app.use("/api", page00Router);
app.use("/api", page01Router);
app.use("/api/page2", page02Router);
app.use("/api/page3", page03Router);
app.use("/api", page04Router);
app.use("/api", page05Router);
app.use("/api", page06Router);
app.use("/api", page07Router);
app.use("/api", API);

// ✅ 메일 라우터
app.use("/api", page7ShareRouter);

// ❌ 잘못된 사용: mailer는 라우터가 아님
// app.use("/api", mailer);

// SMTP 연결 확인 로그 (선택)
mailer.verify?.();

attachImageAPIs(app, { publicDir: PUBLIC_DIR });

app.use(AdminPage);
app.use(adminRouter);

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
  log("server.cjs started");
});