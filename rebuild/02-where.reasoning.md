Let me work through this carefully.

The task: write a self-contained block of JavaScript and CSS that replaces the WHERE rail in the page. The specification is detailed. The key bug: the API returns codes prefixed with "ZONE " (e.g., "ZONE 200"), but the code builds a Map keyed on those codes and looks up bare "200" — so every lookup fails, every n is 0, everything renders at floor alpha.

I need to produce:
- zone constant (ZONE_ORDER with prefixed codes, in the fixed array order given)
- zone builder (buildZones) — keyed correctly on the prefixed codes, using the API's label (authoritative), falling back to glossary only if API label missing
- the aircraft SVG (acSVG) — verbatim per spec: viewBox 0 0 600 132, document order 100, 200, 300, 300b, 500, 600, 400, 700, 800, 900, windows last
- the legend (legend rows with same alpha, pad rows not clickable — data-aim but no data-take)
- the note under the legend (.zonenote, verbatim wording, rendered only when d.unzoned > 0)
- the reading sentence (reading function)
- the closed/rest state strip (flex floored at 1, sorted descending)
- the phone grid (phZones) — 3x3 grid
- CSS for .zone, .lrow, .strip, .zonenote, .phcell, forced-colors, etc.
- interaction: shape() helper with the trailing-b strip, delegation, syncControls toggling .taken on both shape(s) and legend rows
- reverse link: heroMark(row) using querySelectorAll
- reading sentence computed from data

Let me check the numbers given in check #3:

Zones:
- ZONE 200: 84453 (Upper fuselage)
- ZONE 100: 60966
- ZONE 800: 22874
- ZONE 300: 9149
- ZONE 500: 10954
- ZONE 600: 10691
- ZONE 400: 6448
- ZONE 700: 4149
- ZONE 900: 3256

Sum: 84453+60966 = 145419; +22874 = 168293; +9149 = 177442; +10954 = 188396; +10691 = 199087; +6448 = 205535; +4149 = 209684; +3256 = 212940.

placedAll = 212940. Good — matches "212,940 reports written in the FAA's numbered zones".

84453/212940 = 0.396629... ×100 = 39.66... → pct rounds to 39.7. Good.

unzoned = total − sum(zones) = 1757827 − 212940 = 1544887. Matches d.unzoned given.

no_location = 90383, other_location = 1454504. Note: 212940 + 90383 + 1454504 = 1757827. Good, so other_location = total − placed − no_location exactly.

Check 1: with no filter, seven paths must show at least four visibly different opacities, ZONE 200 darkest. mx = 84453. o(n) = 0.10 + 0.80*(n/mx):
- ZONE 200: 0.900
- ZONE 100: 0.10+0.80*0.7217 = 0.677
- ZONE 800: 0.10+0.80*0.2708 = 0.317
- ZONE 300: 0.10+0.80*0.1083 = 0.187
- ZONE 500: 0.10+0.80*0.1297 = 0.204
- ZONE 600: 0.203
- ZONE 400: 0.161
- ZONE 700: 0.139
- ZONE 900: 0.131

That's plenty of distinct opacities. Note "seven paths" — the shapes: 100 belly, 200 crown, 300 fin, 300b stabiliser, 500 wing, 600 above root are 6 paths, plus 400 nacelle is an ellipse, 700 gear are circles, 800 doors rects, 900 lav rects. Hmm, "seven paths" probably means the seven zone shapes loosely (100, 200, 300(+b), 500, 600 are paths; 400 ellipse; 700 group; 800 group; 900 group). Anyway, the ramp handles it.

Now, the code must drop into the existing file and use existing helpers: num, esc, params, setFilter, aim, aimHold, takeFor. Also existing: HERO, TOTAL, sum, pct presumably. The spec references pct with a definition — I should define pct if it may not exist, or use it if it does. The user's own code shows ramp(...) exists, zoneFill, zoneAria, zoneLabel, zoneDesc, zoneGloss, facetVals, HERO.raw, buildZones, acSVG, zonenoteHTML, bodyWhere, opRow. Since I'm replacing the WHERE rail, I should replace buildZones, acSVG, zonenoteHTML, bodyWhere, ZONE_ORDER/ZONE_DESC, and add reading("where", d), phZones, and CSS.

But wait — the existing page presumably has a hero/render pipeline: drawHero, syncControls, setHero, rails, etc. The user says "It must drop into your existing file and use your existing helpers (num, esc, params, setFilter, aim, aimHold, takeFor)." So I should write the pieces that replace the WHERE rail: constants, builders, SVG, legend, note, reading sentence, plus the CSS, plus the pieces the spec demands (shape helper, delegation maybe already exists — handlers delegated on document; syncControls; heroMark). Hmm. The instruction says "One self-contained block of JavaScript and CSS that replaces the WHERE rail in your page: the zone constant, the zone builder, the aircraft, the legend, the note under it, and the reading sentence."

So the deliverable covers: ZONE_ORDER (prefixed), ZONE_DESC maybe (kept for phone? Actually spec's phone grid doesn't need desc), buildZones, acSVG (new shape(), verbatim SVG), legendHTML, zonenote, readingWhere, rest strip, phZones, CSS, and the small helpers the rail needs: zn, o, zoneFill, ramp, takenClass handling via syncControls? The spec says syncControls after every drawHero toggles .taken. Since existing file has syncControls presumably generic (per field/key), I might include a snippet or note. To be safe, include a syncWhere() that syncs taken classes, and mention it should be called after drawHero — or include it as part of drawHero? The user says the block replaces the WHERE rail; the existing file has drawHero that calls bodyWhere etc. I'll provide bodyWhere, restWhere (closed state), readingWhere, phZones, buildZones, acSVG, plus the interaction hooks (aimFor/takeFor grammar is delegated; I need aimFor to handle "zone|CODE" and "pad|nowhere"/"pad|outside" aim text; takeFor to handle "zone|CODE"). But aim/takeFor are existing helpers — the spec says use them. However the aim text for zone/pad is rail-specific... In the original page, aimFor probably switch-cases on the aim key. Since I can't see it, I should provide the aim-text functions and the delegation snippet if needed? The user says "use your existing helpers (num, esc, params, setFilter, aim, aimHold, takeFor)". So aim and takeFor exist and presumably dispatch on prefix. But the exact aim wording is specified — so the existing aim() must have per-rail text. Hmm, risky. The safest: include in my block the handler text logic for zone| and pad| aims, as functions that my delegation calls; and note that if the page's global delegation already handles data-aim by calling aimFor(key), these functions slot in. Actually the spec says "Handlers are DELEGATED ON document, so redrawing the instrument never rebinds anything." — that's the page's existing grammar. I'll provide:

- aimWhere(kind, key) -> text (zone vs pad)
- takeWhere(key) -> the click chain (calls takeFilter/setFilter etc.)

But the spec's click chain: takeFor("zone|ZONE 200") -> takeFilter("zone", key, z.label) -> setFilter: #zone.value = "ZONE 200", show p-search, search(0), showChange(); aimHold(...). takeFor and takeFilter are existing. So I don't need to reimplement; I just need data-take attributes to be right ("zone|ZONE 200"). Good — the fix is the codes are prefixed everywhere, so data-take="zone|ZONE 200".

For aim text: the spec gives exact wording for hover aims. The existing aim() helper writes an explanation; the per-mark text is embedded in... Actually "data-aim writes an explanation" — the delegation reads data-aim value (a key like "zone|ZONE 200") and looks up text. So there must be an aimFor function mapping key→text. I'll provide `aimWhere` text builder and a small delegation block guarded so it doesn't double-bind: e.g., if the page already has document-level listeners for [data-aim]/[data-take], I shouldn't re-add. But since I'm replacing the rail and the user asked for one self-contained block, I'll include the delegation for the rail's own marks via event delegation on document, but guard with a flag so re-evaluation doesn't duplicate. Hmm, but if existing page already delegates, double handling would double-write aim (harmless but messy) and double-take (would apply filter twice — search twice). Risky.

Let me think about what's cleanest: The user says the block must "drop into your existing file and use your existing helpers (… aim, aimHold, takeFor)". This implies aim(key) takes a key and resolves text? If aim() resolved text itself, the specified wording would live in aim's implementation, not the rail. But the spec assigns exact wording to this rail. Possibly the existing aim() signature is aim(html) — writes the explanation string directly. Look at spec: "aim() refuses to write while a HELD message is showing". And aimHold(`narrowed to ${label}...`). So aim(text) writes text. Then who turns data-aim="zone|ZONE 200" into text? A delegated handler that computes per-kind text. Since the rail defines the texts, I should provide that mapping. I'll write:

```js
function aimFor(key){ ... switch prefix ... }
```

But careful: the page may already have aimFor for other rails. I'll name mine `whereAim(key)` and include a delegation snippet that handles only keys starting with "zone|" or "pad|", added once (guard via a module flag), calling aim(whereAim(key)) on mouseover/focus (delegated via event delegation using closest('[data-aim]')), and takeFor on click/Enter/Space for [data-take]. If the existing page already has such delegation, there'd be duplicates... The user knows their file; they said handlers are delegated on document as existing grammar. The instruction "use your existing helpers (… aim, aimHold, takeFor)" strongly suggests the delegation already exists and my marks just need the right attributes; the aim text per key is presumably produced by a function I should also update since it's rail-specific. I'll include `whereAim`/`aimText` for zone| and pad| and note in comments it plugs into the existing delegation. To be safe I'll include the delegation as an "install once" block that checks `window.__whereDelegated` — no; better: I'll state in the explanation that I assume the existing delegated dispatcher calls `aimFor(key)`/`takeFor(key)`, and provide `aimFor` override only for the zone/pad prefixes, delegating other prefixes to a previously-defined function if present. Hmm, that's getting complicated.

Alternative reading: the page has a single delegated listener that, on pointerover/focusin, finds closest('[data-aim]'), parses its data-aim, and calls aim(aimTextFor(key)); on click, closest('[data-take]') → takeFor(key). takeFor parses "field|value", calls setFilter etc. The rail-specific part is aimTextFor. Since I'm rewriting the rail, I provide aimTextFor's zone/pad cases. I'll present it as `whereAimText(key)` and wire it in the same block with a guard:

```js
if(!window.__WHERE_WIRED__){ window.__WHERE_WIRED__=1; ...document.addEventListener... }
```

Actually the spec says "One grammar for every mark... Handlers are DELEGATED ON document". Including the delegation in my block with an install-once guard is defensible and self-contained. If the page also has its own, the user can delete one. But the user asked me to "explain only where you departed from the specification and why" — including delegation isn't a departure; it's per spec ("delegated on document"). The risk of double-binding exists, but I'll guard with a flag. Alternatively I can attach delegation only if not already present by checking a data attribute on document. I'll do the flag.

Hmm, wait. Let me re-read: "It must drop into your existing file and use your existing helpers (num, esc, params, setFilter, aim, aimHold, takeFor)." So aim() is existing; I call aim(text). takeFor(key) existing; my delegation (or existing one) calls takeFor(data-take). I'll include the delegation with guard and note it. Or simpler: the existing delegation exists (since the page is live and other rails work). The bug report says clicking a zone "does not narrow anything" — because the server rejects zone=100 (the value was wrong due to bare code), not because delegation is missing. Indeed: "the page requests zone=100, and the server answers {error...}". So the delegation and takeFor all work! The only bug is the bare code. The click did fire takeFor("zone|100") and setFilter set #zone.value="100" and search ran with zone=100 and got rejected. So I do NOT need to add delegation. I need:

- correct prefixed codes in data-take/data-aim
- aim text for zone|ZONE 200 keys — but wait, if existing aim dispatcher maps "zone|100" style keys to text, it also needs the prefixed handling. The aim text: `${label} · ${num(z.n)} of ${num(placed)} placed findings · click to narrow`. The existing dispatcher may compute this from HERO.zones by code lookup — which was broken the same way. Since I'm rewriting the rail, I'll provide the aim text function and, to be safe, wire delegation only for aim if not already handled... 

Hmm. Let me look at the user's original code for clues about the architecture:

- bodyWhere() builds open layout with acSVG(taken) and legend; taken=params().get("zone") — note: params().get("zone") would be "ZONE 200" after fix.
- They have `taken===code?" taken":""` inline in acSVG — so the original page applied .taken at render time, whereas the spec wants syncControls after every drawHero. Either approach fine; spec says syncControls toggles taken on both shape and legend row. I can do it at render time (taken passed in) AND in syncWhere for redraws. Simplest: render-time class + a syncWhere() that runs after drawHero to also mark legend rows and handle the case where filters change without redraw. The spec explicitly: "syncControls() after every drawHero: n.classList.toggle('taken', p.get(field)===key) so a taken zone lights on BOTH its shape(s) and its legend row." I'll include syncWhere() and instruct (comment) to call it from drawHero; or better, I can render with taken class already and also provide syncWhere. Since I can't edit drawHero (not shown), I'll render taken classes at render time for both shapes and legend rows — that satisfies the visible behavior; and provide syncWhere() as the post-draw hook if their pipeline calls it. Hmm, but if their drawHero doesn't call syncWhere, render-time is what matters. I'll do render-time classes (shapes and legend) and include syncWhere() that does the toggling, with a comment that drawHero should call it; harmless duplication.

- The aim text: I'll provide `whereAim(key)` and a tiny delegation for mouseover/focusin/click/keydown guarded by a flag... Risk of double-fire with existing delegation. The evidence shows clicking works (takeFor fired). So existing click delegation exists. If I add my own click delegation, clicking a zone would call takeFor twice → double search, history entries twice. Bad. So: do NOT add click delegation. Provide aim text through... hmm, does existing aim delegation exist? The symptom list doesn't mention hover aiming being broken or working. The spec says handlers are delegated on document. Since the page is live with other rails, the dispatcher exists and presumably calls a per-rail text function. The original code has data-aim="zone|${code}" and data-aim="pad|nowhere" — so the dispatcher maps those keys. That mapping lives somewhere I can't see; it might be a big aimFor(key) with switch on prefix ("zone|", "pad|", "op|"...). Since my block replaces the WHERE rail, I should replace the zone/pad cases of that function. I'll provide:

```js
function aimTextWhere(key){
  if(key.startsWith("zone|")){ const code=key.slice(5); const z=(HERO.zones||[]).find(x=>x.code===code); if(z) return `${esc(z.label)} &middot; ${num(z.n)} of ${num(placedAll())} placed findings &middot; click to narrow`; }
  if(key==="pad|nowhere") return `${num(HERO.no_location||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`;
  if(key==="pad|outside") return `${num(HERO.other_location||0)} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`;
  return "";
}
```

And note: if the page's dispatcher has zone/pad cases, replace them with a call to aimTextWhere. To make it truly drop-in, I can define `aimTextWhere` and also attempt to hook: if a global `aimFor` exists, wrap it:

```js
const prevAimFor = window.aimFor;
window.aimFor = key => /^zone\||^pad\|/.test(key) ? aimTextWhere(key) : (prevAimFor ? prevAimFor(key) : "");
```

That's clever but fragile. Alternatively provide the delegation for aim only (mouseover/focusin), guarded — if the existing dispatcher also handles aim, double-write is idempotent (same text) — aim() writes text; writing twice same text is harmless. But if existing dispatcher produces the OLD (broken) text for zone keys, mine would overwrite with correct text if it runs after... order nondeterministic. Ugh.

Let me step back. The user's ask: "One self-contained block of JavaScript and CSS that replaces the WHERE rail in your page: the zone constant, the zone builder, the aircraft, the legend, the note under it, and the reading sentence." They list exactly what to replace. Interaction delegation is existing (evidence: click produced a request). So my job: correct codes everywhere (data-aim/data-take), correct aim text function (provided, plugged where their dispatcher handles zone|/pad| — I'll include it and note in one line), render functions, CSS. I'll include the aim text function and a note that the dispatcher's zone/pad cases should call it — and to make it drop-in without touching their dispatcher, I can include a compatibility shim: define aimText pieces and if their dispatcher is a function I can't see... 

Actually, maybe the cleanest: provide `whereAim(key)` AND a document-level delegation ONLY for pointerover/focusin (aim), with a guard flag, and note: "if your dispatcher already resolves zone|/pad| aims, delete the delegation and keep whereAim". Hmm, the user said "Explain only where you departed from the specification and why." — I can add one bullet explaining the assumption.

Alternatively, look again at spec interaction section: "Hover/focus aim, zone: `${label} · ...`". The spec describes behavior, and says handlers delegated on document. Since the page already delegates (evidence), the text function is the missing piece. I'll provide whereAim and, in the delegation-safe way, override nothing but expose it; then in comments show the one-line integration. Given "drop into your existing file", a small integration comment is acceptable.

Hmm, wait — maybe simpler: the existing aim dispatcher might just display data-aim content directly? No — data-aim is a key ("zone|200"), not text.

Let me just structure the deliverable:

```js
/* ================= WHERE rail (anatomy) ================= */

/* Codes are PREFIXED: the API sends 'ZONE 200', never '200'. */
const ZONE_CODES=["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500","ZONE 600","ZONE 400","ZONE 700","ZONE 900"];
```

Wait — spec says array order is _ZONE_ORDER = ["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500","ZONE 600","ZONE 400","ZONE 700","ZONE 900"]. But hold on — the API output listed:

ZONE 200 84453, ZONE 100 60966, ZONE 800 22874, ZONE 300 9149, ZONE 500 10954, ZONE 600 10691, ZONE 400 6448, ZONE 700 4149, ZONE 900 3256.

Note 300 (9149) < 500 (10954) — so "frequency-ish", not strictly sorted. The spec says ARRAY ORDER is fixed by _ZONE_ORDER and is NOT numeric, it is frequency-ish, and gives the exact order. So ZONE_CODES must be exactly that order. Since the API "ALWAYS returns all nine" in that order anyway, my builder mostly passes through, but I should keep ZONE_CODES as the canonical order for ties (legend sort stable) and for phone grid? Phone grid is spatial, given explicitly. OK.

But careful: the API's label is authoritative. buildZones should use z.label from the API; fall back to glossary/`ZONE xxx` only if label missing (e.g., facetVals("zone") fallback path where labels may be absent). The user's complaint: "line 364 discards the label the API sends and substitutes a guess from your own glossary. The API label is authoritative... Use it." So:

```js
function buildZones(){
  const src=(HERO.raw&&HERO.raw.zones)?HERO.raw.zones.map(z=>({
    code:String(z.code??z.zone??z.value??"").trim(),
    n:+(z.n??z.count??0),
    label:(z.label??z.name??"").toString()
  })).filter(z=>/^ZONE [1-9]00$/.test(z.code)) : facetVals("zone").map(...);
  const by=new Map(src.map(z=>[z.code,z]));
  return ZONE_CODES.map(c=>{
    const z=by.get(c);
    return {code:c, n:z?+z.n||0:0, label:(z&&z.label)?z.label:zoneLabel(c)};
  });
}
```

Hmm, but "ALWAYS all nine, n=0 when absent" — so mapping over ZONE_CODES and defaulting n=0 is right, and label fallback only when API label empty. Also the facetVals("zone") fallback: those facet values would presumably also be prefixed ("ZONE 200") if they come from the same server facet. Keep robust: filter to valid codes, tolerate "ZN 200"? Server builds 'ZONE ' prefix always. Keep the regex tolerant: /^Z(?:ONE|N)\s*([1-9])00$/ → normalize to "ZONE X00". That's defensive; the spec says codes ARE 'ZONE 200'. I'll normalize lightly:

```js
const normZone=v=>{const m=/^Z(?:ONE|N)?\s*([1-9])00$/i.exec(String(v||"").trim());return m?("ZONE "+m[1]+"00"):null;};
```

That handles "ZONE 200", "ZN 200", "zone 200". Good defensive touch without contradicting spec. Then by.get over normalized codes.

Zone label helper: existing zoneLabel(c) uses glossary; keep as fallback but API label first. zoneGloss takes bare code like "200"? Existing: zoneGloss=c=>gLook([...],c) and ZONE_DESC keyed by "100" etc. In buildZones fallback, call zoneLabel(c.replace(/^ZONE /,"")) — or keep zoneLabel accepting either by stripping prefix inside. I'll write:

```js
const bare=c=>String(c).replace(/^ZONE\s?/i,"");
const zoneLabelOf=c=>zoneGloss(bare(c))||("ZONE "+bare(c));
```

But existing zoneLabel exists; reuse with bare code. In fallback only.

Ramp:

```js
const ZMX=()=>Math.max(1,...(HERO.zones||[]).map(z=>+z.n||0));
const zAlpha=(n,mx)=>(0.10+0.80*(n/mx)).toFixed(3);
const zoneFill=(n,mx)=>`rgba(196,75,40,${zAlpha(n,mx)})`;
```

Spec: o = z => (0.10+0.80*(z/mx)).toFixed(3); fill = rgba(196,75,40,${o(n)}). Linear in raw count, rescaled per render against current selection's busiest zone — mx computed from HERO.zones each render. Good.

zn(code) helper: count for code from HERO.zones.

The shape() helper per spec:

```js
const shape=(c0,d2)=>{const c=c0.replace(/b$/,"");
  return `<path d="${d2}" fill="rgba(196,75,40,${o(zn(c))})" stroke="#7c746a" stroke-width="1.1" class="zone" data-aim="zone|${c}" data-take="zone|${c}" tabindex="${open?0:-1}" role="${open?"button":"presentation"}" aria-label="${esc(zLabel(c))}, ${num(zn(c))} reports"/>`};
```

Note: open? The rail is open when heroKind==="anatomy". The SVG is only rendered when open (bodyWhere). So open=true in practice; but keep the ternary as spec'd. Actually the spec's shape() includes tabindex="${open?0:-1}" — since acSVG only renders in open state, open is true. I'll pass open=true or reference heroKind. I'll keep a const open=true inside bodyWhere context... Simpler: in acSVG, `const open = HERO.kind==="anatomy"` — but HERO.kind may not exist in their code; heroKind variable? Their code has setHero('anatomy') and hero key. I'll just use tabindex="0" role="button" since the aircraft only renders open... But spec explicitly writes the ternary with `open`. I'll define `const open=true;` with comment "(the aircraft renders only in the open rail)". Hmm, that's silly. Better: compute `open` from the DOM: document.querySelector('.rail[data-rail="where"]')?.classList.contains("open"). Overkill. I'll just emit tabindex="0" role="button" and note nothing — wait, but the spec says where it states a reason I may reach the same end my own way; where it states numbers/strings/paths, load-bearing. The tabindex ternary is a mechanism; since shapes only render when open, tabindex 0 always is equivalent. Fine — but to honor spec literally I could include the ternary with open resolved as `HERO.key==="anatomy"`... I don't know their HERO shape. Their original acSVG emits tabindex="0" role="button" unconditionally. Keep that.

Zone shapes verbatim:

1. ZONE 100 belly: `M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z`
2. ZONE 200 crown: `M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z`
3. ZONE 300 fin: `M452 44 L492 7 L518 7 L523 41 Z`
4. ZONE 300b stabiliser: `M512 48 L578 38 L580 47 L516 57 Z`
5. ZONE 500 wing: `M236 87 L356 87 L318 108 L264 108 Z`
6. ZONE 600 above root: `M262 80 L344 80 L322 90 L284 90 Z`
7. ZONE 400 nacelle: ellipse cx=248 cy=99 rx=24 ry=9.5
8. ZONE 700 gear: group with struts path (stroke #8d857b, width 3, fill none, unshaded) + three circles (118,109,r6 nose; 281,111,r7; 297,111,r7) taking zone fill. aria-label "Landing gear, N reports". The group is the interactive mark: class zone, data-aim/take "zone|ZONE 700", tabindex 0, role button. Children struts pointer-events none? The spec doesn't say pointer-events; group handles events. Struts are one two-subpath path `M118 88 L118 104 M288 88 L288 106`. Wheels: fill=zone fill for ZONE 700, stroke default? Spec: "Only the three wheels take the zone fill." Stroke on every zone shape: #7c746a width 1.1 — but groups' children use default 1. Hmm: "Stroke on every zone shape: #7c746a, stroke-width 1.1 (groups' children use the default 1)." So the group has stroke #7c746a? And children inherit stroke but default width 1? Wait — for the gear group, the struts must be #8d857b width 3 explicitly, wheels take zone fill with stroke... default? Let me parse: "Stroke on every zone shape: #7c746a, stroke-width 1.1 (groups' children use the default 1)." So interactive top-level shapes (paths/ellipse) get stroke #7c746a width 1.1. For groups (700, 800, 900), children use stroke-width default (1) — presumably stroke #7c746a inherited from the group attribute. So `<g class="zone" stroke="#7c746a">` with children having explicit widths where needed (struts width 3, color #8d857b override; wheels width default 1 inherited... or no stroke?). The wheels: `<circle cx="118" cy="109" r="6" ...>` — fill zone fill; stroke inherited #7c746a width 1. OK. I'll put stroke="#7c746a" on the groups, stroke-width 1 default; struts override stroke and width; wheels inherit.

Actually, do the rects in doors/lav groups get stroke? Inherited #7c746a width 1. Fine.

Hover CSS changes stroke to rust width 2.2 on .zone — for groups, .zone:hover{stroke:...} applies to the g element; stroke inherits to children — struts have explicit stroke #8d857b so they stay grey; wheels turn rust ring. OK.

9. ZONE 800 doors: group aria-label "Doors, N reports", rects at x in [96,190,348,424], y=49, w=11, h=17, rx=3, fill zone fill.
10. ZONE 900 lav/galley: group, rects x in [122,372], y=51, w=22, h=14, rx=3.
11. Windows decoration: g fill #f7f5f0 stroke none opacity .8; rects x in [150,164,220,234,248,300,314,328,400,414], y=54, w=6, h=7, rx=2. Drawn last.

SVG attributes: viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it". CSS .plane{width:100%;max-width:640px;height:auto}.

Ellipse (400): class zone, data-aim/take zone|ZONE 400, fill zone fill, stroke #7c746a width 1.1, tabindex 0 role button, aria-label "Engine nacelles and pylons, N reports". Spec shows `<ellipse cx="248" cy="99" rx="24" ry="9.5" .../>` and its aria-label verbatim "Engine nacelles and pylons, N reports" — that's the API label for ZONE 400! Indeed API label: "Engine nacelles and pylons". And gear aria "Landing gear, N reports" — API label "Landing gear". Doors "Doors" — API label "Doors". So aria labels use API label. Good: zLabel(c) = label from HERO.zones.

aria-label format: `${esc(label)}, ${num(n)} reports` per shape() spec. For ellipse/group in spec, aria-label strings shown as "Engine nacelles and pylons, N reports" — same format. Good, consistent.

Title elements? The original code had <title> inside; spec's shape() has no <title>. Spec is verbatim — omit title. OK.

Now the closed/rest strip: 

```js
function restWhere(){
  const zs=[...(HERO.zones||[])].sort((a,b)=>b.n-a.n);
  const taken=params().get("zone");
  const val=taken?code("part_location",taken):"all zones";
```

Hmm — "val = active zone label via code("part_location",v), else the literal `all zones`". Their existing code has a `code(field, v)` helper? Not shown, but the spec references it; the page presumably has one (used by other rails to show active filter labels). I'm told to use existing helpers... but code() isn't in the list (num, esc, params, setFilter, aim, aimHold, takeFor). Risky to call code() if it doesn't exist. Alternative: resolve label from HERO.zones by code: (HERO.zones||[]).find(z=>z.code===v)?.label. That's self-contained and uses authoritative API label. The spec says "via code(...)" but the end (active zone label) is what matters; "Where it states a reason, you may reach the same end your own way." I'll use zone lookup with fallback to v itself. Departure to note? Minor; I'll mention it in one line: val resolved from HERO.zones (API label) rather than code() to avoid depending on a helper outside the listed set. Actually wait — the existing page might indeed have code(); the spec author read the parent instrument. The user's helper list for me: num, esc, params, setFilter, aim, aimHold, takeFor. I'll stick to those + obviously existing (HERO, TOTAL, sum, ramp?). ramp exists in their code (used at line 697: ramp(0.10+0.80*(z.n/mx))). I'll define my own zFill anyway to control format.

Rest strip markup per spec:

```html
<div class="rail" data-rail="where" onclick="setHero('anatomy')">
  <div class="gut rest"><span class="q">WHERE</span><span class="val">…</span></div>
  <div class="track"><div class="strip">
    …spans…
  </div></div></div>
```

Span: `<span style="flex:${Math.max(1,z.n)}" title="${esc(label)}: ${num(n)}" class="${taken?'sel':''}">` — empty content. Sorted DESC by n. Note: the strip spans aren't interactive (closed rail click opens via setHero). class sel uses .strip span.sel{background:var(--rust)}.

Open layout:

```js
function bodyWhere(){
  return `<div class="track two">${acSVG()}<div>${legendHTML()}${zonenoteHTML()}</div></div>${readingWhere()}`;
}
```

And the gutter is built by the page's rail chrome presumably (gut with q WHERE, pn "on the aircraft", val). The original bodyWhere didn't include gut — the page's drawHero probably wraps. Spec open layout includes gut — but the existing page has RAILS[1] with gutter etc. Since my block "replaces the WHERE rail... the zone constant, the builder, the aircraft, the legend, the note, the reading sentence", the gut/chrome is the page's. I'll provide bodyWhere returning track.two + reading, and note the chrome stays. Also the rest-state rail HTML: provide restWhere() returning the closed rail (since spec gives it verbatim) — the page presumably has a rest renderer per rail. I'll include restWhere() for completeness.

Legend:

```js
function legendHTML(){
  const mx=ZMX();
  const zs=[...(HERO.zones||[])].sort((a,b)=>b.n-a.n);
  const taken=params().get("zone");
  const rows=zs.map(z=>`<div class="lrow zone${taken===z.code?" taken":""}" data-aim="zone|${z.code}" data-take="zone|${z.code}" tabindex="0" role="button">
    <i style="background:rgba(196,75,40,${zAlpha(z.n,mx)})"></i><span>${esc(z.label)}</span><b>${num(z.n)}</b></div>`).join("");
  const pads=`
   <div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button">
     <i class="padi"></i><span>no location given</span><b>${num(HERO.no_location||0)}</b></div>
   <div class="lrow zone" data-aim="pad|outside" tabindex="0" role="button">
     <i class="padi"></i><span>place named in words, not as a zone</span><b>${num(HERO.other_location||0)}</b></div>`;
  return rows+`<div class="lsplit"></div>`+pads;
}
```

Pads: "Pads carry data-aim but NO data-take." Exact strings: `no location given` and `place named in words, not as a zone`. Swatch uses .padi class (hatched). Good.

Reading sentence:

```js
function readingWhere(){
  const zs=[...(HERO.zones||[])].sort((a,b)=>b.n-a.n);
  if(!zs.length) return "";
  const tot=+TOTAL||0; if(!tot) return "";
  const zoned=zs.reduce((s,z)=>s+(+z.n||0),0);
  if(!zoned) return ""; // spec: returns "" if total is 0 or zones is empty — zoned empty? Spec says "" if total 0 or zones empty. Hmm, if zones exist but all n=0? Then zs[0].n=0, pct(0, zoned=0) → "0.0"... spec only guards total 0 / zones empty. But pct(b=0) is defined "0.0". I'll follow spec literally: only guard total and empty zones.
  let s=`${esc(zs[0].label)} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${pct(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${pct(zoned,tot)}% of the selection.`;
  if(+HERO.other_location>0) s+=` Another ${num(HERO.other_location)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.`;
  if(+HERO.no_location>0) s+=` Only ${num(HERO.no_location)}, ${pct(HERO.no_location,tot)}%, give no location at all.`;
  s+=` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.`;
  return s;
}
```

Check: pct(84453,212940): 84453/212940=0.3966295... ×1000=396.6295→round 397→39.7. ✔. pct(212940,1757827)=0.12112... →121.12→121.1? Compute: 212940/1757827 = 0.121139... ×100=12.1139 → ×1000=121.139→121→12.1. ✔ "12.1% of the selection".

no_location pct: 90383/1757827=0.05142→5.1%. "about one report in twenty-seven" — 1/27=3.7%... hmm 5.1% is ~1 in 19.5. Whatever, that's the comment's historical note, not my problem.

pct definition: pct(a,b) = (Math.round(a/b*1000)/10).toFixed(1), "0.0" when b is 0. If their page lacks pct, define it guarded:

```js
if(typeof pct!=="function"){ var pct=(a,b)=>b?(Math.round(a/b*1000)/10).toFixed(1):"0.0"; }
```

Hmm, in a script block, `if(typeof pct==="undefined")` then function declaration... Simpler: define `const pctW` my own? But spec says use pct... The reading uses pct. Their original code used ramp and other helpers; pct may exist. I'll write a safe local:

```js
const pctSafe=(a,b)=>b>0?(Math.round(a/b*1000)/10).toFixed(1):"0.0";
```

and use pctSafe internally, noting if page already exposes pct with same semantics it's interchangeable. That avoids a hard dependency. But "must use existing helpers" lists only num, esc, params, setFilter, aim, aimHold, takeFor. So defining pctSafe locally is fine and safe. Good.

Note (zonenote) — verbatim:

```
`The aircraft above counts only the ${num(placedAll)} reports that use one of the FAA's numbered zones. In another ${num(d.other_location)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(d.no_location)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.`
```

placedAll = sum(zones[].n). Straight apostrophe in "FAA's". Rendered only when d.unzoned > 0.

```js
function zonenoteHTML(){
  const zs=HERO.zones||[];
  const placed=zs.reduce((s,z)=>s+(+z.n||0),0);
  const unz=(+TOTAL||0)-placed; // d.unzoned = total - sum
  if(!(unz>0)) return "";
  const ol=+HERO.other_location||0, nl=+HERO.no_location||0;
  return `<div class="zonenote">The aircraft above counts only the ${num(placed)} reports that use one of the FAA's numbered zones. In another ${num(ol)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(nl)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.</div>`;
}
```

Wait — unzoned = total − sum(zones[].n). Given data: 1757827−212940=1544887 ✔ (matches d.unzoned). But should I read HERO.unzoned if present? The API returns unzoned per the spec's "Also read: d.unzoned...". The API /api/hero returns unzoned field! The evidence block shows unzoned=1544887 in the response. So HERO.unzoned exists. Use d.unzoned when present, else compute:

```js
const unz=HERO.unzoned!=null?+HERO.unzoned:(+TOTAL||0)-placed;
```

Good.

Also, HERO.no_location / HERO.other_location — the API returns those. ✔ (evidence shows no_location=90383, other_location=1454504).

Now the two source comments (spec: TWO SOURCE COMMENTS RECORDING WHY) must appear in the source near the reading sentence. Include them verbatim:

```
/* This used to read 'the others never say where', which was false: they nearly all say
   where, in words the diagram cannot place. Only the blank ones say nothing, and they are
   about one report in twenty-seven, not four fifths of the file. */
/* Zonder deze zin leest de alinea als een reeks voorbehouden. De tekening is een steekproef,
   maar wel een die laat zien waar het meeste stukgaat. */
```

The closing sentence exists so the paragraph does not read as a list of disclaimers — that's the explanation of the second comment; include as part of comment or adjacent.

The phone grid phZones(d):

```js
function phZones(){
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],["ZONE 500","ZONE 400","ZONE 600"],["ZONE 300","ZONE 700","ZONE 900"]];
  const mx=ZMX(), taken=params().get("zone");
  const cell=c=>{
    const z=(HERO.zones||[]).find(x=>x.code===c)||{code:c,label:c,n:0};
    const f=(0.10+0.80*(z.n/mx)).toFixed(3);
    return `<button type="button" class="phcell${taken===c?" taken":""}" style="--f:${f}" data-aim="zone|${c}" data-take="zone|${c}" aria-label="${esc(z.label)}, ${num(z.n)} reports">${esc(z.label)}<b>${num(z.n)}</b></button>`;
  };
  ...
}
```

Spec phone: "The aircraft is replaced by a 3x3 grid of buttons, SAME data, SAME ramp". alpha into --f consumed by .phcell{background:rgba(196,75,40,var(--f,.1))}. .phcell.pad for pads — does the phone grid include pads? Spec: grid has 9 zones; pad cells? ".phcell.pad{background:repeating-linear-gradient(...)}" exists in spec CSS, implying pads appear on phone too. But grid defined is 9 zones only, no pads mentioned. Hmm — "grid = [[...]]" 3x3 zones. The .pad class exists for pads if rendered. The spec says "No reading paragraph and no .zonenote on the phone." It doesn't explicitly include pads in the phone grid. But .phcell.pad CSS is specified, so pads must be renderable. I'll render the 9 zone cells in the spatial grid, then the two pad cells below (same order as legend: nowhere, outside) with class phcell pad, data-aim only, no data-take. That uses .phcell.pad and keeps parity with the legend. Is that a departure? The spec's grid is 3x3 zones; pads appended after. I think including pads is right since CSS defines them; but strictly "The aircraft is replaced by a 3x3 grid of buttons, SAME data" — data includes unzoned/no_location/other_location... "SAME data, SAME ramp" refers to zones. I'll include the two pads as a fourth row of two cells — hmm, or maybe make grid rows: the 3x3 then pads. Let me just do: `<div class="phgrid">${9 cells}</div><div class="phgrid phpads">${2 pad cells}</div>`. Keep it simple: one grid container, 9 zone buttons + 2 pad buttons. 3 columns → pads occupy last row (2 of 3 columns). Acceptable.

Also phone grid taken state: .phcell.taken? Spec doesn't define; syncControls toggles taken on shapes and legend rows; for phone, add .taken outline via CSS similar to lrow.taken. I'll add `.phcell.taken{box-shadow:inset 0 0 0 2px var(--rust)}`. Minor addition; note it? The spec's phone section doesn't mention taken styling, but syncControls applies to marks generally. Small, sensible; I'll mention in departures only if needed. I'll include it silently as part of "syncControls" behavior — actually better to mention briefly.

Hmm wait, also: does bodyWhere choose phone vs desktop? The page's breakpoint handling: "Under the breakpoint both collapse to a single column" for the two-col layout, and PHONE section: "The aircraft is replaced by a 3x3 grid". So render-time branch on viewport width? Or CSS hides .plane and shows .phgrid? "phZones(d)" is a function — the page presumably calls phZones when narrow. Their existing code doesn't show responsive hero switching. I'll provide both acSVG() and phZones() and a whereArt() that picks based on matchMedia("(max-width:760px)") at render time:

```js
const whereArt=()=>window.matchMedia&&matchMedia("(max-width:760px)").matches?phZones():acSVG();
```

Note: no re-render on resize unless their pipeline does. Their page may already handle. I'll add a resize listener? Risky to rebind; but the spec says redraw never rebinds handlers (delegation). A media-query change listener calling drawHero... I don't know their drawHero name. Their code shows functions bodyWhere, opRow, and HERO global; there's likely renderHero()/drawHero(). The spec mentions "drawHero" and "syncControls()" and "showChange()" and "search(0)" — those exist in their file. I can call drawHero if defined... but I shouldn't add global listeners unnecessarily. I'll include a guarded resize handler:

```js
let _whereMq=matchMedia("(max-width:760px)");
_whereMq.addEventListener?.("change",()=>{ if(typeof drawHero==="function"&&HERO.kind==="anatomy") drawHero(); });
```

Hmm, HERO.kind — unknown field name for current hero ("hero key anatomy", setHero('anatomy')). Their setHero stores maybe HERO.key or a var heroKind. The spec: "heroKind falls back to 'anatomy' when ?hero= is absent or unknown" and "localStorage IS written by setHero but deliberately NOT read at boot". Those are page-level behaviors, presumably already implemented (setHero exists). I don't need to implement setHero — it exists. The rail default-open behavior exists too (RAILS[1] config). My block is the rail body + fix. I'll keep the mq listener but guard: only re-render if a current-heroes check is possible... I'll use try/catch or optional checks. Actually — simplest and safest: skip the mq listener; note that phone/desktop choice happens at render time and the page's own redraws (search, filter changes) will pick the right one. Adding a listener that calls drawHero could double-render if their code already handles resize. I'll include it but guarded and debounced? Hmm. "Explain only where you departed from the specification" — the spec doesn't demand a resize listener. I'll leave it out and note the choice in one line? That's not a departure from spec, just an integration note. Keep code lean; add brief comment.

Now, syncControls: spec says "syncControls() after every drawHero: n.classList.toggle('taken', p.get(field)===key)". I'll provide:

```js
function syncWhere(){
  const v=params().get("zone");
  document.querySelectorAll('[data-take^="zone|"]').forEach(n=>n.classList.toggle("taken", n.getAttribute("data-take")==="zone|"+v));
}
```

Wait spec: n.classList.toggle("taken", p.get(field)===key) where the mark's data-take="zone|CODE" → key=CODE. Equivalent. But careful: data-take^="zone|" also matches phone cells and legend rows — good, all should toggle. Pads have no data-take — unaffected. ✔. Call after every drawHero — I'll note: `drawHero()` should call syncWhere(); since I can't edit it here, also render-time classes handle the initial paint. Actually if drawHero calls bodyWhere which already embeds taken classes, syncWhere is belt-and-braces. Include it; mention integration in one comment line.

Hmm — but wait: if existing global syncControls() already does this generically for all fields (spec describes syncControls generically: n.classList.toggle("taken", p.get(field)===key) — that sounds like the EXISTING generic function, iterating all [data-take] marks!). "syncControls() after every drawHero" — the page already has syncControls. So I don't need syncWhere at all! The spec is describing what the parent instrument's syncControls does; my page has it (since other rails' taken states work). So skip syncWhere; rely on render-time taken classes + existing syncControls. I'll not define syncWhere. But I will render taken classes at render time (as original did) so it works regardless. Good.

Reverse link heroMark(row): "Each row carries data-zone from (PartLocation||"").toUpperCase().match(/^ZONE \d00/). heroMark(row) uses querySelectorAll". This is about the results table rows highlighting the aircraft. Is heroMark part of my block? It's page-level (table → aircraft link). The user's list: "the zone constant, the zone builder, the aircraft, the legend, the note under it, and the reading sentence." heroMark isn't listed. But the spec includes REVERSE LINK section. The existing heroMark presumably does querySelector (broken for two-path zones) — since the whole aircraft is being replaced, heroMark's selector targets [data-take="zone|..."]? If it queries `[data-take="zone|${code}"]` with code prefixed now, existing heroMark would work if it used the row's data-zone. Unknown. I'll include a heroMark override? Risky to clobber. Hmm. The instruction limits scope; but the spec says heroMark uses querySelectorAll deliberately. If their existing heroMark uses querySelector, ZONE 300 lights only the fin. Since my block is "self-contained ... replaces the WHERE rail", and heroMark is the bridge, I'll include it with a guard: define heroMark only if... can't conditionally know. I'll include:

```js
function heroMark(row){
  const m=String(row?.dataset?.zone||""); // already normalized upstream? 
  ...
}
```

Wait, spec: "Each row carries data-zone from (PartLocation||'').toUpperCase().match(/^ZONE \d00/)". So row.dataset.zone = match result, e.g., "ZONE 200" or null/"". heroMark(row): const code=row.dataset.zone; document.querySelectorAll(`[data-take="zone|${code}"]`)... add .lit; plus aim? The parent behavior: hovering/clicking a row lights the zone. Spec: "a zone lights on the aircraft AND in the legend at once, and both ZONE 300 paths together." So heroMark adds .lit to all matching [data-take] marks (or [data-aim]?). Marks carry both attributes; querySelectorAll('[data-take="zone|'+code+'"]') covers shape paths, groups, legend rows, phone cells. And presumably an unmark function. I'll provide heroMark(row) and heroUnmark() adding/removing .lit. If their existing heroMark differs (maybe also scrolls or aims), overriding could lose behavior... but they asked to replace the rail; the reverse link is part of this rail's spec. I'll include it and mention in departures/notes that heroMark is included per spec's reverse-link section; if their table code calls heroMark(row) already, it just works; note the client regex strictness comment (the stricter regex lives in the row-building code, which is outside this block — I'll include the regex in a comment? No — data-zone is set by the table builder, not me. I'll note it).

Hmm, wait. Let me reconsider: including heroMark without knowing signature could break things if their heroMark(row, col) etc. I'll write it defensively:

```js
function heroMark(row){
  const code=(row&&(row.dataset?row.dataset.zone:row.getAttribute?.("data-zone")))||"";
  unmarkWhere();
  if(!/^ZONE [1-9]00$/.test(code))return;
  document.querySelectorAll(`[data-take="zone|${code}"],[data-aim="zone|${code}"]`).forEach(n=>n.classList.add("lit"));
}
```

Dedupe selectors: marks have both attrs; using both selectors double-selects same nodes — forEach on a static NodeList from comma selector returns unique nodes (querySelectorAll dedupes). ✔ querySelectorAll with comma returns document-order unique. Good.

And unmark:

```js
function unmarkWhere(){document.querySelectorAll(".zone.lit").forEach(n=>n.classList.remove("lit"));}
```

If their page already has heroMark with different name (e.g., markRow), integration needed. I'll name it heroMark per spec (spec calls it heroMark(row)). OK.

Aim text: whereAim(key). Integration with existing dispatcher unknown. Let me look at the evidence again: clicking produced the request — takeFor works. Hover aim: unknown whether their dispatcher computes text or the page has an aimText function. The user's listed helpers include aim — "aim writes an explanation". So aim(text). The dispatcher: does it exist? The spec says handlers delegated on document — describing required behavior. Given the live page already delegates clicks (evidence), hover likely delegated too, with some text resolver. Since I must deliver a working rail and can't see the resolver, the safest drop-in is to include my own delegated aim handling for [data-aim] marks whose key starts with zone|/pad|, plus NOT touching click (existing takeFor handles it). Double-aim risk: if existing dispatcher also resolves zone| aims with old broken text, both run; last writer wins per event order — both listeners on document fire in registration order; mine registered later (my block later in file?) writes after → correct text wins. If mine registers first, theirs overwrites with stale text. Hmm. But if their resolver is broken the same way (looking up bare "200"), its output for "zone|ZONE 200" would be a fallback text, overwriting mine. 

Alternative: don't add listeners at all; provide whereAim(key) and instruct: "wire your dispatcher's zone|/pad| cases to whereAim". The user said explain departures only; integration instructions in comments are fine. Actually, re-reading the user: "It must drop into your existing file and use your existing helpers (num, esc, params, setFilter, aim, aimHold, takeFor)." — the expectation is my code calls these, i.e., my code contains the delegation that calls aim/takeFor! "Handlers are DELEGATED ON document" is in the spec I must satisfy. If the page already had full delegation, the spec wouldn't need to restate it as a requirement of this build... but the spec is a description of the parent instrument's behavior "written by reading the parent instrument's behaviour rather than its source" — it records decisions, which may already be implemented page-wide. The user says "Two symptoms, one line" — the single bug is the prefix. If delegation were missing, clicking would do nothing at all (no request); but a request WAS made (rejected filter). So click delegation EXISTS. Hover aim: unknown, but plausibly exists too.

Decision: include a small delegated block for aim only for zone|/pad| keys, guarded by a flag, and use event delegation with capture? No... Let me think about harm: aim() "refuses to write while a HELD message is showing" — aim itself is idempotent-ish (writes text). Double-handling worst case: wrong/stale text shown on hover. Given the user's page: the old resolver (if any) would produce broken text; if my listener runs after theirs, mine fixes it. If before, theirs clobbers. To guarantee correctness, I could delegate in capture phase: document.addEventListener("pointerover", h, true) and focusin capture — capture runs before bubble targets' other document listeners? Both on document: capture-phase listener on document fires during capture (before target), bubble listener on document fires at bubble (after target). A capture listener on document fires BEFORE a bubble listener on document. So registering mine with capture=true guarantees mine runs last? No — capture on document runs FIRST in the event path (capture goes document→target), bubble listeners on document run LAST (bubble target→document). So a document-level bubble listener (theirs) runs after my document-level capture listener. Theirs would clobber mine. Ugh.

OK simplest robust approach: patch the resolver if it exists, else add delegation. But I can't know the resolver's name... 

You know what — I'm overthinking a component the user will integrate. The user asked for the rail block; they know their file; the two symptoms they'll check are rendering and the filter request, plus the sentence. The aim text is part of the spec'd behavior; I'll provide whereAim(key) AND a delegation for hover/focus aim guarded by `if(!window.__WHERE_AIM__)` that ONLY handles keys this rail owns (zone|, pad|). And in the explanation, one line: "If your document-level dispatcher already resolves zone|/pad| aim keys, delete the delegation block and point its cases at whereAim()." That's an integration note, not a spec departure. Good enough.

Hmm, actually — maybe their existing dispatcher calls aim() with text built from a function like aimFor(key) that has a switch, and the "zone|200" case broke because codes were bare. After my fix, keys are "zone|ZONE 200"; their old case matching `key.startsWith("zone|")` would still work structurally but its lookup `HERO.zones.find(z=>z.code===key.slice(5))` — if their resolver slices "ZONE 200" and finds in HERO.zones (now prefixed) it works! If their resolver looks up by bare code... unknown. Providing whereAim + optional delegation covers it.

Actually, let me reconsider once more. The cleanest deliverable that satisfies "delegated on document" per spec: one delegated block handling BOTH aim (pointerover/pointerout/focusin/focusout) and take (click + keyboard) for marks inside the where rail, but with take guarded against double-fire... The evidence PROVES take delegation exists (a request was made). Adding another click handler → double takeFor → double setFilter+search → double history entries. The undo uses history.back() — double entries break undo (needs two backs). That's a real regression. So: DO NOT add click handling. Only aim.

Similarly keyboard: spec "Enter or Space on any [data-take] fires takeFor" — existing delegation evidently handles click; does it handle keydown? The original shapes had tabindex=0 role=button and the page presumably handles keydown (other rails work). If their delegation handles keydown too, fine. If not... The evidence doesn't say. Their original code emitted tabindex="0" role="button" — so keyboard support was intended and likely handled globally. Skip; note nothing.

Now, also: "aim() refuses to write while a HELD message is showing: an undo outranks a hover." That's inside existing aim(). Not mine.

Now the click chain details: takeFor("zone|ZONE 200") → takeFilter("zone", key, z.label) → setFilter: #zone.value="ZONE 200"... These are existing page functions (takeFor exists; takeFilter maybe part of takeFor's dispatch). The label for aimHold comes from z.label — existing resolver uses glossary maybe. I provide data-take="zone|ZONE 200"; their takeFor parses field="zone", value="ZONE 200", sets #zone.value and searches with zone=ZONE 200 → server accepts (evidence: zone=ZONE%20100 returns 60966). ✔. The hint text at line 241: zone:"a zone, e.g. 300" — the placeholder example should maybe become "e.g. ZONE 300"? Not my scope; skip. Hmm, KINDLAB/HINTS zone hint "a zone, e.g. 300" — if a user types 300 the server rejects? Server regex expects ZONE prefix (the SELECT builds 'ZONE '||...). The filter compare zone=300 would find nothing... The user said scope is the WHERE rail. The p-search input for zone might need the prefixed example. Out of scope; but a one-line note could help. The user said "Explain only where you departed from the specification" — I could add a brief note. Maybe include in code comment near nothing... I'll add one sentence in the explanation: the zone search input's hint ("e.g. 300") now misleads since values are "ZONE 300" — flag it as adjacent fix outside this block. Actually careful — is that true? The server rejects zone=100 but accepts zone=ZONE 100. A user typing "300" into the zone search would get rejected. The parent instrument presumably autocompletes with prefixed values. Worth one line. Yes, include as a note.

Now, the "closed/rest" val: active zone label. Implement:

```js
function whereVal(){
  const v=params().get("zone");
  if(!v) return "all zones";
  const z=(HERO.zones||[]).find(x=>x.code===v);
  return z?z.label:v;
}
```

Spec says via code("part_location",v) — I'll use HERO.zones lookup (authoritative API label — consistent with the user's directive that API label is authoritative). Note as micro-departure? It matches the end (active zone label). Mention briefly.

Rest strip spans: sorted desc by n, flex Math.max(1,z.n), title `${label}: ${num(n)}`, class sel if taken===z.code. Also add class zone? The spec doesn't give the spans data-aim; they're not interactive (closed rail). Keep plain spans.

Also `.rail:not(.open):hover .strip span{background:#c3bbac}` CSS.

Now acSVG details — verbatim paths and order. Let me write it:

```js
function acSVG(){
  const zs=HERO.zones||[];
  const mx=Math.max(1,...zs.map(z=>+z.n||0));
  const zn=c=>{const z=zs.find(x=>x.code===c);return z?+z.n||0:0};
  const zl=c=>{const z=zs.find(x=>x.code===c);return (z&&z.label)?z.label:("ZONE "+c.replace(/^ZONE /,""))};
  const taken=params().get("zone");
  const shape=(c0,d)=>{
    const c=c0.replace(/b$/,"");
    return `<path d="${d}" fill="rgba(196,75,40,${(0.10+0.80*(zn(c)/mx)).toFixed(3)})" stroke="#7c746a" stroke-width="1.1" class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zl(c))}, ${num(zn(c))} reports"/>`;
  };
  const mark=(c,label)=>`data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(label)}, ${num(zn(c))} reports"`;
```

Hmm wait — spec shape() has class="zone" without taken handling; taken handled via syncControls after drawHero. But render-time is what I control. I'll include taken in class (matches original approach + syncControls spec outcome). Fine.

Gear group:

```html
<g class="zone${taken==="ZONE 700"?" taken":""}" ${mark("ZONE 700","Landing gear")} stroke="#7c746a">
  <path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/>
  <circle cx="118" cy="109" r="6" fill="${zoneFill700}"/>
  <circle cx="281" cy="111" r="7" fill="${...}"/>
  <circle cx="297" cy="111" r="7" fill="${...}"/>
</g>
```

Wait spec: "The two struts are ONE two-subpath path in strut grey #8d857b, unfilled, UNSHADED. Only the three wheels take the zone fill." And the group carries aria-label "Landing gear, N reports". The group is the zone mark (class zone, data attrs). Struts pointer-events: since group is interactive, struts within group are clickable too (part of mark) — fine.

Wheel stroke: inherited from group #7c746a, width default 1. OK per "(groups' children use the default 1)".

Doors group:

```html
<g class="zone${taken==="ZONE 800"?" taken":""}" ${mark("ZONE 800","Doors")} stroke="#7c746a">
  ${[96,190,348,424].map(x=>`<rect x="${x}" y="49" width="11" height="17" rx="3" fill="${f800}"/>`).join("")}
</g>
```

Lav group: rects x in [122,372], y=51, w=22, h=14, rx=3, fill f900.

Nacelle ellipse: `<ellipse cx="248" cy="99" rx="24" ry="9.5" fill="${f400}" stroke="#7c746a" stroke-width="1.1" class="zone..." ${mark("ZONE 400","Engine nacelles and pylons")}/>`.

Windows last:
```html
<g fill="#f7f5f0" stroke="none" opacity=".8">
  ${[150,164,220,234,248,300,314,328,400,414].map(x=>`<rect x="${x}" y="54" width="6" height="7" rx="2"/>`).join("")}
</g>
```

Wait — windows drawn over the shaded crown: crown top edge around y=44; windows at y=54..61 sit on the fuselage band between crown (44–66) and belly (66–88)? The crown path covers 44→66 area; belly 66→88. Windows y=54..61 → inside crown. ✔ "Paper-coloured windows punched over the shaded crown".

Hmm, one check: windows at x=150..420 — the crown spans 30→512ish. ✔.

Also note: nacelle ellipse cy=99 rx=24: x 224–272, y 89.5–108.5 — below wing line (wing path y 87–108, x 236–356). Nacelle overlaps wing area — drawn AFTER wing (order: 500 wing is #5, 600 #6, 400 #7) so nacelle sits on top of wing. ✔ document order per spec.

Wing (500) path M236 87 L356 87 L318 108 L264 108 Z — below belly line (88). "ZONE 600 above root" M262 80 L344 80 L322 90 L284 90 Z — straddling 80–90, overlapping belly bottom edge — drawn after belly, on top. ✔.

Now `open` ternary in shape(): I'll include tabindex="0" role="button" directly (shapes render only open). Fine.

SVG root: `<svg viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it">`. Note: role="img" on root with interactive children — aria quirk (role=img makes children presentational to AT in some browsers). The spec is verbatim; keep. (Not my fight.)

CSS .plane{width:100%;max-width:640px;height:auto}.

Legend markup per spec exactly: `<div class="lrow zone" data-aim="zone|CODE" data-take="zone|CODE" tabindex="0" role="button"><i style="background:rgba(196,75,40,${o(z.n)})"></i><span>${label}</span><b>${num(n)}</b></div>` — label escaped. Spec shows ${label} raw; esc for safety (labels come from API; esc is harmless). The spec's shape() uses esc for aria but legend shows ${label} — I'll esc it; not a meaningful departure.

Grid template for .lrow: 13px 1fr auto.

Pads: `<div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button"><i class="padi"></i><span>no location given</span><b>${num(...)}</b></div>` and outside: "place named in words, not as a zone". No data-take. cursor:pointer from .lrow — spec says clicking does nothing but leaves explanation; cursor pointer retained? Spec .lrow{cursor:pointer} applies to pads too; fine (hover aims).

Hmm wait — should pads have role="button" without action? Spec's legend row markup is for zone rows; pads "carry data-aim but NO data-take". Keep tabindex 0 role button for aim access via keyboard focus. OK.

zonenote CSS: .zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}.

