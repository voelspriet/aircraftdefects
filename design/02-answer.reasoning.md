The user has given me a prompt I wrote in the previous turn, plus a governing decision: relatives of victims MAY look up a specific tail number and see that airframe's history. Public record. Don't deliberate on whether — deliberate on how. They've also given framing constraints to bake in:

1. A write-up is a defect that was caught.
2. The dataset records no accidents and no causes.
3. Absence of reports is not evidence of a safe aircraft.

And they said "execute prompt." So I'm now role-playing as the senior product strategist / applied data scientist executing the prompt, with the amendment that Phase 1 (the decision about whether to serve group 3) is settled: yes, serve them, focus on framing.

So I need to produce the output sections in the required order:

1. Existing-coverage audit
2. Need analysis per user group
3. Data-vs-need map
4. Untapped affordances
5. Candidate builds (6–10, compact table)
6. Explicit rejections (at least 3)
7. Recommendation (one MVP or scoped sequence)
8. Validation plan (concrete probes, pass/fail criteria, hand-labeled QC with N)
9. Guardrails (UX copy, behavior rules, draft wording)

Calibration rules:
- No causal language anywhere. Counts are "reports filed," never rates or "incidents."
- Distinguish prevalence of defects from volume of reports everywhere.
- Structured markdown matching section order; tables where they compress.
- Decisive, concrete, no filler, no generic product-school vocabulary.
- Tag jobs [EVIDENCED] or [ASSUMED].
- Mark UNKNOWN-NEEDS-PROBE where claims can't be supported.

Also capability discipline for GLM-5.3-Flash: name features used, justify them, prefer structured output + function calling against existing JSON API, tier reasoning, flag LLM error modes on noisy free text and how errors get caught.

The amendment: don't spend section 3's "seductive but unsupported" bucket debating whether to serve relatives — instead the reframe for relatives is settled, and I should spend effort on framing. But I should still handle "was my flight safe," "what caused the crash" as refused/reframed — those remain refusals. The tail-lookup itself is a build, with framing as the core design problem.

Let me actually think hard about the substance now, because this deserves real domain thinking.

## Understanding the dataset

FAA Service Difficulty Reports (SDRs). Mechanics/operators file when a component fails, malfunctions, or is found defective during maintenance/inspection. Key facts:

- 1,757,828 records, 1995–present
- 54,634 tail numbers
- 3,945 operator designators, 1,213 resolve to names
- 76 columns, ~35 with high coverage
- Discrepancy free text in most records
- Crew action codes (unscheduled landing 112k, etc.)
- Location: 196,663 with numbered zone; ~1.5M location only in free text; 64,580 none
- Existing filtered search + full-text, JSON API, no auth
- No fleet size, no flight hours, no cause, no accidents

Key epistemics:
- SDR is a *report of a finding*, mostly during scheduled maintenance/inspection. A high count for an operator could mean good reporting culture. "HowDiscoveredCode" is actually important here — many defects are found during scheduled inspection, which is the system working.
- Denominators absent → no rates.
- The tail-number history is the unit of concern for relatives and journalists.
- AircraftTotalTime / AircraftTotalCycles exist on many records — that gives within-tail context (e.g., reports clustered at certain hour bands) but still no denominator for rate.

## Section 1: Existing-coverage audit

What current filters answer well:
- Point lookups: tail → list of records (raw list, presumably chronological or paginated).
- Part-level queries: part number/name across fleet.
- Condition codes: cracked, corrosion filters.
- Crew action filter (e.g., all engine-shutdown-in-flight reports).
- Date range slicing.
- Full-text keyword search in Discrepancy (e.g., "fuel leak," "door").
- JASC/ATA system slicing.

What they don't answer:
- Anything aggregated: per-tail timelines, per-part-across-tails, per-operator patterns (with operator caveat).
- Anything extracted from free text: locations (~85% only in text), failure descriptions, whether a report is a repeat of a previous one.
- Anything framed/interpreted: plain-language summaries, "what is an SDR" context.
- Citability/export: reproducible query URLs, export formats, record IDs.
- Coverage context: when a tail's reporting starts/stops (change of operator, retirement?), gaps.

Audit conclusion: the existing interface is a *record retrieval* tool. Everything below is about *aggregation, extraction, and framing* — the three things retrieval can't do.

## Section 2: Need analysis

