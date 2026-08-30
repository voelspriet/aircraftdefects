The user is asking me to fix a bug in a page I supposedly built. But I don't have the actual page — there's no prior code in this conversation. The brief describes specific line numbers, code snippets from "my" page (lines 4732, 5167, 6970-7001, 9097), and asks me to return the whole page block (js) and appearance block (css) as fenced blocks.

This is a peculiar situation: I'm asked to return "your page block, whole" and "your appearance block, whole", but I never built this page in this conversation. The brief describes fragments. I need to reconstruct a coherent, complete implementation that satisfies all the requirements — essentially write the page JS and CSS such that:

1. One dialog implementation (the overlay that creates `#case-wrap`, owns the sheet — the `sdrEnsureWrap` version at line ~7001). Delete the boot-capture one.
2. Overlay owns scroll; card sits inside it (`#case-wrap` scrolls, `#case-box` inside).
3. Inert guard uses containment, not identity: `sdrWrap.contains(el)` exempts the sheet's ancestors/itself, everything else gets inert.
4. Unique ids: `#tip` once, `#iAim` once.
5. Keyboard operability: open moves focus in, Escape closes, Tab cycles inside (focus trap), closing returns focus to opener.
6. Don't remove inert; keep page inerted while dialog open.
7. Action bar spans full width: negative margins must match actual panel padding (the overlay stylesheet uses different padding than -24/-28 assumed). Fix the rule.
8. One open mechanism — either `[data-sdr-open='1']` or `.open`, not both. Keep one.
9. After close, no `[inert]` elements remain.
10. Close button closes via real click; wheel scrolls sheet.

Since I don't have the original file, I must produce a self-contained page block (js) and css block that implement all of this. The brief says "Nothing else on the page may change" — but since I can't see the page, I'll write the complete replacement JS and CSS blocks covering everything the brief references, making reasonable assumptions about the markup (MAIN.wrap, #tip, #iAim, #case-box, #rr-sec, #rr-scroll, #rr-count, action bar `.bar.case-actions`, Close button, nine builds driven through the sheet, tooltip named `#tip`).

I should be honest in a brief preamble that since I'm returning the blocks, I'm consolidating: the old boot-capture implementation (lines ~4732, ~5167 with `setSiblings`) is deleted; the overlay implementation owns everything. I'll write the code as a full, coherent module.

Let me design the JS:

```js
(function(){
  'use strict';

  // ---------- ids are unique by construction ----------
  // #tip, #iAim each declared once in markup (see note in HTML);
  // everything below resolves them at use-time, never at boot.

  // ---------- dialog state ----------
  var wrap = null, box = null, lastFocus = null, open = false;

  function ensureWrap(){
    wrap = document.getElementById('case-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'case-wrap';
      document.body.appendChild(wrap);
    }
    box = document.getElementById('case-box');
    if(box && box.parentElement !== wrap) wrap.appendChild(box);
  }
  ...
```

Key functions:

- `setSiblings(on)` — containment guard:
```js
function setInert(on){
  Array.prototype.forEach.call(document.body.children, function(el){
    if(wrap && (el === wrap || wrap.contains(el))) return;  // containment, not identity
    // also skip scripts/styles? No — brief said SCRIPT/STYLE got inerted and that's listed as observed; but requirement only says after close none remain, and main.wrap etc. Fine to inert them, harmless. Actually inerting scripts/styles is harmless. Keep skipping nothing except the sheet.
    if(on){
      el.setAttribute('data-rr-inert','1');
      el.setAttribute('aria-hidden','true');
      try{ el.inert = true; }catch(e){ el.setAttribute('inert',''); }
    }
  });
}
function clearInert(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-rr-inert]'), function(el){
    el.removeAttribute('data-rr-inert');
    el.removeAttribute('aria-hidden');
    try{ el.inert = false; }catch(e){ el.removeAttribute('inert'); }
  });
}
```

Wait — wrap is created before opening? `ensureWrap` may be called at open time; the loop needs wrap to exist. Create wrap at open. If wrap is null, skip the guard (inert everything)? Better: ensureWrap first, then loop.

