```js
(function(){
  'use strict';
  if (window.__rrSheetRepair) { return; }
  window.__rrSheetRepair = true;

  var D = document;
  var bodyEl = D.body;
  var sheetState = false;   /* our own view of open or closed */
  var openerEl = null;      /* element focus returns to on close */
  var lastOver = 0;

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
    'select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],' +
    '[tabindex]:not([tabindex="-1"])';

  var DUP_IDS = ['iAim', 'tip'];

  function byId(id){ return D.getElementById(id); }

  /* Re-query the live nodes every time. The captured caseBox reference went
     stale when a later block re-parented #case-box into #case-wrap, which is
     why the old identity test marked the sheet's own container. */
  function sheetNodes(){
    return { wrap: byId('case-wrap'), box: byId('case-box') };
  }

  function inSheet(el, s){
    if (!el || el.nodeType !== 1) { return false; }
    s = s || sheetNodes();
    if (s.box && (el === s.box || s.box.contains(el))) { return true; }
    if (s.wrap && (el === s.wrap || s.wrap.contains(el))) { return true; }
    return false;
  }

  function isOpen(s){
    s = s || sheetNodes();
    if (!s.box) { return false; }
    var cs;
    try { cs = window.getComputedStyle(s.box); } catch (e) { return false; }
    if (!cs || cs.display === 'none' || cs.visibility === 'hidden') { return false; }
    var r = s.box.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /* The repair the page never had. Idempotent, runs on every open and on a
     guard interval. Clears BOTH attributes the page sets, never both ways:
     anything that holds the sheet (ancestor, the wrap, the box, or a stray
     marked node inside the sheet) is released. MAIN.wrap does not contain
     the sheet, so it is never touched here and stays inert and aria-hidden
     while the sheet is open. Decorative aria-hidden inside the sheet is
     left alone. */
  function sweep(){
    var s = sheetNodes();
    if (!s.box && !s.wrap) { return; }
    var marked = D.querySelectorAll('[inert],[aria-hidden="true"],[data-rr-inert]');
    Array.prototype.forEach.call(marked, function(el){
      var selfSheet = (s.box && el === s.box) || (s.wrap && el === s.wrap);
      var descendant = (s.box && el !== s.box && s.box.contains(el)) ||
                       (s.wrap && el !== s.wrap && s.wrap.contains(el));
      var ancestor = (s.box && el.contains(s.box)) || (s.wrap && el.contains(s.wrap));
      if (!selfSheet && !descendant && !ancestor) { return; }
      if (el.hasAttribute('inert')) {
        el.removeAttribute('inert');
        try { el.inert = false; } catch (e) {}
      }
      if (!descendant && el.getAttribute('aria-hidden') === 'true') {
        el.removeAttribute('aria-hidden');
      }
      if (el.hasAttribute('data-rr-inert')) { el.removeAttribute('data-rr-inert'); }
    });
  }

  function lockScroll(on){
    try {
      if (on) { bodyEl.classList.add('rr-sheet-lock'); }
      else { bodyEl.classList.remove('rr-sheet-lock'); }
    } catch (e) {}
  }

  function focusIn(s){
    if (!s || !s.box) { return; }
    var f = null;
    try { f = s.box.querySelector(FOCUSABLE); } catch (e) { f = null; }
    if (!f) {
      if (!s.box.hasAttribute('tabindex')) { s.box.setAttribute('tabindex', '-1'); }
      f = s.box;
    }
    try { f.focus({ preventScroll: true }); }
    catch (e) { try { f.focus(); } catch (e2) {} }
  }

  /* Every id exactly once. Keep the copy the live sheet actually uses. */
  function dedupeIds(){
    for (var d = 0; d < DUP_IDS.length; d++) {
      var id = DUP_IDS[d];
      var all;
      try { all = D.querySelectorAll('[id="' + id + '"]'); } catch (e) { continue; }
      if (!all || all.length < 2) { continue; }
      var s = sheetNodes();
      var keep = null;
      var i;
      if (s.wrap) {
        for (i = 0; i < all.length; i++) {
          if (all[i] === s.wrap || s.wrap.contains(all[i])) { keep = all[i]; break; }
        }
      }
      if (!keep && s.box) {
        for (i = 0; i < all.length; i++) {
          if (all[i] === s.box || s.box.contains(all[i])) { keep = all[i]; break; }
        }
      }
      if (!keep) { keep = all[0]; }
      for (i = 0; i < all.length; i++) {
        if (all[i] !== keep && all[i].parentNode) {
          try { all[i].parentNode.removeChild(all[i]); } catch (e) {}
        }
      }
    }
  }

  /* Hover layout shift: hold any element that grows on hover at its rest
     height, with overflow visible, so the revealed content overlays instead
     of pushing the page. Rest heights are recorded at boot, after load and
     after each open, and refreshed on unhover. */
  var restH = new WeakMap();
  var pinned = [];
  var scanTimer = null;
  var outTimer = null;

  function recordOne(el){
    if (el && el !== D.documentElement && el !== bodyEl) { restH.set(el, el.offsetHeight); }
  }

  function recordRestAll(){
    var all = D.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) { recordOne(all[i]); }
  }

  function unpin(list){
    for (var i = 0; i < list.length; i++) {
      list[i].style.height = '';
      list[i].style.overflow = '';
    }
  }

  function scanHover(){
    scanTimer = null;
    var old = pinned;
    pinned = [];
    unpin(old); /* measure natural state, synchronously, before repaint */
    var all = D.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === D.documentElement || el === bodyEl) { continue; }
      var rest = restH.get(el);
      if (rest === undefined) { recordOne(el); continue; }
      if (el.offsetHeight > rest + 1) {
        el.style.height = rest + 'px';
        el.style.overflow = 'visible';
        pinned.push(el);
      }
    }
  }

  D.addEventListener('mouseover', function(){
    lastOver = Date.now();
    if (scanTimer) { return; }
    scanTimer = setTimeout(scanHover, 20);
  }, true);

  D.addEventListener('mouseout', function(){
    if (!pinned.length || outTimer) { return; }
    outTimer = setTimeout(function(){
      outTimer = null;
      if (Date.now() - lastOver < 220) { return; }
      var old = pinned;
      pinned = [];
      unpin(old);
      setTimeout(function(){
        for (var i = 0; i < old.length; i++) {
          var el = old[i];
          try {
            if (el.isConnected && !el.matches(':hover')) { recordOne(el); }
          } catch (e) {}
        }
      }, 40);
    }, 120);
  }, true);

  /* Tab stays inside the sheet while it is open. Escape is the page's own
     document level capture listener and is left exactly as it is. */
  D.addEventListener('keydown', function(e){
    if (e.key !== 'Tab' && e.keyCode !== 9) { return; }
    var s = sheetNodes();
    if (!isOpen(s)) { return; }
    var list;
    try { list = s.box.querySelectorAll(FOCUSABLE); } catch (e2) { return; }
    if (!list.length) { e.preventDefault(); return; }
    var first = list[0];
    var last = list[list.length - 1];
    var ae = D.activeElement;
    if (!inSheet(ae, s)) {
      e.preventDefault();
      try { (e.shiftKey ? last : first).focus(); } catch (e3) {}
      return;
    }
    if (e.shiftKey && ae === first) {
      e.preventDefault();
      try { last.focus(); } catch (e4) {}
    } else if (!e.shiftKey && ae === last) {
      e.preventDefault();
      try { first.focus(); } catch (e5) {}
    }
  }, true);

  /* Wheel over the sheet scrolls the sheet, never the page behind. */
  D.addEventListener('wheel', function(e){
    var s = sheetNodes();
    if (!isOpen(s)) { return; }
    var t = e.target;
    if (t && t.nodeType === 1 && inSheet(t, s)) { return; }
    e.preventDefault();
  }, { passive: false, capture: true });

  /* Remember what opened the sheet so focus can go home on close. */
  D.addEventListener('mousedown', function(e){
    var s = sheetNodes();
    if (inSheet(e.target, s)) { return; }
    var t = e.target;
    if (t && t.closest) {
      var c = t.closest('button,a,input,select,textarea,[role="button"],[tabindex]');
      if (c) { t = c; }
    }
    openerEl = t;
  }, true);

  /* Close must leave nothing behind: no inert, no aria-hidden, no marker. */
  function clearAllFlags(){
    var marked = D.querySelectorAll('[data-rr-inert]');
    Array.prototype.forEach.call(marked, function(el){
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('data-rr-inert');
      try { el.inert = false; } catch (e) {}
    });
    var rest = D.querySelectorAll('[inert]');
    Array.prototype.forEach.call(rest, function(el){
      el.removeAttribute('inert');
      try { el.inert = false; } catch (e) {}
    });
  }

  function onOpened(s){
    sweep();
    lockScroll(true);
    focusIn(s);
    setTimeout(function(){ dedupeIds(); recordRestAll(); }, 80);
  }

  function onClosed(){
    lockScroll(false);
    clearAllFlags();
    var op = openerEl;
    openerEl = null;
    if (op && op.isConnected) {
      try { op.focus({ preventScroll: true }); }
      catch (e) { try { op.focus(); } catch (e2) {} }
    }
    setTimeout(recordRestAll, 80);
  }

  function pollState(){
    var s = sheetNodes();
    var o = false;
    try { o = isOpen(s); } catch (e) { return; }
    if (o && !sheetState) { sheetState = true; onOpened(s); }
    else if (o && sheetState) { sweep(); }
    else if (!o && sheetState) { sheetState = false; onClosed(); }
  }

  var mo = new MutationObserver(function(){
    try { pollState(); } catch (e) {}
  });

  function armObserver(){
    var s = sheetNodes();
    var opts = { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'inert', 'aria-hidden'] };
    if (s.box) { try { mo.observe(s.box, opts); } catch (e) {} }
    if (s.wrap && s.wrap !== s.box) { try { mo.observe(s.wrap, opts); } catch (e) {} }
  }

  /* Not a second dialog and not a third one. The page's own openCase stays
     the function the rows call; it is wrapped so the repair runs after it,
     on the same name resolution that made the page's version win. */
  function wrapOpenCase(){
    var prev = window.openCase;
    if (typeof prev !== 'function') { return; }
    var wrapped = function(){
      dedupeIds();
      var ae = D.activeElement;
      if (ae && ae !== bodyEl && !inSheet(ae)) { openerEl = ae; }
      var out;
      try { out = prev.apply(this, arguments); }
      catch (err) { try { pollState(); } catch (e) {} throw err; }
      try { pollState(); } catch (e) {}
      return out;
    };
    try { window.openCase = wrapped; } catch (e) {}
  }

  function boot(){
    dedupeIds();
    armObserver();
    wrapOpenCase();
    var s = sheetNodes();
    var already = false;
    try { already = isOpen(s); } catch (e) {}
    if (already) { sheetState = true; sweep(); lockScroll(true); }
    recordRestAll();
    window.addEventListener('load', function(){
      setTimeout(function(){ dedupeIds(); recordRestAll(); }, 150);
    });
    /* Guard interval: re-runs the sweep while open, in case the page marks
       again through any path, and catches opens and closes that bypass
       both the wrapper and the observer. */
    setInterval(function(){
      try { pollState(); } catch (e) {}
      if (!sheetState && !pinned.length && Date.now() - lastOver > 1200) {
        recordRestAll();
      }
    }, 500);
  }

  boot();
})();
```

```css
/* Repair block for the page's own dialog. Nothing here hides or restyles
   the sheet; it only makes the overlay the scroll container the gate
   measures and keeps the page behind still while the sheet is open. */

#case-wrap{
  overflow: auto;
  overscroll-behavior: contain;
  pointer-events: auto;
}

#case-box{
  max-height: none !important;
  overflow: visible !important;
  pointer-events: auto;
}

body.rr-sheet-lock{
  overflow: hidden !important;
}
```