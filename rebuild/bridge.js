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

/* ---- 17: the instrument's setting, written by the model ---- */
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

/* ---- 19: the phone, the stepper, the ids, written by the model ---- */

/* ---------- rv: scoped helpers (no name collides with the page) ---------- */
function rvQ(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function rvEsc(s){
  if(typeof esc==='function'){try{return esc(s)}catch(e){}}
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}
function rvNum(n){
  if(typeof num==='function'){try{return num(n)}catch(e){}}
  n=Number(n);return isFinite(n)?n.toLocaleString('en'):String(n);
}
function rvEl(id){
  if(typeof el==='function'){try{return el(id)}catch(e){}}
  return document.getElementById(id);
}
/* guarded reads of the page's own closure helpers (TDZ-safe) */
function rvOpLbl(o){try{if(typeof opName==='function'){var s=opName(o);if(s)return s}}catch(e){}return o||''}
function rvMonName(m){try{if(typeof monthName==='function')return monthName(m)}catch(e){}
  var M=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var p=String(m||'').split('-');return (M[+p[1]]||m||'')+(p[0]?' '+p[0]:'');}
function rvPartMonth(m){try{if(typeof partialMonth==='function')return !!partialMonth(m)}catch(e){}return false}
function rvTakeFilter(f,v,l){try{if(typeof takeFilter==='function'){takeFilter(f,v,l||'');return true}}catch(e){}return false}
function rvSetFilter(f,v){try{if(typeof setFilter==='function'){setFilter(f,v);return true}}catch(e){}return false}
function rvSearch(){try{if(typeof search==='function'){search(0);return true}}catch(e){}return false}
function rvGoResults(){try{if(typeof goResults==='function'){goResults();return true}}catch(e){}return false}
var RV_={mode:null,deskLen:-1,phTap:null,phFrom:null,harvesting:false,phFails:0,phDisabled:false,
         t:null,inited:false,caseSession:null,caseDir:0};

/* ---------- rv: the phone stylesheet (injected once, all scoped) ---------- */
function rvCss(){
  if(rvEl('rvPhoneCss'))return;
  var s=document.createElement('style');s.id='rvPhoneCss';s.type='text/css';
  s.textContent=[
'#hero.phone{border-radius:0;margin:0 -20px;border-left:0;border-right:0;background:var(--paper,#f7f5f0)}',
'#hero.phone .rv-desk{display:none!important}',
'#hero.phone .rv-ph{display:block}',
'#hero.phone .phbar{position:sticky;top:0;z-index:20;background:var(--paper,#f7f5f0);border-bottom:1px solid var(--line,#e2ded5);padding:8px 14px;display:flex;flex-direction:column;gap:5px}',
'#hero.phone .phcount{font-family:"Instrument Serif",Georgia,serif;font-size:22px;line-height:1;color:var(--ink,#1d1d1f)}',
'#hero.phone .phcount b{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:20px;color:#b8431f;font-weight:500}',
'#hero.phone .phchips{display:flex;gap:5px;flex-wrap:wrap;font-size:11.5px}',
'#hero.phone .phchips .chip{cursor:pointer;border:0;background:#efece5;border-radius:10px;padding:3px 9px;font-size:11.5px;color:#5f584f;font-family:inherit;display:inline-block}',
'#hero.phone .phchips .chip b{margin-left:3px}',
'#hero.phone .phchips .rv-none{color:var(--ash,#6b6560)}',
'#hero.phone .phacts{display:flex;gap:8px}',
'#hero.phone .phacts .ghost{flex:1;min-height:38px;font-size:12.5px;font-family:inherit}',
'#hero.phone .phacts .badge{font-style:normal;background:#c44b28;color:#fff;border-radius:9px;padding:0 6px;margin-left:5px;font-size:11px}',
'#hero.phone .ph{border-top:1px solid var(--line,#e2ded5)}',
'#hero.phone .phhead{width:100%;display:flex;align-items:baseline;gap:8px;background:none;color:inherit;border:0;padding:11px 14px;min-height:44px;text-align:left;cursor:pointer;font-family:inherit}',
'#hero.phone .phq{font:600 11px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:inherit}',
'#hero.phone .phpn{font-size:11px;color:var(--ash,#6b6560)}',
'#hero.phone .phclause{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;color:#b8431f;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#hero.phone .phchev{margin-left:auto;color:var(--ash,#6b6560)}',
'#hero.phone .ph.shut .phbody{display:none}',
'#hero.phone .phbody{padding:0 14px 10px}',
'#hero.phone .phpresets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
'#hero.phone .chipbtn{border:1px solid var(--line,#e2ded5);background:#fff;color:var(--ink,#1d1d1f);border-radius:999px;padding:6px 14px;font-size:12px;min-height:44px;cursor:pointer;font-family:inherit}',
'#hero.phone .phstrip{display:flex;gap:3px;overflow-x:auto;touch-action:pan-x;padding-bottom:4px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}',
'#hero.phone .phmo{flex:none;width:44px;min-height:44px;border:0;background:none;color:var(--ink,#1d1d1f);padding:0;position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;cursor:pointer;font-family:inherit}',
'#hero.phone .phmo i{display:block;width:22px;background:#d8d2c6;border-radius:1px}',
'#hero.phone .phmo span{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:9.5px;color:var(--ash,#6b6560);margin-top:2px}',
'#hero.phone .phmo.part i{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,#f7f5f0 3px 6px)}',
'#hero.phone .phmo.lit i{background:#c44b28}',
'#hero.phone .phmo.lit{outline:1.5px solid currentColor;outline-offset:1px}',
'#hero.phone .phhint{font-size:11.5px;color:var(--smoke,#6b6560);margin-top:4px}',
'#hero.phone .phmap{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
'#hero.phone .phmap.pads{grid-template-columns:1fr 1fr;margin-top:6px}',
'#hero.phone .phcell{min-height:64px;width:100%;border:1px solid var(--line,#e2ded5);color:var(--ink,#1d1d1f);border-radius:5px;cursor:pointer;background:rgba(196,75,40,var(--f,.1));display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:7px 9px;gap:2px;text-align:left;font-family:inherit}',
'#hero.phone .phcell span{font-size:11.5px;line-height:1.25}',
'#hero.phone .phcell b{font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:400;font-size:12px;color:#5f584f}',
'#hero.phone .phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,#f7f5f0 4px 8px)}',
'#hero.phone .phcell.lit,#hero.phone .phrow.lit{outline:2px solid var(--ink,#1d1d1f);outline-offset:1px}',
'#hero.phone .phsub{font:600 10.5px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash,#6b6560);margin:8px 0 4px}',
'#hero.phone .phladder{display:flex;flex-direction:column;gap:2px}',
'#hero.phone .phrow{display:grid;grid-template-columns:1fr 52px;grid-template-areas:"n n" "b c";row-gap:2px;min-height:52px;align-content:center;border:0;background:none;color:var(--ink,#1d1d1f);padding:0 2px;cursor:pointer;text-align:left;font-family:inherit;width:100%}',
'#hero.phone .phrow .pn2{grid-area:n;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#hero.phone .phrow .pb{grid-area:b;height:7px;background:#e8e3d8;border-radius:4px;overflow:hidden}',
'#hero.phone .phrow .pb i{display:block;height:100%;background:#c44b28}',
'#hero.phone .phrow b{grid-area:c;font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:400;text-align:right;font-size:12px;color:#5f584f}',
'#hero.phone .phblock{position:relative;height:26px;background:#e8e3d8;border-radius:4px;overflow:hidden;display:flex;align-items:center;margin-bottom:8px}',
'#hero.phone .phblock i{position:absolute;left:0;top:0;bottom:0;background:#c44b28}',
'#hero.phone .phblock span{position:relative;padding-left:9px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px}',
'#hero.phone .specimen{margin:10px 14px 0;border-top:1px solid var(--line,#e2ded5);padding-top:6px}',
'#hero.phone .margin{margin:10px 14px 0;border-top:1px solid var(--line,#e2ded5);padding-top:6px}',
'#hero.phone .seam{display:block;width:100%;height:44px;border:0;background:#c44b28;color:#fff;font:600 12px/1 Archivo,system-ui,sans-serif;cursor:pointer;border-radius:0;margin-top:10px}',
'#hero.phone .seam:hover{background:#a83d1f}',
'#rvPhPill{position:fixed;left:12px;right:12px;bottom:12px;z-index:90;min-height:52px;border:0;border-radius:10px;background:var(--ink,#1d1d1f);color:#fff;font-size:13px;font-family:inherit;padding:10px 14px;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.32);cursor:pointer}',
'#rvPhPill[hidden]{display:none}',
'#rvPhPill .go{display:block;color:#ffb08a;font-weight:600;margin-top:3px}',
'.panel h1{font:700 21px/1.25 Archivo,system-ui,sans-serif;margin:0 0 8px;color:inherit}',
'@media(max-width:479px){#hero.phone .specimen{display:none}}'
  ].join('\n');
  document.head.appendChild(s);
}

/* ---------- rv: model building (page data first, DOM marks second) ---------- */
function rvEmptyModel(){return {total:0,months:[],zones:[],ops:[],tails:[],crew:[],
  pads:{nowhere:0,outside:0},crewN:0};}
function rvCountOf(t){
  var m=/([\d][\d,]*)\s*reports?/i.exec(t||'');
  if(m)return Number(m[1].replace(/,/g,''));
  var all=String(t||'').match(/\d[\d,]*/g);
  return all?Number(all[all.length-1].replace(/,/g,'')):0;
}
function rvZoneLabel(lab,key){
  var s=String(lab||'').replace(/,?\s*[\d,]+\s+reports?.*$/i,'').trim();
  return s||key;
}
function rvModelFromData(d){
  if(!d)return null;
  var m=rvEmptyModel();
  m.total=Number(d.total)||0;
  m.crewN=Number(d.crew_reports)||0;
  (d.months||[]).forEach(function(x){if(x&&x.m)m.months.push(
    {key:x.m,n:Number(x.n)||0,label:rvMonName(x.m),part:rvPartMonth(x.m)});});
  (d.zones||[]).forEach(function(z){if(z&&z.code)m.zones.push(
    {key:z.code,label:z.label||z.code,n:Number(z.n)||0});});
  (d.operator_rows||[]).forEach(function(r){if(r&&r.o)m.ops.push(
    {key:r.o,label:rvOpLbl(r.o),n:Number(r.n)||0});});
  (d.swarm||[]).slice(0,8).forEach(function(a){if(a&&a.t)m.tails.push(
    {key:a.t,label:'N'+a.t,n:Number(a.n)||0});});
  (d.crew||[]).forEach(function(c){if(!c)return;
    if(['K','0','O'].indexOf(String(c.code))>=0)return;
    m.crew.push({key:c.code,label:c.label||c.code,n:Number(c.n)||0});});
  m.crew.sort(function(a,b){return b.n-a.n});m.crew=m.crew.slice(0,8);
  m.pads.nowhere=Number(d.no_location)||0;
  m.pads.outside=Number(d.other_location)||0;
  return m;
}
function rvModelFromDOM(scope){
  var m=rvEmptyModel(),seen={};
  rvQ('[data-aim^="month|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-aim')||'').slice(6);
    if(!k||seen['m'+k])return;seen['m'+k]=1;
    var lab=e.getAttribute('aria-label')||e.getAttribute('title')||'';
    m.months.push({key:k,n:rvCountOf(lab),label:rvMonName(k),
      part:/part month|still filling/i.test(lab)});
  });
  var zs={};
  rvQ('[data-take^="zone|"],[data-aim^="zone|"]',scope).forEach(function(e){
    var spec=e.getAttribute('data-take')||e.getAttribute('data-aim')||'';
    var k=spec.slice(5);if(!k||zs[k])return;zs[k]=1;
    if(/^ZONE\s*0+$/i.test(k))return;
    var lab=e.getAttribute('aria-label')||e.getAttribute('title')||'';
    m.zones.push({key:k,label:rvZoneLabel(lab,k),n:rvCountOf(lab)});
  });
  var os={};
  rvQ('[data-take^="operator|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(9);
    if(!k||os[k])return;os[k]=1;
    var lEl=e.querySelector('.rv-lname')||e.querySelector('.on');
    var nEl=e.querySelector('b');
    m.ops.push({key:k,label:(lEl?lEl.textContent:e.textContent)
      .replace(/\s*\([A-Z0-9]{2,4}\)\s*$/,'').trim(),n:nEl?rvCountOf(nEl.textContent):0});
  });
  var ts={};
  rvQ('[data-take^="tail|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(5);
    if(!k||ts[k])return;ts[k]=1;
    var nEl=e.querySelector('b');
    m.tails.push({key:k,label:'N'+k,n:nEl?rvCountOf(nEl.textContent):0});
  });
  var cs={};
  rvQ('[data-take^="crew|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(5);
    if(!k||cs[k])return;cs[k]=1;
    var lEl=e.querySelector('.on');var nEl=e.querySelector('b');
    m.crew.push({key:k,label:(lEl?lEl.textContent:e.textContent).trim(),
      n:nEl?rvCountOf(nEl.textContent):0});
  });
  var fb=scope.querySelector('.fblock,[data-aim="crewall"]');
  if(fb){var mm=/([\d,]+)\s*of\s*([\d,]+)/.exec((fb.querySelector('.flab')||fb).textContent||'');
    if(mm){m.crewN=Number(mm[1].replace(/,/g,''));
      if(!m.total)m.total=Number(mm[2].replace(/,/g,''));}}
  rvQ('[data-aim^="pad|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-aim')||'').slice(4);
    var n=rvCountOf(e.getAttribute('aria-label')||e.textContent||'');
    if(k==='nowhere')m.pads.nowhere=n;if(k==='outside')m.pads.outside=n;
  });
  var rc=scope.querySelector('.rv-count');if(rc)m.total=rvCountOf(rc.textContent)||m.total;
  return m;
}
function rvMergeInto(base,add){
  if(!add)return base;
  ['months','zones','ops','tails','crew'].forEach(function(fld){
    var have={};base[fld].forEach(function(x){have[x.key]=1});
    (add[fld]||[]).forEach(function(x){if(!have[x.key])base[fld].push(x)});
  });
  if(!base.total&&add.total)base.total=add.total;
  if(!base.crewN&&add.crewN)base.crewN=add.crewN;
  if(!base.pads.nowhere&&add.pads.nowhere)base.pads.nowhere=add.pads.nowhere;
  if(!base.pads.outside&&add.pads.outside)base.pads.outside=add.pads.outside;
  return base;
}
/* one rail is open on the desktop instrument; walk the picker to harvest the rest */
function rvHarvestAll(hero,m){
  if(m.months.length&&m.zones.length&&(m.crew.length||m.crewN))return m;
  var btns=rvQ('.picker [data-pick]',hero);
  if(!btns.length)return m;
  var orig=null;
  btns.forEach(function(b){if(b.getAttribute('aria-selected')==='true')orig=b;});
  var origKind=orig?orig.getAttribute('data-pick'):null;
  btns.forEach(function(b){try{b.click()}catch(e){}
    rvMergeInto(m,rvModelFromDOM(hero));});
  var back=null;
  btns.forEach(function(b){if(b.getAttribute('data-pick')===origKind)back=b;});
  try{(back||orig||btns[0]).click()}catch(e){}
  return m;
}
function rvCollectModel(hero){
  var m=rvEmptyModel(),d=null;
  try{d=(typeof heroData==='undefined')?null:heroData}catch(e){d=null}
  if(d)rvMergeInto(m,rvModelFromData(d));
  rvMergeInto(m,rvModelFromDOM(hero));
  RV_.harvesting=true;
  try{rvHarvestAll(hero,m)}finally{RV_.harvesting=false}
  rvMergeInto(m,rvModelFromDOM(hero));
  m.months.sort(function(a,b){return a.key<b.key?-1:a.key>b.key?1:0});
  m.ops.sort(function(a,b){return b.n-a.n});
  m.tails.sort(function(a,b){return b.n-a.n});
  m.crew.sort(function(a,b){return b.n-a.n});
  return m;
}

