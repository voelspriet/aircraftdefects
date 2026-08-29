Let me work through this carefully.

The brief: I'm building the third part of a public desk over FAA Service Difficulty Reports. The first part was the "instrument" (hero, filters, AIM AT box, selection machinery). The second brief is building the search half (p-search: record table, record rows, case sheet, etc.). I'm building the remaining **fifteen panels**, the **tab strip** with **three named groups**, and the **scope lines**.

Key things from the spec:

**The sixteen tabs, verbatim labels, in order:**

GROUP "Narrows to what you selected"
- p-search — "Search"
- p-patterns — "Patterns" — api/trend, api/breakdown?by=ata|operator|model|part|nature|crew|discovered, api/phrases
- p-aircraft — "Aircraft" — api/aircraft/<tail> (WHOLE CORPUS) + api/repeat-offenders (follows the filter)
- p-found — "How it was found" — api/inspection-method

GROUP "Ignore your selection"
- title: "These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel"
- p-fleet — "Fleet" — api/fleet?operator=&model=
- p-leads — "Story leads" — api/leads + api/spikes?by=ata|part|model|operator
- p-emerging — "New defects" — api/emerging?by=part|jasc|condition|partnumber&days=120|180|365
- p-clusters — "Same day, many aircraft" — api/clusters?min=3|4|6|10, kind filtered client-side
- p-defect — "Same defect" — api/same-defect
- p-structure — "Corrosion & cracks" — api/corrosion
- p-age — "Old airframes" — api/ageing?by=hours|cycles
- p-engines — "Engines" — api/engines
- p-consequences — "What the crew did" — api/consequences?by=operator|model|make

GROUP "Reference"
- p-compare — "Compare" — api/compare?field=operator|model|make&a=&b=
- p-terms — "Every code explained" — api/glossary + api/facets
- p-method — "Method" — static prose, numbers injected from api/facets

Loading is LAZY: show(id) triggers that panel's loader. p-fleet and p-compare load only on their own buttons.

**The scope line**, three forms:
- p-search and p-aircraft: BLANK (the count bar already says it)

Wait — careful. The scope line function says:

```
scopeLine(id):
  p-search and p-aircraft: BLANK (the count bar already says it)
  FOLLOWS_FILTER with n>0: `Showing <strong>your selection</strong>, ${n} reports.`
  every other panel: `This view always answers for <strong>all ${TOTAL} reports</strong>.
    It does not narrow to your current selection (${filterWords()}).`
    unfiltered: `All ${TOTAL} reports.`
```

But the earlier part says "every panel carries a scope line as its first child". Hmm — p-search's scope line is blank. p-aircraft is mixed: api/aircraft/<tail> is WHOLE CORPUS, api/repeat-offenders follows the filter. The scopeLine spec says p-aircraft is blank... but the group heading says it "narrows to what you selected". Hmm, actually the aircraft panel itself needs to state which half does what — the spec for the panel says "api/aircraft/<tail> (WHOLE CORPUS) + api/repeat-offenders (follows the filter)". So inside the aircraft panel I should label those two halves. The scope line is blank because... hmm, actually wait. Let me re-read.

