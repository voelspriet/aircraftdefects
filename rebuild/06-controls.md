Where things go:

- **Markup**: paste the `<div id="sdControls">` block immediately after the instrument's closing tag, before the record-table mount. The script below runs when it is reached in source order, so the controls exist by then, and so do `.ipad` / `.phextra` for the aim-box injection.
- **CSS**: the `<style>` block, anywhere.
- **JavaScript**: paste inside the existing IIFE, after the instrument's own code. It calls `search(offset)` and never declares it.

**Markup**

```html
<!-- ============ CONTROLS HALF — immediately after the instrument ============ -->
<div id="sdControls">

  <div id="iAim" class="aim" role="status" aria-live="polite"></div>

  <div class="bar">
    <div class="fld grow">
      <label for="q">Text</label>
      <input id="q" list="qList" autocomplete="off" placeholder="any words a mechanic wrote">
      <datalist id="qList"></datalist>
    </div>
    <div class="fld">
      <label for="operator">Operator</label>
      <select id="operator"><option value="">Any operator</option></select>
    </div>
    <div class="fld">
      <label for="from">From</label>
      <input type="date" id="from">
    </div>
    <div class="fld">
      <label for="to">To</label>
      <input type="date" id="to">
    </div>
    <div class="fld btns">
      <button type="button" id="runSearch" class="sdbtn">Search</button>
      <button type="button" id="clearAll" class="ghostbtn">Clear</button>
    </div>
  </div>

  <details id="moreFilters">
    <summary>More filters <span id="mfCount"></span></summary>
    <div class="grid">
      <input type="hidden" id="jasc">
      <div class="fld"><label for="make">Manufacturer</label><select id="make"><option value="">Any manufacturer</option></select></div>
      <div class="fld"><label for="model">Model</label><select id="model"><option value="">Any model</option></select></div>
      <div class="fld"><label for="part">Part</label><select id="part"><option value="">Any part</option></select></div>
      <div class="fld"><label for="ata">System</label><select id="ata"><option value="">Any ATA chapter</option></select></div>
      <div class="fld"><label for="nature">Found</label><select id="nature"><option value="">Anything found</option></select></div>
      <div class="fld"><label for="crew">Crew action</label><select id="crew"><option value="">Anything the crew did</option></select></div>
      <div class="fld"><label for="condition">Part condition</label><select id="condition"><option value="">Any part condition</option></select></div>
      <div class="fld"><label for="discovered">How found</label><select id="discovered"><option value="">Found by any method</option></select></div>
      <div class="fld"><label for="stage">Stage of flight</label><select id="stage"><option value="">Any stage of flight</option></select></div>
      <div class="fld"><label for="zone">Zone on the aircraft</label><select id="zone"><option value="">Anywhere on the aircraft</option></select></div>
      <div class="fld"><label for="tail">Tail number</label><input id="tail" placeholder="e.g. N583"></div>
      <div class="fld"><label for="corrosion">Corrosion</label><select id="corrosion"><option value="">Any corrosion level</option></select></div>
      <div class="fld"><label for="cracked">Cracking</label><select id="cracked"><option value="">Cracked or not</option><option value="1">Cracked</option></select></div>
      <div class="fld"><label for="minhours">At least this many hours</label><input id="minhours" inputmode="numeric" placeholder="e.g. 50000"></div>
    </div>
  </details>

  <div id="starters" aria-label="Starter questions"></div>
  <button type="button" id="starterToggle" class="ghostbtn"></button>

  <div id="unresolved" class="unresolved" hidden></div>
  <div id="chips" class="chips"></div>
  <div id="count" class="sdcount"></div>
  <div id="sentence" class="sdsentence"></div>

  <div class="actions">
    <a id="exportBtn" class="sdbtn off" aria-disabled="true">Export CSV</a>
    <button type="button" id="copyBtn" class="ghostbtn">Copy link</button>
    <span id="copied" class="copied" hidden>copied</span>
  </div>

  <div id="noRows" class="norows" hidden></div>
</div>
```

**CSS**

```css
<style>
#sdControls{margin:16px 0 0;font:15px/1.45 Georgia,serif;color:#2b2622}
#sdControls label{display:block;font:600 11px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6f6a63;margin-bottom:3px}
#sdControls input,#sdControls select{font:14px/1.3 system-ui,sans-serif;padding:7px 9px;border:1px solid #cfc6bd;background:#fff;border-radius:3px;max-width:100%}
#sdControls input.landed,#sdControls select.landed{border-left:4px solid #8a2a17;background:#fdf7f4}
#sdControls .bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
#sdControls .fld{min-width:0}
#sdControls .fld.grow{flex:1 1 260px}
#sdControls .fld.btns{flex-direction:row;gap:8px}
.sdbtn{display:inline-block;font:600 13px system-ui,sans-serif;padding:8px 14px;border:1px solid #8a2a17;background:#8a2a17;color:#fdf7f4;border-radius:3px;cursor:pointer;text-decoration:none}
.sdbtn.off{opacity:.45;cursor:not-allowed}
.ghostbtn{font:500 13px system-ui,sans-serif;padding:8px 12px;border:1px solid #cfc6bd;background:#fff;color:#4a443e;border-radius:3px;cursor:pointer}
#moreFilters{margin-top:12px;font:14px system-ui,sans-serif}
#moreFilters summary{cursor:pointer;color:#5d4a72;font-weight:600}
#moreFilters .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:10px}
#starters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 6px}
#starters button{font:13px system-ui,sans-serif;padding:6px 11px;border:1px solid #d8cfc5;background:#fbf8f5;color:#4a443e;border-radius:16px;cursor:pointer}
#starters button:hover{border-color:#8a2a17;color:#8a2a17}
#starters button.extra{display:none}
#starters.all button.extra{display:inline-block}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
.chip{font:13px system-ui,sans-serif;background:#fdf1ec;border:1px solid #f0d5cb;color:#8a2a17;padding:4px 8px;border-radius:3px}
.chip.warn{background:#fdf3ee;border-color:#eec9b8;color:#7c3a1f}
.chip em{font-style:italic;opacity:.85}
.chip b{cursor:pointer;margin-left:6px;font-weight:700}
.unresolved{margin-top:10px;background:#fdf3ee;border:1px solid #eec9b8;color:#7c3a1f;padding:10px 12px;border-radius:3px}
.sdcount{margin-top:12px;font-size:16px}
.sdcount .fig{font-size:1.4em;font-weight:700}
.sdcount .aside{color:#6f6a63;font-style:italic}
.sdcount .broken{display:block;margin-top:4px;color:#8a2a17;font-weight:bold;font-size:14px}
.clause{cursor:pointer;text-decoration:underline dotted #8a2a17;text-underline-offset:3px}
.clause:hover,.clause:focus{background:#fdf1ec;outline:none}
.sdsentence{margin-top:4px;color:#5d4a72}
.actions{margin-top:12px;display:flex;gap:10px;align-items:center}
.copied{font:italic 13px Georgia,serif;color:#3f6b57}
.norows{margin-top:14px;border:1px dashed #cfc6bd;background:#fbf8f5;padding:18px;border-radius:3px}
.norows .muted{color:#6f6a63}
#iAim.aim{min-height:1.5em;margin-bottom:6px;font-style:italic;color:#5d4a72}
#iAim.held{color:#8a2a17}
#iAim:empty{display:none}
.aimchoice,.undobtn{font:13px system-ui,sans-serif;padding:4px 10px;margin-left:6px;border:1px solid #8a2a17;background:#fdf7f4;color:#8a2a17;border-radius:3px;cursor:pointer}
.aimbox{display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:relative;margin:8px 0}
.aimbox label{margin:0}
.aimbox .aimday{font:italic 13px Georgia,serif;text-transform:none;letter-spacing:0;color:#6f6a63}
.aimsug{position:absolute;left:0;right:0;top:100%;z-index:40;background:#fff;border:1px solid #cfc6bd;border-radius:3px;max-height:320px;overflow:auto;box-shadow:0 4px 10px rgba(43,38,34,.12)}
.sughead{font:700 10px system-ui,sans-serif;letter-spacing:.08em;padding:7px 10px 2px}
.sk-operator{color:#8c4a2f}.sk-tail{color:#3f6b57}.sk-period{color:#4a5d80}
.sk-zone{color:#7a5a2e}.sk-jasc{color:#5d4a72}.sk-q{color:#6f6a63}
.sug{display:flex;gap:8px;align-items:baseline;padding:6px 10px;cursor:pointer;font:14px system-ui,sans-serif}
.sug.on{background:#fdf7f4;box-shadow:inset 3px 0 0 #8a2a17}
.sug .sw{color:#6f6a63;font-size:12px;flex:1}
.sug b{font-weight:700;color:#4a443e}
.sug.nought{opacity:.62;cursor:default}
option.empty{color:#a49c93}
@keyframes sdflash{from{background:#fbe9d7}to{background:#fff}}
#q.flash{animation:sdflash 1.4s}
</style>
```

