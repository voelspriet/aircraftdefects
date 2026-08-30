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