Note: their existing CSS may already have .zonenote (old version). My block re-declares; later declaration wins if same specificity — the block should be appended, fine. But their old .zonenote might conflict with old markup classes (.zl etc.). I'm replacing markup too; old CSS for .zl/.zlrow/.swz becomes dead. I should note that the old classes (.ac, .zl, .zlrow, .swz, .hit) are superseded; leaving their CSS is harmless but suggest removing. One line in explanation. Also old .ac class vs new .plane.

Also note: their old buildZones used facetVals("zone") fallback; keep a similar fallback but normalize codes. facetVals returns [{code,n}?] with labels? Unknown shape; original code did `:facetVals("zone")` directly as src array (so facetVals returns [{code,...}] presumably). I'll keep: else facetVals("zone") then normalize each code via normZone and use facet label if any. Fine.

Reading sentence wrapper: spec open layout: `${reading("where",d)}` — page has reading() helper producing .reading block. My block should expose the sentence text function; the page's reading("where", d) presumably calls a per-rail sentence builder... Unknown. I'll provide `readingWhere()` returning the full HTML: `<div class="reading">${sentence}</div>`? Their old bodyWhere didn't include a reading paragraph at all (old code had no reading). The spec demands it. Since I can't see reading(), I'll build the wrapper myself:

```js
function readingWhereHTML(){
  const t=whereReadingText();
  return t?`<div class="reading">${t}</div>`:"";
}
```

With .reading CSS? Spec palette mentions "reading bg #faf7f3" — page likely has .reading styled. I'll include a minimal .reading style guarded? If page already styles .reading, my declaration could conflict... The palette says reading bg #faf7f3 — I'll include `.reading{background:#faf7f3;...}`? Risky to restyle a shared class used by other rails. Better: use the page's .reading class unstyled in my block (assume exists) — the spec's `.rail>.reading{grid-column:2}` implies .reading exists page-wide. So just emit `<div class="reading">…</div>`. And grid-column placement: ".rail>.reading{grid-column:2}" — reading is a sibling of .track inside .rail, not inside track. My bodyWhere returns track + reading; the page's open-rail wrapper places them inside .rail.open. Since existing page composes rail = gut + track + reading presumably via drawHero: bodyWhere returns the body (track) and reading separately? Their old bodyWhere returned only track. Hmm. The open layout spec shows .rail containing gut, track.two (art+legend), then reading. Their drawHero likely does `gut + body() + reading?` — unknown. To be safe, bodyWhere returns `${trackTwo}${readingHTML}` — if their wrapper appends reading itself, we'd get two readings... Can't know. I'll make bodyWhere return track + reading and note it. Actually — I'll export both: bodyWhere() (track only, drop-in replacement for existing) and whereReadingHTML() (to append where their other rails put reading), and have bodyWhere NOT include reading? Then reading never shows unless wired. Hmm.

The user's old bodyWhere ends without reading; the old page evidently had no reading sentence in this rail (it's part of the rebuild). The spec's layout: `${art}<div>${legend}${note}</div>` inside track.two, then `${reading("where",d)}` — a page-level helper reading(field, d). The user's file may already have reading() (other rails use it: RAILS with reading sentences). Given spec references it as existing page helper, I'll call `reading("where", HERO.raw)` if typeof reading==="function", else inline my own .reading div. Defensive:

```js
const readHTML = (typeof reading==="function") ? reading("where", HERO.raw||{}) : whereReadingHTML();
```

Hmm, reading("where",d) probably looks up a per-rail sentence function by rail id — maybe READING["where"](d). Can't know. Simplest robust: always use my own `whereReadingHTML()` producing `<div class="reading">…</div>`. If page also injects one, minor duplication the integrator removes. I'll include reading inside bodyWhere's return and mention it. And add minimal .reading CSS? The palette lists reading bg — the page has it. Skip CSS; but to be safe include a fallback: `.rail .reading{...}`? No — shared class; if page lacks .reading styling the paragraph looks plain but readable. Acceptable. Actually, let me include a scoped fallback: `#hero .reading{background:#faf7f3;border:1px solid var(--line);border-radius:6px;padding:10px 12px;font-size:12.5px;color:var(--smoke)}` — hmm if page already styles .reading differently, my scoped rule could fight. I'll skip styling .reading entirely and note the assumption (one line). Hmm, the spec palette says "reading bg #faf7f3" — that's page-level. Skip.

bodyWhere full:

```js
function bodyWhere(){
  const art=whereArt();
  return `<div class="track two">${art}<div>${legendHTML()}${zonenoteHTML()}</div></div>${whereReadingHTML()}`;
}
```

And gut: the page builds gut (q WHERE / pn / val). Their old bodyWhere had no gut, so page handles gut. The rest-state rail: provide restWhere() full markup (since spec gives it verbatim incl. onclick setHero) — the page's closed-rail renderer may already call a per-rail rest builder. Include restWhere() as the closed-state renderer.

Now numbers: num() exists (they use num already). esc() exists. params() exists. setFilter, aimHold, takeFor exist (not directly called by me except via attributes; takeFor called by delegation — existing). aim/aimHold called by... my delegation for aim calls aim(text). If I skip delegation, aim/aimHold aren't called by my block at all. The user listed them as helpers to use — suggesting my block should contain the aim delegation. OK final decision: include a guarded aim delegation (pointerover/pointerout/focusin/focusout) for [data-aim] marks whose key starts with zone| or pad|, calling whereAim → aim(text) / aim(""). Guard flag to avoid duplicate install. Do NOT delegate clicks/keys (existing). Also provide whereAim for their dispatcher if they prefer wiring it there — one comment line.

Hold on, one more consideration on the click chain: `setFilter: #zone.value = "ZONE 200"` — takeFor parses "zone|ZONE 200" splitting on first "|": field="zone", value="ZONE 200". ✔. The aimHold message: `narrowed to ${label}. <button class="undoit" onclick="history.back();unaim()">undo</button>` — produced by their takeFilter presumably. Not mine.

Now check #1 again: "the seven paths must show at least four visibly different opacities, and ZONE 200 must be the darkest." With correct data: 0.900 (200), 0.677 (100), 0.317 (800), 0.204 (500), 0.203 (600), 0.187 (300), 0.161 (400), 0.139 (700), 0.131 (900). ZONE 200 darkest ✔. Four+ visibly different ✔ (0.90 vs 0.68 vs 0.32 vs 0.20 vs 0.13).

Check #2: clicking crown → data-take="zone|ZONE 200" → takeFor → setFilter zone=ZONE 200 → request zone=ZONE%20200 → total 84453 ✔.

Check #3: sentence — computed. zs desc: 200 (84453) first, label "Upper fuselage" from API. zoned=212940. "Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA's numbered zones, or 39.7%. Those numbers are what this diagram can place, and they are 12.1% of the selection. Another 1,454,504 do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them. Only 90,383, 5.1%, give no location at all. It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits."

Wait spec: `+ if(other_location) ` Another ${num(worded)} do say where...`` — worded = other_location. ✔. num(1454504) → "1,454,504" presumably (num formats with commas — their num produced 84,453 etc.). ✔.