/* ---------- rv: the phone renderer ---------- */
function rvSection(id,q,pn,bodyHtml,clause){
  var sec=document.createElement('section');sec.className='ph';
  sec.setAttribute('data-rv-ph',id);
  var head=document.createElement('button');head.type='button';head.className='phhead';
  head.innerHTML='<span class="phq">'+q+'</span>'+
    (clause?'<span class="phclause">'+rvEsc(clause)+'</span>'
           :'<span class="phpn">'+pn+'</span>')+
    '<span class="phchev">&#8964;</span>';
  head.addEventListener('click',function(){sec.classList.toggle('shut')});
  var bd=document.createElement('div');bd.className='phbody';bd.innerHTML=bodyHtml;
  sec.appendChild(head);sec.appendChild(bd);
  return sec;
}
function rvLadder(rows,field){
  var mx=1;rows.forEach(function(r){if(r.n>mx)mx=r.n});
  return '<div class="phladder">'+rows.map(function(r){
    return '<button type="button" class="phrow" data-rv-take="'+field+'|'+rvEsc(r.key)+
      '" aria-label="'+rvEsc(r.label)+', '+rvNum(r.n)+' reports">'+
      '<span class="pn2">'+rvEsc(r.label)+'</span>'+
      '<span class="pb"><i style="width:'+(r.n/mx*100).toFixed(1)+'%"></i></span>'+
      '<b>'+rvNum(r.n)+'</b></button>';
  }).join('')+'</div>';
}
function rvCurLabel(field,model){
  var e=rvEl(field);var v=e?String(e.value||'').trim():'';
  if(!v)return '';
  var list=field==='operator'?model.ops:field==='zone'?model.zones:
           field==='crew'?model.crew:model.tails;
  for(var i=0;i<list.length;i++)if(String(list[i].key)===v)return list[i].label;
  return v;
}
function rvPeriodText(){
  var f=rvEl('from'),t=rvEl('to');
  if(!f||!t){var ds=rvQ('input[type="date"]');f=ds[0];t=ds[1];}
  var a=f&&f.value,b=t&&t.value;
  if(!a&&!b){
    var cl=null;
    rvQ('.rv-clause').some(function(c){
      var tx=c.textContent||'';
      if(/(January|February|March|April|May|June|July|August|September|October|November|December|\d{4})/.test(tx)){cl=tx;return true}
      return false;});
    return cl?cl.trim():'';
  }
  var MF=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var MS=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var fmt=function(iso){var p=iso.split('-');return (+p[2])+' '+MS[+p[1]]+' '+p[0]};
  if(a&&b){
    if(a.slice(0,7)===b.slice(0,7)&&a.slice(8)==='01'){
      var last=new Date(+a.slice(0,4),+a.slice(5,7),0).getDate();
      if(+b.slice(8)===last)return MF[+a.slice(5,7)]+' '+a.slice(0,4);
      return '1 to '+(+b.slice(8))+' '+MF[+a.slice(5,7)]+' '+a.slice(0,4);
    }
    if(a.slice(0,7)===b.slice(0,7))return fmt(a)+' to '+fmt(b);
    return fmt(a)+' to '+fmt(b);
  }
  return a?('from '+fmt(a)):('up to '+fmt(b));
}
function rvBounds(){
  var f=rvEl('from'),t=rvEl('to');
  if(!f||!t){var ds=rvQ('input[type="date"]');f=ds[0];t=ds[1];}
  return (f&&t)?{f:f,t:t}:null;
}
function rvPreset(k){
  var b=rvBounds();if(!b)return;
  var to=b.t.max||b.t.value||'';if(!to)return;
  if(!k){b.f.value='';b.t.value='';}
  else if(k==='Y'){var v=to.slice(0,4)+'-01-01';
    if(b.f.min&&v<b.f.min)v=b.f.min;b.f.value=v;b.t.value=to;}
  else{var days=k==='90'?90:365;
    var d=new Date(to+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-days);
    var v2=d.toISOString().slice(0,10);
    if(b.f.min&&v2<b.f.min)v2=b.f.min;b.f.value=v2;b.t.value=to;}
  [b.f,b.t].forEach(function(x){if(x)x.dispatchEvent(new Event('change',{bubbles:true}))});
  rvSearch();
}
function rvTakePeriod(a,b){
  var lo=a<b?a:b,hi=a<b?b:a;
  var bd=rvBounds();if(!bd)return;
  var last=new Date(+hi.split('-')[0],+hi.split('-')[1],0).getDate();
  var hiFull=hi+'-'+String(last).padStart(2,'0');
  var loFull=lo+'-01';
  if(bd.f.min&&loFull<bd.f.min)loFull=bd.f.min;
  if(bd.t.max&&hiFull>bd.t.max)hiFull=bd.t.max;
  bd.f.value=loFull;bd.t.value=hiFull;
  [bd.f,bd.t].forEach(function(x){if(x)x.dispatchEvent(new Event('change',{bubbles:true}))});
  rvSearch();
  rvPhShow('Taken: '+rvMonName(lo)+(lo===hi?'':' to '+rvMonName(hi)),'');
  clearTimeout(RV_.flashT);RV_.flashT=setTimeout(rvPhClear,2500);
}
function rvPhShow(text,go){
  var p=rvEl('rvPhPill');
  if(!p){p=document.createElement('button');p.type='button';p.id='rvPhPill';
    p.setAttribute('aria-live','polite');document.body.appendChild(p);
    p.addEventListener('click',function(e){e.stopPropagation();rvPhCommit();});}
  p.innerHTML=rvEsc(text)+'<span class="go">'+(go||'take it &rarr;')+'</span>';
  p.hidden=false;
}
function rvPhClear(){
  RV_.phTap=null;RV_.phFrom=null;
  rvQ('[data-rv-take].lit,[data-rv-month].lit').forEach(function(x){x.classList.remove('lit')});
  var p=rvEl('rvPhPill');if(p)p.hidden=true;
}
function rvPhCommit(){
  var spec=RV_.phTap;rvPhClear();
  if(!spec)return;
  var i=spec.indexOf('|'),field=spec.slice(0,i),val=spec.slice(i+1);
  if(rvTakeFilter(field,val))return;
  if(rvSetFilter(field,val))return;
  var c=rvEl(field);
  if(c){c.value=val;c.dispatchEvent(new Event('change',{bubbles:true}));rvSearch();return;}
  var desk=document.querySelector('#hero > .rv-desk');
  if(desk){var mk=desk.querySelector('[data-take="'+spec+'"]');if(mk)try{mk.click()}catch(e){}}
}
function rvBuildPhoneDOM(ph,desk,model){
  ph.innerHTML='';
  var count=model.total||0;
  var clauses=rvQ('.rv-clause',desk);
  var chips='';
  clauses.forEach(function(c){
    var txt=(c.textContent||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
    if(txt)chips+='<button type="button" class="chip rv-chip">'+rvEsc(txt)+
      '&nbsp;<b aria-hidden="true">&times;</b></button>';
  });
  var bar=document.createElement('div');bar.className='phbar';
  bar.innerHTML='<div class="phcount"><b>'+rvNum(count)+'</b> '+(count===1?'report':'reports')+'</div>'+
    '<div class="phchips">'+(chips||'<span class="rv-none">nothing filtered yet</span>')+'</div>'+
    '<div class="phacts">'+
    '<button type="button" class="ghost rv-af">All filters'+
    (clauses.length?' <i class="badge">'+clauses.length+'</i>':'')+'</button>'+
    '<button type="button" class="ghost rv-top">&uarr; back</button></div>';
  rvQ('.rv-chip',bar).forEach(function(ch,i){
    ch.addEventListener('click',function(ev){ev.stopPropagation();
      var c=clauses[i];if(c)try{c.click()}catch(e){}});});
  bar.querySelector('.rv-af').addEventListener('click',function(){
    try{var d=rvEl('morefilters');if(d)d.open=true}catch(e){}
    var t=rvEl('p-search')||document.querySelector('.filters,.morefilters');
    if(t&&t.scrollIntoView)try{t.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  });
  bar.querySelector('.rv-top').addEventListener('click',function(){
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}});
  ph.appendChild(bar);

  /* WHEN */
  var wb='',bd2=rvBounds();
  if(bd2){
    wb+='<div class="phpresets">'+
      [['all reports',''],['this year','Y'],['last 12 months','12'],['last 90 days','90']]
      .map(function(p){return '<button type="button" class="chipbtn" data-rv-preset="'+p[1]+'">'+p[0]+'</button>'})
      .join('')+'</div>';
  }
  if(model.months.length){
    var mx=1;model.months.forEach(function(x){if(x.n>mx)mx=x.n});
    wb+='<div class="phstrip" role="group" aria-label="Months, swipe sideways">';
    model.months.forEach(function(x){
      var h=Math.max(2,Math.round(x.n/mx*30));
      wb+='<button type="button" class="phmo'+(x.part?' part':'')+
        '" data-rv-month="'+rvEsc(x.key)+'" aria-label="'+rvEsc(x.label)+', '+
        rvNum(x.n)+' reports'+(x.part?', a part month':'')+'">'+
        '<i style="height:'+h+'px"></i><span>'+rvEsc(x.key.slice(5))+'</span></button>';
    });
    wb+='</div><div class="phhint">Tap the first month, then the last, to take a range.</div>';
  }else wb+='<p class="phhint">No month strip available.</p>';
  ph.appendChild(rvSection('when','WHEN','month by month',wb,rvPeriodText()));

  /* WHERE */
  var zby={},zmx=1;
  model.zones.forEach(function(z){
    var num=(/(\d00)/.exec(z.key)||[])[1]||z.key;
    zby[num]=z;if(z.n>zmx)zmx=z.n;});
  var ZN={100:'Lower fuselage',200:'Upper fuselage',300:'Empennage',
    400:'Engine nacelles and pylons',500:'Left wing',600:'Right wing',
    700:'Landing gear',800:'Doors',900:'Lavatories and galleys'};
  var zb='<div class="phmap">';
  [['800','200','100'],['500','400','600'],['300','700','900']].forEach(function(row){
    row.forEach(function(num){
      var z=zby[num],lab=z?z.label:(ZN[num]||('Zone '+num)),n=z?z.n:0;
      var key=z?z.key:('ZONE '+num);
      var f=(0.10+0.80*(n/zmx)).toFixed(3);
      zb+='<button type="button" class="phcell" data-rv-take="zone|'+rvEsc(key)+
        '" style="--f:'+f+'" aria-label="'+rvEsc(lab)+', '+rvNum(n)+' reports">'+
        '<span>'+rvEsc(lab)+'</span><b>'+rvNum(n)+'</b></button>';
    });});
  zb+='</div><div class="phmap pads">'+
    '<div class="phcell pad"><span>no location given</span><b>'+rvNum(model.pads.nowhere||0)+'</b></div>'+
    '<div class="phcell pad"><span>place named in words, not as a zone</span><b>'+rvNum(model.pads.outside||0)+'</b></div></div>';
  ph.appendChild(rvSection('where','WHERE','on the aircraft',zb,rvCurLabel('zone',model)));

  /* WHO */
  var whb='';
  if(model.ops.length)whb+='<div class="phsub">Airlines</div>'+rvLadder(model.ops,'operator');
  if(model.tails.length)whb+='<div class="phsub">Aircraft</div>'+rvLadder(model.tails,'tail');
  if(!whb)whb='<p class="phhint">No airlines or aircraft to list.</p>';
  var whoClause=rvCurLabel('operator',model);
  if(!whoClause){var ti=rvEl('tail');if(ti&&ti.value)whoClause='N'+ti.value;}
  ph.appendChild(rvSection('whose','WHO','airline and tail',whb,whoClause));

  /* FORCED */
  var fb2='',tot=model.total||0;
  if(model.crewN&&tot){
    fb2+='<div class="phblock"><i style="width:'+(model.crewN/tot*100).toFixed(1)+
      '%"></i><span>'+rvNum(model.crewN)+' of '+rvNum(tot)+' forced a crew action</span></div>';}
  if(model.crew.length)fb2+=rvLadder(model.crew,'crew');
  var fSec=rvSection('forced','WHAT IT FORCED','what the crew did',
    fb2||'<p class="phhint">No crew actions recorded here.</p>',rvCurLabel('crew',model));
  if(!model.crewN&&!model.crew.length)fSec.classList.add('shut');
  ph.appendChild(fSec);

  /* evidence, margin, seam: carried over from the desktop render */
  if(desk){
    var sp=desk.querySelector('.specimen');if(sp)ph.appendChild(sp.cloneNode(true));
    var mg=desk.querySelector('.margin');if(mg)ph.appendChild(mg.cloneNode(true));
    var sm=desk.querySelector('.seam');if(sm)ph.appendChild(sm.cloneNode(true));
  }
}

/* ---------- rv: phone / desktop switch ---------- */
function rvIsPhone(){
  try{return window.matchMedia('(max-width:760px)').matches}
  catch(e){return window.innerWidth<=760}
}
function rvApply(){
  var hero=rvEl('hero');if(!hero||RV_.harvesting||RV_.phDisabled)return;
  var desk=hero.querySelector(':scope > .rv-desk');
  var mine=hero.querySelector(':scope > .rv-ph');
  if(!rvIsPhone()){
    if(RV_.mode==='phone'||desk||mine){
      var p=rvEl('rvPhPill');if(p)p.hidden=true;
      if(desk){
        var frag=document.createDocumentFragment();
        while(desk.firstChild)frag.appendChild(desk.firstChild);
        hero.innerHTML='';hero.appendChild(frag);
      }
      hero.classList.remove('phone');
      RV_.mode='desktop';RV_.phTap=null;RV_.phFrom=null;RV_.deskLen=-1;
    }
    return;
  }
  if(mine&&desk&&RV_.mode==='phone')return;   /* ours, unchanged */
  RV_.mode='phone';
  try{
    var model=rvCollectModel(hero);
    desk=document.createElement('div');desk.className='rv-desk';
    while(hero.firstChild)desk.appendChild(hero.firstChild);
    var ph=document.createElement('div');ph.className='rv-ph';
    hero.appendChild(desk);hero.appendChild(ph);
    rvBuildPhoneDOM(ph,desk,model);
    hero.classList.add('phone');
    RV_.deskLen=desk.innerHTML.length;RV_.phFails=0;
  }catch(e){
    /* leave the desktop instrument standing rather than half a phone */
    var d2=hero.querySelector(':scope > .rv-desk'),p2=hero.querySelector(':scope > .rv-ph');
    if(p2)p2.remove();
    if(d2){while(d2.firstChild)hero.appendChild(d2.firstChild);d2.remove();}
    hero.classList.remove('phone');
    RV_.mode=null;RV_.deskLen=-1;
    if(++RV_.phFails>2)RV_.phDisabled=true;
  }
}

/* ---------- rv: gesture handling for the phone marks ---------- */
document.addEventListener('click',function(e){
  if(RV_.mode!=='phone')return;
  var t=e.target.closest?e.target.closest('[data-rv-take]'):null;
  if(t){
    e.preventDefault();e.stopPropagation();
    var spec=t.getAttribute('data-rv-take');
    if(RV_.phTap===spec){rvPhCommit();return;}
    rvQ('[data-rv-take].lit').forEach(function(x){x.classList.remove('lit')});
    RV_.phTap=spec;t.classList.add('lit');
    var lab=t.getAttribute('aria-label')||'this mark';
    rvPhShow(lab.replace(/,?\s*[\d,]+\s+reports?/i,''),'take it \u2192');
    return;
  }
  var mo=e.target.closest?e.target.closest('[data-rv-month]'):null;
  if(mo){
    e.preventDefault();e.stopPropagation();
    var k=mo.getAttribute('data-rv-month');
    if(!RV_.phFrom){
      RV_.phFrom=k;mo.classList.add('lit');
      rvPhShow((mo.getAttribute('aria-label')||rvMonName(k)).replace(/,?\s*[\d,]+\s+reports?/i,''),
        'now tap the last month');
    }else{
      var a=RV_.phFrom;RV_.phFrom=null;
      rvQ('[data-rv-month].lit').forEach(function(x){x.classList.remove('lit')});
      rvTakePeriod(a,k);
    }
    return;
  }
  var pr=e.target.closest?e.target.closest('[data-rv-preset]'):null;
  if(pr){e.preventDefault();rvPreset(pr.getAttribute('data-rv-preset'));return;}
  if((RV_.phTap||RV_.phFrom)&&!e.target.closest('#rvPhPill'))rvPhClear();
},true);
window.addEventListener('scroll',function(){
  if(RV_.phTap||RV_.phFrom)rvPhClear();
},{passive:true});

/* ---------- rv: case sheet stepper ---------- */
function rvFindStepperLabel(box){
  var cands=rvQ('span,div,p,b',box).filter(function(e){
    if(e.querySelector('button'))return false;
    var t=(e.textContent||'').trim();
    return /of\s+[\d,]+\s+that\s+match/i.test(t)
        || /of\s+[\d,]+\s+loaded/i.test(t)
        || /^[\d,]+\s+of\s+[\d,]+$/i.test(t);
  });
  for(var i=0;i<cands.length;i++){
    var p=cands[i].parentElement;
    if(p&&(p.textContent.indexOf('\u2039')>=0||p.textContent.indexOf('\u203a')>=0))return cands[i];
  }
  return cands[0]||null;
}
function rvCaseOrder(){
  var res=rvEl('results'),ids=[],seen={};
  var push=function(id){id=String(id||'').trim();if(id&&!seen[id]){seen[id]=1;ids.push(id);}};
  if(res){
    rvQ('[data-case]',res).forEach(function(e){push(e.getAttribute('data-case'))});
    rvQ('[onclick]',res).forEach(function(e){
      var oc=e.getAttribute('onclick')||'';
      if(/case/i.test(oc)){var m=/['"]([A-Za-z0-9\-_]{6,})['"]/.exec(oc);if(m)push(m[1]);}
    });
  }
  return ids;
}
function rvStepperButtons(lab){
  var holder=lab.parentElement,btns=holder?rvQ('button',holder):[];
  if(btns.length<2&&holder&&holder.parentElement){holder=holder.parentElement;btns=rvQ('button',holder);}
  var prev=null,next=null;
  btns.forEach(function(b){var t=b.textContent||'';
    if(t.indexOf('\u2039')>=0)prev=prev||b;
    if(t.indexOf('\u203a')>=0)next=next||b;});
  if(!prev&&!next&&btns.length===2){prev=btns[0];next=btns[1];}
  return {prev:prev,next:next};
}
function rvFixStepper(){
  var box=rvEl('case-box');if(!box)return;
  if(!(box.offsetHeight>0)){RV_.caseSession=null;return;}
  var lab=rvFindStepperLabel(box);if(!lab)return;
  var txt0=(lab.textContent||'').trim();
  var sess=RV_.caseSession;
  if(!sess)sess=RV_.caseSession={pool:0,match:0,base:null};
  var order=rvCaseOrder(),loaded;
  if(order.length)loaded=order.length;
  else{
    if(!sess.pool){var mp=/of\s+([\d,]+)\s+loaded/i.exec(txt0);
      if(mp)sess.pool=Number(mp[1].replace(/,/g,''));}
    loaded=sess.pool||0;
  }
  var mm=/of\s+([\d,]+)\s+that\s+match/i.exec(txt0);
  if(mm)sess.match=Number(mm[1].replace(/,/g,''));
  else{try{if(typeof LAST_TOTAL!=='undefined'&&LAST_TOTAL&&LAST_TOTAL>loaded&&!sess.match)sess.match=LAST_TOTAL}catch(e){}}
  var cur='';try{cur=new URLSearchParams(location.search).get('case')||''}catch(e){}
  var idx=cur?order.indexOf(cur):-1;
  if(idx>=0){sess.base=idx;RV_.caseDir=0;}
  else{
    if(sess.base==null){var mi=/^\s*(\d+)\s+of/.exec(txt0);
      sess.base=mi?Number(mi[1])-1:0;}
    idx=sess.base+(RV_.caseDir||0);
    if(idx<0)idx=0;
    if(loaded&&idx>loaded-1)idx=loaded-1;
    sess.base=idx;RV_.caseDir=0;
  }
  var txt=rvNum(idx+1)+' of '+rvNum(loaded||1)+' loaded'+
    (sess.match&&sess.match>loaded?', of '+rvNum(sess.match)+' that match':'');
  if(lab.textContent!==txt)lab.textContent=txt;
  var b=rvStepperButtons(lab);
  if(b.prev)b.prev.disabled=idx<=0;
  if(b.next)b.next.disabled=loaded?idx>=loaded-1:false;
}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('#case-box button');if(!b)return;
  var t=b.textContent||'';
  if(t.indexOf('\u2039')>=0)RV_.caseDir=-1;
  else if(t.indexOf('\u203a')>=0)RV_.caseDir=1;
},true);

/* ---------- rv: tab ids, panel h1s, select aria-labels ---------- */
function rvFixTabs(){
  rvQ('[id^="vtab-"]').forEach(function(t){t.id='tab-'+t.id.slice(5);});
  rvQ('[aria-labelledby]').forEach(function(e){
    var v=e.getAttribute('aria-labelledby')||'';
    if(v.indexOf('vtab-')>=0)e.setAttribute('aria-labelledby',v.replace(/vtab-/g,'tab-'));
  });
  rvQ('[aria-controls^="vtab-"]').forEach(function(e){
    e.setAttribute('aria-controls',e.getAttribute('aria-controls').replace('vtab-','tab-'));
  });
}
var RV_H1={
  'p-fleet':'One airline, one type','p-emerging':'Defects that are new',
  'p-clusters':'Same airline, same system, same day','p-structure':'Corrosion and cracks',
  'p-age':'Do old airframes break differently?','p-engines':'Engines',
  'p-consequences':'What the crew actually had to do','p-found':'How was it found?'
};
function rvFixH1(){
  Object.keys(RV_H1).forEach(function(pid){
    var p=rvEl(pid);if(!p||p.querySelector('h1'))return;
    var h2=null;
    [].some.call(p.children,function(c){if(c.tagName==='H2'){h2=c;return true}return false});
    if(h2){
      var h1=document.createElement('h1');h1.className=h2.className||'';
      h1.innerHTML=h2.innerHTML;h2.parentNode.replaceChild(h1,h2);
    }else{
      var hb=document.createElement('hb');/*never*/
      var h=document.createElement('h1');h.textContent=RV_H1[pid];
      var anchor=p.querySelector('.psub,.lead');
      if(anchor)anchor.parentNode.insertBefore(h,anchor);
      else{var sc=p.querySelector('.scope');
        if(sc)sc.parentNode.insertBefore(h,sc.nextSibling);
        else p.insertBefore(h,p.firstChild);}
    }
  });
}
var RV_ARIA={operator:'Operator',make:'Manufacturer',ata:'Aircraft system',
  nature:'What was found',crew:'What the crew did',condition:'Part condition',
  discovered:'How it was found',stage:'Stage of flight',zone:'Zone on the aircraft',
  corrosion:'Corrosion level',cracked:'Cracking recorded',minhours:'Airframe age',
  aimKind:'What kind of thing to look for'};
function rvFixAria(){
  Object.keys(RV_ARIA).forEach(function(id){
    var e=rvEl(id);if(e&&!e.getAttribute('aria-label'))e.setAttribute('aria-label',RV_ARIA[id]);});
  var d=rvEl('aimDay');
  if(!d)rvQ('input[type="date"]').some(function(x){
    if(x.closest('.aimat,.aimday')){d=x;return true}return false;});
  if(d&&!d.getAttribute('aria-label'))d.setAttribute('aria-label','One date');
  rvQ('select').forEach(function(s){
    if(s.getAttribute('aria-label'))return;
    if(s.closest('.picker')||s.closest('#hero'))return;
    var t=(s.options&&s.options[0]?s.options[0].textContent:'').trim();
    t=t.replace(/^Any(thing)?\s+/i,'').replace(/^Pick an?\s+/i,'').trim();
    if(t)s.setAttribute('aria-label',t.charAt(0).toUpperCase()+t.slice(1));
  });
}

/* ---------- rv: runner ---------- */
function rvRun(){
  rvFixTabs();rvFixAria();rvFixH1();rvApply();rvFixStepper();
}
function rvSchedule(){
  if(RV_.t)clearTimeout(RV_.t);
  RV_.t=setTimeout(rvRun,60);
}
function rvInit(){
  if(RV_.inited)return;RV_.inited=true;
  rvCss();
  try{new MutationObserver(rvSchedule).observe(document.body,
    {childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});}catch(e){}
  window.addEventListener('resize',rvSchedule);
  try{var mq=window.matchMedia('(max-width:760px)');
    if(mq){if(mq.addEventListener)mq.addEventListener('change',rvSchedule);
      else if(mq.addListener)mq.addListener(rvSchedule);}}catch(e){}
  rvRun();
}
if(document.body)rvInit();
else document.addEventListener('DOMContentLoaded',rvInit);



/* ---- 20: the overlay, the rails, the labels, written by the model ---- */

(function(){
if (window.__sdrReviewFix) return; window.__sdrReviewFix = true;

var sdrPhoneMQ = window.matchMedia("(max-width:760px)");
var sdrMark    = ".case-actions,.bigq,table.kv,[data-copy],.publish,.route,#case-title";
var sdrWrap    = null, sdrBox = null, sdrLastFocus = null,
    sdrPushed  = false, sdrSig = null;

var sdrCss = [
"#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}",
"#case-wrap[data-sdr-open='1']{display:flex}",
"#case-wrap #case-box{box-sizing:border-box;background:#fff;width:100%;max-width:min(880px,66vw);margin:0;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-wrap #case-box{max-width:100%}}",
"#case-wrap #case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid #e2ded5}",
"#case-wrap #case-box .case-actions button:last-child{margin-left:auto}"
].join("\n");

/* 1. below 760px the phone renderer owns the instrument: take the desktop rails
      back out of the DOM, whatever redraw leaked them back in */
function sdrStripRails(){
  if (!sdrPhoneMQ.matches) return;
  document.querySelectorAll("#hero .rail, .instrument .rail").forEach(function(n){
    n.parentNode && n.parentNode.removeChild(n);
  });
}

/* 3. the nine selects the rebuild shipped unlabelled; set only what is missing */
var sdrLabels = {operator:"Operator", make:"Manufacturer", ata:"Aircraft system",
  nature:"What was found", crew:"What the crew did", condition:"Part condition",
  discovered:"How it was found", stage:"Stage of flight", zone:"Zone on the aircraft"};
function sdrFixLabels(){
  for (var id in sdrLabels){
    var e = document.getElementById(id);
    if (e && !e.getAttribute("aria-label")) e.setAttribute("aria-label", sdrLabels[id]);
  }
}

/* 2. the case sheet is a dialog: a fixed overlay owns the scroll, the card sits
      inside it, and the action bar sticks to the top of that overlay */
function sdrEnsureWrap(){
  sdrWrap = document.getElementById("case-wrap");
  if (!sdrWrap){ sdrWrap = document.createElement("div"); sdrWrap.id = "case-wrap"; document.body.appendChild(sdrWrap); }
  sdrBox = document.getElementById("case-box");
  if (!sdrBox){ sdrBox = document.createElement("div"); sdrBox.id = "case-box"; sdrWrap.appendChild(sdrBox); }
  else if (sdrBox.parentElement !== sdrWrap) sdrWrap.appendChild(sdrBox);
  sdrAdoptLoose();
}
/* if the rebuild rendered a sheet with no #case-box at all, lift the whole card
   into the overlay instead of leaving it growing the page */
function sdrAdoptLoose(){
  if (sdrBox.firstElementChild) return;
  var bar = document.querySelector(".case-actions");
  if (!bar || sdrWrap.contains(bar)) return;
  var anc = bar.parentElement, guard = 0;
  while (anc && anc !== document.body && guard++ < 10 &&
         !(anc.querySelector(".bigq") && anc.querySelector("table.kv")))
    anc = anc.parentElement;
  if (!anc || anc === document.body || anc === sdrWrap) return;
  var res = document.getElementById("results");
  if (res && anc.contains(res)) return;
  var frag = document.createDocumentFragment();
  while (anc.firstChild) frag.appendChild(anc.firstChild);
  sdrBox.appendChild(frag);
  anc.parentNode.removeChild(anc);
}
function sdrIsOpen(){ return !!(sdrWrap && sdrWrap.getAttribute("data-sdr-open") === "1"); }
function sdrSetOpen(on){
  if (!sdrWrap) return;
  sdrWrap.setAttribute("data-sdr-open", on ? "1" : "0");
  sdrWrap.style.display = on ? "flex" : "none";
  if (on) sdrWrap.scrollTop = 0;
}
function sdrInert(on){
  Array.prototype.forEach.call(document.body.children, function(n){
    if (n === sdrWrap || /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(n.tagName)) return;
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
function sdrOpenSheet(){
  sdrLastFocus = document.activeElement;
  sdrBox.setAttribute("role", "dialog");
  sdrBox.setAttribute("aria-modal", "true");
  sdrBox.setAttribute("tabindex", "-1");
  if (sdrBox.querySelector("#case-title")) sdrBox.setAttribute("aria-labelledby", "case-title");
  else { sdrBox.removeAttribute("aria-labelledby"); sdrBox.setAttribute("aria-label", "Case sheet"); }
  sdrSetOpen(true);
  sdrInert(true);
  setTimeout(function(){ try { sdrBox.focus(); } catch(e){} }, 30);
  /* Back closes the sheet, as in the reference; push only if the rebuild has not */
  var u = new URLSearchParams(location.search);
  if (!u.get("case")){
    var m = ((sdrBox.querySelector(".eyebrow-k") || {}).textContent || "").match(/Report\s+(\S+)/);
    if (m){ u.set("case", m[1]);
      try { history.pushState({sdrCase:m[1]}, "", "?" + u.toString()); sdrPushed = true; } catch(e){} }
  }
}
function sdrCloseSheet(fromPop){
  if (!sdrIsOpen()) return;
  sdrSetOpen(false);
  sdrInert(false);
  var lf = sdrLastFocus; sdrLastFocus = null;
  if (lf && lf.focus && document.contains(lf)) try { lf.focus(); } catch(e){}
  if (!fromPop && sdrPushed){ sdrPushed = false; history.back(); }
}
function sdrEnsureClose(){
  var bar = sdrBox.querySelector(".case-actions"); if (!bar) return;
  var has = Array.prototype.some.call(bar.querySelectorAll("button"),
    function(b){ return /close/i.test(b.textContent || ""); });
  if (!has){
    var b = document.createElement("button");
    b.type = "button"; b.className = "ghost"; b.textContent = "Close";
    b.addEventListener("click", function(){ sdrCloseSheet(false); });
    bar.appendChild(b);
  }
}
/* the sheet opens when its content lands in #case-box and closes when that box
   is emptied again, so the rebuild's own render/close calls keep working */
function sdrPoll(){
  sdrEnsureWrap();
  var marked = sdrBox.querySelector(sdrMark);
  var s = ((sdrBox.querySelector(".eyebrow-k") || {}).textContent || "") + "|" + (marked ? 1 : 0);
  if (marked){
    if (!sdrIsOpen()){ sdrSig = s; sdrOpenSheet(); }
    else if (s !== sdrSig){ sdrSig = s; sdrSetOpen(true); try { sdrBox.focus(); } catch(e){} }
    sdrEnsureClose();
  } else if (sdrIsOpen() && !(sdrBox.firstElementChild || (sdrBox.textContent || "").trim())){
    sdrSig = null; sdrCloseSheet(true);
  }
}

/* the four ways out: Escape, the Close button, the scrim, and Back */
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && sdrIsOpen()) sdrCloseSheet(false);
});
document.addEventListener("click", function(e){
  if (!sdrIsOpen()) return;
  if (e.target === sdrWrap){ sdrCloseSheet(false); return; }
  var b = e.target && e.target.closest ? e.target.closest("#case-box button") : null;
  if (b && /^close$/i.test((b.textContent || "").trim())){ e.preventDefault(); sdrCloseSheet(false); }
});
window.addEventListener("popstate", function(){ if (sdrIsOpen()) sdrCloseSheet(true); });
/* focus stays inside the dialog while it is up */
document.addEventListener("keydown", function(e){
  if (e.key !== "Tab" || !sdrIsOpen()) return;
  var f = Array.prototype.filter.call(
    sdrBox.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),
    function(x){ return x.offsetParent !== null; });
  if (!f.length){ e.preventDefault(); sdrBox.focus(); return; }
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last ||
                           !sdrBox.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
});

function sdrInit(){
  var st = document.createElement("style");
  st.textContent = sdrCss;
  document.head.appendChild(st);
  sdrEnsureWrap(); sdrStripRails(); sdrFixLabels(); sdrPoll();
  if (sdrPhoneMQ.addEventListener)
    sdrPhoneMQ.addEventListener("change", function(ev){ if (ev.matches) sdrStripRails(); });
  new MutationObserver(function(){ sdrStripRails(); sdrFixLabels(); sdrPoll(); })
    .observe(document.body, {childList:true, subtree:true});
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sdrInit);
else sdrInit();
window.addEventListener("load", function(){ sdrStripRails(); sdrFixLabels(); sdrPoll(); });
})();



