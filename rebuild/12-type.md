```html
<script>
(function () {
  'use strict';

  /* ---------- the CSS ---------- */
  var CSS = `
[data-fix="staande-zin"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:34px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:37px!important}
[data-fix="clausule"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:34px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:46px!important}
[data-fix="getal"]{font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace!important;font-size:31.28px!important;font-weight:500!important;color:rgb(184,67,31)!important}
[data-fix="aside"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:21.08px!important;font-weight:400!important;color:rgb(117,111,105)!important;line-height:28px!important}
[data-fix="railkiezer"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;height:42px!important;box-sizing:border-box!important}
[data-fix="tab"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(255,255,255)!important;height:36px!important;box-sizing:border-box!important}
[data-fix="aim-regel"]{display:block!important;font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace!important;font-size:13px!important;font-weight:400!important;color:rgb(184,67,31)!important;line-height:20px!important;min-height:20px!important}
[data-fix="handregel"]{display:block!important;font-family:Archivo,"Helvetica Neue",Arial,sans-serif!important;font-size:13px!important;font-weight:600!important;color:rgb(29,29,31)!important;line-height:18px!important}
[data-fix="gutter"],[data-fix="gutter-open"],[data-fix="gutter-dicht"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important}
[data-fix="gutter"][aria-expanded="true"],[data-fix="gutter-open"]{height:46px!important;box-sizing:border-box!important}
[data-fix="gutter"][aria-expanded="false"],[data-fix="gutter-dicht"]{height:16px!important;box-sizing:border-box!important}
[data-fix="ladderrij"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:11.5px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:14px!important}
[data-fix="leesalinea"]{font-family:Georgia,serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important}
[data-fix="marge"]{font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace!important;font-size:11.5px!important;font-weight:400!important;color:rgb(95,88,79)!important;line-height:15px!important;min-height:45px!important}
[data-fix="specimen"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:16px!important}
[data-fix="decodeerregel"]{color:rgb(184,67,31)!important}
[data-fix="recordrij"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:18px!important}
[data-fix="write-up"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;padding-top:0!important;padding-bottom:0!important}
`;

  /* ---------- binding: find each element by what it computes to right now ---------- */
  var K = 'data-fix';

  function cs(n){ return getComputedStyle(n); }
  function px(n){ return Math.round(n.getBoundingClientRect().height); }
  function tag(n, key){ if (n) n.setAttribute(K, key); }
  function fam(n, name){ return cs(n).fontFamily.indexOf(name) > -1; }

  function walk(fn){
    (function rec(n){
      for (; n; n = n.nextElementSibling){
        if (n.nodeType !== 1) continue;
        if (!n.hasAttribute(K)) fn(n);
        if (n.firstElementChild) rec(n.firstElementChild);
      }
    })(document.body);
  }

  function findIn(root, fn){
    var hit = null;
    (function rec(n){
      for (; n; n = n.nextElementSibling){
        if (n.nodeType !== 1) continue;
        if (!hit && fn(n)) hit = n;
        if (n.firstElementChild) rec(n.firstElementChild);
      }
    })(root.firstElementChild);
    return hit;
  }

  function init(){
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);

    /* -- the two 34px serif lines; the one holding the rust count is the sentence -- */
    var serif = [];
    walk(function (n){
      var c = cs(n);
      if (c.fontSize === '34px' && c.color === 'rgb(38, 34, 29)') serif.push(n);
    });
    var inner = serif.filter(function (n){
      return !serif.some(function (m){ return m !== n && n.contains(m); });
    });
    var wrapper = serif.find(function (n){
      return serif.some(function (m){ return m !== n && n.contains(m); });
    }) || null;

    var zin = null, claus = null, getal = null;
    inner.forEach(function (n){
      var count = findIn(n, function (m){ return cs(m).color === 'rgb(163, 64, 31)'; });
      if (count && !zin){ zin = n; getal = count; }
      else if (!zin) zin = n;
      else if (!claus) claus = n;
    });
    if (!claus && wrapper) claus = wrapper;
    tag(zin, 'staande-zin');
    tag(claus, 'clausule');
    tag(getal, 'getal');

    /* -- aside (pale Georgia 15) and reading paragraph (brown Georgia 15) -- */
    walk(function (n){
      var c = cs(n);
      if (fam(n, 'Georgia') && c.fontSize === '15px'){
        if (c.color === 'rgb(139, 133, 122)') tag(n, 'aside');
        else if (c.color === 'rgb(33, 29, 20)') tag(n, 'leesalinea');
      }
    });

    /* -- rail selector: a select if there is one -- */
    var rail = document.querySelector('select');
    if (!rail){
      walk(function (n){
        if (rail) return;
        var sig = (n.getAttribute('class') || '') + ' ' + (n.id || '');
        if (/rail|zone|kiezer|filter/i.test(sig) && cs(n).fontSize === '15px') rail = n;
      });
    }
    tag(rail, 'railkiezer');

    /* -- tab -- */
    var tab = document.querySelector('[class*="tab" i]');
    if (tab && cs(tab).fontSize !== '15px') tab = null;
    if (!tab){
      walk(function (n){
        if (tab) return;
        var c = cs(n);
        if (fam(n, 'Archivo') && c.fontSize === '15px' && px(n) > 30 && px(n) < 46) tab = n;
      });
    }
    tag(tab, 'tab');

    /* -- aim line: the only 13px Plex Mono on the page -- */
    walk(function (n){
      var c = cs(n);
      if (fam(n, 'IBM Plex Mono') && c.fontSize === '13px') tag(n, 'aim-regel');
    });

    /* -- ladder rows and margin note: the two 11.5px faces -- */
    walk(function (n){
      var c = cs(n);
      if (c.fontSize === '11.5px'){
        if (fam(n, 'IBM Plex Mono')) tag(n, 'marge');
        else if (fam(n, 'Archivo')) tag(n, 'ladderrij');
      }
    });

    /* -- specimen: the tall 15px Archivo block -- */
    var spec = null;
    walk(function (n){
      if (spec) return;
      var c = cs(n);
      if (fam(n, 'Archivo') && c.fontSize === '15px' && px(n) > 60) spec = n;
    });
    tag(spec, 'specimen');

    /* -- decode line -- */
    walk(function (n){
      var c = cs(n);
      if (fam(n, 'Archivo') && c.fontSize === '12.5px' && c.fontWeight == '600') tag(n, 'decodeerregel');
    });

    /* -- record rows: the only 13.5px system text -- */
    walk(function (n){
      var c = cs(n);
      if (c.fontSize === '13.5px' && /apple-system|BlinkMac/i.test(c.fontFamily)) tag(n, 'recordrij');
    });

    /* -- write-up: the only 13px system text in the brown ink -- */
    walk(function (n){
      var c = cs(n);
      if (c.fontSize === '13px' && c.color === 'rgb(61, 58, 51)') tag(n, 'write-up');
    });

    /* -- gutter: one toggle with aria-expanded, or two elements by height -- */
    var gut = [];
    walk(function (n){
      var sig = (n.getAttribute('class') || '') + ' ' + (n.id || '') + ' ' +
                (n.getAttribute('aria-controls') || '');
      if (n.hasAttribute('aria-expanded') || /gutter|rail-toggle|collapse/i.test(sig)){
        var c = cs(n);
        if (c.fontSize === '15px' && /apple-system|BlinkMac|Archivo/i.test(c.fontFamily)) gut.push(n);
      }
    });
    gut.forEach(function (n){
      if (n.hasAttribute('aria-expanded')) tag(n, 'gutter');
      else tag(n, px(n) > 40 ? 'gutter-open' : 'gutter-dicht');
    });

    /* -- the hand line: produced, not restyled -- */
    if (!document.querySelector('[data-fix="handregel"]')){
      var hand = document.createElement('span');
      hand.setAttribute(K, 'handregel');
      hand.textContent = 'Click an airline or an airframe to follow it.';
      var aim = document.querySelector('[data-fix="aim-regel"]');
      if (aim) aim.insertAdjacentElement('afterend', hand);
      else if (rail) rail.insertAdjacentElement('afterend', hand);
      else document.body.appendChild(hand);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
```

