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
what its source says. 12,243 words across eleven files, one per surface, written as
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


## 30 August — the quiet page, and the model changes jobs

The model-built page could not be repaired by more model rounds, so the roles
were swapped: the frame (`rebuild/z2.html`) is written by hand, and
GLM-5.3-Flash becomes the reader of the file rather than the author of the
code. A design panel of
twenty (one lens each) and a red team chose what ships; the cuts and reasons
are in docs/DESIGN-Z2.md. By the end of the day: the four rails always on
screen with a breadcrumb, the chosen thing in big red above the findings, the
pre-read specimen cached by record id on disk, five questions per report,
"what recurs" over any selection, and the red Freefall cell with N704AL's two
reports and the door-plug fleet inspection.

## 31 August — Prove it, the case page, and the film

**Prove it.** After every stream the server splits the answer into sentences
and checks every quote as a literal substring of the record it cites; failing
sentences are deleted and the page prints the count. The first live run caught
its own false positive (counted facts like "(AALA, 514)" are not quotes) and
one real removal. **Next three clicks** are resolved to real counts, zeroes
dropped. A generic question is answered from the newest 200 write-ups, honest
opener first. One airframe end to end (gaps inserted by the server, causal
verbs banned), two airlines compared, and for the film's page a web search the
server runs itself after the model, asked cold, insisted the film was
*Downfall* (2022): now it may only use the search results, one named source
per sentence.

**Found in production while filming:** gunicorn's default request line (4094
bytes) rejected the case-sheet questions for long write-ups; "The call to
GLM-5.3-Flash failed" was a 1998-era limit, raised to 32k in the unit file.
The model also read 01/05/2024 as the first of May (dates now reach it spelled
out) and invented WN for Southwest (codes now held to the FAA's list).

**The case page.** Every record now opens on its own address,
`/case/<control number>`, built for citing: the FAA's wording beside the plain
English, copy buttons, tracker and registry links, the way back to the
selection. aircraftdefects.com now serves the new page at the root.

**The film** went through five versions to get sync right. Live screen
recording drifted; the final method captures finished states as 2x screenshots
plus the model's text, and composes each sentence as a frame-exact slide with
a push-in and a paced reveal. Those cuts carried a synthesised narration and are
not published. The 83-second introduction that is published is narrated by me:
https://www.youtube.com/watch?v=vDMEKsNj7ss.

## After the deadline, 5 September 2026

The hackathon closed on 1 September. Winners were promised for the 2nd and are
still "coming soon". An audit of my own entry against the brief, "push the
model into new territory", found that most of what the brief asked for was in
the build folder and not on the page: a 24-step tool-calling agent had built
the site and never ran on it, the quote check dropped sentences silently, and
the case page did not check at all. Three things were built and deployed in
one day, none for this hackathon's judges, all for the next one and for the
site.

**The cuts are shown.** Both pages print what the quote check removed under a
"Show what was cut" toggle, struck through, with the phrase that was not in the
record. The case page's five questions now pass the check. Proven by
intercepting a stream in a headless browser and marking a sentence as failed.

**A blind measurement of the conflicts ledger.** `/z/label`: every ledger
entry plus an equal number of unflagged reports from the same searches,
shuffled; one report at a time, codes decoded beside the write-up, no sign of
which was flagged. `/z/api/conflicts/eval` reports precision and recall with
Wilson intervals; the conflicts page prints them at 20 decided. Found on the
way: the five-minute cache hook replayed the queue and the judge counts, so
those responses are now no-store.

**Chase this lead.** The model gets five tools over the file and works a
tail or a record itself, one call per step, twelve at most, each step on the
page with a link. The closing text passes the quote check and a number check.
Measured: N704AL in four steps and 32 seconds; a 2014 Pilatus report in nine
steps and 68 seconds with one sentence cut for a year the file had not
returned.

**Also found in production:** two synchronous gunicorn workers meant any two
open streams hung the whole site with 504s. The service now runs threaded
workers; four parallel streams and a page load together answered in a fifth
of a second.

**Read a photo.** The model is multimodal and the site had never sent it a
pixel. The search box now takes a photograph of a data plate, placard, logbook
page or part label; the model transcribes what is printed, every field must be
verbatim in the lines it read or it is left out, and the file is asked what it
holds for the tail, serial, part and model. Tested with a rendered plate, since
no photograph of a real plate was mine to use: 3 seconds, five of five fields
verbatim, two reports on the tail, the registry row beside them. Real
photographs are the next test.
