/* z-built — page block. Runs before the instrument script wires anything. */

(function () {
  'use strict';

  /* One #iAim, not two.
     The emit-site fix is to stop the strip builder from rendering its
     empty second <span id="iAim">; that is the change to make in the
     template, and this block is the guard until it lands. It runs first,
     before anything can resolve the id: the aim line keeps the node it
     writes into, the redundant node loses only its id (not its content),
     and nothing ever resolves a second #iAim — so no listener is left
     holding null. */
  var aims = document.querySelectorAll('#iAim');
  if (aims.length > 1) {
    var keep =
      document.querySelector('.aim #iAim') ||
      document.querySelector('#aimLine #iAim') ||
      aims[0];
    for (var i = 0; i < aims.length; i++) {
      if (aims[i] !== keep) aims[i].removeAttribute('id');
    }
  }
})();