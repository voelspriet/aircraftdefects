# Work plan

Five phases, in order. Each is ticked off here as it is finished, with what was
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

## B. Parity with the parent tool — **in progress**

`/z` must carry everything aircraftdefects.com does, not a subset. The checklist,
each item to be driven in a browser rather than assumed:

- [ ] the AIM AT box, and taking a value from it
- [ ] starter questions, all eighteen
- [ ] the sixteen panels: search, patterns, aircraft, how it was found, fleet,
      leads, new defects, same day, same defect, corrosion, old airframes,
      engines, what the crew did, compare, codes, method
- [ ] date filters, and More filters
- [ ] Export CSV and Copy link
- [ ] dragging across the month strip to take a period
- [ ] clicking a zone on the aircraft
- [ ] every value clickable: zones, systems, parts, conditions, stages, crew
      actions, not only the WHO rail
- [ ] the "no rows yet, on purpose" discipline

---

## C. Verify what the model designed — **pending**

The nine builds it chose, driven in a browser, not tested by curl:

- [ ] airframe history, and the stage framing above it
- [ ] plain-English gloss, including its refusal to answer
- [ ] jargon table, and the record versus outside-knowledge marking
- [ ] code disagreement notice
- [ ] location from free text, and the discarding of unverifiable spans
- [ ] part recurrence
- [ ] repeat findings, and the hours between
- [ ] operator page, including an unresolved designator
- [ ] citation, export, and the verified summary refusing to render on a mismatch

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
