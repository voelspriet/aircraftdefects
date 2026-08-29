```html
<script>
/* ---- panel guidance for the SDR rebuild ----
   Idempotent: every note is marked data-sdrs-note, existing notes are
   rewritten in place, stale ones are swept, so re-running after a redraw
   never appends a second copy. Exposed as window.sdrsGuidanceApply and
   also self-scheduled through a MutationObserver. */
(function () {
  'use strict';

  var NOTE_ATTR = 'data-sdrs-note';
  var STYLE_ID  = 'sdrs-guidance-style';

  /* ---------- CSS, injected once ---------- */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      '.sdrs-guidance{font-size:.875em;line-height:1.55;color:#57606a;margin:.4em 0 1.1em;max-width:70ch}' +
      '.sdrs-guidance--table{font-size:.8em;color:#6e7781;margin:0 0 .55em;max-width:70ch}';
    document.head.appendChild(st);
  }

  /* ---------- the guidance, panel by panel ---------- */
  var PANELS = [
    {
      key: 'patterns',
      title: 'Patterns',
      text:
        'These charts follow whatever you have filtered on the Search tab, and clicking any bar narrows the ' +
        'selection to it. A bar counts every report naming that code or action in any slot, so it is the exact ' +
        'number a click lands you on. The bands are kept as the FAA received them, including the broad Other ' +
        'band, which collects everything the standard codes miss and towers over every named code beside it. ' +
        'Because a single report can name up to four codes or actions, the bars overlap and can add to more ' +
        'than the number of reports in the selection.'
    },
    {
      key: 'aircraft',
      title: 'Aircraft',
      text:
        'Type a tail number here, or click one anywhere else in the tool, and the entire selection narrows ' +
        'to that airframe.'
    },
    {
      key: 'found',
      title: 'How it was found',
      text:
        'A crack picked up by eddy current or X-ray was never visible from the outside, so dividing each ' +
        'system\u2019s findings by method shows whether trouble is being caught by instruments before anyone could ' +
        'see it, or only once it showed. Not every report falls on one side or the other: functional checks ' +
        'and unrecorded methods make up a large share, and they are listed too. Whatever you have filtered ' +
        'on the Search tab applies here as well.'
    },
    {
      key: 'fleet',
      title: 'Fleet',
      text:
        'One airline, one type: a report count on its own says little. The number that matters is how many ' +
        'separate aircraft those reports touched. Many write-ups concentrated on a single airframe point to ' +
        'a bad machine; the same count spread across many airframes points to a fleet problem.'
    },
    {
      key: 'leads',
      title: 'Story leads',
      text:
        'Both tables set the last ninety days against everything before it. A sudden cluster means an aircraft ' +
        'has collected more write-ups in the last ninety days than in its entire earlier record here. Look at ' +
        'the actual dates before promoting a cluster to a trend.'
    },
    {
      key: 'newdefects',
      title: 'New defects',
      text:
        'A defect that is new says more than one that is merely common. These are parts and systems being ' +
        'written up now that hardly appeared before, so the pattern is still taking shape. The counts are ' +
        'small: treat them as a tip-off rather than a finding.'
    },
    {
      key: 'sameday',
      title: 'Same day, many aircraft',
      text:
        'When one airline writes up the same system on several different aircraft in a single day, the ' +
        'aircraft is rarely the cause: look instead to a batch of parts, a procedure, a supplier or a shared ' +
        'inspection. This is the pattern that turns a maintenance note into a story.',
      table: {
        re: /other days|days like this/i,
        text:
          'A large cluster is not automatically an incident. When the same airline and system cluster across ' +
          'many separate days instead, that is usually a scheduled inspection working through the fleet, and ' +
          'the other-days-like-this column exists to separate the two: a low figure there is the case worth ' +
          'chasing. Clusters that already fit the scheduled pattern are hidden.'
      }
    },
    {
      key: 'samedefect',
      title: 'Same defect',
      text:
        'One part number, failing the same way, across many aircraft and more than one airline is a fleet ' +
        'problem, not a one-off incident.'
    },
    {
      key: 'corrosion',
      title: 'Corrosion & cracks',
      text:
        'Level 2 means the finding went beyond what the manufacturer allows and needed repair; Level 1 stays ' +
        'within limits and is not reportable, which is why it never appears here. Every report in this panel ' +
        'obliged the operator to notify the regulator within three days. The grey band under each row is the ' +
        'mechanic\u2019s own words.'
    },
    {
      key: 'oldairframes',
      title: 'Old airframes',
      text:
        'Hours and cycles age an aircraft in different ways: a short-haul airframe stacks up cycles quickly ' +
        'and hours slowly, and because every flight pressurises and then depressurises the hull, it is cycles ' +
        'that drive cracking, while hours wear out the parts that simply run. What is plotted is the share of ' +
        'reports in each age band that record corrosion at all, which compares like with like; the raw counts ' +
        'do not, because the bands hold very different numbers of aircraft. Bands marked small contain too ' +
        'few reports to carry a percentage, so disregard their share.'
    },
    {
      key: 'engines',
      title: 'Engines',
      text:
        'Only a minority of reports name an engine, so this is a count inside a small subset, not a failure ' +
        'rate per engine in service. Treat it as a way to find cases worth checking, never as a league table ' +
        'of manufacturers.'
    },
    {
      key: 'crew',
      title: 'What the crew did',
      text:
        'This panel is not about what broke but about what the breakage forced the crew to do. It ranks by ' +
        'how many reports carried a crew action, and the same table can be flipped between airline, model ' +
        'and manufacturer.',
      table: {
        re: /\breports?\b/i,
        text:
          'A high share carried on a few hundred reports is not the same finding as the same share on tens of ' +
          'thousands, so read the Reports column alongside the percentage. A share is per report filed, not ' +
          'per flight.'
      }
    },
    {
      key: 'compare',
      title: 'Compare',
      text:
        'Two airlines or models side by side. The bars are raw counts, and a bigger operator simply files ' +
        'more reports, so treat this as a starting point for questions rather than a score.'
    }
  ];

  /* ---------- helpers ---------- */
  function norm(s) {
    return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
  }
  var CFG = {};
  PANELS.forEach(function (p) { CFG[norm(p.title)] = p; });

  var HEADING_SEL = 'h1,h2,h3,h4,h5,h6,[role="heading"],[class*="title" i],[class*="heading" i]';

  function matchedHeadings() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll(HEADING_SEL), function (el) {
      var cfg = CFG[norm(el.textContent)];
      if (!cfg) return;
      if (el.closest && (el.closest('svg') || el.closest('[' + NOTE_ATTR + ']'))) return;
      if (el.closest('[role="tablist"]') || el.getAttribute('role') === 'tab') return;
      var tag = el.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'LABEL' || tag === 'OPTION' ||
          tag === 'SELECT' || tag === 'TITLE') return;
      if (/(^|\s|-)tab/i.test(' ' + (el.className || ''))) return;
      /* if this element merely wraps a same-named heading, let the inner one win */
      var inner = el.querySelector(HEADING_SEL);
      if (inner && norm(inner.textContent) === norm(el.textContent)) return;
      out.push({ el: el, cfg: cfg });
    });
    return out;
  }

  /* tables that sit between this panel's heading and the next one */
  function tablesBetween(h, stop) {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
      if (!(h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      if (stop && !(stop.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING)) return;
      out.push(t);
    });
    return out;
  }

  /* ---------- application ---------- */
  function apply() {
    injectStyle();
    var heads = matchedHeadings();

    var byKey = {};
    Array.prototype.forEach.call(document.querySelectorAll('[' + NOTE_ATTR + ']'), function (n) {
      var k = n.getAttribute(NOTE_ATTR);
      (byKey[k] = byKey[k] || []).push(n);
    });

    var used = {};
    heads.forEach(function (m, i) {
      var cfg = m.cfg, h = m.el;
      if (used[cfg.key]) return;
      used[cfg.key] = true;
      var stop = i + 1 < heads.length ? heads[i + 1].el : null;

      /* main block, directly under the heading */
      var note = null;
      (byKey[cfg.key] || []).forEach(function (n) {
        if (!n.isConnected) return;
        if (!note && n.previousElementSibling === h) { note = n; return; }
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      if (!note) {
        if (!h.parentNode) return;
        note = document.createElement('p');
        note.className = 'sdrs-guidance';
        h.parentNode.insertBefore(note, h.nextSibling);
      }
      note.setAttribute(NOTE_ATTR, cfg.key);
      if (note.textContent !== cfg.text) note.textContent = cfg.text;

      /* column caveat, directly beside the table it qualifies */
      if (cfg.table) applyTableNote(h, stop, cfg, byKey);
    });
  }

  function applyTableNote(h, stop, cfg, byKey) {
    var tables = tablesBetween(h, stop);
    var matched = tables.filter(function (t) { return cfg.table.re.test(t.textContent || ''); });
    if (matched.length) tables = matched;
    if (!tables.length) return;

    var prefix = cfg.key + '-tbl';
    Object.keys(byKey).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      byKey[k].forEach(function (n) {
        if (!n.isConnected) return;
        var t = n.nextElementSibling;
        if (!t || tables.indexOf(t) === -1 || t.previousElementSibling !== n) {
          if (n.parentNode) n.parentNode.removeChild(n);
        }
      });
    });

    tables.forEach(function (t, i) {
      var k = prefix + i;
      var prev = t.previousElementSibling;
      var note = (prev && prev.getAttribute && (prev.getAttribute(NOTE_ATTR) || '').indexOf(prefix) === 0)
        ? prev : null;
      if (!note) {
        note = document.createElement('p');
        note.className = 'sdrs-guidance sdrs-guidance--table';
        t.parentNode.insertBefore(note, t);
      }
      note.setAttribute(NOTE_ATTR, k);
      if (note.textContent !== cfg.table.text) note.textContent = cfg.table.text;
    });
  }

  /* ---------- redraw handling ---------- */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; apply(); });
  }

  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if ((n.getAttribute && n.getAttribute(NOTE_ATTR)) ||
              (n.querySelector && n.querySelector('[' + NOTE_ATTR + ']'))) return;
        }
      }
      schedule();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.sdrsGuidanceApply = apply;
})();
</script>
```

