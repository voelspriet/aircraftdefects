```html
<style id="fix-block-css">
  /* row: down from 99px to 66px */
  .rail .orow{ height:66px; min-height:66px; }

  /* specimen: no quotation marks, css-drawn or literal */
  .specimen, .specimen *{ quotes:none !important; }
  .specimen::before, .specimen::after,
  .specimen .sh::before, .specimen .sh::after,
  .specimen .spec-decoded::before, .specimen .spec-decoded::after,
  .specimen .spec-decoded *::before, .specimen .spec-decoded *::after{ content:none !important; }

  /* AIM AT box, top right of the instrument head */
  #hero .ihead{ position:relative; }
  #hero .ihead .aimat{
    position:absolute; right:0; bottom:-2px;
    display:flex; gap:8px; align-items:baseline;
    padding:3px 9px; border:1px solid currentColor;
    font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    letter-spacing:.06em; white-space:nowrap;
  }
  #hero .ihead .aimat b{ letter-spacing:.16em; }
  #hero .ihead .aimat span{ opacity:.7; }

  /* seam button under the hero */
  .seam-read{
    display:block; width:100%; box-sizing:border-box;
    margin:0; padding:9px 16px;
    border:0; border-top:1px solid currentColor; border-bottom:1px solid currentColor;
    background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer;
  }
  .seam-read:hover{ text-decoration:underline; }
</style>

<script id="fix-block-js">
(function(){
  var NAMES = {};   /* code -> clean name, harvested once, survives every redraw */
  var mo, timer;

  function $(s, r){ return (r || document).querySelector(s); }
  function $all(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---- 1. ladder names -------------------------------------------------
     The code is read from the row itself (data-take, then data-aim), never
     from text this block has already rewritten. The whole .on cell is
     written in one go, so a second pass is a no-op, not an append.       */
  function nameFor(row){
    var take = row.getAttribute('data-take') || row.getAttribute('data-aim') || '';
    var code = take.split('|')[1] || '';
    if(!code) return null;
    if(NAMES[code]) return { name: NAMES[code], code: code };
    var on = $('.on', row);
    var raw = on ? on.textContent : '';
    var i = raw.indexOf('(' + code + ')');
    /* cut at the first "(CODE)"; if the code is not parenthesised, collapse
       an exact repeat of a prefix (what earlier appends produced)          */
    var name = (i > -1 ? raw.slice(0, i + code.length + 2)
                       : raw.replace(/^(.+?)\1+/, '$1')).trim() || code;
    NAMES[code] = name;
    return { name: name, code: code };
  }

  function fixLadder(root){
    $all('.orow[data-take], .orow[data-aim]', root).forEach(function(row){
      var on = $('.on', row);
      if(!on) return;
      var n = nameFor(row);
      if(!n) return;
      var mark = n.name + '|' + n.code;
      if(on.getAttribute('data-block-named') === mark) return;   /* already exact */
      on.textContent = '';
      var ln = document.createElement('span'); ln.className = 'rv-lname'; ln.textContent = n.name;
      var lc = document.createElement('span'); lc.className = 'rv-lcode'; lc.textContent = n.code;
      on.appendChild(ln); on.appendChild(lc);
      on.setAttribute('data-block-named', mark);
    });
  }

  /* ---- 2. the sentence -------------------------------------------------
     Strip only a parenthetical that contains a digit; one without a digit,
     such as (SWAA), survives. Then lower-case the zone reference: a clause
     with no digits and no parentheses left, that is not a month, and that
     starts like a capitalised word (not an acronym), gets its first letter
     downcased.                                                            */
  var MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';

  function fixSentence(root){
    $all('.rv-sentence .rv-clause', root).forEach(function(b){
      var t = b.textContent;
      var s = t.replace(/\s*\(([^()]*\d[^()]*)\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if(!s) return;
      if(!/\d/.test(s) && !/\(/.test(s)
         && !new RegExp('^(' + MONTHS + ')\\b').test(s)
         && /^[A-Z][a-z]/.test(s)){
        s = s.charAt(0).toLowerCase() + s.slice(1);
      }
      if(s !== t) b.textContent = s;
    });
  }

  /* ---- 3. specimen: literal quotation marks off the decoded line ------- */
  function fixSpecimen(root){
    $all('.specimen .spec-decoded', root).forEach(function(el){
      var kids = [], n;
      for(n = el.firstChild; n; n = n.nextSibling) if(n.nodeType === 3 && n.nodeValue) kids.push(n);
      if(!kids.length) return;
      kids[0].nodeValue = kids[0].nodeValue.replace(/^\s*[“”"‘’]+/, '');
      kids[kids.length - 1].nodeValue = kids[kids.length - 1].nodeValue.replace(/[“”"‘’]+\s*$/, '');
    });
  }

  /* ---- 4. AIM AT box --------------------------------------------------- */
  function fixAimBox(){
    var head = $('#hero .ihead');
    if(!head) return;
    var box = $('.aimat', head);
    if(!box){
      box = document.createElement('div');
      box.className = 'aimat';
      head.appendChild(box);
    }
    var rail = $('.rail.open');
    var label = rail ? $('.gut b', rail) : null;
    var aims = [];
    if(rail) $all('.orow[data-aim]', rail).slice(0, 3).forEach(function(r){
      var a = (r.getAttribute('data-aim') || '').split('|');
      if(a[1]) aims.push(a[1]);
    });
    var txt = (label ? label.textContent : '') + (aims.length ? ' \u00b7 ' + aims.join(' \u00b7 ') : '');
    if(box.getAttribute('data-block-aim') === txt) return;
    box.setAttribute('data-block-aim', txt);
    box.textContent = '';
    var b = document.createElement('b'); b.textContent = 'AIM AT';
    var s = document.createElement('span'); s.textContent = txt;
    box.appendChild(b); box.appendChild(s);
  }

  /* ---- 5. seam button -------------------------------------------------- */
  function fixSeam(){
    var hero = $('#hero');
    if(!hero) return;
    var count = $('.rv-count', hero);
    var label = count ? count.textContent.replace(/\s*reports?\s*/i, '').trim() : '145';
    var want = 'Read the ' + label + ' \u2192';
    var btn = hero.nextElementSibling;
    if(btn && btn.classList && btn.classList.contains('seam-read')){
      if(btn.getAttribute('data-block-label') !== want){
        btn.setAttribute('data-block-label', want);
        btn.textContent = want;
      }
      return;
    }
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seam-read';
    btn.setAttribute('data-block-label', want);
    btn.textContent = want;
    btn.addEventListener('click', function(){
      var t = document.querySelector('table') || $('#p-leads');
      if(t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    hero.parentNode.insertBefore(btn, hero.nextSibling);
  }

  /* ---- runner ---------------------------------------------------------- */
  function pass(){
    fixLadder(document);
    fixSentence(document);
    fixSpecimen(document);
    fixAimBox();
    fixSeam();
  }
  function schedule(){ clearTimeout(timer); timer = setTimeout(pass, 50); }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ pass(); });
  } else {
    pass();
  }
  mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
```

