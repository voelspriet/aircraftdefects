```html
<style>
/* ===================== WHERE rail (anatomy) ===================== */
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
/* a stroke-only ring vanishes on the busiest zones, which are the ones
   people reach for first — hence the drop-shadow behind the keyboard ring */
.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}
.zone:focus-visible{stroke:var(--ink);stroke-width:3}
@media (forced-colors: active){.zone{stroke:CanvasText}[data-take].taken{outline:3px solid Highlight}}

/* closed rail strip */
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}

/* open layout */
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail>.reading{grid-column:2}

/* legend */
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;padding:1px 4px;border-radius:3px}
.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.lrow.taken{background:rgba(196,75,40,.14);box-shadow:inset 2px 0 0 var(--rust)}
.lrow.lit{background:rgba(196,75,40,.10)}

/* note under the legend */
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}

/* phone: the aircraft becomes a 3x3 grid */
.phgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.phcell{background:rgba(196,75,40,var(--f,.1));border:1px solid #7c746a;border-radius:6px;
  padding:9px 8px;font:inherit;font-size:12.5px;color:var(--ink);cursor:pointer;text-align:left;
  display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.phcell b{font-size:12px;color:var(--smoke)}
.phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,var(--paper) 4px 8px)}
.phcell.taken,.phcell.lit{box-shadow:inset 0 0 0 2px var(--rust)}

@media (max-width:760px){.rail .track.two{grid-template-columns:1fr}.rail>.reading{grid-column:1}}
</style>
<script>
/* =========================================================================
   WHERE rail — "on the aircraft".  Replaces ZONE_ORDER / buildZones / acSVG /
   zonenoteHTML / bodyWhere by redeclaration (paste AFTER the old ones), and
   adds the legend, reading sentence, phone grid, aim text and the
   row -> aircraft reverse link.

   THE TRAP, FIXED: the API's zone codes are PREFIXED — 'ZONE 200', never
   '200'.  Every Map key, every data-aim/data-take and every filter value
   therefore carries the prefix, so the server accepts zone=ZONE%20200 and
   the counts land on the shapes.
   ========================================================================= */

/* fixed order from the server's _ZONE_ORDER: frequency-ish, NOT numeric,
   NOT re-sorted here; legend ties keep this order (stable sort) */
const WHERE_ZONE_ORDER=["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500",
                        "ZONE 600","ZONE 400","ZONE 700","ZONE 900"];

/* 'ZONE 200' | 'ZN 200' | 'zone 200' -> 'ZONE 200'; ZONE 000 and junk -> null */
const zNorm=v=>{const m=/^Z(?:ONE|N)?\s*([1-9])00$/i.exec(String(v==null?"":v).trim());
  return m?("ZONE "+m[1]+"00"):null};

const whereD=()=>HERO.raw||HERO||{};
const zByCode=c=>(HERO.zones||[]).find(z=>z.code===c)||null;
const zCount=c=>{const z=zByCode(c);return z?(+z.n||0):0};
const zLabel=c=>{const z=zByCode(c);
  return (z&&z.label)?z.label:("ZONE "+String(c).replace(/^ZONE\s+/i,""))};

/* THE RAMP — one function, no second colour.  Linear in the raw count,
   rescaled on EVERY render against the current selection's own busiest
   zone; pure opacity of --rust #c44b28 over --paper #f7f5f0. */
const zMax=()=>Math.max(1,...(HERO.zones||[]).map(z=>+z.n||0));
const zFill=(n,mx)=>`rgba(196,75,40,${(0.10+0.80*(n/mx)).toFixed(3)})`;

function buildZones(){
  const src=(HERO.raw&&HERO.raw.zones)?HERO.raw.zones:facetVals("zone");
  const by=new Map();
  (src||[]).forEach(z=>{
    const code=zNorm(z.code??z.zone??z.value);
    if(!code)return;                                  /* ZONE 000 never enters */
    by.set(code,{code,n:+(z.n??z.count??0)||0,label:String(z.label??z.name??"")});
  });
  /* the label the API sends is authoritative (the FAA's own code table);
     glossary, then "ZONE xxx", only for a facet that shipped no label */
  return WHERE_ZONE_ORDER.map(c=>{
    const z=by.get(c), bare=c.slice(5);
    return {code:c,n:z?z.n:0,
            label:(z&&z.label)?z.label:(zoneGloss(bare)||("ZONE "+bare))};
  });
}

function acSVG(){
  const mx=zMax(), taken=params().get("zone");
  const f=c=>zFill(zCount(c),mx);
  /* the aircraft only ever renders inside the open rail, so tabindex is 0 */
  const atr=c=>`class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"`;
  /* the trailing-b strip lets ONE zone be two disjoint paths: "ZONE 300b"
     never comes from the API — it resolves to ZONE 300 and shares
     fill/aim/take/tabindex/label, while staying its own Tab stop */
  const shape=(c0,d)=>{const c=c0.replace(/b$/,"");
    return `<path d="${d}" fill="${f(c)}" stroke="#7c746a" stroke-width="1.1" ${atr(c)}/>`};
  return `<svg viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it">`
    +shape("ZONE 100","M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z")
    +shape("ZONE 200","M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z")
    +shape("ZONE 300","M452 44 L492 7 L518 7 L523 41 Z")
    +shape("ZONE 300b","M512 48 L578 38 L580 47 L516 57 Z")
    +shape("ZONE 500","M236 87 L356 87 L318 108 L264 108 Z")
    +shape("ZONE 600","M262 80 L344 80 L322 90 L284 90 Z")
    +`<ellipse cx="248" cy="99" rx="24" ry="9.5" fill="${f("ZONE 400")}" stroke="#7c746a" stroke-width="1.1" ${atr("ZONE 400")}/>`
    /* struts are ONE two-subpath path in strut grey, unfilled, UNSHADED;
       only the three wheels take the zone fill */
    +`<g ${atr("ZONE 700")} stroke="#7c746a"><path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/><circle cx="118" cy="109" r="6" fill="${f("ZONE 700")}"/><circle cx="281" cy="111" r="7" fill="${f("ZONE 700")}"/><circle cx="297" cy="111" r="7" fill="${f("ZONE 700")}"/></g>`
    +`<g ${atr("ZONE 800")} stroke="#7c746a">${[96,190,348,424].map(x=>`<rect x="${x}" y="49" width="11" height="17" rx="3" fill="${f("ZONE 800")}"/>`).join("")}</g>`
    +`<g ${atr("ZONE 900")} stroke="#7c746a">${[122,372].map(x=>`<rect x="${x}" y="51" width="22" height="14" rx="3" fill="${f("ZONE 900")}"/>`).join("")}</g>`
    /* windows: decoration, drawn LAST so they sit above the shading, and
       pointer-events:none so they never swallow a hover meant for the crown */
    +`<g fill="#f7f5f0" stroke="none" opacity=".8" pointer-events="none">${[150,164,220,234,248,300,314,328,400,414].map(x=>`<rect x="${x}" y="54" width="6" height="7" rx="2"/>`).join("")}</g>`
    +`</svg>`;
}

