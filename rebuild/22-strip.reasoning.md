Let me analyze the four faults.

Fault 1: The rebuild's JS calls `renderOnPurpose` which does `sd2$("sentence").innerHTML=""`. Previous block removed `#sentence` (the element with id `sentence`). Fix: keep `#sentence` in the DOM (create it if absent, or stop removing it), but style it so it costs no height. Since the page's script writes to it via `sd2$("sentence")`, the element must exist. The prior block apparently removed it — so in my replacement block, I must re-add/keep the `#sentence` element. But wait — my block is CSS + JS injected into the rebuild. The rebuild page has its own markup. My previous block removed `#sentence` — how? Probably removed the element from DOM in JS. Now I must keep it: ensure `#sentence` exists (restore/recreate if missing), keep it empty (no height) — the page writes `innerHTML=""` to it anyway, then later `sentenceHTML` writes the standing sentence into it? Actually wait — in the rebuild, where is the standing sentence? The check says "#count.sdcount holds the sentence, at 34px Instrument Serif". So the standing sentence lives in `#count.sdcount`, and `#sentence` is a separate (legacy) element that the script still writes to (emptying it, and presumably filling during renderOnPurpose? No — renderOnPurpose only sets innerHTML=""). Hmm, in renderOnPurpose it sets `sd2$("sentence").innerHTML=""` — so it just needs to exist. And `nr.hidden=false` — the "no rows" element, which contains the empty-state explanation. So fixing: ensure `#sentence` exists in DOM. Since my previous block deleted it, I need to recreate it (idempotently) — e.g., `document.getElementById('sd-sentence')`... no, the page looks up `sd2$("sentence")` = getElementById("sentence"). So my JS must ensure an element with id="sentence" exists (inside the hero or wherever the original had it). It should be hidden or zero-height via CSS with prefixed class... but I can't add classes? I can — my JS can set style. Simplest: if `!document.getElementById('sentence')`, create `<div id="sentence" hidden>` appended somewhere (e.g., to the hero/ipad). `hidden` attribute — does the page's script unhide it? renderOnPurpose sets innerHTML="" only. Setting hidden keeps it out of layout. But careful: maybe the rebuild's other code writes the sentence into it? The check says "#count.sdcount holds the sentence". So `#sentence` can stay hidden. But fault 1 says "Keep it in the DOM and take it out of the type rules instead. It is empty, so it costs no height once it is not being styled as a headline." So: keep element, don't style it as 34px headline (which previously gave it height?). Actually previously my block probably removed the element AND removed a CSS rule; the throw is because element removed. Solution: ensure the element exists, hidden or empty with no reserved height. I'll create it with `hidden` and also CSS `#sentence{display:none}` — wait, "Do not declare a name the page already uses. Prefix everything." Hmm, but I need to target #sentence and #count. The instruction about prefixing means don't *declare* (define) names; targeting existing IDs is necessary. CSS targeting `#sentence` is fine — it's not declaring a new name conflicting. But to be safe use `#sentence` selector since it's an existing page id. Actually prefixing applies to new class names I introduce. Targeting existing selectors is required.

