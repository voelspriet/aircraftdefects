Ruling constraint up front: the dataset has no images, so vision's only honest jobs are (a) the paper world users bring in, and (b) the pixels the tool itself produces. Everything below is filtered through that, plus the kill-test: *name the user who holds the file, or the idea dies.*

---

## Surviving ideas

### 1. Batch decode of scanned FAA forms → SDR-schema records

- **Persona / moment.** Journalist with a FOIA production: 300 scanned pages of pre-1995 paper SDRs for one tail number, or a box of Form 8330 revisions. They want them searchable against the 1.76M electronic records, today.
- **File and holder.** Scanned/photographed paper SDRs and legacy form revisions. Journalists hold FOIA productions; cold-case researchers hold pre-1995 paper. Real holders — passes.
- **Vendor dependency.** "Input: video, image, text, file"; "Structured output to JSON schema"; "Context caching." Schema + decoder instructions cached as a prefix across a batch; per-page cost dominated by the image.
- **Output / connection.** JSON aligned to SDR columns, landed in a searchable side-collection flagged as `source: scanned`, never silently merged into the main corpus. Extends the existing form decoder from single-form tool to batch tool.
- **Failure mode.** Handwriting, carbon copies, low-light phone photos. Abstention must be **field-level** ("tail: N___4_, 3 candidate readings"), not document-level. Redactions are a specific hazard: the model will hallucinate under black bars unless redaction regions are detected and fields marked `redacted`, never guessed.
- **Strongest fail argument.** Volume: if users only ever bring one form at a time, batch is over-engineering and the existing decoder already covers it.
- **Verdict: build now** — but size the batch feature to observed volume.
- **One-day test.** Take 20 real scanned pages a user actually has; measure field-level accuracy and abstention rate against manual transcription. If accuracy on unambiguous printed fields is below ~95%, the idea needs rework regardless of features.

### 2. Field-level provenance crops on every extracted value

- **Persona / moment.** Journalist about to print a part number pulled from a scanned document; relative reading a decoded work order about the accident that killed their family member. Both need to see the source region with their own eyes.
- **File and holder.** Same documents as Idea 1. Passes.
- **Vendor dependency.** "Input: video, image, text, file" — the image is the ground truth; the crop is trivially derivable from it.
- **Output / connection.** Every extracted field carries a crop of the source region, rendered beside the value. Extends the decoder's output; matches the house style already established by the abbreviation provenance list (record vs. model knowledge) — this is the same contract, extended to pixels.
- **Failure mode.** Model mis-crops or crops the wrong instance of a repeated field. Detectable by the user, which is the point — a wrong value with a crop is self-correcting; a wrong value without one is a published error.
- **Strongest fail argument.** If users already trust the decoder's output without eyeballing it, crops add friction and nothing else.
- **Verdict: build now.** This is the highest-leverage vision feature on the list because the alternative to a crop is not a better model — it's the user re-opening the PDF and finding page 217 by hand.
- **One-day test.** Show 5 journalists a decoded form with and without crops; ask which they'd attach to an editor's email.

### 3. Two-pass decode-then-verify on the existing form decoder

- **Persona / moment.** Every user of the existing decoder, invisibly.
- **File and holder.** Same photos. Passes.
- **Vendor dependency.** "Input: … image"; function calling for the second pass.
- **Output / connection.** Pass 1 extracts; pass 2 receives photo + extraction and verifies each field, abstaining on mismatches. This is the one place vision self-verification is sound, because the ground truth *is* the image — unlike checking the model's prose against itself.
- **Failure mode.** Correlated errors: the model can misread the same digit twice. Mitigate by varying the second pass (crop the box region, read the digit alone).
- **Strongest fail argument.** It's still self-verification with a correlated-error floor; it raises accuracy but can't be treated as independent QA.
- **Verdict: build now.** Cheap, contained, improves an existing surface.
- **One-day test.** Run both passes over the Idea 1 test set; measure whether the error rate on held-out fields drops enough to justify doubling per-page cost.

### 4. AD / SB / NTSB-docket ingest → cross-reference against SDRs

