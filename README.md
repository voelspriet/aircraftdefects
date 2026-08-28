# aircraftdefects.com /z

New research functions for [aircraftdefects.com](https://aircraftdefects.com), built on
**GLM-5.3-Flash**, for three audiences: investigative journalists, safety
researchers, and relatives of people who died in aviation accidents.

The corpus is every FAA Service Difficulty Report published since 1995:
**1,757,828 records**, 54,634 aircraft, filed by mechanics when something on an
aircraft fails, malfunctions, or is found defective. It is entirely public and
almost entirely unread, because roughly 1.5 million of those records carry a
free-text write-up in trade shorthand that no structured search reaches.

Built for the [GLM-5.3 Flash Lightning Hackathon](https://cerebralvalley.ai/e/glm-5-3-flash-lightning-hackathon),
28 August to 1 September 2026. MIT.

---

## The method: the model designs, and we keep the receipts

The features here were not specified by a human and then handed to a model to
implement. The model was given flat source material and asked to work out what
should be built. Every turn of that session is committed to this repository,
including the reasoning traces, so the claim can be checked instead of believed.

The technique is the **Prewash**: you never write the long prompt yourself.

| | What happens | Artefact |
|---|---|---|
| **Step 1** | A human types one short line asking for a *prompt*, not a plan and not an answer, alongside source material stripped of adjectives | [`design/01-prompt-the-model-wrote.md`](design/01-prompt-the-model-wrote.md) |
| **Step 2** | The human reads what the model wrote, then types `execute prompt` | [`design/02-answer.md`](design/02-answer.md) |
| **Step 3** | The human makes it mark every sentence as stated by the source or inferred | [`design/03-stated-vs-inferred.md`](design/03-stated-vs-inferred.md) |

The entire human input to step 1 was one sentence:

> Give me a prompt to work out what to build on this dataset for these users.

### Why not simply write the prompt

A detailed prompt carries its author's assumptions in its adjectives. Ask a model
to "find the most alarming safety patterns" and it will find alarm, because that
is the question it was handed. The answer will look like analysis and will be a
reflection.

Handing the model a short line and flat material forces it to frame the question
itself, and the framing becomes an artefact you can read, argue with, and reject.

The source material in [`design/ask_glm.py`](design/ask_glm.py) is deliberately
inert: counts, column names, verbatim examples, and the three things the dataset
does not contain. No adjectives, no ranking, no hint about what would be
interesting.

### What that produced

The model was told nothing about pitfalls. From counts and column names alone it
identified the three traps in this dataset, and built its prompt around them:
missing denominators, missing causes, and a grieving non-expert audience.

It also **corrected the source material**. The brief placed a 1M-token context
window next to a 1.76M-record dataset. The model caught the implication:

> 1M-token context (large slices of the dataset fit per pass; all 1.76M records do not)

and made batched pipelines a precondition rather than a later discovery.

It did arithmetic nobody asked for. Given 3,945 operator designators of which
1,213 resolve, it wrote "2,732 of 3,945 operator designators resolve to no name"
and turned that into a product rule.

And it **refused the decision that was not its to make**. On whether relatives
should see one airframe's defect history:

> it's the highest-stakes design decision in the whole plan and it shouldn't be
> left to the model.

The prompt it wrote puts a data reality audit before any product idea, makes
rejection its own scored phase, and requires a section headed **"What this
product will never claim."** Nobody asked for that section.


So the tool stopped trying to produce a rate and built a ledger instead:
**[aircraftdefects.com/z/conflicts](https://aircraftdefects.com/z/conflicts)**.

It fills up from ordinary use. A reader opens a report, presses *Say this in plain
English*, and if the model notices the ticked box disagreeing with the paragraph,
that case is written down with its record number. Nothing sweeps the file, so the
ledger's size measures attention rather than prevalence, and the page says so at
the top. Every row carries two buttons, *this holds* and *this is wrong*, and both
counts are kept, because a case where a human overrules the model is the more
interesting row.

---

## What it found in the file

Building on this data turned up things about the data itself, written up in
[docs/FINDINGS.md](docs/FINDINGS.md) with the scripts to reproduce them.

The first one is a retraction, and it is left in on purpose. A pass over 200 long
reports appeared to show that **14.5% carry a coded field their own narrative
contradicts**. An adversarial check then cut that to 2.0%, and inspecting the check
showed one of its three adjudicators had refuted every flag it ever saw, which
makes it a constant rather than a judge. Neither number survives.

What survives is four documented cases, including an engine recorded as shut down
in flight when the aircraft was on the ground and it was the APU, and an
unscheduled landing recorded over a narrative reading `CONTINUED TO DESTINATION`.
The disagreements are real. The rate is unknown until a human labels the sample.

## How the model is used

| Setting | Value | Why |
|---|---|---|
| Model | `glm-5.3-flash` | The only member of the GLM-5 series that accepts images. GLM-5.3 is text only. |
| Reasoning | `max` for design, `low` for extraction | Reasoning cannot be disabled on this family and defaults to `max`. Max on a transcription task is billed thinking about boxes that only need reading. |
| `thinking.clear_thinking` | `false` | Vendor recommendation; keeps the reasoning trace, which is what makes the sessions auditable. |
| `temperature` / `top_p` | 1 / 0.95 | Vendor recommendation for this model. |

Reasoning effort is a deliberate, declared choice per task, never disabled.

---

## The rule the whole thing is built on

**The model reads. The tables decide.**

The model is never asked what a code means. Meaning comes from the FAA's own
published lookup tables, applied in code. A code absent from those tables is
displayed as the raw code and labelled undecoded.

Asked to interpret, any model will produce a plausible expansion for a code it
has never seen and will not flag the guess. On a public safety record that is not
a small error. It is a fabricated fact wearing the formatting of a real one, and
a reporter cannot tell the difference.

## What this will never claim

Carried over from the parent tool, and non-negotiable:

- Not an accident database, and not a safety ranking.
- No league tables of operators by report count. The dataset contains neither
  fleet size nor flying hours, so no rate can be computed from it.
- No causal language. The dataset does not record the cause of a defect.
- A write-up is a defect that maintenance **caught**. That is usually the system
  working, not failing.
- Every number shown must be traceable to records the reader can open.

---

## Reproducing the design session

```bash
python3 -m venv .venv && ./.venv/bin/pip install requests flask python-dotenv
echo "ZAI_API_KEY=your-key" > .env
./.venv/bin/python design/ask_glm.py
```

Writes every turn to `design/`, with reasoning traces and a `.meta.json`
recording model, effort, wall time and token usage for each.
