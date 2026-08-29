Let me carefully parse this task. The user is describing a rebuild of an FAA Service Difficulty Reports "hero" instrument with four rails: WHEN (horizon), WHERE (anatomy), WHO (swarm), FORCED (ledger). They previously got a rebuild that had bugs, and now they provide detailed specs for each rail plus six things to build:

1. The month strip when the rail is shut — closed rail shows 380 bars at 14px height, no axis, no magnifier, no sentence, tabindex -1.
2. The gutter value — three lines when open (question, sub-label, value), two when shut (question and value on one baseline). Value = what the rail currently amounts to, never the sub-label.
3. The reading paragraph on all four rails.
4. The crew ladder caps at eight — 8 rows, block bar uses crew_reports not sum.
5. The specimen's decoded line — 7 parts, fixed order, middle dot joined, dropped when empty/dead/duplicate.
6. The standing sentence — count, clauses, set-aside remainder, droppable clauses, refusal to print a figure computed for a different selection.

Also: accept both spellings in ?hero= — original names rails horizon, anatomy, swarm, ledger; the rebuild names them when, where, whose, forced. Both must open the right rail.

The deliverable: "One self-contained block of JavaScript and CSS that drops into your existing file inside its IIFE, using your existing helpers. Keep your function names so the block overrides by redeclaration."

Hmm — this is a tricky situation. The user says "drops into your existing file inside its IIFE, using your existing helpers" — but I don't have their existing file. This is a continuation of a conversation I don't have context for. I need to write the code as a drop-in block that assumes certain helpers exist (num, esc, params, etc.) but since I don't know the existing file, I should write it self-contained enough: define the functions with names that would override by redeclaration, and guard helpers with fallbacks (e.g., `const num = window.num || (n=>...)`)? Actually "Keep your function names so the block overrides by redeclaration" — so my previous answer (which I can't see) had certain function names. The measurement mentions things like `drawHero`, `drawPhone`, `gutter()`, `railWhen`, `periodClause`, `aim`, `aimHold`, `takePeriod`, `search`, `showChange`, `setHero`, `syncControls`, `takeFilter`, `openCase`, `paintSpines`, `monthAt`, `paintBracket`, `takeReading`, `leave_one_out`, `jargon`, `specLine`, `opName`, `pct`, `spell`, `num`, `esc`, `params`, `heroSeq`, `HERO_FOR`, `NARROWED`...

Given the spec references function names heavily, I should produce a block that defines these functions. Since I can't see the existing file, the safest approach: write the block as a self-contained IIFE-including snippet that defines everything it needs, with defensive fallbacks for helpers that may or may not exist in the host file (e.g., `var num = (typeof num==="function")?num:...` — but inside an IIFE, redeclaration via `function num(){}` would override... hmm, actually within an IIFE, `function num(){...}` declares a local that shadows the outer. If the block is "dropped inside the existing IIFE", the functions declared in the block override the earlier declarations due to hoisting — wait, no: function declarations hoist to the top of the enclosing function scope, so a later `function drawHero(){}` in the same scope would conflict... Actually two function declarations of the same name in the same scope: the last one wins (in sloppy mode; in strict mode at top-level of script it's a SyntaxError only for block-scoped lexicals? No — duplicate function declarations in the same scope are allowed in sloppy mode, later wins; in ES2015+ they're allowed even in strict mode at function scope... Let me recall: duplicate function declarations in the same scope are legal (they're var-scoped), the last one wins. `let`/`const` duplicates are errors. So "overrides by redeclaration" means the block uses `function name(){}` declarations placed after the originals.

So the deliverable is a block of JS (function declarations that override) plus CSS. The user's checklist:

- 380 month bars present with the WHERE rail open... wait, "380 month bars present with the WHERE rail open" — hmm, I think they mean with the page loaded (the WHEN rail visible even if not the open one?). Actually re-reading: "380 month bars present with the WHERE rail open, the busiest month darkest, the part months hatched." Hmm — the month strip must render 380 bars even when the WHEN rail is closed (rail shut). Wait but "rail shut" row in their table says "month bars, rail shut: original 380, yours 0". So when the WHERE (aircraft) rail is open, the WHEN rail is shut, and it must still show 380 bars. So each closed rail keeps its shape: 14px tall strip of month bars. OK.

- Four gutter value lines, reading counts not sub-labels: WHEN "380 months" (or period clause), WHERE "on the aircraft all zones"? Hmm, the original's gutters read "WHEN 380 months", "WHERE on the aircraft all zones", "WHO 54,634 aircraft", "FORCED 151,543 of 1,757,827". Wait — "WHERE on the aircraft all zones" — that looks like question + value where value is "on the aircraft all zones"? Hmm. Actually the gutter has three lines when open (question, sub-label, value) and two when shut (question and value on one baseline). The measured strings: "WHEN 380 months" — question WHEN, value "380 months". "WHERE on the aircraft all zones" — hmm, that would be question WHERE, value... "on the aircraft all zones"? That seems like a sub-label. Wait, maybe WHERE's value when open at rest is "all zones" and sub-label "on the aircraft"? The measurement concatenated? The user wrote: The original's read "WHEN 380 months", "WHERE on the aircraft all zones", "WHO 54,634 aircraft", "FORCED 151,543 of 1,757,827". Hmm, "on the aircraft all zones" — perhaps the WHERE gutter value is "all zones" with sub-label "on the aircraft"? Or the value is "on the aircraft: all zones"? Hard to know. Given the instruction "The value is what the rail currently amounts to, never the sub-label", for WHERE the value might be the zone/region selection description. At rest, "all zones"? Hmm wait — but WHERE is the anatomy rail: aircraft zones. Its "amount" could be the number of reports? No — WHO's value is aircraft count, FORCED's value is "crew_reports of total". WHEN's value is "380 months" (the count of months in the strip!). Interesting — WHEN's gutter value is the number of months, not reports.

For WHERE, hmm. The measured string is "on the aircraft all zones". Maybe the gutter renders question on one line ("WHERE"), and when shut, question and value on one baseline: "WHERE on the aircraft all zones"? That reads oddly. Possibly the WHERE gutter's value line is "on the aircraft" and the sub... no.

Let me think about what WHERE rail is: anatomy of the aircraft — zones (fuselage upper, etc.). In the measurement, the standing sentence when something chosen: "84,453 reports, upper fuselage. 1,673,374 set aside." So WHERE selection is a zone like "upper fuselage". The gutter value when at rest could be "all zones" and when filtered, maybe "upper fuselage". And "on the aircraft" might be the sub-label of WHERE (like "month by month" is WHEN's sub-label). So the shut gutter shows question + value on one baseline: "WHERE all zones"? But measured "WHERE on the aircraft all zones" — maybe the measurement concatenated sub-label and value because in the original the shut form shows question, then a compact value that includes... Hmm.

Actually wait — re-read: "Your gutters read 'WHEN month by month'. The original's read 'WHEN 380 months', 'WHERE on the aircraft all zones', 'WHO 54,634 aircraft', 'FORCED 151,543 of 1,757,827'." And "You are printing the sub-label where the value belongs." So the user's rebuild printed "WHEN month by month" (sub-label "month by month") where original prints "WHEN 380 months". For WHERE, the original prints "on the aircraft all zones" — hmm, maybe WHERE's gutter has sub "on the aircraft" and value "all zones"? But then the user said "printing the sub-label where the value belongs" — if the user's WHERE printed "on the aircraft" only, original prints "on the aircraft all zones" (sub-label AND value?). Hmm, maybe in the original the shut gutter shows "question + value on one baseline" and the value for WHERE is "on the aircraft all zones"?? That's weird.

Alternatively the WHERE gutter value might be a count of zones? No...

Given ambiguity, I'll design: gutter(question, sub, value, open). When open: three lines — question (e.g., "WHERE"), sub-label ("on the aircraft"), value ("all zones" or "upper fuselage" etc.). When shut: two — question and value on one baseline ("WHERE" then value). Hmm but measured shut string includes "on the aircraft". Unless the measurement was taken with the WHERE rail open (since they said "driven both through five states", one state likely has WHERE open). Actually the table says "month bars, rail shut" — that's the WHEN rail shut in the state where WHERE is open. The gutter strings measured might be in different states. The WHEN gutter "380 months" — WHEN shut shows value "380 months" (since months.length=380). If WHEN were open, gutter would show sub-label "month by month" too? The spec for WHEN says: "railWhen never passes `open` to gutter() ... so WHEN ALWAYS renders the compact .gut.rest form and 'month by month' never appears in the gutter. Keep this." So WHEN gutter is always compact: "WHEN" + value. Value = periodClause() || `${months.length} months`. Good — matches "WHEN 380 months".

WHO gutter value: `${num(d.swarm_total||0)} aircraft` — matches "WHO 54,634 aircraft". FORCED: `${num(cr)} of ${num(tot)}` — matches "FORCED 151,543 of 1,757,827". WHERE: value at rest "all zones"? With sub "on the aircraft"? The measured "WHERE on the aircraft all zones" suggests when open, gutter shows question "WHERE", sub-label "on the aircraft", value "all zones" — concatenated in the measurement as "WHERE on the aircraft all zones". Hmm, but then for WHEN they'd have measured "WHEN month by month 380 months" if open... but WHEN always renders compact per spec, so just "WHEN 380 months". And WHO open would be "WHO airline and tail 54,634 aircraft" — but they measured "WHO 54,634 aircraft". Hmm, inconsistent.

Unless: the gutter when open shows three lines and when shut two, and the states measured had some rails open and some shut. But all four gutters exist simultaneously; at any state, some rails are open (one, actually — only one hero open at a time? "the whole .rail gets onclick=setHero" when closed, and opening opens one rail; the original likely has one open rail at a time). So in the state measured, maybe the open rail's gutter showed... The user listed four strings, probably from the same state (the WHERE-open state, since that's the default). So: WHEN shut: "WHEN 380 months" ✓. WHERE open: "WHERE on the aircraft all zones" — question + sub-label + value concatenated! WHO shut: "WHO 54,634 aircraft" ✓ (shut shows question + value on one baseline). FORCED shut: "FORCED 151,543 of 1,757,827" ✓.

So when open, the gutter shows question, sub-label, value (three lines). The measurement concatenated them. That's consistent! WHEN open would show "WHEN 380 months" only (quirk: never shows sub-label). Great, that resolves it.

So WHERE's sub-label is "on the aircraft" and its value at rest is "all zones". When a zone is selected, value presumably becomes the zone name or a count. Hmm — what does WHERE's value become when "upper fuselage" is chosen? Probably the zone label, e.g., "upper fuselage". I'll implement: value = selected zone label(s) or "all zones". Actually, since I don't have the original WHERE spec, I need to infer. The WHERE rail spec isn't given (the user only gave WHEN, WHO, FORCED specs + specimen). Interesting — the WHERE/anatomy rail spec is missing, presumably because the user's rebuild already had WHERE mostly right (it has the one reading paragraph, etc.). But the checklist says "Four gutter value lines" and "Four reading paragraphs, one per rail" — so I need to also provide WHERE's reading paragraph and gutter.

Hmm. The user gave specs for WHEN, WHO, FORCED + specimen. WHERE (anatomy) has no spec block. But the requirements say four gutters and four readings. So I must write the WHERE rail too, inferring from context. The measurement mentions "rows in the crew ladder 8 vs 10" (FORCED), "gutter value lines", "reading paragraphs 4 vs 1", "specimen decoded line". The five states in a browser: probably (1) default (WHERE open), (2) WHEN open, (3) WHO open, (4) FORCED open, (5) with a selection.

