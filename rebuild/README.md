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

## If you are checking the provenance

Start at `01-instrument`, which is the first round and the largest single answer,
and read `ask.py` beside it: one brief in, one answer out. `build_all.py` says
what the page is made of and in what order.

The rounds that took several attempts are numbered with a letter, and the later
brief always contains what the measurement showed. `44` and `44b` are the same
task asked twice and are the shortest way to see how the loop worked in practice.

The working notes that came out of all this are in
[../docs/FINDINGS.md](../docs/FINDINGS.md).
