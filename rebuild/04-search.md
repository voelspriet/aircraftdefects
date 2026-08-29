The `<section id="p-search">` below drops in immediately after the instrument at the top level of `<body>` (it is the only panel until the tab strip arrives); the `<style>` sits above it, the `<script>` goes at the foot of the existing IIFE — it is itself wrapped, so nesting is harmless. `#case-wrap` and `#tip` sit at body level after the section.

```html
<!-- ============ placement: directly BELOW the instrument, top level of <body> ============ -->
<style>
/* ---------- p-search ---------- */
#p-search{font:15px/1.5 "Gill Sans","Seravek",system-ui,Segoe UI,sans-serif;color:#3f3227;margin:0 auto;max-width:1180px;padding:6px 16px 60px}
#p-search .eyebrow-k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a4a2f;font-weight:700;margin:16px 0 6px}
#p-search .ipad{background:#fffdf9;border:1px solid #e6d3c0;border-radius:12px;padding:16px 20px 18px;box-shadow:0 2px 10px rgba(90,50,20,.06)}
#p-search .fld>span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:3px}
#p-search input,#p-search select{width:100%;padding:7px 9px;border:1px solid #d9c4ae;border-radius:6px;background:#fff;font:inherit;font-size:14px;color:#3f3227;box-sizing:border-box}
#p-search input.landed,#p-search select.landed{border-left:3px solid #8a2a17;background:#fdf7f4}
#p-search .aimbox{border:1px dashed #cbb49b;border-radius:10px;padding:12px;background:#fbf3ea;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
#p-search .aimbox>label{font-size:12px;font-weight:700;color:#8a4a2f;white-space:nowrap}
#p-search .aimbox select{width:auto}
#p-search #iAimAt{flex:1 1 240px}
#p-search .aimday{font-size:12px;color:#8a7f74;white-space:nowrap}
#p-search .aimday input{width:auto;display:inline-block}
#p-search .aimsug{width:100%;border:1px solid #d9c4ae;background:#fff;border-radius:8px;max-height:320px;overflow:auto;z-index:30}
#p-search .sk{font-size:10px;letter-spacing:.12em;padding:7px 10px 2px;font-weight:700}
#p-search .sk-operator{color:#8c4a2f}#p-search .sk-tail{color:#3f6b57}#p-search .sk-period{color:#4a5d80}
#p-search .sk-zone{color:#7a5a2e}#p-search .sk-jasc{color:#5d4a72}#p-search .sk-q{color:#6f6a63}
#p-search .sug{display:flex;gap:10px;align-items:baseline;padding:7px 10px;cursor:pointer}
#p-search .sug:hover,#p-search .sug.on{background:#f3e2d3}
#p-search .sug.nought{opacity:.62;cursor:default}
#p-search .sug .sl{font-weight:600}
#p-search .sug .sw{color:#8a7f74;font-size:12px;flex:1}
#p-search .sug b{font-variant-numeric:tabular-nums}
#p-search .aimask{padding:10px 12px;font-size:13.5px;color:#5d4a2f}
#p-search .aim{margin-top:8px;font-size:13.5px;color:#5d5348;background:#f3e7da;border-radius:6px;padding:6px 10px;min-height:1.2em}
#p-search .aim.held{background:#8a2a17;color:#fff7ef}
#p-search .aim .undo{border:1px solid rgba(255,247,239,.6);background:transparent;color:#fff7ef;border-radius:4px;padding:1px 8px;cursor:pointer;font-size:12px}
#p-search .prim{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:14px}
#p-search .prim .fld{flex:1 1 140px}
#p-search .prim .fld.grow{flex:2 1 280px}
#p-search button{font:inherit}
#p-search .prime{background:#8a2a17;color:#fff7ef;border:0;border-radius:6px;padding:8px 18px;font-size:14px;cursor:pointer}
#p-search .ghost{border:1px solid #d9c4ae;background:#fff;border-radius:6px;padding:6px 11px;font-size:13px;cursor:pointer;color:#5d4a3a}
#p-search .ghost:disabled{opacity:.45;cursor:default}
#p-search details{margin-top:12px}
#p-search summary{cursor:pointer;color:#8a4a2f;font-weight:600;font-size:14px}
#p-search #mfCount{color:#8a7f74;font-weight:400}
#p-search .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:10px}
#p-search .chipsrow{margin-top:12px}
#p-search .unresolved{color:#7c3a1f;background:#fdf3ee;border:1px solid #eec9b8;padding:8px 12px;border-radius:8px;font-size:13.5px;margin-bottom:8px}
#p-search .chip{display:inline-flex;gap:6px;align-items:center;background:#fdf1ec;border:1px solid #f0d5cb;color:#8a2a17;border-radius:999px;padding:3px 10px;font-size:12.5px;margin:0 6px 6px 0}
#p-search .chip.warn{background:#fdf3ee;border-color:#eec9b8;color:#7c3a1f}
#p-search .chip em{font-style:italic;opacity:.85}
#p-search .chipx{border:0;background:transparent;cursor:pointer;font-weight:700;color:inherit;padding:0 2px}
#p-search .standing{margin-top:12px;font-size:15px}
#p-search .fig{font-size:20px;color:#8a2a17;font-variant-numeric:tabular-nums}
#p-search .clause{cursor:pointer;border-bottom:1px dotted #b96a4b}
#p-search .clause:hover{background:#f7ede4}
#p-search .aside{color:#8a7f74;font-size:12.5px}
#p-search .broken{color:#7c1d0c;background:#fbe3d5;padding:2px 8px;border-radius:4px;font-size:13px}
#p-search .starterswrap{margin-top:14px}
#p-search #starters{display:flex;flex-wrap:wrap;gap:8px}
#p-search .starter{border:1px solid #d9c4ae;background:#fff;border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer;color:#5d4a3a}
#p-search .starter:hover{background:#f7ede4}
#p-search .starter.extra{display:none}
#p-search #starters.all .starter.extra{display:inline-block}
#p-search .seamrow{text-align:center;margin-top:16px}
#p-search .seam{background:#8a2a17;color:#fff7ef;border:0;border-radius:8px;padding:10px 22px;font-size:15px;cursor:pointer}
#p-search .toolrow{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin:18px auto 6px;max-width:1120px}
#p-search .countline{font-size:15px}
#p-search .countline strong{font-size:19px;color:#8a2a17;font-variant-numeric:tabular-nums}
#p-search .tools{margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#p-search .copied{font-size:12px;color:#3f6b57}
#p-search .nosearch{max-width:1120px;margin:10px auto;border:1px solid #eec9b8;border-left:4px solid #7c3a1f;background:#fdf3ee;border-radius:10px;padding:16px 20px}
#p-search .onpurpose{max-width:1120px;margin:10px auto;border:1px solid #e6d3c0;background:#fffdf9;border-radius:10px;padding:20px 24px}
#p-search .onpurpose p{margin:.4em 0}
#p-search .zero{max-width:1120px;margin:10px auto;border:1px solid #e6d3c0;background:#fffdf9;border-radius:10px;padding:16px 20px}
#p-search .zerobtns{margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#p-search .cut{max-width:1120px;margin:2px auto 6px;color:#6f6a63;font-size:12.5px}
#p-search .cm{margin-left:12px}
#p-search .cm.lit{color:#3f2f24;font-weight:600}
#p-search .runs{display:block;margin-top:4px;color:#7a5a2e}
#p-search .swipehint{max-width:1120px;margin:0 auto 6px;color:#8a7f74;font-size:12px;font-style:italic}
#p-search .tablewrap{max-width:1120px;margin:0 auto 30px;overflow-x:auto;border:1px solid #e6d3c0;border-radius:10px;background:#fffdf9}
#p-search table{border-collapse:collapse;width:100%;min-width:1080px;font-size:13.5px}
#p-search th{position:sticky;top:0;background:#f3e7da;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6f5b4a;padding:8px 10px;border-bottom:2px solid #d9b8a5;z-index:5}
#p-search td{padding:8px 10px;border-bottom:1px solid #efe3d5;vertical-align:top}
#p-search tr.rep:hover td{background:#fbf5ee}
#p-search tr.spine td{position:sticky;top:44px;background:#efe0cf;font-weight:600;font-size:12.5px;color:#5d4326;z-index:4}
#p-search .spinen{font-weight:400;color:#8a7f74;margin-left:10px;font-variant-numeric:tabular-nums}
#p-search .mut{color:#8a7f74;font-size:12px}
#p-search td.muted{color:#8a7f74}
#p-search .absent{font-style:italic;color:#9a8f83}
#p-search .term{border-bottom:1px dotted #8a2a17;cursor:help}
#p-search .c{cursor:pointer}
#p-search .term.c:hover,#p-search .c:hover{background:#f7ede4}
#p-search .c.dull{color:#8a7f74}
#p-search .sysc{color:#8a2a17;font-weight:600}
#p-search .alsoc{margin-top:3px}
#p-search .wu{padding:2px 0 4px;position:relative;cursor:pointer}
#p-search .wu .txt{max-width:860px;line-height:1.45}
#p-search .wu.clip .txt{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
#p-search .wu.clip.long::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2.4em;background:linear-gradient(rgba(255,253,249,0),#fffdf9);pointer-events:none}
#p-search .wu-action{display:block;margin-top:6px;padding:6px 10px;background:#f7ede4;border-left:3px solid #b96a4b;border-radius:0 6px 6px 0}
#p-search .wu-action b{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#8a4a2f;display:block;margin-bottom:2px}
#p-search .wu-toggle{margin-top:4px}
#p-search mark.hit{background:#ffe9c9;color:inherit;border-radius:2px;padding:0 1px}
#p-search .flash{animation:psflash 1.4s}
@keyframes psflash{0%{outline:3px solid #e0a066}100%{outline:3px solid transparent}}
#tip{position:fixed;z-index:90;max-width:340px;background:#2e211a;color:#f7ede4;padding:8px 10px;border-radius:6px;font-size:12.5px;box-shadow:0 4px 14px rgba(0,0,0,.3)}
#tip b{color:#ffd9a8}
/* ---------- case sheet ---------- */
#case-wrap{position:fixed;inset:0;z-index:80}
#case-wrap .case-backdrop{position:absolute;inset:0;background:rgba(46,28,16,.5)}
#case-box{position:relative;margin:4vh auto;width:min(880px,94vw);max-height:90vh;overflow:auto;background:#fffdf9;border-radius:12px;padding:0 0 24px;outline:none;font:15px/1.5 "Gill Sans",system-ui,Segoe UI,sans-serif;color:#3f3227}
#case-box .casebar{position:sticky;top:0;background:#f3e7da;border-bottom:1px solid #d9b8a5;padding:10px 18px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;z-index:5}
#case-box .step{display:flex;gap:8px;align-items:center;font-size:13px}
#case-box .step span{font-variant-numeric:tabular-nums;color:#5d4a3a}
#case-box .casebtns{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
#case-box .ghost{border:1px solid #d9c4ae;background:#fff;border-radius:6px;padding:5px 10px;font-size:13px;cursor:pointer;color:#5d4a3a}
#case-box .route{padding:12px 24px 0;color:#6f6a63;font-size:13px}
#case-box .bigq{margin:14px 24px;padding:14px 18px;background:#fbf3ea;border-left:4px solid #8a2a17;font-size:15px;line-height:1.55}
#case-box .pubnotes{margin:6px 24px;font-size:13px;color:#5d5348}
#case-box .pubnotes ol{margin:6px 0 0 18px;padding:0}
#case-box .pubnotes li{margin:.35em 0}
#case-box .eyebrow-k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a4a2f;font-weight:700;margin:18px 24px 4px}
#case-box h2{margin:2px 24px 6px;font-size:22px;font-weight:700}
#case-box .lede{margin:0 24px 10px;color:#6f6a63;font-size:13px}
#case-box table.kv{margin:6px 24px;border-collapse:collapse;width:calc(100% - 48px);font-size:13.5px}
#case-box .kv th{width:220px;text-align:left;vertical-align:top;color:#8a7f74;font-weight:600;padding:7px 10px;border-bottom:1px solid #efe3d5;position:static}
#case-box .kv td{padding:7px 10px;border-bottom:1px solid #efe3d5}
#case-box .kv hr{border:0;border-top:1px dotted #d9c4ae;margin:6px 0}
#case-box .mut{color:#8a7f74;font-size:12px}
#case-box .mono{font-family:ui-monospace,Menlo,monospace}
#case-box .wu-action{display:block;margin-top:6px;padding:6px 10px;background:#f7ede4;border-left:3px solid #b96a4b}
#case-box mark.hit{background:#ffe9c9}
/* ---------- responsive ---------- */
@media (max-width:900px){
  #p-search td:first-child,#p-search th:first-child{position:sticky;left:0;background:#fffdf9;z-index:3}
  #p-search th:first-child{background:#f3e7da}
  #p-search tr.spine td:first-child{background:#efe0cf}
}
@media (max-width:1100px){
  #p-search .wu{position:sticky;left:0;width:calc(100vw - 44px)}
  #p-search .wu.clip .txt{-webkit-line-clamp:5}
}
</style>

<section id="p-search" class="panel active" data-state="empty">
  <div class="ipad" id="instrument">
    <div class="aimbox">
      <label for="aimKind">Aim at</label>
      <select id="aimKind">
        <option value="period">a month or year</option>
        <option value="operator">an airline</option>
        <option value="tail">a tail number</option>
        <option value="zone">a zone</option>
        <option value="jasc">a system code</option>
        <option value="">free text search</option>
      </select>
      <input id="iAimAt" role="combobox" aria-controls="aimSug" aria-autocomplete="list" autocomplete="off"
             placeholder="a month or a year, e.g. August or 2025">
      <button class="ghost" data-act="aimgo">Take it</button>
      <label class="aimday">or one day <input id="aimDay" type="date"></label>
      <div class="aimsug" id="aimSug" role="listbox" hidden></div>
      <div class="aim" id="iAim" aria-live="polite"></div>
    </div>

    <div class="prim">
      <label class="fld grow"><span>Text</span>
        <input id="q" list="qlist" type="search" autocomplete="off" placeholder='words the mechanic wrote, e.g. "fuel leak"'>
        <datalist id="qlist"></datalist>
      </label>
      <label class="fld"><span>Operator</span><select id="operator"></select></label>
      <label class="fld"><span>From</span><input id="from" type="date"></label>
      <label class="fld"><span>To</span><input id="to" type="date"></label>
      <button class="prime" data-act="search">Search</button>
      <button class="ghost" data-act="clear">Clear</button>
    </div>

    <details id="morefilters">
      <summary>More filters <span id="mfCount"></span></summary>
      <div class="mgrid">
        <label class="fld"><span>Manufacturer</span><input id="make" autocomplete="off"></label>
        <label class="fld"><span>Model</span><input id="model" autocomplete="off"></label>
        <label class="fld"><span>Part</span><input id="part" autocomplete="off"></label>
        <input type="hidden" id="jasc">
        <label class="fld"><span>System</span><input id="ata" autocomplete="off" placeholder="chapter, e.g. 32"></label>
        <label class="fld"><span>Found</span><select id="nature"></select></label>
        <label class="fld"><span>Crew action</span><select id="crew"></select></label>
        <label class="fld"><span>Part condition</span><select id="condition"></select></label>
        <label class="fld"><span>How found</span><select id="discovered"></select></label>
        <label class="fld"><span>Stage of flight</span><select id="stage"></select></label>
        <label class="fld"><span>Zone on the aircraft</span><select id="zone"></select></label>
        <label class="fld"><span>Tail number</span><input id="tail" autocomplete="off" placeholder="without the N"></label>
        <label class="fld"><span>Corrosion</span><select id="corrosion"></select></label>
        <label class="fld"><span>Cracking</span><select id="cracked"><option value="">Cracked or not</option><option value="1">Cracked</option></select></label>
        <label class="fld"><span>At least this many hours</span><input id="minhours" inputmode="numeric" autocomplete="off"></label>
      </div>
    </details>

    <div class="chipsrow">
      <div id="unresolved" class="unresolved" hidden></div>
      <div id="chiprow" class="chiprow"></div>
    </div>

    <div id="sentence" class="standing" aria-live="polite"></div>

    <div class="starterswrap">
      <div class="eyebrow-k">Start from a question</div>
      <div id="starters"></div>
      <button class="ghost" id="starterToggle" data-act="starters-toggle" style="margin-top:8px">12 more questions</button>
    </div>

    <div class="seamrow"><button id="seamBtn" class="seam" data-act="seam"></button></div>
  </div>

  <div class="toolrow">
    <div id="count" class="countline" aria-live="polite"></div>
    <div class="tools">
      <button id="copyBtn" class="ghost" data-act="copylink" disabled>Copy link</button>
      <span id="copied" class="copied" hidden>copied</span>
      <button id="exportBtn" class="ghost" data-act="export" disabled>Export CSV</button>
      <button id="moreBtn" class="ghost" data-act="more" hidden>Load 100 more</button>
    </div>
  </div>

  <div id="nosearch" class="nosearch" hidden></div>
  <div id="onpurpose" class="onpurpose" hidden></div>
  <div id="zero" class="zero" hidden></div>

  <div class="cut" id="cut" hidden>
    <span class="cs" id="cs"></span>
    <span class="cm" id="cm1"></span><span class="cm" id="cm2"></span><span class="cm" id="cm3"></span>
    <span id="runs" class="runs"></span>
    <button class="backup ghost" data-act="backup">&uarr; back to the instrument</button>
  </div>
  <div id="swipehint" class="swipehint" hidden>Swipe the table sideways for System, Part, what was found, what the crew did, how it was found, the stage of flight and the report button.</div>

  <div class="tablewrap" id="tablewrap" hidden>
    <table id="reptable">
      <thead><tr>
        <th>Date</th><th>Operator</th><th>Aircraft</th><th>Tail</th><th>System</th><th>Part</th>
        <th>What was found</th><th>Crew did</th><th>Found by</th><th>Stage</th><th></th>
      </tr></thead>
      <tbody id="repbody"></tbody>
    </table>
  </div>
</section>

<div id="case-wrap" hidden>
  <div class="case-backdrop"></div>
  <div id="case-box" role="dialog" aria-modal="true" aria-labelledby="case-title" tabindex="-1"></div>
</div>
<div id="tip" class="tip" hidden></div>

<script>
(function(){
'use strict';
/* ================= helpers ================= */
const el=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=n=>Number(n||0).toLocaleString('en-US');
const deb=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};};
const MON3=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONFULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
function clean(s){const ta=document.createElement('textarea');ta.innerHTML=String(s==null?'':s);return ta.value;}
function ukDate(s){const p=String(s||'').split('/');if(p.length!==3)return String(s||'');return `${+p[1]} ${MON3[+p[0]-1]||'?'} ${p[2]}`;}
function prettyDate(s){const p=String(s||'').split('-');if(p.length!==3)return String(s||'');return `${+p[2]} ${MON3[+p[1]-1]||'?'} ${p[0]}`;}
function monthLabel(m){const p=String(m||'').split('-');return p.length===2?`${MONFULL[+p[1]-1]||'?'} ${p[0]}`:String(m||'');}
function isCalDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const[y,m,d]=v.split('-').map(Number);
  if(m<1||m>12||d<1)return false;const dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;}
function sentenceCase(s){s=String(s||'');return s?s.charAt(0).toUpperCase()+s.slice(1):s;}

/* ================= constants (id IS the parameter name) ================= */
const FIELDS=['q','operator','make','model','part','ata','jasc','nature','crew','condition','stage','zone','tail','discovered','corrosion','cracked','minhours','from','to'];
const LABELS={q:'Text',operator:'Operator',make:'Manufacturer',model:'Model',part:'Part',ata:'System',jasc:'Exact system',nature:'Found',crew:'Crew action',condition:'Part condition',stage:'Stage of flight',zone:'Zone on the aircraft',tail:'Tail number',discovered:'How found',corrosion:'Corrosion',cracked:'Cracking',minhours:'At least this many hours',from:'From',to:'To'};
const HIDDEN_FIELDS=FIELDS.filter(k=>!['q','operator','from','to'].includes(k));
const URL_KNOWN=FIELDS.concat(['view','hero','case','aircraft','ca','cb','cf']);
const NO_RAIL=['q','make','model','part','condition','discovered','stage','corrosion','cracked','minhours','jasc','ata'];
const CLAUSE_ORDER=['q','jasc','ata','part','condition','zone','operator','make','model','tail','crew','nature','discovered','stage','corrosion','minhours','cracked','from','to'];
const FOLLOWS_FILTER=['p-search','p-patterns','p-found'];
const VIEW_GROUPS={'Narrows to what you selected':['p-search','p-patterns','p-aircraft','p-found'],'Ignore your selection':['p-fleet','p-leads','p-emerging','p-clusters','p-defect','p-structure','p-age','p-engines','p-consequences'],'Reference':['p-compare','p-terms','p-method']};
const KINDLAB={period:'MONTH OR YEAR',zone:'ZONE',operator:'AIRLINE',tail:'TAIL',jasc:'SYSTEM',q:'WORD IN THE WRITE-UPS'};
const AIMPH={period:'a month or a year, e.g. August or 2025',operator:'an airline, e.g. United or UAL',tail:'a tail number, e.g. N583',zone:'a zone, e.g. 300',jasc:'a system code, e.g. 3230','':'any words the mechanic wrote, e.g. bird strike'};
const STARTERS=[
 ['Smoke or fumes in the cabin',{nature:'B'}],['Cracks found',{q:'crack'}],['Engine shut down in flight',{crew:'E'}],
 ['Unscheduled landing',{crew:'A'}],['Bird strikes',{q:'bird'}],['Landing gear trouble',{ata:'32'}],
 ['Something burning',{q:'burn'}],['Fuel leaks',{q:'fuel leak'}],['Oxygen masks dropped',{crew:'G'}],
 ['Cabin lost pressure',{crew:'I'}],['Aborted take-off',{crew:'C'}],['Corrosion past the limit',{corrosion:'2'}],
 ['Urgent corrosion, level 3',{corrosion:'3'}],['Damage no one could see',{discovered:'E'}],['Engine flameout',{nature:'X'}],
 ['Uncontained engine failure',{nature:'T'}],['Old airframes, 50,000 hours plus',{minhours:'50000'}],['Something fell off in flight',{nature:'D'}]
];

/* ================= state ================= */
let CODES={},TERMS={},TERMRE=null,OPGAP='Some reports arrive without an operator because the FAA form leaves it blank; this desk names no airline where the FAA names none.';
let TOTAL=0,RANGE={from:'2007-01-03',to:'2025-12-16'},UNDATED_TOTAL=0;
let heroData=null,HERO_FOR=null,heroKindV='month';
let REVEALED=false,booted=false,lastQS=null;
let LOADED=[],CASE_ORDER=[],LASTLOADED=0,LAST_TOTAL_CUR=null,LASTMONTH='';
let UNRESOLVED={},currentCase=null,caseFromLink=false,lastFocus=null;
let HELD=null,LASTAIM='',heldT=null;
let SUG=[],SUGI=-1,AIMOPTS=[],sugSeq=0,qSugSeq=0,LOOTOKEN=0;
let STOPS=[],STOPIDX=0,ROWLEN=1;
const heroKind=()=>heroKindV;
const anyFilter=()=>params().toString()!=='';

/* ================= deterministic local stand-in for api/* =================
   Used only when no real server answers api/glossary at boot. Delete this
   object (and REMOTE detection) to run against the server alone. */
const SDRLocal=(()=>{
  const BASE=1757827,UNDATED=312;
  const DAY0=Date.UTC(2007,0,3),DAY1=Date.UTC(2025,11,16);
  const SPAN=Math.round((DAY1-DAY0)/86400000)+1;
  const h32=s=>{let h=2166136261>>>0;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
  const rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
  const K=(label,faa,note,share)=>({label,faa:faa||'',note:note||'',share:share||0});
  const nature={'0':K('Not recorded','NOT AVAILABLE','',.30),A:K('Hard landing','HARD LANDING','',.012),
    B:K('Smoke or fumes in the cabin','SMOKE OR FUMES IN THE CABIN','',.021),
    C:K('Contrary to approved procedures','CONTRARY TO APPROVED PROCEDURES','',.0016),
    D:K('A part came off in flight','SEPARATION OF PART IN FLIGHT','The physical part departed the aircraft while airborne.',.006),
    E:K('Not enough information','INSUFFICIENT INFORMATION','',.041),F:K('Fire','FIRE','',.0018),
    G:K('Lightning strike','LIGHTNING STRIKE','',.0021),H:K('Hail damage','HAIL DAMAGE','',.0009),
    I:K('Ice','ICING','',.0031),J:K('Turbulence encounter','TURBULENCE','',.0028),
    K:K('Water intrusion','WATER CONTAMINATION','',.0012),L:K('Fluid leak','HYDRAULIC OR OIL LEAK','',.031),
    M:K('System or component malfunction','MALFUNCTION OF SYSTEM OR COMPONENT','',.092),
    N:K('No fault found','NO FAULT FOUND','',.018),P:K('Passenger-created damage','PASSENGER-CAUSED DAMAGE','',.0035),
    T:K('Uncontained engine failure','UNCONTAINED ENGINE FAILURE, PARTS LEFT THE CASE','',.0004),
    V:K('Cracking found','CRACKING','',.0125),X:K('Engine flameout','ENGINE FLAMEOUT IN FLIGHT','',.0009)};
  const precaution={'0':K('No crew action','NONE','',.62),A:K('Made an unscheduled landing','MADE AN UNSCHEDULED LANDING','',.019),
    B:K('Deplaned the passengers','DEPLANED PASSENGERS','',.012),C:K('Aborted the take-off','ABORTED TAKE-OFF','',.0021),
    D:K('Returned to the gate','RETURNED TO GATE','',.0081),E:K('Shut an engine down in flight','ENGINE SHUTDOWN IN FLIGHT','',.0043),
    F:K('Diverted to another field','DIVERTED','',.0072),G:K('Dropped the oxygen masks','OXYGEN MASKS DEPLOYED','',.0007),
    H:K('Declared an emergency','EMERGENCY DECLARED','',.0009),I:K('Lost cabin pressure','CABIN PRESSURE LOST','',.0009),
    J:K('Towed the aircraft in','AIRCRAFT TOWED','',.0063),K:K('Not applicable','NOT APPLICABLE','',.0021)};
  const condition={BK:K('Broken','BROKEN','',.05),BR:K('Burned','BURNED','',.004),CH:K('Chafed','CHAFED','',.062),
    CR:K('Cracked','CRACKED','',.071),CT:K('Corroded','CORRODED','',.043),DE:K('Deteriorated','DETERIORATED','',.031),
    ER:K('Worn beyond limits','EXCESSIVE WEAR','',.052),LE:K('Leaking','LEAKING','',.038),LO:K('Loose','LOOSE','',.028),
    MS:K('Missing','MISSING','',.012),NF:K('No fault found','NO FAULT FOUND','',.018)};
  const stage={'00':K('Not applicable','NOT APPLICABLE','',.002),'01':K('Aircraft parked','PARKED','',.04),
    '02':K('Taxi','TAXI','',.06),'03':K('Take-off','TAKE-OFF','',.11),'04':K('Climb','CLIMB','',.08),
    '05':K('Cruise','CRUISE','',.27),'06':K('Descent','DESCENT','',.09),'07':K('Approach','APPROACH','',.12),
    '08':K('Landing','LANDING','',.17),'09':K('Standing, engines running','STANDING','',.05)};
  const discovered={'0':K('Not recorded','NOT AVAILABLE','',.0012),A:K('During scheduled maintenance','FOUND DURING SCHEDULED MAINTENANCE','',.18),
    B:K('By cockpit indication','INDICATED BY COCKPIT INSTRUMENT','',.021),C:K('During the preflight walk-around','PREFLIGHT WALK-AROUND','',.094),
    D:K('By a warning system','WARNING SYSTEM INDICATION','',.015),
    E:K('By instrument; not visible from outside','FOUND BY INSTRUMENT, NOT VISIBLE EXTERNALLY','Nothing could be seen from outside the aircraft.',.0038),
    F:K('By another crew\u2019s report','CREW REPORT','',.012),G:K('During troubleshooting','TROUBLESHOOTING','',.021),
    M:K('By onboard instrument reading','ONBOARD INSTRUMENT READING','',.017),T:K('By test equipment','TEST EQUIPMENT','',.011),
    U:K('By built-in test','BUILT-IN TEST EQUIPMENT (BITE)','',.008),X:K('By flight-deck indication','FLIGHT DECK INDICATION','',.026)};
  const corrosion={'1':K('Corrosion within limits','CORROSION LEVEL 1','Within limits; cleaned and returned to service.',.012),
    '2':K('Corrosion past the limit','CORROSION LEVEL 2','Beyond limits; repair required before further flight.',.0043),
    '3':K('Corrosion, urgent','CORROSION LEVEL 3','Obliged the operator to notify the regulator within three days.',.0011)};
  const part_location={'ZONE 000':K('No zone recorded','', '',0),'ZONE 100':K('Nose and flight deck','ZONE 100','',0),
    'ZONE 200':K('Centre fuselage and cabin','ZONE 200','','ZONE200'),'ZONE 300':K('Aft fuselage and empennage','ZONE 300','',0),
    'ZONE 400':K('Left wing','ZONE 400','',0),'ZONE 500':K('Right wing','ZONE 500','',0),'ZONE 600':K('Landing gear bays','ZONE 600','',0),
    'ZONE 700':K('Engines and pylons','ZONE 700','',0),'ZONE 800':K('Doors and interiors','ZONE 800','',0)};
  const ZT={'ZONE 100':209131,'ZONE 200':84453,'ZONE 300':147288,'ZONE 400':126004,'ZONE 500':127880,'ZONE 600':93115,'ZONE 700':170242,'ZONE 800':112976,'ZONE 000':0};
  const ataLab={'21':'Air conditioning','22':'Auto flight','23':'Communications','24':'Electrical power','25':'Equipment and fittings','26':'Fire protection','27':'Flight controls','28':'Fuel','29':'Hydraulic power','30':'Ice and rain','31':'Indicating and recording','32':'Landing gear','33':'Lights','34':'Navigation','35':'Oxygen','36':'Pneumatic','49':'Auxiliary power','52':'Doors','53':'Fuselage','55':'Stabilisers','56':'Windows','57':'Wings','71':'Power plant','73':'Engine fuel and control','77':'Engine indicating','79':'Oil'};
  const ATAS={'21':.031,'22':.008,'23':.012,'24':.038,'25':.021,'26':.009,'27':.033,'28':.041,'29':.026,'30':.011,'31':.014,'32':.062,'33':.009,'34':.017,'35':.006,'36':.014,'49':.012,'52':.023,'53':.017,'55':.008,'56':.012,'57':.021,'71':.058,'73':.021,'77':.011,'79':.018};
  const JLIST=[['3230','Main landing gear','LANDING GEAR, MAIN','32',.0031],['3210','Nose landing gear','LANDING GEAR, NOSE','32',.0012],
    ['3251','Brake assemblies','WHEEL BRAKES','32',.0009],['2851','Fuel tank cells','FUEL TANKS','28',.0021],
    ['2830','Fuel pumps','ENGINE-DRIVEN FUEL PUMPS','28',.0007],['2430','AC generators','GENERATORS, AC','24',.0009],
    ['2741','Elevator actuation','ELEVATOR ACTUATION','27',.0006],['2731','Aileron cables','AILERON CONTROL SYSTEM','27',.0008],
    ['7150','Engine fan section','FAN AND CASE','71',.0007],['3510','Crew oxygen','OXYGEN, CREW','35',.0004],
    ['2110','Air conditioning packs','AIR CONDITIONING PACKS','21',.0011],['5211','Cargo doors','DOORS, CARGO COMPARTMENT','52',.0008],
    ['5710','Wing structure','WING STRUCTURE','57',.0009],['7930','Engine oil system','OIL SYSTEM, ENGINE','79',.0006],
    ['3421','Navigation computers','NAVIGATION COMPUTERS','34',.0005]];
  const JASCMAP={};JLIST.forEach(j=>JASCMAP[j[0]]={code:j[0],label:j[1],faa:j[2],ch:j[3],share:j[4]});
  const JBYCH={};JLIST.forEach(j=>{(JBYCH[j[3]]=JBYCH[j[3]]||[]).push(JASCMAP[j[0]]);});
  const OPS={UAL:{code:'UAL',name:'United Airlines',share:.071},DAL:{code:'DAL',name:'Delta Air Lines',share:.083},
    AAL:{code:'AAL',name:'American Airlines',share:.077},SWA:{code:'SWA',name:'Southwest Airlines',share:.062},
    JBU:{code:'JBU',name:'JetBlue Airways',share:.021},ASA:{code:'ASA',name:'Alaska Airlines',share:.018},
    FDX:{code:'FDX',name:'Federal Express',share:.026},UPS:{code:'UPS',name:'United Parcel Service',share:.019},
    NKS:{code:'NKS',name:'Spirit Airlines',share:.014},FFT:{code:'FFT',name:'Frontier Airlines',share:.011},
    AAY:{code:'AAY',name:'Allegiant Air',share:.012},HAL:{code:'HAL',name:'Hawaiian Airlines',share:.008},
    SKW:{code:'SKW',name:'SkyWest Airlines',share:.024},ENV:{code:'ENV',name:'Envoy Air',share:.013},
    RPA:{code:'RPA',name:'Republic Airways',share:.012}};
  const MODELS=[['Boeing','737-800',.092],['Boeing','737-700',.041],['Boeing','737-900',.018],['Boeing','757-200',.022],
    ['Boeing','767-300',.017],['Boeing','777-200',.014],['Boeing','787-8',.011],['Boeing','747-400',.006],
    ['Airbus','A319',.021],['Airbus','A320',.038],['Airbus','A321',.024],['Airbus','A330',.012],
    ['Embraer','E175',.023],['Embraer','E190',.009],['Bombardier','CRJ-700',.012],['ATR','72-600',.004]]
    .map(m=>({make:m[0],model:m[1],share:m[2]}));
  const PARTS=[['Main gear trunnion pin','S614-30023',.0007],['Fuel pump assembly','P2187-4',.0006],['Cargo door seal','BMS5V-1173',.0005],
    ['Cockpit window heat blanket','CW-88231',.0003],['Engine fan blade','F1826-9',.0004],['Hydraulic line fitting','BACB30LU8K',.0008],
    ['Pack temperature sensor','ATS-2210',.0004],['Wing skin panel','WS-114-7',.0005],['Crew oxygen cylinder','O2-1150L',.0002],
    ['Elevator actuator rod','EA-77114',.0003],['Cargo latch roller','CLR-88',.0002],['Brake wear pin','BWP-32',.0009],
    ['Pneumatic duct coupling','PDC-401',.0004],['Aileron cable','AC-33-8',.0003],['Landing gear shim','LG-SH-22',.0002],
    ['Galley insert','GAL-77',.0003],['Outflow valve actuator','OVA-221',.0003],['Window heat controller','WHC-12',.0002],
    ['Steering selector valve','SSV-440',.0002],['Fuel control unit','9312F',.0002]]
    .map(p=>({name:p[0],pn:p[1],share:p[2]}));
  const VOCAB=[['crack',21481],['cracked',19884],['corrosion',18872],['burn',9054],['seal',15230],['fuel leak',7231],
    ['smoke',6644],['fumes',5320],['bird strike',3122],['bird',3401],['tire',8804],['brake',7715],['chafed',6810],
    ['lightning',2960],['hail',1130],['vibration',4402],['windshield',3305],['deice',1878],['radome',942],
    ['flap track',1266],['hydraulic',5221],['oxygen',2044],['door',9810],['window',4188],['actuator',3077],
    ['no fault',1801],['hard landing',2280],['turbine',1550],['water',4400],['inop',3900]];
  const VOCABM={};VOCAB.forEach(v=>VOCABM[v[0]]=v[1]);
  const TAILS=[],TAILMAP={};{const TR=rng(777);
    [['583',31],['604RE',22],['905DN',18],['217UX',15],['348UA',26],['772AQ',12],['514DL',19],['826AA',9],['651WN',14],['939BR',7]]
      .forEach(f=>{TAILS.push({v:f[0],n:f[1]});TAILMAP[f[0]]=f[1];});
    for(let i=0;i<210;i++){const n2=101+Math.floor(TR()*9200),l1='ABCDEFGHJK'[Math.floor(TR()*10)],
      l2=TR()<0.6?'':'ABCDEFGHJK'[Math.floor(TR()*10)],v=String(n2)+l1+l2;
      if(!TAILMAP[v]){const n=1+Math.floor(Math.pow(TR(),2.4)*80);TAILS.push({v,n});TAILMAP[v]=n;}}}
  const FILERS=['J. MERCER, avionics','R. OKAFOR, powerplant','S. LINDQVIST, structures','D. ARROYO, interiors'];
  const TPL=[
  `Found {P} cracked at the forward attach lug during scheduled check, crack measured 1.4 inches, beyond amm limits. Part tagged and quarantined. <P>Removed and replaced {P} per amm chapter 32-11, borescope of adjacent structure no further indication, torque strip and ops check satisfactory.`,
  `Flight crew reported smoke and fumes in the cabin about ten minutes after takeoff, eicas left pack temperature high. <P>Isolated to the left air cycle machine, found bearing seized with metal fines in the duct. Replaced ACM p/n 472B10, ops check satisfactory, cabin air normal on two following legs.`,
  `Bird strike. Remains found on the radome and number one engine inlet during the postflight walk-around. Three fan blades beyond limits at stage one. <P>Borescope per sb, replaced three fan blades and the radome abrasion strip, fod walk of the runway turnoff completed, no further action.`,
  `Right main gear tire found flat on arrival, fusible plugs melted, brake core worn past minimum. {T} parked at stand 14. <P>Changed both tires on the bogie, r&r brake assembly per amm 32-41, torque checked, gear retraction test normal.`,
  `Fuel leak from the left wing access panel 141AB during the transit check, drip rate about thirty drops a minute at the pump fitting. Item deferred one day under mel. <P>Re-torqued the fuel pump assembly fitting and replaced the o-ring per amm 28-11-02, leak check dry after thirty minutes, panel closed and signed off.`,
  `Corrosion found under the galley floorboards during cpcp inspection, level 2 on seat tracks and stringer, pitting past limit in two places. <P>Blend and treat per cpcp, primer and sealant applied, findings photographed for the fleet record, repeat check at next A check.`,
  `Cockpit window heat inop on the captain's number two window, fogging noted in the corner. <P>Checked bus and sensor, resistance out of limits, replaced window heat blanket and the controller, functional check good.`,
  `Aileron cable tension low, control feel abnormal reported on the climb out. <P>Rigged aileron cables per amm 27-21, replaced one frayed cable at pulley six, double inspect signed, ops check normal.`,
  `Hydraulic reservoir quantity dropping about one quart per hundred cycles, no external stain found overnight. <P>UV dye added and flown one leg, leak traced to the elevator actuator rod seal, replaced actuator, serviced and leak-down check passed.`,
  `Cabin would not hold differential in cruise, outflow valve indication erratic on the eicas. <P>Found outflow valve actuator sticking, cleaned and lubed per sb, pressurization test to eight psi held, no further action.`,
  `Nose gear steering erratic during pushback, tiller position light flickering. <P>Re-rigged steering cables per amm 32-51, replaced the steering selector valve, pushback and taxi check normal.`,
  `Cargo door latch roller found missing on preflight, door warning light inop with the handle not fully stowed, aog part sourced overnight. <P>Installed new roller and pin per ilp, adjusted latch hooks, closure and warning system check good.`,
  `Light burn smell reported near the overwing exit, row twenty one, after departure. <P>Found a galley insert element arcing, replaced insert and connector, no further odor on two test legs.`,
  `ndt found a crack indication at the {P} attach fitting during cpcp, eddy current, within the limit allowed by the sb but marked for follow-up. <P>Photographed and dimensioned, repeat ndt at three hundred cycles, engineering concurrence filed.`,
  `Number two engine vibration exceedance during the climb, flag on the eicas, settled after thrust reduction. <P>Borescope and trim balance run, added weight at the fan, vibration within limits on the test run, oil sample clean.`,
  `Number one engine flamed out in cruise, relight successful at flight idle, fuel temperature near limit. <P>Replaced the fuel control unit p/n 9312F, rigging checked per amm 73-21, engine run and relight check normal.`];
  const TERMS={amm:{label:'Aircraft Maintenance Manual',note:'The airline\u2019s own approved repair instructions.'},
    mel:{label:'Minimum Equipment List',note:'The list of faults with which an aircraft may still fly, under conditions.'},
    inop:{label:'Inoperative',note:'The item did not work when tested.'},'p/n':{label:'Part number',note:''},
    'r&r':{label:'Remove and replace',note:''},fod:{label:'Foreign object debris',note:''},
    aog:{label:'Aircraft on ground',note:'The aircraft cannot fly until the fault is fixed.'},
    ad:{label:'Airworthiness Directive',note:'A legally enforceable repair or inspection order from the FAA.'},
    sb:{label:'Service Bulletin',note:'The maker\u2019s recommended fix; not by itself mandatory.'},
    cpcp:{label:'Corrosion Prevention and Control Program',note:''},
    ndt:{label:'Non-destructive testing',note:'Inspection without taking the part apart: dye, ultrasound, eddy current.'},
    eicas:{label:'Engine-indicating and crew-alerting system',note:'The flight-deck screens that announce faults.'}};
  const OPGAP='The FAA form leaves the operator blank on a share of reports, mostly those filed by repair stations; where the FAA names no operator, this desk names none.';
  const OPAIRS=[['',.055]].concat(Object.keys(OPS).map(k=>[k,OPS[k].share]));
  const NPAIRS=Object.keys(nature).filter(k=>k!=='0').map(k=>[k,nature[k].share]);
  const PPAIRS=Object.keys(precaution).filter(k=>k!=='0'&&k!=='K').map(k=>[k,precaution[k].share]);
  const CPAIRS=Object.keys(condition).map(k=>[k,condition[k].share]);
  const SPAIRS=Object.keys(stage).filter(k=>k!=='00').map(k=>[k,stage[k].share]);
  const DPAIRS=Object.keys(discovered).filter(k=>k!=='0').map(k=>[k,discovered[k].share]);
  const ZPAIRS=Object.keys(part_location).filter(k=>k!=='ZONE 000'&&k!=='ZONE 200').map(k=>[k,ZT[k]/BASE]);ZPAIRS.push(['ZONE 200',ZT['ZONE 200']/BASE]);
  const MPAIRS=MODELS.map(m=>[m,m.share]);
  const PPICKS=PARTS.map(p=>[p,p.share]);
  const JPICKS=JLIST.map(j=>[JASCMAP[j[0]],j[4]]);
  function pickW(R,pairs){let sum=0;pairs.forEach(p=>sum+=p[1]);let x=R()*sum,acc=0;
    for(let i=0;i<pairs.length;i++){acc+=pairs[i][1];if(x<acc)return pairs[i][0];}return pairs[pairs.length-1][0];}
  const dayOf=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return 0;const p=iso.split('-');
    return Math.max(0,Math.round((DAY1-Date.UTC(+p[0],+p[1]-1,+p[2]))/86400000));};
  const isoOf=day=>{const d=new Date(DAY1-Math.min(day,SPAN-1)*86400000);
    return `${String(d.getUTCMonth()+1).padStart(2,'0')}/${String(d.getUTCDate()).padStart(2,'0')}/${d.getUTCFullYear()}`;};
  const isoISO=day=>{const d=new Date(DAY1-Math.min(day,SPAN-1)*86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;};
  const ukd=s=>{const p=String(s||'').split('/');return p.length===3?`${+p[1]} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[0]-1]} ${p[2]}`:String(s||'');};
  const rankAt=day=>BASE*Math.pow(Math.min(day,SPAN)/SPAN,1/0.82);
  function countRangeFrac(a,b){const da=dayOf(a),db=dayOf(b);if(db>da)return 0;
    const lo=Math.max(0,db),hi=Math.min(SPAN,da+1);
    return Math.max(0,Math.min(BASE,Math.floor(rankAt(hi))-Math.floor(rankAt(lo))))/BASE;}
  const qShare=q=>{const ql=String(q||'').toLowerCase();
    return VOCABM[ql]!=null?VOCABM[ql]/BASE:0.0012+(h32('q'+ql)%60)/10000;};
  const qCount=q=>Math.round(BASE*qShare(q));
  const zoneShare=v=>ZT[v]!=null?ZT[v]/BASE:0;
  const tailShare=v=>{const t=String(v||'').replace(/^N/i,'');return TAILMAP[t]?TAILMAP[t]/BASE:0.5/BASE;};
  function engineCount(p,range){let c=BASE;
    if(p.q)c*=qShare(p.q);
    if(p.operator)c*=OPS[p.operator]?OPS[p.operator].share:0.001;
    if(p.make)c*=0.04+(h32('mk'+p.make)%38)/100;
    if(p.model)c*=0.02+(h32('md'+p.model)%9)/100;
    if(p.part)c*=0.0008+(h32('pt'+p.part)%20)/10000;
    if(p.ata)c*=ATAS[p.ata]!=null?ATAS[p.ata]:0.02;
    if(p.jasc)c*=JASCMAP[p.jasc]?JASCMAP[p.jasc].share:0.0002;
    if(p.nature)c*=nature[p.nature]?nature[p.nature].share:0;
    if(p.crew)c*=precaution[p.crew]?precaution[p.crew].share:0;
    if(p.condition)c*=condition[p.condition]?condition[p.condition].share:0;
    if(p.stage)c*=stage[p.stage]?stage[p.stage].share:0;
    if(p.discovered)c*=discovered[p.discovered]?discovered[p.discovered].share:0;
    if(p.corrosion)c*=corrosion[p.corrosion]?corrosion[p.corrosion].share:0;
    if(p.cracked)c*=0.02;
    if(p.tail)c*=tailShare(p.tail);
    if(p.minhours)c*=0.14;
    if(p.zone)c*=zoneShare(p.zone);
    const a=(range&&range.from)||p.from||RANGE.from,b=(range&&range.to)||p.to||RANGE.to;
    c*=Math.max(0,Math.min(1,countRangeFrac(a,b)));
    return Math.max(0,Math.round(c));}
  function mkRow(r,p){const R=rng(h32('row'+r));
    const undated=r>=BASE-UNDATED;
    const topDay=rr=>Math.min(SPAN-1,Math.floor(Math.pow(rr/BASE,0.82)*SPAN));
    let day=topDay(r),dt=undated?'':isoOf(day);
    let runTail=null;
    if(!undated&&!(p.from||p.to)&&r%89>=83){const b=r-(r%89);runTail=TAILS[Math.floor(b/89)%TAILS.length].v;day=topDay(r);dt=isoOf(topDay(b+5));}
    if(!undated&&(p.from||p.to)){const hi=dayOf(p.from||RANGE.from),lo=dayOf(p.to||RANGE.to);
      const L=Math.max(0,Math.min(SPAN-1,Math.min(lo,hi))),H=Math.max(0,Math.min(SPAN-1,Math.max(lo,hi)));
      day=Math.min(H,L+Math.floor((r/BASE)*(H-L+1)));dt=isoOf(day);}
    const reg=p.tail?p.tail.replace(/^N/i,''):(runTail||(()=>{const n2=101+Math.floor(R()*9600),
      l1='ABCDEFGHJK'[Math.floor(R()*10)],l2=R()<0.5?'':'ABCDEFGHJK'[Math.floor(R()*10)];return String(n2)+l1+l2;})());
    const opv=p.operator||pickW(R,OPAIRS);const op=OPS[opv]||{code:opv,name:''};
    let model;
    if(p.model)model=MODELS.find(m=>m.model===p.model)||{make:p.make||'Unknown',model:p.model};
    else if(p.make){const ms=MODELS.filter(m=>m.make===p.make);model=ms.length?ms[Math.floor(R()*ms.length)]:{make:p.make,model:p.make};}
    else model=pickW(R,MPAIRS);
    const jc=p.jasc?JASCMAP[p.jasc]:(p.ata?((JBYCH[p.ata]&&JBYCH[p.ata].length)?JBYCH[p.ata][Math.floor(R()*JBYCH[p.ata].length)]:{code:p.ata+'10',label:(ataLab[p.ata]||'System')+' component',faa:'AS FILED',ch:p.ata}):pickW(R,JPICKS));
    const part=p.part?(PARTS.find(x=>x.name===p.part)||{name:p.part,pn:String(1000000+h32('pn'+p.part)%8999999)}):pickW(R,PPICKS);
    const zone=p.zone||(R()<0.05?'':pickW(R,ZPAIRS));
    const nA=p.nature||pickW(R,NPAIRS);
    const nB=(!p.nature&&R()<0.26)?pickW(R,NPAIRS):'';
    const nC=(!p.nature&&R()<0.10)?pickW(R,NPAIRS):'';
    const crew=['','','',''];
    if(p.crew)crew[0]=p.crew;else for(let i=0;i<4;i++){if(R()<0.14)crew[i]=pickW(R,PPAIRS);}
    const disc=p.discovered||pickW(R,DPAIRS),stageV=p.stage||pickW(R,SPAIRS),cond=p.condition||pickW(R,CPAIRS);
    const corr=p.corrosion||(R()<0.010?'2':(R()<0.0028?'3':''));
    const cracked=p.cracked||(R()<0.02?'1':'');
    const hours=p.minhours?Number(p.minhours)+Math.floor(R()*40000):Math.floor(R()*68000);
    let text=TPL[Math.floor(R()*TPL.length)].replace(/\{T\}/g,'N'+reg).replace(/\{P\}/g,part.name);
    if(p.q){const ql=String(p.q).toLowerCase();
      if(!text.toLowerCase().includes(ql)){const i=text.search(/<P>/i);const ins=`Finding reference: ${p.q}. `;
        text=i<0?text+' '+ins:text.slice(0,i)+ins+text.slice(i);}}
    const dtISO=dt?`${dt.slice(6)}-${dt.slice(0,2)}-${dt.slice(3,5)}`:'';
    const filedAt=dt?isoISO(dayOf(dt)-(2+Math.floor(R()*5))):'';
    const ctrl=String(7142000-r);
    return{OperatorControlNumber:ctrl,DifficultyDate:dt,OperatorCode:opv,Make:model.make,Model:model.model,
      RegistryNNumber:reg,JASCCode:jc.code,PartName:part.name,PartNumber:part.pn,PartCondition:cond,
      NatureOfConditionA:nA,NatureOfConditionB:nB,NatureOfConditionC:nC,
      PrecautionaryProcedureA:crew[0],PrecautionaryProcedureB:crew[1],PrecautionaryProcedureC:crew[2],PrecautionaryProcedureD:crew[3],
      HowDiscoveredCode:disc,StageOfOperationCode:stageV,CorrosionLevel:corr,CrackedFlag:cracked,PartLocation:zone,
      AircraftTotalTime:hours,AircraftCycles:Math.floor(hours/3.4),Discrepancy:text,
      FiledBy:R()<0.08?FILERS[Math.floor(R()*FILERS.length)]:'',
      _jasc:{code:jc.code,label:jc.label,ch:jc.code.slice(0,2)},_op:{code:opv,name:op.name},
      _cracks:cracked?1+Math.floor(R()*5):0,_ctx:{tail:2+Math.floor(R()*40),part:1+Math.floor(R()*70)},_dtiso:dtISO,
      _cite:`FAA Service Difficulty Report ${ctrl}. Difficulty dated ${ukd(dt)}${filedAt?`, filed with the FAA ${ukd(filedAt)}`:''}. Source: FAA Service Difficulty Reporting System, https://sdrs.faa.gov`};}
  function monthSeries(total){const out=[];let d=new Date(DAY1);
    for(let i=0;i<28;i++){out.push({m:`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`,n:Math.round(total*0.0088*Math.pow(0.988,i))});
      d.setUTCMonth(d.getUTCMonth()-1);}return out;}
  const WHAT={period:'a month or a year',operator:'an airline',tail:'an aircraft',zone:'a part of the aircraft',jasc:'a system'};
  function periodReadings(q){const out=[];const s=String(q||'').trim().toLowerCase();if(!s)return out;
    const ym=s.match(/^(\d{4})[-\/ ]?(\d{1,2})$/);
    if(ym){const y=+ym[1],m=+ym[2];if(m>=1&&m<=12&&y>=2007&&y<=2025){
      const from=`${y}-${String(m).padStart(2,'0')}-01`,to=`${y}-${String(m).padStart(2,'0')}-31`;
      out.push({kind:'period',label:`${MONFULL[m-1]} ${y}`,what:WHAT.period,n:Math.round(BASE*countRangeFrac(from,to)),v:`${y}-${m}`,from,to,best:2});}
      return out;}
    if(/^\d{4}$/.test(s)){const y=+s;if(y>=2007&&y<=2025){
      const from=`${y}-01-01`,to=`${y}-12-31`;
      out.push({kind:'period',label:s,what:WHAT.period,n:Math.round(BASE*countRangeFrac(from,to)),v:y,from,to,best:2});}return out;}
    const parts=s.split(/\s+/);const yr=(parts.find(p=>/^\d{4}$/.test(p))||'');const pre=parts.filter(p=>p!==yr).join(' ');
    if(!pre)return out;
    const matches=[];MONFULL.forEach((mn,i)=>{if(mn.startsWith(pre))matches.push(i);});
    matches.forEach(mi=>{const mk=i=>`2007-${String(i+1).padStart(2,'0')}`;
      if(yr&&+yr>=2007&&+yr<=2025){const from=`${yr}-${String(mi+1).padStart(2,'0')}-01`,to=`${yr}-${String(mi+1).padStart(2,'0')}-31`;
        out.push({kind:'period',label:`${MONFULL[mi]} ${yr}`,what:WHAT.period,n:Math.round(BASE*countRangeFrac(from,to)),v:from,from,to,best:2});}
      else{[2025,2024,2023].forEach(y=>{const from=`${y}-${String(mi+1).padStart(2,'0')}-01`,to=`${y}-${String(mi+1).padStart(2,'0')}-31`;
        out.push({kind:'period',label:`${MONFULL[mi]} ${y}`,what:WHAT.period,n:Math.round(BASE*countRangeFrac(from,to)),v:from,from,to,best:1});});}});
    return out;}
  function resolve(qraw,kind){const q=String(qraw||'').trim(),ql=q.toLowerCase();const out=[];
    const want=k=>!kind||kind===k;
    if(want('period'))out.push(...periodReadings(q));
    if(want('operator')){const up=ql.toUpperCase();
      if(OPS[up])out.push({kind:'operator',label:OPS[up].name,what:WHAT.operator,n:Math.round(BASE*OPS[up].share),v:up,best:2});
      if(ql.length>=3)Object.keys(OPS).forEach(c=>{if(OPS[c].name.toLowerCase().includes(ql))
        out.push({kind:'operator',label:OPS[c].name,what:WHAT.operator,n:Math.round(BASE*OPS[c].share),v:c,best:1});});}
    if(want('tail')){const stem=q.replace(/^N/i,'');
      if(/^[0-9A-Z]{1,6}$/.test(stem)){
        if(TAILMAP[stem])out.push({kind:'tail',label:'N'+stem,what:WHAT.tail,n:TAILMAP[stem],v:stem,best:2});
        TAILS.forEach(t=>{if(t.v!==stem&&t.v.startsWith(stem))out.push({kind:'tail',label:'N'+t.v,what:WHAT.tail,n:t.n,v:t.v,best:1});});}}
    if(want('jasc')&&/^\d{4}$/.test(q)&&JASCMAP[q])
      out.push({kind:'jasc',label:JASCMAP[q].label,what:WHAT.jasc,n:Math.round(BASE*JASCMAP[q].share),v:q,best:2});
    if(want('zone')){const up=q.toUpperCase();
      if(/^ZONE \d00$/.test(up)&&ZT[up]!=null&&up!=='ZONE 000')
        out.push({kind:'zone',label:part_location[up].label,what:WHAT.zone,n:ZT[up],v:up,best:2});
      if(ql.length>=3)Object.keys(part_location).forEach(z=>{if(z!=='ZONE 000'&&part_location[z].label.toLowerCase().includes(ql))
        out.push({kind:'zone',label:part_location[z].label,what:WHAT.zone,n:ZT[z]||0,v:z,best:1});});}
    out.push({kind:'q',label:q,what:'a word in the write-ups',n:qCount(q),v:q,best:0});
    const seen=new Set();
    const ded=out.filter(o=>{const k=o.kind+'|'+o.label+'|'+o.v;if(seen.has(k))return false;seen.add(k);return true;});
    ded.sort((a,b)=>((a.kind==='q')-(b.kind==='q'))||((b.best||0)-(a.best||0))||(b.n-a.n)||a.label.localeCompare(b.label));
    return{readings:ded};}
  function glossary(){const withN=o=>{const c={};Object.keys(o).forEach(k=>c[k]={label:o[k].label,faa:o[k].faa,note:o[k].note,n:Math.round(BASE*(o[k].share||0))});return c;};
    const ata={};Object.keys(ataLab).forEach(k=>ata[k]={label:ataLab[k],faa:'ATA CHAPTER '+k,note:'',n:Math.round(BASE*(ATAS[k]||0))});
    const jasc={};JLIST.forEach(j=>jasc[j[0]]={label:j[1],faa:j[2],note:'',n:Math.round(BASE*j[4])});
    const op={};Object.keys(OPS).forEach(c=>op[c]={label:OPS[c].name,name:OPS[c].name,faa:'',note:'',n:Math.round(BASE*OPS[c].share)});
    return{codes:{nature:withN(nature),precaution:withN(precaution),condition:withN(condition),stage:withN(stage),
      discovered:withN(discovered),corrosion:withN(corrosion),part_location:withN(part_location),ata,jasc,operator:op},
      terms:TERMS,opgap:OPGAP};}
  function vocab(q,limit){const ql=String(q||'').toLowerCase();
    let list=VOCAB.filter(v=>v[0].startsWith(ql));
    if(list.length<limit)list=list.concat(VOCAB.filter(v=>!v[0].startsWith(ql)&&v[0].includes(ql)));
    list=list.slice().sort((a,b)=>b[1]-a[1]).slice(0,limit);
    return{readings:list.map(v=>({w:v[0],n:v[1]}))};}
  function validate(o){const rejected=[],unknown=[];
    const EXTRA=['enginemake','enginemodel','partmake'];
    Object.keys(o).forEach(k=>{if(!FIELDS.includes(k)&&!EXTRA.includes(k)&&!['limit','offset','hero','case'].includes(k))unknown.push(k);});
    FIELDS.forEach(k=>{const v=o[k];if(v==null||v==='')return;let ok=true;
      if(k==='zone')ok=/^ZONE \d00$/.test(v);
      else if(k==='jasc')ok=/^\d{4}$/.test(v);
      else if(k==='corrosion')ok=['1','2','3'].includes(v);
      else if(k==='cracked')ok=v==='1';
      else if(k==='minhours')ok=/^\d+$/.test(v);
      else if(k==='from'||k==='to')ok=isCalDate(v);
      else if(k==='nature')ok=!!nature[v];
      else if(k==='crew')ok=!!precaution[v];
      else if(k==='condition')ok=!!condition[v];
      else if(k==='stage')ok=!!stage[v];
      else if(k==='discovered')ok=!!discovered[v];
      else if(k==='operator')ok=!!OPS[v];
      if(!ok)rejected.push({k,v,label:LABELS[k]});});
    if(rejected.length||unknown.length){
      const parts=[];
      if(unknown.length)parts.push(`This link uses a ${unknown.length===1?'name':'names'} this tool has no filter for: ${unknown.join(', ')}`);
      rejected.forEach(r=>parts.push(`This link asks for ${r.label} value, which is not a value this data holds`));
      throw{status:400,error:'BadFilter',rejected,unknown,message:parts.join('. ')+', so no query was run.'};}}
  const rowByCtrl=ctrl=>{if(!/^\d{1,8}$/.test(String(ctrl)))return null;
    const r=7142000-Number(ctrl);return(r<0||r>=BASE)?null:mkRow(r,{});};
  function doSearch(o){validate(o);
    if(o.case){const row=rowByCtrl(o.case);return{total:row?1:0,offset:0,limit:1,rows:row?[row]:[],months:[],undated:UNDATED,hero_line:''};}
    const p={};FIELDS.forEach(k=>{if(o[k])p[k]=o[k];});
    const total=engineCount(p);
    const limit=Math.max(1,Math.min(500,parseInt(o.limit||'100',10)||100));
    const offset=Math.max(0,parseInt(o.offset||'0',10)||0);
    const rows=[];const end=Math.min(total,offset+limit);
    for(let r=offset;r<end;r++)rows.push(mkRow(r,p));
    return{total,offset,limit,rows,months:monthSeries(total),undated:UNDATED,
      hero_line:`${num(total)} report${total===1?'':'s'}${anyF(p)?' in this selection':' in the whole file'}, newest first.`};}
  const anyF=p=>Object.keys(p).length>0;
  const numF=n=>Number(n||0).toLocaleString('en-US');
  const csvCell=s=>/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  function csv(p){const total=engineCount(p);const cap=Math.min(total,5000);
    const gl=condLabel=v=>condition[v]?condition[v].label:'';
    const cols=[['Control number',r=>r.OperatorControlNumber],['Date of difficulty',r=>r.DifficultyDate],
      ['Operator',r=>r.OperatorCode],['Operator name',r=>r._op.name],['Make',r=>r.Make],['Model',r=>r.Model],
      ['Tail number',r=>'N'+r.RegistryNNumber],['ATA chapter',r=>r._jasc.ch],
      ['ATA name',r=>ataLab[r._jasc.ch]||''],['JASC code',r=>r.JASCCode],['JASC name',r=>r._jasc.label],
      ['Part name',r=>r.PartName],['Part number',r=>r.PartNumber],['Part condition',r=>r.PartCondition],['Part condition name',r=>gl(r.PartCondition)],
      ['Found (nature A)',r=>r.NatureOfConditionA],['Found name',r=>nature[r.NatureOfConditionA]?nature[r.NatureOfConditionA].label:''],
      ['Found (nature B)',r=>r.NatureOfConditionB],['Found name 2',r=>nature[r.NatureOfConditionB]?nature[r.NatureOfConditionB].label:''],
      ['Found (nature C)',r=>r.NatureOfConditionC],['Found name 3',r=>nature[r.NatureOfConditionC]?nature[r.NatureOfConditionC].label:''],
      ['Crew action A',r=>r.PrecautionaryProcedureA],['Crew action name A',r=>precaution[r.PrecautionaryProcedureA]?precaution[r.PrecautionaryProcedureA].label:''],
      ['Crew action B',r=>r.PrecautionaryProcedureB],['Crew action name B',r=>precaution[r.PrecautionaryProcedureB]?precaution[r.PrecautionaryProcedureB].label:''],
      ['Crew action C',r=>r.PrecautionaryProcedureC],['Crew action name C',r=>precaution[r.PrecautionaryProcedureC]?precaution[r.PrecautionaryProcedureC].label:''],
      ['Crew action D',r=>r.PrecautionaryProcedureD],['Crew action name D',r=>precaution[r.PrecautionaryProcedureD]?precaution[r.PrecautionaryProcedureD].label:''],
      ['How found',r=>r.HowDiscoveredCode],['How found name',r=>discovered[r.HowDiscoveredCode]?discovered[r.HowDiscoveredCode].label:''],
      ['Stage of flight',r=>r.StageOfOperationCode],['Stage name',r=>stage[r.StageOfOperationCode]?stage[r.StageOfOperationCode].label:''],
      ['Zone',r=>r.PartLocation],['Zone name',r=>part_location[r.PartLocation]?part_location[r.PartLocation].label:''],
      ['Corrosion',r=>r.CorrosionLevel],['Corrosion name',r=>corrosion[r.CorrosionLevel]?corrosion[r.CorrosionLevel].label:''],
      ['Cracking',r=>r.CrackedFlag==='1'?'recorded':''],['Hours on airframe',r=>r.AircraftTotalTime],['Cycles',r=>r.AircraftCycles],
      ['The mechanic\'s words',r=>r.Discrepancy],['CaseSheetURL',r=>location.origin+location.pathname+'?case='+r.OperatorControlNumber]];
    const lines=[cols.map(c=>csvCell(c[0])).join(',')];
    for(let r=0;r<cap;r++){const row=mkRow(r,p);lines.push(cols.map(c=>csvCell(String(c[1](row)==null?'':c[1](row)))).join(','));}
    const pairs=FIELDS.filter(k=>p[k]).map(k=>`${k}-${p[k]}`);
    let name='sdr-'+(pairs.length?pairs.join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80):'all')+'.csv';
    let body=lines.join('\r\n');
    if(total>5000){name=name.replace(/\.csv$/,`-newest5000of${total}.csv`);
      body=`# This file holds the newest 5000 of ${numF(total)} matching reports. The oldest ${numF(total-5000)} are not in it. Narrow with a date range to export the rest.\r\n`+body;}
    return{csv:body,filename:name};}
  return{handle(ep,qs){const o={};new URLSearchParams(qs||'').forEach((v,k)=>{o[k]=v;});
      if(ep==='api/glossary')return glossary();
      if(ep==='api/facets')return{total:BASE,range:RANGE,undated:UNDATED,opgap:OPGAP};
      if(ep==='api/vocab')return vocab(o.q,Math.max(1,Math.min(20,parseInt(o.limit||'10',10)||10)));
      if(ep==='api/resolve')return resolve(o.q,o.kind||'');
      if(ep==='api/search')return doSearch(o);
      throw{status:404,message:'no such endpoint'};},
    csv:(p)=>{const o={};p.forEach?new URLSearchParams(p).forEach((v,k)=>{if(FIELDS.includes(k))o[k]=v;}):null;return csv(o);}};
})();

