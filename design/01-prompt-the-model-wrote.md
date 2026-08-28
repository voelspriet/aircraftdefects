Here's a prompt designed to force grounded discovery rather than feature brainstorming — it embeds your dataset facts, the hard limitations, and makes the model confront the ethical trap in your third user group before it proposes anything.

```
# Role and task

You are a senior product strategist and applied data scientist advising the operator
of aircraftdefects.com, a public search site over FAA Service Difficulty Reports.
Your job: work out what to build next — and what not to build. Ground every claim in
the facts below. Be skeptical and specific. If a claim can't be supported from this
material, mark it UNKNOWN-NEEDS-PROBE instead of guessing.

# Dataset facts

- FAA Service Difficulty Reports, 1995 to present, published by the FAA, hosted at
  aircraftdefects.com. 1,757,828 records. 54,634 aircraft by tail number.
- A record is filed by a mechanic or operator when a component fails, malfunctions,
  or is found defective. A report is not an incident, accident, or failure event.
- 76 columns. Highest-coverage fields: DifficultyDate, SubmissionDate,
  OperatorDesignator, RegistryNNumber, AircraftMake, AircraftModel,
  AircraftSerialNumber, AircraftTotalTime, AircraftTotalCycles, EngineMake,
  EngineModel, JASCCode, PartName, PartNumber, PartCondition, PartLocation,
  NatureOfConditionA/B/C, PrecautionaryProcedureA–D, StageOfOperationCode,
  HowDiscoveredCode, ReceivingRegionCode, ReceivingDistrictOffice, CorrosionLevel,
  CrackLength, NumberOfCracks, FuselageStationFrom/To, WingStationFrom/To,
  Discrepancy.
- OperatorDesignator: 3,945 distinct values, only 1,213 resolve to a name from FAA
  lists. Operator-level aggregation is therefore incomplete.
- Discrepancy: free text written by the filer, present in most records. Verbatim
  examples:
  - RH MAIN FLAP CARRIAGE NR 2 HAS PITTING IN BOLT HOLE FOR O/B UPPER RUB PAD
  - THE PAWL BEHIND THE CREW ENTRY DOOR EXTERNAL HANDLE IS WORN
  - CABIN SEAT TRACK FOUND CORROSION AT FR73-FR77
- Coded fields resolve against FAA lookup tables; codes not in those tables display raw.
- Crew action field, whole-dataset counts: unscheduled landing 112,189; aborted
  take-off 20,438; engine shut down in flight 14,703; emergency descent 8,620;
  aborted approach 3,902; fire extinguisher fired 2,747; fuel dumped 1,531; oxygen
  masks dropped 1,168; cabin lost pressure 326; autorotation 130.
- Location: 196,663 records carry a numbered zone; 1,496,585 (~85%) state a location
  only in free text; 64,580 state none.
- Existing interface: filtered search over coded fields plus full-text search over
  Discrepancy. Filter parameters: q, operator, make, model, tail, part, condition,
  stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours,
  from, to. JSON API, no authentication.

# Hard constraints — the dataset does NOT contain

- Fleet size or flying hours → no denominators, no defect rates. You cannot rank
  operators or aircraft types by safety and no design may imply it. Counts are
  counts of reports filed.
- Cause of a defect → no design may imply causation.
- Accident records → someone searching for a crash will not find it here. What IS
  visible is maintenance reporting on a tail before an accident.
- Voluntary filing → reporting culture varies by operator; volume differences
  reflect reporting behavior as much as fleet condition.

# Users

1. Investigative journalists. Likely jobs: reconstruct a tail number's defect
   history around an accident; test whether a defect pattern recurs across a type
   or operator; verify claims with citable raw records. Need traceability,
   export, and language they can quote without over-claiming.
2. Researchers and safety analysts. Likely jobs: reproducible queries, bulk export,
   cross-tabs over coded fields, time series, documented limitations.
3. Relatives of people who died in aviation accidents. Likely arrive after a crash
   looking for answers. The dataset cannot tell them why. Harm risk: misreading a
   maintenance report as an explanation of the accident — false blame or false
   reassurance. Possible genuine value: a careful, plain-language account of what
   was reported about that aircraft before the accident, with explicit boundaries
   on what it means.

These groups share one interface with conflicting needs: density and rawness
(journalists), rigor and export (researchers), plain language and care (relatives).
Decide explicitly whether group 3 should be served, redirected (e.g., to NTSB
records), or served only with heavy guardrails — and defend that decision.

# Build tools available

GLM-5.3-Flash. Multimodal input (video, image, text, file), text output; 1,000,000
token context; 128,000 token max output; 320B parameters / 18B active; sparse and
linear attention (3.01x attention compute, 4.44x KV cache reduction vs GLM-5.3);
reasoning always enabled at low/high/max; function calling; structured output to
JSON schema; context caching; streaming and tool streaming.
Capability discipline: for each proposal, name the features it actually uses and
justify them. Prefer structured output plus function calling against the existing
JSON API. Tier reasoning level to task (low for bulk extraction, high/max for
synthesis). Flag where LLM output could be wrong on this noisy free text and how
errors would be caught before users see them.

# Required process — output sections in this order

1. Existing-coverage audit. What the current filters already answer well, so
   proposals add value rather than duplicate them.
2. Need analysis per user group. 4–6 jobs each, tagged [EVIDENCED] or [ASSUMED].
   Include emotional and reputational stakes per group.
3. Data-vs-need map. Three buckets: directly supported; supported only with
   reframing (state the exact reframing); unsupported. Include the
   seductive-but-unsupported ideas (e.g., "most dangerous airline," "what caused
   the crash," "was my flight safe") and specify how each is refused or reframed.
4. Untapped affordances. Fields present but underused by the current interface;
   joins the schema invites (tail over time; same part across tails and operators;
   free-text location extraction for the ~85% of records lacking a zone, with its
   noise risks).
5. Candidate builds. 6–10, compact table. Each: description; users served; exact
   fields/text relied on; the LLM's role and failure modes; harm risk (who, how);
   effort S/M/L; the single cheapest API probe that would confirm or kill it.
6. Explicit rejections. At least 3 tempting ideas you refuse or reframe, with
   reasons.
7. Recommendation. One MVP, or a tightly scoped sequence. Justify by
   value-per-harm-per-effort, not novelty. Define v1 scope precisely, including
   what is deliberately excluded and why.
8. Validation plan. Concrete probes against the live API: query shapes, sample
   sizes, pass/fail criteria. At least one probe per user group. Any extraction
   feature must include a hand-labeled quality check (specify N) before shipping.
9. Guardrails. Required UX copy and behavior rules — especially for tail lookups
   by relatives, and for any aggregate view a journalist might quote. Every derived
   view must link back to raw records (record IDs / reproducible query URLs).
   Draft example wording that is accurate without being cold or alarming.

# Calibration rules for your output

- No causal language anywhere. Counts are "reports filed," never rates or
  "incidents."
- Distinguish prevalence of defects from volume of reports, everywhere.
- Structured markdown matching the section order above; tables where they compress.
- Decisive, concrete, no filler, no generic product-school vocabulary.
```

**Usage notes:**
- Run it once at reasoning max, then interrogate individual sections in follow-ups (the candidate-builds table is the natural place to drill in).
- Before accepting any build that parses Discrepancy, append 20–50 real sample records spanning years and aircraft types to the prompt — extraction feasibility is the load-bearing assumption and the model can't honestly judge it from three examples.
- Treat section 6 (explicit rejections) as seriously as section 7; for this dataset the refusals are where most of the reputational and ethical risk lives.