Journalists (4–6 jobs, tagged):
1. [EVIDENCED] Pull complete report history for a tail, esp. around a known accident date; get raw records with IDs to cite and FOIA-able numbers. Stakes: story accuracy, legal exposure — a mischaracterized SDR can kill a story or invite litigation.
2. [EVIDENCED-ish → ASSUMED? I'd say EVIDENCED since full-text and filters exist; the job of pattern-finding across tails is implied by the filters] Find whether a defect described in one report recurs across the type (e.g., same part number, same nature code). Stakes: investigative pattern stories ("multiple operators reported X").
3. [ASSUMED] Verify/counter a claim from a company or FAA statement ("this was addressed," "no prior reports"). Stakes: reputational, litigation.
4. [ASSUMED] Extract structured details from free text at scale (locations, station numbers, components) to build datasets FAA doesn't publish. Stakes: exclusivity.
5. [ASSUMED] Understand reporting culture of an operator before writing about their numbers (HowDiscoveredCode mix, etc.) to avoid the volume trap. Stakes: fairness.
6. [ASSUMED] Quote accurately: plain-language rendering of jargon ("pawl," "FR73-FR77") they can defend.

Researchers/safety analysts:
1. [EVIDENCED] Reproducible queries, documented limitations — implied by JSON API existence.
2. [EVIDENCED] Bulk export of filtered sets.
3. [ASSUMED] Cross-tabs: condition × system × discovery-code × year.
4. [ASSUMED] Time series per system or part, with fleet-context caveats.
5. [ASSUMED] Free-text normalization (component names, locations) into analysis columns.
6. [ASSUMED] Dedup / repeat-detection: same tail+part within N days (a defect found, deferred, re-found).

Relatives:
1. [ASSUMED but essentially certain] "Tell me about the plane N_____, the one my [person] was on." Emotional stakes maximal; trust stakes maximal.
2. [ASSUMED] Understand what the reports mean — is this alarming? Is this normal? They need calibration: SDRs are routine findings, mostly caught in inspection.
3. [ASSUMED] Distinguish "the system worked" from "the system missed it" — HowDiscoveredCode and crew-action codes are the levers.
4. [ASSUMED] Know the boundary: no accidents, no causes here; where to go (NTSB CAROL query, accident docket).
5. [ASSUMED] Something to hold and show others — printable, citable, dated, with links to raw records.

## Section 3: Data-vs-need map

Directly supported:
- Tail history timeline (dates, operator, times/cycles, part, condition, discovery, crew action, verbatim text).
- Part-across-fleet queries.
- Discovery-code context (scheduled inspection vs in-service finding).
- Export, reproducible URLs.

Supported only with reframing:
- "How safe was this tail?" → reframe as "what maintenance findings were publicly reported about this airframe, and when" + explicit statements: reports are findings that were caught; no accidents here; no causes; absence ≠ safety; volume ≠ danger (reporting culture).
- Operator comparison → reframe as "reporting volume and character," never "safety ranking"; must show unresolved-designator caveat (2,732 designators don't resolve to names).
- "Most common defects on type X" → reframe as "most commonly reported findings," with discovery-code context.
- Free-text location → reframed as extracted "probable zone," always showing verbatim source text, with confidence.
- Trend over time for a system → reframe as reporting volume, not defect prevalence.

Unsupported (refuse or hard-reframe):
- "What caused the crash?" → refuse; point to NTSB.
- "Was my flight safe?" (retrospective fear) → can't answer; reframe as above + direct them to the specific tail history.
- "Most dangerous airline/type" → refuse, no denominators.
- Predictive: "will this part fail?" → refuse.
- "Rate this aircraft's safety" → refuse.
- Accident lookup → redirect to NTSB (CAROL, accident dockets). Careful: user-facing redirect must not feel like a brush-off.
- Recall/AD status → not in dataset; an AD (Airworthiness Directive) cross-reference is out of scope of the data, tempting but unsupported without external joins (and those external joins are a separate project; could mention as future with external data — but per prompt discipline, mark it unsupported from this dataset alone).

The amendment affects this section: the tail-lookup-for-relatives moves out of "unsupported/refused" into "supported with reframing," and the framing design is the core of candidate build. I should state that explicitly and briefly, honoring "do not spend Phase 1 on whether to show it."

## Section 4: Untapped affordances

- AircraftTotalTime/AircraftTotalCycles per record → within-tail trajectory; also lets you show "this report was filed at 45,210 hours" — concrete, neutral, and lets a reader see intervals between reports. Also enables "first report / last report / span" per tail without needing fleet denominators.
- HowDiscoveredCode → the single most important framing field. Distribution per tail: how many findings came from scheduled inspection (system working) vs in-service/crew detection. Currently a filter, not a framing device.
- PartCondition + NatureOfCondition codes → severity-ish grouping without causal claims (worn/cracked/corroded/deformed...). Careful with "severity" language — better "condition category."
- ReceivingRegionCode/DistrictOffice → geographic/organizational texture; low priority.
- AircraftSerialNumber → join tails sharing a serial? Actually serial is per-airframe; but same serial across records confirms same airframe even if tail changed (re-registration!). That's a real affordance: tail numbers get reassigned; serial number is the durable identity. A relatives lookup keyed on tail could miss history under a previous tail. This is a genuinely valuable insight for both journalists and relatives. UNKNOWN-NEEDS-PROBE: how often tails change/reassign in the data — cheap API probe: count distinct tails per serial.
- EngineMake/Model → powerplant history per tail.
- FuselageStationFrom/To + CrackLength/NumberOfCracks → structural findings, highly relevant to aging-aircraft stories; structured, citable.
- Discrepancy text: the ~85%-in-text location problem → extraction build with verbatim echo.
- PartNumber → exact-part recurrence across tails: the schema invites "same part number, multiple aircraft, similar discrepancy" — classic pattern-story feed.
- PrecautionaryProcedure codes → what the crew did; pairs with crew-action counts for narrative texture.
- Date fields: DifficultyDate vs SubmissionDate → filing lag; also "reports per tail per year" needs care (reporting-volume, not prevalence).
- CorrosionLevel → aging fleet stories.

## Section 5: Candidate builds

Need 6–10, compact table. Columns: Build; Users; Fields relied on; LLM role + failure modes; Harm risk (who/how); Effort; Cheapest API probe to confirm/kill.

Let me brainstorm candidates:

1. **Airframe History Page (tail lookup with framing)** — the amended core. Static-rendered per tail: timeline of reports, discovery-code mix, plain-language summary generated from structured fields first (dates, counts, categories), verbatim records linked with IDs. LLM role: (a) plain-language gloss of jargon in verbatim text, shown *alongside* verbatim (never replacing); (b) page-level "what this page is / isn't" — but that copy should be static, not generated. Failure modes: hallucinated gloss, over-summarization, implied narrative. Mitigation: LLM never writes the safety framing; gloss is per-record, displayed next to verbatim, and glosses are cached+spot-checked. Harm: relatives misreading; journalists quoting the gloss instead of the record. Effort M. Probe: already possible — tail filter exists; probe is data-shape: pick 20 tails, pull histories, check field coverage supports a timeline (pass if ≥90% have dates+part+condition).

Actually the probe should be cheap and decisive: e.g., `?tail=N123AB&from=1995&to=2025` and inspect JSON for fields needed.

2. **Structured glossary / jargon glossing (per-record "in plain terms" line)** — could be folded into #1 but stands alone for all views. LLM with structured output: input = PartName, PartCondition, NatureOfCondition, Discrepancy verbatim; output = JSON {plain_term, location_if_stated, condition_category, confidence}. Failure: wrong gloss on rare parts. Mitigation: only gloss when PartName matches a known JASC/system vocabulary; else show "technical description" unaltered. Effort M.

3. **Free-text location extraction (zone inference)** — target the 1,496,585 records. Output structured: {zone_guess, zone_vocabulary ("fuselage station FR73"), verbatim_span, confidence}. Failure: ambiguity ("RH wing" → which station band?), abbreviation variance (FR, FS, WL, STA). Mitigation: restrict to high-precision patterns (station numbers, gear/flap/door named zones), no zone for low confidence; always echo verbatim span. Harm: low (misparsed zone could mislead a pattern query) — moderate for researchers. Effort M/L (1.5M records — but context caching + low reasoning + batch). Probe: pull 200 random Discrepancy texts, hand-label zone presence; if <30% contain mappable location, kill.

4. **Same-part-number recurrence view** — given a part number, show all reports across tails/operators, sorted by date, with discrepancy text. Mostly *no LLM needed* — pure API aggregation; LLM only for a neutral grouping of similar discrepancy phrasing (optional). Failure: near-duplicate part numbers (dash variants) — need normalization probe. Harm: low; journalists may over-read coincidence — mitigate with copy "recurrence of reports is not evidence of a common cause." Effort S. Probe: pick 10 high-count PartNumbers, check whether cross-tail grouping yields coherent clusters.

5. **Repeat-finding flag per tail** — same tail + same PartName/PartNumber within X days or Y cycles. This is dedup/repeat detection. LLM role: pairwise similarity of discrepancy text for borderline pairs (reasoning low, structured output {same_finding: bool, confidence}). Failure: false merges (recurring wear is normal). Mitigation: display as "possible repeat finding — see both records," never merge silently. Harm: low-moderate; could imply maintenance failure without cause data. Effort M. Probe: query 20 tails, compute naive repeats; hand-check 100 pairs; precision target ≥80%.

6. **Reporter's workbench / export + reproducible query** — every view carries a canonical query URL + record IDs; CSV/JSON export; citation block generator ("Source: FAA SDR, record #..., filed ..."). LLM role: minimal—maybe none. This is the trust backbone. Effort S. Probe: none needed beyond API stability test.

7. **Plain-language tail summary for relatives ("About this aircraft's records")** — a generated-but-constrained paragraph per tail: reporting span, number of reports, category mix, discovery mix, crew actions, then the four fixed boundary statements. LLM assembles from computed stats only (no free generation over text), structured output with fixed slots; every sentence maps to a number shown on the page. Failure: LLM drift/embellishment → mitigate by template with slots + verifier that numbers in text match computed stats (deterministic check). Harm: highest of any build if wrong — mitigated by template + verifier + link to raw. Effort M.

8. **Discovery-context panel (the "system worked" view)** — for any filter set, show HowDiscoveredCode distribution in plain terms ("found during scheduled inspection: N of M reports"). No LLM; static mapping code→phrase. Effort S. This is the volume-trap antidote. Could fold into #1/#7 but stands as an overlay on all aggregate views.

9. **Accident-boundary banner / NTSB bridge** — when a user searches a tail that appears in... wait, we have no accident data. But we can still have a static boundary: on tail pages, a fixed module: "This database contains maintenance reports only. It does not contain accidents or their causes. For accident records see NTSB CAROL / docket." No LLM. Effort S. Maybe not a standalone build — a guardrail. I'll fold into guardrails but could list as build with S effort. Better to fold; section 9 covers it.

10. **Operator page with unresolved-designator honesty** — group records by OperatorDesignator; show resolved name where available; show "designator not resolved to a name in FAA lists (raw code: XYZ)" otherwise; show discovery mix and report counts labeled as report volume. LLM: none, or name-resolution assist for the 2,732 unresolved (risky — suggest candidate matches from FAA lists, human-confirmed). Harm: journalists writing operator names wrong → mitigation: suggestions are clearly "candidate, unconfirmed" until editor confirms. Effort M. Probe: sample 100 unresolved designators, see if substring/regex against the 1,213-resolved list + FAA registry yields candidates; measure candidate precision on 50 hand-checked.

That's plenty; pick 8 for the table: (1) Airframe History Page, (2) per-record plain-language gloss, (3) free-text location extraction, (4) part-number recurrence view, (5) repeat-finding flag, (6) citation/export backbone, (7) templated tail summary with verifier, (8) discovery-context overlay, (9) operator page with resolution honesty. Maybe 9 total. Table needs to stay compact — I'll trim descriptions hard.

Also worth considering: **serial-number identity resolution** (tails that changed) as a build or affordance — I'll put it in affordances + probe, and possibly fold into Airframe History Page (show "also operated as N____"). That's a strong relatives feature: they may only know the tail from news, which may have been a later reassigned tail. Probe: count distinct RegistryNNumber per AircraftSerialNumber; if >1 for a meaningful share, build identity note.

## Section 6: Explicit rejections

At least 3, with reasons. Per amendment, tail-lookup-for-relatives is NOT a rejection. Candidates:

1. **Safety scores / grades / "risk ratings" for tails or operators** — no denominators, no accident outcome data; any score is noise dressed as number; worst possible artifact for relatives and litigious exposure for journalists. Refuse permanently unless external denominator data joins the project.
2. **"Was this the plane that crashed?" accident linkage / automatic accident matching** — dataset has no accidents; matching news strings to tails automatically invites wrong linkage (tails get reassigned; serials confuse). Redirect instead. Refuse the automated join; keep manual, cited external reference out of scope. (Tempting because journalists explicitly work around accidents.)
3. **"Most dangerous airlines/types" leaderboard** — same denominator failure + reporting-culture confound; the single most quotable-and-wrong artifact. Refuse.
4. **Cause inference from discrepancy text ("LLM: what went wrong")** — the model would infer mechanism/cause; the field records a finding, not an investigation. Even a hedged "likely cause" line will be quoted as fact. Refuse generation of cause-like language in all glosses; constrain gloss to "what the filer described."
5. **AI chatbot Q&A over the dataset ("ask the plane a question")** — unbounded generation over safety-adjacent data with no citation discipline; every answer is an uncontrolled framing risk. Refuse in favor of fixed, templated artifacts. (Tempting because GLM-5.3-Flash makes it cheap and the 1M context tempts "just load the tail's history and chat.")
6. **Predictive/alerting ("this part will fail")** — unsupported, dangerous.

I'll pick 5 crisp ones: safety score, dangerous-operator leaderboard, automated accident linkage, cause inference, open-ended chatbot. That's strong.

## Section 7: Recommendation

MVP: **Airframe History Page** as the spine, because it's the one artifact that serves all three groups and where the amendment concentrates value:
- journalists: per-tail reconstruction with citations,
- researchers: canonical per-tail query + export,
- relatives: the "look up the plane" job, framed.

v1 composition:
1. Deterministic timeline from structured fields (dates, operator, part, condition category, discovery code phrase, crew action phrase, times/cycles at filing, verbatim text, record ID).
2. Static framing block on every page (fixed copy, not generated): what an SDR is; a report is a finding that was caught; no accidents or causes here; absence of reports ≠ safe aircraft; report volume ≠ prevalence.
3. Discovery-context stat strip: N reports; breakdown found during scheduled inspection vs in-service vs crew-reported (plain phrases, counts labeled "reports filed").
4. Per-record optional plain-language gloss, constrained to PartName-based vocabulary; shown beneath verbatim, labeled "plain-language rendering of the filer's description," never for records where confidence is low (then show nothing).
5. Serial-identity note when a serial maps to >1 tail.
6. Citation block + canonical query URL + CSV/JSON export per tail.
7. NTSB boundary module (static) on every tail page.

Deliberately excluded from v1: free-text location extraction (ship as v2 after labeling QC), repeat-finding flags (v2), operator pages (v2, after resolution approach is proven), part-recurrence cross-fleet view (v2 — cheap but separate surface), any generated narrative summary (hold until gloss + verifier pipeline is proven; the templated summary is v1.5 not v1 because the timeline + fixed copy already serves relatives without generation risk).

Hmm — the templated tail summary (build 7): is it v1 or later? Argument for v1: it's the relatives' landing moment; a wall of records with a stat strip may not serve an emotionally overloaded user. Argument against: any generated text is risk. The verifier-mitigated template is decent but the deterministic stat strip + fixed copy may suffice for v1, and the summary slots can ship once the verifier is tested. I'll sequence: v1 = spine + framing + gloss (limited), v1.5 = templated summary with numeric verifier, v2 = extraction/repeat/operator. Justify: value-per-harm-per-effort.

Sequencing logic: the citation/export backbone is required in v1 because everything else builds trust on it. Gloss is the only LLM-generated content in v1 and it's the lowest-harm generation (describes a single record's own words, adjacent to verbatim). Summary is the next risk tier. Extraction is volume play for researchers/journalists. That's a defensible order.

GLM-5.3-Flash usage in v1: per-record gloss via function calling + structured output (JSON schema), reasoning low (short, constrained task), context caching (JASC/part vocab + few-shot examples cached; per-record input tiny). Streaming for UI. No max reasoning needed in v1 pipeline. High reasoning reserved for offline batch of gloss QA sampling.

Also mention: 1M context tempting for "whole-tail summary in one shot" — rejected for v1 (see chatbot rejection); keep generation record-scoped.

## Section 8: Validation plan

Concrete probes with pass/fail:

- P0 (tail page feasibility): pull 25 tails sampled by report-count deciles via existing tail filter. Pass if ≥90% of returned records include DifficultyDate + PartName or Discrepancy, and HowDiscoveredCode populated in ≥80% (needed for framing strip). Kill/reshape if coverage lower.
- P1 (serial identity): sample 500 serials; count distinct tails each. If >5% of serials map to >1 tail, build identity note; else drop. (UNKNOWN-NEEDS-PROBE quantified.)
- P2 (gloss quality): stratified 300 records across 6 JASC systems × 2 decades... 300 hand-labeled: labeler decides if gloss (a) accurate to verbatim, (b) adds no cause/mechanism language, (c) doesn't omit a material condition word (crack, corrosion). Ship bar: ≥95% accuracy, 0 cause-language violations, ≤2% omission. Also adversarial set: 50 unusual/abbreviated texts — gloss must abstain ≥80% there.
- P3 (location extraction viability): 200 random Discrepancy texts; hand-label mappable location. If <30% mappable with high precision patterns → kill or narrow scope to station-number records only. Then extraction QC: 500 labeled, precision ≥90% on emitted zones (abstention allowed), always echo verbatim span.
- P4 (repeat-finding, for v2): 20 tails, naive candidate pairs (same tail+PartNumber within 90 days or 500 cycles), 100 pairs hand-checked; ship bar precision ≥80% at "possible repeat" phrasing; else drop.
- P5 (operator resolution): 100 unresolved designators vs FAA name list/registry; if candidate precision ≥70% on 50 hand-checked → build suggestion queue; else display raw code only.
- Per-group probes: journalist = P0 + citation block on 10 real tails (can a reporter reconstruct "reports in the 12 months before date D" from one URL? pass/fail). Researcher = export fidelity: round-trip 3 filter sets, all record IDs present, query URL reproduces identical result set. Relatives = 5 mock tail lookups including a tail with zero reports and one with 1,000+; check framing block renders correctly and boundary module present in both extremes — the zero-report case is the "absence ≠ safety" stress test.

Deterministic verifier spec for the v1.5 summary: every numeric in generated text must match computed stats (string-match numbers against stat table); template slots only; fail-closed to stat strip if verifier fails.

## Section 9: Guardrails

Behavior rules:
1. Fixed framing block on every tail page (static copy, versioned, not LLM-generated). Draft wording below.
2. Verbatim primacy: any LLM text renders adjacent to and visually subordinate to the filer's words; gloss labeled; gloss never replaces.
3. Causality ban: vocabulary blacklist + reviewer sample; gloss schema rejects cause-language fields by design (structured output permits only: plain_term, location_note, condition_category, confidence).
4. Numbers discipline: every aggregate labeled "reports filed"; no "incidents," no "failures occurred N times" without "reported."
5. Citation: every derived view carries record IDs + canonical query URL; export preserves IDs.
6. Empty-history handling: zero reports renders the boundary statement prominently — drafted wording must neither reassure nor alarm.
7. NTSB bridge: static module with links (NTSB CAROL, aviation accident database, docket) — phrased as "where accident records live," not a deflection.
8. Abstention by default: gloss/extraction emit confidence; below threshold render nothing rather than something.

Draft copy — needs to be accurate, not cold, not alarming. Let me draft:

Page framing block (tail page):
> **About these records.** This page lists Service Difficulty Reports filed with the FAA for aircraft [tail] between [first date] and [last date]. A report is written when a mechanic or operator finds a component that has failed, is malfunctioning, or is not up to standard — most often during a scheduled inspection. In other words, each entry here describes a problem that was found.
> 
> What this database does not contain: it has no accident records, and it does not say what caused any problem. Report counts differ between aircraft for many reasons, including how big the fleet is, how it is used, and how diligently an operator files — more reports do not mean a less safe aircraft, and fewer reports do not mean a safer one.
> 
> If you are looking for information about an accident, the NTSB maintains those records: [link].

Zero-report case:
> **No reports found for [tail].** This database contains maintenance reports, not a safety record. Many aircraft in service generate few or no reports in this database, and the absence of reports here does not indicate that an aircraft is safe or unsafe. [NTSB bridge.]

Gloss label:
> *Plain-language rendering of the filer's description, generated with software and checked against the original. The filer's own words are authoritative; where they conflict, trust the quotation above.* Hmm, "generated with software" — good honesty. Maybe: "Plain-language rendering of the description above, produced by software and spot-checked by editors. The original wording above is the source of record."

Recurrence-view copy:
> These are reports filed about [part]. That the same part appears in reports from several aircraft does not by itself indicate a shared cause. Investigations of cause are the role of the FAA and NTSB.

Now — output format. This is a long, structured deliverable. The prompt demands structured markdown, section order 1–9, tables where they compress, decisive, concrete, no filler. The user said "execute prompt." So I execute in-character. Length: this will be long — that's appropriate; the prompt itself demands 9 sections with a 6–10 row table and detailed validation. But I should keep every cell tight. Aim for thorough but compressed — maybe 2,000–2,600 words. No preamble beyond maybe a one-line acknowledgment of the amendment being absorbed (or just fold it in silently — better to show one line noting the amendment is incorporated, since the user gave a decision; a single sentence like "Amendment incorporated: tail lookups for relatives are in-scope by fiat; Section 3 and 6 treat framing, not admission." Actually the prompt's calibration says no filler — I could open with a single "Decision received and applied:" line. That respects the user's instruction without ceremony. One short line max, or fold it into Section 3/6 with a note. I'll do one italic line up top.)

