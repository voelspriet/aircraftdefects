# How GLM-5.3-Flash is driven

Everything on the page is written by the model. This file records how it is
asked, what that costs, and where it went wrong.

## The model

GLM-5.3-Flash. 320B parameters, 18B active. One million tokens of context,
128,000 of output. Natively multimodal on input, text out. MIT.

Reasoning cannot be turned off on this family. `reasoning_effort` takes low,
high and max, and `thinking.clear_thinking: false` keeps the trace.

## The call

```python
{"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
 "thinking": {"type": "enabled", "clear_thinking": False},
 "reasoning_effort": effort, "max_tokens": 128000, "stream": True}
```

Driver: [`rebuild/ask.py`](rebuild/ask.py). It writes the answer, the reasoning
trace and the brief to three files, so the split between thinking and writing is
visible rather than inferred.

## Three things learned the expensive way

### Stream, or the gateway kills you

Two long jobs died, a 502 and a reset connection on the retry. The first
explanation was prompt size, and it was wrong:

```
run 1  SUCCEEDED   85,326 tokens in   64,000 max out   850s
run 2  FAILED      28,729 tokens in   48,000 max out   502
run 3  SUCCEEDED   10,582 tokens in   32,000 max out   216s
```

The successful run had three times the input of the failing one. What separated
them was how long the socket stayed silent. Without streaming nothing crosses the
connection until the model has finished everything, and a proxy in the middle
gives up. Correlation read as cause: run 3 worked because it finished inside the
window, not because it was small.

### `max_tokens` is a budget shared with the thinking

A first attempt spent 40,000 tokens entirely on reasoning: 918 seconds, zero
characters written, no error, because nothing had gone wrong. Raised to the
documented maximum of 128,000, a five-thousand-word brief at maximum effort then
spent 378,982 characters thinking and was cut off mid-function with 66,122
characters written.

So the effort level is a budget decision as much as a quality one. Long briefs
run at `high` and are split in two.

Measured, per brief, at max effort:

| brief | words | thinking | written | seconds |
|---|---|---|---|---|
| the instrument | 3,454 | 203,344 | 62,056 | 1,780 |
| the WHERE rail | 2,782 | 184,036 | 17,964 | 1,062 |
| the other rails | 4,204 | 269,948 | 45,201 | 1,850 |
| the panels | 5,119 | 249,843 | 63,902 | 1,672 |
| the search half | 4,976 | 378,982 | 66,122 | **truncated** |

### It will guess a field name rather than ask

Twice it invented the shape of data it could not see. `z||zone||id||k` where the
API says `code`, and `["100","200",...]` where the API says `ZONE 200`. Both
produced code that ran, logged nothing, and drew nothing. Both are now in the
specifications as values rather than as shapes, because a field name is a fact
about the data and not an implementation detail.

## Where it departs from the specification, and is right

It is asked to say where it departed and why. Several departures were
improvements:

- The closed month strip shades by count. The specification fixed one grey, but a
  flat bar cannot show a distribution, and the stated reason the closed strip
  exists is that a reader with another rail open should still learn something
  about time.
- A duplicate check in the specimen line would have dropped the part whenever the
  system was blank, because `"".includes("")` is true.
- The paper cabin windows needed `pointer-events: none` or they intercept hovers
  over the fuselage beneath them.
- The part-month margin note hard-coded "covers 1 to N", which is only true at an
  end edge; it prints the real covered range.

## What has not been run, and why

A full pass over the corpus. Measured at 865 tokens and 1.42 seconds a report:
1.52 billion tokens and 2.9 days at sixty concurrent.

It is not run because the instrument is not calibrated yet, and a pass at that
scale on an uncalibrated reading produces 1.7 million confident sentences nobody
can check. The one measurement so far that was published and later retracted was
retracted for exactly that reason: its adjudicator turned out to be a constant
rather than a judge, so it agreed with everything. See F1 in
[`docs/FINDINGS.md`](docs/FINDINGS.md).

