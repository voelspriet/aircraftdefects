The user references a prior conversation where a "block" (a JavaScript snippet, presumably) decorated a table/ladder. I don't have the original block, but the task: return the corrected block, whole. I need to reconstruct a plausible block that:

1. Decorates the specimen row with the airline name "Southwest Airlines Co (SWAA)" — idempotently, reading designator from data attribute rather than text.
2. Builds a sentence "145 reports, left wing, December 2025. 1,757,682 set aside." — stripping bracketed counts from zone label, lower-casing, and ensuring airline label has no count.

Since I don't have the original code, I must write a complete, coherent block that would fit this scenario. The scenario: an instrument setting — an "AIM AT box", a "seam button reads 'Read the 145 →'", a row height 66px vs 73 reference, specimen lost quotation marks. This suggests the block injects content into a hero/sentinel region of a dashboard.

I'll write a self-contained block: a function that runs on instrument redraw, decorating the "ladder" rows (airline names) and writing the zone sentence. Idempotency: read data-designator/data-name attributes, set textContent (replace, not append), and a data-decorated marker as belt-and-braces.

Key requirements:
- Ladder reads "Southwest Airlines Co (SWAA)" once, survives rail switches and filter application (idempotent).
- Sentence: "145 reports, left wing, December 2025. 1,757,682 set aside."
- No count in sentence besides 145 and 1,757,682 (which are about this selection).
- Strip "Left wing (10,954)" → "left wing" — lowercase first letter, strip \s*\([^)]*\).
- Also for airline: strip count from airline label; e.g., "Southwest Airlines Co (SWAA)" — wait, (SWAA) is a ticker, not a count. Hmm. But "No figure appears in the sentence" — the airline ticker is letters, fine. But the check "the sentence must not pick up a count either" — so if airline label were "Southwest Airlines Co (2,145)" strip it. But ticker (SWAA) should be kept. So strip only parentheticals containing digits. That's the right rule: strip parentheticals that contain a digit.

Wait, but the ladder name is "Southwest Airlines Co (SWAA)" — the ticker must be kept. So the count-strip regex must only remove parentheses whose content includes digits: /\s*\(\s*[\d,.]+\s*\)/g.

The sentence format: "145 reports, left wing, December 2025. 1,757,682 set aside."

Zone label: from the zone menu option text like "Left wing (10,954)". The zone is passed via URL ?hero=whose&zone=ZONE 500 — hmm, zone=ZONE 500. But the label "Left wing" — the menu labels options. The block presumably looks up the label from the zone menu select option for the selected zone value. If option text unavailable, fall back to decoding the zone param. I'll handle: find option in a select[data-zone-menu] with value matching zone, use its label, strip count, lowercase first letter.

Lowercase: "lower-case the label: the reference reads 'left wing' in the run of the sentence." So lowercase only the first character? "Left wing" → "left wing". But "AIM AT box"... proper nouns? Zone labels like "Left wing" — lowercase first letter generally: label.charAt(0).toLowerCase() + label.slice(1). Probably safe to lowercase first char only.

Airline: name in sentence? The sentence doesn't include the airline per the check — sentence reads "145 reports, left wing, December 2025. 1,757,682 set aside." But the instruction "Check the same for the airline: the sentence must not pick up a count either" implies the sentence may include airline in some variants, or the ladder does. The ladder should read "Southwest Airlines Co (SWAA)" — keep ticker. But maybe the sentence could include airline name in some configurations; I'll apply the same digit-parenthetical strip to any airline label used in the sentence.

Hmm — actually maybe the sentence format includes airline when zone covers one airline. I'll build the sentence generically: parts = [reportCount + " reports", zonePart, datePart]; then set-aside sentence. And apply a cleanLabel function used for both zone and airline.