Let me also double check arithmetic: 3,945 − 1,213 = 2,732 unresolved designators. Location: 196,663 + 1,496,585 + 64,580 = 1,757,828 ✓. 1,496,585 / 1,757,828 ≈ 85.1% ✓. Good, use exact figures where they land.

Also — AircraftTotalTime/Cycles: coverage "in most records"? They're listed among high-coverage columns. I'll treat as high-coverage with a probe note (P0 can check).

One more consideration for Section 2 stakes: journalist reputational/legal; researcher professional; relative emotional/grief + media scrutiny. Fine.

Section 4 affordances — include serial-as-durable-identity prominently (genuinely clever and checkable), times/cycles as within-tail trajectory, HowDiscoveredCode as framing field, station numbers + crack fields for structural stories, part number recurrence, DifficultyDate vs SubmissionDate lag.

Capability discipline section — the prompt says "for each proposal, name the features it actually uses." I'll put a compact "GLM-5.3-Flash usage" line inside the candidates table or as a short block after the table, plus in Section 7. The table is already dense; I'll add a short capability-mapping block after the table instead (3–5 bullets), plus reasoning-tier policy. That satisfies it without bloating the table. Actually maybe add a narrow column? The table has 7 columns already — too many. Post-table block it is. Or fold per-build: too wordy. Post-table.

