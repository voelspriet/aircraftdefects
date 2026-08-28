The user is Henk van Ess (or someone presenting as him / quoting his article). They've shared a Substack article about building a tool on the FAA Service Difficulty Report (SDR) database using AI. At the end, they say:

"The database is live at aircraftdefects.com with a public JSON API, no auth: /api/search (filters: q, operator, make, model, tail, part, condition, stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from, to, limit, offset), /api/hero, /api/glossary, /api/facets, /api/clusters, /api/trend, /api/ageing, /api/engines, /api/corrosion, /api/leads, /api/spikes, /api/phrases, /api/aircraft/<tail>. Records carry OperatorControlNumber as an id. It now holds 1,757,828 reports from 1995, on 54,634 aircraft.

Now, my first question again, the one I opened with:

Can I use the FAA database to answer the questions when where what who?"

So the user is asking me to answer the question they opened the article with — presumably they want me to actually try to answer it now, perhaps using the API they describe. The article is about "make it readable" — using AI to bend data toward your questions.

Interesting: In the article, the AI (GLM-5.3 Flash Lightning) answered "Yes, that is possible. Should I show you how?" and warned about the who (operator codes), the what (engineer abbreviations), the where (implicit location).

Now the user asks me the same question. But there's a twist: they've given me an API endpoint. Do I have web access? I don't have live web browsing in this context — no tools are provided. Actually, I need to consider: do I have the ability to fetch aircraftdefects.com? In this environment, I don't have tool access. I can't actually call the API. So I can't verify live data. I should answer the question analytically: yes, with caveats — and map each question (when, where, what, who) to the actual SDR fields and the API filters, including the known gaps (missing location field, code obsolescence, reporting bias).

But wait — should I attempt to fetch? I have no fetch tool here. The conversation is text-only. So I should answer from knowledge: the FAA SDR database structure. Let me recall what I know about the FAA SDR data.

The FAA Service Difficulty Reports: published data includes fields like:

- Report number / Operator Control Number (OCN)
- Date of report (Report Date)
- Event date? Actually there's "Date" fields: the SDR has "Report Date", "Event Date" maybe
- Operator: Operator Name, Operator Code (AL / Air Transport Operator code, e.g., "CALA"?), Operator Doing The Report? Actually fields include "Air Carrier Code", "Operator", "Operator Doing Repair"?
- Aircraft: Make/Model (e.g., BOEING 787-8), Aircraft Registration (Tail Number, "Aircraft Registration No" or "Tail"), Serial number? Also "Aircraft Component" (ATA/JASC code), Zone (ATA iata zone? Actually the zone is like "ZONE 300" etc.)
- Stage of Operation: e.g., taxi, takeoff, climb, cruise, descent, approach, landing, ground — coded
- How Discovered / "Finding": e.g., during inspection, pilot reported
- Nature of Condition: e.g., cracked, corroded, leaked, worn — coded
- Textual narrative: "Descritpion of SDR" / "Narrative" — free text
- Flight number
- Severity / "No Airworthiness Directive"? 
- "Precautionary Procedures" / "Action taken"?

The FAA publishes SDRs monthly in text files at https://www.faa.gov/data_research/safety_reports/service_difficulty_report or via the "SDR" system at av-info.faa.gov. There's a legacy system: "Service Difficulty Reports" searchable at http://av-info.faa.gov/sdrx/ or similar. Fields include:

The standard SDR form (Form 8330-2) fields: Report No., date submitted, aircraft make/model, registration, serial no., operator name/code, person submitting, location of occurrence?, part name, part number, part condition, ATA chapter, zone, stage of operation, nature of condition, how discovered, text description, etc.

In the FAA's downloadable data (sdr.zip?), the columns include: "Seq. No.", "A.I.R. Number"? Hmm. Let me recall the actual column names from the FAA SDR text files:

The FAA SDR ASCII files have header lines like:
- "A. AIR NUMBER"? Not sure.