- **Persona / moment.** Journalist holding a Service Bulletin from a source: "show me every SDR write-up matching this part number or failure mode." Analyst: an AD mandated inspection of a fuel pump in 2018 — do SDR write-ups for that pump keep coming afterward? (The dataset can't measure compliance — no fleet or hours data — but post-AD failure-mode persistence is a legitimate lead.) Relative: the NTSB docket's maintenance report describes a chafed fuel line; match it against SDR narratives for that fleet.
- **File and holder.** ADs: public, FAA RGL — everyone. NTSB dockets: public, CAROL. SBs: **not public**; journalists hold them via FOIA or tips — availability uncertain, flagged below. Passes, conditionally.
- **Vendor dependency.** "Context 1,000,000 tokens" — most dockets (≈200k–400k tokens) ingest in one pass; mega-dockets need sectioning, honest limit. "Structured output to JSON schema" — extraction shaped to part numbers, models, nomenclature, so external docs become comparable with SDR fields. "Context caching" — the same directive re-read across many queries.
- **Output / connection.** Extracted entities become pinned filters over the existing SDR search; results render in the existing views. New surface, connected at the search layer — not a bolted-on chatbot.
- **Failure mode.** Docket language ("fuel line chafed against clamp") must match mechanic shorthand ("chafing fwd fuel line @ clamp") — the same vocabulary gap the existing narrative search already fights. Extraction errors here propagate into a *search filter*, so errors are visible as weird result sets, not silent wrong answers — a forgiving failure surface.
- **Strongest fail argument.** The match precision may be too low to be useful, producing noise sets that erode trust; or SBs are rare enough in practice that the flagship use case is the phantom one.
- **Verdict: test first.**
- **One-day test.** Take 10 real ADs/dockets; run entity extraction; hand-execute the resulting SDR searches; judge precision by eye.

### 5. Render-and-check as a CI regression harness, not a user feature

- **Persona / moment.** The maintainer, after every change to the four drawn views.
- **File and holder.** No user file — the tool's own render. Different grounding, still legitimate: the vendor claim — "the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs" — fits this exactly.
- **Output / connection.** Screenshot the four views for a fixed fixture selection; model flags gross anomalies (all-one-shade zone map, empty axis, flipped scale). Regression infrastructure, invisible to users.
- **Failure mode.** Catches only gross, visible breakage — subtler shading-scale bugs will pass. It supplements unit tests on the counts→shading mapping; it does not replace them.
- **Strongest fail argument.** If the render pipeline is already covered by unit tests on the mapping function, the visual pass catches nothing a test doesn't.
- **Verdict: test first.**
- **One-day test.** Seed 3 known rendering bugs; see whether the visual harness flags all three beyond what unit tests catch.

---

## Rejected

- **Per-user render critic for the drawn views.** The shading *derives from the counts*; checking the account against the render is equivalent to checking it against the counts, which is text-only and auditable. Vision here is theater. Kill: no information the render carries that the counts don't.
- **Video, as a feature.** Nobody holds relevant video. Journalists won't record sessions; agentic feedback is frames, not video; wreckage footage has no link to SDR text. The only non-zero use — a user submitting a screen recording to report a bug — is better served by asking for screenshots. Kill: file-holder test. Dead, not deferred.
- **GUI automation as the default retrieval path.** RGL and CAROL have direct URLs; HTTP fetch + file ingest (Idea 4) covers retrieval without a browser driving itself. GUI agents are fragile, and deadline journalism can't absorb flakiness. Reserve GUI for the long tail of sites without direct document URLs.
- **Wreckage/photo analysis for the families persona.** Relatives may hold such photos, but describing a wreckage image connects to nothing in the SDR data and is ethically hazardous for a grieving user. Kill: analytically vacuous *and* harmful.

---

## Ranking

| # | Idea | Tier |
|---|------|------|
| 2 | Provenance crops | Build now |
| 3 | Two-pass decode-verify | Build now |
| 1 | Batch form decode → SDR schema | Build now (sized to volume) |
| 4 | AD/SB/docket → SDR cross-ref | Test first |
| 5 | Render CI harness | Test first |

Crops and two-pass verify first because they harden what already exists; batch second because it extends an existing surface; cross-ref fourth because it's the biggest upside but the biggest unknown.

## Open questions only the maintainer can answer

1. **Crops (2):** How do journalists currently verify decoder output — do they re-open the PDF today?
2. **Two-pass (3):** What is the single-pass decoder's measured field-error rate on a held-out set? That's the baseline to beat.
3. **Batch (1):** What volume of scanned forms actually arrives per month, and is there a CI slot to own the schema?
4. **Cross-ref (4):** Do journalists bring SBs in meaningful numbers, or only ADs and dockets? If SBs are rare, the idea survives but repositions around ADs and NTSB dockets.
5. **Cross-ref (4):** Are maintenance specialist reports consistently present in the dockets your users care about?
6. **Harness (5):** Is there a fixed fixture selection to screenshot, and does the shading mapping already have unit coverage?

## What not to build

Don't build visual ingestion of the dataset's world — there is none. No image search, no "similar aircraft," no generated aircraft diagrams beyond the zone view, which is already the one honest drawing in the tool. Don't put the model in the user's render loop as a critic; the views are deterministic from the data, a text check against the counts is equivalent, and an AI stamp of approval on correct renders manufactures trust the pipeline hasn't earned. Don't build video. Don't build autonomous browsing as the default document path. Text-only already suffices for everything *inside* the dataset; vision's entire mandate here is the paper users carry in — and every pixel-decoded value must arrive with its crop attached, its uncertainty visible, and its abstentions loud, because these outputs end up in print and in conversations with people whose relatives died.