Failure modes per build — required in the table. I'll compress to key phrase.

Let me draft the table rows tightly:

| # | Build | Users | Fields relied on | LLM role → failure modes | Harm risk | Effort | Cheapest kill-probe |

1. Airframe History Page (tail spine). All three. RegistryNNumber, AircraftSerialNumber, DifficultyDate, OperatorDesignator, AircraftMake/Model, TotalTime/Cycles, PartName/Number, PartCondition, NatureOfCondition, HowDiscoveredCode, StageOfOperation, crew codes, Discrepancy. LLM: none for page assembly; optional per-record gloss (build 2). Failure: n/a deterministic. Harm: misreading of empty/sparse history by relatives → fixed framing block + zero-report copy. S/M. Probe: P0 (25 tails × coverage).

2. Per-record plain-language gloss. All three (relatives most). PartName, PartCondition, NatureOfConditionA, Discrepancy. LLM: structured output {plain_term, location_note, condition_category, confidence}; abstain below threshold. Failure: wrong gloss on rare/abbreviated parts; hallucinated detail. Mitigation: gloss only when PartName in known vocabulary; otherwise none. Harm: journalist quotes gloss not record → gloss subordinate + labeled + cached/QA'd. M. Probe: P2 (300 labeled).

3. Free-text location extraction. Researchers, journalists. Discrepancy, FuselageStation/From/To, WingStation. LLM: batch extraction, structured {zone, span, confidence}, reasoning low, context caching. Failure: abbreviation ambiguity (FS/FR/WL/STA), station→zone mapping errors. Harm: researcher mis-buckets a query; mitigated by verbatim echo + abstention. M/L. Probe: P3 (200 labels; <30% mappable → kill).

