# Filters, AIM AT and the selection machinery — build specification

## THE ONE IDEA
There is NO filter state object. The DOM inputs ARE the state. Every control's id IS its
parameter name. params() reads them, and the same string goes to the address bar and to
the API. A link is the state.

FIELDS = q, operator, make, model, part, ata, jasc, nature, crew, condition, stage, zone,
         tail, discovered, corrosion, cracked, minhours, from, to
LABEL  = Text, Operator, Manufacturer, Model, Part, System, Exact system, Found,
         Crew action, Part condition, Stage of flight, Zone on the aircraft, Tail number,
         How found, Corrosion, Cracking, At least this many hours, From, To
HIDDEN_FIELDS (live inside "More filters") = everything except q, operator, from, to
URL_KNOWN = FIELDS + view, hero, case, aircraft, ca, cb, cf
NO_RAIL = fields no hero rail can draw: q, make, model, part, condition, discovered, stage,
          corrosion, cracked, minhours, jasc, ata   (zone, tail, operator, crew, from/to ARE drawn)
CLAUSE_ORDER = q, jasc, ata, part, condition, zone, operator, make, model, tail, crew,
               nature, discovered, stage, corrosion, minhours, cracked, from, to
FOLLOWS_FILTER = ["p-search","p-patterns","p-found"]   // the ONLY panels that narrow

params(): new URLSearchParams, for each FIELDS key read el(k).value.trim(), skip empties.
setFilter(k,v): el(k).value=v; show("p-search"); search(0); showChange().
  setFilter(k,'') is the UNIVERSAL REMOVE. Every chip x and every "Drop X" button is this.
showChange(): scrolls so chips/count are visible, but ONLY UPWARDS, never down.
search(off): p=params()+limit=100+offset; URL = location.search minus FIELDS plus params()
  plus hero=heroKind, so view/case/aircraft/ca/cb/cf SURVIVE every search.
  pushState for a real new search; replaceState when popping || !booted || unchanged —
  load-more and a rail switch are not steps a reporter walks back.
Listeners: SELECT and type=date search on CHANGE; text inputs search on ENTER.
Restore at boot: e.value=u.get(k); if(e.value!==u.get(k)) UNRESOLVED[k]=u.get(k)
  — a <select> silently refuses a value it has no option for, and that refusal is CAUGHT.
