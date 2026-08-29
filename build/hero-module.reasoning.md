The user wants one self-contained JS module exporting `drawZHero(box, kind, data)`. Four kinds: horizon, anatomy, swarm, ledger. Data shape from /z/api/entity. Rules: reuse parent's shapes (SVG paths for the aircraft zones), note partial coverage under the hero, `complete:false` → "count is from the sample read", vanilla JS, CSS as injected string.

I should mirror the parent tool's idiom: the "instrument" look, rails, ash vs rust, gutter labels (q/pn), data-aim/data-take attributes, margin notes. But it's a module that can't call parent's helpers (el, num, esc, aim...). I must write my own helpers with distinct names to avoid clobbering globals. Use local scope: wrap in IIFE and attach `window.drawZHero`.

Key requirements:
- kinds:
  - horizon: the timeline (when.months) — a strip of months, drag or click? Keep simple: bars per month, clicking... but this module draws a hero for an entity page (/z page = one tail/operator/make). So the hero shows that entity's distribution. Take marks maybe not needed; but "in the parent tool's own shapes". Provide clickable months? The parent's drawHero uses data-take etc. For the /z entity page, probably the hero just presents. I'll make marks hoverable with a caption line (the "aim" sentence) implemented locally.
  - anatomy: the aircraft zone map (where.zones) + systems; partial coverage: zones rows have complete flag; if complete:false say "count is from the sample read"; also where no zone given — we don't have no_location in this shape... we have counted vs total? `where.zones {complete, counted, rows}` — counted is number placed. If counted < total reports? We don't know total from data... there is framing.total. Use framing.total as the selection total. So partial placement: counted of total → write underneath "N of M reports say where on the aircraft". Also complete:false → "the count is from the sample read".
  - swarm: who.operators / who.aircraft / who.types ladders.
  - ledger: forced.actions + forced.none, plus framing.on_ground/total.