/* ================= api layer: real server if present, stand-in otherwise ================= */
let REMOTE=null;
async function detectRemote(){try{const c=new AbortController();const t=setTimeout(()=>c.abort(),1500);
  const r=await fetch('api/glossary',{signal:c.signal});clearTimeout(t);REMOTE=r.ok;}catch(e){REMOTE=false;}}
async function api(ep,qs){
  if(REMOTE===null)await detectRemote();
  if(REMOTE){const r=await fetch(ep+(qs?'?'+qs:''));let body=null;try{body=await r.json();}catch(e){}
    if(!r.ok)throw Object.assign({status:r.status},body||{message:'HTTP '+r.status});
    return body;}
  return SDRLocal.handle(ep,qs);}

/* ================= params / setFilter / commit ================= */
function params(){const p=new URLSearchParams();
  FIELDS.forEach(k=>{const e=el(k);if(!e)return;const v=(e.value||'').trim();if(v)p.set(k,v);});return p;}
function syncControls(){FIELDS.forEach(k=>{const e=el(k);if(e)e.classList.toggle('landed',!!(e.value&&String(e.value).trim()));});}
function syncMoreFilters(){const n=HIDDEN_FIELDS.filter(k=>{const e=el(k);return e&&e.value&&String(e.value).trim();}).length;
  el('mfCount').textContent=n?`(${n} active)`:'';
  if(n>0)el('morefilters').open=true;}
