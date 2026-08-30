```js
/* block 44 script, replacing 43-dom.js whole.
   Jobs:
   1. exactly one #iAim, enforced at every write channel, emitter named in console
   2. every :hover rule in the page's own stylesheets loses layout changing
      declarations and keeps color, shadow and transform
   3. the standalone back to the instrument control gets a 24px tap target
   4. a repeat row with no hours figure carries the file's own reason instead
      of the bare phrase, taken from the note the repeats view now sends with
      every blank, and the two causes keep their two different sentences
   5. the standing sentence's number, [data-gtotal] inside the group whose id
      is ignore, always shows the whole file's count and never the selection's,
      filled in from CORPUS, d.corpus on the hero response or range.total from
      api/facets, repainted after every filter change, placeholder only until
      the count is known. Checked on /z/, /z/?operator=SWAA and
      /z/?take=zone|ZONE+700: all three read 1,757,827.
   6. #count follows a click exactly as it follows a load. The page composes
      the standing sentence on load and never on the click path, so this block
      owns the sentence from the outside: it reads the selection from the URL,
      learns the selection's count from the page's own API answers, from the
      parent's count line, from messages the page sends out and from the row
      the reader clicked, and after every selection change it repaints #count
      with that selection's count, the clauses naming what is selected and the
      set aside figure. Clearing the selection restores the whole file
      sentence, word for word as the page painted it on load.
   7. #noRows shows only while there is no selection and no rows. It hides the
      moment rows are on screen and comes back when the reader clears the
      selection. The element and its sentence are never removed.
   8. the sticky results bar gets an opaque face wherever it overlaps the
      results region, so content passing underneath is covered rather than
      struck through, and at rest any live control in the results region is
      pushed clear of the bar's box.
   Plus the root background is synced to the body's computed background. */

(function () {
  'use strict';

  var AIM = 'iAim';
  var TAP_TEXT = 'back to the instrument';

  /* ---------- 1. one aim line ---------- */

  function existingAim() {
    try { return document.getElementById(AIM); } catch (e) { return null; }
  }

  function logBlock(channel) {
    try {
      console.info('[iAim] a second #' + AIM + ' was refused at ' + channel +
        '. Emitting stack follows, it names the block that emits it:');
      console.info(new Error().stack || '(no stack)');
    } catch (e) {}
  }

  function stripId(el) {
    try { el.removeAttribute('id'); } catch (e) {}
  }

  /* strip a duplicate id from a node about to be inserted.
     isSuccessor: true when the node replaces the current copy. */
  function cleanNode(node, isSuccessor) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
    var ex = existingAim();
    if (!ex || isSuccessor || node === ex) return;
    if (node.nodeType === 1 && node.contains && node.contains(ex)) return;
    var dup = null;
    try {
      if (node.nodeType === 1 && node.id === AIM) dup = node;
      else if (node.querySelector) dup = node.querySelector('[id="' + AIM + '"]');
    } catch (e) { return; }
    if (dup) { stripId(dup); logBlock('node insert'); }
  }

  /* strip a duplicate id from an html string about to be written.
     destroys: true when the write clears the target's children. */
  function cleanHtml(target, html, destroys) {
    if (typeof html !== 'string' || html.indexOf(AIM) === -1) return html;
    var ex = existingAim();
    if (!ex) return html;
    if (destroys && target && (target === ex || (target.contains && target.contains(ex)))) {
      return html; /* the write destroys the current copy, the string carries the id */
    }
    var out = html.replace(/\s+id\s*=\s*(["'])iAim\1/gi, '')
                  .replace(/\s+id\s*=\s*iAim(?=[\s>])/gi, '');
    if (out !== html) logBlock(destroys ? 'innerHTML' : 'insertAdjacentHTML');
    return out;
  }

  /* the id property */
  try {
    var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
    if (idDesc && idDesc.configurable && idDesc.set) {
      Object.defineProperty(Element.prototype, 'id', {
        configurable: true,
        enumerable: idDesc.enumerable,
        get: function () { return idDesc.get.call(this); },
        set: function (v) {
          if (v === AIM && this.nodeType === 1) {
            var ex = existingAim();
            if (ex && ex !== this && !(this.contains && this.contains(ex))) {
              logBlock('id property'); return;
            }
          }
          idDesc.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  /* setAttribute */
  try {
    var setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      try {
        if (String(name).toLowerCase() === 'id' &&
            String(value).toLowerCase() === AIM) {
          var ex = existingAim();
          if (ex && ex !== this && !(this.contains && this.contains(ex))) {
            logBlock('setAttribute'); return;
          }
        }
      } catch (e) {}
      return setAttr.call(this, name, value);
    };
  } catch (e) {}

  /* insertion channels */
  try {
    var ap = Node.prototype.appendChild;
    Node.prototype.appendChild = function (n) {
      try { cleanNode(n, false); } catch (e) {}
      return ap.apply(this, arguments);
    };
    var ib = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (n, ref) {
      try { cleanNode(n, false); } catch (e) {}
      return ib.apply(this, arguments);
    };
    var rc = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function (n, old) {
      var succ = false;
      try { succ = (old === existingAim()); } catch (e) {}
      try { cleanNode(n, succ); } catch (e) {}
      return rc.apply(this, arguments);
    };
  } catch (e) {}

  try {
    var appendM = Element.prototype.append;
    if (appendM) {
      Element.prototype.append = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return appendM.apply(this, arguments);
      };
    }
    var prependM = Element.prototype.prepend;
    if (prependM) {
      Element.prototype.prepend = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return prependM.apply(this, arguments);
      };
    }
    var iae = Element.prototype.insertAdjacentElement;
    if (iae) {
      Element.prototype.insertAdjacentElement = function (pos, el) {
        try { cleanNode(el, false); } catch (e) {}
        return iae.call(this, pos, el);
      };
    }
    var iah = Element.prototype.insertAdjacentHTML;
    if (iah) {
      Element.prototype.insertAdjacentHTML = function (pos, text) {
        try { if (arguments.length > 1) text = cleanHtml(this, text, false); } catch (e) {}
        return iah.call(this, pos, text);
      };
    }
  } catch (e) {}

  /* innerHTML */
  try {
    var ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (ih && ih.configurable && ih.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        enumerable: ih.enumerable,
        get: function () { return ih.get.call(this); },
        set: function (v) {
          try { if (typeof v === 'string') v = cleanHtml(this, v, true); } catch (e) {}
          ih.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  /* backstop: if two copies ever coexist, keep the one with content,
     else the first in document order, which is the one writes reach */
  function enforceAimOnce() {
    var list;
    try { list = document.querySelectorAll('[id="' + AIM + '"]'); } catch (e) { return; }
    if (!list || list.length < 2) return;
    var keep = null, i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].textContent || '').trim().length) { keep = list[i]; break; }
    }
    if (!keep) keep = list[0];
    for (i = 0; i < list.length; i++) {
      if (list[i] !== keep) stripId(list[i]);
    }
  }

  /* ---------- 2. no hover moves the page ---------- */

  var LAYOUT = {};
  ('width min-width max-width height min-height max-height ' +
   'margin margin-top margin-right margin-bottom margin-left ' +
   'padding padding-top padding-right padding-bottom padding-left ' +
   'font-size line-height letter-spacing word-spacing white-space text-indent ' +
   'display position top right bottom left inset float ' +
   'flex flex-basis flex-grow flex-shrink flex-direction flex-wrap flex-flow ' +
   'gap row-gap column-gap ' +
   'grid grid-template grid-template-areas grid-template-rows grid-template-columns ' +
   'grid-auto-rows grid-auto-columns grid-auto-flow ' +
   'columns column-width column-count ' +
   'vertical-align box-sizing zoom ' +
   'border border-width border-top border-right border-bottom border-left ' +
   'border-top-width border-right-width border-bottom-width border-left-width'
  ).split(/\s+/).forEach(function (p) { if (p) LAYOUT[p] = true; });

  var PROTECTED = ['case-wrap', 'case-box', 'rr-sheet-lock'];

  function keepBorderColor(style, prop) {
    var val = '';
    try { val = style.getPropertyValue(prop) || ''; } catch (e) {}
    var m = val.match(/#[0-9a-f]{3,8}\b|rgba?\([^\)]*\)|hsla?\([^\)]*\)/i);
    try {
      style.removeProperty(prop);
      if (m) {
        var target = 'border-color';
        var side = prop.toLowerCase().match(/^border-(top|right|bottom|left)/);
        if (side) target = 'border-' + side[1] + '-color';
        style.setProperty(target, m[0]);
      }
    } catch (e) {}
  }

  function scrubRule(rule) {
    var sel;
    try { sel = rule.selectorText || ''; } catch (e) { return; }
    if (!sel || sel.indexOf(':hover') === -1) return;
    var low = sel.toLowerCase(), i, p;
    for (i = 0; i < PROTECTED.length; i++) {
      if (low.indexOf(PROTECTED[i]) !== -1) return;
    }
    var parts = sel.split(',');
    for (i = 0; i < parts.length; i++) {
      p = parts[i].toLowerCase();
      if (p.indexOf(':hover') === -1) return;
      if (p.indexOf(':not(') !== -1 || p.indexOf(':is(') !== -1 ||
          p.indexOf(':where(') !== -1 || p.indexOf(':has(') !== -1 ||
          p.indexOf(':matches(') !== -1) return;
    }
    var props = [];
    try {
      for (i = 0; i < rule.style.length; i++) props.push(rule.style[i]);
    } catch (e) { return; }
    for (i = 0; i < props.length; i++) {
      var pl = props[i].toLowerCase();
      if (pl === 'border' || pl === 'border-width' ||
          /^border-(top|right|bottom|left)(-width)?$/.test(pl)) {
        keepBorderColor(rule.style, props[i]);
        continue;
      }
      if (LAYOUT[pl]) {
        try { rule.style.removeProperty(props[i]); } catch (e) {}
      }
    }
  }

  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      try {
        if (r.type === 1) {
          scrubRule(r);
          if (r.cssRules && r.cssRules.length) walk(r.cssRules);
        } else {
          if (r.cssRules && r.cssRules.length) walk(r.cssRules);
          if (r.styleSheet && r.styleSheet.cssRules) walk(r.styleSheet.cssRules);
        }
      } catch (e) {}
    }
  }

  function sweep() {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
        if (rules && rules.length) walk(rules);
      } catch (e) { /* cross origin sheet, leave it alone */ }
    }
  }

  /* ---------- 3. the standalone back link ---------- */

  function tapFix(scope) {
    var els;
    try { els = (scope || document).querySelectorAll('a, button, [role="button"]'); }
    catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      try {
        if (el.getAttribute('data-tap44') === '1') continue;
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (t.indexOf(TAP_TEXT) !== -1) {
          el.style.display = 'inline-block';
          el.style.minHeight = '24px';
          el.style.minWidth = '24px';
          el.style.boxSizing = 'border-box';
          el.style.verticalAlign = 'middle';
          el.setAttribute('data-tap44', '1');
        }
      } catch (e) {}
    }
  }

  /* ---------- 4. a reason on every repeat row that has no hours figure ---------- */

  var REPEATS_PATH = '/z/api/repeats/';
  var PHRASE = 'hours between first and last';
  var FLAG = 'data-hrs44';
  var REASON_DISAGREE = "the file's own hour readings do not agree";
  var REASON_NO_HOURS = 'the file records no airframe hours on one or more of these reports';
  var REASON_FALLBACK = 'the file does not provide the hours between these reports';

  var repeatGroups = [];

  function normTxt(s) {
    try { return String(s || '').replace(/\s+/g, ' ').toLowerCase(); }
    catch (e) { return ''; }
  }

  function shortReason(note) {
    var n = normTxt(note);
    if (n.indexOf('do not agree') !== -1) return REASON_DISAGREE;
    if (n.indexOf('does not record') !== -1) return REASON_NO_HOURS;
    return null;
  }

  function findGroup(rowText) {
    var t = normTxt(rowText);
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < repeatGroups.length; i++) {
        var g = repeatGroups[i];
        if (!g || g.hours_between != null || !g.note) continue;
        var sys = normTxt(g.system);
        if (sys && t.indexOf(sys) === -1) continue;
        if (g.times == null || t.indexOf(g.times + ' write-ups') === -1) continue;
        if (pass === 0) {
          var part = normTxt(g.part);
          if (part && t.indexOf(part) === -1) continue;
        }
        return g;
      }
    }
    return null;
  }

  function restoreFallback(row) {
    try {
      var w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, null, false);
      while (w.nextNode()) {
        var n = w.currentNode;
        if (n.nodeValue && n.nodeValue.indexOf(REASON_FALLBACK) !== -1) {
          n.nodeValue = n.nodeValue.split(REASON_FALLBACK).join(PHRASE);
        }
      }
    } catch (e) {}
  }

  function takeGroups(data) {
    try {
      if (!data || !data.groups || !data.groups.length) return;
      var added = false;
      for (var i = 0; i < data.groups.length; i++) {
        var g = data.groups[i];
        if (g && g.hours_between == null && g.note) {
          repeatGroups.push(g);
          added = true;
        }
      }
      if (!added) return;
      var stale = document.querySelectorAll('[' + FLAG + '="fallback"]');
      for (var j = 0; j < stale.length; j++) {
        restoreFallback(stale[j]);
        try { stale[j].removeAttribute(FLAG); } catch (e) {}
      }
      backstop();
    } catch (e) {}
  }

  function parseJson(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  /* read the notes however the page asks for them, and while the responses
     are already in hand, listen for the file's own count (job 5) and for the
     selection's count and row batches (jobs 6 and 7) */
  try {
    if (typeof window.fetch === 'function' && !window.__zRepeatHook) {
      var ofetch = window.fetch;
      window.fetch = function () {
        var url = '';
        try {
          var a0 = arguments[0];
          url = String(a0 && a0.url ? a0.url : a0);
        } catch (e) {}
        var p = ofetch.apply(this, arguments);
        try {
          if (p && typeof p.then === 'function') {
            p.then(function (res) {
              try {
                if (res && typeof res.clone === 'function') {
                  res.clone().json().then(function (d) {
                    takeGroups(d);
                    sniffCorpus(d, url);
                    noteResponse(d, url);
                  }).catch(function () {});
                }
              } catch (e) {}
            }).catch(function () {});
          }
        } catch (e) {}
        return p;
      };
      window.__zRepeatHook = true;
    }
  } catch (e) {}

  try {
    if (!XMLHttpRequest.prototype.__zRepeatHook) {
      var xOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        var xhr = this;
        try {
          var u = String(url || '');
          if (u.indexOf(REPEATS_PATH) !== -1 || u.indexOf('/z/api/') !== -1) {
            xhr.addEventListener('load', function () {
              try {
                var d = parseJson(xhr.responseText);
                if (d) { takeGroups(d); sniffCorpus(d, u); noteResponse(d, u); }
              } catch (e) {}
            });
          }
        } catch (e) {}
        return xOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.__zRepeatHook = true;
    }
  } catch (e) {}

  function patchRows(scope) {
    var root = scope || document;
    var host = root;
    try { if (root.nodeType === 9) host = root.body || root.documentElement; } catch (e) {}
    if (!host) return;
    var hay = '';
    try { hay = host.textContent || ''; } catch (e) { return; }
    if (hay.indexOf(PHRASE) === -1) return;
    var walker;
    try {
      walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null, false);
    } catch (e) { return; }
    var hits = [];
    try {
      while (walker.nextNode()) {
        var n = walker.currentNode;
        if (n.nodeValue && n.nodeValue.indexOf(PHRASE) !== -1) hits.push(n);
      }
    } catch (e) { return; }
    for (var i = 0; i < hits.length; i++) fixHoursNode(hits[i]);
  }

  function fixHoursNode(node) {
    try {
      if (node.nodeValue.indexOf('cannot be shown') !== -1) return;
    } catch (e) { return; }
    var el = node.parentElement;
    if (!el) return;
    var row = el, up = 0;
    while (row && up < 8) {
      var txt = '';
      try { txt = row.textContent || ''; } catch (e) { txt = ''; }
      if (txt.indexOf('write-ups') !== -1) break;
      row = row.parentElement;
      up++;
    }
    if (!row) row = el;
    var flag = null;
    try { flag = row.getAttribute(FLAG); } catch (e) {}
    if (flag === 'note' || flag === 'num') return;
    var rowText = '';
    try { rowText = row.textContent || ''; } catch (e) { return; }
    var idx = rowText.indexOf(PHRASE);
    if (idx === -1) return;
    var before = rowText.slice(0, idx).replace(/[\s\u00b7]+$/, '');
    var lastTok = before ? before.split(/\s+/).pop() : '';
    if (/^[\d][\d,]*$/.test(lastTok)) {
      try { row.setAttribute(FLAG, 'num'); } catch (e) {}
      return;
    }
    var g = repeatGroups.length ? findGroup(rowText) : null;
    var reason = (g && g.note) ? shortReason(g.note) : null;
    if (!reason) reason = REASON_FALLBACK;
    try {
      node.nodeValue = node.nodeValue.split(PHRASE).join(reason);
      row.setAttribute(FLAG, g ? 'note' : 'fallback');
    } catch (e) {}
  }

  /* ---------- 5. the standing sentence's number is the file, not the selection ---------- */

  /* The label around the ignore group promises the panels answer from the whole
     file, so its figure must be the corpus. The page paints TOTAL there, which
     is the current selection, and leaves the ellipsis whenever that selection
     count is zero. This job owns the element instead: it takes the count only
     from sources that hold the whole file, CORPUS in the instrument's scope,
     d.corpus on the hero response, range.total from api/facets, and it rewrites
     the element after every repaint, placeholder until the count is known and
     the formatted count after, on every URL, filtered or not. */

  var GT_SEL = '[data-gtotal]';
  var GT_GROUP = 'ignore';
  var corpusN = null;

  function gtGood(v) {
    v = +v;
    return typeof v === 'number' && isFinite(v) && v > 0;
  }

  function gtFmt(n) {
    try {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch (e) { return String(n); }
  }

  function takeCorpus(v) {
    if (corpusN != null || !gtGood(v)) return;
    corpusN = Math.round(+v);
    writeGtotal();
  }

  /* only whole file fields, never a response's selection total */
  function sniffCorpus(data, url) {
    try {
      if (!data || typeof data !== 'object') return;
      if (gtGood(data.corpus)) { takeCorpus(data.corpus); return; }
      if (data.range && gtGood(data.range.total)) takeCorpus(data.range.total);
    } catch (e) {}
  }

  /* reach for the instrument's own scope, whatever it is willing to hand over.
     Bare typeof keeps an unset name from throwing, and the try around each
     read keeps a closure bound name from stopping the others. */
  function tryGlobals() {
    if (corpusN != null) return;
    try { if (typeof CORPUS !== 'undefined' && gtGood(CORPUS)) { takeCorpus(CORPUS); return; } } catch (e) {}
    try { if (typeof heroData !== 'undefined' && heroData && gtGood(heroData.corpus)) { takeCorpus(heroData.corpus); return; } } catch (e) {}
    try { if (typeof range !== 'undefined' && range && gtGood(range.total)) takeCorpus(range.total); } catch (e) {}
  }

  /* prefer the element inside the ignore group, else any [data-gtotal] */
  function gtotalEl() {
    var el = null;
    try {
      var grp = document.getElementById(GT_GROUP);
      if (grp) el = grp.querySelector(GT_SEL);
    } catch (e) {}
    if (!el) {
      try { el = document.querySelector(GT_SEL); } catch (e) { el = null; }
    }
    return el;
  }

  function writeGtotal() {
    if (corpusN == null) return;
    var txt = gtFmt(corpusN);
    var els = [];
    var main = gtotalEl();
    if (main) els.push(main);
    try {
      var all = document.querySelectorAll(GT_SEL);
      for (var i = 0; i < all.length; i++) {
        if (els.indexOf(all[i]) === -1) els.push(all[i]);
      }
    } catch (e) {}
    for (var j = 0; j < els.length; j++) {
      try {
        if ((els[j].textContent || '') !== txt) els[j].textContent = txt;
      } catch (e) {}
    }
  }

  /* the page repaints the label on every filter change; this runs after each
     repaint and puts the corpus back, so the sentence keeps its promise */
  var gtTries = 0;
  var gtTimer = null;
  function gtPoll() {
    tryGlobals();
    writeGtotal();
    if (corpusN != null && gtTimer != null) { clearInterval(gtTimer); gtTimer = null; return; }
    gtTries++;
    if (gtTimer == null) {
      gtTimer = setInterval(function () {
        tryGlobals();
        writeGtotal();
        if (corpusN != null || ++gtTries > 200) {
          if (gtTimer != null) { clearInterval(gtTimer); gtTimer = null; }
        }
      }, 100);
    }
  }

  /* ---------- 6. #count follows a click like it follows a load ---------- */

  var COUNT_ID = 'count';
  var WH_CLAUSE = 'everything the FAA has published to 26 August 2026';

  /* parameters that name a view or a slice of it, never a selection */
  var VIEW_PARAMS = {
    hero: 1, tab: 1, view: 1, panel: 1, embed: 1, theme: 1, format: 1, print: 1,
    page: 1, per: 1, per_page: 1, limit: 1, offset: 1, skip: 1,
    sort: 1, order: 1, dir: 1, layout: 1, mode: 1, lang: 1, scroll: 1, ref: 1
  };

  var apiNotes = [];
  var pmNote = null;
  var lastClick = null;
  var legendRows = [];
  var baseSentence = null;
  var lastTpl = null;
  var adopted = null;      /* which selection key the current #count text is good for */
  var lastWrite = '';
  var usedCorpus = null;
  var seenSent = [];

  function parseQuery(qs) {
    var out = {};
    qs = String(qs == null ? '' : qs);
    try {
      if (typeof URLSearchParams === 'function') {
        new URLSearchParams(qs).forEach(function (v, k) { out[k] = v; });
        return out;
      }
    } catch (e) {}
    qs = qs.replace(/^\?/, '');
    var parts = qs.split('&');
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i];
      if (!pair) continue;
      var j = pair.indexOf('=');
      var k = j === -1 ? pair : pair.slice(0, j);
      var v = j === -1 ? '' : pair.slice(j + 1);
      try { k = decodeURIComponent(k.replace(/\+/g, ' ')); } catch (e) {}
      try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
      if (k) out[k] = v;
    }
    return out;
  }

  function readSel() {
    var params = {};
    try { params = parseQuery(location.search); } catch (e) { params = {}; }
    var out = {};
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
      if (VIEW_PARAMS[String(k).toLowerCase()]) continue;
      var v = params[k];
      if (v == null || v === '') continue;
      out[k] = v;
    }
    var keys = Object.keys(out).sort();
    var parts = [];
    for (var i = 0; i < keys.length; i++) parts.push(keys[i] + '=' + out[keys[i]]);
    return { params: out, n: keys.length, key: parts.join('&') };
  }

  function currentSelParams() {
    try {
      var sel = readSel();
      var out = {};
      for (var k in sel.params) out[k] = sel.params[k];
      return out;
    } catch (e) { return {}; }
  }

  function sameVal(a, b) {
    a = String(a == null ? '' : a).replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    b = String(b == null ? '' : b).replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    return a !== '' && a === b;
  }

  function labelOf(el) {
    try {
      var a = el.getAttribute('data-label') || el.getAttribute('data-name') ||
              el.getAttribute('aria-label') || el.getAttribute('title');
      if (a && String(a).trim()) return String(a).replace(/\s+/g, ' ').trim();
      var tEl = el.querySelector ? el.querySelector('title') : null;
      if (tEl && tEl.textContent && tEl.textContent.trim()) {
        return tEl.textContent.replace(/\s+/g, ' ').trim();
      }
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      t = t.replace(/\b\d{1,3}(?:,\d{3})+\b/g, ' ').replace(/\s+/g, ' ').trim();
      return t;
    } catch (e) { return ''; }
  }

  /* a count printed on the row the reader clicked, commas only, so a zone id
     like 900 is never mistaken for a count */
  function rowNumber(el) {
    try {
      var attrs = ['data-count', 'data-total', 'data-reports', 'data-reports-count', 'data-n'];
      for (var i = 0; i < attrs.length; i++) {
        var v = el.getAttribute ? el.getAttribute(attrs[i]) : null;
        if (v && /^\d[\d,]*$/.test(v)) return parseInt(String(v).replace(/,/g, ''), 10);
      }
    } catch (e) {}
    try {
      var t = (el.textContent || '').replace(/\s+/g, ' ');
      var grouped = t.match(/\d{1,3}(?:,\d{3})+/g);
      if (grouped && grouped.length) {
        return parseInt(grouped[grouped.length - 1].replace(/,/g, ''), 10);
      }
    } catch (e2) {}
    return null;
  }

  /* the zone legend rows and the drawing shapes, with their counts if shown */
  function scanLegend() {
    if (legendRows.length) return;
    try {
      var els = document.querySelectorAll('[data-zone], [data-take]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        legendRows.push({
          v: el.getAttribute('data-zone') || el.getAttribute('data-take') || '',
          label: labelOf(el),
          num: rowNumber(el)
        });
      }
    } catch (e) {}
    if (legendRows.length) return;
    try {
      var rows = document.querySelectorAll('[data-legend] li, #zones li, .zones li, #zoneLegend li, .legend li');
      for (var j = 0; j < rows.length; j++) {
        var li = rows[j];
        legendRows.push({
          v: li.getAttribute ? (li.getAttribute('data-zone') || '') : '',
          label: labelOf(li),
          num: rowNumber(li)
        });
      }
    } catch (e2) {}
  }

  /* figure scanning: totals from whole response objects, array lengths kept
     separately as a rows on screen signal. Buckets inside arrays are never
     scanned, so facet counts cannot pass for a selection total. */
  var FIG_PRI = { total: 5, matched: 4, matches: 4, matching: 4, found: 4, hits: 3, count: 2, n: 1, num: 1 };
  var FIG_CORPUS = { corpus: 1, grand: 1, grandtotal: 1, gtotal: 1, everything: 1, universe: 1 };
  var FIG_PAGEY = { page: 1, per: 1, per_page: 1, limit: 1, offset: 1, skip: 1, size: 1, length: 1, index: 1 };

  function scanFigures(o, depth, acc, parentKey, allowRange) {
    if (!o || typeof o !== 'object' || depth > 3) return;
    if (Array.isArray(o)) {
      if (acc.items == null || o.length > acc.items) acc.items = o.length;
      return;
    }
    for (var k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      var v = o[k];
      var kl = String(k).toLowerCase();
      if (typeof v === 'number' && isFinite(v) && v >= 0 && v < 2e9) {
        if (FIG_CORPUS[kl]) {
          if (acc.corpus == null) acc.corpus = v;
        } else if (FIG_PRI[kl]) {
          var pk = parentKey || '';
          var badParent = FIG_PAGEY[pk] ||
            (!allowRange && (pk === 'range' || pk === 'facets' || pk === 'facet'));
          if (!badParent && (acc.total == null || FIG_PRI[kl] > acc.pri)) {
            acc.total = v;
            acc.pri = FIG_PRI[kl];
          }
        }
      } else if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          if (acc.items == null || v.length > acc.items) acc.items = v.length;
        } else {
          scanFigures(v, depth + 1, acc, kl, allowRange);
        }
      }
    }
  }

  /* remember what each API answer carried, matched later against the URL */
  function noteResponse(d, url) {
    try {
      if (!d || typeof d !== 'object') return;
      var u = String(url || '');
      var qi = u.indexOf('?');
      var path = (qi === -1 ? u : u.slice(0, qi)).toLowerCase();
      var params = qi === -1 ? {} : parseQuery(u.slice(qi + 1).split('#')[0]);
      var isRows = /(rows|list|search|reports|results|query|select)/.test(path) &&
                   !/(repeats|legend|dossier|anatomy|hero|facets)/.test(path);
      var acc = { total: null, pri: 0, items: null, corpus: null };
      scanFigures(d, 0, acc, '', isRows);
      if (/(repeats|legend|dossier|anatomy|hero)/.test(path)) acc.total = null;
      apiNotes.push({ url: u, params: params, total: acc.total, items: acc.items, isRows: isRows, t: Date.now() });
      if (apiNotes.length > 60) apiNotes.splice(0, apiNotes.length - 60);
    } catch (e) {}
    try {
      var s = readSel();
      if (s.n > 0 && adopted === s.key && !lastTpl) {
        var ce = countEl();
        if (ce) {
          var tx = '';
          try { tx = (ce.textContent || '').replace(/\s+/g, ' ').trim(); } catch (e2) {}
          if (tx && !isWholeFileText(tx)) captureTemplate(tx, s);
        }
      }
    } catch (e3) {}
    try { nudge(); } catch (e4) {}
  }

  function noteMatchesSel(note, sel) {
    if (!note || !sel) return false;
    var keys = Object.keys(sel.params);
    if (!keys.length) return false;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!(k in note.params) || !sameVal(note.params[k], sel.params[k])) return false;
    }
    return true;
  }

  /* a number that is also part of a selection value, like the 900 in
     ZONE 900, is never accepted as a count */
  function digitsInValue(num, sel) {
    var s = String(num);
    for (var k in sel.params) {
      var digits = String(sel.params[k]).replace(/\D/g, '');
      if (digits && digits.indexOf(s) !== -1) return true;
    }
    return false;
  }

  var pcCache = { key: null, t: 0, v: null };

  /* the parent's own count line, the one that reads N reports match your
     selection, is a good witness, but only when the parent's URL carries the
     same selection */
  function parentCount(sel) {
    if (sel.n === 0) return null;
    var now = Date.now();
    if (pcCache.key === sel.key && now - pcCache.t < 2000) return pcCache.v;
    var v = null;
    try {
      if (window.parent && window.parent !== window) {
        var w = window.parent;
        var pp;
        try { pp = parseQuery(w.location.search); } catch (e) { pp = null; }
        if (pp) {
          var ok = true;
          for (var k in sel.params) {
            if (!sameVal(pp[k], sel.params[k])) { ok = false; break; }
          }
          if (ok) {
            var txt = '';
            try { txt = w.document.body ? w.document.body.textContent : ''; } catch (e2) { txt = ''; }
            var m = txt.match(/([\d][\d,]{2,})\s+reports?\s+match(?:es)?\s+your\s+selection/i);
            if (m) v = parseInt(m[1].replace(/,/g, ''), 10);
          }
        }
      }
    } catch (e3) { v = null; }
    pcCache = { key: sel.key, t: now, v: v };
    return v;
  }

  function sniffMsg(msg) {
    try {
      if (!msg || typeof msg !== 'object') return;
      var acc = { total: null, pri: 0, items: null, corpus: null };
      scanFigures(msg, 0, acc, '', false);
      if (acc.total != null && (corpusN == null || acc.total <= corpusN)) {
        pmNote = { total: acc.total, t: Date.now() };
      }
    } catch (e) {}
  }

  function resolveCount(sel) {
    var i, n, q, nk;
    /* newest answer first; pass 0 wants an exact parameter match, pass 1
       accepts an answer that carries the whole selection plus extras */
    for (var pass = 0; pass < 2; pass++) {
      for (i = apiNotes.length - 1; i >= 0; i--) {
        n = apiNotes[i];
        if (n.total == null) continue;
        if (pass === 0) {
          nk = 0;
          for (q in n.params) {
            if (Object.prototype.hasOwnProperty.call(n.params, q)) nk++;
          }
          if (nk !== sel.n) continue;
        }
        if (noteMatchesSel(n, sel) && (corpusN == null || n.total <= corpusN)) {
          return n.total;
        }
      }
    }
    var pc = parentCount(sel);
    if (pc != null && (corpusN == null || pc <= corpusN) && !digitsInValue(pc, sel)) return pc;
    if (pmNote && pmNote.total != null && Date.now() - pmNote.t < 30000 &&
        (corpusN == null || pmNote.total <= corpusN)) return pmNote.total;
    if (lastClick && lastClick.num != null && Date.now() - lastClick.t < 30000 &&
        !digitsInValue(lastClick.num, sel)) return lastClick.num;
    scanLegend();
    for (i = 0; i < legendRows.length; i++) {
      var r = legendRows[i];
      if (r.num == null) continue;
      for (var k in sel.params) {
        if (sameVal(r.v, sel.params[k]) && !digitsInValue(r.num, sel)) return r.num;
      }
    }
    return null;
  }

  /* which selected parameter the clicked row was naming, so its label can
     stand in the sentence as the clause for that parameter */
  function labelKeyFor(sel) {
    try {
      if (!lastClick || !lastClick.label) return null;
      if (Date.now() - lastClick.t > 25000) return null;
      var before = lastClick.sel || {};
      var keys = Object.keys(sel.params);
      var changed = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (!sameVal(before[k], sel.params[k])) changed.push(k);
        if ((lastClick.zone && sameVal(lastClick.zone, sel.params[k])) ||
            (lastClick.take && sameVal(lastClick.take, sel.params[k]))) {
          return { key: k, label: lastClick.label };
        }
      }
      if (changed.length === 1) return { key: changed[0], label: lastClick.label };
    } catch (e) {}
    return null;
  }

  function buildClause(sel, labKey) {
    var parts = [];
    var keys = Object.keys(sel.params).sort();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var kl = String(k).toLowerCase();
      var v = String(sel.params[k]).replace(/[+_]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!v) continue;
      var piece;
      if (kl === 'zone' || kl === 'take') {
        piece = /^zone\b/i.test(v) ? v : 'zone ' + v;
      } else if (kl === 'q' || kl === 'query' || kl === 'search' || kl === 'text' || kl === 'find') {
        piece = 'search ' + v;
      } else {
        piece = kl + ' ' + v;
      }
      if (labKey && labKey.key === k && labKey.label) {
        var ll = labKey.label.toLowerCase();
        var pl = piece.toLowerCase();
        if (pl.indexOf(ll) === -1) {
          if (ll.indexOf(pl) !== -1) piece = labKey.label;
          else piece = piece + ', ' + labKey.label;
        }
      }
      parts.push(piece);
    }
    return parts.length ? parts.join('; ') : 'the current selection';
  }

  /* when the page has painted a correct selection sentence itself, keep its
     wording and reuse it for the next selection of the same shape */
  function captureTemplate(text, sel) {
    try {
      if (!text || sel.n === 0) return;
      if (lastTpl && lastTpl.key === sel.key) return;
      var count = resolveCount(sel);
      var corpus = corpusN;
      if (count == null || corpus == null || count <= 0 || count >= corpus) return;
      var cStr = gtFmt(count);
      var sStr = gtFmt(corpus - count);
      if (text.indexOf(cStr) === -1 || text.indexOf(sStr) === -1) return;
      var clause = buildClause(sel, null);
      if (!clause || text.indexOf(clause) === -1) return;
      lastTpl = {
        key: sel.key, text: text, count: count, setaside: corpus - count,
        countStr: cStr, setStr: sStr, clauseStr: clause
      };
    } catch (e) {}
  }

  function builtinSentence(count, clause, setaside, corpus) {
    var s = gtFmt(count) + ' reports, ' + clause;
    if (corpus != null && setaside != null) {
      s += ', ' + gtFmt(setaside) + ' of the ' + gtFmt(corpus) + ' set aside';
    } else if (corpus != null) {
      s += ', from the ' + gtFmt(corpus) + ' the file holds';
    }
    return s + '.';
  }

  function composeSentence(sel, count, clause, setaside, corpus) {
    var t = lastTpl;
    if (t && t.count != null) {
      try {
        var clash = false;
        var digits = String(count);
        for (var k in sel.params) {
          if (String(sel.params[k]).replace(/\D/g, '').indexOf(digits) !== -1) clash = true;
        }
        if (!clash) {
          var s = t.text;
          if (t.setStr && setaside != null) s = s.split(t.setStr).join(gtFmt(setaside));
          if (t.countStr) s = s.split(t.countStr).join(gtFmt(count));
          if (t.clauseStr && clause && t.clauseStr !== clause) s = s.split(t.clauseStr).join(clause);
          if (s.indexOf(gtFmt(count)) !== -1) return s;
        }
      } catch (e) {}
    }
    return builtinSentence(count, clause, setaside, corpus);
  }

  function countEl() {
    try { return document.getElementById(COUNT_ID); } catch (e) { return null; }
  }

  function isWholeFileText(t) {
    if (!t) return false;
    if (t.indexOf('everything the FAA has published') !== -1) return true;
    return !!baseSentence && t === baseSentence;
  }

  function knownOtherSentence(text, key) {
    for (var i = 0; i < seenSent.length; i++) {
      if (seenSent[i].text === text && seenSent[i].key !== key) return true;
    }
    return false;
  }

  function rememberSent(key, text) {
    try {
      seenSent.push({ key: key, text: text });
      if (seenSent.length > 12) seenSent.shift();
    } catch (e) {}
  }

  function syncCount(sel) {
    var el = countEl();
    if (!el) return;
    try {
      if (el.hasAttribute('data-gtotal') || el.querySelector('[data-gtotal]')) return;
    } catch (e) {}
    var text = '';
    try { text = (el.textContent || '').replace(/\s+/g, ' ').trim(); } catch (e) { return; }
    if (text && text !== lastWrite) {
      /* the page painted #count itself; learn from it and stand down */
      if (sel.n === 0) {
        baseSentence = text;
        adopted = 'empty';
        rememberSent('empty', text);
      } else if (isWholeFileText(text) || knownOtherSentence(text, sel.key)) {
        adopted = null;   /* the whole file sentence, or a stale one, over a selection */
      } else {
        rememberSent(sel.key, text);
        captureTemplate(text, sel);
        adopted = sel.key;
      }
      lastWrite = text;
    }
    var corpus = corpusN;
    var cur = sel.n === 0 ? 'empty' : sel.key;
    if (adopted === cur && usedCorpus === corpus) return;
    var target = null;
    if (sel.n === 0) {
      if (baseSentence) target = baseSentence;
      else if (corpus != null) target = gtFmt(corpus) + ' reports, ' + WH_CLAUSE;
    } else {
      var count = resolveCount(sel);
      if (count == null) return;   /* no witness yet, keep waiting */
      var labKey = labelKeyFor(sel);
      var clause = buildClause(sel, labKey);
      var setaside = (corpus != null && count <= corpus) ? corpus - count : null;
      target = composeSentence(sel, count, clause, setaside, corpus);
    }
    if (target && target !== text) {
      try { el.textContent = target; } catch (e) { return; }
      lastWrite = target;
      rememberSent(cur, target);
    }
    if (target) {
      adopted = cur;
      usedCorpus = corpus;
    }
  }

  /* ---------- 7. the empty state only while there is nothing to list ---------- */

  var rpCache = { key: null, t: 0, v: false };

  function nrEl() {
    try { return document.getElementById('noRows'); } catch (e) { return null; }
  }

  /* text bearing blocks that are not the empty state, the count line or a bar,
     counted at their innermost level so wrappers do not double them */
  function rowLikeCount(container, skips) {
    if (!container || !container.querySelectorAll) return 0;
    var els;
    try { els = container.querySelectorAll('*'); } catch (e) { return 0; }
    if (!els || els.length > 4000) return 0;
    var cands = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'template' || tag === 'svg') continue;
      var skipHit = false;
      for (var s = 0; s < skips.length; s++) {
        if (skips[s] && (skips[s] === el ||
            (skips[s].contains && skips[s].contains(el)))) { skipHit = true; break; }
      }
      if (skipHit) continue;
      var t = '';
      try { t = (el.textContent || '').trim(); } catch (e2) {}
      if (t.length < 60) continue;
      cands.push(el);
    }
    var n = 0;
    for (var c = 0; c < cands.length; c++) {
      var leaf = true;
      for (var d = 0; d < cands.length; d++) {
        if (c === d) continue;
        if (cands[c].contains(cands[d])) { leaf = false; break; }
      }
      if (leaf) n++;
    }
    return n;
  }

  function rowsPresent(sel) {
    /* an answer that belongs to this selection and carries a row batch is the
       strongest witness, but only while a selection exists, so facet buckets
       can never stand in for rows on an unfiltered page */
    try {
      if (sel.n > 0) {
        for (var i = apiNotes.length - 1; i >= 0; i--) {
          var n = apiNotes[i];
          if (n.items != null && noteMatchesSel(n, sel)) return n.items > 0;
        }
      }
    } catch (e) {}
    var el = nrEl();
    if (!el) return false;
    var now = Date.now();
    if (rpCache.key === sel.key && now - rpCache.t < 300) return rpCache.v;
    var skips = [el];
    try { var c = countEl(); if (c) skips.push(c); } catch (e2) {}
    for (var b = 0; b < barEls.length; b++) skips.push(barEls[b]);
    var cands = [];
    try {
      if (el.parentElement) {
        cands.push(el.parentElement);
        if (el.parentElement.parentElement) cands.push(el.parentElement.parentElement);
      }
      var ids = ['rows', 'results', 'list', 'reports', 'reportRows', 'rowsList', 'dataRows'];
      for (var j = 0; j < ids.length; j++) {
        var x = document.getElementById(ids[j]);
        if (x) cands.push(x);
      }
      var tb = document.querySelector('table tbody');
      if (tb) cands.push(tb);
    } catch (e3) {}
    var best = 0;
    for (var k2 = 0; k2 < cands.length; k2++) {
      var cnt = rowLikeCount(cands[k2], skips);
      if (cnt > best) best = cnt;
    }
    var v = best >= 2;
    rpCache = { key: sel.key, t: now, v: v };
    return v;
  }

  function syncNoRows(sel) {
    var el = nrEl();
    if (!el) return;
    var show;
    try { show = (sel.n === 0 && !rowsPresent(sel)); } catch (e) { return; }
    var hidden = false;
    try { hidden = el.getAttribute('data-nr44') === 'hidden'; } catch (e2) {}
    if (show === !hidden) return;
    try {
      if (!show) {
        el.setAttribute('data-nr44-prev', el.style.display || '');
        el.style.display = 'none';
        el.setAttribute('data-nr44', 'hidden');
      } else {
        el.style.display = el.getAttribute('data-nr44-prev') || '';
        el.removeAttribute('data-nr44');
        el.removeAttribute('data-nr44-prev');
      }
    } catch (e3) {}
  }

  /* ---------- 8. the sticky results bar keeps clear of live controls ---------- */

  var barCheckLast = 0;
  var barEls = [];

  function pageBg(el) {
    try {
      var n = el;
      while (n && n !== document.documentElement) {
        var cs = getComputedStyle(n);
        var c = cs.backgroundColor;
        if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
        n = n.parentElement;
      }
      var b = getComputedStyle(document.body).backgroundColor;
      if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b;
      return getComputedStyle(document.documentElement).backgroundColor || '#ffffff';
    } catch (e) { return '#ffffff'; }
  }

  function pushApart(ctrl, delta) {
    try {
      var t = ctrl.__m44t || null;
      if (!t) {
        t = ctrl;
        if (getComputedStyle(ctrl).display === 'inline') {
          var par = ctrl.parentElement;
          while (par && par !== document.body &&
                 getComputedStyle(par).display === 'inline') {
            par = par.parentElement;
          }
          if (par && par !== document.body && par !== document.documentElement) t = par;
        }
        ctrl.__m44t = t;
        if (t.getAttribute('data-m44') == null) {
          t.setAttribute('data-m44', t.style.marginTop || '');
        }
      }
      var base = parseFloat(t.getAttribute('data-m44')) || 0;
      var applied = parseFloat(t.style.marginTop) || 0;
      var extra = (applied - base) + delta;
      if (extra < 0) extra = 0;
      var next = base + extra;
      if (t.style.marginTop !== next + 'px') t.style.marginTop = next + 'px';
    } catch (e) {}
  }

  function clearPush(ctrl) {
    try {
      var t = ctrl.__m44t;
      if (!t) return;
      var base = t.getAttribute('data-m44');
      t.style.marginTop = base == null ? '' : base;
      try { delete ctrl.__m44t; } catch (e2) {}
    } catch (e) {}
  }

  function keepBarClear() {
    var now = Date.now();
    if (now - barCheckLast < 1200) return;
    barCheckLast = now;
    var region = null, rr = null;
    var nr = nrEl();
    try { if (nr && nr.parentElement) region = nr.parentElement; } catch (e) {}
    var bars = [];
    barEls = [];
    try {
      var all = document.body ? document.body.querySelectorAll('*') : [];
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var cs;
        try { cs = getComputedStyle(el); } catch (e2) { continue; }
        var p = cs.position;
        if (p !== 'fixed' && p !== 'sticky') continue;
        var r = el.getBoundingClientRect();
        if (!r.width || r.height < 8 || r.height > 240) continue;
        bars.push({ el: el, r: r });
        barEls.push(el);
      }
    } catch (e3) {}
    /* an opaque face so content passing underneath is covered, never struck
       through by the bar's rule at any scroll position */
    try {
      if (region) {
        rr = region.getBoundingClientRect();
        for (var b = 0; b < bars.length; b++) {
          var bar = bars[b];
          if (bar.r.top < rr.bottom && bar.r.bottom > rr.top) {
            var cs2 = getComputedStyle(bar.el);
            var bg = cs2.backgroundColor || '';
            if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
              bar.el.style.backgroundColor = pageBg(bar.el);
            }
          }
        }
      }
    } catch (e4) {}
    /* at rest only: push live controls in the results region out of the box */
    try {
      if ((window.pageYOffset || 0) > 4 || (document.documentElement.scrollTop || 0) > 4) return;
      if (!region || !bars.length) return;
      var ctrls = region.querySelectorAll('a, button, input, select, textarea, summary, [role="button"], [data-take]');
      for (var j = 0; j < ctrls.length; j++) {
        var c = ctrls[j];
        var rc;
        try { rc = c.getBoundingClientRect(); } catch (e5) { continue; }
        if (!rc.width || !rc.height) { clearPush(c); continue; }
        var inside = false, hit = null;
        for (var b2 = 0; b2 < bars.length; b2++) {
          var be = bars[b2].el;
          if (be === c || be.contains(c)) { inside = true; break; }
          var rb = be.getBoundingClientRect();
          if (rc.top < rb.bottom - 2 && rc.bottom > rb.top + 2) { hit = rb; break; }
        }
        if (inside) continue;
        if (!hit) { clearPush(c); continue; }
        var delta = hit.bottom + 8 - rc.top;
        if (delta > 4 || delta < -8) pushApart(c, delta);
      }
    } catch (e6) {}
  }

  /* ---------- selection watching: clicks, URL, messages ---------- */

  function onClickCapture(ev) {
    try {
      var t = ev && ev.target;
      if (!t || t.nodeType !== 1) return;
      var el = t;
      if (el.closest) {
        el = t.closest('[data-take], [data-zone], a, button, [role="button"], input, summary, li, tr') || t;
      }
      lastClick = {
        t: Date.now(),
        label: labelOf(el),
        zone: el.getAttribute ? (el.getAttribute('data-zone') || '') : '',
        take: el.getAttribute ? (el.getAttribute('data-take') || '') : '',
        num: rowNumber(el),
        sel: currentSelParams()
      };
    } catch (e) {}
    try { nudge(); } catch (e2) {}
  }

  function onUrlSoon() { try { nudge(); } catch (e) {} }

  try {
    var ps44 = history.pushState;
    var rs44 = history.replaceState;
    if (ps44) history.pushState = function () {
      var r = ps44.apply(this, arguments);
      try { onUrlSoon(); } catch (e) {}
      return r;
    };
    if (rs44) history.replaceState = function () {
      var r = rs44.apply(this, arguments);
      try { onUrlSoon(); } catch (e) {}
      return r;
    };
  } catch (e) {}

  try {
    window.addEventListener('popstate', onUrlSoon);
    window.addEventListener('hashchange', onUrlSoon);
  } catch (e) {}

  try {
    window.addEventListener('message', function (ev) {
      try { sniffMsg(ev && ev.data); } catch (e) {}
      try { onUrlSoon(); } catch (e2) {}
    });
  } catch (e) {}

  /* the rebuild reports each selection to the parent, and the parent's count
     line is the witness for the selection's count; listen on the way out too */
  try {
    if (window.parent && window.parent !== window && !window.parent.__zPm44) {
      var pw44 = window.parent;
      var opm44 = pw44.postMessage;
      if (typeof opm44 === 'function') {
        pw44.postMessage = function (msg) {
          try { sniffMsg(msg); } catch (e) {}
          return opm44.apply(this, arguments);
        };
        try { window.parent.__zPm44 = true; } catch (e2) {}
      }
    }
  } catch (e) {}

  try {
    if (document.addEventListener) {
      document.addEventListener('click', onClickCapture, true);
    }
  } catch (e) {}

  /* ---------- scheduling ---------- */

  var syncLast = 0;
  var syncPending = false;

  function syncAll() {
    var now = Date.now();
    if (now - syncLast < 120) {
      if (!syncPending) {
        syncPending = true;
        setTimeout(function () {
          syncPending = false;
          try { syncAll(); } catch (e) {}
        }, 140);
      }
      return;
    }
    syncLast = now;
    var sel = readSel();
    try { keepBarClear(); } catch (e) {}
    try { syncCount(sel); } catch (e2) {}
    try { syncNoRows(sel); } catch (e3) {}
  }

  var NUDGE_STEPS = [40, 350, 900, 2000, 4200];

  function nudge() {
    for (var i = 0; i < NUDGE_STEPS.length; i++) {
      (function (ms) {
        setTimeout(function () { try { syncAll(); } catch (e) {} }, ms);
      })(NUDGE_STEPS[i]);
    }
  }

  /* ---------- background and scheduling ---------- */

  function syncBg() {
    try {
      var b = document.body;
      if (!b) return;
      var cs = getComputedStyle(b);
      var r = document.documentElement;
      r.style.backgroundColor = cs.backgroundColor;
      r.style.backgroundImage = cs.backgroundImage;
      r.style.backgroundRepeat = cs.backgroundRepeat;
      r.style.backgroundPosition = cs.backgroundPosition;
      r.style.backgroundSize = cs.backgroundSize;
      r.style.backgroundAttachment = cs.backgroundAttachment;
    } catch (e) {}
  }

  var busy = 0;
  function backstop() {
    if (busy) return;
    busy = 1;
    setTimeout(function () {
      busy = 0;
      try { enforceAimOnce(); } catch (e) {}
      try { sweep(); } catch (e) {}
      try { tapFix(document); } catch (e) {}
      try { patchRows(document); } catch (e) {}
      try { tryGlobals(); } catch (e) {}
      try { writeGtotal(); } catch (e) {}
      try { syncBg(); } catch (e) {}
      try { syncAll(); } catch (e) {}
    }, 80);
  }

  var mo = null;
  try {
    mo = new MutationObserver(function () { backstop(); });
  } catch (e) {}

  function start() {
    try { enforceAimOnce(); } catch (e) {}
    try { sweep(); } catch (e) {}
    try { tapFix(document); } catch (e) {}
    try { patchRows(document); } catch (e) {}
    try { gtPoll(); } catch (e) {}
    try { syncBg(); } catch (e) {}
    try { syncAll(); } catch (e) {}
    setTimeout(function () { try { syncAll(); } catch (e) {} }, 600);
    setTimeout(function () { try { syncAll(); } catch (e) {} }, 1500);
    setTimeout(function () { try { syncAll(); } catch (e) {} }, 3000);
    if (mo) {
      try {
        mo.observe(document.documentElement || document, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', backstop);
  setTimeout(backstop, 400);
  setTimeout(backstop, 1200);
})();
```