&rsquo; literal entity in "FAA&rsquo;s" in the reading sentence; straight apostrophe in zonenote "FAA's". Note the difference! Reading: "the FAA&rsquo;s numbered zones" (entity). Zonenote: "one of the FAA's numbered zones" (straight '). Follow exactly.

Also reading first sentence: "Those numbers are what this diagram can place, and they are ${pct(zoned,tot)}% of the selection." ✔.

Guards: return "" if total is 0 or zones is empty. Also if zs[0].n===0? Not specified; if all zones zero, sentence would say "X accounts for 0 of the 0 reports..." — spec only guards total/zones-empty. Keep literal. Hmm — but with a filter yielding no zone data, HERO.zones might still have nine rows with n=0 (API "ALWAYS all nine"). Then sentence reads oddly ("accounts for 0 of the 0 reports"). Spec says guard only total 0 / zones empty. But maybe add guard zoned>0? That's a departure... The spec explicitly states when it returns ""; adding zoned guard deviates. But actually wait: if total>0 but zoned=0 (e.g., filtered subset with no zoned rows), the sentence is garbage. The parent instrument's spec says what it says. I'll add the zoned>0 guard and flag it as a deliberate small departure? Hmm... "Where it states a number, a string or a path, that is load-bearing... Where it states a reason, you may reach the same end your own way." The guard list is behavioral. I'll follow spec exactly (only total/zones guards) — safer relative to instructions. Actually hmm, let me reconsider: with a filter like operator=X, HERO.raw is the filtered hero data; zones would have real counts. zoned=0 with total>0 is an edge case (selection has rows but none zoned). The old page's buildZones yields zeros → flat rendering. The spec was written from the parent instrument; if the parent guards only total/empty, match it. Keep spec. (I might add a tiny note? No — keep departures list minimal and focused: the ones I actually make.)

Departures I'm actually making — let me tally as I write:

1. aim delegation included with install-guard + whereAim exported, because I can't see the existing dispatcher; if it already resolves zone|/pad|, wire there and delete mine. (Integration note.)
2. val in the closed gutter resolved from HERO.zones label rather than code("part_location",v) — same end, avoids depending on a helper outside the listed set; API label authoritative.
3. pct implemented locally as pctOf with the exact specified semantics (in case page lacks pct).
4. heroMark/unmark included per spec's reverse-link section (querySelectorAll), since the aircraft they target is being replaced — if page already defines heroMark, replace it with this one.
5. Phone pads: spec CSS defines .phcell.pad but the 3x3 grid lists only zones; I append the two pads as a trailing row (no data-take) so the phone shows the same "cannot be drawn" explanation. Flag this.
6. Taken classes rendered at draw time in addition to syncControls — belt and braces; no departure really.
7. The old classes (.ac/.zl/.zlrow/.swz/.hit) and old CSS become dead; new CSS included; suggest deleting old. Note.

Hmm, also — "ZONE_DESC" and zoneDesc: old code had ZONE_DESC with descriptions shown in legend (.zld). New spec legend has no description column (13px 1fr auto: swatch, label, count). So drop ZONE_DESC entirely? The spec's legend rows: swatch, label, b count. No desc. So my block shouldn't include ZONE_DESC. But old code's zoneDesc is used elsewhere? Only in old bodyWhere. I'll drop ZONE_DESC from my block and let the old constant stay (harmless) or note removal. Since I'm "replacing the zone constant", I'll replace ZONE_ORDER with ZONE_CODES (prefixed) and drop ZONE_DESC (not needed). But zoneDesc() function references ZONE_DESC — if I remove the constant but old zoneDesc remains elsewhere, reference to ZONE_DESC breaks (ReferenceError at call time). zoneDesc was used only in old bodyWhere (being replaced). But if some other code calls zoneDesc... unlikely. Safer: keep ZONE_DESC defined? The spec says the legend has no descriptions; keeping ZONE_DESC dead is harmless and avoids breaking zoneDesc. I'll not include ZONE_DESC and note that ZONE_DESC/zoneDesc (and the old ZONE_ORDER) should be deleted with the old rail. Or include a `zoneDesc` shim? No. Note it.

Also zoneLabel: old zoneLabel(c) uses bare code glossary. My buildZones uses API label; fallback calls zoneGloss(bare). I'll implement local `zoneLabelFor(code)` that strips prefix. Keep old zoneLabel untouched for other callers (search hint?).

Now ZONE_CODES constant name: spec calls it _ZONE_ORDER server-side; my old code called it ZONE_ORDER. I'll keep name ZONE_ORDER but with prefixed values (drop-in). 

```js
const ZONE_ORDER=["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500","ZONE 600","ZONE 400","ZONE 700","ZONE 900"];
```

Note the comment: order is frequency-ish, fixed, NOT numeric; ties in the legend keep this order (stable sort).

buildZones:

```js
function buildZones(){
  const norm=v=>{const m=/^Z(?:ONE|N)?\s*([1-9])00$/i.exec(String(v==null?"":v).trim());return m?("ZONE "+m[1]+"00"):null};
  let src=(HERO.raw&&HERO.raw.zones)?HERO.raw.zones:facetVals("zone");
  const by=new Map();
  (src||[]).forEach(z=>{
    const code=norm(z.code??z.zone??z.value);
    if(!code)return;
    by.set(code,{code,n:+(z.n??z.count??0)||0,label:String(z.label??z.name??"")});
  });
  return ZONE_ORDER.map(c=>{
    const z=by.get(c);
    return {code:c,n:z?z.n:0,label:(z&&z.label)?z.label:zoneGloss(c.replace(/^ZONE /,""))||("ZONE "+c.slice(5))};
  });
}
```

Wait: +z.n — the API n is a number already; +(...)||0 fine. z.label might be non-string; String() it. If label empty → fallback glossary→"ZONE xxx". ✔ API label authoritative when present.

facetVals fallback: returns array possibly with {code,n} — normalized too. OK.

Ramp helpers:

```js
const zMax=()=>Math.max(1,...(HERO.zones||[]).map(z=>+z.n||0));
const zCount=c=>{const z=(HERO.zones||[]).find(x=>x.code===c);return z?+z.n||0:0};
const zLabel=c=>{const z=(HERO.zones||[]).find(x=>x.code===c);return (z&&z.label)?z.label:("ZONE "+String(c).replace(/^ZONE\s+/,""))};
const zFill=(n,mx)=>`rgba(196,75,40,${(0.10+0.80*(n/mx)).toFixed(3)})`;
```

Comment: linear in the raw count, rescaled each render against the current selection's busiest zone; pure opacity of --rust over --paper.

acSVG (write carefully, verbatim paths):

```js
function acSVG(){
  const mx=zMax(), taken=params().get("zone");
  const atr=c=>`class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"`;
  const f=c=>zFill(zCount(c),mx);
  const shape=(c,d)=>`<path d="${d}" fill="${f(c)}" stroke="#7c746a" stroke-width="1.1" ${atr(c)}/>`;
  return `<svg viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it">`
    + shape("ZONE 100","M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z")
    + shape("ZONE 200","M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z")
    + shape("ZONE 300","M452 44 L492 7 L518 7 L523 41 Z")
    + shape("ZONE 300b","M512 48 L578 38 L580 47 L516 57 Z")
    + shape("ZONE 500","M236 87 L356 87 L318 108 L264 108 Z")
    + shape("ZONE 600","M262 80 L344 80 L322 90 L284 90 Z")
    + `<ellipse cx="248" cy="99" rx="24" ry="9.5" fill="${f("ZONE 400")}" stroke="#7c746a" stroke-width="1.1" ${atr("ZONE 400")}/>`
    + `<g ${atr("ZONE 700")} stroke="#7c746a"><path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/><circle cx="118" cy="109" r="6" fill="${f("ZONE 700")}"/><circle cx="281" cy="111" r="7" fill="${f("ZONE 700")}"/><circle cx="297" cy="111" r="7" fill="${f("ZONE 700")}"/></g>`
    + `<g ${atr("ZONE 800")} stroke="#7c746a">${[96,190,348,424].map(x=>`<rect x="${x}" y="49" width="11" height="17" rx="3" fill="${f("ZONE 800")}"/>`).join("")}</g>`
    + `<g ${atr("ZONE 900")} stroke="#7c746a">${[122,372].map(x=>`<rect x="${x}" y="51" width="22" height="14" rx="3" fill="${f("ZONE 900")}"/>`).join("")}</g>`
    + `<g fill="#f7f5f0" stroke="none" opacity=".8">${[150,164,220,234,248,300,314,328,400,414].map(x=>`<rect x="${x}" y="54" width="6" height="7" rx="2"/>`).join("")}</g>`
    + `</svg>`;
}
```

Wait: spec shape() resolves c=c0.replace(/b$/,"") — so "ZONE 300b" → "ZONE 300" for fill/aim/take/aria. My shape(): I pass "ZONE 300b" but atr uses c directly — need the strip! Fix:

```js
const shape=(c0,d)=>{const c=c0.replace(/b$/,"");
  return `<path d="${d}" fill="${f(c)}" stroke="#7c746a" stroke-width="1.1" class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"/>`};
```

So both 300 paths get identical fill/aim/take/tabindex/label, and both get .taken when ZONE 300 taken. ✔ "Both are separately focusable" — yes, two tab stops.

But wait: the 300b path ALSO needs class "zone" — included in shape(). ✔. And for taken: taken===c where c="ZONE 300" for both. ✔.

Hmm — taken from params().get("zone"): value "ZONE 300". ✔.

For ellipse/groups I use atr(c) with real codes. ✔.

Also nacelle: spec ellipsis `<ellipse cx="248" cy="99" rx="24" ry="9.5" .../>` with class zone etc. My version ✔. Stroke #7c746a width 1.1 ✔.

Gear: struts path — stroke #8d857b width 3 fill none; wheels fill f(700), stroke inherited #7c746a from group (width default 1). Wait — group has stroke="#7c746a"; struts override stroke+width; wheels inherit stroke #7c746a width 1 (default since not set). Spec: "groups' children use the default 1". ✔.

But hmm — the hover CSS: .zone:hover{stroke:var(--rust);stroke-width:2.2} — applies to the g; children with explicit stroke (struts) keep grey; wheels inherit rust 2.2. Nice.

Doors rects: fill f(800), stroke inherited. ✔.

Windows: opacity .8 paper fill, no stroke, pointer-events? They're drawn last, covering parts of crown at y 54–61; they'd intercept pointer events over the crown strip! Rects without pointer-events="none" would block hovering the crown beneath. The spec doesn't mention pointer-events... The parent presumably had them not blocking? Hmm — "decoration only, no zone, no interaction". If they intercept pointer events, hovering a window shows nothing (windows have no data-aim) — the crown beneath doesn't get hover. That would annoy. Should I add pointer-events="none"? Spec says "decoration only, no interaction" — adding pointer-events="none" enforces exactly that. I'll add it. Is that a departure? It implements "no interaction" faithfully. I'll add without flagging... Actually flag-worthy? Minor; I'll mention briefly in the departures line about phone pads? Keep departures list tight: I'll add pointer-events="none" and note it in one clause. Hmm, the spec verbatim gives `<g fill="#f7f5f0" stroke="none" opacity=".8">` — adding pointer-events attr modifies the verbatim string. "Where it states a number, a string or a path, that is load-bearing and must survive." The g's attributes are stated... adding an attribute doesn't remove stated ones. I'll add it — hover usability wins; note it.

Wait, actually — do I know windows intercept? SVG rects do receive pointer events by default (visiblePainted). Yes they'd block. Add pointer-events="none".

Legend HTML: sorted desc, stable ties keep ZONE_ORDER. Build with index tiebreak to be safe across engines (stable sort guaranteed in modern JS, but explicit tiebreak is cheap):

```js
function zonesDesc(){
  const zs=(HERO.zones||[]).map((z,i)=>({z,i}));
  zs.sort((a,b)=>(b.z.n-a.z.n)||(a.i-b.i));
  return zs.map(x=>x.z);
}
```

Legend:

```js
function legendHTML(){
  const mx=zMax(), taken=params().get("zone");
  const rows=zonesDesc().map(z=>`
    <div class="lrow zone${taken===z.code?" taken":""}" data-aim="zone|${z.code}" data-take="zone|${z.code}" tabindex="0" role="button">
      <i style="background:${zFill(z.n,mx)}"></i><span>${esc(z.label)}</span><b>${num(z.n)}</b></div>`).join("");
  const pads=`
    <div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button"><i class="padi"></i><span>no location given</span><b>${num(HERO.no_location||0)}</b></div>
    <div class="lrow zone" data-aim="pad|outside" tabindex="0" role="button"><i class="padi"></i><span>place named in words, not as a zone</span><b>${num(HERO.other_location||0)}</b></div>`;
  return `<div class="legend">${rows}<div class="lsplit"></div>${pads}</div>`;
}
```

Spec: "then <div class='lsplit'></div>, then TWO pad rows". Wrap in a container div (the open layout has `<div>${legend}${note}</div>`). I'll return rows+split+pads without extra wrapper? bodyWhere wraps: `<div>${legendHTML()}${zonenoteHTML()}</div>`. Keep legendHTML returning the concatenation; fine.

zonenoteHTML per spec (rendered only when unzoned>0), wrapped in div.zonenote:

```js
function zonenoteHTML(){
  const zs=HERO.zones||[];
  const placed=zs.reduce((s,z)=>s+(+z.n||0),0);
  const unz=HERO.unzoned!=null?+HERO.unzoned:Math.max(0,(+TOTAL||0)-placed);
  if(!(unz>0))return "";
  return `<div class="zonenote">The aircraft above counts only the ${num(placed)} reports that use one of the FAA's numbered zones. In another ${num(+HERO.other_location||0)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(+HERO.no_location||0)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.</div>`;
}
```

With the two source comments placed above the function. ✔.

Reading:

```js
function whereReadingText(){
  const zs=zonesDesc();
  const tot=+TOTAL||0;
  if(!tot||!zs.length)return "";
  const zoned=zs.reduce((s,z)=>s+(+z.n||0),0);
  const p=(a,b)=>b>0?(Math.round(a/b*1000)/10).toFixed(1):"0.0";
  let t=`${zs[0].label} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${p(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${p(zoned,tot)}% of the selection.`;
  const worded=+HERO.other_location||0, blank=+HERO.no_location||0;
  if(worded)t+=` Another ${num(worded)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.`;
  if(blank)t+=` Only ${num(blank)}, ${p(blank,tot)}%, give no location at all.`;
  t+=` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.`;
  return t;
}
```

Wait — spec says zs[0].label — should it be escaped? It's interpolated into HTML; esc(zs[0].label). Labels like "Stabilisers (tail)" fine; esc harmless. Use esc. Hmm spec shows ${zs[0].label} raw; esc is safe. Use esc.

Also &rsquo; entity — in a template literal, fine, emitted literally into HTML. ✔.

whereReadingHTML:

```js
function whereReadingHTML(){
  const t=whereReadingText();
  return t?`<div class="reading">${t}</div>`:"";
}
```

Rest state:

```js
function restWhere(){
  const taken=params().get("zone");
  const v=taken?((HERO.zones||[]).find(z=>z.code===taken)||{}).label||taken:"all zones";
  const strips=zonesDesc().map(z=>`<span style="flex:${Math.max(1,z.n)}" title="${esc(z.label)}: ${num(z.n)}" class="${taken===z.code?"sel":""}"></span>`).join("");
  return `<div class="rail" data-rail="where" onclick="setHero('anatomy')"><div class="gut rest"><span class="q">WHERE</span><span class="val">${esc(v)}</span></div><div class="track"><div class="strip">${strips}</div></div></div>`;
}
```

Phone:

```js
function phZones(){
  const mx=zMax(), taken=params().get("zone");
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],["ZONE 500","ZONE 400","ZONE 600"],["ZONE 300","ZONE 700","ZONE 900"]];
  const cell=c=>{
    const n=zCount(c);
    return `<button type="button" class="phcell${taken===c?" taken":""}" style="--f:${(0.10+0.80*(n/mx)).toFixed(3)}" data-aim="zone|${c}" data-take="zone|${c}" aria-label="${esc(zLabel(c))}, ${num(n)} reports">${esc(zLabel(c))}<b>${num(n)}</b></button>`;
  };
  const pad=(k,txt,n)=>`<button type="button" class="phcell pad" data-aim="pad|${k}" aria-label="${txt}">${txt}<b>${num(n||0)}</b></button>`;
  return `<div class="phgrid">${grid.flat().map(cell).join("")}${pad("nowhere","no location given",+HERO.no_location||0)}${pad("outside","place named in words",+HERO.other_location||0)}</div>`;
}
```

Wait — pad aim text differs from cell text; pad label on phone: use the legend pad labels: "no location given" and "place named in words, not as a zone". Keep those strings. On phone maybe shorter; spec doesn't give phone pad labels; reuse legend strings. Hmm "place named in words, not as a zone" is long for a cell; fine, CSS wraps.

No reading/zonenote on phone: bodyWhere branch:

```js
function bodyWhere(){
  const phone=window.matchMedia&&matchMedia("(max-width:760px)").matches;
  if(phone)return `<div class="track">${phZones()}</div>`;
  return `<div class="track two">${acSVG()}<div>${legendHTML()}${zonenoteHTML()}</div></div>${whereReadingHTML()}`;
}
```

CSS:

```css
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}
.zone:focus-visible{stroke:var(--ink);stroke-width:3}
@media (forced-colors: active){.zone{stroke:CanvasText}[data-take].taken{outline:3px solid Highlight}}
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail>.reading{grid-column:2}
@media (max-width:760px){.rail .track.two{grid-template-columns:1fr}.rail>.reading{grid-column:1}}
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;padding:1px 4px;border-radius:3px}
.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.lrow.taken{background:rgba(196,75,40,.14);box-shadow:inset 2px 0 0 var(--rust)}
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}
.phgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.phcell{background:rgba(196,75,40,var(--f,.1));border:1px solid #7c746a;border-radius:6px;padding:10px 6px;font:inherit;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;gap:2px;align-items:flex-start;text-align:left}
.phcell b{font-size:12px;color:var(--smoke)}
.phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,var(--paper) 4px 8px)}
.phcell.taken{box-shadow:inset 0 0 0 2px var(--rust)}
```

Hmm .phcell font-size for label: set font-size:12.5px maybe. Keep reasonable.

Also focus-visible on .lrow and .phcell: background change covers aim; outline default retained? Spec only defines zone focus styles. Leave defaults for lrow (hover/focus bg). OK.

Note: `.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}` then a second rule `.zone:focus-visible{stroke:var(--ink);stroke-width:3}` — spec includes both; the comment: "a stroke-only ring vanishes on the busiest zones, which are the ones people reach for first" — hence the drop-shadow. Include the comment in CSS.

For groups (700/800/900) focus: drop-shadow on g applies to children — fine.

Aim delegation + whereAim:

```js
function whereAim(key){
  if(key&&key.indexOf("zone|")===0){
    const c=key.slice(5), n=zCount(c), placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0);
    const z=(HERO.zones||[]).find(x=>x.code===c);
    return `${esc(z&&z.label?z.label:c)} &middot; ${num(n)} of ${num(placed)} placed findings &middot; click to narrow`;
  }
  if(key==="pad|nowhere")return `${num(+HERO.no_location||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`;
  if(key==="pad|outside")return `${num(+HERO.other_location||0)} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`;
  return null;
}
```

placed recomputed from zones, not read from unzoned ✔.

Delegation (aim only):

```js
if(!window.__WHERE_AIM_WIRED__){
  window.__WHERE_AIM_WIRED__=true;
  const hit=e=>{const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;if(!n)return;const t=whereAim(n.getAttribute("data-aim"));if(t!=null)aim(t)};
  const off=e=>{const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;if(n&&whereAim(n.getAttribute("data-aim"))!=null)aim("")};
  document.addEventListener("pointerover",hit,true);
  document.addEventListener("focusin",hit,true);
  document.addEventListener("pointerout",e=>{const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;if(n&&whereAim(n.getAttribute("data-aim"))!=null)aim("")},true);
  document.addEventListener("focusout",...,true);
}
```

Hmm, pointerout fires when moving between children of the same mark too (target changes), causing aim("") flicker then re-aim. Better: on pointerout, check relatedTarget still inside the mark:

```js
document.addEventListener("pointerout",e=>{
  const n=e.target.closest&&e.target.closest("[data-aim]");if(!n)return;
  const rt=e.relatedTarget; if(rt&&n.contains(rt))return;
  if(whereAim(n.getAttribute("data-aim"))!=null)aim("");
},true);
```

And pointerover: if moving within the same mark (between children), re-aim same text — harmless (aim rewrites same). Could guard: if relatedTarget && n.contains(relatedTarget) return. Add for cleanliness.

Also aim(""): writing empty clears. aim() semantics unknown — aim(text) writes; aim("") probably clears. Their page has some clear mechanism. Risk: aim("") may write empty box; acceptable.

Keyboard Enter/Space: existing delegation handles (evidence: click works; keydown presumably too — original code emitted tabindex/role). Leave.

Hmm — one more thought on the aim delegation: should it be capture? If their dispatcher exists on document bubble for pointerover and writes stale text, order: my capture listener fires first (document capture), then target phase, then their document bubble — theirs wins. Damn. Bubble on document fires after capture on document. So if a stale resolver exists, mine can't win via capture. If I use bubble on document too, order = registration order; my block presumably loads after their code (appended) → mine registered later → mine fires later → mine wins. So bubble registration (no capture) is better for overwrite-guarantee IF their handler is also document-bubble. If their handler is on a container (bubble, earlier in path) — still before document. So document-bubble registered last wins. Choose bubble (no capture). But focusin — same logic.

But wait: if their resolver is CORRECT already (page-wide generic), double-write same text — fine.

OK, bubble it is.

Actually, hold on — maybe simpler and cleaner: don't add listeners at all; provide whereAim(key) AND a delegation for hover/focus aim guarded by `if(!window.__WHERE_AIM__)`... no wait, I already decided this. Moving on.

Actually, let me reconsider ONE more time whether to include the aim delegation at all... The user explicitly listed aim and aimHold among helpers my code should use. If my code never calls them, I ignored the instruction. The spec's interaction section demands the exact aim texts. So including whereAim + delegation is right. aimHold I don't call directly (takeFor's chain does). Fine — "use your existing helpers" means the block works with them, not that each is called. whereAim calls aim. OK.

Now heroMark:

```js
function heroMark(row){
  const raw=row&&row.getAttribute?row.getAttribute("data-zone"):(row&&row.dataset?row.dataset.zone:"");
  const m=/^ZONE \d00/.exec(String(raw||"").toUpperCase());
  unmarkZones();
  if(m)document.querySelectorAll(`[data-take="zone|${m[0]}"],[data-aim="zone|${m[0]}"]`).forEach(n=>n.classList.add("lit"));
}
function unmarkZones(){document.querySelectorAll(".zone.lit,.lrow.lit,.phcell.lit").forEach(n=>n.classList.remove("lit"));}
```

Wait spec: row carries data-zone from (PartLocation||"").toUpperCase().match(/^ZONE \d00/) — the row builder sets it; my heroMark reads it. The match yields "ZONE 200" or null. I re-run the regex defensively. Marks: shapes have class zone; legend rows lrow; phone cells phcell — all carry data-take/data-aim "zone|CODE". querySelectorAll with both attr selectors dedupes. Add .lit to each. .lit CSS for lrow? Spec defines .zone.lit only. Legend row lit: add `.lrow.lit{background:rgba(196,75,40,.10)}`? Spec doesn't define. "a zone lights on the aircraft AND in the legend at once" — the legend row needs a lit style. .lrow:hover gives .08 bg; lit could reuse. I'll add `.lrow.lit{background:rgba(196,75,40,.10)}`. Minor addition — note it? It's implied by "lights on the aircraft AND in the legend". I'll include without fuss (maybe one clause in departures).

Also note: if their existing heroMark(row) exists (old version), defining a new function with the same name replaces it (function declarations hoist; later file position wins). The user's file: heroMark may exist; my block redefines → fine as long as my block comes later. Note: "if you already have heroMark, let this one win / merge".

Integration notes to give (briefly): 
- call bodyWhere()/restWhere() where the old ones were called; 
- delete old acSVG/zonenoteHTML/buildZones/ZONE_ORDER (my block redefines ZONE_ORDER, buildZones, acSVG, zonenoteHTML, bodyWhere — same names! Good: same names = drop-in replacement. restWhere new; zonenoteHTML same name ✔; acSVG same name ✔; buildZones same ✔; ZONE_ORDER same name with new values ✔. zoneLabel kept (fallback). zoneDesc/ZONE_DESC become unused — delete or leave.

So naming: keep old function names for drop-in. whereAim, phZones, legendHTML, whereReadingHTML new. bodyWhere same name ✔.

One catch: my buildZones references facetVals — exists in their file ✔ (used in old code). zonenoteHTML used TOTAL — I use HERO.unzoned first, fallback TOTAL. ✔.

acSVG old signature acSVG(taken) — mine ignores arg; callers pass taken, harmless.

bodyWhere old signature none. ✔.

Now — also the spec says heroKind fallback etc. — page-level, exists (setHero exists). localStorage note — exists. Not mine.

NO_RAIL margin: page-level; note that `zone` must not be in NO_RAIL — it isn't (old behavior: after filtering by zone the rail still shows). Not mine; skip mention? Could add one line. Keep notes tight.

Search hint: HINTS.zone "a zone, e.g. 300" → values now prefixed; suggest "e.g. ZONE 300" — one line note. Also the zone <select> (opts skip list) — spec mentions the zone select in the search panel skips ZONE 000; page-level; the options presumably come from the API facet (prefixed) — fine after fix. Not mine.

Let me also double-check the legend tie-order claim: "Nine zone rows sorted DESCENDING by n (Array.sort is stable, so ties keep _ZONE_ORDER)." My zonesDesc uses index tiebreak — equivalent. ✔.

Check strip flex: flex:${Math.max(1,z.n)} — n numbers, e.g., flex:84453. With gap 1px and flexed spans, fine.

The .strip spans: empty spans need display block-ish — they're flex items, fine.

Closed rail onclick setHero('anatomy') — setHero exists ✔.

Also: the spec says the closed val uses code("part_location",v) — I use HERO.zones lookup. Also handles v not a zone code (shouldn't happen). ✔.

Now — the reading wrapper: spec `.rail>.reading{grid-column:2}` — reading is direct child of .rail. But my bodyWhere returns track+reading; who assembles .rail.open with gut? Their drawHero composes: gut + body + ...? If their composer wraps body's return inside .rail.open, then my reading inside body return would be inside .track? No — bodyWhere's return becomes children of .rail.open presumably alongside gut. If their composer is `${gut}${body()}`, my returned string `<div class="track two">…</div><div class="reading">…</div>` lands as two children of .rail.open → matches spec layout (reading direct child, grid-column:2). 

But if their composer wraps body in something else... can't know. Note it in one line: bodyWhere now also returns the reading paragraph appended after .track.two, matching `.rail>.reading{grid-column:2}`.

Wait, the CSS `.rail>.reading{grid-column:2}` — grid-column on a child of .rail: but .rail isn't display:grid... .track.two is the grid. Hmm — ".rail .track.two{display:grid;grid-template-columns:1fr 330px}" and ".rail>.reading{grid-column:2}" — that implies .rail itself is grid? If .rail were grid with two columns... Actually maybe the open rail is: .rail.open{display:grid;grid-template-columns:...}? The spec gives only these two rules; ambiguous. Under breakpoint "both collapse to a single column". Possibly .rail.open is grid: gut spans col 1, track col 1, reading col 2? Hmm: grid-template-columns 1fr 330px on .track.two puts art in col1, legend col2. And .rail>.reading{grid-column:2} would need .rail to be a grid too. Maybe .rail{display:grid} page-wide with gut in col 1 and content col 1, reading forced col 2 aligned with legend column? That only aligns if .rail's grid uses same columns... I'll include both rules verbatim as spec'd and add `.rail.open[data-rail="where"]{display:grid;grid-template-columns:1fr 330px;gap:18px}`? No — don't invent. The spec's CSS lines are what they are; the page's existing .rail styles handle placement. But if .rail isn't grid, grid-column:2 does nothing → reading sits full-width below track. Acceptable visually? The spec author read the parent's behaviour; these rules come from the parent. The parent's .rail probably IS display:grid (gutter column layout: gut | track). That makes sense! .rail{display:grid;grid-template-columns:GUT 1fr}: gut column + content column. Then .track.two is nested grid 1fr 330px, and .rail>.reading{grid-column:2} puts reading in the content column, but reading would be full content width... no wait, grid-column:2 of the RAIL grid = content column (full width), not the 330px sub-column. Hmm, then reading spans full content width. The note in spec open layout: `.rail>.reading{grid-column:2}` and "Under the breakpoint both collapse to a single column" — with .rail grid-template-columns varying. I think: .rail{display:grid;grid-template-columns:auto 1fr} (gutter | content) page-wide (gutter on left). Reading placed grid-column:2 → under the track in content column. Fine — that's consistent! And the reading is full content width (not just 330px). OK so I include `.rail>.reading{grid-column:2}` and the media collapse. The page's existing .rail grid handles the rest. My existing page: rails already render with gut + body — their .rail CSS exists. Include the two rules (scoped as spec'd) — safe.

Hmm, but careful: `.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}` — old page may already have .track.two for another rail ("two" used by other rails?). RAILS[1] only. Adding could affect other rails using .two... The class name "two" with 330px is spec'd for this instrument generally (the spec says .rail .track.two — rail-scoped, all rails). The parent uses it across rails. My page: old bodyWhere used track two already (line 691: `<div class="track two">`). So .track.two CSS likely already exists in their stylesheet! If I re-declare with 1fr 330px and their old was different (old zl column width?), mine wins if later. Their old layout: art (760-wide svg!) + .zl list. New: 640px plane + 330px legend. Re-declaring is intended (the spec's value). OK include.

Media query: `@media (max-width:760px){.rail .track.two{grid-template-columns:1fr}.rail>.reading{grid-column:1}}` — wait spec says "Under the breakpoint both collapse to a single column." But at ≤760 the art is replaced by phZones entirely (bodyWhere branch) — track.two not even rendered. So the media rule is belt-and-braces for 761–? no... bodyWhere picks phone at ≤760 at render time; CSS collapse handles any window narrower than render. Keep the media rule anyway (cheap).

Hmm wait, actually — should bodyWhere branch on width at render, or always render both and let CSS show/hide? Rendering both duplicates marks (data-take twice) → syncControls fine, but Tab order doubles, and hidden buttons focusable (display:none removes from tab order — OK if CSS display:none). CSS approach: render `${acSVG()}${phZones()}` and media-hide one. That keeps resize correct without re-render. But spec says "The aircraft is replaced by a 3x3 grid" — replacement. Render-time branch needs re-render on resize to swap. Parent instrument likely re-renders on resize or is fine. I'll do render-time branch + include a matchMedia change listener that re-renders IF the where rail is open AND a page render function exists. What's their render entry? setHero triggers render; search(0) re-renders. There must be something like render() or drawHero(). The spec mentions "drawHero" by name ("syncControls() after every drawHero"). So drawHero exists! I'll call drawHero() on mq change, guarded:

```js
try{
  const mq=matchMedia("(max-width:760px)");
  mq.addEventListener("change",()=>{ if(typeof drawHero==="function"&&(HERO&&HERO.kind?HERO.kind==="anatomy":document.querySelector('.rail.open[data-rail="where"],.rail[data-rail="where"].open')))drawHero(); });
}catch(_){}
```

HERO.kind — unknown; use DOM check: `.rail.open [data-rail="where"]`? The rail element has data-rail="where" and class open. `document.querySelector('.rail.open[data-rail="where"]')`. ✔ safe. If drawHero undefined (name differs), listener no-ops. Also matchMedia addEventListener support guard (Safari older needs addListener) — use both:

```js
const mq=matchMedia("(max-width:760px)");
const onmq=()=>{if(typeof drawHero==="function"&&document.querySelector('.rail.open[data-rail="where"]'))drawHero()};
mq.addEventListener?mq.addEventListener("change",onmq):mq.addListener&&mq.addListener(onmq);
```

Good.

Now — num(): their num(84453) → "84,453" (evidence sentence uses commas). ✔ existing.

esc(): existing.

Let me also make sure: buildZones maps over ZONE_ORDER — but what if API returns zones with n as strings? +(...). ✔.

zn for "ZONE 300b" handled by strip in shape(). zCount("ZONE 300") ✔.

aria on shape: `${esc(zLabel(c))}, ${num(zCount(c))} reports` ✔ spec format.

One more spec item: "syncControls() after every drawHero: n.classList.toggle('taken', p.get(field)===key)" — existing page function; my render-time classes cover; ALSO after undo (history.back + unaim) the page re-renders? unaim clears aim; history.back triggers popstate → their router re-renders. Existing behavior. Skip.

Spec: "Clicking an already-taken zone re-applies it. There is no toggle-off." — takeFor behavior; attributes unchanged. ✔.

Arrow keys do nothing — no arrow handlers in my block ✔.

Tab order: shapes in document order then legend rows — natural DOM order (SVG before legend in track; legend after) ✔. 300b is 4th ✔ (document order: 100,200,300,300b,500,600,400,700,800,900 — yes my order matches spec's list: "...300, 300b, 500, 600, 400, 700-group, 800-group, 900-group"). ✔.

Windows: no tabindex, decorative ✔; pointer-events none added.

Forced-colors block verbatim ✔.

Now assemble the final answer: one code block (JS + CSS), then "departures" explanation. The user said "Explain only where you departed from the specification and why. No preamble." So: code block first, then a short list of departures. Also maybe one or two integration notes (things outside the block that must change) — keep minimal: (a) HINTS.zone example string, (b) delete old ZONE_DESC/zoneDesc if unreferenced, (c) heroMark replacement, (d) reading placement. These are integration notes rather than departures; I'll fold into a short "notes" list — the user asked departures only; but these notes are genuinely useful and tiny. I'll keep them to 3–4 bullets max.

Let me now write the code fully and carefully.

```html
<style>
/* ---- WHERE rail (anatomy) ------------------------------------------ */
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
/* a stroke-only ring vanishes on the busiest zones, which are the ones
   people reach for first — hence the drop-shadow under the keyboard ring */
