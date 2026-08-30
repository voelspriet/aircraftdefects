# Make it readable

**Live: [aircraftdefects.com](https://aircraftdefects.com/)** · GLM-5.3-Flash, reading the file live · MIT
**Demo film (5:33):** https://aircraftdefects.com/z/img/film-v5.mp4 · **the build, written up:** [Digital Digging](https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with)

A government can publish everything it holds and still answer none of your
questions.

I viewed *Freefall: A Reckoning for Boeing* on Netflix. Relatives of victims
were attempting to find answers to their questions partly via a governmental
website. Row after row of capital letters. Zone numbers. Single character
codes.

What was the database? It is called the Service Difficulty Report and is
maintained by the Federal Aviation Administration. When technicians in the
United States find an issue with a plane (a crack in a component, rust under a
piece of equipment, a failed seal), they file it. These reports are then made
available to everyone: no sign-in, no fee, no records request. There are
1,757,827 of them since 1995, on 54,634 separate planes.

I was shocked. The reports are so bureaucratic that almost everything has been
replaced by codes, and the codes conflict. A report will never tell you there
was an issue with the landing gear. It will say `ZONE 700`. An emergency
landing? That is just an `A`. But the same letter elsewhere on the form means
the report came from an airline. I saw the father of one of the victims
searching it, trying to make sense of it. It was something public, but the
government presented it as random unlabeled ingredients on a table.

The aircraft from the film is in there. Two reports on N704AL, an Alaska
Airlines 737-9: one filed five days before the door plug blew out (a door hard
to open, aircraft grounded), and the blow-out itself, in the mechanic's own
words, filed on 5 January 2024. Both sit under the red Netflix cell at the top
of the page.

## What the page does

One screen. Four rails that are always there, WHERE, WHEN, WHO, WHAT IT
FORCED, and a breadcrumb; a search line that takes a question or a word, a
tail, an airline, a type, with real suggestions for each; and a period line.
The page opens on the last 90 days.

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

Sixteen leads under the fold each become the main screen when clicked. There
is always a way back: the breadcrumb, the × on every filter, "clear all, back
to the start".

## Beyond the numbers: the model reads the file

A counter can tell you how much. It cannot tell you what happened. The story
of every report sits in a single free-text field, the mechanic's own write-up,
in trade shorthand, in capitals: `R & R NLG UPLOCK BOX IAW AMM 32-33-07`. A
tool that counts those write-ups, sorts them and plots them on an aircraft
still cannot read them. And reading them is the whole point.

So the model's job changed. Until that point GLM-5.3-Flash had been the
builder: describe a page, it writes the code. Now it is inside the page.
Every teal block is the model reading FAA write-ups at the moment you click,
on whatever slice of the file you have in front of you.

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
sentence stands on. When an answer ends, the model proposes three narrower
slices worth opening; the server looks each one up first and prints the real
count, and a suggestion that matches zero reports is dropped. The model
proposes. The file counts. That division of labour runs through everything
here.

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

Two hours of building gave the counts. The reading took two days of those
loops, and the roles are disclosed rather than blended: which surfaces the
model wrote from written specifications, which parts are a hand-written frame
around its readings, and what every live call costs are all recorded in
[`MODEL_USE.md`](MODEL_USE.md), with the shares counted, not claimed, by
`build/count_provenance.py`. The model's earlier page build is preserved in
the repository for comparison.

## Running it

    export ZAI_API_KEY=...
    python3 app/app.py                        # the service, gunicorn on 127.0.0.1:8211
    # gunicorn needs --limit-request-line 32768: the case-sheet questions carry the whole record in the URL,
    # and the default 4094 rejected long write-ups (found 31 August 2026; nginx buffers are already 32k)
    scp rebuild/z2.html host:/opt/sdrz/static/index.html
    curl .../z/api/specimen/warm              # pre-read the landing states after each FAA refresh
    python3 build/count_provenance.py         # who wrote the earlier page

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
| `video/` | the demo film pipeline: narration, captured states, frame-exact slides |

MIT. The data is the FAA's, published under its own terms. Codes are decoded
from the FAA's own lookup tables; airline names come from its December 2006
cross-reference and can be stale, so check current ownership before
publishing.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*. Built by Henk
van Ess, 2026, with GLM-5.3-Flash.
