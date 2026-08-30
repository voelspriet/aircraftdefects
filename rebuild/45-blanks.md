```python
@app.get("/z/api/repeats/<tail>")
def repeats(tail):
    """The same system written up more than once on one airframe, with the hours
    between. Whether that is a repeat finding or two unrelated events is for a
    reader to judge, so both are shown and neither is labelled. When the hours
    between cannot be shown, the note on the group says why: either the file's
    own readings contradict each other, or the file recorded no airframe hours
    on one or more of the reports. The two reasons are different facts about
    the data, so each gets its own sentence, and hours_between stays None in
    both. A group is never dropped for either reason."""
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    rows = [decorate(r) for r in (api("/api/aircraft/" + t).get("rows") or [])]
    groups = defaultdict(list)
    for r in rows:
        k = (r["system_code"] or "") + "|" + (r["part"] or "")
        if k.strip("|"):
            groups[k].append(r)

    def hours_of(x):
        """The airframe hours as the file records them, or None when it records
        none on that report. Zero counts: it is a real reading."""
        v = x.get("hours")
        if v is None:
            return None
        s = str(v).strip()
        return int(s) if s.isdigit() else None

    out = []
    for k, g in groups.items():
        if len(g) < 2:
            continue
        dated = [r for r in g if _parse_date(r["date"])]
        undated = [r for r in g if not _parse_date(r["date"])]
        dated.sort(key=lambda x: _parse_date(x["date"]))
        g = dated + undated
        vals = []
        missing = False
        for x in g:
            v = hours_of(x)
            if v is None:
                missing = True
            else:
                vals.append(v)
        hours_between = None
        note = None
        if any(b < a for a, b in zip(vals, vals[1:])):
            # the file contradicts itself: one fact about the FAA's data
            note = ("The file's own hour readings do not agree: a later report "
                    "records fewer total airframe hours than an earlier one, so the "
                    "hours between first and last cannot be shown here.")
        elif len(vals) > 1:
            # recorded and agreeing, so the number stands, zero included
            hours_between = vals[-1] - vals[0]
        elif missing:
            # the file recorded no hours on one or more reports: another fact
            note = ("The file does not record total airframe hours on one or more "
                    "of these reports, so the hours between first and last cannot "
                    "be shown here.")
        out.append({"system": g[0]["system"], "part": g[0]["part"], "times": len(g),
                    "first": dated[0]["date"] if dated else None,
                    "last": dated[-1]["date"] if dated else None,
                    "hours_between": hours_between,
                    "ids": [x["id"] for x in g], "records": g, "note": note})
    out.sort(key=lambda x: -x["times"])
    return jsonify(tail="N" + t, groups=out,
                   note="Written up more than once on this airframe. The file does not say "
                        "whether a later report is the same finding returning or a new one.")
```

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

  /* The repeats view now sends a note with every group whose hours_between is
     null, and the two causes carry two different notes. The rows themselves
     are drawn elsewhere in the page, so this block meets them twice: it reads
     the notes as they come back over the network, and when a rendered row
     shows the bare phrase with no number in front of it, it swaps the phrase
     for the short reason that matches the note. Both reasons are the file's
     own limitation, never the tool's, and a figure that is present stands
     untouched, zero included. */

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

  /* the short line tracks the note the view sent, one cause per note */
  function shortReason(note) {
    var n = normTxt(note);
    if (n.indexOf('do not agree') !== -1) return REASON_DISAGREE;
    if (n.indexOf('does not record') !== -1) return REASON_NO_HOURS;
    return null;
  }

  /* match a rendered row to its group by what the row itself shows */
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
      /* rows patched with the fallback reason can now be done properly */
      var stale = document.querySelectorAll('[' + FLAG + '="fallback"]');
      for (var j = 0; j < stale.length; j++) {
        restoreFallback(stale[j]);
        try { stale[j].removeAttribute(FLAG); } catch (e) {}
      }
      backstop();
    } catch (e) {}
  }

  /* read the notes however the page asks for them */
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
          if (url.indexOf(REPEATS_PATH) !== -1 && p && typeof p.then === 'function') {
            p.then(function (res) {
              try {
                if (res && typeof res.clone === 'function') {
                  res.clone().json().then(takeGroups).catch(function () {});
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
          if (String(url || '').indexOf(REPEATS_PATH) !== -1) {
            xhr.addEventListener('load', function () {
              try { takeGroups(JSON.parse(xhr.responseText)); } catch (e) {}
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
      /* if the view's own full note is already on the page, leave it alone */
      if (node.nodeValue.indexOf('cannot be shown') !== -1) return;
    } catch (e) { return; }
    var el = node.parentElement;
    if (!el) return;
    /* climb to the row, the smallest ancestor that talks about write-ups */
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
    /* a bare number right in front of the phrase means the figure stands,
       and 0 is a figure: both write-ups at the same airframe hours */
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
})();
```