# Make it readable · video script (v4, 31 August 2026)

Length about 3:10. Voice: Henk, first person (or the OpenAI voice from v1 with the same settings). Every screen shot is a real page state at aircraftdefects.com/z; the URL is given so the captures can be scripted. No music under the voice; a low bed under the opening clip only.

Figures in this script are the live ones: 1,757,827 reports, 54,634 aircraft, since 1995.

---

## 1. COLD OPEN · 0:00 to 0:11

**Screen:** AIR.mp4, full frame, the 10.6 s from the documentary. No voice over it. Let the clip's own sound play.

**Card at 0:09, over the last frame, small type bottom left:**
Freefall: A Reckoning for Boeing · Netflix, 2026

---

## 2. WHY · 0:11 to 0:52

**Screen at 0:11:** the magnifying-glass photo (the letter A over the wet apron), full frame, slow push in.

**Voice:**
I was sitting watching Freefall on Netflix and saw people painstakingly trying to find information about defects on the Dreamliner and other Boeings. They went to a government website that lets you look up defects. I saw the URL, went there, and was furious: the database was completely unreadable.

**Screen at 0:24:** the FAA's own search result page, screen capture, scrolling slowly through rows of capitals. (If we do not want the FAA page in the video: the raw write-up block from our case sheet, "AT APPROXIMATELY 16,000 FT DURING CLIMB OUT OF PDX…", filling the frame.)

**Voice:**
The reports are so bureaucratic that almost everything has been replaced by codes, and the codes conflict. A report will never tell you there was an issue with the landing gear. It will say ZONE 700.

**Screen at 0:35:** black frame, one word in the page's serif, rust red: **A**

**Voice:**
An emergency landing? That is just an A. But the same letter elsewhere on the form means the report came from an airline. For researchers, the database is a nightmare. I saw the father of one of the victims searching it, trying to make sense of it.

**Screen at 0:45:** the number 1,757,827 counting up from 0 over two seconds, then holding.

**Voice:**
It was something public, but the government presented it as ingredients on a table rather than a meal. Over 1.7 million records were there and none of it was accessible. When z.ai came with a hackathon I thought: I want to make this completely transparent, to help families and researchers.

---

## 2b. WHERE THE TROUBLE SITS · footage from v1, live counts

**Screen:** the page's own aircraft drawing, then five real shots (aviation/gen/k_*.mp4, 2560x1440): the cabin floor and seat track, the belly structure, a door, the tail, the wing seam. Each carries a corner card with the zone and the live count from /z/api/hero ("Upper fuselage 84,453 · ZONE 200 · reports filed, not a rate").

**Voice, one sentence per shot:**
Where does the trouble sit? The file says, when a mechanic ticked a zone. / Eighty-four thousand reports on the upper fuselage: the cabin, the floor, the seat tracks. / Sixty-one thousand below the floor, in the belly and the holds. / Twenty-three thousand on the doors. / Nine thousand on the tail. / Eleven thousand on the left wing alone.

---

## 3. THE PAGE · 0:52 to 1:12

**Screen:** https://aircraftdefects.com/z/ loading cold. Hold two seconds on the whole page, then a slow pan down the desk: the four rails, the search line, the period line, the plane.

**Voice:**
This is what I built, with GLM-5.3-Flash reading the file live. One screen. Where on the aircraft, when, who, and what it forced the crew to do. A search line that takes a question, a word, a tail number, an airline. A period line. The page opens on the last 90 days.

**Screen at 1:04:** cursor clicks the landing gear on the drawing. The page scrolls itself to the red heading "landing gear", the counted sentence, the first 25 reports.
URL: /z/?from=<90 days ago>&zone=ZONE+700

**Voice:**
Click anything and it becomes the selection. The thing you chose is the headline. Under it, the count, then the reports themselves.

---

## 4. THE MODEL READS · 1:12 to 2:25

Each of these is one real button on the live page. Capture the streaming as it happens; do not fake it.

### 4a. A report in plain English · 1:12

**Screen:** the front page's specimen block: "Latest report where the crew had to act", the plain-English reading already on screen, then the raw write-up beneath it in capitals.
URL: /z/

**Voice:**
Every report carries a mechanic's write-up in trade shorthand. The model reads the whole record, the codes decoded by the FAA's own tables, and tells it in plain words. This one was read the moment it arrived; it is on screen in a second.

### 4b. Five questions on any report · 1:25

**Screen:** click a record row, the case sheet opens in the page. Click "Was anyone in danger?" and let it stream. Then "What should we check next?", and show the clickable checks appear: same aircraft, same part, same airline, same day.
URL: any selection, first row

**Voice:**
Open any report and ask it five things. What actually happened. Was anyone in danger. What did the mechanics do. Does it say why. And what should we check next: the answer comes back as searches you can click.

### 4c. What recurs · 1:43

