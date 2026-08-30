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
