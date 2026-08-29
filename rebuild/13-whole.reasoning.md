Let me understand the fixes needed.

**Fault 1: triple names.** The current `rvRenameLadder` finds leaves with text matching `/^[A-Z]{3}A$/` and replaces. The DOM shows the nested duplication: first pass sets `.on` textContent to lname+code spans, marking things `data-rv-named`. Second pass finds the new `.rv-lcode` leaf containing "SWAA" (matches regex, has data-rv-named so skipped... wait, but on re-run, harvest... Actually the nesting shows `.rv-lcode` with `data-rv-named="1"` containing `.rv-lname` + `.rv-lcode`. So on second pass, the leaf check: `.rv-lcode` has firstElementChild now (it contains spans), so it's not a leaf. Hmm, but it got wrapped again — the inner spans `.rv-lname` and `.rv-lcode` are leaves. `.rv-lcode` text is "SWAA" — matches regex — but has `data-rv-named` set... it got data-rv-named on first pass. Wait, the markup shows `.rv-lcode` with data-rv-named="1" containing rv-lname and rv-lcode. So on the second pass, the leaf `.rv-lcode` (inner, no data-rv-named... actually outer lcode has data-rv-named) — hmm.

Let's trace: first pass: leaf `<span class="on">SWAA</span>`? Actually original orow probably `<span class="on">SWAA</span>` or similar. The code sets n.textContent='' and appends lname+code spans, sets data-rv-named on n (the `.on` span). Second pass: leaves now include `.rv-lname` ("Southwest Airlines Co" — doesn't match regex) and `.rv-lcode` ("SWAA" — matches). `.rv-lcode` doesn't have data-rv-named (only parent `.on` does). So it replaces the lcode's content with lname+code spans again → nesting. Third pass nests again. That matches the observed DOM.

Fix per instructions: read code from `data-take`/`data-aim` attributes on the `.orow` row (`data-aim="op|SWAA"`), and replace the whole cell rather than appending. So new approach: find `.orow` elements (or elements with data-take/data-aim matching operator), parse code from attribute, find the name cell (the `.on` span?), and set its content idempotently: build `Southwest Airlines Co (SWAA)` as fresh content each time — set textContent so re-runs give same answer.

The target output: "Southwest Airlines Co (SWAA)" — one string. So name + " (" + code + ")". Should we keep the .rv-lname/.rv-lcode classes? The check is just text "Southwest Airlines Co (SWAA)" once. Simpler: replace the `.on` cell's content with a single span, or just text. Let's write:

```js
function rvRenameLadder() {
  Array.prototype.forEach.call(document.querySelectorAll('.orow[data-take], .orow[data-aim]'), function (row) {
    var m = (row.getAttribute('data-take') || row.getAttribute('data-aim') || '').split('|');
    if (m[0] !== 'op' && m[0] !== 'operator') return;
    var code = (m[1] || '').trim();
    if (!/^[A-Z]{3}A$/.test(code)) return;
    var name = RV_AIR[code] || RV_AIR_FALLBACK[code];
    if (!name) return;
    var cell = row.querySelector('.on') || row;
    var want = name + ' (' + code + ')';
    if (cell.textContent.trim() === want) return;
    cell.textContent = want;   /* replace whole cell; a second pass gives the same answer */
  });
}
```

Wait — but do we want to keep styling? The CSS has .rv-lname/.rv-lcode. We could do a fresh build each time:

```js
cell.textContent = '';
var nm = rvEl('span','rv-lname'); nm.textContent = name;
var cd = rvEl('span','rv-lcode'); cd.textContent = '(' + code + ')';
cell.appendChild(nm); cell.appendChild(cd);
```

But .rv-lcode has margin-left:7px — " (SWAA)" with parentheses. Target shows "Southwest Airlines Co (SWAA)". Either way works. Simpler and safest for idempotency: set textContent to the full string, or rebuild spans fresh. Since we clear textContent first, rebuilding is idempotent. I'll rebuild spans but mark with data-rv to avoid... actually no need for markers if we always rebuild. But MutationObserver: our own change triggers rvApply re-run; rebuilding is same result, and textContent comparison prevents infinite loops (we return early if matches). Good — include the early-return compare to avoid churn.

