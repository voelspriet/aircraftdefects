*Amendment received and applied: tail lookups for victims' relatives are in scope by decision of the operator. Sections 3, 6 and 7 therefore adjudicate framing, not admission.*

---

# 1. Existing-coverage audit

The current interface is a **record retrieval tool**: it answers "show me records matching these codes and this text." It answers that well — point lookups by tail, part-level queries across the fleet, condition codes (corroded, cracked), crew-action filters, date slicing, and full-text search over Discrepancy.

It cannot answer, and no filter combination will:

- **Aggregation** — a tail's history as a timeline; a part's recurrence across tails; a system's reporting volume over years.
- **Extraction** — anything from free text, which is where ~85% of location information (1,496,585 of 1,757,828 records) lives, along with most descriptive detail.
- **Framing** — what an SDR is, what a report does and does not mean. The database contains the antidote to its own misreading (HowDiscoveredCode shows most findings are caught during scheduled inspection) and never surfaces it.
- **Citation** — record IDs, reproducible query URLs, export. For journalists this is not a feature; it is the product.

Every proposal below must add aggregation, extraction, or framing — not another filter.

# 2. Need analysis

**Journalists**
1. [EVIDENCED] Reconstruct a tail's report history around a date of interest, with citable raw records. Stakes: story accuracy and legal exposure — one mischaracterized SDR can kill a story or invite a suit.
2. [EVIDENCED] Test whether a defect described in one report recurs across the type or across operators (the filters imply this job; nothing aggregates it).
3. [ASSUMED] Verify or rebut a claim — "no prior reports," "this was addressed." Stakes: reputational.
4. [ASSUMED] Extract structured data from free text at scale (locations, station numbers, components) to build datasets the FAA doesn't publish. Stakes: exclusivity.
5. [ASSUMED] Read an operator's reporting character before writing about their numbers. Stakes: fairness — volume differences reflect reporting behavior.
6. [ASSUMED] Quote jargon accurately ("pawl," "FR73–FR77") without over-claiming.

