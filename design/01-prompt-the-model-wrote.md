Here's a prompt built around the three traps in this dataset — missing denominators, missing causes, and a grieving non-expert audience — so the model has to design around them rather than discover them late.

```
ROLE
You are a senior data-product strategist who has shipped research and
newsroom tools over messy regulatory datasets. You are concrete and
skeptical. You would rather kill a feature than ship one that implies
something the data cannot support.

CONTEXT
[PASTE SOURCE MATERIAL HERE]

The existing filtered search + JSON API is the substrate. GLM-5.3-Flash
is available for anything LLM-shaped: 1M-token context (large slices of
the dataset fit per pass; all 1.76M records do not), function calling,
structured output to JSON schema, context caching, reasoning modes.

ASSUMPTIONS (edit if wrong)
- Team: 1–2 engineers, part-time designer. First shippable increment: 6 weeks.
- Platform: web, extending aircraftdefects.com.
- Funding: nonprofit / grant-backed.
- You may propose derived tables and pipelines, not just UI.

TASK
Work out what to build. Five phases, in order. Do not skip ahead.

PHASE 0 — DATA REALITY AUDIT
Before any product ideas, state what this dataset can and cannot support.
- Enumerate the hard limits: no fleet size or flying hours (no fleet-level
  failure rates, no per-operator danger rankings); no cause of defect; no
  accident records (no defect-to-crash linkage); filing behaviour varies by
  operator class, so counts reflect reporting culture as much as fleet
  reality; coverage and reporting behaviour have shifted since 1995; 2,732
  of 3,945 operator designators resolve to no name.
- For each limit, write the one-sentence product rule it forces
  (e.g. "no league tables of operators by report count").
- Note the volume implication for any LLM pass: 1.76M records require
  batched pipelines, not single-context processing.
- Then list what the data uniquely supports that raw search cannot expose:
  per-tail serial histories anchored to AircraftTotalTime/AircraftTotalCycles;
  the severity gradient in the crew-action codes; ~1.5M records that state a
  location in free text no coded zone captures; 30 years of longitudinal depth.

PHASE 1 — USERS
For each of the three groups, in turn:
- The three questions they actually arrive with, phrased as they would say them.
- What they do today without your tool.
- Where the existing search interface breaks down for them.
- What would be harmful or merely misleading to show them.
State whether the three groups should be one product with modes or separate
surfaces, and argue the choice. Treat the relatives' group as a distinct
design problem, not a settings toggle: grieving, non-expert, at risk of
reading causation into co-occurrence. Decide explicitly whether per-tail
histories should be shown to them at all, and under what framing.

PHASE 2 — CANDIDATES
Generate 8–12 candidates. Each: name, one-sentence description, primary
user, exact data dependencies (columns / API params), and why search alone
doesn't cover it. Include at least:
- one data-infrastructure build (resolving operator designators to FAA
  names; extracting zone/part/verb structure from Discrepancy text; PII
  scrubbing of free text; duplicate/amendment detection);
- one analysis build using the per-tail time axis (e.g. repeat-defect
  clusters on one airframe with hours-between-events);
- one journalist-facing tool that must include provenance (record IDs,
  exact quotes, export);
- one plain-language surface;
- two LLM-in-the-loop features using function calling or JSON-schema output.
If a candidate depends on external data (e.g. NTSB accident records), mark
it out of scope and say what would change if it existed.

PHASE 3 — EVALUATION AND REJECTION
Score every candidate 1–5 on: user value; feasibility with this data; risk
of harmful misinterpretation (state what a 5 means); effort. Show the table.
Then reject the bottom three in plain sentences — especially anything that
smuggles in rates, causes, or accident implications.

PHASE 4 — RECOMMENDATION
Pick the top 1–2. For each:
- MVP definition: what exists on day one, described concretely (endpoints,
  screens, pipeline steps in order).
- LLM usage plan: where the model runs, at what reasoning level, what the
  structured-output schema enforces, where context caching pays off, and the
  grounding rule: every generated statement must cite record IDs, and the
  product must refuse to emit rate or causal language.
- Validation: for any text extraction or classification, hand-label 200–300
  records and report precision/recall before shipping; name one sanity-check
  against a known event or fleet.
- Harm analysis per user group with specific mitigations (language rules,
  contextual banners, no rankings, PII scrub of Discrepancy, plain-language
  glossary for JASC and stage codes).
- A short list titled "What this product will never claim."

PHASE 5 — SEQUENCING
Order the work in 2-week increments and mark what ships in each. List what
you are deliberately not building yet and why. End with the five user-
interview questions that would most change the plan, and the open facts you
would need that are not in the source material.

OUTPUT RULES
- Every claim about the data must trace to the source material. If you need
  a fact you don't have, file it as an open question; do not invent it.
- No product-manager filler. Plain sentences and numbers.
- Under 2,500 words. The Phase 4 MVP spec must be understandable by a
  non-technical stakeholder in one page.
```

**How to use it**

- Paste your source material at the marker and edit the ASSUMPTIONS block — those four lines materially change what gets recommended.
- Run at high or max reasoning. The prompt's value is that Phase 0 and Phase 3 force rejection before the model commits to a build.
- If you want to steer mid-flight, split at Phase 3: review the candidate table, then run a follow-up like *"Phase 4 only, for candidate X, expanded to a full engineering spec."*
- If you want a machine-readable plan, add *"Output the Phase 4 MVP spec as JSON matching a schema you propose"* — the model's structured-output mode will enforce it.

The one thing worth changing per your situation: the Phase 1 instruction about relatives. If you've already decided they get a separate surface (or no per-tail lookup at all), say so directly in the prompt — it's the highest-stakes design decision in the whole plan and it shouldn't be left to the model.