import type { ChartConfig } from "../renderers/types.js";

interface ShareData {
  config: ChartConfig;
  rawCsv: string;
  parsedData: { headers: string[]; rows: (string | number)[][]; types: string[] };
  optionJson: string;
  enableEditor?: boolean;
}

export function renderShare(data: ShareData): string {
  const { config, rawCsv, parsedData, optionJson, enableEditor } = data;
  const isDark = config.theme === "dark";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeAttr(config.title || "SmartBI Chart")}</title>
<style>
:root {
  --bg: ${isDark ? "#1a1a2e" : "#f5f5f5"};
  --panel: ${isDark ? "#16213e" : "#ffffff"};
  --border: ${isDark ? "#333355" : "#e0e0e0"};
  --text: ${isDark ? "#e0e0e0" : "#333333"};
  --subtext: ${isDark ? "#999999" : "#666666"};
  --accent: #5470c6;
  --accent-hover: #4060b0;
  --input-bg: ${isDark ? "#0f3460" : "#f9f9f9"};
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:var(--bg); color:var(--text); height:100vh; overflow:hidden; }
.app { display:flex; flex-direction:column; height:100vh; }
#chart { flex:1; min-height:0; }
.bar { display:flex; align-items:center; background:var(--panel); border-top:1px solid var(--border); padding:0 8px; height:44px; gap:4px; }
.bar-left { display:flex; align-items:center; gap:4px; flex-shrink:0; }
.bar-center { display:flex; align-items:center; flex:1; min-width:0; gap:4px; overflow:hidden; }
.bar-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.tab { padding:6px 10px; font-size:12px; cursor:pointer; border:none; background:none; color:var(--subtext); border-radius:4px; white-space:nowrap; transition:all 0.15s; }
.tab:hover { background:var(--input-bg); color:var(--text); }
.tab.active { background:var(--accent); color:#fff; }
.code-box { flex:1; min-width:0; padding:6px 8px; background:var(--input-bg); border:1px solid var(--border); border-radius:4px; font-family:monospace; font-size:11px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:text; }
.code-box:hover { overflow:auto; text-overflow:unset; }
.btn { padding:5px 10px; border:1px solid var(--border); border-radius:4px; background:var(--input-bg); color:var(--text); font-size:12px; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
.btn:hover { border-color:var(--accent); color:var(--accent); }
.btn-accent { background:var(--accent); color:#fff; border-color:var(--accent); }
.btn-accent:hover { background:var(--accent-hover); }
.sep { width:1px; height:20px; background:var(--border); margin:0 4px; }
</style>
</head>
<body>
<div class="app">
  <div id="chart"></div>
  <div class="bar">
    <div class="bar-left">
      <button class="tab active" data-tab="link" onclick="setTab('link')">Link</button>
      <button class="tab" data-tab="markdown" onclick="setTab('markdown')">Markdown</button>
      <button class="tab" data-tab="htmlimg" onclick="setTab('htmlimg')">HTML</button>
      <button class="tab" data-tab="iframe" onclick="setTab('iframe')">iframe</button>
    </div>
    <div class="bar-center">
      <div class="code-box" id="codeBox"></div>
    </div>
    <div class="bar-right">
      <button class="btn" onclick="copyCode()">Copy</button>${enableEditor ? `
      <span class="sep"></span>
      <button class="btn btn-accent" onclick="openEditor()">Edit</button>` : ""}
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<script>
var CONFIG = ${JSON.stringify({ type: config.type, theme: config.theme, title: config.title || "", xlabel: config.xlabel || "", ylabel: config.ylabel || "", width: config.width, height: config.height, colors: config.colors })};
var RAW_CSV = ${JSON.stringify(rawCsv)};
var currentTab = 'link';

var chart = echarts.init(document.getElementById('chart'), ${isDark ? "'dark'" : "null"});
chart.setOption(${optionJson});
window.addEventListener('resize', function(){ chart.resize(); });

function buildUrl() {
  var base = location.origin + '/chart';
  var p = ['data=' + encodeURIComponent(RAW_CSV), 'type=' + CONFIG.type];
  if (CONFIG.theme !== 'light') p.push('theme=' + CONFIG.theme);
  if (CONFIG.title) p.push('title=' + encodeURIComponent(CONFIG.title));
  if (CONFIG.xlabel) p.push('xlabel=' + encodeURIComponent(CONFIG.xlabel));
  if (CONFIG.ylabel) p.push('ylabel=' + encodeURIComponent(CONFIG.ylabel));
  if (CONFIG.width !== 800) p.push('width=' + CONFIG.width);
  if (CONFIG.height !== 400) p.push('height=' + CONFIG.height);
  return base + '?' + p.join('&');
}

function getCode(tab) {
  var url = buildUrl();
  switch (tab) {
    case 'link':     return url;
    case 'markdown': return '![Chart](' + url + ')';
    case 'htmlimg':  return '<img src="' + url + '" alt="Chart" />';
    case 'iframe':   return '<iframe src="' + url + '" width="' + CONFIG.width + '" height="' + CONFIG.height + '" frameborder="0"></iframe>';
    default:         return url;
  }
}

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.getElementById('codeBox').textContent = getCode(tab);
}

function copyCode() {
  var text = document.getElementById('codeBox').textContent;
  navigator.clipboard.writeText(text).then(function(){
    var btn = document.querySelector('.bar-right .btn:first-child');
    btn.textContent = 'Copied!';
    setTimeout(function(){ btn.textContent = 'Copy'; }, 1200);
  });
}

function openEditor() {
  var url = location.origin + '/editor.html?' + buildUrl().split('?')[1];
  location.href = url;
}

setTab('link');
<\/script>
</body>
</html>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
