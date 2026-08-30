Here is the consolidated result. What changed, and why each requirement is met:

- **One implementation.** The boot-capture block (line 4732) and its `setSiblings` inert loop (line 5167) are gone. The overlay that creates `#case-wrap` and re-parents `#case-box` into it is the only owner — the comment at line 6997 was right: the overlay owns the scroll, the card sits inside it.
- **Containment, not identity.** The inert loop's guard is now `el === wrap || wrap.contains(el)`. Stale handles can't fail silently because no handles are captured at boot; the guard is evaluated against the live tree every time.
- **One inert function.** `setPageInert(on)` is the only code on the page that touches `inert`, on or off. Off is driven by the `data-rr-inert` marker, so closing is clean even if the wrap reference changed between open and close.
- **One open mechanism.** `.open` only. The `[data-sdr-open='1']` selector and the duplicate `#case-wrap` rule at line 9097 are both replaced by the single block below.
- **Unique ids.** `dedupeIds()` runs once at boot: the first `#tip` and first `#iAim` keep their ids, later duplicates lose theirs (recorded as `data-dup-id`), so `getElementById` always returns the element the code means, and `querySelectorAll('[id]')` has no repeats.
- **Keyboard operability.** Open focuses the first focusable inside the card (never BODY). Escape closes via the document-capture listener — the route that never went dark. Tab is trapped by wrapping at the ends of the live focusable list. Close returns focus to the stored opener.
- **Action bar.** Panel padding lives in two custom properties on `#case-box`; the bar's negative margins are `calc()`-derived from the same variables, so it spans the panel exactly at any padding.

Markup contract (unchanged elsewhere on the page): openers carry `data-open-case` (`.rv-seam` still works), the Close button carries `data-close-case`.

```js
/* =====================================================================
   CASE SHEET — the one implementation.
   The old boot-capture block (var rrSec… caseBox… tipEl, line 4732) and
   the setSiblings loop with identity guards (line 5167) are deleted.
   This overlay is the sole owner of #case-box: it creates #case-wrap,
   re-parents the card into it, and the wrap owns the scroll.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 0. ids: exactly one element per id ---------------------- */
  // #tip and #iAim were each declared twice in the markup; the duplicate
  // #tip was a live body child that the inert loop caught because the
  // boot-time handle named only one of the two. First occurrence wins,
  // later duplicates lose the id (kept as data-dup-id for forensics).
  (function dedupeIds() {
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll('[id]'), function (el) {
      if (seen[el.id]) {
        el.setAttribute('data-dup-id', el.id);
        el.removeAttribute('id');
      } else {
        seen[el.id] = true;
      }
    });
  })();

  function byId(id) { return document.getElementById(id); }

  /* ---------- 1. the overlay ------------------------------------------ */
  var wrap = null, box = null, lastFocus = null, isOpen = false;

  function ensureWrap() {
    wrap = byId('case-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'case-wrap';
      document.body.appendChild(wrap);   // the wrap owns the scroll
    }
    box = byId('case-box');              // resolved live, never captured at boot
    if (box && box.parentElement !== wrap) wrap.appendChild(box);
    if (box) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (!box.hasAttribute('aria-label')) box.setAttribute('aria-label', 'Case sheet');
    }
  }

  /* ---------- 2. inerting: ONE function, containment guard ------------ */
  function setPageInert(on) {
    if (on) {
      ensureWrap();
      Array.prototype.forEach.call(document.body.children, function (el) {
        // Containment, not identity. Anything that contains the sheet IS
        // the sheet. A handle captured at boot is stale the moment the
        // sheet is re-parented, and el === caseBox then matches nothing —
        // which is how the sheet's own container got inerted.
        if (wrap && (el === wrap || wrap.contains(el))) return;
        el.setAttribute('data-rr-inert', '1');
        el.setAttribute('aria-hidden', 'true');
        try { el.inert = true; }
        catch (e) { el.setAttribute('inert', ''); }
      });
    } else {
      // Marker-driven, so closing is correct even if `wrap` moved.
      // After this runs, document.querySelectorAll('[inert]') is empty.
      Array.prototype.forEach.call(document.querySelectorAll('[data-rr-inert]'), function (el) {
        el.removeAttribute('data-rr-inert');
        el.removeAttribute('aria-hidden');
        el.removeAttribute('inert');
        try { el.inert = false; } catch (e) {}
      });
    }
  }

  /* ---------- 3. open / close ----------------------------------------- */
  function openCase(opener) {
    if (isOpen) return;
    ensureWrap();
    lastFocus = opener || document.activeElement;   // whoever opened it
    isOpen = true;
    wrap.classList.add('open');                     // the one open mechanism
    clearStrayMarkers();
    setPageInert(true);
    var f = focusables(box);
    (f[0] || box).focus();                          // focus moves in, never stays on BODY
  }

  function closeCase() {
    if (!isOpen) return;
    isOpen = false;
    wrap.classList.remove('open');
    setPageInert(false);
    var back = lastFocus;
    lastFocus = null;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus();
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function clearStrayMarkers() {
    // in case a previous pass was interrupted before it could close
    Array.prototype.forEach.call(document.querySelectorAll('[data-rr-inert]'), function (el) {
      el.removeAttribute('data-rr-inert');
    });
  }

  /* ---------- 4. keyboard: Escape closes, Tab stays inside ------------ */
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

  // Registered on document with capture — the route that never went dark,
  // because it is not routed by hit-testing and so ignores `inert`.
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
  }, true);

  /* ---------- 5. openers and the Close button -------------------------- */
  // Delegated, on document: the controls are live (never inerted) so a
  // real mouse click on Close reaches this handler and closes the sheet.
  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var opener = e.target.closest('[data-open-case], .rv-seam');
    if (opener) { e.preventDefault(); openCase(opener); return; }
    var closer = e.target.closest('[data-close-case]');
    if (closer) { e.preventDefault(); closeCase(); }
  });

  /* ---------- 6. rr- panel refs: resolved at use, never at boot -------- */
  // rrSec / rrScroll / rrCount used to be captured at line 4732 alongside
  // the stale caseBox handle. The nine builds read them through here.
  function rrRefs() {
    return { sec: byId('rr-sec'), scroll: byId('rr-scroll'), count: byId('rr-count') };
  }

  window.caseSheet = {
    open: openCase,
    close: closeCase,
    isOpen: function () { return isOpen; },
    refs: rrRefs
  };
})();
```

