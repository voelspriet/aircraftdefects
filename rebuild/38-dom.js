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

/* ============ sd-globals: the six inline handlers in the record table call
   window.setFilter and window.setHero, which live inside the page's IIFE and
   are invisible to an inline onclick, which resolves against the global scope
   only. Defined here, only when the page has not exported its own, and
   re-checked on every pass so a page export always steps in front.
   setFilter narrows the selection the honest way: every filter on this page
   is a query parameter, the instrument reads them on load and composes the
   standing sentence from them, so the parameter is set and the page applies
   it \u2014 the URL, the sentence and the rows then all agree.
   setHero takes a rail name and opens that rail. ========================== */
function sdSetFilter(field,value){
  try{
    var f=String(field==null?"":field).trim();
    if(!f)return;
    var v=(value==null)?"":String(value).trim();
    var params=new URLSearchParams(location.search);
    if(v==="")params.delete(f);else params.set(f,v);
    var qs=params.toString();
    var target=location.pathname+(qs?"?"+qs:"")+location.hash;
    if(target===location.pathname+location.search+location.hash)return;
    location.href=target;
  }catch(_){}
}
function sdSetHero(name){
  try{
    name=String(name==null?"":name).trim().toLowerCase();
    if(!name)return;
    var rails=document.querySelectorAll(".rail[data-rail]"),i,r=null,nm;
    for(i=0;i<rails.length;i++){
      nm=(rails[i].getAttribute("data-rail")||"").trim().toLowerCase();
      if(nm===name){r=rails[i];break}
    }
    if(!r){
      var cand=byId("rail-"+name)||byId("rail_"+name);
      if(cand&&/\brail\b/.test(cand.className||""))r=cand;
    }
    if(!r)return;
    if(!/\bopen\b/.test(r.className||"")){
      /* give the page's own toggle first crack; headings only, so a stray
         button inside the rail is never fired */
      var tog=r.querySelector(".railhead,.rhead,.rail-hd,.rlabel,summary,h2,h3");
      if(tog){try{tog.click()}catch(_){}}
    }
    if(!/\bopen\b/.test(r.className||""))r.classList.add("open");
    try{r.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){try{r.scrollIntoView()}catch(_){}}
  }catch(_){}
}
function sdEnsureGlobals(){
  if(typeof window.setFilter!=="function")window.setFilter=sdSetFilter;
  if(typeof window.setHero!=="function")window.setHero=sdSetHero;
}
sdEnsureGlobals();

/* ============ sd-recfetch: the case sheet is opened per record and the page
   fetches that record itself; the file's part number field is PartNumber,
   with ComponentPartNumber as the sparse fallback. The response is picked up
   in passing: fetch and XHR are wrapped once, and only a response that looks
   like one record (own PartNumber or ComponentPartNumber field, no records
   array, and not one of the dossier endpoints) is kept, latest one winning,
   because the sheet shows one record at a time. ========================== */
