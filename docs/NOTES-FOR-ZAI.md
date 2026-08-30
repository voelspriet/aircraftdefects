# Notes for the people who build GLM

Written 30 August 2026, after two days of using GLM-5.3-Flash to rebuild a working
tool from written instructions rather than from code handed to it: 47 briefs, 7.7
hours of model time, 3,864,833 characters of reasoning and 1,058,209 of written
output. Every figure here comes from the logs in `rebuild/`, which are committed,
so all of it can be checked rather than taken on trust.

We are sending this because the model did the job and we learned a lot doing it.
The notes below are offered in the spirit of a bug report from someone who used
the thing seriously for two days, not as a verdict.

---

## What it built

An instrument over 1,757,827 FAA service difficulty reports. Four rails that
answer when, where, who and what the defect forced. An aircraft diagram shaded by
where the trouble sits, with clickable zones. Nineteen filters, eighteen starter
questions, a record table carrying the mechanic's own words, a case sheet with
seventeen named fields as a focus-trapped dialog, sixteen panels, a phone layout,
and nine research features it designed itself.

It wrote all of it. At the time of writing, 97.4% of the served page is the
model's, and the 2.6% that is not is itemised in `MODEL_USE.md` with the file
sizes, because a claim like that is worth nothing unless it is checkable.

Three things stood out and we want to say them first, because they are the reason
the rest of this document was worth writing.

**It argues with the brief when the brief is wrong.** Asked to make every control
24px tall, it came back with two links that sit inside sentences, explained that
inflating them would break the line, offered a padded hit box with negative
margins, and then asked whether that counted as cheating. It was right, WCAG 2.5.8
exempts inline links for exactly that reason, and we loosened our own check
because it asked.

**It refuses to invent an answer when the data cannot support one.** One of its
own nine features assumed the FAA file could be queried by part number. It cannot:
`part=` searches part names, and no parameter anywhere searches a number. Rather
than return a confident zero for a part the reader was reading a report about, it
rewrote the feature to count what the file does record and to say in plain words
what the file cannot answer.

**It reports contradictions in the source instead of computing them away.** Told
to show the hours between two write-ups, it found records where the FAA's own file
reports fewer airframe hours on the later report than on the earlier one, and
printed "the file's own hour readings do not agree" rather than a number or a
negative.

That instinct, to say what it cannot do instead of producing something
answer-shaped, is the most valuable property of the model for journalism work.
Everything below is a cost we would pay again to keep it.

---

## 1. It uses tools well, and nothing in the API suggests you should give it any

We want to correct an impression we nearly formed ourselves. The model is not
blind. We built a loop giving it four tools, `measure(js)` running JavaScript in a
real browser against its own page, `parent(js)` against the tool it was matching,
`deploy(css, js)`, and `done()`. It drove that browser itself, shipped its own
code, read the numbers back and corrected itself. Measured:

    the tab strip     747px  ->  100px      target 104, the model measuring
    the phone      160 errors ->  0
    the page height  3,448px -> 1,802px

Those are the model's own rounds, not ours. When it can look, it looks well.

The gap is the harness, not the model. We reached GLM through
`chat/completions`, so the eyes had to be built before it could have any, and for
most rounds we did not build them. Every expensive fault below happened in rounds
where we called it one-shot, which was our decision.

**Where we think you could help.** Nothing in the API, the docs we read, or the
model's own behaviour nudges a caller toward giving it a way to check its work.
A worked example of a verify-and-correct loop, sitting next to the function
calling documentation, would have saved us most of two days. We built ours in
about thirty minutes once we thought of it.

---

## 2. When it cannot check a name, it will assume one, and it assumes confidently

This is the fault that cost the most rounds, and it appears in five costumes:

    it wrote        window.caseSheet          the page calls openCase
    it wrote        .vgroup .vlab .tab        the page has .vg .vglab .vtab
    it wrote        getElementById('noRows')  with a legend of '#zones li'
    it wrote        #vstrip .vglab            losing to #vstrip.vgroups .vglab
    it wrote        RECORDS                   a global this service never had

Each is correct in itself. Each deploys with no console error, no failed request,
no missing element and no effect. Running every selector in an answer against the
live DOM before splicing became our best single predictor of whether a round would
land:

    round 43     16 of 38 selectors matched nothing
    round 43b     2 of  8
    round 43c     0 of  6

The three rounds are the same task. They differ in how much real markup the brief
carried.

We want to be fair about this: a person writing CSS for a page they have not
opened would do exactly the same. The problem is not that it guesses, it is that a
guessed identifier is written with the same confidence as a given one, so a caller
cannot tell them apart without checking every name by hand.

**Where we think you could help.** Any signal that separates "you told me this
name" from "I inferred this name" would be worth a great deal. A convention where
the model lists the identifiers it assumed at the top of an answer would do it,
and costs almost nothing.

---

## 3. Give it the source it is being asked to change

The cleanest evidence we have, because it is the same task run twice.

