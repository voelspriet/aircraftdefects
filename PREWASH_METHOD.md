# The Prewash

You never write the long prompt yourself.

You type one short line saying what you want a prompt *for*. The model writes the
prompt. You read it. Then you say `execute prompt`.

---

## The three steps

```
1.  <short line asking for a prompt>     the model writes the prompt, you read it
2.  execute prompt                        it runs the prompt it wrote
3.  <grounding check>                     it marks every sentence stated or inferred
```

Step 3 is not optional. It is the step that caught a fabricated statistic in this
project, in an answer that was otherwise well argued and confident.

---

## Why writing the prompt yourself defeats it

A detailed prompt carries its author's assumptions in its adjectives.

Ask a model to *find the most alarming safety patterns in this aviation data* and
it will find alarm. Not because it is dishonest, but because that is the question
it was handed. The output will look like analysis and be a reflection of the
question. You will not see the reflection, because you wrote the question and it
felt neutral when you wrote it.

Hand it a short line and flat material instead, and it has to frame the question
itself. The framing becomes an artefact you can read, argue with, and reject. That
is the whole value: **the framing becomes visible**.

---

## Flat source material

The material in [`design/ask_glm.py`](design/ask_glm.py) is deliberately inert.
Counts, column names, three verbatim examples, and the three things the dataset
does not contain. No adjectives. No ranking. No hint about what would be
interesting.

Compare the two ways of describing the same field:

> **Loaded:** *Roughly 1.5 million free-text write-ups nobody has ever read at
> scale. This is the untapped goldmine.*

> **Flat:** *Discrepancy is free text written by the person filing. Present in most
> records. Three verbatim examples: ...*

The first tells the model what to conclude. The second lets it decide whether that
field matters, and it did, without being told.

---

## What it produced here

The human input to step 1 was one sentence:

> Give me a prompt to work out what to build on this dataset for these users.

From counts and column names alone, the model identified the three traps in the
dataset and built its own prompt around them: missing denominators, missing causes,
and a grieving non-expert audience. None of those words appeared in the material.

The prompt it wrote put a **data reality audit before any product idea**, made
rejection its own scored phase, and required a section headed **"What this product
will never claim."** Nobody asked for that section.

It also did arithmetic nobody requested. Given 3,945 operator designators of which
1,213 resolve, it wrote *"2,732 of 3,945 operator designators resolve to no name"*
and turned that into a product rule.

And it corrected the brief. The material placed a 1M-token context window beside a
1.76M-record dataset. The model caught the implication:

> 1M-token context (large slices of the dataset fit per pass; all 1.76M records do
> not)

and made batched pipelines a precondition instead of a later discovery.

---

## The grounding check

Step 3 is one sentence:

> Take your previous answer and mark each sentence as either stated in the source
> material or inferred by you. For anything inferred, say it is not established by
> the source.

On this project it produced 7,265 characters of self-audit, and inside it:

> "HowDiscoveredCode shows most findings are caught during scheduled inspection"
> — **[I] NOT established by the source.** The source lists HowDiscoveredCode as a
> column but gives no distribution. **I asserted a distribution I do not have.**

That claim was load-bearing inside one of its own recommended builds. Without step
3 the wrong column ships.

**What step 3 cannot do:** it flagged the claim as unverified. It could not tell
that it was false. Only the database could, and it was: that column is 47% *someone
looked at it*, 23% *other*, 19% *unknown*. The grounding check narrows what you
must check. It does not replace checking.

---

## Targeted, one per task

The Prewash is not one generic line reused forever. Each task gets its own short
line, and the loop repeats at every step:

```
give me a prompt to work out what to build on this dataset for these users
give me a prompt to work out what the visual and file capabilities could do here
give me a prompt to check your last answer against the source, line by line
```

Short in, long out. Never the reverse.

---

## Applied to a build, not just a plan

The same method wrote the interface. The model was handed 85,326 tokens of the
parent tool's real source, the working Flask app and its 219KB front end, with a
plain statement of what the page had to answer. Not a description of the house
style: the house style itself.

Fourteen minutes later it returned a complete page that matched the palette, the
fonts and the restraint. It carried over conventions nobody named, including
*"Free-text locations are kept and marked, never forced into a zone"*, which is the
parent tool's discipline stated in the parent tool's voice.