4. Part-number recurrence view. Journalists, researchers. PartNumber, PartName, Discrepancy, tail, dates. LLM: none (or light grouping of near-duplicate phrasing). Failure: dash-variant part numbers split/merge wrongly. Harm: over-read as common-cause → fixed copy ("does not by itself indicate a shared cause"). S. Probe: 10 high-count part numbers; coherent cross-tail clusters?

5. Possible-repeat-finding flag. Researchers, journalists. Tail, PartNumber/PartName, dates, cycles, Discrepancy. LLM: pairwise similarity, structured {same_finding, confidence}, reasoning low. Failure: false merges of routine recurring wear. Harm: implies maintenance breakdown without cause data → "possible" phrasing, both records shown, never merged. M. Probe: P4 (100 pairs, ≥80% precision or drop).

6. Citation/export backbone. All three, esp. journalists. All fields; record IDs. LLM: none. Failure: none beyond API drift. Harm: none; absence is the harm. S. Probe: round-trip 3 filter sets.

7. Templated tail summary + numeric verifier. Relatives primarily; journalists lede. Computed stats only. LLM: fills fixed slots from stats; verifier string-matches every number. Failure: verifier fail → fall back to stat strip (fail-closed). Harm: any embellishment — bounded by template. M. Probe: P2b — 20 tails, 0/20 verifier failures across 3 regenerations.

