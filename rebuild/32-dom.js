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

/* ================= sd-dossier: one airframe, read from the four endpoints ============ */
var SD={tail:null,inflight:null,cache:{}};
function sdEsc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function sdDossierNode(){
  var panel=byId("p-aircraft");if(!panel)return null;
  var node=byId("sd-dossier");
  if(!node){
    node=document.createElement("div");node.id="sd-dossier";
    node.setAttribute("role","region");node.setAttribute("aria-label","Dossier for one aircraft");
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
function sdRender(node,t,raf,rpf,rsm){
  var ok=function(r){return r&&r.status==="fulfilled"?r.value:null};
  var af=ok(raf),rp=ok(rpf),sm=ok(rsm);
  var parts=[];
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
  var cs=af.cannot_show||[];
  parts.push('<section class="sd-d-sec"><h3>What this file cannot show</h3>'
    +(cs.length?'<ul class="sd-d-lim">'+cs.map(function(x){return "<li>"+sdEsc(x)+"</li>"}).join("")+'</ul>':"")
    +'</section>');
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
function sdOpenTail(t){
  t=String(t||"").trim();if(!t)return;
  SD.tail=t;
  var tab=document.querySelector('#vstrip .vtab[data-view="p-aircraft"]');
  if(tab)try{tab.click()}catch(_){}
  var node=sdDossierNode();if(!node)return;
  if(SD.cache[t]){
    node.dataset.sdTail=t;node.dataset.sdDone="1";
    var c=SD.cache[t];sdRender(node,t,c[0],c[1],c[2]);return;
  }
  if(SD.inflight===t)return;
  SD.inflight=t;
  node.dataset.sdTail=t;node.dataset.sdDone="";
  node.innerHTML='<p class="sd-d-none">Reading the file\u2026</p>';
  var g=function(u){return fetch("/z/api/"+u).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})};
  Promise.allSettled([
    g("airframe/"+encodeURIComponent(t)),
    g("repeats/"+encodeURIComponent(t)),
    g("summary/"+encodeURIComponent(t))
  ]).then(function(rs){
    if(SD.tail!==t)return;
    SD.inflight=null;SD.cache[t]=rs;
    node.dataset.sdTail=t;node.dataset.sdDone="1";
    sdRender(node,t,rs[0],rs[1],rs[2]);
  }).catch(function(){
    if(SD.tail!==t)return;
    SD.inflight=null;
    node.dataset.sdDone="1";
    node.innerHTML='<section class="sd-d-sec"><p class="sd-d-none">The dossier did not answer. Nothing is shown rather than something wrong.</p></section>';
  });
}
function sdBootFromURL(){
  var q=new URLSearchParams(location.search);
  var t=q.get("tail");
  if(!t&&q.get("kind")==="tail")t=q.get("v");
  if(t)sdOpenTail(t);
}
/* sd-dossier wiring: same mechanism the table uses, [data-ask="tail|..."] */
document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest('[data-ask^="tail|"]'):null;
  if(!el)return;
  var v=(el.getAttribute("data-ask")||"").slice(5);
  if(v)sdOpenTail(v);
},true);
document.addEventListener("keydown",function(e){
  if(e.key!=="Enter"&&e.key!==" ")return;
  var t=e.target;
  if(!t||!t.getAttribute)return;
  var a=t.getAttribute("data-ask")||"";
  if(a.indexOf("tail|")===0){var v=a.slice(5);if(v)sdOpenTail(v)}
},true);
addEventListener("popstate",function(){try{sdBootFromURL()}catch(_){}});
function sdDossierKick(){
  if(!SD.tail)return;
  var node=sdDossierNode();if(!node)return;
  if(node.isConnected&&node.dataset.sdTail===SD.tail&&node.dataset.sdDone==="1")return;
  var c=SD.cache[SD.tail];
  if(c){node.dataset.sdTail=SD.tail;node.dataset.sdDone="1";sdRender(node,SD.tail,c[0],c[1],c[2])}
  else sdOpenTail(SD.tail);
}

var queued=false;
function pass(){
  queued=false;
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