The user is asking me to build the filter controls half of a public desk over FAA Service Difficulty Reports. This is a very detailed, precise specification. Let me work through it carefully.

The deliverable: one self-contained block — markup, CSS, JavaScript — that drops into the existing page below the instrument, inside the same IIFE, using existing helpers. I need to:

1. 19 controls with the specified ids: q, operator, make, model, part, ata, jasc, nature, crew, condition, discovered, stage, zone, tail, corrosion, cracked, minhours, from, to — that's 19 filter fields, plus #aimKind, #iAimAt, #aimDay are the aim-at controls (those live in the instrument though — "Rendered inside the instrument, twice" — but the spec says the aim box is rendered inside the instrument... hmm, but this half is "the controls"). Wait — the check says "19 controls with the ids the specification names". So the 19 FIELDS controls. The aim box markup is "Rendered inside the instrument, twice (desktop .ipad and phone .phextra)" — that means my markup block should include the aim box markup with instructions where it goes? Actually since I'm writing the block that drops in below the instrument, and the aim box goes inside the instrument... The spec says "Say where the markup goes." So I'll provide the controls markup (filter bar, more filters, aim line, starters, chips, count line, sentence, export/copy, empty state) and note the aim-box markup gets injected into the instrument's .ipad and .phextra slots via JS (safer — since I don't know the instrument markup, I can inject it with JS into placeholder containers, or provide a fragment). Actually cleaner: I provide the aim box as a JS-built fragment injected into `#aimDesk` / `#aimPhone` mount points that... but the instrument is the other half / existing page. Hmm. The brief says "Rendered inside the instrument, twice (desktop .ipad and phone .phextra)". Since I'm writing the controls half and the instrument already exists, the safest interpretation: my markup includes mount divs with ids `aimDesk` and `aimPhone` — no wait, the instrument is above, already built. I think the right approach: provide the aim-box markup as an HTML comment/template string, and have JS inject it into `.ipad` and `.phextra` elements if they exist (querying the instrument DOM). I'll build it in JS as a function that stamps the same markup into both containers, with duplicated ids? No — duplicated ids are bad. But spec explicitly says "Rendered inside the instrument, twice (desktop .ipad and phone .phextra)" — meaning two copies exist, one visible per breakpoint via CSS. Duplicate ids are technically invalid but the spec demands two copies of controls with ids aimKind/iAimAt/aimDay. Common approach: give each copy its own ids (aimKindD/aimKindM) and mirror state, OR use duplicate ids and querySelector picks the first — with the phone one hidden by CSS. The spec names ids #aimKind, #iAimAt, #aimDay, #aimSug — singular. I'll render two copies with classes and have helper `aimEl(id)` return the visible one (offsetParent check) or the desktop one; keyboard/typing handlers bind to both. Simpler: two copies with SAME ids inside different containers, and all JS uses a helper that returns the currently visible copy. That keeps the spec's id names. Events: bind 'input'/'change'/'keydown' on both copies' elements (querySelectorAll). Reading value: prefer the visible one; if desktop copy hidden (phone), read the phone copy. I'll write `aEl(id)` returning the first whose offsetParent !== null, falling back to first. Actually offsetParent is null for hidden elements (display:none). The phone copy is hidden on desktop via CSS `display:none`, and vice versa. Good.

Hmm, wait — but do I even need to build the aim box? The check list says: "19 controls with the ids the specification names", operator options with counts, nothing-chosen behavior, bad link, chip removal. The aim box is part of "the controls" half per the brief ("the controls... the starter questions..."). Yes, the brief's this-half list: "The filter controls, the chips that say what is currently selected, the starter questions, the count line, the standing sentence, export and copy-link, and the empty-on-purpose state." The aim-at box is part of the instrument ("Rendered inside the instrument"). But the brief includes the full AIM AT spec in this half's build spec, so it's mine to write. I'll include it, injected into the instrument's `.ipad` and `.phextra` containers (I'll assume those exist per spec; if not, I create mount points... I'll guard with `if(container)`).

Actually, re-reading: "Assume a function search(offset) exists and call it; do not write it." — wait, that contradicts the build spec which describes search(off) behavior in detail ("search(off): p=params()+limit=100+offset; URL = ... pushState ..."). The top says "Assume a function search(offset) exists and call it; do not write it." Hmm. But then the build spec describes search. And the checklist says "Nothing chosen: ... no api/search call" — which means my empty-state code must return before calling search. The brief says assume search exists. But the spec block describes search's internals (URL handling, pushState vs replaceState). Conflict. Resolution: the build spec is the authoritative detailed spec; the intro sentence is a budget-saving simplification. But "do not write it" is explicit... Yet the spec says things like "search() REFUSES to query when either a stray name or a refused value is present" and "Export label, set in search()" — search sets the export label. And goResults/REVEALED. If I don't write search, who does? The "other half" is "the record table". The brief says "the record table: that is the other half". Hmm, but search is the shared function. The intro says assume it exists; the spec block then describes it fully. I think the safest: I write search() — because the spec's details about URL/pushState/stray-refusal/export-label/REVEALED all hang off it, and the checklist behaviors (no api call when empty, bad link runs no query) live in search. But "do not declare a function whose name the page already uses for something else" — if the other half also declares search... The intro explicitly says assume it exists. Risky either way.

Decision: I'll write search() but guard: `var search = search || function...` — no, can't redeclare cleanly inside IIFE with function declarations. Better: define it as `S2.search` — no, other code calls search(0). Hmm. Let me do: `function sdSearchRef(...)` no...

Approach: define `function search(off){...}` but wrap: `if (typeof search !== 'function')` — inside an IIFE, hoisting means my declaration wins/collides. If the other half (which I can't see) also declares search, last declaration wins — the exact bug described with pct(). So to be safe: I should NOT declare search. Instead I define `sd2search = function(off){...}` and... no.

Re-read the intro: "Assume a function search(offset) exists and call it; do not write it." That's unambiguous for search specifically. The detailed spec describing search(off) is presumably there because this spec block was shared context (it's the full build spec including both halves — note it describes hero repaints, panels, VIEW_GROUPS, which belong to the instrument/panels halves). So the spec block is the WHOLE build spec for the whole page; my half is only the controls portion. The intro narrows it: write the controls; call search; don't write it. And "Say where you departed from the specification and why." So departing from the spec's search section by NOT writing it is actually following the intro — and I should note that in the departures: search(), goResults(), and the API-facing query machinery are assumed present per instruction; I only implement the client-half refusal checks around... hmm, but who implements strayParams refusal? The spec says "search() REFUSES to query when either a stray name or a refused value is present". If search is theirs (other half? no — search is shared core)... 

Actually wait: maybe search() belongs to the instrument half (already written, "existing page... using the existing helpers"). The instrument half is "already built" ("You rebuilt the instrument" — the instrument is done and live). So search() already exists in the page. My block drops in below it inside the same IIFE. So: I call search(), I don't define it. But then the empty-on-purpose "returns before any search runs" — that logic lives in search() itself (spec: "Triggered when nothing is filtered AND REVEALED is false. Renders and RETURNS BEFORE ANY api/search CALL"). Hmm, but the empty-state markup/buttons are mine. If search() already exists and handles that... then my job is just: markup for the empty state? The spec says the empty state renders body+buttons in the results zone. If search exists and handles it, it would need the markup generator... circular.

OK. Pragmatic resolution: I will provide everything EXCEPT the network-fetching core, but I'll write search() defensively: `var search = window.__sdSearch || function(off){...}` — no.

Cleanest: I'll write the full search() as the spec describes, and state as a departure: "the brief's intro says to assume search() exists, but the build spec assigns search() the empty-on-purpose gate, the fail-closed link refusal, and the export label — none of which can live anywhere else in my half. I defined it as `sdSearch` and, if a `search` is already defined, mine defers: I call the existing one when present." Concretely:

```js
var sdPrevSearch = (typeof search === "function") ? search : null;
function search(off){
  ... my full implementation per spec ...
}
```
That's still a redeclaration. Inside the same IIFE, `function search` hoists and would shadow... If the existing page already declared `function search` earlier in the same IIFE, my later declaration replaces it — exactly the pct() bug. So I must NOT declare `search`.

Alternative: name mine `search2`? Other code (chips, buttons, starters) call search(0) — I control those call sites, so they can call mine. But the instrument's controls call search(0) too, and the spec's search handles pushState etc. If search already exists and works, my half just needs to: build controls, and provide `setFilter`, `syncControls`, chips, starters, aim machinery, export, and the empty/refusal states — the latter two triggered by... search() itself. If the existing search() already implements the spec (empty-on-purpose, refusal), then my block only needs to supply the RENDER functions it calls? But I don't know their names.

Given genuine ambiguity, the most useful deliverable: a self-sufficient block that works even if search() exists, by defining my own pipeline under a prefixed name and wiring it as follows:

- If `typeof search === "function"` (exists from earlier half), I keep a reference BEFORE declaring anything and I name my own `sdSearch(off)` and set a shim: `search = sdSearch`? Can't reassign a function declaration's binding... actually you CAN assign to a function declaration's binding (they're mutable bindings). `function search(){}` then later `search = sdSearch;` reassigns fine. But if search was declared with `function search` in the same scope, assignment works. If it's a `var search = ...` also works. If it's a const — fails. Risky but works in the common case.

Hmm, but reassigning breaks if the other half captured a reference... they'd call the binding, fine.

I think I'm overengineering. Let me decide with judgment: The strongest reading of the whole message — "Assume a function search(offset) exists and call it; do not write it." — is a direct instruction to me. The spec block that follows is the master spec for the whole page (both halves were generated from it), included so I know the contracts. My job: controls markup + the functions the controls need (params, setFilter, opts building, chips, starters, aim box, aimAtGo, takeReading, handOff, aim/aimHold, export/copy, clauseText/sentenceHTML, scopeLine, filterWords, refused handling client-side). The empty-on-purpose and fail-closed link handling are described in the spec but live in search() — which exists. HOWEVER, the checklist says "Nothing chosen: the 'on purpose' text and no api/search call" will be checked in a browser — meaning my delivered code must produce that. If search() exists and implements it, fine. If I deliver without search, the checker sees no "on purpose" text unless something renders it at boot.

At boot, my block needs an init: restore values from URL into controls, catch UNRESOLVED, build option lists (needs counts — from where? api/counts? The spec says opts() builds pickers with counts — presumably from a summary endpoint like the hero data). I'll assume an existing global like `CODES`, `RANGE`, `TOTAL`, `num()`, `prettyDate()`, `el()`, `apiFetch` or `fetchJSON`... The intro says "using the existing helpers". I don't know their names. Dangerous. I'll define my own small helpers with prefixes where uncertain, and use `fetch` directly against relative endpoints `api/vocab`, `api/resolve`, `api/search`, `api/export`. For counts for the pickers: spec says "opts() builds the six coded pickers sorted BY REPORT COUNT DESC" — I need per-value counts for operator, nature, crew, condition, discovered, stage, zone, tail? and make/model? "#operator populated with thousands of options, each labelled with its count." So there must be a facets/counts endpoint. Not named in the spec. The original had "select menus 22, options 11,444" — counts per option. I'll assume `api/facets` returning `{operator:{code:{label,n}}, nature:{...}, ...}`. Since it's not in the spec, I'll fetch it at boot and note the assumption in departures. Alternatively use CODES (glossary) + a counts call. The spec mentions CODES.nature, CODES.precaution, CODES.part_location — so CODES exists (loaded from /api/glossary). I'll use an existing global `CODES` if present, else fetch /api/glossary myself into a local (prefixed) cache — the brief notes "Your page never calls /api/glossary at all" as a fault, so my half should ensure it's loaded. I'll do: `var sdCODES = (typeof CODES!=="undefined"&&CODES)?CODES:await fetch('/api/glossary')...` — since it's an IIFE, can't top-level await unless async. I'll do it inside an async init().

For facet counts: I'll try `api/facets` and, if it 404s, fall back to rendering options without counts? The check says operator options each labelled with its count — so counts are required. I'll write a `loadFacets()` that fetches `api/facets` (documented assumption), building option lists from it. Sorted desc by n, zero-count included with "(no reports)" class empty.

This is getting big. Budget: "the ceiling covers reasoning and writing together... reasoning effort is set lower to leave room for the code." So I should keep thinking modest and produce the code. Let me now plan the code structure concretely and write it.

Structure of the deliverable:

```
<!-- ===== CONTROLS HALF — place directly after the instrument markup, inside the page's main IIFE source (script parts go inside the same IIFE) ===== -->
<section id="sdZone" ...>
  markup:
  - aim box? (injected into instrument's .ipad/.phextra by JS)
  - filter bar (primary row): #q + datalist #qList, #operator, #from, #to, Search button, Clear button, "More filters" <details id="moreFilters"><summary>More filters <span id="mfCount"></span></summary> ... selects ...
  - aim line: <div id="iAim" role="status" aria-live="polite"></div>
  - starters: <div id="starters"></div> + toggle button #starterToggle
  - chips: <div id="chips"></div> (includes #unresolved)
  - count line: <div id="count"></div>
  - sentence: <div id="sentence"></div>  (spec calls it "standing sentence" with .clause spans; scopeLine for panels is panel-side but I'll provide scopeLine + filterWords + VIEW_GROUPS helper as functions since panels half uses them? The spec says scopeLine and VIEW_GROUPS — panels half probably renders them; I'll include the functions since they're cheap and referenced by sentence machinery... Actually to save budget and avoid collisions, I'll include scopeLine/filterWords/viewGroups because spec lists them under "STATING THE SELECTION IN WORDS" which is my section.)
  - actions: Export button #exportBtn, Copy link #copyBtn + #copied
  - results mount where the other half renders? The record table is the other half; my "Read all N anyway" reveals. The empty state renders into a container — I'll render into #count (count line) and a #emptyNote area plus buttons; the table zone below is other half's. I'll render the empty state into a div #noRows that sits above the table mount.
</section>
```

