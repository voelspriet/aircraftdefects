Read back as measured, not as intended: the wrappers were sound, the wiring was not. This block drops the parallel dialog entirely and repairs the page's own one in place. The page's `openCase` and `closeCase` stay the engine; they are only wrapped additively so focus, inert repair and scroll happen on the same state the page already owns, so nothing can drift. No em dash and no en dash anywhere below.

```js
/* block 42: repair the page's own case sheet in place, dedupe ids,
   keep hover from moving layout. The page's openCase / closeCase
   stay the engine; this only repairs what is wrong around them. */
(function(){
  'use strict';

  var D = document;
  function byId(id){ return D.getElementById(id); }
  function caseBox(){ return byId('case-box'); }
  function caseWrap(){ return byId('case-wrap'); }
  function isOpen(){
    var b = caseBox();
    return !!(b && b.classList && b.classList.contains('open'));
  }
  function inSheet(el){
    var b = caseBox();
    return !!(b && el && el !== b && b.contains(el));
  }

  /* ---- 1. nothing that contains the sheet may stay inert ----
     The page captured #case-box before it was re-parented, so its
     exemption misses and the sheet container gets inerted. That
     kills hit-testing: Close, scroll and focus all die. Escape
     survives because document capture keydown is not hit-tested.
     Fix: any element marked inert that contains the sheet or its
     overlay loses that flag at once. MAIN.wrap never contains the
     sheet, so it keeps its flag and the page behind stays inert. */
  function coversSheet(el){
    if(!el || el.nodeType !== 1) return false;
    var b = caseBox(), w = caseWrap();
    if(el === b || el === w) return true;
    if(b && el.contains(b)) return true;
    if(w && el.contains(w)) return true;
    return false;
  }
  function clearSheetInert(){
    var bad = D.querySelectorAll('[inert]');
    for(var i = 0; i < bad.length; i++){
      if(coversSheet(bad[i])) bad[i].removeAttribute('inert');
    }
  }
  try{
    new MutationObserver(function(recs){
      for(var i = 0; i < recs.length; i++){
        var r = recs[i];
        if(r.type === 'attributes' && r.attributeName === 'inert' &&
           r.target && r.target.hasAttribute && r.target.hasAttribute('inert') &&
           coversSheet(r.target)){
          r.target.removeAttribute('inert');
        }
      }
    }).observe(D.documentElement, {subtree:true, attributes:true, attributeFilter:['inert']});
  }catch(e){}

  /* ---- 2. focus: into the sheet on open, back to the opener on
     close, Tab stays inside while it is open ---- */
  var lastOpener = null, clickOpener = null, clickAt = 0, openWatch = null;

  function focusablesIn(el){
    var sel = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
              'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    var list = el.querySelectorAll(sel), out = [];
    for(var i = 0; i < list.length; i++){
      var n = list[i], vis;
      if(typeof n.checkVisibility === 'function') vis = n.checkVisibility();
      else vis = (n.offsetParent !== null) || (getComputedStyle(n).position === 'fixed');
      if(vis) out.push(n);
    }
    return out;
  }
  function pickOpener(pre){
    if(pre && pre.nodeType === 1 && !inSheet(pre) && pre !== D.body) return pre;
    var ae = D.activeElement;
    if(ae && ae !== D.body && !inSheet(ae)) return ae;
    if(clickOpener && (Date.now() - clickAt) < 2000 && D.contains(clickOpener)) return clickOpener;
    return null;
  }
  function focusSheet(){
    var b = caseBox(); if(!b) return;
    clearSheetInert();
    if(inSheet(D.activeElement)) return;
    b.setAttribute('tabindex', '-1');
    var f = focusablesIn(b), tries = 0;
    (function step(){
      clearSheetInert();
      if(inSheet(D.activeElement)) return;
      if(!f.length) f = focusablesIn(b);
      var t = f.length ? f[0] : b;
      try{ t.focus({preventScroll:true}); }catch(e){ try{ t.focus(); }catch(e2){} }
      if(!inSheet(D.activeElement) && ++tries < 12) requestAnimationFrame(step);
    })();
  }
  function restoreFocus(){
    var el = lastOpener; lastOpener = null;
    if(!el || !D.contains(el)) return;
    var tries = 0;
    (function step(){
      if(!D.contains(el)) return;
      var n = el, blocked = false;
      while(n){ if(n.inert){ blocked = true; break; } n = n.parentElement; }
      if(!blocked){ try{ el.focus(); }catch(e){} return; }
      /* opener sits behind MAIN.wrap until the page clears inert */
      if(++tries < 60) requestAnimationFrame(step);
    })();
  }
  function afterOpen(pre){
    var op = pickOpener(pre);
    if(op) lastOpener = op;
    clearSheetInert();
    ensureScrollable();
    var b = caseBox();
    if(b){ snapAllIn(b); requestAnimationFrame(function(){ snapAllIn(b); }); }
    focusSheet();
    if(!openWatch){
      openWatch = setInterval(function(){
        if(!isOpen()){ clearInterval(openWatch); openWatch = null; restoreFocus(); return; }
        clearSheetInert();
      }, 200);
    }
  }
  function afterClose(){
    if(openWatch){ clearInterval(openWatch); openWatch = null; }
    restoreFocus();
  }

  /* additive wrappers: the page's own functions do all the work */
  try{
    if(typeof window.openCase === 'function' && !window.openCase.__b42){
      var origOpen = window.openCase;
      var openB42 = function(){
        var pre = D.activeElement;
        var r = origOpen.apply(this, arguments);
        afterOpen(pre);
        return r;
      };
      openB42.__b42 = true;
      window.openCase = openB42;
    }
  }catch(e){}
  try{
    if(typeof window.closeCase === 'function' && !window.closeCase.__b42){
      var origClose = window.closeCase;
      var closeB42 = function(){
        var r = origClose.apply(this, arguments);
        afterClose();
        return r;
      };
      closeB42.__b42 = true;
      window.closeCase = closeB42;
    }
  }catch(e){}

  /* class watcher catches the page's internal open and close paths too */
  try{
    var wasOpen = isOpen();
    var co = new MutationObserver(function(){
      var o = isOpen();
      if(o && !wasOpen) afterOpen(null);
      else if(!o && wasOpen) afterClose();
      wasOpen = o;
    });
    var hooked = false;
    function hookClassWatch(){
      var b = caseBox();
      if(b && !hooked){ co.observe(b, {attributes:true, attributeFilter:['class']}); hooked = true; }
      return hooked;
    }
    if(!hookClassWatch()){
      new MutationObserver(function(muts, obs){
        if(hookClassWatch()){
          obs.disconnect();
          if(isOpen()) afterOpen(null);
        }
      }).observe(D.documentElement, {subtree:true, childList:true});
    }
  }catch(e){}

  /* fallback opener for browsers that do not focus buttons on click */
  D.addEventListener('click', function(e){
    var t = e.target;
    if(t && t.closest){
      var c = t.closest('button,[role="button"],a,[onclick]');
      if(c){ clickOpener = c; clickAt = Date.now(); }
    }
  }, true);

  /* Tab stays inside the open sheet */
  D.addEventListener('keydown', function(e){
    if(e.key !== 'Tab' || !isOpen()) return;
    var b = caseBox(); if(!b) return;
    var f = focusablesIn(b);
    if(!f.length){ e.preventDefault(); b.focus(); return; }
    var first = f[0], last = f[f.length - 1], ae = D.activeElement;
    if(!b.contains(ae)){ e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if(e.shiftKey && ae === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && ae === last){ e.preventDefault(); first.focus(); }
  }, true);

  /* ---- 3. the wheel scrolls the sheet, never the page behind it ----
     Scroll the wrap by hand and cancel the default, so window.scrollY
     cannot move while the sheet is under the pointer. */
  function ensureScrollable(){
    var w = caseWrap(); if(!w) return;
    var cs = getComputedStyle(w);
    if(cs.position === 'fixed' || cs.position === 'absolute'){
      if(!w.style.maxHeight) w.style.maxHeight = '100vh';
    }
    if(cs.overflowY === 'visible' || cs.overflowY === 'hidden'){
      w.style.overflowY = 'auto';
    }
  }
  D.addEventListener('wheel', function(e){
    var w = caseWrap(); if(!w) return;
    var t = e.target;
    if(!(t === w || (t.nodeType === 1 && w.contains(t)))) return;
    e.preventDefault();
    var mult = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? (w.clientHeight || 400) : 1);
    w.scrollTop += e.deltaY * mult;
  }, {passive:false, capture:true});

  /* ---- 4. one id each: tip, iAim. Keep the first in document order
     (the one an id lookup and the instrument's captured reference
     point at), rename any later copy and record it in data-old-id
     so it can be flipped in one line if ever needed. ---- */
  function dedupeId(id){
    var list = D.querySelectorAll('[id="' + id + '"]');
    for(var i = 1; i < list.length; i++){
      var el = list[i], k = 2, nid = id + '-2';
      while(D.getElementById(nid)) nid = id + '-' + (++k);
      el.setAttribute('data-old-id', id);
      el.id = nid;
    }
  }
  function dedupeIds(){ dedupeId('tip'); dedupeId('iAim'); }
  dedupeIds();
  window.addEventListener('load', dedupeIds);
  var ddQueued = false;
  try{
    new MutationObserver(function(){
      if(ddQueued) return; ddQueued = true;
      requestAnimationFrame(function(){ ddQueued = false; dedupeIds(); });
    }).observe(D.documentElement, {subtree:true, childList:true});
  }catch(e){}

  /* ---- 5. hover must not move layout: while an element or any
     ancestor is hovered, pin its resting geometry with !important,
     set synchronously in pointerover so no frame paints shifted ---- */
  var HOVER_SEL = 'button,a,input,select,textarea,label,summary,' +
                  '[role="button"],[onclick],tr,td,th,li';
  var GEO = ['padding-top','padding-right','padding-bottom','padding-left',
             'margin-top','margin-right','margin-bottom','margin-left',
             'border-top-width','border-right-width','border-bottom-width','border-left-width',
             'font-size','font-weight','line-height','letter-spacing'];
  var base = new Map(), pins = new Map(), chain = [], tickQueued = 0;

  function snapGeo(el){
    if(!el || el.nodeType !== 1 || el === D.documentElement || el === D.body) return;
    if(base.has(el)) return;
    var cs = getComputedStyle(el), o = {};
    for(var i = 0; i < GEO.length; i++) o[GEO[i]] = cs.getPropertyValue(GEO[i]);
    base.set(el, o);
  }
  function snapAllIn(root){
    if(!root || root.nodeType !== 1) return;
    var list = [root], i;
    if(root.querySelectorAll) list = list.concat([].slice.call(root.querySelectorAll('*')));
    for(i = 0; i < list.length; i++){ base.delete(list[i]); snapGeo(list[i]); }
  }
  function snapSubtree(root){
    if(!root || root.nodeType !== 1) return;
    if(typeof root.matches === 'function' && root.matches(HOVER_SEL)) snapGeo(root);
    if(root.querySelectorAll){
      var l = root.querySelectorAll(HOVER_SEL);
      for(var i = 0; i < l.length; i++) snapGeo(l[i]);
    }
  }
  function initialSnap(){
    var l = D.querySelectorAll(HOVER_SEL), i = 0;
    (function chunk(){
      var end = Math.min(i + 120, l.length);
      for(; i < end; i++) snapGeo(l[i]);
      if(i < l.length) requestAnimationFrame(chunk);
    })();
  }
  function unpin(el){
    var p = pins.get(el); if(!p) return;
    for(var k in p){
      var prev = p[k][0], prio = p[k][1];
      if(prio) el.style.setProperty(k, prev, prio);
      else if(prev) el.style.setProperty(k, prev);
      else el.style.removeProperty(k);
    }
    pins.delete(el);
    requestAnimationFrame(function(){ base.delete(el); snapGeo(el); });
  }
  function pinEl(el){
    var b = base.get(el);
    if(!b) return; /* never snapshotted at rest, do not guess */
    var cs = getComputedStyle(el), p = pins.get(el);
    if(!p){ p = {}; pins.set(el, p); }
    for(var i = 0; i < GEO.length; i++){
      var k = GEO[i], v = cs.getPropertyValue(k);
      if(v !== b[k]){
        if(!(k in p)) p[k] = [el.style.getPropertyValue(k), el.style.getPropertyPriority(k)];
        el.style.setProperty(k, b[k], 'important');
      }
    }
  }
  function tick(){
    tickQueued = 0;
    for(var i = 0; i < chain.length; i++) pinEl(chain[i]);
    pins.forEach(function(p, el){ if(chain.indexOf(el) === -1) unpin(el); });
  }
  function queueTick(){
    if(tickQueued) return;
    tickQueued = requestAnimationFrame(tick);
  }
  D.addEventListener('pointerover', function(e){
    var t = e.target;
    if(!t || t.nodeType !== 1) return;
    var c = [], n = t;
    while(n && n !== D.documentElement){ c.push(n); n = n.parentElement; }
    chain = c;
    for(var i = 0; i < c.length; i++) pinEl(c[i]); /* before first hover paint */
    queueTick();
  }, true);
  D.addEventListener('pointerout', function(e){
    if(!e.relatedTarget){ chain = []; queueTick(); }
  }, true);
  try{
    new MutationObserver(function(muts){
      for(var i = 0; i < muts.length; i++){
        var a = muts[i].addedNodes;
        for(var j = 0; j < a.length; j++) snapSubtree(a[j]);
      }
    }).observe(D.documentElement, {subtree:true, childList:true});
  }catch(e){}

  /* ---- start ---- */
  ensureScrollable();
  initialSnap();
  window.addEventListener('load', initialSnap);
  if(isOpen()) afterOpen(null);
})();
```