But careful: the `cell.textContent.trim() === want` check — after rebuild, text is "Southwest Airlines Co (SWAA)" (with the margin via CSS not text). If I rebuild spans, textContent = name + '(' + code + ')' without space if I rely on CSS margin. Then compare fails each time and rebuilds — infinite mutation loop risk? MutationObserver triggers rvApply, which rebuilds, but the rebuild produces identical DOM... does MutationObserver fire on identical replacement? Yes, replacing nodes fires mutations even if identical. That causes infinite loop of rvApply every 250ms. To be safe, compare before and skip. So build `want` string and compare cell.textContent.trim() — make the rendered text exactly "Southwest Airlines Co (SWAA)". Simplest: just set `cell.textContent = want` (plain text, no spans). Lose the small designator styling but the check requires the text once; keeping simple is safer. But maybe keep the styling: the check says ladder reads "Southwest Airlines Co (SWAA)". Plain text satisfies it. I'll do plain text with optional styling... Actually I could keep rv-lname span for the whole thing. Let me do:

```js
cell.textContent = want;
```

That's the most robust. Also remove old data-rv-named handling — no longer needed. But also need to clean up the already-mangled DOM? The block runs fresh each page load (it's injected), so the mangled state in the given DOM is from the old code; new code replacing the whole `.on` cell content fixes it on first run regardless. But if the old mangled DOM persists and new code runs, `cell = row.querySelector('.on')`, textContent is the mangled mess, doesn't match want, so we replace. Good.

Also keep CSS for rv-lname/rv-lcode? Can keep but unused; better to remove or keep harmless. I'll keep the CSS (harmless) or remove. I'll remove rv-lname/rv-lcode CSS? The instructions say explain only what changed; keeping unused CSS is fine but cleaner to keep since .rv-lcode was also... it's only used by rename. I'll leave the CSS in place to minimize diff — actually "row height" fix changes CSS too. Let me just leave name CSS as-is (harmless). Hmm, I'll remove them to keep tidy? Risky? No risk. But minimal diff is better for review. I'll leave CSS, note it's now unused... Actually simpler: keep CSS. Fine.

**Fault 2: count in zone clause.** The zone name comes from the select option labels which include counts like "Left wing (10,954)". Fix: in rvBuildHeadline, strip bracketed digits from zoneName and lowercase it. "Lower-case the zone inside the sentence." So "Left wing (10,954)" → "left wing". Strip `/\s*\([^)]*\d[^)]*\)/g` — brackets containing a digit. Keep "(SWAA)" — but that's in the ladder, not the sentence; the instruction "Drop a bracket that contains a digit; keep one that does not" applies generally, but zone labels wouldn't have non-digit brackets... Just apply to zoneName: remove bracketed groups containing a digit. Also lowercase first letter? "Lower-case the zone inside the sentence" — whole zone lowercase? "left wing" — original "Left wing". Should it be fully lowercase or just first letter? Zone labels might be like "Left Wing"? The example: "Left wing (10,954)" → "left wing". Safest: lowercase the first character only? If label is "LEFT WING" then we'd want... The example only shows first char. I'll lowercase the whole string? Risk: "CVR" → "cvr". Hmm. Zones are aircraft zones like "left wing", "empennage". I think lowercasing entire string is what "lower-case the zone inside the sentence" means. But could destroy acronyms. Given the check string is "left wing", either works. I'll lowercase the first letter only... Actually "Lower-case the zone" — I'll do full lowercase of the zone label? Hmm. The example given in "should be" is "left wing". The source label "Left wing" differs only in first letter. If labels were "Left Wing", full lowercase gives "left wing" — matches too. If a zone is "Fuselage Centre Section", full lowercase gives "fuselage centre section" — sentence style, fine. I'll do full lowercase — sentence style. Actually careful: could be "Zone 500"? No — zoneName comes from RV_ZONES label. Fine, full lowercase via toLowerCase(). Hmm, but what if label is like "ATA 32"? Digits not in brackets... "Lower-case the zone inside the sentence" — I'll do `zoneName.toLowerCase()` after stripping digit-brackets. Wait — should I strip brackets containing digits only, keeping non-digit brackets? For zone names, keep `(SWAA)`-like brackets if any. Implement:

```js
zoneName = zoneName.replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g,' ').trim();
```

Also maybe strip other bracket types? Keep to parentheses. Then lowercase.

Where is zoneName computed? In rvBuildHeadline:

```js
var zoneName = zraw ? (RV_ZONES[zraw] || P.get('zone')) : '';
```

Add stripping/lowercasing after. Note: rvDrop uses button click to drop zone param — unaffected.

**Fault 3 (item 9 correction): row height.** "You applied the row height to `.rail .orow`... The row I measured at 99px is the record row in the results table, `#rr-table tr`, against 73px in the original. Leave the ladder alone."

Current CSS:

```
.rv-row{padding-top:5px !important;padding-bottom:5px !important;line-height:1.35 !important;}
```

and rvTagRows adds .rv-row to children of the records list container found via rvRowsFor('Read the whole write-up'). Wait — but the complaint says row height applied to `.rail .orow`? Hmm — rvRowsFor climbs from a leaf containing "Read the whole write-up" to a container with ≥6 siblings containing it. Could that climb land on something that includes the rail? The ladder rows `.orow` — do they contain "Read the whole write-up"? Probably not. But the seam button... Hmm, "You applied the row height to `.rail .orow`" — maybe the rvRowsFor climb found a container that encompasses the rail too (e.g., the results section contains both the ladder rails and the table?). Actually more likely: rvRowsFor climbs from "Read the whole write-up" markers which exist both in the rails? Hmm, the railWho orow rows... The writeup HTML shows `data-rv-moved` on gloss buttons — those are in the table rows. The ladder orow rows don't have writeup text. But maybe rvRowsFor's marker climb: leaves containing "Read the whole write-up" — first leaf could be... whatever. If container found includes the rails section, its children get .rv-row including rails → 14px→taller. Regardless, the fix per user: apply row height to `#rr-table tr` and leave ladder alone.

