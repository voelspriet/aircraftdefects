Let me understand the task. This is the ninth in a series of incremental build blocks. The previous block (the "current block") added dossiers (tail, operator, part), locate, part number row in case sheets, etc. Now this final brief asks to add "conflicts": a way in from the desk (reference material area) and a way in on the case sheet itself, fetching /z/api/conflicts once, keeping entries keyed by record id, marking FAA coding vs mechanic's sentence, never deciding which is right, saying 44 out of 1,757,827 where linking.

Constraints:
- Keep everything in "what works now" unchanged: part dossier figures, locate, tail dossier verbatim framing, operator dossier, setFilter, case sheet 17 rows including Part number.
- No page error at 1440 or 390.
- Phase B unchanged (sentence counts, tab strip ≤130px at 1440, 18 controls, 18 starter questions, 4 rails, 16 panels, phone layout, case sheet overlay, record stepper, aria-labels).
- No em dash or en dash anywhere in page text. The current block uses \u2014 in a comment only (CSS comment) - "on purpose \u2014 nothing here may be mistaken". Comments aren't "text you put on the page" technically, but to be safe I'll avoid em/en dashes everywhere, using plain hyphens in comments? Hyphens are fine (they're not em/en dashes). Actually "no em dash and no en dash anywhere in the text you put on the page" - so only page text. But I'll avoid \u2014 and \u2013 everywhere to be safe, including comments. Note existing code uses \u2013 in sdIsAbsentText regex - that's checking for en dash in data, fine, must keep. And \u2014 in a CSS comment; I should not lose that rule... Actually I'm replacing the block wholesale, so I control comments. The CSS comment for sd-locate contains \u2014 which is just a comment; I can rewrite with commas.
- Prefix every new name. Don't declare names the page already uses. New names: sd-conflicts CSS classes, SDCONF variables etc.

Design:

1. Fetch once: `GET /z/api/conflicts` returns `{entries[], total, what_this_is, what_this_is_not}`. Entries: `{id, tail, date, operator, field, code_says, text_says, note, discrepancy, found_at, confirmed, disputed, source}`. 44 entries keyed on record number. "keyed by record id" - build a map SDCONF.byRec[id] = entry.

2. Way in 1: From the desk. "It belongs with the reference material, not with the panels that narrow to a selection." What's the reference material on the desk? The current block hides `.card.ask`, `#znarrow`, `#khint`. Hmm. There's likely some reference area... The brief says "Say in one line what a reader will find there before they click, using the endpoint's own `what_this_is`, and do not promise more than `what_this_is_not` allows." So a link/button somewhere near reference material. Where is "the desk"? The page has hero instrument, rails, controls, starter questions... Reference material might be the "credit" section? Or maybe there's a section with cards. The current block purges `.card.land`. There's `#rr-sec` (starter questions?). Hmm.

I need to invent a placement. Given constraints, a safe approach: append a small "reference" block near the credit/foot of the page, styled like reference material. "the served desk: the word conflicts appears zero times" - meaning currently nowhere on the page mentions conflicts. Our link will add the word (that's fine; that's the new way in). Where exactly? "It belongs with the reference material". Perhaps there's an existing element with reference material... In prior blocks we don't see one explicitly. Possibly the page has cards like `.card` with class land (hidden). Hmm, `.card.land` is purged - landing cards. The "reference material" could be the citation/how-to-cite, or the "credit" paragraph.

I'll create a small block `#sd-conf-desk` placed before `.credit` (or after it) that acts as reference material: a heading like "Reference" and a line: what_this_is, with a link "Open the conflicts list". And include the caveat about 44 out of 1,757,827 near the link ("Say that where you link"). Also must not promise more than what_this_is_not allows - so if what_this_is_not is a string, show it (perhaps as smaller text). I'll render both what_this_is and what_this_is_not from the endpoint, verbatim.

But wait: fetch once and keep. The desk link opens... what? A panel? "Two ways in, both needed: 1. From the desk... 2. On the record itself." Way 1 needs to show the list of 44 entries. Way 2: in the case sheet for a record with an entry, say so with the note and code_says vs text_says.

So way 1 needs a display of all entries. Options: open a dialog/overlay listing entries; or navigate to something. The page has panels (p-*) but "It belongs with the reference material, not with the panels that narrow to a selection" - so not in the tab panels. I'll render an overlay dialog (like the case sheet overlay presumably exists). Simplest robust approach: create a fixed overlay `#sd-conf-over` with a dialog listing the 44 entries, each showing id, tail, date, operator, field, code_says (labelled "the FAA's code says"), text_says (labelled "the mechanic wrote"), note, discrepancy?, found_at, confirmed/disputed counts?, source. Keep it readable. Each entry could link to its record's case sheet? We don't know how case sheets open (some function on the page). The case sheet is opened by clicking a row presumably; there's a record stepper. I shouldn't guess a global function. I could offer a link `?...`? Risky. Keep the list informational; maybe each entry shows its record number so a reader can find it. Actually maybe I can try to open the case sheet by... unknown. Skip: list entries with their record numbers.

Hmm, but maybe entries' `id` is the record number used in case sheets. The case sheet detection (sdSheets) finds tables with "Part" and "How to cite it" rows; control number found via sdControlToken. The conflicts entry id is "the record number". For way 2, when a case sheet is open, we need to know which record it is. The sheet's control number (e.g. JR2R20260825350) - is the conflict entry id the control number or something else? "44 entries now, keyed on the record number, so one report read a hundred times is one entry". The record number likely = the control number / record id. The part dossier brief said case record via `api/case/<control>` with control like "JR2R20260825350". Entries have `id` - "keyed on the record number". I'll key by String(entry.id) and match against the case sheet's control token. Also maybe match entry.tail? Safer: match control token against entry.id; also try matching if entry.id appears anywhere in the sheet text. I'll do: lookup by control token first; if not found, check if any entry id appears in the sheet's text (as a token). Actually simpler: check both the control token and, hmm, entry.tail is tail number not record id. I'll do control token match, plus a scan: for each entry id, if sheet text contains it. That handles the case where the token extraction differs. But careful with false positives; entry ids are record numbers, distinctive. Fine.

Way 2 rendering: in the case sheet table, add a row (or a section after the table) marked clearly: heading like "A conflict on this record" with the note, and two labelled sides: "The FAA's code says: <code_says>" and "The mechanic wrote: <text_says>". Never decide which is right - present both, maybe with field name (`field`). Also `discrepancy` and `found_at` maybe. Include note verbatim. Mark it as from the conflicts reading, not a decision. Also must not use em/en dashes.

Also "If a record has no entry, the sheet says nothing at all about conflicts." So only add row/section when entry exists.

"Say that where you link, so nobody reads 44 as a count of how common this is": near the desk link: "Only 44 records have been read this way, out of 1,757,827, so an absence says nothing about the rest." Put that in the desk block.

Fetching: fetch once on load (or when desk block is created). Keep in SDCONF.entries / map. Do not fetch per sheet.

Placement of desk block: needs to exist. I'll place it right before the `.credit` element if present, else at end of main. The credit element is styled in current CSS (`.credit`), so it exists. "reference material" - I'll label the block clearly. Structure:

```
<div id="sd-conf-desk" role="region" aria-label="Reference: records where the code and the words disagree">
  <h2 class="sd-conf-h">Reference</h2>
  <p class="sd-conf-lead">{what_this_is}</p>
  <p class="sd-conf-cav">{what_this_is_not}</p>
  <p class="sd-conf-note">Only 44 of 1,757,827 records have been read this way...</p>
  <button class="sdbtn" id="sd-conf-open">Open the {n} ... </button>
</div>
```

Wait - "the word conflicts appears zero times" is a description of the current build with no way in; we're adding the way in, so the word will appear. Fine. But what should the link be called? "Records where the FAA's code and the mechanic's words disagree" - maybe avoid the jargon word "conflicts" and describe it. The endpoint name is conflicts but the reader-facing label can be descriptive. I'll use descriptive labels: "Where the code and the words disagree". Button: "Read the 44 entries".

Button label should use entry count once fetched: "Read the 44 records". Before fetch resolves, show "Reading..." or disable. Since fetch is once on boot, fine.

Overlay: `#sd-conf-over` fixed overlay with dialog. Must not break phone layout (390px). Style: max-width 720px, scrollable, close button, Escape to close, click backdrop to close. ARIA: role="dialog" aria-modal="true" aria-label. Focus close button on open; return focus.

Entries list rendering: for each entry, a card:

```
<article class="sd-conf-e">
  <header>record <b>{id}</b> · {date} · {operator} · tail {tail}</header>
  <p class="sd-conf-f">field: {field}</p>
  <div class="sd-conf-sides">
    <div class="sd-conf-side"><span class="sd-conf-lab">The FAA's code says</span><p>{code_says}</p></div>
    <div class="sd-conf-side"><span class="sd-conf-lab">The mechanic wrote</span><p>{text_says}</p></div>
  </div>
  <p class="sd-conf-note">{note}</p>
  <p class="sd-conf-meta">found in {found_at} · confirmed {confirmed} · disputed {disputed}</p>
</article>
```

Handle missing fields gracefully (skip empties). Never decide: labels are neutral attributions. Maybe add line: "One of the two is wrong; the file does not say which." That's from the brief's framing, good to include once at top of overlay: use what_this_is there too? The desk already says what_this_is. Overlay header can repeat briefly.

`confirmed` and `disputed` are presumably counts of how many times read/confirmed. Not sure semantics. I'll label neutrally: "confirmed by {confirmed} readings, disputed {disputed}"? Risky. Safer: print raw with neutral labels "confirmed: X" "disputed: Y" without interpretation. Hmm "Never present the disagreement as though the tool has decided which is right." Printing "confirmed: 3, disputed: 1" doesn't decide. I'll render as list items only if present/nonzero. Keep it minimal: field, code_says, text_says, note (brief demands note on record sheet; on list include too), found_at (where in the report it was found?), source. I'll show found_at and source as small meta.

Way 2 implementation: in sdSheets, we find case sheet tables. Add a function sdConfSheet(table) that finds control, looks up SDCONF.map, and if entry exists, ensures a row or a following section. Where to put? "say so in the sheet, with the note, and with what the codes say beside what the words say". A table row might be cramped for two sides; a section right after the table styled like the sheet, or an extra row spanning. The case sheet is "seventeen rows including Part number" - our Part number row is data-sd-pnrow added row, making rows include it. If I add another row, the count changes to eighteen... "What works now, measured, and must not be lost: case sheet: seventeen rows including Part number". Hmm - the case sheet has 17 rows including Part number (our added row presumably counted). If I add another row it becomes 18, violating "must not be lost"? The requirement says everything in "what works now" unchanged. Adding a conflict row changes row count. Safer: add a section/aside AFTER the table (not a row), so the sheet table still has seventeen rows including Part number. But "say so in the sheet" - a panel directly attached to the sheet, immediately below the table, is "in the sheet" enough. I'll insert a div right after the table (or after the .wu wrapper) marked clearly. Actually the sheet is probably an overlay containing a table. Insert after table within same container.

But caution: sdLocCollect reads .wu text for locate; our conflict section is not .wu, fine. sdFindControl clones table and skips data-sd-pnrow and "How to cite it" rows; our conflict block is outside the table so no interference. Good.

Markup:

```
<div class="sd-conf-sheet" data-sd-confout="1" role="region" aria-label="A conflict recorded on this record">
  <h3 class="sd-conf-sh">A conflict is recorded on this record</h3>
  <p class="sd-conf-sf">Field <b>{field}</b>. The two readings:</p>
  <div class="sd-conf-sides">
    <div class="sd-conf-side sd-conf-code"><span>The FAA's code says</span><p>{code_says}</p></div>
    <div class="sd-conf-side sd-conf-words"><span>The mechanic wrote</span><p>{text_says}</p></div>
  </div>
  <p class="sd-conf-note">{note}</p>
  <p class="sd-conf-und">The file does not say which side is right; this page does not decide it either.</p>
</div>
```

Include discrepancy? The entry has `discrepancy` field - maybe a description. If present include. And found_at, source in small meta. Keep.

Styling must match the page's look: var(--line), var(--card), var(--ink), var(--ash), var(--rust), Georgia serif for sentences, IBM Plex Mono for figures, Archivo for labels. Amber/dashed for model readings was used for locate; conflicts are not model readings, they're curated readings. Maybe use the rust accent. I'll use a neutral card with rust left border, similar to sd-d-sec.

Also, in the overlay entry list and sheet, no em/en dashes: use commas, colons, middots? Middle dot \u00b7 is fine (not a dash). Existing code uses \u00b7. Keep.

Also "Mark plainly which side is the FAA's coding and which is the mechanic's sentence." Done via labels.

Data fetch: 

```
var SDCONF={fetched:false,entries:[],map:{},total:0,whatIs:"",whatNot:"",note:"",busy:false};
function sdConfFetch(){
  if(SDCONF.fetched||SDCONF.busy)return;
  SDCONF.busy=true;
  fetch("/z/api/conflicts").then(r=>{if(!r.ok)throw 0;return r.json()}).then(function(j){
    SDCONF.busy=false;SDCONF.fetched=true;
    var es=(j&&Array.isArray(j.entries))?j.entries:[];
    SDCONF.entries=es;
    SDCONF.total=(j&&j.total!=null)?sdNum(j.total):es.length;
    SDCONF.whatIs=(j&&j.what_this_is)?String(j.what_this_is):"";
    SDCONF.whatNot=(j&&j.what_this_is_not)?String(j.what_this_is_not):"";
    var m={},i,e;
    for(i=0;i<es.length;i++){e=es[i];if(e&&e.id!=null)m[String(e.id).trim()]=e}
    SDCONF.map=m;
    kick();
  }).catch(function(){SDCONF.busy=false;SDCONF.fetched=true;SDCONF.failed=true;kick();});
}
```

Call sdConfFetch() once at boot (after pass initial). "Fetch the entries once and keep them." Yes.

Desk block: function sdConfDesk() creates/updates #sd-conf-desk. Placement: before .credit. If credit absent, append to main. Update button label with count. Render what_this_is and what_this_is_not verbatim as textContent (set via spans to avoid re-render churn; but kick loop re-renders... use signature check like sdLocRender to avoid resetting). I'll build once, then update only text nodes when changed.

The desk copy: 
- kicker: "Reference"
- what_this_is verbatim.
- what_this_is_not verbatim, prefixed maybe "It is not:" hmm, what_this_is_not might already be a sentence like "This is not a list of accidents". To not promise more, I'll just print it after what_this_is, styled as a caveat. Maybe prefix "Not this:" ... The endpoint's field is a sentence presumably standalone. I'll print it as its own line, smaller, no invented prefix? Adding no prefix is safest. But visually distinguish with a "caveat" style. I'll wrap in a <p> with class; textContent verbatim.
- coverage caveat: "Only 44 of the 1,757,827 records in the file have been read this way. A record without an entry here has not been checked, so the 44 say nothing about how often the file disagrees with itself." Wait, but 44 is dynamic: use entries length / SDCONF.total. total is probably 44 (entries count) or maybe total reports? "GET /z/api/conflicts {entries[], total, ...}" - total likely = number of entries. I'll use entries.length for count and total as fallback. The file total 1,757,827 is known from the page. Include: "Only {n} of the 1,757,827 records in this file have been read this way, so a record with no entry has not been checked, not cleared."
- Button: "Read the {n} entries".

Overlay: function sdConfOpen()/sdConfClose(). Build list from entries. Also each entry maybe could open its record's case sheet? Not required; skip.

But: should the desk block render even before fetch completes? Yes, create skeleton, fill when data arrives. If fetch fails: show "The list did not answer. Nothing is shown rather than something wrong." consistent with page's tone.

Way 2: function sdConfSheets() runs in pass; for each sheet table found (reuse sdSheets()), find control via sdFindControl(table), look up entry, insert/update/remove the section after the table. Use data attr data-sd-confout on the section to find existing. If no entry: remove any existing section (shouldn't happen but safe? "If a record has no entry, the sheet says nothing at all about conflicts." Ensure removal if control changes; the overlay content changes per record, so yes remove stale).

Wait: does sdSheets get called for the case sheet only when open? sdSheets scans all tables for Part + "How to cite it" rows. Our sdPartRow already uses it. I'll piggyback: in pass, after sdPartRow, call sdConfStep which iterates sdSheets() and for each does conflict lookup.

Entry lookup: map by id. The control token from the sheet, e.g. "JR2R20260825350". Entry id presumably same. Also, entries have tail/date/operator; could cross-check but not necessary.

Edge: entry.id might be numeric-ish string different from control. Add fallback: scan sheet text for any entry id. Implement sdConfForSheet(table): 
```
var ctl=sdFindControl(table);
if(ctl&&SDCONF.map[ctl])return SDCONF.map[ctl];
var txt=table.textContent||"";
for id in map: if(id.length>=6&&txt.indexOf(id)>=0) return map[id];
return null;
```
Hmm scanning all 44 ids over sheet text each pass: fine (44 indexOf on small string).

But careful: the fallback could match the sheet's own citation row containing the record id... which is exactly what we want (the record id appears in citation). OK.

Insert position: after the table. `table.insertAdjacentElement("afterend", sec)` but ensure not duplicated; check table.nextElementSibling with data-sd-confout. Actually the case sheet overlay might re-render the table each open; our section after the table will be removed with it. Fine, we re-add each pass.

But wait: will inserting a div after the table inside the overlay break "the case sheet overlay" requirement? It says case sheet overlay must still exist; adding a section inside it is the required feature. Fine.

Also "with what the codes say beside what the words say": side-by-side at wide widths, stacked on phone via flex-wrap.

Now the "no em dash / en dash" rule: check all my strings. Use \u2019 for apostrophes? Fine, apostrophes aren't dashes. Use \u00b7 middots. Avoid \u2014/\u2013 and literal — – . I'll be careful. In comments too, avoid.

Also "Prefix every new name. Do not declare a name the page already uses." New globals: SDCONF, functions prefixed sdConf*. CSS ids/classes prefixed sd-conf. Also careful not to reuse existing ids.

Now, must keep ALL previous functionality: I should return the entire block = previous CSS + new CSS, previous JS + new JS. That's a big output. The JS is ~large; I'll reproduce it fully with additions. Need to be careful to not lose anything. This will be long but necessary.

Let me also double-check where the desk block goes: "It belongs with the reference material". The page's reference material... In the visible block I see `.credit` styling. There might be a footer area with "How to cite it" in case sheets. The safest: place the desk block immediately before the `.credit` paragraph at the foot of the page, styled as a bordered reference card. If multiple .credit, use first. If none, append to main.wrap end.

Also: could there be an existing "reference" section? Unknown. I'll go with near credit.

One more consideration: "Say in one line what a reader will find there before they click, using the endpoint's own what_this_is". So the one line = what_this_is verbatim. Good.

"do not promise more than what_this_is_not allows" - print what_this_is_not too. Good.

Now the overlay list detail per entry. Fields: id, tail, date, operator, field, code_says, text_says, note, discrepancy, found_at, confirmed, disputed, source. I'll show:

- head line: "Record {id}" + date + operator + tail (each if present), middot separators.
- field line: "Field: {field}" (mono).
- sides: code_says labelled "The FAA's code says", text_says labelled "The mechanic wrote". Present as quotes? text_says is the sentence; render as serif quote. code_says mono.
- discrepancy: if present, line "Discrepancy: ..." hmm - maybe discrepancy is the description of the mismatch. Print with label "What does not agree" - or just print verbatim as a paragraph labelled "Discrepancy". I'll use "Recorded discrepancy:"? Simpler: label "Discrepancy". It's the endpoint's own word.
- note: italic note.
- found_at: "Found in: {found_at}" (maybe a section of the report like the narrative). Print as meta.
- confirmed/disputed: numbers; print "readings confirming: X, disputing: Y"? Unverified semantics. Hmm. Maybe confirmed/disputed are booleans? Could be counts or flags. Handle both: if boolean, show "confirmed" tag; if number >0 show count. I'll write a helper: if value is a number and >0 -> "confirmed by N" ... risky. Safer to present raw: "confirmed: 3" with mono, no verbs. Actually to minimize invented meaning, I'll show them as small mono stats: "confirmed {v}" / "disputed {v}" only when truthy. That just mirrors field names. OK.
- source: "Source: {source}".

Also overlay top: repeat what_this_is? Already on desk. Overlay header: "Where the code and the words disagree" + count + the undecidable line: "One of the two is wrong. The file does not say which, and this page does not decide." Plus caveat about 44 of 1,757,827.

Keyboard: Escape closes. Focus management: store lastFocus, focus dialog close btn.

Also `aria-modal`. And prevent body scroll? Maybe not necessary; keep simple with overflow auto and max-height.

Now integrate into pass(): add try{sdConfDesk()}catch, try{sdConfStep()}catch, and start fetch once at boot. Also MutationObserver kick handles re-render.

Also the sentence "the word conflicts appears zero times" - after our change it appears; fine.

Let me also make sure removing stale sheet section: in sdConfStep, for each sheet, compute entry; find existing section among table's siblings `[data-sd-confout]`; if entry null -> remove; if entry -> update/replace if signature changed. Simplest: build HTML string with signature = entry.id; if existing section's dataset.sdSig !== entry.id + textVersion, replace innerHTML. I'll do: if none, create; else if sig differs, replace content.

Careful: sdFindControl skips rows with data-sd-pnrow and "How to cite it" row. Our conflict section is outside table. Good.

Also must not break sdLocCollect: it reads .wu inside td; conflict section after table not inside td. Good.

Also "No page error at 1440 or 390": overlay responsive: max-width min(720px, calc(100vw - 32px)).

Tab strip ≤130px etc: we add nothing to tabs. 18 controls: we add a button in desk block, not in #sdControls. Fine. Starter questions, rails, panels untouched.

The aria-labels requirement: add aria-labels on new regions.

Now write the CSS additions:

```css
/* sd-conf: records where the FAA's coded fields and the mechanic's own
   words do not agree. A reference block on the desk, an overlay with the
   entries, and a section inside a case sheet whose record has an entry. */
#sd-conf-desk{max-width:1140px;margin:18px auto 0;padding:12px 16px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px;font-size:13px;line-height:1.55;color:var(--ink)}
#sd-conf-desk .sd-conf-kick{font:600 10px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);margin:0 0 6px}
#sd-conf-desk .sd-conf-lead{font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-conf-desk .sd-conf-not{font-size:12px;color:#6b6560;margin:6px 0 0}
#sd-conf-desk .sd-conf-cov{font-size:12px;color:#7a5b00;margin:6px 0 0}
#sd-conf-desk .sd-conf-row{margin:10px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
#sd-conf-over{position:fixed;inset:0;z-index:80;background:rgba(29,29,31,.44);display:flex;align-items:flex-start;justify-content:center;padding:4vh 14px;overflow:auto}
#sd-conf-over[hidden]{display:none}
.sd-conf-dlg{background:var(--paper,#fff);border:1px solid var(--line);border-radius:6px;max-width:760px;width:100%;padding:16px 18px 18px;box-shadow:0 10px 30px rgba(29,29,31,.18)}
.sd-conf-dlg .sd-conf-h{font-family:'Instrument Serif',Georgia,serif;font-size:24px;line-height:1.15;color:var(--ink);margin:0}
.sd-conf-dlg .sd-conf-sub{font-size:12px;color:#6b6560;margin:6px 0 0}
.sd-conf-dlg .sd-conf-und{font:italic 14px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:10px 0 0}
.sd-conf-x{position:...}
```

Close button: place in header row flex.

Entry card:

```css
.sd-conf-e{margin:12px 0 0;padding:10px 12px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
.sd-conf-e .sd-conf-eh{font:600 11px/1.4 'IBM Plex Mono',ui-monospace,monospace;color:var(--ink);margin:0}
.sd-conf-e .sd-conf-eh .sd-conf-dim{color:var(--ash);font-weight:400}
.sd-conf-e .sd-conf-fld{font:11.5px/1.4 'IBM Plex Mono',...;color:#5c554c;margin:4px 0 0}
.sd-conf-sides{display:flex;gap:8px 16px;flex-wrap:wrap;margin:8px 0 0}
.sd-conf-side{flex:1 1 260px;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:var(--paper,#fff)}
.sd-conf-side .sd-conf-lab{display:block;font:600 9.5px/1.3 Archivo,...;letter-spacing:.09em;text-transform:uppercase;color:var(--ash);margin:0 0 4px}
.sd-conf-side.sd-conf-code p{font:12.5px/1.5 'IBM Plex Mono',...;color:var(--ink);margin:0}
.sd-conf-side.sd-conf-words p{font:15px/1.55 Georgia,...;color:var(--ink);margin:0}
.sd-conf-e .sd-conf-note{font:italic 13px/1.5 Georgia,...;color:#7a5b00;margin:8px 0 0}
.sd-conf-e .sd-conf-disc{font-size:12.5px;color:var(--ink);margin:8px 0 0}
.sd-conf-e .sd-conf-meta{font-size:11.5px;color:#6b6560;margin:6px 0 0;word-break:break-word}
```

Sheet section reuses .sd-conf-e styles but as its own class .sd-conf-sheet with same styling; or just reuse class sd-conf-e plus an extra class. I'll give the sheet section class "sd-conf-e sd-conf-sheet" and margin adjust: `.sd-conf-sheet{margin:10px 0 0}`.

Labels in sheet: "The FAA's code says" / "The mechanic wrote". Same components. Also add a small heading "A conflict is recorded on this record" and the undecidable line.

Also focus style for close button etc.

Now JS additions in detail.

Place new section before "pass" definition. Add functions:

```js
/* ============ sd-conf: the FAA's coded fields and the mechanic's own words
   do not always agree. Fetched once, kept, keyed by record id. Two ways in:
   a reference block on the desk, near the credit, and a section inside a
   case sheet whose record has an entry. The tool never decides which side
   is right: both are shown, each labelled with whose words they are. ====== */
var SDCONF={fetched:false,busy:false,failed:false,entries:[],map:{},whatIs:"",whatNot:"",open:false,lastFocus:null};
function sdConfFetch(){...}
function sdConfCount(){return SDCONF.entries.length||SDCONF.total...}
```

Wait, keep a `total` variable. j.total.

sdConfFetch:

```js
function sdConfFetch(){
  if(SDCONF.fetched||SDCONF.busy)return;
  SDCONF.busy=true;
  sdGetJSON("conflicts").then(function(j){
    SDCONF.busy=false;SDCONF.fetched=true;
    var es=(j&&Array.isArray(j.entries))?j.entries:[];
    var m={},i,e;
    for(i=0;i<es.length;i++){
      e=es[i];
      if(e&&e.id!=null&&String(e.id).trim()!=="")m[String(e.id).trim()]=e;
    }
    SDCONF.entries=es;
    SDCONF.map=m;
    SDCONF.total=(j&&j.total!=null)?sdNum(j.total):es.length;
    SDCONF.whatIs=(j&&j.what_this_is!=null)?String(j.what_this_is):"";
    SDCONF.whatNot=(j&&j.what_this_is_not!=null)?String(j.what_this_is_not):"";
    kick();
  }).catch(function(){
    SDCONF.busy=false;SDCONF.fetched=true;SDCONF.failed=true;kick();
  });
}
```

Note sdGetJSON is defined later in file (function declaration hoisted within IIFE - yes, function declarations hoist). sdConfFetch is called at boot; sdGetJSON declared later but hoisted. Fine. Actually I'll place the sd-conf section after sdGetJSON's definition anyway (it's mid-file). Order in file: I'll insert the sd-conf block right after the sd-locate section, before pass(). sdGetJSON is defined earlier (in sd-dossier section). Fine.

Helper to build sides HTML shared by list and sheet:

```js
function sdConfSides(e){
  var code=(e.code_says==null)?"":String(e.code_says).trim();
  var words=(e.text_says==null)?"":String(e.text_says).trim();
  return '<div class="sd-conf-sides">'
    +'<div class="sd-conf-side sd-conf-code"><span class="sd-conf-lab">The FAA\u2019s code says</span><p>'+sdEsc(code||":")+'</p></div>'
    +'<div class="sd-conf-side sd-conf-words"><span class="sd-conf-lab">The mechanic wrote</span><p>'+sdEsc(words||":")+'</p></div>'
    +'</div>';
}
```

Hmm empty sides: print ":" placeholder? Better skip empty side. But brief: mark both sides plainly; if missing, show what exists. I'll include side only if text present; if both missing, show a line "The entry records a disagreement but carries neither wording." Keep simple:

```js
function sdConfSides(e){
  var code=..., words=...;
  if(!code&&!words)return '<p class="sd-conf-meta">The entry carries no wording for either side.</p>';
  var h='<div class="sd-conf-sides">';
  if(code)h+='<div class="sd-conf-side sd-conf-code"><span class="sd-conf-lab">The FAA\u2019s code says</span><p>'+sdEsc(code)+'</p></div>';
  if(words)h+='<div class="sd-conf-side sd-conf-words"><span class="sd-conf-lab">The mechanic wrote</span><p>'+sdEsc(words)+'</p></div>';
  return h+'</div>';
}
```

Meta line builder:

```js
function sdConfMeta(e){
  var bits=[],v;
  v=(e.found_at!=null)?String(e.found_at).trim():"";
  if(v)bits.push("found in: "+v);
  v=(e.discrepancy!=null)?String(e.discrepancy).trim():"";
  if(v)bits.push("discrepancy: "+v);
  ...
}
```

Hmm discrepancy might be long; put it as its own paragraph labelled. Let me structure entry card:

```js
function sdConfEntry(e,inSheet){
  var parts=[],v;
  parts.push('<p class="sd-conf-eh">record '+sdEsc(e.id==null?"":String(e.id))+'</p>');
  var hl=[];
  v=(e.date!=null)?String(e.date).trim():"";if(v)hl.push(sdEsc(v));
  v=(e.operator!=null)?String(e.operator).trim():"";if(v)hl.push("operator "+sdEsc(v));
  v=(e.tail!=null)?String(e.tail).trim():"";if(v)hl.push("tail "+sdEsc(v));
  if(hl.length)parts.push('<p class="sd-conf-fld">'+hl.join(' \u00b7 ')+'</p>');
  v=(e.field!=null)?String(e.field).trim():"";
  if(v)parts.push('<p class="sd-conf-fld">field: '+sdEsc(v)+'</p>');
  parts.push(sdConfSides(e));
  v=(e.discrepancy!=null)?String(e.discrepancy).trim():"";
  if(v)parts.push('<p class="sd-conf-disc">'+sdEsc(v)+'</p>');
  v=(e.note!=null)?String(e.note).trim():"";
  if(v)parts.push('<p class="sd-conf-note">'+sdEsc(v)+'</p>');
  var meta=[];
  v=(e.found_at!=null)?String(e.found_at).trim():"";if(v)meta.push("found in "+v);
  if(e.confirmed!=null&&e.confirmed!==""&&e.confirmed!==0&&e.confirmed!==false)meta.push("confirmed: "+sdEsc(String(e.confirmed)));
  if(e.disputed!=null&&e.disputed!==""&&e.disputed!==0&&e.disputed!==false)meta.push("disputed: "+sdEsc(String(e.disputed)));
  v=(e.source!=null)?String(e.source).trim():"";if(v)meta.push("source: "+v);
  if(meta.length)parts.push('<p class="sd-conf-meta">'+meta.join(' \u00b7 ')+'</p>');
  if(!inSheet)parts.push('<p class="sd-conf-meta">One of the two readings is wrong. The file does not say which, and nothing here decides it.</p>');
  return parts.join("");
}
```

Wait: putting the "does not decide" line on every entry card is repetitive but honest; the brief emphasizes never presenting as decided. Once at top of overlay is enough + on sheet. I'll put it once in overlay sub and once in sheet, not per entry. Remove per-entry.

Desk block:

```js
function sdConfDesk(){
  var host=document.querySelector(".credit");
  var d=byId("sd-conf-desk");
  if(!d){
    d=document.createElement("section");
    d.id="sd-conf-desk";
    d.setAttribute("role","region");
    d.setAttribute("aria-label","Reference: records where the coded fields and the written words do not agree");
    d.innerHTML='<p class="sd-conf-kick">Reference</p>'
      +'<p class="sd-conf-lead" data-sd-confis></p>'
      +'<p class="sd-conf-not" data-sd-confnot hidden></p>'
      +'<p class="sd-conf-cov" data-sd-confcov hidden></p>'
      +'<div class="sd-conf-row"><button type="button" class="sdbtn" id="sd-conf-open">Reading the entries\u2026</button></div>';
    if(host&&host.parentNode)host.parentNode.insertBefore(d,host);
    else (document.querySelector("main.wrap")||document.body).appendChild(d);
    d.addEventListener("click",function(e){
      if(e.target&&e.target.id==="sd-conf-open"){e.preventDefault();sdConfOpen();}
    });
  }
  var lead=d.querySelector("[data-sd-confis]");
  var notp=d.querySelector("[data-sd-confnot]");
  var cov=d.querySelector("[data-sd-confcov]");
  var btn=byId("sd-conf-open");
  var n=SDCONF.entries.length;
  var sig="f"+SDCONF.fetched+"n"+n+"w"+SDCONF.whatIs+"x"+SDCONF.whatNot;
  if(d.dataset.sdSig===sig)return;
  d.dataset.sdSig=sig;
  if(SDCONF.failed){
    lead.textContent="The list of disagreements did not answer. Nothing is shown rather than something wrong.";
    notp.hidden=true;cov.hidden=true;
    if(btn){btn.disabled=true;btn.textContent="Not available"}
    return;
  }
  if(!SDCONF.fetched){
    lead.textContent="Reading the file\u2019s disagreements\u2026";
    return;
  }
  lead.textContent=SDCONF.whatIs||("Entries for records where the FAA\u2019s coded fields and the mechanic\u2019s own words do not agree.");
  if(SDCONF.whatNot){notp.hidden=false;notp.textContent=SDCONF.whatNot}
  if(n){
    cov.hidden=false;
    cov.textContent="Only "+sdFmt(n)+" of the 1,757,827 records in this file have been read this way. A record with no entry has not been checked, not cleared.";
    if(btn){btn.disabled=false;btn.textContent="Read the "+sdFmt(n)+" entries"}
  }
}
```

Hmm the coverage sentence must appear "where you link". Good. But wait: what if total in response is number of entries (44)? We use entries.length anyway. If entries empty but total>0? Then use total for count: `var n=SDCONF.entries.length||SDCONF.total;` Use that.

Also note: fetch happens at boot; the desk says "Reading..." briefly then updates. Fine.

Overlay:

```js
function sdConfOpen(){
  var ov=byId("sd-conf-over");
  if(!ov){
    ov=document.createElement("div");
    ov.id="sd-conf-over";
    ov.setAttribute("role","dialog");
    ov.setAttribute("aria-modal","true");
    ov.setAttribute("aria-label","Entries where the code and the words disagree");
    ov.innerHTML='<div class="sd-conf-dlg" role="document">'
      +'<div class="sd-conf-top"><h2 class="sd-conf-h">Where the code and the words disagree</h2>'
      +'<button type="button" class="sd-conf-x" aria-label="Close">Close</button></div>'
      +'<p class="sd-conf-und">One of the two readings on each entry is wrong. The file does not say which, and nothing here decides it.</p>'
      +'<div class="sd-conf-list" data-sd-conflist></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click",function(e){
      if(e.target===ov||(e.target&&e.target.closest&&e.target.closest(".sd-conf-x"))){e.preventDefault();sdConfClose()}
    });
    document.addEventListener("keydown",sdConfKey);
  }
  sdConfFill(ov.querySelector("[data-sd-conflist]"));
  ov.hidden=false;
  SDCONF.lastFocus=document.activeElement;
  var x=ov.querySelector(".sd-conf-x");
  if(x)try{x.focus()}catch(_){}
}
function sdConfKey(e){if(e.key==="Escape"){var ov=byId("sd-conf-over");if(ov&&!ov.hidden)sdConfClose()}}
function sdConfClose(){
  var ov=byId("sd-conf-over");
  if(ov)ov.hidden=true;
  if(SDCONF.lastFocus&&SDCONF.lastFocus.focus)try{SDCONF.lastFocus.focus()}catch(_){}
}
function sdConfFill(list){
  if(!list)return;
  var n=SDCONF.entries.length,i,h="";
  if(SDCONF.failed)h='<p class="sd-conf-meta">The list did not answer. Nothing is shown rather than something wrong.</p>';
  else if(!SDCONF.fetched)h='<p class="sd-conf-meta">Reading\u2026</p>';
  else if(!n)h='<p class="sd-conf-meta">The endpoint answered with no entries.</p>';
  else for(i=0;i<n;i++)h+='<article class="sd-conf-e">'+sdConfEntry(SDCONF.entries[i],false)+'</article>';
  if(list.dataset.sdSig!=="v"+n+String(SDCONF.failed)){list.dataset.sdSig="v"+n+String(SDCONF.failed);list.innerHTML=h}
}
```

Hmm sig: include fetched state. Fine.

Sheet section:

```js
function sdConfForSheet(table){
  if(!SDCONF.fetched||!SDCONF.entries.length)return null;
  var ctl=sdFindControl(table);
  if(ctl&&SDCONF.map[ctl])return SDCONF.map[ctl];
  var txt=table.textContent||"";
  if(!txt)return null;
  for(var id in SDCONF.map){
    if(id.length>=6&&txt.indexOf(id)>=0)return SDCONF.map[id];
  }
  return null;
}
function sdConfStep(){
  var sheets=sdSheets(),i,e,table,sec;
  for(i=0;i<sheets.length;i++){
    table=sheets[i].table;
    e=sdConfForSheet(table);
    sec=table.parentNode?table.parentNode.querySelector("[data-sd-confout]"):null;
    /* only the section that belongs to this table */
    if(sec&&sec.previousElementSibling!==table)sec=null;
    if(!e){
      if(sec&&sec.parentNode)sec.parentNode.removeChild(sec);
      continue;
    }
    var sig=String(e.id==null?"":e.id);
    if(sec&&sec.getAttribute("data-sd-sig")===sig)continue;
    if(!sec){
      sec=document.createElement("div");
      sec.className="sd-conf-e sd-conf-sheet";
      sec.setAttribute("data-sd-confout","1");
      sec.setAttribute("role","region");
      sec.setAttribute("aria-label","A conflict is recorded on this record");
      if(table.parentNode)table.parentNode.insertBefore(sec,table.nextSibling);
      else continue;
    }
    sec.setAttribute("data-sd-sig",sig);
    sec.innerHTML='<p class="sd-conf-sh">A conflict is recorded on this record</p>'
      +sdConfEntry(e,true)
      +'<p class="sd-conf-und">The file does not say which side is right, and nothing here decides it.</p>';
  }
}
```

Wait, "sec=table.parentNode.querySelector" might find a section belonging to a different table if multiple sheets... unlikely (one overlay). Use nextElementSibling check as above. Also if sec exists but its previous sibling isn't the table, ignore and create new? Could duplicate. Simpler: check table.nextElementSibling for data-sd-confout. If present reuse, else create inserted after table.

Careful: table.nextElementSibling might be the .sd-loc? No, loc marks are inside td. Might be whitespace text node; nextElementSibling skips those. OK:

```js
sec=table.nextElementSibling;
if(!(sec&&sec.getAttribute&&sec.getAttribute("data-sd-confout")==="1"))sec=null;
```

Add CSS for .sd-conf-sh and .sd-conf-top/.sd-conf-x.

Also the sheet heading style: mono/Archivo uppercase small like other headings:
`.sd-conf-sheet .sd-conf-sh{font:600 10.5px/1.2 Archivo,...;letter-spacing:.1em;text-transform:uppercase;color:#7a5b00;margin:0 0 6px}` Use amber? Conflicts are curated, not model output. Use rust: color var(--rust-text,#b8431f)? The sd-d-sec h3.sd-mine uses #7a5b00 for model-written summaries. Conflicts are "ours" reading too (someone read the reports). I'll use the amber/brown for ours, consistent. Actually keep simple: use var(--ash) like other h3? I'll use #7a5b00 to mark it as this page's own reading.

Wait: should the sheet conflict section carry "read by a model"? No. It's a curated record. Fine.

Escape: I add a document keydown listener for Escape permanently once overlay created. OK.

Boot: call sdConfFetch() once at startup (in initial pass or right after). I'll call it in the startup section: after pass(); call sdConfFetch() in both readyState branches, or simply at module level near sdEnsureGlobals() call. Module-level fetch fires immediately, fine, page runs on /z/. Call `sdConfFetch()` right after sdEnsureGlobals();. But sdGetJSON fetches "/z/api/..." - correct endpoint "conflicts".

In pass(), add:
```
try{sdConfDesk()}catch(e){}
try{sdConfStep()}catch(e){}
```
Order: desk before mirror fine.

Also MutationObserver loop safety: sdConfDesk uses sig to avoid DOM churn; sdConfStep uses sig per entry id; overlay fill sig'd. The section innerHTML set once per sig. kick triggered by our own DOM changes → pass runs → sig checks stop churn. Good.

One concern: sdSheets() requires rows with "Part" and "How to cite it" labels. The case sheet overlay presumably matches. OK.

Another: "the sheet says nothing at all about conflicts" when no entry: our step removes any stale section. Good.

Also mustn't break the seventeen-rows count: section outside table. Good.

Check no em/en dashes in any string I add: I'll scan. Use "\u00b7" middots, commas, colons. Avoid "—", "–", "\u2014", "\u2013" in new text. Also existing CSS comment had \u2014; I'll rewrite comments with commas/hyphens (hyphen-minus is fine).

Also in the existing code there's `sdIsAbsentText` regex with \u2013 (en dash) - it's matching data, not page text; keep as is. And \u2014 appears in the CSS comment for sd-locate: "Amber, dashed and serif on purpose \u2014 nothing here may be mistaken for..." That's a comment, not page text, but instruction says "no em dash and no en dash anywhere in the text you put on the page" - comments aren't on the page. Still, I'll rewrite it with a comma to be safe since I'm re-emitting the whole block.

Also the JS comment in sd-dossier: "the panel holds one subject at a time — a tail number" — literal em dash in a comment. I'll replace with ":" or ",". Let me scan all comments for — characters: 
- sd-dossier comment: "one subject at a time — a tail number, an operator code, or a part." → replace with ":".
- sd-locate CSS comment \u2014 → comma.
- sd-mark comment: "opens the part dossier : with the number only" already uses colon. OK.
Others: check "the model's reading" comments fine.

Now, also update the pass() function to include new steps and keep everything else identical.

Also `sdConfFetch` uses sdGetJSON before its lexical definition but function declarations hoist — sdGetJSON is a function declaration inside the same IIFE, so hoisted. Good. But sdConfFetch called at module init right after sdEnsureGlobals() which is before sdGetJSON's declaration in source — still fine due to hoisting (sdGetJSON is declared with `function`). Yes.

But SDCONF var must be declared before sdConfFetch runs — I'll place the whole sd-conf section before the `sdEnsureGlobals();` call? sdEnsureGlobals is called early (right after its definition, mid-file). The sd-conf var section placed after sd-partrow/sd-dossier... Let me place sd-conf section right before the sd-locate section, and call sdConfFetch() at the bottom boot area (after pass definitions), not at sdEnsureGlobals point. Simpler: call sdConfFetch() in the initial pass()? pass runs on rAF/DOMContentLoaded; calling fetch there risks multiple calls if kick before fetched flag set — guarded by SDCONF.busy/fetched flags set synchronously. I'll call sdConfFetch() inside pass() first line area: `try{sdConfFetch()}catch(e){}` — safe, fetch-once guaranteed.

Also keep `window.__sderrs` etc.

Now, "Prefix every new name": all new: SDCONF, sdConfFetch, sdConfDesk, sdConfOpen, sdConfClose, sdConfKey, sdConfFill, sdConfEntry, sdConfSides, sdConfForSheet, sdConfStep. CSS: #sd-conf-desk, #sd-conf-over, .sd-conf-*, data-sd-confout, data-sd-confis, data-sd-confnot, data-sd-confcov, data-sd-conflist, data-sd-sig (hmm data-sd-sig also used by sd-locsum with setAttribute("data-sd-sig",sig). Reusing the attribute name on different elements is fine, not a name collision. But to be tidy use data-sd-csig for desk/section. I'll use data-sd-csig.

Check id collisions: sd-conf-open, sd-conf-over, sd-conf-desk new.

The overlay z-index: case sheet overlay z-index unknown; pick high e.g. 999? The existing overlay might be lower. Use z-index: 60? Unknown. I'll use a large value like 2147483000? Too aggressive could cover devtools... fine, use 9999? If case sheet overlay uses, say, 50, 999 works. I'll set z-index:999.

Also on phone (390px): overlay padding small, dialog width 100%. sides stack via flex-wrap with flex-basis 100% under 700px:
`@media(max-width:700px){.sd-conf-side{flex-basis:100%}}`.

Desk at phone: fine.

Now also "Say that where you link, so nobody reads 44 as a count of how common this is." Also maybe add the same caveat in the overlay header sub. I'll add to overlay sub: "Only these 44 of the 1,757,827 records in the file have been read this way." with count dynamic? Overlay built once; fill count dynamically in sdConfFill via a span. I'll include in the und paragraph? Keep overlay header: h2, sub line with count: `<p class="sd-conf-sub" data-sd-confsub></p>` updated in fill: "44 entries, read one by one out of the 1,757,827 records in the file. A record without an entry has not been checked." Good.

Now write out full CSS. I must reproduce previous CSS exactly (minus em-dash comment tweak) plus additions. And full JS with additions and modified pass() and boot.

Let me also double check sdSheets-based flows remain: yes untouched.

One more requirement: "On the record itself... with the note, and with what the codes say beside what the words say." Done. Also maybe include the `field` in sheet: yes via sdConfEntry.

Also entry `discrepancy` — printed.

Now, the desk: "It belongs with the reference material, not with the panels that narrow to a selection." I'm placing near .credit at page foot. Is .credit "reference material"? It's the credits line. Hmm. Maybe better anchor: there might be a footer with citation. I'll anchor before the first `.credit`, which presumably sits at the very end of main. That's a reasonable "reference material" spot and safe. I'll also add a heading "Reference" kicker. Good enough.

Write the code now, carefully reproducing everything.

Also check: in pass(), original order preserved plus new calls appended after sdDossierKick: add sdConfDesk and sdConfStep. And add sdConfFetch call.

Also note the existing `pass()` has try/catch for each — I'll add two more lines.

Overlay hidden attribute + CSS `#sd-conf-over[hidden]{display:none!important}` since display:flex overrides hidden. Yes needed.

Escape listener added once when overlay created.

Also ensure the overlay doesn't trap focus required? Not required.

Let me now also double check sdConfEntry for the sheet: includes "record {id}" line; in the sheet the reader already knows the record; keep but fine, or omit id in sheet? Keep; harmless and shows which entry matched. Good for trust.

Now assemble final answer: one CSS block, one JS block.

CSS full:

I'll copy the existing CSS, adjusting:
- sd-locate comment: replace \u2014 with a comma.
- sd-dossier JS comment: that's JS. In CSS comments: `/* sd-locate: ... on purpose \u2014 nothing here... */` → "on purpose, nothing here...".

Add new CSS section at end:

```css
/* sd-conf: records where the FAA's coded fields and the mechanic's own
   words do not agree. The reference block on the desk, the overlay with the
   entries, and the section a case sheet gains when its record has an entry.
   Both sides are always labelled with whose words they are; nothing here
   decides which side is right. */
#sd-conf-desk{max-width:1140px;margin:18px auto 0;padding:12px 16px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
#sd-conf-desk .sd-conf-kick{font:600 10px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);margin:0 0 6px}
#sd-conf-desk .sd-conf-lead{font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-conf-desk .sd-conf-not{font-size:12px;line-height:1.5;color:#6b6560;margin:6px 0 0}
#sd-conf-desk .sd-conf-cov{font-size:12px;line-height:1.5;color:#7a5b00;margin:6px 0 0}
#sd-conf-desk .sd-conf-row{margin:10px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
#sd-conf-over{position:fixed;inset:0;z-index:999;background:rgba(29,29,31,.44);display:flex;align-items:flex-start;justify-content:center;padding:4vh 14px 6vh;overflow:auto}
#sd-conf-over[hidden]{display:none!important}
.sd-conf-dlg{background:var(--paper,#fff);border:1px solid var(--line);border-top:3px solid var(--rust);border-radius:6px;max-width:760px;width:100%;padding:14px 18px 18px;box-shadow:0 12px 32px rgba(29,29,31,.2)}
.sd-conf-top{display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}
.sd-conf-h{font-family:'Instrument Serif',Georgia,serif;font-size:26px;line-height:1.15;color:var(--ink);margin:0}
.sd-conf-x{flex:0 0 auto;padding:3px 10px;font:600 11px/1.4 Archivo,system-ui,sans-serif;color:#5c554c;background:none;border:1px solid var(--line);border-radius:3px;cursor:pointer}
.sd-conf-x:hover{color:var(--ink);border-color:var(--rust-text,#b8431f)}
.sd-conf-sub{font-size:12px;line-height:1.5;color:#6b6560;margin:6px 0 0}
.sd-conf-und{font:italic 14px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:10px 0 0}
.sd-conf-e{margin:12px 0 0;padding:10px 12px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
.sd-conf-e .sd-conf-eh{font:600 11.5px/1.4 'IBM Plex Mono',ui-monospace,monospace;color:var(--ink);margin:0}
.sd-conf-e .sd-conf-fld{font:11px/1.5 'IBM Plex Mono',ui-monospace,monospace;color:#5c554c;margin:3px 0 0}
.sd-conf-sides{display:flex;gap:8px 14px;flex-wrap:wrap;margin:8px 0 0}
.sd-conf-side{flex:1 1 260px;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:var(--paper,#fff)}
.sd-conf-side .sd-conf-lab{display:block;font:600 9.5px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--ash);margin:0 0 4px}
.sd-conf-side.sd-conf-code p{font:12.5px/1.5 'IBM Plex Mono',ui-monospace,monospace;color:var(--ink);margin:0;overflow-wrap:anywhere}
.sd-conf-side.sd-conf-words p{font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
.sd-conf-e .sd-conf-disc{font-size:12.5px;line-height:1.5;color:var(--ink);margin:8px 0 0}
.sd-conf-e .sd-conf-note{font:italic 13px/1.55 Georgia,'Times New Roman',serif;color:#7a5b00;margin:8px 0 0}
.sd-conf-e .sd-conf-meta{font-size:11.5px;line-height:1.5;color:#6b6560;margin:6px 0 0;word-break:break-word}
.sd-conf-e .sd-conf-sh{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7a5b00;margin:0 0 6px}
.sd-conf-e.sd-conf-sheet{margin:10px 0 0}
.sd-conf-list .sd-conf-e:last-child{margin-bottom:2px}
@media(max-width:700px){
.sd-conf-dlg{padding:12px 12px 14px}
.sd-conf-h{font-size:22px}
.sd-conf-side{flex-basis:100%}
.sd-conf-e{padding:9px 10px}
}
```

JS: reproduce entire previous JS with:
1. comment em dash fix in sd-dossier header comment ("at a time : a tail number").
2. new sd-conf section (before sd-locate or after; I'll put after sd-locate section, before `var queued=false;`).
3. pass() gains sdConfFetch, sdConfDesk, sdConfStep.
4. boot unchanged otherwise.

Check: the JS header comment "sd-locate" mentions...: fine.

Also in the sd-dossier comment there is "— a tail number" em dash; fix. Also check other comments: "sd-globals" comment uses ":" ok. "sd-pnrow" comment uses ":" ok. "sd-dossier2" comment ok. "sd-mark" comment ok. "sd-locate" JS comment: "It sends the first 25 write-ups now on screen : never more, the endpoint's own limit :" ok, colons.

Also strings in existing code with \u2014: search... sdRender uses ' \u00b7 ' middots fine. sdLocBar text uses ":". OK. `sdKickText` fine.

One more: existing CSS comment `/* sd-locate: the model's reading of where the write-ups say the defect was. Amber, dashed and serif on purpose \u2014 nothing here...` fix to ", and nothing here may be mistaken for". Actually write: "Amber, dashed and serif on purpose, so nothing here may be mistaken for the FAA's own zone codes in the row above."

Also `#hero.instrument` etc untouched.

Also careful: in JS the sd-dossier section header comment contains "—" once: "the panel holds one subject at a time — a tail number". Fix.

And "sd-rrtail" comment fine.

Now write sdConfEntry carefully with escapes: apostrophes: use \u2019 in "The FAA\u2019s code says" and "the mechanic\u2019s". Also "file does not say which, and nothing here decides it."

Coverage text: "Only 44 of the 1,757,827 records in this file have been read this way. A record with no entry here has not been checked, so an absent entry is not evidence that the record agrees with itself." Wait, must be careful: use dynamic n. Also mention out of 1,757,827 which is the file total used elsewhere in page. Good.

Overlay sub: sdFmt(n)+" entries, each one a record read against its own coded fields. Only these "+sdFmt(n)+" of the 1,757,827 records in the file have been read this way."

Desk lead when whatIs empty: fallback: "Entries for records where the FAA's coded fields and the mechanic's own words do not agree: one of the two is wrong, and the file does not say which." Hmm keep shorter.

Also the desk button when fetch pending: disabled "Reading the entries…". Use \u2026.

Also: the desk block should appear even if fetch fails: handled.

Now, think about "kick" being called by sdConfFetch completion → pass → sdConfDesk updates with sig. Good.

sdConfStep: uses SDCONF.map; called every pass; when not fetched, entries empty → returns null → removes stale sections. Fine.

Potential issue: table.nextElementSibling reuse: if the sheet re-renders, old section removed with table's parent re-render? If overlay replaces content, our section goes too. OK.

Also make sure the conflict section doesn't get picked up by sdSheets (it's a div, not table). And sdFindControl's clone excludes data-sd-pnrow rows only; our section not in table. Good.

Also ensure that adding section after table doesn't interfere with "How to cite it" detection next pass (labels within table unchanged). Good.

Edge: `sdConfKey` document keydown: also existing delegated keydown handler for data-attrs; separate listener fine.

Let me also handle overlay content when entries lack readable fields: sdConfEntry handles nulls.

Also `e.confirmed` might be like "3 of 5 readings"? Truthy string → printed raw "confirmed: 3 of 5 readings". Fine neutral.

Actually "confirmed: X" label with colon; ok.

Write the final JS. I'll be meticulous to include every original function unchanged.

Also the requirement "Phase B unchanged: ... 18 controls" - our desk button is not inside #sdControls. Good. "4 rails" unchanged. "16 panels" unchanged (we add no p-* panel). Good.

Let me draft the sd-conf JS block:

```js
/* ============ sd-conf: a record where the FAA's coded fields and the
   mechanic's own words do not agree. The endpoint /z/api/conflicts is read
   once and kept, keyed by the record id; it is never fetched per sheet.
   Two ways in: a reference block on the desk, beside the credit, saying in
   the endpoint's own words what a reader will find, and a section inside a
   case sheet whose record has an entry, so a reader looking at that record
   need not learn elsewhere that it is disputed. Every entry shows the two
   sides labelled with whose words they are, and nothing here decides which
   side is right: the tool cannot know. Where the list is linked from, the
   coverage is stated: only these entries have been read this way, out of
   1,757,827, so an absent entry is not evidence that a record agrees with
   itself. ================================================================== */
```

Wait "=====" at the end is fine (equals signs, not dashes). Other section comments end with "========================= */" — consistent.

Functions:

```js
var SDCONF={fetched:false,busy:false,failed:false,entries:[],map:{},total:0,whatIs:"",whatNot:"",lastFocus:null};
function sdConfFetch(){
  if(SDCONF.fetched||SDCONF.busy)return;
  SDCONF.busy=true;
  sdGetJSON("conflicts").then(function(j){
    SDCONF.busy=false;SDCONF.fetched=true;
    var es=(j&&Array.isArray(j.entries))?j.entries:[],m={},i,e;
    for(i=0;i<es.length;i++){
      e=es[i];
      if(e&&e.id!=null&&String(e.id).trim()!=="")m[String(e.id).trim()]=e;
    }
    SDCONF.entries=es;SDCONF.map=m;
    SDCONF.total=(j&&j.total!=null)?sdNum(j.total):es.length;
    SDCONF.whatIs=(j&&j.what_this_is!=null)?String(j.what_this_is):"";
    SDCONF.whatNot=(j&&j.what_this_is_not!=null)?String(j.what_this_is_not):"";
    kick();
  }).catch(function(){
    SDCONF.busy=false;SDCONF.fetched=true;SDCONF.failed=true;
    kick();
  });
}
function sdConfCount(){return SDCONF.entries.length||SDCONF.total||0}
```

sdConfSides, sdConfEntry, sdConfDesk, sdConfOpen, sdConfFill, sdConfClose, sdConfKey, sdConfForSheet, sdConfStep as designed.

sdConfEntry detail (careful with quotes in HTML strings): I'll use single-quoted JS strings; inner attributes double quotes.

```js
function sdConfSides(e){
  var code=(e.code_says==null)?"":String(e.code_says).trim();
  var words=(e.text_says==null)?"":String(e.text_says).trim();
  if(!code&&!words)return '<p class="sd-conf-meta">The entry carries no wording for either side.</p>';
  var h='<div class="sd-conf-sides">';
  if(code)h+='<div class="sd-conf-side sd-conf-code"><span class="sd-conf-lab">The FAA\u2019s code says</span><p>'+sdEsc(code)+'</p></div>';
  if(words)h+='<div class="sd-conf-side sd-conf-words"><span class="sd-conf-lab">The mechanic wrote</span><p>'+sdEsc(words)+'</p></div>';
  return h+'</div>';
}
function sdConfEntry(e,inSheet){
  var parts=[],v,hl=[];
  parts.push('<p class="sd-conf-eh">record '+sdEsc(e.id==null?"":String(e.id))+'</p>');
  v=(e.date==null)?"":String(e.date).trim();if(v)hl.push(sdEsc(v));
  v=(e.operator==null)?"":String(e.operator).trim();if(v)hl.push("operator "+sdEsc(v));
  v=(e.tail==null)?"":String(e.tail).trim();if(v)hl.push("tail "+sdEsc(v));
  if(hl.length)parts.push('<p class="sd-conf-fld">'+hl.join(" \u00b7 ")+'</p>');
  v=(e.field==null)?"":String(e.field).trim();
  if(v)parts.push('<p class="sd-conf-fld">coded field: '+sdEsc(v)+'</p>');
  parts.push(sdConfSides(e));
  v=(e.discrepancy==null)?"":String(e.discrepancy).trim();
  if(v)parts.push('<p class="sd-conf-disc">'+sdEsc(v)+'</p>');
  v=(e.note==null)?"":String(e.note).trim();
  if(v)parts.push('<p class="sd-conf-note">'+sdEsc(v)+'</p>');
  var meta=[];
  v=(e.found_at==null)?"":String(e.found_at).trim();if(v)meta.push("found in: "+sdEsc(v));
  if(e.confirmed!=null&&e.confirmed!==""&&e.confirmed!==0&&e.confirmed!==false)meta.push("confirmed: "+sdEsc(String(e.confirmed)));
  if(e.disputed!=null&&e.disputed!==""&&e.disputed!==0&&e.disputed!==false)meta.push("disputed: "+sdEsc(String(e.disputed)));
  v=(e.source==null)?"":String(e.source).trim();if(v)meta.push("source: "+sdEsc(v));
  if(meta.length)parts.push('<p class="sd-conf-meta">'+meta.join(" \u00b7 ")+'</p>');
  if(!inSheet)parts.push('<p class="sd-conf-meta">One of the two is wrong. The file does not say which.</p>');
  return parts.join("");
}
```

Hmm "One of the two is wrong" per entry: I said keep at overlay top only. But per-entry also fine? The und line at top: "One of the two readings on each entry is wrong..." Keep both? Redundant. I'll drop the per-entry line when inSheet=false (overlay top covers it), keep the sheet's und line. So remove that push entirely, since overlay has .sd-conf-und and sheet adds its own. Actually per-entry is helpful if list is long... The top und line scrolls out. Keep per-entry line but short: "The file does not say which side is right." Hmm, that's also the sheet's closer. Fine, keep per-entry in list too; slight repetition acceptable? I'll keep it only in the overlay und + sheet, and NOT per entry, to avoid noise. Decided: no per-entry line.

Wait but then in the sheet, "inSheet" param unused... I'll still keep und line appended in sdConfStep for the sheet, and in overlay after list? Put und paragraph also at the bottom of the list in fill: after entries append '<p class="sd-conf-und">The file does not say which side is right on any of them, and nothing here decides it.</p>'? Top und suffices honestly. Keep it simple: overlay top und; sheet und. Remove inSheet param usage → keep param for future but unused... just drop param.

Desk:

```js
function sdConfDesk(){
  var d=byId("sd-conf-desk"),host,lead,notp,cov,btn,n,sig;
  if(!d){
    d=document.createElement("section");
    d.id="sd-conf-desk";
    d.setAttribute("role","region");
    d.setAttribute("aria-label","Reference: records where the FAA\u2019s coded fields and the mechanic\u2019s own words do not agree");
    d.innerHTML='<p class="sd-conf-kick">Reference</p>'
      +'<p class="sd-conf-lead" data-sd-cis></p>'
      +'<p class="sd-conf-not" data-sd-cnot hidden></p>'
      +'<p class="sd-conf-cov" data-sd-ccov hidden></p>'
      +'<div class="sd-conf-row"><button type="button" class="sdbtn" id="sd-conf-open"></button></div>';
    host=document.querySelector(".credit");
    if(host&&host.parentNode)host.parentNode.insertBefore(d,host);
    else (document.querySelector("main.wrap")||document.body).appendChild(d);
    d.addEventListener("click",function(ev){
      var b=ev.target&&ev.target.id==="sd-conf-open";
      if(!b)return;
      ev.preventDefault();
      try{sdConfOpen()}catch(_){}
    });
  }
  n=sdConfCount();
  sig="f"+(SDCONF.fetched?1:0)+(SDCONF.failed?1:0)+"n"+n+"|"+SDCONF.whatIs+"|"+SDCONF.whatNot;
  if(d.getAttribute("data-sd-csig")===sig)return;
  d.setAttribute("data-sd-csig",sig);
  lead=d.querySelector("[data-sd-cis]");
  notp=d.querySelector("[data-sd-cnot]");
  cov=d.querySelector("[data-sd-ccov]");
  btn=byId("sd-conf-open");
  if(!SDCONF.fetched){
    if(lead)lead.textContent="Reading the file for records where the code and the words disagree\u2026";
    if(btn){btn.disabled=true;btn.textContent="One moment"}
    return;
  }
  if(SDCONF.failed){
    if(lead)lead.textContent="The list of disagreements did not answer. Nothing is shown rather than something wrong.";
    if(notp)notp.hidden=true;
    if(cov)cov.hidden=true;
    if(btn){btn.disabled=true;btn.textContent="Not available"}
    return;
  }
  if(lead)lead.textContent=SDCONF.whatIs||"Records where the FAA\u2019s coded fields and the mechanic\u2019s own words do not agree.";
  if(notp){
    if(SDCONF.whatNot){notp.hidden=false;notp.textContent=SDCONF.whatNot}
    else notp.hidden=true;
  }
  if(cov){
    if(n){
      cov.hidden=false;
      cov.textContent="Only "+sdFmt(n)+" of the 1,757,827 records in this file have been read this way. A record with no entry has not been checked, not cleared.";
    }else cov.hidden=true;
  }
  if(btn){btn.disabled=!n;btn.textContent=n?("Read the "+sdFmt(n)+" entries"):"No entries"}
}
```

Note: the desk must not promise more than what_this_is_not allows: printing whatNot covers it.

Overlay:

```js
function sdConfOpen(){
  var ov=byId("sd-conf-over"),x;
  if(!ov){
    ov=document.createElement("div");
    ov.id="sd-conf-over";
    ov.setAttribute("role","dialog");
    ov.setAttribute("aria-modal","true");
    ov.setAttribute("aria-label","Entries where the code and the words disagree");
    ov.innerHTML='<div class="sd-conf-dlg">'
      +'<div class="sd-conf-top"><h2 class="sd-conf-h">Where the code and the words disagree</h2>'
      +'<button type="button" class="sd-conf-x">Close</button></div>'
      +'<p class="sd-conf-sub" data-sd-csub></p>'
      +'<p class="sd-conf-und">One of the two readings on each entry is wrong. The file does not say which, and nothing here decides it.</p>'
      +'<div class="sd-conf-list" data-sd-clist></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click",function(ev){
      if(ev.target===ov||(ev.target&&ev.target.closest&&ev.target.closest(".sd-conf-x"))){
        ev.preventDefault();
        try{sdConfClose()}catch(_){}
      }
    });
    document.addEventListener("keydown",sdConfKey);
  }
  sdConfFill();
  ov.hidden=false;
  SDCONF.lastFocus=document.activeElement;
  x=ov.querySelector(".sd-conf-x");
  if(x)try{x.focus()}catch(_){}
}
function sdConfKey(ev){if(ev&&ev.key==="Escape"){var ov=byId("sd-conf-over");if(ov&&!ov.hidden)sdConfClose()}}
function sdConfClose(){
  var ov=byId("sd-conf-over");
  if(ov&&!ov.hidden)ov.hidden=true;
  if(SDCONF.lastFocus&&SDCONF.lastFocus.focus)try{SDCONF.lastFocus.focus()}catch(_){}
}
function sdConfFill(){
  var ov=byId("sd-conf-over");
  if(!ov)return;
  var list=ov.querySelector("[data-sd-clist]");
  var sub=ov.querySelector("[data-sd-csub]");
  var n=SDCONF.entries.length,i,h="",sig;
  if(sub){
    sig=SDCONF.fetched?String(SDCONF.failed)+"n"+n:"pending";
    if(sub.getAttribute("data-sd-csig")!==sig){
      sub.setAttribute("data-sd-csig",sig);
      if(!SDCONF.fetched)sub.textContent="Reading\u2026";
      else if(SDCONF.failed)sub.textContent="The list did not answer.";
      else if(!n)sub.textContent="The endpoint answered with no entries.";
      else sub.textContent=sdFmt(n)+" entries, each one a record where the coded fields and the written words were read against each other. Only these "+sdFmt(n)+" of the 1,757,827 records in the file have been read this way.";
    }
  }
  if(!list)return;
  sig=SDCONF.fetched?(SDCONF.failed?"err":"n"+n):"pending";
  if(list.getAttribute("data-sd-csig")===sig)return;
  list.setAttribute("data-sd-csig",sig);
  if(!SDCONF.fetched)h='<p class="sd-conf-meta">Reading\u2026</p>';
  else if(SDCONF.failed)h='<p class="sd-conf-meta">The list did not answer. Nothing is shown rather than something wrong.</p>';
  else if(!n)h='<p class="sd-conf-meta">The endpoint answered with no entries.</p>';
  else for(i=0;i<n;i++)h+='<article class="sd-conf-e">'+sdConfEntry(SDCONF.entries[i])+'</article>';
  list.innerHTML=h;
}
```

Sheet:

```js
function sdConfForSheet(table){
  var ctl,txt,id;
  if(!SDCONF.fetched||SDCONF.failed||!SDCONF.entries.length)return null;
  ctl=sdFindControl(table);
  if(ctl&&SDCONF.map[ctl])return SDCONF.map[ctl];
  txt=table.textContent||"";
  if(!txt)return null;
  for(id in SDCONF.map){
    if(Object.prototype.hasOwnProperty.call(SDCONF.map,id)&&id.length>=6&&txt.indexOf(id)>=0)return SDCONF.map[id];
  }
  return null;
}
function sdConfStep(){
  var sheets=sdSheets(),i,table,e,sec,sig;
  for(i=0;i<sheets.length;i++){
    table=sheets[i].table;
    if(!table.parentNode)continue;
    e=sdConfForSheet(table);
    sec=table.nextElementSibling;
    if(!(sec&&sec.getAttribute&&sec.getAttribute("data-sd-confout")==="1"))sec=null;
    if(!e){
      if(sec&&sec.parentNode)sec.parentNode.removeChild(sec);
      continue;
    }
    sig=String(e.id==null?"":e.id);
    if(sec&&sec.getAttribute("data-sd-csig")===sig)continue;
    if(!sec){
      sec=document.createElement("div");
      sec.className="sd-conf-e sd-conf-sheet";
      sec.setAttribute("data-sd-confout","1");
      sec.setAttribute("role","region");
      sec.setAttribute("aria-label","A conflict is recorded on this record");
      table.parentNode.insertBefore(sec,table.nextSibling);
    }
    sec.setAttribute("data-sd-csig",sig);
    sec.innerHTML='<p class="sd-conf-sh">A conflict is recorded on this record</p>'
      +sdConfEntry(e)
      +'<p class="sd-conf-und">The file does not say which side is right, and nothing here decides it.</p>';
  }
}
```

Wait: sdConfForSheet's fallback scanning txt could match the entry id inside our own... no, section is outside table. Could match part numbers etc.? Entry ids are record numbers like "JR2R..." format presumably; length>=6 guard. If id were short/numeric, could false-positive on dates etc. Add guard: id must contain a digit and length>=6; also require the match to be a standalone token? Use regex escape... keep simple: require id.length>=7 maybe. Given "keyed on the record number" with controls like JR2R20260825350, fine. I'll require /\d/.test(id) and id.length>=7.

Also careful: sdFindControl's fallback scans sheet text for tokens with >=9 digits; conflicts ids may differ; that's why we scan map ids too.

pass() modifications: add after sdDossierKick:
```
try{sdConfDesk()}catch(e){}
try{sdConfStep()}catch(e){}
```
and near top add `try{sdConfFetch()}catch(e){}` — but sdConfFetch defined later in source than pass? pass is defined near the bottom; sd-conf section inserted before sd-locate or before pass — either way before pass definition. I'll insert sd-conf section between sd-locate section and `var queued=false;`. Then pass can call them.

sdConfFetch called in pass is fine (guarded).

Also note: overlay inserted at body end; MutationObserver on documentElement will observe our own innerHTML set → kick → pass → sig guards → no loop. sdConfStep sets innerHTML each time sig changes only. Good.

Also check: adding the desk section before .credit — .credit inside main.wrap presumably; mutation triggers kick; sig guard prevents churn.

Now write everything out. The full JS block is long; reproduce faithfully.

Double-check for em/en dashes in final output text strings: "…", "\u00b7", "\u2019", "\u201c/\u201d" quotes — existing sdRenderPart uses \u201c \u201d fine. No — or –. Comments: scan my new comments: none. Fixed two old comments.

Also the CSS has `\u2014` inside a comment only; replaced.

One more check on requirement: "Say in one line what a reader will find there before they click, using the endpoint's own what_this_is". Our desk lead is what_this_is verbatim as the one line before the button. Good.

"and do not promise more than what_this_is_not allows" — whatNot printed below.

Also ensure "the word conflicts appears zero times" — should our reader-facing text avoid the word "conflicts"? The brief says currently it appears zero times; that's describing the hidden build, not a constraint on new text. But arguably the spirit: don't lean on jargon; describe. I've used descriptive labels everywhere; the aria-labels say "do not agree". I think avoiding the literal word "conflicts" in page text is safer and more in spirit. My texts: "records where the FAA's coded fields and the mechanic's own words do not agree", "Where the code and the words disagree", "A conflict is recorded on this record" — hmm, "conflict" appears in the sheet heading and aria-label. Use "A disagreement is recorded on this record" instead. Keep the word out entirely. I'll use "disagreement". Update: sheet heading "A disagreement is recorded on this record", aria same. Desk aria: "records where ... do not agree". Overlay aria: "Entries where the code and the words disagree". Entry code uses no "conflict". sdConf function names contain Conf (internal, fine).

CSS class names contain "conf" but that's not page text. Fine.

Final check on the "44 entries" fetch-once requirement: yes.

Also ensure no interference with #sdControls count or starter questions: none.

Also the desk at 1440: max-width 1140 consistent.

Now output. I'll write the entire CSS then entire JS. Be careful with the existing code — copy it accurately.

Also minor: in existing JS, `RE_AN`? no. Let me just carefully re-emit.

One thing: the original block's `pass()` includes `try{sdMirror()}catch(e){}` and `try{sdDossierKick()}catch(e){}` last. I'll add my two after them, plus sdConfFetch earlier (say right after sdEnsureGlobals() line in pass). Also keep initial `sdEnsureGlobals();` call at module level.

Write it out now.