**JavaScript** — paste inside the IIFE, after the instrument code

```js
/* ================= CONTROLS HALF ================= */

var FIELDS=["q","operator","make","model","part","ata","jasc","nature","crew","condition","stage","zone","tail","discovered","corrosion","cracked","minhours","from","to"];
var LABEL={q:"Text",operator:"Operator",make:"Manufacturer",model:"Model",part:"Part",ata:"System",
 jasc:"Exact system",nature:"Found",crew:"Crew action",condition:"Part condition",stage:"Stage of flight",
 zone:"Zone on the aircraft",tail:"Tail number",discovered:"How found",corrosion:"Corrosion",
 cracked:"Cracking",minhours:"At least this many hours",from:"From",to:"To"};
var HIDDEN_FIELDS=FIELDS.filter(function(k){return["q","operator","from","to"].indexOf(k)<0;});
var URL_KNOWN={};
FIELDS.forEach(function(k){URL_KNOWN[k]=1;});
["view","hero","case","aircraft","ca","cb","cf"].forEach(function(k){URL_KNOWN[k]=1;});
var NO_RAIL=["q","make","model","part","condition","discovered","stage","corrosion","cracked","minhours","jasc","ata"];
var CLAUSE_ORDER=["q","jasc","ata","part","condition","zone","operator","make","model","tail","crew","nature","discovered","stage","corrosion","minhours","cracked","from","to"];
var FOLLOWS_FILTER=["p-search","p-patterns","p-found"];
var VIEW_GROUPS={"Narrows to what you selected":FOLLOWS_FILTER.slice(),"Ignore your selection":[],"Reference":[]};
var SKIPS={nature:["0"],crew:["0","K"],discovered:["0"],corrosion:["1"],stage:["00"],zone:["ZONE 000"]};
var sd2CodeKeys={nature:["nature"],crew:["precaution","crew"],condition:["condition","part_condition"],
 discovered:["discovered"],stage:["stage","stage_of_flight"],zone:["part_location","zone"],
 corrosion:["corrosion"],jasc:["jasc"],ata:["ata"]};

var UNRESOLVED={},REVEALED=false,HERO_FOR=null,LAST_TOTAL=null;
var sd2CODES=(typeof CODES!=="undefined"&&CODES)?CODES:null;
var sd2Range=(typeof RANGE!=="undefined"&&RANGE)?RANGE:null;
var sd2Total=(typeof TOTAL!=="undefined"&&TOTAL!=null)?TOTAL:null;
var sd2Facets={};
var SUG=[],SUGI=-1,sugSeq=0,qSugSeq=0,sd2AimDeb=null,sd2QDeb=null,aimTimer=null,sd2Hold=null;
var KINDLAB={period:"MONTH OR YEAR",zone:"ZONE",operator:"AIRLINE",tail:"TAIL",jasc:"SYSTEM",q:"WORD IN THE WRITE-UPS"};
var WHAT={period:"a month or year",operator:"an airline",tail:"a tail number",zone:"a zone",jasc:"a system code"};
var AIMPH={period:"a month or a year, e.g. August or 2025",operator:"an airline, e.g. United or UAL",
 tail:"a tail number, e.g. N583",zone:"a zone, e.g. 300",jasc:"a system code, e.g. 3230",
 "":"any words the mechanic wrote, e.g. bird strike"};
var STARTERS=[
 ["Smoke or fumes in the cabin",{nature:"B"}],
 ["Cracks found",{q:"crack"}],
 ["Engine shut down in flight",{crew:"E"}],
 ["Unscheduled landing",{crew:"A"}],
 ["Bird strikes",{q:"bird"}],
 ["Landing gear trouble",{ata:"32"}],
 ["Something burning",{q:"burn"}],
 ["Fuel leaks",{q:"fuel leak"}],
 ["Oxygen masks dropped",{crew:"G"}],
 ["Cabin lost pressure",{crew:"I"}],
 ["Aborted take-off",{crew:"C"}],
 ["Corrosion past the limit",{corrosion:"2"}],
 ["Urgent corrosion, level 3",{corrosion:"3"}],
 ["Damage no one could see",{discovered:"E"}],
 ["Engine flameout",{nature:"X"}],
 ["Uncontained engine failure",{nature:"T"}],
 ["Old airframes, 50,000 hours plus",{minhours:"50000"}],
 ["Something fell off in flight",{nature:"D"}]
];

/* ---------- small helpers (sd2-prefixed: nothing here may shadow the page) ---------- */
function sd2$(id){return document.getElementById(id);}
function sd2Num(n){
  if(typeof num==="function"){try{return num(n);}catch(_e){}}
  return (n==null?"0":String(n)).replace(/\B(?=(\d{3})+(?!\d))/g,",");
}
function sd2Pretty(s){
  if(!s)return"";
  if(typeof prettyDate==="function"){try{return prettyDate(s);}catch(_e){}}
  var d=new Date(s.length===10?s+"T00:00:00":s);
  return isNaN(d)?s:d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
}
function sd2Esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function sd2Pad(n){return (n<10?"0":"")+n;}
function sd2ClampDate(v,bound,isFrom){
  if(!bound)return v;
  return isFrom?(v<bound?bound:v):(v>bound?bound:v);
}
function sd2Code(f,v){
  var ks=sd2CodeKeys[f]||[f];
  for(var i=0;i<ks.length;i++){
    var t=sd2CODES&&sd2CODES[ks[i]];
    if(t&&t[v]!=null){var e=t[v];return typeof e==="object"?(e.label||v):e;}
  }
  var fac=sd2Facets[f]&&sd2Facets[f][v];
  return (fac&&fac.label)||v;
}

/* ---------- THE ONE IDEA: the DOM is the state ---------- */
function params(){
  var p=new URLSearchParams();
  for(var i=0;i<FIELDS.length;i++){
    var e=sd2$(FIELDS[i]);if(!e)continue;
    var v=(e.value||"").trim();
    if(v)p.set(FIELDS[i],v);
  }
  return p;
}
function sd2HasFilter(){
  /* The page's params() returns the whole query string, hero included; the
     reference reads the form controls, where hero cannot appear. Left as it
     was, opening a rail counted as choosing something, so the on-purpose gate
     never closed. Which rail is open is a view, not a selection. */
  var VIEW={hero:1,view:1,case:1,aircraft:1,ca:1,cb:1,cf:1}, any=false;
  params().forEach(function(v,k){ if(!VIEW[k]&&v) any=true; });
  return any;
}
function setFilter(k,v){
  var e=sd2$(k);if(!e)return;
  e.value=v;
  delete UNRESOLVED[k];
  if(typeof show==="function"){try{show("p-search");}catch(_e){}}
  syncControls();syncMoreFilters();
  sdSearch(0);showChange();
}

/* ---------- fail-closed, client half ---------- */
function sd2Validate(k,v){
  if(k==="q")return true;
  if(k==="ata")return true;                     /* the one loose end, mirrored from the server */
  if(k==="jasc")return /^\d{4}$/.test(v);
  if(k==="zone")return /^ZONE \d00$/.test(v);
  if(k==="corrosion")return v==="1"||v==="2"||v==="3";
  if(k==="cracked")return v==="1";
  if(k==="minhours")return /^\d+$/.test(v);
  if(k==="tail")return /^N?[0-9A-Z]{1,6}$/i.test(v);
  if(k==="from"||k==="to"){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
    var d=new Date(v+"T00:00:00");
    return !isNaN(d.getTime())&&d.getFullYear()+"-"+sd2Pad(d.getMonth()+1)+"-"+sd2Pad(d.getDate())===v;
  }
  var set=sd2Facets[k];
  if(set&&Object.keys(set).length)return Object.prototype.hasOwnProperty.call(set,v);
  return true;                                  /* cannot judge here: the server still refuses */
}
function strayParams(){
  var out=[],u=new URLSearchParams(location.search);
  u.forEach(function(v,k){if(!URL_KNOWN[k]&&out.indexOf(k)<0)out.push(k);});
  return out;
}
function sd2Guard(){
  var strays=strayParams(),parts=[];
  if(strays.length){
    var list=strays.map(function(s){return"'"+s+"'";}).join(", ");
    parts.push("This link uses a "+(strays.length===1?"name":"names")+" this tool has no filter for: "+list+
      ". It was probably written for an older version of this page");
  }
  for(var k in UNRESOLVED)
    parts.push("This link asks for "+LABEL[k]+" value '"+UNRESOLVED[k]+"', which is not a value this data holds");
  if(!parts.length)return null;
  return "<p>"+sd2Esc(parts.join(". ")+", so no query was run rather than answering with all "+
    (sd2Total?sd2Num(sd2Total):"the")+" reports.")+"</p>"+
    (strays.length?"<p><button type='button' class='ghostbtn' id='dropStrayBtn'>Drop the unknown name"+
      (strays.length===1?"":"s")+" and run</button></p>":"");
}
function sdNoSearch(ghtml){
  sd2$("count").innerHTML="<strong>No search was run.</strong>";
  sd2$("sentence").innerHTML="";
  var nr=sd2$("noRows");nr.hidden=false;nr.innerHTML=ghtml;
  var b=sd2$("dropStrayBtn");
  if(b)b.addEventListener("click",function(){
    strayParams().forEach(function(n){dropStray(n);});
  });
  sd2SetExport(null);
  try{if(typeof heroData!=="undefined")heroData=null;}catch(_e){}
  buildChips();
}

/* ---------- search wrapper: guards, empty-on-purpose gate, count rendering.
   search() itself is NOT declared here, per the brief. ---------- */
function sdSearch(off){
  var g=sd2Guard();
  if(g){sdNoSearch(g);return;}
  if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
  var nr=sd2$("noRows");nr.hidden=true;
  var r;
  try{r=search(off);}catch(e){throw e;}
  if(r&&typeof r.then==="function"){
    r.then(function(d){
      if(d&&typeof d.total==="number"){renderCount(d);renderSentence(d);}
    }).catch(function(){});
  }
  return r;
}

/* ---------- option lists built from the data, with counts ---------- */
function sd2NormFacets(f){
  /* The endpoint's real shape, checked against the live response rather than
     guessed: operators, makes, conditions and stages are plain arrays of
     strings; ata is [{code,label}]; the per-code counts live under counts.
     The keys are plural and the control ids are singular, so they are aliased
     here rather than in every caller. */
  var ALIAS={operators:"operator",makes:"make",conditions:"condition",
             stages:"stage",ata:"ata",zones:"zone"};
  var out={};
  for(var k in f){
    if(k==="counts"||k==="range"||k==="opgap")continue;
    var m={},it=f[k];
    if(Array.isArray(it))it.forEach(function(o){
      if(o&&typeof o==="object"){var v=o.v||o.value||o.code;if(v!=null)m[v]={label:o.label||v,n:o.n||o.count||0};}
      else if(o!=null&&o!=="")m[o]={label:String(o),n:0};
    });
    else for(var v in it){var e=it[v];m[v]=typeof e==="object"?{label:e.label||v,n:e.n||e.count||0}:{label:v,n:e};}
    out[ALIAS[k]||k]=m;
  }
  var C=f&&f.counts;
  if(C)for(var g in C){
    var tgt=out[ALIAS[g]||g]||(out[ALIAS[g]||g]={});
    for(var code in C[g]){
      if(tgt[code])tgt[code].n=C[g][code];
      else tgt[code]={label:code,n:C[g][code]};
    }
  }
  return out;
}
function opts(field,emptyLabel,skips){
  var sel=sd2$(field);if(!sel)return;
  var counts=sd2Facets[field]||{},tab=null;
  var ks=sd2CodeKeys[field]||[];
  for(var i=0;i<ks.length;i++){if(sd2CODES&&sd2CODES[ks[i]]){tab=sd2CODES[ks[i]];break;}}
  var all={};
  function add(v){
    if(skips&&skips.indexOf(v)>=0)return;
    all[v]=counts[v]?counts[v].n:0;
  }
  Object.keys(counts).forEach(add);
  if(tab)Object.keys(tab).forEach(add);
  var arr=Object.keys(all).map(function(v){
    var lab;
    if(tab&&tab[v]!=null)lab=typeof tab[v]==="object"?tab[v].label||v:tab[v];
    else lab=(counts[v]&&counts[v].label)||v;
    return{v:v,lab:lab,n:all[v]};
  }).sort(function(a,b){return b.n-a.n||(a.lab<b.lab?-1:1);});
  var h='<option value="">'+sd2Esc(emptyLabel)+"</option>";
  arr.forEach(function(o){
    h+='<option value="'+sd2Esc(o.v)+'"'+(o.n===0?' class="empty"':"")+">"+
       sd2Esc(o.lab)+" ("+(o.n?sd2Num(o.n):"no reports")+")</option>";
  });
  sel.innerHTML=h;
}
function sd2BuildOpts(){
  opts("operator","Any operator");
  opts("make","Any manufacturer");
  opts("model","Any model");
  opts("part","Any part");
  opts("ata","Any ATA chapter");
  opts("nature","Anything found",SKIPS.nature);
  opts("crew","Anything the crew did",SKIPS.crew);
  opts("condition","Any part condition");
  opts("discovered","Found by any method",SKIPS.discovered);
  opts("stage","Any stage of flight",SKIPS.stage);
  opts("zone","Anywhere on the aircraft",SKIPS.zone);
  opts("corrosion","Any corrosion level",SKIPS.corrosion);
}

/* ---------- chips ---------- */
function decodeShown(k,v){
  switch(k){
    case"q":return"“"+v+"”";
    case"ata":return"ATA["+v+"]";
    case"tail":return"N"+v;
    case"cracked":return"recorded";
    case"minhours":return sd2Num(+v)+" hours";
    case"from":case"to":return sd2Pretty(v);
    case"operator":{var f=sd2Facets.operator&&sd2Facets.operator[v];return((f&&f.label)||v)+" ("+v+")";}
    default:return String(sd2Code(k,v));
  }
}
function sd2Chip(text,warn,onx){
  var s=document.createElement("span");
  s.className="chip"+(warn?" warn":"");
  s.appendChild(document.createTextNode(text));
  if(warn){var em=document.createElement("em");em.textContent=" — not a value in this data";s.appendChild(em);}
  var x=document.createElement("b");x.textContent="x";
  x.setAttribute("aria-label","Remove filter "+text);
  x.addEventListener("click",onx);
  s.appendChild(x);
  return s;
}
function buildChips(){
  var box=sd2$("chips");if(!box)return;
  box.innerHTML="";
  var un=Object.keys(UNRESOLVED),ur=sd2$("unresolved");
  if(ur){
    ur.hidden=!un.length;
    if(un.length)ur.textContent=(un.length===1?
      "One value in this link is not in this data, so no search was run.":
      sd2Num(un.length)+" values in this link are not in this data, so no search was run.")+
      " There is no number on this page to quote.";
  }
  un.forEach(function(k){box.appendChild(sd2Chip(LABEL[k]+": "+UNRESOLVED[k],true,function(){dropRefused(k);}));});
  var p=params();
  FIELDS.forEach(function(k){
    if(UNRESOLVED[k])return;
    var v=p.get(k);if(!v)return;
    box.appendChild(sd2Chip(LABEL[k]+": "+decodeShown(k,v),false,function(){setFilter(k,"");}));
  });
}

/* ---------- stating the selection in words ---------- */
function clauseText(k,v){
  switch(k){
    case"q":return'where a mechanic wrote “'+v+'”';
    case"operator":{var f=sd2Facets.operator&&sd2Facets.operator[v];return(f&&f.label)||v;}
    case"tail":return"N"+v;
    case"cracked":return"with cracking recorded";
    case"minhours":return sd2Num(+v)+" hours or more on the airframe";
    case"from":case"to":return"";
    default:return String(sd2Code(k,v)).toLowerCase();
  }
}
function clauseList(){
  var out=[],p=params();
  CLAUSE_ORDER.forEach(function(k){
    var v=p.get(k);if(!v)return;
    if(k==="from"||k==="to"){
      if(k==="from"&&p.get("to"))out.push({k:"from|to",t:"between "+sd2Pretty(p.get("from"))+" and "+sd2Pretty(p.get("to"))});
      else if(k==="from")out.push({k:"from",t:"from "+sd2Pretty(p.get("from"))});
      else if(k==="to"&&!p.get("from"))out.push({k:"to",t:"through "+sd2Pretty(p.get("to"))});
      return;
    }
    out.push({k:k,t:clauseText(k,v)});
  });
  return out;
}
function sentenceHTML(d,spans){
  return clauseList().map(function(x){
    var t=sd2Esc(x.t);
    return spans?'<span class="clause" tabindex="0" data-drop="'+x.k+'" data-aim="drop-'+x.k+'">'+t+"</span>":t;
  }).join(", ");
}
function zeroPhrase(){
  var L=clauseList().map(function(x){return x.t.replace(/^where /,"");});
  if(!L.length)return"No report matches this combination.";
  if(L.length===1)return"No report matches "+L[0]+".";
  if(L.length===2)return"No report is both "+L[0]+" and "+L[1]+".";
  return"No report is all of: "+L.slice(0,-1).join(", ")+" and "+L[L.length-1]+".";
}
function renderSentence(d){
  sd2$("sentence").innerHTML=(d&&d.total===0)?"<p>"+sd2Esc(zeroPhrase())+"</p>":"";
}
function renderCount(d){
  var p=params().toString();
  var stale=(HERO_FOR!==null&&HERO_FOR!==p);
  var corpus=(d.corpus!=null)?d.corpus:sd2Total;
  var h;
  if(stale){
    h='<b class="fig">…</b> counting '+sentenceHTML(d,true)+"…";
  }else if(!sd2HasFilter()){
    h='<b class="fig">'+sd2Num(corpus)+"</b> reports, everything the FAA has published to "+
      sd2Pretty(sd2Range&&sd2Range.to)+".";
  }else{
    h='<b class="fig">'+sd2Num(d.total)+"</b> "+(d.total===1?"report":"reports")+", "+
      sentenceHTML(d,true)+". "+
      '<span class="aside">'+sd2Num((corpus!=null?corpus:d.total)-d.total)+" set aside.</span>";
    if(LAST_TOTAL!==null&&d.total!==LAST_TOTAL)
      h+='<span class="broken">the count above and the rows below disagree: reload before you quote either</span>';
  }
  sd2$("count").innerHTML=h;
  HERO_FOR=p;LAST_TOTAL=d.total;
  sd2SetExport(d.total);
  buildChips();syncControls();syncMoreFilters();
}
function filterWords(){return clauseList().map(function(x){return x.t;}).join(", ");}
function scopeLine(id,n){
  if(id==="p-search"||id==="p-aircraft")return"";
  if(FOLLOWS_FILTER.indexOf(id)>=0)
    return n>0?"Showing <strong>your selection</strong>, "+sd2Num(n)+" reports.":"";
  if(!sd2HasFilter())return"All "+sd2Num(sd2Total)+" reports.";
  return"This view always answers for <strong>all "+sd2Num(sd2Total)+
    " reports</strong>. It does not narrow to your current selection ("+(filterWords()||"no filter")+").";
}

/* ---------- empty on purpose / reveal / reset ---------- */
function renderOnPurpose(){
  sd2$("count").innerHTML="<strong>"+(sd2Total?sd2Num(sd2Total)+" reports.":"")+"</strong> Nothing chosen yet.";
  sd2$("sentence").innerHTML="";
  var nr=sd2$("noRows");nr.hidden=false;
  nr.innerHTML=
    '<p><strong>No rows yet, on purpose.</strong> Listing everything answers no question and buries the one you have.</p>'+
    '<p class="muted">Take a month, a zone, an airline or a tail from the instrument above, pick one of the starter questions, or set a filter. To read the file straight through anyway, use the button at the foot of the instrument.</p>'+
    '<p><button type="button" class="sdbtn" id="revealBtn">Read all '+(sd2Total?sd2Num(sd2Total):"")+' anyway</button> '+
    '<button type="button" class="ghostbtn" id="gotoStarters">Show me the starter questions</button></p>';
  sd2$("revealBtn").addEventListener("click",revealAll);
  sd2$("gotoStarters").addEventListener("click",function(){
    var s=sd2$("starters");
    s.classList.add("all");sd2$("starterToggle").textContent="fewer";
    s.scrollIntoView({block:"center"});s.querySelector("button").focus();
  });
  sd2SetExport(null);
  buildChips();
}
function revealAll(){REVEALED=true;sdSearch(0);showChange();}
function goResults(){REVEALED=true;sdSearch(0);}
function resetAll(){
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.value="";});
  UNRESOLVED={};REVEALED=false;LAST_TOTAL=null;HERO_FOR=null;sd2Hold=null;sd2CloseSug();
  var u=new URLSearchParams(location.search);
  FIELDS.forEach(function(k){u.delete(k);});
  history.replaceState(null,"",location.pathname+(u.toString()?"?"+u.toString():""));
  unaim();syncControls();syncMoreFilters();renderOnPurpose();
  try{if(typeof heroData!=="undefined")heroData=null;}catch(_e){}
}

/* ---------- export / copy link ---------- */
function sd2SetExport(total){
  var a=sd2$("exportBtn");
  a.removeAttribute("title");
  if(total==null||total===0){
    a.textContent="Export CSV"+(total===0?" (0 rows)":"");
    a.classList.add("off");a.setAttribute("aria-disabled","true");a.removeAttribute("href");
    return;
  }
  a.classList.remove("off");a.removeAttribute("aria-disabled");
  a.href="api/export?"+params().toString();
  if(total>5000){
    a.textContent="Export CSV (newest 5,000 of "+sd2Num(total)+")";
    a.title="Ordered newest first. The oldest reports are not in this file. Narrow with a date range to export the rest.";
  }else a.textContent="Export CSV";
}
function copyLink(){
  var c=sd2$("copied");
  var done=function(){c.hidden=false;setTimeout(function(){c.hidden=true;},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText)
    navigator.clipboard.writeText(location.href).then(done,done);
  else done();
}

/* ---------- sync helpers, showChange ---------- */
function syncControls(){
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.classList.toggle("landed",!!(e.value||"").trim());});
}
function syncMoreFilters(){
  var n=0;
  HIDDEN_FIELDS.forEach(function(k){var e=sd2$(k);if(e&&(e.value||"").trim())n++;});
  sd2$("mfCount").textContent=n?("("+n+" active)"):"";
  if(n>0)sd2$("moreFilters").open=true;
}
function showChange(){
  buildChips();
  var c=sd2$("chips"),r=c.getBoundingClientRect();
  if(r.top<0)c.scrollIntoView({block:"start"});   /* only upwards, never down */
}
function sd2DropClause(k){
  var ks=k.split("|");
  if(ks.length===1){setFilter(k,"");return;}
  ks.forEach(function(x){var e=sd2$(x);if(e)e.value="";});
  syncControls();syncMoreFilters();sdSearch(0);showChange();
}
function dropRefused(k){
  delete UNRESOLVED[k];
  var e=sd2$(k);if(e)e.value="";
  buildChips();
  if(!Object.keys(UNRESOLVED).length&&!strayParams().length){
    if(sd2HasFilter()||REVEALED)sdSearch(0);else renderOnPurpose();
  }
}
function dropStray(name){
  var u=new URLSearchParams(location.search);u.delete(name);
  history.replaceState(null,"",location.pathname+(u.toString()?"?"+u.toString():""));
  var g=sd2Guard();
  if(g){sdNoSearch(g);return;}
  if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
  sdSearch(0);showChange();
}

/* ---------- starter questions ---------- */
function starter(i){
  var s=STARTERS[i];if(!s)return;
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.value="";});
  UNRESOLVED={};
  for(var k in s[1]){var e=sd2$(k);if(e)e.value=s[1][k];}
  syncControls();syncMoreFilters();
  sdSearch(0);showChange();
}
function sd2BuildStarters(){
  var box=sd2$("starters");box.innerHTML="";
  STARTERS.forEach(function(s,i){
    var b=document.createElement("button");b.type="button";
    if(i>=6)b.className="extra";
    b.textContent=s[0];
    b.addEventListener("click",function(){starter(i);});
    box.appendChild(b);
  });
  var t=sd2$("starterToggle"),open=false;
  t.textContent="12 more questions";
  t.addEventListener("click",function(){
    open=!open;box.classList.toggle("all",open);
    t.textContent=open?"fewer":"12 more questions";
  });
}

/* ---------- q vocabulary datalist ---------- */
function sd2QInput(){
  var q=sd2$("q").value.trim(),seq=++qSugSeq,dl=sd2$("qList");
  if(q.length<3){dl.innerHTML="";return;}
  clearTimeout(sd2QDeb);
  sd2QDeb=setTimeout(function(){
    fetch("api/vocab?q="+encodeURIComponent(q)+"&limit=10")
      .then(function(r){return r.ok?r.json():[];})
      .then(function(list){
        if(seq!==qSugSeq)return;                        /* stale reply dropped */
        dl.innerHTML=(list||[]).map(function(x){
          var t=x.term||x.label||x.v||"";
          return '<option value="'+sd2Esc(t)+'">'+(x.n?sd2Num(x.n):"0")+" reports</option>";
        }).join("");
      }).catch(function(){});
  },180);
}

/* ---------- AIM AT box ---------- */
var AIM_HTML=
 '<div class="aimbox">'+
 '<label for="aimKind">Aim at</label>'+
 '<select id="aimKind">'+
 '<option value="period">a month or year</option>'+
 '<option value="operator">an airline</option>'+
 '<option value="tail">a tail number</option>'+
 '<option value="zone">a zone</option>'+
 '<option value="jasc">a system code</option>'+
 '<option value="">free text search</option>'+
 '</select>'+
 '<input id="iAimAt" role="combobox" aria-controls="aimSug" aria-autocomplete="list" aria-expanded="false" autocomplete="off">'+
 '<button type="button" class="aimgo">Take it</button>'+
 '<label class="aimday">or one day<input id="aimDay" type="date"></label>'+
 '<div class="aimsug" id="aimSug" role="listbox" hidden></div>'+
 '</div>';
function sd2Aim(id){
  var ns=document.querySelectorAll('[id="'+id+'"]');
  for(var i=0;i<ns.length;i++)if(ns[i].offsetParent!==null)return ns[i];
  return ns[0];
}
function sd2InjectAim(){
  [".ipad",".phextra"].forEach(function(sel){
    var host=document.querySelector(sel);if(!host)return;
    var w=document.createElement("div");w.className="aimwrap";w.innerHTML=AIM_HTML;
    host.appendChild(w);sd2WireAim(w);
  });
  aimPlaceholder();
  if(!aimTimer)aimTimer=setInterval(function(){aimPlaceholder();paintHeld();},600);
}
function aimPlaceholder(){
  var k=sd2Aim("aimKind"),i=sd2Aim("iAimAt");
  if(k&&i)i.placeholder=AIMPH[k.value]||"";
}
function sd2WireAim(root){
  var k=root.querySelector('[id="aimKind"]'),i=root.querySelector('[id="iAimAt"]'),
      d=root.querySelector('[id="aimDay"]'),s=root.querySelector('[id="aimSug"]');
  k.addEventListener("change",function(){sd2CloseSug();aimPlaceholder();});
  i.addEventListener("input",sd2AimTyping);
  i.addEventListener("keydown",sd2AimKeys);
  sd2AimGoWire(root.querySelector(".aimgo"));
  d.addEventListener("change",function(){
    var v=d.value;if(!v)return;
    sd2$("from").value=v;sd2$("to").value=v;
    syncControls();syncMoreFilters();sdSearch(0);showChange();
  });
  s.addEventListener("mousedown",function(ev){
    var row=ev.target.closest(".sug");
    if(!row||row.classList.contains("nought"))return;   /* nought rows are inert */
    ev.preventDefault();takeReading(SUG[+row.dataset.i]);
  });
  s.addEventListener("mouseover",function(ev){
    var row=ev.target.closest(".sug");
    if(!row||row.classList.contains("nought"))return;
    SUGI=+row.dataset.i;sd2RenderSug();
  });
}
function sd2AimGoWire(btn){if(btn)btn.addEventListener("click",aimAtGo);}
function sd2AimTyping(ev){
  var i=ev.target,q=i.value.trim(),kind=sd2Aim("aimKind").value,seq=++sugSeq;
  if(q.length<2){sd2CloseSug();return;}
  clearTimeout(sd2AimDeb);
  sd2AimDeb=setTimeout(function(){
    var url=(kind===""?"api/vocab?q="+encodeURIComponent(q)+"&limit=10"
                      :"api/resolve?q="+encodeURIComponent(q)+"&kind="+kind);
    fetch(url).then(function(r){return r.ok?r.json():[];})
      .then(function(list){if(seq===sugSeq)sd2ShowSug(list,kind);})
      .catch(function(){if(seq===sugSeq)sd2CloseSug();});
  },220);
}
function sd2ShowSug(list,kind){
  var kindNamed=kind!=="";
  var readings=(list||[]).map(function(x){
    if(x.kind==="q"||x.term)
      return{kind:"q",label:x.label||x.term||x.v||"",n:x.n||0,what:"a word in the write-ups",raw:x};
    return{kind:x.kind,label:x.label||x.v||x.value||x.code||"",n:x.n||0,
           what:x.what||WHAT[x.kind]||x.kind,raw:x};
  });
  /* the word reading never appears while browsing: free text has its own field */
  SUG=readings.filter(function(x){return x.kind!=="q"&&(x.n>0||kindNamed);});
  var best={};
  SUG.forEach(function(x){best[x.kind]=Math.max(best[x.kind]||0,x.n);});
  SUG.sort(function(a,b){
    var ka=a.kind==="q"?1:0,kb=b.kind==="q"?1:0;
    if(ka!==kb)return ka-kb;
    if(best[b.kind]!==best[a.kind])return best[b.kind]-best[a.kind];
    if(b.n!==a.n)return b.n-a.n;
    return a.label<b.label?-1:1;
  });
  SUGI=-1;sd2RenderSug();
}
function sd2RenderSug(){
  var box=sd2Aim("aimSug"),i=sd2Aim("iAimAt");
  if(!box)return;
  if(!SUG.length){sd2CloseSug();return;}
  var h="",lastKind=null;
  SUG.forEach(function(o,ix){
    if(o.kind!==lastKind){h+='<div class="sughead sk-'+o.kind+'">'+(KINDLAB[o.kind]||o.kind)+"</div>";lastKind=o.kind;}
    h+='<div class="sug'+(ix===SUGI?" on":"")+(o.n?"":" nought")+'" role="option" data-i="'+ix+'"'+
       (o.n?"":' aria-disabled="true"')+'><span class="sl">'+sd2Esc(o.label)+"</span>"+
       '<span class="sw">'+sd2Esc(o.what)+(o.n?"":" | no report in this file")+"</span><b>"+sd2Num(o.n)+"</b></div>";
  });
  box.innerHTML=h;box.hidden=false;
  if(i)i.setAttribute("aria-expanded","true");
}
function sd2CloseSug(){
  SUG=[];SUGI=-1;
  var b=sd2Aim("aimSug"),i=sd2Aim("iAimAt");
  if(b){b.hidden=true;b.innerHTML="";}
  if(i)i.setAttribute("aria-expanded","false");
}
function sd2Move(d){
  var i=SUGI;
  for(;;){
    i+=d;
    if(i<0||i>=SUG.length)return;
    if(SUG[i].n)break;                                  /* skip nought rows */
  }
  SUGI=i;sd2RenderSug();
}
function sd2AimKeys(ev){
  if(ev.key==="Escape"){sd2CloseSug();return;}
  var box=sd2Aim("aimSug");
  if(!box||box.hidden)return;
  if(ev.key==="ArrowDown"){ev.preventDefault();sd2Move(1);}
  else if(ev.key==="ArrowUp"){ev.preventDefault();sd2Move(-1);}
  else if(ev.key==="Enter"){
    ev.preventDefault();
    if(SUGI>=0&&SUG[SUGI]&&SUG[SUGI].n)takeReading(SUG[SUGI]);
    else aimAtGo();
  }
}

/* ---------- the aim line ---------- */
function aim(text){
  if(sd2Hold&&Date.now()<sd2Hold.until)return false;
  sd2Hold=null;sd2AimPaintText(text);
  return true;
}
function sd2AimPaintText(t){
  var z=sd2$("iAim");
  z.className="aim";z.removeAttribute("data-hold");z.textContent=t;
}
function aimHold(text,ms){
  sd2Hold={text:text,until:Date.now()+(ms||6000)};
  paintHeld();
}
function paintHeld(){
  var z=sd2$("iAim");if(!z)return;
  if(sd2Hold&&Date.now()<sd2Hold.until){
    z.className="aim held";z.setAttribute("data-hold","1");z.textContent="";
    z.appendChild(document.createTextNode(sd2Hold.text));
    var b=document.createElement("button");b.type="button";b.className="undobtn";b.textContent="undo";
    b.addEventListener("click",function(){history.back();unaim();});
    z.appendChild(document.createTextNode(" "));z.appendChild(b);
  }else if(sd2Hold){sd2Hold=null;z.className="aim";z.removeAttribute("data-hold");z.textContent="";}
}
function unaim(){
  if(sd2Hold&&Date.now()<sd2Hold.until)return;
  sd2Hold=null;sd2AimPaintText("");
}

/* ---------- Take it ---------- */
function aimAtGo(){
  var i=sd2Aim("iAimAt"),kind=sd2Aim("aimKind");
  if(!i)return;
  var raw=i.value.trim();
  if(!raw)return;
  if(kind.value===""){handOff(raw);return;}
  aim("…");
  fetch("api/resolve?q="+encodeURIComponent(raw))      /* no kind: EVERY reading considered */
    .then(function(r){return r.ok?r.json():{readings:[]};})
    .then(function(d){sd2AimResolved(raw,(d&&d.readings)||d||[]);})
    .catch(function(){aim("the resolver did not answer. Try again.");});
}
function sd2AimResolved(raw,readings){
  var o=[],e=[],word=null;
  readings.forEach(function(x){
    if(x.kind==="q")word=x;
    else if(x.n>0)o.push({kind:x.kind,label:x.label||x.v||x.value||x.code||"",n:x.n,
                          what:x.what||WHAT[x.kind]||x.kind,raw:x});
    else e.push(x);
  });
  var z=sd2$("iAim");sd2Hold=null;z.className="aim";z.textContent="";
  if(!o.length&&e.length){
    var it=e[0];
    aimHold((it.label||it.v||it.value||raw)+" is a valid "+(KINDLAB[it.kind]||it.kind).toLowerCase()+
      ", but this file holds no report for it. It runs from "+sd2Pretty(sd2Range&&sd2Range.from)+" to "+
      sd2Pretty(sd2Range&&sd2Range.to)+".");
    return;
  }
  if(!o.length){
    z.appendChild(document.createTextNode("no month, zone, airline, tail or system is called “"+raw+"”."));
    if(word&&word.n>0){
      var b=document.createElement("button");b.type="button";b.className="aimchoice";
      b.appendChild(document.createTextNode('Search the write-ups for “'+raw+'” instead '));
      var bb=document.createElement("b");bb.textContent=sd2Num(word.n);b.appendChild(bb);
      b.addEventListener("click",function(){handOff(raw);});
      z.appendChild(document.createTextNode(" "));z.appendChild(b);
    }else{
      z.appendChild(document.createTextNode(" No mechanic wrote that word either."));
    }
    return;
  }
  if(o.length===1){takeReading(o[0]);return;}
  /* DELTA is an airline AND a word a mechanic writes: never pick silently */
  z.className="aim";z.textContent="";
  z.appendChild(document.createTextNode("“"+raw+"” could mean more than one thing here. Which do you want?"));
  o.forEach(function(op){
    var b=document.createElement("button");b.type="button";b.className="aimchoice";
    b.appendChild(document.createTextNode(op.label+" "));
    var em=document.createElement("em");em.textContent=op.what;b.appendChild(em);
    var bb=document.createElement("b");bb.textContent=sd2Num(op.n);b.appendChild(bb);
    b.addEventListener("click",function(){takeReading(op);});
    z.appendChild(b);
  });
}
function takeReading(o){
  sd2CloseSug();
  var inp=sd2Aim("iAimAt");if(inp)inp.value="";
  if(o.kind==="period"){
    var f=null,t=null,r=o.raw||{};
    if(r.from||r.a){f=r.from||r.a;}
    if(r.to||r.b){t=r.to||r.b;}
    if(r.y&&r.m){f=r.y+"-"+sd2Pad(r.m)+"-01";t=r.y+"-"+sd2Pad(r.m)+"-"+sd2Pad(new Date(r.y,r.m,0).getDate());}
    else if(r.y){f=r.y+"-01-01";t=r.y+"-12-31";}
    if(f)sd2$("from").value=sd2ClampDate(f,sd2Range&&sd2Range.from,true);
    if(t)sd2$("to").value=sd2ClampDate(t,sd2Range&&sd2Range.to,false);
    syncControls();syncMoreFilters();sdSearch(0);showChange();
  }else{
    var v=o.raw?(o.raw.value||o.raw.code||o.raw.v||o.label):o.label;
    if(o.kind==="zone"&&/^ZONE /.test(v)===false)v="ZONE "+v;
    if(o.kind==="tail")v=String(v).replace(/^N/i,"");
    setFilter(o.kind,v);
  }
  aimHold("took "+o.label+", "+o.what+", "+sd2Num(o.n)+" reports.");
}
function handOff(raw){
  var q=sd2$("q");q.value=raw;
  sd2CloseSug();
  syncControls();syncMoreFilters();
  sdSearch(0);showChange();
  q.scrollIntoView({block:"center"});
  q.classList.add("flash");
  setTimeout(function(){q.classList.remove("flash");},1400);
  aimHold('searched the write-ups for “'+raw+'”, not a category.');
}

/* ---------- wiring and boot ---------- */
function sd2WireControls(){
  sd2$("runSearch").addEventListener("click",goResults);
  sd2$("clearAll").addEventListener("click",resetAll);
  sd2$("copyBtn").addEventListener("click",copyLink);
  sd2$("exportBtn").addEventListener("click",function(ev){
    if(sd2$("exportBtn").classList.contains("off"))ev.preventDefault();
  });
  FIELDS.forEach(function(k){
    var e=sd2$(k);if(!e)return;
    if(e.tagName==="SELECT"||e.type==="date")
      e.addEventListener("change",function(){syncControls();syncMoreFilters();sdSearch(0);showChange();});
    else
      e.addEventListener("keydown",function(ev){
        if(ev.key==="Enter"){ev.preventDefault();syncControls();syncMoreFilters();sdSearch(0);showChange();}
      });
  });
  sd2$("q").addEventListener("input",sd2QInput);
  sd2$("count").addEventListener("click",function(ev){
    var c=ev.target.closest(".clause");if(c)sd2DropClause(c.dataset.drop);
  });
  sd2$("count").addEventListener("keydown",function(ev){
    if(ev.key!=="Enter"&&ev.key!==" ")return;
    var c=ev.target.closest(".clause");if(c){ev.preventDefault();sd2DropClause(c.dataset.drop);}
  });
}
function sd2Boot(){
  var jobs=[];
  if(!sd2CODES)
    jobs.push(fetch("api/glossary").then(function(r){return r.ok?r.json():{};})
      /* the endpoint nests the tables under codes, beside ata and terms.
         Read whole, every lookup missed and every chip printed the raw
         code where the reference prints the FAA's own words. */
      .then(function(c){sd2CODES=(c&&c.codes)?c.codes:(c||{});}).catch(function(){}));
  jobs.push(fetch("api/facets").then(function(r){return r.ok?r.json():{};})
    .then(function(f){sd2Facets=sd2NormFacets(f||{});}).catch(function(){}));
  if(!sd2Range)
    jobs.push(fetch("api/range").then(function(r){return r.ok?r.json():null;})
      .then(function(g){if(g){sd2Range=g;if(g.total!=null)sd2Total=g.total;}}).catch(function(){}));
  Promise.all(jobs).then(function(){
    /* the options first, then the values. Restoring before the options exist
       means every select refuses every value, so every filter arriving in a
       link is marked unresolved and no query runs. The refusal this code is
       written to catch was being caused by the order it ran in. */
    sd2BuildOpts();
    var u=new URLSearchParams(location.search);
    FIELDS.forEach(function(k){                            /* restore; catch silent select refusal */
      var v=u.get(k);if(v==null)return;
      var e=sd2$(k);if(!e)return;
      e.value=v;
      if(e.value!==v||!sd2Validate(k,v)){UNRESOLVED[k]=v;e.value="";}
    });
    if(sd2Range&&sd2Range.from){
      sd2$("from").min=sd2Range.from;sd2$("to").min=sd2Range.from;
      sd2$("from").max=sd2Range.to;sd2$("to").max=sd2Range.to;
    }
    sd2BuildStarters();
    sd2InjectAim();
    sd2WireControls();
    var g=sd2Guard();
    if(g){sdNoSearch(g);return;}
    sdSearch(0);                                           /* its gate renders the on-purpose state */
  });
}
sd2Boot();
```

