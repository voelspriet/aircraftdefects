# Work plan

Five phases, in order, and the order is not negotiable: B is finished when the
harnesses agree, then C, then D, then E, then F. Instructed 30 August, after I
proposed skipping C to E in favour of F. Each is ticked off here as it is finished, with what was
found and what was fixed. Nothing is marked done on the strength of an API
returning 200: a surface counts as working when it has been driven in a real
browser.

---

## A. Streaming — **done**, 29 August

`stream: true` on every model call in the service, and `tool_stream: true`
wherever tools are passed.

**Why it was needed.** Two long jobs died: a `502` from `alibaba-ga`, their
gateway, and a reset connection on the retry. My first explanation was prompt
size, and it was wrong. The numbers say so:

```
run 1  SUCCEEDED   85,326 tokens in   64,000 max out   850s
run 2  FAILED      28,729 tokens in   48,000 max out   502
run 3  SUCCEEDED   10,582 tokens in   32,000 max out   216s
```

The successful run had **three times the input** of the failing one. What
separated them was how long the connection stayed silent. Without streaming the
socket is held open with no bytes crossing it until the model has finished
everything, and a proxy in the middle eventually gives up on it. The vendor
recommends streaming on this model for exactly this reason.

Correlation read as cause: run 3 worked because it finished inside the window, not
because it was small.

Verified: gloss returns in 6.2s at `low`, five jargon terms, no gateway errors.

---

## B. Parity with the parent tool — **done**, 30 August

The inventory was not made by me reading two pages. Three screenshots of the
parent and one of /z went to GLM-5.3-Flash with one question: what does the first
let a person *do* that the second does not. The vendor documents exactly this
workflow, comparing a render against a reference and working off the differences,
and it is the one place in this project where vision does something text cannot.

Its verdict, ranked by what a working journalist loses most, is in
[`build/visual-parity.md`](../build/visual-parity.md). The sentence that landed
hardest:

> the first tool is a filter you operate; the fourth is a page you read.

- [x] **click to narrow** — any value now becomes a filter, and they stack.
      Delta 148,192 → with unscheduled landing 5,673 → from 2020 1,848. A bar at
      the top shows what is applied, with a cross on each and a clear all.
      Filters ride along on the request rather than through the page's own code,
      which was written by a model and may be rewritten by one.
- [x] **zones separated from places named in words** — the anatomy drawing showed
      nine zone boxes reading zero on an airframe where *every* location is
      written in words. The model caught it: "it draws numbers it then disowns."
      The API now returns `drawable`, `in_words` and `no_zone` separately, so the
      page can say nothing can be drawn instead of drawing nothing.
- [x] **a definition removed from the limitations list** — "a write-up is a defect
      found during maintenance" is a glossary entry, not a blind spot. The parent
      reserves that list for real gaps. Replaced with the late-arrival caveat,
      which is one.
- [x] **every value clickable** — 514 of them on one page, across eight fields:
      zones, ATA chapters, crew actions, stages, nature of condition, part
      conditions, part names, how it was found. Done by walking the DOM after the
      data arrives and matching on the values the API returned, not on class
      names, so it survives the page being rewritten by a model.
- [x] **date bounding in the interface** — from and up-to, with a take-that-period
      button, alongside the filter chips.
- [x] **starter questions** — ten of them, the ones a journalist actually chases:
      smoke or fumes in the cabin, cracks, engine shut down in flight, unscheduled
      landing, aborted take-off, oxygen masks, cabin pressure, level 3 corrosion,
      landing gear, engines.
- [x] **per-report click-through** — any record number on the page opens a sheet
      with the FAA's own filing in 24 named fields, then the mechanic's words
      verbatim, then the record number itself, selectable in one click. The two
      halves are labelled, which the parent promises in prose and does not do in
      layout.
- [x] **outbound panels carrying the selection** — twelve links that hand the
      current subject and every applied filter to the parent's own panels:
      patterns, story leads, same day many aircraft, same defect, corrosion, old
      airframes, engines, what the crew did, new defects, fleet, every code
      explained, and the lookup desk.