"So every panel carries a scope line as its first child" — and scopeLine(id) returns blank for p-search and p-aircraft. A blank string as first child? I think I render the scope line div always (so it's consistently the first child), with empty content for those two. But for p-aircraft, since its two halves differ, I should give an in-panel note. Actually the spec explicitly says p-aircraft's scope line is BLANK. Hmm. But then the panel would be misleading: the aircraft summary answers from the whole corpus while repeat offenders follows the filter. Wait — actually if a tail is set, the aircraft panel is about that tail. The "narrows" group is because... hmm, the KNOWN DISCREPANCY note: "FOLLOWS_FILTER omits p-aircraft, but VIEW_GROUPS puts it in the 'narrows' group." Worth preserving or fixing. I'll note this in my departure explanation: I'll keep it in the narrows group but give p-aircraft a non-blank scope line? No — the spec is load-bearing: "p-search and p-aircraft: BLANK". Hmm, but the panel itself should explain the two halves. Let me think about what the "aircraft" panel is: you click a tail in the table → loadTail() → switches to p-aircraft. So the panel shows one aircraft's history from the WHOLE CORPUS (not narrowed by your other filters), plus "repeat offenders" (aircraft with many reports) which DOES follow the filter.

Given the discrepancy note is explicitly called out as "worth preserving or fixing", I'll fix it in a documented way: keep p-aircraft in the "narrows" group (matching VIEW_GROUPS) but give it a truthful scope line that says the aircraft history is whole-corpus and the repeat-offenders list follows the selection. Hmm, but scopeLine spec says blank... The spec says "Where they state a reason, reach the same end your own way." The reason for blank on p-aircraft would be "the count bar already says it" — but that's true of p-search only. Actually for p-aircraft, when you arrive via loadTail, the tail filter is set, and the panel is "about that tail". I think the honest fix: p-aircraft gets a scope line that states the split. I'll flag this as a deliberate departure. Alternatively I could keep it blank and put the split note as the panel's subheading. Either way I must explain. Let me decide: I'll make scopeLine return for p-aircraft a special two-part line: "This view answers from all reports, for the one tail you named, regardless of your other filters; the repeat offenders below follows your selection." Hmm, that's wordy. Let me keep closer to spec: BLANK for p-search (the count bar says it), but for p-aircraft render the "split" scope line since it's the one panel that genuinely does both, and the group label "narrows to what you selected" would otherwise be a lie for its main half. I'll document this.

Actually — wait. Let me reconsider. The checker: "With a zone filter set, a panel in the 'ignore' group says so in its own words and still reports the whole-corpus figure." So the ignore panels must, when a filter is set, show the scope line with filterWords(). Good.

Scope line three forms (for panels other than p-search/p-aircraft):
- FOLLOWS_FILTER panels (p-patterns, p-found) with n>0: `Showing <strong>your selection</strong>, ${n} reports.`
- Other panels with a selection: `This view always answers for <strong>all ${TOTAL} reports</strong>. It does not narrow to your current selection (${filterWords()}).`
- Unfiltered (all panels in scope): `All ${TOTAL} reports.`

Hmm — for FOLLOWS_FILTER with n===0? Probably "your selection matches no reports" — something. The spec doesn't say. I'll do: `Showing <strong>your selection</strong>, no reports.` Something sane. Actually maybe when n===0 the panels show empty states anyway. I'll render `Showing <strong>your selection</strong>, 0 reports.` with a note. Keep simple: if n>0 the exact sentence; if n===0, `Your selection matches no reports.` — I'll note it.

For p-search: blank string.

**filterWords()** — from the case sheet spec: "How you got here: ${filterWords() || 'the whole corpus, nothing filtered'}". So filterWords() returns a phrase describing the current selection, built from clauseText-like logic. The other brief builds it? Hmm — filterWords is used in the case sheet (search half) and in scopeLine (mine). The brief says "Assume the other brief provides params(), setFilter(), search(), the chips and the record table; call them, do not redefine them." filterWords is part of the case-sheet/stating-selection machinery... The "stating the selection in words" section is in the selection machinery brief (part 1? part 2?). clauseText/sentenceHTML/filterWords — those belong to the selection machinery. Hmm, but which brief owns them?

The briefs given to me: THE SIXTEEN PANELS spec, and the SELECTION MACHINERY spec is included as context ("THE SELECTION MACHINERY THE PANELS SIT INSIDE"). The instruction: "Assume the other brief provides params(), setFilter(), search(), the chips and the record table; call them, do not redefine them."

filterWords() is used in the case sheet ("How you got here") and in scopeLine. Since scopeLine is mine and filterWords is referenced by both, safest: use it if it exists, else define a local fallback. But "call them, do not redefine them" — the risk of redefining is that the other brief also defines it and there's a conflict. Within one IIFE, a later definition wins. To be safe: I'll reference filterWords() guarded: `const FW = (typeof filterWords === 'function') ? filterWords : localFallback`. Hmm, but if everything is in the same IIFE with function declarations, hoisting means their declarations exist. If I define a fallback with a different name (scopeWords) and use `typeof filterWords==='function' ? filterWords() : scopeWords()`, I avoid collision. Actually simpler: define my own `selWords()` that mirrors clauseText order, and use filterWords if present. Let me do:

```js
function selectionWords(){
  if (typeof filterWords === 'function') { try { return filterWords(); } catch(_){} }
  // local minimal fallback from CLAUSE_ORDER etc...
}
```

Hmm, but clauseText needs CODES, ATA, OPGAP etc. Building a full fallback is heavy. The other brief's "stating the selection in words" includes clauseText and sentenceHTML — those are in the machinery brief, which is the *second* brief presumably (the search half builds on the instrument). Actually reading the structure: brief 1 = the instrument/hero (built already). Brief 2 = "the search half" — params, setFilter, search, chips, record table, case sheet, and probably clauseText/sentenceHTML/filterWords (the case sheet uses filterWords). So filterWords likely exists. I'll call it with a guarded fallback that returns '' or builds from params simply. I'll write a small local fallback `plainWords()` that handles the common fields via helpers if available (code(), opName(), etc.), guarded too.

Actually, let me think about what helpers I can rely on from previous briefs. The spec text mentions many helpers: esc(), num(), prettyDate(), ukDate(), el(), code(), opName(), jargon(), cc(), etc. Those live in the shared IIFE from briefs 1–2. Since "dropping into the existing page... using the existing helpers", I can call esc, num, prettyDate, el, etc. But to be defensive in a self-contained deliverable, I should provide tiny local guards for the ones I need that might not exist? The instruction says "using the existing helpers. Say where the markup goes. Assume the other brief provides params(), setFilter(), search(), the chips and the record table; call them, do not redefine them."

So the contract: params, setFilter, search exist. Others like esc/num are "existing helpers" from brief 1 (the instrument). I'll assume: esc, num (thousands), prettyDate, el (getElementById), TOTAL, RANGE, heroData, CODES/glossary data... Hmm, risky. Let me be pragmatic: the deliverable is code that will be pasted into the real page. I'll use the named helpers and provide small internal fallbacks only where I'm inventing (e.g., fetchJSON wrapper). Let me define a tiny set of local utilities with unlikely-to-collide names? No — the brief says use existing helpers; redefining esc() would break things if signatures differ. But if they don't exist, the page breaks. Given the exercise, I'll trust: esc, num, el, params, setFilter, search, show? Wait — show(id) is MINE: "Loading is LAZY: show(id) triggers that panel's loader." Is show() part of the existing page or mine? The tab strip is mine ("The fifteen panels... their tab strip, and the three groups it is divided into"). But the second brief's search table also has a tab (p-search). The machinery says setFilter(k,v) calls show("p-search"). So show() must exist for the other brief to call... meaning show() is either already defined by brief 1 or 2, or I define it. Hmm.

"show(id) triggers that panel's loader" — this is in MY spec (the sixteen panels). The other brief's setFilter calls show("p-search"). If the other brief is built independently, it also expects show to exist. The cleanest: I define show() as the single tab-switch function; the other brief calls it. But what if the other brief also defines show? Then last-defined wins and things could double-load. In a real build you'd coordinate. For this deliverable, I'll define show() but make it idempotent/guarded: check if a global show already exists? Within an IIFE there are no globals unless attached. Hmm — "inside the same IIFE, using the existing helpers" — so everything is one IIFE scope. If brief 2's code defined `function show(id)`, my defining it again would be a redeclaration in the same scope (allowed for function declarations; later wins). The brief says "call them, do not redefine them" listing params, setFilter, search, chips, record table. show is not listed → it's mine. Good: I own show(), the tab strip, the panels.

But careful: setFilter calls show("p-search") — and my show must handle p-search (activate the tab, and NOT lazily fetch p-search — the search half handles its own loading via search()). My loader for p-search: no-op.

Also "p-fleet and p-compare load only on their own buttons" — so show(p-fleet) renders the panel shell (scope line, heading, controls) but does NOT fetch; the panel's "Load" / "Show" button triggers the fetch. Similarly p-compare needs field/a/b chosen, loading on its button.

"Switching to a tab fetches its endpoint once, and not before." So each panel has a LOADED flag; show() runs loader once. But should re-showing re-fetch? "fetches its endpoint once, and not before" — once per session on first show. Do panels refresh when filters change? FOLLOWS_FILTER panels (p-patterns, p-found) narrow to the selection — when the selection changes, they should re-fetch. The spec says "Switching to a tab fetches its endpoint once" for the checker. But logically, if the user is on p-patterns and changes a filter via a term click (setFilter → show("p-search") + search), they leave the panel anyway. When they come back to p-patterns, should it refresh? The scope line says "Showing your selection, N reports" — N changes. I think FOLLOWS_FILTER panels should re-run their loader when shown if params() changed since last load. That's the honest behavior. For "ignore" panels: no re-fetch on filter change (they ignore selection). p-aircraft: whole-corpus half doesn't refresh; repeat-offenders follows filter → re-fetch that half when params change. I'll track LOADED_FOR[id] = params string; on show, if FOLLOWS_FILTER panel and LOADED_FOR !== current params → reload. For ignore panels, load once. This satisfies "fetches once, and not before" for the plain test, and is more correct. I'll note it.

**Now the panels themselves.** The spec gives endpoints and names but the detailed content of each panel is thin — "What each panel shows" is claimed to be in the specification ("The specification names every tab label verbatim, every endpoint with its query parameters and allowed values, every heading, and what each panel shows."). The given spec is condensed; I must infer reasonable panel content consistent with names, endpoints, and the "Fifteen panels: ... each with its scope line, its heading, its controls where it has them, and its own endpoint."

Let me design each panel:

Common shell per panel:
```html
<section class="panel" id="p-patterns" hidden>
  <div class="scope"></div>   <!-- scope line, first child -->
  <h2>Patterns</h2>            <!-- panel heading -->
  <div class="pbody"></div>    <!-- controls + content -->
</section>
```

The tab strip:
```html
<nav id="views" aria-label="Views">
  <div class="vgroup" data-g="narrows">
    <div class="vg-label">Narrows to what you selected</div>
    <button class="vtab" id="v-p-search" data-view="p-search">Search</button>
    ... p-patterns, p-aircraft, p-found
  </div>
  <div class="vgroup" data-g="ignore">
    <div class="vg-label">These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel</div>
    ... 9 buttons
  </div>
  <div class="vgroup" data-g="reference">
    <div class="vg-label">Reference</div>
    ... 3 buttons
  </div>
</nav>
```

The ignore group's title contains "all N reports" — N injected (TOTAL). I'll paint it at boot (and repaint if TOTAL known — TOTAL is corpus size, static). "numbers injected from api/facets" for p-method; the group title N — from heroData.total or TOTAL. I'll use a span and fill from TOTAL if available, else heroData?.total.

Tab buttons: 20 tabs → 20 buttons. The checker counts "20 tab buttons with the labels the specification names, in three named groups." So all 16 tabs including p-search. I render the buttons for all 16 (Search included) but the p-search panel content belongs to the other brief — I only need the panel *containers*? "All 16 panel ids present." Hmm — the other brief builds the search panel's inner content, but the id must exist. Who creates the <section id="p-search">? The brief says "Assume the other brief provides ... the record table". I'll create all 16 <section> shells myself (empty p-search body), so the ids exist and my show() can toggle them; the other brief fills p-search's body. Actually safer: I create the shells for all 16 including p-search (empty inner), and the search half renders into it (e.g., into #p-search directly or into a known child). Since I don't know their exact hook, I'll give p-search a `<div id="search-root"></div>`? That might conflict. Hmm. Simplest and least intrusive: I create `<section class="panel" id="p-search"></section>` empty; the other brief's code renders the table into it (they own p-search content per their spec "p-search Search api/search + hero + vocab + resolve + export.csv"). Wait — actually re-reading: "p-search    Search    api/search + hero + vocab + resolve + export.csv" — the search panel includes the hero? No — the hero is the instrument (brief 1). This line is just listing which endpoints that tab uses. The record table lives under p-search.

Risk: if the other brief also creates #p-search section... The instruction to me: "All 16 panel ids present" is in MY checklist, so I ensure existence; I'll guard: when creating shells, skip a section whose id already exists (if other brief's markup precedes mine). That's robust either way:

```js
function ensurePanel(id){ let s=document.getElementById(id); if(!s){...create...} return s; }
```

And the order of briefs: mine is "the third and last part", dropped in "below the search half" — so their code ran first; if they made #p-search, ensurePanel keeps theirs and I wrap it (ensure scope line as first child? For p-search scope line is blank anyway). Good: ensurePanel(id) returns existing or creates; for p-search I don't add heading/body (they own it). For the other 15, I build fully.

**Tab strip + groups markup placement:** "dropping into the existing page below the search half". Hmm — "below the search half" spatially? The tab strip with a Search tab presumably sits ABOVE the panels and BELOW the instrument. But the instruction says drop the block "below the search half" — i.e., my code chunk goes after theirs in the file. The markup placement: I'll say the tab strip goes directly beneath the instrument (#instrument / after the count bar) and the panels beneath it; my JS injects/moves it at boot so exact document position doesn't matter. Safer: my boot inserts the tab strip right after a known anchor. Which anchor? Unknown DOM from previous briefs. I'll do: `document.getElementById('instrument')` or the hero element — uncertain. Alternative: my markup is a template string; I insert the whole block (tab strip + panels container) after the element with id... The brief 1 spec mentions "#count", "#starters", "#unresolved", ".cut", the table. The table (#reps?) is the search table. I'll anchor: insert before the record table's container if found, else append to body/main. Let me define: find `#grid` or the table element `table#reps`... unknown. 

Pragmatic approach: JS builds everything and inserts `mount()` at boot: locate `#views-anchor` if present else insert after the instrument's count element (#count) else append to main. I'll write:

```js
function mount(){
  const host = document.getElementById('views-host') || document.getElementById('count')?.parentElement || document.body;
  ...
}
```

Hmm. Simplest robust: insert the tab strip immediately before the panels container; insert the panels container at the end of <main> or before the first table. Let me just do: `const mount = document.getElementById('panels') || bodyAppend` — I'll create `#panels` (containing tabstrip + all sections) and append it to document.body's main region: `document.querySelector('main') || document.body`. And note in prose: "the mount point is `<main>`; move the single `<div id="views">` wrapper wherever the layout wants — everything is created by JS at boot, no static HTML needed." Actually cleanest: state that the markup is generated into one wrapper `#views` appended to `main` (or after `#count`'s container if present), and that repositioning is one line.

I'll try: `const anchor = document.getElementById('count')` — the count bar is in the search area above the table. Panels should be below the table? Layout: instrument → count bar → caption → table → then panels below? Tab strip should be near top though. The original page: tabs then panels. I'll place: after the instrument (before the search table area) — anchor on the table: `const t = document.querySelector('table.rep-table, #reps')`... I don't know ids. 

Decision: `document.body.appendChild(viewsWrap)` is guaranteed; then attempt a nicer position: insert before the main results table if an element matching `main table` exists; else leave. I'll do:

```js
const main = document.querySelector('main') || document.body;
const tbl = main.querySelector('table');
if (tbl) main.insertBefore(wrap, tbl.closest('section')||tbl.parentElement...) 
```

Getting fiddly. I'll keep it simple and explicit in prose: "Everything below is created by JS into one wrapper `<div id="views">`; at boot it is inserted after the instrument (the element containing #count), or appended to <main> if that's absent — one line (mountViews) controls placement."

Let me now design the actual content of each of the 15 panels. The endpoints and controls:

**p-patterns — "Patterns"** — FOLLOWS_FILTER.
Endpoints: api/trend; api/breakdown?by=ata|operator|model|part|nature|crew|discovered; api/phrases.
Content: 
- Trend: monthly counts of reports matching the selection — a bar strip. Render as simple divs with heights (no chart lib). Include axis labels (first/last month) and the peak month called out.
- Breakdown: a select (#pt-by) with the six allowed by values, labelled "Group reports by": System (ata), Airline (operator), Model, Part, What was found (nature), What the crew did (crew), How it was found (discovered). Wait — allowed: ata|operator|model|part|nature|crew|discovered — seven values, six listed in the spec string "by=ata|operator|model|part|nature|crew|discovered" — that's seven. Count: ata, operator, model, part, nature, crew, discovered = 7. OK, seven options.
- Phrases: top phrases from the write-ups (api/phrases) — a list "phrase — N reports" with clicking → setFilter('q', phrase).

Controls inside p-patterns: #pt-by select. Changing it re-fetches breakdown only. Scope line: follows filter.

The checker: "Every select the specification names, populated from the API, sorted the way it says, and labelled with its report count." Hmm — "sorted the way it says, and labelled with its report count" applies to the selects in the enumerated list at top (#operator etc.) — those belong to the search half (the other brief builds those 21 selects? "yours 1" — the instrument has 1 select?). Wait the measurement: "select menus original 22 yours 1" — the existing page (mine, from briefs 1–2) has 1 select. And the list of missing selects includes #operator #make #ata ... 21 ids. Then: "Some of that belongs to the search half and is being built separately. What follows is yours: the fifteen panels that are not the search table, their tab strip, and the three groups it is divided into."

So of those 21 named selects, which are mine? The panels' own selects. Looking at the list:
- #operator, #make, #ata, #nature, #crew, #condition, #discovered, #stage, #zone, #corrosion, #cracked, #minhours — these are the instrument/search filters (the machinery brief's controls: "More filters: make, model, part, jasc, ata, nature, crew, condition, discovered, stage, zone, tail, corrosion, cracked, minhours" + #operator in primary row). Those are built by briefs 1–2 (the machinery). Not mine.
- #spike-by (5 options: By part, By model, By airline) — that's p-leads' spikes control. MINE.
- #fl-op (3947 options — airlines) — p-fleet's operator select. MINE.
- #em-by (4: By system, By part condition, By part number) and #em-days (3: Last 180 days, Last year) — p-emerging. MINE. Wait em-by has 4 options but allowed values part|jasc|condition|partnumber = 4. "e.g. By system, By part condition, By part number" — examples. Days: 120|180|365 = 3. MINE.
- #cl-min (4: 4 or more, 6 or more, 10 or more) — p-clusters, min=3|4|6|10 → 4 options ("3 or more" implied as first example). MINE.
- #cl-kind (3: Everything, Recurring, probably scheduled) — client-side kind filter. MINE.
- #ag-by (2: By takeoff-and-landing cycles...) — p-age, by=hours|cycles. MINE.
- #cq-by (3: By model, By manufacturer) — hmm 3 options but by=operator|model|make = 3. Examples given "By model, By manufacturer". MINE (p-consequences).
- #cmp-field (3: Models, Manufacturers) — p-compare field=operator|model|make = 3. MINE.
- #pt-by? Not in the enumerated list... The list has 21 ids: operator, make, ata, nature, crew, condition, discovered, stage, zone, corrosion, cracked, minhours (12) + spike-by, fl-op, em-by, em-days, cl-min, cl-kind, ag-by, cq-by, cmp-field (9). Total 21. #ata is in there but that's the machinery's ata filter... and #make too. Hmm wait — but the panels list I control: spike-by, fl-op, em-by, em-days, cl-min, cl-kind, ag-by, cq-by, cmp-field = 9 selects. Plus #pt-by for patterns breakdown — NOT in the enumerated list! Interesting — the original page's patterns breakdown select maybe had a different id not enumerated, or the breakdown select was #ata? No. The enumeration came from the original page; maybe patterns used #spike-by? No, spike-by is "By part, By model, By airline" = spikes. Hmm, maybe the original's patterns panel didn't have a select (it showed all breakdowns at once?). To be safe: since #pt-by isn't in the measured list, maybe I should render breakdowns without a select — all seven groups? That's heavy. Or use a select anyway (I'm allowed; the measurement was of the original, and my brief says "its controls where it has them"). The spec for p-patterns: "api/breakdown?by=ata|operator|model|part|nature|crew|discovered" — a by parameter implies a control. The checker only checks "Every select the specification names" — the named ones from the list. I'll add #pt-by (it's my panel's control) — not contradicting anything. Actually wait — maybe I shouldn't invent an id that could collide. #pt-by is safe.

Hold on, reconsider: maybe #ata in the list IS mine? "#ata 49 options e.g. Placards and markings, Servicing, Standard practices" — 49 ATA codes with report counts. In the machinery brief, #ata is a "More filters" control ("opts() builds the six coded pickers" — nature, crew, discovered, corrosion, stage, zone are six; ata and condition and cracked and minhours are separate). The machinery brief says "More filters: make, model, part, jasc (HIDDEN input...), ata, nature, crew, condition, discovered, stage, zone, tail, corrosion, cracked, minhours." So #ata belongs to the machinery (brief 1/2). Right — the enumerated 21 selects = 12 machinery + 9 mine. 12+9=21. And "yours 1" existing select = #aimKind probably. Great, that partitions cleanly. So my nine selects: spike-by, fl-op, em-by, em-days, cl-min, cl-kind, ag-by, cq-by, cmp-field. And I may add pt-by as an extra (the original may have had it but perhaps not as a select — I'll include it; it's needed for api/breakdown?by=).

Hmm wait, also p-compare needs a and b values — selects? #cmp-a/#cmp-b? Not enumerated. Compare: field=operator|model|make&a=&b= — with 3947 operators, a and b need pickers. The original probably had selects #cmp-a #cmp-b (with 3947 options each — but then the measurement would show more selects/options... original 22 selects: 21 enumerated + 1 = 22. Hmm! "select menus original 22 yours 1". 21 enumerated + 1 mine = 22. So the original had exactly those 21 named plus one more (the instrument's aim select?). So the original's compare panel used something else for a/b — maybe text inputs with resolve, or reused #fl-op? Or the compare selects weren't selects. Since options in original = 11,444: let me check: operator 3947 + fl-op 3947 = 7894. make 248 → 8142. condition 3131 → 11273. Remaining: ata 49, nature 24, crew 14, discovered 14, stage 18, zone 10, corrosion 3, cracked 2, minhours 4, spike-by 5, em-by 4, em-days 3, cl-min 4, cl-kind 3, ag-by 2, cq-by 3, cmp-field 3 = sum: 49+24=73, +14=87, +14=101, +18=119, +10=129, +3=132, +2=134, +4=138, +5=143, +4=147, +3=150, +4=154, +3=157, +2=159, +3=162, +3=165. 11273+165=11438. Close to 11,444 — off by 6, which is "yours 6"? No wait — "options inside them original 11,444 yours 6" — yours 6 = #aimKind's options? aimKind has 6 kinds (period, operator, tail, zone, jasc, q) — yes! 6 options. So original total = 11,444 - ... hmm, actually the "original" measurement should be the original site only: 11,444. And mine currently: 6. So original = 11438 by my sum... off by 6. Maybe one of the counts differs slightly (e.g., #operator 3950). Doesn't matter. The point: the original had exactly 22 selects, 21 are enumerated, the 22nd is #aimKind (which mine has). Wait — "yours 1" select menu = aimKind exists already (brief 1 built it). So the 22nd original select maps to aimKind. Therefore compare's a/b were NOT selects in the original. Fine — I'll make #cmp-a and #cmp-b as text inputs with datalists? Or selects fed by api/facets? The checker says "Every select the specification names" — cmp-field is named; a/b are not. For operator compare with 3947 options, a select is fine and honest. But to stay close to "22 selects" accounting, maybe compare a/b should be selects anyway... The spec only says api/compare?field=..&a=&b=. I'll implement a/b as text inputs with suggestion via api/resolve (kind=field). That's elegant and matches the AIM AT pattern. But adds complexity. Simpler: selects populated from api/facets when field changes (operator → op list; model → model list; make → make list). api/facets is used by p-terms and p-method, so it presumably provides counts per facet including operator/model/make lists. I'll use it for the compare pickers, sorted by count desc, labelled with counts — consistent with the house style. I'll note this choice.

Hmm, wait — actually the enumerated list is "Every one of these menus is missing from your page" — a criticism list of what's missing. It includes the 9 panel selects. The original had 22 total; 21 missing + aimKind present. OK.

Now let me design each panel concretely but economically. This is a lot of code. Budget: I need to write a complete, working, self-contained block. Let me plan the code structure:

```js
// ==== PART 3: the fifteen panels, the tab strip, the scope lines ====
```

Structure:
1. Constants: VIEW_GROUPS, PANELS meta (label, group, endpoint(s), loader).
2. mountViews() — builds tab strip + panel shells, inserts into DOM.
3. show(id) — activates tab, toggles sections, triggers lazy loader.
4. scopeLine(id) — the three forms.
5. Loader per panel: loadPatterns, loadAircraft, loadFound, loadFleet, loadLeads, loadEmerging, loadClusters, loadDefect, loadStructure, loadAge, loadEngines, loadConsequences, loadCompare, loadTerms, loadMethod.
6. Helpers: fetchJ (getJSON with error handling), el/qs local? Use existing `el()`? The machinery surely has el(id). I'll use document.getElementById directly to be safe? The existing page "using the existing helpers" — el() was used in the machinery spec text ("el(k).value"). So el exists. I'll use el. esc() exists. num() exists. prettyDate exists. TOTAL exists (corpus total). heroData exists (has .months, .total?). FOLLOWS_FILTER exists? It's defined in machinery brief — "FOLLOWS_FILTER = ['p-search','p-patterns','p-found']". I'll reference it if present, else define locally (guarded). Since the machinery brief defines it as a const in the same IIFE, it exists. I'll just use it but guard with typeof to be safe? If it's a const in the same scope, typeof works. I'll do `const FF = (typeof FOLLOWS_FILTER!=='undefined') ? FOLLOWS_FILTER : ['p-search','p-patterns','p-found'];` — safe.

Similarly params(), setFilter(), search(), filterWords? filterWords is used in case sheet (brief 2). Guarded use.

TOTAL — machinery: "num(corpus)", "All ${TOTAL} reports." TOTAL exists (corpus size). Guarded: `const T = () => (typeof TOTAL!=='undefined' && TOTAL) ? TOTAL : (heroData && heroData.total) || 0`.

heroData — from brief 1 (hero). Has .months for paintSpines. For the group title "all N reports" I'll use TOTAL or heroData.total.

api base: endpoints like "api/trend" — relative paths. I'll call fetch('api/trend?...').

Error voice: the machinery is fail-closed with one voice. Panels should fail with a similar honest line: "This panel found no number: <error>. Nothing is quoted." I'll write a standard fail message per panel: e.g. `panelFail(box, msg)` → `<p class="pfail">This panel did not load (…). It shows no figure rather than an old one.</p>`.

Now, per panel design. I must keep each panel genuinely useful, with scope line first, heading, controls, and content. Let me write the content generators. I need to be careful about size — 15 panels × fetch + render. Let me define a generic renderer for "label + count" lists (bars), used by breakdown, spikes, emerging, consequences, corrosion lists, ageing, engines, glossary-ish lists. A `barList(rows, {unit})` producing rows with a bar and count, click → setFilter where meaningful.

Generic data row shape: unknown — I must assume the API returns JSON. I'll write renderers defensively: accept arrays of objects with flexible keys (label/name/key + n/count/total). To keep code sane, I'll normalize: `const L = r.label ?? r.name ?? r.key ?? r.term ?? r.code ?? ''; const N = r.n ?? r.count ?? r.total ?? r.reports ?? 0;`. This is pragmatic — the real API shape is unknown to me; the spec doesn't record field names. I'll note this assumption once.

Let me enumerate panels:

**p-patterns (Patterns)** — FOLLOWS_FILTER.
- Scope line: follows.
- Controls: #pt-by select: options: ata "By system (ATA chapter)", operator "By airline", model "By aircraft model", part "By part", nature "By what was found", crew "By what the crew did", discovered "By how it was found".
- On load: fetch api/trend (with params? trend follows selection — api/trend presumably reads filter query params like search does: I'll append params() + relevant args). Hmm — does api/trend take the filter args? It follows the selection, so yes: `api/trend?` + params(). I'll append params() to all FOLLOWS_FILTER panel fetches (trend, breakdown, phrases, inspection-method, repeat-offenders). For ignore panels, fetch WITHOUT filter params (they answer from whole corpus) except their own slice params. That's the honest implementation of "ignore your selection" — and matches "or from a slice you set inside the panel".
  Wait — but should I send params and trust the server to ignore? No: "Ignore your selection" must not accidentally narrow if the server honors params. Send NO filter params for ignore panels. For p-aircraft's repeat-offenders: send params (follows filter). For api/aircraft/<tail>: no params (whole corpus).
- Render trend: monthly bars. Assume rows: [{month:"2025-08", n:123}...]. Render `.trend` flex of bars with title tooltips "August 2025: 1,234", first/last labels, and a line for the peak: `Peak: August 2025, N reports`. Clicking a bar → set from/to to that month? That's a nice honest action: clicking a month sets from=first to=last of month via setFilter('from',...) and setFilter('to',...). I'll add that (click bar → sets both). Careful: setFilter triggers show('p-search') and search — fine.
- Render breakdown: barList of top rows with counts; clicking a row sets the corresponding filter where mappable (ata→ata two-char? breakdown by ata returns chapter? label like "32 — Landing gear"? I'll map clicks: operator→operator code, model→model, part→part, nature→nature code, crew→crew code, discovered→discovered code, ata→ata chapter code). Need codes in rows — assume rows carry {code,label,n} or {label,n}. I'll use r.code if present for the filter value.
- Render phrases: list "phrase — N reports", click → setFilter('q', phrase).

**p-aircraft (Aircraft)** — group narrows; mixed scope.
- Two halves:
  a) Tail lookup: if tail filter set (params().get('tail')), fetch api/aircraft/<tail> (no filter params, whole corpus). Show: registration, type, operator(s), counts: total reports, first/last seen, and a list of recent reports? Keep to summary + notable: "This airframe appears in N reports" + top ATA chapters + recent dates. Also buttons to Flightradar24/FAA registry like sourceLinks? The case sheet has those; panel can reference: link "Who owns N123" registry link. I'll include a couple of external links (FR24, FAA registry) since the spec already endorses those URLs.
  b) Repeat offenders: fetch api/repeat-offenders WITH params (follows filter): list "N123 — N reports — operator" click → sets tail filter and loads the aircraft half (setFilter('tail', num) then loadTail()). 
- Scope line: special (see decision). I'll render: `The aircraft summary answers from <strong>all reports</strong> for the tail named; the repeat offenders list follows your selection.` If no tail set: the summary half shows a tail input + "Look it up" button (id #ac-tail? not enumerated — fine). Hmm, but is adding a tail input box overstepping? The panel needs a way to name a tail if arrived without one. The original had loadTail() invoked from table clicks. I'll include a small input #ac-tail + button. It's a control "where it has them". OK.

Wait — actually, scopeLine spec says p-aircraft BLANK. Let me weigh again. The checker will test: "With a zone filter set, a panel in the 'ignore' group says so in its own words and still reports the whole-corpus figure." p-aircraft is in the narrows group, so not tested for that. The risk of deviating: minimal, and the deviation is MORE honest. The spec itself flags the FOLLOWS_FILTER/VIEW_GROUPS discrepancy for p-aircraft as "worth preserving or fixing". My fix: keep it in narrows group; give it a split scope line. Document it. 

Hmm, alternatively "preserve": keep blank scope line, and the panel's own sub-labels ("from the whole corpus" / "follows your filter") do the work. That also satisfies honesty. But then a zone-filtered reader on p-aircraft sees a blank scope line and a whole-corpus tail history — misleading at a glance. I'll go with the split scope line. Document as departure.

**p-found (How it was found)** — FOLLOWS_FILTER. api/inspection-method (with params).
- Content: breakdown of HowDiscoveredCode with counts, plus the "found by instrument, not visible from outside" insight: codes B,D,E,M,T,U,X grouped as "found by instrument" vs "found by eyes". The machinery spec says HowDiscoveredCode in B,D,E,M,T,U,X = "found by instrument". So panel: two-tier: for each code: decode via code('discovered', c) — wait, code() helper: `code(field or grp, v)`? The machinery says chips decode via code(). I'll guard-use code() else raw. Render each discovered code with count, split into "Seen by a person" vs "Found by instrument" with the instrument group labelled with the spec's sentence. Click a row → setFilter('discovered', code).

**p-fleet (Fleet)** — ignore group. api/fleet?operator=&model= — "load only on its own buttons".
- Controls: #fl-op select (3,947 operator options, sorted by report count desc, labelled "Name (CODE) (12,345)"), and a model input/select? The endpoint takes operator= AND model=. The enumerated selects include #fl-op only (3947 options). Model: I'll add a text input #fl-model (not enumerated). Or a select from api/facets models — not enumerated either; a text input is safer/cheaper. Buttons: "Show the fleet" (the panel's own button). Loading only on button.
- Content: fleet profile for the chosen operator: counts of reports by model (bar list), top tail numbers (repeat aircraft within fleet), maybe average age (hours). Render from whatever returns: I'll render a summary line + two bar lists (by model, top tails) using flexible keys. Since the exact response shape is unknown, I'll render: if resp.rows/.models etc... Hmm. This is the crunch: unknown response shapes. Strategy: write a generic "shape-agnostic" renderer `firstArray(resp)` that finds the first array of objects in the response, and barList it. Plus a `kv summary` for scalar fields. That keeps every panel robust without knowing exact shapes. I'll implement:

```js
function pickArr(o, ...names){ // find array by preferred keys
  if(Array.isArray(o)) return o;
  for(const k of names) if(Array.isArray(o?.[k])) return o[k];
  for(const k in o||{}) if(Array.isArray(o[k]) && o[k].length && typeof o[k][0]==='object') return o[k];
  return [];
}
```

And `numOf(r)` normalization. And a `linePairs(o)` for scalar summary: entries where value is string/number.

This is the pragmatic path. I'll document: "Response shapes were not in the spec; renderers read the first plausible array and normalize label/count keys — swap `rowLabel`/`rowN` if the server differs." That's an honest note.

**p-leads (Story leads)** — ignore group. api/leads + api/spikes?by=ata|part|model|operator.
- Controls: #spike-by select: By part, By model, By airline, and ata (4 options? "5 options" per measurement! "#spike-by 5 options e.g. By part, By model, By airline" — 5 options but by=ata|part|model|operator = 4 values. 5th option? Maybe a "choose…" placeholder or "Everything". I'll include a leading placeholder option "Choose a grouping" (no value) + the four — that makes 5. That's consistent: 5 options, 4 real.) Hmm, or the 5th could be "By system" (ata). The allowed values are exactly 4, so the 5th must be non-value (placeholder or "all"). Placeholder it is. Actually wait — could the 5th be the empty "Everything" default that triggers api/leads only? I'll do placeholder "Choose what to watch" selected, plus 4 real. Fine.
- Content: api/leads (no params — whole corpus): a list of editorially-shaped lead items: each lead = a heading + sentence + numbers, e.g. "Spikes", "Rising defects", "Heaviest days". Unknown shape again → generic renderer: leads likely return [{title, text, n, ...}]. I'll render each as a card: title (bold), text, figure. For spikes: after choosing #spike-by, fetch api/spikes?by=X: rows {label, n, spike info?} — render barList with a "spike" annotation if fields like window/previous exist. Clicking → setFilter by mapping (ata→ata, part→part, model→model, operator→operator).
- Loads on show (not button-gated) — only p-fleet and p-compare are button-gated.

**p-emerging (New defects)** — ignore. api/emerging?by=part|jasc|condition|partnumber&days=120|180|365.
- Controls: #em-by (4 options: By system, By part condition, By part number, By part — order per measurement "e.g. By system, By part condition, By part number" — 4 options: By part, By system, By part condition, By part number). Map: part, jasc, condition, partnumber. #em-days (3: Last 180 days, Last year — 3 options: Last 120 days, Last 180 days, Last year). Wait "e.g. Last 180 days, Last year" — 3 options = 120, 180, 365.
- Content: rows of {label, recent n, previous n, change} — render "newer than before": bar + "N in the last K days vs M before — up X%". Click → setFilter mapped (part→part, jasc→ata two-char? jasc is 4-digit → jasc filter; condition→condition; partnumber→part).

**p-clusters (Same day, many aircraft)** — ignore. api/clusters?min=3|4|6|10, kind filtered client-side.
- Controls: #cl-min (4 options: "3 or more, 4 or more, 6 or more, 10 or more"), #cl-kind (3: Everything, Recurring probably scheduled, ...). Hmm: "#cl-kind 3 options e.g. Everything, Recurring, probably scheduled" — the comma is inside: options like "Everything", "Recurring, probably scheduled", and a third — maybe "One-off, probably unscheduled"? kind filtered client-side: clusters response rows carry a kind field (scheduled/recurring vs unscheduled). Three options: "Everything", "Recurring, probably scheduled", "Single-day, probably unscheduled"? I need to guess. The example text shows only two of three: "Everything" and "Recurring, probably scheduled". Third: plausibly "Not recurring" or "One day only". Since clusters are same-day groups, kind may be about whether the same tail+part recurs (scheduled checks) vs distinct aircraft (event). Let me define kinds: "everything" (all), "scheduled" (recurring, probably scheduled — same operator+part recurring), "unscheduled". I'll implement client-side filter on a `kind` field with fallback matching: rows with kind containing 'sched' vs not. I'll label: "Everything" / "Recurring, probably scheduled" / "Not recurring, probably an event". Document assumption.
- Content: cluster cards: date, count of aircraft, tails list (buttons → open that tail in p-aircraft via setFilter('tail',...)), zones/ata of the cluster. Generic render: {date/day, n, tails:[], ...}. I'll render: `<b>N aircraft, same day</b> — date` + tail buttons + any label fields.

**p-defect (Same defect)** — ignore. api/same-defect.
- No by param, no controls. Content: groups of identical defect across aircraft/time: rows {part? condition? nature?, n, operators?, example}. Render grouped list: "the same write-up, many aircraft": each row: label (part + condition), N reports, N operators, date span, button "Look at them" → sets q/part filters? Clicking → setFilter('part', ...) if code present, else set q to the phrase. Generic.

**p-structure (Corrosion & cracks)** — ignore. api/corrosion.
- Content: corrosion levels 1/2/3 counts (decode via code('corrosis'... code('corrosion', c)), cracked counts, top zones for corrosion, top parts. Render: three big numbers for levels with the level meanings ("Level 2, beyond allowable limits", "Level 3, urgent" from the select examples), a cracks total, and bar lists by zone/part. Click level → setFilter('corrosion', n).

**p-age (Old airframes)** — ignore. api/ageing?by=hours|cycles.
- Controls: #ag-by (2: By hours on the airframe, By takeoff-and-landing cycles).
- Content: buckets: rows {bucket, n} — render barList "50,000–74,999 hours: N reports". Click → setFilter('minhours', bucketLow) where parseable (only for hours; for cycles no filter field exists — cycles has no filter; so clicking a cycle bucket: no filter mapping — make it non-clickable, or set minhours? No. For cycles, rows are plain text, no click. Honest: only hours buckets map to minhours.)

**p-engines (Engines)** — ignore. api/engines.
- No params. Content: engine-related: by enginemake/enginemodel (FILTER_ARGS mentions enginemake/enginemodel as accepted args!). Rows {make/model, n} + maybe notable natures (flameout, uncontained...). Render barLists; clicking an engine make could... no filter control for enginemake exists in FIELDS (server accepts it but no control sets it — hmm, setFilter('enginemake', v) would write el('enginemake') which doesn't exist → el() returns null → crash). So engine rows are NOT clickable. Fine: display-only with counts. Also could link to starter questions (nature X/T). Keep display-only.

**p-consequences (What the crew did)** — ignore. api/consequences?by=operator|model|make.
- Controls: #cq-by (3: By airline, By model, By manufacturer) — examples "By model, By manufacturer" + operator = 3.
- Content: for the chosen by: rows {label, n, topCrew:[{code,n}...]}? Unknown. Render: barList of entities, each expandable? Keep simpler: render a matrix-lite: for each entity row: name + total + the crew action composition as inline mini-bars if rows carry nested arrays. Generic fallback: flat list. Click entity → setFilter(operator/model/make, code).

**p-compare (Compare)** — reference. api/compare?field=operator|model|make&a=&b=. Button-gated.
- Controls: #cmp-field (3: Models, Manufacturers — plus airlines: field=operator|model|make → "Airlines", "Models", "Manufacturers"). Plus a and b pickers. Since not enumerated as selects, I'll do: #cmp-a and #cmp-b as selects populated per field from api/facets (sorted count desc, labelled with counts) — hmm that adds 2 more selects beyond the original 22. Does that matter? The checker: "Every select the specification names, populated from the API, sorted the way it says, and labelled with its report count." It doesn't forbid extra selects. The measurement critique was about missing panels' controls. Compare genuinely needs pickers. But wait — the original had exactly 22 selects and none for compare a/b. So the original used something else — likely the AIM AT resolve pattern (text + suggestions) or text inputs. I'll use two text inputs with a shared datalist? Datalists for 3947 operators is heavy but the machinery already does 3947-option selects (fl-op). I'll use selects populated lazily from api/facets when the panel first needs them. Decision: selects #cmp-a, #cmp-b. Note it as an addition with reason.
- Content: side-by-side: for a and b: total reports, per-ATA top 3, per-crew top action, rates per... unknown shape. Render two columns from resp.a / resp.b (or array of two) with key figures; plus a delta note: "A holds N reports, B holds M — difference K". Generic pair renderer.

**p-terms (Every code explained)** — reference. api/glossary + api/facets.
- Content: the glossary table: for each group (nature, precaution/crew, discovered, stage, part_location/zone, corrosion, condition?, jasc, ata): each code: short label, FAA wording, note, count (from api/facets). Counts: facets provides per-code counts? "api/glossary + api/facets" — facets gives counts. Render: sections per group; each row: code, label, FAA wording (muted), note (muted), count. Click → setFilter(field, code) where field maps (nature→nature, precaution→crew, discovered→discovered, stage→stage, part_location→zone, corrosion→corrosion, condition→condition, jasc→jasc, ata→ata).
- I need glossary data: machinery loads CODES at boot from api/glossary. So CODES exists in scope! I can reuse CODES instead of refetching? Spec says p-terms loads api/glossary + api/facets. But CODES is already there; refetching is wasteful yet harmless; using CODES honors "loaded ONCE at boot". The panel spec lists its endpoints though. Hmm — "Switching to a tab fetches its endpoint once" — the checker might watch for api/glossary fetch on p-terms show. I'll fetch api/facets for counts, and use CODES if present else fetch api/glossary. Actually to satisfy the checker literally ("fetches its endpoint"), I'll fetch both but glossary fetch can reuse cache: fetch api/glossary once (module-level promise) — CODES may already be that data; if CODES exists I could skip. Risk trade-off: checker says "fetches its endpoint once, and not before" — showing p-terms should fetch. I'll fetch api/glossary only if CODES is missing; document. Hmm, safer for the check: fetch it. But "loaded ONCE at boot from api/glossary" means the machinery already fetched it; my fetching again is a second network hit — fine ("once" = once per show, cached flag prevents repeats). I'll just fetch both on first show, with my own once-guard. Simpler and matches the panel spec line. OK.

Glossary shape: CODES in machinery is keyed by group? code("precaution", v) and code("part_location") suggest CODES = {nature:{CODE:{label,faa,note}}, precaution:{...}, ...}. I'll normalize: g = resp (object of groups) — if resp is object of groups use it; else if array, group by r.group. Then render.

Facets shape: unknown; I'll try resp.discovered?.buckets etc. Too speculative. Simpler: for counts, build a lookup from api/facets however shaped is hard. Alternative: p-terms shows glossary with counts only where facets gives them; wrap facet extraction in try/catch and render counts as blank when not found. The checker tests "Every select ... labelled with its report count" — that's about selects, not p-terms. So p-terms can show codes without counts if facets shape unknown. But "still reports the whole-corpus figure" applies to ignore panels with filters — p-terms is Reference group. OK, I'll attempt counts via a best-effort facet reader, else omit. Actually — I could get counts for many groups from CODES itself? Machinery's opts() builds pickers "sorted BY REPORT COUNT DESC, each labelled 'Label (12,345)'" — meaning somewhere there are counts per code — likely heroData or CODES entries carry n. opts() uses some counts source. I'll write `codeCount(grp, c)` trying: heroData?.counts?.[grp]?.[c], CODES[grp][c].n, facets... best effort. Fine.

**p-method (Method)** — reference. Static prose, numbers injected from api/facets.
- Content: prose paragraphs: what SDRS is, what the desk does (decode, dedupe guidance, the 2006 cross-reference caveat, counts), injection points: <b data-f="total"></b> etc. filled from api/facets (total, dated/undated counts, operators count, aircraft count, date range). I'll fetch api/facets and fill spans: total reports, span dates, operators named, tails, undated. Prose must include the honesty items: mechanics' words as filed; no per-report permalink; export cap 5000; the December 2006 cross-reference; "counts are of write-ups, not events" (sameDayRuns insight). Good.

Now the **scope line implementation**:

```js
function scopeLine(id){
  if(id==='p-search') return '';
  if(id==='p-aircraft') return SPLIT (see below);
  const n = lastCount(); // total for current selection, from LAST_TOTAL/heroData
  const fw = selectionWords();
  if(FF.includes(id)) return n>0 ? `Showing <strong>your selection</strong>, ${num(n)} reports.` : `Showing <strong>your selection</strong>, no reports. Nothing here can be quoted until the selection matches something.`;
  if(!fw) return `All ${num(T())} reports.`;
  return `This view always answers for <strong>all ${num(T())} reports</strong>. It does not narrow to your current selection (${fw}).`;
}
```

n for follows panels: the current selection count. Where from? LAST_TOTAL (machinery sets it) or heroData.total. Guarded: `const selN = () => (typeof LAST_TOTAL!=='undefined' && LAST_TOTAL!=null) ? LAST_TOTAL : (heroData?.total ?? 0);` Hmm — LAST_TOTAL is used for drift detection (d.total!==LAST_TOTAL). It's the last search's total. Use it.

selectionWords(): use filterWords() if defined; fallback minimal: build from params() with clauseText if defined... I'll write a compact local fallback:

```js
function selectionWords(){
  try{ if(typeof filterWords==='function'){ const s=filterWords(); return s; } }catch(_){}
  const p=params(); const bits=[];
  ... minimal: q→'where a mechanic wrote "q"', operator→p.get('operator'), tail→'N'+..., from/to→'from X to Y', else `k v`
  return bits.join(', ');
}
```

Keep the fallback short — it's a safety net.

**Painting scope lines at the right times**: scope lines must update when the selection changes (a zone filter set later should appear). But ignore panels don't refetch on filter change — yet their scope line SHOULD update (that's the whole point: the line changes even though the figure doesn't). So: setFilter/search flow → other brief calls show('p-search') and search(). My panels' scope lines need repainting on every search. Hook: my code can wrap search? "call them, do not redefine them" — I can't redefine search. Options: MutationObserver on #count? Or repaint scope lines inside show() and also on a 'sdr:search' custom event (which other brief won't fire). Pragmatic: paint scope lines (a) at panel load, (b) every show(), and (c) on a lightweight interval? No. Better: patch around search without redefining: capture `const _search = search;` then define... no — redefinition is prohibited but wrapping via assignment `const prevSearch = search; search = function(...){...}` — that's redefining the binding. Within an IIFE, if search is declared with `function search()`, reassigning works (function declarations are mutable bindings) — but the instruction says don't redefine. Hmm, wrapping is not redefining semantics — it delegates. But it could conflict with brief-2's own internal calls (they call search internally; if I reassign the binding before/after theirs, internal references use the same binding — function-declared names are resolved at call time, so wrapping works). Risk: brief order — mine runs last, so my wrapper would be in place for all later calls. But if brief 2 captured a reference early... unlikely.

Alternative cleaner: MutationObserver on the #count element: on character change, repaint all visible scope lines + the ignore-group subtitle N. The machinery already uses a MutationObserver pattern (on body for makeReachable). A second observer is consistent with house style. But #count may not exist yet at my boot. Observe document.body subtree with a filter? Cheap enough: I'll observe #count if present (defer via setTimeout/interval until found), and repaint scope lines when its text changes. Plus repaint on show(). Plus expose window-scope function? No globals needed.

Simplest robust combo: 
- repaint scope lines in show(id) for the shown panel;
- MutationObserver on #count (when it appears) repaints ALL panel scope lines (cheap string writes);
That covers filter changes (search() always rewrites #count). Also boot paint of group title N.

Also: the ignore-group subtitle: "These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel" — N = TOTAL, static; paint once known (TOTAL may be 0 until facets/hero loads — paint in show() and on observer too).

**show(id) details:**

```js
let CURVIEW = 'p-search';
const LOADED = {}; // id -> params string or true
function show(id){
  CURVIEW=id;
  document.querySelectorAll('.vtab').forEach(b=>{ const on=b.dataset.view===id; b.classList.toggle('on',on); b.setAttribute('aria-selected',on); });
  PANEL_IDS.forEach(pid=>{ const s=document.getElementById(pid); if(s) s.hidden = pid!==id; });
  const ldr = LOADERS[id];
  if(ldr){
    const key = FF.includes(id) ? params().toString() : 'once';
    if(id==='p-fleet'||id==='p-compare'){ ensureShell only } // button-gated
    else if(!(LOADED[id]===key)) { LOADED[id]=key; ldr(); }
  }
  paintScope(id); // (re)paint its scope line
}
```

Wait — for follows panels, LOADED key = current params → re-fetch when selection changed. For ignore panels key='once'. For button-gated: don't auto-load; show shell; if previously loaded, keep content (fleet slice is reader-set inside panel, not filter — so keep). Compare: same.

But careful: initial page boot — the machinery's setFilter/search at boot may call show('p-search'). My show must exist before their calls? Their code runs before mine in the IIFE... at parse time all function declarations hoist to IIFE scope top — if both briefs are function declarations in the same IIFE, show() is hoisted and available regardless of order. If they call show at module-eval time (boot sequence code at bottom?), my function declarations hoist — fine. But my MOUNT (DOM building) must run at boot: I'll run mountViews() immediately (script executes in order; DOM exists if my code runs after DOMContentLoaded or at end of body — the page is "existing page", my block drops in below theirs at end of body presumably). I'll guard: if document.readyState==='loading', wait DOMContentLoaded. And their boot code (restore at boot, search(0)) may run before my mount → show('p-search') called before tabs exist → my show must not crash when tab strip absent. Guard everything with null checks; also re-sync tabs after mount (if CURVIEW set). Good.

p-search lazy: the other brief handles its own content; show('p-search') shouldn't fetch anything (their search() does). My LOADERS['p-search'] = null → skip. LOADED semantics fine.

**Now write each loader.** To keep the answer manageable, I'll build small render helpers:

```js
function fetchJ(url){ return fetch(url).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
function qsel(sel, box){ ... }
function barRows(rows, opts){ ... } // returns HTML string of .brow list
```

barRows: for each row: label (esc), count (num), bar width relative to max, optional right note; optional click handler via data attributes: I'll attach clicks by delegation: each bar row gets data-k (filter field) and data-v (value) when opts.map provides mapping; a delegated click on .brow[data-k] calls setFilter. Delegation: one listener on #views for click on [data-setk] → setFilter(k, v). Also data-aim="set-k" like machinery's data-aim? The machinery uses data-aim for the aim line narration ("data-aim='drop-k'"). I'll mirror: data-aim="set-k" and after setFilter, aim(`narrowed to ...`)? The aim() helper exists (brief 1). Guarded call: `if(typeof aim==='function') aim(...)`. Nice touch consistent with house style: clicking a bar narrows and the aim line says so. Keep minimal: after setFilter from a panel row, aim(`${label} → your selection`)? Let me not overreach; I'll do setFilter and let the chips/count speak. Actually a small aim note is genuinely useful ("the aim line is the one element a pointer may write to"). I'll include: aim(`narrowed to ${labelPlain}`)? Hmm, tone words matter. Keep: `aim('now showing ' + labelPlain + ', ' + num(n) + ' reports.')` — but aim refuses during holds; fine. Guard existence.

Row normalization:

```js
function rLabel(r){ return r.label ?? r.name ?? r.term ?? r.title ?? r.key ?? r.code ?? r.bucket ?? r.month ?? r.phrase ?? ''; }
function rN(r){ return r.n ?? r.count ?? r.total ?? r.reports ?? r.reports_n ?? 0; }
function rCode(r){ return r.code ?? r.value ?? r.id ?? rKey(r); }
```

For filter mapping I need code separate from label (e.g., operator rows: {code:'UAL', label:'United Air Lines Inc', n}). For rows lacking code, use label as value for q-ish filters? Only map when code exists or mapping is label-equal (model/make/part labels are the values).

Mapping table per breakdown context:
- patterns by: ata→{k:'ata', v:r.code (2-digit)}; operator→{k:'operator', v:r.code}; model→{k:'model', v:r.label||r.code}; part→{k:'part', v:r.label}; nature→{k:'nature', v:r.code}; crew→{k:'crew', v:r.code}; discovered→{k:'discovered', v:r.code}.
- spikes by: same minus nature/crew/discovered: ata, part, model, operator.

Month bars for trend: rows sorted by month asc presumably; render bars; label first/last month via prettyMonth (I'll write monName from 'YYYY-MM'). Click bar → setFilter from/to for that month (from=YYYY-MM-01, to=YYYY-MM-31? Use real end: compute via Date). Nice: `setMonth(m)`.

Undated: trend may include null month → skip or show as "no date" bar at end? Skip bars; if resp.undated present show note.

Now per-panel HTML shells. I'll define PANEL meta with builder for shell:

```js
const PANELS = {
 'p-search':   {label:'Search', grp:'narrows'},
 'p-patterns': {label:'Patterns', grp:'narrows', heading:'Patterns'},
 ...
}
```

Shell builder for non-search panels:

```js
function buildPanel(id){
  const m=PANELS[id];
  const s=document.createElement('section');
  s.className='panel'; s.id=id; s.hidden=true;
  s.innerHTML = `<div class="scope" data-scope="${id}"></div><h2>${m.heading||m.label}</h2>${m.sub?`<p class="psub">${m.sub}</p>`:''}<div class="pbody" id="${id}-body"></div>`;
  return s;
}
```

Each loader writes into `${id}-body` (or panel-specific sub-boxes). Controls built statically in the shell innerHTML where fixed (selects with fixed option lists: spike-by, em-by, em-days, cl-min, cl-kind, ag-by, cq-by, cmp-field, pt-by). Selects needing API population: fl-op (operators), cmp-a/cmp-b (per field). The checker: "Every select the specification names, populated from the API, sorted the way it says, and labelled with its report count." The nine named panel selects: spike-by, fl-op, em-by, em-days, cl-min, cl-kind, ag-by, cq-by, cmp-field. Of these, which are "populated from the API... labelled with its report count"? Hmm — spike-by/em-by/em-days/cl-min/cl-kind/ag-by/cq-by/cmp-field have FIXED option labels from the spec (e.g., "By part", "Last 180 days", "4 or more"). They aren't API-populated and carry no report counts — they're mode pickers. fl-op is API-populated with counts. I think the checker sentence mainly targets fl-op (and the machinery selects). The fixed ones are "sorted the way it says" trivially (verbatim order). I'll populate fl-op from... which endpoint? Options like "#operator 3947 options e.g. Southwest Airlines Co (SWAA)" — labelled "Name (CODE)" + count. The machinery's opts() builds #operator from some facets/counts source at boot. For #fl-op I need the same list: 3947 operators sorted by count desc. Source: api/facets presumably returns operators with counts (machinery used facets for OPGAP and hero). I'll fetch api/facets on first p-fleet show and build #fl-op options: label `${name} (${code})`, plus count in the label? Select options can't have counts styled, but text can include " — 12,345 reports"? That's long ×3947. The machinery spec for chips: operator→"Name (CODE)". For select labels: "Label (12,345)" per opts(). So #fl-op option text: `${name} (${code}) — ${num(n)}`? opts() says 'Label (12,345)'. So: `Southwest Airlines Co (SWAA) (12,345)`? Hmm — "Label (12,345)" where Label="Southwest Airlines Co (SWAA)". I'll do `${name} (${code}) — ${num(n)}` — no wait, follow the spec's pattern: "Label (12,345)". Label already includes (CODE). So "Southwest Airlines Co (SWAA) (12,345)". Slightly awkward but spec-conformant. Fine.

Also empty-label option first: "Any operator" — fl-op is a slice setter inside the panel, not a filter; first option "Any operator" (value '') meaning whole corpus. Good.

cmp-a/cmp-b: populate on field change from the same facets fetch: operator→operators; model→models? Does facets include models with counts? Unknown. I'll try resp.models / resp.make / resp.makes. Best effort with graceful fallback: if list missing, fall back to text input? To keep code simpler: build selects from facets keys if available; if not available, swap to text inputs. Complexity... Alternative: compare a/b as plain selects populated from facets' operator/model/make lists; if facets lacks models, show a text input instead. I'll implement `cmpPickers(field)` that fills two selects from a facet list; if the facet list is absent, fills with a single placeholder option and shows a hint "type the exact value" — no, simpler: keep text inputs with a datalist fed by facets. Hmm.

Decision: #cmp-field select; #cmp-a and #cmp-b as `<select>` when facet list available else `<input type="text">`. I'll implement a small function returning the element. Reasonable.

Actually, let me reconsider compare UX vs code budget. p-compare: field select + two value pickers + Compare button → api/compare?field=&a=&b= → render two columns + delta. The response presumably {a:{...}, b:{...}} or {left,right}. Generic: pickArr on resp gives? resp.a is an object of figures... I'll render: for each side: name + total + firstArray(side) barList. Plus headline: `${Aname}: ${num(nA)} vs ${Bname}: ${num(nB)} — ${num(Math.abs(d))} difference`. If side has .total use it else rN of first row? Use side.total ?? side.n ?? count sum. OK.

**Case/glossary counts**: skip perfection; best effort.

**p-found details**: api/inspection-method with params. Response maybe rows per discovered code + maybe per stage. Render: two groups: "Found by instrument — not visible from outside the aircraft" (codes B,D,E,M,T,U,X) and "Found by a person looking" (rest). Rows: decode label via code('discovered', c) || r.label. Count. Click → setFilter('discovered', c). Also a headline figure: "N of your M reports were found by instrument (P%)". Compute from rows. If response has stages, render secondary list. Generic.

**p-clusters**: fetch api/clusters?min=N (no filter params). Client-side kind filter: rows with r.kind — filter by cl-kind select: 'all' | 'sched' | 'event'. Mapping: kind string containing 'sched' or 'recur' → scheduled; else event. Buttons per tail in cluster → setFilter('tail', tail). Render date via prettyDate-ish. Also the sameDayRuns caution could be echoed here: "Count events, not rows." Add as panel note — nice reuse of house voice: `<p class="pnote">A heavy check on one aircraft writes many rows. This panel counts aircraft, not rows.</p>`. Good.

**p-defect**: api/same-defect, no params. Rows: {part, condition, n, operators, first, last, example?}. Render list: "<b>Part</b> — condition: N reports across K operators, from D to E" + button "Show them" → setFilter('part', label) (and maybe condition → setFilter('condition',...)). I'll wire two small buttons? Keep one click: set part (if code) else q=phrase. Hmm — same-defect groups are probably keyed by (part, condition, nature) text. Clicking sets q to the phrase? Safer: if r.code present setFilter(part), else setFilter('q', label). Fine.

**p-structure**: api/corrosion. Expect: {levels:{1:n,2:n,3:n}, cracked:n, byZone:[...], byPart:[...]}. Generic: render scalars found (levels) as three stat cards with decode names: code('corrosion','1') → "Level 1..." — actually the corrosion select examples: "Level 2, beyond allowable limits (118,565)", "Level 3, urgent". I'll decode via code('corrosion',c) fallback "Corrosion level N". Cards clickable → setFilter('corrosion', c). Cracks: cracked total → setFilter('cracked','1'). Then barLists from arrays (zones→setFilter('zone', code), parts→setFilter('part')).

**p-age**: api/ageing?by=hours|cycles. Rows {bucket/label, n} maybe with avg hours. Render bars. Hours buckets: parse leading number from label → setFilter('minhours', that). Cycles: no click.

**p-engines**: api/engines. Render: headline (engine-related report count if given) + barLists (by engine make / model) + maybe notable natures. No clicks (no filter fields). Maybe a link-button to starter: setFilter('nature','X')? That's a filter field that exists — I could add "Engine flameouts in your selection" quick action. Keep one: a ghost button "Show engine write-ups with your filters" → setFilter('q','engine')? Hmm — careful not to overstep. I'll include quick links: flameout {nature:'X'} and uncontained {nature:'T'} — those are starter questions, legit. Actually those are already starters; panel repeating them is fine as cross-links. Keep minimal: display-only + note pointing to starters. Decide: display-only.

**p-consequences**: by select; fetch api/consequences?by=X (no filter params — ignore panel; the by is the slice). Rows: {label(code), n, crew breakdown?}. Render bars; click → setFilter(by-field: operator/model/make, code). If rows carry nested crew arrays, render top-3 inline muted. Generic.

**p-leads**: two fetches: api/leads (no params) and api/spikes?by=... Render leads as cards: title, body text, figure; spikes as bar list with mapping. Leads response unknown; generic: pickArr → rows with title/text/n. If rows lack title/text, render label+n bars. Acceptable.

**p-fleet**: button-gated. Button "Show the fleet" (#fl-go). On click: fetch api/fleet?operator=&model= (no other filter params). Render: summary scalars + bar lists (models, tails, systems). Tails clickable → setFilter('tail', t) then show p-aircraft? Actually clicking a tail should go to the aircraft panel: setFilter('tail', code) then show('p-aircraft')? setFilter already calls show('p-search'). Hmm — setFilter is spec'd to show p-search. For tail clicks inside panels, I want p-aircraft. The machinery's tail cell click does `loadTail()` and switches to p-aircraft. I'll mimic: setFilter('tail', v); show('p-aircraft'). Two calls; search runs twice? setFilter calls search(0); show('p-aircraft') then loads aircraft panel (fetch aircraft tail). Acceptable.

**p-compare**: button-gated: "Compare" button (#cmp-go). Validate a and b chosen; if missing, inline message "Choose two to compare — nothing was fetched." (fail-closed voice).

**p-terms**: fetch glossary+facets once. Render groups: I need group labels: nature "What was found", precaution "What the crew did", discovered "How it was found", stage "Stage of flight", part_location "Where on the aircraft", corrosion "Corrosion", condition "Part condition", jasc "System (JASC)", ata "ATA chapter", maybe cracked/minhours not codes. Render each code row: `<button class="ghost">use</button>`? Click row → setFilter(field, code). Show: code (mono), label (bold), FAA wording (muted italic), note (muted), count (best effort). Also the OPGAP sentence maybe under operators? OPGAP is operator gap note — p-terms is codes; skip.

Glossary fetch shape: mirror CODES structure: object group→{code→{label,faa,note}}. I'll write normalizer: 

```js
function normGloss(g){
  // g may be {group:{code:{...}}} or [{group, code, label, faa, note}]
  const out={};
  if(Array.isArray(g)){ g.forEach(r=>{ (out[r.group||r.grp||'other'] ||= {})[r.code||r.key||r.term]=r; }); }
  else for(const grp in g){ const inner=g[grp]; if(inner && typeof inner==='object'){ if(Array.isArray(inner)) { out[grp]={}; inner.forEach(r=> out[grp][rCode(r)]=r); } else out[grp]=inner; } }
  return out;
}
```

CODES from machinery: if CODES exists, its shape is that structure — I can reuse for rendering BUT still fetch per spec. Eh — I'll fetch api/glossary in the loader (once-guarded) and normalize; if fetch fails but CODES exists, use CODES. Robust.

Facets for counts: try to build count maps: facets may be {operators:[{code,label,n}], nature:{...}, ...}. Best-effort `facetCount(grp, code)` scanning facets for arrays with matching code. To bound effort: I'll extract counts for known groups via a helper that looks in facets for key grp (or aliases: precaution→crew? group names in facets unknown). Honestly, counts here are nice-to-have; the load-bearing counts are in the selects. I'll implement `countsFromFacets(facets)` producing {group:{code:n}} by scanning: for each key in facets: if value is array of objects with code+n → map; if value is object with numeric values → map. Then use alias map {precaution:'crew', part_location:'zone'}. Reasonable.

**p-method**: static prose + api/facets injection. Prose paragraphs (write good prose in house voice):
- What this is: "Every figure on this page comes from the FAA's Service Difficulty Reporting System..." 
- What a report is: "A report is one write-up by one mechanic about one finding on one aircraft. A heavy check produces many rows about one aircraft on one day — count events, not rows."
- The cross-reference caveat (December 2006).
- Found-by-instrument caveat (B,D,E,M,T,U,X).
- Corrosion level 3 regulatory fact.
- Export cap 5,000, newest first.
- No per-report permalink; cite control number.
- Undated reports filed last; ties on control number.
- Numbers injected: total, date range, operators, tails, undated count, newest report date.
Marks: `<b class="fig" data-f="total"></b>` etc. filled from facets: keys best-effort: total, from, to, operators, tails/aircraft, undated. If facets lacks, hide the span's sentence? Inject what's available; leave em-dash placeholders as "—". Keep graceful.

Now the **tab strip markup**:

```html
<div id="views">
  <div class="vgroups" role="tablist" aria-label="Panel groups">
    <div class="vg" data-grp="narrows">
      <div class="vglab">Narrows to what you selected</div>
      <div class="vgbtns" role="tablist" aria-label="Narrows to what you selected">
        <button class="vtab" role="tab" data-view="p-search" aria-controls="p-search">Search</button>...
```

Nested tablist? Keep one tablist overall with group labels as headings — simpler: role=tablist on each group's button container is fine (multiple tablists are allowed). I'll use role=tablist per group with aria-labelledby the group label. Keyboard: arrows within a group — nice-to-have; the machinery's gridKeys is for the table. I'll add basic ArrowLeft/Right on tabs.

Group titles verbatim:
1. "Narrows to what you selected"
2. "These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel" — with N injected.
3. "Reference"

Panels container: `<div id="panels">` with 16 sections.

**CSS**. Must match house style: rust tones (#8c4a2f, #8a2a17), cream backgrounds (#fdf7f4), muted greys. I'll write CSS for: #views, .vgroups, .vg, .vglab, .vtab(.on), .panel, .scope (+variants .scope-follows/.scope-all/.scope-ignore), .pbody, .psub, .brow/.bbar/.bfill/.bn, .cards, .lead-card, .stat, .pfail, .pnote, .kv-mini, trend bars, mark? (already exists), wu? (exists), buttons ghost (exists), selects landed (exists from machinery — class "landed" styling presumably global for controls; I'll add landed sync for my selects too: on change add class). Machinery's syncControls adds landed to controls holding values — my panel selects aren't filters, so no landed. Fine.

Sticky: tabs sticky at top like the spine (top:44px? The spine sticks at top:44px; hero likely occupies 0–44). I'll make .vgroups sticky top:0 or 44px. I'll use top:44px to sit alongside the spine convention — actually spine sticks at 44 within the table area; the tab strip is above the table. I'll make the tab strip sticky at top:44px too so the reader always sees which view they're in. Reasonable.

Let me now write out option lists verbatim:

#pt-by (patterns breakdown): options (value→label):
- ata → "By system chapter"
- operator → "By airline"
- model → "By aircraft model"
- part → "By part"
- nature → "By what was found"
- crew → "By what the crew did"
- discovered → "By how it was found"

#spike-by: placeholder "Choose a grouping" (value "") + ata "By system", part "By part", model "By model", operator "By airline". (5 options total.)

#em-by: part "By part", jasc "By system", condition "By part condition", partnumber "By part number" (4).
#em-days: 120 "Last 120 days", 180 "Last 180 days", 365 "Last year" (3). Wait — "e.g. Last 180 days, Last year" — so one option is literally "Last 180 days" and another "Last year". 120: "Last 120 days". OK.

#cl-min: 3 "3 or more", 4 "4 or more", 6 "6 or more", 10 "10 or more" (4). Example listed "4 or more, 6 or more, 10 or more" + implied 3. 
#cl-kind: all "Everything", sched "Recurring, probably scheduled", event "Not recurring" (3). The example shows "Recurring, probably scheduled" as one literal label. Third unknown; I'll use "Not recurring, probably unscheduled"? Hmm. Since filtered client-side on a `kind` field, labels should describe: "Everything" / "Recurring, probably scheduled" / "One-off, probably unscheduled". I'll pick "One-off, probably unscheduled". Document.

#ag-by: hours "By hours on the airframe", cycles "By takeoff-and-landing cycles" (2). Example "By takeoff-and-landing cycles" verbatim ✓.

#cq-by: operator "By airline", model "By model", make "By manufacturer" (3). Examples "By model, By manufacturer" ✓.

#cmp-field: operator "Airlines", model "Models", make "Manufacturers" (3). Examples "Models, Manufacturers" ✓.

Sort orders: fl-op sorted by count desc (opts() convention). cmp-a/b same.

**Delegated click handler** on #views:

```js
viewsEl.addEventListener('click', e=>{
  const t=e.target.closest('[data-setk]');
  if(t){ const k=t.dataset.setk, v=t.dataset.setv;
    setFilter(k,v);
    if(k==='tail'){ show('p-aircraft'); }
    else if(CURVIEW!=='p-search' && FF.includes(CURVIEW)){} // stays? setFilter shows p-search anyway
    return;
  }
  ...
});
```

Note setFilter always jumps to p-search (that's the machinery contract). For tail I additionally switch to p-aircraft after (mirroring table behavior). For other clicks, the machinery contract stands — reader lands on the search table showing their narrowing. Good and consistent.

But — should clicking a bar in an ignore panel jump to p-search? Yes! That's the honest flow: the panel ignores selection; to act on a figure you narrow the search. Good.

Bar row markup:

```html
<button type="button" class="brow" data-setk="operator" data-setv="SWAA">
  <span class="bl">Southwest Airlines Co (SWAA)</span>
  <span class="bb"><span class="bf" style="width:63%"></span></span>
  <b class="bn">12,345</b>
</button>
```

Buttons give free keyboard accessibility (machinery's makeReachable would also catch them but buttons are already fine — makeReachable targets non-button [onclick]).

Trend markup: `.trend` with `.tb` columns, each `.tb` height proportional, title tooltip, data-setk? Clicking a month sets from+to — needs two setFilter calls; my delegation handles single k/v. Special-case data-month attr:

```js
const m=e.target.closest('[data-month]');
if(m){ const y=m.dataset.month.split('-'); setFilter('from', `${m.dataset.month}-01`); setFilter('to', lastDay(...)); aim?...}
```

Two setFilter calls = two searches pushed (two history entries). Slightly noisy. Alternative: set both el values directly then call search(0)? But setFilter is "the universal" — I don't have a batch API. I'll set el('from').value and el('to').value then call search(0) — uses existing helpers without double history. But "state is the DOM inputs" — writing inputs directly is exactly the pattern (setFilter itself just writes el + search). I'll do: `setTwo('from',a,'to',b)` helper: writes both els, then search(0), showChange? showChange is machinery's; setFilter calls it. My helper: after writing both, call search(0) — but the URL update inside search covers both. And syncControls/ landed classes: call if exists. OK:

```js
function setRange(a,b){ const f=el('from'), t=el('to'); if(f) f.value=a; if(t) t.value=b; if(typeof syncControls==='function') syncControls(); search(0); }
```

Guard syncControls existence. Also note: search() itself handles URL/pushState/showChange presumably (machinery's search: "search(off): p=params()+..., URL..., pushState..."). showChange is called by setFilter per spec — but maybe search also does. I'll call setFilter-style: hmm, setFilter(k,v) does el set + show + search + showChange. My setRange replicates minus show (already on the panel? The user clicked a month bar in p-patterns; they should jump to p-search to see rows — setFilter contract shows p-search. I'll mimic: setRange does search(0) and show('p-search')? show('p-search') just activates the tab; fine, call it for consistency.)

OK.

**Aircraft panel specifics:**

```js
function loadAircraft(){
  const box=el('p-aircraft-body');
  const tail=(params().get('tail')||'').replace(/^N/i,'');
  // half 1: repeat offenders (follows filter) — always fetch
  fetchJ('api/repeat-offenders?'+params()).then(rows=> paint offenders).catch(...);
  // half 2: tail summary
  if(tail) fetchJ('api/aircraft/'+encodeURIComponent(tail)).then(paint summary).catch(...)
  else paint lookup form
}
```

Scope line for p-aircraft (my departure): 

`The aircraft history answers from <strong>all reports</strong>, whatever you have selected; the repeat offenders list follows your selection.` — Hmm, but when no tail is named and no filter... Keep: 

- If a selection exists: `The tail history answers from <strong>all N reports</strong>, not your selection (${fw}); the repeat offenders list follows your selection.`
- unfiltered: `All N reports.`? For simplicity: if unfiltered → `All N reports.` (same as others).

Let me write scopeLine:

```js
function scopeLine(id){
  if(id==='p-search') return '';
  const T=totalN(), fw=selectionWords();
  if(id==='p-aircraft'){
    return fw ? `The tail history answers from <strong>all ${num(T)} reports</strong>, not your selection (${fw}); the repeat offenders list <em>does</em> follow your selection.`
              : `All ${num(T)} reports.`;
  }
  if(FF.includes(id)){
    const n=selN();
    return n>0 ? `Showing <strong>your selection</strong>, ${num(n)} reports.`
               : `Showing <strong>your selection</strong>, which matches no report.`;
  }
  return fw ? `This view always answers for <strong>all ${num(T)} reports</strong>. It does not narrow to your current selection (${fw}).`
            : `All ${num(T)} reports.`;
}
```

paintScope(id): find `.scope[data-scope=id]` set innerHTML. Also add class for styling: scope-follows / scope-ignore / scope-ref? I'll set class by group: `scope g-narrows|g-ignore|g-ref`.

Also repaint all scopes on #count mutation.

**Boot sequence for my block:**

```js
mountViews();           // build strip + shells
if CURVIEW set by earlier calls? — show called before mount: my show guards element absence; after mount, sync tabs to CURVIEW.
ensureObserver();       // #count observer
```

Also initial view: which tab is on at boot? p-search presumably (the machinery's setFilter/search call show('p-search')). Default CURVIEW='p-search'.

**history/popstate**: machinery handles? show(view) — view param in URL (URL_KNOWN includes 'view'). On popstate or boot with ?view=..., should restore. Machinery's boot restores fields; view restore: my boot reads u.get('view') — I don't have the boot URLSearchParams... I can read location.search myself at mount: `const v=new URLSearchParams(location.search).get('view')`. If valid panel id, show(v) (after mount). Careful: search half may also manage view. I'll do it guarded: only switch if different from CURVIEW. Good — a shareable link to p-terms should open p-terms.

Also popstate listener for view changes? The machinery pushes hero/case params. I'll add a popstate listener that reads ?view= and shows it. Low risk. Add.

Now — writing everything. Also must include "Say where the markup goes" — prose: the whole block appends one wrapper `<div id="views">` to `<main>` (or after `#count`'s parent if present); all markup is JS-generated at boot; no static HTML to paste. Also say it expects to be the last block inside the IIFE.

Wait, one more check-item: "Switching to a tab fetches its endpoint once, and not before." My lazy design satisfies: no fetch until show; LOADED guard prevents repeats (for ignore panels; follows panels refetch only when params changed — strictly "once" unless selection changed, which is a different selection; I'll note that).

"With a zone filter set, a panel in the 'ignore' group says so in its own words and still reports the whole-corpus figure." — scope line with filterWords + no filter params sent. ✓. But "still reports the whole-corpus figure" — e.g., p-structure shows level counts for whole corpus. ✓ since I don't send params.

"Every select the specification names, populated from the API, sorted the way it says, and labelled with its report count." — fl-op from facets sorted count desc labelled "Name (CODE) (12,345)"; the fixed selects in spec order. ✓ (fixed ones aren't API-populated — they're mode switches; I'll note that the count-labelled API-populated select is fl-op, matching opts() convention; and cmp-a/b similarly when facets provides lists.)

Hmm wait — re-read: "Every select the specification names, populated from the API, sorted the way it says, and labelled with its report count." Maybe the checker will look at ALL nine selects and expect counts... but "Last 180 days" can't have a report count. The sentence must refer to the selects whose options come from data (fl-op; and in the machinery's list the coded pickers). I'll make sure fl-op is perfect and also populate cmp pickers with counts. For the mode selects, verbatim labels. That's the only coherent reading.

Now — code size. This is going to be big. Let me write it tightly but completely. I'll aim for a single JS block (with a tiny CSS string injected via <style> by JS — self-contained; "One self-contained block: markup, CSS and JavaScript" — I can emit `<style>` + markup via JS template. I'll inject the CSS with a style tag from JS (id="views-css") so it's one drop-in block. Also, since it's inside an IIFE, I can't include <style> tags literally in JS unless via injection — I'll do `document.head.appendChild(styleEl)`. Or I can present the answer as HTML `<style>...</style><script>...</script>` — but it must drop INSIDE the IIFE... "One self-contained block: markup, CSS and JavaScript, dropping into the existing page below the search half, inside the same IIFE". So it's all JS. CSS injected via a style element. Fine.

Let me define the CSS (concise but complete):

```css
#views{margin:18px 0 40px}
.vgroups{position:sticky;top:44px;z-index:30;display:flex;gap:18px;flex-wrap:wrap;background:var(--paper,#fbf6f1);border-bottom:1px solid #e4d3c8;padding:6px 0 0}
.vg{display:flex;flex-direction:column}
.vglab{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#8b7f76;padding:2px 0 3px}
.vg[data-grp="ignore"] .vglab{color:#8c4a2f;max-width:340px;white-space:normal;line-height:1.35;text-transform:none;letter-spacing:0;font-size:11.5px}
.vgbtns{display:flex;gap:2px;flex-wrap:wrap}
.vtab{appearance:none;border:1px solid transparent;border-bottom:none;background:none;font:inherit;font-size:13px;padding:6px 11px;border-radius:6px 6px 0 0;color:#5f534b;cursor:pointer}
.vtab:hover{color:#8a2a17}
.vtab.on{background:#fff;border-color:#e4d3c8;color:#8a2a17;font-weight:600;box-shadow:0 1px 0 #fff}
.panel{background:#fff;border:1px solid #e4d3c8;border-top:none;padding:16px 18px 22px;border-radius:0 0 8px 8px}
.panel h2{font-size:19px;margin:2px 0 4px;color:#3d2f27}
.scope{font-size:13px;color:#6f6a63;border-left:3px solid #d8c3b6;padding:4px 10px;margin:6px 0 14px;background:#fdf7f4}
.scope strong{color:#8a2a17}
.psub{color:#6f6a63;font-size:13px;margin:0 0 12px;max-width:70ch}
.pbody .ctl{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:10px 0 16px}
.pbody label{font-size:12px;color:#6f6a63;display:block;margin-bottom:3px}
.pnote,.pfail{font-size:13px;color:#6f6a63}
.pfail{color:#8a2a17;background:#fdf1ec;border:1px solid #f0d5cb;padding:8px 10px;border-radius:4px}
.brow{display:grid;grid-template-columns:minmax(140px,320px) 1fr auto;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid #f1e6de;padding:5px 2px;font:inherit;font-size:13px;cursor:pointer;color:inherit}
.brow:hover{background:#fdf7f4}
.brow.plain{cursor:default}
.brow .bl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bb{display:block;height:9px;background:#f3e7de;border-radius:2px;overflow:hidden}
.bf{display:block;height:100%;background:#b0653f}
.bn{color:#8a2a17;font-variant-numeric:tabular-nums}
.stat{display:inline-block;border:1px solid #e4d3c8;border-radius:6px;padding:8px 14px;margin:0 10px 10px 0;background:#fdf7f4;text-align:left}
.stat b{display:block;font-size:22px;color:#8a2a17}
.stat span{font-size:12px;color:#6f6a63}
button.stat{cursor:pointer}
button.stat:hover{border-color:#b0653f}
.trend{display:flex;align-items:flex-end;gap:2px;height:110px;margin:8px 0 2px}
.tb{flex:1 1 0;min-width:3px;background:#c98a63;border-radius:2px 2px 0 0;cursor:pointer}
.tb:hover{background:#8a2a17}
.taxis{display:flex;justify-content:space-between;font-size:11px;color:#8b7f76}
.lead{border:1px solid #e4d3c8;border-radius:6px;padding:10px 14px;margin:0 0 10px;background:#fffdfb}
.lead h3{margin:0 0 4px;font-size:15px;color:#3d2f27}
.lead p{margin:0;font-size:13.5px;color:#5f534b}
.lead .lfig{color:#8a2a17;font-weight:700}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:820px){.twocol{grid-template-columns:1fr}}
.ggrp{margin:18px 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8c4a2f;border-bottom:1px solid #e4d3c8;padding-bottom:3px}
.grow{display:grid;grid-template-columns:auto 1fr auto;gap:10px;padding:6px 2px;border-bottom:1px solid #f1e6de;font-size:13px;align-items:baseline}
.grow .gc{font-family:ui-monospace,monospace;color:#8c4a2f;font-size:12px}
.grow .gl b{font-weight:600}
.grow .gf{color:#8b7f76;font-style:italic}
.grow .gnote{color:#8b7f76;font-size:12px}
.grow button... use .brow? grows clickable via delegation data-setk; make them <button class="grow">.
```

Enough CSS. Also `.vg[data-grp=ignore] .vglab` — the ignore label is long; set max-width and normal case. On narrow screens, groups stack.

Now write the JS. Let me draft carefully, watching for correctness.

```js
/* ================= PART 3 — the fifteen panels, the tab strip, the scope lines =================
   Drop-in as the LAST block inside the same IIFE (below the search half).
   Markup: everything is generated at boot into ONE wrapper <div id="views">, inserted after
   the instrument (the element that contains #count) if that can be found, otherwise appended
   to <main>, otherwise to <body>. Move the single mountViews() call if the layout wants it
   elsewhere. No static HTML needs pasting.
   Assumes from the earlier briefs: params(), setFilter(), search(), el(), esc(), num(),
   TOTAL, heroData, FOLLOWS_FILTER, filterWords(), code(), aim(), syncControls(), showChange().
   Every one of those is guarded, so a missing helper degrades instead of breaking the page.
============================================================================================ */
```

Then:

```js
(function(){ ... })(); // no — inside existing IIFE, so no new IIFE needed. But to avoid leaking names into the shared IIFE scope... shared scope already has many names; I'll prefix mine or wrap in a nested IIFE for hygiene. Nested IIFE inside the same IIFE is fine and keeps my locals private while seeing their scope. I'll wrap: (function(){ ... })(); — but then show() must be visible to earlier briefs' calls! setFilter calls show('p-search'). If show is inside my nested IIFE, their setFilter can't see it — UNLESS show is declared in the outer IIFE scope by them... They were told "call them, do not redefine" for MY functions? No — they were told to assume I provide show? Actually the checklist for THEM isn't given. The spec says setFilter(k,v): el(k).value=v; show("p-search"); ... — machinery calls show. If I nest show privately, their setFilter breaks (ReferenceError) — unless they guard. Risky.

So show MUST be in the shared IIFE scope (function declaration at top level of my block, not nested). Then all my other helpers can also be top-level names — risk of collision with their names (e.g., if they defined `mount()` or `paint()`). I'll prefix most helpers with `v` (views) or distinctive names: vFetch, vBar, vScope... and keep public surface minimal: show() (required), plus maybe viewInit(). I'll name helpers: viewFetch, rowLabel, rowN, barListHTML, paintScope, scopeLine, mountViews, LOADERS... LOADERS as const is fine.

But wait — if THEIR code (brief 2) also defines show() (maybe they built a placeholder), my later function declaration overrides theirs — last wins, and mine is the real one. Good, mine is last.

If THEIR boot code calls show() at their script-eval time (before my block runs) — function declarations hoist to the top of the IIFE regardless of position, so show exists even during their boot. But my PANELS/LOADERS consts initialize when my block executes — if their boot runs at their block time and calls show('p-search'), my show references LOADERS (TDZ — const not yet initialized → ReferenceError!). TDZ danger. Guard: make LOADERS a function-declared object or use var, or lazy-init inside show. I'll declare with `var PANELS = ...`? var hoists as undefined → show reading undefined.LOADERS crashes. Safer: inside show, guard `if(!READY) { remember CURVIEW; return; }` — set READY=true after mountViews(). And CURVIEW declared with var at top. Then any early show() just records CURVIEW; mountViews applies it. 

Also setFilter→show('p-search') during their boot: records CURVIEW='p-search' (default anyway). After my mount, boot's ?view= restore: I read location.search at mount; but their boot may have already pushed state... The machinery's search() writes location.search minus FIELDS plus params + hero — preserving view. At mount time, location.search reflects their boot search (or original link). Reading it then is fine.

Let me now also handle: their search() might call show('p-search') on every search → my show repaints p-search scope (blank) + tab states — cheap. Also paints nothing else. OK.

One more: the machinery spec says setFilter calls show("p-search") — but if the user is reading p-terms and clicks a chip removal... they'd jump to p-search. That's the machinery's contract, fine.

Now writing the full code. I'll be systematic.

```js
/* ---------- PART 3: panels, tab strip, scope lines ---------- */

var VIEW_READY = false, CURVIEW = 'p-search', VIEW_MNT = null;
var VIEW_LOADED = {};           // panel id -> params string it was loaded for
var VIEW_MOUNTED = false;

var VIEW_TOTAL = function(){
  try{ if(typeof TOTAL==='number' && TOTAL) return TOTAL; }catch(_){}
  try{ if(heroData && heroData.total) return heroData.total; }catch(_){}
  return 0;
};
function viewSelN(){
  try{ if(typeof LAST_TOTAL!=='undefined' && LAST_TOTAL!=null) return LAST_TOTAL; }catch(_){}
  try{ if(heroData && heroData.total!=null) return heroData.total; }catch(_){}
  return 0;
}
```

Hmm, TOTAL via typeof in same scope: if declared with const later in their code, typeof before init throws TDZ? `typeof x` on a let/const in TDZ THROWS. Yes — TDZ makes typeof throw. So my guards using typeof can throw if their declarations are later in the IIFE and not yet executed... but my code only RUNS after mount (their code fully executed by then, since my block is last and boot happens in their block... wait — their boot might be deferred to DOMContentLoaded or run immediately; either way, by the time user clicks tabs, their consts are initialized. But their boot calling show() during their block execution, while MY consts (later in file) are in TDZ → my show must not touch my consts until initialized. VIEW_READY is var (hoisted, undefined→falsy) ✓. CURVIEW var ✓. Inside show, before READY, only touch CURVIEW → safe. After mount (my consts initialized), fine. And typeof TOTAL etc. run only in loaders/scope paints, post-mount. ✓.

Also FOLLOWS_FILTER: `var FF = null;` set in mount: `FF = (typeof FOLLOWS_FILTER!=='undefined' && FOLLOWS_FILTER) ? FOLLOWS_FILTER : ['p-search','p-patterns','p-found'];` — at mount time their const exists. But typeof on const AFTER init is fine. ✓.

el(): if their el exists use it, else define locally? If I define `function el(){}` and they also defined `function el(){}`, mine (later) wins — same implementation presumably (getElementById). "do not redefine" — el wasn't in the don't-redefine list (params, setFilter, search, chips, record table). But redefining el could break if theirs has extra behavior. I'll use my own `vid(id)` wrapper = document.getElementById. Avoid collision entirely. Similarly esc/num: I need them. Redefining esc is dangerous? esc is a trivial HTML-escape; if theirs exists, great. I'll write guards:

```js
function vesc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
```

Hmm — but "using the existing helpers". The safest interpretation: use existing ones where certain (params, setFilter, search, el), and self-provide tiny local aliases prefixed to avoid redefinition: I'll use existing el if available at call time: `function vEl(id){ return (typeof el==='function'? el(id) : document.getElementById(id)); }` — typeof el after their init fine. But el might be defined by them AFTER my block? They're earlier. Function declarations hoist — el exists even if defined textually earlier. ✓. For num/esc similar guarded wrappers: vnum, vesc call theirs if present else fallback. This is defensive but keeps the guarantee "call them, do not redefine them".

Actually, simpler and honest: I'll use their helpers directly (esc, num, el, params, setFilter, search) since the page exists and brief 1 built the instrument with these. And provide guarded fallbacks ONLY for the ones whose existence is less certain (filterWords, code, aim, syncControls, showChange, TOTAL, heroData, LAST_TOTAL, FOLLOWS_FILTER). For esc/num/el I'll trust them — the whole page uses them (specs reference esc(), num(), el(k) constantly). Risk accepted; note it? The instruction says assume params/setFilter/search/chips/table; helpers esc/num/el are "existing helpers" — fine.

Hmm, but to be really safe against a missing num() crash in some panel, I'll define local `n_` fallback: `function nfmt(x){ try{ return num(x); }catch(_){ return Number(x||0).toLocaleString('en-US'); } }` — cheap insurance, no redefinition. I'll use nfmt everywhere. Same `h_` for esc: `function hesc(s){ try{ return esc(s); }catch(_){ return local escape; } }` — try/catch around esc each call is ugly; do typeof check once: `var _esc = typeof esc==='function' ? esc : function(s){...}; var _num = typeof num==='function' ? num : ...;` — but typeof on their function declarations: functions (not let/const) → typeof safe anytime. If they used const esc = ... TDZ issue only if my code runs before init — only at mount, which runs at my block execution, which is after theirs. But wait: if their esc is a function declaration, hoisted, fine; if const, initialized by the time my block runs (their block executed first). Either way fine. So:

```js
var H = (typeof esc==='function') ? esc : (s=>String(s==null?'':s).replace(/[&<>"']/g,...));
var N = (typeof num==='function') ? num : (x=>Number(x||0).toLocaleString('en-US'));
var E = (id)=> (typeof el==='function' ? el(id) : document.getElementById(id));
```

var initializers run at my block execution — after theirs — safe even for const-declared esc (already initialized). ✓

filterWords: `function selWords(){ try{ if(typeof filterWords==='function'){ var s=filterWords(); if(s) return s; } }catch(_){} ... fallback building from params() ... }`

Fallback selection words (compact):

```js
var p=params(); var bits=[];
var q=p.get('q'); if(q) bits.push('where a mechanic wrote "'+q+'"');
var op=p.get('operator'); if(op) bits.push('operator '+op);
... tail: 'N'+tail; minhours: N+' hours or more on the airframe'; cracked: 'with cracking recorded';
from/to: 'from '+pretty to '+';
coded: k+' '+v (raw) — fallback is best effort.
return bits.join(', ');
```

Use try/catch around params() too (params defined by them — function or const? if const arrow and my block runs after theirs, fine).

prettyDate: guard similarly: `function pdate(s){ try{ if(typeof prettyDate==='function') return prettyDate(s); }catch(_){} return s||''; }`

code(): `function vcode(grp,v){ try{ if(typeof code==='function'){ var r=code(grp,v); if(r) return r; } }catch(_){} return null; }` — code(grp,v) returns label string presumably. For chips: "nature/discovered/stage/condition/corrosion->code()". Signature code(group, value) returns label. ✓ guess.

aim(): guarded: `function vaim(t){ try{ if(typeof aim==='function') aim(t); }catch(_){} }`.

fetch helper:

```js
function vget(url){ return fetch(url, {headers:{'Accept':'application/json'}}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
```

Panel meta:

```js
var PANELS = {
 'p-search':      {lab:'Search',                grp:'narrows'},
 'p-patterns':    {lab:'Patterns',              grp:'narrows'},
 'p-aircraft':    {lab:'Aircraft',              grp:'narrows'},
 'p-found':       {lab:'How it was found',      grp:'narrows'},
 'p-fleet':       {lab:'Fleet',                 grp:'ignore'},
 'p-leads':       {lab:'Story leads',           grp:'ignore'},
 'p-emerging':    {lab:'New defects',           grp:'ignore'},
 'p-clusters':    {lab:'Same day, many aircraft',grp:'ignore'},
 'p-defect':      {lab:'Same defect',           grp:'ignore'},
 'p-structure':   {lab:'Corrosion & cracks',    grp:'ignore'},
 'p-age':         {lab:'Old airframes',         grp:'ignore'},
 'p-engines':     {lab:'Engines',               grp:'ignore'},
 'p-consequences':{lab:'What the crew did',     grp:'ignore'},
 'p-compare':     {lab:'Compare',               grp:'ref'},
 'p-terms':       {lab:'Every code explained',  grp:'ref'},
 'p-method':      {lab:'Method',                grp:'ref'}
};
var VIEW_ORDER = Object.keys(PANELS); // but preserve insertion order — object literal keys in order ✓ (16)
var GROUPS = [
 {id:'narrows', lab:'Narrows to what you selected'},
 {id:'ignore',  lab:'These ignore your selection. Each answers from all <b data-gtotal>…</b> reports, or from a slice you set inside the panel'},
 {id:'ref',     lab:'Reference'}
];
```

Wait group2 title verbatim: "These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel". With N injected. I'll render `<span data-gtotal>…</span>` replaced by num(TOTAL) when known (and repainted by observer since TOTAL could fill after facets load — TOTAL is corpus const from brief 1; likely available. I'll paint from VIEW_TOTAL() at mount and on each paintScope pass).

LOADERS:

```js
var LOADERS = {
 'p-patterns': loadPatterns,
 'p-aircraft': loadAircraft,
 'p-found': loadFound,
 'p-fleet': buildFleet,      // shell + controls only; fetch on #fl-go
 'p-leads': loadLeads,
 'p-emerging': loadEmerging,
 'p-clusters': loadClusters,
 'p-defect': loadDefect,
 'p-structure': loadStructure,
 'p-age': loadAge,
 'p-engines': loadEngines,
 'p-consequences': loadConsequences,
 'p-compare': buildCompare,  // shell + controls; fetch on #cmp-go
 'p-terms': loadTerms,
 'p-method': loadMethod
};
```

show():

```js
function show(id){
  if(!PANELS || !PANELS[id]) { CURVIEW = id || CURVIEW; return; }  // wait PANELS is var—hoisted undefined before my block runs. guard: if(!VIEW_READY){ CURVIEW=id||'p-search'; return; }
  CURVIEW = id;
  document.querySelectorAll('#views .vtab').forEach(...on class...);
  VIEW_ORDER.forEach(pid => { const s=E(pid); if(s) s.hidden = pid!==id; });
  var ldr = LOADERS[id];
  if(ldr && id!=='p-fleet' && id!=='p-compare'){
    var key = (FF.indexOf(id)>=0) ? pstr() : 'once';
    if(VIEW_LOADED[id]!==key){ VIEW_LOADED[id]=key; try{ ldr(); }catch(err){ panelFail(id, err); } }
  }
  if(id==='p-fleet' && !VIEW_LOADED[id]){ buildFleet(); }   // build controls once, no fetch
  if(id==='p-compare' && !VIEW_LOADED[id]){ buildCompare(); }
  paintScope(id);
}
```

Hmm — buildFleet/buildCompare idempotent: VIEW_LOADED[id]='shell'. Let me unify: for fleet/compare, loader builds shell only; mark VIEW_LOADED[id]='shell'; button click runs fetch function. Cleaner:

```js
if(ldr){
  var key = (id==='p-fleet'||id==='p-compare') ? 'shell' : (FF.indexOf(id)>=0 ? pstr() : 'once');
  if(VIEW_LOADED[id]!==key){ VIEW_LOADED[id]=key; try{ldr();}catch(e){panelFail(id,e);} }
}
```

pstr(): `try{ return params().toString(); }catch(_){ return new URLSearchParams(location.search).toString(); }` — params() might include limit/offset? No—params() is FIELDS only. ✓

panelFail(id, err): write into body: `This panel did not load (HTTP error). It is left empty rather than showing a figure from an earlier run of the page. Retry` + button retry (clears VIEW_LOADED and calls loader).

Mount:

```js
function mountViews(){
  if(VIEW_MOUNTED) return; VIEW_MOUNTED = true;
  FF = (typeof FOLLOWS_FILTER!=='undefined' && FOLLOWS_FILTER) ? FOLLOWS_FILTER.slice() : ['p-search','p-patterns','p-found'];
  var wrap = document.createElement('div'); wrap.id='views';
  // tab strip
  var strip = document.createElement('div'); strip.className='vgroups'; strip.id='vstrip';
  GROUPS.forEach(g=>{ ... });
  // panels
  var pc = document.createElement('div'); pc.id='panels'; pc.className='panels';
  VIEW_ORDER.forEach(pid=>{ if(E(pid)) { /* exists (search half made it) — leave it, but ensure it's inside? */ } });
```

Hmm — if #p-search already exists elsewhere in the DOM (built by brief 2), moving it into my #panels could break their code that references it? References by id survive moves. Moving is fine and keeps panels together. I'll adopt existing sections: `var sec = E(pid) || makeSection(pid)`; append sec into pc (appendChild moves it). For adopted p-search, ensure it has a scope div? p-search scope is blank — skip. Ensure hidden state managed — show() toggles hidden on all; their content inside remains. But careful: if their p-search section has its own classes/layout, adding .panel class might disturb; I'll only add class if section was created by me.

Order note: the checklist says "All 16 panel ids present" — adoption handles both cases.

Section builder:

```js
function makeSection(pid){
  var m=PANELS[pid], s=document.createElement('section');
  s.id=pid; s.className='panel'; s.hidden = pid!=='p-search';
  if(pid!=='p-search'){
    s.innerHTML = '<div class="scope" data-scope="'+pid+'"></div>' +
      '<h2>'+H(m.lab)+'</h2>' + (SUBS[pid]?'<p class="psub">'+SUBS[pid]+'</p>':'') +
      '<div class="pbody" id="'+pid+'-body"></div>';
  }
  return s;
}
```

SUBS: short honest subtitle per panel (one line describing what it answers) — this strengthens the "says so in its own words" requirement. E.g.:
- p-patterns: 'The shape of your selection over time, and what it is made of.'
- p-found: 'How the findings in your selection came to light — by a person looking, or by an instrument.'
- p-fleet: 'One operator's fleet, or one model, across the whole file. Choose the slice here.'
- p-leads: 'Angles worth checking, computed on everything published — not on your selection.'
- p-emerging: 'Part trouble that is suddenly more common than it was. Whole corpus.'
- p-clusters: 'Days when many different aircraft reported at once. Whole corpus.'
- p-defect: 'The same finding, written the same way, on many aircraft. Whole corpus.'
- p-structure: 'Corrosion and cracking across everything published.'
- p-age: 'How trouble distributes across airframe age. Whole corpus.'
- p-engines: 'Engine and APU trouble across everything published.'
- p-consequences: 'What crews did, grouped the way you choose. Whole corpus.'
- p-compare: 'Two operators, models or manufacturers, side by side, from the whole file.'
- p-terms: 'Every code the FAA uses on this form, with its own wording and its note.'
- p-method: 'Where the file comes from, what was done to it, and what that limits.'

These are my words — the spec says "what each panel shows" is named in the spec, which I don't have verbatim; these subtitles are consistent. OK.

Insert wrap: 

```js
var host = document.getElementById('count');
var anchor = host ? host.parentElement : null;
// insert after the instrument block: find the instrument's container.
```

Simplest: append wrap to `document.querySelector('main')||document.body`, then try to reposition: if there's an element #count, move wrap after the element that contains both #count and the record table? Over-engineering. I'll do: 

```js
var main = document.querySelector('main') || document.body;
main.appendChild(wrap);
// If the search table's container can be identified, sit above it; otherwise end of main is fine.
var tbl = main.querySelector('table');
```

Hmm — actually layout-wise the panels below the table is fine ("dropping into the existing page below the search half"). Tab strip sticky makes navigation fine. I'll append at end of main and note relocation is one line. But sticky top:44 with tabs at the very bottom means you don't see tabs until scrolled there... The instrument is tall (hero). Hmm. Placement matters for usability: tabs should be reachable. I'll insert the wrap right after the element containing #count if found:

```js
var cnt = E('count');
if(cnt){ var block = cnt.closest('section,div'); block.parentNode.insertBefore(wrap, block.nextSibling); }
else (document.querySelector('main')||document.body).appendChild(wrap);
```

cnt.closest('section') might be the count bar container; inserting after it puts tabs between count bar and the caption/table? The caption (.cut) and table are presumably siblings after #count's block. Then panels sit between count bar and table — wrong (table belongs to p-search which is a panel!). Ugh — actually maybe that's RIGHT: in the rebuilt page, the record table IS p-search's content, living inside the p-search panel. Brief 2 renders the table inside #p-search presumably (or near it). If their table is inside #p-search section, then #count likely lives inside p-search too (the count line is the table's caption area). Then inserting after #count's block would put my tabs INSIDE their panel — wrong.

Since I can't know, the robust choice: append #views at the end of <main> (below the search half — literally what the brief says: "dropping into the existing page below the search half"). And try: if E('p-search') exists and has a parent, insert my wrap immediately after the p-search section... but p-search is adopted INTO my panels container. Chicken-egg. 

Final: adopt-then-place: build everything, adopt #p-search into my container, then place the whole #views wrapper right after wherever #p-search USED to live (record its previous parent/sibling before adoption). That puts tabs+panels exactly below the search half. If #p-search doesn't exist, append to main. 

```js
var ps = E('p-search'), ref=null, refParent=null;
if(ps && ps.parentNode){ refParent=ps.parentNode; ref=ps.nextSibling; }
...build, adopt ps...
if(refParent) refParent.insertBefore(wrap, ref); else (document.querySelector('main')||document.body).appendChild(wrap);
```

Good — "say where the markup goes": immediately after the search half's own container (the former position of #p-search's parent block), else end of main. And note it's one line to move.

Hmm wait — if their p-search is nested deep (inside a section with hero above), inserting after the p-search element puts my strip between p-search and whatever followed. Fine.

Tab strip build:

```js
GROUPS.forEach(function(g){
  var gd=document.createElement('div'); gd.className='vg'; gd.setAttribute('data-grp',g.id);
  var gl=document.createElement('div'); gl.className='vglab'; gl.id='vglab-'+g.id; gl.innerHTML=g.lab;
  gd.appendChild(gl);
  var btns=document.createElement('div'); btns.className='vgbtns'; btns.setAttribute('role','tablist'); btns.setAttribute('aria-labelledby','vglab-'+g.id);
  VIEW_ORDER.filter(pid=>PANELS[pid].grp===g.id).forEach(function(pid){
    var b=document.createElement('button');
    b.type='button'; b.className='vtab'; b.setAttribute('role','tab'); b.id='vtab-'+pid;
    b.setAttribute('aria-controls',pid); b.setAttribute('data-view',pid);
    b.textContent=PANELS[pid].lab;
    b.addEventListener('click',function(){ show(pid); });
    btns.appendChild(b);
  });
  gd.appendChild(btns); strip.appendChild(gd);
});
```

Keyboard arrows on tabs: add keydown on strip: ArrowRight/Left move focus+activate among all tabs flat. I'll implement simply over all .vtab in DOM order.

Panels container: `var pc=document.createElement('div'); pc.id='panels';` adopt/create sections, append. Then wrap.appendChild(strip); wrap.appendChild(pc).

Then boot view from URL: `var want=new URLSearchParams(location.search).get('view'); if(want&&PANELS[want]&&want!==CURVIEW) CURVIEW=want;` then `show(CURVIEW)` — but careful: show at mount triggers loader for CURVIEW — if it's p-search, no loader ✓. If link had view=p-terms, loads p-terms on boot — correct (shareable link).

Wait — show() at mount with VIEW_READY: set VIEW_READY=true before show. And popstate:

```js
window.addEventListener('popstate', function(){ var v=new URLSearchParams(location.search).get('view'); if(v&&PANELS[v]&&v!==CURVIEW) show(v); });
```

Machinery also has popstate handling for hero/case; mine only reads view. OK.

paintScope:

```js
function paintScope(id){
  var s=document.querySelector('.scope[data-scope="'+id+'"]'); if(!s) return;
  var m=PANELS[id], n=VIEW_TOTAL();
  s.className='scope g-'+m.grp;
  s.innerHTML = scopeLine(id);
  // also refresh group total label
  var gt=document.querySelector('[data-gtotal]'); if(gt && n) gt.textContent=N(n);
}
```

And paintAllScopes() loops all panel ids (used by observer). The observer on #count: 

```js
function watchCount(){
  var c=E('count'); if(!c){ setTimeout(watchCount,400); return; }
  var last=c.textContent;
  new MutationObserver(function(){ if(c.textContent!==last){ last=c.textContent; paintAllScopes(); } }).observe(c,{childList:true,characterData:true,subtree:true});
}
```

Defer start: setTimeout(watchCount, 600). Hmm—also selection changes might not rewrite #count if nothing filtered? search() always renders count line ("N reports match" / "nothing filtered yet") → text changes. Good enough. Additionally I'll repaint scopes whenever show() runs for any panel (already) — and since setFilter jumps to p-search, when the user returns to an ignore panel show() repaints its scope anyway! Actually that alone covers it: returning to the panel repaints scope with current selection. The observer is belt-and-braces for the case where the panel is VISIBLE when filters change — can that happen? Filters live in the instrument above; setFilter always shows p-search. So a visible ignore panel never sees a filter change except via back/forward (popstate → machinery re-renders; my popstate handler repaints current view's scope). I'll keep the observer anyway — cheap and covers drift-repair repaints. Fine.

scopeLine():

```js
function scopeLine(id){
  if(id==='p-search') return '';
  var Tn=VIEW_TOTAL(), fw=selWords();
  if(id==='p-aircraft'){
    if(!fw) return 'All '+N(Tn)+' reports. The tail history below answers from all of them; so does the repeat-offender list while nothing is selected.';
    return 'The tail history answers from <strong>all '+N(Tn)+' reports</strong>, not from your selection ('+fw+'). The repeat-offenders list <em>does</em> follow your selection.';
  }
  if(FF.indexOf(id)>=0){
    var n=viewSelN();
    return n>0 ? 'Showing <strong>your selection</strong>, '+N(n)+' reports.'
               : 'Showing <strong>your selection</strong> &mdash; it matches no report, so there is nothing to show.';
  }
  return fw ? 'This view always answers for <strong>all '+N(Tn)+' reports</strong>. It does not narrow to your current selection ('+fw+').'
            : 'All '+N(Tn)+' reports.';
}
```

Good — three forms + aircraft special + p-search blank.

Now loaders. Common helpers:

```js
function body(id){ var b=E(id+'-body'); return b; }
function pfail(id,msg){ var b=body(id); if(b) b.innerHTML='<p class="pfail">This panel did not load: '+H(msg||'the endpoint did not answer')+'. It is left empty rather than showing a figure computed for an earlier selection. <button type="button" class="ghost" data-retry="'+id+'">Try again</button></p>'; }
```

Retry: delegation in view click handler: `[data-retry]` → delete VIEW_LOADED[id]; show(id) again... but VIEW_LOADED[id] currently equals key, so show won't reload; must delete first: `delete VIEW_LOADED[id]; LOADERS[id] && LOADERS[id]();` plus repaint scope. OK.

Row normalization:

```js
function rL(r){ return r.label!=null?r.label : r.name!=null?r.name : r.term!=null?r.term : r.title!=null?r.title : r.bucket!=null?r.bucket : r.month!=null?r.month : r.phrase!=null?r.phrase : r.key!=null?r.key : (r.code!=null?r.code:''); }
function rN(r){ var v = r.n!=null?r.n : r.count!=null?r.count : r.total!=null?r.total : r.reports!=null?r.reports : 0; return Number(v)||0; }
function rC(r){ return r.code!=null?r.code : (r.value!=null?r.value : rL(r)); }
function firstArr(o){ if(Array.isArray(o)) return o; if(!o||typeof o!=='object') return [];
  var names=['rows','items','results','data','list','leads','spikes','buckets','values','groups','clusters','phrases','offenders','models','tails','parts','levels'];
  for(var i=0;i<names.length;i++) if(Array.isArray(o[names[i]])) return o[names[i]];
  for(var k in o){ var v=o[k]; if(Array.isArray(v)&&v.length&&(typeof v[0]==='object'||typeof v[0]==='string')) return v; }
  return []; }
function scalars(o){ var out=[]; for(var k in (o||{})){ var v=o[k]; if(typeof v==='number'||typeof v==='string') out.push([k,v]); } return out; }
```

barList:

```js
function barList(rows, map, opts){
  opts=opts||{};
  var rs=(rows||[]).filter(function(r){ return r && typeof r==='object'; });
  var max=0; rs.forEach(function(r){ max=Math.max(max, rN(r)); });
  if(!rs.length) return '<p class="pnote">Nothing to list here.</p>';
  var lim = opts.limit||14;
  var hidden = Math.max(0, rs.length-lim);
  var total=0; rs.forEach(function(r){ total+=rN(r); });
  var out = rs.slice(0,lim).map(function(r){
    var n=rN(r), lab=rL(r), code=rC(r);
    var clicky = map && (r.code!=null || map.guess);
    var k = map&&map.k, v = map&&map.v ? map.v(r) : code;
    var w = max? Math.round(100*n/max):0;
    return '<button type="button" class="brow'+(clicky?'':' plain')+'"'+(clicky?' data-setk="'+k+'" data-setv="'+H(String(v))+'"':'')+'>'+
      '<span class="bl">'+H(lab)+'</span>'+
      '<span class="bb"><span class="bf" style="width:'+w+'%"></span></span>'+
      '<b class="bn">'+N(n)+'</b></button>';
  }).join('');
  if(hidden>0) out+='<p class="pnote">'+N(hidden)+' more not listed.</p>';
  if(opts.head) out='<div class="ggrp">'+H(opts.head)+'</div>'+out;
  return out;
}
```

Hmm — clickable rows as <button> containing spans: fine. For non-clickable use div class brow plain (button with cursor default is odd for a11y — a button should do something). I'll render non-clickable as `<div class="brow plain">`. Adjust: 

```js
var clicky = map && v!=null && v!=='';
var el0 = clicky? 'button type=button' : 'div';
```

Write accordingly.

Mapping helpers per context: e.g. patterns breakdown map:

```js
var MAPS = {
 ata: {k:'ata', v:function(r){ return String(r.code!=null?r.code:rL(r)).slice(0,2); }},
 operator:{k:'operator', v:function(r){ return r.code!=null?r.code:rL(r); }},
 model:{k:'model', v:function(r){ return rL(r); }},
 part:{k:'part', v:function(r){ return rL(r); }},
 nature:{k:'nature', v:function(r){ return r.code!=null?r.code:rL(r); }},
 crew:{k:'crew', v:function(r){ return r.code!=null?r.code:rL(r); }},
 discovered:{k:'discovered', v:function(r){ return r.code!=null?r.code:rL(r); }},
 condition:{k:'condition', v:function(r){ return r.code!=null?r.code:rL(r); }},
 partnumber:{k:'part', v:function(r){ return rL(r); }},
 jasc:{k:'jasc', v:function(r){ return r.code!=null?r.code:rL(r); }},
 make:{k:'make', v:function(r){ return rL(r); }},
 zone:{k:'zone', v:function(r){ return r.code!=null?r.code:rL(r); }},
 tail:{k:'tail', v:function(r){ return String(rC(r)).replace(/^N/i,''); }},
 corrosion:{k:'corrosion', v:function(r){ return r.code!=null?r.code:rL(r); }},
 q:{k:'q', v:function(r){ return rL(r); }}
};
```

Click delegation:

```js
wrap.addEventListener('click', function(ev){
  var r=ev.target.closest('[data-retry]');
  if(r){ var id=r.getAttribute('data-retry'); delete VIEW_LOADED[id]; if(LOADERS[id]) try{LOADERS[id]()}catch(e){pfail(id,e.message||e)} ; return; }
  var m=ev.target.closest('[data-month]');
  if(m && m.getAttribute('data-month')){ var mo=m.getAttribute('data-month'); setRange(mo+'-01', mo+'-'+lastDay(mo)); return; }
  var t=ev.target.closest('[data-tail]');
  if(t){ var tv=t.getAttribute('data-tail'); setFilter('tail', tv); show('p-aircraft'); return; }
  var b=ev.target.closest('[data-setk]');
  if(b){ var k=b.getAttribute('data-setk'), v=b.getAttribute('data-setv'); if(k&&v!=null){ setFilter(k,v); vaim('narrowed to '+ ... ); } return; }
});
```

Careful ordering: a button may have both data-setk and data-month? Month bars use data-month only. OK.

setRange:

```js
function setRange(a,b){
  try{ var f=E('from'), t=E('to'); if(f) f.value=a; if(t) t.value=b;
    if(typeof syncControls==='function') syncControls();
    if(typeof show==='function'){} // we're in it
    search(0); show('p-search');
    vaim('showing '+pdate(a)+' to '+pdate(b)+'.');
  }catch(e){ }
}
```

Hmm show('p-search') after search(0) — search(0) might already show p-search? No, search() renders the table but the machinery's setFilter is what calls show. My direct search(0) call doesn't switch view. So call show('p-search'). ✓. But wait — search(0) pushes history with hero=heroKind — hero kind unknown to me; search() handles internally (machinery's search references hero=heroKind from their state). ✓ Not my problem.

Also lastDay(mo): 

```js
function lastDay(mo){ var y=+mo.slice(0,4), m=+mo.slice(5,7); return new Date(y, m, 0).getDate(); }
```

And month name: `function monName(mo){ var M=['January',...]; return M[+mo.slice(5,7)-1]+' '+mo.slice(0,4); }`.

**loadPatterns:**

```js
function loadPatterns(){
  var b=body('p-patterns'); if(!b) return;
  b.innerHTML =
   '<div class="ctl"><div><label for="pt-by">Group the selection by</label>'+
   '<select id="pt-by">'+optsHTML([['ata','By system chapter'],['operator','By airline'],['model','By aircraft model'],['part','By part'],['nature','By what was found'],['crew','By what the crew did'],['discovered','By how it was found']])+'</select></div></div>'+
   '<div id="pt-trend" class="pblock"><p class="pnote">Counting months…</p></div>'+
   '<div id="pt-brk" class="pblock"></div>'+
   '<div id="pt-phr" class="pblock"></div>';
  E('pt-by').addEventListener('change', loadPtBrk);
  var qs=pstr();
  vget('api/trend?'+qs).then(function(d){ paintTrend(E('pt-trend'), d); })
    .catch(function(e){ E('pt-trend').innerHTML='<p class="pfail">The month-by-month count did not load ('+H(e.message||e)+'). No trend is shown.</p>'; });
  loadPtBrk();
  vget('api/phrases?'+qs).then(function(d){ var rows=firstArr(d);
      E('pt-phr').innerHTML='<div class="ggrp">Phrases the mechanics use most, inside your selection</div>'+
        (rows.length? rows.slice(0,18).map(function(r){ var lab=rL(r), n=rN(r);
           return '<button type="button" class="brow" data-setk="q" data-setv="'+H(lab)+'"><span class="bl">'+H(lab)+'</span><span class="bb"><span class="bf" style="width:'+pct(rows,n)+'%"></span></span><b class="bn">'+N(n)+'</b></button>'; }).join('')
        : '<p class="pnote">No repeated phrases in this selection.</p>');
    }).catch(...);
}
```

pct helper: width relative to first (max) — rows assumed sorted desc; compute max inline.

optsHTML(pairs): build `<option value="">` list.

loadPtBrk:

```js
function loadPtBrk(){
  var by=E('pt-by')?E('pt-by').value:'ata';
  var box=E('pt-brk'); box.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/breakdown?by='+encodeURIComponent(by)+'&'+pstr()).then(function(d){
    var rows=firstArr(d).slice();
    // label decode for coded groups
    rows.forEach(function(r){ if(by==='ata' && r.label==null) r.label=ataLab(rC(r)); ... });
```

Decoding labels: for coded rows lacking label, try vcode(group, code): groups: ata→ata chapter names? code('ata', c)? Machinery has ATA[v] for chips ("ata->ATA[v]"). So there's an ATA map! Guard: `function ataLab(c){ try{ if(typeof ATA!=='undefined' && ATA && ATA[c]) return ATA[c]; }catch(_){} return c? 'ATA chapter '+c : ''; }` Similarly nature→code('nature',c), crew→code('precaution',c), discovered→code('discovered',c). Use those when label absent. Also append the code in the label for clarity: label = lab + ' (' + code + ')' for coded groups? The house style shows codes. I'll show label, and muted code via rL? Keep simple: label as decoded, tooltip title=code? Skip tooltip; display "LABEL · CODE"? I'll do: for coded groups, display `H(lab) <span class="mut">·</span> <span class="gc">CODE</span>`? My barList takes plain label strings. I'll extend barList to accept `sub` per row... Simpler: keep label plain (decoded or code). Good enough.

Then barList with MAPS[by]. head: none (select says it). 

paintTrend:

```js
function paintTrend(box, d){
  var rows=firstArr(d).filter(r=>r&&typeof r==='object').map(function(r){ return {m:String(r.month!=null?r.month:(rL(r))), n:rN(r)}; }).filter(x=>/^\d{4}-\d{2}$/.test(x.m));
  rows.sort(function(a,b){ return a.m<b.m?-1:1; });
  if(!rows.length){ box.innerHTML='<p class="pnote">The file gives no month spread for this selection.</p>'; return; }
  var max=0, tot=0; rows.forEach(r=>{max=Math.max(max,r.n); tot+=r.n;});
  var peak=rows.reduce((a,b)=> b.n>a.n?b:a, rows[0]);
  var bars=rows.map(r=>'<span class="tb" data-month="'+r.m+'" style="height:'+Math.max(2,Math.round(100*r.n/max))+'%" title="'+H(monName(r.m))+': '+N(r.n)+' reports — click to show that month"></span>').join('');
  box.innerHTML='<div class="ggrp">Reports per month in your selection — '+N(tot)+' in all; click a bar to show that month</div>'+
   '<div class="trend">'+bars+'</div>'+
   '<div class="taxis"><span>'+H(monName(rows[0].m))+'</span><span>'+H(monName(rows[rows.length-1].m))+'</span></div>'+
   '<p class="pnote">Busiest month: '+H(monName(peak.m))+', '+N(peak.n)+' reports.</p>';
}
```

**loadFound:**

```js
function loadFound(){
  var b=body('p-found'); b.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/inspection-method?'+pstr()).then(function(d){
    var rows=firstArr(d);
    var INSTR={'B':1,'D':1,'E':1,'M':1,'T':1,'U':1,'X':1};
    var eye=[],inst=[],tot=0,inst_n=0;
    rows.forEach(function(r){ var c=String(rC(r)||'').trim(); var n=rN(r); tot+=n;
      var lab = rL(r) || vcode('discovered',c) || c;
      (INSTR[c]?inst:eye).push({label:lab, code:c, n:n});
      if(INSTR[c]) inst_n+=n; });
    ...
    html = stats + two barLists.
```

Stats: `<span class="stat"><b>N</b><span>of your M reports were found by instrument — not visible from outside the aircraft</span></span>` + percent. Rows clickable via MAPS.discovered. eye sorted desc assumed.

If response has separate structure (e.g., {byMethod:[], byStage:[]}) — also render any other arrays found: I'll render additional firstArr leftovers? Keep to main + if d has .stage array, render secondary with MAPS.stage? Not in MAPS; stage map: k:'stage', v:code. Add MAPS.stage. I'll check `d.by_stage||d.stages` best-effort:

```js
var st = firstArr(d.stages||d.by_stage||[]);
if(st.length) html += barList(st, MAPS.stage, {head:'By stage of flight'});
```

OK.

**loadAircraft:**

```js
function loadAircraft(){
  var b=body('p-aircraft'); if(!b) return;
  var tail=''; try{ tail=(params().get('tail')||'').replace(/^N/i,''); }catch(_){ tail=(new URLSearchParams(location.search).get('tail')||'').replace(/^N/i,''); }
  b.innerHTML='<div class="twocol"><div id="ac-one"><p class="pnote">…</p></div><div id="ac-rep"><p class="pnote">…</p></div></div>';
  // repeat offenders — follows filter
  vget('api/repeat-offenders?'+pstr()).then(function(d){
    var rows=firstArr(d);
    E('ac-rep').innerHTML='<div class="ggrp">Aircraft with the most reports, in your selection</div>'+
      (rows.length? rows.slice(0,15).map(function(r){ var t=String(rC(r)).replace(/^N/i,''); 
        return '<button type="button" class="brow" data-tail="'+H(t)+'"><span class="bl">N'+H(t)+(rL(r)&&rL(r)!==t? ' — '+H(rL(r)):'')+'</span><span class="bb"><span class="bf" style="width:'+pct(rows,rN(r))+'%"></span></span><b class="bn">'+N(rN(r))+'</b></button>'; }).join('')
       : '<p class="pnote">No aircraft repeats in this selection.</p>');
  }).catch(...)
  // tail summary — whole corpus
  var one=E('ac-one');
  if(!tail){ one.innerHTML='<label for="ac-tail">Look up a tail number</label><div class="ctl"><input id="ac-tail" placeholder="e.g. 583 or N583"><button type="button" class="ghost" id="ac-go">Open the aircraft</button></div><p class="pnote">The history answers from the whole file, whatever else you have selected.</p>';
    E('ac-go').addEventListener('click', function(){ var v=(E('ac-tail').value||'').trim().replace(/^N/i,''); if(v){ setFilter('tail', v); show('p-aircraft'); } });
  } else {
    one.innerHTML='<p class="pnote">Fetching N'+H(tail)+' from the whole file…</p>';
    vget('api/aircraft/'+encodeURIComponent(tail)).then(function(d){ paintAircraft(one, tail, d); })
      .catch(function(e){ one.innerHTML='<p class="pfail">No history came back for N'+H(tail)+' ('+H(e.message||e)+').</p>'; });
  }
}
```

paintAircraft(one, tail, d): summary scalars (registration, serial, model, operator(s), counts, first/last dates) as .stat cards + lists (by system, by operator) with clicks (operator→setFilter? Careful — clicking operator here narrows the SELECTION, changing what repeat-offenders shows; fine and honest). Also external links: FR24 '/data/aircraft/n'+tail, FAA registry. Build:

```js
function paintAircraft(box, tail, d){
  var sc=scalars(d), rows=firstArr(d);
  var stats = sc.filter(...).slice(0,8).map(([k,v])=>'<span class="stat"><b>'+H(v)+'</b><span>'+H(prettyKey(k))+'</span></span>').join('');
```

Hmm scalars keys like "n_reports" — prettyKey maps snake_case → words. I'll write prettyKey: replace _ with space, capitalize first. And prefer known keys order. Also dates via pdate if looks like date. Keep generic + a top summary sentence: `N{tail} appears in {n} reports.` if d.total or count.

External links:

```js
var links='<p class="pnote">Check it elsewhere: <a target="_blank" rel="noopener" href="https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt='+encodeURIComponent(tail)+'">who owns N'+H(tail)+'</a> · <a target="_blank" rel="noopener" href="/data/aircraft/n'+encodeURIComponent(tail)+'">N'+H(tail)+' on Flightradar24</a></p>';
```

matches sourceLinks patterns. ✓

**loadLeads:**

```js
function loadLeads(){
  var b=body('p-leads'); b.innerHTML='<div id="ld-leads"><p class="pnote">Reading the whole file for angles…</p></div>'+
    '<div class="ctl"><div><label for="spike-by">Watch a sudden rise in</label><select id="spike-by">'+
    optsHTML([['','Choose a grouping'],['ata','By system'],['part','By part'],['model','By model'],['operator','By airline']])+'</select></div></div>'+
    '<div id="ld-spikes"><p class="pnote">Choose a grouping to look for spikes.</p></div>';
  E('spike-by').addEventListener('change', loadSpikes);
  vget('api/leads').then(function(d){
    var rows=firstArr(d);
    var html = rows.slice(0,8).map(function(r){
      var title = r.title||rL(r)||'Lead';
      var txt = r.text||r.body||r.detail||r.why||'';
      var fig = rN(r);
      return '<div class="lead"><h3>'+H(title)+'</h3>'+(txt?'<p>'+H(txt)+'</p>':'')+(fig?'<p class="lfig">'+N(fig)+' reports</p>':'')+'</div>';
    }).join('');
    E('ld-leads').innerHTML='<div class="ggrp">Story leads — computed on every report the FAA has published</div>'+(html||'<p class="pnote">No leads came back.</p>');
  }).catch(...);
}
function loadSpikes(){
  var by=E('spike-by').value; var box=E('ld-spikes');
  if(!by){ box.innerHTML='<p class="pnote">Choose a grouping to look for spikes.</p>'; return; }
  box.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/spikes?by='+encodeURIComponent(by)).then(function(d){
    var rows=firstArr(d);
    box.innerHTML='<div class="ggrp">Sudden rises, whole file</div>'+barList(rows, MAPS[by], {limit:12});
  }).catch(e=> box.innerHTML='<p class="pfail">…</p>');
}
```

Lead rows may include a way to act (e.g., filters to reproduce the lead). If r.filters present (object), render a button per entry: data-setk/v. Best-effort:

```js
if(r.filters && typeof r.filters==='object'){ ... Object.entries(r.filters).map(([k,v])=>'<button class="ghost" data-setk="'+H(k)+'" data-setv="'+H(v)+'">Show these</button>') }
```

I'll include that — it makes leads actionable. Good.

**loadEmerging:**

```js
function loadEmerging(){
  b.innerHTML='<div class="ctl"><div><label for="em-by">Group by</label><select id="em-by">'+optsHTML([['part','By part'],['jasc','By system'],['condition','By part condition'],['partnumber','By part number']])+'</select></div>'+
   '<div><label for="em-days">Window</label><select id="em-days">'+optsHTML([['120','Last 120 days'],['180','Last 180 days'],['365','Last year']])+'</select></div></div><div id="em-out"></div>';
  listeners on both → loadEm();
  loadEm();
}
function loadEm(){ var by=E('em-by').value, days=E('em-days').value;
  vget('api/emerging?by='+encodeURIComponent(by)+'&days='+encodeURIComponent(days)).then(d=>{
    var rows=firstArr(d);
    E('em-out').innerHTML='<div class="ggrp">More common than it was — whole file, last '+H(days)+' days</div>'+
      rows.slice(0,14).map(function(r){
        var lab=rL(r)||rC(r), n=rN(r);
        var prev = r.previous!=null?r.previous : r.before!=null?r.before : r.prior!=null?r.prior : null;
        var delta = prev!=null? (n-prev) : null;
        var arrow = delta==null?'':(delta>0?' up ':'');
        ... render with .brow data-setk=MAPS[by]
        plus note 'N in the window against M in the comparable stretch before'
      })
  })
}
```

Keep rendering simple: bar rows with sub note in .bl? I'll put the delta as a small span inside the row: extend barList? I'll hand-roll here for the extra column. Fine.

**loadClusters:**

```js
b.innerHTML='<div class="ctl"><div><label for="cl-min">At least this many aircraft on one day</label><select id="cl-min">'+optsHTML([['3','3 or more'],['4','4 or more'],['6','6 or more'],['10','10 or more']])+'</select></div>'+
 '<div><label for="cl-kind">Kind</label><select id="cl-kind">'+optsHTML([['all','Everything'],['sched','Recurring, probably scheduled'],['event','One-off, probably unscheduled']])+'</select></div></div><div id="cl-out"></div><p class="pnote">A heavy check on one aircraft writes many rows... This panel counts aircraft, not rows.</p>'
listeners → loadCl()
function loadCl(){ var min=E('cl-min').value, kind=E('cl-kind').value;
  vget('api/clusters?min='+encodeURIComponent(min)).then(d=>{
    var rows=firstArr(d).filter(function(r){
      if(kind==='all') return true;
      var k=String(r.kind||r.type||'').toLowerCase();
      var sched=/sched|recur|plan/.test(k);
      return kind==='sched'? sched : !sched;
    });
    render: each r: date (r.date||r.day||pdate), n (aircraft count: rN(r) or r.aircraft), tails array r.tails||r.aircraft_list — render tail buttons data-tail, plus label fields (zone, ata, part?).
```

Cluster card:

```js
'<div class="lead"><h3>'+H(pdate(day))+' — '+N(nAc)+' aircraft</h3>'+ (lab?'<p>'+H(lab)+'</p>':'') + tails html '</div>'
```

tails: (r.tails||[]).slice(0,12).map(t=>'<button class="ghost" data-tail="'+H(String(t).replace(/^N/i,''))+'">N'+H(String(t).replace(/^N/i,''))+'</button>').join(' ') + more count.

**loadDefect:**

```js
vget('api/same-defect').then(d=>{
  var rows=firstArr(d);
  render rows: '<div class="lead"><h3>'+H(lab)+'</h3><p>'+N(n)+' reports across '+N(r.operators||r.n_operators||0)+' operators' + span dates + '</p><button data-setk=...>'
```

Click: if r.code → MAPS.part else q. Buttons: 'Show these reports' with data-setk="part" data-setv=r.code||lab.

**loadStructure:**

```js
vget('api/corrosion').then(d=>{
  // levels
  var lv = d.levels||d.by_level||null; var cards='';
  var shape = lv? (Array.isArray(lv)? lv : Object.keys(lv).map(k=>({code:k,n:lv[k]}))) : firstArr(d).filter(r=>/level/i.test(rL(r)||''));
  cards = shape.map(r=>'<button type="button" class="stat" data-setk="corrosion" data-setv="'+H(String(rC(r)))+'"><b>'+N(rN(r))+'</b><span>'+H(vcode('corrosion',rC(r))||rL(r)||('Corrosion level '+rC(r)))+'</span></button>').join('');
  // cracked total
  var cr = d.cracked!=null? d.cracked : (d.with_cracks!=null? d.with_cracks:null);
  if(cr!=null) cards += '<button type="button" class="stat" data-setk="cracked" data-setv="1"><b>'+N(cr)+'</b><span>Cracking recorded</span></button>';
  // arrays
  var zones = firstArr(d.by_zone||d.zones), parts=firstArr(d.by_part||d.parts);
  html = '<div class="ggrp">Corrosion levels, whole file</div><div>'+cards+'</div>' + barList(zones, MAPS.zone, {head:'Where on the aircraft'}) + barList(parts, MAPS.part, {head:'What was corroded or cracked'});
```

**loadAge:**

```js
b.innerHTML ctl ag-by + out. 
function loadAg(){ by=E('ag-by').value; vget('api/ageing?by='+by).then(d=>{
  var rows=firstArr(d);
  var map = by==='hours' ? {k:'minhours', v:function(r){ var m=String(rL(r)).match(/([\d,]+)/); return m? m[1].replace(/,/g,'') : rC(r); }} : null;
  E('ag-out').innerHTML='<div class="ggrp">Reports by airframe age — whole file</div>'+barList(rows, map, {limit:12}) + (by==='hours'?'<p class="pnote">Click a band to keep every airframe at or past that age.</p>':'<p class="pnote">Cycles are takeoffs and landings. There is no cycle filter on the instrument, so these bands are read-only.</p>');
})}
```

Careful: minhours is "at least N hours" — clicking a band "50,000–74,999" sets minhours=50000 → that includes higher bands too. Is that honest? The row click claims "keep every airframe at or past that age" — true to the filter's semantics, stated. Good.

**loadEngines:**

```js
vget('api/engines').then(d=>{
  var html=''; var sc=scalars(d); 
  headline: if(d.total||d.n) stat.
  arrays: firstArr(d.by_make||d.makes) with no map (display-only), by_model, by_nature? 
  html += barList(firstArr(d.by_make||d.enginemake||d.makes), null, {head:'By engine maker'});
  html += barList(firstArr(d.by_model||d.enginemodel||d.models), null, {head:'By engine model'});
  html += barList(firstArr(d.by_ata||d.systems), MAPS.ata, {head:'By system chapter'}); // ata is a filter → clickable, fine
  if nothing: note.
```

**loadConsequences:**

```js
b.innerHTML ctl cq-by + out; 
function loadCq(){ by=E('cq-by').value; vget('api/consequences?by='+by).then(d=>{
  var rows=firstArr(d);
  E('cq-out').innerHTML='<div class="ggrp">What crews did — whole file, grouped by '+label+'</div>'+barList(rows, MAPS[by], {limit:14});
  // if rows carry nested top action, could show; skip
})}
```

MAPS: operator/model/make exist? MAPS has operator, model, part... add make. ✓ (defined above: make yes.)

**buildFleet (shell):**

```js
function buildFleet(){
  VIEW_LOADED['p-fleet']='shell';
  var b=body('p-fleet');
  b.innerHTML='<div class="ctl"><div><label for="fl-op">Airline</label><select id="fl-op"><option value="">Any operator</option></select></div>'+
    '<div><label for="fl-model">Model, e.g. 737-800</label><input id="fl-model" type="text"></div>'+
    '<div><button type="button" class="ghost" id="fl-go">Show the fleet</button></div></div><div id="fl-out"><p class="pnote">Choose a slice and press the button. Nothing is fetched until you do.</p></div>';
  E('fl-go').addEventListener('click', runFleet);
  vget('api/facets').then(f=>{ OPERATORS=f; fillFlOp(); }).catch(()=>{ fillFlOp(); });
}
```

Wait — facets is fetched by machinery at boot too. Reuse? Machinery's #operator select built by opts() from some source; that source may be in a var (e.g., FACETS or heroData.operators). Unknown name → fetch api/facets myself, once, cached in a promise: `var FACETS_P=null; function facets(){ if(!FACETS_P) FACETS_P=vget('api/facets').catch(e=>{FACETS_P=null; throw e;}); return FACETS_P; }` ✓ shared by fleet, compare, terms.

fillFlOp: from facets: find operators array: `var ops=fac.operators||firstArr(fac).filter(...)` — I'll write `facetList(fac,'operator')`:

```js
function facetList(f, key){
  if(!f) return [];
  if(Array.isArray(f[key])) return f[key];
  var alts={operator:['operators','airlines','carrier'], model:['models','aircraft'], make:['makes','manufacturers'], tail:['tails','aircraft'], ...};
  for(var k of alts[key]||[]) if(Array.isArray(f[k])) return f[k];
  // otherwise scan first array of objects with code+label+n
  var a=firstArr(f); return a;
}
```

For operators rows may be {code,label,n} or {value,count}. Normalize to {code,label,n}:

```js
function normOps(rows){ return rows.map(r=>{ if(typeof r==='string') return {code:r,label:r,n:0};
  return {code:String(r.code!=null?r.code:(r.value!=null?r.value:rL(r))), label:String(r.label||r.name||rL(r)), n:rN(r)}; }); }
```

Sort by n desc, then label. Option text: `${label} (${code}) (${N(n)})` per opts() "Label (12,345)" where label includes code. If label===code skip paren dup.

Hmm — 3,947 options: fine.

runFleet:

```js
function runFleet(){
  var op=E('fl-op').value, model=(E('fl-model').value||'').trim();
  var out=E('fl-out');
  if(!op && !model){ out.innerHTML='<p class="pfail">Choose an airline or type a model first. Nothing was fetched.</p>'; return; }
  out.innerHTML='<p class="pnote">Counting the fleet…</p>';
  vget('api/fleet?operator='+encodeURIComponent(op)+'&model='+encodeURIComponent(model)).then(d=>{
    // summary + lists
    var rowsAll = firstArr(d);
    var html='';
    var sc=scalars(d).slice(0,6).map(kv=>'<span class="stat"><b>'+H(kv[1])+'</b><span>'+H(prettyKey(kv[0]))+'</span></span>').join('');
    if(sc) html+='<div>'+sc+'</div>';
    html += barList(firstArr(d.models||d.by_model), MAPS.model, {head:'Reports by model'}) — careful d.models may be the array found by firstArr... use dedicated keys first then fallback: 
```

Let me define: `var m1=firstArr(d.models||d.by_model); var t1=firstArr(d.tails||d.by_tail||d.top_tails); var s1=firstArr(d.by_ata||d.systems);` — but if d is a bare array, all these are [] and rowsAll has it. Fallback: if !m1.length && !t1.length && rowsAll.length → treat rowsAll as model list? Ambiguous. I'll render rowsAll under "By model" only if rows have model-ish labels? Can't know. I'll render rowsAll with no map under head 'Fleet breakdown' as the fallback, plus dedicated lists when present. Good enough:

```js
if(m1.length) html+=barList(m1, MAPS.model, {head:'By model'});
if(t1.length) html+= '<div class="ggrp">Aircraft with the most reports</div>'+ t1.slice(0,12).map(tailRowHTML).join('');
if(s1.length) html+=barList(s1, MAPS.ata, {head:'By system chapter'});
if(!html) html='<p class="pnote">The fleet endpoint returned nothing listable.</p>';
```

tailRowHTML(r): like aircraft repeat row (data-tail).

**buildCompare:**

```js
function buildCompare(){
  VIEW_LOADED['p-compare']='shell';
  b.innerHTML='<div class="ctl"><div><label for="cmp-field">Compare</label><select id="cmp-field">'+optsHTML([['operator','Airlines'],['model','Models'],['make','Manufacturers']])+'</select></div>'+
   '<div><label for="cmp-a">First</label><select id="cmp-a"><option value="">…</option></select></div>'+
   '<div><label for="cmp-b">Second</label><select id="cmp-b"><option value="">…</option></select></div>'+
   '<div><button type="button" class="ghost" id="cmp-go">Compare</button></div></div><div id="cmp-out"><p class="pnote">Pick two and press Compare. Nothing is fetched until you do.</p></div>';
  E('cmp-field').addEventListener('change', fillCmp);
  E('cmp-go').addEventListener('click', runCompare);
  facets().then(f=>{ CMPFAC=f; fillCmp(); }).catch(()=>fillCmp());
}
function fillCmp(){
  var f=E('cmp-field').value; var rows=normOps(facetList(CMPFAC, f)).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label));
  ['cmp-a','cmp-b'].forEach(id=>{ var s=E(id); if(!s) return; var keep=s.value;
    s.innerHTML='<option value="">choose…</option>'+rows.map(r=>'<option value="'+H(r.code)+'">'+H(r.label)+(r.label!==r.code?' ('+H(r.code)+')':'')+' ('+N(r.n)+')</option>').join('');
    s.value=keep; });
  if(!rows.length) { hint 'The list for this field did not load — pick from … ' }
}
function runCompare(){
  var f=E('cmp-field').value, a=E('cmp-a').value, b2=E('cmp-b').value, out=E('cmp-out');
  if(!a||!b2){ out.innerHTML='<p class="pfail">Choose two to compare. Nothing was fetched.</p>'; return; }
  if(a===b2){ out.innerHTML='<p class="pfail">Those are the same '+E('cmp-field').selectedOptions[0].textContent.toLowerCase()+'. Pick two different ones.</p>'; return; }
  out.innerHTML='<p class="pnote">Comparing…</p>';
  vget('api/compare?field='+encodeURIComponent(f)+'&a='+encodeURIComponent(a)+'&b='+encodeURIComponent(b2)).then(d=>{
    var A=d.a||d.left||d.first||{}, B=d.b||d.right||d.second||{};
    var totA=A.total!=null?A.total:(A.n!=null?A.n:sum(firstArr(A))), ...
    headline: names from selectedOptions text.
    '<div class="twocol">'+col(A,nameA)+col(B,nameB)+'</div>'+ delta line.
    col(side,name): stats from scalars(side) (prettyKey, numbers via N if numeric, dates via pdate if /^\d{4}-/) + barList(firstArr(side), mapFor(f), {limit:8}).
```

mapFor(f): operator→MAPS.operator, model→MAPS.model, make→MAPS.make — but clicking inside compare sets the filter — fine (narrows search). OK.

Delta line: `'<p class="pnote">'+H(nameA)+' holds '+N(totA)+'; '+H(nameB)+' holds '+N(totB)+' — a difference of '+N(Math.abs(totA-totB))+'.</p>'`

**loadTerms:**

```js
function loadTerms(){
  var b=body('p-terms'); b.innerHTML='<p class="pnote">Loading the code tables…</p>';
  var gp = vget('api/glossary'), fc = facets();
  Promise.all([gp.catch(()=>null), fc.catch(()=>null)]).then(function(res){
    var g=res[0]|| (typeof CODES!=='undefined'?CODES:null);
    var f=res[1];
    if(!g){ b.innerHTML='<p class="pfail">The glossary did not load…</p>'; return; }
    var G=normGloss(g), C=countsFromFacets(f);
    var GLAB={nature:'What was found', precaution:'What the crew did', crew:'What the crew did', discovered:'How it was found', stage:'Stage of flight', part_location:'Where on the aircraft', zone:'Where on the aircraft', corrosion:'Corrosion', condition:'Part condition', jasc:'System (JASC)', ata:'System chapter (ATA)', cracked:'Cracking', minhours:'Airframe age'};
    var FIELD={nature:'nature', precaution:'crew', crew:'crew', discovered:'discovered', stage:'stage', part_location:'zone', zone:'zone', corrosion:'corrosion', condition:'condition', jasc:'jasc', ata:'ata'};
    var html='';
    // stable order
    var order=Object.keys(GLAB).filter(k=>G[k]);
    Object.keys(G).forEach(k=>{ if(order.indexOf(k)<0) order.push(k); });
    order.forEach(function(grp){
      var inner=G[grp]; var keys=Object.keys(inner);
      if(!keys.length) return;
      html+='<div class="ggrp">'+H(GLAB[grp]||prettyKey(grp))+'</div>';
      html+=keys.map(function(c){
        var e=inner[c]||{}; var lab=e.label||e.short||c; var faa=e.faa||e.faa_label||''; var note=e.note||'';
        var cnt = (C[grp]&&C[grp][c]!=null)? C[grp][c] : (e.n!=null?e.n:null);
        var fld=FIELD[grp];
        return '<button type="button" class="grow"'+(fld?' data-setk="'+fld+'" data-setv="'+H(c)+'"':'')+'>'+
          '<span class="gc">'+H(c)+'</span>'+
          '<span class="gl"><b>'+H(lab)+'</b>'+(faa&&faa.toLowerCase()!==String(lab).toLowerCase()?' <span class="gf">FAA wording: '+H(faa)+'</span>':'')+(note?' <span class="gnote">'+H(note)+'</span>':'')+'</span>'+
          '<b class="bn">'+(cnt!=null?N(cnt):'')+'</b></button>';
      }).join('');
    });
    b.innerHTML=html||'<p class="pnote">No codes came back.</p>';
  });
}
```

countsFromFacets(f): build {group:{code:n}}:

```js
function countsFromFacets(f){
  var out={};
  if(!f||typeof f!=='object') return out;
  var alias={precaution:'crew', part_location:'zone'};
  Object.keys(f).forEach(function(k){
    var v=f[k]; var grp=alias[k]||k;
    function put(code,n){ if(code==null) return; (out[grp]=out[grp]||{})[String(code)]=Number(n)||0; }
    if(Array.isArray(v)) v.forEach(function(r){ if(r&&typeof r==='object') put(r.code!=null?r.code:(r.key!=null?r.key:rL(r)), rN(r)); else if(typeof r==='string'){} });
    else if(v&&typeof v==='object') Object.keys(v).forEach(function(c){ var x=v[c]; if(typeof x==='number') put(c,x); else if(x&&typeof x==='object') put(c, rN(x)); });
  });
  return out;
}
```

**loadMethod:**

Static prose with spans: data-f keys. Then facets() fills.

```js
function loadMethod(){
  var b=body('p-method');
  b.innerHTML = PROSE;
  facets().then(function(f){ if(!f) return;
    var tot = f.total!=null?f.total:(f.reports!=null?f.reports:VIEW_TOTAL());
    setF('m-total', N(tot)); setF('m-from', pdate(f.from||f.first||RANGEfrom())); setF('m-to', pdate(f.to||f.last||...)); setF('m-ops', N(f.operators!=null?f.operators:(facetList(f,'operator').length))); setF('m-tails', N(f.tails!=null?f.tails:facetList(f,'tail').length)); setF('m-undated', f.undated!=null?N(f.undated):'—'); ...
  }).catch(()=>{ /* leave prose with dashes */ });
}
```

setF(id,v): E(id)&&(E(id).textContent=v).

PROSE (write carefully, house voice, ~8 short paragraphs):

1. What the file is: "Every number on this desk comes from the FAA's Service Difficulty Reporting System: <b data-f=m-total>—</b> reports mechanics filed when something on an aircraft was found broken, worn, corroded or not working, from <span data-f=m-from>—</span> to <span data-f=m-to>—</span>. The FAA publishes the file; this desk only reads it."
2. What a report is: "One report is one finding, written by one mechanic, about one aircraft on one day. A heavy scheduled check fills a page with rows about the same aircraft: <span data-f=m-undated>—</span> reports carry no date at all and are filed at the end of every listing. Count events, not rows."
3. Airlines caveat: "Airline names come from the FAA's Air Carrier/Operator cross-reference, the December 2006 edition. Carriers have merged, renamed and ceased since; check current ownership before you name an airline in print."
4. Found-by-instrument: "Findings coded B, D, E, M, T, U or X in the How-found field were made by an instrument — a warning went off, a test failed. They were not visible from outside the aircraft."
5. Corrosion level 3: "Corrosion level 3 obliged the operator to notify the regulator within three days and act across the fleet. That is a checkable fact you can put to them."
6. Counting rules: "Counts are of write-ups, not of incidents... ties broken on the control number; ordering is fixed newest first; there is no user-selectable sort."
7. Export: "Exports hold the newest 5,000 matching reports, decoded columns beside their codes. Older reports are not in the file; narrow by date to export the rest."
8. Citations: "The FAA publishes no per-report permalink. Cite the control number and this desk's link. Quote the mechanic's words as filed."

Good.

**Painting the ignore-group label's N**: at mount, VIEW_TOTAL may be known (TOTAL const from brief 1). paintScope sets [data-gtotal] anyway on each call. Also call once at mount.

**syncTabs keyboard**: 

```js
strip.addEventListener('keydown', function(e){
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return;
  var tabs=[].slice.call(strip.querySelectorAll('.vtab')); var i=tabs.indexOf(document.activeElement);
  if(i<0) return; e.preventDefault();
  var j=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[j].focus(); show(tabs[j].getAttribute('data-view'));
});
```

**CSS injection:**

```js
var css = '...';
var st=document.createElement('style'); st.id='views-css'; st.textContent=css; document.head.appendChild(st);
```

**Init:**

```js
function viewBoot(){ mountViews(); setTimeout(watchCount, 500); }
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', viewBoot); } else viewBoot();
```

But careful — if their boot is also on DOMContentLoaded and registered earlier, theirs runs first, mine after ✓.

Wait, one more consideration: their code calls show('p-search') during boot BEFORE mount (if their boot runs at script eval). My show guard: `if(!VIEW_READY){ CURVIEW=id||CURVIEW; return; }`. Then mount → show(CURVIEW) — but I override CURVIEW from ?view= — hmm, if boot flow called show('p-search') and link had view=p-terms, which wins? The link (shareable) should win. But boot's search() pushState would have preserved view=... — if the link had view=p-terms, their search keeps view param; my read of location.search at mount returns p-terms → show p-terms. Good.

Also expose show even if their code references `show` — it's a top-level function declaration in the shared IIFE ✓.

One subtle thing: VIEW_ORDER — object key order: 'p-search' first etc. ✓ but Object.keys order for string keys is insertion order ✓.

The `.hidden` attribute on sections: CSS [hidden]{display:none!important} — browsers default display:none for [hidden] unless overridden; my .panel sets display? I didn't set display on .panel (block default) — [hidden] works. But my .panel has border etc., fine. I'll add explicit `[hidden]{display:none!important}` in my CSS to be safe (careful: global attribute selector could affect their elements — it only enforces what hidden already means; safe).

**pstr() and fetch URLs for follows panels**: pstr() returns params string (may be empty) → 'api/trend?' + '' = 'api/trend?' — fine. But params() excludes limit/offset ✓.

Wait — should follows-panel fetches include view/hero? No, just filter args. ✓.

**selWords fallback details**:

```js
function selWords(){
  try{ if(typeof filterWords==='function'){ var s=filterWords(); if(s!=null && s!=='') return s; if(s==='') return ''; } }catch(_){}
  var bits=[];
  try{
    var p=params();
    function g(k){ return p.get(k)||''; }
    if(g('q')) bits.push('where a mechanic wrote "'+g('q')+'"');
    if(g('jasc')) bits.push('system '+g('jasc'));
    if(g('ata')) bits.push('system chapter '+g('ata'));
    if(g('part')) bits.push('part '+g('part'));
    if(g('condition')) bits.push('part condition '+g('condition'));
    if(g('zone')) bits.push('zone '+g('zone'));
    if(g('operator')) bits.push('airline '+g('operator'));
    if(g('make')) bits.push('manufacturer '+g('make'));
    if(g('model')) bits.push('model '+g('model'));
    if(g('tail')) bits.push('tail N'+g('tail'));
    if(g('crew')) bits.push('crew action '+g('crew'));
    if(g('nature')) bits.push('finding '+g('nature'));
    if(g('discovered')) bits.push('found by '+g('discovered'));
    if(g('stage')) bits.push('stage '+g('stage'));
    if(g('corrosion')) bits.push('corrosion level '+g('corrosion'));
    if(g('minhours')) bits.push(N(g('minhours'))+' hours or more on the airframe');
    if(g('cracked')) bits.push('with cracking recorded');
    if(g('from')||g('to')) bits.push('from '+pdate(g('from')||'…')+' to '+pdate(g('to')||'…'));
  }catch(_){}
  return bits.join(', ');
}
```

Good enough as fallback (raw codes; the real filterWords decodes).

vaim text on setFilter clicks: after setFilter, the machinery shows chips; my aim note: `vaim('narrowed the search to that row — the panels that ignore your selection still answer for the whole file.')`? Too long. I'll do: on data-setk click: `vaim('your selection now includes that row.')` Hmm — tone words... The aim line voice in spec: lowercase-ish sentences like `took ${label}, ${what}, ${num(n)} reports.` I'll write: `vaim('narrowed to '+plainLabel+'. panels marked "ignore your selection" still answer for the whole file.')` — actually that's genuinely useful and reinforces the concept. But label plain text: from the clicked row's .bl textContent. I'll grab it: `var lab=(b.querySelector('.bl')||b).textContent.trim().slice(0,60)`. Then `vaim('narrowed to '+lab+'.')`. Keep simple.

Edge: setFilter may fail if el(k) doesn't exist for k (all my k values are real FIELDS: q, operator, model, part, nature, crew, discovered, ata, condition, zone, tail, corrosion, cracked, minhours, jasc, stage, make — all in FIELDS ✓).

**Aiming for code cleanliness** — I'll now write the final code block. Also the explanation of departures at the end (short list):

1. p-aircraft scope line: not blank — split-truth line, fixing the FOLLOWS_FILTER/VIEW_GROUPS discrepancy in the honest direction; kept in the narrows group.
2. p-search and #p-search section: I create the section only if the search half hasn't; adopt otherwise; scope line intentionally empty per spec.
3. Follows-filter panels re-fetch when the selection changes (not literally "once ever") — "once" per selection; ignore panels strictly once.
4. Response shapes weren't in the spec — renderers read the first plausible array and normalize label/count keys (`firstArr`, `rL`, `rN`); swap those three if the server's field names differ.
5. Added #pt-by (patterns breakdown select) — needed to drive by=; the original's 22-select inventory suggests it wasn't a <select> there, but the endpoint's by= parameter needs a control.
6. cl-kind's third label and the client-side kind matching (regex on kind/type) are my reading; "One-off, probably unscheduled".
7. Compare a/b pickers are selects fed from api/facets (the original had no selects there; selects are the count-labelled house pattern).
8. Panels that follow the filter send params(); ignore panels deliberately send none — the guarantee is enforced client-side, not trusted to the server.

Also mention where markup goes: generated at boot into `<div id="views">`, inserted immediately after the search half's container (the node following the pre-existing #p-search section), else appended to `<main>`; relocation = one line in mountViews().

Also: css uses existing palette vars where plausible but hard-codes fallbacks.

Now — potential collision check on names I define at IIFE top level: show (intended), mountViews, loadPatterns... all panel loader names might collide if the other brief defined loadX — unlikely; they're descriptive of my panels. `body()` — DANGEROUS: window.body? In IIFE scope, function body(){} is fine but shadows nothing global that matters; still, rename to `pbody()`. `optsHTML` fine. `firstArr`, `rL`, `rN`, `rC`, `barList`, `normGloss`, `facetList`, `normOps`, `countsFromFacets`, `prettyKey`, `monName`, `lastDay`, `pct`, `setRange`, `selWords`, `scopeLine`, `paintScope`, `paintAllScopes`, `watchCount`, `viewBoot`, `vget`, `vaim`, `vcode`, `pdate`, `H`, `N`, `E`, `FF`, `PANELS`, `GROUPS`, `VIEW_ORDER`, `LOADERS`, `SUBS`, `MAPS`, `VIEW_LOADED`, `VIEW_READY`, `VIEW_MOUNTED`, `CURVIEW`, `FACETS_P`, `facets`, `ataLab`, `tailRowHTML`, `statHTML`, `buildFleet`, `runFleet`, `buildCompare`, `fillCmp`, `runCompare`, `loadPtBrk`, `paintTrend`, `panelFail`, `pbody`, `optsHTML`, `PROSE_METHOD`, `setF`, `sumN`.

H and N as var names — short, could collide! If brief 1 defined `H` or `N`... possible. Rename to `h_` and `n_`? Use `EH` and `EN`? I'll use `vh()` and `vn()` — prefixed, safe. E → `vEl`. 

pdate — could collide if they defined pdate? They have prettyDate; pdate is mine, safe.

Also careful: `show` — if their brief defined show as a const (not function), my `function show` declaration at top level would... duplicate lexical declaration → SyntaxError! If they wrote `const show = ...`, my `function show(){}` in the same scope = redeclaration of a lexical binding = SyntaxError at parse time, breaking the WHOLE page. Hmm. Risk. The spec says setFilter calls show("p-search") — show is part of MY brief ("Loading is LAZY: show(id) triggers that panel's loader" is in the panels spec). So the other brief was told to CALL show, not define it. So they'd use function calls, not define it. Safe enough. Similarly params/setFilter/search are theirs; I must NOT redeclare those — I don't.

But hmm — what if brief 2's author, told "the panels brief will provide show", still defined a stub? Can't control. Proceed.

TDZ on their consts when my var initializers run: my block executes after theirs (textually last), so their consts are initialized. But their BOOT code may run asynchronously (DOMContentLoaded) — either way, by the time my var initializers run, their top-level declarations executed. ✓ except if my block is placed physically BEFORE their boot code but after their declarations — "dropping into the existing page below the search half" → after. ✓.

One more: `pct(rows,n)` helper: `function pct(rows,n){ var max=0; rows.forEach(function(r){ max=Math.max(max, rN(r)); }); return max? Math.round(100*n/max):0; }`

Also `sumN(rows)`: total.

For trends: if response has {months:[...]} plus undated count, fine.

Now let me also double-check the "20 tab buttons" requirement: 16 tabs... "20 tab buttons with the labels the specification names" — 20 tabs in the original (original 20 tabs, yours 4). But the spec lists SIXTEEN tabs. The checker says 20 tab buttons?? Hmm: "What I will check in a browser: - 20 tab buttons with the labels the specification names, in three named groups. - All 16 panel ids present." 20 buttons but 16 panels — so the tab strip must have 20 buttons while only 16 panels exist. Where do 4 extra buttons come from? Look at the original counts: tabs 20, panels 16. So 4 tabs don't own panels — maybe 4 extra tabs are anchors/views of the same panels? Hmm. The spec's "THE SIXTEEN TABS" lists 16. What are the other 4 in the original? Possibly: "Search", "Patterns", "Aircraft", "How it was found", then 9 ignore, 3 reference = 16. Original 20 tabs... The measurement said "tabs original 20 yours 4" — the rebuilt page currently has 4 tabs (p-search/patterns/aircraft/found?). And the spec says sixteen panels/tabs. The checker sentence says 20 tab buttons — inconsistent with the spec's 16... unless the four extra tabs in the original were... Let me recount the spec's list: p-search, p-patterns, p-aircraft, p-found (4) + p-fleet, p-leads, p-emerging, p-clusters, p-defect, p-structure, p-age, p-engines, p-consequences (9) + p-compare, p-terms, p-method (3) = 16. Checker: "20 tab buttons". Hmm — maybe the checker means buttons in the tab strip area including e.g. "12 more questions" toggle? No, that's starters. OR the original had 20 tabs because 4 panels had TWO tabs each? Or the original tab strip included sub-tabs (like ageing by hours/cycles as tabs?)... 

Wait — maybe the four extra tabs are within-panel tabs? "tabs original 20" counted ALL tab-like controls including e.g. hero view tabs (hero=heroKind — hero has kinds: maybe 'map|months|zones...'?). The current page ("yours 4") — the hero has 4 tabs? Hmm, the hero (brief 1) might have view tabs. Actually "tabs: original 20, yours 4" — the current rebuilt page already has 4 tabs somewhere (hero kinds?). If the hero already has 4 tabs, then the original's 20 = 16 panel tabs + 4 hero tabs! That fits: hero heroKind tabs (e.g., by month / by zone / by operator / by tail — the hero rail kinds). So the checker's "20 tab buttons" = 4 existing hero tabs + my 16. And "in three named groups" applies to my 16. So I build exactly 16. ✓. I'll note nothing; my 16 + their 4 = 20. Good.

Also "headings original 45 yours 1" — mine will add 16 h2s. Fine.

"panels original 16 yours 0" → I add 16 sections (15 mine + p-search shell). ✓.

Now — the checker: "Switching to a tab fetches its endpoint once, and not before." — note p-terms fetches TWO endpoints (glossary+facets); p-leads fetches two (leads+spikes? no — spikes only after choosing grouping; leads alone on show). Fine.

Also: "p-fleet and p-compare load only on their own buttons" — my buildFleet fetches facets for the operator select at shell build — is that a violation? "load only on their own buttons" refers to the panel's DATA (api/fleet, api/compare). Populating the picker from facets is control setup, not the panel's answer. Hmm — but strictly, a checker watching network might see api/facets fire on showing p-fleet. facets is a shared boot endpoint (machinery fetches at boot anyway). I judge it acceptable; but to be extra safe, defer facet fetch for fleet until first interaction? No — the select must be populated when shown (checker: "Every select ... populated from the API"). Show-time population is expected. Keep.

Edge: facets() cached — machinery may have already fetched; my separate fetch is a second call. Fine.

Now, about `api/facets` shape for operators: the machinery's opts() built #operator etc. from somewhere — likely a boot facets payload. My facetList fallbacks should handle: {operators:[{code,label,n}]} or {operator:{CODE:{label,n}}} — handle object-of-objects too:

```js
function facetList(f, key){
  if(!f) return [];
  var AL={operator:['operators','airlines'], model:['models'], make:['makes','manufacturers'], tail:['tails','aircraft'], part:['parts'], condition:['conditions'], ata:['ata','systems'], jasc:['jasc','systems'], nature:['nature'], crew:['crew','precaution'], discovered:['discovered'], stage:['stage'], zone:['zones','part_location'], corrosion:['corrosion']};
  var names=[key].concat(AL[key]||[]);
  for(var i=0;i<names.length;i++){ var v=f[names[i]]; if(Array.isArray(v)) return v; if(v&&typeof v==='object') return Object.keys(v).map(function(c){ var x=v[c]; if(x&&typeof x==='object'){ x.code=x.code||c; return x; } return {code:c,label:c,n:x}; }); }
  return [];
}
```

For compare models list: facetList(f,'model') ✓.

fleet fillFlOp uses facetList(f,'operator') → normOps → sort desc n. ✓

Now write PROSE_METHOD with injection ids: m-total, m-from, m-to, m-ops, m-tails, m-undated, m-newest? Keep six.

Also p-method should mention numbers "injected from api/facets" ✓.

Let me also handle `paintAllScopes`:

```js
function paintAllScopes(){ VIEW_ORDER.forEach(function(pid){ var s=document.querySelector('.scope[data-scope="'+pid+'"]'); if(s && !E(pid).hidden) paintScope(pid); }); }
```

Paint only visible (cheap + avoids layout thrash). Also update group total each time.

Hmm — but if a hidden panel's scope is stale when shown, show() repaints it ✓.

Now, `watchCount` observer with subtree:true on #count: characterData mutations might not fire if they replace innerHTML — childList fires then. ✓.

Also add: on popstate also paintAllScopes (selection may have changed via back). ✓ add to my popstate handler.

Also — machine's showChange scrolls; my setRange→search(0) — does search call showChange? Unknown; setFilter does. To match behavior, after search(0) in setRange I could call showChange if exists — setFilter does showChange per spec. I'll call it guarded:

`if(typeof showChange==='function') showChange();` — but careful about double-scroll weirdness; setFilter contract includes it, so mimic. OK.

Wait, actually re-reading setFilter: "setFilter(k,v): el(k).value=v; show('p-search'); search(0); showChange()." — show BEFORE search. My data-setk path calls setFilter (their function) ✓ nothing for me to do. My setRange replicates: write els → show('p-search') → search(0) → showChange(). I'll order it that way.

But careful: in setRange, calling show('p-search') before search(0) — show is mine, fine.

Also `data-setk` click handler order: setFilter already switches to p-search ✓.

Now the OPS select for fleet: 3947 options textContent — fine.

Also **"labelled with its report count"** for fl-op: option text `Label (CODE) (12,345)` — double parens ugly; opts() spec: 'Label (12,345)' where Label is like "Southwest Airlines Co (SWAA)"... so "Southwest Airlines Co (SWAA) (12,345)". OK, follow spec literally.

For cmp selects, same format.

Empty labels: fleet's fl-op first option "Any operator" (machinery's empty label convention) ✓.

Now writing the final HTML/JS. Also the small `mut` class for muted code in labels? I'll add `.gc` reuse. In barList I only output label text; for coded groups I'll set label = decoded + nothing else. Fine.

One more design point — **panel headings**: spec says each panel has "its heading". I use the tab label as h2 (verbatim labels are for tabs; headings per panel — the spec's "every heading" is claimed named but I only have labels; using the same text is the safe canonical choice). p-search: no heading from me (theirs).

Also — headings count check will pass.

Let me make sure `hidden` toggling includes p-search: VIEW_ORDER includes 'p-search' ✓; if their section has custom display styles, setting hidden attribute works unless their CSS sets display on it — acceptable.

Also aria: tablist/tab roles; add aria-selected sync; panels role="tabpanel"? Add role="tabpanel" + aria-labelledby="vtab-ID" on each section I create. For adopted sections, skip (don't mutate theirs).

Write `esc` fallback inside vh? I decided: `var VH = (typeof esc==='function')? esc : fallback;` But TDZ: if esc is declared as `const esc=` later... can't be later, they're earlier. OK.

Actually — one more trap: my var initializers `var VH = (typeof esc==='function') ? esc : ...` run when MY block executes. Their block executed before (textual order). ✓. But their boot might run AFTER mine if they deferred to DOMContentLoaded and I don't... My mountViews runs immediately (or on DOMContentLoaded if loading). If document is still loading when my block runs (script in <head>? unlikely — it's below the search half, so body scripts), readyState is 'loading' during parse! Scripts in body run while readyState==='loading'. Their boot may have registered DOMContentLoaded too. If I run mountViews immediately, their sections may not exist yet (#p-search created by their boot at DOMContentLoaded) → my adoption finds nothing, I create my own p-search shell → THEIR p-search creation would then find E('p-search') exists (mine) — do they guard? Unknown! Risk of two p-search containers or their code assuming theirs.

Safer: ALWAYS defer my mount to DOMContentLoaded (or if readyState!=='loading', run now). By DOMContentLoaded, their boot (if deferred) ran; if their boot runs at script-eval (immediate), it already ran before mine. Either way mount happens after their section creation IF they create it at boot. But what if their table renders into a #p-search that's static HTML in the page (not JS-created)? Then it exists at parse time and immediate mount is fine too. So: defer mount until DOMContentLoaded when loading; else immediate. But their boot could ALSO be deferred and registered AFTER mine? No — my script tag comes after theirs, so my DOMContentLoaded listener registers after theirs → theirs fires first. ✓.

Also if their boot is in a `setTimeout`, race remains — accept.

Also `search(0)` at boot by their code (restore) may call show('p-search') pre-mount → guarded, records CURVIEW. ✓.

Now, also handle `E('p-search')` adoption: after mount, if their p-search appeared later (post-mount), my show's VIEW_ORDER loop does `E(pid)` per call — if their section exists it gets hidden/shown correctly even though outside my container; tab aria-controls still points to id ✓. My makeSection for p-search only if absent ✓.

Alright — also the retry button inside pfail uses class ghost (exists in their CSS presumably) ✓.

Now, write everything out. I'll try to keep it tight but complete. Let me also double check barList for rows of strings (phrases maybe strings): firstArr may return strings; my barList filters objects. For phrases I map manually (r may be {phrase,n} object; if string, wrap: rows=rows.map(r=> typeof r==='string'? {label:r}: r)). I'll add that normalization inside firstArr consumers where relevant — better: `function objRows(rows){ return (rows||[]).map(function(r){ return typeof r==='string'? {label:r} : r; }); }` and use in barList/firstArr consumers. I'll fold into barList: map strings first. ✓

Cluster tails: r.tails may be strings ✓.

OK — also the deltas rendering for emerging: I'll hand-roll:

```js
rows.slice(0,14).map(function(r){
  var lab=rL(r)||rC(r); var n=rN(r);
  var prev=r.previous!=null?r.previous:(r.before!=null?r.before:(r.prior!=null?r.prior:(r.base!=null?r.base:null)));
  var note = prev!=null ? (' was '+N(prev)+' in the stretch before — '+ (n>=prev? 'up '+N(n-prev):'down '+N(prev-n)) ) : '';
  var w = maxW(rows,n);
  return '<button type="button" class="brow" data-setk="'+MAPS[by].k+'" data-setv="'+H(String(MAPS[by].v(r)))+'"><span class="bl">'+H(lab)+'<span class="gsub">'+H(note)+'</span></span><span class="bb"><span class="bf" style="width:'+w+'%"></span></span><b class="bn">'+N(n)+'</b></button>';
}).join('')
```

.gsub {display:block;color:#8b7f76;font-size:11.5px} CSS.

By-field for partnumber: k='part' ✓. For jasc: k='jasc' ✓. condition k='condition' ✓.

Also **clusters label fields**: cluster objects might be {date, aircraft:n, tails:[], ata, zone, part}. I'll render summary: pieces: date (pdate if yyyy-mm-dd), count (r.aircraft||rN(r)), and any of (zone, ata, part, nature) present as muted line. Tail buttons.

Time to write the final answer. Also required: "Explain only where you departed from the specification and why." — a short departures list at the end.

Let me draft the CSS fully, then JS fully, mentally compiling for errors.

Also remember `.panel h2` styling and `#views` spacing; sticky strip top:44px per spine convention; z-index above table? spine z? unknown; use 40.

One more: the ignore group label contains an em-dash? Verbatim: "These ignore your selection. Each answers from all N reports, or from a slice you set inside the panel" — exact. With N → number. My GROUPS def uses <b data-gtotal>…</b> — paint sets textContent to N(n) or '…'.

Also — should the group label update if TOTAL unknown (0)? Show '…' until known. paintAllScopes sets it whenever TOTAL>0.

Final structure of my answer:
1. One paragraph: where the markup goes (JS-generated, insertion point, single line to move).
2. The code block.
3. Departures list.

Let me write the code now, carefully.

```html
<script>
/* ============================ PART 3 — THE FIFTEEN PANELS, THE TAB STRIP, THE SCOPE LINES =====
   Drop this block LAST inside the existing IIFE, below the search half.

   MARKUP PLACEMENT — there is no static markup to paste. At boot everything is generated into
   one wrapper <div id="views"> and inserted immediately AFTER the search half: the wrapper takes
   the place just following the pre-existing #p-search section (its old parent, before its next
   sibling). If the page has no #p-search yet, the wrapper is appended to <main> (or <body>).
   To move the strip and panels, change the single line marked PLACEMENT in mountViews().

   Calls into the earlier briefs: params(), setFilter(), search(), showChange(), syncControls(),
   el(), esc(), num(), code(), prettyDate(), filterWords(), aim(), and the constants TOTAL,
   heroData, LAST_TOTAL, FOLLOWS_FILTER, CODES. Each use is guarded, so a missing helper degrades
   to a plain rendering instead of breaking the page. Nothing from parts 1–2 is redefined.
=============================================================================================*/

/* ---- tiny guarded helpers over the existing page's own utilities ---- */
var VH = (typeof esc === 'function') ? esc : function(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var VN = (typeof num === 'function') ? num : function(x){ return Number(x||0).toLocaleString('en-US'); };
function vEl(id){ try{ if(typeof el==='function') return el(id); }catch(_){} return document.getElementById(id); }
function vget(url){ return fetch(url, {headers:{'Accept':'application/json'}}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
function vaim(t){ try{ if(typeof aim==='function') aim(t); }catch(_){} }
function vcode(grp,v){ if(v==null||v==='') return null; try{ if(typeof code==='function'){ var s=code(grp,v); if(s) return s; } }catch(_){} return null; }
function pdate(s){ if(!s) return ''; try{ if(typeof prettyDate==='function') return prettyDate(s); }catch(_){} return String(s); }
function pstr(){ try{ return params().toString(); }catch(_){ return new URLSearchParams(location.search).toString(); } }
function totalN(){ try{ if(typeof TOTAL==='number' && TOTAL) return TOTAL; }catch(_){} try{ if(heroData && heroData.total) return heroData.total; }catch(_){} return 0; }
function selN(){ try{ if(typeof LAST_TOTAL!=='undefined' && LAST_TOTAL!=null) return LAST_TOTAL; }catch(_){} try{ if(heroData && heroData.total!=null) return heroData.total; }catch(_){} return 0; }
```

Hmm wait: `typeof TOTAL` when TOTAL is a const declared in TDZ throws — but as established, by the time these run (post their block), initialized. But totalN might be called from paintScope during mount — mount runs after their block ✓.

Careful with `typeof heroData` — if heroData is `let heroData = null` — typeof fine post-init.

```js
function selWords(){
  try{ if(typeof filterWords==='function'){ var s=filterWords(); if(s) return s; } }catch(_){}
  var bits=[];
  try{
    var p=params(); function g(k){ var v=p.get(k); return v?v:''; }
    if(g('q')) bits.push('where a mechanic wrote "'+g('q')+'"');
    if(g('jasc')) bits.push('system '+g('jasc'));
    if(g('ata')) bits.push('system chapter '+g('ata'));
    if(g('part')) bits.push('part '+g('part'));
    if(g('condition')) bits.push('part condition '+g('condition'));
    if(g('zone')) bits.push(g('zone'));
    if(g('operator')) bits.push('airline '+g('operator'));
    if(g('make')) bits.push('manufacturer '+g('make'));
    if(g('model')) bits.push('model '+g('model'));
    if(g('tail')) bits.push('tail N'+g('tail'));
    if(g('crew')) bits.push('crew action '+g('crew'));
    if(g('nature')) bits.push('finding '+g('nature'));
    if(g('discovered')) bits.push('found by '+g('discovered'));
    if(g('stage')) bits.push('stage '+g('stage'));
    if(g('corrosion')) bits.push('corrosion level '+g('corrosion'));
    if(g('minhours')) bits.push(VN(g('minhours'))+' hours or more on the airframe');
    if(g('cracked')) bits.push('with cracking recorded');
    if(g('from')||g('to')) bits.push('from '+(pdate(g('from'))||'…')+' to '+(pdate(g('to'))||'…'));
  }catch(_){}
  return bits.join(', ');
}
```

Note: if filterWords returns '' when unfiltered → my code: `if(s) return s;` — then falls through to building from params (also empty) → returns ''. Caller distinguishes '' = unfiltered ✓.

Panels meta + groups + subs.

Then row helpers, barList etc.

Then LOADERS functions.

Then scope/paint/show/mount/boot.

I need to be careful with quotes inside template building — I'll use string concatenation with single quotes and H() everywhere.

Let me also write `statCard(n, lab, k, v)` helper:

```js
function statCard(n, lab, k, v){
  return (k? '<button type="button" class="stat" data-setk="'+k+'" data-setv="'+VH(String(v))+'">' : '<span class="stat">')+
    '<b>'+(typeof n==='number'?VN(n):VH(n))+'</b><span>'+VH(lab)+'</span>'+(k?'</button>':'</span>');
}
```

prettyKey:

```js
function prettyKey(k){
  var s=String(k).replace(/_/g,' ');
  s=s.replace(/\btotal\b/i,'reports').replace(/\bn\b/i,'reports');
  return s.charAt(0).toUpperCase()+s.slice(1);
}
```

Hmm careful replacing 'n' inside words — use exact match: replace(/^n$/i,'reports'). I'll be careful: 

```js
function prettyKey(k){ var s=String(k).replace(/_/g,' ').trim();
  if(/^n$/i.test(s)) s='reports';
  if(/count$/i.test(s)) s=s.replace(/count$/i,'reports');
  return s.charAt(0).toUpperCase()+s.slice(1); }
```

For scalar values that look like ISO dates: in scalarsToStats: if /^\d{4}-\d{2}-\d{2}$/ → pdate. If key matches /date|from|to|first|last/ and value matches → pdate.

```js
function scalStats(o, lim){
  lim=lim||8; var out=[], i=0;
  for(var k in (o||{})){ var v=o[k];
    if(typeof v!=='number' && typeof v!=='string') continue;
    if(i++>=lim) break;
    var shown = (typeof v==='string' && /^\d{4}-\d{2}-\d{2}/.test(v)) ? pdate(v) : (typeof v==='number'? VN(v) : VH(v));
    out.push('<span class="stat"><b>'+shown+'</b><span>'+VH(prettyKey(k))+'</span></span>');
  }
  return out.join('');
}
```

monName:

```js
var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function monName(mo){ return (MON[(+mo.slice(5,7))-1]||'')+' '+mo.slice(0,4); }
function lastDay(mo){ var y=+mo.slice(0,4), m=+mo.slice(5,7); return String(new Date(y,m,0).getDate()); }
```

pct: as above.

Now — the mount function and CSS. Also #views needs class hooks.

Let me also decide sticky: `.vgroups{position:sticky;top:44px;z-index:40}` — the spine uses 44; if the hero bar occupies 0–44 the strip sits below it. Good.

Alright, also one point: the checker item "With a zone filter set, a panel in the 'ignore' group says so in its own words and still reports the whole-corpus figure." — my ignore scope line: "This view always answers for all N reports. It does not narrow to your current selection (zone ZONE 400)." ✓ via filterWords which includes zone clause (their filterWords decodes zone ✓).

Now, also subtle: FOLLOWS panels' scope when n>0 uses LAST_TOTAL — the search total. But on first boot with ?view=p-found and no search run yet, LAST_TOTAL may be undefined → heroData.total fallback. OK.

Let me also add a `data-aim` attribute? The machinery used data-aim="drop-k" presumably for aim narration via delegation. I'll skip; I call vaim directly.

Writing loadTerms' normGloss — also handle glossary endpoint returning {codes:{...}} wrapper: `if(g.codes) g=g.codes;` and groups alias: map 'precautionary_procedure'→'precaution', 'part_location'→'zone'? Keep both displayed with GLAB fallback prettyKey.

Also glossary group keys might include 'jasc','ata','nature_code'? Unknown; generic.

OK. And in barList, escape label; for coded breakdowns where label contains counts already? fine.

Also the trend: rows may come as [{month, n}] — ✓; maybe {date:'2025-08'}? r.month fallback rL covers 'month' via rL? rL checks month ✓ (I included month in rL chain). In paintTrend I use r.month!=null?r.month:rL(r) — rL would return label first if present... if rows are {label:'Aug 2025', n} without month, my regex filter drops them → empty trend. Acceptable fallback note shown.

Edge: paintTrend peak reduce ok.

Also barList head option uses .ggrp div ✓.

Now the final full write-up. I must also include the CSS var fallbacks: define on #views: `--rust:#8a2a17; --paper:#fbf6f1;` and use literals mostly.

Also: `.vtab[aria-selected="true"]` styling alternative — I'll use class .on.

Also make sure `.panel[hidden]{display:none}` explicit.

Also `.gsub` style.

Also `#views .ghost` exists from earlier CSS presumably; fine.

Also select styling: existing page styles selects globally presumably (instrument selects) — my selects inherit ✓.

Let me now also think about `runFleet` result rendering keys: d may be {operator, models:[{label,n}], tails:[{code,label,n}], systems:[...]}. Use firstArr for each candidate key carefully:

```js
var m1=Array.isArray(d.models)?d.models:(Array.isArray(d.by_model)?d.by_model:[]);
var t1=Array.isArray(d.tails)?d.tails:(Array.isArray(d.by_tail)?d.by_tail:(Array.isArray(d.top_tails)?d.top_tails:[]));
var s1=Array.isArray(d.by_ata)?d.by_ata:(Array.isArray(d.systems)?d.systems:[]);
```

If d itself is an array → m1 stays [] and rowsAll=d → render generic 'Fleet breakdown' barList with MAPS.model guess? Use map null (safe) — but then rows unclickable. For fleet rows of models, clicking should set model filter — I'll set map MAPS.model with guess flag? MAPS.model.v uses rL(r) which for {label:'737-800',n} gives '737-800' → setFilter('model','737-800') ✓ reasonable. I'll pass MAPS.model for the generic fallback too. If labels are tails though (data unknown) misfire — acceptable risk; note in departures that shapes are assumed.

Hmm, keep the generic fallback mapless to avoid wrong narrowing? A wrong narrow is worse than no narrow. But model mapping on fleet output is very likely right. I'll keep MAPS.model on the fallback with a comment. Eh — safer: no map on the unknown fallback. Decided: mapless.

p-defect click: data-setk part with v=r.code||lab — if code absent, label may be long phrase not a part value → filter gets garbage → server validates part? part is probably not strictly validated (loose) → zero results. Hmm — fail-closed server rejects? _filters fails closed on nonexistent values for coded fields; part probably free-ish. Risk of a zero-result search. Alternative: set q to label. Same-defect rows likely have part+condition+nature; the honest repro is set q? I'll do: if r.part setFilter part=r.part; if also condition… multiple fields need multiple setFilter calls (each triggers a search → several history entries). Not great. I'll do single: prefer r.code||r.part as part; else q=label. Note it.

Similarly clusters tail buttons use data-tail (setFilter('tail', v) + show p-aircraft) ✓.

Also `data-setv` values escaped with VH; reading via getAttribute fine.

For `setRange` after month click: values 'YYYY-MM-01' and last day — from/to are inclusive real-calendar ✓ server accepts.

Also I should call `showChange` guarded in setRange? setFilter does; replicate order: show→search→showChange? spec: setFilter: el set; show; search; showChange. I'll do same.

Wait — but show('p-search') triggers... show('p-search') has no loader; just tab switch + paintScope ✓.

paintScope for p-search sets innerHTML='' ✓ (blank scope).

Also after setFilter from a panel row, the row's panel may reload? No — user is now on p-search; patterns stays loaded with old params; returning re-fetches if params changed ✓ (LOADED key = params string).

Alright, the SUBS text — make sure p-terms/p-method etc. included.

One more thing: **panel heading** — h2 text: for 'p-structure' label 'Corrosion & cracks' — H() escapes & → &amp; ✓ good ('Corrosion &amp; cracks').

The tab button text: use textContent (no escaping needed) ✓.

Now compose everything. Also add `role="tabpanel"` and `aria-labelledby` on created sections, `tabindex="0"`? Panel container focusable? Skip tabindex.

Also add id 'panels' container class 'panels' with margin-top.

Edge: `document.querySelectorAll('#views .vtab')` in show — if mount hasn't run, guard VIEW_READY before touching DOM ✓.

show also handles 'p-search' loader absent → nothing. But VIEW_LOADED for p-search never set — fine.

Also initial show(CURVIEW) at mount: if CURVIEW='p-search', no fetch ✓ ("not before" ✓).

Double-check "Switching to a tab fetches its endpoint once": show('p-patterns') → LOADED undefined ≠ key → loader → fetches trend + breakdown + phrases (three calls, once) ✓. Switching away and back: key equals stored → no fetch ✓.

Zone filter set while on p-search; switch to p-leads → fetch once ✓ scope says ignore ✓.

I think the design is solid. Now write it ALL out. I'll write CSS compactly.

Also — small thing: `optsHTML(pairs)`:

```js
function optsHTML(pairs){ return pairs.map(function(p){ return '<option value="'+VH(p[0])+'">'+VH(p[1])+'</option>'; }).join(''); }
```

And patterns select uses it.

For #fl-op fill:

```js
function fillFlOp(){
  var s=vEl('fl-op'); if(!s) return;
  var rows=normOps(facetList(OPFAC,'operator')).sort(function(a,b){ return b.n-a.n || a.label.localeCompare(b.label); });
  s.innerHTML='<option value="">Any operator</option>'+rows.map(function(r){
    var lab=r.label && r.label!==r.code ? r.label+' ('+r.code+')' : r.code;
    return '<option value="'+VH(r.code)+'">'+VH(lab)+' ('+VN(r.n)+')</option>';
  }).join('');
}
```

OPFAC/CMPFAC — both from facets(); share one var FAC.

Also guard: if facets fails, fl-op stays with placeholder + a note: I'll add an option 'The airline list did not load' disabled? Keep simple: leave as-is plus out note when runFleet with empty op: uses model path.

normOps dedupe? skip.

OK, writing final. Also I will add a MutationObserver-based makeReachable-ish? Not needed — my clickable things are <button>s ✓ keyboard-accessible. Bar rows as buttons ✓. Month bars are spans with click — NOT keyboard reachable! Fix: make .tb a <button> with class tb. Buttons in a flex row: fine. Do it: `<button type="button" class="tb" ...>`. ✓ (gridify/makeReachable from machinery also patrol buttons fine.)

Also tail buttons in clusters: ghost buttons ✓.

grow rows as <button> ✓ (non-code groups without field → render as div.grow).

In loadTerms I set `<button class="grow" data-setk...>` or `<div class="grow">` when no field. Implement conditional tag.

Length: This will be long, but that's expected. Let me write it.

Also final explanation of departures — concise bullet list.

Let me write the code in near-final form now, checking syntax as I go. I'll avoid arrow functions? Modern browsers fine; the existing page uses modern JS presumably (regex_extract etc. server-side; client used arrow-less style in spec quotes but that's prose). I'll use a mix, mostly function expressions for safety, some arrows fine. I'll target ES2017-ish (arrow, template-lite, let/const, Promise, fetch, Object.assign) — fine for "a real browser".

Potential pitfall: In `show()`, referencing `LOADERS[id]` — LOADERS defined via var at my block; show called during their boot pre-mount → guarded by VIEW_READY before reaching LOADERS ✓.

mountViews end: VIEW_READY=true; paintAllScopes(); show(CURVIEW or ?view=). Also ensure `wrap` inserted BEFORE show (panels must exist for hidden toggling) ✓ order: build → insert → VIEW_READY=true → sync tabs → show.

Also mount must add my stylesheet before building? Order irrelevant.

Also: adopting existing #p-search: if their p-search is inside some section and I move it into #panels, their code that does `psearchEl.parentNode...` could break — unlikely; they render into it by id.

Also keep p-search section hidden default true; show(CURVIEW) unhides if CURVIEW='p-search' ✓.

Write out GROUPS with exact labels. Note group 2 label contains "N reports" → I'll write: 'These ignore your selection. Each answers from all <b data-gtotal>…</b> reports, or from a slice you set inside the panel' — bold N? The verbatim doesn't specify emphasis; a plain number is safer: use <span data-gtotal>…</span>. ✓

Now — write final code. I'll be disciplined about matching brackets. Given the size, I'll structure with clear section comments.

Also, one more requirement scan: "each with its scope line, its heading, its controls where it has them, and its own endpoint." ✓. "p-fleet and p-compare load only on their own buttons." ✓. "The specification names every tab label verbatim" ✓ used. Tab strip groups named ✓.

The hero repaints — "aimPlaceholder runs on change AND on a 600ms interval, because the hero repaints and replaces the node" — that's brief 1's concern; not mine. But hero repaint could wipe my scope lines if hero re-renders a container that includes #views? No — hero paints its own region. paintHeld exists for that. Skip.

Writing the method prose with correct figures injection; also mention "reports are write-ups, not events" etc.

Also add to p-method the "16 panels" honesty statement? Not needed.

Let me finalize the CSS list (keeping it reasonably brief but sufficient):

```css
#views{margin:22px 0 60px;color:#3d2f27}
#views [hidden]{display:none!important}
.vgroups{position:sticky;top:44px;z-index:40;display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end;background:var(--paper,#fbf6f1);padding:10px 0 0;border-bottom:1px solid #e4d3c8}
.vg{display:flex;flex-direction:column;gap:0}
.vglab{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:#8b7f76;padding:0 2px 4px}
.vg[data-grp="ignore"] .vglab{text-transform:none;letter-spacing:0;font-size:11.5px;line-height:1.4;color:#8c4a2f;max-width:360px}
.vgbtns{display:flex;flex-wrap:wrap;gap:2px}
.vtab{appearance:none;background:none;border:1px solid transparent;border-bottom:none;font:inherit;font-size:13px;color:#5f534b;padding:6px 12px;border-radius:6px 6px 0 0;cursor:pointer}
.vtab:hover{color:#8a2a17}
.vtab.on{background:#fff;border-color:#e4d3c8;color:#8a2a17;font-weight:600;box-shadow:0 1px 0 #fff}
#panels{padding-top:0}
.panel{background:#fff;border:1px solid #e4d3c8;border-top:none;border-radius:0 0 8px 8px;padding:14px 18px 24px}
.panel h2{font-size:20px;margin:4px 0 2px;color:#3d2f27;font-weight:700}
.scope{font-size:13px;line-height:1.45;color:#6f6a63;background:#fdf7f4;border-left:3px solid #d8c3b6;padding:5px 10px;margin:8px 0 14px;border-radius:0 4px 4px 0}
.scope strong{color:#8a2a17}
.scope.g-ignore{border-left-color:#b0653f}
.psub{font-size:13px;color:#6f6a63;margin:0 0 12px;max-width:72ch}
.ctl{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin:6px 0 14px}
.ctl label{display:block;font-size:11.5px;color:#6f6a63;margin-bottom:3px}
.ctl select,.ctl input{font:inherit;font-size:13px;padding:4px 6px;border:1px solid #d8c3b6;border-radius:4px;background:#fff;max-width:340px}
.ggrp{font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:#8c4a2f;border-bottom:1px solid #eaddd3;padding-bottom:3px;margin:16px 0 6px}
.brow{display:grid;grid-template-columns:minmax(140px,340px) minmax(60px,1fr) auto;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid #f3e8df;padding:5px 2px;font:inherit;font-size:13px;color:inherit}
button.brow{cursor:pointer}
button.brow:hover{background:#fdf7f4}
.brow.plain{cursor:default}
.bl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gsub{display:block;white-space:normal;color:#8b7f76;font-size:11.5px}
.bb{display:block;height:9px;background:#f3e7de;border-radius:2px;overflow:hidden}
.bf{display:block;height:100%;background:#b0653f}
.bn{color:#8a2a17;font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.pnote{font-size:12.5px;color:#6f6a63;margin:8px 0}
.pfail{font-size:13px;color:#8a2a17;background:#fdf1ec;border:1px solid #f0d5cb;padding:8px 12px;border-radius:4px;margin:8px 0}
.stat{display:inline-block;vertical-align:top;border:1px solid #e4d3c8;border-radius:6px;padding:8px 14px;margin:0 10px 10px 0;background:#fdf7f4;text-align:left;min-width:110px}
.stat b{display:block;font-size:22px;line-height:1.15;color:#8a2a17;font-variant-numeric:tabular-nums}
.stat span{font-size:11.5px;color:#6f6a63}
button.stat{cursor:pointer}
button.stat:hover{border-color:#b0653f}
.trend{display:flex;align-items:flex-end;gap:2px;height:110px;margin:10px 0 3px}
button.tb{flex:1 1 0;min-width:3px;background:#c98a63;border:none;border-radius:2px 2px 0 0;padding:0;cursor:pointer}
button.tb:hover{background:#8a2a17}
.taxis{display:flex;justify-content:space-between;font-size:11px;color:#8b7f76;margin-bottom:4px}
.lead{border:1px solid #e4d3c8;border-radius:6px;padding:10px 14px;margin:0 0 10px;background:#fffdfb;max-width:860px}
.lead h3{margin:0 0 4px;font-size:15px;color:#3d2f27}
.lead p{margin:4px 0;font-size:13.5px;color:#5f534b}
.lfig{color:#8a2a17;font-weight:700}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media (max-width:860px){ .twocol{grid-template-columns:1fr} }
.grow{display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:baseline;width:100%;text-align:left;padding:6px 2px;border:none;border-bottom:1px solid #f3e8df;background:none;font:inherit;font-size:13px;color:inherit}
button.grow{cursor:pointer} button.grow:hover{background:#fdf7f4}
.gc{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:#8c4a2f}
.gl b{font-weight:600;color:#3d2f27}
.gf{color:#8b7f76;font-style:italic}
.gnote{color:#8b7f76;font-size:12px}
.mlinks a{color:#8a2a17}
.mprose p{max-width:78ch;font-size:14px;line-height:1.6;margin:0 0 12px}
.mprose b{color:#8a2a17}
```

OK. Now JS final. Let me write it fully and carefully. (I'll keep functions in a logical order: helpers → meta → renderers → loaders → scope → show/mount → boot.)

Counting the pieces again for the p-clusters card rendering: 

```js
function clusterCard(r){
  var day = r.date||r.day||r.dayofservice||''; 
  var nAc = r.aircraft!=null? Number(r.aircraft)||0 : rN(r);
  var bits=[];
  ['zone','ata','part','nature','model','operator'].forEach(function(k){ if(r[k]) bits.push(prettyKey(k)+': '+r[k]); });
  var tails=(r.tails||r.aircraft_list||r.fleet||[]);
  var th=tails.slice(0,12).map(function(t){ t=String(t).replace(/^N/i,''); return '<button type="button" class="ghost" data-tail="'+VH(t)+'">N'+VH(t)+'</button>'; }).join(' ');
  var more=tails.length>12? '<span class="pnote">and '+(tails.length-12)+' more aircraft</span>':'';
  return '<div class="lead"><h3>'+(day?VH(pdate(day))+' — ':'')+VN(nAc)+' aircraft on the same day</h3>'+
    (bits.length?'<p>'+VH(bits.join(' · '))+'</p>':'')+
    (th?'<p>'+th+'</p>':'')+more+'</div>';
}
```

pdate on 'YYYY-MM-DD' ✓; if day is 'YYYY-MM' pdate may pass through unchanged — fine.

Emerging row: implement with sub note.

Compare col():

```js
function cmpCol(side, name, field){
  if(!side||typeof side!=='object') return '<p class="pnote">No figures came back for '+VH(name)+'.</p>';
  var tot = side.total!=null?side.total:(side.reports!=null?side.reports:(side.n!=null?side.n:sumN(firstArr(side))));
  var html='<div class="ggrp">'+VH(name)+' — '+VN(Number(tot)||0)+' reports</div>';
  html+=scalStats(side,6);
  var rows=firstArr(side);
  var map = field==='operator'?MAPS.operator:(field==='make'?MAPS.make:MAPS.model);
  html+=barList(rows, map, {limit:8});
  return html;
}
```

sumN:

```js
function sumN(rows){ var t=0; (rows||[]).forEach(function(r){ t+=rN(r); }); return t; }
```

runCompare headline uses selectedOptions text — `E('cmp-a').selectedOptions[0].textContent` — careful when option list from facets; ✓.

Now loadFound headline percent: pctOf(inst_n, tot).

Also loadFound: guard tot>0.

Terms: glossary normalize + counts.

Method prose:

```js
var METHOD_PROSE =
 '<div class="mprose">'+
 '<p>Every figure on this desk comes from the FAA&rsquo;s Service Difficulty Reporting System: <b data-f="m-total">&mdash;</b> reports that mechanics filed when they found something on an aircraft broken, worn, corroded or not working, covering <span data-f="m-from">&mdash;</span> to <span data-f="m-to">&mdash;</span>. The FAA publishes the file; this desk reads it and translates the codes. It adds no reports of its own and withholds any figure it cannot compute.</p>'+
 '<p>One report is one finding, written by one mechanic, about one aircraft on one day. A heavy scheduled check fills a page with rows about the same airframe, so <b>count events, not rows</b>. <span data-f="m-undated">&mdash;</span> reports carry no date at all; they are filed at the end of every listing, after the dated ones.</p>'+
 '<p>Airline names come from the FAA&rsquo;s Air Carrier/Operator cross-reference, the December 2006 edition. Carriers have merged, renamed and ceased since it was drawn up. Before you name an airline in print, check who owns it now.</p>'+
 '<p>Findings coded B, D, E, M, T, U or X in the how-found field were made by an instrument: a warning went off, or a test failed. They were not visible from outside the aircraft.</p>'+
 '<p>Corrosion level 3 obliged the operator to notify the regulator within three days and to act across the fleet. That is a checkable fact you can put to them.</p>'+
 '<p>Ordering is fixed: newest first, ties broken on the control number. There is no user-selectable sort. Counts are of write-ups in the file, not of incidents in the world.</p>'+
 '<p>Exports hold the newest 5,000 matching reports, newest first, with a decoded column beside every coded one. The oldest reports are not in an export; narrow with a date range to reach them.</p>'+
 '<p>The FAA publishes no per-report permalink. To cite a report, use its control number and this desk&rsquo;s link, and quote the mechanic&rsquo;s words as filed.</p>'+
 '<p><span class="stat"><b data-f="m-ops">&mdash;</b><span>operators named in the file</span></span> <span class="stat"><b data-f="m-tails">&mdash;</b><span>aircraft tail numbers</span></span> <span class="stat"><b data-f="m-reps">&mdash;</b><span>reports in the desk&rsquo;s copy</span></span></p>'+
 '</div>';
```

setF fills; m-reps = total.

facets fill: 

```js
function loadMethod(){
  var b=pbody('p-method'); b.innerHTML=METHOD_PROSE;
  facets().then(function(f){ if(!f) return;
    var tot=f.total!=null?f.total:(f.reports!=null?f.reports:totalN());
    setF('m-total',tot); setF('m-reps',tot);
    setF('m-undated', f.undated!=null?f.undated:(f.no_date!=null?f.no_date:null));
    setF('m-ops', f.operators!=null?f.operators:(facetList(f,'operator').length||null));
    setF('m-tails', f.tails!=null?f.tails:(f.aircraft!=null?f.aircraft:(facetList(f,'tail').length||null)));
    var fr=f.from||f.first||f.start, to=f.to||f.last||f.end;
    setF('m-from', fr?pdate(fr):null); setF('m-to', to?pdate(to):null);
  }).catch(function(){ /* prose keeps its dashes */ });
}
function setF(id,v){ var e=vEl(id); if(!e) return; e.textContent = (v==null||v==='') ? '—' : (typeof v==='number'?VN(v):String(v)); }
```

Careful: RANGE from brief 1 could supply dates: `try{ if(typeof RANGE!=='undefined'&&RANGE){ fr=fr||RANGE.from; to=to||RANGE.to; } }catch(_){}` — add.

paintAircraft: build stats from scalars + lists:

```js
function paintAircraft(box, tail, d){
  var html='<div class="ggrp">N'+VH(tail)+' — from the whole file, not your selection</div>';
  var n = d.total!=null?d.total:(d.reports!=null?d.reports:sumN(firstArr(d)));
  html+=statCard(n,'reports on this airframe in the whole file');
  html+=scalStats(d,7);
  var ops=firstArr(d.operators||d.by_operator), sys=firstArr(d.by_ata||d.systems||d.by_system);
  if(ops.length) html+=barList(ops,MAPS.operator,{head:'Airlines this airframe flew for, as filed',limit:8});
  if(sys.length) html+=barList(sys,MAPS.ata,{head:'Systems involved',limit:8});
  html+='<p class="pnote mlinks">Check it elsewhere: <a target="_blank" rel="noopener" href="https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt='+encodeURIComponent(tail)+'">who owns N'+VH(tail)+' (FAA registry)</a> · <a target="_blank" rel="noopener" href="/data/aircraft/n'+encodeURIComponent(tail)+'">N'+VH(tail)+' on Flightradar24</a></p>';
  box.innerHTML=html;
}
```

statCard signature (n, lab, k, v) — with no k → span ✓.

Repeat offenders rows: r may have {tail/label, n}: rC picks code||value||label; if only label 'N123' → strip N ✓.

Now loadSpikes label decode: for by='operator', labels from server probably already names ✓.

MAPS.ata.v uses r.code?r.code:rL(r) sliced 2 — if label "32 — Landing gear", slice gives '32' ✓ nice. But if code '32' present fine.

For nature/crew/discovered breakdown rows lacking code but having label only: map.v returns label → filter would get a label not a code → server validates nature against CODES → rejected → whole query 400! DANGER: fail-closed server + my guessed value = "no query was run". That's bad UX but honest-fail; better to only make rows clickable when r.code exists. Adjust barList clickiness: clicky = map && (r.code!=null || map.guess===true). For ata I set guess:true (slice-2 of label robust). For operator: labels like "United Air Lines Inc (UAL)" — not a code → don't guess. model/make/part labels ARE the values → guess:true safe (model '737-800' etc. — server may validate model? model is free text like; part free; make free; model filter validated? FILTER_ARGS fails closed on "non-existent value" for coded fields; make/model/part are text matches — fine).

condition breakdown (emerging): values like 'CORRODED' — condition filter validated against CODES.condition presumably; server-returned condition codes as labels? rows may be {code:'CRCK',label:'CRACKED'}? Condition codes in the select example are literal words ('CORRODED','CRACKED','INOPERATIVE') — labels==codes. guess:true fine for condition.

partnumber → part filter: part numbers as part values — part filter matches PartName... partnumber rows are P/Ns; setting part=PN might match PartName? Probably not. Hmm — emerging by partnumber click: set q instead? q matches Discrepancy text, not P/N either. There's no P/N filter field. So partnumber rows: NOT clickable (map null). ✓ honest.

jasc → jasc filter (4-digit) ✓ if r.code present; guess if label is 4-digit.

So MAPS entries get a `guess` flag; barList: clicky = map && (r.code!=null && String(r.code)!=='' || map.guess). Set guess:true for: ata, model, part, make, condition, q (phrases: label IS the query ✓ guess true), minhours (age hours), tail handled separately. guess:false (need r.code) for: operator, nature, crew, discovered, jasc, zone, corrosion, stage, operator-compare.

Wait operator: server rows for spikes by operator surely carry code (they need it). OK.

zone labels: r.code like 'ZONE 400' needed for filter; rows may be {code:'ZONE 400',label:'Upper fuselage'} ✓.

corrosion structure cards: rC(r) gives code '1'/'2'/'3' from levels object keys ✓ clickable via my statCard(k,v) — uses data-setk corrosion data-setv code ✓ (I hand-build those, always clickable since keys are 1/2/3 ✓).

Age hours bucket regex: label like '50,000–74,999 hours' → first number 50000 ✓. If label 'Under 10,000 hours' → first number 10 → wrong (would set minhours=10). Hmm! Guard: only make clickable if label STARTS with a number: `/^\s*([\d,]+)/` — 'Under 10,000' doesn't start with digit ✓ not clickable. '50,000–74,999' starts ✓. Also require number>=1000. I'll add both conditions.

OK, also em-by 'jasc' → MAPS.jasc needs code; rows from server for by=jasc likely {code:'3230',label:'...'} ✓.

Now delegation handler also must NOT hijack clicks on selects/labels — closest([data-...]) only matches my marked nodes ✓. But .stat buttons inside structure have data-setk ✓.

One more: my delegated listener attached to wrap (#views) — panels are inside ✓; retry buttons inside panels ✓.

Now write show():

```js
function show(id){
  if(!VIEW_READY){ CURVIEW=id||'p-search'; return; }
  if(!PANELS[id]) return;
  CURVIEW=id;
  var tabs=document.querySelectorAll('#views .vtab');
  for(var i=0;i<tabs.length;i++){ var on=tabs[i].getAttribute('data-view')===id;
    tabs[i].classList.toggle('on',on); tabs[i].setAttribute('aria-selected',on?'true':'false'); }
  for(var j=0;j<VIEW_ORDER.length;j++){ var pid=VIEW_ORDER[j], s=vEl(pid); if(s) s.hidden=(pid!==id); }
  var ldr=LOADERS[id];
  if(ldr){
    var gated=(id==='p-fleet'||id==='p-compare');
    var key= gated?'shell':(FF.indexOf(id)>=0?pstr():'once');
    if(VIEW_LOADED[id]!==key){ VIEW_LOADED[id]=key; try{ ldr(); }catch(err){ pfail(id,(err&&err.message)||err); } }
  }
  paintScope(id);
  try{ if(typeof showChange==='function' && id!=='p-search'){} }catch(_){}
}
```

Drop that last no-op. Fine.

pfail body target: for gated panels, body contains controls; pfail overwrites body — retry then re-runs loader which rebuilds shell ✓ acceptable.

paintScope:

```js
function paintScope(id){
  var s=document.querySelector('.scope[data-scope="'+id+'"]'); 
  if(s){ var m=PANELS[id]; s.className='scope g-'+m.grp; s.innerHTML=scopeLine(id); }
  var gt=document.querySelector('[data-gtotal]'); var tn=totalN();
  if(gt && tn) gt.textContent=VN(tn);
}
function paintAllScopes(){
  for(var i=0;i<VIEW_ORDER.length;i++){ var pid=VIEW_ORDER[i], s=vEl(pid); if(s && !s.hidden) paintScope(pid); }
  var gt=document.querySelector('[data-gtotal]'); var tn=totalN(); if(gt&&tn) gt.textContent=VN(tn);
}
```

mountViews:

```js
function mountViews(){
  if(VIEW_MOUNTED) return; VIEW_MOUNTED=true;
  FF=(typeof FOLLOWS_FILTER!=='undefined'&&FOLLOWS_FILTER&&FOLLOWS_FILTER.length)?FOLLOWS_FILTER.slice():['p-search','p-patterns','p-found'];
  injectCSS();
  var wrap=document.createElement('div'); wrap.id='views';
  /* PLACEMENT: wrapper is inserted after the search half — the position just after the
     pre-existing #p-search section (remembered before adoption). Fallback: end of <main>. */
  var ps=vEl('p-search'), refParent=null, ref=null;
  if(ps&&ps.parentNode){ refParent=ps.parentNode; ref=ps.nextSibling; }
  var strip=document.createElement('div'); strip.className='vgroups'; strip.id='vstrip';
  GROUPS.forEach(function(g){
    var gd=document.createElement('div'); gd.className='vg'; gd.setAttribute('data-grp',g.id);
    var gl=document.createElement('div'); gl.className='vglab'; gl.id='vglab-'+g.id; gl.innerHTML=g.lab;
    gd.appendChild(gl);
    var bt=document.createElement('div'); bt.className='vgbtns'; bt.setAttribute('role','tablist'); bt.setAttribute('aria-labelledby',gl.id);
    VIEW_ORDER.forEach(function(pid){
      if(PANELS[pid].grp!==g.id) return;
      var b=document.createElement('button'); b.type='button'; b.className='vtab'; b.id='vtab-'+pid;
      b.setAttribute('role','tab'); b.setAttribute('aria-controls',pid); b.setAttribute('data-view',pid);
      b.setAttribute('aria-selected','false'); b.textContent=PANELS[pid].lab;
      b.addEventListener('click',function(){ show(pid); });
      bt.appendChild(b);
    });
    gd.appendChild(bt); strip.appendChild(gd);
  });
  strip.addEventListener('keydown', function(e){
    if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return;
    var tabs=[].slice.call(strip.querySelectorAll('.vtab')); var i=tabs.indexOf(document.activeElement);
    if(i<0) return; e.preventDefault();
    var nx=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
    nx.focus(); show(nx.getAttribute('data-view'));
  });
  var pc=document.createElement('div'); pc.id='panels';
  VIEW_ORDER.forEach(function(pid){
    var sec=vEl(pid);
    if(!sec){ sec=makeSection(pid); }
    pc.appendChild(sec); // moves an adopted #p-search into the panel stack
  });
  wrap.appendChild(strip); wrap.appendChild(pc);
  if(refParent){ refParent.insertBefore(wrap,ref); }
  else { (document.querySelector('main')||document.body).appendChild(wrap); }
  wrap.addEventListener('click', onViewClick);
  VIEW_READY=true;
  var want=null; try{ want=new URLSearchParams(location.search).get('view'); }catch(_){}
  if(want&&PANELS[want]) CURVIEW=want;
  show(CURVIEW);
  window.addEventListener('popstate', function(){
    var v=null; try{ v=new URLSearchParams(location.search).get('view'); }catch(_){}
    if(v&&PANELS[v]&&v!==CURVIEW) show(v);
    paintAllScopes();
  });
  setTimeout(watchCount,600);
}
```

makeSection:

```js
function makeSection(pid){
  var m=PANELS[pid], s=document.createElement('section');
  s.id=pid; s.className='panel'; s.hidden=true;
  s.setAttribute('role','tabpanel'); s.setAttribute('aria-labelledby','vtab-'+pid);
  if(pid==='p-search'){ return s; } // the search half owns this section's interior
  s.innerHTML='<div class="scope" data-scope="'+pid+'"></div>'+
    '<h2>'+VH(m.lab)+'</h2>'+
    (SUBS[pid]?'<p class="psub">'+SUBS[pid]+'</p>':'')+
    '<div class="pbody" id="'+pid+'-body"></div>';
  return s;
}
```

onViewClick:

```js
function onViewClick(ev){
  var el0;
  if((el0=ev.target.closest('[data-retry]'))){
    var id=el0.getAttribute('data-retry'); delete VIEW_LOADED[id];
    if(LOADERS[id]){ try{ LOADERS[id](); }catch(e){ pfail(id,(e&&e.message)||e); } }
    return;
  }
  if((el0=ev.target.closest('[data-month]'))){
    var mo=el0.getAttribute('data-month');
    if(/^\d{4}-\d{2}$/.test(mo)) setRange(mo+'-01', mo+'-'+lastDay(mo));
    return;
  }
  if((el0=ev.target.closest('[data-tail]'))){
    var t=el0.getAttribute('data-tail');
    setFilter('tail',t); show('p-aircraft'); return;
  }
  if((el0=ev.target.closest('[data-setk]'))){
    var k=el0.getAttribute('data-setk'), v=el0.getAttribute('data-setv');
    if(k&&v!=null&&v!==''){ setFilter(k,v);
      var lab=el0.querySelector('.bl'); vaim('narrowed to '+((lab?lab.textContent:el0.textContent)||'').trim().slice(0,80)+'.');
    }
    return;
  }
}
```

Hmm — setFilter signature (k,v): if v empty string = remove; my guard v!=='' prevents accidental removal ✓ (phrases could legitimately be clicked with empty? no).

Wait — data-setv could be '0'? nature code '0' skipped in machinery; fine.

setRange:

```js
function setRange(a,b){
  try{
    var f=vEl('from'), t=vEl('to');
    if(f) f.value=a; if(t) t.value=b;
    if(typeof syncControls==='function') syncControls();
    show('p-search'); search(0);
    if(typeof showChange==='function') showChange();
    vaim('showing '+pdate(a)+' to '+pdate(b)+'.');
  }catch(e){}
}
```

watchCount:

```js
function watchCount(){
  var c=vEl('count'); if(!c){ setTimeout(watchCount,700); return; }
  var last=c.textContent;
  var mo=new MutationObserver(function(){ if(c.textContent!==last){ last=c.textContent; paintAllScopes(); } });
  mo.observe(c,{childList:true,characterData:true,subtree:true});
}
```

Boot:

```js
function viewBoot(){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', mountViews); } else mountViews(); }
viewBoot();
```

Hmm — if DOMContentLoaded already queued listeners from their code, mine appended after theirs ✓.

Wait: if readyState==='loading', mountViews runs at DOMContentLoaded — but their boot might ALSO be at DOMContentLoaded with heavy async fetches; #p-search might be created synchronously in their DOMContentLoaded handler (likely — render then fetch). Their handler registered first → runs first → section exists ✓.

Now LOADERS bodies — write each carefully.

Also define pbody:

```js
function pbody(id){ var b=vEl(id+'-body'); return b; }
```

panelFail → pfail(id,msg) writes into pbody; if body missing (adopted p-search?), skip.

Trend, breakdown, phrases for patterns — done above; assemble.

Also for loadPatterns label decode: after fetching breakdown rows:

```js
var GRP2={ata:'ata',operator:'operator',model:null,part:null,nature:'nature',crew:'precaution',discovered:'discovered'};
rows=objRows(rows);
rows.forEach(function(r){
  if(r.label==null){ var c=rC(r); var grp=GRP2[by];
    var lab = grp? (by==='ata'? ataLab(c) : vcode(grp,c)) : null;
    if(lab) r.label=lab;
  }
});
```

ataLab:

```js
function ataLab(c){ try{ if(typeof ATA!=='undefined'&&ATA&&ATA[c]) return ATA[c]; }catch(_){} return c?('ATA chapter '+c):''; }
```

If ATA is const in TDZ post-init fine.

For sort: server presumably returns sorted desc; I'll sort anyway by n desc (stable display):

rows.sort((a,b)=>rN(b)-rN(a)); — careful: for ata maybe sorted by code? Spec doesn't say for breakdown; count-desc matches house style. But checker's "sorted the way it says" applies to selects; breakdowns by count desc is the house pattern (opts()). Do it.

For spikes: keep server order (spike magnitude meaningful) — sort by n desc too? "spikes" ordering by spike severity maybe; I'll keep server order untouched. Note: barList preserves given order ✓.

Emerging: keep server order (most-rising first presumably). ✓ don't re-sort.

OK — barList signature (rows, map, opts). Rows may contain strings → objRows inside.

Also `barList` uses map.k/v per row — with map.v possibly needing row; write:

```js
function barList(rows, map, opts){
  opts=opts||{};
  var rs=objRows(rows||[]).filter(function(r){ return r&&(typeof r==='object'); });
  if(!rs.length) return opts.zero||'<p class="pnote">Nothing listable came back for this.</p>';
  var max=0; rs.forEach(function(r){ max=Math.max(max,rN(r)); });
  var lim=opts.limit||14, tot=0; rs.forEach(function(r){ tot+=rN(r); });
  var out=rs.slice(0,lim).map(function(r){
    var n=rN(r), lab=String(rL(r)!=null?rL(r):rC(r)||''), code=rC(r);
    var v=null;
    if(map) v=map.v?map.v(r):code;
    var clicky=!!(map&&v!=null&&v!==''&&(r.code!=null||(map.guess)));
    var w=max>0?Math.max(1,Math.round(100*n/max)):0;
    var open=clicky?'<button type="button" class="brow" data-setk="'+VH(map.k)+'" data-setv="'+VH(String(v))+'">':'<div class="brow plain">';
    var close=clicky?'</button>':'</div>';
    return open+'<span class="bl">'+VH(lab)+'</span><span class="bb"><span class="bf" style="width:'+w+'%"></span></span><b class="bn">'+VN(n)+'</b>'+close;
  }).join('');
  if(rs.length>lim) out+='<p class="pnote">'+VN(rs.length-lim)+' more not listed; ' + VN(tot)+' in all.</p>';
  if(opts.head) out='<div class="ggrp">'+VH(opts.head)+'</div>'+out;
  return out;
}
```

MAPS.v functions must exist for entries used; define MAPS fully:

```js
var MAPS={
 ata:{k:'ata',guess:true,v:function(r){ return String(r.code!=null?r.code:rL(r)).trim().slice(0,2); }},
 operator:{k:'operator',v:function(r){ return r.code!=null?String(r.code):null; }},
 model:{k:'model',guess:true,v:function(r){ return String(rL(r)); }},
 part:{k:'part',guess:true,v:function(r){ return String(rL(r)); }},
 make:{k:'make',guess:true,v:function(r){ return String(rL(r)); }},
 condition:{k:'condition',guess:true,v:function(r){ return String(r.code!=null?r.code:rL(r)); }},
 nature:{k:'nature',v:function(r){ return r.code!=null?String(r.code):null; }},
 crew:{k:'crew',v:function(r){ return r.code!=null?String(r.code):null; }},
 discovered:{k:'discovered',v:function(r){ return r.code!=null?String(r.code):null; }},
 jasc:{k:'jasc',v:function(r){ return r.code!=null?String(r.code):null; }},
 zone:{k:'zone',v:function(r){ return r.code!=null?String(r.code):null; }},
 corrosion:{k:'corrosion',v:function(r){ return r.code!=null?String(r.code):null; }},
 stage:{k:'stage',v:function(r){ return r.code!=null?String(r.code):null; }},
 q:{k:'q',guess:true,v:function(r){ return String(rL(r)); }}
};
```

For age hours: custom map built inline.

Now the loaders, final:

loadPatterns, loadPtBrk, paintTrend, loadFound, loadAircraft, paintAircraft, loadLeads, loadSpikes, loadEmerging/loadEm, loadClusters/loadCl + clusterCard, loadDefect, loadStructure, loadAge/loadAg, loadEngines, loadConsequences/loadCq, buildFleet/fillFlOp/runFleet, buildCompare/fillCmp/runCompare/cmpCol, loadTerms + normGloss + countsFromFacets, loadMethod + setF.

facets():

```js
var FAC_P=null;
function facets(){ if(!FAC_P){ FAC_P=vget('api/facets').catch(function(e){ FAC_P=null; throw e; }); } return FAC_P; }
var FAC=null;
```

For fleet/compare fill: `facets().then(function(f){ FAC=f; fillFlOp(); }).catch(function(){ fillFlOp(); });` fillFlOp uses FAC (may be null → empty list, select stays with Any operator).

Terms uses facets() too ✓.

loadTerms:

```js
function loadTerms(){
  var b=pbody('p-terms'); if(!b) return;
  b.innerHTML='<p class="pnote">Loading the code tables…</p>';
  Promise.all([ vget('api/glossary').catch(function(){ return null; }), facets().catch(function(){ return null; }) ])
  .then(function(res){
    var g=res[0]|| (typeof CODES!=='undefined'?CODES:null);
    var f=res[1]||FAC;
    if(!g){ b.innerHTML='<p class="pfail">The glossary did not load. No code is shown rather than a half-remembered one. <button type="button" class="ghost" data-retry="p-terms">Try again</button></p>'; return; }
    if(g&&g.codes&&typeof g.codes==='object') g=g.codes;
    var G=normGloss(g), C=countsFromFacets(f);
    var html='';
    var order=[];
    Object.keys(TERMLAB).forEach(function(k){ if(G[k]) order.push(k); });
    Object.keys(G).forEach(function(k){ if(order.indexOf(k)<0) order.push(k); });
    order.forEach(function(grp){
      var inner=G[grp]||{}; var keys=Object.keys(inner);
      if(!keys.length) return;
      html+='<div class="ggrp">'+VH(TERMLAB[grp]||prettyKey(grp))+'</div>';
      html+=keys.map(function(c){
        var e=inner[c]||{};
        if(typeof e==='string') e={label:e};
        var lab=e.label||e.short||c, faa=e.faa||e.faa_wording||'', note=e.note||e.definition||'';
        var cnt=(C[grp]&&C[grp][c]!=null)?C[grp][c]:(e.n!=null?e.n:null);
        var fld=TERMFIELD[grp];
        var clicky=!!fld;
        return (clicky?'<button type="button" class="grow" data-setk="'+fld+'" data-setv="'+VH(String(c))+'">':'<div class="grow">')+
          '<span class="gc">'+VH(c)+'</span>'+
          '<span class="gl"><b>'+VH(lab)+'</b>'+
          (faa&&String(faa).toLowerCase()!==String(lab).toLowerCase()?' <span class="gf">FAA wording: '+VH(faa)+'</span>':'')+
          (note?' <span class="gnote">'+VH(note)+'</span>':'')+'</span>'+
          '<b class="bn">'+(cnt!=null?VN(cnt):'')+'</b>'+(clicky?'</button>':'</div>');
      }).join('');
    });
    b.innerHTML=html||'<p class="pnote">No codes came back.</p>';
  });
}
```

TERMLAB/TERMFIELD:

```js
var TERMLAB={nature:'What was found',precaution:'What the crew did',crew:'What the crew did',discovered:'How it was found',stage:'Stage of flight',part_location:'Where on the aircraft',zone:'Where on the aircraft',corrosion:'Corrosion',condition:'Part condition',jasc:'System (JASC)',ata:'System chapter (ATA)',cracked:'Cracking',minhours:'Airframe age',operator:'Airline',make:'Manufacturer',model:'Model'};
var TERMFIELD={nature:'nature',precaution:'crew',crew:'crew',discovered:'discovered',stage:'stage',part_location:'zone',zone:'zone',corrosion:'corrosion',condition:'condition',jasc:'jasc',ata:'ata',operator:'operator',make:'make',model:'model'};
```

normGloss:

```js
function normGloss(g){
  var out={};
  if(Array.isArray(g)){ g.forEach(function(r){ if(!r||typeof r!=='object') return; var grp=r.group||r.grp||'other'; (out[grp]=out[grp]||{})[String(r.code||r.key||r.term||'')]=r; }); return out; }
  Object.keys(g||{}).forEach(function(grp){ var v=g[grp];
    if(Array.isArray(v)){ out[grp]={}; v.forEach(function(r){ if(r&&typeof r==='object') out[grp][String(r.code||r.key||r.term||'')]=r; }); }
    else if(v&&typeof v==='object'){ out[grp]=v; }
    else if(typeof v==='string'){ out[grp]={}; }
  });
  return out;
}
```

loadDefect:

```js
function loadDefect(){
  var b=pbody('p-defect'); b.innerHTML='<p class="pnote">Grouping identical write-ups across the whole file…</p>';
  vget('api/same-defect').then(function(d){
    var rows=objRows(firstArr(d));
    if(!rows.length){ b.innerHTML='<p class="pnote">No repeated defect stood out.</p>'; return; }
    b.innerHTML='<div class="ggrp">The same defect, many aircraft — whole file</div>'+rows.slice(0,10).map(function(r){
      var lab=rL(r)||rC(r)||'Same defect'; var n=rN(r);
      var ops=r.operators!=null?r.operators:(r.n_operators!=null?r.n_operators:null);
      var span=(r.first||r.from?(pdate(r.first||r.from):(r.last||r.to?' — '+pdate(r.last||r.to):'')):'');
```

messy; simplify: meta = [ops? N(ops)+' operators':null, r.first?pdate(r.first):null, r.last?pdate(r.last):null].filter(Boolean).join(' · ');

```js
      var meta=[ops!=null&&ops!==''?VN(Number(ops)||0)+' operators':null, r.first?pdate(r.first):null, r.last?pdate(r.last):null].filter(Boolean).join(' · ');
      var v=r.code!=null?r.code:(r.part||lab);
      return '<div class="lead"><h3>'+VH(lab)+'</h3><p>'+VN(n)+' reports'+(meta?' — '+VH(meta):'')+'</p>'+
        '<button type="button" class="ghost" data-setk="part" data-setv="'+VH(String(v))+'">Show these reports</button></div>';
    }).join('');
  }).catch(function(e){ b.innerHTML='<p class="pfail">The same-defect grouping did not load ('+VH((e&&e.message)||e)+'). Nothing is shown.</p>'; });
}
```

Hmm "Show these reports" sets part filter — if v is a nature phrase, part filter may zero out. Acceptable with honest button label? I'll label the button "Narrow the search to this part" — sets expectation. If r.code missing and label looks like a phrase (has spaces>3 words) use data-setk="q". Implement: k = r.part||r.code ? 'part' : 'q'.

```js
var k=(r.part!=null||r.code!=null)?'part':'q';
```

loadStructure: as designed, plus guard when d has arrays only.

```js
function loadStructure(){
  var b=pbody('p-structure'); b.innerHTML='<p class="pnote">Counting corrosion and cracking across the whole file…</p>';
  vget('api/corrosion').then(function(d){
    d=d||{}; var html='';
    var lv=d.levels||d.by_level||d.corrosion;
    var rows = Array.isArray(lv)? lv : (lv&&typeof lv==='object'? Object.keys(lv).map(function(k){ return {code:k,n:lv[k]}; }) : []);
    if(rows.length){
      html+=rows.map(function(r){ var c=String(rC(r)); 
        return statCard(rN(r), vcode('corrosion',c)||('Corrosion level '+c), 'corrosion', c); }).join('');
    }
    var cr=d.cracked!=null?d.cracked:(d.with_cracks!=null?d.with_cracks:(d.cracks!=null?d.cracks:null));
    if(cr!=null) html+=statCard(cr,'Cracking recorded','cracked','1');
    if(!html) { var alt=objRows(firstArr(d)); if(alt.length) html=barList(alt, null, {}); }
    if(!html){ b.innerHTML='<p class="pnote">No corrosion or cracking figures came back.</p>'; return; }
    var zones=firstArr(d.by_zone||d.zones), parts=firstArr(d.by_part||d.parts||d.top_parts);
    if(zones.length) html+=barList(zones,MAPS.zone,{head:'Where on the aircraft',limit:10});
    if(parts.length) html+=barList(parts,MAPS.part,{head:'What was corroded or cracked',limit:10});
    b.innerHTML='<div class="ggrp">Corrosion and cracking, whole file — click a figure to narrow the search</div>'+html;
  }).catch(...pfail style...);
}
```

statCard clickable only when k given ✓.

loadEngines:

```js
function loadEngines(){
  var b=pbody('p-engines'); b.innerHTML='<p class="pnote">Counting engine and APU trouble…</p>';
  vget('api/engines').then(function(d){
    d=d||{}; var html=scalStats(d,4);
    var mk=firstArr(d.by_make||d.makes||d.enginemake), md=firstArr(d.by_model||d.models||d.enginemodel), sys=firstArr(d.by_ata||d.systems||d.by_system);
    if(mk.length) html+=barList(mk,null,{head:'By engine maker',limit:10});
    if(md.length) html+=barList(md,null,{head:'By engine model',limit:10});
    if(sys.length) html+=barList(sys,MAPS.ata,{head:'By system chapter',limit:10});
    b.innerHTML=html||'<p class="pnote">No engine figures came back.</p>';
    if(html) b.insertAdjacentHTML('afterbegin','<div class="ggrp">Engines — whole file</div>');
    b.insertAdjacentHTML('beforeend','<p class="pnote">There is no engine-make filter on the instrument, so maker and model bands are read-only. For flameouts and uncontained failures, use the starter questions on the instrument.</p>');
  }).catch(...);
}
```

Careful: scalStats(d,4) would pick up arbitrary strings like 'note' keys — risk of odd stats. Filter scalars to numeric or date-ish only:

Update scalStats: include numbers always; strings only if ISO date or numeric-like. Else skip.

```js
function scalStats(o,lim){ lim=lim||8; var out=[],i=0;
  for(var k in (o||{})){ var v=o[k];
    var ok=false;
    if(typeof v==='number') ok=true;
    else if(typeof v==='string'){ if(/^\d{4}-\d{2}-\d{2}/.test(v)) ok=true; else if(/^\d{4}-\d{2}$/.test(v)) ok=true; else if(v!==''&&!isNaN(Number(v.replace(/,/g,'')))&&/\d/.test(v)) ok=true; }
    if(!ok) continue;
    if(i++>=lim) break;
    var shown= (typeof v==='string'&&/^\d{4}-\d{2}/.test(v))? pdate(v) : (typeof v==='number'?VN(v):VN(Number(String(v).replace(/,/g,''))));
    out.push('<span class="stat"><b>'+VH(shown)+'</b><span>'+VH(prettyKey(k))+'</span></span>');
  }
  return out.join('');
}
```

Hmm pdate on 'YYYY-MM' returns unchanged; ok.

But scalStats on aircraft response may show junk like 'tail' strings → filtered by ok (non-numeric strings skipped) ✓ good.

loadConsequences:

```js
function loadConsequences(){
  var b=pbody('p-consequences');
  b.innerHTML='<div class="ctl"><div><label for="cq-by">Group by</label><select id="cq-by">'+optsHTML([['operator','By airline'],['model','By model'],['make','By manufacturer']])+'</select></div></div><div id="cq-out"></div>';
  vEl('cq-by').addEventListener('change',loadCq); loadCq();
}
function loadCq(){
  var by=vEl('cq-by').value, out=vEl('cq-out'); out.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/consequences?by='+encodeURIComponent(by)).then(function(d){
    var rows=objRows(firstArr(d));
    out.innerHTML='<div class="ggrp">What crews did — whole file, by '+VH(vEl('cq-by').selectedOptions[0].textContent.toLowerCase().replace(/^by /,''))+'</div>'+
      barList(rows, MAPS[by], {limit:14})+
      '<p class="pnote">A crew action is what the FAA form says the crew did, not a description of severity.</p>';
  }).catch(function(e){ out.innerHTML='<p class="pfail">…</p>'; });
}
```

loadAge:

```js
function loadAge(){
  var b=pbody('p-age');
  b.innerHTML='<div class="ctl"><div><label for="ag-by">Group by</label><select id="ag-by">'+optsHTML([['hours','By hours on the airframe'],['cycles','By takeoff-and-landing cycles']])+'</select></div></div><div id="ag-out"></div>';
  vEl('ag-by').addEventListener('change',loadAg); loadAg();
}
function loadAg(){
  var by=vEl('ag-by').value, out=vEl('ag-out'); out.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/ageing?by='+encodeURIComponent(by)).then(function(d){
    var rows=objRows(firstArr(d));
    var map=null;
    if(by==='hours') map={k:'minhours',guess:true,v:function(r){
      var m=String(rL(r)).match(/^\s*([\d,]+)/); if(!m) return null;
      var v=Number(m[1].replace(/,/g,'')); return (v>=1000)?String(v):null; }};
    out.innerHTML='<div class="ggrp">Reports by airframe age — whole file</div>'+
      barList(rows,map,{limit:12})+
      (by==='hours'?'<p class="pnote">Click a band to keep every airframe at or past that many hours. Bands that do not start with a number are not clickable.</p>'
                   :'<p class="pnote">Cycles are takeoffs and landings. The instrument has no cycle filter, so these bands are read-only.</p>');
  }).catch(...);
}
```

loadClusters/loadCl as designed.

loadEmerging/loadEm with sub note; partnumber map null:

```js
function loadEmerging(){
  var b=pbody('p-emerging');
  b.innerHTML='<div class="ctl"><div><label for="em-by">Group by</label><select id="em-by">'+optsHTML([['part','By part'],['jasc','By system'],['condition','By part condition'],['partnumber','By part number']])+'</select></div>'+
   '<div><label for="em-days">Window</label><select id="em-days">'+optsHTML([['120','Last 120 days'],['180','Last 180 days'],['365','Last year']])+'</select></div></div><div id="em-out"></div>';
  vEl('em-by').addEventListener('change',loadEm); vEl('em-days').addEventListener('change',loadEm); loadEm();
}
function loadEm(){
  var by=vEl('em-by').value, days=vEl('em-days').value, out=vEl('em-out');
  out.innerHTML='<p class="pnote">Counting…</p>';
  vget('api/emerging?by='+encodeURIComponent(by)+'&days='+encodeURIComponent(days)).then(function(d){
    var rows=objRows(firstArr(d));
    if(!rows.length){ out.innerHTML='<p class="pnote">Nothing is rising in that window.</p>'; return; }
    var max=0; rows.forEach(function(r){ max=Math.max(max,rN(r)); });
    var map=(by==='partnumber')?null:MAPS[by];
    out.innerHTML='<div class="ggrp">New defects — whole file — '+VH(vEl('em-days').selectedOptions[0].textContent.toLowerCase())+'</div>'+
      rows.slice(0,14).map(function(r){
        var lab=String(rL(r)||rC(r)||''); var n=rN(r);
        var prev=r.previous!=null?r.previous:(r.before!=null?r.before:(r.prior!=null?r.prior:(r.base!=null?r.base:null)));
        var sub= prev!=null? ('was '+VN(Number(prev)||0)+' in the comparable stretch before — '+((Number(prev)===n)?'no change':(n>Number(prev)?'up '+VN(n-Number(prev)):'down '+VN(Number(prev)-n)))) : '';
        var v= map? (map.v?map.v(r):rC(r)) : null;
        var clicky=!!(map&&v);
        var w=max>0?Math.max(1,Math.round(100*n/max)):0;
        return (clicky?'<button type="button" class="brow" data-setk="'+map.k+'" data-setv="'+VH(String(v))+'">':'<div class="brow plain">')+
          '<span class="bl">'+VH(lab)+(sub?'<span class="gsub">'+VH(sub)+'</span>':'')+'</span>'+
          '<span class="bb"><span class="bf" style="width:'+w+'%"></span></span><b class="bn">'+VN(n)+'</b>'+
          (clicky?'</button>':'</div>');
      }).join('');
  }).catch(function(e){ out.innerHTML='<p class="pfail">…</p>'; });
}
```

loadLeads + loadSpikes: assembled earlier; also leads rows with r.filters handling:

```js
function loadLeads(){
  var b=pbody('p-leads');
  b.innerHTML='<div id="ld-leads"><p class="pnote">Reading the whole file for angles…</p></div>'+
    '<div class="ctl"><div><label for="spike-by">Then watch a sudden rise in</label><select id="spike-by">'+
    optsHTML([['','Choose a grouping'],['ata','By system'],['part','By part'],['model','By model'],['operator','By airline']])+
    '</select></div></div><div id="ld-spikes"><p class="pnote">Choose a grouping above to look for spikes. Nothing is fetched until you do.</p></div>';
  vEl('spike-by').addEventListener('change',loadSpikes);
  vget('api/leads').then(function(d){
    var rows=objRows(firstArr(d));
    var html=rows.slice(0,8).map(function(r){
      var title=String(r.title||rL(r)||'Lead');
      var txt=String(r.text||r.body||r.detail||r.why||'');
      var n=rN(r);
      var acts='';
      if(r.filters&&typeof r.filters==='object'&&!Array.isArray(r.filters)){
        acts=Object.keys(r.filters).map(function(k){
          return '<button type="button" class="ghost" data-setk="'+VH(k)+'" data-setv="'+VH(String(r.filters[k]))+'">Show: '+VH(prettyKey(k))+' '+VH(String(r.filters[k]))+'</button>';
        }).join(' ');
      }
      return '<div class="lead"><h3>'+VH(title)+'</h3>'+(txt?'<p>'+VH(txt)+'</p>':'')+(n?'<p class="lfig">'+VN(n)+' reports</p>':'')+(acts?'<p>'+acts+'</p>':'')+'</div>';
    }).join('');
    vEl('ld-leads').innerHTML='<div class="ggrp">Story leads — computed on every report the FAA has published, not on your selection</div>'+(html||'<p class="pnote">No leads came back.</p>');
  }).catch(function(e){ vEl('ld-leads').innerHTML='<p class="pfail">The leads did not load ('+VH((e&&e.message)||e)+').</p>'; });
}
```

Filters values in buttons may be objects? assume scalars.

loadFound final:

```js
function loadFound(){
  var b=pbody('p-found'); b.innerHTML='<p class="pnote">Counting how findings in your selection came to light…</p>';
  vget('api/inspection-method?'+pstr()).then(function(d){
    var rows=objRows(firstArr(d));
    var INSTR={B:1,D:1,E:1,M:1,T:1,U:1,X:1};
    var inst=[],eye=[],tot=0,in=0;
```

`in` reserved-ish as var name — use inn. 

```js
    rows.forEach(function(r){ var c=String(rC(r)||'').trim(); var n=rN(r); tot+=n;
      var lab=String(rL(r)||vcode('discovered',c)||c);
      var row={label:lab,code:c,n:n};
      if(INSTR[c]){ inst.push(row); inn+=n; } else eye.push(row); });
    var html='';
    if(tot>0){
      html+=statCard(inn,'of your '+VN(tot)+' were found by instrument — not visible from outside the aircraft');
      html+=statCard(tot-inn,'were found by someone looking');
    }
    html+=barList(inst.concat(eye), MAPS.discovered, {limit:14});
    html+='<p class="pnote">Coded B, D, E, M, T, U or X means an instrument found it: a warning went off or a test failed.</p>';
    var st=firstArr((d&&(d.stages||d.by_stage))||[]);
    if(st.length) html+=barList(st,MAPS.stage,{head:'By stage of flight',limit:10});
    b.innerHTML=html;
  }).catch(function(e){ b.innerHTML='<p class="pfail">…</p>'; });
}
```

Wait — d may be object with arrays; firstArr(d) picks main array; st uses d.stages — if d IS the array, d.stages undefined → [] ✓.

Also if rows empty → statCards skipped, barList shows its zero note ✓.

Aircraft loaders as designed.

Fleet:

```js
function buildFleet(){
  var b=pbody('p-fleet');
  b.innerHTML='<div class="ctl">'+
    '<div><label for="fl-op">Airline</label><select id="fl-op"><option value="">Any operator</option></select></div>'+
    '<div><label for="fl-model">Model, as filed, e.g. 737-800</label><input id="fl-model" type="text" size="14"></div>'+
    '<div><button type="button" class="ghost" id="fl-go">Show the fleet</button></div></div>'+
    '<div id="fl-out"><p class="pnote">Choose a slice and press the button — the fleet view is not fetched until you do.</p></div>';
  vEl('fl-go').addEventListener('click',runFleet);
  facets().then(function(f){ FAC=f; fillFlOp(); }).catch(function(){ });
}
function fillFlOp(){
  var s=vEl('fl-op'); if(!s) return;
  var rows=normOps(facetList(FAC,'operator')).sort(function(a,b){ return (b.n-a.n)||String(a.label).localeCompare(String(b.label)); });
  s.innerHTML='<option value="">Any operator</option>'+rows.map(function(r){
    var lab=(r.label&&r.label!==r.code)?(r.label+' ('+r.code+')'):r.code;
    return '<option value="'+VH(r.code)+'">'+VH(lab)+' ('+VN(r.n)+')</option>';
  }).join('');
}
function runFleet(){
  var op=vEl('fl-op')?vEl('fl-op').value:''; var model=vEl('fl-model')?vEl('fl-model').value.trim():'';
  var out=vEl('fl-out');
  if(!op&&!model){ out.innerHTML='<p class="pfail">Choose an airline or type a model first. Nothing was fetched.</p>'; return; }
  out.innerHTML='<p class="pnote">Counting the fleet…</p>';
  vget('api/fleet?operator='+encodeURIComponent(op)+'&model='+encodeURIComponent(model)).then(function(d){
    d=d||{}; var html=scalStats(d,6);
    var m1=firstArr(d.models||d.by_model), t1=firstArr(d.tails||d.by_tail||d.top_tails||d.repeat_offenders), s1=firstArr(d.by_ata||d.systems);
    if(m1.length) html+=barList(m1,MAPS.model,{head:'Reports by model',limit:12});
    if(t1.length) html+='<div class="ggrp">Aircraft with the most reports</div>'+t1.slice(0,12).map(tailRow).join('');
    if(s1.length) html+=barList(s1,MAPS.ata,{head:'By system chapter',limit:10});
    if(!html) html='<p class="pnote">The fleet endpoint returned nothing listable for that slice.</p>';
    out.innerHTML=html;
  }).catch(function(e){ out.innerHTML='<p class="pfail">The fleet did not load ('+VH((e&&e.message)||e)+'). Nothing is shown.</p>'; });
}
function tailRow(r){
  var t=String(rC(r)||rL(r)).replace(/^N/i,''); var lab=rL(r);
  return '<button type="button" class="brow" data-tail="'+VH(t)+'"><span class="bl">N'+VH(t)+(lab&&lab!==t&&lab!==('N'+t)?' — '+VH(lab):'')+'</span><span class="bb"><span class="bf" style="width:'+pct(CACHED_ROWS? no...' 
```

pct needs rows context — pass width computed by caller. Simplify tailRow(r,max): compute inside via extra arg.

```js
function tailRow(r,max){ var t=..., n=rN(r); var w=max>0?Math.max(1,Math.round(100*n/max)):0; ... }
```

Caller computes max of t1.

Compare:

```js
function buildCompare(){
  var b=pbody('p-compare');
  b.innerHTML='<div class="ctl">'+
   '<div><label for="cmp-field">Compare</label><select id="cmp-field">'+optsHTML([['operator','Airlines'],['model','Models'],['make','Manufacturers']])+'</select></div>'+
   '<div><label for="cmp-a">First</label><select id="cmp-a"><option value="">choose…</option></select></div>'+
   '<div><label for="cmp-b">Second</label><select id="cmp-b"><option value="">choose…</option></select></div>'+
   '<div><button type="button" class="ghost" id="cmp-go">Compare</button></div></div>'+
   '<div id="cmp-out"><p class="pnote">Pick two and press Compare — nothing is fetched until you do.</p></div>';
  vEl('cmp-field').addEventListener('change',fillCmp);
  vEl('cmp-go').addEventListener('click',runCompare);
  facets().then(function(f){ FAC=f; fillCmp(); }).catch(function(){});
}
function fillCmp(){
  var f=vEl('cmp-field').value;
  var rows=normOps(facetList(FAC,f)).sort(function(a,b){ return (b.n-a.n)||String(a.label).localeCompare(String(b.label)); });
  ['cmp-a','cmp-b'].forEach(function(id){ var s=vEl(id); if(!s) return; var keep=s.value;
    s.innerHTML='<option value="">choose…</option>'+rows.map(function(r){
      var lab=(r.label&&r.label!==r.code)?(r.label+' ('+r.code+')'):r.code;
      return '<option value="'+VH(r.code)+'">'+VH(lab)+' ('+VN(r.n)+')</option>'; }).join('');
    s.value=keep;
  });
}
function runCompare(){
  var f=vEl('cmp-field').value, a=vEl('cmp-a').value, b2=vEl('cmp-b').value, out=vEl('cmp-out');
  if(!a||!b2){ out.innerHTML='<p class="pfail">Choose two to compare. Nothing was fetched.</p>'; return; }
  if(a===b2){ out.innerHTML='<p class="pfail">Those are the same one. Pick two different '+VH(vEl('cmp-field').selectedOptions[0].textContent.toLowerCase())+'.</p>'; return; }
  out.innerHTML='<p class="pnote">Comparing…</p>';
  vget('api/compare?field='+encodeURIComponent(f)+'&a='+encodeURIComponent(a)+'&b='+encodeURIComponent(b2)).then(function(d){
    var A=(d&&(d.a||d.left||d.first))||{}, B=(d&&(d.b||d.right||d.second))||{};
    var nameA=(vEl('cmp-a').selectedOptions[0]||{textContent:a}).textContent;
    var nameB=(vEl('cmp-b').selectedOptions[0]||{textContent:b2}).textContent;
    var map=f==='operator'?MAPS.operator:(f==='make'?MAPS.make:MAPS.model);
    out.innerHTML='<div class="twocol"><div>'+cmpCol(A,nameA,map)+'</div><div>'+cmpCol(B,nameB,map)+'</div></div>';
  }).catch(function(e){ out.innerHTML='<p class="pfail">The comparison did not load ('+VH((e&&e.message)||e)+').</p>'; });
}
function cmpCol(side,name,map){
  if(!side||typeof side!=='object') return '<p class="pnote">No figures came back for '+VH(name)+'.</p>';
  var tot=side.total!=null?side.total:(side.reports!=null?side.reports:(side.n!=null?side.n:sumN(firstArr(side))));
  var html='<div class="ggrp">'+VH(name)+' — '+VN(Number(tot)||0)+' reports</div>';
  html+=scalStats(side,6);
  html+=barList(firstArr(side),map,{limit:8});
  return html;
}
```

"Those are the same one." — awkward; write: `'Those are the same '+fieldWord+'. Pick two different ones.'` where fieldWord = selectedOptions[0].textContent.toLowerCase().slice(0,-1) ("airlines"→"airline"). Meh: use the select label: 'Airlines' → 'airline' by slicing? fragile. Just: 'Pick two different entries — those are the same value.' Simple.

normOps handles {code,label,n} rows; for models rows may be {label:'737-800',n} without code → normOps code=rL(r) ✓.

OK. SUBS object:

```js
var SUBS={
 'p-patterns':'The shape of your selection month by month, what it is made of, and the phrases the mechanics used. Every figure here follows your selection.',
 'p-aircraft':'One airframe, read from the whole file, and the aircraft that pile up reports inside your selection.',
 'p-found':'How the findings in your selection came to light: someone looking, or an instrument going off.',
 'p-fleet':'One airline or one model across the whole file. Choose the slice here, in the panel.',
 'p-leads':'Angles worth checking, computed on everything the FAA has published.',
 'p-emerging':'Part trouble that is suddenly more common than it was. Whole file.',
 'p-clusters':'Days when many different aircraft reported at once. Whole file.',
 'p-defect':'The same finding, written the same way, turning up on many aircraft. Whole file.',
 'p-structure':'Corrosion and cracking across everything published.',
 'p-age':'Where trouble sits on the airframe-age curve. Whole file.',
 'p-engines':'Engine and APU trouble across everything published.',
 'p-consequences':'What crews did, grouped the way you choose here. Whole file.',
 'p-compare':'Two airlines, models or manufacturers side by side, from the whole file.',
 'p-terms':'Every code the FAA puts on the form, with the FAA&rsquo;s own wording and the desk&rsquo;s note beside it.',
 'p-method':'Where the file comes from, what this desk did to it, and what that limits.'
};
```

Note p-terms sub contains &rsquo; — inserted as HTML ✓ (innerHTML).

GROUPS:

```js
var GROUPS=[
 {id:'narrows', lab:'Narrows to what you selected'},
 {id:'ignore', lab:'These ignore your selection. Each answers from all <span data-gtotal>…</span> reports, or from a slice you set inside the panel'},
 {id:'ref', lab:'Reference'}
];
```

PANELS with grp 'ref' for compare/terms/method ✓.

CSS injection function injectCSS with the big string; guard double-insert by id.

Also: `.pbody` wrapper id per panel; loaders target it.

One more check — `pbody('p-method')` etc. ✓.

Also `optsHTML` — used before defined? Function declarations hoist ✓ (I'll declare all as function declarations).

Order in file: helpers → PANELS/GROUPS/SUBS/MAPS/TERMLAB/TERMFIELD/var state → scope funcs → render helpers → loaders → show/mount/boot. Var initializers run in order; viewBoot() at end triggers mount possibly immediately (readyState interactive/complete since scripts at end of body run during loading... document.readyState during body script execution is 'loading' typically → deferred to DOMContentLoaded ✓ fine either way).

Potential issue: `var VH=(typeof esc==='function')?esc:...` — if their esc is a function DECLARATION, typeof works even pre-exec? Their block executed already (textually before) ✓ regardless.

One more risk: my `function show(id)` overrides — if the other brief defined show as `function show(id){...}` stub, mine wins (later declaration). ✓. If they defined `var show = function...`, my function declaration... both are var bindings essentially; function declaration assigns at hoist, their assignment runs at their execution (before my hoisted? no—hoisting happens at IIFE entry; their assignment executes when their block runs, OVERWRITING my hoisted function!). Uh oh: if they did `var show = function(){...}`, their assignment at their block-execution time replaces my hoisted function, and my later `function show` declaration — function declarations are initialized at scope entry (before any code), so sequence: hoist: show=<my function>. Their block runs: show=<their var assignment>. My block runs: (function declaration already assigned at hoist; no re-assignment at my block's execution). So final show = THEIRS. Bad. But would they define show as var? The spec I was given says show(id) triggers MY loaders and is part of MY brief; the other brief calls it. If they made a stub, likely also a function declaration (same overwrite semantics in reverse — theirs hoists first, mine hoists later and WINS because function declarations later in source overwrite earlier ones at hoist time? Both hoisted at scope entry in order: earlier declarations assigned, then later declarations assigned — final = last declaration = mine ✓). With var+assignment: final = their assignment (runs after hoist). Mixed case: their `var show=fn` + my `function show` → final theirs. Risk exists but low; can't fully mitigate (I could re-assign at my block execution: `show = ...`? Can't reassign a function declaration meaningfully... I could do at my init: nothing. Accept risk; the briefs were split so they call mine.)

Similarly they might call `show('p-search')` — fine.

Also — checkHiddenSections: my show() toggles hidden on VIEW_ORDER — includes p-search adopted; when user clicks Search tab, p-search unhides ✓.

Alright, also the retry inside pfail for loaders that pfail overwrote body (controls lost) — loader rebuilds ✓.

Also add tiny `gsub` CSS ✓ included.

I think I'm ready to write the final answer. Also must keep the response within reasonable length; it'll be long but necessary. Let me make sure I include the explanation of departures AFTER the code, concise.

Also one important labeling detail: the checker wants "every select ... labelled with its report count" — fl-op ✓, cmp-a/b ✓ (when facets provide), the fixed selects carry verbatim labels ✓. Also patterns' #pt-by is extra (documented).

Also — em-days option labels: "Last 120 days" isn't in spec examples but 3 options with 180 and year given; 120 implied ✓.

Also em-by order: spec examples start "By system" — but allowed list order is part|jasc|condition|partnumber. The select order should probably match allowed values order: By part, By system, By part condition, By part number. Examples are "e.g." not order. Keep allowed order.

spike-by: allowed ata|part|model|operator; my select: placeholder + ata,part,model,operator ✓ 5 options ✓.

cl-min: min=3|4|6|10 ✓ order 3,4,6,10 ✓.

cq-by: operator|model|make ✓.

ag-by: hours|cycles ✓.

cmp-field: operator|model|make ✓ ("Airlines, Models, Manufacturers").

OK also note: p-clusters' client-side kind filter — after change, refetch? No: filter client-side → re-render from cached rows: store CL_ROWS. Implement loadCl caches:

```js
var CL_ROWS=null;
function loadCl(){ var min=..., kind=...;
  if(CL_MIN!==min||!CL_ROWS){ fetch... CL_ROWS=rows; CL_MIN=min; }
  renderCl(); }
```

Simpler: always fetch on min change, re-render on kind change from CL_ROWS if min unchanged:

```js
var CL_ROWS=null, CL_MIN=null;
function loadCl(){
  var min=vEl('cl-min').value, kind=vEl('cl-kind').value, out=vEl('cl-out');
  var render=function(){
    var rows=(CL_ROWS||[]).filter(function(r){
      if(kind==='all') return true;
      var k=String(r.kind||r.type||r.label||'').toLowerCase();
      var sched=/sched|recur|plan|check/.test(k);
      return kind==='sched'?sched:!sched;
    });
    out.innerHTML='<div class="ggrp">One day, many aircraft — whole file, '+VH(vEl('cl-min').selectedOptions[0].textContent.toLowerCase())+'</div>'+
      (rows.length?rows.slice(0,12).map(clusterCard).join(''):'<p class="pnote">No day in the file put that many aircraft on the page at once'+(kind!=='all'?' in this kind':'')+'.</p>');
  };
  if(CL_ROWS&&CL_MIN===min){ render(); return; }
  out.innerHTML='<p class="pnote">Grouping days…</p>';
  vget('api/clusters?min='+encodeURIComponent(min)).then(function(d){
    CL_ROWS=objRows(firstArr(d)); CL_MIN=min; render();
  }).catch(function(e){ out.innerHTML='<p class="pfail">…</p>'; });
}
```

kind field presence: if rows lack kind, /sched/ tests label — weak. If r has no kind info, kind filter can't work; everything matches "not sched" → choosing 'sched' yields empty. Acceptable + note in departures.

clusterCard date: `r.date||r.day||r.day_key`; count: `r.aircraft!=null?r.aircraft:(r.n_aircraft!=null?r.n_aircraft:rN(r))`.

Also cluster label extra: r.ata decode ataLab? if r.ata present show 'ATA '+r.ata + lab. Fine as raw.

Now — a sanity check on the checker item "Switching to a tab fetches its endpoint once, and not before." — p-terms fetches glossary + facets: facets may ALREADY have been fetched (FAC_P cached) → only glossary fetch fires → still "its endpoint" ✓.

p-fleet show: buildFleet → facets fetch (cached after fleet or compare or terms) + no fleet call ✓; on #fl-go → api/fleet ✓.

Also — hmm, `buildFleet` marks VIEW_LOADED via show()'s key 'shell' ✓ (show sets VIEW_LOADED[id]=key BEFORE calling ldr ✓).

paintScope for 'p-fleet' scope line: ignore group → shows "does not narrow..." even though its operator select is a slice — correct, the scope line speaks of the instrument's selection; the panel's own slice is separate and stated in SUBS. ✓

Finally the response's opening: where markup goes. Then code. Then departures. Keep departures tight:

1. p-aircraft scope line non-blank (split truth), fixing the flagged discrepancy while keeping it in the narrows group.
2. "Once" semantics: follows-filter panels refetch when the selection changes; ignore panels fetch exactly once.
3. Enforced "ignore" client-side: no filter params sent at all on those endpoints.
4. Response shapes weren't in the spec: firstArr/rL/rN normalize; three functions to adjust if server field names differ.
5. Added #pt-by for api/breakdown's by= (the original's select inventory suggests it wasn't a select there).
6. #cl-kind third label + matching rule (regex on kind/type/label) are my reading.
7. Compare a/b are selects fed from api/facets with counts.
8. p-search section created only if absent; its interior belongs to the other brief; its scope line is blank per spec.
9. p-age cycles bands and p-engines maker/model rows are read-only because no filter field exists — stated in the panel rather than faking a click.

Also mention fleet/compare picker fetch of api/facets at show time is control population, not the panel's answer.

Let me also double check the record of "yours 1" select — not my concern.

One more possible trap: `ev.target.closest` — ev.target may be a text node? In DOM events target is element ✓. But if user clicks on SVG etc. closest exists ✓.

`document.querySelectorAll` NodeLists forEach — I used for loops mostly ✓.

In show(): `tabs[i].classList.toggle('on',on)` ✓.

Edge: VIEW_ORDER declared as `var VIEW_ORDER=Object.keys(PANELS);` at my block — object literal preserves insertion ✓.

FF var declared `var FF=null;` at top.

Also make sure `SUBS` values with &rsquo; entity: innerHTML ✓; but VH not applied (intended HTML) ✓.

Writing final code now. I'll write it as one block. Also wrap the whole of my additions in an IIFE? No — must remain in shared scope for show(). I'll keep top-level (shared IIFE) declarations with distinctive names to limit collisions.

Actually, let me reconsider one more time whether show should paint scope even when hidden target... fine.

Also `paintScope` on every show — for panels with stale `data-gtotal` update ✓.

Also add `window` no. Done deliberating — write it.

Also: careful with reserved word `in` — avoided (inn). Also `var ps` in mountViews shadows nothing.

Also in makeSection, for adopted non-search sections? Only p-search may be adopted (others can't pre-exist; if they do, adoption is fine — but they'd lack .scope/.pbody; loaders then pfail? pbody null → loaders guard `if(!b) return;`. Acceptable).

Let me write pfail to fall back to appending into section:

```js
function pfail(id,msg){ var b=pbody(id); if(!b){ var s=vEl(id); if(s) b=s; } if(b) b.innerHTML='<p class="pfail">This panel did not load ('+VH(msg||'the endpoint did not answer')+'). It stays empty rather than showing a figure from an earlier run. <button type="button" class="ghost" data-retry="'+id+'">Try again</button></p>'; }
```

Good. Compose everything.

For code length management I'll compress CSS a bit but keep readability. Final answer now.