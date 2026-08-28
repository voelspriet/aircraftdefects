The user wants a prompt they can use (presumably with the GLM-5.3-Flash model, or any capable LLM) to work out what to build on this FAA Service Difficulty Reports dataset for the three user groups.

Let me think carefully about what makes a good prompt for this task, and what a thoughtful answer looks like.

First, what's the actual job? They want to figure out what to build. Not build it yet. So the prompt should drive a discovery/scoping exercise: understand the data, understand the users, generate candidate products, evaluate them, and converge on a recommendation with rationale.

Key constraints and facts from the source material that a good prompt should carry forward:

1. The dataset: FAA SDRs, 1995–present, ~1.76M records, ~54,634 aircraft by tail number, ~3,945 operator designators (only 1,213 resolve to names). 76 columns, key ones listed.

2. Nature of the data:
   - SDRs are reports of failures/malfunctions/defects found — they are not accidents, not causes, not fleet denominators.
   - Crucially: no fleet size or flying hours → can't compute true rates/failure rates per aircraft. Any "trend" is raw count-based and confounded by reporting behavior. This is a major analytical trap that the prompt should force the model to confront: denominators missing, reporting bias (airlines report more than private operators, etc.).
   - No cause of defect → can't do root-cause claims.
   - Doesn't record accidents → can't link defects to crashes directly, and doing so could be defamatory/misleading, especially for the "relatives of people who died" audience. There's an ethical dimension here: for grieving relatives, showing a defect report on the tail number of the plane that crashed could imply causation that the data cannot support. The prompt should surface ethics/care requirements.
   
3. Free text Discrepancy is the richest field: most records have free text location only (1,496,585 vs 196,663 coded zone). So text extraction/classification is a key build opportunity — e.g., extracting zones, part mentions, verbs (crack, corrode, fatigue, delaminate...), normalizing.

4. Coded fields resolve against FAA lookup tables — a build task is resolution/normalization (e.g., operator designator → name: 3,945 designators, only 1,213 resolve; a matcher to FAA lists would be valuable).

5. Existing interface: a filtered search + full-text search with JSON API. So whatever is built extends or builds on a search tool. Candidates: dashboards, alerting/monitoring, narrative explainers, data pipelines, LLM-assisted reading of discrepancy text, entity resolution, repeat-defect detection per tail number, fleet-level pattern surfacing (e.g., "this aircraft model + this part shows clustering of cracks after N cycles" — cycles field exists per record: AircraftTotalCycles, AircraftTotalTime on that aircraft at report time, so you can order reports per tail and see progressive damage; that's a real analytic possibility even without fleet denominators — within-tail-number trajectories don't need fleet denominators).

Wait — actually AircraftTotalTime and AircraftTotalCycles give you per-record age of the airframe. So you can do within-aircraft trajectory analysis: same tail over time, hours at each defect. You just can't compute fleet-level failure *rates* (missing non-defective denominator), but you can do things like "defects reported per 1000 flight hours elapsed between reports per tail" — actually you can compute hours *between* reports per tail from TotalTime deltas. That's a legitimate within-fleet exposure proxy. Hmm, but reporting behavior still confounds. Anyway — the point is the prompt should include the fields so the model can find these affordances.

6. Users:
   - Investigative journalists: story-finding, vetting leads, quantifying patterns, Freedom-of-information-adjacent timelines, finding clusters before/after events, compare operators. Need citations back to raw records, exact quotes, export for FOIA follow-ups, careful language about causation.
   - Researchers/safety analysts: repeatable methods, exportable data, statistical caution, reproducibility, codebook for text classification, precision/recall if NLP is involved.
   - Relatives of accident victims: understandable explanations, gentle UX, no causal implications, plain-language glossary of SDR jargon (JASC codes, stage of operation), ability to look up a tail number and see its maintenance history with appropriate framing and context (SDRs are routine reports; most are benign). Emotional safety. This is a distinct design need — probably a separate surface from the journalist tool.

7. Model available: GLM-5.3-Flash — 1M context (whole interesting chunks of dataset fit? 1.76M records × maybe 1–2KB = way more than 1M tokens, so not whole dataset, but large slices), structured output JSON schema, function calling, reasoning modes. So LLM-in-the-loop features: classify/extract from Discrepancy text at scale (batching with caching), generate summaries of a tail's history, explain codes in plain language, draft FOIA/story leads. The prompt should ask the plan to specify how the LLM is used and where it must not be used (e.g., never generate causal claims; guardrails; citation to record IDs).

