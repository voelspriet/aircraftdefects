The crux your prompt needs to handle: the dataset has no images or attachments, so every idea has to be anchored in either (a) files users bring from outside, or (b) the model watching the tool's own rendered output. The prompt below forces both, forces every idea to name the file a real user actually holds, and forces explicit kills so you don't get a capability brochure.

```
You are advising the maintainer of a research tool built on FAA Service
Difficulty Reports (SDR), 1995–present: 1.76M records, 76 columns, coded
fields resolved against FAA lookup tables, plus a free-text "Discrepancy"
narrative written by mechanics in trade shorthand. Public data, no auth.

Already built, all text-only:
- Filtered search over coded fields; full-text search over Discrepancy.
- Four drawn views of a selection: month-by-month trend; an aircraft side
  view shaded by write-up frequency per zone; airline/tail breakdown; what
  the crew was forced to do.
- Per-record plain-English account of the write-up (model-generated, may
  abstain, lists every abbreviation with source: record or model knowledge).
- A notice when a coded field contradicts the same filer's narrative. On 200
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
from a file or frame that a user, a public source, or the tool's own
rendering actually supplies. Any idea that implicitly requires the dataset
to contain images is disqualified.

Explore at least these five axes; add others if warranted:

1. External documents users bring. Scanned or photographed paper: legacy
   paper SDRs, mechanic logbook entries, work orders, FAA form boxes beyond
   what the existing decoder handles, service bulletins, Airworthiness
   Directives, NTSB reports and docket PDFs, FOIA productions. For each:
   who realistically holds this file, in what volume, and what happens to
   the extracted data — a new comparable record, a merge against SDR
   fields, or context wrapped around a search?

2. File input at scale. 1M-token context plus JSON-schema output: whole
   dockets or directives ingested in one pass; extraction shaped to SDR
   columns so external documents become comparable with the 1.76M records;
   batch processing of many scans. Note where context caching changes the
   economics (repeated form decodes, re-reads of the same directive).

3. Visual as verification, not ingestion. The app draws; the model writes.
   Can the model be shown rendered output and check it: does the zone
   shading match the counts behind it, does the generated plain-English
   account contradict the drawn view or the record, does the form decoder's
   box reading match the photograph it came from? Where does render-and-
   check actually catch errors, and where is it theater?

4. Agentic use of browsers and GUIs. Pulling supplementary public documents
   (FAA, NTSB) that a search result points to; reproducing or regression-
   testing the tool's own interface; automating a multi-site lookup.

5. Video. Give an honest verdict. Candidates: screen recordings of a
   user's current research workflow, mapped onto the tool; interaction
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
  scan, a low-light photo — given these outputs may end up in published
  journalism or conversations with families of crash victims. What does
  abstention or confidence signaling look like here?
- The strongest argument it would fail. Then your verdict.
- The smallest test that would falsify it — doable in a day.

Then:
- Rank everything: build now / test first / reject.
- Include at least two explicit rejections with reasons. Do not pad.
- For each surviving idea, one open question only the maintainer can answer
  from their own audience or usage data.
- One paragraph: what you'd deliberately NOT build with vision here, and
  why text-only already suffices.

Write for a terse technical reader. No marketing language. If a capability
claim above doesn't support an idea, the idea is dead.
```

Notes on running it:

- **High or max reasoning.** The rejection pass is where low reasoning collapses into "everything sounds good."
- **Structured output.** The per-idea block maps cleanly to a JSON schema if you want the answers as data rather than prose — the model supports it, and it makes diffing two runs trivial.
- **Run it twice and diff.** Once with the five axes as written, once with the axes removed. Whatever survives only in the second run is probably noise; whatever survives both is probably real.
- **Tighten the "who holds the file" test with your own evidence.** The single biggest failure mode of this kind of exercise is ideas requiring documents no user actually has. If you know even roughly what your journalists and families bring you today (FOIA packets? NTSB dockets? phone photos of logbooks?), add those as named examples — it sharpens every downstream answer.