const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const app = express();

const page00 = require('./GiftTripPages00.cjs');
const page01 = require('./GiftTripPages01.cjs');
const page04 = require('./GiftTripPages04.cjs');
const page05 = require('./GiftTripPages05.cjs');
const { getData } = require('./Manager.cjs');
const API = require("./InitialSettingAPI.cjs");

dotenv.config();

//const { requestLogger, adminRouter, log } = require("./AdminLogger.cjs");
const AdminPage = require("./AdminPage.cjs");
const { attachImageAPIs } = require("./UpLoadingImages.cjs");

const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/", express.static(PUBLIC_DIR));

//app.use(requestLogger({ onlyPrefixes: ["/api", "/KR", "/JP"] }));


const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
    origin: 'http://localhost:5173', // 프론트엔드 URL (React)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드 명시
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더 명시
    credentials: true, // 쿠키/인증 정보 교환 허용
    optionsSuccessStatus: 204 // OPTIONS 요청 성공 시 상태 코드
}));
app.use(express.json());

// 라우터 연결 (각 파일에 매칭)
app.use('/api/page00', page00);
app.use('/api/page01', page01);
app.use('/api/page04', page04);
app.use('/api/page05', page05);
app.use('/api',API);

attachImageAPIs(app, { publicDir: path.join(__dirname, "../public") });

// 관리자 페이지 + 로그 API 부착
//app.use(AdminPage);   // /admin
//app.use(adminRouter); // /admin/api/logs ...

// 디버깅용: 현재 전역 데이터 상태 확인
app.get('/api/status', (req, res) => {
    // getData는 구조 분해 할당({ getData })했으므로 바로 사용
    res.status(200).json(getData());
});

// 기본 라우트
app.get('/', (req, res) => {
  res.status(200).send('Gift Trip Backend is running');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
