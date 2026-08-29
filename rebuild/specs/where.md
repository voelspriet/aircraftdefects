# WHERE / anatomy rail — build specification

RAILS[1]: rail id "where", gutter WHERE, subhead "on the aircraft", hero key "anatomy".
DEFAULT OPEN RAIL. heroKind falls back to "anatomy" when ?hero= is absent or unknown.
localStorage IS written by setHero but deliberately NOT read at boot: "a remembered rail no
longer does, because the page is meant to open on the aircraft."
Hand line: `Click a zone on the aircraft to keep only what was found there.`

## THE DATA — and the exact trap
GET api/hero -> d.zones = [{code, label, n}], ALWAYS all nine, n=0 when absent.

*** THE code VALUES ARE PREFIXED. THEY ARE 'ZONE 200', NOT '200'. ***
Server: "SELECT 'ZONE ' || regexp_extract(upper(PartLocation),'^Z(?:ONE|N) *([1-9])[0-9][0-9]',1)
        || '00' AS k ... HAVING k <> 'ZONE 00'"
Any lookup keyed on a bare "200" returns undefined, every zone reads 0, and every shape
renders at the floor alpha. The aircraft then draws in one flat colour and says nothing.

ARRAY ORDER is fixed by _ZONE_ORDER and is NOT numeric. It is frequency-ish:
  ["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500",
   "ZONE 600","ZONE 400","ZONE 700","ZONE 900"]
ZONE 000 is excluded everywhere: from the query (HAVING), from the regex (leading 1-9), and
from the zone <select> (opts skip list).

Also read:
  d.unzoned        = total - sum(zones[].n)
  d.no_location    = PartLocation blank or in ('NONE','UNKNOWN','N/A','NA','UNK')
  d.other_location = total - placed - no_location   (a place named in WORDS)
  d.total

## THE COLOUR RAMP — one function, no second colour
  mx = Math.max(1, ...zs.map(z=>z.n))
  o  = z => (0.10 + 0.80*(z/mx)).toFixed(3)
  fill = `rgba(196,75,40,${o(n)})`
n=0 -> "0.100"   n=mx -> "0.900"
LINEAR in the raw count. Not log, not rank, not against a corpus-wide maximum.
Rescaled on EVERY render against the current selection's own busiest zone.
rgb(196,75,40) is --rust #c44b28. The ramp is pure OPACITY of rust over --paper #f7f5f0.
Stroke on every zone shape: #7c746a, stroke-width 1.1 (groups' children use the default 1).

## THE shape() HELPER — and why a zone can be drawn twice
  const shape=(c0,d2)=>{const c=c0.replace(/b$/,"");
    return `<path d="${d2}" fill="rgba(196,75,40,${o(zn(c))})" stroke="#7c746a"
      stroke-width="1.1" class="zone" data-aim="zone|${c}" data-take="zone|${c}"
      tabindex="${open?0:-1}" role="${open?"button":"presentation"}"
      aria-label="${esc(byCode[c].label||c)}, ${num(zn(c))} reports"/>`};
The trailing-b strip lets ONE zone be two disjoint paths. "ZONE 300" and "ZONE 300b" both
resolve to code ZONE 300 and share fill, aim, take, tabindex and label. Both are separately
focusable: a keyboard user tabs the fin and then the stabiliser as two stops.
"ZONE 300b" NEVER appears in the API. It is a client-side shape id only.

## THE SVG — verbatim
<svg viewBox="0 0 600 132" class="plane" role="img"
     aria-label="Aircraft from the side, each zone shaded by how many reports name it">
.plane{width:100%;max-width:640px;height:auto}   (no width/height attributes)

Children in DOCUMENT ORDER (paint order matters, later sits on top):

1 ZONE 100  belly      M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z
2 ZONE 200  crown      M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z
3 ZONE 300  fin        M452 44 L492 7 L518 7 L523 41 Z
4 ZONE 300b stabiliser M512 48 L578 38 L580 47 L516 57 Z
5 ZONE 500  wing       M236 87 L356 87 L318 108 L264 108 Z
6 ZONE 600  above root M262 80 L344 80 L322 90 L284 90 Z
7 ZONE 400  nacelle    <ellipse cx="248" cy="99" rx="24" ry="9.5" .../>
                       aria-label "Engine nacelles and pylons, N reports"