8. Discovery-context overlay. All three. HowDiscoveredCode (+StageOfOperation). LLM: none (static code→phrase map). Failure: unmapped codes display raw (acceptable, per dataset convention). Harm: none; it's the volume-trap antidote. S. Probe: distribution of unmapped codes on 1,000 records (<10% unmapped → ship).

9. Operator page with unresolved-designator honesty. Journalists, researchers. OperatorDesignator, resolved names. LLM: candidate-name suggestions for 2,732 unresolved; human-confirmed before display. Failure: wrong name attach. Harm: journalist prints wrong operator → suggestions shown as unconfirmed candidates in UI until confirmed. M. Probe: P5 (50 hand-checked; ≥70% candidate precision or raw-code-only).

Good — 9 builds.

GLM capability mapping block:
- Structured output (JSON schema): builds 2, 3, 5, 7 — schema bans cause-language fields by construction in gloss.
- Function calling: gloss/extraction pipelines call existing JSON API; no new endpoints needed for v1.
- Context caching: cache JASC/part vocabulary + gloss few-shots + zone-pattern instructions; per-record payloads tiny; 1.5M-record extraction run becomes cache-heavy/cheap.
- Reasoning tiers: low for extraction/pair-similarity (builds 3, 5); high for offline gloss QA batch; max reserved for adversarial-set design, not runtime.
- Streaming: gloss render on tail pages.
- Explicitly unused for v1: 1M context (whole-tail free-read → rejected build), image/video (no inputs), 128K output (nothing generates long).
- Error catching before users see: cached gloss + P2 sampling cadence; verifier fail-closed for build 7; extraction never surfaces without verbatim span + confidence.

