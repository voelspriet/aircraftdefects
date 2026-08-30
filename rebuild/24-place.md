```html
<style>
/* ---- carried, restated ---------------------------------------------------- */
#sentence{display:none!important}
.card.land{display:none!important}
#vstrip.vgroups{display:flex;flex-direction:column;gap:3px;border-bottom:1px solid var(--line);padding:4px 0 6px;margin:10px 0 8px}
.vg{display:flex;align-items:baseline;gap:8px}
.vglab{flex:0 0 auto;font:600 9.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#57514a;text-transform:uppercase}
.vgbtns{display:flex;gap:2px;align-items:center}
button.vtab{padding:3px 8px;font-size:11.5px;border:1px solid transparent;border-radius:3px;background:none;color:#5c554c;cursor:pointer;white-space:nowrap}
button.vtab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0}
.sd-second{font-size:12px;color:#6b6560;margin:2px 0 8px;text-align:center;letter-spacing:.02em}
.sd-second b{font-weight:600}
.instrument{position:relative;background:var(--paper);border:1px solid var(--line);border-bottom:3px solid var(--rust);border-radius:6px;margin:12px 0 0;overflow:hidden}
.ipad{padding:14px 20px 8px}
/* the standing sentence, seated above the rails */
#count.sdcount{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.1;color:var(--ink);max-width:26em;margin:7px 0 0}
#count.sdcount .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash)}
#count.sdcount .broken{display:block;font-size:.5em;color:var(--rust)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
/* one reading per open rail, at the original measure */
.rail .reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);max-width:74ch}
.rail>.reading{grid-column:2}
@media(max-width:700px){.rail .reading{font-size:14px;padding:7px 10px}}
/* rail measures at desk width; the phone layout is left alone */
@media(min-width:901px){
.rail .track{min-width:0;position:relative}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail .col .ch{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.rail .orow{display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;font-size:11.5px;height:14px;padding:0 3px;border-radius:3px}
.rail .orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:14px}
.rail .orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.rail .orow .ob i{display:block;height:100%;background:var(--rust)}
.rail .orow.wide{grid-template-columns:190px 1fr 56px;height:17px}
.rail .orow.wide .on{font-size:12px;line-height:17px}
.rail .fblock{height:22px}
.rail .frows{margin-top:6px}
.rail .fnote{font-size:11px;margin-top:4px}
.rail[data-rail=forced].open .fblock{margin-bottom:7px}
}
</style>
<script>
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
</script>
```

What changed:

1. **One reading in the open rail.** The duplicate render is gone: of the two `.reading` nodes the fuller one is kept, normalised to a single `p.reading`, and placed where the original put it (direct rail child, `grid-column:2`; on the FORCED rail inside `.track`). The stray 16px twin is removed. Desk-width measures are re-asserted so `.track.two` returns to the original footprint: `1fr 330px` / 18px gap, `.orow` at 14px rows (`.wide` 17px), `.fblock` 22px, `.frows`/`.fnote` margins, forced-rail `.fblock` 7px. All of it scoped to `min-width:901px`, so the phone layout is untouched.

2. **`#count.sdcount` seated in the instrument.** After every render it is moved with `insertBefore` — never cloned, and any stray second `#count` is dropped — directly above `.rails` inside `.ipad`, keeping one element with that id so `renderOnPurpose` and `sdSearch` keep writing to it. It carries the 34px Instrument Serif sentence styling with `.fig`/`.aside`/`.clause`. `#sentence` stays hidden in place; the keeper snapshots both elements and mirrors writes in whichever direction the page wrote, so both always hold the same words.

3. **Carried intact:** the strip CSS with `.vgbtns` inline styles applied once, the `.axis` rules, the second line under the strip with the published-to text, `.card.land` removal, and the instrument measures. Phone layout, case-sheet overlay, stepper and aria-labels untouched.