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



/* ---- 41: the disagreements, and the way in, written by the model ---- */
(function(){
"use strict";
window.__sderrs=window.__sderrs||[];
addEventListener("error",function(e){try{window.__sderrs.push(String((e&&e.message)||e))}catch(_){}});
function byId(id){return document.getElementById(id)}
function visible(n){if(!n||n.nodeType!==1)return false;if(!n.offsetParent&&getComputedStyle(n).position!=="fixed")return false;var cs=getComputedStyle(n);return cs.display!=="none"&&cs.visibility!=="hidden"}
function phone(){return matchMedia("(max-width:760px)").matches}
var READING_TEXT="Upper fuselage accounts for 84,453 of the 212,940 reports written in the FAA\u2019s numbered zones, or 39.7%. Those numbers are what this diagram can place, and they are 12.1% of the selection. Another 1,454,504 do say where, in words such as FUSELAGE or CABIN rather than a zone number, so the drawing cannot show them. Only 90,383, 5.1%, give no location at all. It is a sample rather than the whole file, but it does give you a good idea of where the trouble sits.";
var SEED_HTML='<span class="fig">1,757,827</span> reports, everything the FAA has published to 26 August 2026.';
var SHORT_TOTAL=/^1,757,827\s+reports\.?(\s*Nothing chosen yet\.?)?\s*$/;
var NOROWS_HTML='<p><strong>No rows yet, on purpose.</strong> Listing everything answers no question and buries the one you have.</p><p class="muted">Take a month, a zone, an airline or a tail from the instrument above, pick one of the starter questions, or set a filter. To read the file straight through anyway, use the button at the foot of the instrument.</p><p><button type="button" class="sdbtn" id="revealBtn">Read all 1,757,827 anyway</button> <button type="button" class="ghostbtn" id="gotoStarters">Show me the starter questions</button></p>';
function sdFiltered(){
  var i,x;
  var sels=document.querySelectorAll("#sdControls select");
  for(i=0;i<sels.length;i++){if((sels[i].value||"").trim()!=="")return true}
  var ins=document.querySelectorAll("#sdControls input");
  for(i=0;i<ins.length;i++){
    x=ins[i];
    if(x.type==="checkbox"||x.type==="radio"){if(x.checked)return true}
    else if((x.value||"").trim()!=="")return true;
  }
  var tabs=document.querySelectorAll("#vstrip .vtab.on");
  for(i=0;i<tabs.length;i++){if((tabs[i].getAttribute("data-view")||"p-search")!=="p-search")return true}
  return false;
}
function ensureIpad(){
  var hero=byId("hero");if(!hero)return null;
  var rails=hero.querySelector(".rails");
  if(!rails||!visible(rails)||hero.querySelector(".phbar"))return hero.querySelector(":scope > .ipad")||null;
  if(!/\binstrument\b/.test(hero.className||""))hero.className=("instrument "+(hero.className||"")).trim();
  var kids=[].slice.call(hero.children),i,ipad=null,ihead=null;
  for(i=0;i<kids.length;i++){if(/\bipad\b/.test(kids[i].className||"")){ipad=kids[i];break}}
  for(i=0;i<kids.length;i++){if(/\bihead\b/.test(kids[i].className||"")){ihead=kids[i];break}}
  if(!ipad){
    ipad=document.createElement("div");ipad.className="ipad";
    if(ihead)ihead.after(ipad);else hero.insertBefore(ipad,hero.firstChild);
    kids=[].slice.call(hero.children);
    for(i=0;i<kids.length;i++){if(kids[i]!==ipad&&kids[i]!==ihead)ipad.appendChild(kids[i])}
  }
  return ipad;
}
function sdSink(){
  var s=byId("sd-sink");
  if(!s){s=document.createElement("div");s.id="sd-sink";(document.querySelector("main.wrap")||document.body).appendChild(s)}
  return s;
}
function sdEmpty(c){return !c.textContent.trim()&&!c.children.length}
function seatCount(){
  var all=document.querySelectorAll("#count");
  var c=all[0];
  if(!c){
    c=document.createElement("div");c.id="count";
    (document.querySelector("main.wrap")||document.body).appendChild(c);
  }
  var i;
  for(i=0;i<all.length;i++){if(all[i]!==c&&all[i].parentNode)all[i].parentNode.removeChild(all[i])}
  function detach(){if(c.parentNode&&c.parentNode.nodeType===1&&c.parentNode.contains(c))c.parentNode.removeChild(c)}
  var hero=byId("hero");
  var railsEl=hero?hero.querySelector(".rails"):null;
  var rails=(railsEl&&visible(railsEl))?railsEl:null;
  var ph=hero?hero.querySelector(".phbar"):null;
  if(ph&&(phone()||!rails)){
    if(c.parentNode!==ph){detach();ph.insertBefore(c,ph.firstChild)}
  }else if(rails){
    var host=rails.parentNode;
    if(c.parentNode!==host||c.nextElementSibling!==rails){
      detach();
      if(rails.parentNode===host)host.insertBefore(c,rails);
    }
  }
  if(!/\bsdcount\b/.test(c.className))c.className=("sdcount "+c.className).trim();
  if(!sdFiltered()){
    if(sdEmpty(c)||SHORT_TOTAL.test(c.textContent.trim())){c.dataset.sdSeeded="1";c.innerHTML=SEED_HTML}
  }
}
function retireStand(){
  var s=document.querySelector(".ipad .stand");
  if(s&&s.parentNode)sdSink().appendChild(s);
}
function ensureReading(){
  var rail=document.querySelector(".rail[data-rail=where]");
  if(!rail||!rail.parentNode)return;
  var rs=[].slice.call(rail.querySelectorAll(".reading")),i,keep=null;
  for(i=0;i<rs.length;i++){
    if(!keep||rs[i].textContent.trim().length>keep.textContent.trim().length)keep=rs[i];
  }
  if(keep&&keep.tagName!=="P"){
    var p=document.createElement("p");p.className="reading";
    p.innerHTML=keep.innerHTML;
    keep.parentNode.replaceChild(p,keep);keep=p;
  }
  if(!keep){
    keep=document.createElement("p");keep.className="reading";
    keep.textContent=READING_TEXT;
  }
  if(keep.parentNode!==rail)rail.appendChild(keep);
  [].slice.call(rail.children).forEach(function(n){
    if(n===keep)return;
    var cn=n.className||"";
    if(/\b(gut|track)\b/.test(cn))return;
    if(/\breading\b/.test(cn)){
      if(!n.textContent.trim())n.remove();
      return;
    }
    n.remove();
  });
}
function stripInline(){
  var bs=document.querySelectorAll("#vstrip.vgroups .vgbtns"),i;
  for(i=0;i<bs.length;i++){
    var b=bs[i];if(b.dataset.sdInl)continue;b.dataset.sdInl="1";
    b.style.margin="0";b.style.padding="0";b.style.borderBottom="0";
  }
}
function secondLine(){
  var strip=byId("vstrip");if(!strip)return;
  var p=byId("sd-second");
  if(!p){p=document.createElement("p");p.id="sd-second";p.className="sd-second";strip.parentNode.insertBefore(p,strip.nextSibling)}
  if(p.dataset.sdDone)return;p.dataset.sdDone="1";
  var fr=byId("freshness");
  p.innerHTML=(fr&&fr.textContent.trim())?fr.textContent.trim():"Counts of reports filed, not of flights.";
}
function ensureSentence(){
  var s=byId("sentence");
  if(!s){s=document.createElement("div");s.id="sentence";s.hidden=true;(document.querySelector("main.wrap")||document.body).appendChild(s)}
  if(!s.hidden)s.hidden=true;
  if(s.style.display!=="none")s.style.display="none";
}
function ensureNoRows(){
  var n=byId("noRows");if(!n)return;
  if(!n.textContent.trim()&&!n.children.length)n.innerHTML=NOROWS_HTML;
  if(phone()){
    if(n.hasAttribute("hidden"))n.removeAttribute("hidden");
    if(n.style.display==="none")n.style.display="";
  }
}
/* sd-tag: mark the record table so its td padding can be tuned */
function tagTable(){
  var w=document.querySelector(".wu");
  if(!w)return;
  var t=w.closest("table");
  if(t&&!t.classList.contains("sdtable"))t.classList.add("sdtable");
}
var snap={c:null};
function sdMirror(){
  var s=byId("sentence"),c=byId("count");
  if(!s||!c||s===c)return;
  var cv=c.innerHTML;
  if(s.innerHTML!==cv&&snap.c!==null&&snap.c!==cv){
    s.innerHTML=cv;
  }
  snap.c=cv;
}
function purgeLand(){
  var ls=document.querySelectorAll(".card.land"),i;
  for(i=0;i<ls.length;i++)ls[i].remove();
}

/* ============ sd-globals: the six inline handlers in the record table call
   window.setFilter and window.setHero, which live inside the page's IIFE and
   are invisible to an inline onclick, which resolves against the global scope
   only. Defined here, only when the page has not exported its own, and
   re-checked on every pass so a page export always steps in front.
   setFilter narrows the selection the honest way: every filter on this page
   is a query parameter, the instrument reads them on load and composes the
   standing sentence from them, so the parameter is set and the page applies
   it : the URL, the sentence and the rows then all agree.
   setHero takes a rail name and opens that rail. ========================== */
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
    if(!r){
      var cand=byId("rail-"+name)||byId("rail_"+name);
      if(cand&&/\brail\b/.test(cand.className||""))r=cand;
    }
    if(!r)return;
    if(!/\bopen\b/.test(r.className||"")){
      /* give the page's own toggle first crack; headings only, so a stray
         button inside the rail is never fired */
      var tog=r.querySelector(".railhead,.rhead,.rail-hd,.rlabel,summary,h2,h3");
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

/* ============ sd-pnrow: the case sheet's sixteen rows carry a Part row that
   names the part, but the part number appeared nowhere on the page : and
   worse, a row once said "not recorded" about a number the file records.
   Nothing is intercepted any more: when a sheet is open, its control number
   is read off the sheet itself and one request goes straight to
   api/case/<control>, a flat object whose PartNumber is the field that
   carries the number ("17039203426" on JR2R20260825350), with
   ComponentPartNumber as the fallback and null on most records. "not
   recorded" is printed only when the record is in hand and both fields
   really are empty : never while the request is in flight and never when
   it failed, because either of those would tell a reader the FAA recorded
   nothing where the FAA recorded a number. The same case record carries
   PartName and PartCondition, and both travel with the number as
   data-sd-partname and data-sd-partcond, because the file cannot be
   searched by part number: the dossier the row opens is searched by the
   part's NAME, so the name has to come from the record the reader clicked.
   The row is the way into the part dossier. ================================ */
var SDPNC={cache:{},busy:{}};
function sdControlToken(text){
  var m=String(text==null?"":text).match(/\b[A-Za-z0-9]{9,16}\b/g),i,d;
  if(!m)return "";
  for(i=0;i<m.length;i++){
    d=(m[i].match(/\d/g)||[]).length;
    if(d>=9)return m[i];
  }
  return "";
}
function sdFindControl(table){
  if(!table)return "";
  var rows=table.rows,i,c0,tok;
  /* first preference: a row whose label names the control */
  for(i=0;i<rows.length;i++){
    if(rows[i].getAttribute&&rows[i].getAttribute("data-sd-pnrow")==="1")continue;
    c0=rows[i].cells&&rows[i].cells[0];
    if(!c0)continue;
    if(/control/i.test(c0.textContent||"")){
      tok=sdControlToken(rows[i].cells[rows[i].cells.length-1].textContent);
      if(tok)return tok;
    }
  }
  /* fallback: the sheet's own text, row by row, skipping the row this block
     drew and the citation row, either of which could carry a number that is
     not the control */
  var clone=table.cloneNode(true);
  [].slice.call(clone.querySelectorAll("tr[data-sd-pnrow]")).forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n)});
  rows=clone.rows;
  for(i=0;i<rows.length;i++){
    c0=rows[i].cells&&rows[i].cells[0];
    if(c0&&/how to cite/i.test(c0.textContent||""))continue;
    tok=sdControlToken(rows[i].textContent);
    if(tok)return tok;
  }
  return "";
}
function sdEnsureCase(control){
  if(Object.prototype.hasOwnProperty.call(SDPNC.cache,control))return SDPNC.cache[control];
  if(!SDPNC.busy[control]){
    SDPNC.busy[control]=1;
    sdGetJSON("case/"+encodeURIComponent(control)).then(function(rec){
      SDPNC.cache[control]=(rec&&typeof rec==="object"&&!Array.isArray(rec))?rec:null;
      delete SDPNC.busy[control];
      kick();
    }).catch(function(){
      SDPNC.cache[control]=null;
      delete SDPNC.busy[control];
      kick();
    });
  }
  return undefined; /* in flight */
}
function sdIsAbsentText(s){
  if(/^(--|\u2013|:|-)$/.test(s))return true;
  if(/^(none|unknown|n\/a|na|not available|not recorded|not given|not reported|not stated|not captured|no entry|missing|absent|unrecorded)\.?$/i.test(s))return true;
  return /^not\s+[a-z][a-z ]{1,24}\.?$/i.test(s);
}
function sdAbsence(table){
  var seen={},best=null,rows=table.rows,i,cells,cell,v;
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
function sdSheets(){
  var out=[],ts=document.querySelectorAll("table"),i,j,t,rows,part,cite;
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
    if(part&&cite)out.push({table:t,row:part});
  }
  return out;
}
function sdFillPartRow(partRow,table){
  var nxt=partRow.nextElementSibling,row=null;
  if(nxt&&nxt.getAttribute&&nxt.getAttribute("data-sd-pnrow")==="1")row=nxt;
  else if(nxt&&nxt.cells&&nxt.cells[0]&&nxt.cells[0].textContent.trim()==="Part number")return; /* the page drew its own */
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
    partRow.parentNode.insertBefore(row,partRow.nextSibling);
  }
  var vc=row.cells&&row.cells[1];
  if(!vc)return;
  var control=sdFindControl(table||partRow.closest("table"));
  var rec,key,pn,ab;
  if(!control){key="noctl";vc.setAttribute("data-sd-pnval",key);vc.textContent="";return}
  rec=sdEnsureCase(control);
  if(rec===undefined){key="pending:"+control;vc.setAttribute("data-sd-pnval",key);vc.textContent="";return}
  if(!rec){key="failed:"+control;vc.setAttribute("data-sd-pnval",key);vc.textContent="";return}
  var raw=rec.PartNumber;
  if(raw==null||String(raw).trim()==="")raw=rec.ComponentPartNumber;
  pn=(raw==null)?"":String(raw).trim();
  var pnm=(rec.PartName==null)?"":String(rec.PartName).trim();
  var pcd=(rec.PartCondition==null)?"":String(rec.PartCondition).trim();
  if(pn)key="pn:"+pn;
  else{ab=sdAbsence(table)||{text:"not recorded",cls:""};key="absent:"+ab.text}
  if(vc.getAttribute("data-sd-pnval")===key)return;
  vc.setAttribute("data-sd-pnval",key);
  vc.textContent="";
  if(pn){
    var code=document.createElement("code");
    code.className="cd sd-pnlink";
    code.textContent=pn;
    code.setAttribute("data-sd-part",pn);
    if(pnm)code.setAttribute("data-sd-partname",pnm);
    if(pcd)code.setAttribute("data-sd-partcond",pcd);
    code.setAttribute("role","button");
    code.setAttribute("tabindex","0");
    code.setAttribute("aria-label",pnm
      ?("Open the dossier for the part "+pnm+", part number "+pn)
      :("Open the dossier for part number "+pn));
    try{code.dataset.sdPnDone="1"}catch(_){}
    vc.appendChild(code);
  }else{
    if(ab&&ab.cls)vc.className=ab.cls;
    vc.textContent=ab.text;
  }
}
function sdPartRow(){
  var sheets=sdSheets(),i;
  for(i=0;i<sheets.length;i++){try{sdFillPartRow(sheets[i].row,sheets[i].table)}catch(_){}}
}

