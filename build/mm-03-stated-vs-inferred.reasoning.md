The user wants me to go through my previous answer and mark each sentence as either:
1. Stated in the source material (the SOURCE MATERIAL block from their first message), or
2. Inferred by me — with an explicit note that it is not established by the source.

This is a provenance/audit task. I need to be rigorous and honest. Let me first reconstruct the source material's actual claims:

**Source material states:**
- Dataset: FAA Service Difficulty Reports, 1995 to present. 1,757,828 records. 54,634 aircraft by tail number. 3,945 operator designators.
- Filed by mechanics when a component fails, malfunctions or is found defective. Public, no auth.
- 76 columns. Coded fields resolve against FAA lookup tables. Discrepancy is free text written by the filer, present in most records, in trade shorthand.
- Already built (text only): filtered search over coded fields, full text search over Discrepancy.
- Four drawn views: month by month; side view of aircraft shaded by zone write-up frequency; airline and tail; what the crew was forced to do.
- Per record, plain-English account of the write-up, produced by GLM-5.3-Flash, may abstain, lists every abbreviation with whether meaning came from record or model's own knowledge.
- Notice when a coded field contradicts the same filer's narrative. Measured on 200 long reports: 29 flagged, calibration in progress.
- Separate tool that reads a photographed FAA form and decodes the boxes.
- Dataset does NOT contain: fleet size, fleet flying hours, cause of a defect, accident records, any image, any drawing, any attachment.
- GLM-5.3-Flash documented capabilities: input video, image, text, file. Output text. Context 1,000,000 tokens. Max output 128,000 tokens. 320B params, 18B active. Sparse and linear attention: attention compute and KV cache reduced 3.01x and 4.44x vs GLM-5.3, so long context is cheap. Vendor states visual capability is inside the working loop: model observes interfaces, rendered results and interaction feedback, coordinates tasks across code, browsers and GUIs. Reasoning always on, low/high/max. Function calling. Structured output to JSON schema. Context caching. Streaming and tool streaming.
- Users: investigative journalists; researchers and safety analysts; relatives of people who died in aviation accidents.

