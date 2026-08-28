Below is the full audit. **Convention:** every item marked **[I]** is inferred by me and *not established by the source*. I use three tags because conflating two different kinds of "stated" would misattribute authority:

- **[S]** — stated in the SOURCE MATERIAL block
- **[U]** — stated in your amendment (your decision, not a fact about the data)
- **[I]** — inferred by me; not established by the source

Where a sentence mixes sources, I tag the components. Sections that are wholesale invention get a blanket ruling plus item-level flags for anything load-bearing.

---

## Preamble of previous answer

| Sentence | Verdict |
|---|---|
| "Tail lookups for victims' relatives are in scope by decision of the operator" | [U] |
| "Sections 3, 6, 7 therefore adjudicate framing, not admission" | [I] — my structural reading of your instruction; not established by the source |

## §1 Existing-coverage audit

| Sentence | Verdict |
|---|---|
| "The current interface is a record retrieval tool: show me records matching these codes and this text" | **Mixed.** Filtered search over coded fields + full-text over Discrepancy [S]; the label "record retrieval tool" is my characterization [I] |
| "It answers that well — point lookups by tail, part queries across the fleet, condition codes (corroded, cracked), crew-action filters, date slicing, full-text" | Filter names (`tail`, `part`, `condition`, `corrosion`, `cracked`, `crew`, `from`/`to`) [S]. "Answers that well" [I]. The specific code values "corroded/cracked" [I] — filters are named, their values are not given. "Across the fleet" [I] |
| "It cannot answer: aggregation / extraction / framing / citation" | [I]. The stated filter list contains no such capability, so I inferred absence from the list. Not established by the source |
| "~85% of location information (1,496,585 of 1,757,828 records) lives in free text" | Counts [S]; the percentage is my arithmetic on stated numbers |
| "along with most descriptive detail" | [I] |
| "The database contains the antidote to its own misreading (**HowDiscoveredCode shows most findings are caught during scheduled inspection**)" | **[I] — NOT established by the source.** The source lists HowDiscoveredCode as a column but gives no distribution. The only counts provided are crew-action counts. I asserted a distribution I do not have. Flagged for repair below |
| "and never surfaces it" | [I] |
| "Citation — record IDs, reproducible query URLs, export" | [I], with one grounding: the named filter parameters [S] make query URLs constructible. **Record ID existence is unknown** — the source lists ~35 of 76 columns; no ID column appears among those listed, but one may exist among the unlisted. Export is not mentioned anywhere in the source |
| "For journalists this is not a feature; it is the product" | [I] — rhetoric |
| "Every proposal must add aggregation, extraction, or framing — not another filter" | [I] — my own design rule |

## §2 Need analysis

**Blanket ruling:** the source states the three user groups and nothing else about them — no jobs, no stakes, no arrival context. **Every job, every stake, every "arrives via a crash" in this section is [I] and not established by the source.**

Additionally, my **[EVIDENCED] / [ASSUMED] tags overstated grounding**: "EVIDENCED" meant *the stated interface makes this job performable* — e.g. `tail` + `from`/`to` filters [S] anchor journalist job 1; the JSON API [S] anchors researcher job 1. That the jobs are *wanted* is my inference throughout. Specifically:

- "Bulk export of filtered sets" — **export capability is not established** anywhere in the source; the API implies data access, not an export feature.
- "Distinguish findings caught in scheduled inspection from findings that surfaced in service" — depends on the unverified HowDiscoveredCode distribution above.
- "Where those records live (NTSB)" — **[I], external knowledge.** The source never mentions the NTSB. (Correct in the real world, but not in the material.)
- "A report is a finding that was caught" as a relative's need — [U], your amendment.
- "Know the boundary — no accidents, no causes" — [S] (dataset lacks both) plus [U].
- All emotional-stakes lines ("legal exposure," "one bad page ends trust") — [I].

## §3 Data-vs-need map

| Sentence | Verdict |
|---|---|
| Tail history timeline from the listed fields | Fields [S]; the timeline as buildable/desirable [I]. "Record ID" within the field list — **unknown, not established** |
| Part-number recurrence; discovery-code distributions | PartNumber field [S]; computability [I] |
| The four fixed framing statements ("defect caught" / "no accidents" / "no causes" / "absence ≠ safe") | **[U] — all four are your amendment's words**, not source facts. The source supports "no accidents" and "no cause" directly [S]; "defect caught" and "absence ≠ safe" are your stipulations |
| The user questions I reframed ("How safe was this tail?", "Was my flight safe?", "Most dangerous airline") | [I] — invented illustrative questions; no evidence any user asks these |
| "2,732 of 3,945 designators resolve to no name" | [S] by arithmetic (3,945 − 1,213) |
| "AD/recall status — not in this dataset" | [I] — inferred from the column list; the source never mentions airworthiness directives |
| "A hedged 'likely mechanism' line will be quoted as fact" | [I] — prediction |
| "Tail lookup sits in directly supported; burden shifts to framing" | [U] for the decision; [I] for which builds carry it |

## §4 Untapped affordances

| Sentence | Verdict |
|---|---|
| "AircraftSerialNumber as durable identity. **Tail numbers get reassigned**" | SerialNumber field [S]. **Reassignment is [I], external knowledge, not established by the source** — I flagged this as UNKNOWN-NEEDS-PROBE at the time, correctly, but the premise itself is outside the source |
| "HowDiscoveredCode as the framing field... scheduled-inspection vs in-service is the single most important context" | Field [S]; the importance claim and the dichotomy [I] |
| "Each report a within-tail position ('filed at 45,210 hours')" | Fields [S]; interpretation [I]; the example number invented |
| Station/crack/corrosion fields as "structured aging-aircraft data... currently buried behind filters" | Fields [S]; "aging-aircraft" framing [I]; "buried" [I] — grounded in the fact that the stated filter list omits the station fields, which is [S] by the list itself |
| "DifficultyDate vs SubmissionDate. Filing lag" | Fields [S]; the lag reading [I] |
| "The largest single extraction opportunity in the dataset" | Count [S]; the superlative [I] |

## §5 Candidate builds

**Blanket ruling:** all ten builds, all failure-mode speculations, all effort ratings, all kill-probes are **[I]** — not established by the source. Grounded atoms within them: every field name cited [S]; "unmapped codes display raw" [S — "Codes not present in those tables are displayed as the code"]; "~1.5M records" [S]; all model capabilities cited [S]. Items worth isolating:

- "Fails on abbreviation ambiguity (FS/FR/WL/STA)" — **[I]**. Only RH, O/B, NR and FR appear in the three stated examples; FS, WL, STA are not in the source.
- "Dash-variant part numbers" — [I], external.
- "Per-record payloads are tiny" — **[I]**. Only three