```css
/* block 42: additive only, nothing here strips the page's own styles.
   No em dash and no en dash. */
#case-wrap{
  overflow-y: auto;
  overscroll-behavior: contain;
  max-height: 100vh;
}
#case-box{
  overscroll-behavior: contain;
}
#tip{
  pointer-events: none;
}
html, body{
  overflow-x: hidden;
  overflow-x: clip;
}
img, video, canvas, iframe, embed, object{
  max-width: 100%;
}
:focus-visible{
  outline: 2px solid #2f6fdb !important;
  outline-offset: 2px !important;
}
```

What this does against the eight failing checks:

- Inert ancestor: the attribute observer strips `inert` from any element that contains `#case-box` or `#case-wrap`, the instant it is set, plus a belt of `clearSheetInert()` on open, during the focus retry loop, and on a 200 ms watch while open. `MAIN.wrap` never contains the sheet, so it stays inert and the page behind stays dead.
- Close at its own centre: with the false inert gone, hit-testing comes back, so `elementFromPoint` returns the button and a real click closes the sheet.
- Focus: the additive wrappers fire after the page's own `openCase` and `closeCase`, and a class watcher on `#case-box` catches the page's internal paths. Open moves focus to the first focusable inside, close returns it to the opener once the page has cleared inert (it polls up to sixty frames for that). Tab wraps inside the sheet.
- Wheel: scroll is applied to `#case-wrap` by hand with `preventDefault`, so `case-wrap.scrollTop` moves and `window.scrollY` cannot.
- `#iAim`: first in document order keeps the id, later copies are renamed to `iAim-2` and recorded in `data-old-id`; same guard re-runs for `#tip` and on any future injection. If the aim line turns out to read the renamed node, flip which copy survives by matching `data-old-id`.
- The eight passing checks are untouched: no inert flag is ever added by this code, Escape is the page's own document capture listener and is not intercepted, the focus ring is only reinforced, and the overflow-x clamp stays.

One honest caveat: the hover guard cannot protect an element it never saw at rest, so it pins only elements snapshotted before hover, re-snapshots the sheet's subtree on every open, and re-snapshots on un-hover. That covers the :hover geometry class of shift without guessing.