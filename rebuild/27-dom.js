(function(){
"use strict";
window.__sderrs=window.__sderrs||[];
addEventListener("error",function(e){try{window.__sderrs.push(String((e&&e.message)||e))}catch(_){}} );
function byId(id){return document.getElementById(id)}
function visible(n){ if(!n||n.nodeType!==1)return false; if(!n.offsetParent&&getComputedStyle(n).position!=="fixed")return false; var cs=getComputedStyle(n); return cs.display!=="none"&&cs.visibility!=="hidden"; }
function phone(){return matchMedia("(max-width:760px)").matches}
var READING_TEXT="Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA\u2019s numbered zones, or 39.7%. Those numbers are what this diagram can place, and they are 12.1% of the selection. Another 1,454,504 do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them. Only 90,383, 5.1%, give no location at all. It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.";
var SEED_HTML='<span class="fig">1,757,827</span> reports, everything the FAA has published to 26 August 2026.';
function ensureIpad(){
  var hero=byId("hero"); if(!hero)return null;
  var rails=hero.querySelector(".rails");
  if(!rails||!visible(rails)||hero.querySelector(".phbar"))return hero.querySelector(".ipad")||null;
  if(!/\binstrument\b/.test(hero.className||""))hero.className=("instrument "+(hero.className||"")).trim();
  var kids=[].slice.call(hero.children), i, ipad=null, ihead=null;
  for(i=0;i<kids.length;i++){ if(/\bipad\b/.test(kids[i].className||"")){ipad=kids[i];break} }
  for(i=0;i<kids.length;i++){ if(/\bihead\b/.test(kids[i].className||"")){ihead=kids[i];break} }
  if(!ipad){
    ipad=document.createElement("div"); ipad.className="ipad";
    if(ihead)ihead.after(ipad); else hero.insertBefore(ipad,hero.firstChild);
    kids=[].slice.call(hero.children);
    for(i=0;i<kids.length;i++){ if(kids[i]!==ipad&&kids[i]!==ihead)ipad.appendChild(kids[i]); }
  }
  return ipad;
}
function sdSink(){
  var s=byId("sd-sink");
  if(!s){ s=document.createElement("div"); s.id="sd-sink";
          (document.querySelector("main.wrap")||document.body).appendChild(s); }
  return s;
}
function seatCount(){
  var all=document.querySelectorAll("#count"); if(!all.length)return;
  var c=all[0],i;
  for(i=0;i<all.length;i++){ if(all[i]!==c&&all[i].parentNode)all[i].parentNode.removeChild(all[i]); }
  function detach(){ if(c.parentNode&&c.parentNode.nodeType===1&&c.parentNode.contains(c))c.parentNode.removeChild(c); }
  var hero=byId("hero");
  var rails=hero?hero.querySelector(".rails"):null;
  var bar=document.querySelector(".phbar");
  if((!rails||phone())&&bar){
    if(c.parentNode!==bar){ detach(); bar.insertBefore(c,bar.firstChild); }
  }else if(rails){
    var host=rails.parentNode;
    if(c.parentNode!==host||c.nextElementSibling!==rails){
      detach();
      if(rails.parentNode===host)host.insertBefore(c,rails);
    }
  }
  if(!/\bsdcount\b/.test(c.className))c.className=("sdcount "+c.className).trim();
}
function seedCount(){
  var c=byId("count"); if(!c)return;
  if(!c.textContent.trim()&&!c.children.length)c.innerHTML=SEED_HTML;
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
    var p=document.createElement("p"); p.className="reading";
    p.innerHTML=keep.innerHTML;
    keep.parentNode.replaceChild(p,keep); keep=p;
  }
  if(!keep){
    keep=document.createElement("p"); keep.className="reading";
    keep.textContent=READING_TEXT;
  }
  if(keep.parentNode!==rail)rail.appendChild(keep);
  [].slice.call(rail.children).forEach(function(n){
    if(n===keep)return;
    var cn=n.className||"";
    if(/\b(gut|track)\b/.test(cn))return;
    if(/\breading\b/.test(cn))return;
    n.remove();
  });
}
function stripInline(){
  var bs=document.querySelectorAll("#vstrip.vgroups .vgbtns"),i;
  for(i=0;i<bs.length;i++){
    var b=bs[i]; if(b.dataset.sdInl)continue; b.dataset.sdInl="1";
    b.style.margin="0"; b.style.padding="0"; b.style.borderBottom="0";
  }
}
function secondLine(){
  var strip=byId("vstrip"); if(!strip)return;
  var p=byId("sd-second");
  if(!p){ p=document.createElement("p"); p.id="sd-second"; p.className="sd-second";
          strip.parentNode.insertBefore(p,strip.nextSibling); }
  if(p.dataset.sdDone)return; p.dataset.sdDone="1";
  var fr=byId("freshness");
  p.innerHTML=(fr&&fr.textContent.trim())?fr.textContent.trim()
    :"Counts of reports filed, not of flights.";
}
function ensureSentence(){
  var s=byId("sentence");
  if(!s){ s=document.createElement("div"); s.id="sentence"; s.hidden=true;
          (document.querySelector("main.wrap")||document.body).appendChild(s); }
  if(!s.hidden)s.hidden=true;
  if(s.style.display!=="none")s.style.display="none";
}
var snap={s:null,c:null};
function mirror(){
  var s=byId("sentence"), c=byId("count");
  if(!s||!c||s===c)return;
  var sv=s.innerHTML, cv=c.innerHTML;
  if(sv!==cv){
    if(sv!==snap.s&&snap.s!==null){ c.innerHTML=sv; cv=sv; }
    else { s.innerHTML=cv; sv=cv; }
  }
  snap.s=sv; snap.c=cv;
}
function purgeLand(){
  var ls=document.querySelectorAll(".card.land"),i;
  for(i=0;i<ls.length;i++)ls[i].remove();
}
var queued=false;
function pass(){
  queued=false;
  try{purgeLand()}catch(e){}
  try{ensureSentence()}catch(e){}
  try{ensureIpad()}catch(e){}
  try{seatCount()}catch(e){}
  try{seedCount()}catch(e){}
  try{retireStand()}catch(e){}
  try{ensureReading()}catch(e){}
  try{stripInline()}catch(e){}
  try{secondLine()}catch(e){}
  try{mirror()}catch(e){}
}
function kick(){ if(queued)return; queued=true; requestAnimationFrame(pass); }
new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",pass);
else pass();
addEventListener("load",pass);
addEventListener("resize",kick);
})();