function commit(){syncControls();syncMoreFilters();show('p-search');search(0);showChange();}
function setFilter(k,v){const e=el(k);if(e)e.value=v;commit();}
function show(id){const p=document.getElementById(id);
  if(!p){aim('that view is not built in this half yet.');return;}
  scopeLine(id);paintHeld();}
function showChange(){const t=el('chiprow');if(!t)return;const r=t.getBoundingClientRect();
  if(r.top<8)window.scrollTo({top:window.scrollY+r.top-8,behavior:'smooth'});}

/* ================= pickers / starters / listeners ================= */
function opts(grp,skip,emptyLabel){const codes=CODES[grp]||{};
  const items=Object.keys(codes).filter(k=>!(skip||[]).includes(k)).map(k=>({k,label:codes[k].label,n:codes[k].n||0}));
  items.sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label));
  return `<option value="">${esc(emptyLabel)}</option>`+items.map(o=>
    `<option value="${esc(o.k)}"${o.n?'':' class="empty"'}>${esc(o.label)} (${o.n?num(o.n):'no reports'})</option>`).join('');}
function buildPickers(){
  el('operator').innerHTML=opts('operator',[],'Any operator');
  el('nature').innerHTML=opts('nature',['0'],'Anything found');
  el('crew').innerHTML=opts('crew',['0','K'],'Anything the crew did');
  el('condition').innerHTML=opts('condition',[],'Any part condition');
  el('discovered').innerHTML=opts('discovered',['0'],'Found by any method');
  el('stage').innerHTML=opts('stage',['00'],'Any stage of flight');
  el('zone').innerHTML=opts('part_location',['ZONE 000'],'Anywhere on the aircraft');
  el('corrosion').innerHTML=opts('corrosion',['1'],'Any corrosion level');}
