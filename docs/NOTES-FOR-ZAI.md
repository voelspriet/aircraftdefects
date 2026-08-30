# Notes for the people who build GLM

Written 30 August 2026, after two days of using GLM-5.3-Flash to rebuild a working
tool from written instructions rather than from code handed to it: 47 briefs, 7.7
hours of model time, 3,864,833 characters of reasoning and 1,058,209 of written
output. Every figure below comes from the logs in `rebuild/`, which are committed,
so all of it can be checked rather than taken on trust.

Sent because the model did the job and we noticed five things while it did.

---

## What it built

An instrument over 1,757,827 FAA service difficulty reports. Four rails that
answer when, where, who, and what the defect forced. An aircraft diagram shaded by
where the trouble sits, with clickable zones. Nineteen filters, eighteen starter
questions, a record table carrying the mechanic's own words, a case sheet with
seventeen named fields as a focus-trapped dialog, sixteen panels, a phone layout,
and nine research features it designed itself.

It wrote all of it. At the time of writing, 95.5% of the served page is the
model's, and the 4.5% that is not is itemised in `MODEL_USE.md` with the file
sizes, because a claim like that is worth nothing unless someone can check it.

Three behaviours are worth naming first, because they are the reason we would use
this model again for journalism, where being wrong in public is the whole risk.

**It argues with the brief when the brief is wrong.** Asked to make every control
24 pixels tall, it came back with two links that sit inside sentences, explained
that inflating them would break the line, offered a padded hit box with negative
margins, and then asked whether that counted as cheating. It was right. WCAG 2.5.8
exempts inline links for exactly that reason, and we loosened our own check
because it asked.

**It refuses to invent an answer the data cannot support.** One of the nine
features it designed assumed the FAA file could be queried by part number. It
cannot: `part=` searches part names, and no parameter anywhere searches a number.
Rather than return a confident zero for a part the reader was reading a report
about, it rewrote the feature to count what the file does record and to say in
plain words what the file cannot answer.

**It reports contradictions in the source instead of computing them away.** Asked
to show the hours between two write-ups on one airframe, it found records where
the FAA's own file reports fewer hours on the later report than on the earlier
one, and printed "the file's own hour readings do not agree" rather than a number
or a negative.

That instinct, to say what it cannot do instead of producing something
answer-shaped, is the most valuable property of the model for this kind of work.

**And it uses tools well.** We gave it four: `measure(js)` running JavaScript in a
real browser against its own page, `parent(js)` against the tool it was matching,
`deploy(css, js)`, and `done()`. It drove that browser itself, shipped its own
code, read the numbers back and corrected itself:

    the tab strip     747px  ->  100px      target 104, the model measuring
    the phone      160 errors ->  0
    the page height  3,448px -> 1,802px

Those are its own rounds, unassisted. When it can look, it looks well.

---

## 1. `max_tokens` covers reasoning and writing together, and the failure is silent

This cost us more than any other single thing, and it is invisible from the
caller's side.

We lost a round to a 40,000 token budget spent **entirely** on reasoning. 918
seconds, zero characters written, no error, and a successful response, because by
the API's own account nothing had gone wrong. Another round reasoned for 378,982
characters, wrote 66,122, and was cut off mid-function.

Median reasoning-to-writing ratio across 40 completed rounds was 4.5 to 1, ranging
from 0.3 to 14.3. That variance is fine and often the reasoning is what makes the
answer good. The problem is only that a caller sizing a budget cannot know which
end of that range a given brief will land on, and gets no signal when the budget
went to thought rather than to output.

**What would help.** A distinct finish reason for "budget exhausted during
reasoning" as against "finished writing" would let a caller retry intelligently
instead of guessing. Separate budgets would be better still. As it stands, a large
brief with a small budget silently buys reasoning nobody will ever read, and
reports success.

---

## 2. A guessed identifier is written with the same confidence as a given one

