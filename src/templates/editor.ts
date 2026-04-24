import type { ChartConfig } from "../renderers/types.js";

interface EditorData {
  config: ChartConfig;
  rawCsv: string;
  parsedData: { headers: string[]; rows: (string | number)[][]; types: string[] };
  initialOption: Record<string, any>;
}

export function renderEditor(data: EditorData): string {
  const { config, rawCsv, parsedData, initialOption } = data;
  const isDark = config.theme === "dark";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SmartBI Editor</title>
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
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:var(--bg); color:var(--text); height:100vh; overflow:hidden; }

.app { display:grid; grid-template-rows:48px 1fr auto; height:100vh; }

/* Header */
.header { display:flex; align-items:center; justify-content:space-between; padding:0 16px; background:var(--panel); border-bottom:1px solid var(--border); }
.header h1 { font-size:16px; font-weight:600; }
.theme-toggle { background:none; border:1px solid var(--border); border-radius:6px; padding:6px 12px; cursor:pointer; color:var(--text); font-size:13px; }
.theme-toggle:hover { border-color:var(--accent); }

/* Main */
.main { display:grid; grid-template-columns:1fr 280px; overflow:hidden; }

/* Chart area */
.chart-area { padding:16px; display:flex; align-items:center; justify-content:center; }
#chart { width:100%; height:100%; border-radius:8px; background:var(--panel); box-shadow:0 1px 4px rgba(0,0,0,0.08); }

/* Sidebar */
.sidebar { border-left:1px solid var(--border); background:var(--panel); overflow-y:auto; padding:12px; }
.section { margin-bottom:16px; }
.section-title { font-size:12px; font-weight:600; text-transform:uppercase; color:var(--subtext); margin-bottom:8px; letter-spacing:0.5px; }

/* Chart type grid */
.type-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; }
.type-btn { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 2px; border:2px solid transparent; border-radius:6px; background:var(--input-bg); cursor:pointer; color:var(--subtext); font-size:9px; transition:all 0.15s; }
.type-btn:hover { border-color:var(--accent); color:var(--text); }
.type-btn.active { border-color:var(--accent); background:${isDark ? "#1a3a6e" : "#eef2ff"}; color:var(--accent); }
.type-btn svg { width:20px; height:20px; }

/* Color schemes */
.scheme-list { display:flex; flex-wrap:wrap; gap:6px; }
.scheme-btn { display:flex; align-items:center; gap:4px; padding:4px 8px; border:2px solid transparent; border-radius:6px; background:var(--input-bg); cursor:pointer; font-size:11px; color:var(--subtext); transition:all 0.15s; }
.scheme-btn:hover { border-color:var(--accent); }
.scheme-btn.active { border-color:var(--accent); color:var(--accent); }
.scheme-dots { display:flex; gap:2px; }
.scheme-dot { width:10px; height:10px; border-radius:50%; }

/* Inputs */
.field { margin-bottom:8px; }
.field label { display:block; font-size:11px; color:var(--subtext); margin-bottom:3px; }
.field input, .field select { width:100%; padding:6px 8px; border:1px solid var(--border); border-radius:4px; background:var(--input-bg); color:var(--text); font-size:13px; outline:none; }
.field input:focus { border-color:var(--accent); }
.row { display:flex; gap:8px; }
.row .field { flex:1; }

/* Toggle */
.toggle-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; }
.toggle-label { font-size:12px; color:var(--subtext); }
.toggle { position:relative; width:36px; height:20px; }
.toggle input { opacity:0; width:0; height:0; }
.toggle-slider { position:absolute; inset:0; background:var(--border); border-radius:20px; cursor:pointer; transition:0.2s; }
.toggle-slider::before { content:''; position:absolute; width:16px; height:16px; left:2px; top:2px; background:white; border-radius:50%; transition:0.2s; }
.toggle input:checked + .toggle-slider { background:var(--accent); }
.toggle input:checked + .toggle-slider::before { transform:translateX(16px); }