**What changed**

1. **Ladder names.** The rewrite no longer looks at text at all. `nameFor` takes the code from the row's own `data-take` (falling back to `data-aim`), keeps a `code → name` map harvested once — from the first `“(CODE)”` occurrence, so even the already-tripled cell yields the clean string — and then writes the entire `.on` cell: one `.rv-lname`, one `.rv-lcode`. A `data-block-named` sentinel holding the exact result makes each repeat pass a no-op, and because the map is keyed by code it survives the instrument's redraws on filter change, rail switch and resize. Nothing appends; nothing reads what was previously written.

2. **Sentence clause.** Applied to `.rv-sentence .rv-clause` (real selector, from your DOM excerpt). The strip regex removes only a parenthetical containing a digit — so `(10,954)` goes and `(SWAA)` would stay anywhere it appeared. The zone is lower-cased on the first letter only, and only when the clause after stripping has no digits, no parentheses, is not a month, and reads as a capitalised word rather than an acronym — so "Left wing" → "left wing" while "December 2025" and anything like "SWAA" are untouched.

3. **The four landed pieces are back in the same block**, rebuilt against the selectors in your excerpt and none other: the AIM AT box (`.ihead`, fed from `.rail.open .gut b` and the rows' `data-aim` codes), the seam button (`.seam-read`, inserted as `#hero`'s next sibling, label re-read from `.rv-count`), the row at 66px (`.rail .orow`), and the specimen quote removal (CSS `quotes:none` plus `content:none` on the pseudo-elements, and a literal-quote trim on `.spec-decoded` text nodes only — the mechanic's writeup in `.wu` is never touched).

Every write is guarded by a diff or a sentinel, so the observer-driven re-runs converge instead of compounding, and the block sets its own `data-block-*` attributes rather than expecting any it did not create.