.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}
.zone:focus-visible{stroke:var(--ink);stroke-width:3}
@media (forced-colors: active){.zone{stroke:CanvasText}[data-take].taken{outline:3px solid Highlight}}
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail>.reading{grid-column:2}
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;padding:1px 4px;border-radius:3px}
.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.lrow.taken{background:rgba(196,75,40,.14);box-shadow:inset 2px 0 0 var(--rust)}
.lrow.lit{background:rgba(196,75,40,.10)}
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}
.phgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.phcell{background:rgba(196,75,40,var(--f,.1));border:1px solid #7c746a;border-radius:6px;
  padding:10px 8px;font-size:12.5px;color:var(--ink);cursor:pointer;text-align:left;
  display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.phcell b{font-size:12px;color:var(--smoke)}
.phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,var(--paper) 4px 8px)}
.phcell.taken{box-shadow:inset 0 0 0 2px var(--rust)}
@media (max-width:760px){.rail .track.two{grid-template-columns:1fr}.rail>.reading{grid-column:1}}
</style>
<script>
/* ======================================================================
   WHERE rail — “on the aircraft”
   ...
```

Wait — should I deliver <style>/<script> tags or bare? "One self-contained block of JavaScript and CSS" — I'll give CSS in a <style> block and JS in a <script> block within one fenced code block. Their file presumably has a style section and script section; tags make it copy-paste friendly. Fine.

JS content:

```js
/* ======================================================================
   WHERE rail — replaces ZONE_ORDER / buildZones / acSVG / zonenoteHTML /
   bodyWhere and adds the legend, reading sentence, phone grid and reverse
   link. THE codes ARE PREFIXED: the API sends 'ZONE 200', never '200'.
   ====================================================================== */

/* Fixed, frequency-ish order from the server's _ZONE_ORDER — NOT numeric,
   NOT sorted here. Legend ties keep this order (stable sort). */
const ZONE_ORDER=["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500",
                  "ZONE 600","ZONE 400","ZONE 700","ZONE 900"];

/* 'ZONE 200' | 'ZN 200' | 'zone 200' -> 'ZONE 200'; anything else -> null */
const zNorm=v=>{const m=/^Z(?:ONE|N)?\s*([1-9])00$/i.exec(String(v==null?"":v).trim());
  return m?("ZONE "+m[1]+"00"):null};
const zByCode=c=>((HERO.zones||[]).find(z=>z.code===c))||null;
const zCount=c=>{const z=zByCode(c);return z?(+z.n||0):0};
const zLabel=c=>{const z=zByCode(c);
  return (z&&z.label)?z.label:("ZONE "+String(c).replace(/^ZONE\s+/,""))};

/* THE RAMP — one function, no second colour. Linear in the raw count,
   rescaled on every render against the current selection's own busiest
   zone; pure opacity of --rust #c44b28 over --paper #f7f5f0. */
const zMax=()=>Math.max(1,...(HERO.zones||[]).map(z=>+z.n||0));
const zFill=(n,mx)=>`rgba(196,75,40,${(0.10+0.80*(n/mx)).toFixed(3)})`;

function buildZones(){
  const raw=(HERO.raw&&HERO.raw.zones)?HERO.raw.zones:facetVals("zone");
  const by=new Map();
  (raw||[]).forEach(z=>{
    const code=zNorm(z.code??z.zone??z.value);
    if(!code)return;                                  /* ZONE 000 never enters */
    by.set(code,{code,n:+(z.n??z.count??0)||0,label:String(z.label??z.name??"")});
  });
  /* the API label is authoritative (it is the FAA's own code table);
     glossary and 'ZONE xxx' are only for a facet that shipped no label */
  return ZONE_ORDER.map(c=>{
    const z=by.get(c), bare=c.slice(5);
    return {code:c,n:z?z.n:0,
            label:(z&&z.label)?z.label:(zoneGloss(bare)||("ZONE "+bare))};
  });
}
```

Hmm — facetVals("zone") return shape: old code did `:facetVals("zone")` as src directly (array of {code,n?...}). If facetVals returns something else (Map?), old code would break too — it treated it as array. Keep.

Note: old buildZones label: zoneLabel(c) with bare "200" — my fallback zoneGloss(bare). ✔.

zonenoteHTML — with the two comments:

```js
/* This used to read 'the others never say where', which was false: they nearly all say
   where, in words the diagram cannot place. Only the blank ones say nothing, and they are
   about one report in twenty-seven, not four fifths of the file. */
/* Zonder deze zin leest de alinea als een reeks voorbehouden. De tekening is een steekproef,
   maar wel een die laat zien waar het meeste stukgaat. */
function zonenoteHTML(){
  const zs=HERO.zones||[];
  const placed=zs.reduce((s,z)=>s+(+z.n||0),0);
  const unz=HERO.unzoned!=null?+HERO.unzoned:Math.max(0,(+TOTAL||0)-placed);
  if(!(unz>0))return "";
  return `<div class="zonenote">The aircraft above counts only the ${num(placed)} reports that use one of the FAA's numbered zones. In another ${num(+HERO.other_location||0)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(+HERO.no_location||0)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.</div>`;
}
```

acSVG:

```js
function acSVG(){
  const mx=zMax(), taken=params().get("zone");
  const f=c=>zFill(zCount(c),mx);
  const atr=c=>`class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}"
    tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"`;
```

Careful: template with newline inside attribute string would inject whitespace/newline into HTML attributes — fine in HTML but let me keep on one line to be clean.

```js
  const atr=c=>`class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"`;
  const shape=(c0,d)=>{const c=c0.replace(/b$/,"");          /* 'ZONE 300b' -> 'ZONE 300': one zone, two disjoint paths, same fill/aim/take/label */
    return `<path d="${d}" fill="${f(c)}" stroke="#7c746a" stroke-width="1.1" ${atr(c)}/>`};
  return `<svg viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it">`
    +shape("ZONE 100","M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z")
    +shape("ZONE 200","M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z")
    +shape("ZONE 300","M452 44 L492 7 L518 7 L523 41 Z")
    +shape("ZONE 300b","M512 48 L578 38 L580 47 L516 57 Z")
    +shape("ZONE 500","M236 87 L356 87 L318 108 L264 108 Z")
    +shape("ZONE 600","M262 80 L344 80 L322 90 L284 90 Z")
    +`<ellipse cx="248" cy="99" rx="24" ry="9.5" fill="${f("ZONE 400")}" stroke="#7c746a" stroke-width="1.1" ${atr("ZONE 400")}/>`
    +`<g ${atr("ZONE 700")} stroke="#7c746a"><path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/><circle cx="118" cy="109" r="6" fill="${f("ZONE 700")}"/><circle cx="281" cy="111" r="7" fill="${f("ZONE 700")}"/><circle cx="297" cy="111" r="7" fill="${f("ZONE 700")}"/></g>`
    +`<g ${atr("ZONE 800")} stroke="#7c746a">${[96,190,348,424].map(x=>`<rect x="${x}" y="49" width="11" height="17" rx="3" fill="${f("ZONE 800")}"/>`).join("")}</g>`
    +`<g ${atr("ZONE 900")} stroke="#7c746a">${[122,372].map(x=>`<rect x="${x}" y="51" width="22" height="14" rx="3" fill="${f("ZONE 900")}"/>`).join("")}</g>`
    +`<g fill="#f7f5f0" stroke="none" opacity=".8" pointer-events="none">${[150,164,220,234,248,300,314,328,400,414].map(x=>`<rect x="${x}" y="54" width="6" height="7" rx="2"/>`).join("")}</g>`
    +`</svg>`;
}
```

Wait — atr used in group: `${atr("ZONE 700")} stroke="#7c746a"` — but atr already emits class/attrs; adding stroke after is fine. But careful: for the group the struts child overrides stroke; wheels inherit.

Hmm — one subtlety: `.zone:hover` sets stroke on the g; the struts' inline stroke="#8d857b" attribute — CSS on parent g doesn't override child's presentation ATTRIBUTE? CSS `stroke` on the g applies to the g element; children inherit computed stroke ONLY if their own stroke is not set. Struts have stroke attribute set → they don't inherit; they stay #8d857b even on hover. That's per spec (struts strut grey, unshaded). ✔. Wheels: no stroke attr → inherit g's stroke → hover turns wheels rust 2.2. Nice.

Also for doors/lav groups: rects inherit stroke; hover → rust stroke width 2.2 around each rect. ✔.

Legend + sorting:

```js
function zonesDesc(){
  const zs=(HERO.zones||[]).map((z,i)=>({z,i}));
  zs.sort((a,b)=>((+b.z.n||0)-(+a.z.n||0))||(a.i-b.i));   /* stable: ties keep ZONE_ORDER */
  return zs.map(x=>x.z);
}
function legendHTML(){
  const mx=zMax(), taken=params().get("zone");
  const rows=zonesDesc().map(z=>`<div class="lrow zone${taken===z.code?" taken":""}" data-aim="zone|${z.code}" data-take="zone|${z.code}" tabindex="0" role="button"><i style="background:${zFill(z.n,mx)}"></i><span>${esc(z.label)}</span><b>${num(z.n)}</b></div>`).join("");
  const pads=`<div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button"><i class="padi"></i><span>no location given</span><b>${num(+HERO.no_location||0)}</b></div>`
    +`<div class="lrow zone" data-aim="pad|outside" tabindex="0" role="button"><i class="padi"></i><span>place named in words, not as a zone</span><b>${num(+HERO.other_location||0)}</b></div>`;
  return rows+`<div class="lsplit"></div>`+pads;
}
```

Reading:

```js
function wherePct(a,b){return b>0?(Math.round(a/b*1000)/10).toFixed(1):"0.0"}
function whereReadingHTML(){
  const zs=zonesDesc(), tot=+TOTAL||0;
  if(!tot||!zs.length)return "";
  const zoned=zs.reduce((s,z)=>s+(+z.n||0),0);
  const worded=+HERO.other_location||0, blank=+HERO.no_location||0;
  let t=`${esc(zs[0].label)} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${wherePct(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${wherePct(zoned,tot)}% of the selection.`;
  if(worded)t+=` Another ${num(worded)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.`;
  if(blank)t+=` Only ${num(blank)}, ${wherePct(blank,tot)}%, give no location at all.`;
  t+=` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.`;
  return `<div class="reading">${t}</div>`;
}
```

Rest:

```js
function restWhere(){
  const taken=params().get("zone");
  const v=taken?((zByCode(taken)||{}).label||taken):"all zones";
  const strip=zonesDesc().map(z=>`<span style="flex:${Math.max(1,z.n)}" title="${esc(z.label)}: ${num(z.n)}"${taken===z.code?' class="sel"':""}></span>`).join("");
  return `<div class="rail" data-rail="where" onclick="setHero('anatomy')"><div class="gut rest"><span class="q">WHERE</span><span class="val">${esc(v)}</span></div><div class="track"><div class="strip">${strip}</div></div></div>`;
}
```

Phone:

```js
function phZones(){
  const mx=zMax(), taken=params().get("zone");
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],      /* spatial, NOT frequency-sorted */
              ["ZONE 500","ZONE 400","ZONE 600"],
              ["ZONE 300","ZONE 700","ZONE 900"]];
  const cell=c=>{const n=zCount(c);
    return `<button type="button" class="phcell${taken===c?" taken":""}" style="--f:${(0.10+0.80*(n/mx)).toFixed(3)}" data-aim="zone|${c}" data-take="zone|${c}" aria-label="${esc(zLabel(c))}, ${num(n)} reports">${esc(zLabel(c))}<b>${num(n)}</b></button>`};
  const pad=(k,txt,n)=>`<button type="button" class="phcell pad" data-aim="pad|${k}" aria-label="${esc(txt)}">${esc(txt)}<b>${num(n||0)}</b></button>`;
  return `<div class="phgrid">${grid.flat().map(cell).join("")}`
       + pad("nowhere","no location given",+HERO.no_location||0)
       + pad("outside","place named in words, not as a zone",+HERO.other_location||0)
       + `</div>`;
}
```

grid.flat — modern fine.

bodyWhere:

```js
function bodyWhere(){
  const narrow=window.matchMedia&&matchMedia("(max-width:760px)").matches;
  if(narrow)return `<div class="track">${phZones()}</div>`;   /* no reading, no zonenote on the phone */
  return `<div class="track two">${acSVG()}<div>${legendHTML()}${zonenoteHTML()}</div></div>${whereReadingHTML()}`;
}
```

Reverse link:

```js
/* row -> aircraft. data-zone on the row comes from
   (PartLocation||"").toUpperCase().match(/^ZONE \d00/) — the client regex is
   stricter than the server's (needs the literal word "ZONE "), so a row read
   "ZN 100 FUS LOWER" lights nothing even though the server counted it. */
