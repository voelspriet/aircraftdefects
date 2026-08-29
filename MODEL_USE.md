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