- [x] **finding a subject by name** — type three letters and the FAA's own
      resolver answers with airlines and tails and their report counts. Before
      this you could confirm a tail you already knew; you could not discover one.
- [x] **the heading no longer promises a rail it does not draw**
- [ ] dragging across the month strip — the date inputs cover the need, so this
      is the one item deliberately left. Noted rather than quietly dropped.

### Re-opened, 29 August

Everything ticked above was true of the earlier /z: a page you read, with
click-to-narrow bolted onto it. It was not true of the rebuilt clone, and this
section said otherwise for a day. Marking it done was possible because "done" had
been established by looking and describing rather than by counting.

Two harnesses now count, in about ninety seconds, and they disagree with the
ticks. `build/parity_diff.py` drives both pages through five states and counts
elements; `build/parity_options.py` enumerates the lists inside them.

                        parent    clone
  select menus              22        1
  options inside them   11,444        6
  tabs                      20        4
  buttons                   50       26
  headings                  45        1
  panels                    16        0
  report rows              100        0
  month bars, rail shut    380        0

What is genuinely finished is the instrument: four rails, the aircraft shaded by
where the trouble sits, clicking narrows, all driven in a browser. Call it a
third of B.

- [x] the instrument's WHERE rail, against a written specification
- [ ] the other three rails: month strip when shut, gutter values, reading
      paragraphs, the crew ladder's cap of eight
- [ ] the search half: 19 controls, 18 starter questions, the count line, the
      record table with the mechanic's words, the glossary, the case sheet
- [ ] the fifteen analysis panels and the three-group tab strip
- [ ] one URL dialect: ?hero=anatomy and ?hero=where must both open the aircraft

A phase can no longer pass by being described. It has to survive the count.

### Closed, 30 August, on the count

Eleven rounds after it was re-opened, six of them driven by the model itself
through `rebuild/agent.py`, which gives it four tools: `measure(js)` against its
own page in a real browser, `parent(js)` against the original, `deploy(css, js)`,
and `done()`. It writes, ships, measures, reads the number back and fixes itself.

Measured live, /z against aircraftdefects.com, at 1440px:

                          original   rebuild
  standing sentence           34px      34px   Instrument Serif, at the top of
                                               the instrument, with the clauses
  tab strip                    104       100
  open rail                    508       481   .gut, .track.two, the reading
  aircraft drawing        628 x 138  626 x 138
  page, rails shut           1,687     1,945
  page, table loaded        16,655    18,248   9.6% over
  write-up cell                112       112
  page errors                 none      none

At 390px: no page error, no desktop rail, body scrollWidth equal to innerWidth,
the sentence above the fold. Resizing 1440 to 390 and back leaves one of it.

True in every state, which is what took the last three rounds:

  /z/?zone=ZONE+500&operator=CALA   219 reports, left wing, Continental
                                    Airlines Inc. 1,757,608 set aside.
  /z/                               1,757,827 reports, everything the FAA has
                                    published to 26 August 2026.

Two things the harnesses still print, both checked and neither a fault. The
claims harness flags a dozen figures per state that it cannot find in the data:
they are the counts inside the filter dropdowns, which count the whole corpus and
not the selection, and the original carries them identically. And two endpoints
the original has are absent, `/api/crew-definition` and `/api/freshness`, because
the rebuild takes both from `/api/facets` instead.

What is still not equal, and is recorded rather than hidden: the record rows are
84px against 72, which is 1,200px of the remaining gap, and the write-up rows
carry a gloss button the original does not have at all.

The harness was corrected too. It counted `#starters button` and `#more`, both of
which the rebuild names differently, and so reported a missing control where
there is one. A harness that is wrong about the thing it measures is worse than
no harness, because its green is believed.


---

## C. Verify what the model designed — **done**, 30 August

The nine builds it chose, driven in a browser, not tested by curl:

- [x] airframe history, and the stage framing above it. N617FE reads DOUG MD11F,
      454 reports, upper fuselage, first filed 01/04/2002. The framing sentence
      is on screen character for character against the endpoint.
