# What the tool found in the file

Findings about the FAA's data itself, produced while building on it. Each one is
reproducible from this repository.

---

## F1. Codes that contradict their own narrative exist. How often is not known.

**Measured 29 August 2026, then retracted the same day.**
Scripts: [`build/measure_tension.py`](../build/measure_tension.py),
[`build/validate.py`](../build/validate.py).
Raw: [`build/tension-results.json`](../build/tension-results.json),
[`build/validation-results.json`](../build/validation-results.json).

A Service Difficulty Report has two halves. The filer ticks coded boxes, and the
same filer writes a description. Nobody has checked whether the two agree, because
no database query expresses "the tick box disagrees with the paragraph".

### What was claimed, and why it does not stand

A first pass over 200 long reports flagged 29, and this document said **14.5%**.
That number was published here for about an hour. It should not have been.

Every flag was then put to three adjudicators, each told to refute it rather than
confirm it, a flag surviving on two of three. Four survived. That would put the
rate at 2.0%.

Neither number is trustworthy, and the reason is in how the three voted:

| Adjudicator | upheld | refuted |
|---|---|---|
| literal | 16 | 13 |
| charitable | **0** | **29** |
| sequence | 5 | 24 |

**The charitable adjudicator refuted every single flag.** An instrument that always
returns the same answer measures nothing. It was instructed that "if a defensible
reading exists, the flag fails", and for a broad FAA code definition a defensible
reading almost always exists. So a two-of-three rule silently became "literal and
sequence must both agree", and the 2.0% is an artefact of a broken third vote.

So: 14.5% was uncalibrated. 2.0% is calibrated with a gauge that has a stuck
needle. **The honest position is that the rate is unknown**, and the range those
two numbers bracket is wide enough to be useless.

### What does stand

Four flags survived a test designed to kill them, and they are not marginal:

**`Engine shut down in flight`** on `AALA202111165003`. The aircraft was on the
ground during boarding with the jet bridge pulled away, and it was the APU that
auto-shut-down before the crew could switch it off. Not an engine, not in flight.

**`Unscheduled landing`** on `CA141106001`, over a narrative reading
`CONTINUED TO DESTINATION`, landing normally. Nothing unscheduled occurred.

**`Unknown`** as how-discovered on `QXEA2014050300368`, where the text says a
flight attendant reported the aft passenger door handle was not seated.

**`Lost more than half of the electrical power`** on `CA121213002`, over a
narrative describing an intermittent heading drift of 7 to 8 degrees on one
display.

A recheck of 40 unflagged reports found 2 the first pass had missed, so the first
pass was not only over-flagging: it was missing things as well.

### What would settle it

A human labelling the 200 by hand. Not another model, and not another lens: the
whole problem here is that every number so far came from the same kind of judge.
Until someone does that, this stays a demonstration that the disagreements exist,
with four documented examples, and no rate attached.

### What was built instead: a ledger

Two attempts to produce a rate failed. So the tool stopped trying.

