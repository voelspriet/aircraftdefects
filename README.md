# Make it readable

**Live: [aircraftdefects.com](https://aircraftdefects.com/)** · GLM-5.3-Flash, reading the file live · MIT
**Video (83 s, my own voice):** https://www.youtube.com/watch?v=vDMEKsNj7ss · **the build, written up:** [Digital Digging](https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with)

> I was watching *Freefall* on Netflix, and I saw families of the victims trying
> to read what mechanics had written about the planes. They were sent to a very
> strange governmental website. I went there myself and I was curious and
> furious at the same time, because the landing gear is suddenly `ZONE 700`, and
> an emergency landing is just a letter `A`. This is impossible for humans to
> understand, let alone families of victims. So I decided to make it completely
> transparent. I used for that GLM-5.3-Flash. A user can now click on any part of
> the plane to see what is wrong. Which is amazing, but I thought: how do I show
> the full story? So the file counts, but the model proposes. Every figure on
> screen is arithmetic over the records.
>
> — [the 83-second introduction](https://www.youtube.com/watch?v=vDMEKsNj7ss)

## In one page

Every day, aircraft mechanics file service difficulty reports with the FAA: a
cracked bracket, a failed sensor, corrosion found on inspection. The reports are
public. They are also close to unreadable, buried behind a government query form,
written in trade shorthand, returned as raw rows with no context.

**aircraftdefects.com opens that archive.** You can search thirty years of FAA
service difficulty reports, 1995 to last week, by airline, tail number, aircraft
type, part, system code or keyword. A model reads each mechanic's write-up and
says in plain language what actually happened, so a reporter, a pilot or a
passenger can follow a maintenance trail without holding a maintenance licence.
It is free and needs no login. Counts reflect reports filed, not incidents, and
the site calculates no safety rates: the point is to find leads, not to rank
airlines.

**The build is the second half of the story.** Over two days GLM-5.3-Flash wrote
a complete interface to this file on its own, from written specifications rather
than from code handed to it. It still runs at
[/z/rebuilt](https://aircraftdefects.com/z/rebuilt). It also designed the nine
research features itself and now does every live reading on the page. Total model
spend, from the z.ai console: **$1.07**.

A day after it was built, the [Foundation for Aviation
Safety](https://www.foundationforaviationsafety.org/) got in touch. That is the
test of whether a tool like this is worth anything: not the score, but whether
the people who work on the problem every day find it useful.

That number matters more than it looks. Public-interest tools usually die at the
funding stage, not the idea stage. At a dollar a project the arithmetic changes:
a researcher with a public dataset and a free weekend can ship the interface the
agency never built.

The data was always public. What fell is the cost of making it usable.

## The model is inside the page

Not a counter with a chatbot bolted on. **Fifteen endpoints in this service call
GLM-5.3-Flash to read the FAA's raw write-ups at the moment you click**, on
whatever slice of the file you have in front of you. Count them yourself: every
route in `app/app.py` whose body reaches the model. Ten of them stream, so the
reading appears a sentence at a time. The panels that do it carry a
`model reads` badge, so you always know which words are the file's and which are
the model's. Twelve of them are below.

| | what the model does, live |
|---|---|
| **the front page** | the newest report where the crew had to act, already read: the whole record decoded, told in about a hundred words, ending with what the report does not say. Pre-read the moment it arrived, on screen in under a second |
| **any report** | five questions on its own page: what actually happened, was anyone in danger, what did the mechanics do, does it say why, and what to check next, which comes back as searches you can click |
| **what recurs here** | reads up to 300 write-ups on your selection and names what keeps coming back that no coded field was built to hold |
| **code vs words** | finds reports where the box a filer ticked disagrees with the sentence they wrote underneath it. Two passes must agree before it is shown |
| **where the words say it happened** | many reports describe a location in prose and carry no zone code. The model places them, and keeps a location only when it can quote the words back verbatim |
| **any word in a write-up** | what mechanics mean by it, drawn from the write-ups that carry it |
| **one aircraft, end to end** | its life oldest first, one turning point at a time, each pinned to its record |
| **compare** | the newest 150 write-ups from each of two airlines: shared, only here, only there |
| **the Freefall page** | the file's own reports on the door-plug fleet, and beneath them, labelled the web and not the file, what the NTSB found |
| **the FAA registry file** | "Make this file readable": what the registry says about one aircraft **and what it does not**, in 140 words. That the registered owner holds the paper and may be a bank or a trustee rather than whoever flies it, and that the airworthiness class says what the aircraft is certified to do, not what it did |
| **before you export** | reads the reports your filters selected and says which of them do not belong to what you seem to have meant, quoting the words and the record number, and what the filters will miss |
| **a question with no field** | ask it something the form cannot hold, "what plane is the most dangerous", and it says first what the file cannot tell you, then draft filter chips checked against the FAA's own code tables and airline list. It invented `WN` for Southwest on the first test; the designator is `SWAA`, so it is handed the real list and nothing outside it is accepted |

![Seventeen leads, and the panels the model reads live](screenshots/leads.png)
*Seventeen ways into the file. The two marked `model reads` are the model's own*

Every quote it makes is checked against the record it cites before you see it,
by a substring test rather than by another model, and the page prints the score.
That check is in [Prove it](#prove-it) below, and it is the reason any of this
is usable rather than dangerous.

## The file

It is called the Service Difficulty Report, kept by the Federal Aviation
Administration, and it is published here:

| | |
|---|---|
| the FAA's own search | https://sdrs.faa.gov |
| its query form, the one a family is sent to | https://sdrs.faa.gov/Query.aspx |
| the code tables this site decodes from | https://sdrs.faa.gov/References.aspx |
| what the FAA says the file is | https://sdrs.faa.gov/FAQ.aspx |
| the bulk files this corpus is built from, one CSV a year | https://external.apic4e.faa.gov/sdrs/retrieve/SDR-2025.csv |
| the NTSB's accident file, a different agency and a different record | https://data.ntsb.gov/avdata |

Nothing here replaces that. Every record on this site carries its FAA control
number so you can look it up at the source and check it.

When a technician in the United States finds something wrong
with an aircraft, a crack in a component, rust under a fitting, a failed seal,
they file it. Those reports are public: no sign-in, no fee, no records request.
There are **1,758,134** of them since 1995, on **54,634** aircraft.

They are also close to unreadable. Almost every answer is a code, and the codes
collide: `A` in one column means the crew made an emergency landing, and `A`
elsewhere on the same form means an airline filed the report.

The aircraft from the film is in the file. Two reports on N704AL, an Alaska
Airlines 737-9: one filed five days before the door plug blew out, a door hard
to open, aircraft grounded, and the blow-out itself in the mechanic's own words,
filed on 5 January 2024. Both open from the red Freefall cell among the leads,
at [#view=freefall](https://aircraftdefects.com/#view=freefall).

![The Freefall view: the film's own aircraft, in the file](screenshots/freefall.png)
*The Freefall view: the film's own aircraft, and what was filed about it*

## What the page does

One screen. Four rails that are always there, WHERE, WHEN, WHO, WHAT IT
FORCED, and a breadcrumb; a search line that takes a question or a word, a
tail, an airline, a type, with real suggestions for each; and a period line.

At the top sits a schematic aircraft, seen from the side. The parts that get
written up most are drawn darker. The parts nobody reports are pale. You land
on the page and before you have read a word you already know which section of
the aircraft is in trouble. It can only place a report that used a numbered
zone; in most reports the mechanic simply wrote where it was, in plain
English, and in some there is no location at all. A machine asked to draw
where aeroplanes break will draw it from whatever it can place, and the result
looks complete. It will not volunteer the gap, because it has no instinct for
the sentence beginning "this cannot show you". So both of those counts sit
underneath the aircraft, in the same size type as everything else.

Click anything and it becomes the selection: a zone, a month, an airline, a
crew action, a system, a word. The chosen thing appears in big red type above
the findings, then a counted sentence, then the records, 25 at a time through
the whole selection, airlines named rather than coded. Every report opens on
its own page, `/case/<control number>`: the write-up with copy-the-quote and
copy-the-citation buttons, every code spelled out with the FAA's wording kept
beside the plain English, "before you publish this" caveats, links to the
FAA's own search, FlightAware, Flightradar24 and the registry for the tail,
and the way back to the selection it came from.

Seventeen leads under the fold each become the main screen when clicked. There
is always a way back: the breadcrumb, the × on every filter, "clear all, back
to the start".

![The page: four rails, the aircraft shaded by where the trouble sits, and the leads beneath](screenshots/landing.png)
*The page: four rails, the aircraft shaded by where the trouble sits, and the leads beneath*


## Why the reading matters more than the counting

A counter can tell you how much. It cannot tell you what happened. The story
of every report sits in a single free-text field, the mechanic's own write-up,
in trade shorthand, in capitals: `R & R NLG UPLOCK BOX IAW AMM 32-33-07`. A
tool that counts those write-ups, sorts them and plots them on an aircraft
still cannot read them. And reading them is the whole point.

So the model's job changed. Until that point GLM-5.3-Flash had been the
builder: describe a page, it writes the code. Now it is inside the page.
Every teal block is the model reading FAA write-ups at the moment you click,
on whatever slice of the file you have in front of you.

![The newest crew-action report, told in plain English, with the mechanic's words beneath it](screenshots/plain-english.png)
*The newest crew-action report, told in plain English, with the mechanic's words beneath it*


| You press | The FAA's site | GLM-5.3-Flash here |
|---|---|---|
| Nothing: the front page | a form | the newest report where the crew had to act, already read: the whole record decoded by the FAA's own tables, told in about a hundred words for someone who has never seen the form, ending with what the report does not say. Pre-read the moment it arrived, on screen in under a second |
| Any report | a row | five questions on its case page: what actually happened, was anyone in danger (only what the report states, and what it does not), what did the mechanics do, does it say why, what should we check next. The last answer comes back as searches you can click: same aircraft, same part, same airline, same day |
| **Read what recurs in these** on any selection | a count | reads up to 300 write-ups and writes prose, not a list: the phrases mechanics reach for, the repairs that repeat, the thing that is quietly becoming a pattern, one verbatim quote per claim with its record number |
| **Ask** what the form cannot hold ("what plane is the most dangerous") | nothing | says first what the file cannot tell you (danger, injuries, risk), then the closest thing it can carry, most written up, never most dangerous |
| **Ask** what the form can hold | a form with nineteen boxes | draft filter chips, checked against the FAA's own code tables and airline list, shown before anything runs |
| **Read this aircraft end to end** on any tail | 419 rows | its life, oldest first, one turning point at a time, each pinned to its record. Where the file goes quiet for more than a year the server inserts a marker, so the model must write "nothing was filed", and the words because, caused, led to and due to are banned: the file records no causes |
| **Tell me what differs** on Compare | two counts | the newest 150 write-ups from each airline, in the mechanics' own words: shared, only here, only there. The counts stay the file's |
| Any word in a write-up | a string | what mechanics mean by it, from the write-ups that carry it, each with a record |
| The Freefall page | nothing | the file's own reports on N704AL and the door-plug fleet inspection, and beneath them, labelled "the web, not the file", what the NTSB found and what the film says: the server runs the web search first and the model may use only those results, one named source per sentence |

### Prove it

Here is the part that makes this usable rather than dangerous. Every quote the
model makes is checked, by the server, against the record it cites. Not by
another AI. By twenty lines of ordinary code that asks one question: are these
words literally in that report? A sentence whose quote fails the check is
deleted before you ever see it, and the page prints the score: "32 quotes
checked, 32 verified". Click any sentence and it opens the records that
sentence stands on.

![One zone chosen: the count, then the records behind it](screenshots/selection.png)
*One zone chosen: the count, then the records behind it*

When an answer ends, the model proposes three narrower
slices worth opening; the server looks each one up first and prints the real
count, and a suggestion that matches zero reports is dropped. The model
proposes. The file counts. That division of labour runs through everything
here.


![Reports where the box the mechanic ticked disagrees with the paragraph underneath it](screenshots/conflicts.png)
*Reports where the box the mechanic ticked disagrees with the paragraph underneath it*

### How it was built, in one paragraph each

**Every button is one written instruction.** Not code. A description of the
job with house rules attached: say what you read and how much of it, quote in
the mechanic's own capitals with the record number, say "several" rather than
a number you have not verified, and if the write-ups do not support an answer,
say exactly that in one sentence and stop. The refusal is displayed as a
result, not hidden as a failure.

**The honesty is boring code, not clever prompting.** The quote checker is a
substring test. The next-click counts are lookups. The date fix is a lookup
too: the model read `01/05/2024` as the first of May, because the FAA writes
month first, so now every date reaches it spelled out as "5 January 2024" and
it cannot flip one again. When you find yourself begging a model to be
accurate, stop begging and write the ten lines that make lying impossible.

**And the loop never went away.** You describe what you want, you look at what
came back, you find the specific thing that is wrong and you say that, and
only that. The model invented WN as the code for Southwest; the real FAA
designator is SWAA, so now it is handed the real list and nothing outside it
is accepted. Long reports silently broke one of the five questions; the error
turned out to be a web server rejecting long requests, a limit from 1998,
raised in one line. Asked cold about the film, the model insisted it was
*Downfall* (2022); now the server searches first and the model is held to the
results. The good parts of this site were not designed in advance. They exist
because I used the thing, found it irritating, and complained precisely.


![One report on its own page, built for citing: the FAA's wording beside the plain English](screenshots/case.png)
*One report on its own page, built for citing: the FAA's wording beside the plain English*

### Send out a team

For the parts where I did not yet know how the information should look, I
asked for a team: usability, layout and narrative specialists and a red team,
each taking the part of the problem that belongs to their trade, a project
leader choosing between them. They proposed the leads a journalist would
actually chase (smoke in the cabin, cracks, engines shut down in flight, an
unscheduled landing, corrosion at level 3), the report from yesterday on the
front page, the code legend in view, and the same-day clusters. The red team
also cut things, with reasons recorded in
[`docs/DESIGN-Z2.md`](docs/DESIGN-Z2.md): no chat window over the selection,
no damage map across aircraft types, no event detection by two model passes
agreeing. I did not think of most of what shipped.


## What it refuses to say

The strongest objection to building this is not that the tool is inaccurate.
It is that the tool is accurate and still misleading. Sort by operator and the
biggest airline comes out on top, because it has more aircraft, flying more
hours, inspected by more people; a rigorous maintenance department files more
reports than a sloppy one, since filing the report is the system working
rather than failing. The FAA file contains no fleet sizes and no flying hours,
so this site has no rates and no league table of airlines, and says in the
margin that counts are counts of reports filed, not of flights. One pattern
survives all of that, and it is why the tool exists: when a single operator
writes up the same system, on several different aircraft, on the same day, the
cause is almost never the aircraft. It is a batch of parts, a supplier, a
procedure, or an inspection everybody ran at once. You cannot see that reading
one row at a time. It is arithmetic, and a computer should be doing it for
you.

Measured cost of the reading: 2 to 9 seconds for one report; about 30 seconds
and 260k tokens for 300 write-ups; the whole file would be 1.52 billion
tokens, which is why it is not read whole and
[`MODEL_USE.md`](MODEL_USE.md) says so.

## Who wrote what

**GLM-5.3-Flash wrote a whole working tool on its own**, over two days, from
nothing but written specifications. Not a demo: four rails, an aircraft shaded
by where the trouble sits, nineteen filters, the record table, a case sheet, a
phone layout and nine research features it chose itself. The specifications are
in [`rebuild/specs/`](rebuild/specs/), 12,243 words. Every brief it was given is
in [`rebuild/*.prompt.txt`](rebuild/), verbatim. Its own reasoning is committed
too, 4.35 million characters of it. That page is still running, at
[aircraftdefects.com/z/rebuilt](https://aircraftdefects.com/z/rebuilt), so it can
be used rather than described.

**Then the job changed.** A tool that counts write-ups, sorts them and plots
them still cannot read them, and reading them was the point. So the model moved
inside the page: fifteen endpoints where it reads the FAA's own words live, each
one listed in [`MODEL_USE.md`](MODEL_USE.md) with its guard and its measured
cost. The frame around those readings, the page at the root, is hand-written.

By character count of everything this repository serves, **71.0% is the model's
and 29.0% is not**, counted by
[`build/count_provenance.py`](build/count_provenance.py) rather than claimed.
Run it with `--check` and it fails if the table has drifted.

## On the second assistant

GitHub lists two contributors. This says what the other one did, so nobody has to
guess.

GLM-5.3-Flash is the subject of this project. It wrote a whole working tool on
its own from written specifications, it does every live reading on the page now,
and it designed the nine research features itself. That is 71.0% of the code this
repository serves, counted by
[`build/count_provenance.py`](build/count_provenance.py).

A coding assistant, Claude Code, was used for the other 29.0%: the frame at the
root that holds the model's readings, the build and splice scripts, the browser
harnesses that measure the page, the deployment plumbing, and this documentation.
It also wrote the guards around the model, the substring check that verifies every
quote and the rules that make it abstain.

It reads nothing for a visitor and appears nowhere on the page. Every word a
reader sees is either the FAA's or GLM-5.3-Flash's.

The split is marked in the source rather than described: blocks headed
`# ---- hand-written` in [`app/app.py`](app/app.py), and the file-by-file count in
[`MODEL_USE.md`](MODEL_USE.md), which `--check` will fail on if it drifts.

## Running it

    export ZAI_API_KEY=...

    # the service. --limit-request-line 32768 is not optional: the case-sheet
    # questions carry the whole record in the URL, and gunicorn's default 4094
    # rejected long write-ups (found 31 August 2026; nginx buffers are already 32k)
    cd app && python3 -m gunicorn -w 2 -b 127.0.0.1:8211 --timeout 300 \
        --limit-request-line 32768 --limit-request-field_size 32768 app:app

    scp rebuild/z2.html host:/opt/sdrz/static/index.html   # the page
    curl .../z/api/specimen/warm            # pre-read the landing states after an FAA refresh
    python3 app/build_ntsb.py               # the NTSB accident file; needs mdbtools
    app/refresh_ntsb.sh                     # the same, monthly from cron, with the restart
    python3 build/count_provenance.py --check   # fails if the provenance table has drifted

## What is in here

| | |
|---|---|
| `rebuild/z2.html`, `rebuild/case.html` | the page and the case page |
| `app/app.py` | the service: the file's API, the model calls, the verifier |
| `rebuild/specs/`, `rebuild/*.prompt.txt` | the specifications and briefs the model was given for the earlier page |
| `MODEL_USE.md` | every live call, its guard and its cost; the provenance count |
| `docs/DESIGN-Z2.md` | the design panel and the red team's cuts |
| `docs/FINDINGS.md`, `HACKATHON_LOG.md` | the working notebook, prompt by prompt |
| `build/` | the browser harnesses and the provenance counter |
| `video/` | the film pipeline: captured page states and frame-exact slides. The earlier cuts used a synthesised narration and are not published; the video linked above is narrated by me |

MIT. The data is the FAA's, published by it at https://sdrs.faa.gov under its
own terms. Codes are decoded
from the FAA's own lookup tables; airline names come from its December 2006
cross-reference and can be stale, so check current ownership before
publishing.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*. Built by Henk
van Ess, 2026. GLM-5.3-Flash wrote the tool at
[/z/rebuilt](https://aircraftdefects.com/z/rebuilt) from written specifications,
and does all the live reading on the page you land on. The split is counted in
[`MODEL_USE.md`](MODEL_USE.md), see "Who wrote what" above.
