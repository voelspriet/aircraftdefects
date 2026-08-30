(function(){
"use strict";
function byId(id){return document.getElementById(id)}

/* ---- the instrument's inside: #hero.instrument > .ipad ---------------------
   The page renders the hero flat. Give it the frame and an .ipad that holds
   everything but the head, so #count can sit directly above .rails. */
function ensureIpad(){
  var hero=byId("hero"); if(!hero||!hero.querySelector(".rails"))return;
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

/* #count.sdcount: one element, inside .ipad, immediately above .rails. Moved,
   never cloned, so the page's own writers keep finding it by id. */
function seatCount(ipad){
  if(!ipad)return;
  var all=document.querySelectorAll("#count"); if(!all.length)return;
  var rails=ipad.querySelector(".rails"); if(!rails)return;
  var c=null,i;
  for(i=0;i<all.length;i++){ if(all[i].parentElement===ipad){c=all[i];break} }
  if(!c){ c=all[0]; }
  for(i=0;i<all.length;i++){ if(all[i]!==c)all[i].remove(); }
  if(c.parentElement!==ipad)ipad.insertBefore(c,rails);
  if(c.nextElementSibling!==rails)ipad.insertBefore(c,rails);
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
    /* nothing but .gut, .track and the reading may remain */
    [].slice.call(rail.children).forEach(function(n){
      if(/\b(gut|track)\b/.test(n.className||""))return;
      if(n===keep)return;
      n.remove();
    });
  }
}

function stripInline(){
  var bs=document.querySelectorAll("#vstrip.vgroups .vgbtns"),i;
  for(i=0;i<bs.length;i++){
    var b=bs[i]; if(b.dataset.sdInl)continue; b.dataset.sdInl="1";
    b.style.margin="0"; b.style.padding="0"; b.style.borderBottom="0";
    b.style.flexWrap="nowrap"; b.style.overflowX="auto";
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
    if(sv!==snap.s&&snap.s!==null){ c.innerHTML=sv; cv=sv; }  /* the page wrote #sentence */
    else { s.innerHTML=cv; sv=cv; }                           /* the page wrote #count */
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
  purgeLand(); ensureSentence();
  var ipad=ensureIpad();
  seatCount(ipad); oneReading();
  stripInline(); secondLine(); mirror();
}
function kick(){ if(queued)return; queued=true; requestAnimationFrame(pass); }
new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",pass);
else pass();
addEventListener("load",pass);
})();