syncControls(): class "landed" (rust left border, #fdf7f4) on any control holding a value.
syncMoreFilters(): "(N active)" into #mfCount, and force-opens the <details> when N>0.

## SERVER CONTRACT — FAIL CLOSED
FILTER_ARGS is a SUPERSET of FIELDS: it also accepts enginemake, enginemodel, partmake,
which no control sets.
_filters() is fully parameterised and FAILS CLOSED: any unparseable or non-existent value
goes into `rejected` and raises BadFilter. It is NEVER dropped. Any query-string name
outside KNOWN_ARGS is likewise rejected. HTTP 400 with {error,rejected,unknown,message},
message ending ", so no query was run."

q         lower(Discrepancy) LIKE ? ESCAPE '\'  with \ % _ escaped so the count cannot
          silently widen
nature    (NatureOfConditionA=? OR B=? OR C=?)          validated against CODES.nature
crew      (PrecautionaryProcedureA=? OR B=? OR C=? OR D=?)  validated against CODES.precaution
zone      must match ^ZONE \d00$; SQL rebuilds it from regexp_extract on PartLocation
jasc      exact 4 digits, else rejected
corrosion only "1","2","3"        cracked only the literal "1"
minhours  digits only, TRY_CAST(AircraftTotalTime AS BIGINT) >= ?
ata       substr(JASCCode,1,2) = ?   *** NOT VALIDATED, the one loose end ***
from/to   inclusive, YYYY-MM-DD, REAL-CALENDAR checked
limit default 100 clamped 1..500; offset default 0 min 0

## THE CONTROLS
Primary row: #q (with datalist), #operator, #from, #to, Search, Clear.
#q autocompletes FROM THE MECHANICS' OWN VOCABULARY: on input, >=3 chars, debounce 180ms,
  api/vocab?q=..&limit=10, options labelled "N reports". Under 3 chars the list is emptied.
  Stale replies dropped by qSugSeq.
#from/#to get min and max set to the corpus range at boot.
More filters: make, model, part, jasc (HIDDEN input, settable only by clicking a system or
  via AIM AT), ata, nature, crew, condition, discovered, stage, zone, tail, corrosion,
  cracked, minhours.
Empty labels: "Any operator", "Any manufacturer", "Anything found", "Anything the crew did",
  "Any part condition", "Found by any method", "Any stage of flight",
  "Anywhere on the aircraft", "Any corrosion level", "Cracked or not", "Any airframe age".
opts() builds the six coded pickers sorted BY REPORT COUNT DESC, each labelled
  "Label (12,345)" or "Label (no reports)" with class="empty" when zero.
  Skips: nature ["0"], crew ["0","K"], discovered ["0"], corrosion ["1"], stage ["00"],
  zone ["ZONE 000"].

## THE AIM AT BOX
Rendered inside the instrument, twice (desktop .ipad and phone .phextra).
  <label>Aim at</label>
  <select id="aimKind">a month or year | an airline | a tail number | a zone |
                       a system code | free text search</select>
  <input id="iAimAt" role="combobox" aria-controls="aimSug" aria-autocomplete="list">
  <button onclick="aimAtGo()">Take it</button>
  <label class="aimday">or one day<input id="aimDay" type="date"></label>
  <div class="aimsug" id="aimSug" role="listbox" hidden>
Placeholders per kind:
  period   "a month or a year, e.g. August or 2025"
  operator "an airline, e.g. United or UAL"
  tail     "a tail number, e.g. N583"
  zone     "a zone, e.g. 300"
  jasc     "a system code, e.g. 3230"
  ""       "any words the mechanic wrote, e.g. bird strike"
aimPlaceholder runs on change AND on a 600ms interval, because the hero repaints and
replaces the node.

Typing: >=2 chars, debounce 220ms, sugFetch with a sugSeq guard.
  free text -> api/vocab, mapped to {kind:"q", what:"a word in the write-ups"}
  otherwise -> api/resolve?q=..&kind=..
  SUG = readings.filter(x=> x.kind!=="q" && (x.n>0 || kindNamed))
  The word reading NEVER appears in this list: free text has its own field.
  Zero-count rows are hidden while browsing but KEPT once a kind is named, because
  "that year holds no reports" is an answer.

/api/resolve: NOTHING IS INFERRED. Either the caller names the kind and only that kind is
matched, or every kind that matches is returned and the reader picks.
  tail   strips a leading N, ^[0-9A-Z]{1,6}$, LIKE stem%, exact first then count desc
  period month names part-typed; a unique month prefix WITH a year gives that month,
         WITHOUT a year the newest years holding that month; also ^\d{4}([-/]\d{1,2})?$
  operator exact designator first, then >=3-char substring of the label
  jasc   only when ^\d{4}$        zone code or >=3-char substring of the label
  q      ALWAYS appended, even at zero
Sort key: (kind=="q", -best[kind], -n, label) — strongest kind group first, the word
reading ALWAYS LAST. Ordering is a reading aid only. Nothing is auto-selected.

Suggestion rows are grouped under headings:
  KINDLAB = {period:"MONTH OR YEAR", zone:"ZONE", operator:"AIRLINE", tail:"TAIL",
             jasc:"SYSTEM", q:"WORD IN THE WRITE-UPS"}
  heading colours .sk-operator #8c4a2f  .sk-tail #3f6b57  .sk-period #4a5d80
                  .sk-zone #7a5a2e      .sk-jasc #5d4a72  .sk-q #6f6a63
  <div class="sug on nought" role="option" aria-disabled="true">
    <span class="sl">label</span><span class="sw">what | no report in this file</span><b>n</b>
  .sug.nought{opacity:.62;cursor:default} and is INERT.
Keyboard: ArrowDown/Up move SUGI, Enter takes the highlighted row, Escape closes.
Enter with nothing highlighted falls through to aimAtGo().

## "Take it" — aimAtGo()
Empty -> return. Free-text kind -> handOff() and return.
Otherwise fetch api/resolve WITHOUT a kind: Take it always considers EVERY reading.
  opts    = readings where kind!=="q" && n>0
  empties = readings where kind!=="q" && !n
  word    = the q reading
No opts but some empties:
  `${label} is a valid ${kindlab.toLowerCase()}, but this file holds no report for it.
   It runs from ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}.`
No opts at all:
  `no month, zone, airline, tail or system is called "${raw}".`
  plus, if the word has hits, a button `Search the write-ups for "${raw}" instead  N`
  otherwise the flat sentence `No mechanic wrote that word either.`
Exactly one -> takeReading(it).
MORE THAN ONE:
  `"${raw}" could mean more than one thing here. Which do you want?`
  with one button per option: `${label} <em>${what}</em> <b>${n}</b>`
  *** DELTA is an airline AND a word a mechanic writes. Picking silently is how the wrong
      number reaches print. ***
The box DELIBERATELY REFUSES to fall back to free text: "it used to search the write-ups
without being asked, which quietly turned a category question into a text one. It offers
instead."

takeReading(o): period -> from/to pair, clamped ONLY where the period and the file overlap
(see when.md). Every other kind maps its kind straight onto the filter of the same name.
Then aimHold(`took ${label}, ${what}, ${num(n)} reports. [undo]`).
handOff(): raw text into #q, search, scroll #q into view and flash it 1400ms, then
  `searched the write-ups for "${raw}", not a category.` + undo
#aimDay: sets BOTH from and to to the same date. A single day comes from the calendar,
  never from a typo in two date boxes.

## THE AIM LINE
#iAim is the ONE element a pointer may write to.
aim(text,tone)   refuses while a hold is live
aimHold(text,6s) HELD={text,until}, painted with class "aim held" and data-hold="1"
unaim()          clears unless a hold is live
paintHeld()      re-applies a live hold after EVERY hero repaint
Undo is literally history.back(); unaim() — it works because every search pushed an entry.

## STARTER QUESTIONS — 18, verbatim, in order
Smoke or fumes in the cabin      {nature:"B"}
Cracks found                     {q:"crack"}
Engine shut down in flight       {crew:"E"}
Unscheduled landing              {crew:"A"}
Bird strikes                     {q:"bird"}
Landing gear trouble             {ata:"32"}
Something burning                {q:"burn"}
Fuel leaks                       {q:"fuel leak"}
Oxygen masks dropped             {crew:"G"}
Cabin lost pressure              {crew:"I"}
Aborted take-off                 {crew:"C"}
Corrosion past the limit         {corrosion:"2"}
Urgent corrosion, level 3        {corrosion:"3"}
Damage no one could see          {discovered:"E"}
Engine flameout                  {nature:"X"}
Uncontained engine failure       {nature:"T"}
Old airframes, 50,000 hours plus {minhours:"50000"}
Something fell off in flight     {nature:"D"}
First six always show; 6+ carry class "extra" (display:none unless #starters has .all).
Toggle button reads "12 more questions" / "fewer".
starter(i) CLEARS EVERY FIELD FIRST, so starters never stack.

## CHIPS
Refused values FIRST, one per UNRESOLVED key:
  <span class="chip warn">Label: value <em>&mdash; not a value in this data</em> <b>x</b></span>
Then one per live parameter (a rejected key gets ONE chip, not two):
  <span class="chip">Label: shown<b>x</b></span>
`shown` is DECODED, never raw: ata->ATA[v], operator->"Name (CODE)", jasc->label,
  nature/discovered/stage/condition/corrosion->code(), crew->code("precaution"),
  zone->code("part_location"), cracked->"recorded", minhours->"50,000 hours".
.chip #fdf1ec on #f0d5cb, text #8a2a17. .chip.warn #fdf3ee on #eec9b8, text #7c3a1f.
Each x gets aria-label "Remove filter " + chip text.
#unresolved says: `One value in this link is not in this data, so no search was run.
  There is no number on this page to quote.`

Other removal routes, ALL reducing to setFilter(k,''):
  .clause[data-drop] in the standing sentence; the period clause carries data-drop="from|to"
    so one click drops BOTH dates
  the zero-result row's "Drop X" buttons + "Clear all filters"
  dropRefused(k) / dropStray(k) on a rejected link
  the .zero block's "Drop X -> N reports" ghosts from leave_one_out
  the phone .phchips row

## EXPORT AND COPY LINK
copyLink copies location.href EXACTLY as it stands: every filter plus hero plus whichever
of view/aircraft/case/ca/cb/cf is live. #copied shows "copied" for 1500ms.
Export label, set in search():
  total>5000 -> `Export CSV (newest 5,000 of ${total})` title "Ordered newest first. The
    oldest reports are not in this file. Narrow with a date range to export the rest."
  total===0  -> `Export CSV (0 rows)` disabled
  else       -> `Export CSV`
Server EXPORT_CAP 5000. Every coded column gets a DECODED TWIN column inserted immediately
after it. A final column CaseSheetURL holds the per-report permalink.
Filename sdr-<slug>.csv from the filter values, or sdr-all.csv. When capped the filename
gains -newest5000ofN AND a first line is prepended to the body:
  `# This file holds the newest 5000 of N matching reports. The oldest N-5000 are not in
     it. Narrow with a date range to export the rest.`

## STATING THE SELECTION IN WORDS
clauseText(k,v): q -> `where a mechanic wrote "v"`; operator -> the NAME, no code;
  tail -> "N"+v; cracked -> "with cracking recorded"; minhours -> "N hours or more on the
  airframe"; coded fields -> code().toLowerCase(); from/to -> "" (periodClause handles it).
sentenceHTML(d) walks CLAUSE_ORDER and wraps each live parameter as
  <span class="clause" tabindex="0" data-drop="k" data-aim="drop-k">…</span>
THREE OUTPUTS:
1 STALE: if HERO_FOR!==null && HERO_FOR!==params().toString(), the numbers on hand were
  computed for a DIFFERENT selection, so they are WITHHELD:
    `<b class="fig">…</b> counting ${clauses}…`
2 nothing selected:
    `<b class="fig">${num(corpus)}</b> reports, everything the FAA has published to
     ${prettyDate(RANGE.to)}.`
3 something selected:
    `<b class="fig">${num(n)}</b> ${report|reports}, ${clauses}.
     <span class="aside">${num(corpus-n)} set aside.</span>`
  and when d.total!==LAST_TOTAL, the instrument and the table have DRIFTED APART:
    `<span class="broken">the count above and the rows below disagree: reload before you
     quote either</span>`

scopeLine(id):
  p-search and p-aircraft: BLANK (the count bar already says it)
  FOLLOWS_FILTER with n>0: `Showing <strong>your selection</strong>, ${n} reports.`
  every other panel: `This view always answers for <strong>all ${TOTAL} reports</strong>.
    It does not narrow to your current selection (${filterWords()}).`
    unfiltered: `All ${TOTAL} reports.`
VIEW_GROUPS label the tab strip with the same honesty:
  "Narrows to what you selected" | "Ignore your selection" | "Reference"

Zero results: `No report matches this combination.` then
  one clause  -> `No report matches ${a}.`
  two         -> `No report is both ${a} and ${b}.`
  three+      -> `No report is all of: ${a, b, c} and ${last}.`

## "NO ROWS YET, ON PURPOSE"
Triggered when nothing is filtered AND REVEALED is false. Renders and RETURNS BEFORE ANY
api/search CALL IS MADE.
  #count: `<strong>${TOTAL} reports.</strong> Nothing chosen yet.`
  body:   `<strong>No rows yet, on purpose.</strong> Listing everything answers no question
           and buries the one you have.`
          muted: `Take a month, a zone, an airline or a tail from the instrument above, pick
           one of the starter questions, or set a filter. To read the file straight through
           anyway, use the button at the foot of the instrument.`
          buttons: `Read all ${TOTAL} anyway` -> revealAll(), `Show me the starter questions`
Source reasoning: "A table of the whole corpus is not an answer to anything, and it arrives
before the reporter has asked. The hero still shows the shape of the whole file; the rows
wait until something has been chosen."
REVEALED is set ONLY by goResults(). resetAll() sets it false again, so Clear returns the
page to the empty-on-purpose state.

## FAIL-CLOSED LINK HANDLING, CLIENT HALF
strayParams() returns URL keys outside URL_KNOWN. search() REFUSES to query when either a
stray name or a refused value is present:
  `This link uses a name|names this tool has no filter for: X. It was probably written for
   an older version of this page`
  `This link asks for Label value, which is not a value this data holds`
joined ". " and closed:
  `, so no query was run rather than answering with all ${TOTAL} reports.`
#count becomes `<strong>No search was run.</strong>`, heroData=null, Export and Copy
disabled. A 400 from the server folds into the SAME path, so there is ONE VOICE for
"no number was produced".
