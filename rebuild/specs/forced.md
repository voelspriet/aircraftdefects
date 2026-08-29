# FORCED / ledger rail + SPECIMEN — build specification

RAILS[3]: rail id "forced", gutter heading FORCED, subhead "what the crew did", hero key "ledger".
The PICKER TAB reads "WHAT IT FORCED", the rail gutter reads "FORCED". Same substitution on phone.
Hand line when open: `Click what the crew had to do.`

## API fields, GET api/hero
- total: int, COUNT(*) of selection. Denominator of the block bar.
- crew: [{code,label,n}] — watch list is exactly ten codes A,B,C,E,F,G,I,J,L,R.
  n counts REPORTS in which that code appears in ANY of the four PrecautionaryProcedure slots.
  Codes with n===0 are DROPPED. Sorted server-side descending by n.
- crew_reports: int — DISTINCT report count. A report with three watched codes counts ONCE.
  THIS NUMBER MUST NEVER BE DERIVED BY SUMMING crew[].n.
- span: {from,to,days,dated} — only span.days used, for the per-day rate.
Empty selection: crew [], crew_reports 0, no specimen key.

## Closed state
Gutter value verbatim: `${num(cr)} of ${num(tot)}`
Bar width: sh = tot ? cr/tot*100 : 0, printed .toFixed(2) + "%"
.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.val is IBM Plex Mono 10.5px, colour var(--rust-text) #b8431f, white-space nowrap.

## Open state
### The block bar
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;
  display:flex;align-items:center}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)} width .toFixed(2)%
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono';font-size:11px;
  color:var(--ink)}
Label sits INSIDE the bar at the left, so it starts on rust and runs onto grey when the share
is small. Text verbatim: `${num(cr)} of ${num(tot)} forced a crew action`
data-aim="crewall" but NO data-take: clicking it does nothing.

### The action rows
rows = (d.crew||[]).filter(x=>!["K","0","O"].includes(x.code)).slice(0,8)
mx = max of the DISPLAYED eight, so the top bar is always 100%.
CAP IS 8. Ten codes are counted, so up to two non-zero actions are silently omitted, and
there is NO "N more actions" affordance, unlike WHO.
.orow.wide{grid-template-columns:190px 1fr 56px;height:17px} .orow.wide .on{font-size:12px}
taken when params().get("crew")===x.code, re-applied by syncControls().

### The double-count disclosure, two places, both required
1. `.fnote` under the last row, verbatim template:
   `A report can carry four of these, so they add to more than ${num(cr)}.`
   .fnote{font-size:11px;color:var(--ash);margin-top:4px}
   Printed unconditionally whenever the rail is open and crew_reports > 0.
2. The arithmetic: bar and gutter use crew_reports, never the sum. Live figures:
   112,189+20,438+14,703+8,620+3,902+2,747+1,531+1,168 = 165,298 against crew_reports 151,543.

### The sentence underneath
Guards: if(!tot) return ""  |  if(!cr) return the zero text (below)
First sentence verbatim:
  `${num(cr)} reports, ${pct(cr,tot)}% of this selection, record something the crew had to do
   rather than something found on the ground.`
pct(a,b) = (Math.round(a/b*1000)/10).toFixed(1) — always one decimal.
Then, if a top action exists (chosen from ALL returned codes, not the 8 drawn):
  ` The commonest is ${top.label.toLowerCase()}, ${num(top.n)} times${r?", "+r+".":"."}`
  NOTE the leading space and that the label is LOWERCASED here, unlike the row label.
rate(n,days):
  if(!n||!days||n<30||days<60) return ""      // too thin to quote
  per = days/n
  if(per>=1.5) return `about one every ${Math.round(per)} days`
  return `about ${(n/days).toFixed(1)} a day`
days is the span of the SELECTION's difficulty_dt, min to max inclusive. Not the corpus span,
not the calendar filter.
Live whole-corpus example:
  151,543 reports, 8.6% of this selection, record something the crew had to do rather than
  something found on the ground. The commonest is unscheduled landing, 112,189 times,
  about 9.7 a day.
.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);
  background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.rail>.reading{grid-column:2} — aligns under the track, not the gutter.

## Interactions
Click a row -> takeFor("crew|A") -> takeFilter("crew","A",label) -> setFilter, show p-search,
search(0), then aimHold 6s: `narrowed to X. <button class="undoit" onclick="history.back();unaim()">undo</button>`
Server matches ANY of the four slots. Taking an action does NOT close the rail.
Clicking is NOT additive: it replaces any existing crew value.
Hover aim, row:   `${label} &middot; ${num(n)} reports &middot; click to narrow`
Hover aim, block: `${num(crew_reports)} of ${num(total)} reports forced the crew to act`  (no click clause)
Keyboard: rows tabindex 0 role button; Enter AND Space both take. The block bar is not focusable.

## Nothing has a crew action
A. total>0, crew_reports===0: rail still draws in full, bar at 0.00%, label `0 of N forced a
   crew action`, rows empty, and the reading is verbatim:
   `No report in this selection records an action the crew had to take. Everything here was
    found on the ground.`
   KNOWN EDGE: the .fnote still prints "...add to more than 0." unguarded.
B. total===0: reading returns "" before inspecting crew. A .zero block appears above the rails:
   `Nothing matches all of these at once.` plus up to three `Drop <Label> -> N reports` ghosts
   from leave_one_out. Seam button reads `Nothing to read yet`.

## THE SPECIMEN BLOCK
Fed by d.lines (up to 24 discrepancy strings) and d.specimen. Server picks: the NEWEST report
in the selection whose Discrepancy length is BETWEEN 60 AND 150 characters, ties broken by
descending control number. Only lines[0] is used, so the specimen is stable for a selection.

d.specimen = {text, control, aircraft, system, part, condition, stage, found, date}
Every field is a lookup, never inferred.

Markup:
  .specimen.opens role=button tabindex=0 data-case=CONTROL aria-label="Open the full report X"
  .sh header verbatim (typographic apostrophes):
     `One report from this selection. First the FAA's own filing of it, then the mechanic's
      words as written.` + <span class="opencue">`Click to open the full report →`</span>
     phone cue: `Tap to open it →`
  .spec-decoded  — the decoded line
  .sl            — jargon(lines[0]), CLAMPED TO TWO LINES

When control is empty, the opens class, role, tabindex, data-case, aria-label and the whole
opencue span are ALL omitted and the block is inert text.

### specLine order, fixed
1 aircraft  2 system  3 part  4 condition  5 found  6 stage  7 prettyDate(date)
part is DROPPED when it duplicates the system:
  norm(x)=lowercase, letters only; drop if norm(sys).includes(norm(part)) || the reverse
  (this kills "Tire · Tire")
Every element except the date is dropped when falsy or in
  dead = ["","Other","Not reported","Unknown","None"]   (exact, case-sensitive)
If nothing survives, specLine returns "" and only the header and raw line render.
Joined with " &middot; ".
.spec-decoded{font:600 12.5px/1.5 Archivo;color:var(--rust-text,#a3421f);margin:2px 0 3px;
  letter-spacing:.01em}
.specimen .sl{font-family:'IBM Plex Mono';font-size:12px;line-height:1.5;color:#403b35;
  margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;
  overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
hover/focus background #f3efe8, focus-visible outline 2px solid var(--rust)
Hidden under 479px.

### Clicking it
Two DOCUMENT-level listeners so they survive every redraw: click and keydown(Enter/Space) on
closest("[data-case]") -> openCase(id).
