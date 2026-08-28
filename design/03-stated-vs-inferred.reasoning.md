The user wants me to take my previous answer and mark each sentence as either stated in the source material or inferred by me. For anything inferred, I need to say it is not established by the source.

Let me go through the previous answer systematically, sentence by sentence or claim by claim, and check against the source material.

Source material facts:
- Dataset: FAA Service Difficulty Reports, FAA, 1995 to present
- Held at aircraftdefects.com
- 1,757,828 records
- 54,634 aircraft by tail number
- 3,945 operator designators, 1,213 resolve to name from FAA lists
- Record filed by mechanic or operator when component fails, malfunctions or found defective
- 76 columns, listed
- Discrepancy is free text, present in most records, three examples
- Coded fields resolve against FAA lookup tables; codes not in tables displayed as code
- Crew action counts (given)
- Location: 196,663 numbered zone; 1,496,585 free text only; 64,580 none
- Existing interface: filtered search over coded fields + full-text search over Discrepancy; filters listed (q, operator, make, model, tail, part, condition, stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from, to)
- JSON API, no authentication
- Dataset does NOT contain: fleet size or flying hours; cause of defect; accident records
- Intended users: investigative journalists; researchers and safety analysts; relatives of people who died in aviation accidents
- GLM-5.3-Flash specs: video/image/text/file input; text output; 1M token context; 128k max output; 320B params 18B active; sparse and linear attention reducing attention computation 3.01x and KV cache 4.44x vs GLM-5.3; reasoning always enabled low/high/max; function calling; structured output to JSON schema; context caching; streaming and tool streaming

Plus the user's amendment in message 2: relatives MAY look up a tail number's history; it is public record; a tool that withholds public records from the most affected has appointed itself gatekeeper; do not spend Phase 1 on whether to show it; spend on how framed; a write-up is a defect that was caught; dataset records no accidents and no causes; absence of reports is not evidence of a safe aircraft.

Also my own system prompt gives guidance about calibration, uncertainty, etc.

Now let me go through my previous answer section by section.