function heroMark(row){
  const v=row&&(row.dataset?row.dataset.zone:(row.getAttribute?row.getAttribute("data-zone"):null));
  const m=/^ZONE \d00/.exec(String(v==null?"":v).toUpperCase());
  unmarkZones();
  if(m)document.querySelectorAll(`[data-take="zone|${m[0]}"],[data-aim="zone|${m[0]}"]`)
    .forEach(n=>n.classList.add("lit"));   /* querySelectorAll on purpose: aircraft AND legend, both ZONE 300 paths */
}
function unmarkZones(){
  document.querySelectorAll(".zone.lit,.lrow.lit,.phcell.lit").forEach(n=>n.classList.remove("lit"));
}
```

Hmm — spec says the regex match result is the data-zone value (match returns e.g. "ZONE 200" since no capture group — /​^ZONE \d00/ has no groups, match returns full match string or null). My re-exec same. ✔.

Aim:

```js
function whereAim(key){
  if(key&&key.slice(0,5)==="zone|"){
    const c=key.slice(5), placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0);
    return `${esc(zLabel(c))} &middot; ${num(zCount(c))} of ${num(placed)} placed findings &middot; click to narrow`;
  }
  if(key==="pad|nowhere")return `${num(+HERO.no_location||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`;
  if(key==="pad|outside")return `${num(+HERO.other_location||0)} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`;
  return null;
}
```

Delegation:

```js
/* hover/focus aim, delegated on document, installed once. Clicks are NOT
   re-handled here: the page's existing takeFor delegation already fires and
   binding twice would run every search twice. */
if(!window.__WHERE_AIM__){
  window.__WHERE_AIM__=true;
  const mark=e=>{const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n)return;
    if(e.relatedTarget&&n.contains(e.relatedTarget))return;
    const t=whereAim(n.getAttribute("data-aim"));if(t!=null)aim(t)};
  const clear=e=>{const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n)return;
    if(e.relatedTarget&&n.contains(e.relatedTarget))return;
    if(whereAim(n.getAttribute("data-aim"))!=null)aim("")};
  document.addEventListener("pointerover",mark);
  document.addEventListener("pointerout",clear);
  document.addEventListener("focusin",mark);
  document.addEventListener("focusout",clear);
}
```

focusin/focusout relatedTarget: focusout relatedTarget = new focused element; if still inside mark (e.g., moving focus between the two ZONE 300 paths — different marks though), fine.

Resize swap:

```js
/* swap aircraft <-> phone grid without a reload */
try{
  const mq=matchMedia("(max-width:760px)");
  const swap=()=>{if(typeof drawHero==="function"&&document.querySelector('.rail.open[data-rail="where"]'))drawHero()};
  mq.addEventListener?mq.addEventListener("change",swap):(mq.addListener&&mq.addListener(swap));
}catch(_){}
```

Hmm — drawHero name: spec says "syncControls() after every drawHero" so drawHero exists. If HERO is rebuilt by drawHero... calling drawHero re-renders current hero. OK.

Wait, one thing: `const` redeclaration hazards. Their file already defines ZONE_ORDER (line 247) as const with bare codes! If my block is appended to the SAME script scope, `const ZONE_ORDER` redeclaration → SyntaxError, killing the whole script! CRITICAL. Same for buildZones (function — function redeclaration is allowed, later wins), acSVG (function OK), zonenoteHTML (function OK), bodyWhere (function OK). But const/let redeclarations throw. Their file: `const ZONE_ORDER=[...]` at line 247. My block must NOT redeclare ZONE_ORDER with const at top level of the same scope.

Options:
- Tell user to delete line 247-251 (ZONE_ORDER, ZONE_DESC) — integration instruction. Risky if they paste without reading.
- Assign without declaring: `ZONE_ORDER=["ZONE 200",...]` — assignment to existing const THROWS TypeError (Assignment to constant variable). Also bad.
- Wrap differently: use a different variable name entirely: `const WHERE_ZONES=[...]` and use it everywhere in my code. Then old ZONE_ORDER remains (dead, unused by my code). But zoneDesc/zoneGloss reference... zoneGloss independent. zoneDesc references ZONE_DESC — stays, unused. No collision! And functions: redeclaring functions is legal in sloppy mode (and even in modules? function redeclaration in same scope: allowed in sloppy script; in ES modules, redeclaring a function is a SyntaxError! If their file is a module... The user's file uses inline onclick attributes (setHero('anatomy') in HTML onclick) → functions must be global → it's a classic script, not a module. Function redeclaration OK.

But ZONE_ORDER: old code is const at top scope; my `const ZONE_ORDER` would throw. Using a NEW name (WHERE_ZONES) avoids collision entirely. But then old buildZones... my buildZones replaces old function (same name, later declaration wins — both function declarations: hoisting means LAST one in source order wins at call time. Actually with two function declarations of the same name in the same scope, the last one wins (its body overwrites earlier binding). Yes, later wins. So same-name function replacement works IF my block is after line ~700 in the same script. If the user pastes my block at the END of the script, all function redeclarations win. ✔.

But hmm — is their script one big classic script? They showed line numbers 240-709 continuous — one file. Inline onclick used in my restWhere (setHero) — global needed; classic script ✔.

So: use `const WHERE_ZONES` (new name) OR keep name ZONE_ORDER but with `var`? `var ZONE_ORDER=[...]` — var redeclaration with existing const in same scope → SyntaxError too (lexical redeclaration). Actually: `var x` + existing `const x` in same scope = SyntaxError. Yes.

So new name is required: WHERE_ZONES. Hmm, but spec says "the zone constant" — name flexibility fine. I'll name it ZONE_SEQ? Let me pick `WHERE_ZONE_ORDER`. Fine.

Similarly my helpers zNorm, zCount, zLabel, zByCode, zMax, zFill, zonesDesc, legendHTML, whereReadingHTML, wherePct, restWhere, phZones, whereAim, heroMark, unmarkZones — new names, no collision (heroMark might exist! If their file already has function heroMark, my later declaration wins — fine. If theirs is const heroMark=... → collision SyntaxError!). Ugh. Their old code shown doesn't include heroMark. The spec describes heroMark as parent behavior; their file may have it as function declaration (likely, given style — all their snippets are function declarations). Risk acceptable; note it: "if heroMark already exists as a const, delete the old one."

Also careful: my `const zNorm` etc. could collide with existing names? Unlikely (z-prefixed). But their file might have zl or others — zl was a CSS class in old bodyWhere; not JS. OK.

Also `pct` — I use wherePct, no collision. ✔.

Another collision: my acSVG no longer uses AC.* paths, ramp(), zoneFill(), zoneAria() — old helpers remain defined (unused) — fine, unless zoneFill etc. referenced elsewhere. Keep silent.

Also my bodyWhere uses zMax etc. — defined. And note the OLD ZONE_ORDER/ZONE_DESC (lines 247-253) become dead — recommend deleting; but leaving them causes NO error since I don't reference them. But wait — old zoneDesc function references ZONE_DESC — if ZONE_DESC stays, fine. I'm not deleting anything, so no breakage. ✔. And old buildZones replaced by mine (function redeclaration) — but WAIT: if old buildZones is a function declaration and mine too, and my block is LATER in source, mine wins. But old buildZones is CALLED during initial render — at that point the binding holds the last-declared function. ✔.

BUT — careful with `const WHERE_ZONE_ORDER` inside my block placed at end: buildZones references it — fine (TDZ only before execution; block executes at load, before any render call). ✔.

Also — `window.__WHERE_AIM__` guard: fine.

One more: my zonenoteHTML references HERO.unzoned — does their HERO hold the API response fields at top level? Old code used HERO.no_location, HERO.other_location, HERO.zones, HERO.raw — so HERO = response object (with .raw? old code: HERO.raw&&HERO.raw.zones — so HERO.raw is the API response and HERO.zones is derived (built by buildZones presumably: HERO.zones=buildZones()). And HERO.no_location — old zonenoteHTML used HERO.no_location directly — hmm, that suggests HERO (top-level) carries no_location... but HERO.raw is the API. Maybe their pipeline copies raw fields onto HERO: HERO.zones, HERO.no_location, HERO.other_location, and HERO.raw = full response. If HERO.no_location exists (old code used it), mine can too. But does HERO.unzoned exist? Unknown. My fallback computes from TOTAL. But what if HERO.no_location is undefined while HERO.raw.no_location exists? Old code used HERO.no_location||0 — if undefined, pads showed 0 (a bug? not reported). Hmm — the API response has no_location at top level of the response (d.no_location). Their HERO seems to be response + derived. To be robust:

```js
const D=()=>HERO.raw||HERO;
```

Use `const d=HERO.raw||HERO` inside functions for no_location/other_location/unzoned/total? Old code used HERO.no_location — I'll do: `const src=HERO.raw||HERO; const nl=+(src.no_location??HERO.no_location)||0;`. That covers both shapes. Similarly unzoned: src.unzoned ?? compute from (src.total??TOTAL) − placed.

TOTAL: old code used TOTAL global in zonenoteHTML — exists. Use src.total??TOTAL.

Let me define a small accessor:

```js
const heroD=()=>HERO.raw||HERO||{};
```

and in zonenoteHTML/reading use heroD().no_location etc. Also HERO.zones — is it set? Old acSVG used HERO.zones — yes, HERO.zones exists (set from buildZones somewhere). So HERO.zones is the BUILT zones (nine rows, prefixed after my fix). My zCount reads HERO.zones. ✔ — consistent with old code and with "rescaled against current selection's busiest zone".

But careful: buildZones reads HERO.raw.zones (API's nine) — ✔ evidence shows GET /api/hero returns zones array. ✔.

Also facetVals("zone") fallback — keep.

zonenote unzoned: `const u=src.unzoned!=null?+src.unzoned:Math.max(0,(+(src.total??TOTAL)||0)-placed);` ✔.

Reading tot: `const tot=+(src.total??TOTAL)||0;` ✔.

Now, pads in legend: old code used HERO.no_location||0; mine uses src.no_location ?? HERO.no_location. I'll write `const D=heroD()` inside each function.

Let me also double check `params()` — returns URLSearchParams of current filters presumably. ✔ used for taken.

Now think about "seven paths" in check #1 — "the seven paths must show at least four visibly different opacities". Shapes: 6 path elements + 1 ellipse + groups... "seven paths" maybe counting: belly, crown, fin, stabiliser, wing, above-root = 6 paths... plus? Maybe they count the nacelle ellipse as a shape → 7 filled zone shapes (100,200,300,300b,500,600,400). Whatever — ramp satisfies.

Also — check #1 says "ZONE 200 must be the darkest" — with default selection mx=84453 (ZONE 200) → alpha 0.900 max ✔.

Now double-check aria-label quoting: labels contain commas? "Stabilisers (tail)" fine; "Engine nacelles and pylons" fine. esc() handles quotes.

One more spec item: "HAND LINE: Click a zone on the aircraft to keep only what was found there." — that's the rail's hand line (gutter hint). Page-level (RAILS config)? The hand line presumably rendered in the gutter — existing page structure handles hand lines per rail config (RAILS[1]: gutter WHERE, subhead "on the aircraft", hero key "anatomy"). Since RAILS config exists in page, not my block. Skip — but maybe my bodyWhere should include the hand line? The old bodyWhere didn't. The spec lists it under the rail definition (page config). Leave; note? No — RAILS config is theirs. Skip silently.

"DEFAULT OPEN RAIL... localStorage IS written by setHero but deliberately NOT read at boot" — page boot logic, exists. Not mine.

MARGIN: "zone is NOT in NO_RAIL" — page config; nothing to do; maybe mention in notes: ensure NO_RAIL doesn't include zone (it shouldn't already). One line max... The user asked departures only; I'll add a tiny "wiring" note list with 3 items: (1) same-name functions override — paste after old definitions (or delete old ones), and if heroMark exists as const, remove it; (2) HINTS.zone example should read "e.g. ZONE 300" since values are prefixed now; (3) keep `zone` out of NO_RAIL (it already is). Keep it tight.

Wait, also: the old bodyWhere rendered `.zonenote` div unconditionally with old text; mine conditional. Fine.

Old CSS classes .zl,.zlrow,.swz dead — optional cleanup note (fold into note 1).

Now, the .track.two CSS: old page may already style .track.two differently — my later <style> wins at same specificity. ✔ (I re-spec exactly per spec).

One more detail — the spec legend row classes: `class="lrow zone"` — includes "zone" class so .zone:hover CSS (stroke...) applies?? .lrow.zone would get .zone:hover{stroke:var(--rust)} — harmless on HTML div. But .zone{cursor:pointer} fine. Why "zone" class? For syncControls/heromark selection (.zone.lit). Keep ✔. Note .zone:focus-visible{outline:none;filter:drop-shadow...} would apply to legend rows too! drop-shadow filter on an HTML div — creates a shadow around the box... and stroke:var(--ink) does nothing on div. outline:none removes focus indicator; drop-shadow 0 0 0 2px ink = a 2px ring around the row box (filter drop-shadow with 0 blur/0 offset 2px spread? drop-shadow(0 0 0 2px color) — actually drop-shadow's third param is blur; there's no spread in filter:drop-shadow! drop-shadow(offset-x offset-y blur color) — no spread parameter (that's box-shadow). drop-shadow(0 0 0 2px var(--ink)) → blur 0, offset 0 → shadow exactly behind element → INVISIBLE (hidden behind the element itself). Hmm! For SVG shapes with transparency it shows through/around shape silhouette. On HTML rows it does nothing. So .zone:focus-visible on legend rows: outline none + invisible shadow = NO focus indicator on legend rows! That's an a11y problem introduced by sharing the class. But spec says legend rows are `<div class="lrow zone" ...>` — verbatim. And .zone:focus-visible rules are verbatim. The parent instrument has this exact combo... maybe parent's .lrow:focus-visible bg change (.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}) IS the focus indicator. ✔ — .lrow:focus-visible gives bg change, so focus is visible. OK fine, spec'd. Keep.

Phone cells: class "phcell" — should they also carry "zone" class for .lit? unmarkZones includes .phcell.lit; heroMark adds .lit to [data-take=...] matches — phcell has data-take → gets .lit. .phcell.lit CSS? Not defined in spec; I'll add `.phcell.lit{box-shadow:inset 0 0 0 2px var(--rust)}` same as taken. Fine (tiny addition).

Forced-colors: `[data-take].taken{outline:3px solid Highlight}` ✔ include verbatim.

Now — will `.zone:hover{stroke-width:2.2}` override the presentation attribute stroke-width="1.1"? Yes, CSS beats presentation attributes. ✔.

`.zone.taken` stroke-width 2.6 vs focus 3: focus rule later in sheet wins at equal specificity — both .zone classes: `.zone.taken` (0,2,0) vs `.zone:focus-visible` (0,2,0) — later wins → focus visible 3 when both. Spec order: focus rules last ✔ (I put them last).

transition:stroke .1s — verbatim ✔.

Check the drop-shadow rule placement: `.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}` then `.zone:focus-visible{stroke:var(--ink);stroke-width:3}` ✔.

Media collapse for track.two at ≤760: since bodyWhere switches to phgrid at ≤760 at render, the CSS collapse applies to 761+ renders resized down before a redraw — with my mq listener, redraw happens anyway. Keep rule per spec.

`.rail>.reading{grid-column:2}` — if .rail is display:block in their page, no effect; reading sits below track full width. Their page's rail layout — old bodyWhere had no reading so unknown. Spec gives the rule; include verbatim. If it misplaces, integrator adjusts. Fine.

Wait, actually — maybe I should look again: the open layout shows gut inside .rail too. If .rail were grid with columns [gutter, content], gut sits col 1, track col 2? But track spec is `.rail .track.two{grid-template-columns:1fr 330px}` — track itself two columns (art | legend). And reading grid-column:2 → reading in rail-grid column 2 = under track, spanning full content width (both art+legend columns)? No — rail grid col 2 is the content column (full width). Reading would be full content width. Hmm, but visually in the parent, is the reading under the whole track or under the legend? Spec order in layout listing: track.two then ${reading}. `.rail>.reading{grid-column:2}` — rail grid column 2. If rail grid is [auto,1fr], reading full content width. OK whatever — include verbatim; page's .rail CSS governs.

Hmm, but one risk: their page's .rail is NOT grid (old rails worked with gut as float/flex). Then grid-column:2 is inert — harmless. ✔.

Now the `<style>` — their page uses CSS vars --rust etc. defined globally ✔ (palette given). #7c746a, #8d857b, #d8d2c6 literals per spec.

Edge: `.lrow i` needs `display:block`? It's a grid item — fine.

Now the "reading" wrapper: spec `${reading("where",d)}` — page helper. I output my own `<div class="reading">`. If their page has .reading styled — good. If not, unstyled paragraph — acceptable. Note? I'll fold into a half-line note. Actually their file — RAILS with reading sentences exist for other rails? The reading sentence spec section says "THE READING SENTENCE" is part of this rail. Other rails likely have readings too (opRow suggests other rails exist with readings). So .reading CSS exists. Good, no note needed. Hmm, `.rail>.reading` implies reading is direct child — my bodyWhere returns it as sibling of track — drawHero composes `${gut}${body()}` presumably giving .rail.open > [gut, track, reading] ✔.

Now — one more possible collision: my function `restWhere` — check their file for existing rest renderers... unknown name; new name likely safe.

`zonesDesc`, `legendHTML`, `whereReadingHTML`, `phZones`, `heroMark`, `unmarkZones`, `whereAim`, `wherePct`, `zNorm`, `zCount`, `zLabel`, `zByCode`, `zMax`, `zFill`, `heroD` — new names. `heroD` maybe too generic; rename `whereD`. OK.

Also `WHERE_ZONE_ORDER` const. Let me also guard buildZones label fallback: zoneGloss exists (old). ✔.

Wait — old buildZones is referenced somewhere (HERO.zones=buildZones() presumably in their hero pipeline). Replaced function keeps signature ✔.

Also — HERO.zones might be set by their pipeline from buildZones() — after my fix HERO.zones rows have prefixed codes AND API labels. All my render helpers read HERO.zones ✔ consistent.

Now let me verify the reading sentence formatting once more against spec string:

`${zs[0].label} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${pct(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${pct(zoned,tot)}% of the selection.`

Mine matches. Then other_location branch: ` Another ${num(worded)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.` ✔. no_location: ` Only ${num(blank)}, ${pct(blank,tot)}%, give no location at all.` ✔. Always: ` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.` ✔.

Zonenote verbatim check: "The aircraft above counts only the {placed} reports that use one of the FAA's numbered zones. In another {other_location} the mechanic wrote where it was in plain words, such as the part or the system, and {no_location} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it." ✔ straight apostrophe.

Check pad row strings: `no location given`, `place named in words, not as a zone` ✔.

Pad aim strings exactly:
- nowhere: `${n} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft` ✔
- outside: `${n} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft` ✔

Zone aim: `${label} &middot; ${num(z.n)} of ${num(placed)} placed findings &middot; click to narrow` ✔ — note &middot; entity in string (spec uses entity). Use "&middot;" literally ✔.

Click chain: takeFor exists. My data-take values: "zone|ZONE 200" ✔. takeFor splits on "|" — value contains a space, fine.

One question: does their takeFor/setFilter expect the zone value WITHOUT prefix and add it? No — evidence: page requested zone=100 (rejected) while correct is zone=ZONE 100 accepted. So pass prefixed ✔.

Keyboard: "Enter or Space on any [data-take] fires takeFor" — existing keydown delegation? If missing, legend rows (div role=button) won't fire on Enter. SVG shapes with tabindex — keydown needed. Their page: original code had tabindex=0 role=button on SVG paths — and spec says grammar delegated on document — the page must already have a keydown delegation (other rails work). Skip adding (double-fire risk). Hmm — but what if the page's keydown delegation exists but keys on old marks worked... fine. Skip.

Wait, actually, let me reconsider whether to also delegate Enter/Space — if the existing delegation only handles click via 'click' event, then keyboard was already broken before my change (not reported as broken... the user reported only shading and click-narrowing). Keyboard on SVG paths can't produce click without code. The user's symptom list doesn't mention keyboard. Given takeFor is delegated on document per spec (and evidence shows click works), and spec's keyboard line describes parent behavior — I'll trust the page has keydown handling (it was built to this grammar). No new listener. OK.

Also — after takeFor applies the filter, the page re-renders (search(0), showChange) → bodyWhere re-renders with taken set ✔.

Undo: aimHold with history.back() — existing.

Now write final HTML/CSS/JS block. Also add brief comments in code marking the three checks? Maybe small comments like "/* check 1 */" — no, keep clean; the explanation can mention.

Let me also reconsider: `const WHERE_ZONE_ORDER` — but spec named the constant as the thing to replace ("the zone constant"). Renaming to WHERE_ZONE_ORDER avoids the const collision — MUST explain this in departures/notes (important!). Because naively keeping `const ZONE_ORDER` would SyntaxError the entire script. This is a key integration note. Also instruct deleting old lines 247–253 (ZONE_ORDER, ZONE_DESC) as cleanup (optional since unused).

Hmm wait — actually, is old ZONE_ORDER referenced anywhere else in their file besides old buildZones? Lines 245-253 shown: ZONE_ORDER and ZONE_DESC definitions; old buildZones used ZONE_ORDER. zoneDesc used ZONE_DESC. If any OTHER code references ZONE_ORDER... can't know; likely only buildZones. After my replacement, old buildZones is overridden; if something else used ZONE_ORDER it'd still find the OLD const (bare codes) — untouched, no crash. ✔ safe.

Now — one more careful look at buildZones' facetVals fallback: old code: `HERO.raw.zones ? map : facetVals("zone")`. facetVals returns facet list for field "zone" — from search metadata; values probably prefixed ("ZONE 200") since server facet uses same keys. norm handles ✔. Labels from facet? maybe absent → fallback glossary ✔.

Write zonenoteHTML with heroD:

```js
function zonenoteHTML(){
  const D=HERO.raw||HERO||{};
  const placed=((HERO.zones)||[]).reduce((s,z)=>s+(+z.n||0),0);
  const unz=D.unzoned!=null?+D.unzoned:Math.max(0,+(D.total??TOTAL)||0-placed)... 
```

careful: `+(D.total??TOTAL)||0` precedence: (+(...))||0 fine. minus placed: `((+(D.total??TOTAL)||0)-placed)`.

```js
  const unz=D.unzoned!=null?+D.unzoned:Math.max(0,((+(D.total??TOTAL)||0))-placed);
  if(!(unz>0))return "";
  const ol=+(D.other_location??0)||0, nl=+(D.no_location??0)||0;
  return `<div class="zonenote">…FAA's…${num(placed)}…${num(ol)}…${num(nl)}…</div>`;
}
```

Reading similar: tot=+(D.total??TOTAL)||0; worded/nl from D.

Pad counts in legend: same D.

OK. Also — the API label check: buildZones label from raw zones; but HERO.zones built once per draw. If HERO.raw absent ( facet fallback) label from facet or glossary ✔.

Let me now also double check `atr` for groups: I place `${atr(c)} stroke="#7c746a"` — atr includes aria-label etc. Group content clickable ✔. But the group also has cursor via .zone ✔.

Nacelle ellipse placed AFTER wing per doc order — in my return: after shape 600 I emit ellipse (400), then gear (700), doors (800), lav (900), windows. ✔ matches spec order (…5 ZONE 500, 6 ZONE 600, 7 ZONE 400, 8 ZONE 700, 9 ZONE 800, 10 ZONE 900, 11 windows).

Hmm wait — spec order lists 5 ZONE 500 wing, 6 ZONE 600 above root, 7 ZONE 400 nacelle. Mine: shapes 100,200,300,300b,500,600 then ellipse 400 ✔.

viewBox "0 0 600 132" ✔. class "plane" ✔ (old CSS .plane max-width 640).

Old CSS had .ac for old svg — dead now.

Potential issue: `.rail .track.two` — old bodyWhere used track two with old svg 760x244; CSS maybe `.track.two{grid-template-columns:1fr 220px}` existing — my override 330px later in cascade wins (same specificity, later stylesheet). I'm putting my <style> after theirs (block appended) ✔. But if their <style> is AFTER the script in the file... The user pastes my block; I'll note "put the <style> after your existing styles".

Also: my acSVG has no width/height attributes ✔ spec.

One more a11y: svg role="img" with focusable children — in some browsers role=img flattens children. Parent spec'd it; keep.

Also should shapes have `<title>`? Old code had; spec's shape() has none — omit ✔ (aria-label suffices).

Let me now also sanity check the phone grid taken/taken classes and that phcell uses `<button type="button">` — spec says "3x3 grid of buttons" ✔. Buttons: need border reset (I set border:1px solid #7c746a). Default button font — set font:inherit... I set font-size 12.5. Add font:inherit then size. Fine.

Also phcell data-take → click delegation handles ✔. Pad phcell: data-aim only ✔.

Now departures list (final):

1. Constant renamed WHERE_ZONE_ORDER (values exactly the spec's _ZONE_ORDER). Reason: the old `const ZONE_ORDER` sits in the same top-level scope; redeclaring a const with the same name throws and would kill the whole script. Old ZONE_ORDER/ZONE_DESC/zoneDesc are now unused — safe to delete.
2. Added `pointer-events="none"` to the windows group so "no interaction" is literal — otherwise the paper rects swallow hover over the crown beneath.
3. Phone pads: the spec's grid lists only the nine zones but defines .phcell.pad, so I append the two pads (data-aim, no data-take) as a trailing row — keeps the "cannot be drawn" explanation reachable on the phone.
4. Aim wiring: clicks are NOT re-bound (the page's existing takeFor delegation provably fires — that's how the rejected zone=100 request happened; double binding would run every search twice). Hover/focus aim is bound once, guarded, and only resolves zone|/pad| keys via whereAim(); if your dispatcher already has those cases, point them at whereAim and delete the guarded block.
5. Closed-gutter val: resolved from HERO.zones' API label instead of code("part_location",v) — same end, and keeps the label authoritative per your note.
6. pct: implemented locally as wherePct with exactly the specified semantics, to avoid assuming a global.
7. heroMark included per the reverse-link section (querySelectorAll). If an old heroMark exists as a function declaration, this one (later in file) wins; if it's a const, delete the old one.
8. .lrow.lit and .phcell.lit/.phcell.taken styles added — the spec says a zone lights "on the aircraft AND in the legend at once" but gives no lit style for rows/cells.

Hmm that's a lot of bullets. The user said "Explain only where you departed from the specification and why." Items 4,5,6,7 are more integration notes than departures. I'll structure: "Departures" (2,3,8 + maybe 1) then "Integration notes" (short). Actually renaming the constant IS worth a departure-style note since spec named the constant. Let me present two short lists: "Departures from the spec" and "Wiring notes". Keep each bullet one line-ish.

Also mention: taken classes are also baked in at render time (belt and braces for syncControls) — not a departure.

Also the HINTS.zone string note ("e.g. 300" → "e.g. ZONE 300") — wiring note; important because the search hint otherwise invites rejected values. Include.

Also note: three checks pass — maybe brief: (1) alphas computed... The user said they'll check; I could add a tiny verification line: with the live numbers, alphas are 0.900/0.677/0.317/0.204/0.203/0.187/0.161/0.139/0.131 — ZONE 200 darkest, ≥4 distinct. And sentence math: 84453/212940→39.7, 212940/1757827→12.1, 90383→5.1. A compact "checks" paragraph helps them. Include briefly.

Now — one subtle thing in buildZones: I map ZONE_ORDER (9 fixed) and DROP any API zone not in the list (e.g., ZONE 000 excluded ✔; also weird codes dropped). Spec: "ALWAYS all nine". ✔.

Another subtlety: `+(z.n??z.count??0)||0` — if n=0, +0||0=0 ✔; if n missing → 0 ✔.

In zFill: n/mx when n=0 → 0.10 ✔ "0.100" format via toFixed(3) ✔. n=mx → 0.900 ✔.

Legend swatch background uses zFill(z.n,mx) — same alpha as aircraft ✔ "legend a key rather than a second chart".

Strip: sorted desc by n ✔ with flex Math.max(1,z.n) ✔ floored so zero shows hairline ✔.

Rest strip: note the spec's rest rail has onclick="setHero('anatomy')" — inline handler; setHero global ✔.

Wait — one thing: in the open layout spec, gut has `<div class="q">WHERE</div><div class="pn">on the aircraft</div><div class="val">…</div>`. That gutter is page chrome (drawHero). My bodyWhere doesn't emit gut — their existing drawHero must already (rails other than where have gut+pn). Since old bodyWhere lacked gut and the page presumably rendered gut fine, keep. But do they pass val? The val shows active filter — page-level syncControls/val update probably. I'll expose whereVal() helper? My restWhere computes val internally; for the open gutter the page does it. Add a tiny `whereVal()` and note the gutter's val can use it? Meh — keep restWhere self-contained; skip whereVal. Actually the open gutter val: spec "val = active zone label via code(...), else all zones" — if their drawHero renders val via its own logic (old page did — old closed rails show val), it likely uses a generic label lookup (code()) that needs glossary entries for "ZONE 200"... If their code() has no entry for prefixed codes, val might show raw "ZONE 200" — acceptable-ish. Provide whereVal() exported and one wiring line: "if the gutter's val lookup misses, use whereVal()". OK add whereVal() (tiny) and mention in wiring notes. Good.

Let me also think: params().get("zone") — after clicking crown, URL has zone=ZONE%20200 → params().get("zone")==="ZONE 200" ✔ taken comparisons work.

Now — write the final answer. Structure: single code block with <style>…</style> and <script>…</script>, then "Departures" bullets, then "Wiring notes" bullets, then a 3-line check confirmation. No preamble.

Length: code ~200 lines. That's expected — the spec demands a lot. Format: use one fenced block. Keep comments purposeful (including the two mandated comments and the drop-shadow comment).

Let me write the JS carefully, minding syntax.

Also, one more consideration on `zLabel` fallback: for "ZONE 400" if API label missing → "ZONE 400" — but spec's aria for nacelle is "Engine nacelles and pylons, N reports" — that's API label present. Fallback rarely used. But maybe fall back to a tiny static label map for robustness? The spec said API label authoritative; glossary fallback exists (zoneGloss). Their GLOSS may have part_location entries for "400"→"..."? zoneGloss(bare) — old glossary may have labels like "400: engine"? Old ZONE_DESC had 400:"fin and stabilizers" (WRONG per API — old glossary was wrong; API says 400 = Engine nacelles). Good thing we prefer API. For fallback use zoneGloss then "ZONE xxx" — fine.

Edge: zLabel used in whereAim for any "zone|X" key — if X invalid, "ZONE X" shown; fine.

Final check on the `atr` for shapes vs groups regarding `tabindex`: shapes always 0 (render-only-when-open). Spec ternary open?0:-1 — my simplification; note? It's equivalent given the aircraft renders only in the open rail. I'll put a half-line comment. Not worth a departure bullet... actually to be safe, mention in wiring notes? Nah — one short comment in code: `/* the aircraft renders only in the open rail, so tabindex is always 0 */`. Good.

Writing the code now.

```html
<style>
/* ===================== WHERE rail (anatomy) ===================== */
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
/* a stroke-only ring vanishes on the busiest zones, which are the ones
   people reach for first — hence the drop-shadow behind the keyboard ring */
.zone:focus-visible{outline:none;filter:drop-shadow(0 0 0 2px var(--ink))}
.zone:focus-visible{stroke:var(--ink);stroke-width:3}
@media (forced-colors: active){.zone{stroke:CanvasText}[data-take].taken{outline:3px solid Highlight}}

/* closed rail strip */
.strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}

/* open layout */
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}
.rail>.reading{grid-column:2}

/* legend */
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;padding:1px 4px;border-radius:3px}
.lrow:hover,.lrow:focus-visible{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.lrow.taken{background:rgba(196,75,40,.14);box-shadow:inset 2px 0 0 var(--rust)}
.lrow.lit{background:rgba(196,75,40,.10)}

/* note under the legend */
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}

