```html
<!-- instrument-setting: whose-hero-decor -->
<script>
(function () {
  'use strict';

  var LADDER_ROWS  = '[data-ladder] [data-row]';
  var NAME_CELL    = '[data-name-cell]';
  var SENTENCE     = '[data-zone-sentence]';
  var SPECIMEN     = '[data-specimen]';
  var SEAM         = '[data-seam-button]';
  var AIM_HOST     = '[data-aim-host]';
  var AIM_BOX_ID   = 'aim-at-box';

  /* Strip a parenthetical count only — "(10,954)" — never a ticker
     like "(SWAA)". The rule is: the parentheses go only if they
     contain a digit. */
  function stripCount(label) {
    return String(label == null ? '' : label)
      .replace(/\s*\(\s*[^()]*\d[^()]*\)\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /* "Left wing (10,954)" -> "left wing" for use mid-sentence. */
  function sentenceCase(label) {
    var s = stripCount(label);
    return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }

  /* The zone label is read from the menu's selected option, from its
     data-label if it has one, so the "(10,954)" the menu prints for
     wayfinding never reaches the sentence. */
  function zoneLabel() {
    var menu = document.querySelector('[data-zone-menu]');
    if (menu) {
      if (menu.tagName === 'SELECT') {
        var opt = menu.options[menu.selectedIndex];
        if (opt) return opt.getAttribute('data-label') || opt.textContent;
      } else {
        var on = menu.querySelector(
          '[aria-checked="true"], [aria-selected="true"], [data-selected="true"]');
        if (on) return on.getAttribute('data-label') || on.textContent;
      }
    }
    var m = location.search.match(/[?&]zone=([^&]+)/);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  /* Ladder names. The designator comes from the row's own data
     attribute, never from the text we may have rewritten on an
     earlier pass — text is not the source of truth once edited.
     We replace, not append, and we mark the row with the exact
     designator applied, so re-running over touched rows is a no-op. */
  function decorateLadder() {
    var rows = document.querySelectorAll(LADDER_ROWS);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var cell = row.querySelector(NAME_CELL) || row;
      var designator = row.getAttribute('data-designator')
                    || cell.getAttribute('data-designator')
                    || row.getAttribute('data-airline')
                    || cell.getAttribute('data-airline');
      if (!designator) continue;
      if (cell.getAttribute('data-name-applied') === designator) continue;
      cell.textContent = designator;
      cell.setAttribute('data-name-applied', designator);
    }
  }

  /* Sentence. Every figure comes from a data attribute about this
     selection only. The zone and airline labels pass through
     sentenceCase, which strips any parenthetical count the menu
     labels carry, so no corpus figure can appear here. */
  function decorateSentence() {
    var el = document.querySelector(SENTENCE);
    if (!el) return;
    var count    = el.getAttribute('data-report-count') || '';
    var setAside = el.getAttribute('data-set-aside')    || '';
    var zone     = sentenceCase(el.getAttribute('data-zone-label') || zoneLabel());
    var airline  = sentenceCase(el.getAttribute('data-airline-label') || '');
    var period   = el.getAttribute('data-period') || '';

    var parts = [];
    if (airline) parts.push(airline);
    if (count)   parts.push(count + (count === '1' ? ' report' : ' reports'));
    if (zone)    parts.push(zone);
    if (period)  parts.push(period);

    var text = parts.join(', ') + '.';
    if (setAside) text += ' ' + setAside + ' set aside.';

    if (el.textContent !== text) el.textContent = text;
  }

  /* Specimen gets its typographic quotation marks back, sourced from
     the data attribute so a lost rewrite is repaired, not doubled. */
  function decorateSpecimen() {
    var el = document.querySelector(SPECIMEN);
    if (!el) return;
    var text = el.getAttribute('data-specimen-text');
    if (text == null) {
      text = el.textContent.replace(/^[\u201C\u201D"]|[\u201C\u201D"]$/g, '').trim();
      el.setAttribute('data-specimen-text', text);
    }
    if (!text) return;
    var quoted = '\u201C' + text + '\u201D';
    if (el.textContent !== quoted) {
      el.textContent = quoted;
      el.setAttribute('data-quoted', 'true');
    }
  }

  function decorateSeam() {
    var btn = document.querySelector(SEAM);
    if (!btn) return;
    var n = btn.getAttribute('data-report-count')
         || (document.querySelector(SENTENCE) || {}).getAttribute
            && (document.querySelector(SENTENCE).getAttribute('data-report-count') || '');
    if (!n) return;
    var label = 'Read the ' + n + ' \u2192';
    if (btn.textContent !== label) btn.textContent = label;
  }

  function decorateAim() {
    if (document.getElementById(AIM_BOX_ID)) return;
    var host = document.querySelector(AIM_HOST);
    if (!host) return;
    var box = document.createElement('div');
    box.id = AIM_BOX_ID;
    box.className = 'aim-at-box';
    box.setAttribute('data-aim-box', '');
    box.textContent = host.getAttribute('data-aim-label') || 'AIM AT';
    host.appendChild(box);
  }

  function decorate() {
    decorateAim();
    decorateSeam();
    decorateLadder();
    decorateSentence();
    decorateSpecimen();
  }

  /* The instrument redraws on filter change, rail switch and resize.
     Every pass is idempotent; the observer disconnects itself for the
     duration of a pass so its own writes cannot retrigger it. */
  var mo = null;
  function redecorateSoon() {
    requestAnimationFrame(function () {
      if (mo) mo.disconnect();
      try { decorate(); } finally {
        if (mo) mo.observe(document.body, { childList: true, subtree: true });
      }
    });
  }

  decorate();

  document.addEventListener('change', redecorateSoon, true);
  document.addEventListener('click',  redecorateSoon, true);
  window.addEventListener('resize',   redecorateSoon);
  if (window.MutationObserver && document.body) {
    mo = new MutationObserver(redecorateSoon);
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();
</script>
```

**What changed**

1. **Triple-printed names.** The ladder no longer reads the name out of the text it may have rewritten. It reads the designator from the row's own `data-designator` (falling back to `data-airline` on the row or cell), writes it with `textContent` — replace, not append — and stamps the cell with `data-name-applied` set to the exact designator it applied. A re-run over a touched row matches the stamp and does nothing; a rail switch or filter that rebuilds the rows produces fresh, unstamped rows and gets decorated exactly once. This also makes the decoration order-independent, since the text on the page is never an input.

2. **Count in the sentence.** Added `stripCount`, which removes a parenthetical **only if its contents contain a digit** — so `(10,954)` goes, but a ticker like `(SWAA)` survives. The zone label is taken from the menu's selected option, preferring its `data-label` attribute over the printed text, then passed through `sentenceCase` (strip count, lower-case the first character) before it enters the sentence. The airline label, if the sentence ever carries one, goes through the same function, so neither can print a corpus figure. The only numbers in the sentence come from `data-report-count` and `data-set-aside` on the sentence element itself — both figures about this selection.

3. **Loop safety, since the instrument redraws constantly.** The MutationObserver disconnects itself for the duration of each decoration pass and reconnects afterwards, so its own writes (the `data-name-applied` stamp, the sentence rewrite) cannot retrigger it; all writes are guarded to be no-ops when nothing changed.