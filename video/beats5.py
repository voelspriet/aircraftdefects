"""v5 narration: the hook, the problem, then the model's chapters. One line, one slide."""
V5 = [
 # the hook (over the documentary and the FAA form; reuses 2a-2d voice files)
 ('2a', None), ('2b', None), ('2c', None), ('2d', None),
 # the turn
 ('h1', "So I built a reader for it, and gave it to a language model. GLM-5.3-Flash, from z.ai. It reads the mechanics' shorthand, live, and answers in plain words."),
 ('h2', "Here is what it does that the government's site cannot."),
 # chapter 1
 ('c1t', "One. Say it in plain English."),
 ('c1a', "The newest report where the crew had to act, read the moment it arrived. Every code decoded by the FAA's own tables, every abbreviation opened, told in a hundred words for someone who has never seen the form."),
 ('c1b', "Underneath, the mechanic's words exactly as filed, so you can check every claim against them."),
 # chapter 2
 ('c2t', "Two. Five questions on any report."),
 ('c2a', "This is a US Airways 737 descending into Nassau in January 2000. What actually happened?"),
 ('c2b', "And what should we check next? The model answers with searches you can click: same aircraft, same part, same airline, same day."),
 # chapter 3
 ('c3t', "Three. What recurs, and prove it."),
 ('c3a', "Take every landing-gear report of the last three months. The model reads three hundred write-ups and says what keeps coming back that no code was built to hold."),
 ('c3b', "Every quote it makes is checked by the server against the record it cites. A sentence whose quote is not in the record is deleted before you see it, and the page tells you the count."),
 ('c3c', "Click any sentence and it shows the records it stands on."),
 ('c3d', "Then it proposes three narrower slices, each with its real count. The model proposes; the file counts."),
 # chapter 4
 ('c4t', "Four. A question the form cannot hold."),
 ('c4a', "Ask which plane is the most dangerous. There is no field for danger, and the model says so first: this file records what mechanics found and fixed, not accidents."),
 ('c4b', "Then it gives the closest honest answer, most written up, never most dangerous, with the records to prove it."),
 # chapter 5
 ('c5t', "Five. One aircraft, end to end."),
 ('c5a', "Pick a tail number and the model reads every report ever filed on that airframe, oldest first, and tells its story one turning point at a time."),
 ('c5b', "Where the file goes quiet, it says the file went quiet. It is forbidden to say why anything happened, because the file records no causes."),
 # chapter 6
 ('c6t', "Six. Two airlines, what differs."),
 ('c6a', "The counts come from the file. The model reads a hundred and fifty write-ups from each side and says, in the mechanics' own words, what only one of them has."),
 # chapter 7
 ('c7t', "Seven. The aircraft from the film."),
 ('c7a', "N704AL is in the file: two reports, the door plug and, five days earlier, a door that was hard to open."),
 ('c7b', "For this one page the model searches the web first and may only use what it found, one named source per sentence. Labelled: the web, not the file."),
 # close
 ('cl1', "Nothing here claims what the file cannot carry. No rates, no league tables, no causes. And every word the model writes is marked as its words, not the FAA's."),
 ('cl2', "One point seven million reports, public since 1995, readable now."),
]
LINES = {k: t for k, t in V5 if t}
