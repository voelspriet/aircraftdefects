```js
/* ================================================================
   HERO — pass 2. Drops inside the existing IIFE. Every name below
   is a function declaration or a var, so it overrides pass 1 by
   redeclaration. (If pass 1 declared any of these names with
   let/const, delete the pass-1 line — var/function cannot
   re-declare against a lexical binding.)
   ================================================================ */

/* ---------------- CSS, injected once ---------------- */
if(!document.getElementById("hero-css2")){
  var heroCss2=document.createElement("style");
  heroCss2.id="hero-css2";
  heroCss2.textContent=`
:root{--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--rust:#c44b28;--line:#e2ded5;--rust-text:#b8431f;--smoke:#6b6560;--card:#fff}
.stamp{font:600 11px/1.3 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--ash)}
.stand{margin:6px 0 2px;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.aim{min-height:20px;margin-top:2px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rust-text)}
.aim .undoit{font:inherit;background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer}
.rails{margin-top:8px;border-top:1px solid var(--line)}
.rail{position:relative;display:grid;grid-template-columns:184px minmax(0,1fr);gap:4px 16px;padding:10px 0;border-bottom:1px solid var(--line)}
.rail:not(.open){cursor:pointer}
.rail>.track,.rail>.hint,.rail>.reading,.rail>.margin{grid-column:2}
.rail .track{position:relative;min-width:0;min-height:14px}
.rail:not(.open) .track{overflow:hidden;align-self:center}
.gut b{display:block;font:600 12px/1.35 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.08em;color:var(--ink)}
.gut .gs{display:block;font:11px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--ash)}
.gut .gv{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);white-space:nowrap}
.gut.rest{display:flex;align-items:baseline;gap:8px}
.gut.rest .gv{display:inline}

.months{position:relative;display:flex;gap:2px;align-items:flex-end}
.months .mo{height:84px}
.rail:not(.open) .months .mo{height:14px}
.mo{position:relative;flex:1;min-width:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit,.mo:focus-visible{outline:1.5px solid var(--ink);outline-offset:1px}
.mo.inband .ghostb{background:#b9ae99}
.mo.inband::after{content:"";position:absolute;left:0;right:0;top:-3px;height:2px;background:var(--rust)}
/* shut strip: the distribution stays legible — bars shade by count, busiest full-strength */
.rail:not(.open) .mo .ghostb{background:rgba(117,111,105,var(--sa,1))}
.rail:not(.open) .mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.mag{position:absolute;left:0;right:0;bottom:0;height:84px;pointer-events:none;min-width:var(--mw,100%)}
.mag svg{display:block;width:100%;height:100%;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);background:var(--paper);padding:0 4px}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain}
.rail.open[data-rail=when] .months,.rail.open[data-rail=when] .axis{min-width:var(--mw,100%)}
.rail.open[data-rail=when] .mo{min-width:5px}
.rail.open[data-rail=when] .months{touch-action:none;user-select:none}

.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.strip span:hover{background:#c3bbac}
.rail .track.two{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}
.col{display:flex;flex-direction:column;gap:3px;min-width:0}
.col .ch{font:600 10.5px/1.2 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.orow{display:grid;grid-template-columns:120px minmax(0,1fr) 52px;gap:8px;align-items:center;font-size:11.5px;cursor:pointer;padding:0 3px;border-radius:3px;height:14px}
.orow:hover,.orow:focus-visible{background:rgba(196,75,40,.08)}
.orow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orow .on.mono{font-family:'IBM Plex Mono',monospace}
.orow .on.ash{color:var(--ash)}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
.orow.taken{background:rgba(196,75,40,.12);outline:0;box-shadow:inset 2px 0 0 var(--rust)}
.orow.wide{grid-template-columns:190px minmax(0,1fr) 56px;height:17px}
.orow.wide .on{font-size:12px}

.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;display:flex;align-items:center;margin-bottom:6px}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)}
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
.fnote{font-size:11px;color:var(--ash);margin-top:4px}

.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.margin{margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);line-height:1.5}
.margin .mr{color:var(--rust-text)}
.hint{margin-top:4px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ash)}

