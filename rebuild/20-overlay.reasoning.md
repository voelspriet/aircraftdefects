We need to produce a JS/CSS drop-in that fixes three faults in "the rebuild" — but we don't have the rebuild's source! We only have the original. The prompt says "Three faults left from the reviews. You have the original in full below." So we must write code that patches a rebuild we cannot see. Hmm. This is a common scenario: we must write idempotent patch code that works against the rebuild, using the original as reference for wording/behavior.

We need to be careful: the patch must be self-contained JS+CSS, dropping into the rebuild inside its IIFE. We can't see the rebuild's variable names, so we should write defensive code that:

1. Removes desktop rails from the DOM when phone layout is active (or prevent the desktop rails render at 390px). Check: "At 390px: nought .rail elements, the phone layout only." So we need to remove `.rail` elements when phone renderer is used. The rebuild's drawHero renders phone but leaves desktop rails in DOM. Our patch: after hero render, if isPhone (matchMedia max-width:760px), remove any `.rail` elements inside #hero. But the instrument redraws on every filter change — our patch must be idempotent and re-run. We can hook via MutationObserver on #hero, or wrap/intercept. Since we can't know the rebuild's internal functions, a MutationObserver on document.body watching for added `.rail` nodes inside #hero when phone media matches, then removing them. Also on resize, if phone mode, remove .rail; if desktop mode, restore? If we remove them, desktop after resize would lose rails unless the rebuild redraws. The rebuild redraws on resize (original does: addEventListener resize → drawHero). If the rebuild also redraws on resize, then on resize back to desktop it will re-render rails; our observer removes only when phone matches. That works.

Also possibly the desktop rails are added but hidden by CSS in rebuild? Fault says they're in the DOM, 4 .rail elements present at 390px. So we must remove them from DOM (or display:none? The check counts `.rail` elements presumably in DOM — "nought .rail elements". Removing from DOM is safest).

Also phone check counts "455 phone elements" vs original 462 — fine, not a fault listed beyond rails.

2. Case sheet as fixed overlay. `document.getElementById('case-wrap')` returns null on rebuild. So the rebuild doesn't have #case-wrap. We need to create the overlay structure: `#case-wrap` fixed overlay with scrim, `#case-box` card inside, sticky action bar. And wire openCase/closeCase/hideCase/trapFocus behaviors: Escape, backdrop click, Close button, Back (history push), focus return, focus trap, inert siblings, sticky action bar, scrollable overlay.

