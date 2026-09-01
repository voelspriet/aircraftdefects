# How GLM-5.3-Flash is driven

Two pages are served from this repository, and the model's part in them is
different, so this file says which is which before anything else.

**aircraftdefects.com**, the page a visitor lands on, is a hand-written frame
(`rebuild/z2.html`, 100,618 characters, hand-written on 30 and 31 August 2026,
after two model rounds against the previous page did not land). On that page GLM-5.3-Flash is not the author of the code. It is the
reader of the file: every teal block is the model reading FAA write-ups live,
and every one of those calls is listed below with its prompt, its cost and its
guard.

**The earlier page** was written by the model from written specifications
(`rebuild/specs/`), and is left in place so the two can be compared side by
side: it is served, unlinked, at
[aircraftdefects.com/z/rebuilt](https://aircraftdefects.com/z/rebuilt). Its provenance is counted by `build/count_provenance.py` and recorded
at the end of this file.

**The service**, `app/app.py`, is 109,501 bytes, of which 59,833 (54.6%) sit in
blocks headed `# ---- hand-written` and the rest is the model's. Count it:

    python3 - <<'EOF'
    s=open('app/app.py').read();h=0;on=False
    for l in s.split('\n'):
        if l.startswith('# ----'): on='hand-written' in l
        if on: h+=len(l)+1
    print(len(s),h)
    EOF

## What the model reads live on the page, call by call

Every block streams (SSE), states what it read ("300 of 12,397 write-ups, newest
first, not a sample of the rest"), how long it took and how many tokens, and
abstains in a sentence when the write-ups do not carry an answer. All at
`reasoning_effort: low`. Measured 31 August 2026.

| block | input | output | guard | measured |
|---|---|---|---|---|
| The specimen, "in plain English" | the whole record decoded by the FAA's own tables, plus the write-up, dates spelled out ("5 January 2024", because the model read 01/05/2024 as 1 May) | 110 words for a member of the public, then `TERMS:` for Perplexity links | pre-read at ingest for 15 landing states, cached on disk by record id; 0.1 s from cache | 4.7 to 10.9 s live |
| Five questions on any case sheet | same record | explain, danger, repair, why, what to check next (the last returns clickable searches) | one record, quotes verified | 2 to 9 s |
| What recurs here | the newest 300 write-ups of the selection | narrative prose, one quote per paragraph with its record number | Prove it; next three clicks | 30 to 40 s, ~260k tokens |
| A question the filters cannot hold | the newest 200 write-ups plus the counted breakdowns | says first what the file cannot tell (danger, injuries, rates), then the closest thing it can, with quotes | Prove it; next three; never says "most dangerous" | 13 s, 18,900 tokens |
| Ask the file (filters) | the question, the FAA code tables, the operator list | draft chips, nothing runs until Run | codes outside the tables are dropped and listed; it invented WN for Southwest on first test | 3 to 6 s |
| One airframe, end to end | every report on one tail, oldest first, gaps over a year inserted by the server as markers, filing lag per record | one dated paragraph per turning point, each with its record | "because", "caused", "led to", "due to" banned; a gap is printed, never bridged | 27.7 s for 300 reports, 31,800 tokens |
| What differs, two airlines | the newest 150 write-ups from each, plus the counted shares by system | three paragraphs: shared, only A, only B | counts are the file's; "never say one is safer or worse" | 22.5 s, 24,400 tokens |
| How the trade says it | up to 60 write-ups carrying the word | what mechanics mean by it, with records | abstains under 10 uses | 5 to 15 s |
| The Freefall page, "what the NTSB found" and "what the film says" | a z.ai web search run by the server first (mirrors and translations dropped, .gov and named outlets first); the model sees only those results | 220 words, every fact numbered to a result; sources rendered as named links | labelled "the web, not the file"; on first attempt the model skipped the search tool and insisted the film was *Downfall* (2022), which is why the search is now done server-side and the model is held to it | 10 to 19 s |
| The case page, `/case/<id>` | the sheet endpoint decodes every field with the FAA's wording beside the plain label; the five questions run there too | a citable page per record | quote and citation copy buttons; caveats before publishing | instant, one lookup |

### Prove it

After every stream ends, the server splits the answer into sentences and finds
every quote: text in quotation marks, or the mechanics' capitals directly before
a `[record]`. Each quote is normalised and checked as a literal substring of the
cited record (or of the single record being read). A sentence with a quote that
fails is deleted before the page shows the final text; the page prints "41 quotes
checked, 40 verified, 1 sentence removed", and any sentence that rests on records
can be clicked to see them, with the quoted fragment. Counted facts such as
"(AALA, 514)" are not quotes and are left alone; that false positive was found
and fixed on the first live run. Deterministic, no extra tokens.
Code: `verify_text()` in `app/app.py`.

### Next three clicks

The recurs and question prompts end with a `NEXT:` JSON tail naming up to three
narrower slices. The server resolves each against the file and prints the real
count; a slice with zero reports is dropped. Labelled "the model's suggestions,
not a ranking".

## The earlier page: how it was written

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

## Who wrote the code that ships

Counted, not claimed. Run `python3 build/count_provenance.py --check` and it
fails if this table has drifted from the repository.

    code this repository serves       879,459 characters
      GLM-5.3-Flash                   616,396   70.1%
      not the model's                 263,063   29.9%

        the model's page, /z/rebuilt        565,458   written whole from the specs
        the service, app/app.py              50,938   the model's share
        the page at the root                154,076   hand-written
        the service, app/app.py              80,518   hand-written blocks
        the seam and later fixes             28,469   hand-written

### The earlier page, which is kept but not served

The paragraphs below describe the model's own build of this page, from the
specifications in `rebuild/specs/`. None of it is in the figures above, because
none of it is served.

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
what the page is made of and in what order; `build_z.py` publishes it; the scripts in
`build/` measure the result in a browser and count the provenance. None of that is on the
page. All of it decides what reaches the page, which is why it is listed here.

**The service** in `app/app.py` is mixed, and the source says which is which:
blocks headed `# ---- hand-written` are hand-written, everything else is the
model's, including the nine research builds it chose and the rewrite of the
ninth once the FAA file proved it could not be served as designed. The current
split is at the top of this file and is counted by
`build/count_provenance.py`.

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
of the earlier page. Every other block on that page is the model's. The gate that
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

**`rebuild/50-hand.js` and `50-hand.css`** restore the instrument to the parent's
own drawing at the same URL: the AIM AT row shown under the headline (it was
built, then hidden by a model rule), the WHEN bars in the parent's colour (they
were painted rust at half opacity, a smear the headline collided with), the rail
tabs in the parent's faces, and a "Take it" button that was ink on ink.

**`rebuild/51-z2.js` and `51-z2.css`** are the redesign layer from the panel of
twenty (docs/DESIGN-Z2.md): one streaming model-call block used by every button,
"Say it in plain English" on the specimen and every write-up, "How the trade says
it" on any word, "What recurs here" over a selection, "Is this the right slice?"
before export, "Ask the file" as draft filters, the shutter, and records as one
line each. The model's words are the model's; this is the frame they arrive in.
