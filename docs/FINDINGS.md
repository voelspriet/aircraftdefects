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
