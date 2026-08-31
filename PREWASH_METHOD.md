# The method: instructions, not code

**This describes how the model built a page on its own**, from written
specifications, on 29 and 30 August. That page is kept in the repository and is
not the one served. The page at aircraftdefects.com is a hand-written frame in
which the model is the live reader; how that one is driven is in
[`MODEL_USE.md`](MODEL_USE.md). The method below is recorded because it worked
and because the failures in it are the useful part.

The model is never handed an implementation to copy. It is handed a written
specification of what a surface has to do, and it decides how.

That sounds like a small distinction. It is the whole project.

## A specification is a list of decisions

An implementation tells you what happens. It does not tell you which parts were
chosen and which are accident. A model reading code faithfully reproduces both,
and has no way to know that one of them mattered.

So the specifications in [`rebuild/specs/`](rebuild/specs/) are written as
decisions, with the reason attached:

> Both bars are scaled against the corpus maximum, never against the selection's
> own. The selection is always drawn as a fraction of the whole, so a small
> selection looks small. When that makes it invisible, add a labelled magnified
> line with the factor printed rather than silently rescaling.

> The cap is eight rows. Ten codes are counted and up to two are silently
> omitted, deliberately, with no "more" affordance, unlike the neighbouring rail
> which discloses its cap twice.

> A month is only called a month when the whole month is in the selection.

Twelve thousand two hundred and forty-three words of that, across eleven files.
Six were written before the code, one per surface; the other five were added
after a round was lost, and each of those five exists because the model had been
left to infer something it could not see: the endpoints' real field names, the
rebuild's own markup, the reference's computed type.

## Every brief carries evidence, not instructions

A brief that says "the aircraft is not shaded" is an opinion. A brief that says
this is a work order:

```
The live API returns:      code='ZONE 200'  label=Upper fuselage  n=84453
Your code, line 247:       const ZONE_ORDER=["100","200","300",...]
The lookup asks for '200'. Every by.has() is false, every n is 0, so every
shape gets the floor of your opacity ramp.

The same line breaks the filter. Your marks carry take="zone|100", so:
  zone=100        -> {"error":"rejected filter values", ...}
  zone=ZONE%20100 -> total = 60966
```

The model then fixes the cause rather than the symptom, and twice it has found a
third consequence I had not measured. It noticed that the typed search route
carried the same bare code and would be rejected the same way; and that the paper
cabin windows would intercept hovers over the fuselage beneath them.

## Every brief ends with what it must survive

Not "make it good". Three or four checks, phrased as observations a browser can
make:

- Seven paths showing at least four visibly different opacities, ZONE 200 darkest
- Clicking the crown produces a request carrying `zone=ZONE 200` and a table of
  84,453
- The sentence reads "Upper fuselage accounts for 84,453 of the 212,940 reports
  written in the FAA's numbered zones, or 39.7%", computed from the data and not
  hard-coded

Then the browser actually makes them. Three times in one day the code was
syntactically perfect, returned HTTP 200, logged nothing, and did nothing at all.
Only driving the page caught it.

## Give it the whole budget

`max_tokens` covers the reasoning and the writing together. A brief of five
thousand words at maximum effort spent 378,982 characters thinking and was cut
off mid-function with 66,122 characters written. The ceiling is not a quality
dial; it is a budget, and the effort level spends it.

The fix is to split the brief and lower the effort, not to shorten the
specification.

## Keep the thinking

Every reasoning trace is committed, 4.35 million characters of it. The split
between what the model thought and what it wrote is then visible rather than
inferred, and when it departs from the specification it is asked to say so. Its
departures are in the repository next to the code, and several of them were
improvements: the closed month strip shades by count because a flat grey bar
cannot show a distribution, and a duplicate check that would drop the part
whenever the system was blank was caught before it shipped.