8 ZONE 700  gear       <g class="zone" ... aria-label="Landing gear, N reports">
     <path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/>
     <circle cx="118" cy="109" r="6" .../>    <!-- nose -->
     <circle cx="281" cy="111" r="7" .../>
     <circle cx="297" cy="111" r="7" .../>
   The two struts are ONE two-subpath path in strut grey #8d857b, unfilled, UNSHADED.
   Only the three wheels take the zone fill.
9 ZONE 800  doors      <g ... aria-label="Doors, N reports">
     [96,190,348,424].map(x=> <rect x=x y="49" width="11" height="17" rx="3" .../>)
10 ZONE 900 lav/galley <g ... aria-label="Lavatories and galleys, N reports">
     [122,372].map(x=> <rect x=x y="51" width="22" height="14" rx="3" .../>)
11 WINDOWS  decoration only, no zone, no interaction, DRAWN LAST so they sit above all:
     <g fill="#f7f5f0" stroke="none" opacity=".8">
       [150,164,220,234,248,300,314,328,400,414].map(x=> <rect x=x y="54" width="6" height="7" rx="2"/>)
     </g>
   Paper-coloured windows punched over the shaded crown, so the upper fuselage reads as a cabin.

All nine codes have a shape. ZONE 300 has two.

## ZONE CSS
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}
.zone:focus-visible{stroke:var(--ink);stroke-width:3}
Three escalating widths: hover 2.2 -> lit 2.4 -> taken 2.6, with keyboard focus overriding
at 3 and switching to --ink. Comment in the source: "a stroke-only ring vanishes on the
busiest zones, which are the ones people reach for first" — hence the drop-shadow.
@media (forced-colors: active){.zone{stroke:CanvasText} [data-take].taken{outline:3px solid Highlight}}

## CLOSED (rest) STATE
val = active zone label via code("part_location",v), else the literal `all zones`
<div class="rail" data-rail="where" onclick="setHero('anatomy')">
  <div class="gut rest"><span class="q">WHERE</span><span class="val">…</span></div>
  <div class="track"><div class="strip">
    …zones sorted DESCENDING by n, each <span style="flex:${Math.max(1,z.n)}"
      title="${label}: ${num(n)}" class="${taken?'sel':''}">…
  </div></div></div>
flex is floored at 1 so a zero zone still shows a hairline.
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}

## OPEN LAYOUT
<div class="rail open" data-rail="where">
  <div class="gut"><div class="q">WHERE</div><div class="pn">on the aircraft</div>
       <div class="val">…</div></div>
  <div class="track two">${art}<div>${legend}${note}</div></div>
  ${reading("where",d)}
</div>
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail>.reading{grid-column:2}
Under the breakpoint both collapse to a single column.

## THE LEGEND
Nine zone rows sorted DESCENDING by n (Array.sort is stable, so ties keep _ZONE_ORDER).
Each row's swatch uses THE SAME ALPHA the aircraft uses: o(z.n). That is what makes the
legend a key rather than a second chart.
<div class="lrow zone" data-aim="zone|CODE" data-take="zone|CODE" tabindex="0" role="button">
  <i style="background:rgba(196,75,40,${o(z.n)})"></i><span>${label}</span><b>${num(n)}</b></div>
Then <div class="lsplit"></div>, then TWO pad rows in this order:
  pad|nowhere  `no location given`                          = d.no_location
  pad|outside  `place named in words, not as a zone`         = d.other_location
Pads carry data-aim but NO data-take. Clicking one does nothing but leave the explanation
on screen: they are unshadeable by construction.
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;
  cursor:pointer;padding:1px 4px;border-radius:3px}
.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.lrow.taken{background:rgba(196,75,40,.14);box-shadow:inset 2px 0 0 var(--rust)}

## THE NOTE UNDER THE LEGEND
Rendered only when d.unzoned > 0. Verbatim:
  `The aircraft above counts only the ${num(placedAll)} reports that use one of the FAA's
   numbered zones. In another ${num(d.other_location)} the mechanic wrote where it was in
   plain words, such as the part or the system, and ${num(d.no_location)} say nothing about
   where. Those two cannot be drawn on the aircraft, so they sit under it.`
placedAll = sum(zones[].n). Straight apostrophe in "FAA's".
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;
  border-top:1px solid var(--line)}

