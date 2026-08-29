# WHEN / horizon rail — build specification

RAILS[0]: rail id "when", gutter WHEN, subhead "month by month", hero key "horizon".
Hand line: `Drag across the months to take a period.`

## The data, and the one thing that surprises everybody
GET api/hero -> d.months = [{m:"YYYY-MM", n, all}] ASCENDING.
Server builds it as:
  allm = every month in the WHOLE FILE (cached)
  selm = the same grouping under the current WHERE
  months = [{m, n:selm.get(m,0), all:allm[m]} for m in sorted(allm)]
CONSEQUENCE THE FRONT END DEPENDS ON:
  the month list is ALWAYS the full corpus span, whatever the filter.
  Filtering NEVER shortens the strip. It only zeroes n for months outside the selection.
  So the reporter always sees what was excluded, standing in ash beside what was kept.
A month with zero reports in the whole file simply has no entry. No gap-filling.
Reports with a null difficulty date are in d.total but in NO month bucket.
total===0 returns ghost months (n:0, real all): same strip, no rust.

d.lag.settled_before = max(difficulty_dt) - p95_days
d.lag.p95_days = 95th percentile of datediff(day, difficulty_dt, SubmissionDate)
A month counts as settled once 95% of what it will hold has had time to arrive.

## Two month predicates
partialMonth(m): true when m is the first or last bucket of the CORPUS and that edge
  does not land on a whole month, OR the first/last bucket of the user's own from/to
  window and that edge is mid-month.
  Reason: drawn plain they read as a crash or a boom that is only the download date.
  They are kept, counted and MARKED, never dropped.
settled(m): last day of that month <= settled_before. Defaults TRUE when no cutoff.

## Scales
cmax = max(m.all), floored at 1.
BOTH the corpus bar AND the selection bar are scaled against cmax. NEVER against smax.
The selection is always drawn as a fraction of the corpus, so a small selection looks small.
H = 84px open, 14px closed.

## One month = one span
  ch = (m.all/cmax)*H          sh = NARROWED ? (m.n/cmax)*H : 0
  part = partialMonth(m.m) || !settled(m.m)
  <span class="mo[ part]" data-aim="month|YYYY-MM" tabindex="0|-1" role="button|presentation"
        aria-label="August 2025, 1,234 reports[, a part month|, still filling up]">
    <i class="ghostb" style="height:62.3px"></i>
    <i class="selb"   style="height:11.4px"></i>   <!-- only when sh truthy -->
  </span>
Heights .toFixed(1) px. selb follows ghostb in DOM order, both absolutely positioned at
bottom:0, so rust paints OVER ash from the baseline up.
The aria suffix distinguishes the two causes even though the class does not.

NARROWED = [...params().keys()].some(k=>k!=="hero")
With no filters set there is NO rust anywhere. At rest the corpus stands in ash, so the
reporter can see there is nothing selected without reading a word.

## Colours
--ink #1d1d1f  --paper #f7f5f0  --ash #756f69  --rust #c44b28  --line #e2ded5
--rust-text #b8431f   (rust on paper is only 4.40:1, so rust TEXT is a darker variant)
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit{outline:1.5px solid var(--ink);outline-offset:1px}
.mo.inband .ghostb{background:#b9ae99}
.mo.inband::after{content:"";position:absolute;left:0;right:0;top:-3px;height:2px;background:var(--rust)}
.months{display:flex;gap:2px;align-items:flex-end}
.mo{position:relative;flex:1;min-width:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}

## The magnifier
Drawn only when open && smax && smax < cmax*0.25 — the busiest selected month is under a
quarter of the busiest corpus month, so the rust bars would be unreadable.
  f = (cmax*0.62)/smax
  polyline over a 1000-unit viewBox, preserveAspectRatio="none", stroke #c44b28,
  stroke-width 1.5, vector-effect non-scaling-stroke, aria-hidden, pointer-events none
  <span class="magnote">selection &times;3.7 to be visible</span>
NEVER silently rescale. Add a LABELLED magnified line with the factor printed.
.mag{position:absolute;left:0;right:0;bottom:16px;height:84px;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono';font-size:10.5px;
  color:var(--rust-text);background:var(--paper);padding:0 4px}

## The year axis (open only)
One <span> per month, same flex geometry as the bars, holding the four-digit year ONLY in
January and an empty string in every other month.
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono';font-size:9.5px;
  color:var(--ash)} .axis span{flex:1;min-width:0;text-align:left}