**[aircraftdefects.com/z/conflicts](https://aircraftdefects.com/z/conflicts)** is a
running list of individual cases rather than a percentage. A rate needs a
denominator, a denominator needs a calibrated instrument, and there is not one. A
ledger needs neither.

It fills up from ordinary use. When a reader opens a report and presses *Say this
in plain English*, the model rephrases the write-up, and if it notices the ticked
box disagreeing with the paragraph it says so. That case is written down with its
record number. Same report read a hundred times, one entry.

Nothing sweeps the file. The ledger grows only where somebody looked, which means
its size measures attention, not prevalence, and the page says so in the first
paragraph.

Each row carries two buttons: **I read it, this holds** and **I read it, this is
wrong**. Both counts are kept and shown. A disputed entry is as useful as a
confirmed one, because it marks a case where the model and a human disagree, and
those are the rows worth studying.

It opens with the four cases that survived the refutation test, so it does not
start empty.

The design follows from the failure rather than papering over it. The thing that
could not be measured can still be documented, one record at a time, by the people
reading them.

### The method lesson, which is the more useful finding

An adversarial check is only worth running if its verdicts vary. Three lenses were
built to be independent, and one of them was written so strictly that it became a
constant. It looked like rigour and it destroyed the measurement, in the direction
that feels safe, which is the direction that is hardest to notice.

That is checkable in one line and it should be the first thing checked on any
panel of judges: did each judge ever disagree with itself across the set?

---

## F2. HowDiscoveredCode does not say what it looks like it says

Found while checking the design session's own recommendation, and it invalidated
part of it. See [`design/03-stated-vs-inferred.md`](../design/03-stated-vs-inferred.md),
where the model flagged its own claim as unverified before the database disproved it.

```
V  Someone looked at it   727,012   47.4%
O  Other                  351,589   22.9%
9  Unknown                295,865   19.3%
C  Functional check       137,943    9.0%
```

Forty-two percent of the field is `Other` or `Unknown`. It cannot support any claim
about how defects are found. The signal people reach for is in `StageOfOperationCode`
instead, where `IN`, on the ground in inspection or maintenance, covers 1,303,444 of
1,757,828 records: **74% of all reports were written with the aircraft on the ground.**

That number is the honest answer to the reading this file invites, which is that a
list of defects is a list of things that went wrong in the air. Mostly it is a list
of things found while servicing.

---

## F3. Airframe hours are in the file. Fleet hours are not.

`AircraftTotalTime` is populated in 1,392,742 of 1,757,828 records, 79%, ranging
from 1 to 499,635 hours. `AircraftTotalCycles` in 76%.

So the file does carry hours, and an earlier version of the parent tool said it did
not. What it does not carry is how many hours a fleet flew, and the only aircraft
with hours in it are the ones that had something filed. An aircraft that flew for
years and was never written up does not appear at all, so a denominator built from
this file would be built out of its own numerator.

Which leaves one thing that is real and was not being used: **the hours between two
write-ups on the same airframe.** That is an interval, not a rate, and it is
computed by `/z/api/repeats/<tail>`.

---

## F4. Record ids do not collide

The model warned, unprompted, that `OperatorControlNumber` is assigned by the airline
and would likely be reused across thirty years, which would silently merge two reports
into one in any per-aircraft view.

Checked: 1,757,828 records, 1,757,828 distinct ids, zero collisions. The warning was
worth having and the citation backbone is safe.

That is twice in one day the model raised a well-aimed doubt and was wrong on the
fact. The doubts are worth having. The facts need the database.

## F5. One line broke both the picture and the filter (29 Aug 2026)

GLM's rebuilt instrument drew the aircraft but never shaded it. Every zone came
out the same flat colour, which removes the entire reason the drawing exists.

Root cause, line 247 of `rebuild/01-instrument.html`:

    const ZONE_ORDER=["100","200","300","400","500","600","700","800","900"];

The API returns `code:'ZONE 200'`, not `'200'`. The lookup Map is keyed on the
prefixed value, so every `by.has(code)` was false, every count read 0, and every
shape got the floor of the opacity ramp.

The same line broke the zone filter, which nobody had noticed. The marks carried
`take="zone|100"`, so the page sent `zone=100`, and the server answered:

    {"error":"rejected filter values",
     "message":"These values are not valid for this data: zone=100,
                so no query was run.", "rejected":{"zone":"100"}}

against `zone=ZONE%20100`, which returns 60,966.

Two symptoms, one cause. Worth recording for two reasons.

**The parent's fail-closed rule earned its keep.** `_filters()` rejects an
unrecognised value instead of ignoring it. Had it ignored `zone=100`, the page
would have shown the unfiltered 1,757,827 under a zone heading: a wrong number
that looks right, which is the kind that reaches print. The 400 made a silent
error loud.

**It is an argument about how to write a specification.** `code:'ZONE 200'` is a
fact about the data, not an implementation detail. A spec written from the source
code describes shapes; a spec written from the behaviour describes values. The
six rail specifications in `rebuild/specs/` are written the second way for
exactly this reason.

Correction sent to GLM with the evidence attached rather than an instruction,
and with three acceptance checks it had to build for. See
`rebuild/02-where.prompt.txt`.

## F6. The comparison had to be mechanical (29 Aug 2026)

Six agents read the parent instrument and wrote down what it does. That produced
good specifications, and it found the zone bug. It did not produce a comparison:
every agent described the parent, none of them counted the clone.

`build/parity_diff.py` drives both pages through five states in a real browser
and counts elements. Prose about parity is an opinion; a count is not.

With a zone filter applied, 29 Aug 2026:

                              parent   clone
  filter controls                19       0
  starter questions              19       0
  panels                         16       0
  report rows                   100       0
  mechanic's write-ups          100       0
  case-sheet buttons            101       0
  month spine rows                1       0
  decoded glossary terms        396       0
  month bars, rail shut         380       0
  crew ladder rows                8      10

Two findings the eye had missed.

**The crew ladder draws ten rows where the parent caps at eight.** The parent
counts ten watched codes and silently omits up to two, with no "more" affordance,
unlike the WHO rail which discloses its cap twice. More is not better here: the
cap is the specification.

**The two pages spell their rails differently in the URL.** The parent uses the
hero key (`?hero=anatomy`), the clone uses the rail id (`?hero=where`). A link
copied out of the parent opens the wrong rail on the clone. Shareable links are
the parent's whole citation model, so this is not cosmetic.

The harness also caught its own first error: it had probed the parent with the
clone's vocabulary and reported the parent as having no WHO rail. Recorded here
because a comparison tool that flatters one side is worse than none.

## F7. Counting features was not enough either (29 Aug 2026)

F6 counted elements and found the lower half of the page missing. That was still
too coarse. `build/parity_options.py` enumerates the actual lists: every select
with all of its options, every button label, every tab, every heading, every
endpoint each page calls.

                        parent    clone
  select menus              22        1
  options inside them   11,444        6
  tabs                      20        4
  buttons                   50       26
  headings                  45        1
  panels                    16        0

Twenty-two menus are missing outright, among them operator with 3,947 options,
condition with 3,131, make with 248 and ata with 49. Every one is built at boot
from `/api/facets`, sorted by report count, each option labelled with its own
count so a reader can see what is worth choosing before choosing it.

The endpoint lists explain a figure from F6 that had looked mysterious. The clone
calls `/z/hero`, `/z/trend`, `/z/facets` and `/z/api/codes`; it never calls
`/api/glossary`. Without it there is no code table, which is why 396 decoded
abbreviations in the parent's write-ups came out as 0. The missing glossary was
not a rendering fault. The page had never asked for the meanings.

Three lessons, in order of how expensive they were:

- A count of features says a table exists. A count of options says the table can
  be operated. Only the second is parity.
- The harness must enumerate, not summarise. "Filters missing" is a note; "#operator,
  3,947 options, missing" is a work item.
- Both harnesses are in `build/` and run in about ninety seconds, so this is
  checkable on every change rather than argued about.

## F8. Three ways two good blocks can kill each other (29 Aug 2026)

Three briefs came back and none of them dropped in cleanly. The failures are
worth recording because none of them produced an error message.

**A const and a function of the same name.** The original declares `esc`, `num`,
`opName` and `params` with `const`. The new block declared them as functions. In
one scope that is a SyntaxError, so nothing at all runs: empty body, HTTP 200,
nothing in the console.

**Two functions of the same name.** Two blocks, written by the same model in
separate sessions with no knowledge of each other, both declared `pct`. One takes
`(a, b)` and returns a percentage; the other takes `(rows, n)` and returns a bar
width. The later declaration wins, silently, and a rail stopped opening. This is
the more dangerous of the two: the hard collision fails immediately and loudly in
the sense that nothing works, while the soft one fails only at the call site.

`rebuild/splice.py` now excises the hard collisions and renames the soft ones on
the way in.

**A boot with no readyState guard.** The new instrument boots at parse time and
looks for its mount. The host page had the script before the div, so the element
did not exist yet; it set its own booted flag and never tried again. In silence.
The fourth silent failure of the day, and the pattern is always the same: a
defensive early return that is correct in isolation and costs a measurement round
every time.

Also recorded: the brief for the search half was **truncated**. 378,982
characters of reasoning plus 66,122 of writing hit the 128,000-token ceiling and
the file ends mid-function. `max_tokens` covers thinking and writing together, so
on a long brief the effort level is a budget decision and not only a quality one.
Re-run as two halves at `high` rather than `max`.

## F9. Six guessed field names in one afternoon (29 Aug 2026)

The model writes correct code against data it cannot see, and where it cannot see
it, it guesses. Every guess this afternoon produced code that ran, logged
nothing, and quietly dropped what it could not find.

| read as | the data says | what was lost |
|---|---|---|
| `z \| zone \| id \| k` | `code` | every zone row, so the aircraft drew nothing |
| `["100","200",…]` | `ZONE 200` | the shading, and the zone filter |
| `f.operators` as `[{v,n}]` | a plain array of strings | 3,947 airline options |
| `f[k]` keyed plural | controls keyed singular | every facet menu |
| glossary read whole | tables nested under `codes` | every decode, so chips printed raw codes |
| `OperatorCode`, `Make`, `HoursOnAircraft` | `OperatorDesignator`, `AircraftMake`, `AircraftTotalTime` | six rows of the case sheet |
| `/api/search?ctrl=` | `/api/case/<control>` | the case sheet said the FAA had not answered |

None of these threw. The last one is the sharpest: an unknown filter name is
refused outright by the server, exactly as designed, and the sheet reported that
refusal as the FAA having no record of the report. A correct refusal, displayed
as a fact about the world.

**The lesson is about specifications, not about the model.** A field name is a
fact about the data, not an implementation detail, and a specification written
from behaviour will not contain one unless someone puts it there. The six
specifications describe what each surface does and why; they do not carry the
response shapes. That is now the gap to close.

Two more, from joining halves that were specified separately:

**Each half built a whole.** The controls and the rows were briefed as two halves
of one desk, each told to assume the other. Each then wrote its own search, its
own count line and its own corpus total, so the rows loaded with nothing chosen
and captioned a hundred of them "match your selection" over an empty selection.

**The gate was open because the URL carried the view.** The page's `params()`
returns the whole query string, `hero` included, where the reference reads the
form controls, in which `hero` cannot appear. So opening a rail counted as
choosing something and the on-purpose gate never closed. Which rail is open is a
view, not a selection.

**And the order of two lines cost every filter in every link.** The controls
restored values from the URL before building the options, so every select refused
every value and marked it unresolved. The silent refusal the code exists to catch
was being caused by the order it ran in.

## F10. What only a layout run finds (29 Aug 2026)

Counting elements says the parts are on the page. It says nothing about where
they land. `build/parity_layout.py` loads both pages three times at two window
widths, in three states, and compares geometry.

Four faults, none of which any count would have shown.

**The WHERE rail was drawn twice.** `restWhere()` already returns a whole rail,
gutter and all, and the adapter wrapped it in another. In the run it reads as
`when, where, where, whose, forced`: five rails on a four-rail instrument.

**The page scrolled sideways at 820px.** The table is 1080px wide by design and
its box is meant to clip it. The box had no rules at all, because the model's
CSS fence opened with a literal `<style>` line; nested inside the page's own
style element it closed it early, and every rule after it sat outside any
stylesheet. The markup was there, the styling was not, and nothing reported it.

**The drawing was a third of the size at 900px.** The reference drops the
aircraft out of its two columns near 960; the rebuild held to 760, so between
those widths the drawing got whatever the 330px legend left over: 312px against
640. Both pages were "correct" at 1440 and on a phone, and wrong in between,
which is the width a laptop actually uses.

**The style rule that could not win.** The fix was applied to the static
stylesheet, where it lost to the instrument's own CSS, injected into the head at
runtime and therefore last in the cascade. The measurement said 312 three times
in a row before the cause was found in the right file.

Cumulative layout shift runs between 0.24 and 0.87 on **both** pages, so the text
reflows as things load in each of them. That is not a regression, and it is not
acceptable in either; it is now a known item rather than an impression.

## F11. The menus were the right length and the wrong words (29 Aug 2026)

The option enumeration reported operator at 3,947 against the reference's 3,947,
condition at 3,131 against 3,131, make at 248 against 248. Every count matched.
Every label was wrong.

    reference   Southwest Airlines Co (SWAA)
    rebuild     SWAA (no reports)

Three causes in one function.

**No code table for operators.** The lookup had entries for nature, crew,
condition, stage, zone and corrosion, and none for operator, so the label fell
back to the designator. The name is what a reporter recognises and the code is
what they have to quote, so the reference prints both.

**A count that does not exist, printed anyway.** The endpoint answers with plain
lists for operator, make and condition: names in report order, no numbers. Every
option therefore read "(no reports)" about airlines with tens of thousands.

**Sorting by that count threw away the only ordering there was.** The lists
arrive ordered by frequency. Sorted by a number that is always zero, they came
back alphabetical by accident of the tiebreak.

Where counts exist they are shown and they sort; where they do not, the order
stands and the bracket is left off rather than filled with a lie.

Two more from the same pass. **Codes outside the FAA's own table were offered as
choices**: corrosion listed 0, 5, 6, 7, 8 and 9 beside its three real levels, and
the crew menu offered "-", "N" and "P". A value filed outside the table is still
shown in a row, as filed, but it does not belong in a picker. **And the typed
route was missing entirely**, because the aim box looked for the reference's
`.ipad` container, which this page does not have. It now mounts outside the
instrument, which redraws itself on every filter and would wipe anything appended
inside it.

Eight menus now match option for option: aimKind, ata, nature, crew, discovered,
stage, zone, corrosion. Operator, make and condition match in content and order.

## F12. A harness that does not open the drawers (29 Aug 2026)

The option run reported nine menus as missing. A click would have built every one
of them: the panels are lazily loaded, so only the panel that happens to be open
has its controls in the DOM. `build/parity_panels.py` walks every tab on both
pages and collects what each one offers.

With the drawers open the picture changed, and three real faults surfaced.

**A regression I had introduced myself.** The rule "only codes from the FAA's own
table" is right for corrosion, crew, stage and zone, which are closed
enumerations. It is wrong for operators: that table is a name cross-reference,
not a list of valid designators, and only 1,214 of the 3,947 that occur are in
it. Applied there it silently dropped two thirds of the airlines in the file, a
worse fault than the one it fixed. The count is now the tell: 3,947 against
3,947 says the list is whole.

**A part condition filed as "19681" was at the head of a 3,131-entry menu.** The
order these lists arrive in is the only ordering they have, and an object cannot
hold it: JavaScript enumerates integer-like keys first, in numeric order. The
position is carried on the entry now instead of implied by the key.

**The fleet panel's own airline menu listed raw codes with "(0)" beside every
one.** It read the facet under `operator` where the endpoint says `operators`, so
it came back empty and fell through to an alphabetical list of designators. It
now copies the menu the controls half already builds correctly, which also keeps
the two from drifting apart.

**And there was no rail picker at all.** The reference puts a `role="tablist"`
beside the stamp with four tabs and a roving tabindex. Without it a rail could
only be reached by clicking the rail itself: no keyboard route, and nothing
announcing which of the four was open.

Eighteen of twenty-two menus now match option for option, and the tab strip is
20 against 20. The four that remain have identical membership and identical
order at the head; they differ in the tail, among entries the endpoint returns
without counts, where the reference and the rebuild break ties differently.

## F13. The abbreviations went unexplained (29 Aug 2026)

The whole point of the write-up beneath every row is that a reporter can read
what the mechanic wrote. `POST-FLT INSP, (1EA) OVRHD SUPRNMRY AREA EMERGENCY
LIGHT INOP. RE-LAMPED, IAW AMM: 33-51-04-2` is unreadable without the trade's
own shorthand explained, and the reference underlines every term in it.

The rebuild underlined 101 things against the reference's 396, and all 101 of
them were something else: `no operator named`, repeated down the page.

`/api/glossary` answers with three parts. `codes` holds one table per coded
field. `terms` holds the mechanics' abbreviations as `key -> [Term, meaning]`.
`ata` holds the chapter names. Read as a flat list, `terms` had no `.length`, so
the fallback walked the three top-level keys and built three nonsense entries
called ata, codes and terms.

Both halves of the page had made the same mistake about the same endpoint in
different ways, and neither threw. The controls half read the whole object where
the tables are nested under `codes`, so every chip printed a raw code. The rows
half read a dictionary as an array, so no abbreviation was ever wrapped.

That is now four faults traced to one endpoint's shape, which is the strongest
argument yet for putting response shapes into the specifications rather than
leaving them to be inferred.
