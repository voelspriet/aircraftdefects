CSS:

```css
#sentence{display:none!important}
#sd-sink{display:none!important}
.card.land{display:none!important}
#vstrip.vgroups{display:flex;flex-direction:column;gap:1px;border-bottom:1px solid var(--line);padding:2px 0 3px;margin:8px 0 6px;min-width:0}
#vstrip.vgroups .vg{display:flex;flex-direction:row;align-items:center;gap:10px;min-width:0}
#vstrip.vgroups .vglab{flex:0 0 auto;font:600 9.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#57514a;text-transform:uppercase;white-space:nowrap}
#vstrip.vgroups .vgbtns{display:flex!important;flex-direction:row!important;gap:2px!important;align-items:center!important;flex-wrap:wrap!important;margin:0!important;padding:0!important;border-bottom:0!important;min-width:0;flex:1 1 auto}
button.vtab{padding:3px 8px;font-size:11.5px;line-height:1.2;border:1px solid transparent;border-radius:3px;background:none;color:#5c554c;cursor:pointer;white-space:nowrap}
button.vtab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0}
.sd-second{font-size:11.5px;color:#6b6560;margin:0 0 3px;text-align:center;letter-spacing:.02em}
.sd-second b{font-weight:600}
#hero.instrument{position:relative;background:var(--paper);border:1px solid var(--line);border-bottom:3px solid var(--rust);border-radius:6px;margin:12px 0 0;overflow:hidden;padding:0}
#hero.instrument > .ipad{padding:10px 20px 6px}
#count.sdcount{font-family:'Instrument Serif',Georgia,serif;font-size:30px;line-height:1.1;color:var(--ink);max-width:none;margin:4px 0 2px;white-space:normal}
#count.sdcount .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash)}
#count.sdcount .broken{display:block;font-size:.5em;color:var(--rust)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
.rail .reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);max-width:none}
.rail>.reading{grid-column:2}
@media(max-width:700px){.rail .reading{font-size:14px;padding:7px 10px}}
@media(min-width:901px){
#hero.instrument{max-width:1140px!important}
.rail{align-items:start;grid-template-columns:110px minmax(0,1fr)!important}
.rail .track{min-width:0;position:relative}
.rail .track.two{display:grid;grid-template-columns:minmax(0,628px) minmax(0,330px);gap:18px}
.rail .track.two > svg.plane{width:100%;max-width:640px;height:auto;display:block}
.rail .col .ch{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.rail .orow{display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;font-size:11.5px;height:14px;padding:0 3px;border-radius:3px}
.rail .orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:14px}
.rail .orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.rail .orow .ob i{display:block;height:100%;background:var(--rust)}
.rail .orow.wide{grid-template-columns:190px 1fr 56px;height:17px}
.rail .orow.wide .on{font-size:12px;line-height:17px}
.rail .fblock{height:22px}
.rail .frows{margin-top:4px}
.rail .fnote{font-size:11px;margin-top:3px}
.rail[data-rail=forced].open .fblock{margin-bottom:5px}
.rail .legend{font-size:11.5px;gap:0}
.rail .lrow{padding:0 4px;line-height:1.35}
.rail .zonenote{font-size:11px;line-height:1.4;margin-top:4px;padding-top:4px}
}
#hero .ipad .aimwrap{display:none}
#hero .ipad .rv-aim{margin-top:6px}
#hero .ipad .specimen{font-size:11px;line-height:1.35;padding-top:2px;padding-bottom:2px}
#hero .ipad .margin{font-size:10.5px;line-height:1.3;padding-top:2px;margin-top:3px}
#hero .ipad .rails{margin-top:6px}
#sdControls{gap:4px;margin-top:8px}
#sdControls .bar{gap:6px}
#sdControls .actions{padding:0}
#noRows{padding:8px 12px;margin-top:6px}
#noRows p{margin:3px 0}
#starterToggle{padding:3px 10px}
#rr-sec{margin:6px 0 0}
#rr-sec .cut{font-size:10.5px;line-height:1.25}
#rr-sec .rr-count{font-size:12px}
#rr-sec .rr-more{font-size:11px;padding:3px 10px}
/* sd-extras: blocks the original has no counterpart for, above the tabs */
#znarrow,.card.ask,#khint{display:none!important}
/* sd-credit: match the original's spacing and type */
.credit{font-size:12px;line-height:18.6px;margin:2px 0 10px;padding:0}
/* sd-wu: keep the gloss out of the clip; clip/fade like the original */
table.sdtable td{padding:5px 10px}
tr.wrote td{padding:0 0 14px}
.wu{position:relative}
.wu .wu-gloss{position:absolute;left:12px;bottom:0;height:auto;margin:0}
.wu:not(.clip){padding-bottom:34px}
.wu:not(.clip)::after{content:"none"}
.wu.clip{overflow:hidden;max-height:112px}
.wu.clip::after{content:"";position:absolute;left:0;right:0;bottom:0;height:16px;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,.92) 70%,#fff)}
/* sd-dossier: the aircraft dossier, in #p-aircraft */
#sd-dossier{max-width:1140px;margin:14px auto 0;padding:0 2px;font-size:14px;line-height:1.5}
#sd-dossier .sd-d-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;margin:2px 0 6px}
#sd-dossier .sd-d-tail{font-family:'Instrument Serif',Georgia,serif;font-size:30px;color:var(--ink)}
#sd-dossier .sd-d-make{font-size:12.5px;color:#6b6560}
#sd-dossier .sd-d-count{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-sec{margin:12px 0 0;padding:10px 14px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
#sd-dossier .sd-d-sec h3{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--ash);margin:0 0 7px}
#sd-dossier .sd-d-sec h3.sd-mine{color:#7a5b00}
#sd-dossier .sd-d-frame{font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-dossier .sd-d-split{display:flex;gap:8px 18px;flex-wrap:wrap;margin:8px 0 0;padding:0;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#5c554c;list-style:none}
#sd-dossier .sd-d-split b{color:var(--ink);font-variant-numeric:tabular-nums}
#sd-dossier .sd-d-ops{font-size:12px;color:#6b6560;margin:7px 0 0}
#sd-dossier .sd-d-rpt{margin:7px 0 0;padding-left:10px;border-left:2px solid #e8e3d8;font-size:12.5px;color:#5c554c}
#sd-dossier .sd-d-rpt b{color:var(--ink)}
#sd-dossier .sd-d-hrs{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-quote{margin:5px 0 0;padding:0 0 0 8px;border-left:2px solid var(--line);font:11px/1.4 'IBM Plex Mono',ui-monospace,monospace;color:#7a746c}
#sd-dossier .sd-d-sum{font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-dossier .sd-d-note{font-size:11.5px;color:#7a5b00;margin:7px 0 0}
#sd-dossier .sd-d-lim{margin:0;padding-left:18px}
#sd-dossier .sd-d-lim li{margin:4px 0;font-size:13px;color:var(--ink)}
#sd-dossier .sd-d-cite{font-size:12px;color:#6b6560;margin:0;word-break:break-word}
#sd-dossier .sd-d-cite a{color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-btns{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
#sd-dossier .sd-d-none{font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
@media(max-width:700px){#sd-dossier .sd-d-tail{font-size:24px}#sd-dossier .sd-d-sec{padding:9px 10px}}
/* sd-dossier2: the operator and part dossiers share the same node; what the
   panel is holding is said in the kicker, and the second way in to a dossier
   from the table cells is a marker that leaves setFilter alone */
#sd-dossier .sd-d-kick{font:600 10px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);margin:0 0 7px}
#sd-dossier .sd-d-kick b{color:var(--rust-text,#b8431f)}
.sd-d-mark{display:inline-block;margin:0 0 0 6px;padding:2px 6px;font:600 9px/1 Archivo,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--rust-text,#b8431f);background:var(--card);border:1px solid var(--line);border-radius:3px;cursor:pointer;vertical-align:1px}
.sd-d-mark:hover{border-color:var(--rust-text,#b8431f);color:var(--ink)}
.sd-d-mark:focus-visible{outline:2px solid var(--rust-text,#b8431f);outline-offset:1px}
code.cd.sd-pnlink{cursor:pointer;border-bottom:1px dotted var(--rust-text,#b8431f)}
code.cd.sd-pnlink:hover{color:var(--rust-text,#b8431f)}
code.cd.sd-pnlink:focus-visible{outline:2px solid var(--rust-text,#b8431f);outline-offset:1px}
#sd-dossier .sd-d-bars{list-style:none;margin:8px 0 0;padding:0}
#sd-dossier .sd-d-bars li{display:grid;grid-template-columns:minmax(90px,190px) minmax(60px,1fr) 64px;gap:8px;align-items:center;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;height:17px}
#sd-dossier .sd-d-bars .sd-d-barlab{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#5c554c;text-align:right}
#sd-dossier .sd-d-bars .sd-d-bar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden;min-width:0}
#sd-dossier .sd-d-bars .sd-d-bar i{display:block;height:100%;background:var(--rust)}
#sd-dossier .sd-d-bars .sd-d-barnum{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
@media(max-width:700px){#sd-dossier .sd-d-bars li{grid-template-columns:minmax(64px,110px) minmax(40px,1fr) 52px;font-size:10.5px;height:16px}}
```

