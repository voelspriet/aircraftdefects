# Make it readable

**Live: [aircraftdefects.com](https://aircraftdefects.com/)** · MIT · GLM-5.3-Flash reads the file live
**Demo film (5:33):** https://aircraftdefects.com/z/img/film-v5.mp4
**The build, written up:** https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with

## The problem

I was watching *Freefall: A Reckoning for Boeing* on Netflix and saw relatives
of victims trying to read a government website. The FAA publishes 1,757,827
aircraft defect reports since 1995, on 54,634 aircraft, free to read and almost
never read, because everything is a code. `ZONE 700` means the landing gear.
`A` means an unscheduled landing in one box and "filed by an airline" in
another. The story of every report sits in one free-text field, the mechanic's
write-up, in trade shorthand, in capitals. The FAA's own site can search the
characters. It cannot read the words.

The aircraft from the film is in the file: two reports on N704AL, the door
plug blow-out of 5 January 2024 and, five days earlier, a door that was hard
to open. Both are on the site, under the red Netflix cell.

## What GLM-5.3-Flash does here

Every teal block on the page is the model reading FAA write-ups live, at the
moment you click, on whatever slice of the file you have in front of you:

- **The report reads itself.** The newest crew-action report, told in about a
  hundred words for someone who has never seen the form, every code decoded
  through the FAA's own tables. Pre-read at ingest, on screen in a second.
- **Five questions on any report**: what actually happened, was anyone in
  danger, what did the mechanics do, does it say why, what should we check
  next. The last answer comes back as clickable searches.
- **What recurs**: over any selection the model reads up to 300 write-ups and
  names what keeps coming back that no coded box was designed to hold.
- **Prove it.** Every quote the model makes is checked, server-side, as a
  literal substring of the record it cites. A sentence whose quote fails is
  deleted before the reader sees it, and the page prints the count ("32 quotes
  checked, 32 verified"). Click any sentence to open the records it stands on.
- **Next three clicks**: the model proposes narrower slices; the server
  resolves each against the file and prints the real count; zeroes are dropped.
  The model proposes, the file counts.
- **A question the form cannot hold** ("what plane is the most dangerous"):
  the answer says first what the file cannot tell you, then gives the closest
  honest thing, most written up, never most dangerous.
- **One aircraft, end to end**: every report on a tail, oldest first, told as
  a story. Gaps over a year are inserted by the server as markers so the model
  must say "nothing was filed", and the words because, caused, led to and due
  to are banned: the file records no causes.
- **Two airlines, what differs**, in the mechanics' own words; the counts stay
  the file's.
- **The film's page**: for context the server runs a web search first and the
  model may only use those results, one named source per sentence, labelled
  "the web, not the file". (On the first attempt the model answered from
  memory and got the film wrong; that path is closed.)
- **Ask the file**: a plain question becomes draft filter chips, validated
  against the FAA's own code tables and airline list, run only when pressed.

Every block streams, states what it read ("300 of 12,397 write-ups, newest
first, not a sample of the rest"), how long it took and how many tokens, and
abstains in one plain sentence when the write-ups do not carry an answer. The
abstention is displayed as a result. Every report also has a citable page,
`/case/<control number>`, with the FAA's own wording kept beside the plain
English, copy-the-quote and copy-the-citation buttons, and links to the FAA's
search, the flight trackers and the registry for the tail.

## Why this is a frontier build, not a wrapper

The model's freedom is bounded by ordinary code that makes lying impossible:
the quote checker is a substring test, the next-click counts are lookups,
dates reach the model spelled out ("5 January 2024") because it once read
01/05/2024 as the first of May, the airline codes are held to the FAA's own
list because it once invented WN for Southwest. When a model must be accurate,
we stopped asking nicely and wrote the ten lines that check.

Measured: a single report reads in 2 to 9 s; 300 write-ups in about 30 s and
260k tokens; the whole file would be 1.52 billion tokens, which is why it is
not read whole and MODEL_USE.md says so. The site also carries what the model
refused to build, with reasons, in docs/DESIGN-Z2.md: no danger rankings, no
causes, no rates, because the file has no denominators.

## Who wrote what

Two pages are served and the honest answer differs. The page at / is a
hand-written frame (rebuild/z2.html); on it the model is the reader, and every
live call is listed with its prompt, guard and cost in MODEL_USE.md. The page
at /z/rebuilt is the model's own earlier build from
written specifications, with the hand-written share counted, not claimed, by
build/count_provenance.py. The service is the model's nine research builds
plus hand-marked blocks (45%). Every hand-written commit says so in its first
word.

The whole build, from watching the documentary to this submission, took four
days and is logged prompt by prompt in HACKATHON_LOG.md and told in full in
the article above.

Inspired by Rory Kennedy's *Freefall: A Reckoning for Boeing*. Built by Henk
van Ess with GLM-5.3-Flash reading and Claude writing the frame.
