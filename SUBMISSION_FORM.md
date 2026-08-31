# Project description, for the submission form

**Project:** aircraftdefects.com

---

I was watching *Freefall* on Netflix and saw families of the victims trying to
read what mechanics had written about the planes. They were sent to a government
website. I went there myself and I was curious and furious at the same time,
because the landing gear is suddenly `ZONE 700` and an emergency landing is just
the letter `A`. That is impossible for a person to understand, let alone a
grieving family. So I decided to make it completely transparent.

Every day, aircraft mechanics file service difficulty reports with the FAA: a
cracked bracket, a failed sensor, corrosion found on inspection. The reports are
public. They are also close to unreadable, buried behind a government query form,
written in trade shorthand, returned as raw rows with no context. There are
1,757,827 of them, on 54,634 aircraft, going back to 1995.

**aircraftdefects.com opens that archive.** Search thirty years of reports by
airline, tail number, aircraft type, part, system code or keyword. Click any part
of the aircraft and see what has been reported for that section. It is free and
needs no login.

**GLM-5.3-Flash is inside the page, not bolted onto it.** Fifteen endpoints call
the model to read the FAA's raw write-ups at the moment you click, ten of them
streaming so the reading arrives a sentence at a time. It explains one report in
plain words for someone who has never seen the form. It reads up to 300 write-ups
across a selection and names what keeps coming back that no coded field was built
to hold. It finds reports where the box a filer ticked disagrees with the sentence
they wrote underneath. It reads the FAA registry file for an aircraft and says
what it does say and what it does not, that the registered owner may be a bank
rather than whoever flies it. It offers seventeen research leads and the next step
for each, including the aircraft from the documentary.

**Every quote the model makes is checked against the record it cites before you
see it**, by a substring test rather than by another model, and the page prints
the score. A sentence whose quote fails is deleted. Click any sentence and it
opens the records it stands on. When the file cannot answer, the model says so
first: it refuses to name the most dangerous aircraft, because the file records
what mechanics found and fixed, not accidents and not danger. Counts are of
reports filed, not incidents, and the site calculates no rates. The point is to
find leads, not to rank airlines.

**The build is the second half of the story.** The scraper, the database, the
search layer and the interpretation were written with GLM-5.3-Flash over two days,
from written specifications rather than from code handed to it, and so was the
first complete interface, which still runs at aircraftdefects.com/z/rebuilt so the
two can be compared. Total model spend: **$1.07**.

The whole build is written up at
[Digital Digging](https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with),
prompt by prompt, including what went wrong.

That number matters more than it looks. Public-interest tools usually die at the
funding stage, not the idea stage. At a dollar a project the arithmetic changes: a
journalist with a public dataset and a free weekend can ship the interface the
agency never built.

The data was always public. What fell is the cost of making it usable.

---

Live: https://aircraftdefects.com
Video (83 s): https://www.youtube.com/watch?v=vDMEKsNj7ss
Code: https://github.com/voelspriet/aircraftdefects
How it was built, written up: https://www.digitaldigging.org/p/lets-fix-chaotic-public-data-with