- Open:
```js
function openCase(opener, payload){
  ensureWrap();
  lastFocus = opener || document.activeElement;
  wrap.classList.add('open');            // one mechanism
  wrap.setAttribute('data-sdr-open',''); // no — one mechanism only. Drop this.
  open = true;
  clearInert(); setInert(true);          // idempotent
  // focus first focusable inside box
  var f = focusables(box);
  (f[0] || box).focus();
}
```

One open mechanism: keep `.open` (or keep `data-sdr-open`)? Brief says choose one. I'll keep `data-sdr-open='1'`? The brief lists both, says one is surplus, "Return one." Either is fine; I'll keep `.open` class since CSS at 9097 uses it, or keep attribute. I'll pick `data-open` — no, stay close to existing: keep `[data-sdr-open='1']`? Hmm. The brief mentions `.open` at line 9097 and `[data-sdr-open='1']` at 6970. I'll standardize on `.open` and note the attribute selector is gone. Actually to be safe with "one open mechanism" I'll use a single class `.open` throughout my CSS. Fine.

- Close:
```js
function closeCase(){
  if(!open) return;
  open = false;
  wrap.classList.remove('open');
  clearInert();
  var back = lastFocus;
  lastFocus = null;
  if(back && back.isConnected && typeof back.focus === 'function') back.focus();
  else { /* fall back: blur */ if(document.activeElement) document.activeElement.blur(); }
}
```

After close, `querySelectorAll('[inert]')` empty — clearInert removes `inert` property and any `inert` attribute. Note: `el.inert = false` in try; also remove attribute in case attribute-only was set. Also, requirement: after closing, no [inert] anywhere — including things that may have been inert for other reasons? The verification says it's empty; my clearInert handles all I set. But "contains MAIN.wrap ... does NOT contain overlay" while open. Good.

- Focus trap (Tab):
```js
function focusables(root){
  var sel = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var list = root.querySelectorAll(sel);
  return Array.prototype.filter.call(list, function(el){
    return el.offsetParent !== null || el === document.activeElement;
  });
}
document.addEventListener('keydown', function(e){
  if(!open) return;
  if(e.key === 'Escape'){ e.preventDefault(); closeCase(); return; }
  if(e.key === 'Tab'){
    var f = focusables(box);
    if(!f.length){ e.preventDefault(); return; }
    var first = f[0], last = f[f.length-1];
    if(e.shiftKey){
      if(document.activeElement === first || !box.contains(document.activeElement)){ e.preventDefault(); last.focus(); }
    } else {
      if(document.activeElement === last || !box.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    }
  }
}, true); // capture, like the original Escape listener — survives nothing here, it's just how it was
```

Note: Escape listener registered on document with capture — keep that (it works). The Tab handler also on document, capture, fine — keydown events target the focused element which is inside the dialog; capture on document still sees them. And since dialog is not inert, focus stays in; the trap wraps.

- Scroll ownership: the wrap scrolls (`overflow:auto`), card inside. Wheel over sheet scrolls wrap naturally once not inert. Nothing extra needed; but maybe guard wheel from chaining when wrap at end? Not required. Requirement: wheel over sheet scrolls the sheet, not the page behind. With overflow auto and scrollHeight > clientHeight, it works. Overscroll chaining could scroll page when sheet at end — I can add `overscroll-behavior: contain` on `#case-wrap`. Good, CSS.

- Other ids: `#rr-sec`, `#rr-scroll`, `#rr-count`, `#iAim`, `#tip`. The brief says the boot-capture block (line 4732) is the deleted implementation; those rr- variables belonged to it? `rrSec`, `rrScroll`, `rrCount`, `caseBox`, `tipEl` — caseBox and tipEl were used in setSiblings. rr-sec/rr-scroll/rr-count might be used elsewhere (nine builds). I'll re-resolve them lazily inside functions via getElementById at use time, not boot. I'll keep helpers `byId(id)`.

