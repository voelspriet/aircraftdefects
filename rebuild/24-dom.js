
(function(){
"use strict";
function byId(id){return document.getElementById(id)}

/* #count.sdcount lives in the instrument, directly above .rails. Moved, never
   cloned, so there is always exactly one element with that id and the page's
   own writers keep finding it. */
function seatCount(){
  var all=document.querySelectorAll("#count"); if(!all.length)return;
  var ipad=document.querySelector("#hero.instrument > .ipad");
  var rails=ipad&&ipad.querySelector(".rails");
  if(!ipad||!rails)return;                       /* phone layout: leave it where it is */
  var c=null,i;
  for(i=0;i<all.length;i++){ if(all[i].parentElement===ipad){c=all[i];break} }
  if(!c){ c=all[0]; ipad.insertBefore(c,rails); }
  for(i=0;i<all.length;i++){ if(all[i]!==c&&all[i].parentElement!==ipad)all[i].remove(); }
  if(c.nextElementSibling!==rails)ipad.insertBefore(c,rails);
  c.classList.add("sdcount");
}

/* one reading per open rail: keep the fuller one, normalise it to a single
   p.reading at the original measure, and put it back where the original put
   it (direct child of the rail, except FORCED, which holds it in .track). */
function oneReading(){
  var open=document.querySelectorAll(".rail.open"),i;
  for(i=0;i<open.length;i++){
    var rail=open[i];
    var rs=[].slice.call(rail.querySelectorAll(".reading")); if(!rs.length)continue;
    var keep=rs.slice().sort(function(a,b){
      var d=b.textContent.trim().length-a.textContent.trim().length;
      return d||((a.tagName==="P")?-1:1);
    })[0];
    if(keep.tagName!=="P"){
      var p=document.createElement("p"); p.className="reading";
      p.innerHTML=keep.innerHTML;
      keep.parentNode.replaceChild(p,keep); keep=p;
    }
    rs.forEach(function(n){ if(n!==keep)n.remove() });
    var host=(rail.dataset.rail==="forced")?(rail.querySelector(".track")||rail):rail;
    if(keep.parentNode!==host)host.appendChild(keep);
  }
}

function stripInline(){
  var bs=document.querySelectorAll("#vstrip.vgroups .vgbtns"),i;
  for(i=0;i<bs.length;i++){
    var b=bs[i]; if(b.dataset.sdInl)continue; b.dataset.sdInl="1";
    b.style.display="flex"; b.style.gap="2px"; b.style.alignItems="center";
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

/* the #sentence keeper: the element stays hidden where it is; whatever the page
   writes to it, or to #count, both ends hold the same words */
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
  purgeLand(); ensureSentence(); seatCount(); oneReading();
  stripInline(); secondLine(); mirror();
}
function kick(){ if(queued)return; queued=true; requestAnimationFrame(pass); }
new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",pass);
else pass();
addEventListener("load",pass);
})();