**Departures**

- **The styling is all CSS; the JavaScript only binds and produces.** I don't have the page's markup, so the script tags each element with a `data-fix` hook by what it currently computes to (the clone's wrong values are distinctive enough to match on), and the CSS keys off those hooks. If the page has stable selectors, replace the binder with them and keep the CSS verbatim. `!important` is used throughout so the corrections beat the rebuild's existing rules.
- **Fonts are named, not loaded.** Instrument Serif is only named in `font-family`, per your own finding that the link is already there. IBM Plex Mono and Archivo are demonstrably loaded already (the aim line and decode line render in them).
- **Line-heights are derived, not copied.** 37/46/41/28/20/18/15/16/18 come from dividing each measured height by its font size. The count's 41px needs no line-height at all — as an inline figure its box height follows from Plex Mono's metrics at 31.28px, so only the face, size, weight and colour are set.
- **The control heights (42/36/46/16) are set as box heights** assuming border-box; the clone's +2/+3px on those read as border or padding, not type.
- **Write-up:** the 6px delta is treated as vertical padding and zeroed. If it is line-height instead, swap `padding-top/bottom:0` for `line-height:14px`.
- **Record rows:** 13.5→13px plus `line-height:18px` assumes four wrapped rows (4×18 = 72).
- **Specimen:** fixed by `line-height:16px` rather than a fixed height, so nothing can be clipped — the page cannot lose words this way.
- **Margin note:** the missing note's wording is not in evidence anywhere you gave me, and I was told not to invent figures or wording. I set the 15px rhythm and reserved the 45px with `min-height`. Drop the note's text in and the min-height can go.
- **Aim line:** forced visible (`display:block`, 20px). If the clone's aim line measures 0 because it is *empty* rather than collapsed, its wording has to come from the source — I did not fabricate it.
- **Hand line:** produced with exactly the sentence you quoted, inserted after the aim line (fallback: after the rail selector). If it belongs elsewhere on the instrument, move the insertion point; the styling is already keyed to the hook.
- **White on the tab** is not in the palette list you gave, but it is what the original itself computes, so it is used as measured. No other colour appears that is not in the original's measured set.
- **The two serif lines are told apart by which one contains the rust count.** If the sentence is nested inside the clause rather than sitting beside it, the outer element is taken as the clause.