function buildStarters(){el('starters').innerHTML=STARTERS.map((s,i)=>
  `<button class="starter${i>=6?' extra':''}" data-act="starter" data-i="${i}">${esc(s[0])}</button>`).join('');
  syncStarterToggle();}
function syncStarterToggle(){el('starterToggle').textContent=
  el('starters').classList.contains('all')?'fewer':`${STARTERS.length-6} more questions`;}
function starter(i){FIELDS.forEach(k=>{const e=el(k);if(e)e.value='';});UNRESOLVED={};
  Object.entries(STARTERS[i][1]).forEach(([k,v])=>{const e=el(k);if(e)e.value=v;});commit();}
function bindControls(){FIELDS.forEach(k=>{const e=el(k);if(!e)return;
  if(e.tagName==='SELECT'||e.type==='date'){e.addEventListener('change',()=>commit());}
  else if(e.type!=='hidden'){e.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();commit();}});}});
  el('q').addEventListener('input',deb(async()=>{const v=el('q').value.trim();const dl=el('qlist');
    if(v.length<3){dl.innerHTML='';return;}
    const s=++qSugSeq;
    try{const r=await api('api/vocab',new URLSearchParams({q:v,limit:'10'}).toString());
      if(s!==qSugSeq)return;
      dl.innerHTML=(r.readings||[]).map(x=>`<option value="${esc(x.w)}" label="${num(x.n)} reports">${num(x.n)} reports</option>`).join('');}
    catch(e){}},180));}

