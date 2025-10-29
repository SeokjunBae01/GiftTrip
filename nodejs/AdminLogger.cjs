// AdminLogger.cjs
const express = require("express");

const MAX_LOGS = 1000;
const logs = []; // {ts, method, url, status, ms, note?}

function pushLog(entry) {
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
}

function requestLogger({ onlyPrefixes = [] } = {}) {
  return (req, res, next) => {
    const shouldLog =
      onlyPrefixes.length === 0 || onlyPrefixes.some(p => req.url.startsWith(p));

    if (!shouldLog) return next();

    const start = Date.now();
    res.on("finish", () => {
      pushLog({
        ts: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    });
    next();
  };
}

function log(note) {
  pushLog({
    ts: new Date().toISOString(),
    method: "-",
    url: "-",
    status: "-",
    ms: 0,
    note: String(note),
  });
}

const adminRouter = express.Router();

// 로그 조회 (최신순, limit 기본 200)
adminRouter.get("/admin/api/logs", (req, res) => {
  const limit = Math.max(1, Math.min(2000, Number(req.query.limit) || 200));
  const data = logs.slice(-limit).reverse(); // 최신 먼저
  res.json({ success: true, count: data.length, logs: data });
});

// 로그 비우기
adminRouter.post("/admin/api/logs/clear", (req, res) => {
  logs.length = 0;
  res.json({ success: true, cleared: true });
});

module.exports = { requestLogger, adminRouter, log };
