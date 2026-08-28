The user is building a tool on FAA Service Difficulty Reports (SDR) data. They have text-only capabilities built so far. They want a prompt to help them work out what GLM-5.3-Flash's visual and file capabilities could do with their dataset and product.

Key facts to keep in mind:
- The dataset is tabular/text: 1.76M records, 76 columns, coded fields + free text. NO images, no attachments, no drawings in the dataset itself.
- The model has visual input (image, video) and file input capabilities.
- Already built: a tool that reads a photographed FAA form and decodes boxes. So visual already has one use.
- Users: investigative journalists, researchers/safety analysts, relatives of accident victims.
- The model can also observe interfaces/rendered results/interaction feedback (agentic GUI use) — that's relevant for testing the product itself, or automating workflows.

So the interesting design question: what can visual/file input do when the data itself has no images? The user senses this tension — they explicitly note "What the dataset does not contain: ... any image, any drawing, any attachment." That's a deliberate constraint they've stated. So the prompt they need should force exploration of:

1. Visual capabilities applied to things OUTSIDE the dataset that flow INTO it or around it:
   - Scanned/handwritten SDR forms (already partially built) — but also legacy paper records pre-digital, NTSB forms, maintenance logbook pages, work cards, service bulletins, AD (Airworthiness Directive) PDFs, illustrated parts catalogs.
   - Users photographing documents: journalists with FOIA'd documents, relatives with accident report files, mechanics' logbooks.
   - Screenshots of other systems (e.g., FAA's own SDR search interface) to replicate queries.
   - Charts/graphs: users uploading published safety charts; the model reading them and linking to SDR records; or the model rendering its own charts and checking them (GUI loop).
   
2. File capabilities:
   - Ingesting whole PDFs (ADs, service bulletins, NTSB accident reports, incident docket files) and cross-referencing with SDR records — e.g., matching a defect narrative to a fleet-wide directive.
   - Batch file processing: users drag in hundreds of scanned forms; the photographed-form tool scales up.
   - Structured output: extract from PDFs to JSON schema matching SDR columns — turning external documents into comparable/mergeable records.
   - Large context: 1M tokens means whole accident dockets, multi-hundred-page reports can be ingested.
   
3. The agentic/GUI-loop capability:
   - The model can observe rendered results: could QA its own output — e.g., render the "side view of aircraft shaded by zone" and check the shading matches the data; verify the plain-English accounts against the record; test the product by driving the interface.
   - Could automate cross-site research: browse FAA/NTSB sites, pull supplementary documents.

4. Video:
   - Less obvious. Maybe recorded screen walkthroughs of a journalist's workflow? Deposition/hearing footage isn't really applicable. Video of interaction feedback is about the agent loop. Probably the weakest fit; the prompt should invite honest assessment of that.

The user asked: "Give me a prompt to work out what the visual and file capabilities could do here."

So they want me to write a prompt they can use — presumably with GLM-5.3-Flash itself, or with some assistant — to brainstorm/evaluate. The deliverable is a prompt. It should be well-crafted: give context, constraints, force grounded answers, prevent hallucinated dataset capabilities (e.g., the model imagining the dataset has photos), demand evidence of feasibility, separate "can do today" from "speculative," consider per-user-group value, consider failure modes (abstention, misreading handwriting), and define what a good output looks like.

Key design considerations for the prompt:
- It must embed the crucial constraint: dataset has NO images/attachments. So visual capability can't analyze SDR images — the exploration is about inputs from users and the world around the dataset, plus self-observation of rendered views.
- Force the model to distinguish between: (a) file/visual as ingestion of external documents, (b) visual as QA of the product's own rendered output, (c) agentic GUI use to operate other systems, (d) honest "no good use" verdicts where applicable.
- Should ask for concrete user stories per persona, with a falsifiable test for each idea, cost/latency notes (sparse attention makes long files cheap), risk notes (misread handwriting feeding journalists' stories is high-stakes — relatives of crash victims).
- Should demand the model cite which vendor capability claim each idea rests on, so it doesn't invent capabilities.
- Should include the calibration-in-progress context for the contradiction-notice, since visual/file features might extend it (e.g., checking a photographed form against a typed record).
- Should ask the model to rank ideas and kill some — a good prompt asks for rejections, not just a list.
- Maybe ask for a "what would change my mind / what to test first" section — a one-week prototype plan.

Format: The user wants a prompt. I should deliver the prompt as a copy-pasteable block, probably in a code fence or clearly delimited, with maybe a very short preamble and a couple of lines on how to use it / why certain elements are there. The prompt itself should be reasonably long but not bloated. Headers within the prompt are fine. Should I make it one prompt or offer variants? One solid prompt is better; maybe a short note on adapting it (e.g., run it at high reasoning, structured output option).

Length: This deserves a substantial prompt but not an essay. Maybe 400–700 words for the prompt itself, plus ~100 words of framing. The user is clearly technical and terse; their writing style is compressed. I should keep my framing minimal and let the prompt carry the weight.

Let me draft the prompt.

---

PROMPT DRAFT:

Role framing: You are helping the maintainer of a tool built on FAA Service Difficulty Reports figure out where GLM-5.3-Flash's visual (image, video) and file input capabilities create real value — and where they don't.

Context to paste in (the prompt should instruct the user to paste the source material, or I include it?): Since I'm writing the prompt for them, I can embed the facts inline so the prompt is self-contained. That's more useful — they can paste it straight in. I'll embed a compressed version of their source material inside the prompt.

Structure of the prompt:

1. Situation (compressed facts: dataset, what's built, what's absent, model capabilities, users).
2. The core question: given that the dataset itself contains no images or attachments, where do image/video/file input actually earn their keep?
3. Required exploration axes (to prevent shallow brainstorming):
   a. External documents entering the workflow: scanned/handwritten forms (legacy paper SDRs pre-1995? actually SDRs date back further on paper; FAA has paper records; also mechanic logbooks, work orders, service bulletins, ADs, NTSB reports, FOIA productions). For each: who supplies it, in what volume, what happens after extraction.
   b. File input at scale: 1M token context + structured output to JSON schema — whole-report ingest, cross-referencing SDR records against directive documents, batch form processing.
   c. Visual as verification: the vendor claims the model observes rendered results. The product draws four views; the model writes plain-English accounts. Can the model render-and-check — e.g., does the zone shading match the underlying counts, does the generated account contradict the drawn view or the record? Can it QA the form-decoder itself by comparing its box decode against the photo?
   d. Agentic use: browser/GUI — pulling supplementary documents from FAA/NTSB public sites, operating the existing search to reproduce a journalist's query, regression-testing the UI.
   e. Video: honest assessment. Probably screen recordings of user workflows, or nothing. Ask for a verdict, allow "no good use."
4. Hard constraints the ideas must respect:
   - The dataset has no images/attachments; any idea that implies it does is disqualified.
   - Each idea must name which vendor-documented capability it depends on (quote it). No invented capabilities.
   - Abstention and error tolerance: the plain-English account may abstain; the contradiction notice is at 29/200 and uncalibrated. Ideas must say what happens when the model misreads handwriting or a scan — especially for journalists publishing and relatives of victims.
   - Public data, no auth — but user-supplied documents may be confidential (FOIA embargoes, law firm docs). Note handling.
5. Output format:
   - For each idea: name, persona served, capability relied on (quoted), input the user actually has, what the system does, output, how it connects to existing features (extend vs. new), failure mode and mitigation, smallest test that would falsify it (one afternoon?).
   - Rank: build-now / test-first / reject. Require at least 2 explicit rejections with reasons (to force pruning).
   - One open question per idea that the user must answer from their own usage data/audience knowledge.
6. Ask the model to be adversarial: for each idea, state the strongest reason it would fail. Kill ideas that only sound good.

Also: the model has structured output to JSON schema — the prompt could offer that as an option for the answer itself. Nice touch but optional; I can mention it in a one-line note after the prompt.

Also worth prompting: distinguish "the model can see images" from "the user has images." The failure mode of this kind of brainstorm is ideas that need the user to possess scans they don't have. Force the idea to specify where the file comes from and how often.

Another axis: the photographed-form decoder exists; visual capabilities could extend to other FAA/NTSB paper forms (8240 forms? Malfunction/defect reports have specific forms — FAA Form 8330-2 is the Malfunction or Defect Report). I shouldn't over-specify forms I'm not sure of; the prompt can reference "the existing photographed-form decoder" generically and ask the model to enumerate what other document types users realistically hold.

Also: relatives of victims — they may have NTSB final reports, docket PDFs (facts reports, docket materials on NTSB CAROL), photographs of wreckage? NTSB dockets include photos sometimes. Journalists FOIA documents. So "user brings the file" is plausible for all three personas.

Video: could also be — a journalist records their screen walking through how they currently do research; the model watches and maps their workflow onto the tool. That's a genuine use of video input for UX research / onboarding. Also the model's "interaction feedback" loop is itself video-like. Worth listing as a test idea.

I should also make the prompt ask the model to consider what NOT to build — e.g., don't bolt on vision where text already suffices; the four drawn views are already rendered by the app, not the model, and may not need the model's eyes at all except for QA.

One more consideration: the prompt should tell the model the audience for its answer is the maintainer (technical, terse), and the output should be decision-ready, not a capability brochure. Ban marketing language.

Format of my response:
- One or two sentences of framing (why the prompt is shaped this way — especially the no-images constraint being the crux).
- The prompt in a code block or clearly delimited.
- A few brief usage notes (run at high reasoning; optionally request JSON schema; swap in real examples of user documents if they have them).

I'll keep my framing very tight since the user writes tersely. Maybe a short intro line, the prompt, then 3-4 bullet usage notes. Total maybe 600-900 words. The prompt itself maybe 500-700 words. Use markdown; code fence for the prompt so it's copyable.

Let me write the prompt carefully, compressed to match their style.

---

Draft prompt:

```
You are advising the maintainer of a research tool built on FAA Service
Difficulty Reports (SDR), 1995–present: 1.76M records, 76 columns, coded
fields resolved against FAA lookup tables, plus a free-text "Discrepancy"
narrative written by mechanics in trade shorthand. Public data, no auth.

Already built, all text-only:
- Filtered search over coded fields; full-text search over Discrepancy.
- Four drawn views of a selection: month-by-month trend; an aircraft side
  view shaded by write-up frequency per zone; airline/tail breakdown; crew
  action taken.
- Per-record plain-English account of the write-up (model-generated, may
  abstain, lists every abbreviation with source: record or model knowledge).
- A notice when a coded field contradicts the filer's own narrative. On 200
  long reports: 29 flagged; calibration in progress.
- A separate tool that reads a photographed FAA form and decodes the boxes.

The dataset contains no images, drawings, or attachments. Fleet size, flight
hours, causes, and accident records are also absent.

Model capabilities (vendor-documented only — do not assume others):
- Input: video, image, text, file. Output: text. 1M-token context, 128k max
  output. Structured output to JSON schema. Function calling. Context caching.
- Sparse/linear attention makes long inputs cheap.
- Vendor claims vision is "inside the working loop": the model observes
  interfaces, rendered results and interaction feedback, and coordinates
  tasks across code, browsers and GUIs.

Users: investigative journalists; researchers and safety analysts; relatives
of people who died in aviation accidents.

TASK
Work out where image, video, and file input create real value here — and
where they don't. The dataset itself has no images, so every idea must start
from a file or frame that a user, a public source, or the tool's own rendering
actually supplies. Ideas that implicitly require the dataset to contain
images are disqualified.

Explore at least these five axes; you may add others:

1. External documents users bring. Scanned or photographed paper: legacy
   paper SDRs, mechanic logbook entries, work orders, FAA form boxes beyond
   what the existing decoder handles, service bulletins, Airworthiness
   Directives, NTSB report and docket PDFs, FOIA productions. For each: who
   realistically holds this file, in what volume, and what happens to the
   extracted data (a new record? a merge against SDR fields? context for a
   journalist's query?).

2. File input at scale. 1M-token context plus structured output to JSON
   schema: whole docket or directive ingested in one pass; extraction
   shaped to SDR columns so external documents become comparable with the
   1.76M records; batch processing of many scans.

3. Visual as verification, not ingestion. The app draws; the model writes.
   Can the model be shown its own or the app's rendered output and check it:
   does the zone shading match the counts behind it, does the generated
   plain-English account contradict the drawn view or the record, does the
   form decoder's box reading match the photograph it came from? Where does
   render-and-check actually catch errors, and where is it theater?

4. Agentic use of browsers and GUIs. Pulling supplementary public documents
   (FAA, NTSB) that a search result points to; reproducing or regression-
   testing the tool's own interface; automating a journalist's multi-site
   lookup.

5. Video. Give an honest verdict. Candidate uses: screen recordings of a
   user's current research workflow mapped onto the tool; interaction
   feedback in the agentic loop. If the honest answer is "no good use,"
   say so and stop.

For every idea, state:
- Persona served and the concrete moment they'd use it.
- The file/frame the user actually has and where it comes from. If no real
  user plausibly holds that file, kill the idea.
- Which documented capability it depends on — quote the vendor line.
- What the system outputs and how it connects to what's already built
  (extends an existing feature vs. new surface).
- Failure mode: what happens when the model misreads handwriting, a bad
  scan, or a low-light photo — remembering these outputs may end up in
  published journalism or in conversations with families of crash victims.
  What does abstention or confidence signaling look like here?
- The strongest argument it would fail. Then your verdict.
- The smallest test that would falsify it — something doable in a day.

Then:
- Rank everything: build now / test first / reject.
- Include at least two explicit rejections with reasons. Do not pad.
- For each surviving idea, one open question only the maintainer can answer
  from their own audience or usage data.
- One paragraph: what you'd deliberately NOT build with vision here, and why
  text-only already suffices.

Write for a terse technical reader. No marketing language. If a capability
claim above doesn't support an idea, the idea is dead.
```

That's pretty good. Length is okay — dense but each line earns its place. Let me reconsider a few things:

- Should I include the specific "29 flagged, calibration in progress" — yes, kept.
- Should I mention 320B/18B params? Not needed for capability brainstorming; cost/latency matters more than size. I mention sparse attention → long inputs cheap. Good.
- Should I ask about cost/caching? Could add a line: "Note where context caching changes the economics (repeated form decodes, repeated docket re-reads)." Nice, adds practicality. I'll add briefly.
- Video axis: good.
- Should the prompt tell the model to ask clarifying questions first? Maybe optional; better to make it produce an answer with "open questions" section, which I have.

Usage notes after the prompt (brief):
- Run at high or max reasoning; the rejection pass is where low reasoning collapses.
- If they want the answer back as data, wrap the per-idea block in a JSON schema (the model supports structured output).
- Replace/add real document types once they know what their users actually hold — the "who holds the file" test is the one most worth tightening with their own evidence.
- Consider running it twice: once constrained to ideas extending existing features, once free-form, and diff.

Keep those notes to 3-4 bullets.

One more check: the user said "Give me a prompt to work out what the visual and file capabilities could do here." They might intend to run the prompt against GLM-5.3-Flash itself (self-assessment of capabilities) — my prompt works for that, and also works if they paste it to any model. Good either way. I might note that asking the model to quote vendor capability claims keeps it honest about its own specs.

Formatting: intro one or two sentences, then the code block, then "Notes" bullets. Keep intro tight — maybe note the crux: the dataset has no images, so the prompt's job is to force ideas anchored in files users actually hold and in the model watching its own output, and to force kills.

I'll trim the prompt slightly for length. Also make sure not to use em dashes excessively... actually no such constraint; fine. Use their vocabulary: "write-up," "view," "decode the boxes."

Final structure decided. Write it.