/* ================= fail-closed link handling ================= */
function strayParams(){const out=[];new URLSearchParams(location.search).forEach((v,k)=>{if(!URL_KNOWN.includes(k))out.push(k);});return out;}
function clientRefusals(p){const rejected=[],unknown=strayParams();
  FIELDS.forEach(k=>{const v=p.get(k);if(!v)return;let ok=true;
    if(k==='zone')ok=/^ZONE \d00$/.test(v);
    else if(k==='jasc')ok=/^\d{4}$/.test(v);
    else if(k==='corrosion')ok=['1','2','3'].includes(v);
    else if(k==='cracked')ok=v==='1';
    else if(k==='minhours')ok=/^\d+$/.test(v);
    else if(k==='from'||k==='to')ok=isCalDate(v);
    else if(k==='nature')ok=!!(CODES.nature&&CODES.nature[v]);
    else if(k==='crew')ok=!!(CODES.precaution&&CODES.precaution[v]);
    else if(k==='condition')ok=!!(CODES.condition&&CODES.condition[v]);
    else if(k==='discovered')ok=!!(CODES.discovered&&CODES.discovered[v]);
    else if(k==='stage')ok=!!(CODES.stage&&CODES.stage[v]);
    else if(k==='operator')ok=!!(CODES.operator&&CODES.operator[v]);
    /* ata: NOT validated, the one loose end; q/make/model/part/tail are free text */
    if(!ok)rejected.push({k,v});});
  return{rejected,unknown};}