So the prompt I write should:
- Embed the dataset facts (maybe in a compact "CONTEXT" block the prompt-writer can paste).
- Set the role: senior product person / data product strategist with aviation data + newsroom experience.
- Force engagement with constraints: no denominators, no causes, no accidents; reporting bias; code tables; the free-text opportunity; existing API as a substrate.
- Force user-centered analysis: jobs-to-be-done per user group, where current interface falls short, ethical risks especially for relatives.
- Drive divergent then convergent thinking: e.g., generate 8–15 candidates, score them on a rubric (user value, feasibility with this data, risk of harm/misinterpretation, differentiation, effort), then pick top 1–3 with rationale.
- Require concrete specification of the chosen direction(s): what the thing is, data pipeline steps (normalization, operator resolution, text extraction), LLM usage plan (prompts, structured output, evaluation of extraction accuracy), UI surfaces, MVP cut, validation with users, success metrics, risks and mitigations (misinterpretation, defamation, grief-sensitive design), and what NOT to build.
- Ask for honest treatment of what the data can't support — maybe require a "claims the data cannot support" section.
- Ask for evaluation plan: how to test text-extraction quality on a hand-labeled sample, how to sanity check counts against known events (e.g., known fleet groundings like certain corrosion findings), etc.
- Output format: structured, e.g., sections with headings; tables for scoring; JSON-ish spec maybe. Since the model supports structured output, could ask for a JSON schema at the end for the chosen MVP spec — optional.

Also the prompt should include instructions on how to handle ambiguity: e.g., ask clarifying questions before assuming (budget, team size, web vs API, single maintainer?). Or state assumptions explicitly. A good prompt might say "If critical inputs are unknown (team size, budget, timeline, whether this is nonprofit/commercial), state assumptions and proceed."

Should the prompt ask the model to do data exploration first? The model is text-only in this framing (though docs say it takes files). Realistically, the person would paste schema + samples. The prompt can instruct: "Before proposing anything, write down what this dataset can and cannot support analytically" — a "data reality audit." That's a strong move to prevent hallucinated metrics like "failure rate."

Also: the prompt should force explicit grappling with the reporting-bias issue (more reports ≠ less safe; an operator with many SDRs may just have a good reporting culture). Journalists will jump to "operator X has 500 reports!" — the product should prevent naive league tables, or at least contextualize.

And the relatives group: the prompt should demand a separate treatment — maybe "one guided, plain-language flow" vs the power tool — plus a decision on whether to even surface per-tail histories to relatives given misuse/misreading risk, with mitigation (context banners, linking to NTSB accident DB as separate, plain glossary, no causal language, hotline/support links?). Also privacy: tail numbers are public; mechanic names may appear in text — scrubbing PII from free text is a build task (names, phone numbers in text). Good catch: Discrepancy text can contain mechanic names/phone numbers; a PII scrubber is needed for public display. Also the prompt could mention checking for infants (pre-1995 data absent → survivorship/coverage bias: reporting mandates, changes over time; dataset starts 1995 so "since 1995" claims).

Also duplicates/updates: SDRs have amendments? Possibly. And the same defect reported multiple times. Dedup consideration.

Also "Counts of the coded crew action field" given — shows the flavor: unscheduled landing 112k etc. These make good headline-able facets.

Now, form of my answer: The user asked: "Give me a prompt to work out what to build on this dataset for these users." So deliverable = a prompt. I should give a single, well-structured prompt, probably in a code block or clearly delimited, with placeholders minimal (they can paste the source material). Should I embed the source material in the prompt or reference it? Better: write the prompt assuming the source material is pasted above/attached, with a marker like [SOURCE MATERIAL BELOW]. Or embed a condensed context block. I think: provide the prompt with a clear slot: "CONTEXT: <paste the dataset description>" — but the user already has the source material, so I can write the prompt to include it. Safer to include a bracketed placeholder "— paste the source material here —" plus the prompt body that references specific facts from it (no denominators, 3 user groups, existing API, etc.), so the prompt is self-coherent regardless.

Hmm — should the prompt reference specific numbers (1,757,828 records etc.)? It can, since those are in the pasted material. I'll reference them qualitatively ("~1.76M records") to keep the prompt readable, and rely on the paste.

Length and format: The user wants a prompt. I should give the prompt itself, formatted with clear sections (role, context, task, constraints, method, output format, quality bar). Use a code block so it's copy-pasteable? A markdown block would preserve formatting. I'll present it in a fenced block. Maybe a one-line intro and possibly a few bullet notes after about why the prompt is shaped that way / how to use it (optional, keep brief). The user is clearly sophisticated (they wrote terse, information-dense source material — reads like a good analyst). Keep my meta-commentary minimal; the prompt is the product. Maybe 3–5 short bullets of "design notes" after — or maybe none? A couple of lines on how to use (run at high reasoning, iterate) could help. I'll add a very short "How to use" note.

