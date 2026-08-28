The user has a dataset of FAA Service Difficulty Reports (SDR), an existing search interface, and a model (GLM-5.3-Flash) available to build on. They want a prompt they can use to work out what to build for three user groups: investigative journalists; researchers and safety analysts; relatives of people who died in aviation accidents.

So the deliverable is a prompt — a well-crafted prompt to feed to the model (or perhaps to use in a discovery/planning process) that will help work out what to build on this dataset for these users.

Let me think about what makes a great prompt for this task.

The prompt should:
1. Give the model the full context (dataset, constraints, existing interface, model capabilities, users).
2. Frame the task: discovery of what to build — not jump to features. It should force grounding in the data's actual affordances and limitations.
3. Handle the ethical sensitivity — especially the "relatives of people who died in aviation accidents" user group. This is delicate: SDRs are pre-accident/pre-incident maintenance reports, not accident records. Relatives may come hoping to find something about the crash that killed their loved one — but the dataset doesn't record accidents and doesn't contain causes. A naive product could mislead grieving people into thinking a defect report "explains" the accident. This is a crucial design tension the prompt should force the model to confront. Also safety-critical misinformation risk: journalists might over-interpret correlations as causes.
4. Force honesty about data limitations: no fleet size denominators (can't compute rates), no causes, no accidents, survivorship/underreporting biases, free-text noise, operator designators that don't resolve (3,945 designators but only 1,213 resolve to names — meaning operator aggregation is unreliable), etc.
5. Ask for a structured output: e.g., user needs → jobs-to-be-done → candidate builds ranked → risks → validation plan → what NOT to build.
6. Possibly ask the model to interrogate the data — since the model has a 1M token context and file input, the prompt could instruct it to request or examine sample records, or propose data probes to validate feasibility before committing to a build. Actually, a good approach: a two-phase prompt — Phase A: questions and data probes; Phase B: proposals. Or instruct the model to first list critical unknowns that must be tested against the data before designing.

Let me think about what the actual discovery question is. "Give me a prompt to work out what to build on this dataset for these users." So the prompt's job is to help the person (the product owner / developer of aircraftdefects.com) figure out what to build. The prompt should elicit:

- Deep understanding of each user group's actual goals and the emotional/practical stakes.
- Mapping from dataset affordances (what the data can and cannot support) to user needs.
- Identification of "traps" — things users will want that the data can't deliver (e.g., "is my flight safe?" — can't answer; "what caused the crash?" — can't answer; "which airline is most dangerous?" — can't compute rates without fleet hours).
- Candidate builds (products/features) evaluated against criteria: feasibility with the data, value per user group, harm potential, effort.
- Prioritization and a recommended path, with rationale.
- Specific data probes to run before building (e.g., check how many records for a given tail number across time; test whether Discrepancy text contains crash-adjacent language; test whether JASC codes cluster usefully).

Also worth including in the prompt: the model's own capabilities (GLM-5.3-Flash) since builds can leverage LLM features — e.g., free-text parsing of Discrepancy into structured fields (part, location, condition, action), entity resolution of operator designators, summarization, natural-language query interface, timeline narratives per tail number, clustering recurring defects across fleets (same part across different tails/operators — a signal journalists love), alerting/digests. The model has function calling and structured output, so agentic query-over-API features are feasible. Context caching for repeated large docs. But the prompt should not pre-decide the answer; it should ask the model to reason about which model capabilities map to which needs.

