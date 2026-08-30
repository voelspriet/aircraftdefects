# Make it readable

**Live: [aircraftdefects.com](https://aircraftdefects.com/)** · GLM-5.3-Flash, reading the file live · MIT
**Demo film (5:33):** https://aircraftdefects.com/z/img/film-v5.mp4 · **the build, written up:** [Digital Digging](https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with)

A government can publish everything it holds and still answer none of your
questions.

I was watching *Freefall: A Reckoning for Boeing* on Netflix. Relatives of
people who died were trying to find out what had been reported about the
aircraft, on a government website. Row after row of capital letters. Zone
numbers. Single-character codes.

I stopped the documentary, typed the URL in myself, and never went back to it.

What is there is 1,757,827 FAA service difficulty reports going back to 1995,
on 54,634 aircraft, every one free to read and almost none of them ever read.
A report says `ZONE 700` where it means the landing gear, `A` where it means
the crew landed somewhere they had not planned to, and then one line in a
mechanic's shorthand: `R & R NLG UPLOCK BOX IAW AMM 32-33-07`.

The aircraft from the film is in there. Two reports on N704AL, an Alaska
Airlines 737-9. One filed five days before the door plug blew out: a door hard
to open, aircraft grounded. The other is the blow-out itself, in the mechanic's
own words, filed on 5 January 2024. You will find both under the red Netflix
cell at the top of the page.

## What the page does

One screen. Four rails that are always there, WHERE, WHEN, WHO, WHAT IT
FORCED, and a breadcrumb; a search line that takes a question or a word, a
tail, an airline, a type; and a period line (all, this year, last year, last
90 days, this month, or your own dates). The page opens on the last 90 days.

Click anything and it becomes the selection: a zone on the aircraft drawing, a
month, an airline, a crew action, a system, a word. The chosen thing appears
in big red type above the findings, with the period beneath it, then a counted
sentence, then the records, 25 at a time through the whole selection. Airlines
are named from the FAA's own cross-reference rather than shown as codes, and
the search line suggests real values for whatever kind you pick: airlines by
name, tails, types, parts, system codes, the mechanics' own words. Every report opens on its own page,
`/case/<control number>`: the mechanic's words with copy-the-quote and
copy-the-citation buttons, every code spelled out with the FAA's wording
beside it, the five model questions, links to the FAA's own search and the
flight trackers for the tail, and the way back to the selection it came from.

Sixteen leads under the fold each become the main screen when clicked, and
everything in them is clickable too. There is always a way back: the
breadcrumb, the × on every filter, "clear all, back to the start", and "start
again" in the masthead.

## Where GLM-5.3-Flash reads, and what the FAA's site cannot do

The FAA's search form returns rows. It reads every box as a code and the
write-up as an opaque string. It cannot say what `OVRHD SUPRNMRY AREA
EMERGENCY LIGHT INOP` means, whether two filings on one day describe one
event, or what keeps coming back in ten thousand write-ups that no box was
ever designed to hold.

Everything on /z that the FAA's site cannot do is the model reading words.
Each is a teal block. Each streams as it is written, says what it read ("300
of 12,397 write-ups, newest first, not a sample of the rest"), how long it
took and how many tokens, and abstains in one plain sentence when the
write-ups do not carry an answer. Nothing the model writes is set like a
count. It says "its words, not the FAA's".

| You press | The FAA's site | GLM-5.3-Flash on /z |
|---|---|---|
| Nothing: the front page | a form | the latest report where the crew had to act, already read: the whole record, decoded by the FAA's own tables, told in 110 words for someone who has never seen one, technical terms linked to a Perplexity search. Pre-read at ingest for fifteen landing states and cached by record, so it is on screen in a second |
| Any report | a row | its own page, `/case/<control number>`: the write-up with copy-the-quote and copy-the-citation buttons, every code spelled out with the FAA's wording kept beside the plain English, "before you publish this" caveats, links to the FAA's search, FlightAware, Flightradar24 and the registry for the tail, and five questions: what actually happened, was anyone in danger, what did the mechanics do, does it say why, what should we check next. The last one comes back as clickable searches |
| **Read what recurs in these** on any selection | a count | reads up to 300 write-ups and writes prose, not a list, naming what recurs that no coded box captures, one verbatim quote per paragraph with its record number |
| **Ask** with a question the filters cannot hold ("what plane is the most dangerous") | nothing | says first what the file cannot tell you (danger, injuries, rates), then the closest thing it can, from the counts and the newest 200 write-ups, with quotes. It never says "most dangerous"; it says "most written up" |
| **Ask** with a question the filters can hold | a form with nineteen boxes | draft filter chips, checked against the FAA's own code tables and airline list, shown before anything runs. On first test it invented WN for Southwest; the designator is SWAA; it is now held to the list |
| **Read this aircraft end to end** on any tail | 419 rows | every report on that airframe in date order, one dated paragraph per turning point, each pinned to its record. The server inserts "nothing filed between X and Y" markers so the model cannot bridge a gap, gives the filing lag per record, and bans "because", "caused", "led to": the file records no causes |
| **Tell me what differs** on Compare | two counts | the newest 150 write-ups from each airline, in three paragraphs: shared, only here, only there. The counts stay the file's; the prompt says never to call one airline safer or worse |
| Any word in a write-up | a string | what mechanics mean by it, from up to 60 write-ups carrying it, each with a record; under ten uses it says so and stops |
| The Freefall page | nothing | the file's own 22 reports on N704AL and the door-plug fleet inspection, and beneath them, labelled "the web, not the file", what the NTSB found and what the film says: the server runs a web search first, drops mirrors and translations, and the model may use only those results, one named source per sentence |

### Prove it

Every answer is checked before it is final. When a stream ends, the server
splits it into sentences and finds every quote: text in quotation marks, or
the mechanics' capitals directly before a `[record number]`. Each quote is
checked as a literal substring of the record it cites. A sentence whose quote
is not in the record is deleted before the page shows the final text, and the
page says so: "41 quotes checked, 40 verified, 1 sentence removed". Any
sentence that rests on records can be clicked to see them, with the quoted
fragment beside the record number, airline, tail and date. No extra tokens;
deterministic; the same check covers every block above.

### Next three clicks

After a reading, the model names three narrower slices worth opening and why.
The server resolves each against the file and prints the real count; a slice
with zero reports is dropped. "The model's suggestions, not a ranking."

### What it will not do

It does not decide whether two filings on one day were one event (two model
passes agreeing is not verification). It does not draw a damage map across
aircraft types (station 540 on a 737 is not station 540 on an A320). It does
not offer a chat window over the selection; the next-three-clicks line does
the useful half of that without pretending to be a conversation. The design
panel's reasons are in [`docs/DESIGN-Z2.md`](docs/DESIGN-Z2.md).

Measured cost: 865 tokens and 1.42 seconds per report at six concurrent. A
pass over the whole file would be 1.52 billion tokens. It has not been run,
and [`MODEL_USE.md`](MODEL_USE.md) says why.

## Who wrote what

Two pages are served, and the honest answer is different for each.

**aircraftdefects.com** (also served at /z), the page you land on, is a hand-written frame:
`rebuild/z2.html`, 81,954 characters, written by Claude on 30 and 31 August
2026 at my decision, after two rounds of asking GLM-5.3-Flash to repair the
earlier page did not land. On this page the model is not the author of the
code. It is the reader of the file, and every one of its readings is a live
call listed, with its prompt, guard and measured cost, in `MODEL_USE.md`.
Every hand-written commit says so in its first word.

**aircraftdefects.com/z/rebuilt** is the earlier page, written by GLM-5.3-Flash
from written specifications in `rebuild/specs/` (12,243 words, one file per
surface, decisions rather than shapes), with hand-written blocks counted by
`build/count_provenance.py`: 28,469 of 81,867 characters, 34.8%. It is left in
place so the two can be compared.

**The service**, `app/app.py`, is the model's nine research builds plus
40,858 bytes (45.4%) of hand-written blocks, each headed `# ---- hand-written`
with the date: the streaming, the verifier, the specimen cache, the question,
airframe and compare readings, and the web search.

## Nothing is asserted that the file cannot carry

The data has no fleet sizes and no flying hours, so there are no rates and no
league table of airlines. Counts are counts of reports filed, not of flights,
and the page says so in the margin. Where a drawing can only place part of the
selection it says so underneath in the same size type. A filter the file does
not recognise runs no query and says why. Dates are handed to the model
spelled out ("5 January 2024"), because it read `01/05/2024` as the first of
May.

## Running it

    export ZAI_API_KEY=...
    python3 app/app.py                        # the service, gunicorn on 127.0.0.1:8211, behind nginx at /z
    # gunicorn needs --limit-request-line 32768: the case-sheet questions carry the whole record in the URL,
    # and the default 4094 rejected long write-ups (found 31 August 2026; nginx buffers are already 32k)
    scp rebuild/z2.html host:/opt/sdrz/static/index.html
    curl https://aircraftdefects.com/z/api/specimen/warm   # pre-read the landing states after each FAA refresh
    python3 build/count_provenance.py         # who wrote /z/rebuilt

## What is in here

| | |
|---|---|
| `rebuild/z2.html`, `rebuild/case.html` | the page and the case page, hand-written |
| `app/app.py` | the service: the file's API, the model calls, the verifier |
| `rebuild/specs/`, `rebuild/*.prompt.txt` | the specifications and briefs the model was given for /z/rebuilt |
| `MODEL_USE.md` | every live call, its guard and its cost; the provenance count |
| `docs/DESIGN-Z2.md` | the design panel of twenty and the red team's cuts |
| `docs/FINDINGS.md`, `HACKATHON_LOG.md` | the working notebook |
| `build/` | the browser harnesses and the provenance counter |
| `video/` | the demo film pipeline: narration, captured states, frame-exact slides |

MIT. The data is the FAA's, published under its own terms. Codes are decoded
from the FAA's own lookup tables; airline names come from its December 2006
cross-reference and can be stale, so check current ownership before publishing.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*. Built by Henk
van Ess, 2026, with GLM-5.3-Flash reading and Claude writing the frame.
