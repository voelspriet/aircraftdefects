Let me study the parent tool's front end carefully to absorb the house style:

1. **Voice**: Plain, direct sentences. Says what it cannot show in the same size type. "Counts are not rates". "This is not an accident database". Numbers computed, not typed. Caveats carried inline. Comments in code explain why, referencing past mistakes.

2. **Palette**: `--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--smoke:#6b6560;--rust:#c44b28;--line:#e2ded5;--card:#fff`. Fonts: Archivo (headings), Instrument Serif (display sentences), IBM Plex Mono (figures/codes).

3. **Structure**: The parent has the "instrument" hero with rails WHEN/WHERE/WHOSE/FORCED. The /z page is asked to be one thing in, five answers out: WHEN, WHERE, WHO, WHAT, WHAT IT FORCED. Very similar rail concept — the user says "The parent answers 'which reports match these filters'. That is a lookup. I want one thing in, and five answers out."

So the /z page is: an input (aim at a tail, airline, or type), then five rails/sections, each answering one question, with codes explained inline, complete-vs-sampled visible, and per-record "Say this in plain English" buttons calling /z/api/gloss.

Key endpoints:
- `/z/api/entity?kind=tail|operator|make&v=...&model=...` — the five answers. Returns:
  - `kind, value, title, total, analysed, capped`
  - `when: {months, first, last, peak}`
  - `where: {zones (sampled), systems (complete or sampled), no_zone}`
  - `who: {operators, aircraft, types}`
  - `what: {nature, condition, parts, found_by, stage}`
  - `forced: {actions, none, with_action, sentence}`
  - `framing: {total, on_ground, in_flight, on_ground_pct, in_flight_pct, sentence}`
  - `records` (first 80, decorated: id, date, tail, operator_code, operator, make, model, hours, cycles, system, system_code, part, part_number, condition, nature[], crew[], stage, discovered, zone, zone_label, corrosion, crack_length, cracks, text)
  - `cannot_show` array

- `/z/api/gloss` POST: body {text, system, part, condition, nature, stage, discovered, zone_label} → {plain, abstained, reason, model}

- `/z/api/codes` → {nature: {code:{label,faa,note}}, precaution, stage, discovered, part_location, corrosion, operator_type, sdr_type, submitter, time_since}

- `/z/api/summary/<tail>` → {tail, stats, summary, generated:false, note, cannot_show} — templated sentence with verifier.

- `/z/api/repeats/<tail>` → {tail, groups:[{system, part, times, first, last, hours_between, ids, records}], note}

- `/z/api/export/<tail>.csv` — download.

- `/z/api/health` — for status maybe.

Design decisions:

**Layout**: Header (dark ink bar like parent), then an "aim" input: one field where you type a tail, airline name/code, or type. Actually the API requires kind explicitly. I could do a kind selector (tail / airline / type) plus value input, plus model field for type. Or I could try to resolve — but the /z backend doesn't have a resolve endpoint. The parent has /api/resolve but that's the parent; the instruction says endpoints available are the /z ones. But wait — /z backend proxies the parent SDR tool. Could the front end call the parent's endpoints directly? The /z page is served from the /z Flask app on port 8211 presumably, proxied behind nginx at /z. Calling parent endpoints cross-origin may not work. Better to stick strictly to the listed endpoints.

So: a selector with three kinds, a value box, and a model box that appears when kind=make. Plus starter examples.

**The five answers**: Render as five sections in order WHEN, WHERE, WHO, WHAT, WHAT IT FORCED. Each with a heading like the parent's rails: small caps label (Archivo, letterspaced), serif explanation, then the content.

WHAT IT FORCED gets prominence — "its own question, not a footnote under WHAT". Maybe put it right after WHEN? No — user says "in the order a reporter actually asks them" and lists WHEN, WHERE, WHO, WHAT, WHAT IT FORCED. "The fifth is the one that matters most and the one the FAA buries hardest. It is its own question, not a footnote under WHAT." So keep order but give it visual weight — bigger, maybe rust accent, the sentence in serif.

**Complete vs sampled**: entity returns for each tally `{complete: bool, counted: N, rows: [...]}`. Show a marker: "counted from all N reports" vs "counted from the newest 400 (sample)". In same-size muted text as parent does ("This view always answers for all X reports..."). Maybe a small tag: `complete` vs `sample of 400`. The parent style: `.scope` boxes with `.follows`/`.whole warn`. I can use similar: a small line under each tally heading: "Every report in the selection." or "The newest 400 of X reports."

Wait, looking at the endpoint more carefully: `counted` = b.get("reports_in_categories") for full, len(rows) for sampled. For sampled, counted = number of reports read (400). So display "counted over all {counted} reports" or "counted over the {counted} newest reports (a sample)".

**Codes explained where they appear**: Every decoded label shown; hover for FAA wording via title attr or a tooltip like parent's `.term` with `data-fixed`. The /z codes endpoint gives label, faa, note. I'll build a code gloss object from /z/api/codes and decorate: `code("nature","X")` → label; tooltip "FAA wording: ...". Use the parent's dotted-underline `.term` pattern. For undecoded codes (label===code, undecoded flag), show raw code with "not in the FAA table" muted.

**Records**: list of cards or a table. Parent uses a table with the mechanic's words in a grey band under each row (`.wu`). I'll do similar: each record = row(s) with decoded fields + "Say this in plain English" button + the write-up band. The gloss button posts to /z/api/gloss with the record's fields and shows result under the text, with abstention shown honestly ("the tool abstained: ..."). Also show model name? The endpoint returns model. Parent style would say something like "written by glm-5.3-flash, checked against the fields above"? Keep it honest: label it "plain English generated from the decoded fields; the mechanic's words above are the source."

Since there are up to 80 records, each with a gloss button — fine, on-demand calls.

**Summary**: for tails only, a "read the verified summary" — fetch /z/api/summary/<tail>, show sentence + note "no part of it was written by a model". Nice for the hero area. Show after load when kind=tail.

**Repeats**: for tails only: "same system written up more than once" — /z/api/repeats/<tail>. Show groups with times, first/last, hours_between. With the note. Where to put? Maybe under records as a subsection for tails, or a toggle. It's "build 5". Include as a collapsible section for tails.

**Export**: button "Export CSV" → /z/api/export/<tail>.csv (tail only per endpoint). For operator/make kinds, no export endpoint — hide or disable with honest label. Actually endpoint is `/z/api/export/<tail>.csv` only. So only for tails.

**Empty states**: entity returns found=0 for unknown tail? For /z/api/entity, if no rows: `rows` empty, `total: 0`? api("/api/search", tail=...) with total 0. months empty. The page must handle nothing found with the parent's honest empty state: "No report matches... That is not evidence about the aircraft." For airframe endpoint there's a nice note; for entity, we get total=0. I'll write: "Nothing in this file matches X. That is not evidence about the aircraft: it may never have been registered in the United States, or nothing was ever filed." Similar for operator/type.

**cannot_show**: rendered as a block — parent does "What it cannot tell you" cards. On /z, render `cannot_show` items as a list under the title area in same-size type (not fine print). Parent: `.scope whole warn` styled boxes, and the Method panel. I'll do a card "What this cannot show" with bullet list, same font size (or 12.5-13px, same as body). The instruction: "the way it says what it cannot show in the same size type as everything else".

**The hero/sentence**: The parent instrument has a serif sentence summarizing. For /z, when a thing is loaded, show a big serif line: "{title} appears in {n} write-ups, {first} to {last}." Use numbers from data. And for tails the verified summary option. Careful: don't assert rates. Compose from returned data only.

Wait — should the sentence be generated client-side from returned numbers? That's fine as it's arithmetic on returned fields, like parent's sentenceHTML.

**framing**: The endpoint gives `framing.sentence` — already written server-side. Display it. It's the build 8 stage framing. Good — show it in WHEN or as a standing line under the title. It says "X of these N write-ups were made with the aircraft on the ground...". I'll put it near the top as "What kind of file this is" framing — or under WHEN since it's about stage. Actually it fits under WHAT (stage) or as a general framing note. I'll place it as the intro line beneath the title, styled like `.reading`. Hmm, the parent puts "reading" paragraphs inside rails. The framing is about stage of operation — that's in `what.stage` and `where`. But its role is framing the whole file ("a write-up is a defect somebody found"). I'll put it directly under the headline as a `.reading` block. That mirrors build 8's intent ("the framing that stops it being misread").

**Header**: dark bar: title "The five questions" / subtitle. Parent: `header h1` 19px. Keep same. Maybe: "SDR Desk /z: one thing, five answers." Hmm. Name the page. The parent is "SDR Desk". This one: "One aircraft, one airline, one type — five answers." Let me write: h1 "What the file says about one thing" sub: "A tail number, an airline or a type in, and five answers out: when, where, who, what, and what it forced. Built on the same public corpus."

