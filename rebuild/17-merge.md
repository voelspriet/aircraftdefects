```html
(function () {
  'use strict';
  var doc = document;

  /* ---------- faces (kept from the second block; idempotent) ---------- */
  if (!doc.getElementById("sdr-faces")) {
    var p1 = doc.createElement("link"); p1.rel = "preconnect"; p1.href = "https://fonts.googleapis.com";
    var p2 = doc.createElement("link"); p2.rel = "preconnect"; p2.href = "https://fonts.gstatic.com"; p2.crossOrigin = "anonymous";
    var fl = doc.createElement("link"); fl.id = "sdr-faces"; fl.rel = "stylesheet";
    fl.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap";
    doc.head.appendChild(p1); doc.head.appendChild(p2); doc.head.appendChild(fl);
  }

  /* ---------- css, injected once ---------- */
  var RV_CSS = [
":root{--rv-rust:#b8431f;--rv-ash:#756f69}",
"/* ---- the standing sentence: SECOND block kept (Instrument Serif, 34px/1.1, #1d1d1f) ---- */",
".stand,.rv-sentence,.stand.rv-sentence{font-family:'Instrument Serif',Georgia,'Times New Roman',serif!important;",
"  font-size:34px!important;font-weight:400!important;line-height:1.1!important;",
"  color:#1d1d1f!important;max-width:26em;margin:7px 0 0}",
"/* count: mono, .92em of 34 = 31.28px, rust-text rgb(184,67,31) */",
".rv-count,.rv-sentence .fig{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;",
"  font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}",
"/* aside: Instrument Serif, .62em of 34 = 21.08px, rgb(117,111,105) */",
".rv-aside,.rv-sentence .aside{font-family:'Instrument Serif',Georgia,serif!important;",
"  font-size:.62em!important;color:#756f69!important;margin-left:10px;white-space:nowrap}",
".rv-clause{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;",
"  border-bottom:1px dotted rgba(29,29,31,.28)}",
".rv-clause:hover,.rv-clause:focus-visible{color:#b8431f;border-bottom-color:#b8431f}",
".rv-clause:focus-visible{outline:2px solid #b8431f;outline-offset:2px}",
"/* ---- the aim feedback line: SECOND block kept (keeps its box when empty, so a hover moves nothing) ---- */",
".aim{display:block!important;min-height:20px;margin-top:6px;",
"  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;",
"  font-size:13px;line-height:20px;color:#b8431f!important}",
".aim .undoit{background:none;border:1px solid rgba(184,67,31,.5);color:#b8431f;",
"  border-radius:4px;padding:1px 8px;margin-left:8px;cursor:pointer;font:inherit;font-size:12px}",
"/* ---- the hand line: SECOND block kept (original wording per open rail, Archivo 600) ---- */",
".hand{font-family:Archivo,system-ui,sans-serif;font-size:13px;font-weight:600;line-height:1.4;",
"  color:#1d1d1f;margin-top:2px}",
".hand .kbd{display:none;font-weight:400;color:#6b6560}",
".hand:focus-within .kbd,.hand:hover .kbd{display:inline}",
".hand .c{font-weight:400;color:#6b6560;cursor:pointer;margin-left:6px}",
"/* ---- the AIM AT box: FIRST block kept (built when the page has none), recoloured to the page ---- */",
".rv-aim{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:16px 0 0}",
".rv-aim-label{font:600 11px/1 Archivo,system-ui,sans-serif;letter-spacing:.14em;color:#b8431f}",
".rv-aim select,.rv-aim input{font-family:inherit;font-size:13px;color:#1d1d1f;",
"  padding:6px 8px;border:1px solid #c8c1b4;border-radius:3px;background:#fff}",
".rv-aim input[type=text]{min-width:30ch}",
".rv-take{font-family:inherit;font-size:13px;padding:7px 16px;border:1px solid #1d1d1f;",
"  border-radius:3px;background:#1d1d1f;color:#fff;cursor:pointer}",
".rv-take:hover{filter:brightness(1.15)}",
"/* ---- the seam: FIRST block kept, in the original's own shape ---- */",
".rv-seam{display:block;margin:8px 0 0 auto;height:34px;border:0;background:#b8431f;color:#fff;",
"  font:600 12px/1 Archivo,system-ui,sans-serif;padding:0 18px;cursor:pointer;border-radius:5px 0 0 0}",
".rv-seam:hover{background:#a83d1f}",
"/* ---- margin, reading, ladder row type: SECOND block kept ---- */",
".margin{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.5;",
"  color:#5f584f;margin-top:6px;border-top:1px solid #e2ded5;padding:5px 0 2px}",
".margin span{display:block;color:#5f584f}",
".margin span+span{margin-top:2px}",
".margin .rustnote{color:#b8431f}",
".reading{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#1d1d1f;",
"  margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid #c44b28;background:#faf7f3;max-width:74ch}",
".orow{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11.5px;color:#1d1d1f}",
".orow .on{color:#1d1d1f;font-family:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".orow b{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:400;text-align:right;color:#5f584f}",
"/* a nested duplicate designator in a ladder row never shows */",
".orow .on>.rv-lcode{display:none}",
"/* ---- the tab strip: SECOND block kept (in the flow, never sticky) ---- */",
"[role='tablist']{position:static!important;top:auto!important;bottom:auto!important;z-index:auto!important}",
".tabs{display:block;border-bottom:1px solid #e2ded5;margin:10px 0 12px;padding-bottom:6px}",
"[id^='vtab-'],.tabs .tab{display:inline-block!important;min-height:0!important;height:auto;",
"  padding:4px 10px;font-size:12.5px;line-height:1.35;border-radius:3px;",
"  border:1px solid transparent;background:none;color:#6b6560;cursor:pointer;font-family:inherit}",
"[id^='vtab-'][aria-selected='true'],.tabs .tab.on{background:#fff;border-color:#e2ded5;color:#1d1d1f;font-weight:600}",
".vgroup{display:flex!important;align-items:baseline;gap:10px;margin:0 0 3px}",
".vrow{display:flex!important;gap:2px;flex-wrap:wrap;flex:1;min-width:0}",
".vlab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;",
"  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}",
"/* ---- the case sheet: the ORIGINAL's overlay, restored ---- */",
"#case-wrap{position:fixed!important;inset:0!important;overflow:auto!important;",
"  overscroll-behavior:contain;background:rgba(12,16,22,.72)!important;z-index:60;",
"  align-items:flex-start;justify-content:center;padding:32px 16px}",
"#case-box{position:relative;inset:auto;transform:none;width:100%;max-width:900px;height:auto;",
"  max-height:none;min-height:0;margin:0 auto;overflow:visible;background:#fff;border-radius:12px;",
"  padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-box{max-width:100%}}",
"/* ---- part-month note: FIRST block kept ---- */",
".rv-month-note{color:#b8431f!important;font-size:12px!important;line-height:1.55;margin:0 0 6px}",
"/* ---- record rows back to reference height: FIRST block kept ---- */",
"#rr-table tr:not(.hdr){line-height:1.35!important}",
"#rr-table tr:not(.hdr) td{padding-top:5px!important;padding-bottom:5px!important}",
"#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px!important}",
".rv-spec{line-height:1.45!important}",
".rv-actions{display:flex!important;flex-wrap:nowrap!important;align-items:baseline;gap:12px}",
".rv-actions>*{margin:0!important}"
  ].join("\n");
  if (!doc.querySelector('style[data-rv]')) {
    var rvSt = doc.createElement('style');
    rvSt.setAttribute('data-rv', '1');
    rvSt.textContent = RV_CSS;
    doc.head.appendChild(rvSt);
  }

  /* ---------- state ---------- */
  var RV_AIR = {}, RV_OPKEY = null, RV_COUNT = '';
  var RV_ZONES = { 'ZONE 500': 'left wing' };
  var RV_AIR_FALLBACK = {
    SWAA: 'Southwest Airlines Co', DALA: 'Delta Air Lines Inc',
    SWIA: 'Skywest Airlines Inc', AALA: 'American Airlines Inc',
    CALA: 'Continental Airlines Inc', FDEA: 'Federal Express Corporation'
  };

  /* ---------- helpers ---------- */
  function rvEl(tag, cls) { var n = doc.createElement(tag); if (cls) n.className = cls; return n; }

  function rvStripCounts(s) {
    return (s || '').replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }

  function rvLeaves(root) {
    var out = [], w = doc.createTreeWalker(root || doc.body, NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) if (!n.firstElementChild) out.push(n);
    return out;
  }
  function rvByText(txt, root) {
    return rvLeaves(root).filter(function (n) {
      return (n.textContent || '').trim().indexOf(txt) > -1;
    });
  }
  function rvFirstText(n) {
    var w = doc.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) return x;
    return null;
  }
  function rvLastText(n) {
    var w = doc.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x, r = null;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) r = x;
    return r;
  }
  function rvRowsFor(marker, minRows) {
    var leaves = rvByText(marker);
    if (!leaves.length) return null;
    var node = leaves[0];
    while (node && node.parentElement) {
      var p = node.parentElement;
      if (p === doc.body) return null;
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

  /* ---------- names, harvested from the page's own menus ---------- */
  function rvHarvest() {
    RV_AIR = {}; RV_OPKEY = null;
    var zones = {};
    Array.prototype.forEach.call(doc.querySelectorAll('select'), function (s) {
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
    for (var k in zones) RV_ZONES[k] = zones[k];
  }

  /* ---------- the ladder: "Southwest Airlines Co (SWAA)", once ---------- */
  function rvRenameLadder() {
    Array.prototype.forEach.call(
      doc.querySelectorAll('.orow[data-take], .orow[data-aim]'),
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
  /* nested duplicate designator inside the same row goes */
  function rvHideLadderDupes() {
    Array.prototype.forEach.call(doc.querySelectorAll('.orow .on'), function (on) {
      var kids = on.children, name = null, code = null, i;
      for (i = 0; i < kids.length; i++) {
        if (kids[i].classList.contains('rv-lname')) { if (!name) name = kids[i]; }
        else if (kids[i].classList.contains('rv-lcode')) { code = kids[i]; }
      }
      if (name && code) code.style.display = 'none';
    });
  }

  /* ---------- the standing sentence as headline ---------- */
  function rvSentenceBlock() {
    var s = doc.querySelector('.sentence') || doc.getElementById('iSentence');
    if (s) return s;
    var hits = rvLeaves().filter(function (n) {
      var t = (n.textContent || '').trim();
      return /^\d[\d,]*\s+reports\b/.test(t) && t.length < 240;
    });
    if (!hits.length) return null;
    var node = hits[0];
    while (node.parentElement && node.parentElement !== doc.body) {
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
    RV_COUNT = mc ? mc[1] : ((doc.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', ''])[1]);

    var P = rvParams();
    var zraw = (P.get('zone') || '').trim().toUpperCase().replace(/\s+/g, ' ');
    var zoneName = zraw ? (RV_ZONES[zraw] || P.get('zone')) : '';  /* words, not the code */
    if (zoneName) zoneName = rvStripCounts(zoneName).toLowerCase();
    var monthTxt = rvMonthText(P.get('from'), P.get('to'));

    block.setAttribute('data-rv', '1');
    block.classList.add('rv-sentence');
    block.textContent = '';

    var parts = [{ rust: true, text: (mc ? mc[1] : '') + ' reports' }];
    if (zoneName) parts.push({ drop: 'zone', text: zoneName });
    if (monthTxt) parts.push({ drop: 'dates', text: monthTxt });

    parts.forEach(function (pt, i) {
      if (i) block.appendChild(doc.createTextNode(', '));
      if (pt.rust) {
        var s = rvEl('span', 'rv-count'); s.textContent = pt.text; block.appendChild(s);
      } else {
        var b = rvEl('button', 'rv-clause'); b.type = 'button'; b.textContent = pt.text;
        b.addEventListener('click', function () { rvDrop(pt.drop); });
        block.appendChild(b);
      }
    });
    block.appendChild(doc.createTextNode('.'));
    if (ma) {
      block.appendChild(doc.createTextNode(' '));
      var a = rvEl('span', 'rv-aside');
      a.textContent = ma[1] + ' set aside.';
      block.appendChild(a);
    }
  }

  /* ---------- the AIM AT box ---------- */
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

  function rvBuildAim() {
    /* the original page carries its own .aimat; never build a second one */
    if (doc.getElementById('iAimAt') && doc.querySelector('.aimat')) return;
    var block = doc.querySelector('.rv-sentence') || rvSentenceBlock();
    if (!block || !block.parentNode || doc.querySelector('.rv-aim')) return;

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
          if (!code) { target.style.borderColor = '#b8431f'; return; }
          p.set(RV_OPKEY || 'operator', code);
        } else if (kind.value === 'zone') {
          var zc = rvResolveZone(v);
          if (!zc) { target.style.borderColor = '#b8431f'; return; }
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
  }

  /* ---------- the hand line (SECOND block kept) ---------- */
  var HAND = { when: "Drag across the months to take a period.",
    where: "Click a zone on the aircraft to keep only what was found there.",
    whose: "Click an airline or an airframe to follow it.",
    forced: "Click what the crew had to do." };
  var KBD = "Keyboard: arrows walk the months, Shift and an arrow extends, Enter takes it.";

  function rvOpenRail() {
    var p = doc.querySelector("#hero .picker [data-pick][aria-selected='true']");
    if (p) return p.getAttribute("data-pick");
    var r = doc.querySelector("#hero .rail.open[data-rail]");
    return r ? r.getAttribute("data-rail") : "whose";
  }
  function rvEnsureHand() {
    var hero = doc.getElementById("hero"); if (!hero) return;
    var aim = hero.querySelector(".aim"); if (!aim) return;
    var hand = doc.getElementById("iHand") || hero.querySelector(".hand");
    if (!hand) {
      hand = doc.createElement("div"); hand.className = "hand"; hand.id = "iHand";
      var anchor = hero.querySelector(".aimat") || aim;
      anchor.insertAdjacentElement("afterend", hand);
    }
    var txt = HAND[rvOpenRail()] || HAND.whose;
    if (hand.getAttribute("data-txt") === txt) return;
    hand.setAttribute("data-txt", txt);
    while (hand.firstChild) hand.removeChild(hand.firstChild);
    hand.appendChild(doc.createTextNode(txt));
    var kbd = doc.createElement("span"); kbd.className = "kbd"; kbd.textContent = KBD; hand.appendChild(kbd);
    var c = doc.createElement("span"); c.className = "c"; c.textContent = "Or use the filters below.";
    c.onclick = function () { var d = doc.getElementById("morefilters");
      if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); } };
    hand.appendChild(c);
  }

  /* ---------- the seam ---------- */
  function rvRecordsList() {
    var f = rvRowsFor('Read the whole write-up', 6) || rvRowsFor('Say it in plain English', 6);
    return f ? f.container : null;
  }
  function rvBuildSeam() {
    if (doc.querySelector('.seam, .rv-seam')) return;  /* the page's own seam wins */
    var count = RV_COUNT ||
      (doc.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', '145'])[1];
    var list = rvRecordsList();
    var btn = rvEl('button', 'rv-seam'); btn.type = 'button';
    btn.setAttribute('data-rv', '1');
    btn.textContent = 'Read the ' + count + ' \u2192';
    btn.addEventListener('click', function () {
      var first = list && list.firstElementChild;
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: doc.body.scrollHeight, behavior: 'smooth' });
    });
    if (list && list.parentNode) list.parentNode.insertBefore(btn, list);
    else doc.body.appendChild(btn);
  }

  /* ---------- the part-month note ---------- */
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
  function rvRailsRoot() {
    var leaf = null, codes = ['SWAA', 'DALA', 'AALA', 'SWIA', 'CALA'], i, hits;
    for (i = 0; i < codes.length && !leaf; i++) {
      hits = rvByText(codes[i]);
      if (hits.length) leaf = hits[0];
    }
    if (!leaf) return null;
    var node = leaf;
    while (node.parentElement && node.parentElement !== doc.body) {
      if ((node.parentElement.textContent || '').indexOf('Read the whole write-up') > -1) break;
      node = node.parentElement;
    }
    return node;
  }
  function rvPartMonthNote() {
    if (doc.querySelector('.rv-month-note')) return;
    var now = new Date();
    var last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var day = now.getDate();
    if (day >= last) return;
    var name = now.toLocaleString('en-US', { month: 'long' });
    var note = rvEl('p', 'rv-month-note');
    note.setAttribute('data-rv', '1');
    note.textContent = name + ' ' + now.getFullYear() + ' covers 1 to ' + day + ' ' + name +
      ', so its bar counts ' + day + ' days against ' + last + ' in a whole one';
    var rails = rvRailsRoot();
    var ash = rvAshLine(rails);
    if (ash && ash.parentNode) ash.parentNode.insertBefore(note, ash);
    else if (rails) rails.insertBefore(note, rails.firstChild);
    else doc.body.appendChild(note);
  }

  /* ---------- specimens bare, in monospace ---------- */
  var RV_QLEAD = /^[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL = /[\u201C\u201D\u2018\u2019"']+$/;
  var RV_QLEAD_WS = /^\s*[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL_WS = /[\u201C\u201D\u2018\u2019"']+\s*$/;

  function rvBareSpecimens() {
    Array.prototype.forEach.call(doc.querySelectorAll('body *'), function (n) {
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

  /* ---------- plain-English button beside its read-more neighbour ---------- */
  function rvFixPlainButtons() {
    Array.prototype.forEach.call(
      doc.querySelectorAll('button, a, input[type="button"], input[type="submit"]'),
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

  /* ---------- the tab strip: in the flow, never sticky ---------- */
  function rvVtabCount(n) { return n.querySelectorAll("[id^='vtab-']").length; }
  function rvFixTabs() {
    var first = doc.querySelector("[id^='vtab-']"); if (!first) return;
    var total = rvVtabCount(doc), strip = first.parentElement;
    while (strip && strip.parentElement && strip.parentElement !== doc.body
          && strip.parentElement.id !== "main"
          && rvVtabCount(strip.parentElement) === total) {
      strip = strip.parentElement;
    }
    if (!strip) return;
    var n = strip;
    for (var i = 0; i < 4 && n && n.nodeType === 1 && n !== doc.body && n.id !== "main"; i++, n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.position === "sticky" || cs.position === "fixed") {
        n.style.position = "static"; n.style.top = "auto"; n.style.zIndex = "auto";
      }
    }
    strip.style.display = "block";
    strip.style.borderBottom = "1px solid #e2ded5";
    strip.style.margin = "10px 0 12px";
    strip.style.paddingBottom = "6px";
    Array.prototype.forEach.call(strip.children, function (g) {
      if (g.nodeType !== 1) return;
      g.style.display = "flex"; g.style.alignItems = "baseline"; g.style.gap = "10px"; g.style.margin = "0 0 3px";
      Array.prototype.forEach.call(g.children, function (c) {
        if (c.nodeType !== 1) return;
        if (c.querySelector && c.querySelector("[id^='vtab-']")) {
          c.style.display = "flex"; c.style.flexWrap = "wrap"; c.style.gap = "2px";
          c.style.flex = "1"; c.style.minWidth = "0";
        } else if (c.tagName !== "BUTTON" && c.getAttribute("role") !== "tab") {
          c.style.flex = "0 0 200px"; c.style.textAlign = "right"; c.style.whiteSpace = "nowrap";
          c.style.fontFamily = "Archivo,system-ui,sans-serif"; c.style.fontSize = "10px";
          c.style.fontWeight = "600"; c.style.textTransform = "uppercase";
          c.style.color = "#57514a"; c.style.lineHeight = "1.35";
        }
      });
    });
  }

  /* ---------- the case sheet closes on Escape even if the page forgot ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var w = doc.getElementById("case-wrap");
    if (w && w.style.display === "flex") {
      if (typeof window.closeCase === "function") window.closeCase();
      else w.style.display = "none";
    }
  });

  /* ---------- apply, re-apply, keep watching ---------- */
  var RV_MO = null, RV_TIMER = null;

  function rvApply() {
    if (RV_MO) RV_MO.disconnect();
    try {
      rvHarvest();
      rvBareSpecimens();
      rvFixPlainButtons();
      rvRenameLadder();
      rvHideLadderDupes();
      rvBuildHeadline();
      rvBuildAim();
      rvEnsureHand();
      rvBuildSeam();
      rvPartMonthNote();
      rvFixTabs();
    } catch (e) { /* never break the page */ }
    RV_MO = RV_MO || new MutationObserver(function () {
      clearTimeout(RV_TIMER);
      RV_TIMER = setTimeout(rvApply, 250);
    });
    setTimeout(function () {
      RV_MO.observe(doc.body, { childList: true, subtree: true });
    }, 120);
  }

  function rvBoot() {
    rvApply();
    setTimeout(rvApply, 1500); /* rails and charts that render late */
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', rvBoot);
  else rvBoot();
})();
```

