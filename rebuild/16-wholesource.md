```html
<!-- drops into the rebuild inside its IIFE: injects the faces, the setting, and four DOM fixes -->
<script>
(function(){
"use strict";
var doc=document;

/* the faces the instrument is set in */
if(!doc.getElementById("sdr-faces")){
  var p1=doc.createElement("link");p1.rel="preconnect";p1.href="https://fonts.googleapis.com";
  var p2=doc.createElement("link");p2.rel="preconnect";p2.href="https://fonts.gstatic.com";p2.crossOrigin="anonymous";
  var fl=doc.createElement("link");fl.id="sdr-faces";fl.rel="stylesheet";
  fl.href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap";
  doc.head.appendChild(p1);doc.head.appendChild(p2);doc.head.appendChild(fl);
}

var st=doc.createElement("style");st.id="sdr-instrument-fix";
st.textContent=[
"/* 1. the aim line keeps its box when it is empty, so hovering moves nothing */",
".aim{display:block!important;min-height:20px;margin-top:6px;",
"  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;",
"  font-size:13px;line-height:20px;color:#b8431f!important}",
".aim .undoit{background:none;border:1px solid rgba(196,75,40,.5);color:#b8431f;",
"  border-radius:4px;padding:1px 8px;margin-left:8px;cursor:pointer;font:inherit;font-size:12px}",
"/* 2. the tab strip sits in the flow and stays compact, about the original's 104px */",
"[role='tablist']{position:static!important;top:auto!important;bottom:auto!important;z-index:auto!important}",
".tabs{display:block;border-bottom:1px solid #e2ded5;margin:10px 0 12px;padding-bottom:6px}",
"[id^='vtab-'],.tabs .tab{display:inline-block!important;min-height:0!important;height:auto;",
"  padding:4px 10px;font-size:12.5px;line-height:1.35;border-radius:3px;",
"  border:1px solid transparent;background:none;color:#6b6560;cursor:pointer;font-family:inherit}",
"[id^='vtab-'][aria-selected='true'],.tabs .tab.on{background:#fff;border-color:#e2ded5;color:#1d1d1f;font-weight:600}",
".vgroup{display:flex!important;align-items:baseline;gap:10px;margin:0 0 3px}",
".vrow{display:flex!important;gap:2px;flex-wrap:wrap;flex:1;min-width:0}",
".vlab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;",
"  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}",
"/* 3. the overlay is the scroller; the card sits inside it */",
"#case-wrap{position:fixed!important;inset:0!important;overflow-y:auto!important;overflow-x:hidden;",
"  overscroll-behavior:contain;background:rgba(12,16,22,.72);align-items:flex-start;",
"  justify-content:center;padding:32px 16px}",
"#case-box{position:static!important;inset:auto!important;transform:none!important;",
"  width:100%!important;max-width:900px!important;height:auto!important;max-height:none!important;",
"  min-height:0!important;margin:0 auto!important;overflow:visible!important;background:#fff;",
"  border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-box{max-width:100%!important}}",
"/* 4. the ladder says the designator once; the nested duplicate is also removed in JS */",
".orow .on>.rv-lcode{display:none}",
"/* 5. the type, decided once: Instrument Serif carries the sentence, the ink is #1d1d1f */",
".stand,.rv-sentence,.stand.rv-sentence{font-family:'Instrument Serif',Georgia,'Times New Roman',serif!important;",
"  font-size:34px!important;line-height:1.1;color:#1d1d1f;max-width:26em;margin:7px 0 0}",
".rv-count{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:500;",
"  font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}",
".rv-aside{font-family:'Instrument Serif',Georgia,serif;font-size:.62em;color:#756f69}",
".rv-clause{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;",
"  border-bottom:1px dotted rgba(29,29,31,.28)}",
".rv-clause:hover,.rv-clause:focus-visible{color:#b8431f;border-bottom-color:#b8431f}",
".hand{font-family:Archivo,system-ui,sans-serif;font-size:13px;font-weight:600;line-height:1.4;",
"  color:#1d1d1f;margin-top:2px}",
".hand .kbd{display:none;font-weight:400;color:#6b6560}",
".hand:focus-within .kbd{display:inline}",
".hand .c{font-weight:400;color:#6b6560;cursor:pointer;margin-left:6px}",
".margin{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.5;",
"  color:#5f584f;margin-top:6px;border-top:1px solid #e2ded5;padding:5px 0 2px}",
".margin span{display:block;color:#5f584f}",
".margin span+span{margin-top:2px}",
".margin .rustnote{color:#b8431f}",
".reading{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#1d1d1f;",
"  margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid #c44b28;background:#faf7f3;max-width:74ch}",
".orow{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11.5px;color:#1d1d1f}",
".orow .on{color:#1d1d1f;font-family:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".orow b{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:400;text-align:right;color:#5f584f}"
].join("\n");
doc.head.appendChild(st);

/* the hand line, restored with the original's own wording, per open rail */
var HAND={when:"Drag across the months to take a period.",
  where:"Click a zone on the aircraft to keep only what was found there.",
  whose:"Click an airline or an airframe to follow it.",
  forced:"Click what the crew had to do."};
var KBD="Keyboard: arrows walk the months, Shift and an arrow extends, Enter takes it.";

function openRail(){
  var p=doc.querySelector("#hero .picker [data-pick][aria-selected='true']");
  if(p)return p.getAttribute("data-pick");
  var r=doc.querySelector("#hero .rail.open[data-rail]");
  return r?r.getAttribute("data-rail"):"whose";
}
function ensureHand(){
  var hero=doc.getElementById("hero");if(!hero)return;
  var aim=hero.querySelector(".aim");if(!aim)return;
  var hand=hero.querySelector(".hand");
  if(!hand){
    hand=doc.createElement("div");hand.className="hand";hand.id="iHand";
    var anchor=hero.querySelector(".aimat")||aim;
    anchor.insertAdjacentElement("afterend",hand);
  }
  var txt=HAND[openRail()]||HAND.whose;
  if(hand.getAttribute("data-txt")===txt)return;
  hand.setAttribute("data-txt",txt);
  while(hand.firstChild)hand.removeChild(hand.firstChild);
  hand.appendChild(doc.createTextNode(txt));
  var kbd=doc.createElement("span");kbd.className="kbd";kbd.textContent=KBD;hand.appendChild(kbd);
  var c=doc.createElement("span");c.className="c";c.textContent="Or use the filters below.";
  c.onclick=function(){var d=doc.getElementById("morefilters");
    if(d){d.open=true;d.scrollIntoView({behavior:"smooth",block:"center"});}};
  hand.appendChild(c);
}
/* the ladder: when a row shows both a name and a nested duplicate, the duplicate goes */
function fixLadder(){
  var ons=doc.querySelectorAll(".orow .on");
  Array.prototype.forEach.call(ons,function(on){
    var kids=on.children,name=null,code=null;
    for(var i=0;i<kids.length;i++){
      if(kids[i].classList.contains("rv-lname")){if(!name)name=kids[i];}
      else if(kids[i].classList.contains("rv-lcode")){code=kids[i];}
    }
    if(name&&code)code.style.display="none";
  });
}
/* the tab strip: climb to the wrapper that holds exactly the tab set, unstick it and
   everything above it, and lay it out like the original */
function vtabCount(n){return n.querySelectorAll("[id^='vtab-']").length}
function fixTabs(){
  var first=doc.querySelector("[id^='vtab-']");if(!first)return;
  var total=vtabCount(doc),strip=first.parentElement;
  while(strip&&strip.parentElement&&strip.parentElement!==doc.body
        &&strip.parentElement.id!=="main"
        &&vtabCount(strip.parentElement)===total){
    strip=strip.parentElement;
  }
  if(!strip)return;
  var n=strip;
  for(var i=0;i<4&&n&&n.nodeType===1&&n!==doc.body&&n.id!=="main";i++,n=n.parentElement){
    var cs=getComputedStyle(n);
    if(cs.position==="sticky"||cs.position==="fixed"){
      n.style.position="static";n.style.top="auto";n.style.zIndex="auto";
    }
  }
  strip.style.display="block";
  strip.style.borderBottom="1px solid #e2ded5";
  strip.style.margin="10px 0 12px";
  strip.style.paddingBottom="6px";
  Array.prototype.forEach.call(strip.children,function(g){
    if(g.nodeType!==1)return;
    g.style.display="flex";g.style.alignItems="baseline";g.style.gap="10px";g.style.margin="0 0 3px";
    Array.prototype.forEach.call(g.children,function(c){
      if(c.nodeType!==1)return;
      if(c.querySelector&&c.querySelector("[id^='vtab-']")){
        c.style.display="flex";c.style.flexWrap="wrap";c.style.gap="2px";
        c.style.flex="1";c.style.minWidth="0";
      }else if(c.tagName!=="BUTTON"&&c.getAttribute("role")!=="tab"){
        c.style.flex="0 0 200px";c.style.textAlign="right";c.style.whiteSpace="nowrap";
        c.style.fontFamily="Archivo,system-ui,sans-serif";c.style.fontSize="10px";
        c.style.fontWeight="600";c.style.textTransform="uppercase";
        c.style.color="#57514a";c.style.lineHeight="1.35";
      }
    });
  });
}
function sweep(){ensureHand();fixLadder();}
var queued=false;
function queue(){
  if(queued)return;queued=true;
  (window.requestAnimationFrame||function(f){setTimeout(f,0)})(function(){queued=false;sweep();});
}
if(window.MutationObserver&&doc.body){
  new MutationObserver(queue).observe(doc.body,{childList:true,subtree:true});
}
sweep();fixTabs();
window.addEventListener("load",fixTabs);
})();
</script>
```