**Header note:** "Amendment received and applied: tail lookups for victims' relatives are in scope by decision of the operator." — Stated by user (amendment). "Sections 3, 6 and 7 therefore adjudicate framing, not admission" — inferred/logical consequence of the amendment, but reasonably derived. I'll mark it as inferred from the user's decision (the user said don't spend Phase 1 on whether to show it, so adjudicating framing not admission is a direct restatement). Actually this is basically stated by the user. I'll mark as stated-by-user/amendment.

**Section 1: Existing-coverage audit**

- "The current interface is a record retrieval tool: it answers 'show me records matching these codes and this text.'" — Inferred. The source says the interface does filtered search over coded fields and full-text search over Discrepancy. Characterizing it as "record retrieval tool" is a reasonable inference but not stated. Actually it's fairly directly derivable: filtered search + full-text search = retrieval. I'd mark: Stated in essence (the source lists the search capabilities); the characterization "record retrieval tool" is inferred but consistent. I should be careful — the user asked me to mark each sentence as either stated or inferred. So I need to make a judgment call for each. For borderline cases I should mark them honestly as inferred, or note "stated in part."

Let me be rigorous. The instruction: "mark each sentence as either stated in the source material or inferred by you. For anything inferred, say it is not established by the source."

This is a self-audit task. I should go through and be honest. Many of my claims are inferences. Some are stated. Let me categorize:

Stated directly by source:
- Dataset identity, record counts, column lists
- Operator designator counts (3,945 / 1,213 resolve)
- Location counts (196,663 / 1,496,585 / 64,580)
- Crew action counts
- Filter list
- JSON API no authentication
- What dataset lacks (fleet size, flying hours, cause, accidents)
- Users (three groups)
- Model capabilities
- Discrepancy is free text, present in most records
- Record definition: "filed by a mechanic or operator when a component fails, malfunctions or is found defective"
- Coded fields resolve against FAA lookup tables; unmatched codes displayed as code

Stated by user amendment (message 2):
- Relatives may look up tail history; public record; gatekeeper argument; framing focus; write-up = defect caught; no accidents/causes; absence of reports ≠ safe aircraft

Stated by my own system prompt (the original prompt I generated) — hmm, the process requirements came from my own prompt, not the source. But the user executed it, so those are "established" in the sense of task instructions, not source material. The user asked specifically about "source material" — I think I should treat the SOURCE MATERIAL block and the amendment as the source, and everything else in my answer as either stated (traceable to those) or inferred (mine).

Now let me go sentence by sentence through my answer.

**Section 1:**

1. "The current interface is a record retrieval tool: it answers 'show me records matching these codes and this text.'" — INFERRED (characterization). The components (filtered search over coded fields, full-text search over Discrepancy) are stated. The label "record retrieval tool" is my characterization. Mark: partially stated, characterization inferred. I'll say: Stated (search capabilities listed in source); the summary label is inferred. Actually, to keep it clean: mark as Stated with a note, or Inferred? The sentence as a whole is a characterization built from stated facts. I'll mark "Stated (restates the interface description)" — hmm. Honesty matters here. The sentence is essentially a paraphrase. Filtered search over coded fields and full-text search = "show me records matching these codes and this text." I'll mark it as stated (paraphrase of source), noting the paraphrase.

2. "It answers that well — point lookups by tail, part-level queries across the fleet, condition codes (corroded, cracked), crew-action filters, date slicing, and full-text search over Discrepancy." — The filter list supports tail, part, condition, crew, date (from/to), full-text. "Part-level queries across the fleet" — the `part` filter exists; whether it does "across the fleet" is implied. "condition codes (corroded, cracked)" — source lists `condition` and `cracked` and `corrosion` filters; the values corroded/cracked are inferred from filter names. "answers that well" is an evaluation — inferred. Mark: Mostly stated (filter names); "answers that well" and the specific code values are inferred.

3. "It cannot answer, and no filter combination will: Aggregation..." — INFERRED. The source says the interface is filtered search + full-text; it doesn't say aggregation is absent. Actually, the source describes the existing interface as "filtered search over the coded fields and full-text search over Discrepancy" with those parameters. Aggregation is not among them. So the inference "cannot aggregate" is reasonable but the source doesn't explicitly say "no aggregation exists." It's a strong inference from the interface description. Mark: Inferred from the listed filters; not explicitly stated.

4. "Extraction — anything from free text..." — INFERRED. Same logic. Full-text search over Discrepancy is stated; structured extraction is not mentioned anywhere, so its absence is inferred. Not established by source.

5. "Framing — what an SDR is..." — INFERRED. Source doesn't mention any explanatory framing on the site. The absence is inferred. Note: the user amendment says a write-up is a defect that was caught — that's framing the user supplied, implying the site may not currently surface it? The user said "Spend it on how it is framed" — implying framing needs to be built. But the source doesn't say the site lacks framing. Mark: inferred; not established.

6. "HowDiscoveredCode shows most findings are caught during scheduled inspection" — WAIT. This is a specific empirical claim: "most findings are caught during scheduled inspection." The source gives HowDiscoveredCode as a column but gives NO distribution counts. The only counts given are crew action counts. So "most findings are caught during scheduled inspection" is NOT established. I fabricated/assumed this. This is an important catch. Mark: NOT stated; the source lists HowDiscoveredCode as a column but gives no distribution. I asserted "shows most findings are caught during scheduled inspection" — this is an unverified claim. Also later "discovery-code distributions" and the guardrail claim in build 8 ("it is the volume-trap antidote" and "the database's own discovery codes refute the misreading"). The claim that most findings come from scheduled inspection is plausible domain knowledge but NOT in source. Also in §9 framing block copy: "most often during a scheduled inspection" — that's my inserted claim, not established by source. This is a significant honest-flag item. Also in §7: "the database's own discovery codes refute the misreading of volume" — presumes the distribution; not established.

7. "For journalists this is not a feature; it is the product." — rhetorical inference. Mark: inferred (rhetoric), not established.

8. "Every proposal below must add aggregation, extraction, or framing — not another filter." — my own design rule. Inferred/constructed. Not established by source (it's a normative statement by me).

**Section 2: Need analysis**

All jobs tagged [EVIDENCED] vs [ASSUMED] — but note my [EVIDENCED] tags mean "implied by the existence of the interface/users," not literally stated in the source. Honesty check: The source states the intended users. It does not state their specific jobs. So even [EVIDENCED] jobs are inferences from the tool's existence. In my previous answer I tagged some as [EVIDENCED] — I should now clarify that even those are inferred from the existence of filters/users, not stated needs. E.g.:

- Journalist job 1: "Reconstruct a tail's report history around a date of interest, with citable raw records." — Inferred. Source says intended users include investigative journalists; nothing about their jobs. The tail filter and from/to filters exist (stated), which is the basis. But the job itself: inferred, not established.
- "Stakes: story accuracy and legal exposure" — pure inference. Not established.
- Similarly for all researcher jobs. "Reproducible queries with documented limitations" — inferred from JSON API existence (stated). The job: inferred.
- Relatives' needs: all inferred. Source only says "relatives of people who died in aviation accidents" are intended users. Everything about "arrive after a crash looking for answers" — wait, that phrasing was in MY prompt, not the source. Source says only: "relatives of people who died in aviation accidents." The emotional stakes, arrival-after-crash, etc., all inferred. Though the user's amendment adds: relatives may look up tail; gatekeeper argument; absence of reports ≠ safe. So some framing facts come from the amendment.

Also "Emotional stakes maximal; one bad page ends trust in the whole site" — inference.

Note the counts of tags: I tagged 1–2 jobs per group as [EVIDENCED] and others [ASSUMED]. In this audit I should be transparent that "EVIDENCED" meant "derivable from stated interface features" and is still not a stated user need. That's an important epistemic honesty correction.

**Section 3:**

- Directly supported items: tail history timeline from structured fields — the fields exist (stated); building a timeline is proposed by me. "Directly supported" is my judgment. Mark: fields stated; feasibility judgment inferred.
- Part-number recurrence across tails: PartNumber field exists (stated); recurrence view is my proposal.
- Reframings: "How safe was this tail?" → reframe. The question itself is invented by me (illustrative). The reframing content: "reports are findings that were caught" — from user amendment (stated by user). "No accidents here" — stated. "No causes" — stated. "Absence of reports is not evidence" — stated by user amendment (and echoed in my §9 copy). Good — those four fixed statements trace to the amendment except... let me check: amendment says "a write-up is a defect that was caught, that the dataset records no accidents and no causes, and that absence of reports is not evidence of a safe aircraft." Yes — all four traceable to amendment: (1) defect caught, (2) no accidents, (3) no causes, (4) absence ≠ safe. 
- "2,732 of 3,945 designators (3,945 − 1,213) resolve to no name" — arithmetic from stated numbers. 3,945 − 1,213 = 2,732. Stated (derived by arithmetic). Fine.
- "shown honestly" — my proposal.
- Refusals: cause inference — the cause absence is stated. "Any hedged 'likely mechanism' line will be quoted as fact" — inferred prediction.
- "Per the operator's decision, the tail lookup itself sits in directly supported" — stated by amendment.

**Section 4: Untapped affordances**

- "AircraftSerialNumber as durable identity. Tail numbers get reassigned" — Tail reassignment is real-world domain knowledge, NOT stated in source. The serial field exists (stated). The claim that tails get reassigned and that a lookup may miss earlier history: inferred from external knowledge. Not established. My P1 probe was designed to test it — good, but the premise is not established.
- "HowDiscoveredCode as the framing field... Scheduled-inspection findings vs in-service findings is the single most important context" — the field exists (stated). The claim about scheduled vs in-service being the key distinction: inferred (and depends on the unverified distribution claim).
- "AircraftTotalTime/Cycles per record. Gives each report a within-tail position" — fields stated; interpretation inferred.
- "Structured aging-aircraft data; highly citable; currently buried behind filters" — "aging-aircraft" framing is domain knowledge; "currently buried behind filters" — inferred (the `zone`, `corrosion`, `cracked` filters exist; station fields — are station fields filterable? The filter list includes `zone`, `corrosion`, `cracked` but NOT fuselage/wing station. So "buried" is a reasonable inference: station fields not in filter list. Actually can I infer that? The source lists the filters; fuselage/wing stations aren't among them. So yes, they're not directly filterable per the stated interface — that's stated-by-absence, reasonably inferable. But "buried" is my characterization.
- "PartNumber exact-match recurrence. The schema invites the classic pattern story; needs no LLM." — inferred proposal.
- "DifficultyDate vs SubmissionDate. Filing lag" — both fields stated; the lag interpretation is straightforward but my addition.
- "The 1.5M free-text-only locations... largest single extraction opportunity" — the count is stated; "largest single extraction opportunity" is my evaluative judgment.

**Section 5: Candidate builds**

Build 1: field list — all stated fields. The build itself is mine. "None — fully deterministic. Failure mode is data coverage, not generation" — my claim. Fine.
- "Relatives misreading a sparse history → fixed framing" — the harm mechanism is inferred; the amendment establishes absence≠safe concern.

Build 2: per-record gloss — proposal. "Fails on rare/abbreviated parts" — my speculation about failure modes; not established (no evidence about abbreviation frequency in source beyond the three examples, which do contain abbreviations like RH, O/B, NR, FR — actually the examples DO show abbreviations: "RH MAIN FLAP CARRIAGE NR 2", "O/B UPPER RUB PAD", "FR73-FR77". So abbreviation presence is observable from the stated examples. The claim that gloss "fails" on them is my speculation.)

Build 3: "~1.5M records" — stated count (1,496,585). "Fails on abbreviation ambiguity (FS/FR/WL/STA)" — my speculation; FR appears in an example; FS/WL/STA do not appear in source. Not established.

Build 4: part recurrence — proposal. "dash-variant part numbers" — external domain knowledge; not established.

Build 5: repeat-finding flag — proposal. "Fails by merging routine recurring wear" — speculation.

Build 6: citation/export backbone — proposal. "Absence is the harm" — rhetorical.

Build 7: templated summary + verifier — proposal entirely.

Build 8: discovery-context overlay — proposal; "static code→phrase map" — the lookup tables are stated to exist (FAA lookup tables published by the FAA). Wait — do FAA lookup tables cover HowDiscoveredCode? Source says "Coded fields resolve against FAA lookup tables published by the FAA." So a code→phrase map exists in principle for coded fields. But HowDiscoveredCode — is it in the lookup tables? Plausibly; not explicitly stated which fields have tables. The source lists HowDiscoveredCode among columns and says coded fields resolve against FAA lookup tables. Reasonable inference that HowDiscoveredCode is a coded field (it has "Code" in the name). The claim "the database's own discovery codes refute the misreading of volume" — depends on the unverified distribution. Flag it.

Also in build 8 row: "None — static code→phrase map; unmapped codes display raw per dataset convention" — "unmapped codes display raw" is stated ("Codes not present in those tables are displayed as the code"). Good.

Build 9: operator page — the 2,732 unresolved designators derived arithmetically; FAA lists exist (stated: "1,213 resolve to a name from FAA lists" — implying FAA lists exist). Candidate suggestion: proposal. "Journalist prints wrong operator" harm: inferred.

**Capability mapping:**
- Structured output, function calling, context caching, reasoning tiers, streaming — all stated capabilities. My mappings are proposals.
- "cache the JASC/part vocabulary" — JASCCode column stated; FAA lookup tables stated.
- "per-record payloads are tiny" — inferred (Discrepancy is free text; typical length unknown; examples are short — that's weak evidence. The three examples are short but they're examples; "tiny" is inferred).
- "reasoning max reserved for designing the adversarial test set, never at runtime" — my design decision.
- "Deliberately unused: the 1M context (whole-tail free-read generation...)" — capability stated; the decision is mine.

**Section 6: Rejections**
- No denominators: stated (dataset does not contain fleet size or flying hours). "No outcome data": accidents absent — stated. "Any score is noise wearing a number" — rhetoric, mine.
- Reporting-culture confound: "Voluntary filing" — WAIT. Does the source say filing is voluntary? Let me check. Source: "A record is filed by a mechanic or operator when a component fails, malfunctions or is found defective." It does NOT say voluntary. Hmm. In my prompt I wrote "Voluntary filing → reporting culture varies by operator" — I introduced "voluntary" in the prompt I generated, not the source. SDRs are in fact mandatory for certificated operators under 14 CFR (real-world knowledge), while voluntary for others. So "voluntary filing" is not established by source — it's actually partially wrong as a blanket claim in the real world. In the previous answer §6.2: "an operator filing 4,000 reports may be the diligent one" — the diligence/reporting-culture point is domain inference; "voluntary" specifically is not in source. In §3 I wrote "reporting-culture confound"? Let me check: §3 unsupported list — "Most dangerous airline/type — refuse (see §6)". §6.2 says "plus the reporting-culture confound: an operator filing 4,000 reports may be the diligent one." The reporting-volume-reflects-behavior idea: not stated in source. The source says nothing about why volumes differ. So flag: reporting-culture explanation is inferred, not established. (My original prompt asserted "Voluntary filing" as a fact — that was me inserting unverified material into my own prompt, which then propagated. Honest audit should catch this.)
- Rejection 3: accident linkage — "tails get reassigned" — not established (external knowledge). "every journalist arrives via a crash" — inferred; source doesn't say why journalists come. Not established.
- Rejection 4: cause inference — dataset lacks cause: stated. "Even a hedged 'likely mechanism' line will be quoted as fact" — predicted, inferred.
- Rejection 5: chat — "the 1M context makes it trivially buildable" — capability stated; "trivially" is my judgment. "maximally dangerous" — mine.

**Section 7:**
- MVP recommendation — my decision.
- "Build 8 is the framing engine with no LLM involved: the database's own discovery codes refute the misreading of volume" — the "refute" claim presumes the scheduled-inspection-majority distribution — NOT established. Flag.
- "gloss on vocabulary-covered records only" — implies a vocabulary; FAA lookup tables exist for coded fields (stated); my gloss-vocabulary notion is mine.
- Exclusions list — mine.
- Sequence — mine.

**Section 8:**
- All probes are my inventions. Pass/fail bars are mine. "stratified across 6 JASC systems × 2 decades" — JASC stated; 1995–present spans ~30 years (stated "1995 to present"), so two decades is derivable-ish. Fine, but the probe design is mine.
- "25 tails sampled across report-count deciles" — deciles require computing counts; feasible. Mine.

**Section 9:**
- Guardrails — mine.
- Copy: "most often during a scheduled inspection" — NOT established by source (HowDiscoveredCode distribution unknown). This is the same flag as §1. The rest of the framing block traces to the amendment: "A report is written when a mechanic or operator finds a component that has failed, is malfunctioning, or is not up to standard" — close paraphrase of stated record definition ("fails, malfunctions or is found defective"). "not up to standard" is a slight expansion of "found defective" — minor paraphrase, acceptable but I can note it.
- "Each entry here describes a problem that was found." — from amendment ("a write-up is a defect that was caught"). Stated by user.
- "Report counts differ between aircraft for many reasons — fleet size, how an aircraft is used, how diligently an operator files." — "many reasons" and the specific list: inferred. Fleet size, usage, diligence are plausible but not stated. The source only states the dataset lacks fleet size/hours. The reasons list is mine. Flag.
- "More reports do not mean a less safe aircraft. Fewer reports do not mean a safer one." — This is the absence≠safe principle extended in both directions. Amendment states "absence of reports is not evidence of a safe aircraft" (one direction: few/absence → not proof of safe). The converse (many reports → not proof of unsafe) is an extension I made; it follows logically from the fact that reports are defects caught, but the user only stated one direction. Also from "a write-up is a defect that was caught" one could argue many write-ups = many catches, but "not less safe" is a further step. Mark: partially established (one direction stated by amendment); the converse is inferred.
- Zero-report copy — the core sentence traces to amendment; the rest mine.
- Gloss label — mine.
- Recurrence copy: "That the same part appears in reports from several aircraft does not by itself indicate a shared cause." — consistent with "dataset does not contain cause"; mine. "Determining cause is the role of the FAA and NTSB" — external knowledge about agency roles; not stated in source.

Also §1 claim: "the database contains the antidote to its own misreading (HowDiscoveredCode shows most findings are caught during scheduled inspection)" — flagged already.

Also §2 journalist job 5: "Read an operator's reporting character before writing about their numbers" — mine.

Also §3: "someone searching for a crash will not find it here. What IS visible is maintenance reporting on a tail before an accident" — wait, was that in §3? Let me recheck my answer... In the original prompt (first turn) I had that. In the executed answer, §3 unsupported list: "Accident lookup — the dataset does not record accidents; redirect." Stated. Good.

Also the §5 build 1 "crew codes" — crew action field stated (counts given). Fine.

Also "StageOfOperation" — stated column.

Also §8 P1: "how often one serial maps to >1 tail" — UNKNOWN-NEEDS-PROBE properly flagged in §4 and quantified in §8 — good, consistent.

Also §1: "HowDiscoveredCode shows most findings are caught during scheduled inspection" — this is the big one. Also in §9 copy "most often during a scheduled inspection."

Also §3 reframe statement #1: "reports are findings that were caught" — user-stated.

Also §7 "Build 6 is the trust substrate" — mine.

Also §2 relatives need 4: "where those records live (NTSB)" — the NTSB as accident-record holder is external knowledge, not in source. I referenced NTSB throughout; the source never mentions NTSB. Flag: NTSB bridge, "NTSB maintains those records," "Determining cause is the role of the FAA and NTSB" — all external knowledge, not established by source. (In the real world it's correct — NTSB investigates accidents — but per the audit discipline, it's not in the source material.)

Also FAA's role — "FAA Service Difficulty Reports, published by the FAA" — stated.

Also §6.1: "Refused permanently unless external denominator data joins the project" — mine.

Also §6.5: "every answer an uncontrolled framing event" — mine.

Also §8 P2 omission criterion "no omission of material condition words (crack, corrosion, wear)" — crack/corrosion columns stated; "wear" appears in example ("IS WORN"). Fine-ish.

Also §5 build 2 schema bans cause-language by construction — my design.

Also the model name "GLM-5.3-Flash" and all specs — stated.

Also "sparse and linear attention" usage — I didn't claim to use it. Fine.

Also §1 "date slicing" — from/to filters stated.

Also §1 "condition codes (corroded, cracked)" — `condition`, `corrosion`, `cracked` filters stated; the VALUES corroded/cracked are my guess at code values. The PartCondition column exists; values unknown. Minor flag.

Also §3 "Operator comparison → reporting volume and character, never ranking" — mine.

Also §2 stakes lines — all mine.

Also §2: "the JSON API's existence implies the job" — inference.

OK. Now: how to format the answer?

The user wants: "Take your previous answer and mark each sentence as either stated in the source material or inferred by you. For anything inferred, say it is not established by the source."

Reproducing the entire previous answer with per-sentence annotations would be extremely long. Options:

A) Full reproduction with inline tags [S] / [I] per sentence, with explanation for each [I]. Very long but literal compliance.

B) A structured audit organized by section, listing each claim/sentence (quoted or summarized), with verdict and note. This is more usable and still comprehensive.

C) A hybrid: reproduce the answer with inline markers, plus a summary of the most consequential inferences.

