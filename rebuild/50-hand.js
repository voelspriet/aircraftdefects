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