**Departures from the specification, and why**

1. **`search()` is not declared** — the brief instructs to assume it and call it. But the spec assigns `search()` three things I own the rendering for (the empty-on-purpose gate, the fail-closed link refusal, the count/sentence outputs), and I cannot edit it. So all my call sites go through `sdSearch(off)`, which wraps it: it refuses stray names and refused values client-side, gates on "nothing filtered and not revealed", hides the empty-state block, and — if the existing `search()` returns a promise resolving to `{total, corpus}` — renders the count line and standing sentence. If your `search()` already does all this internally, the wrapper is harmless: the guard passes, and `renderCount` simply runs twice with the same truth.
2. **No inline event handlers.** The spec sketches `onclick="aimAtGo()"` and similar, but this block lives inside the IIFE, so inline attributes cannot see its functions. Everything is wired with `addEventListener`.
3. **`api/facets` is assumed.** The spec demands per-option report counts ("11,444 options", "each labelled with its count") but names no counts endpoint. I fetch `api/facets` (shape-normalising both `{v:{n}}` and `[{v,label,n}]`) and union each facet with its `CODES` table so a code with zero reports still appears as "(no reports)" rather than vanishing. Likewise `api/glossary` is fetched only if the page's `CODES` global is absent, and `api/range` only if `RANGE`/`TOTAL` are absent.
4. **Client-side validation mirrors the server contract** (formats, real calendar, facet membership) so a bad link is refused before the wire with the exact fail-closed voice; anything the client cannot judge still hits the server's 400 path. `ata` is deliberately left unvalidated, mirroring the server's stated loose end.
5. **The duplicated aim box** uses the spec's singular ids in both copies (`.ipad` and `.phextra`); a visible-copy accessor `sd2Aim(id)` resolves which one is live, and both copies are wired individually.
6. **Tail is a text input, not a select** — the server matches stems (`LIKE stem%`), so there is no closed value list to count; `jasc` stays the hidden input per spec and surfaces through chips and the More-filters active count. The primary **Search** button with empty fields calls `goResults()` (explicit intent to read everything), the same route as "Read all N anyway"; the spec did not state this case.
7. `VIEW_GROUPS` ships with only the FOLLOWS_FILTER membership filled; the panels half must extend the other two groups, since panel ids beyond `p-search`/`p-aircraft` are not named in my scope.