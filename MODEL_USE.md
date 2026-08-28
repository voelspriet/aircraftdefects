# How GLM-5.3-Flash is used

Every place the model is called, what it is allowed to do there, what it is
forbidden to do, and what it costs. Nothing here is aspirational: each row
corresponds to code in this repository.

---

## The rule everything else follows

**The model reads and phrases. It never decides what a code means.**

Meaning comes from the FAA's own published lookup tables, applied deterministically
in `dec()` in [`app/app.py`](app/app.py). A code absent from those tables renders as
the raw code, in red, labelled undecoded.

This is not caution for its own sake. Asked to interpret, any model will produce a
plausible expansion for a code it has never seen and will not flag the guess.
`ZONE 400` comes back as something that sounds right. On a public safety record that
is a fabricated fact wearing the formatting of a real one, and a reporter cannot see
the difference.

So the split is enforced at the code level, not by prompt discipline:

```python
def dec(table, code):
    """A code to its FAA meaning, or None. Never a guess."""
    v = (gloss_tables().get(table) or {}).get(str(code).strip().upper())
```

The model is never given the opportunity to answer that question.

---

## Where the model runs at runtime

Two places. Everything else on the page is arithmetic.

### 1. Plain-English gloss — `POST /z/api/gloss`

Restates one mechanic's write-up for a reader who is not an aviation professional.

| | |
|---|---|
| Model | `glm-5.3-flash` |
| Reasoning effort | `low` under 400 characters, `high` above |
| Max tokens | 900 / 2,600, by the same threshold |
| Structured output | JSON, with `abstained` and `reason` fields |
| Typical latency | 2.6s at `low`, 20 to 60s at `high` |

**Why the effort varies.** A one-line write-up is transcription. An eight-step
account of a thump in cruise, a precautionary declaration, a tower fly-by, a
suspected tyre blowout and a landing with fire equipment standing by is
comprehension. Paying `max` to transcribe one line is money burned; paying `low` to
compress eight events loses five of them. The threshold is length, and it is one
line of code.

**What it is forbidden to do**, in the prompt, absolutely:

- Say or imply *why* anything happened. The record has no cause.
- Say or imply anything about an accident, a crash, or danger.
- Soften or dramatise. No adjective that is not in the source.
- Drop a step. Length follows the source.
- Guess when the shorthand is unreadable. It abstains instead.

**Three things it returns beyond the text:**

`abstained` — it may refuse, and refusal renders as a refusal rather than as
silence.

`jargon` — every abbreviation with its meaning, and crucially **where the meaning
came from**. `AGL` is derivable from the text and is marked *from the record*. That
`GEG` is Spokane International comes from the model's own knowledge and is marked
*not in this record*, with the reader told to check it. If it is not confident an
airport code is that airport it is instructed to leave it out entirely: a gap a
reader can see beats an invention they cannot.

`code_tension` — see below.

The gloss always renders **under** the verbatim write-up, never instead of it.

### 2. Location from free text — `POST /z/api/locate`

196,663 reports carry a numbered zone. 1,496,585 state a location only in the free
text. This reads those, on demand, for records on screen.

| | |
|---|---|
| Reasoning effort | `low` |
| Structured output | JSON: `where`, `span`, `confidence` |
| Batch | up to 25 records per call |

**The guard is not a prompt, it is code.** The model must quote the exact span it
took the location from, and the server discards any result whose span does not
appear verbatim in the source text:

```python
if r.get("where") and span and span.upper() in byid.get(r.get("id"), "").upper():
    kept.append(r)
elif r.get("where"):
    dropped += 1
```

The response reports `dropped_unverifiable` so the reader sees how often the model
paraphrased rather than quoted. A prompt asking for a verbatim quote is a request.
Checking the quote against the source is a guarantee.

### Where the model deliberately does **not** run

The tail summary at `/z/api/summary/<tail>` is the surface a relative is most likely
to read, so **no sentence in it is generated**. Every number is computed in Python,
dropped into a fixed template, and then **recounted from the records before the text
is allowed out**:

```python
bad = [k for k, v in check.items() if stats[k] != v]
if bad:
    return jsonify(error="verifier disagreed on %s, nothing rendered" % ...), 500
```

If any figure disagrees with its own recount, nothing is returned. The response
carries `"generated": false`.

Also not model work: month-by-month counts, zone and system tallies, repeat-finding
groups, part recurrence, export, and every aggregate on the page. Arithmetic should
not be guessed.

---

## Where the model designed the thing

### It wrote its own brief

Given flat source material and one short sentence, it wrote the prompt that
designed the feature set. See [PREWASH_METHOD.md](PREWASH_METHOD.md) and
[`design/`](design/).

### It wrote the interface

Given **85,326 tokens** of the parent tool's real source, the working Flask app and
its 219KB single-page front end, it returned a complete page in the house style in
850 seconds. Not a description of the style: the style itself. That is what the 1M
context window is for, and it is the one capability here that has no substitute.

### It audited itself

Step 3 of every session makes it mark each sentence as stated by the source or
inferred. On this project that caught a statistic it had asserted and did not have,
which one of its own recommended builds rested on.

---

## Settings, and why each one

| Setting | Value | Reason |
|---|---|---|
| `model` | `glm-5.3-flash` | the only member of the GLM-5 series that accepts images. GLM-5.3 is text only, and the API rejects image content on it with `1210 messages.content.type is invalid` |
| `thinking.type` | `enabled` | cannot be disabled on this family. Sending `disabled` returns `1210 This model always engages in thinking` |
| `reasoning_effort` | `low`, `high` or `max`, per task | the default is `max`. Declared per call, never left to the default |
| `thinking.clear_thinking` | `false` | vendor recommendation, and it is what preserves the reasoning traces committed here |
| `temperature` / `top_p` | 1 / 0.95 | vendor recommendation for this model |
| `response_format` | `json_object` where a schema applies | so it cannot ramble into a field that will render as fact |
| Base URL | `https://api.z.ai/api/paas/v4` | switchable to `/api/coding/paas/v4` via `ZAI_BASE`, because a Coding Plan key is routed differently |

**Reasoning is never disabled.** It is not possible on this model family, and the
declared choice is which of the three levels each task gets.

---

## What it cost

Recorded sessions, from the committed `.meta.json` files:

| Session | Effort | Seconds | Prompt | Completion | Total |
|---|---|---:|---:|---:|---:|
| Design: the model writes the prompt | max | 232 | 788 | 9,105 | 9,893 |
| Design: execute prompt | max | 321 | 2,837 | 13,180 | 16,017 |
| Design: stated vs inferred | max | 337 | 7,196 | 16,000 | 23,196 |
| Write the page from 85k tokens of source | max | 850 | 96,433 | 52,688 | 149,121 |
| **Total** | | | | | **198,227** |

Plus the measurement runs: 200 reports adjudicated at `high` in 4m29s at six
concurrent, and 29 flags re-adjudicated by three lenses each.

314,399 characters of reasoning trace are committed alongside the answers.

---

## Two failures worth publishing

**GLM-5.3 is text only.** A tool whose input is a photograph would have failed
silently on the flagship model. The suffix is not a cost choice.

**A 20,000,000 token bundle did not cover it.** Every call returned
`429 code 1113 insufficient balance` while the account held credit, because the
bundle covered `glm-5.3` and `glm-4.7-flash` and not `glm-5.3-flash`. Six model ids
against one endpoint in one second isolated it: two returned 200, four returned
1113. A 429 reads as rate limiting and the error says *insufficient balance*; it is
neither. Model-scoped bundles are the trap.