function zonesDesc(){
  const zs=(HERO.zones||[]).map((z,i)=>({z,i}));
  zs.sort((a,b)=>((+b.z.n||0)-(+a.z.n||0))||(a.i-b.i));  /* stable: ties keep WHERE_ZONE_ORDER */
  return zs.map(x=>x.z);
}

function legendHTML(){
  const D=whereD(), mx=zMax(), taken=params().get("zone");
  const rows=zonesDesc().map(z=>
    `<div class="lrow zone${taken===z.code?" taken":""}" data-aim="zone|${z.code}" data-take="zone|${z.code}" tabindex="0" role="button">`
    +`<i style="background:${zFill(z.n,mx)}"></i><span>${esc(z.label)}</span><b>${num(z.n)}</b></div>`).join("");
  /* pads carry data-aim but NO data-take: clicking one does nothing but
     leave the explanation on screen — they are unshadeable by construction */
  const pads=
    `<div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button"><i class="padi"></i><span>no location given</span><b>${num(+(D.no_location??0)||0)}</b></div>`
   +`<div class="lrow zone" data-aim="pad|outside" tabindex="0" role="button"><i class="padi"></i><span>place named in words, not as a zone</span><b>${num(+(D.other_location??0)||0)}</b></div>`;
  return rows+`<div class="lsplit"></div>`+pads;
}

/* This used to read 'the others never say where', which was false: they nearly all say
   where, in words the diagram cannot place. Only the blank ones say nothing, and they are
   about one report in twenty-seven, not four fifths of the file. */
/* Zonder deze zin leest de alinea als een reeks voorbehouden. De tekening is een steekproef,
   maar wel een die laat zien waar het meeste stukgaat. */
