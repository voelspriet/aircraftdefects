# The sixteen panels and the record rows — build specification

## THE SIXTEEN TABS, verbatim labels, in order
GROUP "Narrows to what you selected"
  p-search    Search              api/search + hero + vocab + resolve + export.csv
  p-patterns  Patterns            api/trend, api/breakdown?by=ata|operator|model|part|
                                  nature|crew|discovered, api/phrases
  p-aircraft  Aircraft            api/aircraft/<tail> (WHOLE CORPUS) + api/repeat-offenders
                                  (follows the filter)
  p-found     How it was found    api/inspection-method
GROUP "Ignore your selection"
  title: "These ignore your selection. Each answers from all N reports, or from a slice you
          set inside the panel"
  p-fleet        Fleet                    api/fleet?operator=&model=
  p-leads        Story leads              api/leads + api/spikes?by=ata|part|model|operator
  p-emerging     New defects              api/emerging?by=part|jasc|condition|partnumber
                                          &days=120|180|365
  p-clusters     Same day, many aircraft  api/clusters?min=3|4|6|10, kind filtered client-side
  p-defect       Same defect              api/same-defect
  p-structure    Corrosion & cracks       api/corrosion
  p-age          Old airframes            api/ageing?by=hours|cycles
  p-engines      Engines                  api/engines
  p-consequences What the crew did        api/consequences?by=operator|model|make
GROUP "Reference"
  p-compare   Compare               api/compare?field=operator|model|make&a=&b=
  p-terms     Every code explained  api/glossary + api/facets
  p-method    Method                static prose, numbers injected from api/facets

Loading is LAZY: show(id) triggers that panel's loader. p-fleet and p-compare load only on
their own buttons.
KNOWN DISCREPANCY worth preserving or fixing: FOLLOWS_FILTER omits p-aircraft, but
VIEW_GROUPS puts it in the "narrows" group.

## THE RECORD TABLE — eleven columns
<tr><th>Date</th><th>Operator</th><th>Aircraft</th><th>Tail</th><th>System</th><th>Part</th>
    <th>What was found</th><th>Crew did</th><th>Found by</th><th>Stage</th><th></th></tr>
The eleventh header is EMPTY (the case-sheet button).
Every tr.rep carries data-month="YYYY-MM" and data-zone="ZONE n00 or ''".

1  Date       ukDate(DifficultyDate) = "D Mon YYYY" from FAA "MM/DD/YYYY"; non-3-part values
              pass through unchanged. Below it, muted "N{tail}" or "N&mdash;". Not clickable.
2  Operator   opName(code)||code, clickable -> setFilter('operator',code).
              Blank field -> <span class="absent term">no operator named</span> carrying the
              OPGAP sentence as its tooltip, overwritten at boot from api/facets.
3  Aircraft   "{Make} {Model}". Click sets MODEL ONLY. The make is not set. Not decoded.
4  Tail       "N{RegistryNNumber}". Stored N-numbers carry NO leading N; it is prepended in
              the template. Click -> loadTail() and switches to p-aircraft.
5  System     x._jasc.label (server-decoded), clickable -> jasc. Below it, muted "ch. NN"
              clickable -> ata. Styled rust.
6  Part       PartName -> part filter. Below it, PartCondition printed RAW, not clickable
              in this table.
7  What was found   cc("nature", NatureOfConditionA). *** ONLY SLOT A ***. B and C are
              dropped here and surface only in the case sheet. Then CorrosionLevel if set,
              then "{n} cracks" muted.
8  Crew did   crewCell(x): collects all four PrecautionaryProcedure slots, drops empties.
              None -> <span class="absent">not recorded</span>.
              *** If the crew FILTER holds a code present in the row, that code is MOVED TO
              THE FRONT, so the row cannot look as if it contradicts the filter. ***
              First value bare, later ones in <div class="alsoc">.
              Rendered by cc("precaution", v, "crew") — code group "precaution", filter
              field "crew".
9  Found by   cc("discovered", HowDiscoveredCode)
10 Stage      whole cell .muted, cc("stage", StageOfOperationCode)
11 (blank)    <button class="ghost" aria-label="Open report CTRL, N123, PARTNAME"
                      onclick="openCase('CTRL')">Case sheet</button>

## cc(grp, v, field) — the four-way decode
1 empty v            -> <span class="absent">not recorded</span>   (italic grey)
2 code not in table  -> esc(v), PLAIN TEXT, no click. It is shown as filed.
3 "bare" (no note AND faa.toUpperCase()===label.toUpperCase())
                     -> <span class="c dull" onclick="setFilter(field,v)">short</span>
                        clickable, greyed, NO tooltip
4 otherwise          -> <span class="term c" data-fixed="short|tip" onclick=...>short</span>
                        tip = [label, "FAA wording: "+faa, note].filter(Boolean).join(". ")
CODES loaded ONCE at boot from api/glossary. Tooltip delivery is a delegated mouseover on
.term filling #tip with <b>term</b><br>definition. Escape hides it.

