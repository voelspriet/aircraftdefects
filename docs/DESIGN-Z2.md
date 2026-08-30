# /z redesign, 30 August 2026: the panel of twenty, synthesised

Twenty reviewers, one lens each, all reading the same brief (docs/MODEL-BRIEF
in the scratchpad, copied below in essence), the live page, and the parent. This
is what survived the red team. The parent at aircraftdefects.com is untouched.

## Scope that ships (40 hours to the deadline)

Live model buttons, each streamed, each labelled, each with a stated abstention:

1. **Say it in plain English** on every write-up (exists; now streams, live region).
2. **How the trade says it**: click any capitalised word in a write-up; the model
   reads up to 60 write-ups carrying it and returns the synonyms mechanics use,
   each with a record. Abstains under 10 uses. Bounded, cannot be quoted as a
   finding.
3. **Is this the right slice?** beside Export: the model reads the filters and 25
   sampled write-ups and says what the slice catches that does not belong and
   what it misses. Abstains: "These 25 all match. That says nothing about the
   rest." Makes a journalist less likely to publish something wrong.
4. **What recurs here**: over a selection, reads all write-ups when 300 or
   fewer, else the newest 300, and every sentence of its answer carries the
   count it read. The button says "300 of 4,149, newest first, not a sample of
   the rest" before it is pressed. Quotes verbatim with record numbers.
5. **Ask the file**: free text; the model proposes filters as draft chips and
   never runs until the reporter presses Run. Lists the words it could not map.

Kept as counted artwork, not model reading: the 124 filed before their defect,
the filing-lag rail. Not shipped: "Was this one event?" (two-pass agreement is
not verification). "Read this airframe end to end" ships only with results
pinned to the URL and a token ceiling shown first; deferred.

## The page

Layer 0 (no clicks): masthead; headline count; one promise line in body type
("Every report carries a mechanic's write-up in trade shorthand. GLM-5.3 Flash
reads them and says what it cannot answer."); the four rails with WHERE open;
the specimen report with its plain-English button; one wide ask line. Nothing
else. The conflicts slab, tab strips, desk, table and export do not render until
a selection exists or a named opener is pressed (the shutter).

Layer 1: a selection opens the reading paragraph, the specimen, and one line:
"n reports · read them · ask more of them". "read them" opens the records;
"ask more of them" opens the sixteen panels in a drawer.

Records: one 44px line per report (date, tail, operator, type, what was found,
stage, a length bar), expanding in place; same-inspection rows grouped under one
header; a sticky footer "Showing 100 of n · Load 100 more · CSV".

State: selection keys in the query, view keys in the hash; every mark toggles;
nothing ever moves the viewport; back removes exactly one filter.

Type: nine roles, three faces (Instrument Serif, Archivo, IBM Plex Mono).
Colour: rust reserved for selection; teal (#245c5a on #ecf2f1) reserved for
model output; neutral clay ramp on the aircraft; plum for "cannot show".
Provenance: every element is FILE, COUNTED or MODEL, and drawn as one of three.
Model blocks: role=status, aria-live=polite, aria-busy while streaming, the
button stays in the DOM, first paragraph focused on completion.

## Reviewers
Information architecture, layering, model-native features, typography, colour,
data visualisation, streaming UI, accessibility, copy, mobile, records table,
case sheet and dossier, interaction and state, first screen, aircraft drawing,
search desk, performance, judge's view, trust and provenance, red team.