However — the user asked for "a prompt to work out what to build." So the prompt is the artifact. I should write the prompt itself, possibly with a brief note on how to use it. The prompt should be self-contained: include all source material facts (so the model doesn't need the user to re-supply), instructions, constraints, output format.

Key design principles for the prompt:

1. Role/framing: "You are a product strategist / research engineer working with..." Maybe better: frame as a rigorous product discovery exercise with a skeptical engineer mindset.

2. Ground truth: restate the dataset facts verbatim-ish. Important numbers: 1,757,828 records; 54,634 tails; 3,945 operator designators, only 1,213 resolve to names; 76 columns, the listed high-coverage ones; free-text Discrepancy; crew action counts; location coverage (196,663 numbered zone; 1.49M text-only; 64,580 none); existing filters; no fleet size/hours, no cause, no accidents.

3. Hard constraints / honesty requirements:
   - No denominators → no rates, no "most dangerous airline" rankings. Any feature implying per-operator safety comparisons is off-limits or must be framed as "report counts, not rates," which is itself fraught.
   - No causes → correlational narrative only; must not imply causation.
   - No accidents → relatives searching a crash will not find the crash; they may find prior maintenance reports for the same tail — which is actually a legitimate, powerful, and sensitive use: "was this aircraft reporting defects before the accident?" That's exactly what journalists do after crashes. So there is a real, valuable feature: tail-number history timeline. But it must be designed with care: the reports predate the accident but do not explain it. Language matters. Should there even be a pathway for relatives? Maybe yes, with careful framing and signposting to NTSB records for accident info. The prompt should make the model wrestle with this: build for relatives or not, and how.
   - Reporting bias: SDRs are voluntary, reporting culture varies wildly by operator; counts reflect reporting behavior as much as fleet condition.
   - Free-text noise: abbreviations, typos, inconsistent terminology.

4. User groups — force persona-level need analysis with jobs, current workarounds, emotional stakes, and failure modes. E.g.:
   - Journalists: post-accient tail history; pattern detection across operators/aircraft types; trend over time; FOIA-complement; need citations/export, verbatim quotes, verification (link back to raw record), ability to check "has this happened before?"
   - Researchers/analysts: bulk export, reproducible queries, API, coded-field cross-tabs, time series, normalization of free text, cohort definitions, limitations documentation.
   - Relatives: find a tail number, see its history in plain language, understand what the records do and don't mean, avoid false hope/false blame; need gentle UX, glossary translation of jargon (JASC codes, mechanic abbreviations), and explicit "this is not the accident record; go to NTSB."

5. The prompt should demand that the model separate "what the data supports" from "what users want," and propose builds at the intersection — plus explicitly list the seductive-but-unsupported ideas to refuse or reframe.

6. Ask for data validation probes: before committing, list concrete queries against the existing API to test feasibility of each proposal (e.g., "pull all records for tail N123AB ordered by date — does the timeline read coherently?"; "sample 200 Discrepancy texts containing 'CORROSION' + a fuselage station — can a model extract station ranges reliably?"; "how many distinct JASC codes appear; are they stable over time?").

7. Output format: structured, e.g.:
   - Section 1: Need analysis per user group (top 3–5 jobs each, evidence/assumption tagged).
   - Section 2: What the data can/cannot support (capability map).
   - Section 3: Candidate builds (5–10), each with: description, users served, data reliance, model reliance, harm risk, effort, evidence needed.
   - Section 4: Explicit rejections/reframes (the tempting-but-wrong ideas).
   - Section 5: Recommended priority with rationale and MVP definition.
   - Section 6: Validation probes (API calls / sample checks) and success metrics.
   - Section 7: Ethical guardrails and copy/UX language rules (e.g., required disclaimers).

Maybe also: "Ask clarifying questions first" vs "state assumptions." For a one-shot discovery prompt, better to instruct: "If information is missing, list assumptions explicitly rather than stalling." Or two-stage: first output unknowns and probes, then wait. Given the model has 1M context and the user might paste data samples, I could design the prompt to optionally accept sample records. I'll include a slot: "[Optional: paste N sample records here — including the three verbatim examples — so the model can ground its analysis]". Actually the three verbatim examples are already in the source; I can include them in the prompt as grounding.

Also the prompt should exploit model capabilities: instruct the model to consider which GLM-5.3-Flash features (long context to read many raw records; structured output for extraction pipelines; function calling for agentic querying of the live API; context caching for repeated large corpora; reasoning levels for analysis vs cheap extraction) enable which builds — and to be honest about failure modes of LLM features (hallucinated extractions on noisy free text; need for confidence thresholds and human verification, especially given journalism and grieving-relatives contexts).

Tone constraints: the prompt should require calibrated language, no causal claims, no safety rankings, uncertainty disclosure.

Length: This should be a thorough prompt but usable. The user gave dense source material; the prompt should embed the essential facts. I'll aim for a well-organized prompt of maybe 700–1100 words of prompt text, with a short preamble explaining usage. Format: a code block for the prompt so it's copy-pasteable? A fenced block makes copying easy and clearly delimits the artifact. Yes — put the prompt in a markdown code block. Inside, use plain structure with headers. Should I use XML tags? Plain markdown headers inside the block are fine and model-friendly.

Before/after the block: brief framing — one or two sentences on how to use (paste as-is; optionally append sample records; the prompt forces probes before building). Keep surrounding prose minimal per instructions about not bloating.

Let me draft the prompt content.

---

PROMPT DRAFT

Role:
You are a senior product strategist and data engineer advising the operator of aircraftdefects.com, a public search interface over FAA Service Difficulty Reports (SDRs). Your task is to work out what to build next. You must ground every proposal in what this specific dataset can and cannot support, and in what each user group actually needs. Be skeptical, concrete, and specific. Do not propose features the data cannot honestly deliver.

Context — the dataset:
[embed the facts]

Context — what's already built:
[filters + API facts]

Context — the build tool:
GLM-5.3-Flash: [capabilities]. Consider which of these genuinely enable a feature and which are decoration.

The users (treat as distinct, with distinct stakes):
1. Investigative journalists — [probe: what jobs? e.g., after a crash, reconstruct a tail's defect history; find recurring defects across a fleet/type; find operator underreporting... ]
2. Researchers and safety analysts — [reproducibility, export, cross-tabs...]
3. Relatives of people who died in aviation accidents — [sensitive; the dataset does NOT record accidents; they will arrive looking for answers the dataset cannot give; risk of harm through misinterpretation; also possible genuine value: seeing the aircraft's prior maintenance history, translated into plain language]

Hard constraints:
- No denominators (no fleet size/flying hours) → you cannot compute defect rates; you cannot rank operators by safety; any design implying that is banned. Counts are reporting counts, not risk.
- No causes → never imply causation; post-accident tail histories show what was reported before, not why the accident happened.
- No accident records → crash-related queries will not match; design must not pretend otherwise.
- Reporting bias: SDR filing is voluntary and reporting culture varies; a busy operator's high count may mean good reporting, not bad aircraft. State this wherever counts are shown.
- Free text is noisy, abbreviated, inconsistent. Any extraction/summarization must handle this and expose confidence and the verbatim source.

Required process (do these in order):
1. Need analysis. For each user group: 4–6 jobs-to-be-done, each tagged [evidenced] (inferable from the data/interface described) or [assumed] (needs user research). Include the emotional stakes for group 3 and verification/citation needs for group 1.
2. Data-vs-need map. Which needs the data directly supports, which it partially supports with rewording/reframing, and which it cannot support. Be explicit about the seductive-but-unsupported ones (e.g., "safest/worst airline," "what caused the crash," "was my flight safe").
3. Candidate builds. 6–10, each: one-line description; user groups served; exact data fields/text relied on; what the LLM does and where it can fail; harm risk (who could be hurt and how); rough effort (S/M/L); the single cheapest validation probe against the existing API that would confirm or kill it.
4. Explicit rejections. List at least 3 tempting ideas you are rejecting or reframing, and why.
5. Recommendation. Pick one MVP (or a tightly scoped sequence). Justify by value-per-risk, not novelty. Define its v1 scope precisely and what is deliberately out.
6. Validation plan. Concrete probes: actual API query shapes to run, sample-size suggestions, pass/fail criteria. Include at least one probe per user group.
7. Guardrails. Required UX copy, disclaimers, and behavior rules — especially for tail-number lookups by relatives and for any aggregated "trend" view journalists might quote. Specify wording that is accurate without being cold or alarming.

Model-capability discipline: for each proposed build, name the specific GLM-5.3-Flash features used and justify; prefer structured output + function calling against the existing JSON API over vibes; if an extraction task is proposed, specify how quality would be measured against ground truth (e.g., hand-labeled sample of N records) before shipping.

Calibration rules: no causal language; counts framed as reports filed; uncertainty shown; every derived claim traceable to raw records (record IDs / query URLs) so a journalist can verify.

Output: structured markdown matching the process above. If something is unknowable from the given material, mark it UNKNOWN-NEEDS-PROBE rather than guessing.

---

That's the skeleton. Now let me refine details and make sure I embed the source facts accurately:

- 1,757,828 records, 1995–present, published by FAA, held at aircraftdefects.com.
- 54,634 aircraft by tail number.
- 3,945 operator designators; 1,213 resolve to a name from FAA lists. → implication: operator aggregation incomplete; 2,732 designators unresolved.
- 76 columns; the high-coverage list.
- Discrepancy: free text by filer; examples (include verbatim).
- Coded fields resolve to FAA lookup tables; unknown codes displayed as code.
- Crew action counts (include them — they're useful signals: e.g., 112k unscheduled landings is a hook for journalists).
- Location coverage: 196,663 numbered zone; 1,496,585 text-only; 64,580 none → implication: location analysis requires free-text extraction for most records — an obvious LLM opportunity, but noisy.
- Existing interface: filters q, operator, make, model, tail, part, condition, stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from, to. JSON API, no auth.
- Not in dataset: fleet size, flying hours, cause, accidents.
- Users.
- Model capabilities: video/image/text/file input; text output; 1M context; 128k max output; 320B/18B active MoE; sparse+linear attention (3.01x attention compute reduction, 4.44x KV cache) — relevant: cheap long-context reading; reasoning always on at low/high/max; function calling; structured output JSON schema; context caching; streaming + tool streaming.

I should note in the prompt that image/file input means the model could, e.g., parse scanned FAA lookup tables or screenshots — but maybe keep capability discipline: ask the model to justify each feature used.

Also: the prompt should tell the model what "build" means — features on the site? New pipelines? Alerts? Reports? Leave broad but bounded to this dataset + interface + model.

One more thing: should the prompt instruct the model to ask clarifying questions first? A hybrid: "First, if any blocking unknowns, list them as UNKNOWN-NEEDS-PROBE and continue with stated assumptions." That keeps one-shot usability.

Also good: instruct the model to reason about the tension between the three user groups sharing one interface (journalists want density and rawness; relatives want plain language and care; researchers want export). Does the recommendation split audiences or unify? Make it answer that.

I'll also add a short instruction about tone of the output itself: decisive, no filler, no generic product-school language.

Length of prompt: aiming for completeness but not bloat. I think ~900–1200 words inside the block is right. Use headers and bullets.

Let me also think about whether to include guidance like "consider builds such as X" — no, that would bias the discovery. But I could seed the "data-vs-need" section with the tensions (e.g., location only in free text for 92% of records — extraction is a lever). Hmm — pointing out levers is arguably part of the strategist's job that I'm delegating to the model. Better: instruct the model to identify levers itself ("identify the dataset's untapped affordances: e.g., fields present but unused by the current interface, free-text patterns, cross-record joins by tail/part/operator"). That keeps the prompt from pre-deciding answers while pointing attention productively.

Also include: "Before proposing anything, list what the existing interface already covers, so proposals add value rather than duplicate filters."

And success metrics: for journalists — could a story be verified from the site alone (traceability)? For researchers — reproducibility (shareable query state)? For relatives — does the tail-history page clearly state what SDRs are and are not?

Alright. Also add an optional slot at the top of the prompt: "Optional attachments: paste 20–50 sample records spanning different eras/operators below to ground the analysis; if absent, proceed and mark extraction-quality claims as UNKNOWN-NEEDS-PROBE."

Now the surrounding prose: Keep it short. Maybe 2–4 sentences before the block: what it does, how to use, and one tip (optionally append sample records; run the probes before building). No heavy preamble.

Format decision: single fenced code block containing the prompt in markdown. Headers inside as plain text lines with ## or just capitalized lines — inside a code block, markdown headers won't render but that's fine since it's meant to be copy-pasted to the model; models handle markdown-in-plain-text fine. I'll use markdown syntax inside.

Should I number the sections inside the prompt? Yes, ordered process.

Let me now write the final prompt carefully, embedding facts accurately.

Draft the block:

---

# Role and task

You are a senior product strategist and applied data scientist advising the operator of aircraftdefects.com — a public search site over FAA Service Difficulty Reports (SDRs). Your job: decide what to build next, and what not to build. Ground every claim in the dataset facts below. Be skeptical and specific. If you cannot support a claim from the material given, mark it UNKNOWN-NEEDS-PROBE instead of guessing.

# Dataset facts

- FAA Service Difficulty Reports, 1995–present, published by the FAA, hosted at aircraftdefects.com. 1,757,828 records; 54,634 aircraft by tail number.
- A record is filed by a mechanic or operator when a component fails, malfunctions, or is found defective.
- 76 columns. Highest-coverage fields: [list].
- OperatorDesignator: 3,945 distinct values, only 1,213 resolve to an operator name from FAA lists. Operator-level aggregation is therefore incomplete.
- Discrepancy: free text written by the filer, present in most records. Verbatim examples:
  - "RH MAIN FLAP CARRIAGE NR 2 HAS PITTING IN BOLT HOLE FOR O/B UPPER RUB PAD"
  - "THE PAWL BEHIND THE CREW ENTRY DOOR EXTERNAL HANDLE IS WORN"
  - "CABIN SEAT TRACK FOUND CORROSION AT FR73-FR77"
- Coded fields resolve against FAA lookup tables; codes absent from the tables display raw.
- Crew action codes, whole-dataset counts: unscheduled landing 112,189; aborted take-off 20,438; engine shut down in flight 14,703; emergency descent 8,620; aborted approach 3,902; fire extinguisher fired 2,747; fuel dumped 1,531; oxygen masks dropped 1,168; cabin lost pressure 326; autorotation 130.
- Location: 196,663 records have a numbered zone; 1,496,585 state a location only in free text; 64,580 state none.
- Existing interface: filtered search over coded fields + full-text search over Discrepancy. Filter parameters: q, operator, make, model, tail, part, condition, stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from, to. JSON API, no authentication.

# What the dataset does NOT contain (hard constraints)

- No fleet size or flying hours → no defect rates. You cannot rank operators or aircraft types by safety, and no design may imply it. Counts are counts of reports filed.
- No cause of a defect → no design may imply causation.
- No accident records → someone searching for a crash will not find it here. Prior-to-accident maintenance history for a tail is visible; the accident itself is not.
- Voluntary reporting → filing culture varies by operator; volume differences reflect reporting behavior as much as fleet condition.

# Users

1. Investigative journalists. Likely jobs: reconstruct a tail number's defect history around an accident; find whether a defect pattern recurs across tails of a type or across an operator; verify claims with citable raw records. They need traceability to the underlying record, export, and precise language they can quote without over-claiming.
2. Researchers and safety analysts. Likely jobs: reproducible queries, bulk export, cross-tabs over coded fields, time series, well-documented limitations.
3. Relatives of people who died in aviation accidents. Likely arrive after a crash looking for answers. The dataset cannot tell them why. Risk of harm: misreading a maintenance report as an explanation of the accident; either false blame or false reassurance. Possible genuine value: a careful, plain-language account of what was reported about that aircraft before the accident, with clear boundaries on what it means.

Treat these groups as sharing one interface with conflicting needs: density and rawness (journalists), rigor and export (researchers), plain language and care (relatives). Your recommendation must address whether to split or unify.

# Build tools available

GLM-5.3-Flash. Multimodal input (video, image, text, file), text output; 1M-token context; 128k max output; 320B parameters / 18B active; sparse and linear attention (3.01× attention-compute reduction, 4.44× KV-cache reduction vs GLM-5.3); reasoning always enabled (low/high/max); function calling; structured output to JSON schema; context caching; streaming and tool streaming. Use capability discipline: for each proposal, name the features it actually uses and why; prefer structured output + function calling against the existing JSON API; flag where LLM output could be wrong on this noisy free text and how errors would be caught.

# Required process (output in this order)

1. Existing-coverage audit. What the current interface already answers well, so proposals add value rather than duplicate filters.
2. Need analysis per user group. 4–6 jobs each, tagged [EVIDENCED] (supported by the material above) or [ASSUMED] (needs user research). State emotional and reputational stakes per group.
3. Data-vs-need map. Three buckets: directly supported; supported only with reframing (say exactly what reframing); unsupported. Include the seductive-but-unsupported ideas (e.g., "most dangerous airline," "what caused the crash," "was my flight safe") and say how each must be refused or reframed.
4. Untapped affordances. Fields present but underused by the current interface; cross-record joins the schema invites (tail over time; same part across tails/operators; location from free text for the 92% of records lacking a zone — and the noise risks of extracting it).
5. Candidate builds. 6–10. Each: one-line description; users served; exact fields/text relied on; LLM's role and failure modes; harm risk (who, how); effort S/M/L; the single cheapest API probe that would confirm or kill it.
6. Explicit rejections. ≥3 tempting ideas you refuse or reframe, with reasons.
7. Recommendation. One MVP or tightly scoped sequence. Justify by value-per-harm-per-effort. Define v1 scope precisely, including what is deliberately excluded and why.
8. Validation plan. Concrete probes against the live API: query shapes, sample sizes, pass/fail criteria. At least one probe per user group. Include a labeling-based quality check for any extraction feature (e.g., hand-check N records before shipping).
9. Guardrails. Required UX copy and behavior rules, especially: tail lookups by relatives; any aggregate "trend" a journalist might quote; every derived view must link back to raw records (record IDs / reproducible query URLs). Write example wording that is accurate without being cold or alarming.

# Calibration rules for your output

- No causal language anywhere. Counts are "reports filed," never "incidents" or "failures" as a rate.
- Surface uncertainty; distinguish count of reports from prevalence of defects.
- Decisive, concrete, no filler, no generic product-school vocabulary.

---

Optional slot: "Sample records (optional): paste 20–50 records spanning years, operators, and aircraft types here to ground extraction-feasibility judgments."

Hmm, that's decent. Let me reconsider a few things:

- Should the prompt tell the model about the three example discrepancy texts? Yes — included.
- Should I mention the model can ingest images/files (e.g., FAA lookup tables as PDFs)? The capability discipline item covers it implicitly. Fine.
- Should the prompt be model-agnostic? The user said "Model available to build on: GLM-5.3-Flash" — so the prompt should incorporate it. Yes, included in "Build tools available."
- Should the prompt ask the model to consider cost/latency? Maybe briefly — reasoning always enabled means cheap extraction tasks still pay reasoning cost; the 18B-active MoE mitigates. Could add "note reasoning is always on; tier tasks by reasoning level (low for bulk extraction, high/max for synthesis)" — that's a genuinely useful operational note. Add to capability discipline.

- One risk: the prompt is long. But the user's source material is dense and the task is substantive; a thorough prompt is appropriate. I'll keep surrounding prose minimal.

- Should the surrounding prose include how to use it (e.g., "paste into GLM-5.3-Flash; optionally append sample records; treat its probes as a checklist before building")? A couple sentences, yes.

- Also maybe note: run it at reasoning max once; iterate with follow-ups per section. Keep to one line.

Formatting: The main artifact in a fenced code block (```text or ```markdown). Inside, markdown formatting. Bullets and headers inside the block. Surrounding prose 3–4 short sentences total. Given the guidance that code/artifacts in blocks are right for copy-paste, and the user explicitly asked "give me a prompt," a code block is the right call.

One more consideration: the user might want the prompt to also cover "should we build for relatives at all?" — my step 3/7 handles tension; I'll add an explicit question in the users section: "Decide explicitly whether and how to serve group 3, or whether to redirect them to NTSB records — and defend that decision." Good, add.

Also add to process step 2 or 7: "Address whether group 3 should be served at all, redirected, or served with heavy guardrails" — put it in Recommendation or as its own sub-question in Need analysis. I'll put it under Users as a decision the model must make.

Also the journalist probe about the crew-action numbers: 112,189 unscheduled landings is a striking hook — leave for the model to find; don't pre-digest.

Word count check of the block: probably ~700–850 words. Fine.

Let me also double-check accuracy of embedded facts against source:
- 1,757,828 records ✓; 54,634 tails ✓; 3,945 designators / 1,213 resolved ✓.
- Column list — include full high-coverage list ✓ (I'll list them).
- Crew counts ✓ (copy exactly).
- Location numbers ✓.
- Filters list ✓ (q, operator, make, model, tail, part, condition, stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from, to).
- "JSON API, no authentication" ✓.
- Not contains: fleet size/hours, cause, accidents ✓.
- Model specs: video/image/text/file input; text output; 1,000,000 context; 128,000 max output; 320B/18B active; 3.01x attention, 4.44x KV cache vs GLM-5.3; reasoning always enabled low/high/max; function calling; structured output JSON schema; context caching; streaming and tool streaming ✓.
- The 92% figure: 1,496,585 / (196,663+1,496,585+64,580) = 1,496,585 / 1,757,828 ≈ 85.1%, not 92%. Let me recompute: 196,663+1,496,585 = 1,693,248; +64,580 = 1,757,828 ✓ matches total. 1,496,585/1,757,828 = 0.8514 → ~85%. So "location only in free text for ~85% of records." Correct my earlier "92%" to ~85%. Good catch — I'll say "about 85%."

Also note: only ~11% have numbered zone (196,663/1,757,828 ≈ 11.2%) — the model can compute; I don't need to precompute everything, but the 85% I state should be right if I state it. Safer: just give raw numbers and let the model compute; but a light guide is fine. I'll give raw numbers and add "most records" phrasing without percentages, or state 85% correctly. I'll state "~85%" — it's correct.

"Present in most records" for Discrepancy — source says present in most records ✓.

Also: 64,580 state no location.

Final structure of my answer:
1. One-two sentence lead.
2. The prompt in a fenced block.
3. Two or three short usage notes (optional samples; run probes; treat rejections seriously). Keep tight.

Actually per instructions, minimize postamble. I'll do lead sentence, block, then 3 bullets max of usage tips.

Let me finalize wording inside the block, tightening.

Also, title the prompt inside: maybe first line "# Task" — fine without a title.

One more element: instruct output format of the model's answer? "Structured markdown, sections numbered as below, tables allowed for candidate builds." Add.

And: "Length discipline: candidate builds table compact; recommendation ≤300 words." Could add but maybe over-constraining; a light "be compact where lists work" suffices. I'll add a brief output note.

Write it now.

Also small thing: the prompt says "senior product strategist and applied data scientist" — good dual framing.

Include in Dataset facts the sentence defining what an SDR record is (mechanic/operator files when component fails/malfunctions/defective) ✓ — important for framing ("reports filed" language).

Okay, compose final.