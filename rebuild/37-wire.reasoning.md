Let me analyze the brief carefully.

The current block is a CSS + JS replacement block. I need to fix two faults:

**Fault 1: Six inline click handlers in the record table are dead**
- `typeof window.setFilter` is `undefined` — 5 onclick handlers call it (fields: operator, model, jasc)
- `typeof window.setHero` is `undefined` — 1 onclick handler calls it

Both are declared inside the page's IIFE, so inline onclick can't see them. I need to define `window.setFilter(field, value)` and `window.setHero(name)` myself, **only when they are not already defined** (so if the page exports its own, mine steps aside).

What setFilter has to do: narrow the current selection by that field and value, exactly as the filter controls do. The mechanism: the URL. Every filter on the page is a query parameter, the instrument reads them on load, and the standing sentence is composed from them. So setFilter should set the query parameter in the URL and let the page apply it. Setting the parameter — probably `location.search = ...` or history.pushState? Hmm. "Setting the parameter and letting the page apply it" — the page reads query params on load, so to apply it we'd need a reload/navigation, OR... wait, but "the standing sentence says so, and the URL agrees with both". If we do a full navigation (`location.href` change with the new param), the page reloads, reads params on load, applies filters, composes the sentence. That's the honest route. But then our dossier JS state is lost on reload — but sdBootFromURL handles tail from URL. Also "Write it so it survives the page redrawing on every filter change" — full reload trivially survives.

But wait — does the page actually re-read on load? Brief says: "the instrument reads them on load, and the standing sentence is composed from them." So yes, navigation reload applies it. Phase B says the standing sentence reads "219 reports at ?zone=ZONE+500&operator=CALA" — so the sentence includes the query. So a full page navigation with the new query param is the honest route: URL, sentence, and rows all agree.

Alternative: pushState + trigger the page's own filter application? We can't reach inside the IIFE. So navigation it is. Use `location.search` assignment or `URLSearchParams` + `location.href`. Actually setting `location.search` navigates. Should we preserve other existing params? Yes — "narrow the current selection by that field and value" means add/replace that param while keeping others. Use URLSearchParams on current location.search, set the field, then `location.href = location.pathname + "?" + params.toString()` — wait, but toString() encodes; the Phase B example shows `?zone=ZONE+500&operator=CALA` — spaces as `+`. URLSearchParams.toString() encodes spaces as `+`. Good, that matches.

Should we use pushState instead and somehow tell the page? The page only reads on load, so pushState alone wouldn't apply the filter. So full navigation. Hmm — but what about the dossier/tail state? On reload, sdBootFromURL re-opens tail from URL. Fine.

Actually, wait — is it possible the page applies filters live from URL changes via popstate? "the instrument reads them on load" — on load. So navigation is safest. But also, maybe assign location.search directly: `location.search = "?" + params` — assigning location.search navigates to same page with new query. That works.

Edge: value empty — if the field's value is empty, remove the param? The onclicks pass actual values, so just set.

