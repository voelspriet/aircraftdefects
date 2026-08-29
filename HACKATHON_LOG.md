# Log

What happened, in order, with the numbers. Nothing here is marked done on the
strength of an API returning 200.

---

## 28 August — the brief writes itself

The model is given flat source material about the corpus and asked what should be
built, before anything is built. Not "here are features, implement them": the
prompt asks it to work out what a journalist, a researcher and a relative of
someone who died each need, and to refuse the ideas the data cannot support.

It refuses three: most dangerous airline, what caused the crash, was my flight
safe. The file has no fleet sizes and no flying hours, so it has no denominators,
and it says so before proposing anything. That refusal is now a constraint in
every later brief.

Kept: [`design/`](design/), the prompt and the answer, with the reasoning.

## 29 August, morning — streaming, and a retraction

Two long jobs die on a 502 and a reset connection. The first explanation is
prompt size and it is wrong: the successful run had three times the input of the
failing one. The cause is a silent socket. `stream: true` everywhere.

Separately, a measurement published the day before is retracted. It claimed 14.5%
of a sample was misread, on the verdict of an adjudicator that turned out to be a
constant rather than a judge: it agreed with everything put to it. Both the 14.5%
and the 2.0% that replaced it are withdrawn in the README rather than quietly
corrected. **F1.**

## 29 August, midday — six specifications

Six agents read the reference implementation and write down what it *does*, not
what its source says. 9,556 words across six files, one per surface, written as
decisions with the reason attached.

That framing immediately finds a live bug. The zone lookup is keyed on `200`
where the API returns `ZONE 200`, so every count reads zero, every shape gets the
floor of the opacity ramp, and the aircraft comes out one flat colour. The same
line puts `zone=100` on every click, which the server rejects outright, so the
filter had never worked either. Two symptoms, one line. **F5.**

The server's refusal is what made it visible. Had it ignored the bad value, the
page would have shown the unfiltered 1,757,827 under a zone heading: a wrong
number that looks right.

Corrected with the evidence attached rather than an instruction. Nine distinct
alphas afterwards, 0.900 for the upper fuselage down to 0.131 for the lavatories,
the landing-gear strut correctly unfilled and only the three wheels shaded.

While splicing that fix: the page had never rendered at all. It is a component,
not a page, its CSS scoped under `#hero-root`, and its boot does
`if(!ROOT) return`. Served on its own there was no such element, so it returned
in silence. Empty body, no console error, HTTP 200.

## 29 August, afternoon — count it instead

Six agents had described the reference well enough to find a bug. None of them
had counted the build, so nobody knew the whole lower half of the page was
missing.

[`build/parity_diff.py`](build/parity_diff.py) drives both through five states in
a browser and counts elements. [`build/parity_options.py`](build/parity_options.py)
goes finer and lists what is inside them.

```
                        reference   build
  select menus                 22       1
  options inside them      11,444       6
  tabs                         20       4
  panels                       16       0
  report rows                 100       0
  write-ups                   100       0
  decoded terms               396       0
  month bars, rail shut       380       0
  crew ladder rows              8      10
```

Two things the eye had missed. The crew ladder draws ten rows where the
specification caps at eight, so more is a violation and not an improvement. And
the two pages spell their rails differently in `?hero=`, so a link copied from
one opens the wrong rail on the other, which matters because shareable links are
the whole citation model. **F6, F7.**

The 396-versus-0 decoded terms was not a rendering fault: the page never called
`/api/glossary` at all. A question never asked.

Phase B, which this file had marked done, is re-opened. It had been established
by looking and describing rather than by counting.

## 29 August, evening — three briefs, three silent collisions

Three specifications go out and come back. None of them drops in cleanly, and
none of the failures produces an error message.

A `const` and a `function` of the same name is a SyntaxError, so nothing at all
runs. Two `function`s of the same name is worse: the later wins silently, and
`pct(a,b)` became `pct(rows,n)`, after which a rail stopped opening with nothing
in the console. A boot with no `readyState` guard set its own booted flag and
never tried again, because the mount point was declared after the script.

[`rebuild/splice.py`](rebuild/splice.py) now excises the hard collisions and
renames the soft ones on the way in. **F8.**

The brief for the search half was truncated: 378,982 characters of reasoning plus
66,122 of writing hit the 128,000-token ceiling and the file ends mid-function.
Re-run as two halves at `high` rather than `max`.

**State at the end of the day.** Four rails working and measured: the month strip
stays drawn when the rail is shut, the gutters carry values, all four rails state
what their figures amount to, the crew ladder is back to eight, the specimen
reads as decoded English. Sixteen tabs and thirty-one panels below it. The
records themselves are still being built.
