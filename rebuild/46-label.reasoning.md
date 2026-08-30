The task: write a JS block replacing 43-dom.js that fixes the `[data-gtotal]` label so it always shows the corpus total, not the selection total, and never leaves the ellipsis placeholder. It must survive filter changes, handle three URLs.

The prior block (block 44) had jobs 1-4 about iAim, hover, tap, repeat rows. But the user says "Return one fenced js block, whole, replacing 43-dom.js" — with a new job list. The current page block is given as context of what's there; we must write a new block whose jobs are the gtotal fix. Wait — "replacing 43-dom.js" — the previous block was block 44 replacing 43-dom.js. Now we write a new whole block replacing 43-dom.js. Should we keep the previous jobs? The task says "A sentence on the page prints a number that contradicts the sentence. Return one fenced js block, whole, replacing 43-dom.js." The current block includes jobs 1-4 plus this new fix. Presumably we should keep all previous jobs AND add the gtotal fix — since replacing 43-dom.js whole means the single block must do everything. Hmm, but typically in these iterative prompts, the new block should preserve prior fixes and add the new one. The "What must still be true" list includes: tail, operator and part dossiers, locate control, case sheet, repeat rows with their reasons, standing sentence in every state, tab strip, 18 controls, 18 starter questions, 4 rails, 16 panels, no duplicate ids, no sideways scroll, no page error. "Repeat rows with their reasons" — that's job 4 from the previous block. "No duplicate ids" — job 1. So yes, keep everything from the previous block and add job 5: the gtotal corpus number fix.

Now implement job 5:

- Element: `[data-gtotal]`, one on page, inside label of group id `ignore`.
- Must always show whole-file count.
- Sources: `CORPUS` in instrument scope (declared as `let TOTAL=0, CORPUS=0` — top-level in a script, so possibly reachable via window? `let` at top level isn't on window. But the block is "appended to the page" — a separate script tag. `let` declarations in a classic script create bindings in the global lexical scope, not on window, but they ARE accessible from other scripts in the same realm via bare identifier reference. So `CORPUS` can be read directly if it's a top-level let in a classic script. But careful: referencing an undeclared identifier throws ReferenceError; wrap in try. Also could be inside an IIFE — then unreachable. The prompt says "Take whichever you can reach from a block appended to the page". So try in order: CORPUS (global lexical), `d.corpus` on hero response, `range.total` from api/facets. Never TOTAL.

- heroData: also not accessible from outside if in closure. Hmm. "d.corpus on the hero response" — we can hook network responses: intercept fetch/XHR for hero endpoint and read `corpus` field. Similarly `api/facets` returns `range.total`. So the robust approach: hook fetch and XHR to capture corpus from any response that has a `corpus` number (hero response `d.corpus`) and `range.total` from facets responses. Also try reading `CORPUS` global lexical.

Approach:
1. Keep a `corpus` variable, initially null.
2. Try `CORPUS` via eval-ish: `try { if (typeof CORPUS === 'number' && CORPUS) corpus = CORPUS; } catch(e){}` — but `typeof` on let in TDZ throws; wrapped in try. If CORPUS is a top-level let in another script, `typeof CORPUS` works from our script (same global lexical environment). If it's inside a closure, ReferenceError → caught.
3. Hook fetch/XHR: for any JSON response, if `data.corpus` is a positive number → use it; if `data.range && data.range.total` positive → use it. Also maybe `data.total` when... no — never take the selection total. Only `corpus` and `range.total` fields. But careful: hero response has both `total` (selection) and `corpus` (whole). facets has `range.total` = corpus. Never read `total` from search responses.

Hmm, but also the facets response might be per-filter; `range.total` is described as "what the standing sentence already uses for the same number" — i.e., the corpus count. OK.

4. Write the number: format with comma separators (VN presumably formats like `1,757,827`). Our own formatter: `String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')`.

5. Survive repaints: the page repaints `[data-gtotal]` on every filter change with either the selection total or leaves `…` (ellipsis `&hellip;`, i.e. "…" char, or the element may be emptied). The page's code at line 2756 sets `gt.textContent=VN(tn)` only when tn nonzero; when zero it leaves whatever's in markup. When nonzero it sets the wrong number. So we must, after the page runs, re-set the element to corpus. Use MutationObserver on the element's subtree/characterData? Simpler: observe the whole document with characterData + childList + subtree, and in a scheduled task, check the gtotal element: if corpus known and text != formatted corpus, set it. If corpus unknown, ensure it shows the ellipsis placeholder ("…") until known? The instruction: "if the number is not known yet, keep the placeholder only until it is, then fill it." The markup has `&hellip;`. So: if we know corpus, always write formatted corpus. If not known, leave whatever (the ellipsis from markup), but also don't let it show the wrong selection number — if unknown and element shows a number... hmm, before any network response, we don't know corpus. Initial paint: TOTAL=0 initially so page leaves ellipsis. Then page's own render sets wrong number once search returns. By then our fetch hook likely captured corpus from the same search response (hero response includes corpus? "heroData.total" — the hero response has total; "d.corpus on the hero response" — yes hero response has corpus). The first fetch is probably the hero call, which gives corpus before any search. So ordering works out.

But there's the interception subtlety: our block replaces 43-dom.js, loaded... where? Presumably after the main script (block 43). If the main script already ran and fetched before our hooks install, we missed the hero response. Fallback: try CORPUS lexical. If main script's `let CORPUS` is top-level in a classic script, our script can read it directly. Also, heroData — also lexical let, not on window; but maybe readable as `heroData` identifier? It's declared `let heroData` presumably top-level too. But heroData.total is the selection — we want heroData.corpus. We could read `heroData.corpus` if reachable. But we can't rely on that. Also the facets call — the standing sentence uses range.total, so the page calls api/facets at some point; our hook may catch a later facets call (they might be re-fetched on filter changes). To be safe, also poll: retry reading CORPUS/heroData a few times.

Also: to guarantee correctness even if we never learn corpus... we can't invent the number. But between CORPUS lexical, heroData.corpus lexical, and network hooks for facets/hero, we should get it. Also fallback: if element shows a number that isn't corpus-known... we could, if corpus unknown, at least restore ellipsis? Risky: on landing page the label is already right (1,757,827). If we blank it to ellipsis before knowing corpus, then fill — spec says keep placeholder only until known, then fill. Hmm, "it must never be left as an ellipsis: if the number is not known yet, keep the placeholder only until it is, then fill it." So placeholder until known is fine.

Actually wait: on landing, initial render: page sets it via totalN → TOTAL/heroData.total → the landing total which equals corpus. So it's right. If our hooks installed before the page's fetches (our script is block after? The page's own script presumably runs first, since our block is appended). If the page's script runs at DOMContentLoaded and fetches, and our script also runs at parse time... The page script at line 2756 etc. — those run inside its DOMContentLoaded probably. Our hooks: install immediately at script parse (before DOMContentLoaded), so fetches made in page's DOMContentLoaded handler will be hooked. Good. But to be safe, add a periodic retry reading globals for, say, a while.

Also the ellipsis case: `?take=zone|ZONE 700` — both totals 0, page leaves `…`. We set corpus → fill. Good.

Also guard: only write to element `[data-gtotal]` that is inside the group with id `ignore`? The prompt says the element is one on the page, inside label of group whose id is ignore. Selector: `[data-gtotal]` — could also just target any `[data-gtotal]`. Maybe restrict to `#ignore [data-gtotal]` fallback to any `[data-gtotal]`. Keep simple: query all `[data-gtotal]`, but prefer the one within #ignore. I'll just use `[data-gtotal]` (one on page) but verify containment optionally. Simpler: `document.querySelectorAll('[data-gtotal]')` and set each. But the backstop MutationObserver could loop: we set textContent → mutation → backstop → set again if different; once equal, no more writes. Fine, but we must avoid infinite loops — writing only when different prevents loops.

Also careful: don't fight the repeat-rows / other jobs. Reuse existing structure.

Also: hover sweep etc. — the standing sentence must hold "in every state". Fine.

Another subtlety: the page writes `gt.textContent = VN(tn)` where VN formats with commas. Our observer with characterData:true and childList subtree will catch it and we rewrite. Use a microtask/rAF debounce (existing backstop has 80ms setTimeout). 80ms flash of wrong number — acceptable? Probably fine; could add a faster dedicated pass. I'll do a dedicated quick scheduled write via requestAnimationFrame-ish plus the backstop.

Implementation plan for job 5 code:

```js
/* ---------- 5. the standing sentence's number ---------- */
var GT_SEL = '[data-gtotal]';
var PLACEHOLDER = '\u2026';
var corpusN = null;
var corpusTried = 0;

function fmt(n){ n = String(Math.round(n)); return n.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function goodNum(v){ return typeof v === 'number' && isFinite(v) && v > 0; }

function takeCorpus(v){
  if (corpusN == null && goodNum(+v)) { corpusN = Math.round(+v); writeGtotal(); }
}

function sniffCorpus(data){
  try {
    if (!data || typeof data !== 'object') return;
    if (goodNum(+data.corpus)) takeCorpus(+data.corpus);
    else if (data.range && goodNum(+data.range.total)) takeCorpus(+data.range.total);
  } catch(e){}
}

function tryGlobals(){
  if (corpusN != null) return;
  try { if (typeof CORPUS !== 'undefined' && goodNum(+CORPUS)) { takeCorpus(+CORPUS); return; } } catch(e){}
  try { if (typeof heroData !== 'undefined' && heroData && goodNum(+heroData.corpus)) { takeCorpus(+heroData.corpus); return; } } catch(e){}
  try { if (typeof range !== 'undefined' && range && goodNum(+range.total)) takeCorpus(+range.total); } catch(e){}
}
```

Note: `typeof CORPUS` where CORPUS is a top-level let in another script: typeof returns its type without throwing (typeof doesn't throw for let in TDZ? Actually typeof on let in TDZ DOES throw ReferenceError. But after initialization it's fine, and it's initialized to 0 at declaration). If not defined at all → 'undefined', no throw. Good. But if it's inside a closure, 'undefined'. Wrapped in try anyway.

Careful: `CORPUS` initialized to 0 — goodNum(0) false, skip; but network/hooks get real value. Actually CORPUS gets set from hero response presumably; once set, `typeof CORPUS` reads real number. Our retry loop handles timing.

Network hooks: extend existing fetch/XHR hooks to also sniff JSON for corpus. Modify takeGroups path? Better: add separate sniffing in the same hooks. I'll rewrite the fetch/XHR wrappers to call both takeGroups and sniffCorpus (json parse once). Refactor: in fetch hook, `res.clone().json().then(function(d){ takeGroups(d); sniffCorpus(d); })`. In XHR hook, parse once and pass to both.

Write function:

```js
function writeGtotal(){
  if (corpusN == null) return;
  var txt = fmt(corpusN);
  var els;
  try { els = document.querySelectorAll(GT_SEL); } catch(e){ return; }
  for (var i=0; els && i<els.length; i++){
    var el = els[i];
    try {
      if ((el.textContent || '') !== txt) el.textContent = txt;
    } catch(e){}
  }
}
```

Retry globals: in backstop call tryGlobals() and writeGtotal(). Also a short interval for first few seconds:

```js
var tries = 0;
var iv = setInterval(function(){
  tryGlobals(); writeGtotal();
  if (corpusN != null || ++tries > 100) clearInterval(iv);
}, 100);
```

Also if corpus unknown but the element shows a number (the wrong selection number)? We shouldn't remove it necessarily... but if the page painted the wrong number before we know corpus, the sentence is wrong meanwhile. Options: reset to placeholder until known? Spec: "keep the placeholder only until it is, then fill it" — implies placeholder while unknown is the intended state. But on the landing page it's "already right" — if we blank it and refill, brief placeholder, fine. Hmm, but if we NEVER learn corpus (all sources fail), we'd have replaced a correct landing number with a permanent ellipsis — worse. Compromise: only replace a non-placeholder number with the placeholder if we have some signal (e.g., the URL has filters, meaning landing number is wrong anyway). Simpler and safer: don't touch the element while corpus unknown, except: if the page writes a number and later the filter changes... too complex. Decision: while unknown, leave element alone (it may briefly show wrong number, then we fix as soon as hero/facets response lands, which is early). Given hooks installed at parse time before page's fetches, we'll have corpus almost immediately. That's the pragmatic approach. Actually wait — there's a case: `?operator=SWAA` — the page fetches search with operator, gets total=244,532 AND corpus in same response? The search response is `raw` with `raw.total`; does it include corpus? "heroData" is separate (hero endpoint). The hero call happens on landing presumably regardless. And facets call happens for the standing sentence. Either way we catch it.

Also the "never take the selection's total": we only read `corpus` and `range.total` fields, never `total`. Good. Except `range.total` — is that from facets, described as the corpus number. OK.

Edge: MutationObserver writes: we set textContent, triggers observer → backstop → writeGtotal → text equals → no write. Fine.

Also the observer must observe characterData and childList subtree — it does childList subtree; characterData not currently observed. Page sets textContent (childList change on the element) — observed. Fine, no need for characterData.

Also keep jobs 1-4 intact. Also "no em dash / en dash" — my reasons strings use apostrophes, fine. Ensure no — or – characters anywhere in output including comments. I'll avoid them.

Also tab strip ≤130px etc. — unchanged.

One more: the placeholder: the markup has `&hellip;`. If corpus unknown and element empty or has ellipsis, leave. Fine.

Also make sure writeGtotal runs early and often: call in start(), backstop(), interval, and after takeCorpus.

Also consider: the element might be inside a label repainted wholesale (innerHTML replacing the label). Then textContent changes; observer catches; we rewrite. Good.

Potential fight: page sets wrong number every repaint; we set right number right after; there may be a flicker but final state correct. Acceptable.

Also: verify the fix on three URLs — we can't run tests, just note in comments.

Let me also double-check cleanHtml/id stuff unaffected.

Also: hero response might come via fetch with URL containing '/api/hero' or similar; our sniffing is generic across all JSON, only reading `corpus` or `range.total` fields. But danger: some other response might have a `corpus` field that's not the file count? Unlikely. Also `range.total` from facets — only accept when it looks like the corpus (large?). The landing corpus 1,757,827; a filtered facets range.total is still corpus per spec. Accept positive numbers. Could add sanity: accept any positive; fine.

Now write the whole block. Keep previous code mostly as-is, integrate new job. Add job 5 header comment.

Also update the header comment jobs list to include job 5.

One more consideration: `tryGlobals` uses bare `CORPUS` — if our script is a module or eval'd differently... assume classic script. Also if `CORPUS` is declared with let in the page's script, and our script runs after, the binding exists in global lexical env — accessible. Good.

Also add: on 'load' and interval retries.

Write the final code.