## Scrolling over long runs
wide = open && ms.length>72   (more than six years)
--mw: ms.length*9 px, set inline on .track
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain}
.rail.open[data-rail=when] .months,.axis{min-width:var(--mw,100%)}
.rail.open[data-rail=when] .mo{min-width:5px}
Source comment: "Twenty-six years is 320 months. Fitted to the width each bar was 1px:
a hairline nobody can read or hit. They keep a usable width and the rail scrolls instead."
Hint when wide: `380 months, so the strip scrolls sideways. It opens at the most recent.`
Opening at the most recent, at the END of every drawHero and drawPhone:
  wtr.scrollLeft = wtr.scrollWidth    // over-set, browser clamps hard right

## The gutter — and a quirk to preserve
val = periodClause() || `${months.length} months`
railWhen never passes `open` to gutter() (it goes to the ignored 2nd arg of esc), so WHEN
ALWAYS renders the compact .gut.rest form and "month by month" never appears in the gutter.
Every other rail passes it. Keep this.

periodClause() reads #from/#to, NOT the API:
  neither set            -> ""
  same month, day 01, to = last day of month -> "August 2025"
  same month, day 01, to earlier             -> "1 to 14 August 2025"
  both set otherwise     -> "3 Aug 2024 to 14 May 2025"
  only from              -> "from 3 Aug 2024"      only to -> "up to 14 May 2025"
Only call it a month when the WHOLE month is in the selection.

## The sentence underneath
all  = months.filter(m=>!partialMonth(m.m))
full = all.filter(m=>settled(m.m))
young= all.length - full.length
if(full.length<2) return ""      // no paragraph at all
hi/lo are reduced over m.n (the SELECTION count), ties resolve to the earliest month.

1, always:
  `Between ${num(lo.n)} and ${num(hi.n)} reports in a settled month, busiest in
   ${monthName(hi.m)}, quietest in ${monthName(lo.m)}.`
2, only when full.length>=24:
  last=full.slice(-12), prev=full.slice(-24,-12), av = rounded mean of n
  ` The last twelve settled months average ${num(a)} a month against ${num(bb)} for the
    twelve before, a difference of ${diff}%.`
  The difference is ABSOLUTE. Direction is NEVER stated.
3, only when young>0, singular/plural switched throughout:
  ` The ${spell(young)} most recent months are left out of those figures: reports still
    arrive up to ${num(lag)} days after the event, so they hold only part of what they
    will hold. The dip at the right of the chart is the post arriving late, not fewer faults.`
  spell(n) = WORDS[n] up to ten, num(n) above.
Rationale in the source: "Reading their dip as a fall is the most available wrong story
in this data."

## Margin note for part months
If ANY month is partial, one rust margin entry:
  `${MONTHS[mm]} ${yy} covers 1 to ${dd} ${MONTHS[mm]}, so its bar counts ${dd} days
   against ${inMonth} in a whole one`
Always also pushed, ash: `counts are of reports filed, not of flights`.

## Interactions
Months carry data-aim ONLY, never data-take. Everything goes through pointer events.
monthAt(ev,track) maps x by UNIFORM DIVISION of the whole .months box, not by hit-testing
a bar — which stays correct under horizontal scroll because .months is the scrolled content.
Out-of-box positions clamp to the first/last month.

pointerdown -> dragFrom = monthAt, paintBracket(from,from), setPointerCapture
pointermove -> paintBracket(dragFrom, monthAt)
pointerup   -> takePeriod(dragFrom, monthAt||dragFrom)