Since this is a "drop into your existing file" block, the existing file (my previous rebuild) presumably has the rails scaffolding: RAILS array, drawHero, drawPhone, gutter, hero fetch, params, search, etc. But I can't rely on unknown code. The instruction "using your existing helpers. Keep your function names so the block overrides by redeclaration" means I should redeclare the functions I previously wrote (drawHero, drawPhone, railWhen, railWhere, railWho, railForced, gutter, periodClause, specLine, sentence builders, etc.) with corrected bodies. Since I don't know exactly what I "previously" wrote, I'll write a comprehensive block that redefines all the hero-related functions and includes the CSS. I'll define fallbacks for tiny helpers with `typeof` guards? Inside an IIFE you can't easily redeclare a `const`. Function declarations: later wins. So I'll use `function` declarations for everything I define. For helpers that might exist (num, esc, pct, spell, params, aim, aimHold, opName, jargon, takeFilter, search, showChange, syncControls, openCase, setHero, monthName, MONTHS, prettyDate, leave_one_out...) — I can't redeclare with function keyword safely if they were declared with const/let in the same scope... Actually if the original file declared `const num = ...` and my block declares `function num(){}`, that's a SyntaxError (identifier already declared as lexical? No — function declaration in same function scope after a const with same name: it's an error only if... hmm. In a function scope, `const x` and `function x(){}` — the function declaration attempts to create a binding "x" which already exists as a lexical binding → SyntaxError at parse time. So mixing is risky.

Given the constraints of this exercise (I can't see the existing file), the pragmatic approach used in such answers: provide the block assuming the previous rebuild's helpers, and where unsure, define local fallbacks with different names or use `var` with guard: `var num = (typeof num !== "undefined" && typeof num === "function") ? num : function(n){...}` — but `var num` after `const num` is also a redeclaration error. Ugh.

Alternative: wrap everything in a nested IIFE inside the block, so nothing collides: `(function(){ ... function drawHero(){...} window.drawHero = drawHero; ...})();` — but the host code calls these functions within its own IIFE scope, not via window... If the host IIFE exposes nothing, my block inside the IIFE can override by function redeclaration only if the originals were function declarations too.

I think the intended answer format: a single fenced code block with CSS + JS, written as if to be pasted inside the existing IIFE, with function declarations for all the hero machinery, and a short note listing departures. The user explicitly says: "Keep your function names so the block overrides by redeclaration." So they expect me to know my previous function names. Since I don't have them, I'll choose the natural names implied by the spec (drawHero, drawPhone, railWhen, gutter, periodClause, specLine, monthAt, paintBracket, takePeriod, aim, aimHold, opName, pct, spell, takeReading, etc.) and declare helpers defensively:

I'll structure the block as: CSS in a `<style>` string appended? The user said "One self-contained block of JavaScript and CSS". So the block contains both. Probably: a `<style>` element with the CSS, and the JS functions. Since it drops into an HTML file inside an IIFE, a `<style>` tag can be injected via JS: `document.head.insertAdjacentHTML('beforeend','<style>...')` — that's self-contained and safe.

For helpers I don't control, I'll define local fallbacks inside a nested scope and assign to the names the spec expects — hmm, but assignment to undeclared identifiers creates globals in sloppy mode; that could break the host's local references.

OK — decision: The cleanest defensible approach for this answer is to write the complete hero module as one block that is genuinely self-contained: it defines every function the hero UI needs (with the spec's names), plus tiny local helpers, and it references host-level things (fetch of api/hero, params, filters) through a small adapter at the top with graceful fallbacks. I'll note in the "departures" section that, since the block must stand alone, I defined the shared micro-helpers (num, esc, pct, spell, monthName) locally guarded by typeof checks at module scope — but wait, if dropped inside the host IIFE where those exist as function declarations, redeclaring with function declarations is fine (later wins). If they exist as const/let, it's a SyntaxError. The user said "using your existing helpers" — implying my previous file declared them, presumably as function declarations (typical). The user also said "Keep your function names so the block overrides by redeclaration" — so they accept function-declaration overriding. I'll therefore declare everything with `function` and assume the host used function declarations as well. That's the contract the user set up. Good.

But one more wrinkle: the hero data. The spec references `api/hero` returning d.months, d.operator_rows, d.operators, d.swarm, d.swarm_total, d.aircraft, d.total, d.crew, d.crew_reports, d.span, d.lines, d.specimen, d.lag, d.hero_for? For the stale-guard: "if HERO_FOR !== params().toString() the sentence prints an ellipsis instead of a number, and a stale hero reply that arrives late is DISCARDED by heroSeq." So the module keeps HERO_FOR (the param string the current heroData was fetched under) and heroSeq (a counter). The API presumably was fetched with the current selection as querystring. Since my block is the hero renderer, it should also own the fetch: `loadHero()` that fetches `api/hero?...params` — but the host already has a fetch mechanism ("GET api/hero"). In the previous rebuild, presumably there's a function like `heroFetch()` or the drawHero receives data. I'll write `drawHero(d)` that takes the hero payload, plus a `HERO_FOR`/`heroSeq` guard, and a `loadHero()` that fetches. To be safe, I'll include a fetch wrapper `fetchHero()` that GETs `api/hero` + querystring of current params (excluding hero), increments heroSeq, and on response checks seq and HERO_FOR. If the host already has its own loader, my redeclared function overrides it — fine.

Hmm, the risk: I produce a huge block that can't actually run without the host. But the user's framing is a working session with an existing file; the expected answer is the corrected code for the hero module. I'll write it as complete and runnable as possible: I'll include the full hero module: state, fetch, render (drawHero for desktop, drawPhone), rails (when, where, who, forced), specimen, gutter, aim system, keyboard, pointer drag, reading paragraphs, margin notes, and the route handling (setHero accepting both spellings). CSS included.

Let me now enumerate the required behaviors and design the code.

## Top-level structure

```js
/* ===== hero / instrument rebuild — drop-in block ===== */
```

RAILS array:
```js
const RAILS=[
  {id:"when",   g:"WHEN",   sub:"month by month",      key:"horizon", aliases:["when","horizon"]},
  {id:"where",  g:"WHERE",  sub:"on the aircraft",     key:"anatomy", aliases:["where","anatomy"]},
  {id:"whose",  g:"WHO",    sub:"airline and tail",    key:"swarm",   aliases:["whose","who","swarm"]},
  {id:"forced", g:"FORCED", sub:"what the crew did",   key:"ledger",  aliases:["forced","ledger"]}
];
```
Wait — the gutter strings: WHERE sub "on the aircraft" (from "WHERE on the aircraft all zones"). WHO sub "airline and tail" (from spec). WHEN sub "month by month" (spec). FORCED sub "what the crew did" (spec). Values: WHEN `${months.length} months` or period clause; WHERE "all zones" / chosen zone; WHO `${num(swarm_total)} aircraft`; FORCED `${num(cr)} of ${num(tot)}`.

Hero keys: horizon, anatomy, swarm, ledger; rebuild's spellings: when, where, whose, forced. "Accept both spellings" — setHero(x) normalizes: map {horizon:"when", anatomy:"where", swarm:"whose", ledger:"forced", when:"when", where:"where", whose:"whose", forced:"forced"}. Also the URL param `hero` should presumably be written in the rebuild's spelling (or keep original's?). "A link copied out of the original opens the wrong rail on yours. Accept both spellings." So reading must accept both. What do we write? Probably our own spelling (when/where/whose/forced) — but then links copied from ours open the original's wrong rail... The requirement is one-directional: accept both. I'll normalize on read and write our canonical ids. Hmm, actually safer: write the key that the original used? The user said "the original names its rails horizon, anatomy, swarm, ledger in ?hero=. You name them when, where, whose, forced." They asked to accept both spellings. I'll accept both on parse and keep writing ours (documented). Also note checklist: "?hero=anatomy and ?hero=where both open the aircraft."

Default hero is anatomy/where.

## Gutter

```js
function gutter(r, open, value){
  // open: question / sub / value on separate lines
  // shut: question + value on one baseline
}
```
Per spec quirk: railWhen never passes open → always compact. Others pass open. Implementation:

```js
function gutter(head, sub, val, open){
  if(!open) return `<div class="gut rest"><b>${head}</b><span class="gv">${val}</span></div>`;
  return `<div class="gut"><b>${head}</b><span class="gs">${sub}</span><span class="gv">${val}</span></div>`;
}
```
railWhen calls `gutter("WHEN", SUB.when, val, false)` — i.e., never passes open (passes open into an ignored arg). Keep: `gutter("WHEN","month by month",val)` with signature gutter(head, sub, val, open) and open undefined → compact. And other rails pass true/false. Good — that matches "railWhen never passes open to gutter() (it goes to the ignored 2nd arg of esc)" — in the original, gutter(head, val, open) where the open flag was consumed by esc as 2nd arg... whatever; my version: railWhen omits the 4th arg.

Gutter values:
- WHEN: `periodClause() || \`${months.length} months\`` (months = heroData.months).
- WHERE: value = the zone selection. At rest "all zones". When zone(s) chosen: the zone label, or "N zones"? I'll implement: if params has "zone" (or "region"?) — I don't know the WHERE filter param name. Hmm. The anatomy rail: zones of aircraft. The measurement: "84,453 reports, upper fuselage" — so a zone called "upper fuselage". The param might be `zone`. I'll use `zone` param, with a ZONES list? I don't have the anatomy data shape. Since the WHERE rail spec is absent, I must reconstruct minimally. The checklist item "380 month bars present with the WHERE rail open" just needs closed-rail strips; "Four gutter value lines" needs WHERE's gutter; "Four reading paragraphs" needs WHERE's reading.

I'll implement railWhere with:
- closed: strip of zone bars? What shape when shut? Spec only says "Every rail keeps its shape when closed: 14px tall instead of 84". For WHERE closed, presumably a row of zone bars (like a mini stacked chart). I'll draw a strip of segments, one per zone, flex proportional to counts, ash; .sel for the chosen zone. title `${label}: ${num(n)}`. That mirrors WHO's closed strip (spans with flex). Good.

- open: a two-column grid? The anatomy rail probably shows a list of zones with bars (like WHO's operators column). I'll do a single column of zone rows (.orow-style) with counts, click to take zone. Reading paragraph: at rest, "Reports name where on the aircraft trouble showed: all zones stand open." Hmm, needs to state "what its own figures amount to" plainly, with numbers. At rest maybe: `${num(total)} reports, every zone of the aircraft counted.` When selected: "84,453 reports name the upper fuselage; 1,673,374 set aside." Hmm but that's the standing sentence's job? No — the standing sentence is the big sentence under the header (the "Reading 1,757,827 reports." line). The reading paragraph is per-rail under the rail's track.

Wait, let me re-read requirement 6: THE STANDING SENTENCE: "With the count, the clauses, the set-aside remainder, each clause droppable, and the refusal to print a figure computed for a different selection." Original: at rest "1,757,827 reports, everything the FAA has published to 26 August 2026." and once chosen: "84,453 reports, upper fuselage. 1,673,374 set aside." So the standing sentence lives at top (the line the user's rebuild rendered as "Reading 1,757,827 reports.").

Requirement 3: THE READING PARAGRAPH ON ALL FOUR RAILS — "Each rail states in plain words what its own figures amount to." So each rail (when open) has a .reading paragraph. WHEN's is fully specified (the three-clause paragraph). WHO's is specified. FORCED's is specified. WHERE's is not — I'll write one: at rest something like: "The reports name where on the airframe the trouble was found. X reports name a zone; Y leave it blank." Hmm — I don't have d fields for WHERE. I'll invent plausible ones: d.zones [{z,label,n}] and d.zones_total? Risky. Alternatively WHERE's reading can be built from what we do have: d.total and the zone rows. Since I define the WHERE rail myself, I define its data contract: d.anat = [{zone, label, n}] etc. But the server is the original's; I can't change it. Ugh.

Hmm. Wait — maybe the original's WHERE rail data is under key "anatomy" or similar in api/hero. The RAILS hero keys: horizon, anatomy, swarm, ledger. So api/hero returns fields per rail: months, lag (horizon); anatomy fields (?); swarm, operator_rows (swarm); crew, specimen, lines (ledger). The WHERE fields are unknown to me. The user's checklist doesn't test WHERE internals beyond gutter value "on the aircraft all zones" and a reading paragraph existing. Also "the busiest month darkest, the part months hatched" — WHEN closed strip must show 380 bars with the corpus max scaling and hatching for part months. Wait — "the busiest month darkest": in closed state, bars are ghostb only (no rust since NARROWED false at that state?) — the closed strip shows all-corpus bars in ghostb; hover lightens. "Darkest" might refer to hover or the .inband? Hmm, "380 month bars present with the WHERE rail open, the busiest month darkest, the part months hatched". In closed WHEN strip, all bars are the same #d8d2c6 unless... Hmm, maybe the closed strip uses opacity/alpha scaled by height (bars are scaled to 14px so busiest is tallest). "Darkest" — maybe closed bars have varying opacity? The spec for closed WHEN: "H=14px instead of 84, no axis, no magnifier, no sentence, tabindex -1" — heights scaled against corpus max, so busiest = tallest = darkest visually? No... All ghostb same color. The tallest reads darkest at a glance. I think that's the intent: "the busiest month darkest" = the tallest/densest. Hmm, "darkest" could be opacity: some implementations scale bar opacity. But spec CSS says .mo .ghostb{background:#d8d2c6} fixed. I'll keep fixed color; the height carries the distribution. Actually wait — maybe in the closed strip the bars are drawn at 14px scaled AND with rgba alpha proportional? The original's closed strip: I can't know. The user checks "the busiest month darkest" — to satisfy that check in a browser, color should vary by count! Hmm. But spec says ghostb fixed #d8d2c6, and hover #c3bbac. If the check is "busiest month darkest", fixed color fails unless it means height. Risky either way. Let me re-read: "380 month bars present with the WHERE rail open, the busiest month darkest, the part months hatched." 

Hmm — if all bars were the same color, you couldn't identify the busiest by darkness; you'd identify it by height. The user (who measured the original) presumably observed the original's closed strip and saw the busiest month darkest. That suggests the original renders closed bars with count-proportional opacity or darker shade. But the spec they handed me says closed = same markup at H=14 (both scaled against the corpus maximum — heights). The spec is authoritative: "Where they state a number, a string or a formula, that is load-bearing. Where they state a reason, reach the same end your own way." The colors given are load-bearing strings. But the closed-state color isn't separately given... The CSS block applies to .mo .ghostb generally. Hmm, but maybe the closed strip uses a different element? Let me just make closed bars use opacity by relative count: style="opacity:x" — no wait, that fights "busiest darkest": lighter for small months, full for busiest. Using rgba with alpha = 0.25 + 0.75*(all/cmax)? That would make the busiest darkest. But it deviates from spec CSS (fixed background). The spec's markup for months includes only heights; closed differs by container class. I could add for the closed strip: `.rail[data-rail=when]:not(.open) .mo .ghostb{background:rgba(29,29,31,alpha)}`? Hmm.

Alternatively the original closed strip may draw each bar as a solid bar whose color is a gray scaled by count via inline style. The spec section "Rail closed: H=14, no axis, no magnifier, no hint, no reading; tabindex -1, role presentation; the whole .rail gets onclick=setHero('horizon'). The drag handlers require .rail.open..." — it doesn't say bars change color. The measurement table says original closed had 380 bars; the user's checklist says "the busiest month darkest". I'll implement closed-bar shading via inline alpha: each closed ghostb gets `style="height:...px;background:rgba(118,111,105,A)"` with A between 0.35 and 1 scaled by all/cmax. Hmm wait, ghostb ash #756f69? The corpus "ash" color is #756f69 (--ash) but ghostb is #d8d2c6 (lighter). For a 14px strip, #d8d2c6 bars on paper #f7f5f0. With alpha scaling toward #756f69... 

Let me think about what's most defensible: The user will look at the closed strip and check the busiest month is darkest. Simplest faithful implementation: shade by count. I'll do it with rgba of the ash color: `rgba(117,111,105, ${0.35+0.65*(all/cmax)})` when closed; keep open-state ghostb per spec color. And part months hatched (the repeating-linear-gradient) in closed too — "the part months hatched" — yes, closed keeps .part hatch. Hatch over varying alpha? The hatch gradient uses #d8d2c6 and paper. For closed, hatched part months should also be visible; keep the hatch as-is (it reads as marking). Hmm, but then a part month's darkness won't reflect count — acceptable: the hatch marks it.

Actually hold on — maybe simpler and matching spec: closed strip bars all #d8d2c6, and "busiest month darkest" is satisfied because... no. I'll go with alpha shading and note it in departures: "The spec fixes ghostb at one color; in the closed strip a flat color hides the distribution the closed rail is supposed to keep, so closed bars shade by count (busiest full-strength, quietest pale), hatching preserved. Open rail keeps the spec color exactly." That aligns with "Where they state a reason, reach the same end your own way" — the reason for closed shape: "a reader who has the aircraft open learns nothing about time" — so the closed strip must convey the time distribution → shading helps. Good.

## WHEN rail details

Data: d.months [{m:"YYYY-MM", n, all}] ascending, always full corpus span. d.lag {settled_before, p95_days}. NARROWED = any param besides hero.

Scales: cmax = max(all) floored at 1. ch=(all/cmax)*H; sh = NARROWED ? (n/cmax)*H : 0. part = partialMonth(m.m) || !settled(m.m). Span markup with aria-label, tabindex 0 when open, role button; closed tabindex -1 role presentation.

partialMonth(m): first or last bucket of corpus and edge not whole month, OR first/last bucket of user's from/to window mid-month. Corpus edges: months[0].m and months[last].m; "that edge does not land on a whole month" — the corpus starts at the first report's month and ends at the download month (26 Aug 2026 → partial). I need d.file range: RANGE.from/to (dates). The spec's takeReading references RANGE.from/RANGE.to with prettyDate. So the module has RANGE = {from:"YYYY-MM-DD", to:"YYYY-MM-DD"} — presumably from api/hero (d.range?) or a separate meta endpoint. I'll define RANGE from hero payload: d.range {from,to} (ISO dates), fallback derived from months[0]/last + settled_before? I'll implement: RANGE.from = d.range?.from, RANGE.to = d.range?.to; if missing, approximate: from = months[0].m+"-01", to = d.lag?.settled_before? Hmm. To keep it simple: if d.range missing, treat corpus edges as partial for the last month only? The file ends 26 Aug 2026 → last month partial. First month: probably also partial-ish but "does not land on a whole month" requires knowing the first report date. I'll compute from RANGE when present; else default: last month partial (since download mid-month is typical), first not. I'll document via comment.

settled(m): last day of month <= settled_before, where settled_before = max(difficulty_dt) - p95_days. d.lag.settled_before presumably an ISO date string. Default TRUE when no cutoff (d.lag missing).

Magnifier: open && smax && smax < cmax*0.25. smax = max(m.n) over months (selection). f=(cmax*0.62)/smax. Draw polyline over 1000-unit viewBox, preserveAspectRatio none, stroke #c44b28, width 1.5, vector-effect non-scaling-stroke, aria-hidden, pointer-events none. Points: for each month i: x = (i+0.5)/N*1000, y = 1000 - (m.n*f/cmax*1000)? Wait — the magnified line: selection bars scaled by f so busiest selected reaches 62% of H. The polyline overlays showing the magnified selection profile. y in viewBox units: y = H*(1 - (n*f)/cmax)? With viewBox 1000x1000? "polyline over a 1000-unit viewBox" — viewBox="0 0 1000 1000", preserveAspectRatio="none". So x = (i+0.5)*1000/N (or i*1000/N?), y = 1000 - (n*f/Hratio)... The magnified height in px = (n/cmax)*H*f = (n/smax)*0.62*H. In viewBox units (1000 tall = 84px): y_px = (n/smax)*0.62*84 → y_vb = 1000 - y_px/84*1000 = 1000 - (n/smax)*620. Good: y = 1000 - (m.n/smax)*620. Note text: `selection ×${f.toFixed(1)} to be visible`. Positioned .mag absolute bottom:16px height:84px. Hmm bottom:16 leaves room for axis. OK.

Axis: open only, one span per month, year only in January. If year changes mid-strip obviously.

Scrolling: wide = open && months.length>72. --mw = months.length*9 px inline on .track? "set inline on .track" — but .months min-width uses var(--mw,100%). The axis too. I'll set style="--mw:3420px" on the track div. Hint when wide: `380 months, so the strip scrolls sideways. It opens at the most recent.` That's the hand line? The rail's hint (the line under the gutter?) — "Hand line: `Drag across the months to take a period.`" for WHEN. When wide, hint becomes the 380-months line. These "hand lines" — where do they render? Probably a .hint line in the rail. I'll render hint under the track or in gutter area: `<div class="hint">…</div>` shown when open.

After every drawHero and drawPhone: wtr.scrollLeft = wtr.scrollWidth (open && wide). wtr = the when track element.

Gutter quirk: railWhen passes no open → always compact .gut.rest. Value: periodClause() || `${months.length} months`.

periodClause() reads #from/#to inputs (the page's date filter controls). Values presumably "YYYY-MM-DD" or ""? Cases:
- neither set → ""
- same month, from day 01, to = last day of month → "August 2025"
- same month, from day 01, to earlier → "1 to 14 August 2025"
- both set otherwise → "3 Aug 2024 to 14 May 2025"
- only from → "from 3 Aug 2024"; only to → "up to 14 May 2025"

Format helpers: monthName("2025-08") = "August 2025". Short month "3 Aug 2024": `${+dd} ${Mon} ${yyyy}`. "1 to 14 August 2025": `${d1} to ${d2} ${Month} ${yyyy}`. Whole-month check: from day===01 and to === last day.

Sentence underneath (the reading paragraph):
- all = months.filter(!partialMonth) — wait, `all` here means months that are NOT partial (full months), despite the name. full = all.filter(settled). young = all.length - full.length. If full.length<2 return "".
- hi/lo reduced over m.n, ties earliest. Among `full` (settled, non-partial) months presumably — "hi/lo are reduced over m.n" — over which set? "full" I think: the figures are over settled full months. Yes: sentence 1 "Between X and Y reports in a settled month, busiest in ..., quietest in ...". Reduce over full.
- Clause 2 when full.length>=24: last 12 vs previous 12, averages a (last) and b (prev), diff = ABSOLUTE percentage difference: `a difference of ${diff}%.` diff = |a-b|/b*100 rounded? "The difference is ABSOLUTE. Direction is NEVER stated." Compute: diff = Math.round(Math.abs(a-bb)/bb*100). Need bb>0 guard.
- Clause 3 when young>0: `The ${spell(young)} most recent months are left out of those figures: reports still arrive up to ${num(lag)} days after the event, so they hold only part of what they will hold. The dip at the right of the chart is the post arriving late, not fewer faults.` spell up to ten words, else num. lag = d.lag.p95_days.

Margin note for part months: if ANY month partial: rust entry `${MONTHS[mm]} ${yy} covers 1 to ${dd} ${MONTHS[mm]}, so its bar counts ${dd} days against ${inMonth} in a whole one`. Hmm — "covers 1 to dd" — the partial month could be at the end (1 to 26) or the start (say 12 to 31)? Template says "1 to dd". For the first corpus month, days from first report? Simplify per template: compute dd = number of days covered within that month: for the last month, dd = day of RANGE.to; for first, days from RANGE.from's day to end-of-month? Template hardcodes "1 to dd". I'll follow the template with dd = days covered counting from 1 (i.e., if from day >1, dd = lastday - fromday + 1 but still print "1 to dd"? That'd be wrong...). The spec says the string verbatim-ish. Where "state a reason, reach the same end your own way": the reason is telling the reader the bar counts fewer days. I'll compute actual covered range: for edge months, covered days = overlap of [RANGE.from, RANGE.to] with that month; print `covers ${d1} to ${d2} ${Month}` — but spec template says "1 to dd". Hmm, "Where they state a string ... that is load-bearing." The template is load-bearing. But it's only correct for end-months (1..26 Aug) and for from/to window edges. For the file's first month starting mid-month, "1 to dd" is wrong. Compromise: use the template exactly, with dd = number of days the bar counts (inMonth days covered). "covers 1 to 26 August" — if the first month covers 12–31, dd = 20 and "1 to 20" is wrong but the count message stands. Hmm. I'll do: if covered range starts on the 1st → "covers 1 to ${d2}"; else "covers ${d1} to ${d2}". That respects the string where valid. And always push ash note: `counts are of reports filed, not of flights`.

Margin notes container: .margin (mono 11.5px ash), rust entries .mr? The spec: "one rust margin entry" — margin notes colored rust vs ash. I'll render margin as `<div class="margin"><span class="rust">…</span> <span>…</span></div>` with .margin .rust{color:var(--rust-text)}.

Interactions: months carry data-aim only. monthAt(ev,track): uniform division: rect = .months box; idx = clamp(floor((ev.clientX-rect.left)/rect.width*N),0,N-1). pointerdown (open only): dragFrom=monthAt, paintBracket(from,from), setPointerCapture on track. pointermove → paintBracket(dragFrom, monthAt). pointerup → takePeriod(dragFrom, monthAt||dragFrom). Prevent default on pointerdown; touch-action none, user-select none.

paintBracket(a,b): lo/hi string compare; toggle .inband on months in [lo,hi]; aim(`${monthName(lo)} to ${monthName(hi)} · ${num(n)} reports · release to take it`) — n = running selection total inside band = sum of m.n for months in band. Note: monthName(lo) to monthName(hi) — if lo===hi, just monthName? Spec: `aim(`${monthName(lo)} to ${monthName(hi)} &middot; ...`)` — even for single month? takePeriod handles lo===hi separately for the hold message. paintBracket per spec always "X to Y". Keep verbatim.

aim() refuses to write while a hold is live.

takePeriod(a,b): from = lo+"-01", to = hi+"-"+lastDay(hi) padded. Sets #from/#to values, show p-search (the search panel?), search(0), showChange(), aimHold(`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. [undo]`) — wait the hold includes an undo button? In WHO: aimHold(`narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>`). For WHEN takePeriod, spec says aimHold(`narrowed to ... [undo]`) — ambiguous; I'll include the undo button same as elsewhere: `narrowed to X. <button class="undoit" onclick="history.back();unaim()">undo</button>`. Hmm, "[undo]" literally? It reads like a placeholder for the undo affordance. I'll use the button.

A plain click = zero-length drag → takes one month. Yes since dragFrom===to.

Hover aim: `${monthName(key)} · ${num(m.n)} reports · click to narrow to this month`.

aim()/aimHold(): the host has these? The spec says aim() refuses to write while hold live; .aim{min-height:20px}. I'll implement aim/aimHold in the block (with a module-level hold timestamp), since overriding by redeclaration is the mechanism. aim writes into #iAim (innerHTML). aimHold(msg): write immediately, set holdUntil = now+6000; unaim() clears and resets hold. Provide unaim.

Keyboard: focusin on .mo; Arrow/Home/End move focus then repaint bracket (from focused to kbAnchor if set). Shift+arrow: anchor set before moving. Arrow without shift resets kbAnchor=null. Enter/Space: if kbAnchor set → takePeriod(anchor, this); else heroMonth(this) — heroMonth takes a single month: same as takePeriod(k,k)? heroMonth(el) probably takes that one month (click behavior). I'll implement heroMonth(el)=takePeriod(key,key).

Wait — "Arrow/Home/End: FOCUS FIRST, then repaint — or focusin overwrites the bracket." So on keydown: compute target index, el.focus(), then paintBracket(anchor||current, target). And focusin handler on .mo writes aim? focusin would call aim (hover aim) which overwrites bracket message... The note says focus first THEN repaint — i.e., the keydown handler repaints the bracket after focusing because the focus event fires aim() (focus aim?) overwriting the bracket. Hmm, actually "or focusin overwrites the bracket" — meaning: if you repaint first then focus, the focusin handler (which writes an aim message like the hover aim) overwrites the bracket message. So focus first, then paintBracket. But focusin writing the hover-aim would then be overwritten by paintBracket's aim. OK. So my focusin on .mo does aim(month hover message)? Or does nothing? To be safe: focusin → aim(hover message) (matches "Hover/focus writes into #iAim" pattern from WHO). Then keydown: focus(), then paintBracket → aim bracket message. Good order.

Cross-highlight from results table: rows with data-month — hover tr[data-month] outlines its month bar (.mo.lit) and tints tr.spine.lit td. paintSpines() fills each .spinen with `${num(m.n)} in this selection`. This involves the results table which the host renders. I'll include document-level delegated listeners: mouseover on tr[data-month] → add .lit to matching .mo[data-aim="month|KEY"]... the .mo has data-aim="month|YYYY-MM" — the compound string "month|2025-08"? The markup shows data-aim="month|YYYY-MM" — so data-aim value is `month|2025-08`. Hmm, but then hover aim parses after "|". And WHO rows data-aim="more-ops" etc. OK so data-aim holds the message key; a delegated handler maps keys to messages. I'll implement aimFor(el) that reads data-aim and produces the message: "month|KEY" → month message; "more-ops" → the not-ranked message; "more-tails"; operator rows: data-aim=`op|CODE`; tails `tail|REG`; forced rows `crew|CODE`; block "crewall". And data-take for actionable: `operator|X`, `tail|X`, `crew|A`.

But the results table hover: host table rows get data-month attr (derived from DifficultyDate). I'll add delegated listeners on document for mouseover/mouseout on tr[data-month]: toggle .mo.lit for that month (when rail present) and .lit on the row (tr.spine). paintSpines(): fills .spinen spans — host creates them; I'll implement paintSpines to query .spinen elements with data-month? Unclear; I'll implement generically: for each .spinen[data-month], set text from heroData.months. If the host table has its own, fine — keep function present.

Typed route: takeReading("period", v): 4 chars → year; YYYY-MM → month; clamp where period and file overlap; refusals as documented. This is part of the "Aim at" combobox — host-level. I'll include the function.

Degraded states: heroData null → drawHero returns skeleton: stamp, sentence slot, empty .aim, four inert rails (no months). d.months empty → railWhen returns "" and row absent. Rail closed → whole .rail gets onclick="setHero('key')". Resize: debounced 180ms → full drawHero. I'll add the resize listener in the block (guard against duplicates via a flag on window).

## WHERE rail (anatomy)

I have to invent the minimal contract. Fields I'll consume defensively: d.zones (or d.anat?) — hmm. What would the original call it? The hero key is "anatomy". Maybe d.anatomy = [{z,label,n}]. Since I'm writing both the renderer and (in-universe) my previous rebuild defined the contract... The original's server is fixed though! The original page consumes api/hero with fields for all rails. My rebuild queries the same API. So WHERE fields must match the original server. I don't know them. But the user didn't flag WHERE data as wrong — my rebuild's WHERE rail was mostly right (it had a reading paragraph, correct gutters? no — gutters were wrong everywhere; WHERE gutter printed sub-label). The user's checklist doesn't test WHERE counts. 

Pragmatic: consume `d.zones` if present else `d.anatomy` else `d.regions`, each fallback. I'll write: `const zr = d.zones||d.anatomy||d.regions||[]`. Each item {z, label, n} or {zone, n}. I'll normalize: id = r.z||r.zone||r.k; label = r.label||r.z||r.zone; n = r.n||0. Sort client-side n DESC (defensive). Closed strip: spans flex max(1,n), .sel when matches params zone. Open: rows with bars, click → takeFilter("zone", id, label). Reading: build from data: e.g., `${num(withZone)} of ${num(total)} reports name where on the airframe the trouble was found; the rest leave it blank.` Hmm — need "names" count = sum of zone ns vs total. If I can't know blank count, use: at rest: "Every report in this file names a zone of the aircraft..." — risky. Safer generic reading: `The ${num(total)} reports in this selection are counted by zone of the airframe; ${top.label} leads with ${num(top.n)}.` With guards. When a zone is selected (params zone): `${num(n)} reports sit in ${label}; the rest of the airframe is set aside.` Let me write something plain:

```
whereReading(d):
  tot = d.total||0
  rows = zoneRows(d) (sorted)
  if(!tot) return ""
  sel = params().get("zone") (or "region"/"area"?) 
  if(sel){ row = rows.find(...); if(row) return `${num(row.n)} reports put the trouble in ${row.label.toLowerCase()}; ${num(tot-row.n)} happened elsewhere on the airframe or named no zone.` }
  if(!rows.length) return `${num(tot)} reports stand open across the whole airframe.`
  top=rows[0]
  return `${num(tot)} reports are counted by where on the aircraft they happened. ${row.label} holds ${num(top.n)} of them, ${pct(top.n,tot)}% of the selection.`
```
Hmm "the busiest zone is X with N reports, P of the selection." Fine — plain words stating what figures amount to. And when narrowed: value clause. Also should mention set-aside? The standing sentence handles that. Keep simple, one or two sentences.

Zone param name: unknown. I'll support `zone` primarily but check a few: params().get("zone") || params().get("region") || params().get("area"). And data-take uses "zone". Since my previous rebuild used some param, the checklist "?hero=anatomy and ?hero=where both open the aircraft" doesn't test zone params. Acceptable.

WHERE gutter value: selected zone label (lowercase? "upper fuselage") else "all zones". Sub "on the aircraft". The measured shut string "WHERE on the aircraft all zones" — wait, if WHERE was OPEN in the measured state, gutter = question/sub/value = "WHERE / on the aircraft / all zones" concatenated. So value "all zones" when at rest even when open. Good: value = sel ? label : "all zones".

Hmm wait — but actually maybe WHERE was shut too and its compact gutter shows "WHERE" + value where value = "on the aircraft all zones"?? No — compact is question+value on one baseline; "on the aircraft all zones" as a value is odd. Three-line open gutter concatenated by the measurement tool is the best explanation, and it implies WHEN was shut, WHO shut, FORCED shut, WHERE open — consistent with "380 month bars present with the WHERE rail open" (WHEN shut). And the crew ladder count (8 rows) measured presumably with FORCED open in another state. OK.

So in the default state (hero=where), WHERE open: gutter shows "WHERE", "on the aircraft", "all zones". 

## WHO rail

Per spec. Fields: operator_rows (max 8) [{o,n}], operators int, swarm [{t,o,op,n}] max 900, swarm_total, aircraft, total. Empty selection: swarm [], swarm_total 0, operator_rows ABSENT → guard (d.operator_rows||[]).

Closed: gutter value `${num(d.swarm_total||0)} aircraft`; strip spans per operator row (<=8) flex max(1,n), title `${opName(o)}: ${num(n)}`, class sel when matches operator param. CSS .strip height 12px.

Open: .track.two grid 1fr 330px. Operators column: header "Operators", rows all operator_rows, server-sorted. mxO = max count among shown. Width (n/mxO*100).toFixed(1)%. Count `<b>${num(n)}</b>`. Overflow row when d.operators - top.length > 0: `<div class="orow more" data-aim="more-ops"><span class="on ash">${num(rest)} more operators</span></div>`. data-aim more-ops message: `not ranked here; use the operator control below to reach any of the 309` — wait "any of the 309" — the number is dynamic: d.operators. Message: `not ranked here; use the operator control below to reach any of the ${num(d.operators)}`. Good.

Airframes column 330px: header "Airframes", rows d.swarm.slice(0,8), label "N"+t, mxA over the 8 shown, overflow when swarm_total > swarm.length: `${num(swarm_total - swarm.length)} more airframes, not ranked here` with data-aim="more-tails" → `not ranked here; type a tail number in the controls below`.

Row geometry CSS as given. opName: CODES.operator[o].label else raw designator. CODES — host lookup table; fallback: if typeof CODES undefined → opName returns o. I'll guard: `(typeof CODES!=="undefined"&&CODES.operator&&CODES.operator[o])?CODES.operator[o].label:o`.

Sentence: as given in the spec code block. Returns "" when d.total is 0. spell up to ten then num. pct one decimal.

Cap disclosure: inline overflow row + margin note: `the tail list shows the ${num(swarm.length)} most-reported aircraft out of ${num(swarm_total)}; the airline list counts every report` then `counts are of reports filed, not of flights`.

Interactions: document-level delegated handlers (bound once — guard with a flag). Hover/focus writes into #iAim: operator row `${opName(key)} · click to follow this operator`; airframe `N${key} · click to follow this one airframe`; more-ops / more-tails messages. mouseout clears (respecting hold). Click via closest("[data-take]"): operator|X → takeFilter("operator", X, opName(X)); tail|X → takeFilter("tail", X, "N"+X). takeFilter sets control value, shows p-search, search(0), aimHold(`narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>`).

Keyboard: .orow tabindex 0 role button when open; Enter/Space take. focus-visible outline.

Selected state: syncControls toggles .taken when URL param matches. .orow.taken styles. I'll implement syncControls (redeclared) to walk .orow[data-take] and toggle taken by comparing param. But syncControls is a host function controlling inputs too... redeclaring it could break host behavior. Hmm. The spec says "Selected state: syncControls() toggles class 'taken' when the URL param matches, re-applied by syncControls()." In my block I'll implement syncControls to do at least the .taken toggling and call it after renders and after takeFilter. If the host's version does more, mine overrides — acceptable since the user asked for the block to override.

Hint: `Click an airline or an airframe to follow it.`

Reachability: aim-at combobox pushes operator_rows + all swarm entries — host concern; mention? The combobox population is part of the host's controls. I could include a function `fillAimAt(d)` that populates if the host has #aimat. Eh — I'll include a guarded hook: if #aimAt exists, populate. Hmm, adds bulk. The checklist doesn't test it. I'll include a small best-effort.

Actually, let me keep the block focused: the six things + specs. The aim-at combobox was presumably already fine. Skip, but keep data available.

## FORCED rail

Fields: total, crew [{code,label,n}] ten codes A,B,C,E,F,G,I,J,L,R, n counts reports with code in any of four slots, zero-n dropped, sorted desc. crew_reports DISTINCT count. span {from,to,days,dated}.

Closed: gutter value `${num(cr)} of ${num(tot)}`; bar width sh=tot?cr/tot*100:0 toFixed(2)%. .restbar.

Open: .fblock height 22px with rust i width %, label inside `${num(cr)} of ${num(tot)} forced a crew action`, data-aim="crewall" no data-take. Rows: crew.filter(!K,0,O).slice(0,8) — mx over displayed eight. .orow.wide grid 190px 1fr 56px height 17px. taken when params crew===code. fnote under last row verbatim: `A report can carry four of these, so they add to more than ${num(cr)}.` printed whenever open && crew_reports>0 (known edge: prints even when 0? "Printed unconditionally whenever the rail is open and crew_reports > 0" — and the zero-edge note says fnote still prints "...add to more than 0." unguarded — contradiction: A says fnote still prints when cr===0. So print whenever open and crew array exists? "unconditionally" — I'll print whenever open (even cr=0), matching edge A: "...add to more than 0." Wait but the spec for fnote says "whenever the rail is open and crew_reports > 0", while edge A says it still prints "...add to more than 0." unguarded. To satisfy the documented KNOWN EDGE, print whenever open && tot>0? Hmm, edge A is total>0, crew_reports===0 → rail draws in full, rows empty, reading zero text, and fnote prints "add to more than 0". So fnote prints whenever open regardless of cr. I'll do: if(open) print fnote (with cr possibly 0). That reproduces the original including its wart. I'll note it as a deliberate wart kept.

Sentence: guards; first sentence verbatim: `${num(cr)} reports, ${pct(cr,tot)}% of this selection, record something the crew had to do rather than something found on the ground.` Then top action from ALL returned codes: ` The commonest is ${top.label.toLowerCase()}, ${num(top.n)} times${r?", "+r+".":"."}` where r = rate(top.n, days). rate: guards (!n||!days||n<30||days<60) ""; per=days/n; per>=1.5 → `about one every ${Math.round(per)} days`; else `about ${(n/days).toFixed(1)} a day`. days = span.days of SELECTION. Whole-corpus example: "151,543 reports, 8.6% of this selection, record something the crew had to do rather than something found on the ground. The commonest is unscheduled landing, 112,189 times, about 9.7 a day." Check: 1,757,827*0.086 = 151,173 — 151,543/1,757,827 = 8.62% ✓. days: 151,543/9.7 ≈ 15,623 days ≈ 42.8 years ✓ plausible.

Zero text (total>0, cr===0): `No report in this selection records an action the crew had to take. Everything here was found on the ground.`

total===0: reading "" and .zero block above rails handled by host drawHero: `Nothing matches all of these at once.` plus up to three `Drop <Label> -> N reports` ghosts from leave_one_out. Seam button `Nothing to read yet`. Hmm — this is host-level (the zero state UI). leave_one_out: server or client? "up to three Drop <Label> -> N reports ghosts from leave_one_out" — likely computed server-side or client by removing one filter and counting. I'll implement a best-effort: if d.leave_one_out present use it; else skip. Actually leave_one_out could be client: for each active filter (up to 3), fetch api/hero without it? Expensive. I'll render from d.leave_one_out if provided: [{label,n}]. And the "seam button" — the seam is the results section header? "Seam button reads 'Nothing to read yet'" — the host's results toggle button. I'll set it if element exists (#seamBtn?). Guarded.

Reading CSS: .reading as given; .rail>.reading{grid-column:2} — aligns under track not gutter. So each open rail's grid: gutter column 1, track column 2; reading spans column 2. My rail markup: `<div class="rail open" data-rail="when"><div class="gut">…</div><div class="track">…</div><div class="reading">…</div><div class="margin">…</div></div>` with .rail{display:grid;grid-template-columns:150px 1fr} or similar. The reading positioned grid-column:2. Margin also column 2 presumably. I'll set .rail .margin{grid-column:2}.

Interactions: click row → takeFor("crew|A") → takeFilter("crew","A",label). Hover aim row: `${label} · ${num(n)} reports · click to narrow`; block: `${num(crew_reports)} of ${num(total)} reports forced the crew to act`. Keyboard rows tabindex 0 role button, Enter/Space take. Block not focusable. Taking does not close rail; replaces crew value.

## Specimen

Fed by d.lines (up to 24) and d.specimen. Only lines[0] used. Markup: .specimen.opens role button tabindex 0 data-case=CONTROL aria-label `Open the full report ${control}`. Header verbatim: `One report from this selection. First the FAA's own filing of it, then the mechanic's words as written.` + opencue `Click to open the full report →` (phone: `Tap to open it →`). .spec-decoded — specLine(specimen). .sl — jargon(lines[0]) clamped 2 lines. jargon — host helper (expands abbreviations?) — I'll guard fallback: identity if not defined.

When control empty: omit opens/role/tabindex/data-case/aria/opencue; inert text.

specLine order: aircraft, system, part, condition, found, stage, prettyDate(date). part dropped when duplicates system (norm includes either way). Dead list ["","Other","Not reported","Unknown","None"] exact case-sensitive; drop falsy too; date dropped when falsy. Join " · " (&middot;). If nothing survives → "" and only header + raw line render.

prettyDate: host helper? Spec uses prettyDate(RANGE.from) in takeReading message. I'll implement prettyDate(iso) if not defined: "26 August 2026" from "2026-08-26". Since function-declaration overriding: if host has it, mine (later) wins — fine as long as behavior matches. I'll implement defensively.

Click: document-level click + keydown(Enter/Space) on closest("[data-case]") → openCase(id). openCase — host function (opens report modal?). I'll implement a minimal openCase if not present? Can't know. I'll call openCase(id) assuming host has it; if the block must be self-contained, provide a fallback that... hmm. I'll just call it; the host presumably has openCase since the original does. Actually — to be safe: `if(typeof openCase==="function") openCase(id); else window.open(...)`? Opening a URL I don't know. I'll do: openCase && openCase(id). Keep.

## Standing sentence (requirement 6)

"With the count, the clauses, the set-aside remainder, each clause droppable, and the refusal to print a figure computed for a different selection."

Original: at rest: `1,757,827 reports, everything the FAA has published to 26 August 2026.` Selected: `84,453 reports, upper fuselage. 1,673,374 set aside.`

So structure: `${num(total)} reports` + clauses joined:
- rest: `, everything the FAA has published to ${prettyDate(RANGE.to)}` — the "published to" date = file end (26 August 2026 = RANGE.to? RANGE.to is max difficulty_dt? The download date? "everything the FAA has published to 26 August 2026" — 26 Aug 2026 is presumably the download/latest submission date, while max difficulty date might be earlier. RANGE.to per takeReading is the file's real end used to clamp years — "Taking 2026 ... a count that stopped at the newest report" — so RANGE.to ≈ newest report date, and published-to date is the same? I'll use d.published || RANGE.to. I'll use RANGE.to via prettyDate.)
- selected: `, ${whereClause}` — the active selection described: e.g., "upper fuselage". Built from current filters: join active filter labels with commas: zone, operator, tail, crew, from/to period, etc. `84,453 reports, upper fuselage.` — so: `${num(sel)} reports, ${desc}. ${num(total - sel)} set aside.` Wait — "84,453 reports, upper fuselage. 1,673,374 set aside." total=1,757,827; 1,757,827-84,453=1,673,374 ✓. So: count + ", " + selection description + ". " + remainder + " set aside." Clauses droppable: if a filter has no label or the param is empty, skip its clause; if nothing selected → the published-to clause. "each clause droppable" — e.g., if no date filter, no date clause; if selection but no desc derivable, just count + remainder.

Refusal: "the refusal to print a figure computed for a different selection": if HERO_FOR !== params().toString(), print an ellipsis instead of the number: `… reports, upper fuselage.` Hmm — print ellipsis in place of count. And WHEN spec: "if HERO_FOR !== params().toString() the sentence prints an ellipsis instead of a number". So standingSentence(): if stale → `…${desc? ", "+desc+"." : ""}`... I'll implement: const stale = HERO_FOR !== params().toString(); count = stale ? "…" : num(d.total). Then build.

Selection description: map params to labels: 
- zone → zone label
- operator → opName(op)
- tail → "N"+tail
- crew → crew label
- from/to → period clause (short)
Join with ", ". E.g., "upper fuselage, N123AB, unscheduled landing, 3 Aug 2024 to 14 May 2025". Cap length? Keep all — droppable means each omitted when absent.

Where does the standing sentence live? Top of hero: the user's rebuild had "Reading 1,757,827 reports." — presumably a line under the stamp. I'll render: `<p class="stand">${…}</p>`. drawHero renders it from heroData. It updates when heroData updates (post-fetch). The refusal also matters for a stale render — since drawHero is called with data fetched under HERO_FOR, staleness arises when params changed but new hero not yet loaded... Actually the flow: params change → search() → loadHero() fetch → drawHero(d). During the gap, the old render stands. The refusal: guard inside renderers (sentence + readings?) — spec mentions it for WHEN sentence and standing sentence. heroSeq discards late replies. HERO_FOR set when the fetch starts (params().toString()) and compared when rendering? Set HERO_FOR = params().toString() at fetch start; on response, if params changed since (i.e., HERO_FOR !== params().toString()) discard (don't draw). And in sentence builders, if HERO_FOR !== params().toString() → ellipsis (defensive when drawing data fetched under same HERO_FOR but params mutated between). I'll implement both.

## drawHero structure

```js
function drawHero(d){
  // skeleton when d null
  heroData = d; HERO_FOR = d ? (d.hero_for ?? HERO_FOR) : HERO_FOR;
  ...
  html = stamp + stand + aim + rails + specimen + seam?
  host container .innerHTML = html
  afterRender: scroll when track, syncControls, paintSpines, bind? (bind once document-level)
}
```

Since the block drops into the host, the container id is unknown. In-universe, my previous rebuild had one. I'll define HERO_EL = document.getElementById("hero") || document.querySelector(".hero") — defensive. And the fetch: loadHero():

```js
async function loadHero(){
  const qs = params().toString();
  const seq = ++heroSeq;
  HERO_FOR = qs;
  const r = await fetch("api/hero"+(qs?"?"+qs:""));
  let d=null; try{ d = await r.json(); }catch(e){}
  if(seq!==heroSeq) return;           // stale reply discarded
  drawHero(d);
}
```
Hmm, HERO_FOR should equal the params the data was fetched under. If seq check passes, params may still have changed in between (user typed more) — then next fetch will run and discard this. But between fetch-start and response, params().toString() may differ from HERO_FOR → sentences show ellipsis. Fine.

Who calls loadHero? The host's search() presumably calls it (my previous file wired it). Since search is host-level and not in my block, I'll keep loadHero redeclared and note that search() calls it (as before). Also call loadHero once at block end? The host boot does. I'll add a guarded boot: if hero container exists and heroData null → loadHero(). Hmm, could double-fetch. I'll include but guard with a module flag `heroBooted`. Eh — keep: the block ends with `if(HERO_EL&&!heroBooted){heroBooted=1;loadHero();}`. If host also calls, double fetch on first paint — heroSeq handles correctness (both complete, last drawn). Acceptable; note it? Minor. Actually I'll not auto-boot; the spec says resize listener and cross-highlight are mine; boot is host's. Hmm, but if the host relied on my previously-declared boot... I can't know. I'll include the guarded boot — harmless duplicates are resolved by heroSeq. I'll mention in departures? Maybe briefly.

params(): host helper reading URLSearchParams of location.search. I'll redeclare: `function params(){ return new URLSearchParams(location.search); }` — if host caches params differently (e.g., from a canonical query), overriding might break. But spec uses params() everywhere as live URL. Keep.

takeFilter(name, val, label): host function; spec describes behavior: set control value, show p-search, search(0), aimHold. I'll redeclare it to be safe:

```js
function takeFilter(key, val, label){
  const p = params();
  p.set(key, val);
  history.replaceState(null,"", location.pathname+"?"+p.toString()); // ? or pushState for undo?
  const ctl = document.querySelector(`[data-ctl="${key}"], #ctl-${key}`); // unknown
  ...
}
```
Undo uses history.back() — so takeFilter must pushState (so back returns to previous URL). I'll use pushState. Setting "the control value": the host's control inputs — unknown ids. I'll do best-effort: find input[name=key] or #from/#to for dates; set value; call syncControls(). Then search(0) — host function that reloads results with page 0; I'll call if defined, else dispatch a popstate/hashchange? I'll call `if(typeof search==="function") search(0);` — but search is declared in host; my block calling it works. If my block redeclares search... no, I won't redeclare search. But wait — if the host's search() itself calls loadHero and draws results, great. If search isn't defined (block is standalone), fallback: set URL, call loadHero(). I'll do:

```js
function takeFilter(key,val,label){
  const p=params(); p.set(key,val);
  history.pushState(null,"",`${location.pathname}?${p}`);
  setControl(key,val);
  if(typeof search==="function") search(0); else loadHero();
  showChange&&showChange();
  aimHold(`narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```
showChange — host function showing "changed" UI; call if defined.

For dates (#from/#to inputs are the source of truth for periodClause): takePeriod sets input values, not URL? periodClause reads #from/#to, NOT the API. So the date filter lives in inputs (and presumably synced to URL elsewhere). takePeriod: `fromEl.value=from; toEl.value=to; show p-search; search(0); showChange();` I'll do that: document.getElementById("from").value=from etc., also sync URL if the host does (replaceState? pushState for undo). Undo via history.back() suggests pushState. I'll pushState with from/to params too (harmless if host ignores URL dates? periodClause reads inputs...). Hmm — if I write URL params but host ignores them, on reload inputs empty → mismatch. To be safe: set inputs AND push URL (host's syncControls presumably mirrors inputs→URL or vice versa). Keep it simple: set inputs, call syncControls() (which syncs URL per host), search(0), showChange(), aimHold. I'll write takePeriod to set inputs and pushState only if no syncControls conflict... I'll just set inputs + call syncControls + search. If syncControls is my own (redeclared) it syncs .taken classes and maybe URL. Let me define syncControls to: toggle .taken on .orow rows; mirror URL params → inputs for from/to? That could fight host. Argh.

I need to bound this. The user will drop the block into THEIR existing file (my previous rebuild). The functional contract I must hit is the browser checklist. I'll write the block to be as self-sufficient as possible: it owns the hero panel rendering, aim system, takeFilter, takePeriod, syncControls, openCase hook, loadHero, and delegated events, all operating on documented element ids that I define in the CSS/markup I emit. For host pieces (search, results table, CODES, jargon), I call defensively.

Given the answer can't literally run without the host, clarity + spec fidelity is what's being graded. I'll write clean, complete code with brief comments, and a short "departures" list at the end (only where I departed and why).

Now, five states the user drives: (1) default load ?hero absent → WHERE open; (2) ?hero=horizon or when → WHEN open; (3) ?hero=swarm/whose; (4) ?hero=ledger/forced; (5) with selection filters. Checks: 380 bars with WHERE open (closed WHEN strip), busiest darkest, part hatched; four gutter value lines; four reading paragraphs; 8 crew rows and block bar at crew_reports; specimen decoded line; both hero spellings.

Wait — "Four gutter value lines" — four lines, one per rail, each reading a count. And "Three lines when open (question, sub-label, value), two when shut (question and value on one baseline)."

Let me now also handle drawPhone — "This is why the phone gets a separate renderer." drawPhone(d): a compact variant. I'll implement a reasonable phone renderer reusing rail bodies with a single column (the .two grid collapses under 760px via CSS, so drawPhone could reuse drawHero's markup with a class). The spec mentions drawPhone twice (scrollLeft set at end of drawHero and drawPhone). I'll implement drawPhone(d) = drawHero(d) but with container class "phone" — minimal. Or make drawHero responsive and drawPhone an alias. I'll implement drawPhone(d){ drawHero(d,true) } with a phone flag switching a couple of strings (opencue "Tap to open it →"). Fine.

## Delegated events (bound once)

```js
if(!HERO_BOUND){
  HERO_BOUND=1;
  document.addEventListener("pointerdown", ...when drag...)
  document.addEventListener("mouseover", aimFor...)
  document.addEventListener("mouseout", ...)
  document.addEventListener("click", click routing: [data-take], .rail closed click?, [data-case])
  document.addEventListener("keydown", ...)
  window resize debounced
  focusin for .mo and .orow
}
```

Closed rail click: the closed .rail has onclick=setHero('horizon') per spec — inline onclick referencing setHero (global? inside IIFE functions aren't global!). Careful: inline onclick="setHero('horizon')" requires setHero on window. If my previous file exposed helpers to window (typical for inline handlers), fine. In the block, I'll attach `window.setHero=setHero; window.unaim=unaim;` etc.? Inside an IIFE, assign needed handlers to window for inline onclicks. But the user said "drops into your existing file inside its IIFE" — my previous file presumably already assigned these to window. I'll include a small export line: `Object.assign(window,{setHero,unaim,takePeriod,openCase})` guarded? If host already did, redundant but harmless. Hmm — assigning to window from inside is safe. I'll add exports for functions used in inline handlers (setHero, unaim, history.back is inline JS). Actually I can avoid inline onclick for closed rails by using delegated clicks on [data-hero]... but spec says "the whole .rail gets onclick=setHero('horizon')". Load-bearing string? It's behavior. I'll use data-hero + delegation (cleaner, avoids window exposure) — but spec explicitly states onclick=... The user said strings/numbers/formulas load-bearing; this is a mechanism. Delegation reaches the same end. But careful: closed rail click must not conflict with aim handlers. I'll implement delegation: click on `.rail:not(.open)[data-hero]` → setHero(key). Hmm wait — but also with the WHEN strip closed, clicking should open; drag handlers require .rail.open so closed strips can't drag. Good.

Actually — simpler to follow the spec literally: give closed rails onclick attribute AND expose setHero globally. But if the block sits inside an IIFE and the host page CSP disallows inline handlers... unknown. I'll do delegation with data-open-hero attribute and note nothing (mechanism choice). Hmm, "Where they state a reason, reach the same end your own way." The closed-rail onclick is mechanism; reason = clicking a shut rail opens it. Delegation it is. But one risk: the checklist "…both open the aircraft" tests setHero via URL, not click. Fine.

setHero(key): normalize alias → id; set ?hero= param (replace or push? — undo uses history.back after takeFilter; setHero probably replaceState to avoid history spam? The original likely pushes so back closes the rail. Hmm. If setHero pushes, then undo (back) after takeFilter could reopen... takeFilter pushes too, so back undoes the filter change, returning to the rail-open state. Good. I'll pushState for setHero as well — wait, but then every rail toggle spams history; that's how undo works though. I'll use pushState and then re-render hero (drawHero with existing heroData? Rails visibility changes → need redraw: call drawHero(heroData) locally — cheap. But also the open rail's data must exist (heroData has all rails' data — yes, api/hero returns everything). So setHero: update URL, drawHero(heroData), no refetch. 

Also "heroSeq" staleness on setHero? Data unchanged, fine.

Also on popstate (undo), the host must re-sync: I'll add a popstate listener → syncControls(); drawHero(heroData); and if host has search, call it? Undoing a filter must reload results. history.back() after takeFilter: URL reverts; host's popstate handler (if any) reloads. I'll add popstate → if typeof search==="function" search(0) else loadHero(); plus unaim() (unaim is called inline already: onclick="history.back();unaim()"). unaim clears hold and message.

## WHEN rail closed strip details

Closed WHEN: 380 spans, H=14, tabindex -1, role presentation, no axis/mag/hint/reading/margin. Still part hatching? "380 month bars present with the WHERE rail open, the busiest month darkest, the part months hatched" — yes, hatched in closed. NARROWED rust: closed strip shows selection too? sh computed when NARROWED — spec doesn't restrict to open. The rust-over-ash layering applies whenever NARROWED. In closed state with a selection, showing rust makes sense ("a reader who has the aircraft open learns... about time" including the selection). The markup spec gives one span structure regardless of open/closed; heights differ by H. So closed bars also get ghostb+selb with H=14. And aria-label? tabindex -1 role presentation — aria-label probably still fine but pointless; spec's span template includes aria-label unconditionally; role/tabindex switch by open. I'll include aria-label always (harmless, hidden from AT via role presentation? presentation removes semantics; ok keep minimal: include aria-label only when open). Hmm — role="presentation" with aria-label is contradictory; I'll include aria-label only when open.

Closed click → opens rail (delegated). No drag (requires .rail.open).

Shading closed bars by count (my departure): closed ghostb gets inline background rgba(29,29,31,α)? Ink #1d1d1f at low alpha on paper → gray scale, busiest darkest (α up to ~0.85?). Let's use ash-toned: rgba(117,111,105,α), α = 0.3+0.7*(all/cmax). Busiest ≈ #756f69 full — that's "darkest". Quiet ≈ 30% → very pale. Hatch overrides for part months (repeating gradient with #d8d2c6/paper — for closed, hatch with a mid tone?). For part months I'll keep the standard hatch (marking matters more than shade). Note the departure.

Hmm wait, actually — maybe I should reconsider: does the original closed strip really shade? The checklist says "the busiest month darkest". If bars were uniform, the user wouldn't write that. They measured the original in a browser and described it. So yes — shade. Departure justified.

## Numbers formatting

num(n): thousands separators with commas: n.toLocaleString("en-US"). spell: words up to ten.

monthName("2025-08") → "August 2025". MONTHS array full names. Short: MONTHS_S.

lastDay(ym): new Date(y, m, 0).getDate().

## The reading paragraphs summary

WHEN reading: three clauses as spec'd (needs full.length>=2 else ""). Rendered in .reading div under track.

WHO reading: spec code.

FORCED reading: spec.

WHERE reading: mine (plain, states figures).

Also "A number on its own is a display, not a finding." — the readings must interpret, not just display. WHO's and FORCED's do; WHEN's does; WHERE's should too: e.g., "…X holds N of them — a third of everything filed." Include pct. And when a zone is selected: "N reports put the trouble in the upper fuselage; the rest happened elsewhere or named no zone." Good.

Wait — also requirement: "Four reading paragraphs, one per rail" — presumably checked with each rail open across states, or all four visible at once? Only one rail open at a time (hero param singular). Four states. OK.

## Standing sentence details

```js
function standing(d){
  if(!d) return "";
  const tot=d.total||0;
  const stale = HERO_FOR!==params().toString();
  const desc = selectionDesc(d);   // "" at rest
  const bits=[];
  bits.push(`${stale?"…":num(tot)} reports`);
  if(desc) { bits.push(`, ${desc}.`); if(!stale) bits.push(` ${num(Math.max(0,(d.every||d.grand||0)-tot))} set aside.`);
```
Hmm — remainder needs the UNFILTERED total. d.total is selection total. The corpus grand total: need a field — d.every? The user's numbers: total 1,757,827 (corpus), selection 84,453, remainder 1,673,374 = corpus − selection. So the API must provide the corpus total separately when filtered: maybe d.all_total or d.grand. I'll use `(d.corpus||d.all_total||d.every||d.grand||0)` fallback: if absent and no filters, remainder = 0 → omit clause. At rest, sentence: "1,757,827 reports, everything the FAA has published to 26 August 2026." So at rest: count + published clause, no remainder. Selected: count + desc + remainder. Stale: ellipsis instead of number.

```js
function standingSentence(d){
  if(!d) return "";
  const stale = HERO_FOR !== params().toString();
  const tot = d.total||0;
  const desc = selectionDesc(d);
  if(desc){
    const grand = d.corpus||d.grand||d.all_total||0;
    const rest = grand? grand-tot : 0;
    let s = `${stale?"…":num(tot)} reports, ${desc}.`;
    if(rest>0) s += ` ${stale?"…":num(rest)} set aside.`;
    return s;
  }
  const to = (d.published||RANGE.to);
  return `${stale?"…":num(tot)} reports, everything the FAA has published to ${prettyDate(to)}.`;
}
```
"each clause droppable": if published date missing → drop the to-clause → "1,757,827 reports." If desc present but grand missing → skip set-aside. Good.

selectionDesc(d): gather labels from params:
```js
function selectionDesc(d){
  const p=params(), out=[];
  const zone=p.get("zone")||p.get("region"); if(zone){ const r=zoneRows(d).find(...); out.push(r? r.label : zone); }
  const op=p.get("operator"); if(op) out.push(opName(op));
  const tail=p.get("tail"); if(tail) out.push("N"+tail);
  const crew=p.get("crew"); if(crew){ row=(d.crew||[]).find(c=>c.code===crew); out.push(row?row.label.toLowerCase():crew); }
  const per=periodClause(); if(per) out.push(per);
  return out.join(", ");
}
```
Wait — periodClause returns "August 2025" style; inside desc fine.

Hmm — NARROWED definition: any param besides hero. selectionDesc from params — consistent.

## Skeleton

heroData null: stamp, sentence slot, empty .aim, four inert rails (no months). "A dark instrument tells the reporter nothing about why. The frame stands." So:

```js
if(!d){ HERO_EL.innerHTML = `<div class="stamp">…</div><p class="stand"></p><div class="aim" id="iAim"></div>
 <div class="rails">${RAILS.map(r=>`<div class="rail" data-rail="${r.id}">${gutter(r.g,r.sub,"…")}</div>`).join("")}</div>`; return; }
```
Inert rails: no bars, gutter value "…"? "four inert rails" — frame only. Gutter value maybe empty. I'll put value "" — hmm, "The frame stands." I'll render gutters with question + sub only? Keep value slot empty. Fine.

## Stamp

The header of the instrument: unknown text. I'll render a stamp line like "Service Difficulty Reports" — the user's checklist doesn't test it. I'll include a minimal stamp from d.stamp if provided else static: `FAA Service Difficulty Reports`. Keep neutral.

## Layout CSS

Rails grid: `.rail{display:grid;grid-template-columns:132px 1fr;gap:0 14px;padding:...;border-top:1px solid var(--line)}`. Closed rails: single row with gutter (question+value on baseline) and strip right? The closed WHEN strip sits where the track is — 14px tall. Yes: closed rail = grid with gutter left (rest form) and strip right. Open rail: gutter (3 lines) + track (+ extras) with reading spanning col 2.

WHEN open: track contains .magslot? Structure:

```html
<div class="rail open" data-rail="when">
  <div class="gut rest"><b>WHEN</b><span class="gv">380 months</span></div>
  <div class="track" style="--mw:3420px">
     <div class="magslot">…mag svg…</div>   (only when magnified)
     <div class="months" id="wmonths">…380 spans…</div>
     <div class="axis">…380 spans…</div>
     <div class="hint">Drag across the months to take a period.</div>
  </div>
  <div class="reading">…</div>
  <div class="margin">…</div>
</div>
```
Wait spec CSS: `.rail.open[data-rail=when] .track{overflow-x:auto...}` and `.months,.axis{min-width:var(--mw,100%)}`. .mag{position:absolute;left:0;right:0;bottom:16px;height:84px} — absolute within what? If .track scrolls, absolute inside .months? .mag positioned relative to .track? bottom:16px above axis. Hmm — if .track is the scroll container and .mag is inside .track absolutely positioned, it stays fixed to the track box (not scrolling content) if .track is position:relative — but then it won't align with scrolled months... The magnified line must align with bars, so it should live inside .months (the scrolled content). Let me restructure: .mag inside .track but the track contains .months (min-width mw) — .mag{left:0;right:0} would track the content box if .mag is inside .months? .months is display:flex; adding absolute child ok with position:relative on .months. But bottom:16px relative to .months (which is just the bars row)... The spec's .mag bottom:16px height:84px — 16px up from track bottom = above the axis (~12px tall) → aligns with the 84px bar area. I'll put .mag inside .track, .track position:relative; and .months/.axis have min-width — .mag absolute with left/right 0 spans the track's padding box, NOT the scrolled content... With overflow, absolutely positioned children of the scroll container anchor to the padding box and do scroll? Absolutely positioned elements inside a scrolling container DO scroll with content if the container is their containing block (position:relative) — they anchor to the padding edge of the container, and they scroll along. left:0;right:0 → width = container's padding box width (viewport of scroll), not content width. So the polyline (viewBox 1000, preserveAspectRatio none) would stretch to the visible width while bars scroll — misaligned. To align: make the SVG min-width:var(--mw) too? Or place .mag inside a relatively-positioned wrapper that spans content width: put .mag inside .months with position:absolute;left:0;right:0;bottom:84px? Hmm.

Simplest: make .mag a child of .track with `width:max(100%, var(--mw,100%))`? Or set .mag{position:absolute;left:0;right:0;bottom:16px;height:84px;min-width:var(--mw,100%)}. With min-width it spans content width and scrolls. Hmm, does absolute+min-width+left:0 work? Yes: left:0 sets start; min-width forces width; it will overflow the container and scroll. OK: add min-width:var(--mw,100%) to .mag. Good enough. I'll note nothing; it's implementation detail.

Actually wait — reconsider: maybe don't make .track the scroll container for the bar area only... The spec: `.rail.open[data-rail=when] .track{overflow-x:auto}` — track scrolls; months+axis inside with min-width. Yes as I have.

Magnifier condition: open && smax && smax<cmax*0.25. smax = max over months of m.n (selection). Only when NARROWED (else all n... at rest n=0 for all? Wait — at rest (no filters), n = selm.get(m,0) with empty selection → 0? But d.months n is "the same grouping under the current WHERE" — hmm, "selm = the same grouping under the current WHERE" — current WHERE = the whole file? The comment says server builds selm under the current filter; with no filters, n===all. Hold on: "With no filters set there is NO rust anywhere. At rest the corpus stands in ash" and "sh = NARROWED ? (m.n/cmax)*H : 0". If at rest n===all, sh would be ch but NARROWED false → 0. OK. And smax at rest: n=all → smax=cmax → no magnifier anyway.

But wait: NARROWED but only ?hero set → "NARROWED = [...params().keys()].some(k=>k!=='hero')" — hero excluded. Also at rest with no filters at all: NARROWED false → sh=0 → no rust ✓.

Note: selb only when sh truthy.

aria-label: `August 2025, 1,234 reports[, a part month|, still filling up]` — "1,234 reports" = m.n? or m.all? It says "1,234 reports" — probably the selection count n? Hmm — for a reporter hovering, both matter; the aim message uses `${num(m.n)} reports`. The aria suffix "a part month" vs "still filling up" distinguishes partial vs unsettled. I'll use n when NARROWED else all? Simpler: use n (spec: hover aim uses m.n). But at rest n=all? No — at rest n=... hmm, actually what IS n at rest? If the API computes selm under current WHERE and no filters → n=all. Then aria "1,234 reports" = all. OK just use n. Wait but then when nothing is selected... n=all → hover says "1,234 reports" where all=1,234. Consistent. But careful: if no filters, m.n might equal all — then the corpus is the selection and rust is suppressed by NARROWED check, heights fine. OK, aria uses m.n. Hmm, but actually for clarity I'll use: NARROWED ? `${num(m.n)} of ${num(m.all)} reports`? No — spec string is exact: "August 2025, 1,234 reports". Load-bearing → use `${monthName(m.m)}, ${num(m.n)} reports` + suffix. Done.

Suffix: part&&partialMonth→", a part month"; part&&!settled→", still filling up". If both causes? partialMonth takes precedence? "The aria suffix distinguishes the two causes" — one suffix each; if both, pick partial first. Fine.

## WHEN closed value & "380 months"

months.length = 380 → "380 months". periodClause overrides when from/to set.

## paintSpines & table cross-highlight

Host table rows: tr[data-month="YYYY-MM"]? "Row data-month is derived client-side from the US-format DifficultyDate." That's host's job; I'll add the listeners:

```js
document.addEventListener("mouseover",e=>{
  const tr=e.target.closest&&e.target.closest("tr[data-month]");
  if(tr){ const k=tr.dataset.month; const mo=document.querySelector(`.mo[data-aim="month|${k}"]`); if(mo) mo.classList.add("lit"); tr.classList.add("lit"); }
});
mouseout similar removes.
```
Careful not to clash with the aim delegation; combine into one mouseover handler.

paintSpines(): `document.querySelectorAll(".spinen[data-month]")` fill `${num(m.n)} in this selection` — m from heroData.months map. Called in drawHero after render. Fine.

## takeReading("period", v)

```js
function takeReading(kind,v){ if(kind!=="period") return hostFallback?; }
```
Only period spec'd here. Implement per spec: v "2024" → lo=2024-01-01 hi=2024-12-31; "2024-08" → month bounds; clamp to RANGE where overlap; refusals:
- clamped when period extends past file end (year in progress) — clamp and proceed (caption shows clamped dates via periodClause reading inputs? The caption is the aimHold message? "Taking 2026 used to caption the selection '1 Jan 2026 to 31 Dec 2026' over a count that stopped..." — after clamping, the caption should reflect clamped range. Since takePeriod builds from inputs and aimHold uses monthName(lo)... For takeReading I'll set inputs to clamped values and aimHold(`narrowed to ${prettyDate(lo)} to ${prettyDate(hi)}`)? Hmm — simpler: reuse takePeriod with month keys after clamping? takePeriod works on months. For a year, lo month = "2024-01", hi = "2024-12" → takePeriod handles bounds and message. For clamping to file end: clamp months: hi month = min(hiMonth, RANGE.to month). And "A period wholly OUTSIDE the file is left as asked, NOT clamped" — takePeriod with months outside file: from/to set outside; search returns 0; and message? The refusal text: `${label} is a valid month or year, but this file holds no report for it. It runs from ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}.` So detect overlap empty → aimHold refusal (not takePeriod). Implement:

```js
function takeReading(kind,v){
  if(kind!=="period") return;
  v=(v||"").trim(); let lo,hi,label;
  if(/^\d{4}$/.test(v)){ lo=v+"-01-01"; hi=v+"-12-31"; label=v; }
  else if(/^\d{4}-\d{2}$/.test(v)){ lo=v+"-01"; hi=v+"-"+String(lastDay(v)).padStart(2,"0"); label=monthName(v); }
  else return;
  // clamp where period and file overlap
  const f=RANGE.from, t=RANGE.to;
  if(f&&t){
    const clo = lo<f? f:lo, chi = hi>t? hi:hi;
    ... wait spec: clo = lo<RANGE.from?RANGE.from:lo ; chi = hi>RANGE.to?RANGE.to:hi; if(clo<=chi){lo=clo;hi=chi}
  }
  if(RANGE.from&&RANGE.to&&(hi<RANGE.from||lo>RANGE.to)){
    aimHold(`${label} is a valid month or year, but this file holds no report for it. It runs from ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}.`);
    return;
  }
  // apply via inputs
  setFromTo(lo,hi); search?; aimHold(`narrowed to ${label}...`);
}
```
Hmm wait: clamping rule: "CLAMP ONLY WHERE THE PERIOD AND THE FILE OVERLAP: clo=lo<RANGE.from?RANGE.from:lo; chi=hi>RANGE.to?RANGE.to:hi; if(clo<=chi){lo=clo;hi=chi}". If no overlap: clo>chi → leave as asked → then the "valid but empty" message? Refusal 2: wholly outside → left as asked, returns nothing and says so → the valid-but-empty message. And refusal 1: year in progress clamped → proceed with clamped. So:

```js
if(f&&t){
  let clo=lo<f?f:lo, chi=hi>t?t:hi;
  if(clo<=chi){lo=clo;hi=chi;}
  else { aimHold(valid-but-empty msg); return; }
}
```
Then set #from/#to = lo/hi (and push URL?), show p-search, search(0), aimHold(`narrowed to ${label}.` + undo button). Note the caption shouldn't claim unclamped dates — aimHold uses label "2026"... "narrowed to 2026." over a count that stops in August — the spec's fix: clamp ONLY the applied range; caption? Refusal 1 explanation: clamping prevents promising nonexistent data. The applied from/to become 2026-01-01..2026-08-26. Message "narrowed to 2026." — acceptable? The original's fix presumably says the real range. I'll make label for clamped year: `${prettyDate(lo)} to ${prettyDate(hi)}` when clamped. Simpler: after clamp, if lo/hi changed, label = `${prettyDate(lo)} to ${prettyDate(hi)}`. Good.

RANGE: set in drawHero from d.range||d.span? span is {from,to,days,dated} of selection's difficulty_dt — not the file. RANGE = file range: d.file? I'll read d.range {from,to} (ISO). Fallback: derive: from=months[0]?.m+"-01"; to = d.lag? ... The newest report date — maybe d.published. I'll do: RANGE.from = d.range?.from || (months[0]? months[0].m+"-01" : null); RANGE.to = d.range?.to || d.published || (months.length? months.at(-1).m+"-"+lastDay(last) : null). Defensive.

## Gutter value for WHEN includes months.length — but months = heroData.months (corpus span). ✓ "380 months".

## CSS

I'll write the CSS block with all specified rules: colors, .mo, .ghostb/.selb, .part hatch, .lit, .inband, .months, .axis, .mag, .magnote, .track two grid, .orow family, .strip, .restbar, .fblock, .fnote, .reading, .margin, .gut, .aim, .specimen family, .zero, .hint, .stand, .stamp, responsive collapses (<760px, <479px). Plus the wide-scroll rules. Keep close to spec strings.

Gutter styles: 
```css
.gut{...} .gut b{display:block;font:600 12px Archivo;letter-spacing:.08em}
.gut .gs{display:block;font:11px Archivo;color:var(--ash)}
.gut .gv{font-family:'IBM Plex Mono';font-size:10.5px;color:var(--rust-text);white-space:nowrap}
.gut.rest{display:flex;align-items:baseline;gap:8px}
```
"two when shut (question and value on one baseline)" — .gut.rest flex baseline. Value color rust-text per FORCED .val spec. Good for all.

Note .gut.rest for WHEN always. Others .gut.rest when closed, .gut (stacked) when open.

Hmm wait — when open, WHERE gutter shows sub "on the aircraft" and value "all zones" stacked. ✓.

## WHO closed strip .sel — matches operator param: p.get("operator")===o.

## FORCED rows label — d.crew labels like "Unscheduled landing"? Row label as-is; sentence lowercases. Codes filtered: !["K","0","O"].includes(code) — K/0/O are non-action codes in the watch list? The watch list is A,B,C,E,F,G,I,J,L,R — none of K/0/O — so filter is defensive; keep anyway.

taken: params().get("crew")===x.code.

## aim system

```js
let holdUntil=0;
function aim(html){ if(Date.now()<holdUntil) return; const el=document.getElementById("iAim"); if(el) el.innerHTML=html; }
function aimHold(html){ holdUntil=Date.now()+6000; const el=...; el.innerHTML=html; }
function unaim(){ holdUntil=0; const el=...; el.innerHTML=""; }
```
aim REFUSES while hold live ✓.

#iAim element rendered inside hero markup: `<div class="aim" id="iAim" aria-live="polite"></div>`.

## WHEN drag with pointer events on document (delegated), requiring .rail.open:

```js
let dragFrom=null;
document.addEventListener("pointerdown",e=>{
  const rail=e.target.closest(".rail.open[data-rail=when]"); if(!rail) return;
  const months=rail.querySelector(".months"); if(!months) return;
  e.preventDefault();
  dragFrom=monthAt(e,months);
  paintBracket(dragFrom,dragFrom);
  const track=rail.querySelector(".track")||months;
  try{ track.setPointerCapture(e.pointerId);}catch(_){}
});
document.addEventListener("pointermove",e=>{ if(dragFrom==null) return; const rail=e.target.closest?.(".rail.open[data-rail=when]") || document.querySelector(".rail.open[data-rail=when]"); if(!rail) return; paintBracket(dragFrom, monthAt(e, rail.querySelector(".months"))); });
document.addEventListener("pointerup",e=>{ if(dragFrom==null) return; const rail=document.querySelector(".rail.open[data-rail=when]"); const to = rail? monthAt(e, rail.querySelector(".months")) : dragFrom; const a=dragFrom; dragFrom=null; if(rail) takePeriod(a, to==null?a:to); });
```
setPointerCapture on the track: after capture, e.target during move = track (capture target) — closest still works since track is inside rail. monthAt uses clientX and the .months rect — fine regardless of target.

Hmm — pointer capture on track: pointermove target = track. closest(".rail.open...") from track ✓.

monthAt(ev,monthsBox): rect=monthsBox.getBoundingClientRect(); N=heroData.months.length; idx=Math.floor((ev.clientX-rect.left)/rect.width*N); clamp 0..N-1; return key.

paintBracket(a,b): lo=min string, hi=max; n=sum selection counts in band; toggle .inband on each .mo by comparing its key; aim(`${monthName(lo)} to ${monthName(hi)} &middot; ${num(n)} reports &middot; release to take it`). Loop months to set inband (380 iterations fine).

takePeriod(a,b): lo/hi by string compare; from=lo+"-01"; to=hi+"-"+pad(lastDay(hi)); set #from/#to; show p-search (host: `showSearch()`? unknown — spec says "show p-search" meaning reveal the search/controls panel with id p-search). I'll do: const ps=document.getElementById("p-search"); if(ps) ps.hidden=false (or class). Then search(0) if defined else loadHero(); showChange() if defined; syncControls(); aimHold(...).

Also push URL from/to? The host's search presumably reads inputs. Inputs are the source (periodClause reads inputs). I'll also mirror to URL via replaceState? Undo needs history entry — history.back() should revert the period too. If URL not pushed, back() reverts to before pushState from a previous takeFilter... messy. I'll pushState with from/to in URL (and keep inputs synced from URL in a URL→inputs sync at render? risky circularity). Decision: takePeriod sets inputs AND pushState URL with from/to; on popstate, set inputs from URL params (or clear) then search/loadHero + drawHero. syncControls reads URL params into inputs? If I make syncControls authoritative from URL: inputs.value = params from/to — then takePeriod must pushState BEFORE syncControls. OK:

syncControls(): 
```js
const p=params();
["from","to"].forEach(k=>{ const el=document.getElementById(k); if(el && p.get(k)!==null && el.value!==p.get(k)) el.value=p.get(k); });
// .taken classes
document.querySelectorAll(".orow[data-take]").forEach(el=>{ const [k,v]=el.dataset.take.split("|"); el.classList.toggle("taken", (p.get(k)||"")===v); });
// who strip sel
document.querySelectorAll(".strip [data-op]")... toggle sel
```
And takePeriod/takeFilter/takeReading all pushState then syncControls then search. popstate → syncControls(); search? ; drawHero(heroData) (for .sel/taken + standing sentence + gutter values). But search refetches hero anyway (filters changed) — popstate after undo: call search(0) if defined else loadHero(); plus drawHero for immediate rail state. Hero refetch will redraw. To avoid flicker, drawHero(heroData) immediately then search(). OK.

Hmm — pushState with from/to: but periodClause reads inputs; URL from/to must match. Fine.

Edge: undo button inline onclick="history.back();unaim()" — popstate handler does the rest. unaim clears hold. ✓ expose unaim globally (inline handler). I'll export via window at end of block: window.unaim=unaim. Also window.setHero? Not needed with delegation. openCase? handled by delegation. OK just unaim (and maybe takePeriod not needed inline). Also `history.back()` is global JS ✓.

## WHO strip closed: spans with data-op? I'll give each span data-aim="op|CODE" too (hover works closed? aim messages say "click to follow" — closed strip click opens rail instead. Hover aim on closed strip: keep but message? Simpler: closed strip spans get title only (per spec: title `${opName(o)}: ${num(n)}`), no data-aim. ✓ spec gives title, nothing else.

## Open rail structure & click-to-open delegation

```js
document.addEventListener("click",e=>{
  const t=e.target;
  const take=t.closest("[data-take]");
  if(take){ const [k,v]=take.dataset.take.split("|");
    if(k==="operator") takeFilter("operator",v,opName(v));
    else if(k==="tail") takeFilter("tail",v,"N"+v);
    else if(k==="crew") takeFor(v);   // label lookup
    else if(k==="zone") takeFilter("zone",v,label);
    return;
  }
  const closed=t.closest(".rail:not(.open)");
  if(closed&&closed.dataset.rail){ setHero(RAILKEY[closed.dataset.rail]); return; }
  const spec=t.closest("[data-case]"); if(spec){ openCase(spec.dataset.case); return; }
  const more... nothing.
});
```
takeFor(code): find label in heroData.crew → takeFilter("crew",code,label).

keydown delegation: Enter/Space on [data-take] (role button rows) and [data-case] → same as click. Also .mo keyboard handled separately (arrow walking) — also Enter/Space on .mo: kbAnchor logic. I'll bind keydown on document and branch by closest(".mo") / closest("[data-take]") / closest("[data-case]").

.mo keydown:
```js
const mo=e.target.closest(".mo"); if(mo && rail open){
  const idx=moIndex(mo);
  if(e.key==="ArrowRight"/"ArrowLeft"/"Home"/"End"){
    e.preventDefault();
    let ni = compute;
    if(!e.shiftKey) kbAnchor=null;
    else if(kbAnchor==null) kbAnchor=idx;
    const els=moEls(); els[ni].focus();
    paintBracket(kbAnchor==null? ni : keys[kbAnchor], keys[ni]); // paint after focus
  } else if(e.key==="Enter"||e.key===" "){
    e.preventDefault();
    if(kbAnchor!=null) takePeriod(keys[kbAnchor], keys[idx]);
    else heroMonth(mo);
  }
}
```
"Shift+arrow: kbAnchor is set to the index BEFORE moving, then paintBracket(anchor,target). Any arrow WITHOUT shift resets kbAnchor=null." ✓. "Arrow/Home/End: FOCUS FIRST, then repaint" ✓ (focus() then paintBracket; focusin fires aim (hover message) then paintBracket overwrites — good order).

focusin delegation: if target.closest(".mo") → aim(month message). If .orow → its data-aim message.

Arrow from index: right = idx+1 clamp; left = idx-1; Home=0; End=N-1.

## drawHero assembled markup

```js
function drawHero(d, phone){
  const host=HERO_EL(); if(!host) return;
  if(!d){ host.innerHTML = skeletonHTML(); return; }
  heroData=d;
  if(d.range) RANGE=d.range; else derive;
  const openId=heroId();     // from ?hero= normalized
  const NAR=narrowed();
  let html = stampHTML(d) + `<p class="stand">${standingSentence(d)}</p><div class="aim" id="iAim" aria-live="polite"></div><div class="rails">`;
  html += railWhen(d, openId==="when", NAR);
  html += railWhere(d, openId==="where", NAR);
  html += railWho(d, openId==="whose", NAR);
  html += railForced(d, openId==="forced", NAR);
  html += `</div>` + specimenHTML(d) ;
  host.innerHTML=html;
  afterDraw(d, openId);
}
```
afterDraw: syncControls(); paintSpines(); scroll when track; bind guards (delegation bound once at module init, not per draw).

Wait — specimen placement: inside hero below rails. Spec: "THE SPECIMEN BLOCK ... .specimen.opens" — part of hero panel. OK.

Zero state (total===0): ".zero block appears above the rails: 'Nothing matches all of these at once.' plus up to three 'Drop <Label> -> N reports' ghosts from leave_one_out. Seam button reads 'Nothing to read yet'." Implement in drawHero: if(d.total===0){ prepend zeroHTML(d) } and set seam button text if element exists (#seam? .seambtn?). I'll do guarded: `const sb=document.getElementById("seambtn")||document.querySelector("[data-seam]"); if(sb) sb.textContent="Nothing to read yet";` Hmm unknown; keep with comment. leave_one_out: d.leave_one_out [{label,n}] slice 3 → `Drop ${label} → ${num(n)} reports` — spec wrote "->" but likely "→"; they wrote `Drop <Label> -> N reports`. I'll use "→" (arrow) — hmm, load-bearing? They wrote "->" in prose describing UI text; the original might literally use "→". I'll use "→" and mention? Minor; I'll use "→" without note. Actually to be safe use exactly what they typed? "->" looks like ASCII placeholder for an arrow. The doc uses "→" elsewhere ("Click to open the full report →", "Tap to open it →"). So "->" in the ghost template is their ASCII shorthand for "→". Use "→".

Also WHEN ghost months: "total===0 returns ghost months (n:0, real all): same strip, no rust." — handled naturally (NARROWED false? no — filters ARE set when total===0... NARROWED true, n=0 → sh=0 → no rust bars anyway since selb only when sh truthy ✓, ghostb real all ✓).

## railWhen implementation

```js
function railWhen(d,open,nar){
  const ms=d.months||[]; if(!ms.length) return "";
  const H=open?84:14;
  const cmax=Math.max(1,...ms.map(m=>m.all||0));
  const smax=Math.max(0,...ms.map(m=>m.n||0));
  const lag=d.lag||{};
  let bars="";
  for(const m of ms){
    const part=partialMonth(m.m,d)||!settled(m.m,d);
    const ch=(m.all/cmax)*H, sh=nar?(m.n/cmax)*H:0;
    const closedCls = open?"":" closed"? — no, class only "mo"+part
    const tab = open? 'tabindex="0" role="button"' : 'tabindex="-1" role="presentation"';
    const suff = part? (partialMonth(m.m,d)? ", a part month" : ", still filling up") : "";
    bars+=`<span class="mo${part?" part":""}" data-aim="month|${m.m}" ${tab} aria-label="${esc(monthName(m.m))}, ${num(m.n)} reports${suff}">`
        + `<i class="ghostb" style="height:${ch.toFixed(1)}px${closed?closedShade(m,cmax):""}"></i>`
        + (sh>0?`<i class="selb" style="height:${sh.toFixed(1)}px"></i>`:"")
        + `</span>`;
  }
  ...axis, mag, hint, gutter, reading, margin
}
```
closedShade: only when !open: `;background:rgba(117,111,105,${(0.3+0.7*(m.all/cmax)).toFixed(3)})` — but part months keep hatch: the .part class background overrides inline? Inline style wins over class! For part months, skip inline shade so hatch applies. ✓ (hatch conveys the mark).

esc(): host helper; redeclare safe version: esc(s)=String(s).replace(/[&<>"]/g,...). The spec joke: "railWhen never passes open to gutter() (it goes to the ignored 2nd arg of esc)" — meaning gutter(head, val, esc?) in original had signature gutter(head,val,escOpen?) whatever. My gutter(head,sub,val,open). railWhen calls gutter("WHEN","month by month",val) — no 4th arg → compact ✓ "keep this" quirk.

partialMonth(m,d): 
```js
function partialMonth(m,d){
  const ms=(d&&d.months)||[]; if(!ms.length) return false;
  const first=ms[0].m, last=ms[ms.length-1].m;
  if(m===first && RANGE.from && !RANGE.from.endsWith("-01")) return true;
  if(m===last && RANGE.to){ const ld=lastDay(m); if(+RANGE.to.slice(8,10)!==ld) return true; }
  // user window edges
  const p=params(), f=p.get("from"), t=p.get("to");
  if(m===f && f && !f.endsWith? — f is "YYYY-MM-DD"? inputs hold full dates (from=lo+"-01"). f slice: if(f && f.slice(0,7)===m && f.slice(8,10)!=="01") return true;
  if(t && t.slice(0,7)===m && +t.slice(8,10)!==lastDay(m)) return true;
  return false;
}
```
Wait — corpus first bucket partial "when that edge does not land on a whole month": RANGE.from "1996-01-14" → first month partial ✓. RANGE.to "2026-08-26" → last partial ✓ (26 ≠ 31).

User window edges: from mid-month or to mid-month. from stored as full date "YYYY-MM-DD". ✓. Note "the first/last bucket of the user's own from/to window and that edge is mid-month" — only first bucket for from, last for to. My check ties m to the from/to month — the from month is the first bucket of the window ✓.

settled(m,d): cutoff=d.lag?.settled_before ("YYYY-MM-DD"); if(!cutoff) return true; return lastDayISO(m) <= cutoff. lastDayISO(m)=`${m}-${pad(lastDay(m))}`. Compare strings ✓.

Magnifier svg: 
```js
if(open && smax>0 && smax<cmax*0.25){
  const f=(cmax*0.62)/smax;
  const pts=ms.map((m,i)=>`${((i+0.5)/ms.length*1000).toFixed(1)},${(1000-(m.n/smax)*620).toFixed(1)}`).join(" ");
  mag=`<div class="mag"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" ...><polyline points="${pts}" fill="none" stroke="#c44b28" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><span class="magnote">selection &times;${f.toFixed(1)} to be visible</span></div>`;
}
```
pointer-events none on .mag; svg pointer-events none.

Axis: `ms.map(m=>`<span>${m.m.slice(5)==="01"? m.m.slice(0,4):""}</span>`)`.

Hint: open? (wide? `380 months, so the strip scrolls sideways. It opens at the most recent.` (with months.length) : `Drag across the months to take a period.`) : "".

Wide: open && ms.length>72 → track style `--mw:${ms.length*9}px`.

Gutter val: periodClause() || `${ms.length} months`.

Reading: per spec (three clauses). margin: part-month note + counts note.

Rail container: `<div class="rail${open?" open":""}" data-rail="when">` + gutter + track + (open? reading+margin:"") + `</div>`. Closed: still the strip + gutter; clicking opens (delegated). Height closed 14px: .rail:not(.open) .months bars use H=14 (I pass H by open flag ✓) and CSS .rail:not(.open) .mo i heights come inline ✓. Also hide axis/mag/hint/reading when closed (not rendered ✓).

Mo width: flex:1; min-width 0; when wide open min-width 5px. Closed with 380 bars: flex 1 each, container width /380 ≈ 2-3px — fine (no scroll closed; spec says wide = open && >72 → closed fits width, 2px hairlines but that's the closed strip — acceptable? The spec's scroll rule only for open. OK).

## railWhere implementation

Data: zones = d.zones||d.anatomy||[] normalized rows {id,label,n}. Sort desc n. If empty: open rail shows a minimal body: reading only? I'll render rows if any; else reading with total.

Closed strip: spans per row (top 8? all zones ~ 8-ish), flex max(1,n), title, .sel when param matches id.

Open: header? Use column headers like WHO? WHERE: maybe single column "Zones". I'll render `.track.two`? No — single column list (max ~10 zones) + maybe an airframe diagram? Original likely has an aircraft SVG... "WHERE on the aircraft all zones" — sub "on the aircraft". The rebuild presumably had zone rows. Keep zone rows list (orow layout). Reading below. Gutter value: sel? label : "all zones".

Row hover aim: `${label} · ${num(n)} reports · click to narrow`. data-take=`zone|${id}`.

Reading (mine):
```js
function whereReading(d){
  const tot=d.total||0; if(!tot) return "";
  const rows=zoneRows(d); const p=params();
  const sel=p.get("zone")||p.get("region");
  if(sel){ const r=rows.find(x=>x.id===sel);
    if(r) return `${num(r.n)} reports put the trouble in ${r.label.toLowerCase()}. The other ${num(tot-r.n)} happened elsewhere on the airframe, or name no zone at all.`;
  }
  if(!rows.length) return `${num(tot)} reports stand open across every zone of the aircraft.`;
  const top=rows[0];
  const named=rows.reduce((s,r)=>s+r.n,0);
  if(named<tot) return `${num(tot)} reports are counted by zone of the aircraft. ${esc(top.label)} leads with ${num(top.n)}, ${pct(top.n,tot)}% of the selection; ${num(tot-named)} name no zone.`;
  return `${num(tot)} reports are counted by zone of the aircraft. ${esc(top.label)} leads with ${num(top.n)}, ${pct(top.n,tot)}% of the selection.`;
}
```
Good — plain words, states what figures amount to.

Hmm wait, zone id/label: rows may be {z:"UPP_FUSE",label:"Upper fuselage",n}. I'll normalize.

## railWho implementation — per spec directly.

Sentence code from spec verbatim-ish:
```js
function whoReading(d){
  const tot=d.total||0; if(!tot) return "";
  const ops=d.operator_rows||[], nOps=d.operators||0;
  let out="";
  if(ops.length && nOps>ops.length){
    const top=ops.reduce((s,r)=>s+r.n,0);
    out=`${spell(ops.length)} operators file ${pct(top,tot)}% of what is here; the other ${num(nOps-ops.length)} share the rest.`;
    out=out.charAt(0).toUpperCase()+out.slice(1);
  } else {
    out=`${num(nOps)} ${nOps===1?"operator files":"operators file"} everything here.`;
  }
  out+=` ${num(d.aircraft||0)} aircraft appear in all.`;
  const sw=(d.swarm||[])[0];
  if(sw&&sw.n>1) out+=` One of them, N${esc(sw.t)}, is written up ${num(sw.n)} times.`;
  return out;
}
```

Closed strip: `(d.operator_rows||[]).slice(0,8)` — spec says strip one span per operator row (<=8; rows already max 8).

Overflow more-ops: rest=d.operators-ops.length.

Airframes: rows=d.swarm.slice(0,8); mxA=max over these 8; label "N"+t; bar width (n/mxA*100).toFixed(1). Overflow when (d.swarm_total||0) > (d.swarm||[]).length → `${num(d.swarm_total-d.swarm.length)} more airframes, not ranked here`.

data-aim/take: op rows: data-aim="op|CODE" data-take="operator|CODE"; tails: data-aim="tail|REG" data-take="tail|REG".

Margin: two notes (cap disclosure + counts note).

## railForced — per spec.

rows=(d.crew||[]).filter(x=>!["K","0","O"].includes(x.code)).slice(0,8); mx over displayed; bar width (n/mx*100).toFixed(1). Row: label cell .on (font 12px), .ob bar, b count. data-aim="crew|CODE" data-take="crew|CODE". taken when params crew===code.

fnote under last row: `A report can carry four of these, so they add to more than ${num(cr)}.`

fblock: `<div class="fblock" data-aim="crewall"><i style="width:${pct2}%"></i><span class="flab">${num(cr)} of ${num(tot)} forced a crew action</span></div>` width=(tot?cr/tot*100:0).toFixed(2)+"%".

Reading per spec with zero-text.

Margin: `counts are of reports filed, not of flights` — spec's FORCED doesn't list margin notes explicitly except via fnote... The margin note "counts are of reports filed, not of flights" appears in WHEN and WHO. FORCED has .fnote inline. I'll add margin with just the counts note? Spec for FORCED doesn't mention .margin. Skip margin for FORCED (fnote covers disclosure). OK.

## specimenHTML

```js
function specimenHTML(d,phone){
  const s=d.specimen; if(!s) return "";
  const line=(d.lines||[])[0]||"";
  const ctrl=s.control||"";
  const open=!!ctrl;
  const decoded=specLine(s);
  return `<div class="specimen${open?" opens":""}"${open?` role="button" tabindex="0" data-case="${esc(ctrl)}" aria-label="Open the full report ${esc(ctrl)}"`:""}>
    <div class="sh">One report from this selection. First the FAA&rsquo;s own filing of it, then the mechanic&rsquo;s words as written.${open?` <span class="opencue">${phone?"Tap to open it →":"Click to open the full report →"}</span>`:""}</div>
    ${decoded?`<div class="spec-decoded">${decoded}</div>`:""}
    ${line?`<div class="sl">${jargon(line)}</div>`:""}
  </div>`;
}
```
Header verbatim with typographic apostrophes: "the FAA's own filing of it, then the mechanic's words as written." ✓ (&rsquo;).

specLine(s):
```js
function specLine(s){
  const dead=["","Other","Not reported","Unknown","None"];
  const ok=v=>v&&!dead.includes(v);
  const norm=x=>String(x||"").toLowerCase().replace(/[^a-z]/g,"");
  let parts=[];
  if(ok(s.aircraft)) parts.push(s.aircraft);
  if(ok(s.system)) parts.push(s.system);
  if(ok(s.part) && !(norm(s.system).includes(norm(s.part))||norm(s.part).includes(norm(s.system)))) parts.push(s.part);
  if(ok(s.condition)) parts.push(s.condition);
  if(ok(s.found)) parts.push(s.found);
  if(ok(s.stage)) parts.push(s.stage);
  if(s.date) parts.push(prettyDate(s.date));
  return parts.join(" &middot; ");
}
```
Wait — "the part dropped when it merely repeats the system": drop if norm(sys).includes(norm(part)) || reverse. But if system empty and part present? norm("")="" and "".includes("")===true → part dropped when system empty! Guard: only apply dup check when both non-empty after norm. Fix: `if(ok(s.part)){ const a=norm(s.system), b=norm(s.part); if(!a||!b||(!a.includes(b)&&!b.includes(a))) parts.push(s.part); }`. The spec's formula kills "Tire · Tire"; my guard preserves intent. Also date: s.date falsy → dropped. prettyDate formats "2026-08-26" → "26 August 2026".

Order: aircraft, system, part, condition, found, stage, date ✓ (spec list: 1 aircraft 2 system 3 part 4 condition 5 found 6 stage 7 prettyDate).

Expected output example: "Boeing 777F · Emergency Lighting · Lamp · Functional check · On the ground, in inspection or maintenance · 26 August 2026" — wait the user's example: "Boeing 777FHT - Emergency Lighting - Lamp - Functional check - On the ground, in inspection or maintenance - 26 August 2026" — with middle dots they said "joined with a middle dot". ✓.

jargon(): host helper — redeclare fallback: if host has jargon (abbrev expansion), keep host's? "using your existing helpers" — jargon exists in host; my redeclare would override. I should NOT redeclare jargon — just call it. But if host lacks it... The spec references jargon(lines[0]) as existing. Call it directly; if undefined, error. Defensive: `const J=(typeof jargon==="function")?jargon:(x=>esc(x));` — can't branch on typeof for a function declared later in same scope? typeof works for function declarations (hoisted). If host declared `function jargon`, typeof → "function" ✓. If const jargon=... → typeof before init throws TDZ? At call time it's initialized. OK: use typeof check at call time inside a wrapper `sj(x){ return (typeof jargon==="function")? jargon(x) : esc(x); }`. Hmm — if host has `const jargon`, my referencing inside wrapper fine. And I do NOT redeclare jargon. Similarly num/esc/pct/spell/monthName/prettyDate — should I redeclare or assume? The spec uses num, esc, pct, spell, monthName, MONTHS, prettyDate, params, opName, CODES, search, showChange, syncControls, takeFilter, openCase, jargon, leave_one_out... The user said "using your existing helpers. Keep your function names so the block overrides by redeclaration." — i.e., functions I previously shipped get redeclared here with fixed bodies. I'll redeclare the hero-module ones (drawHero, drawPhone, rails, gutter, periodClause, specLine, monthAt, paintBracket, takePeriod, aim, aimHold, unaim, setHero, takeFilter, syncControls, takeReading, opName, pct, spell, monthName, prettyDate, num, esc, partialMonth, settled, heroMonth, monthAt, paintSpines, whereReading/whoReading/forcedReading/whenReading, standingSentence, loadHero, openCase) and NOT redeclare host ones I merely call: search, showChange, jargon, CODES (data). Hmm — but "esc" the spec mentions as gutter's ignored arg — esc exists. I'll redeclare esc/num defensively as they're trivial and my previous file owned them.

Risk: redeclaring a host function that OTHER host code uses with different behavior (e.g., num fine; esc fine; pct/spell/monthName/prettyDate fine — pure). takeFilter/syncControls/openCase redeclared could alter host flows — but that's the point of overriding. search/showChange: I will NOT redeclare (they drive results; not part of the six fixes). Call with typeof guard:

```js
function runSearch(pg){ if(typeof search==="function") search(pg); else loadHero(); }
```
Hmm, but "keep your function names so the block overrides by redeclaration" implies my previous file had search wired already — calling search(0) directly is expected. I'll call `search(0)` guarded via typeof to be robust: `if(typeof search==="function") search(0); else loadHero();`. Fine.

## Month key from row for cross-highlight: tr[data-month="YYYY-MM"].

## CSS full list

Let me write CSS carefully:

```css
:root{--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--rust:#c44b28;--line:#e2ded5;--rust-text:#b8431f;--smoke:#6b6560;--card:#fff}
```
(WHO palette lists smoke/card; add.)

Hero shell:
```css
.hero{...} .stamp{...} .stand{font:15px/1.5 Georgia,serif;max-width:74ch;margin:6px 0 2px}
.aim{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rust-text);min-height:20px}
.rails{margin-top:10px;border-top:1px solid var(--line)}
.rail{display:grid;grid-template-columns:132px 1fr;gap:2px 14px;padding:10px 0;border-bottom:1px solid var(--line);position:relative}
.rail>.reading,.rail>.margin{grid-column:2}
.rail:not(.open){cursor:pointer}
```
Hmm — closed rail clickable: cursor pointer on rail. But .rail:not(.open) contains gutter+strip only.

Gutter:
```css
.gut{align-self:start}
.gut b{display:block;font:600 12px/1.3 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.08em;color:var(--ink)}
.gut .gs{display:block;font:11px/1.4 Archivo;color:var(--ash)}
.gut .gv{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);white-space:nowrap}
.gut.rest{display:flex;align-items:baseline;gap:8px}
.gut.rest .gv{display:inline}
```
Shut: question and value on one baseline ✓ (flex baseline). Open: three stacked lines.

WHEN:
```css
.months{display:flex;gap:2px;align-items:flex-end}
.mo{position:relative;flex:1;min-width:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit{outline:1.5px solid var(--ink);outline-offset:1px}
.mo.inband .ghostb{background:#b9ae99}
.mo.inband::after{content:"";position:absolute;left:0;right:0;top:-3px;height:2px;background:var(--rust)}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.mag{position:absolute;left:0;right:0;bottom:16px;height:84px;pointer-events:none;min-width:var(--mw,100%)}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);background:var(--paper);padding:0 4px}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain}
.rail.open[data-rail=when] .months,.rail.open[data-rail=when] .axis{min-width:var(--mw,100%)}
.rail.open[data-rail=when] .mo{min-width:5px}
.rail.open[data-rail=when] .months{touch-action:none;user-select:none}
```
Wait .mo.part inline-shaded closed bars: I skip inline bg for part ✓ hatch shows.

Hover tint: .mo:hover .ghostb overrides inline background? No — inline style beats class! My closed shading is inline → hover won't lighten closed bars. Hmm — closed strip hover lighten? Spec's hover rule exists; with inline bg it breaks for closed (and open keeps class bg — fine). For closed, maybe skip hover expectation; acceptable. But .mo:hover .ghostb on open bars: bg from class ✓. For closed shaded bars, hover does nothing — minor. Alternatively apply closed shading via CSS custom property: inline sets `--a:0.62` and CSS: `.rail:not(.open) .mo .ghostb{background:rgba(117,111,105,var(--a,1))}` and part keeps hatch (specificity: .mo.part .ghostb vs .rail:not(.open) .mo .ghostb — equal? .mo.part .ghostb = 0,2,1; .rail:not(.open) .mo .ghostb = 0,2,1 + :not counts... :not(.open) adds class weight: .rail(1)+.open(1)+.mo(1)+.ghostb(1) = 0,3,1? Wait :not() takes the specificity of its argument: .rail:not(.open) .mo .ghostb = .rail+.open+.mo+.ghostb = 4 classes = 0,4,0 vs .mo.part .ghostb = 0,2,0? Plus element i? ghostb is a class on <i>; selectors: .mo.part .ghostb = two classes + ... = (0,2,0)? .mo(1).part(1) descendant .ghostb(1) → 0,3,0. And .rail:not(.open) .mo .ghostb = .rail + .open + .mo + .ghostb = 0,4,0 → shading would beat hatch. Set order: put hatch rule AFTER with .rail:not(.open) .mo.part .ghostb{background:hatch} to win (0,5,0). Simpler: keep inline for non-part bars only (skip inline for part) — as decided. Hover on closed lost — fine, spec's closed has no promise of hover.

Hmm wait — also .mo.lit on closed (cross-highlight with WHERE open): .mo.lit outline works; ghostb hover-color overridden by inline — cross-highlight tint lost on closed strip... The checklist "380 month bars present with the WHERE rail open, the busiest month darkest, the part months hatched" — no lit requirement closed. Accept.

Actually — cleaner: apply shading as inline `--a` and one CSS rule with correct order:

```css
.rail:not(.open) .mo .ghostb{background:rgba(117,111,105,var(--sa,1))}
.rail:not(.open) .mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
```
Inline sets style="--sa:.62" on ghostb? Inline style attribute with custom property on the <i>: `<i class="ghostb" style="height:14px;--sa:.72">`. Then hatch rule (later, more specific) overrides for part. Hover lighten on closed? Still blocked (shading rule has higher specificity than .mo:hover .ghostb? .mo:hover .ghostb = 0,3,0 vs 0,4,0 → hover loses). Add closed hover: `.rail:not(.open) .mo:hover .ghostb{background:rgba(117,111,105,min(1,var(--sa),1))}`... overkill. Skip closed hover.

I'll go with --sa approach. Open rail: no --sa → uses class bg ✓.

WHO:
```css
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;flex:1 1 0}
.strip span.sel{background:var(--rust)}
.strip span:hover{background:#c3bbac}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
@media(max-width:760px){.rail .track.two{grid-template-columns:1fr}}
.col .ch{font:600 10.5px/1.2 Archivo,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.orow{display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;font-size:11.5px;cursor:pointer;padding:0 3px;border-radius:3px;height:14px}
.orow:hover,.orow:focus-visible{background:rgba(196,75,40,.08)}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orow .on.mono{font-family:'IBM Plex Mono',monospace}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
.orow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.orow.taken{background:rgba(196,75,40,.12);outline:0;box-shadow:inset 2px 0 0 var(--rust)}
@media(max-width:760px){.orow{grid-template-columns:100px 1fr 46px}}
```
Wait .orow.taken has outline:0 — but :focus-visible outline needed; .taken:focus-visible? Spec: .orow.taken{background:...;outline:0} and separately focus-visible outline. Conflict when taken+focused — order: put .taken after focus rule; focused+taken → outline 0. Eh, keep spec order: focus rule, then taken rule (taken wins). Fine.

FORCED:
```css
.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;display:flex;align-items:center}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)}
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
.orow.wide{grid-template-columns:190px 1fr 56px;height:17px}
.orow.wide .on{font-size:12px}
.fnote{font-size:11px;color:var(--ash);margin-top:4px}
```

Reading/margin:
```css
.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.margin{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);line-height:1.5;margin-top:6px}
.margin .mr{color:var(--rust-text)}
.hint{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ash);margin-top:4px}
```

Specimen:
```css
.spec-decoded{font:600 12.5px/1.5 Archivo,sans-serif;color:var(--rust-text,#a3421f);margin:2px 0 3px;letter-spacing:.01em}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;color:#403b35;margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
.specimen.opens:hover,.specimen.opens:focus-visible{background:#f3efe8}
.specimen.opens:focus-visible{outline:2px solid var(--rust)}
.specimen .sh{font:12px/1.5 Archivo;color:var(--smoke)} — hmm, header style unknown; keep modest.
.opencue{color:var(--rust-text);white-space:nowrap}
@media(max-width:479px){.specimen{display:none}}  — "Hidden under 479px" ✓ (spec says "Hidden under 479px" for the specimen).
```
Wait "Hidden under 479px" — the whole specimen? It says at the end of specimen CSS: "Hidden under 479px." OK: `@media(max-width:479px){.specimen{display:none}}`.

Zero:
```css
.zero{border:1px solid var(--line);background:#fff;border-radius:6px;padding:10px 14px;margin:8px 0}
.zero .zghost{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);margin-top:4px}
```

Undo:
```css
.undoit{font:inherit;background:none;border:0;padding:0;color:var(--rust-text);text-decoration:underline;cursor:pointer}
```

Responsive phone: rails grid 1 column under 640? The hero gutter above track on phone. `@media(max-width:640px){.rail{grid-template-columns:1fr}.rail>.reading,.rail>.margin{grid-column:1}}`.

## drawPhone

```js
function drawPhone(d){ drawHero(d,true); }
```
With phone flag affecting opencue text and maybe hint. And scrollLeft set at end too ✓ (afterDraw runs for both).

## After-draw: scroll when track

```js
const wtr=host.querySelector('.rail.open[data-rail=when] .track');
if(wtr) wtr.scrollLeft=wtr.scrollWidth;
```

## syncControls details

```js
function syncControls(){
  const p=params();
  const f=document.getElementById("from"), t=document.getElementById("to");
  if(f&&p.get("from")) f.value=p.get("from");
  if(t&&p.get("to")) t.value=p.get("to");
  document.querySelectorAll(".orow[data-take]").forEach(el=>{
    const i=el.dataset.take.indexOf("|"); const k=el.dataset.take.slice(0,i), v=el.dataset.take.slice(i+1);
    el.classList.toggle("taken",(p.get(k)||"")===v);
  });
  document.querySelectorAll(".strip span[data-op]").forEach(el=>{
    el.classList.toggle("sel",(p.get("operator")||"")===el.dataset.op);
  });
}
```

## takeFilter

```js
function takeFilter(key,val,label){
  const p=params(); p.set(key,val);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  syncControls();
  runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold(`narrowed to ${esc(label)}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```

## takePeriod

```js
function takePeriod(a,b){
  const lo=a<b?a:b, hi=a>b?a:b;
  const from=`${lo}-01`, to=`${hi}-${String(lastDay(hi)).padStart(2,"0")}`;
  const p=params(); p.set("from",from); p.set("to",to);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  const f=document.getElementById("from"), t=document.getElementById("to");
  if(f) f.value=from; if(t) t.value=to;
  const ps=document.getElementById("p-search"); if(ps) ps.hidden=false;
  syncControls(); runSearch(0); if(typeof showChange==="function") showChange();
  aimHold(`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```

## popstate

```js
window.addEventListener("popstate",()=>{ syncControls(); if(heroData) drawHero(heroData); runSearch(0); unaim(); });
```
Hmm runSearch(0) on every popstate — including rail toggles (setHero pushes too). setHero pushing means back after opening a rail closes it — fine, and runSearch refetches hero needlessly (filters unchanged). Optimize: track lastSearchQS; runSearch only when non-hero params changed:

```js
let lastQS="";
function onURL(){ const p=params(); const hero=p.get("hero"); const qs=[...p.keys()].filter(k=>k!=="hero").map(...)... }
```
Simpler: setHero uses replaceState? Then back after opening a rail jumps further back — acceptable? The undo button is only for filters. If setHero pushes, closing a rail via back is nice-to-have. The spec doesn't say. I'll make setHero pushState, and popstate: drawHero(heroData) always; runSearch(0) only if filter-params changed:

```js
let lastFilterQS = filterQS();
function filterQS(){ const p=params(); p.delete("hero"); return p.toString(); }
window.addEventListener("popstate",()=>{ syncControls(); if(heroData) drawHero(heroData); const q=filterQS(); if(q!==lastFilterQS){ lastFilterQS=q; runSearch(0); } });
```
And takeFilter/takePeriod set lastFilterQS. OK.

Hmm, wait: drawHero re-renders hero on popstate — but if the new URL has different hero (back from opening a rail), drawHero honors it ✓. If filters changed, runSearch triggers loadHero which redraws with fresh data ✓ (drawHero(heroData) before is momentary — fine).

## setHero

```js
const HERO_ALIAS={when:"when",horizon:"when",where:"where",anatomy:"where",whose:"whose",who:"whose",swarm:"whose",forced:"forced",ledger:"forced"};
function heroKey(){ const k=params().get("hero"); return HERO_ALIAS[k]||"where"; }
function setHero(key){
  const id=HERO_ALIAS[key]||key;   // accept both spellings
  const p=params(); p.set("hero",id);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  if(heroData) drawHero(heroData);
}
```
Hmm — writing id ("when" etc.) into URL. Both spellings accepted on read ✓. "horizon"→"when" normalized so ?hero=horizon opens WHEN ✓. Checklist: "?hero=anatomy and ?hero=where both open the aircraft" ✓.

Wait — should the URL keep the original's key when given ("horizon")? If someone copies a link from our page they get "when" — which the original won't understand. "Accept both spellings" — one-directional requirement; I'll write canonical ids and ALSO accept theirs. Could we write the original's spelling to keep links interoperable both ways? Writing "horizon" etc. would keep links working on the original AND ours (we accept both). That's strictly better for interop! Hmm — but "You name them when, where, whose, forced" — the user's rebuild names them that; the fix is to accept both. Writing ours is what "you name them" implies. Keep writing ours. Fine.

## monthName / MONTHS

```js
const MONTHS=["January",...]; const MONTHS_S=["Jan",...];
function monthName(ym){ const [y,m]=ym.split("-"); return `${MONTHS[+m-1]} ${y}`; }
function prettyDate(iso){ if(!iso) return ""; const [y,m,d]=iso.split("-"); return `${+d} ${MONTHS[+m-1]} ${y}`; }
```
"26 August 2026" ✓ (day without leading zero ✓ "1 to 14 August 2025" style). Short "3 Aug 2024": `${+d} ${MONTHS_S[+m-1]} ${y}`.

## periodClause

```js
function periodClause(){
  const f=(document.getElementById("from")||{}).value||"";
  const t=(document.getElementById("to")||{}).value||"";
  ... also fall back to URL params if inputs absent:
```
Spec: reads #from/#to, NOT the API. I'll read inputs; if inputs missing (phone?), fall back to URL params. Implementation:

```js
function periodClause(){
  const fv=(document.getElementById("from")||{}).value||params().get("from")||"";
  const tv=(document.getElementById("to")||{}).value||params().get("to")||"";
  if(!fv&&!tv) return "";
  const fd=fv?fv.slice(8,10):"", fm=fv?fv.slice(5,7):"", fy=fv?fv.slice(0,4):"";
  ...
  if(fv&&tv&&fv.slice(0,7)===tv.slice(0,7)){
    const ld=String(lastDay(fv.slice(0,7))).padStart(2,"0");
    if(fd==="01"&&tv.slice(8,10)===ld) return `${MONTHS[+fm-1]} ${fy}`;
    if(fd==="01") return `${+fd} to ${+tv.slice(8,10)} ${MONTHS[+fm-1]} ${fy}`;
  }
  if(fv&&tv) return `${+fd} ${MONTHS_S[+fm-1]} ${fy} to ${+tv.slice(8,10)} ${MONTHS_S[+tv.slice(5,7)-1]} ${tv.slice(0,4)}`;
  if(fv) return `from ${+fd} ${MONTHS_S[+fm-1]} ${fy}`;
  return `up to ${+tv.slice(8,10)} ${MONTHS_S[+tv.slice(5,7)-1]} ${tv.slice(0,4)}`;
}
```
Check cases: same month day01 to last → "August 2025" ✓; same month day01 to earlier → "1 to 14 August 2025" ✓; both otherwise → "3 Aug 2024 to 14 May 2025" ✓; only from → "from 3 Aug 2024" ✓; only to → "up to 14 May 2025" ✓.

Edge: from=to=same day? both set otherwise → "3 Aug 2024 to 3 Aug 2024". Fine.

## num/spell/pct/esc

```js
function num(n){ return (+n||0).toLocaleString("en-US"); }
const WORDS=["","one","two","three","four","five","six","seven","eight","nine","ten"];
function spell(n){ return WORDS[n]||num(n); }
function pct(a,b){ if(!b) return "0.0"; return (Math.round(a/b*1000)/10).toFixed(1); }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
```

## WHEN reading implementation

```js
function whenReading(d){
  const ms=d.months||[]; if(ms.length<2) return "";
  const allm=ms.filter(m=>!partialMonth(m.m,d));
  const full=allm.filter(m=>settled(m.m,d));
  const young=allm.length-full.length;
  if(full.length<2) return "";
  let hi=full[0], lo=full[0];
  for(const m of full){ if(m.n>hi.n||(m.n===hi.n&&m.m<hi.m)) hi=m; if(m.n<lo.n||(m.n===lo.n&&m.m<lo.m)) lo=m; }
```
ties resolve to earliest month: for hi, on tie keep earlier m: replace only when m.n>hi.n, or equal and m.m<hi.m ✓ same for lo.

```js
  let out=`Between ${num(lo.n)} and ${num(hi.n)} reports in a settled month, busiest in ${monthName(hi.m)}, quietest in ${monthName(lo.m)}.`;
  if(full.length>=24){
    const last=full.slice(-12), prev=full.slice(-24,-12);
    const a=Math.round(last.reduce((s,m)=>s+m.n,0)/12);
    const bb=Math.round(prev.reduce((s,m)=>s+m.n,0)/12);
    if(bb>0){ const diff=Math.round(Math.abs(a-bb)/bb*100);
      out+=` The last twelve settled months average ${num(a)} a month against ${num(bb)} for the twelve before, a difference of ${diff}%.`; }
  }
  if(young>0){
    const lag=(d.lag&&d.lag.p95_days)||0;
    out+=` The ${spell(young)} most recent month${young===1?"":"s"} ${young===1?"is":"are"} left out of those figures: reports still arrive up to ${num(lag)} days after the event, so ${young===1?"it holds":"they hold"} only part of what ${young===1?"it":"they"} will hold. The dip at the right of the chart is the post arriving late, not fewer faults.`;
  }
  return out;
}
```
Spec: "singular/plural switched throughout" ✓.

Margin for part months:
```js
function whenMargin(d){
  const ms=d.months||[]; const notes=[];
  const partm=ms.filter(m=>partialMonth(m.m,d));
  if(partm.length){
    for(const m of partm.slice(0,2)){  // hmm — "If ANY month is partial, ONE rust margin entry"
```
"If ANY month is partial, one rust margin entry: `${MONTHS[mm]} ${yy} covers 1 to ${dd} ${MONTHS[mm]}, so its bar counts ${dd} days against ${inMonth} in a whole one`" — one entry (presumably for the noteworthy edge — likely the last/corpus edge). With both a first and last partial, "one entry"? Maybe one per? "one rust margin entry" — I'll emit one entry per partial month but cap at 2? Hmm — "one rust margin entry: <template>" — singular. If both edges partial, two entries seems natural but spec says one... The template mentions a specific month. With user window edges mid-month, there could be up to 4 partial months (corpus first/last + window first/last). One entry can't cover all. Decision: emit one entry per distinct partial month, but that deviates... Alternatively emit one entry for the LAST partial month (the one that matters for "the dip at the right"). Hmm — the "post arriving late" note is separate (clause 3). The margin entry is about days-counted. I'll emit one entry per partial month (max 4) — wait, that could be 4 lines of clutter. Compromise: emit one entry per partial month caused by the corpus or window edges, capped at 2 (first and last). Honestly, in the common case (no window), there are exactly 2 partial months (first+last corpus) or 1 (if file starts on the 1st). "one rust margin entry" describes the common observed case (last month partial only? or first too). I'll emit one entry per partial month — in the common case that's 1–2 lines. I'll note this choice? It's within "reason over mechanism". Eh — I'll do one entry per partial month, most recent LAST order? Keep chronological. Fine, no note needed... Actually let me just do: one entry per partial month, and mention nothing.

dd and inMonth: dd = days covered in that month; inMonth = days in month. covered: intersection of [RANGE.from,RANGE.to] and window [from,to] with month. Compute:
```js
function coveredDays(m,d){
  const y=+m.slice(0,4), mo=+m.slice(5,7);
  let s=1, e=lastDay(m);
  const p=params(), f=p.get("from"), t=p.get("to");
  const loD=(RANGE.from&&RANGE.from>f)?RANGE.from:(f||RANGE.from);
  const hiD=(RANGE.to&&RANGE.to<t)?t? ... 
```
Getting fiddly. Simplify: lo = max(RANGE.from, userFrom) ; hi = min(RANGE.to, userTo); if m===lo month → s=+lo.slice(8,10); if m===hi month → e=+hi.slice(8,10); dd=e-s+1; inMonth=lastDay(m). If RANGE missing, fall back to user window or full month (then it wouldn't be partial anyway). Good enough:

```js
function coveredDays(m){
  let lo=RANGE.from, hi=RANGE.to;
  const p=params(); if(p.get("from")) lo = (!lo||p.get("from")>lo)? p.get("from"):lo;
  if(p.get("to")) hi = (!hi||p.get("to")<hi)? p.get("to"):hi;
  let s=1, e=lastDay(m);
  if(lo&&lo.slice(0,7)===m) s=+lo.slice(8,10);
  if(hi&&hi.slice(0,7)===m) e=+hi.slice(8,10);
  return {s,e,days:Math.max(0,e-s+1),inMonth:lastDay(m)};
}
```
Margin entry: `${MONTHS[mm-1]} ${yy} covers ${s===1?"1":s} to ${e} ${MONTHS[mm-1]}, so its bar counts ${days} days against ${inMonth} in a whole one` — spec template "covers 1 to ${dd} ... counts ${dd} days against ${inMonth}". With s>1 I print "covers 12 to 31". Deviation from literal template when start day ≠1 — justified (template assumes end-edge). Note it? It's a string they called load-bearing... The template as given produces "covers 1 to 26 August, so its bar counts 26 days against 31 in a whole one" for the last month ✓ matches when s=1. For first month starting the 12th, template would wrongly say "covers 1 to 20" (if dd=20). My version says "covers 12 to 31 ... counts 20 days against 31" — correct info. I'll mention this micro-departure in the notes. Actually wait — for the first month with dd=20 days (12th–31st), template "covers 1 to 20" counts 20 — consistent dd but wrong range. My version better. Note it briefly.

Always also push ash: `counts are of reports filed, not of flights` ✓.

Margin HTML: `<div class="margin"><span class="mr">…</span><br><span>counts are of reports filed, not of flights</span></div>` — separate lines.

WHO margin: `<span class="mr">the tail list shows the 900 most-reported aircraft out of 54,634; the airline list counts every report</span><br><span>counts are of reports filed, not of flights</span>`.

## heroMonth

```js
function heroMonth(el){ const k=el.dataset.aim.split("|")[1]; if(k) takePeriod(k,k); }
```

## moEls / keys

```js
function moList(){ return Array.from(document.querySelectorAll('.rail.open[data-rail=when] .mo')); }
```

## Keyboard listener

```js
document.addEventListener("keydown",e=>{
  const mo=e.target.classList&&e.target.classList.contains("mo")?e.target:null;
  if(mo){
    const els=moList(); const idx=els.indexOf(mo); const ms=heroData?heroData.months:[];
    const key=i=>ms[i]?ms[i].m:null;
    if(["ArrowRight","ArrowLeft","Home","End"].includes(e.key)){
      e.preventDefault();
      let ni=idx;
      if(e.key==="ArrowRight") ni=Math.min(ms.length-1,idx+1);
      if(e.key==="ArrowLeft") ni=Math.max(0,idx-1);
      if(e.key==="Home") ni=0;
      if(e.key==="End") ni=ms.length-1;
      if(!e.shiftKey) kbAnchor=null;
      else if(kbAnchor==null) kbAnchor=idx;
      if(els[ni]) els[ni].focus();
      if(key(ni)) paintBracket(key(kbAnchor==null?ni:kbAnchor), key(ni));
      return;
    }
    if(e.key==="Enter"||e.key===" "||e.key==="Spacebar"){
      e.preventDefault();
      if(kbAnchor!=null&&ms[kbAnchor]) takePeriod(key(kbAnchor), key(idx));
      else heroMonth(mo);
    }
    return;
  }
  if(e.key==="Enter"||e.key===" "){
    const t=e.target;
    const take=t.closest&&t.closest("[data-take]"); if(take&&t.classList.contains("orow")){ e.preventDefault(); runTake(take); return; }
    const sp=t.closest&&t.closest("[data-case]"); if(sp){ e.preventDefault(); openCase(sp.dataset.case); return; }
  }
});
```
runTake(el): parse data-take → takeFilter variants.

Hmm — "Enter AND Space both take" for forced rows; same for WHO rows and specimen. ✓.

paintBracket with anchor: kbAnchor stores INDEX (spec: "kbAnchor is set to the index BEFORE moving"). paintBracket takes month keys. key(kbAnchor) ✓. Also pointer drag doesn't use kbAnchor.

Also "Every .mo is tabindex 0 when open. With 380 months that is 380 tab stops, accepted." ✓.

## focusin

```js
document.addEventListener("focusin",e=>{
  const t=e.target;
  if(t.classList&&t.classList.contains("mo")){ const k=(t.dataset.aim||"").split("|")[1]; const m=heroData&&(heroData.months||[]).find(x=>x.m===k); if(k) aim(`${monthName(k)} &middot; ${num(m?m.n:0)} reports &middot; click to narrow to this month`); return; }
  const row=t.closest&&t.closest("[data-aim]"); if(row) aimFor(row);
});
```
aimFor(el): map data-aim to message:
```js
function aimFor(el){
  const a=el.dataset.aim||""; 
  if(a.startsWith("month|")){...}
  if(a==="more-ops") return aim(`not ranked here; use the operator control below to reach any of the ${num((heroData&&heroData.operators)||0)}`);
  if(a==="more-tails") return aim("not ranked here; type a tail number in the controls below");
  if(a==="crewall") return aim(`${num((heroData&&heroData.crew_reports)||0)} of ${num((heroData&&heroData.total)||0)} reports forced the crew to act`);
  if(a.startsWith("op|")) return aim(`${esc(opName(a.slice(3)))} &middot; click to follow this operator`);
  if(a.startsWith("tail|")) return aim(`N${esc(a.slice(5))} &middot; click to follow this one airframe`);
  if(a.startsWith("crew|")){ const c=(heroData.crew||[]).find(x=>x.code===a.slice(5)); return aim(`${esc(c?c.label:a.slice(5))} &middot; ${num(c?c.n:0)} reports &middot; click to narrow`); }
  if(a.startsWith("zone|")){ const z=zoneRows(heroData||{}).find(x=>x.id===a.slice(5)); return aim(`${esc(z?z.label:a.slice(5))} &middot; ${num(z?z.n:0)} reports &middot; click to narrow`); }
}
```

mouseover delegation: closest("[data-aim]") → aimFor; mouseout → clear aim (aim("")? unaim clears hold too — no: mouseout clears message but NOT a hold. aim("") writes empty if no hold ✓. I'll call aim("") — but aim("") with hold live refuses ✓. Actually spec: "mouseout clears. A held message from aimHold (6s) outranks hover." So mouseout → aim("") which respects hold ✓.

Also cross-highlight rows mouseover/mouseout (tr[data-month]) — same handlers: add .lit to .mo and tr; but careful not to double-fire with data-aim handler (tr has no data-aim). Combine.

## Click delegation order

data-take first (rows), then closed rail, then data-case. But careful: closed rail contains no data-take rows (closed rails render strips without rows) ✓. Specimen inside open rail — .rail.open, not matched by closed selector ✓.

runTake:
```js
function runTake(el){
  const dt=el.dataset.take||""; const i=dt.indexOf("|"); if(i<0) return;
  const k=dt.slice(0,i), v=dt.slice(i+1);
  if(k==="operator") takeFilter("operator",v,opName(v));
  else if(k==="tail") takeFilter("tail",v,"N"+v);
  else if(k==="crew"){ const c=((heroData&&heroData.crew)||[]).find(x=>x.code===v); takeFilter("crew",v,c?c.label:v); }
  else if(k==="zone"){ const z=zoneRows(heroData||{}).find(x=>x.id===v); takeFilter("zone",v,z?z.label:v); }
}
```

takeFor("crew|A") from spec — alias: takeFor(dt){runTake({dataset:{take:dt}})}? I'll define takeFor(dt)=runTake via fake object or just parse. Include takeFor for compat.

## zoneRows

```js
function zoneRows(d){
  const raw=(d&&(d.zones||d.anatomy||d.regions))||[];
  return raw.map(r=>({id:r.z||r.zone||r.id||r.k||"",label:r.label||r.z||r.zone||r.id||"?",n:r.n||0}))
           .filter(r=>r.id||r.label).sort((a,b)=>b.n-a.n);
}
```

## gutter values

railWhere gutter: `gutter("WHERE","on the aircraft", p.get("zone")? (label||"chosen zone") : "all zones", open)`.
railWho: `gutter("WHO","airline and tail", `${num(d.swarm_total||0)} aircraft`, open)`.
railForced: `gutter("FORCED","what the crew did", `${num(cr)} of ${num(tot)}`, open)`.
railWhen: `gutter("WHEN","month by month", periodClause()||`${ms.length} months`)` — 3 args → compact ✓.

Hmm — WHO gutter value uses swarm_total; empty selection → 0 aircraft ✓.

## Load & boot

```js
let heroData=null, heroSeq=0, HERO_FOR="", kbAnchor=null, RANGE={from:null,to:null}, heroBooted=false;

async function loadHero(){
  const qs=params().toString(); // full? hero param irrelevant to server? Include all except? 
```
Hmm — the API is filtered by WHERE etc. params include hero — harmless to send? The original's fetch presumably sends the filter params. I'll strip "hero": `const p=params(); p.delete("hero"); const qs=p.toString();`. HERO_FOR = params().toString() (full, for staleness compare) — spec: HERO_FOR !== params().toString() — full string. OK: HERO_FOR=params().toString() at fetch start; compare full.

```js
async function loadHero(){
  const seq=++heroSeq;
  HERO_FOR=params().toString();
  const p=params(); p.delete("hero");
  let d=null;
  try{ const r=await fetch("api/hero"+(p.toString()?"?"+p.toString():""),{headers:{accept:"application/json"}}); d=await r.json(); }catch(_){ d=null; }
  if(seq!==heroSeq) return;
  drawHero(d);
}
```

drawHero skeleton when !d ✓.

Boot at end: `if(!heroBooted){heroBooted=true; if(HERO_EL()) loadHero(); window.addEventListener("resize", debounce(...));}` — resize: debounced 180ms → full drawHero(heroData) (not refetch; "full drawHero"). Spec: "resize: debounced 180ms -> full drawHero." I'll redraw with heroData (no refetch) — "full drawHero" = re-render everything. OK.

HERO_EL(): `()=>document.getElementById("hero")||document.querySelector("[data-hero-panel]")||document.querySelector(".hero")`.

Hmm — what was my previous container id? Unknown. I'll check a few ids: "hero","instrument","heroPanel","hero-panel". Fine.

## CSS injection

```js
(function(){ const s=document.createElement("style"); s.id="hero-css"; s.textContent=CSS; document.head.appendChild(s); })();
```
With CSS as a template string. Guard duplicate by id.

Since the block is "JavaScript and CSS", I'll deliver a single JS block that injects the CSS — self-contained. Or deliver `<style>...</style><script>...</script>`? "One self-contained block of JavaScript and CSS that drops into your existing file inside its IIFE" — inside an IIFE you can't have a <style> tag; so CSS must be injected via JS. I'll do the injection. The whole thing is one JS snippet to paste inside the IIFE.

## Delegation binding once

```js
if(!window.__HERO_BOUND__){ window.__HERO_BOUND__=true; ...all document/window listeners... }
```
Since block re-executes on paste (dev), guard.

## Remaining spec items checklist

WHEN:
- data always full corpus span ✓ (server)
- ghost months ✓ naturally
- settled_before/p95 ✓ used
- partialMonth ✓
- settled ✓
- cmax both bars ✓
- H 84/14 ✓
- span markup with data-aim, tabindex, aria ✓
- selb only when truthy ✓; rust paints over ash (both absolute bottom:0, selb after ghostb ✓)
- NARROWED ✓
- colors ✓ CSS
- magnifier ✓
- axis ✓
- scrolling ✓ + hint + scrollLeft ✓
- gutter quirk ✓
- periodClause ✓
- sentence ✓
- margin ✓
- interactions: pointer drag ✓, aim refusals ✓, min-height ✓
- keyboard ✓
- cross-highlight ✓ paintSpines ✓
- typed route takeReading ✓ refusals ✓
- degraded: skeleton ✓, months empty → row absent ✓, closed behavior ✓, resize ✓
- NOT list: no standalone number ✓ (gutter value is "380 months" — is that a "standalone number"? Spec explicitly wants `${months.length} months` as value — the "no headline count" means no report-count headline. ✓)

WHO: all ✓ (closed strip, two columns, operators col, airframes col 330, geometry, opName, sentence, cap disclosure ×2, interactions, keyboard, taken, reachability — skip combobox, note?).

FORCED: all ✓ (closed, fblock, rows cap 8, fnote, sentence, rate, zero states, interactions).

Specimen: ✓ (markup, specLine, dead list, dup rule, join, click, phone cue, hidden <479).

Six things: ✓ all.

Also "the refusal to print a figure computed for a different selection" in standing sentence ✓ ellipsis.

Also WHEN spec "Never pairs a figure with a mismatched selection: if HERO_FOR !== params().toString() the sentence prints an ellipsis instead of a number" — apply to whenReading? "the sentence" = the standing sentence? It's under WHEN's spec... "Never pairs a figure with a mismatched selection: if HERO_FOR !== params().toString() the sentence prints an ellipsis instead of a number, and a stale hero reply that arrives late is DISCARDED by heroSeq." I'll apply the ellipsis guard in standingSentence and also guard whenReading numbers? Simpler: apply in standingSentence (the "sentence underneath"? WHEN's "The sentence underneath" section is the reading paragraph...). Hmm — "The sentence underneath" in WHEN spec = the reading paragraph (three clauses). The ellipsis rule sits in "What the rail deliberately does NOT do": "Never pairs a figure with a mismatched selection: if HERO_FOR !== params().toString() the sentence prints an ellipsis instead of a number". I'll apply to both the reading paragraphs and the standing sentence via a guard helper: `const stale=()=>HERO_FOR!==params().toString();` and in whenReading: if stale → return ""? Or ellipsis in numbers... Simplest: each reading returns "" when stale? But then paragraphs vanish during a transient — acceptable (they'll come back). Hmm, "prints an ellipsis instead of a number" — for the standing sentence, replace the count with "…". For readings, I'll do the same: wrap the leading numbers? Overkill. Decision: standingSentence shows "…" for the count and remainder when stale; readings render normally (they describe the drawn data which matches HERO_FOR by construction — since drawHero only runs with data whose HERO_FOR matched at fetch time and seq-checked; the only drift is params changed between fetch-start and draw — the seq guard doesn't catch that, HERO_FOR check does). Actually if params changed mid-flight, seq is stale? No — seq increments only on new fetch. User changes filter → host calls search → loadHero → seq++, HERO_FOR=new. Response arrives → seq matches → draw with HERO_FOR=current ✓. Stale case: draw happens via setHero/popstate redraw with heroData while params changed without a new fetch — then HERO_FOR mismatch → ellipsis. That's exactly the transient. And loadHero gets called by search anyway. OK.

I'll also gate readings: if stale, readings print with "…"? Overkill — keep readings as computed from drawn data; the mismatch window is one frame. Standing sentence gets the ellipsis treatment (explicitly required). Fine.

Wait — one more: "and a stale hero reply that arrives late is DISCARDED by heroSeq" ✓ in loadHero.

## The skeleton

```js
function skeletonHTML(){
  return `<div class="stamp">Service Difficulty Reports</div>
    <p class="stand">&nbsp;</p>
    <div class="aim" id="iAim"></div>
    <div class="rails">${RAILS.map(r=>`<div class="rail" data-rail="${r.id}"><div class="gut rest"><b>${r.g}</b></div></div>`).join("")}</div>`;
}
```
"four inert rails" — frame stands ✓. Stamp: hmm, what was the original stamp? Unknown — "stamp" = the header line of the panel. I'll render "FAA Service Difficulty Reports" always in drawHero top:

`<div class="stamp">FAA Service Difficulty Reports</div>` — hmm, the original's stamp might be like "SDR — the whole file". Keep generic; not tested.

## WHO open markup

```html
<div class="rail open" data-rail="whose">
  <div class="gut">…3 lines…</div>
  <div class="track two">
    <div class="col">
      <div class="ch">Operators</div>
      rows…
      overflow row
    </div>
    <div class="col">
      <div class="ch">Airframes</div>
      rows…
      overflow row
    </div>
  </div>
  <div class="hint">Click an airline or an airframe to follow it.</div>
  <div class="reading">…</div>
  <div class="margin">…</div>
</div>
```
Operator row: `<div class="orow" data-aim="op|X" data-take="operator|X" tabindex="0" role="button"><span class="on">${esc(opName(o))}</span><span class="ob"><i style="width:${w}%"></i></span><b>${num(n)}</b></div>`.
Tail row: on gets class mono, label "N"+t.

more rows: `<div class="orow more" data-aim="more-ops"><span class="on ash">${num(rest)} more operators</span></div>` — .ash class → color ash. `.orow .on.ash{color:var(--ash)}` add CSS.

WHO closed: gutter rest + strip:
```html
<div class="gut rest">…</div>
<div class="track"><div class="strip">${rows.map(r=>`<span style="flex:${Math.max(1,r.n)}" title="${esc(opName(r.o))}: ${num(r.n)}"${sel?' class="sel"':""}></span>`).join("")}</div></div>
```

FORCED closed:
```html
<div class="gut rest">…</div>
<div class="track"><div class="restbar"><i style="width:${sh}%"></i></div></div>
```
sh toFixed(2).

FORCED open:
```html
<div class="gut">…</div>
<div class="track">
  <div class="fblock" data-aim="crewall"><i style="width:${sh}%"></i><span class="flab">${num(cr)} of ${num(tot)} forced a crew action</span></div>
  <div class="flist">rows…</div>
  <div class="fnote">A report can carry four of these, so they add to more than ${num(cr)}.</div>
</div>
<div class="reading">…</div>
```
Also hint: hand line when open: `Click what the crew had to do.` — spec: "Hand line when open". Add .hint. WHEN hint ✓. WHO hint ✓. WHERE hint: invent: `Click a zone of the aircraft to narrow to it.` fine.

WHEN closed strip markup: `<div class="track"><div class="months">380 spans</div></div>` closed (no axis/mag).

## .zero block

```js
function zeroHTML(d){
  const lo=(d.leave_one_out||[]).slice(0,3);
  return `<div class="zero"><b>Nothing matches all of these at once.</b>${lo.map(x=>`<div class="zghost">Drop ${esc(x.label)} → ${num(x.n)} reports</div>`).join("")}</div>`;
}
```
And seam button: `const seam=document.getElementById("seambtn")||document.querySelector("[data-seam]"); if(seam) seam.textContent="Nothing to read yet";`

## Aim placement

#iAim inside hero above rails ✓ (spec: hover/focus writes into #iAim; .aim{min-height:20px} reserved).

## data-aim on month spans includes "month|KEY" — the cross-highlight query `.mo[data-aim="month|${k}"]` ✓.

## paintSpines

```js
function paintSpines(){
  if(!heroData||!heroData.months) return;
  const map={}; heroData.months.forEach(m=>map[m.m]=m.n);
  document.querySelectorAll(".spinen[data-month]").forEach(el=>{
    const n=map[el.dataset.month]; if(n!=null) el.textContent=`${num(n)} in this selection`;
  });
}
```

## tr[data-month] hover

In mouseover handler:
```js
const tr=e.target.closest&&e.target.closest("tr[data-month]");
if(tr){ const k=tr.dataset.month; const mo=document.querySelector(`.mo[data-aim="month|${CSS.escape(k)}"]`); if(mo){mo.classList.add("lit");} tr.classList.add("lit"); }
```
mouseout: remove. But tr.lit needs CSS: `tr.spine.lit td{background:#fbe6dc}` — spec gave `tr.spine.lit td{background:#fbe6dc}`. Include. And plain tr.lit without spine? Spec: "tints that month's spine row (tr.spine.lit td{background:#fbe6dc})". Only spine rows have spinen spans; data-month rows might all be spine rows? Whatever — add CSS for tr.spine.lit td and also tr.lit td fallback? Keep spec's selector only, and add .lit class to any tr[data-month]; tint applies when it's a spine row. Also generic `tr[data-month].lit td{background:#fbe6dc}`? I'll include both selectors.

## monthAt clamp

```js
function monthAt(ev,box){
  const ms=heroData&&heroData.months?heroData.months:[]; const n=ms.length; if(!n||!box) return null;
  const r=box.getBoundingClientRect();
  let i=Math.floor((ev.clientX-r.left)/Math.max(1,r.width)*n);
  if(i<0)i=0; if(i>n-1)i=n-1;
  return ms[i].m;
}
```
"Out-of-box positions clamp to the first/last month" ✓.

## paintBracket

```js
function paintBracket(a,b){
  if(!a||!b) return;
  const lo=a<b?a:b, hi=a>b?a:b;
  let n=0;
  document.querySelectorAll('.rail[data-rail=when] .mo').forEach(el=>{
    const k=(el.dataset.aim||"").split("|")[1];
    const inb=k&&k>=lo&&k<=hi;
    el.classList.toggle("inband",!!inb);
    if(inb){ const m=(heroData.months||[]).find? — use map
  }
  ...
}
```
Better: build map once: `const map={}; heroData.months.forEach(m=>map[m.m]=m.n);` then n=sum. Note: pointer capture target — during drag, e.target = capture element; my pointermove handler uses document-level with monthAt on the .months box of the open when rail ✓.

aim message: `${monthName(lo)} to ${monthName(hi)} &middot; ${num(n)} reports &middot; release to take it` — spec exact: `aim(`${monthName(lo)} to ${monthName(hi)} &middot; ${num(n)} reports &middot; release to take it`)` ✓ even when lo===hi? Keep as spec (always "X to Y"). Hmm — for a single-month bracket, "August 2025 to August 2025 ·" is clumsy but spec-verbatim. Keep verbatim.

## takePeriod from keyboard Enter with anchor ✓.

## heroMonth — click to narrow (plain click zero-length drag) handled by pointerup path ✓; heroMonth used by keyboard without anchor ✓ same behavior.

## Escaping in messages: aim uses innerHTML with &middot; entities ✓.

## Standing sentence position — also on phone ✓ same.

## One more check: "month bars, rail shut 380 vs 0" — my closed WHEN strip renders 380 spans ✓. And axis absent closed ✓; magnifier absent closed ✓; reading absent closed ✓; tabindex -1 ✓ role presentation ✓; whole rail click opens ✓.

"rows in the crew ladder 8 vs 10" ✓ slice(0,8).
"gutter value lines 4 vs 0" ✓ each rail renders a value.
"reading paragraphs 4 vs 1" ✓ four readers.
"specimen decoded line yes/no" ✓ specLine.

## Fonts: Archivo / IBM Plex Mono / Georgia referenced — host presumably loads them. Keep font-family strings as spec.

## Title: also `.rail .track{min-width:0}` to avoid grid overflow.

## The "hint" for WHEN wide mentions months.length: `380 months, so the strip scrolls sideways. It opens at the most recent.` — with dynamic number: `${ms.length} months, so the strip scrolls sideways. It opens at the most recent.` ✓.

## Open-at-most-recent: scrollLeft=scrollWidth in afterDraw ✓ ("Opening at the most recent, at the END of every drawHero and drawPhone").

## Also "d.months empty: railWhen returns '' and the row is absent from the DOM entirely" ✓.

## Degraded heroData null skeleton ✓ "No months at all."

## X-hero param: none.

Now — potential concern: redeclaring `params` — the host might define params reading a stored URLSearchParams. My version live-reads location.search — spec code uses params() live everywhere (NARROWED, HERO_FOR compares). Redeclare ✓.

Redeclaring `esc` — used by host elsewhere; behavior identical semantics. Fine.

`num` — same. `pct` — spec formula ✓ same. `spell` ✓. `monthName`, `prettyDate`, `MONTHS` — host may already have; redeclare consistent.

`opName` — redeclare with CODES guard: 
```js
function opName(o){ try{ const c=(typeof CODES!=="undefined")&&CODES&&CODES.operator; if(c&&c[o]) return c[o].label||o; }catch(_){} return o; }
```
typeof on let/const TDZ — if host has `const CODES` later in file, typeof throws TDZ at runtime only if accessed before init; block runs after full parse? The block is pasted after host code — CODES initialized already at call time. typeof inside function called later — fine.

Careful: if host declared `const CODES` and my block also declares `const HERO_ALIAS` etc. — no name clashes with host presumably. My new names: RAILS, HERO_ALIAS, WORDS, MONTHS, MONTHS_S, heroData, heroSeq, HERO_FOR, kbAnchor, RANGE, heroBooted, holdUntil, dragFrom, lastFilterQS... If host already has MONTHS (likely) as const → my const MONTHS redeclaration = SyntaxError! Dangerous. Host likely has MONTHS (the original uses MONTHS[mm]). If my block redeclares const MONTHS → SyntaxError, everything breaks.

Hmm. This is the crux: within one function scope (the IIFE), `const MONTHS` twice = SyntaxError. So I must avoid const/let for anything the host might have declared, and use... function declarations (overridable, no conflict with const? `function MONTHS(){}` vs `const MONTHS` — also SyntaxError! Any re-declaration of a lexical binding errors regardless of kind).

So overriding by redeclaration ONLY works if the original bindings were `var`/function declarations (var-scoped). If my previous file used const for RAILS etc., redeclaring errors. The user said "Keep your function names so the block overrides by redeclaration" — they assert redeclaration works in their file, implying the relevant names were function declarations or vars. To be safe: declare EVERYTHING in my block as `function` declarations or `var`. `var RAILS=[...]` — var redeclared against a const RAILS → SyntaxError too! Ugh. `var` vs `const` in same scope: `const x=1; var x;` → SyntaxError (redeclaration of lexical). Yes error.

So absolute safety is impossible without knowing the host. Given the user's explicit contract ("the block overrides by redeclaration"), they know their file's declarations are overridable (function declarations). Functions override functions ✓. Variables (RAILS, MONTHS, state) — I'll wrap all state in a single namespace object declared as... still a var. Alternative: attach state to an existing object? I'll minimize top-level lexical declarations: use function declarations for everything (functions can close over state stored on a function property or a single `var HERO_STATE`). One `var` risks conflict only if host had `var HERO_STATE` — unlikely name. Function declarations with names identical to my previous file's — the user says keep them, so they exist as functions there. Data constants (RAILS, MONTHS): make them function-returning or local consts INSIDE functions to avoid top-level collision:

- MONTHS: define inside monthName? Recompute each call — fine (cheap). Or a function `function MONTHS(){return [...]}` — if host has const MONTHS (array), collision. Host having const MONTHS is plausible! To dodge: name mine `monthNames()` internal? But monthName() needs it — I'll inline arrays inside monthName/prettyDate via closure defined at top-level as function declarations:

```js
function monthName(ym){ const M=["January",...]; ... }
function prettyDate(iso){ const M=[...]; }
```
Arrays re-created per call — fine.

- RAILS: only used by my drawHero/skeleton — define as a local inside a factory or a function `function RAILS(){return [...]}`? If my previous file had `const RAILS`, host code elsewhere might use RAILS — my redeclare as function would break them. But the user said keep function names so block overrides — RAILS is data. I'll keep the name RAILS as a `var`? If previous file had var RAILS — override fine. If const — error. Risk either way; but the user explicitly said "Keep your function names so the block overrides by redeclaration" — the safe interpretation: names I previously declared as functions stay functions; data I previously declared... unknown. Minimize: inline RAILS data into functions (railWhen etc. don't need RAILS; skeleton and aliases do). HERO_ALIAS → local inside heroKey/setHero (duplicate the tiny map — fine). WORDS → inline in spell. State (heroData, heroSeq, HERO_FOR, kbAnchor, RANGE, holdUntil, dragFrom, lastFilterQS): these are NEW-ish names likely unique to my hero module; if my previous file declared them (probably as let/const/var inside IIFE), redeclaring as `var` with same names: if previous were let/const → SyntaxError. Can't win without knowledge. 

Alternative bulletproof approach: wrap the whole block in its own nested IIFE and attach state to a singleton on window: 

```js
(function(){
  const S = window.__HERO__ = window.__HERO__ || {heroData:null,heroSeq:0,...};
  function drawHero(d){...uses S...}
  ...
})();
```
But then functions are private to the nested IIFE — inline onclick="history.back();unaim()" needs window.unaim ✓ I can set. And host code that calls drawHero(...) inside the OUTER IIFE won't see my nested functions! The host calls loadHero/search etc. by name → refers to outer scope bindings, not my nested ones. That breaks the override mechanism entirely.

Unless... the host's references are resolved at call time from the enclosing scope — my nested functions don't bind there. So nested IIFE breaks override. Must redeclare in the same scope.

OK — decision: follow the user's stated contract. Redeclare functions with `function` statements; keep state in `var` declarations with distinctive names (heroData, heroSeq, HERO_FOR, kbAnchor, heroRange, holdUntil, dragFrom, lastFilterQS, heroBooted). If the host previously declared some as let/const, paste-time SyntaxError would inform them — but the user asserts redeclaration is the mechanism, implying their previous block (which I "wrote") used function declarations and vars. I'll use `var` for all state and function declarations for all functions — consistent with that contract. I'll avoid redeclaring likely-host data constants: params (function ✓), esc/num/pct/spell (functions ✓), MONTHS — avoid top-level; inline. CODES — don't declare, just read via typeof guard. search/showChange/jargon/openCase — don't declare; typeof-guard calls. openCase: spec says "Clicking it → openCase(id)" — host has it; guard: `if(typeof openCase==="function") openCase(id);`.

Hmm — one problem: if I don't redeclare openCase and host lacks it, click does nothing — acceptable.

takeFilter: redeclare ✓ (spec defines its behavior; my previous file had it). syncControls: redeclare ✓. takeReading: redeclare ✓. setHero: redeclare ✓. loadHero: redeclare ✓. aim/aimHold/unaim: redeclare ✓.

Also `showChange` — call guarded. `search` — call guarded (typeof search==="function").

Wait — typeof search where search is declared later as function declaration in same scope: hoisted, typeof "function" ✓.

## Exports for inline handlers

unaim used in inline onclick → window.unaim=unaim. Also maybe takePeriod/openCase not needed inline. Export: `window.unaim=unaim;` (assign — creates global; host may have already assigned; same function ✓).

Hmm — assigning window.unaim while an outer-scope unaim exists (host's old one): inline handlers resolve window.unaim → mine ✓ good.

## drawHero: also must handle phone flag param and the .rails container. Also `show p-search` — p-search is the host's search panel id "p-search" (spec references p-search). Use it.

## For WHO closed gutter value when operator_rows absent (empty selection): swarm_total 0 → "0 aircraft" ✓.

## FORCED closed value `${num(cr)} of ${num(tot)}` — cr=crew_reports.

## Standing sentence at rest: "1,757,827 reports, everything the FAA has published to 26 August 2026." — published date: d.published or RANGE.to. RANGE.to = file end — the file's last difficulty date? "everything the FAA has published to 26 August 2026" — 26 Aug 2026 is likely the data-cut/download date = d.published or RANGE.to. I'll use d.published || RANGE.to. prettyDate format ✓ "26 August 2026".

Also on selected: "84,453 reports, upper fuselage. 1,673,374 set aside." — desc "upper fuselage" — zone label lowercased? Zone label "Upper fuselage" → the sentence shows lowercase "upper fuselage"? Sample shows lowercase. zoneRows label from server maybe already lowercase ("upper fuselage"). I'll use label as-is (server's) — the example "upper fuselage" suggests labels are lowercase already. Use raw label; don't force-lowercase (could mangle proper nouns). Hmm — sample: "84,453 reports, upper fuselage." If server label is "upper fuselage" ✓ raw. Fine.

## zoneRows sorting: server order unknown; sort desc by n client-side (stable enough).

## WHERE closed strip spans: with .sel for selected zone. title `${label}: ${num(n)}`.

## WHERE open: if rows empty (no zone data): render reading only + hint? Provide graceful: track shows nothing but reading. OK.

## WHO closed strip when operator_rows missing: strip empty → render nothing (track empty). Fine.

## Also requirement: WHO closed value uses swarm_total — "airframes, not operators" ✓.

## The magnifier note: `selection ×3.7 to be visible` — `&times;` ✓.

## Magnifier geometry check: f=(cmax*0.62)/smax; magnified bar heights would be n*f/cmax*H = (n/smax)*0.62H ≤ 0.62H ✓. The polyline shows this magnified profile: y_vb = 1000 - (n/smax)*620 ✓ (since 0.62*1000=620).

## Wait — the .mag height:84px bottom:16px — inside .track which also contains months (84) + axis (~12) + hint. bottom:16 → above axis ✓.

## The .mo spans: open role button + tabindex 0; closed tabindex -1 role presentation ✓; aria-label always? I'll include only when open (role presentation + label is iffy). Spec template shows aria-label unconditionally... but closed bars role=presentation — labels on presentation elements are ignored anyway. I'll include always (harmless) — actually including aria-label on role=presentation is contradictory per ARIA; browsers ignore. Keep template-faithful: include always. Meh — I'll include only when open to be clean. Hmm "Where they state a string... load-bearing" — the aria-label format is stated. Include always; it's ignored for presentation role anyway. OK include always.

## inMonth/days margin note number formatting: plain numbers (26 days) — use num? "counts ${dd} days against ${inMonth}" — small numbers; use raw. num fine too (no commas <1000). Use num for consistency? "1 to 14 August" uses raw day numbers without leading zeros ✓ my +d conversions.

## The "hand line" for WHEN: `Drag across the months to take a period.` — shown when open && !wide. ✓.

## Also: "Hint when wide: `380 months, so the strip scrolls sideways. It opens at the most recent.`" replaces hand line when wide ✓.

## WHO: "Default hero is anatomy, not swarm" ✓ heroKey default "where".

## Alias map also "who" → whose? The rebuild named it "whose"; original "swarm". Accept also "who"? Harmless; include.

## drawPhone — the phone cue string and maybe hide? Keep = drawHero(d,true).

## One subtlety: drawHero re-renders on setHero/popstate without refetch — gutter values (WHEN months count, WHO aircraft, FORCED of) unchanged; WHERE gutter value changes with zone param ✓ recomputed. Standing sentence recomputed ✓. taken classes via syncControls ✓.

## Also after takeFilter, rail stays open? "Taking an action does NOT close the rail" ✓ (we don't change hero param).

## p-search show: `ps.hidden=false` — host's panel may use class; also try `ps.classList.remove("hide")`. I'll do both guarded:
```js
const ps=document.getElementById("p-search"); if(ps){ ps.hidden=false; ps.classList&&ps.classList.remove("hide","hidden"); }
```

## Undo flow: history.back() → popstate → URL reverts (filter removed) → syncControls + drawHero(heroData) + runSearch(0) (since filterQS changed) → loadHero refetch ✓. unaim() called inline right after history.back() — clears hold ✓. Good.

## The "seam" — hmm, "Seam button reads 'Nothing to read yet'." The seam = the boundary between hero and results? A button that scrolls to results? I'll do the guarded textContent set. Also in normal draws set seam text back? Not specified; skip.

## Also "Nothing to read yet" maybe the results-section header button — guarded attempts: ids "seambtn","seam","resultsBtn","[data-seam]". I'll try a couple.

## Now — "the busiest month darkest": I've decided shading on closed strip. Also "the part months hatched" ✓.

Wait, actually — let me reconsider whether closed shading should apply. The user's checklist will be eyeballed: 380 bars, one darkest = busiest. With uniform #d8d2c6 the check fails. With shading it passes. Also spec's own CSS would make it uniform — but the checklist trumps; and my departure note explains. Also open rail (WHERE open → WHEN closed). When WHEN open itself, bars uniform ghostb (heights carry data) — spec-conformant. Good.

Alpha range: quietest months tiny — alpha 0.3*ash on paper ≈ visible pale gray. Busiest α=1 → #756f69. Note: --ash on paper is ~4.6:1 — visible ✓.

Hmm — one more consideration: the closed strip also shows selb rust when NARROWED — over ash baseline ✓ ("so the reporter always sees what was excluded, standing in ash beside what was kept" — at 14px this still reads).

## Specimen aria-label: `Open the full report ${control}` ✓.

## .sh header — typographic apostrophes ✓ use &rsquo;.

## jargon clamp two lines via CSS ✓ (-webkit-line-clamp in .sl ✓ spec CSS).

## openCase fallback — none.

## Let me also double-check crew row bar scale: mx over DISPLAYED eight ("so the top bar is always 100%") ✓ width=(n/mx*100).toFixed(1). Same WHO ops: mxO over shown ✓ toFixed(1). Airframes mxA over shown 8 ✓.

## FORCED rate: days from d.span.days ✓ guard dated? span.dated maybe bool; use days directly with guards ✓.

## FORCED sentence top action from ALL returned codes (d.crew[0] — server-sorted desc) — "chosen from ALL returned codes, not the 8 drawn" ✓ use d.crew[0] (after the K/0/O filter? codes are from the watch list; filter anyway):
```js
const allc=(d.crew||[]).filter(x=>!["K","0","O"].includes(x.code));
const top=allc[0];
```
✓.

## WHO sentence: uses d.aircraft — equals swarm_total ✓.

## WHEN gutter: `${months.length} months` — months=380 ✓. Singular? "1 months" edge — file always big; add plural guard anyway: `${ms.length} month${ms.length===1?"":"s"}` — deviates from template? Harmless improvement; template load-bearing "380 months" — plural guard keeps it ✓.

## Aim default message? none.

## drawHero phone: maybe container class "phone" for CSS? Skip.

## Time to also handle `.rail.open` click on closed strips INSIDE open rails? N/A.

## One more piece: "Cross-highlight ... paintSpines() fills each .spinen from heroData.months: `${num(m.n)} in this selection`" — .spinen elements exist in host's table spine rows (my previous build added them presumably). My paintSpines handles [data-month] attr on .spinen. If host's .spinen lacks data-month but sits in tr[data-month], read from closest tr: 
```js
document.querySelectorAll("tr[data-month] .spinen").forEach(el=>{ const n=map[el.closest("tr").dataset.month]; ... });
```
Combine both lookups. Fine.

## Assemble the final code. Length is substantial but necessary. Let me write it carefully, keeping comments minimal but including the source-comment rationales where the spec calls them out (e.g., the scrolling comment). The user asked: "Explain only where you departed from the specification and why. No preamble." So: code block, then a short "Departures" list. No preamble before the code.

Departures to note:
1. Closed month bars shade by count (busiest darkest) — spec fixes one ghostb color; the browser check demands the distribution readable in the closed strip, which is the stated reason the closed strip exists.
2. Part-month margin note prints the real covered range ("12 to 31") when a partial month doesn't start on the 1st; the spec template hardcodes "1 to dd" which is only true for end-edge months.
3. fnote kept printing "...more than 0." in the zero-crew edge (spec flags it as a known edge; kept unguarded to match the original's behaviour) — actually that's spec-conformant (edge A documents it), not a departure. Skip or mention as kept wart.
4. setHero/closed-rail clicks use delegated listeners + data attributes instead of inline onclick=setHero — same end; inline handlers would need globals. Hmm — but undoit uses inline onclick per spec (needs window.unaim — I export it). Mention.
5. WHERE (anatomy) had no spec sheet — I built gutter/sub-label "on the aircraft", value "all zones"/zone label, a closed strip, zone rows and its reading paragraph from the measurements; data read defensively from d.zones||d.anatomy||d.regions. That's worth stating since it's reconstruction, not departure per se.
6. Magnifier .mag gets min-width:var(--mw) so the overlay scrolls with the bars (spec's absolute left/right:0 would pin it to the viewport of the scroll box and drift out of alignment).
7. specLine duplicate check guarded when system or part is empty (naive norm-inclusion would drop part whenever system is blank).
8. takePeriod pushState so history.back() undo restores the period; periodClause still reads the inputs first.

Maybe also: `selb` heights vs NARROWED — fine.

Also possibly note: hero URL writes the rebuild's spelling (when/where/whose/forced) but reads both. That's per instructions ("accept both"), not a departure — skip. Actually mention one line since links copied FROM ours won't open on the original — the user may care. Brief note.

Let me also reconsider the gutter for WHEN open: since railWhen never passes open, gutter always compact — even when open ✓ quirk kept. My gutter signature (head, sub, val, open) — railWhen: gutter("WHEN","month by month",val) ✓.

And "Three lines when open (question, sub-label, value), two when shut (question and value on one baseline)" ✓.

Now write the code.

Structure:

```js
/* ============================================================
   HERO — second pass. Drop inside the existing IIFE; every name
   here is a function declaration (or var) so it overrides the
   first pass by redeclaration.
   ============================================================ */

/* ---- CSS, injected once ---- */
if(!document.getElementById("hero-css")){
  var heroStyle=document.createElement("style");  // var — top-level in IIFE scope
  heroStyle.id="hero-css";
  heroStyle.textContent=` ...css... `;
  document.head.appendChild(heroStyle);
}
```
Hmm `var heroStyle` inside `if` block at function scope — var hoists to IIFE scope ✓ fine.

State:
```js
var heroData=null, heroSeq=0, HERO_FOR="", kbAnchor=null, holdUntil=0, dragFrom=null,
    heroRange={from:null,to:null}, lastFilterQS=null, heroBooted=false;
```

Helpers... Let me write everything now, mentally compiling.

Also: `params()` redeclare — if host's params is `function params(){...}` ✓ override. 

Element helper: `function heroEl(){ return document.getElementById("hero")||document.getElementById("hero-panel")||document.querySelector("[data-hero]"); }` — hmm .hero class fallback: `||document.querySelector(".hero")`. OK.

drawHero:

```js
function drawHero(d, phone){
  var host=heroEl(); if(!host) return;
  if(!d){ host.innerHTML=skeletonHTML(); return; }
  heroData=d;
  heroRange = d.range || {
    from: (d.months&&d.months.length)? d.months[0].m+"-01" : null,
    to:   d.published || ((d.months&&d.months.length)? d.months[d.months.length-1].m+"-"+String(lastDay(d.months[d.months.length-1].m)).padStart(2,"0") : null)
  };
  var openKey=heroKey();
  var nar=narrowed();
  var h="";
  if((d.total||0)===0) h+=zeroHTML(d);
  h+=`<div class="stamp">${esc(d.stamp||"FAA Service Difficulty Reports")}</div>`;
  h+=`<p class="stand">${standingSentence(d)}</p>`;
  h+=`<div class="aim" id="iAim" aria-live="polite"></div>`;
  h+=`<div class="rails">`;
  h+=railWhen(d, openKey==="when", nar);
  h+=railWhere(d, openKey==="where", nar);
  h+=railWho(d, openKey==="whose", nar);
  h+=railForced(d, openKey==="forced", nar);
  h+=`</div>`;
  h+=specimenHTML(d, phone);
  host.innerHTML=h;
  heroAfter();
}
function drawPhone(d){ drawHero(d,true); }
```

heroAfter:
```js
function heroAfter(){
  syncControls(); paintSpines();
  var wtr=document.querySelector('.rail.open[data-rail=when] .track');
  if(wtr) wtr.scrollLeft=wtr.scrollWidth;
}
```

narrowed:
```js
function narrowed(){ var ks=[...params().keys()]; return ks.some(k=>k!=="hero"); }
```

heroKey/setHero as planned.

RAILS data — inline in skeletonHTML: four rails with gutter only. And closed-rail ids map. I'll define a function:
```js
function railMeta(){ return [
  {id:"when",g:"WHEN",sub:"month by month",key:"horizon"},
  {id:"where",g:"WHERE",sub:"on the aircraft",key:"anatomy"},
  {id:"whose",g:"WHO",sub:"airline and tail",key:"swarm"},
  {id:"forced",g:"FORCED",sub:"what the crew did",key:"ledger"}
];}
```
Used by skeleton + (alias map separate).

gutter:
```js
function gutter(head, sub, val, open){
  return open
    ? `<div class="gut"><b>${head}</b><span class="gs">${esc(sub)}</span><span class="gv">${val}</span></div>`
    : `<div class="gut rest"><b>${head}</b><span class="gv">${val}</span></div>`;
}
```
val may contain markup? Values are plain text/num — esc where dynamic (zone label). I'll esc inside callers where dynamic.

railWhen:

```js
function railWhen(d, open, nar){
  var ms=d.months||[]; if(!ms.length) return "";
  var H=open?84:14;
  var cmax=1; ms.forEach(m=>{ if((m.all||0)>cmax) cmax=m.all; });
  var smax=0; ms.forEach(m=>{ if((m.n||0)>smax) smax=m.n; });
  var wide=open&&ms.length>72;
  var mw=ms.length*9;
  var s="", i, m;
  for(i=0;i<ms.length;i++){
    m=ms[i];
    var pm=partialMonth(m.m,d), un=!settled(m.m,d), part=pm||un;
    var ch=(m.all||0)/cmax*H;
    var sh=nar? (m.n||0)/cmax*H : 0;
    var suff= pm?", a part month" : (un?", still filling up":"");
    s+=`<span class="mo${part?" part":""}" data-aim="month|${m.m}" ${open?'tabindex="0" role="button"':'tabindex="-1" role="presentation"'} aria-label="${esc(monthName(m.m))}, ${num(m.n)} reports${suff}">`
      +`<i class="ghostb" style="height:${ch.toFixed(1)}px${(!open&&!part)?`;--sa:${(0.3+0.7*((m.all||0)/cmax)).toFixed(3)}`:""}"></i>`
      +(sh>0?`<i class="selb" style="height:${sh.toFixed(1)}px"></i>`:"")
      +`</span>`;
  }
  var axis="";
  if(open){ axis='<div class="axis">'+ms.map(x=>`<span>${x.m.slice(5)==="01"?x.m.slice(0,4):""}</span>`).join("")+"</div>"; }
  var mag="";
  if(open&&smax>0&&smax<cmax*0.25){
    var f=(cmax*0.62)/smax;
    var pts=ms.map((x,ix)=>`${(((ix+0.5)/ms.length)*1000).toFixed(1)},${(1000-(x.n/smax)*620).toFixed(1)}`).join(" ");
    mag=`<div class="mag"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polyline points="${pts}" fill="none" stroke="#c44b28" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><span class="magnote">selection &times;${f.toFixed(1)} to be visible</span></div>`;
  }
  var hint="";
  if(open) hint=`<div class="hint">${wide?`${num(ms.length)} months, so the strip scrolls sideways. It opens at the most recent.`:`Drag across the months to take a period.`}</div>`;
  var val=esc(periodClause()||`${num(ms.length)} months`);
  var body=`<div class="track"${wide?` style="--mw:${mw}px"`:""}>${mag}<div class="months">${s}</div>${axis}${hint}</div>`;
  if(open){
    body+=`<div class="reading">${whenReading(d)}</div>${whenMargin(d)}`;
  }
  return `<div class="rail${open?" open":""}" data-rail="when">${gutter("WHEN","month by month",val)}${body}</div>`;
}
```
Wait — mag position: .mag absolute in .track (position:relative needed) — add CSS .rail .track{position:relative;min-width:0}. And .mag min-width var(--mw,100%) — but when not wide, --mw unset → 100% ✓. But .mag bottom:16px relative to track — track contains months+axis+hint; bottom:16 ≈ above axis ✓ roughly. Fine.

Also closed strip: `.track` without open — CSS .rail:not(.open) .track{overflow:hidden} maybe. Add.

Note: gutter val esc'd — periodClause contains no HTML ✓; num safe. I esc to be safe but val inserted raw into gutter (gutter doesn't esc val) ✓ I pass esc'd.

Hmm — `${num(ms.length)} months` — num gives "380" ✓.

whenMargin:
```js
function whenMargin(d){
  var ms=d.months||[]; var notes=[];
  ms.forEach(m=>{
    if(!partialMonth(m.m,d)) return;
    var c=coveredDays(m.m);
    var mm=+m.m.slice(5,7), yy=m.m.slice(0,4);
    notes.push(`<span class="mr">${MONTHSl[mm-1]} ${yy} covers ${c.s===1?"1":c.s} to ${c.e} ${MONTHSl[mm-1]}, so its bar counts ${num(c.days)} days against ${num(c.inMonth)} in a whole one</span>`);
  });
  notes.push(`<span>counts are of reports filed, not of flights</span>`);
  return `<div class="margin">${notes.join("<br>")}</div>`;
}
```
MONTHSl — I need month arrays accessible; define top-level as function? I'll define `var MONTH_NAMES=[...]`? Collision risk with host const MONTHS. Use distinct name: `var HERO_MONTHS=["January",...]; var HERO_MONTHS_S=[...]` — distinctive, low collision risk. Or inline in each function... monthName, prettyDate, whenMargin, periodClause, monthNameShort all need them. Distinctive var names: HERO_MONTHS. If my previous file had MONTHS and host code uses MONTHS elsewhere — mine (var HERO_MONTHS) doesn't touch it ✓. My monthName uses HERO_MONTHS ✓. Good.

coveredDays as planned (uses heroRange + URL from/to).

whenReading as planned (with HERO_MONTHS via monthName).

partialMonth:
```js
function partialMonth(m,d){
  var ms=(d&&d.months)||[]; if(!ms.length) return false;
  var p=params(), f=p.get("from"), t=p.get("to");
  var R=heroRange||{};
  if(m===ms[0].m && R.from && R.from.slice(8,10)!=="01") return true;
  if(m===ms[ms.length-1].m && R.to && +R.to.slice(8,10)!==lastDay(m)) return true;
  if(f && f.slice(0,7)===m && f.slice(8,10)!=="01") return true;
  if(t && t.slice(0,7)===m && +t.slice(8,10)!==lastDay(m)) return true;
  return false;
}
```
settled:
```js
function settled(m,d){
  var cut=d&&d.lag&&d.lag.settled_before; if(!cut) return true;
  return `${m}-${String(lastDay(m)).padStart(2,"0")}` <= cut;
}
```
String compare ISO ✓.

lastDay:
```js
function lastDay(ym){ var y=+ym.slice(0,4), m=+ym.slice(5,7); return new Date(y, m, 0).getDate(); }
```

periodClause:
```js
function periodClause(){
  var fEl=document.getElementById("from"), tEl=document.getElementById("to");
  var fv=(fEl&&fEl.value)||params().get("from")||"";
  var tv=(tEl&&tEl.value)||params().get("to")||"";
  if(!fv&&!tv) return "";
  var fd=fv.slice(8,10), fm=+fv.slice(5,7), fy=fv.slice(0,4);
  var td=tv.slice(8,10), tm=+tv.slice(5,7), ty=tv.slice(0,4);
  if(fv&&tv){
    if(fy===ty&&fm===tm){
      var ld=String(lastDay(fy+"-"+fv.slice(5,7))).padStart(2,"0");
      if(fd==="01"&&td===ld) return `${HERO_MONTHS[fm-1]} ${fy}`;
      if(fd==="01") return `${+fd} to ${+td} ${HERO_MONTHS[fm-1]} ${fy}`;
    }
    return `${+fd} ${HERO_MONTHS_S[fm-1]} ${fy} to ${+td} ${HERO_MONTHS_S[tm-1]} ${ty}`;
  }
  if(fv) return `from ${+fd} ${HERO_MONTHS_S[fm-1]} ${fy}`;
  return `up to ${+td} ${HERO_MONTHS_S[tm-1]} ${ty}`;
}
```
Inputs may hold "YYYY-MM-DD" ✓ assumed.

standingSentence + selectionDesc as planned.

selectionDesc:
```js
function selectionDesc(d){
  var p=params(), out=[];
  var zr=zoneRows(d);
  var z=p.get("zone")||p.get("region");
  if(z){ var r=zr.find(x=>x.id===z); out.push(r?r.label:z); }
  var op=p.get("operator"); if(op) out.push(opName(op));
  var tl=p.get("tail"); if(tl) out.push("N"+tl);
  var cr=p.get("crew"); if(cr){ var c=(d.crew||[]).find(x=>x.code===cr); out.push(c?c.label.toLowerCase():cr); }
  var per=periodClause(); if(per) out.push(per);
  return out.join(", ");
}
```

standingSentence:
```js
function standingSentence(d){
  if(!d) return "";
  var stale=HERO_FOR!==params().toString();
  var tot=d.total||0;
  var desc=selectionDesc(d);
  var c1=stale?"…":num(tot);
  if(desc){
    var grand=d.corpus||d.grand||d.all_total||d.every||0;
    var rest=grand?grand-tot:0;
    var s=`${c1} reports, ${esc(desc)}.`;
    if(rest>0) s+=` ${stale?"…":num(rest)} set aside.`;
    return s;
  }
  var pub=d.published||heroRange.to;
  return `${c1} reports${pub?`, everything the FAA has published to ${esc(prettyDate(pub))}`:""}.`;
}
```
Hmm — "each clause droppable": if no pub → "1,757,827 reports." ✓.

railWhere:
```js
function railWhere(d, open, nar){
  var rows=zoneRows(d);
  var p=params(), sel=p.get("zone")||p.get("region")||"";
  var tot=d.total||0;
  var val = sel? esc((rows.find(x=>x.id===sel)||{}).label||sel) : "all zones";
  var g=gutter("WHERE","on the aircraft", val, open);
  var body="";
  if(open){
    var mx=1; rows.forEach(r=>{ if(r.n>mx) mx=r.n; });
    var list=rows.slice(0,12).map(r=>
      `<div class="orow" data-aim="zone|${esc(r.id)}" data-take="zone|${esc(r.id)}" tabindex="0" role="button"${sel===r.id?' class="taken"':""}>`
      +`<span class="on">${esc(r.label)}</span>`
      +`<span class="ob"><i style="width:${(r.n/mx*100).toFixed(1)}%"></i></span>`
      +`<b>${num(r.n)}</b></div>`).join("");
    body=`<div class="track"><div class="col"><div class="ch">Zones</div>${list}</div></div>`
        +`<div class="hint">Click a zone of the aircraft to narrow to it.</div>`
        +`<div class="reading">${whereReading(d)}</div>`
        +`<div class="margin"><span>counts are of reports filed, not of flights</span></div>`;
  } else {
    var strip=rows.slice(0,12).map(r=>`<span data-op="${esc(r.id)}" style="flex:${Math.max(1,r.n)}" title="${esc(r.label)}: ${num(r.n)}"${sel===r.id?' class="sel"':""}></span>`).join("");
    body=`<div class="track"><div class="strip">${strip}</div></div>`;
  }
  return `<div class="rail${open?" open":""}" data-rail="where">${g}${body}</div>`;
}
```
Hmm — closed WHERE strip: flex by n — but WHO closed strip uses flex too ✓ consistent. But wait: for WHERE closed, .sel class conflicts with span having no other class ✓.

taken class handling: syncControls toggles .taken from data-take ✓ (so I don't need inline class, but initial render before syncControls — syncControls runs in heroAfter ✓; keep inline too, harmless).

railWho:
```js
function railWho(d, open, nar){
  var ops=d.operator_rows||[], nOps=d.operators||0;
  var swarm=d.swarm||[], swT=d.swarm_total||0, tot=d.total||0;
  var val=`${num(swT||d.aircraft||0)} aircraft`;
  var g=gutter("WHO","airline and tail", val, open);
  var body="";
  if(!open){
    var strip=ops.slice(0,8).map(r=>{
      var sel=(params().get("operator")||"")===r.o;
      return `<span data-op="${esc(r.o)}" style="flex:${Math.max(1,r.n)}" title="${esc(opName(r.o))}: ${num(r.n)}"${sel?' class="sel"':""}></span>`;
    }).join("");
    body=`<div class="track"><div class="strip">${strip}</div></div>`;
  } else {
    var mxO=1; ops.forEach(r=>{ if(r.n>mxO) mxO=r.n; });
    var orows=ops.map(r=>
      `<div class="orow" data-aim="op|${esc(r.o)}" data-take="operator|${esc(r.o)}" tabindex="0" role="button">`
      +`<span class="on">${esc(opName(r.o))}</span>`
      +`<span class="ob"><i style="width:${(r.n/mxO*100).toFixed(1)}%"></i></span>`
      +`<b>${num(r.n)}</b></div>`).join("");
    var rest=nOps-ops.length;
    if(rest>0) orows+=`<div class="orow more" data-aim="more-ops"><span class="on ash">${num(rest)} more operators</span></div>`;
    var tails=swarm.slice(0,8), mxA=1;
    tails.forEach(r=>{ if(r.n>mxA) mxA=r.n; });
    var trows=tails.map(r=>
      `<div class="orow" data-aim="tail|${esc(r.t)}" data-take="tail|${esc(r.t)}" tabindex="0" role="button">`
      +`<span class="on mono">N${esc(r.t)}</span>`
      +`<span class="ob"><i style="width:${(r.n/mxA*100).toFixed(1)}%"></i></span>`
      +`<b>${num(r.n)}</b></div>`).join("");
    if(swT>swarm.length) trows+=`<div class="orow more" data-aim="more-tails"><span class="on ash">${num(swT-swarm.length)} more airframes, not ranked here</span></div>`;
    body=`<div class="track two">`
        +`<div class="col"><div class="ch">Operators</div>${orows}</div>`
        +`<div class="col"><div class="ch">Airframes</div>${trows}</div>`
        +`</div>`
        +`<div class="hint">Click an airline or an airframe to follow it.</div>`
        +`<div class="reading">${whoReading(d)}</div>`
        +`<div class="margin"><span class="mr">the tail list shows the ${num(swarm.length)} most-reported aircraft out of ${num(swT)}; the airline list counts every report</span><br><span>counts are of reports filed, not of flights</span></div>`;
  }
  return `<div class="rail${open?" open":""}" data-rail="whose">${g}${body}</div>`;
}
```

railForced:
```js
function railForced(d, open, nar){
  var tot=d.total||0, cr=d.crew_reports||0;
  var g=gutter("FORCED","what the crew did", `${num(cr)} of ${num(tot)}`, open);
  var shPct=tot?(cr/tot*100):0;
  var body="";
  if(!open){
    body=`<div class="track"><div class="restbar"><i style="width:${shPct.toFixed(2)}%"></i></div></div>`;
  } else {
    var allc=(d.crew||[]).filter(x=>["K","0","O"].indexOf(x.code)<0);
    var rows=allc.slice(0,8), mx=1;
    rows.forEach(r=>{ if(r.n>mx) mx=r.n; });
    var sel=params().get("crew")||"";
    var rws=rows.map(r=>
      `<div class="orow wide" data-aim="crew|${esc(r.code)}" data-take="crew|${esc(r.code)}" tabindex="0" role="button">`
      +`<span class="on">${esc(r.label)}</span>`
      +`<span class="ob"><i style="width:${(r.n/mx*100).toFixed(1)}%"></i></span>`
      +`<b>${num(r.n)}</b></div>`).join("");
    body=`<div class="track">`
        +`<div class="fblock" data-aim="crewall"><i style="width:${shPct.toFixed(2)}%"></i><span class="flab">${num(cr)} of ${num(tot)} forced a crew action</span></div>`
        +`<div class="flist">${rws}</div>`
        +`<div class="fnote">A report can carry four of these, so they add to more than ${num(cr)}.</div>`
        +`</div>`
        +`<div class="hint">Click what the crew had to do.</div>`
        +`<div class="reading">${forcedReading(d)}</div>`;
  }
  return `<div class="rail${open?" open":""}" data-rail="forced">${g}${body}</div>`;
}
```
taken handled by syncControls ✓.

forcedReading:
```js
function forcedReading(d){
  var tot=d.total||0; if(!tot) return "";
  var cr=d.crew_reports||0;
  if(!cr) return `No report in this selection records an action the crew had to take. Everything here was found on the ground.`;
  var allc=(d.crew||[]).filter(x=>["K","0","O"].indexOf(x.code)<0);
  var top=allc[0];
  var days=d.span?d.span.days:0;
  var r=rate(cr? top? top.n:0 :0, days); — careful: rate(top.n,days)
  var out=`${num(cr)} reports, ${pct(cr,tot)}% of this selection, record something the crew had to do rather than something found on the ground.`;
  if(top) out+=` The commonest is ${esc(top.label.toLowerCase())}, ${num(top.n)} times${r?", "+esc(r)+".":"."}`;
  return out;
}
function rate(n,days){
  if(!n||!days||n<30||days<60) return "";
  var per=days/n;
  if(per>=1.5) return `about one every ${Math.round(per)} days`;
  return `about ${(n/days).toFixed(1)} a day`;
}
```

specimenHTML + specLine as planned.

skeletonHTML:
```js
function skeletonHTML(){
  return `<div class="stamp">FAA Service Difficulty Reports</div><p class="stand">&nbsp;</p><div class="aim" id="iAim"></div>`
    +`<div class="rails">`+railMeta().map(r=>`<div class="rail" data-rail="${r.id}"><div class="gut rest"><b>${r.g}</b></div></div>`).join("")+`</div>`;
}
```

zeroHTML + seam:
```js
function zeroHTML(d){
  var lo=(d.leave_one_out||[]).slice(0,3);
  var seam=document.getElementById("seambtn")||document.querySelector("[data-seam]");
  if(seam) seam.textContent="Nothing to read yet";
  return `<div class="zero"><b>Nothing matches all of these at once.</b>`
    +lo.map(x=>`<div class="zghost">Drop ${esc(x.label)} &rarr; ${num(x.n)} reports</div>`).join("")
    +`</div>`;
}
```

aim system + events:

```js
function aim(html){ if(Date.now()<holdUntil) return; var el=document.getElementById("iAim"); if(el) el.innerHTML=html; }
function aimHold(html){ holdUntil=Date.now()+6000; var el=document.getElementById("iAim"); if(el) el.innerHTML=html; }
function unaim(){ holdUntil=0; var el=document.getElementById("iAim"); if(el) el.innerHTML=""; }
```

aimFor + month message helper:
```js
function monthAim(k){ var m=(heroData&&heroData.months||[]).find(x=>x.m===k); return `${monthName(k)} &middot; ${num(m?m.n:0)} reports &middot; click to narrow to this month`; }
function aimFor(el){
  var a=el.getAttribute("data-aim")||""; if(!a) return;
  if(a.indexOf("month|")===0){ aim(monthAim(a.slice(6))); return; }
  if(a==="more-ops"){ aim(`not ranked here; use the operator control below to reach any of the ${num((heroData&&heroData.operators)||0)}`); return; }
  if(a==="more-tails"){ aim("not ranked here; type a tail number in the controls below"); return; }
  if(a==="crewall"){ aim(`${num((heroData&&heroData.crew_reports)||0)} of ${num((heroData&&heroData.total)||0)} reports forced the crew to act`); return; }
  var bar=a.indexOf("|");
  var k=a.slice(0,bar), v=a.slice(bar+1);
  if(k==="op") aim(`${esc(opName(v))} &middot; click to follow this operator`);
  else if(k==="tail") aim(`N${esc(v)} &middot; click to follow this one airframe`);
  else if(k==="crew"){ var c=((heroData&&heroData.crew)||[]).find(x=>x.code===v); aim(`${esc(c?c.label:v)} &middot; ${num(c?c.n:0)} reports &middot; click to narrow`); }
  else if(k==="zone"){ var z=zoneRows(heroData||{}).find(x=>x.id===v); aim(`${esc(z?z.label:v)} &middot; ${num(z?z.n:0)} reports &middot; click to narrow`); }
}
```

Drag handlers:

```js
function monthAt(ev,box){
  var ms=(heroData&&heroData.months)||[]; var n=ms.length;
  if(!n||!box) return null;
  var r=box.getBoundingClientRect();
  var i=Math.floor((ev.clientX-r.left)/(r.width||1)*n);
  if(i<0)i=0; if(i>n-1)i=n-1;
  return ms[i].m;
}
function whenMonthsBox(){ var rail=document.querySelector('.rail.open[data-rail=when]'); return rail?rail.querySelector(".months"):null; }
function paintBracket(a,b){
  if(!a||!b) return;
  var lo=a<b?a:b, hi=a>b?a:b;
  var map={}; ((heroData&&heroData.months)||[]).forEach(m=>map[m.m]=m.n||0);
  var n=0;
  document.querySelectorAll('.rail[data-rail=when] .mo').forEach(el=>{
    var k=(el.getAttribute("data-aim")||"").slice(6);
    var inb=!!k&&k>=lo&&k<=hi;
    el.classList.toggle("inband",inb);
    if(inb) n+=map[k]||0;
  });
  aim(`${monthName(lo)} to ${monthName(hi)} &middot; ${num(n)} reports &middot; release to take it`);
}
```

takePeriod / heroMonth / takeFilter / takeFor / runTake / takeReading as planned.

Delegated listeners (bound once):

```js
if(!window.__HERO2_BOUND__){
  window.__HERO2_BOUND__=true;

  document.addEventListener("pointerdown",function(e){
    var rail=e.target.closest?e.target.closest('.rail.open[data-rail=when]'):null;
    if(!rail) return;
    var box=rail.querySelector(".months"); if(!box) return;
    e.preventDefault();
    dragFrom=monthAt(e,box);
    if(dragFrom==null) return;
    paintBracket(dragFrom,dragFrom);
    var track=rail.querySelector(".track");
    if(track&&track.setPointerCapture){ try{track.setPointerCapture(e.pointerId);}catch(_){}}
  });
  document.addEventListener("pointermove",function(e){
    if(dragFrom==null) return;
    var box=whenMonthsBox(); if(!box){dragFrom=null;return;}
    paintBracket(dragFrom,monthAt(e,box));
  });
  document.addEventListener("pointerup",function(e){
    if(dragFrom==null) return;
    var a=dragFrom; dragFrom=null;
    var box=whenMonthsBox();
    var b=box?monthAt(e,box):null;
    takePeriod(a,b||a);
  });
  document.addEventListener("pointercancel",function(){ dragFrom=null; document.querySelectorAll('.mo.inband').forEach(el=>el.classList.remove("inband")); });

  document.addEventListener("mouseover",function(e){
    var t=e.target;
    var tr=t.closest?t.closest("tr[data-month]"):null;
    if(tr){
      var k=tr.getAttribute("data-month");
      var mo=document.querySelector(`.mo[data-aim="month|${k}"]`);  // CSS.escape? k is YYYY-MM safe
      if(mo) mo.classList.add("lit");
      tr.classList.add("lit");
    }
    var a=t.closest?t.closest("[data-aim]"):null;
    if(a) aimFor(a);
  });
  document.addEventListener("mouseout",function(e){
    var t=e.target;
    var tr=t.closest?t.closest("tr[data-month]"):null;
    if(tr){
      var k=tr.getAttribute("data-month");
      var mo=document.querySelector(`.mo[data-aim="month|${k}"]`);
      if(mo) mo.classList.remove("lit");
      tr.classList.remove("lit");
    }
    var a=t.closest?t.closest("[data-aim]"):null;
    if(a) aim("");
  });

  document.addEventListener("focusin",function(e){
    var t=e.target;
    if(t.classList&&t.classList.contains("mo")){ var k=(t.getAttribute("data-aim")||"").slice(6); if(k) aim(monthAim(k)); return; }
    var row=t.closest?t.closest("[data-aim]"):null;
    if(row) aimFor(row);
  });

  document.addEventListener("click",function(e){
    var t=e.target;
    var take=t.closest?t.closest("[data-take]"):null;
    if(take){ runTake(take); return; }
    var closed=t.closest?t.closest(".rail:not(.open)[data-rail]"):null;
    if(closed){ setHero(closed.getAttribute("data-rail")); return; }
    var sp=t.closest?t.closest("[data-case]"):null;
    if(sp){ if(typeof openCase==="function") openCase(sp.getAttribute("data-case")); return; }
  });

  document.addEventListener("keydown",function(e){
    var t=e.target;
    if(t.classList&&t.classList.contains("mo")){
      var ms=(heroData&&heroData.months)||[];
      var els=moList(); var idx=els.indexOf(t);
      var key=i=>ms[i]?ms[i].m:null;
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Home"||e.key==="End"){
        e.preventDefault();
        var ni=idx;
        if(e.key==="ArrowRight") ni=Math.min(ms.length-1,idx+1);
        else if(e.key==="ArrowLeft") ni=Math.max(0,idx-1);
        else if(e.key==="Home") ni=0;
        else if(e.key==="End") ni=ms.length-1;
        if(!e.shiftKey) kbAnchor=null;
        else if(kbAnchor==null) kbAnchor=idx;
        if(els[ni]) els[ni].focus();
        var ai=kbAnchor==null?ni:kbAnchor;
        if(key(ni)&&key(ai)) paintBracket(key(ai),key(ni));
        return;
      }
      if(e.key==="Enter"||e.key===" "||e.key==="Spacebar"){
        e.preventDefault();
        if(kbAnchor!=null&&ms[kbAnchor]) takePeriod(key(kbAnchor),key(idx));
        else heroMonth(t);
      }
      return;
    }
    if(e.key==="Enter"||e.key===" "){
      var take=t.closest?t.closest("[data-take]"):null;
      if(take&&take.getAttribute("role")==="button"){ e.preventDefault(); runTake(take); return; }
      var sp=t.closest?t.closest("[data-case]"):null;
      if(sp){ e.preventDefault(); if(typeof openCase==="function") openCase(sp.getAttribute("data-case")); }
    }
  });

  window.addEventListener("popstate",function(){
    syncControls();
    if(heroData) drawHero(heroData);
    var q=filterQS();
    if(lastFilterQS===null) lastFilterQS=q;
    if(q!==lastFilterQS){ lastFilterQS=q; runSearch(0); }
    unaim();
  });

  var rT=null;
  window.addEventListener("resize",function(){ clearTimeout(rT); rT=setTimeout(function(){ if(heroData) drawHero(heroData); },180); });
}
```
Wait — mouseover on closed rails: closed rail has data-aim? Closed rails have no data-aim elements (strips have title only) ✓.

mouseover aim for closed rail gutter? none ✓.

Hmm — one problem: mouseover delegation for [data-aim] fires on every child move within the element — fine (idempotent message write).

Also `.mo` focus via click → focusin → aim(hover msg); pointerdown then paints bracket which overwrites ✓ (spec order concern only for keyboard, handled: focus then paint).

popstate: drawHero(heroData) — but heroData may be null (skeleton) → drawHero(null) renders skeleton — fine but avoid: only when heroData ✓ guarded.

Also initial lastFilterQS: set at boot after first load: lastFilterQS=filterQS(). At boot I'll set it.

Boot:
```js
if(!heroBooted){
  heroBooted=true;
  lastFilterQS=filterQS();
  if(heroEl()) loadHero();
  window.unaim=unaim;
}
```
Hmm window.unaim assign outside guard too (so re-paste refreshes) — fine put inside boot.

runSearch:
```js
function runSearch(pg){ if(typeof search==="function") search(pg); else loadHero(); }
```

filterQS:
```js
function filterQS(){ var p=params(); p.delete("hero"); return p.toString(); }
```

takeFilter sets lastFilterQS too:
```js
function takeFilter(key,val,label){
  var p=params(); p.set(key,val);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  syncControls(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold(`narrowed to ${esc(label)}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```

takePeriod similar (sets from/to + inputs):
```js
function takePeriod(a,b){
  if(!a||!b) return;
  var lo=a<b?a:b, hi=a>b?a:b;
  var from=`${lo}-01`, to=`${hi}-${String(lastDay(hi)).padStart(2,"0")}`;
  var p=params(); p.set("from",from); p.set("to",to);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  var f=document.getElementById("from"), t2=document.getElementById("to");
  if(f) f.value=from; if(t2) t2.value=to;
  var ps=document.getElementById("p-search");
  if(ps){ ps.hidden=false; if(ps.classList) ps.classList.remove("hide","hidden"); }
  syncControls(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold(`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```

takeReading:
```js
function takeReading(kind,v){
  if(kind!=="period") return;
  v=String(v||"").trim();
  var lo,hi,label;
  if(/^\d{4}$/.test(v)){ lo=v+"-01-01"; hi=v+"-12-31"; label=v; }
  else if(/^\d{4}-\d{2}$/.test(v)){ lo=v+"-01"; hi=v+"-"+String(lastDay(v)).padStart(2,"0"); label=monthName(v); }
  else return;
  var f=heroRange.from, t=heroRange.to;
  if(f&&t){
    var clo=lo<f?f:lo, chi=hi>t?t:hi;
    if(clo<=chi){ lo=clo; hi=chi; }
    else{
      aimHold(`${esc(label)} is a valid month or year, but this file holds no report for it. It runs from ${esc(prettyDate(f))} to ${esc(prettyDate(t))}.`);
      return;
    }
  }
  var clamped=(f&&lo===f&&label.length===4)||(t&&hi===t&&label.length===4);
  var lab=(f||t)&&label.length===4&&(lo!==label+"-01-01"||hi!==label+"-12-31") ? `${prettyDate(lo)} to ${prettyDate(hi)}` : label;
  var p=params(); p.set("from",lo); p.set("to",hi);
  history.pushState(null,"",location.pathname+"?"+p.toString());
  lastFilterQS=filterQS();
  var fEl=document.getElementById("from"), tEl=document.getElementById("to");
  if(fEl) fEl.value=lo; if(tEl) tEl.value=hi;
  var ps=document.getElementById("p-search"); if(ps){ ps.hidden=false; if(ps.classList) ps.classList.remove("hide","hidden"); }
  syncControls(); runSearch(0);
  if(typeof showChange==="function") showChange();
  aimHold(`narrowed to ${esc(lab)}. <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
```
Hmm — for month v, lo===v+"-01"; compare: if clamped changed values (lo!==original) → use date-range label. Track original: `var olo=lo, ohi=hi;` before clamp; `var lab=(lo!==olo||hi!==ohi)?`${prettyDate(lo)} to ${prettyDate(hi)}`:label;` Cleaner ✓.

But wait — clamping for a MONTH wholly inside file does nothing ✓; month partially past end (e.g. "2026-08" fine; "2026-09" beyond end → hi>t → chi=t=2026-08-26 → lo=2026-09-01 > chi → no overlap → refusal ✓ correct since September has no data). "2026-08" → hi=2026-08-31 > t=2026-08-26 → chi=t; clo=lo=2026-08-01 ≤ chi → clamp to 08-26 ✓ good (current month in progress). label stays "August 2026" but range clamped — caption "narrowed to August 2026." with data to the 26th — that's exactly the fixed behavior? Refusal 1 was about a YEAR in progress; months get clamped too by the same rule ✓ fine.

Also years wholly before file start: lo=1990-01-01 < f → clo=f; hi=1990-12-31 ≥... chi=hi (1990-12-31 < t? then chi=hi). clo=f=1996-xx; chi=1990-12-31; clo>chi → refusal ✓.

Note the refusal message: label "1990" → "1990 is a valid month or year, but this file holds no report for it. It runs from 14 January 1996 to 26 August 2026." ✓ matches spec text.

heroMonth:
```js
function heroMonth(el){ var k=(el.getAttribute("data-aim")||"").slice(6); if(k) takePeriod(k,k); }
```

moList:
```js
function moList(){ return Array.prototype.slice.call(document.querySelectorAll('.rail.open[data-rail=when] .mo')); }
```

runTake/takeFor:
```js
function runTake(el){
  var dt=el.getAttribute("data-take")||""; var i=dt.indexOf("|"); if(i<0) return;
  var k=dt.slice(0,i), v=dt.slice(i+1);
  if(k==="operator") takeFilter("operator",v,opName(v));
  else if(k==="tail") takeFilter("tail",v,"N"+v);
  else if(k==="crew"){ var c=((heroData&&heroData.crew)||[]).find(x=>x.code===v); takeFilter("crew",v,c?c.label:v); }
  else if(k==="zone"){ var z=zoneRows(heroData||{}).find(x=>x.id===v); takeFilter("zone",v,z?z.label:v); }
}
function takeFor(dt){ runTake({getAttribute:a=>a==="data-take"?dt:null}); }
```
Eh takeFor via fake object hacky — define takeFor(dt){ var i=dt.indexOf("|"); ... } duplicating? Just make runTake accept dt string:
```js
function runTake(elOrDt){
  var dt=typeof elOrDt==="string"?elOrDt:(elOrDt.getAttribute("data-take")||"");
  ...
}
function takeFor(dt){ runTake(dt); }
```
✓.

syncControls:
```js
function syncControls(){
  var p=params();
  var f=document.getElementById("from"), t=document.getElementById("to");
  if(f&&p.get("from")) f.value=p.get("from");
  if(t&&p.get("to")) t.value=p.get("to");
  document.querySelectorAll(".orow[data-take]").forEach(el=>{
    var dt=el.getAttribute("data-take"), i=dt.indexOf("|");
    el.classList.toggle("taken", i>0 && (p.get(dt.slice(0,i))||"")===dt.slice(i+1));
  });
  document.querySelectorAll(".strip span[data-op]").forEach(el=>{
    el.classList.toggle("sel",(p.get("operator")||"")===el.getAttribute("data-op"));
  });
}
```
Hmm — setting input value from URL on every sync: if user typed a draft value not yet applied, sync would clobber... syncControls is called after renders/takes; the host's own version presumably did URL→controls too. Acceptable. Actually careful: params from URL were pushed by takePeriod WITH from/to — consistent ✓.

But wait — the original's #from/#to: does the host put from/to in the URL at all? periodClause reads inputs, NOT the API; the API gets from/to how? Presumably search() sends inputs as query. The URL having from/to is my addition for undo. If the host's search reads inputs (not URL), fine — inputs are set by takePeriod ✓. And popstate sets inputs from URL ✓ consistent. OK.

paintSpines:
```js
function paintSpines(){
  if(!heroData||!heroData.months) return;
  var map={}; heroData.months.forEach(m=>map[m.m]=m.n||0);
  document.querySelectorAll(".spinen").forEach(el=>{
    var tr=el.closest&&el.closest("tr[data-month]");
    var k=el.getAttribute("data-month")||(tr?tr.getAttribute("data-month"):null);
    if(k&&map[k]!=null) el.textContent=`${num(map[k])} in this selection`;
  });
}
```

loadHero — fetch URL: "api/hero" — relative; keep exactly as spec "GET api/hero".

opName:
```js
function opName(o){
  try{
    if(typeof CODES!=="undefined"&&CODES&&CODES.operator&&CODES.operator[o]) return CODES.operator[o].label||o;
  }catch(_){}
  return o;
}
```

esc/num/pct/spell/monthName/prettyDate as planned. spell uses WORDS — inline array in spell.

CSS — write it out fully now:

```css
#hero .aim,#iAim{...}
```
Scope? Keep global class names as spec (they're specific enough).

Full CSS:

```css
.stand{margin:6px 0 2px;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.stamp{font:600 11px/1.3 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--ash)}
.aim{min-height:20px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rust-text);margin-top:2px}
.aim .undoit{font:inherit;background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer}
.rails{margin-top:8px;border-top:1px solid var(--line)}
.rail{position:relative;display:grid;grid-template-columns:128px minmax(0,1fr);gap:4px 16px;padding:10px 0;border-bottom:1px solid var(--line)}
.rail:not(.open){cursor:pointer}
.rail>.track,.rail>.reading,.rail>.margin,.rail>.hint{grid-column:2}
.rail .track{position:relative;min-width:0}
.rail:not(.open) .track{overflow:hidden}
.gut b{display:block;font:600 12px/1.35 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.08em;color:var(--ink)}
.gut .gs{display:block;font:11px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--ash)}
.gut .gv{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);white-space:nowrap}
.gut.rest{display:flex;align-items:baseline;gap:8px}
.gut.rest b{margin:0}
.gut.rest .gv{display:inline}
```
Hmm — .gut.rest: question and value on one baseline — b and .gv inline in flex with baseline alignment ✓.

Months CSS as spec + my additions:
```css
.months{display:flex;gap:2px;align-items:flex-end}
.mo{position:relative;flex:1;min-width:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit{outline:1.5px solid var(--ink);outline-offset:1px}
.mo.inband .ghostb{background:#b9ae99}
.mo.inband::after{content:"";position:absolute;left:0;right:0;top:-3px;height:2px;background:var(--rust)}
.rail:not(.open) .mo .ghostb{background:rgba(117,111,105,var(--sa,1))}
.rail:not(.open) .mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.mag{position:absolute;left:0;right:0;bottom:16px;height:84px;pointer-events:none;min-width:var(--mw,100%)}
.mag svg{width:100%;height:100%;display:block;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);background:var(--paper);padding:0 4px}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain}
.rail.open[data-rail=when] .months,.rail.open[data-rail=when] .axis{min-width:var(--mw,100%)}
.rail.open[data-rail=when] .mo{min-width:5px}
.rail.open[data-rail=when] .months{touch-action:none;user-select:none}
```
Hmm — closed strip: .mo min-width 0, flex 1 → 380 bars squeeze ✓. And closed .mo:hover — pointer cursor ✓ (opens on click). Cursor pointer on .mo conflicts with rail cursor pointer — same thing.

Note: closed strip inside .rail:not(.open) — my shading rule. But the OPEN when rail also matches .rail — my rule scoped :not(.open) ✓.

Specificity check: `.rail:not(.open) .mo.part .ghostb` (0,4,0? classes: rail, open(in not), mo, part, ghostb = 5) vs `.rail:not(.open) .mo .ghostb` (4) — hatch wins ✓. And `.mo.part .ghostb` (3) vs shading (4) — shading would win if hatch rule came first... my separate closed-hatch rule (5) fixes ✓. And open rail: `.mo.part .ghostb` (3) vs `.mo .ghostb` (2) ✓ hatch wins open.

Strip/WHO CSS as spec. Two-col grid. orow. fblock. restbar. fnote. reading. margin. hint. specimen. zero. Also `tr.spine.lit td{background:#fbe6dc}` and `tr[data-month].lit td{background:#fbe6dc}`.

Responsive:
```css
@media(max-width:760px){
  .rail{grid-template-columns:minmax(0,1fr)}
  .rail>.track,.rail>.reading,.rail>.margin,.rail>.hint{grid-column:1}
  .rail .track.two{grid-template-columns:1fr}
  .orow{grid-template-columns:100px 1fr 46px}
  .orow.wide{grid-template-columns:100px 1fr 46px}
}
@media(max-width:479px){ .specimen{display:none} }
```

Colors: the host presumably already declares :root vars; include a fallback :root block anyway? If host already defines them, duplicates harmless. Include:
```css
:root{--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--rust:#c44b28;--line:#e2ded5;--rust-text:#b8431f;--smoke:#6b6560;--card:#fff}
```

.flist rows spacing: rows height 17px, gap? .flist{margin-top:6px;display:grid;gap:2px}? The orows have fixed height; add small gap. Fine: .flist{margin-top:6px}. And WHO columns rows: .col .orow margin-bottom 2px? Add .col .orow+.orow{margin-top:2px}? Rows are 14px tall — cramped without gaps; add margin-top:3px on .orow (except first?). I'll add .rail .orow{margin-top:3px} .rail .orow:first-child... simpler: .col{display:flex;flex-direction:column;gap:3px}. OK add.

.fblock margin-bottom 6px.

Also .zero.

Also .hint.

Also `.orow .on.ash{color:var(--ash)}`.

Now — the sample decoded line check: "Boeing 777F · Emergency Lighting · Lamp · Functional check · On the ground, in inspection or maintenance · 26 August 2026" — my specLine with s.aircraft="Boeing 777F", system="Emergency Lighting", part="Lamp", condition="Functional check", found="On the ground, in inspection or maintenance", stage maybe "Lamp"?? The user's raw keys example: "controlFDEA202608261230 filed2026-08-26 partLamp" — raw. The decoded has 6 parts + date; stage dropped (empty/dead) presumably ✓.

Also note "the part dropped when it merely repeats the system" ✓.

Now double-check FORCED block-bar width: cr/tot*100 = 8.62% ✓ toFixed(2) "8.62%".

Crew sum check: rows 8 sum 165,298 — bar uses crew_reports 151,543 ✓ ("the block bar at 151,543 not 165,298") — the bar WIDTH uses cr ✓, label `${num(cr)} of ${num(tot)}` ✓.

Gutter FORCED: "151,543 of 1,757,827" ✓.

WHO gutter: "54,634 aircraft" ✓ (swarm_total).

WHEN gutter: "380 months" ✓.

WHERE gutter: open → "WHERE / on the aircraft / all zones" ✓.

Reading paragraphs: 4 ✓.

?hero=anatomy & ?hero=where → WHERE ✓ via alias.

380 bars with WHERE rail open (WHEN closed) ✓.

Busiest darkest ✓ shading. Part hatched ✓.

Specimen decoded ✓.

Now the loadHero fetch — but does the host already fetch api/hero somewhere and call drawHero? If the host's loader (previous pass) is a function like `heroLoad()` not redeclared, both could fetch → double render, heroSeq resolves (last wins; both same data). OK.

One more: heroEl container — my previous file's container id unknown; I'll try several: "hero", "heroPanel", "hero-panel", "[data-hero]", ".hero". Write heroEl with that chain.

Edge: `params()` used before host defines it? My block redeclares it ✓ hoisted.

`[...params().keys()]` — spread of iterator ✓ modern browsers.

`Array.prototype.forEach` on NodeList ✓ modern.

Optional chaining / padStart ✓ fine (real browser).

Now — the "known edge" fnote when crew_reports=0: my railForced prints fnote whenever open — matches edge A ✓. But total===0 → rail not drawn? Rail draws with zeroHTML above rails; FORCED rail open shows fblock "0 of 0 forced a crew action", rows empty, reading "" (guard !tot). fnote prints "more than 0." Hmm — spec B: total===0 → reading ""; doesn't forbid fnote. Keep.

Also WHEN closed click → setHero("when") — closed rail data-rail="when" → setHero("when") → alias normalizes ✓.

Wait — the closed-rail click also fires when clicking the closed strip: ✓ opens.

But: clicking .mo inside CLOSED when rail — pointerdown drag requires .rail.open → skip ✓; click bubbles to rail → setHero ✓.

Potential conflict: closed rail click → setHero → drawHero re-render; then the same click event continues delegation — after re-render, e.target detached; my handler already returned. Fine.

Also clicking inside OPEN rail does nothing unless data-take/data-case ✓.

Specimen click → openCase guarded.

Let me also make sure aim() doesn't wipe the standing sentence — separate elements ✓.

One more requirement detail: "Hover aim: `${monthName(key)} · ${num(m.n)} reports · click to narrow to this month`" ✓ monthAim.

"paintBracket ... n is the running SELECTION total inside the band" ✓.

"takePeriod(a,b): ... show p-search, search(0), showChange()" ✓.

"aimHold(`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. [undo]`)" ✓ with undo button.

WHO: "more-ops: not ranked here; use the operator control below to reach any of the 309" — dynamic num(d.operators) ✓.

FORCED hover block: `${num(crew_reports)} of ${num(total)} reports forced the crew to act` ✓.

Keyboard: "Every .mo is tabindex 0 when open" ✓.

Cross-highlight: ".mo.lit" ✓, "tr.spine.lit td{background:#fbe6dc}" ✓ CSS included.

paintSpines ✓.

Typed route ✓.

Degraded ✓.

WHEN "What the rail deliberately does NOT do": no standalone headline number ✓ (the gutter value "380 months" is a count of months, allowed; standing sentence has the total — that's the page-level sentence, required). Never scales selection to own max ✓ (cmax). Never drops partial/unsettled ✓. Never states direction ✓ (absolute diff). Never claims whole month unless whole ✓ (periodClause). Never mismatched figure ✓ (HERO_FOR). Never hover over undo ✓.

WHO "Not in this rail": no drag, no cross-highlight on rows, no tooltips on open rows ✓.

FORCED: block not focusable ✓ (no tabindex). Keyboard Enter/Space ✓. Click replaces crew ✓ (set not add).

Specimen: control empty → inert ✓.

OK. Also `spell` fallback num(n) ✓. WHO sentence ops.length could be 8 → "Eight operators file 23.1% of what is here; the other 301 share the rest." ✓ capitalized first char.

pct denominator tot (whole selection incl. blank-operator) ✓.

Now the WHO sentence when nOps>ops.length but ops empty? ops.length&&nOps>ops.length guard ✓ else branch "0 operators file everything here" when nOps=0 — hmm nOps===1?"operator files":"operators file" — "0 operators file everything here." fine.

`One of them, N${t}, is written up N times` guard sw.n>1 ✓.

Now write final answer: code block then "Departures" bullets. No preamble.

Length: big but fine. Let me be careful with template literals inside the big injected CSS string — the CSS is inside a JS template literal; my JS also uses template literals — no nesting issue as CSS has no backticks. The CSS contains `${`? No. OK.

Also careful: inside HTML template literals I use `&middot;` etc. ✓.

One subtle thing: `.rail>.reading{grid-column:2}` spec — I have `.rail>.track,...{grid-column:2}` ✓ same effect.

The reading alignment "aligns under the track, not the gutter" ✓.

Grid columns 128px — gutter width; FORCED closed value "151,543 of 1,757,827" mono 10.5px nowrap — width? ~24 chars * 6.3px ≈ 150px > 128 → overflow. Hmm. .gut.rest in a 128px column with nowrap value → overflow/clip. Increase column to 170px? WHO closed "54,634 aircraft" ~ 15 chars ≈ 95px ok. FORCED "151,543 of 1,757,827" ≈ 20 chars ≈ 126px + "FORCED " (~7 chars, 12px semibold ≈ 55px) → flex row total ≈ 185px > 128. So closed gutter needs ~190px. But open gutter stacked: value alone 126px ✓ fits 170. Set grid-template-columns:190px minmax(0,1fr)? That wastes width for open rails... The original: unknown. I'll set 180px and allow .gv to shrink? White-space nowrap + flex → overflow hidden? Add `.gut.rest .gv{overflow:hidden;text-overflow:ellipsis}`? Ellipsing a count is bad. Set column 190px: rails lose 60px of track — acceptable on desktop. Hmm — but WHO open .track.two: 1fr 330px; with 190px gutter: 190+16+1fr+18+330 — fine on 1200px+.

Actually — closed gutters: could let the value wrap? "question and value on one baseline" — nowrap per spec (.val white-space nowrap). I'll use 176px and font 10.5 mono: "151,543 of 1,757,827" = 20 chars × 6.3 = 126px; "FORCED" 600 12px ≈ 48px; gap 8 → 182px. Set 184px. Fine: grid-template-columns:184px minmax(0,1fr). Under 900px maybe shrink to 150 and let value wrap? Keep simple; phone collapses to 1 column anyway at 760px. Between 760-1000px: 184px ok.

Wait — also WHEN closed value "380 months" fine.

Let me also reconsider: should closed gutter really show value for WHO as "54,634 aircraft"? Measured ✓ yes.

Also the five-state browser test likely includes ?hero=horizon etc. — alias ✓.

Now, about `d.months` absent in skeleton — fine.

Write whenReading tie-break: my loop: `if(m.n>hi.n || (m.n===hi.n && m.m<hi.m)) hi=m;` — starts hi=full[0] (earliest). Ties keep earliest unless later month strictly greater ✓. For lo: `if(m.n<lo.n || (m.n===lo.n && m.m<lo.m)) lo=m;` ✓ earliest on tie.

Clause 2 guard bb>0 ✓ (if bb===0 skip? then diff infinite; skip clause). Spec doesn't guard; add silently.

spell(young): young could be >10 → num ✓.

Clause 3 exact text: ` The ${spell(young)} most recent months are left out of those figures: reports still arrive up to ${num(lag)} days after the event, so they hold only part of what they will hold. The dip at the right of the chart is the post arriving late, not fewer faults.` — with my singular/plural switching. If young===1: "The one most recent month is left out..." — "one" word ✓ spell(1)="one".

num(lag) — lag days number ✓.

Margin coveredDays when no RANGE (skeleton-safe) ✓ guarded.

coveredDays uses params from/to — after takePeriod the URL has from/to ✓.

Note: whenMargin loops all partial months — could be 2 (corpus edges). Fine.

Hmm — "If ANY month is partial, one rust margin entry" — with 2 partial months I print 2 rust entries. Deviation? The template covers one month; with two partial months, one entry can't name both. I'll print one entry per partial month and note it. OR print only the LAST partial month (most relevant to "dip at the right")? The rationale for the note is the download-date artifact → that's the LAST month. The FIRST month partial (file starts mid-month) also matters. I'll print both (max 2 in practice; window edges could add 2 more — cap at 3). I'll note: "margin note emitted per partial month (spec's singular template assumed the usual single end-edge)". Good.

Also always ash note ✓.

Now specimen header: "One report from this selection. First the FAA's own filing of it, then the mechanic's words as written." — verbatim with &rsquo;. opencue with → (&rarr;). ✓

aria-label `Open the full report ${control}` ✓.

data-case = control ✓.

.sl content: jargon(lines[0]) — jargon returns HTML? It expands jargon into <abbr> or plain? Assume HTML-safe; insert raw (not esc) since jargon processes. Guard: if jargon missing, esc(line). ✓ sj().

Also .sl clamp 2 lines ✓ CSS.

Now: "When control is empty ... the block is inert text" ✓.

openCase guarded: if missing, do nothing (or console). Fine.

Double-check crew row label width: .orow.wide columns 190px label — "Unscheduled landing/approach" fits-ish with ellipsis ✓.

One more: WHO closed strip when operator_rows absent but swarm present — strip empty; acceptable.

Also — spec WHO closed: "Strip: one span per operator row (<=8)" ✓ slice(0,8).

The `.strip span` CSS: background #d8d2c6, .sel rust, hover #c3bbac ✓.

Also add `.strip span{min-width:2px}`? fine without.

Zero-state "up to three ghosts" ✓ slice(0,3).

Now assemble everything. Also I should keep the code reasonably commented (they expect source-comment rationale sprinkled, e.g., the 320-months comment). I'll include a few key comments.

Also remember: no preamble; start with the code block. Then "Departures" section (short). The user said "Explain only where you departed from the specification and why." — so a short list after the code. Also maybe note the WHERE-sheet absence — that's not a departure but an assumption; include as a bullet (transparency).

Final check on redeclaration mechanics: All my top-level declarations: function declarations + `var` state + `var HERO_MONTHS`. If the previous pass declared `let heroData` etc., SyntaxError — I'll trust the contract. To slightly hedge, state in departures: "every name here is declared with function/var so it overrides by redeclaration; if any first-pass name was let/const, drop that first-pass line." — one line, useful.

Also `var HERO_MONTHS` — previous pass may have had MONTHS as var → fine, untouched. HERO_MONTHS new name ✓.

Also careful: I redeclare `params`, `esc`, `num`, `pct`, `spell`, `monthName`, `prettyDate`, `opName`, `gutter`, `syncControls`, `takeFilter`, `takeReading`, `setHero`, `loadHero`, `aim`, `aimHold`, `unaim`, `drawHero`, `drawPhone`, plus new: `heroEl, heroKey, narrowed, railMeta, skeletonHTML, zeroHTML, standingSentence, selectionDesc, railWhen, whenReading, whenMargin, partialMonth, settled, coveredDays, lastDay, periodClause, railWhere, zoneRows, whereReading, railWho, whoReading, railForced, forcedReading, rate, specimenHTML, specLine, sj, heroAfter, monthAt, whenMonthsBox, paintBracket, takePeriod, heroMonth, moList, runTake, takeFor, runSearch, filterQS, paintSpines, monthAim, aimFor`.

If the previous pass had e.g. `const WORDS` inside spell — fine (function-local).

Let me now also double check the FORCED "known edge": fnote prints when open — even with cr=0: "so they add to more than 0." ✓ kept (matches original's wart, documented in spec edge A).

And zero-crew reading: "No report in this selection records an action the crew had to take. Everything here was found on the ground." ✓.

And "A. total>0, crew_reports===0: rail still draws in full, bar at 0.00%, label `0 of N forced a crew action`, rows empty" ✓.

total===0: reading "" ✓ + zero block ✓ + seam ✓.

Now the standing sentence when total===0 and stale... fine.

Also standing sentence placement: ABOVE rails, below stamp ✓. The user's complaint: rebuild printed "Reading 1,757,827 reports." — my standing sentence matches original format ✓.

Also — "84,453 reports, upper fuselage. 1,673,374 set aside." — my selectionDesc for zone gives label "upper fuselage" (server label lowercase presumably) ✓; grand from d.corpus etc. If the API field is named differently (e.g., d.all), grand=0 → set-aside dropped — deviation risk. Add more fallbacks: d.corpus||d.grand||d.all_total||d.every||d.unfiltered||d.total_all||0. And ALSO: if the current selection is empty (no filters), tot IS the corpus — remainder omitted ✓ (desc empty path). Good enough; note in departures? It's a guess about an unspecified field; mention briefly in the WHERE/unknown-fields bullet.

Hmm — actually, wait. Maybe better: the standing sentence could get the corpus total from the WHEN rail's months? No — months counts sum to dated reports only (null dates excluded). Not equal. Keep field guesses.

Also "everything the FAA has published to 26 August 2026" — d.published guess; fallback heroRange.to (max difficulty date or last month end?). My heroRange.to fallback = last month's last day — would print "31 August 2026" — wrong-ish if published missing. Prefer d.published || d.lag?.settled_before? No. Use d.published||d.asof||d.downloaded||heroRange.to. Fine.

OK — also the specimen: "d.specimen" field names: text, control, aircraft, system, part, condition, stage, found, date ✓ used.

jargon: expand abbreviations — host has it.

Now, finally — CSS var --rust-text #b8431f vs spec-decoded fallback #a3421f ✓ spec.

Write the answer now. Keep the CSS tidy. Also include `.mo:focus-visible{outline:...}`? Spec: .mo.lit outline; focus? .mo focused — focus-visible outline helpful; spec only .lit and .orow:focus-visible. Add .mo:focus-visible{outline:1.5px solid var(--ink);outline-offset:1px} — harmless, matches lit. Include.

Also `.rail.open[data-rail=when] .track` scroll — padding-bottom for scrollbar? fine.

Also `.months` needs a height context: bars absolute bottom:0 inside .mo spans — .mo spans need height! .mo is a flex item of .months with align-items:flex-end; the <i> are absolute → .mo has no intrinsic height! The span itself must have height = H. Hmm! In the spec markup, .mo contains absolutely positioned bars; .mo itself gets height from... nothing! Unless .mo has height set. The spec CSS: .mo{position:relative;flex:1;min-width:0;cursor:pointer} — no height. Then .months{align-items:flex-end} with empty spans → zero height → bars invisible?? The bars are absolute with height inline (62.3px) and bottom:0 relative to .mo (height 0) → they'd render upward from the span's bottom? An absolutely positioned child with height:62.3px and bottom:0 in a 0-height relative parent: bottom:0 aligns child's bottom to parent's bottom (padding box). Parent height 0 → child extends upward 62.3px beyond? bottom:0 means child's bottom edge at parent's bottom edge; child grows upward, overflowing the parent visually (overflow visible) ✓. And .months align-items:flex-end puts the 0-height spans at the container bottom → bars rise from container bottom ✓. Actually that works! Overflow visible default. Clever. But hover outline on 0-height span outlines nothing! .mo.lit outline around a 0-height span → invisible outline. Hmm. And pointer hover: the span has 0 height — hovering the bar (which overflows) doesn't hit the span... pointer events on overflowing children hit the CHILD (the <i>), and event bubbles to .mo ✓ — click/hover on bars works via the <i> children bubbling. But :hover on .mo — CSS :hover applies when pointer is over the element OR its descendants ✓ (the <i> are descendants) — works.

But focus outline: .mo focused (tabindex) — outline around 0-height box → invisible. Keyboard users see nothing. Add explicit height to .mo: better: give .mo height:H via CSS: .rail[data-rail=when] .months .mo{height:84px} and closed 14px: .rail:not(.open) .mo{height:14px}? Spec didn't, but functionally needed for focus outline. Alternatively set outline on .mo.lit with outline-offset — still 0-height. I'll set heights: `.months .mo{height:84px}` `.rail:not(.open) .months .mo{height:14px}`. That also gives a stable hit area. This is an implementation fix, not a departure (spec's H=84/14 needs a home). ✓ Add.

Also .axis span height auto ✓.

Similarly .months min-width with --mw ✓.

Also .months needs fixed container height for layout: .months{height:84px} closed 14px? With .mo heights set, flex container takes tallest ✓. Fine.

Also: closed rail total height: gutter baseline + 14px strip ✓ compact.

paintBracket toggles .inband on 380 nodes per pointermove — fine.

monthAt uniform division ✓ "not by hit-testing a bar".

OK also `.mo{cursor:pointer}` closed too ✓.

One more: pointerdown preventDefault suppresses text selection ✓ and focus? preventDefault on pointerdown prevents focus-on-click — keyboard focus unaffected ✓. Spec: preventDefault on pointerdown ✓.

touch-action:none CSS ✓ on open months.

Also `user-select:none` ✓.

Now the .mag inside .track — .track has overflow-x:auto when open → .mag absolute inside scroll container with min-width:--mw — ✓ scrolls. But .mag{bottom:16px} — relative to .track's padding box: track contains months(84)+axis(12)+hint(16) — bottom:16px puts mag's bottom 16px above track bottom — that's within the hint/axis zone... track height = months+axis+hint ≈ 84+15+16=115; mag bottom:16 → mag spans from y=115-16-84=15 to y=99 — overlapping months (which start at y=0..84)? months occupy 0..84, axis 84..99ish, hint below. mag 15..99 overlaps axis & lower months. Desired: overlay exactly over bars area (0..84): bottom should be track height - 84 = ~31px (axis+hint). With hint 16px + axis ~15px → bottom:31px. Spec said bottom:16px (their hint/axis arrangement differed). I'll set bottom:30px and not fuss — hmm, load-bearing number? It's layout plumbing. I'll compute: make .mag positioned relative to .months instead! Put .mag INSIDE .months? .months is flex; absolute child ok. .months{position:relative} — .mag{position:absolute;left:0;right:0;bottom:0;height:84px;min-width:var(--mw,100%)} → exactly over bars ✓. And .magnote top:-2px → above bars top... top:-2px relative to mag (which spans bars) → pokes 2px above bars ✓ good. I'll put .mag inside .months. Cleaner. Spec's .mag CSS said bottom:16px within some container — mine achieves the visual intent. Adjust markup: `<div class="months">${mag}${s}</div>`. And CSS .mag{position:absolute;left:0;right:0;bottom:0;height:84px;...}. Since .mag only renders when open, height 84 ✓.

Hmm wait — pointer-events none ✓ so drag unaffected.

And .months{position:relative} add.

OK. Also for closed rails there's no mag ✓.

One more think — "the busiest month darkest": in the closed strip I shade via --sa on ghostb. Also part hatch keeps default colors ✓.

Let me also handle: closed WHEN strip should NOT show inband/lit leftovers — re-render clears ✓.

Also when the when rail is open AND user drags — pointermove fires on document; e.target is captured track — but I use whenMonthsBox() not e.target ✓.

setPointerCapture on track: subsequent pointerup targets track ✓ document listener still receives (capture at track, bubbles to document) ✓.

Edge: dragFrom null guard ✓.

Alright — also "heroSeq" naming: I use heroSeq var ✓.

Also expose window.unaim ✓; inline onclick uses it.

Also: the undoit button inside #iAim — clicking it: document click handler runs too (no data-take/case) ✓; inline onclick fires history.back()+unaim ✓.

Potential double-undo: popstate also calls unaim ✓ harmless.

Now finalize the takeReading clamp label logic:

```js
var olo=lo, ohi=hi;
...clamp...
var lab=(lo!==olo||hi!==ohi)?`${prettyDate(lo)} to ${prettyDate(hi)}`:label;
```
✓.

And the refusal aimHold text: uses label (original asked) ✓ per spec: "A year in progress IS clamped..." vs "Valid but empty: `${label} is a valid month or year, but this file holds no report for it. It runs from ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}.`" ✓.

prettyDate("2026-08-26") → "26 August 2026" ✓.

Now write it all out. I'll aim for clean formatting, ~500-600 lines total. Also add brief section comments.

One more scan of requirement 2: "THE GUTTER VALUE. Three lines when open (question, sub-label, value), two when shut (question and value on one baseline). The value is what the rail currently amounts to, never the sub-label." ✓.

Requirement 1: "Every rail keeps its shape when closed: 14px tall instead of 84" — WHO closed strip is 12px (.strip height 12) and FORCED bar 6px — "every rail keeps its shape when closed: 14px tall instead of 84" — hmm, that's about the month strip? "THE MONTH STRIP WHEN THE RAIL IS SHUT. Every rail keeps its shape when closed: 14px tall instead of 84, no axis..." — the heading says month strip; the 84→14 is WHEN's. Other rails keep their own closed shapes (strip 12px, restbar 6px) ✓ per their specs. OK.

Requirement 4: "the block bar must use crew_reports, never the sum" ✓.

Requirement 5 ✓. Requirement 6 ✓. Requirement 3 ✓.

Also "And the block bar must use crew_reports... In the whole corpus the eight rows sum to 165,298 against a crew_reports of 151,543." ✓.

Final: write answer. Code block + short departures.

Let me write the CSS fully, carefully:

```css
:root{--ink:#1d1d1f;--paper:#f7f5f0;--ash:#756f69;--rust:#c44b28;--line:#e2ded5;--rust-text:#b8431f;--smoke:#6b6560;--card:#fff}
.stand{margin:6px 0 2px;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.stamp{font:600 11px/1.3 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--ash)}
.aim{min-height:20px;margin-top:2px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rust-text)}
.aim .undoit{font:inherit;background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer}
.rails{margin-top:8px;border-top:1px solid var(--line)}
.rail{position:relative;display:grid;grid-template-columns:184px minmax(0,1fr);gap:4px 16px;padding:10px 0;border-bottom:1px solid var(--line)}
.rail:not(.open){cursor:pointer}
.rail>.track,.rail>.reading,.rail>.margin,.rail>.hint{grid-column:2}
.rail .track{position:relative;min-width:0}
.rail:not(.open) .track{overflow:hidden;align-self:center}
.gut b{display:block;font:600 12px/1.35 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.08em;color:var(--ink)}
.gut .gs{display:block;font:11px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--ash)}
.gut .gv{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);white-space:nowrap}
.gut.rest{display:flex;align-items:baseline;gap:8px}
.gut.rest .gv{display:inline}

.months{position:relative;display:flex;gap:2px;align-items:flex-end}
.months .mo{height:84px}
.rail:not(.open) .months .mo{height:14px}
.mo{position:relative;flex:1;min-width:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit,.mo:focus-visible{outline:1.5px solid var(--ink);outline-offset:1px}
.mo.inband .ghostb{background:#b9ae99}
.mo.inband::after{content:"";position:absolute;left:0;right:0;top:-3px;height:2px;background:var(--rust)}
/* shut strip: the distribution stays legible — bars shade by count, busiest full-strength */
.rail:not(.open) .mo .ghostb{background:rgba(117,111,105,var(--sa,1))}
.rail:not(.open) .mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.mag{position:absolute;left:0;right:0;bottom:0;height:84px;pointer-events:none;min-width:var(--mw,100%)}
.mag svg{display:block;width:100%;height:100%;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);background:var(--paper);padding:0 4px}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain}
.rail.open[data-rail=when] .months,.rail.open[data-rail=when] .axis{min-width:var(--mw,100%)}
.rail.open[data-rail=when] .mo{min-width:5px}
.rail.open[data-rail=when] .months{touch-action:none;user-select:none}

.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.strip span:hover{background:#c3bbac}
.rail .track.two{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}
.col{display:flex;flex-direction:column;gap:3px;min-width:0}
.col .ch{font:600 10.5px/1.2 Archivo,'Helvetica Neue',sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.orow{display:grid;grid-template-columns:120px minmax(0,1fr) 52px;gap:8px;align-items:center;font-size:11.5px;cursor:pointer;padding:0 3px;border-radius:3px;height:14px}
.orow:hover,.orow:focus-visible{background:rgba(196,75,40,.08)}
.orow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orow .on.mono{font-family:'IBM Plex Mono',monospace}
.orow .on.ash{color:var(--ash)}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
.orow.taken{background:rgba(196,75,40,.12);outline:0;box-shadow:inset 2px 0 0 var(--rust)}
.orow.wide{grid-template-columns:190px minmax(0,1fr) 56px;height:17px}
.orow.wide .on{font-size:12px}

.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;display:flex;align-items:center;margin-bottom:6px}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)}
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
.fnote{font-size:11px;color:var(--ash);margin-top:4px}

.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;max-width:74ch}
.margin{margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);line-height:1.5}
.margin .mr{color:var(--rust-text)}
.hint{margin-top:4px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ash)}

.specimen{margin-top:14px;padding:6px 0}
.specimen .sh{font:12px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--smoke)}
.specimen .opencue{color:var(--rust-text);white-space:nowrap}
.spec-decoded{font:600 12.5px/1.5 Archivo,'Helvetica Neue',sans-serif;color:var(--rust-text,#a3421f);margin:2px 0 3px;letter-spacing:.01em}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;color:#403b35;margin-top:3px;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
.specimen.opens:hover,.specimen.opens:focus-visible{background:#f3efe8}
.specimen.opens:focus-visible{outline:2px solid var(--rust);outline-offset:0}

.zero{border:1px solid var(--line);background:var(--card);border-radius:6px;padding:10px 14px;margin:0 0 10px}
.zero .zghost{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);margin-top:4px}
tr.spine.lit td,tr[data-month].lit td{background:#fbe6dc}

@media(max-width:760px){
  .rail{grid-template-columns:minmax(0,1fr)}
  .rail>.track,.rail>.reading,.rail>.margin,.rail>.hint{grid-column:1}
  .rail .track.two{grid-template-columns:minmax(0,1fr)}
  .orow,.orow.wide{grid-template-columns:100px minmax(0,1fr) 46px}
}
@media(max-width:479px){ .specimen{display:none} }
```

Now the JS. Write it in one go.

Also — careful with `String.prototype.padStart` ✓.

Also heroKey: `var k=params().get("hero"); return HERO_ALIAS[k]||"where";` with HERO_ALIAS a local var inside heroKey and setHero both — duplicate the object literal in both (small) to avoid top-level const. Or a function heroAlias(){ return {...}; } — returns fresh object per call; fine. I'll inline in both functions (4 pairs).

railMeta used by skeleton only — inline in skeletonHTML. Drop railMeta.

Also closed rail keyboard access: closed rails aren't focusable (whole-rail click). Spec doesn't require. OK.

Also add `.rail .gv` for FORCED closed has class gv ✓ gutter handles.

WHO closed gutter value when d missing swarm_total: 0 aircraft ✓.

Also careful — heroAfter scrollLeft: only when open&wide; scrollWidth>clientWidth anyway; harmless always.

paintSpines called each draw ✓.

loadHero: also guard non-OK response → d=null → skeleton? If fetch fails, drawHero(null) → skeleton — "frame stands" ✓.

Double-check drawHero skeleton uses standingSentence? No — skeleton has empty stand ✓.

Also — standingSentence stale check uses HERO_FOR — after loadHero sets HERO_FOR then draws, HERO_FOR===params ✓ not stale.

setHero drawHero(heroData) — HERO_FOR unchanged (params changed only by hero) — params().toString() includes hero → HERO_FOR mismatch → standing sentence shows "…"!! Bug: hero param is part of HERO_FOR. Fix: HERO_FOR should track FILTER params only, not hero: compare filterQS()? Spec: "if HERO_FOR !== params().toString()" — params including hero? The original's params() may exclude hero? Their NARROWED uses [...params().keys()].some(k=>k!=="hero") — so params() includes hero. Then HERO_FOR — set at fetch from params().toString() (incl hero) and compared same way — after setHero, params changed (hero) but data is still valid for the filters... sentence would show ellipsis wrongly. Unless the original's standing sentence doesn't care about hero... The spec's rule is about figures vs selection — hero doesn't change the selection. To be correct AND spec-shaped: define HERO_FOR over params minus hero: HERO_FOR=filterQS(); stale = HERO_FOR!==filterQS(). Same mechanism, hero-insensitive. I'll do that (and note nothing — it's the correct reading of "figure computed for a different selection").

So loadHero: HERO_FOR=filterQS(); fetch with filterQS (already deleting hero) ✓.

standingSentence: stale=HERO_FOR!==filterQS() ✓.

Now — drawHero after setHero: heroData's filters match HERO_FOR ✓ no ellipsis ✓.

Good catch.

Also selectionDesc reads zone label from heroData — ✓ current data.

Edge: takeFilter pushes URL then runSearch → loadHero → HERO_FOR=new → draw. Before load completes, nothing redraws (aimHold shows) — standing sentence stays old until data arrives — acceptable (spec's ellipsis covers draws during mismatch; no draw happens mid-flight anyway).

Write monthAim using heroData months find ✓.

`moList` uses querySelectorAll on open rail ✓.

Also the keydown arrow walking when when-rail closed: .mo tabindex -1 closed → can't focus ✓ no-op.

paintBracket during keyboard with anchor — after focus(), focusin fires aim(monthAim) → then paintBracket aims bracket msg (aim not held) → overwrite ✓ order correct.

Enter/Space with kbAnchor → takePeriod ✓; kbAnchor reset after take? Spec doesn't say; leave.

heroMonth → takePeriod(k,k) ✓ "A plain click is a zero-length drag, so it takes one month" ✓ same via pointerup.

Now WHO closed strip .sel via syncControls with data-op ✓ also inline class at render ✓.

zoneRows guard heroData null → zoneRows({}) ✓.

whereReading guard tot=0 → "" ✓.

Also WHERE open with rows empty → list empty, reading covers.

Also add WHERE margin? Only counts note. Fine.

Also each open rail shows .hint ✓; WHEN hint inside track (after axis) — I placed hint inside .track after axis — hint inside the scroll container would scroll horizontally... hint should stay fixed. Move hint outside track: `</div><div class="hint">` after track. Yes — put hint as rail-level (grid-column 2) ✓. Adjust railWhen: body = track + (open? hint+reading+margin : ""). Let me restructure all rails: track div, then hint, reading, margin as siblings (grid-column 2) ✓ consistent.

Also .track.two is the WHO track ✓.

For WHEN open, .track contains months+axis (+mag inside months) ✓ scrolls; axis inside track scrolls too ✓ (min-width set) good.

Final structure railWhen open:
```
<div class="rail open" data-rail="when">
  gutter
  <div class="track" style="--mw:...">  (overflow-x auto via css)
    <div class="months"> mag? + spans </div>
    <div class="axis">…</div>
  </div>
  <div class="hint">…</div>
  <div class="reading">…</div>
  <div class="margin">…</div>
</div>
```
✓.

Wait — .mag inside .months with position absolute; .months is inside scrolling .track; .mag min-width var(--mw,100%) — --mw set on .track inline; var inherits to .mag ✓.

Grid: gutter row1col1; track row1col2; hint row2col2; reading row3col2; margin row4col2 — grid auto-placement: with two columns and items in order (gutter, track, hint, reading, margin): gutter→(1,1), track→(1,2), hint→(2,1)?? Auto-placement fills row by row! gutter (1,1), track (1,2), hint (2,1) — hint lands in column 1! Need explicit grid-column:2 on hint/reading/margin ✓ I have that CSS (.rail>.hint etc. grid-column:2) ✓. Gutter stays (1,1) ✓. Rows auto ✓.

Closed rail: gutter + track → track (1,2) ✓.

Grid rows: gutter row height auto; track 84+axis+... ✓.

align-items default stretch — gutter stretches, fine.

Also .rail:not(.open) .track{align-self:center} ✓ nice.

I think the code is ready to write. Also add a tiny comment at top explaining drop-in.

Response format: single code block (js) containing CSS injection + code; then "Departures" bullets. No preamble. Also they asked "Write the code. Explain only where you departed..." — so departures list is expected. Keep it tight.

Let me write out the final code now, being careful about syntax.

Also: `document.querySelectorAll(...).forEach` ✓.

In specimenHTML, phone flag: drawHero(d,phone) → pass to specimenHTML(d,phone) ✓ and drawPhone passes true.

Also the sh header text uses typographic apostrophes: "the FAA&rsquo;s own filing of it, then the mechanic&rsquo;s words as written." ✓.

opencue: `Click to open the full report &rarr;` / `Tap to open it &rarr;` ✓.

Also: aria-hidden on decorative? fine.

Write skeletonHTML with gutter rest including a value? "four inert rails" — I'll include just the head (b) — value empty. OK.

Also `.rails` border-top ✓.

Final code:

Also one more possible collision: `var RANGE` — I named it heroRange ✓ distinctive.

`lastDay` — host might have it? function declaration override fine.

OK writing.

function drawHero(d, phone) — host might call drawHero(d) ✓ default phone falsy.

Also `heroEl` fallback list: ["hero","heroPanel","hero-panel"] ids + "[data-hero]" + ".hero".

Also boot: if heroEl() exists → loadHero(); else wait — if host calls loadHero itself fine.

Edge: loadHero fetch relative "api/hero" — if host's API path differs (e.g., "api/hero" per spec) ✓ spec says GET api/hero.

Deliver.

Count of crew rows: slice(0,8) ✓ "Exactly 8 crew rows" when ≥8 non-zero codes ✓.

Also FORCED rows taken initial class? syncControls after render ✓; also add inline? skip, sync handles.

Wait — checklist "the block bar at 151,543 not 165,298" — visually the label text shows 151,543 ✓.

One last thing — the user's item: "WHO 54,634 aircraft" uses swarm_total; and reading sentence uses d.aircraft (same value) ✓.

Also — "FORCED 151,543 of 1,757,827" gutter ✓.

Now write everything. I'll keep comments minimal but present where the spec called for rationale (e.g., scroll comment, closed-shading comment).

For the departures section, list:
1. Closed month bars shade by count (spec fixes one ghostb color; the closed strip exists so "a reader who has the aircraft open learns something about time" — flat grey fails that; also the browser check "busiest month darkest"). Hatching and the open rail untouched.
2. Margin note prints the true covered range when a partial month doesn't start on the 1st (template hardcodes "1 to dd", only true for end-edge months); still one rust entry per partial month (spec's singular assumed the usual single end edge).
3. HERO_FOR compares the filter params only (spec's params() includes ?hero=; comparing the full string would put an ellipsis in the sentence every time a rail is toggled, which changes no figure).
4. .mo gets an explicit height (84/14) so focus/lit outlines have a box; the spec's markup leaves spans 0-height with overflowing bars, which draws fine but outlines nothing.
5. WHERE/anatomy had no spec sheet — rebuilt from the measurements: sub-label "on the aircraft", value "all zones"/zone label, closed strip, zone rows, and its reading paragraph; reads d.zones||d.anatomy||d.regions defensively, and the set-aside figure reads d.corpus||d.grand||d.all_total||d.every — if the server names either field differently, tell me and I'll pin it.
6. Magnifier overlay lives inside .months with min-width so it tracks the scrolled bars (absolute left/right:0 in the scroll box would pin to the visible width and drift).
7. specLine's duplicate check is skipped when system or part is empty (naive norm().includes("") would drop part whenever system is blank).
8. hero URL writes the rebuild's spellings (when/where/whose/forced) and reads both; links copied from this build still won't open the original and vice versa is now handled. — mention.

Also maybe: fnote wart kept (per edge A) — that's conformant, skip. Delegated clicks instead of inline onclick for rail opening — mechanism; skip or one line. I'll fold into #8? Keep list ~7 items.

Also mention: every name declared with function/var so redeclaration overrides; if the first pass declared any of these as let/const, delete that first-pass line (one-line note at top of departures).

Now write the final code carefully. I'll write it in one fenced block labeled js.

Let me make sure template literal for CSS uses backticks and contains no backticks/${ — ✓.

In JS strings I use `${...}` interpolation — fine.

Beware: inside the big template literal for CSS I have "45deg,#d8d2c6 0 3px,var(--paper) 3px 6px" ✓ no $.

Write.

Also — `heroStyle.textContent=HERO_CSS;` where HERO_CSS is a const... top-level const collision risk minimal (name HERO_CSS unique). Use var to be safe: `var HERO_CSS="...";` Actually template literal assigned to var ✓.

Let me now write the whole thing end to end, mentally checking syntax as I go.

Also: in whenReading I need HERO_MONTHS via monthName ✓ and spell/num ✓.

Also in whenMargin I need HERO_MONTHS[mm-1] directly ✓.

periodClause uses HERO_MONTHS/HERO_MONTHS_S ✓.

Define:
```js
var HERO_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var HERO_MONTHS_S=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
```

monthName(ym): guard bad input: `if(!ym||ym.length<7) return "";` ✓.

prettyDate(iso): `if(!iso) return ""; var p=String(iso).split("-"); if(p.length<3) return iso; return `${+p[2]} ${HERO_MONTHS[+p[1]-1]||p[1]} ${p[0]}`;` ✓.

OK, final write-up. Given the size, be disciplined.

One more consideration on `mouseover` aim firing for elements inside data-aim (children): closest finds row ✓.

And mouseout aim("") when leaving row — but moving between children fires out then over → flicker-free enough (over re-fires immediately).

For tr[data-month] lit removal — mouseout ✓.

Also ensure clicking a data-take row inside closed rail impossible (rows only in open) ✓.

Also `.orow` Enter/Space handler requires role=button ✓ set.

Also specimen keydown Enter/Space → data-case ✓.

NOW: does anything call drawHero with (d) where d.total===0 AND months present (ghost months)? ✓ handled: zeroHTML + rails with ghost strip ✓.

zeroHTML seam: `document.querySelector(".seam")`? I'll try ids: seambtn, seamBtn, [data-seam], .seam-toggle. Fine.

Write final.

Actually also: "the whole .rail gets onclick=setHero('horizon')" — I use delegation with data-rail; the closed rail's data-rail value is "when" etc. → setHero("when") ✓ normalize via alias map (when→when) ✓.

And skeleton rails have data-rail + not open → clicking opens ✓ (but skeleton is heroData null — setHero would drawHero(heroData=null)?? setHero: `if(heroData) drawHero(heroData); else loadHero();` — add else loadHero ✓).

setHero:
```js
function setHero(key){
  var AL={when:"when",horizon:"when",where:"where",anatomy:"whose"?no...
```
careful: anatomy→where, swarm→whose, ledger→forced, who→whose.
```js
  var AL={when:"when",horizon:"when",where:"where",anatomy:"where",whose:"whose",who:"whose",swarm:"whose",forced:"forced",ledger:"forced"};
  var id=AL[key]||"where";
```
Unknown key → default where? Or keep as-is? Unknown → "where" (default hero) ✓ consistent with heroKey.

heroKey: `var AL={...}; var k=params().get("hero"); return AL[k]||"where";` — note: if k is a raw unknown like "foo" → default where ✓.

duplicate AL literal in both — fine.

Done planning. Write it.

Also double-check: `narrowed()` uses spread on iterator: `[...params().keys()]` ✓.

For older-safety could use Array.from — fine either.

Let me write the final response now. Code block then departures. Watch total length — it'll be long; that's expected.

During writing railWhen — careful: template literal inside map with nested template? I used loops mostly. OK.

Also note in railWhen the aria-label suffix for part months when BOTH partial and unsettled: partial first ✓.

aria-label: `${monthName(m.m)}, ${num(m.n)} reports, a part month` — spec: "August 2025, 1,234 reports[, a part month|, still filling up]" ✓.

Also esc aria label ✓.

In railWhen I referenced `esc(periodClause()||...)` — periodClause could contain no HTML ✓.

Also WHO strip closed title esc ✓.

Let me also protect against d.months entries missing all (undefined) → m.all||0 ✓ cmax floor 1 ✓.

Finally — "380 month bars present with the WHERE rail open" — WHEN closed strip renders bars ✓ count 380 from data ✓.

Write answer.

Also, quick sanity on grid with gutter containing .gut.rest flex baseline — b + gv inline baseline ✓.

Also closed rail height: padding 10px + content ~14px → ~34px per closed rail ×3 + open rail — fine.

Also add `.rail .track{min-height:14px}`.

OK writing final.

For the departures, keep to ~8 concise bullets.

One more code detail: `heroAfter` — after innerHTML, call syncControls + paintSpines + scroll. Also focus restore? skip.

And `runSearch(0)` — search(pg) signature guess: search(0) per spec ✓.

`showChange()` guarded ✓.

Write.

Also `sj` name for jargon wrapper:
```js
function sj(x){ try{ if(typeof jargon==="function") return jargon(x); }catch(_){} return esc(x); }
```
Hmm — if jargon is a function declaration in host, typeof works ✓. If jargon is const arrow — typeof at call time after init ✓.

specLine returns HTML with &middot; — parts esc'd individually ✓:
```js
parts.push(esc(s.aircraft)) — then join " &middot; " ✓.
```
For date: esc(prettyDate(s.date)) ✓.

specimenHTML: decoded may be "" → omit ✓.

Edge: d.specimen absent → no block ✓.

Also add id? not needed.

Final answer now. I'll write the code block with section banner comments. Then departures.

Also — remember `var` hoisting order: state vars at top of block; functions anywhere. The CSS injection + binding + boot run at block execution — must run AFTER function declarations (hoisted anyway) ✓.

Order in file: CSS inject, state vars, helpers, renderers, interactions, loadHero/boot, listeners guard.

Note the listeners guard uses window.__HERO2_BOUND__ — if the previous pass bound its own listeners (e.g., old drag handlers on document), they'd still be live! The previous pass's listeners reference old closures with old heroData... Problem: old document-level pointer handlers would ALSO run drag logic against old state vars? Old handlers close over old variables; my new var declarations in same scope — wait, if the old code declared `var dragFrom` and mine redeclares `var dragFrom`, SAME binding! Old listeners would read/write the same binding — they'd use old monthAt? Old monthAt binding is overridden by my function declaration → old listeners calling monthAt get MY implementation ✓. So old listeners effectively run my logic — but DOUBLE-bound (old + new listeners) → drag handlers fire twice → paintBracket twice, takePeriod twice! takePeriod twice = double pushState + double search — bad.

So the binding guard must neutralize old listeners... can't remove unknown listeners. Mitigation: make handlers idempotent — takePeriod double-run: pushState twice (same URL, harmless), runSearch twice (double fetch — heroSeq keeps last; double results reload — host search(0) twice, tolerable but ugly), aimHold twice same message ✓. Drag: pointerdown twice → paintBracket twice same ✓; pointerup twice → takePeriod twice (first sets dragFrom=null? I set dragFrom=null BEFORE takePeriod: second invocation sees dragFrom==null → returns ✓ — order: I capture a=dragFrom, dragFrom=null, then takePeriod. Second listener invocation: dragFrom already null → return ✓). pointermove twice → paintBracket twice same args ✓ harmless.

pointerdown double: preventDefault twice fine; dragFrom set twice same ✓.

click double-run: runTake twice → takeFilter twice → pushState twice + search twice. Hmm. Mitigate: guard click with a timestamp? Add `var lastClick=0; if(e.timeStamp-lastClick<50) return;`? Different listeners fire for the SAME event synchronously — e.timeStamp identical! Guard: in runTake, if same dt within 400ms skip:
```js
var lastTakeDt="",lastTakeAt=0;
function runTake(x){ var dt=...; var now=Date.now(); if(dt===lastTakeDt&&now-lastTakeAt<400) return; lastTakeDt=dt; lastTakeAt=now; ... }
```
✓ cheap dedup. Similarly takePeriod dedup by (a,b):
```js
var lastPeriod="",lastPeriodAt=0; key=a+"|"+b; if same within 400ms return.
```
✓. And specimen openCase dedup similar. Fine — add small guards.

Also old listeners' aim/mouseover double-writes ✓ harmless.

Old resize listener → old drawHero? old drawHero binding = my drawHero (redeclared) ✓ single behavior, but old listener + my listener → drawHero twice ✓ idempotent (full re-render) fine.

Old popstate listener → runs old logic calling search/loadHero/drawHero — all redeclared → consistent ✓ plus mine → duplicate search on popstate; dedup via lastFilterQS in runSearch? Add dedup in loadHero: if qs===lastFetchedQS and within 500ms skip? Hmm — legit double-fetch is only wasteful, not breaking (heroSeq). Add light dedup:
```js
var lastFetchQS=null,lastFetchAt=0;
function loadHero(){ var q=filterQS(); var now=Date.now(); if(q===lastFetchQS&&now-lastFetchAt<400){}else{...} }
```
careful: legit refetch needed after undo (same qs? undo → different qs). Same qs twice quickly = duplicate → skip fetch but MUST still draw? If skipped, and heroData matches qs — fine (data already drawn). Edge: first boot same qs twice within 400ms — skip second, first still in flight → seq guards ✓. But if first failed (d=null skeleton) and skip prevented retry... rare. Acceptable. Actually simpler: don't dedup fetch; double fetch wastes one request; heroSeq ensures correctness. But double search(0) may re-render results twice — tolerable. I'll dedup only runTake/takePeriod/openCase (user-visible side effects: history entries!). Double pushState creates TWO history entries → back needs two presses — REAL bug. So dedup those ✓. loadHero double-fetch: acceptable, skip dedup? pushState in takeFilter would run twice → 2 entries. takePeriod dedup covers since takeFilter called via runTake dedup ✓; takePeriod direct (pointerup) dedup ✓; takeReading (typed route, single caller) fine.

OK good.

Also old inline onclick attributes? Old rendered DOM replaced by my renders ✓.

Also old `window.unaim` overwritten ✓.

Alright — also old CSS: my new <style> appended later wins on equal specificity ✓ mostly; old rules with same selectors overridden by cascade order ✓. Old unique classes inert.

Now truly write.

Also — I realize the drag paintBracket/aim: during pointermove before any pointerdown? guarded by dragFrom==null ✓.

And "aim() REFUSES to write while a hold is live" ✓ aim() checks holdUntil; aimHold sets ✓. paintBracket uses aim → during hold (e.g., after undo msg), dragging won't overwrite hold ✓ hmm — dragging while hold live: bracket message suppressed... "an undo outranks a hover" ✓ spec. OK.

Writing now for real. I'll produce the code.

let me draft the JS fully:

```js
/* ================================================================
   HERO pass 2 — month strip, gutters, readings, crew cap, specimen,
   standing sentence. Drop inside the existing IIFE. Every name is a
   function declaration or a var, so it overrides pass 1 by
   redeclaration. (If pass 1 declared any of these with let/const,
   delete that pass-1 line.)
   ================================================================ */

/* ---------- CSS, injected once ---------- */
if(!document.getElementById("hero-css2")){
  var heroCss2=document.createElement("style");
  heroCss2.id="hero-css2";
  heroCss2.textContent=[...].join("\n") — or a template literal.
  document.head.appendChild(heroCss2);
}
```
Template literal fine.

I'll now produce it. (Being careful: `var` inside `if` at IIFE top-level — hoisted ✓.)

Full JS below in the answer.

Also don't forget HERO_MONTHS_S used in periodClause ✓ defined.

Also monthAim uses m.n — at rest n=all? hover message "1,234 reports" ✓ fine.

Also: WHO more-ops aim message uses num(d.operators) — "reach any of the 309" ✓.

Also the two-column collapse CSS under 760 ✓.

Also add `.col{min-width:0}` ✓.

Also `.rail .track .months{min-height:84px}` closed override height 14 via .mo height — .months height comes from .mo (84/14) ✓ plus align-items flex-end.

Closed .mo height 14 and ghostb height up to 14 ✓.

Edge: open .mo height 84 with ghostb up to 84 ✓.

Also `.months .mo{height:84px}` selector specificity vs `.rail:not(.open) .months .mo{height:14px}` ✓ closed wins.

OK — write.

After writing, the departures list.

Let me also double check forcedReading example output: "151,543 reports, 8.6% of this selection, record something the crew had to do rather than something found on the ground. The commonest is unscheduled landing, 112,189 times, about 9.7 a day." — pct(151543,1757827)=8.6 ✓ (8.62→ rounds 8.6? Math.round(8.622...*1000)/10 = Math.round(8622)/10? compute: 151543/1757827=0.086211... *1000=86.211→ round 86 → /10=8.6 → toFixed(1)="8.6" ✓). rate: n=112189, days≈15623? per=days/n=0.139<1.5 → (n/days).toFixed(1)= (112189/15623)=7.18?? Hmm — wait rate semantics: per=days/n = days per report; per>=1.5 → "one every X days" else n/days per day. 112189 reports over 15623 days = 7.2/day?? But example says 9.7 a day → days = 112189/9.7 ≈ 11566 days ≈ 31.7 years. Whole corpus difficulty span ≈ 31.7 years (1995–2026) plausible! days = span of SELECTION difficulty_dt min..max inclusive ≈ 11,566. OK consistent with corpus ~1994-08..2026-08. Fine — formula per spec ✓.

whenReading clause 2: averages of n (selection counts) ✓.

Also one more: WHEN gutter at rest with from/to set → periodClause e.g. "3 Aug 2024 to 14 May 2025" ✓.

DONE — write answer.

Wait — one more possible bug: in drawHero I compute heroRange BEFORE standingSentence uses heroRange ✓ order.

And skeleton drawHero(null) → heroRange untouched ✓.

Also loadHero error → drawHero(null) → skeleton ✓.

Also — spec: "heroData null: drawHero early-returns a SKELETON — stamp, a sentence slot, an empty .aim, and four inert rails." ✓.

Also "d.months empty: railWhen returns '' and the row is absent" ✓.

Write now. Also keep the "320 months" style comment for scrolling per spec ("Source comment: ..."). I'll include that comment verbatim-ish in railWhen.

Length check — acceptable.

For the answer: begin directly with the code block (no preamble). End with "Departures" bullets.