Fault 2: Tab strip. Rebuild markup: `#vstrip.vgroups > .vg > .vglab + .vgbtns > button.vtab`. The `.vgbtns` has inline styles (display:block; border-bottom; margin; padding). Inline beats stylesheet, so I must override via JS: set inline styles on `.vgbtns` elements each pass (idempotent, since instrument redraws... actually the strip probably isn't redrawn, but to be safe run in a function called repeatedly / MutationObserver already?). My block runs inside an IIFE, idempotent. I'll write a function `sdFixStrip()` that sets inline styles: display:flex; flex-direction:row (for .vgbtns: flex; gap:2px; flex-wrap:wrap; border-bottom:1px solid line; margin:10px 0 12px? wait original tabs: `.tabs{display:flex;gap:2px;flex-wrap:wrap;margin:12px 0 14px;border-bottom:1px solid var(--line)}` and `.tab{padding:8px 13px;font-size:13px;...}` with `.tab.on{...}`. And the rebuild has three groups with labels to the left (`.vlab` in original second version: `.vgroup{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}` `.vlab{flex:0 0 200px;...}` `.vrow{display:flex;gap:2px;flex-wrap:wrap;flex:1}` `.vrow .tab{padding:4px 10px;font-size:12.5px;...}`. Original height 104px. Hmm which design gives 104px? The original's tab strip (16 tabs in one row) at 1440px = 104px height — that's `.tabs{display:flex;...}` with one row of tabs: padding 8+13... one row ≈ 37px + margins 26 = 63px. 104px suggests the grouped version (three rows: 3 groups × ~32px + margins). The rebuild currently at 229px. So target: use the grouped layout (`.vgroup` style from original): each .vg is a flex row with label (flex:0 0 200px, right-aligned, uppercase 10px) and buttons row; three rows ≈ 104px.

So CSS:
```
#vstrip.vgroups{display:block;border-bottom:1px solid #e2ded5;margin:10px 0 12px;padding-bottom:6px}
#vstrip .vg{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
#vstrip .vglab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
#vstrip .vgbtns{display:flex;gap:2px;flex-wrap:wrap;flex:1;min-width:0;border:0;margin:0;padding:0}
#vstrip .vtab{padding:4px 10px;font-size:12.5px;border-radius:3px;border:1px solid transparent;background:none;color:#6b6560;cursor:pointer}
#vstrip .vtab.on{background:#fff;border-color:#e2ded5;color:#1d1d1f;font-weight:600}
@media(max-width:900px){#vstrip .vg{flex-direction:column;gap:2px}#vstrip .vglab{flex:none;text-align:left}}
```
But .vgbtns has inline styles from the page script — must override via JS: iterate `.vgbtns`, set style.display="flex", style.flex="1", style.gap="2px", style.flexWrap="wrap", style.borderBottom="0", style.margin="0", style.padding="0", style.minWidth="0". Keep role/aria untouched.

Fault 3: Second line of the count. The rebuild prints " reports, nothing filtered yet" without figure because code reads `#count .fig`. Two states:
- unfiltered: `<strong>1,757,827 reports.</strong> Nothing chosen yet.` — original sentence: "1,757,827 reports, everything the FAA has published to 26 August 2026."
- filtered: `<b class="fig">219</b> reports, <span class="clause">...` 

The second line — wait, what is the "second line"? The .cut? Or the count line `#count`? "The second line prints without its number. It reads ' reports, nothing filtered yet'." Hmm — this is some element in the rebuild that reads `#count .fig`. Probably the rebuild's cut/caption or a sub-line. It reads the figure from `#count .fig`, and unfiltered there is no `.fig` (because unfiltered count uses `<strong>`). Fix in JS: read whichever is present — query `#count b.fig, #count strong` or `#count .fig || #count strong`. And also: unfiltered, print "…reports, everything the FAA has published to <date>." using `range.to` from `/api/facets` via prettyDate — the rebuild presumably has helpers; I should implement: fetch facets? The page already fetches facets in boot; but my block is injected. I can fetch `/api/facets` myself and cache `range.to`, then rewrite the unfiltered count line: append "everything the FAA has published to 26 August 2026." But careful: "Print the date the API gives and never a date derived from it" — use `range.to` string, formatted via a prettyDate equivalent (that's formatting, not deriving a new date — formatting the given date is fine; "never a date derived from it" means don't compute month-end etc.). I'll format ISO date to "26 August 2026".

Where does the second line live? The prompt says "#count.sdcount holds the sentence". The "second line" reading `#count .fig` — likely the `.cut` caption sentence in the rebuild that mirrors the standing sentence. Hmm. Actually maybe the rebuild's own code builds a sentence line: filtered: "<fig> reports, <clause...>", unfiltered: " reports, nothing filtered yet". So the second line is the caption/cut sentence. My fix: patch that code. Since I don't have the rebuild's source, I must write JS that runs (idempotently, after renders) and fixes the text. Approach: a MutationObserver or a function hooked after render that:

1. Finds the element containing " reports, nothing filtered yet" or with pattern and fixes the number.
2. Sets the unfiltered sentence to include published-to date.

Simpler: I can override by patching the sentence rendering. The safest generic approach: define a function `sdFixLines()` that:

- reads count figure: `var fig = document.querySelector('#count b.fig, #count .fig') || document.querySelector('#count strong');` extract number text.
- Find the "second line" element. How to identify? The cut sentence element in rebuild — names unknown. The prompt says: "Your code takes the figure from `#count .fig`" — "your code" = my previous block's code! So the previous block injected JS that built a second line reading `#count .fig`. So in my replacement I control that code. I know what I wrote before conceptually: a second line (probably in the cut/caption or under the count) that reads the figure from `#count .fig`. So I just rewrite that code: read `.fig` or fall back to `strong`, and parse the number.

And "unfiltered it names the published-to date": so my second-line builder, when unfiltered, should produce "1,757,827 reports, everything the FAA has published to 26 August 2026." — matching original. Wait, original's hero sentence is that; the rebuild's #count unfiltered says "1,757,827 reports. Nothing chosen yet." The check: "#count at 34px Instrument Serif; the second line carries its figure in both states; unfiltered it names the published-to date from the API." Hmm — so #count holds the sentence at 34px Instrument Serif (like the original's `.sentence`). And the "second line" — the cut line above the table (caption.cut in original). In original, cut's `.cs` shows `sentenceHTML(heroData)` which unfiltered = "<fig>corpus</fig> reports, everything the FAA has published to <date>." So:

- #count.sdcount = the standing sentence, 34px Instrument Serif, .fig mono rust.
- second line = the cut caption above the results table.

So my block renders the standing sentence into #count (since rebuild removed #sentence, sentence lives in #count). And renders the cut caption. Previously my cut caption read `#count .fig` which doesn't exist unfiltered. Fix: build the caption from the same data (I have heroData? I can't rely on page internals). Better: my block computes both from a shared source: the count figure extracted from #count (either .fig or strong), the clauses... hmm, but I don't have the rebuild's clause data.

Since I don't know the rebuild's exact internals, I have to write plausible code. The prompt: "It drops into the rebuild inside its IIFE, uses the existing helpers". So I can call the rebuild's helpers like `sd2$`, `sd2Num`, `sd2Total`, `prettyDate`? The rebuild uses sd2-prefixed names (sd2$, sd2Total, sd2Num, sd2$). And renderOnPurpose, sdSearch. So helpers: `sd2$` = getElementById presumably. I'll use `sd2$("count")` etc. And there may be `sd2Range` or the facets stored somewhere — unknown. Safer: fetch facets once myself and cache.

Given ambiguity, I'll write the block as:

```js
(function(){
  // 1. keep #sentence alive for renderOnPurpose
  function sdFixSentenceEl(){
    var s=document.getElementById('sentence');
    if(!s){ s=document.createElement('div'); s.id='sentence'; s.hidden=true;
      var host=document.getElementById('count')||document.querySelector('.sdipad')||document.body;
      host.parentNode.insertBefore(s,host); }
  }
```

Hmm — wait. Actually fault 1's fix per instruction: "Keep it in the DOM and take it out of the type rules instead." Meaning: the element #sentence should exist (my previous block removed it — perhaps my previous block's JS removed the element from the DOM). So now: re-add it / stop removing it. And CSS: don't style #sentence as a big headline; keep hidden/empty. So JS: if #sentence missing, create it hidden. That makes renderOnPurpose run.

  // 2. strip layout
  function sdFixStrip(){
    document.querySelectorAll('#vstrip .vgbtns').forEach(...)
  }

  // 3 & 4: the sentence/caption and heights via CSS.

For the sentence: my block previously rendered the standing sentence into #count.sdcount. I need to rebuild that rendering: read figure, clauses. But how do I know the clauses? The rebuild's filtered count line: `<b class="fig">219</b> reports, <span class="clause" ...>left wing</span>...` — this is #count's content when filtered. So the standing sentence IS #count's content. And the second line — maybe the cut line duplicates it reading from #count. So the "second line" builder is my previous code that read `#count .fig`. 

So fixes in my code:
- In the second-line builder: `var fig=document.querySelector('#count .fig, #count strong')` — but strong contains "1,757,827 reports." — I need just the number: parse `text.match(/[\d,]+/)`.

Actually cleaner: my second-line builder should take the figure from the same source the count builder used. But since the count is built by the page's own code (sdSearch/renderOnPurpose produce #count content), my code reads it after render. So:

```js
function sdCountFigure(){
  var c=sd2$('count'); if(!c)return '';
  var f=c.querySelector('.fig');
  if(f) return f.textContent;
  var m=(c.textContent||'').match(/[\d][\d,]*/);
  return m?m[0]:'';
}
```

And unfiltered date: fetch facets once:

```js
var sdPubTo='';
fetch('/api/facets').then(r=>r.json()).then(d=>{ sdPubTo=(d&&d.range&&d.range.to)||''; sdSecondLine(); }).catch(()=>{});
```

Wait the rebuild might use relative api paths — the page uses "api/facets" (relative). Use "api/facets".

prettyDate: define sdPrettyDate(iso) formatting "26 August 2026".

Second line function: find where to render. Previously my code rendered it somewhere — I'll render it into the cut caption element. Since names are mine, I'll create `div.sdcut` inserted before the results table? Hmm, but original had caption.cut sticky above table. The rebuild: "table.reps is the table". My previous block presumably added a cut line. I'll create:

```js
function sdSecondLine(){
  var host=sd2$('count'); if(!host)return;
  var line=host.parentNode.querySelector('.sdcut');
  if(!line){ line=document.createElement('div'); line.className='sdcut';
    host.parentNode.insertBefore(line, host.nextSibling); }
  var fig=sdCountFigure();
  var filtered = !!sd2$('count').querySelector('.fig');  // hmm
```

Wait — how to know filtered vs unfiltered? Unfiltered count content: `<strong>N reports.</strong> Nothing chosen yet.` Filtered: `<b class="fig">N</b> reports, <clauses>`. So detect: if #count contains '.clause' → filtered; else unfiltered.

Unfiltered second line: `${fig} reports, everything the FAA has published to ${sdPrettyDate(sdPubTo)}.` If sdPubTo not yet loaded, retry when loaded (the fetch callback calls sdSecondLine again).

Filtered second line: copy #count's text content basically? Original cut `.cs` = sentenceHTML(heroData) which is same sentence. So filtered: `fig + " reports, " + clause texts joined + ". N set aside."` Simplest robust: clone #count's innerHTML into the cut line but smaller? But then `.fig` present. Actually simplest: the second line mirrors the sentence: `line.innerHTML = host.innerHTML` minus the "Nothing chosen yet" part. Hmm. For filtered, mirroring innerHTML works (clauses are spans; clicking them in the cut would also work but data-drop handlers are bound where? The page binds clicks on `.clause[data-drop]` via document listener in original; rebuild unknown). Safer to mirror text only: build from textContent? Clauses' text joined.

Let me keep it simple and mirror: for filtered, `line.innerHTML = fig + ' reports, ' + clausesText + '.'`. Get clauses: `host.querySelectorAll('.clause')` map textContent.

When to run: after each render. Hook: MutationObserver on #count (childList) → debounce → sdSecondLine + sdFixStrip + sdFixSentenceEl? Since instrument redraws on every filter change, an observer on document.body subtree already existed in previous block maybe. I'll set a MutationObserver on #count and on document for structural things.

Also idempotency: everything guarded.

Fault 4: heights. CSS to compress:

- Rails: shut rail one line high. Original: `.rail:not(.open){align-items:center;grid-template-columns:186px 1fr;padding:5px 0}` and `.rail{display:grid;grid-template-columns:110px 1fr;gap:12px;padding:5px 0;border-top:1px solid var(--line)}`. The rebuild rails 749 vs 596. I don't know rebuild's rail markup names... The prompt earlier: rails are "four rails". My previous block styled them presumably. Rebuild names unknown for rails — but "Read the rail and `.filters` CSS above and match the measures rather than inventing new ones." Since I don't have the rebuild's markup, I must guess classes. Hmm. This is the crux: I must produce CSS targeting the rebuild's classes, but I only know: `#count.sdcount`, `#vstrip.vgroups > .vg > .vglab + .vgbtns > button.vtab`, `section.panel`, `table.reps`. The hero/rails classes presumably mirror the original's: `.rails`, `.rail`, `.gut`, `.track`, `.strip`, `.months`, `.restbar`... The prompt says "The rebuild's names, not the original's" listing only those four. Presumably other original names carried over (the rebuild is derived from the original with renamed bits). I'll target original-ish selectors but scope them: `.instrument .rail` etc. Given the exercise, I'll write CSS matching original measures:

- `.ipad{padding:14px 20px 8px}` (original).
- shut rails one line: `.rail:not(.open){grid-template-columns:186px 1fr;align-items:center;padding:5px 0}` `.rail:not(.open) .gut.rest{...}` original `.rail .gut.rest` has q + val inline. Also `.rail:not(.open){cursor:pointer}`. Track strip height 12px (`.strip{height:12px}`), restbar 6px.
- Rails total: original 596px with open rail ~ tall. Fine.
- Search panel: `.filters` grid `repeat(auto-fit,minmax(158px,1fr))`, inputs padding 7px 9px. Starter buttons font-size 13px, padding? original `.starter button{background:#fff;color:var(--ink);font-size:13px}` inherits `input,select,button{padding:7px 9px}`. The hint line. Chips. Bar with count/export/copy.

Since my previous block was a replacement controlling these styles, I'll write CSS that mirrors original measures for: .starter (flex, gap 6px, wrap, margin 10px 0 4px), .filters (grid), #p-search spacing, panel padding.

Also "outside <main> 42px" — something outside main adds 42px. Probably my previous block added something after main (like the ph pill? no). Maybe a `.freshness`/credit? Or the aimsug? Hmm — "outside <main>" 42px in rebuild. Could be an element my block created appended to body. In my replacement, ensure any created element is display:none or removed. I'll note: my block creates only #sentence (hidden, inside main) and .sdcut (inside main). Also maybe previously I created a toast/copied element outside. I'll just not create anything outside main.

Now, CSS conflicts: "Do not declare a name the page already uses. Prefix everything." My new classes: `.sdcount` — wait, that's the page's name (#count.sdcount). I target it, not declare it. My own classes prefixed `sd-`: `.sdcut`. And #sentence exists already.

Also: "#count at 34px Instrument Serif" — CSS:
```
#count.sdcount{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.1;color:#1d1d1f;max-width:26em;margin:7px 0 0}
#count.sdcount .fig,#count.sdcount b.fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count.sdcount .aside{font-size:.62em;color:#756f69}
```

Hmm but #count also is inside `.bar` as `.count` span originally (font-size 13px). The rebuild gave it .sdcount. OK.

Second line `.sdcut` styling like the original `.cut`: sticky, border-top 2px rust, padding 8px 10px, flex. But maybe my previous block already had a cut. I'll style:

```
.sdcut{display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:6;background:#f7f5f0;border-top:2px solid #c44b28;padding:8px 10px}
.sdcut .sdcs{font-family:'Instrument Serif',Georgia,serif;font-size:20px;line-height:1.2;color:#1d1d1f;flex:1 1 320px;min-width:280px}
.sdcut .sdcs .fig{font-family:'IBM Plex Mono',monospace;color:#b8431f;font-size:.9em}
```

Hmm wait — is the second line the cut, or is it literally a second line under #count? Re-reading fault 3: "The second line prints without its number. It reads ' reports, nothing filtered yet'." And "Your code takes the figure from `#count .fig`". The example filtered count: `<b class="fig">219</b> reports, <span class="clause">...` — that looks like the sentence itself. And "The two states: unfiltered <strong>1,757,827 reports.</strong> Nothing chosen yet. / filtered <b class="fig">219</b> reports, ..." — these are the two states of... the sentence (#count). So the "second line" is a different element (below the count / the cut) whose text begins with the figure then " reports, nothing filtered yet". So the second line unfiltered should read "1,757,827 reports, everything the FAA has published to 26 August 2026." — matching original's unfiltered sentence. And filtered it reads "219 reports, <clauses>...". So yes: the second line mirrors the standing sentence. And #count itself: unfiltered shows "<strong>1,757,827 reports.</strong> Nothing chosen yet." Hmm but then check says "#count at 34px Instrument Serif; the second line carries its figure in both states; unfiltered it names the published-to date". So the second line unfiltered names the date. OK my plan holds.

Wait — maybe simpler: the second line is in the results area (cut above table) that my previous block created. Good, my plan: `.sdcut` before table in #results region... The rebuild's results container id? Unknown — maybe `#results` kept. The table is `table.reps`. I'll insert the cut before the first `table.reps` inside the search panel, guarded. Actually original put cut inside #results before table. I'll do:

```js
function sdSecondLine(){
  var count=sd2$('count'); if(!count)return;
  var fig=sdCountFigure();
  var clauses=[].map.call(count.querySelectorAll('.clause'),function(c){return c.textContent.trim()});
  var txt;
  if(clauses.length){ txt=fig+' reports, '+clauses.join(', ')+'.'; }
  else if(fig){ txt=fig+' reports, everything the FAA has published to '+(sdPubTo?sdPrettyDate(sdPubTo):'')+'.'; }
  else return;
  var res=document.querySelector('section.panel.on table.reps')||document.querySelector('table.reps');
  if(!res)return;
  var cut=res.parentNode.querySelector(':scope > .sdcut') || (function(){
    var d=document.createElement('div'); d.className='sdcut';
    res.parentNode.insertBefore(d,res); return d; })();
  cut.innerHTML='<span class="sdcs">'+esc... 
```

Need esc helper — define sdEsc.

Also sticky cut: `top:0`.

Timing: run after search render. Observer:

```js
var sdMo=new MutationObserver(function(){ clearTimeout(sdT); sdT=setTimeout(sdPass,60); });
sdMo.observe(document.body,{childList:true,subtree:true});
function sdPass(){ sdFixSentenceEl(); sdFixStrip(); sdSecondLine(); }
sdPass();
```

Careful: sdSecondLine modifies DOM → triggers observer → loop. Guard: only update if text differs:

```js
if(cut.dataset.sd!==txt){cut.dataset.sd=txt;cut.innerHTML=...}
```

Same for strip: only set if needed (setting inline style triggers attribute mutations? observer watches childList only, so style changes fine).

Also fetch facets once:

```js
var sdPubTo='';
try{ fetch('api/facets').then(function(r){return r.json()}).then(function(d){
  if(d&&d.range&&d.range.to){ sdPubTo=d.range.to; sdSecondLine(); }
}).catch(function(){}); }catch(e){}
```

sdPrettyDate: format "26 August 2026" from ISO "2026-08-26":

```js
function sdPrettyDate(iso){
  var M=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var p=String(iso||'').split('-');
  return p.length===3 ? (+p[2])+' '+M[+p[1]]+' '+p[0] : String(iso||'');
}
```

That's formatting, not deriving.

Fault 1 details: create #sentence if missing:

```js
function sdFixSentenceEl(){
  var s=document.getElementById('sentence');
  if(s){ /* keep it out of layout without removing it */ 
    if(!s.hasAttribute('hidden') && !s.textContent.trim()) s.hidden=true; // hmm careful
    return; }
  s=document.createElement('div'); s.id='sentence'; s.hidden=true;
  var host=sd2$('count');
  if(host&&host.parentNode) host.parentNode.insertBefore(s,host);
  else document.body.appendChild(s);
}
```

Hmm — but does the page ever put visible content into #sentence? Possibly the rebuild's code writes the standing sentence into #sentence elsewhere? The check says "#count.sdcount holds the sentence". If the page writes sentence into #sentence too, hiding it is fine since #count holds it. But hiding could break if page unhides... renderOnPurpose sets innerHTML="" only. Risk acceptable. Actually safer: don't force hidden if it has content; only hide when empty:

```js
if(s){ if(!s.textContent.trim() && !s.hidden) s.hidden=true; return; }
```

Hmm, but if my previous block removed it, it's absent → create hidden. Good. Also ensure CSS `#sentence{display:none}`? If page writes into it later it'd stay hidden... The instruction: "Keep it in the DOM and take it out of the type rules instead. It is empty, so it costs no height once it is not being styled as a headline." So: keep in DOM, empty, and DON'T style as headline — empty div costs no height (no content, no padding). So maybe not even hidden — just leave it, empty, unstyled. But renderOnPurpose sets innerHTML="" so it stays empty. If some other page code writes visible text into it we'd double-render... check says #count holds the sentence, so no. I'll keep it plain, no display rule — just ensure existence and no styling. Maybe add `#sentence:empty{margin:0;padding:0;font-size:0}`? Simpler: `#sentence:empty{display:none}` — empty → no height; if it ever gets content it shows. But 34px headline rules from original CSS `.sentence` class? The element id is sentence; original CSS styled `.sentence` class and `#sentence`? Original had `<div class="sentence" id="iSentence">`. The rebuild has id="sentence". If rebuild CSS has `#sentence{...34px...}` it would give height even empty? Empty div with font-size still has line-height height! An empty div has height 0 unless it has content or min-height. Actually an empty block div: height 0. Line-height only applies with content (or an inline context). Empty div → 0 height. But margins/padding count. So fine: just don't add padding. I'll add `#sentence:empty{display:none;margin:0}` for safety.

Fault 2 JS override:

```js
function sdFixStrip(){
  document.querySelectorAll('#vstrip .vgbtns').forEach(function(b){
    var s=b.style;
    s.display='flex'; s.flexWrap='wrap'; s.gap='2px'; s.flex='1 1 auto'; s.minWidth='0';
    s.borderBottom='0'; s.margin='0'; s.padding='0'; s.alignItems='baseline';
  });
  document.querySelectorAll('#vstrip .vg').forEach(function(g){
    g.style.display='flex'; g.style.alignItems='baseline'; g.style.gap='10px'; g.style.marginBottom='3px';
  });
  document.querySelectorAll('#vstrip .vglab').forEach(function(l){
    l.style.flex='0 0 200px'; l.style.textAlign='right'; l.style.whiteSpace='nowrap';
  });
}
```

Hmm — setting inline on .vg/.vglab too since maybe page sets inline there as well; prompt only mentioned .vgbtns inline. CSS can handle .vg/.vglab; but safe to do both. Actually the prompt says the strip's own script sets inline styles on .vgbtns — so only that needs JS. But wait — if the script re-runs on redraw and re-applies inline styles, my fixes run after via observer. But my sdFixStrip sets styles, page script may re-set later — observer catches and re-fixes. Could ping-pong? Page script sets inline styles during render; observer fires; I override; no further mutation from my style changes (childList only). Fine.

Media query for mobile: at 390px, `.vg` column, label left:

```
@media(max-width:900px){
  #vstrip .vg{flex-direction:column;gap:2px}
  #vstrip .vglab{flex:none;text-align:left;white-space:normal}
}
```

But inline styles on .vg (if I set display:flex inline) would beat the media query. So for .vg/.vglab use CSS only (no inline), and only .vgbtns gets JS inline (with a mobile problem: flex-direction column for .vg is on parent, fine; .vgbtns inline display:flex stays fine on mobile). Good — keep JS only for .vgbtns.

Fault 4 CSS: match original measures. Without rebuild markup knowledge, I'll write plausible scoped rules using original class names for the instrument, guarded by prefixed context where possible. I'll write:

```
/* hero / instrument */
.ipad{padding:14px 20px 8px}
.rail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;padding:5px 0;border-top:1px solid #e2ded5}
.rail:not(.open){grid-template-columns:186px 1fr;align-items:center;padding:5px 0}
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail .track .strip{display:flex;gap:1px;height:12px}
.restbar{height:6px}
.sentence{font-size:34px;...}  -- no, sentence removed.
```

Hmm — the rebuild's hero classes: unknown. But the original names (rails, rail, gut, track, strip, restbar, months, axis, picker, aimat, hand, margin, specimen, seam) — the rebuild likely kept them since only listed items were renamed. My previous block styled them; the rails are 153px over. What inflates? Possibly my previous block gave rails min-heights or larger paddings, or `.mo` min-width causing scroll... Without knowledge I'll write the compressing rules matching original exactly, which will override my previous block (this block replaces it whole).

Also `.aimat`, `.hand`, `.aim` heights: original .aim min-height:20px. Include.

Search panel: 
```
.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.starter button{background:#fff;color:#1d1d1f;font-size:13px}
.starter button.extra{display:none}
.starter.all button.extra{display:inline-block}
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;background:#fff;border:1px solid #e2ded5;padding:12px;border-radius:3px}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:#756f69}
input,select,button{font:inherit;padding:7px 9px;border:1px solid #e2ded5;border-radius:3px;background:#fff;color:#1d1d1f}
```
Careful: declaring `input,select,button` globally — page already declares it presumably; mine identical so harmless, but "do not declare a name the page already uses" — element selectors aren't names really. I'd rather scope: `.filters input,.filters select,.filters button{...}` to avoid arguing. Keep minimal.

Count line: `.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}`.

The 42px outside main: previously maybe I appended something. In my replacement, nothing goes outside main. Also add cleanup: remove leftover elements my old block created outside main? The old block is being replaced — but the old block's DOM artifacts (if any created elements persist in the served page? No — the rebuild's source includes the previous block? "Your previous block is already in the page. Return a replacement for it, whole, so there is one block." So the previous block's code is replaced in source; its runtime artifacts don't persist. But the measured 42px outside main comes from the current page with previous block — could be from previous block's created node (e.g., a style element? style/head doesn't count) or from the freshness/credit? The freshness (`p.freshness`) and credit are inside main. Hmm, `#tip` is outside main but display:none. `.phpill`? created on interaction only. Maybe the previous block appended a caption node to body. Since I replace the block, that node won't be created. I'll mention nothing outside main is created.

Also mobile 390px: keep phone layout untouched — my rules shouldn't affect `.instrument.phone`. Guard rail rules: `.instrument:not(.phone) .rail...`? The phone instrument hides rails? drawPhone replaces content with phsections; rails not present in phone. But `.rail` rules could hit `.rail.open[data-rail=when]` inside... phone doesn't render .rail. Safe. But `.ipad` padding — phone uses .phbar. OK.

Also must not undo: phone layout, case overlay, stepper, aria-labels — I don't touch those.

Also "sixteen .vtab buttons, three .vglab" — don't remove any. My strip CSS doesn't hide anything. Original `.starter button.extra{display:none}` — wait, that hides 12 starter questions until "all"! But check: "eighteen starter questions" — they must exist in DOM; display:none but present counts? The original had this behavior (show more). The rebuild must already implement it. My CSS matching `.starter button.extra{display:none}` would hide them... The check says "Nineteen controls, eighteen starter questions, four rails, sixteen panels" — existence, presumably DOM presence. Keeping the original behavior is fine since "Nothing is removed or hidden to reach this" refers to my changes not hiding things to save height... Hmm, "Nothing is removed or hidden to reach this. Every control, every starter question, every rail, every panel stays." The starter "more" toggle is existing page behavior — the previous block's `showStarters` reveals all. I should NOT add `.starter button.extra{display:none}` myself — that would hide content. Leave starter display to the page's own code (the rebuild surely has its own). So skip that rule. Similarly don't add display:none anywhere except `#sentence:empty`.

Now heights: rails 749→596. My rules: shut rail one line (grid 186px 1fr, padding 5px 0, strip height 12px, restbar 6px, gut.rest inline). Open rail: months H=84 etc. — those are inline from the page's JS (railWhen builds heights inline). So rail heights largely inline; the excess probably came from my previous CSS (padding/gaps/min-heights). My replacement sets original values; should be fine.

Search panel 510→423: filters grid compact, bars margins.

Tab strip 229→~104: fixed by fault 2.

Hero also 979→1169: includes sentence (34px), aimat, hand, rails, specimen, margin. My CSS: `.sentence` gone (sentence in #count now). `.aimat{display:flex;align-items:center;gap:8px;margin-top:7px}`, `.aimsug` absolute, `.hand{font:600 13px/1.4;margin-top:2px}`.

Let me also handle `.specimen` clamp: `.sl` line-clamp 2. `.margin` small. `.seam` height 34px.

Write the block:

CSS (in a `<style>` created by JS? "One self-contained block of CSS, and JavaScript only where..." — I'll return a single block: CSS in `<style>` tag + `<script>` IIFE. Previous block presumably same format. I'll output:

```html
<style> ... </style>
<script>(function(){ ... })();</script>
```

Now write CSS carefully, all custom names prefixed `sd`:

```css
/* fault 1: #sentence stays in the DOM, unwritten and unstyled */
#sentence:empty{display:none;margin:0;padding:0}
/* fault 3: the standing sentence lives in #count */
#count.sdcount{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.1;color:#1d1d1f;max-width:26em;margin:7px 0 0}
#count.sdcount b.fig,#count.sdcount .fig{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}
#count.sdcount .aside{font-size:.62em;color:#756f69}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count.sdcount .clause:hover,#count.sdcount .clause:focus-visible{color:#c44b28;border-bottom-color:#c44b28}
.sdcut{display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:6;background:#f7f5f0;border-top:2px solid #c44b28;padding:8px 10px}
.sdcut .sdcs{font-family:'Instrument Serif',Georgia,serif;font-size:20px;line-height:1.2;color:#1d1d1f;flex:1 1 320px;min-width:280px}
.sdcut .sdcs .fig{font-family:'IBM Plex Mono',monospace;color:#b8431f;font-size:.9em}
@media(max-width:900px){.sdcut{gap:4px}.sdcut .sdcs{font-size:16px;min-width:0;flex:1 1 100%}}
/* fault 2: the grouped tab strip, to the original measures */
#vstrip.vgroups{display:block;border-bottom:1px solid #e2ded5;margin:10px 0 12px;padding-bottom:6px}
#vstrip .vg{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
#vstrip .vglab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
#vstrip .vtab{padding:4px 10px;font-size:12.5px;border-radius:3px;border:1px solid transparent;background:none;color:#6b6560;cursor:pointer}
#vstrip .vtab.on{background:#fff;border-color:#e2ded5;color:#1d1d1f;font-weight:600}
@media(max-width:900px){#vstrip .vg{flex-direction:column;gap:2px}#vstrip .vglab{flex:none;text-align:left;white-space:normal}}
/* fault 4: rail and search measures back to the original */
.ipad{padding:14px 20px 8px}
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;padding:5px 0;border-top:1px solid #e2ded5}
.rail.open{padding:7px 0 8px}
.rail:not(.open){grid-template-columns:186px 1fr;align-items:center;padding:5px 0}
.rail .gut.rest{display:flex;align-items:baseline;gap:8px}
.rail .gut.rest .q{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#1d1d1f}
.rail .gut.rest .val{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#b8431f;white-space:nowrap;margin:0}
.rail .gut .val{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#b8431f;margin-top:2px}
.strip{display:flex;gap:1px;height:12px}
.restbar{height:6px}
.aim{min-height:20px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:#b8431f;margin-top:6px;line-height:20px}
.hand{font:600 13px/1.4 Archivo,system-ui,sans-serif;color:#1d1d1f;margin-top:2px}
.aimat{display:flex;align-items:center;gap:8px;margin-top:7px}
.aimat input{flex:1;max-width:340px;padding:5px 9px;font-size:13px}
.aimat select{font-size:12.5px;padding:5px 6px;max-width:150px}
.aimat button{padding:5px 11px;font-size:12px}
.specimen{margin-top:8px;border-top:1px solid #e2ded5;padding-top:6px}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.margin{margin-top:6px;border-top:1px solid #e2ded5;padding:5px 0 2px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5f584f;line-height:1.5}
.seam{display:block;margin:8px 0 0 auto;height:34px;...}
```

Wait — the seam and specimen etc. might be styled by the page already; my re-declaring is redundant but harmless and enforces measures. But risk: the rebuild's hero might not use these class names — if not, rules do nothing (fine). The prompt explicitly says match the measures "rather than inventing new ones" — so include the key ones.

Search panel:
```css
.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.starter .flash / skip
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;background:#fff;border:1px solid #e2ded5;padding:12px;border-radius:3px}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:#756f69}
.filters .fld input{width:100%}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
.chips{margin:8px 0}
```

Hmm, the bar with #count: #count.sdcount inside .bar would be flex item; 34px serif in a bar with buttons... In the rebuild, "the count line" — #count.sdcount holds the sentence, presumably not in .bar (they gave it .sdcount). Fine.

Careful about `.bar{margin:12px 0}` — if #count is inside .bar, the 12px margins add. Leave it.

Now JS:

```js
(function(){
  if(window.__sdFix) return; window.__sdFix=true;   // hmm idempotent by design, but guard double-inject
```

Actually idempotency: "idempotent because the instrument redraws on every filter change" — meaning the block re-runs/re-applies. A one-time guard is fine for listener setup; the pass function runs repeatedly via observer. But if the block script itself only executes once (it's in the page source), no double-execution concern. I'll structure: define functions, run pass, set observer, fetch facets.

The prompt says "It drops into the rebuild inside its IIFE, uses the existing helpers". So maybe I shouldn't wrap in my own IIFE but assume I'm inside theirs. I'll write it as the body that could sit inside an IIFE — I'll include the IIFE anyway but note helpers `sd2$` etc. used via `window.sd2$`? Risky. Safer: use my own `$` fallback: `var $=function(id){return (window.sd2$||function(id){return document.getElementById(id)})(id)}`. Hmm, sd2$ might be scoped inside their IIFE, not global. But renderOnPurpose is referenced by name — unknown scope. Use document.getElementById directly; simplest and safe.

esc helper:

```js
function sdEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
```

Count figure:

```js
function sdFig(){
  var c=document.getElementById('count'); if(!c)return '';
  var f=c.querySelector('.fig'); if(f)return f.textContent.trim();
  var m=(c.textContent||'').match(/[\d][\d,\.]*/);
  return m?m[0]:'';
}
```

Second line:

```js
var sdPubTo='';
function sdPub(){
  fetch('api/facets').then(function(r){return r.json()}).then(function(d){
    var to=d&&d.range&&d.range.to;
    if(to&&to!==sdPubTo){ sdPubTo=to; sdLine(); }
  }).catch(function(){});
}
function sdPretty(iso){
  var M=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var p=String(iso||'').split('-');
  return p.length===3 ? (+p[2])+' '+M[+p[1]]+' '+p[0] : String(iso||'');
}
function sdLine(){
  var c=document.getElementById('count'); if(!c)return;
  var fig=sdFig(); if(!fig)return;
  var cls=[].map.call(c.querySelectorAll('.clause'),function(x){return x.textContent.trim()});
  var txt;
  if(cls.length) txt=fig+' reports, '+cls.join(', ')+'.';
  else txt=fig+' reports, everything the FAA has published to '
           +(sdPubTo?sdPretty(sdPubTo):'the newest report in the file')+'.';
  var t=document.querySelector('table.reps'); if(!t)return;
  var cut=t.parentNode.querySelector('.sdcut');
  if(!cut){ cut=document.createElement('div'); cut.className='sdcut';
    t.parentNode.insertBefore(cut,t); }
  if(cut.getAttribute('data-sd')!==txt){
    cut.setAttribute('data-sd',txt);
    cut.innerHTML='<span class="sdcs">'+sdEsc(txt)+'</span>';
  }
}
```

Hmm — unfiltered: should the figure include the "strong" parse — unfiltered count: "1,757,827 reports. Nothing chosen yet." — regex grabs "1,757,827". Good.

Filtered: `fig` from .fig = "219". Clauses joined. Good.

Edge: if sdPubTo hasn't loaded, fallback text; the fetch callback re-runs sdLine and updates. Fine.

Sentence element:

```js
function sdSentenceEl(){
  var s=document.getElementById('sentence');
  if(!s){
    s=document.createElement('div'); s.id='sentence'; s.hidden=true;
    var host=document.getElementById('count');
    if(host&&host.parentNode) host.parentNode.insertBefore(s,host);
    else document.body.appendChild(s);
  }
}
```

Should it be hidden? "Keep it in the DOM and take it out of the type rules instead. It is empty, so it costs no height." — hidden=true also fine and safest against any inherited 34px line-height? Empty div height 0 regardless. But if some page CSS sets `#sentence{min-height:...}`? Unknown. hidden attribute → display:none via UA stylesheet, beats min-height. But the page's own CSS `#sentence[hidden]`... fine. However: if the page script ever does `s.hidden=false`... renderOnPurpose doesn't. I'll set hidden only when creating; and CSS `#sentence:empty{display:none}` as backup. Actually if page CSS has `#sentence{font-size:34px}` and it's empty → height 0 anyway. OK.

Strip:

```js
function sdStrip(){
  var n=document.querySelectorAll('#vstrip .vgbtns');
  for(var i=0;i<n.length;i++){
    var s=n[i].style;
    if(s.display!=='flex'){
      s.display='flex'; s.flexWrap='wrap'; s.gap='2px'; s.flex='1 1 auto';
      s.minWidth='0'; s.alignItems='baseline';
      s.borderBottom='0'; s.margin='0'; s.padding='0';
    }
  }
}
```

Setting properties every pass is cheap; but each set triggers no childList mutation. Fine to set unconditionally.

Pass + observer:

```js
var sdT=null;
function sdPass(){
  sdSentenceEl(); sdStrip(); sdLine();
}
new MutationObserver(function(){
  clearTimeout(sdT); sdT=setTimeout(sdPass,50);
}).observe(document.body,{childList:true,subtree:true});
sdPass();
sdPub();
```

Careful: sdLine inserts .sdcut → mutation → observer → pass → no change → stop. OK.

One concern: cut insertion before `table.reps` — the table's parent might be a scroll wrapper; sticky top:0 within it. Fine.

Also `table.reps` might appear in multiple panels (corrosion table etc.?). "table.reps is the table" — the results table. If multiple, querySelector takes first in DOM order; the search panel is first panel. Acceptable. Could scope: `section.panel.on table.reps`? If cut attaches to whichever is first... I'll prefer the visible one:

```js
var t=document.querySelector('section.panel.on table.reps')||document.querySelector('table.reps');
```

But if user switches panel, cut stays on the other table (hidden anyway). When they return, pass re-runs? Panel switching toggles classes → attribute mutation not observed (childList only). Hmm — class changes aren't childList. But the cut is inside the hidden panel then; when shown again it's there. And a newly rendered table (innerHTML replaced) → childList mutation → pass → cut re-created in new parent. The old cut is destroyed with old innerHTML. Good. But `cut=t.parentNode.querySelector('.sdcut')` — after re-render, no cut → create. Good.

But if table replaced while panel hidden and the visible table elsewhere... overthinking. Keep simple.

Also the second-line for filtered — should it also show the "newest first" meta like original cut? The check only asks figure in both states + published-to date unfiltered. Keep minimal.

CSS: also ensure the .sdcut doesn't conflict with page. Prefixed class, fine.

Now also fault 4 mentions #p-search 510→423 — my .filters/.starter/.bar rules. And hero 1169→979 — ipads/rails/specimen/margin/aimat. And tab strip via fault 2. Good enough.

One more: "outside <main> 42px" — my block creates nothing outside main except possibly #sentence appended to body if #count missing (it isn't). Also the `#sentence` created goes before #count which is inside main. Good. Also add cleanup for safety: nothing.

Also should I remove `#sentence` hidden if page wants to use it? No.

Also: guard against the observer loop from sdSentenceEl creation — one-time.

Media 390px: `.sdcut` responsive, strip stacks. Phone layout untouched — my rail rules: does phone markup include `.rail`? drawPhone doesn't use .rail. But `.instrument.phone` might still contain `.months`? No. Fine. Also `#vstrip` on phone — stacks via media query.

Let me also double check fault 1's stack: renderOnPurpose sets `sd2$("sentence").innerHTML=""` then `var nr=sd2$("noRows");nr.hidden=false;`. So there's also a `#noRows` element containing the empty state — exists presumably; with #sentence existing, it reaches nr.hidden=false and the empty state renders. Good — my created #sentence must exist BEFORE renderOnPurpose runs. My script runs when? If placed after the page's script, boot may already have thrown... The throw happened at renderOnPurpose during sdSearch — boot calls search(0) async. My block placed after theirs executes at parse time, before fetches complete → #sentence created in time. Since previous block removed the element presumably at its own execution (also before), order same. Fine. But also renderOnPurpose may run again later; observer keeps #sentence present anyway.

Also note: if the page source (rebuild) still contains the `#sentence` div and only my previous JS removed it — my replacement simply doesn't remove it; but the creation guard handles both cases. Wait — if the rebuild's static markup has #sentence with headline styling from rebuild CSS and my previous block removed the element — the fault report says "empty #sentence removed" and "see fault 1" → removed. So markup may still have it; my code: if exists, leave (ensure not styled big → CSS `#sentence:empty{display:none}` handles height). But if the static #sentence gets filled by the page with the standing sentence... check says #count holds the sentence. OK.

Also should I unhide a statically-present-but-hidden #sentence? Leave as-is.

Now write the final answer: brief explanation of changes + the block. "Explain only what you changed. No preamble." So start with a short change list, then the block.

Format: a code block containing `<style>` and `<script>`. Length moderate.

Let me write the CSS fully, careful with colors from :root: --ink #1d1d1f, --paper #f7f5f0, --line #e2ded5, --rust #c44b28, --rust-text #b8431f, --ash #756f69, --smoke #6b6560. Use var() where the rebuild defines them? Rebuild likely kept :root. Use literals to be safe? Use var with fallback: `var(--rust-text,#b8431f)`. I'll use vars with fallbacks.

Final CSS block:

```css
/* -- fault 1: #sentence must exist for renderOnPurpose; kept empty and unstyled -- */
#sentence:empty{display:none;margin:0;padding:0;border:0}

/* -- fault 3: the standing sentence reads from #count; second line under it -- */
#count.sdcount{font:400 34px/1.1 'Instrument Serif',Georgia,serif;color:var(--ink,#1d1d1f);max-width:26em;margin:7px 0 0}
#count.sdcount .fig,#count.sdcount b.fig{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash,#756f69)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count.sdcount .clause:hover,#count.sdcount .clause:focus-visible{color:var(--rust,#c44b28);border-bottom-color:var(--rust,#c44b28)}

.sdcut{display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:6;background:var(--paper,#f7f5f0);border-top:2px solid var(--rust,#c44b28);padding:8px 10px}
.sdcut .sdcs{font:400 20px/1.2 'Instrument Serif',Georgia,serif;color:var(--ink,#1d1d1f);flex:1 1 320px;min-width:280px}
.sdcut .sdcs .fig{font-family:'IBM Plex Mono',monospace;color:var(--rust-text,#b8431f);font-size:.9em}
@media(max-width:900px){.sdcut{gap:4px}.sdcut .sdcs{font-size:16px;min-width:0;flex:1 1 100%}}

/* -- fault 2: grouped strip, original measures -- */
#vstrip.vgroups{display:block;border-bottom:1px solid var(--line,#e2ded5);margin:10px 0 12px;padding-bottom:6px}
#vstrip .vg{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
#vstrip .vglab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
#vstrip .vtab{padding:4px 10px;font-size:12.5px;border-radius:3px;border:1px solid transparent;background:none;color:var(--smoke,#6b6560);cursor:pointer}
#vstrip .vtab.on{background:var(--card,#fff);border-color:var(--line,#e2ded5);color:var(--ink,#1d1d1f);font-weight:600}
@media(max-width:900px){#vstrip .vg{flex-direction:column;gap:2px}#vstrip .vglab{flex:none;text-align:left;white-space:normal}}

/* -- fault 4: instrument and search panel back to the original measures -- */
.ipad{padding:14px 20px 8px}
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;padding:5px 0;border-top:1px solid var(--line,#e2ded5)}
.rail.open{padding:7px 0 8px}
.rail:not(.open){grid-template-columns:186px 1fr;align-items:center;padding:5px 0}
.rail .gut.rest{display:flex;align-items:baseline;gap:8px}
.rail .gut.rest .q{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ink,#1d1d1f)}
.rail .gut.rest .val,.rail .gut .val{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text,#b8431f)}
.rail .gut .val{margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.strip{display:flex;gap:1px;height:12px}
.restbar{height:6px}
.aim{min-height:20px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--rust-text,#b8431f);margin-top:6px;line-height:20px}
.hand{font:600 13px/1.4 Archivo,system-ui,sans-serif;color:var(--ink,#1d1d1f);margin-top:2px}
.aimat{display:flex;align-items:center;gap:8px;margin-top:7px}
.aimat input{flex:1;max-width:340px;padding:5px 9px;font-size:13px}
.aimat select{font-size:12.5px;padding:5px 6px;max-width:150px}
.aimat button{padding:5px 11px;font-size:12px}
.specimen{margin-top:8px;border-top:1px solid var(--line,#e2ded5);padding-top:6px}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.margin{margin-top:6px;border-top:1px solid var(--line,#e2ded5);padding:5px 0 2px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5f584f;line-height:1.5}
.seam{display:block;margin:8px 0 0 auto;height:34px}

.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;background:var(--card,#fff);border:1px solid var(--line,#e2ded5);padding:12px;border-radius:3px}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--ash,#756f69)}
.filters .fld input{width:100%}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
.chips{margin:8px 0}
```

Wait `.filters` background in original is var(--card) = #fff. Fine.

Risk: `.ipad`, `.rail` etc. class names may be reused elsewhere? .rail only in instrument. Fine.

JS final:

```html
<script>
(function(){
  function sdEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

  /* fault 1: renderOnPurpose writes to #sentence. It stays in the DOM, empty. */
  function sdKeepSentence(){
    var s=document.getElementById("sentence");
    if(!s){
      s=document.createElement("div"); s.id="sentence"; s.hidden=true;
      var host=document.getElementById("count");
      if(host&&host.parentNode)host.parentNode.insertBefore(s,host);
      else document.body.appendChild(s);
    }
    return s;
  }

  /* fault 2: .vgbtns carries page-set inline styles; only inline beats inline */
  function sdStrip(){
    var b=document.querySelectorAll("#vstrip .vgbtns");
    for(var i=0;i<b.length;i++){
      var s=b[i].style;
      s.display="flex"; s.flexWrap="wrap"; s.gap="2px"; s.flex="1 1 auto";
      s.minWidth="0"; s.alignItems="baseline";
      s.borderBottom="0"; s.margin="0"; s.padding="0";
    }
  }

  /* fault 3: the second line. Reads whichever element carries the figure. */
  var sdPubTo="";
  function sdFig(){
    var c=document.getElementById("count"); if(!c)return "";
    var f=c.querySelector(".fig"); if(f)return f.textContent.trim();
    var m=(c.textContent||"").match(/[\d][\d,]*/);
    return m?m[0]:"";
  }
  function sdPretty(iso){
    var M=["","January","February","March","April","May","June","July","August",
           "September","October","November","December"];
    var p=String(iso||"").split("-");
    return p.length===3?(+p[2])+" "+M[+p[1]]+" "+p[0]:String(iso||"");
  }
  function sdLine(){
    var c=document.getElementById("count"); if(!c)return;
    var fig=sdFig(); if(!fig)return;
    var cls=[].map.call(c.querySelectorAll(".clause"),function(x){return x.textContent.trim()});
    var txt=cls.length
      ? fig+" reports, "+cls.join(", ")+"."
      : fig+" reports, everything the FAA has published to "
        +(sdPubTo?sdPretty(sdPubTo):"the newest report in the file")+".";
    var t=document.querySelector("section.panel.on table.reps")||document.querySelector("table.reps");
    if(!t)return;
    var cut=t.parentNode.querySelector(".sdcut");
    if(!cut){
      cut=document.createElement("div"); cut.className="sdcut";
      t.parentNode.insertBefore(cut,t);
    }
    if(cut.getAttribute("data-sd")!==txt){
      cut.setAttribute("data-sd",txt);
      cut.innerHTML='<span class="sdcs">'+sdEsc(txt)+"</span>";
    }
  }
  function sdPub(){
    try{
      fetch("api/facets").then(function(r){return r.json()}).then(function(d){
        var to=d&&d.range&&d.range.to;
        if(to&&to!==sdPubTo){sdPubTo=to;sdLine();}
      }).catch(function(){});
    }catch(e){}
  }

  var sdT=null;
  function sdPass(){ sdKeepSentence(); sdStrip(); sdLine(); }
  new MutationObserver(function(){clearTimeout(sdT);sdT=setTimeout(sdPass,50);})
    .observe(document.body,{childList:true,subtree:true});
  sdPass();
  sdPub();
})();
</script>
```

Hmm, `sdPretty` prints the API date — formatting only. Good, and note in explanation.

One thing: the observer will fire when #sentence is created → pass again → fine.

Also the sticky cut top:0 — tr.spine also sticky top:0 in original (rebuild unknown); fine.

Explanation section: brief bullet per fault. Then the block.