var SX={last:null};
function sdNoteRecord(obj,url){
  try{
    if(!obj||typeof obj!=="object"||Array.isArray(obj))return;
    if(!Object.prototype.hasOwnProperty.call(obj,"PartNumber")&&!Object.prototype.hasOwnProperty.call(obj,"ComponentPartNumber"))return;
    if("records" in obj)return;
    if(url&&/api\/(airframe|repeats|summary|operator|part|export|locate)(\/|\?|$)/i.test(String(url)))return;
    SX.last=obj;
    kick();
  }catch(_){}
}
if(!window.__sdFetchWrapped){
  window.__sdFetchWrapped=true;
  var sdOf=window.fetch;
  if(typeof sdOf==="function"){
    window.fetch=function(){
      var args=arguments,url="";
      try{url=(args[0]&&args[0].url)?String(args[0].url):String(args[0]||"")}catch(_){}
      return sdOf.apply(this,arguments).then(function(res){
        try{
          if(res&&res.ok&&res.clone){
            var sdCl=res.clone();
            sdCl.json().then(function(j){sdNoteRecord(j,url)}).catch(function(){});
          }
        }catch(_){}
        return res;
      });
    };
  }
  try{
    var sdXO=(typeof XMLHttpRequest!=="undefined")&&XMLHttpRequest.prototype;
    if(sdXO&&!sdXO.__sdRecPatched){
      sdXO.__sdRecPatched=true;
      var sdOOpen=sdXO.open,sdOSend=sdXO.send;
      sdXO.open=function(m,u){try{this.__sdUrl=String(u||"")}catch(_){}return sdOOpen.apply(this,arguments)};
      sdXO.send=function(){
        var self=this;
        try{
          self.addEventListener("load",function(){
            try{
              if(self.responseType&&self.responseType!=="text"&&self.responseType!=="")return;
              var ct="";
              try{ct=self.getResponseHeader("content-type")||""}catch(_){}
              if(ct&&!/json/i.test(ct))return;
              sdNoteRecord(JSON.parse(self.responseText),self.__sdUrl);
            }catch(_){}
          });
        }catch(_){}
        return sdOSend.apply(this,arguments);
      };
    }
  }catch(_){}
}

/* ============ sd-pnrow: the case sheet's sixteen rows carry a Part row that
   names the part, but the part number appeared nowhere on the page \u2014 and
   worse, a row once said "not recorded" about a number the file records,
   because the wrong field was read. The record endpoint's field is
   PartNumber ("17039203426" on JR2R20260825350); ComponentPartNumber is the
   fallback and is null on most records. Read PartNumber; fall back to
   ComponentPartNumber only when PartNumber is empty; print "not recorded"
   only when both really are, in the same words the sheet uses for its other
   absent fields, detected from those rows themselves. The row is the way
   into the part dossier. ================================================ */