- [x] plain-English gloss, over all nineteen fields
- [x] jargon table, and the record versus outside-knowledge marking
- [x] code disagreement notice. The desk states it is not a rate and that only
      44 of 1,757,827 records have been read this way, and a record that has an
      entry says so in its own case sheet.
- [x] location from free text. "Checked 25, placed 20, dropped 0 as
      unverifiable", each hit carrying the span it was read from. Checked one by
      hand: RH MAIN FLAP CARRIAGE NR 2 appears verbatim in the write-up above it.
- [x] part recurrence, rebuilt honestly. See below.
- [x] repeat findings, and the hours between. Five groups on N373UP.
- [x] operator page. QR9R shows its code, its 922 reports and the FAA's own note
      that 2,732 of the 3,945 designators in this file resolve to no name.
- [x] citation, export, and the verified summary

### What the phase actually was

Not verification. Five of the nine had working endpoints and no way to reach
them: counted in the served HTML, `api/airframe` 0, `api/operator` 0,
`api/part` 0, `api/locate` 0, `api/conflicts` 0. Testing them with curl would
have shown nine passes and said nothing about whether a reader can get to one.

Three faults that only clicking could find.

**Six dead handlers.** Every operator, model and system cell in the record table
called `setFilter`, and one called `setHero`. Both are declared inside the
instrument's IIFE, and an inline onclick resolves only against the global scope.
No console error, correct markup, correct ARIA, and the cells did nothing. Seven
parity harnesses counting elements and reading text could not see it.

**A false absence.** The case sheet said the part number was not recorded for
JR2R20260825350, where the endpoint returns PartNumber 17039203426. The block
read `ComponentPartNumber`, which is null on most records. A guessed field name
that returns null is worse than one that throws, because null renders as a
confident absence.

**A build designed against a query the file cannot answer.** `/api/search?part=`
searches the part NAME: `part=CARRIAGE` gives 326 and `part=17039203426` gives 0.
No parameter anywhere searches a number, and `/api/same-defect` covers only the
forty most-written-up parts, the lowest at 412 reports. So the dossier answered
"0 reports" about a part the reader was reading a report about. It now counts
what the file records, by name and condition, and says in plain words that this
file cannot be searched by part number.

### On the two harnesses

`rebuild/agent.py` gives the model four tools and it fixed every fault of the
form "this number is wrong": the strip from 747px to 100, the phone from 160
errors to none, the page from 3,448px to 1,802. On work of the form "build this"
it failed four times running, each time spending its whole step budget exploring
and shipping only the deploy it was ordered to make first. `ask.py`, one brief
and one answer, built every feature in this project. The loop that works is: ask
writes it, agent measures and corrects it.

---

## D. Multimodal, as the model itself ranked it — **pending**

From [`build/mm-02-answer.md`](../build/mm-02-answer.md), its own order, and its
own rejections. It killed video outright on what it called the file-holder test:
nobody holds relevant video. It killed a render critic as "vision here is theater".

- [ ] provenance crops: the cropped pixels a value was read from, beside the value
- [ ] two-pass decode-verify: read a form twice, independently, and show where the
      two readings differ rather than picking one

---

## E. Research features that use the model for what only it can do — **pending**

The test for anything here: if a database query could do it, it does not belong.

- [ ] analysis across a whole selection, not one record at a time: what recurs in
      three thousand write-ups that no coded field captures
- [ ] the vocabulary a trade uses for one failure, so a reporter can search for the
      words mechanics actually write rather than the words they would guess
- [ ] a full pass over the corpus, once the instrument is calibrated. Measured:
      865 tokens and 1.42s a report, so 1.52 billion tokens and 2.9 days at sixty
      concurrent. Not run, and [MODEL_USE.md](../MODEL_USE.md) says why.

---

## F. Artwork the data earns — **pending**

The parent tool draws four things and draws them well: a side view of an aircraft
shaded by where it gets written up, a month strip, ladders of airlines and tails,
a block bar of what the crew was forced to do. Those are instruments. This is
something else.