- Aircraft SVG: "Reuse its SVG paths for the aircraft." The parent's zone grid in phZones is a 3x3 grid of ZONE 100..900. The parent also has `.zone` SVG paths but we weren't given the path data. So reuse the 3×3 zone grid shape (that's the shape given). I'll draw the zone grid as buttons in a 3x3 grid like phZones, with fill intensity by count. That's the "same shapes". For anatomy maybe also systems list beside.

- CSS string injected once with a guard.

- Palette: use CSS variables var(--ink), var(--ash), var(--rust) with fallbacks, matching parent. Provide fallback values.

- Number formatting like num(): toLocaleString("en").

- Margin notes: parent pushes caveats into a `.margin` with `.rustnote`? Keep simple: a caveat line under blocks: "the count is from the sample read" when complete:false; "N of M reports placed a zone; the rest name a place in words or nothing" — but data shape doesn't give no_location; we can compute total - counted if framing.total known. But careful: counted may only be zones counted; systems separate. I'll only claim placement coverage for zones.

- Under 900 lines. Aim for ~500-600.

Structure:

```js
(function(){
const CSS = `...`;
let styled=false;
function ensureCSS(){...}
// helpers: esc, num, maxOf, pct
const V=(name,fallback)=>...
function drawZHero(box,kind,data){ ensureCSS(); ... }
window.drawZHero=drawZHero;
})();
```

Render functions per kind returning HTML strings, plus a shared head (stamp? The parent has stamp "FAA SERVICE DIFFICULTY REPORTS · range"). We don't know the range in data... we could derive from months min/max for horizon. Keep a header with entity label? We don't have entity name in data. Hmm — kind and data only. Derive heading from kind: e.g. "THE PERIOD", "ON THE AIRCRAFT", "AIRLINE AND AIRFRAME", "WHAT IT FORCED" — matching parent's rail labels: "WHEN", "WHERE", "WHO", "WHAT IT FORCED".

Layout: an `.zinstrument > .zipad` mirroring `.instrument > .ipad`, `.ihead`, `.sentence`, `.rails` with `.rail` rows using gutter q/pn.

Hover behavior: data-aim attributes handled by parent? Parent has global mouseover for [data-aim] calling aimTextFor which needs heroData — not our data. So implement local hover: delegate within box, set caption `.zaim` text. Keep simple: a caption element updated on mouseover of [data-zaim].

Coverage notes ("written underneath it, in the same size type, exactly as the parent does"): parent's `.zonenote` is 11.5px #5f584f. Use class `.znote` styled similarly. For complete:false: "count is from the sample read" — rule says "say the count is from the sample read". Exact-ish phrasing: "The count is from the sample read, not the whole file." I'll phrase: `${num(counted)} reports place a zone; the count is from the sample read, not the whole file.`

Zones grid: parent grid order:
["ZONE 800","ZONE 200","ZONE 100"],
["ZONE 500","ZONE 400","ZONE 600"],
["ZONE 300","ZONE 700","ZONE 900"]
Fill --f intensity 0.10+0.80*(n/mx). Count from rows keyed by code "ZONE 200" etc.

Systems: ATA chapters list as ladder rows (like phLadder): label, bar, count.

Horizon: months strip — bars with heights scaled, month labels "95-04"→"Apr 95"? Parent shows m.m.slice(5) on phone. For desktop rails, unknown; I'll show short label `MON YY`. Bars: `<i>` selected vs all — here n only. Use `.strip`/`.mo` shapes? Parent `.mo` has data-aim. I'll make buttons with bar + label, min-width 5px, container overflow-x auto like parent's when track.

Swarm: three ladders (operators, aircraft, types), each with coverage note if complete:false. Also cap note? Data doesn't give totals beyond counted. rows counted field: for who.operators {complete, counted, rows}. If counted > rows sum? Rows may be top-N. counted = number counted in sample. So note: "the list shows the N most-reported of M" when rows sum < counted. And complete:false → sample read note.

Ledger: forced.actions ladder + "forced none" — n reports where crew took no action... forced.none int. framing.on_ground / framing.total: "on the ground" share. Draw: block bar like phblock: width % of on_ground/total. Ledger = "WHAT IT FORCED". Actions ladder + none row + framing.

Sentence at top: parent uses sentenceHTML. I'll craft per kind a sentence: e.g. horizon: "Reading N reports across M months." anatomy: "N findings, K placed in a zone." Use framing.total as total when present else computed.

Total: define `const total = data.framing && data.framing.total` fallback to sums.

Empty states: if no rows, show "nothing drawn here".

Also the `zero` concept not needed.

Keep keyboard/a11y modest: buttons with aria-labels.

CSS: namespace with `zhero` prefix classes. Inject via `<style data-zhero>`.

Let me write it. Watch line count (<900). Aim concise.

Colors: rely on parent vars: `var(--ink,#1f1c18)`, `var(--ash,#8a8377)`, `var(--rust,#b4552d)`, `var(--rust-text,#b4552d)`, background `#f2eee6` / paper `#faf8f3`. Fonts: Archivo / IBM Plex Mono with fallbacks.

Grid layout for rails: `.zrail{display:grid;grid-template-columns:110px 1fr;gap:12px}` matching parent.

Write the module.

Months label: `monthLabel("1995-04")` → "Apr 1995" using MONTHS array.

Hover caption: one `.zaim` div under the head, default text = hand hint per kind. On mouseover of [data-zaim], show its text; mouseout restores default. Also focusin.

Ladder builder shared.

Edge: months may be sparse ("every month in the selection") — fine.

Horizon drag? Parent's signature gesture is drag; but this module standalone — implement click? Keep hover/caption only plus maybe click selects nothing (no action available). I'll make months non-interactive buttons? Better: plain divs with data-zaim (not buttons) since there's nothing to take on the /z page. But swarm ladders could link? No route given. Keep non-committal: use `data-zaim` on divs/spans, cursor:default, except keep them focusable? Simpler: spans.

Actually rule: "Where a hero can only place part of the selection, write that underneath it, in the same size type, exactly as the parent does." So the note goes under the hero block. Implementation: each block function returns {html, note} or appends note inside.

Partial placement for anatomy: placed = zones.counted (or sum of rows? counted is the placed count). unplaced = total - placed (if total known) → note: "K of N findings are placed in a zone; the rest name a place in words or none." Hmm we don't know the split; safer: "Z of N reports place a zone; the rest are not drawn here." Plus complete:false adds "The count is from the sample read."

For horizon, months cover every month in the selection — full. But maybe partial month at the end? No data for that. Skip.

For swarm, if complete:false or rows summed < counted → notes.

Ledger: actions + none should sum to ~total; if sum < total, note "N of M reports record no crew action"? forced.none is that. So draw a bar: actions stacked? Parent's fblock: `d.crew_reports/d.total` bar. I'll draw: a block bar "K of N forced the crew to act" with width, then actions ladder, then "no crew action: none count" row.

framing: "on_ground of total were already on the ground" — a note line in ledger or horizon? It fits ledger or anatomy. Put in ledger as a sub-line.

Let me now write code carefully.

```js
/* zhero.js — hero panels for the /z entity pages ... */
(function(){
"use strict";
const CSS = `
.zinstrument{...}
...
`;
let _css=false;
function css(){ if(_css)return; _css=true; const s=document.createElement("style"); s.setAttribute("data-zhero",""); s.textContent=CSS; document.head.appendChild(s); }

const MONTHS=["","January",...];
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>Number(n||0).toLocaleString("en");
function monthLabel(m){const [y,mo]=String(m).split("-");return (MONTHS[+mo]||m)+" "+y}
function shortMonth(m){const [y,mo]=String(m).split("-");return (MONTHS[+mo]||m).slice(0,3)+" "+String(y).slice(2)}
const rowsOf=b=>(b&&b.rows)||[];
const sumRows=b=>rowsOf(b).reduce((s,r)=>s+(+r.n||0),0);
const totalOf=d=>(d.framing&&+d.framing.total)||0;

function gutter(q,pn){return `<div class="zgut"><div class="q">${esc(q)}</div>${pn?`<div class="pn">${esc(pn)}</div>`:""}</div>`}

function coverage(b,label){ // note under a block
  const notes=[];
  if(b&&b.complete===false)notes.push(`the ${esc(label)} count is from the sample read, not the whole file`);
  const c=+((b&&b.counted)||0), s=sumRows(b);
  if(c>s)notes.push(`the list shows the ${num(s)} most-reported of ${num(c)}`);
  return notes.length?`<div class="znote">${notes.join("; ")}.</div>`:"";
}
```

Wait: rule says "Where a block carries complete:false, say the count is from the sample read." Good.

If counted equals rows sum, no note. If total>counted for zones: "Z of N reports name a zone; the rest are not drawn here." Handle in anatomy.

Ladder:

```js
function ladder(list,mx,takeKind){
  return `<div class="zladder">`+list.map(r=>
   `<div class="zrow" data-zaim="${esc(r.label)} · ${num(r.n)} reports">
      <span class="zl">${esc(r.label)}</span>
      <span class="zb"><i style="width:${(mx? r.n/mx*100:0).toFixed(1)}%"></i></span>
      <b>${num(r.n)}</b></div>`).join("")+`</div>`;
}
```

Horizon:

```js
function railHorizon(d){
  const ms=(d.when&&d.when.months)||[];
  const mx=Math.max(1,...ms.map(m=>+m.n||0));
  const n=ms.reduce((s,m)=>s+(+m.n||0),0);
  const body = ms.length ? `<div class="zstrip" role="img" aria-label="...">`+
    ms.map(m=>`<div class="zmo${partial?}" data-zaim="${monthLabel(m.month)} · ${num(m.n)} reports">
      <i style="height:${(m.n/mx*46).toFixed(1)}px"></i><span>${shortMonth(m.month)}</span></div>`).join("")+`</div>`
    : `<div class="zempty">no month in this selection holds a report</div>`;
  ...
}
```

Head sentence per kind:

- horizon: `Reading ${num(n)} reports across ${ms.length} months.` (n = sum)
- anatomy: `${num(placed)} of ${num(total)} reports name a zone.` careful with wording.
- swarm: operators/aircraft/types.
- ledger: `${num(forced)} of ${num(total)} forced the crew to act.`

Framing on_ground → ledger note: `${num(on)} of ${num(total)} were already on the ground when it happened.`

Anatomy body: zones grid + systems column. Use `.ztrack.two{display:grid;grid-template-columns:1fr 330px;gap:18px}` mirroring parent's `.track.two`.

Zones grid HTML with keys:

```js
const GRID=[["ZONE 800","ZONE 200","ZONE 100"],["ZONE 500","ZONE 400","ZONE 600"],["ZONE 300","ZONE 700","ZONE 900"]];
```

each cell `<div class="zcell" style="--f:..." data-zaim="..."><span>label</span><b>n</b></div>`.

If zones.complete===false → note; if counted < total → "…of N reports place a zone; the rest are not drawn here."

Counted for zones: b.counted. But maybe counted is number of reports with a place. I'll treat: placed = counted || sumRows. unplaced = total - placed.

Notes under zones block:

```js
function zoneNote(d,z){
  const total=totalOf(d);
  const placed=+(z.counted||0)||sumRows(z);
  const a=[];
  if(z.complete===false)a.push("the count is from the sample read, not the whole file");
  if(total&&placed<total)a.push(`${num(placed)} of ${num(total)} reports name a zone; the rest say where in words, or nothing, and are not drawn here`);
  return a.length?`<div class="znote">${a.join("; ")}.</div>`:"";
}
```

Hmm the rule wording: "say the count is from the sample read" — good.

Swarm: three sub-ladders with headers "AIRLINES", "AIRFRAMES", "TYPES" using pn style. Notes per block via coverage().

Ledger body: fblock bar + actions ladder + none row + framing note.

Header: stamp line "FAA SERVICE DIFFICULTY REPORTS" — the parent includes that; for /z entity page maybe keep the same stamp. I'll include a stamp with just "FAA SERVICE DIFFICULTY REPORTS" (no range known) — or derive range from months for horizon. I'll derive if months exist: `stamp = first month + " to " + last month` uppercase. Fine.

Kind labels (gutter): horizon→"WHEN", anatomy→"WHERE", swarm→"WHO", ledger→"WHAT IT FORCED". pn sublabels: "month by month", "on the aircraft", "airline and airframe", "what the crew did".

Assemble:

```js
function drawZHero(box,kind,data){
  css();
  if(!box)return;
  const d=data||{};
  const RAILS={horizon:["WHEN","month by month",railHorizon],
               anatomy:["WHERE","on the aircraft",railAnatomy],
               swarm:["WHO","airline and airframe",railSwarm],
               ledger:["WHAT IT FORCED","what the crew did",railLedger]};
  const r=RAILS[kind]; if(!r){box.innerHTML="";return}
  const [q,pn,fn]=r;
  box.className="zinstrument";
  box.innerHTML=`<div class="zipad">
    <div class="zihead"><div class="zstamp">FAA SERVICE DIFFICULTY REPORTS${stamp(d)}</div></div>
    <div class="zsentence">${sentence(kind,d)}</div>
    <div class="zaim" data-default="${...}">...</div>
    <div class="zrail"><div class="zgut"><div class="q">${esc(q)}</div><div class="pn">${esc(pn)}</div></div>
      <div class="ztrack">${fn(d)}</div></div>
  </div>`;
  wireAim(box);
}
```

Actually parent has multiple rails; here one hero per kind so one rail. Fine.

wireAim: delegate mouseover/mouseout/focusin on [data-zaim], writing to `.zaim` with default restore.

Default aim text per kind (the "hand"): e.g. "Point at anything on the instrument to read what it counts." Good.

Empty guard: if data empty (no months, no rows), sentence "Nothing to draw."

CSS (namespace zh-? I used z prefix classes: zinstrument, zipad, zihead, zstamp, zsentence, zaim, zrail, zgut, ztrack, znote, zladder, zrow, zl, zb, zstrip, zmo, zmap, zcell, zsub, zempty, zfblock). Keep sizes like parent: q 600 11px Archivo letter-spacing .08em; pn 9.5px ash; note 11.5px #5f584f; bars use rust for fill? Parent's selected bars presumably rust. Use `background:var(--rust,#b4552d)` for bar fills, track `#e3ddd0`. Strip bars: unselected strip ash `#c9c1b2`? At rest corpus stands in ash; rust reserved for selection. This hero is for a fixed entity selection... it *is* a selection. Parent phone uses bars with `<i>` presumably rust. I'll use rust for fills — it's the chosen entity. Reasonable.

zcell fill: `background:rgba(181,85,45,var(--f))`? Parent used `--f` with color-mix? It set style="--f:0.53" and CSS presumably `background:color-mix(...)`. I'll do `background:rgba(180,85,45,var(--f,0.1))` — rgba with var alpha works in modern browsers? `rgba(180,85,45,var(--f))` is valid CSS. Yes.

Also keyboard focusability: make rows/cells tabindex="0" so focusin shows aim? Parent supports keyboard. I'll add tabindex="0" to cells and rows with role="img"? Keep light: give `tabindex="0"` to .zcell and .zrow, plus :focus-visible outline var(--ink).

Line count check: should be fine (~350 lines).

Sentence functions:

horizon: `const ms=...; const n=sum; ms.length? \`Reading ${num(n)} reports across ${ms.length} month${s}.\` : "No report in this selection carries a month."`

anatomy: placed/total.

swarm: counts of operators/aircraft/types: `Drawn from ${num(o)} operator${..}, ...`? Simpler: `${num(ops.counted)} operators, ${num(air.counted)} airframes and ${num(typ.counted)} types appear in this selection.` Hmm counted might be sample count. Fine.

ledger: `${num(total-none)} of ${num(total)} reports record something the crew had to do.` — forced.actions sum vs none. forcedN = sumRows({rows:actions}). Use actions array directly.

stamp(d): from months min/max: ` · ${monthLabel(first).toUpperCase()} TO ${monthLabel(last).toUpperCase()}`.

Let me also handle partial months? Can't detect without range; skip.

Anatomy systems: if where.systems rows exist, column "ATA CHAPTER" ladder.

Also aircraft "reuse its SVG paths" — we don't have the paths; the given shape in the parent (phone) is the 3×3 zone grid, so reuse that. Also add pads? Parent has pads for no-location/other-location; our data lacks those counts, but unplaced = total - counted covers it; I could add a pad cell "no zone drawn" with unplaced count — that mirrors parent's pads shape and satisfies "where a hero can only place part of the selection, write that underneath it". Do both: pad cell + note underneath. Pad cell label: "no zone drawn" with unplaced.

Write final module now, carefully.

Also expose as window.drawZHero; comment header.

CSS draft:

```
.zinstrument{margin:0}
.zipad{background:var(--paper,#faf8f3);border:1px solid #ddd6c8;border-radius:10px;padding:16px 18px 14px;font:14px/1.45 Archivo,system-ui,sans-serif;color:var(--ink,#1f1c18)}
.zihead{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px}
.zstamp{font:600 10px/1.4 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash,#8a8377)}
.zsentence{font-size:16px;line-height:1.4;margin:2px 0 4px}
.zaim{min-height:18px;font:11.5px/1.45 'IBM Plex Mono',monospace;color:var(--rust-text,#b4552d);margin:2px 0 10px}
.zrail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;border-top:1px solid #e4ddcf;padding-top:9px}
.zgut .q{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ink,#1f1c18)}
.zgut .pn{font-size:9.5px;color:var(--ash,#8a8377)}
.ztrack{min-width:0}
.znote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px dashed #e0d8c9}
.zempty{font-size:12px;color:var(--ash,#8a8377)}
/* horizon */
.zstrip{display:flex;align-items:flex-end;gap:2px;overflow-x:auto;min-height:64px;padding-bottom:2px}
.zmo{flex:1 0 auto;min-width:5px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px}
.zmo i{display:block;width:100%;background:var(--rust,#b4552d)}
.zmo span{font:9px/1 'IBM Plex Mono',monospace;color:var(--ash,#8a8377);writing-mode:vertical-rl?}
```

Hmm many months since 1995 could be ~360 months. Vertical labels would be too tall; parent desktop unknown. Use rotate? Simpler: show label only for January months (year ticks): span shows "’95" when month ends with "-01", else empty. And title attr. That keeps strip compact. And zmo min-width 5px like parent. On hover the aim caption shows full month. Good — data-zaim covers it.

But flex 1 0 auto with min-width 5px: with many months, container scrolls. OK. Actually parent: `.rail.open[data-rail=when] .mo{min-width:5px}` and overflow-x:auto; also auto-scrolls to right end. I'll do same: after render, scroll strip to right (newest at right? months ascending presumably; parent scrolls to end). I'll scrollLeft=scrollWidth.

Cells:

```
.zmap{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:330px}
.zcell{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:6px;min-height:64px;padding:8px;border:1px solid rgba(180,85,45,.35);background:rgba(180,85,45,var(--f,.08));border-radius:4px;cursor:default}
.zcell span{font:600 9.5px/1.2 Archivo...;letter-spacing:.06em}
.zcell b{font:11px 'IBM Plex Mono';text-align:right}
.zcell:hover,.zcell:focus-visible{border-color:var(--rust);border-width:2px? } 
```

Parent hover: stroke rust 2.2. Use outline or box-shadow inset. Keep border-color change + font? fine.

Pads:

```
.zmap.pads{margin-top:6px}
.zcell.pad{min-height:40px;background:none;border-style:dashed}
```

Ladder:

```
.zladder{display:flex;flex-direction:column;gap:3px}
.zrow{display:grid;grid-template-columns:minmax(60px,190px) 1fr 60px;gap:10px;align-items:center;padding:2px 0}
.zrow .zl{font-size:11.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zrow .zb{display:block;height:8px;background:#eae4d6;border-radius:2px;overflow:hidden}
.zrow .zb i{display:block;height:100%;background:var(--rust,#b4552d)}
.zrow b{font:11px 'IBM Plex Mono';text-align:right;font-weight:400;color:var(--ink)}
.zsub{font:600 10px/1 Archivo;letter-spacing:.08em;color:var(--ash);margin:10px 0 5px}
.zsub:first-child{margin-top:0}
```

fblock:

```
.zfblock{position:relative;display:block;height:22px;background:#eae4d6;border-radius:3px;overflow:hidden;margin-bottom:8px}
.zfblock i{position:absolute;inset:0 auto 0 0;background:var(--rust)}
.zfblock span{position:absolute;inset:0;display:flex;align-items:center;padding:0 8px;font:11px 'IBM Plex Mono';color:var(--ink)}
```

Two-column track: `.ztrack.two{display:grid;grid-template-columns:1fr 330px;gap:18px}` and media query collapse.

OK, writing final. Also `wireAim`:

```js
function wireAim(box){
  const cap=box.querySelector(".zaim"); if(!cap)return;
  const def=cap.getAttribute("data-default")||"";
  const show=t=>{cap.innerHTML=t};
  box.addEventListener("mouseover",e=>{
    const t=e.target.closest&&e.target.closest("[data-zaim]");
    if(t)show(t.getAttribute("data-zaim"));
  });
  box.addEventListener("mouseout",e=>{
    if(e.target.closest&&e.target.closest("[data-zaim]"))show(def);
  });
  box.addEventListener("focusin",e=>{
    const t=e.target.closest&&e.target.closest("[data-zaim]");
    if(t)show(t.getAttribute("data-zaim"));
  });
  box.addEventListener("focusout",()=>show(def));
}
```

data-zaim values are HTML-escaped strings with entities; setting via innerHTML is fine.

But note data-zaim attributes contain `&middot;` etc — attribute escaped with esc() — when read via getAttribute it returns decoded "·". Then show(t) sets innerHTML — plain text fine. OK; I'll just use " · " literal in attribute.

Ledger details:

```js
function railLedger(d){
  const f=d.forced||{}, fr=d.framing||{};
  const acts=(f.actions||[]);
  const total=totalOf(d)||sumRows({rows:acts})+(+f.none||0);
  const forced=sumRows({rows:acts});
  const none=+f.none||0;
  const mx=Math.max(1,...acts.map(a=>+a.n||0));
  const totalKnown=+(fr.total)||0;
  const onGround=+(fr.on_ground)||0;
  html = `<div class="zfblock" data-zaim="${num(forced)} of ${num(forced+none)} reports forced the crew to act">
      <i style="width:${(forced+none?forced/(forced+none)*100:0).toFixed(1)}%"></i>
      <span>${num(forced)} of ${num(forced+none)} forced a crew action</span></div>`
    + ladder(acts,mx)
    + (none?row for none: "")
    + coverage-ish note + on-ground note.
}
```

None row: a zrow with label "no crew action", bar 0 or proportional? Give it bar width none/mx. Include data-zaim.

Notes: if f.complete===false → sample note (forced block may carry complete? shape shows forced.actions and forced.none; maybe complete flag exists). Apply coverage(f,"forced") too. framing note: `${num(onGround)} of ${num(totalKnown)} were already on the ground when it happened.` if both present.

Swarm:

```js
function railSwarm(d){
  const w=d.who||{};
  const sec=(b,title,unit)=> b && rowsOf(b).length ?
    `<div class="zsub">${esc(title)}</div>`+ladder(rowsOf(b),mx(b))+coverage(b,title.toLowerCase()) : "";
}
```

coverage for swarm: complete false → "the count is from the sample read, not the whole file"; counted>sumRows → "the list shows the N most-reported of M".

Also add tail unit note? fine.

Anatomy:

```js
function railAnatomy(d){
  const w=d.where||{};
  const z=w.zones||{rows:[]}, s=w.systems||{rows:[]};
  const by={}; rowsOf(z).forEach(r=>by[r.code]=r);
  const mx=Math.max(1,...rowsOf(z).map(r=>+r.n||0));
  const cells=GRID.map(c=>{const r=by[c]||{code:c,label:c,n:0}; ...});
  pads: unplaced.
  systems column: `<div class="zsub">ATA CHAPTER</div>`+ladder+coverage(s,"system")
}
```

unplaced = total - placed where total=totalOf(d), placed=z.counted||sumRows(z). Only if total>placed>... if total unknown, skip pad? Pad always shows if unplaced>0.

Zone gutter pn: "on the aircraft".

Horizon label ticks: label months where slice(5)==="01" → year `'95`:

```js
const lbl = m.month.slice(5)==="01" ? `<span>${esc("’"+m.month.slice(2,4))}</span>` : `<span class="tick"></span>`;
```

Actually keep a span always for consistent height, with tick style (small dash). `.zmo span.tick{width:4px;height:1px;background:#c9c1b2}`. Simpler: span text "".

Also aria-label on strip.

Sentence for horizon uses sum of months.

Now finalize sentence():

```js
function sentence(kind,d){
  const total=totalOf(d);
  if(kind==="horizon"){
    const ms=(d.when&&d.when.months)||[];
    const n=ms.reduce((s,m)=>s+(+m.n||0),0);
    return ms.length?`Reading ${num(n)} reports across ${num(ms.length)} months.`:`No month in this selection holds a report.`;
  }
  if(kind==="anatomy"){
    const z=(d.where&&d.where.zones)||{};
    const placed=+(z.counted||0)||sumRows(z);
    return total&&placed<total?`${num(placed)} of ${num(total)} reports say where on the aircraft; this is where.`:`Where on the aircraft the ${num(placed)} findings sit.`;
  }
  ...
}
```

Hmm keep simpler. anatomy: `${num(placed)} reports carry a zone.` swarm: `The ${num(opCounted)} airlines, ... ` maybe: "Who files and what they fly." Eh. Use: `${num(op.counted)} operator filings across ${num(ac.counted)} airframes.` If counts missing fallback sums.

ledger: `${num(forced)} of ${num(forced+none)} reports forced the crew to act.`

Default aim text ("hand"): kind-specific:
- horizon: "Point at a month to read its count. The strip runs oldest to newest."
- anatomy: "Point at a zone to read what was found there."
- swarm: "Point at an airline, an airframe or a type to read its count."
- ledger: "Point at an action to read how often the crew had to take it."

stamp(d): months first/last.

Alright, count lines — should be ~400. Write it out.

One more: "in the parent tool's own palette" — use vars with fallbacks; also `#f2eee6` background used by parent for spine; paper for ipad. Use --paper? Parent's page background unknown; ipad likely white-ish. I'll use `--paper,#faf8f3` and border `#e2dbcc`.

Media query for narrow: `@media(max-width:760px){.zrail{grid-template-columns:1fr}.ztrack.two{grid-template-columns:1fr}}` mirroring parent.

Also focus styles: `.zcell:focus-visible,.zrow:focus-visible{outline:2px solid var(--ink,#1f1c18);outline-offset:1px}`.

Write the module now. Ensure no name collisions: everything inside IIFE.

Data completeness checks: guard d.when missing etc.

Final code below.