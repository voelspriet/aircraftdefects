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