Now draft the prompt content.

Structure of the prompt:

1. Role & stance: "You are a senior product strategist and data engineer who has shipped data tools for newsrooms and aviation-safety analysts. You are skeptical, concrete, allergic to dashboards that imply causation the data can't support."

2. Context: paste source material. Also state "Everything you propose must be derivable from this dataset + the existing API + the model described. Do not assume data you haven't been given."

3. Task: "Produce a build plan: what to build, for whom, in what order." Break into phases:

Phase 0 — Data reality audit. Before any ideas: list what this dataset can and cannot support. Specifically address: missing denominators (fleet size, hours) → no fleet-level failure rates; no cause; no accident linkage; reporting bias and who files; 1995 coverage start; code-table gaps; free text vs coded zone coverage. For each: how it constrains product claims. Also list what the data uniquely supports (per-tail serial histories with hours/cycles at each report; free-text richness; longitudinal 1995–present; crew-action severity signal).

Phase 1 — Users. For each of the three groups: their jobs, the questions they actually ask, what they do today (probably manual searching of the existing interface / reading raw SDRs / calling experts), where the current search interface fails them. Note these are three different products possibly; don't force one UI. Special handling for relatives: emotional context, risk of self-blame or misdirected blame, need for plain language, whether to show per-tail histories at all and with what guardrails.

Phase 2 — Candidate generation. 8–12 candidate builds spanning a range: pipeline/data-infrastructure (operator designator resolution to FAA names, zone extraction from free text, PII scrubbing, dedup), analysis features (repeat-defect clustering per tail with hours-between events, part+model cohorting, severity facets from crew action codes, corrosion/crack trajectories), user-facing products (journalist lead-finder with provenance, plain-language explainer mode, export/citation tooling), and LLM-in-the-loop features (batch classification of Discrepancy text to a controlled vocabulary with JSON schema output; natural-language query over the API via function calling; per-tail narrative summaries with strict grounding rules). For each candidate: what it is (1–2 sentences), primary user, what data fields it depends on, why the existing interface can't already do it.

Phase 3 — Evaluation. Score on: user value (per group), feasibility with this data + GLM-5.3-Flash, risk of harmful misinterpretation (1–5 with explicit definition), effort. Show the table. Then reject 2–3 candidates explicitly with reasons (especially ones that imply rates or causes).

Phase 4 — Recommendation. Pick top 1–2. For each: MVP definition (concrete: screens/endpoints/steps), pipeline spec in order with the normalization steps called out, exact LLM usage plan — where the model is used, at what reasoning level, structured-output schemas, context caching for repeated table content, and the grounding rule: every generated claim must cite record IDs; no free generation of causal or rate claims. Evaluation plan for LLM extraction: hand-label 200–300 discrepancies, measure precision/recall per label before shipping; report it. Ethics section: misreading risks per user group, specific mitigations (language rules, banners, no league tables without context, grief-sensitive copy), PII scrub, and a list of "claims this product will refuse to make."

Phase 5 — Sequencing. 2–4 week increments, what ships first and why; what to deliberately not build yet; open questions to resolve with users (list 5 interview questions, one per assumption).

4. Output format: headed sections matching phases; candidate table; final one-page MVP spec; keep it under ~N words. Maybe request that the final answer ends with a 10-line summary a non-technical stakeholder could read.

5. Quality bar / guardrails for the model: "No generic product-manager filler. Every claim about the data must trace to the source material. If you want a fact you don't have (e.g., reporting compliance rates), name it as an open question instead of assuming. Use plain numbers. Prefer rejecting ideas over hedging."

Also instruct about clarifying questions: "If budget/team/timeline materially change the answer, state two variants: solo-maintainer vs small team." Actually simpler: "Assume a team of [X]" placeholder — or instruct to assume 1–2 engineers + 1 designer, 3 months to first ship, and say so. I'll include an ASSUMPTIONS slot with defaults the user can edit. Good: put editable assumptions at top of prompt: team, timeline, platform (web), commercial vs nonprofit, relationship to existing site (extend aircraftdefects.com). Provide defaults so it runs as-is.

One more consideration: should the prompt tell the model to reason at high/max? That's a runtime setting, not prompt content, but I can note it in "How to use."

Also consider: the user might run this in multiple passes (e.g., Phase 0–2 first, then 3–4). I could note that the prompt is splittable at Phase 3. Brief.

