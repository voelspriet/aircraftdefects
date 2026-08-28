# What the tool found in the file

Findings about the FAA's data itself, produced while building on it. Each one is
reproducible from this repository.

---

## F1. In 14.5% of long reports, the ticked box contradicts the paragraph

**Measured 29 August 2026.** Script: [`build/measure_tension.py`](../build/measure_tension.py).
Raw results: [`build/tension-results.json`](../build/tension-results.json).

A Service Difficulty Report has two halves. The filer ticks coded boxes, and the
same filer writes a description. Nobody has ever checked whether the two agree,
because there is no way to ask. No database query expresses "the tick box
disagrees with the paragraph". It needs something that reads both and compares.

```
sampled            200   drawn from 159,585 reports whose narrative runs past
                         400 characters and whose stage code is a real value
answered           200
failed               0
disagreements       29   14.5%
high confidence     26   13.0%
wall time         4m29s   at six concurrent requests
```

Which field disagreed:

| Field | n |
|---|---|
| Nature of condition | 8 |
| Stage of operation | 6 |
| How discovered | 5 |
| What the crew did | 4 |
| Part condition | 3 |
| System | 1 |
| Part | 1 |
| Part and part condition together | 1 |

### The ones that matter

**Nature of condition: `False warning`.** Record `ASOA01029`, 17 March 2001. The
narrative describes the landing gear failing to come down when commanded, the crew
executing an electric override, and a proximity switch being removed and replaced.
That is a real malfunction filed under the code for a spurious alert. Anyone
filtering this file for genuine failures would never see it.

**What the crew did: `Emergency descent`.** Record `USAASB96182`, 6 September 1996.
The crew descended to 10,000 feet and returned to the field, and the write-up states
in capitals `NO EMERGENCY WAS DELCARED`. The code overstates what the same person
wrote two lines below it.

**Part condition: `NO INDICATION`.** Record `DALA2022070804785`, 7 July 2022. The
narrative says the number 9 fastener hole `HAS INDICATIONS` at roughly the one
o'clock and nine o'clock positions. The code says the opposite of the text.

**System: `Leading Edge Devices`.** Record `20000622AP002`, 10 April 2000. The
narrative describes flaps throughout, including a sheared bearing attach bolt on the
left outboard flap. Flaps are trailing edge devices. Filed under the wrong end of
the wing.

**Part: `NONE`.** Record `SWIA202163274`, 2 December 2021. No part recorded, while
the text names an intercostal, part number SH670-31994-1, removed and replaced.

### What this is not

**It is a reading from an uncalibrated gauge.** The model's judgement is the
instrument, and no human has labelled these 200. The rate could be materially
wrong in either direction, and the fair thing to do with it is to hand-label the
sample and publish the precision and recall before anyone quotes 14.5%. The design
session's own Phase 4 demanded exactly that, at 200 to 300 records, before any
extraction feature ships. That check has not been done.

**It is not evidence of anything being covered up.** Filing a report is voluntary
work on top of the repair itself, the coded fields are a dropdown next to a free
text box, and people are busy. Careless coding is the boring explanation and it is
almost certainly the right one.

**It is not a measure of the whole file.** The sample is deliberately drawn from
long narratives, because a one-line write-up has no sequence to contradict. Short
reports are the majority and were not tested.

**No count here is a rate.** Nothing in this file is divided by fleet size or
flying hours, and it never can be.

### Why it matters anyway

The coded fields are how everyone searches this database, including the FAA's own
query page and the parent tool. If roughly one in seven detailed reports is filed
under a code its own narrative contradicts, then every filtered count over this
file carries an error nobody has measured, and the write-ups are the only place the
truth survives.

That is an argument for reading the text, which is what 1.5 million people have
not done because it was not readable.

### Reproducing it

```bash
./.venv/bin/python build/measure_tension.py
```

The sample is deterministic, seeded on a hash of the record id, so the same 200
reports come back every run.

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
