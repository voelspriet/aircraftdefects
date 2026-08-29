# Submission

**Conflicting Reports** — aircraftdefects.com/z

## What it is

1,757,828 FAA aircraft defect reports, public since 1995, almost entirely unread
because nine of the ten boxes on the form are codes. This makes them readable, and
then does one thing no database can: it notices when the box a mechanic ticked
disagrees with the paragraph the same mechanic wrote underneath.

## Why it needs GLM-5.3-Flash

No query expresses *the tick box disagrees with the paragraph*. There is no filter
for it, which is why nobody has ever counted it. It needs something that reads both
halves of a form and compares them.

The model appears in exactly two places, both constrained. A plain-English account
of a write-up, which may abstain and which sits under the original rather than
instead of it. And free-text location extraction, where a quoted span is discarded
unless it appears verbatim in the source. Everything else is arithmetic.

The design was also the model's. It was given flat source material and asked what
should be built. It proposed nine features, refused five, and refused to make the
one decision that belonged to a human. All of it is committed with reasoning traces.

The page was written by the model too, from 85,326 tokens of the parent tool's real
source code.

## What is honest about it

A measurement was attempted and retracted the same day. A first pass put the
disagreement rate at 14.5%, an adversarial check cut it to 2.0%, and the check
turned out to have an adjudicator that refuted every flag it ever saw. Neither
number stands, and both failures are in the repository rather than deleted.

What replaced the number is a ledger of individual cases which states, in its first
paragraph, that its size measures attention rather than prevalence.

## What was built when

The hackathon ran 28 August 10:00 to 1 September. The timeline is stated plainly
rather than blurred:

| | |
|---|---|
| **Before**, 26 to 27 August | aircraftdefects.com itself: the ingest, the FAA code tables, the search, the four drawn rails. Existing work, and the substrate this builds on. |
| **During**, 28 to 29 August | everything in this repository. The design session, the five-question surface at /z, the plain-English gloss, the abbreviation table, the code-disagreement notice, the conflicts ledger, the measurement and its retraction, and the interface GLM wrote from the parent's source. |

Two fixes to the parent tool were made during the window as a consequence of this
work, and are noted for completeness: a count frozen at 170,201 while the database
held 1,757,828, and a claim that the file contains no flying hours when it carries
airframe hours in 79% of records. Both were found by building on it.

## Links

- Live: https://aircraftdefects.com/z/
- Ledger: https://aircraftdefects.com/z/conflicts
- Source: https://github.com/voelspriet/aircraftdefects-z
- Parent tool: https://aircraftdefects.com

MIT, matching the licence of the GLM-5.3-Flash weights.
