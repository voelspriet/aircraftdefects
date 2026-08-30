# Make it readable

**Live: [aircraftdefects.com/z](https://aircraftdefects.com/z/) · MIT · GLM-5.3-Flash reads the file live**

A government can publish everything it holds and still answer none of your
questions. The FAA publishes 1,757,827 aircraft defect reports going back to
1995, on 54,634 aircraft, free to read and almost never read. A report says
`ZONE 700` where it means the landing gear, and `A` where it means the crew
landed somewhere they had not planned to.

This is an instrument for reading it. GLM-5.3-Flash reads the file live: every teal block on the page is the model reading write-ups on the spot, every quote it makes is checked against the record before you see it, and the frame it arrives in is hand-written (see MODEL_USE.md for who wrote what).

## What it does

Four rails answer the four questions a reporter asks, in the order they ask them.
When, month by month across thirty-one years. Where, a side view of an aircraft
shaded by how often each zone is written up. Who, airlines and individual
airframes. What it forced the crew to do.

Every mark is a filter. Click the crown of the fuselage and the desk narrows to
the 84,453 reports found there, the address bar follows, and the link is the
state. Below it, sixteen panels and the records themselves, each carrying the
mechanic's own words with every abbreviation explained.

## How the model was used

The model is not handed an implementation to copy. It is handed a written
specification of what a surface has to do, 12,243 words across eleven files, written
as decisions rather than as shapes. Why a zone is drawn twice. Why the distinct
report count may never be derived by summing the per-code counts. Why a period
outside the file is left as asked instead of clamped into a range that runs
backwards.

Each brief carries the specification, the measured evidence for what is wrong,
and the checks the answer has to pass. Every brief and every reasoning trace is
committed: 4.35 million characters of the model's own thinking.

## How it is checked

Two harnesses drive the page in a real browser and count what it has, down to
every option in every menu. A surface is finished when it survives the count, not
when it looks finished. A longer harness drives the page in a browser and checks
twenty-nine things a reader would notice: that the case sheet takes a mouse, that
no published date range runs backwards, that hovering moves nothing. The working
notes are in `docs/FINDINGS.md`.

## What it refuses to say

The file has no fleet sizes and no flying hours, so there are no rates and no
league table of airlines. Counts are counts of reports filed, not of flights.
Where a picture can place only part of the selection it says so underneath, in
the same size type. An unrecognised value in a link runs no query at all and says
why, rather than answering with the whole corpus under a filtered heading.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*.