function zonenoteHTML(){
  const D=whereD();
  const placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0);
  const unz=D.unzoned!=null?+D.unzoned:Math.max(0,((+(D.total??TOTAL)||0))-placed);
  if(!(unz>0))return "";
  return `<div class="zonenote">The aircraft above counts only the ${num(placed)} reports that use one of the FAA's numbered zones. In another ${num(+(D.other_location??0)||0)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(+(D.no_location??0)||0)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.</div>`;
}

const wherePct=(a,b)=>b>0?(Math.round(a/b*1000)/10).toFixed(1):"0.0";

function whereReadingHTML(){
  const D=whereD(), zs=zonesDesc(), tot=+(D.total??TOTAL)||0;
  if(!tot||!zs.length)return "";
  const zoned=zs.reduce((s,z)=>s+(+z.n||0),0);
  const worded=+(D.other_location??0)||0, blank=+(D.no_location??0)||0;
  let t=`${esc(zs[0].label)} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${wherePct(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${wherePct(zoned,tot)}% of the selection.`;
  if(worded)t+=` Another ${num(worded)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.`;
  if(blank)t+=` Only ${num(blank)}, ${wherePct(blank,tot)}%, give no location at all.`;
  t+=` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.`;
  return `<div class="reading">${t}</div>`;
}

function whereVal(){
  const v=params().get("zone");
  if(!v)return "all zones";
  const z=zByCode(v);
  return (z&&z.label)?z.label:v;
}

function restWhere(){
  const taken=params().get("zone");
  const strip=zonesDesc().map(z=>
    `<span style="flex:${Math.max(1,z.n)}" title="${esc(z.label)}: ${num(z.n)}"${taken===z.code?' class="sel"':""}></span>`).join("");
  return `<div class="rail" data-rail="where" onclick="setHero('anatomy')">`
       +`<div class="gut rest"><span class="q">WHERE</span><span class="val">${esc(whereVal())}</span></div>`
       +`<div class="track"><div class="strip">${strip}</div></div></div>`;
}

function phZones(){
  const D=whereD(), mx=zMax(), taken=params().get("zone");
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],        /* spatial, NOT frequency-sorted */
              ["ZONE 500","ZONE 400","ZONE 600"],
              ["ZONE 300","ZONE 700","ZONE 900"]];
  const cell=c=>{const n=zCount(c);
    return `<button type="button" class="phcell${taken===c?" taken":""}" style="--f:${(0.10+0.80*(n/mx)).toFixed(3)}" data-aim="zone|${c}" data-take="zone|${c}" aria-label="${esc(zLabel(c))}, ${num(n)} reports">${esc(zLabel(c))}<b>${num(n)}</b></button>`};
  const pad=(k,txt,n)=>
    `<button type="button" class="phcell pad" data-aim="pad|${k}" aria-label="${esc(txt)}">${esc(txt)}<b>${num(n||0)}</b></button>`;
  return `<div class="phgrid">${grid.flat().map(cell).join("")}`
       +pad("nowhere","no location given",+(D.no_location??0)||0)
       +pad("outside","place named in words, not as a zone",+(D.other_location??0)||0)
       +`</div>`;
}

function bodyWhere(){
  const narrow=window.matchMedia&&matchMedia("(max-width:760px)").matches;
  if(narrow)return `<div class="track">${phZones()}</div>`;  /* no reading, no zonenote on the phone */
  return `<div class="track two">${acSVG()}<div>${legendHTML()}${zonenoteHTML()}</div></div>`
       +whereReadingHTML();
}

/* row -> aircraft.  A row's data-zone comes from
   (PartLocation||"").toUpperCase().match(/^ZONE \d00/) and that client regex
   is stricter than the server's: it needs the literal word "ZONE ", so a row
   reading "ZN 100 FUS LOWER" lights nothing even though the server counted it. */
function heroMark(row){
  const v=row&&(row.dataset?row.dataset.zone:(row.getAttribute?row.getAttribute("data-zone"):null));
  const m=/^ZONE \d00/.exec(String(v==null?"":v).toUpperCase());
  unmarkZones();
  if(m)document.querySelectorAll(`[data-take="zone|${m[0]}"],[data-aim="zone|${m[0]}"]`)
    .forEach(n=>n.classList.add("lit"));  /* querySelectorAll on purpose: aircraft AND legend, both ZONE 300 paths */
}
function unmarkZones(){
  document.querySelectorAll(".zone.lit,.lrow.lit,.phcell.lit").forEach(n=>n.classList.remove("lit"));
}

