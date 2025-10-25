// AdminPage.cjs
const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/admin", (req, res) => {
  const html = `<!doctype html>
<meta charset="utf-8"/>
<title>Admin · Images & Logs</title>
<style>
  body{font-family:system-ui,sans-serif;margin:20px}
  h1{margin:0 0 16px}
  .wrap{display:grid;grid-template-columns: 1.2fr .8fr; gap:20px}
  .card{border:1px solid #ddd;border-radius:12px;padding:12px}
  .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
  select,button,input{padding:6px 10px;border:1px solid #ccc;border-radius:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
  .thumb{border:1px solid #e5e5e5;border-radius:10px;padding:8px}
  .thumb img{width:100%;height:120px;object-fit:cover;border-radius:8px;display:block}
  .muted{color:#888}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;white-space:nowrap}
  .loghead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  code{background:#f7f7f7;padding:2px 4px;border-radius:4px}
</style>
<h1>Admin · Images & Logs</h1>
<div class="wrap">

  <div class="card">
    <div class="controls">
      <strong>Images</strong>
      <span class="muted">· /api/registry 기반</span>
      <span style="flex:1"></span>
      <label>Country
        <select id="countrySel"></select>
      </label>
      <label>Category
        <select id="categorySel"></select>
      </label>
      <button id="btnReloadImgs">Reload</button>
    </div>
    <div id="imgInfo" class="muted"></div>
    <div id="imgGrid" class="grid"></div>
  </div>

  <div class="card">
    <div class="loghead">
      <div><strong>Logs</strong> <span class="muted">· /admin/api/logs</span></div>
      <div class="controls">
        <label><input type="checkbox" id="autoRefresh" checked> Auto refresh</label>
        <button id="btnRefresh">Refresh</button>
        <button id="btnClear">Clear</button>
      </div>
    </div>
    <div style="max-height:520px; overflow:auto">
      <table>
        <thead><tr><th>Time</th><th>M</th><th>URL</th><th>S</th><th>ms</th><th>Note</th></tr></thead>
        <tbody id="logBody"></tbody>
      </table>
    </div>
  </div>

</div>
<script>
  const countrySel = document.getElementById('countrySel');
  const categorySel = document.getElementById('categorySel');
  const imgGrid = document.getElementById('imgGrid');
  const imgInfo = document.getElementById('imgInfo');

  const logBody = document.getElementById('logBody');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnClear = document.getElementById('btnClear');
  const autoRefresh = document.getElementById('autoRefresh');
  const btnReloadImgs = document.getElementById('btnReloadImgs');

  let REGISTRY = {};
  let refreshTimer = null;

  async function fetchRegistry() {
    const r = await fetch('/api/registry');
    const j = await r.json();
    REGISTRY = j.registry || {};
    fillSelectors();
    renderImages();
  }

  function fillSelectors() {
    const countries = Object.keys(REGISTRY);
    const prevC = countrySel.value;
    countrySel.innerHTML = countries.map(c => '<option>'+c+'</option>').join('');
    if (countries.includes(prevC)) countrySel.value = prevC;

    const cats = Object.keys(REGISTRY[countrySel.value] || {});
    const prevCat = categorySel.value;
    categorySel.innerHTML = cats.map(c => '<option>'+c+'</option>').join('');
    if (cats.includes(prevCat)) categorySel.value = prevCat;
  }

  function renderImages() {
    const c = countrySel.value;
    const k = categorySel.value;
    const list = (REGISTRY[c] && REGISTRY[c][k]) || [];
    imgInfo.textContent = list.length ? c + ' / ' + k + ' · ' + list.length + ' images' : 'No images';
    imgGrid.innerHTML = list.map(u => \`
      <a class="thumb" href="\${u}" target="_blank" rel="noopener">
        <img src="\${u}" alt="\${u}"/>
        <div><code>\${u}</code></div>
      </a>
    \`).join('');
  }

  countrySel.addEventListener('change', () => { fillSelectors(); renderImages(); });
  categorySel.addEventListener('change', renderImages);
  btnReloadImgs.addEventListener('click', async () => {
    await fetch('/api/registry/reload', { method: 'POST' });
    await fetchRegistry();
  });

  async function fetchLogs() {
    const r = await fetch('/admin/api/logs?limit=500');
    const j = await r.json();
    const rows = (j.logs || []).map(x => {
      const t = new Date(x.ts).toLocaleTimeString();
      return '<tr>' +
        '<td>'+t+'</td>' +
        '<td>'+(x.method||'')+'</td>' +
        '<td style="max-width:420px; overflow:hidden; text-overflow:ellipsis;">'+(x.url||'')+'</td>' +
        '<td>'+(x.status||'')+'</td>' +
        '<td>'+(x.ms||'')+'</td>' +
        '<td>'+(x.note||'')+'</td>' +
      '</tr>';
    }).join('');
    logBody.innerHTML = rows;
  }

  btnRefresh.addEventListener('click', fetchLogs);
  btnClear.addEventListener('click', async () => {
    await fetch('/admin/api/logs/clear', { method: 'POST' });
    await fetchLogs();
  });

  function setupAuto() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    if (autoRefresh.checked) {
      refreshTimer = setInterval(fetchLogs, 2000);
    }
  }
  autoRefresh.addEventListener('change', setupAuto);

  // init
  fetchRegistry();
  fetchLogs();
  setupAuto();
</script>`;
  res.type("html").send(html);
});

module.exports = router;