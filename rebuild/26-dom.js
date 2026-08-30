(function(){
"use strict";
function byId(id){return document.getElementById(id)}
function visible(n){ if(!n||n.nodeType!==1)return false; if(!n.offsetParent&&getComputedStyle(n).position!=="fixed")return false; var cs=getComputedStyle(n); return cs.display!=="none"&&cs.visibility!=="hidden"; }
function phone(){return matchMedia("(max-width:760px)").matches}

/* ---- the instrument's inside: #hero.instrument > .ipad ---------------------
   Only built while the desk instrument is in the hero. Once drawPhone has
   replaced the hero's contents there is nothing to wrap and the phone layout
   is left exactly as the page drew it. */
function ensureIpad(){
  var hero=byId("hero"); if(!hero)return null;
  var rails=hero.querySelector(".rails");
  if(!rails||!visible(rails)||hero.querySelector(".phbar"))return hero.querySelector(".ipad")||null;
  if(!/\binstrument\b/.test(hero.className||""))hero.className=("instrument "+(hero.className||"")).trim();
  var kids=[].slice.call(hero.children), i, ipad=null, ihead=null;
  for(i=0;i<kids.length;i++){
    if(/\bipad\b/.test(kids[i].className||"")){ipad=kids[i];break}
  }
  for(i=0;i<kids.length;i++){
    if(/\bihead\b/.test(kids[i].className||"")){ihead=kids[i];break}
  }
  if(!ipad){
    ipad=document.createElement("div"); ipad.className="ipad";
    if(ihead)ihead.after(ipad); else hero.insertBefore(ipad,hero.firstChild);
    kids=[].slice.call(hero.children);
    for(i=0;i<kids.length;i++){
      if(kids[i]!==ipad&&kids[i]!==ihead)ipad.appendChild(kids[i]);
    }
  }
  return ipad;
}

/* #count.sdcount: one element, moved never cloned. Desk width: inside .ipad,
   immediately above .rails. Phone: the original keeps the sentence in
   #p-search .bar, so it goes there and the phone hero is never touched. The
   desk insert checks that the anchor is still a child of the node it is
   inserting into, at that moment, so the phone rewrite and the observer can
   never fight. Once seated, every later pass is a no-op. */
function seatCount(){
  var all=document.querySelectorAll("#count"); if(!all.length)return;
  var c=all[0],i;
  for(i=0;i<all.length;i++){ if(all[i]!==c&&all[i].parentNode)all[i].parentNode.removeChild(all[i]); }
  function detach(){ if(c.parentNode&&c.parentNode.nodeType===1&&c.parentNode.contains(c))c.parentNode.removeChild(c); }
  if(phone()){
    var bar=document.querySelector("#p-search .bar");
    if(bar&&c.parentNode!==bar){ detach(); bar.insertBefore(c,bar.firstChild); }
  }else{
    var hero=byId("hero");
    var rails=hero?hero.querySelector(".rails"):null;
    if(rails){
      var host=rails.parentNode;
      if(c.parentNode!==host||c.nextElementSibling!==rails){
        detach();
        if(rails.parentNode===host)host.insertBefore(c,rails);
      }
    }
  }
  if(!/\bsdcount\b/.test(c.className))c.className=("sdcount "+c.className).trim();
}

/* one reading per open rail: keep the fuller one as a single p.reading, put it
   back where the original put it, and leave the rail exactly three children:
   .gut, .track, p.reading. FORCED holds its reading inside .track. */
function oneReading(){
  var open=document.querySelectorAll(".rail.open"),i;
  for(i=0;i<open.length;i++){
    var rail=open[i];
    var rs=[].slice.call(rail.querySelectorAll(".reading")); 
    var keep=null;
    if(rs.length){
      keep=rs.slice().sort(function(a,b){
        var d=b.textContent.trim().length-a.textContent.trim().length;
        return d||((a.tagName==="P")?-1:1);
      })[0];
      if(keep.tagName!=="P"){
        var p=document.createElement("p"); p.className="reading";
        p.innerHTML=keep.innerHTML;
        keep.parentNode.replaceChild(p,keep); keep=p;
      }
      for(var j=0;j<rs.length;j++){ if(rs[j]!==keep)rs[j].remove() }
    }
    var host=(rail.dataset.rail==="forced")?(rail.querySelector(".track")||rail):rail;
    if(keep&&keep.parentNode!==host)host.appendChild(keep);
    [].slice.call(rail.children).forEach(function(n){
      if(/\b(gut|track)\b/.test(n.className||""))return;
      n.remove();
    });
  }
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

/* the #sentence keeper: hidden wherever the page puts it; whatever is written to
   #sentence or #count, both ends hold the same words */
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

/* every step is a no-op once settled, so the observer loop terminates */
var queued=false;
function pass(){
  queued=false;
  try{purgeLand()}catch(e){}
  try{ensureSentence()}catch(e){}
  try{ensureIpad()}catch(e){}
  try{seatCount()}catch(e){}
  try{oneReading()}catch(e){}
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