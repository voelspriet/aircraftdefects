# rebuild/

Every round that built the page, in order. Nothing here is edited after the fact:
a round that went wrong stays as it was, because the record of what the model was
asked and what came back is the evidence the rest of the repository rests on.

## How to read a round

Each round is numbered and leaves four files:

    NN-name.prompt.txt      what the model was asked, verbatim
    NN-name.md              what it answered
    NN-name.reasoning.md    its reasoning trace, kept deliberately
    NN-name.log             time, characters reasoned, characters written

Answers that shipped were split into the blocks the page is built from:

    NN-name.js / NN-css.css / NN-dom.js

A letter after the number means the same fault was handed back with what the
measurement showed: `43`, then `43b`, then `43c`.

## Where to start

    01-instrument     the first round, and the largest single answer
    ask.py            the driver: one brief in, one answer out
    agent.py          the same model with four tools, including a real browser
    build_all.py      the one place that says what the page is made of, in order
    splice.py         merges the blocks and renames the collisions that fail
                      in silence
    specs/            12,243 words of behavioural specification, written before
                      the code and used as the brief

## Two files that are not the model's

    bridge.js.bak     hand-written, 13,226 characters. It joins the two halves
                      the model built separately, each of which assumed the
                      other existed. Counted in ../MODEL_USE.md.
    47-hand.js        a hand fix, disclosed and counted in the same table.

Everything else on the page came back from the model. The share is counted, with
file sizes, in [../MODEL_USE.md](../MODEL_USE.md).

## The rounds worth reading, if you only read a few

    04-search         the longest: 2,553 seconds, 378,982 characters of
                      reasoning, cut off mid-function because max_tokens covers
                      the thinking and the writing together
    23-axis           a flex-basis that became a height, because the page had
                      already set the axis and the answer set only the rest
    42, 42b, 42c      the same fault three times: a correct replacement dialog
                      that nothing called, then the repair that worked
    44, 44b           the same task asked twice, once from a description and
                      once with the source. 294 seconds against 173.
    43c-strip         64 seconds, because the brief named why the previous
                      attempt had had no effect

What those rounds cost, and what they taught, is in
[../docs/FINDINGS.md](../docs/FINDINGS.md) and
[../docs/NOTES-FOR-ZAI.md](../docs/NOTES-FOR-ZAI.md).
