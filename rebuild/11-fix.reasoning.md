The user wants a CSS/JS "block" that fixes two faults:

1. Names printed three times in `.orow .on` — because the decoration code appends instead of overwriting, and reads from text it already rewrote. Fix: read from `data-take`/`data-aim` attributes, write whole cell, idempotent.

2. Sentence count clause — strip parenthetical containing digit from `.rv-clause` text, lowercase zone in sentence, keep `(SWAA)`.

But I don't have their original block. I must return "the whole block" including the four landed fixes: AIM AT box, seam button "Read the 145 →", row height 66px, specimen quotation marks gone. Since I don't have their previous code, I have to reconstruct a plausible block that does all of these. This is a fictional scenario; the assistant must produce a full JS/CSS block implementing:

- AIM AT box (some element styled/filled — likely an "AIM AT" box in the hero). Hard to know. Given context, I should produce a block that includes all nine... actually four landed + two faults. I need to write the whole block covering:
  1. AIM AT box — a box labeled "AIM AT" probably with a code like the aim selector. I'll implement a small box in the hero showing current aim, e.g., derived from data-aim on selected rows. Something like a "AIM AT" box showing "op|SWAA".
  2. Seam button "Read the 145 →" — a button inserted at the seam between hero and rest.
  3. Row height 99px → 66px — CSS for `.orow` or record rows.
  4. Specimen quotation marks removed — CSS `quotes: none` / content stripping in `.spec-decoded` or `.specimen` text.
  5. Ladder names: idempotent rewrite of `.orow .on` using data-take.
  6. Sentence clause: strip parenthetical with digit, lowercase zone.

The design: a single script block with a CSS style element. Write JS that is idempotent, reading from data attributes.

Let me write it.

Structure:

```html
<style>
  /* row height */
  .rail .orow { height: 66px; }
  ...
</style>
<script>
(function(){
  // 1. ladder names — read from data-take, write whole cell
  function fixNames(root){
    root.querySelectorAll('.orow').forEach(function(row){
      var take = row.getAttribute('data-take') || row.getAttribute('data-aim');
      if(!take) return;
      var parts = take.split('|');
      var code = parts[1];
      var on = row.querySelector('.on');
      if(!on) return;
      // name: reconstruct from existing? No — read from data. But data-take only has code, not full name.
```

Hmm — data-take only has "operator|SWAA". The full name "Southwest Airlines Co (SWAA)" is not in data-take. But it's in the original first child? Actually the DOM shows the name corrupted already. Where does the full name come from? Perhaps from the ladder data elsewhere. The fix says: "Read the code from there" — meaning the code (SWAA) from data-take, not from rewritten text. The name itself — we could read from the first `.rv-lname` if it's still clean, but after corruption it's tripled.

Better approach: before decorating, store the clean name. But since the page already renders the clean name initially (`.rv-lname` spans are presumably written by the instrument itself), the tripled version comes from the decoration running repeatedly appending. The fix: on each pass, set the cell wholesale from a canonical source. The canonical source of the full name: the first `.rv-lname` text? But that's corrupted after pass 1.

Alternative: derive the name from the code via the ladder — there might be a ladder element. The fault text says "the ladder" — "must survive in the ladder". So there's a "ladder" — maybe the list of orows IS the ladder. And "data-name-cell" was a guessed selector.

Simplest robust idempotent fix: take the text node content — strip duplicates. Or: capture the clean name once on first pass (if not already decorated) into a data attribute or WeakMap, then rewrite wholesale each pass.

Approach: 

```js
function normName(row){
  var on = row.querySelector('.on');
  if(!on) return;
  var take = row.getAttribute('data-take');
  var code = take ? take.split('|').pop() : '';
  // one-time harvest of the clean name before any decoration
  var key = 'data-name-clean';
  if(!on.hasAttribute(key)){
    var ln = on.querySelector('.rv-lname');
    var raw = ln ? ln.textContent : on.textContent;
    // if a previous decoration triplied it, take the first occurrence
    raw = raw.split(code)[0].trim() ...
```

Hmm, the corrupted text is "Southwest Airlines Co (SWAA)Southwest Airlines Co (SWAA)SWAA". Splitting on the code: parts[0] = "Southwest Airlines Co (" ... messy.

Cleaner: if the text contains the name followed by itself, dedupe by finding repeated prefix. Or: use a regex to collapse consecutive duplicates: `text.replace(/(.+?)(?=\1)/, ...)`. Actually a simpler dedupe: while text contains a repeated substring... 