The user says: "The row I measured at 99px is the record row in the results table, `#rr-table tr`, against 73px in the original." So change CSS selector from `.rv-row` to `#rr-table tr` (or keep rv-row but only tag #rr-table rows). Given previous failures came from invented selectors — but `#rr-table tr` is given by the user ("The page's own markup, so nothing has to be guessed"). They explicitly state the record row is `#rr-table tr`. So:

CSS: replace `.rv-row` rules with:

```
#rr-table tr{padding-top:5px !important;padding-bottom:5px !important;line-height:1.35 !important;}
#rr-table tr :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
```

Hmm wait, do tr elements have padding? In table layout, padding on tr doesn't apply in border-collapse... Actually padding on `tr` applies in some browsers? Padding applies to table rows in CSS (applies to rows per spec, though behavior varies). The original code applied .rv-row to row container divs. Given user says #rr-table tr is the row measured at 99px, apply there. But what does rvTagRows do then? It tags children of the container found by rvRowsFor. The record rows are `<tr>` in `#rr-table`. The container with ≥6 "Read the whole write-up" siblings — rvRowsFor climbs to a parent whose children each contain the marker. If the table's tbody children are trs containing "Read the whole write-up", then container is tbody and rows are trs — tagging them .rv-row is fine and CSS `.rv-row` targets them. But the observed bug: `.rail .orow` got styled — meaning rvRowsFor returned a container whose children included rail rows? Perhaps the first leaf with "Read the whole write-up" is somewhere unexpected, or maybe the rails section contains the whole thing.

Safest per instruction: drop the rvRowsFor-based tagging for height, and directly target `#rr-table tr`. But careful — `#rr-table tr` includes the header `tr.hdr`. The measured 99px is data rows; header is th. Applying padding to header too? Probably harmless but better to exclude `.hdr`: `#rr-table tr:not(.hdr)`. The user said `#rr-table tr`. Hmm. "The row I measured at 99px is the record row in the results table, #rr-table tr". I'll use `#rr-table tbody tr` — but is there a tbody? Browsers auto-insert tbody. `#rr-table tr:not(.hdr)` is safe given the shown markup has `tr.hdr` for header. I'll do that.

Also the writeup HTML shows `.wu` div with `.txt` clipped — the 99px likely from the writeup text. The rv-row also set line-height on children margins. Keep the `:is(...)` margin rule scoped to #rr-table tr.

Also `.rv-spec{line-height:1.45}` — specimen is outside the table (`.spec-decoded`), keep.

Now: should rvTagRows still tag? The seam button uses rvRecordsList (rvRowsFor) to find the list to scroll to — that landed with the seam button working. Keep rvRecordsList for the seam. But rvTagRows adding .rv-row to children: if container is the tbody, fine; if the climb landed on something bigger (which caused ladder rows to get height), that's the bug. With CSS no longer keyed on .rv-row, the tagging is harmless but useless. I could keep rvTagRows for `rv-actions` logic — no, rvFixPlainButtons uses `b.closest('.rv-row')` as a hint, falls back to `li, article, div`. The writeup shows the gloss button moved into tw.parentNode and `.rv-actions` class added — that worked? The user said four landed: aim box, seam button, row height (well, on wrong element), bare specimen. rv-actions not mentioned. Keep rvFixPlainButtons as-is.

Decision: remove rvTagRows (or repurpose to nothing) and use pure CSS `#rr-table tr:not(.hdr)` for height. But then `closest('.rv-row')` in rvFixPlainButtons — fallback exists. Fine. Actually, keep rvTagRows but change it to tag `#rr-table` rows? Simpler: delete rvTagRows and delete `.rv-row` CSS, add `#rr-table` CSS. But rvFixPlainButtons references .rv-row in closest — harmless fallback chain. Also rvBuildSeam uses `list.querySelector('.rv-row')` — falls back to `list.firstElementChild`. If I remove tagging, seam scrolls to firstElementChild of container — which is a tr presumably, scrollIntoView works. OK.

Hmm, but to be minimal-risk, maybe keep rvTagRows but make it tag `#rr-table tbody tr` or `#rr-table tr:not(.hdr)` with class... no — pure CSS direct selector is cleanest and can't mis-tag the ladder. Do that. Actually wait: CSS `#rr-table tr:not(.hdr)` with padding — tr padding. In HTML tables, `padding` on `tr` is honored in border-collapse: collapse model? Per CSS 2.1, padding applies to internal table elements except... padding actually applies to rows? The spec says 'padding' applies to all elements except table-row-group, table-header-group, table-footer-group, table-row... wait no: "applies to: all elements except table-row-group, table-header-group, table-footer-group, table-row, table-column-group and table-column". So padding on tr does NOT apply! Hmm. But the original .rv-row was applied to children of container — if those were divs (rails rows) padding worked; if trs, padding wouldn't. The 99px measured — original code path maybe never applied to trs.

So to shrink #rr-table tr from 99px to 73px, padding on tr won't work. Need padding on td, or line-height on tr (line-height is inherited, works on tr). The 26px excess — from what? Probably from block elements inside td (div.wu etc.) with margins, or line-height. Safer approach: apply to cells:

```
#rr-table td{padding-top:5px;padding-bottom:5px;}
```

But we don't know the original padding. Hmm. The user gave the measurement: current 99px vs original 73px. The instrument redraws... The excess likely comes from line-height and margins of nested blocks. The original .rv-row fix (5px padding + line-height 1.35 + margin-block 2px) landed "row height" per user — it worked, just on the wrong element (ladder). Wait, re-read: "Four of the nine landed with it: the AIM AT box, the seam button, the row height and the bare specimen." Then: "A correction to your earlier reading of item 9: You applied the row height to .rail .orow, which is a ladder row inside the instrument and is 14px in the original. The row I measured at 99px is the record row in the results table, #rr-table tr, against 73px in the original. Leave the ladder alone."

So the row-height fix "landed" but on the wrong rows — it changed .rail .orow from 14px to something, and the intended target #rr-table tr stayed 99px. Wait "landed" means the fix worked... ambiguous. The correction section says the row height should go to #rr-table tr, and leave the ladder alone (14px). So how did .orow get the height? rvRowsFor must have found a container whose children include... Hmm, or via `.rv-row :is(p,div,...)` — orow contains div? No, orow contains spans and b. Or maybe the container found by rvRowsFor for 'Say it in plain English' — the gloss buttons are in table rows; climbing from those... The climb goes up until a parent has ≥6 children containing the marker. Table rows in tbody → tbody. That gives trs. Padding on tr doesn't apply, line-height does. Hmm, then how did .orow get taller? Maybe the rails' operator ladder also contains "Read the whole write-up"? No... Or maybe the first leaf found with the marker is in a different structure — like the instrument's rails list all reports? I can't fully know.

Given the uncertainty, apply to td: `#rr-table td` padding? We don't know original td padding; changing it could shrink below 73. Risky. Better: line-height approach that demonstrably worked (the "row height" landed — it did reduce rows from 99 to ~73? No — it says the row measured is 99 "against 73px in the original", i.e., still wrong). Hmm wait — "Four of the nine landed with it: ... the row height ..." Then correction says it was applied to the wrong element. Contradiction? Maybe "landed" means the mechanism executed. Anyway: the goal now: `#rr-table tr` should be 73px, ladder 14px.

What makes it 99px? Likely the `.wu` writeup block and text with default line-height and margins. Since we can't measure, the same recipe that "worked" (padding 5px, line-height 1.35, margin-block 2px) applied to the right elements should give ~73px. Apply to td/th? Use:

```
#rr-table tr:not(.hdr) td{padding-top:5px !important;padding-bottom:5px !important;line-height:1.35 !important;}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
```

Hmm, but line-height 1.35 on td plus margins... The original .rv-row CSS did `padding` on the row and line-height on row. For tr, line-height inherits to cells — works. Padding doesn't. So put padding on td. But do tds already have padding from page CSS (e.g., 8px)? Overriding with 5px could compress. Unknown. Alternatively keep padding off td and just set line-height + margins:

```
#rr-table tr:not(.hdr){line-height:1.35 !important;}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
#rr-table tr:not(.hdr) td{padding-top:5px !important;padding-bottom:5px !important;}
```

I'll include td padding since original recipe had it. The user will check 73px; can't verify from here, but this mirrors the recipe that reportedly achieved the height. Also keep `.rv-spec` (specimen). Also `.rv-actions` keep.

Now, do I keep rvTagRows? It currently adds rv-row classes and could be the mechanism that hit ladder rows. Remove rvTagRows entirely; also remove `.rv-row` CSS and `.rv-list`. But rvBuildSeam's scroll uses `.rv-row` fallback — change to `list.querySelector('tr')` or just firstElementChild. Keep `list.firstElementChild` fallback: `list && (list.querySelector('#rr-table tr:not(.hdr)') || list.firstElementChild)` — simpler: just firstElementChild. Actually original: `var first = list && (list.querySelector('.rv-row') || list.firstElementChild);` → change to `var first = list && list.firstElementChild;` Wait but if list is tbody, firstElementChild is first tr — good. But if rvRowsFor found a weird container (like one including rails), scrolling goes to top of that. It "landed" before, keep as-is minus .rv-row reference.

Hmm, actually should I keep rvTagRows but restrict to `#rr-table tr`? CSS handles it without classes. But rvFixPlainButtons uses `b.closest('.rv-row')` — fallback `li, article, div` — tr isn't in fallback list! The gloss button's row is a tr. `b.closest('.rv-row') || b.closest('li, article, div')` — inside a tr, is there a div ancestor? `<div class="wu-gloss">` is the button's parent! So b.parentNode is div.wu-gloss, and tw... wait the writeup HTML: `.wu` contains `.txt` and `.wu-gloss` with the button. "Read the whole write-up" — where is that? Not shown in writeup snippet; there's `onclick="rrWuToggle(this)"` on .wu. Maybe the toggle text is elsewhere. In the shown snippet the button already has data-rv-moved="1" and sits in .wu-gloss. tw = "Read the whole write-up" control — maybe the .wu div itself (role=button, aria-label?). Hmm, `tw.textContent` trim === 'Read the whole write-up' — the .wu div contains .txt span plus .wu-gloss button... its textContent would include the writeup text. Hmm, maybe there's a "Read the whole write-up" element not shown. Anyway — rvFixPlainButtons "landed"? Not listed in the four. But user says keep the four; others unspecified. I'll leave rvFixPlainButtons unchanged (it worked or at least didn't break), keeping `.rv-row` reference harmlessly. Actually wait — the four that landed: aim box, seam button, row height, bare specimen. So rvFixPlainButtons maybe didn't land but also wasn't flagged. Leave it.

Decision summary of changes:

1. **rvRenameLadder rewritten**: read `data-take`/`data-aim` from `.orow` rows, code after `op|`/`operator|`, replace the whole `.on` cell with `Name (CODE)` text; early-return if already correct → idempotent. Remove data-rv-named usage. Keep CSS classes? I'll render as plain text `name + ' (' + code + ')'`. Maybe keep rv-lname span for font-size 13px? The orow presumably has its own font. Plain text is what the check wants. But losing the designator styling — check just reads text. Also the fallback names come from RV_AIR harvested (menu labels) — those labels might themselves include counts? Airline menu options: label vs value filtered `label === v` excluded; airline labels might be "Southwest Airlines Co (57)"? Unknown. RV_AIR harvested from selects where value matches /^[A-Z]{3}A$/ and label != value. Label could contain counts. Fallback map has clean names. Hmm, should I strip digit-brackets from the name too? "Drop a bracket that contains a digit; keep one that does not, because '(SWAA)' has to survive in the ladder." — this sentence is about both faults! It says drop digit-brackets generally, keep non-digit ones like (SWAA). So apply the strip to the airline name too (harvested label might be "Southwest Airlines Co (10,954)"). Good catch. So define a helper:

```js
function rvStripCounts(s) {
  return (s || '').replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}
```

Apply to zoneName and to the airline name in rvRenameLadder. Then lowercase zone only.

Wait — for zone: "Drop a bracket that contains a digit; keep one that does not ... Lower-case the zone inside the sentence." So zone: strip digit-brackets, keep others, lowercase. For ladder name: strip digit-brackets, keep (SWAA)? But (SWAA) is added by us; the name itself from menu — strip digit brackets. And we append ' (' + code + ')' ourselves.

2. **rvBuildHeadline zone**: `var zoneName = ...; zoneName = rvStripCounts(zoneName).toLowerCase();` Hmm — lowercase whole? "left wing" — I'll lowercase entire string. Also trim. Only if zoneName non-empty.

3. **CSS item 9**: remove `.rv-row` rules; add:

```
/* 9 — record rows in the results table back to reference height; the ladder is left alone */
#rr-table tr:not(.hdr){line-height:1.35 !important;}
#rr-table tr:not(.hdr) td{padding-top:5px !important;padding-bottom:5px !important;}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
```

Wait — tr:not(.hdr) padding on tr doesn't apply; put line-height on tr, padding on td. Good.

Hmm, but should the ladder `.orow` height be protected? "Leave the ladder alone" — since we no longer tag orow with rv-row and CSS no longer targets it, done. Should I add an explicit guard CSS? Not needed.

4. **rvTagRows**: remove function and its call? It also added `.rv-row-writeup` — used anywhere? CSS doesn't reference it. rvFixPlainButtons uses `.rv-row` in closest — harmless. rvBuildSeam uses `list.querySelector('.rv-row')` — update to remove. I'll delete rvTagRows and its call; adjust rvBuildSeam scroll to `list.firstElementChild`. Hmm, but wait: is rvRowsFor-based container reliable for the seam? The seam "landed", so keep rvRecordsList as is.

Actually, careful: if I remove rvTagRows, `.rv-actions` class in rvFixPlainButtons: `tw.parentNode.classList.add('rv-actions')` — independent. OK.

Also `rvRowsFor` still used by rvRecordsList — keep.

5. Also the harvested airline names for RV_AIR — fine.

Also should rvRenameLadder handle rows already mangled by old code? New code sets cell.textContent = want — full replace. cell = row.querySelector('.on') || row. Good. Note in the mangled DOM, `.on` contains nested spans; textContent replace clears all. 

One more: RV_AIR fallback lookup — the code from data attributes is authoritative; use RV_AIR[code] || RV_AIR_FALLBACK[code].

Also what about ladder rows for zones (`data-aim="zone|500"`?) — the WHO rail shows op rows. Maybe other rails have `data-take="zone|ZONE 500"` rows with labels that include counts too? The user only flagged operator names. Should I also strip counts in other rails? Not flagged; don't invent. Keep to operator rows (`op|` / `operator|`).

Hmm — but "the ladder" might include zone rows in WHERE rail with "Left wing (10,954)" labels — do we rename those? The user's fault #1 is only about airline names tripled. Don't touch zone rows. But wait — should I strip digit-brackets from zone ladder rows too? Not asked. Leave.

Edge: `data-take="operator|SWAA"` split('|') → ['operator','SWAA']. Check prefix 'op' would also match 'op'? m[0]==='op' — for 'operator' m[0]='operator'. Check both.

Now write the whole block with these changes:

- CSS: replace `.rv-row` block with `#rr-table` rules; keep `.rv-spec`, `.rv-actions`.
- Remove rvTagRows function and call.
- rvBuildSeam: `var first = list && (list.querySelector('tr') || list.firstElementChild);` Hmm if list is tbody, querySelector('tr') gets hdr row — scroll to header, fine-ish; better firstElementChild. Just `list.firstElementChild`. Wait, what if the container found is a div containing trs? Not valid HTML. Keep simple.
- rvRenameLadder rewritten.
- Add rvStripCounts helper.
- rvBuildHeadline: zoneName stripped + lowercased.

Also remove the `.rv-lname`/`.rv-lcode` CSS? They become unused. Leaving them is harmless; removing is cleaner. The user wants the whole block; I'll leave the CSS in place to avoid unintended breakage? They're only used by rvRenameLadder. I'll remove them since nothing uses them now... Actually keep minimal diff — I'll remove them and mention it. Hmm, risk: none. I'll remove and note.

Wait — one more consideration on lowercase: zone labels like "Rotary Wing Heads"? lowercase → "rotary wing heads" fine. Do it.

Also: in rvBuildHeadline, RV_ZONES harvested labels also include counts ("Left wing (10,954)") — the strip handles it.

Also the aside "1,757,682 set aside." — untouched.

Also check: the headline's zone clause button text becomes "left wing" — clicking drops zone param, fine.

Now, about `#rr-table tr:not(.hdr)` — the header row shown is `<tr class="hdr">`. Good, exists in markup.

Should the rv-month-note / others change? No.

Also `.rv-row :is(...)` rule removed along with .rv-row.

Double-check rvRenameLadder idempotency under MutationObserver: we set cell.textContent = 'Southwest Airlines Co (SWAA)'. Next apply pass: cell.textContent.trim() === want → return early, no mutation → observer settles. But other parts (rvBareSpecimens etc.) also mutate; they have their own guards mostly. rvBareSpecimens: only adds class when changed — fine.

One subtlety: rvRenameLadder previously used rvLeaves + data-rv-named. New version queries `.orow`. But the user warned about invented selectors... `.orow`, `data-take`, `data-aim`, `.on` — all from the provided live markup. Good.

What if `.on` missing? fall back to row. Setting row.textContent would nuke the bar and count `<b>57</b>` — bad. Better: only proceed if `row.querySelector('.on')` exists. If not, skip (don't destroy). I'll do:

```js
var cell = row.querySelector('.on');
if (!cell) return;
```

Write the final block now. Keep everything else verbatim.

CSS section change:

```
/* 9 — record rows in the results table back to reference height (73px); the ladder rows are not touched */
#rr-table tr:not(.hdr){line-height:1.35 !important;}
#rr-table tr:not(.hdr) td{padding-top:5px !important;padding-bottom:5px !important;}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
```

Keep `.rv-spec`, `.rv-actions`.

Remove comment "3 — ladder carries name and designator" CSS block (rv-lname/rv-lcode).

rvRenameLadder:

```js
/* 3 — the ladder names the airline, designator kept in brackets after it.
   The code is read from the row's own data-take / data-aim, and the whole
   name cell is replaced, so a second pass writes the same thing again. */
function rvRenameLadder() {
  Array.prototype.forEach.call(document.querySelectorAll('.orow[data-take], .orow[data-aim]'), function (row) {
    var raw = row.getAttribute('data-take') || row.getAttribute('data-aim') || '';
    var bits = raw.split('|');
    if (bits[0] !== 'op' && bits[0] !== 'operator') return;
    var code = (bits[1] || '').trim().toUpperCase();
    if (!/^[A-Z]{3}A$/.test(code)) return;
    var name = rvStripCounts(RV_AIR[code] || RV_AIR_FALLBACK[code]);
    if (!name) return;
    var cell = row.querySelector('.on');
    if (!cell) return;
    var want = name + ' (' + code + ')';
    if ((cell.textContent || '').trim() === want) return;  /* already right; write nothing */
    cell.textContent = want;
  });
}
```

rvStripCounts:

```js
/* a bracket that contains a digit is a whole-corpus count, not a name — drop it */
function rvStripCounts(s) {
  return (s || '').replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}
```

rvBuildHeadline zone:

```js
var zoneName = zraw ? (RV_ZONES[zraw] || P.get('zone')) : '';   /* 2 — words, not the code */
if (zoneName) zoneName = rvStripCounts(zoneName).toLowerCase();
```

Hmm wait: if zraw set but label lookup fails and P.get('zone') is "ZONE 500" — lowercase "zone 500". Acceptable.

Remove rvTagRows function and call `rvTagRows();` in rvApply.

rvBuildSeam: change `var first = list && (list.querySelector('.rv-row') || list.firstElementChild);` → `var first = list && list.firstElementChild;`

rvFixPlainButtons: keep `b.closest('.rv-row') || b.closest('li, article, div')` — .rv-row never exists now; fallback div finds .wu-gloss (button's parent is div.wu-gloss... actually closest from button: nearest ancestor matching li/article/div → .wu-gloss). Then it finds tw = element with text 'Read the whole write-up'. Hmm — in the shown markup, .wu has onclick and contains .txt and .wu-gloss. Where's "Read the whole write-up"? Perhaps the .wu div's role/button is labeled that, or there's a link. Not shown. rvFixPlainButtons was in the "didn't land but also didn't break" category. Leave unchanged. Actually, hmm — should I keep `.rv-row` in that closest since rows no longer tagged? Harmless. Keep verbatim.

Everything else verbatim. Also update the comment numbers where relevant (item 3 comment, item 9 comment).

Also in rvApply, remove rvTagRows() call.

Let me now also double check the sentence building: parts: [{rust,'145 reports'}, {drop:'zone','left wing'}, {drop:'dates','December 2025'}] → "145 reports, left wing, December 2025." with aside "1,757,682 set aside." Matches check.

Ladder after three rail switches: instrument redraws → orow rebuilt fresh by the instrument (without our text), our block re-runs, replaces .on cell once → single. Even if the instrument preserves DOM, early return keeps it single. Good.

Also note: rvHarvest collects RV_AIR from selects — the WHO rail picker? Airlines select exists somewhere presumably. Fallback covers the six.

Now write out the full block with changes and a short explanation. No preamble — start with the block? "Return the whole block. Explain only what you changed. No preamble." So output the code block first, then explanation. 

Write it.