**Researchers / safety analysts**
1. [EVIDENCED] Reproducible queries with documented limitations (the JSON API's existence implies the job).
2. [EVIDENCED] Bulk export of filtered sets with IDs preserved.
3. [ASSUMED] Cross-tabs: condition × system × discovery code × year.
4. [ASSUMED] Time series of reporting volume per system or part, with volume-vs-prevalence caveats.
5. [ASSUMED] Normalization of free text (component names, zones) into analysis columns.
6. [ASSUMED] Repeat-finding detection: same tail + part, re-reported within days or cycles.

**Relatives of the deceased**
1. [ASSUMED] "Tell me about the plane." Emotional stakes maximal; one bad page ends trust in the whole site.
2. [ASSUMED] Calibrate: are these reports alarming or routine? They need "a report is a finding that was caught" to be unmistakable.
3. [ASSUMED] Distinguish findings caught in scheduled inspection from findings that surfaced in service (HowDiscoveredCode, crew-action codes).
4. [ASSUMED] Know the boundary — no accidents, no causes here — and where those records live (NTSB).
5. [ASSUMED] Something to hold: printable, dated, linked to raw records, shareable.

# 3. Data-vs-need map

**Directly supported**
- Tail history timeline from structured fields (dates, operator, part, condition, discovery code, crew action, times/cycles at filing, verbatim text).
- Part-number recurrence across tails. Discovery-code distributions. Export and citation.

**Supported with reframing**
- *"How safe was this tail?"* → "What maintenance findings were publicly reported about this airframe, and when." Plus four fixed statements: reports are findings that were caught; no accidents here; no causes here; absence of reports is not evidence of a safe aircraft.
- *Operator comparison* → reporting volume and character, never ranking; 2,732 of 3,945 designators (3,945 − 1,213) resolve to no name, shown honestly.
- *"Most common defects on type X"* → "most commonly reported findings," with discovery mix attached.
- *Free-text locations* → "probable zone, extracted," always echoing the verbatim span.
- *Trends for a system* → reporting volume, never prevalence.

**Unsupported — refuse or redirect**
- "What caused the crash?" — refuse; bridge to NTSB.
- "Was my flight safe?" — refuse; offer the tail history with framing.
- "Most dangerous airline/type" — refuse (see §6).
- Accident lookup — the dataset does not record accidents; redirect.
- AD/recall status — not in this dataset; unsupported without external joins (separate project; out of scope).

Per the operator's decision, the tail lookup itself sits in **directly supported**; the design burden shifts entirely to framing (builds 1, 7, 8; §9).

# 4. Untapped affordances

- **AircraftSerialNumber as durable identity.** Tail numbers get reassigned; a relatives lookup keyed on the tail known from news coverage may miss the airframe's earlier history. Join records by serial; surface "also operated as N____." UNKNOWN-NEEDS-PROBE (P1): how often one serial maps to >1 tail.
- **HowDiscoveredCode as the framing field, not just a filter.** Scheduled-inspection findings vs in-service findings is the single most important context for every audience, and it already exists.
- **AircraftTotalTime/Cycles per record.** Gives each report a within-tail position ("filed at 45,210 hours") — concrete, neutral, no denominator needed.
- **Fuselage/WingStation fields, CrackLength, NumberOfCracks, CorrosionLevel.** Structured aging-aircraft data; highly citable; currently buried behind filters.
- **PartNumber exact-match recurrence.** The schema invites the classic pattern story; needs no LLM.
- **DifficultyDate vs SubmissionDate.** Filing lag; usable texture, low priority.
- **The 1.5M free-text-only locations.** The largest single extraction opportunity in the dataset.

# 5. Candidate builds

| # | Build | Users | Fields relied on | LLM role → failure modes | Harm risk (who/how) | Effort | Cheapest kill-probe |
|---|---|---|---|---|---|---|---|
| 1 | **Airframe History Page** — deterministic timeline per tail: dates, operator, part, condition category, discovery phrase, crew action, hours/cycles, verbatim text, record ID; fixed framing block; serial-identity note; export | All three | RegistryNNumber, SerialNumber, DifficultyDate, Operator, Make/Model, TotalTime/Cycles, PartName/Number, PartCondition, NatureOfCondition, HowDiscovered, StageOfOperation, crew codes, Discrepancy | None — fully deterministic. Failure mode is data coverage, not generation | Relatives misreading a sparse history → fixed framing + zero-report copy (§9) | M | P0: 25 tails × field coverage |
| 2 | **Per-record plain-language gloss** — one line under the verbatim text | All three, relatives most | PartName, PartCondition, NatureOfConditionA, Discrepancy | Structured output {plain_term, location_note, condition_category, confidence}; abstains below threshold. Fails on rare/abbreviated parts → gloss suppressed | Journalist quotes gloss instead of record → gloss visually subordinate, labeled, spot-checked | M | P2: 300 hand-labeled |
| 3 | **Free-text location extraction** — zone inference for ~1.5M records | Researchers, journalists | Discrepancy, station fields | Batch extraction, {zone, verbatim_span, confidence}, reasoning low, context caching. Fails on abbreviation ambiguity (FS/FR/WL/STA) | Researcher mis-buckets a query → verbatim echo always shown; abstention allowed | M/L | P3: 200 texts labeled; <30% mappable → kill |
| 4 | **Part-number recurrence view** — one part, all tails, all dates | Journalists, researchers | PartNumber, PartName, Discrepancy, tail, dates | None (or light near-duplicate phrasing grouping). Fails on dash-variant part numbers | Over-read as common cause → fixed copy: recurrence "does not by itself indicate a shared cause" | S | 10 high-count part numbers; coherent cross-tail clusters? |
| 5 | **Possible-repeat-finding flag** per tail | Researchers, journalists | Tail, PartNumber/Name, dates, cycles, Discrepancy | Pairwise similarity, {same_finding, confidence}, reasoning low. Fails by merging routine recurring wear | Implies maintenance breakdown without cause data → "possible" phrasing, both records shown, never merged | M | P4: 100 pairs, ≥80% precision or drop |
| 6 | **Citation/export backbone** — record IDs on everything, canonical query URLs, CSV/JSON export, citation block | All three, journalists most | All fields | None | Absence is the harm | S | Round-trip 3 filter sets |
| 7 | **Templated tail summary + numeric verifier** — fixed slots filled from computed stats only | Relatives; journalists' ledes | Computed stats from build 1 | Fills template slots; verifier string-matches every number against stats; fail-closed to stat strip | Any embellishment → bounded by template + verifier | M | P2b: 20 tails × 3 regenerations, 0 verifier failures |
| 8 | **Discovery-context overlay** — "found during scheduled inspection: N of M reports filed" on every view | All three | HowDiscoveredCode, StageOfOperation | None — static code→phrase map; unmapped codes display raw per dataset convention | None; it is the volume-trap antidote | S | Unmapped-code rate on 1,000 records; <10% → ship |
| 9 | **Operator page with unresolved-designator honesty** | Journalists, researchers | OperatorDesignator, FAA-resolved names | Candidate-name suggestions for the 2,732 unresolved; human-confirmed before display. Fails by attaching a wrong name | Journalist prints wrong operator → suggestions render as unconfirmed until confirmed | M | P5: 50 hand-checked; ≥70% candidate precision or raw-code-only |

**GLM-5.3-Flash capability mapping**
- **Structured output (JSON schema):** builds 2, 3, 5, 7. The gloss schema permits only {plain_term, location_note, condition_category, confidence} — cause-language is banned by construction, not by instruction.
- **Function calling:** gloss and extraction pipelines call the existing JSON API; no new endpoints needed for v1.
- **Context caching:** cache the JASC/part vocabulary, gloss few-shots, and zone-pattern instructions; per-record payloads are tiny, making the 1.5M-record extraction run cache-heavy and cheap.
- **Reasoning tiers:** low for extraction and pair-similarity (builds 3, 5); high for offline gloss QA batches; max reserved for designing the adversarial test set, never at runtime.
- **Streaming:** gloss rendering on tail pages.
- **Deliberately unused for v1:** the 1M context (whole-tail free-read generation — rejected, see §6), image/video inputs, long outputs.
- **Catching errors before users see them:** cached gloss + P2 sampling cadence; verifier fail-closed on build 7; extraction never surfaces without a verbatim span and confidence above threshold.

# 6. Explicit rejections

1. **Safety scores or grades for tails or operators.** No denominators, no outcome data. Any score is noise wearing a number. The worst possible artifact for relatives, and a litigation magnet for journalists. Refused permanently unless external denominator data joins the project.
2. **"Most dangerous airlines/types" leaderboard.** Same missing denominator, plus the reporting-culture confound: an operator filing 4,000 reports may be the diligent one. The single most quotable-and-wrong artifact the data could produce. Refused; operator pages (build 9) exist as the honest substitute.
3. **Automated accident linkage.** Tempting because every journalist arrives via a crash. The dataset has no accidents; tails get reassigned; automated matching will link the wrong airframe to the wrong tragedy with total confidence. Refused; the static NTSB bridge replaces it.
4. **Cause inference from Discrepancy text.** The field records what a filer found, not what an investigation concluded. Even a hedged "likely mechanism" line will be quoted as fact. Refused in all views; enforced at the schema level in the gloss.
5. **Open-ended chat over the data ("ask about this plane").** The 1M context window makes it trivially buildable and maximally dangerous: unbounded generation, no citation discipline, every answer an uncontrolled framing event. Refused in favor of fixed, templated, verifiable artifacts.

# 7. Recommendation

**MVP: the Airframe History Page as the spine (builds 6 + 1 + 8, plus a limited build 2).**

Rationale by value-per-harm-per-effort:
- **Build 6** is the trust substrate and the cheapest thing on the list; nothing else is citable without it.
- **Build 1** is the one surface all three groups need, and where the operator's decision lands. It is deterministic — zero generation risk — while still delivering the tail-history job.
- **Build 8** is the framing engine with no LLM involved: the database's own discovery codes refute the misreading of volume.
- **Build 2 (limited)** is the only generated content in v1: record-scoped, schema-constrained, abstaining, rendered beneath and subordinate to the filer's own words.

**v1 scope, precisely:** timeline page per tail; fixed framing block; discovery stat strip; serial-identity note if P1 confirms; gloss on vocabulary-covered records only; citation block + canonical URL + export on every view; static NTSB bridge. **Deliberately excluded:** operator pages (wrong-name harm until P5 passes), free-text extraction (until P3 passes), repeat flags (until P4 passes), any generated narrative summary, chat, scores, accident linkage.

**Sequence:** v1 as above → **v1.5:** build 7 (templated summary with numeric verifier — the relatives' landing moment, held until the verifier is proven) → **v2:** builds 3, 5, 4, 9, in that order by QC readiness.

# 8. Validation plan

All probes run against the live JSON API before any build ships.

- **P0 — tail-page feasibility.** 25 tails sampled across report-count deciles. **Pass:** ≥90% of records carry DifficultyDate + (PartName or Discrepancy); HowDiscoveredCode populated in ≥80%.
- **P1 — serial identity.** 500 serials; count distinct tails each. **Build if** >5% map to >1 tail; else drop the identity note. UNKNOWN-NEEDS-PROBE, quantified.
- **P2 — gloss quality.** 300 records stratified across 6 JASC systems × 2 decades, hand-labeled for (a) accuracy to verbatim, (b) zero cause/mechanism language, (c) no omission of material condition words (crack, corrosion, wear). **Ship bar:** ≥95% / 0 violations / ≤2% omission. **Adversarial set:** 50 abbreviated or unusual texts — gloss must abstain on ≥80%.
- **P2b — verifier.** 20 tails × 3 regenerations of the build-7 summary. **Pass:** 0 numeric mismatches; any failure falls back to the stat strip permanently for that tail.
- **P3 — extraction viability.** 200 random Discrepancy texts hand-labeled for mappable location. **Kill** if <30% mappable with high-precision patterns; otherwise extraction QC on 500 labels, **precision ≥90% on emitted zones**, abstention permitted, verbatim span always shown.
- **P4 — repeat flags.** 20 tails; naive pairs (same tail + part number within 90 days or 500 cycles); 100 pairs hand-checked. **Ship bar:** ≥80% precision at "possible repeat" phrasing.
- **P5 — operator resolution.** 100 unresolved designators against FAA name lists. **Build the suggestion queue if** ≥70% candidate precision on 50 hand-checked; else raw code only, forever.
- **Per-group probes.** *Journalist:* on 10 real tails, can one URL reconstruct "reports filed in the 12 months before date D," with IDs? Pass/fail. *Researcher:* round-trip 3 filter sets — export IDs complete, canonical URL reproduces the identical result set. *Relatives:* 5 mock lookups including one tail with zero reports and one with 1,000+; framing block and NTSB bridge must render correctly in both extremes — the zero-report case is the "absence ≠ safety" stress test.

# 9. Guardrails

**Behavior rules**
1. The framing block is fixed, versioned copy — never generated.
2. **Verbatim primacy:** any generated text renders adjacent to and visually subordinate to the filer's words, labeled, never replacing them.
3. **Causality ban:** enforced in the gloss schema (no cause-like fields exist to fill); audited by sampling.
4. **Numbers discipline:** every aggregate is labeled "reports filed." The words "incident," "failure occurred," and "rate" do not appear on derived views.
5. Every derived view links to raw records via IDs and a canonical query URL; export preserves IDs.
6. **Abstention by default:** below confidence threshold, render nothing rather than something.
7. The NTSB bridge is a static module on every tail page, phrased as "where accident records live," not a deflection.

**Draft copy**

Page framing block:
> **About these records.** This page lists Service Difficulty Reports filed with the FAA for aircraft [tail] between [first date] and [last date]. A report is written when a mechanic or operator finds a component that has failed, is malfunctioning, or is not up to standard — most often during a scheduled inspection. Each entry here describes a problem that was found.
>
> What this database does not contain: accident records, and the cause of anything reported here. Report counts differ between aircraft for many reasons — fleet size, how an aircraft is used, how diligently an operator files. More reports do not mean a less safe aircraft. Fewer reports do not mean a safer one.
>
> If you are looking for information about an accident, the NTSB maintains those records: [link].

Zero-report case:
> **No reports found for [tail].** This database holds maintenance reports, not a safety record. Many aircraft generate few or no reports here, and the absence of reports does not indicate that an aircraft is safe or unsafe. For accident records, see the NTSB: [link].

Gloss label:
> *Plain-language rendering of the description above, produced by software and spot-checked by editors. The filer's original wording is the source of record.*

Recurrence-view copy (build 4):
> These are reports filed about [part]. That the same part appears in reports from several aircraft does not by itself indicate a shared cause. Determining cause is the role of the FAA and NTSB.