/* phone: the aircraft becomes a 3x3 grid */
.phgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.phcell{background:rgba(196,75,40,var(--f,.1));border:1px solid #7c746a;border-radius:6px;
  padding:9px 8px;font:inherit;font-size:12.5px;color:var(--ink);cursor:pointer;text-align:left;
  display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.phcell b{font-size:12px;color:var(--smoke)}
.phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,var(--paper) 4px 8px)}
.phcell.taken,.phcell.lit{box-shadow:inset 0 0 0 2px var(--rust)}

@media (max-width:760px){.rail .track.two{grid-template-columns:1fr}.rail>.reading{grid-column:1}}
</style>
```

JS:

```js
<script>
/* =========================================================================
   WHERE rail — “on the aircraft”.  Replaces ZONE_ORDER/buildZones/acSVG/
   zonenoteHTML/bodyWhere; adds legend, reading sentence, phone grid, aim
   text and the row->aircraft reverse link.

   THE TRAP, FIXED: the API's zone codes are PREFIXED — 'ZONE 200', never
   '200'.  Every Map key, every data-aim/data-take, every filter value and
   every #zone value therefore carries the prefix, so the server accepts
   zone=ZONE%20200 and the counts land on the shapes.
   ========================================================================= */

/* fixed order from the server's _ZONE_ORDER: frequency-ish, NOT numeric,
   NOT re-sorted here; legend ties keep this order (stable sort) */
const WHERE_ZONE_ORDER=["ZONE 200","ZONE 100","ZONE 800","ZONE 300","ZONE 500",
                        "ZONE 600","ZONE 400","ZONE 700","ZONE 900"];

/* 'ZONE 200' | 'ZN 200' | 'zone 200' -> 'ZONE 200'; ZONE 000 and junk -> null */
const zNorm=v=>{const m=/^Z(?:ONE|N)?\s*([1-9])00$/i.exec(String(v==null?"":v).trim());
  return m?("ZONE "+m[1]+"00"):null};

const whereD=()=>HERO.raw||HERO||{};
const zByCode=c=>(HERO.zones||[]).find(z=>z.code===c)||null;
const zCount=c=>{const z=zByCode(c);return z?(+z.n||0):0};
const zLabel=c=>{const z=zByCode(c);
  return (z&&z.label)?z.label:("ZONE "+String(c).replace(/^ZONE\s+/i,""))};

/* THE RAMP — one function, no second colour.  Linear in the raw count,
   rescaled on EVERY render against the current selection's own busiest
   zone; pure opacity of --rust #c44b28 over --paper #f7f5f0. */
const zMax=()=>Math.max(1,...(HERO.zones||[]).map(z=>+z.n||0));
const zFill=(n,mx)=>`rgba(196,75,40,${(0.10+0.80*(n/mx)).toFixed(3)})`;

function buildZones(){
  const src=(HERO.raw&&HERO.raw.zones)?HERO.raw.zones:facetVals("zone");
  const by=new Map();
  (src||[]).forEach(z=>{
    const code=zNorm(z.code??z.zone??z.value);
    if(!code)return;                                   /* ZONE 000 never enters */
    by.set(code,{code,n:+(z.n??z.count??0)||0,label:String(z.label??z.name??"")});
  });
  /* the label the API sends is authoritative (the FAA's own code table);
     glossary, then 'ZONE xxx', only for a facet that shipped no label */
  return WHERE_ZONE_ORDER.map(c=>{
    const z=by.get(c), bare=c.slice(5);
    return {code:c,n:z?z.n:0,
            label:(z&&z.label)?z.label:(zoneGloss(bare)||("ZONE "+bare))};
  });
}
```

Then acSVG:

```js
function acSVG(){
  const mx=zMax(), taken=params().get("zone");
  const f=c=>zFill(zCount(c),mx);
  /* the aircraft only ever renders inside the open rail, so tabindex is 0 */
  const atr=c=>`class="zone${taken===c?" taken":""}" data-aim="zone|${c}" data-take="zone|${c}" tabindex="0" role="button" aria-label="${esc(zLabel(c))}, ${num(zCount(c))} reports"`;
  /* the trailing-b strip lets ONE zone be two disjoint paths: 'ZONE 300b'
     never comes from the API — it resolves to ZONE 300 and shares
     fill/aim/take/tabindex/label, while staying its own Tab stop */
  const shape=(c0,d)=>{const c=c0.replace(/b$/,"");
    return `<path d="${d}" fill="${f(c)}" stroke="#7c746a" stroke-width="1.1" ${atr(c)}/>`};
  return `<svg viewBox="0 0 600 132" class="plane" role="img" aria-label="Aircraft from the side, each zone shaded by how many reports name it">`
    +shape("ZONE 100","M30 66 C30 80 47 88 80 88 L470 88 C495 86 513 80 529 72 L502 66 Z")
    +shape("ZONE 200","M30 66 C30 52 47 44 80 44 L452 44 C481 44 503 36 541 18 L557 14 C541 40 525 58 512 66 Z")
    +shape("ZONE 300","M452 44 L492 7 L518 7 L523 41 Z")
    +shape("ZONE 300b","M512 48 L578 38 L580 47 L516 57 Z")
    +shape("ZONE 500","M236 87 L356 87 L318 108 L264 108 Z")
    +shape("ZONE 600","M262 80 L344 80 L322 90 L284 90 Z")
    +`<ellipse cx="248" cy="99" rx="24" ry="9.5" fill="${f("ZONE 400")}" stroke="#7c746a" stroke-width="1.1" ${atr("ZONE 400")}/>`
    /* struts are one two-subpath path in strut grey, unfilled, UNSHADED;
       only the three wheels take the zone fill */
    +`<g ${atr("ZONE 700")} stroke="#7c746a"><path d="M118 88 L118 104 M288 88 L288 106" stroke="#8d857b" stroke-width="3" fill="none"/><circle cx="118" cy="109" r="6" fill="${f("ZONE 700")}"/><circle cx="281" cy="111" r="7" fill="${f("ZONE 700")}"/><circle cx="297" cy="111" r="7" fill="${f("ZONE 700")}"/></g>`
    +`<g ${atr("ZONE 800")} stroke="#7c746a">${[96,190,348,424].map(x=>`<rect x="${x}" y="49" width="11" height="17" rx="3" fill="${f("ZONE 800")}"/>`).join("")}</g>`
    +`<g ${atr("ZONE 900")} stroke="#7c746a">${[122,372].map(x=>`<rect x="${x}" y="51" width="22" height="14" rx="3" fill="${f("ZONE 900")}"/>`).join("")}</g>`
    /* windows: decoration, drawn last so they sit above the shading, and
       pointer-events:none so they never swallow a hover meant for the crown */
    +`<g fill="#f7f5f0" stroke="none" opacity=".8" pointer-events="none">${[150,164,220,234,248,300,314,328,400,414].map(x=>`<rect x="${x}" y="54" width="6" height="7" rx="2"/>`).join("")}</g>`
    +`</svg>`;
}
```

Comments inside the return-template expression chain — `+` line with a /* */ comment between: valid JS (comments allowed between operands). ✔.

Legend:

```js
function zonesDesc(){
  const zs=(HERO.zones||[]).map((z,i)=>({z,i}));
  zs.sort((a,b)=>((+b.z.n||0)-(+a.z.n||0))||(a.i-b.i));  /* stable: ties keep WHERE_ZONE_ORDER */
  return zs.map(x=>x.z);
}
function legendHTML(){
  const D=whereD(), mx=zMax(), taken=params().get("zone");
  const rows=zonesDesc().map(z=>
    `<div class="lrow zone${taken===z.code?" taken":""}" data-aim="zone|${z.code}" data-take="zone|${z.code}" tabindex="0" role="button">`
    +`<i style="background:${zFill(z.n,mx)}"></i><span>${esc(z.label)}</span><b>${num(z.n)}</b></div>`).join("");
  /* pads carry data-aim but NO data-take: clicking one does nothing but
     leave the explanation on screen — they are unshadeable by construction */
  const pads=
    `<div class="lrow zone" data-aim="pad|nowhere" tabindex="0" role="button"><i class="padi"></i><span>no location given</span><b>${num(+(D.no_location??0)||0)}</b></div>`
   +`<div class="lrow zone" data-aim="pad|outside" tabindex="0" role="button"><i class="padi"></i><span>place named in words, not as a zone</span><b>${num(+(D.other_location??0)||0)}</b></div>`;
  return rows+`<div class="lsplit"></div>`+pads;
}
```

Zonenote with mandated comments:

```js
/* This used to read 'the others never say where', which was false: they nearly all say
   where, in words the diagram cannot place. Only the blank ones say nothing, and they are
   about one report in twenty-seven, not four fifths of the file. */
/* Zonder deze zin leest de alinea als een reeks voorbehouden. De tekening is een steekproef,
   maar wel een die laat zien waar het meeste stukgaat. */
