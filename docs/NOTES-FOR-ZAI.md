# Notes for the people who build GLM

Written 30 August 2026, after two days of driving GLM-5.3-Flash to rebuild a
working tool: 47 briefs, 7.7 hours of model time, 3,864,833 characters of
reasoning and 1,058,209 of written output. Every number here is measured from
the logs in `rebuild/`, which are committed, so anything below can be checked
rather than taken.

This is not a complaint. The model built the thing: an instrument over 1,757,827
FAA service difficulty reports, four rails, sixteen panels, nine research builds,
a phone layout and a case sheet, from written instructions rather than from code
handed to it. What follows is what cost the most, with the evidence, in the order
we would want to hear it if we built the model.

---

## 1. The dominant failure mode is writing correct code against a name that does not exist

This one fault, in five costumes, accounts for more lost rounds than everything
else combined.

    it wrote        window.caseSheet          the page calls openCase
    it wrote        .vgroup .vlab .tab        the page has .vg .vglab .vtab
    it wrote        getElementById('noRows')  with a legend of '#zones li'
    it wrote        #vstrip .vglab            losing to #vstrip.vgroups .vglab
    it wrote        RECORDS                   a global this service never had

Every one is correct in itself. Every one deploys with no console error, no
failed request, no missing element, and no effect. Selector survival, measured
per round by running each selector against the live DOM:

    round 43     16 of 38 selectors matched nothing
    round 43b     2 of  8
    round 43c     0 of  6

The score predicted the outcome exactly each time. The three rounds differ in one
respect: how much of the real markup the brief contained.

**What would help.** The model has no way to signal "I am guessing this name". It
writes an invented selector with the same confidence as one it was given. A
calibration signal on identifiers specifically, or a convention where the model
lists the names it assumed at the top of an answer, would let a caller check the
cheapest thing first. We ended up doing this by hand and it became the single
most reliable predictor in the loop.

---

## 2. Give it the source it is asked to change, and everything improves at once

The cleanest evidence in the whole project, because it is the same task twice.

Round 44 asked for two service views "whole" and did not include them.
Round 44b asked for the same two views and pasted them in.

                      brief      time   reasoning   written   ratio
    44 without source  4,528 ch   294s     39,460     5,193     7.6
    44b with source    7,219 ch   173s     18,541     5,775     3.2

Without the source it invented a plausible implementation against a global that
does not exist and dropped six response fields. With the source it fixed the
sort and changed nothing else. Half the time, half the reasoning, and a usable
answer instead of a broken one, for 2,691 more characters of prompt.

The same pattern at the other end of the scale: round 43c named *why* the
previous rule had no effect (one selector out-specifying another) and finished in
**64 seconds**. Round 43b, which asked it to hunt a fault that did not exist,
spent **1,295 seconds and 191,878 characters of reasoning** and produced a block
that missed two of eight selectors.

**What would help.** Nothing in the API discourages an underspecified prompt, and
the model does not push back on one. It never once said "I cannot see the markup
you are describing, send it". A model that asks for the thing it is about to
guess at would have saved us hours.

---

## 3. Reasoning has no floor and no visible ceiling

Median reasoning-to-writing ratio across 40 rounds: **4.5 to 1**. The range:

    0.3   round 39, 15,039 reasoned, 56,953 written
    14.3  round 42c, 169,206 reasoned, 11,858 written

The worst cases correlate with briefs that ask for something impossible or
already true. Round 47 spent 1,963 seconds and 257,226 characters and produced a
block aimed at names that do not exist. Round 04 spent 378,982 characters of
reasoning, wrote 66,122, and was cut off mid-function.

That last one is the trap worth naming loudest.

**`max_tokens` covers the reasoning and the writing together.** A large brief with
a small budget buys thought nobody ever reads and returns nothing. We lost a
round to a 40,000-token budget spent entirely on reasoning: 918 seconds, zero
characters written, and no error, because nothing had gone wrong. The API
reported success.

**What would help.** Separate budgets, or at minimum a distinct finish reason for
"budget exhausted during reasoning" as against "finished writing". A caller
cannot currently distinguish a model that thought too long from one that had
nothing to say.

---

## 4. It narrates the change it intended, and the narration ships

Three times a block arrived carrying a comment describing work the block did not
contain.

    "The old boot-capture block and the setSiblings loop are deleted."
        They were not. An appended block has no channel to delete anything.
    "the script below copies the body's computed background onto the root"
        There was no such script. The CSS rule alone was correct and sufficient.
    a whole replacement dialog, correct in every detail, exported under a name
        nothing calls