/* ============ sd-dossier: the panel holds one subject at a time : a tail
   number, an operator code, or a part. A part dossier is addressed by the
   part number the reader clicked but is SEARCHED by the part's name, taken
   from the case record they clicked it in, because the file behind this
   page cannot be searched by part number at all. When no name travels with
   the number, the dossier says so and shows nothing the file cannot
   support. ================================================================ */
var SD={kind:null,value:null,pname:"",pcond:"",inflight:null,cache:{}};
var SD_KIND={tail:"tail number",operator:"operator",part:"part"};
function sdEsc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function sdNum(v){var n=Number(v);if(isFinite(n))return n;n=Number(String(v==null?"":v).replace(/,/g,""));return isFinite(n)?n:0}
function sdFmt(n){return sdNum(n).toLocaleString("en-US")}
function sdKey(kind,val){return kind+":"+val}
function sdCurKey(){
  var k=sdKey(SD.kind,SD.value);
  if(SD.kind==="part"&&SD.pname)k+="|"+SD.pname;
  return k;
}
function sdKickText(kind){return 'Aircraft panel, holding <b>one '+SD_KIND[kind]+'</b>'}
function sdDossierNode(){
  var panel=byId("p-aircraft");if(!panel)return null;
  var node=byId("sd-dossier");
  if(!node){
    node=document.createElement("div");node.id="sd-dossier";
    node.setAttribute("role","region");node.setAttribute("aria-label","Dossier for the current subject");
    var pb=byId("p-aircraft-body");
    if(pb&&pb.parentNode===panel)pb.insertAdjacentElement("afterend",node);
    else panel.appendChild(node);
  }
  return node;
}
function sdSetVerbatim(node,sel,txt){
  var el=node.querySelector(sel);
  if(el)el.textContent=(txt==null)?"":String(txt);
}
/* sd-d-limit helper: every cannot_show sentence goes on screen, verbatim */
function sdLimits(arr){
  if(!arr||!arr.length)return "";
  return '<section class="sd-d-sec"><h3>What this file cannot show</h3><ul class="sd-d-lim">'
    +arr.map(function(x){return '<li>'+sdEsc(x)+'</li>'}).join("")+'</ul></section>';
}
/* sd-d-pair: rows arrive as objects whose field names are not part of the
   contract, so read the values by kind: the last free-text value is the
   label, the last numeric value is the count. */
function sdLabelNum(o){
  var keys,i,v,strs=[],nums=[];
  if(o&&typeof o==="object"){
    keys=Object.keys(o);
    for(i=0;i<keys.length;i++){
      v=o[keys[i]];
      if(typeof v==="number"&&isFinite(v)){nums.push(v);continue}
      if(typeof v==="string"&&v.trim()){
        if(/\d/.test(v)&&/^-?[\d,]+(\.\d+)?$/.test(v.trim().replace(/,/g,"")))nums.push(v.trim());
        else strs.push(v.trim());
      }
    }
    if(strs.length)return{label:strs[strs.length-1],num:nums.length?sdNum(nums[nums.length-1]):null};
    if(nums.length)return{label:String(nums[0]),num:sdNum(nums[nums.length-1])};
    return{label:keys.length?String(o[keys[0]]):"",num:null};
  }
  return{label:String(o==null?"":o),num:null};
}
function sdBars(rows){
  var i,p,items=[],max=0;
  if(!rows||!rows.length)return "";
  for(i=0;i<rows.length;i++){p=sdLabelNum(rows[i]);items.push(p);if(p.num!=null&&p.num>max)max=p.num}
  return items.map(function(p){
    var w=(p.num!=null&&max>0)?Math.max(2,Math.round(100*p.num/max)):0;
    return '<li><span class="sd-d-barlab">'+sdEsc(p.label)+'</span>'
      +'<span class="sd-d-bar">'+(w?'<i style="width:'+w+'%"></i>':'')+'</span>'
      +'<span class="sd-d-barnum">'+(p.num!=null?sdFmt(p.num):":")+'</span></li>';
  }).join("");
}
/* sd-d-quotes: a few records in the file's own words. Field names are not
   part of the contract, so take the longest text on each record, which is
   where the write-up lives, and say so. */
function sdQuotes(recs){
  var out=[],i,r,vals,cand,limit;
  if(!recs||!recs.length)return "";
  limit=Math.min(recs.length,3);
  for(i=0;i<limit;i++){
    r=recs[i];cand="";
    if(r&&typeof r==="object"){
      vals=Object.keys(r).map(function(k){return r[k]})
        .filter(function(v){return typeof v==="string"&&v.trim().length>=40});
      vals.sort(function(a,b){return b.length-a.length});
      if(vals.length)cand=vals[0].trim();
    }else if(typeof r==="string"&&r.trim().length>=40){cand=r.trim()}
    if(cand)out.push('<blockquote class="sd-d-quote">'+sdEsc(cand.length>220?cand.slice(0,220)+"\u2026":cand)+'</blockquote>');
  }
  if(!out.length)return "";
  return '<section class="sd-d-sec"><h3>In the file\u2019s own words</h3>'+out.join("")
    +'<p class="sd-d-ops">Up to three of the '+sdFmt(recs.length)+' records in this slice, longest text field first.</p></section>';
}
function sdRenderFailed(node,kind){
  node.innerHTML='<p class="sd-d-kick">'+sdKickText(kind)+'</p>'
    +'<section class="sd-d-sec"><p class="sd-d-none">The dossier did not answer. Nothing is shown rather than something wrong.</p></section>';
}
/* ---- the tail dossier ---- */
function sdRender(node,t,raf,rpf,rsm){
  var ok=function(r){return r&&r.status==="fulfilled"?r.value:null};
  var af=ok(raf),rp=ok(rpf),sm=ok(rsm);
  var parts=['<p class="sd-d-kick">'+sdKickText("tail")+'</p>'];
  var found=af?(af.found||0):0;
  if(!af||found===0){
    parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(t)+'</span></div>');
    parts.push('<section class="sd-d-sec"><p class="sd-d-none">No reports in this file name that tail number.</p>'
      +(af&&af.note?'<p class="sd-d-note">'+sdEsc(af.note)+'</p>':'')
      +'<p class="sd-d-note">Nothing is shown rather than something wrong.</p></section>');
    node.innerHTML=parts.join("");
    return;
  }
  var ac=af.aircraft||{};
  var mm=[ac.make,ac.model].filter(Boolean).join(" ");
  var rec0=(af.records&&af.records[0])||{};
  if(!mm&&rec0.make)mm=[rec0.make,rec0.model].filter(Boolean).join(" ");
  var ops=(af.operators||[]).map(function(o){return (o&&o.name?o.name:"unnamed")+(o&&o.reports?" ("+o.reports+")":"")}).join(", ");
  parts.push('<div class="sd-d-head">'
    +'<span class="sd-d-tail">'+sdEsc(af.tail||t)+'</span>'
    +(mm?'<span class="sd-d-make">'+sdEsc(mm)+'</span>':'')
    +'<span class="sd-d-count">'+found+' report'+(found===1?"":"s")+'</span>'
    +(af.first||af.last?'<span class="sd-d-make">first filed '+sdEsc(af.first||":")+' \u00b7 last filed '+sdEsc(af.last||":")+'</span>':'')
    +'</div>');
  var fr=af.framing||{};
  parts.push('<section class="sd-d-sec"><h3>Where the write-ups were made</h3>'
    +'<p class="sd-d-frame" data-sd-frame="1"></p>'
    +'<ul class="sd-d-split">'
    +'<li>on the ground <b>'+sdEsc(fr.on_ground)+'</b> ('+sdEsc(fr.on_ground_pct)+'%)</li>'
    +'<li>in flight <b>'+sdEsc(fr.in_flight)+'</b> ('+sdEsc(fr.in_flight_pct)+'%)</li>'
    +'<li>of <b>'+sdEsc(fr.total)+'</b> write-ups</li>'
    +'</ul></section>');
  if(rp&&rp.groups&&rp.groups.length){
    var gs=rp.groups.map(function(g){
      var sys=g.system?" : "+sdEsc(g.system):"";
      var rec=(g.records&&g.records[0]&&g.records[0].text)
        ?'<blockquote class="sd-d-quote">'+sdEsc(String(g.records[0].text).slice(0,220))+'</blockquote>':"";
      return '<div class="sd-d-rpt"><b>'+sdEsc(g.part||"unnamed part")+'</b>'+sys
        +' \u00b7 '+sdEsc(g.times)+' write-up'+(g.times===1?"":"s")
        +' \u00b7 first '+sdEsc(g.first)+' \u00b7 last '+sdEsc(g.last)
        +' \u00b7 <span class="sd-d-hrs">'+sdEsc(g.hours_between)+' hours between first and last</span>'+rec+'</div>';
    }).join("");
    parts.push('<section class="sd-d-sec"><h3>What recurred</h3>'
      +(rp.note?'<p class="sd-d-note">'+sdEsc(rp.note)+'</p>':"")+gs+'</section>');
  }else{
    parts.push('<section class="sd-d-sec"><h3>What recurred</h3><p class="sd-d-none">Nothing on this airframe was written up more than once.</p></section>');
  }
  /* the repeats endpoint's own limits, if it states any */
  if(rp&&rp.cannot_show&&rp.cannot_show.length)parts.push(sdLimits(rp.cannot_show));
  var gen=!!(sm&&sm.generated===true);
  var hasSum=sm&&sm.summary&&String(sm.summary).trim();
  var lab=hasSum?(gen?"Written by a model":"Assembled from recounted numbers : not written by a model"):"Summary not written";
  var sumBody=hasSum?'<p class="sd-d-sum" data-sd-sum="1"></p>'
    :'<p class="sd-d-none">No summary was written for this tail. That is the check working: nothing is shown rather than something wrong.</p>';
  var sumNote=(sm&&sm.note)?'<p class="sd-d-note">'+sdEsc(sm.note)+'</p>':"";
  var sumLim=(sm&&sm.cannot_show&&sm.cannot_show.length)
    ?'<ul class="sd-d-lim">'+sm.cannot_show.map(function(x){return "<li>"+sdEsc(x)+"</li>"}).join("")+'</ul>':"";
  parts.push('<section class="sd-d-sec"><h3 class="sd-mine">'+sdEsc(lab)+'</h3>'+sumBody+sumNote+sumLim+'</section>');
  parts.push(sdLimits(af.cannot_show));
  var cit=af.citation||{};
  var csvTail=af.tail||t;
  parts.push('<section class="sd-d-sec"><h3>Citation</h3><p class="sd-d-cite">'
    +sdEsc(cit.source||"FAA Service Difficulty Reports")
    +(cit.retrieved?" \u00b7 retrieved "+sdEsc(cit.retrieved):"")
    +(cit.url?' \u00b7 <a href="'+sdEsc(cit.url)+'" rel="noopener">'+sdEsc(cit.url)+'</a>':"")
    +(cit.record_ids&&cit.record_ids.length?" \u00b7 "+cit.record_ids.length+" record ids":"")
    +'</p><div class="sd-d-btns"><a class="sdbtn" id="sd-d-csv" download="'+sdEsc(csvTail)+'-sdr.csv" href="/z/api/export/'+encodeURIComponent(csvTail)+'.csv">Download the CSV for this airframe</a>'
    +'<span class="sd-d-make">The CSV carries its own citation header lines.</span></div></section>');
  node.innerHTML=parts.join("");
  sdSetVerbatim(node,"[data-sd-frame]",fr.sentence);
  if(hasSum)sdSetVerbatim(node,"[data-sd-sum]",sm.summary);
}
/* ---- the operator dossier. Everything here is arithmetic over the file, so
   nothing in it is marked as a model's reading. Where the file has no name,
   the code and the note are printed, never a guess and never a blank. ---- */
function sdRenderOperator(node,res){
  var o=(res&&res.status==="fulfilled"&&res.value&&typeof res.value==="object")?res.value:null;
  if(!o){sdRenderFailed(node,"operator");return}
  var code=(o.code!=null&&String(o.code).trim())?String(o.code).trim():SD.value;
  var known=o.name_known===true;
  var name=(known&&o.name!=null&&String(o.name).trim())?String(o.name).trim():"";
  var note=(o.name_note!=null&&String(o.name_note).trim())?String(o.name_note).trim():"";
  var total=sdNum(o.total),shown=sdNum(o.shown);
  var parts=['<p class="sd-d-kick">'+sdKickText("operator")+'</p>'];
  parts.push('<div class="sd-d-head"><span class="sd-d-tail">'+sdEsc(code)+'</span>'
    +(name?'<span class="sd-d-make">'+sdEsc(name)+'</span>':'')
    +'<span class="sd-d-count">'+sdFmt(total)+' report'+(total===1?"":"s")+'</span></div>');
  if(!known){
    parts.push('<section class="sd-d-sec"><p class="sd-d-note">'
      +sdEsc(note||"The file gives no name for this designator.")+'</p></section>');
  }else if(note){
    parts.push('<section class="sd-d-sec"><p class="sd-d-note">'+sdEsc(note)+'</p></section>');
  }
  parts.push('<section class="sd-d-sec"><h3>The count</h3><ul class="sd-d-split">'
    +'<li>reports in the file <b>'+sdFmt(total)+'</b></li>'
    +'<li>shown under the current filters <b>'+sdFmt(shown)+'</b></li>'
    +'</ul></section>');
  var sys=sdBars(o.systems);
  if(sys)parts.push('<section class="sd-d-sec"><h3>By aircraft system</h3><ul class="sd-d-bars">'+sys+'</ul></section>');
  var q=sdQuotes(o.records);
  if(q)parts.push(q);
  parts.push(sdLimits(o.cannot_show));
  node.innerHTML=parts.join("");
}
/* ---- the part dossier. The reader clicked a part NUMBER, but the file
   cannot be searched by part number: every figure below, where figures are
   shown at all, counts reports naming the part's NAME, taken from the case
   record the reader clicked, and it is labelled as such. The number itself
   is checked against the file's list of the forty most-written-up part
   numbers; if it is there, its real fleet-wide figures are shown beside the
   name counts, and if it is not, that is said plainly. Nothing here claims
   a count for the number that the file cannot support. ---- */
