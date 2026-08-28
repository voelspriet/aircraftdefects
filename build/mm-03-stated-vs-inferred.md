Conventions used below:

- **S** = stated in the SOURCE MATERIAL block, including verbatim vendor quotes inside it.
- **I** = inferred, constructed, or imported by me (external knowledge, scenario-building, judgment). **Not established by the source.**
- The prompt I wrote last turn is also mine — anything inherited from it is **I**, not source.
- Mixed sentences are split at the ⫽ marker; each half tagged.

---

## Framing paragraph

- "the dataset has no images" — **S** (source: dataset contains no "any image, any drawing, any attachment").
- "so vision's only honest jobs are (a) the paper world users bring in, and (b) the pixels the tool itself produces" — **I**. Not established.
- "the kill-test: name the user who holds the file, or the idea dies" — **I**. My construction. Not established.

## Idea 1 — Batch form decode

- "Journalist with a FOIA production: 300 scanned pages of pre-1995 paper SDRs… Form 8330 revisions" — **I**. FOIA productions, pre-1995 paper, and the form number appear nowhere in the source. Not established.
- "They want them searchable against the 1.76M electronic records" — ⫽ "1.76M" traces to the stated 1,757,828 (**S**); ⫽ the wanting and "electronic" are **I**. Not established.
- "Scanned/photographed paper SDRs and legacy form revisions… Journalists hold FOIA productions; cold-case researchers hold pre-1995 paper" — **I**. The only source anchor is that the existing tool consumes "a photographed FAA form," implying someone photographs forms — an implication, not a statement. Not established.
- "Input: video, image, text, file" / "Structured output to JSON schema" / "Context caching" — **S** (verbatim vendor lines).
- "Schema + decoder instructions cached as a prefix across a batch; per-page cost dominated by the image" — **I**. Not established. ("Long context is cheap" is S; my caching mechanics are not.)
- "JSON aligned to SDR columns, landed in a searchable side-collection flagged as `source: scanned`, never silently merged" — **I**. Not established.
- "Extends the existing form decoder ⫽ from single-form tool to batch tool" — ⫽ the decoder's existence is **S** ("a separate tool that reads a photographed FAA form and decodes the boxes"); ⫽ "single-form" is **I** — the source doesn't state its scope. Not established.
- "Handwriting, carbon copies, low-light phone photos" — **I**. Not established.
- "Abstention must be field-level… not document-level" — **I**. The source says the model "may abstain" only for the plain-English account feature; decoder abstention is my proposal. Not established.
- "Redactions are a specific hazard: the model will hallucinate under black bars" — **I**. Not established.
- Fail argument ("volume"), verdict ("build now"), one-day test, ~95% threshold — **I**. Not established.

## Idea 2 — Provenance crops

- Both persona moments (journalist printing a part number; relative reading a "work order") — **I**. "Work order" is not a source artifact; relatives' use case is my construction from a stated user category. Not established.
- "the image is the ground truth; the crop is trivially derivable from it" — **I**. Not established. Also: the vendor documents text *output*; whether the model can emit crop coordinates is not established.
- "matches the house style already established by the abbreviation provenance list" — ⫽ the provenance list is **S** ("lists every abbreviation with whether the meaning came from the record or from the model's own knowledge"); ⫽ "house style" is **I**. Not established.
- Everything else (crop-per-field design, self-correcting failure claim, fail argument, verdict, test) — **I**. Not established.

## Idea 3 — Two-pass decode-verify

- "Every user of the existing decoder, invisibly" — ⫽ decoder exists (**S**); ⫽ "every user, invisibly" is **I**. Not established.
- "Pass 1 extracts; pass 2 receives photo + extraction and verifies each field" — **I**. Not established. ("Function calling" is S; this use of it is mine.)
- "the ground truth is the image — unlike checking the model's prose against itself" — **I**. Not established.
- "Correlated errors: the model can misread the same digit twice" — **I**. Not established.
- "can't be treated as independent QA"; "doubling per-page cost" — **I**. No cost model exists in the source. Not established.

