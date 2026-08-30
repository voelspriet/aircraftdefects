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