function sdRenderPart(node,res){
  var p=(res&&res.status==="fulfilled"&&res.value&&typeof res.value==="object")?res.value:null;
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
    +(hasName
      ?'<span class="sd-d-make">figures are for the part named <b>'+sdEsc(nm)+'</b>'+(cond?', condition '+sdEsc(cond):'')+'</span>'
      :'<span class="sd-d-make">no part name travelled with this number, so no name search was made</span>')
    +((total!=null)?'<span class="sd-d-count">'+sdFmt(total)+' report'+(total===1?"":"s")+'</span>':'')
    +'</div>');
  /* the count, only when the file could answer it: by part NAME */
  if(!hasName){
    parts.push('<section class="sd-d-sec"><h3>The count</h3><p class="sd-d-none">'
      +'No count of reports is shown here, because this file cannot be searched by part number. '
      +'Open a case sheet and click its part number there: the dossier it opens is counted from the '
      +'part\u2019s name, which the file does record.</p></section>');
  }else if(total===0){
    parts.push('<section class="sd-d-sec"><h3>The count</h3><p class="sd-d-none">'
      +'No report in this file names the part \u201c'+sdEsc(nm)+'\u201d by name, so there is no table to draw. '
      +'That is a fact about this name, not about the part number: the file cannot be searched by '
      +'part number.</p></section>');
  }else{
    parts.push('<section class="sd-d-sec"><h3>Reports naming the part \u201c'+sdEsc(nm)+'\u201d</h3>'
      +'<ul class="sd-d-split">'
      +'<li>reports, total <b>'+sdFmt(total)+'</b></li>'
      +'<li>naming <b>'+sdFmt(ac)+'</b> aircraft</li>'
      +'<li>from <b>'+sdFmt(ops)+'</b> operator'+(ops===1?"":"s")+'</li>'
      +'<li>shown under the current filters <b>'+sdFmt(shown)+'</b></li>'
      +'</ul>'
      +'<p class="sd-d-ops">These figures count every report that names the part by name, which will '
      +'include other part numbers of the same kind of part. A count of reports is not a count of '
      +'broken parts: each one is a write-up on one airplane at one operator.</p></section>');
    var bo=sdBars(p.by_operator);
    if(bo&&ops>0){
      var gloss=(ops>=2)
        ?"The same part failing across "+sdFmt(ops)+" operators reads as a fleet problem rather than a supplier or a shop."
        :"Concentrated in one operator, the same part failing again reads as a supplier or a shop rather than a fleet problem.";
      parts.push('<section class="sd-d-sec"><h3>Which operators filed it</h3>'
        +'<p class="sd-d-ops">'+sdEsc(gloss)+'</p>'
        +'<ul class="sd-d-bars">'+bo+'</ul></section>');
    }
    var by=sdBars(p.by_year);
    if(by)parts.push('<section class="sd-d-sec"><h3>When the reports were filed</h3><ul class="sd-d-bars">'+by+'</ul></section>');
    var q=sdQuotes(p.records);
    if(q)parts.push(q);
  }
  /* the forty: the one place the file speaks about part numbers directly */
  var sd=p.same_defect;
  if(sd&&typeof sd==="object"){
    parts.push('<section class="sd-d-sec"><h3>This part number, fleet-wide</h3>'
      +'<p class="sd-d-frame">'+sdEsc(pn)+' is among the forty most-written-up part numbers in this file.'
      +((sd.part_name!=null&&String(sd.part_name).trim())?' The file records it as \u201c'+sdEsc(sd.part_name)+'\u201d'+((sd.condition!=null&&String(sd.condition).trim())?', condition '+sdEsc(sd.condition):'')+'.':'')
      +'</p>'
      +'<ul class="sd-d-split">'
      +'<li>reports fleet-wide <b>'+sdFmt(sd.reports)+'</b></li>'
      +'<li>aircraft <b>'+sdFmt(sd.aircraft)+'</b></li>'
      +'<li>operators <b>'+sdFmt(sd.operators)+'</b></li>'
      +'</ul>'
      +'<p class="sd-d-ops">These are the real figures for the part number itself, from the file\u2019s own '
      +'list : not the name counts above.</p></section>');
  }else if(pn){
    parts.push('<section class="sd-d-sec"><h3>This part number, fleet-wide</h3>'
      +'<p class="sd-d-none">'+sdEsc(pn)+' is not among the forty most-written-up part numbers in this '
      +'file, so the file gives no fleet-wide figure for the number itself. Nothing is invented for it.</p></section>');
  }
  parts.push(sdLimits(p.cannot_show));
  node.innerHTML=parts.join("");
}
/* ---- one opener for all three; one node, one at a time, tab forward ---- */
function sdGetJSON(path){return fetch("/z/api/"+path).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})}
function sdReq(kind,val){
  var e=encodeURIComponent(val);
  if(kind==="tail")return[sdGetJSON("airframe/"+e),sdGetJSON("repeats/"+e),sdGetJSON("summary/"+e)];
  if(kind==="operator")return[sdGetJSON("operator/"+e)];
  /* part: the path segment is the part number the reader clicked; the name
     and condition, taken from the case record they clicked it in, are what
     the file can actually search */
  var q=[];
  if(SD.pname)q.push("name="+encodeURIComponent(SD.pname));
  if(SD.pcond)q.push("condition="+encodeURIComponent(SD.pcond));
  return[sdGetJSON("part/"+e+(q.length?"?"+q.join("&"):""))];
}
function sdRenderCached(node){
  var rs=SD.cache[sdCurKey()];
  node.dataset.sdDone="1";
  if(!rs){sdRenderFailed(node,SD.kind);return}
  if(SD.kind==="tail")sdRender(node,SD.value,rs[0],rs[1],rs[2]);
  else if(SD.kind==="operator")sdRenderOperator(node,rs[0]);
  else sdRenderPart(node,rs[0]);
}
function sdOpen(kind,val,name,cond){
  if(!SD_KIND[kind])return;
  val=String(val==null?"":val).trim();if(!val)return;
  SD.kind=kind;SD.value=val;
  SD.pname=(name==null)?"":String(name).trim();
  SD.pcond=(cond==null)?"":String(cond).trim();
  var key=sdCurKey();
  var tab=document.querySelector('#vstrip .vtab[data-view="p-aircraft"]');
  if(tab)try{tab.click()}catch(_){}
  var node=sdDossierNode();if(!node)return;
  node.setAttribute("aria-label","Dossier for one "+SD_KIND[kind]);
  node.dataset.sdKey=key;
  if(SD.cache[key]){sdRenderCached(node);return}
  node.dataset.sdDone="";
  node.innerHTML='<p class="sd-d-kick">'+sdKickText(kind)+'</p>'
    +'<p class="sd-d-none">Reading the file for the '+sdEsc(SD_KIND[kind])+' '+sdEsc(val)
    +(SD.pname?', named '+sdEsc(SD.pname):'')+'\u2026</p>';
  if(SD.inflight===key)return;
  SD.inflight=key;
  Promise.allSettled(sdReq(kind,val)).then(function(rs){
    if(SD.kind!==kind||SD.value!==val)return;
    SD.inflight=null;
    SD.cache[key]=rs;
    var cur=byId("sd-dossier")||node;
    cur.dataset.sdKey=key;cur.dataset.sdDone="1";
    sdRenderCached(cur);
  }).catch(function(){
    if(SD.kind!==kind||SD.value!==val)return;
    SD.inflight=null;
    var cur=byId("sd-dossier")||node;
    cur.dataset.sdKey=key;cur.dataset.sdDone="1";
    sdRenderFailed(cur,kind);
  });
}
function sdOpenTail(t){sdOpen("tail",t)}
function sdOpenOperator(c){sdOpen("operator",c)}
function sdOpenPart(p,name,cond){sdOpen("part",p,name,cond)}
function sdBootFromURL(){
  var q=new URLSearchParams(location.search);
  var t=q.get("tail");
  if(!t&&q.get("kind")==="tail")t=q.get("v");
  if(t)sdOpenTail(t);
}
/* sd-rrtail: the page's tail click called loadTail, which does not exist
   here. Redefined to open the dossier instead; reg arrives without its
   leading N, and the tab still comes forward. Re-asserted in pass() so a
   redraw cannot put the broken one back. */
function sdRrTail(reg){
  try{if(typeof show==="function")show("p-aircraft")}catch(_){}
  sdOpenTail("N"+String(reg==null?"":reg).replace(/^N/,""));
}
window.rrTail=sdRrTail;
/* sd-dossier wiring: delegated at the document with capture, so it survives
   every redraw. The dossier markers stop the event before the cell's own
   setFilter can run; a click on the value itself still filters. A part
   number opened from a case sheet carries its part name and condition with
   it; one opened from a bare P/N mention carries only the number, and the
   dossier says honestly what that means. */
document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest('[data-ask^="tail|"],[data-sd-op],[data-sd-part]'):null;
  if(!el)return;
  if(el.hasAttribute("data-sd-op")){
    e.preventDefault();e.stopPropagation();
    sdOpenOperator(el.getAttribute("data-sd-op"));return;
  }
  if(el.hasAttribute("data-sd-part")){
    e.preventDefault();e.stopPropagation();
    sdOpenPart(el.getAttribute("data-sd-part"),
               el.getAttribute("data-sd-partname")||"",
               el.getAttribute("data-sd-partcond")||"");
    return;
  }
  var v=(el.getAttribute("data-ask")||"").slice(5);
  if(v)sdOpenTail(v);
},true);
document.addEventListener("keydown",function(e){
  if(e.key!=="Enter"&&e.key!==" ")return;
  var t=e.target;
  if(!t||!t.getAttribute)return;
  var a=t.getAttribute("data-ask")||"";
  if(a.indexOf("tail|")===0){var v=a.slice(5);if(v)sdOpenTail(v);return}
  var op=t.getAttribute("data-sd-op");
  if(op){e.preventDefault();sdOpenOperator(op);return}
  var pn=t.getAttribute("data-sd-part");
  if(pn){
    e.preventDefault();
    sdOpenPart(pn,t.getAttribute("data-sd-partname")||"",t.getAttribute("data-sd-partcond")||"");
  }
},true);
addEventListener("popstate",function(){try{sdBootFromURL()}catch(_){}});
/* sd-mark: the second way in from the table. Beside each operator value that
   setFilter owns, a small marker opens the operator dossier; a code.cd that
   really carries a P/N opens the part dossier : with the number only,
   because the record table gives no part name to search by, and the
   dossier says so rather than counting nothing and calling it zero. Model
   cells are left to setFilter alone, and the part number row this block
   drew is skipped, since its own code already carries data-sd-part. */
function sdMarkCells(){
  var OPRE=/setFilter\s*\(\s*(['"])operator\1\s*,\s*(['"])([^'"]*)\2/;
  var i,sp,ns=document.querySelectorAll("span.c[onclick*='setFilter']");
  for(i=0;i<ns.length;i++){
    sp=ns[i];
    if(sp.dataset.sdOpDone)continue;
    sp.dataset.sdOpDone="1";
    var m=OPRE.exec(sp.getAttribute("onclick")||"");
    if(!m||!m[3])continue;
    var b=document.createElement("button");
    b.type="button";b.className="sd-d-mark";
    b.setAttribute("data-sd-op",m[3]);
    b.setAttribute("aria-label","Open the dossier for operator "+m[3]);
    b.textContent="dossier";
    sp.appendChild(b);
  }
  var cs=document.querySelectorAll("code.cd"),j,c,tx,mm,pn;
  for(j=0;j<cs.length;j++){
    c=cs[j];
    if(c.dataset.sdPnDone)continue;
    if(c.closest&&c.closest("#sd-dossier"))continue;
    if(c.closest&&c.closest("[data-sd-pnrow]"))continue;
    c.dataset.sdPnDone="1";
    tx=(c.textContent||"").trim();
    mm=/^P\/?N\.?\s*(.+)$/i.exec(tx);
    if(!mm)continue;
    pn=mm[1].trim();
    if(!pn)continue;
    c.dataset.sdPart=pn;
    c.setAttribute("role","button");
    c.setAttribute("tabindex","0");
    c.setAttribute("aria-label","Open the dossier for part number "+pn+", searched only if a part name is known");
    c.classList.add("sd-pnlink");
  }
}
function sdDossierKick(){
  if(!SD.kind||!SD.value)return;
  var node=sdDossierNode();if(!node)return;
  var key=sdCurKey();
  if(node.isConnected&&node.dataset.sdKey===key&&node.dataset.sdDone==="1")return;
  node.dataset.sdKey=key;
  if(SD.cache[key])sdRenderCached(node);
  else sdOpen(SD.kind,SD.value,SD.pname,SD.pcond);
}

/* ============ sd-locate: api/locate reads the mechanic's own words and says
   where the defect was. One control sits above the record table, where the
   write-ups already are. It sends the first 25 write-ups now on screen :
   never more, the endpoint's own limit : and says that is what it sent.
   A row is marked only when the model's location came back with a span the
   endpoint could quote verbatim from the write-up; what it could not prove
   comes back as dropped_unverifiable plus a note, and both are shown. Every
   mark carries a "read by a model" tag and amber dashed styling, so it can
   never be mistaken for the FAA's zone codes in the row above. Results are
   cached against the write-up's own text, so a redraw re-marks the same
   sentence with the same reading and never a stale neighbour's. ========== */
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
    for(j=0;j<junk.length;j++){if(junk[j].parentNode)junk[j].parentNode.removeChild(junk[j])}
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
  var anchor=null,w,t,bar;
  w=document.querySelector(".wu");
  if(w&&w.isConnected){
    t=w.closest("table");
    if(t&&t.isConnected)anchor=t;
  }
  bar=byId("sd-locbar");
  if(!anchor){
    if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
    return;
  }
  if(!bar){
    bar=document.createElement("div");
    bar.id="sd-locbar";
    bar.setAttribute("data-sd-model","1");
    bar.setAttribute("role","region");
    bar.setAttribute("aria-label","A model\u2019s reading of where the write-ups on screen say the defect was");
    bar.innerHTML='<button type="button" class="sdbtn" id="sd-locbtn">Locate these write-ups</button>'
      +'<span class="sd-loc-exp">Sends the first 25 write-ups now on screen : no more, the reader\u2019s own limit : to a model that reads where each defect was. A location is kept only when the quoted words appear verbatim in the write-up; what it cannot prove is dropped and counted. Everything here is a model\u2019s reading, not the FAA\u2019s zone codes.</span>'
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
    /* sent rows are settled this run: placed ones keep their reading, the
       rest are explicitly dropped, so no stale mark survives a re-run */
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
    if(last.fp===SDLOC.fp||!last.fp){
      html='<p class="sd-loc-line">'+sdEsc(last.msg||"The locate endpoint did not answer. Nothing is marked rather than something wrong.")+'</p>';
      sig="err:"+(last.msg||"");show=true;
    }
  }else if(last&&last.fp===SDLOC.fp){
    var sentTxt=(last.sent>=last.total)
      ?("all "+last.total+" write-ups now on screen")
      :("the first "+last.sent+" of the "+last.total+" write-ups now on screen");
    html='<p class="sd-loc-line">Sent '+sentTxt+'. Checked '+sdFmt(last.checked)+', placed '+sdFmt(last.placed)+', dropped '+sdFmt(last.dropped)+' as unverifiable.</p>'
      +(last.note?'<p class="sd-loc-note">'+sdEsc(last.note)+'</p>':'');
    sig="s"+last.sent+"t"+last.total+"c"+last.checked+"p"+last.placed+"d"+last.dropped+"n"+last.note;
    show=true;
  }
  if((sum.getAttribute("data-sd-sig")||"")!==sig){
    sum.setAttribute("data-sd-sig",sig);
    if(show){
      if(sum.hidden)sum.hidden=false;
      sum.innerHTML=html;
    }else{
      if(!sum.hidden)sum.hidden=true;
      if(sum.innerHTML!=="")sum.innerHTML="";
    }
  }
}
function sdLocStep(){
  var rows=sdLocCollect();
  SDLOC.fp=sdLocFpOf(rows);
  sdLocApply(rows);
  sdLocRender();
}

