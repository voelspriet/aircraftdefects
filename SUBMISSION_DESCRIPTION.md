# Make it readable

**Live: [aircraftdefects.com](https://aircraftdefects.com/)** · MIT · GLM-5.3-Flash reads the file live
**Video (83 s, my own voice):** https://www.youtube.com/watch?v=vDMEKsNj7ss
**The build, written up:** https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with

## The problem

I was watching *Freefall: A Reckoning for Boeing* on Netflix and saw relatives
of victims trying to read a government website. Row after row of capital
letters. Zone numbers. Single character codes.

The database is the FAA's Service Difficulty Reporting System: 1,758,134
reports since 1995, on 54,634 aircraft, filed by mechanics every time
something is found wrong with a plane, and free for anyone to read. Almost
nobody ever has, because nine of the ten boxes on the form are codes and they
conflict. `ZONE 700` means the landing gear. `A` means an unscheduled landing
in one box and "filed by an airline" in another. The airline itself is a code
(`CALA`), the finding is a second code, the way it was found is a third. The
tenth box is the only human one: the mechanic's own write-up, in trade
shorthand, in capitals: `R & R NLG UPLOCK BOX IAW AMM 32-33-07`.

The FAA's own site can search the characters. It cannot read the words. I saw
the father of one of the victims trying anyway.

The aircraft from the film is in the file. Two reports on N704AL: the door
plug blow-out of 5 January 2024, in the mechanic's own words, and, five days
earlier, a door that was hard to open, aircraft grounded. Both open from the red
Freefall cell among the leads, at aircraftdefects.com/#view=freefall.

The work fell into two acts. First we had to rebuild the original database
into something a human can read at all. Then we had to make sense of it,
which is where GLM-5.3-Flash stopped being a builder and became a reader.

## Act one: rebuild the database so a human can read it

Everything coded had to become language, and everything had to become a
click.

- **Every code decoded through the FAA's own tables.** The dictionary was
  public the whole time, on the same site, twenty seconds away from the data;
  the agency just never put the two on the same plate. Airlines are named
  from the FAA's own cross-reference (`REXA` becomes Pinnacle Airlines), crew
  actions become words ("unscheduled landing", not `A`), system codes become
  systems ("Landing Gear Retraction/Extension System", not `3230`).
- **A schematic aircraft as the front door**, shaded by how often each zone
  is written up. You know which part of the aircraft is in trouble before you
  have read a word. And because a machine asked to draw where aeroplanes
  break will draw it from whatever it can place and make it look complete,
  the two numbers it cannot place (reports that name a place only in words,
  and reports that name none) sit underneath in the same size type.
- **Everything is a filter.** A zone, a month, an airline, a crew action, a
  system, an engine, a word from the write-ups. The chosen thing becomes the
  page's red headline, the address bar follows, and the link is the state.
- **Every report has a citable address**, `/case/<control number>`: the
  write-up with copy-the-quote and copy-the-citation buttons, every code
  spelled out with the FAA's wording kept beside the plain English so either
  can be quoted, "before you publish this" caveats, and links out to the
  FAA's own search, FlightAware, Flightradar24 and the FAA registry for the
  tail.
- **Seventeen leads** sort the file by what a journalist would actually chase:
  smoke in the cabin, cracks, engines shut down in flight, same-day clusters
  across a fleet, old airframes, new defects, the paperwork gap, and the
  reports where the box a mechanic ticked disagrees with the sentence the
  same mechanic wrote beneath it (106 on 5 September 2026, found by a scan
  and by readers, and growing) ([/conflicts/](https://aircraftdefects.com/conflicts/)).

That act produced a database you can finally see. It also produced the
objection that shaped everything after it: the tool was accurate and still
misleading. Sort by operator and the biggest airline comes out on top,
because it has more aircraft, flying more hours, inspected by more people,
and because filing reports is the system working, not failing. The file
contains no fleet sizes and no flying hours, so this site refuses rates,
league tables and danger rankings outright, and says so on the page.

And it was still only counts. Plenty of numbers, no stories.

## Act two: make sense of it, live

The story of every report sits in that one free-text field. So the model's
job changed. Until this point GLM-5.3-Flash had been the builder: I described
a page, it wrote code. Now it is inside the page. Every teal block is the
model reading FAA write-ups at the moment you click, on whatever slice of the
file you have in front of you, streamed as it is written, and labelled "its
words, not the FAA's".

**The report reads itself.** The front page opens on the newest report where
the crew had to act, told in about a hundred words for someone who has never
seen the form: what aircraft, whose, what failed, what the part is for, what
the crew did, what the mechanic did, and one closing sentence naming what the
report does not say. Read the moment it arrived, cached by record on disk,
on screen in under a second. Technical terms link out to a search.

**Five questions on any report.** What actually happened. Was anyone in
danger, with a strict instruction: only what the report states, and what it
does not. What did the mechanics do. Does it say why (quoted if it does, said
plainly if it does not). And what should we check next, whose answer comes
back as clickable searches: same aircraft, same part, same airline, same day,
built from the record itself when the model offers none.

**What recurs.** Over any selection the model reads up to 300 write-ups and
writes prose, not a list: the phrases mechanics reach for, the repairs that
repeat, the thing that is quietly becoming a pattern, one verbatim quote per
claim with its record number. The button says beforehand exactly what will be
read ("300 of 12,397 write-ups, newest first, not a sample of the rest") and
what it costs.

**Prove it.** This is the part that makes the rest usable instead of
dangerous. When any stream ends, the server splits the answer into sentences
and finds every quote: text in quotation marks, or the mechanics' capitals
directly before a record number. Each quote is checked as a literal substring
of the record it cites. Not by another AI; by twenty lines of ordinary code.
A sentence whose quote is not in the record is deleted before the reader sees
it, and the page prints the score: "32 quotes checked, 32 verified, 1
sentence removed". Click any sentence and the records it stands on open
beneath it, with the quoted fragment beside the record number, airline, tail
and date. The check costs no tokens and cannot be argued with.

**Next three clicks.** After a reading, the model proposes three narrower
slices worth opening, with a reason from what it just read. The server
resolves each against the file first and prints the real count; a suggestion
that matches zero reports is dropped before it reaches you. The model
proposes. The file counts. That division of labour runs through everything
here.

**The question the form cannot hold.** Type "what plane is the most
dangerous" and the answer begins by saying what the file cannot tell you:
it records what mechanics found and fixed, not accidents, not injuries, not
risk. Then it gives the closest thing the file can carry, which types are
most written up, with verified quotes, and it is instructed never to say
"most dangerous" about any of them. The refusal is displayed as a result,
not hidden as a failure.

**One aircraft, end to end.** Give it a tail number and it reads every report
ever filed on that airframe, oldest first, and writes its life one turning
point at a time, each paragraph pinned to its record. Two guards make this
honest. Where the file goes quiet for more than a year, the server inserts a
marker, so the model must write "nothing was filed between these dates, which
says something about the file, not the aircraft" instead of bridging the gap
with a guess. And the words because, caused, led to and due to are banned
outright, since the file records no causes.

**Two airlines, what differs.** The counts come from the file; the model
reads the newest 150 write-ups from each side and says, in the mechanics' own
words, what only one of them has, forbidden to call either safer or worse.

**Ask the file.** A plain question becomes draft filter chips, validated
against the FAA's own code tables and airline list, shown before anything
runs, with the words it could not map listed at the same size. Nothing runs
until you press Run.

**The film's page, and the web.** For the one page that needs context beyond
the file, the server runs the web search itself, drops mirrors and
translations, and the model may use only those results, one named source per
sentence, labelled "the web, not the file". This rule exists because on the
first attempt the model was asked cold and confidently insisted the film was
*Downfall* (2022). That path is closed.

## Why the model can be trusted here

Because it is not trusted. Its freedom is bounded by ordinary code that makes
lying impossible, and every one of those bounds exists because something went
wrong first:

- The quote checker is a substring test, added after watching answers closely.
  Its own first live run caught a false positive (counted facts like
  "(AALA, 514)" are not quotes) and a real removal.
- The next-click counts are lookups; zeroes are dropped.
- Dates reach the model spelled out ("5 January 2024") because it read
  `01/05/2024` as the first of May; the FAA writes month first.
- Airline codes are held to the FAA's own list because the model invented
  `WN` for Southwest; the real designator is `SWAA`.
- The web search is run server-side because the model, asked cold, answered
  from memory and got the film wrong.
- Every block states what it read, how long it took and how many tokens, and
  abstains in one plain sentence when the write-ups do not support an answer.

When a model must be accurate, stop asking nicely and write the ten lines
that check.

Measured, on the live service: one report reads in 2 to 9 seconds; 300
write-ups in about 30 seconds and 260k tokens; the whole file would be 1.52
billion tokens, which is why it is not read whole and
[MODEL_USE.md](MODEL_USE.md) lists every call with its prompt, guard and
cost. What the model refused to build is recorded with reasons in
[docs/DESIGN-Z2.md](docs/DESIGN-Z2.md): no danger rankings, no causes, no
rates (the file has no denominators), no chat window over the selection, no
event detection by two model passes agreeing.

## Who wrote what

Disclosed, not blended. The shipped pages are a hand-written frame; on them
GLM-5.3-Flash is the reader, and every live call it makes is documented. The
model's own earlier page build, written from 12,243 words of specifications
in `rebuild/specs/`, is preserved in the repository with its hand-written
share counted, not claimed, by `build/count_provenance.py`. The service is
the model's nine research builds plus hand-marked blocks, each headed
`# ---- hand-written` with the date.

The whole build, from watching the documentary to this submission, took four
days and is logged prompt by prompt in [HACKATHON_LOG.md](HACKATHON_LOG.md)
and told in full in the article above.

Total model spend for the build, from the z.ai console: **$1.07**. Public-interest
tools usually die at the funding stage, not the idea stage. At a dollar a project
the arithmetic changes: a researcher with a public dataset and a free weekend can
ship the interface the agency never built. The data was always public. What fell
is the cost of making it usable.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*. Built by Henk
van Ess, 2026. GLM-5.3-Flash wrote
the tool at /z/rebuilt from written specifications, and does all the live
reading on the page you land on. By character count of everything this
repository serves, 65.0% is the model's, counted by
`build/count_provenance.py` rather than claimed.
