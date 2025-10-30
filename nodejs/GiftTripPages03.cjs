const express = require('express');
const {getData} = require('./Manager.cjs');
const router = express.Router();

router.get('/page3/recommendations', (req, res) => {
  const { countryName, typeSummary, tags } = getData(); // ✅ 수정됨
  return res.json({ countryName, typeSummary, tags });
});

module.exports=router;