function zonenoteHTML(){
  const D=whereD();
  const placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0);
  const unz=D.unzoned!=null?+D.unzoned:Math.max(0,((+(D.total??TOTAL)||0))-placed);
  if(!(unz>0))return "";
  return `<div class="zonenote">The aircraft above counts only the ${num(placed)} reports that use one of the FAA's numbered zones. In another ${num(+(D.other_location??0)||0)} the mechanic wrote where it was in plain words, such as the part or the system, and ${num(+(D.no_location??0)||0)} say nothing about where. Those two cannot be drawn on the aircraft, so they sit under it.</div>`;
}
```

Reading:

```js
const wherePct=(a,b)=>b>0?(Math.round(a/b*1000)/10).toFixed(1):"0.0";
function whereReadingHTML(){
  const D=whereD(), zs=zonesDesc(), tot=+(D.total??TOTAL)||0;
  if(!tot||!zs.length)return "";
  const zoned=zs.reduce((s,z)=>s+(+z.n||0),0);
  const worded=+(D.other_location??0)||0, blank=+(D.no_location??0)||0;
  let t=`${esc(zs[0].label)} accounts for ${num(zs[0].n)} of the ${num(zoned)} reports written in the FAA&rsquo;s numbered zones, or ${wherePct(zs[0].n,zoned)}%. Those numbers are what this diagram can place, and they are ${wherePct(zoned,tot)}% of the selection.`;
  if(worded)t+=` Another ${num(worded)} do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them.`;
  if(blank)t+=` Only ${num(blank)}, ${wherePct(blank,tot)}%, give no location at all.`;
  t+=` It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.`;
  return `<div class="reading">${t}</div>`;
}
```

Rest:

```js
function whereVal(){
  const v=params().get("zone");
  if(!v)return "all zones";
  const z=zByCode(v);
  return (z&&z.label)?z.label:v;
}
function restWhere(){
  const taken=params().get("zone");
  const strip=zonesDesc().map(z=>
    `<span style="flex:${Math.max(1,z.n)}" title="${esc(z.label)}: ${num(z.n)}"${taken===z.code?' class="sel"':""}></span>`).join("");
  return `<div class="rail" data-rail="where" onclick="setHero('anatomy')">`
       +`<div class="gut rest"><span class="q">WHERE</span><span class="val">${esc(whereVal())}</span></div>`
       +`<div class="track"><div class="strip">${strip}</div></div></div>`;
}
```

Phone:

```js
function phZones(){
  const D=whereD(), mx=zMax(), taken=params().get("zone");
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],      /* spatial, NOT frequency-sorted */
              ["ZONE 500","ZONE 400","ZONE 600"],
              ["ZONE 300","ZONE 700","ZONE 900"]];
  const cell=c=>{const n=zCount(c);
    return `<button type="button" class="phcell${taken===c?" taken":""}" style="--f:${(0.10+0.80*(n/mx)).toFixed(3)}" data-aim="zone|${c}" data-take="zone|${c}" aria-label="${esc(zLabel(c))}, ${num(n)} reports">${esc(zLabel(c))}<b>${num(n)}</b></button>`};
  const pad=(k,txt,n)=>
    `<button type="button" class="phcell pad" data-aim="pad|${k}" aria-label="${esc(txt)}">${esc(txt)}<b>${num(n||0)}</b></button>`;
  return `<div class="phgrid">${grid.flat().map(cell).join("")}`
       +pad("nowhere","no location given",+(D.no_location??0)||0)
       +pad("outside","place named in words, not as a zone",+(D.other_location??0)||0)
       +`</div>`;
}
```

bodyWhere:

```js
function bodyWhere(){
  const narrow=window.matchMedia&&matchMedia("(max-width:760px)").matches;
  if(narrow)return `<div class="track">${phZones()}</div>`;   /* no reading, no zonenote on the phone */
  return `<div class="track two">${acSVG()}<div>${legendHTML()}${zonenoteHTML()}</div></div>`
       +whereReadingHTML();
}
```

Reverse link:

```js
/* row -> aircraft.  A row's data-zone comes from
   (PartLocation||"").toUpperCase().match(/^ZONE \d00/) and that client regex
   is stricter than the server's: it needs the literal word "ZONE ", so a row
   reading "ZN 100 FUS LOWER" lights nothing even though the server counted it. */
function heroMark(row){
  const v=row&&(row.dataset?row.dataset.zone:(row.getAttribute?row.getAttribute("data-zone"):null));
  const m=/^ZONE \d00/.exec(String(v==null?"":v).toUpperCase());
  unmarkZones();
  if(m)document.querySelectorAll(`[data-take="zone|${m[0]}"],[data-aim="zone|${m[0]}"]`)
    .forEach(n=>n.classList.add("lit"));   /* querySelectorAll on purpose: aircraft AND legend, both ZONE 300 paths */
}
function unmarkZones(){
  document.querySelectorAll(".zone.lit,.lrow.lit,.phcell.lit").forEach(n=>n.classList.remove("lit"));
}
```

Aim + delegation:

```js
function whereAim(key){
  if(key&&key.slice(0,5)==="zone|"){
    const c=key.slice(5);
    const placed=(HERO.zones||[]).reduce((s,z)=>s+(+z.n||0),0);   /* recomputed from zones, never read off unzoned */
    return `${esc(zLabel(c))} &middot; ${num(zCount(c))} of ${num(placed)} placed findings &middot; click to narrow`;
  }
  const D=whereD();
  if(key==="pad|nowhere")return `${num(+(D.no_location??0)||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn on the aircraft`;
  if(key==="pad|outside")return `${num(+(D.other_location??0)||0)} reports describe the place in words rather than with an FAA zone number, so they cannot be drawn on the aircraft`;
  return null;
}

/* hover/focus aim, delegated on document, installed once.  Clicks and keys
   are deliberately NOT bound here: the page's own takeFor delegation already
   fires (that is how the rejected zone=100 request was made), and a second
   binding would run every search twice. */
if(!window.__WHERE_AIM__){
  window.__WHERE_AIM__=true;
  const hit=e=>{
    const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n||(e.relatedTarget&&n.contains(e.relatedTarget)))return;
    const t=whereAim(n.getAttribute("data-aim"));
    if(t!=null)aim(t);
  };
  const miss=e=>{
    const n=e.target&&e.target.closest?e.target.closest("[data-aim]"):null;
    if(!n||(e.relatedTarget&&n.contains(e.relatedTarget)))return;
    if(whereAim(n.getAttribute("data-aim"))!=null)aim("");
  };
  document.addEventListener("pointerover",hit);
  document.addEventListener("pointerout",miss);
  document.addEventListener("focusin",hit);
  document.addEventListener("focusout",miss);
}

/* phone <-> aircraft swap without a reload */
try{
  const mq=matchMedia("(max-width:760px)");
  const swap=()=>{if(typeof drawHero==="function"&&document.querySelector('.rail.open[data-rail="where"]'))drawHero()};
  if(mq.addEventListener)mq.addEventListener("change",swap);
  else if(mq.addListener)mq.addListener(swap);
}catch(_){}
</script>
```

Hmm — `drawHero` may not be the exact name; guarded by typeof ✔.

Wait, one thing: in `hit`, e.relatedTarget on focusin is the previously focused element — if focus moves from one mark to another, relatedTarget is the old mark (not contained) → fine. If focus moves within same mark (parent g to child?) — focus goes to the element with tabindex; group has tabindex, children don't → relatedTarget containment unlikely; fine.

pointerover with relatedTarget inside same mark: moving from group to child rect — relatedTarget is... pointerover fires on the child; target.closest finds the mark (g). relatedTarget = previous element (maybe strut path) which IS contained → skip re-aim ✔ (avoids flicker; text unchanged anyway).

Also `aim("")` — their aim may expect a string; empty clears or writes empty. Assume ok. If their aim signature is aim(html, sticky?) — fine.

Also aimHold — not called by me ✔ (takeFilter does).

Now — double-check: does anything reference `ramp`, `zoneFill`, `zoneAria`, `AC` that I removed? My code doesn't use them ✔. Old acSVG is replaced (function redeclaration later wins). BUT — wait, careful: are the OLD functions declared with `function` keyword? Lines 640, 678, 689 show `function acSVG(taken){`, `function zonenoteHTML(){`, `function bodyWhere(){` ✔ function declarations. buildZones line 360 `function buildZones(){` ✔. So later function declarations with same names override ✔ (classic script semantics: later declaration wins at hoist time — actually both hoist; the LAST declaration in source order is the binding's final value ✔).

`const WHERE_ZONE_ORDER` new ✔ no collision.

One more potential collision: `zMax`, `zFill`, `zNorm`, `zCount`, `zLabel`, `zByCode`, `whereD`, `wherePct`, `zonesDesc`, `legendHTML`, `whereVal`, `restWhere`, `phZones`, `whereAim`, `whereReadingHTML`, `heroMark`, `unmarkZones` — plausible-new. `heroMark` possibly existing — function redeclare fine; if const → SyntaxError; warn in notes.

Also `flat()` — ES2019, fine.

Now verify check #2 flow precisely: click crown path → delegated click → takeFor("zone|ZONE 200") → their takeFilter sets #zone.value="ZONE 200" and search → request carries zone=ZONE%20200 → total 84,453 ✔. My crown path data-take="zone|ZONE 200" ✔.

Check #1: rendered alphas from live data (no filter): computed above; distinct: .900, .677, .317, .204, .203, .187, .161, .139, .131 → at least four visibly different ✔ ZONE 200 darkest ✔.

Check #3: sentence: computed 39.7 / 212,940 / 12.1 / 1,454,504 / 90,383 / 5.1 ✔ — all computed, not hard-coded ✔.

One more spec line: "heroKind falls back to 'anatomy' when ?hero= is absent or unknown. localStorage IS written by setHero but deliberately NOT read at boot" — page boot; exists presumably (page already opens on anatomy per "DEFAULT OPEN RAIL" and the symptom shows the aircraft rendering). Not mine.

Also the spec's `.rail .track.two` — old CSS may already have this exact rule; duplicate harmless.

Wait — there's a subtle CSS ordering issue: my <style> must come AFTER their existing styles to win conflicts (.track.two, .zonenote redefinitions). Note it in wiring: "paste the <style> after existing styles (or merge)". ✔.

Also — the old .zonenote CSS in their file might differ (old design); my redefinition later wins ✔.

Now the departures/wiring text. Keep tight:

Departures:
1. Constant is `WHERE_ZONE_ORDER`, not `ZONE_ORDER` — the old `const ZONE_ORDER` lives in the same top-level scope; a second `const` of that name is a SyntaxError that would blank the entire script, so the new list takes a new name. Old ZONE_ORDER, ZONE_DESC and zoneDesc are now unreferenced; delete them when convenient. (Values are exactly the spec's _ZONE_ORDER.)
2. `pointer-events="none"` added to the windows group — the spec calls the windows "no interaction", but as drawn they'd intercept hovers over the crown beneath; the attribute makes that literal.
3. The phone grid lists only the nine zones, yet the spec defines `.phcell.pad`; I append the two pads (data-aim, no data-take) after the 3×3 so the "cannot be drawn" explanation survives on the phone.
4. `.lrow.lit` and `.phcell.taken/.lit` styles added: the spec requires a zone to light "on the aircraft AND in the legend at once" but supplies no lit/taken styling for rows and cells.

Wiring notes (not departures):
- Functions keep their old names (buildZones, acSVG, zonenoteHTML, bodyWhere) so they override by redeclaration; the block must sit AFTER the old definitions in the same script. If `heroMark` already exists as a `const`, delete the old binding.
- Clicks/keys are not re-bound: the existing takeFor delegation demonstrably fires (it produced the rejected zone=100 request); binding twice would run each search twice and break history-based undo. Hover/focus aim is bound once (guarded) and resolves only zone|/pad| via whereAim() — if your dispatcher already has those cases, point them at whereAim() and drop the guarded block.
- Closed-gutter val resolves from HERO.zones (the API label) rather than code("part_location",v) — same end, label stays authoritative. whereVal() is exported if the open gutter wants it.
- HINTS.zone still reads "a zone, e.g. 300"; since values are now prefixed, change it to "e.g. ZONE 300" or typed searches will be rejected.
- .zonenote/.track.two CSS is re-declared per spec; keep this <style> after the existing styles.

Checks (computed from the live numbers): alphas .900/.677/.317/.204/.203/.187/.161/.139/.131 — ZONE 200 darkest, seven distinct steps; placed = 212,940, so the reading sentence opens "Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA’s numbered zones, or 39.7%" and continues 12.1% of the selection, another 1,454,504, only 90,383, 5.1% — every figure derived at render time.

Hmm — "seven distinct steps" — there are 9 values, 7 paths claim... I'll phrase: "nine alphas, all but 500/600 distinct".

Actually ZONE 500 .204 vs 600 .203 — toFixed(3): 10954/84453=0.129695→0.10+0.80*0.129695=0.203756→"0.204". 10691/84453=0.126585→0.201268→"0.201". Let me recompute precisely:

- 100: 60966/84453 = 0.721775... 0.8*0.721775=0.577420 → 0.677420 → "0.677"
- 800: 22874/84453 = 0.270830 → 0.216664 → 0.316664 → "0.317"
- 300: 9149/84453 = 0.108319 → 0.086655 → 0.186655 → "0.187"
- 500: 10954/84453 = 0.129694 → 0.103755 → 0.203755 → "0.204"
- 600: 10691/84453 = 0.126584 → 0.101267 → 0.201267 → "0.201"
- 400: 6448/84453 = 0.076344 → 0.061075 → 0.161075 → "0.161"
- 700: 4149/84453 = 0.049126 → 0.039301 → 0.139301 → "0.139"
- 900: 3256/84453 = 0.038556 → 0.030845 → 0.130845 → "0.131"

So: 0.900, 0.677, 0.317, 0.187, 0.204, 0.201, 0.161, 0.139, 0.131. All 9 distinct. ✔.

Note ZONE 500 (0.204) sorts ABOVE ZONE 300 (0.187) in the legend: desc by n → 500 (10954) before 300 (9149) ✔ consistent with data.

Legend order desc: 200 (84453), 100 (60966), 800 (22874), 500 (10954), 600 (10691), 300 (9149), 400 (6448), 700 (4149), 900 (3256) ✔.

One more: reading "they are 12.1% of the selection": 212940/1757827 = 0.121132... ×1000=121.132→121→12.1 ✔.

pct(90383,1757827): 0.051417→51.417→51→"5.1" ✔.

OK. Also double-check wherePct rounding: Math.round(396.629...)=397 → 397/10=39.7 → toFixed(1)="39.7" ✔.

Now, potential gotcha: `+(D.total??TOTAL)||0` — if D.total is 1757827 → fine. If D.total undefined and TOTAL global undefined → NaN||0=0 → reading returns "" ✔.

`D.unzoned!=null?+D.unzoned:...` — API provides unzoned ✔ → 1544887 >0 → zonenote renders ✔.

Legend pad numbers: no_location 90383 → "90,383" ✔ (num exists).

Now — the aria-label on the root svg per spec verbatim: "Aircraft from the side, each zone shaded by how many reports name it" ✔.

One more inspection of spec shape(): it includes `class="zone"` only (no taken) and relies on syncControls; I bake taken at render AND spec's syncControls (existing page fn) will toggle after draws — both agree. Fine.

Wait — existing page syncControls: does it exist and handle zone? Spec says "syncControls() after every drawHero" — describing parent. If their page HAS syncControls generic over [data-take], great. If not, my render-time classes still work for the initial and post-filter renders (bodyWhere re-runs on every drawHero → taken recomputed from params()). ✔ Either way correct.

Now the one-line about `role="img"` on svg with focusable children — leave as spec.

I think the code is complete. Let me also make sure no stray backticks inside template literals. The comments with apostrophes fine.

Careful: inside template literals I use `${...}` correctly. In the `atr` for groups: `${atr("ZONE 700")}` — atr returns string with double quotes inside; embedding in `<g ${...}>` fine.

In heroMark: template literal with `${m[0]}` inside a querySelector string — fine.

One concern: `String(v==null?"":v).toUpperCase()` — data-zone from match could be "ZONE 200" ✔; regex /^ZONE \d00/ matches "ZONE 200" fully? exec returns ["ZONE 200"] (m[0]="ZONE 200") ✔. For "ZONE 250"? \d00 → matches "ZONE 200"? No: "ZONE 250" — \d00 requires digit then "00": "25" then "0"? Let's see: /^ZONE \d00/ against "ZONE 250": Z O N E space 2 5 → \d matches 2, then "00" needs "50" — no. No match ✔. Server only makes x00 codes anyway.

Also `unmarkZones` name — if their page has an unmark global used with old heroMark... unknown; my heroMark calls my unmarkZones ✔. If their row-hover code calls heroMark(row) and unmark via some other fn — they'll wire. Note briefly: "call unmarkZones() where the old code cleared highlights." One clause in wiring notes.

Length of response: code block + short bullets. The user said "No preamble" — start directly with the code block. Then "Departures" and "Wiring" sections, then a compact "Checks" line. Since the user explicitly asked to explain only departures, the wiring notes should be few and justified — I'll keep 4-5 short bullets and mark them as wiring, not departures. And the checks paragraph is arguably beyond "departures only"... but it directly addresses "Three things I will check" — valuable, keep to 2-3 lines.

Format thoughts: one code block; headers "Departures" and "Wiring notes" as bold or small headers; bullets. Markdown appropriate (code-heavy technical answer).

Let me finalize the code text, double-checking syntax by reading through once more mentally...

- `const zNorm=v=>{const m=...; return m?(...):null};` ✔
- buildZones: uses facetVals — if HERO.raw&&HERO.raw.zones missing AND facetVals undefined? facetVals exists in their file (old code called it) ✔.
- In buildZones I referenced zoneGloss — exists ✔ (line 329).
- zonenoteHTML: uses TOTAL — exists ✔ (old line 685).
- restWhere onclick inline setHero — exists ✔.

Also: my bodyWhere phone branch returns track (class "track" not "two") ✔ single column.

Wait — spec: ".rail .track.two{...} Under the breakpoint both collapse to a single column." With phone branch, track.two isn't used ≤760. The desktop branch at >760 uses two. If a desktop render is resized to ≤760, my mq listener redraws → phone. ✔.

Edge: `matchMedia` in bodyWhere — if window.matchMedia undefined (ancient), narrow=false → desktop. ✔.

One more thing: `phZones` pad aria-label duplicates visible text — fine.

Also `.phcell` uses `<button>` — clicking pad button: no data-take → no takeFor; aim shows explanation ✔ "Clicking one does nothing but leave the explanation on screen".

Double-check `aim("")` in miss: if their aim() requires non-empty... risk small. Alternative: track last key and only clear if last was ours. Keep simple; note? Nah.

Also — the spec says "aim() refuses to write while a HELD message is showing: an undo outranks a hover." — existing aim implements the refusal ✔ my calls go through it ✔.

Final read of spec item: "The SVG shape and the legend row carry THE SAME data-take, so both routes are identical." ✔ both "zone|ZONE 200".

"With ZONE 300 that is two paths." ✔ both get taken (shape strips b).

I'm fairly confident. Also include a tiny comment near ZONE_CODES naming check-1 relevance? Not needed.

One last CSS check: `.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2}` — for legend rows (class lrow zone), :hover sets stroke (inert) ✔ no visual harm.

`.zone:focus-visible{outline:none;...}` on legend rows removes outline but .lrow:focus-visible bg gives indicator ✔ (and on phcell? phcell isn't .zone → default outline retained ✔ good).

Wait — phcell doesn't have class "zone" — so .zone styles don't apply; focus outline default browser ✔ fine.

And heroMark adds .lit to phcell (has data-take) — .phcell.lit styled ✔.

Also `.zone.lit` for SVG shapes ✔.

Done. Now also — the answer's explanation of the core fix: one sentence at top of the script comments covers it. In the prose after code, lead departures with the rename (most important), then others.

Also, the user said "Write the code. Explain only where you departed from the specification and why. No preamble." — So structure: code block, then "Departures" bullets, then (brief) "Wiring" bullets + checks. I'll title the second part clearly so it doesn't look like padding.

Word on num(): evidence shows num produces comma-grouped ("84,453") ✔ assumed.

One more consideration: `zFill` called with (z.n, mx) where z.n could be a string from facet — +z.n||0 in buildZones normalizes ✔; zonesDesc sorting uses +b.z.n ✔; legend zFill(z.n,mx) — z.n normalized number from buildZones ✔. But HERO.zones is built by buildZones — after replacement, rows have numeric n ✔. However — is HERO.zones actually assigned from buildZones()? Old acSVG read HERO.zones; old buildZones returned the array; presumably pipeline: HERO.zones=buildZones(). ✔. If instead HERO.zones=HERO.raw.zones directly somewhere... then codes prefixed and labels present, n numeric — my render helpers still work ✔ (they only need code/label/n). Robust either way. 

And buildZones' "n:+(z.n??z.count??0)||0" — API n numeric ✔.

Edge in `atr`: `taken===c` — taken from params; if URL has "ZONE 200" ✔.

OK, writing final answer now. Also keep the two mandated source comments verbatim (including "twenty-seven" line) ✔ included above zonenoteHTML.

Also the spec: "The closing sentence exists so the paragraph does not read as a list of disclaimers." — that's rationale for the Dutch comment; I'll append it to the Dutch comment block as a third line? The spec says TWO SOURCE COMMENTS recording why; the trailing sentence after them is explanation of the second. I'll fold: after the Dutch comment add `/* the closing sentence exists so the paragraph does not read as a list of disclaimers */` — that makes three comments; spec wanted two recording why. I'll keep exactly the two mandated comments and skip the third line to honor "TWO SOURCE COMMENTS". Fine.

Also — one more: the spec's reading includes `pct(zs[0].n,zoned)` etc. and says "&rsquo; is a literal entity in the string" ✔ mine has FAA&rsquo;s.

And zonenote: straight apostrophe FAA's ✔.

Final assembly. Also, should the `<style>` include `.rail>.reading{grid-column:2}` only for where rail? Spec verbatim is `.rail>.reading` global — but other rails' readings would also be affected... they'd want the same. Keep verbatim.

Also `.rail .track.two` — verbatim ✔.

Double-check: any usage of `esc` on attribute values containing quotes — zLabel may contain quotes? esc handles ✔.

Writing it out.