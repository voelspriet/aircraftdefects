Let me work through this brief carefully.

Two tasks:

**Task 1: Part number fix.** The case sheet row "Part number" currently reads `SX.last.part_number`, but the API returns `PartNumber` (capitalized) and `ComponentPartNumber` is null. The brief says: read `PartNumber`, fall back to `ComponentPartNumber` only when PartNumber is empty. So I need to change `sdNoteRecord` to keep records with `PartNumber` field (not `part_number`), and `sdFillPartRow` to read `PartNumber` first, then `ComponentPartNumber`.

Wait — careful. The current code checks `Object.prototype.hasOwnProperty.call(obj,"part_number")` to identify a single-record response. The actual field per the brief is `PartNumber`. Also `ComponentPartNumber: null`, `PartName`, `PartCondition`, `PartMake`, `PartSerialNumber`. So the record object has `PartNumber` and `ComponentPartNumber`.

So update:
- `sdNoteRecord`: check for `"PartNumber" in obj` (or hasOwnProperty). Keep excluding `records` array and dossier endpoints.
- `sdFillPartRow`: `var raw = rec ? (rec.PartNumber ?? rec.ComponentPartNumber) : null` — read PartNumber first; fall back to ComponentPartNumber only when PartNumber is empty (null/undefined/empty string).

Careful with the fallback logic: `pn = String(raw).trim()`; if PartNumber is empty/null, use ComponentPartNumber. Then "not recorded" only when both are empty. Must not print "not recorded" when PartNumber = "17039203426".

But also: the current code's `sdFillPartRow` has an early return: `else if(nxt&&nxt.cells&&nxt.cells[0]&&nxt.cells[0].textContent.trim()==="Part number")return;` — "the page drew its own". Hmm, but the brief says "the case sheet seventeen rows, including Part number" must still work — so the page apparently already has a Part number row? Wait — "case sheet | seventeen rows, including Part number". Hmm. But the page currently shows "Part number = not recorded" per the brief: "the page Part number = not recorded". So the page itself draws a Part number row with "not recorded"? Or does our injected row do it?

Actually re-reading: "You read `ComponentPartNumber`, which is null on this record." — "You" = the current block's JS. So the current block reads `rec.part_number` which doesn't exist (the API has `PartNumber`), so `raw` is null, and the row prints "not recorded" via the absence-detection path. The brief describes the page's symptom, which our injected row produces.

But wait — the brief says "case sheet seventeen rows, including Part number" is something that "works now and must not be lost". Seventeen rows including Part number. The `sdSheetPartRows` function looks for a row where first cell is "Part" and a "How to cite it" row. Then `sdFillPartRow` inserts a new "Part number" row after "Part". So the seventeen rows include our injected "Part number" row. OK.

Hmm, but there's the early return: if the next sibling row's first cell is already "Part number", return (assume page drew its own). That could be a problem if our own row is there — no, our own row has `data-sd-pnrow="1"` and is caught by the first branch. Fine.

Also, there's a subtlety: `sdNoteRecord` currently excludes URLs matching `api/(airframe|repeats|summary|operator|part|export)`. The case record endpoint is `api/case/JR2R20260825350` per the brief. Wait, the brief says "api/case/JR2R20260825350" returns the fields. But the existing code wraps fetch/XHR and looks for a record. Also the exclude list — `case` is not in it, good. But does the case endpoint response contain `PartNumber`? Yes per brief. Good.

Actually wait — is it possible the page fetches the case record and our wrapper picks it up? That's the design. Keep it, but change field names.

Also: the JSON might have the fields with different casing in the actual fetch. The brief explicitly gives `PartNumber` "17039203426". So read that. I should be a bit defensive: check `PartNumber` first, then `ComponentPartNumber`, then maybe `part_number` as legacy? The brief says "Read that, and fall back to ComponentPartNumber only when PartNumber is empty." I'll implement exactly that, but I could also keep `part_number` as a last-ditch fallback... The brief is strict: "Read that, and fall back to ComponentPartNumber only when PartNumber is empty." Adding a third fallback doesn't violate that — ComponentPartNumber fallback only when PartNumber empty; part_number fallback only when both empty. Hmm, but "Do not declare a name the page already uses" refers to identifiers. I'll keep it simple and exact: PartNumber, then ComponentPartNumber. Maybe include lowercase part_number as tertiary for robustness — but that risks "not recorded" appearing when it shouldn't? No, it's just another source of a real value. Actually the risk: if the endpoint used lowercase and PartNumber was absent, then without the fallback we'd show "not recorded" — the exact sin. With the fallback we'd show the value. The brief says the endpoint uses `PartNumber`. I'll do PartNumber → ComponentPartNumber → part_number. Hmm, but adding `part_number` — is that overreach? The prior block used `part_number` and the brief says that was wrong ("You read ComponentPartNumber"). Wait — the brief says "You read ComponentPartNumber, which is null on this record." But the code reads `rec.part_number`. Hmm, maybe the brief is describing the conceptual bug loosely, or maybe an earlier version read ComponentPartNumber. Either way: read PartNumber, fallback ComponentPartNumber. I'll do exactly that two-step, no third. Actually... to be safe against both casings, I could normalize: check `PartNumber` then `ComponentPartNumber`. The brief's data shows both fields exist with those exact names. Exact compliance is best. Two-step only.

Also `sdNoteRecord` detection: must identify a single-record response. Currently requires own `part_number` property. Change to `PartNumber`. But should it require `PartNumber` to be present even when null? The endpoint returns `PartNumber` always (possibly null? presumably). Use `Object.prototype.hasOwnProperty.call(obj,"PartNumber")`. Also exclude objects that have `records` (list endpoints). Keep the URL exclusion list.

Hmm — also consider: the locate endpoint response `api/locate` returns `results` array — not a single record, no `PartNumber` property, fine.

Also `kick()` is called in `sdNoteRecord` before `kick` is defined — function declarations are hoisted, fine (already the case).

**Task 2: api/locate wiring.**

POST `api/locate` with body `{records:[{id,text},...]}`, max 25. Returns `results[]` with `{id, where, span}`, plus `dropped_unverifiable` (int), `checked` (int), `note` (str).

Requirements:
- Put it in the record table, "which shows the mechanic's own words under each row" — that's the `.wu` write-up area under rows (`tr.wrote td` contains `.wu`).
- One control that sends the write-ups now on screen — first 25 of what's on screen — and says that's what you sent.
- Marks each row it could place, with the quoted span beside the location so a reader can check it against the sentence above.
- Show `dropped_unverifiable` and `note`, both.
- Mark everything this produces as read by a model, distinctly from the FAA's own zone codes.
- Prefix every new name (`sd-loc...`).
- Survive redraws (MutationObserver pass pattern). Since the table redraws on every filter change, I need to either re-render from cache or re-run. Best: cache results per record id, and on each pass, re-apply marks from cache. The control itself needs to persist — since the table redraws, I should insert the control in `pass()` if missing.

Where exactly to put the control? "the record table, which shows the mechanic's own words under each row. One control that sends the write-ups now on screen". I'll place it above the table (or right after the table header area). I need to find the table. The existing `tagTable` finds `.wu` and its closest table, adds class `sdtable`. So the record table contains `tr.wrote` rows with `.wu` cells.

How do rows map to records? Each `.wu` presumably sits in a `td` within a `tr.wrote`, and the preceding row contains the record's cells (tail, operator, etc.). I need an id per record to send to the API: `{id, text}`. The id — what does the page have? The cells call `setFilter('operator',...)` etc. Hmm. The record id... The dossier tail click uses `data-ask="tail|..."`. For id, maybe I can use the control number? The brief mentions "the record whose control number is JR2R20260825350". Maybe each row has an id or data attribute. I don't know the page's DOM precisely.

Safe approach: extract ids from the DOM if available (e.g., row `id` attribute, `data-id`, or any element with something like a control number). Fallback: synthesize ids as row index (e.g., "row-0"). The API's `results[]` each have `id` — echo back, so synthesized ids are fine for matching rows as long as I key on my own ids. Actually since I match results to rows myself via my id map, synthesized ids work entirely.

But wait — "keeps a location only when the quoted span appears verbatim in the write-up" — server-side verification. So my job: send text (the write-up text), get back `{id, where, span}`, then render in the row: the location (`where`) and the quoted `span` beside it.

Extraction of write-ups: for each `tr.wrote` (or each `.wu`), get `.textContent`. But careful: if I've previously injected locate output into the row, re-reading text would include my injected text. I should store original text or mark injected nodes and exclude them, or better: strip `[data-sd-loc]` nodes' text when reading. Simplest: when collecting text, clone the `.wu` node, remove any `[data-sd-locout]` descendants, then read textContent.

