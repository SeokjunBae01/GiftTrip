// UpLoadingImages.cjs
const express = require("express");
const path = require("path");
const fs = require("fs");
const { categories } = require("./Manager.cjs");

const CAT_KEYS = Array.isArray(categories)
  ? categories.map(c => (typeof c === "string" ? c : c.key))
  : [];

const IMG_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg|jfif|avif)$/i;

function buildRegistry(publicDir) {
  const reg = {};
  if (!fs.existsSync(publicDir)) return reg;

  const countries = fs
    .readdirSync(publicDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const country of countries) {
    const countryDir = path.join(publicDir, country);
    const bucket = {};

    for (const key of CAT_KEYS) {
      const catDir = path.join(countryDir, key);
      if (!fs.existsSync(catDir)) continue;

      const files = fs
        .readdirSync(catDir, { withFileTypes: true })
        .filter(f => f.isFile() && IMG_REGEX.test(f.name))
        .map(f => `/${country}/${key}/${f.name}`); // 정적 서빙 기준 경로

      if (files.length > 0) bucket[key] = files;
    }

    if (Object.keys(bucket).length > 0) reg[country] = bucket;
  }

  return reg;
}

function attachImageAPIs(app, opts = {}) {
  const publicDir = opts.publicDir || path.join(__dirname, "public");
  const base = "/api/page4";

  // 정적 서빙은 server.cjs에서 이미 등록했으므로 생략 가능(중복되어도 무해)
  // app.use(express.static(publicDir));

  let REGISTRY = buildRegistry(publicDir);
  console.log("[IMAGE REGISTRY LOADED]", publicDir);
  Object.entries(REGISTRY).forEach(([country, cats]) => {
    console.log(`  ${country}:`);
    Object.entries(cats).forEach(([cat, imgs]) => {
      console.log(`    ${cat} (${imgs.length} images)`);
    });
  });

  // 전체 레지스트리
  app.get(`${base}/registry`, (req, res) => {
    res.json({ success: true, registry: REGISTRY });
  });

  // 특정 국가 전체 이미지
  app.get(`${base}/:country`, (req, res) => {
    const { country } = req.params;
    const entry = REGISTRY[country];
    const images = entry ? Object.values(entry).flat() : [];
    res.json({ success: true, country, images });
  });

  // ✅ 특정 국가 + 카테고리 이미지
  app.get(`${base}/pictures/:country/:category`, (req, res) => {
    const { country, category } = req.params;
    if (!CAT_KEYS.includes(category)) {
      return res.status(404).json({ success: false, error: "Invalid category" });
    }
    const images = REGISTRY[country]?.[category] || [];
    res.json({ success: true, country, category, pictures: images });
  });

  // 레지스트리 리로드
  app.post(`${base}/registry/reload`, (req, res) => {
    REGISTRY = buildRegistry(publicDir);
    res.json({ success: true, reloaded: true });
  });

  return { getRegistry: () => REGISTRY };
}

module.exports = { attachImageAPIs };