The user said "mark each sentence" — literal compliance suggests going sentence by sentence. But many sentences are trivial transitions ("Rationale by value-per-harm-per-effort"). The previous answer has maybe 120+ sentences. A full annotated reproduction could be 3,000–4,500 words. That's acceptable for this task given its importance (it's an audit/verification exercise; thoroughness is the point). But I should compress: group sentences where identical status applies, use tables per section maybe. Tables could compress well: | Claim | Verdict | Note |.

Actually the cleanest format that honors "each sentence" while staying readable: go section by section, quote each sentence (or condensed version for long ones), tag [STATED] / [INFERRED] / [MIXED], and for INFERRED add "Not established by the source." Plus a short preamble on method (what counts as source: the SOURCE MATERIAL block + the user's amendment; the model specs count as source too). And a closing summary of the highest-stakes inferences (the ones that materially affect the recommendation): (1) HowDiscoveredCode "most findings scheduled inspection" — unverified and load-bearing for build 8; (2) "voluntary filing" / reporting-culture — not in source; (3) tail reassignment / serial identity — not in source (but flagged as probe); (4) NTSB references — external; (5) the converse of the absence principle; (6) "most often during a scheduled inspection" in the framing copy — must be removed or verified before shipping; (7) even [EVIDENCED] tags in §2 were inference from interface existence, not stated needs.

That last point is important intellectual honesty: my [EVIDENCED]/[ASSUMED] tags conflated "implied by stated tooling" with "stated." The audit should correct that.

Also note: the "Amendment" header — the user's decision is stated by the user, which is source for this exercise (I'll define source as: SOURCE MATERIAL block + the user's instruction messages).

Let me now draft the audit carefully, section by section. I'll quote/condense each sentence. For efficiency I'll use a compact tag system: [S] stated, [I] inferred — not established by the source, [S→I] mixed, and for user-amendment-sourced claims [S-USER] — actually the user said "stated in the source material." Does the amendment count as "source material"? The amendment is the user's own decision, not the SOURCE MATERIAL block. Hmm. The safest: treat the SOURCE MATERIAL block as the source, and separately note "stated by your amendment" as a third category — because the user will want to distinguish "in the FAA facts" from "you decided this." I'll use three tags:

- [S] — stated in the SOURCE MATERIAL block.
- [U] — stated in your amendment/decision (message two). Not in the source material; supplied by you.
- [I] — inferred by me; not established by the source.

This is more honest and useful. The user's instruction: "mark each sentence as either stated in the source material or inferred by you." Strictly binary, but the amendment is a real third provenance. I'll note the convention up front: I've split "stated" into source-block vs. your amendment because conflating them would misattribute authority. That respects the spirit (identify what's grounded vs. mine) while being precise.