/* ============ sd-conf: a record where the FAA's coded fields and the
   mechanic's own words do not agree. /z/api/conflicts is fetched once and
   kept, keyed by the record id; it is never fetched per sheet. Two ways in:
   a reference block on the desk, beside the credit, whose one line is the
   endpoint's own what_this_is and whose caveat is its own what_this_is_not,
   and a section inside a case sheet whose record has an entry, so a reader
   looking at that record need not learn elsewhere that it is disputed.
   Every entry shows the code side and the words side, each labelled with
   whose words they are, and nothing here decides which side is right: the
   tool cannot know. Where the list is linked from, the coverage is stated:
   only these entries have been read this way, out of 1,757,827 records, so
   an absent entry is not evidence that a record agrees with itself. A
   record with no entry says nothing at all about disagreements. ========== */
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
function sdConfSides(e){
  var code=(e.code_says==null)?"":String(e.code_says).trim();
  var words=(e.text_says==null)?"":String(e.text_says).trim();
  if(!code&&!words)return '<p class="sd-conf-meta">The entry carries no wording for either side.</p>';
  var h='<div class="sd-conf-sides">';
  if(code)h+='<div class="sd-conf-side sd-conf-code"><span class="sd-conf-lab">The FAA\u2019s code says</span><p>'+sdEsc(code)+'</p></div>';
  if(words)h+='<div class="sd-conf-side sd-conf-words"><span class="sd-conf-lab">The mechanic wrote</span><p>'+sdEsc(words)+'</p></div>';
  return h+'</div>';
}
function sdConfEntry(e){
  var parts=[],v,hl=[],meta=[];
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
  v=(e.found_at==null)?"":String(e.found_at).trim();if(v)meta.push("found in: "+sdEsc(v));
  if(e.confirmed!=null&&e.confirmed!==""&&e.confirmed!==0&&e.confirmed!==false)meta.push("confirmed: "+sdEsc(String(e.confirmed)));
  if(e.disputed!=null&&e.disputed!==""&&e.disputed!==0&&e.disputed!==false)meta.push("disputed: "+sdEsc(String(e.disputed)));
  v=(e.source==null)?"":String(e.source).trim();if(v)meta.push("source: "+sdEsc(v));
  if(meta.length)parts.push('<p class="sd-conf-meta">'+meta.join(" \u00b7 ")+'</p>');
  return parts.join("");
}
/* sd-conf desk: the way in from the desk, placed with the reference
   material at the foot of the page, not with the panels that narrow to a
   selection. The lead line is the endpoint's own what_this_is; what it is
   not is printed under it; the coverage caveat sits beside the button. */
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
      if(!ev.target||ev.target.id!=="sd-conf-open")return;
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
function sdConfKey(ev){
  if(ev&&ev.key==="Escape"){
    var ov=byId("sd-conf-over");
    if(ov&&!ov.hidden)sdConfClose();
  }
}
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
    sig=SDCONF.fetched?(SDCONF.failed?"err":"n"+n):"pending";
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
/* sd-conf on the record: the case sheet itself. The entry is matched on the
   sheet's control number first, then on any record id in the sheet's text.
   The section sits beside the sheet, never inside the table, so the sheet
   keeps its seventeen rows including Part number. When the record has no
   entry, nothing about disagreements is written anywhere on the sheet. */
function sdConfForSheet(table){
  var ctl,txt,id;
  if(!SDCONF.fetched||SDCONF.failed||!SDCONF.entries.length)return null;
  ctl=sdFindControl(table);
  if(ctl&&SDCONF.map[ctl])return SDCONF.map[ctl];
  txt=table.textContent||"";
  if(!txt)return null;
  for(id in SDCONF.map){
    if(Object.prototype.hasOwnProperty.call(SDCONF.map,id)&&id.length>=7&&/\d/.test(id)&&txt.indexOf(id)>=0)return SDCONF.map[id];
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
      sec.setAttribute("aria-label","A disagreement is recorded on this record");
      table.parentNode.insertBefore(sec,table.nextSibling);
    }
    sec.setAttribute("data-sd-csig",sig);
    sec.innerHTML='<p class="sd-conf-sh">A disagreement is recorded on this record</p>'
      +sdConfEntry(e)
      +'<p class="sd-conf-und">The file does not say which side is right, and nothing here decides it.</p>';
  }
}

var queued=false;
function pass(){
  queued=false;
  try{if(window.rrTail!==sdRrTail)window.rrTail=sdRrTail}catch(e){}
  try{sdEnsureGlobals()}catch(e){}
  try{sdConfFetch()}catch(e){}
  try{purgeLand()}catch(e){}
  try{ensureSentence()}catch(e){}
  try{ensureIpad()}catch(e){}
  try{seatCount()}catch(e){}
  try{retireStand()}catch(e){}
  try{ensureReading()}catch(e){}
  try{ensureNoRows()}catch(e){}
  try{stripInline()}catch(e){}
  try{secondLine()}catch(e){}
  try{tagTable()}catch(e){}
  try{sdPartRow()}catch(e){}
  try{sdMarkCells()}catch(e){}
  try{sdLocBar()}catch(e){}
  try{sdLocStep()}catch(e){}
  try{sdConfDesk()}catch(e){}
  try{sdConfStep()}catch(e){}
  try{sdMirror()}catch(e){}
  try{sdDossierKick()}catch(e){}
}
function kick(){if(queued)return;queued=true;requestAnimationFrame(pass)}
new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){pass();sdBootFromURL()});
else{pass();sdBootFromURL()}
addEventListener("load",pass);
addEventListener("resize",kick);
})();


/* ---- 42: one dialog, and a guard that survives re-parenting, written by the model ---- */
(function(){
  'use strict';
  if (window.__rrSheetRepair) { return; }
  window.__rrSheetRepair = true;

  var D = document;
  var bodyEl = D.body;
  var sheetState = false;   /* our own view of open or closed */
  var openerEl = null;      /* element focus returns to on close */
  var lastOver = 0;

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
    'select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],' +
    '[tabindex]:not([tabindex="-1"])';

  var DUP_IDS = ['iAim', 'tip'];

  function byId(id){ return D.getElementById(id); }

  /* Re-query the live nodes every time. The captured caseBox reference went
     stale when a later block re-parented #case-box into #case-wrap, which is
     why the old identity test marked the sheet's own container. */
  function sheetNodes(){
    return { wrap: byId('case-wrap'), box: byId('case-box') };
  }

  function inSheet(el, s){
    if (!el || el.nodeType !== 1) { return false; }
    s = s || sheetNodes();
    if (s.box && (el === s.box || s.box.contains(el))) { return true; }
    if (s.wrap && (el === s.wrap || s.wrap.contains(el))) { return true; }
    return false;
  }

  function isOpen(s){
    s = s || sheetNodes();
    if (!s.box) { return false; }
    var cs;
    try { cs = window.getComputedStyle(s.box); } catch (e) { return false; }
    if (!cs || cs.display === 'none' || cs.visibility === 'hidden') { return false; }
    var r = s.box.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /* The repair the page never had. Idempotent, runs on every open and on a
     guard interval. Clears BOTH attributes the page sets, never both ways:
     anything that holds the sheet (ancestor, the wrap, the box, or a stray
     marked node inside the sheet) is released. MAIN.wrap does not contain
     the sheet, so it is never touched here and stays inert and aria-hidden
     while the sheet is open. Decorative aria-hidden inside the sheet is
     left alone. */
  function sweep(){
    var s = sheetNodes();
    if (!s.box && !s.wrap) { return; }
    var marked = D.querySelectorAll('[inert],[aria-hidden="true"],[data-rr-inert]');
    Array.prototype.forEach.call(marked, function(el){
      var selfSheet = (s.box && el === s.box) || (s.wrap && el === s.wrap);
      var descendant = (s.box && el !== s.box && s.box.contains(el)) ||
                       (s.wrap && el !== s.wrap && s.wrap.contains(el));
      var ancestor = (s.box && el.contains(s.box)) || (s.wrap && el.contains(s.wrap));
      if (!selfSheet && !descendant && !ancestor) { return; }
      if (el.hasAttribute('inert')) {
        el.removeAttribute('inert');
        try { el.inert = false; } catch (e) {}
      }
      if (!descendant && el.getAttribute('aria-hidden') === 'true') {
        el.removeAttribute('aria-hidden');
      }
      if (el.hasAttribute('data-rr-inert')) { el.removeAttribute('data-rr-inert'); }
    });
  }

  function lockScroll(on){
    try {
      if (on) { bodyEl.classList.add('rr-sheet-lock'); }
      else { bodyEl.classList.remove('rr-sheet-lock'); }
    } catch (e) {}
  }

  function focusIn(s){
    if (!s || !s.box) { return; }
    var f = null;
    try { f = s.box.querySelector(FOCUSABLE); } catch (e) { f = null; }
    if (!f) {
      if (!s.box.hasAttribute('tabindex')) { s.box.setAttribute('tabindex', '-1'); }
      f = s.box;
    }
    try { f.focus({ preventScroll: true }); }
    catch (e) { try { f.focus(); } catch (e2) {} }
  }

  /* Every id exactly once. Keep the copy the live sheet actually uses. */
  function dedupeIds(){
    for (var d = 0; d < DUP_IDS.length; d++) {
      var id = DUP_IDS[d];
      var all;
      try { all = D.querySelectorAll('[id="' + id + '"]'); } catch (e) { continue; }
      if (!all || all.length < 2) { continue; }
      var s = sheetNodes();
      var keep = null;
      var i;
      if (s.wrap) {
        for (i = 0; i < all.length; i++) {
          if (all[i] === s.wrap || s.wrap.contains(all[i])) { keep = all[i]; break; }
        }
      }
      if (!keep && s.box) {
        for (i = 0; i < all.length; i++) {
          if (all[i] === s.box || s.box.contains(all[i])) { keep = all[i]; break; }
        }
      }
      if (!keep) { keep = all[0]; }
      for (i = 0; i < all.length; i++) {
        if (all[i] !== keep && all[i].parentNode) {
          try { all[i].parentNode.removeChild(all[i]); } catch (e) {}
        }
      }
    }
  }

  /* Hover layout shift: hold any element that grows on hover at its rest
     height, with overflow visible, so the revealed content overlays instead
     of pushing the page. Rest heights are recorded at boot, after load and
     after each open, and refreshed on unhover. */
  /* ---- hand edit, 30 August 2026, counted in MODEL_USE.md ----------------
     Removed here: a WeakMap of every element's resting height, a mouseover
     scan that pinned any element that had grown back to that height, and the
     recordRestAll() sweeps that fed it. It was the model's answer to "hovering
     must not shift the layout", and it treated every legitimate growth as a
     hover artefact: #hero-root was recorded at 0px mid-render, so after any
     search the instrument was pinned to 0px with its content still painting
     over the desk (the reading paragraph across the starter buttons), and the
     page shortened by 860px under a scrolled reader. The one element that
     really grows on hover, #aimLine, is held by a min-height in 49-hand.css.
     Everything below is the case-sheet repair and is unchanged. ------------ */
  /* Tab stays inside the sheet while it is open. Escape is the page's own
     document level capture listener and is left exactly as it is. */
  D.addEventListener('keydown', function(e){
    if (e.key !== 'Tab' && e.keyCode !== 9) { return; }
    var s = sheetNodes();
    if (!isOpen(s)) { return; }
    var list;
    try { list = s.box.querySelectorAll(FOCUSABLE); } catch (e2) { return; }
    if (!list.length) { e.preventDefault(); return; }
    var first = list[0];
    var last = list[list.length - 1];
    var ae = D.activeElement;
    if (!inSheet(ae, s)) {
      e.preventDefault();
      try { (e.shiftKey ? last : first).focus(); } catch (e3) {}
      return;
    }
    if (e.shiftKey && ae === first) {
      e.preventDefault();
      try { last.focus(); } catch (e4) {}
    } else if (!e.shiftKey && ae === last) {
      e.preventDefault();
      try { first.focus(); } catch (e5) {}
    }
  }, true);

  /* Wheel over the sheet scrolls the sheet, never the page behind. */
  D.addEventListener('wheel', function(e){
    var s = sheetNodes();
    if (!isOpen(s)) { return; }
    var t = e.target;
    if (t && t.nodeType === 1 && inSheet(t, s)) { return; }
    e.preventDefault();
  }, { passive: false, capture: true });

  /* Remember what opened the sheet so focus can go home on close. */
  D.addEventListener('mousedown', function(e){
    var s = sheetNodes();
    if (inSheet(e.target, s)) { return; }
    var t = e.target;
    if (t && t.closest) {
      var c = t.closest('button,a,input,select,textarea,[role="button"],[tabindex]');
      if (c) { t = c; }
    }
    openerEl = t;
  }, true);

  /* Close must leave nothing behind: no inert, no aria-hidden, no marker. */
  function clearAllFlags(){
    var marked = D.querySelectorAll('[data-rr-inert]');
    Array.prototype.forEach.call(marked, function(el){
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('data-rr-inert');
      try { el.inert = false; } catch (e) {}
    });
    var rest = D.querySelectorAll('[inert]');
    Array.prototype.forEach.call(rest, function(el){
      el.removeAttribute('inert');
      try { el.inert = false; } catch (e) {}
    });
  }

  function onOpened(s){
    sweep();
    lockScroll(true);
    focusIn(s);
    setTimeout(dedupeIds, 80);
  }

  function onClosed(){
    lockScroll(false);
    clearAllFlags();
    var op = openerEl;
    openerEl = null;
    if (op && op.isConnected) {
      try { op.focus({ preventScroll: true }); }
      catch (e) { try { op.focus(); } catch (e2) {} }
    }
  }

  function pollState(){
    var s = sheetNodes();
    var o = false;
    try { o = isOpen(s); } catch (e) { return; }
    if (o && !sheetState) { sheetState = true; onOpened(s); }
    else if (o && sheetState) { sweep(); }
    else if (!o && sheetState) { sheetState = false; onClosed(); }
  }

  var mo = new MutationObserver(function(){
    try { pollState(); } catch (e) {}
  });

  function armObserver(){
    var s = sheetNodes();
    var opts = { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'inert', 'aria-hidden'] };
    if (s.box) { try { mo.observe(s.box, opts); } catch (e) {} }
    if (s.wrap && s.wrap !== s.box) { try { mo.observe(s.wrap, opts); } catch (e) {} }
  }

  /* Not a second dialog and not a third one. The page's own openCase stays
     the function the rows call; it is wrapped so the repair runs after it,
     on the same name resolution that made the page's version win. */
  function wrapOpenCase(){
    var prev = window.openCase;
    if (typeof prev !== 'function') { return; }
    var wrapped = function(){
      dedupeIds();
      var ae = D.activeElement;
      if (ae && ae !== bodyEl && !inSheet(ae)) { openerEl = ae; }
      var out;
      try { out = prev.apply(this, arguments); }
      catch (err) { try { pollState(); } catch (e) {} throw err; }
      try { pollState(); } catch (e) {}
      return out;
    };
    try { window.openCase = wrapped; } catch (e) {}
  }

  function boot(){
    dedupeIds();
    armObserver();
    wrapOpenCase();
    var s = sheetNodes();
    var already = false;
    try { already = isOpen(s); } catch (e) {}
    if (already) { sheetState = true; sweep(); lockScroll(true); }
    window.addEventListener('load', function(){
      setTimeout(dedupeIds, 150);
    });
    /* Guard interval: re-runs the sweep while open, in case the page marks
       again through any path, and catches opens and closes that bypass
       both the wrapper and the observer. */
    setInterval(function(){
      try { pollState(); } catch (e) {}
    }, 500);
  }

  boot();
})();

