We need to output three blocks: python (the replacement `part` view), css, js.

The core change: the part dossier must be keyed on part name, not part number. The current `part(pn)` view searches `/api/search?part=<pn>` treating pn as name. Now:

- The click carries both PartNumber and PartName and PartCondition. The page needs to fetch the case record? Actually the case sheet already fetches api/case/<control> to get PartNumber. The brief says: "Take the name and condition from the same case record you already fetch." So the sd case-fetch (sdEnsureCase) already gets rec with PartName, PartNumber, PartCondition. So when the reader clicks the part number in the case sheet, we have the name and condition. We should open the part dossier keyed on the part name, passing part number and condition along.

The python view: replace `part(pn)` with `part` that takes a `name` (and optionally `pn`/`condition` as context), searches `/api/search?part=<name>`, and checks `/api/same-defect` for the part number (the forty). Returns same fields plus `part_number`, `part_name`, `condition`, `same_defect` (row or null), plus cannot_show extended with the honest sentence: "This file cannot be searched by part number, so what follows counts every report naming the part by name — CARRIAGE — which will include other part numbers of the same kind of part."

Route design: keep the URL `/z/api/part/<pn>`? The brief says "the replacement for the `part` view". We can change the route to accept the part name: `/z/api/part/<name>` with query params `pn=` and `condition=`. The JS calls sdGetJSON("part/"+encodeURIComponent(val)) — we'd change to pass name plus query params. Since it's our service, we can design: `/z/api/part/<name>?pn=<pn>&condition=<cond>`. The <name> path segment — part names like "CARRIAGE" are single words; but could have spaces? encodeURIComponent would give %20 which Flask accepts in path. Fine.

The route function name: it must remain `part` presumably (the brief says replacement for the `part` view). Keep `@app.get("/z/api/part/<name>")` def part(name): with `pn=request.args.get("pn","")`, `condition=request.args.get("condition","")`.

Then:
```
d = api("/api/search", part=name, limit=400)
rows = [decorate(r) for r in ...]
tails, ops, years as before
sd = None
if pn:
    rows40 = api("/api/same-defect").get("rows") or []
    for r in rows40:
        if str(r.get("part_number","")).strip() == pn:
            sd = {...}; break
cannot = [existing sentence, new honest sentence]
return jsonify(part_name=name, part_number=pn or None, condition=condition or None, total=..., ..., same_defect=sd, cannot_show=[...])
```

The honest sentence, in reader's words: "This file cannot be searched by part number. What follows counts every report that names the part as {name}, which will include other part numbers of the same kind of part."

Also condition: show part name and condition. The brief: "the part name and its condition — /api/search?part=<name>, which works". So maybe search should include condition? The search endpoint searches part name only. We could label the dossier with name + condition. Keep search on name.

Should we filter by condition? No — the file can only search by name. Show condition as label of the clicked record. Fine.

Also "the forty" — if the part number is among the 40, show its reports, aircraft, operators fleet-wide. So same_defect row includes reports, aircraft, operators.

Python:

```python
@app.get("/z/api/part/<name>")
def part(name):
    name = (name or "").strip()
    pn = (request.args.get("pn") or "").strip()
    condition = (request.args.get("condition") or "").strip()
    d = api("/api/search", part=name, limit=400)
    rows = [decorate(r) for r in (d.get("rows") or [])]
    tails = Counter(r["tail"] for r in rows if r["tail"])
    ops = Counter(r["operator"] or r["operator_code"] for r in rows if r["operator_code"])
    years = Counter((r["date"] or "")[-4:] for r in rows if r["date"])
    sd = None
    if pn:
        for r in (api("/api/same-defect").get("rows") or []):
            if str(r.get("part_number") or "").strip() == pn:
                sd = {"part_number": pn,
                      "part_name": r.get("part_name") or name,
                      "condition": r.get("condition") or condition or None,
                      "reports": r.get("reports"),
                      "aircraft": r.get("aircraft"),
                      "operators": r.get("operators")}
                break
    cannot_show = [
        "More reports does not mean a worse part. It can mean the part is simply more common, or fitted to more aircraft.",
    ]
    if pn:
        cannot_show.append(
            'This file cannot be searched by part number, so every figure here counts reports naming the part "%s" by name, which will include other part numbers of the same kind of part.' % name
        )
    else:
        cannot_show.append('This file cannot be searched by part number, so every figure here counts reports naming the part "%s" by name, which will include other part numbers of the same kind of part.' % name)
    return jsonify(part_name=name, part_number=pn or None, condition=condition or None,
                   total=d.get("total"), shown=len(rows), aircraft=len(tails), operators=len(ops),
                   by_operator=..., by_year=..., records=rows[:60],
                   same_defect=sd, cannot_show=cannot_show)
```