Now, sentence-by-sentence. Let me reconstruct the previous answer's sentences.

**Preamble (previous answer):**
1. "Amendment received and applied: tail lookups for victims' relatives are in scope by decision of the operator." — [U] (your message).
2. "Sections 3, 6 and 7 therefore adjudicate framing, not admission." — [I] (structural consequence I drew). Not established by source.

**§1:**
1. "The current interface is a record retrieval tool: it answers 'show me records matching these codes and this text.'" — [S→I]: capabilities stated (filtered search + full-text); the label "record retrieval tool" is my characterization. I'll call it [I] over [S] foundation — mark MIXED.
2. "It answers that well —" [I] evaluation. "point lookups by tail" [S: `tail` filter]. "part-level queries across the fleet" [S: `part` filter; "across the fleet" I]. "condition codes (corroded, cracked)" [S: `condition`/`corrosion`/`cracked` filters; the code values I]. "crew-action filters" [S]. "date slicing" [S: `from`/`to`]. "full-text search over Discrepancy" [S]. Overall MIXED, with the "well" evaluation inferred.
3. "It cannot answer, and no filter combination will:" [I] — the filter list is stated and contains no aggregation; absence of aggregation is my inference from the stated interface. Not established.
4. "Aggregation — a tail's history as a timeline; a part's recurrence across tails; a system's reporting volume over years." [I] proposal. Not established (as existing absence — well, the absence is inferred; the desirability is mine).
5. "Extraction — anything from free text, which is where ~85% of location information (1,496,585 of 1,757,828 records) lives, along with most descriptive detail." — count [S] (1,496,585 / total; the ~85% and division are arithmetic). "along with most descriptive detail" [I]. "extraction absent" [I].
6. "Framing — what an SDR is, what a report does and does not mean." [I] absence inferred.
7. "The database contains the antidote to its own misreading (HowDiscoveredCode shows most findings are caught during scheduled inspection) and never surfaces it." — [I] and specifically NOT established: source lists HowDiscoveredCode but gives no distribution. "never surfaces it" [I]. This is a key flag.
8. "Citation — record IDs, reproducible query URLs, export." [I] absence inferred. Wait — is there a record ID? The source doesn't mention an ID column. 76 columns listed "those with values in most records" — the listed columns don't include an explicit ID. Hmm! My §5 build 6 says "record IDs on everything" and §8 requires export preserves IDs. The source's column list doesn't show an ID field. It says "Columns, 76 in total. Those with values in most records: [list]". So there could be an ID among the 39 unlisted columns — unknown. Flag: existence of a record ID is NOT established; UNKNOWN-NEEDS-PROBE. Good catch for the audit. Actually in the first-turn prompt I wrote "Every derived view must link back to raw records (record IDs / reproducible query URLs)" — my own invention. And query URL reproducibility: the API has named filter params (stated), so canonical query URLs are constructible [S-based]. Record IDs: unknown.
9. "For journalists this is not a feature; it is the product." [I] rhetoric.
10. "Every proposal below must add aggregation, extraction, or framing — not another filter." [I] my rule.