JavaScript:

```javascript
(function(){
"use strict";
window.__sderrs=window.__sderrs||[];
addEventListener("error",function(e){try{window.__sderrs.push(String((e&&e.message)||e))}catch(_){}});
function byId(id){return document.getElementById(id)}
function visible(n){if(!n||n.nodeType!==1)return false;if(!n.offsetParent&&getComputedStyle(n).position!=="fixed")return false;var cs=getComputedStyle(n);return cs.display!=="none"&&cs.visibility!=="hidden"}
function phone(){return matchMedia("(max-width:760px)").matches}
var READING_TEXT="Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA\u2019s numbered zones, or 39.7%. Those numbers are what this diagram can place, and they are 12.1% of the selection. Another 1,454,504 do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them. Only 90,383, 5.1%, give no location at all. It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.";
var SEED_HTML='<span class="fig">1,757,827</span> reports, everything the FAA has published to 26 August 2026.';
var SHORT_TOTAL=/^1,757,827\s+reports\.?(\s*Nothing chosen yet\.?)?\s*$/;
var NOROWS_HTML='<p><strong>No rows yet, on purpose.</strong> Listing everything answers no question and buries the one you have.</p><p class="muted">Take a month, a zone, an airline or a tail from the instrument above, pick one of the starter questions, or set a filter. To read the file straight through anyway, use the button at the foot of the instrument.</p><p><button type="button" class="sdbtn" id="revealBtn">Read all 1,757,827 anyway</button> <button type="button" class="ghostbtn" id="gotoStarters">Show me the starter questions</button></p>';
function sdFiltered(){
  var i,x;
  var sels=document.querySelectorAll("#sdControls select");
  for(i=0;i<sels.length;i++){if((sels[i].value||"").trim()!=="")return true}
  var ins=document.querySelectorAll("#sdControls input");
  for(i=0;i<ins.length;i++){
    x=ins[i];
    if(x.type==="checkbox"||x.type==="radio"){if(x.checked)return true}
    else if((x.value||"").trim()!=="")return true;
  }
  var tabs=document.querySelectorAll("#vstrip .vtab.on");
  for(i=0;i<tabs.length;i++){if((tabs[i].getAttribute("data-view")||"p-search")!=="p-search")return true}
  return false;
}
function ensureIpad(){
  var hero=byId("hero");if(!hero)return null;
  var rails=hero.querySelector(".rails");
  if(!rails||!visible(rails)||hero.querySelector(".phbar"))return hero.querySelector(":scope > .ipad")||null;
  if(!/\binstrument\b/.test(hero.className||""))hero.className=("instrument "+(hero.className||"")).trim();
  var kids=[].slice.call(hero.children),i,ipad=null,ihead=null;
  for(i=0;i<kids.length;i++){if(/\bipad\b/.test(kids[i].className||"")){ipad=kids[i];break}}
  for(i=0;i<kids.length;i++){if(/\bihead\b/.test(kids[i].className||"")){ihead=kids[i];break}}
  if(!ipad){
    ipad=document.createElement("div");ipad.className="ipad";
    if(ihead)ihead.after(ipad);else hero.insertBefore(ipad,hero.firstChild);
    kids=[].slice.call(hero.children);
    for(i=0;i<kids.length;i++){if(kids[i]!==ipad&&kids[i]!==ihead)ipad.appendChild(kids[i])}
  }
  return ipad;
}
function sdSink(){
  var s=byId("sd-sink");
  if(!s){s=document.createElement("div");s.id="sd-sink";(document.querySelector("main.wrap")||document.body).appendChild(s)}
  return s;
}
function sdEmpty(c){return !c.textContent.trim()&&!c.children.length}
function seatCount(){
  var all=document.querySelectorAll("#count");
  var c=all[0];
  if(!c){
    c=document.createElement("div");c.id="count";
    (document.querySelector("main.wrap")||document.body).appendChild(c);
  }
  var i;
  for(i=0;i<all.length;i++){if(all[i]!==c&&all[i].parentNode)all[i].parentNode.removeChild(all[i])}
  function detach(){if(c.parentNode&&c.parentNode.nodeType===1&&c.parentNode.contains(c))c.parentNode.removeChild(c)}
  var hero=byId("hero");
  var railsEl=hero?hero.querySelector(".rails"):null;
  var rails=(railsEl&&visible(railsEl))?railsEl:null;
  var ph=hero?hero.querySelector(".phbar"):null;
  if(ph&&(phone()||!rails)){
    if(c.parentNode!==ph){detach();ph.insertBefore(c,ph.firstChild)}
  }else if(rails){
    var host=rails.parentNode;
    if(c.parentNode!==host||c.nextElementSibling!==rails){
      detach();
      if(rails.parentNode===host)host.insertBefore(c,rails);
    }
  }
  if(!/\bsdcount\b/.test(c.className))c.className=("sdcount "+c.className).trim();
  if(!sdFiltered()){
    if(sdEmpty(c)||SHORT_TOTAL.test(c.textContent.trim())){c.dataset.sdSeeded="1";c.innerHTML=SEED_HTML}
  }
}
function retireStand(){
  var s=document.querySelector(".ipad .stand");
  if(s&&s.parentNode)sdSink().appendChild(s);
}
function ensureReading(){
  var rail=document.querySelector(".rail[data-rail=where]");
  if(!rail||!rail.parentNode)return;
  var rs=[].slice.call(rail.querySelectorAll(".reading")),i,keep=null;
  for(i=0;i<rs.length;i++){
    if(!keep||rs[i].textContent.trim().length>keep.textContent.trim().length)keep=rs[i];
  }
  if(keep&&keep.tagName!=="P"){
    var p=document.createElement("p");p.className="reading";
    p.innerHTML=keep.innerHTML;
    keep.parentNode.replaceChild(p,keep);keep=p;
  }
  if(!keep){
    keep=document.createElement("p");keep.className="reading";
    keep.textContent=READING_TEXT;
  }
  if(keep.parentNode!==rail)rail.appendChild(keep);
  [].slice.call(rail.children).forEach(function(n){
    if(n===keep)return;
    var cn=n.className||"";
    if(/\b(gut|track)\b/.test(cn))return;
    if(/\breading\b/.test(cn)){
      if(!n.textContent.trim())n.remove();
      return;
    }
    n.remove();
  });
}
function stripInline(){
  var bs=document.querySelectorAll("#vstrip.vgroups .vgbtns"),i;
  for(i=0;i<bs.length;i++){
    var b=bs[i];if(b.dataset.sdInl)continue;b.dataset.sdInl="1";
    b.style.margin="0";b.style.padding="0";b.style.borderBottom="0";
  }
}
function secondLine(){
  var strip=byId("vstrip");if(!strip)return;
  var p=byId("sd-second");
  if(!p){p=document.createElement("p");p.id="sd-second";p.className="sd-second";strip.parentNode.insertBefore(p,strip.nextSibling)}
  if(p.dataset.sdDone)return;p.dataset.sdDone="1";
  var fr=byId("freshness");
  p.innerHTML=(fr&&fr.textContent.trim())?fr.textContent.trim():"Counts of reports filed, not of flights.";
}
function ensureSentence(){
  var s=byId("sentence");
  if(!s){s=document.createElement("div");s.id="sentence";s.hidden=true;(document.querySelector("main.wrap")||document.body).appendChild(s)}
  if(!s.hidden)s.hidden=true;
  if(s.style.display!=="none")s.style.display="none";
}
function ensureNoRows(){
  var n=byId("noRows");if(!n)return;
  if(!n.textContent.trim()&&!n.children.length)n.innerHTML=NOROWS_HTML;
  if(phone()){
    if(n.hasAttribute("hidden"))n.removeAttribute("hidden");
    if(n.style.display==="none")n.style.display="";
  }
}
/* sd-tag: mark the record table so its td padding can be tuned */
function tagTable(){
  var w=document.querySelector(".wu");
  if(!w)return;
  var t=w.closest("table");
  if(t&&!t.classList.contains("sdtable"))t.classList.add("sdtable");
}
var snap={c:null};
function sdMirror(){
  var s=byId("sentence"),c=byId("count");
  if(!s||!c||s===c)return;
  var cv=c.innerHTML;
  if(s.innerHTML!==cv&&snap.c!==null&&snap.c!==cv){
    s.innerHTML=cv;
  }
  snap.c=cv;
}
function purgeLand(){
  var ls=document.querySelectorAll(".card.land"),i;
  for(i=0;i<ls.length;i++)ls[i].remove();
}

/* ============ sd-dossier: the panel holds one subject at a time — a tail
   number, an operator code, or a part number — read from the endpoints ====== */
var SD={kind:null,value:null,inflight:null,cache:{}};
var SD_KIND={tail:"tail number",operator:"operator",part:"part number"};
function sdEsc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function sdNum(v){var n=Number(v);if(isFinite(n))return n;n=Number(String(v==null?"":v).replace(/,/g,""));return isFinite(n)?n:0}
function sdFmt(n){return sdNum(n).toLocaleString("en-US")}
function sdKey(kind,val){return kind+":"+val}
function sdKickText(kind){return 'Aircraft panel \u2014 holding <b>one '+SD_KIND[kind]+'</b>'}
function sdDossierNode(){
  var panel=byId("p-aircraft");if(!panel)return null;
  var node=byId("sd-dossier");
  if(!node){
    node=document.createElement("div");node.id="sd-dossier";
    node.setAttribute("role","region");node.setAttribute("aria-label","Dossier for the current subject");
    var pb=byId("p-aircraft-body");
    if(pb&&pb.parentNode===panel)pb.insertAdjacentElement("afterend",node);
    else panel.appendChild(node);
  }
  return node;
}
function sdSetVerbatim(node,sel,txt){
  var el=node.querySelector(sel);
  if(el)el.textContent=(txt==null)?"":String(txt);
}
/* sd-d-limit helper: every cannot_show sentence goes on screen, verbatim */
function sdLimits(arr){
  if(!arr||!arr.length)return "";
  return '<section class="sd-d-sec"><h3>What this file cannot show</h3><ul class="sd-d-lim">'
    +arr.map(function(x){return '<li>'+sdEsc(x)+'</li>'}).join("")+'</ul></section>';
}
/* sd-d-pair: rows arrive as objects whose field names are not part of the
   contract, so read the values by kind: the last free-text value is the
   label, the last numeric value is the count. */
function sdLabelNum(o){
  var keys,i,v,strs=[],nums=[];
  if(o&&typeof o==="object"){
    keys=Object.keys(o);
    for(i=0;i<keys.length;i++){
      v=o[keys[i]];
      if(typeof v==="number"&&isFinite(v)){nums.push(v);continue}
      if(typeof v==="string"&&v.trim()){
        if(/\d/.test(v)&&/^-?[\d,]+(\.\d+)?$/.test(v.trim().replace(/,/g,"")))nums.push(v.trim());
        else strs.push(v.trim());
      }
    }
    if(strs.length)return{label:strs[strs.length-1],num:nums.length?sdNum(nums[nums.length-1]):null};
    if(nums.length)return{label:String(nums[0]),num:sdNum(nums[nums.length-1])};
    return{label:keys.length?String(o[keys[0]]):"",num:null};
  }
  return{label:String(o==null?"":o),num:null};
}
function sdBars(rows){
  var i,p,items=[],max=0;
  if(!rows||!rows.length)return "";
  for(i=0;i<rows.length;i++){p=sdLabelNum(rows[i]);items.push(p);if(p.num!=null&&p.num>max)max=p.num}
  return items.map(function(p){
    var w=(p.num!=null&&max>0)?Math.max(2,Math.round(100*p.num/max)):0;
    return '<li><span class="sd-d-barlab">'+sdEsc(p.label)+'</span>'
      +'<span class="sd-d-bar">'+(w?'<i style="width:'+w+'%"></i>':'')+'</span>'
      +'<span class="sd-d-barnum">'+(p.num!=null?sdFmt(p.num):"\u2014")+'</span></li>';
  }).join("");
}
/* sd-d-quotes: a few records in the file's own words. Field names are not
   part of the contract, so take the longest text on each record, which is
   where the write-up lives, and say so. */
function sdQuotes(recs){
  var out=[],i,r,vals,cand,limit;
  if(!recs||!recs.length)return "";
  limit=Math.min(recs.length,3);
  for(i=0;i<limit;i++){
    r=recs[i];cand="";
    if(r&&typeof r==="object"){
      vals=Object.keys(r).map(function(k){return r[k]})
        .filter(function(v){return typeof v==="string"&&v.trim().length>=40});
      vals.sort(function(a,b){return b.length-a.length});
      if(vals.length)cand=vals[0].trim();
    }else if(typeof r==="string"&&r.trim().length>=40){cand=r.trim()}
    if(cand)out.push('<blockquote class="sd-d-quote">'+sdEsc(cand.length>220?cand.slice(0,220)+"\u2026":cand)+'</blockquote>');
  }
  if(!out.length)return "";
  return '<section class="sd-d-sec"><h3>In the file\u2019s own words</h3>'+out.join("")
    +'<p class="sd-d-ops">Up to three of the '+sdFmt(recs.length)+' records in this slice, longest text field first.</p></section>';
}
function sdRenderFailed(node,kind){
  node.innerHTML='<p class="sd-d-kick">'+sdKickText(kind)+'</p>'
    +'<section class="sd-d-sec"><p class="sd-d-none">The dossier did not answer. Nothing is shown rather than something wrong.</p></section>';
}
/* ---- the tail dossier ---- */
function sdRender(node,t,raf,rpf,rsm){
  var ok=function(r){return r&&r.status==="fulfilled"?r.value:null};
  var af=ok(raf),rp=ok(rpf),sm=ok(rsm);
  var parts=['<p class="sd-d-kick">'+sdKickText("tail")+'</p>'];
  var found=af?(af.found||0):0;
  if(!af||found===0){
    parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(t)+'</span></div>');
    parts.push('<section class="sd-d-sec"><p class="sd-d-none">No reports in this file name that tail number.</p>'
      +(af&&af.note?'<p class="sd-d-note">'+sdEsc(af.note)+'</p>':'')
      +'<p class="sd-d-note">Nothing is shown rather than something wrong.</p></section>');
    node.innerHTML=parts.join("");
    return;
  }
  var ac=af.aircraft||{};
  var mm=[ac.make,ac.model].filter(Boolean).join(" ");
  var rec0=(af.records&&af.records[0])||{};
  if(!mm&&rec0.make)mm=[rec0.make,rec0.model].filter(Boolean).join(" ");
  var ops=(af.operators||[]).map(function(o){return (o&&o.name?o.name:"unnamed")+(o&&o.reports?" ("+o.reports+")":"")}).join(", ");
  parts.push('<div class="sd-d-head">'
    +'<span class="sd-d-tail">'+sdEsc(af.tail||t)+'</span>'
    +(mm?'<span class="sd-d-make">'+sdEsc(mm)+'</span>':'')
    +'<span class="sd-d-count">'+found+' report'+(found===1?"":"s")+'</span>'
    +(af.first||af.last?'<span class="sd-d-make">first filed '+sdEsc(af.first||"\u2014")+' \u00b7 last filed '+sdEsc(af.last||"\u2014")+'</span>':'')
    +'</div>');
  var fr=af.framing||{};
  parts.push('<section class="sd-d-sec"><h3>Where the write-ups were made</h3>'
    +'<p class="sd-d-frame" data-sd-frame="1"></p>'
    +'<ul class="sd-d-split">'
    +'<li>on the ground <b>'+sdEsc(fr.on_ground)+'</b> ('+sdEsc(fr.on_ground_pct)+'%)</li>'
    +'<li>in flight <b>'+sdEsc(fr.in_flight)+'</b> ('+sdEsc(fr.in_flight_pct)+'%)</li>'
    +'<li>of <b>'+sdEsc(fr.total)+'</b> write-ups</li>'
    +'</ul></section>');
  if(rp&&rp.groups&&rp.groups.length){
    var gs=rp.groups.map(function(g){
      var sys=g.system?" \u2014 "+sdEsc(g.system):"";
      var rec=(g.records&&g.records[0]&&g.records[0].text)
        ?'<blockquote class="sd-d-quote">'+sdEsc(String(g.records[0].text).slice(0,220))+'</blockquote>':"";
      return '<div class="sd-d-rpt"><b>'+sdEsc(g.part||"unnamed part")+'</b>'+sys
        +' \u00b7 '+sdEsc(g.times)+' write-up'+(g.times===1?"":"s")
        +' \u00b7 first '+sdEsc(g.first)+' \u00b7 last '+sdEsc(g.last)
        +' \u00b7 <span class="sd-d-hrs">'+sdEsc(g.hours_between)+' hours between first and last</span>'+rec+'</div>';
    }).join("");
    parts.push('<section class="sd-d-sec"><h3>What recurred</h3>'
      +(rp.note?'<p class="sd-d-note">'+sdEsc(rp.note)+'</p>':"")+gs+'</section>');
  }else{
    parts.push('<section class="sd-d-sec"><h3>What recurred</h3><p class="sd-d-none">Nothing on this airframe was written up more than once.</p></section>');
  }
  var gen=!!(sm&&sm.generated===true);
  var hasSum=sm&&sm.summary&&String(sm.summary).trim();
  var lab=hasSum?(gen?"Written by a model":"Assembled from recounted numbers \u2014 not written by a model"):"Summary not written";
  var sumBody=hasSum?'<p class="sd-d-sum" data-sd-sum="1"></p>'
    :'<p class="sd-d-none">No summary was written for this tail. That is the check working: nothing is shown rather than something wrong.</p>';
  var sumNote=(sm&&sm.note)?'<p class="sd-d-note">'+sdEsc(sm.note)+'</p>':"";
  var sumLim=(sm&&sm.cannot_show&&sm.cannot_show.length)
    ?'<ul class="sd-d-lim">'+sm.cannot_show.map(function(x){return "<li>"+sdEsc(x)+"</li>"}).join("")+'</ul>':"";
  parts.push('<section class="sd-d-sec"><h3 class="sd-mine">'+sdEsc(lab)+'</h3>'+sumBody+sumNote+sumLim+'</section>');
  parts.push(sdLimits(af.cannot_show));
  var cit=af.citation||{};
  var csvTail=af.tail||t;
  parts.push('<section class="sd-d-sec"><h3>Citation</h3><p class="sd-d-cite">'
    +sdEsc(cit.source||"FAA Service Difficulty Reports")
    +(cit.retrieved?" \u00b7 retrieved "+sdEsc(cit.retrieved):"")
    +(cit.url?' \u00b7 <a href="'+sdEsc(cit.url)+'" rel="noopener">'+sdEsc(cit.url)+'</a>':"")
    +(cit.record_ids&&cit.record_ids.length?" \u00b7 "+cit.record_ids.length+" record ids":"")
    +'</p><div class="sd-d-btns"><a class="sdbtn" id="sd-d-csv" download="'+sdEsc(csvTail)+'-sdr.csv" href="/z/api/export/'+encodeURIComponent(csvTail)+'.csv">Download the CSV for this airframe</a>'
    +'<span class="sd-d-make">The CSV carries its own citation header lines.</span></div></section>');
  node.innerHTML=parts.join("");
  sdSetVerbatim(node,"[data-sd-frame]",fr.sentence);
  if(hasSum)sdSetVerbatim(node,"[data-sd-sum]",sm.summary);
}
/* ---- the operator dossier. Everything here is arithmetic over the file, so
   nothing in it is marked as a model's reading. Where the file has no name,
   the code and the note are printed, never a guess and never a blank. ---- */
function sdRenderOperator(node,res){
  var o=(res&&res.status==="fulfilled"&&res.value&&typeof res.value==="object")?res.value:null;
  if(!o){sdRenderFailed(node,"operator");return}
  var code=(o.code!=null&&String(o.code).trim())?String(o.code).trim():SD.value;
  var known=o.name_known===true;
  var name=(known&&o.name!=null&&String(o.name).trim())?String(o.name).trim():"";
  var note=(o.name_note!=null&&String(o.name_note).trim())?String(o.name_note).trim():"";
  var total=sdNum(o.total),shown=sdNum(o.shown);
  var parts=['<p class="sd-d-kick">'+sdKickText("operator")+'</p>'];
  parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(code)+'</span>'
    +(name?'<span class="sd-d-make">'+sdEsc(name)+'</span>':'')
    +'<span class="sd-d-count">'+sdFmt(total)+' report'+(total===1?"":"s")+'</span></div>');
  if(!known){
    parts.push('<section class="sd-d-sec"><p class="sd-d-note">'
      +sdEsc(note||"The file gives no name for this designator.")+'</p></section>');
  }else if(note){
    parts.push('<section class="sd-d-sec"><p class="sd-d-note">'+sdEsc(note)+'</p></section>');
  }
  parts.push('<section class="sd-d-sec"><h3>The count</h3><ul class="sd-d-split">'
    +'<li>reports in the file <b>'+sdFmt(total)+'</b></li>'
    +'<li>shown under the current filters <b>'+sdFmt(shown)+'</b></li>'
    +'</ul></section>');
  var sys=sdBars(o.systems);
  if(sys)parts.push('<section class="sd-d-sec"><h3>By aircraft system</h3><ul class="sd-d-bars">'+sys+'</ul></section>');
  var q=sdQuotes(o.records);
  if(q)parts.push(q);
  parts.push(sdLimits(o.cannot_show));
  node.innerHTML=parts.join("");
}
/* ---- the part dossier. A count of reports is never left standing as a
   count of broken parts: aircraft and operators sit beside total, and the
   spread over operators and years is what turns the count into a finding. ---- */
function sdRenderPart(node,res){
  var p=(res&&res.status==="fulfilled"&&res.value&&typeof res.value==="object")?res.value:null;
  if(!p){sdRenderFailed(node,"part");return}
  var pn=(p.part!=null&&String(p.part).trim())?String(p.part).trim():SD.value;
  var total=sdNum(p.total),shown=sdNum(p.shown),ac=sdNum(p.aircraft),ops=sdNum(p.operators);
  var parts=['<p class="sd-d-kick">'+sdKickText("part")+'</p>'];
  parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(pn)+'</span>'
    +'<span class="sd-d-make">part number</span>'
    +'<span class="sd-d-count">'+sdFmt(total)+' report'+(total===1?"":"s")+'</span></div>');
  if(total===0){
    parts.push('<section class="sd-d-sec"><p class="sd-d-none">No report in this file names that part number, so there is no table to draw.</p></section>');
    parts.push(sdLimits(p.cannot_show));
    node.innerHTML=parts.join("");
    return;
  }
  parts.push('<section class="sd-d-sec"><h3>The count</h3>'
    +'<ul class="sd-d-split">'
    +'<li>reports, total <b>'+sdFmt(total)+'</b></li>'
    +'<li>naming <b>'+sdFmt(ac)+'</b> aircraft</li>'
    +'<li>from <b>'+sdFmt(ops)+'</b> operator'+(ops===1?"":"s")+'</li>'
    +'<li>shown under the current filters <b>'+sdFmt(shown)+'</b></li>'
    +'</ul>'
    +'<p class="sd-d-ops">A count of reports is not a count of broken parts: each one is a write-up on one airplane at one operator.</p></section>');
  var bo=sdBars(p.by_operator);
  if(bo&&ops>0){
    var gloss=(ops>=2)
      ?"The same part failing across "+sdFmt(ops)+" operators reads as a fleet problem rather than a supplier or a shop."
      :"Concentrated in one operator, the same part failing again reads as a supplier or a shop rather than a fleet problem.";
    parts.push('<section class="sd-d-sec"><h3>Which operators filed it</h3>'
      +'<p class="sd-d-ops">'+sdEsc(gloss)+'</p>'
      +'<ul class="sd-d-bars">'+bo+'</ul></section>');
  }
  var by=sdBars(p.by_year);
  if(by)parts.push('<section class="sd-d-sec"><h3>When the reports were filed</h3><ul class="sd-d-bars">'+by+'</ul></section>');
  var q=sdQuotes(p.records);
  if(q)parts.push(q);
  parts.push(sdLimits(p.cannot_show));
  node.innerHTML=parts.join("");
}
/* ---- one opener for all three; one node, one at a time, tab forward ---- */
function sdGetJSON(path){return fetch("/z/api/"+path).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})}
function sdReq(kind,val){
  var e=encodeURIComponent(val);
  if(kind==="tail")return[sdGetJSON("airframe/"+e),sdGetJSON("repeats/"+e),sdGetJSON("summary/"+e)];
  if(kind==="operator")return[sdGetJSON("operator/"+e)];
  return[sdGetJSON("part/"+e)];
}
function sdRenderCached(node){
  var rs=SD.cache[sdKey(SD.kind,SD.value)];
  node.dataset.sdDone="1";
  if(!rs){sdRenderFailed(node,SD.kind);return}
  if(SD.kind==="tail")sdRender(node,SD.value,rs[0],rs[1],rs[2]);
  else if(SD.kind==="operator")sdRenderOperator(node,rs[0]);
  else sdRenderPart(node,rs[0]);
}
function sdOpen(kind,val){
  if(!SD_KIND[kind])return;
  val=String(val==null?"":val).trim();if(!val)return;
  SD.kind=kind;SD.value=val;
  var key=sdKey(kind,val);
  var tab=document.querySelector('#vstrip .vtab[data-view="p-aircraft"]');
  if(tab)try{tab.click()}catch(_){}
  var node=sdDossierNode();if(!node)return;
  node.setAttribute("aria-label","Dossier for one "+SD_KIND[kind]);
  node.dataset.sdKey=key;
  if(SD.cache[key]){sdRenderCached(node);return}
  node.dataset.sdDone="";
  node.innerHTML='<p class="sd-d-kick">'+sdKickText(kind)+'</p>'
    +'<p class="sd-d-none">Reading the file for the '+sdEsc(SD_KIND[kind])+' '+sdEsc(val)+'\u2026</p>';
  if(SD.inflight===key)return;
  SD.inflight=key;
  Promise.allSettled(sdReq(kind,val)).then(function(rs){
    if(SD.kind!==kind||SD.value!==val)return;
    SD.inflight=null;
    SD.cache[key]=rs;
    var cur=byId("sd-dossier")||node;
    cur.dataset.sdKey=key;cur.dataset.sdDone="1";
    sdRenderCached(cur);
  }).catch(function(){
    if(SD.kind!==kind||SD.value!==val)return;
    SD.inflight=null;
    var cur=byId("sd-dossier")||node;
    cur.dataset.sdKey=key;cur.dataset.sdDone="1";
    sdRenderFailed(cur,kind);
  });
}
function sdOpenTail(t){sdOpen("tail",t)}
function sdOpenOperator(c){sdOpen("operator",c)}
function sdOpenPart(p){sdOpen("part",p)}
function sdBootFromURL(){
  var q=new URLSearchParams(location.search);
  var t=q.get("tail");
  if(!t&&q.get("kind")==="tail")t=q.get("v");
  if(t)sdOpenTail(t);
}
/* sd-rrtail: the page's tail click called loadTail, which does not exist
   here. Redefined to open the dossier instead; reg arrives without its
   leading N, and the tab still comes forward. Re-asserted in pass() so a
   redraw cannot put the broken one back. */
function sdRrTail(reg){
  try{if(typeof show==="function")show("p-aircraft")}catch(_){}
  sdOpenTail("N"+String(reg==null?"":reg).replace(/^N/,""));
}
window.rrTail=sdRrTail;
/* sd-dossier wiring: delegated at the document with capture, so it survives
   every redraw. The dossier markers stop the event before the cell's own
   setFilter can run; a click on the value itself still filters. */
document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest('[data-ask^="tail|"],[data-sd-op],[data-sd-part]'):null;
  if(!el)return;
  if(el.hasAttribute("data-sd-op")){
    e.preventDefault();e.stopPropagation();
    sdOpenOperator(el.getAttribute("data-sd-op"));return;
  }
  if(el.hasAttribute("data-sd-part")){
    e.preventDefault();e.stopPropagation();
    sdOpenPart(el.getAttribute("data-sd-part"));return;
  }
  var v=(el.getAttribute("data-ask")||"").slice(5);
  if(v)sdOpenTail(v);
},true);
document.addEventListener("keydown",function(e){
  if(e.key!=="Enter"&&e.key!==" ")return;
  var t=e.target;
  if(!t||!t.getAttribute)return;
  var a=t.getAttribute("data-ask")||"";
  if(a.indexOf("tail|")===0){var v=a.slice(5);if(v)sdOpenTail(v);return}
  var op=t.getAttribute("data-sd-op");
  if(op){e.preventDefault();sdOpenOperator(op);return}
  var pn=t.getAttribute("data-sd-part");
  if(pn){e.preventDefault();sdOpenPart(pn)}
},true);
addEventListener("popstate",function(){try{sdBootFromURL()}catch(_){}});
/* sd-mark: the second way in from the table. Beside each operator value that
   setFilter owns, a small marker opens the operator dossier; the P/N code,
   which is not clickable at all, becomes the way in to the part dossier.
   Model cells are left to setFilter alone. */
function sdMarkCells(){
  var OPRE=/setFilter\s*\(\s*(['"])operator\1\s*,\s*(['"])([^'"]*)\2/;
  var i,sp,ns=document.querySelectorAll("span.c[onclick*='setFilter']");
  for(i=0;i<ns.length;i++){
    sp=ns[i];
    if(sp.dataset.sdOpDone)continue;
    sp.dataset.sdOpDone="1";
    var m=OPRE.exec(sp.getAttribute("onclick")||"");
    if(!m||!m[3])continue;
    var b=document.createElement("button");
    b.type="button";b.className="sd-d-mark";
    b.setAttribute("data-sd-op",m[3]);
    b.setAttribute("aria-label","Open the dossier for operator "+m[3]);
    b.textContent="dossier";
    sp.appendChild(b);
  }
  var cs=document.querySelectorAll("code.cd"),j,c,tx,mm,pn;
  for(j=0;j<cs.length;j++){
    c=cs[j];
    if(c.dataset.sdPnDone)continue;
    if(c.closest&&c.closest("#sd-dossier"))continue;
    c.dataset.sdPnDone="1";
    tx=(c.textContent||"").trim();
    mm=/^P\/?N\.?\s*(.+)$/i.exec(tx);
    if(!mm)continue;
    pn=mm[1].trim();
    if(!pn)continue;
    c.dataset.sdPart=pn;
    c.setAttribute("role","button");
    c.setAttribute("tabindex","0");
    c.setAttribute("aria-label","Open the dossier for part number "+pn);
    c.classList.add("sd-pnlink");
  }
}
function sdDossierKick(){
  if(!SD.kind||!SD.value)return;
  var node=sdDossierNode();if(!node)return;
  var key=sdKey(SD.kind,SD.value);
  if(node.isConnected&&node.dataset.sdKey===key&&node.dataset.sdDone==="1")return;
  node.dataset.sdKey=key;
  if(SD.cache[key])sdRenderCached(node);
  else sdOpen(SD.kind,SD.value);
}

var queued=false;
function pass(){
  queued=false;
  try{if(window.rrTail!==sdRrTail)window.rrTail=sdRrTail}catch(e){}
  try{purgeLand()}catch(e){}
  try{ensureSentence()}catch(e){}
  try{ensureIpad()}catch(e){}
  try{seatCount()}catch(e){}
  try{retireStand()}catch(e){}
  try{ensureReading()}catch(e){}
  try{ensureNoRows()}catch(e){}
  try{stripInline()}catch(e){}
  try{secondLine()}catch(e){}
  try{tagTable()}catch(e){}
  try{sdMarkCells()}catch(e){}
  try{sdMirror()}catch(e){}
  try{sdDossierKick()}catch(e){}
}
function kick(){if(queued)return;queued=true;requestAnimationFrame(pass)}
new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){pass();sdBootFromURL()});
else{pass();sdBootFromURL()}
addEventListener("load",pass);
addEventListener("resize",kick);
})();
```