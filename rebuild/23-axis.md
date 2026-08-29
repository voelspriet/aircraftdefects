Three fixes, carried items intact.

**Fault 1 — strip axes.** `#vstrip .vg` now states `flex-direction:row!important` (the page's own `.vg{flex-direction:column}` was turning the 200px flex-basis into a height), `.vglab` is pinned as a width with `height:auto!important`, and `.vgbtns` repeats both axes. The strip itself is written as both things it is: `display:flex;flex-direction:column` and `position:static;z-index:auto`, so the page's sticky on `.vgroups` no longer survives a `display` override. Tabs sized to one line per group at 1440.

**Fault 2 — open rail.** Every inflating rule is gone. The instrument is the page's own markup, and the block only pins the five classes the fault names to the measures the original sets: `.rail.open` padding 7/8, `.strip` 12px, `.specimen` 6/8 with a 2-line clamp, `.margin` 6px/11.5px/1.5, `.aim` 20px/20px.

**Fault 3 — landing card.** The block never creates one, and a throttled sweep removes any `.card.land` on every render.

Carried: the `#sentence` keeper (present, empty, hidden; a MutationObserver restamps `#count.sdcount` after every page write), the `.vgbtns` inline styles, the second line and its published-to date (page fetch first, fallback from `RANGE.to`), `table.reps` naming, `#noRows` with a global `renderOnPurpose`, and the page's phone layout, case overlay, stepper and aria untouched.

```html
<style>
/* ---- rebuild layer: the names are ours, the measures are the page's ---- */

#tabs{border-bottom:0;padding-bottom:0;margin:10px 0 12px}

/* the standing sentence lives in #count.sdcount; the hero's own slot stays in the
   DOM but out of view, and the hidden #sentence keeper sits beside the freshness line */
#iSentence{display:none}
#count.sdcount{display:block;flex:1 1 100%;font-family:'Instrument Serif',Georgia,serif;
  font-size:34px;line-height:1.1;color:var(--ink);max-width:26em;margin:2px 0 0}
#count.sdcount .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;
  font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash)}
#count.sdcount .broken{display:block;font-size:.5em;color:var(--rust-text,#b8431f)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count.sdcount .clause:hover,#count.sdcount .clause:focus-visible{
  color:var(--rust-text,#b8431f);border-bottom-color:var(--rust-text,#b8431f)}

/* the strip: three labelled rows. Both axes written down, because the page sets
   .vg{flex-direction:column}, which reads a 200px flex-basis as a height. */
#vstrip.vgroups{display:flex;flex-direction:column;position:static;z-index:auto;inset:auto;
  gap:3px;margin:0;padding:6px 0;border-bottom:1px solid var(--line);background:transparent}
#vstrip .vg{display:flex;flex-direction:row!important;flex-wrap:nowrap;align-items:baseline;gap:10px}
#vstrip .vglab{flex:0 0 200px!important;flex-basis:200px;width:200px;max-width:200px;
  height:auto!important;min-height:0;font:600 10px/1.35 Archivo,system-ui,sans-serif;
  letter-spacing:.06em;text-transform:uppercase;color:#57514a;text-align:right;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:baseline}
#vstrip .vgbtns{display:flex!important;flex-direction:row!important;flex-wrap:wrap;gap:2px;
  align-items:baseline;flex:1 1 auto;min-width:0}
#vstrip .vtab{padding:3px 8px;font-size:12px;line-height:1.3;border-radius:3px;
  border:1px solid transparent;background:none;color:var(--smoke);cursor:pointer;font-family:inherit}
#vstrip .vtab:hover{color:var(--ink)}
#vstrip .vtab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
#vstrip .vtab:focus-visible{outline:2px solid var(--rust);outline-offset:2px;border-radius:2px}
@media(max-width:900px){
  #vstrip .vg{flex-direction:column!important;align-items:flex-start;gap:2px}
  #vstrip .vglab{flex:0 0 auto!important;width:auto;max-width:none;text-align:left}
}

/* the instrument keeps the page's own measures; these pin them so no rail inflates */
.strip{height:12px}
.rail.open{padding:7px 0 8px}
.specimen{margin-top:8px;border-top:1px solid var(--line);padding-top:6px}
.specimen .sl{-webkit-line-clamp:2}
.margin{margin-top:6px;border-top:1px solid var(--line);padding:5px 0 2px;font-size:11.5px;line-height:1.5}
.aim{min-height:20px;font-size:13px;line-height:20px;margin-top:6px}

/* the empty state, on its own id instead of inside a table */
#noRows{background:var(--card);border:1px solid var(--line);padding:26px 16px}
#noRows p{margin:0 0 12px;font-size:14px;max-width:70ch}
#noRows .muted{color:var(--ash);font-size:12.5px;max-width:80ch}
#noRows .bar{margin:0;flex-wrap:wrap}
</style>
<script>
(function(){
"use strict";
function sdEsc(s){return (s==null?"":String(s)).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function sdNum(n){try{return (typeof num==="function")?num(n):Number(n).toLocaleString("en");}
  catch(e){return String(n==null?"":n);}}

var SD_TABS=[["p-search","Search"],["p-patterns","Patterns"],["p-aircraft","Aircraft"],
  ["p-fleet","Fleet"],["p-leads","Story leads"],["p-emerging","New defects"],
  ["p-clusters","Same day, many aircraft"],["p-defect","Same defect"],
  ["p-structure","Corrosion & cracks"],["p-age","Old airframes"],["p-engines","Engines"],
  ["p-consequences","What the crew did"],["p-found","How it was found"],
  ["p-compare","Compare"],["p-terms","Every code explained"],["p-method","Method"]];
var SD_GROUPS=[
  ["Narrows to what you selected","Narrows to what you selected",
    ["p-search","p-patterns","p-aircraft","p-found"]],
  ["Ignore your selection",
    "These ignore your selection; each answers from the whole file or from a slice set inside the panel",
    ["p-fleet","p-leads","p-emerging","p-clusters","p-defect","p-structure","p-age",
     "p-engines","p-consequences"]],
  ["Reference","Reference",["p-compare","p-terms","p-method"]]];
function sdLabel(id){
  try{ if(typeof TABS!=="undefined"&&TABS&&TABS.length){
    for(var i=0;i<TABS.length;i++) if(TABS[i][0]===id) return TABS[i][1]; } }catch(e){}
  for(var j=0;j<SD_TABS.length;j++) if(SD_TABS[j][0]===id) return SD_TABS[j][1];
  return id;
}

/* div.panel -> section.panel; children and their listeners move with it */
function sdSectionize(){
  [].slice.call(document.querySelectorAll("div.panel")).forEach(function(d){
    if(!d.id)return;
    var s=document.createElement("section");
    s.className=d.className; s.id=d.id;
    if(d.getAttribute("role"))s.setAttribute("role",d.getAttribute("role"));
    while(d.firstChild)s.appendChild(d.firstChild);
    d.parentNode.replaceChild(s,d);
  });
}

/* the keeper slot: present, empty, hidden */
function sdSentenceSlot(){
  if(document.getElementById("sentence"))return;
  var f=document.getElementById("freshness");
  var s=document.createElement("div");
  s.id="sentence"; s.hidden=true; s.setAttribute("aria-hidden","true");
  if(f&&f.parentNode)f.parentNode.insertBefore(s,f); else document.body.appendChild(s);
}

/* the strip */
function sdBuildStrip(){
  var host=document.getElementById("tabs"); if(!host)return;
  var strip=document.getElementById("vstrip");
  if(!strip){ strip=document.createElement("div"); strip.id="vstrip";
    strip.className="vgroups"; host.innerHTML=""; host.appendChild(strip); }
  strip.innerHTML=SD_GROUPS.map(function(g){
    return '<div class="vg"><span class="vglab" title="'+sdEsc(g[1])+'">'+sdEsc(g[0])+"</span>"+
      '<span class="vgbtns" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:2px;'+
      'align-items:baseline;flex:1 1 auto;min-width:0">'+
      g[2].map(function(id){
        return '<button type="button" class="vtab" role="tab" data-p="'+id+'" id="tab-'+id+
          '" aria-controls="'+id+'" aria-selected="false" tabindex="-1">'+sdEsc(sdLabel(id))+"</button>";
      }).join("")+"</span></div>";
  }).join("");
  [].forEach.call(strip.querySelectorAll(".vtab"),function(b){
    b.addEventListener("click",function(){ try{ show(b.dataset.p); }catch(e){} });
  });
  sdRoveStrip();
}
function sdRoveStrip(){
  var tabs=[].slice.call(document.querySelectorAll("#vstrip .vtab")); if(!tabs.length)return;
  var keep=null;
  tabs.forEach(function(b){ if(b.getAttribute("aria-selected")==="true")keep=b; });
  if(!keep)keep=tabs[0];
  tabs.forEach(function(b){ b.setAttribute("tabindex", b===keep?"0":"-1"); });
}

/* the sentence keeper: whatever the hero's sentence slot holds is restamped into
   #count every time the page overwrites it */
var sdSentenceHTML="", sdRestoring=false, sdCountMO=null;
function sdStampCount(){
  var c=document.getElementById("count"); if(!c||!sdSentenceHTML)return;
  if(c.classList.contains("sdcount")&&c.innerHTML===sdSentenceHTML)return;
  sdRestoring=true;
  c.classList.add("sdcount");
  c.innerHTML=sdSentenceHTML;
  sdRestoring=false;
}
function sdWatchCount(){
  var c=document.getElementById("count");
  if(!c||sdCountMO)return;
  sdCountMO=new MutationObserver(function(){ if(!sdRestoring)sdStampCount(); });
  sdCountMO.observe(c,{childList:true,characterData:true,subtree:true});
}
function sdAfterHero(){
  try{
    var s=document.querySelector("#hero .sentence");
    if(s&&s.innerHTML&&s.innerHTML.trim())sdSentenceHTML=s.innerHTML;
  }catch(e){}
  sdStampCount();
  sdSweep();
}

/* the landing card stays gone */
function sdKillLand(){
  [].slice.call(document.querySelectorAll(".card.land")).forEach(function(n){
    if(n.parentNode)n.parentNode.removeChild(n);
  });
}
/* the table carries the rebuild's name */
function sdNameTables(){
  [].slice.call(document.querySelectorAll("table.reports")).forEach(function(t){
    t.classList.add("reps");
  });
}
/* the empty state, under its own id, with a renderOnPurpose that reaches it */
function sdEmptySwap(){
  var res=document.getElementById("results"); if(!res)return;
  var emp=res.querySelector("tr.empty"); if(!emp)return;
  if(!/No rows yet/.test(emp.textContent||""))return;
  var total=0; try{ if(typeof TOTAL!=="undefined"&&TOTAL)total=TOTAL; }catch(e){}
  res.innerHTML='<div id="noRows" class="sdnORows">'+
    "<p><strong>No rows yet, on purpose.</strong> Listing everything answers no question and "+
    "buries the one you have.</p>"+
    '<p class="muted">Take a month, a zone, an airline or a tail from the instrument above, pick '+
    "one of the starter questions, or set a filter. To read the file straight through anyway, use "+
    "the button at the foot of the instrument.</p>"+
    '<div class="bar"><button type="button" class="ghost" onclick="renderOnPurpose()">Read all '+
    sdNum(total)+" anyway</button>"+
    '<button type="button" class="ghost" onclick="showStarters()">Show me the starter questions</button>'+
    "</div></div>";
}
window.renderOnPurpose=function(){
  var nr=document.getElementById("noRows");
  if(nr)nr.setAttribute("data-sdread","1");
  try{ if(typeof revealAll==="function")revealAll(); }catch(e){}
};

/* the second line and its published-to date: the page's own fetch first, this if empty */
function sdSecondLine(){
  var f=document.getElementById("freshness"); if(!f)return;
  if(f.textContent&&f.textContent.trim())return;
  var to=""; try{ if(typeof RANGE!=="undefined"&&RANGE&&RANGE.to)to=RANGE.to; }catch(e){}
  if(!to)return;
  var pretty=to;
  try{ if(typeof prettyDate==="function")pretty=prettyDate(to); }catch(e){}
  f.innerHTML="Reports published to <b>"+sdEsc(pretty)+"</b>. Counts are of reports filed, not of flights.";
}

function sdSweep(){ sdKillLand(); sdNameTables(); sdEmptySwap(); sdSecondLine(); }

/* the page's own functions stay the engine; each wrap only adds the sweep after it */
function sdWrap(name,after){
  try{
    var orig=window[name];
    if(typeof orig!=="function")return;
    window[name]=function(){
      var r=orig.apply(this,arguments);
      try{
        if(r&&typeof r.then==="function")r.then(function(){after();},function(){after();});
        else after();
      }catch(e){}
      return r;
    };
  }catch(e){}
}

function sdInit(){
  try{ sdSectionize(); }catch(e){}
  try{ sdSentenceSlot(); }catch(e){}
  try{ sdBuildStrip(); }catch(e){}
  try{ sdWatchCount(); }catch(e){}
  sdWrap("renderTabs",sdBuildStrip);
  sdWrap("drawHero",sdAfterHero);
  sdWrap("show",sdRoveStrip);
  sdWrap("search",sdSweep);
  try{ sdSweep(); }catch(e){}
  var sdKillT=null, sdMO=null;
  try{
    sdMO=new MutationObserver(function(){
      if(sdKillT)return;
      sdKillT=setTimeout(function(){ sdKillT=null; try{ sdKillLand(); }catch(e){} },200);
    });
    sdMO.observe(document.body,{childList:true,subtree:true});
  }catch(e){}
}
if(document.readyState==="loading")
  document.addEventListener("DOMContentLoaded",sdInit);
else sdInit();
})();
</script>
```