The model works from whatever it has. When a name is not in front of it, it infers
a plausible one and proceeds, and the answer gives no sign of which names were
supplied and which were reconstructed.

    it wrote        window.caseSheet          the page calls openCase
    it wrote        .vgroup .vlab .tab        the page has .vg .vglab .vtab
    it wrote        getElementById('noRows')  with a legend of '#zones li'
    it wrote        #vstrip .vglab            losing to #vstrip.vgroups .vglab
    it wrote        RECORDS                   a global this service never had

Each is correct in itself. Each deploys with no console error, no failed request,
no missing element, and no effect at all.

We ended up running every selector in an answer against the live DOM before using
it, and that score became our single best predictor of whether a round would land.
Three rounds of the same task:

    round 43     16 of 38 selectors matched nothing
    round 43b     2 of  8
    round 43c     0 of  6

**What would help.** Any signal separating "you gave me this name" from "I
inferred this name". A convention where the model lists the identifiers it assumed
at the top of an answer would do it, costs almost nothing, and would let a caller
check the cheapest thing first.

---

## 3. It does not ask for what it is missing

Related to the above and worth separating, because the fix is different.

When a brief describes code rather than including it, the model builds a
reconstruction and works on that, confidently, rather than saying it is working
from a description. In 47 rounds it never once said "I cannot see the markup you
are describing, please send it".

The cost is measurable. The same two service functions, asked for as a
description and then with the source in the prompt:

                        time   reasoning   written   outcome
    from a description  294s     39,460     5,193    reconstructed them against a
                                                     global that does not exist,
                                                     and dropped six response fields
    with the source     173s     18,541     5,775    changed the sort, and nothing
                                                     else

Half the time, half the reasoning, and a usable answer.

The same effect at the other end of the scale: a brief that named *why* the
previous attempt had had no effect, one selector out-specifying another, finished
in **64 seconds**. It is a good enough reasoner to know when it is working from a
reconstruction. Saying so would be cheaper for everyone than reconstructing well.

**What would help.** A model that asks for the artefact it is about to infer.
Nothing more elaborate than one sentence at the top of the answer.

---

## 4. Comments describe the change it intended, not the code it emitted

Three times, a block arrived carrying a comment describing work that block did not
contain.

    "The old boot-capture block and the setSiblings loop are deleted."
        Nothing was deleted. The block is appended to the page and has no
        channel to delete anything.

    "the script below copies the body's computed background onto the root"
        There was no such script. The CSS rule alone was correct and sufficient.

The code was fine in both cases. The comment was written from the plan rather than
from the output. This matters more than a stale comment usually would: a reviewer
reading it believes the change happened, and in a repository whose argument is
that it counts its own seams honestly, a source file asserting something untrue
about itself is a problem in its own right.

**What would help.** Anything that makes a comment a description of the code
actually emitted rather than of the intention. This is the one item on the list we
would guess is addressable in post-training rather than in the API.

---

## 5. A whole-block replacement drops earlier work without saying so

Handing the model its own previous output and asking for a whole replacement is
the right instruction for coherence, and it costs memory.

One block contained a fix for a hover reflow. The next two rounds were each asked
to return that block whole with a separate fault repaired. Each repaired the fault
correctly and dropped the hover fix with it, without mentioning the omission. The
measurement went 46 shifted controls, then 1, then 46 again.

**What would help.** When a model is handed its own previous output to replace, a
short "carried forward / dropped" list would cost a few dozen tokens and would
make an omission visible at the moment it happens rather than three rounds later.

---

## The short version

The model reasons well, writes a great deal of correct code, argues with a brief
when the brief is wrong, refuses to invent an answer the data cannot support, and
uses tools capably when it is given them. We would use it again for this work, and
we are going to.

The five things above share one shape: the model knows something the caller does
not, and has no way to say it. It knows the budget went to reasoning. It knows
which names it inferred. It knows it is working from a description. It knows what
its block does and does not do. It knows what it dropped.

Every one of those is a sentence it could emit and currently does not.

    a brief naming why the previous attempt failed         64 seconds
    the same task, from a description then from source  294s -> 173s
    selectors matching nothing, over three rounds       16/38 -> 2/8 -> 0/6
    when given a browser, it fixed its own work        747px -> 100px
