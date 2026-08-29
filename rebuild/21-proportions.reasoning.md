We need to produce a CSS block + small JS fixes addressing four faults, using the rebuild's class names (#count under .sdcount, #vstrip, section.panel, table.reps), prefixed names, idempotent since instrument redraws.

Let me write the fix as it would drop into the rebuild's IIFE.

Fault 1: sentence styling. The rebuild has an empty `<div id="sentence" class="sdsentence">` that never fills; the real sentence is in `#count` under `.sdcount`. We need JS to remove the empty div (or the markup change), and CSS to style `#count` (or the sentence container) as 34px Instrument Serif, line-height 1.1, with `.fig` in IBM Plex Mono, `.aside` lighter, `.clause` chips in the sentence face; plus a separate 13px count line.

In the rebuild, presumably `#count` is the element that gets the sentence HTML injected (`.sdcount`?). The instruction: "the sentence lives in #count under .sdcount" — so #count has class sdcount? Or #count is inside a .sdcount wrapper? Interpretation: the sentence is rendered into `#count` which sits under (inside) `.sdcount`? Actually "the sentence lives in `#count` under `.sdcount`" — likely the markup is `<div class="sdcount"><span id="count">...sentence...</span></div>` or similar. We write CSS with both: `#count` computed at 34px Instrument Serif.

But we also need "a separate 13px line saying how many match" — the original has #count as 13px "N reports match your selection" and the sentence separate. In the rebuild the sentence apparently was put in #count. We need to add a second small line. Since we only get CSS + JS where markup must change, we can add via JS: after the sentence, append a small line `<div class="sdfix-match">` with the match count. But we don't have the rebuild code; we have to write JS that hooks into how the rebuild updates. Hmm — this is a hypothetical rebuild; we must write code "that drops into the rebuild inside its IIFE, uses the existing helpers". Since we can't see the rebuild, we write against the described structure: sentence in #count under .sdcount, tab strip #vstrip, panels section.panel, table table.reps.

Given ambiguity, we write:

JS: remove the empty `#sentence.sdsentence` div (idempotent check). Inject a match-count line: after rendering, split? We need to know where the count text comes from. Simplest: CSS creates the two-line structure: `#count` gets the big sentence; a sibling small line. But the match count text — where does the rebuild put it? The problem says "The original also keeps a separate small line: #count, 13px... Give the rebuild the same two." So the rebuild merged them into one. We need to re-create the second line. Without the rebuild source we can define: in the render function where the sentence is set into #count, also set a `.sdfix-sub` element. But we must write JS that works with the rebuild's existing helpers. Since this is a writing exercise, I'll write plausible code: a function `sdrFixCount()` that runs after the instrument redraw, which:

- removes `#sentence` if empty (or always, since it's never filled),
- ensures a `.sdfix-match` span exists after `#count` inside `.sdcount`, and fills it with text derived from the current total (maybe the rebuild has a variable like `LAST_TOTAL` or the count element previously held "219 reports match your selection"?).

Given the constraint "uses the existing helpers" — maybe the rebuild has `num()` and params. I'll write it defensively: read the total from the sentence's `.fig` (the bold figure) — the sentence's first `.fig` is the count of the current selection. The sub line: "219 reports match your selection" — we can compose from the `.fig` number: `<b>219</b> reports match your selection` or "Nothing chosen yet" when no filters. Hmm.

Actually maybe simpler: the sub line text can be derived: if no filters (no chips/clauses), "nothing filtered yet". We can count `.clause` elements in the sentence.

I'll write:

```js
function sdrFixSentence(){
  const dead=document.getElementById('sentence');
  if(dead) dead.remove();
  const c=document.getElementById('count');
  if(!c) return;
  let sub=c.parentElement && c.parentElement.querySelector(':scope > .sdfix-match');
  if(!sub){
    sub=document.createElement('p');
    sub.className='sdfix-match';
    (c.parentElement||c.parentNode).insertBefore(sub, c.nextSibling);
  }
  const fig=c.querySelector('.fig');
  const n=fig? fig.textContent.trim() : '';
  const clauses=c.querySelectorAll('.clause').length;
  sub.innerHTML = clauses
    ? '<b>'+n+'</b> '+(clauses===1?'clause matches':'clauses match')+' your selection'
    : 'nothing filtered yet';
}
```

Hmm, but "how many match" should mirror original: "219 reports match your selection". The .fig in the sentence is the report count. So: `<b>219</b> reports match your selection`.

But wait — the fig appears twice potentially (once in sentence, also the "set aside" aside). The first `.fig` is the count. OK.

Also need idempotency: the instrument redraws; the count element gets re-rendered (innerHTML replaced) but our sub line is a sibling so it survives; we just update its content each time. But if the rebuild replaces the whole `.sdcount` innerHTML including siblings, the sub line would be destroyed and re-created by our fix — fine since we call after each render. How do we hook? The instruction says the fix "drops into the rebuild inside its IIFE". Perhaps the rebuild exposes a render function or we hook a MutationObserver on #count. Safer: MutationObserver on `#count` subtree → run fix. Plus run once at boot. I'll do the observer, idempotent.

CSS for the sentence (scoped, prefixed):

```css
.sdcount #count, #count.sdsentence-live {...}
```

Better: target `#count` directly:

```css
#count{
  display:block;
  font-family:'Instrument Serif',Georgia,serif;
  font-size:34px;
  line-height:1.1;
  color:var(--ink,#1d1d1f);
  max-width:26em;
  margin:7px 0 0;
}
#count .fig{
  font-family:'IBM Plex Mono',ui-monospace,monospace;
  font-weight:500;
  font-size:.92em;
  font-variant-numeric:tabular-nums;
  color:var(--rust-text,#b8431f);
}
#count .aside{font-size:.62em;color:var(--ash,#756f69)}
#count .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count .clause:hover,#count .clause:focus-visible{color:var(--rust,#c44b28);border-bottom-color:var(--rust)}
#count .broken{display:block;font-size:.5em;color:var(--rust,#c44b28)}
.sdfix-match{font-size:13px;color:var(--smoke,#6b6560);margin:4px 0 0}
.sdfix-match b{font-weight:600;color:var(--ink,#1d1d1f)}
```

But careful: fault 1 says "The type rules match on .sentence, so they land on the empty div while the real sentence sits in #count". The fix: write rules against #count (the real one), and remove the empty div via JS. Also perhaps the rebuild already has `.sdsentence` CSS; we should override/neutralize. Since we only add, removing the div by JS solves the mis-targeting.

But careful: #count might be used elsewhere? The original's count is in .bar span.count. In the rebuild, per instructions, "the sentence lives in #count under .sdcount". So #count is the sentence element. Our CSS targets it. Good.

Fault 2: remove `.card.land` and the empty #sentence div. JS: `document.querySelectorAll('#out > .card.land').forEach(n=>n.remove())` — but "No .card.land anywhere in the document" — remove all `.card.land`. Idempotent: running remove repeatedly is fine. Should run at boot (card is static presumably). Also "Nothing else in #out moves" — removing the card only.

Fault 3: tab strip. `#vstrip` at or under 130px with all sixteen tabs and three group labels. Original: one flowing strip, group labels inline, bottom-ruled, tabs 8px 13px, 13px type. CSS:

```css
#vstrip{
  display:flex;flex-wrap:wrap;gap:2px;align-items:baseline;
  margin:12px 0 14px;padding-bottom:6px;
  border-bottom:1px solid var(--line,#e2ded5);
}
#vstrip .vgroup{display:contents}  /* so labels and tabs flow as one strip */
```

Hmm — but group labels need to be inline within the flow. If .vgroup is a wrapper div, `display:contents` makes children participate in the flex layout. But then the label `.vlab` is a span. Use display:contents on `.vgroup`. But careful about accessibility: display:contents on a div is fine (it has no role). But the group label semantics — original had them inline. OK.

```css
#vstrip .vlab{
  flex:0 0 auto;font:600 11px/1.35 Archivo,system-ui,sans-serif;
  letter-spacing:.06em;text-transform:uppercase;color:#57514a;
  margin:0 8px 0 0;white-space:nowrap;
}
#vstrip .vrow{display:contents}
#vstrip .tab{
  padding:8px 13px;font-size:13px;cursor:pointer;border:1px solid transparent;
  border-bottom:none;color:var(--smoke,#6b6560);background:none;
}
#vstrip .tab.on{background:var(--card,#fff);border-color:var(--line,#e2ded5);
  color:var(--ink,#1d1d1f);font-weight:600;border-radius:3px 3px 0 0}
```

Wait: `.vrow` was `display:flex;flex-wrap:wrap` in the original rebuild CSS presumably; we override with display:contents so tabs flow into the outer strip. But border-bottom on #vstrip with tabs having border-bottom:none and .on having card background — matches original's .tabs/.tab. Height ≤130px at 1440: sixteen tabs wrapping over maybe 3 lines ≈ 3×~35px + labels ≈ 120px. Good. On mobile (390px) it'll wrap more, but the check says "#vstrip at or under 130px" — presumably at 1440. We can also shrink padding at small widths to be safe. Add a media query at 760px reducing padding to 6px 9px maybe. The check is at 1440 and 390; they say "#vstrip at or under 130px with all sixteen tabs and all three group labels" — probably at 1440. I'll add mobile tweak anyway.

One concern: display:contents on .vrow would kill its role="tablist" styling? role stays, fine. But if the rebuild's rove() uses `.vrow` layout for visibility (`x.offsetParent!==null`), display:contents elements... children still render, offsetParent works. OK.

Also `align-items:baseline` vs original used default; original .tabs was `display:flex;gap:2px;flex-wrap:wrap`. Tabs with padding 8px 13px. Group labels inline. Fine.

Fault 4: height. Reduce padding/gaps:

- Rails: original shut rail = single line. Reduce `.rail` padding: original `.rail{padding:5px 0}`, `.rail:not(.open){padding:5px 0}` etc. In rebuild, rails have more vertical padding. CSS:

```css
.sdfix .rail, ... 
```

Hmm, we don't know the rebuild's rail class names — presumably same as original since it's a rebuild of the same design (rails likely keep `.rail`, `.months`, `.mo`, `.orow` etc.). The instruction says use the rebuild's own class names for the listed things (sentence, vstrip, panels, table). Rails presumably kept `.rail` names. I'll write rail compaction generically but scoped to avoid collisions? "Do not declare a name the page already uses. Prefix everything." — that applies to new names we declare. For styling existing elements we target them, no new names except `.sdfix-*`.

Rails CSS compaction:

```css
.rail{padding:4px 0}
.rail:not(.open){padding:4px 0}
.rail.open{padding:6px 0 7px}
.rails{gap:0}
```

Original rails container: `.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}`. Rebuild has 749 vs 596 → 153px over 4 rails ≈ 38px/rail extra. Likely padding. Set shut rail to a single line: `.rail:not(.open){align-items:center;padding:3px 0}` and reduce `.orow`/`.strip` heights? Shut rails show `.strip` (12px) or `.restbar` (6px). Keep.

Also `.instrument .ipad` padding maybe larger in rebuild. Reduce `.ipad` padding: original `padding:14px 20px 8px`. Add:

```css
.instrument .ipad{padding:12px 20px 6px}
```

Search panel: 696 vs 423. Reduce `.filters` gaps/padding and `.starter` margins:

```css
.filters{gap:6px;padding:10px}
.filters .fld{gap:1px}
.starter{margin:8px 0 2px}
.starter button{...}
```

Original `.filters{...gap:8px;...padding:12px...}` and `.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}`. So rebuild likely has larger values. To "bring height out of spacing", set:

```css
section.panel{...} /* maybe panel padding */
```

Also `.two{gap:12px}` etc.

Also the hero at 1440: 1,153 vs 979 — includes sentence fix (bigger sentence may add height!). Wait — making #count 34px will make the sentence taller than 16px, increasing hero height. But hero 1,153 → need down to ~979 while sentence grows. Hmm, the measured rebuild already had the sentence at 16px and hero at 1,153. Target body 1,687±10%. With landing card (−410), tab strip (−242), that's −652 from 3,051 → 2,399. Then rails −153 and search panel −273 → ~1,973. Still 286 over 1,687. Plus sentence growing adds maybe +25px. Hmm. So there must be other spacing to trim: body height 3,051 includes everything. The table `table.reps` rows, margins between cards, panel paddings, `.card` margins/padding, h2 margins, etc.

The four named contributors: landing card 410, tab strip 372→104 (−268), rails 749→596 (−153), search 696→423 (−273). Total −1,104 → 1,947. Remaining excess ~260 across the rest (hero minus rails: 1,153−749=404 vs original 979−596=383, only +21 — fine). So where's the rest? 3,051 − 1,153(hero) − 372(tabs) − 696(search) − 410(card) = 420 for everything else in the rebuild; original: 1,687 − 979 − 104 − 423 = 181. So ~239 extra elsewhere: cards margins, `.bars` spacing, table paddings, section.panel margins, etc.

So also compact: `.card{padding:12px;margin:8px 0}`, `h2` margins, `.bars div` margins, `td/th` padding maybe. And section.panel default padding? Original panels have no extra padding. Maybe rebuild added `section.panel{padding:...}`. We can set `section.panel{padding:0}` — but careful not to break phone layout. Hmm "Do not undo the phone layout" — our compaction should be scoped to desktop or at least not break phone. The check at 390px: they only check the listed items (sentence, no card.land, vstrip, nothing removed) — body height only at 1440. But "Do not undo the phone layout" means don't break it. Compacting padding globally might affect phone but shouldn't break it. Still, safer to scope heavy compaction under a media query min-width:761px, keeping phone untouched. Actually simpler: apply globally but modest; or wrap in `@media (min-width:761px)`. The phone has its own classes (.phbar etc.), so rail compaction with .rail:not(.open) — on phone, rails aren't used (phone uses phSection). Fine.

I'll scope desktop compaction to `@media (min-width:761px)` for rails/search/cards, leaving phone layout alone.

Let me also compact things like `.bar{margin:12px 0}` → original 12px 0; if rebuild larger, set to 10px. And `#p-search` internals: `.morefilters summary padding`, `.chips margin`. And `.count` line. And results table: `td{padding:8px 9px}` original — if rebuild has more, set to match. But we don't know rebuild's values; we just set them to the original's values, which by definition achieves the target. That's the cleanest approach: re-assert the original's spacing values on the shared class names (which the rebuild presumably kept for cards, filters, rails, tables). I'll write a "density restoration" block copying original values for: .filters, .starter, .card, .two, .bar, .tabs→#vstrip (done), rails, .orow, .months/.mo heights are JS-driven (H=84 open,14 shut) — keep.

Rails shut height in original: gutter label + strip 12px. `.rail:not(.open){grid-template-columns:186px 1fr; align-items:center; padding:5px 0}`. I'll assert:

```css
@media (min-width:761px){
  .rails{gap:2px;margin-top:9px}
  .rail{padding:5px 0}
  .rail:not(.open){align-items:center;grid-template-columns:186px 1fr;padding:5px 0}
  .rail.open{padding:7px 0 8px}
  .rail .gut .q{...}
}
```

Hmm but the rebuild's shut rail might be a different structure. Keep it loose: just set paddings; even if grid columns differ, padding reduction gets most of the 153px.

Search panel compaction:

```css
@media (min-width:761px){
  .filters{gap:8px;padding:12px}
  .filters .fld{gap:2px}
  .starter{margin:10px 0 4px;gap:6px}
  .morefilters{margin:8px 0 0}
  .morefilters>summary{padding:9px 12px}
  .chips{margin:8px 0}
  .bar{margin:12px 0}
  .scope{margin:8px 0 2px;padding:6px 10px}
  .hint{margin:8px 0}
}
```

General density:

```css
@media (min-width:761px){
  .card{padding:14px;margin:10px 0}
  .two{gap:12px}
  h2{margin:0 0 10px}
  .bars div{margin:3px 0}
  table.reps th{padding:8px 9px}
  table.reps td{padding:8px 9px}
}
```

Also section.panel spacing: maybe rebuild added `section.panel{margin:...;padding:...}`. Add `section.panel{margin:0;padding:0}`? Risky if rebuild relies on padding for something. The check is body height within 10% of 1687 (i.e., ≤1856). Our computed estimate: 3051 − 410 − 268 − 153 − 273 ≈ 1,947 plus sentence growth (+~25) minus other compaction (~200?) → ~1,770. Within 10%? 1687×1.1 = 1855.7. 1,770 < 1856 ✓. But we need to actually find ~200px of other compaction. Let me add more aggressive but safe spacing trims:

- `.instrument` margin: original `margin:12px 0 0`.
- `.seam` etc fine.
- `.wrap` padding-bottom 70px original.
- `.freshness/.credit` margins small.
- `.bars .b` heights, `.orow` heights (14px) — assert.
- `dl` etc.

Also the sentence at 34px line-height 1.1: two clauses might wrap to 2–3 lines ≈ 40–115px. Original same, fine.

Additionally the hero "aim" line and picker are shared. `.sentence` margin `7px 0 0` — but our sentence is #count, set margin accordingly.

Now the JS hooks. Structure of answer: one CSS block + a small script snippet. It "drops into the rebuild inside its IIFE, uses the existing helpers, and is idempotent because the instrument redraws". So maybe provide a function `sdrApply()` called after each render — but we don't know render function names. Use a MutationObserver on body (or on #hero and #out) that runs the DOM fixes; CSS needs no JS. Observer must be idempotent/cheap: removing #sentence (once), removing .card.land (once), maintaining .sdfix-match.

Actually the .sdfix-match line: when the instrument redraws, does it replace #count's parent's content? If the rebuild renders sentence into #count via textContent/innerHTML each time, our sub-line sibling persists unless parent re-rendered. If parent re-rendered, observer catches it and re-adds. Observer on `document.body` childList subtree, debounce with rAF.

But caution: an observer triggering DOM changes that trigger the observer → guard with a flag or check before mutating (our mutations only happen when something's missing, so it terminates).

Write:

```js
(function(){
  function fixCount(){
    const dead=document.getElementById('sentence');
    if(dead&&!dead.firstChild) dead.remove();
    const c=document.getElementById('count'); if(!c) return;
    const host=c.parentElement; if(!host) return;
    let sub=host.querySelector(':scope > .sdfix-match');
    if(!sub){ sub=document.createElement('p'); sub.className='sdfix-match'; host.insertBefore(sub,c.nextSibling); }
    const fig=c.querySelector('.fig');
    const n=fig?fig.textContent.trim():'';
    const filtered=!!c.querySelector('.clause');
    sub.innerHTML = filtered
      ? '<b>'+esc(n)+'</b> '+(n==='1'?'report matches':'reports match')+' your selection'
      : '<b>'+esc(n)+'</b> in total, nothing filtered yet';
  }
  function fixLand(){ document.querySelectorAll('.card.land').forEach(n=>n.remove()); }
  let queued=false;
  const mo=new MutationObserver(()=>{
    if(queued)return; queued=true;
    requestAnimationFrame(()=>{queued=false; fixLand(); fixCount();});
  });
  mo.observe(document.body,{childList:true,subtree:true});
  fixLand(); fixCount();
})();
```

`esc` — "uses the existing helpers" so `esc` exists. But if the count text is plain digits, esc fine.

Hmm: does #count's parent also contain other stuff where inserting a <p> breaks layout? .sdcount is presumably a wrapper for the sentence area. Acceptable.

Also fault 1 mentions the empty `<div id="sentence" class="sdsentence">` — remove regardless of emptiness? "No empty #sentence div" — remove if empty; if it has content it's not the problem. I'll remove only when empty (safer). Actually the complaint says it never fills, so it'll always be empty. Remove-if-empty is idempotent and safe.

Wait, but removing .card.land — "Remove the card. Nothing else in #out moves." Removing from DOM is removal, not hiding — allowed (they said "Do not solve any of this by hiding content" refers to content that must stay; the card is explicitly to be removed). Good.

CSS block — write it now, prefixed new names with `sdfix-`:

```css
/* ---- sdfix: proportion and type ---------------------------------------- */

/* 1. the standing sentence */
#count{
  display:block;
  margin:7px 0 0;
  max-width:26em;
  font-family:'Instrument Serif',Georgia,serif;
  font-weight:400;
  font-size:34px;
  line-height:1.1;
  color:var(--ink,#1d1d1f);
}
#count .fig{
  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  font-weight:500;
  font-size:.92em;
  font-variant-numeric:tabular-nums;
  color:var(--rust-text,#b8431f);
}
#count .aside{font-size:.62em;color:var(--ash,#756f69)}
#count .broken{display:block;font-size:.5em;color:var(--rust-text,#b8431f)}
#count .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count .clause:hover,#count .clause:focus-visible{color:var(--rust,#c44b28);border-bottom-color:var(--rust)}
.sdfix-match{margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--smoke,#6b6560)}
.sdfix-match b{font-weight:600;color:var(--ink,#1d1d1f)}
```

Wait, careful: #count may also be styled by the rebuild's own rules with higher specificity (e.g., `.sdcount #count{font-size:16px}`). Our `#count` may lose. Use `#count` plus `.sdsdcount #count`? To be safe, write `.sdcount #count, #count{...}` — later/ equal-or-higher specificity. Actually if the rebuild rule is `.sdcount #count{font-size:16px}` and ours is `#count{font-size:34px}`, theirs wins (0,1,1,0 vs 0,1,0,0... .sdcount #count = (0,1,1) vs #count = (1,0,0). ID = 1,0,0 beats class+id? No: specificity compare: (a=1) for #count vs (a=1, b=1) for .sdcount #count → .sdcount #count wins. So use `.sdcount #count{...}` too. I'll write selectors as `.sdcount #count,#count` to cover both.

But also the empty #sentence gets `.sentence` styling from the rebuild — we remove the div, so moot.

Fault 3 CSS:

```css
#vstrip{
  display:flex;flex-wrap:wrap;gap:2px;align-items:center;
  margin:12px 0 14px;padding-bottom:6px;
  border-bottom:1px solid var(--line,#e2ded5);
}
#vstrip .vgroup,#vstrip .vrow{display:contents}
#vstrip .vlab{
  flex:0 0 auto;margin:0 10px 0 6px;
  font:600 11px/1.3 Archivo,system-ui,sans-serif;
  letter-spacing:.05em;text-transform:uppercase;color:#57514a;white-space:nowrap;
}
#vstrip .tab{
  padding:8px 13px;font-size:13px;cursor:pointer;
  border:1px solid transparent;border-bottom:none;background:none;
  color:var(--smoke,#6b6560);
}
#vstrip .tab.on{
  background:var(--card,#fff);border-color:var(--line,#e2ded5);
  color:var(--ink,#1d1d1f);font-weight:600;border-radius:3px 3px 0 0;
}
```

Potential issue: if the rebuild's rules like `.vrow .tab{padding:4px 10px;font-size:12.5px}` exist with specificity (0,2,1) > ours (0,1,1). Write `#vstrip .tab` = (1,0,1) which beats (0,2,1). Good since #vstrip is an ID. And `.vlab` rebuild rule might be `.vlab{flex:0 0 200px;text-align:right}` (0,1,0); ours `#vstrip .vlab` (1,1,0) wins. Good.

display:contents on .vgroup kills its box; the label and row's tabs become direct flex items of #vstrip. But `#vstrip .vgroup{display:contents}` — if the rebuild's vgroup has margins, irrelevant now.

One more: aria — group labels remain visible text. Fine.

Mobile: at 390px sixteen tabs wrap; fine, maybe reduce padding: `@media(max-width:760px){#vstrip .tab{padding:6px 9px;font-size:12.5px}}`.

Fault 4 CSS, desktop-scoped density restoration:

```css
@media (min-width:761px){
  /* hero */
  .instrument{margin:12px 0 0}
  .instrument .ipad{padding:14px 20px 8px}
  .rails{margin-top:9px;gap:2px}
  .rail{padding:5px 0}
  .rail:not(.open){align-items:center;grid-template-columns:186px 1fr;padding:5px 0}
  .rail.open{padding:7px 0 8px}
  .orow{height:14px;padding:0 3px}
  .orow.wide{height:17px}
  .fblock{height:22px}
  .aim{margin-top:6px;min-height:20px;line-height:20px}
  .aimat{margin-top:7px}
  .hand{margin-top:2px}
  .specimen{margin-top:8px;padding-top:6px}
  .margin{margin-top:6px;padding:5px 0 2px;line-height:1.5}
  .strip{height:12px}
  .restbar{height:6px}
  /* search panel */
  .filters{gap:8px;padding:12px}
  .filters .fld{gap:2px}
  .starter{gap:6px;margin:10px 0 4px}
  .morefilters{margin:8px 0 0}
  .morefilters>summary{padding:9px 12px}
  .chips{margin:8px 0}
  .bar{margin:12px 0;gap:8px}
  .hint{margin:8px 0}
  .scope{margin:8px 0 2px;padding:6px 10px}
  /* cards and tables across the panels */
  .card{padding:14px;margin:10px 0}
  .two{gap:12px}
  h2{margin:0 0 10px}
  h3{margin:16px 0 6px}
  .bars div{margin:3px 0}
  .bars .b{height:11px}
  .bars .t{min-width:60px}
  table.reps th{padding:8px 9px}
  table.reps td{padding:8px 9px}
  .lead,.lede{margin:0 0 10px}
  section.panel{margin:0}
}
```

Also `.wrap{padding:16px 20px 70px}` maybe. And `#out`/`#results` margin.

Also there's the sentence growth: #count at 34px — the hero will grow a bit; acceptable within 10%.

One more concern for fault 1: "a separate 13px line saying how many match" — the checker will look for a 13px line. Our .sdfix-match is 13px. Good. But note the original line reads "219 reports match your selection" — our text matches when filtered; when unfiltered we say "<N> in total, nothing filtered yet". Maybe simpler to always say "reports match your selection"? The original's count element showed: filtered → "N reports match your selection"; unfiltered → "N reports, nothing filtered yet". I'll mirror that:

```js
sub.innerHTML = filtered
  ? '<b>'+esc(n)+'</b> '+(n==='1'?'report matches':'reports match')+' your selection'
  : '<b>'+esc(n)+'</b> reports, nothing filtered yet';
```

Also need `esc` helper — assume it exists in the IIFE; if not, define fallback? "uses the existing helpers" — I'll use esc directly but guard: `const E=window.esc||(s=>s)`. Hmm, inside IIFE esc may be local. I'll just call esc and note it uses the page's existing helper. To be safe: `const _e=(typeof esc==='function')?esc:String;`. Actually in a snippet dropped inside the IIFE, esc is in scope. Keep esc.

The MutationObserver on the whole body subtree with rAF debounce — fine.

Also removing .card.land: only within #out? "No .card.land anywhere in the document". Remove all.

Also: the checker checks "no empty #sentence div" — remove-if-empty handles it. But maybe safer: remove `#sentence` entirely if it has class sdsentence and is empty. Yes.

Also the CSS rules the rebuild has matching `.sentence` (e.g., `.sdsentence{font:...}`) — since div removed, no effect.

Edge: `#count` might be a `<span class="count">` inside `.bar` elsewhere in the rebuild too? The problem states the sentence lives in #count under .sdcount — trust that #count is unique to the sentence. But the original also used id "count" for the 13px line — the rebuild moved the sentence there. OK.

Hmm wait, re-read: "The original also keeps a separate small line: #count, 13px, plain sans, reading '219 reports match your selection'. Two lines, two jobs. Give the rebuild the same two." So in the rebuild there is currently ONE element (#count) doing the sentence. We add the second line. Our .sdfix-match is that line. And "the sentence lives in #count under .sdcount" — so markup like `<div class="sdcount"><span id="count">…</span></div>`? Then our sub goes inside .sdcount after #count. Good.

But if the rebuild re-renders .sdcount's innerHTML each redraw, our <p> is wiped and re-added by observer. Fine.

Also should the big sentence rules need `.fig`/`.aside` — the sentence HTML generated includes `<b class="fig">`, `<span class="aside">`, `<span class="clause">`, `<span class="broken">`. Covered.

One more thing: fault 1 says line-height "near 1.1" — set 1.1.

Fault 4 note: "The height comes out of spacing" and our density block does that. Also maybe `#results{padding-left/margin-left}` from the rail accent — original had `#results{border-left:3px solid var(--rust);padding-left:11px;margin-left:-14px}`. Not a height issue.

Also `.phbar` phone untouched (media query min-width:761px excludes phone). The sentence/tab/card JS runs on phone too — sentence styling applies at 390 too (check expects it at 390 as well: "#count computed at 34px Instrument Serif" — they check at both 1440 and 390). So #count rules must NOT be inside the desktop media query. Keep them global. Maybe slightly reduce on small screens? Original reduced `.sentence{font-size:26px}` at ≤900px. But the checker says 34px at 390? "What I will check, at 1440px and at 390px: #count computed at 34px Instrument Serif" — could mean checked at both; safer to keep 34px at all widths. Keep global 34px.

#vstrip rules global too (with mobile padding tweak). .card.land removal global.

Write the final answer: brief explanation of changes (they asked "Explain only what you changed. No preamble.") — actually "Explain only what you changed" means a short changelog, then the code. I'll give a compact list then the code block.

Let me assemble.

CSS:

```css
/* ==== sdfix: four faults — proportion and type =========================== */

/* --- 1. the standing sentence, back at headline size ---------------------- */
.sdcount #count,#count{
  display:block;margin:7px 0 0;max-width:26em;
  font-family:'Instrument Serif',Georgia,serif;font-weight:400;
  font-size:34px;line-height:1.1;color:var(--ink,#1d1d1f);
}
.sdcount #count .fig,#count .fig{
  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:500;
  font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f);
}
.sdcount #count .aside,#count .aside{font-size:.62em;color:var(--ash,#756f69)}
.sdcount #count .broken,#count .broken{display:block;font-size:.5em;color:var(--rust-text,#b8431f)}
.sdcount #count .clause,#count .clause{
  border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer;
  font-family:'Instrument Serif',Georgia,serif;
}
.sdcount #count .clause:hover,#count .clause:focus-visible,
#count .clause:hover,#count .clause:focus-visible{
  color:var(--rust,#c44b28);border-bottom-color:var(--rust);
}
/* the second line: how many match, 13px, its own job */
.sdfix-match{margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--smoke,#6b6560)}
.sdfix-match b{font-weight:600;color:var(--ink,#1d1d1f);font-variant-numeric:tabular-nums}

/* --- 3. the tab strip: one flowing strip again ---------------------------- */
#vstrip{
  display:flex;flex-wrap:wrap;gap:2px;align-items:center;
  margin:12px 0 14px;padding-bottom:6px;
  border-bottom:1px solid var(--line,#e2ded5);
}
#vstrip .vgroup,#vstrip .vrow{display:contents}
#vstrip .vlab{
  flex:0 0 auto;margin:0 10px 0 6px;white-space:nowrap;
  font:600 11px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.05em;
  text-transform:uppercase;color:#57514a;
}
#vstrip .tab{
  padding:8px 13px;font-size:13px;cursor:pointer;background:none;
  border:1px solid transparent;border-bottom:none;color:var(--smoke,#6b6560);
}
#vstrip .tab.on{
  background:var(--card,#fff);border-color:var(--line,#e2ded5);
  color:var(--ink,#1d1d1f);font-weight:600;border-radius:3px 3px 0 0;
}
@media(max-width:760px){
  #vstrip{margin:10px 0 12px}
  #vstrip .tab{padding:6px 9px;font-size:12.5px}
}

/* --- 4. density: the height comes out of spacing, nothing is removed ------ */
@media(min-width:761px){
  /* instrument + rails: a shut rail is one line again */
  .instrument{margin:12px 0 0}
  .instrument .ipad{padding:14px 20px 8px}
  .rails{margin-top:9px;gap:2px}
  .rail{padding:5px 0}
  .rail:not(.open){align-items:center;grid-template-columns:186px 1fr;padding:5px 0}
  .rail.open{padding:7px 0 8px}
  .rail .gut .q,.rail .gut.rest .q{line-height:1.2}
  .aim{min-height:20px;margin-top:6px;line-height:20px}
  .aimat{margin-top:7px}
  .hand{margin-top:2px}
  .orow{height:14px;padding:0 3px}
  .orow.wide{height:17px}
  .fblock{height:22px}
  .strip{height:12px}
  .restbar{height:6px}
  .specimen{margin-top:8px;padding-top:6px}
  .margin{margin-top:6px;padding:5px 0 2px;line-height:1.5}
  /* search panel: same nineteen controls, the original's gaps */
  .filters{gap:8px;padding:12px}
  .filters .fld{gap:2px}
  .starter{gap:6px;margin:10px 0 4px}
  .morefilters{margin:8px 0 0}
  .morefilters>summary{padding:9px 12px}
  .chips{margin:8px 0}
  .bar{margin:12px 0;gap:8px}
  .hint{margin:8px 0}
  .scope{margin:8px 0 2px;padding:6px 10px}
  /* panels, cards, tables */
  section.panel{margin:0;padding:0}
  .card{padding:14px;margin:10px 0}
  .two{gap:12px}
  h2{margin:0 0 10px}
  h3{margin:16px 0 6px}
  .lead,.lede{margin:0 0 10px}
  .bars div{margin:3px 0}
  .bars .b{height:11px}
  table.reps th{padding:8px 9px}
  table.reps td{padding:8px 9px}
  .wrap{padding:16px 20px 70px}
}
```

Hmm, `section.panel{margin:0;padding:0}` — could break phone? It's inside min-width:761px so no. But could break desktop if rebuild relies on panel padding — original had none, so restoring 0 is right.

`table.reps td{padding:8px 9px}` — but reports table has the wrote-row overrides (`.wrote td` padding 0 0 14px etc.) — if the rebuild kept those class names (.rep/.wrote), our td rule (0,1,1) could override `.wrote td` (0,1,1) depending on order. Ours come later in the sheet (we're told it drops in), so ours would win and break the wrote-row layout. Hmm. Risky. Better to not touch table.reps td/th? The height check counted only panels listed; tables inside panels contribute to body height though (the #p-search measurement included the results table? "#p-search 423" original — the empty state, no rows). Body height 1,687 with rails shut — the results table presumably in empty state (nothing chosen yet). So table padding isn't a big factor. To be safe, scope: `table.reps>tbody>tr.rep>td, table.reps th{padding:8px 9px}`? Still could clash. I'll just style th and leave td alone, or use `table.reps th{padding:8px 9px}` only. Actually row height driven by td padding mostly... but the empty-state table dominates anyway. I'll include td but with lower risk: use `:where()` to zero specificity: `table.reps :where(td,th){padding:8px 9px}` — specificity of :where is 0, so the whole selector's specificity = table.reps → (0,0,2)? `table.reps` = element+class = (0,1,1). Hmm :where(td,th) contributes 0, so total (0,1,1) same as `.wrote td` (0,1,1)... order decides again. Use `table:where(.reps) :where(td){}` → specificity (0,0,1). Then .wrote td (0,1,1) wins. And our rule still applies to plain td. 

I'll use low-specificity for shared density overrides to avoid clobbering the rebuild's own more specific rules: wrap values in `:where()` where uncertain. But then if the rebuild's base rule is e.g. `td{padding:12px 10px}` (0,0,1), our (0,0,1) later wins. If rebuild's is `.card td` we lose — acceptable.

Actually for the compaction to work, our rules must win over the rebuild's inflated spacing. The rebuild presumably set bigger paddings with selectors of similar or higher specificity. Without seeing it, the robust approach: use `!important` on the density block? That's heavy-handed but this is a patch dropping into a page we don't control; the grader checks computed heights. But !important on table td would override .wrote td too — but .wrote td's "0 0 14px" padding-bottom vs our !important 8px 9px → breaks wrote rows. Avoid on td. Compromise:

- Use targeted, specificity-aware rules for the big-ticket items (filters, starter, rails, card margins, bars, panel padding) with normal selectors; these are layout containers, not row-variant-sensitive.
- For tables, only th, with :where to be safe, or skip td entirely.

Fine, skip td; keep th with normal selector `table.reps th` — could clash with sticky th? No, th padding fine.

Also `.card{padding:14px;margin:10px 0}` — if rebuild has `.card.land` we removed it anyway; other cards get original density. If rebuild's rule was `.panel .card{padding:22px}` (0,2,0) vs ours (0,1,0) → theirs wins. Use `section.panel .card,.card{padding:14px;margin:10px 0}` → (0,1,1)+... (0,1,1) still < (0,2,0)? (0,1,1) vs (0,2,0): compare b: 2 vs 1 → theirs wins. Ugh. Use `section.panel .card` twice? Write `section.panel section.panel .card`? Silly. Simplest: `!important` on the handful of density values that are pure spacing containers and can't have variants: `.filters`, `.starter`, `.card` padding/margin, `.rail` paddings, `.ipad`, `.two` gap, `.bar` margin, `.chips` margin, `section.panel` padding. Variant-sensitive elements (td, wu, rows) get no !important or are skipped.

Risk of !important: overrides phone layout? Phone is inside min-width:761px media, so no. Overrides case sheet? .case-box isn't a .card. OK, but `.card` inside case sheet? No, case-box uses table.kv. OK.

But `.rail` padding !important would also hit phone? Phone doesn't use .rail. Fine.

I'll use !important sparingly on the density block, with a comment. Actually the instructions to the original dev in the prompt say the fix "drops into the rebuild inside its IIFE" — they'll integrate it; maybe cleaner without !important. But given unknown rebuild CSS, I'll use !important on the container spacing only, and explain. Hmm, graders might frown. Alternative: high-specificity + important-free. I think a middle ground: moderate specificity (`section.panel .filters` etc.) plus !important on a small set. I'll just use !important on the density values — it's a patch; correctness of computed layout is what's checked.

Let me finalize with !important on: .instrument/.ipad, .rails, .rail paddings, .filters, .starter, .morefilters summary, .chips, .bar, .scope, section.panel, .card, .two, .bars div, .specimen, .margin, .orow heights? .orow height affects open rail content — keep !important height:14px? .orow.wide 17px must win over .orow — order within our block: put .orow.wide after. With both !important, later wins at equal specificity — `.orow.wide` (0,2,0) vs `.orow` (0,1,0) → wide wins anyway. OK.

Don't !important: .aim, .hand, h2/h3 margins, .lead — minor. Actually include them normally.

Also add `.strip{height:12px}` and `.restbar{height:6px}` — JS-driven bars? .strip is CSS-height; fine.

Also `.sentence`-area: our #count margin 7px.

Also hero picker `.picker` padding fine.

Now JS:

```js
/* ---- sdfix: markup fixes that must survive every redraw ------------------ */
function sdfixDom(){
  /* fault 2: the landing card is gone; the rails explain themselves */
  document.querySelectorAll('.card.land').forEach(n=>n.remove());
  /* fault 1: the empty sentence div the type rules were landing on */
  const dead=document.getElementById('sentence');
  if(dead && !dead.textContent.trim()) dead.remove();
  /* fault 1: the second, small line — the sentence and the match count are two jobs */
  const c=document.getElementById('count'); if(!c) return;
  const host=c.parentElement; if(!host) return;
  let sub=host.querySelector(':scope > .sdfix-match');
  if(!sub){
    sub=document.createElement('p');
    sub.className='sdfix-match';
    host.insertBefore(sub,c.nextSibling);
  }
  const fig=c.querySelector('.fig');
  const n=fig?fig.textContent.trim():'';
  const filtered=!!c.querySelector('.clause');
  sub.innerHTML=filtered
    ? '<b>'+esc(n)+'</b> '+(n==='1'?'report matches':'reports match')+' your selection'
    : '<b>'+esc(n)+'</b> reports, nothing filtered yet';
}
let sdfixQueued=false;
new MutationObserver(()=>{
  if(sdfixQueued)return; sdfixQueued=true;
  requestAnimationFrame(()=>{sdfixQueued=false;sdfixDom();});
}).observe(document.body,{childList:true,subtree:true});
sdfixDom();
```

Note: esc for digits fine.

Explanations: short per fault.

One more check on fault 3: "with all sixteen tabs and all three group labels" — display:contents keeps them. Also `#vstrip` height ≤130 at 1440: tabs 8+13px font 13 line ~16 → each tab ~34px tall; 16 tabs + 3 labels across 1440 minus padding: tab widths ~90-150px each; 16 tabs ≈ maybe 2 rows + labels inline. 2–3 rows ×36 + padding-bottom 6 + margins → ~80–120px. Good.

Fault 1 at 390: #count 34px — kept global. The mobile media query in original reduced to 26px but checker expects 34 at 390? They said check at 1440 and 390 the listed items including 34px. Keep 34 globally.

Also ensure `.sdfix-match` doesn't get hidden — fine.

Also note: the original `.sentence .clause` inherits serif; fine.

Also mention the `.card.land` em dash point — not needed in explanation beyond removal.

Write the answer: brief bullet explanations of the four fixes, then one code block containing the CSS and the JS (labeled). Probably one block with `<style>`-less CSS then a `<script>`-less JS; I'll present as two fenced sections or one with comments. They said "One self-contained block of CSS, and JavaScript only where markup has to change". I'll give CSS block, then JS block.