## Idea 4 — AD/SB/docket cross-reference

- All three persona scenarios (SB from a source; 2018 fuel-pump AD; docket describing a chafed fuel line) — **I**. Not established.
- "The dataset can't measure compliance — ⫽ no fleet or hours data — ⫽ but post-AD failure-mode persistence is a legitimate lead" — ⫽ the absence of fleet size/flying hours is **S**; ⫽ the compliance conclusion and "legitimate lead" are **I**. Not established.
- "ADs: public, FAA RGL… NTSB dockets: public, CAROL. SBs: **not public**" — **I**. RGL, CAROL, and SB availability are outside the source entirely. Not established.
- "Context 1,000,000 tokens" — **S**. "Most dockets (≈200k–400k tokens) ingest in one pass; mega-dockets need sectioning" — **I**. The token estimates are mine. Not established.
- "Extracted entities become pinned filters over the existing SDR search" — ⫽ the search exists (**S**); ⫽ the pinned-filter design is **I**. Not established.
- "Docket language must match mechanic shorthand — the same vocabulary gap the existing narrative search already fights" — ⫽ Discrepancy is "free text… in trade shorthand" (**S**); ⫽ the mismatch problem and the claim that the search "already fights" it are **I** — the source never says the search struggles. Not established.
- "errors are visible as weird result sets… a forgiving failure surface" — **I**. Not established.

## Idea 5 — Render CI harness

- "The maintainer, after every change to the four drawn views" — ⫽ four drawn views are **S**; ⫽ the maintenance workflow is **I**. Not established.
- Vendor quote "the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs" — **S** (verbatim). "Fits this exactly" — **I**. Not established.
- Fixture screenshots, gross-anomaly flags, "supplements unit tests… does not replace them" — **I**. Not established.

## Rejected

- Render critic: "The shading derives from the counts; checking the account against the render is equivalent to checking it against the counts" — ⫽ shading is by zone write-up frequency (**S**: "shaded by how often each zone is written up"); ⫽ the determinism and equivalence claims are **I**. Not established.
- "Vision here is theater" — **I**. Judgment.
- Video rejection ("nobody holds relevant video; agentic feedback is frames, not video") — **I**. "Input: video" is **S** as a capability; my claim it has no use is not established.
- "RGL and CAROL have direct URLs… GUI agents are fragile, and deadline journalism can't absorb flakiness" — **I**. Not established.
- Wreckage-photo rejection ("relatives may hold such photos… ethically hazardous") — **I**. Not established.

## Ranking table

- Every tier assignment — **I**. Not established.

## Open questions

- Each question embeds an unestablished premise: that journalists verify decoder output (1), that a measurable error rate exists (2), that scanned forms arrive in volume (3), that users bring SBs/ADs/dockets (4), that dockets contain maintenance specialist reports (5), that fixtures and unit tests exist (6). All premises **I**. Not established.

## What not to build

- "visual ingestion of the dataset's world — there is none" — ⫽ dataset has no images (**S**); ⫽ the imperative is **I**.
- "the zone view, which is already the one honest drawing in the tool" — ⫽ the zone view exists (**S**); ⫽ "one honest drawing" is **I**.
- "an AI stamp of approval… manufactures trust the pipeline hasn't earned" — **I**.
- "Text-only already suffices for everything inside the dataset; vision's entire mandate here is the paper users carry in" — **I**. Not established.
- Final sentence ("outputs end up in print and in conversations with people whose relatives died") — ⫽ "relatives of people who died in aviation accidents" is a stated user category (**S**); ⫽ the claim about where outputs end up is **I**. Not established.

---

## Summary

What the source actually establishes in my answer: the dataset's size, columns, and contents; the absence of images; the six existing features; the user categories; and the vendor capability list (including every verbatim quote). That's it.

Everything else — every user scenario, every document type (FOIA productions, pre-1995 paper, SBs, NTSB dockets), every external system (RGL, CAROL), every failure mode, every verdict, every ranking, every test, and every rejection — is mine. **Not established by the source.** The source constrained the answer; it grounds very little of it.