But the rebuild presumably has its own openCase that renders a card inline in the page (maybe #case-box appended somewhere or a panel). Since we don't know, we need to intercept. Approach: create the overlay DOM, and intercept case opening. The rebuild likely has a function openCase — but we can't rely on its name/behavior. Hmm. The instructions say "using the existing helpers" — but we don't know them. We must write code that works generically.

Practical approach: The rebuild presumably has some case rendering. Given the fault description: "The case sheet is a card in the page, not an overlay" — the rebuild renders the case sheet as a card in the page (document grows). We need to move it into an overlay.

Without seeing the rebuild, the safest generic patch:

- Create `#case-wrap` (if absent) with the reference styles, append to body, containing `#case-box`.
- Intercept clicks on elements that open the case (e.g., buttons with text "Case sheet"/"Open report", or delegated capture-phase click listener that detects when the rebuild renders a case). Alternatively, use a MutationObserver to detect when case content appears and relocate it into the overlay.

That's very hacky and fragile. Perhaps a better approach: the review context implies the rebuild has functions like openCase etc. The user says "Read openCase, closeCase, hideCase and trapFocus in the source above" — i.e., read them in the original to understand what to implement. And "using the existing helpers" of the rebuild. Since the rebuild mirrors the original's structure (it's a rebuild of this page), it very likely has openCase/closeCase/hideCase/trapFocus functions and a #case-box element (maybe not #case-wrap). The fault: `document.getElementById('case-wrap')` returns null — meaning the rebuild has #case-box but no #case-wrap wrapper. The rebuild renders the case as a card in the page.

So the patch: create #case-wrap, move #case-box inside it, add the overlay CSS, and re-implement/wrap openCase/closeCase/hideCase/trapFocus to behave as dialog: overlay display flex, history push, Escape/backdrop/Close close, focus trap with inert siblings, focus return.

How to wrap without knowing internal names? If the rebuild is a near-copy of the original, it likely defines global functions `openCase`, `closeCase`, `hideCase`, `trapFocus` (possibly inside an IIFE though — "dropping into the rebuild inside its IIFE" suggests we drop our code inside the rebuild's IIFE, so we have access to its closure... but our code is written blind).

Given the constraints of this exercise, the expected answer is a patch that:

- Defines its own prefixed helpers (`sdrFix...`).
- Creates/ensures `#case-wrap` overlay exists with reference CSS.
- Ensures `#case-box` lives inside `#case-wrap`.
- Wraps `openCase`/`closeCase`/`hideCase`/`trapFocus` if they exist in scope (since our code drops into the IIFE, `typeof openCase === 'function'` and reassignment works if declared with `function` — reassigning a function declaration within the same scope works).

Since we drop "inside the rebuild's IIFE", we can reference and reassign those functions via closure... but reassigning a function declaration is allowed (`openCase = wrapped`). However, other code inside the IIFE referencing `openCase` will get the wrapped version since it resolves at call time. Inline onclick attributes reference global `openCase` — if the rebuild's openCase is inside an IIFE, inline onclick wouldn't find it... The original has inline `onclick="openCase('...')"` and openCase defined at top-level script (not in IIFE). The rebuild is described as an IIFE. Hmm, maybe the rebuild attaches handlers via addEventListener or exposes globals. Uncertain.

Given ambiguity, write defensively:

```js
(function(){
  // 1. Phone rails
  // 2. Case overlay
  // 3. aria-labels
})();
```

For the case sheet, a robust generic approach that doesn't depend on the rebuild's function names:

- Create overlay + box.
- Use a MutationObserver on document.body (or on the element that receives the case card) to detect when case content is rendered. But how to identify case content? The original's case content includes `.case-actions`, `.bigq`, `.publish`, `table.kv`, `#case-title`. A generic detector: an element with id `case-box`, or a container holding `[data-copy]` buttons / `.bigq`. If the rebuild renders into a `#case-box` that's in the page, we can just move `#case-box` into our `#case-wrap` once, and add overlay CSS. Then the rebuild's own rendering (which writes into #case-box via innerHTML) still works, but now it's inside the fixed overlay. Then we add our own behaviors: show overlay when #case-box gets content (observer), Escape/backdrop/Close, focus trap, history push on open.

The fault also mentions: `document.getElementById('case-wrap')` returns null — so the rebuild's code references `el("case-wrap")` maybe and guards, or maybe the rebuild changed to not use case-wrap. Also "The action bar inside it is sticky at top:0 in the original. In the rebuild it is static" — so the rebuild does have a case action bar (`.case-actions`) but sticky is missing — CSS fix.

So plan for fault 2:

CSS (prefixed or exact since original uses these exact selectors; but must not clash): we add:

```css
#case-wrap{display:none;position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
#case-wrap.open{display:flex}
#case-box{background:#fff;max-width:min(880px,66vw);width:100%;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
@media(max-width:900px){#case-box{max-width:100%}}
#case-box .bar.case-actions{position:sticky;top:0;z-index:3;...}
```

Wait — original #case-box uses `max-width:min(880px,66vw)` from a later override, plus base `max-width:900px`. The check says "the case sheet opens as a fixed overlay with the reference's scrim, at viewport top, at 1440, 820 and 390; it scrolls to its last line; its action bar stays put". So we need: overlay fixed, scrim color, overflow auto, box scrolls internally via overlay scroll (box is content; overlay scrolls). At 390px, padding 32px 16px → box max-width 100%.

JS:

- Ensure `#case-wrap` exists: create div id="case-wrap", append to document.body.
- Find existing `#case-box` (the rebuild renders into it). If found, move it into #case-wrap. If not found, create it inside #case-wrap.
- Make the overlay open when case content appears: MutationObserver on #case-box; when its innerHTML becomes non-empty (child nodes), open overlay: add class 'open' (display:flex), set inert on siblings, trap focus, push history state, focus box, remember lastFocus.
- Close: remove class, restore inert, return focus.
- Escape key closes when open; backdrop click (event.target === case-wrap) closes; a Close button inside (the rebuild's action bar presumably has one; if not, we ensure one exists — the original has `<button class="ghost" onclick="closeCase()">Close</button>`; the rebuild likely has one too; but to be safe, ensure a close button exists in `.case-actions`).
- Back closes: push history state when opening; popstate handler closes if open. Also closeCase triggered by the rebuild's Close button — if the rebuild has its own closeCase that hides... but the rebuild's close is static; hmm the fault says the rebuild's action bar exists but static, so it has a Close button. If the rebuild's close function only does something like hiding by removing content, our observer would see it emptied and close overlay. Actually our observer can close the overlay when #case-box is emptied! That handles the rebuild's own close logic generically.

But focus trap and inert need to be applied by us on open, and Escape/backdrop/Back handled by us.

Also "at viewport top" — overlay has align-items:flex-start and padding-top 32px; when opened we should scroll overlay to top (`caseWrap.scrollTop = 0`). And "it scrolls to its last line" — overlay overflow:auto, box height auto → scrolls. Good.

History: original pushes state `{case:id}` with URL param. Rebuild might already push history (fault doesn't mention history broken). Fault says "Back closes it too" is a requirement to implement. If the rebuild already pushes `?case=` (fault 2 focuses on overlay/sticky), maybe history already works. But to be safe, our popstate handler: if overlay open and no `case` param, close it. And when opening (observer fires), if URL has no `case` param... we can't know id easily — we could read from the rendered content? The original's route line includes "Report {control number}" in eyebrow: `.eyebrow-k` text "Report XXXX". We could push `?case=<id>` extracted. Hmm, but the rebuild might already handle history push in its openCase (likely, since it's a rebuild of the original). The review fault #2 lists missing overlay and static action bar; it doesn't say history is broken. The "What I will check" says "Escape, Close, a backdrop click and Back all close it; focus returns." So Back must close. If the rebuild pushes history on open, Back will popstate and its handler might try to close via case-wrap (null) and fail. Our patch: popstate listener — if overlay open, close it (and prevent default page reload? popstate doesn't reload). Also if overlay open and popstate fires for other reasons, close anyway? The original: on popstate, if case open, hideCase and return. We'll mimic: on popstate, if our overlay is open, close it and return (don't run other handlers? we can't stop other listeners... fine, just close).

But also opening must push state, else Back would navigate away from the page entirely. If the rebuild's openCase pushes (likely mirrors original), good. If not, our observer pushes `?case=ID` extracted from content. Risk of double-push if rebuild also pushes: pushing twice would make Back close only after two presses. To avoid, check if current URL already has case param matching before pushing. Extract ID from `.eyebrow-k` text ("Report N12345") or from `.route`/title. The original eyebrow: `<div class="eyebrow-k">Report ${esc(d.OperatorControlNumber)}</div>`. If rebuild mirrors, we can extract `Report (\S+)`.

Alternatively, don't push at all and rely on rebuild. But requirement "Back closes it" — safer: on open, if `location.search` lacks `case=`, pushState with case param; else leave. If rebuild already pushed before rendering (push happens before fetch in original), the URL will already have case= when content renders, so we won't double-push. 

Also focus: on open, remember document.activeElement, focus the box (or first focusable — original focuses the box with tabindex -1). Set aria-modal etc.

Inert siblings: original's trapFocus marks body children + `.wrap > *` inert except the wrap. We'll do similar: mark all direct children of body (except our overlay, #tip, and script/style) inert, plus optionally. On close, un-inert.

Escape: keydown listener: if overlay open and e.key==='Escape' → close. Note the rebuild might have its own Escape handler closing case (the original does `document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCase()})`). If the rebuild's exists and works, ours duplicates harmlessly.

Backdrop click: click listener on case-wrap: if e.target === caseWrap → close. But the rebuild's case-wrap doesn't exist, so the rebuild's own backdrop handler (original: `onclick="if(event.target.id==='case-wrap')closeCase()"`) can't exist. We add ours.

Close button: the rebuild's action bar has a Close button (mirroring original) wired to its own close function — which presumably empties #case-box or hides something. If it empties #case-box, our observer closes the overlay. But what if the rebuild's close does nothing visible? To be safe, also delegate clicks: any button inside #case-box whose text is exactly "Close" → close overlay. Let's add a delegated listener: click on `#case-box button` with textContent.trim()==='Close' → close. That's generic and safe.

Also the original's openCase does `case-wrap.style.display="flex"` — rebuild doesn't have it; our observer opens on content. But careful: the rebuild might render "Loading." placeholder first — observer would open on loading text. That's actually fine/desirable (overlay shows "Loading." like original? Original shows overlay with Loading too). OK.

Also we must handle: `#case-box` might not exist in rebuild (the fault only says case-wrap is null; the rebuild renders a card somewhere — maybe it has #case-box since the review could identify the card). Actually the fault text: "document.getElementById('case-wrap') returns null on the rebuild." and "the sheet grows the document from 21,957 to 23,523px" — implying the card is in the document flow. It could be a card appended to the search panel or its own element. We need to find the card and move it into our overlay. If rebuild has #case-box, move it. If not... we can't know. Hmm. Let's handle both: if `#case-box` exists → move into overlay wrapper. Else, detect the case card via MutationObserver: find an element that matches a case-card signature (contains `[data-copy]` buttons and a `table.kv` / `.bigq`) that's NOT inside our overlay; then wrap/move it into `#case-box` inside overlay. That's getting complex. 

Given the exercise, I'll assume the rebuild has `#case-box` (it's referenced in reviews: "the sheet", and the sticky action bar "in the rebuild it is static" — they could identify `.bar.case-actions` styles). I'll primarily handle #case-box, with a fallback: if no #case-box, create it in overlay and, via observer, detect case content rendered elsewhere (element containing `.bigq` or `[data-copy]`) and move its children into our box. I'll include a modest fallback but keep it simple.

Actually, let me reconsider: maybe simpler and more robust — a generic "case card detector": observe body subtree; when a mutation adds nodes, look for an element matching selector `.bigq, [data-copy], .case-actions, #case-title` that is not inside #case-wrap; if found, find its "card root" (closest element that contains the whole case: e.g., the element with class 'card' or the parent that contains both the action bar and the kv table) — too fuzzy. I'll go with #case-box assumption + fallback that searches for `#case-box` created dynamically.

3. aria-labels on nine selects. Straightforward: on boot and idempotently (re-run), set aria-label for those ids if not present. Since filters may be re-rendered? Original selects are static in HTML; rebuild presumably similar but labels missing. Add a function that sets labels; also run in a MutationObserver or just on DOMContentLoaded + interval? Use a small function `fixAria()` run on init and via MutationObserver on body (cheap enough) or just call it repeatedly via our existing observers. Simplest: run once at init, and also inside the hero observer callback (fires on redraws). Or use a dedicated observer. I'll set them directly and also guard in a MutationObserver for robustness (the selects are static, likely fine with one pass, but the filters panel could be re-rendered). I'll include them in a general `sdrFix` pass invoked from the MutationObserver (throttled).

Also check: "Twenty-two selects with an aria-label." So we must not break existing ones; only add missing labels to the nine listed. Also there might be other selects (#spike-by has aria-label in original, #aimKind has aria-label, etc.). We add the nine with exact wording.

Now the phone rails fault: at 390px, rebuild has 4 `.rail` elements. Fix: remove `.rail` elements from `#hero` when phone media matches. Idempotent: MutationObserver on #hero subtree; when nodes added and phone matches, remove `.rail` elements. Also run once at init and on resize. Should we also prevent them being rendered? We can't easily intercept the rebuild's drawHero without knowing internals. Observer removal is fine. Also if the rebuild re-renders hero on resize to desktop, rails return — good.

But careful: the check counts `.rail` elements in the whole document presumably. Phone layout in rebuild might also include `.rail`-classed elements? The rebuild has "455 phone elements, 4 .rail" — so the 4 .rail are the desktop leftovers inside #hero. Remove them when `matchMedia('(max-width:760px)')` matches.

Edge: also remove on initial load at 390px. Our init runs after rebuild's boot presumably (our script drops in inside IIFE after? "dropping into the rebuild inside its IIFE" — placement unknown; use DOMContentLoaded/readyState guard and also run immediately if body exists).

Also `.rail.open` scroller etc. not relevant.

Also the phone layout check: "the phone layout only" — also ensure the desktop-only parts (like `.instrument` non-phone bits) are removed. The rebuild's drawPhone presumably replaces hero content. The leftover rails: in the original's drawPhone, the entire hero innerHTML is replaced by phone markup, so no rails. In the rebuild, apparently both render (maybe drawPhone appends?). Our observer removes .rail nodes within #hero. Also maybe other desktop-only bits (`.seam`? `.aimat`? phone markup includes its own). The review only flags rails. Stick to rails. But maybe also `.picker`, `.sentence`, `.ihead` leftovers? The rebuild's phone element count 455 vs 462 original — close. The fault only mentions rails. Remove `[class]` desktop leftovers? Risky. Just rails, but maybe also remove any `.picker`? Original phone doesn't include .picker either. Hmm — the review measured 4 .rail; that's the specified fault. Keep to rails.

Wait — actually, in the rebuild, maybe the phone renderer renders and then the desktop drawHero also runs after (double render). If the desktop render happens after phone render on each redraw, our observer removes rails after each mutation batch — fine, final state has no rails. Order: MutationObserver callbacks fire after the current task; both renders happen synchronously in one task typically; our callback removes rails at microtask end. Good.

Also must ensure removal doesn't break the rebuild's own logic referencing rails (e.g., paintSpines, wtr scroll). Those are desktop-only queries; at phone they'd query removed nodes — original code guards with `if(wtr&&...)`. Fine.

Now CSS specifics for the overlay. Reference values:

#case-wrap: position:fixed; inset:0; background:rgba(12,16,22,.72); z-index:60; overscroll-behavior:contain; align-items:flex-start; justify-content:center; padding:32px 16px; overflow:auto; display:flex when open.

#case-box: background:#fff; max-width:min(880px,66vw)? The original has two rules: base `max-width:900px;width:100%;border-radius:12px;padding:24px 28px;box-shadow:...` then later `#case-box{max-width:min(880px,66vw)}` and media(max-width:900px){#case-box{max-width:100%}}. The review quotes base 900px. Either fine. I'll use min(880px,66vw) with 900px fallback? Keep it simple: `max-width:min(900px,100%)` and at ≤900px `max-width:100%`. Actually reference: at 1440 → 66vw ≈ 950 > 880 → 880. At 820 → media applies? 820 ≤ 900 → 100%. At 390 → 100%. Use:

```
#case-box{background:#fff;width:100%;max-width:900px;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
@media(max-width:900px){#case-box{max-width:100%;padding:16px}}
```

Hmm padding at mobile: original keeps 24px 28px until the 520px rule adjusts kv table. Keep 24px 28px; fine.

Sticky action bar:

```
#case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid var(--line,#e2ded5);flex-wrap:wrap}
#case-box .case-actions [onclick*="closeCase"]{margin-left:auto}
```

The rebuild's Close button — does it have onclick*="closeCase"? Unknown. Use `[data-copy]`? The margin-left auto for close: original selector `[onclick*="closeCase"]`. If rebuild's close button lacks that, minor. I'll also add `.case-actions button:last-child{margin-left:auto}` fallback? That could misplace if stepper is last. Keep original selector plus add `#case-box .case-actions .ghost:last-of-type`? Skip; keep original selector and also a data-attr we set if we inject our own close. Actually, since we add a delegated Close handler, the rebuild's close button might call its own function which empties the box → our observer closes. Fine.

Also `bar` class in rebuild — `.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}` presumably exists. Our sticky rule needs `flex-wrap:wrap` too? Original doesn't have flex-wrap on case-actions. Keep as original.

Now opening behavior details:

```
function sdrOpen(){
  lastFocus = document.activeElement;
  wrap.classList.add('sdr-open'); // display:flex
  wrap.scrollTop = 0;
  box.setAttribute('tabindex','-1');
  box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true');
  box.setAttribute('aria-label','Case sheet'); // aria-labelledby if #case-title exists
  sdrApplyInert(true);
  setTimeout(()=>{ (box.querySelector('button')||box).focus(); },30);
  // history
  if(!/[?&]case=/.test(location.search)){
    const m=(box.querySelector('.eyebrow-k')?.textContent||'').match(/Report\s+(\S+)/);
    const u=new URLSearchParams(location.search);
    if(m) u.set('case', m[1]);
    history.pushState({sdrCase:true},'','?'+u.toString());
  }
}
```

Hmm, pushing history when the rebuild already pushes → skip via check. If rebuild pushes before fetch, when content arrives URL has case → skip. Good.

popstate:

```
addEventListener('popstate', ()=>{
  if(isOpen()){ sdrClose(false); }
});
```

But careful: if rebuild's own popstate handler also exists and references case-wrap → returns null → maybe errors? Fault doesn't mention errors; if it referenced el('case-wrap') and called methods on null it'd throw. The fault statement "document.getElementById('case-wrap') returns null" is about the DOM missing the node, not necessarily code referencing it. Our creation of #case-wrap actually FIXES that too — after our patch, `document.getElementById('case-wrap')` returns our overlay. 

sdrClose:

```
function sdrClose(){
  if(!isOpen())return;
  wrap.classList.remove('sdr-open');
  sdrApplyInert(false);
  if(lastFocus&&lastFocus.focus) try{lastFocus.focus()}catch(e){}
  lastFocus=null;
}
```

Note: on Back, focus return to lastFocus — lastFocus may be stale (element may be re-rendered). Guard.

Also when closing via Back, should we also clean the URL? popstate already changed URL. Fine.

Also: when the rebuild's own code empties #case-box (its close), our observer sees children removed and empty → call sdrClose. Implement in observer: if box has no element children and no meaningful text → close. But initial state: box empty and overlay closed — fine.

Inert: 

```
function sdrApplyInert(on){
  const skip=new Set([wrap]);
  [...document.body.children].forEach(n=>{
    if(skip.has(n)||n===wrap) return;
    if(n.tagName==='SCRIPT'||n.tagName==='STYLE'||n.tagName==='LINK') return;
    if(on){ if(!n.hasAttribute('data-sdr-inert')){ n.setAttribute('data-sdr-inert','1'); try{n.inert=true}catch(e){n.setAttribute('aria-hidden','true')} } }
    else { if(n.hasAttribute('data-sdr-inert')){ n.removeAttribute('data-sdr-inert'); try{n.inert=false}catch(e){} n.removeAttribute('aria-hidden'); } }
  });
}
```

Original also inerted `.wrap > *` — but .wrap is a body child, so inerting body children covers everything. But body children include #tip (tooltip) — original's trapFocus inerted `document.body.children` except the wrap, which would include #tip and the skip link... The skip link is inside main. Inerting #tip is fine (tooltips shouldn't be reachable while modal open? focusin handlers...). Actually original: `[...document.body.children, ...document.querySelectorAll(".wrap > *")].filter(n=>n!==wrap&&!n.contains(wrap))` — includes #tip. OK, mirror it but keep #tip? To be safe, mirror original: inert body children except wrap. Keep it.

Focus trap:

```
wrap.addEventListener('keydown', e=>{
  if(e.key!=='Tab')return;
  const f=[...box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
```

Escape:

```
document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&isOpen()) sdrClose(); });
```

Backdrop:

```
wrap.addEventListener('mousedown'? no, click, e=>{ if(e.target===wrap) sdrClose(); });
```

Close button delegation:

```
document.addEventListener('click', e=>{
  if(!isOpen())return;
  const b=e.target.closest&&e.target.closest('#case-box button');
  if(b&&(b.textContent||'').trim().toLowerCase()==='close'){ e.preventDefault(); sdrClose(); }
});
```

Observer wiring:

```
const mo=new MutationObserver(()=>{
  // phone rails
  if(sdrPhoneMQ.matches) sdrStripRails();
  // case open/close detection
  const hasContent=box&&box.querySelector('.case-actions,.bigq,table.kv,[data-copy],#case-title');
  if(hasContent&&!isOpen()) sdrOpen();
  else if(!box.childNodes.length&&isOpen()) sdrClose();
  sdrFixAria();
});
mo.observe(document.body,{childList:true,subtree:true});
```

Careful: MutationObserver on whole body with subtree fires a lot; the callbacks are cheap but sdrFixAria each time — throttle. Also opening triggers attribute changes (inert) which fire more mutations (attributes not observed — childList only, inert is attribute → no loop). Setting tabindex/role attributes → not observed. Good.

But wait: sdrOpen focuses box → focus events fine.

Potential loop: sdrOpen pushes history → no DOM mutation. OK.

However: opening when "Loading." placeholder is rendered — hasContent requires .case-actions etc., so "Loading." won't open overlay until real content. But the rebuild's openCase might render loading then content — overlay opens at content. Slight delay; acceptable. Alternatively also treat any non-empty box as open signal. If the rebuild renders into #case-box only for case sheets (likely), open on first child. But risk: if rebuild uses #case-box for something else... Original uses it only for case. I'll open on any element child (not just text) to catch Loading too? Hmm — "a reader tapped and nothing appeared to happen" was the bug; we want immediate visual response. I'll open when box has any child node. But then when close empties box → closes. And "Loading." shows in overlay — matches original behavior (original showed overlay with "Loading."). Good: open on `box.firstElementChild || box.textContent.trim()`.

Edge: initial page load — box empty → no open. Good.

Now, where does #case-box live in the rebuild? If it's inside the document flow, we must move it into our overlay at init: `wrap.appendChild(box)` — moving preserves listeners/innerHTML. Do this in init (and ensure it stays — nothing should move it back). If the rebuild's code does `el('case-box').innerHTML=...` it still works wherever it is.

If #case-box doesn't exist at init: create it inside wrap; if the rebuild later creates its own #case-box elsewhere... duplicate IDs. Handle: in observer, if there's a #case-box outside wrap (document.getElementById returns first in doc order — our wrap appended at end of body, so a rebuild-created box earlier in doc would be found first). Check: `const bx=document.getElementById('case-box'); if(bx&&bx.parentElement!==wrap){...}` — hmm, our created box also has that id inside wrap. If rebuild creates its own with same id, there'd be two; getElementById returns the first in tree order. If wrap is at end of body and rebuild's box is inside .wrap main, rebuild's box comes first → detect duplicate: `document.querySelectorAll('#case-box')` length>1 → move rebuild's content into ours? Simpler: if duplicates, merge: take the one outside wrap, move its children into the box inside wrap, remove the outside one. Then future innerHTML writes via getElementById would target... the first in order — ours is inside wrap appended to body end; the outside one removed → only one remains. But rebuild's cached reference `el("case-box")`? Original uses `el("case-box")` = getElementById each time. Rebuild likely similar. OK.

Implement merge in observer/init:

```
function sdrAdoptBox(){
  let box=wrap.querySelector('#case-box') || create...
  const others=[...document.querySelectorAll('#case-box')].filter(b=>b!==box);
  others.forEach(o=>{
    // move children
    while(o.firstChild) box.appendChild(o.firstChild);
    // copy attributes? id conflict — remove o
    o.remove();
  });
  return box;
}
```

But if the rebuild renders into a *different id* container (not #case-box), we're stuck. Given the review explicitly measured "the sheet grows the document" and mentions `.case-actions` sticky missing, and quotes original #case-box CSS, I'll bet on #case-box. Also add fallback: detect a node containing `.bigq` outside wrap and move that node into box. I'll add a light fallback:

```
const orphan=document.querySelector('.bigq');
if(orphan && !wrap.contains(orphan)){
  let card=orphan.closest('.card')||orphan.parentElement;
  // move the whole card's parent? risky
}
```

Actually the case markup isn't in a .card in the original — it's raw in #case-box with .bar.case-actions, .route, .bigq, .publish, table.kv. The card root would be the parent of .bigq that also contains .case-actions: `orphan.closest('div')`? Hard. Alternative fallback: find element that contains both a `.case-actions` and a `table.kv` and is not body/html/main/.wrap — walk up from `.case-actions` until the ancestor contains the kv table and its parent doesn't also... Overkill. I'll implement: if `.case-actions` exists outside wrap, climb from it to the shallowest ancestor that contains a `table.kv` (i.e., while(!anc.querySelector('table.kv')) anc=anc.parentElement — starting from case-actions' parent). Then move that ancestor's children into box and remove ancestor. Let me write:

```
function sdrAdoptLoose(){
  const bar=document.querySelector('.case-actions');
  if(!bar||wrap.contains(bar))return;
  let anc=bar.parentElement||bar;
  let guard=0;
  while(anc && !anc.querySelector('table.kv') && guard++<6 && anc!==document.body) anc=anc.parentElement;
  if(!anc||anc===document.body||anc===wrap)return;
  const frag=document.createDocumentFragment();
  while(anc.firstChild)frag.appendChild(anc.firstChild);
  sdrBox().appendChild(frag);
  anc.remove();
}
```

Hmm but if anc is e.g. #case-box already, then wrap.contains(bar) is false (box not yet moved) — order matters: run adoptBox-like logic. Actually if rebuild has #case-box in flow containing everything, the general path handles it: move #case-box itself into wrap. Then bar is inside wrap → adoptLoose no-op. adoptLoose only fires if no #case-box. Fine.

But wait: if rebuild re-renders case content into its old location after we removed it? It renders into #case-box (moved) or its own container (removed). If removed container is referenced by cached JS variable, writes to a detached node → content lost. Risk. To mitigate, instead of removing the ancestor, keep it but hidden? If we keep the loose container in flow, document grows again. Alternative: replace it with our box? Can't—id issues. Honestly, the #case-box path is most likely correct (rebuild surely mirrors ids since review compares id lookups). The fault literally says `document.getElementById('case-wrap')` returns null, implying the rebuild still calls getElementById('case-wrap') somewhere (probably in openCase, guarded or throwing). So the rebuild's openCase likely does `el("case-wrap").style.display="flex"` → would throw on null... but the review says the sheet renders as a card, meaning openCase ran. So the rebuild's openCase probably doesn't reference case-wrap at all, or guards. Whatever. Keep the fallback simple, prefer the #case-box path, and for loose content use the ancestor-adopt with removal (accept risk).

Hmm, actually let me reconsider: maybe the rebuild renders the case card appended to the search panel or replacing results. The document grew from 21,957 to 23,523px — 1,566px of case card. If it has #case-box id, moving it into overlay fixes growth. Good.

One more thing: "at viewport top" — when opening, set wrap.scrollTop=0. Also when reopened for a new case (stepper), scroll to top: our observer opens only when not already open; for stepper navigation within open overlay, content changes but overlay stays — should scroll to top. Add: in observer, when content changed and overlay open, also reset scrollTop? We can detect new content via a signature: compare box.firstElementChild? Simpler: on any mutation inside box while open, if box's content changed significantly... eh, just always `wrap.scrollTop=0` when we detect the content root changed. Track `lastSig = box.innerHTML.length` — cheap-ish for big strings; case sheet HTML ~10-20KB, fine at mutation rate. Or track a data attribute. I'll compute signature as `(box.querySelector('.eyebrow-k')||{textContent:''}).textContent` (the report id) — when it changes while open, scrollTop=0 and re-apply focus to box. Good and cheap.

Now, also "focus returns" — on close, return focus to lastFocus. If stepper navigation set focus to box, lastFocus remains the original opener. Fine.

aria-labelledby: set `aria-labelledby="case-title"` if `#case-title` exists else aria-label.

Also add `aria-label` fallback "Case sheet".

Now the phone rails removal function:

```
function sdrStripRails(){
  const hero=document.getElementById('hero');
  if(!hero)return;
  hero.querySelectorAll('.rail').forEach(n=>n.remove());
  // also any rail markup fragments appended directly?
}
```

Also remove if rails are outside #hero? They're inside instrument. Also maybe the rebuild renders desktop rails in a separate container? The review says ".instrument.phone, 455 phone elements, 4 .rail" — instrument has phone class, and 4 .rail inside it presumably. Query within #hero (or `.instrument`). Use `document.querySelectorAll('.instrument .rail, #hero .rail')` → just `document.querySelectorAll('#hero .rail')` plus `.instrument .rail`. I'll do `document.querySelectorAll('.rail')` restricted to inside `#hero` or `.instrument`:

```
document.querySelectorAll('#hero .rail, .instrument .rail').forEach(...)
```

But careful: at desktop this would run only when phone MQ matches, so safe.

Also idempotent + on resize: 

```
const mq=matchMedia('(max-width:760px)');
mq.addEventListener?.('change',e=>{ if(e.matches)sdrStripRails(); });
```

When switching to desktop, rebuild's resize handler redraws hero (original does; assume rebuild does). If rebuild doesn't redraw on resize... the fault would persist differently. Not our problem; also we can't restore rails we removed. Hmm — could we preserve them instead of removing: hide via CSS `.instrument.phone .rail{display:none}`? The check: "At 390px: nought .rail elements" — if the checker uses `document.querySelectorAll('.rail').length` then display:none still counts. If it uses offsetParent/visibility, hiding works. The fault text: "The original renders one or the other, never both... .rail count is nought." Safer to remove from DOM. But then desktop restore: rely on rebuild redraw on resize (the original had `addEventListener("resize",...drawHero)`; rebuild presumably kept it, since the review says "the instrument redraws on every filter change, rail switch and resize"). Yes! The prompt says: "idempotent because the instrument redraws on every filter change, rail switch and resize." So the rebuild redraws on resize — desktop restore works. 

Also when the rebuild redraws hero on desktop (rails re-added), our observer won't remove (MQ doesn't match). Good.

Also strip on init if MQ matches.

aria-labels function:

```
const SDR_ARIA={operator:"Operator",make:"Manufacturer",ata:"Aircraft system",nature:"What was found",crew:"What the crew did",condition:"Part condition",discovered:"How it was found",stage:"Stage of flight",zone:"Zone on the aircraft"};
function sdrFixAria(){
  for(const [id,lab] of Object.entries(SDR_ARIA)){
    const e=document.getElementById(id);
    if(e&&e.tagName==='SELECT'&&!e.getAttribute('aria-label')) e.setAttribute('aria-label',lab);
  }
}
```

Run at init and in observer (throttled). Throttle via requestAnimationFrame flag or just call in observer but it's cheap (9 getElementById). MutationObserver on whole body subtree fires a lot during big renders (each added node batch → one callback per batch actually; MutationObserver batches records per callback). So one callback per render batch — fine.

But careful: the observer callback also strips rails and opens case — all cheap. OK.

Also, we must not break the rebuild's existing MutationObservers — ours is separate. Fine.

Also: our observer callback runs on every mutation; the case-open check `box.firstElementChild` — but during a rebuild render of search results, box is untouched → no open. Good.

Potential problem: our sdrOpen pushes history with `?case=` derived from eyebrow. If the rebuild ALSO pushes case param (likely, since Back needs to work and review didn't flag history), our check `/[?&]case=/` prevents double push. If the rebuild pushes a different param name... unlikely.

Edge: when user presses Back while overlay open: popstate fires; rebuild's popstate handler may also run and reset filters etc. The original's handler checks case first. The rebuild's might not (case-wrap null). Our handler closes overlay. The rebuild's handler might also re-run search — acceptable? The check: "Back all close it; focus returns." Closing is what matters. But if rebuild's popstate tries `el('case-wrap').style.display` on null → now NOT null (we created it) → fine, it sets display on our overlay... wait, if rebuild's popstate does `if(el("case-wrap").style.display==="flex"){hideCase();return}` — our overlay uses class not style.display. Then rebuild's hideCase might do `el("case-wrap").style.display="none"` — harmless (we use class). But rebuild's hideCase/releaseTrap might reference its own inert tracking — probably guarded. Also rebuild's hideCase might call focus on lastFocus — fine.

Hmm, but to be safest, ALSO set `wrap.style.display` in open/close in addition to the class, so rebuild code that pokes style.display behaves: open → style.display='flex' AND class; close → style.display='none'. Then original-style CSS `#case-wrap{display:none}` and rebuild code setting style.display='flex' works. But our open is triggered by observer (content render), not by rebuild's openCase... if rebuild's openCase sets style.display='flex' on our (now existing) wrap, then overlay opens even before content! Then our observer's open is redundant but consistent. Actually that's great: if the rebuild's openCase references case-wrap (guarded?), creating the node might make the rebuild's own open/close work. But the review says it returns null — meaning rebuild code doesn't reference it (or the review just tested). If the rebuild's openCase DID reference it and it was null, openCase would throw and no card would render — but a card renders. So rebuild's openCase doesn't reference case-wrap. Therefore rebuild open/close won't touch our overlay. Fine — set both class and style anyway for robustness.

CSS: define `#case-wrap{display:none;...}` and `#case-wrap.sdr-open{display:flex}` — but if we also set inline style.display='flex', inline wins anyway. Use inline style only? The check "opens as a fixed overlay with the reference's scrim, at viewport top" — computed styles matter. Use inline style.display toggling plus the CSS block providing all the fixed/scrim props. That avoids class complexity. But "Do not declare a name the page already uses" — `#case-wrap`/`#case-box` ids: the page (rebuild) does NOT use case-wrap (returns null). case-box — the rebuild likely uses it. The instruction "Do not declare a name the page already uses" probably means JS globals/variables, not DOM ids that we must create per spec. We must create #case-wrap id (the review checks `document.getElementById('case-wrap')` presumably, and original behavior). We'll use the ids case-wrap/case-box as required by the reference. For JS function names, prefix: sdrFixOpen etc. CSS: our rules use ids — fine.

But careful with CSS: rebuild may already have `#case-box` styles (static positioning). Our CSS must win: our rules should be specific and come later — we're dropping into the rebuild; if we add a `<style>` element appended to head at runtime, it comes after existing styles → wins at equal specificity. We'll inject CSS via a style element in JS (self-contained block of "JavaScript and CSS" — CSS can be a template string injected). Or provide a `<style>` block to paste; but "self-contained block of JavaScript and CSS, dropping into the rebuild inside its IIFE" — CSS inside a JS-injected style tag is safest for ordering and single-block. I'll inject via `document.head.appendChild(style)`.

Also `box-sizing` — rebuild likely has global border-box.

Also: when overlay opens, body scroll behind? Original doesn't lock body scroll (overlay itself scrolls, overscroll-behavior:contain). Keep parity.

Also need `role="dialog"` etc. set each open (box may be re-rendered innerHTML → attributes on box persist since box element itself persists; only innerHTML changes. But if rebuild re-creates box... our adopt handles). Set attributes in sdrOpen each time.

Focus: original focuses the box after render (`setTimeout(()=>{const b=el("case-box"); if(b)b.focus()},30)`). We'll focus box (tabindex -1) on open; on content signature change while open, re-focus? That would steal focus on stepper nav — original re-focuses on each openCase. Mirror: on signature change, focus box again. Hmm, original's openCase sets `bx.focus()` each call. We'll do same on sig change.

Also Escape handler: original has one at document level calling closeCase. Add ours.

Also "a backdrop click" — click on wrap itself (target===wrap). Also mousedown on wrap + mouseup inside box? Original used onclick on wrap checking target id — simple click check. Use click with `e.target===wrap`.

Also add a close button if the action bar lacks one? If rebuild's action bar has Close (likely), skip. But ensure: if `.case-actions` exists and no button containing text 'Close', inject one. Let's add that safety:

```
function sdrEnsureClose(){
  const bar=box.querySelector('.case-actions'); if(!bar)return;
  const has=[...bar.querySelectorAll('button')].some(b=>/close/i.test(b.textContent||''));
  if(!has){const b=document.createElement('button');b.className='ghost';b.type='button';b.textContent='Close';b.addEventListener('click',sdrClose);bar.appendChild(b);}
}
```

Careful: "Copy the ... Close" — the last button is Close in original. Appending at end keeps margin-left:auto on it if we style `.case-actions button:last-child{margin-left:auto}`? Only if it's last. Our injected one is last. But if rebuild already has Close, its selector `[onclick*="closeCase"]` might not match. Add CSS: `#case-box .case-actions button:last-child{margin-left:auto}` — hmm if stepper present, last is Close anyway. But wait, original selector `[onclick*="closeCase"]` — if rebuild's Close uses addEventListener, no onclick attr. Use `:last-child` rule; if the rebuild's bar ends with Close, works. If it ends with something else... acceptable. Actually to be safe, style via `#case-box .case-actions button:last-child{margin-left:auto}` AND if we inject our Close, it gets last-child. If rebuild's bar has Close last, also works. Edge: original also had Close last. Fine.

Hmm — but our delegated click-close also catches text 'Close' — good regardless.

Also steppers: "Do not undo ... the stepper" — our patch must not break stepper buttons (they call rebuild's openCase presumably via onclick → re-render into box → our observer sees content change (sig change) → scrollTop=0, focus box). Good — but our delegated Close handler: stepper buttons' text is "‹"/"›", not Close. Good.

One risk: our delegated close listener catches ANY button whose text is exactly 'close' case-insensitive within #case-box — e.g., none other. Fine.

Also when the rebuild's own close runs and empties box: observer → box has no children → sdrClose. But the rebuild's close might not empty the box (maybe hides by removing a class on a container). Then overlay stays open after clicking its Close — but our delegated click on 'Close' text closes overlay anyway. Good.

Now also: after close via overlay (Escape etc.), should we also clear the `?case=` param / history? Original closeCase: if pushedCase → history.back(). We don't know if rebuild pushed. Our open: we pushed only if no case param. On close via Escape/backdrop/Close: mirror original — if we pushed (track flag sdrPushed), call history.back() (popstate → our handler closes; already closed → guard). Set sdrPushed=false after. If rebuild pushed, leave URL (Back will close—already closed—and popstate handler no-op). Hmm: if user opened via rebuild-pushed state, pressing Escape should probably also go back to remove the param — but we don't know. Keep simple: if we pushed, history.back(). Else just close visually (URL param remains; acceptable).

Wait, but popstate handler closing: if we called history.back() due to our close, popstate fires, handler sees overlay closed → no-op. Good.

Now the phone rails: also note the review says rebuild phone has 455 elements vs 462 — not our concern.

Also ensure our rail-stripping doesn't fight the rebuild's own paint functions that run after our removal within same tick (e.g., rebuild's drawHero does `document.querySelector('.rail.open[data-rail=when] .track')` scroll — runs synchronously during render, before our observer callback → fine).

But: what if the rebuild's phone renderer relies on desktop rails existing for event delegation? E.g., delegated `[data-take]` clicks — phone has its own data-take. Rails removed — no harm.

Another subtlety: our MutationObserver callback calls sdrStripRails which removes nodes → triggers another mutation → observer fires again → this time no rails → no removal → loop ends. Fine (one extra callback).

Also throttle heavy work? All cheap.

Also, the `.reading` elements are inside rails — removed with them. Phone has its own pcard. Good.

Now also fault 1 says at 390px the check expects "the phone layout only" — after removing rails, remaining desktop leftovers? The instrument.phone presumably contains phbar/phsections + maybe leftover desktop bits like `.sentence`, `.picker`, `.aimat` (phone includes its own .aimat inside .phextra — duplicate id iAimAt! If desktop leftovers remain, duplicate ids). The review counted elements and only flagged rails, so presumably the rebuild's drawPhone replaces innerHTML then something re-adds rails — i.e., only rails leak. Trust that.

Hmm wait, why would only rails leak? Maybe the rebuild's drawHero renders desktop rails via separate function appended after drawPhone's output, or drawPhone renders into a child. Whatever — remove `.rail`.

Should we also remove desktop-only bits like `.picker`, `.sentence`, `.seam`, `.margin`, `.hand`? The review's measurement (455 vs 462 phone elements) suggests near-parity; 4 rails ≈ rails have nested elements though (each rail has gut/track children...). If 4 top-level .rail elements were counted as elements including children, count would exceed. The reviewer counted "4 .rail" separately from element count. If rails leaked with children, phone element count would be much higher than 462. 455 < 462 — so maybe rails leak as empty shells (gutter+track minimal, ~7 elements each ≈ +28... 455+? hmm). Can't reconcile precisely; maybe desktop rails are rendered empty (just containers) in the rebuild at phone. Either way, removing `.rail` nodes handles it.

Let me also consider: maybe the rebuild renders the desktop instrument and then the phone instrument as siblings, with desktop hidden by CSS except rails leak? "455 phone elements, 4 .rail" — if the whole desktop instrument were present, .sentence/.picker/.ipad would exist and count would blow up. So no — only 4 rail nodes leak. Possibly the rebuild's drawPhone runs, then a paintSpines-like call re-renders rails into hero. Whatever.

Maybe safer: remove `#hero .rail` AND any element with class `rail` anywhere. If rebuild's phone doesn't use .rail class, safe. Do `document.querySelectorAll('.rail').forEach(remove)` when MQ matches. But `.rail` might be used by rebuild phone for something? Unlikely (original phone doesn't). OK, remove all .rail when phone MQ.

Now write the CSS block:

```css
#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;
  overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;
  padding:32px 16px;overflow:auto}
#case-wrap[data-sdr-open="1"]{display:flex}
#case-box{background:#fff;max-width:min(880px,66vw);width:100%;border-radius:12px;
  padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3);position:relative}
@media(max-width:900px){#case-box{max-width:100%}}
#case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;
  align-items:center;background:#fff;margin:-24px -28px 14px;padding:10px 28px;
  border-bottom:1px solid #e2ded5;flex-wrap:wrap}
#case-box .case-actions button:last-child{margin-left:auto}
```

Wait, sticky inside a scrolling overlay: the scroll container is #case-wrap (overflow:auto). Sticky top:0 works relative to nearest scrolling ancestor → #case-wrap. Yes, sticky works within the scroll container. 

But note: original had `align-items:flex-start` so box doesn't stretch; and `padding:32px 16px` gives top gap. At viewport top: "opens ... at viewport top" — box starts 32px from top. Reference behavior. Good.

Should I use `max-width:900px` per the quoted CSS or min(880px,66vw)? Review quoted base 900px. The check "at viewport top, at 1440, 820 and 390" — just positions. I'll use min(880px,66vw) like the original's final state? The original ends with `#case-box{max-width:min(880px,66vw)}` and media 900px → 100%. I'll implement both: base max-width:900px, then a later rule min(880px,66vw)? Just use `max-width:min(880px,66vw)` and media ≤900px `max-width:100%`. Hmm 820px viewport: media max-width:900px → 100%. 1440: min(880, 950.4)=880. 390: 100%. Good, matches original final.

Also #case-box needs `box-sizing:border-box` — rebuild global `*{box-sizing:border-box}` presumably. Include explicitly to be safe.

Also, the top offset: original also has this in later CSS: `#case-box .bar.case-actions` with margin -24px -28px 14px — negative margins pull it over the padding; sticky top:0 → sticks at very top of overlay viewport while box's rounded corners... fine, reference parity.

Also the step element etc. styles exist in rebuild presumably. Not our fault list.

Also add `.step .ghost{padding:2px 9px;min-width:30px}`? Not in fault list. Skip.

Now, "it scrolls to its last line" — with overlay overflow:auto and box auto height, the last line reachable. But sticky action bar overlays top; fine.

One more: when overlay is open and user tabs, trap handles. Also inert on siblings prevents background focus.

Also `aria-hidden` fallback where inert unsupported — modern browsers support inert. Use try/catch with setAttribute('inert','') fallback:

```
try{n.inert=true}catch(e){n.setAttribute('inert','')}
```

Setting .inert property works in modern browsers. I'll do: if ('inert' in n) n.inert=true else setAttribute.

Restore: n.inert=false / removeAttribute.

Mark with data attribute to only restore ones we set.

Now the history push: URL building — preserve existing params:

```
function sdrPush(id){
  try{
    const u=new URLSearchParams(location.search);
    if(u.get('case')===id)return;
    u.set('case',id);
    history.pushState({sdrCase:id},'','?'+u.toString());
    sdrPushed=true;
  }catch(e){}
}
```

Extract id: from `.eyebrow-k` textContent match /Report\s+(\S+)/. If not found, skip push (then Back won't be able to close without navigating away... risk). Alternative: if no id found, don't push; Back will leave page — but check requires Back closes. If rebuild already pushes (likely), fine. If rebuild doesn't push and eyebrow missing... The original's openCase pushes with the id before fetch; rebuild likely mirrors. Accept.

Actually, better: also listen for rebuild's push indirectly — nothing needed.

popstate handler:

```
addEventListener('popstate',()=>{
  if(sdrIsOpen())sdrClose(true); // fromPop: don't history.back()
});
```

sdrClose(fromPop): if !fromPop && sdrPushed → history.back() (which triggers popstate → sdrClose(true) no-op since already closing? order: we set closed before back). Implement:

```
function sdrClose(fromPop){
  if(!sdrIsOpen())return;
  sdrSetOpen(false);
  sdrInert(false);
  const lf=sdrLastFocus; sdrLastFocus=null;
  if(lf&&lf.focus&&document.contains(lf)){try{lf.focus()}catch(e){}}
  if(!fromPop&&sdrPushed){sdrPushed=false;history.back();}
}
```

history.back() triggers popstate async; our popstate handler runs sdrClose(true) → not open → return. Good.

sdrSetOpen(on): wrap.style.display = on?'flex':'none'; toggle attribute data-sdr-open for CSS; if on: wrap.scrollTop=0.

Now the open trigger: observer. Define:

```
let sdrSig='';
function sdrPoll(){
  const box=sdrBox(); if(!box)return;
  const has=box.firstElementChild||box.textContent.trim();
  const sig=(box.querySelector('.eyebrow-k')||{textContent:''}).textContent+'|'+(box.firstElementChild?1:0);
  if(has){
    if(!sdrIsOpen()){ sdrOpen(); sdrSig=sig; }
    else if(sig!==sdrSig){ sdrSig=sig; sdrWrap().scrollTop=0; try{box.focus()}catch(e){} }
    sdrEnsureClose();
  } else {
    if(sdrIsOpen())sdrClose(true);
    sdrSig='';
  }
}
```

Wait: focus on sig change — when stepper navigates, focus box. But box.focus() when activeElement is a stepper button we just clicked... original re-focuses box too. OK. But careful: focusing box on every content change including the very first open (sdrOpen focuses). Fine.

Also ensure `role="dialog"` etc. persist — set in sdrOpen; box element persists. But if rebuild recreates box element (innerHTML of a parent), attributes lost; sdrOpen re-runs only when opening... our poll: if box is a NEW element (not open) → sdrOpen sets attrs. Track box identity: store `sdrBoxEl`; in sdrBox(), if current #case-box !== sdrBoxEl → update and re-apply attrs if open. Simplify: in sdrPoll, if open, re-assert attrs cheaply? Setting attributes each poll is fine (idempotent). Actually setting aria attributes on every mutation — cheap. I'll set the dialog attrs inside sdrPoll when has content:

```
box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
box.setAttribute('aria-labelledby','case-title');box.setAttribute('tabindex','-1');
```

aria-labelledby pointing to #case-title which exists in content. Also fallback aria-label? labelledby overrides; if case-title missing, labelledby dangles — also set aria-label only if no #case-title. Do:

```
if(box.querySelector('#case-title')) box.setAttribute('aria-labelledby','case-title');
else { box.removeAttribute('aria-labelledby'); box.setAttribute('aria-label','Case sheet'); }
```

Now sdrBox(): 

```
function sdrBox(){
  let b=document.getElementById('case-box');
  if(!b){ b=document.createElement('div'); b.id='case-box'; sdrWrap().appendChild(b); }
  else if(b.parentElement!==sdrWrap()){ sdrWrap().appendChild(b); }
  return b;
}
```

Careful: appendChild moves it (re-parents). If box exists elsewhere → moved into overlay. Good. But `sdrWrap()` must exist first.

But wait: if the rebuild renders the case into some other container (not #case-box), our created empty #case-box stays empty and poll never opens — the loose-adopt fallback handles by moving content. Let me include adoptLoose as described but conservative: only when no #case-box existed originally AND a `.case-actions` exists outside wrap. Actually if #case-box didn't exist and rebuild created its own case container with different id, `.case-actions` detection is our only hook. Implement:

```
function sdrAdoptLoose(){
  if(document.getElementById('case-box'))return false; // handled by sdrBox path
  const bar=document.querySelector('.case-actions');
  if(!bar||sdrWrap().contains(bar))return false;
  let anc=bar.parentElement,guard=0;
  while(anc&&anc!==document.body&&!anc.querySelector('table.kv')&&guard++<8)anc=anc.parentElement;
  if(!anc||anc===document.body)return false;
  ...
}
```

Hmm, but if bar's parent already contains table.kv (i.e., anc=bar.parentElement), we'd move just that small div (the action bar) — wrong; we want the whole sheet. The sheet root is the common ancestor of .case-actions and .bigq/table.kv/.publish. Walk up from bar until ancestor contains .bigq AND table.kv (or .publish):

```
let anc=bar.parentElement,guard=0;
const need=s=>s==='bigq'||s==='kv';
while(anc&&anc!==document.body&&guard++<10&&!(anc.querySelector('.bigq')&&anc.querySelector('table.kv')))anc=anc.parentElement;
```

Then move anc's children into box, remove anc. But anc could be `.wrap` or main if rebuild nested weirdly — guard: anc must not be main/.wrap/body and its parent must not be body? If anc===main.wrap, moving all its children is catastrophic. Additional guard: anc shouldn't contain the search results table (#results). Check `!anc.querySelector('#results')`. If it does, bail. Also guard depth: anc should be within a few levels. I'll add: if anc contains '#results' or 'main', bail (don't break page). Given uncertainty, keep fallback but heavily guarded.

Actually — you know, thinking about it more: this is a grading exercise. The grader will run checks against a rebuild that we can't see, but the intended solution surely assumes the rebuild mirrors the original's structure closely (ids like case-box, functions openCase/closeCase). The cleanest intended solution: create #case-wrap, move #case-box into it, add overlay CSS, wire behaviors. I'll include the loose-adopt fallback guarded, low risk.

Hmm, one more consideration: the instruction "Do not declare a name the page already uses. Prefix everything." So all our functions/vars: sdr*. The ids case-wrap/case-box are DOM, and case-wrap doesn't exist; case-box might. Moving/using it is necessary, not "declaring a name". OK.

Also "using the existing helpers" — e.g., esc? We can't rely; avoid needing them. Use own mini-esc if needed (we don't inject HTML with user data except maybe nothing). We don't need esc.

Also the tab ids / h1s / phone renderer / stepper — don't touch.

Now, our drop-in placement "inside its IIFE" — we'll write an IIFE-within (or just plain code since it's already inside theirs). I'll wrap in an IIFE for safety and run init on DOMContentLoaded or immediately if ready.

Also multiple inits: guard with a flag on window (e.g., if(window.__sdrPatchApplied)return). Fine.

Let me also double check fault 3 wording list — the nine selects with exact labels:

#operator Operator; #make Manufacturer; #ata Aircraft system; #nature What was found; #crew What the crew did; #condition Part condition; #discovered How it was found; #stage Stage of flight; #zone Zone on the aircraft.

Also "Twenty-two selects with an aria-label" — other selects presumably already labeled in rebuild (13 labeled). Our patch adds 9 → 22. But we must ensure we don't add labels to selects that already have aria-label (guard) — but what if the rebuild's 13 labeled include some of these 9 with different labels? Guard with "if not already set" prevents overwrite. But if a select has a label but it's wrong... not our concern.

Wait — also there's `#cmp-field`? original: `<select id="cmp-field" aria-label="What to compare">` — labeled. `#spike-by` labeled. `#em-by`, `#em-days`, `#cl-min`, `#cl-kind`, `#ag-by`, `#cq-by`, `#fl-op` labeled. `#aimKind` labeled. `#qlist` is datalist. Also `.filters .fld` labels wrap from/to as <label> elements — from/to are inputs not selects. OK.

Hmm, also careful: if the rebuild's #make is a select (original: select). Yes.

Edge: `#operator` might be a select; guard tagName==='SELECT' as I wrote. Actually if rebuild made it an input with list, aria-label still valid on input — but fault says selects. Keep the guard loose: apply to any element with the id if no aria-label? The check counts selects with aria-label. If #operator in rebuild is a select, fine. I'll apply regardless of tag (setting aria-label on input harmless). But to avoid weirdness, apply to any element found. OK.

Now the observer: observing document.body subtree childList — fires during initial boot render. Init timing: our script runs inside rebuild IIFE presumably after the main code? "dropping into the rebuild inside its IIFE" — likely at the end. boot() may already have run or be async. Our init: run immediately (DOM may be partially there), observer catches the rest. Also run sdrStripRails + sdrFixAria + sdrPoll at init and on 'load'.

Also handle MQ change without addEventListener (older Safari): also keep the resize-based? Rebuild redraws on resize anyway → observer strips. Add mq.addEventListener if available.

Also initial: if at 390 and hero already rendered with rails before our observer attaches — we call sdrStripRails() in init. Good.

One more thing about fault 1: should we also prevent the rebuild from rendering rails at phone in the first place (not just strip)? Stripping after render is sufficient for the check and visually. Also strip on every observer callback (cheap: querySelectorAll when MQ matches).

Perf: `document.querySelectorAll('.rail')` on every mutation batch — fine.

Now, also consider: when phone MQ matches and we remove rails, the rebuild's `syncControls()` etc. might reference `[data-take]` inside rails — they query `box.querySelectorAll("[data-take]")` — fine with none.

Also `paintSpines` references spine rows — unrelated.

Write the code now.

```js
/* ---- review fixes: phone/rails, case overlay, select labels ---- */
(function(){
if (window.__sdrReviewFixes) return; window.__sdrReviewFixes = true;

var PHONE = window.matchMedia('(max-width:760px)');
var wrap = null, box = null, lastFocus = null, pushed = false, sig = '';

function stripRails(){
  if (!PHONE.matches) return;
  document.querySelectorAll('.rail').forEach(function(n){ n.remove(); });
}

function fixLabels(){
  var L = {operator:'Operator', make:'Manufacturer', ata:'Aircraft system',
    nature:'What was found', crew:'What the crew did', condition:'Part condition',
    discovered:'How it was found', stage:'Stage of flight', zone:'Zone on the aircraft'};
  Object.keys(L).forEach(function(id){
    var e = document.getElementById(id);
    if (e && !e.getAttribute('aria-label')) e.setAttribute('aria-label', L[id]);
  });
}

function ensureWrap(){
  wrap = document.getElementById('case-wrap');
  if (!wrap){ wrap = document.createElement('div'); wrap.id = 'case-wrap'; document.body.appendChild(wrap); }
  box = document.getElementById('case-box');
  if (!box){ box = document.createElement('div'); box.id = 'case-box'; wrap.appendChild(box); }
  else if (box.parentElement !== wrap) wrap.appendChild(box);
  // a rebuild that rendered the sheet without a box: adopt it
  if (!box.firstElementChild){
    var bar = document.querySelector('.case-actions');
    if (bar && !wrap.contains(bar)){
      var anc = bar.parentElement, guard = 0;
      while (anc && anc !== document.body && guard++ < 10 &&
             !(anc.querySelector('.bigq') && anc.querySelector('table.kv'))) anc = anc.parentElement;
      if (anc && anc !== document.body && anc !== wrap && !anc.querySelector('#results') && !anc.querySelector('main')){
        var frag = document.createDocumentFragment();
        while (anc.firstChild) frag.appendChild(anc.firstChild);
        box.appendChild(frag);
        anc.remove();
      }
    }
  }
  return wrap;
}
```

Hmm, wait: the adopt runs each poll — condition `!box.firstElementChild` guards. But if box is empty and no .case-actions → skip. OK.

Open/close:

```
function isOpen(){ return wrap && wrap.getAttribute('data-sdr-open') === '1'; }
function setOpen(on){
  if (!wrap) return;
  wrap.setAttribute('data-sdr-open', on ? '1' : '0');
  wrap.style.display = on ? 'flex' : 'none';
  if (on) wrap.scrollTop = 0;
}
function applyInert(on){
  Array.prototype.forEach.call(document.body.children, function(n){
    if (n === wrap || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'LINK' || n.tagName === 'NOSCRIPT') return;
    if (on){
      if (!n.hasAttribute('data-sdr-inert')){
        n.setAttribute('data-sdr-inert', '1');
        if ('inert' in n) n.inert = true; else n.setAttribute('inert', '');
      }
    } else if (n.hasAttribute('data-sdr-inert')){
      n.removeAttribute('data-sdr-inert');
      if ('inert' in n) n.inert = false; else n.removeAttribute('inert');
    }
  });
}
```

Wait — inerting all body children includes `.wrap` (main content) — good. Includes #tip — original did too. Includes our own wrap? excluded. OK.

Hmm, careful: `document.body.children` includes the `<script>` tags? Scripts typically in body — excluded by tag check. Good.

openCase behaviors:

```
function openSheet(){
  lastFocus = document.activeElement;
  box.setAttribute('role','dialog');
  box.setAttribute('aria-modal','true');
  box.setAttribute('tabindex','-1');
  if (box.querySelector('#case-title')) box.setAttribute('aria-labelledby','case-title');
  else { box.removeAttribute('aria-labelledby'); box.setAttribute('aria-label','Case sheet'); }
  setOpen(true);
  applyInert(true);
  setTimeout(function(){ try{ box.focus(); }catch(e){} }, 30);
  var m = (box.querySelector('.eyebrow-k')||{textContent:''}).textContent.match(/Report\s+([^\s|]+)/);
  if (m && !pushed){
    var u = new URLSearchParams(location.search);
    if (u.get('case') !== m[1]){
      u.set('case', m[1]);
      try{ history.pushState({sdrCase:m[1]}, '', '?'+u.toString()); pushed = true; }catch(e){}
    }
  }
}
function closeSheet(fromPop){
  if (!isOpen()) return;
  setOpen(false);
  applyInert(false);
  var lf = lastFocus; lastFocus = null;
  if (lf && lf.focus && document.contains(lf)){ try{ lf.focus(); }catch(e){} }
  if (!fromPop && pushed){ pushed = false; history.back(); }
}
```

Wait: history.back() when pushed by us; the popstate handler will call closeSheet(true) — already closed, no-op. Good. But note: `pushed` should only be true if WE pushed. If rebuild pushed the case param, `u.get('case')===m[1]` → we don't push, pushed stays false → closeSheet won't go back. Then URL keeps ?case= after Escape-close. Acceptable; Back from there leaves page (rebuild's state). Hmm — the check "Back closes it": with overlay open and rebuild having pushed, pressing Back → popstate → our handler closes. Good, that's the primary path.

Ensure close button:

```
function ensureClose(){
  var bar = box.querySelector('.case-actions'); if (!bar) return;
  var has = Array.prototype.some.call(bar.querySelectorAll('button'), function(b){ return /close/i.test(b.textContent||''); });
  if (!has){
    var b = document.createElement('button');
    b.type='button'; b.className='ghost'; b.textContent='Close';
    b.addEventListener('click', function(){ closeSheet(false); });
    bar.appendChild(b);
  }
}
```

Poll:

```
function poll(){
  ensureWrap();
  var has = box.firstElementChild || (box.textContent||'').trim();
  var s = ((box.querySelector('.eyebrow-k')||{textContent:''}).textContent) + '|' + (has?1:0);
  if (has){
    if (!isOpen()){ sig = s; openSheet(); }
    else if (s !== sig){ sig = s; setOpen(true); try{box.focus();}catch(e){} }
    ensureClose();
  } else if (isOpen()){ sig=''; closeSheet(true); }
}
```

Hmm `setOpen(true)` on sig change resets scrollTop — yes setOpen does scrollTop=0. And focus box. Good.

But one problem: ensureClose runs every poll — appending close button triggers mutation → poll again → has → fine, converges.

Potential infinite loop: poll → openSheet pushes history (no DOM change). ensureClose appends button → mutation → poll → sig same, open, ensureClose finds button → no append. Converges. Good.

Backdrop & escape & click-close:

```
wrap.addEventListener('click', function(e){ if (e.target === wrap) closeSheet(false); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) closeSheet(false); });
document.addEventListener('click', function(e){
  if (!isOpen()) return;
  var b = e.target && e.target.closest ? e.target.closest('#case-box button') : null;
  if (b && /^close$/i.test((b.textContent||'').trim())){ e.preventDefault(); closeSheet(false); }
});
window.addEventListener('popstate', function(){ if (isOpen()) closeSheet(true); });
```

Hmm: the delegated Close click — also our ensureClose button has direct listener; both fire → closeSheet runs twice; second no-op (not open). Fine.

But wait: if the rebuild's Close button says "Close" and triggers rebuild close which empties box → our poll closes too. Fine.

Focus trap:

```
wrap.addEventListener('keydown', function(e){
  if (e.key !== 'Tab') return;
  var f = Array.prototype.filter.call(
    box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),
    function(x){ return x.offsetParent !== null; });
  if (!f.length) return;
  var first = f[0], last = f[f.length-1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});
```

Note: inert on siblings already prevents tabbing out in supporting browsers; trap is belt & braces.

CSS injection:

```
var css = '...';
var st = document.createElement('style'); st.id='sdr-review-fixes-css'; st.textContent = css;
document.head.appendChild(st);
```

CSS content:

```
#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
#case-wrap[data-sdr-open="1"]{display:flex}
#case-box{box-sizing:border-box;background:#fff;width:100%;max-width:min(880px,66vw);border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
@media(max-width:900px){#case-box{max-width:100%}}
#case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid #e2ded5;flex-wrap:wrap}
#case-box .case-actions button:last-child{margin-left:auto}
```

Wait — sticky + negative margin: the bar's sticky top:0 within scrolling #case-wrap. But since the bar is inside #case-box which is inside the scroll container, sticky top:0 sticks relative to the scrollport. The bar will stick at the very top of the viewport (over the 32px padding area). That matches original (padding is on overlay; sticky element sticks to viewport top). Yes, in original the sticky bar sticks to top of the scroll container's visible area = viewport top. Good.

But note `flex-wrap:wrap`? Original case-actions CSS: `display:flex; gap:8px; align-items:center; background:#fff; margin:-24px -28px 14px; padding:10px 28px; border-bottom:1px solid var(--line)` — no flex-wrap. The generic `.bar` class has flex-wrap:wrap in original. I'll add flex-wrap:wrap for safety on small screens (5 buttons + stepper need it at 390px). The original .bar provides wrap; our rule should include it since we redefine .bar.case-actions? We don't redefine .bar (rebuild has it presumably); our more specific rule sets position sticky etc. and could override .bar's flex props if rebuild's .bar exists — our rule doesn't set display/gap... wait I wrote display:flex;gap:8px in our rule, duplicating .bar. If rebuild's `.bar` exists, fine. If rebuild's case sheet lacks `.bar` class... the review mentioned "action bar" — likely `.bar.case-actions`. Our rule includes display:flex;gap:8px;align-items:center;flex-wrap:wrap to be self-sufficient. Good.

Also at 390px: padding 24px 28px on box; case-actions negative margins match. Fine.

One more: `#case-box{max-width:min(880px,66vw)}` — but the check says "with the reference's scrim" — scrim = rgba(12,16,22,.72). Good.

Also z-index 60; the #tip has z-index 99 — tooltip above overlay; fine.

Init:

```
function init(){
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
  ensureWrap();
  stripRails(); fixLabels(); poll();
  if (PHONE.addEventListener) PHONE.addEventListener('change', function(e){ if (e.matches) stripRails(); });
  var mo = new MutationObserver(function(){
    stripRails(); fixLabels(); poll();
  });
  mo.observe(document.body, {childList:true, subtree:true});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
```

Hmm: MutationObserver calling poll on EVERY mutation — poll does ensureWrap (getElementById x2, querySelector for eyebrow...) — cheap. But poll → openSheet on first case render; fine.

One concern: `stripRails` inside the observer when a desktop render happens at phone width mid-redraw: rebuild's drawHero renders phone, then desktop rails appended (the leak) → our observer strips. But what if the rebuild renders rails and THEN more phone content in a later task, and some rebuild code between queries rails (e.g., paintSpines reads months)? Guarded queries; fine.

Another: the observer fires during our own DOM changes (removing rails, appending wrap at init) → recursion depth 1. Fine.

Also: `fixLabels` on every mutation — 9 getElementById — trivial.

Edge: The check "nought .rail elements" at 390 — also ensure we run after rebuild's boot renders hero. boot is async (fetches). Observer catches. Also on window load, run again. Add `window.addEventListener('load', function(){stripRails();fixLabels();poll();})`.

Also possible: rebuild renders hero rails with class `rail open` etc. Covered by `.rail`.

Now about `#case-wrap` display none default: our CSS sets display:none; inline style set by setOpen. Initially (no inline style), CSS display:none → hidden. Good; also review checks `document.getElementById('case-wrap')` non-null now.

Also — the poll opens the sheet as soon as ANY child appears in #case-box. What if the rebuild's #case-box is a persistent container that holds something at all times (e.g., a hidden placeholder)? Then overlay would open at load. Hmm. Original's #case-box starts empty. If the rebuild reuses the id for its inline card container, it starts empty too. Risk small. Could gate open on a stronger signature: presence of `.case-actions` OR `.bigq` OR `table.kv`. But then "Loading." wouldn't open overlay — the original shows overlay with "Loading." — minor UX, check doesn't test it. But safety against false-open is more valuable? If rebuild's box contains a placeholder at boot, overlay opens covering page = disaster. Use stronger gate: open when box contains an element matching `.case-actions, .bigq, table.kv, [data-copy], #case-title, .publish, .route`. That's robust. Then close when none of those present AND box emptied? For close detection (rebuild close empties box) → none present → close. But what if rebuild close just hides content via display:none? Then selector still matches (querySelector matches regardless of display). Overlay would stay open with hidden content — but our delegated 'Close' click closes anyway, and Escape works. Fine.

Let me use: `var CASE_MARK='.case-actions,.bigq,table.kv,[data-copy],.publish,.route,#case-title';`

poll:

```
var marked = box.querySelector(CASE_MARK);
if (marked){ ...open/stick... } else if (isOpen() && !box.firstElementChild){ closeSheet(true); }
```

Hmm, close condition: only close when box is empty (rebuild cleared it) — not when marked missing but other content present? If rebuild replaced content with "Loading." for the NEXT case (stepper), box has text but no marks — we shouldn't close (should stay open showing Loading). Original keeps overlay open during load. So: close only when box empty. Keep: `else if (isOpen() && !(box.firstElementChild||box.textContent.trim())) closeSheet(true);`

Also if stepper nav: marked present again → sig change → scrollTop reset + focus. Sig uses eyebrow text; during loading, eyebrow absent → sig=''... transitions: old sig 'Report X|1' → loading '' → new 'Report Y|1'. On loading (no marks, but content) → our `if(marked)` false → we skip sig update; then new content arrives → sig changes → reset. Good.

Let me now also double-check the inert + focus return test: "focus returns" — on close, focus lastFocus. If lastFocus was inside inerted region — we un-inert before focusing. Order in closeSheet: setOpen(false), applyInert(false), then focus. Good. But lastFocus might be a removed element (e.g., results re-rendered) → document.contains check → skip. Acceptable.

Also `applyInert` uses `n.hasAttribute` — for element nodes fine.

One more subtlety: our observer also fires for mutations caused by the rebuild's search render — poll checks marks in box — cheap querySelector. Fine.

Also: while overlay open and user presses Back: rebuild's popstate handler (if exists) may also run — could reset filters and re-render, causing box to remain? Our closeSheet(true) already closed. Fine.

Also: our openSheet pushState — pushes with full current query params + case. If rebuild already pushed case earlier with same id, skip. If rebuild pushed a DIFFERENT id (unlikely mismatch)... skip only if equal; else we push again → two entries. Edge, accept.

Also `history.pushState` may throw in sandboxed iframes (some preview environments) — wrapped in try/catch. Good — but then Back won't close via history; still Escape/Close/backdrop work, and the check for Back... if pushState fails, nothing we can do.

Also: should closeSheet(false) after our own push call history.back()? That pops the pushed entry → URL reverts → popstate → closeSheet(true) no-op. Good.

But careful: if the rebuild ALSO pushed (we skipped our push), pushed=false → we don't back() — overlay closes visually, URL keeps ?case. Then Back → popstate → rebuild's handler might try reopen? If rebuild's popstate checks case param and calls openCase... then overlay would reopen! Original's popstate: `if(el("case-wrap").style.display==="flex"){pushedCase=false;hideCase();return}` — checks overlay open FIRST. But rebuild's case-wrap is now OUR overlay with style.display='none' after close → rebuild's check false → proceeds to reset filters per case param?? The original popstate then reads params and runs search. If URL still has ?case=... the original popstate handler doesn't reopen case based on param (only boot does). The rebuild presumably mirrors. So Back after Escape-close: popstate → rebuild handler resets filters (harmless-ish). The check "Back closes it" is tested presumably with overlay open → Back → closes. Our handler does that. 

Also — while open, the rebuild's popstate handler might run BEFORE or AFTER ours (registration order). If rebuild's runs first and does heavy stuff, ours still closes. Fine.

Now, one more thought on fault 1: maybe better to also hide rails via CSS as defense-in-depth? If checker counts DOM elements, removal needed. Removal is what we do.

Also — the phone MQ in original is `max-width:760px` (isPhone). Review measured at 390px. Use 760.

Double-check fault 3 count: 13 + 9 = 22. 

Also ensure we don't label `#qlist` (datalist) — not in our map.

Now also think: "using the existing helpers" — we can't; fine.

Let me also handle: the rebuild might place the case card INSIDE a panel that our adopt would wrongly move if #case-box missing... heavily guarded, fine.

Also: should our CSS hide scrollbars of body behind overlay? No, original doesn't.

Write final code neatly with comments minimal ("Explain only what you changed" — in prose after code? The answer format: "One self-contained block of JavaScript and CSS... Explain only what you changed. No preamble." So output the code block, then a short explanation of the three fixes. I'll put the code first, then brief explanation.)

Also the CSS: inject via JS so it lands after the rebuild's styles. But the deliverable is "a block of JavaScript and CSS" — I can embed CSS as a JS string injected into a <style>. That's cleanest for a single drop-in.

Let me also consider specificity conflicts: rebuild may have `#case-box .bar.case-actions` static (review said static action bar exists) — meaning rebuild HAS that selector without position:sticky, or with position:static. Our rule sets position:sticky — equal specificity (#id .class.class vs #id .bar.case-actions) — later wins → our injected style is appended to head at init time... but if the rebuild injects ITS styles dynamically AFTER our init (unlikely; rebuild CSS is static in head), ours appended last wins. If rebuild's style tag comes later in DOM... Rebuild CSS is in its <head> statically presumably. Our injected style appended to head end → after. Good. To be extra safe, add `position:sticky!important`? Avoid !important; instead bump specificity: `#case-wrap #case-box .bar.case-actions{position:sticky;...}` — higher specificity than `#case-box .bar.case-actions`. Use that for the sticky rule. Similarly for #case-box overlay props: rebuild might have `#case-box{position:static;margin:...}` — our `#case-wrap #case-box` beats `#case-box`. Use `#case-wrap #case-box` for the box rule. And base `#case-wrap` styles: rebuild has none (id absent) — but to beat potential `.panel` etc., fine.

Also the box's padding/margins: if rebuild had margins on the card (in-flow), our rule sets margin? In flex overlay, margin auto? Set `margin:0` explicitly in our rule to neutralize. Add `margin:0`.

Also add `flex:none`? Box with width:100% inside flex container with align-items:flex-start: width 100% of container minus padding — good.

Let me also set `#case-wrap:not([data-sdr-open="1"]){display:none}` — redundant.

Also, `overscroll-behavior:contain` included.

One more: "it scrolls to its last line" — with sticky bar and box padding, fine.

Also at 390px, the check "at viewport top" — the box's top at 32px (padding). Original behavior identical. Good.

Now consider: the review says at 390px the sheet "opened 5,693px above the viewport" — fixed with fixed positioning. Yes.

Also — while the overlay is open, the document behind still 23,523px? After moving box into overlay, the document shrinks back (box removed from flow). Good.

Also, we should scroll the overlay to top when opening — done in setOpen(true).

Also, one thing: the original's overlay had `onclick="if(event.target.id==='case-wrap')closeCase()"` on the wrap. Our click listener: e.target===wrap → close. Also if rebuild's inner content has margins creating gaps — clicking scrim hits wrap. Good.

Now write the explanation briefly:

1. Phone: strip `.rail` nodes whenever ≤760px, via MutationObserver so it survives every redraw.
2. Case sheet: create #case-wrap overlay, move #case-box into it, reference scrim/geometry CSS, sticky action bar, open on render/close on clear via observer, Escape, backdrop, delegated Close, focus trap with inert siblings, focus return, history push/back.
3. aria-labels: the nine missing selects get the reference wording, only when unset, re-applied after redraws.

Let me also double check the "Do not undo the phone renderer, the stepper, the tab ids or the h1s" — we don't touch those. The stepper buttons inside case-box remain functional; our sig-change reset scroll helps them.

Potential conflict: rebuild may have its own Escape handler calling its closeCase which might do something weird like clearing filters — can't help.

Also: "idempotent because the instrument redraws on every filter change, rail switch and resize" — our observers keep state consistent.

One more risk: our `poll()` runs on every mutation and calls `ensureWrap()` which does `document.getElementById('case-wrap')` and possibly `wrap.appendChild(box)` — appendChild of an already-child node is a no-op? Actually appendChild on an already-parented node still removes+re-appends → generates mutation records → observer loop! Guard: only append if `box.parentElement !== wrap`. I have that check for the existing-box branch; for created box, we append once (new node). Good. But also `ensureWrap` re-queries each time — fine.

Also `wrap` variable could go stale if something removes it — re-query each poll. I re-query in ensureWrap each call: `wrap=document.getElementById('case-wrap') || create`. Fine.

Also careful: in ensureWrap, if box exists but is inside wrap already, skip. If box was removed by rebuild and recreated elsewhere, we re-adopt. Good.

Let me also handle: `setOpen` sets inline display; also set `data-sdr-open` attribute. CSS uses both.

Also `poll` early-exit if no box and nothing to do — ensureWrap creates them lazily; creating #case-wrap/#case-box at boot even when never used — harmless (matches original DOM).

Now, the `sig` also should include a hash of eyebrow only — stepper between two reports with same eyebrow? eyebrow includes control number — unique. Good.

Write it.

Also small thing: `stripRails` — also remove `#hero .rail` fragments that might be top-level like `.rails` container left empty — harmless.

Should we also remove the `.rails` wrapper? Empty div, invisible. Fine.

Also, do we need to remove `.rail` elements when the rebuild renders them OUTSIDE #hero (e.g., directly under .instrument)? `document.querySelectorAll('.rail')` covers all. But what if rebuild's phone layout legitimately uses class 'rail'? Original phone doesn't. Risk accepted (MQ-gated).

Final code assembly. Also add a guard so our click-delegation doesn't interfere with rebuild's buttons other than Close.

Also for the case where the rebuild's action bar exists but its Close button is wired to rebuild's closeCase which does NOT empty box: our delegated handler closes the overlay. Good.

Let me now also think about whether opening should happen even without marks, when box gets ANY content — reconsider "Loading.": rebuild's openCase probably sets 'Loading.' then fetches. With mark-gating, overlay appears only after data arrives (maybe 100-300ms). The check "opens as a fixed overlay... at viewport top" tested after open completes presumably. Fine.

Edge: what if rebuild renders the case sheet into a container that also contains other stuff permanently (like appending each open)? Marks present → open; content grows — fine.

Now the final answer structure: code block + short explanation of changes per fault. Keep explanation tight.

Let me write the CSS string carefully (escape backticks? use regular string concatenation or template literal — template literal fine).

CSS:

```css
#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
#case-wrap[data-sdr-open="1"]{display:flex}
#case-wrap #case-box{box-sizing:border-box;background:#fff;width:100%;max-width:min(880px,66vw);margin:0;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
@media(max-width:900px){#case-wrap #case-box{max-width:100%}}
#case-wrap #case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid #e2ded5}
#case-wrap #case-box .case-actions button:last-child{margin-left:auto}
```

Wait: original action bar selector `[onclick*="closeCase"]{margin-left:auto}` — using :last-child assumes Close is last. If rebuild's bar ends with something else (e.g., it appends our injected Close last → works). If rebuild has Close last already → works. If the stepper is last... unlikely. Keep, plus our delegated close covers function.

Hmm, but also: if the rebuild's bar has MORE buttons after Close? No.

Also the `--line` var may exist in rebuild; use literal #e2ded5 (original's --line). Fine.

JS final:

```js
/* ---- review fixes: phone rails, case-sheet overlay, select labels -------- */
  if (window.__sdrReviewFix) return;
  window.__sdrReviewFix = true;

  var PHONE = window.matchMedia("(max-width:760px)");
  var CASE_MARK = ".case-actions,.bigq,table.kv,[data-copy],.publish,.route,#case-title";
  var wrap = null, box = null, lastFocus = null, pushed = false, sig = null;

  /* 1. below 760px the phone renderer owns the instrument: take the four desktop
        rails back out of the DOM, whatever redraw put them there */
  function stripRails(){
    if (!PHONE.matches) return;
    var n;
    while ((n = document.querySelector("#hero .rail, .instrument .rail"))) n.parentNode.removeChild(n);
  }
```

Hmm, loop with while and querySelector removing one at a time — or querySelectorAll forEach. forEach fine.

Continue:

```js
  /* 3. the nine selects the rebuild shipped without an aria-label */
  var LABELS = {operator:"Operator", make:"Manufacturer", ata:"Aircraft system",
    nature:"What was found", crew:"What the crew did", condition:"Part condition",
    discovered:"How it was found", stage:"Stage of flight", zone:"Zone on the aircraft"};
  function fixLabels(){
    for (var id in LABELS){
      var e = document.getElementById(id);
      if (e && !e.getAttribute("aria-label")) e.setAttribute("aria-label", LABELS[id]);
    }
  }

  /* 2. the case sheet is a dialog: a fixed overlay that owns the scroll, with the
        card inside it — rebuilt from the reference's own geometry */
  function ensureWrap(){
    wrap = document.getElementById("case-wrap");
    if (!wrap){ wrap = document.createElement("div"); wrap.id = "case-wrap"; document.body.appendChild(wrap); }
    box = document.getElementById("case-box");
    if (!box){ box = document.createElement("div"); box.id = "case-box"; wrap.appendChild(box); }
    else if (box.parentElement !== wrap) wrap.appendChild(box);
    adoptLoose();
  }
  /* if the rebuild rendered a sheet with no #case-box at all, lift the whole card
     into the overlay rather than leave it growing the page */
  function adoptLoose(){
    if (box.firstElementChild) return;
    var bar = document.querySelector(".case-actions");
    if (!bar || wrap.contains(bar)) return;
    var anc = bar.parentElement, guard = 0;
    while (anc && anc !== document.body && guard++ < 10 &&
           !(anc.querySelector(".bigq") && anc.querySelector("table.kv")))
      anc = anc.parentElement;
    if (!anc || anc === document.body || anc === wrap || anc.contains(document.getElementById("results"))) return;
    var frag = document.createDocumentFragment();
    while (anc.firstChild) frag.appendChild(anc.firstChild);
    box.appendChild(frag);
    anc.parentNode.removeChild(anc);
  }
```

Hmm `anc.contains(document.getElementById("results"))` — if anc IS results' ancestor like .wrap main → contains #results → bail. Good.

```js
  function isOpen(){ return !!(wrap && wrap.getAttribute("data-sdr-open") === "1"); }
  function setOpen(on){
    if (!wrap) return;
    wrap.setAttribute("data-sdr-open", on ? "1" : "0");
    wrap.style.display = on ? "flex" : "none";
    if (on) wrap.scrollTop = 0;
  }
  function applyInert(on){
    Array.prototype.forEach.call(document.body.children, function(n){
      if (n === wrap || /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(n.tagName)) return;
      if (on){
        if (!n.hasAttribute("data-sdr-inert")){
          n.setAttribute("data-sdr-inert", "1");
          if ("inert" in n) n.inert = true; else n.setAttribute("inert", "");
        }
      } else if (n.hasAttribute("data-sdr-inert")){
        n.removeAttribute("data-sdr-inert");
        if ("inert" in n) n.inert = false; else n.removeAttribute("inert");
      }
    });
  }
  function openSheet(){
    lastFocus = document.activeElement;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("tabindex", "-1");
    if (box.querySelector("#case-title")) box.setAttribute("aria-labelledby", "case-title");
    else { box.removeAttribute("aria-labelledby"); box.setAttribute("aria-label", "Case sheet"); }
    setOpen(true);
    applyInert(true);
    setTimeout(function(){ try { box.focus(); } catch(e){} }, 30);
    /* Back closes the sheet, as in the reference — push only if the rebuild did not */
    var m = ((box.querySelector(".eyebrow-k") || {}).textContent || "").match(/Report\s+(\S+)/);
    if (m){
      var u = new URLSearchParams(location.search);
      if (u.get("case") !== m[1]){
        u.set("case", m[1]);
        try { history.pushState({sdrCase: m[1]}, "", "?" + u.toString()); pushed = true; } catch(e){}
      }
    }
  }
  function closeSheet(fromPop){
    if (!isOpen()) return;
    setOpen(false);
    applyInert(false);
    var lf = lastFocus; lastFocus = null;
    if (lf && lf.focus && document.contains(lf)) try { lf.focus(); } catch(e){}
    if (!fromPop && pushed){ pushed = false; history.back(); }
  }
  function ensureClose(){
    var bar = box.querySelector(".case-actions"); if (!bar) return;
    var has = Array.prototype.some.call(bar.querySelectorAll("button"),
      function(b){ return /close/i.test(b.textContent || ""); });
    if (!has){
      var b = document.createElement("button");
      b.type = "button"; b.className = "ghost"; b.textContent = "Close";
      b.addEventListener("click", function(){ closeSheet(false); });
      bar.appendChild(b);
    }
  }
  function poll(){
    ensureWrap();
    var marked = box.querySelector(CASE_MARK);
    var s = ((box.querySelector(".eyebrow-k") || {}).textContent || "") + "|" + (marked ? 1 : 0);
    if (marked){
      if (!isOpen()){ sig = s; openSheet(); }
      else if (s !== sig){ sig = s; setOpen(true); try { box.focus(); } catch(e){} }
      ensureClose();
    } else if (isOpen() && !(box.firstElementChild || (box.textContent || "").trim())){
      sig = null; closeSheet(true);
    }
  }
```

Listeners:

```js
  /* the four ways out, and the two ways in */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && isOpen()) closeSheet(false);
  });
  document.addEventListener("click", function(e){
    if (!isOpen()) return;
    var b = e.target && e.target.closest ? e.target.closest("#case-box button") : null;
    if (b && /^close$/i.test((b.textContent || "").trim())){ e.preventDefault(); closeSheet(false); }
  });
  window.addEventListener("popstate", function(){ if (isOpen()) closeSheet(true); });

  function init(){
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    ensureWrap(); stripRails(); fixLabels(); poll();
    if (PHONE.addEventListener) PHONE.addEventListener("change", function(e){ if (e.matches) stripRails(); });
    new MutationObserver(function(){ stripRails(); fixLabels(); poll(); })
      .observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("load", function(){ stripRails(); fixLabels(); poll(); });
})();
```

Wait — focus trap listener needs attaching (wrap persists, attach in init after ensureWrap... but wrap could be recreated? ensureWrap reuses existing id element; if removed and recreated, listener lost. Attach trap via delegation on document instead: keydown Tab, if isOpen and target inside/related... Simpler: document-level Tab handler when open:

```js
document.addEventListener("keydown", function(e){
  if (e.key !== "Tab" || !isOpen()) return;
  var f = Array.prototype.filter.call(
    box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),
    function(x){ return x.offsetParent !== null; });
  if (!f.length){ e.preventDefault(); box.focus(); return; }
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
});
```

Note: with inert applied, browser won't move focus outside anyway; trap covers non-inert browsers. Also if activeElement is box itself (tabindex -1) → Tab moves to first focusable naturally. OK.

Backdrop click: document-level: `if(isOpen() && e.target === wrap) closeSheet(false)` — wrap persists? use document.getElementById each time. Do:

```js
document.addEventListener("click", function(e){
  if (!isOpen()) return;
  if (e.target === wrap) { closeSheet(false); return; }
  ...
});
```

Combine into one click handler.

Also mousedown-then-drag-release on scrim → click target still wrap if both down/up on wrap. Fine.

CSS constant:

```js
var CSS = [
"#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}",
"#case-wrap[data-sdr-open='1']{display:flex}",
"#case-wrap #case-box{box-sizing:border-box;background:#fff;width:100%;max-width:min(880px,66vw);margin:0;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-wrap #case-box{max-width:100%}}",
"#case-wrap #case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid #e2ded5}",
"#case-wrap #case-box .case-actions button:last-child{margin-left:auto}"
].join("\n");
```

Hmm attribute selector quoting inside a JS double-quoted string: `data-sdr-open='1'` with single quotes fine.

One concern: `#case-wrap{display:none}` + inline style set only when opened/closed. Initially wrap has no inline style → CSS none. Good.

Another: the rebuild might position #case-box statically with its own margins — we override with margin:0 in #case-wrap #case-box. Good.

Also: after we move #case-box into overlay at init, if the rebuild later does `someParent.appendChild(box)`... unlikely.

Also — the `.route`, `.publish`, etc. styles: rebuild presumably has them (it rendered the card). Fine.

Now, about poll triggering openSheet which sets attributes → attribute mutations not observed (childList only) → no loop. ensureClose appends button → childList mutation → poll → marked, sig same, ensureClose no-op. Converged.

But there's a subtle loop risk: poll → openSheet → nothing. poll → closeSheet → setOpen changes attribute + style — attribute, not observed. OK.

stripRails removal → childList mutation → poll again → nothing. OK.

One more: `fixLabels` sets attributes → not observed. Good.

Potential perf: observer callback does several querySelectors per mutation batch — during big table renders (100 rows, many batches), each batch → callback → ~6 queries. Fine.

Also, "nought .rail elements" — also ensure `.rail` inside case content? No.

Also consider: at phone width, the rebuild might render rails repeatedly (e.g., paintSpines triggers re-add?) — observer strips each time. But if the rebuild re-adds rails in a rAF after our strip, we'd strip again on that mutation. Converges as long as it doesn't loop infinitely. Accept.

Also one more possible leak: the review says rebuild phone has 455 elements vs original 462 — after removing 4 rails (+their children?), if rails had children, count drops below. Whatever.

Hmm wait, actually re-reading fault 1: "Your phone renderer works. The desktop rails are still in the DOM underneath it" — "underneath" might mean visually below/behind, i.e., rails render after phone content in the DOM (document order), so reader scrolls through phone content then sees desktop rails. Our removal handles.

Now the explanation section — concise per fault.

Also note instruction: "Do not declare a name the page already uses. Prefix everything." — our IIFE-local vars are prefixed sdr? I used generic names inside an IIFE — they're scoped, not global. But "prefix everything" to be safe: rename to sdr-prefixed? Inside an IIFE, collisions with rebuild's closure names can't happen (separate scope). But if our block is dropped INSIDE the rebuild's IIFE (same scope!), name collisions with rebuild locals ARE possible (e.g., `wrap`, `box`, `sig`, `poll`, `init`, `CSS`, `LABELS`, `stripRails`...). The instruction says "dropping into the rebuild inside its IIFE" — so same scope! Must prefix everything. Rename all identifiers with sdr prefix: sdrPhone, sdrMark, sdrWrap, sdrBox, sdrLastFocus, sdrPushed, sdrSig, sdrStripRails, sdrFixLabels, sdrEnsureWrap, sdrAdoptLoose, sdrIsOpen, sdrSetOpen, sdrInert, sdrOpenSheet, sdrCloseSheet, sdrEnsureClose, sdrPoll, sdrCss, sdrInit. Also guard flag: use a local var instead of window? Use window.__sdrReviewFix (double-underscore, unlikely clash).

Also `PHONE`→sdrPhoneMQ. `CASE_MARK`→sdrMark. CSS→sdrCss.

Also avoid arrow functions? Fine to use modern JS; but the rebuild might be ES5-ish — modern browsers handle both. Use function expressions mostly, some arrows ok. I'll keep ES5-ish for safety except URLSearchParams/matchMedia/append (all fine).

`NodeList.forEach` — supported broadly; fine.

Also `e.target.closest` guards for text nodes? click targets are elements. Fine.

Let me finalize code.

Also: poll's closeSheet(true) when box emptied — but at init, box empty and not open → nothing. Good.

Also make sure `sdrPoll` is resilient if `document.body` not ready — init after DOMContentLoaded or body exists.

Also, one thing about `stripRails`: if the rebuild's phone layout, at some widths, intentionally shows... no, phone is phone.

Edge: between 761px and 900px, desktop rails show — fine.

Also, on MQ change to phone (resize down), rebuild redraws hero → rails re-render → observer strips. Also we strip on MQ change event directly (in case redraw is debounced 180ms — original debounced; during that window rails from previous desktop render persist!). Important: the original rebuilds hero 180ms after resize. During resize from desktop→phone, the desktop instrument (with rails) stays visible up to 180ms, then redraw → phone render + our strip. OK — but if the rebuild does NOT redraw on resize... prompt says it does. Also our MQ change handler strips rails immediately even before redraw — leaving phone-less desktop? If we strip desktop rails while still at desktop-rendered instrument (pre-redraw), the user sees the instrument without rails for 180ms. Acceptable, and prevents the check failing if measurement happens right after resize. Good: strip on MQ change regardless.

Also the reverse (phone→desktop): we don't strip; rebuild redraw adds rails. If rebuild's resize redraw doesn't fire (debounced), brief rail-less period. Fine.

Now write the final deliverable.

Also double-check `sdrOpenSheet` regex for eyebrow: text like "Report 12345ABL" → m[1]="12345ABL". If eyebrow missing, no push. Also fallback: use existing `?case=` presence: if URL already has any case param, skip push entirely (rebuild pushed). Adjust:

```
var u = new URLSearchParams(location.search);
if (!u.get("case") && m){ u.set("case", m[1]); push }
```

If URL has case param already (rebuild pushed), skip. If rebuild didn't push and m found, push. Good.

Also on closeSheet with pushed → history.back() → popstate → our handler sees not open → nothing. But rebuild's popstate handler will also run and may reset filters (reading params without case... the pushed entry we go back to has the pre-open params). That matches original behavior (original closeCase → history.back() → popstate handler re-runs search). Fine.

Final check of the nine labels spelling — exact per review table.

Also make sure we set aria-label only when missing so we don't clobber rebuild's 13.

Now the write-up: three short sections. Keep tight, no preamble.