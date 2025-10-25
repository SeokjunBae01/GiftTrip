// UpLoadingImages.cjs
const express = require("express");
const path = require("path");
const fs = require("fs");

// Manager.cjs의 전역 카테고리 가져오기
const { categories } = require("./Manager.cjs");

// 카테고리를 문자열 키 배열로 정규화 (["Stay", ...] 또는 [{key,name}, ...] 모두 지원)
const CAT_KEYS = Array.isArray(categories)
  ? categories.map(c => (typeof c === "string" ? c : c.key))
  : [];

const IMG_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg|jfif|avif)$/i;

// public/<country>/<category>/*.*
function buildRegistry(publicDir) {
  const reg = {};
  if (!fs.existsSync(publicDir)) return reg;

  // 국가 폴더(KR, JP 등)
  const countries = fs
    .readdirSync(publicDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const country of countries) {
    const countryDir = path.join(publicDir, country);
    const bucket = {};

    // 카테고리 폴더 (CAT_KEYS 기준)
    for (const key of CAT_KEYS) {
      const catDir = path.join(countryDir, key);
      if (!fs.existsSync(catDir)) continue;

      const files = fs
        .readdirSync(catDir, { withFileTypes: true })
        .filter(f => f.isFile() && IMG_REGEX.test(f.name))
        .map(f => `/${country}/${key}/${f.name}`);

      if (files.length > 0) bucket[key] = files;
    }

    if (Object.keys(bucket).length > 0) reg[country] = bucket;
  }

  return reg;
}

function attachImageAPIs(app, opts = {}) {
  const publicDir = opts.publicDir || path.join(__dirname, "public");

  // 정적 서빙
  app.use(express.static(publicDir));

  // 이미지 목록 로드
  let REGISTRY = buildRegistry(publicDir);
  console.log("[IMAGE REGISTRY LOADED]", publicDir);
  Object.entries(REGISTRY).forEach(([country, cats]) => {
    console.log(`  ${country}:`);
    Object.entries(cats).forEach(([cat, imgs]) => {
      console.log(`    ${cat} (${imgs.length} images)`);
    });
  });

  // 전체 조회
  app.get("/api/registry", (req, res) => {
    res.json({ success: true, registry: REGISTRY });
  });

  // 특정 국가
  app.get("/api/:country", (req, res) => {
    const { country } = req.params;
    const entry = REGISTRY[country];
    const images = entry ? Object.values(entry).flat() : [];
    res.json({ success: true, country, images });
  });

  // 특정 국가+카테고리
  app.get("/api/:country/:category", (req, res) => {
    const { country, category } = req.params;

    // ⚠️ 기존 includes(함수) → some + 정규화된 CAT_KEYS로 검사
    const validCat = CAT_KEYS.some(k => k === category);
    if (!validCat) {
      return res.status(404).json({ success: false, error: "Invalid category" });
    }

    const images = REGISTRY[country]?.[category] || [];
    res.json({ success: true, country, category, images });
  });

  // 필요 시 수동 갱신
  app.post("/api/registry/reload", (req, res) => {
    REGISTRY = buildRegistry(publicDir);
    res.json({ success: true, reloaded: true });
  });

  return { getRegistry: () => REGISTRY };
}

module.exports = { attachImageAPIs };