## THE READING SENTENCE
zs sorted desc by n. zoned = sum(n). Returns "" if total is 0 or zones is empty.
  `${zs[0].label} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the
   FAA&rsquo;s numbered zones, or ${pct(zs[0].n,zoned)}%. Those numbers are what this diagram
   can place, and they are ${pct(zoned,tot)}% of the selection.`
 + if(other_location) ` Another ${num(worded)} do say where, in words such as FUSELAGE or
   CABIN rather than a zone number, so the drawing cannot show them.`
 + if(no_location)    ` Only ${num(blank)}, ${pct(blank,tot)}%, give no location at all.`
 + always             ` It is a sample rather than the whole file, but it does give you a
   good idea of where the trouble sits.`
pct(a,b) = (Math.round(a/b*1000)/10).toFixed(1), "0.0" when b is 0.
&rsquo; is a literal entity in the string.

TWO SOURCE COMMENTS RECORDING WHY:
  "This used to read 'the others never say where', which was false: they nearly all say
   where, in words the diagram cannot place. Only the blank ones say nothing, and they are
   about one report in twenty-seven, not four fifths of the file."
  "Zonder deze zin leest de alinea als een reeks voorbehouden. De tekening is een steekproef,
   maar wel een die laat zien waar het meeste stukgaat."
The closing sentence exists so the paragraph does not read as a list of disclaimers.

## INTERACTION
One grammar for every mark: data-aim writes an explanation, data-take applies a filter.
Handlers are DELEGATED ON document, so redrawing the instrument never rebinds anything.

Hover/focus aim, zone:
  `${label} &middot; ${num(z.n)} of ${num(placed)} placed findings &middot; click to narrow`
  placed is recomputed from zones, not read from unzoned.
Hover aim, pads, one of exactly:
  `${n} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`
  `${n} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`
aim() refuses to write while a HELD message is showing: an undo outranks a hover.

Click chain: takeFor("zone|ZONE 200") -> takeFilter("zone", key, z.label) ->
  setFilter: #zone.value = "ZONE 200", show p-search, search(0), showChange()
  aimHold(`narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>`)
The SVG shape and the legend row carry THE SAME data-take, so both routes are identical.
Clicking an already-taken zone re-applies it. There is no toggle-off.

syncControls() after every drawHero:
  n.classList.toggle("taken", p.get(field)===key)
so a taken zone lights on BOTH its shape(s) and its legend row. With ZONE 300 that is two paths.

Keyboard: Tab walks the shapes in SVG document order (100, 200, 300, 300b, 500, 600, 400,
700-group, 800-group, 900-group) then the legend rows. Enter or Space on any [data-take]
fires takeFor. Arrow keys do NOTHING here: they belong to the WHEN rail.

## REVERSE LINK: table row -> aircraft
Each row carries data-zone from (PartLocation||"").toUpperCase().match(/^ZONE \d00/).
NOTE this client regex is STRICTER than the server's: it needs the literal word "ZONE ",
so "ZN 100 FUS LOWER" lights nothing even though the server counted it.
heroMark(row) uses querySelectorAll, not querySelector, DELIBERATELY: a zone lights on the
aircraft AND in the legend at once, and both ZONE 300 paths together.

## MARGIN
`zone` is NOT in NO_RAIL. It is exactly what this rail draws, so a zone filter never
produces the "no rail draws this" note.

## PHONE (<=760px) — phZones(d)
The aircraft is replaced by a 3x3 grid of buttons, SAME data, SAME ramp:
  grid = [["ZONE 800","ZONE 200","ZONE 100"],
          ["ZONE 500","ZONE 400","ZONE 600"],
          ["ZONE 300","ZONE 700","ZONE 900"]]     // spatial, NOT frequency-sorted
alpha goes into a custom property --f consumed by
  .phcell{background:rgba(196,75,40,var(--f,.1))}
  .phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,var(--paper) 4px 8px)}
No reading paragraph and no .zonenote on the phone.

## PALETTE
--ink #1d1d1f  --paper #f7f5f0  --ash #756f69  --smoke #6b6560  --rust #c44b28
--line #e2ded5  --card #fff  --rust-text #b8431f   GHOST #d8d2c6
zone stroke #7c746a   gear strut #8d857b   note text #5f584f   reading bg #faf7f3