/* Export panel */
.export-panel { border-top:1px solid var(--border); background:var(--panel); }
.export-tabs { display:flex; border-bottom:1px solid var(--border); overflow-x:auto; }
.export-tab { padding:8px 14px; font-size:12px; cursor:pointer; border:none; background:none; color:var(--subtext); white-space:nowrap; border-bottom:2px solid transparent; }
.export-tab:hover { color:var(--text); }
.export-tab.active { color:var(--accent); border-bottom-color:var(--accent); }
.export-body { display:flex; align-items:center; gap:8px; padding:8px 12px; }
.export-code { flex:1; padding:8px; background:var(--input-bg); border:1px solid var(--border); border-radius:4px; font-family:monospace; font-size:11px; color:var(--text); word-break:break-all; max-height:60px; overflow-y:auto; white-space:pre-wrap; }
.btn { padding:6px 12px; border:1px solid var(--border); border-radius:4px; background:var(--input-bg); color:var(--text); font-size:12px; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
.btn:hover { border-color:var(--accent); color:var(--accent); }
.btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
.btn-primary:hover { background:var(--accent-hover); }
.export-actions { display:flex; gap:6px; flex-shrink:0; }
</style>
</head>
<body>
<div class="app">
  <!-- Header -->
  <div class="header">
    <h1>SmartBI Editor</h1>
    <button class="theme-toggle" onclick="toggleTheme()">${isDark ? "Light Mode" : "Dark Mode"}</button>
  </div>

  <!-- Main: Chart + Sidebar -->
  <div class="main">
    <div class="chart-area"><div id="chart"></div></div>

    <div class="sidebar">
      <!-- Chart Type -->
      <div class="section">
        <div class="section-title">Chart Type</div>
        <div class="type-grid" id="typeGrid"></div>
      </div>

      <!-- Color Scheme -->
      <div class="section">
        <div class="section-title">Color Scheme</div>
        <div class="scheme-list" id="schemeList"></div>
        <div class="field" style="margin-top:8px">
          <label>Custom Colors (hex, comma separated)</label>
          <input type="text" id="customColors" placeholder="#ff6600, #3366cc, ..." oninput="onCustomColors(this.value)">
        </div>
      </div>

      <!-- Parameters -->
      <div class="section">
        <div class="section-title">Parameters</div>
        <div class="field">
          <label>Title</label>
          <input type="text" id="paramTitle" value="${escapeAttr(config.title || "")}" oninput="onParam()">
        </div>
        <div class="row">
          <div class="field">
            <label>X Label</label>
            <input type="text" id="paramXLabel" value="${escapeAttr(config.xlabel || "")}" oninput="onParam()">
          </div>
          <div class="field">
            <label>Y Label</label>
            <input type="text" id="paramYLabel" value="${escapeAttr(config.ylabel || "")}" oninput="onParam()">
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Width</label>
            <input type="number" id="paramWidth" value="${config.width}" min="200" max="2000" step="50" oninput="onParam()">
          </div>
          <div class="field">
            <label>Height</label>
            <input type="number" id="paramHeight" value="${config.height}" min="200" max="2000" step="50" oninput="onParam()">
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Smooth Curves</span>
          <label class="toggle">
            <input type="checkbox" id="paramSmooth" checked onchange="onParam()">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Export -->
  <div class="export-panel">
    <div class="export-tabs" id="exportTabs"></div>
    <div class="export-body">
      <div class="export-code" id="exportCode"></div>
      <div class="export-actions">
        <button class="btn" onclick="copyCode()">Copy</button>
        <button class="btn btn-primary" onclick="downloadSvg()">SVG</button>
        <button class="btn btn-primary" onclick="downloadPng()">PNG</button>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<script>
// ===== State =====
var S = {
  type: '${config.type}',
  theme: '${config.theme}',
  colors: ${JSON.stringify(config.colors)},
  title: ${JSON.stringify(config.title || "")},
  xlabel: ${JSON.stringify(config.xlabel || "")},
  ylabel: ${JSON.stringify(config.ylabel || "")},
  width: ${config.width},
  height: ${config.height},
  smooth: true,
  schemeName: 'default',
  exportTab: 'svg'
};
var DATA = ${JSON.stringify(parsedData)};
var RAW_CSV = ${JSON.stringify(rawCsv)};

// ===== Chart Types =====
var TYPES = [
  {id:'line',    label:'Line',    icon:'<polyline points="2,14 6,8 10,11 14,3" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {id:'bar',     label:'Bar',     icon:'<rect x="2" y="8" width="3" height="8" fill="currentColor" opacity="0.7"/><rect x="6.5" y="4" width="3" height="12" fill="currentColor" opacity="0.85"/><rect x="11" y="6" width="3" height="10" fill="currentColor"/>'},
  {id:'pie',     label:'Pie',     icon:'<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8,8 L8,2 A6,6 0 0,1 13,5.5 Z" fill="currentColor" opacity="0.6"/>'},
  {id:'area',    label:'Area',    icon:'<path d="M2,14 L6,8 L10,11 L14,4 L14,14 Z" fill="currentColor" opacity="0.3"/><polyline points="2,14 6,8 10,11 14,4" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {id:'scatter', label:'Scatter', icon:'<circle cx="4" cy="10" r="1.5" fill="currentColor"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/><circle cx="10" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/>'},
  {id:'radar',   label:'Radar',   icon:'<polygon points="8,2 14,6 12,13 4,13 2,6" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1"/>'},
  {id:'heatmap', label:'Heat',    icon:'<rect x="1" y="1" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3"/><rect x="6" y="1" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6"/><rect x="11" y="1" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9"/><rect x="1" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7"/><rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4"/><rect x="11" y="6" width="4" height="4" rx="0.5" fill="currentColor"/>'},
  {id:'funnel',  label:'Funnel',  icon:'<path d="M2,2 L14,2 L12,6 L14,6 L11,10 L13,10 L8,15 L3,10 L5,10 L2,6 L4,6 Z" fill="currentColor" opacity="0.5"/>'},
  {id:'treemap', label:'Tree',    icon:'<rect x="1" y="1" width="8" height="14" rx="0.5" fill="currentColor" opacity="0.5"/><rect x="10" y="1" width="5" height="7" rx="0.5" fill="currentColor" opacity="0.7"/><rect x="10" y="9" width="5" height="6" rx="0.5" fill="currentColor" opacity="0.9"/>'},
  {id:'gauge',   label:'Gauge',   icon:'<path d="M3,12 A6,6 0 1,1 13,12" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="11" x2="11" y2="5" stroke="currentColor" stroke-width="1.5"/>'}
];

// ===== Color Schemes =====
var SCHEMES = {
  default:    {label:'Default',    colors:['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc','#48b8d0']},
  warm:       {label:'Warm',       colors:['#e74c3c','#e67e22','#f39c12','#f1c40f','#d35400','#c0392b','#e08283','#f9bf3b','#eb974e','#d64541']},
  cool:       {label:'Cool',       colors:['#2ecc71','#3498db','#1abc9c','#2980b9','#27ae60','#16a085','#22a7f0','#4ecdc4','#1ba39c','#3fc380']},
  pastel:     {label:'Pastel',     colors:['#a8d8ea','#aa96da','#fcbad3','#ffffd2','#b5eaea','#eac8af','#d5b4b4','#c9e4de','#f7d9c4','#faedcb']},
  vivid:      {label:'Vivid',      colors:['#ff0080','#ff8c00','#40e0d0','#7b68ee','#00ff7f','#ff4500','#1e90ff','#ff69b4','#00ced1','#ffd700']},
  monochrome: {label:'Mono',       colors:['#2c3e50','#546e7a','#78909c','#90a4ae','#b0bec5','#37474f','#455a64','#607d8b','#819ca9','#a5c0cd']}
};

// ===== Export Tabs =====
var TABS = [
  {id:'svg',      label:'SVG URL'},
  {id:'png',      label:'PNG URL'},
  {id:'markdown', label:'Markdown'},
  {id:'htmlimg',  label:'HTML img'},
  {id:'iframe',   label:'iframe'},
  {id:'csv',      label:'CSV'}
];

// ===== Init =====
var chart;
function init() {
  renderTypeGrid();
  renderSchemeList();
  renderExportTabs();
  chart = echarts.init(document.getElementById('chart'), S.theme === 'dark' ? 'dark' : null);
  updateChart();
  updateExport();
  window.addEventListener('resize', function(){ chart.resize(); });
}

// ===== Render Controls =====
function renderTypeGrid() {
  var html = TYPES.map(function(t) {
    return '<button class="type-btn' + (t.id === S.type ? ' active' : '') + '" data-type="' + t.id + '" onclick="setType(\\'' + t.id + '\\')">'
      + '<svg viewBox="0 0 16 16">' + t.icon + '</svg>'
      + '<span>' + t.label + '</span></button>';
  }).join('');
  document.getElementById('typeGrid').innerHTML = html;
}

function renderSchemeList() {
  var html = '';
  for (var k in SCHEMES) {
    var s = SCHEMES[k];
    var dots = s.colors.slice(0,4).map(function(c){ return '<span class="scheme-dot" style="background:'+c+'"></span>'; }).join('');
    html += '<button class="scheme-btn' + (k === S.schemeName ? ' active' : '') + '" onclick="setScheme(\\'' + k + '\\')">'
      + '<span class="scheme-dots">' + dots + '</span>'
      + '<span>' + s.label + '</span></button>';
  }
  document.getElementById('schemeList').innerHTML = html;
}

function renderExportTabs() {
  var html = TABS.map(function(t) {
    return '<button class="export-tab' + (t.id === S.exportTab ? ' active' : '') + '" onclick="setExportTab(\\'' + t.id + '\\')">' + t.label + '</button>';
  }).join('');
  document.getElementById('exportTabs').innerHTML = html;
}

// ===== Actions =====
function setType(t) {
  S.type = t;
  renderTypeGrid();
  updateChart();
  updateExport();
}

function setScheme(name) {
  S.schemeName = name;
  S.colors = SCHEMES[name].colors;
  document.getElementById('customColors').value = '';
  renderSchemeList();
  updateChart();
  updateExport();
}

function onCustomColors(val) {
  if (!val.trim()) return;
  var arr = val.split(',').map(function(c){ return c.trim(); }).filter(function(c){ return /^#[0-9a-fA-F]{3,8}$/.test(c); });
  if (arr.length > 0) {
    S.colors = arr;
    S.schemeName = '';
    renderSchemeList();
    updateChart();
    updateExport();
  }
}

function onParam() {
  S.title = document.getElementById('paramTitle').value;
  S.xlabel = document.getElementById('paramXLabel').value;
  S.ylabel = document.getElementById('paramYLabel').value;
  S.width = parseInt(document.getElementById('paramWidth').value) || 800;
  S.height = parseInt(document.getElementById('paramHeight').value) || 400;
  S.smooth = document.getElementById('paramSmooth').checked;
  updateChart();
  updateExport();
}

function toggleTheme() {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  // Reload with new theme
  var url = new URL(window.location.href);
  url.searchParams.set('theme', S.theme);
  window.location.href = url.toString();
}

function setExportTab(tab) {
  S.exportTab = tab;
  renderExportTabs();
  updateExport();
}

// ===== Build ECharts Option =====
function buildOpt() {
  var isDark = S.theme === 'dark';
  var bg = isDark ? '#1a1a2e' : '#ffffff';
  var textColor = isDark ? '#e0e0e0' : '#333333';
  var subColor = isDark ? '#999999' : '#666666';
  var gridColor = isDark ? '#333355' : '#e0e0e0';
  var colors = S.colors;
  var headers = DATA.headers;
  var rows = DATA.rows;
  var types = DATA.types;

  var labelIdx = -1;
  for (var i=0;i<types.length;i++) { if (types[i]==='string') { labelIdx=i; break; } }
  var numIdx = [];
  for (var i=0;i<types.length;i++) { if (types[i]==='number') numIdx.push(i); }
  var labels = labelIdx>=0 ? rows.map(function(r){return String(r[labelIdx])}) : rows.map(function(_,i){return String(i)});

  var base = {
    backgroundColor: bg,
    color: colors,
    title: S.title ? {text:S.title, left:'center', textStyle:{color:textColor, fontSize:16}} : undefined,
    textStyle: {fontFamily:'Arial,Helvetica,sans-serif', color:subColor}
  };

  var type = S.type;

  // Tooltip
  var tooltip;
  if (['pie','funnel','treemap','gauge'].indexOf(type)>=0) tooltip = {trigger:'item'};
  else if (['scatter','radar','heatmap'].indexOf(type)>=0) tooltip = {trigger:'item'};
  else tooltip = {trigger:'axis', axisPointer:{type:'cross',crossStyle:{color:'#999'}}};

  // Cartesian types
  if (['line','bar','area'].indexOf(type)>=0) {
    var seriesType = type === 'area' ? 'line' : type;
    return Object.assign(base, {
      tooltip: tooltip,
      grid: {left:60,right:30,top:S.title?50:30,bottom:50},
      xAxis: {type:'category', data:labels, name:S.xlabel, axisLine:{lineStyle:{color:gridColor}}, axisLabel:{color:subColor}},
      yAxis: {type:'value', name:S.ylabel, splitLine:{lineStyle:{color:gridColor,type:'dashed'}}, axisLine:{lineStyle:{color:gridColor}}, axisLabel:{color:subColor}},
      legend: numIdx.length>1 ? {data:numIdx.map(function(i){return headers[i]}), top:S.title?30:5, textStyle:{color:subColor}} : undefined,
      series: numIdx.map(function(ni){
        return {
          name: headers[ni], type: seriesType,
          data: rows.map(function(r){return r[ni]}),
          smooth: S.smooth,
          areaStyle: type==='area' ? {opacity:0.3} : undefined
        };
      })
    });
  }

  if (type==='scatter') {
    var xi=numIdx[0]||0, yi=numIdx[1]||numIdx[0]||0;
    return Object.assign(base, {
      tooltip:tooltip,
      grid:{left:60,right:30,top:S.title?50:30,bottom:50},
      xAxis:{type:'value',name:S.xlabel||headers[xi],splitLine:{lineStyle:{color:gridColor,type:'dashed'}},axisLabel:{color:subColor}},
      yAxis:{type:'value',name:S.ylabel||headers[yi],splitLine:{lineStyle:{color:gridColor,type:'dashed'}},axisLabel:{color:subColor}},
      series:[{type:'scatter',data:rows.map(function(r){return [r[xi],r[yi]]}),symbolSize:8}]
    });
  }

  if (type==='pie') {
    var vi=numIdx[0]>=0?numIdx[0]:-1;
    return Object.assign(base, {
      tooltip:tooltip,
      legend:{bottom:10,textStyle:{color:subColor}},
      series:[{type:'pie',radius:['30%','65%'],center:['50%','45%'],
        data:rows.map(function(r){return {name:labelIdx>=0?String(r[labelIdx]):'',value:vi>=0?Number(r[vi]):0}}),
        label:{color:subColor}}]
    });
  }

  if (type==='radar') {
    var indicators = numIdx.map(function(ni){
      var mx=0; rows.forEach(function(r){var v=Number(r[ni])||0;if(v>mx)mx=v;});
      return {name:headers[ni], max:mx*1.2||100};
    });
    return Object.assign(base, {
      tooltip:tooltip,
      legend:{bottom:10,textStyle:{color:subColor}},
      radar:{indicator:indicators,shape:'polygon',axisName:{color:subColor},splitLine:{lineStyle:{color:gridColor}},splitArea:{areaStyle:{color:['transparent']}}},
      series:[{type:'radar',data:rows.map(function(r,i){return {name:labels[i],value:numIdx.map(function(ni){return Number(r[ni])||0})};})}]
    });
  }

  if (type==='heatmap') {
    var yLabels=numIdx.map(function(i){return headers[i]});
    var hd=[]; var mx=0;
    rows.forEach(function(r,ri){ numIdx.forEach(function(ni,ci){ var v=Number(r[ni])||0; hd.push([ri,ci,v]); if(v>mx)mx=v; }); });
    return Object.assign(base, {
      tooltip:tooltip,
      grid:{left:80,right:40,top:S.title?50:30,bottom:60},
      xAxis:{type:'category',data:labels,axisLabel:{color:subColor},splitArea:{show:true}},
      yAxis:{type:'category',data:yLabels,axisLabel:{color:subColor},splitArea:{show:true}},
      visualMap:{min:0,max:mx||100,calculable:true,orient:'horizontal',left:'center',bottom:5,inRange:{color:[colors[0],colors[1]||'#ee6666']},textStyle:{color:subColor}},
      series:[{type:'heatmap',data:hd,label:{show:true,color:textColor}}]
    });
  }

  if (type==='candlestick') {
    return Object.assign(base, {
      tooltip:tooltip,
      grid:{left:60,right:30,top:S.title?50:30,bottom:50},
      xAxis:{type:'category',data:labels,axisLabel:{color:subColor}},
      yAxis:{type:'value',splitLine:{lineStyle:{color:gridColor,type:'dashed'}},axisLabel:{color:subColor}},
      series:[{type:'candlestick',data:rows.map(function(r){return numIdx.slice(0,4).map(function(ni){return Number(r[ni])||0})})}]
    });
  }

  if (type==='funnel') {
    var vi=numIdx[0]>=0?numIdx[0]:-1;
    return Object.assign(base, {
      tooltip:tooltip,
      legend:{bottom:10,textStyle:{color:subColor}},
      series:[{type:'funnel',left:'10%',right:'10%',top:S.title?50:30,bottom:40,
        data:rows.map(function(r){return {name:labelIdx>=0?String(r[labelIdx]):'',value:vi>=0?Number(r[vi]):0}}),
        label:{color:subColor}}]
    });
  }

  if (type==='treemap') {
    var vi=numIdx[0]>=0?numIdx[0]:-1;
    return Object.assign(base, {
      tooltip:tooltip,
      series:[{type:'treemap',data:rows.map(function(r){return {name:labelIdx>=0?String(r[labelIdx]):'',value:vi>=0?Number(r[vi]):0}})}]
    });
  }

  if (type==='gauge') {
    var vi=numIdx[0]>=0?numIdx[0]:-1;
    var fr=rows[0];
    return Object.assign(base, {
      tooltip:tooltip,
      series:[{type:'gauge',detail:{formatter:'{value}',color:textColor},
        data:[{name:labelIdx>=0&&fr?String(fr[labelIdx]):'',value:vi>=0&&fr?Number(fr[vi]):0}]}]
    });
  }

  return base;
}

// ===== Update =====
function updateChart() {
  var opt = buildOpt();
  chart.clear();
  chart.setOption(opt);
}

function buildUrl(format) {
  var base = window.location.origin + '/chart.' + format;
  var p = [];
  p.push('data=' + encodeURIComponent(RAW_CSV));
  p.push('type=' + S.type);
  if (S.theme !== 'light') p.push('theme=' + S.theme);
  if (S.title) p.push('title=' + encodeURIComponent(S.title));
  if (S.xlabel) p.push('xlabel=' + encodeURIComponent(S.xlabel));
  if (S.ylabel) p.push('ylabel=' + encodeURIComponent(S.ylabel));
  if (S.width !== 800) p.push('width=' + S.width);
  if (S.height !== 400) p.push('height=' + S.height);
  if (S.schemeName !== 'default' && S.colors.length) p.push('colors=' + encodeURIComponent(S.colors.join(',')));
  return base + '?' + p.join('&');
}

function updateExport() {
  var code = '';
  var tab = S.exportTab;
  if (tab === 'svg')      code = buildUrl('svg');
  if (tab === 'png')      code = buildUrl('png');
  if (tab === 'markdown') code = '![Chart](' + buildUrl('svg') + ')';
  if (tab === 'htmlimg')  code = '<img src="' + buildUrl('svg') + '" alt="Chart" />';
  if (tab === 'iframe')   code = '<iframe src="' + buildUrl('html') + '" width="' + S.width + '" height="' + S.height + '" frameborder="0"></iframe>';
  if (tab === 'csv')      code = RAW_CSV;
  document.getElementById('exportCode').textContent = code;
}

// ===== Export Actions =====
function copyCode() {
  var text = document.getElementById('exportCode').textContent;
  navigator.clipboard.writeText(text).then(function(){
    var btn = document.querySelector('.export-actions .btn:first-child');
    btn.textContent = 'Copied!';
    setTimeout(function(){ btn.textContent = 'Copy'; }, 1500);
  });
}

function downloadSvg() {
  window.open(buildUrl('svg'), '_blank');
}

function downloadPng() {
  var url = chart.getDataURL({ type:'png', pixelRatio:2, backgroundColor: S.theme==='dark' ? '#1a1a2e' : '#ffffff' });
  var a = document.createElement('a');
  a.href = url;
  a.download = 'chart.png';
  a.click();
}

init();
<\/script>
</body>
</html>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
