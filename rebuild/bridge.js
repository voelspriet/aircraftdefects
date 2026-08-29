/* ---- bridge: the two halves of the desk ------------------------------
   The controls and the rows were specified as two halves of one surface and
   each was told to assume the other. Each then built a whole: its own search,
   its own count line, its own corpus total. This joins them.

   The controls call search(off) and expect a promise carrying {total, corpus}.
   The rows call it rrLoad(off), live inside their own closure, and announce
   the figure on an event instead of returning it. */

var SD_CORPUS = null;

/* Fetched once, on its own, because the page's own boot no longer runs: the
   instrument that replaced it never set TOTAL, so reading it gave 0 and
   "corpus minus selection" printed a negative number of reports set aside. */
var SD_CORPUS_P = fetch("api/facets")
  .then(function(r){ return r.ok ? r.json() : {}; })
  .then(function(f){
    var n = f && ((f.range && f.range.total) || f.total);
    if (n) { SD_CORPUS = n; try { sd2Total = n; } catch(e) {} }
    return SD_CORPUS;
  })
  .catch(function(){ return null; });

function search(off){
  if (!window.__rrLoad) return null;
  var p = new Promise(function(res){
    var done = false;
    function on(e){
      if (done) return;
      done = true; window.removeEventListener("sdr:rows", on);
      var d = e.detail || {};
      SD_CORPUS_P.then(function(c){
        if (d.corpus == null && c) d.corpus = c;
        res(d);
      });
    }
    window.addEventListener("sdr:rows", on);
    setTimeout(function(){
      if (!done) { done = true; window.removeEventListener("sdr:rows", on); res({}); }
    }, 20000);
  });
  window.__rrLoad(off || 0, false);
  return p;
}

/* The corpus figure decides what the on-purpose line says, so redraw it once
   the number is in rather than printing "reports." with nothing in front. */
SD_CORPUS_P.then(function(){
  try {
    if (typeof renderOnPurpose === "function" && typeof sd2HasFilter === "function"
        && !sd2HasFilter() && !REVEALED) renderOnPurpose();
  } catch(e) {}
});

/* The desk sits above the tab strip, outside it: #p-search exists and is empty,
   so the Search tab shows nothing and the controls stay on screen under every
   other panel. The reference puts them in the panel they belong to. Moved once,
   after both halves have mounted. */
(function(){
  function tuck(){
    var host=document.getElementById("p-search");
    if(!host) return false;
    var body=host.querySelector('[id$="-body"]')||host;
    var moved=false;
    ["sdControls","starters","rr-sec"].forEach(function(id){
      var n=document.getElementById(id);
      if(n && !host.contains(n)) { body.appendChild(n); moved=true; }
    });
    return moved;
  }
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",function(){ setTimeout(tuck,50); });
  else setTimeout(tuck,50);
  /* the panels mount lazily, so try again once they are up */
  var tries=0, iv=setInterval(function(){ if(tuck()||++tries>40) clearInterval(iv); }, 250);
})();

/* ---- the table lost 110px to nesting, and the gloss lost its button --------

   Moving the desk into #p-search put it inside two more padded boxes: the wrap
   gives 1040, the panel takes 18 either side and the section another 16, so a
   1080px table had 970 and scrolled sideways inside a panel inside a page. The
   box now bleeds back out to the panel's edge.

   And the write-ups lost the one thing this desk has that the reference does
   not: a model that reads the mechanic's own words back in plain English. The
   endpoint was still there; nothing called it. */