Placement of output: inside the `.wu` cell, appended at the end, marked distinctly. Or as a new row? Adding a row might break "seventeen rows" (that's the case sheet, not the record table — fine). But simpler and safer: append a marked block inside the `.wu` div (which has `.clip` handling — max-height 112px with fade when `.clip`). Hmm, if `.wu` is clipped, appended content may be hidden. The `.wu:not(.clip)` has padding-bottom:34px for the gloss. If `.wu.clip`, overflow hidden max-height 112px — my locate line at the bottom might be cut off. Where's `.clip` applied? Unknown — it's in CSS as `.wu.clip`. The page may add `.clip` to long write-ups.

Alternative: put the locate output in the row's cells differently. Options:
1. Append inside `.wu` — risk clipping.
2. Append a new `td`? No, rows are table rows with fixed column counts.
3. Append after the `tr.wrote` row a new `tr` marked as model output. That survives redraws only if re-applied each pass — fine, we re-apply from cache each pass. But inserting rows might confuse the page's own row logic? The page redraws the whole table body on filter change, wiping our rows; we re-add. Should be OK. But "the record stepper" — is there paging logic that counts rows? Possibly. Hmm.

Actually option 1 with a fix: also remove `.clip` from any `.wu` that contains our locate output? That changes the original clipping behavior... The clip is a page feature ("clip/fade like the original" per my own CSS comment). If I un-clip rows with locate output, long write-ups would show fully — acceptable? It changes appearance but not data. Alternatively place the locate output above the clip? Can't easily.

Hmm, alternatively, put the locate output in the *data row* (the row above `tr.wrote`), in the last cell? Messy.

Let me reconsider: the write-up cell structure: `tr.wrote td` contains `.wu` (position:relative). The `.wu-gloss` is absolutely positioned at bottom. If `.wu` is clipped (max-height 112px, overflow hidden), absolutely-positioned children at bottom:0 would be at the bottom of the 112px box — visible within the clip. Actually if I position my locate output absolutely at bottom of `.wu`... it would overlap the text. No.

Simplest robust approach: append the locate output as a block-level element right after the `.wu` div, inside the same `td`. Then it's below the write-up, not clipped (since clip is on `.wu`, not the td). The td has `padding:0 0 14px` for `tr.wrote td`. So appending after `.wu` inside the td works and is visible. 

But which td? `.wu` is inside a td in `tr.wrote`. `wu.closest('td')` gives the td. Append there.

Now, the control: one button "Locate these write-ups" or similar. Where? Above the table. I'll insert it before the table (or into a container). The table — I can `table.insertAdjacentElement('beforebegin', wrap)` but the table might be inside a wrapper that redraws... Since `pass()` runs on every mutation, I re-insert if missing. To avoid infinite mutation loops: inserting my control triggers the MutationObserver → kick → pass → pass sees control exists → no insert → no further mutations. Fine. But `pass()` calls many functions that mutate; as long as they're idempotent (check-then-act), the loop settles. Existing code already does this.

Where exactly to insert the control: `table.parentNode.insertBefore(ctrl, table)`. If the table's parent is redrawn, the control disappears and gets re-inserted — with state? I'll keep state (results cache) in a module-level object keyed by record id, so re-insertion can re-render the "last run" summary too.

Control contents:
- Button: "Locate these write-ups" — with explanation: "Reads the first 25 write-ups on screen; each location is kept only if the quoted words appear verbatim." Send POST.
- After run: summary line: "Sent the first 25 of the N write-ups on screen. Placed X, dropped Y unverifiable. note" — must show `dropped_unverifiable` and `note` explicitly.
- Mark rows: for each result with `where`, add block in that row's write-up: "Model's reading: <where> — "..." (quoted span)". Distinct styling, marked as model output.

Also mark "read by a model": the endpoint reads the mechanic's sentence and says where — the `where` is model-generated. So label: "read by a model" tag on each row mark and on the summary. Distinct from FAA zone codes — my CSS class `sd-loc-*` with a distinct style (e.g., amber/olive like `.sd-mine` `#7a5b00`, dashed border, etc.). Also maybe an aria / data attribute `data-sd-model="1"`.

Handling fewer than 25: "Send the first 25 of what is on screen and say that is what you sent". So if table shows 100 rows, send 25, and state "sent the first 25 of the 100 write-ups on screen". If ≤25, send all, say so.

Row → id mapping: I need stable ids. Options: check row for `data-id`, `id` attribute. The record's control number: maybe in a cell like `code.cd` with text matching /^[A-Z]{2,4}\d{...}/? Risky. I'll do: id = row's `data-sd-id` if present, else row `id` attribute if present, else "sdrow-" + index. Also include the index in the id to disambiguate. Actually simplest deterministic: `sdrow-<index>` where index is position among collected write-ups on screen at send time. Since results are matched by id and I re-apply to rows by recomputing the same collection order, indices may shift between filter changes — but the cache is per-run; on redraw, rows change anyway. When re-applying after redraw, I match by recomputing the collection; if the same filter is active, same order → same ids. If filters changed, stale marks should be cleared. Hmm — actually after filter change the table is rebuilt with different rows; re-applying cached results keyed by old ids could mis-mark. I'll key the cache by text hash instead? Simpler: cache by write-up text (first 200 chars) → result. On re-apply, compute text of each `.wu`, look up cache. That's robust across redraws and reorderings. And dedupe identical texts naturally.

So:
- `SDLOC = {cache:{}, last:null}` where cache maps textKey → {where, span} or null (dropped/failed).
- `sdLocRows()`: find record table via `.wu` presence; collect `[{wu, td, text}]` in DOM order, excluding previously injected output.
- Button handler: collect, take first 25, POST `/z/api/locate` with `{records:[{id:i, text}]}`. Wait — id: what should id be? The API echoes ids. I'll send `id` as the index (0..24) or a stable key. Use index within the sent batch; store mapping index→textKey.

Hmm, but ids — maybe better to send something meaningful. Since we don't know real record ids from DOM reliably, index is fine and honest ("first 25 of what is on screen").

Actually wait — could rows have real ids? Let me think about what the page might have. Cells have onclick with setFilter. There might be a control-number cell with `code.cd`. The brief says "the record whose control number is JR2R20260825350" — control numbers exist in data. Maybe a cell contains it. I could try to extract a control-number-like token per row: `/JR[A-Z0-9]+/`? Too speculative. Index ids it is. The API returns results with id + where + span; I match back by id.

Response handling:
- `results` array: for each, `where` (location string), `span` (quoted text), `id`. Some results might lack `where` (couldn't place)? The spec: "returns results[] each with id, where, span". Maybe only placed records are in results; `dropped_unverifiable` counts the rest. I'll treat results entries as placed; any sent id not in results is unplaced. But defensively, if a result has empty `where`, treat as unplaced.
- Show `checked` too? Brief says show `dropped_unverifiable` and the `note`, both. I can also show checked ("read 25, kept 21, dropped 4 unverifiable"). Nice.
- Render summary near the control: e.g.:

"Read by a model: sent the first 25 of the 100 write-ups on screen. 21 placed, 4 dropped as unverifiable — the model's words are kept only when the quoted span appears verbatim in the write-up." Then the note in italics/quote: note text.

- Each placed row gets: a block appended after `.wu`: 
`<p class="sd-loc" data-sd-locout="1"><span class="sd-loc-tag">read by a model</span> <b>where</b> <span class="sd-loc-span">"..."</span></p>`
With aria maybe. The quoted span lets reader verify against the sentence above.

Re-application each pass: `sdLocApply()` — for each collected write-up, if cache[textKey] has a placement, ensure the block exists (check for `[data-sd-locout]` in td) and matches; if cache says unplaced/dropped, ensure no stale block? Hmm — if a row previously marked, then table redraws with same text, re-add block. If cache has entry with `where==null` (dropped), don't add anything.

But careful: rows that were sent but dropped — should they show anything? The brief: "marks each row it could place". Dropped rows get nothing on the row; the count appears in the summary. But should the summary persist across redraws? The control wrapper is re-inserted; I can re-render the last summary into it. But if filters changed, the summary about "first 25 of 100" is stale — rows on screen changed. Hmm. Option: clear last-run state when the set of write-up texts changes? Simpler: keep the last summary but label it with what was sent... Actually, on filter change the whole selection changed; showing old results would be misleading — the worst-class sin adjacent. Safer: store a fingerprint of the current write-up texts (joined hash); if current fingerprint ≠ fingerprint at run time, clear summary and row marks (they won't match anyway by text key — marks only reappear if same text present, which is actually fine and even good: same write-up, same model reading). Hmm — actually keeping row marks keyed by text is *correct*: the same write-up text gets the same model reading. That's not misleading. But the summary line "sent first 25 of 100" refers to a previous screen state. I'll keep the summary only while the fingerprint matches; when the screen changes, drop the summary but keep per-row marks (they're text-keyed and still valid). Hmm, but then "dropped_unverifiable" count disappears on redraw — is that losing required display? The requirement is to show it; it shows after a run. Persisting across unrelated filter changes isn't required and could be misleading. Actually... "Show dropped_unverifiable and the note, both" — at the time of the run. I'll keep them until the table's contents change. But wait — my `pass()` re-inserts the control wrapper; if I keep `SDLOC.last` and re-render summary when fingerprint matches, good.

Hmm, but there's a subtlety: row marks keyed by text persist even after fingerprint change. Is that "surviving the page redrawing on every filter change"? The brief says "Write it so it survives the page redrawing" — the marks surviving via text-keyed cache is exactly that. But could re-appearing marks after a filter change confuse? If the same write-up is on screen, showing its model reading is correct. I'll keep that.

But one more: the marks must not pollute the text sent on a subsequent run — I exclude `[data-sd-locout]` when reading text. Good.

Fingerprint: join of textKeys of current on-screen write-ups (maybe limited to... all of them? could be 100 texts × long strings — fine, hash by length+first chars? Just use array of textKeys and compare join; strings are big but OK. Or count + first/last keys. I'll do a simple djb2 hash of the joined keys to keep it cheap.

Wait, simpler: fingerprint = number of write-ups + textKey of first + textKey of last. Good enough. Actually to be safe (dedupe?), fine.

Now the control wrapper markup:

```html
<div id="sd-locbar" data-sd-model="1">
  <button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>
  <span class="sd-loc-exp">Sends the first 25 write-ups on screen to a model that reads where each defect was, in words. A location is kept only when the quoted words appear verbatim in the write-up; everything it cannot prove comes back counted, not shown.</span>
  <div id="sd-locsum" hidden></div>
</div>
```

Button styling: page has `.sdbtn` and `.ghostbtn` classes used in my noRows HTML, so those exist. Use `sdbtn`.

Summary content after run:

```
<p class="sd-loc-line">Sent the first 25 of the 43 write-ups on screen. The model placed 19 and dropped 6 it could not verify against the words.</p>
<p class="sd-loc-note">"note text"</p>
```

Must literally show dropped_unverifiable and note. Also "say that is what you sent" — "Sent the first 25 of the 43 write-ups on screen." ✓. If ≤25: "Sent all 12 write-ups on screen."

Hmm — what if `checked` differs from sent count? Show it: "read 25, placed 19, dropped 6". I'll include checked: "checked 25".

Row mark markup:

```html
<p class="sd-loc" data-sd-locout="1">
  <span class="sd-loc-tag">read by a model</span>
  <span class="sd-loc-where">Wing, leading edge</span>
  <span class="sd-loc-span">“left wing leading edge skin”</span>
</p>
```

CSS distinct: e.g., border-left 2px dashed amber (#7a5b00), background #fdf9ee, font small. And `.sd-loc-tag` uppercase small amber. Distinct from FAA zone codes which are presumably mono `code.cd` in the data row. Also add `title` maybe.

Also the trailing period in "SD_KIND" style... irrelevant.

POST implementation:

```js
function sdLocSend(){
  var rows=sdLocCollect();
  if(!rows.length){...show "no write-ups on screen"...}
  var batch=rows.slice(0,25);
  var payload={records:batch.map(function(r,i){return {id:String(i), text:r.text}})};
  fetch("/z/api/locate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
   .then(r=>{if(!r.ok) throw...; return r.json()})
   .then(function(j){
     var res=j&&Array.isArray(j.results)?j.results:[];
     var dropped=sdNum(j.dropped_unverifiable);
     var checked=sdNum(j.checked);
     var note=j.note?String(j.note):"";
     // cache
     batch.forEach(function(r,i){ SDLOC.cache[r.key]=null; });
     res.forEach(function(x){
       var i=parseInt(x.id,10);
       if(!(i>=0&&i<batch.length))return;
       var where=x.where?String(x.where).trim():"";
       var span=x.span!=null?String(x.span).trim():"";
       if(where) SDLOC.cache[batch[i].key]={where:where,span:span};
     });
     SDLOC.last={sent:batch.length,total:rows.length,placed:countOfPlaced,dropped:dropped,checked:checked,note:note,fp:fingerprint(rows)};
     kick(); // re-render
   })
   .catch(function(){ SDLOC.last={error:true,...}; kick(); });
}
```

Wait: `res.forEach` with `x.id` — id might be number or string; handle both via `String(x.id)` and map index→batch. Use `var idx=Number(x.id); if(!isFinite(idx))`... ids I sent are "0".."24" strings; server echoes. Handle numeric or string.

Dedup text keys: two identical write-ups share a cache key — fine, both get marked. But if two identical texts and only one was in batch... both get marked with same reading. Acceptable (same text → same reading). Edge case, fine.

Button disabled state during flight: set `SDLOC.busy`, render "Reading 25 write-ups…". Since pass() re-renders, manage via re-render function `sdLocRender()` that sets button text/disabled from state.

Rendering summary each pass:

```js
function sdLocRender(){
  var bar=byId("sd-locbar"); if(!bar) return;
  var btn=byId("sd-locbtn"); ...
  var sum=byId("sd-locsum");
  if(SDLOC.busy){sum.hidden=false; sum.textContent="Reading "+SDLOC.busyN+" write-ups…"; btn.disabled=true; ...}
  else { btn.disabled=false; btn.textContent="Locate these write-ups"; if(SDLOC.last && !SDLOC.last.error && SDLOC.last.fp===currentFp()) { render summary } else sum.hidden=true; }
}
```

Hmm, wait: on error, show an honest failure line: "The locate endpoint did not answer. Nothing is marked rather than something wrong." Show it until next run or change. Keep with fp check? Error case: show regardless of fp? Show while fp matches too.

Now the collect function:

```js
function sdLocCollect(){
  var out=[],ws=document.querySelectorAll(".wu"),i;
  for(i=0;i<ws.length;i++){
    var wu=ws[i];
    if(!wu.isConnected) continue;
    var td=wu.closest("td"); if(!td) continue;
    // skip if inside our own... wu wouldn't be in our output
    var clone=wu.cloneNode(true);
    var junk=clone.querySelectorAll("[data-sd-locout]"); // shouldn't exist inside wu, but safe
    ...remove...
    var text=(clone.textContent||"").replace(/\s+/g," ").trim();
    if(text.length<15) continue;
    out.push({wu:wu,td:td,text:text,key:sdLocKey(text)});
  }
  return out;
}
```

Key: hash the text to keep cache keys small: djb2 hex + length. Collisions negligible? djb2 32-bit over ~200 texts — fine, but to be safe use hash + length + first 24 chars? Just `h.toString(36)+"_"+text.length`. Fine.

Apply function:

```js
function sdLocApply(){
  var rows=sdLocCollect(),i,r,hit;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    hit=SDLOC.cache[r.key];
    var existing=r.td.querySelector("[data-sd-locout]");
    if(hit){
      if(!existing){
        var p=document.createElement("p");
        p.className="sd-loc"; p.setAttribute("data-sd-locout","1");
        p.setAttribute("data-sd-model","1");
        var tag=document.createElement("span"); tag.className="sd-loc-tag"; tag.textContent="read by a model";
        var wh=document.createElement("b"); wh.className="sd-loc-where"; wh.textContent=hit.where;
        p.appendChild(tag); p.appendChild(wh);
        if(hit.span){ var sp=document.createElement("span"); sp.className="sd-loc-span"; sp.textContent="\u201c"+hit.span+"\u201d"; p.appendChild(sp); }
        r.td.appendChild(p);
      }
    }
    // if !hit, leave existing? If cache says null explicitly (ran & dropped), remove stale mark? cache[r.key]===null means ran and not placed → remove existing to stay honest.
    else if(SDLOC.cache.hasOwnProperty(r.key) && existing){ existing.remove(); }
    else if(!SDLOC.cache.hasOwnProperty(r.key) && existing){ /* stale from older code? keep? */ }
  }
}
```

Hmm — if a mark exists but no cache entry (e.g., cache cleared), removing could be wrong. But marks are only created by us with a cache entry; entries are never deleted except overwrite. After a re-run, dropped ones get cache[key]=null → mark removed. After filter change + redraw, no marks exist. So the only case of existing-without-entry is impossible; the removal branch with hasOwnProperty null handles re-run drops. Actually if `hit` falsy and hasOwnProperty and existing → remove. Combined above. Simplify:

```js
if(hit){ ensure mark }
else if(hasOwnProperty(key) && existing){ existing.remove() }
```

Wait — should marks be inside the td (after `.wu`) or inside `.wu`? I decided td, after `.wu`. But is there exactly one `.wu` per td? `tr.wrote td` presumably has one td containing `.wu`. Appending to that td puts it below the write-up, above the next row. Good. Also glossary `.wu-gloss` is inside `.wu` absolute-bottom — unaffected.

But hold on — the CSS `tr.wrote td{padding:0 0 14px}` and `.wu:not(.clip){padding-bottom:34px}` — appending a p after .wu inside td will sit in that area; the .wu has padding-bottom 34px making a gap. Slight gap, fine. Actually maybe margin-top small negative? Just add `.sd-loc{margin:2px 0 0}` and maybe `.wu:not(.clip)+.sd-loc{margin-top:-26px}`? Hmm, risky if structure differs. Keep simple: `.sd-loc{margin:0 0 2px}`. Actually the 34px padding-bottom on .wu reserves space for the absolute gloss at bottom:0 — the gloss sits in that space. My mark appended after would come after that padding. Fine, just a gap of ~34px minus... eh, add `margin-top:-28px`? If .wu is not clip, gloss occupies bottom ~; the mark would overlap the gloss possibly. The gloss is at left:12px bottom:0 of .wu — inside .wu's padding area. My mark after .wu is outside .wu. Overlap only if I use negative margin. Don't. Accept the gap.

Hmm, wait — actually maybe better to place the mark inside `.wu` after all? `.wu` is position:relative. If `.wu` has `.clip` (max-height 112, overflow hidden), a static child at the end gets clipped. Not inside then. TD it is.

Now, where to insert the control bar. `sdLocBar()` in pass():

```js
function sdLocBar(){
  var tbl=null;
  var w=document.querySelector(".wu");
  if(w) tbl=w.closest("table");
  if(!tbl) {remove bar? return;}
  var bar=byId("sd-locbar");
  if(!bar){
    bar=document.createElement("div"); bar.id="sd-locbar";
    bar.setAttribute("data-sd-model","1");
    bar.innerHTML= '<button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>'
      +'<span class="sd-loc-exp">…</span>'
      +'<div id="sd-locsum" hidden></div>';
  }
  if(bar.nextElementSibling!==tbl || bar.parentNode!==tbl.parentNode) tbl.parentNode.insertBefore(bar,tbl);
}
```

Wait — `insertBefore(bar, tbl)` when bar already directly before tbl: the condition `bar.nextElementSibling!==tbl` false → skip. Good, avoids mutation loop.

But the table may be inside a container that also holds header text; inserting before table puts bar between? Fine.

Also — what if the table is hidden (no rows, `#noRows` shown)? `.wu` absent → no bar. Good — control only when write-ups on screen. But also "the record table" — the table element itself may exist with header only; `.wu` per-row. OK.

Also careful: the case sheet is also a `table` with rows, but no `.wu` inside. `w.closest("table")` from a `.wu` gets the record table. Good.

Now also must ensure: "Every cannot_show sentence from all three dossier endpoints on screen" — already handled by `sdLimits` in renders; unchanged.

Phase B unchanged — I'm not touching those functions, but I must return the whole block including them. The CSS and JS blocks must be returned whole. I'll reproduce the existing blocks with the modifications:

1. `sdNoteRecord` — field check `"PartNumber"` (hasOwnProperty), maybe also accept `ComponentPartNumber` presence as marker? The endpoint always includes PartNumber per brief. Use hasOwnProperty("PartNumber"). Hmm — but what if some records genuinely lack the key? Then that response isn't captured — but then there'd be no part row data anyway; the sheet row would show... absence detection with no rec → "not recorded". Risk: if PartNumber key absent but ComponentPartNumber present with value → we'd wrongly show not recorded. Accept both as markers: `hasOwnProperty("PartNumber")||hasOwnProperty("ComponentPartNumber")`.

2. `sdFillPartRow` — raw = rec.PartNumber; if empty → rec.ComponentPartNumber; (keep part_number? The brief is explicit: PartNumber, fall back to ComponentPartNumber. I'll do exactly those two. Adding part_number too costs nothing and guards casing... but brief said only two. Hmm, "fall back to ComponentPartNumber only when PartNumber is empty" — a third fallback doesn't contradict. I'll include the old lowercase as a final safety since the previous code used it — no, wait: if the real field is `PartNumber` and old code read `part_number` and got null... the old code read `part_number` which returned undefined → "not recorded" printed. The brief's diagnosis sentence mentions ComponentPartNumber — maybe describing what the page's own sheet code does. Whatever. I'll implement PartNumber → ComponentPartNumber → part_number chain; the "only when X is empty" ordering is preserved. Actually, let me reconsider: could reading `part_number` ever produce a wrong non-empty value? Only if some endpoint returns lowercase part_number — that would be a real value, fine. Include it.)

Also the URL exclusion regex: add `locate` to excluded endpoints (locate responses have `results`, no PartNumber — but be safe): `/api\/(airframe|repeats|summary|operator|part|export|locate)(\/|\?|$)/i`.

3. New locate section: constants, state, collect, key, fingerprint, bar, render, send, apply; wire into `pass()`: `sdLocBar()`, `sdLocRender()`, `sdLocApply()`.

Also the click handler for the button — button has id `sd-locbtn`; attach listener when creating bar (once). Since bar persists (we only move it), attach at creation. But if bar gets wiped by redraw, recreated → listener reattached at creation. Good.

One more consideration: the fetch wrapper — our POST to locate goes through the wrapped fetch; response JSON has no PartNumber → ignored. Good. And URL exclusion includes locate anyway.

Also — payload size: 25 write-ups, each maybe 1–2KB → fine.

CORS/endpoint path: existing code uses `/z/api/...` prefix (sdGetJSON uses "/z/api/"+path). So locate → POST "/z/api/locate". Good consistency.

Now think about "Mark everything this produces as read by a model, distinctly from the FAA's own zone codes". The where values are model words (e.g., "upper fuselage, forward of the wing"). Zone codes in the table are FAA's. My marks: class `sd-loc`, tag "read by a model", amber styling, dashed border. Also maybe prefix the where with nothing extra since tag covers it. Good.

Accessibility: `aria-label` on bar? Add `role="region" aria-label="Model-read locations for the write-ups on screen"` on the bar.

Now the summary line wording — must include:
- what was sent: "Sent the first 25 of the 43 write-ups now on screen." (or "Sent all 12 write-ups now on screen.")
- placed count and dropped_unverifiable: "Placed 19; dropped 6 it could not verify." — explicitly the number dropped_unverifiable. Also checked: maybe "checked 25". I'll write: "Read 25 write-ups, placed 19, dropped 6 unverifiable." Hmm use the returned numbers: checked, results placed count, dropped.
- note: show verbatim, labeled: note text.

Let me draft summary HTML (built with DOM or innerHTML with escaped values — numbers and note are server strings; escape note via sdEsc... sdEsc exists. But building via textContent pieces is cleaner. I'll use innerHTML with sdEsc for note.)

```
'<p class="sd-loc-line">Sent the first '+sent+' of the '+total+' write-ups now on screen. The model checked '+checked+', placed '+placed+', and dropped '+dropped+' it could not verify against the words.</p>'
+(note?'<p class="sd-loc-note">'+sdEsc(note)+'</p>':'')
```

Wait — "say that is what you sent, rather than sending everything and showing whatever comes back" — ✓ "Sent the first 25 of the 43 write-ups now on screen." If sent===total: "Sent all 12 write-ups now on screen."

Also placed: compute from results (count of cached placements from this run) — store in SDLOC.last.placed.

Edge: what if `checked` is 0/absent? Show sent count instead. I'll compute `var checkedN = j.checked!=null?sdNum(j.checked):sent;`.

The button label / exp text. Keep concise:

exp: "Reads the write-ups on screen and marks where each defect was, in the model's own words. A location is kept only when the quoted span appears word for word in the write-up; what cannot be proved is dropped and counted."

Now CSS additions (prefix sd-loc):

```css
#sd-locbar{max-width:1140px;margin:10px auto 0;padding:8px 12px;border:1px dashed #c9a24b;background:#fdfaf1;border-radius:4px;font-size:12px;color:#5c554c;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}
#sd-locbar .sd-loc-exp{flex:1 1 320px;min-width:0;line-height:1.45}
#sd-locsum{flex-basis:100%;margin:0}
#sd-locsum p{margin:3px 0}
#sd-locsum .sd-loc-line{font-size:12.5px;color:var(--ink)}
#sd-locsum .sd-loc-note{font:italic 13px/1.5 Georgia,serif;color:#7a5b00}
.sd-loc{margin:4px 0 0;padding:5px 10px;border-left:2px dashed #c9a24b;background:#fdfaf1;font:12px/1.5 'IBM Plex Mono',ui-monospace,monospace;color:#5c554c}
.sd-loc .sd-loc-tag{display:inline-block;margin-right:8px;padding:1px 6px;font:600 9px/1.4 Archivo,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#7a5b00;background:#fff;border:1px solid #e3d3a6;border-radius:3px;vertical-align:1px}
.sd-loc .sd-loc-where{color:var(--ink);font-weight:500}
.sd-loc .sd-loc-span{color:#7a5b00;font-style:italic}
```

Hmm — record table width: table cells; the td containing wu spans table width presumably. Fine. Also mobile: fine.

Also should the bar be constrained? The table might be in a narrower container; bar inserted as sibling before table inherits container width. Don't set max-width then — actually `#sd-locbar` with max-width:1140px could conflict inside narrower container; harmless (max-width only). Actually margin auto with narrower parent = full width. OK. But dossier uses `max-width:1140px;margin:14px auto` — table container may already be that width. I'll drop max-width/margin auto and just use margin:10px 0. Keep simple.

Wait, one more Phase B concern: inserting a div before the record table — does any Phase B count depend on DOM structure (18 controls, 16 panels)? "18 controls" — probably filter controls; my button is a new button... "18 starter questions", "4 rails", "16 panels" — counts of specific page elements, presumably counted in tests by specific selectors; my additions shouldn't affect them. The existing block already adds buttons (revealBtn, marks). Fine.

Also "No page error at 1440 or 390" — code must not throw. Guard everything with try/catch in pass, and null checks.

Potential mutation loop: sdLocApply appends marks → mutation → kick → pass → sdLocApply sees mark exists → no change. sdLocBar: no change after placed. sdLocRender: sets textContent each pass? If I set `btn.textContent` every pass even when unchanged, that's a mutation each pass → infinite loop? Setting textContent to the same value — does MutationObserver fire? Yes, characterData/childList mutations fire even if identical string (replaceChild of text node). `btn.textContent="x"` removes and re-adds text node → childList mutation → loop! Must guard: only set if changed. Similarly `sum.hidden=false` when already false — setting property doesn't mutate DOM unless value changes; `hidden=false` when already false → attribute stays absent? Setting `el.hidden=false` when it's already false: the IDL attribute setter — if value unchanged, does it set attribute? `hidden` reflects content attribute; setting to false removes attribute; if already absent, removeAttribute no-op — likely no mutation record. To be safe, guard with checks.

So sdLocRender:

```js
function sdLocRender(){
  var bar=byId("sd-locbar"); if(!bar)return;
  var btn=byId("sd-locbtn");
  var sum=byId("sd-locsum");
  if(!sum){sum=document.createElement("div");sum.id="sd-locsum";bar.appendChild(sum)}
  var label;
  if(SDLOC.busy) label="Reading\u2026";
  else label="Locate these write-ups";
  if(btn){
    if(btn.textContent!==label)btn.textContent=label;
    if(btn.disabled!==!!SDLOC.busy)btn.disabled=!!SDLOC.busy;
  }
  var fp=sdLocFp();
  var html="",show=false;
  if(SDLOC.busy){html='<p class="sd-loc-line">Sending '+SDLOC.busyN+' write-ups to the reader\u2026</p>';show=true}
  else if(SDLOC.last){
    if(SDLOC.last.error){ if(SDLOC.last.fp===fp){html='<p class="sd-loc-line">The locate endpoint did not answer. Nothing is marked rather than something wrong.</p>';show=true} }
    else if(SDLOC.last.fp===fp){
      var sent=SDLOC.last.sent,tot=SDLOC.last.total;
      var sentTxt=(sent>=tot)?('all '+tot+' write-ups now on screen'):('the first '+sent+' of the '+tot+' write-ups now on screen');
      html='<p class="sd-loc-line">Sent '+sentTxt+'. The model checked '+SDLOC.last.checked+', placed '+SDLOC.last.placed+', and dropped '+SDLOC.last.dropped+' it could not verify against the words.</p>'
        +(SDLOC.last.note?'<p class="sd-loc-note">'+sdEsc(SDLOC.last.note)+'</p>':'');
      show=true;
    }
  }
  if(!show){ if(!sum.hidden)sum.hidden=true; if(sum.innerHTML!=="")sum.innerHTML=""; }
  else{ if(sum.hidden)sum.hidden=false; if(sum.innerHTML!==html)sum.innerHTML=html; }
}
```

Hmm — `if(sum.innerHTML!==html)` compares normalized serialization; fine.

Also busy message: while awaiting, the summary shows "Sending…". Good.

sdLocFp:

```js
function sdLocFp(){
  var rows=sdLocCollect();
  if(!rows.length)return "";
  return rows.length+":"+rows[0].key+":"+rows[rows.length-1].key;
}
```

But sdLocCollect is somewhat heavy (clones every .wu). Called in pass() each frame after mutations... tables of 100 rows with clone each — could be OK but let's lighten: for fingerprint, we need keys = text hashes → requires reading text anyway. The apply function also collects. Two collects per pass = heavy. Combine: sdLocApply computes rows once, computes fp, stores in SDLOC.fp; sdLocRender uses SDLOC.fp (computed in apply during same pass). Order in pass: sdLocBar, sdLocApply (sets SDLOC.fp), sdLocRender (uses fp). 

Actually simpler: have `sdLocScan()` return rows and set SDLOC.fp; apply uses same rows. Let me structure:

```js
function pass(){ ... try{sdLocBar()}catch(e){} try{sdLocStep()}catch(e){} ... }
function sdLocStep(){
  var rows=sdLocCollect();
  SDLOC.fp=rows.length+":"+(rows.length?rows[0].key:"")+":"+(rows.length?rows[rows.length-1].key:"");
  sdLocApply(rows);
  sdLocRender();
}
```

And sdLocSend recomputes rows itself (fresh), then sets last.fp using the same fp formula from its own rows. Since send happens between passes, fp computed from its rows should match next pass's fp (same DOM). Fine.

textContent of wu includes the gloss text! `.wu .wu-gloss` is inside `.wu`? CSS: `.wu .wu-gloss{position:absolute;left:12px;bottom:0}` — yes, inside `.wu`. So text includes gloss text. Gloss is probably a short hint ("click the tail for its dossier" or similar). Including it in text sent to the model — slight pollution but harmless; and consistent for keying. But the gloss might be identical across rows → fine. Hmm, but the model gets "text" that includes gloss junk at the end. The verbatim span check is against the write-up — gloss at end won't break span matching. Acceptable. Could remove `.wu-gloss` in the clone — easy: `clone.querySelectorAll(".wu-gloss")` remove. Do that for cleanliness. Also remove `[data-sd-locout]` (not inside wu anyway).

Also whitespace normalize: `.replace(/\s+/g," ").trim()`.

Wait — span verbatim check is server-side against the text we send; we send normalized text. If the server checks span appears in text — normalized is fine.

Another subtlety: `sdLocCollect` uses `document.querySelectorAll(".wu")` — the case sheet or dossiers might contain `.wu`? Dossier quotes use `.sd-d-quote`. Case sheet rows — no `.wu`. Only record table. OK.

id mapping: I send id as String(i) for batch index. Response echo: `String(x.id)` parse int.

Now, also the brief: "One control that sends the write-ups now on screen, then marks each row it could place". ✓.

"with the quoted span beside the location so a reader can check it against the sentence above" — my `.sd-loc-span` shows the quoted span next to `where`. ✓ ("the sentence above" = the write-up above in the same cell).

Now, the control's own text should say it's a model's reading before clicking too — the exp covers it, plus bar has data-sd-model.

Let me also double check requirement: "Every cannot_show sentence from all three dossier endpoints on screen" — sdRender includes af.cannot_show (sdLimits), sm.cannot_show (raw ul), rp has note but cannot_show? Existing code: rp (repeats) — no cannot_show rendered for repeats! Hmm. The three endpoints: airframe, repeats, summary. Current block renders af.cannot_show ✓, sm.cannot_show ✓, rp... not rendered. But the brief says this is in "must still be true afterwards": "Every cannot_show sentence from all three dossier endpoints on screen." Was that true before? The current block is described as achieving Phase B etc. Hmm — repeats endpoint may not have cannot_show. The brief's task list doesn't mention adding it. "One false statement, and one build still unreachable" — the two tasks. I should not regress; adding rp.cannot_show rendering would be safe but touches existing behavior... Actually to be safe on "all three", I could add: if rp && rp.cannot_show && length → render sdLimits(rp.cannot_show) inside the repeats section. That's a small, safe addition that helps satisfy the requirement. It doesn't break anything. I'll add it.

Hmm wait, careful — does the "what works now" list constrain me from touching sdRender? "Everything in 'what works now', unchanged" — tail click opens the three endpoints; adding cannot_show rendering doesn't change that. I'll add it minimally: after the repeats section, `(rp&&rp.cannot_show&&rp.cannot_show.length)?sdLimits(rp.cannot_show):""`. Fine.

Now, also check `sdNoteRecord` exclusion regex vs new locate URL — locate is POST to /z/api/locate → matches `api/locate` — I'll add locate to the exclusion anyway.

Also, the JSON detection for case endpoint: response of `api/case/JR2R20260825350` has PartNumber etc. `hasOwnProperty(obj,"PartNumber")` ✓. And `"records" in obj` guard — case response has no records. Good.

But wait — what about the airframe endpoint response containing records with PartNumber? Excluded by URL. Summary/operator/part endpoints — excluded by URL. OK.

One more: `sdFillPartRow` uses `SX.last` — latest single record wins. If user opens case sheet for record A then record B, latest fetch wins. But stale: if the sheet is shown for A and no new fetch... the wrapper catches the page's own fetch of the case record. Presumably page fetches on open. OK, unchanged behavior, just field fix.

Now also there's the `sdAbsence` fallback when pn empty: shows "not recorded" — only when both PartNumber and ComponentPartNumber empty. Good: "not recorded must appear only when the field really is empty."

Implementation of raw extraction:

```js
var rec=SX.last;
var raw=(rec&&typeof rec==="object")?rec.PartNumber:null;
if(raw==null||String(raw).trim()===""){
  raw=(rec&&typeof rec==="object"&&rec.ComponentPartNumber!=null)?rec.ComponentPartNumber:null;
}
if(raw==null||String(raw).trim()===""){
  raw=(rec&&typeof rec==="object"&&rec.part_number!=null)?rec.part_number:null;
}
var pn=(raw==null)?"":String(raw).trim();
```

Hmm the third lowercase fallback — decide: include. It's harmless and defensive. Actually wait — could including `part_number` cause a *wrong* value? Only if endpoint returns a `part_number` field that means something else — no evidence. Include. Hmm, but the brief is a correction instruction; adding a third source might be seen as not following "Read that, and fall back to ComponentPartNumber only when PartNumber is empty." The instruction specifies the primary and its fallback; it doesn't forbid further fallbacks. But minimalism and exactness are prized in these briefs. The prior bug was reading the wrong field. I'll keep just the two named fields — exact obedience. Actually... let me keep two. If PartNumber is the real field per brief, done.

Also `sdNoteRecord` marker: use `hasOwnProperty("PartNumber")||hasOwnProperty("ComponentPartNumber")`.

Now write the locate send:

```js
function sdLocSend(){
  if(SDLOC.busy)return;
  var rows=sdLocCollect();
  if(!rows.length){
    SDLOC.last={error:true,fp:"",nomsg:true};
    // show "no write-ups on screen"
  }
  ...
}
```

Handle empty: set SDLOC.last={empty:true,fp:computed}. In render, if last.empty && fp matches? fp would be "" (no rows) — show "No write-ups on screen to read." Eh, but the bar only exists when `.wu` exists, so rows nonempty always when clickable. Skip elaborate handling; if rows empty, just return (or set error message). I'll set last={error:true,fp:sdLocFpOf(rows),msg:"No write-ups are on screen to read."} and render msg. Simple: give last a `msg` override.

Let me define last shape: `{fp, sent, total, checked, placed, dropped, note}` or `{fp, error:true, msg}`.

Render for error: `<p class="sd-loc-line">'+sdEsc(msg||default)+'</p>`.

Fetch:

```js
SDLOC.busy=rows.length; // count
SDLOC.last=null;
kick(); // render busy  -- careful: kick schedules rAF pass; fine
var payload={records:[]};
for(i=0;i<rows.length;i++)payload.records.push({id:String(i),text:rows[i].text});
fetch("/z/api/locate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
.then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
.then(function(j){
  SDLOC.busy=0;
  var res=(j&&Array.isArray(j.results))?j.results:[];
  var placedMap={};
  res.forEach(function(x){
    if(!x||typeof x!=="object")return;
    var idx=Number(x.id);
    if(!isFinite(idx)||idx<0||idx>=rows.length)return;
    var where=x.where!=null?String(x.where).trim():"";
    var span=x.span!=null?String(x.span).trim():"";
    if(!where)return;
    placedMap[idx]={where:where,span:span};
    SDLOC.cache[rows[idx].key]=placedMap[idx];
  });
  var dropped=(j&&j.dropped_unverifiable!=null)?sdNum(j.dropped_unverifiable):(rows.length-Object.keys(placedMap).length);
  var checked=(j&&j.checked!=null)?sdNum(j.checked):rows.length;
  var note=(j&&j.note!=null)?String(j.note):"";
  // rows not in placedMap and not in results: mark cache null so stale marks clear
  for(var i2=0;i2<rows.length;i2++){ if(!placedMap[i2]&&!SDLOC.cache[rows[i2].key])SDLOC.cache[rows[i2].key]=null; }
```

Hmm wait: careful — cache for unplaced rows: set to null only if not already set. `if(!SDLOC.cache[rows[i2].key])` — if cache[key] is an object (placed from earlier run), and this run dropped it — should overwrite to null (the model ran again and dropped it? But we sent it this run; if not in results, it was dropped this run). Actually if we sent row i2 this run and it's not placed this run, the current reading is "dropped" → cache null. Overwrite unconditionally for sent rows: placed → object; not placed → null. So:

```js
for(i2=0;i2<rows.length;i2++){
  SDLOC.cache[rows[i2].key]=placedMap[i2]||null;
}
```

Wait but duplicate texts: two rows same key, one placed one not — last write wins. Edge case; acceptable. Hmm, actually if duplicates: batch contains both; results would presumably place both or neither. Fine.

But careful: cache null-overwrite for texts that were previously placed by an earlier run but this run dropped — correct (latest run authoritative).

```js
  SDLOC.last={fp:sdLocFpOf(rows),sent:rows.length,total:rows.length+sdLocMore(),checked:checked,placed:Object.keys(placedMap).length,dropped:dropped,note:note};
```

total: number on screen — rows.length is the collected count (all on screen). batch = first min(25, rows.length). Let me restructure: rows = all; batch=rows.slice(0,25); total=rows.length; sent=batch.length.

fp from all rows (or from rows? fp should reflect current screen; use all rows). sdLocFpOf(rows) uses rows array.

```js
.catch(function(){SDLOC.busy=0;SDLOC.last={fp:sdLocFpOf(rows),error:true};kick();});
```

And after success: kick() to re-render and apply marks.

Note: `kick()` inside .then — kick uses rAF; fine.

But one catch: SDLOC.busy render — pass() runs sdLocStep which calls sdLocApply(rows) — during busy, cache may hold old entries; marks stay until results arrive. Fine.

Another catch: during busy, `sdLocRender` shows "Sending…". After response, last set, kick → pass → render shows summary and apply marks. ✓.

Guard concurrent runs: if busy, ignore clicks (button disabled too).

Now `sdLocCollect` cost: querySelectorAll(".wu") then for each: clone + querySelectorAll + textContent + regex + hash. 100 rows × ~1KB — fine even per mutation burst, since pass runs on rAF-coalesced mutations. MutationObserver fires a lot during table rebuild (100 rows inserted → many records but coalesced to one callback per microtask batch → one rAF kick). OK.

Actually — pass() already runs ~15 functions per mutation; adding collect is fine.

Hash function:

```js
function sdLocKey(t){
  var h=5381,i;
  for(i=0;i<t.length;i++){h=((h<<5)+h+t.charCodeAt(i))|0}
  return h.toString(36)+"_"+t.length;
}
```

Now sdLocBar creation with listener:

```js
function sdLocBar(){
  var anchor=null;
  var w=document.querySelector(".wu");
  if(w&&w.isConnected){var t=w.closest("table");if(t&&t.isConnected)anchor=t}
  var bar=byId("sd-locbar");
  if(!anchor){
    if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
    return;
  }
  if(!bar){
    bar=document.createElement("div");
    bar.id="sd-locbar";
    bar.setAttribute("data-sd-model","1");
    bar.setAttribute("role","region");
    bar.setAttribute("aria-label","Model-read locations for the write-ups on screen");
    bar.innerHTML='<button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>'
      +'<span class="sd-loc-exp">Sends the first 25 write-ups now on screen to a model that reads where each defect was. A location is kept only when the quoted words appear verbatim in the write-up above it; what the model cannot prove is dropped and counted. Everything here is a model\u2019s reading, not the FAA\u2019s zone codes.</span>'
      +'<div id="sd-locsum" hidden></div>';
    bar.addEventListener("click",function(e){
      var b=e.target&&e.target.closest?e.target.closest("#sd-locbtn"):null;
      if(b){try{sdLocSend()}catch(_){}}
    });
  }
  if(bar.parentNode!==anchor.parentNode||bar.nextElementSibling!==anchor){
    anchor.parentNode.insertBefore(bar,anchor);
  }
}
```

Wait — button click via delegation on bar; but if bar's innerHTML persists, direct listener once is fine. But if bar is moved (insertBefore of same node) listener persists. Good. Actually simpler: addEventListener on bar for clicks, check target id. Done above.

Hmm — removing the bar when no `.wu`: on initial load with no rows, bar absent. When rows appear, created. OK.

But careful: `anchor.parentNode` — if the table's parent is the redraw scope, bar is wiped each redraw and recreated — fine.

Another consideration: the brief says "Put it where a reader already has write-ups in front of them: the record table". Before the table is fine (or after). Before — reader sees control then table. Good.

Also "at most 25" — slice(0,25) ✓, and summary says "the first 25 of the N write-ups now on screen" ✓.

One more requirement re-read: "Counted in the served HTML: zero. ... One control that sends the write-ups now on screen" — ✓.

"Mark everything this produces as read by a model, distinctly from the FAA's own zone codes, which the table already shows." — The zone codes shown in table are like "ZONE 200" FAA codes. My marks: amber dashed, "read by a model" tag. Distinct ✓. Also the where text itself — should I style the where in non-mono to differ from zone codes (which are probably mono code.cd)? Yes, `.sd-loc` uses... I said mono; change to Georgia/serif italic? Zone codes mono; make model text serif to be clearly different. Let me use Georgia for the where and span, mono only for the tag? I'll make `.sd-loc` Georgia 13px, where in normal ink weight 600? Let's do:

```css
.sd-loc{margin:6px 0 2px;padding:5px 10px 5px 11px;border-left:2px dashed #c9a24b;background:#fdfaf1;font:13px/1.5 Georgia,'Times New Roman',serif;color:#5c554c}
```

Tag in Archivo caps amber. Span quoted italic amber-dark. Where bold ink.

Also add a `data-sd-model="1"` attribute on marks.

Now, the `#sd-locsum` styling and `.sd-loc-note`.

Also mobile (390px): bar flex-wrap; fine. Maybe smaller exp font. Add media query optional — keep simple.

Now double-check "no page error": all new functions defensive. `sdLocSend` — `rows` may be empty → set last error msg "No write-ups are on screen to read." and kick; return.

Also `JSON.stringify(payload)` — text up to 25 × maybe 3KB = 75KB, fine.

Also: does the brief require anything about "checked"? No, optional. I show it as part of the sentence; harmless. Actually maybe drop "checked" to keep the sentence tight? "The model checked 25, placed 19, and dropped 6..." — hmm, sent 25 and checked 25 redundant. Keep it: it uses the API's own number, which is honest. But if checked differs from sent (server checked fewer), that's informative. Keep.

Now, assemble the final JS block: copy the entire current JS, with:

1. `sdNoteRecord`: field check change + exclude locate.
2. `sdFillPartRow`: raw extraction change.
3. `sdRender`: add rp cannot_show (optional but I'll include).
4. New section: sd-locate code.
5. `pass()`: add `try{sdLocBar()}catch(e){}` and `try{sdLocStep()}catch(e){}`.
6. Keep everything else identical.

Also SX comment update mentioning PartNumber.

Let me also check `sdNoteRecord`'s doc comment mentions part_number — update text to PartNumber.

Also the sd-locate cache cleanup: cache grows unbounded — negligible.

Also ensure sdLocSend defined before use (function declarations hoisted within IIFE — all are function declarations, fine).

Let me also double check that sdLocApply's mark matching uses `r.td` — `.wu` is inside td; `wu.closest("td")`. But could `.wu` be inside a `th` or div outside td? For record table rows, td. If closest returns null, skip row (no placement target). Fine.

One more thing: the brief says marks should be "beside the location" — "marks each row it could place, with the quoted span beside the location so a reader can check it against the sentence above." So in the mark: where + quoted span side by side. My p contains: tag, where, span. ✓ "check it against the sentence above" — the write-up is above in the same cell (tr.wrote is below the data row actually — the write-up row is `tr.wrote` under the data row; the mark appended in same td after .wu is below the sentence. "the sentence above" still holds — the sentence is above the mark). ✓

Also the phrase "read by a model" for each row mark + the bar region. Also should the *where* be visually distinct from FAA zone codes that appear in the data row above — yes, different color/font/position.

Potential Phase B issue: `#sd-locbar` inserted before the record table — does the record table live inside a panel with fixed layout? Inserting a sibling shouldn't break counts. The `#noRows` handling unchanged.

Another potential issue: MutationObserver loop via sdLocApply when cache null and existing mark removed — removal triggers mutation → pass → no mark, no cache → nothing → settles. ✓

Also sdLocRender's innerHTML compare — setting innerHTML when identical string: I guard with `!==`, but browsers normalize innerHTML; comparing my constructed html string to serialized DOM may mismatch repeatedly (e.g., quoting). If mismatch every pass → mutation every pass → infinite rAF loop! Danger. Mitigate: build summary with DOM/textContent instead of innerHTML, and compare via a signature string stored on dataset. Let me do: store `sum.dataset.sdSig = sig`; if sig same, skip DOM change. sig = the html string (or a compact key: [sent,total,checked,placed,dropped,note]). Use sig compare, then set innerHTML. Since I control content, sig compare via dataset is reliable.

```js
var sig=show?("s"+sent+"t"+tot+"c"+checkedN+"p"+placed+"d"+dropped+"n"+note):"";
if(sum.dataset.sdSig!==sig){
  sum.dataset.sdSig=sig;
  if(show){sum.hidden=false;sum.innerHTML=html}
  else{sum.hidden=true;sum.innerHTML=""}
}
```

Careful: dataset property set on sum — sum may be recreated on bar recreation; sig resets; fine.

Similarly button textContent guard ✓ (string compare before set).

Similarly `sum.hidden` toggling only inside sig-change branch ✓.

Now check `sdLocFpOf` vs fp stored: in send I compute fp from `rows` (all rows, not batch). In step, fp from collected rows. Same DOM → same. ✓

Also: SDLOC initial `{cache:{},last:null,busy:0,fp:""}`.

Empty-rows click: if bar exists, rows nonempty. But if user clicks between redraw... guard anyway:

```js
if(!rows.length){SDLOC.last={fp:sdLocFpOf(rows),error:true,msg:"No write-ups are on screen to read."};kick();return}
```

Render error with msg.

Also error default msg: "The locate endpoint did not answer. Nothing is marked rather than something wrong."

Now the note display: show verbatim with a label like `Note: "` ...? Brief: "Show dropped_unverifiable and the note, both." My line includes dropped count; note as separate styled line. Maybe prefix "The reader's note: "? The note is presumably a str from the endpoint explaining something. Render as-is, styled distinct. I'll wrap: `<p class="sd-loc-note">'+sdEsc(note)+'</p>` — plain. Good enough; it's the endpoint's own words.

Now — one more thought about ids: brief says records: [{id, text}]. Maybe the id should be the record's actual id so the server can... it just echoes. Index fine.

Also: "The endpoint takes at most 25 records." — server may reject >25; we send ≤25 ✓.

Now write CSS additions. Also I must include ALL existing CSS unchanged plus additions. The CSS block is long; I'll reproduce carefully.

Check existing CSS for anything to tweak: none needed besides additions.

Where to add CSS: at the end, with a comment header `/* sd-locate ... */`.

Now assemble JS. I'll write the full IIFE with modifications. Let me carefully go through the original and edit.

Original sections (keep as-is): error hook, helpers, READING_TEXT, SEED_HTML, SHORT_TOTAL, NOROWS_HTML, sdFiltered, ensureIpad, sdSink, sdEmpty, seatCount, retireStand, ensureReading, stripInline, secondLine, ensureSentence, ensureNoRows, tagTable, snap/sdMirror, purgeLand, sdSetFilter, sdSetHero, sdEnsureGlobals, SX + sdNoteRecord (MODIFY), fetch/XHR wrap, sdIsAbsentText, sdAbsence, sdSheetPartRows, sdFillPartRow (MODIFY), sdPartRow, SD dossier stuff, sdGetJSON, sdReq, sdRenderCached, sdOpen, openers, sdBootFromURL, rrTail, delegated click/keydown, popstate, sdMarkCells, sdDossierKick, queued/pass (MODIFY), kick, observer, boot.

sdRender modify: add rp cannot_show. Insert after the repeats section push:

```js
if(rp&&rp.cannot_show&&rp.cannot_show.length)parts.push(sdLimits(rp.cannot_show));
```

Place right after the repeats section (either branch). I'll add after the if/else block.

Wait — "Every cannot_show sentence from all three dossier endpoints on screen" — hmm, maybe the current block already satisfies it because repeats endpoint has no cannot_show. Adding the conditional is harmless either way. Include.

Now modify sdNoteRecord:

```js
function sdNoteRecord(obj,url){
  try{
    if(!obj||typeof obj!=="object"||Array.isArray(obj))return;
    if(!Object.prototype.hasOwnProperty.call(obj,"PartNumber")&&!Object.prototype.hasOwnProperty.call(obj,"ComponentPartNumber"))return;
    if("records" in obj)return;
    if(url&&/api\/(airframe|repeats|summary|operator|part|export|locate)(\/|\?|$)/i.test(String(url)))return;
    SX.last=obj;
    kick();
  }catch(_){}
}
```

And comment update.

sdFillPartRow raw part:

```js
  var rec=SX.last;
  /* the file's field is PartNumber; ComponentPartNumber is the fallback and
     is empty on most records. "not recorded" only when both really are. */
  var raw=null;
  if(rec&&typeof rec==="object"){
    raw=rec.PartNumber;
    if(raw==null||String(raw).trim()==="")raw=rec.ComponentPartNumber;
  }
  var pn=(raw==null)?"":String(raw).trim();
```

Now the locate section. Also update the top SX comment? The big comment above SX mentions part_number — update to PartNumber.

Write the locate code:

```js
/* ============ sd-locate: api/locate reads the mechanic's own words and says
   where the defect was. The control sits above the record table, sends the
   first 25 write-ups on screen — never more, the endpoint's own limit — and
   says that is what it sent. A row is marked only when the model's location
   came back with a span the server could quote verbatim from the write-up;
   what it could not prove comes back as dropped_unverifiable and a note,
   and both are shown. Everything this draws is labelled as a model's
   reading: amber, dashed, serif — nothing like the FAA's own zone codes.
   Results are cached against the write-up's own text, so a redraw re-marks
   the same sentence with the same reading and never a stale neighbour's. == */
var SDLOC={cache:{},last:null,busy:0,fp:null};
function sdLocKey(t){
  var h=5381,i;
  for(i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;
  return h.toString(36)+"_"+t.length;
}
function sdLocCollect(){
  var out=[],ws=document.querySelectorAll(".wu"),i,j,wu,td,cl,junk,text;
  for(i=0;i<ws.length;i++){
    wu=ws[i];
    if(!wu.isConnected)continue;
    td=wu.closest("td");
    if(!td)continue;
    cl=wu.cloneNode(true);
    junk=cl.querySelectorAll(".wu-gloss,[data-sd-locout]");
    for(j=0;j<junk.length;j++)if(junk[j].parentNode)junk[j].parentNode.removeChild(junk[j]);
    text=(cl.textContent||"").replace(/\s+/g," ").trim();
    if(text.length<12)continue;
    out.push({wu:wu,td:td,text:text,key:sdLocKey(text)});
  }
  return out;
}
function sdLocFpOf(rows){
  if(!rows||!rows.length)return "";
  return rows.length+":"+rows[0].key+":"+rows[rows.length-1].key;
}
function sdLocBar(){
  var anchor=null,w,t;
  w=document.querySelector(".wu");
  if(w&&w.isConnected){
    t=w.closest("table");
    if(t&&t.isConnected)anchor=t;
  }
  var bar=byId("sd-locbar");
  if(!anchor){
    if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
    return;
  }
  if(!bar){
    bar=document.createElement("div");
    bar.id="sd-locbar";
    bar.setAttribute("data-sd-model","1");
    bar.setAttribute("role","region");
    bar.setAttribute("aria-label","A model's reading of where the write-ups on screen say the defect was");
    bar.innerHTML='<button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>'
      +'<span class="sd-loc-exp">Sends the first 25 write-ups now on screen \u2014 no more, the reader\u2019s own limit \u2014 to a model that reads where each defect was. A location is kept only when the quoted words appear verbatim in the write-up; what it cannot prove is dropped and counted. Everything here is a model\u2019s reading, not the FAA\u2019s zone codes.</span>'
      +'<div id="sd-locsum" hidden></div>';
    bar.addEventListener("click",function(e){
      var b=e.target&&e.target.closest?e.target.closest("#sd-locbtn"):null;
      if(!b)return;
      e.preventDefault();
      try{sdLocSend()}catch(_){}
    });
  }
  if(bar.parentNode!==anchor.parentNode||bar.nextElementSibling!==anchor){
    anchor.parentNode.insertBefore(bar,anchor);
  }
}
function sdLocSend(){
  if(SDLOC.busy)return;
  var rows=sdLocCollect();
  if(!rows.length){
    SDLOC.busy=0;
    SDLOC.last={fp:"",error:true,msg:"No write-ups are on screen to read."};
    kick();return;
  }
  var batch=rows.slice(0,25),i,payload;
  payload={records:[]};
  for(i=0;i<batch.length;i++)payload.records.push({id:String(i),text:batch[i].text});
  SDLOC.busy=batch.length;
  SDLOC.last=null;
  kick();
  fetch("/z/api/locate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  }).then(function(r){
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json();
  }).then(function(j){
    SDLOC.busy=0;
    var res=(j&&Array.isArray(j.results))?j.results:[];
    var placed={},placedN=0,i,x,idx,where,span;
    for(i=0;i<res.length;i++){
      x=res[i];
      if(!x||typeof x!=="object")continue;
      idx=Number(x.id);
      if(!isFinite(idx)||idx<0||idx>=batch.length)continue;
      where=(x.where==null)?"":String(x.where).trim();
      span=(x.span==null)?"":String(x.span).trim();
      if(!where)continue;
      placed[idx]={where:where,span:span};
      placedN++;
    }
    for(i=0;i<batch.length;i++)SDLOC.cache[batch[i].key]=placed[i]||null;
    SDLOC.last={
      fp:sdLocFpOf(rows),
      sent:batch.length,
      total:rows.length,
      checked:(j&&j.checked!=null)?sdNum(j.checked):batch.length,
      placed:placedN,
      dropped:(j&&j.dropped_unverifiable!=null)?sdNum(j.dropped_unverifiable):(batch.length-placedN),
      note:(j&&j.note!=null)?String(j.note).trim():""
    };
    kick();
  }).catch(function(){
    SDLOC.busy=0;
    SDLOC.last={fp:sdLocFpOf(rows),error:true};
    kick();
  });
}
function sdLocApply(rows){
  var i,r,hit,mark,tag,wh,sp;
  for(i=0;i<rows.length;i++){
    r=rows[i];
    hit=Object.prototype.hasOwnProperty.call(SDLOC.cache,r.key)?SDLOC.cache[r.key]:undefined;
    mark=r.td.querySelector("[data-sd-locout]");
    if(hit){
      if(!mark){
        mark=document.createElement("p");
        mark.className="sd-loc";
        mark.setAttribute("data-sd-locout","1");
        mark.setAttribute("data-sd-model","1");
        tag=document.createElement("span");
        tag.className="sd-loc-tag";
        tag.textContent="read by a model";
        wh=document.createElement("b");
        wh.className="sd-loc-where";
        wh.textContent=hit.where;
        mark.appendChild(tag);
        mark.appendChild(wh);
        if(hit.span){
          sp=document.createElement("span");
          sp.className="sd-loc-span";
          sp.textContent="\u201c"+hit.span+"\u201d";
          mark.appendChild(sp);
        }
        r.td.appendChild(mark);
      }
    }else if(hit===null&&mark){
      mark.parentNode.removeChild(mark);
    }
  }
}
function sdLocRender(){
  var bar=byId("sd-locbar");
  if(!bar)return;
  var btn=byId("sd-locbtn");
  var sum=byId("sd-locsum");
  if(!sum){
    sum=document.createElement("div");
    sum.id="sd-locsum";
    sum.hidden=true;
    bar.appendChild(sum);
  }
  var label=SDLOC.busy?("Reading "+SDLOC.busy+" write-ups\u2026"):"Locate these write-ups";
  if(btn){
    if(btn.textContent!==label)btn.textContent=label;
    var dis=!!SDLOC.busy;
    if(btn.disabled!==dis)btn.disabled=dis;
  }
  var html="",sig="",show=false,last=SDLOC.last;
  if(SDLOC.busy){
    html='<p class="sd-loc-line">Sending '+SDLOC.busy+' write-ups to the reader\u2026</p>';
    sig="busy"+SDLOC.busy;show=true;
  }else if(last&&last.error){
    if(last.fp===""||last.fp===SDLOC.fp){
      html='<p class="sd-loc-line">'+sdEsc(last.msg||"The locate endpoint did not answer. Nothing is marked rather than something wrong.")+'</p>';
      sig="err"+(last.msg||"");show=true;
    }
  }else if(last&&last.fp===SDLOC.fp){
    var sentTxt=(last.sent>=last.total)
      ?("all "+last.total+" write-ups now on screen")
      :("the first "+last.sent+" of the "+last.total+" write-ups now on screen");
    html='<p class="sd-loc-line">Sent '+sentTxt+'. The model checked '+sdFmt(last.checked)+', placed '+sdFmt(last.placed)+', and dropped '+sdFmt(last.dropped)+' it could not verify against the words.</p>'
      +(last.note?'<p class="sd-loc-note">'+sdEsc(last.note)+'</p>':'');
    sig="s"+last.sent+"t"+last.total+"c"+last.checked+"p"+last.placed+"d"+last.dropped+"n"+last.note;
    show=true;
  }
  if((sum.dataset.sdSig||"")!==sig){
    sum.dataset.sdSig=sig;
    if(show){if(sum.hidden)sum.hidden=false;sum.innerHTML=html}
    else{if(!sum.hidden)sum.hidden=true;if(sum.innerHTML!=="")sum.innerHTML=""}
  }
}
function sdLocStep(){
  var rows=sdLocCollect();
  SDLOC.fp=sdLocFpOf(rows);
  sdLocApply(rows);
  sdLocRender();
}
```

Wait: sdEsc on last.msg in render — msg contains no HTML; fine.

Also `sdFmt` on counts — fine.

One issue: `sdLocRender` error branch condition `last.fp===""||last.fp===SDLOC.fp` — for empty-rows error, fp="" and SDLOC.fp would also be "" (no rows) so matches anyway. Simplify to `last.fp===SDLOC.fp||!last.fp`. Keep as is.

Hmm, wait — there's a subtle issue with the error path fp: on HTTP failure after a run, fp = fp of rows at send time; if screen unchanged, matches. OK.

Another: the busy state — `SDLOC.busy=batch.length` then kick() renders busy; but pass() also runs sdLocApply with old cache — fine.

Potential issue: sdLocSend uses `rows` (collected) while DOM may redraw during the fetch (filter change) → batch keys no longer on screen; cache updated; last.fp won't match new fp → summary hidden; marks won't appear (rows gone). Honest. ✓

Now pass() modifications — add:

```js
try{sdLocBar()}catch(e){}
try{sdLocStep()}catch(e){}
```

Where? After tagTable/sdPartRow, before sdMirror maybe. Order: bar needs table; step needs bar? No, step works regardless. Put after sdMarkCells.

Wait — sdLocStep calls sdLocRender which needs bar; if bar absent (no table), render returns early. But SDLOC.fp still set — harmless.

One more possible problem: sdLocBar insertBefore each pass if condition true. After first insert, condition false. But when the page redraws the table's parent... whatever, idempotent.

Check: does inserting the bar before the table disturb `#noRows`? noRows is separate. OK.

Also `tagTable` adds `.sdtable` to the table — unaffected.

Now check the "sd-locsum" id and button id don't clash with page ("Do not declare a name the page already uses") — sd- prefix, fine. Classes: sd-loc, sd-loc-tag, sd-loc-where, sd-loc-span, sd-loc-exp, sd-loc-line, sd-loc-note — new. Note: existing CSS has `.sd-d-note` — different. OK.

CSS additions:

```css
/* sd-locate: the model's reading of where the write-ups say the defect was.
   Amber, dashed and serif on purpose \u2014 nothing here may be mistaken for
   the FAA's own zone codes in the row above. */
#sd-locbar{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin:10px 0 4px;padding:9px 12px;border:1px dashed #c9a24b;background:#fdfaf1;border-radius:4px}
#sd-locbar .sd-loc-exp{flex:1 1 340px;min-width:0;font-size:11.5px;line-height:1.5;color:#5c554c}
#sd-locsum{flex-basis:100%;min-width:0}
#sd-locsum p{margin:3px 0}
#sd-locsum .sd-loc-line{font-size:12.5px;line-height:1.5;color:var(--ink)}
#sd-locsum .sd-loc-note{font:italic 13px/1.5 Georgia,'Times New Roman',serif;color:#7a5b00}
.sd-loc{margin:6px 0 2px;padding:5px 10px;border-left:2px dashed #c9a24b;background:#fdfaf1;font:13px/1.55 Georgia,'Times New Roman',serif;color:#5c554c}
.sd-loc .sd-loc-tag{display:inline-block;margin:0 8px 0 0;padding:1px 6px;font:600 9px/1.5 Archivo,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#7a5b00;background:#fff;border:1px solid #e6d8ae;border-radius:3px;vertical-align:1px}
.sd-loc .sd-loc-where{color:var(--ink);font-weight:600;font-style:normal}
.sd-loc .sd-loc-span{color:#7a5b00;font-style:italic}
@media(max-width:700px){#sd-locbar{padding:8px 10px}#sd-locbar .sd-loc-exp{font-size:11px}.sd-loc{font-size:12px}}
```

Hmm — `var(--ink)` etc. exist (used elsewhere). ✓

Also: `.sd-loc b` — wh is `<b>`; fine.

Also `#sd-locbar .sdbtn` — page's sdbtn styling; fine.

One more check: the record table row `tr.wrote td` padding `0 0 14px` — my `.sd-loc` inside td after `.wu`. The `.wu:not(.clip){padding-bottom:34px}` gap — mark sits 34px below text end. Slightly airy but fine. Actually could pull up with `.wu:not(.clip)+.sd-loc{margin-top:-30px}` — but gloss occupies that space (left:12px bottom:0 of .wu). The gloss is like "…" hint. Negative margin would overlap the gloss. Leave the gap. Actually wait, `.wu:not(.clip)::after{content:"none"}` — weird but existing. Leave.

Also consider: multiple `.wu` in one td? Unlikely. `td.querySelector` for mark — fine.

Now, also double-check `sdMarkCells` — it queries `code.cd` and sets `dataset.sdPnDone=1` on ALL code.cd even non-P/N — including our part-number link in the sheet? `sdFillPartRow` sets `code.dataset.sdPnDone="1"` itself and sdMarkCells skips ones with sdPnDone... it checks `if(c.dataset.sdPnDone)continue;` ✓. But ordering: sdPartRow runs before sdMarkCells in pass ✓.

Also the exclusion `c.closest("[data-sd-pnrow]")` ✓.

Now — the seventeen-row case sheet: our inserted row makes it seventeen (sixteen + ours?). The brief says "case sheet seventeen rows, including Part number" works now — keep as is.

Also check "the sentence '42 reports, upper fuselage, QR9R. 1,757,785 set aside.'" — that's setFilter behavior, unchanged.

Also confirm sdLocButton class `sdbtn` exists on page — my noRows HTML uses it, presumably styled. ✓. And `.ghostbtn`.

Now the `sdLocSend` fetch: the wrapped window.fetch will also observe this response — sdNoteRecord: locate response has no PartNumber, and URL excluded. ✓

Double check the exclusion regex with "/z/api/locate": pattern `/api\/(airframe|...|locate)(\/|\?|$)/i` — "api/locate" then end-of-string → `$` matches. ✓

Also `res.clone()` on our POST response: fine.

One more requirement: "Mark everything this produces as read by a model". The summary line — is it marked? The bar has data-sd-model and amber dashed styling; the exp says "Everything here is a model's reading". Summary sits inside the bar. ✓ Row marks have tag + styling. ✓

Also should the summary explicitly label `dropped_unverifiable`? The sentence says "dropped N it could not verify" — conveys it. Good enough; maybe more literal: "dropped N as unverifiable". Use that.

Final sentence: `Sent the first 25 of the 100 write-ups now on screen. The model checked 25, placed 21, and dropped 4 as unverifiable — its locations are kept only where the quoted words appear in the write-up.` Hmm — appending the explanation each time is verbose; the exp above already explains. Keep summary tight: "Sent the first 25 of the 100 write-ups now on screen. Checked 25, placed 21, dropped 4 as unverifiable." Then note line.

Wait — dropped + placed might not sum to checked if server did something else; that's fine, we report the endpoint's numbers.

Also brief: "then marks each row it could place, with the quoted span beside the location" ✓.

Now let me also double check sdLocCollect excludes `.wu` inside... could the dossier quotes be `.wu`? No, `.sd-d-quote`. ✓

Potential clash: `#p-search` panel also shows records with write-ups? The record table is the one with `.wu`. Fine.

Now, one thing about `sdLocApply` marks and `sdMirror`/other pass functions — no interference.

Also — the `pass()` in original has `try{sdMarkCells()}catch(e){}` etc. I'll add sdLocBar and sdLocStep after sdMarkCells.

Also need `SDLOC` declared before sdLocBar etc. use — var hoisting; assignments execute at their position in IIFE before any pass runs (pass is called at bottom). The locate section must appear before `pass` definition? Function declarations hoist; `var SDLOC` hoisted, assigned at its line — which executes before `sdEnsureGlobals()`/pass at bottom as long as it's placed before the boot code. I'll place the locate section after the sdMarkCells/sdDossierKick section, before `var queued=false;`. Good.

Now write the final answer: one CSS block, one JS block, whole.

Also update comments in SX section to reflect PartNumber. And the sd-pnrow comment mentions "the record endpoint returns part_number" — update to PartNumber.

Let me also re-verify `sdFillPartRow`'s early return when page drew its own "Part number" row: `else if(nxt&&nxt.cells&&nxt.cells[0]&&nxt.cells[0].textContent.trim()==="Part number")return;` — wait, our own row's first cell text is "Part number" too! But our row is caught first by `nxt.getAttribute("data-sd-pnrow")==="1"`. Order: first check data attribute, then the text check. Our row has the attribute → first branch. ✓ But what if our row lost its attribute? We set it at creation. ✓

But hmm — one more: the brief says "case sheet | seventeen rows, including Part number" under "works now". And "the page Part number = not recorded" under the fault. So the visible "Part number = not recorded" is our injected row reading `rec.part_number` → undefined → absence path. Fix confirmed.

Wait, actually — `raw=rec.part_number` where rec has `PartNumber` — `rec.part_number` is undefined → `pn=""` → absent path → "not recorded". Yes exactly the bug. Fix: read PartNumber → "17039203426" shown. ✓

Also check `sdAbsence` fallback cls: fine.

Also, "the page stating something the data does not say" — with fix, when PartNumber present, we show the number. When genuinely both empty → "not recorded" correct.

Edge: `PartNumber: ""` and `ComponentPartNumber: "123"` → fallback gives "123" ✓ per "fall back to ComponentPartNumber only when PartNumber is empty".

Now double-check the fetch-wrap `sdCl.json()` — fine.

Also, the brief's "One false statement" is task 1; "one build still unreachable" = the locate endpoint not called. Both addressed.

Also make sure I keep `window.__sderrs` etc.

One more scan of pass(): the original list — I add two calls. Also keep `try{if(window.rrTail!==sdRrTail)...}`.

Also, resize listener → kick → pass → sdLocStep recalculates — fine.

Now — is there any risk the locate POST fails due to needing CSRF or different path? Existing GETs use /z/api/. Assume POST /z/api/locate works.

Also handle: response `results` entries may include dropped ones with `where` null — handled (skip, and cache null via the batch loop) ✓. But careful: a result with where empty for a record — `continue` → not in placed → batch loop sets cache null ✓.

Also duplicates in batch with same key: cache written per row — both rows same key, last one wins; if one placed one not (server wouldn't do that for identical text) — ignore.

Let me also think: should the marks be limited to batch rows? Marks apply by text key — a row not in the batch but with identical text to a placed one gets marked. Same text, same reading — fine, arguably good. But "marks each row it could place" — it placed that text. OK.

Now write everything out. Length is large but necessary.

Also small thing: in sdLocRender, when `show` and sig same but innerHTML was wiped by bar recreation — bar recreation recreates sum too (innerHTML of bar includes sum div) → fresh sum with no dataset.sdSig → sig mismatch → render. ✓ But wait: `sum.dataset.sdSig=sig` — new sum each bar recreation, fine.

Hmm — one thing: bar.innerHTML includes `#sd-locsum` — but on re-render after bar recreation, `byId("sd-locsum")` gets the new one. ✓

Also: `btn.disabled` — on recreation, fresh button enabled; render sets per busy. ✓

Check `sdLocStep` runs before or after `sdMirror` — order in pass: I'll insert after `sdMarkCells()` and before `sdMirror()`. Doesn't matter much.

Wait, actually one more consideration: `ensureNoRows` shows #noRows on phone... unrelated.

Also check: at 390px, the bar flex-wrap with button + exp — fine.

Potential a11y: button has visible label. ✓

Now also confirm no name collisions: SDLOC, sdLoc*, sd-loc*, sd-locbar, sd-locbtn, sd-locsum — all new. The page presumably doesn't use them (sd- prefix is ours).

Also `data-sd-locout` attribute new. ✓

Write final CSS: original CSS + appended locate CSS. Write final JS: original with edits + locate section + pass edits.

Let me now also reconsider the comment in the CSS for placement and the `#sd-locbar` width: the record table might be inside `#p-search` panel with its own padding; bar as sibling of table inherits container width — good, no max-width needed. Use `margin:10px 0 6px`.

One more: the original `table.sdtable td{padding:5px 10px}` — my mark is a `p` inside td, not a td. ✓

Also: should the mark instead go into a new `<tr>`? No — settled on td append.

Double-check `wu.closest("td")`: `.wu` sits in `td` of `tr.wrote`. In the CSS, `tr.wrote td{padding:0 0 14px}` and `.wu` inside. ✓

Edge: what if `.wu` is direct child of `td` but there are sibling elements after it already (page's own)? appendChild puts mark last — fine.

Now, finally, also double check the `sdLocRender` "Reading N write-ups…" vs "Sending N write-ups to the reader…" — two messages; the button label shows "Reading…". Keep summary busy line simple: `Reading N write-ups\u2026` too. Actually button says "Reading N write-ups…", sum says "Sending the first N write-ups to the reader…". Slight duplication fine. Let me make button just "Reading…" and sum the detailed one. Eh — keep as drafted; harmless.

Also one nuance: while busy, `sdLocApply` still marks from old cache — fine.

Also `sdNum` used in sdLocSend for checked/dropped — defined earlier ✓ (sdNum is defined in dossier section, which appears before locate section). ✓ sdEsc, sdFmt also earlier. ✓ byId earlier. ✓ kick — defined at bottom as function declaration, hoisted ✓ (sdNoteRecord already relies on this).

Alright, compose the answer. Brief prose intro not required — "Return one block of CSS and one of JavaScript, whole". I'll return just the two blocks (maybe a one-line note is fine, but instructions say return the blocks; I'll add minimal or no commentary — safer to give just the blocks, perhaps with a very short lead-in. The format says "Return one block of CSS and one of JavaScript" — I'll do exactly that with no extra prose, or a single short line. I'll include no extra prose to be safe. Actually a tiny header per block via fenced code tags is fine.)

Let me write out the full CSS now, reproducing the original exactly and appending the locate styles.

And full JS. Let me be careful to reproduce every original function unchanged except the noted edits.

Writing JS edits in place:

1. Comment above SX: change "part_number is one of the fields it returns" → "PartNumber is one of the fields it returns".

2. sdNoteRecord: new field check + locate in exclusion.

3. sdFillPartRow: raw extraction.

4. Comment above sd-pnrow: "the record endpoint returns PartNumber" and mention fallback.

5. sdRender: add rp cannot_show lines.

6. New locate section before `var queued=false;`.

7. pass(): add sdLocBar, sdLocStep.

Also in sdRender, where exactly: after the repeats if/else:

```js
  }else{
    parts.push('<section class="sd-d-sec"><h3>What recurred</h3><p class="sd-d-none">Nothing on this airframe was written up more than once.</p></section>');
  }
  if(rp&&rp.cannot_show&&rp.cannot_show.length)parts.push(sdLimits(rp.cannot_show));
```

OK. Also the `sd-d-note` for sm already there.

One last look at "must still be true": "the tab strip at or under 130px, 18 controls..." — untouched. "the record stepper" — untouched. "aria-labels" — I add some, don't remove.

Also — careful that `sdLocBar`'s insertion before the table doesn't sit inside a `<tbody>`? Table's parentNode can't be tbody (only tr). ✓

Also: what if the record table is inside a form or the parent only allows certain elements? div parent typical. Fine.

Compose now. I'll write the whole thing.

Also, minor: in sdLocRender error branch condition, `last.fp===""` — for the "no write-ups" case fp is "" and SDLOC.fp is "" → equal anyway. Keep `last.fp===SDLOC.fp`.

Also, in sdLocSend catch — `rows` is in scope ✓.

Let me write the final output.