Section 7 recommendation: MVP = builds 6 + 1 + 8 + static framing + (2 limited). Sequence: v1 → v1.5 (build 7) → v2 (3, 5, 4, 9). Justify value/harm/effort: build 6 is the trust substrate and cheapest; 1 is the single surface all three users need and where the amendment lands; 8 is the framing engine with zero LLM risk; 2 is the only generation in v1 and it's record-scoped, schema-constrained, abstaining. Exclusions and why: no operator pages until resolution proven (wrong-name harm); no cross-fleet narrative surfaces until gloss QC matures; no chat; no accident linkage; no extraction until P3 passes.

Also worth noting in v1: show "also operated as N____" when serial maps to multiple tails (contingent on P1) — put in v1 as conditional or v1.5. I'll say: if P1 confirms >5%, include; else drop. That's honest.

Word-count discipline: I'll compress section 2 into per-group bullets with tags and a stakes clause. Section 3 as three sub-lists. Keep prose lean.

One nuance for Section 3 re: amendment — I'll note: "Per the operator's decision, the tail-history lookup itself is not adjudicated here; it is treated as directly supported, and the design burden shifts to framing (see builds 1, 7, 8 and Section 9)."

Also the calibration "counts are counts of reports filed" — I must consistently phrase crew-action counts etc. as "reports filed." And distinguish prevalence vs volume in rejections/leaderboard and operator page.

Zero-report copy — make sure it doesn't reassure ("does not indicate safe or unsafe") and doesn't alarm.

NTSB links: I can reference "NTSB CAROL" (the public accident query system) generically — fine.

One more thing the prompt asks: "Every derived view must link back to raw records (record IDs / reproducible query URLs)" — in guardrails; and "Draft example wording that is accurate without being cold or alarming" — done above.

Also unknowns: I should sprinkle UNKNOWN-NEEDS-PROBE tags where I assert beyond data: e.g., share of tails reassigned (P1), unmapped discovery codes (P-preflight), DifficultyDate coverage (P0). Good.

Length check: 9 sections, table of 9 rows with 8 columns — that's big but the prompt demanded it. I'll keep cells terse. Use headers matching section names. Skip a preamble except one line acknowledging the amendment. Maybe end with nothing extra (no "would you like..."). The user said execute; deliver the artifact.

Formatting: markdown headers, tables, bold sparingly. This is a max-effort structured deliverable — length is warranted, but compress hard. Let me write it.