/* ---- 43: the drift, and the names it owns, written by the model ---- */
/* block 44 script, replacing 43-dom.js whole.
   Jobs:
   1. exactly one #iAim, enforced at every write channel, emitter named in console
   2. every :hover rule in the page's own stylesheets loses layout changing
      declarations and keeps color, shadow and transform
   3. the standalone back to the instrument control gets a 24px tap target
   4. a repeat row with no hours figure carries the file's own reason instead
      of the bare phrase, taken from the note the repeats view now sends with
      every blank, and the two causes keep their two different sentences
   5. the standing sentence's number, [data-gtotal] inside the group whose id
      is ignore, always shows the whole file's count and never the selection's,
      filled in from CORPUS, d.corpus on the hero response or range.total from
      api/facets, repainted after every filter change, placeholder only until
      the count is known. Checked on /z/, /z/?operator=SWAA and
      /z/?take=zone|ZONE+700: all three read 1,757,827.
   Plus the root background is synced to the body's computed background. */

(function () {
  'use strict';

  var AIM = 'iAim';
  var TAP_TEXT = 'back to the instrument';

  /* ---------- 1. one aim line ---------- */

  function existingAim() {
    try { return document.getElementById(AIM); } catch (e) { return null; }
  }

  function logBlock(channel) {
    try {
      console.info('[iAim] a second #' + AIM + ' was refused at ' + channel +
        '. Emitting stack follows, it names the block that emits it:');
      console.info(new Error().stack || '(no stack)');
    } catch (e) {}
  }

  function stripId(el) {
    try { el.removeAttribute('id'); } catch (e) {}
  }

  /* strip a duplicate id from a node about to be inserted.
     isSuccessor: true when the node replaces the current copy. */
  function cleanNode(node, isSuccessor) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
    var ex = existingAim();
    if (!ex || isSuccessor || node === ex) return;
    if (node.nodeType === 1 && node.contains && node.contains(ex)) return;
    var dup = null;
    try {
      if (node.nodeType === 1 && node.id === AIM) dup = node;
      else if (node.querySelector) dup = node.querySelector('[id="' + AIM + '"]');
    } catch (e) { return; }
    if (dup) { stripId(dup); logBlock('node insert'); }
  }

  /* strip a duplicate id from an html string about to be written.
     destroys: true when the write clears the target's children. */
  function cleanHtml(target, html, destroys) {
    if (typeof html !== 'string' || html.indexOf(AIM) === -1) return html;
    var ex = existingAim();
    if (!ex) return html;
    if (destroys && target && (target === ex || (target.contains && target.contains(ex)))) {
      return html; /* the write destroys the current copy, the string carries the id */
    }
    var out = html.replace(/\s+id\s*=\s*(["'])iAim\1/gi, '')
                  .replace(/\s+id\s*=\s*iAim(?=[\s>])/gi, '');
    if (out !== html) logBlock(destroys ? 'innerHTML' : 'insertAdjacentHTML');
    return out;
  }

  /* the id property */
  try {
    var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
    if (idDesc && idDesc.configurable && idDesc.set) {
      Object.defineProperty(Element.prototype, 'id', {
        configurable: true,
        enumerable: idDesc.enumerable,
        get: function () { return idDesc.get.call(this); },
        set: function (v) {
          if (v === AIM && this.nodeType === 1) {
            var ex = existingAim();
            if (ex && ex !== this && !(this.contains && this.contains(ex))) {
              logBlock('id property'); return;
            }
          }
          idDesc.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  /* setAttribute */
  try {
    var setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      try {
        if (String(name).toLowerCase() === 'id' &&
            String(value).toLowerCase() === AIM) {
          var ex = existingAim();
          if (ex && ex !== this && !(this.contains && this.contains(ex))) {
            logBlock('setAttribute'); return;
          }
        }
      } catch (e) {}
      return setAttr.call(this, name, value);
    };
  } catch (e) {}

  /* insertion channels */
  try {
    var ap = Node.prototype.appendChild;
    Node.prototype.appendChild = function (n) {
      try { cleanNode(n, false); } catch (e) {}
      return ap.apply(this, arguments);
    };
    var ib = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (n, ref) {
      try { cleanNode(n, false); } catch (e) {}
      return ib.apply(this, arguments);
    };
    var rc = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function (n, old) {
      var succ = false;
      try { succ = (old === existingAim()); } catch (e) {}
      try { cleanNode(n, succ); } catch (e) {}
      return rc.apply(this, arguments);
    };
  } catch (e) {}

  try {
    var appendM = Element.prototype.append;
    if (appendM) {
      Element.prototype.append = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return appendM.apply(this, arguments);
      };
    }
    var prependM = Element.prototype.prepend;
    if (prependM) {
      Element.prototype.prepend = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return prependM.apply(this, arguments);
      };
    }
    var iae = Element.prototype.insertAdjacentElement;
    if (iae) {
      Element.prototype.insertAdjacentElement = function (pos, el) {
        try { cleanNode(el, false); } catch (e) {}
        return iae.call(this, pos, el);
      };
    }
    var iah = Element.prototype.insertAdjacentHTML;
    if (iah) {
      Element.prototype.insertAdjacentHTML = function (pos, text) {
        try { if (arguments.length > 1) text = cleanHtml(this, text, false); } catch (e) {}
        return iah.call(this, pos, text);
      };
    }
  } catch (e) {}

  /* innerHTML */
  try {
    var ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (ih && ih.configurable && ih.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        enumerable: ih.enumerable,
        get: function () { return ih.get.call(this); },
        set: function (v) {
          try { if (typeof v === 'string') v = cleanHtml(this, v, true); } catch (e) {}
          ih.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  /* backstop: if two copies ever coexist, keep the one with content,
     else the first in document order, which is the one writes reach */
  function enforceAimOnce() {
    var list;
    try { list = document.querySelectorAll('[id="' + AIM + '"]'); } catch (e) { return; }
    if (!list || list.length < 2) return;
    var keep = null, i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].textContent || '').trim().length) { keep = list[i]; break; }
    }
    if (!keep) keep = list[0];
    for (i = 0; i < list.length; i++) {
      if (list[i] !== keep) stripId(list[i]);
    }
  }

  /* ---------- 2. no hover moves the page ---------- */

  var LAYOUT = {};
  ('width min-width max-width height min-height max-height ' +
   'margin margin-top margin-right margin-bottom margin-left ' +
   'padding padding-top padding-right padding-bottom padding-left ' +
   'font-size line-height letter-spacing word-spacing white-space text-indent ' +
   'display position top right bottom left inset float ' +
   'flex flex-basis flex-grow flex-shrink flex-direction flex-wrap flex-flow ' +
   'gap row-gap column-gap ' +
   'grid grid-template grid-template-areas grid-template-rows grid-template-columns ' +
   'grid-auto-rows grid-auto-columns grid-auto-flow ' +
   'columns column-width column-count ' +
   'vertical-align box-sizing zoom ' +
   'border border-width border-top border-right border-bottom border-left ' +
   'border-top-width border-right-width border-bottom-width border-left-width'
  ).split(/\s+/).forEach(function (p) { if (p) LAYOUT[p] = true; });

  var PROTECTED = ['case-wrap', 'case-box', 'rr-sheet-lock'];

  function keepBorderColor(style, prop) {
    var val = '';
    try { val = style.getPropertyValue(prop) || ''; } catch (e) {}
    var m = val.match(/#[0-9a-f]{3,8}\b|rgba?\([^\)]*\)|hsla?\([^\)]*\)/i);
    try {
      style.removeProperty(prop);
      if (m) {
        var target = 'border-color';
        var side = prop.toLowerCase().match(/^border-(top|right|bottom|left)/);
        if (side) target = 'border-' + side[1] + '-color';
        style.setProperty(target, m[0]);
      }
    } catch (e) {}
  }

  function scrubRule(rule) {
    var sel;
    try { sel = rule.selectorText || ''; } catch (e) { return; }
    if (!sel || sel.indexOf(':hover') === -1) return;
    var low = sel.toLowerCase(), i, p;
    for (i = 0; i < PROTECTED.length; i++) {
      if (low.indexOf(PROTECTED[i]) !== -1) return;
    }
    var parts = sel.split(',');
    for (i = 0; i < parts.length; i++) {
      p = parts[i].toLowerCase();
      if (p.indexOf(':hover') === -1) return;
      if (p.indexOf(':not(') !== -1 || p.indexOf(':is(') !== -1 ||
          p.indexOf(':where(') !== -1 || p.indexOf(':has(') !== -1 ||
          p.indexOf(':matches(') !== -1) return;
    }
    var props = [];
    try {
      for (i = 0; i < rule.style.length; i++) props.push(rule.style[i]);
    } catch (e) { return; }
    for (i = 0; i < props.length; i++) {
      var pl = props[i].toLowerCase();
      if (pl === 'border' || pl === 'border-width' ||
          /^border-(top|right|bottom|left)(-width)?$/.test(pl)) {
        keepBorderColor(rule.style, props[i]);
        continue;
      }
      if (LAYOUT[pl]) {
        try { rule.style.removeProperty(props[i]); } catch (e) {}
      }
    }
  }

  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      try {
        if (r.type === 1) {
          scrubRule(r);
          if (r.cssRules && r.cssRules.length) walk(r.cssRules);
        } else {
          if (r.cssRules && r.cssRules.length) walk(r.cssRules);
          if (r.styleSheet && r.styleSheet.cssRules) walk(r.styleSheet.cssRules);
        }
      } catch (e) {}
    }
  }

  function sweep() {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
        if (rules && rules.length) walk(rules);
      } catch (e) { /* cross origin sheet, leave it alone */ }
    }
  }

  /* ---------- 3. the standalone back link ---------- */

  function tapFix(scope) {
    var els;
    try { els = (scope || document).querySelectorAll('a, button, [role="button"]'); }
    catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      try {
        if (el.getAttribute('data-tap44') === '1') continue;
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (t.indexOf(TAP_TEXT) !== -1) {
          el.style.display = 'inline-block';
          el.style.minHeight = '24px';
          el.style.minWidth = '24px';
          el.style.boxSizing = 'border-box';
          el.style.verticalAlign = 'middle';
          el.setAttribute('data-tap44', '1');
        }
      } catch (e) {}
    }
  }

  /* ---------- 4. a reason on every repeat row that has no hours figure ---------- */

  var REPEATS_PATH = '/z/api/repeats/';
  var PHRASE = 'hours between first and last';
  var FLAG = 'data-hrs44';
  var REASON_DISAGREE = "the file's own hour readings do not agree";
  var REASON_NO_HOURS = 'the file records no airframe hours on one or more of these reports';
  var REASON_FALLBACK = 'the file does not provide the hours between these reports';

  var repeatGroups = [];

  function normTxt(s) {
    try { return String(s || '').replace(/\s+/g, ' ').toLowerCase(); }
    catch (e) { return ''; }
  }

  function shortReason(note) {
    var n = normTxt(note);
    if (n.indexOf('do not agree') !== -1) return REASON_DISAGREE;
    if (n.indexOf('does not record') !== -1) return REASON_NO_HOURS;
    return null;
  }

  function findGroup(rowText) {
    var t = normTxt(rowText);
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < repeatGroups.length; i++) {
        var g = repeatGroups[i];
        if (!g || g.hours_between != null || !g.note) continue;
        var sys = normTxt(g.system);
        if (sys && t.indexOf(sys) === -1) continue;
        if (g.times == null || t.indexOf(g.times + ' write-ups') === -1) continue;
        if (pass === 0) {
          var part = normTxt(g.part);
          if (part && t.indexOf(part) === -1) continue;
        }
        return g;
      }
    }
    return null;
  }

  function restoreFallback(row) {
    try {
      var w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, null, false);
      while (w.nextNode()) {
        var n = w.currentNode;
        if (n.nodeValue && n.nodeValue.indexOf(REASON_FALLBACK) !== -1) {
          n.nodeValue = n.nodeValue.split(REASON_FALLBACK).join(PHRASE);
        }
      }
    } catch (e) {}
  }

  function takeGroups(data) {
    try {
      if (!data || !data.groups || !data.groups.length) return;
      var added = false;
      for (var i = 0; i < data.groups.length; i++) {
        var g = data.groups[i];
        if (g && g.hours_between == null && g.note) {
          repeatGroups.push(g);
          added = true;
        }
      }
      if (!added) return;
      var stale = document.querySelectorAll('[' + FLAG + '="fallback"]');
      for (var j = 0; j < stale.length; j++) {
        restoreFallback(stale[j]);
        try { stale[j].removeAttribute(FLAG); } catch (e) {}
      }
      backstop();
    } catch (e) {}
  }

  function parseJson(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  /* read the notes however the page asks for them, and while the responses
     are already in hand, listen for the file's own count (job 5) */
  try {
    if (typeof window.fetch === 'function' && !window.__zRepeatHook) {
      var ofetch = window.fetch;
      window.fetch = function () {
        var url = '';
        try {
          var a0 = arguments[0];
          url = String(a0 && a0.url ? a0.url : a0);
        } catch (e) {}
        var p = ofetch.apply(this, arguments);
        try {
          if (p && typeof p.then === 'function') {
            p.then(function (res) {
              try {
                if (res && typeof res.clone === 'function') {
                  res.clone().json().then(function (d) {
                    takeGroups(d);
                    sniffCorpus(d, url);
                  }).catch(function () {});
                }
              } catch (e) {}
            }).catch(function () {});
          }
        } catch (e) {}
        return p;
      };
      window.__zRepeatHook = true;
    }
  } catch (e) {}

  try {
    if (!XMLHttpRequest.prototype.__zRepeatHook) {
      var xOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        var xhr = this;
        try {
          var u = String(url || '');
          if (u.indexOf(REPEATS_PATH) !== -1 || u.indexOf('/z/api/') !== -1) {
            xhr.addEventListener('load', function () {
              try {
                var d = parseJson(xhr.responseText);
                if (d) { takeGroups(d); sniffCorpus(d, u); }
              } catch (e) {}
            });
          }
        } catch (e) {}
        return xOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.__zRepeatHook = true;
    }
  } catch (e) {}

  function patchRows(scope) {
    var root = scope || document;
    var host = root;
    try { if (root.nodeType === 9) host = root.body || root.documentElement; } catch (e) {}
    if (!host) return;
    var hay = '';
    try { hay = host.textContent || ''; } catch (e) { return; }
    if (hay.indexOf(PHRASE) === -1) return;
    var walker;
    try {
      walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null, false);
    } catch (e) { return; }
    var hits = [];
    try {
      while (walker.nextNode()) {
        var n = walker.currentNode;
        if (n.nodeValue && n.nodeValue.indexOf(PHRASE) !== -1) hits.push(n);
      }
    } catch (e) { return; }
    for (var i = 0; i < hits.length; i++) fixHoursNode(hits[i]);
  }

  function fixHoursNode(node) {
    try {
      if (node.nodeValue.indexOf('cannot be shown') !== -1) return;
    } catch (e) { return; }
    var el = node.parentElement;
    if (!el) return;
    var row = el, up = 0;
    while (row && up < 8) {
      var txt = '';
      try { txt = row.textContent || ''; } catch (e) { txt = ''; }
      if (txt.indexOf('write-ups') !== -1) break;
      row = row.parentElement;
      up++;
    }
    if (!row) row = el;
    var flag = null;
    try { flag = row.getAttribute(FLAG); } catch (e) {}
    if (flag === 'note' || flag === 'num') return;
    var rowText = '';
    try { rowText = row.textContent || ''; } catch (e) { return; }
    var idx = rowText.indexOf(PHRASE);
    if (idx === -1) return;
    var before = rowText.slice(0, idx).replace(/[\s\u00b7]+$/, '');
    var lastTok = before ? before.split(/\s+/).pop() : '';
    if (/^[\d][\d,]*$/.test(lastTok)) {
      try { row.setAttribute(FLAG, 'num'); } catch (e) {}
      return;
    }
    var g = repeatGroups.length ? findGroup(rowText) : null;
    var reason = (g && g.note) ? shortReason(g.note) : null;
    if (!reason) reason = REASON_FALLBACK;
    try {
      node.nodeValue = node.nodeValue.split(PHRASE).join(reason);
      row.setAttribute(FLAG, g ? 'note' : 'fallback');
    } catch (e) {}
  }

  /* ---------- 5. the standing sentence's number is the file, not the selection ---------- */

  /* The label around the ignore group promises the panels answer from the whole
     file, so its figure must be the corpus. The page paints TOTAL there, which
     is the current selection, and leaves the ellipsis whenever that selection
     count is zero. This job owns the element instead: it takes the count only
     from sources that hold the whole file, CORPUS in the instrument's scope,
     d.corpus on the hero response, range.total from api/facets, and it rewrites
     the element after every repaint, placeholder until the count is known and
     the formatted count after, on every URL, filtered or not. */

  var GT_SEL = '[data-gtotal]';
  var GT_GROUP = 'ignore';
  var corpusN = null;

  function gtGood(v) {
    v = +v;
    return typeof v === 'number' && isFinite(v) && v > 0;
  }

  function gtFmt(n) {
    try {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch (e) { return String(n); }
  }

  function takeCorpus(v) {
    if (corpusN != null || !gtGood(v)) return;
    corpusN = Math.round(+v);
    writeGtotal();
  }

  /* only whole file fields, never a response's selection total */
  function sniffCorpus(data, url) {
    try {
      if (!data || typeof data !== 'object') return;
      if (gtGood(data.corpus)) { takeCorpus(data.corpus); return; }
      if (data.range && gtGood(data.range.total)) takeCorpus(data.range.total);
    } catch (e) {}
  }

  /* reach for the instrument's own scope, whatever it is willing to hand over.
     Bare typeof keeps an unset name from throwing, and the try around each
     read keeps a closure bound name from stopping the others. */
  function tryGlobals() {
    if (corpusN != null) return;
    try { if (typeof CORPUS !== 'undefined' && gtGood(CORPUS)) { takeCorpus(CORPUS); return; } } catch (e) {}
    try { if (typeof heroData !== 'undefined' && heroData && gtGood(heroData.corpus)) { takeCorpus(heroData.corpus); return; } } catch (e) {}
    try { if (typeof range !== 'undefined' && range && gtGood(range.total)) takeCorpus(range.total); } catch (e) {}
  }

  /* prefer the element inside the ignore group, else any [data-gtotal] */
  function gtotalEl() {
    var el = null;
    try {
      var grp = document.getElementById(GT_GROUP);
      if (grp) el = grp.querySelector(GT_SEL);
    } catch (e) {}
    if (!el) {
      try { el = document.querySelector(GT_SEL); } catch (e) { el = null; }
    }
    return el;
  }

  function writeGtotal() {
    if (corpusN == null) return;
    var txt = gtFmt(corpusN);
    var els = [];
    var main = gtotalEl();
    if (main) els.push(main);
    try {
      var all = document.querySelectorAll(GT_SEL);
      for (var i = 0; i < all.length; i++) {
        if (els.indexOf(all[i]) === -1) els.push(all[i]);
      }
    } catch (e) {}
    for (var j = 0; j < els.length; j++) {
      try {
        if ((els[j].textContent || '') !== txt) els[j].textContent = txt;
      } catch (e) {}
    }
  }

  /* the page repaints the label on every filter change; this runs after each
     repaint and puts the corpus back, so the sentence keeps its promise */
  var gtTries = 0;
  var gtTimer = null;
  function gtPoll() {
    tryGlobals();
    writeGtotal();
    if (corpusN != null && gtTimer != null) { clearInterval(gtTimer); gtTimer = null; return; }
    gtTries++;
    if (gtTimer == null) {
      gtTimer = setInterval(function () {
        tryGlobals();
        writeGtotal();
        if (corpusN != null || ++gtTries > 200) {
          if (gtTimer != null) { clearInterval(gtTimer); gtTimer = null; }
        }
      }, 100);
    }
  }

  /* ---------- background and scheduling ---------- */

  function syncBg() {
    try {
      var b = document.body;
      if (!b) return;
      var cs = getComputedStyle(b);
      var r = document.documentElement;
      r.style.backgroundColor = cs.backgroundColor;
      r.style.backgroundImage = cs.backgroundImage;
      r.style.backgroundRepeat = cs.backgroundRepeat;
      r.style.backgroundPosition = cs.backgroundPosition;
      r.style.backgroundSize = cs.backgroundSize;
      r.style.backgroundAttachment = cs.backgroundAttachment;
    } catch (e) {}
  }

  var busy = 0;
  function backstop() {
    if (busy) return;
    busy = 1;
    setTimeout(function () {
      busy = 0;
      try { enforceAimOnce(); } catch (e) {}
      try { sweep(); } catch (e) {}
      try { tapFix(document); } catch (e) {}
      try { patchRows(document); } catch (e) {}
      try { tryGlobals(); } catch (e) {}
      try { writeGtotal(); } catch (e) {}
      try { syncBg(); } catch (e) {}
    }, 80);
  }

  var mo = null;
  try {
    mo = new MutationObserver(function () { backstop(); });
  } catch (e) {}

  function start() {
    try { enforceAimOnce(); } catch (e) {}
    try { sweep(); } catch (e) {}
    try { tapFix(document); } catch (e) {}
    try { patchRows(document); } catch (e) {}
    try { gtPoll(); } catch (e) {}
    try { syncBg(); } catch (e) {}
    if (mo) {
      try {
        mo.observe(document.documentElement || document, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', backstop);
  setTimeout(backstop, 400);
  setTimeout(backstop, 1200);
})();

/* ---- 47: HAND-WRITTEN. one empty state, one count. see MODEL_USE.md, written by the model ---- */
/* ---- 47, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   Two faults Henk found by looking that 29 automated checks had missed, and
   that two model rounds (1,963s and 54,123 characters) did not land.

   1. Clicking a zone left "No rows yet, on purpose" on screen while the rows
      loaded beneath it, so nine working features read as dead. The desk's
      renderOnPurpose() gates on its own form filters; a selection taken from
      the instrument is not one of those, so the desk thought nothing was chosen.
      Rule: the empty state and a result count never share the screen.

   2. The airframe dossier answered from the tail's whole history, ignoring the
      zone and dates the instrument was honouring. On
      ?zone=ZONE+900&tail=928NN&from=2006-10-01&to=2006-10-31 the instrument said
      0 (correct: this airframe filed nothing before November 2016) and the
      dossier said 103, captioned "October 2006". Rule: one count per page. The
      dossier renders only when the tail is the whole selection, or the
      selection is non-empty; otherwise it stays out and the instrument's
      "nothing matches, drop one" is the page.
   ------------------------------------------------------------------------ */
(function(){
  "use strict";
  var D=document;
  function q(){ try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams("");} }
  var VIEW={hero:1,view:1,case:1,aircraft:1,ca:1,cb:1,cf:1};
  function filtersBesidesTail(){
    var n=0; q().forEach(function(v,k){ if(!VIEW[k]&&k!=="tail"&&v) n++; }); return n;
  }
  function shownCount(){
    var t=(D.body.innerText||"");
    var m=t.match(/([\d,]+) reports match your selection/)||t.match(/^\s*([\d,]+) reports,/m);
    return m?parseInt(m[1].replace(/,/g,""),10):null;
  }
  function pass(){
    var nr=D.getElementById("noRows");
    var n=shownCount();
    /* 1. never both */
    if(nr&&!nr.hidden&&n!==null&&n>0) nr.hidden=true;
    /* 2. one count per page */
    var doss=D.getElementById("sd-dossier");
    if(doss&&filtersBesidesTail()>0){
      var zero=(n===0)||/Nothing matches all of these at once/.test(D.body.innerText||"");
      doss.hidden=!!zero;
    }
  }
  var queued=false;
  function kick(){ if(queued)return; queued=true; requestAnimationFrame(function(){queued=false; try{pass()}catch(e){}}); }
  new MutationObserver(kick).observe(D.documentElement,{childList:true,subtree:true,characterData:true});
  if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",kick); else kick();
  addEventListener("load",kick);
  addEventListener("popstate",kick);
})();


/* ---- 48: HAND-WRITTEN. skip link, a month or year. see MODEL_USE.md, written by the model ---- */
/* ---- 48, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   Parity with the parent, measured across seven states after 47: every count
   agrees, every paging agrees. Two things the parent has that /z did not:

   1. "Skip to the results". The parent's first focusable element is
      <a class="skip" href="#results">. /z had none, so a keyboard or
      screen-reader user had four rails and twenty tabs between them and the
      records. Added, pointing at #rr-sec, the records section /z already has.

   2. AIM AT "a month or year". The parent's aim row takes "August 2019" or
      "2019"; /z's took only Airline / Airframe / Zone plus one day. A period
      typed by a reporter had nowhere to go. Added as the first option, resolving
      to from/to the way the parent does: a year to 1 Jan - 31 Dec, a month to its
      first and last day, both held inside the span the file covers so a period
      wholly outside returns nothing and says so rather than running backwards.
   ------------------------------------------------------------------------ */
(function(){
  "use strict";
  var D=document;

  /* 1. skip link ---------------------------------------------------------- */
  function skip(){
    if(D.querySelector('a.skip'))return;
    var target=D.getElementById('rr-sec')||D.getElementById('results');
    if(!target)return;
    if(!target.id)target.id='results';
    var a=D.createElement('a'); a.className='skip'; a.href='#'+target.id;
    a.textContent='Skip to the results';
    D.body.insertBefore(a, D.body.firstChild);
    if(!D.getElementById('skip-css')){
      var s=D.createElement('style'); s.id='skip-css';
      s.textContent='a.skip{position:absolute;left:-9999px;top:8px;z-index:200;background:#1d1d1f;color:#fff;'+
        'padding:8px 12px;font:600 12px Archivo,system-ui,sans-serif;border-radius:3px}'+
        'a.skip:focus{left:8px;outline:2px solid #c44b28;outline-offset:2px}';
      D.head.appendChild(s);
    }
  }

  /* 2. a month or a year ---------------------------------------------------- */
  var MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
  function pad(n){return String(n).padStart(2,'0');}
  function lastDay(y,m){return new Date(y,m,0).getDate();}
  /* "2019" | "2019-08" | "August 2019" | "aug 2019" | "August" (this year) -> [from,to] or null */
  function parsePeriod(v){
    v=String(v||'').trim().toLowerCase();
    var y,m,mm;
    if(/^\d{4}$/.test(v)){ y=+v; return [y+'-01-01', y+'-12-31']; }
    if((mm=v.match(/^(\d{4})-(\d{1,2})$/))){ y=+mm[1]; m=+mm[2]; }
    else if((mm=v.match(/^([a-z]+)\.?\s*(\d{4})?$/))){
      m=MONTHS[mm[1]]||MONTHS[mm[1].slice(0,3)]; if(!m)return null;
      y=mm[2]?+mm[2]:new Date().getFullYear();
    } else return null;
    if(m<1||m>12)return null;
    return [y+'-'+pad(m)+'-01', y+'-'+pad(m)+'-'+pad(lastDay(y,m))];
  }
  /* hold inside the file's span if the page states one, so a year in progress
     does not promise months that do not exist yet; leave a period wholly
     outside as asked, so it returns nothing rather than a backwards range */
  function clamp(lo,hi){
    var t=(D.body.innerText||'').match(/1 JAN (\d{4}) TO (\d{1,2}) ([A-Z]{3}) (\d{4})/i);
    if(!t)return [lo,hi];
    var fileLo=t[1]+'-01-01', fm=MONTHS[t[3].toLowerCase()], fileHi=t[4]+'-'+pad(fm)+'-'+pad(+t[2]);
    var clo=lo<fileLo?fileLo:lo, chi=hi>fileHi?fileHi:hi;
    return clo<=chi?[clo,chi]:[lo,hi];
  }
  function extendAim(){
    var box=D.querySelector('.rv-aim'); if(!box||box.dataset.period48)return;
    var sel=box.querySelector('select'), input=box.querySelector('input[type=text]'), take=box.querySelector('.rv-take');
    if(!sel||!input||!take)return;
    box.dataset.period48='1';
    var op=D.createElement('option'); op.value='period'; op.textContent='a month or year';
    sel.insertBefore(op, sel.firstChild); sel.value='period';
    var PH={period:'a month or a year, e.g. August or 2025', airline:'e.g. Southwest Airlines Co · SWAA',
            airframe:'a tail number, e.g. N583UP', zone:'a zone, e.g. 300 or landing gear'};
    function ph(){ input.placeholder=PH[sel.value]||''; }
    sel.addEventListener('change',ph); ph();
    /* run before the bridge's own click handler; if we took the period, stop it */
    take.addEventListener('click',function(e){
      if(sel.value!=='period')return;
      var v=input.value.trim(); if(!v)return;
      var r=parsePeriod(v);
      if(!r){ input.style.borderColor='#b8431f'; e.stopImmediatePropagation(); return; }
      r=clamp(r[0],r[1]);
      var u=new URL(location.href);
      u.searchParams.set('from',r[0]); u.searchParams.set('to',r[1]);
      e.stopImmediatePropagation();
      location.href=u.pathname+u.search;
    }, true);
  }

  var queued=false;
  function kick(){ if(queued)return; queued=true; requestAnimationFrame(function(){queued=false; try{skip();extendAim();}catch(e){}}); }
  new MutationObserver(kick).observe(D.documentElement,{childList:true,subtree:true});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',kick); else kick();
  addEventListener('load',kick);
})();


/* ---- 49: HAND-WRITTEN. starters reach the URL; no unasked scroll. see MODEL_USE.md, written by the model ---- */
/* ---- 49, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   Measured against the parent with real clicks, both sites, same day.

   1. The starter questions were dead on /z. Parent: clicking "Bird strikes"
      goes to ?q=bird, 2,715 reports. /z: nothing. starter() fills the form
      fields, then sdSearch() asks sd2HasFilter(), which reads params(), which
      on this page is the URL and not the form. The form was full, the URL was
      empty, and the desk decided nothing had been chosen. Every filter set by
      code rather than by typing into the URL took the same dead path. The
      parent writes the fields to the address bar first and searches from
      there. Now so does /z: the fields go through pushGo(), the page's own
      take-then-refresh path, so the URL is the state, as everywhere else.

   2. The page scrolled itself upward while a reader was reading. showChange()
      ends with c.scrollIntoView({block:"start"}) whenever the chips row is
      above the viewport, and it is called from sixteen places including
      every search re-render. A reader two screens down was pulled back to the
      chips on each refresh. The parent never scrolls a reader who did not ask.
      Removed: the chips update in place, the viewport stays where it was.
   ------------------------------------------------------------------------ */
(function(){
  "use strict";
  var FIELDS=["q","operator","make","model","part","ata","jasc","nature","crew","condition",
              "stage","zone","tail","discovered","corrosion","cracked","minhours","from","to"];
  function fieldsToParams(){
    var p=new URLSearchParams(location.search);
    FIELDS.forEach(function(k){
      var e=document.getElementById(k); if(!e) return;
      var v=(e.value||"").trim();
      if(v) p.set(k,v); else p.delete(k);
    });
    return p;
  }
  function go(){
    var p=fieldsToParams();
    if(typeof window.pushGo==="function"){ window.pushGo(p); return; }
    location.href=location.pathname+(p.toString()?"?"+p.toString():"");
  }
  /* 1. starters: after the page's own handler filled the fields, push them */
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest("#starters button, .starter button");
    if(!b||/showmore/.test(b.className)) return;
    setTimeout(go,0);
  },false);
  /* 2. no unasked scroll */
  var kill=function(){
    if(typeof window.showChange==="function"&&!window.showChange.__49){
      var orig=window.showChange;
      var quiet=function(){ try{ if(typeof buildChips==="function") buildChips(); }catch(_){} };
      quiet.__49=1; window.showChange=quiet;
    }
  };
  kill(); document.addEventListener("DOMContentLoaded",kill); addEventListener("load",kill);
})();