**§2:**
Header claim: jobs tagged [EVIDENCED] — the audit must say: even [EVIDENCED] tags meant "implied by stated interface features," and user needs are nowhere stated in the source; the source states only the three user groups. So all jobs and all stakes: [I]. Some rest on stated features (tail filter, JSON API, export? — export is NOT stated! The interface is search; export isn't mentioned. Journalist job 1 "citable raw records" and researcher job 2 "bulk export" rest on assumed export capability. Flag: export not established as existing; it's what I propose to build.)

Let me enumerate §2 sentences compactly:

Journalists:
1. "Reconstruct a tail's report history around a date of interest, with citable raw records." [I] — enabled by stated `tail`/`from`/`to` filters, but the need itself is not established. Stakes (legal exposure, story accuracy) [I].
2. "Test whether a defect described in one report recurs across the type or across operators (the filters imply this job; nothing aggregates it)." [I] — "the filters imply" is my reading; not established as a need.
3. "Verify or rebut a claim — 'no prior reports,' 'this was addressed.'" [I].
4. "Extract structured data from free text at scale... Stakes: exclusivity." [I].
5. "Read an operator's reporting character before writing about their numbers." [I].
6. "Quote jargon accurately... without over-claiming." [I].

Researchers:
1. "Reproducible queries with documented limitations (the JSON API's existence implies the job)." [I]; JSON API [S].
2. "Bulk export of filtered sets with IDs preserved." [I]; export capability not established.
3–6. cross-tabs, time series, normalization, repeat-finding: [I].

Relatives:
1. "'Tell me about the plane.'" [I].
2. "Calibrate: are these reports alarming or routine?" [I]. The "a report is a finding that was caught" need: [U] (your amendment asserts the principle; the need for it framed is implied).
3. "Distinguish findings caught in scheduled inspection from findings that surfaced in service" [I] — depends on unverified distribution too.
4. "Know the boundary — no accidents, no causes here — and where those records live (NTSB)." — boundary: [S] (dataset lacks accidents and causes) + [U]; NTSB as where they live: [I], external knowledge, not established by source.
5. "Something to hold: printable, dated, linked to raw records, shareable." [I].
Closing: "These groups share one interface with conflicting needs..." [I].