(function(){
  var css = document.createElement("style");
  css.textContent =
    "#p-search #rr-sec{padding-left:0;padding-right:0;margin-left:-18px;margin-right:-18px}" +
    "#p-search #rr-sec>*:not(.rr-scroll){padding-left:18px;padding-right:18px}" +
    "table.reps{min-width:1000px}" +
    /* the clipped band draws a fade over its own bottom edge, and the button
       sat under it: legible on a short write-up, ghosted on a long one,
       which is exactly where a reader wants it most. */
    ".wu-gloss{margin-top:6px;font:inherit;position:relative;z-index:3;background:transparent}" +
    ".wu.clip.long::after{z-index:1}" +
    ".wu-gloss button{background:none;border:1px solid #cfc6bd;border-radius:4px;" +
      "padding:2px 9px;font:12px/1.5 system-ui,sans-serif;color:#8a2a17;cursor:pointer}" +
    ".wu-gloss button:hover{background:#fdf1ec}" +
    ".wu-gloss button[disabled]{opacity:.55;cursor:default}" +
    ".wu-plain{margin-top:6px;padding:8px 11px;border-left:2px solid #c44b28;" +
      "background:#faf7f3;font:14.5px/1.5 Georgia,'Times New Roman',serif;color:#211d14;max-width:74ch}" +
    ".wu-plain .src{display:block;margin-top:5px;font:11.5px/1.4 system-ui,sans-serif;color:#756f69}";
  document.head.appendChild(css);

  /* The endpoint takes nineteen fields. Read off the visible cells it got nine,
     and the reading could not mention the airframe's hours, its cycles, the part
     number, the zone, the corrosion level or the crack length, because none of
     those is in a column. The row carries its control number, and one report has
     its own endpoint holding all of it. */
  function controlOf(wu){
    var tr = wu.closest("tr"); var rep = tr && tr.previousElementSibling;
    var host = rep || tr;
    var n = host && host.querySelector("[data-case]");
    if (n && n.dataset.case) return n.dataset.case;
    var b = host && host.querySelector("[onclick^='openCase']");
    if (b) { var m = /openCase\(['"]([^'"]+)/.exec(b.getAttribute("onclick")||""); if (m) return m[1]; }
    return null;
  }

  var FIELDS19 = ["date","operator","make","model","system","part","part_number",
                  "condition","nature","crew","stage","discovered","zone","zone_label",
                  "corrosion","cracks","crack_length","hours","cycles"];

  function factsFor(wu){
    /* the cells, as a fallback if the control number is not on the row */
    var tr = wu.closest("tr"); var rep = tr && tr.previousElementSibling;
    var out = {};
    if (rep && rep.cells) {
      var c = rep.cells;
      var g = function(i){ return c[i] ? c[i].innerText.replace(/\s+/g," ").trim() : ""; };
      out.date = g(0).split("\n")[0]; out.operator = g(1); out.model = g(2);
      out.system = g(4); out.part = g(5); out.nature = g(6);
      out.crew = g(7); out.discovered = g(8); out.stage = g(9);
    }
    Object.keys(out).forEach(function(k){ if(!out[k]) delete out[k]; });
    return out;
  }

  function fullFacts(wu){
    var id = controlOf(wu);
    if (!id) return Promise.resolve(factsFor(wu));
    return fetch("api/case/" + encodeURIComponent(id))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if (!d || d.error) return factsFor(wu);
        var one = function(x){ return (x && typeof x === "object") ? (x.label || x.faa || "") : (x || ""); };
        var many = function(a){ return Array.isArray(a) ? a.map(one).filter(Boolean).join("; ") : one(a); };
        var out = {
          date: d.DifficultyDate,
          operator: (d._operator && d._operator.label) || d.OperatorDesignator,
          make: d._aircraft_make || d.AircraftMake,
          model: d.AircraftModel,
          system: (d._jasc && d._jasc.label) || d.JASCCode,
          part: d.PartName,
          part_number: d.PartNumber,
          condition: d.PartCondition,
          nature: many(d._nature_all),
          crew: many(d._crew_all),
          stage: one(d._stage),
          discovered: one(d._discovered),
          zone: d.PartLocation,
          /* the case endpoint sends the raw zone and no decoded twin, so the
             words come from the zone menu, which the page builds once from the
             FAA's own table. One source for a name, everywhere. */
          zone_label: (function(z){
            if (!z) return "";
            var sel = document.getElementById("zone");
            if (sel) for (var i = 0; i < sel.options.length; i++)
              if (sel.options[i].value === z)
                return sel.options[i].textContent.replace(/\s*\([^)]*\)\s*$/, "").trim();
            return "";
          })(d.PartLocation),
          corrosion: one(d._corrosion) || d.CorrosionLevel,
          cracks: d.NumberOfCracks,
          crack_length: d.CrackLength,
          hours: d.AircraftTotalTime,
          cycles: d.AircraftTotalCycles
        };
        FIELDS19.forEach(function(k){ if (!out[k]) delete out[k]; });
        return out;
      })
      .catch(function(){ return factsFor(wu); });
  }

  function addButtons(){
    var list = document.querySelectorAll(".wu");
    for (var i = 0; i < list.length; i++) {
      var wu = list[i];
      if (wu.querySelector(".wu-gloss")) continue;
      var bar = document.createElement("div");
      bar.className = "wu-gloss";
      var btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "Say it in plain English";
      /* the band toggles its own clamp on click, so this must not bubble into
         it. Bound on the button itself: a stopPropagation on the bar killed the
         delegated handler along with the toggle, and the button did nothing at
         all, in silence. */
      /* No listener on the button: another block moves it, and a moved-by-
         innerHTML element loses its listeners in silence. Delegation on the
         document survives that, and survives the table redrawing too. */
      bar.appendChild(btn);
      wu.appendChild(bar);
    }
  }

  document.addEventListener("click", function(e){
    var b = e.target && e.target.closest && e.target.closest(".wu-gloss button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();          /* the band toggles its own clamp on click */
    askGloss(b);
  }, true);

  function askGloss(b){
    var wu = b.closest(".wu"); if (!wu) return;
    var txt = wu.querySelector(".txt");
    var raw = txt ? txt.innerText.replace(/\s+/g, " ").trim() : "";
    if (!raw) return;
    b.disabled = true; b.textContent = "Reading it…";
    fullFacts(wu)
      .then(function(body){
        body.text = raw;
        return fetch("api/gloss", {method:"POST", headers:{"Content-Type":"application/json"},
                                   body: JSON.stringify(body)});
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        var out = document.createElement("div");
        out.className = "wu-plain";
        if (d && d.plain) {
          out.textContent = d.plain;
          var s = document.createElement("span"); s.className = "src";
          /* the model read the mechanic's words and the decoded codes, nothing
             else. Said on the page, not in a footnote. */
          s.textContent = "Written by GLM-5.3-Flash from the write-up above and "
            + "the codes the filer entered. It adds nothing the report does not say.";
          out.appendChild(s);
        } else if (d && d.abstained) {
          out.textContent = "The model declined to put this in plain English"
            + (d.reason ? ": " + d.reason : ".");
        } else {
          /* One record in a hundred breaks the model's structured reply, and
             what came back was "Expecting ',' delimiter: line 1 column 111".
             A reader should never be shown a JSON parser. Say what happened and
             offer the retry, because a second attempt usually works: the same
             text put twice through the same endpoint gave three good answers
             and one failure. */
          out.textContent = "The model's reply came back malformed, which happens"
            + " on write-ups with quotation marks inside them. Try again.";
          var again = document.createElement("button");
          again.type = "button"; again.textContent = "Try again";
          again.addEventListener("click", function(ev){
            ev.preventDefault(); ev.stopPropagation();
            out.remove();
            var nb = document.createElement("button");
            nb.type = "button"; nb.textContent = "Say it in plain English";
            b.parentNode.appendChild(nb);
            askGloss(nb);
          });
          out.appendChild(document.createElement("br"));
          out.appendChild(again);
        }
        b.parentNode.appendChild(out);
        b.remove();
      })
      .catch(function(err){
        b.disabled = false; b.textContent = "Say it in plain English";
        var out = document.createElement("div");
        out.className = "wu-plain";
        out.textContent = "That did not reach the model (" + (err && err.message || err) + ").";
        b.parentNode.appendChild(out);
      });
  }

  /* an interval that touches the DOM twice a second shows up as a jitter while
     reading. Observe the table instead and add buttons only when rows change. */
  var mo=new MutationObserver(function(){ addButtons(); });
  function watch(){
    var t=document.getElementById("rr-scroll")||document.body;
    mo.observe(t,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",watch);
  else watch();
  addButtons();
  setTimeout(addButtons,1500); setTimeout(addButtons,4000);
})();

/* ---- 17 ---- */
(function () {
  'use strict';
  var doc = document;

  /* ---------- faces (kept from the second block; idempotent) ---------- */
  if (!doc.getElementById("sdr-faces")) {
    var p1 = doc.createElement("link"); p1.rel = "preconnect"; p1.href = "https://fonts.googleapis.com";
    var p2 = doc.createElement("link"); p2.rel = "preconnect"; p2.href = "https://fonts.gstatic.com"; p2.crossOrigin = "anonymous";
    var fl = doc.createElement("link"); fl.id = "sdr-faces"; fl.rel = "stylesheet";
    fl.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap";
    doc.head.appendChild(p1); doc.head.appendChild(p2); doc.head.appendChild(fl);
  }

  /* ---------- css, injected once ---------- */
  var RV_CSS = [
":root{--rv-rust:#b8431f;--rv-ash:#756f69}",
"/* ---- the standing sentence: SECOND block kept (Instrument Serif, 34px/1.1, #1d1d1f) ---- */",
".stand,.rv-sentence,.stand.rv-sentence{font-family:'Instrument Serif',Georgia,'Times New Roman',serif!important;",
"  font-size:34px!important;font-weight:400!important;line-height:1.1!important;",
"  color:#1d1d1f!important;max-width:26em;margin:7px 0 0}",
"/* count: mono, .92em of 34 = 31.28px, rust-text rgb(184,67,31) */",
".rv-count,.rv-sentence .fig{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;",
"  font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}",
"/* aside: Instrument Serif, .62em of 34 = 21.08px, rgb(117,111,105) */",
".rv-aside,.rv-sentence .aside{font-family:'Instrument Serif',Georgia,serif!important;",
"  font-size:.62em!important;color:#756f69!important;margin-left:10px;white-space:nowrap}",
".rv-clause{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;",
"  border-bottom:1px dotted rgba(29,29,31,.28)}",
".rv-clause:hover,.rv-clause:focus-visible{color:#b8431f;border-bottom-color:#b8431f}",
".rv-clause:focus-visible{outline:2px solid #b8431f;outline-offset:2px}",
"/* ---- the aim feedback line: SECOND block kept (keeps its box when empty, so a hover moves nothing) ---- */",
".aim{display:block!important;min-height:20px;margin-top:6px;",
"  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;",
"  font-size:13px;line-height:20px;color:#b8431f!important}",
".aim .undoit{background:none;border:1px solid rgba(184,67,31,.5);color:#b8431f;",
"  border-radius:4px;padding:1px 8px;margin-left:8px;cursor:pointer;font:inherit;font-size:12px}",
"/* ---- the hand line: SECOND block kept (original wording per open rail, Archivo 600) ---- */",
".hand{font-family:Archivo,system-ui,sans-serif;font-size:13px;font-weight:600;line-height:1.4;",
"  color:#1d1d1f;margin-top:2px}",
".hand .kbd{display:none;font-weight:400;color:#6b6560}",
".hand:focus-within .kbd,.hand:hover .kbd{display:inline}",
".hand .c{font-weight:400;color:#6b6560;cursor:pointer;margin-left:6px}",
"/* ---- the AIM AT box: FIRST block kept (built when the page has none), recoloured to the page ---- */",
".rv-aim{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:16px 0 0}",
".rv-aim-label{font:600 11px/1 Archivo,system-ui,sans-serif;letter-spacing:.14em;color:#b8431f}",
".rv-aim select,.rv-aim input{font-family:inherit;font-size:13px;color:#1d1d1f;",
"  padding:6px 8px;border:1px solid #c8c1b4;border-radius:3px;background:#fff}",
".rv-aim input[type=text]{min-width:30ch}",
".rv-take{font-family:inherit;font-size:13px;padding:7px 16px;border:1px solid #1d1d1f;",
"  border-radius:3px;background:#1d1d1f;color:#fff;cursor:pointer}",
".rv-take:hover{filter:brightness(1.15)}",
"/* ---- the seam: FIRST block kept, in the original's own shape ---- */",
".rv-seam{display:block;margin:8px 0 0 auto;height:34px;border:0;background:#b8431f;color:#fff;",
"  font:600 12px/1 Archivo,system-ui,sans-serif;padding:0 18px;cursor:pointer;border-radius:5px 0 0 0}",
".rv-seam:hover{background:#a83d1f}",
"/* ---- margin, reading, ladder row type: SECOND block kept ---- */",
".margin{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.5;",
"  color:#5f584f;margin-top:6px;border-top:1px solid #e2ded5;padding:5px 0 2px}",
".margin span{display:block;color:#5f584f}",
".margin span+span{margin-top:2px}",
".margin .rustnote{color:#b8431f}",
".reading{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#1d1d1f;",
"  margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid #c44b28;background:#faf7f3;max-width:74ch}",
".orow{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11.5px;color:#1d1d1f}",
".orow .on{color:#1d1d1f;font-family:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".orow b{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:400;text-align:right;color:#5f584f}",
"/* a nested duplicate designator in a ladder row never shows */",
".orow .on>.rv-lcode{display:none}",
"/* ---- the tab strip: SECOND block kept (in the flow, never sticky) ---- */",
"[role='tablist']{position:static!important;top:auto!important;bottom:auto!important;z-index:auto!important}",
".tabs{display:block;border-bottom:1px solid #e2ded5;margin:10px 0 12px;padding-bottom:6px}",
"[id^='vtab-'],.tabs .tab{display:inline-block!important;min-height:0!important;height:auto;",
"  padding:4px 10px;font-size:12.5px;line-height:1.35;border-radius:3px;",
"  border:1px solid transparent;background:none;color:#6b6560;cursor:pointer;font-family:inherit}",
"[id^='vtab-'][aria-selected='true'],.tabs .tab.on{background:#fff;border-color:#e2ded5;color:#1d1d1f;font-weight:600}",
".vgroup{display:flex!important;align-items:baseline;gap:10px;margin:0 0 3px}",
".vrow{display:flex!important;gap:2px;flex-wrap:wrap;flex:1;min-width:0}",
".vlab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;",
"  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}",
"/* ---- the case sheet: the ORIGINAL's overlay, restored ---- */",
"#case-wrap{position:fixed!important;inset:0!important;overflow:auto!important;",
"  overscroll-behavior:contain;background:rgba(12,16,22,.72)!important;z-index:60;",
"  align-items:flex-start;justify-content:center;padding:32px 16px}",
"#case-box{position:relative;inset:auto;transform:none;width:100%;max-width:900px;height:auto;",
"  max-height:none;min-height:0;margin:0 auto;overflow:visible;background:#fff;border-radius:12px;",
"  padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-box{max-width:100%}}",
"/* ---- part-month note: FIRST block kept ---- */",
".rv-month-note{color:#b8431f!important;font-size:12px!important;line-height:1.55;margin:0 0 6px}",
"/* ---- record rows back to reference height: FIRST block kept ---- */",
"#rr-table tr:not(.hdr){line-height:1.35!important}",
"#rr-table tr:not(.hdr) td{padding-top:5px!important;padding-bottom:5px!important}",
"#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px!important}",
".rv-spec{line-height:1.45!important}",
".rv-actions{display:flex!important;flex-wrap:nowrap!important;align-items:baseline;gap:12px}",
".rv-actions>*{margin:0!important}"
  ].join("\n");
  if (!doc.querySelector('style[data-rv]')) {
    var rvSt = doc.createElement('style');
    rvSt.setAttribute('data-rv', '1');
    rvSt.textContent = RV_CSS;
    doc.head.appendChild(rvSt);
  }

  /* ---------- state ---------- */
  var RV_AIR = {}, RV_OPKEY = null, RV_COUNT = '';
  var RV_ZONES = { 'ZONE 500': 'left wing' };
  var RV_AIR_FALLBACK = {
    SWAA: 'Southwest Airlines Co', DALA: 'Delta Air Lines Inc',
    SWIA: 'Skywest Airlines Inc', AALA: 'American Airlines Inc',
    CALA: 'Continental Airlines Inc', FDEA: 'Federal Express Corporation'
  };

  /* ---------- helpers ---------- */
  function rvEl(tag, cls) { var n = doc.createElement(tag); if (cls) n.className = cls; return n; }

  function rvStripCounts(s) {
    return (s || '').replace(/\([^)]*\d[^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }

  function rvLeaves(root) {
    var out = [], w = doc.createTreeWalker(root || doc.body, NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) if (!n.firstElementChild) out.push(n);
    return out;
  }
  function rvByText(txt, root) {
    return rvLeaves(root).filter(function (n) {
      return (n.textContent || '').trim().indexOf(txt) > -1;
    });
  }
  function rvFirstText(n) {
    var w = doc.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) return x;
    return null;
  }
  function rvLastText(n) {
    var w = doc.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), x, r = null;
    while ((x = w.nextNode())) if (x.nodeValue.trim()) r = x;
    return r;
  }
  function rvRowsFor(marker, minRows) {
    var leaves = rvByText(marker);
    if (!leaves.length) return null;
    var node = leaves[0];
    while (node && node.parentElement) {
      var p = node.parentElement;
      if (p === doc.body) return null;
      var sibs = Array.prototype.filter.call(p.children, function (c) {
        return (c.textContent || '').indexOf(marker) > -1;
      });
      if (sibs.length >= (minRows || 6)) return { container: p };
      node = p;
    }
    return null;
  }
  function rvParams() { return new URLSearchParams(location.search); }
  function rvGo(p) { location.search = p.toString(); }

  /* ---------- names, harvested from the page's own menus ---------- */
  function rvHarvest() {
    RV_AIR = {}; RV_OPKEY = null;
    var zones = {};
    Array.prototype.forEach.call(doc.querySelectorAll('select'), function (s) {
      var gotAir = false;
      Array.prototype.forEach.call(s.options, function (o) {
        var v = (o.value || '').trim(), label = (o.textContent || '').trim();
        if (!v || !label || label === v) return;
        if (/^[A-Z]{3}A$/.test(v)) { RV_AIR[v] = label; gotAir = true; }
        var zv = v.toUpperCase().replace(/^ZONE\s*/, 'ZONE ').replace(/\s+/g, ' ');
        if (/^ZONE \d+$/.test(zv)) zones[zv] = label;
      });
      if (gotAir && !RV_OPKEY) RV_OPKEY = s.getAttribute('name') || s.id || null;
    });
    for (var k in zones) RV_ZONES[k] = zones[k];
  }

  /* ---------- the ladder: "Southwest Airlines Co (SWAA)", once ---------- */
  function rvRenameLadder() {
    Array.prototype.forEach.call(
      doc.querySelectorAll('.orow[data-take], .orow[data-aim]'),
      function (row) {
        var raw = row.getAttribute('data-take') || row.getAttribute('data-aim') || '';
        var bits = raw.split('|');
        if (bits[0] !== 'op' && bits[0] !== 'operator') return;
        var code = (bits[1] || '').trim().toUpperCase();
        if (!/^[A-Z]{3}A$/.test(code)) return;
        var name = rvStripCounts(RV_AIR[code] || RV_AIR_FALLBACK[code]);
        if (!name) return;
        var cell = row.querySelector('.on');
        if (!cell) return;
        var want = name + ' (' + code + ')';
        if ((cell.textContent || '').trim() === want) return; /* already right; write nothing */
        cell.textContent = want;
      });
  }
  /* nested duplicate designator inside the same row goes */
  function rvHideLadderDupes() {
    Array.prototype.forEach.call(doc.querySelectorAll('.orow .on'), function (on) {
      var kids = on.children, name = null, code = null, i;
      for (i = 0; i < kids.length; i++) {
        if (kids[i].classList.contains('rv-lname')) { if (!name) name = kids[i]; }
        else if (kids[i].classList.contains('rv-lcode')) { code = kids[i]; }
      }
      if (name && code) code.style.display = 'none';
    });
  }

  /* ---------- the standing sentence as headline ---------- */
  function rvSentenceBlock() {
    var s = doc.querySelector('.sentence') || doc.getElementById('iSentence');
    if (s) return s;
    var hits = rvLeaves().filter(function (n) {
      var t = (n.textContent || '').trim();
      return /^\d[\d,]*\s+reports\b/.test(t) && t.length < 240;
    });
    if (!hits.length) return null;
    var node = hits[0];
    while (node.parentElement && node.parentElement !== doc.body) {
      var pt = node.parentElement.textContent.trim();
      if (!/^\d[\d,]*\s+reports\b/.test(pt) || pt.length > 240) break;
      node = node.parentElement;
    }
    return node;
  }

  function rvMonthText(f, t) {
    if (!f && !t) return '';
    function part(s) {
      var d = new Date(s);
      if (isNaN(d)) return s;
      return d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }) + ' ' + d.getUTCFullYear();
    }
    if (f && t) { var a = part(f), b = part(t); return a === b ? a : a + ' \u2013 ' + b; }
    return part(f || t);
  }

  function rvDrop(kind) {
    var p = rvParams();
    if (kind === 'zone') p.delete('zone');
    else { p.delete('from'); p.delete('to'); }
    rvGo(p);
  }

  function rvBuildHeadline() {
    var block = rvSentenceBlock();
    if (!block || block.getAttribute('data-rv')) return;
    var t = block.textContent.replace(/\s+/g, ' ').trim();
    var mc = t.match(/(\d[\d,]*)\s+reports/i);
    var ma = t.match(/(\d[\d,]*)\s+set aside/i);
    RV_COUNT = mc ? mc[1] : ((doc.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', ''])[1]);

    var P = rvParams();
    var zraw = (P.get('zone') || '').trim().toUpperCase().replace(/\s+/g, ' ');
    var zoneName = zraw ? (RV_ZONES[zraw] || P.get('zone')) : '';  /* words, not the code */
    if (zoneName) zoneName = rvStripCounts(zoneName).toLowerCase();
    var monthTxt = rvMonthText(P.get('from'), P.get('to'));

    block.setAttribute('data-rv', '1');
    block.classList.add('rv-sentence');
    block.textContent = '';

    var parts = [{ rust: true, text: (mc ? mc[1] : '') + ' reports' }];
    if (zoneName) parts.push({ drop: 'zone', text: zoneName });
    if (monthTxt) parts.push({ drop: 'dates', text: monthTxt });

    parts.forEach(function (pt, i) {
      if (i) block.appendChild(doc.createTextNode(', '));
      if (pt.rust) {
        var s = rvEl('span', 'rv-count'); s.textContent = pt.text; block.appendChild(s);
      } else {
        var b = rvEl('button', 'rv-clause'); b.type = 'button'; b.textContent = pt.text;
        b.addEventListener('click', function () { rvDrop(pt.drop); });
        block.appendChild(b);
      }
    });
    block.appendChild(doc.createTextNode('.'));
    if (ma) {
      block.appendChild(doc.createTextNode(' '));
      var a = rvEl('span', 'rv-aside');
      a.textContent = ma[1] + ' set aside.';
      block.appendChild(a);
    }
  }

  /* ---------- the AIM AT box ---------- */
  function rvResolveAirline(v) {
    var up = v.trim().toUpperCase();
    if (/^[A-Z]{3}A$/.test(up)) return up;
    var lv = v.trim().toLowerCase(), k;
    for (k in RV_AIR) if (k === up || RV_AIR[k].toLowerCase() === lv) return k;
    for (k in RV_AIR) if (RV_AIR[k].toLowerCase().indexOf(lv) > -1) return k;
    for (k in RV_AIR_FALLBACK) if (RV_AIR_FALLBACK[k].toLowerCase().indexOf(lv) > -1) return k;
    return null;
  }
  function rvResolveZone(v) {
    var up = v.trim().toUpperCase().replace(/\s+/g, ' ');
    if (/^ZONE\s*\d+$/.test(up)) return up.replace(/^ZONE\s*/, 'ZONE ');
    if (/^\d+$/.test(up)) return 'ZONE ' + up;
    var lv = v.trim().toLowerCase(), k;
    for (k in RV_ZONES) if (RV_ZONES[k].toLowerCase().indexOf(lv) > -1) return k;
    return null;
  }

  function rvBuildAim() {
    /* the original page carries its own .aimat; never build a second one */
    if (doc.getElementById('iAimAt') && doc.querySelector('.aimat')) return;
    var block = doc.querySelector('.rv-sentence') || rvSentenceBlock();
    if (!block || !block.parentNode || doc.querySelector('.rv-aim')) return;

    var box = rvEl('div', 'rv-aim'); box.setAttribute('data-rv', '1');
    var lab = rvEl('span', 'rv-aim-label'); lab.textContent = 'AIM AT'; box.appendChild(lab);

    var kind = rvEl('select');
    [['airline', 'Airline'], ['airframe', 'Airframe'], ['zone', 'Zone']].forEach(function (o) {
      var op = rvEl('option'); op.value = o[0]; op.textContent = o[1]; kind.appendChild(op);
    });
    box.appendChild(kind);

    var target = rvEl('input'); target.type = 'text';
    target.placeholder = 'e.g. Southwest Airlines Co \u00b7 SWAA';
    box.appendChild(target);

    var take = rvEl('button', 'rv-take'); take.type = 'button'; take.textContent = 'Take it';
    box.appendChild(take);

    var day = rvEl('input'); day.type = 'date';
    day.title = 'One day'; day.setAttribute('aria-label', 'One day');
    box.appendChild(day);

    take.addEventListener('click', function () {
      var p = rvParams(), v = target.value.trim(), d = day.value;
      if (!v && !d) return;
      if (v) {
        if (kind.value === 'airline') {
          var code = rvResolveAirline(v);
          if (!code) { target.style.borderColor = '#b8431f'; return; }
          p.set(RV_OPKEY || 'operator', code);
        } else if (kind.value === 'zone') {
          var zc = rvResolveZone(v);
          if (!zc) { target.style.borderColor = '#b8431f'; return; }
          p.set('zone', zc);
        } else {
          var keys = ['tail', 'airframe', 'aircraft', 'reg', 'nnumber'], key = 'tail', i;
          for (i = 0; i < keys.length; i++) if (p.has(keys[i])) { key = keys[i]; break; }
          p.set(key, v.toUpperCase());
        }
      }
      if (d) { p.set('from', d); p.set('to', d); }
      rvGo(p);
    });

    block.parentNode.insertBefore(box, block.nextSibling);
  }

  /* ---------- the hand line (SECOND block kept) ---------- */
  var HAND = { when: "Drag across the months to take a period.",
    where: "Click a zone on the aircraft to keep only what was found there.",
    whose: "Click an airline or an airframe to follow it.",
    forced: "Click what the crew had to do." };
  var KBD = "Keyboard: arrows walk the months, Shift and an arrow extends, Enter takes it.";

  function rvOpenRail() {
    var p = doc.querySelector("#hero .picker [data-pick][aria-selected='true']");
    if (p) return p.getAttribute("data-pick");
    var r = doc.querySelector("#hero .rail.open[data-rail]");
    return r ? r.getAttribute("data-rail") : "whose";
  }
  function rvEnsureHand() {
    var hero = doc.getElementById("hero"); if (!hero) return;
    var aim = hero.querySelector(".aim"); if (!aim) return;
    var hand = doc.getElementById("iHand") || hero.querySelector(".hand");
    if (!hand) {
      hand = doc.createElement("div"); hand.className = "hand"; hand.id = "iHand";
      var anchor = hero.querySelector(".aimat") || aim;
      anchor.insertAdjacentElement("afterend", hand);
    }
    var txt = HAND[rvOpenRail()] || HAND.whose;
    if (hand.getAttribute("data-txt") === txt) return;
    hand.setAttribute("data-txt", txt);
    while (hand.firstChild) hand.removeChild(hand.firstChild);
    hand.appendChild(doc.createTextNode(txt));
    var kbd = doc.createElement("span"); kbd.className = "kbd"; kbd.textContent = KBD; hand.appendChild(kbd);
    var c = doc.createElement("span"); c.className = "c"; c.textContent = "Or use the filters below.";
    c.onclick = function () { var d = doc.getElementById("morefilters");
      if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); } };
    hand.appendChild(c);
  }

  /* ---------- the seam ---------- */
  function rvRecordsList() {
    var f = rvRowsFor('Read the whole write-up', 6) || rvRowsFor('Say it in plain English', 6);
    return f ? f.container : null;
  }
  function rvBuildSeam() {
    if (doc.querySelector('.seam, .rv-seam')) return;  /* the page's own seam wins */
    var count = RV_COUNT ||
      (doc.body.textContent.match(/\b(\d[\d,]*)\s+reports\b/) || ['', '145'])[1];
    var list = rvRecordsList();
    var btn = rvEl('button', 'rv-seam'); btn.type = 'button';
    btn.setAttribute('data-rv', '1');
    btn.textContent = 'Read the ' + count + ' \u2192';
    btn.addEventListener('click', function () {
      var first = list && list.firstElementChild;
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: doc.body.scrollHeight, behavior: 'smooth' });
    });
    if (list && list.parentNode) list.parentNode.insertBefore(btn, list);
    else doc.body.appendChild(btn);
  }

  /* ---------- the part-month note ---------- */
  function rvAshLine(scope) {
    if (!scope) return null;
    var best = null;
    Array.prototype.forEach.call(scope.querySelectorAll('*'), function (n) {
      if (best || n.firstElementChild) return;
      var t = (n.textContent || '').trim();
      if (t.length < 12 || t.length > 300) return;
      var cs = getComputedStyle(n);
      var m = cs.color.match(/\d+/g);
      if (!m) return;
      var r = +m[0], g = +m[1], b = +m[2];
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 14 && mx > 110 && parseFloat(cs.fontSize) <= 13) best = n;
    });
    return best;
  }
  function rvRailsRoot() {
    var leaf = null, codes = ['SWAA', 'DALA', 'AALA', 'SWIA', 'CALA'], i, hits;
    for (i = 0; i < codes.length && !leaf; i++) {
      hits = rvByText(codes[i]);
      if (hits.length) leaf = hits[0];
    }
    if (!leaf) return null;
    var node = leaf;
    while (node.parentElement && node.parentElement !== doc.body) {
      if ((node.parentElement.textContent || '').indexOf('Read the whole write-up') > -1) break;
      node = node.parentElement;
    }
    return node;
  }
  function rvPartMonthNote() {
    if (doc.querySelector('.rv-month-note')) return;
    var now = new Date();
    var last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var day = now.getDate();
    if (day >= last) return;
    var name = now.toLocaleString('en-US', { month: 'long' });
    var note = rvEl('p', 'rv-month-note');
    note.setAttribute('data-rv', '1');
    note.textContent = name + ' ' + now.getFullYear() + ' covers 1 to ' + day + ' ' + name +
      ', so its bar counts ' + day + ' days against ' + last + ' in a whole one';
    var rails = rvRailsRoot();
    var ash = rvAshLine(rails);
    if (ash && ash.parentNode) ash.parentNode.insertBefore(note, ash);
    else if (rails) rails.insertBefore(note, rails.firstChild);
    else doc.body.appendChild(note);
  }

  /* ---------- specimens bare, in monospace ---------- */
  var RV_QLEAD = /^[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL = /[\u201C\u201D\u2018\u2019"']+$/;
  var RV_QLEAD_WS = /^\s*[\u201C\u201D\u2018\u2019"']+/, RV_QTAIL_WS = /[\u201C\u201D\u2018\u2019"']+\s*$/;

  function rvBareSpecimens() {
    Array.prototype.forEach.call(doc.querySelectorAll('body *'), function (n) {
      var s = (n.textContent || '').trim();
      if (s.length < 3) return;
      if (RV_QLEAD.test(s) === false && RV_QTAIL.test(s) === false) return;
      var cs = getComputedStyle(n);
      if (!/mono/i.test(cs.fontFamily)) return;
      var pre = /^pre/.test(cs.whiteSpace);
      var lead = pre ? RV_QLEAD : RV_QLEAD_WS;
      var tail = pre ? RV_QTAIL : RV_QTAIL_WS;
      var f = rvFirstText(n), l = rvLastText(n);
      if (!f || !l) return;
      var changed = false;
      if (f === l) {
        var v = f.nodeValue, nv = v.replace(lead, '').replace(tail, '');
        if (nv !== v && nv.trim().length > 0) { f.nodeValue = nv; changed = true; }
      } else {
        var fv = f.nodeValue.replace(lead, '');
        if (fv !== f.nodeValue) { f.nodeValue = fv; changed = true; }
        var lv = l.nodeValue.replace(tail, '');
        if (lv !== l.nodeValue) { l.nodeValue = lv; changed = true; }
      }
      if (changed) n.classList.add('rv-spec');
    });
  }

  /* ---------- plain-English button beside its read-more neighbour ---------- */
  function rvFixPlainButtons() {
    Array.prototype.forEach.call(
      doc.querySelectorAll('button, a, input[type="button"], input[type="submit"]'),
      function (b) {
        var label = ((b.textContent || b.value || '') + '').replace(/\s+/g, ' ').trim();
        if (label !== 'Say it in plain English') return;
        if (b.getAttribute('data-rv-moved')) return;
        b.setAttribute('data-rv-moved', '1');
        var row = b.closest('li, article, div');
        if (!row) return;
        var ctrls = row.querySelectorAll('button, a'), tw = null, i;
        for (i = 0; i < ctrls.length; i++) {
          if (((ctrls[i].textContent || '') + '').replace(/\s+/g, ' ').trim() === 'Read the whole write-up') {
            tw = ctrls[i]; break;
          }
        }
        if (!tw || !tw.parentNode) return;
        if (tw.parentNode === b.parentNode) { b.parentNode.classList.add('rv-actions'); return; }
        var old = b.parentNode;
        tw.parentNode.classList.add('rv-actions');
        tw.parentNode.insertBefore(b, tw.nextSibling);
        if (old && old !== row && old !== tw.parentNode &&
            !old.textContent.trim() && old.parentElement) {
          old.parentElement.removeChild(old);
        }
      });
  }

  /* ---------- the tab strip: in the flow, never sticky ---------- */
  function rvVtabCount(n) { return n.querySelectorAll("[id^='vtab-']").length; }
  function rvFixTabs() {
    var first = doc.querySelector("[id^='vtab-']"); if (!first) return;
    var total = rvVtabCount(doc), strip = first.parentElement;
    while (strip && strip.parentElement && strip.parentElement !== doc.body
          && strip.parentElement.id !== "main"
          && rvVtabCount(strip.parentElement) === total) {
      strip = strip.parentElement;
    }
    if (!strip) return;
    var n = strip;
    for (var i = 0; i < 4 && n && n.nodeType === 1 && n !== doc.body && n.id !== "main"; i++, n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.position === "sticky" || cs.position === "fixed") {
        n.style.position = "static"; n.style.top = "auto"; n.style.zIndex = "auto";
      }
    }
    strip.style.display = "block";
    strip.style.borderBottom = "1px solid #e2ded5";
    strip.style.margin = "10px 0 12px";
    strip.style.paddingBottom = "6px";
    Array.prototype.forEach.call(strip.children, function (g) {
      if (g.nodeType !== 1) return;
      g.style.display = "flex"; g.style.alignItems = "baseline"; g.style.gap = "10px"; g.style.margin = "0 0 3px";
      Array.prototype.forEach.call(g.children, function (c) {
        if (c.nodeType !== 1) return;
        if (c.querySelector && c.querySelector("[id^='vtab-']")) {
          c.style.display = "flex"; c.style.flexWrap = "wrap"; c.style.gap = "2px";
          c.style.flex = "1"; c.style.minWidth = "0";
        } else if (c.tagName !== "BUTTON" && c.getAttribute("role") !== "tab") {
          c.style.flex = "0 0 200px"; c.style.textAlign = "right"; c.style.whiteSpace = "nowrap";
          c.style.fontFamily = "Archivo,system-ui,sans-serif"; c.style.fontSize = "10px";
          c.style.fontWeight = "600"; c.style.textTransform = "uppercase";
          c.style.color = "#57514a"; c.style.lineHeight = "1.35";
        }
      });
    });
  }

  /* ---------- the case sheet closes on Escape even if the page forgot ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var w = doc.getElementById("case-wrap");
    if (w && w.style.display === "flex") {
      if (typeof window.closeCase === "function") window.closeCase();
      else w.style.display = "none";
    }
  });

  /* ---------- apply, re-apply, keep watching ---------- */
  var RV_MO = null, RV_TIMER = null;

  function rvApply() {
    if (RV_MO) RV_MO.disconnect();
    try {
      rvHarvest();
      rvBareSpecimens();
      rvFixPlainButtons();
      rvRenameLadder();
      rvHideLadderDupes();
      rvBuildHeadline();
      rvBuildAim();
      rvEnsureHand();
      rvBuildSeam();
      rvPartMonthNote();
      rvFixTabs();
    } catch (e) { /* never break the page */ }
    RV_MO = RV_MO || new MutationObserver(function () {
      clearTimeout(RV_TIMER);
      RV_TIMER = setTimeout(rvApply, 250);
    });
    setTimeout(function () {
      RV_MO.observe(doc.body, { childList: true, subtree: true });
    }, 120);
  }

  function rvBoot() {
    rvApply();
    setTimeout(rvApply, 1500); /* rails and charts that render late */
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', rvBoot);
  else rvBoot();
})();

/* ---- 10 ---- */

/* ---- panel guidance for the SDR rebuild ----
   Idempotent: every note is marked data-sdrs-note, existing notes are
   rewritten in place, stale ones are swept, so re-running after a redraw
   never appends a second copy. Exposed as window.sdrsGuidanceApply and
   also self-scheduled through a MutationObserver. */
(function () {
  'use strict';

  var NOTE_ATTR = 'data-sdrs-note';
  var STYLE_ID  = 'sdrs-guidance-style';

  /* ---------- CSS, injected once ---------- */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      '.sdrs-guidance{font-size:.875em;line-height:1.55;color:#57606a;margin:.4em 0 1.1em;max-width:70ch}' +
      '.sdrs-guidance--table{font-size:.8em;color:#6e7781;margin:0 0 .55em;max-width:70ch}';
    document.head.appendChild(st);
  }

  /* ---------- the guidance, panel by panel ---------- */
  var PANELS = [
    {
      key: 'patterns',
      title: 'Patterns',
      text:
        'These charts follow whatever you have filtered on the Search tab, and clicking any bar narrows the ' +
        'selection to it. A bar counts every report naming that code or action in any slot, so it is the exact ' +
        'number a click lands you on. The bands are kept as the FAA received them, including the broad Other ' +
        'band, which collects everything the standard codes miss and towers over every named code beside it. ' +
        'Because a single report can name up to four codes or actions, the bars overlap and can add to more ' +
        'than the number of reports in the selection.'
    },
    {
      key: 'aircraft',
      title: 'Aircraft',
      text:
        'Type a tail number here, or click one anywhere else in the tool, and the entire selection narrows ' +
        'to that airframe.'
    },
    {
      key: 'found',
      title: 'How it was found',
      text:
        'A crack picked up by eddy current or X-ray was never visible from the outside, so dividing each ' +
        'system\u2019s findings by method shows whether trouble is being caught by instruments before anyone could ' +
        'see it, or only once it showed. Not every report falls on one side or the other: functional checks ' +
        'and unrecorded methods make up a large share, and they are listed too. Whatever you have filtered ' +
        'on the Search tab applies here as well.'
    },
    {
      key: 'fleet',
      title: 'Fleet',
      text:
        'One airline, one type: a report count on its own says little. The number that matters is how many ' +
        'separate aircraft those reports touched. Many write-ups concentrated on a single airframe point to ' +
        'a bad machine; the same count spread across many airframes points to a fleet problem.'
    },
    {
      key: 'leads',
      title: 'Story leads',
      text:
        'Both tables set the last ninety days against everything before it. A sudden cluster means an aircraft ' +
        'has collected more write-ups in the last ninety days than in its entire earlier record here. Look at ' +
        'the actual dates before promoting a cluster to a trend.'
    },
    {
      key: 'newdefects',
      title: 'New defects',
      text:
        'A defect that is new says more than one that is merely common. These are parts and systems being ' +
        'written up now that hardly appeared before, so the pattern is still taking shape. The counts are ' +
        'small: treat them as a tip-off rather than a finding.'
    },
    {
      key: 'sameday',
      title: 'Same day, many aircraft',
      text:
        'When one airline writes up the same system on several different aircraft in a single day, the ' +
        'aircraft is rarely the cause: look instead to a batch of parts, a procedure, a supplier or a shared ' +
        'inspection. This is the pattern that turns a maintenance note into a story.',
      table: {
        re: /other days|days like this/i,
        text:
          'A large cluster is not automatically an incident. When the same airline and system cluster across ' +
          'many separate days instead, that is usually a scheduled inspection working through the fleet, and ' +
          'the other-days-like-this column exists to separate the two: a low figure there is the case worth ' +
          'chasing. Clusters that already fit the scheduled pattern are hidden.'
      }
    },
    {
      key: 'samedefect',
      title: 'Same defect',
      text:
        'One part number, failing the same way, across many aircraft and more than one airline is a fleet ' +
        'problem, not a one-off incident.'
    },
    {
      key: 'corrosion',
      title: 'Corrosion & cracks',
      text:
        'Level 2 means the finding went beyond what the manufacturer allows and needed repair; Level 1 stays ' +
        'within limits and is not reportable, which is why it never appears here. Every report in this panel ' +
        'obliged the operator to notify the regulator within three days. The grey band under each row is the ' +
        'mechanic\u2019s own words.'
    },
    {
      key: 'oldairframes',
      title: 'Old airframes',
      text:
        'Hours and cycles age an aircraft in different ways: a short-haul airframe stacks up cycles quickly ' +
        'and hours slowly, and because every flight pressurises and then depressurises the hull, it is cycles ' +
        'that drive cracking, while hours wear out the parts that simply run. What is plotted is the share of ' +
        'reports in each age band that record corrosion at all, which compares like with like; the raw counts ' +
        'do not, because the bands hold very different numbers of aircraft. Bands marked small contain too ' +
        'few reports to carry a percentage, so disregard their share.'
    },
    {
      key: 'engines',
      title: 'Engines',
      text:
        'Only a minority of reports name an engine, so this is a count inside a small subset, not a failure ' +
        'rate per engine in service. Treat it as a way to find cases worth checking, never as a league table ' +
        'of manufacturers.'
    },
    {
      key: 'crew',
      title: 'What the crew did',
      text:
        'This panel is not about what broke but about what the breakage forced the crew to do. It ranks by ' +
        'how many reports carried a crew action, and the same table can be flipped between airline, model ' +
        'and manufacturer.',
      table: {
        re: /\breports?\b/i,
        text:
          'A high share carried on a few hundred reports is not the same finding as the same share on tens of ' +
          'thousands, so read the Reports column alongside the percentage. A share is per report filed, not ' +
          'per flight.'
      }
    },
    {
      key: 'compare',
      title: 'Compare',
      text:
        'Two airlines or models side by side. The bars are raw counts, and a bigger operator simply files ' +
        'more reports, so treat this as a starting point for questions rather than a score.'
    }
  ];

  /* ---------- helpers ---------- */
  function norm(s) {
    return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
  }
  var CFG = {};
  PANELS.forEach(function (p) { CFG[norm(p.title)] = p; });

  var HEADING_SEL = 'h1,h2,h3,h4,h5,h6,[role="heading"],[class*="title" i],[class*="heading" i]';

  function matchedHeadings() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll(HEADING_SEL), function (el) {
      var cfg = CFG[norm(el.textContent)];
      if (!cfg) return;
      if (el.closest && (el.closest('svg') || el.closest('[' + NOTE_ATTR + ']'))) return;
      if (el.closest('[role="tablist"]') || el.getAttribute('role') === 'tab') return;
      var tag = el.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'LABEL' || tag === 'OPTION' ||
          tag === 'SELECT' || tag === 'TITLE') return;
      if (/(^|\s|-)tab/i.test(' ' + (el.className || ''))) return;
      /* if this element merely wraps a same-named heading, let the inner one win */
      var inner = el.querySelector(HEADING_SEL);
      if (inner && norm(inner.textContent) === norm(el.textContent)) return;
      out.push({ el: el, cfg: cfg });
    });
    return out;
  }

  /* tables that sit between this panel's heading and the next one */
  function tablesBetween(h, stop) {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
      if (!(h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      if (stop && !(stop.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING)) return;
      out.push(t);
    });
    return out;
  }

  /* ---------- application ---------- */
  function apply() {
    injectStyle();
    var heads = matchedHeadings();

    var byKey = {};
    Array.prototype.forEach.call(document.querySelectorAll('[' + NOTE_ATTR + ']'), function (n) {
      var k = n.getAttribute(NOTE_ATTR);
      (byKey[k] = byKey[k] || []).push(n);
    });

    var used = {};
    heads.forEach(function (m, i) {
      var cfg = m.cfg, h = m.el;
      if (used[cfg.key]) return;
      used[cfg.key] = true;
      var stop = i + 1 < heads.length ? heads[i + 1].el : null;

      /* main block, directly under the heading */
      var note = null;
      (byKey[cfg.key] || []).forEach(function (n) {
        if (!n.isConnected) return;
        if (!note && n.previousElementSibling === h) { note = n; return; }
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      if (!note) {
        if (!h.parentNode) return;
        note = document.createElement('p');
        note.className = 'sdrs-guidance';
        h.parentNode.insertBefore(note, h.nextSibling);
      }
      note.setAttribute(NOTE_ATTR, cfg.key);
      if (note.textContent !== cfg.text) note.textContent = cfg.text;

      /* column caveat, directly beside the table it qualifies */
      if (cfg.table) applyTableNote(h, stop, cfg, byKey);
    });
  }

  function applyTableNote(h, stop, cfg, byKey) {
    var tables = tablesBetween(h, stop);
    var matched = tables.filter(function (t) { return cfg.table.re.test(t.textContent || ''); });
    if (matched.length) tables = matched;
    if (!tables.length) return;

    var prefix = cfg.key + '-tbl';
    Object.keys(byKey).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      byKey[k].forEach(function (n) {
        if (!n.isConnected) return;
        var t = n.nextElementSibling;
        if (!t || tables.indexOf(t) === -1 || t.previousElementSibling !== n) {
          if (n.parentNode) n.parentNode.removeChild(n);
        }
      });
    });

    tables.forEach(function (t, i) {
      var k = prefix + i;
      var prev = t.previousElementSibling;
      var note = (prev && prev.getAttribute && (prev.getAttribute(NOTE_ATTR) || '').indexOf(prefix) === 0)
        ? prev : null;
      if (!note) {
        note = document.createElement('p');
        note.className = 'sdrs-guidance sdrs-guidance--table';
        t.parentNode.insertBefore(note, t);
      }
      note.setAttribute(NOTE_ATTR, k);
      if (note.textContent !== cfg.table.text) note.textContent = cfg.table.text;
    });
  }

  /* ---------- redraw handling ---------- */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; apply(); });
  }

  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if ((n.getAttribute && n.getAttribute(NOTE_ATTR)) ||
              (n.querySelector && n.querySelector('[' + NOTE_ATTR + ']'))) return;
        }
      }
      schedule();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.sdrsGuidanceApply = apply;
})();