**Departures from the brief**

1. **Figures.** This block sees only the rendered DOM, not the query endpoint, so every selection-measured number in your evidence (the report totals, the 2.3 % and 12.7 % shares, the 5.2× ratio, the 78 hidden clusters, the three-in-a-hundred) is carried as the relationship it asserts, worded to hold for any selection. Constants of the tool itself — the ninety-day window, the four action slots, the three-day reporting rule — are kept, spelled out in words. If you later wire the endpoint numbers in, the two texts that most want them are *How it was found* and *Engines*.
2. **Table-side caveats.** For *What the crew did* and *Same day, many aircraft* the column-specific warnings are placed directly before the table they qualify (found by a Reports column / an other-days-like-this column, falling back to the panel's first table), per your "beside that table, not at the top".
3. **Examples and control labels.** The example rows and the threshold labels in your evidence (Arctic Transportation, Horizon, "3 aircraft or more…") are rendered data and control text, not guidance, so they were left to the figures and controls themselves.
4. **Markup-agnostic targeting.** Panels are found by normalised heading text (tab buttons, labels and wrappers excluded), so the block needs no knowledge of your class names; a MutationObserver re-applies after redraws even if nothing calls `window.sdrsGuidanceApply`. CSS is injected from JS so the whole thing can be pasted inside your IIFE, where a literal `<style>` tag would not parse.
5. **Length.** *Patterns*, *How it was found* and *Old airframes* run three to four sentences rather than two, because each carries two or three distinct warnings in the original that all had to survive; everything else is two or three.