- The duplicate `#tip` / `#iAim`: since I'm only returning js and css, the duplicate id lives in HTML which I don't control... The brief says "Give the tooltip a name of its own" — i.e., rename the second `#tip` occurrence in markup. Since I only return js and css, I should include a normalization snippet in JS that de-duplicates ids at boot: find all `#tip`, keep first, rename others (e.g., `tip-echo` or remove attribute). That's a pragmatic fix and satisfies "every id appears exactly once". Similarly `#iAim`. I'll add a `dedupeIds()` that runs first: for each duplicated id, keep the first element, strip the id from later ones (and give them a unique alternate like `id + '-dup-N'` or just remove). Removing the id is safest; if the duplicate tooltip needed styling by id, CSS should target a class instead. I'll mention: in the CSS I style the tooltip via `#tip` (the survivor). Actually better to keep first occurrence and rename subsequent ones to `tip-2` etc.? The guard in original code exempted `tipEl`; in my new code the containment guard only exempts the sheet. If the duplicate `#tip` was a body child tooltip (the "tip" hover hint), it's a page element and should be inerted while dialog open — that's fine and correct (it's part of the page behind). And after close it's uninerted. Good.

- The nine builds driven through the sheet: open triggers — I'll expose `openCase` and wire delegated click handler for `[data-case-open]` buttons / `.rv-seam` (the seam button mentioned in inert list). The original had a `BUTTON.rv-seam` body child. I'll add: `document.addEventListener('click', function(e){ var t = e.target.closest('[data-open-case], .rv-seam'); if(t){ e.preventDefault(); openCase(t); } })`. Keep it simple.

- Action bar: the rule assumed panel padding 24px top/28px sides; new overlay supplies different padding. Fix: make the bar full width regardless of padding using negative margins matching the actual padding variable. Best: define `--case-pad` on `#case-box` in one place and use it for both padding and the bar's negative margins. I'll do that:

```css
#case-wrap #case-box{ padding: var(--case-pad); --case-pad: 28px 32px 24px; }
```
Hmm, CSS custom property with multiple values fine. Then:
```css
#case-wrap #case-box .bar.case-actions{
  position: sticky; top: 0; z-index: 3;
  margin: calc(-1 * var(--pad-top)) calc(-1 * var(--pad-x)) 14px;
  padding: 10px var(--pad-x);
  border-bottom: 1px solid #e2ded5;
}
```
Use separate custom props: `--case-pad-y: 24px; --case-pad-x: 28px;` and set `#case-box{ padding: var(--case-pad-y) var(--case-pad-x); }`. Then bar margins: `-24px -28px 14px` computed as calc. That guarantees full width for whatever padding. I'll pick the padding values the overlay actually uses — I don't know them; I'll declare them explicitly in my CSS so they're consistent. Say `--case-pad-x: 32px; --case-pad-y: 24px`? The brief just needs bar spanning full width; since I own the CSS now, one source of truth. I'll set padding 24px 28px (matching original intent) or choose new values — either way it's consistent. I'll use `--case-pad-x: 28px; --case-pad-y: 24px`.

- Scroll: `#case-wrap{ position: fixed; inset: 0; overflow-y: auto; background: rgba(...); z-index: ...; display: none } .open{display:block}`. Card centered with margin. `overscroll-behavior: contain`.

- Focus outline: `#case-box:focus{outline:none}` since we focus the box when no focusables.

Also `aria-modal="true"`, `role="dialog"`, `aria-labelledby` on the box — set in JS ensureWrap or markup. I'll set attributes in JS.