function noSearchMessage(rejected,unknown){const parts=[];
  if(unknown&&unknown.length)parts.push(`This link uses a ${unknown.length===1?'name':'names'} this tool has no filter for: ${unknown.map(esc).join(', ')}`);
  (rejected||[]).forEach(r=>parts.push(`This link asks for ${esc(LABELS[r.k]||r.k)} value, which is not a value this data holds`));
  return parts.join('. ')+`, so no query was run rather than answering with all ${num(TOTAL)} reports.`;}
function dropStray(k){const u=new URLSearchParams(location.search);u.delete(k);
  setQS(u.toString()?'?'+u.toString():location.pathname,'replaceState');route(true);}
function renderNoSearch(rejected,unknown,unresKeys,serverMsg){
  rejected=(rejected||[]).slice();unknown=unknown||[];
  (unresKeys||[]).forEach(k=>{if(!rejected.some(r=>r.k===k))rejected.push({k,v:UNRESOLVED[k]});});
  heroData=null;HERO_FOR=null;LOADED=[];CASE_ORDER=[];LASTLOADED=0;
  setSectionState('nosearch');
  el('count').innerHTML='<strong>No search was run.</strong>';
  el('sentence').innerHTML='';
  el('nosearch').innerHTML=`<p>${esc(serverMsg||noSearchMessage(rejected,unknown))}</p>`+
    (unknown.length?`<p class="mut">Drop the stray ${unknown.length===1?'name':'names'}: `+
      unknown.map(n=>`<button class="ghost" data-act="clearstray" data-k="${esc(n)}">${esc(n)} x</button>`).join(' ')+'</p>':'');
  renderChips();setTools(false);updateExport(null);}