function whereAim(key){
  if(key&&key.slice(0,5)==="zone|"){
    const c=key.slice(5);
    const placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0); /* recomputed from zones, never read off unzoned */
    return `${esc(zLabel(c))} &middot; ${num(zCount(c))} of ${num(placed)} placed findings &middot; click to narrow`;
  }
  const D=whereD();
  if(key==="pad|nowhere")return `${num(+(D.no_location??0)||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`;
  if(key==="pad|outside")return `${num(+(D.other_location??0)||0)} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`;
  return null;
}

/* hover/focus aim, delegated on document, installed once.  Clicks and keys
   are deliberately NOT bound here: the page's own takeFor delegation already
   fires (it is what produced the rejected zone=100 request), and a second
   binding would run every search twice and break history-based undo. */
if(!window.__WHERE_AIM__){
  window.__WHERE_AIM__=true;
  const hit=e=>{
    const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n||(e.relatedTarget&&n.contains(e.relatedTarget)))return;
    const t=whereAim(n.getAttribute("data-aim"));
    if(t!=null)aim(t);
  };
  const miss=e=>{
    const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n||(e.relatedTarget&&n.contains(e.relatedTarget)))return;
    if(whereAim(n.getAttribute("data-aim"))!=null)aim("");
  };
  document.addEventListener("pointerover",hit);
  document.addEventListener("pointerout",miss);
  document.addEventListener("focusin",hit);
  document.addEventListener("focusout",miss);
}

/* phone <-> aircraft swap without a reload */
try{
  const mq=matchMedia("(max-width:760px)");
  const swap=()=>{if(typeof drawHero==="function"&&document.querySelector('.rail.open[data-rail="where"]'))drawHero()};
  if(mq.addEventListener)mq.addEventListener("change",swap);
  else if(mq.addListener)mq.addListener(swap);
}catch(_){}
</script>
```

**Departures from the specification**

- **The constant is named `WHERE_ZONE_ORDER`, not `ZONE_ORDER`.** The old `const ZONE_ORDER` sits in the same top-level scope; redeclaring a `const` under the same name is a SyntaxError that would blank the entire script. The values are exactly the spec's `_ZONE_ORDER`. The old `ZONE_ORDER`, `ZONE_DESC` and `zoneDesc` become unreferenced — delete them when convenient.
- **`pointer-events="none"` added to the windows group.** The spec says the windows are "no interaction", but as drawn the paper rects would intercept hovers over the crown beneath; the attribute makes that literal. All stated attributes survive.
- **The phone grid also gets the two pad cells.** The spec's 3×3 lists only zones yet defines `.phcell.pad`; I append the two pads (data-aim, no data-take) so the "cannot be drawn" explanation survives on the phone.
- **`.lrow.lit` / `.phcell.taken` / `.phcell.lit` styles added.** The spec requires a zone to light "on the aircraft AND in the legend at once" but supplies no lit/taken styling for rows and cells.

**Wiring notes (not departures)**

- Functions keep their old names (`buildZones`, `acSVG`, `zonenoteHTML`, `bodyWhere`), so this block overrides them by redeclaration — it must sit *after* the old definitions in the same classic script. If an old `heroMark` exists as a `const`, delete that binding; call `unmarkZones()` wherever the old code cleared highlights.
- Aim is bound once (guarded); if your dispatcher already resolves `zone|`/`pad|` keys, point its cases at `whereAim()` and drop the guarded block.
- The closed-gutter val resolves from `HERO.zones` (the API label) rather than `code("part_location",v)` — same end, label stays authoritative; `whereVal()` is exported if the open gutter wants it too.
- `HINTS.zone` still says "a zone, e.g. 300"; change it to "e.g. ZONE 300", or typed searches will be rejected exactly as the bare-code filter was.

**Checks against the live numbers (all computed at render, none hard-coded):** alphas come out 0.900 / 0.677 / 0.317 / 0.204 / 0.201 / 0.187 / 0.161 / 0.139 / 0.131 — ZONE 200 darkest, nine distinct steps. Clicking the crown emits `data-take="zone|ZONE 200"` → `zone=ZONE%20200` → 84,453. Placed sums to 212,940, so the sentence opens "Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA’s numbered zones, or 39.7%", then 12.1% of the selection, another 1,454,504, and only 90,383, 5.1%.