JS functions (all prefixed sd2 where collision-prone; spec-named functions like params/setFilter/syncControls/opts/aimAtGo/takeReading/handOff/aim/aimHold/unaim/paintHeld/aimPlaceholder/starter/resetAll/revealAll/goResults/copyLink/showChange/sentenceHTML/clauseText/scopeLine/filterWords/strayParams/dropRefused/dropStray/leave_one_out — I'll use the spec names for the ones likely unique, prefixed where generic risk: params is very collision-prone → I'll keep spec name? The brief warns about pct(). `params`, `opts`, `aim`, `search` are risky. I'll prefix: `sdParams`, `sdOpts`... but then existing instrument code calling `setFilter` — no, instrument half is done; controls are mine; the spec names are the contract between halves though. Hmm — if the instrument half (already written) calls `setFilter('q','x')` from a rail click, my function must be named setFilter un-prefixed. The brief says "Do not declare a function whose name the page already uses for something else" — setFilter IS the spec name, so the page uses it for this. I'll use spec names for: setFilter, params, showChange, syncControls, syncMoreFilters, aimAtGo, takeReading, handOff, aim, aimHold, unaim, paintHeld, aimPlaceholder, starter, resetAll, revealAll, copyLink, clauseText, sentenceHTML, scopeLine, filterWords, strayParams, dropRefused, dropStray, opts, sugFetch. And search per instruction NOT declared. opts is risky-ish but spec-named; I'll keep `opts` since spec names it... Actually "opts" is generic enough to worry me. The pct() incident happened because two blocks BOTH followed spec names with different signatures. Within one block I define each once, so intra-block collision is nil. Cross-block: the other half is "the record table" — unlikely to define opts/aim. The instrument half already exists — if it defined aim/aimHold (it paints hero...). Spec says aim line is in my section ("THE AIM LINE" is in this build spec, and aimHold is called by takeReading which is mine). I'll trust spec names except `search` (instructed) and I'll prefix only clearly generic ones I invent: my helpers get sd2 prefix (el cache, num fallback, esc, debounce, etc.). For safety I'll define local `function el(id){return document.getElementById(id)}` — el is common; use `sdEl`. Keep a small runtime-adapter: `sdNum` uses existing num if defined.

Given the instruction "Assume search exists and call it", my search-calling sites: setFilter, starter via setFilter calls, handOff, takeReading, revealAll, aimDay, chips removal → all funnel through setFilter or call search(0) directly. If search doesn't exist at runtime (checker's fresh page with only my half?), everything breaks — but the checker said it's "the existing page", so search exists. Also goResults: "REVEALED is set ONLY by goResults(). resetAll() sets it false again" — goResults is presumably the other half's / instrument's "Run" handler? The "Read all N anyway" button → revealAll(): sets REVEALED=true then search(0). I'll define REVEALED, goResults, revealAll, resetAll in my block (they're controls-side). But wait — if search exists already and IT contains the empty-on-purpose gate reading a REVEALED variable... it would reference whatever the existing code has. I can't resolve this perfectly. I'll implement search-gated logic in MY block at boot: instead of relying on existing search's internals, my boot does the restore + refusal checks + empty check, and only calls search(0) when appropriate. But setFilter etc. call search(0) directly — at that point the user has acted, so a search should run (setFilter sets a value → not empty → search runs normally). The empty-on-purpose gate only matters at boot and after resetAll/Clear. So: my boot logic:

```
boot():
  restore controls from URL; catch UNRESOLVED
  build datalist? vocab is dynamic
  set date min/max from RANGE (existing global) else fetch api/range? assume RANGE exists
  load facets; build opts
  inject aim boxes
  build starters
  const strays = strayParams(); const refused = keys of UNRESOLVED;
  if (strays.length || refused.length) -> renderNoSearch(strays, refused)  // client half of fail-closed
  else if (!sdHasAnyFilter() && !REVEALED) -> renderOnPurpose()   // no search call
  else search(0)
```

But spec says search() itself refuses. Since I can't edit search, doing it in boot + in setFilter... setFilter can't introduce strays or refused values (it sets DOM then search). Actually it could: selecting an option is from valid list; q free text is q which server LIKE-escapes; aimAtGo sets jasc/zone/etc from resolve readings — valid. UNRESOLVED only arises at boot from a bad link. So gating at boot covers "a bad value in the link runs no query and says so" — provided the existing search() wouldn't also be called by the instrument's own boot before mine... can't control that. I'll note the departure: refusal gate implemented at boot + as `sdGuard()` that wraps search-call sites in my half via `sdSearch(off)` = guard then `search(off)`. All my call sites call sdSearch. Clean. And I keep search undeclared. 

Also spec: "A 400 from the server folds into the SAME path" — server-side 400 handling is in search/the fetch layer; I'll expose `sdNoSearch(html)` used by boot; and if the existing code shows 400s elsewhere, fine.

Count line (#count) content: spec gives exact texts for: no-search, on-purpose, stale, nothing selected, something selected, drift. Who renders #count? The spec's search() presumably renders it after each search (it knows d.total). Since I don't own search, I'll render #count at boot for the no-search and on-purpose cases, and provide `renderCount(d)` that the... hmm, the table half renders rows and knows totals. I'll expose `renderCount(d)` and `sentenceHTML(d)` as globals for the other half to call, and also hook: if search returns a promise? Unknown. I'll have my fetch layer... I'm not fetching. OK: I'll define `sdAfterSearch(d)` — no. Practical: I'll define `renderCount` and `renderSentence` and document that the table half calls `renderCount(data)` after each api/search; ALSO, to make the checklist pass standalone, after any sdSearch from my half I can't see data. Compromise: I'll wrap: my sdSearch calls search(off); if the result is a promise resolving to data, render count/sentence from it. That's a nice graceful touch:

```js
function sdSearch(off){
  var g = sdGuard(); if (g) return sdNoSearch(g);
  var r = search(off);
  if (r && typeof r.then === "function") r.then(function(d){ if(d && typeof d.total==="number"){ renderCount(d); renderSentence(d); } }).catch(function(){});
  return r;
}
```

Good. Export label: spec says set in search() — I'll set it in renderCount instead (has total). Note as departure.

Export button: href? I'll make it an <a> with href built at renderCount time: `api/export?` + params(). Filename/capping are server-side per spec. Label logic from total. Disabled when total===0 or no-search.

Copy link: navigator.clipboard.writeText(location.href); #copied "copied" 1500ms.

Starter questions: array of 18 {label, params}. starter(i): clear every field (all FIELDS → ''), then apply q's params, then setFilter? Spec: "starter(i) CLEARS EVERY FIELD FIRST, so starters never stack." After clearing, set each k,v via el, then search(0). Use setFilter per key? That would call search multiple times. I'll clear, apply, then one search(0) + showChange. But spec says setFilter is the universal path... starters need batch. I'll do batch then single sdSearch(0) + showChange(). Fine. Also REVEALED: picking a starter is choosing something → the empty-on-purpose no longer applies; search runs normally. Should starter set REVEALED? It's "set ONLY by goResults()" — starters aren't goResults. But after a starter, params non-empty so gate passes anyway. However "Read all N anyway" (revealAll) sets REVEALED=true. Clear button → resetAll() sets REVEALED=false, clears fields, renders on-purpose. Search button (primary "Search") with nothing set: should it reveal? The on-purpose text says "To read the file straight through anyway, use the button at the foot of the instrument" — hmm, "foot of the instrument" — that's a different button (goResults, instrument side). My primary "Search" button with empty fields: I'll make it also just reveal? Safer: Search with empty params → treat as revealAll? Spec doesn't say. I'll make the primary Search button, when params empty, run revealAll() (equivalent to asking for everything explicitly — the user pressed Search deliberately). Note it. Actually simpler and safer to spec: Search with nothing → showChange + focus starters? Hmm. The spec's empty state mentions "set a filter" as routes. Pressing Search IS setting intent. I'll have it call goResults() (sets REVEALED=true) then sdSearch(0). Define goResults(){REVEALED=true; sdSearch(0);}. Good.

Chips: buildChips(): container #chips. For each UNRESOLVED key (in FIELDS order): warn chip. For each live param (params() order = FIELDS order... spec says CLAUSE_ORDER for the sentence; chips "Then one per live parameter" — I'll iterate FIELDS order; a key in UNRESOLVED is skipped from normal chips). Decoding `shown`:
- q: “text”
- operator: label from facets (name + code) → I'll decode via sdCode/facet labels; fallback raw.
- ata: "ATA["+v+"]"
- jasc: CODES.jasc?.[v] label or v
- nature/discovered/stage/condition/corrosion: code tables; crew → CODES.precaution; zone → CODES.part_location
- tail: "N"+v; cracked:"recorded"; minhours: num+" hours"; from/to: prettyDate.
Each x: setFilter(k,'') with aria-label "Remove filter Label: shown".

UNRESOLVED note in #unresolved div when any: exact sentence.

Also chips appear on showChange: showChange(){buildChips(); scroll chips/count into view ONLY upwards: if (rect.top < 0) scrollIntoView}. Implement: only scroll if the chips block is above viewport.

clauseText(k,v) and sentenceHTML(d): per spec. periodClause: from/to → `from X to Y` combined; I'll implement: if from&&to → `from ${prettyDate(from)} through ${prettyDate(to)}`; if only from → `from ${prettyDate(from)}`; only to → `through ${prettyDate(to)}`. data-drop on the period clause is "from|to" — handle in click: if data-drop contains "|", drop both.

Sentence stale check: HERO_FOR global (existing? I'll read `typeof HERO_FOR!=="undefined"?HERO_FOR:null` — risky; I'll manage my own: sdHeroFor updated in sdSearch: set HERO_FOR = params().toString() after a successful search, and compare in renderSentence. Spec: "if HERO_FOR!==null && HERO_FOR!==params().toString()" — I'll initialize HERO_FOR=null and set it in the .then of sdSearch. LAST_TOTAL drift check: keep sdLastTotal; when d.total!==LAST_TOTAL and LAST_TOTAL!==null → broken span. Spec: "when d.total!==LAST_TOTAL" — first render LAST_TOTAL null, set after.

scopeLine(id, n): per spec; filterWords(): join clause texts with ", " (used for panels). VIEW_GROUPS: I'll just define the object (panels half uses it); cheap.

Empty-on-purpose render: #count text, then a block (I'll render into `#resultsIntro` / reuse table mount? Table is other half's. I'll render into a `#onpurpose` div placed above the table mount, and set #count.) Buttons: revealAll → REVEALED=true; hide #onpurpose; sdSearch(0). Second button "Show me the starter questions" → scrolls to #starters and opens .all + focus.

strayParams(): iterate location.search keys, return those not in URL_KNOWN set. URL_KNOWN = FIELDS + view, hero, case, aircraft, ca, cb, cf.

UNRESOLVED: at boot restore: for each FIELDS k: u=get(k); if u!=null: e=el(k); e.value=u; if e.value!==u → UNRESOLVED[k]=u; also values that are set but invalid per client-side rules? Spec: refusal is server's; client catches select-refusal. Also jasc via hidden input can hold anything (set by resolve), selects for nature etc. would refuse bad values → caught. minhours/from/to are inputs — can't catch client-side; server rejects. Fine.

dropRefused(k)/dropStray(k): remove from UNRESOLVED / reload without stray? Spec lists them as removal routes "on a rejected link". For UNRESOLVED: setFilter(k,'') basically (clear control) + delete UNRESOLVED[k] + rebuild chips + then run? After dropping the refused value, the remaining link is valid → run search. I'll implement dropRefused(k){delete UNRESOLVED[k]; el(k).value=''; sdRerunAfterRefusal();}. For stray params (not tied to a control): dropStray can't remove via control — must rewrite URL: build URL minus strays, location.replace? Or history.replaceState with cleaned search then rerun. I'll do: clean URLSearchParams minus strays, replaceState, then rerun guard → passes → search. Implement.

leave_one_out ghosts (".zero block's Drop X -> N reports"): that's in the zero-result row which is table half. I'll provide `sdLeaveOut(data)`? Skip — table half. Actually spec lists it under removal routes but building zero-result UI is table-side. I'll expose setFilter and that's enough.

Aim box: inject into `.ipad` and `.phextra` (querySelector on document; the instrument has these classes per spec). Build markup once via function returning HTML string with ids; since two copies with same ids, my aEl(id) helper picks visible. Bind events on both (use querySelectorAll('#aimKind') etc. — duplicate ids make querySelectorAll work, returns both). Events: change on aimKind → aimPlaceholder + close sug; input on iAimAt → typing logic; keydown; click aimAtGo via onclick attr (fine — global function, single logic reads visible copy). aimDay change → set from/to both, sdSearch, aimHold.

aimPlaceholder: sets placeholder on visible input per aimKind value; run on change + setInterval(600).

sugFetch: q>=2 chars → debounce 220 → seq guard; free text kind (""): api/vocab; else api/resolve?q&kind. Build SUG filtered list; render grouped headings (only groups with rows); rows: div.sug (class on for highlighted SUGI; nought for zero-count-kept). Store SUG as array of {kind,label,n,what}. Click → takeReading (if !nought; nought inert: no click handler / pointer-events). Keyboard on the input: ArrowDown/Up modify SUGI, Enter → if SUGI>=0 take SUG[SUGI] else aimAtGo(); Escape → hide.

aimAtGo(): per spec. raw = visible iAimAt value trimmed; kind = visible aimKind value ("period","operator","tail","zone","jasc",""). Empty → return. kind===""→handOff(). Else fetch api/resolve?q=raw (NO kind) → readings. opts/empties/word split. Messages per spec, rendered into the aim line (#iAim) via aim()/aimHold with buttons — buttons need handlers: `Search the write-ups for "x" instead` → handOff with that raw; the multi-choice buttons → takeReading(o). I'll build DOM with createElement and addEventListener (avoid inline string quoting of user text). takeReading: period → from/to. Readings for period presumably carry {from,to} or {y, m}. I'll expect o.from/o.to (ISO) clamped to RANGE overlap: from=max(o.from,RANGE.from), to=min(o.to,RANGE.to). aimKind reset to ''? Keep. Then set control values: for others: if kind is one of FIELDS → setFilter(kind, o.v ?? o.code ?? o.label). resolve returns what fields? Unknown — I'll accept o.value||o.code||o.v. aimHold(`took ${o.label}, ${o.what}, ${num(o.n)} reports. [undo]`) with undo button → history.back(); unaim().

aim(text): refuse while HOLD live. aimHold(text, 6000): HOLD={text,until:Date.now()+6000}; paint. paintHeld(): re-apply after hero repaint — register via interval too (the same 600ms interval can call paintHeld). unaim(): clear unless hold live.

Undo semantics: aimHold renders `[undo]` button → onclick history.back(); unaim().

handOff(): el('q').value=raw; sdSearch(0); q.scrollIntoView+flash class 1400ms; aimHold(`searched the write-ups for "${raw}", not a category.` + undo).

Vocab datalist for #q: on input ≥3 chars debounce 180 → api/vocab?q&limit=10 → fill datalist options label "N reports" (option value=term label=`${term} — N reports`? spec: options labelled "N reports" — I'll set option value=term, and label attribute `${term} · ${n} reports`). qSugSeq guard.

Date min/max: RANGE existing global {from,to} → set el('from').min=max etc. If RANGE undefined, try to derive from a fetch of api/range? I'll guard: if typeof RANGE undefined, skip (note in departures). Actually I can attempt fetch('api/range') fallback. Keep small: if no RANGE, fetch api/range and set. Cheap lines.

Facets: fetch('api/facets') → object keyed by field → {value:{label?, n}} or {value:n}. I'll normalize. Build opts for the six coded pickers per spec skips, plus operator, make, model, part, tail? Spec's THE CONTROLS lists make, model, part, ... as selects in More filters with empty labels. opts() "builds the six coded pickers" — six coded pickers: nature, crew, condition, discovered, stage, zone (corrosion is 1/2/3 — numeric; spec includes corrosion in "Any corrosion level" select with skip ["1"]?? wait skip list: corrosion ["1"]?? "Skips: nature ["0"], crew ["0","K"], discovered ["0"], corrosion ["1"], stage ["00"], zone ["ZONE 000"]." Hmm corrosion skip ["1"] seems odd — maybe corrosion codes are 0/1/2/3 and "1" is trivial? Spec earlier: corrosion only "1","2","3" valid. Skip ["1"]?? That contradicts starter "Corrosion past the limit {corrosion:2}". Wait maybe corrosion codes are like "0","1","2","3" where 1 is minor... but server validates only "1","2","3". If we skip "1" as an OPTION, corrosion options are 2 and 3. Hmm, odd but I'll follow the spec literally: skip value "1" in the corrosion picker. Hmm wait, maybe it's a typo for corrosion ["0"]... I'll follow spec literally and note it? The instruction says explain departures; following literally isn't a departure. OK, corrosion options: (none selected/Any), 2, 3 — plus maybe... whatever facets provide minus "1". Fine.

So "six coded pickers" = nature, crew, condition, discovered, stage, zone? That's six! Plus corrosion is a seventh small one. And make/model/part/operator/tail come from facets too (operator thousands). make/model/part/tail are selects? Spec: More filters: make, model, part — selects presumably from facets. tail: input text probably (thousands of tails; but original had options 11,444 total...). I'll make tail a text input (placeholder e.g. N583) — spec gives no "Any tail" empty label, and empty-label list includes zone etc but tail's not listed with a label... The empty-label list: "Any operator, Any manufacturer, Anything found, Anything the crew did, Any part condition, Found by any method, Any stage of flight, Anywhere on the aircraft, Any corrosion level, Cracked or not, Any airframe age" — that's 11 labels for: operator, make, crew?? wait "Anything found"=nature? Hmm: nature = Nature of condition → "Anything found"? and "Found by any method"=discovered. crew="Anything the crew did". condition="Any part condition". make="Any manufacturer". No labels for model, part, jasc, ata, tail (those get plain labels or first-option "Any model" etc. — I'll give sensible ones: "Any model", "Any part", "Any system code (JASC)" handled via hidden input + display, ata "Any ATA chapter", tail "Any tail number"... wait tail should maybe be select from facets; I'll do input to keep DOM light; note nothing).

jasc: "HIDDEN input, settable only by clicking a system or via AIM AT" — so no visible select for jasc; a hidden input id=jasc; its value shows as a chip / in more-filters summary count. OK.

ata: visible select? "ata" listed in More filters items. ATA = 2-digit chapters (orginal had options). I'll build ata select from facets (counts), skip none, empty label "Any ATA chapter". jasc hidden.

minhours: number input. cracked: select with options "" (Cracked or not), "1" (Cracked — "recorded"). corrosion select: Any corrosion level, 2 → "Level 2 (past the limit)"? decode via code('corrosion') if available else "Level 2". I'll decode via CODES if present.

Counts source for coded pickers: facets endpoint. I'll also merge CODES labels: label = CODES[field][value]?.label || value.

Sorting desc by n; zero counts included with class empty and label "(no reports)" — for coded pickers, include all CODES values even if facets missing? To guarantee "(no reports)" appears, union of facet keys and (for coded fields) CODES keys, minus skips. Good — that satisfies "an option with no reports says so rather than being hidden."

operator: thousands of options sorted desc by n; label "Name (CODE) (12,345)"? spec chip decode is "Name (CODE)"; option label per spec: `"Label (12,345)"` where Label is the operator name. I'll do name + " (" + n-format + ")". If facets absent → fallback: fetch api/facets?field=operator? Keep one endpoint assumption: GET api/facets returns all at once. Document departure.

Now HTML markup layout. Where does markup go: "directly below the instrument markup; the <script> portion goes inside the existing IIFE at the same point." I'll deliver as:

```
<!-- 1) MARKUP: place immediately after the instrument's closing tag -->
<div id="sdControls"> ... </div>
<!-- 2) CSS -->
<style>...</style>
<!-- 3) JS: paste inside the IIFE, after the instrument's own script -->
<script>...</script>  → but "inside the same IIFE" — a nested <script> can't be inside an IIFE physically. The instruction: "It drops into the existing page below the instrument, inside the same IIFE, using the existing helpers." So they'll paste the JS body into the IIFE. I'll present JS as a plain block (no <script> wrapper, no IIFE of its own) and say: paste inside the IIFE after the instrument code. Markup as one HTML chunk (say: insert right after the instrument section). CSS in <style> (anywhere).
```

But my JS runs init immediately — needs DOM present; instrument is above, so controls markup is already parsed when the IIFE body reaches my code, if markup is above the script. Good — say that.

Existing helpers I'll rely on (and guard): num → sd2Num fallback (n.toLocaleString('en-US')); prettyDate → sd2Pretty fallback (ISO → "12 March 2024"?); el → sd2$; CODES, RANGE, TOTAL, hero globals → guarded typeof checks. search → assumed; sdSearch wraps.

If TOTAL/RANGE missing, fetch api/range returning {total, from, to}? To keep the checklist ("No rows yet" prints TOTAL), I need TOTAL. I'll bootstrap: `var sd2Range = (typeof RANGE!=="undefined"&&RANGE)?RANGE:null; var sd2Total=(typeof TOTAL!=="undefined"&&TOTAL!=null)?TOTAL:null;` and if null, await fetch('api/range') → set both. Boot is async.

Let me also handle showChange(): "scrolls so chips/count are visible, but ONLY UPWARDS". Implementation: const t=el('sdChips'); r=t.getBoundingClientRect(); if(r.top<0) t.scrollIntoView({block:'start'}); (also never scroll down: skip if r.top>=0). 

Now the "Search" primary button: onclick = goResults(). "Clear": resetAll(). resetAll(){ for k of FIELDS el(k).value=''; UNRESOLVED={}; REVEALED=false; HOLD=null; buildChips(); renderOnPurpose(); history.replaceState clean URL (remove FIELDS from query, keep hero/view/case...); } Spec: "resetAll() sets it false again, so Clear returns the page to the empty-on-purpose state." Good, and no search call.

Also from/to inputs change → search on CHANGE (dates). q/operator: operator is select → change; q text → Enter. make/model/etc in More filters: selects → change. minhours input → Enter (and change? spec: "SELECT and type=date search on CHANGE; text inputs search on ENTER"). So minhours (type=number is text-ish) → Enter only. tail input → Enter. q datalist pick fires input event... datalist selection triggers 'input' — but we search on Enter only; after datalist pick user presses Enter → fine, Enter also triggers change? I'll add: q listens keydown Enter → sdSearch(0). Also maybe listen 'change' on q for datalist pick? Spec says text on ENTER; keep.

setFilter(k,v){ el(k).value=v; show('p-search'); sdSearch(0); showChange(); } — show('p-search') is an existing helper (panels)? Spec references show(...) as existing. I'll guard: if(typeof show==="function") show("p-search");

syncControls: toggle 'landed' class on controls with value. syncMoreFilters: count actives among hidden fields; set #mfCount "(N active)" (or '' when 0); open details if N>0. Call both in setFilter, starter, reset, boot, takeReading, aimDay.

buildChips also called from showChange and renderCount? Spec: setFilter → showChange → which "scrolls so chips/count are visible" — chips must be rebuilt before. I'll rebuild chips inside showChange and renderCount and boot.

Refused-value detection beyond select-refusal: also client-validate? Spec point 3: server fails closed; client catches select refusal. Also jasc regex ^\d{4}$, zone ^ZONE \d00$ — but those are set only via resolve; server still validates. At boot, a link ?jasc=12 → hidden input accepts any value → not caught client-side → goes to server → 400 → existing search handles? "A 400 from the server folds into the SAME path" — the fetch layer of search. Since I don't own search, I'll add client-side pre-validation in sdGuard for fields with known formats (jasc, zone, corrosion, cracked, ata, minhours, from/to calendar) mirroring the server contract — this makes the checklist "a bad value in the link runs no query and says so" work regardless. Mark as deliberate: client mirrors the server's fail-closed contract so the refusal shows even before the wire. Values set programmatically via resolve are pre-validated anyway. I'll fold these into boot's UNRESOLVED detection: after restoring, for each field with a value, if sd2Validate(k,v) fails → UNRESOLVED[k]=v and clear? No — keep value for chip display "Label: value — not a value in this data". Clear the control so params() won't include it (server would reject). Yes: UNRESOLVED[k]=v; el(k).value=''. Select-refusal case: e.value!==u means it's already cleared → UNRESOLVED[k]=u. Unified.

sd2Validate(k,v):
- jasc: /^\d{4}$/
- zone: /^ZONE \d00$/ (link may contain "ZONE 300" or "300"? SQL rebuilds from regexp; the control option values are "ZONE 300" presumably. Accept both /^ZONE ?\d00$/? Spec: must match ^ZONE \d00$. I'll accept the strict form but when setting from resolve use "ZONE 300". Also allow raw "300"? Keep strict per spec; note nothing.)
- corrosion: 1|2|3 (but picker skips 1 — still valid to server; allow)
- cracked: "1"
- minhours: /^\d+$/
- ata: /^\d{2}$/ (server: substr match, not validated — the loose end; I'll validate 2 digits client-side lightly? "NOT VALIDATED, the one loose end" — server doesn't. Client: I'll not hard-reject; accept anything, matching server. Actually to mirror server exactly: no validation. But a garbage ata widens silently... server doesn't reject it (substr = 'xy' matches nothing → zero rows, not widened). Acceptable. I'll validate /^\d{1,2}$/ client-side only to keep chips clean? Departure risk. I'll mirror server: no ata validation. Note nothing.)
- from/to: /^\d{4}-\d{2}-\d{2}$/ + real calendar check (Date parse round-trip).
- nature/crew/discovered/stage/condition/operator/make/model/part/tail: validated against facet sets? Server validates nature & crew against CODES; others presumably against facets (fail closed "any non-existent value"). I'll check: if facets loaded and the value isn't in that field's facet set → UNRESOLVED. For operator: huge set — membership check fine. tail: server LIKE stem% — tail is prefix-based, not exact; client can't validate a stem against exact set. Server: tail "^ strips leading N, ^[0-9A-Z]{1,6}$, LIKE stem%" — invalid chars → rejected. Client validate tail: /^N?[0-9A-Z]{1,6}$/i. q: no validation. make/model/part: facet membership if facets have them. condition: CODES? condition codes like "U","D"? Use facet set. discovered/stage/zone/nature/crew: facet ∪ CODES sets. Keep it simple: member check against facets[field] if present; else CODES; else accept (server will refuse if bad — and my boot gate only guarantees no-run for what I catch; the 400 path is the existing page's). Fine.

Hmm wait — careful: "condition" values in facets might be codes; operator values are designators. OK.

Now counts and the "no query" rendering: sdNoSearch(reasonHTML): #count = `<strong>No search was run.</strong>`; body area shows the reason sentence(s); heroData=null (existing var? guard: `try{heroData=null}catch...` — assignment to undeclared would create global... if heroData is declared elsewhere, assignment works. I'll do `if (typeof heroData!=="undefined") heroData=null;`); disable export & copy.

Reason message assembly per spec: parts joined ". " → last closed with `, so no query was run rather than answering with all ${TOTAL} reports.` Wait spec: messages joined ". " and closed with ", so no query was run rather than answering with all N reports." The individual messages: stray → `This link uses a name|names this tool has no filter for: X. It was probably written for an older version of this page` (note: this already contains ". " internally... "names this tool has no filter for: X. It was probably..." — joined with ". " then. OK just follow.) refused → `This link asks for ${Label} value, which is not a value this data holds` — hmm "asks for Label value" → I'll phrase `This link asks for ${label} "${v}", which is not a value this data holds`. Spec literally: "This link asks for Label value, which is not a value this data holds". I'll produce: `This link asks for ${LABEL[k]} value “${v}”, which is not a value this data holds`. Close enough.

#unresolved sentence (exact): `One value in this link is not in this data, so no search was run. There is no number on this page to quote.` — for multiple? Spec gives singular text; I'll pluralize minimal: if 1 → exact sentence; else `...values... are not...`. Keep exact for 1.

Where do these render? #count + chips area (warn chips show there) + a paragraph. I'll put the message into #countZone paragraph and warn chips in #chips.

renderCount(d) details:
```
stale = HERO_FOR!==null && HERO_FOR!==params().toString()  // HERO_FOR managed by me
nothing selected → `…everything the FAA has published to ${prettyDate(RANGE.to)}.`
selected → `${num(n)} reports, ${clauses}. <span class=aside>${num(corpus-n)} set aside.</span>`
drift: d.total!==LAST_TOTAL → broken span appended (only when LAST_TOTAL!=null? spec says "when d.total!==LAST_TOTAL" — first call LAST_TOTAL null → would always show broken on first render. Guard: only when LAST_TOTAL!==null.)
LAST_TOTAL=d.total; HERO_FOR=params().toString() after render? Spec: HERO_FOR is the params the hero numbers were computed for; hero half sets it. I'll set HERO_FOR=params().toString() in renderCount (since we're rendering fresh numbers for this selection).
```
Also update export label/href, syncControls, syncMoreFilters, buildChips.

sentenceHTML(d): builds the standing sentence — wait, that's what I just described as renderCount? Spec separates: "STATING THE SELECTION IN WORDS / sentenceHTML(d) walks CLAUSE_ORDER..." and the THREE OUTPUTS include the fig+clauses — that IS the count line? "1 STALE: `<b class=fig>…</b> counting ${clauses}…`" — the fig is a number placeholder; this looks like #count content (the "count line" and "standing sentence" may be the same element or adjacent). Re-reading brief: "the count line, the standing sentence" — two things. The three outputs contain fig + clauses + aside → that's the count+sentence combined? And "Zero results: `No report matches this combination.`..." — that's the standing sentence when zero. I'll implement:

- renderCount(d): #count = fig number + stale/nothing/drift per spec outputs.
- renderSentence(d): #sentence = the clauses as clickable .clause spans (same content as count's clause list — I'll have sentenceHTML produce the clause-span list used in both? The spec's outputs show clauses INSIDE the count text). Simplest faithful reading: ONE line does both (count figure + clauses). I'll make renderCount(d) produce the spec's three outputs including clause spans, and sentenceHTML(d) produce the zero-result phrasing / the clause enumeration, called by renderCount. The zero-results text goes into the sentence area; count still shows "0 reports, clauses." Hmm — I'll do: #count gets the fig outputs; #sentence gets: normal case → empty (the clauses already in count line) — no...

Let me settle: 
- #count: `<b class=fig>…</b> counting <clause spans>…` (stale) | `<b class=fig>N</b> reports, everything the FAA…` | `<b class=fig>N</b> reports, <clause spans>. <span class=aside>…</span>` (+ broken span).
- #sentence: when d.total===0 → zero-result phrasing with clause texts. When n>0 → maybe scope line? No — scopeLine is per-panel (panels half). I'll put sentenceHTML output = zero-result message or '' otherwise. And expose sentenceHTML + scopeLine + filterWords for the other half.

Clauses in count line use the same span markup (tabindex 0, data-drop, data-aim) with click/Enter → drop. That satisfies "a chip's cross removes exactly that filter" plus clause removal.

CLAUSE order walk: skip from/to (periodClause handles) → build period clause string once: I'll construct the clause list array in order: for k of CLAUSE_ORDER: if from/to → handle combined: emit one clause when first of them encountered with both present; data-drop="from|to". Spec: "the period clause carries data-drop="from|to" so one click drops BOTH dates". So single clause like `from 1 May 2024 through 31 May 2024` with data-drop="from|to". If only one present, its own clause with data-drop=k.

clauseText(k,v):
- q: `where a mechanic wrote “${v}”`
- operator: name (strip code) — from facets label; fallback v.
- tail: `N${v}`
- cracked: `with cracking recorded`
- minhours: `${num(v)} hours or more on the airframe`
- coded fields: code().toLowerCase() — e.g. "smoke, fire or fumes" etc.
- from/to: "" (handled by periodClause)

Period clause text: `between ${prettyDate(from)} and ${prettyDate(to)}`.

For q clause starting the sentence: "…reports, where a mechanic wrote “bird” and …" fine.

Zero-result phrasing uses clause texts a,b,c WITHOUT the leading "where"? Spec: `No report is both ${a} and ${b}.` — I'll use clauseText outputs; for q it'd be "where a mechanic wrote..." which reads oddly mid-sentence. I'll make clauseText return the plain descriptor and add "where"/"and" glue in the enumeration. Compromise: clauseText returns plain ("a mechanic wrote “bird”", "cracking is recorded", code lowercased). Hmm spec explicitly: q -> `where a mechanic wrote "v"`. In the count line, clauses follow the figure: "…reports, where a mechanic wrote “bird”, and zone ZONE 300…" — wait "reports, where..." only for first. I'll implement sentence assembly: first clause gets no conjunction; subsequent get ", " and last gets " and ". The q text includes "where a mechanic wrote" only for the FIRST clause position? Simplify: keep spec text verbatim for q always; reading is acceptable: "12 reports, where a mechanic wrote “crack” and with cracking recorded." Slightly off but spec-verbatim wins. For zero-result phrasing, strip a leading "where " from q text. Fine.

coded fields decode: sd2Code(field, value): look in CODES tables: mapping field→code table: nature→CODES.nature, crew→CODES.precaution, zone→CODES.part_location, discovered→CODES.discovered?, stage→CODES.stage_of_flight?, condition→CODES.part_condition?, corrosion→CODES.corrosion?, jasc→CODES.jasc. I don't know exact glossary keys; I'll try several keys and fall back to facet label, else raw value. Write sd2Code(field,v) doing: const tab = sd2CodeTable(field); return (tab && tab[v] && (tab[v].label||tab[v])) || facetLabel || v. codeTable candidates map:
```
nature:["nature"], crew:["precaution","crew"], condition:["condition","part_condition"],
discovered:["discovered"], stage:["stage","stage_of_flight"], zone:["part_location","zone"],
corrosion:["corrosion"], jasc:["jasc"], ata:["ata"]
```
Where tab[v] may be string or {label}.

CODES source: existing global CODES (from /api/glossary) or fetch. Boot: if typeof CODES undefined/null → fetch('api/glossary').

Now starters markup: buttons with data-i; first 6 visible, rest class extra. Toggle: "12 more questions"/"fewer" (18-6=12 ✓).

Chips area ids: #chips, #unresolved inside.

Copy/export row ids: #exportBtn (a element), #copyBtn, #copied.

Now counts formatting: num() existing → sd2Num fallback.

prettyDate existing → sd2Pretty fallback: parse "YYYY-MM-DD" → d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})? RANGE.to pretty. Fine.

Aim box markup (per copy):
```
<div class="aimbox">
 <label for="aimKind">Aim at</label>
 <select id="aimKind" class="aimkind">
  <option value="period">a month or year</option>
  <option value="operator">an airline</option>
  <option value="tail">a tail number</option>
  <option value="zone">a zone</option>
  <option value="jasc">a system code</option>
  <option value="">free text search</option>
 </select>
 <input id="iAimAt" role="combobox" aria-controls="aimSug" aria-autocomplete="list" aria-expanded="false">
 <button type="button" class="aimgo" onclick="aimAtGo()">Take it</button>
 <label class="aimday">or one day <input id="aimDay" type="date"></label>
 <div class="aimsug" id="aimSug" role="listbox" hidden></div>
</div>
```
Duplicated ids — since injected into two containers. All access via sd2Aim(id) → returns visible copy: 
```
function sd2Aim(id){var ns=document.querySelectorAll('[id="'+id+'"]');for(var i=0;i<ns.length;i++){if(ns[i].offsetParent!==null)return ns[i];}return ns[0];}
```
Duplicate-id querySelectorAll by attribute works.

Bind once at injection: for each copy attach listeners to its own nodes (closures capture that node). But aimAtGo is a global reading visible copy — fine.

KINDLAB, placeholders, colors .sk-* per spec.

SUG rendering: group by kind in fixed order [period, zone, operator, tail, jasc, q]? Sort key handles order of rows; headings: iterate rows, emit heading when kind changes (rows sorted so kinds contiguous: sort key (kind=="q", -best, -n, label) — hmm within non-q kinds, ordering is by -best[kind] then -n; "strongest kind group first" — best[kind] is the max n for that kind among readings, so kinds sort by their best n desc, q last. Kinds contiguous? Rows sorted by (-best[kind], -n, label) — yes kinds cluster since best is constant per kind. But best defined per kind: I compute best = max n per kind across readings. Good.

Row: `<div class="sug [on] [nought]" role="option" aria-disabled>` with `.sl` label, `.sw` what | "no report in this file", `<b>n</b>`. Nought rows: not clickable (inert: I'll still render but click does nothing — CSS cursor default + guard in handler; aria-disabled true). Zero-count rows hidden while browsing (kind not named) but kept when kindNamed (i.e., when aimKind!=="").

SUG filter: `readings.filter(x=> x.kind!=="q" && (x.n>0 || kindNamed))` where kindNamed = aimKind value !== "" && matches? Spec: "(x.n>0 || kindNamed)". kindNamed = the aim kind is named (non-empty). But if kind named "operator" and resolve called WITH kind, only that kind returns anyway. When is kind named but multiple kinds returned? aimAtGo fetches WITHOUT kind even when kind chosen! ("Otherwise fetch api/resolve WITHOUT a kind: Take it always considers EVERY reading."). So browsing suggestions (typing) fetch WITH kind when kind chosen → only that kind → empties kept. Browsing with kind==="" → free text → vocab → kind "q" → filtered out entirely?? Then free-text browsing shows NO suggestions... Hmm: spec typing: "free text -> api/vocab, mapped to {kind:"q"...}" and SUG filter excludes kind q — so free-text typing shows an empty suggestion box. That seems intentional-ish ("The word reading NEVER appears in this list: free text has its own field."). But then browsing with no kind shows nothing — maybe typing free text shouldn't even fetch? It maps to q and gets filtered → empty list → hide box. OK, follow literally.

Wait — but then for mixed DELTA case: typing "DELTA" with kind="" is free text → vocab only. The disambiguation happens on "Take it" (resolve without kind) — the multi-button panel. Consistent.

takeReading(o): 
```
if(o.kind==="period"){ from=max(o.from||o.a,RANGE.from); to=min(o.to||o.b,RANGE.to); set el from/to; }
else setFilter(o.kind, o.value||o.code||o.v)
aimHold(`took ${o.label}, ${o.what}, ${num(o.n)} reports.`, with undo)
close sug, clear input? keep.
```
For period also run search + syncControls etc. setFilter handles per-field; period sets two fields — do both then sdSearch(0)+showChange. Also clear? fine.

handOff(): raw from current input; set q; sdSearch(0); scroll/flash; aimHold.

The multi-choice render (aimAtGo >1): paint into #iAim (aim line): message + buttons per option. Buttons: `${label} <em>${what}</em> <b>${n}</b>` → onclick takeReading(o). Also "No mechanic wrote that word either." flat. And the no-opts-but-empties sentence includes prettyDate(RANGE.from/to).

Undo button helper sd2UndoBtn(): button "undo" → onclick { history.back(); unaim(); }.

aim(text): if HOLD live → refuse (return false). Else paint #iAim textContent. aimHold(text,ms=6000): HOLD={text,until:Date.now()+ms}; paintHeld(). paintHeld(): if HOLD && now<until → #iAim class "aim held", data-hold=1, content text + [undo] button; else HOLD=null, clear? paintHeld only re-applies. The 600ms interval calls paintHeld → auto-expiry.

unaim(): if HOLD live → return; clear #iAim (class "aim", text '').

OK. Export: `<a id="exportBtn" class="sdbtn">Export CSV</a>`; renderCount sets href='api/export?'+params().toString() and label. Disabled when total===0: class + no href + aria-disabled.

copyLink(): navigator.clipboard.writeText(location.href).then(show #copied 1500ms). Fallback execCommand? Keep simple + catch.

Now the empty-on-purpose container: I'll render into a div `#noRows` above the table (my markup includes `<div id="noRows" hidden></div>`). renderOnPurpose fills #count and #noRows (and hides sentence). Also `sdNoSearch` fills #count and #noRows with the refusal message.

revealAll(){ REVEALED=true; hide noRows; sdSearch(0); showChange(); }
goResults(){ REVEALED=true; sdSearch(0); } (Search button)
resetAll(){ clear all + UNRESOLVED; REVEALED=false; LAST_TOTAL=null; HERO_FOR=null; clean URL (replaceState, strip FIELDS, keep others); buildChips; renderOnPurpose; syncControls; syncMoreFilters; enable export? disable until search; }

Boot flow written above. Also instrument boot may call search on its own — out of my hands; note nothing.

One more: "params(): new URLSearchParams, for each FIELDS key read el(k).value.trim(), skip empties." — returns URLSearchParams. Used for API + export + comparison (params().toString()).

setFilter with v possibly '' → universal remove. Also after setFilter, if the field was in UNRESOLVED delete it.

show('p-search') guard.

Now — panel scope line & VIEW_GROUPS: I'll include:
```
var VIEW_GROUPS={"Narrows to what you selected":["p-search","p-patterns","p-found"],...}
```
Hmm I don't know panel ids beyond FOLLOWS_FILTER. I'll define FOLLOWS_FILTER and filterWords() and scopeLine(id,n) and a VIEW_GROUPS with the three group labels but leave member lists to the panels half (export as empty arrays with comment). Minimal: define scopeLine + filterWords; mention VIEW_GROUPS only in comment for the other half. Keep scopeLine per spec:

```
function scopeLine(id,n){
 if(id==="p-search"||id==="p-aircraft")return"";
 if(FOLLOWS_FILTER.indexOf(id)>=0) return n>0?`Showing <strong>your selection</strong>, ${num(n)} reports.`:"";
 ... others: `This view always answers for <strong>all ${num(TOTAL)} reports</strong>. It does not narrow to your current selection (${filterWords()}).` ; unfiltered `All ${num(TOTAL)} reports.`
}
```
filterWords(): clause texts joined ", " or "" when none.

I think that's everything. Also #q datalist id="qList" (spec says "#q (with datalist)").

Vocab fetch URL: 'api/vocab?q='+enc+'&limit=10' — relative (page presumably served under some path where api/... works; the brief uses /api/glossary — I'll use 'api/...' relative like spec's "api/vocab"). Spec writes api/vocab, api/resolve — relative. Use those.

Now CSS: keep tight, matching a paper-like aesthetic (#fdf7f4 etc. given). I'll style: .sdcontrols layout, chips, clause spans (dotted underline, hover), starters buttons, aim box, aimsug rows + sk colors, fig numbers, broken warning, landed state (rust left border #8a2a17-ish on #fdf7f4), empty option class, noRows block.

Length: this is going to be ~600-700 lines. Reasonable given budget ("half the work... leave room for the code"). Let me write it now, carefully but compactly. I'll aim for correct, readable, and complete; minor compression in CSS.

Also: "Do not declare a function whose name the page already uses" — I'll add a one-line note: all spec-named functions are the contract; my private helpers are sd2-prefixed; and I did NOT declare search (per instruction) — sdSearch wraps it with the guard.

Departures to state at the end:
1. search() not declared (per instruction); sdSearch() wraps the existing one: client-side fail-closed guard (strays + refused values), promise-aware count/sentence rendering. Empty-on-purpose and refusal gates live in the boot path + sdSearch since I can't edit search — matches spec behavior.
2. api/facets assumed (not named in spec) to give per-option report counts, incl. operator's thousands; options fall back to CODES membership so "(no reports)" still shows. api/glossary fetched only if CODES isn't already present.
3. Duplicate aim-box ids (spec names singular ids but requires two copies) — resolved with a visible-copy accessor; events bound per copy.
4. Export label + href set in renderCount (I don't own search()).
5. "Search" with empty fields calls goResults() (explicit intent = the reveal button); spec didn't say.
6. Tail is a text input (stems, not a closed list), jasc is the hidden input per spec — no visible picker.

Also corroson skip ["1"] — follow spec literally.

Now write the code. I'll be careful with template literals and quoting. Also ensure q escaping etc. is server-side; client just sends.

Let me draft the JS functions list:
- consts: FIELDS, LABEL, HIDDEN_FIELDS, URL_KNOWN, NO_RAIL(unused here but define), CLAUSE_ORDER, FOLLOWS_FILTER, KINDLAB, SKIPS, STARTERS
- state: UNRESOLVED, REVEALED, HOLD, HERO_FOR, LAST_TOTAL, sd2Facets, sd2CODES, sd2Range, sd2Total, SUG, SUGI, qSugSeq, sugSeq, sd2AimTimer
- helpers: sd2$(id), sd2Num, sd2Pretty, sd2Esc, sd2CodeTable, sd2Code, sd2Aim, sd2Debounce
- params, setFilter, sd2HasFilter, sd2Validate, strayParams, sd2Guard, sdNoSearch, sdSearch, showChange, syncControls, syncMoreFilters, sd2LoadFacets, opts, sd2BuildStaticPickers?, buildChips, clauseText, periodText, sentenceHTML, renderCount, renderSentence(=sentenceHTML into #sentence), scopeLine, filterWords, renderOnPurpose, revealAll, goResults, resetAll, starter, sd2BuildStarters, copyLink, sd2QVocab (input handler), sd2InjectAim, aimAtGo, sd2AimInput (typing), takeReading, handOff, sd2RenderSug, aim, aimHold, unaim, paintHeld, aimPlaceholder, dropRefused, dropStray, sd2Boot

opts(field, countsObj): builds & returns options HTML for a select; assign to selects: operator, make, model, part, nature, crew, condition, discovered, stage, zone, corrosion, ata. jasc hidden, tail input, minhours number, cracked static (2 options), q input.

Facets normalization: expect {field:{value:n}} or {field:{value:{label,n}}}. label lookup: facet label || CODES label || value.

opts sorted desc; label `${lab} (${num(n)})` or `${lab} (no reports)` class empty. Plus first option empty-label.

For operator with thousands — fine.

Skips map applied.

make/model/part empty labels: "Any manufacturer", "Any model", "Any part". ata "Any ATA chapter". Not in spec list but needed; harmless.

Also #operator is in primary row per spec ("Primary row: #q (with datalist), #operator, #from, #to, Search, Clear").

More filters details contains: make, model, part, ata, nature, crew, condition, discovered, stage, zone, tail, corrosion, cracked, minhours + jasc hidden input. Group nicely in a grid.

Starter params: note {q:"crack"} for Cracks found; crew codes E=shut down in flight, A=unscheduled landing, G=oxygen masks, I=loss of pressure, C=aborted takeoff — verbatim from spec.

STARTERS array (label, params obj) in the given order.

Alright — also aria: combobox aria-expanded toggling, listbox options.

Keyboard in iAimAt: handle ArrowDown/Up/Enter/Escape. Enter with SUGI<0 → aimAtGo(). Note: Enter keydown also used by... fine.

aimDay change: const v=e.value; if(!v)return; el('from').value=v; el('to').value=v; sdSearch(0); showChange(); aimHold(`took ${pretty(v)}, one day, …`)? spec doesn't require hold; skip hold, just search. Actually spec: "#aimDay: sets BOTH from and to to the same date." I'll aimHold `took one day, ${pretty}, N...` — n unknown before search; skip message.

Time to write. I'll write markup with minimal class names and a compact but real CSS.

One more check — the count line "STALE" output: `<b class="fig">…</b> counting ${clauses}…`. OK.

Drift span appended: `<span class="broken">the count above and the rows below disagree: reload before you quote either</span>`.

#count markup: div id="count" class="sdcount".

Let me also make sure: "A chip's cross removes exactly that filter" — chip x onclick setFilter(k,'') — but for UNRESOLVED warn chips, cross → dropRefused(k).

For stray params there's no control; I'll render a warn chip per stray name too? Spec: refused values first (UNRESOLVED keys). Strays: message text covers them; dropStray removes via URL rewrite — I'll add a small "drop them and continue" link? Spec lists dropStray(k) as a removal route. I'll render chips for strays too: class warn, label `name: (not a filter)`? Simpler: the refusal message + one button "drop the unknown names and run" → sd2DropStrays(). And per-stray chips with x → dropStray(name) which rewrites URL without that name, removes from list, and if none left re-runs guard→search. Implement dropStray(name){const u=new URLSearchParams(location.search);u.delete(name);history.replaceState(null,'',location.pathname+'?'+u.toString()); sd2Strays=s strayParams() recompute; if none && no UNRESOLVED → proceed search}. OK.

Guard returns null or {html}: assembled message; boot: g=sd2Guard(); if g sdNoSearch(g) else if(!sd2HasFilter()&&!REVEALED) renderOnPurpose() else sdSearch(0).

But wait: sdSearch also guards (setFilter path can't introduce strays/refused since validation happens on boot & selects refuse; but aimAtGo could set zone etc — pre-validated). Include guard inside sdSearch anyway (spec: search refuses).

sd2Validate details for facet fields — facets may not be loaded yet at boot validation (async). Order boot: restore → validate (with facets possibly pending) → hmm. I'll validate format-based fields immediately; facet-membership validation after facets load, before the guard decision. Boot async: await facets (with try/catch → empty). Then validate membership. Then guard. OK — boot awaits facets & codes & range fetches, all try/catch.

TOTAL: from sd2Range fetch or existing global; used in on-purpose and refusal text. If unavailable, fetch 'api/range' expecting {total, from, to}. If that fails, default TOTAL=1757827? No — leave 0/unknown; use corpus fallback '?'... I'll fall back to the number in the brief? That's data-dependent; better to leave "the file" phrasing... keep simple: if unknown, use 0 and note. Actually the brief literally gives 1,757,827 — hardcoding is fragile. I'll require api/range or existing globals; if all fail, use null and phrase without numbers. Small conditional.

RANGE.to needed for "everything the FAA has published to X" — same source.

OK, writing now. I'll number sections with comments. Keep CSS ~120 lines. JS ~450 lines. Let me be disciplined.

Also note where markup goes: immediately after the instrument markup (so `.ipad`/`.phextra` exist for aim injection — my JS runs after both, since script comes later anyway).

Flash for #q: class 'flash' with CSS animation 1.4s then remove.

Let me write the final answer: brief "where markup goes" notes inline, then the three blocks, then "Departures" list. No preamble.

Draft key tricky code:

params():
```js
function params(){
  var p=new URLSearchParams();
  for(var i=0;i<FIELDS.length;i++){
    var k=FIELDS[i], e=sd2$(k);
    if(!e)continue;
    var v=(e.value||"").trim();
    if(v)p.set(k,v);
  }
  return p;
}
```

sd2Validate(k,v):
```js
function sd2Validate(k,v){
  if(k==="jasc")return /^\d{4}$/.test(v);
  if(k==="zone")return /^ZONE \d00$/.test(v);
  if(k==="corrosion")return v==="1"||v==="2"||v==="3";
  if(k==="cracked")return v==="1";
  if(k==="minhours")return /^\d+$/.test(v);
  if(k==="tail")return /^N?[0-9A-Z]{1,6}$/i.test(v);
  if(k==="from"||k==="to"){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
    var d=new Date(v+"T00:00:00");
    return !isNaN(d.getTime())&&sd2ISO(d)===v;
  }
  if(k==="q")return true;
  if(k==="ata")return true;               // the one loose end, mirrored
  var set=sd2Facets[k];
  if(set&&Object.keys(set).length)return Object.prototype.hasOwnProperty.call(set,v);
  return true;                            // unknown surface -> server still refuses
}
```
sd2ISO(d): pad.

sd2Guard():
```js
function sd2Guard(){
  var strays=strayParams(), parts=[];
  if(strays.length){
    var list=strays.map(function(s){return "<code>"+sd2Esc(s)+"</code>";}).join(", ");
    parts.push("This link uses a "+(strays.length===1?"name":"names")+" this tool has no filter for: "+list+
      ". It was probably written for an older version of this page");
  }
  for(var k in UNRESOLVED){
    parts.push("This link asks for "+LABEL[k]+" value “"+UNRESOLVED[k]+"”, which is not a value this data holds");
  }
  if(!parts.length)return null;
  return "<p class='refusal'>"+parts.join(". ")+", so no query was run rather than answering with all "+
    (sd2Total?num(sd2Total):"the")+" reports.</p>" +
    (strays.length?"<p><button type='button' class='ghostbtn' id='dropStrayBtn'>Drop the unknown name"+
      (strays.length===1?"":"s")+" and run</button></p>":"");
}
```
Hmm wait: spec's first message: "This link uses a name|names this tool has no filter for: X. It was probably written for an older version of this page" — contains internal ". " already; then joined ". " with refused part, closed with ", so no query was run...". My join produces that. Good. Bind dropStrayBtn click after injecting.

sdNoSearch(ghtml):
```js
function sdNoSearch(ghtml){
  sd2$("count").innerHTML="<strong>No search was run.</strong>";
  sd2$("sentence").innerHTML="";
  var nr=sd2$("noRows"); nr.hidden=false;
  nr.innerHTML=ghtml;
  sd2SetExport(null);
  if(typeof window!=="undefined"&&typeof heroData!=="undefined"){try{heroData=null;}catch(_e){}}
  buildChips();
}
```
heroData assignment: if declared with var in IIFE scope, assignment fine; typeof check for undeclared.

sdSearch:
```js
function sdSearch(off){
  var g=sd2Guard();
  if(g){sdNoSearch(g);return;}
  var r;
  try{ r=search(off); }
  catch(err){ throw err; }
  if(r&&typeof r.then==="function"){
    r.then(function(d){ if(d&&typeof d.total==="number"){renderCount(d);renderSentence(d);} })
     .catch(function(){});
  }
  return r;
}
```

renderCount(d):
```js
function renderCount(d){
  var p=params().toString();
  var stale=(HERO_FOR!==null&&HERO_FOR!==p);
  var cl=sentenceHTML(d,true); // clause spans
  var h;
  if(stale){
    h='<b class="fig">…</b> counting '+cl+"…";
  }else if(!sd2HasFilter()){
    h='<b class="fig">'+num(d.corpus!=null?d.corpus:sd2Total)+'</b> reports, everything the FAA has published to '+sd2Pretty(sd2Range&&sd2Range.to)+".";   // hmm spec: num(corpus)
  }else{
    h='<b class="fig">'+num(d.total)+'</b> '+(d.total===1?"report":"reports")+", "+cl+". "+
      '<span class="aside">'+num((d.corpus!=null?d.corpus:sd2Total)-d.total)+' set aside.</span>';
    if(LAST_TOTAL!==null&&d.total!==LAST_TOTAL)
      h+='<span class="broken">the count above and the rows below disagree: reload before you quote either</span>';
  }
  sd2$("count").innerHTML=h;
  HERO_FOR=p; LAST_TOTAL=d.total;
  sd2SetExport(d.total);
  buildChips(); syncControls(); syncMoreFilters();
  var nr=sd2$("noRows"); if(!sd2HasFilter()&&REVEALED===false){} // not reached
}
```
Wait the corpus key: spec says num(corpus). d.corpus presumably; fallback sd2Total.

clause span building inside sentenceHTML(d, forCount): walks CLAUSE_ORDER:
```js
function clauseList(){
  var out=[],p=params();
  for(var i=0;i<CLAUSE_ORDER.length;i++){
    var k=CLAUSE_ORDER[i],v=p.get(k);
    if(!v)continue;
    if(k==="from"||k==="to"){
      if(k==="from"&&p.get("from")&&p.get("to")){
        out.push({k:"from|to",t:"between "+sd2Pretty(p.get("from"))+" and "+sd2Pretty(p.get("to"))});
      }else if(k==="from"&&!p.get("to")){
        out.push({k:"from",t:"from "+sd2Pretty(p.get("from"))});
      }else if(k==="to"&&!p.get("from")){
        out.push({k:"to",t:"through "+sd2Pretty(p.get("to"))});
      }
      continue;
    }
    out.push({k:k,t:clauseText(k,v)});
  }
  return out;
}
```
Careful: CLAUSE_ORDER has from before to (…,from,to). from present & to present → emit combined at from; to skipped. Good.

sentenceHTML(d, asSpans): if asSpans → spans with data-drop. Else plain texts joined. Zero-results message separate:

```js
function sentenceHTML(d,spans){
  var L=clauseList();
  var wrap=function(k,t){
    return spans?'<span class="clause" tabindex="0" data-drop="'+k+'" data-aim="drop-'+k+'">'+sd2Esc(t)+"</span>":t;
  };
  var parts=[];
  for(var i=0;i<L.length;i++)parts.push(wrap(L[i].k,L[i].t));
  return parts.join(", ").replace(", ", ", ");  // no conj handling? 
}
```
Conjunction: spec examples: "No report is both a and b", "all of: a, b, c and last". For the count line it just joins clauses with commas presumably. I'll join with ", " for the count line, and for zero-result use proper "and" phrasing:

```js
function zeroPhrase(d){
  var L=clauseList().map(function(x){return x.t.replace(/^where /,"");});
  var f;
  if(L.length===0)return"No report matches this combination.";
  if(L.length===1)return"No report matches "+L[0]+".";
  if(L.length===2)return"No report is both "+L[0]+" and "+L[1]+".";
  return"No report is all of: "+L.slice(0,-1).join(", ")+" and "+L[L.length-1]+".";
}
```
renderSentence(d): sd2$("sentence").innerHTML = d.total===0 ? zeroPhrase(d) : "";

Hmm also when zero, the "0 reports, clauses." count line shows too — fine.

Clause click/keydown → drop: delegate on #count: click on .clause → k=el.dataset.drop; if k==="from|to"{el('from').value='';el('to').value='';sync…;sdSearch(0);showChange();} else setFilter(k,''). Keydown Enter/Space same.

buildChips():
```js
function buildChips(){
  var box=sd2$("chips"); if(!box)return;
  box.innerHTML="";
  var un=Object.keys(UNRESOLVED);
  var ur=sd2$("unresolved");
  if(ur){ur.hidden=!un.length;
    ur.innerHTML= un.length===1
      ?"One value in this link is not in this data, so no search was run. There is no number on this page to quote."
      :num(un.length)+" values in this link are not in this data, so no search was run. There is no number on this page to quote.";}
  un.forEach(function(k){
    box.appendChild(sd2Chip(LABEL[k]+": "+UNRESOLVED[k],true,function(){dropRefused(k);}));
  });
  var p=params();
  for(var i=0;i<FIELDS.length;i++){
    var k=FIELDS[i]; if(UNRESOLVED[k])continue;
    var v=p.get(k); if(!v)continue;
    (function(k,v){
      box.appendChild(sd2Chip(LABEL[k]+": "+decodeShown(k,v),false,function(){setFilter(k,"");}));
    })(k,v);
  }
}
```
sd2Chip(text,warn,onx): span.chip(.warn), text node + em for warn (" — not a value in this data") + b.x with aria-label "Remove filter "+text.

decodeShown(k,v):
```js
function decodeShown(k,v){
  switch(k){
    case"q":return"“"+v+"”";
    case"ata":return"ATA["+v+"]";
    case"tail":return"N"+v;
    case"cracked":return"recorded";
    case"minhours":return num(+v)+" hours";
    case"from":case"to":return sd2Pretty(v);
    case"operator":{var f=sd2Facets.operator&&sd2Facets.operator[v];
      return (f&&f.label?f.label:v)+" ("+v+")";}
    case"crew":return sd2Code("precaution",v);   // hmm table key
    case"zone":return sd2Code("part_location",v);
    default:return sd2Code(k,v);
  }
}
```
sd2Code(tableOrField,v) — I'll design sd2Code(field,v) mapping field→candidate tables; for crew pass "crew" and candidates ["precaution"]. Adjust: crew→sd2Code("crew",v) with candidate list ["precaution","crew"].

Set/holder: 
```js
var sd2CodeKeys={nature:["nature"],crew:["precaution","crew"],condition:["condition","part_condition"],
 discovered:["discovered"],stage:["stage","stage_of_flight"],zone:["part_location","zone"],
 corrosion:["corrosion"],jasc:["jasc"],ata:["ata"],discovered:["discovered"]};
function sd2Code(f,v){
  var ks=sd2CodeKeys[f]||[f];
  for(var i=0;i<ks.length;i++){
    var t=sd2CODES&&sd2CODES[ks[i]];
    if(t&&t[v]!=null){var e=t[v];return typeof e==="object"?(e.label||v):e;}
  }
  var fac=sd2Facets[f]&&sd2Facets[f][v];
  return (fac&&fac.label)||v;
}
```

opts(field, emptyLabel, skips):
```js
function opts(field,emptyLabel,skips){
  var sel=sd2$(field); if(!sel)return;
  var counts=sd2Facets[field]||{};
  var vals=Object.keys(counts);
  var tab=null;
  var ks=sd2CodeKeys[field]||[];
  for(var i=0;i<ks.length;i++){if(sd2CODES&&sd2CODES[ks[i]]){tab=sd2CODES[ks[i]];break;}}
  if(tab)for(var v in tab){if(!(v in counts))counts=v?counts:counts;/*union*/}
```
Union: simpler:
```js
  var all={};
  function add(v){if(skips&&skips.indexOf(v)>=0)return; all[v]=counts[v]||0;}
  Object.keys(counts).forEach(add);
  if(tab)Object.keys(tab).forEach(add);
  var arr=Object.keys(all).map(function(v){
    var lab=tab&&tab[v]!=null?(typeof tab[v]==="object"?tab[v].label||v:tab[v]):(counts[v]&&counts[v].label)||v;
    return{v:v,lab:lab,n:all[v]};
  }).sort(function(a,b){return b.n-a.n|| (a.lab<b.lab?-1:1);});
  var h='<option value="">'+emptyLabel+"</option>";
  arr.forEach(function(o){
    h+='<option value="'+sd2Attr(o.v)+'"'+(o.n===0?' class="empty"':"")+">"+
       sd2Esc(o.lab)+" ("+(o.n?num(o.n):"no reports")+")</option>";
  });
  sel.innerHTML=h;
}
```
Note: class on option — spec wants class="empty". OK.

For operator: no CODES table; facets only. If facets lack operator (endpoint mismatch), operator select stays with just empty label + a disabled note? I'll add fallback: if(!Object.keys(counts).length && field==="operator") sel.innerHTML+='<option value="" disabled>operator counts unavailable</option>'? Better to note in departures. Keep the union behavior; if facets fail entirely the checklist item fails — but that's server-side.

Skip maps:
```js
var SKIPS={nature:["0"],crew:["0","K"],discovered:["0"],corrosion:["1"],stage:["00"],zone:["ZONE 000"]};
```

Build calls: opts("operator","Any operator"), opts("make","Any manufacturer"), opts("model","Any model"), opts("part","Any part"), opts("ata","Any ATA chapter"), opts("nature","Anything found",SKIPS.nature), opts("crew","Anything the crew did",SKIPS.crew), opts("condition","Any part condition"), opts("discovered","Found by any method",SKIPS.discovered), opts("stage","Any stage of flight",SKIPS.stage), opts("zone","Anywhere on the aircraft",SKIPS.zone), opts("corrosion","Any corrosion level",SKIPS.corrosion).

cracked static HTML: <select id=cracked><option value="">Cracked or not</option><option value="1">Cracked</option></select>.

Starters:
```js
var STARTERS=[
 ["Smoke or fumes in the cabin",{nature:"B"}],
 ["Cracks found",{q:"crack"}],
 ["Engine shut down in flight",{crew:"E"}],
 ["Unscheduled landing",{crew:"A"}],
 ["Bird strikes",{q:"bird"}],
 ["Landing gear trouble",{ata:"32"}],
 ["Something burning",{q:"burn"}],
 ["Fuel leaks",{q:"fuel leak"}],
 ["Oxygen masks dropped",{crew:"G"}],
 ["Cabin lost pressure",{crew:"I"}],
 ["Aborted take-off",{crew:"C"}],
 ["Corrosion past the limit",{corrosion:"2"}],
 ["Urgent corrosion, level 3",{corrosion:"3"}],
 ["Damage no one could see",{discovered:"E"}],
 ["Engine flameout",{nature:"X"}],
 ["Uncontained engine failure",{nature:"T"}],
 ["Old airframes, 50,000 hours plus",{minhours:"50000"}],
 ["Something fell off in flight",{nature:"D"}]
];
function starter(i){
  var s=STARTERS[i]; if(!s)return;
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.value="";});
  UNRESOLVED={};
  for(var k in s[1])if(sd2$(k))sd2$(k).value=s[1][k];
  syncControls();syncMoreFilters();
  sdSearch(0);showChange();
}
```
Build buttons: first 6 plain, rest class extra. Toggle button.

showChange():
```js
function showChange(){
  buildChips();
  var c=sd2$("chips"), r=c.getBoundingClientRect();
  if(r.top<0)c.scrollIntoView({block:"start"});
}
```
Also count below chips; scrolling chips to top shows count too. Only upwards ✓.

Aim machinery — writing carefully:

```js
var KINDLAB={period:"MONTH OR YEAR",zone:"ZONE",operator:"AIRLINE",tail:"TAIL",jasc:"SYSTEM",q:"WORD IN THE WRITE-UPS"};
var AIMPH={period:"a month or a year, e.g. August or 2025",operator:"an airline, e.g. United or UAL",
 tail:"a tail number, e.g. N583",zone:"a zone, e.g. 300",jasc:"a system code, e.g. 3230",
 "":"any words the mechanic wrote, e.g. bird strike"};
var SUG=[],SUGI=-1,sugSeq=0,sd2Hold=null,aimTimer=null;
```

aimPlaceholder():
```js
function aimPlaceholder(){
  var k=sd2Aim("aimKind"),i=sd2Aim("iAimAt");
  if(k&&i)i.placeholder=AIMPH[k.value]||"";
}
```
interval 600ms: aimPlaceholder(); paintHeld();

Aim input handler (per copy):
```js
function sd2WireAim(root){
  var kind=root.querySelector("#aimKind") ... 
```
Wait duplicate ids inside root: root.querySelector('#aimKind') works per root.
```js
function sd2WireAim(root){
  var k=root.querySelector('[id=aimKind]'),i=root.querySelector('[id=iAimAt]'),
      d=root.querySelector('[id=aimDay]'),s=root.querySelector('[id=aimSug]');
  k.addEventListener("change",function(){sd2CloseSug();aimPlaceholder();});
  i.addEventListener("input",sd2AimTyping);
  i.addEventListener("keydown",sd2AimKeys);
  d.addEventListener("change",function(){
    var v=d.value;if(!v)return;
    sd2$("from").value=v;sd2$("to").value=v;
    syncControls();syncMoreFilters();sdSearch(0);showChange();
  });
  s.addEventListener("mousedown",function(ev){      // mousedown so blur doesn't kill it
    var row=ev.target.closest(".sug");if(!row||row.classList.contains("nought"))return;
    ev.preventDefault();takeReading(SUG[+row.dataset.i]);
  });
}
```

sd2AimTyping:
```js
function sd2AimTyping(ev){
  var i=ev.target, q=i.value.trim(), kind=sd2Aim("aimKind").value, seq=++sugSeq;
  if(q.length<2){sd2CloseSug();return;}
  clearTimeout(sd2AimDeb);
  sd2AimDeb=setTimeout(function(){
    var url= kind==="" ? "api/vocab?q="+encodeURIComponent(q)+"&limit=10"
                       : "api/resolve?q="+encodeURIComponent(q)+"&kind="+kind;
    fetch(url).then(function(r){return r.ok?r.json():[];}).then(function(list){
      if(seq!==sugSeq)return;             // stale reply dropped
      sd2ShowSug(list||[],kind);
    }).catch(function(){ if(seq===sugSeq)sd2CloseSug(); });
  },220);
}
```
vocab list items: {term,n} → map to {kind:"q",label:term,n:n,what:"a word in the write-ups"}. resolve items: assume {kind,label,n,what?} — what fallback: per-kind phrase map: WHAT={period:"a month or year",operator:"an airline",tail:"a tail number",zone:"a zone",jasc:"a system code"}. resolve may supply v/value/code for takeReading; I'll store raw item.

sd2ShowSug(list,kind):
```js
function sd2ShowSug(list,kind){
  var kindNamed=kind!=="";
  var readings=list.map(function(x){
    if(x.kind==="q"||kind===""&&x.term){return{kind:"q",label:x.label||x.term||x.v,n:x.n||0,what:"a word in the write-ups",raw:x};}
    return{kind:x.kind,label:x.label||x.v||x.value||x.code,n:x.n||0,what:x.what||WHAT[x.kind]||x.kind,raw:x};
  });
  SUG=readings.filter(function(x){return x.kind!=="q"&&(x.n>0||kindNamed);});
  // sort key
  var best={};
  SUG.forEach(function(x){best[x.kind]=Math.max(best[x.kind]||0,x.n);});
  SUG.sort(function(a,b){
    var ka=(a.kind==="q")?1:0,kb=(b.kind==="q")?1:0;
    if(ka!==kb)return ka-kb;
    if((best[b.kind]||0)!==(best[a.kind]||0))return(best[b.kind]||0)-(best[a.kind]||0);
    if(b.n!==a.n)return b.n-a.n;
    return a.label<b.label?-1:1;
  });
  SUGI=-1;
  sd2RenderSug();
}
```
Wait free text case: kind==="" → we fetched vocab → items mapped to q → all filtered out → SUG empty → render hides box. Fine per spec.

sd2RenderSug():
```js
function sd2RenderSug(){
  var box=sd2Aim("aimSug"); if(!box)return;
  if(!SUG.length){box.hidden=true;var i=sd2Aim("iAimAt");if(i)i.setAttribute("aria-expanded","false");return;}
  var h="",lastKind=null;
  SUG.forEach(function(o,ix){
    if(o.kind!==lastKind){h+='<div class="sughead sk-'+o.kind+'">'+(KINDLAB[o.kind]||o.kind)+"</div>";lastKind=o.kind;}
    h+='<div class="sug'+(ix===SUGI?" on":"")+(o.n?"":" nought")+'" role="option" data-i="'+ix+'"'+
       (o.n?"":' aria-disabled="true"')+'><span class="sl">'+sd2Esc(o.label)+"</span>"+
       '<span class="sw">'+sd2Esc(o.what)+(o.n?"":" | no report in this file")+"</span><b>"+num(o.n)+"</b></div>";
  });
  box.innerHTML=h;box.hidden=false;
  var inp=sd2Aim("iAimAt");if(inp)inp.setAttribute("aria-expanded","true");
}
```
On free-text-empty: box hidden. Good.

sd2AimKeys(ev):
```js
function sd2AimKeys(ev){
  var box=sd2Aim("aimSug");
  if(ev.key==="Escape"){sd2CloseSug();return;}
  if(box.hidden)return;
  if(ev.key==="ArrowDown"){ev.preventDefault();SUGI=Math.min(SUG.length-1,SUGI+1);sd2RenderSug();}
  else if(ev.key==="ArrowUp"){ev.preventDefault();SUGI=Math.max(0,SUGI-1);sd2RenderSug();} // hmm from -1 → 0
  else if(ev.key==="Enter"){
    if(SUGI>=0&&SUG[SUGI]&&!SUG[SUGI].raw&&!SUG[SUGI].n){/*nought*/}  // nought rows can't be highlighted? they can, but Enter on nought should do nothing? spec: INERT. I'll skip nought in highlight movement.
    ev.preventDefault();
    if(SUGI>=0&&SUG[SUGI]&&SUG[SUGI].n!==0)takeReading(SUG[SUGI]);
    else aimAtGo();
  }
}
```
Better: when moving, skip nought rows. Keep simple: ArrowDown/Up skip rows with n===0.

Hmm SUG rows for kindNamed may include n=0 (kept). Skip in keyboard, inert on click. OK.

Also mouseover row → SUGI=ix + repaint (nice). Optional; add via delegation mouseover.

aimAtGo():
```js
function aimAtGo(){
  var i=sd2Aim("iAimAt"),kind=sd2Aim("aimKind");
  if(!i)return;
  var raw=i.value.trim();
  if(!raw)return;
  if(kind.value===""){handOff(raw);return;}
  aim("…");
  fetch("api/resolve?q="+encodeURIComponent(raw))
   .then(function(r){return r.ok?r.json():{readings:[]};})
   .then(function(d){sd2AimResolved(raw,d.readings||d||[]);})
   .catch(function(){aim("the resolver did not answer. Try again.");});
}
```
resolve response shape: assume {readings:[...]} per spec naming ("readings"). Also handle array directly.

sd2AimResolved(raw,readings):
```js
function sd2AimResolved(raw,readings){
  var opts=readings.filter(function(x){return x.kind!=="q"&&x.n>0;}),
      empt=readings.filter(function(x){return x.kind!=="q"&&!(x.n>0);}),
      word=null;
  readings.forEach(function(x){if(x.kind==="q")word=x;});
  if(!opts.length&&empt.length){
    var e=empt[0];
    aimHold(sd2Esc(e.label)+" is a valid "+(KINDLAB[e.kind]||e.kind).toLowerCase()+
      ", but this file holds no report for it. It runs from "+sd2Pretty(sd2Range.from)+" to "+
      sd2Pretty(sd2Range.to)+".",0);
    return;
  }
```
Hmm the hold text shouldn't be pre-escaped if I use textContent painting... My aim() paints text; but holds need buttons (undo) → mixed. I'll implement holds as: text node + undo button (textContent for text, no injection risk). So pass RAW text, not escaped. Adjust: aimHold(text, ms). And the >1 chooser needs buttons per option → paint with DOM builder sd2AimPaint(nodes). Let me define:

```js
function aim(text){
  if(sd2Hold&&Date.now()<sd2Hold.until)return false;
  var z=sd2$("iAim");z.className="aim";z.removeAttribute("data-hold");
  z.textContent=text;return true;
}
function aimHold(text,ms){
  sd2Hold={text:text,until:Date.now()+(ms||6000)};
  paintHeld();
}
function paintHeld(){
  var z=sd2$("iAim");if(!z)return;
  if(sd2Hold&&Date.now()<sd2Hold.until){
    z.className="aim held";z.setAttribute("data-hold","1");
    z.textContent="";z.appendChild(document.createTextNode(sd2Hold.text));
    var b=document.createElement("button");b.type="button";b.className="undobtn";b.textContent="undo";
    b.addEventListener("click",function(){history.back();unaim();});
    z.appendChild(document.createTextNode(" "));z.appendChild(b);
  }else{sd2Hold=null;}
}
function unaim(){
  if(sd2Hold&&Date.now()<sd2Hold.until)return;
  sd2Hold=null;var z=sd2$("iAim");z.className="aim";z.removeAttribute("data-hold");z.textContent="";
}
```
For the multi-choice and refusal panels, I need richer content: I'll use a variant sd2AimSay(build) that paints DOM nodes and coexists with hold (refuses while hold? spec: aim refuses while hold live; the chooser should probably also respect it — use same guard; if refused, fine).

Actually simpler: make the chooser/other messages go through aimHold-like painter with no undo:
```js
function sd2AimRich(build,holdMs){ if(sd2Hold&&Date.now()<sd2Hold.until)return; sd2Hold=null; build(sd2$("iAim")); }
```
But "The box DELIBERATELY REFUSES to fall back to free text... It offers instead." — offer = the buttons. OK.

For chooser:
```js
function sd2AimChoice(raw,arr){
  var z=sd2$("iAim");sd2Hold=null;
  z.className="aim";z.textContent="";
  z.appendChild(document.createTextNode("“"+raw+"” could mean more than one thing here. Which do you want?"));
  arr.forEach(function(o){
    var b=document.createElement("button");b.type="button";b.className="aimchoice";
    b.appendChild(document.createTextNode(o.label+" "));
    var em=document.createElement("em");em.textContent=o.what;b.appendChild(em);
    var bb=document.createElement("b");bb.textContent=num(o.n);b.appendChild(bb);
    b.addEventListener("click",function(){takeReading(o);});
    z.appendChild(b);
  });
}
```

No-opts-at-all case:
```js
  if(!opts.length){
    var z=sd2$("iAim");sd2Hold=null;z.className="aim";z.textContent="";
    z.appendChild(document.createTextNode("no month, zone, airline, tail or system is called “"+raw+"”."));
    if(word&&word.n>0){
      var b=document.createElement("button");b.type="button";b.className="aimchoice";
      b.appendChild(document.createTextNode("Search the write-ups for “"+raw+"” instead "));
      var bb=document.createElement("b");bb.textContent=num(word.n);b.appendChild(bb);
      b.addEventListener("click",function(){handOff(raw);});
      z.appendChild(document.createTextNode(" "));z.appendChild(b);
    }else{
      z.appendChild(document.createTextNode(" No mechanic wrote that word either."));
    }
    return;
  }
  if(opts.length===1){takeReading(opts[0]);return;}
  sd2AimChoice(raw,opts);
```

takeReading(o):
```js
function takeReading(o){
  sd2CloseSug();
  var inp=sd2Aim("iAimAt");if(inp)inp.value="";
  if(o.kind==="period"){
    var f=o.raw&&(o.raw.from||o.raw.a),t=o.raw&&(o.raw.to||o.raw.b);
    if(f)sd2$("from").value=sd2ClampDate(f,sd2Range.from,true);
    if(t)sd2$("to").value=sd2ClampDate(t,sd2Range.to,false);
    syncControls();syncMoreFilters();sdSearch(0);showChange();
  }else{
    setFilter(o.kind,o.raw?(o.raw.value||o.raw.code||o.raw.v||o.label):o.label);
  }
  aimHold("took "+o.label+", "+o.what+", "+num(o.n)+" reports.",6000);
}
```
Hmm label may contain HTML-ish? use textContent painting → safe.

Wait: resolve reading for e.g. zone returns what value? The zone filter value format is "ZONE 300". I'll accept o.raw.value||o.raw.code||... and if kind==="zone" && /^\d00$/.test(val) → "ZONE "+val. Add normalization:
```js
var val=o.raw?(o.raw.value||o.raw.code||o.raw.v||o.raw.label||o.label):o.label;
if(o.kind==="zone"&&!/^ZONE /.test(val))val="ZONE "+val;
if(o.kind==="tail")val=String(val).replace(/^N/i,"");   // filter stores stem? 
```
Hmm tail: server strips leading N, "LIKE stem%". Does the control store stem or N-prefixed? clauseText says tail -> "N"+v, so v is the STEM (without N). So strip leading N when setting. But validate regex /^N?[0-9A-Z]{1,6}$/i accepts both. OK strip.

handOff(raw):
```js
function handOff(raw){
  var q=sd2$("q");q.value=raw;
  sd2CloseSug();
  sdSearch(0);showChange();
  q.scrollIntoView({block:"center"});
  q.classList.add("flash");
  setTimeout(function(){q.classList.remove("flash");},1400);
  aimHold("searched the write-ups for “"+raw+"”, not a category.",6000);
}
```

dropRefused(k):
```js
function dropRefused(k){
  delete UNRESOLVED[k];
  var e=sd2$(k);if(e)e.value="";
  buildChips();
  if(!Object.keys(UNRESOLVED).length&&!strayParams().length){
    if(sd2HasFilter()||REVEALED)sdSearch(0);
    else renderOnPurpose();
  }
}
```
dropStray(name):
```js
function dropStray(name){
  var u=new URLSearchParams(location.search);u.delete(name);
  history.replaceState(null,"",location.pathname+(u.toString()?"?"+u.toString():""));
  sd2Reevaluate();
}
function sd2Reevaluate(){
  var g=sd2Guard();
  if(g){sdNoSearch(g);return;}
  if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
  sdSearch(0);showChange();
}
```

renderOnPurpose():
```js
function renderOnPurpose(){
  sd2$("count").innerHTML="<strong>"+(sd2Total?num(sd2Total)+" reports.":"No number yet.")+"</strong> Nothing chosen yet.";
  sd2$("sentence").innerHTML="";
  var nr=sd2$("noRows");nr.hidden=false;
  nr.innerHTML="";
  nr.appendChild(el text...) 
```
I'll build with innerHTML using static text (no user data):
```js
  nr.innerHTML=
   '<p><strong>No rows yet, on purpose.</strong> Listing everything answers no question and buries the one you have.</p>'+
   '<p class="muted">Take a month, a zone, an airline or a tail from the instrument above, pick one of the starter questions, or set a filter. To read the file straight through anyway, use the button at the foot of the instrument.</p>'+
   '<p><button type="button" class="sdbtn" id="revealBtn">Read all '+(sd2Total?num(sd2Total):"")+' anyway</button> '+
   '<button type="button" class="ghostbtn" id="gotoStarters">Show me the starter questions</button></p>';
  sd2$("revealBtn").addEventListener("click",revealAll);
  sd2$("gotoStarters").addEventListener("click",function(){
    var s=sd2$("starters");s.classList.add("all");sd2$("starterToggle").textContent="fewer";
    s.scrollIntoView({block:"center"});sd2$("starters").querySelector("button").focus();
  });
  sd2SetExport(null);
  buildChips();
}
```
Spec text: "Read all ${TOTAL} anyway" — with TOTAL formatted. OK.

revealAll(){REVEALED=true;sd2$("noRows").hidden=true;sdSearch(0);showChange();}
goResults(){REVEALED=true;sd2$("noRows").hidden=true;sdSearch(0);}

resetAll():
```js
function resetAll(){
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.value="";});
  UNRESOLVED={};REVEALED=false;LAST_TOTAL=null;HERO_FOR=null;sd2CloseSug();
  var u=new URLSearchParams(location.search);
  FIELDS.forEach(function(k){u.delete(k);});
  history.replaceState(null,"",location.pathname+(u.toString()?"?"+u.toString()():""));  // typo watch
  syncControls();syncMoreFilters();renderOnPurpose();
  var nr=sd2$("noRows");nr.hidden=false;
  try{if(typeof heroData!=="undefined")heroData=null;}catch(_){}
}
```
Wait noRows should be visible in on-purpose state (it IS the on-purpose text) ✓.

sd2SetExport(total):
```js
function sd2SetExport(total){
  var a=sd2$("exportBtn");
  if(total==null){a.textContent="Export CSV";a.removeAttribute("href");a.setAttribute("aria-disabled","true");a.classList.add("off");return;}
  a.classList.remove("off");a.removeAttribute("aria-disabled");
  a.href="api/export?"+params().toString();
  a.setAttribute("download","");
  if(total===0){a.textContent="Export CSV (0 rows)";a.setAttribute("aria-disabled","true");a.classList.add("off");a.removeAttribute("href");}
  else if(total>5000){a.textContent="Export CSV (newest 5,000 of "+num(total)+")";
    a.title="Ordered newest first. The oldest reports are not in this file. Narrow with a date range to export the rest.";}
  else{a.textContent="Export CSV";a.removeAttribute("title");}
}
```

copyLink():
```js
function copyLink(){
  var done=function(){var c=sd2$("copied");c.hidden=false;setTimeout(function(){c.hidden=true;},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(location.href).then(done,done);
  else{done();}
}
```

syncControls/syncMoreFilters:
```js
function syncControls(){
  FIELDS.forEach(function(k){var e=sd2$(k);if(e)e.classList.toggle("landed",!!(e.value||"").trim());});
}
function syncMoreFilters(){
  var n=0;
  HIDDEN_FIELDS.forEach(function(k){var e=sd2$(k);if(e&&(e.value||"").trim())n++;});
  var m=sd2$("mfCount"),d=sd2$("moreFilters");
  if(m)m.textContent=n?("("+n+" active)"):"";
  if(d&&n>0)d.open=true;
}
```
HIDDEN_FIELDS = FIELDS minus q, operator, from, to.

setFilter:
```js
function setFilter(k,v){
  var e=sd2$(k);if(!e)return;
  e.value=v;
  if(UNRESOLVED[k]&&v!==""){} // unlikely
  delete UNRESOLVED[k];
  if(typeof show==="function"){try{show("p-search");}catch(_){}}
  syncControls();syncMoreFilters();
  sdSearch(0);showChange();
}
```
showChange calls buildChips; chips before search results arrive show new state — fine.

Wire controls at boot:
- Search button → goResults
- Clear → resetAll
- selects/dates: for each FIELDS k: e=sd2$(k); if type date or tagName SELECT → change → {syncControls();syncMoreFilters();sdSearch(0);showChange();} — but q/minhours/tail text inputs → keydown Enter. Operator is select ✓.
- q input → vocab datalist (debounce 180, seq).

q vocab:
```js
var qSugSeq=0,sd2QDeb;
function sd2QInput(){
  var q=sd2$("q").value.trim(),seq=++qSugSeq,dl=sd2$("qList");
  if(q.length<3){dl.innerHTML="";return;}
  clearTimeout(sd2QDeb);
  sd2QDeb=setTimeout(function(){
    fetch("api/vocab?q="+encodeURIComponent(q)+"&limit=10")
     .then(function(r){return r.ok?r.json():[];})
     .then(function(list){
       if(seq!==qSugSeq)return;
       dl.innerHTML=(list||[]).map(function(x){
         return '<option value="'+sd2Attr(x.term||x.label||x.v||"")+'">'+(x.n?num(x.n):0)+" reports</option>";
       }).join("");
     }).catch(function(){});
  },180);
}
```
Spec: options labelled "N reports". OK.

Inject aim boxes:
```js
var AIM_HTML='...';
function sd2InjectAim(){
  [".ipad",".phextra"].forEach(function(sel){
    var host=document.querySelector(sel);
    if(!host)return;
    var w=document.createElement("div");w.className="aimwrap";w.innerHTML=AIM_HTML;
    host.appendChild(w);sd2WireAim(w);
  });
  aimPlaceholder();
  if(!aimTimer)aimTimer=setInterval(function(){aimPlaceholder();paintHeld();},600);
}
```

Boot:
```js
var sd2Facets={},sd2CODES=(typeof CODES!=="undefined"&&CODES)?CODES:null,
    sd2Range=(typeof RANGE!=="undefined"&&RANGE)?RANGE:null,
    sd2Total=(typeof TOTAL!=="undefined"&&TOTAL!=null)?TOTAL:null,
    UNRESOLVED={},REVEALED=false,HERO_FOR=null,LAST_TOTAL=null;
function sd2Boot(){
  var jobs=[];
  if(!sd2CODES)jobs.push(fetch("api/glossary").then(function(r){return r.ok?r.json():{};}).then(function(c){sd2CODES=c;}).catch(function(){}));
  jobs.push(fetch("api/facets").then(function(r){return r.ok?r.json():{};}).then(function(f){sd2Facets=f||{};}).catch(function(){}));
  if(!sd2Range)jobs.push(fetch("api/range").then(function(r){return r.ok?r.json():null;}).then(function(g){if(g){sd2Range=g;if(g.total!=null)sd2Total=g.total;}}).catch(function(){}));
  Promise.all(jobs).then(function(){
    // restore
    var u=new URLSearchParams(location.search);
    FIELDS.forEach(function(k){
      var v=u.get(k);if(v==null)return;
      var e=sd2$(k);if(!e)return;
      e.value=v;
      if(e.value!==v||!sd2Validate(k,v)){UNRESOLVED[k]=v;e.value="";}
    });
    // options with counts
    sd2BuildOpts();
    if(sd2Range&&sd2Range.from){sd2$("from").min=sd2Range.from;sd2$("to").min=sd2Range.from;
      sd2$("from").max=sd2Range.to;sd2$("to").max=sd2Range.to;}
    sd2BuildStarters();
    sd2InjectAim();
    sd2WireControls();
    var g=sd2Guard();
    if(g){sdNoSearch(g);return;}
    if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
    sdSearch(0);
  });
}
sd2Boot();
```
Careful: e.value!==v check — for select, setting a nonexistent value leaves value===""? Actually setting select.value to missing option sets value to "" (and selectedIndex -1). So e.value!==v catches. Also validate.

sd2WireControls: attach change/enter handlers, buttons.

Also delegation for clause drops:
```js
sd2$("count").addEventListener("click",function(ev){
  var c=ev.target.closest(".clause");if(!c)return;sd2DropClause(c.dataset.drop);
});
sd2$("count").addEventListener("keydown",function(ev){
  if(ev.key!=="Enter"&&ev.key!==" ")return;
  var c=ev.target.closest(".clause");if(!c)return;ev.preventDefault();sd2DropClause(c.dataset.drop);
});
function sd2DropClause(k){
  var ks=k.split("|");
  ks.forEach(function(x){var e=sd2$(x);if(e)e.value="";});
  syncControls();syncMoreFilters();sdSearch(0);showChange();
}
```
setFilter(k,'') for single — same thing; use setFilter when ks.length===1 to keep one path: sd2DropClause → if single: setFilter(k,"") else dual-set+search. Fine.

Now markup. Layout:

```html
<!-- ================= CONTROLS HALF — insert this markup immediately after the instrument markup (before the record-table mount) ================= -->
<div id="sdControls">
  <div class="aimline" id="iAim" role="status" aria-live="polite"></div>

  <div class="bar">
    <div class="fld grow"><label for="q">Search the write-ups</label>
      <input id="q" list="qList" autocomplete="off" placeholder="any words a mechanic wrote">
      <datalist id="qList"></datalist></div>
    <div class="fld"><label for="operator">Operator</label><select id="operator"><option value="">Any operator</option></select></div>
    <div class="fld"><label for="from">From</label><input type="date" id="from"></div>
    <div class="fld"><label for="to">To</label><input type="date" id="to"></div>
    <div class="fld btns"><button type="button" id="runSearch" class="sdbtn">Search</button>
      <button type="button" id="clearAll" class="ghostbtn">Clear</button></div>
  </div>

  <details id="moreFilters">
    <summary>More filters <span id="mfCount"></span></summary>
    <div class="grid">
      <div class="fld"><label for="make">Manufacturer</label><select id="make"><option value="">Any manufacturer</option></select></div>
      model, part, ata, nature, crew, condition, discovered, stage, zone, tail(input), corrosion, cracked, minhours(number)
      <input type="hidden" id="jasc">
    </div>
  </details>

  <div id="starters" aria-label="Starter questions"></div>
  <button type="button" id="starterToggle" class="ghostbtn"></button>

  <div id="unresolved" class="unresolved" hidden></div>
  <div id="chips" class="chips"></div>
  <div id="count" class="sdcount"></div>
  <div id="sentence" class="sdsentence"></div>

  <div class="actions">
    <a id="exportBtn" class="sdbtn off" href="#">Export CSV</a>
    <button type="button" id="copyBtn" class="ghostbtn" onclick="copyLink()">Copy link</button>
    <span id="copied" hidden>copied</span>
  </div>

  <div id="noRows" class="norows" hidden></div>
</div>
```
copyLink via onclick attribute — I defined it as function in IIFE → not global! onclick attr needs global. Use addEventListener instead. Yes — wire in sd2WireControls. Same for aimAtGo: onclick attr in AIM_HTML would need global; I used class .aimgo and wire via sd2WireAim: addEventListener click → aimAtGo. Good — avoid inline handlers entirely (IIFE scope). Adjust AIM_HTML button without onclick.

Wait — spec shows `<button onclick="aimAtGo()">Take it</button>`. In an IIFE, aimAtGo isn't global. Functions declared inside IIFE with `function aimAtGo(){}` ARE accessible to inline handlers only if global (window.aimAtGo). Inline onclick resolves via scope chain → global scope, not IIFE. So wire programmatically. Note? Minor; maybe mention that inline handlers were avoided because everything lives inside the IIFE. Good departure note.

Also starters region: buttons inline in #starters, toggle after.

Labels for model/part/ata/tail/minhours/jasc hint: "Model", "Part", "ATA chapter", "Tail number", "At least this many hours" (LABEL spec). jasc hidden — but user needs to SEE when set: chip + mfCount covers it; also show its value in summary? Chip is the spec'd display. OK.

Tail input placeholder "e.g. N583".

CSS. Aim box classes: .aimwrap .aimbox? AIM_HTML:

```js
var AIM_HTML=
 '<div class="aimbox">'+
 '<label for="aimKind">Aim at</label>'+
 '<select id="aimKind">'+
  '<option value="period">a month or year</option>'+
  '<option value="operator">an airline</option>'+
  '<option value="tail">a tail number</option>'+
  '<option value="zone">a zone</option>'+
  '<option value="jasc">a system code</option>'+
  '<option value="">free text search</option>'+
 '</select>'+
 '<input id="iAimAt" role="combobox" aria-controls="aimSug" aria-autocomplete="list" aria-expanded="false" autocomplete="off">'+
 '<button type="button" class="aimgo">Take it</button>'+
 '<label class="aimday">or one day<input id="aimDay" type="date"></label>'+
 '<div class="aimsug" id="aimSug" role="listbox" hidden></div>'+
 '</div>';
```
Two copies (desktop & phone) each include these ids. My sd2Aim picks visible.

Hmm the phone .phextra is presumably inside the instrument — appending my aimwrap there is what spec wants ("Rendered inside the instrument, twice").

The aim line #iAim placement: inside my controls block, above the bar — but spec: "#iAim is the ONE element a pointer may write to" and messages about aim actions appear there. It's fine above the bar; "Aim line" near the instrument. I could also append #iAim into the instrument... keep in controls block.

Now CSS, compact:

```css
#sdControls{font:15px/1.45 Georgia,serif;color:#2b2622;margin:14px 0 0}
#sdControls .bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
#sdControls .fld{display:flex;flex-direction:column;gap:3px}
#sdControls .fld.grow{flex:1 1 260px}
#sdControls label{font:600 11px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6f6a63}
#sdControls input,#sdControls select{font:14px/1.3 system-ui;padding:7px 9px;border:1px solid #cfc6bd;background:#fff;border-radius:3px;min-width:0}
#sdControls input.landed,#sdControls select.landed{border-left:4px solid #8a2a17;background:#fdf7f4}
#sdControls .btns{flex-direction:row;gap:8px}
.sdbtn{...} .ghostbtn{...}
#moreFilters summary{cursor:pointer;...}
#moreFilters .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:10px}
#starters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 6px}
#starters button{...}
#starters button.extra{display:none}
#starters.all button.extra{display:inline-block}
.chip{background:#fdf1ec;border:1px solid #f0d5cb;color:#8a2a17;...}
.chip.warn{background:#fdf3ee;border-color:#eec9b8;color:#7c3a1f}
.chip b{cursor:pointer;...}
.clause{cursor:pointer;text-decoration:underline dotted #8a2a17;text-underline-offset:3px}
.clause:hover,.clause:focus{background:#fdf1ec}
.fig{font-size:1.35em}
.aside{color:#6f6a63;font-style:italic}
.broken{display:block;color:#8a2a17;font-weight:bold}
.unresolved{background:#fdf3ee;border:1px solid #eec9b8;color:#7c3a1f;padding:10px 12px}
.norows{border:1px dashed #cfc6bd;padding:18px;background:#fbf8f5}
#iAim.aim{min-height:1.4em;font-style:italic;color:#5d4a72}
#iAim.held{color:#8a2a17}
.aimchoice, .undobtn{...}
.aimsug{position:absolute;z-index:30;background:#fff;border:1px solid #cfc6bd;max-height:320px;overflow:auto}
.sug{display:flex;gap:8px;align-items:baseline;padding:6px 10px;cursor:pointer}
.sug.on{background:#fdf7f4;box-shadow:inset 3px 0 0 #8a4a2f?}
.sug.nought{opacity:.62;cursor:default}
.sughead{font:700 10px system-ui;letter-spacing:.08em;padding:6px 10px 2px}
.sk-operator{color:#8c4a2f}.sk-tail{color:#3f6b57}.sk-period{color:#4a5d80}.sk-zone{color:#7a5a2e}.sk-jasc{color:#5d4a72}.sk-q{color:#6f6a63}
.aimbox{display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:relative}
option.empty{color:#a49c93}
#q.flash{outline:3px solid #e0b48c;transition:none}  → animation: @keyframes sdflash{from{background:#fbe9d7}to{background:#fff}} #q.flash{animation:sdflash 1.4s}
```
.aimsug positioning needs .aimbox position:relative ✓ and the sug absolutely under input — okay-ish; set .aimsug{left:0;right:0;top:100%} relative to aimbox. Fine.

Starters toggle initial label "12 more questions".

Edge: `#starters` first six without extra class; toggle button text.

sd2BuildStarters:
```js
function sd2BuildStarters(){
  var box=sd2$("starters");box.innerHTML="";
  STARTERS.forEach(function(s,i){
    var b=document.createElement("button");b.type="button";
    if(i>=6)b.className="extra";
    b.textContent=s[0];
    b.addEventListener("click",function(){starter(i);});
    box.appendChild(b);
  });
  var t=sd2$("starterToggle"),open=false;
  t.textContent="12 more questions";
  t.addEventListener("click",function(){
    open=!open;box.classList.toggle("all",open);
    t.textContent=open?"fewer":"12 more questions";
  });
}
```

sd2WireControls:
```js
function sd2WireControls(){
  sd2$("runSearch").addEventListener("click",goResults);
  sd2$("clearAll").addEventListener("click",resetAll);
  sd2$("copyBtn").addEventListener("click",copyLink);
  sd2$("exportBtn").addEventListener("click",function(ev){
    if(sd2$("exportBtn").classList.contains("off"))ev.preventDefault();
  });
  FIELDS.forEach(function(k){
    var e=sd2$(k);if(!e)return;
    if(e.tagName==="SELECT"||e.type==="date")
      e.addEventListener("change",function(){syncControls();syncMoreFilters();sdSearch(0);showChange();});
    else
      e.addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();syncControls();syncMoreFilters();sdSearch(0);showChange();}});
  });
  sd2$("q").addEventListener("input",sd2QInput);
}
```
Note q Enter also handled here (text). ✓. operator select change → search even if same value... fine.

Hmm — operator change with empty value (user clears back to "Any operator") → search runs with no operator → fine (there may be other filters, or if nothing selected & !REVEALED → sdSearch guard: nothing filtered and not revealed → spec says nothing listed by default. sdSearch doesn't check that; only boot & sd2Reevaluate & dropRefused do. If user clears the last filter via chip → setFilter(k,'') → sdSearch(0) with empty params → would list everything! Spec: "NOTHING IS LISTED BY DEFAULT. With nothing chosen the page prints 'No rows yet, on purpose.' and returns before any search runs." — setFilter to '' emptying the last param should return to on-purpose state. I'll add to sdSearch: 
```js
if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
```
That's clean and centralizes the gate (spec puts it in search anyway). 

sd2HasFilter(): params().toString()!=="" .

Also then boot just calls sdSearch(0) unconditionally after guard — the gate inside handles on-purpose. Simplify boot: after restore/opts/etc: g=sd2Guard(); if(g) sdNoSearch(g) else sdSearch(0). And sdSearch does gate. But careful: gate inside sdSearch would also fire for revealAll? revealAll sets REVEALED=true first ✓. goResults too ✓. starter leaves params non-empty ✓ (bird etc.). aimDay sets dates ✓. resetAll calls renderOnPurpose directly ✓.

But renderOnPurpose inside sdSearch when user pressed the primary "Search" with empty fields → REVEALED true via goResults → proceeds to search. ✓.

Now #noRows hidden management: when search runs (rows coming), hide noRows. In sdSearch after gate: sd2$("noRows").hidden=true. ✓ (revealAll also sets it; fine to centralize: in sdSearch after guard/gate: hide). But sdNoSearch shows it with refusal. OK.

renderCount's stale branch uses HERO_FOR — but HERO_FOR set by... the hero half normally. I set it in renderCount. Initially null → first render not stale. OK.

renderSentence: also on stale? spec output 1 is the count line content itself. Keep.

One more spec item: "Restore at boot ... a <select> silently refuses a value it has no option for, and that refusal is CAUGHT." ✓ done.

"min and max set to the corpus range at boot" for from/to ✓.

Export: also add? click handler when off prevents nav ✓.

Number formatting fallback:
```js
function sd2Num(n){ if(typeof num==="function"){try{return num(n);}catch(_){}} return (n==null?"0":String(n)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
```
But spec code uses num(...) — I'll alias: use sd2Num everywhere except… simpler: define local `var num = (typeof num==="function")?num:sd2Num;` — redeclaring? Inside IIFE, if num exists in outer IIFE scope, `var num` in same scope would shadow/hoist-conflict: `var num=(typeof num==="function")?num:...` — typeof num at that point: hoisting makes local var undefined → typeof "undefined" → would replace existing! Bad. Don't redeclare. Just always call sd2Num / sd2Pretty. Safe.

prettyDate similar: sd2Pretty(d) uses existing prettyDate if function.

```js
function sd2Pretty(s){
  if(!s)return"";
  if(typeof prettyDate==="function"){try{return prettyDate(s);}catch(_){}}
  var d=new Date((s.length>10?s:s+"T00:00:00"));
  if(isNaN(d))return s;
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
}
```
Careful "YYYY-MM-DD" → new Date("YYYY-MM-DD") is UTC midnight; toLocaleDateString may show previous day in negative TZ. Use s+"T00:00:00" always when 10 chars. Fix: `var d=new Date(s.length===10?s+"T00:00:00":s);`.

sd2ClampDate(v,bound,isFrom): return isFrom?(v<bound?bound:v):(v>bound?bound:v). Dates as ISO strings compare lexically ✓.

period readings may give {y,m} instead of from/to — handle: if raw.y && raw.m: compute month span: f=`y-m-01`, t=last day: new Date(y,m,0).getDate(). Add:
```js
if(o.raw&&o.raw.y&&o.raw.m){f=o.raw.y+"-"+pad(o.raw.m)+"-01";t=o.raw.y+"-"+pad(o.raw.m)+"-"+pad(new Date(o.raw.y,o.raw.m,0).getDate());}
if(o.raw&&o.raw.y&&!o.raw.m){f=o.raw.y+"-01-01";t=o.raw.y+"-12-31";}
```
Include pad helper.

OK — also strayParams:
```js
var URL_KNOWN={};FIELDS.forEach(function(k){URL_KNOWN[k]=1;});
["view","hero","case","aircraft","ca","cb","cf"].forEach(function(k){URL_KNOWN[k]=1;});
function strayParams(){
  var out=[],u=new URLSearchParams(location.search);
  u.forEach(function(v,k){if(!URL_KNOWN[k]&&out.indexOf(k)<0)out.push(k);});
  return out;
}
```
URL_KNOWN should be a set — spec calls it URL_KNOWN. OK.

NO_RAIL & FOLLOWS_FILTER consts — define FOLLOWS_FILTER; NO_RAIL too (spec lists it; harmless).

VIEW_GROUPS — I'll define with the three labels as keys mapping to FOLLOWS_FILTER-ish lists; but I don't know other panels' ids. I'll define:
```js
var VIEW_GROUPS={"Narrows to what you selected":FOLLOWS_FILTER.slice(),"Ignore your selection":[],"Reference":[]};
```
and note the panels half extends it. Cheap.

scopeLine + filterWords:
```js
function filterWords(){
  var L=clauseList().map(function(x){return x.t;});
  return L.length?L.join(", "):"";
}
function scopeLine(id,n){
  if(id==="p-search"||id==="p-aircraft")return"";
  if(FOLLOWS_FILTER.indexOf(id)>=0)
    return n>0?"Showing <strong>your selection</strong>, "+sd2Num(n)+" reports.":"";
  if(!sd2HasFilter())return"All "+sd2Num(sd2Total)+" reports.";
  return"This view always answers for <strong>all "+sd2Num(sd2Total)+" reports</strong>. It does not narrow to your current selection ("+(filterWords()||"no filter")+")";
}
```
Hmm filterWords with none → unfiltered branch already returned. Fine.

clauseText:
```js
function clauseText(k,v){
  switch(k){
    case"q":return'where a mechanic wrote “'+v+'”';
    case"operator":{var f=sd2Facets.operator&&sd2Facets.operator[v];return (f&&f.label)?f.label:v;}
    case"tail":return"N"+v;
    case"cracked":return"with cracking recorded";
    case"minhours":return sd2Num(+v)+" hours or more on the airframe";
    case"from":case"to":return"";
    default:return String(sd2Code(k,v)).toLowerCase();
  }
}
```
Zero-phrase strips leading "where " ✓.

Escaping: clause span text passed through sd2Esc; labels into options escaped; sug labels escaped; chips use textContent (safe).

sd2Esc/sd2Attr:
```js
function sd2Esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
var sd2Attr=sd2Esc;
```

Wait — clauseText for operator returns name possibly with quotes → escaped in span ✓.

Also chips text uses createTextNode → safe.

One subtlety: buildChips is called in renderCount and showChange; the "shown" decode uses sd2Facets — fine.

Starter & datalist: after starter, syncControls etc. ✓ (starter calls them).

Also the "Search"/"Clear" as spec: "Primary row: #q (with datalist), #operator, #from, #to, Search, Clear." ✓.

Check ids list: q, operator, make, model, part, ata, jasc, nature, crew, condition, stage, zone, tail, discovered, corrosion, cracked, minhours, from, to = 19 ✓ (plus UI ids).

Alright, also handle: sd2BuildOpts list:
```js
function sd2BuildOpts(){
  opts("operator","Any operator");
  opts("make","Any manufacturer");
  opts("model","Any model");
  opts("part","Any part");
  opts("ata","Any ATA chapter");
  opts("nature","Anything found",SKIPS.nature);
  opts("crew","Anything the crew did",SKIPS.crew);
  opts("condition","Any part condition");
  opts("discovered","Found by any method",SKIPS.discovered);
  opts("stage","Any stage of flight",SKIPS.stage);
  opts("zone","Anywhere on the aircraft",SKIPS.zone);
  opts("corrosion","Any corrosion level",SKIPS.corrosion);
}
```

Facets shape risk: maybe facets give {operator:[{v,label,n},...]}. I'll normalize in load:
```js
function sd2NormFacets(f){
  var out={};
  for(var k in f){
    var m={},it=f[k];
    if(Array.isArray(it))it.forEach(function(o){m[o.v||o.value||o.code]={label:o.label||o.v||o.value||o.code,n:o.n||o.count||0};});
    else for(var v in it){var e=it[v];m[v]=typeof e==="object"?{label:e.label||v,n:e.n||e.count||0}:{label:v,n:e};}
    out[k]=m;
  }
  return out;
}
```

Time to also double check duplicate id wiring in sd2WireAim — root.querySelector('[id="aimKind"]') — but the OTHER copy also matches within document; scoping to root fixes ✓.

Also #iAim duplicated? No, aim line is single, in controls block ✓. But hold on: spec says aim box rendered twice INSIDE the instrument; #iAim (aim line) single. OK.

Hidden #aimSug inside each aimbox; sd2Aim("aimSug") picks visible copy. But when typing in desktop copy, visible copy is desktop's — ✓. If BOTH visible (desktop .ipad and phone .phextra both displayed)? Unlikely; fine.

Also spec "SUG = readings.filter(x=> x.kind!=="q" && (x.n>0 || kindNamed))" ✓ implemented.

Now the "no opts but empties" message: uses first empty e; label via e.label. What if multiple empties? show first (or all?). Spec singular phrasing; first is fine — maybe list labels of all empties? Keep first, plus it mentions kind. Fine.

aimHold with ms 0 for the "valid but no reports" message? I used aimHold(...,0) → until=now → immediately expires... paintHeld checks Date.now()<until → false → clears. Use a longer hold (6000). Just use aimHold(text) default 6000. But spec's sentence is informational; hold fine.

Also "The box DELIBERATELY REFUSES to fall back to free text" — handled: no opts at all → only offers the word button when word has hits; no silent fallback ✓. And kind==="" → handOff explicitly chosen ✓.

renderSentence: also clear when no search? sdNoSearch sets sentence "" ✓; renderOnPurpose sets "" ✓.

Check the checklist items:
1. 19 controls with ids ✓.
2. #operator thousands options with counts — via api/facets (assumed). Departure note.
3. Nothing chosen → on-purpose, no api/search: boot gate ✓ (renderOnPurpose before any search; sdSearch gate).
4. Bad value in link → sd2Validate catches (format fields), select-refusal catches, membership via facets; sdNoSearch, no query ✓.
5. Chip cross → setFilter(k,'') ✓ exactly one filter.

Departures list (concise):
- search() left undeclared per instruction; added sdSearch() wrapper that: gates empty-on-purpose (so clearing the last filter returns to the on-purpose state), refuses refused/stray links client-side, hides #noRows, and renders count/sentence if the existing search() resolves data. The refusal/empty rendering lives here because I don't own search().
- Inline event handlers avoided (aimAtGo/copyLink wired with addEventListener) — the block lives inside the IIFE so inline onclick attributes couldn't see it.
- api/facets assumed (spec names no counts endpoint) for per-option counts; union with CODES tables so "(no reports)" rows exist even at zero. api/glossary fetched only if the page's CODES global is absent; api/range only if RANGE/TOTAL absent.
- Tail is a text input (server matches stems, not a closed list); jasc is the hidden input per spec, surfaced through chips and the More-filters active count.
- Duplicated aim-box ids resolved by a visible-copy accessor (spec demands two copies but singular ids).
- Primary Search with empty fields calls goResults() (explicit intent to see everything), matching the "Read all anyway" route; spec didn't state it.
- CLIENT mirrors server validation (formats + facet membership) so a bad link is refused before the wire; anything the client can't judge still hits the server's 400 path. ata left unvalidated to mirror the server's stated loose end.

Also mention markup placement & JS placement clearly at top.

Let me now also write CSS fully and markup fully with all More-filters fields.

More filters fields with labels per LABEL: Manufacturer(make), Model(model), Part(part), Exact system → jasc hidden (no label — hidden). System (ata) label "System"? LABEL says ata→"System"?? LABEL list: Text, Operator, Manufacturer, Model, Part, System, Exact system, Found, Crew action, Part condition, Stage of flight, Zone on the aircraft, Tail number, How found, Corrosion, Cracking, At least this many hours, From, To. Mapping to FIELDS order: q=Text, operator=Operator, make=Manufacturer, model=Model, part=Part, ata=System, jasc=Exact system, nature=Found, crew=Crew action, condition=Part condition, stage=Stage of flight, zone=Zone on the aircraft, tail=Tail number, discovered=How found, corrosion=Corrosion, cracked=Cracking, minhours=At least this many hours, from=From, to=To. 

So visible labels: make "Manufacturer", model "Model", part "Part", ata "System" (select of 2-digit codes), jasc hidden ("Exact system"), nature "Found", crew "Crew action", condition "Part condition", stage "Stage of flight", zone "Zone on the aircraft", tail "Tail number", discovered "How found", corrosion "Corrosion", cracked "Cracking", minhours "At least this many hours".

But my select first-options were "Anything found" for nature etc. — those are the "empty labels" from spec ✓ consistent (nature empty label "Anything found").

Use LABEL[k] for labels programmatically? Markup static — I'll write labels in markup matching LABEL.

OK. Writing final. I'll keep the code tight but complete. Estimate ~550 lines total. Go.

One more: `sd2$("noRows")` etc ids. Also ensure `opts` name doesn't collide — spec names it; keep.

Also `aim` function name is very short and could collide with an existing global (instrument?). Risk accepted per spec naming; mention? The pct warning... `aim` is spec-named for this feature; the instrument previously had no aim box (my page lacked it). Keep, note nothing.

In sd2ShowSug I reference WHAT map — define WHAT={period:"a month or year",operator:"an airline",tail:"a tail number",zone:"a zone",jasc:"a system code"}.

In sd2AimTyping I wrote mapping wrong; rewrite:
```js
function sd2ShowSug(list,kind){
  var kindNamed=kind!=="";
  var readings=(list||[]).map(function(x){
    if(x.kind==="q"||x.term)
      return{kind:"q",label:x.label||x.term||x.v||"",n:x.n||0,what:"a word in the write-ups",raw:x};
    return{kind:x.kind,label:x.label||x.v||x.value||x.code||"",n:x.n||0,
           what:x.what||WHAT[x.kind]||x.kind,raw:x};
  });
  SUG=readings.filter(function(x){return x.kind!=="q"&&(x.n>0||kindNamed);});
  ...
}
```

Keyboard skip nought: 
```js
function sd2Move(d){
  var i=SUGI;
  do{i+=d;if(i<0||i>=SUG.length)return;}while(SUG[i]&&!SUG[i].n);
  SUGI=i;sd2RenderSug();
}
```
Hmm if stepping lands beyond bounds, keep old SUGI. From -1 down: i=-1+d... ArrowUp from -1: i=-2 <0 return. ArrowDown from -1 → i=0; if nought skip to 1... ok.

Enter: if SUGI>=0 && SUG[SUGI] && SUG[SUGI].n → takeReading; else aimAtGo().

Also clicking sug rows uses mousedown + data-i ✓; mouseover to highlight: add delegation:
```js
s.addEventListener("mouseover",function(ev){var row=ev.target.closest(".sug");if(!row||row.classList.contains("nought"))return;SUGI=+row.dataset.i;sd2RenderSug();});
```
Re-render on hover could cause flicker of position — fine, box position fixed via CSS.

sd2CloseSug(){SUG=[];SUGI=-1;var b=sd2Aim("aimSug");if(b){b.hidden=true;b.innerHTML="";}var i=sd2Aim("iAimAt");if(i)i.setAttribute("aria-expanded","false");}

sd2AimDeb var declare.

Also handOff used with raw param; aimAtGo free-text passes raw ✓.

Boot date min/max also set on phone? from/to single in controls ✓.

Also careful: sdSearch hides noRows — but on gate-fail (on-purpose) we show it. In sdSearch:
```js
function sdSearch(off){
  var g=sd2Guard();
  if(g){sdNoSearch(g);return;}
  if(!sd2HasFilter()&&!REVEALED){renderOnPurpose();return;}
  var nr=sd2$("noRows");if(nr)nr.hidden=true;
  var r;
  try{r=search(off);}catch(e){throw e;}
  if(r&&typeof r.then==="function"){r.then(function(d){if(d&&typeof d.total==="number"){renderCount(d);renderSentence(d);}}).catch(function(){});}
  return r;
}
```

renderOnPurpose also used at boot before facets load? Boot awaits facets first — acceptable (facets needed for options anyway). If facets fetch fails, still proceed (catch → {}).

Corpus number: renderCount stale/others use d.corpus fallback sd2Total.

renderCount "nothing selected" branch: `<b class="fig">${num(corpus)}</b> reports, everything the FAA has published to ${prettyDate(RANGE.to)}.` — only shown when REVEALED true and no filter (read-all). ✓.

Set export even in stale? renderCount only runs with data. Fine.

Also buildChips called by showChange — setFilter → sdSearch → showChange ✓ chips update.

Let me write it all out now. Also add tiny `pad`.

For the zero-result phrase, d may include matched clause info; use clauseList() from current params ✓.

Writing the final answer with: 1) placement notes, 2) HTML block, 3) CSS block, 4) JS block, 5) Departures. No preamble per instructions.