That's it. Everything else in my answer was inference: the personas' workflows, FOIA productions, pre-1995 paper SDRs (interesting — the dataset starts at 1995, but paper SDRs existed before; that's my inference/background knowledge), NTSB CAROL, FAA RGL (external knowledge), token estimates for dockets (my estimate), the failure modes, the verdicts, the ranking, the tests, etc.

Also note: things I said about what the model can do beyond vendor documentation — e.g., "the model can crop," "field-level abstention" — those are design proposals, not documented capabilities. My statement that the abbreviation provenance list "establishes a house style" is inference.

Some sentences quote the vendor lines directly — those are stated in source.

Now, how to execute this? The instruction: "mark each sentence as either stated in the source material or inferred by you. For anything inferred, say it is not established by the source."

Going sentence-by-sentence through the entire previous answer would be extremely long. The previous answer is long. But the user asked for it. I should be thorough but I can compress by grouping sentences that share the same provenance status, or by handling section by section. Actually, the cleanest honest execution is to go through each section and each sentence (or sentence-cluster), tagging:

- [S] = stated in source material (or directly quoted from it)
- [I] = inferred by me; not established by the source.

I should be careful about edge cases:
- Sentences that restate source facts with my gloss (e.g., "the dataset has no images, so vision's only honest jobs are...") — the first half is stated, the second half is inference. I should split or mark as mixed, with the inferred part flagged.
- Sentences citing vendor lines verbatim — stated.
- Things like "pre-1995 paper SDRs" — the source says dataset is 1995 to present, so the existence of pre-1995 paper records is not in the source; it's my background knowledge/inference. Must flag.
- "NTSB CAROL," "FAA RGL" — external knowledge, not in source. Flag.
- "≈200k–400k tokens" for dockets — my estimate. Flag.
- "the source says 'Filed by mechanics when a component fails, malfunctions or is found defective'" — stated.
- The 29/200 flag rate — stated.
- "calibration in progress" — stated.
- The abbreviation provenance feature — stated.
- The existing form decoder — stated. But my characterization "single-form tool" vs batch is inference about its limits — actually the source just says "a separate tool that reads a photographed FAA form and decodes the boxes." Whether it handles batches is not stated; my framing that it's single-form is inference.
- "Structured output to JSON schema," "Function calling," "Context caching," "1M context," "long context is cheap" (vendor says attention compute reduced so long context is cheap — the source says "so long context is cheap" — yes, that phrase is in the source! "attention compute and KV cache reduced 3.01x and 4.44x versus GLM-5.3, so long context is cheap." So "long context is cheap" is stated by vendor per source).
- "visual capability inside the working loop" quote — stated.
- The kill-test ("name the user who holds the file") — that was in MY prompt, not the source material. The prompt was authored by me in a prior turn. The user asked to mark against "the source material" — which is the SOURCE MATERIAL block. My prompt is not source material. So the kill-test itself is my construction — inferred/not established by source. However, I should be careful: the user said "stated in the source material or inferred by you." The prompt I wrote is "by me," so it's inferred relative to source. I'll mark it as such.

Hmm, but there's nuance: the previous answer was generated under the prompt's constraints. The user presumably wants to audit which claims trace back to the actual source material vs. which are my additions. So: source material = the SOURCE MATERIAL block only. My prompt = mine. Vendor quotes within source = stated.

Structure of my answer:
- Brief preamble defining the marking scheme and the rule (source material = the SOURCE MATERIAL block; my prior prompt doesn't count; quoted vendor lines count as stated because they appear in the source block).
- Then go section by section, sentence by sentence (or clause-level where a sentence mixes S and I — I should split those and mark each part, because mixing is exactly where dishonesty would creep in).

Let me now go through my previous answer carefully and decompose.

**Preamble of previous answer:**
"Ruling constraint up front: the dataset has no images..." — "the dataset has no images" is stated (source: "any image... any drawing, any attachment" absent). "so vision's only honest jobs are (a) the paper world users bring in, and (b) the pixels the tool itself produces" — inference. Not established.
"plus the kill-test: name the user who holds the file, or the idea dies." — inference (my prompt's construction, not source). Not established.

**Idea 1:**
- "Journalist with a FOIA production: 300 scanned pages of pre-1995 paper SDRs for one tail number, or a box of Form 8330 revisions." — Entirely inferred. FOIA productions not in source; pre-1995 paper SDRs not in source (source only says dataset covers 1995–present); "Form 8330" is my external knowledge (that is actually the SDR form number — but not stated in source). Not established.
- "They want them searchable against the 1.76M electronic records, today." — inferred want. Not established. Note: "1.76M" — source says 1,757,828; rounding is fine, the number is stated; the wanting is inferred.
- "Scanned/photographed paper SDRs and legacy form revisions." — inferred existence of these artifacts. Not established. Though "photographed FAA form" is stated as input to the existing tool — so the existence of photographed FAA forms in users' hands is weakly supported by the source (the existing tool reads photographed FAA forms, implying someone photographs forms). Hmm — that's a reasonable inference chain but still inference. I could mark: partially supported — source establishes the existing tool consumes photographed FAA forms, which implies at least some users have such photos; "legacy paper SDRs" specifically is not established.
- "Journalists hold FOIA productions; cold-case researchers hold pre-1995 paper." — inferred. Not established.
- Vendor dependency: "Input: video, image, text, file"; "Structured output to JSON schema"; "Context caching." — stated (verbatim in source).
- "Schema + decoder instructions cached as a prefix across a batch; per-page cost dominated by the image." — inference about mechanics/economics. Not established. "Long context is cheap" is stated by vendor (the source's phrasing), but my specific caching mechanics are inferred.
- "JSON aligned to SDR columns, landed in a searchable side-collection flagged as source: scanned, never silently merged..." — design proposal, inferred. Not established.
- "Extends the existing form decoder from single-form tool to batch tool." — partially: "separate tool that reads a photographed FAA form and decodes the boxes" is stated; "single-form" characterization is inferred. Mark mixed.
- "Handwriting, carbon copies, low-light phone photos." — inferred failure modes. Not established. (Source says nothing about scan quality.)
- "Abstention must be field-level..." — design proposal, inferred. Not established. (Source says the model "may abstain" for the plain-English accounts — so abstention as a capability is stated generally for that feature; but field-level abstention in the decoder is my proposal.) Actually careful: source says the plain-English account "may abstain." It does not say the form decoder abstains. So my claim that abstention exists in the decoder is inference; the general capability of the model to abstain is documented for one existing feature.
- "Redactions are a specific hazard: the model will hallucinate under black bars..." — inference. Not established.
- "Volume: if users only ever bring one form at a time, batch is over-engineering..." — inference. Not established.
- "Verdict: build now" — my judgment. Not established.
- "Take 20 real scanned pages a user actually has; measure field-level accuracy..." — my proposal. Not established. Also "field-level accuracy ~95%" threshold — mine.

**Idea 2:**
- Persona moments — inferred. Not established. ("Journalist about to print a part number" — printing not in source.)
- "the image is the ground truth; the crop is trivially derivable from it" — inference; also "crop" as model capability is not documented — the vendor lists inputs/outputs; producing crops would be a system capability, not necessarily model output. Not established.
- "matches the house style already established by the abbreviation provenance list" — the abbreviation provenance list is stated; "house style" framing is inferred. Mixed.
- Failure modes, fail argument, verdict, test — all inferred.

**Idea 3:**
- "Every user of the existing decoder, invisibly." — the decoder's existence stated; "every user" scope inferred.
- Pass 1/pass 2 design — inferred. Not established.
- "the ground truth is the image — unlike checking the model's prose against itself" — reasoning, inferred. Not established. Related: the existing contradiction-notice compares coded field vs narrative — that's stated — but my claim about self-verification soundness is my reasoning.
- "Correlated errors: the model can misread the same digit twice." — inference. Not established.
- "doubling per-page cost" — inference (two passes → twice the calls is arithmetic, but cost structure is not in source). Mostly inference.

**Idea 4:**
- Persona scenarios — inferred. Not established. E.g., "AD mandated inspection of a fuel pump in 2018 — do SDR write-ups keep coming afterward?" — my scenario.
- "The dataset can't measure compliance — no fleet or hours data — but post-AD failure-mode persistence is a legitimate lead." — The absence of fleet size/flying hours is stated; the conclusion about compliance is my inference. Mixed — split.
- "most dockets (≈200k–400k tokens) ingest in one pass; mega-dockets need sectioning" — token estimates are mine. Not established. 1M context stated.
- "Context caching — the same directive re-read across many queries" — capability stated; the usage pattern inferred.
- "Docket language... must match mechanic shorthand... the same vocabulary gap the existing narrative search already fights" — trade shorthand is stated; "the existing narrative search already fights" this gap is inferred (source doesn't say search struggles). Mixed.
- "errors are visible as weird result sets, not silent wrong answers — a forgiving failure surface" — inference.
- "SBs are not public; journalists hold them via FOIA or tips" — external knowledge, not in source. Not established. (FAA RGL, CAROL — external knowledge. Not established.)
- Verdict/test — inferred.

**Idea 5:**
- "The maintainer, after every change to the four drawn views." — four drawn views stated; workflow inferred.
- "No user file — the tool's own render. Different grounding, still legitimate" — inference.
- Vendor quote "the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs" — stated verbatim.
- "Screenshot the four views for a fixed fixture selection; model flags gross anomalies" — design, inferred.
- "Catches only gross, visible breakage... supplements unit tests... does not replace them" — inference.
- Fail argument, verdict, test — inferred.

**Rejected:**
- "Per-user render critic... The shading derives from the counts" — shading by zone write-up frequency is stated ("shaded by how often each zone is written up"); "derives from the counts" as determinism is inference (reasonable, but the rendering pipeline isn't described). Mixed — split. "Vision here is theater" — my judgment.
- "checking the account against the render is equivalent to checking it against the counts, which is text-only and auditable" — inference.
- "Video: Nobody holds relevant video. Journalists won't record sessions; agentic feedback is frames, not video; wreckage footage has no link to SDR text." — all inference. Not established. Note "Input: video" is a stated capability; my claim it's useless is my judgment.
- "GUI agents are fragile, and deadline journalism can't absorb flakiness" — inference. "RGL and CAROL have direct URLs" — external knowledge, not established.
- "Wreckage/photos for families... analytically vacuous and harmful" — inference about user holdings and ethics. Not established.

**Ranking table:** all my judgments. Not established.

**Open questions:** these are questions, framed for the maintainer — they presuppose my inferences. Each question's premise is inferred. I can note that the premises embedded are not established (e.g., "How do journalists currently verify decoder output" presumes they do — not established).

**What not to build:** all inference/judgment. "the zone view, which is already the one honest drawing in the tool" — side view of aircraft shaded by zone is stated; "one honest drawing" is my gloss. "an AI stamp of approval... manufactures trust" — my judgment. Final flourish sentences — inference.

Also the answer's very first line and framing: my inferences.

One more nuance: "1.76M records" — the source gives 1,757,828. Rounding is trivially derived; I can mark as stated (numeric restatement). "76 columns" — stated. "1995–present" — stated. "public, no auth" — stated (I used "no auth" implicitly? I don't think I mentioned it).

Also in Idea 1 I said "searchable against the 1.76M electronic records" — dataset scale stated; "electronic records" vs paper — the source doesn't explicitly say the 1.76M are electronic, but "Dataset: FAA Service Difficulty Reports, 1995 to present" with records filed by mechanics — implies electronic database; "electronic" is a mild inference. I can note it.

Also: my claim "the source says the model may abstain" applies to the plain-English account feature. In Idea 1 and elsewhere I proposed abstention for the decoder — the source doesn't say the decoder abstains. Flag.

Also the "vendor line" quotes: I must verify each quote against the source text:
- "Input: video, image, text, file" ✓ stated.
- "Output: text" ✓.
- "Context 1,000,000 tokens" ✓.
- "Structured output to JSON schema" ✓.
- "Context caching" ✓.
- "Function calling" ✓.
- "the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs" ✓ (source: "the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs").
- "long context is cheap" — source: "so long context is cheap" ✓ stated.

Good.

Now format. The user wants a marking pass. I'll structure:

- Short header: rules used (what counts as source; how I handle mixed sentences — split into clauses; my prompt from last turn counts as mine, not source).
- Then section-by-section, quoting each sentence (abbreviated where long) with tag [S] or [I] and for [I]: "not established by the source." For mixed: split.
- Maybe a summary count at the end? Could be useful: roughly X stated anchors, everything else inferred. And a note on which load-bearing claims are source-backed vs mine — a short "what actually rests on the source" summary. That adds value.

Length: this will be long by necessity, but I should compress quotes rather than reproducing every sentence verbatim in full — I can quote enough to identify the sentence. Use a consistent compact format, e.g.:

- "Sentence fragment…" — **S** (source: ...)
- "Sentence…" — **I** — not established by the source.

For mixed sentences: split with ⫽ or mark halves.

Let me draft the marking pass efficiently. I'll go section by section.

**Framing paragraph**
1. "Ruling constraint up front: the dataset has no images" — S (dataset contains no image/drawing/attachment).
2. "so vision's only honest jobs are (a) the paper world users bring in, and (b) the pixels the tool itself produces" — I. Not established.
3. "Everything below is filtered through that, plus the kill-test: name the user who holds the file, or the idea dies." — I (the kill-test is my construction from my prompt). Not established.

**Idea 1**
- Persona: "Journalist with a FOIA production: 300 scanned pages of pre-1995 paper SDRs... Form 8330 revisions" — I. Not established (FOIA, pre-1995 paper, form number — none in source; "Form 8330" is outside knowledge).
- "They want them searchable against the 1.76M electronic records, today." — I (want); "1.76M" traces to the stated 1,757,828; "electronic" is a mild inference.
- File/holder: "Scanned/photographed paper SDRs and legacy form revisions." — I. Not established, except that the source's existing tool consumes "a photographed FAA form," which implies such photos exist in some users' hands — that implication is itself my inference from the stated tool.
- "Journalists hold FOIA productions; cold-case researchers hold pre-1995 paper." — I. Not established.
- Vendor dependency bullets: "Input: video, image, text, file" — S. "Structured output to JSON schema" — S. "Context caching" — S.
- "Schema + decoder instructions cached as a prefix across a batch; per-page cost dominated by the image." — I. Not established. (Vendor says long context is cheap — S for that phrase — but the caching mechanics and cost dominance are mine.)
- Output: "JSON aligned to SDR columns, landed in a searchable side-collection flagged as source: scanned, never silently merged into the main corpus." — I. Not established.
- "Extends the existing form decoder from single-form tool to batch tool." — split: the decoder's existence is S ("a separate tool that reads a photographed FAA form and decodes the boxes"); "single-form" limitation is I — the source doesn't state its scope. Not established.
- Failure mode: "Handwriting, carbon copies, low-light phone photos." — I. Not established.
- "Abstention must be field-level ("tail: N___4_, 3 candidate readings"), not document-level." — I. The model "may abstain" is stated only for the plain-English account feature; abstention in the decoder is my proposal. Not established.
- "Redactions are a specific hazard: the model will hallucinate under black bars unless redaction regions are detected..." — I. Not established.
- Fail argument: "Volume: if users only ever bring one form at a time..." — I. Not established.
- "Verdict: build now — but size the batch feature to observed volume." — I. Not established.
- One-day test: "Take 20 real scanned pages...; measure field-level accuracy and abstention rate..." — I. Not established. "~95%" threshold — I.

**Idea 2**
- Persona: "Journalist about to print a part number...; relative reading a decoded work order about the accident that killed their family member." — I. Not established ("work order" is not a source artifact; relatives' use case is my construction from the stated user category).
- "Both need to see the source region with their own eyes." — I.
- File/holder: "Same documents as Idea 1." — inherits Idea 1's status: the underlying documents are I.
- Vendor dependency: "Input: … image" — S. "the image is the ground truth; the crop is trivially derivable from it" — I. Also note: crop production is a system feature, not a documented model capability — the vendor documents text output; whether the model can emit crop coordinates is not established.
- Output: "Every extracted field carries a crop of the source region, rendered beside the value." — I. Not established.
- "matches the house style already established by the abbreviation provenance list (record vs. model knowledge)" — split: the provenance list is S ("lists every abbreviation with whether the meaning came from the record or from the model's own knowledge"); "house style" framing is I.
- Failure: "Model mis-crops or crops the wrong instance of a repeated field." — I. "a wrong value with a crop is self-correcting; a wrong value without one is a published error." — I.
- Fail argument, verdict, test — I.

**Idea 3**
- "Every user of the existing decoder, invisibly." — decoder exists (S); "every user" scope (I).
- Vendor: "Input: … image" — S; "function calling for the second pass" — function calling S, its use here I.
- "Pass 1 extracts; pass 2 receives photo + extraction and verifies each field, abstaining on mismatches." — I. Not established.
- "This is the one place vision self-verification is sound, because the ground truth is the image — unlike checking the model's prose against itself." — I. Not established.
- "Correlated errors: the model can misread the same digit twice. Mitigate by varying the second pass (crop the box region, read the digit alone)." — I. Not established.
- "it raises accuracy but can't be treated as independent QA." — I.
- "measure whether the error rate on held-out fields drops enough to justify doubling per-page cost." — I (the two-pass cost doubling is arithmetic on my own design; no cost model in source).

**Idea 4**
- Persona scenarios (journalist with SB; analyst with 2018 AD on fuel pump; relative with NTSB docket describing chafed fuel line) — I. Not established.
- "The dataset can't measure compliance — no fleet or hours data" — split: absence of fleet size/flying hours is S ("does not contain: fleet size, fleet flying hours"); the conclusion "can't measure compliance" is my inference from that absence (reasonable, but the source doesn't make the claim). "post-AD failure-mode persistence is a legitimate lead" — I.
- File/holder: "ADs: public, FAA RGL — everyone. NTSB dockets: public, CAROL. SBs: not public; journalists hold them via FOIA or tips — availability uncertain, flagged below." — I throughout. RGL/CAROL and SB non-publicity are outside the source. Not established.
- Vendor: "Context 1,000,000 tokens" — S. "most dockets (≈200k–400k tokens) ingest in one pass; mega-dockets need sectioning, honest limit" — I (token estimates mine). "Structured output to JSON schema" — S (use here I). "Context caching" — S (pattern I).
- Output: "Extracted entities become pinned filters over the existing SDR search; results render in the existing views. New surface, connected at the search layer" — I. The existing search/views are S; the extension is I.
- Failure: "Docket language ('fuel line chafed against clamp') must match mechanic shorthand ('chafing fwd fuel line @ clamp')" — split: "Discrepancy is free text... in trade shorthand" is S; the specific mismatch problem between docket prose and shorthand, and "the same vocabulary gap the existing narrative search already fights," is I — the source does not say the narrative search struggles with vocabulary. Not established.
- "extraction errors here propagate into a search filter, so errors are visible as weird result sets... a forgiving failure surface." — I.
- Fail argument, verdict, test — I.

**Idea 5**
- "The maintainer, after every change to the four drawn views." — four views S; maintenance workflow I.
- "No user file — the tool's own render. Different grounding, still legitimate: the vendor claim — 'the model observes interfaces, rendered results and interaction feedback, and coordinates tasks across code, browsers and GUIs' — fits this exactly." — quote S; "fits this exactly" is I.
- "Screenshot the four views for a fixed fixture selection; model flags gross anomalies (all-one-shade zone map, empty axis, flipped scale)." — I.
- "Regression infrastructure, invisible to users." — I.
- "Catches only gross, visible breakage — subtler shading-scale bugs will pass. It supplements unit tests on the counts→shading mapping; it does not replace them." — I. (The shading-by-zone-frequency mapping is S; unit tests are I.)
- Fail argument, verdict, test — I.

**Rejected**
- Render critic: "The shading derives from the counts; checking the account against the render is equivalent to checking it against the counts, which is text-only and auditable." — split: shading is by write-up frequency per zone (S); "derives from the counts" as a determinism claim about the pipeline, and the equivalence argument, are I. Not established.
- "Vision here is theater. Kill: no information the render carries that the counts don't." — I.
- Video: "Nobody holds relevant video. Journalists won't record sessions; agentic feedback is frames, not video; wreckage footage has no link to SDR text." — I. Not established. ("Input: video" is S as a capability; my claim of no use is judgment.) "a user submitting a screen recording to report a bug — better served by screenshots" — I.
- GUI automation: "RGL and CAROL have direct URLs; HTTP fetch + file ingest covers retrieval without a browser driving itself. GUI agents are fragile, and deadline journalism can't absorb flakiness." — I throughout. Not established.
- Wreckage/photos for families: "Relatives may hold such photos, but describing a wreckage image connects to nothing in the SDR data and is ethically hazardous..." — I. Not established.

**Ranking** — all I. Not established. The tier labels are judgments.

**Open questions** — each question embeds an inferred premise:
1. Presumes journalists verify decoder output somehow — I.
2. Presumes a measurable single-pass error rate exists — I.
3. Presumes scanned forms arrive — I.
4. Presumes journalists bring SBs/ADs/dockets — I.
5. Presumes maintenance specialist reports exist in dockets — I (external knowledge).
6. Presumes fixture selections and shading unit coverage — I.

**What not to build** — all I. Specific splits:
- "Don't build visual ingestion of the dataset's world — there is none." — S-adjacent: dataset has no images (S); the imperative is I.
- "No image search, no 'similar aircraft,' no generated aircraft diagrams beyond the zone view, which is already the one honest drawing in the tool." — zone view S; "one honest drawing" gloss I.
- "Don't put the model in the user's render loop as a critic; the views are deterministic from the data, a text check against the counts is equivalent, and an AI stamp of approval... manufactures trust the pipeline hasn't earned." — I.
- "Don't build video. Don't build autonomous browsing as the default document path." — I.
- "Text-only already suffices for everything inside the dataset; vision's entire mandate here is the paper users carry in" — I.
- Final sentence about crops/uncertainty/abstentions and print/families — I.

**Header of previous answer** — covered above.

Now, summary. It's worth stating clearly at the end (or top): of the entire answer, the only load-bearing source-anchored elements are: the dataset facts, the four views, the existing features, the vendor capability list, and the user categories. Every user scenario, every document type, every failure mode, every verdict, every test, and every rejection is mine and not established by the source. That's an honest, useful summary.

I should also state my convention at the top: 
- **S** = appears in the SOURCE MATERIAL block (including verbatim vendor quotes within it).
- **I** = inferred/constructed by me — not established by the source. This includes everything carried over from the prompt I wrote last turn, since that prompt is also mine, not source.
- Mixed sentences get split.

Format: I'll compress quotes to identifiable fragments. Use bullet lists per section with tags. Keep it readable — maybe use a compact two-tag inline style. Given the volume, terse is right. I'll avoid reproducing full sentences verbatim where a fragment identifies them unambiguously.

Length check: this will be long, but the task demands completeness. I'll keep each entry to one line where possible. Headers matching the previous answer's sections. No need for a table — lists are cleaner for mixed splits.

One more consideration: should I mark things that are *implied* by the source vs *stated*? The user asked for "stated... or inferred." Strictly, implications I drew are inferences even when near-certain. E.g., "photographed FAA forms exist in users' hands" is implied by the decoder's existence but not stated. I'll mark those as I, with a parenthetical noting it's a near-direct implication of a stated fact — that's more honest than quietly upgrading implications to S. Actually the user's instruction is binary; I'll keep the binary but add brief parentheticals like "(direct implication of a stated fact, still not stated)" where useful. That respects the instruction while being precise.

Also: numbers I restated (1.76M ≈ 1,757,828; 200 long reports / 29 flagged) — mark S where I restated them. Did I? I used "1.76M" in Idea 1. And "1.76M records" in the framing? In the final "What not to build" I said "the 1.76M records"? Let me check: I said "searchable against the 1.76M electronic records" (Idea 1) and "comparable with the 1.76M records"? Actually in Idea 4 I wrote "so external documents become comparable with SDR fields" — hmm, in my earlier draft of the prompt it said "the 1.76M records" — in the executed answer, Idea 4 vendor bullet says "shaped to part numbers... so external docs become comparable with SDR fields." Fine. I'll mark the 1.76M occurrence in Idea 1.

Let me also double-check my previous answer for any other source-stated items I might have missed:
- "the four drawn views" — S.
- "the existing decoder" — S.
- "abbreviation provenance list" — S (feature stated).
- "the model 'may abstain'" — S for the plain-English feature.
- "29 flagged / 200 long reports" — did I cite it? I don't think I cited the 29/200 in the answer. Let me scan... No, I didn't reference it in the answer. Fine — nothing to mark.
- "what the crew was forced to do" view — referenced as "what the crew was forced to do" — S.
- "airline and tail" — I referenced "airline/tail breakdown"? In the answer I mentioned "the four views" generally and "zone view." Fine.

Also the final line of my answer: "...because these outputs end up in print and in conversations with people whose relatives died." — "relatives of people who died in aviation accidents" is S as a user category; the claim that outputs end up in print/conversations is I.

Alright, drafting the answer now. Structure:

**Conventions** (3-4 lines)

**Preamble / ruling constraint** — 3 entries

**Idea 1** — ~12 entries
**Idea 2** — ~8
**Idea 3** — ~7
**Idea 4** — ~10
**Idea 5** — ~7
**Rejected** — ~6
**Ranking** — 1 entry
**Open questions** — 6 entries (short)
**What not to build** — ~5

**Summary** — the load-bearing audit: what's actually anchored vs not. Maybe 5-8 lines + a blunt bottom line: "Roughly 90% of the answer is inference. The source constrains it but establishes almost none of it."

I'll use format:
- "fragment…" — **S** — *(source: "…")* where the anchor isn't obvious.
- "fragment…" — **I** — not established by the source.

For mixed: split with a ⫽ marker or into two bullets.

Keep quotes short. Go.