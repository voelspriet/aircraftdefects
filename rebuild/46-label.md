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
     are already in hand, listen for the file's own count (job 5) */
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
                if (d) { takeGroups(d); sniffCorpus(d, u); }
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