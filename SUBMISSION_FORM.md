# Project description, for the submission form

**Project name:** aircraftdefects.com

**Live:** https://aircraftdefects.com
**Video (83 s):** https://www.youtube.com/watch?v=vDMEKsNj7ss
**Code:** https://github.com/voelspriet/aircraftdefects
**How it was built, written up:** https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with
**The original government database:** https://sdrs.faa.gov

---

## Inspiration

I was watching *Freefall* on Netflix and saw families of the victims trying to
read what mechanics had written about broken planes. They were sent to a government
website. I went there myself and I was curious and furious at the same time,
because the landing gear is suddenly `ZONE 700` and an emergency landing is just
the letter `A`. That is impossible for a person to understand, let alone a
grieving family.

Every day mechanics file service difficulty reports with the FAA: a cracked
bracket, a failed sensor, corrosion found on inspection. There are 1,758,134 of
them, on 54,634 aircraft, going back to 1995. They are public, free, and need no
records request. They are also close to unreadable: buried behind a government
query form, written in trade shorthand, returned as raw rows with no context.

So I decided to make it completely transparent.

## The solution

**aircraftdefects.com opens that archive.** Search thirty years of reports by
airline, tail number, aircraft type, part, system code or keyword. Click any part
of the aircraft and see what has been reported for that section. Free, no login.

Built for the GLM-5.3 Flash Lightning Hackathon, with the model doing the thing a
database cannot: reading the mechanic's own words and saying what happened.

## Key features

**The model is inside the page, not bolted onto it.** Fifteen endpoints call
GLM-5.3-Flash to read the FAA's raw write-ups at the moment you click, ten of them
streaming so the reading arrives a sentence at a time. It explains one report in
plain words for someone who has never seen the form. It reads up to 300 write-ups
across a selection and names what keeps coming back that no coded field was built
to hold. It finds reports where the box a filer ticked disagrees with the sentence
they wrote underneath. It reads the FAA registry file for an aircraft and says
what it does say and what it does not: that the registered owner may be a bank
rather than whoever flies it.

**Click any part of the aircraft.** A schematic aircraft, shaded darker where the
reports cluster. Before you have read a word you know which section is in trouble.
It also says how many reports it cannot place, because 85% describe the location
in words and carry no zone code.

**Seventeen research leads**, each with the next step: the forty most written-up
parts, one operator writing up the same system on several aircraft on one day,
what appeared in the file for the first time this year, the paperwork gap, and
the aircraft from the documentary.

**Every quote is verified before you see it.** Checked by the server against the
record it cites, as a literal substring, not by another model. A sentence whose
quote fails is deleted, and the page prints the score. Click any sentence and it
opens the records it stands on.

**It says what it cannot answer, first.** Ask which aircraft is most dangerous and
it refuses: the file records what mechanics found and fixed, not accidents and not
danger. Counts are of reports filed, not incidents. The FAA file carries no fleet
sizes and no flying hours, so no rate can be computed and none is. The point is to
find leads, not to rank airlines.

## The build

Over two days, GLM-5.3-Flash wrote a complete interface to this file on its own,
from written specifications rather than from code handed to it. It still runs at
aircraftdefects.com/z/rebuilt, so it can be used rather than described. It also
designed the nine research features itself, wrote them, and now does every live
reading on the page. That is 74.3% of the code this repository serves, counted by
a script rather than claimed.

The corpus behind it is one CSV per year from
https://external.apic4e.faa.gov/sdrs/retrieve/, 1995 to now, downloaded whole
because the FAA publishes no API.

**Total model spend: $1.07.**

## Impact

That number matters more than it looks. Public-interest tools usually die at the
funding stage, not the idea stage. At a dollar a project the arithmetic changes: a
researcher with a public dataset and a free weekend can ship the interface the
agency never built.

A day after it was built, the [Foundation for Aviation
Safety](https://www.foundationforaviationsafety.org/) got in touch. That is the
test of whether a tool like this is worth anything: not the score, but whether
the people who work on the problem every day find it useful.

By breaking the language barrier between government aviation data and the people
who paid for it, aircraftdefects.com gives journalists, researchers and families
the information they are owed, in words they can read.

The data was always public. What fell is the cost of making it usable.