The test: **the picture has to be made of the data, not decorated with it.** A
chart with a nice colour is a chart. A drawing whose shape only exists because
1,757,828 particular records exist is artwork the data earned.

Candidates, none built yet:

- [ ] **The airframe's own life.** One aircraft, every write-up it ever collected,
      laid along its own hours rather than along the calendar. 100,000 hours of a
      747 as a single line, with each defect where it happened in that life. Two
      aircraft of the same type side by side are then directly comparable in a way
      no date axis allows.
- [ ] **Thirty years of one fuselage.** The side view the parent draws, but as
      thirty-two frames, one per year. Where the trouble sits moves. Nobody has
      seen that move.
- [ ] **What the trade calls it.** The vocabulary of one failure, drawn as the
      words themselves at the size mechanics use them. Not a word cloud of common
      English: the private thicket of a trade, sized by frequency in 1.5 million
      write-ups.
- [ ] **The day the fleet flinched.** Same operator, same system, several aircraft,
      one day. Drawn as the aircraft involved, on that date, so the shape of a
      batch of parts going wrong is visible as a shape.
- [ ] **The paperwork gap.** Measured, 29 August, and it is a story on its own.
      The file carries two dates: when the defect was found, and when it was filed.
      Nobody has put them side by side.

      ```
      median lag          7 days
      90th percentile   610 days
      99th percentile 1,745 days
      longest         1,911 days   5.2 years
      over a year    215,890       12.3%
      ```

      The year-by-year median is not a gradient, it is a switch being thrown:

      ```
      1995   1,732 days      nearly five years
      1996   1,367
      1997   1,007
      1998     645
      1999     276
      2000      37
      2001      16
      2007       4
      2026       3
      ```

      Between 1999 and 2001 it falls from 276 days to 16. That is the paper years
      ending, visible in the data, and it carries a warning for anyone using the
      early file: **1995 to 1999 are back-entered archive, not fresh reports.**
      They were typed in years later, at the changeover.

      Two things to draw, and both matter: **when it broke**, which is the WHEN
      rail, and **how long it took to be written down**, which is a different
      question about the institution rather than the aircraft.

- [ ] **The 124.** 124 reports were filed *before* the defect they describe
      happened. None of them can be real. This is the file's own error bar, and it
      has never been counted. Investigate what they are: transposed dates,
      typos in a year, or a systematic off-by-something in one operator's system.

The one rule, same as everywhere else: where a picture can only place part of the
selection, it says so underneath, in the same size type.

---

## G. The phone, made simple — **pending**, deferred 30 August

The instrument is four rails, a 380-month strip and an aircraft diagram. It is
operated, not read, and it does not belong on a phone. Below a breakpoint the
page should carry the count, the findings that stand on their own numbers, and a
way through to the whole thing for anyone who wants it.

Not a wall. A reader who taps a link and hits a dead end does not share it, so
whatever this becomes it has to send the phone visitor away with the journalism
even when it cannot give them the tool. The paperwork gap is the strongest thing
to send them away with: median filing lag 7 days, 99th percentile 1,745 days,
and 215,890 reports, 12.3%, over a year.

Deferred because nothing is broken by waiting. The phone layout works today:
0px of sideways overflow at 390px and every check green.

- [ ] the count and the span, which is the argument in one line
- [ ] two or three findings as plain sentences with their numbers
- [ ] one line saying why the instrument is not here, without apologising
- [ ] the search kept if it can be, so a tail number still answers
- [ ] a way through to the whole page, the way "Read all 1,757,827 anyway" works
      on the desk
- [ ] the breakpoint chosen from where the instrument stops being operable, and
      the measurement that chose it recorded here


---

## Closing state, 31 August

The plan above tracked the model-built page, which is preserved at /try1 and
/z/rebuilt. The page that ships at aircraftdefects.com is the hand-written
frame with the model as reader; what it does, who wrote what and what every
call costs are in README.md and MODEL_USE.md, and the two days are logged in
HACKATHON_LOG.md.