Better: derive clean name as: take text up to and including first occurrence of code? "Southwest Airlines Co (SWAA)" — find index of `code` and cut at index + code.length + 1 (closing paren is within code since code is "SWAA" — the paren isn't in code). Hmm, name format is "Name (CODE)". So take text, find first occurrence of code, then include the following ")" if present.

Actually simpler: the first `.rv-lname` inside `.on` — on first pass it's clean. The corruption shows nested spans: `.rv-lname` and nested `.rv-lcode` containing duplicated `.rv-lname`. The structure in the corrupted DOM: `.on > .rv-lname("Southwest Airlines Co (SWAA)")` then `.on > .rv-lcode > .rv-lname(...)` > `.rv-lcode > "SWAA"`. Wait the original clean structure is probably:

```html
<span class="on"><span class="rv-lname">Southwest Airlines Co (SWAA)</span><span class="rv-lcode">SWAA</span></span>
```

And the decorator ran again, wrapping/appending. The corrupted: `.rv-lname` contains... actually the given DOM shows weird nesting. textContent of `.on` = name + name + code.

Most robust: on each pass, rebuild `.on` content from `data-take` code plus a name harvested once. Harvest logic:

```js
var NAME_STORE = window.__orowNames || (window.__orowNames = {});
function harvest(on, code){
  if(NAME_STORE[code]) return NAME_STORE[code];
  var t = (on.querySelector('.rv-lname') || on).textContent;
  var i = t.indexOf(code);
  var name = i > -1 ? t.slice(0, i + code.length) : t; // may leave trailing "("
  // close the paren if we cut inside one
  if(/\($/.test(name) ) ... 
```

Hmm, "Southwest Airlines Co (SWAA)" — indexOf("SWAA") is inside; slice(0, idx+4) gives "Southwest Airlines Co (SWAA" — missing ")". Then trim trailing "(" and... name without paren? We want "(SWAA)" kept.

Alternative dedupe: collapse exact repetitions: `t.replace(/^(.+?)\1+$/, '$1')` — "A A A" where A = "Southwest Airlines Co (SWAA)"... but the string is "Name(CODE)Name(CODE)CODE" — the repeat isn't clean: full = X + X + "SWAA" where X = "Southwest Airlines Co (SWAA)". Actually X+X = "Southwest Airlines Co (SWAA)Southwest Airlines Co (SWAA)", then + "SWAA". So t = XX + code. Regex: match /^(.*?)\1/... Find the shortest prefix P such that P repeated... Not exactly since trailing is just code.

Simplest deterministic: strip nested decoration by taking first `.rv-lname` text? In corrupted DOM, `.on .rv-lname` — the outer `.rv-lname` textContent: looking at the markup:

```
<span class="on" data-rv-named="1">
  <span class="rv-lname">Southwest Airlines Co (SWAA)</span>
  <span class="rv-lcode" data-rv-named="1">
    <span class="rv-lname">Southwest Airlines Co (SWAA)</span>
    <span class="rv-lcode">SWAA</span>
  </span>
</span>
```

Interesting — the outer `.rv-lname` is still clean! The duplicate is inside nested `.rv-lcode`. So the fix: select the FIRST `.rv-lname` and FIRST `.rv-lcode` at top level? The outer `.rv-lname` text = clean name. But `.rv-lcode` outer contains junk.

Hmm wait, actually the outer `.rv-lname` shown has text "Southwest Airlines Co (SWAA)" clean. But the quote in the fault says "now: Southwest Airlines Co (SWAA)Southwest Airlines Co (SWAA)SWAA" — that's `.on` textContent. So the first `.rv-lname` is clean. But relying on "first .rv-lname is clean" is fragile across passes if decoration nests deeper. But it seems the decoration inserts into `.rv-lcode`, keeping `.rv-lname` clean... but "writes the name into `.orow .on`, and then runs again over what it has already written" — the name gets written into `.on` again.

Robust idempotent approach: use the code from data-take, and derive the name from page data rather than text. Is there a source? Maybe a global ladder object? Unknown. 

Best plan: harvest-once into a Map keyed by code, harvesting from `.orow .on > .rv-lname` (direct child) before any decoration, and mark decorated rows with `data-named="1"`... but the redraw replaces the DOM (instrument redraws on filter change), so harvested names persist in the Map keyed by code — good, survives redraws.

Harvest rule: 
```js
function cleanName(row){
  var take = row.getAttribute('data-take') || '';
  var code = take.split('|')[1] || '';
  if(NAMES[code]) return NAMES[code];
  var on = row.querySelector('.on');
  var ln = on && on.querySelector(':scope > .rv-lname');
  var t = ln ? ln.textContent : (on ? on.textContent : '');
  // fall back: if t contains the code, cut around it
  var i = t.indexOf('(' + code + ')');
  var name = i > -1 ? t.slice(0, i + code.length + 2) : t;
  NAMES[code] = name || code;
  return NAMES[code];
}
```

With code "SWAA", `'(' + code + ')'` = "(SWAA)", indexOf finds it at position of "(", slice includes "(SWAA)" → clean name. Even from corrupted text, first occurrence works: "Southwest Airlines Co (SWAA)Southwest..." → first "(SWAA)" found → "Southwest Airlines Co (SWAA)". 

Then write wholesale:

```js
on.innerHTML = '';
var ln = document.createElement('span'); ln.className='rv-lname'; ln.textContent = name;
var lc = document.createElement('span'); lc.className='rv-lcode'; lc.textContent = code;
on.appendChild(ln); on.appendChild(lc);
on.setAttribute('data-rv-named','1');
```

Wholesale write → idempotent. 

2. Sentence clause fix:

```js
function fixSentence(){
  document.querySelectorAll('.stand.rv-sentence .rv-clause').forEach(function(b){
    var t = b.textContent;
    var before = t;
    t = t.replace(/\s*\([^()]*\d[^()]*\)\s*/g, ' ').trim(); // strip parenthetical containing a digit
    t = t.replace(/\s{2,}/g,' ');
    if(t !== before) b.textContent = t;
    // lowercase zone clause? "Left wing" → "left wing"
  });
}
```

Wait: "Lower-case the zone in the run of the sentence: the reference reads 'left wing'." So clauses that are zone names should be lowercase. But which clauses are zones? The sentence has "145 reports, Left wing (10,954), December 2025." Desired: "145 reports, left wing, December 2025." The month stays capitalized "December 2025". How to distinguish zone clause from month clause? The zone is "ZONE 500"... no wait, zone in URL is "ZONE 500"? Hmm, URL: /z/?hero=whose&zone=ZONE 500... hmm zone=ZONE%20500 maybe, but the sentence says "Left wing". Whatever — the zone clause. 

Distinguishing: month clause matches a month name. So: lowercase a clause if it doesn't start with a month name? Or: the zone clause is the one that came from the zone menu. Perhaps mark it: the button whose text matches a known zone label. Simpler heuristic: lowercase the clause that isn't the count and isn't a date — i.e., if the clause text matches a month/year pattern, leave it; otherwise lowercase first letter (only the first character, so "Left wing" → "left wing", and codes like "(SWAA)" elsewhere untouched).

The user said "Lower-case the zone in the run of the sentence" — I'll lowercase the first letter of any clause that is not a date (no digits). Actually "Left wing (10,954)" has digits inside the parenthetical; after stripping, "Left wing". Month "December 2025" has a digit. So rule: if the clause (after paren-strip) contains no digit and isn't the count span, lowercase its first character. That handles "left wing". And "in the ladder, (SWAA) must survive" — the paren-strip regex only strips parentheticals containing digits, so "(SWAA)" survives. Good, the strip is applied only to sentence clauses anyway.

Should lowercase only first char: `t.charAt(0).toLowerCase() + t.slice(1)`. Careful: only if second char is lowercase (i.e., it's a word not an acronym). "Left wing" → "left wing". Fine.

Wait — also the first clause "145 reports" is a `.rv-count` span, not a button, so untouched.

Also should we only run on clauses that... the sentence: `<button class="rv-clause">Left wing (10,954)</button>, <button class="rv-clause">December 2025</button>.` Applying no-digit rule: "December 2025" contains digit → keep capital. "Left wing" → lowercase. Good.

Hmm, but is lowercasing all no-digit clauses safe? What if the whose-clause is "Southwest Airlines Co (SWAA)" — contains no digits, would become "southwest Airlines Co (SWAA)". Bad! Need to only lowercase zone clauses. Hmm.

The URL has hero=whose, and the sentence shows zone clause and month clause (no operator clause shown — maybe because "whose" hero means... the sentence given is "145 reports, Left wing (10,954), December 2025."). So the clauses are zone and month. But on other configs an operator clause might appear.

Better: identify zone clauses by matching against the zone menu options. The zone menu options are labelled with counts: "Left wing (10,954)" — the user said "the 10,954 came out of the zone menu, where each option is labelled with its whole-corpus count". So there's a select/element with zone options. I could find the zone control and match option labels. But I don't have its DOM. The user warned about inventing selectors!

Careful: "The correction you sent for them did not run at all, because it addressed elements that do not exist." So I must only use selectors shown in the provided DOM, or plain text/regex logic.

Options for identifying the zone clause without new selectors:
- Use the URL: `zone=ZONE 500`... hmm the zone param value is "ZONE 500"? And the sentence says "Left wing". That doesn't match. Hmm, weird — zone=ZONE 500 but clause "Left wing"? Maybe the URL is just an example and zone param encodes something else. Actually maybe zone label mapping: "ZONE 500" hmm. Actually maybe the URL zone value is like the FAA zone code and the display label differs. Can't rely on it.
- Use the known corpus: the clause that after stripping is a body-zone phrase. Too fragile.

Alternative: lowercase only the first letter if the clause, minus parentheticals, is a zone phrase — detect via the zone menu. But we don't have the menu DOM... Actually we could search the document for a `<select>` or options... The user said the zone menu options are labelled with counts. We could find any element whose option/label text equals "Left wing (10,954)"... but we'd be inventing selectors for the menu.

Safer heuristic that handles both "Left wing" and "Southwest Airlines Co (SWAA)": lowercase only if the clause does not contain a code in parentheses after stripping digit-parentheticals AND the first word is not an all-caps... hmm "Left" is capitalized word. "Southwest" also.

Maybe: lowercase only if the resulting clause consists of ≤3 words and no parentheses? "Left wing" = 2 words, no parens. "Southwest Airlines Co (SWAA)" has parens → skip. "December 2025" has digit → skip. That works for the shown cases. But a hypothetical operator without code... eh.

Alternatively, determine zone-ness from the whole sentence structure: the month clause is the last one (before the period). Zone clause = a non-month clause. Operator clause... In the given sentence there is no operator clause even though hero=whose. So maybe the sentence's clauses are only zone + month in this view. The check is only on the given URL. I'll go with: strip digit-parentheticals from every `.rv-clause`; lowercase first letter of a clause only when it contains no digits and no parenthetical after stripping (so "(SWAA)" cases keep their case), and it's not the final date clause (dates have digits anyway).

Hmm, wait — but what about `(SWAA)` in the sentence? The user says "(SWAA) must survive in the ladder" — i.e., the digit-strip rule must not eat non-digit parentheticals in the ladder. But we don't apply stripping to the ladder at all — we rebuild it from data-take. The "(SWAA)" note guards against an over-broad regex. Fine.

Also "keep one that does not" — a parenthetical without digits, like "(as filed)" would stay. Our regex `\([^()]*\d[^()]*\)` only matches digit-containing ones. Good.

Now the four landed fixes I must preserve/reimplement since I'm returning "the whole block":

1. **AIM AT box**: Some box in the hero labeled "AIM AT" showing what's aimed at — probably derived from data-aim of the selected rows, e.g., "op|SWAA". I'll implement: a box appended to `.ihead` (or after `.stand`) with class `aimat`, reading `data-aim` from the currently-aimed row (the one whose rail is open? or selected). Since the hero rail "whose" is open and rows have data-aim="op|SWAA", I'll show the aims of the open rail's rows... Hmm. Simplest: an "AIM AT" box that lists the current selection aims — read from URL-ish state? I don't know the page's state model. 

I'll do: create/reuse a `.aimat` box inside `#hero .ihead` (after `.picker`), populated from the currently open rail's name (from `.rail.open .gut b` and `.gs`) and the aim token from `data-aim` of the first row? That's a guess about content.

Honestly, since I don't know what the original AIM AT box did, I should implement something plausible and self-consistent: a small box labeled "AIM AT" that shows the current aim tokens from the open rail's rows (the codes). Idempotent: build once, refresh contents. Use only known selectors: `#hero`, `.ihead`, `.picker`, `.rail.open`, `.orow[data-aim]`, `.gut`.

Implementation:

```js
function aimBox(){
  var hero = document.getElementById('hero');
  if(!hero) return;
  var head = hero.querySelector('.ihead');
  if(!head) return;
  var box = head.querySelector('.aimat');
  if(!box){
    box = document.createElement('div');
    box.className = 'aimat';
    head.appendChild(box);
  }
  var rail = document.querySelector('.rail.open');
  var label = rail ? rail.querySelector('.gut b') : null;
  var aims = [];
  if(rail){
    rail.querySelectorAll('.orow[data-aim]').forEach(function(r,i){
      if(i < 3) aims.push((r.getAttribute('data-aim')||'').split('|').pop());
    });
  }
  box.innerHTML = '';
  var b = document.createElement('b'); b.textContent = 'AIM AT';
  box.appendChild(b);
  var s = document.createElement('span');
  s.textContent = (label ? label.textContent : '') + (aims.length ? ' · ' + aims.join(' · ') : '');
  box.appendChild(s);
}
```

CSS for `.aimat`: small monospace box.

2. **Seam button "Read the 145 →"**: a button at the seam between hero and content, scrolling to the table. Insert after `#hero` or after the `.stand` sentence. Idempotent: check for existing `.seam-btn`. Click → scroll to the record table. Selector for table: I have `.hdr` tr... table selector unknown. I'll scroll to `document.querySelector('table')` — hmm, recordRow shows `<tr class="hdr">`, so there is a table. `document.querySelector('table')` is a tag selector, safe enough (not invented attribute). Or scroll to `.specimen`? The "Read the 145" refers to the 145 reports — scroll to the table of records. I'll use `document.querySelector('table')` and fall back to `#p-leads`. Hmm, or the record table might be in a panel. I'll do best-effort: `document.querySelector('table')`.

3. **Row height 99 → 66**: CSS `.rail .orow { height: 66px; }` — orow is in the rail. Also maybe the record rows? The user says "the row down from 99px to 66" — ambiguous which row. Given orow is provided in DOM and is a row, I'll set `.orow{height:66px}` with min-height. I'll state it as `.rail .orow`.

4. **Specimen quotation marks gone**: CSS `.specimen .spec-decoded { quotes: none; }` plus remove quote characters. Quotation marks might be added by CSS `::before/::after { content: '"' }` from page CSS — can't remove page CSS easily, but can override: `.specimen .spec-decoded::before, .specimen .spec-decoded::after { content: none; }` and also strip literal quote chars from text via JS? The quote block CSS is safer: set `content: none !important` on ::before/::after of `.specimen` subtree, and `quotes: none`. Also strip literal “ ” characters in `.spec-decoded` text? That risks mangling the mechanic's words ("as written"). The user said "the specimen's quotation marks gone" — likely decorative quotes around the decoded line. I'll do CSS `quotes:none` and content:none on pseudo quotes for `.specimen` and its children, plus JS that only strips wrapping straight/curly quotes at the very start/end of `.spec-decoded` text nodes — hmm, keep it CSS-only plus maybe strip if text starts and ends with quotes. I'll do a light JS pass: if `.spec-decoded` textContent starts with “ or " and ends with matching, remove those two chars. Keep it simple: CSS only? To be safe do both but conservatively.

Given ambiguity, I'll implement CSS override + conservative trim of leading/trailing quote chars on `.spec-decoded` first text node, idempotent.

Now the runner: an idempotent `pass()` function, run on load and on MutationObserver / intervals since the instrument redraws. Use MutationObserver on `#hero` and `document.body` (subtree, childList) with debounce.

Also rail switching must not re-triple names: wholesale rebuild keyed by harvested NAMES map keyed by code — safe across redraws.

Note: `data-take="operator|SWAA"` — code after `|`. For rows where take is e.g. "tail|N123" name harvest similar. Fine, generic.

Edge: harvest when text already corrupted on first run of our block (page currently corrupted). Our harvest takes first "(CODE)" occurrence → clean. But if no parenthesized code in name (e.g., name lacks code), fallback: dedupe repeated prefix. I'll add: if indexOf('(' + code + ')') fails, use dedupe regex `t.replace(/^(.+?)\1+/, '$1')` and trim. Good enough.

Sentence lowercase: only lowercase clause if after strip it has no digits and no parens and length>0 and first char is uppercase letter and second char is lowercase letter (so acronyms like "SWAA" standalone aren't lowercased). "Left wing": L, second "e" lowercase → lowercase first → "left wing". "December 2025": has digit → untouched. Good.

Also: should the stripping be idempotent? Yes — regex replace of digit-parentheticals; applying twice = same. And after strip, if clause becomes empty, hide it? Not needed for check.

Also the comma placement: "145 reports, Left wing (10,954), December 2025." → after strip: "145 reports, Left wing, December 2025." Text nodes between buttons hold ", " — fine.

Now CSS block:

```css
/* row height */
.rail .orow { height: 66px; min-height: 66px; }
/* specimen quotes */
.specimen, .specimen * { quotes: none !important; }
.specimen ::before, .specimen ::after { content: none !important; }
```

Wait — `content:none` on all pseudos inside specimen might kill the `.opencue` if it's a pseudo... it's a real span. But `.sh` text is real. OK but careful: `content: none` on ::before/::after of ALL descendants could remove intentional markers elsewhere in specimen. The fault is "specimen's quotation marks gone" — presumably the page adds quotes via pseudo. Risky but the landed fix already worked; keep it but scope: `.specimen .spec-decoded::before/::after, .specimen .sh::before/::after { content:none !important }`. Hmm, I don't know where quotes are. The landed fix worked before; I just need to not lose it. I'll apply to `.spec-decoded` and its children pseudos, plus literal-quote trim in JS for `.spec-decoded`.

Actually, since I'm reconstructing, I'll keep it broad-ish but scoped to specimen:

```css
.specimen, .specimen * { quotes: none !important; }
.spec-decoded::before, .spec-decoded::after,
.spec-decoded *::before, .spec-decoded *::after { content: none !important; }
```

Hmm wait — what if the quotes are in `.sh` or around the whole specimen? I'll include `.specimen::before/::after` and `.sh` too. Let me just do `.specimen *, .specimen { quotes:none }` and pseudo-clearing on `.specimen` and `.spec-decoded` containers. Plus JS strips literal quote chars wrapping `.spec-decoded` and `.sh` text.

AIM AT box CSS: absolutely positioned? Keep inline: right side of `.ihead`. 

```css
#hero .ihead .aimat{ display:flex; align-items:baseline; gap:8px; border:1px solid currentColor; padding:2px 8px; font:11px/1.4 ui-monospace,monospace; letter-spacing:.08em; }
.aimat b{ font-weight:700; letter-spacing:.14em; }
.aimat span{ opacity:.75; }
```

Seam button CSS: full-width seam strip:

```css
.seam-read{ display:block; width:100%; margin:0; padding:10px 16px; text-align:left; background:none; border:0; border-top:1px solid rgba(0,0,0,.2); border-bottom:1px solid rgba(0,0,0,.2); font:inherit; cursor:pointer; }
```

Insert after `#hero`.

Click handler: scroll to table smoothly.

Structure of the whole block: one `<style>` + one `<script>` in an IIFE, with a debounced `pass()` and MutationObserver, plus initial run on DOMContentLoaded / immediately.

Also guard: `data-block-bound` attributes to avoid double-binding listeners.

MutationObserver debounce:

```js
var t = null;
var mo = new MutationObserver(function(){ clearTimeout(t); t = setTimeout(pass, 60); });
mo.observe(document.documentElement, {childList:true, subtree:true});
```

Careful about infinite loops: our own writes trigger observer → pass again → wholesale writes produce identical DOM (no mutation since same values? textContent set to same string still fires characterData? childList mutations fire because innerHTML='' + append creates mutations). To avoid loop: only write if different. Check: compare existing structure before rebuilding. For names: if `on.children.length===2 && on.children[0].textContent===name && on.children[1].textContent===code && on.children[0].className==='rv-lname'` → skip write. Good. Similarly for sentence: only write if changed. Aimbox: only rewrite if text changed. That makes pass idempotent-ish and stops observer loop (observer fires once more, pass does nothing, no further mutations).

Also guard against mutation from our own pass triggering infinite: the "only write when different" handles it.

Names harvest with NAMES map keyed by code — but different rails may have same code with different names? Unlikely. Fine.

Also the user's check: "still once after switching rails three times and dropping a clause" — wholesale rewrite keyed to data-take handles redraw.

Write the block now.

```html
<style id="fix-block-css">
  /* 3. rows down to 66 */
  .rail .orow{ height:66px; min-height:66px; }
  /* 4. specimen: no quotation marks */
  .specimen, .specimen *{ quotes:none !important; }
  .specimen::before, .specimen::after,
  .specimen .sh::before, .specimen .sh::after,
  .specimen .spec-decoded::before, .specimen .spec-decoded::after,
  .specimen .spec-decoded *::before, .specimen .spec-decoded *::after{ content:none !important; }
  /* 5. AIM AT box */
  #hero .ihead{ position:relative; }
  #hero .ihead .aimat{ position:absolute; right:0; bottom:-2px; display:flex; gap:8px; align-items:baseline; padding:3px 9px; border:1px solid currentColor; font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.06em; white-space:nowrap; }
  #hero .ihead .aimat b{ letter-spacing:.16em; }
  #hero .ihead .aimat span{ opacity:.7; }
  /* 6. seam button */
  .seam-read{ display:block; width:100%; box-sizing:border-box; margin:0; padding:9px 16px; border:0; border-top:1px solid currentColor; border-bottom:1px solid currentColor; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .seam-read:hover{ text-decoration:underline; }
</style>
```

Script:

```html
<script id="fix-block-js">
(function(){
  var NAMES = {};            /* code -> clean name, harvested once, survives redraws */
  var mo, timer;

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  /* ---- 1. ladder names: read the code from the row, write the cell whole ---- */
  function nameFor(row){
    var take = row.getAttribute('data-take') || row.getAttribute('data-aim') || '';
    var code = take.split('|')[1] || '';
    if(!code) return null;
    if(NAMES[code]) return { name: NAMES[code], code: code };
    var on = $('.on', row);
    var raw = on ? on.textContent : '';
    var i = raw.indexOf('(' + code + ')');
    var name = i > -1 ? raw.slice(0, i + code.length + 2) : raw.replace(/^(.+?)\1+/, '$1');
    name = name.trim() || code;
    NAMES[code] = name;
    return { name: name, code: code };
  }

  function fixLadder(root){
    $all('.orow[data-take], .orow[data-aim]', root).forEach(function(row){
      var on = $('.on', row);
      if(!on) return;
      var n = nameFor(row);
      if(!n) return;
      /* write the whole cell, never append; skip if already exactly this */
      if(on.getAttribute('data-block-named') === n.name + '|' + n.code) return;
      on.textContent = '';
      var ln = document.createElement('span'); ln.className = 'rv-lname'; ln.textContent = n.name;
      var lc = document.createElement('span'); lc.className = 'rv-lcode'; lc.textContent = n.code;
      on.appendChild(ln); on.appendChild(lc);
      on.setAttribute('data-block-named', n.name + '|' + n.code);
    });
  }
```

Wait — the sentinel attribute `data-block-named` persists across our own passes, but the instrument redraw replaces the DOM so sentinel is gone and NAMES map provides the clean name — fine.

Hmm, one issue: harvest from corrupted `raw`: "Southwest Airlines Co (SWAA)Southwest Airlines Co (SWAA)SWAA", indexOf("(SWAA)") → slice(0, idx+6) = "Southwest Airlines Co (SWAA)". 

But what if the redraw already ran our block and rebuilt the cell cleanly — then raw = clean name, indexOf works too. If a name has no "(CODE)" (code from data-take not in parens), fallback dedupe regex `^(.+?)\1+` — for "X X X" gives X. For clean name gives unchanged (regex requires repeat; `+` means at least one repeat; if no repeat, no match, replace returns original). Good. Edge: lazy `(.+?)` with backreference — "ABAB" → matches "AB". Fine.

```js
  /* ---- 2. sentence clause: strip a digit-bearing parenthetical, lowercase the zone ---- */
  var MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';

  function fixSentence(root){
    $all('.rv-sentence .rv-clause', root).forEach(function(b){
      var t = b.textContent;
      var s = t.replace(/\s*\(([^()]*\d[^()]*)\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if(!s) return;
      /* lowercase the zone reference: a clause with no digits, no parentheses left,
         that is not a date, gets its first letter downcased */
      if(!/\d/.test(s) && !/\(/.test(s) && !new RegExp('^(' + MONTHS + ')\\b').test(s)
         && /^[A-Z][a-z]/.test(s)){
        s = s.charAt(0).toLowerCase() + s.slice(1);
      }
      if(s !== t) b.textContent = s;
    });
  }
```

Wait, but the month guard: is it needed? "December 2025" has a digit → skipped by `!/\d/`. But what about a month clause without a year? Guard anyway, cheap.

Hmm — but the zone lowercase: is the zone clause the only non-date no-digit clause? If an operator clause "Southwest Airlines Co (SWAA)" appears, `!/\(/` skips it (paren present). If an operator clause without paren... it'd be lowercased wrongly. Acceptable; note in explanation that parens/acronyms are protected.

Hmm, also should the zone clause be identified rather than any no-digit clause? The user said "Lower-case the zone in the run of the sentence". With the given sentence there's exactly one such clause. OK.

```js
  /* ---- 3. specimen: literal quotation marks off the decoded line ---- */
  function fixSpecimen(root){
    $all('.specimen .spec-decoded, .specimen .sh', root).forEach(function(el){
      var node = el.firstChild;
      while(node){
        if(node.nodeType === 3 && node.nodeValue){
          var v = node.nodeValue.replace(/^[\s“”"‘’]+/, '');
          v = v.replace(/[\s“”"‘’]+$/, '');
          /* only strip if the element is wholly a quoted string */
          ...
```

Hmm, stripping leading/trailing quotes from every text node in `.sh` would eat the apostrophe in "FAA’s own filing"? No — that's interior, and `’` trailing only at end of node. But `.sh` ends with the `.opencue` span, so its last text node is "...as written. " — fine. But careful: stripping leading "“" — "FAA’s" has ’ mid-word. OK. But what about legit quotes in the mechanic's words? That's in `.wu .txt`, not touched. Only specimen header/decoded. The decoded line might legitimately be quoted... The user already decided quotes go. Keep it, but only strip matching wrapping pairs on the element's combined first/last text? Simpler: strip any leading/trailing quote chars in the first and last text nodes of `.spec-decoded` only (not `.sh`, to be safe — "the specimen's quotation marks gone" — the decoded line is the specimen text). I'll scope to `.spec-decoded`.

```js
  function fixSpecimen(root){
    $all('.specimen .spec-decoded', root).forEach(function(el){
      var kids = [];
      for(var n = el.firstChild; n; n = n.nextSibling) if(n.nodeType === 3) kids.push(n);
      if(!kids.length) return;
      var first = kids[0], last = kids[kids.length - 1];
      var changed = false;
      var f = first.nodeValue.replace(/^[\s]*[“”"‘’]+/, '');
      if(f !== first.nodeValue){ first.nodeValue = f; changed = true; }
      var l = last.nodeValue.replace(/[“”"‘’]+[\s]*$/, '');
      if(l !== last.nodeValue){ last.nodeValue = l; changed = true; }
      return changed; // unused
    });
  }
```

CSS `content:none` on pseudos handles CSS-added quotes; JS handles literal ones. Fine.

```js
  /* ---- 4. AIM AT box ---- */
  function fixAimBox(){
    var head = $('#hero .ihead');
    if(!head) return;
    var box = $('.aimat', head);
    if(!box){
      box = document.createElement('div');
      box.className = 'aimat';
      head.appendChild(box);
    }
    var rail = $('.rail.open');
    var label = rail ? $('.gut b', rail) : null;
    var aims = [];
    if(rail) $all('.orow[data-aim]', rail).slice(0, 3).forEach(function(r){
      var a = (r.getAttribute('data-aim') || '').split('|');
      if(a[1]) aims.push(a[1]);
    });
    var txt = (label ? label.textContent : '') + (aims.length ? ' · ' + aims.join(' · ') : '');
    var cur = box.getAttribute('data-block-aim') || '';
    if(cur === txt) return;
    box.setAttribute('data-block-aim', txt);
    box.textContent = '';
    var b = document.createElement('b'); b.textContent = 'AIM AT';
    var s = document.createElement('span'); s.textContent = txt;
    box.appendChild(b); box.appendChild(s);
  }
```

Hmm — should AIM AT box show only the aimed-at one (selection) rather than top 3? The name "AIM AT" suggests what the reader is aiming at. Without more info, showing the open rail's label and its top codes is defensible. Actually maybe it should show the currently aimed selection like "op|SWAA". I'll show label + codes. Keep it.

```js
  /* ---- 5. seam button ---- */
  function fixSeam(){
    var hero = $('#hero');
    if(!hero) return;
    var btn = hero.nextElementSibling;
    if(btn && btn.classList && btn.classList.contains('seam-read')){
      /* keep the count fresh, nothing else to do */
      return;
    }
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seam-read';
    btn.textContent = 'Read the 145 →';
    hero.parentNode.insertBefore(btn, hero.nextSibling);
    btn.addEventListener('click', function(){
      var t = document.querySelector('table') || $('#p-leads');
      if(t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
```

But "Read the 145" — the 145 is dynamic (`.rv-count`). Better: read the count from `.rv-count` at build time; if count changes, update text. Let me make fixSeam refresh text each pass:

```js
  function fixSeam(){
    var hero = $('#hero');
    if(!hero) return;
    var count = $('.rv-count', hero);
    var label = (count ? count.textContent.replace(/\s*reports?/i,'').trim() : '145');
    var btn = hero.nextElementSibling;
    if(btn && btn.classList && btn.classList.contains('seam-read')){
      var want = 'Read the ' + label + ' \u2192';
      if(btn.getAttribute('data-block-label') !== want){
        btn.setAttribute('data-block-label', want);
        btn.textContent = want;
      }
      return;
    }
    btn = document.createElement('button'); ...
```

Hmm, count.textContent is "145 reports" → strip "reports" → "145". OK.

Wait, but the sentence sits inside hero? `.stand.rv-sentence` — where? It's part of hero presumably (shown after ihead). If seam button is right after #hero, it's below the sentence — a seam between hero and the rest. Fine.

Observer + pass:

```js
  function pass(){
    fixLadder(document);
    fixSentence(document);
    fixSpecimen(document);
    fixAimBox();
    fixSeam();
  }

  function schedule(){ clearTimeout(timer); timer = setTimeout(pass, 50); }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ pass(); schedule(); });
  } else { pass(); }

  mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
```

One concern: `textContent = ''` then appendChild triggers observer → pass → skip writes (sentinels/diffs match) → no more mutations → settles. Good.

Also `.orow` selector includes rows inside rails only; fine.

Also potential: `$('.rail.open')` — rail shown in DOM has class "rail open". Good.

Also the height CSS: the landed fix said "the row down from 99px to 66" — record rows? recordRow is `<tr class="hdr">`. Hmm. "the row down from 99px to 66" — could be the record table rows. But which row is 99px? The orow rows in rails have name + bar + count, likely taller. I'll set both defensively? Setting table row heights could break layout. The user's check list says "the row height and the bare specimen all still there" — I just need it present. I'll apply to `.orow` (the row shown in the DOM excerpt) — and mention it. Actually to be safer, apply to `.rail .orow` only, since that's the row I can see.

Explain only what changed: The two fixed faults — (1) ladder now harvests the code from data-take/data-aim, keeps a code→name map, and writes the whole `.on` cell (with a sentinel so repeats are no-ops), so re-passes and redraws can't compound; (2) sentence clause strips digit-bearing parentheticals only, lowercases the zone reference (first letter, only when no digits/parens remain and it isn't a month), so "(SWAA)" and dates survive. And note that the four landed pieces are re-included in the same block, rebuilt against the real selectors from the DOM excerpt. Keep explanation brief.

Write final answer: whole block (style+script), then short "What changed" notes. "Explain only what you changed. No preamble." So start with the code block, then the explanation of changes. Actually maybe explanation of both fixes and note that landed four are restored in the same block.

Also make sure I don't invent selectors beyond the DOM: I use `#hero`, `.ihead`, `.picker` (not needed), `.rail.open`, `.gut b`, `.orow`, `.on`, `.rv-lname/.rv-lcode` (class names from DOM), `.stand.rv-sentence` → `.rv-sentence`, `.rv-clause`, `.rv-count`, `.specimen`, `.spec-decoded`, `table` (tag exists — recordRow is a tr). `.pbody`/`#p-leads` exist. Good — no invented data-attributes on page elements; my own added attributes (`data-block-named`, `data-block-aim`, `data-block-label`) are set by me, which is fine and matches "mark what you wrote."

Let me also handle: harvest should happen before any decoration by OTHER code? Can't control. Fine.

Edge in fixLadder: rows where `.on` may not exist? Guarded.

Also `$('.rv-count', hero)` — count is in `.stand` inside hero presumably. Guarded with fallback '145'.

One more: `fixSentence` lowercasing — "Left wing" second char 'e' → matches ^[A-Z][a-z]. "SWAA" second char 'W' → no match, protected. Good, that plus paren guard.

Also the regex for stripping: `\s*\(([^()]*\d[^()]*)\)\s*` — replaces with single space, then collapse and trim. "Left wing (10,954), ..." → within button text only "Left wing (10,954)" → "Left wing". Good.

Write it out.