**§3:**
- "Directly supported: Tail history timeline from structured fields (dates, operator, part, condition, discovery code, crew action, times/cycles at filing, verbatim text, record ID)." — fields [S] except record ID [I/unknown]. The feasibility judgment [I].
- "Part-number recurrence across tails. Discovery-code distributions. Export and citation." — PartNumber [S]; distributions computable [I]; export [I].
- Reframings: the four fixed statements — [U] for "defect caught," "no accidents," "no causes," "absence ≠ safe." The question examples ("How safe was this tail?", "Was my flight safe?") [I] invented.
- "Operator comparison → reporting volume and character, never ranking; 2,732 of 3,945 (3,945 − 1,213) resolve to no name" — arithmetic on [S] numbers; "shown honestly" [I].
- "'Most common defects on type X' → 'most commonly reported findings,' with discovery mix attached" — [I].
- "Free-text locations → 'probable zone, extracted,' always echoing the verbatim span" — [I].
- "Trends → reporting volume, never prevalence" — [I].
- Unsupported list: cause — [S] (dataset does not contain cause). "What caused the crash?" [I invented]. "Was my flight safe?" [I]. "Most dangerous airline/type" [I]. Accident lookup — [S] absence. "AD/recall status — not in this dataset" [I by absence — the source doesn't mention ADs; I inferred absence from the column list. Reasonable but inferred].
- "Per the operator's decision, the tail lookup itself sits in directly supported; the design burden shifts entirely to framing (builds 1, 7, 8; §9)." — [U] + [I] structure.

**§4:**
- "AircraftSerialNumber as durable identity. Tail numbers get reassigned; a tail known from news coverage may miss earlier history." — SerialNumber field [S]; reassignment [I] external knowledge, not established (correctly flagged UNKNOWN-NEEDS-PROBE at the time).
- "Join records by serial; surface 'also operated as N____.'" [I].
- "HowDiscoveredCode as the framing field... Scheduled-inspection findings vs in-service findings is the single most important context" — field [S]; the importance claim and the scheduled/inservice dichotomy [I]; distribution unverified.
- "AircraftTotalTime/Cycles per record. Gives each report a within-tail position ('filed at 45,210 hours')" — fields [S]; interpretation [I]; the example number invented.
- "Fuselage/WingStation fields, CrackLength, NumberOfCracks, CorrosionLevel. Structured aging-aircraft data; highly citable; currently buried behind filters." — fields [S]; "aging-aircraft" framing [I]; "buried" [I from filter-list absence: station fields are not among the stated filters — that's stated-by-listing, my characterization].
- "PartNumber exact-match recurrence... needs no LLM." [I].
- "DifficultyDate vs SubmissionDate. Filing lag" — fields [S]; "filing lag" reading [I] (straightforward but mine).
- "The 1.5M free-text-only locations... largest single extraction opportunity in the dataset." — count [S]; superlative [I].

**§5:** Each build is [I] (proposal). Within rows:
- Field lists: [S].
- "None — fully deterministic" (builds 1, 4, 6, 8 LLM roles): [I] design claims.
- "data coverage, not generation" [I].
- Harm mechanisms: [I].
- "codes not in those tables display raw per dataset convention" (build 8): [S] — "Codes not present in those tables are displayed as the code."
- "Fails on abbreviation ambiguity (FS/FR/WL/STA)" (build 3): [I]; only "FR" and "O/B", "NR", "RH" appear in the stated examples; FS/WL/STA not in source.
- "dash-variant part numbers" (build 4): [I], external.
- Effort S/M/L: [I].
- Kill-probes: [I].
- Capability mapping paragraph: capabilities [S] (structured output, function calling, context caching, reasoning tiers, streaming; 1M context). Mappings/decisions [I]. "per-record payloads are tiny" [I] (three short examples stated; overall length distribution unknown). "cache the JASC/part vocabulary" [I] (JASCCode stated; lookup tables stated to exist for coded fields — but whether JASC is among them: the source says "Coded fields resolve against FAA lookup tables" and JASCCode is plausibly a coded field [I]). "image/video inputs unused" [I] decision.

**§6:**
1. "Safety scores... No denominators, no outcome data." — denominators [S] (no fleet size/flying hours); "no outcome data" [S] (no accidents; arguably [S]). "Any score is noise wearing a number" [I]. "litigation magnet" [I].
2. "'Most dangerous airlines' leaderboard. Same missing denominator, plus the reporting-culture confound: an operator filing 4,000 reports may be the diligent one." — denominator [S]; reporting-culture confound [I] — not established; source says nothing about why volumes differ. (Note: the word "voluntary" never appears in source; I introduced it in the prompt. Flag here.) "The single most quotable-and-wrong artifact" [I]. "Refused; operator pages (build 9) exist as the honest substitute" [I].
3. "Automated accident linkage... every journalist arrives via a crash." — arrival hypothesis [I], not established. "tails get reassigned" [I]. "will link the wrong airframe with total confidence" [I].
4. "Cause inference... The field records what a filer found, not what an investigation concluded." — cause absence [S]; the characterization of Discrepancy [S] ("free text written by the person filing" + record definition); "will be quoted as fact" [I].
5. "Open-ended chat... 1M context makes it trivially buildable" — capability [S]; "trivially" [I]; "maximally dangerous" [I].

**§7:**
- "MVP: builds 6 + 1 + 8 + limited 2." [I].
- "Build 6 is the trust substrate and the cheapest thing on the list" — cheapest [I].
- "Build 1 is the one surface all three groups need" [I].
- "It is deterministic — zero generation risk" [I].
- "Build 8 is the framing engine with no LLM involved: the database's own discovery codes refute the misreading of volume" — no-LLM [I]; "refute the misreading" depends on unverified distribution — NOT established. Key flag.
- "Build 2 is the only generated content in v1: record-scoped, schema-constrained, abstaining" [I].
- v1 scope list — [I]; "serial-identity note if P1 confirms" [I]; "gloss on vocabulary-covered records only" [I].
- Exclusions and sequence — [I].

**§8:**
- All probes, sample sizes, bars: [I]. "25 tails across report-count deciles" [I]. "500 serials" [I]. "300 records stratified across 6 JASC systems × 2 decades" [I] (1995–present [S]; "2 decades" roughly derivable but the stratification is mine). Adversarial set [I]. Pass/fail bars [I]. Per-group probes [I]. "one tail with zero reports and one with 1,000+" — whether zero-report tails exist is unknown [I] (64,580 records state no location, but a tail with zero records? 54,634 tails over 1.75M records — average ~32 records/tail, so zero-report tails plausibly exist [I]).

**§9:**
- Behavior rules: [I] proposals, some grounded: "verbatim primacy" [I]; "causality ban... enforced in the gloss schema" [I]; numbers discipline [I]; canonical URLs [I based on stated filter params]; abstention [I]; NTSB bridge [I].
- Copy blocks: 
  - "A report is written when a mechanic or operator finds a component that has failed, is malfunctioning, or is not up to standard" — near-paraphrase of [S] record definition; "not up to standard" slightly beyond "found defective" — minor [I].
  - "most often during a scheduled inspection" — NOT established. Key flag.
  - "Each entry here describes a problem that was found." — [U].
  - "What this database does not contain: accident records, and the cause of anything reported here." — [S]/[U].
  - "Report counts differ between aircraft for many reasons — fleet size, how an aircraft is used, how diligently an operator files." — [I]; the specific reasons are not established; only the absence of fleet size is [S].
  - "More reports do not mean a less safe aircraft." — converse extension [I]; one direction [U]. (Though logically supported by "write-ups are defects caught," the sentence as such goes beyond the stated amendment.)
  - "Fewer reports do not mean a safer one." — [U] (restates "absence of reports is not evidence of a safe aircraft").
  - Zero-report copy: core [U]; "Many aircraft generate few or no reports here" [I — unverified].
  - Gloss label [I].
  - Recurrence copy: "does not by itself indicate a shared cause" [I, consistent with S cause-absence]; "Determining cause is the role of the FAA and NTSB" [I external].

Also the §3 line "What IS visible is maintenance reporting on a tail before an accident" — did I write that in the executed answer? Checking... In the executed answer §3 unsupported: "Accident lookup — the dataset does not record accidents; redirect." No "before an accident" claim. OK. But §2 journalist job 1: "Reconstruct a tail's report history around a date of interest" — neutral. Good.

One more: §1 "most descriptive detail" living in free text — [I].

Also "HowDiscoveredCode populated in ≥80%" (P0 pass bar) — bar invented [I].

Also §8 P3 threshold "<30% mappable → kill" [I].

Also the claim in §5 build 3 row: "~1.5M records" — [S: 1,496,585].

Also §5 build 8: "Unmapped-code rate on 1,000 records; <10% → ship" [I].

Also §5 build 9: "≥70% candidate precision or raw-code-only" [I].

Also §7 "wrong-name harm until P5 passes" [I].

Also "NTSB bridge" as "static module on every tail page" [I].

Format: I'll produce a section-by-section audit. For length control, I'll quote each sentence in condensed form (short quotes), with tag and one-line note for [I] items. Use tables per section? Tables with three columns (Claim (condensed) | Verdict | Note) could be very compact. Given the sentence count (~100+), tables are the right call. The system prompt formatting guidance: markdown is fine for this interface; the user is technical and asked for a systematic audit; tables compress.

But careful: tables with long text get unwieldy. I'll keep claim text as short quotes/paraphrases. For sections with many homogeneous inferences (§2 needs, §5 builds, §8 probes), I can make blanket statements with a table of exceptions rather than row-per-sentence, since the user's core need is to know what's grounded vs. not — and blanket-covering "everything in §8 is my design" satisfies honesty while noting which underlying facts are stated. The instruction says "each sentence" — I should be careful not to skip. Compromise: for each section, first a line covering the wholesale-inferred material, then row-level treatment of any sentence that contains a stated fact or a load-bearing/unverified claim. That achieves full coverage without 150 table rows of "mine."

Actually, let me reconsider — the user may specifically want to catch fabrications. The highest-value output flags: (1) HowDiscoveredCode distribution claim (appears in §1, §2, §7, §9 copy) — unverified, load-bearing for build 8 and the framing copy; must be verified via API probe before any "most findings are caught in scheduled inspection" language ships. (2) "Voluntary filing"/reporting-culture — introduced by me, not in source (and not even accurate as a universal claim in the real world). (3) Tail reassignment — external. (4) NTSB references — external. (5) Record ID existence — unknown (76 columns; listed 35ish; ID may or may not exist among unlisted columns). (6) Export existence — not established. (7) The converse absence sentence. (8) Reasons list in framing copy. (9) "Every journalist arrives via a crash." (10) Per-record payload "tiny." (11) Part-condition values (corroded/cracked). (12) JASC in lookup tables. (13) "most descriptive detail" in free text.

Also positive: which load-bearing things ARE stated: cause absence, accident absence, no denominators, counts, filter list, model capabilities, the four amendment principles.

Structure of my answer:
1. Method note (brief): what counts as source — SOURCE MATERIAL block = [S]; your amendment = [U]; everything else = [I] and "not established by the source." Note on wholesale sections.
2. Section-by-section audit tables/lists.
3. Closing: the consequential inferences — ranked list of claims that are load-bearing but unverified, with what would verify each. Especially the HowDiscoveredCode one, which I should own clearly: I asserted a distribution I don't have; the framing copy "most often during a scheduled inspection" must not ship without the P0-style distribution check; build 8's rationale ("refute the misreading") needs the actual distribution and might need rewording to be distribution-free (e.g., show the mix, don't claim the majority).

That last point is a genuine improvement: build 8 can be made to work WITHOUT the unverified claim by displaying the actual discovered-code mix for whatever is on screen ("X of these reports were filed during scheduled inspection, Y in service") rather than asserting a global "most." That's a fix worth offering at the end. Also the "antidote" logic holds as long as the mix is shown; if the mix turned out mostly in-service, the framing would need to change — showing the mix is the honest invariant. I'll add that as a correction, since an audit that finds an error should say what to do about it.

Also one more: in §1 I said "HowDiscoveredCode shows most findings are caught during scheduled inspection" — in the real world, SDRs are dominated by findings during maintenance/inspection, but that's domain knowledge, not source. Own it as: plausible domain prior, not in source, must be verified.

Also the "record ID" issue affects build 6 and §8 round-trip tests: if no ID column exists, citation must use composite keys (tail + date + part + serial or a hash). Worth a correction note.

Also export: interface is stated as search + JSON API; export is buildable from the API, so "export" as a build is fine, but §2 researcher job 2 tagged [EVIDENCED] overstated — the API implies data access, not an export feature. Own it.

Length: aim for thorough but tight. Tables per section. Maybe ~1,800–2,600 words. Let me draft.

Tag legend:
- **[S]** — stated in the SOURCE MATERIAL block.
- **[U]** — stated in your amendment (your message). Not in the source block; authority is your decision, not the data.
- **[I]** — inferred by me. Not established by the source.

For mixed sentences: tag the components.

Now write.

Section 1 audit:

| Sentence (condensed) | Verdict |
1. "Interface is a record retrieval tool answering code+text matches" — [S] for the capabilities (filtered search over coded fields; full-text over Discrepancy — stated); the label is my characterization [I]. I'll mark MIXED.
2. "It answers that well — point lookups by tail, part queries, condition codes (corroded, cracked), crew-action filters, date slicing, full-text" — filter names [S]; "that well" [I]; the specific condition values "corroded/cracked" [I] (filters named; code values not given).
3. "It cannot answer: Aggregation" — [I]. The stated filter list contains no aggregation parameter; absence inferred from that list. Not established.
4. "Extraction... where ~85% of location information (1,496,585 of 1,757,828) lives" — counts [S]; ~85% arithmetic on stated counts; "most descriptive detail" in free text [I]; extraction absent [I].
5. "Framing absent" — [I].
6. "The database contains the antidote... HowDiscoveredCode shows most findings are caught during scheduled inspection" — [I], NOT ESTABLISHED: source gives no HowDiscoveredCode distribution. Flag.
7. "and never surfaces it" — [I].
8. "Citation — record IDs, reproducible query URLs, export" — [I] except: the named filter parameters are [S] so constructible URLs are grounded; record ID existence unknown — the 76 columns include unlisted ones; no ID column among those listed. Not established. Export not established.
9. "For journalists this is not a feature; it is the product" — [I].
10. "Every proposal must add aggregation, extraction, or framing" — [I], my rule.

Section 2: wholesale note: the source states the three user groups and nothing about their jobs, stakes, or arrival contexts. Every job, every stake, every "arrives via" is [I]. My [EVIDENCED] tags meant "implied by stated interface features" — that is my inference about implication, not a stated need; the tagging overstated grounding. Then list which stated features anchor which jobs: `tail`+`from`/`to` (job 1 anchor [S]), JSON API [S] (researcher job 1 anchor), part/jasc filters [S]. Stakes all [I]. Relatives' items: boundary facts [S]+[U]; NTSB as the place accident records live [I — external; not in source]. Amendment-grounded items: "absence ≠ safe" need [U]; "defect caught" principle [U].

Section 3:
- Timeline fields [S] except record ID [I/unknown].
- 2,732 = 3,945 − 1,213 [S arithmetic].
- The four fixed statements [U] each.
- Invented user questions [I].
- Unsupported items: cause absence [S]; accident absence [S]; AD/recall absence [I — inferred from column list; source never mentions ADs].
- "Hedged mechanism line will be quoted as fact" [I prediction].
- "Design burden shifts to framing" [U] (you directed it) + [I] (which builds carry it).

Section 4:
- Serial identity: field [S]; reassignment [I external]; probe correctly framed as UNKNOWN-NEEDS-PROBE.
- HowDiscoveredCode framing: field [S]; "single most important context" [I]; scheduled-vs-in-service dichotomy [I].
- Within-tail position: fields [S]; interpretation [I]; example hours invented.
- Station/corrosion fields [S]; "aging-aircraft" [I]; "buried behind filters" [I] — grounded in the fact that the stated filter list omits station fields; the filter list is [S], the characterization mine.
- Filing lag [I].
- "Largest single extraction opportunity" [I superlative over [S] count].

Section 5: wholesale: all ten builds are [I] proposals. Grounded atoms: field names [S]; "codes not present in tables are displayed as the code" [S] (build 8 row); "~1.5M records" [S]; capabilities [S]. My assertions to flag within rows: failure-mode speculations (abbreviation sets FS/WL/STA — not in source; only RH/O/B/NR/FR appear in the three stated examples); "dash-variant part numbers" [I external]; "per-record payloads are tiny" [I — only three short examples given]; JASC-in-lookup-tables [I]; harm mechanisms [I]; effort ratings and kill-probes [I]. "Fully deterministic — zero generation risk" [I design claim].

Section 6:
1. Denominator absence [S]; "no outcome data" [S via no-accidents + no-cause]; "noise wearing a number," litigation [I].
2. "Reporting-culture confound: an operator filing 4,000 reports may be the diligent one" — [I]. Not established; the source says nothing about why volumes differ. Note: I also introduced "voluntary filing" in the original prompt; that word appears nowhere in the source.
3. "Every journalist arrives via a crash" [I]; "tails get reassigned" [I external]; "wrong airframe with total confidence" [I].
4. Cause absence [S]; Discrepancy characterization [S]; "quoted as fact" [I].
5. 1M context [S]; "trivially buildable," "maximally dangerous," "uncontrolled framing event" [I].

Section 7: everything [I] except: the four amendment principles underpinning it [U]; the arithmetic [S]; and the flag that "build 8... the database's own discovery codes refute the misreading of volume" depends on the unverified distribution — NOT established; must be repaired (see corrections).

Section 8: all probes, sample sizes, stratifications, thresholds, pass bars [I]. Anchors: 1995–present [S]; JASC [S]; serial/tail fields [S]. "A tail with zero reports" — existence unknown [I] (54,634 tails / 1,757,828 records — average ~32; zero-report tails plausible but unverified). Round-trip tests assume record IDs exist [unknown].

Section 9: rules [I] as proposals. Copy audit line by line:
- Record definition sentence: near-paraphrase of [S] ("fails, malfunctions or is found defective"); "not up to standard" is my gloss [I].
- "most often during a scheduled inspection" — [I], NOT ESTABLISHED. Must not ship without a distribution check; remove or replace with the actual computed mix.
- "Each entry here describes a problem that was found" — [U].
- "does not contain: accident records, and the cause" — [S]/[U].
- "Report counts differ... for many reasons — fleet size, how an aircraft is used, how diligently an operator files" — [I]: the specific reasons are mine; only the absence of fleet size is [S].
- "More reports do not mean a less safe aircraft" — [I]: converse extension; you stated only the absence direction [U].
- "Fewer reports do not mean a safer one" — [U].
- Zero-report copy: core sentence [U]; "Many aircraft generate few or no reports here" [I unverified].
- Gloss label [I].
- Recurrence copy: first sentence [I, consistent with the [S] cause-absence]; "Determining cause is the role of the FAA and NTSB" [I — external; not in source].

Closing corrections (highest-value):
1. HowDiscoveredCode distribution — asserted twice (§1, §7) and embedded in framing copy (§9). Repair: replace the global claim with a computed, on-screen mix ("N of these M reports were filed after discovery during scheduled inspection; N in service") — the overlay then works whatever the mix is, and the "antidote" logic no longer depends on my unverified prior. Add distribution check to P0.
2. Record IDs — unverified; if absent, citation keys must be composite (tail + serial + DifficultyDate + PartNumber + offset) or a deterministic hash; add to P0.
3. "Voluntary filing" — my word, not the source's; drop the claim, keep only what's supportable: volumes differ and the dataset contains no denominator or reporting-behavior measure. (Even "diligent filer" is speculation.)
4. NTSB — all references are external knowledge; verify the correct agency/URL before any bridge ships. (It is correct in the real world, but it is not in the source material.)
5. Converse sentence — either verify you want both directions or restrict copy to the stated one.
6. Export and record IDs in §2 tags — my [EVIDENCED] tags overstated; re-tag all needs as inferred-from-features.

Also note the one thing the audit vindicates: the §4/§8 UNKNOWN-NEEDS-PROBE discipline (serial identity, P1) was applied where I knew I was on external ground — but this audit found several unflagged external claims, so the discipline was applied inconsistently. Honest note.

Formatting: I'll use short section headers matching the previous answer's numbering, tables or tight lists. Keep quotes short. Bold the flags. End with "Corrections" — concrete edits to the previous answer. This satisfies "for anything inferred, say it is not established by the source" — I'll use a consistent phrase "not established by the source" for [I] items, at least in the note column or as a blanket statement per section plus per-item flags. To avoid writing "not established by the source" 100 times, I'll state the convention once: every [I] below is not established by the source; notes explain what the inference rests on and flag the load-bearing ones. That honors the instruction efficiently while being explicit.

Length check: this will be long but the task demands it. Aim ~2,200 words. Use tables where they compress (§1, §3, §4, §9), tight lists elsewhere.