Round 44 asked for two service views "whole" and did not include them. Round 44b
asked for the same two views and pasted them in.

                      brief      time   reasoning   written   outcome
    without source    4,528 ch   294s     39,460     5,193    invented a global,
                                                              dropped six fields
    with source       7,219 ch   173s     18,541     5,775    fixed the sort,
                                                              changed nothing else

Half the time, half the reasoning and a working answer, for 2,691 more characters
of prompt.

The same effect at the other end. Round 43c named *why* the previous rule had had
no effect, that one selector out-specified another, and finished in **64 seconds**.
Round 43b, which asked it to hunt a fault that did not actually exist, spent
**1,295 seconds and 191,878 characters of reasoning**.

**Where we think you could help.** In 47 rounds it never once said "I cannot see
the markup you are describing, please send it". It is a good enough reasoner to
know when it is working from a description rather than from a source, and saying
so would have saved us hours. Asking for the missing thing is cheaper for everyone
than guessing at it well.

---

## 4. `max_tokens` covering reasoning and writing together is a sharp edge

Median reasoning-to-writing ratio across 40 completed rounds: 4.5 to 1, ranging
from 0.3 to 14.3. That is fine and often it is the reasoning that makes the answer
good.

The edge is this. We lost a round to a 40,000-token budget spent **entirely** on
reasoning: 918 seconds, zero characters written, no error, and a successful
response, because nothing had gone wrong. Another round reasoned for 378,982
characters, wrote 66,122 and was cut off mid-function.

**Where we think you could help.** A distinct finish reason for "budget exhausted
during reasoning" as against "finished writing" would let a caller retry
intelligently instead of guessing. Separate budgets would be better still. As it
stands, a large brief with a small budget silently buys thought that nobody ever
reads.

---

## 5. Comments describe the intended change rather than the emitted one

Three times a block arrived with a comment describing work the block did not
contain:

    "The old boot-capture block and the setSiblings loop are deleted."
        They were not, and an appended block has no channel to delete anything.
    "the script below copies the body's computed background onto the root"
        There was no such script. The CSS rule alone was correct and sufficient.

The code in both cases was fine. The comment was a description of the plan. In a
repository whose whole argument is that it counts its own seams honestly, a source
file asserting something untrue about itself is a problem of its own, and a
reviewer reading the comment believes the change happened.

**Where we think you could help.** Anything that makes the comment a description
of the code actually emitted, rather than of the intention, removes a whole class
of false claim at no cost to the reader.

---

## 6. Whole-block replacement quietly drops earlier work

"Return your previous block, whole, with this fixed" is the right instruction for
coherence and a hazard for memory. Round 42's block contained a fix for a hover
reflow. Rounds 42b and 42c were each asked for a whole replacement, each repaired
the sheet correctly, and each dropped the hover fix with it. The measurement went
46 shifted controls, then 1, then 46 again, and the answer did not mention the
omission.

**Where we think you could help.** A short "carried forward / dropped" list when a
model is handed its own previous output would cost a few dozen tokens and would
have saved us two rounds.

---

## 7. The tool loop converges beautifully and stalls on a blank page

Eight tool-driven runs, 187 steps.

    task shaped "this number is wrong"     succeeded every time, see section 1
    task shaped "build this feature"       four runs, four failures
      two runs: 0 deploys in 18 and 26 steps
      two runs: 1 deploy each, the one they were instructed to make first

With a number to converge on it converged. With a blank page it explored, reading
source it had already been given, until the step budget ran out. Adding "your
first tool call must be deploy" produced exactly one deploy and then more
exploring.

We are genuinely unsure whether this is the model or our harness, and we say so
rather than assert it. Our loop never told the model how many steps remained or
what a step cost, so it had no way to budget. It may simply be that an agent
cannot pace itself against a budget it cannot see.

**Where we think you could help.** If there is a recommended way to expose
remaining budget to a tool-using model, we did not find it, and it would have
changed how we used the loop.

---

## 8. Streaming, and a wrong lesson we nearly learned

Two long jobs died, a 502 from the gateway and a reset connection on retry. The
obvious explanation was prompt size, and the numbers said otherwise:

    run 1  SUCCEEDED   85,326 tokens in   850s
    run 2  FAILED      28,729 tokens in   502
    run 3  SUCCEEDED   10,582 tokens in   216s

The successful run had three times the input of the failing one. What separated
them was how long the socket stayed silent. `stream: true` fixed it and it has not
recurred in 47 rounds.

This is documented and we found it the slow way. It may be worth saying more
loudly in the places a caller looks first, because the failure presents as a size
problem and is not one.

---

## The short version

The model reasons well, writes a great deal of correct code, argues with a brief
when the brief is wrong, and refuses to invent an answer the data cannot support.
We would use it again for this kind of work, and we are going to.

Nearly everything expensive in these two days came from one gap: it cannot check
a name unless we give it a way to, and it does not tell us when it is guessing.
Both halves are addressable, and the second is cheap.

    a brief naming why the previous rule failed        64 seconds
    the same task, source omitted then included    294s -> 173s
    selectors matching nothing, over three rounds  16/38 -> 2/8 -> 0/6
    when given a browser, it fixed its own work    747px -> 100px