Length of the prompt: substantial but not bloated. Maybe 500–800 words in the block. The user's own style is telegraphic; I should keep the prompt tight, imperative sentences. Avoid over-formatting inside the code block; headings + short paragraphs + a few lists are fine.

Let me now write the actual prompt text.

Draft:

---

ROLE
You are a senior data-product strategist who has shipped research and newsroom tools over messy regulatory datasets. You are concrete and skeptical. You would rather kill a feature than ship one that implies something the data cannot support.

CONTEXT
[paste SOURCE MATERIAL here]

The existing filtered/full-text search with a JSON API is the substrate. GLM-5.3-Flash is available for anything LLM-shaped: 1M-token context (large slices of the dataset fit per pass; the whole 1.76M records do not), function calling, structured output to JSON schema, context caching, reasoning modes.

ASSUMPTIONS (edit if wrong)
- Team: 1–2 engineers, part-time designer. First shippable increment: 6 weeks.
- Platform: web, extending aircraftdefects.com.
- Funding: nonprofit / grant-backed; no commercial tracking.
- You may propose new derived tables/pipelines, not just UI.

TASK
Work out what to build. Do it in five phases, in order. Do not skip ahead.

PHASE 0 — DATA REALITY AUDIT
Before any product ideas, state what this dataset can and cannot support.
- Enumerate the hard limits: no fleet size or flying hours (so no fleet-level failure rates or per-airline "danger rankings"); no cause of defect; no accident records (so no defect→crash linkage); reporting is voluntary and skewed by who files and how much; coverage starts 1995; coded fields have gaps and unresolved operator designators (2,732 of 3,945 have no name).
- For each limit, write the one-sentence product rule it forces (e.g., "no league tables of operators by report count").
- Then list what the data uniquely supports that a raw search interface cannot expose: per-tail serial histories anchored to AircraftTotalTime/AircraftTotalCycles; the severity gradient in the crew-action codes; the free-text Discrepancy field (1.5M records describe a location in text that no coded zone captures); 30-year longitudinal depth.

PHASE 1 — USERS
For each of the three groups, answer in turn:
- What are the three questions they actually arrive with? (Write them as they would say them.)
- What do they do today without your tool?
- Where does the existing search interface break down for them?
- What would be harmful or merely misleading to show them?
Treat the relatives' group as a distinct design problem, not a settings toggle on a power tool: grieving, non-expert, at risk of reading causation into co-occurrence. Decide explicitly whether per-tail histories should be shown to them at all, and under what framing and guardrails.

PHASE 2 — CANDIDATES
Generate 8–12 candidates. Each: name, one-sentence description, primary user, exact data dependencies (columns/API params), and why search alone doesn't cover it. Include at least: one data-infrastructure build (e.g., resolving operator designators to FAA names; extracting zone/part/verb structure from Discrepancy text; PII scrubbing of free text), one analysis build that uses the per-tail time/axis (e.g., repeat-defect clusters on one airframe with hours-between-events), one journalist-facing tool, one plain-language surface, and at least two LLM-in-the-loop features that use function calling or JSON-schema output.

PHASE 3 — EVALUATION AND REJECTION
Score every candidate 1–5 on: user value; feasibility with this data; risk of harmful misinterpretation (define what 5 means); effort. Show the table. Then reject the bottom three in plain sentences — especially anything that smuggles in rates, causes, or accident implications.

PHASE 4 — RECOMMENDATION
Pick the top 1–2. For each:
- MVP definition: what exists on day one, described concretely (endpoints, screens, pipeline steps in order).
- LLM usage plan: where the model runs, at what reasoning level, what the structured-output schema enforces, where context caching pays off, and the grounding rule: every generated statement must cite record IDs, and the product must refuse to emit rate or causal language.
- Validation: for any text-extraction or classification, hand-label 200–300 records and report precision/recall before shipping; name the sanity-check you'll run against a known event or fleet.
- Harm analysis per user group with specific mitigations (language rules, contextual banners, no rankings, PII scrub of Discrepancy, plain-language glossary for JASC/stage codes).
- A short list titled "What this product will never claim."

PHASE 5 — SEQUENCING
Order the work in 2-week increments. Mark what ships in each. List what you are deliberately not building yet and why. End with the five user-interview questions that would most change the plan, and the open facts you'd need that are not in the source material.

OUTPUT RULES
- Every claim about the data must trace to the source material. If you need a fact you don't have, file it as an open question; do not invent it.
- No product-manager filler ("seamless experience", "leverage"). Plain sentences and numbers.
- Keep the whole response under 2,500 words. The MVP spec in Phase 4 must be understandable by a non-technical stakeholder in one page.