## What is not written by the model

The line at the top of this file, "everything on the page is written by the
model", is the intent and it was not precise enough to be checkable. This section
is the precise version. Every figure here can be counted from the repository.

    served page, raw                 616,701 characters   (recounted 30 August, after 49)
      model-written                    592,131   96.0%
      hand-written                      24,570   4.0%
        rebuild/bridge.js.bak             13,228
        rebuild/47-hand.js                 2,618
        rebuild/48-hand.js                 5,138
        rebuild/49-hand.js                 2,756
        rebuild/49-hand.css                  830
      plus one hand edit inside a model block: 1,160 characters REMOVED from
      rebuild/42-dom.js (the height-pinning; backup 42-dom.js.bak-49)

**`rebuild/bridge.js.bak`, 13,226 characters, is hand-written.** It joins the two
halves the model built separately. The controls were briefed to call `search(off)`
and expect a promise carrying a total and a corpus; the rows were briefed to live
in their own closure and announce the figure on an event. Each half assumed the
other and each built a whole. The bridge is the seam: a `search` that adapts one
to the other, a single fetch of the corpus figure, a delegated listener for the
gloss button because another block moves it, and the nineteen field names the
gloss endpoint takes. It also tucks the desk into the panel it belongs to.

**Three hand corrections to model-written blocks**, all in `rebuild/40-dom.js`,
all on 30 August, all recorded in the commit that carried them:

  - one missing `+` between two string literals, which `node --check` named on
    the line. A round would have cost six minutes; the character cost none.
  - eighteen em dashes replaced, because the standing instruction for this
    project is that no text produced for it uses them. Two of the replacements
    read wrong as colons and were then made commas.

Nothing else in any page block has been touched by hand. `rebuild/01-instrument.page.html`
has never been hand-edited: `git log -p` on it shows only whole blocks arriving
from `ask.py` and `agent.py`.

**The harness is hand-written and always was.** `ask.py` and `agent.py` call the
model; `extract.py` pulls blocks out of an answer by its fences; `splice.py`
merges them and renames the collisions that fail in silence; `build_all.py` says
what the page is made of and in what order; `build_z.py` publishes it; the seven
scripts in `build/` measure the result against the parent. None of that is on the
page. All of it decides what reaches the page, which is why it is listed here.

**The service** in `app/app.py` is the model's, including the nine builds it
chose and the rewrite of the ninth once the FAA file proved it could not be
served as designed.

### How to check any of this

    wc -c rebuild/01-instrument.page.html rebuild/bridge.js rebuild/bridge.js.bak
    git log --follow -p rebuild/01-instrument.page.html
    git log --oneline --all | grep -i "hand correction"

**`rebuild/47-hand.js`, 2,618 characters, is hand-written page code.** Added
30 August at Henk's decision after two model rounds (1,963 s, 54,123 characters)
answered against element names that do not exist on the page. It does two
things: hides the desk's "No rows yet, on purpose" whenever a result count is on
screen, and keeps the airframe dossier off the page when the instrument's
selection is empty, so a page never shows two different counts. It is 0.43%
of the served page. Every other block on the page is the model's. The gate that
checks both behaviours is `build/verify_presentation.py`, also hand-written.

**`rebuild/48-hand.js`** adds the parent's "Skip to the results" link and the AIM AT
"a month or year" target that /z lacked. **`rebuild/49-hand.js` and `49-hand.css`**
make the starter questions reach the URL (they filled the form, and this page's
search gate reads the URL, so all six were dead), stop `showChange()` scrolling a
reader upward on every re-render, and un-stick the results bar, which the parent
never made sticky. **The edit inside `42-dom.js`** removes the model's hover fix: it
recorded every element's resting height and pinned anything that grew, so after
any search the instrument was pinned to 0px with its content painting over the
desk, and the page shortened by 860px under a scrolled reader. `#aimLine` now has
a min-height instead. Each is dated 30 August and explained in its file header.
