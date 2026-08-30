# Make it readable

[![GLM-5.3-Flash](https://img.shields.io/badge/GLM--5.3--Flash-320B%20%2F%2018B%20active-9c4a1e.svg)](https://docs.z.ai/guides/vlm/glm-5.3-flash)
[![Live](https://img.shields.io/badge/live-aircraftdefects.com%2Fz-1f5c3d.svg)](https://aircraftdefects.com/z/)
[![Records](https://img.shields.io/badge/records-1%2C757%2C827-informational.svg)](https://aircraftdefects.com/z/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/GLM--5.3%20Flash-Lightning%20Hackathon-blueviolet.svg)](https://cerebralvalley.ai/e/glm-5-3-flash-lightning-hackathon)

**A government can publish everything it holds and still answer none of your
questions.**

I was watching *Freefall* on Netflix. Relatives of people who died were trying to
find out what had been reported about the aircraft, on a government website. Row
after row of capital letters. Zone numbers. Single-character codes.

I stopped the documentary, typed the URL in myself, and never went back to it.

What is there is 1,757,827 reports going back to 1995, on 54,634 aircraft, every
one free to read and almost none of them ever read. A report says `ZONE 700`
where it means the landing gear, and `A` where it means the crew landed somewhere
they had not planned to.

This repository is an instrument for reading it, written by **GLM-5.3-Flash**
from specifications, and measured in a browser.

**Live: [aircraftdefects.com/z](https://aircraftdefects.com/z/)**

---

## The method: instructions, not code

The model is not handed an implementation to copy. It is handed a written
specification of what a surface has to do, and it decides how.

The specifications are in [`rebuild/specs/`](rebuild/specs/), 9,556 words across
six files, one per surface. They are written as decisions rather than as shapes,
because the decisions are the part a model cannot infer:

> Both bars are scaled against the corpus maximum, never against the selection's
> own. The selection is always drawn as a fraction of the whole, so a small
> selection looks small. When that makes it invisible, add a labelled magnified
> line with the factor printed rather than silently rescaling.

> `crew_reports` is the distinct report count. A report carrying three watched
> codes counts once. It must never be derived by summing the per-code counts: in
> the whole corpus those sum to 165,298 against a `crew_reports` of 151,543.

> A period wholly outside the file is left as asked, not clamped. Clamping would
> produce "1 Dec 2026 to 20 Aug 2026", a range that runs backwards. Left as
> asked, it returns nothing and says so.

Each brief carries the specification, the measured evidence for what is wrong,
and the checks the result has to pass. Every one is committed:
[`rebuild/*.prompt.txt`](rebuild/).

## What it builds

An instrument at the top of the page and a desk beneath it.

Four rails, one open at a time, each answering one of the questions a reporter
asks in the order they ask them. **WHEN**, a month strip across the whole span,
drag across it to take a period. **WHERE**, a side view of an aircraft shaded by
how often each zone is written up. **WHO**, ladders of airlines and individual
airframes. **WHAT IT FORCED**, what the defect made the crew do.

Every mark on it is a filter. Click the crown of the fuselage and the whole desk
narrows to the 84,453 reports found there, the address bar follows, and the link
is the state.

Below it, sixteen panels and the records themselves, each with the mechanic's own
words underneath and every abbreviation explained.

## What is not the model's

Seven files of the served page are hand-written, 4.5% of it by character count, plus one edit inside a model block.
`rebuild/bridge.js.bak` joins the two halves the model built separately.
`rebuild/47-hand.js` fixes two faults found by looking at the screen on 30 August
that two model rounds did not land: an empty state shown over live results, and
a dossier that ignored the selection and printed a second count. Both are
counted, with the commands to verify the figures, in
[`MODEL_USE.md`](MODEL_USE.md). Everything else on the page is GLM-5.3-Flash.

## Nothing is asserted that the file cannot carry

The data has no fleet sizes and no flying hours, so there are no rates and no
league table of airlines. Counts are counts of reports filed, not of flights, and
the page says so in the margin rather than in a footnote.

Where a picture can only place part of the selection, it says so underneath in
the same size type. The aircraft can draw 212,940 reports. The other 1,544,887
say where in words the drawing cannot place, or say nothing at all, and the
sentence under the drawing gives both numbers.

An unrecognised value in a link runs no query at all, and says why, rather than
answering with the whole corpus under a filtered heading. That refusal is what
made a real bug visible on day one: a zone lookup keyed on `200` where the data
says `ZONE 200` had flattened the aircraft to one colour and, unnoticed, broken
the zone filter as well. See [F5](docs/FINDINGS.md).

## Measured, not described

Two harnesses drive both the instrument and the reference implementation through
the same states in a real browser and count what each one has.
[`build/parity_diff.py`](build/parity_diff.py) counts elements;
[`build/parity_options.py`](build/parity_options.py) enumerates the lists inside
them, every select with all of its options, every button label, every endpoint.

They run in about ninety seconds, which means a surface is finished when it
survives the count rather than when it looks finished. Twice already the count
has disagreed with the eye, and twice the count was right. Both times are written
down in [`docs/FINDINGS.md`](docs/FINDINGS.md), including a measurement that had
to be retracted publicly when its adjudicator turned out to be a constant.

## What is in here

| | |
|---|---|
| [`rebuild/specs/`](rebuild/specs/) | the six specifications, 9,556 words |
| [`rebuild/*.prompt.txt`](rebuild/) | every brief sent to the model, verbatim |
| [`rebuild/*.reasoning.md`](rebuild/) | its reasoning traces, 1.59 million characters kept |
| [`rebuild/splice.py`](rebuild/splice.py) | merges its blocks, catching the collisions that fail in silence |
| [`build/parity_*.py`](build/) | the measurement harnesses |
| [`docs/FINDINGS.md`](docs/FINDINGS.md) | eight findings, including the ones that cost a day |
| [`docs/PLAN.md`](docs/PLAN.md) | the work plan, with what is genuinely done and what is not |
| [`MODEL_USE.md`](MODEL_USE.md) | how the model is driven, and what that cost |

## Running it

```bash
export ZAI_API_KEY=...
python3 rebuild/ask.py <name> <brief.txt> [effort]   # ask the model for a surface
python3 rebuild/build_z.py                            # build and deploy both pages
python3 build/parity_diff.py                          # count what is missing
python3 build/parity_options.py                       # list what is missing
```

MIT. The data is the FAA's, published under its own terms. Codes are decoded from
the FAA's own lookup tables; airline names come from its December 2006
cross-reference and can be stale, so check current ownership before publishing.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*.
Built by Henk van Ess, 2026.