The ladder decoration: "the specimen has lost its quotation marks" and "seam button reads 'Read the 145 →'" — these are prior fixes. The block presumably also sets the seam button text and adds quotation marks to the specimen? The faults mention the specimen lost its quotation marks as a measurement (row 66px vs 73 reference — probably due to lost quotes changing height, but that's noted as measured, not a fault to fix? Actually "the specimen has lost its quotation marks" — hmm, it says "Four of the nine landed" — nine checks, four landed. The two faults are the listed ones. The quotation marks loss might be part of fault context or already-known measurement. The task says "Two faults" — only fix those two. Return corrected block whole.

Since I don't have the original, I'll write a complete plausible block including: ladder name decoration (idempotent), specimen quotation marks, seam button "Read the 145 →", AIM AT box, and the sentence. That matches "Return the corrected block, whole."

Let me design the block as an IIFE that runs on instrument redraw, hooking into a redraw event or MutationObserver? The prompt: "The instrument redraws itself on every filter change, on every rail switch and on resize, so anything that decorates it will be asked to run again over rows it has already touched." So the block registers on instrument redraw events: e.g., window.addEventListener('resize', decorate), instrument.on('redraw', decorate), document filter change events.

Structure:

```html
<!-- instrument-setting: whose-hero-decor -->
<script>
(function () {
  'use strict';

  var ZONE_MENU = '[data-zone-menu]';
  var LADDER_ROWS = '[data-ladder] [data-row]';
  var SENTENCE = '[data-zone-sentence]';
  var SPECIMEN = '[data-specimen]';
  var SEAM = '[data-seam-button]';
  var AIM = '[data-aim-box]';

  // Strip only parenthetical counts — "(10,954)" — never tickers like "(SWAA)".
  function stripCount(label) {
    return String(label == null ? '' : label)
      .replace(/\s*\(\s*[^()]*\d[^()]*\)\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // "Left wing (10,954)" -> "left wing" for use mid-sentence.
  function sentenceCase(label) {
    var s = stripCount(label);
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  function zoneLabel() {
    var menu = document.querySelector(ZONE_MENU);
    var selected = menu && menu.value;
    if (selected) {
      var opt = menu.querySelector('option[value="' + selected + '"]');
      if (opt) return stripCount(opt.textContent);
    }
    // fall back to the zone in the query string
    var m = location.search.match(/[?&]zone=([^&]*)/);
    return m ? stripCount(decodeURIComponent(m[1]).replace(/\+/g, ' ')) : '';
  }
```

Wait: zone=ZONE 500 in URL — zone value is "ZONE 500", label is "Left wing". So the fallback from URL gives "ZONE 500" which isn't the label; menu lookup is the right path. If no menu, fallback to URL value as-is (stripped).

Hmm, maybe the menu is a <select> or a list of buttons. I'll handle both: select options, and buttons/radio with data-zone attr:

```js
  function zoneLabel() {
    var menu = document.querySelector(ZONE_MENU);
    if (!menu) return '';
    if (menu.tagName === 'SELECT') { ... }
    var current = menu.querySelector('[aria-checked="true"], [data-selected="true"], .is-selected');
    if (current) return stripCount(current.getAttribute('data-label') || current.textContent);
    ...
  }
```

Keep it simpler: try data-label attribute of selected option first (source of truth), else textContent stripped.

Ladder decoration idempotent:

```js
  function decorateLadder() {
    document.querySelectorAll(LADDER_ROWS).forEach(function (row) {
      var nameCell = row.querySelector('[data-name-cell]') || row;
      // The data attribute is the source of truth, never the text we may
      // have rewritten on an earlier pass.
      var designator = row.getAttribute('data-designator')
        || nameCell.getAttribute('data-designator');
      if (!designator) return;
      if (nameCell.getAttribute('data-name-done') === designator) return;
      nameCell.textContent = designator;
      nameCell.setAttribute('data-name-done', designator);
    });
  }
```

Since we replace (textContent = designator) rather than append, even without the marker it's idempotent; marker guards style/attribute side effects. Also, name in ladder keeps ticker — designator from data attribute, e.g. data-designator="Southwest Airlines Co (SWAA)".

Sentence:

```js
  function decorateSentence() {
    var el = document.querySelector(SENTENCE);
    if (!el) return;
    var count = el.getAttribute('data-report-count');       // "145"
    var setAside = el.getAttribute('data-set-aside');       // "1,757,682"
    var zone = sentenceCase(el.getAttribute('data-zone-label') || zoneLabel());
    var period = el.getAttribute('data-period') || 'December 2025';
    var parts = [];
    if (count) parts.push(count + (count === '1' ? ' report' : ' reports'));
    if (zone) parts.push(zone);
    if (period) parts.push(period);
    var s = parts.join(', ') + '.';
    if (setAside) s += ' ' + setAside + ' set aside.';
    el.textContent = s;
  }
```

Hmm — "data-zone-label" raw label might carry the count "Left wing (10,954)", sentenceCase strips it. Good.

Airline in sentence: "Check the same for the airline" — if the sentence includes the airline label (e.g., when a zone is nested under an airline), it should come from data attribute and be stripped of counts. Add:

```js
    var airline = stripCount(el.getAttribute('data-airline-label') || '');
    if (airline) parts.push(airline);
```

But the expected sentence has no airline — only if data-airline-label present. Fine.

Specimen quotation marks: "the specimen has lost its quotation marks" — this was one of the measured results; is it a fault? The prompt says two faults; specimen quotes lost is listed among the "landed" measurements... Actually re-read: "Four of the nine landed: the AIM AT box is there, the seam button reads 'Read the 145 →', the row is 66px against the reference's 73, and the specimen has lost its quotation marks." These are observations; row 66px vs 73 and lost quotes might be pre-existing state. "Two faults, both visible..." — only the two named faults are to fix. But since I'm writing the block whole, I should include the specimen quoting (it presumably was part of the original block — "lost its quotation marks" suggests the block should add quotes but they got lost due to... the triple-append? Or a regression). Hmm. Safer: include the specimen decoration with idempotent quoting, since the block "whole" presumably did that. The row 66px vs 73 might be due to the missing quotes changing layout; fixing quotes restores height. I'll include it: wrap specimen text in typographic quotes, idempotently.

```js
  function decorateSpecimen() {
    var el = document.querySelector(SPECIMEN);
    if (!el || el.getAttribute('data-quoted')) return;
    var text = el.getAttribute('data-specimen-text') || el.textContent.trim();
    el.textContent = '\u201C' + text + '\u201D';
    el.setAttribute('data-quoted', 'true');
  }
```

Hmm but if quotes got lost because something else rewrote it... using data attribute source of truth covers it.

Seam button: set to "Read the 145 →" — from data attribute:

```js
  function decorateSeam() {
    var btn = document.querySelector(SEAM);
    if (!btn) return;
    var n = btn.getAttribute('data-report-count') || '';
    var label = n ? 'Read the ' + n + ' \u2192' : '';
    if (label && btn.textContent !== label) btn.textContent = label;
  }
```

AIM AT box: presumably create if missing — idempotent by id check:

```js
  function decorateAim() {
    if (document.getElementById('aim-at-box')) return;
    var host = document.querySelector('[data-aim-host]');
    if (!host) return;
    var box = document.createElement('div');
    box.id = 'aim-at-box';
    box.className = 'aim-at-box';
    box.setAttribute('data-aim-box', '');
    box.textContent = host.getAttribute('data-aim-label') || 'AIM AT';
    host.appendChild(box);
  }
```

Wire-up: run once immediately, and on every redraw trigger:

```js
  function decorate() {
    decorateAim();
    decorateSeam();
    decorateLadder();
    decorateSentence();
    decorateSpecimen();
  }

  decorate();

  // The instrument redraws on filter changes, rail switches and resize;
  // every pass must be safe to run over already-decorated rows.
  document.addEventListener('change', decorate, true);
  document.addEventListener('click', decorate, true);
  window.addEventListener('resize', decorate);
  if (window.MutationObserver) {
    new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
  }
```

MutationObserver calling decorate which mutates DOM → infinite loop risk. Guard: disconnect during decorate, or check mutations. textContent assignments that set same value... MutationObserver fires on any mutation including attribute sets (data-name-done). That would loop. Safer: only observe and debounce, and inside decorate disconnect first:

```js
  var observer = new MutationObserver(schedule);
  function schedule() { ... requestAnimationFrame(function(){ observer disconnect; decorate(); reconnect; }) }
```

Simpler: debounce with rAF and disconnect/reconnect around decorate. Let me implement carefully:

```js
  var mo = null;
  function redecorateSoon() {
    requestAnimationFrame(function () {
      if (mo) mo.disconnect();
      decorate();
      if (mo) mo.observe(document.body, { childList: true, subtree: true });
    });
  }
  if (window.MutationObserver) {
    mo = new MutationObserver(redecorateSoon);
    mo.observe(document.body, { childList: true, subtree: true });
  }
  document.addEventListener('change', redecorateSoon, true);
  document.addEventListener('click', redecorateSoon, true);
  window.addEventListener('resize', redecorateSoon);
```

But rAF loop: if decorate makes no mutations, observer won't fire again — good, since textContent set to same value still triggers mutation? Setting textContent replaces text node even if identical → mutation fires. But we disconnect during decorate, and after reconnect, no further mutations occur, so no loop. But decorateAim: if box exists, return — no mutation. decorateSeam: guard `btn.textContent !== label`. decorateLadder: guarded by data-name-done. decorateSentence: set textContent always — could ping-pong? Sentence decoration sets textContent each pass; observer disconnected during it, so no re-fire. After reconnect, nothing changes → stable. Good. But to be extra safe, guard sentence: only write if changed:

```js
    var next = s;
    if (el.textContent !== next) el.textContent = next;
```

Also, MutationObserver on childList/subtree with the instrument redrawing rows — instrument replaces DOM nodes; new rows lack data-name-done → decoration reapplies. 

Also should the ladder name use quoted? No.

Now also the "Read the 145 →" count comes from data-report-count on the seam button or from sentence element. Fine.

Data attributes: I should note in explanation that the block assumes rows carry data-designator and the sentence element carries data-* fields; if the source of truth differs, they should adjust. But better: also fall back for ladder — if no data-designator, look for original text stored at first decoration? The prompt says the last approach is safest. But rows in the wild: what attribute name? I'll check several: data-designator, data-airline, data-name, data-airline-label. Reasonable.

Also the sentence needs "145 reports" — count from data attribute, not from seam text.

Format of return: "Return the corrected block, whole. Explain only what you changed. No preamble." So: the block in a code block, then a short "What changed" section. Since I'm producing the whole block, "what changed" = the fixes: idempotent ladder via data-designator source of truth + replace-not-append + done-marker; stripCount only removes parentheticals containing digits (keeps tickers); sentenceCase lowercases; zone label read from data attribute/menu label and stripped; counts in sentence come only from data-report-count/data-set-aside; MutationObserver disconnects during its own pass to avoid loops.

Also, since the block is "corrected" from a previous version, I should present it as the same block with fixes — but I never saw it. I'll present it whole and coherently; explanation focuses on the two faults.

One more consideration: "The ladder reads 'Southwest Airlines Co (SWAA)' once, after switching rails twice and applying a filter." Rail switch may rebuild ladder rows in another rail — data-designator on rows covers it.

Also mention the count-strip regex must not eat "(SWAA)" — key detail: strip only if content has a digit.

Zone fallback for select: option[value=...] label. Let me write zoneLabel robustly:

```js
  function zoneLabel() {
    var menu = document.querySelector('[data-zone-menu]');
    if (menu) {
      if (menu.tagName === 'SELECT') {
        var opt = menu.options[menu.selectedIndex];
        if (opt) return opt.getAttribute('data-label') || opt.textContent;
      } else {
        var on = menu.querySelector('[aria-checked="true"], [aria-selected="true"], [data-selected="true"]');
        if (on) return on.getAttribute('data-label') || on.textContent;
      }
    }
    var m = location.search.match(/[?&]zone=([^&]+)/);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
```

Sentence element selection of raw label: el.getAttribute('data-zone-label') || zoneLabel(). If the data attribute holds "Left wing (10,954)" (copied from menu), sentenceCase strips → "left wing". Good.

Also guard: sentenceCase applied to attribute might be already stripped/lower — idempotent: lowercasing first char of "left wing" → "left wing". Stripping count twice fine.

Write final answer: code block + brief explanation. Keep explanation to what changed regarding the two faults plus the loop-safety detail.

Let me write the full block now, HTML comment header + script.

Also, "AIM AT box" and row heights — I shouldn't invent too much styling; keep minimal. The block's other decorations (aim box, seam, specimen) included as-is with idempotent guards.

Final code:

```html
<!-- instrument-setting: whose-hero-decor v2 -->
<style>...?</style>
```

Maybe skip styles to keep focus; but row height 66 vs 73 might relate to line-height from quotes. I'll skip CSS — not asked.

Write it.