**Screen:** selection "landing gear, from 1 June". Press "Read what recurs in these". Show the meter: "reading 300 of 2,507 write-ups". Let the prose stream. When it finishes, the provenance line: "41 quotes checked, 40 verified, 1 sentence removed". Click a sentence: the records it rests on open beneath it.
URL: /z/?from=2026-06-01&zone=ZONE+700

**Voice:**
Over any selection, the model reads up to three hundred write-ups and says what keeps coming back that no code was designed to hold. Every quote it makes is checked, by the server, against the record it cites. A sentence whose quote is not in the record is deleted before you see it, and the page tells you how many. Click a sentence and it shows you the records it stands on.

### 4d. Next three clicks · 2:02

**Screen:** the three suggestion cards under the answer, each with a real count: "Southwest Airlines · 502 reports · because half the quoted write-ups are theirs".

**Voice:**
Then it suggests three narrower slices, with the real count of each. The model proposes; the file counts.

### 4e. A question the filters cannot hold · 2:08

**Screen:** type "what plane is the most dangerous" into the search line, press Ask. The draft says the file has no field for danger; the answer streams anyway: first what the file cannot tell you, then the most written-up types, with quotes and records.
URL: /z/ with the question typed

**Voice:**
Ask it what the form cannot answer, and it says so first: this file records what mechanics found and fixed, not accidents, not danger. Then it gives you the closest honest thing, most written up, never most dangerous.

### 4f. One aircraft, end to end · 2:18

**Screen:** Aircraft lead, click tail N583UP, press "Read this aircraft end to end". A dated paragraph per turning point streams, each pinned to its record; a grey line "Nothing was filed between 2021 and 2023; that says nothing about the aircraft, only about the file."
URL: /z/?tail=583UP

**Voice:**
Pick one airframe and it tells its story from the first report to the last. Where the file goes quiet, it says the file went quiet, and it is forbidden to say why anything happened, because the file does not record causes.

---

## 5. THE PLANE FROM THE FILM · 2:25 to 2:52

**Screen:** click the red NETFLIX cell. The Freefall page: "Why this site exists", the photo, then the table with the red row: 01/05/2024 · N704AL · Alaska Airlines · door departed · emergency descent, unscheduled landing. Click it. The case sheet opens on the mechanic's own words: "AT APPROXIMATELY 16,000 FT DURING CLIMB OUT OF PDX THE AIRCRAFT EXPERIENCED A RAPID DECOMPRESSION…"
URL: /z/#view=freefall

**Voice:**
The aircraft from the documentary is in the file. Two reports on N704AL. The second is the door plug, in the mechanic's own words, filed the day it happened. The first was filed five days earlier: a door hard to open, aircraft grounded.

**Screen at 2:42:** press "What the NTSB found about the door plug". The web reading appears with its sources, each a named link.

**Voice:**
The file has no context, so for this one page the model searches the web first and may only use what it found, one named source per sentence. Labelled: the web, not the file.

---

## 6. CLOSE · 2:52 to 3:10

**Screen:** back to the front page, the whole desk. Then the card.

**Voice:**


One point seven million reports, public since 1995, readable now.

**Card:**
aircraftdefects.com
Built with GLM-5.3-Flash · GLM-5.3 Flash Lightning Hackathon
Henk van Ess, 2026

---

## Capture list (for the Playwright run)

| shot | URL / action | wait for |
|---|---|---|
| 3 | /z/ cold | #spec .model visible |
| 3b | click `#hero [data-zone="ZONE 700"]` | #sum .bigsel in view |
| 4a | /z/ | #spec .model |
| 4b | click first `#recs tr.rec`; click `#case .mc__go` nth 1, then nth 4 | `.mc[data-state=done]` |
| 4c | /z/?from=2026-06-01&zone=ZONE+700; click `#sumMc .mc__go` (recurs) | `.mc[data-state=done]`, then click first `.s.has` |
| 4d | same page, `.next` visible | |
| 4e | type in `#qin`, click `#askBtn` | `#draft .mc[data-state=done]` |
| 4f | /z/?tail=583UP; click "Read this aircraft end to end" | done |
| 5 | /z/#view=freefall; click `tr.rec.key`; click `#ff .mc__go` nth 0 | done |

Voice files: one per numbered block, so a retake never touches the others.


## How v4 is made (beats)

Every sentence in sections 3 to 6 is one beat in `video/beats.py`: one voice file, one element framed. `capture4.py` records each shot in real time through Chrome's screencast (lossless PNG frames at 2400x1350, so the picture is crisp), scrolls the element to the centre and scales the page around it (1.2x to 1.7x), writes a mark when it is framed, and waits for the model's answer where a button was pressed. `build4.py` places each sentence at its mark, compresses only the model's waiting time to 2.5 s, and encodes at 2560x1440, CRF 16. `zones.py` renders section 2b from the v1 footage with the live counts.