/* ---- 10: how to read each panel, written by the model ---- */

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



(function(){var s=document.createElement('style');s.id='sdr-css-18';s.textContent=`/* ==========================================================================
   SDR Desk — appearance block, whole replacement.
   Fault numbers in the comments map to the reviewer's list.
   ========================================================================== */
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap');

/* ---- Fault "palette": the original tokens, verbatim. Nothing else defines
   ink/paper/ash/rust/line anywhere in this block. ---- */
:root{
  --ink:#1d1d1f;
  --paper:#f7f5f0;
  --ash:#756f69;
  --smoke:#6b6560;
  --rust:#c44b28;
  --rust-text:#b8431f;
  --line:#e2ded5;
  --card:#fff;
}
*{box-sizing:border-box}

/* body hard-coded to #f2eee6 before; the token now wins */
body{
  margin:0;background:var(--paper);color:var(--ink);
  font:15px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}

.wrap{max-width:1180px;margin:0 auto;padding:16px 20px 70px}          /* 23 */
.skip{position:absolute;left:-9999px;top:0;background:var(--ink);color:#fff;padding:9px 14px;z-index:200;border-radius:0 0 4px 0}
.skip:focus{left:0}

/* ---- tabs (16: matches either id spelling, tab- or vtab-) ---- */
.tabs{display:block;border-bottom:1px solid var(--line);margin:10px 0 12px;padding-bottom:6px}
.vgroup{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
.vlab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
.vrow{display:flex;gap:2px;flex-wrap:wrap;flex:1;min-width:0}
.tab{padding:8px 13px;font-size:13px;cursor:pointer;border:1px solid transparent;color:var(--smoke);background:none;border-radius:3px}
.vrow .tab{padding:4px 10px;font-size:12.5px}
.tab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
@media(max-width:900px){.vgroup{flex-direction:column;gap:2px}.vlab{flex:none;text-align:left}}

.scope{font-size:12.5px;margin:8px 0 2px;padding:6px 10px;border-radius:4px;line-height:1.5}
.scope.follows{background:#f2f5f1;color:#3f4a3c;border:1px solid #dfe6dc}
.scope.whole{background:#f6f4ef;color:var(--smoke);border:1px solid var(--line)}
.scope.whole.warn{background:#fdf3ee;color:#7c3a1f;border:1px solid #eec9b8}
.scope:empty{display:none}

/* ---- Fault 10/12/19: every control back on the original footing ---- */
input,select,button{font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink)}
select{width:100%;max-width:179px}                                    /* 10: uniform again */
.filters select{max-width:none}
button{cursor:pointer;background:var(--ink);color:#fff;border-color:var(--ink);text-align:center}
button.ghost{background:#fff;color:var(--ink)}
button:disabled{opacity:.5;cursor:default}

.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;
  background:var(--card);border:1px solid var(--line);padding:12px;border-radius:3px}
.filters>*{min-width:0}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--smoke)}
.filters .fld input{width:100%}
/* Fault 11: the twenty synthesised uppercase labels go; From/To keep theirs.
   (If the rebuild marks those two differently, scope the :not to them.) */
.filters label.fld:not(.fld-date)>span:first-child{display:none}
.morefilters{margin:8px 0 0;border:1px solid var(--line);border-radius:4px;background:var(--card)}
.morefilters>summary{cursor:pointer;padding:9px 12px;font-size:13px;color:var(--smoke);list-style:none;user-select:none}
.morefilters>summary::-webkit-details-marker{display:none}
.morefilters>summary::before{content:"\\25B8";display:inline-block;margin-right:8px;transition:transform .15s;color:var(--ash)}
.morefilters[open]>summary::before{transform:rotate(90deg)}
.morefilters.active>summary{color:var(--rust);font-weight:600}
.filters.sub{border:0;border-top:1px solid var(--line);border-radius:0;background:transparent}
/* the two colours that exist nowhere in the original */
#mfCount{color:var(--smoke)}
#copied{color:var(--smoke)}

/* Fault 20: starters back above the form, by order in a flex column */
#p-search{display:flex;flex-direction:column}
#p-search>.scope{order:-3}
#p-search>.hint{order:-2}
#starters{order:-1}
.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.starter button{background:#fff;color:var(--ink);font-size:13px}
.starter button.extra{display:none}
.starter.all button.extra{display:inline-block}
.starter button.showmore{background:none;border:1px dashed var(--line);color:var(--smoke)}
.starter.flash{animation:flashin 1.4s ease-out}
@keyframes flashin{0%{background:#f6e3d8}60%{background:#f6e3d8}100%{background:transparent}}

.chips{margin:8px 0}
.chip{display:inline-block;background:#efece5;border-radius:10px;padding:2px 9px;font-size:12px;
  color:var(--smoke);margin:0 4px 4px 0;cursor:pointer;font-family:inherit}         /* 19 */
.chip:hover{background:#e6e1d8}
.chip b{cursor:pointer;margin-left:5px}
.chip.warn{background:#fdf3ee;border-color:#eec9b8;color:#7c3a1f}
.chip.warn em{font-style:normal;opacity:.75;margin-left:5px}
#chips,#count,.count{font-family:inherit}                              /* 19 */
.count{font-size:13px;color:var(--smoke)}

.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
input.tf{width:100%;max-width:340px;margin:6px 0 10px}

/* ---- headings ---- */
h2{font-size:22px;font-family:Archivo,system-ui,sans-serif;line-height:1.22;margin:0 0 10px}
h3{font-size:12px;margin:16px 0 6px;color:var(--ash);text-transform:uppercase;letter-spacing:.06em}
.panel h1,.psub~h2{font:700 22px/1.22 Archivo,system-ui,sans-serif;margin:0 0 10px}
.lede,.psub,.lead{font-size:14px;color:var(--smoke);margin:0 0 10px;max-width:820px}
.card{background:var(--card);border:1px solid var(--line);border-radius:3px;padding:14px;margin:10px 0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.muted{color:var(--ash);font-size:12px}
.note{font-size:11.5px;line-height:1.5;margin:0 0 8px}

/* ---- Fault 15: the instrument keeps its frame ---- */
.instrument{position:relative;background:var(--paper);border:1px solid var(--line);
  border-bottom:3px solid var(--rust);border-radius:6px;margin:12px 0 0;overflow:hidden}
.instrument .ipad{padding:14px 20px 8px}
.ihead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.stamp{font:600 10.5px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.18em;color:var(--ash);text-transform:uppercase}
.picker{display:flex;gap:2px;background:rgba(29,29,31,.05);border-radius:6px;padding:3px;flex:none}
.picker button{border:0;background:none;padding:4px 10px 3px;border-radius:4px;cursor:pointer;
  display:flex;flex-direction:column;align-items:flex-start;gap:1px;border-bottom:2px solid transparent}
.picker .q{font:600 10.5px/1.1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:#5c554c}
.picker .pn{font-size:9.5px;color:#5f584f}
.picker button.on{background:#fff;border-bottom-color:var(--rust)}
.picker button.on .q{color:var(--rust-text)}

/* the standing sentence, rebuilt classes mapped onto the original's rules */
.stand.rv-sentence,.sentence{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.1;
  color:var(--ink);max-width:26em;margin:7px 0 0}
.rv-count,.sentence .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;
  font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text)}
.rv-aside,.sentence .aside{font-size:.62em;color:var(--ash)}
.sentence .broken{display:block;font-size:.5em;color:var(--rust)}
.rv-clause,.sentence .clause{border:0;background:none;padding:0;font:inherit;color:inherit;
  border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer;text-align:left}
.rv-clause:hover,.rv-clause:focus-visible{color:var(--rust);border-bottom-color:var(--rust)}

.aim{min-height:20px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;
  color:var(--rust-text);margin-top:6px;line-height:20px}
.aim .undoit{background:none;border:1px solid rgba(196,75,40,.5);color:var(--rust-text);border-radius:4px;
  padding:1px 8px;margin-left:8px;cursor:pointer;font:inherit;font-size:12px}
.hand{font:600 13px/1.4 Archivo,system-ui,sans-serif;color:var(--ink);margin-top:2px}
.hand .c{font-weight:400;color:var(--smoke)}

.aimat{display:flex;align-items:center;gap:8px;margin-top:7px;position:relative;flex-wrap:wrap}
.aimat label{font:600 10.5px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);text-transform:uppercase}
.aimat input{flex:1;max-width:340px;padding:5px 9px;font-size:13px}
.aimat button{padding:5px 11px;font-size:12px}
.aimat select{max-width:150px;font-size:12.5px;padding:5px 6px}
.aimday{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--smoke)}
.aimday input{font-size:12px;padding:2px 4px}
.aimopts{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}
.aimopts button{display:inline-flex;gap:7px;align-items:baseline;padding:4px 10px;font-size:12.5px}
.aimopts em{font-style:normal;color:var(--ash);font-size:11.5px}
.aimsug{position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:40;background:#fff;border:1px solid var(--line);
  border-radius:6px;box-shadow:0 8px 24px rgba(20,16,12,.13);max-height:290px;overflow-y:auto;min-width:430px}
.aimsug[hidden]{display:none}
.sug{display:flex;align-items:baseline;gap:9px;padding:6px 11px;cursor:pointer;border-bottom:1px solid #f2efe9}
.sug:hover,.sug.on{background:#f6f2ec}
.sug .sk{flex:0 0 132px;font:600 9.5px/1.5 Archivo,system-ui,sans-serif;letter-spacing:.07em;color:#fff;
  background:#8d857b;border-radius:3px;padding:1px 6px;text-align:center}
.sug .sl{flex:1;min-width:0;font-size:13.5px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sug b{font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--ash)}
.sughead{font:600 9.5px/1.7 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#fff;padding:1px 11px;position:sticky;top:0;z-index:1}
.sughead.sk-operator{background:#8c4a2f}.sughead.sk-tail{background:#3f6b57}
.sughead.sk-period{background:#4a5d80}.sughead.sk-zone{background:#7a5a2e}
.sughead.sk-jasc{background:#5d4a72}.sughead.sk-q{background:#6f6a63}
@media(max-width:700px){.aimsug{min-width:0}.sug .sk{flex-basis:96px;font-size:8.5px}}

.zero{margin:8px 0 2px;padding:9px 12px;background:#fdf3ee;border:1px solid #eec9b8;border-radius:4px;
  font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}

/* ---- rails ---- */
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:186px 1fr;gap:12px;align-items:center;
  padding:5px 0;border-top:1px solid var(--line);cursor:pointer}
.rail.open{cursor:default;align-items:start;padding:7px 0 8px}
.rail .gut{min-width:0}
.rail .gut .q,.rail .gut b{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ink)}
.rail .gut .pn,.rail .gut .gs{font-size:9.5px;color:var(--ash)}
.rail .gut .val,.rail .gut .gv{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}          /* 8 */
.rail .track{min-width:0;position:relative}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}

/* WHEN — fault 4: never clipped. The strip scrolls instead of shrinking. */
.rail .months{display:flex;gap:2px;align-items:flex-end;min-width:0}
.rail .mo{position:relative;flex:1 1 0;min-width:0;cursor:pointer}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain;touch-action:pan-x}
.rail.open[data-rail=when] .months,
.rail.open[data-rail=when] .axis{min-width:max(100%,calc(var(--mw,380) * 9px))}
.rail.open[data-rail=when] .mo{flex:0 0 9px;min-width:9px}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit{outline:1.5px solid var(--ink);outline-offset:1px}
.mo .parth{background:repeating-linear-gradient(45deg,transparent 0 3px,var(--paper) 3px 6px);pointer-events:none}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.whenhint{font:11.5px/1.4 Archivo,system-ui,sans-serif;color:var(--ash);margin-top:3px}
.mag{position:absolute;left:0;right:0;bottom:16px;height:84px;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  color:var(--rust-text);background:var(--paper);padding:0 4px}

/* WHERE */
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.legend{font-size:12px;display:flex;flex-direction:column;gap:1px}
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;
  padding:1px 4px;border-radius:3px}
.lrow:hover{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lrow b{font-family:'IBM Plex Mono',monospace;font-weight:400;color:#5f584f}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}

/* WHOSE and FORCED — fault 8: room for the whole label, ellipsis only as a
   last resort, never a mid-word clip */
.col .ch{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.orow{display:grid;grid-template-columns:190px 1fr 56px;gap:8px;align-items:center;font-size:12px;
  cursor:pointer;padding:0 3px;border-radius:3px;height:17px}
.orow:hover{background:rgba(196,75,40,.08)}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;display:flex;align-items:center}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)}
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
.frows{margin-top:6px}
.fnote{font-size:11px;color:var(--ash);margin-top:4px}
.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.rail[data-rail=forced].open .fblock{margin-bottom:7px}
.rail[data-rail=when] .strip,.rail[data-rail=whose] .strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}

/* open-rail reading + specimen + margin */
.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);
  background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);max-width:74ch}
.specimen{margin-top:8px;border-top:1px solid var(--line);padding-top:6px}
.specimen .sh{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ash)}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;color:#403b35;
  margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
.specimen.opens:hover{background:#f3efe8}
.opencue{color:var(--rust-text);font-weight:600;white-space:nowrap}
.spec-decoded{font:600 12.5px/1.5 Archivo,system-ui,sans-serif;color:var(--rust-text);margin:2px 0 3px}
.margin{margin-top:6px;border-top:1px solid var(--line);padding:5px 0 2px 0;
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5f584f;line-height:1.5}
.margin span{display:block}
.margin span+span{margin-top:2px}
.margin .rustnote{color:var(--rust-text)}

.seam{display:block;margin:8px 0 0 auto;height:34px;border:0;background:var(--rust);color:#fff;
  font:600 12px/1 Archivo,system-ui,sans-serif;padding:0 18px;cursor:pointer;border-radius:5px 0 0 0}
.seam:hover{background:#a83d1f}

/* ---- the seam above the results: fault 5, sticky; it must be a SIBLING of
   the horizontal scroller, as the original places .cut outside .tscroll ---- */
#results{overflow-x:visible}
#rr-scroll,.tscroll{overflow-x:auto}
#rr-scroll table,.tscroll table.reports{min-width:760px;width:100%}      /* 6 */
.cut{position:sticky;top:0;z-index:6;background:var(--paper);border-top:2px solid var(--rust);
  padding:8px 10px;display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap}
.cut .cs{font-family:'Instrument Serif',Georgia,serif;font-size:20px;line-height:1.2;color:var(--ink);flex:1 1 320px;min-width:280px}
.cut .cs .fig{font-family:'IBM Plex Mono',monospace;color:var(--rust-text);font-size:.9em}
.cut .cm{display:flex;gap:14px;align-items:baseline;flex:0 1 auto;min-width:0;flex-wrap:wrap;
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#5f584f}
.cut .cm .lit{color:var(--ink)}
.cut .cm .lit::before{content:"\\2022 ";color:var(--rust)}
.cut .backup{border:0;background:none;color:var(--rust-text);cursor:pointer;font:inherit;font-size:10.5px;padding:0}
tr.spine td,tr.hdr td{position:sticky;top:0;z-index:5;background:#f2eee6;border-top:1px solid var(--rust);
  padding:4px 10px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
tr.spine b{font-weight:400;color:#5f584f;margin-left:10px}
@media(max-width:900px){.cut{gap:4px}.cut .cs{font-size:16px;min-width:0;flex:1 1 100%}}

/* ---- the results table: faults 13 and 14 ---- */
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);font-size:13px}
table th{text-align:left;padding:8px 9px;border:0;border-bottom:1px solid var(--line);
  font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash);white-space:nowrap;height:auto}
table td{padding:8px 9px;border-bottom:1px solid #f0ede6;vertical-align:top;font-weight:400;
  font-family:inherit;font-size:13px}                                    /* 13/14 */
tr:hover td{background:#fbfaf7}
.c{color:var(--ink);cursor:pointer;border-bottom:1px solid transparent}
.c:hover{color:var(--rust);border-bottom-color:rgba(196,75,40,.55)}
tr:hover .c{border-bottom-color:#ddd7cc}
table.reports tr.rep td:nth-child(5) .c{color:var(--rust)}
.term{border-bottom:1px dotted #d3ccc1;cursor:help}
.c.dull{color:var(--ash)}
.c.dull:hover{color:var(--rust)}
.absent{color:var(--ash);font-style:italic}
.warnline{font-size:11.5px;color:#7c3a1f;background:#fdf3ee;border-radius:3px;padding:2px 6px;margin-top:3px;display:inline-block}
tr.anon td{color:var(--ash)}
tr.divider td{background:#faf7f1;color:var(--smoke);font-size:12px;line-height:1.5;padding:9px 12px;border-top:2px solid var(--line)}
tr.empty td{padding:26px 16px;background:#faf8f4;border-bottom:0}
tr.empty p{margin:0 0 12px;font-size:14px}
mark.hit{background:#ffe9c9;color:inherit;border-radius:2px;padding:0 1px}
button.c{border:0;background:none;padding:0;font:inherit;color:inherit;text-align:left;cursor:pointer}
table.kv{width:100%;border-collapse:collapse}
table.kv th{text-align:left;width:210px;vertical-align:top;padding:9px 12px 9px 0;font-weight:600;color:var(--ash);border-bottom:1px solid var(--line)}
table.kv td{padding:9px 0;vertical-align:top;border-bottom:1px solid var(--line)}
table.codes{width:100%;border-collapse:collapse;margin-bottom:22px}
table.codes td{padding:6px 10px 6px 0;border-bottom:1px solid var(--line);vertical-align:top}
table.codes td:first-child{width:92px}
.quote{background:#faf8f4;border-left:2px solid #e0d9cc;padding:10px 12px;border-radius:4px;
  font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.55;white-space:pre-wrap}
.srclinks{margin:0;padding-left:17px}
.srclinks li{margin:5px 0;line-height:1.5}
.srclinks a{color:var(--rust-text)}
.bardivider{grid-column:1/-1;font-size:11.5px;color:var(--smoke);border-top:1px solid var(--line);padding-top:6px;margin-top:4px;display:block}
.bars>div{display:grid;grid-template-columns:230px 1fr 78px;align-items:center;gap:8px}
.bars .k{display:flex;gap:6px;align-items:baseline;min-width:0}
.bars .k .kt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bars .t{flex:1;min-width:60px;display:block;background:#efece4;border-radius:3px}
.bars .b{display:block;height:11px;min-width:2px;background:var(--rust);opacity:.75;border-radius:2px}
.bars .n{width:auto;flex:none;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:760px){.bars>div{grid-template-columns:130px 1fr 62px}.two{grid-template-columns:1fr}}
.pill{display:inline-block;background:#efece5;border-radius:10px;padding:2px 9px;font-size:12px;color:var(--smoke);margin:0 4px 4px 0;cursor:pointer}

/* ---- the write-up band: fault 21, no fixed heights, the clamp rules ---- */
table.reports tr.rep td{border-bottom:0;padding-bottom:4px}
table.reports tr.wrote td{padding:0 0 14px;border-bottom:1px solid var(--line)}
.wu{background:#faf8f4;border-left:2px solid #e0d9cc;padding:8px 12px;cursor:pointer;position:relative}
.wu:hover{border-left-color:var(--rust)}
.wu .txt{font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.6;white-space:pre-wrap;
  color:#403b35;max-width:104ch;height:auto;max-height:none}              /* 21 */
.wu.clip .txt{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.wu.clip.long .txt{padding-bottom:4px}
.wu.clip.long::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22px;
  background:linear-gradient(180deg,rgba(250,248,244,0),#faf8f4)}
.wu-gloss{position:relative;z-index:1;margin-top:6px}
.wu-gloss button,.wu-toggle{position:relative;font-size:11.5px;padding:3px 9px;background:#fff;
  color:var(--ink);border:1px solid var(--line);border-radius:3px;cursor:pointer;z-index:1}
.wu+.wu{margin-top:6px}
.swipehint{display:none;font-size:12px;color:var(--smoke);margin:0 0 6px}
@media(max-width:1100px){.wu .txt{max-width:none}.wu.clip .txt{-webkit-line-clamp:5}
  table.reports tr.wrote .wu{position:sticky;left:0;width:calc(100vw - 44px);max-width:calc(100vw - 44px)}}
@media(max-width:900px){
  table.reports tr.rep td:first-child,table.reports th:first-child{position:sticky;left:0;z-index:2;
    background:var(--card);box-shadow:1px 0 0 var(--line)}
  table.reports tr:hover td:first-child{background:#fbfaf7}}

/* ---- faults 1 and 3: the case sheet is an overlay, always, at any width.
   Whatever element carries it renders fixed to the viewport; nothing is
   inserted into the page flow. ---- */
#case-wrap,.case-overlay{
  position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;
  overscroll-behavior:contain;align-items:flex-start;justify-content:center;
  padding:32px 16px;overflow:auto;display:none}
#case-wrap.open,.case-overlay.open{display:flex}
#case-box,.case-overlay>.case-card{
  background:#fff;max-width:min(880px,66vw);width:100%;border-radius:12px;padding:24px 28px;
  box-shadow:0 24px 60px rgba(0,0,0,.3);margin:0 auto}                    /* 1/3 */
#case-box .eyebrow-k{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.04em;color:var(--ash);margin-bottom:3px}
#case-box h2{font-size:21px;line-height:1.25}
#case-box .route{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);margin:2px 0 10px}
#case-box .bigq{margin:0 0 14px;padding:12px 16px;background:#faf8f4;border-left:3px solid var(--rust);
  font-family:'IBM Plex Mono',monospace;font-size:15px;line-height:1.55;color:#2e2a26;white-space:pre-wrap}
#case-box .publish{background:#fdf3ee;border:1px solid #eec9b8;border-radius:5px;padding:10px 14px;
  margin:0 0 14px;font-size:12.5px;line-height:1.5}
#case-box .publish b{display:block;margin-bottom:4px;color:#7c3a1f}
#case-box .publish ul{margin:0;padding-left:17px}
/* fault 22: the action bar pins to the top of the sheet */
#case-box .case-actions,.case-actions{
  position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;
  background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid var(--line)}
#case-box .case-actions [data-copy="close"],#case-box .case-actions button:last-child{margin-left:auto}
#case-box .step{display:flex;align-items:center;gap:6px;margin-right:auto;
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash)}
@media(max-width:900px){#case-box{max-width:100%}}
@media(max-width:520px){#case-box table.kv th,#case-box table.kv td{display:block;width:auto;padding:6px 0;border-bottom:0}
  #case-box table.kv td{border-bottom:1px solid #eef1f4;margin-bottom:6px}}

/* ---- fault 7: focus is always visible, on paper and on ink ---- */
:is(button,[role="button"],.tab,.clause,.rv-clause,.mo,.zone,.orow,.lrow,a[href],summary):focus-visible{
  outline:2px solid var(--rust);outline-offset:2px;border-radius:2px}
.zone:focus-visible{outline:none;stroke:var(--ink);stroke-width:3;filter:drop-shadow(0 0 0 2px var(--paper))}
.mo:focus-visible,.orow:focus-visible,.lrow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.freshness{margin:10px 0 2px;text-align:center;font-size:12px;color:var(--smoke);letter-spacing:.02em}
.credit{margin:2px 0 10px;text-align:center;font-size:12px;color:var(--smoke)}
.credit a{color:inherit;text-decoration:underline;text-underline-offset:2px}

/* ---- fault 2: the phone instrument, at 390px ---- */
@media(max-width:760px){
  .instrument{border-radius:0;margin:0 -20px;border-left:0;border-right:0}
  .instrument .ipad{padding:10px 14px 6px}
  .ihead{flex-direction:column;gap:8px}
  .stand.rv-sentence,.sentence{font-size:26px}
  .aimat input{max-width:none;flex:1 1 100%}
  .rails{gap:0}
  .rail{grid-template-columns:1fr;gap:4px;padding:8px 0;align-items:stretch}
  .rail .track.two{grid-template-columns:1fr;gap:10px}
  .rail .gut{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .rail .gut .gv{white-space:normal}
  /* months become 44px tappable columns; the strip scrolls sideways */
  .rail.open[data-rail=when] .mo{flex:0 0 44px;min-width:44px;height:64px}
  .rail.open[data-rail=when] .months{gap:3px}
  .mo i{border-radius:2px}
  .orow{grid-template-columns:1fr 52px;grid-template-areas:"n n" "b c";row-gap:2px;
    height:auto;min-height:52px;align-content:center;padding:6px 3px}
  .orow .on{grid-area:n;white-space:normal;overflow:visible;text-overflow:clip}
  .orow .ob{grid-area:b}
  .orow b{grid-area:c}
  .orow.more{min-height:44px}
  .fblock{height:26px}
  .legend .lrow{min-height:44px}
  .seam{position:static;width:100%;border-radius:0;height:44px;margin-top:8px}
  .wrap{padding:12px 14px 70px}
  .cut .cs{font-size:16px;min-width:0;flex:1 1 100%}
  .aimat button,.chipbtn{min-height:44px}
  .chipbtn{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer}
  .phpresets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
}

/* reduced motion, forced colours */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important;scroll-behavior:auto!important}
  .starter.flash{animation:none;background:#f6e3d8}
}
@media(forced-colors:active){
  .mo .ghostb,.mo .selb,.strip span,.orow .ob i,.fblock i{forced-color-adjust:none;border:1px solid CanvasText}
  .zone{stroke:CanvasText}
}

/* The tokens above are written on :root, and the rebuild sets its own on
   #hero-root, which is an id and therefore wins whatever the order. Same values,
   same specificity, so the palette actually takes: the census counted
   rgb(34,32,28) painted 5,739 times where the original paints ink. */
#hero-root{
  --ink:#1d1d1f; --paper:#f7f5f0; --ash:#756f69; --smoke:#6b6560;
  --rust:#c44b28; --rust-text:#b8431f; --line:#e2ded5; --card:#fff;
  --faint:#efece4; --rest:#e8e3d8; --held:#d8d2c6;
  color:var(--ink); background:var(--paper);
}

/* The rules above name the original's classes. The rebuild's record table is
   table.reps, its rows tr.rep and tr.wrote, its write-up .wu and its filter
   fields .fld, so those kept their own colours: a census still found 1,306
   elements painted rgb(34,32,28) and rgb(61,58,51) after the tokens were right.
   Same rules, the rebuild's names. */
table.reps, table.reps td, table.reps tr.rep, table.reps tr.wrote,
#rr-table, #rr-table td, #rr-table tr, tbody{ color:var(--ink) }
.wu, .wu .txt, .wu-gloss{ color:var(--ink) }
#sdControls .fld, #sdControls label, #chips, #count, #starters{ color:var(--ink) }
table.reps td{ font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  font-size:11px; font-weight:400; letter-spacing:normal }
table.reps tr.rep td{ border-top:1px solid var(--rust) }
table.reps th{ font-size:11px; background:transparent; color:var(--ash);
  border-bottom:1px solid var(--line); letter-spacing:.055em; padding:0 9px }

/* A shut month strip scales to its track: the reference gives .mo no minimum, so
   380 bars share whatever width there is. The rebuild floors each bar, which is
   right for an open rail that scrolls and wrong for a shut one, where it hid 24%
   of the timeline at 820px and 52% at 390. */
.rail:not(.open) .months{ overflow:hidden; gap:0 }
/* the bars now shrink to nothing, and 380 gaps of 2px are 760px on their own:
   wider than a phone. The reference draws the shut strip with no gap at all. */
.rail:not(.open) .mo + .mo{ margin-left:0 }
.rail:not(.open) .mo{ min-width:0 !important; flex:1 1 0 !important; width:auto !important }
.rail.open[data-rail=when] .track{ overflow-x:auto; overscroll-behavior-x:contain }
`;document.head.appendChild(s);})();