Where the two disagreed, decided once:

- **Standing sentence** — second block kept: Instrument Serif, 34px/1.1, rgb(29,29,31). The first block's Georgia/#26221d is gone.
- **Count** — second block's `.fig` treatment kept: IBM Plex Mono 500, .92em (31.28px), rgb(184,67,31).
- **Aside** — second block kept: Instrument Serif, .62em (21.08px), rgb(117,111,105); only the first block's 10px left margin survives.
- **Clause underline** — second block kept (dotted border-bottom, as the original), not the first block's text-decoration.
- **Hand line** — second block kept: per-rail original wording in `.hand`, Archivo 600. The first block's `.rv-hand` builder and its "remove old hand" sweep are dropped, since the sweep would have deleted the second block's hand on the next pass.
- **Aim feedback line** — second block kept (`.aim` with min-height, so a hover moves nothing); first block's separate `.rv-aim` styles only the AIM AT box it builds, which it skips entirely when the page already has `.aimat`/`#iAimAt`.
- **Case sheet** — second block's `position:static` overrides removed; the original's overlay restored: `#case-wrap` fixed at `inset:0`, dark wash, scrolling, 900px card, plus a belt-and-braces Escape handler.
- **Everything else** — first block's builders kept as they were (ladder rename writing "Southwest Airlines Co (SWAA)" once, AIM AT box, seam button, bare specimens, part-month note, record-row heights, plain-English button), with the second block's tab-strip unstick kept alongside. Both seam and headline defer to the page's own `.seam`/`.sentence` when present, so nothing is duplicated.