This is worse than a wrong comment. In a repository whose argument is that it
counts its own seams honestly, a source file asserting something false about
itself is a problem in its own right. And a reviewer reading the comment believes
the change happened.

**What would help.** The model appears to write its comments from its plan rather
than from its output. Anything that made the comment a description of the emitted
code rather than of the intention would remove a whole class of false claim.

---

## 5. Tools helped for convergence and hurt for creation

We built a loop giving the model four tools: `measure(js)` against its own page in
a real browser, `parent(js)` against the tool it was matching, `deploy(css, js)`,
and `done()`. Eight runs, 187 steps.

    task shaped "this number is wrong"     succeeded every time
      the tab strip   747px -> 100px       (target 104)
      the phone       160 page errors -> 0
      the page        3,448px -> 1,802px

    task shaped "build this feature"       failed four times out of four
      27-content, 34-click: 0 deploys in 18 and 26 steps
      33-reach, 36-dead:    1 deploy each, both the one they were ordered to make

The pattern is consistent: with a number to converge on, it converged. With a
blank page, it explored until the step budget ran out, reading source it had
already been given. Adding "your first tool call must be deploy" produced exactly
one deploy and then more exploring.

Every feature in this project was written by the one-shot path instead. The
division that worked in the end: one brief and one answer to create, the tool
loop to correct.

**What would help.** This looks like a missing sense of budget. The model does not
appear to model "I have 26 steps and have spent 18". An agent that could see its
own remaining budget, or that was told the cost of a step, might stop reading and
start writing.

---

## 6. "Replace your previous block whole" silently discards unrelated work

Asking for a whole replacement is the right instruction for coherence and the
wrong one for memory. Round 42's block contained a fix for a hover reflow. Rounds
42b and 42c were each asked to "return a block replacing your previous one whole"
and each repaired the sheet correctly and dropped the hover fix with it. The
measurement went 46 shifted controls, then 1, then 46 again.

It did not mention the omission. Three rounds in, a caller has no way to know
which earlier fixes a replacement is quietly leaving behind.

**What would help.** When a model is handed its own previous output and asked to
replace it, a short "carried forward / dropped" list would cost almost nothing
and would have saved us two rounds.

---

## 7. Streaming, and a wrong lesson we nearly learned

Two long jobs died: a 502 from the gateway and a reset connection on retry. The
obvious explanation was prompt size, and the numbers said otherwise:

    run 1  SUCCEEDED   85,326 tokens in   850s
    run 2  FAILED      28,729 tokens in   502
    run 3  SUCCEEDED   10,582 tokens in   216s

The successful run had three times the input of the failing one. What separated
them was how long the socket stayed silent. `stream: true` fixed it and it has
not recurred in 47 rounds.

This is documented behaviour and we found it the slow way. It is worth saying
louder in the places a caller looks first, because the failure presents as a size
problem and is not one.

---

## What we would keep

Honesty under instruction is the thing that surprised us most, and it is worth
protecting in whatever comes next.

Asked to make every control 24px, the model came back with two links inside
sentences and said inflating them would break the line, offered a padded hit box
with negative margins, and then asked whether that counted as cheating. It was
right, the standard agrees with it (WCAG 2.5.8 exempts inline links), and we
loosened our own check because it asked.

Asked to fix a build that could not work, it said so. `/api/search?part=` searches
part names, not part numbers, and no parameter anywhere searches a number. Rather
than returning a confident zero, it rewrote the feature to count what the file
records and to state in plain words what the file cannot answer.

Told to show a duration between two write-ups, it found records where the FAA's
own file reports fewer airframe hours on the later report than the earlier one,
and printed "the file's own hour readings do not agree" instead of a number.

That instinct, to say what it cannot do rather than produce something shaped like
an answer, is the most valuable thing in the model for this kind of work. Every
other item on this list is a cost we would pay again to keep it.

---

## The one-line version

The model writes well and cannot see. Almost everything expensive in these two
days came from the gap between those two facts, and almost everything that closed
that gap was putting the real thing in front of it: the markup, the source, the
measurement, the reason the last attempt had no effect.

    a brief naming why the previous rule failed        64 seconds
    the same task, source omitted then included    294s -> 173s
    selectors matching nothing, over three rounds   16/38 -> 2/8 -> 0/6