What changed, fault by fault:

1. **Aim line jump.** The rebuild's `display:none` on the empty `.aim` is beaten with `display:block!important` plus the original's `min-height:20px` / `line-height:20px`, so the line holds its box whether or not it has text; hovering a month bar changes only its words. The purple went with it: the aim is IBM Plex Mono 13px in `#b8431f`, and its undo button is styled as in the original.

2. **Tab strip.** Every `[role="tablist"]` is forced out of sticky positioning; a small routine then climbs from the strip (found via the real `[id^="vtab-"]` ids, the ones the panels' `aria-labelledby` already names) up four ancestors and clears `sticky`/`fixed` wherever the browser reports it. The strip, its groups and its labels are laid back into the original's compact form — inline-block tabs at `4px 10px`, 12.5px, groups on one baseline row, 200px right-aligned labels, the strip's own border and margins — which brings its height back to roughly 104px.

3. **Case sheet.** `#case-wrap` is now the scroller (`overflow-y:auto`, `inset:0`, the original's padding) and `#case-box` sits static inside it at `max-width:900px`, `height:auto`, `overflow:visible`, so all 1521px of content is reached by scrolling the overlay, exactly as the original does. Display is left to the rebuild's own open/close toggling, so Close and Escape behave as before.

4. **Ladder duplication.** The nested `.rv-lcode` duplicate inside each `.on` is hidden — by CSS where the name sits beside it, and by a JS pass (re-run on mutation) that removes it only when a sibling `.rv-lname` is present — leaving "Southwest Airlines Co (SWAA)" once.

5. **Type.** One decision: `.stand`/`.rv-sentence` is Instrument Serif 34px at `#1d1d1f`, ending the Georgia/Instrument Serif fight on the same element. The count (Plex Mono, `.92em` → 31.28px, `#b8431f`), the aside (`.62em` → 21.08px) and the clause buttons (which now inherit the serif through `font:inherit` and carry the dotted underline) are pinned to the original's values. The missing hand line is rebuilt with the original's exact per-rail wording, the "Or use the filters below." escape, and the keyboard hint, set in Archivo 600 13px `#1d1d1f`. Margin is Plex Mono 11.5px `#5f584f`; reading is Georgia 15px `#1d1d1f`; ladder rows are the system stack at 11.5px `#1d1d1f` with Plex Mono figures. The brown casts (`rgb(33,29,20)`, `rgb(38,34,29)`) are replaced by `#1d1d1f` everywhere these blocks touch, and a stylesheet link fetches Archivo, Instrument Serif and IBM Plex Mono if the rebuild had not.