## THE MONTH SPINE
Before the first row of each new month:
  <tr class="spine" data-spine="2025-08"><td colspan="11">
    <span>August 2025</span><b class="spinen"></b></td></tr>
mKey is built from DifficultyDate.split("/") as `${dp[2]}-${dp[0].padStart(2,"0")}`.
LASTMONTH suppresses repeats and is reset at the top of every render; because more() reuses
it and appends, the sequence continues correctly across pages.
.spinen is filled LATER by paintSpines() from heroData.months: "N in this selection", or
emptied if the month is absent. Sticky at top:44px.

## THE WRITE-UP ROW
<tr class="wrote"><td colspan="11">
  <div class="wu clip" onclick="this.classList.toggle('clip')">
    <div class="txt">${jargon(Discrepancy)}</div></div></td></tr>

jargon(t):
1 clean(t) HTML-DECODES the FAA string by round-tripping through a detached <textarea>, so
  "&amp;LT;P&amp;GT;" style entities become literal characters
2 esc() re-escapes for safe insertion
3 "<P>" (case-insensitive) becomes
    </span><span class="wu-action"><b>What the mechanic did about it</b><br>
  and "</P>" is deleted. The FAA's <P> marker separates THE FAULT FROM THE FIX, and the
  second half gets a labelled sub-block.
4 wraps everything in an outer <span>
5 every 2-to-7-character lowercase glossary key (amm, mel, inop, r&r, p/n, fod, ...) is
  wrapped in <span class="term" data-t="key"> on a word-boundary regex

Clip/expand:
.wu.clip .txt uses -webkit-line-clamp:3 (5 below 1100px). The gradient fade is drawn only
when .long is present. markClipped() sets .long when clip is on AND
scrollHeight > clientHeight+2, then appends a REAL BUTTON:
  class="ghost wu-toggle" type="button" aria-controls="wu-txt-N" aria-expanded="false"
  text "Read the whole write-up" / "Show less", label and aria flipped in step.
Clicking the band itself also toggles.