function sdIsAbsentText(s){
  if(/^(--|\u2013|\u2014|-)$/.test(s))return true;
  if(/^(none|unknown|n\/a|na|not available|not recorded|not given|not reported|not stated|not captured|no entry|missing|absent|unrecorded)\.?$/i.test(s))return true;
  return /^not\s+[a-z][a-z ]{1,24}\.?$/i.test(s);
}
function sdAbsence(table){
  var seen={},best=null,rows=table.rows,i,cells,cell,v;
  for(i=0;i<rows.length;i++){
    cells=rows[i].cells;
    if(!cells||cells.length<2)continue;
    cell=cells[cells.length-1];
    v=cell.textContent.trim();
    if(!v||!sdIsAbsentText(v))continue;
    if(!seen[v])seen[v]={n:0,cls:cell.className||""};
    seen[v].n++;
    if(!best||seen[v].n>seen[best.text].n)best={text:v,cls:seen[v].cls};
  }
  return best;
}
function sdSheetPartRows(){
  var out=[],ts=document.querySelectorAll("table"),i,j,t,rows,part,cite;
  for(i=0;i<ts.length;i++){
    t=ts[i];rows=t.rows;part=null;cite=null;
    if(!rows||rows.length<4)continue;
    for(j=0;j<rows.length;j++){
      var c0=rows[j].cells&&rows[j].cells[0];
      if(!c0)continue;
      var tx=c0.textContent.trim();
      if(tx==="Part")part=rows[j];
      else if(tx==="How to cite it")cite=rows[j];
    }
    if(part&&cite)out.push(part);
  }
  return out;
}
function sdFillPartRow(partRow){
  var nxt=partRow.nextElementSibling,row=null;
  if(nxt&&nxt.getAttribute&&nxt.getAttribute("data-sd-pnrow")==="1")row=nxt;
  else if(nxt&&nxt.cells&&nxt.cells[0]&&nxt.cells[0].textContent.trim()==="Part number")return; /* the page drew its own */
  if(!row){
    row=document.createElement("tr");
    row.setAttribute("data-sd-pnrow","1");
    var lc=partRow.cells[0],vc0=partRow.cells[1];
    var nl=lc?lc.cloneNode(false):document.createElement("th");
    var nv=vc0?vc0.cloneNode(false):document.createElement("td");
    try{nl.removeAttribute("id");nl.removeAttribute("aria-labelledby")}catch(_){}
    try{nv.removeAttribute("id");nv.removeAttribute("aria-labelledby")}catch(_){}
    nl.textContent="Part number";
    row.appendChild(nl);row.appendChild(nv);
    partRow.parentNode.insertBefore(row,partRow.nextSibling);
  }
  var vc=row.cells&&row.cells[1];
  if(!vc)return;
  var rec=SX.last;
  var raw=null;
  if(rec&&typeof rec==="object"){
    raw=rec.PartNumber;
    if(raw==null||String(raw).trim()==="")raw=rec.ComponentPartNumber;
  }
  var pn=(raw==null)?"":String(raw).trim();
  var key,ab=null;
  if(pn)key="pn:"+pn;
  else{ab=sdAbsence(partRow.closest("table"))||{text:"not recorded",cls:""};key="absent:"+ab.text}
  if(vc.getAttribute("data-sd-pnval")===key)return;
  vc.setAttribute("data-sd-pnval",key);
  vc.textContent="";
  if(pn){
    var code=document.createElement("code");
    code.className="cd sd-pnlink";
    code.textContent=pn;
    code.setAttribute("data-sd-part",pn);
    code.setAttribute("role","button");
    code.setAttribute("tabindex","0");
    code.setAttribute("aria-label","Open the dossier for part number "+pn);
    try{code.dataset.sdPnDone="1"}catch(_){}
    vc.appendChild(code);
  }else{
    if(ab&&ab.cls)vc.className=ab.cls;
    vc.textContent=ab.text;
  }
}
function sdPartRow(){
  var rows=sdSheetPartRows(),i;
  for(i=0;i<rows.length;i++){try{sdFillPartRow(rows[i])}catch(_){}}
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
  /* the repeats endpoint's own limits, if it states any */
  if(rp&&rp.cannot_show&&rp.cannot_show.length)parts.push(sdLimits(rp.cannot_show));
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
   setFilter owns, a small marker opens the operator dossier; a code.cd that
   really carries a P/N (none are measured on this page) would open the part
   dossier. Model cells are left to setFilter alone. */
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
    if(c.closest&&c.closest("[data-sd-pnrow]"))continue;
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

/* ============ sd-locate: api/locate reads the mechanic's own words and says
   where the defect was. One control sits above the record table, where the
   write-ups already are. It sends the first 25 write-ups now on screen \u2014
   never more, the endpoint's own limit \u2014 and says that is what it sent.
   A row is marked only when the model's location came back with a span the
   endpoint could quote verbatim from the write-up; what it could not prove
   comes back as dropped_unverifiable plus a note, and both are shown. Every
   mark carries a "read by a model" tag and amber dashed styling, so it can
   never be mistaken for the FAA's zone codes in the row above. Results are
   cached against the write-up's own text, so a redraw re-marks the same
   sentence with the same reading and never a stale neighbour's. ========== */
var SDLOC={cache:{},last:null,busy:0,fp:null};
function sdLocKey(t){
  var h=5381,i;
  for(i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;
  return h.toString(36)+"_"+t.length;
}
function sdLocCollect(){
  var out=[],ws=document.querySelectorAll(".wu"),i,j,wu,td,cl,junk,text;
  for(i=0;i<ws.length;i++){
    wu=ws[i];
    if(!wu.isConnected)continue;
    td=wu.closest("td");
    if(!td)continue;
    cl=wu.cloneNode(true);
    junk=cl.querySelectorAll(".wu-gloss,[data-sd-locout]");
    for(j=0;j<junk.length;j++){if(junk[j].parentNode)junk[j].parentNode.removeChild(junk[j])}
    text=(cl.textContent||"").replace(/\s+/g," ").trim();
    if(text.length<12)continue;
    out.push({wu:wu,td:td,text:text,key:sdLocKey(text)});
  }
  return out;
}
function sdLocFpOf(rows){
  if(!rows||!rows.length)return "";
  return rows.length+":"+rows[0].key+":"+rows[rows.length-1].key;
}
function sdLocBar(){
  var anchor=null,w,t,bar;
  w=document.querySelector(".wu");
  if(w&&w.isConnected){
    t=w.closest("table");
    if(t&&t.isConnected)anchor=t;
  }
  bar=byId("sd-locbar");
  if(!anchor){
    if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
    return;
  }
  if(!bar){
    bar=document.createElement("div");
    bar.id="sd-locbar";
    bar.setAttribute("data-sd-model","1");
    bar.setAttribute("role","region");
    bar.setAttribute("aria-label","A model\u2019s reading of where the write-ups on screen say the defect was");
    bar.innerHTML='<button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>'
      +'<span class="sd-loc-exp">Sends the first 25 write-ups now on screen \u2014 no more, the reader\u2019s own limit \u2014 to a model that reads where each defect was. A location is kept only when the quoted words appear verbatim in the write-up; what it cannot prove is dropped and counted. Everything here is a model\u2019s reading, not the FAA\u2019s zone codes.</span>'
      +'<div id="sd-locsum" hidden></div>';
    bar.addEventListener("click",function(e){
      var b=e.target&&e.target.closest?e.target.closest("#sd-locbtn"):null;
      if(!b)return;
      e.preventDefault();
      try{sdLocSend()}catch(_){}
    });
  }
  if(bar.parentNode!==anchor.parentNode||bar.nextElementSibling!==anchor){
    anchor.parentNode.insertBefore(bar,anchor);
  }
}
function sdLocSend(){
  if(SDLOC.busy)return;
  var rows=sdLocCollect();
  if(!rows.length){
    SDLOC.busy=0;
    SDLOC.last={fp:"",error:true,msg:"No write-ups are on screen to read."};
    kick();return;
  }
  var batch=rows.slice(0,25),i,payload;
  payload={records:[]};
  for(i=0;i<batch.length;i++)payload.records.push({id:String(i),text:batch[i].text});
  SDLOC.busy=batch.length;
  SDLOC.last=null;
  kick();
  fetch("/z/api/locate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  }).then(function(r){
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json();
  }).then(function(j){
    SDLOC.busy=0;
    var res=(j&&Array.isArray(j.results))?j.results:[];
    var placed={},placedN=0,i,x,idx,where,span;
    for(i=0;i<res.length;i++){
      x=res[i];
      if(!x||typeof x!=="object")continue;
      idx=Number(x.id);
      if(!isFinite(idx)||idx<0||idx>=batch.length)continue;
      where=(x.where==null)?"":String(x.where).trim();
      span=(x.span==null)?"":String(x.span).trim();
      if(!where)continue;
      placed[idx]={where:where,span:span};
      placedN++;
    }
    /* sent rows are settled this run: placed ones keep their reading, the
       rest are explicitly dropped, so no stale mark survives a re-run */
    for(i=0;i<batch.length;i++)SDLOC.cache[batch[i].key]=placed[i]||null;
    SDLOC.last={
      fp:sdLocFpOf(rows),
      sent:batch.length,
      total:rows.length,
      checked:(j&&j.checked!=null)?sdNum(j.checked):batch.length,
      placed:placedN,
      dropped:(j&&j.dropped_unverifiable!=null)?sdNum(j.dropped_unverifiable):(batch.length-placedN),
      note:(j&&j.note!=null)?String(j.note).trim():""
    };
    kick();
  }).catch(function(){
    SDLOC.busy=0;
    SDLOC.last={fp:sdLocFpOf(rows),error:true};
    kick();
  });
}
function sdLocApply(rows){
  var i,r,hit,mark,tag,wh,sp;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    hit=Object.prototype.hasOwnProperty.call(SDLOC.cache,r.key)?SDLOC.cache[r.key]:undefined;
    mark=r.td.querySelector("[data-sd-locout]");
    if(hit){
      if(!mark){
        mark=document.createElement("p");
        mark.className="sd-loc";
        mark.setAttribute("data-sd-locout","1");
        mark.setAttribute("data-sd-model","1");
        tag=document.createElement("span");
        tag.className="sd-loc-tag";
        tag.textContent="read by a model";
        wh=document.createElement("b");
        wh.className="sd-loc-where";
        wh.textContent=hit.where;
        mark.appendChild(tag);
        mark.appendChild(wh);
        if(hit.span){
          sp=document.createElement("span");
          sp.className="sd-loc-span";
          sp.textContent="\u201c"+hit.span+"\u201d";
          mark.appendChild(sp);
        }
        r.td.appendChild(mark);
      }
    }else if(hit===null&&mark){
      mark.parentNode.removeChild(mark);
    }
  }
}
function sdLocRender(){
  var bar=byId("sd-locbar");
  if(!bar)return;
  var btn=byId("sd-locbtn");
  var sum=byId("sd-locsum");
  if(!sum){
    sum=document.createElement("div");
    sum.id="sd-locsum";
    sum.hidden=true;
    bar.appendChild(sum);
  }
  var label=SDLOC.busy?("Reading "+SDLOC.busy+" write-ups\u2026"):"Locate these write-ups";
  if(btn){
    if(btn.textContent!==label)btn.textContent=label;
    var dis=!!SDLOC.busy;
    if(btn.disabled!==dis)btn.disabled=dis;
  }
  var html="",sig="",show=false,last=SDLOC.last;
  if(SDLOC.busy){
    html='<p class="sd-loc-line">Sending '+SDLOC.busy+' write-ups to the reader\u2026</p>';
    sig="busy"+SDLOC.busy;show=true;
  }else if(last&&last.error){
    if(last.fp===SDLOC.fp||!last.fp){
      html='<p class="sd-loc-line">'+sdEsc(last.msg||"The locate endpoint did not answer. Nothing is marked rather than something wrong.")+'</p>';
      sig="err:"+(last.msg||"");show=true;
    }
  }else if(last&&last.fp===SDLOC.fp){
    var sentTxt=(last.sent>=last.total)
      ?("all "+last.total+" write-ups now on screen")
      :("the first "+last.sent+" of the "+last.total+" write-ups now on screen");
    html='<p class="sd-loc-line">Sent '+sentTxt+'. Checked '+sdFmt(last.checked)+', placed '+sdFmt(last.placed)+', dropped '+sdFmt(last.dropped)+' as unverifiable.</p>'
      +(last.note?'<p class="sd-loc-note">'+sdEsc(last.note)+'</p>':'');
    sig="s"+last.sent+"t"+last.total+"c"+last.checked+"p"+last.placed+"d"+last.dropped+"n"+last.note;
    show=true;
  }
  if((sum.getAttribute("data-sd-sig")||"")!==sig){
    sum.setAttribute("data-sd-sig",sig);
    if(show){
      if(sum.hidden)sum.hidden=false;
      sum.innerHTML=html;
    }else{
      if(!sum.hidden)sum.hidden=true;
      if(sum.innerHTML!=="")sum.innerHTML="";
    }
  }
}
function sdLocStep(){
  var rows=sdLocCollect();
  SDLOC.fp=sdLocFpOf(rows);
  sdLocApply(rows);
  sdLocRender();
}

var queued=false;
function pass(){
  queued=false;
  try{if(window.rrTail!==sdRrTail)window.rrTail=sdRrTail}catch(e){}
  try{sdEnsureGlobals()}catch(e){}
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
  try{sdPartRow()}catch(e){}
  try{sdMarkCells()}catch(e){}
  try{sdLocBar()}catch(e){}
  try{sdLocStep()}catch(e){}
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
