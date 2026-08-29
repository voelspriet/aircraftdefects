
(function(){
"use strict";

/* ---- the CSS, injected once -------------------------------- */
const CSS=`
.zinstrument{margin:0}
.zipad{background:var(--paper,#faf8f3);border:1px solid #e2dbcc;border-radius:10px;
  padding:16px 18px 14px;color:var(--ink,#1f1c18);
  font:14px/1.45 Archivo,system-ui,sans-serif}
.zihead{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.zstamp{font:600 10px/1.4 Archivo,system-ui,sans-serif;letter-spacing:.1em;
  color:var(--ash,#8a8377)}
.zsentence{font-size:16px;line-height:1.4;margin:2px 0 2px}
.zaim{min-height:18px;font:11.5px/1.5 'IBM Plex Mono',ui-monospace,monospace;
  color:var(--rust-text,#b4552d);margin:2px 0 10px}
.zrail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;
  border-top:1px solid #e4ddcf;padding-top:9px}
.zgut .q{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;
  color:var(--ink,#1f1c18)}
.zgut .pn{font-size:9.5px;color:var(--ash,#8a8377);margin-top:1px}
.ztrack{min-width:0}
.ztrack.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.znote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;
  padding-top:6px;border-top:1px dashed #e0d8c9}
.zempty{font-size:12px;color:var(--ash,#8a8377);padding:4px 0}
/* the when strip: the parent's month rail, at rest */
.zstrip{display:flex;align-items:flex-end;gap:2px;overflow-x:auto;
  overscroll-behavior-x:contain;min-height:66px;padding-bottom:2px}
.zmo{flex:1 0 auto;min-width:5px;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;gap:3px;cursor:default}
.zmo i{display:block;width:100%;min-height:1px;background:var(--rust,#b4552d)}
.zmo span{font:8.5px/1 'IBM Plex Mono',ui-monospace,monospace;
  color:var(--ash,#8a8377);white-space:nowrap}
.zmo span.tick{width:4px;height:1px;background:#cfc7b7}
/* the where map: the parent's 3x3 zone grid, its pads underneath */
.zmap{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:340px}
.zcell{display:flex;flex-direction:column;justify-content:space-between;gap:6px;
  min-height:64px;padding:8px;border-radius:4px;cursor:default;
  border:1px solid rgba(180,85,45,.35);
  background:rgba(180,85,45,var(--f,.08))}
.zcell span{font:600 9.5px/1.25 Archivo,system-ui,sans-serif;letter-spacing:.05em}
.zcell b{font:11px/1 'IBM Plex Mono',ui-monospace,monospace;font-weight:400;
  text-align:right}
.zcell:hover,.zcell:focus-visible{border-color:var(--rust,#b4552d);
  box-shadow:inset 0 0 0 1px var(--rust,#b4552d)}
.zmap.pads{margin-top:6px;max-width:340px}
.zcell.pad{min-height:42px;background:none;border-style:dashed;
  border-color:#d4ccbc}
.zcell.pad:hover,.zcell.pad:focus-visible{border-color:var(--ink,#1f1c18);
  box-shadow:none}
/* the who and what ladders: the parent's row / bar / count shape */
.zladder{display:flex;flex-direction:column;gap:3px}
.zrow{display:grid;grid-template-columns:minmax(60px,190px) 1fr 64px;gap:10px;
  align-items:center;padding:2px 0;cursor:default}
.zrow .zl{font-size:11.5px;color:var(--ink,#1f1c18);min-width:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zrow .zb{display:block;height:8px;background:#eae4d6;border-radius:2px;
  overflow:hidden}
.zrow .zb i{display:block;height:100%;background:var(--rust,#b4552d)}
.zrow b{font:11px/1 'IBM Plex Mono',ui-monospace,monospace;font-weight:400;
  text-align:right;color:var(--ink,#1f1c18)}
.zrow:hover .zl,.zrow:focus-visible .zl{color:var(--rust-text,#b4552d)}
.zsub{font:600 10px/1 Archivo,system-ui,sans-serif;letter-spacing:.08em;
  color:var(--ash,#8a8377);margin:12px 0 6px}
.zsub:first-child{margin-top:0}
/* the forced block: the parent's fblock bar */
.zfblock{position:relative;display:block;height:22px;background:#eae4d6;
  border-radius:3px;overflow:hidden;margin-bottom:9px}
.zfblock i{position:absolute;top:0;bottom:0;left:0;background:var(--rust,#b4552d)}
.zfblock span{position:absolute;inset:0;display:flex;align-items:center;
  padding:0 8px;font:11px/1 'IBM Plex Mono',ui-monospace,monospace;
  color:var(--ink,#1f1c18)}
.zcell:focus-visible,.zrow:focus-visible{outline:2px solid var(--ink,#1f1c18);
  outline-offset:1px}
@media(max-width:760px){
  .zrail{grid-template-columns:1fr;gap:6px}
  .ztrack.two{grid-template-columns:1fr}
}`;
let _css=false;
function ensureCSS(){
  if(_css)return; _css=true;
  const s=document.createElement("style");
  s.setAttribute("data-zhero","");
  s.textContent=CSS;
  document.head.appendChild(s);
}

/* ---- small helpers, kept local so nothing here clobbers the parent's globals */
const MONTHS=["","January","February","March","April","May","June","July",
  "August","September","October","November","December"];
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>Number(n||0).toLocaleString("en");
function monthLabel(m){const p=String(m).split("-");
  return (MONTHS[+p[1]]||m)+" "+p[0];}
function rowsOf(b){return (b&&b.rows)||[];}
function sumRows(b){return rowsOf(b).reduce((s,r)=>s+(+r.n||0),0);}
function totalOf(d){return +((d.framing&&d.framing.total)||0)||0;}
function mxOf(list){return Math.max(1,...list.map(r=>+r.n||0));}

/* the parent's zone grid order, reused verbatim */
const GRID=[["ZONE 800","ZONE 200","ZONE 100"],
            ["ZONE 500","ZONE 400","ZONE 600"],
            ["ZONE 300","ZONE 700","ZONE 900"]];

/* ---- the caveat, written underneath, in the parent's own note type -------- */
function coverage(b,what,totalFor){
  const notes=[];
  if(b&&b.complete===false)
    notes.push(`the ${esc(what)} count is from the sample read, not the whole file`);
  const c=+((b&&b.counted)||0), s=sumRows(b);
  if(c>s)notes.push(`the list shows the ${num(s)} most-reported of ${num(c)}`);
  if(totalFor&&c<totalFor)
    notes.push(`${num(c)} of ${num(totalFor)} reports are counted here`);
  return notes.length?`<div class="znote">${notes.join("; ")}.</div>`:"";
}

/* ---- shared shapes --------------------------------------------------------- */
function gutter(q,pn){
  return `<div class="zgut"><div class="q">${esc(q)}</div>`+
    (pn?`<div class="pn">${esc(pn)}</div>`:"")+`</div>`;
}
function ladder(list){
  const mx=mxOf(list);
  return `<div class="zladder">${list.map(r=>
    `<div class="zrow" tabindex="0"
      data-zaim="${esc(r.label)} &middot; ${num(r.n)} reports">
      <span class="zl">${esc(r.label)}</span>
      <span class="zb"><i style="width:${(mx?+r.n/mx*100:0).toFixed(1)}%"></i></span>
      <b>${num(r.n)}</b></div>`).join("")}</div>`;
}

/* ---- horizon: the months rail ---------------------------------------------- */
function railHorizon(d){
  const ms=((d.when&&d.when.months)||[]).map(m=>({month:m.month,n:+m.n||0}));
  if(!ms.length)return `<div class="zempty">no month in this selection holds a report</div>`;
  const mx=mxOf(ms);
  return `<div class="zstrip" role="img"
    aria-label="Reports per month, ${esc(monthLabel(ms[0].month))} to ${esc(monthLabel(ms[ms.length-1].month))}">`+
    ms.map(m=>`<div class="zmo" tabindex="0"
        data-zaim="${esc(monthLabel(m.month))} &middot; ${num(m.n)} reports">
        <i style="height:${(m.n/mx*46).toFixed(1)}px"></i>${
        m.month.slice(5)==="01"
          ?`<span>${esc("'"+m.month.slice(2,4))}</span>`
          :`<span class="tick"></span>`}</div>`).join("")+
    `</div>`;
}

/* ---- anatomy: the zone grid, with its unplaced pad and the systems column -- */
function railAnatomy(d){
  const w=d.where||{};
  const z=w.zones||{rows:[]}, sy=w.systems||{rows:[]};
  const total=totalOf(d);
  const placed=+(z.counted||0)||sumRows(z);
  const by={}; rowsOf(z).forEach(r=>{by[r.code]=r;});
  const zmx=mxOf(rowsOf(z));
  const cells=GRID.flat().map(code=>{
    const r=by[code]||{code,label:code,n:0};
    return `<div class="zcell" tabindex="0" style="--f:${(0.10+0.80*(+r.n/zmx)).toFixed(3)}"
      data-zaim="${esc(r.label)} &middot; ${num(r.n)} of ${num(placed||sumRows(z))} placed findings">
      <span>${esc(r.label)}</span><b>${num(r.n)}</b></div>`;
  }).join("");
  const unplaced=total?Math.max(0,total-placed):0;
  const pads=`<div class="zmap pads">
    <div class="zcell pad" tabindex="0"
      data-zaim="${num(unplaced)} reports say where in words, or nothing, so no zone is drawn for them">
      <span>no zone drawn</span><b>${num(unplaced)}</b></div></div>`;
  const zoneCol=`<div class="zmap">${cells}</div>${pads}`+
    coverage(z,"zone",total)+
    (placed&&total&&placed<total
      ?`<div class="znote">${num(placed)} of ${num(total)} reports place a zone; the rest are not drawn here.</div>`:"");
  const sysCol=rowsOf(sy).length
    ?`<div class="zsub">ATA CHAPTER</div>`+ladder(rowsOf(sy))+coverage(sy,"system")
    :`<div class="zempty">no system chapter is drawn for this selection</div>`;
  return `<div class="ztrack two"><div>${zoneCol}</div><div>${sysCol}</div></div>`;
}

/* ---- swarm: airlines, airframes, types ------------------------------------- */
function railSwarm(d){
  const w=d.who||{};
  const parts=[];
  const sec=(b,title)=>{
    if(!rowsOf(b).length)return;
    parts.push(`<div class="zsub">${esc(title)}</div>`+ladder(rowsOf(b))+
      coverage(b,title.toLowerCase()));
  };
  sec(w.operators,"Airlines");
  sec(w.aircraft,"Airframes");
  sec(w.types,"Types");
  return parts.length?parts.join("")
    :`<div class="zempty">no airline, airframe or type is drawn for this selection</div>`;
}

/* ---- ledger: what the crew was forced to do -------------------------------- */
function railLedger(d){
  const f=d.forced||{}, fr=d.framing||{};
  const acts=(f.actions||[]).map(a=>({label:a.label,n:+a.n||0}));
  const none=+f.none||0;
  const forced=sumRows({rows:acts});
  const denom=forced+none;
  const totalKnown=+(fr.total)||0;
  const onGround=+(fr.on_ground)||0;
  const notes=[];
  if(f.complete===false)notes.push("the count is from the sample read, not the whole file");
  if(totalKnown&&onGround)
    notes.push(`${num(onGround)} of ${num(totalKnown)} were already on the ground when it happened`);
  if(!denom)return `<div class="zempty">no crew action is recorded for this selection</div>`+
    (notes.length?`<div class="znote">${notes.join("; ")}.</div>`:"");
  const rows=acts.concat(none?[{label:"no crew action recorded",n:none}]:[]);
  return `<div class="zfblock" tabindex="0"
      data-zaim="${num(forced)} of ${num(denom)} reports forced the crew to act">
      <i style="width:${(forced/denom*100).toFixed(1)}%"></i>
      <span>${num(forced)} of ${num(denom)} forced a crew action</span></div>`+
    ladder(rows)+
    (notes.length?`<div class="znote">${notes.join("; ")}.</div>`:"");
}

/* ---- the sentence and the caption's rest text ------------------------------- */
function sentence(kind,d){
  const total=totalOf(d);
  if(kind==="horizon"){
    const ms=(d.when&&d.when.months)||[];
    const n=ms.reduce((s,m)=>s+(+m.n||0),0);
    return ms.length
      ?`Reading ${num(n)} reports across ${num(ms.length)} months.`
      :`No month in this selection holds a report.`;
  }
  if(kind==="anatomy"){
    const z=(d.where&&d.where.zones)||{};
    const placed=+(z.counted||0)||sumRows(z);
    return total&&placed<total
      ?`${num(placed)} of ${num(total)} reports say where on the aircraft. This is where.`
      :`Where on the aircraft the ${num(placed)} findings sit.`;
  }
  if(kind==="swarm"){
    const w=d.who||{};
    const o=+(w.operators&&w.operators.counted)||sumRows(w.operators);
    const a=+(w.aircraft&&w.aircraft.counted)||sumRows(w.aircraft);
    return total
      ?`${num(total)} reports, filed by ${num(o)} airlines across ${num(a)} airframes.`
      :`${num(o)} airlines and ${num(a)} airframes in this selection.`;
  }
  /* ledger */
  const f=d.forced||{};
  const forced=sumRows({rows:f.actions||[]}), none=+f.none||0;
  return forced+none
    ?`${num(forced)} of ${num(forced+none)} reports forced the crew to act.`
    :`No crew action is recorded for this selection.`;
}
const HAND={
  horizon:"Point at a month to read its count. The strip runs oldest to newest.",
  anatomy:"Point at a zone to read what was found there.",
  swarm:"Point at an airline, an airframe or a type to read its count.",
  ledger:"Point at an action to read how often the crew had to take it."
};
const KIND={horizon:["WHEN","month by month",railHorizon],
            anatomy:["WHERE","on the aircraft",railAnatomy],
            swarm:["WHO","airline and airframe",railSwarm],
            ledger:["WHAT IT FORCED","what the crew did",railLedger]};

/* ---- the caption: point at a mark, the instrument says what it counts ------- */
function wireAim(box,def){
  const cap=box.querySelector(".zaim"); if(!cap)return;
  const show=t=>{cap.innerHTML=t;};
  box.addEventListener("mouseover",e=>{
    const t=e.target.closest&&e.target.closest("[data-zaim]");
    if(t)show(t.getAttribute("data-zaim"));
  });
  box.addEventListener("mouseout",e=>{
    if(e.target.closest&&e.target.closest("[data-zaim]"))show(def);
  });
  box.addEventListener("focusin",e=>{
    const t=e.target.closest&&e.target.closest("[data-zaim]");
    if(t)show(t.getAttribute("data-zaim"));
  });
  box.addEventListener("focusout",()=>show(def));
}

/* ---- the export -------------------------------------------------------------- */
function drawZHero(box,kind,data){
  ensureCSS();
  if(!box)return;
  const d=data||{};
  const r=KIND[kind];
  if(!r){box.innerHTML="";return;}
  const [q,pn,fn]=r;
  const def=HAND[kind]||"";
  /* the stamp, dated from the months when the data carries them */
  const ms=(d.when&&d.when.months)||[];
  const stamp=ms.length
    ?` &middot; ${esc(monthLabel(ms[0].month).toUpperCase())} TO ${esc(monthLabel(ms[ms.length-1].month).toUpperCase())}`
    :"";
  box.className="zinstrument";
  box.innerHTML=`<div class="zipad">
    <div class="zihead"><div class="zstamp">FAA SERVICE DIFFICULTY REPORTS${stamp}</div></div>
    <div class="zsentence">${sentence(kind,d)}</div>
    <div class="zaim">${def}</div>
    <div class="zrail">${gutter(q,pn)}<div class="ztrack">${fn(d)}</div></div>
  </div>`;
  /* the newest months sit at the right end; start there, as the parent's rail does */
  const strip=box.querySelector(".zstrip");
  if(strip&&strip.scrollWidth>strip.clientWidth)strip.scrollLeft=strip.scrollWidth;
  wireAim(box,def);
}

window.drawZHero=drawZHero;
})();
