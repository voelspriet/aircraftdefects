```
(function () {
  'use strict';

  /* ---------- css (injected once) ---------- */
  var RV_CSS = `
:root{--rv-rust:#a3401f;--rv-ash:#8b857a;}
/* 1 — the standing sentence is the headline */
.rv-sentence{font-family:Georgia,'Iowan Old Style','Times New Roman',serif !important;
  font-size:34px !important;font-weight:400 !important;line-height:1.3 !important;
  letter-spacing:-.005em;color:#26221d !important;margin:0 0 6px;}
.rv-count{color:var(--rv-rust);}
.rv-clause{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;
  text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px;
  text-decoration-color:rgba(163,64,31,.5);}
.rv-clause:hover{text-decoration-color:var(--rv-rust);}
.rv-clause:focus-visible{outline:2px solid var(--rv-rust);outline-offset:2px;}
.rv-aside{font-size:15px;color:var(--rv-ash);margin-left:10px;white-space:nowrap;}
/* 4 — the aim at box */
.rv-aim{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:16px 0 0;}
.rv-aim-label{font-size:11px;letter-spacing:.16em;color:var(--rv-rust);}
.rv-aim select,.rv-aim input{font-family:inherit;font-size:13px;color:#26221d;
  padding:6px 8px;border:1px solid #c8c1b4;border-radius:2px;background:#fff;}
.rv-aim input[type=text]{min-width:32ch;}
.rv-take{font-family:inherit;font-size:13px;padding:7px 16px;border:0;border-radius:2px;
  background:var(--rv-rust);color:#fff;cursor:pointer;}
.rv-take:hover{filter:brightness(1.1);}
/* 5 — hand line, in the page's own type, dark, under the aim line */
.rv-hand{font-size:14px;line-height:1.5;color:#26221d;margin:10px 0 0;}
.rv-hand-alt{color:#56514a;}
/* 6 — the seam button */
.rv-seam{font-family:inherit;font-size:15px;font-weight:600;padding:11px 20px;border:0;
  border-radius:2px;background:var(--rv-rust);color:#fff;cursor:pointer;margin:26px 0 10px;}
.rv-seam:hover{filter:brightness(1.1);}
/* 7 — part-month note in the margin, rust, above the ash line */
.rv-month-note{color:var(--rv-rust) !important;font-size:12px !important;line-height:1.55;margin:0 0 6px;}
/* 9 — record rows in the results table back to reference height.
   The ladder rows (.rail .orow, 14px) are deliberately not touched. */
#rr-table tr:not(.hdr){line-height:1.35 !important;}
#rr-table tr:not(.hdr) td{padding-top:5px !important;padding-bottom:5px !important;}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px !important;}
.rv-spec{line-height:1.45 !important;}
.rv-actions{display:flex !important;flex-wrap:nowrap !important;align-items:baseline;gap:12px;}
.rv-actions > *{margin:0 !important;}
`;
  if (!document.querySelector('style[data-rv]')) {
    var rvSt = document.createElement('style');
    rvSt.setAttribute('data-rv', '1');
    rvSt.textContent = RV_CSS;
    document.head.appendChild(rvSt);
  }

  /* ---------- state harvested from the page ---------- */
  var RV_AIR = {}, RV_OPKEY = null, RV_COUNT = '';
  var RV_ZONES = { 'ZONE 500': 'left wing' };
  var RV_AIR_FALLBACK = {
    SWAA: 'Southwest Airlines Co',
    DALA: 'Delta Air Lines Inc',
    SWIA: 'Skywest Airlines Inc',
    AALA: 'American Airlines Inc',
    CALA: 'Continental Airlines Inc',
    FDEA: 'Federal Express Corporation'
  };

  /* ---------- prefixed helpers ---------- */
  function rvEl(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  /* a bracket holding a digit is a whole-corpus count, not a name — drop it.
     a bracket without a digit, like (SWAA), survives. */
  function rvStripCounts(s) {
    return (s || '').replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }

  function rvLeaves(root) {
    var out = [], w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) if (!n.firstElementChild) out.push(n);
    return out;
  }

  function rvByText(txt, root) {
    return rvLeaves(root).filter(function (n) {
      return (n.textContent || '').trim().indexOf(txt) > -1;
    });
  }

  function rvFirstText(n) {
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) return x;
    return null;
  }
  function rvLastText(n) {
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x, r = null;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) r = x;
    return r;
  }

  /* climb from a marker to the list that holds >= minRows siblings carrying it */
  function rvRowsFor(marker, minRows) {
    var leaves = rvByText(marker);
    if (!leaves.length) return null;
    var node = leaves[0];
    while (node && node.parentElement) {
      var p = node.parentElement;
      if (p === document.body) return null;
      var sibs = Array.prototype.filter.call(p.children, function (c) {
        return (c.textContent || '').indexOf(marker) > -1;
      });
      if (sibs.length >= (minRows || 6)) return { container: p };
      node = p;
    }
    return null;
  }

  function rvParams() { return new URLSearchParams(location.search); }
  function rvGo(p) { location.search = p.toString(); }

  /* ---------- 2 & 3 — names, harvested from the page's own menus ---------- */
  function rvHarvest() {
    RV_AIR = {}; RV_OPKEY = null;
    var zones = {};
    Array.prototype.forEach.call(document.querySelectorAll('select'), function (s) {
      var gotAir = false;
      Array.prototype.forEach.call(s.options, function (o) {
        var v = (o.value || '').trim(), label = (o.textContent || '').trim();
        if (!v || !label || label === v) return;
        if (/^[A-Z]{3}A$/.test(v)) { RV_AIR[v] = label; gotAir = true; }
        var zv = v.toUpperCase().replace(/^ZONE\s*/, 'ZONE ').replace(/\s+/g, ' ');
        if (/^ZONE \d+$/.test(zv)) zones[zv] = label;
      });
      if (gotAir && !RV_OPKEY) RV_OPKEY = s.getAttribute('name') || s.id || null;
    });
    var k; for (k in zones) RV_ZONES[k] = zones[k];
  }

  function rvRailsRoot() {
    var leaf = null, codes = ['SWAA', 'DALA', 'AALA', 'SWIA', 'CALA'], i, hits;
    for (i = 0; i < codes.length && !leaf; i++) {
      hits = rvByText(codes[i]);
      if (hits.length) leaf = hits[0];
    }
    if (!leaf) return null;
    var node = leaf;
    while (node.parentElement && node.parentElement !== document.body) {
      if ((node.parentElement.textContent || '').indexOf('Read the whole write-up') > -1) break;
      node = node.parentElement;
    }
    return node;
  }

  /* 3 — the ladder names the airline, designator in brackets after it.
     The code is read from the row's own data-take / data-aim, and the whole
     name cell is replaced, so a second pass writes the same thing again. */
  function rvRenameLadder() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.orow[data-take], .orow[data-aim]'),
      function (row) {
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
        if ((cell.textContent || '').trim() === want) return; /* already right; write nothing */
        cell.textContent = want;
      });
  }

  /* ---------- 1 — the standing sentence as headline ---------- */
  function rvSentenceBlock() {
    var hits = rvLeaves().filter(function (n) {
      var t = (n.textContent || '').trim();
      return /^\d[\d,]*\s+reports\b/.test(t) && t.length < 240;
    });
    if (!hits.length) return null;
    var node = hits[0];
    while (node.parentElement && node.parentElement !== document.body) {
      var pt = node.parentElement.textContent.trim();
      if (!/^\d[\d,]*\s+reports\b/.test(pt) || pt.length > 240) break;
      node = node.parentElement;
    }
    return node;
  }

  function rvMonthText(f, t) {
    if (!f && !t) return '';
    function part(s) {
      var d = new Date(s);
      if (isNaN(d)) return s;
      return d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }) + ' ' + d.getUTCFullYear();
    }
    if (f && t) { var a = part(f), b = part(t); return a === b ? a : a + ' \u2013 ' + b; }
    return part(f || t);
  }

  function rvDrop(kind) {
    var p = rvParams();
    if (kind === 'zone') p.delete('zone');
    else { p.delete('from'); p.delete('to'); }
    rvGo(p);
  }

  function rvBuildHeadline() {
    var block = rvSentenceBlock();
    if (!block || block.getAttribute('data-rv')) return;
    var t = block.textContent.replace(/\s+/g, ' ').trim();
    var mc = t.match(/(\d[\d,]*)\s+reports/i);
    var ma = t.match(/(\d[\d,]*)\s+set aside/i);
    RV_COUNT = mc ? mc[1] : (document.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', ''])[1];

    var P = rvParams();
    var zraw = (P.get('zone') || '').trim().toUpperCase().replace(/\s+/g, ' ');
    var zoneName = zraw ? (RV_ZONES[zraw] || P.get('zone')) : '';   /* 2 — words, not the code */
    /* the menu labels carry the whole-corpus count in brackets; inside a
       sentence about this selection that figure is someone else's — drop it,
       and lower-case the zone to sit inside the sentence */
    if (zoneName) zoneName = rvStripCounts(zoneName).toLowerCase();
    var monthTxt = rvMonthText(P.get('from'), P.get('to'));

    block.setAttribute('data-rv', '1');
    block.classList.add('rv-sentence');
    block.textContent = '';

    var parts = [{ rust: true, text: (mc ? mc[1] : '') + ' reports' }];
    if (zoneName) parts.push({ drop: 'zone', text: zoneName });
    if (monthTxt) parts.push({ drop: 'dates', text: monthTxt });

    parts.forEach(function (pt, i) {
      if (i) block.appendChild(document.createTextNode(', '));
      if (pt.rust) {
        var s = rvEl('span', 'rv-count'); s.textContent = pt.text; block.appendChild(s);
      } else {
        var b = rvEl('button', 'rv-clause'); b.type = 'button'; b.textContent = pt.text;
        b.addEventListener('click', function () { rvDrop(pt.drop); });
        block.appendChild(b);
      }
    });
    block.appendChild(document.createTextNode('.'));
    if (ma) {
      block.appendChild(document.createTextNode(' '));
      var a = rvEl('span', 'rv-aside');
      a.textContent = ma[1] + ' set aside.';
      block.appendChild(a);
    }
  }

  /* ---------- 4 — the aim at box, 5 — the hand line ---------- */
  function rvResolveAirline(v) {
    var up = v.trim().toUpperCase();
    if (/^[A-Z]{3}A$/.test(up)) return up;
    var lv = v.trim().toLowerCase(), k;
    for (k in RV_AIR) if (k === up || RV_AIR[k].toLowerCase() === lv) return k;
    for (k in RV_AIR) if (RV_AIR[k].toLowerCase().indexOf(lv) > -1) return k;
    for (k in RV_AIR_FALLBACK) if (RV_AIR_FALLBACK[k].toLowerCase().indexOf(lv) > -1) return k;
    return null;
  }

  function rvResolveZone(v) {
    var up = v.trim().toUpperCase().replace(/\s+/g, ' ');
    if (/^ZONE\s*\d+$/.test(up)) return up.replace(/^ZONE\s*/, 'ZONE ');
    if (/^\d+$/.test(up)) return 'ZONE ' + up;
    var lv = v.trim().toLowerCase(), k;
    for (k in RV_ZONES) if (RV_ZONES[k].toLowerCase().indexOf(lv) > -1) return k;
    return null;
  }

  /* the old grey monospace caption inside the rail goes */
  function rvRemoveOldHand() {
    rvLeaves().forEach(function (n) {
      var t = (n.textContent || '').trim();
      if (t.indexOf('Click an airline') < 0) return;
      if (n.closest && n.closest('[data-rv]')) return;
      var node = n, i = 0;
      while (node.parentElement && node.parentElement !== document.body && i < 5 &&
             node.parentElement.children.length === 1) { node = node.parentElement; i++; }
      if (node.parentElement) node.parentElement.removeChild(node);
    });
  }

  function rvBuildAim() {
    var block = document.querySelector('.rv-sentence') || rvSentenceBlock();
    if (!block || !block.parentNode || document.querySelector('.rv-aim')) return;

    var box = rvEl('div', 'rv-aim'); box.setAttribute('data-rv', '1');
    var lab = rvEl('span', 'rv-aim-label'); lab.textContent = 'AIM AT'; box.appendChild(lab);

    var kind = rvEl('select');
    [['airline', 'Airline'], ['airframe', 'Airframe'], ['zone', 'Zone']].forEach(function (o) {
      var op = rvEl('option'); op.value = o[0]; op.textContent = o[1]; kind.appendChild(op);
    });
    box.appendChild(kind);

    var target = rvEl('input'); target.type = 'text';
    target.placeholder = 'e.g. Southwest Airlines Co \u00b7 SWAA';
    box.appendChild(target);

    var take = rvEl('button', 'rv-take'); take.type = 'button'; take.textContent = 'Take it';
    box.appendChild(take);

    var day = rvEl('input'); day.type = 'date';
    day.title = 'One day'; day.setAttribute('aria-label', 'One day');
    box.appendChild(day);

    take.addEventListener('click', function () {
      var p = rvParams(), v = target.value.trim(), d = day.value;
      if (!v && !d) return;
      if (v) {
        if (kind.value === 'airline') {
          var code = rvResolveAirline(v);
          if (!code) { target.style.borderColor = '#a3401f'; return; }
          p.set(RV_OPKEY || 'operator', code);
        } else if (kind.value === 'zone') {
          var zc = rvResolveZone(v);
          if (!zc) { target.style.borderColor = '#a3401f'; return; }
          p.set('zone', zc);
        } else {
          var keys = ['tail', 'airframe', 'aircraft', 'reg', 'nnumber'], key = 'tail', i;
          for (i = 0; i < keys.length; i++) if (p.has(keys[i])) { key = keys[i]; break; }
          p.set(key, v.toUpperCase());
        }
      }
      if (d) { p.set('from', d); p.set('to', d); }
      rvGo(p);
    });

    block.parentNode.insertBefore(box, block.nextSibling);

    var hand = rvEl('p', 'rv-hand'); hand.setAttribute('data-rv', '1');
    hand.appendChild(document.createTextNode('Click an airline or an airframe to follow it.'));
    hand.appendChild(document.createTextNode(' '));
    var alt = rvEl('span', 'rv-hand-alt'); alt.textContent = 'Or use the filters below.';
    hand.appendChild(alt);
    box.parentNode.insertBefore(hand, box.nextSibling);
  }

  /* ---------- 6 — the seam button ---------- */
  function rvRecordsList() {
    var f = rvRowsFor('Read the whole write-up', 6) || rvRowsFor('Say it in plain English', 6);
    return f ? f.container : null;
  }

  function rvBuildSeam() {
    if (document.querySelector('.rv-seam')) return;
    var count = RV_COUNT ||
      (document.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', '145'])[1];
    var list = rvRecordsList();
    var btn = rvEl('button', 'rv-seam'); btn.type = 'button';
    btn.setAttribute('data-rv', '1');
    btn.textContent = 'Read the ' + count + ' \u2192';
    btn.addEventListener('click', function () {
      var first = list && list.firstElementChild;
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    if (list && list.parentNode) list.parentNode.insertBefore(btn, list);
    else document.body.appendChild(btn);
  }

  /* ---------- 7 — the part-month note ---------- */
  function rvAshLine(scope) {
    if (!scope) return null;
    var best = null;
    Array.prototype.forEach.call(scope.querySelectorAll('*'), function (n) {
      if (best || n.firstElementChild) return;
      var t = (n.textContent || '').trim();
      if (t.length < 12 || t.length > 300) return;
      var cs = getComputedStyle(n);
      var m = cs.color.match(/\d+/g);
      if (!m) return;
      var r = +m[0], g = +m[1], b = +m[2];
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 14 && mx > 110 && parseFloat(cs.fontSize) <= 13) best = n;
    });
    return best;
  }

  function rvPartMonthNote() {
    if (document.querySelector('.rv-month-note')) return;
    var now = new Date();
    var last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var day = now.getDate();
    if (day >= last) return; /* the trailing month is whole; nothing to note */
    var name = now.toLocaleString('en-US', { month: 'long' });
    var note = rvEl('p', 'rv-month-note');
    note.setAttribute('data-rv', '1');
    note.textContent = name + ' ' + now.getFullYear() + ' covers 1 to ' + day + ' ' + name +
      ', so its bar counts ' + day + ' days against ' + last + ' in a whole one';
    var rails = rvRailsRoot();
    var ash = rvAshLine(rails);
    if (ash && ash.parentNode) ash.parentNode.insertBefore(note, ash);
    else if (rails) rails.insertBefore(note, rails.firstChild);
    else document.body.appendChild(note);
  }

  /* ---------- 8 — the specimen bare, in monospace ---------- */
  var RV_QLEAD = /^[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL = /[\u201C\u201D\u2018\u2019"']+$/;
  var RV_QLEAD_WS = /^\s*[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL_WS = /[\u201C\u201D\u2018\u2019"']+\s*$/;

  function rvBareSpecimens() {
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (n) {
      var s = (n.textContent || '').trim();
      if (s.length < 3) return;
      if (RV_QLEAD.test(s) === false && RV_QTAIL.test(s) === false) return;
      var cs = getComputedStyle(n);
      if (!/mono/i.test(cs.fontFamily)) return;
      var pre = /^pre/.test(cs.whiteSpace);
      var lead = pre ? RV_QLEAD : RV_QLEAD_WS;
      var tail = pre ? RV_QTAIL : RV_QTAIL_WS;
      var f = rvFirstText(n), l = rvLastText(n);
      if (!f || !l) return;
      var changed = false;
      if (f === l) {
        var v = f.nodeValue, nv = v.replace(lead, '').replace(tail, '');
        if (nv !== v && nv.trim().length > 0) { f.nodeValue = nv; changed = true; }
      } else {
        var fv = f.nodeValue.replace(lead, '');
        if (fv !== f.nodeValue) { f.nodeValue = fv; changed = true; }
        var lv = l.nodeValue.replace(tail, '');
        if (lv !== l.nodeValue) { l.nodeValue = lv; changed = true; }
      }
      if (changed) n.classList.add('rv-spec');
    });
  }

  /* ---------- 9 — record rows back to reference height ----------
     The height now comes from the css alone, keyed to the results table's own
     rows (#rr-table tr, header row excepted). No classes are added to rows,
     so nothing can spill onto the ladder. */

  function rvFixPlainButtons() {
    Array.prototype.forEach.call(
      document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'),
      function (b) {
        var label = ((b.textContent || b.value || '') + '').replace(/\s+/g, ' ').trim();
        if (label !== 'Say it in plain English') return;
        if (b.getAttribute('data-rv-moved')) return;
        b.setAttribute('data-rv-moved', '1');
        var row = b.closest('li, article, div');
        if (!row) return;
        var ctrls = row.querySelectorAll('button, a'), tw = null, i;
        for (i = 0; i < ctrls.length; i++) {
          if (((ctrls[i].textContent || '') + '').replace(/\s+/g, ' ').trim() === 'Read the whole write-up') {
            tw = ctrls[i]; break;
          }
        }
        if (!tw || !tw.parentNode) return;
        if (tw.parentNode === b.parentNode) { b.parentNode.classList.add('rv-actions'); return; }
        var old = b.parentNode;
        tw.parentNode.classList.add('rv-actions');
        tw.parentNode.insertBefore(b, tw.nextSibling);
        if (old && old !== row && old !== tw.parentNode &&
            !old.textContent.trim() && old.parentElement) {
          old.parentElement.removeChild(old);
        }
      });
  }

  /* ---------- apply, re-apply, and keep watching ---------- */
  var RV_MO = null, RV_TIMER = null;

  function rvApply() {
    if (RV_MO) RV_MO.disconnect();
    try {
      rvHarvest();
      rvRemoveOldHand();
      rvBareSpecimens();
      rvFixPlainButtons();
      rvRenameLadder();
      rvBuildHeadline();
      rvBuildAim();
      rvBuildSeam();
      rvPartMonthNote();
    } catch (e) { /* never break the page */ }
    RV_MO = RV_MO || new MutationObserver(function () {
      clearTimeout(RV_TIMER);
      RV_TIMER = setTimeout(rvApply, 250);
    });
    setTimeout(function () {
      RV_MO.observe(document.body, { childList: true, subtree: true });
    }, 120);
  }

  function rvBoot() {
    rvApply();
    setTimeout(rvApply, 1500); /* rails and charts that render late */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rvBoot);
  } else {
    rvBoot();
  }
})();
```

What changed:

**Fault 1 — triple names.** `rvRenameLadder` no longer hunts for leaf text matching the designator and no longer appends into cells it has already written (that append-into-own-output was the growth). It now reads each `.orow`'s own `data-take` / `data-aim` attribute (both are in the live markup), takes the code after `op|` / `operator|`, looks up the name, and **replaces the whole `.on` cell** with `Name (CODE)` as one write. A pass over an already-correct cell compares the text first and writes nothing, so the observer settles instead of cycling. The `data-rv-named` bookkeeping and the `rv-lname` / `rv-lcode` CSS went with it.

**Fault 2 — foreign count in the sentence.** New helper `rvStripCounts` removes any parenthesised group that contains a digit (the whole-corpus counts in the menu labels) and keeps groups without digits. It is applied to the zone label, which is then lower-cased, so the clause reads `left wing`. It is also applied to the airline name before the ladder writes it, in case the harvested label carries a count of its own — `(SWAA)`, which we add ourselves and which has no digit, survives.

**Item 9 — wrong row.** Deleted `rvTagRows` entirely: no classes are added to any row any more, so nothing can land on `.rail .orow` and the ladder stays at its own 14px. The height rule now keys directly to the element you measured, `#rr-table tr`, header row `tr.hdr` excepted. Line-height sits on the row, the padding on the cells (padding does not apply to `tr` itself), and the margin rule to block elements inside the row. `rvBuildSeam`'s scroll target dropped its `.rv-row` lookup accordingly.

Everything else — the four things that landed (AIM AT box, seam button, bare specimen, and the record-row height, now on the right rows) — is untouched.