---

That's pretty good. Let me refine details.

- "2,732 of 3,945" — 3,945 − 1,213 = 2,732. Correct. Nice to include a computed fact to show rigor, but it's in the pasted material implicitly. Fine.
- Should I mention "counts of crew action field" as a severity gradient — yes did.
- "1.5M records describe a location in text that no coded zone captures" — the numbers: 1,496,585 free-text-only, 196,663 coded, 64,580 none. Could say "~1.5M".
- Should the prompt include the verbatim examples of discrepancy text? They're in pasted material; the model will see them. Fine.
- Maybe add to Phase 2: "one LLM feature that turns a natural-language question into API calls via function calling" — included.
- Also could add: dedup/amendment handling as infra candidate. I mention PII scrub and operator resolution; add "duplicate and amendment detection" maybe as an example list. Keep examples parenthetical.
- Add instruction: "Do not propose anything requiring data not in the dataset (e.g., linking NTSB accident records) — but you may note it as a future integration with its risk." Hmm — linking to external NTSB data for the relatives group is tempting; the source says dataset doesn't record accidents. Allowing "note as future" is reasonable and shows sophistication: the relatives tool almost certainly wants accident context, but building it is out of scope / risky. I'll add a line: "If a candidate depends on external data (e.g., NTSB accident records), mark it out of scope for this plan and say what would change if it existed."

- The scoring rubric: "risk of harmful misinterpretation (define what 5 means)" — good.

- Also want to force explicit consideration of whether some users are served by the same build. Phase 1 last line handles relatives; maybe add "State whether the three groups should be one product with modes or separate surfaces — and argue the choice." Good addition to Phase 1.

- Also: journalists need provenance/exports (record IDs, CSV export, exact quotes) — the candidate categories imply it; I could name it explicitly in Phase 2 list: "one journalist-facing tool that must include provenance (record IDs, exact quotes, export)". Yes.

- Word budget: "under 2,500 words" — reasonable for GLM output.

- Reasoning level note in "how to use": run at high reasoning; consider splitting at Phase 3 to review candidates before committing; regenerate Phase 4 with structured output if you want a machine-readable spec. Keep to 3 bullets max.

Format of my response: 
- One short intro sentence.
- The prompt in a fenced code block (markdown fenced) so it's copy-pastable. Should I use a code block? If I use ```markdown, the headings inside render as plain text when copied — good. Yes, fenced block.
- Then "How to use" — 3–4 tight bullets: paste source material where marked; edit ASSUMPTIONS; run at high reasoning; split point; follow-up prompt for the chosen MVP (maybe offer a one-line follow-up prompt like "Phase 4 for candidate X only, expand to full spec").

Keep my commentary minimal. Headers in my response: probably not needed beyond maybe bold "How to use it". Keep it lean.

Also double-check the Phase 0 hard-limits phrasing: "voluntary" — SDRs are mandatory for certain holders (Part 121 etc.) but reporting is still skewed; safer phrasing: "filing behavior varies by operator class, so counts reflect reporting culture as much as fleet reality." Good — that's accurate and neutral.

One more thing: the prompt should tell the model to think about the dataset's *scale for LLM processing*: 1.76M records is too many to pass wholesale; a build plan should include how the pipeline batches (e.g., process by year/operator slices, cache shared lookup tables in context). I have context caching mention in Phase 4. Maybe add to Phase 0: "note the volume implications for any LLM pass (1.76M records cannot fit in one context; plan batching)." Good, concrete.

Also the "survivorship" nuance: records from 1995 onward only; changes in reporting rules over time. Add to limits list: "reporting requirements and forms changed over 30 years" — I'll phrase generally: "coverage and reporting behavior have shifted since 1995."

Okay. Also the instruction "Do not skip ahead" and "in order" helps the reasoning model structure output.

Let me also make sure the prompt asks the model to make a *decision*, not present options neutrally: "Pick the top 1–2" + rejection — yes, forces convergence.

Final check on the answer format per instructions: This is a conversational/technical request; markdown fine. Length: medium — the prompt block dominates. Avoid excessive nesting in my own prose; the prompt block itself will have structure (that's appropriate since it's a document the user asked for).

Write it now, tightening wording.

One small thing: the user said "Give me a prompt to work out what to build on this dataset for these users." So singular prompt. Deliver one prompt. Maybe also offer the optional follow-up micro-prompt at the end. Fine.

Also, should the prompt address the model's "reasoning always enabled" — runtime setting, in How to use.

Write final.