markHits(): highlights the current #q value. Escapes regex metacharacters. Guards with
t.dataset.marked===q so the same text is never marked twice. Walks text nodes with a
TreeWalker that REJECTS anything already inside a <mark>, then CONCATENATES them into a flat
string SO A PHRASE CAN SPAN A GLOSSARY SPAN, finds all case-insensitive matches with the
zero-length guard, then walks the nodes BACKWARDS splitting each into fragments and
<mark class="hit">. It is a literal substring match: no stemming, no word boundary.
mark.hit{background:#ffe9c9;color:inherit;border-radius:2px;padding:0 1px}

renderTail() is the SINGLE post-render hook:
  markClipped(); gridify(); syncSwipeHint(); markHits(); rove();

## THE CAPTION ABOVE THE TABLE
<div class="cut"> holds:
  <span class="cs"> the hero's one-line sentence, REPEATED at the seam
  <span class="cm"> three meta spans, each given class "lit" when its condition holds:
    "newest first, ties broken on the control number"        lit when total>1
    "N carry no date, filed at the end" / "every report carries a date"
    "N shown of M" / "all N shown"                            lit when total>100
    <button class="backup">&uarr; back to the instrument</button>

sameDayRuns(rows): when any tail+date pair has MORE THAN FOUR rows on the loaded page:
  `Some of what you see here is one inspection, not one fault each: ${body}. A mechanic
   writes up every finding separately, so a heavy check on a single aircraft fills a page.
   Count events, not rows.`
  each run reads "<b>N</b> of them on N{tail} on {date}", joined "; " for the top two, plus
  "; and N more like it".

Swipe hint, shown only when the table actually overflows:
  `Swipe the table sideways for System, Part, what was found, what the crew did, how it was
   found, the stage of flight and the report button.`

## ORDERING AND PAGING
Server order is FIXED: ORDER BY difficulty_dt DESC NULLS LAST, OperatorControlNumber DESC.
Undated reports sort LAST. There is NO user-selectable sort.
Page size hard-coded 100. more() calls search(offset+100) with popping=true so load-more is
not a history step. On more(), the new body is spliced in by replacing "</table>" — the
header, caption and empty state are NOT re-rendered.
The header row is REPEATED EVERY 25 ROWS.
CASE_ORDER is set at offset 0 and concatenated on later pages; it drives the case stepper.
Count line: "<strong>N</strong> reports match your selection" / "report matches", or
  "<strong>N</strong> reports, nothing filtered yet".

## THE CASE SHEET — openCase(id)
Stores lastFocus. pushState with hero and case, so the link is SHAREABLE and BACK CLOSES IT.
#case-box gets role=dialog aria-modal=true aria-labelledby=case-title tabindex=-1, trapFocus
marks every sibling inert, focus lands after 30ms. Escape and a backdrop click close.
Contents IN ORDER:
1 sticky action bar: the stepper (only when caseFromLink is false and CASE_ORDER.length>1)
    "N of M loaded" + ", of K that match" when the selection is bigger than what is loaded
  then: Copy the quote | Copy the citation | Copy the link | Copy all three | Close
2 <div class="route">How you got here: ${filterWords() || "the whole corpus, nothing filtered"}</div>
3 <blockquote class="bigq">${jargon(Discrepancy)}</blockquote>
4 "Before you publish this", casePublishNotes(d), in this order:
   - "You opened this report by its control number, so no selection was applied. It is
      evidence of what a mechanic filed, not of what happened."   (when caseFromLink)
     else "This is one report of N in the selection you were looking at. It is evidence of
      what a mechanic filed, not of what happened."
   - operator named: "The operator name comes from the FAA's December 2006 cross-reference.
      Check current ownership before you name X in print."
     unresolved code: "Operator code X is not in the FAA cross-reference used here, so no
      name is asserted."
   - CorrosionLevel==="3": "Corrosion level 3 obliged the operator to notify the regulator
      within three days and to act across the fleet. That is a checkable fact you can put
      to them."
   - HowDiscoveredCode in B,D,E,M,T,U,X: "This was found by instrument, so it was not
      visible from outside the aircraft."
   - any crew action: "The crew action recorded here is what the FAA form says the crew did,
      not a description of severity."
   - ALWAYS LAST: "Quote the mechanic's words as filed. The FAA publishes no per-report
      permalink, so cite the control number and this desk's link."
5 <div class="eyebrow-k">Report CTRL</div>
6 <h2 id="case-title"> four parts joined " &middot; ", empty parts dropped: operator name
   (or "Operator not recorded"), make+model, part name sentence-cased plus condition
   lowercased, and the date.
7 <p class="lede">Every code on this report, spelled out. The FAA's own wording is kept
   beside the plain English so you can quote either.</p>
8 <table class="kv"> — row(k,v) OMITS any row whose value is falsy, so blanks disappear
   entirely. Headings in order:
   Date of the difficulty | Airline | Filed by | Aircraft | Tail number |
   Hours on the airframe | Cycles (takeoffs and landings) | System | Part |
   Condition of the part | Where on the aircraft | What was found | What the crew did |
   How it was found | Stage of flight | Corrosion | Cracks | The mechanic's own words |
   Context | Check it against the source | How to cite it
   one(e)  = <strong>label</strong> + muted "FAA wording: faa" + muted note
   many(a) = each joined by <hr>, or "none recorded"
   Server drops crew entries whose faa is NONE or NOT AVAILABLE, and nature entries whose
   faa is NOT AVAILABLE.
   Airline row adds one of two muted notes: "Name from the FAA Air Carrier/Operator
   cross-reference, December 2006 edition. Check current ownership before publishing." or
   "Not in the FAA cross-reference used here, which is the December 2006 edition. Shown as
   filed."
   Context row: "This airframe appears in N reports." + "This part number appears in M."

sourceLinks(d), in order, all target=_blank rel=noopener:
  "The FAA's own search" -> https://sdrs.faa.gov/Query.aspx
     + "It posts a form rather than answering an address, so paste the control number
        <b class="mono">CTRL</b> into its Operator Control Number box."
  "N123 on Flightradar24" -> /data/aircraft/n123  + ", to see what the aircraft has been
     doing since."
  "N123 on FlightAware"
  "Flightradar24 playback for {date}" -> /YYYY-MM-DD/12:00
     + "Free accounts reach back about a week, so an older day needs a paid plan."
  "Who owns N123" -> registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=123

Copy payloads read currentCase, NEVER an HTML attribute:
  quote -> quoteText(): decodes entities, replaces the <P> marker (and an optional wrapping
     parenthesis) with a BLANK LINE, strips </P>, trims. The label "What the mechanic did
     about it" is DELIBERATELY NOT in the clipboard text.
  cite  -> d._cite + " Desk permalink: " + location.href
  link  -> location.href
  all   -> "quote"\n\ncite\nDesk permalink: link
_cite is built server-side and keeps the difficulty date and the submission date DISTINCT:
  `FAA Service Difficulty Report {ctrl}. Difficulty dated {D Month YYYY}[, filed with the
   FAA {D Month YYYY}]. Source: FAA Service Difficulty Reporting System, https://sdrs.faa.gov`
copyBit() swaps the label to "copied" 1500ms, or "copy failed, select the text" 2600ms.

## KEYBOARD MODEL FOR THE TABLE
gridify(): role=grid on the table, role=row on each tr, columnheader/gridcell on cells, then
collapses ALL interactive descendants to tabindex -1 except ONE roving stop.
gridKeys(): Arrow keys, Home and End over the visible buttons, rowLen from the first tr.rep.
makeReachable(): every non-button [onclick] gets tabindex 0 and role button; a global keydown
turns Enter/Space into a click.
A MutationObserver on body re-runs makeReachable and gridify on every insertion.

## MOBILE
Below 900px the first column and the header row become sticky.
Below 1100px the write-up band becomes position:sticky;left:0;width:calc(100vw - 44px) so it
stays readable while the row scrolls sideways, and the clamp goes from 3 lines to 5.
