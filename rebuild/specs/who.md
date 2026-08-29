# WHO / swarm rail — build specification

RAILS[2]: rail id "whose", heading WHO, subhead "airline and tail", hero key "swarm".
`?hero=swarm` opens it. Default hero is anatomy, not swarm.

## API fields, from GET api/hero
| field | shape | notes |
|---|---|---|
| operator_rows | [{o:"DESIGNATOR", n:int}] max 8, ordered n DESC then o ASC | counted over EVERY report, never from the capped airframe list. Blank designators excluded, so "no operator named" never appears as a row. |
| operators | int | COUNT(DISTINCT NULLIF(OperatorDesignator,'')) |
| swarm | [{t:"REG without leading N", o, op, n}] max 900 (SWARM_CAP), n DESC then t ASC | the rail uses only .t and .n |
| swarm_total | int | true uncapped airframe count |
| aircraft | int | same value as swarm_total |
| total | int | COUNT(*) of the selection |

Empty selection: swarm [], swarm_total 0, operator_rows ABSENT. Guard with (d.operator_rows||[]).

## Closed state
Gutter value: `${num(d.swarm_total||0)} aircraft` — airframes, not operators.
Strip: one span per operator row (<=8), `style="flex:${Math.max(1,n)}"`,
title `${opName(o)}: ${num(n)}`, class "sel" when it matches the operator URL param.
Airframes are NOT represented when closed.
CSS: .strip{display:flex;gap:1px;height:12px} span background #d8d2c6, .sel background rust,
hover #c3bbac.

## Open state
`.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}`
Collapses to 1fr under 760px.

### Operators column, left
Header literal: `Operators`
Rows: all of operator_rows (max 8), server-sorted, no client re-sort or slice.
Bar scale mxO = max count among shown rows. Width `${(n/mxO*100).toFixed(1)}%` — one decimal,
linear, top bar always 100.0%.
Count cell `<b>${num(n)}</b>`, right aligned, mono.
Overflow row when (d.operators - top.length) > 0:
  `<div class="orow more" data-aim="more-ops"><span class="on ash">${num(rest)} more operators</span></div>`
  no bar, no count, no data-take, cursor default, not focusable.

### Airframes column, right, fixed 330px
Header literal: `Airframes`
Rows: d.swarm.slice(0,8) — top 8 only.
Label `"N"+t`; the registration is stored WITHOUT the leading N, the page prepends it.
Bar scale mxA computed over the 8 shown rows, INDEPENDENT of the operator scale.
Overflow row when swarm_total > swarm.length (the 900 cap, not the 8 shown):
  `${num(swarm_total - swarm.length)} more airframes, not ranked here`  VERBATIM

### Row geometry
.orow{display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;
  font-size:11.5px;cursor:pointer;padding:0 3px;border-radius:3px;height:14px}
.orow:hover,.orow:focus-visible{background:rgba(196,75,40,.08)}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orow .on.mono{font-family:'IBM Plex Mono',monospace}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
Under 760px: grid-template-columns:100px 1fr 46px
.col .ch{font:600 10.5px/1.2 Archivo;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}

Palette: --ink:#1d1d1f --paper:#f7f5f0 --ash:#756f69 --smoke:#6b6560 --rust:#c44b28
--line:#e2ded5 --card:#fff. Bar trough #e8e3d8, count text #5f584f, resting strip #d8d2c6,
strip hover #c3bbac, hover wash rgba(196,75,40,.08), taken wash rgba(196,75,40,.12).
Rust is reserved for a chosen selection; at rest the corpus stands in ash.

## Operator with no resolved name
opName(o) returns CODES.operator[o].label if present, else the RAW DESIGNATOR verbatim.
No marker, no italics, no "unknown" wording. Blank designators never reach the rail.

## The sentence underneath
```
const ops=(d.operator_rows||[]), nOps=d.operators||0;
if(ops.length && nOps>ops.length){
  const top=ops.reduce((s,r)=>s+r.n,0);
  out=`${spell(ops.length)} operators file ${pct(top,tot)}% of what is here; `
     +`the other ${num(nOps-ops.length)} share the rest.`;
  out=out.charAt(0).toUpperCase()+out.slice(1);
} else {
  out=`${num(nOps)} ${nOps===1?"operator files":"operators file"} everything here.`;
}
out+=` ${num(d.aircraft||0)} aircraft appear in all.`;
const sw=(d.swarm||[])[0];
if(sw && sw.n>1) out+=` One of them, N${sw.t}, is written up ${num(sw.n)} times.`;
```
spell: ["","one",...,"ten"], falls back to num(n).
pct(a,b) = (Math.round(a/b*1000)/10).toFixed(1) — always one decimal.
Denominator is the WHOLE selection including blank-operator reports.
Returns "" when d.total is 0.

## Cap disclosure, two independent places
1. inline: the "N more airframes, not ranked here" row
2. margin note, pushed before render:
   `the tail list shows the ${num(swarm.length)} most-reported aircraft out of ${num(swarm_total)}; the airline list counts every report`
   always followed by `counts are of reports filed, not of flights`
   .margin{font-family:'IBM Plex Mono';font-size:11.5px;color:var(--ash);line-height:1.5}

## Interactions
Handlers bound to document, not the rail, because drawHero replaces the DOM each time.
Every mark carries data-aim (what to say) and, if actionable, data-take (what to do).

Hover/focus writes into #iAim (mono 13px, rust, min-height 20px):
  operator row: `${opName(key)} &middot; click to follow this operator`
  airframe row: `N${key} &middot; click to follow this one airframe`
  more-ops:  `not ranked here; use the operator control below to reach any of the 309`
  more-tails:`not ranked here; type a tail number in the controls below`
mouseout clears. A held message from aimHold (6s) outranks hover.

Click, via closest("[data-take]"):
  operator|X -> takeFilter("operator", X, opName(X))
  tail|X     -> takeFilter("tail", X, "N"+X)
takeFilter sets the control value, shows p-search, runs search(0), then holds
  `narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>`

Keyboard: .orow has tabindex 0 and role button when open. Enter or Space triggers take.
Arrow walking and shift-extend are WHEN-rail only.
.orow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
Hint line for this rail: `Click an airline or an airframe to follow it.`

Selected state: syncControls() toggles class "taken" when the URL param matches.
.orow.taken{background:rgba(196,75,40,.12);outline:0}
.orow.taken{box-shadow:inset 2px 0 0 var(--rust)}

Not in this rail: drag selection, cross-highlighting from table rows, tooltips on open rows.

## Reachability beyond the 8 drawn
The aim-at combobox pushes every operator_rows entry AND every one of the up-to-900
swarm entries, so all 900 airframes are reachable by typing though 8 are drawn.