Actually, the FAA SDR monthly files (e.g., from https://www.faa.gov/data_research/safety_reports/service_difficulty_report/media/) have a layout with segments: "S" record for aircraft, "P" record for parts, etc. Each SDR report can have multiple part records. The record types:

- Report header: Report Number, Date Received, Date of Incident?, Operator (name), Operator Code, Aircraft Make, Aircraft Model, Aircraft Serial, Registration (N-number), ...
- Part data: Part Name, Part Number, Part Condition, ATA code, Zone, ...

There's also the JASC code table: Joint Aviation System Code (e.g., 2530 = "Buffet/Galleys" hmm actually 25 = Equipment/Furnishings, 2530 might be a subcode). The article's glossary table says JASC/ATA Code 2530 = "Buffet and galleys. Hot plates, coffee pots, ovens, food" — wait, ATA 2530? ATA 25 = Equipment/Furnishings; ATA 2530 could be "Equipment/Furnishings — " hmm. Actually in ATA100, 25-30 is "Cargo and Service Equipment"? Not exactly. The article's example table says "(c) JASC/ATA Code 2530 → Buffet and galleys. Hot plates, coffee pots, ovens, food" — plausible for ATA 2530? In ATA 100, chapter 25 subdivisions: 25-10 Flight Compartment, 25-20 Passenger Compartment, 25-30 Buffet and Galley, 25-40 Cargo Compartments, 25-50 Lavatory? Actually 25-50 Equipment/Furnishings not otherwise enumerated. Something like that. So 2530 = Buffet and Galley. Good.

The user's question: "Can I use the FAA database to answer the questions when where what who?" They ask me directly. Given the context, they may want me to (a) demonstrate the reasoning an AI would give, or (b) actually use the API. Since I can't call the API, I should answer honestly: I can't fetch live endpoints from here, but I can answer the question as a methodology: which fields answer which question, where the gaps are, and how to query the API accordingly.

But hold on — maybe the user expects me to roleplay the terminal AI? The article quotes the AI answering "Yes, that is possible. Should I show you how?" Perhaps the user wants me to say something similar and then show how, using the documented API filters. The final line: "Now, my first question again, the one I opened with: Can I use the FAA database to answer the questions when where what who?"

I think the best response: Answer directly and concretely — yes, with per-question mapping:

WHEN: 
- Fields: Event/Report dates. The data from 1995. Note nuance: two dates exist — date the incident was discovered (event date) vs. date report filed/submitted. The gap between them matters (reporting lag). Ask /api/trend with from/to. Also "stage of operation" is not when-in-time but when-in-flight.
- Caveat: discovery date vs submission date; monthly publication lag.

WHERE:
- Three "wheres": on the aircraft (zone / ATA / free text), geographically (region/district office — the FAA region like "GL" Great Lakes, district office code 33), and operationally (stage of operation).
- Caveat: zone field populated in only ~70% (the article: tool could only place a report that used a numbered zone; 1,238,316 of ~1.75M? Actually in the article, from 1.5M reports, only some had zones; plain-English location 1,238,316; no location 90,262). Also zones are ATA zones (100 = lower fuselage? Actually ATA zone 100 = Lower Fuselage? Zone 300 = empennage? Hmm: ATA zones: 100 Lower fuselage? Let me recall: Zone 100: lower fuselage? Common ATA zones: 100 Lower Fuselage, 200/Cabin? Actually: 100 Lower Fuselage; 200/300 Wing? Let me recall properly: ATA iATA zones: 100 Lower fuselage, 200 (center fuselage?), 300 Empennage? Hmm. The article says "landing gear" = ZONE 700. ATA zone 700 is... In the standard ATA zone system: 
  - 100: Lower Fuselage
  - 200: (not sure)
  - 300: Fin and Vertical Stabilizer? 
  Actually the common list: 
  - 100 Lower Fuselage / Body
  - 200 Forward Fuselage? Hmm.
  Standard aircraft zones per ATA 100: 
  - 100 Lower Fuselage
  - 200/300: Wing leading edge? no.
  Let me recall the zone list used in SDRs: Zones: 100, 200, 300, 400, 500, 600, 700, 800: 
  - 100 = Lower half of fuselage
  - 200 = Upper half of fuselage? 
  - 300 = Empennage? 
  - 400 = Wing? 
  - 500 = Left wing? 
  - 600 = Right wing? 
  - 700 = Landing gear, landing gear doors?
  - 800 = Doors.
  I believe: 500/600 are left/right wing, 700 is landing gear (article says landing gear = ZONE 700, consistent), 800 = doors. And 100 = lower fuselage, 200 = ? Maybe "fuselage body"? 300 = empennage? 400 = wing...? Not fully sure; I shouldn't assert a full table I'm not sure of. I can reference the article's example (landing gear = 700) and note the glossary endpoint (/api/glossary) carries the mapping.
  
  Also "where" can mean which airport/region — SDRs don't carry a geographic location of event typically; the FAA Region / District Office is the office handling the report, not necessarily where it happened. Good caveat.

WHAT:
- Nature of Condition (cracked, corroded, smoke/fumes...) — coded; plus free-text narrative. The tool has filters: condition, nature, corrosion, cracked, part, jasc, ata. Plus /api/phrases for the free-text thicket of abbreviations.
- Caveat: engineer shorthand, abbreviations, JASC vs ATA mismatch over years; narrative quality varies; underreporting — mandatory reporting applies to certain Part 121 events; lots of voluntary reports.

WHO:
- Two whos: the operator (reporter) — operator name/code (CALA example) — and the reporter (person/repair station) and "who is in the story" (individuals). Note: SDRs generally don't name individual crew; privacy. The article says "Who were the individuals involved?" — the database typically doesn't provide that; "who" is effectively airline/operator and reporting source.
- Caveat: operator codes change with mergers (e.g., airline mergers create multiple codes for one airline across 26 years), so counting by operator needs code normalization; OperatorControlNumber as id; also note that the operator field is the airline, while "Operator Doing Repair"? Hmm, there's a field "Operator Control Number" which identifies the airline's internal report number? Actually "Operator Control Number" (OCN) in SDR context: The operator's own control number for the report — not a person ID. Wait the user says "Records carry OperatorControlNumber as an id." In FAA SDR data, "Operator Control Number" is the number assigned by the operator to the report (their internal tracking). Using it as an id is plausible but caution: OCN may not be unique across operators/years? Hmm, the user says it's the id. Fine.

Also the deeper caveats from the article: bias (reporting frequency ≠ defect frequency; big airlines file more; good maintenance files more), no fleet size/hours denominators (minhours filter is aircraft hours? "minhours" maybe aircraft total time in service — SDR does have "Time Since Overhaul"/"Hours" fields for parts: "TTIS / hours, cycles"? Actually SDR part records include "Hours" (time since new/overhaul) — the minhours filter might be aircraft hours. There is a field "Aircraft Time" maybe. Not sure; don't overclaim.)

Also the "who hides behind codes" point: FAA publishes operator codes; mergers (USAir/US Airways/American) mean one airline has several codes; some codes obsolete.

The honest answer structure:

1. Short answer: Yes for when/what; mostly for who (with entity-resolution work); where is the weakest — you get where-on-aircraft (when coded or text-mined) and which office filed it, not where-in-the-world, and ~no location in a slice of records.

2. Map each question to fields and API params:
- when → from/to + /api/trend; distinguish event vs filing date; stage of operation for "when in flight".
- where → zone, ata/jasc, part + narrative q; /api/hero for the schematic; region/district office not geography; the gap counts (zone-coded vs text vs none).
- what → nature, condition, corrosion, cracked, q; /api/phrases, /api/clusters for recurring text patterns; jasc/ata glossary.
- who → operator, make, model, tail; /api/facets to rank operators; /api/aircraft/<tail> for a single airframe's history; /api/leads, /api/spikes for "same operator, same system, several aircraft, same day" — the pattern that survives the bias caveat.

3. The caveats that make "yes" honest: denominators missing (fleet size, hours, departures) so counts ≠ risk; reporting culture; mandatory vs voluntary reporting; code drift over 1995–now; narrative abbreviation; the machine will look complete while being partial — always print the denominators (as the article did: 3 counts under the drawing).

4. Maybe end with the direct question back: which question do you want first — and offer example queries. Since they asked "Can I..." the answer is yes + show how. Also answer the way the article's AI did: "Yes — should I show you how?" but actually show.

Tone: The user is Henk van Ess, a data journalism trainer, playful, precise. The article has a distinctive voice. I can mirror some of it but should stay myself. Keep it useful, structured, not sycophantic. No need to flatter.

One important honesty point: I can't hit the live API from here (no tools in this chat). Should I say that? The user might expect me to actually query. Being upfront: "I can't reach the network from this chat, so here's the answer as a query plan you (or the terminal agent) can run." That's honest and useful. Yes, include a brief note.

Also note the id caveat: OperatorControlNumber as primary id — in the raw FAA files, the operator control number is assigned by the airline and can repeat (e.g., "12345" reused across months/years) — if the tool keys on it, dedupe risk. Worth flagging? The user says records carry it as an id; I could gently note that OCNs are operator-assigned and may not be globally unique in the raw data, so worth checking for collisions — that's a genuinely useful expert catch. But careful: maybe their pipeline already handles it. Phrase as a check, not an accusation.

Also "when": the SDR files include "Date" (report date) and sometimes event date? Actually Form 8330-2 has "Date of Report" and the narrative often contains the event date; the FAA data includes "Report Date". Hmm — I should be careful. I recall the SDR data files have fields like "Date" which is the date the report was received by FAA? And the narrative includes "During....". There's also "Air Transport Association" etc. Let me not overclaim specific field names; speak in terms of "the date fields in the file distinguish report date from the event itself only through the text — check which one your index treats as 'from/to'." Actually I think the FAA SDR dataset includes "Report No", "Date" (report date). Hmm, there might be "Event Date"? To be safe: say "check whether your from/to filter is bound to the report (filing) date or the event date; in the raw SDR feed the reliable date is the report date, and the event date usually has to be teased out of the narrative — that gap is itself a story (how long airlines take to file)."

Hmm, but is that true? The FAA SDR text data: each record has "Date" fields: I believe there is a "Report Date" and the file is monthly. There is also "Aircraft Registration Date"? I don't recall an event date field. I'll hedge appropriately: "if your date index is the filing date, then 'yesterday's defects' are actually 'yesterday's filings'."

That's a strong, correct-in-spirit point regardless.

Also "who": the article's dream question "Who were the individuals involved?" — the database does not name mechanics/crew (the form can include the reporter's name? The FAA redacts? Actually SDR Form 8330-2 has "Submitted by" name — the FAA publishes reporter name? In the published SDR text files, there is sometimes a "Person Submitting Report"? Hmm. I think the public files generally do not include individual names, or include repair station names. Safer: "individuals: mostly not — the 'who' you reliably get is the operator and sometimes the repair facility; persons are the FAA's own redaction/FOIA territory." I'd hedge.

Structure of my answer:

- Opening: Yes — and the honest version of yes, per question. Maybe the direct "Yes. Here's where each question lives, where it half-lives, and where it doesn't."

- A compact mapping table: Question | Fields in the file | Your API handles | The gap.
  Table is good format here.

- WHEN: dates; filing vs event; from/to + /api/trend; stage of operation is "when in flight" not "when in time".

- WHERE: three wheres; zone/ATA/part/narrative; hero; region/district office = filing office not event location; the three-number disclosure (zone-coded / text / none) — and note those numbers moved between article (1.5M era) and now (1.76M) — recompute.

- WHAT: nature/condition codes + narrative; jasc/ata; phrases; clusters; abbreviation thicket; "what" is the best-covered question.

- WHO: operator/make/model/tail; facets; aircraft/<tail>; the entity-resolution problem (codes, mergers, obsolete codes); individuals mostly absent; OCN-as-id uniqueness check.

- The five-star caveat: counts are not rates; no fleet/hours denominators in the file; the surviving pattern = co-occurrence (same operator, same system, several tails, same day) → /api/leads, /api/spikes. That's the reason the tool exists.

- Practical: I can't call your endpoints from this chat — so here's the five queries I'd run first. Maybe give concrete example query strings: e.g.
  - /api/search?condition=smoke&from=2026-08-01&to=2026-08-28&limit=25
  - /api/spikes?window=day ... (I don't know its params; keep generic)
  Actually don't invent parameter names beyond what they listed; the list gives filter names for /api/search only. For others, keep parameter-agnostic: "the endpoint that answers X is /api/spikes" etc.

- Close: answer the question the way the article framed it: the database answers when/what cleanly, who with work, where only where it's written down; the tool's job is to keep saying "this cannot show you" out loud. And maybe the punchline: the question the database can't answer at all is "why" — which is the one Henk actually wants. The article says: "Without knowing the when, what, where and who, I cannot begin to determine why." So end: yes to the four; the fifth (why) still needs a human, and the leads/spikes endpoints are where it starts.

Format considerations: Medium-length answer. A table for the mapping would be genuinely helpful (4 rows). Then short sections per question with caveats, then the denominators/bias caveat, then a note that I can't hit the network and offer next step. Keep it tight — avoid bloating. The user is expert; skip hand-holding. Maybe ~400-600 words. Use their terminology (stage of operation, nature of condition, JASC, zone 700, GL/33). 

Let me make sure of a few facts I might cite:

- JASC = Joint Aviation System Code; the FAA's SDRs use JASC codes for aircraft (ATA for engines/parts?). The article table says "JASC/ATA Code". Fine.

- Zone 700 = landing gear per article — consistent with ATA zones (Zone 700: Landing gear? hmm, I believe ATA zone 700 is actually... The article's own glossary says landing gear → ZONE 700; I'll trust that.)

- Region GL = Great Lakes; District Office 33 — article jokes "Still 33. Not in the FAA's own tables."

- Counts in article: 1,541,548 reports 2000→2026-ish on 44,812 planes; then updated: 1,757,828 from 1995 on 54,634 aircraft. In-article: "In 1,238,316 reports the mechanic simply wrote where it was, in plain English. In 90,262 there is no location given at all." So of 1.5M: some ~? had zones. 1,541,548 − 1,238,316 − 90,262 ≈ 212,970 zone-coded. Roughly 14% zone, 80% text, 6% none. I can cite that split as of the article and note it should be recomputed at 1.76M. That's a nice concrete touch: "roughly 8 in 10 report location in words, ~1 in 7 by zone, ~6% not at all (as of the article's snapshot)."

Careful with arithmetic: 1,541,548 − 1,238,316 = 303,232. 303,232 − 90,262 = 212,970. Yes. So ~13.8% zone-coded, ~80.3% plain text, ~5.9% none. Good.

- "92,043 unscheduled landings" from the headline banner — that's a "what the crew did" stat. The A-code: "A" = emergency landing? Article: "Emergency landing? That's just an A. But if it pops up elsewhere it means Airline." So Precautionary Procedures code A = air returned? Hmm: In SDR "Precautionary Procedures" codes: A = Air return? Actually I recall: the "Precautionary Procedures" field codes include: A (Air return), E (Emergency landing?), R (Rejected takeoff?), etc. The article says the FAA never says "emergency landing", it says "A" — and separately "A" elsewhere means airline? The article: "The FAA documents never tell you that 'the crew made an emergency landing.' Instead, it will simply say 'A.'" and "Emergency landing? That's just an A. But if it pops up elsewhere in the document, it means Airline." So code A is context-dependent — lovely detail for the "why codes are dangerous" point: same character, different meaning depending on field. I can use that: "the same 'A' means emergency landing in one column and airline in another."

- "who": Operator designator CALA = Continental Airlines Inc (from the table). Note Continental hasn't existed as such since 2012 merger — good example of obsolete codes.

- The "minhours" filter: probably aircraft hours? or part time-in-service. I won't dwell.

- One more nuance on "when": stage of operation codes (taxi, takeoff, climb...) answer "when in the flight," which is often the more interesting "when" for safety.

- On "who" individuals: I'll say the file answers "which operator" and "which tail" and sometimes "who filed" (repair station), but not crew/mechanic individuals — that's not in the public feed. Hedge slightly with "mostly".

- Denominator problem: the FAA file has no fleet size, departures, or flight hours — so "most reports" ≠ "most dangerous". The surviving signal: temporal co-occurrence clusters.

- OCN uniqueness: In raw SDR data, "Operator Control Number" is the airline's own number; duplicates across operators and reissues across years are plausible. If the site uses it as sole id, check for collisions (e.g., count distinct vs total). Gentle flag: "one thing I'd verify: operator-assigned control numbers aren't guaranteed unique across 30 years and 54k tails — worth a DISTINCT check so ids don't silently merge two reports." Actually he said records carry it "as an id" — meaning the API exposes it as the identifier. The risk: two different reports sharing an OCN → /api/aircraft/<tail> style lookups or dedupe by id could conflate. Worth one sentence.

Also maybe worth noting the "when" count: data from 1995 now; earlier years excluded in article; now included — code drift even worse pre-2000.

Now: can I answer "yes" more decisively? The article's whole point: yes, after rebuilding into human language. So my answer: "Yes — now, and each word of the four carries different weight." Then table.

Draft the table:

| Question | Where it lives in the raw file | Your API | The catch |
|---|---|---|---|
| When | Report date (filing), not necessarily event date; Stage of Operation for the flight phase | from/to, /api/trend, stage | you're indexing filings, not events; lag between crack and report is invisible unless the narrative says |
| Where | Zone code (~1 in 7), ATA/JASC, plain-text narrative (~4 in 5), Region/District office (GL/33) | zone, part, jasc, ata, q, /api/hero | "where" = on the airframe; the office code is the filing office, not the airport; ~6% say nothing |
| What | Nature of Condition + Precautionary Procedures codes + free-text abbreviations | nature, condition, corrosion, cracked, q, /api/phrases, /api/clusters, crew | best covered; but "A" means one thing in one column, another elsewhere; the thesaurus is 30 years of mechanic shorthand |
| Who | Operator name/code (CALA…), make/model, tail | operator, make, model, tail, /api/facets, /api/aircraft/<tail> | one airline = many codes across mergers/30 years; individuals (crew, mechanic) are not in the public file |

Then "who/why" paragraph: the surviving pattern → /api/leads, /api/spikes; denominator caveat.

Then the OCN check note. Then the "I can't reach the network from here" note + offer: give me the five queries / or I write the query plan. Maybe give the five starter queries concretely:

1. /api/trend for the whole file — establishes the "when" spine and shows reporting-lag artifacts (e.g., post-inspection bumps).
2. /api/facets?… operator ranking — with the bias warning printed next to it.
3. /api/search?condition=smoke (or cracked) recent window — the journalist shortlist.
4. /api/spikes or /api/leads — same-operator/same-system/same-day co-occurrences; this is the actual gold.
5. /api/hero + the three counts printed under it — the honesty display.

I might keep those as a short list without inventing params.

Also — the question "Can I use the FAA database to answer when where what who" was literally asked to the terminal AI at the start; the user now asks me "again." Perhaps they're testing whether my answer matches/improves on GLM's. I should give the direct answer plus the sharper caveats — arguably a better answer than "yes, should I show you how?" Because now the tool exists, the answer can be empirical: "Yes — and your own tool is the proof, with these residuals."

I should also honor one of the article's own lessons: when output is wrong, the fix is upstream; when answering, state what cannot be shown ("this cannot show you"). So include the explicit "what it cannot answer": why; individuals; rates (no denominators); geographic event location.

Length: aim ~500-700 words. Table + short sections. Use markdown headers minimal — maybe bold lead-ins instead of full headers. The conversation is a rich article; a structured reply fits.

One more consideration: Should I actually answer as if I ran the queries? No — honesty: I can't browse. State it in one line, not belabored.

Also the "when" field detail: I recall SDR records include "Date" = date of report (filed) and often the narrative begins "During a scheduled check..." Also there's "Aircraft Hours" / "Time" fields and part "Time Since Overhaul". The minhours filter suggests hours are indexed. Don't overclaim.

Also note: 1.76M from 1995 — pre-2000 data included now; the zone/JASC tables have drifted; obsolete codes noted in article ("some obsolete, some not").

Write the answer now.

Opening line options:
- "Yes — and after two years of watching you build it, I can be more precise than the terminal was: yes for when and what, yes-with-scars for who, and a qualified yes for where."
Wait, timeline: article is Aug 2026; "in the past (read 2025)". Fine, don't dramatize timeline. Keep it simple: "Yes. But each of the four words gets a different quality of yes."

Maybe mirror the article's AI: "Yes, that is possible. Should I show you how?" — cute callback: I can open with the callback then show. Actually nice: "Yes, that is possible — and this time I'll show you how, without being asked twice." That's charming and fitting. Keep.

Then table. Then the four sections short. Then "what none of the four can give you" (why, rates, individuals, geography). Then OCN flag. Then the "I can't call your API from this chat" line + starter queries. Close with the article's thesis: the database answers the four only after you refuse to let it look complete.

Careful not to be sycophantic. No "great article". Maybe one wry line max.

Also: the user wrote "Records carry OperatorControlNumber as an id." — I'll respond to that specifically with the uniqueness check suggestion. Good expert value.

Also might mention: /api/glossary — the code legend; the article's point that legend + data were 20 seconds apart. When answering "what", every answer should render with the legend attached.

Let me now think about whether the "where" claim about district office is right: FAA Region (e.g., GL = Great Lakes) and District Office (e.g., 33) — these are the FAA office that processed/received the report (Flight Standards District Office, FSDO). The event location is not a field; FSDO roughly correlates with operator's base, not the event. Article's table: (h) FAARegion GL = Great Lakes; (i) DistrictOffice 33. It says "Still 33. Not in the FAA's own tables" — meaning the office code 33 isn't in FAA's published tables? Whatever. My point stands: it's the office, not the airport.

"who filed": There's a field for the person/repair station? The raw files sometimes have "Report Submitted By" hmm. I'll hedge: "sometimes the submitting repair station".

Now the counts: I'll present the split as "in the article's snapshot: ~213k zone-coded, 1.24M plain-text, 90k none — recompute at 1.76M."

Percentages: 212,970/1,541,548 = 13.8%. 1,238,316/1,541,548 = 80.3%. 90,262/1,541,548 = 5.86%.

Note: 80% of reports carry location in words but unstructured — that's why /api/phrases and q matter; the hero can only show the 14%.

Also the "what" of "crew action": Precautionary Procedures (None / air returned / emergency landed...) → /api/search?crew=... The banner "92,043 unscheduled landings". So "what did the crew do" is answerable. Mention.

Structure final:

1. Callback opener (1-2 lines).
2. Table (4 rows).
3. Per-word notes (short paragraphs, bolded word leads).
4. The residual: what it still can't answer (why, rates, individuals, where-on-earth).
5. One data-hygiene flag (OCN).
6. Practical note: no network here → five first queries (list, parameter-free).
7. Closing line tying to their thesis (the "why" question; the tool's job of saying what it can't show).

Keep tight. Write it.

Draft:

---

Yes, that is possible — and this time I'll show how without being asked twice.

Short version per word:

| | lives in | your API | the catch |
|---|---|---|---|
| **when** | report date; stage-of-operation codes | `from/to`, `/api/trend`, `stage` | you're indexing *filings*, not events. The lag between "crack found" and "report filed" is invisible unless the narrative mentions it. "Yesterday's defects" are yesterday's paperwork. |
| **where** | zone codes, ATA/JASC, plain-text narrative, region/district office | `zone`, `part`, `jasc`, `ata`, `q`, `/api/hero` | "where" means *on the airframe*. GL/33 is the office that took the report, not an airport. And per your own snapshot: ~14% carry a zone, ~80% say it in words, ~6% say nothing — the hero draws only the first group. |
| **what** | Nature of Condition, Precautionary Procedures, free text | `nature`, `condition`, `crew`, `corrosion`, `cracked`, `q`, `/api/phrases`, `/api/clusters` | Best covered of the four. But "A" is an emergency landing in one column and an airline in another; the thesaurus is thirty years of mechanic shorthand that `phrases`/`clusters` have to keep re-learn. |
| **who** | operator code + name, make/model, tail | `operator`, `make`, `model`, `tail`, `/api/facets`, `/api/aircraft/<tail>` | The *person* version of "who" isn't in the public file — no crew names, rarely a mechanic. The reliable "who" is CALA, and CALA is four letters that changed with every merger since 1995. Counting operators is an entity-resolution job, not a GROUP BY. |

Three things I'd still print on every page:

1. **Denominators.** The file has no fleet size, departures, or hours...

Hmm wait, minhours filter exists — maybe hours of part. I'll say: no fleet size or flying hours per operator — which you already know; the point is counts aren't rates. The one pattern that survives: co-occurrence in time (same operator, same system, several tails, same day) — which is exactly /api/leads and /api/spikes.

2. **The OCN.** Operator Control Number is assigned by the airline, so across 1.76M records and 30 years I'd expect collisions and reuses. If it's the sole id, run a quick distinct-vs-total check; two reports sharing an OCN would silently merge in /api/aircraft-style lookups.

3. **"Why" is not in the file.** That was your own sequencing — the four questions earn the right to ask the fifth. The database answers when/what/who cleanly, where partially; it never answers why. leads/spikes is where why starts to leak out.

Practical note: I can't reach the network from this chat, so I can't hit aircraftdefects.com directly. If you want, hand me the five first queries... or actually: here are the five I'd run first, parameter-free so you can fill in your own:

1. /api/trend across the full 1995–now window — the "when" spine; expect filing cliffs at inspection cycles.
2. /api/facets on operator — with the bias caveat rendered in the same size type as the ranking (your own rule).
3. /api/search?condition=smoke&from=<7 days> — the journalist shortlist.
4. /api/spikes and /api/leads — the co-occurrence gold.
5. /api/hero — and confirm the three counts underneath it were recomputed for 1.76M, not the article's 1.54M snapshot.

Closing: The four questions are answerable now; the fifth is why the tool exists; and the honest tool keeps saying "this cannot show you" out loud.

---

Check the article detail: "the three counts now sit underneath the aircraft on the live page" — yes, so my "recomputed?" check is fair. Also the banner: 92,043 unscheduled landings — that's from /api/search?crew=... presumably. Fine.

Also should I mention "92,043 unscheduled landings. All public. Almost nobody can read them. Now you can." as evidence that "what did the crew do" is answerable (92k unscheduled landings counted). Could cite briefly.

Word "again, the one I opened with" — the user is re-asking their opening prompt to see the difference. My opener callback fits.

Tone check: direct, a little wry, no flattery. One callback joke max.

Format: table + numbered/bolded bits. Length target ~450-600 words. Ensure table isn't too wide; four columns okay.

One more check on facts I assert:

- "no crew names, rarely a mechanic" — public SDR generally doesn't include individual names; Form 8330-2 has a "submitted by" but published files… I'll phrase "the public file" carefully: "the public file doesn't reliably carry individuals — 'who' is the operator, sometimes the shop, almost never a person." Hedged fine.

- Mergers since 1995: Continental (CALA) merged into United 2010-2012; US Airways/America West 2005, American/US Airways 2013; Delta/Northwest 2008. So "codes multiply and go obsolete with every merger" — safe.

- Inspection cycles causing filing cliffs: plausible (heavy checks generate report spikes) — phrase as expectation, "expect", safe.

- minhours: I'll not assert its meaning. Skip.

- "GL/33 is the office that took the report, not an airport" — FAA region/district office = Flight Standards office handling; safe to say "the FAA office that handled it, not where it happened."

- Zone percentages: cite as "in the article's snapshot"; add "recompute at 1,757,828".

- "80% say it in words" — 80.3%. Fine as ~80%.

Also I might add one nuance to "when": stage of operation answers a different when — "when in the flight" — which for safety is often the better when (e.g., landing vs cruise). One line.

Now write final. Keep table cells concise.