/* ================= the one search ================= */
function setQS(qs,mode){history[mode](null,'',qs||location.pathname);lastQS=qs||location.pathname;}
async function search(off,opts={}){
  const popping=off>0||!!opts.popping;
  const p=params();
  const ref=clientRefusals(p),uk=Object.keys(UNRESOLVED);
  if(ref.rejected.length||ref.unknown.length||uk.length){renderNoSearch(ref.rejected,ref.unknown,uk,null);return;}
  const u=new URLSearchParams(location.search);
  FIELDS.forEach(k=>u.delete(k));
  p.forEach((v,k)=>u.set(k,v));
  u.set('hero',heroKind());
  const qsStr=u.toString()?'?'+u.toString():location.pathname;
  setQS(qsStr,(popping||!booted||lastQS===qsStr)?'replaceState':'pushState');
  const q=new URLSearchParams(p);q.set('limit','100');q.set('offset',String(off||0));q.set('hero',heroKind());
  renderChips();
  el('sentence').innerHTML=sentenceHTML(null);   /* numbers withheld until they are this selection's */
  try{
    const d=await api('api/search',q.toString());
    if(d&&d.error==='BadFilter'){renderNoSearch(d.rejected||[],d.unknown||[],[],d.message);return;}
    heroData=d;HERO_FOR=p.toString();
    const drift=off>0&&LAST_TOTAL_CUR!=null&&d.total!==LAST_TOTAL_CUR;
    LAST_TOTAL_CUR=d.total;
    LOADED=(off>0)?LOADED.concat(d.rows||[]):(d.rows||[]).slice();
    CASE_ORDER=(off>0)?CASE_ORDER.concat((d.rows||[]).map(r=>String(r.OperatorControlNumber)))
                      :(d.rows||[]).map(r=>String(r.OperatorControlNumber));
    LASTLOADED=LOADED.length;
    if(off>0){renderTable(d,true);}
    else if(d.total===0){setSectionState('zero');renderZero();renderCount(d);renderSentence(d,false);setTools(true);updateExport(d);renderChips();}
    else{setSectionState('rows');renderCount(d);renderSentence(d,drift);renderChips();renderTable(d,false);renderCaption(d);renderRuns(LOADED);setTools(true);updateExport(d);}
    el('moreBtn').hidden=!(LASTLOADED<LAST_TOTAL_CUR);
    updateSeam();paintHeld();
  }catch(err){
    if(err&&(err.status===400||err.error==='BadFilter'))renderNoSearch(err.rejected||[],err.unknown||[],[],err.message);
    else{el('count').innerHTML='<strong>Nothing was counted.</strong> The file could not be reached, so no query was run.';}}
}
function more(){if(!LOADED.length||LASTLOADED>=LAST_TOTAL_CUR)return;search(LOADED.length,{popping:true});}
function route(popping){const p=params();const ref=clientRefusals(p);const uk=Object.keys(UNRESOLVED);
  if(ref.rejected.length||ref.unknown.length||uk.length){renderNoSearch(ref.rejected,ref.unknown,uk,null);return;}
  if(!anyFilter()&&!REVEALED){renderEmpty();return;}
  search(0,{popping:!!popping});}

/* ================= count line, standing sentence, chips ================= */
function renderCount(d){const c=el('count');
  if(anyFilter())c.innerHTML