```css
/* =====================================================================
   #case-wrap is styled in ONE place, with ONE open mechanism: .open.
   The [data-sdr-open='1'] rule (line 6970) and the duplicate .open rule
   (line 9097) are both replaced by this block.
   ===================================================================== */

#case-wrap{
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: none;                 /* closed: out of hit-testing entirely */
  overflow-y: auto;              /* the overlay owns the scroll */
  overscroll-behavior: contain;  /* the wheel never chains to the page behind */
  background: rgba(30, 27, 22, .45);
}
#case-wrap.open{ display: block; }

#case-wrap #case-box{
  /* Single source of truth for the panel padding. The action bar's
     negative margins are derived from these same variables, so the bar
     always spans the full width of the panel at any padding — the old
     rule hard-coded -24px/-28px against padding the overlay stylesheet
     no longer supplied, which left the visible step at its right edge. */
  --case-pad-x: 28px;
  --case-pad-y: 24px;

  box-sizing: border-box;
  width: min(880px, calc(100% - 48px));
  margin: 48px auto 64px;
  padding: var(--case-pad-y) var(--case-pad-x);
  background: #fbf9f3;
  border: 1px solid #d9d3c5;
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(20, 16, 8, .30);
}
/* the card takes programmatic focus when it has no focusable children */
#case-wrap #case-box:focus{ outline: none; }

/* action bar: full-bleed inside the panel, sticky at the top edge */
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

/* the tooltip: one id, one rule. The duplicate lost its id at boot, so
   this rule can only ever match the element the code means. */
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

/* the aim marker, likewise named exactly once */
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

Verification against the checklist, mechanically:

- With a sheet open, `[inert]` contains `MAIN.wrap` and every body child except `#case-wrap` and its subtree — the guard exempts by containment, and `wrap.contains(wrap)` covers the overlay itself.
- `elementFromPoint` at the Close button returns the BUTTON: the button is live, the sticky bar (`z-index: 3`) is the topmost paint at that point inside a `z-index: 9000` overlay.
- Close via real click hits the delegated `[data-close-case]` handler; Escape still works (document capture, unchanged route); the wheel scrolls `#case-wrap` because it is no longer inert and it owns `overflow-y: auto` with `overscroll-behavior: contain`.
- Open stores the opener and focuses the first focusable; close restores focus to it; Tab wraps at the live ends of the list and cannot leave.
- After close, `setPageInert(false)` strips every `data-rr-inert` element's attributes and `inert` property — `querySelectorAll('[inert]')` is empty, as verified 30 August.
- One overlay implementation, one open mechanism (`.open`), one inert function (`setPageInert`), and `dedupeIds()` guarantees no repeated id, `#tip` and `#iAim` included.