/* ---- 50: HAND-WRITTEN. AIM AT under the headline, as the parent. see MODEL_USE.md, written by the model ---- */
/* ---- 50, hand-written, 30 August 2026. See 50-hand.css for the why. ----
   Put the AIM AT row where the parent puts it: after the headline, before the
   instruction line. It is built at the foot of .ipad; this moves it. */
(function(){
  "use strict";
  function place(){
    var pad=document.querySelector('#hero .ipad')||document.querySelector('.ipad'); if(!pad)return;
    var w=pad.querySelector('.aimwrap'), c=pad.querySelector('#count'), h=pad.querySelector('.hand'); if(!w||!c)return;
    /* parent order inside .ipad: headline, aim row, instruction line, rails */
    if(c.nextElementSibling!==w) c.insertAdjacentElement('afterend',w);
    if(h&&w.nextElementSibling!==h) w.insertAdjacentElement('afterend',h);
  }
  var q=false; function kick(){ if(q)return; q=true; requestAnimationFrame(function(){q=false; try{place()}catch(e){}}); }
  new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kick); else kick();
  addEventListener('load',kick);
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

(function(){var s=document.createElement('style');s.id='sdr-css-41';s.textContent=`#sentence{display:none!important}
#sd-sink{display:none!important}
.card.land{display:none!important}
#vstrip.vgroups{display:flex;flex-direction:column;gap:1px;border-bottom:1px solid var(--line);padding:2px 0 3px;margin:8px 0 6px;min-width:0}
#vstrip.vgroups .vg{display:flex;flex-direction:row;align-items:center;gap:10px;min-width:0}
#vstrip.vgroups .vglab{flex:0 0 auto;font:600 9.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#57514a;text-transform:uppercase;white-space:nowrap}
#vstrip.vgroups .vgbtns{display:flex!important;flex-direction:row!important;gap:2px!important;align-items:center!important;flex-wrap:wrap!important;margin:0!important;padding:0!important;border-bottom:0!important;min-width:0;flex:1 1 auto}
button.vtab{padding:3px 8px;font-size:11.5px;line-height:1.2;border:1px solid transparent;border-radius:3px;background:none;color:#5c554c;cursor:pointer;white-space:nowrap}
button.vtab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0}
.sd-second{font-size:11.5px;color:#6b6560;margin:0 0 3px;text-align:center;letter-spacing:.02em}
.sd-second b{font-weight:600}
#hero.instrument{position:relative;background:var(--paper);border:1px solid var(--line);border-bottom:3px solid var(--rust);border-radius:6px;margin:12px 0 0;overflow:hidden;padding:0}
#hero.instrument > .ipad{padding:10px 20px 6px}
#count.sdcount{font-family:'Instrument Serif',Georgia,serif;font-size:30px;line-height:1.1;color:var(--ink);max-width:none;margin:4px 0 2px;white-space:normal}
#count.sdcount .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash)}
#count.sdcount .broken{display:block;font-size:.5em;color:var(--rust)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
.rail .reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);max-width:none}
.rail>.reading{grid-column:2}
@media(max-width:700px){.rail .reading{font-size:14px;padding:7px 10px}}
@media(min-width:901px){
#hero.instrument{max-width:1140px!important}
.rail{align-items:start;grid-template-columns:110px minmax(0,1fr)!important}
.rail .track{min-width:0;position:relative}
.rail .track.two{display:grid;grid-template-columns:minmax(0,628px) minmax(0,330px);gap:18px}
.rail .track.two > svg.plane{width:100%;max-width:640px;height:auto;display:block}
.rail .col .ch{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.rail .orow{display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;font-size:11.5px;height:14px;padding:0 3px;border-radius:3px}
.rail .orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:14px}
.rail .orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.rail .orow .ob i{display:block;height:100%;background:var(--rust)}
.rail .orow.wide{grid-template-columns:190px 1fr 56px;height:17px}
.rail .orow.wide .on{font-size:12px;line-height:17px}
.rail .fblock{height:22px}
.rail .frows{margin-top:4px}
.rail .fnote{font-size:11px;margin-top:3px}
.rail[data-rail=forced].open .fblock{margin-bottom:5px}
.rail .legend{font-size:11.5px;gap:0}
.rail .lrow{padding:0 4px;line-height:1.35}
.rail .zonenote{font-size:11px;line-height:1.4;margin-top:4px;padding-top:4px}
}
#hero .ipad .aimwrap{display:none}
#hero .ipad .rv-aim{margin-top:6px}
#hero .ipad .specimen{font-size:11px;line-height:1.35;padding-top:2px;padding-bottom:2px}
#hero .ipad .margin{font-size:10.5px;line-height:1.3;padding-top:2px;margin-top:3px}
#hero .ipad .rails{margin-top:6px}
#sdControls{gap:4px;margin-top:8px}
#sdControls .bar{gap:6px}
#sdControls .actions{padding:0}
#noRows{padding:8px 12px;margin-top:6px}
#noRows p{margin:3px 0}
#starterToggle{padding:3px 10px}
#rr-sec{margin:6px 0 0}
#rr-sec .cut{font-size:10.5px;line-height:1.25}
#rr-sec .rr-count{font-size:12px}
#rr-sec .rr-more{font-size:11px;padding:3px 10px}
/* sd-extras: blocks the original has no counterpart for, above the tabs */
#znarrow,.card.ask,#khint{display:none!important}
/* sd-credit: match the original's spacing and type */
.credit{font-size:12px;line-height:18.6px;margin:2px 0 10px;padding:0}
/* sd-wu: keep the gloss out of the clip; clip/fade like the original */
table.sdtable td{padding:5px 10px}
tr.wrote td{padding:0 0 14px}
.wu{position:relative}
.wu .wu-gloss{position:absolute;left:12px;bottom:0;height:auto;margin:0}
.wu:not(.clip){padding-bottom:34px}
.wu:not(.clip)::after{content:"none"}
.wu.clip{overflow:hidden;max-height:112px}
.wu.clip::after{content:"";position:absolute;left:0;right:0;bottom:0;height:16px;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,.92) 70%,#fff)}
/* sd-dossier: the aircraft dossier, in #p-aircraft */
#sd-dossier{max-width:1140px;margin:14px auto 0;padding:0 2px;font-size:14px;line-height:1.5}
#sd-dossier .sd-d-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;margin:2px 0 6px}
#sd-dossier .sd-d-tail{font-family:'Instrument Serif',Georgia,serif;font-size:30px;color:var(--ink)}
#sd-dossier .sd-d-make{font-size:12.5px;color:#6b6560}
#sd-dossier .sd-d-make b{font-weight:600;color:var(--ink)}
#sd-dossier .sd-d-count{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-sec{margin:12px 0 0;padding:10px 14px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
#sd-dossier .sd-d-sec h3{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--ash);margin:0 0 7px}
#sd-dossier .sd-d-sec h3.sd-mine{color:#7a5b00}
#sd-dossier .sd-d-frame{font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-dossier .sd-d-split{display:flex;gap:8px 18px;flex-wrap:wrap;margin:8px 0 0;padding:0;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#5c554c;list-style:none}
#sd-dossier .sd-d-split b{color:var(--ink);font-variant-numeric:tabular-nums}
#sd-dossier .sd-d-ops{font-size:12px;color:#6b6560;margin:7px 0 0}
#sd-dossier .sd-d-rpt{margin:7px 0 0;padding-left:10px;border-left:2px solid #e8e3d8;font-size:12.5px;color:#5c554c}
#sd-dossier .sd-d-rpt b{color:var(--ink)}
#sd-dossier .sd-d-hrs{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-quote{margin:5px 0 0;padding:0 0 0 8px;border-left:2px solid var(--line);font:11px/1.4 'IBM Plex Mono',ui-monospace,monospace;color:#7a746c}
#sd-dossier .sd-d-sum{font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
#sd-dossier .sd-d-note{font-size:11.5px;color:#7a5b00;margin:7px 0 0}
#sd-dossier .sd-d-lim{margin:0;padding-left:18px}
#sd-dossier .sd-d-lim li{margin:4px 0;font-size:13px;color:var(--ink)}
#sd-dossier .sd-d-cite{font-size:12px;color:#6b6560;margin:0;word-break:break-word}
#sd-dossier .sd-d-cite a{color:var(--rust-text,#b8431f)}
#sd-dossier .sd-d-btns{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
#sd-dossier .sd-d-none{font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);margin:0}
@media(max-width:700px){#sd-dossier .sd-d-tail{font-size:24px}#sd-dossier .sd-d-sec{padding:9px 10px}}
/* sd-dossier2: the operator and part dossiers share the same node; what the
   panel is holding is said in the kicker, and the second way in to a dossier
   from the table cells is a marker that leaves setFilter alone */
#sd-dossier .sd-d-kick{font:600 10px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);margin:0 0 7px}
#sd-dossier .sd-d-kick b{color:var(--rust-text,#b8431f)}
.sd-d-mark{display:inline-block;margin:0 0 0 6px;padding:2px 6px;font:600 9px/1 Archivo,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--rust-text,#b8431f);background:var(--card);border:1px solid var(--line);border-radius:3px;cursor:pointer;vertical-align:1px}
.sd-d-mark:hover{border-color:var(--rust-text,#b8431f);color:var(--ink)}
.sd-d-mark:focus-visible{outline:2px solid var(--rust-text,#b8431f);outline-offset:1px}
code.cd.sd-pnlink{cursor:pointer;border-bottom:1px dotted var(--rust-text,#b8431f)}
code.cd.sd-pnlink:hover{color:var(--rust-text,#b8431f)}
code.cd.sd-pnlink:focus-visible{outline:2px solid var(--rust-text,#b8431f);outline-offset:1px}
#sd-dossier .sd-d-bars{list-style:none;margin:8px 0 0;padding:0}
#sd-dossier .sd-d-bars li{display:grid;grid-template-columns:minmax(90px,190px) minmax(60px,1fr) 64px;gap:8px;align-items:center;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;height:17px}
#sd-dossier .sd-d-bars .sd-d-barlab{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#5c554c;text-align:right}
#sd-dossier .sd-d-bars .sd-d-bar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden;min-width:0}
#sd-dossier .sd-d-bars .sd-d-bar i{display:block;height:100%;background:var(--rust)}
#sd-dossier .sd-d-bars .sd-d-barnum{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
@media(max-width:700px){#sd-dossier .sd-d-bars li{grid-template-columns:minmax(64px,110px) minmax(40px,1fr) 52px;font-size:10.5px;height:16px}}
/* sd-locate: the model's reading of where the write-ups say the defect was.
   Amber, dashed and serif on purpose, so nothing here may be mistaken for
   the FAA's own zone codes in the row above. */
#sd-locbar{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin:10px 0 6px;padding:9px 12px;border:1px dashed #c9a24b;background:#fdfaf1;border-radius:4px}
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
/* sd-conf: records where the FAA's coded fields and the mechanic's own words
   do not agree. A reference block on the desk, beside the credit, an overlay
   carrying the entries, and a section a case sheet gains when its record has
   an entry. Both sides are always labelled with whose words they are, and
   nothing here decides which side is right. */
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
.sd-conf-x:focus-visible{outline:2px solid var(--rust-text,#b8431f);outline-offset:1px}
.sd-conf-sub{font-size:12px;line-height:1.5;color:#6b6560;margin:6px 0 0}
.sd-conf-und{font:italic 14px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);margin:10px 0 0}
.sd-conf-e{margin:12px 0 0;padding:10px 12px;border:1px solid var(--line);border-left:3px solid var(--rust);background:var(--card);border-radius:4px}
.sd-conf-e .sd-conf-sh{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7a5b00;margin:0 0 6px}
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
.sd-conf-e.sd-conf-sheet{margin:10px 0 0}
.sd-conf-list .sd-conf-e:last-child{margin-bottom:2px}
@media(max-width:700px){
.sd-conf-dlg{padding:12px 12px 14px}
.sd-conf-h{font-size:22px}
.sd-conf-side{flex-basis:100%}
.sd-conf-e{padding:9px 10px}
}
`;document.head.appendChild(s);})();

(function(){var s=document.createElement('style');s.id='sdr-css-43b';s.textContent=`/* ============================================================
   vstrip: label wrap + mobile stack, replaces the 43b block
   Selector weight: #vstrip.vgroups .vg .vglab is 1 id + 3
   classes, which beats the other block's 1 id + 2 classes,
   so no !important is needed anywhere in here.
   ============================================================ */

/* --- the strip itself never widens its parent --- */
#vstrip.vgroups {
  max-width: 100%;
  min-width: 0;
}

/* --- each group can shrink, children may wrap --- */
#vstrip.vgroups .vg {
  min-width: 0;
  max-width: 100%;
}

/* --- label: beats #vstrip.vgroups .vglab on specificity --- */
#vstrip.vgroups .vg .vglab {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 360px;
  white-space: normal;
  overflow-wrap: break-word;
  line-height: 1.2;
  align-self: center;
}

#vstrip.vgroups .vg .vglab b {
  font-weight: 700;
}

/* --- button row: shrinks first, wraps inside its own box --- */
#vstrip.vgroups .vg .vgbtns {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
  row-gap: 2px;
}

/* --- buttons keep 24px height, natural width, never clipped --- */
#vstrip.vgroups .vg .vgbtns .vtab {
  flex: 0 1 auto;
  min-width: 0;
  min-height: 24px;
  height: 24px;
  white-space: nowrap;
}

/* ============================================================
   Phone shape: below 768 the label sits above its buttons,
   the buttons wrap inside their own box, nothing leaves 390.
   768 and up keep the side by side row above, unchanged.
   ============================================================ */
@media (max-width: 767px) {
  #vstrip.vgroups .vg {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  #vstrip.vgroups .vg .vglab {
    max-width: none;
    width: auto;
    flex: 0 0 auto;
  }

  #vstrip.vgroups .vg .vgbtns {
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }

  #vstrip.vgroups .vg .vgbtns .vtab {
    flex: 1 1 auto;
    min-height: 24px;
    height: 24px;
  }
}`;document.head.appendChild(s);})();

(function(){var s=document.createElement('style');s.id='sdr-css-43a';s.textContent=`/* ==========================================================================
   z-built — the appearance block. Every selector below is declared here
   and nowhere else; shared values come from the tokens in :root.
   rebuild/splice_css.py fails the build if a second block sets one of
   these properties to a different value.
   ========================================================================== */

:root {
  /* surfaces and ink */
  --paper:  #f2eee6;
  --card:   #faf8f4;          /* .wu and resting tab fills */
  --ink:    #26231e;
  --ash:    #8b857a;          /* .muted, .absent, secondary text */
  --rust:   #b8431f;          /* the only accent: hover and focus */

  /* month bars: one colour, one opacity, both declared here and used once */
  --rest:   #d8d2c6;
  --bar-op: 1;

  /* type: the scale lives here and is restated nowhere */
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo,
          Consolas, monospace;
  --fs-10: 10.5px;
  --fs-11: 11px;
  --fs-12: 12px;
  --fs-13: 13px;
}

/* ---- base ----------------------------------------------------------------- */

html, body { background: var(--paper); }        /* same background, by token */

body {
  margin: 0;
  color: var(--ink);
  font: 400 var(--fs-13)/1.5 var(--sans);
  /* overflow on body belongs to rebuild/42-css.css — never set here */
}

/* ---- focus ring: declared exactly once ------------------------------------
   The WHEN rail (.mo) is a focusable control and gets the same ring as
   everything else. There is no \`outline: none\` anywhere in this block. */

:where(a, button, summary, input, select, textarea, .mo):focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 1px;
}

/* ---- shared small pieces --------------------------------------------------- */

.stamp  { font: 500 var(--fs-10)/1.5 var(--mono); letter-spacing: .02em;
          color: var(--ash); }
.mono   { font-family: var(--mono); }
.muted  { color: var(--ash); }
.absent { color: var(--ash); }
.wu     { background: var(--card); }

.picker button {
  box-sizing: border-box;
  min-height: 24px;
  font: 600 var(--fs-11)/1.2 var(--sans);
}

#tip {
  position: absolute;
  z-index: 10;
  max-width: 280px;
  padding: 4px 8px;
  background: var(--ink);
  color: var(--paper);
  font: 500 var(--fs-11)/1.4 var(--mono);
  border-radius: 3px;
  pointer-events: none;
}

/* ---- fault 1: the aim line moved the page ----------------------------------
   #aimLine is empty at rest, filled on hover, and used to grow, dragging
   .hand, .sdcount and everything below it down with it. Its height is now
   reserved whether or not it holds text: filling it changes words, never
   layout. Hovering a zone row, the drawing or a month bar moves nothing. */

.aim {
  min-height: 24px;
  display: flex;
  align-items: center;
  margin: 0;
  color: var(--ash);
  font: 400 var(--fs-12)/1.4 var(--sans);
}
.aim > * { margin: 0; }

.hand    { color: var(--ash); font: 400 var(--fs-12)/1.4 var(--sans); }
.sdcount { font: 600 var(--fs-13)/1.3 var(--sans); }

/* ---- fault 2: gutter numbers were ellipsised --------------------------------
   A count is never truncated: "54,634 aircraft" and "151,543 of
   1,757,827" print in full. The gutter yields width instead; the value
   may not be clipped. */

.gutter { flex: 0 0 auto; min-width: 136px; }   /* 136px > the 126px widest value */
.gv {
  min-width: max-content;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  color: var(--ink);
  font: 400 var(--fs-12)/1.5 var(--sans);
  font-variant-numeric: tabular-nums;
}

/* zone rows: a label and the number beside it are one row and one size.
   12px for both, from the token — not 15 and 11 — so "place named in
   words, not as a zone" sits on one line at 1440px. */
.zrow { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.zl, .zv { font: 500 var(--fs-12)/1.4 var(--sans); }
.zv { color: var(--ash); font-variant-numeric: tabular-nums; }

/* ---- fault 3: strip text was painted under the Fleet tab --------------------
   The label and the buttons are two columns that wrap; nothing here is
   positioned over anything else. At narrow widths the columns stack and
   the tabs wrap inside their own row — the page body never scrolls. */

.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  min-width: 0;
  max-width: 100%;
}
.strip .note { flex: 1 1 26em; min-width: 0; }
.strip .tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 0 0 auto;
  max-width: 100%;
}

/* pointer targets: 24px is the floor. Sixteen .vtab buttons go from
   21.8px to 24px; the strip stays well under 130px. */
.vtab {
  box-sizing: border-box;
  min-height: 24px;
  padding: 3px 10px;
  font: 500 var(--fs-11)/1.2 var(--sans);
}

/* links in running text ('SDR Desk lookup', 'Freefall: A Reckon…'):
   padding lifts the hit area to 24px and the negative margins hand it
   straight back, so the sentence's line box does not change. */
.prose a, .note a {
  display: inline-block;
  line-height: 1;
  padding: 5px 2px;
  margin: -5px -2px;
}

/* ---- WHEN rail ---------------------------------------------------------------
   The month strip scrolls inside the rail at narrow widths; it never
   widens the document. Each bar is one colour at one opacity, both from
   the tokens — not a colour from one block and an opacity from another. */

.rails { max-width: 100%; overflow-x: auto; }

.mo { flex: 0 0 3px; min-width: 0; }
.mo i {
  display: block;
  width: 2.56px;
  background: var(--rest);
  opacity: var(--bar-op);
}
.mo:hover i,
.mo:focus-visible i { background: var(--rust); }

/* ---- drawing ----------------------------------------------------------------- */

.drawing { max-width: 100%; }`;document.head.appendChild(s);})();

(function(){var s=document.createElement('style');s.id='sdr-css-42';s.textContent=`/* Repair block for the page's own dialog. Nothing here hides or restyles
   the sheet; it only makes the overlay the scroll container the gate
   measures and keeps the page behind still while the sheet is open. */

#case-wrap{
  overflow: auto;
  overscroll-behavior: contain;
  pointer-events: auto;
}

#case-box{
  max-height: none !important;
  overflow: visible !important;
  pointer-events: auto;
}

body.rr-sheet-lock{
  overflow: hidden !important;
}`;document.head.appendChild(s);})();

(function(){var s=document.createElement('style');s.id='sdr-css-49';s.textContent=`/* ---- 49, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   The parent's results bar is not sticky; only its table header is. Block 18
   made .cut position:sticky at top:0 with z-index 6, so on any scroll where the
   records section is in view the bar pinned to the viewport and painted across
   whatever sat above it in flow, including an open rail of the instrument. And
   #rr-sec was overflow:hidden, which is what let the bar clip. Both restored
   to what the parent does: the bar scrolls with its section. */
/* correction, same day: the parent's bar IS sticky (its own inline style
   block). What differed was #rr-sec{overflow:hidden}, which turns a sticky
   child into one that clips and hangs. Only the overflow is changed. */
#rr-sec{overflow:visible !important}
/* the one element that really grows on hover: reserve its height, as the
   parent does, instead of pinning the whole page (removed from 42-dom.js) */
#aimLine,.aim{min-height:3em}
`;document.head.appendChild(s);})();

(function(){var s=document.createElement('style');s.id='sdr-css-50';s.textContent=`/* ---- 50, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   Side by side with the parent at the same URL (?hero=anatomy there,
   ?hero=where here), three things the instrument drew differently:
   1. The parent's AIM AT row sits directly under the headline. Here the
      instrument builds the same row (.aimwrap) and then hides it with
      #hero .ipad .aimwrap{display:none}, leaving the reader a long scroll
      to the desk's copy. Shown, and moved up by 50-hand.js.
   2. The WHEN bars: parent rgb(216,210,198) at opacity 1. Here an inline
      rule painted them var(--rust) at .557 opacity, a dark smear that the
      headline then collided with. Parent's colour restored.
   3. The rail tabs: parent sets the label in Archivo and the subline in the
      system face; here both fell to monospace. Parent's faces restored. */
#hero .ipad .aimwrap{display:flex !important;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 2px}
.mo i{background:#d8d2c6 !important;opacity:1 !important}
.mo:hover i,.mo:focus-visible i,.mo.lit i{background:var(--rust) !important}
.picker .q{font:600 10.5px/1.1 Archivo,system-ui,sans-serif !important;letter-spacing:.1em}
.picker .pn{font:400 9.5px/1.2 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif !important;color:#5f584f}
/* the row's own parts, as the parent draws them: uppercase label, a plain
   ghost "Take it" (here it was ink on ink, an unreadable black block), and
   "OR ONE DAY" upright on the same line */
.aimwrap .aimbox{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.aimwrap label{font:600 10.5px/1 Archivo,system-ui,sans-serif !important;letter-spacing:.1em;text-transform:uppercase;color:var(--ash);font-style:normal !important}
.aimwrap button.aimgo{background:#fff !important;color:#1d1d1f !important;border:1px solid #1d1d1f !important;padding:6px 12px;font:500 13px/1 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;border-radius:3px;cursor:pointer}
.aimwrap label.aimday{display:inline-flex;align-items:center;gap:8px;font-style:normal !important}
.aimwrap input#iAimAt{min-width:30ch;padding:6px 9px;font:400 13px -apple-system,"Segoe UI",Roboto,sans-serif}
`;document.head.appendChild(s);})();