.specimen{margin-top:14px;padding:6px 0}
.specimen .sh{font:12px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--smoke)}
.specimen .opencue{color:var(--rust-text);white-space:nowrap}
.spec-decoded{font:600 12.5px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--rust-text,#a3421f);margin:2px 0 3px;letter-spacing:.01em}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;color:#403b35;margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
.specimen.opens:hover,.specimen.opens:focus-visible{background:#f3efe8}
.specimen.opens:focus-visible{outline:2px solid var(--rust)}
.zero{border:1px solid var(--line);background:var(--card);border-radius:6px;padding:10px 14px;margin:0 0 10px}
.zero .zghost{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);margin-top:4px}
tr.spine.lit td,tr[data-month].lit td{background:#fbe6dc}

@media(max-width:760px){
  .rail{grid-template-columns:minmax(0,1fr)}
  .rail>.track,.rail>.hint,.rail>.reading,.rail>.margin{grid-column:1}
  .rail .track.two{grid-template-columns:minmax(0,1fr)}
  .orow,.orow.wide{grid-template-columns:100px minmax(0,1fr) 46px}
}
@media(max-width:479px){.specimen{display:none}}
`;
  document.head.appendChild(heroCss2);
}

/* ---------------- state ---------------- */
var heroData=null, heroSeq=0, HERO_FOR="", heroRange={from:null,to:null};
var kbAnchor=null, holdUntil=0, dragFrom=null, lastFilterQS=null, heroBooted=false;
var HERO_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var HERO_MONTHS_S=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------------- micro helpers ---------------- */
function heroEl(){ return document.getElementById("hero")||document.getElementById("heroPanel")||document.getElementById("hero-panel")||document.querySelector("[data-hero]")||document.querySelector(".hero"); }
function params(){ return new URLSearchParams(location.search); }
function filterQS(){ var p=params(); p.delete("hero"); return p.toString(); }
function narrowed(){ var ks=Array.from(params().keys()); return ks.some(function(k){return k!=="hero";}); }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function num(n){ return (+n||0).toLocaleString("en-US"); }
function pct(a,b){ if(!b) return "0.0"; return (Math.round(a/b*1000)/10).toFixed(1); }
function spell(n){ var W=["","one","two","three","four","five","six","seven","eight","nine","ten"]; return W[n]||num(n); }
function lastDay(ym){ return new Date(+ym.slice(0,4), +ym.slice(5,7), 0).getDate(); }
function monthName(ym){ if(!ym||ym.length<7) return ""; return HERO_MONTHS[+ym.slice(5,7)-1]+" "+ym.slice(0,4); }
function prettyDate(iso){ if(!iso) return ""; var p=String(iso).split("-"); if(p.length<3) return String(iso); return (+p[2])+" "+(HERO_MONTHS[+p[1]-1]||p[1])+" "+p[0]; }
function opName(o){ try{ if(typeof CODES!=="undefined"&&CODES&&CODES.operator&&CODES.operator[o]) return CODES.operator[o].label||o; }catch(_){} return o; }
function sj(x){ try{ if(typeof jargon==="function") return jargon(x); }catch(_){} return esc(x); }

/* ---------------- aim line ---------------- */
function aim(html){ if(Date.now()<holdUntil) return; var el=document.getElementById("iAim"); if(el) el.innerHTML=html; }
function aimHold(html){ holdUntil=Date.now()+6000; var el=document.getElementById("iAim"); if(el) el.innerHTML=html; }
function unaim(){ holdUntil=0; var el=document.getElementById("iAim"); if(el) el.innerHTML=""; }

/* ---------------- routing: both spellings accepted ---------------- */
function heroKey(){
  var AL={when:"when",horizon:"when",where:"where",anatomy:"where",whose:"whose",who:"whose",swarm:"whose",forced:"forced",ledger:"forced"};
  return AL[params().get("hero")]||"where";
}
function setHero(key){
  var AL={when:"when",horizon:"when",where:"where",anatomy:"where",whose:"whose",who:"whose",swarm:"whose",forced:"forced",ledger:"forced"};
  var p=params(); p.set("hero",AL[key]||"where");
  history.pushState(null,"",location.pathname+"?"+p.toString());
  if(heroData) drawHero(heroData); else loadHero();
}

/* ---------------- load ---------------- */
function loadHero(){
  var seq=++heroSeq;
  HERO_FOR=filterQS();
  var q=filterQS();
  fetch("api/hero"+(q?"?"+q:""),{headers:{accept:"application/json"}})
    .then(function(r){ return r.ok?r.json():null; })
    .then(function(d){ if(seq===heroSeq) drawHero(d||null); })
    .catch(function(){ if(seq===heroSeq) drawHero(null); });
}
function runSearch(pg){ if(typeof search==="function") search(pg); else loadHero(); }

/* ---------------- render ---------------- */
function drawHero(d, phone){
  var host=heroEl(); if(!host) return;
  if(!d){ host.innerHTML=skeletonHTML(); return; }
  heroData=d;
  heroRange=d.range||{
    from:(d.months&&d.months.length)?d.months[0].m+"-01":null,
    to:d.published||((d.months&&d.months.length)?d.months[d.months.length-1].m+"-"+String(lastDay(d.months[d.months.length-1].m)).padStart(2,"0"):null)
  };
  var openKey=heroKey(), nar=narrowed(), h="";
  if((d.total||0)===0) h+=zeroHTML(d);
  h+='<div class="stamp">'+esc(d.stamp||"FAA Service Difficulty Reports")+'</div>';
  h+='<p class="stand">'+standingSentence(d)+'</p>';
  h+='<div class="aim" id="iAim" aria-live="polite"></div>';
  h+='<div class="rails">';
  h+=railWhen(d,  openKey==="when",  nar);
  h+=railWhere(d, openKey==="where", nar);
  h+=railWho(d,   openKey==="whose", nar);
  h+=railForced(d,openKey==="forced",nar);
  h+='</div>'+specimenHTML(d,phone);
  host.innerHTML=h;
  heroAfter();
}
function drawPhone(d){ drawHero(d,true); }
function heroAfter(){
  syncControls(); paintSpines();
  var wtr=document.querySelector('.rail.open[data-rail=when] .track');
  if(wtr) wtr.scrollLeft=wtr.scrollWidth;   // over-set, browser clamps hard right: opens at the most recent
}
function skeletonHTML(){
  var G=[["when","WHEN"],["where","WHERE"],["whose","WHO"],["forced","FORCED"]];
  return '<div class="stamp">FAA Service Difficulty Reports</div><p class="stand">&nbsp;</p><div class="aim" id="iAim"></div>'
    +'<div class="rails">'+G.map(function(g){return '<div class="rail" data-rail="'+g[0]+'"><div class="gut rest"><b>'+g[1]+'</b></div></div>';}).join("")+'</div>';
}
function zeroHTML(d){
  var seam=document.getElementById("seambtn")||document.querySelector("[data-seam]")||document.querySelector(".seam");
  if(seam) seam.textContent="Nothing to read yet";
  return '<div class="zero"><b>Nothing matches all of these at once.</b>'
    +((d.leave_one_out||[]).slice(0,3).map(function(x){return '<div class="zghost">Drop '+esc(x.label)+' &rarr; '+num(x.n)+' reports</div>';}).join(""))
    +'</div>';
}
function gutter(head,sub,val,open){
  return open
    ? '<div class="gut"><b>'+head+'</b><span class="gs">'+esc(sub)+'</span><span class="gv">'+val+'</span></div>'
    : '<div class="gut rest"><b>'+head+'</b><span class="gv">'+val+'</span></div>';
}

/* ---------------- WHEN ---------------- */
function partialMonth(m,d){
  var ms=(d&&d.months)||[]; if(!ms.length) return false;
  var p=params(), f=p.get("from"), t=p.get("to"), R=heroRange||{};
  if(m===ms[0].m && R.from && R.from.slice(8,10)!=="01") return true;
  if(m===ms[ms.length-1].m && R.to && +R.to.slice(8,10)!==lastDay(m)) return true;
  if(f && f.slice(0,7)===m && f.slice(8,10)!=="01") return true;
  if(t && t.slice(0,7)===m && +t.slice(8,10)!==lastDay(m)) return true;
  return false;
}
function settled(m,d){
  var cut=d&&d.lag&&d.lag.settled_before; if(!cut) return true;
  return (m+"-"+String(lastDay(m)).padStart(2,"0"))<=cut;
}
function coveredDays(m){
  var lo=heroRange.from, hi=heroRange.to, p=params();
  if(p.get("from")&&(!lo||p.get("from")>lo)) lo=p.get("from");
  if(p.get("to")&&(!hi||p.get("to")<hi)) hi=p.get("to");
  var s=1, e=lastDay(m);
  if(lo&&lo.slice(0,7)===m) s=+lo.slice(8,10);
  if(hi&&hi.slice(0,7)===m) e=+hi.slice(8,10);
  return {s:s,e:e,days:Math.max(0,e-s+1),inMonth:lastDay(m)};
}
function railWhen(d,open,nar){
  var ms=d.months||[]; if(!ms.length) return "";
  var H=open?84:14, cmax=1, smax=0, i, m;
  for(i=0;i<ms.length;i++){ if((ms[i].all||0)>cmax)cmax=ms[i].all; if((ms[i].n||0)>smax)smax=ms[i].n; }
  var wide=open&&ms.length>72;
  var s="";
  for(i=0;i<ms.length;i++){
    m=ms[i];
    var pm=partialMonth(m.m,d), un=!settled(m.m,d), part=pm||un;
    var ch=(m.all||0)/cmax*H, sh=nar?(m.n||0)/cmax*H:0;
    var suff=pm?", a part month":(un?", still filling up":"");
    s+='<span class="mo'+(part?" part":"")+'" data-aim="month|'+m.m+'" '
      +(open?'tabindex="0" role="button"':'tabindex="-1" role="presentation"')
      +' aria-label="'+esc(monthName(m.m))+', '+num(m.n)+' reports'+suff+'">'
      +'<i class="ghostb" style="height:'+ch.toFixed(1)+'px'
      +((!open&&!part)?';--sa:'+(0.3+0.7*((m.all||0)/cmax)).toFixed(3):"")+'"></i>'
      +(sh>0?'<i class="selb" style="height:'+sh.toFixed(1)+'px"></i>':"")
      +'</span>';
  }
  var body='<div class="track"'+(wide?' style="--mw:'+(ms.length*9)+'px"':"")+'><div class="months">'+mag(d,open,ms,cmax,smax)+s+'</div>'+axis(open,ms)+'</div>';
  if(open){
    body+='<div class="hint">'+(wide
      ? num(ms.length)+' months, so the strip scrolls sideways. It opens at the most recent.'
      : 'Drag across the months to take a period.')+'</div>'
      +'<div class="reading">'+whenReading(d)+'</div>'+whenMargin(d);
  }
  // WHEN never passes `open` to gutter(): the compact form always, "month by month" never in the gutter. Kept.
  return '<div class="rail'+(open?" open":"")+'" data-rail="when">'
    +gutter("WHEN","month by month",esc(periodClause()||(num(ms.length)+" month"+(ms.length===1?"":"s"))))
    +body+'</div>';
}
function axis(open,ms){
  if(!open) return "";
  return '<div class="axis">'+ms.map(function(x){return '<span>'+(x.m.slice(5)==="01"?x.m.slice(0,4):"")+'</span>';}).join("")+'</div>';
}
function mag(d,open,ms,cmax,smax){
  if(!(open&&smax>0&&smax<cmax*0.25)) return "";
  var f=(cmax*0.62)/smax;
  var pts=ms.map(function(x,ix){
    return (((ix+0.5)/ms.length)*1000).toFixed(1)+","+(1000-(x.n/smax)*620).toFixed(1);
  }).join(" ");
  return '<div class="mag"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    +'<polyline points="'+pts+'" fill="none" stroke="#c44b28" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>'
    +'<span class="magnote">selection &times;'+f.toFixed(1)+' to be visible</span></div>';
}
function periodClause(){
  var fEl=document.getElementById("from"), tEl=document.getElementById("to");
  var fv=(fEl&&fEl.value)||params().get("from")||"";
  var tv=(tEl&&tEl.value)||params().get("to")||"";
  if(!fv&&!tv) return "";
  var fd=fv.slice(8,10), fm=+fv.slice(5,7), fy=fv.slice(0,4);
  var td=tv.slice(8,10), tm=+tv.slice(5,7), ty=tv.slice(0,4);
  if(fv&&tv){
    if(fy===ty&&fm===tm){
      var ld=String(lastDay(fy+"-"+fv.slice(5,7))).padStart(2,"0");
      if(fd==="01"&&td===ld) return HERO_MONTHS[fm-1]+" "+fy;              // only a whole month may be called one
      if(fd==="01") return (+fd)+" to "+(+td)+" "+HERO_MONTHS[fm-1]+" "+fy;
    }
    return (+fd)+" "+HERO_MONTHS_S[fm-1]+" "+fy+" to "+(+td)+" "+HERO_MONTHS_S[tm-1]+" "+ty;
  }
  if(fv) return "from "+(+fd)+" "+HERO_MONTHS_S[fm-1]+" "+fy;
  return "up to "+(+td)+" "+HERO_MONTHS_S[tm-1]+" "+ty;
}
function whenReading(d){
  var ms=d.months||[]; if(ms.length<2) return "";
  var allm=ms.filter(function(m){return !partialMonth(m.m,d);});
  var full=allm.filter(function(m){return settled(m.m,d);});
  var young=allm.length-full.length;
  if(full.length<2) return "";
  var hi=full[0], lo=full[0];
  full.forEach(function(m){
    if(m.n>hi.n||(m.n===hi.n&&m.m<hi.m)) hi=m;
    if(m.n<lo.n||(m.n===lo.n&&m.m<lo.m)) lo=m;
  });
  var out='Between '+num(lo.n)+' and '+num(hi.n)+' reports in a settled month, busiest in '+monthName(hi.m)+', quietest in '+monthName(lo.m)+'.';
  if(full.length>=24){
    var last=full.slice(-12), prev=full.slice(-24,-12);
    var a=Math.round(last.reduce(function(s,m){return s+m.n;},0)/12);
    var bb=Math.round(prev.reduce(function(s,m){return s+m.n;},0)/12);
    if(bb>0){
      var diff=Math.round(Math.abs(a-bb)/bb*100);   // absolute; direction is never stated
      out+=' The last twelve settled months average '+num(a)+' a month against '+num(bb)+' for the twelve before, a difference of '+diff+'%.';
    }
  }
  if(young>0){
    var lag=(d.lag&&d.lag.p95_days)||0, one=young===1;
    out+=' The '+spell(young)+' most recent month'+(one?"":"s")+' '+(one?"is":"are")+' left out of those figures: reports still arrive up to '
        +num(lag)+' days after the event, so '+(one?"it holds":"they hold")+' only part of what '+(one?"it":"they")+' will hold. '
        +'The dip at the right of the chart is the post arriving late, not fewer faults.';
  }
  return out;
}
function whenMargin(d){
  var notes=[], ms=d.months||[];
  ms.forEach(function(m){
    if(!partialMonth(m.m,d)) return;
    var c=coveredDays(m.m), mm=+m.m.slice(5,7), yy=m.m.slice(0,4);
    notes.push('<span class="mr">'+HERO_MONTHS[mm-1]+' '+yy+' covers '+(c.s===1?"1":c.s)+' to '+c.e+' '+HERO_MONTHS[mm-1]
      +', so its bar counts '+num(c.days)+' days against '+num(c.inMonth)+' in a whole one</span>');
  });
  notes.push('<span>counts are of reports filed, not of flights</span>');
  return '<div class="margin">'+notes.join("<br>")+'</div>';
}

/* ---------------- WHERE (anatomy) ---------------- */
function zoneRows(d){
  var raw=(d&&(d.zones||d.anatomy||d.regions))||[];
  return raw.map(function(r){
    var id=r.z||r.zone||r.id||r.k||"";
    return {id:id,label:r.label||id||"?",n:r.n||0};
  }).filter(function(r){return r.id;}).sort(function(a,b){return b.n-a.n;});
}
function railWhere(d,open,nar){
  var rows=zoneRows(d), p=params(), tot=d.total||0;
  var sel=p.get("zone")||p.get("region")||"";
  var hit=rows.find(function(x){return x.id===sel;});
  var g=gutter("WHERE","on the aircraft", sel?esc((hit||{}).label||sel):"all zones", open);
  var body;
  if(open){
    var mx=1; rows.forEach(function(r){ if(r.n>mx)mx=r.n; });
    var list=rows.slice(0,12).map(function(r){
      return '<div class="orow" data-aim="zone|'+esc(r.id)+'" data-take="zone|'+esc(r.id)+'" tabindex="0" role="button">'
        +'<span class="on">'+esc(r.label)+'</span>'
        +'<span class="ob"><i style="width:'+(r.n/mx*100).toFixed(1)+'%"></i></span>'
        +'<b>'+num(r.n)+'</b></div>';
    }).join("");
    body='<div class="track"><div class="col"><div class="ch">Zones</div>'+list+'</div></div>'
      +'<div class="hint">Click a zone of the aircraft to narrow to it.</div>'
      +'<div class="reading">'+whereReading(d)+'</div>'
      +'<div class="margin"><span>counts are of reports filed, not of flights</span></div>';
  }else{
    body='<div class="track"><div class="strip">'+rows.slice(0,12).map(function(r){
      return '<span data-op="'+esc(r.id)+'" style="flex:'+Math.max(1,r.n)+'" title="'+esc(r.label)+': '+num(r.n)+'"'+(sel===r.id?' class="sel"':"")+'></span>';
    }).join("")+'</div></div>';
  }
  return '<div class="rail'+(open?" open":"")+'" data-rail="where">'+g+body+'</div>';
}
function whereReading(d){
  var tot=d.total||0; if(!tot) return "";
  var rows=zoneRows(d), p=params();
  var sel=p.get("zone")||p.get("region");
  if(sel){
    var r=rows.find(function(x){return x.id===sel;});
    if(r) return num(r.n)+' reports put the trouble in '+esc(r.label.toLowerCase())+'. The other '+num(tot-r.n)+' happened elsewhere on the airframe, or name no zone at all.';
  }
  if(!rows.length) return num(tot)+' reports stand open across every zone of the aircraft.';
  var top=rows[0], named=rows.reduce(function(s,r){return s+r.n;},0);
  var out=num(tot)+' reports are counted by zone of the aircraft. '+esc(top.label)+' leads with '+num(top.n)+', '+pct(top.n,tot)+'% of the selection';
  if(named<tot) out+='; '+num(tot-named)+' name no zone';
  return out+'.';
}

/* ---------------- WHO (swarm) ---------------- */
function railWho(d,open,nar){
  var ops=d.operator_rows||[], nOps=d.operators||0;
  var swarm=d.swarm||[], swT=d.swarm_total||0;
  var g=gutter("WHO","airline and tail", num(swT||d.aircraft||0)+" aircraft", open);
  var body;
  if(!open){
    var sel=params().get("operator")||"";
    body='<div class="track"><div class="strip">'+ops.slice(0,8).map(function(r){
      return '<span data-op="'+esc(r.o)+'" style="flex:'+Math.max(1,r.n)+'" title="'+esc(opName(r.o))+': '+num(r.n)+'"'+(sel===r.o?' class="sel"':"")+'></span>';
    }).join("")+'</div></div>';
  }else{
    var mxO=1; ops.forEach(function(r){ if(r.n>mxO)mxO=r.n; });
    var orows=ops.map(function(r){
      return '<div class="orow" data-aim="op|'+esc(r.o)+'" data-take="operator|'+esc(r.o)+'" tabindex="0" role="button">'
        +'<span class="on">'+esc(opName(r.o))+'</span>'
        +'<span class="ob"><i style="width:'+(r.n/mxO*100).toFixed(1)+'%"></i></span>'
        +'<b>'+num(r.n)+'</b></div>';
    }).join("");
    if(nOps-ops.length>0) orows+='<div class="orow more" data-aim="more-ops"><span class="on ash">'+num(nOps-ops.length)+' more operators</span></div>';
    var tails=swarm.slice(0,8), mxA=1;
    tails.forEach(function(r){ if(r.n>mxA)mxA=r.n; });
    var trows=tails.map(function(r){
      return '<div class="orow" data-aim="tail|'+esc(r.t)+'" data-take="tail|'+esc(r.t)+'" tabindex="0" role="button">'
        +'<span class="on mono">N'+esc(r.t)+'</span>'
        +'<span class="ob"><i style="width:'+(r.n/mxA*100).toFixed(1)+'%"></i></span>'
        +'<b>'+num(r.n)+'</b></div>';
    }).join("");
    if(swT>swarm.length) trows+='<div class="orow more" data-aim="more-tails"><span class="on ash">'+num(swT-swarm.length)+' more airframes, not ranked here</span></div>';
    body='<div class="track two">'
      +'<div class="col"><div class="ch">Operators</div>'+orows+'</div>'
      +'<div class="col"><div class="ch">Airframes</div>'+trows+'</div></div>'
      +'<div class="hint">Click an airline or an airframe to follow it.</div>'
      +'<div class="reading">'+whoReading(d)+'</div>'
      +'<div class="margin"><span class="mr">the tail list shows the '+num(swarm.length)+' most-reported aircraft out of '+num(swT)
      +'; the airline list counts every report</span><br><span>counts are of reports filed, not of flights</span></div>';
  }
  return '<div class="rail'+(open?" open":"")+'" data-rail="whose">'+g+body+'</div>';
}
function whoReading(d){
  var tot=d.total||0; if(!tot) return "";
  var ops=d.operator_rows||[], nOps=d.operators||0, out="";
  if(ops.length&&nOps>ops.length){
    var top=ops.reduce(function(s,r){return s+r.n;},0);
    out=spell(ops.length)+' operators file '+pct(top,tot)+'% of what is here; the other '+num(nOps-ops.length)+' share the rest.';
    out=out.charAt(0).toUpperCase()+out.slice(1);
  }else{
    out=num(nOps)+' '+(nOps===1?"operator files":"operators file")+' everything here.';
  }
  out+=' '+num(d.aircraft||0)+' aircraft appear in all.';
  var sw=(d.swarm||[])[0];
  if(sw&&sw.n>1) out+=' One of them, N'+esc(sw.t)+', is written up '+num(sw.n)+' times.';
  return out;
}

/* ---------------- FORCED (ledger) ---------------- */
function railForced(d,open,nar){
  var tot=d.total||0, cr=d.crew_reports||0;
  var sh=tot?(cr/tot*100):0;   // crew_reports, never the sum of the per-code counts
  var g=gutter("FORCED","what the crew did", num(cr)+" of "+num(tot), open);
  var body;
  if(!open){
    body='<div class="track"><div class="restbar"><i style="width:'+sh.toFixed(2)+'%"></i></div></div>';
  }else{
    var allc=(d.crew||[]).filter(function(x){return ["K","0","O"].indexOf(x.code)<0;});
    var rows=allc.slice(0,8), mx=1;   // cap is 8; up to two non-zero actions are silently omitted, no "more" affordance
    rows.forEach(function(r){ if(r.n>mx)mx=r.n; });
    body='<div class="track">'
      +'<div class="fblock" data-aim="crewall"><i style="width:'+sh.toFixed(2)+'%"></i>'
      +'<span class="flab">'+num(cr)+' of '+num(tot)+' forced a crew action</span></div>'
      +'<div class="flist">'+rows.map(function(r){
          return '<div class="orow wide" data-aim="crew|'+esc(r.code)+'" data-take="crew|'+esc(r.code)+'" tabindex="0" role="button">'
            +'<span class="on">'+esc(r.label)+'</span>'
            +'<span class="ob"><i style="width:'+(r.n/mx*100).toFixed(1)+'%"></i></span>'
            +'<b>'+num(r.n)+'</b></div>';
        }).join("")+'</div>'
      +'<div class="fnote">A report can carry four of these, so they add to more than '+num(cr)+'.</div>'
      +'</div>'
      +'<div class="hint">Click what the crew had to do.</div>'
      +'<div class="reading">'+forcedReading(d)+'</div>';
  }
  return '<div class="rail'+(open?" open":"")+'" data-rail="forced">'+g+body+'</div>';
}
function forcedReading(d){
  var tot=d.total||0; if(!tot) return "";
  var cr=d.crew_reports||0;
  if(!cr) return 'No report in this selection records an action the crew had to take. Everything here was found on the ground.';
  var allc=(d.crew||[]).filter(function(x){return ["K","0","O"].indexOf(x.code)<0;});
  var top=allc[0], r=top?rate(top.n,(d.span&&d.span.days)||0):"";
  var out=num(cr)+' reports, '+pct(cr,tot)+'% of this selection, record something the crew had to do rather than something found on the ground.';
  if(top) out+=' The commonest is '+esc(top.label.toLowerCase())+', '+num(top.n)+' times'+(r?", "+esc(r)+".":".");
  return out;
}
function rate(n,days){
  if(!n||!days||n<30||days<60) return "";
  var per=days/n;
  if(per>=1.5) return 'about one every '+Math.round(per)+' days';
  return 'about '+(n/days).toFixed(1)+' a day';
}

/* ---------------- specimen ---------------- */
function specLine(s){
  var dead=["","Other","Not reported","Unknown","None"];
  var ok=function(v){ return v&&!dead.includes(v); };
  var norm=function(x){ return String(x||"").toLowerCase().replace(/[^a-z]/g,""); };
  var parts=[];
  if(ok(s.aircraft)) parts.push(esc(s.aircraft));
  if(ok(s.system)) parts.push(esc(s.system));
  if(ok(s.part)){
    var a=norm(s.system), b=norm(s.part);
    if(!a||!b||(!a.includes(b)&&!b.includes(a))) parts.push(esc(s.part));   // dropped only when it repeats the system
  }
  if(ok(s.condition)) parts.push(esc(s.condition));
  if(ok(s.found)) parts.push(esc(s.found));
  if(ok(s.stage)) parts.push(esc(s.stage));
  if(s.date) parts.push(esc(prettyDate(s.date)));
  return parts.join(" &middot; ");
}
function specimenHTML(d,phone){
  var s=d.specimen; if(!s) return "";
  var line=(d.lines||[])[0]||"", ctrl=s.control||"", open=!!ctrl, dec=specLine(s);
  return '<div class="specimen'+(open?" opens":"")+'"'
    +(open?' role="button" tabindex="0" data-case="'+esc(ctrl)+'" aria-label="Open the full report '+esc(ctrl)+'"':"")+'>'
    +'<div class="sh">One report from this selection. First the FAA&rsquo;s own filing of it, then the mechanic&rsquo;s words as written.'
    +(open?' <span class="opencue">'+(phone?"Tap to open it &rarr;":"Click to open the full report &rarr;")+'</span>':"")+'</div>'
    +(dec?'<div class="spec-decoded">'+dec+'</div>':"")
    +(line?'<div class="sl">'+sj(line)+'</div>':"")
    +'</div>';
}

/* ---------------- standing sentence ---------------- */
function selectionDesc(d){
  var p=params(), out=[];
  var z=p.get("zone")||p.get("region");
  if(z){ var r=zoneRows(d).find(function(x){return x.id===z;}); out.push(r?r.label:z); }
  var op=p.get("operator"); if(op) out.push(opName(op));
  var tl=p.get("tail"); if(tl) out.push("N"+tl);
  var cr=p.get("crew"); if(cr){ var c=(d.crew||[]).find(function(x){return x.code===cr;}); out.push(c?c.label.toLowerCase():cr); }
  var per=periodClause(); if(per) out.push(per);
  return out.join(", ");
}
function standingSentence(d){
  if(!d) return "";
  var stale=HERO_FOR!==filterQS();          // never print a figure computed for a different selection
  var tot=d.total||0, desc=selectionDesc(d), c1=stale?"…":num(tot);
  if(desc){
    var grand=d.corpus||d.grand||d.all_total||d.every||0, rest=grand?grand-tot:0;
    var s=c1+' reports, '+esc(desc)+'.';
    if(rest>0) s+=' '+(stale?"…":num(rest))+' set aside.';
    return s;
  }
  var pub=d.published||d.asof||heroRange.to;
  return c1+' reports'+(pub?', everything the FAA has published to '+esc(prettyDate(pub)):"")+'.';
}

/* ---------------- month interactions ---------------- */
function monthAt(ev,box){
  var ms=(heroData&&heroData.months)||[], n=ms.length;
  if(!n||!box) return null;
  var r=box.getBoundingClientRect();
  var i=Math.floor((ev.clientX-r.left)/(r.width||1)*n);   // uniform division of the whole box, scroll-safe
  if(i<0)i=0; if(i>n-1)i=n-1;
  return ms[i].m;
}
function whenMonthsBox(){ var rail=document.querySelector('.rail.open[data-rail=when]'); return rail?rail.querySelector(".months"):null; }
function moList(){ return Array.prototype.slice.call(document.querySelectorAll('.rail.open[data-rail=when] .mo')); }
function paintBracket(a,b){
  if(!a||!b) return;
  var lo=a<b?a:b, hi=a>b?a:b, n=0, map={};
  ((heroData&&heroData.months)||[]).forEach(function(m){ map[m.m]=m.n||0; });
  document.querySelectorAll('.rail[data-rail=when] .mo').forEach(function(el){
    var k=(el.getAttribute("data-aim")||"").slice(6);
    var inb=!!k&&k>=lo&&k<=hi;
    el.classList.toggle("inband",inb);
    if(inb) n+=map[k]||0;
  });
  aim(monthName(lo)+' to '+monthName(hi)+' &middot; '+num(n)+' reports &middot; release to take it');
}
function monthAim(k){
  var m=((heroData&&heroData.months)||[]).find(function(x){return x.m===k;});
  return monthName(k)+' &middot; '+num(m?m.n:0)+' reports &middot; click to narrow to this month';
}
function heroMonth(el){ var k=(el.getAttribute("data-aim")||"").slice(6); if(k) takePeriod(k,k); }

var lastPeriodKey="", lastPeriodAt=0;
function takePeriod(a,b){
  if(!a||!b) return;
  var key=a+"|"+b, now=Date.now();
  if(key===lastPeriodKey&&now-lastPeriodAt<400) return;
  lastPeriodKey=key; lastPeriodAt=now;
  var lo=a<b?a:b, hi=a>b?a:b;
  var from=lo+"-01", to=hi+"-"+String(lastDay(hi)).padStart(2,"0");
  var p=params(); p.set("from",from); p.set("to",to);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  var f=document.getElementById("from"), t=document.getElementById("to");
  if(f) f.value=from;  if(t) t.value=to;
  showPSearch();
  syncControls(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold('narrowed to '+monthName(lo)+(lo===hi?"":" to "+monthName(hi))
    +'. <button class="undoit" onclick="history.back();unaim()">undo</button>');
}

/* ---------------- filters ---------------- */
var lastTakeKey="", lastTakeAt=0;
function runTake(elOrDt){
  var dt=typeof elOrDt==="string"?elOrDt:((elOrDt.getAttribute&&elOrDt.getAttribute("data-take"))||"");
  var i=dt.indexOf("|"); if(i<0) return;
  var key=dt, now=Date.now();
  if(key===lastTakeKey&&now-lastTakeAt<400) return;
  lastTakeKey=key; lastTakeAt=now;
  var k=dt.slice(0,i), v=dt.slice(i+1);
  if(k==="operator") takeFilter("operator",v,opName(v));
  else if(k==="tail") takeFilter("tail",v,"N"+v);
  else if(k==="crew"){ var c=((heroData&&heroData.crew)||[]).find(function(x){return x.code===v;}); takeFilter("crew",v,c?c.label:v); }
  else if(k==="zone"){ var z=zoneRows(heroData||{}).find(function(x){return x.id===v;}); takeFilter("zone",v,z?z.label:v); }
}
function takeFor(dt){ runTake(dt); }
function takeFilter(key,val,label){
  var p=params(); p.set(key,val);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  syncControls(); showPSearch(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold('narrowed to '+esc(label)+'. <button class="undoit" onclick="history.back();unaim()">undo</button>');
}
function showPSearch(){
  var ps=document.getElementById("p-search");
  if(ps){ ps.hidden=false; if(ps.classList) ps.classList.remove("hide","hidden"); }
}
function syncControls(){
  var p=params();
  var f=document.getElementById("from"), t=document.getElementById("to");
  if(f&&p.get("from")) f.value=p.get("from");
  if(t&&p.get("to")) t.value=p.get("to");
  document.querySelectorAll(".orow[data-take]").forEach(function(el){
    var dt=el.getAttribute("data-take"), i=dt.indexOf("|");
    el.classList.toggle("taken", i>0&&(p.get(dt.slice(0,i))||"")===dt.slice(i+1));
  });
  document.querySelectorAll(".strip span[data-op]").forEach(function(el){
    el.classList.toggle("sel",(p.get("operator")||"")===el.getAttribute("data-op"));
  });
}
function takeReading(kind,v){
  if(kind!=="period") return;
  v=String(v||"").trim();
  var lo,hi,label;
  if(/^\d{4}$/.test(v)){ lo=v+"-01-01"; hi=v+"-12-31"; label=v; }
  else if(/^\d{4}-\d{2}$/.test(v)){ lo=v+"-01"; hi=v+"-"+String(lastDay(v)).padStart(2,"0"); label=monthName(v); }
  else return;
  var f=heroRange.from, t=heroRange.to, olo=lo, ohi=hi;
  if(f&&t){
    var clo=lo<f?f:lo, chi=hi>t?t:hi;
    if(clo<=chi){ lo=clo; hi=chi; }   // clamp only where the period and the file overlap
    else{
      aimHold(esc(label)+' is a valid month or year, but this file holds no report for it. It runs from '
        +esc(prettyDate(f))+' to '+esc(prettyDate(t))+'.');
      return;                          // wholly outside: left as asked, returns nothing, says so
    }
  }
  var lab=(lo!==olo||hi!==ohi)?(prettyDate(lo)+' to '+prettyDate(hi)):label;
  var p=params(); p.set("from",lo); p.set("to",hi);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  var fEl=document.getElementById("from"), tEl=document.getElementById("to");
  if(fEl) fEl.value=lo;  if(tEl) tEl.value=hi;
  showPSearch();
  syncControls(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold('narrowed to '+esc(lab)+'. <button class="undoit" onclick="history.back();unaim()">undo</button>');
}

/* ---------------- table cross-highlight ---------------- */
function paintSpines(){
  if(!heroData||!heroData.months) return;
  var map={}; heroData.months.forEach(function(m){ map[m.m]=m.n||0; });
  document.querySelectorAll(".spinen").forEach(function(el){
    var tr=el.closest&&el.closest("tr[data-month]");
    var k=el.getAttribute("data-month")||(tr?tr.getAttribute("data-month"):null);
    if(k&&map[k]!=null) el.textContent=num(map[k])+' in this selection';
  });
}
function aimFor(el){
  var a=el.getAttribute("data-aim")||""; if(!a) return;
  if(a.indexOf("month|")===0){ aim(monthAim(a.slice(6))); return; }
  if(a==="more-ops"){ aim('not ranked here; use the operator control below to reach any of the '+num((heroData&&heroData.operators)||0)); return; }
  if(a==="more-tails"){ aim("not ranked here; type a tail number in the controls below"); return; }
  if(a==="crewall"){ aim(num((heroData&&heroData.crew_reports)||0)+' of '+num((heroData&&heroData.total)||0)+' reports forced the crew to act'); return; }
  var bar=a.indexOf("|"), k=a.slice(0,bar), v=a.slice(bar+1);
  if(k==="op") aim(esc(opName(v))+' &middot; click to follow this operator');
  else if(k==="tail") aim('N'+esc(v)+' &middot; click to follow this one airframe');
  else if(k==="crew"){ var c=((heroData&&heroData.crew)||[]).find(function(x){return x.code===v;}); aim(esc(c?c.label:v)+' &middot; '+num(c?c.n:0)+' reports &middot; click to narrow'); }
  else if(k==="zone"){ var z=zoneRows(heroData||{}).find(function(x){return x.id===v;}); aim(esc(z?z.label:v)+' &middot; '+num(z?z.n:0)+' reports &middot; click to narrow'); }
}

/* ---------------- events, bound once ---------------- */
if(!window.__HERO2_BOUND__){
  window.__HERO2_BOUND__=true;

  document.addEventListener("pointerdown",function(e){
    var rail=e.target.closest?e.target.closest('.rail.open[data-rail=when]'):null;
    if(!rail) return;
    var box=rail.querySelector(".months"); if(!box) return;
    e.preventDefault();                    // text selection and browser panning suppressed; the drag is unambiguous
    dragFrom=monthAt(e,box);
    if(dragFrom==null) return;
    paintBracket(dragFrom,dragFrom);
    var track=rail.querySelector(".track");
    if(track&&track.setPointerCapture){ try{track.setPointerCapture(e.pointerId);}catch(_){}}
  });
  document.addEventListener("pointermove",function(e){
    if(dragFrom==null) return;
    var box=whenMonthsBox(); if(!box){ dragFrom=null; return; }
    paintBracket(dragFrom,monthAt(e,box));
  });
  document.addEventListener("pointerup",function(e){
    if(dragFrom==null) return;
    var a=dragFrom; dragFrom=null;
    var box=whenMonthsBox();
    var b=box?monthAt(e,box):null;
    takePeriod(a,b||a);                    // a plain click is a zero-length drag: one month
  });
  document.addEventListener("pointercancel",function(){
    dragFrom=null;
    document.querySelectorAll('.mo.inband').forEach(function(el){ el.classList.remove("inband"); });
  });

  document.addEventListener("mouseover",function(e){
    var t=e.target, tr=t.closest?t.closest("tr[data-month]"):null;
    if(tr){
      var k=tr.getAttribute("data-month");
      var mo=document.querySelector('.mo[data-aim="month|'+k+'"]');
      if(mo) mo.classList.add("lit");
      tr.classList.add("lit");
    }
    var a=t.closest?t.closest("[data-aim]"):null;
    if(a) aimFor(a);
  });
  document.addEventListener("mouseout",function(e){
    var t=e.target, tr=t.closest?t.closest("tr[data-month]"):null;
    if(tr){
      var k=tr.getAttribute("data-month");
      var mo=document.querySelector('.mo[data-aim="month|'+k+'"]');
      if(mo) mo.classList.remove("lit");
      tr.classList.remove("lit");
    }
    var a=t.closest?t.closest("[data-aim]"):null;
    if(a) aim("");
  });

  document.addEventListener("focusin",function(e){
    var t=e.target;
    if(t.classList&&t.classList.contains("mo")){
      var k=(t.getAttribute("data-aim")||"").slice(6);
      if(k) aim(monthAim(k));
      return;
    }
    var row=t.closest?t.closest("[data-aim]"):null;
    if(row) aimFor(row);
  });

  document.addEventListener("click",function(e){
    var t=e.target, take=t.closest?t.closest("[data-take]"):null;
    if(take){ runTake(take); return; }
    var closed=t.closest?t.closest(".rail:not(.open)[data-rail]"):null;
    if(closed){ setHero(closed.getAttribute("data-rail")); return; }   // a shut rail opens when clicked
    var sp=t.closest?t.closest("[data-case]"):null;
    if(sp&&typeof openCase==="function") openCase(sp.getAttribute("data-case"));
  });

  document.addEventListener("keydown",function(e){
    var t=e.target;
    if(t.classList&&t.classList.contains("mo")){
      var ms=(heroData&&heroData.months)||[], els=moList(), idx=els.indexOf(t);
      var key=function(i){ return ms[i]?ms[i].m:null; };
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Home"||e.key==="End"){
        e.preventDefault();
        var ni=idx;
        if(e.key==="ArrowRight") ni=Math.min(ms.length-1,idx+1);
        else if(e.key==="ArrowLeft") ni=Math.max(0,idx-1);
        else if(e.key==="Home") ni=0;
        else ni=ms.length-1;
        if(!e.shiftKey) kbAnchor=null;
        else if(kbAnchor==null) kbAnchor=idx;
        if(els[ni]) els[ni].focus();       // focus FIRST, then repaint, or focusin overwrites the bracket
        var ai=kbAnchor==null?ni:kbAnchor;
        if(key(ni)&&key(ai)) paintBracket(key(ai),key(ni));
        return;
      }
      if(e.key==="Enter"||e.key===" "||e.key==="Spacebar"){
        e.preventDefault();
        if(kbAnchor!=null&&ms[kbAnchor]) takePeriod(key(kbAnchor),key(idx));
        else heroMonth(t);
      }
      return;
    }
    if(e.key==="Enter"||e.key===" "){
      var take=t.closest?t.closest("[data-take]"):null;
      if(take&&take.getAttribute("role")==="button"){ e.preventDefault(); runTake(take); return; }
      var sp=t.closest?t.closest("[data-case]"):null;
      if(sp){ e.preventDefault(); if(typeof openCase==="function") openCase(sp.getAttribute("data-case")); }
    }
  });

  window.addEventListener("popstate",function(){
    syncControls(); unaim();
    if(heroData) drawHero(heroData);
    var q=filterQS();
    if(lastFilterQS===null) lastFilterQS=q;
    if(q!==lastFilterQS){ lastFilterQS=q; runSearch(0); }
  });

  var rT=null;
  window.addEventListener("resize",function(){
    clearTimeout(rT);
    rT=setTimeout(function(){ if(heroData) drawHero(heroData); },180);
  });
}

/* ---------------- boot ---------------- */
if(!heroBooted){
  heroBooted=true;
  lastFilterQS=filterQS();
  window.unaim=unaim;
  if(heroEl()) loadHero();
}
```

**Departures from the specification, and why**

1. **Shut month bars shade by count.** The spec fixes `.ghostb` at one colour, but a flat grey strip cannot show a distribution, and the stated reason the shut strip exists is that "a reader who has the aircraft open learns nothing about time." So the closed ghostb takes `rgba(ash, 0.3 + 0.7·all/cmax)` — busiest month full-strength, quietest pale — while hatching and every open-rail colour stay exactly as specified. This is also what your browser check ("busiest month darkest") is looking at.
2. **Part-month margin note.** The template hardcodes "covers 1 to ${dd}", which is only true for an end edge. I print the real covered range ("12 to 31") when the month does not start on the 1st, and emit one rust entry per partial month (the spec's singular assumed the usual single end edge).
3. **`HERO_FOR` compares the filter params only** (`filterQS()`, hero deleted). The spec's `params().toString()` includes `?hero=`; comparing the full string would put an ellipsis in the standing sentence every time a rail is toggled, which changes no figure.
4. **`.mo` gets an explicit height (84/14).** The spec's markup leaves the spans zero-height with overflowing bars — that draws, but focus and `.lit` outlines would outline nothing. Same geometry, stable hit and focus boxes.
5. **The magnifier overlay lives inside `.months` with `min-width:var(--mw)`.** Absolutely positioned `left:0;right:0` inside the scroll box pins to the visible width, so the line would drift out of alignment as the strip scrolls.
6. **`specLine`'s duplicate check is skipped when system or part is empty.** Applied naively, `"".includes("")` is true and the part would be dropped whenever the system is blank.
7. **Rail opening uses delegated clicks on `[data-rail]`** rather than inline `onclick=setHero(...)` — same end, and it works inside the IIFE without exporting globals (only `unaim` is exported, for the undo button's inline handler).
8. **WHERE/anatomy had no spec sheet.** It is rebuilt from your measurements: sub-label "on the aircraft", value "all zones" / the chosen zone, a closed strip, zone rows, and its own reading paragraph. It reads `d.zones||d.anatomy||d.regions` and the corpus total as `d.corpus||d.grand||d.all_total||d.every` — if the server names either field differently, that is a one-line fix. Links written by this build use the rebuild's spellings; both spellings are accepted on the way in.