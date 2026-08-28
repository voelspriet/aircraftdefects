# Build log

Every step in order, including the wrong turns and the retraction. Written as it
happened, 28 to 29 August 2026.

---

## 0. Where this came from

Not from the hackathon. From a stale number.

Checking a public tool of mine against its own API, I found the page saying
**170,201 reports** while the API said **1,541,548**. A literal left behind when the
database grew from three years to twenty-six. It had been wrong for months, in
eleven places, on a site whose whole argument is that public records should be
legible.

**Lesson kept:** the fix was not to type the right number in. It was to stop typing
numbers. The page now asks the database its own size on every load.

---

## 1. Check the model can run before designing for it

```
zai-org/GLM-5.3-Flash    321,323,031,390 params, FP8, 62 weight files
smallest 4-bit MLX       178 GB
M4 Pro                    48 GB RAM
M2 Max                    96 GB RAM
```

It fits on neither machine. Mixture of experts, 320B total with 18B active, which
helps speed and not memory: every weight still has to be resident. So: API.

Four minutes of arithmetic saved a day of downloading.

---

## 2. The API contract, and the trap in it

```
POST https://api.z.ai/api/paas/v4/chat/completions
Authorization: Bearer <key>
model: glm-5.3-flash
```

**GLM-5.3 is text only. GLM-5.3-Flash is the multimodal one.** A tool whose input
is a photograph would have failed silently on the flagship model.

Reasoning cannot be disabled on this family and defaults to `max`. Paying a
deep-reasoning model to transcribe ten boxes is money burned, so extraction runs at
`low` and design at `max`.

**The billing trap.** A 20,000,000 token bundle was bought, and every call still
returned `429 code 1113 insufficient balance`. The bundle covered `glm-5.3` and
`glm-4.7-flash`, not `glm-5.3-flash`. Six model ids tested against one endpoint in
one second: two returned 200, four returned 1113. That isolates the variable to the
model, which points at billing scope rather than code. The error says *insufficient
balance*; a 429 reads as rate limiting; the natural assumption is throttling or a
malformed payload. It is neither.

---

## 3. Decide what the model is allowed to do

The only design decision that matters.

The tempting version: hand it the record and ask it to explain the report. It works,
it demos beautifully, and it is unusable for journalism, because it will expand a
code it has never seen into something plausible and not flag it.

So: **the model reads, the tables decide.** Meaning comes from the FAA's own tables.
A code not in them renders as the raw code, in red, labelled undecoded.

---

## 4. The Prewash: let it design

One short line in, a full prompt out, `execute prompt`, then a grounding check. See
[PREWASH_METHOD.md](PREWASH_METHOD.md). It proposed nine builds, refused five
including an open-ended chat over the data, and refused to decide whether relatives
should see a per-tail history.

---

## 5. Build 8 shipped on a different column than specified

Its plan rested on `HowDiscoveredCode` showing most findings caught during scheduled
inspection. Its own grounding check flagged that as asserted rather than known. The
database disagreed: 47% *someone looked at it*, 23% *other*, 19% *unknown*.

The idea was right and the column was wrong. `StageOfOperationCode` carries the
signal: `IN`, on the ground in inspection or maintenance, covers 1,303,444 of
1,757,828 records. **74% of all reports were written with the aircraft on the
ground.**

---

## 6. Give it the real source

85,326 tokens of the parent tool went in: the Flask app, its 219KB front end, and
the new backend. 850 seconds later, a complete page in the house style.

I flagged two things in it as wrong. Both were right. The Google Fonts load and a
Wikipedia link are both in the parent's own source, copied faithfully. My own
hand-written page was the one that deviated.

---

## 7. Measure the disagreements, then retract the measurement

200 long reports, 29 flagged, **14.5%**. Published here for about an hour.

Then an adversarial check: three adjudicators per flag, each told to refute it, a
flag surviving on two of three. Four survived. That would be 2.0%.

```
literal      upheld 16, refuted 13
charitable   upheld  0, refuted 29
sequence     upheld  5, refuted 24
```

**The charitable adjudicator refuted every flag it ever saw.** An instrument that
always returns the same answer measures nothing. It was told *"if a defensible
reading exists, the flag fails"*, and for a broad FAA code definition a defensible
reading almost always exists. So two-of-three silently became literal-and-sequence,
and 2.0% is an artefact.

Neither number stands. Full write-up in [docs/FINDINGS.md](docs/FINDINGS.md).

**The method lesson is the more useful finding:** an adversarial panel is only worth
running if its verdicts vary. Check that every judge has ever disagreed with itself
before trusting the panel. One line, and it should be the first line.

---

## 8. Build a ledger instead

A rate needs a denominator, a denominator needs a calibrated instrument, and there
is not one. A ledger needs neither.

[/z/conflicts](https://aircraftdefects.com/z/conflicts) fills from ordinary use and
says in its first paragraph that its size measures attention, not prevalence.

---

## Things that went wrong

**A `return` alone on its line.** Rewriting a renderer on the parent tool, `return`
sat at the end of a line with the template literal starting on the next. Automatic
semicolon insertion made it return `undefined` and the tab bar rendered zero tabs.
`node --check` passed. The page returned 200. Every API was fine. Only driving it in
a real browser caught it.

**`$` with `querySelector` and bare ids.** `$("pick")` searched for a `<pick>` element
and returned null, so every button on the new tool was inert. The page loaded, styled
correctly, and looked healthy. Found by a user clicking, which is what I should have
done before saying it was ready.

**`.format()` on a tuple.** A measured sentence was meant to replace a placeholder in
a glossary term. `.format()` was applied to the tuple containing the string rather
than the string, and a blanket `except Exception: pass` swallowed the error, so the
API served the literal text `OPERATOR_GAP_SENTENCE`.

**A date range clamped in one direction.** Selecting a year set the end date to 31
December unconditionally, so 2026 captioned itself as running to December over a
count that stopped in August. Fixing it naively then produced *1 Dec 2026 to 20 Aug
2026*, a range running backwards, for any period entirely in the future.

**A summary capped at 40 words.** The plain-English gloss was told "one or two short
sentences, maximum 40 words". On a write-up describing eight events in sequence, that
limit is the bug: it dropped the thump in cruise, the precautionary declaration, the
fly-by, the suspected tyre blowout and the fire equipment. Length now follows the
source.

**Assuming where a data gap was.** I predicted a 2006-era operator list would be blind
to new airlines. Measured: for 2025 it already named 98.5% of reports. The hole was at
the other end, 82% for 1999, the largest gap being TWA, gone before the codebook was
printed.

---

## Counts

```
commits                    7
python                 1,543 lines
page                     274 lines
tokens through GLM   198,227
reasoning kept       314,399 chars
model turns kept           5, each with its full trace
```