Note `request` must be imported — Flask app presumably already imports request (it's a Flask app with routes; likely `from flask import request`). To be safe, we use `from flask import request` at top? The brief says return the replacement for the part view whole. I'll include a safe import line? Adding a duplicate import inside is safe: `from flask import request as sd_request`? Prefixing new names... Hmm, "Prefix every new name. Do not declare a name the page already uses." That's about the page (JS/CSS mostly). For python, adding `from flask import request` inside the function is fine and safe. Actually the original app.py surely imports request already. I'll just use `request` and add a local import guard:

```python
try:
    request  # noqa
except NameError:
    from flask import request
```

That's ugly. Simpler: within the function do `from flask import request` — local import shadows nothing problematic. Actually a local `from flask import request` inside the function is fine and common. But if module-level `request` exists, local import just rebinds locally — fine.

Now the JS. Changes needed:

1. sdOpenPart: now needs name, pn, condition. The click points: the case sheet part-number row (sdFillPartRow) — we have `rec` there with PartName, PartNumber, PartCondition. So code.dataset.sdPart=pn, plus data-sd-partname, data-sd-partcond. Also sdMarkCells picks up code.cd with "P/N ..." text in records — those have only the number, no name. For those, we don't have a name. Hmm. The brief focuses on the case sheet click: "Take the name and condition from the same case record you already fetch." For other P/N codes without a name, what do we do? Options: don't open the part dossier from those (they have no name to search by). Or open using the number as name? That would search part=<number> which returns 0 — the exact dishonesty. Better: for those codes, we can't build an honest dossier, so... Actually the records in search results carry PartName too (decorate presumably keeps fields). The sdMarkCells codes come from the record table cells. Each record row... we could find the row's record data? The table rows are HTML; the P/N code sits within a record's cell. The record likely has a PartName cell nearby. Hmm, hard to reliably map.

Simplest honest approach: the primary path is the case sheet, where we have the case record. For sdMarkCells P/N codes, we could skip making them clickable (remove that behavior), or attempt to locate the row's part name. Given the brief: "Clicking the part number in the case sheet opens the dossier" — that's the required path. For other P/N mentions in the record table, we could keep them clickable but route through: fetch the case? We don't have control from those cells easily... Actually each record in the table corresponds to a record with fields; but we can't reliably extract.

Alternative: keep data-sd-part on those codes, but when opening without a name, show an honest message: "The file cannot be searched by part number..." Hmm, but that leaves dead-ends.

Better idea: when opening a part dossier without a name, we can use the part endpoint with pn only; the server returns part_name=None and total=None? The brief says nothing claims counts for the part number the file can't support. So the dossier for a bare pn should say: this file cannot be searched by part number; the same-defect list was checked (show if present); no name-based counts are shown. That's honest. But maybe simpler: make bare P/N codes in the record table non-clickable (remove the sd-pnlink behavior), since only the case-sheet row is the way in. The brief's "must still be true" list says clicking part number in case sheet opens dossier. It doesn't require the table P/N codes. But existing build has them; removing could count as losing something? The keep-list doesn't mention them. I'll keep them but make them honest: clicking a bare P/N opens the dossier keyed on pn with no name; server returns no search, and the panel says the file can't be searched by number, checks same-defect, shows those figures if present.

Hmm — but the server route is `/z/api/part/<name>`. If called with a pn and no name, we should not search by pn. Let server handle: if no `name` query param and the path segment looks like a part number, treat it as pn and skip search (total=None). Design API: `/z/api/part/<subject>` where subject is the name; query params pn, condition, and `name` optional. Cleaner: `/z/api/part/<name>?pn=...`. For bare pn clicks, JS could call with name empty... path can't be empty. Use `/z/api/part/-?pn=...`? Ugly.

Alternative design: keep path segment as the pn (what the reader clicked) and add `name` query param:

`/z/api/part/<pn>?name=CARRIAGE&condition=GOUGED`

Server: pn from path, name/condition from query. If name present → search by name. If not → no search, total=None, honest. This keeps URL semantics: the dossier is keyed on the part number clicked, and the name is the search key. The brief: "Key the dossier on what the file can answer" — the search is keyed on name; the dossier displays the pn. Either shape works. I'll go with `/z/api/part/<pn>?name=...&condition=...`. Wait but "the replacement for the part view" — route stays `/z/api/part/<pn>`, function still `part(pn)`. That's minimal-change and reads well.

Server logic:

```python
@app.get("/z/api/part/<pn>")
def part(pn):
    from flask import request as _req  # or use request
    name = (request.args.get("name") or "").strip()
    condition = (request.args.get("condition") or "").strip()
    pn = (pn or "").strip()
    rows = []
    total = None
    if name:
        d = api("/api/search", part=name, limit=400)
        rows = [decorate(r) for r in (d.get("rows") or [])]
        total = d.get("total")
    sd = None
    if pn:
        for r in (api("/api/same-defect").get("rows") or []):
            ...
    ...
```

cannot_show: base sentence + name-scope sentence (when name present) + no-name sentence (when absent): "The file cannot be searched by part number, so no count of reports for this part number is shown."

Now JS changes:

- sdOpenPart(pn, name, cond): store SD.name/SD.cond; request URL: `part/"+encodeURIComponent(pn)+"?name="+encodeURIComponent(name||"")+"&condition="+encodeURIComponent(cond||"")`. Only include name param if present.

- sdRenderPart rewritten: header shows part number and, if present, part name (+condition) labelled: 'figures are for the part name "CARRIAGE"'. The count section: if p.total == null (no name), show honest section: no counts; show same_defect figures if present; show cannot_show sentences.

- If p.total is 0: "No report in this file names that part by name" — plus the honest sentence already in cannot_show.

- same_defect block: if p.same_defect present, a section: "Among the forty most-written-up part numbers" — reports, aircraft, operators fleet-wide for this part number. Label clearly as the part number's own fleet-wide figures.

- sdFillPartRow: we have rec with PartName, PartCondition. Set data attrs on the code: data-sd-part=pn, data-sd-partname=rec.PartName, data-sd-partcond=rec.PartCondition. Note the case endpoint returns rec; field names: "PartNumber" was used; assume "PartName" and "PartCondition" similarly. The brief states the clicked record carries PartName, PartNumber, PartCondition — so the case record has these fields.

- The delegated click handler: for [data-sd-part], read sibling attributes: el.getAttribute("data-sd-partname"), data-sd-partcond. But sdMarkCells creates codes from "P/N xxx" text — no name. Keep those but without name (honest no-count dossier). Hmm — is that useful? It shows the same-defect check and the honest sentence. I think acceptable and honest. Actually, could we get the name from the record table row? The sdtable rows: each record... The P/N code is inside a cell; the same record likely has a Part name cell. Too speculative; keep simple.

Also sdOpenPart called from sdMarkCells with just pn.

- aria-labels updated.

Also sdDossierKick / sdOpen: SD object gets name/cond stored per open. Cache key: "part:PN" — but same pn could be opened with/without name. Key should include name: sdKey uses kind+":"+val. Use key = "part:"+pn+"|"+(name||""). Simpler: store name in SD and include in key.

Let me now write the JS modifications carefully, keeping everything else intact. I'll output the whole JS block with modifications.

Changes list in JS:

1. In sdFillPartRow, when pn found and rec has PartName/PartCondition, set attributes on code:
```js
var nm=(rec.PartName==null)?"":String(rec.PartName).trim();
var cd=(rec.PartCondition==null)?"":String(rec.PartCondition).trim();
if(nm)code.setAttribute("data-sd-partname",nm);
if(cd)code.setAttribute("data-sd-partcond",cd);
code.setAttribute("aria-label","Open the dossier for part "+(nm?nm+" ("+pn+")":"number "+pn));
```

2. sdOpenPart:
```js
function sdOpenPart(pn,name,cond){sdOpen("part",pn,name,cond)}
```

3. sdOpen(kind,val,name,cond): store SD.pname=..., SD.pcond; key includes name for part:
```js
var key=sdKey(kind,val);
if(kind==="part"&&name)key+="|"+name;
```
And sdReq for part: build query.

```js
if(kind==="part"){
  var q=[];
  if(name)q.push("name="+encodeURIComponent(name));
  if(cond)q.push("condition="+encodeURIComponent(cond));
  return[sdGetJSON("part/"+e+(q.length?"?"+q.join("&"):""))];
}
```

4. sdRenderCached: pass rs[0] as before; sdRenderPart reads SD.pname/pcond? Better read from p (server echoes part_name, condition). Yes server returns part_name etc. Good — render purely from response.

5. sdRenderPart rewrite:

```js
function sdRenderPart(node,res){
  var p=...;
  if(!p){sdRenderFailed(node,"part");return}
  var pn=(p.part_number!=null&&String(p.part_number).trim())?String(p.part_number).trim():SD.value;
  var nm=(p.part_name!=null&&String(p.part_name).trim())?String(p.part_name).trim():"";
  var cond=(p.condition!=null&&String(p.condition).trim())?String(p.condition).trim():"";
  var hasName=!!nm;
  var total=(p.total==null)?null:sdNum(p.total);
  var shown=sdNum(p.shown),ac=sdNum(p.aircraft),ops=sdNum(p.operators);
  var parts=['<p class="sd-d-kick">'+sdKickText("part")+'</p>'];
  parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(pn)+'</span>'
    +'<span class="sd-d-make">part number</span>'
    +(nm?'<span class="sd-d-make">figures are for the part named <b>'+sdEsc(nm)+'</b>'+(cond?' \u2014 condition '+sdEsc(cond):'')+'</span>':'')
    +(total!=null?'<span class="sd-d-count">'+sdFmt(total)+' report'+(total===1?"":"s")+'</span>':'')
    +'</div>');
  var sd=p.same_defect;
  if(sd&&typeof sd==="object"){
    var sdr=sdNum(sd.reports);
    parts.push('<section class="sd-d-sec"><h3>This part number, fleet-wide</h3>'
      +'<p class="sd-d-frame">'+sdEsc(pn)+' is among the '+sdEsc(sdFORTY?...)...
```

Hmm sdFORTY: server can send note text. Let server include in same_defect object? Keep simple: JS text: 'Among the forty most-written-up part numbers in this file:' then split list: reports, aircraft, operators. Use ul.sd-d-split with items. Maybe include part_name/condition from sd row.

Order of sections: brief order: part name and condition (search, works), part number shown, the forty checked. Count section first (name-based), then forty, then bars, quotes, limits.

Count section when hasName:
```js
if(total==null){
  parts.push('<section class="sd-d-sec"><h3>The count</h3><p class="sd-d-none">No count of reports is shown here, because this file cannot be searched by part number. Where this part number appears by name below, those figures are real.</p></section>');
}else if(total===0){
  parts.push('<section class="sd-d-sec"><h3>The count</h3><p class="sd-d-none">No report in this file names that part \u201c'+sdEsc(nm)+'\u201d by name, so there is no table to draw.</p></section>');
}else{
  ... existing count + bars + quotes ...
}
```

Wait — brief: "Add to cannot_show, do not replace it" — the server handles cannot_show; JS renders all of p.cannot_show via sdLimits — good, that's the "every cannot_show sentence on screen" requirement plus new sentence.

Same-defect section (independent of total):
```js
if(sd){
  parts.push('<section class="sd-d-sec"><h3>This part number in the file\u2019s worst-written-up list</h3>'
    +'<ul class="sd-d-split">'
    +'<li>reports fleet-wide <b>'+sdFmt(sd.reports)+'</b></li>'
    +'<li>aircraft <b>'+sdFmt(sd.aircraft)+'</b></li>'
    +'<li>operators <b>'+sdFmt(sd.operators)+'</b></li>'
    +'</ul>'
    +'<p class="sd-d-ops">These are the real figures for part number '+sdEsc(pn)+' from the file\u2019s list of the forty most-written-up part numbers.</p></section>');
}else if(pn){
  parts.push('<section class="sd-d-sec"><h3>This part number in the file\u2019s worst-written-up list</h3>'
    +'<p class="sd-d-none">'+sdEsc(pn)+' is not among the forty most-written-up part numbers in this file, so no fleet-wide figure for the number itself is shown.</p></section>');
}
```

Hmm — "not among the forty" — the brief says lowest has 412 reports, ordinary part not in it. Saying "is not among the forty" is true and honest. Good.

When no name (bare pn click): head shows pn, "part number", no count. Then same-defect section. Then cannot_show.

Also sdKickText for part: "part number" fine.

6. Delegated handlers: read name/cond attrs:

```js
if(el.hasAttribute("data-sd-part")){
  e.preventDefault();e.stopPropagation();
  sdOpenPart(el.getAttribute("data-sd-part"),el.getAttribute("data-sd-partname")||"",el.getAttribute("data-sd-partcond")||"");
  return;
}
```
Same in keydown.

7. sdDossierKick: unchanged since SD caches kind/value; but key includes name — sdKey used in sdDossierKick must match. Make a helper sdCurKey():

```js
function sdCurKey(){var k=sdKey(SD.kind,SD.value);if(SD.kind==="part"&&SD.pname)k+="|"+SD.pname;return k}
```
And SD stores pname/pcond. Use sdCurKey in sdOpen, sdDossierKick, sdRenderCached.

8. sdMarkCells: codes with "P/N" text — set data-sd-part only, no name. Keep.

Also aria-label for sd-pnlink in sdMarkCells: "Open the dossier for part number "+pn — fine but maybe add note; fine.

CSS: mostly unchanged; the build's CSS is returned "whole" — I can add a couple of small additions (e.g., .sd-d-make b styling) but must return whole block. I'll return the existing CSS with maybe a tiny addition for `#sd-dossier .sd-d-make b{color:var(--ink);font-weight:600}`. Keep everything else identical.

Now the python view. Need request import. Original app.py line 352 area — app uses Flask; `request` almost certainly imported. I'll write defensively:

```python
@app.get("/z/api/part/<pn>")
def part(pn):
    from flask import request
    pn = (pn or "").strip()
    name = (request.args.get("name") or "").strip()
    condition = (request.args.get("condition") or "").strip()

    total = None
    rows = []
    if name:
        d = api("/api/search", part=name, limit=400)
        rows = [decorate(r) for r in (d.get("rows") or [])]
        total = d.get("total")

    tails = Counter(r["tail"] for r in rows if r["tail"])
    ops = Counter(r["operator"] or r["operator_code"] for r in rows if r["operator_code"])
    years = Counter((r["date"] or "")[: -4] ... )
```

same-defect: `api("/api/same-defect")` returns {"rows":[...]} presumably (40 rows each {part_number,...}). Handle both dict-with-rows or list:

```python
    sd = None
    if pn:
        try:
            sdrows = api("/api/same-defect")
            sdrows = sdrows.get("rows") if isinstance(sdrows, dict) else sdrows
        except Exception:
            sdrows = []
        for r in (sdrows or []):
            if str((r or {}).get("part_number") or "").strip() == pn:
                sd = {"part_number": pn,
                      "part_name": (r.get("part_name") or name or None),
                      "condition": (r.get("condition") or condition or None),
                      "reports": r.get("reports"),
                      "aircraft": r.get("aircraft"),
                      "operators": r.get("operators")}
                break
```

Hmm "try/except" around api — api might raise; wrap in try. Fine.

cannot_show:

```python
    cannot_show = ["More reports does not mean a worse part. It can mean the part is simply more common, or fitted to more aircraft."]
    scope = ('The file behind this page cannot be searched by part number, so every figure above counts the '
             'reports that name the part "%s" by name, which will include other part numbers of the same kind '
             'of part.' % name) if name else \
            ('The file behind this page cannot be searched by part number, so no count of reports is shown for '
             'the part number itself.')
    cannot_show.append(scope)
```

Return:

```python
    return jsonify(part_number=pn or None, part_name=name or None, condition=condition or None,
                   total=total, shown=len(rows), aircraft=len(tails), operators=len(ops),
                   by_operator=[{"name": k, "n": v} for k, v in ops.most_common(12)],
                   by_year=sorted(({"year": k, "n": v} for k, v in years.items()), key=lambda x: x["year"]),
                   records=rows[:60],
                   same_defect=sd,
                   cannot_show=cannot_show)
```

Note: if no name, by_operator/by_year empty — fine since render skips.

Also part_name label from the forty row could differ; fine.

Edge: `part_name` echoed even when sd row's name differs — keep name from query; sd row carries its own name shown in that section? I include sd part_name in the section? Keep simple.

Now write full JS. It's long; I must reproduce the entire block with edits. Let me carefully assemble.

Key edits recap:

- sdOpen signature: `function sdOpen(kind,val,name,cond)`:
```js
SD.kind=kind;SD.value=val;SD.pname=(name==null)?"":String(name).trim();SD.pcond=(cond==null)?"":String(cond).trim();
var key=sdCurKey();
```

- sdReq uses SD.pname/pcond for part.

- sdRenderCached uses sdCurKey().

- sdDossierKick uses sdCurKey().

- sdOpenPart(pn,name,cond){sdOpen("part",pn,name,cond)}.

- delegated click: read partname/partcond.

- keydown: same.

- sdFillPartRow: add attrs.

- sdRenderPart rewritten.

Also SD declaration: `var SD={kind:null,value:null,pname:"",pcond:"",inflight:null,cache:{}};`

sdKickText("part") → maybe 'Aircraft panel — holding <b>one part</b>'... currently returns 'Aircraft panel — holding <b>one '+SD_KIND[kind]+'</b>' → "one part number". Fine.

Also in sdRenderPart when total==0 and no name — can't happen (total null when no name).

One more: the "records" quotes use sdQuotes(p.records) — fine.

Also head when hasName: label the count as name-based. Brief: "the dossier's figures are for the part name, labelled as such." So in count section, header e.g. "Reports naming the part CARRIAGE". I'll make the count section h3: 'Reports naming the part by name' with the make line in head showing name. Good enough — plus the cannot_show sentence.

Let me also update sdMarkCells aria-label to mention it's number-only? "Open the dossier for part number X" — the dossier will honestly state no name-count. Fine.

Write everything out now. Keep all other functions verbatim.

Also sdBootFromURL: unchanged.

Also note: `sdOpen` sets node innerHTML "Reading the file for the part number X…" — could mention name; minor, fine.

CSS: return whole original CSS plus small addition:

```css
#sd-dossier .sd-d-make b{font-weight:600;color:var(--ink)}
```

Append near sd-dossier styles. Fine.

Now produce final answer with three fenced blocks. Length is large but necessary since "whole" blocks requested.