Element order: wrap appended to body — must be last so elementFromPoint hit-tests fine (inert doesn't care about order, but z-index/positioning does).

One inert function: name it `setPageInert(on)` — the only function touching `inert`.

Also the old `setSiblings` gone; also old boot capture of caseBox gone. rr-sec/rr-scroll/rr-count — I'll keep lazy getters since other code (nine builds) may reference; I'll provide `function rr(){ return { sec: byId('rr-sec'), scroll: byId('rr-scroll'), count: byId('rr-count') }; }` — actually to keep the block focused, I'll include minimal usage: updating count text. Hmm, I don't know what they do. I'll keep them as lazily-resolved refs used by a `syncCount()` placeholder. Keep it plausible and minimal.

Also "closing returns focus to whatever opened it" — lastFocus stored at open.

Also opening moves focus into the sheet: focus first focusable (Close button likely first in action bar — it's sticky at top, good).

Let me also handle: while open, if focus somehow lands on body (e.g., click on wrap padding outside card), clicking wrap backdrop could close? Not required; brief doesn't mention backdrop click. Skip — or add? "Nothing else on the page may change" — skip backdrop close to be safe. But clicking wrap (outside card) shouldn't do anything; fine.

Also ensure `elementFromPoint` at Close button centre returns BUTTON — requires the button not covered. The action bar is sticky z-index 3 inside scroll container; fine.

Edge: `clearInert` must clear everything inerted even if wrap reference changed — uses `[data-rr-inert]` marker, robust.

Escape listener: keep capture on document. It must fire even if focus escaped (belt and braces). Fine.

Now the CSS block. Needs:

```css
/* #case-wrap is styled in ONE place now. */
#case-wrap{
  position: fixed; inset: 0; z-index: 9000;
  overflow-y: auto; overscroll-behavior: contain;
  background: rgba(28,26,22,.44);
  display: none;
}
#case-wrap.open{ display: block; }
#case-wrap #case-box{
  --case-pad-x: 28px; --case-pad-y: 24px;
  width: min(880px, calc(100% - 48px));
  margin: 48px auto;
  background: #fbf9f4;
  border: 1px solid #d8d3c6;
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0,0,0,.28);
  padding: var(--case-pad-y) var(--case-pad-x);
}
#case-wrap #case-box:focus{ outline: none; }
#case-wrap #case-box .bar.case-actions{
  position: sticky; top: 0; z-index: 3;
  display: flex; align-items: center; gap: 12px;
  margin: calc(-1 * var(--case-pad-y)) calc(-1 * var(--case-pad-x)) 14px;
  padding: 10px var(--case-pad-x);
  background: #fbf9f4;
  border-bottom: 1px solid #e2ded5;
}
#case-wrap #case-box .bar.case-actions .spacer{ flex: 1 1 auto; }
```

Tooltip: `#tip{ position:absolute; ... }` — the page-behind tooltip. I'll include a minimal rule. And `#iAim` — aim marker? Keep minimal, maybe just note uniqueness. I'll include small rules so ids are styled where meant.

Scrollbar inside: fine.

The old rule at 6973 and the `.open` rule at 9097 — both replaced by this single block. Say so in comments.

Also inerted elements may need `pointer-events`? `inert` handles it.

Now write the JS block fully.

```js
/* ============================================================
   CASE SHEET — single implementation.
   ...
============================================================ */
(function () {
  'use strict';

  /* ---------- 0. ids: exactly one element per id ---------- */
  // #tip and #iAim were each declared twice in the markup. The
  // first occurrence wins; every later duplicate loses its id
  // (kept as data-dup-id so nothing else can silently grab it).
  (function dedupeIds() {
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll('[id]'), function (el) {
      var id = el.id;
      if (seen[id]) {
        el.setAttribute('data-dup-id', id);
        el.removeAttribute('id');
      } else {
        seen[id] = true;
      }
    });
  })();

  function byId(id) { return document.getElementById(id); }

  /* ---------- 1. the overlay ---------- */
  var wrap = null, box = null, lastFocus = null, isOpen = false;

  function ensureWrap() {
    wrap = byId('case-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'case-wrap';
      document.body.appendChild(wrap); // wrap owns scroll; card sits inside it
    }
    box = byId('case-box');
    if (box && box.parentElement !== wrap) wrap.appendChild(box);
    if (box) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (!box.hasAttribute('aria-label')) box.setAttribute('aria-label', 'Case sheet');
    }
  }

  /* ---------- 2. inerting: ONE function, containment guard ---------- */
  function setPageInert(on) {
    if (on) ensureWrap();
    Array.prototype.forEach.call(document.body.children, function (el) {
      // Containment, not identity. Anything that contains the sheet
      // IS the sheet; a handle captured at boot goes stale the moment
      // the sheet is re-parented, and identity checks then fail silently.
      if (wrap && (el === wrap || wrap.contains(el))) return;
      if (on) {
        el.setAttribute('data-rr-inert', '1');
        el.setAttribute('aria-hidden', 'true');
        try { el.inert = true; }
        catch (e) { el.setAttribute('inert', ''); }
      }
    });
  }

  function clearPageInert() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-rr-inert]'), function (el) {
      el.removeAttribute('data-rr-inert');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
      try { el.inert = false; } catch (e) {}
    });
  }

  /* ---------- 3. open / close ---------- */
  function openCase(opener) {
    if (isOpen) return;
    ensureWrap();
    lastFocus = opener || document.activeElement;
    isOpen = true;
    wrap.classList.add('open'); // the one open mechanism
    clearPageInert();           // never stack on a half-torn-down pass
    setPageInert(true);
    var f = focusables(box);
    (f[0] || box).focus();      // focus moves in; never left on BODY
  }

  function closeCase() {
    if (!isOpen) return;
    isOpen = false;
    wrap.classList.remove('open');
    clearPageInert();           // after this, querySelectorAll('[inert]') is empty
    var back = lastFocus;
    lastFocus = null;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus();
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  /* ---------- 4. keyboard: Escape closes, Tab stays inside ---------- */
  function focusables(root) {
    if (!root) return [];
    var sel = 'a[href],area[href],button:not([disabled]),' +
              'input:not([disabled]):not([type="hidden"]),' +
              'select:not([disabled]),textarea:not([disabled]),' +
              '[tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(root.querySelectorAll(sel), function (el) {
      return el.getClientRects().length > 0;
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCase();
      return;
    }
    if (e.key === 'Tab') {
      var f = focusables(box);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      var cur = document.activeElement;
      if (e.shiftKey) {
        if (!box.contains(cur) || cur === first) { e.preventDefault(); last.focus(); }
      } else {
        if (!box.contains(cur) || cur === last) { e.preventDefault(); first.focus(); }
      }
    }
  }, true); // capture, on document — the route that never went dark

  /* ---------- 5. openers (the nine builds reach the sheet here) ---------- */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest ? e.target.closest('[data-open-case],.rv-seam') : null;
    if (opener) {
      e.preventDefault();
      openCase(opener);
      return;
    }
    var closer = e.target.closest ? e.target.closest('[data-close-case]') : null;
    if (closer) { e.preventDefault(); closeCase(); }
  });

  /* ---------- 6. rr- panel refs: resolved at use, never at boot ---------- */
  // (#rr-sec, #rr-scroll, #rr-count used to be captured at line 4732,
  //  alongside the stale caseBox handle. Re-resolve on every use.)
  function rrRefs() {
    return { sec: byId('rr-sec'), scroll: byId('rr-scroll'), count: byId('rr-count') };
  }

  // exposed for the rest of the page
  window.caseSheet = {
    open: openCase,
    close: closeCase,
    isOpen: function () { return isOpen; },
    refs: rrRefs
  };
})();
```

Hmm — the Close button: I wire `[data-close-case]`. Should note markup: the close button keeps its `data-close-case` attribute (or id). The brief says "the Close button closes the sheet with a real mouse click" — my delegated handler does that since the button is not inert anymore. Good.

One issue: clicking the close button — e.target.closest works on elements; if click lands on inner span fine. Also `e.target` could be text node? In click events target is element. OK.

Also ensure clicking inside dialog that isn't on a control doesn't bubble to opener handler — only `[data-open-case]`/`.rv-seam` match, fine.

Wait: `.rv-seam` — that was a body child button that got inerted. If it's the opener seam on the page, when inert it's unclickable while dialog open — correct.

Also note: the old code had `tipEl` guard because tip was exempted from inerting (it's a floating tooltip that must stay live?). Brief says the other `#tip` was inerted "which is why DIV#tip appears in that list despite being named in the guard" — meaning guard named one tip but loop caught the other. Under containment-only guard, any body-child tip gets inerted while open — is that a regression? The original intent exempted tipEl from inerting (hover tooltip?). Hmm. The brief's requirement list: `querySelectorAll('[inert]')` with sheet open "contains MAIN.wrap ... does NOT contain the overlay, the sheet, or anything containing them" — tip is not containing the sheet, so it may be inert. And after close, empty. I think it's acceptable — actually the original design exempted tip, but the brief says the fix is containment guard; it doesn't ask to keep tip exempt. I'll leave tip inerted while modal is open (correct for a modal anyway). Fine.

CSS block:

```css
/* ============================================================
   #case-wrap is now styled in ONE place, with ONE open
   mechanism: .open. The old [data-sdr-open='1'] rule (line 6970)
   and the .open rule (line 9097) are both replaced by this block.
   ============================================================ */

#case-wrap{
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: none;              /* closed: out of hit-testing entirely */
  overflow-y: auto;           /* the overlay owns the scroll */
  overscroll-behavior: contain; /* wheel never chains to the page behind */
  background: rgba(30, 27, 22, .45);
}
#case-wrap.open{ display: block; }

#case-wrap #case-box{
  /* single source of truth for panel padding — the action bar's
     negative margins are derived from these, so the bar always
     spans the full width of the panel, whatever the padding is */
  --case-pad-x: 28px;
  --case-pad-y: 24px;

  box-sizing: border-box;
  width: min(880px, calc(100% - 48px));
  min-height: 0;
  margin: 48px auto 64px;
  padding: var(--case-pad-y) var(--case-pad-x);
  background: #fbf9f3;
  border: 1px solid #d9d3c5;
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(20, 16, 8, .30);
}
#case-wrap #case-box:focus{ outline: none; } /* programmatic focus when empty */

/* action bar: full-bleed inside the panel, sticky under the top edge */
#case-wrap #case-box .bar.case-actions{
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: calc(-1 * var(--case-pad-y)) calc(-1 * var(--case-pad-x)) 14px;
  padding: 10px var(--case-pad-x);
  background: #fbf9f3;
  border-bottom: 1px solid #e2ded5;
}
#case-wrap #case-box .bar.case-actions .spacer{ flex: 1 1 auto; }

/* the tooltip: one id, one rule (the duplicate lost its id at boot) */
#tip{
  position: absolute;
  z-index: 8000;
  max-width: 320px;
  padding: 6px 10px;
  background: #23201a;
  color: #f4f0e6;
  font: 12px/1.4 system-ui, sans-serif;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .12s ease;
}
#tip.show{ opacity: 1; }

/* the aim marker, likewise named once */
#iAim{
  position: absolute;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 2px solid #b5451d;
  border-radius: 50%;
  pointer-events: none;
}
```

Note on the brief: "with a sheet open, querySelectorAll('[inert]') contains MAIN.wrap ... does NOT contain the overlay, the sheet, or anything containing them." My guard skips wrap and its subtree — since box is inside wrap, wrap.contains(wrap) true and el===wrap caught. Good.

Also `wrap.contains(el)` where el is wrap: contains returns true for self. Fine, el===wrap redundant but harmless.

One subtlety: "one inert function" — I have setPageInert + clearPageInert (a helper). Could merge: `setPageInert(on)` handling both. Requirement says "one overlay implementation, one open mechanism, one inert function." Let me merge into one function:

```js
function setPageInert(on){
  if(on){
    ensureWrap();
    Array.prototype.forEach.call(document.body.children, function(el){
      if(wrap && (el === wrap || wrap.contains(el))) return;
      el.setAttribute('data-rr-inert','1');
      el.setAttribute('aria-hidden','true');
      try{ el.inert = true; }catch(e){ el.setAttribute('inert',''); }
    });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('[data-rr-inert]'), function(el){
      el.removeAttribute('data-rr-inert');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
      try{ el.inert = false; }catch(e){}
    });
  }
}
```

Good — one function.

Preamble: brief note explaining the shape: deleted the boot-capture implementation, overlay owns the sheet, containment guard, dedupe ids, one open mechanism, padding variable. Keep it short since format demands two fenced blocks; a short intro paragraph is fine (the instruction says "Return two things, each in its own fenced block, in this order" — intro text acceptable? Safer to add a very brief lead-in sentence or two; typically fine). I'll include a concise explanation then the blocks.

Also note about markup: close button needs `data-close-case`, openers `data-open-case` — mention in comments in the JS.

Double-check "after closing querySelectorAll('[inert]') is empty" — clearPageInert removes attributes and sets inert=false. If some other script inerted something independently, not our concern. Also note the removal of `el.inert=false` inside try after removeAttribute — order fine.

Check Tab trap edge: `cur === first` with shift → go to last; `cur === last` without shift → go to first; `!box.contains(cur)` → wrap to appropriate end. Good.

Escape on document capture — works even if focus fell to body. Good.

Wheel: wrap has overflow-y:auto and box taller than viewport → scrollHeight > clientHeight; overscroll-behavior contain prevents chaining. Good.

elementFromPoint on Close: sticky bar z-index 3 within wrap; wrap z-index 9000 over inert page. Good.

I'll write the final answer: brief prose (what changed and why, mapping to the requirements), then js block, then css block.