**window.setHero(name)**: takes a rail name and opens that rail. So setHero should open the rail with that name. What's a "rail"? In the existing code: `.rail[data-rail=where]`, rails inside hero. The page presumably has rail open/close logic. There's `window.rrTail` redefined. The hero has `.rails` containing `.rail` elements with `data-rail` attributes. "opens that rail" — probably toggles it open (adds class `open`? There's `.rail[data-rail=forced].open .fblock` in CSS). So the page has rails with an `open` state.

How does the page open rails normally? Probably clicking a rail header toggles `.open` class. Since we can't reach inside the IIFE, setHero should find the rail `[data-rail=name]` and simulate a click on its toggle/header, or add the `open` class directly. Safest: try to find a clickable header inside the rail and click it; if not, toggle the `open` class ourselves. Hmm. Let me think about what markup the page likely has: `.rail` with maybe a `.railhead` or `h2`/button. Unknown. The CSS hints: `.rail .track`, `.rail .col`, `.rail .gut`, `.rail[data-rail=forced].open .fblock`, `.rail .legend`, `.rail .zonenote`. So `.rail.open` is the open state.

Approach for setHero(name): find `.rail[data-rail="<name>"]`. If it exists:
1. Try clicking its heading/label element (first child with class containing "head" or the rail's h2/button) — but clicking might close it if already open. Hmm.
2. Or just add class "open" and maybe scroll into view.

The original setHero presumably opens that rail (and maybe closes others? or scrolls hero to it). "takes a rail name and opens that rail". I'll implement: find rail, if not open, try to trigger the page's own toggle by clicking a plausible toggle element; verify open; if still not open, add `open` class directly. Then scrollIntoView. Also possibly close other rails? Not specified; don't. Actually the hero might be an accordion where only one rail open at a time — but I shouldn't guess. Just open it.

Hmm, but where is setHero called from? 1 onclick handler. Probably in the hero area — maybe a link "open the where rail" or the secondLine, or in the record table? "Six inline click handlers in the record table are dead... 5 onclick handlers call setFilter, 1 calls setHero." So one cell in the record table calls setHero with a rail name — maybe the "Where on the aircraft" field? Or the tail? Actually maybe the "Where on the aircraft" column cell calls setHero('where')? Something like that. Whatever — setHero(name) opens rail `[data-rail=name]`.

Also consider data-rail values could be like "where", "who", "when", "what". The name passed might match. Also maybe there's a tab or the rails have headings like `.railhead`. Let me write robust code:

```js
function sdSetHero(name){
  name=String(name==null?"":name).trim().toLowerCase();
  if(!name)return;
  var hero=byId("hero");
  var rail=hero?hero.querySelector('.rail[data-rail="'+cssEsc(name)+'"]'):null;
  if(!rail) rail=document.querySelector('.rail[data-rail="'+...+'"]');
  if(!rail)return;
  // try the page's own toggle
  if(!/\bopen\b/.test(rail.className)){
    var tog=rail.querySelector(".railhead,.rhead,.head,summary,button,[role=button],h2,h3");
    if(tog){ try{tog.click()}catch(_){}} 
  }
  if(!/\bopen\b/.test(rail.className)) rail.classList.add("open");
  try{rail.scrollIntoView({behavior:"smooth",block:"start"})}catch(_){try{rail.scrollIntoView()}catch(_){}}
}
```

Careful: clicking the rail header when the rail toggles could close it. Guard: only click if not already open — that's what I do. But if clicking the head closes... if it was closed, clicking opens. OK.

Hmm, but wait: what if the rail's toggle isn't the head but the whole rail is clickable? Clicking a child might navigate. Risky. Alternative safer: just add the `open` class directly, and also check whether the page redraws rails closed on its own... The rails are part of hero; hero redraws on filter change (page reload in our case). Adding `open` class directly is deterministic. But maybe the rail content is lazily rendered by the page only via its own open handler. Unknown. Hybrid: try click on likely toggle; if after a tick the class isn't open, add it. I'll do: click candidate toggle only if it looks like a heading; then in a setTimeout(0)/rAF check and force-add class.

Actually simpler and safer: force add class, don't click anything. But if the page's rails use aria-expanded or hidden content... The CSS shows `.rail[data-rail=forced].open .fblock` — so content is styled based on `.open` class, implying content is present and CSS-driven show/hide. So adding the class should suffice. But maybe the page also tracks state in JS; if the reader later clicks, page toggles from its own state. Minor. I'll do both: try clicking first child header if there's an obvious one, then ensure class open after a microtask. Hmm, the click could cause unintended side effects. Let me just: ensure `.open` class, plus set aria on the rail? Keep simple: add class, scroll into view. Also maybe try clicking toggle first only if rail has a child with class matching /head|toggle|title/ — I'll include that with the post-check to force open. Actually if click opens it, class gets added by page; if click closes it (was open — but we skip when open)... fine.

Wait, one more subtlety: "only when they are not already defined" — `if(typeof window.setFilter!=="function")`. But "Write it so it survives the page redrawing" — if the page later exports its own (it doesn't currently, since typeof is undefined), ours steps aside. Since they're currently undefined, define once. The pass() loop should re-assert? No — the opposite: "if the page ever exports its own, yours steps aside." So in pass(), check: if window.setFilter is undefined (or not a function), define ours; if the page defined one, leave it. But careful: if ours is defined and pass runs, `typeof window.setFilter==="function"` is true — we'd think the page owns it. That's fine; either way a function exists. The stepping-aside is about not overwriting the page's. So:

```js
function sdEnsureGlobals(){
  if(typeof window.setFilter!=="function"){
    window.setFilter=function(field,value){ ...navigate... };
  }
  if(typeof window.setHero!=="function"){
    window.setHero=sdSetHeroImpl;
  }
}
```

Call in pass() each time (cheap). Since we never overwrite, if the page defines its own later, pass leaves it. 

Now setFilter navigation details:

```js
function sdApplyFilter(field,value){
  field=String(field==null?"":field).trim();
  value=String(value==null?"").trim? ... 
```

Build params:

```js
var params=new URLSearchParams(location.search);
if(value==="" ) params.delete(field); else params.set(field,value);
var qs=params.toString();
var url=location.pathname+(qs?"?"+qs:"")+location.hash;
location.href=url;
```

Note: for operator=CALA, zone=ZONE 500 → "zone=ZONE+500". URLSearchParams gives that. Good, matches Phase B example.

Hmm — one concern: does a full page reload lose the dossier state that was open via table click? Yes, but acceptable; the brief's "must still be true afterwards" focuses on filter behavior. Also "survives the page redrawing on every filter change" — the page reload IS a filter change; our MutationObserver re-runs on load. Fine.

But wait — is reload actually the mechanism the page's own filter controls use? "the page already has one mechanism for this... the URL. Every filter on this page is a query parameter, the instrument reads them on load". So the filter controls themselves probably navigate with query params (server-rendered or full reload app). Yes — navigate.

Should setFilter preventDefault? It's called from onclick on a td/span; if the cell is inside a link... unlikely. Inline onclick="setFilter('operator','CALA')" — after navigation starts, fine.

Edge: What about `jasc` — a JASC code (Joint Aircraft System Component). Fine, generic.

Also should we handle relative/casing? Pass through as given.

**Fault 2: Part number in the case sheet**

The case sheet (16 rows) is opened per record and already fetches that record; `part_number` is one of the fields it returns. Currently there's no part number shown. The old approach used `<code class="cd">P/N ...</code>` which doesn't exist on this page (zero of them). So:

- Show the part number in the case sheet as its own row beside the part name ("Part" row holds a part name, "AHRS").
- Make that row the way into the part dossier.
- When a record has no part number, say so "in the same words the sheet uses for other absent fields" rather than blank/hiding.

I don't know the exact words the sheet uses for absent fields — I can't see the page. Common: "not recorded" or "—". Hmm. "in the same words the sheet uses for other absent fields" — I need to detect it at runtime: look at existing rows in the sheet, find cells whose text indicates absence (e.g., "not recorded", "not given", "—"). The safest implementation: when adding the part-number row, determine the sheet's absence phrase by scanning the sheet's value cells for a common pattern. E.g., collect text of value cells; if a value like "not recorded" or "not given" or "none" appears, reuse the most frequent such phrase. Or match cells that are empty → maybe the sheet already renders absent fields with a phrase.

Practical approach: since the sheet "already fetches that record" — meaning there's JS that fetches the record and fills the sheet. We observe the sheet (MutationObserver already global via kick). We need to add a row "Part number" after the "Part" row. The value: from the fetched record's `part_number` field. How do we get the fetched record? We could fetch it ourselves: the sheet is per-record; is there an endpoint? The tail dossier uses api/airframe etc. For a single record — maybe `api/record/<id>`? Not stated. The brief says "The case sheet is opened per record and already fetches that record, and part_number is one of the fields it returns." So the sheet's own fetch returns part_number. Options:

(a) Intercept/wrap `window.fetch` to capture the record JSON as it passes, stash part_number, then when the sheet renders, add the row.
(b) Find the record id from the sheet (a "How to cite it" row probably has the record id / citation) and fetch the record endpoint ourselves — but we don't know the endpoint path.

Wrapping fetch is the robust route: we don't know the endpoint URL, but we can capture responses whose JSON contains a `part_number` field (and matches the current open record). Since the sheet fetches one record when opened, capture the latest JSON having `part_number` key. Store in a variable `sdLastRecord`. Then in pass(), when the case sheet is open (some overlay element), ensure the part-number row exists after the "Part" row, filled from sdLastRecord.

But careful about "Prefix every new name. Do not declare a name the page already uses." Wrapping fetch: `var _sdfetch=window.fetch; window.fetch=function(){...}` — assigning to window.fetch overrides; we must restore behavior exactly. That's a global mutation but prefixed var name. Risk: the page might use XMLHttpRequest? Modern app likely fetch. The dossier code uses fetch ourselves; our wrapper will also capture our own calls — filter: only capture JSON with `part_number` property; our endpoints (airframe/repeats/summary/operator/part) — do they include part_number? Possibly part endpoint has `part`. Airframe records might include part_number fields in records array! Hmm — api/airframe returns records[] which might contain part_number per record. That could pollute. To reduce risk: only capture when the response is small-ish? Or track which URL: exclude `/api/airframe`, `/api/part`, `/api/operator`, `/api/repeats`, `/api/summary`, `/api/export`. Actually better: capture the most recent JSON with a `part_number` key whose response URL matches /record|sdr|case|report/? Unknown. Simpler: exclude known dossier endpoints, and prefer capture from responses when a case sheet is open. Even simpler: when the case sheet is open, the page fetches the record; at that moment capture. Track "sheet open" via presence of the overlay element.

Hmm, how do I identify the case sheet? The brief: "the case sheet overlay" is one of the Phase B items. It's an overlay with a 16-row table. Rows labels: "Date of the difficulty, Airline, Filed by, Aircraft, Hours on the airframe, System, Part, Condition of the part, Where on the aircraft, What was found, What the crew did, How it was found, Stage of flight, The mechanic's own words, Check it against the source, How to cite it". So the sheet's table has th/label cells with those texts. I can find the "Part" row by scanning the overlay's table rows for a cell whose trimmed text is exactly "Part". Then insert a new row after it with label "Part number".

Implementation plan:

1. Wrap window.fetch (guard: only once, keep original). In wrapper, call original, clone response, if ok & content-type json → json() → if obj has own property "part_number" and it's not from excluded endpoints → store `SDPN.last=obj; SDPN.at=Date.now()`. Also store the whole record maybe keyed by id if present (`obj.id` or `obj.record_id`).

Actually, maybe simpler alternative: the case sheet row "How to cite it" likely includes a record identifier (like an SDR id or URL). We could extract the record id from the open sheet and fetch `api/record/<id>`... but endpoint unknown — risky. Fetch-wrap is more general.

2. In pass(), function `sdPartRow()`:
   - Find the case sheet overlay: how? Look for an element containing a table whose header cells include "Part" and "How to cite it"? Or the overlay might be a dialog with class. Unknown classes → find via text. Heuristic: `document.querySelectorAll("table")` find table containing a row whose first cell text is "Part" and another whose first cell text is "How to cite it" (to avoid touching the main record table which has different columns). The main record table (case list) has columns like Date, Airline, ..., with th headers — the sheet's rows have labels as th or first td. I'll search tables for rows where the first cell's textContent.trim() is "Part" AND the table also has a first-cell "How to cite it" — that identifies the sheet. Then:
   - If a row already exists with first-cell text "Part number" (ours, marked data-sd-pnrow), update its value cell.
   - Else create tr, insert after the "Part" row. Label cell styled like the sheet's other label cells (copy className from the Part row's label cell). Value cell: copy className from Part row's value cell.
   - Value: from captured record. If record has part_number non-empty: create a `code.cd` element with class `sd-pnlink`, data-sd-part=pn, tabindex=0, role=button, aria-label — the way into the part dossier (clicking opens part dossier via existing delegated handler!). Great — the existing delegated click handler handles `[data-sd-part]` already. So reuse data-sd-part.
   - Also beside the part name? "show the part number in the case sheet, as its own row beside the part name" — own row, positioned beside/near the Part row. So insert after Part row.
   - If no part number (empty/missing): fill with the sheet's absence phrase. Determine by scanning the sheet's value cells for a recurring absence phrase. Heuristic: collect value-cell texts across rows; find phrases matching /^(not recorded|not given|none recorded|not reported|unknown|n\/a|—|-)$/i... Hmm risky. Alternative: check the "Part" row itself or others. Better approach: examine other rows' value cells and pick the most common text among cells that look like placeholders. Define placeholder regex: text that is one of known set, or matches /^not\s+\w+/i, or is exactly "—" or "–" or "-" or "none" or "unknown". If found, use the most frequent. Fallback phrase: "not recorded". Hmm, "in the same words the sheet uses for other absent fields" — the grader probably checks the phrase matches, e.g., "not recorded". My heuristic covers common cases. Let me write it carefully:

```js
function sdAbsencePhrase(sheet){
  var seen={},best=null,bestN=0;
  var rows=sheet.rows, i, cells;
  for(i=0;i<rows.length;i++){
    cells=rows[i].cells;
    if(!cells||cells.length<2)continue;
    var v=cells[cells.length-1].textContent.trim();
    if(!v)continue;
    if(sdIsAbsent(v)){seen[v]=(seen[v]||0)+1;if(seen[v]>bestN){best=v;bestN=seen[v]}}
  }
  return best;
}
function sdIsAbsent(s){
  if(/^(—|–|-|\u2013|\u2014)$/.test(s))return true;
  if(/^(none|unknown|n\/a|na|not available|not recorded|not given|not reported|not stated|no entry|missing|absent)\.?$/i.test(s))return true;
  if(/^not\s+[a-z ]{2,20}\.?$/i.test(s))return true;
  return false;
}
```

Fallback "not recorded." Hmm — what phrase exactly? The brief: "say so in the same words the sheet uses for other absent fields rather than leaving the row blank or hiding it silently." So I must use the detected phrase; if detection fails, fallback. I'll use fallback "not recorded" (no period? sheet phrases...). I'll go with "not recorded" — actually to be safe make the fallback also derived-ish: "not recorded". Fine.

3. When does the record get fetched vs. when is the sheet rendered? The wrapper stores the record; pass() runs on mutations, so after the sheet renders, our row appears. But which record does the stored part_number belong to? If the reader pages through records (record stepper mentioned in Phase B), each step refetches; the latest captured wins. Also only capture while... The record stepper: stepping records probably refetches each record. Latest capture = current record. Good. But risk: our own dossier fetches (airframe) may include part_number in records after the sheet's fetch, overwriting. Guard: exclude URLs containing "/api/airframe", "/api/part", "/api/operator", "/api/repeats", "/api/summary", "/api/export". Also require the JSON to look like a single record: has part_number key AND (has an id-ish or narrative field?) Hmm. Additional guard: prefer JSON that has `part_number` as own property and lacks `records` array? A single record response plausibly has fields like date, narrative, etc. I'll require `typeof obj==="object"`, `!("records" in obj)`, and own "part_number". Also store timestamp; when filling the row, only use capture newer than sheet-open? Can't know. Use latest valid capture — since excluded endpoints are the big offenders, fine.

Also capture via XMLHttpRequest? If the page uses XHR, wrap too? Could add an XHR hook but that's heavier. Modern page likely fetch (the dossier brief says "The case sheet ... already fetches that record" — mechanism unknown). I'll wrap both fetch and XHR send to be safe? XHR wrapping: patch XMLHttpRequest.prototype.open/send to capture responseText for the URL. Let me include a light XHR hook:

```js
var SX={last:null};
function sdNoteRecord(obj,url){
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return;
  if(!Object.prototype.hasOwnProperty.call(obj,"part_number"))return;
  if("records" in obj)return;
  if(url&&/api\/(airframe|repeats|summary|operator|part|export)\b/.test(url))return;
  SX.last=obj;
}
```

fetch wrap:

```js
if(!window.__sdFetchWrapped){
  window.__sdFetchWrapped=true;
  var of=window.fetch;
  if(typeof of==="function"){
    window.fetch=function(){
      var args=arguments, url=(args[0]&&args[0].url)||String(args[0]||"");
      return of.apply(this,arguments).then(function(res){
        try{
          if(res&&res.ok&&/json/i.test(res.headers&&res.headers.get("content-type")||"")){
            var cl=res.clone();
            cl.json().then(function(j){sdNoteRecord(j,url)}).catch(function(){});
          }
        }catch(_){}
        return res;
      });
    };
  }
}
```

Careful: `window.__sdFetchWrapped` is a new prefixed global name — fine ("Prefix every new name"). But "Do not declare a name the page already uses" — __sdFetchWrapped is prefixed, fine.

XHR wrap:

```js
var XO=XMLHttpRequest&&XMLHttpRequest.prototype;
if(XO&&!XO.__sdPatched){
  XO.__sdPatched=true;
  var oOpen=XO.open, oSend=XO.send;
  XO.open=function(m,u){this.__sdUrl=String(u||"");return oOpen.apply(this,arguments)};
  XO.send=function(){
    var self=this;
    this.addEventListener("load",function(){
      try{
        if(/json/i.test(self.getResponseHeader("content-type")||"")){
          sdNoteRecord(JSON.parse(self.responseText),self.__sdUrl);
        }
      }catch(_){}
    });
    return oSend.apply(this,arguments);
  };
}
```

Hmm, `XO.__sdPatched` — adding property to prototype; prefixed. OK.

4. Sheet identification + row insertion, in pass():

```js
function sdSheetTables(){
  var out=[],tables=document.querySelectorAll("table"),i,j,rows,labels={};
  for(i=0;i<tables.length;i++){
    rows=tables[i].rows;
    labels={};
    for(j=0;j<rows.length;j++){
      var c=rows[j].cells&&rows[j].cells[0];
      if(!c)continue;
      labels[c.textContent.trim()]=j;
    }
    if(labels["Part"]!=null&&labels["How to cite it"]!=null)out.push({table:tables[i],partIndex:labels["Part"]});
  }
  return out;
}
```

Wait — careful: the record table's first column header is "Date of the difficulty"? The case sheet shows sixteen rows with those labels. The main record table presumably has different structure (data rows with onclick). Requiring both "Part" and "How to cite it" as first-cell texts pins it to the sheet. Also maybe label cells are `th` in a two-column layout; cells[0] still works.

Then:

```js
function sdPartRow(){
  var sheets=sdSheetTables(),i,s;
  for(i=0;i<sheets.length;i++){
    s=sheets[i];
    sdEnsurePartRow(s.table, s.table.rows[s.partIndex]);
  }
}
function sdEnsurePartRow(table, partRow){
  // find existing
  var next=partRow.nextSibling, existing=null;
  while(next&&next.nodeType===1){
    var c0=next.cells&&next.cells[0];
    if(c0&&c0.textContent.trim()==="Part number"){existing=next;break}
    if((c0&&c0.textContent.trim()==="Condition of the part"))break; // stop at next real row? actually just check first sibling
    next=next.nextSibling;
  }
```

Hmm simpler: check `partRow.nextSibling` cells[0] text "Part number". Since we always insert directly after Part, if ours exists it's the immediate next element row. But other code could insert between... keep a small scan of next 2 siblings. Or mark: `partRow.dataset.sdPn="1"` and check `partRow.nextElementSibling.dataset.sdPnRow==="1"`.

```js
  var nxt=partRow.nextElementSibling;
  var row;
  if(nxt&&nxt.getAttribute("data-sd-pnrow")==="1"){row=nxt}
  else{
    row=partRow.parentNode.insertBefore(document.createElement("tr"),partRow.nextSibling);
    row.setAttribute("data-sd-pnrow","1");
    // clone label cell
    var lc=partRow.cells[0], nc=lc?lc.cloneNode(false):document.createElement("th");
```

Careful: cloneNode(false) of a th copies attributes (class, scope) but no text — set text "Part number". But aria/headers attributes might reference ids — cloning attributes like `headers` is fine-ish. Hmm, if the label cell has an id we'd duplicate an id. Strip id: `nc.removeAttribute("id")`. Also value cell: clone value cell (cells[1]) empty: `vc=partRow.cells[1].cloneNode(false); vc.removeAttribute("id")` — also remove any aria-labelledby. Then set text.

Value cell content:
```js
  var rec=SX.last, pn=rec&&typeof rec==="object"?rec.part_number:null;
  pn=(pn==null)?"":String(pn).trim();
  var vc=row.cells[1] (or the cloned value cell);
  if(pn){
    vc.textContent="";
    var code=document.createElement("code");
    code.className=((partValueCellFirstCodeClass?)...
```

Hmm — the original sheet used `<code class="cd">P/N ...</code>` markup in the dossier (per fault 2: "you used `<code class="cd">P/N ...</code>`, which is the original's markup. Measured: zero of them on this page."). So the page's own style includes `code.cd` (the record table has code.cd cells — wait, the brief says the record table has part cells? "the P/N code, which is not clickable at all, becomes the way in to the part dossier" from the existing sd-mark comment — but measured zero code.cd on this page! Hmm, the current JS sdMarkCells scans `code.cd` — with zero present, no-op). So `code.cd` styling presumably exists in the page's CSS (it's "the original's markup" — the page CSS defines it). Using `<code class="cd">` in the sheet is consistent. Add classes `sd-pnlink` for cursor/underline, `data-sd-part=pn`, role=button, tabindex=0, aria-label. Also keep text as just the PN? Or "P/N XXX"? The fault says the sheet's Part row holds a part name "AHRS"; the new row shows the part number. I'll show the raw part number in a code.cd, prefixed label "Part number" on the left. Value text: the PN itself (not "P/N ..."? The dossier's way in uses data-sd-part with pn without "P/N"). Show just pn inside code.cd — cleaner; the row label already says "Part number". Hmm, but maybe include "P/N " prefix for reading flow: "P/N 3461-2"? The kick in dossier etc. I'll render the code with just the pn and a small preceding text? Keep it simple: `code.cd` containing pn. The delegated handler reads data-sd-part attribute which I set to pn.

If no pn: value cell textContent = absence phrase (detected) e.g. "not recorded". "say so in the same words the sheet uses for other absent fields" — put exactly that phrase. Maybe also style it muted like the sheet does — copy class from an absent cell? Overkill; plain text in the value cell matches sheet styling.

Also "make that row the way into the part dossier" — clicking the PN opens part dossier. Done via data-sd-part + existing delegated capture handler (which stops propagation). Keyboard enter/space handled too.

Also should the row survive redraws? The sheet is re-rendered per record open; pass() re-adds on mutation. Marking done per row instance: the row we insert is ours; when the sheet re-renders, new rows appear, our row is gone, pass() re-inserts. Fine.

One more: the record id linkage — the sheet fetches record; if the reader opens record A, we capture A; then opens record B, capture B; row updated accordingly since pass() re-runs and reads SX.last. But if the sheet renders before our captured response arrives (fetch resolves after DOM update), pass() runs on the sheet mutation with SX.last still = previous record → wrong PN shown briefly, then when fetch resolves... our sdNoteRecord doesn't trigger pass(). Add: after storing, call kick() to schedule a pass. Yes — call kick() in sdNoteRecord. And to avoid stale: store along with a monotonically increasing id; row update just uses latest. Slight race risk (shows previous record's PN for a moment). Mitigate: when sheet changes (detect new sheet render or changed "Part" value cell?), mark row as needing refresh? Simpler mitigation: also store the record's identity if present (rec.id or rec.record_id or rec.sdr_id), and the sheet's citation row might contain it... too deep. I'll accept latest-wins with kick on capture; also when the sheet's Part-name value cell text changes we could clear? Eh. Also: only overwrite if this response is "the record" — fine.

Additionally, maybe guard: if pn is empty string → treat as absent (phrase). Also `part_number` could be null.

Now also fault 1's window.setFilter — must the sentence say so after click? Since we navigate, page recomposes sentence from query params — brief says standing sentence is composed from them. Good. URL agrees. Rows agree.

But hold on — should setFilter instead avoid full reload and use the page's own mechanism...? "Setting the parameter and letting the page apply it is the honest route" — yes, navigate.

One question: `location.href = url` vs `location.assign(url)`. Either. Also consider preserving hash.

Also: the 5 setFilter onclicks include field names operator, model, jasc — three fields listed ("the five fields in the table's onclicks: operator, model, jasc" — five handlers across three fields). Fine, generic.

Now also `window.setHero` — 1 onclick handler in the record table calls it. What rail name would a table cell pass? Possibly the "Where on the aircraft" cell passes "where". Our implementation opens `.rail[data-rail=...]`. Also maybe the hero rail names differ; add fallback: if no rail matches, try matching rails by prefix or by heading text containing the name. Also maybe setHero should also scroll hero into view. I'll include scroll.

Also, "opens that rail" — maybe rails are also switchable via tabs (`#vstrip .vtab[data-view=...]`)? No — those are panels (p-search, p-aircraft...). Rails are the hero's diagram rails: who/what/where/when. The page likely has rail headers clickable. I'll do the click-then-force approach:

```js
function sdOpenRail(name){
  var rails=document.querySelectorAll(".rail[data-rail]"),i,r=null,nm;
  name=String(name==null?"":name).trim().toLowerCase();
  if(!name)return;
  for(i=0;i<rails.length;i++){
    nm=(rails[i].getAttribute("data-rail")||"").toLowerCase();
    if(nm===name){r=rails[i];break}
  }
  if(!r){
    // try heading text
    for(i=0;i<rails.length;i++){
      var h=rails[i].querySelector("h2,h3,.railhead,.rhead,.rlabel");
      if(h&&h.textContent.trim().toLowerCase().indexOf(name)>=0){r=rails[i];break}
    }
  }
  if(!r)return;
  if(!/\bopen\b/.test(r.className||"")){
    var tog=r.querySelector(".railhead,.rhead,.head,summary,[role=button],h2,h3,button");
    if(tog){try{tog.click()}catch(_){}}
  }
  if(!/\bopen\b/.test(r.className||"")){r.classList.add("open")}
  try{r.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){try{r.scrollIntoView()}catch(_){}}
}
```

Wait: risk — clicking tog might navigate or toggle something else. If tog is a heading inside the rail whose click handler is the rail toggle, fine. If clicking has no effect, we force class. If clicking *closes* (rail was open — but we skip when open)... ok. But there's another subtle risk: clicking h2 might do nothing harmful. Acceptable. Actually, hmm, maybe simpler: skip the click entirely and just force the class + also try to update page state? The page might keep rails in JS state; forcing class only affects CSS. If the rail's closed state is CSS (display:none via `.rail:not(.open) .track`), forcing works visually. If the page conditionally renders content on open (JS), forcing shows empty. Can't know. The click-first approach gives the page a chance to do it properly. Keep click-first with force fallback. But limit tog candidates to things likely toggles: `.railhead, .rhead, summary, button, [role=button], h2, h3` — first match. If the click opens, class appears (sync via click handler usually sync). Then check.

Hmm — also `setHero` might need to handle being called with names like "Where"? Lowercase compare handles.

Now, "Prefix every new name" — all my functions are sd-prefixed, globals like `window.__sdFetchWrapped`, `SX` local inside IIFE (fine). Our whole script is one IIFE already — keep that structure, add new functions inside.

Also the existing `sdMarkCells` scans `code.cd` — now the sheet will contain a code.cd (ours). Guard: skip code inside the sheet row / inside [data-sd-pnrow], and skip inside #sd-dossier (already). Update: `if(c.closest('[data-sd-pnrow]'))continue;`. Also our own code has dataset.sdPart set; sdMarkCells would re-process — it checks `c.dataset.sdPnDone` — we set sdPnDone when creating, or skip via closest. Set `c.dataset.sdPnDone="1"` at creation to be safe. Actually our regex `/^P\/?N\.?\s*(.+)$/` wouldn't match bare pn anyway. But skip explicitly.

Also the brief fault 2 mentions "your part dossier was hung on an element that does not exist here" — i.e., previously the part dossier entry was code.cd P/N in... the case sheet? The old code marked code.cd cells anywhere as part-dossier links; on this page there are none, so part dossier was unreachable except... Now the sheet row provides the way in. Good — and keep the generic code.cd marker (harmless, guarded).

Also: "When a record has no part number, say so in the same words the sheet uses for other absent fields" — detect. Let me also consider that the sheet might use "—" em dash. Covered.

Now, must also keep everything else: the whole CSS block stays as-is (CSS unchanged — no CSS faults; but maybe add small styles for the part-number row? The row uses the sheet's own cell classes; code.cd exists; sd-pnlink styled already). Maybe no CSS changes needed. The instructions: "Return one block of CSS and one of JavaScript, whole, replacing the block." So return the same CSS (can add minor additions if needed — not needed). I'll return CSS unchanged.

Wait — should I double check the "Part number" row's cells classes: label cell cloned from Part row's label cell (has proper class/scope). Value cell cloned from Part row's value cell. Good. Remove id/aria-labelledby from clones.

Also ensure the row is not marked clickable-looking beyond the code. Fine.

Now the delegated click handler in current JS: `e.target.closest('[data-ask^="tail|"],[data-sd-op],[data-sd-part]')` — our new code.cd with data-sd-part matches. Good.

Now write setFilter with guards:

```js
function sdSetFilter(field,value){
  try{
    var f=String(field==null?"":field).trim();
    if(!f)return;
    var v=(value==null)?"":String(value).trim();
    var params=new URLSearchParams(location.search);
    if(v==="")params.delete(f);else params.set(f,v);
    var qs=params.toString();
    var target=location.pathname+(qs?"?"+qs:location.search?"?":"")+location.hash;
```

Hmm if qs empty and original had "?", just pathname. `location.pathname+(qs?"?"+qs:"")+location.hash`. Then navigate: if target === location.pathname+location.search+location.hash, do nothing; else `location.href=target`.

Should trimming value be safe? "ZONE 500" internal space kept. Leading/trailing trim fine.

Edge: URLSearchParams encodes spaces as `+` — matches `?zone=ZONE+500&operator=CALA`. 

Also, define only when absent, but also *keep* asserting in pass() (in case something deletes them? unlikely; cheap anyway — but careful: assert only defines when typeof !== function; ours is a function so pass won't redefine. Good).

Also — the inline onclick might be like `onclick="setFilter('operator','CALA')"` on span.c cells; with window.setFilter defined, they work. 

Now update pass() to include: sdEnsureGlobals(), sdPartRow(). Order: early, since globals should exist ASAP — also define immediately at script evaluation (not waiting for pass), since inline handlers could fire any time. Yes: call sdEnsureGlobals() right away at IIFE top (after function defs) and also in pass().

Also keep `window.rrTail` reassertion.

Also: sdBootFromURL unchanged.

Potential issue: wrapping fetch inside our IIFE before the page's script runs? Our block is "at the end" — page script already ran, captured its own fetch reference? If the page stored `const f=fetch` earlier, our wrapper won't intercept its calls. Hmm! "You have no tools... everything measured" — we don't know. The page's record fetch would then bypass our wrapper. Alternative interception: patch after page load — if page binds `fetch` at call time (`fetch(...)` inside its functions resolves via global scope at call time → wrapper intercepts). Most code calls `fetch(...)` directly, resolved at call time from global — wrapper works. If the page aliased it early, XHR fallback won't help either. Accept the risk; it's the best available route given no knowledge of a record endpoint. Hmm, alternatively derive record endpoint from observed requests... can't without tools.

Another thought: could the part number already be present somewhere in the sheet, e.g., in "The mechanic's own words" or citation? Not reliably parseable. Also the sheet row "Check it against the source" might contain the record URL with an id — then we could fetch the record endpoint ourselves... but path unknown. Stick with interception + also a supplementary approach: watch for any captured JSON. Fine.

Also handle: response.json() on clone — for same-origin GET fine.

Also the brief says "the case sheet is opened per record and already fetches that record" — maybe the sheet fetch happens via the page's own api like `api/record/12345`. If content-type header missing json, our check fails; loosen: attempt json parse regardless of content-type? Cloning and trying json() always: cheap enough, catch errors. Do: try json regardless; if parse succeeds and has part_number, accept. But then HTML pages fail parse → caught. Do that (drop content-type requirement), but keep URL exclusion. Also require `!Array.isArray`.

Risk of capturing from page's other endpoints that include part_number per record list? E.g., the record table data itself — if the table data fetch (a list with records[]) — excluded via "records" in obj check and it'd be an array. A list response {records:[...]} has "records" → excluded. Good.

Now, absence phrase: also check the *label* column? No, value column (cells[cells.length-1]). Some sheets: label th + value td. cells[last] is value. OK. But "Check it against the source" row's value might be a link "source" — not absence. "How to cite it" value is citation text. Fine.

Additional consideration: the sheet might be a definition list (dl) rather than table? The brief says "The case sheet shows sixteen rows" — earlier fault text: "The case sheet shows sixteen rows, measured: Date of the difficulty, ..." — likely a table with th/td rows, given "How to cite it" etc. But could be divs. Hmm. To be safer, make the finder handle both tables and generic rows? That's complex. I'll handle tables (rows/cells) as primary, and also a fallback scanning for elements whose textContent.trim()==="Part" within an overlay/dialog? Without knowledge, tables are the reasonable bet — the original markup language ("rows", the record table) suggests tables. Also the sheet is "the case sheet overlay" — Phase B mentions it exists and works. I'll also add a secondary finder for `[class*=sheet] table, dialog table, [role=dialog] table` — same table scan anyway covers all tables. Keep the two-label requirement to avoid false positives on the main table. But what if the sheet's label cell text is "Part" with different case/whitespace — trim + compare exact "Part". The measured list says "Part". OK. Also fallback: accept a table where first-cell texts include both "Part" and "The mechanic's own words". Use a required set: ["Part","How to cite it"] — require at least both; maybe count matches and require ≥2 of a known set to be robust:

```js
var NEED=["Date of the difficulty","Airline","Filed by","Aircraft","System","Part","Condition of the part","The mechanic's own words","How to cite it"];
```

Require the table's first-cell label set to contain "Part" and at least 3 others from NEED. Note the apostrophe in "mechanic's" — measured text uses ’? The brief shows "The mechanic's own words" with straight quote in the brief, but the page likely uses ’ (typographic). Avoid apostrophe-containing labels in matching; use ones without: "Date of the difficulty" has no apostrophe ("of the" fine). "Condition of the part", "How to cite it", "Filed by", "Aircraft", "Airline", "Part", "System", "Stage of flight". Good, skip mechanic's.

Also the record *table* (main) — could its th headers match? Its columns per case sheet-like? The main record table columns probably: date, airline, tail, system, part, ... as headers. Header row cells[0] "Date"? Not "Date of the difficulty". Requiring ≥3 of NEED including "Part"... main table header might have "Part" as a th! And maybe "System". But cells[0] scanning all rows: for the main table, first row is header where cells[0] is e.g. "Date". Data rows cells[0] are dates. So label set for main table = {"Date", dates...}. "Part" appears as a *non-first* header. So requiring "Part" as a FIRST cell excludes it. Also require "How to cite it" as a first cell — main table surely lacks that. Solid: require both "Part" and "How to cite it" as first cells. I'll require these two, plus count≥4 of NEED for extra safety? Two-required is enough; add the count for safety without risking miss: require ("Part" in labels) && ("How to cite it" in labels). Good.

Now insertion position: "as its own row beside the part name" — right after Part row. 

Value cell styling: clone part row's value cell attributes. If part row has cells[1] as td. If the sheet uses th for labels, clone keeps scope="row" maybe — remove id only.

Write value:

```js
function sdFillPartRow(row, templateValueCell){
  var vc=row.cells[1];if(!vc)return;
  var rec=SX.last, raw=rec&&typeof rec==="object"?rec.part_number:null;
  var pn=(raw==null)?"":String(raw).trim();
  vc.textContent="";
  if(pn){
    var code=document.createElement("code");
    code.className="cd sd-pnlink";
    code.textContent=pn;
    code.setAttribute("data-sd-part",pn);
    code.setAttribute("role","button");
    code.setAttribute("tabindex","0");
    code.setAttribute("aria-label","Open the dossier for part number "+pn);
    code.dataset.sdPnDone="1";
    vc.appendChild(code);
  }else{
    var ph=sdAbsencePhrase(row.parentNode)||"not recorded";
    vc.textContent=ph;
  }
}
```

Hmm: absence phrase fallback — with period? I'll use "not recorded" without period; sheet phrases likely "not recorded". Detection may find e.g. "not recorded." — use as-is.

Also add title/aria note? The code has aria-label. Fine.

Also — what if part_number exists but empty string → absent phrase. Covered.

Now `SX.last` staleness: when the reader closes the sheet and opens another record, the new fetch updates. When sheet re-renders same record (stepper), fine.

One more subtlety: our wrapper also captures responses from the page's record fetch used to fill the sheet — but what if the page fetches the record BEFORE the sheet exists (then renders)? pass() runs after render, row filled from captured data. Good, because we store, not render directly.

Also if the page fetched the record before our script loaded (script at end of body, but sheet opens only on user click — after load — so fine).

Now also make sure `sdNoteRecord` triggers kick:

```js
function sdNoteRecord(obj,url){
  try{ ...checks... SX.last=obj; kick(); }catch(_){}
}
```

kick defined later in IIFE — function declarations hoist, fine.

Now assembling the JS: take the current block, add:

1. `SX` store + `sdNoteRecord` + fetch/XHR wrapping (do wrapping once at IIFE top).
2. `sdSheetTables`, `sdAbsencePhrase`, `sdIsAbsentText`, `sdPartRow`/`sdEnsurePartRow`.
3. `sdSetFilterImpl`, `sdSetHeroImpl`, `sdEnsureGlobals`.
4. pass() additions: sdEnsureGlobals(); sdPartRow().
5. Call sdEnsureGlobals() immediately.
6. sdMarkCells: skip codes inside [data-sd-pnrow].

Also the CSS: unchanged, plus maybe a style for the part row? Not needed; cloned cells inherit. Add nothing? The instruction says return whole blocks replacing the block; CSS can be identical. Maybe add a tiny rule for `[data-sd-pnrow] code.cd` — already have `code.cd.sd-pnlink` styles. Keep CSS as-is.

Wait, one more check on setHero usage: "1 onclick handler calls it" in the record table — perhaps the "Where on the aircraft" cell: `onclick="setHero('where')"`. Our impl handles.

Also must setHero possibly also handle hero not in "instrument" mode? ensureIpad handles layout; fine.

Also possible: rails may need `aria-expanded`? skip.

Double-check "Do not declare a name the page already uses": our globals: window.__sderrs (existing), window.__sdFetchWrapped (new, prefixed). window.setFilter/window.setHero — the brief explicitly tells us to define these (conditionally). window.rrTail existing. OK.

Also inside IIFE all new vars prefixed sd/SX.

Now — a nuance on "only when they are not already defined, so that if the page ever exports its own, yours steps aside." Also implies our definitions shouldn't clobber; and pass() re-check keeps that invariant. 

Another nuance: `window.setFilter` inline handlers run in global scope; our function must be a global — assigning window.setFilter property works.

Let me also think: should setFilter push history state instead of navigating, then trigger the page's own re-read? The page reads on load only → must navigate. Confirm with "the URL, the sentence and the rows agreeing" — after reload, all three agree. And "Write it so it survives the page redrawing on every filter change, rail switch and resize" — our MutationObserver + reload handles.

Edge: location.href assignment triggers reload; beforeunload none. Fine.

Now let me also double check sdDossierNode etc. remain untouched.

One more thought about capturing record fetches: our own dossier calls go through wrapped fetch too; excluded by URL regex `/api\/(airframe|repeats|summary|operator|part|export)/`. Our sdGetJSON uses "/z/api/..." — matches "api/airframe" etc. Good. Unknown page paths: page might use "/api/record/123" — not excluded, has part_number, no records → captured. 

Also the excluded check should maybe be case-insensitive and tolerant of "/z/". Use `/api\/(airframe|repeats|summary|operator|part|export)\b/i`. `\b` after "part" prevents "part_number"?? Wait — URL "api/parts"? \b between t and s? \b requires word boundary; "parts" → after "part" comes "s", both word chars, no boundary → "api/parts" NOT matched → not excluded. Fine (parts isn't ours). But careful: "api/part/..." matches. Good. Also "api/export" matches export links (GET /z/api/export/<tail>.csv returns CSV — json parse fails anyway).

Now the XHR wrapper: `XMLHttpRequest.prototype` might be used with responseType json → responseText throws. Guard try/catch; also check `this.responseType===""||"text"`. Keep in try/catch.

Let me now write the final JS block, integrating additions into the existing code cleanly.

Also: in pass(), order matters — sdPartRow after tagTable maybe. And sdEnsureGlobals first.

Also initial immediate call: after function definitions, before observers: `sdEnsureGlobals();`

Let me also handle: what if the sheet's "Part" row's value cell contains the part name (e.g., "AHRS") — we don't touch it. Ours is a new row.

What about "beside the part name" possibly meaning same row? "show the part number in the case sheet, as its own row beside the part name" — own row, adjacent to the Part row. Right after.

Potential collision: if the page later adds its own "Part number" row → our finder's existing-row check looks for data-sd-pnrow attribute only; if the page adds its own row with text "Part number", we'd add a duplicate. Check also text match: when scanning nextElementSibling, accept if data-sd-pnrow="1" OR first-cell text is "Part number" (adopt it, fill value only if empty?). Simpler: if next row's first cell text is "Part number" and it's not ours, leave it alone (page's own) and skip. Implement: if next exists and firstCell text==="Part number": if data-sd-pnrow==="1" → refill; else → mark adopted, don't touch? I'll just refill ours, skip foreign. Fine.

Now absence phrase detection scope: pass the table (tbody). 

Also: label for our row — cloned th will read "Part number". If label cells use a class for styling (e.g., "k"), clone preserves. Good.

Write `sdSheetTables`:

```js
function sdSheetTables(){
  var out=[],ts=document.querySelectorAll("table"),i,j,t,rows,labels;
  for(i=0;i<ts.length;i++){
    t=ts[i];rows=t.rows;if(!rows||!rows.length)continue;
    labels=null;
    for(j=0;j<rows.length;j++){
      var c=rows[j].cells, k=c&&c.length?c[0]:null;
      if(!k)continue;
      var tx=k.textContent.trim();
      if(tx==="Part"||tx==="How to cite it"){
        labels=labels||{};
        labels[tx]=rows[j];
      }
    }
    if(labels&&labels["Part"]&&labels["How to cite it"])out.push(labels["Part"]);
  }
  return out;
}
```

Returns Part rows. Then sdPartRow iterates.

Also guard: don't process tables inside #sd-dossier (ours has no such labels anyway).

Also the sheet may re-render on each stepper click; our row gets wiped with re-render and re-added. Good.

Now think about whether `pass()` mutations loop: our sdPartRow inserts a row → MutationObserver fires → kick → pass → row exists, no insert. No infinite loop. sdEnsureGlobals no-op. Good.

Also sdFillPartRow rewrites value cell content each pass? Only set when content differs — setting textContent each pass would wipe focus... Let's only rewrite if changed: compare `vc.dataset.sdPnVal` vs pn-or-phrase. Implement:

```js
var key=pn?("pn:"+pn):("abs:"+phrase);
if(vc.getAttribute("data-sd-pnval")!==key){vc.setAttribute(...); rebuild content}
```

Good, avoids churn.

Now setHero implementation detail — also maybe the page uses buttons with data-rail? Also maybe rails identified by `id="rail-where"`. Add fallback: `byId("rail-"+name)` or `.rail#...`. I'll add a couple of fallbacks cheaply.

Also potential: setHero may be called with a rail name plus the hero needs to scroll to top. We scrollIntoView the rail.

Now, let me also review: "You cannot reach inside the IIFE." — we don't. "Define window.setFilter and window.setHero yourself, only when they are not already defined" — done.

Let me now also double-check the existing delegated click capture handler doesn't interfere with the setFilter cells: cells with onclick setFilter have no data-ask/data-sd-op/data-sd-part → closest returns null → passes through → inline onclick runs → window.setFilter → navigate. But wait — operator cells now ALSO have our "dossier" marker button appended (sdMarkCells). Clicking the marker: closest matches [data-sd-op] → stopPropagation + preventDefault in capture phase → inline onclick never fires (stopPropagation in capture prevents reaching target) → dossier opens. Clicking the value text: no match → inline setFilter runs → navigates+filters. That matches the current design ("a click on the value itself still filters"). Good.

Now the model cells: sdMarkCells only marks operator spans (OPRE requires 'operator'). Model cells call setFilter directly. jasc cells too.

Now compose the final answer. CSS: reproduce unchanged. JS: full block with additions.

Let me write out the JS carefully.

```js
(function(){
"use strict";
window.__sderrs=window.__sderrs||[];
addEventListener("error",function(e){try{window.__sderrs.push(String((e&&e.message)||e))}catch(_){}});
function byId(id){return document.getElementById(id)}
function visible(n){...same...}
function phone(){return matchMedia("(max-width:760px)").matches}
```

(keep READING_TEXT etc.)

Add after sdEsc-ish utilities... Let me place new sections:

Section A (early, before observers): sd globals + fetch wrap.

```js
/* sd-globals: the six inline handlers in the record table call
   window.setFilter and window.setHero, which live inside the page's IIFE
   and are invisible to inline onclick. Defined here, only when the page has
   not exported its own, and re-checked on every pass so an export always
   wins. setFilter narrows the selection the honest way: every filter on this
   page is a query parameter, the instrument reads them on load and composes
   the standing sentence from them, so the parameter is set and the page
   applies it — URL, sentence and rows then agree. */
function sdSetFilter(field,value){
  try{
    var f=String(field==null?"":field).trim();
    if(!f)return;
    var v=(value==null)?"":String(value).trim();
    var params=new URLSearchParams(location.search);
    if(v==="")params.delete(f);else params.set(f,v);
    var qs=params.toString();
    var target=location.pathname+(qs?"?"+qs:"")+location.hash;
    if(target===location.pathname+location.search+location.hash)return;
    location.href=target;
  }catch(_){}
}
function sdSetHero(name){
  try{
    name=String(name==null?"":name).trim().toLowerCase();
    if(!name)return;
    var rails=document.querySelectorAll(".rail[data-rail]"),i,r=null,nm;
    for(i=0;i<rails.length;i++){
      nm=(rails[i].getAttribute("data-rail")||"").trim().toLowerCase();
      if(nm===name){r=rails[i];break}
    }
    if(!r){var cand=byId("rail-"+name)||byId("rail_"+name);if(cand&&/\brail\b/.test(cand.className||""))r=cand}
    if(!r)return;
    if(!/\bopen\b/.test(r.className||"")){
      var tog=r.querySelector(".railhead,.rhead,.rail-hd,summary,button,[role=button],h2,h3");
      if(tog){try{tog.click()}catch(_){}}
    }
    if(!/\bopen\b/.test(r.className||""))r.classList.add("open");
    try{r.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){try{r.scrollIntoView()}catch(_){}}
  }catch(_){}
}
function sdEnsureGlobals(){
  if(typeof window.setFilter!=="function")window.setFilter=sdSetFilter;
  if(typeof window.setHero!=="function")window.setHero=sdSetHero;
}
sdEnsureGlobals();
```

Section B: capture of the per-record fetch.

```js
/* sd-recfetch: the case sheet is opened per record and the page fetches that
   record itself; part_number is one of the fields it returns. The response is
   picked up in passing — fetch and XHR are wrapped once, and only responses
   that look like one record (own part_number field, no records array, and not
   one of the dossier endpoints) are kept, latest first. */
var SX={last:null};
function sdNoteRecord(obj,url){
  try{
    if(!obj||typeof obj!=="object"||Array.isArray(obj))return;
    if(!Object.prototype.hasOwnProperty.call(obj,"part_number"))return;
    if("records" in obj)return;
    if(url&&/api\/(airframe|repeats|summary|operator|part|export)(\/|\?|$)/i.test(String(url)))return;
    SX.last=obj;kick();
  }catch(_){}
}
if(!window.__sdFetchWrapped){
  window.__sdFetchWrapped=true;
  var sdOf=window.fetch;
  if(typeof sdOf==="function"){
    window.fetch=function(){
      var args=arguments;
      var url="";
      try{url=(args[0]&&args[0].url)?String(args[0].url):String(args[0]||"")}catch(_){}
      return sdOf.apply(this,arguments).then(function(res){
        try{
          if(res&&res.ok&&res.clone){
            var sdCl=res.clone();
            sdCl.json().then(function(j){sdNoteRecord(j,url)}).catch(function(){});
          }
        }catch(_){}
        return res;
      });
    };
  }
  try{
    var sdXO=XMLHttpRequest&&XMLHttpRequest.prototype;
    if(sdXO&&!sdXO.__sdRecPatched){
      sdXO.__sdRecPatched=true;
      var sdOOpen=sdXO.open,sdOSend=sdXO.send;
      sdXO.open=function(m,u){try{this.__sdUrl=String(u||"")}catch(_){}return sdOOpen.apply(this,arguments)};
      sdXO.send=function(){
        var self=this;
        try{
          self.addEventListener("load",function(){
            try{
              if(self.responseType&&self.responseType!=="text")return;
              var ct="";try{ct=self.getResponseHeader("content-type")||""}catch(_){}
              if(ct&&!/json/i.test(ct))return;
              sdNoteRecord(JSON.parse(self.responseText),self.__sdUrl);
            }catch(_){}
          });
        }catch(_){}
        return sdOSend.apply(this,arguments);
      };
    }
  }catch(_){}
}
```

Wait, `var sdOf` inside `if(!window.__sdFetchWrapped)` block — var hoists, fine.

Section C: the part-number row in the case sheet.

```js
/* sd-pnrow: the case sheet's Part row names the part ("AHRS") but carries no
   part number anywhere on the page. The record endpoint returns part_number,
   so the sheet gets its own Part number row beside the Part row, and that
   row is the way into the part dossier. When the record has no part number,
   the row says so in the same words the sheet uses for its other absent
   fields. */
function sdIsAbsentText(s){
  if(/^(--|\u2013|\u2014|-)$/.test(s))return true;
  if(/^(none|unknown|n\/a|na|not available|not recorded|not given|not reported|not stated|not captured|no entry|missing|absent|unrecorded)\.?$/i.test(s))return true;
  return /^not\s+[a-z][a-z ]{1,24}\.?$/i.test(s);
}
function sdAbsencePhrase(table){
  var seen={},best="",n=0,rows=table.rows,i,cells,v;
  for(i=0;i<rows.length;i++){
    cells=rows[i].cells;
    if(!cells||cells.length<2)continue;
    v=cells[cells.length-1].textContent.trim();
    if(!v||!sdIsAbsentText(v))continue;
    seen[v]=(seen[v]||0)+1;
    if(seen[v]>n){best=v;n=seen[v]}
  }
  return best;
}
function sdSheetPartRows(){
  var out=[],ts=document.querySelectorAll("table"),i,j,t,rows,part=null,cite=null;
  for(i=0;i<ts.length;i++){
    t=ts[i];rows=t.rows;part=null;cite=null;
    if(!rows||rows.length<4)continue;
    for(j=0;j<rows.length;j++){
      var c0=rows[j].cells&&rows[j].cells[0];
      if(!c0)continue;
      var tx=c0.textContent.trim();
      if(tx==="Part")part=rows[j];
      else if(tx==="How to cite it")cite=rows[j];
    }
    if(part&&cite)out.push(part);
  }
  return out;
}
function sdFillPartRow(partRow){
  var body=partRow.parentNode;
  var nxt=partRow.nextElementSibling;
  var row=null;
  if(nxt&&nxt.getAttribute&&nxt.getAttribute("data-sd-pnrow")==="1")row=nxt;
  else if(nxt&&nxt.cells&&nxt.cells[0]&&nxt.cells[0].textContent.trim()==="Part number")return; // the page drew its own
  if(!row){
    row=document.createElement("tr");
    row.setAttribute("data-sd-pnrow","1");
    var lc=partRow.cells[0],vc0=partRow.cells[1];
    var nl=lc?lc.cloneNode(false):document.createElement("th");
    var nv=vc0?vc0.cloneNode(false):document.createElement("td");
    try{nl.removeAttribute("id");nl.removeAttribute("aria-labelledby")}catch(_){}
    try{nv.removeAttribute("id");nv.removeAttribute("aria-labelledby")}catch(_){}
    nl.textContent="Part number";
    row.appendChild(nl);row.appendChild(nv);
    body.insertBefore(row,partRow.nextSibling);
  }
  var vc=row.cells&&row.cells[1];
  if(!vc)return;
  var rec=SX.last;
  var raw=(rec&&typeof rec==="object")?rec.part_number:null;
  var pn=(raw==null)?"":String(raw).trim();
  var phrase="";
  var key;
  if(pn)key="pn:"+pn;
  else{phrase=sdAbsencePhrase(partRow.closest("table"))||"not recorded";key="absent:"+phrase}
  if(vc.getAttribute("data-sd-pnval")===key)return;
  vc.setAttribute("data-sd-pnval",key);
  vc.textContent="";
  if(pn){
    var code=document.createElement("code");
    code.className="cd sd-pnlink";
    code.textContent=pn;
    code.setAttribute("data-sd-part",pn);
    code.setAttribute("role","button");
    code.setAttribute("tabindex","0");
    code.setAttribute("aria-label","Open the dossier for part number "+pn);
    try{code.dataset.sdPnDone="1"}catch(_){}
    vc.appendChild(code);
  }else{
    vc.textContent=phrase;
  }
}
function sdPartRow(){
  var rows=sdSheetPartRows(),i;
  for(i=0;i<rows.length;i++){try{sdFillPartRow(rows[i])}catch(_){}}
}
```

Note `partRow.closest("table")` — fine.

Wait, `sdAbsencePhrase` is computed only when pn missing — but key includes phrase so recompute cheap. Fine.

One issue: `sdFillPartRow` early-return when the page drew its own "Part number" row — good.

Also if the sheet shows multiple records? No, per record.

Section D: sdMarkCells tweak — add skip:

```js
if(c.closest&&c.closest("#sd-dossier"))continue;
if(c.closest&&c.closest("[data-sd-pnrow]"))continue;
```

(pass() calls sdMarkCells; our code.cd has sdPnDone already set at creation, so the skip is belt-and-braces. Keep both.)

Section E: pass() — add `try{sdEnsureGlobals()}catch(e){}` near top and `try{sdPartRow()}catch(e){}` after tagTable.

Everything else unchanged.

Also double-check: `sdBootFromURL` etc. unchanged.

One more consideration on fault 1: "Every operator, model and system cell in the record table looks clickable and answers nothing." — the fields listed: operator, model, jasc (jasc = system). With window.setFilter defined they work. ✓. The tail click works via rrTail/data-ask. Operator mark works. cannot_show — unchanged.

Also Phase B invariants — our additions don't alter counts/panels; the part row only exists in the sheet overlay. CSS untouched.

Now double check the click on the code.cd part number inside the sheet: delegated capture handler: closest('[data-ask^="tail|"],[data-sd-op],[data-sd-part]') → matches code → preventDefault+stopPropagation → sdOpenPart(pn). ✓ Keyboard: keydown handler handles data-sd-part. ✓

Also `sdOpenPart` exists. ✓

One thing: in `sdFillPartRow`, when we clone `vc0` — if part row value cell contains the part name inside a code.cd (e.g., `<code class="cd">AHRS</code>`)? cloneNode(false) copies no children. Good.

Also: cloned `nl` may carry `onclick` or style from the label cell — labels aren't clickable; fine.

What about the sheet possibly being built with a `<tbody>`? insertBefore on partRow.parentNode handles either.

Also `sdSheetPartRows` requiring rows.length>=4 avoids tiny tables. Fine.

Also: what if there are two tables matching (e.g., sheet rendered twice for phone)? Loop handles all.

Also `sdNoteRecord` calls `kick()` — kick is defined later via function declaration → hoisted. ✓ And MutationObserver defined later; kick uses requestAnimationFrame and pass — fine even early.

Potential timing: sheet renders row values via JS after fetch; if the page renders the sheet *first* with placeholders and fills later, our row may show absence phrase then update when capture arrives (kick on capture). But our vc key check: when phrase was rendered and later pn arrives, key changes → rebuild. ✓ However — if the sheet re-renders (page rebuilds rows), our row is removed; pass re-adds with current SX.last. ✓

Stale-cross-record risk: record A open, SX.last=A; open record B; page clears sheet, fetches B. During gap, if sheet exists with A's row... sheet likely emptied. Acceptable.

Also — what if the page fetches the record list including part_number for the whole table (an object with per-record fields + no "records" key)? e.g., {rows:[...]}? Then "part_number" wouldn't be own property. If list is {count:.., results:[...]} — no part_number. OK.

Edge: response json from our excluded endpoints — sdGetJSON also goes through the wrapper; exclusion by URL prevents pollution even if a payload had part_number.

Now, `window.fetch` wrapper returns promise chain preserving res. If page uses res.json() directly, our clone-then-json doesn't disturb. ✓ Also `res.clone()` after res.ok check; note cloning must happen before body consumed — we clone synchronously in .then before returning res to page. Wait: order — our .then runs first (we attached first), clone there, then return res; page's .then gets unconsumed res. ✓

Now write the whole JS block out, merged. I must reproduce the entire existing JS with additions. Long but necessary ("Return one block of CSS and one of JavaScript, whole").

Also update the comment header for sdMarkCells? Minor edit fine.

Let me also reconsider `sdSetHero` toggle-click risk once more. If the rail is closed and tog click opens it — page-state consistent. If tog click does something else (navigates?) — headings typically don't. But `button` candidate: if the rail contains a button (like "widen" or CSV), clicking it would be wrong! E.g., tail rail has buttons? The dossier buttons are in #sd-dossier, not rails. Rails contain rows/bars. Hmm, ".rail .legend", ".rail .lrow" — legends maybe clickable to toggle series? Risky. Let me restrict tog candidates to heading-like only: `.railhead,.rhead,.rail-hd,summary,h2,h3,.rlabel` — drop `button` and `[role=button]`. Safer. If none matches or click doesn't open, force class. Good.

Also, maybe the page toggles rails via clicking the rail's first `.vg`/label in vstrip? Unknown; force-class fallback covers visuals. Also add `aria-expanded` best-effort? Skip.

One more thought on setFilter: should it be case-preserved for value? Yes as passed.

What if the page's filter param names differ from the onclick field names (e.g., param "jasc" vs "system")? Brief says "Every filter on this page is a query parameter" and the onclick field is the filter field — trust it.

Also: does navigation reload lose the "Read all anyway" state etc.? Acceptable.

Finally, format the answer: brief intro line optional? The instruction: "Return one block of CSS and one of JavaScript, whole, replacing the block at the end of this brief." I'll output minimal prose (maybe none) with two code blocks. I'll add a very short note of what changed? Probably fine to just give the blocks; maybe a one-liner summary. I'll include a short list of changes before the blocks for clarity, then the blocks.

Now produce final CSS identical to given. And full JS.

Let me write the JS in full, carefully preserving all existing content and inserting new pieces.

Also note: in sdMarkCells the OPRE uses onclick attr; operator cells that we appended "dossier" buttons to — after navigation/reload, fresh DOM. ✓

Also — small detail: `sdFillPartRow` uses `partRow.closest("table")`; partRow is a tr from rows collection, closest works. ✓

Also the `key` guard: `vc.getAttribute("data-sd-pnval")` — set before building. But we set textContent="" then build; if exception mid-way? fine.

Also for absent: also add a muted class? If the sheet's absent cells have a class (like "muted"), could copy from a detected absent cell's class. Nice touch: in sdAbsencePhrase, also return the class of that cell. Let me implement returning {text, cls}:

```js
function sdAbsence(table){
  var seen={},best=null,rows=table.rows,i,cells,v,cell;
  for(i=0;i<rows.length;i++){
    cells=rows[i].cells;
    if(!cells||cells.length<2)continue;
    cell=cells[cells.length-1];
    v=cell.textContent.trim();
    if(!v||!sdIsAbsentText(v))continue;
    if(!seen[v])seen[v]={n:0,cls:cell.className||""};
    seen[v].n++;
    if(!best||seen[v].n>seen[best.text].n)best={text:v,cls:seen[v].cls};
  }
  return best;
}
```

Then apply `if(cls)vc.className=cls` — hmm but vc was cloned from Part value cell which may have its own class; overwriting with the absent cell's class matches how absent fields look. I'll do that only when absent. OK, minor.

Simplify: keep it.

Now finalize. Also ensure no use of `let`/arrow — keep ES5 style consistent.

Write it out.