**Aim input**: Kind select styled as three buttons (like parent's `.picker`): TAIL / AIRLINE / TYPE. Input. When TYPE: second input for model (optional). Button "Ask". Also starters: example tails? We don't know real tails in data. Parent used starter questions with filter values. Here, safe starters: kind=operator v=UAL? Operator codes like "UAL", "AAL" exist in FAA data. A tail like "583UP"? The parent's examples mention N583UP. I could use starters that are plausible but might return zero — that's fine because empty state is honest. But better to use starters that will return data: operator "UAL" (United) surely has reports; type make=BOEING model=7378H4? Parent examples used 7378H4. Make=BOEING alone is safe. Tail "583UP" was mentioned in parent as example. Hmm, risky. Maybe starters: "An airline: UAL", "A type: BOEING 7378H4"? Actually for make kind, model optional — make=BOEING gives huge set. Let me offer: United Airlines (UAL), Boeing (all), and a tail the reporter must supply... Better: provide three starters: "United Airlines (operator UAL)", "Boeing 737 (make BOEING, model 737)"? Model values are filed like "7378H4"; "737" might match some rows. Parent's model filter is exact match `upper(AircraftModel) = ?`. So model="737" may return few. Safer: make=BOEING with no model. And a tail starter: the parent repeatedly uses N583UP as the example tail. I'll use it, and if it returns nothing the honest empty state shows — acceptable but a starter that lands on "nothing" is a bad first impression. Hmm. Let me check: parent's html mentions "N583UP" as placeholder examples only. I shouldn't assert it exists. Alternative: leave tails to the user, starters only for airline and type. But then a user with no tail in mind can't try that mode. That's fine — tails are inherently specific.

Actually, I can include a starter with a real famous tail? I don't have verified data. Avoid fabricating. Starters: UAL (airline), AAL (airline), BOEING (type), AIRBUS (type). Note: AircraftMake for Airbus is "AIRBUS" — parent mentions "GROUP ECONOMIQUE AIRBUS INDUSTRIE" as label with code possibly "AIRBUS". The make filter is exact upper match on the filed code. FACET list in parent comes from distinct values. "AIRBUS" likely exists as a code. OK.

**WHO section**: operators (complete via breakdown, or sampled), aircraft (sampled from 400), types (sampled). Show top bars. Parent's bars: grid with label, bar, number. I'll reuse `.bars` pattern with `.k/.t/.n`.

**WHERE**: zones sampled with part_location decode (ZONE 100 = fuselage etc.). Show as list/bars + no_zone count. Systems: complete from breakdown (top 40 rows... breakdown returns top 25 actually: `out[:25]`). Show bars with labels; hover for code.

**WHAT**: nature (sampled), condition (sampled), parts (sampled), found_by (complete), stage (complete). Bars each with heading and completeness line.

**WHAT IT FORCED**: actions list with counts, plus "none" count, plus the sentence. Make this section visually distinct: rust left border thicker, serif sentence in larger type. Parent `.reading` is Georgia 15px with rust left border. I'll make the forced section's sentence a `.reading` at 17-18px serif.

Bars: count reports with action; "none recorded" row shown as muted bar (dotted?) — parent uses `.bars .b.over` masks and `.unknown` border-left dotted. I'll add a row "no listed action" with dotted bar.

**Records**: After the five answers, "The write-ups themselves" — list. Each record: header line (date, tail, operator, system, part), decoded chips (nature, crew, stage, discovered, zone, corrosion, cracks), the verbatim text in `.wu`, gloss button. Gloss result renders as a bordered line labeled "In plain words (generated from the decoded fields — the verbatim text is the record)". On abstain: "Abstained: {reason}". Keep honest.

Also each record shows its id (record id under it — "nothing generated is shown without the filer's own words beside it and a record id under it"). So show `id` prominently, maybe mono. And a note that ids are the FAA OperatorControlNumber.

Also provide "Copy citation" per record? The entity response includes a citation object only in /api/airframe, not entity. For entity there's no citation field. Skip per-record citation; the export handles citations for tails. Keep simple.

**Trend chart (WHEN)**: months array with n. Render as flex bars like parent's `.months` with hover aim. Peak marked. Partial months unknown here (no lag info from entity). Don't invent: just show months, mark peak. First/last labels. If months empty → "no dated reports".

The parent marks part-months using RANGE info; entity doesn't provide that, so skip — but honesty: the last month may be partial; we don't know the corpus end here. I could fetch nothing else... I'll add a static caveat in the WHEN section: "The most recent month in any FAA file is still filling up as reports arrive late; a dip at the right may be the post, not a fall." Wait — is that true? Yes, general SDR lag; parent computes p95 lag. But asserting on /z without data... It's a general property of the corpus the parent documents. I think a gentle static caveat is in the house style ("The newest months are still filling up: reports reach the FAA days to months after the event."). The parent says this in its reading(). I'll include it as a muted note in WHEN. It's known about the data source, not invented.

**Summary (tails)**: Button "Show the verified summary" → fetch /z/api/summary/<tail> → show `summary` text in serif with note "Every number recounted before this sentence was assembled; no part written by a model." and stats table? Maybe show stats small. Keep it simple: sentence + note. If verifier fails (500), show the error honestly: "The verifier disagreed with the count, so nothing was rendered." Good house style.

**Repeats (tails)**: Button or auto-load? Auto-load makes page heavier; make it a details/summary toggle "Same system written up more than once on this airframe" that fetches on open. Show groups: system, part, times, first→last, hours_between ("hours between first and last"), ids. Include note verbatim. If hours_between null → "hours not recorded on both".

**URL state**: update query params kind, v, model so links are shareable (parent: "every query is a permalink"). On boot, read params and load.

**Escape/typography details**: use `num()` with toLocaleString, `esc()` helper, `ukDate` for dates (DifficultyDate format is MM/DD/YYYY per parent's ukDate). Yes parent converts "05/08/2025" → "8 May 2025". Reuse.

**Sampled vs complete display**: I'll implement a helper `scopeLine(t)` returning e.g.:
- complete: `<span class="scope follows">Counted over every report in the selection — {counted}.</span>` Hmm counted for complete = reports_in_categories (reports that have a non-null value in that grouping) which may be less than total. Say "counted from all {counted} reports that name this field." Careful: reports_in_categories counts rows with k not null/'' — yes for operator breakdown: groups where expr not null/empty. So "all {counted} reports that record this field" is accurate-ish. For sampled: "read from the newest {counted} reports (of {total}); the rest were not read for this count." That's the honest phrasing. 

Also `capped` flag on entity: total > analysed (400). Mention near records: "The newest 80 of {analysed} read, of {total} matching" etc.

**Codes tooltip**: build from /z/api/codes: CODEZ[table][code] = {label, faa, note}. Helper `clabel(table, code)` returns label or code; `ctip(table, code)` builds "label. FAA wording: faa. note". Render `.term` spans with data-fixed like parent: `data-fixed="short|tip"`. For undecoded: show code + muted "(not in the FAA table)".

The entity's tally rows already carry label + undecoded flag; for those use row.label directly, tooltip from faa if we have it via codes payload (tally rows don't include faa). Merge: look up CODEZ[table][code] for faa/note.

Records' fields: nature[] and crew[] are labels only (no codes). stage/discovered/corrosion are labels. zone_label label. system label + system_code. For tooltips on record fields, we can reverse-lookup? We don't have codes for nature[] in records (just labels). Fine — show labels plain, no fake tooltips. Where we have codes (system_code, zone, corrosion via... corrosion is label only). Actually decorate() gives "corrosion": dec(...) label only. So tooltips only where code+table known: system (code), zone (code). OK.

**The gloss POST**: body needs text + optional decoded fields. From a record r: {text: r.text, system: r.system, part: r.part, condition: r.condition, nature: r.nature.join("; ")?? The endpoint does `facts = {k: d.get(k) for k in (...) if d.get(k)}` and json.dumps — values can be anything JSON-serializable. nature is a list in record; passing the list is fine, or join. I'll pass strings: nature: r.nature.join("; "), stage, discovered, zone_label. Good.

Button label: parent house would say "Say this in plain English". On result: show line + tiny "glm-5.3-flash, from the decoded fields; the verbatim text above is the record." Hmm, maybe: "Generated from the decoded fields. The mechanic's words above are the evidence." Also cache per record id so re-click doesn't refetch? Simple: store on record object.

Error handling: 502 → show "The plain-English service did not answer." Honest.

**Loading & states**: while fetching entity, show "Reading the file…". Errors: try/catch → "The desk did not answer." Also /z/api/health on boot to show corpus size + model? Health returns corpus. Could display "file holds N reports" in header sub. Nice: fetch health once, put "same corpus as the parent desk: {corpus} reports." in sub. If fails, skip silently.

**No libraries**: vanilla JS. Fonts link same as parent.

**Sections nav**: after loading, sticky mini-nav with WHEN WHERE WHO WHAT FORCED? Parent has tabs for panels; here one page with five sections; maybe skip nav, or anchor links. Keep simple: sections stacked with rust rules between, like rails. I'll implement as vertical "rails": each section header row with small-caps label + serif question + scope line; content below. 

The user said: "one thing in, and five answers out, in the order a reporter actually asks them". Vertical stacking fits reading order. The parent's instrument is horizontal rails collapsed; but /z is a report about one thing — vertical article-like flow with the serif headline at top is right.

**WHAT IT FORCED emphasis**: Give it a distinct treatment: background #fff card with 3px rust top border (parent instrument uses border-bottom 3px rust), or invert: section with rust left border 3px and larger serif sentence. Also its completeness caveat: forced counts are from the 400 sample (computed in endpoint from rows). Mark it: "counted from the {analysed} newest reports". The endpoint's forced.sentence says "of the %d reports here" where %d = len(rows) = analysed. Good, sentence already sample-scoped. I'll also show the actions bars and the "no listed action" count. Note: "A report can carry up to four actions" — true, and endpoint counts each action. Add that caveat line.

Also careful: forced counts use `dec("precaution", ...)` labels; some precaution codes mean "none"/"other"? dec returns label; endpoint filters label.lower() != "none". Code K = "none of the listed actions"? In parent glossary, precaution K means none. The endpoint's crew_actions filters lab.lower()!="none" — K's label may be "NONE OF THE ABOVE" or similar which wouldn't equal "none"... Not my problem; I render what endpoint gives.

**Title block**: After load:
```
<div class="stamp">FAA SERVICE DIFFICULTY REPORTS</div>
<h1 class="title">{title}</h1>
<p class="figline"><b>{total}</b> reports, {first} to {last}.</p>
```
Serif big title (Instrument Serif 40px). figline mono numbers rust.

Also for tails: "Verified summary" button + export button. For operators/types: export hidden with honest note? Just hide; or show disabled with title "Export is per airframe in this version". Better hide entirely — house style avoids dead controls. Hmm parent disables with reason text. I'll omit for non-tails and mention in Method note? There's no method panel required. Skip.

**What this cannot show**: card listing cannot_show items, same font size, maybe 13px vs 15 body — "same size type as everything else" → use 14px like ledes. I'll use 13.5-14px, clearly readable, not tiny. Bulleted with square markers? Simple ul.

**The empty state before first query**: A landing panel: explains the five questions, offers starters. Parent opens with "No rows yet, on purpose." Here: "Nothing asked yet." with starters and kind picker. Also brief explanation of the five questions with their meanings — that's the teaching moment. Good.

**Structure of file**: single HTML, CSS in <style>, JS in <script>. Reuse parent CSS variables and many component styles (bars, cards, scope, chips, term, wu, buttons, tip). I'll write fresh but consistent CSS, borrowing class names.

Let me now think about exact response shapes once more to code defensively:

entity:
```
{kind, value, title, total, analysed, capped,
 when:{months:[{month,n}], first, last, peak:{month,n}},
 where:{zones:{complete:false,counted,rows:[{code,label,n,undecoded}]}, systems:{complete:bool,counted,rows}, no_zone},
 who:{operators:{...}, aircraft:{...}, types:{...}},
 what:{nature:{...}, condition:{...}, parts:{...}, found_by:{...}, stage:{...}},
 forced:{actions:[{label,n}], none, with_action, sentence},
 framing:{total,on_ground,in_flight,on_ground_pct,in_flight_pct,sentence},
 records:[...],
 cannot_show:[...]}
```
records fields: id,date,tail,operator_code,operator,make,model,hours,cycles,system,system_code,part,part_number,condition,nature[],crew[],stage,discovered,zone,zone_label,corrosion,crack_length,cracks,text.

gloss: {plain, abstained, reason, model, effort}.

codes: {nature:{X:{label,faa,note}},...}. tables: nature, precaution, stage, discovered, part_location, corrosion, operator_type, sdr_type, submitter, time_since.

summary: {tail, stats:{n,first,last,systems,top_system,top_system_n,on_ground,crew_action}, summary, generated:false, note, cannot_show}. On bad tail: {tail, found:0}. 500 on verifier fail.

repeats: {tail, groups:[{system,part,times,first,last,hours_between,ids,records}], note}.

export: csv download link.

Months: month strings "YYYY-MM". Render bars with height by n; axis labels years when month%12==01? Parent shows year on January. Do similar.

Zone labels: tally rows include label from part_location table (e.g., "ZONE 100 — Fuselage"?). The codes table part_location keys are like "ZONE 100"? In parent, zone filter value is "ZONE 100" and codes.part_location keyed by those. dec("part_location", r.get("PartLocation")) — PartLocation is like "ZONE 100 FWD"? Hmm. Parent's ZONE_EXPR extracts "ZONE 100" from PartLocation via regex. But /z decorate uses dec("part_location", PartLocation) directly — that may fail for "ZONE 200 FWD" strings... unless the lookup table keys match exact values. The glossary code list: parent's zones select uses codes.part_location with keys like "ZONE 100". If PartLocation is exactly "ZONE 200" it decodes. Many are free text → zone_label null, zone raw string shown. tally uses r.get("PartLocation") raw and dec(table=part_location) — for undecoded ones, label=code (raw text) and undecoded=true. So the WHERE zones bars may show raw free-text locations as rows. That's per the backend design; I render label or "code" with undecoded marked. Fine. Show top ~12 rows for zones, note that free-text locations can't be placed on a diagram (no diagram here anyway).

no_zone: count of records (in sample) without location text — display "In {no_zone} of the {analysed} read, no location is recorded at all."

WHERE systems: complete from breakdown — rows have label from breakdown (already decoded server-side: for by=jasc... wait endpoint calls full() without by → default by="ata"?? Let me re-read:

```
def full(by=None):
    p = dict(params)
    if by: p["by"] = by
    b = api("/api/breakdown", **p)
```
agg_system = full() → by not set → /api/breakdown default by="ata" → returns ATA chapter rows keyed by chapter code (2-digit), label = ATA name. Hmm! So systems rows are ATA chapters (code "32"), labeled with chapter names. The tally fallback would have been JASCCode 4-digit. So agg_system.rows: key="32", label="Landing gear". OK — so WHERE systems are ATA chapters. Fine; tooltip via ATA? codes payload has no ata table... /z/api/codes doesn't include ATA chapters. Parent app.py ATA dict is server-side. /z doesn't proxy it. So chapter labels come from breakdown already ("label": ATA.get(k,k)). Good enough; tooltip: skip for chapters, or use row.label. Render row.label; if label equals code, undecoded look. rows from breakdown have no "undecoded" key (set False explicitly). OK.

agg_stage: full("stage") → breakdown by=stage → rows key=StageOfOperationCode letter, label decoded. agg_disc: full("discovered"). agg_ops: full("operator") — rows key=OperatorDesignator label=name? Parent breakdown labeller for operator: label(tbl, k, k) with tbl=None for operator... In parent api_breakdown, tbl map has no "operator", so lab(k) returns k — the raw code! Wait: `tbl = {...}.get(field)` → for operator, None → `return label(tbl, k, k) if tbl else k` → returns k (raw code). So agg_ops rows are raw codes with n. I can decode client-side using... /z/api/codes doesn't include operator table (it's huge). WHO operators: show code + name if known via entity? We don't have operator names except dec("operator") per record. Hmm. The /z codes() endpoint's `want` list excludes operator. So for operator rows, display the code, plus for the code matching the queried operator we know its name (entity.title for kind=operator). For others, show code with "code" styling; add note "Names for these codes are on the parent desk; codes are shown as filed." Hmm, that's clunky.

Alternative: /z entity's who.operators uses agg_ops which returns raw codes. To get names, could I cross-reference records (sample gives operator + operator_code for up to 400)? decorate gives operator name from dec. So build a client map code→name from records! Then annotate agg_ops rows: name = map[code] || null. Nice — honest, from data we have. For codes not in sample, show code only with muted "name not in the sample read". Fine.

Similarly aircraft tally: keys are tail numbers; types: "MAKE MODEL" strings.

WHO presentation: three sub-blocks: "Airlines" (bars), "Individual aircraft" (top tails, sample, with note), "Types" (bars). Scope lines per completeness. operators: complete (from breakdown over whole selection) — but names only from sample. OK.

Also for kind=operator queries, who.operators will be a single row (the operator) — fine.

**"counted" semantics** for complete: reports_in_categories (reports with value). For sampled: len(rows)=analysed (400). Display:
- complete: "Counted over every report in the selection that records this ({counted})."
- sampled: "Counted only over the newest {counted} read (of {total}). The rest were not read."

Let me also surface entity.capped with records: "The newest 80 write-ups of the {analysed} read are shown here; the file holds {total}."

**Rendering bars**: helper bars(containerId, rows, opts{onclick?}) — clicks could... do what? On /z, clicking a system could filter? There's no drill endpoint except re-query entity with kind=make... Clicking a tail in WHO → load that tail as the thing! Clicking an operator → load operator. Clicking a type → load make+model. That's a nice "follow the thread" behavior consistent with parent ("click one anywhere in the tool"). Systems/zones/nature/crew clicks: no target — make them non-clickable (hover explains). Keep clickables: tails, operator codes, types. Good restraint.

**Hash/URL**: params `kind`,`v`,`model`. pushState on ask; popstate re-asks.

**Edge cases**:
- kind=make without model → params["make"]=val; search endpoint make filter exact code upper. "BOEING" works; "Boeing 737" typed → won't match. The UI: TYPE kind has value input "Make, e.g. BOEING" + model input optional "Model, e.g. 7378H4 (as filed)". Note "as filed, no dash".
- operator: value must be the 4-letter designator; name search isn't available on /z. Placeholder "4-letter code, e.g. UAL". Honest: "This desk takes the FAA's code, not the trading name. The parent desk's picker has every code with its name." Hmm, can't link to parent from /z? Actually can link to "/" (site root = parent). The /z app serves static; parent served at root by other app. Links to "/" fine. I'll mention "the lookup desk at /" for code picking. Careful about making up relative links — parent tool is at site root per nginx stripping. In the brief, aircraftdefects.com serves parent; /z is the new page. So href="/" is the parent. OK.

- month rendering when months span 26 years → 300+ bars; flex min-width small; overflow-x auto in open state. Parent handles with scroll. I'll cap bar min-width 4px and allow horizontal scroll on the strip, with hint. 

- peak display: "busiest {monthName(peak.month)} with {n}."

** WHEN extras**: first/last month names; note about recent months filling up; and that months count only dated reports (parent has undated; entity months come from /api/trend which filters difficulty_dt IS NOT NULL). Add muted note: "Months count dated reports only."

**Framing sentence** placement: directly under figline, `.reading`.

**Records ordering**: records sorted desc by date server-side (entity: recs built from d.rows which are ORDER_NEWEST; entity doesn't re-sort records... /api/aircraft sorts; entity uses /api/search → newest first already). Good.

**"Say this in plain English" button**: parent's ghost button style. Place right of the wu band header. On click: loading state on button ("asking…"), then result div. Also allow regenerate? Keep single.

The gloss may take seconds (LLM). Set button disabled while pending.

**Accessibility**: aria labels, focus styles, esc tooltips via title? Parent uses custom tip via data-fixed + mouseover. For simplicity and parity, I'll use native `title` attributes for code tooltips plus the dotted underline. Hmm parent built rich tip; but /z is one file; native title is acceptable but house style uses visible tooltips... Parent's `.term` uses data-fixed with a JS tip. I'll implement a minimal shared tip like parent's (fixed div, mouseover/focus). It's not much code. Do it: one #tip div; delegate mouseover on [data-tip].

**Counts formatting**: num = toLocaleString("en").

Now, the WHEN chart: months up to ~320. I'll render like parent closed/open: flex bars with ghost = corpus? Entity months only have selection n (trend of selection), no corpus overlay. So single series bars in rust. Height scaled to max. Year labels under Januaries. Peak marked with outline. Partial-month unknown — skip.

Bars: each `<span class="mo">` with i height. Add aria-label with month + n. Click a month? No action available (can't filter /z by month). Not clickable — fine, hover shows value via title/aim line? Add a small aim line like parent: hovering shows "May 2019 · 34 reports". Implement lightweight: an #whenAim div updated on mouseover/focus. Nice parent-ish touch.

**Order of code**: Let me draft CSS.

Root vars: copy parent. Body font 15px. Header dark. .wrap max-width 1080 (parent 1180; /z is article-like; 1000-1100 fine → use 1080).

Components:
- .askbar: card with picker (three kind buttons), inputs, ask button.
- .starter buttons.
- .headline: serif 40px.
- .figline mono.
- .reading: Georgia 15.5px, rust left border, background #faf7f3.
- section.rail5: margin, border-top 1px line, padding; h2 label small caps Archivo 11px letterspace; h3 serif question 22px (Instrument Serif italic? Parent uses Instrument Serif for sentence; section question in serif 24px).
- .scope lines: 12.5px, follows green-ish? Parent .scope.follows is #f2f5f1 background with #3f4a3c text; .whole warn is #fdf3ee/#7c3a1f. Reuse: complete → follows style; sampled → warn style (since it's the caution). Yes! Perfect mapping: sampled = warn.
- .bars grid rows like parent: grid-template-columns: minmax(120px,230px) 1fr 78px; bar rust; sampled bars maybe hatched? Keep same; scope line differentiates.
- .record: card-ish row: header grid with date, tail (clickable), operator, system, part; chips row; wu band; actions (gloss button); gloss result; id mono muted "record {id}".
- .wu band: same as parent (background #faf8f4, border-left 2px #e0d9cc, mono 12.5px).
- .glossout: border-left 3px solid var(--rust)? Parent reading uses that. Gloss output: background #f2f5f1? Distinguish generated: dashed border? House style: honesty — label "generated". I'll style: background:#fbf9f4;border:1px dashed #d8d2c6;padding:8px 12px;font-size:14px; with tiny label "PLAIN ENGLISH — GENERATED FROM THE DECODED FIELDS" in ash small caps, and abstain variant.
- .cannot: card with list, heading "What this cannot show".
- .tag: mono small chips for codes.
- buttons ghost/primary as parent.
- #tip: like parent (dark panel).

Forced section: give class .forced with border:1px solid line; border-left:4px solid rust; background:#fff; padding bigger. Sentence inside as serif 19px. Actions bars. "No listed action" row: dotted bar via CSS repeating-linear-gradient? Parent has .bars .b.over mask hatch. I'll make a .b.none {background:repeating-linear-gradient(45deg,#d8d2c6 0 4px, transparent 4px 8px); border:1px solid #d8d2c6}. Hmm keep simpler: muted ash bar. Label with count. Plus caveat "A report can carry up to four of these; the bars count each mention, and the none-row counts reports where no action appears."

Wait — actually endpoint's forced.none counts reports with no non-"none" action; actions count per mention. So a report with 2 actions is counted twice in actions. Caveat needed. Good.

**Record gloss caching**: const glossCache = {} keyed by record id; store {state, data}.

**Assembling the page flow**:

1. Header.
2. .askbar card: label "Ask about one thing", picker [TAIL][AIRLINE][TYPE], input(s), Ask button, starters row, hint line about codes ("TAIL = the registration without the leading N; AIRLINE = the FAA's four-letter designator; TYPE = the make as filed, with the model as filed (7378H4, not 737-800).").
3. #status line (freshness-ish? no) — skip.
4. #out: either landing, loading, empty, or the report.
5. Footer credit like parent: "Inspired by... Built by Henk van Ess © 2026." Keep same credit. And method line: "Same corpus as the lookup desk at /; this page reads it through a different lens." Maybe link.

Report structure inside #out:

```
<div class="stamp">FAA SERVICE DIFFICULTY REPORTS · {first month} to {last month}</div>
<h1>{title}</h1>
<p class="figline"><b>{total}</b> reports {span}</p>
[if capped] <p class="muted">The newest {analysed} were read in full for the breakdowns below; the file holds {total}.</p>
<div class="reading">{framing.sentence}</div>
[tail only] actions row: [Verified summary] [Export CSV] [Repeats toggle]
[cannot card]
<section WHEN>...
<section WHERE>...
<section WHO>...
<section WHAT>...
<section FORCED>...
<section records>...
[tail: repeats section]
```

Hmm, "cannot show" placement: after headline, before sections — sets the frame early. Parent puts method at end but scopes inline. I'll put the cannot card right after the reading, as its own card, normal size.

Also each tally block gets its own scope line (complete/sampled).

Records header: "The write-ups themselves" + serif sub "Newest first. Every field decoded; the mechanic's words are the evidence." + note "A report id (the operator's control number) sits under each one."

Also record count: "Showing {records.length} of the {analysed} read." with note if capped.

**Records rendering**: For each r:
```
<div class="record">
 <div class="rhead">
   <div class="rdate">{ukDate(date)} <span mono>{hours} h · {cycles} cyc?</span></div>
   <div class="rtail">{tail? N{tail} clickable : <span absent>no tail recorded</span>}</div>
   <div class="rop">{operator or code or absent}</div>
   <div class="rsys">{system label} <code>{system_code}</code></div>
   <div class="rpart">{part} {part_number code}</div>
 </div>
 <div class="rtags">
   [nature labels as tag], [crew labels tag], stage tag, discovered tag, zone/zone_label tag, corrosion tag, cracks tag
 </div>
 <div class="wu"><div class="txt">{text}</div></div>
 <div class="rfoot">
   <button ghost data-gloss="{id}">Say this in plain English</button>
   <span class="rid mono">record {id}</span>
 </div>
 <div class="glossout" id="g-{id}" hidden></div>
</div>
```
Missing values → absent spans "not recorded" like parent. Text empty → "No write-up text in the record." (possible). Then gloss button disabled? If no text, gloss endpoint errors "no text" → disable button with title. Handle: if !r.text → show absent note instead of button.

Clickable tail → ask(kind=tail, v=tail). Operator code → ask(kind=operator). Type → ask make/model.

For type clicks, make = r.make, model = r.model.

**Summary flow (tail only)**: button toggles fetch; render block:
```
<div class="card sum">
 <h3>Verified summary</h3>
 <p class="sumtext serif">{summary}</p>
 <p class="muted">{note}</p>
</div>
```
On 500: show "The verifier disagreed with the arithmetic, so no summary was rendered. That is the safety catch working." — honest, house style.

**Repeats flow (tail only)**: details element; on toggle open fetch; render groups table-ish:
each group: system (label), part, "written up {times} times", {first} → {last}, hours_between ("about {n} flying hours between first and last" or "hours not recorded on both ends"). ids small mono list? Show ids count and expandable? Keep ids shown as mono text (they're short). Plus note verbatim at top. Plus caveat: "Neither the tool nor this page says whether a later report is the same finding returning."

Groups records: skip embedding full records (heavy); show ids only. Good.

**Health on boot**: fetch /z/api/health → corpus. Put in header sub: "…The file holds {corpus} reports." If error, omit. Also model name for gloss label: from health.model? gloss response includes model. Use response.

**Landing state**: 
```
<div class="landing">
 <p class="serif big">One thing in. Five answers out.</p>
 <p>...explain WHEN WHERE WHO WHAT FORCED with one line each...</p>
 starters
</div>
```
Parent-style: "No rows yet, on purpose." Here: "Nothing asked yet — and that is the honest starting point." Starters: UAL, AAL, BOEING, plus instruction to type a tail.

Now, the kinds picker: buttons with aria-pressed; switching kind swaps placeholder and shows model input for TYPE.

Input validation: empty v → shake/hint "Type something first."

**Popstate**: read kind/v/model, ask again without pushing.

**Pushing**: on ask success push `?kind=&v=&model=`.

Escaping: esc() for all interpolations. Careful with onclick inline quoting: use data-attributes + delegated click listener instead of inline onclick with values (tails are alphanumeric, safe, but operator codes too; types contain spaces maybe — inline onclick with quotes risky; use delegation). I'll use delegation with data-ask="tail|583UP" etc.

**Tooltip tip**: delegate mouseover on [data-tip]; position like parent xPlace (right of target, clamp). Touch: tap shows? Native title covers touch poorly; fine.

Let me also keep "How it was found" decoded via what.found_by rows (labels). Records' discovered label plain.

**Zone rendering**: zones rows sorted by n desc (tally returns most_common already). Show top 12 + "and {rest} more location strings in the sample" if rows>12? tally caps at 40. I'll show top 12 with overflow note "the sample held {rows.length} distinct location strings; the {sum-rest} others are smaller." Actually simpler: show all up to 40? That's long. Show 12 with note. Also no_zone line. Also note about free text: "The FAA zone codes are ZONE 100–900; anything else here is the mechanic's own words for a place, kept because it was filed."

undecoded rows: label is raw string; style with .undec muted italic? Show as-is with tag "as written".

**systems (WHERE)**: chapters; bars; scope line complete. Also "no_zone" belongs to zones block.

**WHO aircraft**: tails bars clickable → ask tail. Scope: sampled. Note: "top tails in the sample; {aircraft.counted} read."

**types**: "MAKE MODEL" strings; clickable → ask make with model.

**what.nature/condition/parts**: sampled bars. condition/part plain strings; nature labels via codes tooltip (rows have code+label; tooltip from CODEZ.nature).

**found_by/stage**: complete bars with tooltips (codes tables discovered/stage).

Now code the JS carefully.

State:
```
let CODEZ={}, HEALTH=null, LAST=null, kind='tail';
const $=id=>document.getElementById(id);
```

boot():
- render picker, bind inputs.
- fetch codes → CODEZ.
- fetch health → corpus in sub (guard).
- read URL params; if v → ask(..., push=false) else landing.

ask(kind,v,model,push=true):
- validate.
- show loading.
- fetch /z/api/entity?...
- on ok: LAST=d; render(d).
- on network/500: error card.
- pushState.

render(d):
- if !d.total (or months empty & records empty & total===0): empty state card with honest note (tail-specific vs operator/type).
- build sections.

Helpers:
- num, esc, ukDate, monthName(m) => "May 2019".
- scopeHTML(t): complete vs sampled lines (computed with d.total).
- tallyBlock(title, t, opts): heading, scope, bars, footnote.
- barRow(label, n, max, {click, tip, none}).

Bars markup:
```
<div class="brow">
 <span class="bk" data-tip="...">label</span>
 <span class="bt"><i class="bb" style="width:x%"></i></span>
 <b class="bn">1,234</b>
</div>
```
Grid columns. Width relative to max; min 1.5%.

WHEN chart:
```
<div class="mchart"><div class="mrow">spans...</div><div class="maxi">year labels</div></div>
```
Each span flex:1; i height = n/max * 90px. Add title attr `${monthName} · ${n} reports`. Peak: class .pk (outline). Aim line #whenAim updates on mouseover (delegated) — or just use title attr to keep code lean? Parent has aim line; I'll implement small aim under chart via event delegation, it's cheap.

Axis: for each month, label if month endsWith "-01" → year 'YY? Use full year 4-digit, font 9.5 mono, flex basis aligned under its month (each axis span flex:1, text-left, like parent). 

Chart container: if months.length > 84 → overflow-x auto with min-width per month 7px. Set style on .mrow {min-width: X px}.

Sticky? no.

FORCED section:
```
<section class="forced">
 <div class="slab">WHAT IT FORCED</div>
 <h3 class="sq">What did the defect make the crew do?</h3>
 <p class="serif fsent">{forced.sentence}</p>  // endpoint sentence
 <div class="bars">action rows + none row</div>
 <p class="fnote">caveats...</p>
</section>
```
Forced scope: sampled (computed from analysed). Add scope line: "Counted over the newest {analysed} read (of {total})." since endpoint computes from rows. Also "A report can carry up to four actions..."

If forced.actions empty and none==analysed: sentence says 0 of N... show "No report in this sample records an action..." — handle: if with_action==0 render muted note instead of bars.

Records: build HTML string per record. Chips: small tag spans with tooltip where possible.

Tags builder: tag(label, tip) → `<span class="tag" data-tip="...">label</span>`.

For nature/crew labels (no codes): plain tags without tip.

Missing fields: parent uses `<span class="absent">not recorded</span>`.

Hours/cycles: show if present: mono "{hours} h" "{cycles} cycles". These are values at time of report.

Record head layout: grid two rows? Keep flexible: 
```
<div class="rhead">
  <div class="rc rdate">8 May 2019</div>
  <div class="rc rwho">N583UP · United Airlines (UAL)</div>
  <div class="rc rwhat">Landing gear · 3230 · BEARING · P/N xxx</div>
  <div class="rc rmeta">32,401 h · 18,204 cycles</div>
</div>
```
Hmm, simpler: one line with separators: date | tail | operator | system | part. Use flex wrap with mono bits. Then tags row. Then wu. Then foot with gloss + id.

Clickable spans: tail (`<span class="c" data-ask="tail|583UP">N583UP</span>`), operator code (`data-ask="operator|UAL"` shows name or code), type (`data-ask="make|BOEING|7378H4"`).

Note under records head: "Click a tail, an airline or a type to make it the thing."

**cannot_show card**:
```
<div class="card cannot">
 <h3>What this page cannot show</h3>
 <ul>...</ul>
</div>
```
Use 14px.

**Export**: only kind=tail: `<a class="ghost btn" href="/z/api/export/{tail}.csv">Export CSV (with citations)</a>`. Actually endpoint builds citation header lines. Label: "Export CSV". filename N{tail}-sdr.csv.

**Verified summary** button id, lazy fetch once; store.

Also maybe show stats mini-table under summary: n, first, last, top_system n, on_ground, crew_action — redundant with sentence; skip, keep note.

**Verifier failure**: response 500 with json {error}. fetch: check res.ok; if !ok try json → show its error message + honest line.

**Gloss call**:
```
async function doGloss(id){
  const r = LAST.records.find(x=>x.id===id); ...
  button -> "Asking the model…" disabled
  POST /z/api/gloss {text:r.text, system:r.system, part:r.part, condition:r.condition, nature:r.nature.join("; "), stage:r.stage, discovered:r.discovered, zone_label:r.zone_label}
  result div: if abstained → "Abstained — {reason}." muted; else if plain → label + text + model note.
}
```
Note text: "Written by {model} from the decoded fields and the verbatim text above. It can be wrong; the verbatim text is the record." House style: honest about generation. Keep short: "Generated by {model} from the decoded fields. The mechanic's words above are the record; check the two against each other."

Cache: glossCache[id]={html} to avoid refetch; toggling? Keep shown; second click does nothing (button hidden after success? or says "shown above" disabled). I'll hide button after result.

**Tip element**: fixed dark like parent #tip.

Delegated mouseover: closest('[data-tip]') → show. mouseout hide. Position: right of rect, clamp bottom.

**Kind picker styles**: like parent .picker buttons with .q label.

Let me write the HTML skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta viewport>
<title>SDR Desk /z: one thing, five answers</title>
<link fonts...>
<style>...</style>
</head>
<body>
<header>
  <h1>One thing, five answers</h1>
  <div class="sub">A tail number, an airline or an aircraft type in; the FAA's Service Difficulty Reports answer back five ways — when, where on the aircraft, whose, what was found, and what it forced the crew to do. The same public corpus as the <a href="/">lookup desk</a>, read through a different lens.<span id="hsub"></span></div>
</header>
<main class="wrap">
  <div class="ask card">...</div>
  <div id="out"></div>
  <p class="credit">...</p>
</main>
<div id="tip"></div>
<script>...</script>
</body></html>
```

Wait — link inside header .sub: color #c3bdb4 underline. ok.

Now CSS. I'll write compact but complete. Borrow parent's tokens & pieces:

```css
:root{--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--smoke:#6b6560;--rust:#c44b28;--rust-text:#b8431f;--line:#e2ded5;--card:#fff}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--rust-text)}
header{background:var(--ink);color:#fff;padding:16px 20px}
header h1{margin:0;font:600 19px Archivo,...}
header .sub{color:#c3bdb4;font-size:13px;margin-top:4px;max-width:780px}
header .sub a{color:#ffc6a8}
.wrap{max-width:1080px;margin:0 auto;padding:16px 20px 70px}
.card{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:14px;margin:10px 0}
...
```

Mono: 'IBM Plex Mono',ui-monospace,Menlo,monospace.
Serif: 'Instrument Serif',Georgia,serif.
Archivo for labels: font-family:Archivo,system-ui,sans-serif.

.ask: display flex column gap. Picker inline.

Landing: serif 30px line + dl of the five questions with labels.

dl style: parent dt/dd.

Record:
```css
.record{background:var(--card);border:1px solid var(--line);border-radius:4px;margin:10px 0;overflow:hidden}
.rhead{padding:10px 14px 6px;display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;border-bottom:1px solid #f0ede6}
.rtags{padding:6px 14px;display:flex;flex-wrap:wrap;gap:4px}
.wu{background:#faf8f4;border-left:2px solid #e0d9cc;padding:8px 12px;margin:0 14px;cursor:default}
.wu .txt{font-family:mono;font-size:12.5px;line-height:1.6;white-space:pre-wrap;color:#403b35}
.rfoot{display:flex;gap:10px;align-items:center;padding:8px 14px 10px}
.rid{margin-left:auto;color:var(--ash);font:11.5px mono}
.glossout{margin:0 14px 12px;border:1px dashed #cfc8ba;background:#fbf9f3;border-radius:4px;padding:9px 12px}
.glossout .glab{font:600 10px Archivo;letter-spacing:.08em;color:var(--ash);text-transform:uppercase;margin-bottom:3px}
.glossout .gtxt{font-size:14.5px}
.glossout .gnote{font-size:11.5px;color:var(--ash);margin-top:5px}
```

.absent{color:var(--ash);font-style:italic} like parent.

.tag: background:#f1eee7;border-radius:3px;padding:1px 6px;font-size:11.5px;color:#5f584f. With data-tip → dotted underline.

.scope lines:
```css
.scope{font-size:12.5px;margin:6px 0 8px;padding:6px 10px;border-radius:4px;line-height:1.5}
.scope.full{background:#f2f5f1;color:#3f4a3c;border:1px solid #dfe6dc}
.scope.sample{background:#fdf3ee;color:#7c3a1f;border:1px solid #eec9b8}
```

Bars:
```css
.bars{display:flex;flex-direction:column;gap:3px}
.brow{display:grid;grid-template-columns:minmax(110px,220px) 1fr 74px;gap:8px;align-items:center;font-size:13px}
.brow .bk{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.brow .bk.click{color:var(--ink);cursor:pointer;border-bottom:1px solid transparent}
.brow .bk.click:hover{color:var(--rust);border-bottom-color:rgba(196,75,40,.55)}
.brow .bt{background:#efece4;border-radius:3px;height:11px;min-width:60px;display:block}
.brow .bb{display:block;height:100%;background:var(--rust);border-radius:3px;min-width:2px}
.brow .bb.none{background:repeating-linear-gradient(45deg,#cfc8ba 0 4px,#efece4 4px 8px)}
.brow .bn{text-align:right;font:12px mono;color:#5f584f;font-variant-numeric:tabular-nums}
.bmore{font-size:11.5px;color:var(--ash);margin-top:2px}
```

Sections:
```css
section.five{margin:26px 0 8px;border-top:2px solid var(--line);padding-top:10px}
section.five.first{border-top:0}
.slab{font:600 10.5px Archivo;letter-spacing:.18em;color:var(--ash)}
.sq{font:400 24px/1.2 'Instrument Serif',Georgia,serif;margin:4px 0 6px}
.slede{font-size:13px;color:var(--smoke);max-width:800px;margin:0 0 8px}
```

Forced:
```css
section.f5{border-top:3px solid var(--rust);background:var(--card);border-radius:4px;padding:14px 16px;margin:26px 0 8px;border:1px solid var(--line);border-top:3px solid var(--rust)}
.fsent{font:400 21px/1.35 'Instrument Serif',Georgia,serif;max-width:44em;margin:6px 0 10px}
.fsent b{font:500 .95em mono;color:var(--rust-text)}
```
Hmm sentence from endpoint is plain text with numbers; I can bold numbers via regex? Don't transform server sentence — render as-is. Fine, no bolding (can't reliably). Actually I could highlight digits with regex on escaped text — safe if I escape then wrap digits pattern `\d[\d,]*`. That's cosmetic; do it carefully: esc then replace /(\d[\d,\.]*)/g with <b>. OK.

Headline:
```css
.stamp{font:600 10.5px Archivo;letter-spacing:.18em;color:var(--ash);margin:18px 0 2px}
h1.title{font:400 40px/1.05 'Instrument Serif',Georgia,serif;margin:2px 0 6px}
.figline{font:13px mono;color:#5f584f}
.figline b{font-size:15px;color:var(--rust-text);font-weight:500}
```

Buttons: parent style:
```css
button,.btn{font:inherit;padding:7px 11px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink);cursor:pointer}
.btn{display:inline-block;text-decoration:none}
button.primary{background:var(--ink);color:#fff;border-color:var(--ink)}
button:disabled{opacity:.5;cursor:default}
```

Picker:
```css
.picker{display:flex;gap:2px;background:rgba(29,29,31,.05);border-radius:6px;padding:3px}
.picker button{border:0;background:none;padding:5px 11px;border-radius:4px;font:600 11px Archivo;letter-spacing:.08em;color:#5c554c;cursor:pointer}
.picker button.on{background:#fff;color:var(--rust-text);box-shadow:0 1px 2px rgba(0,0,0,.08)}
```

Inputs:
```css
input{font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink)}
```

Ask layout:
```css
.ask{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ask input#v{flex:1;min-width:220px}
```
Starters: .starter flex wrap buttons ghost small.

Landing five list: 
```css
.fivelist{display:grid;grid-template-columns:110px 1fr;gap:6px 14px;font-size:14px;max-width:760px}
.fivelist .k{font:600 11px Archivo;letter-spacing:.1em;color:var(--rust-text);padding-top:2px}
```

Tip:
```css
#tip{position:fixed;display:none;max-width:340px;background:var(--ink);color:#fff;font-size:12.5px;line-height:1.45;padding:9px 12px;border-radius:7px;z-index:99;box-shadow:0 12px 30px rgba(10,14,20,.4)}
#tip b{display:block;margin-bottom:2px}
#tip .fa{color:#b9c4d0}
```

Month chart:
```css
.mchart{position:relative}
.mrow{display:flex;gap:1px;align-items:flex-end;height:96px}
.mo{flex:1;min-width:3px;position:relative;height:100%}
.mo i{position:absolute;bottom:0;left:0;right:0;background:var(--rust);border-radius:1px;opacity:.85}
.mo.pk i{opacity:1;outline:1.5px solid var(--ink);outline-offset:1px}
.maxi{display:flex;gap:1px;font:9.5px mono;color:var(--ash);margin-top:3px}
.maxi span{flex:1;min-width:0;text-align:left;overflow:hidden;white-space:nowrap}
.maim{font:12px mono;color:var(--rust-text);margin-top:4px;min-height:18px}
```

Focus styles: outline rust.

credit: same as parent.

Now JS. Let me write it fully.

```js
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>(s==null?"":String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>(n==null||n==="")?"":Number(n).toLocaleString("en");
const MON=["","Jan","Feb",...]; // and full
function ukDate(us){...} // parent's
function monthName(m){const [y,mm]=String(m).split("-");return `${MONF[+mm]||m} ${y}`}
```

CODEZ load; clabel(table,code) etc.

State: let KIND='tail', LAST=null, GLOSSC={}, SUMDONE=null, REPLOAD=false;

Pickers: three buttons data-k. model input wrapper hidden unless make.

starters: array of {label, kind, v, model}.

ask(kind,v,model,replace):
```
async function ask(k,v,md,push){
  KIND=k;
  showLoading();
  const q=new URLSearchParams({kind:k,v:v}); if(md)q.set("model",md);
  let d;
  try{ const r=await fetch("/z/api/entity?"+q); if(!r.ok) throw new Error("HTTP "+r.status); d=await r.json(); }
  catch(e){ renderError(e); return; }
  LAST=d; LASTQ={kind:k,v:v,model:md||""};
  render(d,k,v,md);
  if(push!==false){const u=new URLSearchParams();u.set("kind",k);u.set("v",v);if(md)u.set("model",md);history.pushState(null,"","?"+u.toString());}
  scrollTo({top:0});
}
```

render(d):
```
const out=$("out"); const bits=[];
if(!d.total){ out.innerHTML=emptyHTML(d); return; }
```
empty: use d.title; note per kind.

Headline:
```
const span = d.when&&d.when.first? `from ${monthName(d.when.first)} to ${monthName(d.when.last)}`:"";
```
Wait first/last are months of the trend (dated only). ok.

stamp: `FAA SERVICE DIFFICULTY REPORTS · ONE THING, FIVE ANSWERS`.

Actions row for tail: verified summary + export + repeats handled in sections instead. I'll place buttons row: [Verified summary][Export CSV] only tail.

Cannot card.

Sections builder.

WHEN:
```
section("when","WHEN","When did it happen?","Month by month across the whole span. A spike has a date; this is where to find it.", whenHTML(d))
```
whenHTML: if months empty → muted "No dated reports." else chart + notes:
- peak: `Busiest: ${monthName(peak.month)}, ${num(peak.n)}.` in .maim default text? put as static line under.
- notes: "Months count dated reports only. The most recent months are still filling up — reports reach the FAA days to months after the event — so a dip at the right can be the post arriving late, not fewer faults."

Chart building with max = peak.n.

Aim interaction: delegate mouseover on .mo → set maim text `${monthName(m)} · ${n} reports`; mouseleave of .mrow resets to peak line? Keep simple: on mouseover set; on mouseout of chart restore peak text.

Implement via delegation:
```
out.addEventListener("mouseover", e=>{ const m=e.target.closest(".mo"); if(m){$("maim").textContent=m.dataset.aim;} });
out.addEventListener("mouseout", e=>{ if(e.target.closest(".mchart") && !e.relatedTarget?.closest?.(".mchart")) reset });
```
Simpler: mouseout on chart container resets. ok.

WHERE: two tally blocks (zones, systems) + no_zone note.
- zones scope sampled; systems scope per flag.
- zones extra note about free text.

WHO: three blocks: operators, aircraft, types. aircraft rows clickable tails; types clickable; operators rows show name if known: row.label is raw code (from breakdown). Merge names: build from records map opNames. rows.map(r=>({...r, label: opNames[r.code]? `${opNames[r.code]}` : r.code, sub: r.code})). Display label + small code tag when name known. Click → ask operator.

Wait: for kind=operator query, agg_ops complete single row — clicking it re-asks same; harmless.

If who.aircraft rows empty (no tails in sample): "No tail numbers in the sample read."

types label "MAKE MODEL" → click asks make+model parse: store data-ask="make|MAKE|MODEL".

WHAT: four/five blocks: nature (sampled, tooltip via CODEZ.nature), condition (sampled plain), parts (sampled plain), found_by (complete? flag), stage (complete). Show each with scope. Parts top 12.

Note for nature: "A report can carry up to three nature codes..." (true from parent). Add as slede.

FORCED section as designed.

Records:
```
<section class="five" id="s-recs">
 slab THE RECORDS · sq "The write-ups themselves"
 slede: "Newest first. Every code is decoded where it appears; the mechanic's own words are the evidence and sit above the record id. Click a tail, an airline or a type to make that the thing."
 count line: sampled scope: "Showing {records.length} of the {analysed} read, of {total} in the file." (adjust when not capped)
 records...
</section>
```

Record HTML as planned. Tags:
- system: `<span class="tag" data-tip="{faa}">{system}</span> <code class="cd">{system_code}</code>` — tooltip: codes payload has no jasc table! /z/api/codes want list excludes jasc. So no faa for system. Show label + code plain. Hmm "Every FAA code on the page must be explained where it appears." The system label IS the explanation (4-digit decoded to name) + code shown beside. That satisfies: code → label adjacent. For single letters (nature/stage/discovered) we have tables with faa — include tooltips.

Wait: records' nature[]/crew[]/stage/discovered are labels only; the CODE appears... where? In records, codes aren't shown (decorate returns decoded only, except system_code and zone). So "codes explained where they appear" applies to: tally rows (code+label both present — show label with code in tooltip or beside), record system_code (label beside), zone (label beside or raw). For tallies, I'll show label as main text and the raw code as small mono suffix when code != label: `${label} <code>${code}</code>`? For 40-row nature blocks that's noisy but it's exactly "explained where it appears". Parent shows code tags beside names in bars (.k code.tag). Yes parent does: `${opName} <code class="tag">${key}</code>`. Follow that: label + code tag. Tooltip carries faa wording when known.

For sampled vs complete, tally rows for complete (from breakdown) include label already decoded (server-side via parent) except operator (raw code). We merge names for operator from sample.

Now careful: tally() rows for complete path (full()) have shape {code,label,n,undecoded:false}. For zones sampled: tally(rows, get, "part_location") → rows have code (raw PartLocation string), label (decoded or code), undecoded flag.

Record zone display: if zone_label && zone_label!==zone → `ZONE … (label)`; else raw zone; else absent.

Cracks: if cracks or crack_length: tag "cracking: {cracks} × {len} in".

Corrosion: label tag.

Now empty state for total=0:
```
<div class="card">
 <h2 class="serif">Nothing in the file matches {title}.</h2>
 <p>That is not evidence about the {thing}. For a tail: it may never have carried a US registration, or nothing was ever written up. For an airline: the four-letter designator may be wrong — this desk takes the FAA's own code, not the trading name. For a type: the make is filed as a code, e.g. BOEING, and the model as filed, e.g. 7378H4.</p>
</div>
```
Good.

renderError: "The desk did not answer ({msg}). Nothing was rendered rather than something wrong." House style.

Summary:
```
async function loadSummary(){
 if SUMDONE render cached
 fetch /z/api/summary/ + tail (LASTQ.v stripped of N)
 tail raw = LASTQ.v.replace(/[^A-Za-z0-9]/g,"").replace(/^N/,"")... careful: v for tail kind stored as typed. compute t=v.toUpperCase().replace(/[^A-Z0-9]/g,"").lstrip N.
 if !res.ok: try json error → render verifier message.
 else render.
}
```

Repeats: details element with ontoggle → fetch once.

```
<details class="card" id="repeats"><summary>Same system, written up more than once on this airframe</summary><div id="repout"><p class="muted">Reading…</p></div></details>
```
ontoggle if open & !REPLOAD fetch.

Render groups: rows: system+part, times, first→last, hours_between line, ids mono truncated (show all ids? could be long; show count + first few). I'll show ids joined with ", " truncated to ~120 chars with "…". Plus note verbatim in muted at top. Plus caveat: "Neither the tool nor this page says whether a later report is the same finding returning."

Empty groups → "No system/part pair appears twice in the newest 500 reports on this airframe."

Export: `<a class="btn" href="/z/api/export/${t}.csv">Export CSV</a>` — with title "One row per write-up, with a citation header."

popstate: parse params; if v ask with push=false else landing.

Also the model input visibility toggle.

Health: fetch once → $("hsub").innerHTML = ` The file holds <b>{corpus}</b> reports.`? Header sub is text; append span. Keep: if health.ok && corpus → append. Note health returns {corpus, sdr_reachable,...}. If corpus null → skip.

Let me also add a small "How to read this page" note? The landing covers it.

Now — the "Say this in plain English" is "the best thing on the page" — make it prominent: place button directly under the wu text, and the result styled as reading. Also maybe auto-gloss the first record? No — restraint; user clicks.

Delegated click handler on document for [data-ask], [data-gloss], .clause? Let me centralize:

```
document.addEventListener("click", e=>{
  const a=e.target.closest("[data-ask]");
  if(a){ const [k,v,md]=a.dataset.ask.split("|"); ask(k,v,md||""); return; }
  const g=e.target.closest("[data-gloss]");
  if(g){ doGloss(g.dataset.gloss,g); return; }
});
```

Inline starters use data-ask too.

doGloss(id,btn):
```
const r=(LAST&&LAST.records||[]).find(x=>String(x.id)===String(id)); if(!r) return;
if(GLOSSC[id]){ showGloss(id); return; } // already
btn.disabled=true; const old=btn.textContent; btn.textContent="Asking…";
try{
 const res=await fetch("/z/api/gloss",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:r.text,system:r.system,part:r.part,condition:r.condition,nature:(r.nature||[]).join("; "),stage:r.stage,discovered:r.discovered,zone_label:r.zone_label})});
 const d=await res.json();
 GLOSSC[id]=d; showGloss(id);
}catch(e){ GLOSSC[id]={error:...}; showGloss(id);} finally{btn.disabled=false;btn.textContent=old; hide btn if shown}
```
showGloss(id): find container div#g-{id}; render:
- error: "The plain-English service did not answer. The verbatim text stands on its own."
- abstained: `<div class="glab">Plain English — abstained</div><div class="gtxt muted">The model declined: {reason}. The write-up is too abbreviated or unclear to restate without adding something.</div>` plus model note.
- plain: `<div class="glab">In plain English · generated</div><div class="gtxt">{plain}</div><div class="gnote">Written by {model} from the decoded fields and the words above. It adds nothing and can still be wrong — check the two against each other.</div>`

After success, hide the button (or change to "Shown above" disabled). I'll hide.

Escape plain text from model (esc) — yes, never inject model output as HTML.

**Numbers in records**: hours/cycles as filed strings; show mono.

Check esc for data-ask values: types contain spaces — dataset handles fine since we set via HTML attribute with esc.

Tail click in records: data-ask="tail|{tail}". Tail might be empty → guard.

Operator click: data-ask="operator|{code}".

Type click: data-ask="make|{make}|{model}" — model may be empty.

**One more consideration**: entity 'value' for tail: user may type "N583UP" — backend strips N. title becomes N583UP. Good.

**Landing**:

```
<div class="card land">
 <p class="big serif">One thing in. Five answers out.</p>
 <p class="lede">Name a tail number, an airline or an aircraft type. The FAA's Service Difficulty Reports answer five questions about it, in the order a reporter asks them:</p>
 <div class="fivelist">
  <span class="k">WHEN</span><span>Month by month, over the whole span the file covers. A spike has a date.</span>
  <span class="k">WHERE</span><span>Where on the aircraft — the FAA's zones, and the systems that keep coming up.</span>
  <span class="k">WHO</span><span>Which airlines filed, which individual airframes, which types.</span>
  <span class="k">WHAT</span><span>What was found, in the FAA's codes and the mechanics' own words.</span>
  <span class="k">WHAT IT FORCED</span><span>What the defect made the crew do — a shutdown, a diversion, masks on. The FAA buries this hardest; it gets its own answer here.</span>
 </div>
 <p class="muted">Nothing is asked yet, so nothing is shown. Pick a starter or type your own.</p>
 <div class="starter">starters…</div>
</div>
```

Starters: 
- {label:"United Airlines (UAL)", kind:"operator", v:"UAL"}
- {label:"American Airlines (AAL)", kind:"operator", v:"AAL"}
- {label:"Boeing, all types", kind:"make", v:"BOEING"}
- {label:"Airbus, all types", kind:"make", v:"AIRBUS"}

Add note: "For a tail, type the registration with or without the N."

Ask bar hint line: dynamic per kind:
- tail: "The registration, with or without the leading N — e.g. N583UP or 583UP."
- operator: "The FAA's four-letter designator, e.g. UAL — not the ticket code, and not the trading name. The lookup desk at / lists every code with its name."
- make: "The make as filed, e.g. BOEING — and optionally the model exactly as filed, e.g. 7378H4, no dash."

Now, about "same fonts": link identical Google fonts (Archivo 600;800? parent uses 600;800 but CSS uses 600 only... parent link: Archivo:wght@600;800, Instrument Serif ital, IBM Plex Mono 400;500). Copy same link.

Titles: <title>SDR Desk /z — one thing, five answers</title>.

Also honor prefers-reduced-motion minimal (no animations anyway). Focus-visible outlines.

Let me now also think about the tallyBlock function signature:

```
function tallyHTML(title, slede, t, opts={}){
  const rows=(t&&t.rows)||[];
  if(!rows.length) return `<div class="tblock"><h4>${title}</h4><p class="muted">${opts.none||"Nothing recorded."}</p></div>`;
  const max=Math.max(1,...rows.map(r=>r.n));
  const shown=rows.slice(0,opts.cap||12); rest=rows.length-shown; restN=sum of rest? show count only.
  ...
}
```

Scope line: scopeHTML(t, d):
```
function scopeHTML(t){
  if(!t) return "";
  const c=t.counted;
  if(t.complete) return `<div class="scope full">Counted over every report in the selection that records this field — ${num(c)}.</div>`;
  return `<div class="scope sample">Counted only over the newest ${num(c)} reports read (a sample). The rest of the selection was not read for this figure.</div>`;
}
```
Hmm "newest" — records are newest-first from search, and tally counts from those rows → yes newest 400. Good.

For WHO aircraft sampled counted=len(rows) too.

For forced: scope sample with counted=d.analysed.

Bar row:
```
function barRow(r,max,opt){
  const w=Math.max(1.5, r.n/max*100).toFixed(2);
  const lab = opt && opt.plain ? esc(r.label) : `${esc(r.label)}${r.code&&r.code!==r.label?` <code class="cd">${esc(r.code)}</code>`:""}`;
  const tip = opt&&opt.tip ? opt.tip(r) : "";
  const click = opt&&opt.click ? ` data-ask="${esc(opt.click(r))}" class="bk click"` : ` class="bk"`;
  return `<div class="brow"><span${click}${tip?` data-tip="${esc(tip)}"`:""}>${lab}</span><span class="bt"><i class="bb" style="width:${w}%"></i></span><b class="bn">${num(r.n)}</b></div>`;
}
```
Careful with class attribute placement — build string carefully.

Undecoded rows: r.undecoded → label is raw code; append `<span class="u">as written</span>`? Style .cd enough. Add title "not in the FAA table". I'll append muted note char: `<span class="muted"> (as filed)</span>`? Keep: if r.undecoded, wrap label with class and add tag "not in the FAA table" in tooltip. Simple: data-tip="This value is not in the FAA code table; shown exactly as filed."

Tooltip content builder: tipFor(table, row): look up CODEZ[table][row.code] → parts: label (bold), "FAA wording: "+faa, note. Join lines.

```
function codeTip(table,code,label){
  const e=(CODEZ[table]||{})[String(code||"").toUpperCase()];
  if(!e) return "";
  const bits=[];
  if(e.faa && e.faa.toUpperCase()!==String(e.label||label||"").toUpperCase()) bits.push("FAA wording: "+e.faa);
  if(e.note) bits.push(e.note);
  return bits.join(". ");
}
```
Use in tallies with table knowledge: nature→"nature", found_by→"discovered", stage→"stage", zones→"part_location", systems→ none (ATA chapters not in tables).

Records tags tooltips: for stage/discovered/corrosion labels we don't have codes... decorate returns decoded labels only. So tags are labels; no codes present → nothing to explain beyond label itself. Fine.

BUT the requirement "Every FAA code on the page must be explained where it appears. Nobody should have to go and look up what B or IN or ZONE 700 means." — On this page, codes appear in: tallies (we show label + code + faa tooltip ✓), record system_code (label beside ✓), zone raw strings (label beside when decodable ✓). Single letters themselves never appear bare except... system_code "3230" beside label ✓. Good.

Also crew action labels from tally? Forced actions are labels only (endpoint returns {label,n}). Fine.

Now the WHEN chart with many months: months length could be ~320. Bars flex:1 with min-width 3px → total min 960px > container ~1040 fine-ish; set .mchart overflow-x:auto and .mrow min-width when months>90: style="min-width:{months*7}px". Provide hint "scrolls sideways".

Axis labels: year on January (mm==="01"). Each span flex:1 with text; but with min-width, spans align since same flex layout as .mrow (same gap). Put maxi inside same scrolling container so they align: wrap .mrow and .maxi in .mscroll div that gets min-width.

```
<div class="mchart" tabindex="0"? no>
 <div class="mscroll" style="min-width:...">
   <div class="mrow">…</div>
   <div class="maxi">…</div>
 </div>
</div>
<div class="maim" id="maim">Busiest: May 2019, 1,234 reports.</div>
```

mo dataset: data-m, data-n, data-aim string, title attr too for native fallback.

peak class when m===peak.month.

Also handle months where all n=0? unlikely.

**Forced numbers**: d.forced.sentence built server-side: "%d of the %d reports here record something the defect forced the crew to do. In %d, no listed action was taken." where %d=len(rows)=analysed. Render with digit bolding.

Actions bars: rows [{label,n}] — labels like "UNSPECULATED LANDING"? dec gives e.g. "Unscheduled landing". Show as-is. Add code? forced rows lack codes (endpoint maps label only). OK plain bars.

none row: `<div class="brow"><span class="bk">No listed action</span><span class="bt"><i class="bb none" style="width:x%"></i></span><b class="bn">num(none)</b></div>` with x relative to same max (max of actions and none). Include none in max computation.

fnote: "A report can carry up to four of these codes, so the action bars can add to more than the number of reports. The 'no listed action' row counts reports where none appears. Counted over the newest {analysed} read."

Also the forced slab note: "This is its own question, not a footnote." maybe skip meta-commentary; the parent voice does explain ("It is a separate question, not a footnote to WHAT" is in code comments). On page, a short slede: "Not what broke — what it made the crew do. This is the question the FAA buries hardest, so it is answered on its own."

**Sections list order**: WHEN, WHERE, WHO, WHAT, FORCED, RECORDS, (REPEATS for tail inside records area? separate section after records). I'll put REPEATS after records for tails.

Also include for tails the summary near top (button) — put buttons row right after reading: [Show the verified summary] [Export CSV]. Summary block renders inline where button was (replace area).

Now writing the whole file. Must be complete and runnable. Watch quoting inside template literals (I'll use backticks in JS; HTML file fine).

Also careful: In HTML <script>, avoid "</script>" inside strings — none.

Potential pitfall: `esc()` on data-tip containing quotes → attribute safe.

Let me define CSS classes final list and write.

Also the parent's `.c` clickable style reused for record inline clicks: define .c{cursor:pointer;border-bottom:1px solid transparent}.c:hover{color:var(--rust);border-bottom-color:rgba(196,75,40,.55)}.

Date display: ukDate handles "MM/DD/YYYY". Some dates may be ISO? decorate date is DifficultyDate raw (MM/DD/YYYY per parent). If parse fails, return as-is.

monthName for "2025-08" → "Aug 2025" using MON3. For axis years use m.slice(0,4).

Write empty-tail vs operator/type copy:

```
function emptyHTML(d,k,v,md){
 const thing = k==="tail"?"aircraft":k==="operator"?"operator":"type";
 let hint;
 if(k==="tail") hint="It may never have carried a United States registration, or nothing was ever filed about it. Tail numbers here are filed without the leading N — try it without.";
 else if(k==="operator") hint="The designator must be the FAA's own four-letter code — UAL, not United, not UA. The lookup desk at / lists every code with its name beside it.";
 else hint="The make is filed as a code — BOEING, AIRBUS — and the model exactly as filed, e.g. 7378H4 rather than 737-800.";
 return card with title "Nothing in the file matches {d.title}." + hint + "That is not evidence about the "+thing+": an empty answer here is an answer about this file, not about the world."
}
```

Good house voice.

Loading state: `<div class="card"><p class="muted">Reading the file…</p></div>`.

Error: `<div class="card"><p><strong>The desk did not answer.</strong> ${esc(msg)} Nothing is shown rather than something wrong.</p></div>`.

Header credit + method footer:
```
<p class="credit">Same corpus as the <a href="/">SDR Desk lookup</a>. Codes come from the FAA's own tables; names for airline codes come from the FAA's 2006 cross-reference and can be stale. Inspired by Rory Kennedy's <a ...>Downfall</a>. Built by Henk van Ess © 2026.</p>
```

Hmm keep close to parent's credit and add the corpus line. Fine.

Also add a small "About the numbers" note somewhere global? The cannot card covers it per-entity.

Edge: entity for operator returns records sample with operator name; opNames map built from records: r.operator_code→r.operator||null.

Also types tally label like "BOEING 7378H4" — clickable sets make/model. In barRow click fn returns `make|${code}`? types rows code is the combined string with space. Parse: split on first space → make, model. click(r)=> "make|"+r.code.

Aircraft rows code=tail → click "tail|"+code.

Operator rows code=designator → click "operator|"+code.

Now the summary/verifier: endpoint returns found:0 when no raw — but we only show button when d.total>0 so fine. Handle 500: res.ok false → try await res.json() → {error:"verifier disagreed..."} → render: "The verifier disagreed with the arithmetic (%s), so no summary was rendered. That is the catch working; nothing is shown rather than something wrong."

Show summary:
```
<div class="sumbox">
 <div class="glab">Verified summary</div>
 <p class="sumtext">{summary with digits bolded}</p>
 <p class="gnote">{note}</p>
</div>
```
sumtext serif 19px.

boldDigits(s): esc(s).replace(/(\d[\d,]*)/g,"<b>$1</b>").

For forced sentence same helper.

Also stats could include top_system "not recorded" — sentence handles.

Repeats fetch:
```
const t=tailParam(); fetch("/z/api/repeats/"+t)
groups rows table:
<div class="rgroup"><b>{system}</b> — {part}: written up <b>{times}</b> times, {first} → {last}. {hours}</div>
```
hours: hours_between!=null? `About ${num(hb)} flying hours between the first and the last.` : "Flying hours not recorded on both reports."
ids: `<div class="rids mono">records: {ids.join(", ")}</div>` truncated 140 chars.

Include note verbatim muted at top.

OK, also remember: "Keep the 'Say this in plain English' button on individual records." ✓.

Also add gloss for... only records. Fine.

Now, per-record tag list construction:

```
function recTags(r){
 const t=[];
 (r.nature||[]).forEach(n=>t.push(tag(n)));
 (r.crew||[]).forEach(c=>t.push(tag("crew: "+c)));  // prefix to distinguish? 
 ...
}
```
Parent shows crew column with labels. Tags with domain prefix might be verbose; instead group with tiny labels:
Tags row: 
`<span class="tl">found</span> {discovered||absent}` etc. Let me structure rtags as inline pairs:

```
<div class="rtags">
 <span class="pair"><i>found</i>{r.discovered?tag(r.discovered):absent()}</span>
 <span class="pair"><i>stage</i>{r.stage?tag(r.stage):absent()}</span>
 <span class="pair"><i>zone</i>{zoneBit}</span>
 <span class="pair"><i>corrosion</i>{...}</span>
 cracks...
 nature list: <span class="pair"><i>found to be</i>{nature tags or absent}</span>
 crew: <span class="pair"><i>crew</i>{...}</span>
</div>
```
.pair{display:inline-flex;gap:5px;align-items:baseline} .pair i{font:600 9.5px Archivo;letter-spacing:.08em;text-transform:uppercase;color:var(--ash);font-style:normal}

That's clean and explains each field's meaning inline via the label. Good.

zoneBit: if r.zone_label && r.zone!==r.zone_label → `${tag(r.zone_label)} <code class="cd">${esc(r.zone)}</code>` else if r.zone → tag(r.zone)+(r.zone_label?"":" <span class='muted'>as filed</span>") else absent "no location recorded".

Hmm zone raw might equal "ZONE 200" and label "Fuselage"? codes.part_location labels: parent label("part_location","ZONE 200") — from codes.json; unknown content but fine.

corrosion: r.corrosion label or skip entirely if none (don't show absent for every optional field — reduce noise: show corrosion pair only when present; cracks only when present; zone always? zone relevant → show even absent? Parent shows absent for missing codes in columns. For records keep: nature, crew, stage, discovered always (core codes), zone/corrosion/cracks only when present.)

part line in rhead: part || absent, part_number code if present.

system in rhead: r.system || absent + code cd.

Operator: if r.operator → text + `<code class="cd">${code}</code>` clickable; else if r.operator_code → clickable code + muted "name not resolved"; else absent "no operator named".

Tail: r.tail? clickable N{tail} : absent "no tail recorded".

Hours/cycles: `<code class="cd">{hours} h</code> <code class="cd">{cycles} cyc</code>` if present.

OK. Also the record's own id: rfoot right side "record {id}" mono.

Time to also handle record text empty: wu shows `<span class="absent">No write-up text in the record.</span>` and gloss button disabled with title "Nothing to gloss".

Now assemble render():

```
function render(d){
 const k=LASTQ.kind,v=LASTQ.v,md=LASTQ.model;
 if(!d.total){out.innerHTML=emptyHTML(d,k,v,md);return}
 const bits=[];
 // head
 bits.push(`<div class="stamp">FAA SERVICE DIFFICULTY REPORTS · ONE THING, FIVE ANSWERS</div>`);
 bits.push(`<h1 class="title">${esc(d.title)}</h1>`);
 const w=d.when||{};
 const span=w.first?` from ${esc(monthName(w.first))} to ${esc(monthName(w.last))}`:"";
 bits.push(`<p class="figline"><b>${num(d.total)}</b> reports${span}.${d.capped?` The newest ${num(d.analysed)} were read in full.`:""}</p>`);
 if(d.framing&&d.framing.sentence) bits.push(`<div class="reading">${boldDigits(d.framing.sentence)}</div>`);
 // actions for tail
 if(k==="tail"){ const t=tailParam(v); bits.push(`<div class="bar row">
   <button class="ghost" id="sumBtn" onclick="loadSummary()">Show the verified summary</button>
   <a class="btn ghost" href="/z/api/export/${encodeURIComponent(t)}.csv" title="One row per write-up, with a citation header">Export CSV</a></div><div id="sumout"></div>`);}
 // cannot
 bits.push(`<div class="card cannot"><h3>What this page cannot show</h3><ul>${(d.cannot_show||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`);
 // WHEN
 ...
 out.innerHTML=bits.join("");
 // post-render: chart aim reset, etc.
}
```

Buttons style: parent .ghost = white bg. Define button.ghost{background:#fff;color:var(--ink)}.

Section builder:
```
function sec(id,label,question,lede,body,extraClass){
 return `<section class="five ${extraClass||""}" id="${id}">
   <div class="slab">${label}</div>
   <h3 class="sq">${question}</h3>
   ${lede?`<p class="slede">${lede}</p>`:""}
   ${body}</section>`;
}
```

WHEN body:
```
function whenBody(d){
 const ms=(d.when&&d.when.months)||[];
 if(!ms.length) return `<p class="muted">No dated reports.</p>`;
 const max=Math.max(1,...ms.map(m=>m.n));
 const peak=d.when.peak;
 const wide=ms.length>90;
 const bars=ms.map(m=>`<span class="mo${peak&&m.month===peak.month?" pk":""}" role="img" aria-label="${esc(monthName(m.month))}, ${num(m.n)} reports" data-aim="${esc(monthName(m.month))} · ${num(m.n)} reports" title="${esc(monthName(m.month))}: ${num(m.n)}"><i style="height:${Math.max(2,m.n/max*92).toFixed(1)}px"></i></span>`).join("");
 const axis=ms.map(m=>`<span>${m.month.slice(5)==="01"?esc(m.month.slice(0,4)):""}</span>`).join("");
 return `<div class="mchart"><div class="mscroll"${wide?` style="min-width:${ms.length*7}px"`:""}><div class="mrow">${bars}</div><div class="maxi">${axis}</div></div></div>
 <div class="maim" id="maim">${peak?`Busiest: ${esc(monthName(peak.month))}, ${num(peak.n)} reports.`:""}</div>
 <p class="fnote">Months count dated reports only${wide?`; ${num(ms.length)} months, so the strip scrolls sideways`:""}. The newest months are still filling up — reports reach the FAA days to months after the event — so a dip at the right can be the post arriving late rather than fewer faults.</p>`;
}
```

Aim handlers (delegated globally):
```
document.addEventListener("mouseover",e=>{
  const m=e.target.closest&&e.target.closest(".mo");
  const a=$("maim"); if(m&&a){a.textContent=m.dataset.aim;}
});
document.addEventListener("mouseout",e=>{
  const m=e.target.closest&&e.target.closest(".mo");
  if(m){const a=$("maim"); if(a&&a.dataset.peak)a.textContent=a.dataset.peak;}
});
```
Set a.dataset.peak initially. Simpler: store peak line in JS var LASTPEAK; on mouseout of .mchart restore. I'll do: in whenBody set data-peak attr on #maim... but #maim recreated each render. Store window.PEAKLINE=peak text; mouseout uses it.

WHERE body:
```
function whereBody(d){
 const w=d.where||{};
 const zn=(w.zones&&w.zones.rows)||[];
 const sy=(w.systems&&w.systems.rows)||[];
 let b="";
 b+=`<h4 class="sub4">Zones and places</h4>`+scopeHTML(w.zones);
 if(zn.length){
   const rows=zn.slice(0,12);
   const mx=Math.max(1,...rows.map(r=>r.n));
   b+=barsHTML(rows,mx,{tip:r=>r.undecoded?"Not a FAA zone code — the mechanic's own words for a place, shown as filed.":codeTip("part_location",r.code,r.label)});
   const shownN=rows.reduce((s,r)=>s+r.n,0), allN=zn.reduce((s,r)=>s+r.n,0);
   if(zn.length>rows.length) b+=`<div class="bmore">${zn.length-rows.length} smaller location strings in the sample, ${num(allN-shownN)} reports among them.</div>`;
 } else b+=`<p class="muted">No location recorded on the reports read.</p>`;
 if(w.no_zone) b+=`<p class="fnote">In ${num(w.no_zone)} of the ${num(d.analysed)} read, no location is recorded at all.</p>`;
 b+=`<h4 class="sub4">Systems (ATA chapters)</h4>`+scopeHTML(w.systems);
 if(sy.length){const mx=Math.max(1,...sy.map(r=>r.n)); b+=barsHTML(sy.slice(0,12),mx,{}); if(sy.length>12)b+=`<div class="bmore">${sy.length-12} more chapters in the count.</div>`;}
 else b+=`<p class="muted">No system code recorded.</p>`;
 return b;
}
```

Hmm systems complete rows up to 40 (breakdown caps 25). slice 12 fine.

WHO body:
```
function whoBody(d){
 const who=d.who||{}; const opN=opNames();
 let b="";
 // operators
 b+=`<h4 class="sub4">Airlines filing these reports</h4>`+scopeHTML(who.operators);
 const ops=((who.operators&&who.operators.rows)||[]).slice(0,10).map(r=>{
    const nm=opN[r.code];
    return {code:r.code, n:r.n, label:nm||r.code, subcode:nm?r.code:null, undecoded:!nm};
 });
 if(ops.length){const mx=Math.max(1,...ops.map(r=>r.n));
   b+=barsHTML(ops,mx,{click:r=>`operator|${r.code}`, tip:r=>nm? "Name from the FAA 2006 cross-reference; carriers merge and rename." : "Designator resolves to no name in the lists carried here; shown as filed."});
 } else b+=`<p class="muted">No operator recorded.</p>`;
 ...
}
```
Wait tip needs nm — restructure: tip:r=>r.subcode?"Name from the FAA 2006 cross-reference; carriers merge and rename, so check before publishing.":"This designator resolves to no name in the lists carried here. The reports are real; the name is missing."

opNames(): build map from LAST.records.

aircraft block:
```
const ac=(who.aircraft&&who.aircraft.rows)||[]; scope sampled.
bars with click tail, label "N"+code.
```
types similar with click make.

WHAT body: blocks for nature (table "nature" tips), condition plain, parts plain, found_by ("discovered" tips), stage ("stage" tips).

Cap rows at 10 each to keep page reasonable; note overflow via bmore (use rows.length vs slice).

FORCED body:
```
function forcedBody(d){
 const f=d.forced||{};
 const rows=(f.actions||[]).map(a=>({label:a.label,n:a.n}));
 const withNone = typeof f.none==="number";
 const all=rows.concat(withNone?[{label:"No listed action",n:f.none,none:true}]:[]);
 if(!all.length||(!rows.length&&!f.none)) return `<p class="muted">Nothing recorded.</p>`;
 const mx=Math.max(1,...all.map(r=>r.n));
 let b=`<p class="fsent">${boldDigits(f.sentence||"")}</p>`;
 b+=`<div class="bars">`+all.map(r=>rowHTML(r,mx,r.none)).join("")+`</div>`;
 b+=`<p class="fnote">A report can carry up to four action codes, so the bars can add to more than the number of reports; the “no listed action” row counts reports where none appears. ${scopeSampleText(d)}</p>`;
 return b;
}
```
rowHTML handles none style.

scopeSampleText(d): `Counted over the newest ${num(d.analysed)} reports read (of ${num(d.total)}).`

RECORDS body: build per record.

Also add to records section: `scope sample` line: "Read and decoded: the newest {analysed} of {total}; shown here: the newest {records.length} of those."

REPEATS (tail): after records:
```
if(k==="tail") bits.push(`<details class="card rep" id="repd"><summary>Same system, written up more than once on this airframe</summary><div id="repout"><p class="muted">Reading…</p></div></details>`);
```
With ontoggle handler: attach via delegation: document toggle event: if target id repd && open && !REPLOADED → fetch.

```
document.addEventListener("toggle",e=>{ if(e.target.id==="repd"&&e.target.open&&!REPLOADED){REPLOADED=true;loadRepeats();} },true);
```

loadRepeats: fetch; render groups or empty note; on error honest.

loadSummary similar with SUMLOADED.

URL/parameters on boot:

```
const u=new URLSearchParams(location.search);
const k0=u.get("kind"), v0=u.get("v");
if(v0) ask((k0 in {tail:1,operator:1,make:1}?k0:"tail"), v0, u.get("model")||"", false);
else renderLanding();
```

Ask bar events: picker buttons set KINDUI and placeholder + model visibility; Ask button reads inputs → ask.

Also Enter in #v triggers ask; Enter in model too.

Starters rendered in landing and also under askbar? Keep starters in landing only; askbar always visible at top (so it's above the report). Good.

pushState: after render success.

Also, when clicking a tail/operator/type from within report, ask() re-renders and scrolls top. Fine.

Health:
```
fetch("/z/api/health").then(r=>r.json()).then(h=>{ if(h&&h.corpus) $("hsub").innerHTML=` The file holds <b>${num(h.corpus)}</b> reports.`; }).catch(()=>{});
```
Header sub b color: define header .sub b{color:#fff;font-weight:600}.

Now gloss result container must exist per record: `<div class="glossout" id="g-${esc(id)}" hidden></div>`. ids may contain odd chars? Control numbers like "UAL-OAI-1234"; safe after esc in attribute id — but CSS id selector with special chars not used; getElementById fine.

showGloss(id):
```
const box=$("g-"+id) — careful id esc: use attribute built with esc(id) but getElementById needs raw. IDs from FAA likely alnum+dash. I'll sanitize: const gid="g"+btoa? overkill. Use index-based: assign each rendered record a seq, map seq→id. Simpler: data-gloss uses record index in LAST.records. doGloss(idx). Container id "g-"+idx. id string displayed separately. Do that: data-gloss="${i}".
```
Yes — records array index stable per render.

Record builder uses LAST.records.map((r,i)=>...).

doGloss(i,btn): r=LAST.records[i].

Cache GLOSSC keyed i (per LAST object; reset on new LAST). Keep simple: cache on record object r._gloss.

Now boldDigits:
```
const boldDigits=s=>esc(s).replace(/\d[\d,]*/g,m=>`<b>${m}</b>`);
```
Applies to sentence text only, safe after esc.

Fonts: copy parent's link exactly.

Title of doc: "One thing, five answers — SDR Desk /z".

Also add favicon? skip.

Now double-check the entity endpoint fields I rely on:
- d.title, d.total, d.analysed, d.capped ✓
- d.when{months,first,last,peak} ✓
- d.where{zones{complete,counted,rows},systems{...},no_zone} ✓
- d.who{operators,aircraft,types} ✓
- d.what{nature,condition,parts,found_by,stage} ✓
- d.forced{actions,none,with_action,sentence} ✓
- d.framing{sentence,...} ✓
- d.records ✓ d.cannot_show ✓

Also handle found=0 shape? entity always returns full shape even when total=0 (search with no rows): months=[] etc. So the empty check on d.total works; also months empty and analysed=0. Good.

One more: for kind=operator, who.operators complete via breakdown: parent's breakdown for operator returns rows for that operator only (selection filtered). Good.

For zone tallies: counted=len(rows) (sample). complete:false always. ✓.

Edge: who.aircraft when kind=tail: single row with that tail, n=analysed-ish. Fine.

Now write CSS for .sub4:
```
.sub4{font:600 11px Archivo;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);margin:14px 0 4px}
```

.fnote{font-size:11.5px;color:var(--ash);line-height:1.5;margin:6px 0 0}

.reading: parent style copy:
```
.reading{margin:10px 0;padding:9px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.55 Georgia,'Times New Roman',serif;max-width:76ch}
.reading b{font-family:'IBM Plex Mono',monospace;font-size:.92em;color:var(--rust-text);font-weight:500}
```
boldDigits b inherits reading b style. 

.fsent b same.

.card ul{margin:0;padding-left:18px} li margin 4px.

.cannt h3 style like h3 parent: small caps ash. Actually use .card h3{font:600 11px Archivo;letter-spacing:.1em;text-transform:uppercase;color:var(--ash);margin:0 0 8px}. Parent h3 is that style. cannot list font-size 14px.

Landing .big{font:400 30px 'Instrument Serif';margin:0 0 8px}.

Also details summary styling:
```
details.card>summary{cursor:pointer;font:600 13px Archivo;letter-spacing:.02em}
details.card[open]>summary{margin-bottom:8px}
```

rgroup:
```
.rg{padding:8px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.rg b.num... just bold digits via markup.
.rids{font:11px mono;color:var(--ash);margin-top:3px;overflow-wrap:anywhere}
```

Buttons ghost in .bar rows: `.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}`.

OK — also mobile: media query stack brow columns smaller:
```
@media(max-width:700px){.brow{grid-template-columns:minmax(90px,130px) 1fr 58px;font-size:12px} h1.title{font-size:30px} .fivelist{grid-template-columns:86px 1fr} .mrow{height:80px}}
```

Focus visible:
```
.c:focus-visible,.bk.click:focus-visible,button:focus-visible,a:focus-visible,summary:focus-visible,.mo:focus-visible{outline:2px solid var(--rust);outline-offset:2px}
```
Add tabindex to clickable .c spans? They're spans with click via delegation — add tabindex="0" role="button" and keydown Enter/Space handler globally for [data-ask]. Do:
```
document.addEventListener("keydown",e=>{ if(e.key!=="Enter"&&e.key!==" ")return; const t=e.target.closest&&e.target.closest("[data-ask]"); if(t&&t.tagName!=="BUTTON"&&t.tagName!=="A"){e.preventDefault();t.click();} });
```
And in builders add tabindex="0" role="button" on clickable spans.

Tip behavior on focus too? skip; title fallback... we removed title for data-tip? For clickable bk rows we set data-tip; also add title attr = plain text? Redundant; skip title, add focus handler: focusin → show tip near element. Implement: document focusin on [data-tip] → showTip(el). mouseout/focusout hide. OK cheap.

Tip show:
```
function showTipFor(el){ const t=el.getAttribute("data-tip"); if(!t)return; const tip=$("tip"); tip.innerHTML=t; tip.style.display="block"; const r=el.getBoundingClientRect(); let x=r.right+10; if(x+tip.offsetWidth>innerWidth-8)x=Math.max(8,r.left-tip.offsetWidth-10); tip.style.left=x+"px"; tip.style.top=Math.min(innerHeight-tip.offsetHeight-8, Math.max(8,r.top))+"px"; }
document.addEventListener("mouseover",e=>{const el=e.target.closest&&e.target.closest("[data-tip]"); if(el)showTipFor(el); else hideTipMaybe(e)});
```
Hiding: mouseout from [data-tip] → hide (with small check moving into tip? tip has no pointer events needed; just hide).
```
document.addEventListener("mouseout",e=>{const el=e.target.closest&&e.target.closest("[data-tip]"); if(el)$("tip").style.display="none";});
document.addEventListener("focusin",e=>{const el=e.target.closest&&e.target.closest("[data-tip]"); if(el)showTipFor(el);});
document.addEventListener("focusout",e=>{if(e.target.closest&&e.target.closest("[data-tip]"))$("tip").style.display="none";});
```
Tip content includes <b>title</b> and lines: build via codeTip returning HTML (escaped parts). codeTip returns HTML string with esc applied to components.

data-tip attribute built with esc(html). Since attribute value is HTML string, esc for attribute then browser decodes → innerHTML. Careful: double-escaping — data-tip="${esc(html)}" where html contains &lt; etc → attribute contains &amp;lt; → decoded back to &lt; → innerHTML renders as text "<"? No: if html string is `FAA wording: <b>x</b>`... I want tip to render bold. Build html with pieces already escaped for content, tags raw. Then attribute-set via esc → stored as &lt;b&gt; decoded to <b> when read via getAttribute? getAttribute returns the decoded value: reading data-tip gives `FAA wording: <b>x</b>` — yes because esc converted < to &lt; in the HTML source; parser decodes attribute to original string. Then innerHTML=t renders bold. ✓. And content pieces were esc'd individually so user text safe. ✓.

Simplify codeTip:
```
function codeTip(table,code,label){
  const e=(CODEZ[table]||{})[String(code||"").trim().toUpperCase()];
  const bits=[];
  const lab=(e&&(e.label||e.faa))||label||code;
  bits.push("<b>"+esc(lab)+"</b>");
  if(e&&e.faa&&e.faa.toUpperCase()!==String(e.label||"").toUpperCase()&&e.faa!==lab) bits.push("FAA wording: "+esc(e.faa));
  if(e&&e.note) bits.push(esc(e.note));
  return bits.join("<br>");
}
```
If no entry → return "" (no tip). For undecoded: pass explicit tip text.

Zone tip when decoded: codeTip("part_location", code). part_location codes keys "ZONE 100" uppercase — row.code from PartLocation e.g. "ZONE 200" ok; uppercase trim.

Nature codes: row.code like "X" ✓.

Stage: "IN" ✓. discovered: "E" ✓.

Now the barsHTML:

```
function barsHTML(rows,mx,opt){
  opt=opt||{};
  return '<div class="bars">'+rows.map(r=>{
    const click=opt.click?` tabindex="0" role="button" data-ask="${esc(opt.click(r))}"`:"";
    const tip=opt.tip?(opt.tip(r)||""):"";
    const codeTag=(r.code&&r.code!==r.label&&!opt.plain)?` <code class="cd">${esc(r.code)}</code>`:"";
    const undec=r.undecoded?` <span class="muted">as filed</span>`:"";
    const w=Math.max(1.5,r.n/mx*100).toFixed(2);
    return `<div class="brow"><span class="bk${opt.click?" c":""}"${click}${tip?` data-tip="${esc(tip)}"`:""}>${esc(r.label)}${codeTag}${undec}</span><span class="bt"><i class="bb" style="width:${w}%"></i></span><b class="bn">${num(r.n)}</b></div>`;
  }).join("")+"</div>";
}
```
Hmm when click, .bk gets class c (clickable style) — combine.

Wait `data-ask` with tabindex on the span — role button. And click delegation handles.

For WHO operator rows label building (name+code) — pass rows with label=name and code; but if name unknown label=code and code===label → no code tag; add undec style? Show `<span class="muted">code as filed</span>`? Use tip instead. I'll set undecoded true when name missing and adjust barsHTML undec text to opt.undecText||"as filed" → for operators: "name not on the lists carried here". Hmm the inline "as filed" for operator is confusing (it IS the code). For operators: label=code, no extra text; tip explains missing name. So set r.undecoded=false and rely on tip. OK pass undecoded:false.

For zone rows: undecoded flag from endpoint → "as filed" note ok.

For types: label "BOEING 7378H4", code same → no tag. plain.

Aircraft: label "N"+code, code set → codeTag would duplicate: set opt.plain or craft label with code=""? Set r.codeDisplay... simplest: for aircraft rows set label "N"+code and code:null before rendering.

Alright.

parts: label=code=part name → no tag ✓. condition same.

nature rows: code letters, label word → tag shows letter ✓ with tip faa.

stage/found_by same.

systems (ATA chapters): row.code="32", label="Landing gear" → tag "32" ✓ no tip table (ATA not in CODEZ) — fine.

Now records:

```
function recHTML(r,i){
 const miss='<span class="absent">not recorded</span>';
 const head=[];
 head.push(`<span class="rc mono">${esc(ukDate(r.date))||miss}</span>`);
 // tail
 head.push(`<span class="rc">${r.tail?`<span class="c" tabindex="0" role="button" data-ask="tail|${esc(r.tail)}">N${esc(r.tail)}</span>`:miss}</span>`);
 // operator
 let op;
 if(r.operator) op=`<span class="c" tabindex="0" role="button" data-ask="operator|${esc(r.operator_code||"")}">${esc(r.operator)}</span>${r.operator_code?` <code class="cd">${esc(r.operator_code)}</code>`:""}`;
 else if(r.operator_code) op=`<span class="c" tabindex="0" role="button" data-ask="operator|${esc(r.operator_code)}">${esc(r.operator_code)}</span> <span class="muted">name not resolved</span>`;
 else op=`<span class="absent">no operator named</span>`;
 head.push(`<span class="rc">${op}</span>`);
 // type
 const ty=(r.make||r.model)?`<span class="c" tabindex="0" role="button" data-ask="make|${esc(r.make||"")}|${esc(r.model||"")}">${esc((r.make||"")+" "+(r.model||"")).trim()}</span>`:miss;
 head.push(`<span class="rc">${ty}</span>`);
 // system
 head.push(`<span class="rc">${r.system?esc(r.system):miss}${r.system_code?` <code class="cd">${esc(r.system_code)}</code>`:""}</span>`);
 // part
 head.push(`<span class="rc">${r.part?esc(r.part):miss}${r.part_number?` <code class="cd">P/N ${esc(r.part_number)}</code>`:""}</span>`);
 // hours/cycles
 const hc=[]; if(r.hours)hc.push(esc(r.hours)+" h"); if(r.cycles)hc.push(num(+r.cycles||r.cycles)+" cyc");
 if(hc.length)head.push(`<span class="rc mono muted2">${hc.join(" · ")}</span>`);
 ...
}
```
hours may be non numeric string; display as-is.

Tags:
```
const pair=(k,v)=>`<span class="pair"><i>${k}</i>${v}</span>`;
tags=[];
tags.push(pair("found", r.discovered?tag(r.discovered):miss));
tags.push(pair("stage", r.stage?tag(r.stage):miss));
if(r.nature&&r.nature.length) tags.push(pair("what was found", r.nature.map(tag).join(" "))); else tags.push(pair("what was found",miss));
if(r.crew&&r.crew.length) tags.push(pair("crew", r.crew.map(tag).join(" "))); else tags.push(pair("crew",'<span class="absent">no action listed</span>'));
zone bit as discussed; corrosion if r.corrosion; cracks if r.cracks||r.crack_length → tag(`${r.cracks||"?"} crack(s)${r.crack_length?", longest "+r.crack_length+" in":""}`).
```
tag(s,tip?) => `<span class="tag"${tip?` data-tip="${esc(tip)}"`:""}>${esc(s)}</span>`.

Then wu, foot, glossout.

Foot:
```
const glossBtn = r.text? `<button class="ghost" data-gloss="${i}">Say this in plain English</button>` : `<button class="ghost" disabled title="No write-up text in this record">Say this in plain English</button>`;
<div class="rfoot">${glossBtn}<span class="rid">record ${esc(r.id||"")}</span></div>
<div class="glossout" id="g-${i}" hidden></div>
```

doGloss(i,btn):
```
async function doGloss(i,btn){
 const r=LAST&&LAST.records&&LAST.records[i]; if(!r)return;
 const box=$("g-"+i); if(!box)return;
 if(r._gloss){box.hidden=false;btn.style.display="none";return;}
 btn.disabled=true; const old=btn.textContent; btn.textContent="Asking the model…";
 let d=null,err=null;
 try{ const res=await fetch("/z/api/gloss",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:r.text,system:r.system,part:r.part,condition:r.condition,nature:(r.nature||[]).join("; "),stage:r.stage,discovered:r.discovered,zone_label:r.zone_label})});
   d=await res.json(); if(!res.ok&&!d)err="HTTP "+res.status; if(!res.ok)err=d&&d.error?d.error:("HTTP "+res.status);
 }catch(e){err=String(e&&e.message||e)}
 r._gloss={d:d,err:err};
 btn.disabled=false; btn.textContent=old;
 paintGloss(i,btn);
}
function paintGloss(i,btn){
 const r=LAST.records[i], box=$("g-"+i), g=r._gloss;
 box.hidden=false; if(btn)btn.style.display="none";
 if(g.err){box.innerHTML=`<div class="glab">Plain English — not available</div><div class="gtxt muted">The service did not answer (${esc(g.err)}). The mechanic's words above stand on their own.</div>`;return}
 const d=g.d||{};
 if(d.abstained||!d.plain){
   box.innerHTML=`<div class="glab">Plain English — declined</div><div class="gtxt muted">${d.reason?esc(d.reason):"The write-up is too abbreviated to restate without adding something."}</div><div class="gnote">Declining is the honest answer here: the model is told to abstain rather than guess.</div>`;
 } else {
   box.innerHTML=`<div class="glab">In plain English</div><div class="gtxt">${esc(d.plain)}</div><div class="gnote">Written by ${esc(d.model||"a model")} from the decoded fields and the words above. It adds nothing — and it can still be wrong. The verbatim text is the record; read the two against each other.</div>`;
 }
}
```
Note: gloss endpoint returns error 400 for no text; we disable button then. 502 with {error} json → res.ok false, d.error set → err path. Fine.

Summary:

```
async function loadSummary(btn){
 const t=tailParam(); const box=$("sumout"); if(!box)return;
 if(SUMC){box.innerHTML=SUMC;return}
 btn&&(btn.disabled=true,btn.textContent="Checking the arithmetic…");
 let html;
 try{
  const res=await fetch("/z/api/summary/"+encodeURIComponent(t));
  if(!res.ok){ let msg="HTTP "+res.status; try{const j=await res.json(); if(j&&j.error)msg=j.error}catch(e){}
    html=`<div class="card sumbox"><div class="glab">Verified summary — withheld</div><div class="gtxt">The verifier disagreed with the arithmetic, so no summary was rendered. That is the catch working: nothing is shown rather than something wrong. <span class="muted">(${esc(msg)})</span></div></div>`;}
  else{ const d=await res.json();
    if(d.found===0){html=`<div class="card sumbox"><div class="gtxt muted">Nothing to summarise.</div></div>`;}
    else html=`<div class="card sumbox"><div class="glab">Verified summary — no model wrote any of this</div><p class="sumtext">${boldDigits(d.summary||"")}</p><p class="gnote">${esc(d.note||"")}</p></div>`;}
 }catch(e){html=`<div class="card sumbox"><div class="gtxt muted">The desk did not answer.</div></div>`}
 SUMC=html; box.innerHTML=html; btn&&(btn.disabled=false,btn.textContent="Show the verified summary",btn.style.display= html.includes("sumtext")?"none":"");
}
```
Hmm keep button visible? After success hide button (content shown). Simpler: after render, hide the button if successful. Implement with flag.

Actually simpler: replace button row: put sumout after; on success hide btn via btn.style.display="none". Only when success. Adjust code accordingly.

Repeats:

```
async function loadRepeats(){
 const box=$("repout"); if(!box)return;
 const t=tailParam();
 let html;
 try{
  const res=await fetch("/z/api/repeats/"+encodeURIComponent(t));
  const d=await res.json();
  if(!res.ok) html=`<p class="muted">The desk did not answer (${esc(String(res.status))}).</p>`;
  else{
    const gs=d.groups||[];
    html=(d.note?`<p class="muted">${esc(d.note)}</p>`:"")+
     (gs.length?gs.map(g=>`<div class="rg"><b>${esc(g.system||"system not recorded")}</b>${g.part?" — "+esc(g.part):""}: written up <b>${num(g.times)}</b> time${g.times===1?"":"s"}, ${esc(ukDate(g.first)||g.first||"")} to ${esc(ukDate(g.last)||g.last||"")}.${g.hours_between!=null?` About <b>${num(g.hours_between)}</b> flying hours between the first and the last.`:` <span class="muted">Flying hours not recorded on both reports.</span>`}<div class="rids">records: ${esc((g.ids||[]).join(", "))}</div></div>`).join("")
      :`<p class="muted">No system-and-part pair appears more than once in the newest 500 reports on this airframe.</p>`);
  }
 }catch(e){html=`<p class="muted">The desk did not answer.</p>`}
 box.innerHTML=html;
}
```
ukDate on ISO "YYYY-MM-DD"? repeats first/last come from record dates (MM/DD/YYYY) → ukDate handles; fallback raw.

tailParam():
```
function tailParam(){ let v=(LASTQ&&LASTQ.kind==="tail"?LASTQ.v:""); return v.toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/^N/,""); }
```
Endpoint also strips non-alnum + N. Match.

Ask bar construction (static HTML):

```
<div class="card ask">
 <div class="picker" role="tablist" aria-label="What kind of thing">
   <button type="button" class="on" data-k="tail">TAIL</button>
   <button type="button" data-k="operator">AIRLINE</button>
   <button type="button" data-k="make">AIRCRAFT TYPE</button>
 </div>
 <input id="v" autocomplete="off" placeholder="Tail number, e.g. N583UP" aria-label="The thing to ask about">
 <input id="vm" autocomplete="off" placeholder="Model, e.g. 7378H4" aria-label="Model, optional" hidden>
 <button class="primary" id="askBtn">Ask</button>
</div>
<p class="hint" id="khint">…</p>
```
khint text per kind (dynamic). Static container under card.

Kind switching:
```
const KHINT={tail:"The registration, with or without the leading N — e.g. N583UP or 583UP.",
 operator:"The FAA's four-letter designator — UAL, not “United”. The lookup desk at / lists every code with its name beside it.",
 make:"The make as filed — BOEING, AIRBUS — and, optionally, the model exactly as filed: 7378H4, never 737-800. Leave the model empty for the whole make."};
document.querySelectorAll(".picker [data-k]").forEach(b=>b.onclick=()=>setKindUI(b.dataset.k));
function setKindUI(k){KINDUI=k;
 document.querySelectorAll(".picker [data-k]").forEach(x=>x.classList.toggle("on",x.dataset.k===k));
 $("vm").hidden=k!=="make";
 $("v").placeholder=k==="tail"?"Tail number, e.g. N583UP":k==="operator"?"Four-letter operator code, e.g. UAL":"Make as filed, e.g. BOEING";
 $("khint").textContent=KHINT[k];
}
```

askBtn click: v=$("v").value.trim(); if(!v){flash hint "Type something first." return} md=KINDUI==="make"?$("vm").value.trim():""; ask(KINDUI,v,md).

Enter keys on v and vm.

Boot: setKindUI(initial from URL or 'tail').

Also on boot fetch codes + health parallel; codes needed before render of tallies tips (render happens on ask; if codes not yet loaded, tips missing → fetch codes first then proceed; make boot await codes before ask, or lazy: if CODEZ empty at render time, tips absent — acceptable but better await. boot async: await codes; then ask if param.

Landing render if no v.

I think we're ready to write. Also include small print: "How this page differs from the lookup desk at /" one-liner in landing.

One more style: `.mono{font-family:'IBM Plex Mono',monospace}` `.cd{font:10.5px mono;color:var(--ash);background:#f1eee7;padding:1px 4px;border-radius:3px}`.

.rtags .pair i width fixed? inline fine.

Record separators: .record + .record margin.

Also .rc{white-space:nowrap} maybe for head items; but part/system can be long — allow wrap: use flex-wrap with row gap. Keep .rc{min-width:0}.

Let me now also double check forced none width: include none in mx — yes all includes none.

Also "WHAT IT FORCED" sampled scope: endpoint computes from rows (sample) — the scopeSampleText covers.

For WHAT blocks slede for nature: "A report can name up to three of these." for found_by complete: scope covers. parts: "As the mechanic named them, from the FAA's fixed part-name list." (parent says part names come from fixed list of 2,033 — that's parent's claim; fine to say "a fixed FAA list").

WHO aircraft note: "Individual airframes from the sample read." scope shows sampled. Also aircraft rows: counted=len(rows).

Everything ok. Now write the final file. Length will be substantial but fine.

Also we must not use any external libs. Fonts via Google — same as parent (allowed since parent uses them).

Let me write the code with care for correctness (no syntax errors). I'll mentally lint template literals.

Special care: inside template literals, nested backticks not allowed — use concatenation where needed. I'll keep one level only.

Also `boldDigits` regex on strings containing "&" fine.

Edge: monthName for peak.month etc.

Write CSS full list:

- root vars, body, header, wrap, credit
- card, buttons, inputs, picker, hint, starter
- stamp, title, figline, reading, cannot card
- section.five, slab, sq, slede, sub4, fnote
- scope full/sample
- bars/brow/bt/bb/bn/bmore
- mchart/mscroll/mrow/mo/maxi/maim
- forced f5 card + fsent
- record set
- tag, cd, absent, pair
- glossout/glab/gtxt/gnote
- sumbox/sumtext
- details rep, rg, rids
- tip
- landing fivelist
- responsive
- focus-visible
- bar row for actions

Let me write out.

Also: the user asked "Output the file and nothing else." So final answer = just the HTML file, no commentary. Format: code block? "Output the file" — a code block is appropriate for readability in chat. The instruction says output the file and nothing else — I'll give the raw file in a single code block without extra prose. Hmm "nothing else" — maybe raw without fences? In this interface, a fenced code block is the standard way to deliver a file; adding fences isn't "commentary". I'll use one fenced block with the complete file. Actually to be safest with "Output the file and nothing else": provide ONLY the code block, no preamble.

Let me write the JS in full now, carefully.

```js
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>(s==null?"":String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
```
Wait typo risk: map access `[c]` after object. Write properly:
```js
const esc=s=>(s==null?"":String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
```

```js
const num=n=>(n==null||n===""||isNaN(Number(n)))?(n==null?"":String(n)):Number(n).toLocaleString("en");
```
Careful: cycles strings numeric strings ok.

Dates:
```js
const MON3=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONF=["","January","February","March","April","May","June","July","August","September","October","November","December"];
function ukDate(us){const p=String(us||"").split("/");return p.length===3?`${+p[1]} ${MON3[+p[0]]||"?"} ${p[2]}`:String(us||"");}
function monthName(m){const a=String(m||"").split("-");const i=+a[1];return `${(MON3[i]||m)} ${a[0]}`;}
const boldDigits=s=>esc(s).replace(/\d[\d,]*/g,x=>`<b>${x}</b>`);
```

Globals:
```js
let CODEZ={},KINDUI="tail",LAST=null,LASTQ=null,SUMC=null,REPLOADED=false,PEAKLINE="";
```

codes load:
```js
async function loadCodes(){try{const r=await fetch("/z/api/codes");CODEZ=await r.json();}catch(e){CODEZ={}}}
```

health:
```js
fetch("/z/api/health").then(r=>r.json()).then(h=>{if(h&&h.corpus!=null&&$("hsub"))$("hsub").innerHTML=` The file holds <b>${num(h.corpus)}</b> reports.`}).catch(()=>{});
```

tip:
```js
function showTipFor(el){const t=el.getAttribute("data-tip");if(!t)return;const tip=$("tip");tip.innerHTML=t;tip.style.display="block";const r=el.getBoundingClientRect();let x=r.right+10;const w=tip.offsetWidth||320;if(x+w>window.innerWidth-8)x=Math.max(8,r.left-w-10);tip.style.left=x+"px";tip.style.top=Math.max(8,Math.min(r.top,window.innerHeight-(tip.offsetHeight||80)-8))+"px";}
document.addEventListener("mouseover",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(el)showTipFor(el);else if(!e.target.closest||!e.target.closest("#tip"))$("tip").style.display="none";});
```
Hmm this hides whenever hovering anything without data-tip — including when moving within tip. If pointer over #tip keep. Condition above: if not el and not over tip → hide. ok.

```js
document.addEventListener("mouseout",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(el)$("tip").style.display="none";});
document.addEventListener("focusin",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(el)showTipFor(el);});
document.addEventListener("focusout",e=>{if(e.target.closest&&e.target.closest("[data-tip]"))$("tip").style.display="none";});
```

codeTip:
```js
function codeTip(table,code,label){
 const e=(CODEZ[table]||{})[String(code||"").trim().toUpperCase()];
 const bits=[];
 const lab=(e&&(e.label||e.faa))||label||code||"";
 bits.push("<b>"+esc(lab)+"</b>");
 if(e&&e.faa&&String(e.faa).toUpperCase()!==String(e.label||"").toUpperCase()&&e.faa!==lab)bits.push("FAA wording: "+esc(e.faa));
 if(e&&e.note)bits.push(esc(e.note));
 return bits.join("<br>");
}
```

scope:
```js
function scopeHTML(t){
 if(!t||t.counted==null)return "";
 return t.complete
  ?`<div class="scope full">Counted over every report in the selection that records this field — ${num(t.counted)}.</div>`
  :`<div class="scope sample">Counted only over the newest ${num(t.counted)} reports read, of ${LAST?num(LAST.total):"?"} in the selection. The rest were not read for this figure.</div>`;
}
function sampleText(d){return `Counted over the newest ${num(d.analysed)} reports read, of ${num(d.total)} in the selection.`}
```

bars:
```js
function barsHTML(rows,mx,opt){
 opt=opt||{};
 return '<div class="bars">'+rows.map(r=>{
  const clickable=!!opt.click;
  const attrs=(clickable?` tabindex="0" role="button" data-ask="${esc(opt.click(r))}"`:"")+
              (r._tip?` data-tip="${esc(r._tip)}"`:"");
  const codeTag=(!opt.plain&&r.code&&r.code!==r.label)?` <code class="cd">${esc(r.code)}</code>`:"";
  const undec=r.undecoded?` <span class="muted">as filed</span>`:"";
  const w=Math.max(1.5,(r.n/(mx||1))*100).toFixed(2);
  return `<div class="brow"><span class="bk${clickable?" c":""}"${attrs}>${esc(r.label)}${codeTag}${undec}</span><span class="bt"><i class="bb${r.none?" noneb":""}" style="width:${w}%"></i></span><b class="bn">${num(r.n)}</b></div>`;
 }).join("")+"</div>";
}
```
Set r._tip before calling.

tally block:
```js
function tallyBlock(h4,t,opt){
 opt=opt||{};
 const rows=(t&&t.rows)||[];
 if(!rows.length)return `<h4 class="sub4">${h4}</h4><p class="muted">${opt.none||"Nothing recorded on the reports read."}</p>`;
 const cap=opt.cap||10;
 const shown=rows.slice(0,cap);
 const mx=Math.max(1,...shown.map(r=>r.n));
 let b=`<h4 class="sub4">${h4}</h4>`+scopeHTML(t)+barsHTML(shown,mx,opt);
 if(rows.length>shown.length){
   const rest=rows.slice(cap);
   const rn=rest.reduce((s,r)=>s+(r.n||0),0);
   b+=`<div class="bmore">${num(rows.length-shown.length)} more distinct values in this count, ${num(rn)} reports among them.</div>`;
 }
 return b;
}
```
mx over shown only — bars relative to shown max, fine.

section wrapper:
```js
function sec(label,question,lede,body,cls){
 return `<section class="five ${cls||""}"><div class="slab">${label}</div><h3 class="sq">${question}</h3>${lede?`<p class="slede">${lede}</p>`:""}${body}</section>`;
}
```

WHEN:
```js
function whenBody(d){
 const ms=(d.when&&d.when.months)||[];
 if(!ms.length)return `<p class="muted">No dated reports.</p>`;
 const max=Math.max(1,...ms.map(m=>m.n));
 const pk=d.when&&d.when.peak;
 PEAKLINE=pk?`Busiest: ${monthName(pk.month)}, ${num(pk.n)} reports.`:"";
 const wide=ms.length>90;
 const bars=ms.map(m=>`<span class="mo${pk&&m.month===pk.month?" pk":""}" tabindex="0" data-aim="${esc(monthName(m.month))} · ${num(m.n)} reports" title="${esc(monthName(m.month))}: ${num(m.n)}"><i style="height:${Math.max(2,(m.n/max)*92).toFixed(1)}px"></i></span>`).join("");
 const axis=ms.map(m=>`<span>${m.month.slice(5)==="01"?esc(m.month.slice(0,4)):""}</span>`).join("");
 return `<div class="mchart"><div class="mscroll"${wide?` style="min-width:${ms.length*7}px"`:""}><div class="mrow">${bars}</div><div class="maxi">${axis}</div></div></div><div class="maim" id="maim">${esc(PEAKLINE)}</div><p class="fnote">Months count dated reports only${wide?`, and ${num(ms.length)} months will not fit, so the strip scrolls sideways`:""}. The newest months are still filling up — reports reach the FAA days to months after the event — so a dip at the right can be the post arriving late rather than fewer faults.</p>`;
}
```
mo mouseover delegation sets maim text; mouseleave on .mchart restore PEAKLINE:
```js
document.addEventListener("mouseover",e=>{const m=e.target.closest&&e.target.closest(".mo");if(m){const a=$("maim");if(a)a.textContent=m.dataset.aim||"";}});
document.addEventListener("mouseout",e=>{const m=e.target.closest&&e.target.closest(".mo");if(m){const a=$("maim");if(a&&typeof PEAKLINE==="string")a.textContent=PEAKLINE;}});
```
Note: this global mouseover also interacts with data-tip handler; separate listeners fine. But careful: the data-tip mouseover hides tip when hovering .mo (no data-tip) — fine.

Also mo focus → set maim: add focusin handler for .mo similarly. Reuse focusin: check .mo.

WHERE:
```js
function whereBody(d){
 const w=d.where||{};
 let b="";
 b+=`<div class="tgrp">`+tallyBlock("Zones and places",w.zones,{cap:12,none:"No location recorded on the reports read.",
   tip:r=>r.undecoded?"Not one of the FAA's zone codes — the mechanic's own words for a place, shown exactly as filed.":codeTip("part_location",r.code,r.label)})+`</div>`;
 if(w.no_zone)b+=`<p class="fnote">In ${num(w.no_zone)} of the ${num(d.analysed)} read, no location is recorded at all.</p>`;
 b+=`<div class="tgrp">`+tallyBlock("Systems, as ATA chapters",w.systems,{cap:12,none:"No system code recorded."})+`</div>`;
 return b;
}
```

WHO:
```js
function whoBody(d){
 const who=d.who||{};
 const opN={};((d.records)||[]).forEach(r=>{if(r.operator_code)opN[r.operator_code]=opN[r.operator_code]||r.operator||null;});
 let b="";
 const ops=((who.operators&&who.operators.rows)||[]).slice(0,10).map(r=>{
   const nm=opN[r.code]||null;
   return {code:r.code,label:nm||r.code,n:r.n,_tip:nm?"Name from the FAA's 2006 cross-reference. Carriers merge and rename; check before publishing.":"This designator resolves to no name in the lists carried here. The reports are real; the name is missing."};
 });
 b+=`<div class="tgrp">`+tallyBlock("Airlines filing these reports",who.operators?Object.assign({},who.operators,{rows:ops}):who.operators,{cap:10,none:"No operator recorded.",click:r=>`operator|${r.code}`})+`</div>`;
```
Hmm careful: scopeHTML(t) uses t.complete & counted — the object spread keeps those. ✓. But tallyBlock receives rows replaced (top10 only) so bmore lost — fine (already capped 10; breakdown gave up to 40; we cut to 10 without note). Adjust: map only after slicing inside? Let me restructure: pass rows through but slice in ops creation to 10 and keep note manually. Simpler: build custom:

```
 const orowsAll=((who.operators&&who.operators.rows)||[]);
 const orows=orowsAll.slice(0,10).map(...);
 const ot={complete:who.operators&&who.operators.complete,counted:who.operators&&who.operators.counted,rows:orows};
 b+=`<div class="tgrp">`+tallyBlock("Airlines filing these reports",ot,{click:r=>`operator|${r.code}`})+`</div>`;
```
Good; bmore then uses orows length only (10) so no bmore — fine.

Aircraft:
```
 const ac=((who.aircraft&&who.aircraft.rows)||[]).slice(0,10).map(r=>({code:r.code,label:"N"+r.code,n:r.n}));
 const at={complete:false,counted:who.aircraft&&who.aircraft.counted,rows:ac};
 b+=`<div class="tgrp">`+tallyBlock("Individual airframes, most written-up first",at,{plain:true,none:"No tail numbers on the reports read.",click:r=>`tail|${r.code}`})+`</div>`;
```
Wait scope: aircraft always sampled (from rows) — counted=len(rows). Set complete:false explicitly ✓.

Types:
```
 const ty=((who.types&&who.types.rows)||[]).slice(0,10).map(r=>({code:r.code,label:r.code,n:r.n}));
 const tt={complete:false,counted:who.types&&who.types.counted,rows:ty};
 b+=`<div class="tgrp">`+tallyBlock("Types, as filed",tt,{plain:true,none:"No type recorded.",click:r=>{const i=r.code.indexOf(" ");return "make|"+(i<0?r.code:r.code.slice(0,i))+"|"+(i<0?"":r.code.slice(i+1));}})+`</div>`;
 return b;
```

WHAT:
```js
function whatBody(d){
 const w=d.what||{};
 let b="";
 b+=`<div class="tgrp">`+tallyBlock("What was found (nature of condition)",w.nature,{cap:10,
   none:"No nature code recorded.",tip:r=>codeTip("nature",r.code,r.label)})+`</div>`;
 b+=`<p class="fnote">A report can name up to three nature codes, so these bars can overlap.</p>`;
 b+=`<div class="tgrp">`+tallyBlock("Condition of the part",w.condition,{cap:10,plain:true,none:"No condition recorded."})+`</div>`;
 b+=`<div class="tgrp">`+tallyBlock("Parts, as the mechanics named them",w.parts,{cap:10,plain:true,none:"No part named."})+`</div>`;
 b+=`<div class="tgrp">`+tallyBlock("How it was found",w.found_by,{cap:10,none:"No discovery code.",tip:r=>codeTip("discovered",r.code,r.label)})+`</div>`;
 b+=`<div class="tgrp">`+tallyBlock("Stage of operation",w.stage,{cap:12,none:"No stage code.",tip:r=>codeTip("stage",r.code,r.label)})+`</div>`;
 return b;
}
```

FORCED:
```js
function forcedBody(d){
 const f=d.forced||{};
 const acts=(f.actions||[]).map(a=>({label:a.label,n:a.n}));
 const none=typeof f.none==="number"?f.none:null;
 const all=acts.concat(none!=null?[{label:"No listed action",n:none,none:true}]:[]);
 if(!all.length)return `<p class="muted">Nothing recorded.</p>`;
 const mx=Math.max(1,...all.map(r=>r.n));
 return `<p class="fsent">${boldDigits(f.sentence||"")}</p>`+
  '<div class="bars">'+all.map(r=>{
    const w=Math.max(1.5,(r.n/mx)*100).toFixed(2);
    return `<div class="brow"><span class="bk">${esc(r.label)}</span><span class="bt"><i class="bb${r.none?" noneb":""}" style="width:${w}%"></i></span><b class="bn">${num(r.n)}</b></div>`;
  }).join("")+"</div>"+
  `<p class="fnote">A report can carry up to four action codes, so the action bars can add to more than the number of reports; the “no listed action” row counts reports where none appears. ${esc(sampleText(d))}</p>`;
}
```

Records:
```js
function recordsBody(d){
 const rs=d.records||[];
 const scope=`<div class="scope sample">Read and decoded: the newest ${num(d.analysed)} of ${num(d.total)} in the selection. Shown here: the newest ${num(rs.length)} of those. The rest are in the CSV export for airframes.</div>`;
 if(!rs.length)return scope+`<p class="muted">No records returned.</p>`;
 const body=rs.map((r,i)=>recHTML(r,i)).join("");
 return scope+body;
}
```
Hmm "The rest are in the CSV export for airframes" only for tail; adjust text: if kind tail mention export else omit. Pass k. Fine: recordsBody(d,k).

recHTML as planned. Compose:

```js
function recHTML(r,i){
 const miss='<span class="absent">not recorded</span>';
 const head=[];
 head.push(`<span class="rc mono">${r.date?esc(ukDate(r.date)):miss}</span>`);
 head.push(`<span class="rc">${r.tail?`<span class="c" tabindex="0" role="button" data-ask="tail|${esc(r.tail)}">N${esc(r.tail)}</span>`:miss}</span>`);
 let op;
 if(r.operator)op=`<span class="c" tabindex="0" role="button" data-ask="operator|${esc(r.operator_code||"")}">${esc(r.operator)}</span>${r.operator_code?` <code class="cd">${esc(r.operator_code)}</code>`:""}`;
 else if(r.operator_code)op=`<span class="c" tabindex="0" role="button" data-ask="operator|${esc(r.operator_code)}">${esc(r.operator_code)}</span> <span class="muted">name not resolved</span>`;
 else op='<span class="absent">no operator named</span>';
 head.push(`<span class="rc">${op}</span>`);
 const tyStr=((r.make||"")+" "+(r.model||"")).trim();
 head.push(`<span class="rc">${tyStr?`<span class="c" tabindex="0" role="button" data-ask="make|${esc(r.make||"")}|${esc(r.model||"")}">${esc(tyStr)}</span>`:miss}</span>`);
 head.push(`<span class="rc">${r.system?esc(r.system):miss}${r.system_code?` <code class="cd">${esc(r.system_code)}</code>`:""}</span>`);
 head.push(`<span class="rc">${r.part?esc(r.part):miss}${r.part_number?` <code class="cd">P/N ${esc(r.part_number)}</code>`:""}</span>`);
 const hc=[];if(r.hours)hc.push(esc(r.hours)+" h");if(r.cycles)hc.push(num(r.cycles)+" cyc");
 if(hc.length)head.push(`<span class="rc mono dim">${hc.join(" · ")}</span>`);
 // tags
 const tag=(s,tip)=>`<span class="tag"${tip?` data-tip="${esc(tip)}"`:""}>${esc(s)}</span>`;
 const pair=(k,v)=>`<span class="pair"><i>${k}</i>${v}</span>`;
 const tags=[];
 tags.push(pair("what was found",(r.nature&&r.nature.length)?r.nature.map(x=>tag(x)).join(" "):'<span class="absent">no code</span>'));
 tags.push(pair("crew",(r.crew&&r.crew.length)?r.crew.map(x=>tag(x)).join(" "):'<span class="absent">no action listed</span>'));
 tags.push(pair("stage",r.stage?tag(r.stage):'<span class="absent">no code</span>'));
 tags.push(pair("found by",r.discovered?tag(r.discovered):'<span class="absent">no code</span>'));
 let zb;
 if(r.zone_label&&r.zone&&r.zone_label!==r.zone)zb=tag(r.zone_label)+` <code class="cd">${esc(r.zone)}</code>`;
 else if(r.zone)zb=tag(r.zone)+(r.zone_label?"":' <span class="muted">as filed</span>');
 else zb='<span class="absent">no location</span>';
 tags.push(pair("where",zb));
 if(r.corrosion)tags.push(pair("corrosion",tag(r.corrosion)));
 if(r.cracks||r.crack_length)tags.push(pair("cracks",tag(`${r.cracks||"?"} crack${r.cracks==="1"?"":"s"}${r.crack_length?", longest "+r.crack_length+" in":""}`)));
 const glossBtn=r.text?`<button class="ghost" data-gloss="${i}">Say this in plain English</button>`
   :`<button class="ghost" disabled title="No write-up text in this record">Say this in plain English</button>`;
 return `<article class="record"><div class="rhead">${head.join("")}</div>
 <div class="rtags">${tags.join("")}</div>
 <div class="wu"><div class="txt">${r.text?esc(r.text):'<span class="absent">No write-up text in the record.</span>'}</div></div>
 <div class="rfoot">${glossBtn}<span class="rid">record ${esc(r.id||"")}</span></div>
 <div class="glossout" id="g-${i}" hidden></div></article>`;
}
```

Wait data-ask for operator click when operator exists but operator_code empty: "operator|" → ask('operator','') invalid; guard: only make clickable if operator_code. Adjust: if r.operator&&r.operator_code → clickable; else if operator only → plain text; else code/absent as before.

Render:

```js
function render(d){
 const k=LASTQ.kind;
 const out=$("out");
 if(!d.total){out.innerHTML=emptyHTML(d,k);return}
 const bits=[];
 bits.push(`<div class="stamp">FAA SERVICE DIFFICULTY REPORTS · ONE THING, FIVE ANSWERS</div>`);
 bits.push(`<h1 class="title">${esc(d.title)}</h1>`);
 const w=d.when||{};
 bits.push(`<p class="figline"><b>${num(d.total)}</b> report${d.total===1?"":"s"}${w.first?`, ${esc(monthName(w.first))} to ${esc(monthName(w.last))}`:""}.${d.capped?` The newest ${num(d.analysed)} were read in full.`:""}</p>`);
 if(d.framing&&d.framing.sentence)bits.push(`<div class="reading">${boldDigits(d.framing.sentence)}</div>`);
 if(k==="tail"){const t=tailParam();
  bits.push(`<div class="bar"><button class="ghost" id="sumBtn" onclick="loadSummary(this)">Show the verified summary</button><a class="btn ghost" href="/z/api/export/${encodeURIComponent(t)}.csv">Export CSV</a><span class="muted">The export carries a citation header and one row per write-up.</span></div><div id="sumout"></div>`);}
 bits.push(`<div class="card cannot"><h3>What this page cannot show</h3><ul>${(d.cannot_show||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`);
 bits.push(sec("WHEN","When did it happen?","Month by month, over the whole span the file covers. A spike has a date; this is where to find it.",whenBody(d)));
 bits.push(sec("WHERE","Where on the aircraft?","The FAA's numbered zones where they are given, and the systems that keep coming up. Free-text locations are kept and marked, never forced into a zone.",whereBody(d)));
 bits.push(sec("WHO","Whose aircraft?","The airlines that filed, the individual airframes, and the types as filed. Click any of them to make it the thing instead.",whoBody(d)));
 bits.push(sec("WHAT","What was found?","The FAA's own codes, decoded where they appear, and the part names as written.",whatBody(d)));
 bits.push(sec("WHAT IT FORCED","What did it make the crew do?","Not what broke — what it forced. This is the question the FAA buries hardest, so it is answered on its own, not as a footnote under WHAT.",forcedBody(d),"f5"));
 bits.push(sec("THE RECORDS","The write-ups themselves","Newest first. The mechanic's words are the evidence; the decoded codes sit above them and the record id below. Click a tail, an airline or a type to follow that thread instead.",recordsBody(d,k)));
 if(k==="tail")bits.push(`<details class="card rep" id="repd"><summary>Same system, written up more than once on this airframe</summary><div id="repout"><p class="muted">Reading…</p></div></details>`);
 out.innerHTML=bits.join("");
 SUMC=null;REPLOADED=false;
}
```
Note sec signature (label,question,...) — first arg is slab label. For records slab "THE RECORDS". ok.

emptyHTML:
```js
function emptyHTML(d,k){
 let hint;
 if(k==="tail")hint="It may never have carried a United States registration, or nothing was ever filed about it. Tail numbers are filed without the leading N — try it without.";
 else if(k==="operator")hint="The designator must be the FAA's own four-letter code — UAL, not “United”. The lookup desk at / lists every code with its name beside it.";
 else hint="The make is filed as a code — BOEING, AIRBUS — and the model exactly as filed: 7378H4, never 737-800.";
 return `<div class="card"><h2 class="eq">Nothing in the file matches ${esc(d&&d.title||"that")}.</h2><p>${hint}</p><p class="muted">An empty answer here is an answer about this file, not about the world. It is not evidence that nothing happened.</p></div>`;
}
```
.eq{font:400 26px 'Instrument Serif';margin:0 0 8px}

ask:
```js
async function ask(k,v,md,push){
 if(!v)return;
 $("out").innerHTML='<div class="card"><p class="muted">Reading the file…</p></div>';
 LASTQ={kind:k,v:v,model:md||""};
 SUMC=null;REPLOADED=false;
 let d;
 try{
  const q=new URLSearchParams({kind:k,v:v});if(md)q.set("model",md);
  const r=await fetch("/z/api/entity?"+q.toString());
  if(!r.ok){let msg="HTTP "+r.status;try{const j=await r.json();if(j&&j.error)msg=j.error}catch(e){}throw new Error(msg)}
  d=await r.json();
 }catch(e){
  $("out").innerHTML=`<div class="card"><p><strong>The desk did not answer.</strong> ${esc(String(e.message||e))} Nothing is shown rather than something wrong.</p></div>`;
  return;
 }
 LAST=d;render(d);
 if(push!==false){const u=new URLSearchParams({kind:k,v:v});if(md)u.set("model",md);history.pushState(null,"","?"+u.toString());}
 window.scrollTo({top:0,behavior:"auto"});
}
```

popstate:
```js
window.addEventListener("popstate",()=>{
 const u=new URLSearchParams(location.search);
 const v=u.get("v");
 setKindUI(["tail","operator","make"].includes(u.get("kind"))?u.get("kind"):"tail");
 if(v){$("v").value=v;$("vm").value=u.get("model")||"";ask(KINDUI,v,u.get("model")||"",false);}
 else{LAST=null;LASTQ=null;renderLanding();}
});
```

renderLanding:
```js
function renderLanding(){
 $("out").innerHTML=`<div class="card land">
  <p class="big">One thing in. Five answers out.</p>
  <p class="lede2">Name a tail number, an airline or an aircraft type. The FAA's Service Difficulty Reports answer five questions about it, in the order a reporter asks them:</p>
  <div class="fivelist">
   <span class="k">WHEN</span><span>Month by month, across the whole span. A spike has a date.</span>
   <span class="k">WHERE</span><span>Where on the aircraft — the FAA's zones, and the systems that keep coming up.</span>
   <span class="k">WHO</span><span>Which airlines filed, which individual airframes, which types.</span>
   <span class="k">WHAT</span><span>What was found, in the FAA's codes and the mechanics' own words.</span>
   <span class="k">WHAT IT FORCED</span><span>What the defect made the crew do — a shutdown, a diversion, masks on. The FAA buries this hardest; here it is its own answer.</span>
  </div>
  <p class="muted">Nothing is asked yet, so nothing is shown. Take a starter or type your own.</p>
  <div class="starter">
   <button data-ask="operator|UAL">United Airlines (UAL)</button>
   <button data-ask="operator|AAL">American Airlines (AAL)</button>
   <button data-ask="make|BOEING|">Boeing, all types</button>
   <button data-ask="make|AIRBUS|">Airbus, all types</button>
  </div>
  <p class="muted">For an airframe, type the registration — with or without the N.</p>
 </div>`;
}
```

Delegation for [data-ask] clicks (buttons included — button elements fire click; the delegated handler catches; but starters are <button data-ask> — the keydown Enter on button triggers click natively; our keydown handler guards tagName BUTTON → skip; click fires anyway. ✓).

```js
document.addEventListener("click",e=>{
 const a=e.target.closest&&e.target.closest("[data-ask]");
 if(a){const parts=a.dataset.ask.split("|");ask(parts[0],parts[1]||"",parts[2]||"");return;}
 const g=e.target.closest&&e.target.closest("[data-gloss]");
 if(g){doGloss(g.dataset.gloss,g);return;}
});
```
Careful: buttons inside records like gloss have data-gloss — fine.

But [data-ask] delegation also catches clicks on elements inside .record head etc. Also the ask button (id askBtn) has its own handler; ensure it doesn't have data-ask. ✓.

Keyboard activation for spans:
```js
document.addEventListener("keydown",e=>{
 if(e.key!=="Enter"&&e.key!==" ")return;
 const t=e.target.closest&&e.target.closest('[role="button"][data-ask]');
 if(t&&t.tagName!=="BUTTON"&&t.tagName!=="A"){e.preventDefault();ask(...)}
});
```
Simpler: if(e.target===t)... e.target.closest returns the span if focus inside. Use e.target check: const t=e.target; if(t.dataset&&t.dataset.ask&&t.getAttribute("role")==="button"){...}. Do that.

Actually the generic click delegation will also fire on Enter for spans? No — spans don't fire click on Enter natively. So keydown needed:
```js
document.addEventListener("keydown",e=>{
 if(e.key!=="Enter"&&e.key!==" ")return;
 const t=e.target;
 if(t&&t.dataset&&t.dataset.ask&&t.tagName!=="BUTTON"&&t.tagName!=="A"){e.preventDefault();const p=t.dataset.ask.split("|");ask(p[0],p[1]||"",p[2]||"");}
});
```

Gloss & summary & repeats as planned.

toggle listener:
```js
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="repd"&&e.target.open&&!REPLOADED){REPLOADED=true;loadRepeats();}},true);
```

boot:
```js
(async function boot(){
 setKindUI("tail");
 loadCodes();
 // health
 fetch("/z/api/health").then(r=>r.json()).then(h=>{if(h&&h.corpus!=null){const s=$("hsub");if(s)s.innerHTML=` The file holds <b>${num(h.corpus)}</b> reports.`}}).catch(()=>{});
 const u=new URLSearchParams(location.search);
 const kind=["tail","operator","make"].includes(u.get("kind"))?u.get("kind"):"tail";
 setKindUI(kind);
 const v=u.get("v");
 if(v){$("v").value=v;if(u.get("model"))$("vm").value=u.get("model");await loadCodes();ask(kind,v,u.get("model")||"",false);}
 else{await loadCodes();renderLanding();}
})();
```
Await codes before render so tooltips ready. Also health parallel fine.

setKindUI as above; initial call before elements? Script at end of body — fine.

Ask button handlers:
```js
$("askBtn").addEventListener("click",()=>{
 const v=$("v").value.trim();
 if(!v){$("khint").textContent="Type something first — a tail, a code or a make.";$("v").focus();return}
 const md=KINDUI==="make"?$("vm").value.trim():"";
 ask(KINDUI,v,md);
});
[["v"],["vm"]].forEach(([id])=>{$(id).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("askBtn").click();}})});
```

setKindUI writes KHINT text; the "Type something first" overwrites until next kind switch — acceptable; or store current hint and restore on input. Minor.

Now CSS write-out (final). I'll be thorough but compact.

Also style .bar (button rows) and .btn ghost.

.link in header sub.

Footer credit:
```html
<p class="credit">The same public corpus as the <a href="/">SDR Desk lookup</a>, read through a different lens. Codes are decoded from the FAA's own lookup tables; airline names come from the FAA's 2006 cross-reference and can be stale. Inspired by Rory Kennedy's <a href="https://en.wikipedia.org/wiki/Downfall:_The_Case_Against_Boeing" target="_blank" rel="noopener">Downfall: The Case Against Boeing</a>. Built by Henk van Ess © 2026.</p>
```

One more: "Say this in plain English" — keep exact label ✓.

Also make sure page works if entity returns records without some fields — all guarded.

Double-check the summary onclick inline: `onclick="loadSummary(this)"` — loadSummary defined globally ✓ (function declarations at top level of script).

doGloss uses LAST.records[i] — index from data-gloss. After re-render (new ask), indexes refresh; SUMC reset ✓.

Potential issue: `recordsBody(d,k)` — I referenced k param; implement with optional export note:

```js
function recordsBody(d,k){
 ...
 const scope=`<div class="scope sample">Read and decoded: the newest ${num(d.analysed)} of ${num(d.total)} in the selection; shown here, the newest ${num(rs.length)} of those.${k==="tail"?" The CSV export carries every report on this airframe with a citation header.":""}</div>`;
```

Also note in records lede: gloss explanation: add one line in the section lede: "“Say this in plain English” asks a model to restate one record from its decoded fields; it is told to abstain rather than guess, and the verbatim text stays the evidence." Good — house-style transparency about the one generated thing.

Forced section class f5 to style card-like:
```css
section.f5{background:var(--card);border:1px solid var(--line);border-top:3px solid var(--rust);border-radius:4px;padding:14px 16px;margin-top:26px}
```
five default has margin-top & border-top line; f5 overrides border-top. Since .five sets border-top:2px solid var(--line); .f5 later overrides border-top and adds padding/background.

Also .five{padding-top:10px}.

Right — the slabs: parent's stamp uses Archivo 10.5px letterspacing .18em. Use for .slab.

Also h3.sq serif 24px.

Let me finalize CSS text. Also add selection color? skip.

Ensure `#tip` z-index high, pointer-events none? If pointer-events auto and user moves onto it, mouseover keeps (we handle over #tip keep). Fine.

Also `.dim{color:var(--ash)}`.

Let me also handle window resize for tip? skip.

Now write everything out. Watch out: in HTML attributes I use double quotes; inside template literals with `${}` producing attributes containing double quotes from esc() — esc converts " to &quot; so safe.

data-ask="make|BOEING|7378H4" — split("|") gives ["make","BOEING","7378H4"] ✓. Empty model: "make|BOEING|" → parts[2]="" → md="" → falsy → not set ✓.

For types click builder returns "make|X|Y" ✓.

Aircraft click "tail|code" where code is raw tail (no N) ✓ backend strips anyway.

Operator click "operator|CODE" ✓.

Also in whoBody, for kind=operator the operators block click re-asks same — fine.

One more nuance: tallyBlock scopeHTML(t) for zones — zones counted = len(rows)=analysed ✓ (sampled) message ok.

Edge: who.operators may be null if breakdown failed → full() returns None → sampled fallback via tally → complete false ✓. My code: `who.operators&&who.operators.rows` guards; if who.operators null → orowsAll [] → ot rows [] → tallyBlock shows none message but scopeHTML(ot) with counted null → "" ✓ (scopeHTML returns "" if counted==null). But ot={complete:undefined,counted:undefined,rows:[]} → scope "" ✓, none message ✓.

Similarly where/what guards via (x&&x.rows)||[].

whenBody months null guard ✓.

Also d.what might be undefined? endpoint always returns; guard anyway: `const w=d.what||{}` ✓.

Now, finally, ensure the inline onclick loadSummary(this) works with button disabled pattern. Implement:

```js
async function loadSummary(btn){
 const box=$("sumout");if(!box||!LASTQ||LASTQ.kind!=="tail")return;
 const t=tailParam();
 btn&&(btn.disabled=true);
 const old=btn?btn.textContent:"";
 if(btn)btn.textContent="Recounting…";
 let html;
 try{
  const res=await fetch("/z/api/summary/"+encodeURIComponent(t));
  if(!res.ok){let msg="HTTP "+res.status;try{const j=await res.json();if(j&&j.error)msg=j.error}catch(e){}
   html=`<div class="card sumbox"><div class="glab">Verified summary — withheld</div><p class="gtxt">The verifier disagreed with the arithmetic, so no summary was rendered. That is the catch working: nothing is shown rather than something wrong. <span class="muted">(${esc(msg)})</span></p></div>`;}
  else{const d=await res.json();
   if(d.found===0)html=`<div class="card sumbox"><p class="gtxt muted">Nothing to summarise.</p></div>`;
   else html=`<div class="card sumbox"><div class="glab">Verified summary — no model wrote any of it</div><p class="sumtext">${boldDigits(d.summary||"")}</p><p class="gnote">${esc(d.note||"")}</p></div>`;}
 }catch(e){html=`<div class="card sumbox"><p class="gtxt muted">The desk did not answer.</p></div>`}
 box.innerHTML=html;
 if(btn){btn.disabled=false;btn.textContent=old;
   if(html.indexOf("sumtext")>=0)btn.style.display="none";}
}
```

Repeats loader as planned.

tailParam:
```js
function tailParam(){const v=LASTQ&&LASTQ.kind==="tail"?LASTQ.v:"";return String(v).toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/^N/,"");}
```

OK. Also `.glab` style:
```css
.glab{font:600 10px Archivo,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--ash);margin-bottom:4px}
```
glossout.glAb maybe rust-text for generated? Keep ash; the dashed border signals generated.

.sumbox .sumtext{font:400 20px/1.4 'Instrument Serif',Georgia,serif;margin:2px 0 6px}
.sumtext b, .fsent b, .reading b {font:500 .9em mono;color:var(--rust-text)}

Write .fsent: `font:400 21px/1.4 'Instrument Serif',Georgia,serif;max-width:46em;margin:4px 0 12px`.

Also `.noneb` background hatch:
```css
.bb.noneb{background:repeating-linear-gradient(45deg,#cfc8ba 0 4px,#efece4 4px 8px)}
```

Landing big: `.big{font:400 32px/1.1 'Instrument Serif',Georgia,serif;margin:0 0 10px}`.

fivelist k color rust-text, Archivo 10.5px ls .12em.

hint: `.hint{font-size:12.5px;color:var(--smoke);margin:6px 2px 0;max-width:900px}`.

Starter buttons ghost small: reuse .ghost.

Media queries minimal.

I think ready. Also add `lang="en"`.

Also: title tag "One thing, five answers — SDR Desk /z".

Also noscript? skip.

Let me also double check the toggle event fires for details in capture (toggle doesn't bubble; capture needed) ✓ used capture true.

Potential conflict: document-level mouseover for .mo sets maim even when maim belongs to old render — fine.

Edge: When landing shown, #out replaced; PEAKLINE stale — maim absent, no harm.

Also `sec()` — records section lede includes quotes with typographic quotes; fine.

One thing: entity endpoint for kind=make passes make=val.upper(); if user typed "boeing" fine.

Also v for operator: endpoint uppercases ✓.

Write final HTML now. Also include meta description? skip.

Check that I don't reference parent endpoints. Only /z/api/* and href="/" link (navigation, fine).

Length check — it'll be ~700-800 lines. Fine.

Also last styling detail: `code.cd` inline; `code` default styling reset.

Write it.