paintBracket(a,b): lo/hi by STRING compare on "YYYY-MM"; toggle .inband; then
  aim(`${monthName(lo)} to ${monthName(hi)} &middot; ${num(n)} reports &middot; release to take it`)
  n is the running SELECTION total inside the band.

takePeriod(a,b):
  from = `${lo}-01`
  to   = `${hi}-${last calendar day of hi, padded}`
  show p-search, search(0), showChange()
  aimHold(`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. [undo]`)
A plain click is a zero-length drag, so it takes one month.

.rail.open[data-rail=when] .months{touch-action:none;user-select:none} + preventDefault on
pointerdown: text selection and browser panning over the strip are suppressed so the drag
is unambiguous. This is why the phone gets a separate renderer.

Hover aim: `${monthName(key)} &middot; ${num(m.n)} reports &middot; click to narrow to this month`
aim() REFUSES to write while a hold is live: an undo outranks a hover.
.aim{min-height:20px} — reserved height so the layout does not jump.

## Keyboard
Active when document.activeElement has class "mo".
Arrow/Home/End: FOCUS FIRST, then repaint — or focusin overwrites the bracket.
Shift+arrow: kbAnchor is set to the index BEFORE moving, then paintBracket(anchor,target).
  Any arrow WITHOUT shift resets kbAnchor=null.
Enter/Space: kbAnchor set -> takePeriod(anchor,this); else heroMonth(this).
Every .mo is tabindex 0 when open. With 380 months that is 380 tab stops, accepted.

## Cross-highlight from the results table
Hovering any tr[data-month] outlines its month bar (.mo.lit) and tints that month's spine
row (tr.spine.lit td{background:#fbe6dc}). Row data-month is derived client-side from the
US-format DifficultyDate.
paintSpines() fills each .spinen from heroData.months: `${num(m.n)} in this selection`.

## Typed route: Aim at -> a month or a year
takeReading for kind "period":
  4 chars  -> lo = v+"-01-01", hi = v+"-12-31"
  YYYY-MM  -> lo = v+"-01",    hi = v+"-"+last day
  CLAMP ONLY WHERE THE PERIOD AND THE FILE OVERLAP:
     clo = lo<RANGE.from?RANGE.from:lo ; chi = hi>RANGE.to?RANGE.to:hi
     if(clo<=chi){lo=clo;hi=chi}
Two documented refusals:
1. A year in progress IS clamped to the file's real end. Taking 2026 used to caption the
   selection "1 Jan 2026 to 31 Dec 2026" over a count that stopped at the newest report,
   promising four months of data that do not exist yet.
2. A period wholly OUTSIDE the file is left as asked, NOT clamped, because clamping would
   produce a backwards range: "1 Dec 2026 to 20 Aug 2026". Left as asked, it returns
   nothing and says so.
Valid but empty: `${label} is a valid month or year, but this file holds no report for it.
  It runs from ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}.`

## Degraded states
heroData null: drawHero early-returns a SKELETON — stamp, a sentence slot, an empty .aim,
  and four inert rails. No months at all. "A dark instrument tells the reporter nothing
  about why. The frame stands."
d.months empty: railWhen returns "" and the row is absent from the DOM entirely.
Rail closed: H=14, no axis, no magnifier, no hint, no reading; tabindex -1, role
  presentation; the whole .rail gets onclick="setHero('horizon')". The drag handlers
  require .rail.open, so a closed strip cannot be dragged: clicking opens it.
resize: debounced 180ms -> full drawHero.

## What the rail deliberately does NOT do
- No standalone number. There is no headline count of its own anywhere.
- Never scales the selection to its own maximum in the bars.
- Never drops partial or unsettled months.
- Never states a direction for the twelve-vs-twelve change.
- Never claims a whole month unless the whole month is selected.
- Never pairs a figure with a mismatched selection: if HERO_FOR !== params().toString()
  the sentence prints an ellipsis instead of a number, and a stale hero reply that arrives
  late is DISCARDED by heroSeq.
- Never lets a hover overwrite an undo message.
