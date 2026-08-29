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
    ".wu-gloss{margin-top:6px;font:inherit}" +
    ".wu-gloss button{background:none;border:1px solid #cfc6bd;border-radius:4px;" +
      "padding:2px 9px;font:12px/1.5 system-ui,sans-serif;color:#8a2a17;cursor:pointer}" +
    ".wu-gloss button:hover{background:#fdf1ec}" +
    ".wu-gloss button[disabled]{opacity:.55;cursor:default}" +
    ".wu-plain{margin-top:6px;padding:8px 11px;border-left:2px solid #c44b28;" +
      "background:#faf7f3;font:14.5px/1.5 Georgia,'Times New Roman',serif;color:#211d14;max-width:74ch}" +
    ".wu-plain .src{display:block;margin-top:5px;font:11.5px/1.4 system-ui,sans-serif;color:#756f69}";
  document.head.appendChild(css);

  function factsFor(wu){
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
      btn.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); askGloss(btn); });
      bar.appendChild(btn);
      wu.appendChild(bar);
    }
  }

  function askGloss(b){
    var wu = b.closest(".wu"); if (!wu) return;
    var txt = wu.querySelector(".txt");
    var raw = txt ? txt.innerText.replace(/\s+/g, " ").trim() : "";
    if (!raw) return;
    b.disabled = true; b.textContent = "Reading it…";
    var body = factsFor(wu); body.text = raw;
    fetch("api/gloss", {method:"POST", headers:{"Content-Type":"application/json"},
                        body: JSON.stringify(body)})
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
          out.textContent = "No plain-English reading came back"
            + (d && d.error ? " (" + d.error + ")." : ".");
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

  setInterval(addButtons, 700);
  addButtons();
})();
