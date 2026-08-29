The user wants CSS to fix 17 measured elements to match the original. They want one block of CSS inside an IIFE (JavaScript only where something must be produced). But we don't have the original HTML. This is a classic "blind rebuild" prompt — we must produce CSS that targets elements by plausible selectors, and explain departures.

Given no HTML provided, I have to write CSS with reasonable selectors matching described roles: standing sentence (staande zin), clause (clausule), count (getal), aside, rail selector (railkiezer), tab, aim line (aim-regel), hand line (handregel), gutter open/closed, ladder row (ladderrij), reading paragraph (leesalinea), margin note (marge), specimen, decode line (decodeerregel), record row (recordrij), write-up.

The best approach: write a robust CSS block that uses data attributes / classes with fallbacks, plus a JS snippet that finds elements heuristically by text content and applies the styles — since we don't know the actual selectors. The prompt says "JavaScript only where something has to be produced rather than restyled" — the missing hand line has to be produced (it's missing entirely: "handregel | Archivo 13px/600 ... | - ≠"). So JS produces the hand line. Also the missing note in the margin ("a note is missing from it") — the marge height 45 vs 27 because a note is missing. But "do not change any wording, any figure" — we can't invent wording. Hmm, the missing margin note: we don't know its text. Careful: we should not fabricate. Maybe the JS should clone text? Actually we can't know. The instruction "do not change any wording, any figure" — producing the hand line means adding wording "Click an airline or an airframe to follow it." which the user themselves quoted. So that's sanctioned. The margin note's wording is unknown — I should flag this as a departure: I can restore the height but not the missing note's text; I'll note it.

Actually maybe better: since selectors are unknown, use JavaScript to locate elements by their current computed characteristics (text content patterns) and apply inline styles. That's defensible and works without knowing the markup. But the user said "It drops into the page inside its IIFE" — so a self-executing function.

Plan: IIFE that:
1. Injects a <style> with classes, and JS walks the DOM matching elements by text/structure, assigns classes.

Given the ambiguity, I'll write a hybrid: a style block with the target values defined via CSS custom properties, and a matcher that tags elements.

Let me define targets per element:

Original computed styles:

1. staande zin (standing sentence): Instrument Serif 34px/400 rgb(29,29,31) h=37. Height 37 for 34px font: line-height ~1.09? 34*1.09=37.06. So line-height ~37px (maybe 1.1 → 37.4, computed h=37... use line-height: 1.09 or 37px). Use line-height: 37px? Computed height 37 suggests line-height ≈ 37.06 → 34 * 1.09. Set line-height: 1.09.

2. clausule: same font, h=46. 46/34 = 1.353 → line-height 1.35 or 46px. Use 46px? Probably line-height ~1.35.

3. getal (number inside sentence): IBM Plex Mono 31.28px/500, rgb(184,67,31), h=41. 31.28px — that's 34 * 0.92? 34*0.92=31.28. Yes! So font-size: 0.92em within the 34px context, or 31.28px. line-height 41/31.28 = 1.31. Weight 500. Color rust text rgb(184,67,31) = #b8431f actually 184,67,31 = #B8431F. Palette says rust #c44b28, rust text rgb(184,67,31). Use rgb(184,67,31).

IBM Plex Mono must be loaded — the page requests Instrument Serif already; IBM Plex Mono appears in original's aim-regel and marge, so it's presumably available. But the clone's getal fell back to Georgia, meaning IBM Plex Mono wasn't applied there — maybe not loaded in the clone. Need to ensure the font is requested. The aim-regel in the clone already shows IBM Plex Mono 13px, so the face is loaded. Good — just apply font-family.

4. aside: Instrument Serif 21.08px/400 rgb(117,111,105) h=28. 21.08 = 34 * 0.62? = 21.08. Yes 0.62em. line-height 28/21.08 = 1.328 ≈ 1.33. Color ash rgb(117,111,105).

5. railkiezer (rail selector): -apple-system 15px/400 rgb(29,29,31) h=42. line-height 42px? or padding. h=42 for 15px — likely line-height ~2.8 or fixed height. Hard to know; height includes padding. I'll set font-family: -apple-system, ...; color ink; and height 42px? Computed height h=42 — could be line-height 42px or box height. Safer: set line-height via height: 42px? If it's a button with padding, computed height 42. I'll set explicit height where box-like: railkiezer 42px, tab 36px, gutter open 46px, gutter closed 16px, ladder row 14px, leesalinea 61px, specimen 88px? Wait specimen original h=64, clone h=88 — we must match original: 64. recordrij original 72, clone 66 → 72. write-up 56 vs 62 → 56.

Heights like leesalinea h=61 at Georgia 15px — that's multi-line? 61px could be one line at line-height 4? No — leesalinea (reading paragraph) 15px h=61: could be line-height 20.33 × 3 lines = 61. But "do not change layout" — height comes from content. Hmm, the clone already has h=61 for leesalinea; only font-family and color differ. So don't force heights where clone already matches — the mismatch is in font/color mostly. Only fix heights where they differ:

- staande zin: 37 vs 44 → fix via line-height 1.09 (34px Georgia at 44 → line-height 1.29). Setting line-height 37px gives 37.
- clausule: 46 vs 44 → line-height 46px.
- getal: 41 vs 38 → with 31.28px font, line-height 41px.
- aside: 28 vs 17 → 21.08px font with line-height 28px? 28/21.08=1.33.
- railkiezer: 42 vs 44 → set height 42px? It's a select probably. Set line-height? Could be padding. Safer: height: 42px (box-sizing border-box). Hmm risky. Alternatively line-height: 42px if single line. I'll set both? No. I'll set height where it's a control and line-height for text rows. I'll just set explicit height and note it.
- tab: 36 vs 38 → height 36px, and color rgb(255,255,255)! Tab is white text in original — tab has dark background presumably. Clone has rgb(33,29,20). Set color: #fff.
- aim-regel: IBM Plex Mono 13px/400 rust, h=20 vs clone h=0 (display issue? h=0 means element collapsed — maybe hidden). Need to ensure it's visible: display block, height 20px via line-height 20px. The clone h=0 suggests display:none or empty. JS may need to unhide.
- handregel: missing entirely — produce with JS: text "Click an airline or an airframe to follow it." Archivo 13px/600 rgb(29,29,31) h=18 → line-height 18px.
- gutter open: 46 vs 49 → height 46px.
- gutter closed: 16 vs 16 ✓ but font/color differ → font-family system, color ink.
- ladderrij: 14 vs 14 ✓; font/color.
- leesalinea: Georgia already ✓; color ink rgb(29,29,31) vs clone rgb(33,29,20).
- marge: IBM Plex Mono 11.5px/400 rgb(95,88,79) h=45 vs clone 27. Smoke color. Height 45 "because a note is missing from it". We can't produce the note's wording — but maybe the note exists in the original with text we don't know. Departure: restore font/color and set min-height 45px, note that the missing note's wording can't be reproduced without the source text. Actually the user says "JavaScript only where something has to be produced" — the note is produced content whose text I don't have. I'll set min-height and flag.

Hmm, but "do not change any wording" — could the note be a duplicate of existing text? Unknown. Flag as departure.

- specimen: -apple-system 15px/400 ink h=64 vs clone 88. Set height 64px (with overflow hidden? changing layout...). The clone's taller height might come from different line-height. 64/15 = 4.27 lines? Or padding. I'll set height: 64px and note. Or line-height reduce. Safer: set explicit height and explain.
- decodeerregel: Archivo 12.5px/600 — color rust rgb(184,67,31) vs clone rgb(143,53,23). Fix color only.
- recordrij: -apple-system 13px/400 ink h=72 vs clone 13.5px h=66. Fix font-size 13px, line-height to reach 72 (72/13=5.54 lines... multi-row). Set font-size and min-height 72? Hmm. Setting line-height could break multi-line rows. I'll set font-size: 13px and line-height such that total 72? Risky. Set min-height: 72px? Actually height comes from content; clone content presumably same wording, so height diff due to font-size 13.5→13 and line-height. I'll set font-size 13px and line-height 18px (13*1.385... if 4 rows ×18 = 72). Clone: 66 at 13.5 → 4 rows × 16.5 = line-height 1.22. So set line-height 1.385? Or just set font-size and line-height: 18px with note. Hmm, I'll set font-size:13px and leave line-height but then height might be 66*(13/13.5)=63.6. Not 72. Set line-height: 18px assuming 4 rows. I'll note the assumption.
- write-up: -apple-system 13px ink h=56 vs clone h=62. Clone has same 13px; height differs via line-height/padding. 56 vs 62. Maybe line-height: 14px × 4 = 56. Clone 62 could be padding 3px×2 + 56. Set line-height: 14px? Unknown rows. Alternatively set height: 56px. I'll set line-height 1.077? Eh. I'll set padding adjustments? Simplest deterministic: height: 56px with overflow visible, note it. Hmm, forcing height on paragraphs risks clipping. I'll use max-height? No.

Given all uncertainty, honest approach: set font-family/size/weight/color precisely (those are unambiguous), set line-heights computed from h/font-size assuming the original uses a line-height ratio, and set explicit box heights only for controls. Explain assumptions in "departures" section.

Also ink vs clone colors: clone consistently rgb(33,29,20) for body text and rgb(38,34,29) for serif — suggests the clone's CSS uses different near-blacks. Override all to rgb(29,29,31).

Font stacks: -apple-system → font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif. Instrument Serif → "Instrument Serif", serif. Georgia stays. IBM Plex Mono → "IBM Plex Mono", monospace. Archivo → Archivo, sans-serif.

Now: identification. Without markup, JS heuristics: find elements by text content.

- staande zin: contains the count (a number) and is large serif currently Georgia 34px. Match: elements with computed font-size 34px and color rgb(38,34,29) — the two serif elements (staande zin and clausule). Distinguish: clausule h=46 vs 44 — in clone staande zin h=44, clausule h=44? Table: staande zin kloon h=44, clausule kloon h=46. Interesting — clone clausule is 46 (matching original clausule 46), clone staande zin 44 (original 37). Wait original clausule h=46, clone clausule h=46? Table says clausule kloon h=44... let me re-read:

| clausule | Instrument Serif 34px/400 rgb(29, 29, 31) h=46 | Georgia 34px/400 rgb(38, 34, 29) h=44 |

Yes clone 44. And staande zin clone 44 too. Both 44 in clone. Hmm then distinguishing: staande zin contains the getal (rust number in clone? clone getal is Georgia 34px rgb(163,64,31) — clone's number is rust-ish but wrong). So the standing sentence contains the number. Clausule — separate element also 34px serif.

Since both clone serif elements are 34px Georgia rgb(38,34,29) h=44, and I need different line-heights (37 vs 46), I must distinguish. Heuristic: the standing sentence contains the number element (the getal). So: among 34px serif elements, the one containing a rust/mono number → staande zin with line-height 37px; the other → clausule line-height 46px.

Alternatively I could avoid height manipulation: the original's differing heights might come purely from the fonts' intrinsic line boxes. Georgia vs Instrument Serif at same font-size, same line-height: normal line-height differs per font. Instrument Serif has small line-height (~1.09 default? Instrument Serif metrics: unitsPerEm 1000, ascent ~ 900?), Georgia default line-height ~1.136? Hmm. If the original CSS uses line-height: normal or a unitless value, then simply setting the correct font-family reproduces h naturally! Georgia at 34px normal ≈ 38.6... Actually Georgia normal line-height ~1.14 → 38.7, not 44. Clone 44 suggests line-height 1.29 (maybe 1.3 set explicitly). If original line-height were also 1.3, Instrument Serif 34 × 1.3 = 44.2 → 44, but original h=37. So original uses different line-height or line-height: normal. Instrument Serif normal line-height is about 1.09 (ascent+descent+gap / em). Yes Instrument Serif has tight metrics; normal ≈ 1.088 → 37px at 34px. And clone set line-height 1.3 explicitly? If original uses line-height normal and clone uses 1.3... but then clausule original 46 = 1.353. Hmm, maybe clausule has explicit line-height 1.35 in both, and staande zin uses normal in original (37) but clone's rule inherits 1.3.

This is unknowable. Pragmatic: set explicit line-heights: staande zin 37px, clausule 46px, and note.

Similarly getal h=41 in original at 31.28px → 1.31. Could be inherits from clausule 1.35? 31.28×1.35=42.2 → 42 not 41. Set explicit 41px.

aside 21.08px h=28 → 1.328. Set line-height 28px.

aim-regel 13px h=20 → 1.538 (maybe 1.54 or padding). Set line-height 20px and ensure display not none (clone h=0 → fix visibility: display:block).

handregel 13px h=18 → line-height 18px.

marge 11.5px h=45 — likely multi-line note. 45 = lines × lh. If lh 15px → 3 lines. Set line-height: 15px and min-height via content... The clone is 27 → maybe 2 lines? Set line-height 15px, color smoke. Note: missing note text unknown.

specimen 15px h=64: 64 = 4×16 (lh 16) or padding+lines. Clone 88 with same 15px → maybe clone lacks max-height. Set height: 64px? If specimen is a box showing a font specimen, explicit height plausible. I'll set line-height: 16px and max-height: 64px? Hmm "do not change layout" — forcing height changes layout only if it was wrong. I'll set height: 64px; overflow: hidden? overflow hidden could hide words → "page still reads the same words". Risky. Use max-height: 64px with overflow hidden and note. Or maybe the specimen's height diff is from line-height: clone 88/15... if same lines (4), clone lh=22, original lh=16. So set line-height: 16px and heights match naturally. That's safer — no clipping. I'll set line-height: 16px. But if it's 4 lines, words unchanged. Good.

recordrij: 13px h=72: 4 rows × 18. Clone 13.5px 66: 4×16.5. So set font-size 13px, line-height 18px. Reasonable.

write-up: 13px h=56 vs 62: 56 = 4×14 (lh 14, 1.077 — too tight) or 3.5... or padding: clone 62 = 56 + 3px padding ×2 → original has no padding. Set padding: 0 and line-height: 14px? If 4 lines of 14 = 56 with 13px font — tight but possible for system font (normal ~15.3). Alternatively 2 lines? Can't know lines. I'll set line-height: 14px... risky if it's fewer lines. Alternative: margin/padding removal: set margin:0; padding:0 and see. Ugh.

Given h=56 vs 62 diff of 6px: could be padding 3px→0, or margin. I'll set padding: 0; margin: 0; and note. If that yields 56 with same line-height (62-6=56 ✓ if clone lines sum to 56: clone 13px... clone is also 13px; if clone has padding 3px each side and content 56, original same content 56 no padding. That fits perfectly! Clone: 13px, h=62; original 13px h=56; diff exactly 6 = 2×3px padding. So set padding: 0 (or 0 3px?). I'll set padding-block: 0 and note assumption.

Similarly railkiezer 42 vs 44 (diff 2), tab 36 vs 38 (diff 2), gutter open 46 vs 49 (diff 3), recordrij differs by font-size too. These small diffs likely padding/border. For controls: railkiezer 44→42: maybe border 1px vs 2px? Set height: 42px box-sizing border-box. tab 38→36: height 36px + padding 0, color #fff. gutter open 49→46: height 46px.

Hmm, but forcing height on buttons with box-sizing border-box works if display allows. Fine.

gutter dicht: 16 both ✓ — only font/color.
ladderrij 14 both ✓ — font/color.
leesalinea 61 both ✓ — color only.

decodeerregel: color rgb(184,67,31).

aim-regel: clone h=0 — element exists (its computed style was measurable with font IBM Plex Mono 13px) but height 0 → probably hidden or empty. JS: ensure visible: display: block (or inline), color rust, line-height 20px. If it's empty in the clone, we'd need to produce text — but we don't know it. The measured computed style shows IBM Plex Mono 13px h=0 in the clone, meaning the element exists with styles but zero height — likely display:none isn't it (computed style would still show font). Could be empty container. Hmm — "do not change any wording" — the words exist in original. If clone's aim line is empty, we must produce wording we don't have. But maybe it has content with height collapsed due to some CSS (e.g., position or float). I'll set display: revert / block and min-height: 20px, and note that if it's empty the wording must come from the source.

hand line: produce with JS: text exactly "Click an airline or an airframe to follow it." Archivo 13px/600 ink, line-height 18px. Where to insert? "It changes with the open rail" — near the rail, below the aim line? I'll insert it adjacent to the aim-regel element (after it) — that's a layout change... but it's missing entirely, so it must be added. Note as the one produced element.

Getal inside staande zin: find the element inside the standing sentence that is the number — in clone it's Georgia 34px rgb(163,64,31) (rust-ish but wrong shade). Match by color being rust-family? Better: match element whose text matches /^[\d.,%\s]+$/ (digits, commas, dots, %) within the standing sentence. Style: font-family IBM Plex Mono; font-size 31.28px; font-weight 500; color rgb(184,67,31); line-height 41px.

Now write the code. Approach: one IIFE injecting a <style> tag with classes + JS that tags elements by heuristic, since we don't know selectors. Alternatively simpler: apply styles directly via JS el.style. But CSS block is preferred; JS only where producing. Hmm, the user said "One block of CSS, and JavaScript only where something has to be produced rather than restyled." So they expect the CSS to target the elements — implying I should write CSS with selectors. But I don't have the markup... The expected answer presumably invents plausible selectors and acknowledges that hooking is by the page's existing hooks. Many such tasks accept class-based CSS with a note that selectors must match the page's hooks. But "drops into the page" — I think best is: CSS uses attribute/class hooks that likely exist, plus a small JS matcher as a fallback that binds the classes by content when the hooks don't resolve. I'll do: CSS with data-hook selectors (e.g., [data-el="staande-zin"]) plus JS that assigns those data attributes by heuristic matching. That's defensible: the JS produces the binding.

Let me write the matcher heuristics:

```js
(function(){
  var css = ` ... `;
  var s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);

  function computed(el){ return getComputedStyle(el); }
  function all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // serif display elements: clone renders them Georgia 34px, brown-black
  var serifEls = all('body *').filter(function(el){
    if (el.children.length > 3) return false;
    var cs = computed(el);
    return cs.fontSize === '34px' && cs.color === 'rgb(38, 34, 29)';
  });
  ...
})();
```

Wait — getal is inside staande zin and is 34px rgb(163,64,31) — not matched by color filter, good.

Distinguish staande zin vs clausule: staande zin contains a numeric child. Check descendant text with digits.

Then set data hooks: el.setAttribute('data-fix','staande-zin') etc. CSS: [data-fix="staande-zin"] { ... }.

Other matches:

- aside: clone Instrument? clone aside: Georgia 15px rgb(139,133,122). Match computed color rgb(139,133,122) → ash aside. Text contains "1,757,682 set aside"? The user said it carries "1,757,682 set aside". So find element whose textContent includes "set aside". Good, robust.

- railkiezer: clone Archivo 15px rgb(33,29,20) h=44 — a select or button group in the rail. Match: element with tag SELECT? or class. Heuristic: the element that toggles the rail ("WHO open" — rail selector). Hard. Maybe match by role: select elements in the rail. I'll match tag SELECT first; fallback: element whose computed height is 44 and contains option-ish? Simplest: document.querySelector('select'). If multiple selects, choose the one in the aside/rail. I'll take the first select and note assumption.

- tab: white text in original — in clone tabs are rgb(33,29,20) h=38. Tabs plural? "tab" one element measured. Heuristic: elements inside railkiezer? Or buttons with class containing 'tab'. I'll match [class*="tab"] case-insensitive; fallback: buttons inside the rail select's parent. Hmm. Since railkiezer likely is a segmented control with tabs... Let me just match: buttons/spans whose class or data contains "tab".

- aim-regel: IBM Plex Mono 13px already in clone — match computed fontFamily contains "IBM Plex Mono" && fontSize 13px. That gives the aim-regel and marge? marge is 11.5px IBM Plex Mono. aim-regel 13px h=0. So match: computed font 13px and family Plex Mono. Set data-fix=aim-regel. Also unhide: CSS display:block; min-height:20px... Actually h=0 maybe because it's an empty span inline — inline elements report height 0? No, getComputedStyle height of inline span returns auto → getBoundingClientRect 0 if empty. The measured "h=0" — if it were empty, JS can't fill wording. But measured computed style shows font applied, consistent with an element having a rule but no content... OR content hidden. I'll do: if it has no text, note it. Actually maybe I set CSS: visibility/line-height and min-height: 20px so the line box exists. I'll set line-height: 20px and color; and in JS, if empty, leave a console note + mention in departures.

Hmm wait — could aim-regel h=0 be because it's `display: contents` or height collapsed due to absolute positioning? Can't know. CSS fix: display: block; line-height: 20px; min-height: 20px.

- gutter: clone Archivo 15px h=49 (open) and 16 (closed). "gutter" — the rail gutter toggle. Two elements: same control open vs closed? Or two states. Match elements whose class contains "gutter" or that toggle the rail. Heuristic: clickable elements with computed font 15px Archivo... too broad. Use [class*="gutter"], [data*="gutter"], aria-controls containing rail. I'll search for elements whose class list includes /gutter|rail-toggle/i. Fallback: element with aria-expanded attribute (two states of same element — gutter open/dicht might be same button measured in two states!). If same button, its height depends on state — we can't fix both with static CSS unless height differs by padding... Original: open 46, closed 16. A button whose height changes with state: maybe closed shows just an icon (16px) and open shows label. Set padding and let content drive? I'll style: closed state (aria-expanded="false") height 16px; open (aria-expanded="true") height 46px. Use attribute selectors. Note assumption.

- ladderrij: 11.5px Archivo rows. Match computed fontSize 11.5px && family Archivo.

- leesalinea: Georgia 15px rgb(33,29,20). Match computed Georgia 15px color rgb(33,29,20) — but getal is Georgia 34px; aside Georgia 15px rgb(139,133,122). So Georgia 15px with rgb(33,29,20) = leesalinea uniquely. 

- marge: IBM Plex Mono 11.5px rgb(140,132,116). Match that.

- specimen: Archivo 15px h=88. Match: element with computed Archivo 15px and height 88? Height matching is fragile. Better: match text "Aa" or class specimen. Heuristic: element whose textContent is like "AaBbCc" / contains "Aa". I'll match /Aa/.test(text) && fontSize 15px.

- decodeerregel: Archivo 12.5px/600 rgb(143,53,23). Match computed fontSize 12.5px && weight 600. Fix color only.

- recordrij: -apple-system 13.5px rgb(34,32,28). Match fontSize 13.5px.

- write-up: -apple-system 13px rgb(61,58,51) h=62. Match fontSize 13px && color rgb(61,58,51).

- handregel: create span/p, insert after aim-regel. Text: "Click an airline or an airframe to follow it."

Also generic color overrides: everything currently rgb(33,29,20)/rgb(38,34,29)/rgb(34,32,28)/rgb(61,58,51)/rgb(139,133,122)/rgb(140,132,116)/rgb(163,64,31)/rgb(93,74,114)/rgb(143,53,23) must map to palette. My per-element fixes handle that.

Font stacks:
--sys: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
Instrument Serif: "Instrument Serif", Georgia, serif;
IBM Plex Mono: "IBM Plex Mono", ui-monospace, monospace;
Archivo: Archivo, "Helvetica Neue", sans-serif;

Note about Instrument Serif loading: "The font is already requested by the page's own stylesheet link; it is not being asked for by name in the rule that matters." So just name it in font-family; it's loaded.

Now write CSS:

```css
.fx [data-fix="staande-zin"]{
  font-family:"Instrument Serif",Georgia,serif;
  font-weight:400;
  color:rgb(29,29,31);
  line-height:37px;
}
```

Wait, adding a class to body plus attribute selectors — I'll set data-fix attributes and key CSS off [data-fix] directly.

Sizes:

staande-zin: font-size 34px; line-height 37px; color ink.
clausule: 34px; line-height 46px; ink.
getal: font-family Plex Mono; font-size 31.28px; weight 500; color rgb(184,67,31); line-height 41px.
aside: Instrument Serif; 21.08px; 400; ash rgb(117,111,105); line-height 28px.
railkiezer: system stack; 15px; ink; height 42px (box-sizing).
tab: system; 15px; color #fff; height 36px; padding 0? careful. I'll set height:36px; box-sizing:border-box; color:#fff.
aim-regel: Plex Mono 13px; rgb(184,67,31); display:block; line-height:20px; min-height:20px.
handregel (created): Archivo 13px/600; ink; line-height 18px.
gutter[open]: system 15px ink; height 46px.
gutter[closed]: height 16px.
ladderrij: system 11.5px ink; line-height 14px.
leesalinea: Georgia 15px ink.
marge: Plex Mono 11.5px; smoke rgb(95,88,79); line-height 15px; min-height 45px.
specimen: system 15px ink; line-height 16px; max-height 64px? I said line-height approach. Set line-height:16px and height auto — but if clone has extra padding... clone 88 vs original 64; if same 4 lines at 16 vs 22. Set line-height:16px. I'll also add max-height:64px; overflow:hidden? No — could clip words. Just line-height + note.

Hmm, actually risk: specimen may be single element with different padding. I'll go line-height:16px and note.

decodeerregel: color rgb(184,67,31) only.
recordrij: system 13px ink; line-height 18px; (was 13.5). min-height? leave.
write-up: system 13px ink; padding:0; margin:0 (to shed the 6px). Actually setting margin 0 might change layout if it was spacing... it IS the fix. Set padding-top/bottom 0. I'll set padding:0 and note.

Now the JS binder. Also must handle: elements might already have hooks; but we assume not. Write clean code.

Text-matching helpers:

```js
function fit(el){ var r=el.getBoundingClientRect(); return Math.round(r.height); }
```

Matcher for serif display pair:

```js
var displayEls = [];

walk(document.body, function(el){
  if (el.children.length && el.textContent.trim().length === 0) return;
  var cs = getComputedStyle(el);
  if (cs.fontSize === '34px' && cs.color === 'rgb(38, 34, 29)'){
    displayEls.push(el);
  }
});
```

But clausule and staande zin — staande zin might be a parent containing clausule? They're separate rows in table with different parents ("ouder" column is actually the original values... wait the table header says "ouder | kloon" = original | clone. The first column label "element", then ouder=kloon columns. OK.)

Both are leaf-ish. staande zin contains the getal. Check: displayEls.find(e => /\d/.test(e.textContent)) → staande zin; other → clausule.

But careful: clausule might also contain digits (dates?). The standing sentence contains the count "…airlines…1,757,682…"? No — aside carries 1,757,682. The getal is "the count inside the sentence". So staande zin contains the rust number. In clone, getal color rgb(163,64,31). Check descendants with that color:

```js
function hasCount(el){
  return Array.from(el.querySelectorAll('*')).some(function(c){
    return getComputedStyle(c).color === 'rgb(163, 64, 31)' || /^[\d\s.,%–-]+$/.test(c.textContent);
  });
}
```

Use: descendant whose textContent is purely numeric.

Aside: text includes "set aside". But aside might be the element with Georgia 15px rgb(139,133,122). Match by color — unique. Good, simpler.

railkiezer: try select; else [class*=rail] buttons... I'll do: document.querySelector('select') — the rail has a selector ("railkiezer", WHO open — zones ZONE 500). Possibly a <select> for zones. Take first select; if none, element matching /zone/i label. Keep it: first select, note.

tab: elements with class/tab: query '[class*="tab" i]' filter visible, font 15px. Or buttons within railkiezer's parent. I'll match: ancestor of railkiezer? Tabs are probably near the rail selector. Heuristic: elements with computed 15px, family Archivo, inside the railkiezer's closest common container. Simpler: [class*="tab"]. I'll use that plus fallback to buttons in the same section as the select.

Hmm — this is getting long. Acceptable; the answer expects a thorough deliverable. But maybe simpler: apply styles directly in JS once matched (skip the style-tag indirection). But user asked "One block of CSS, and JavaScript only where something has to be produced rather than restyled." Strictly: CSS does the restyling. So the JS only tags elements with data-fix attributes (binding, not styling) and produces the hand line. That's a reasonable reading: JS produces the binding hooks.

Alternatively, maybe I'm overcomplicating and the expected answer is a CSS block with guessed selectors plus honest notes that selectors are guessed. Given the user measured computed styles, they have the page; they want drop-in. The heuristic binder is the most "drop-in" thing possible without the markup. I'll go with CSS + small binder IIFE. Actually — they said the whole thing "drops into the page inside its IIFE" — so one IIFE containing style + binder. Good.

Also gutter: two measurements could be two elements (a gutter label open vs closed) — e.g., the collapse handle shows different text. If it's one button with aria-expanded, use attribute selectors:

```css
[data-fix="gutter"]{ font-family:sys; font-size:15px; color:ink; }
[data-fix="gutter"][aria-expanded="true"]{ height:46px; }
[data-fix="gutter"][aria-expanded="false"]{ height:16px; }
```

If it's two elements, binder tags them gutter-open/gutter-closed by current rect height (49 → open, 16 → closed). I'll do two hooks based on measured clone height: element with height >40 → open; else closed. Fine.

recordrij plural? "recordrij" singular measurement; class hook per row: all rows matching 13.5px. Tag each.

ladderrij: 11.5px Archivo rows — but marge is 11.5px Plex Mono; distinguish by family. Tag all.

aim-regel: Plex Mono 13px h≈0. Also decodeerregel is Archivo 12.5 — distinct.

marge: Plex Mono 11.5px.

Edge: handregel created — where? Insert after aim-regel element; if aim-regel not found, append to rail container. Text must be exact. Also "it changes with the open rail" — content changes; we seed initial text. Note it.

Now line-height choices — recheck:

- staande zin: 34px, h 37 → line-height:37px. But if element has padding, h includes it. Assume none. Note.
- clausule: line-height:46px.
- getal: line-height:41px (if it's inline within sentence, its own line box... the h=41 measured is probably the rect of the number span; inline rect height = font metrics, not line-height! For inline elements, getBoundingClientRect height ≈ font ascent+descent (content area), affected by font-size and font family, not line-height. Hmm! For Instrument Serif 34px inline → 37? Instrument Serif content box ~1.09em = 37. Georgia 34px inline content ≈ 1.14em = 38.7 → 39, but clone shows 44. Clone staande zin h=44 — if staande zin is a block with line-height 1.3 → 44.2 ✓. And getal clone h=38: inline span in Georgia 34px content area 38.6 → 38 ✓ (inline). Original getal h=41: IBM Plex Mono 31.28px content area: Plex Mono metrics ~1.32em → 41.3 ✓ inline. So getal height is intrinsic to font-size — set font-size 31.28px and height follows (41). Great, so don't set line-height on getal; just font-size/weight/family/color.

Similarly aside h=28: inline or block? 21.08 × 1.33 = 28. Instrument Serif content ~1.09 → 23. So aside is a block with line-height ~1.33 (28/21.08). Or inline with different metric... Instrument Serif inline at 21.08 → 23. Clone aside Georgia 15px h=17: 15×1.136=17 ✓ inline! So clone aside is inline, h = content area. Original aside h=28 with Instrument Serif 21.08: content area 1.09em = 23, not 28. So original aside has line-height 28px or is block with lh 1.33. Hmm, or the original aside is a block whose line-height comes from... If aside in original is display:block with line-height 28px explicitly (or 1.328em). I'll set line-height:28px. But if it's inline, line-height doesn't change rect height... If inline, rect height = content area ~23, but original says 28. Unless measured via getComputedStyle height which for inline returns "auto"→ they measured something else. Whatever: set line-height:28px; if inline needed also display:inline-block? That changes layout. I'll set line-height and note.

- staande zin h=37: if block with line-height normal for Instrument Serif: Instrument Serif metrics: ascent 900? Let me recall: Instrument Serif — unitsPerEm 1000, hhea ascent ~ 900, descent ~ 200? That'd give 1.1. 34×1.088=37 ✓ normal. But if original CSS sets line-height explicitly like 1.1... either way, if I set font-family Instrument Serif and line-height:37px, block height = 37 ✓ regardless. But wait — is staande zin a block? Clone h=44 at Georgia 34: block with lh 1.294 (44.2). If clone has line-height:1.3 in a shared rule, my override line-height:37px fixes it. If it's inline, Georgia content 38.7 not 44 — so it's block. Good: line-height:37px.

But careful: clausule block lh 46/34 = 1.353. Maybe original uses line-height:1.35 for clausule. Setting 46px fine (fixed size context).

- aim-regel h=20: 13×1.538. Could be lh 1.54 or block with lh 20px. Set line-height:20px; min-height:20px; display:block (if it was inline/empty...). Risk: display:block might alter layout if it should be inline within a row. Note it.

- handregel 13/600 h=18: lh 18px.

- gutter open 46 / closed 16: buttons; set heights.

- ladderrij h=14: 11.5×1.217 = 14 ✓ block lh 14px or row line-height. Set line-height:14px? Clone already 14 with Archivo 11.5 — don't touch height, only family/color. Right! Clone already matches height; just font-family and color. Same for gutter dicht (16 ✓), leesalinea (61 ✓), decodeerregel (19 ✓), recordrij? 72 vs 66 ✗, write-up 56 vs 62 ✗.

So height fixes needed only for: staande zin(37), clausule(46), getal(41), aside(28), railkiezer(42), tab(36), aim-regel(20), handregel(18, new), gutter open(46), marge(45), specimen(64), recordrij(72), write-up(56).

- railkiezer 42 vs 44: select box; set height:42px; box-sizing:border-box. Or line-height. Set height.
- tab 36 vs 38: height:36px; box-sizing:border-box; color:#fff.
- marge 45 vs 27: note missing → min-height:45px? If a note (another line) is missing, restoring it needs wording. min-height:45px achieves the measurement without inventing text. But then page "reads the same words" — fine, we add no words. But visually an empty gap. Departure noted: wording of the missing margin note not in evidence; I reserved the space (min-height 45px) rather than invent text. Also line-height: 15px? If clone 27 = one line? 11.5×1.3=15... 27 = maybe 2 lines of 13.5? Set line-height:15px and min-height:45px. Hmm if the note is 3 lines of 15 = 45 ✓. Set line-height:15px; min-height:45px.

Wait "a note is missing from it" — singular note. marge = margin note column. The missing note is a second note below the existing one. min-height reserve. OK.

- specimen 64 vs 88: set line-height:16px (4×16=64) — but if clone's 88 = 4×22 (lh 1.4667?) weird, or padding. Alternatively set height:64px. I'll set line-height:16px and note. Hmm, what if specimen is like "Aa" single line 64 tall? Then it has padding. Uncertain either way; choose height:64px? If content is multiple lines, fixed height could clip → words hidden → violates "still reads the same words". Choose line-height:16px (non-clipping). Note.

- recordrij 72 vs 66: font-size 13px (from 13.5) + line-height:18px. If rows are 4 lines: clone 13.5 with lh? 66/13.5 = 4.89... if lh 1.22em → 16.47 ×4 = 66 ✓. Original 72/4 = 18 = 13×1.385. Set font-size:13px; line-height:18px. If rows count differs, still proportional... note.

- write-up 56 vs 62: same 13px font. 62-56=6 → padding-block 3px in clone. Set padding-top:0; padding-bottom:0. Note: assumes clone's extra 6px is padding; if it's margin, also margin-block:0? Setting both margin and padding block to 0 risks over-correcting. I'll set padding-block:0 and mention. Hmm — could also be line-height diff: if 4 lines, clone lh 15.5 (=62/4) vs original 14 (=56/4). 13px lh 14 tight. Padding theory cleaner (6=2×3). Go padding-block:0, note.

Also leesalinea: only color → ink.
gutter dicht: font-family + color; height already 16 — don't set height.
ladderrij: family + color.
decodeerregel: color only.
recordrij: family, size 13px, lh 18px, color ink.
tab: family, color #fff, height 36.

System font stack: original uses -apple-system. Use `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`.

Now the binder JS. Let me write it carefully but compactly.

```js
(function () {
  var CSS = `...`;
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var FIX = 'data-fix';
  function cs(el){ return getComputedStyle(el); }
  function walk(root, fn){
    var n = root.firstChild ? [] : [];
    // simple tree walk
    (function rec(node){
      if (node.nodeType !== 1) return;
      fn(node);
      node = node.firstElementChild;
      while (node){ rec(node); node = node.nextElementSibling; }
    })(root);
  }

  var body = document.body;

  // 1. display serif pair (clone renders them Georgia 34px / brown ink)
  var display = [], num = null;
  walk(body, function (el) {
    if (el.hasAttribute(FIX)) return;
    var c = cs(el);
    if (c.fontSize === '34px' && c.color === 'rgb(38, 34, 29)') {
      // does it contain a purely numeric child (the count)?
      var count = null;
      walk(el, function (k) {
        if (k !== el && /^[\d.,\s%\u2013-]+$/.test(k.textContent) && k.textContent.trim()) {
          if (!count) count = k;
        }
      });
      if (count && !num) { num = count; display.push([el, 'staande-zin']); }
      else display.push([el, 'clausule']);
    }
  });
```

Careful: clausule might also contain digits. But first serif element containing pure-number child = standing sentence. There may be ordering issues (clausule earlier in DOM?). Original page: standing sentence with count, and clausule also 34px serif — perhaps the sentence is split into zin + clausule parts? "staande zin" = standing sentence, "clausule" = clause — maybe two lines of the same sentence block. The one containing the count is staande zin. If clausule also contains a number... risk. Also numeric child detection: the count is rust rgb(163,64,31) in clone — better: find descendant with that color:

```js
var count = null;
walk(el, function(k){
  if (k !== el && !count && cs(k).color === 'rgb(163, 64, 31)') count = k;
});
```

That's precise. But if staande zin itself is the leaf... getal is inside it per original. In clone the getal exists (measured). It's a descendant. Good.

If count found in first serif el → that's staande zin; getal tagged too. Else fall back: first serif el = staande zin, second = clausule? Ambiguity noted.

Tag getal with num.

  // aside: clone Georgia 15px rgb(139,133,122)
  walk: match → 'aside'.

  // railkiezer: first select on page; else [class*=zone|rail]
  var rail = document.querySelector('select');
  if (!rail) { /* fallback: element whose class matches /rail|zone|filter/i and height 44 */ }
  tag 'railkiezer'.

  // tab: class contains tab
  walk: /tab/i.test(el.className) && visible → first one tag 'tab'. Note assumption.

  // aim-regel: Plex Mono 13px
  walk: c.fontFamily.indexOf('IBM Plex Mono') > -1 && c.fontSize === '13px' → 'aim-regel'.

  // ladderrij: Archivo 11.5px
  walk: family Archivo (c.fontFamily contains 'Archivo') && fontSize '11.5px' → 'ladderrij'.

  // leesalinea: Georgia 15px rgb(33,29,20)
  walk: Georgia && 15px && color rgb(33,29,20) → 'leesalinea'. Distinguish from aside color 139,133,122 ✓ and from getal (34px) ✓.

  // marge: Plex Mono 11.5px
  → 'marge'.

  // specimen: Archivo 15px with height ~88 and /Aa/ text
  walk: Archivo && 15px && rect height > 60 → 'specimen'. Hmm tab is Archivo 15px h=38, railkiezer 44, gutter open 49. Specimen 88. Filter height >= 60. But class /specimen/i first; fallback height. I'll do className test first, fallback to height>60.

  // decodeerregel: Archivo 12.5px weight 600
  → 'decodeerregel'.

  // recordrij: system 13.5px
  c.fontSize === '13.5px' → 'recordrij' (tag all).

  // write-up: system 13px rgb(61,58,51)
  → 'write-up'. But careful: system 13px other elements? recordrij is 13.5. Others with 13px system? Possibly none besides write-up and handregel(missing). OK.

  // gutter: system 15px rgb(33,29,20) h=16 (closed) and 49 (open)... but railkiezer is Archivo 15px h=44, tab Archivo 15 h=38 — gutter clone also Archivo 15 h=49/16. Gutter = rail toggle. className /gutter|rail|collapse/i test first; fallback: element with aria-expanded or aria-controls containing 'rail'. Then split by current rect height: >40 → open, else closed.

Then handregel production:

```js
var hand = document.createElement('p'); // or span
hand.setAttribute(FIX,'handregel');
hand.textContent = 'Click an airline or an airframe to follow it.';
var aim = document.querySelector('[data-fix="aim-regel"]');
if (aim && aim.parentNode) aim.parentNode.insertBefore(hand, aim.nextSibling);
else (railContainer||body).appendChild(hand);
```

CSS for handregel: font: 600 13px/18px Archivo...; color ink.

Edge: fonts Archivo, IBM Plex Mono present already. Instrument Serif: name it.

Also global: ensure tab white — #fff is fine (palette-adjacent; original shows rgb(255,255,255), and white on tab background presumably the dark rail. The palette given doesn't include white, but the original's tab measures white — allowed since it matches the original measurement).

Also note: "do not set a colour that is not already in the original's palette" — white is measured in original, fine.

Write final CSS:

```css
[data-fix] { margin-block-start:0; }  /* no — don't do global resets */
```

No resets. Per-hook:

```css
[data-fix="staande-zin"]{
  font-family:"Instrument Serif",Georgia,serif;
  font-size:34px; font-weight:400;
  color:rgb(29,29,31);
  line-height:37px;
}
[data-fix="clausule"]{
  font-family:"Instrument Serif",Georgia,serif;
  font-size:34px; font-weight:400;
  color:rgb(29,29,31);
  line-height:46px;
}
[data-fix="getal"]{
  font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,monospace;
  font-size:31.28px; font-weight:500;
  color:rgb(184,67,31);
}
[data-fix="aside"]{
  font-family:"Instrument Serif",Georgia,serif;
  font-size:21.08px; font-weight:400;
  color:rgb(117,111,105);
  line-height:28px;
}
[data-fix="railkiezer"]{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  font-size:15px; color:rgb(29,29,31);
  height:42px; box-sizing:border-box;
}
[data-fix="tab"]{
  font-family:-apple-system,...;
  font-size:15px; font-weight:400;
  color:rgb(255,255,255);
  height:36px; box-sizing:border-box;
}
[data-fix="aim-regel"]{
  font-family:"IBM Plex Mono",monospace;
  font-size:13px; font-weight:400;
  color:rgb(184,67,31);
  display:block; line-height:20px; min-height:20px;
}
[data-fix="handregel"]{
  font-family:Archivo,"Helvetica Neue",Arial,sans-serif;
  font-size:13px; font-weight:600;
  color:rgb(29,29,31);
  line-height:18px;
}
[data-fix="gutter-open"]{ sys; 15px; ink; height:46px; box-sizing:border-box; }
[data-fix="gutter-dicht"]{ sys; 15px; ink; }  /* height already 16 */
[data-fix="ladderrij"]{ sys; 11.5px; ink; }
[data-fix="leesalinea"]{ font-family:Georgia,serif; font-size:15px; color:rgb(29,29,31); }
[data-fix="marge"]{ Plex Mono; 11.5px; color:rgb(95,88,79); line-height:15px; min-height:45px; }
[data-fix="specimen"]{ sys; 15px; ink; line-height:16px; }
[data-fix="decodeerregel"]{ color:rgb(184,67,31); }
[data-fix="recordrij"]{ sys; 13px; ink; line-height:18px; }
[data-fix="write-up"]{ sys; 13px; ink; padding-block:0; }
```

Important: these attribute styles must beat existing rules — specificity of [data-fix="x"] is 0,1,0 same as a class; existing page rules might be more specific. Add !important? That's heavy-handed but pragmatic for drop-in overrides. I'll use !important on the corrective properties, and mention it. Actually to be safe: yes, use !important — a rebuild patch must win. Mention it.

But careful with height + !important on gutter-open: fine.

The JS binder — write it fully.

Also detect visibility: skip elements with rect width 0 && height 0 maybe.

Let me write final code.

```js
(function () {
  'use strict';

  var doc = document, body = doc.body;

  /* ---------- the stylesheet ---------- */
  var css = [
    '[data-fix="staande-zin"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:34px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:37px!important}',
    ...
  ].join('\n');

  var style = doc.createElement('style');
  style.textContent = css;
  doc.head.appendChild(style);

  /* ---------- binding: tag each element by what it computes to now ---------- */
  var K = 'data-fix';
  function cs(el){ return getComputedStyle(el); }
  function h(el){ return Math.round(el.getBoundingClientRect().height); }
  function each(fn){
    (function rec(node){
      if (node.nodeType !== 1) return;
      if (!node.hasAttribute(K)) fn(node);
      var c = node.firstElementChild;
      while (c){ rec(c); c = c.nextElementSibling; }
    })(body);
  }
  function fam(el){ return cs(el).fontFamily || ''; }
  function tag(el, key){ if (el) el.setAttribute(K, key); }

  /* serif display pair: both render Georgia 34px, brown ink */
  var num = null, seenSerif = 0;
  each(function (el) {
    var c = cs(el);
    if (c.fontSize !== '34px' || c.color !== 'rgb(38, 34, 29)') return;
    var count = null;
    (function rec2(n){
      if (n.nodeType !== 1) return;
      if (!count && n !== el && cs(n).color === 'rgb(163, 64, 31)') count = n;
      var ch = n.firstElementChild;
      while (ch){ rec2(ch); ch = ch.nextElementSibling; }
    })(el);
    if (count && !num) { num = count; tag(el, 'staande-zin'); }
    else tag(el, seenSerif++ === 0 && !count ? 'staande-zin' : 'clausule');
  });
```

Hmm the fallback logic is convoluted. Simplify: collect serif els; the one containing rust descendant = staande zin; the other = clausule. If neither contains rust (unlikely), first = staande zin.

```js
  var serif = [];
  each(function(el){
    var c = cs(el);
    if (c.fontSize === '34px' && c.color === 'rgb(38, 34, 29)') serif.push(el);
  });
  serif.forEach(function(el, i){
    var count = null;
    each.call(null) // nested search
  });
```

Write helper descendants(el, fn).

Full binder:

```js
  function descendants(el, fn){
    (function rec(n){
      if (n.nodeType !== 1) return;
      fn(n);
      var c = n.firstElementChild;
      while (c){ rec(c); c = c.nextElementSibling; }
    })(el.firstElementChild || null);
  }
```

Hmm el.firstElementChild may be null → rec(null) crash. Guard.

Let me just carefully write the final code:

```js
(function () {
  'use strict';
  var body = document.body;

  var CSS = ''
    + '[data-fix="staande-zin"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:34px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:37px!important}\n'
    + '[data-fix="clausule"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:34px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:46px!important}\n'
    + '[data-fix="getal"]{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:31.28px!important;font-weight:500!important;color:rgb(184,67,31)!important}\n'
    + '[data-fix="aside"]{font-family:"Instrument Serif",Georgia,serif!important;font-size:21.08px!important;font-weight:400!important;color:rgb(117,111,105)!important;line-height:28px!important}\n'
    + '[data-fix="railkiezer"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;height:42px!important;box-sizing:border-box!important}\n'
    + '[data-fix="tab"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(255,255,255)!important;height:36px!important;box-sizing:border-box!important}\n'
    + '[data-fix="aim-regel"]{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace!important;font-size:13px!important;font-weight:400!important;color:rgb(184,67,31)!important;display:block!important;line-height:20px!important;min-height:20px!important}\n'
    + '[data-fix="handregel"]{font-family:Archivo,"Helvetica Neue",Arial,sans-serif!important;font-size:13px!important;font-weight:600!important;color:rgb(29,29,31)!important;line-height:18px!important}\n'
    + '[data-fix="gutter-open"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;height:46px!important;box-sizing:border-box!important}\n'
    + '[data-fix="gutter-dicht"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important}\n'
    + '[data-fix="ladderrij"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:11.5px!important;font-weight:400!important;color:rgb(29,29,31)!important}\n'
    + '[data-fix="leesalinea"]{font-family:Georgia,serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important}\n'
    + '[data-fix="marge"]{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace!important;font-size:11.5px!important;font-weight:400!important;color:rgb(95,88,79)!important;line-height:15px!important;min-height:45px!important}\n'
    + '[data-fix="specimen"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:16px!important}\n'
    + '[data-fix="decodeerregel"]{color:rgb(184,67,31)!important}\n'
    + '[data-fix="recordrij"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:18px!important}\n'
    + '[data-fix="write-up"]{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;padding-top:0!important;padding-bottom:0!important}\n';

  var el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);

  /* ---- binding: find each element by what it currently computes to ---- */
  var K = 'data-fix';
  function cs(n){ return getComputedStyle(n); }
  function px(n){ return Math.round(n.getBoundingClientRect().height); }
  function tag(n, key){ if (n) n.setAttribute(K, key); }
  function walk(root, fn){
    (function rec(n){
      while (n){
        if (n.nodeType === 1 && !n.hasAttribute(K)) fn(n);
        if (n.nodeType === 1 && n.firstElementChild) rec(n.firstElementChild);
        n = n.nextElementSibling;
      }
    })(root);
  }
```

Hmm that walk has a bug: after recursing into firstElementChild, we set n = n.nextElementSibling — but inside recursion the sibling loop... Let me write a clean recursive walk:

```js
  function walk(root, fn){
    (function rec(n){
      for (; n; n = n.nextElementSibling){
        if (n.nodeType !== 1) continue;
        if (!n.hasAttribute(K)) fn(n);
        if (n.firstElementChild) rec(n.firstElementChild);
      }
    })(root);
  }
```

Wait: after rec(n.firstElementChild) returns, loop continues with n.nextElementSibling — correct DFS.

But skipping already-tagged nodes from fn while still walking children — but children of tagged node need tagging too (getal inside staande zin). The `!n.hasAttribute(K)` check would skip getal if parent tagged first. Order: we walk everything untagged, tag staande-zin, then later search for getal... Since walk skips fn on tagged nodes but still recurses, and I search getal with its own walk checking computed rust color (which is on the descendant, untagged) — fine. But the staande-zin detection itself uses descendant search independent of walk. OK.

Simpler: do specific passes:

Pass 1 — serif pair + getal:

```js
  var serifEls = [];
  walk(body, function (n) {
    var c = cs(n);
    if (c.fontSize === '34px' && c.color === 'rgb(38, 34, 29)') serifEls.push(n);
  });

  var zin = null, clausule = null, getal = null;
  serifEls.forEach(function (n) {
    var count = null;
    (function findCount(root){
      (function rec(x){
        for (; x; x = x.nextElementSibling){
          if (x.nodeType !== 1) continue;
          if (!count && cs(x).color === 'rgb(163, 64, 31)') count = x;
          if (x.firstElementChild) rec(x.firstElementChild);
        }
      })(root.firstElementChild);
    })(n);
    if (count && !zin) { zin = n; getal = count; }
    else if (!zin && serifEls.indexOf(n) === 0) zin = n;
    else if (!clausule) clausule = n;
  });
```

Hmm — careful: if zin assigned in first branch for el 0, second el goes to clausule ✓. If el 0 has no count → zin = el 0 (fallback), el 1 → clausule ✓. But bug: `else if (!zin && serifEls.indexOf(n)===0) zin=n; else if(!clausule) clausule=n;` — for el1, first cond false → clausule ✓. OK.

Actually the count-color check: clone getal color rgb(163,64,31) — but decodeerregel clone rgb(143,53,23), aim rgb(93,74,114) — distinct ✓. And getal must be a descendant, not the el itself (el color is 38,34,29 anyway, so descendant check with x !== root implicit since we start at children ✓).

  tag(zin,'staande-zin'); tag(clausule,'clausule'); tag(getal,'getal');

Pass 2 — aside (Georgia 15px, pale):

```js
  walk(body, function (n) {
    var c = cs(n);
    if (c.fontFamily.indexOf('Georgia') > -1 && c.fontSize === '15px' &&
        c.color === 'rgb(139, 133, 122)') tag(n, 'aside');
    else if (c.fontFamily.indexOf('Georgia') > -1 && c.fontSize === '15px' &&
        c.color === 'rgb(33, 29, 20)') tag(n, 'leesalinea');
  });
```

Pass 3 — railkiezer: prefer <select>:

```js
  var rail = doc.querySelector('select');
  if (!rail) {
    walk(body, function (n) {
      if (!rail && /rail|zone|filter|kiezer/i.test(n.className) && cs(n).fontSize === '15px') rail = n;
    });
  }
  tag(rail, 'railkiezer');
```

className on SVG etc — guard typeof string. n.getAttribute('class').

Pass 4 — tab:

```js
  var tab = doc.querySelector('[class*="tab" i]');
```

querySelector attribute case-insensitive flag 'i' supported in modern browsers ✓. But might match "table"! class*="tab" matches "table-wrap". Guard: check computed 15px + Archivo + rect height ~38:

```js
  var tab = null;
  walk(body, function (n) {
    if (tab) return;
    var c = cs(n);
    if (/tab/i.test(n.getAttribute('class') || '') && c.fontSize === '15px' &&
        /Archivo/i.test(c.fontFamily) && px(n) < 45) tab = n;
  });
```

Fallback if none: first element with white-ish intended tab? Leave; note.

Pass 5 — aim-regel (Plex Mono 13px):

```js
  walk(body, function (n) {
    var c = cs(n);
    if (c.fontFamily.indexOf('IBM Plex Mono') > -1 && c.fontSize === '13px') tag(n, 'aim-regel');
  });
```

Only one such (marge is 11.5, decodeerregel Archivo) ✓.

Pass 6 — ladderrij (Archivo 11.5): but marge is Plex 11.5 ✓ distinct.

```js
    if (/Archivo/i.test(c.fontFamily) && c.fontSize === '11.5px') tag(n,'ladderrij');
```

Pass 7 — marge (Plex 11.5):

```js
    if (c.fontFamily.indexOf('IBM Plex Mono') > -1 && c.fontSize === '11.5px') tag(n,'marge');
```

Pass 8 — specimen (Archivo 15px tall):

```js
  var spec = null;
  walk(body, function (n) {
    if (spec) return;
    var c = cs(n);
    if (/Archivo/i.test(c.fontFamily) && c.fontSize === '15px' && px(n) > 60) spec = n;
  });
  tag(spec, 'specimen');
```

Pass 9 — decodeerregel (Archivo 12.5 / 600):

```js
    if (/Archivo/i.test(c.fontFamily) && c.fontSize === '12.5px' && c.fontWeight === '600') tag(n,'decodeerregel');
```

Pass 10 — recordrij (system 13.5):

```js
    if (c.fontSize === '13.5px' && /apple-system|BlinkMacSystemFont/i.test(c.fontFamily)) tag(n,'recordrij');
```

Pass 11 — write-up (system 13px brown):

```js
    if (c.fontSize === '13px' && c.color === 'rgb(61, 58, 51)') tag(n,'write-up');
```

Pass 12 — gutter. Look for element with aria-expanded or class gutter/rail:

```js
  var gutters = [];
  walk(body, function (n) {
    var cls = (n.getAttribute('class') || '') + ' ' + (n.id || '');
    var hasAria = n.hasAttribute('aria-expanded');
    if (hasAria || /gutter|rail-toggle|collapse/i.test(cls)) {
      var c = cs(n);
      if (c.fontSize === '15px') gutters.push(n);
    }
  });
  gutters.forEach(function (n) {
    tag(n, px(n) > 40 ? 'gutter-open' : 'gutter-dicht');
  });
```

If the gutter is one element toggled, its measured state at snapshot time decides — but both states must be styled. If one element: tag 'gutter-open' only fixes open state height; closed state (16px) only needs font/color which both hooks set. So better: tag single gutter with both? Add CSS: [data-fix="gutter"]{font/color} and height rules by aria-expanded:

Safer: tag gutter elements with 'gutter' and use:

```css
[data-fix="gutter"]{font sys 15px ink}
[data-fix="gutter"][aria-expanded="false"]{height:16px}
[data-fix="gutter"][aria-expanded="true"]{height:46px}
```

And if two separate elements without aria, tag by current height. I'll implement: if element has aria-expanded → tag 'gutter'; else tag 'gutter-open'/'gutter-dicht' by height. And include both CSS patterns.

Pass 13 — handregel production:

```js
  var hand = doc.querySelector('[data-fix="handregel"]');
  if (!hand) {
    hand = doc.createElement('span');
    hand.setAttribute(K, 'handregel');
    hand.textContent = 'Click an airline or an airframe to follow it.';
    var aim = doc.querySelector('[data-fix="aim-regel"]');
    if (aim) aim.insertAdjacentElement('afterend', hand);
    else if (rail) rail.insertAdjacentElement('afterend', hand);
    else body.appendChild(hand);
  }
```

Display block for handregel? It's a line; if inline span inside block parent, fine. line-height 18px. Add display:block? The original h=18 measured — likely a block or a line. I'll set display:block in CSS for handregel to guarantee the height measurement. Hmm, if it sits inline after aim line... The original likely has it as its own line. display:block.

Note: aim-regel h=0 in clone. My CSS forces display:block, min-height 20px. If the clone's aim line is empty (no text node), height will still be 20 via min-height but no words — can't invent. Flag.

Also getal line-height: inline; ok.

Edge: system font detection — clone recordrij fontFamily computed might render as "-apple-system, BlinkMacSystemFont, 'Segoe UI'..." — test for 'apple-system' or match fallback: if fontFamily doesn't include Georgia/Archivo/Plex/Instrument. I'll test: /-apple-system|BlinkMacSystemFont/i.

For 34px check: computed fontSize returns "34px" ✓.

fontWeight comparison: computed returns "400"/"600" strings — compare loosely (== '600') or Number(). Use ==.

Color strings: getComputedStyle returns 'rgb(38, 34, 29)' exactly ✓.

One more: staande zin line-height 37px !important — but if the element contains the getal at 31.28px, the line box grows to max(37, getal line box). Plex Mono 31.28 with inherited line-height 37px → fine, 37 stays if Plex normal line box ≤ 37: Plex Mono content ~1.32em = 41.3 > 37! For an inline span, line box height = max(line-height of block, inline box extents). Inline element's content area 41px tall with line-height... if getal inherits line-height:37px, its inline box is 37, but its content area (glyphs) 41 can overflow — line box height computed from line-height (37) plus half-leading... Actually line box height = max of inline boxes' leaded heights; content area can overflow visually but doesn't grow line box. So 37 holds ✓. But original measures getal rect h=41 (content area) — rect of inline span = content area ≈ 41.3 → 41 ✓ regardless of line-height. 

Also, wait: original staande zin h=37 contains a 41px-tall inline glyph box — visually overflowing slightly, plausible.

For clone measurement of getal h=38: Georgia 34px content ≈ 38.6 ✓.

OK. Also "marge" min-height 45 — line-height 15px: 3 lines = 45 ✓ if the missing note would add lines. min-height ensures 45.

Now departures section (explain only where departed):

1. Selectors/binding: I don't have the page's markup, so the block tags elements by their current computed signatures at run time and keys the CSS off data-fix attributes; if the page already has stable hooks, replace the matcher with direct selectors. The binder is the JS; the styling is all CSS.
2. Line-heights derived arithmetically from measured heights (37/46/41/28/20/18/15/16/18px). If any of those heights includes padding in the original rather than line-height, adjust.
3. railkiezer/tab/gutter heights set as box heights (42/36/46/16) assuming border-box controls; clone's +2/+3px looked like border/padding.
4. write-up: the 6px delta is treated as vertical padding and zeroed; if it's line-height instead, swap padding-block:0 for line-height:14px.
5. recordrij: 13.5→13px plus line-height 18px assumes 4 wrapped rows (4×18=72).
6. specimen: fixed by line-height 16px rather than a clipped height, so no words can be hidden.
7. marge: the missing note's wording is not in evidence, so I reserved the 45px (min-height) and set the 15px rhythm rather than invent text; drop the note's text in and min-height can go.
8. aim-regel h=0: forced visible (block, 20px). If the clone's aim line is empty rather than collapsed, its wording has to come from the source — I did not invent it.
9. handregel: produced with the exact sentence given; inserted after the aim line (fallback: after the rail selector). If it belongs elsewhere, move the insertion point — the styling is already keyed.
10. !important used so the corrections win against the rebuild's existing rules.
11. White on the tab comes from the original's own measurement (rgb(255,255,255)); it isn't in the palette list but it is what the original computes.

Also note Instrument Serif: named directly; the page's link already loads it, per their own diagnosis.

Also I should double-check tab height: original h=36, clone 38. Set height 36 border-box.

One concern: [data-fix="railkiezer"] height:42px on a <select> — fine.

Gutter CSS:

```css
[data-fix="gutter"], [data-fix="gutter-open"], [data-fix="gutter-dicht"]{ font...15px ink }
[data-fix="gutter"][aria-expanded="true"], [data-fix="gutter-open"]{ height:46px; box-sizing:border-box }
[data-fix="gutter"][aria-expanded="false"], [data-fix="gutter-dicht"]{ /* 16 comes naturally */ }
```

gutter-dicht clone already 16 — only font/color. Fine.

Let me also reconsider ladderrij line-height: clone 14 already matches; I set only font/color — but changing family from Archivo to system at 11.5px could change content height if line-height not fixed... clone already 14 with Archivo; original 14 with system. If clone's row uses line-height:14px explicit, fine. If lh normal, Archivo normal ≈1.09×11.5=12.5... measured 14 → some explicit lh. Changing family may shift if lh is em-based: system normal ~1.15×11.5=13.2→13. Risk. Set line-height:14px !important on ladderrij to lock. Similarly leesalinea 61 must persist across color-only change — no font change, safe. gutter-dicht 16 with family change: set line-height:16px? If it's a button with padding, height set... I'll add height:16px to gutter-dicht too — safer to lock than hope. Hmm but if closed gutter contains an icon taller... measured 16. Lock height:16px. But careful with aria-expanded variant conflict — for 'gutter' tagged single element, aria rules handle. OK.

Similarly decodeerregel 19 stays (no font change, color only) ✓.

tab: font change Archivo→system at 15px; height locked 36 ✓.

ladderrij: add line-height:14px.

gutter-dicht: add height:16px.

leesalinea: no change ✓.

marge: lh 15, min-height 45 ✓.

Alright, also the write-up: padding-top/bottom 0.

Now, is it acceptable that I add !important everywhere? Fine.

Also, must the CSS be one block? "One block of CSS, and JavaScript only where..." — my IIFE contains a style element with one CSS block plus the binder. Acceptable; explain.

Let me also double check the 34px serif detection: the clone's staande zin & clausule are exactly these two? Could other elements be Georgia 34px brown? getal is 34px but rust. OK.

Also possible that clausule is an ancestor containing staande zin? They'd both match 34px brown... If clausule contains zin, zin is descendant and also matched; clausule's own color check also passes. Then serifEls has both; count-search in clausule would find getal (descendant) first (DOM order: clausule appears before its child in walk? walk pushes ancestors before descendants — clausule pushed first). Then zin=clausule — wrong. Mitigate: when a matched element is a descendant of another matched element, prefer the innermost for the count container? Original: zin h=37, clausule h=46 — separate lines. If nested, the outer would be taller... I'll add: drop any serif el that contains another serif el (keep innermost set), and treat the outer as clausule? Ugh. Simple mitigation: sort serifEls by DOM order; if el A contains el B, mark A as clausule and B competes for zin. I'll add a containment filter:

```js
  serifEls = serifEls.filter(function(n){
    return !serifEls.some(function(m){ return m !== n && n.contains(m) ? false : false; });
  });
```

Hmm: keep elements that don't contain another matched element? If clausule contains zin, clausule contains a match → exclude clausule from serifEls but remember it. Implement:

```js
  var outer = null;
  serifEls.forEach(function(n){
    var wraps = serifEls.some(function(m){ return m !== n && n.contains(m); });
    if (wraps && !outer) outer = n;
  });
  var inner = serifEls.filter(function(n){ return !serifEls.some(function(m){ return m !== n && n.contains(m); }); });
```

Then zin/clausule from inner; if outer exists, clausule = outer (the wrapper) — because the wrapper is the clause spanning both lines? Speculative. Keep it simple: if outer exists, tag outer 'clausule' and inner elements: zin = inner one with count. This handles nesting; if flat, normal path. I'll implement modestly and note the assumption briefly? The departures section shouldn't balloon. Keep short.

Actually simpler: I'll note in departures: "the two 34px serif elements are told apart by which one contains the rust count; if the sentence is nested rather than flat, the outer one is taken as the clause." Provide code that handles it.

Let me now also handle: the count color check rgb(163,64,31) — after we tag and CSS applies, colors change; do all detection before styles apply? The style tag applies immediately upon insertion (sync). Detection walks use getComputedStyle which reflects the new CSS → after inserting style, everything with data-fix... but data-fix not yet set, so CSS has no effect until we tag. So detection is safe if we insert style first and tag afterwards. But once we tag staande-zin, its computed font changes — subsequent passes use different signatures (independent elements) — fine. However getal detection happens before tagging (same pass) ✓. Order passes: serif pair + getal first; then others. Aside detection uses Georgia 15px — after tagging leesalinea? Both in same pass, untagged at walk time ✓ (walk fn runs before tagging within each node visit; we tag inside fn — a node tagged 'aside' won't be re-matched as leesalinea because else-if and colors differ anyway ✓).

recordrij detection: 13.5px — unaffected by earlier tags ✓. write-up 13px brown ✓. aim 13px Plex ✓ (aim's own CSS not yet applied since untagged during walk; we tag it inside → later nodes unaffected) ✓.

But careful: after we insert the stylesheet, elements NOT yet tagged keep old styles ✓. Good.

Also: the h=0 aim-regel — px(n)=0; detection by font only ✓.

Also guard: some walkers skip elements inside [data-fix] parents? getal is inside staande-zin; my per-pass walks check !n.hasAttribute(K) for fn — after zin tagged, getal untagged still gets fn calls ✓ (walk recurses into tagged nodes' children — yes, my walk recurses regardless ✓).

But in the serif pass, I collect serifEls via walk with fn that pushes — walk skips fn for tagged nodes; at that point nothing tagged ✓.

Write-up alternative signature: color rgb(61,58,51) & 13px — could there be others? Possibly the recordrij? recordrij is 13.5. OK.

Tab fallback: if none found via class, try: sibling/neighbor of railkiezer with 15px Archivo. I'll add fallback: any Archivo 15px element with px() between 30 and 45 that isn't railkiezer/gutter/specimen. Hmm gutter-open is 49. railkiezer 44 — excluded (it's a select, Archivo 15, h 44 — inside 30-45 range!). Careful: railkiezer gets tagged before tab pass; walk skips tagged fn ✓ (my walk skips fn on tagged). Good. So fallback: first untagged Archivo 15px with height 30–45. Could catch wrong node; note it.

Actually risk: gutter measured at 49 open — >45 ✓ excluded. ladderrij 11.5 ✓. specimen 88 ✓ excluded. So fallback plausible. Fine.

Let me now also think: should tab height use !important height:36px — if tabs are flex items it's fine.

Time to write the answer. Structure:

- The IIFE code block (style string + binder + hand line production).
- "Departures" list.

Keep the explanation tight. Language: the user writes in English with Dutch element names — answer in English, keep Dutch hook names.

Let me finalize CSS text with proper escapes inside JS template literal — I'll use a template literal (backticks) — careful with any backticks inside (none). Use template literal.

Final CSS block (readable formatting inside the string):

```
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
[data-fix="ladderrij"]{font-family:-apple-system,...!important;font-size:11.5px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:14px!important}
[data-fix="leesalinea"]{font-family:Georgia,serif!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important}
[data-fix="marge"]{font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace!important;font-size:11.5px!important;font-weight:400!important;color:rgb(95,88,79)!important;line-height:15px!important;min-height:45px!important}
[data-fix="specimen"]{font-family:-apple-system,...!important;font-size:15px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:16px!important}
[data-fix="decodeerregel"]{color:rgb(184,67,31)!important}
[data-fix="recordrij"]{font-family:-apple-system,...!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;line-height:18px!important}
[data-fix="write-up"]{font-family:-apple-system,...!important;font-size:13px!important;font-weight:400!important;color:rgb(29,29,31)!important;padding-top:0!important;padding-bottom:0!important}
```

JS binder final. Let me write it out cleanly:

```js
  var K = 'data-fix';
  var body = document.body;

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
    })(body);
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
```

findIn(root) starting at children — for the count search inside zin ✓.

Serif pass:

```js
  var serif = [];
  walk(function (n) {
    var c = cs(n);
    if (c.fontSize === '34px' && c.color === 'rgb(38, 34, 29)') serif.push(n);
  });

  var zin = null, claus = null, getal = null;
  serif.forEach(function (n) {
    var count = findIn(n, function (m) {
      return cs(m).color === 'rgb(163, 64, 31)';
    });
    if (count && !zin){ zin = n; getal = count; }
    else if (!zin) zin = n;
    else if (!claus) claus = n;
  });
```

Bug: if first serif el has no count → zin = first; second → claus ✓. If first has count → zin=first; second: !zin false → claus ✓. But if first has count and there are 3 serif els... fine.

Nesting case: if claus wraps zin: walk order — ancestor first. claus has count (descendant getal) → zin = claus ✗. Add pre-filter: remove any serif el that contains another serif el, and use it as claus:

```js
  var wrapper = null;
  serif.forEach(function (n) {
    if (!wrapper && serif.some(function (m){ return m !== n && n.contains(m); })) wrapper = n;
  });
  if (wrapper){
    claus = wrapper;
    serif = serif.filter(function (n){ return n !== wrapper && !wrapper.contains(n) || n === ...; });
  }
```

Getting messy. Simpler: inner = serif.filter(n => !serif.some(m => m!==n && n.contains(m))); then run zin/claus assignment over inner only; wrapper (if any) = claus. And getal found within zin.

```js
  var inner = serif.filter(function (n) {
    return !serif.some(function (m){ return m !== n && n.contains(m); });
  });
  var wrapper = serif.find(function (n) {
    return serif.some(function (m){ return m !== n && n.contains(m); });
  }) || null;

  inner.forEach(function (n) {
    var count = findIn(n, function (m){ return cs(m).color === 'rgb(163, 64, 31)'; });
    if (count && !zin){ zin = n; getal = count; }
    else if (!zin) zin = n;
    else if (!claus) claus = n;
  });
  if (!claus && wrapper) claus = wrapper;
  tag(zin, 'staande-zin');
  tag(claus, 'clausule');
  tag(getal, 'getal');
```

Array.prototype.find ok.

Aside/leesalinea pass:

```js
  walk(function (n) {
    var c = cs(n);
    if (fam(n,'Georgia') && c.fontSize === '15px'){
      if (c.color === 'rgb(139, 133, 122)') tag(n, 'aside');
      else if (c.color === 'rgb(33, 29, 20)') tag(n, 'leesalinea');
    }
  });
```

Railkiezer:

```js
  var rail = document.querySelector('select');
  if (!rail){
    walk(function (n) {
      if (!rail){
        var id = (n.getAttribute('class') || '') + ' ' + (n.id || '');
        if (/rail|zone|kiezer|filter/i.test(id) && cs(n).fontSize === '15px') rail = n;
      }
    });
  }
  tag(rail, 'railkiezer');
```

Tab:

```js
  var tab = document.querySelector('[class*="tab" i]');
  if (tab && cs(tab).fontSize !== '15px') tab = null;
  if (!tab){
    walk(function (n) {
      if (!tab){
        var c = cs(n);
        if (fam(n,'Archivo') && c.fontSize === '15px' && px(n) > 30 && px(n) < 46) tab = n;
      }
    });
  }
  tag(tab, 'tab');
```

But class*="tab" could match 'table' — then fontSize check likely fails, fallback proceeds. OK. Hmm the fallback could grab... after railkiezer tagged (skipped). Candidates: gutter-open 49 excluded, tab real 38 ✓. Fine.

Aim:

```js
  walk(function (n) {
    var c = cs(n);
    if (fam(n,'IBM Plex Mono') && c.fontSize === '13px') tag(n, 'aim-regel');
  });
```

Ladder + marge:

```js
  walk(function (n) {
    var c = cs(n);
    if (c.fontSize === '11.5px'){
      if (fam(n,'IBM Plex Mono')) tag(n, 'marge');
      else if (fam(n,'Archivo')) tag(n, 'ladderrij');
    }
  });
```

Specimen:

```js
  var spec = null;
  walk(function (n) {
    if (!spec){
      var c = cs(n);
      if (fam(n,'Archivo') && c.fontSize === '15px' && px(n) > 60) spec = n;
    }
  });
  tag(spec, 'specimen');
```

Decodeerregel:

```js
  walk(function (n) {
    var c = cs(n);
    if (fam(n,'Archivo') && c.fontSize === '12.5px' && c.fontWeight == '600') tag(n, 'decodeerregel');
  });
```

Recordrij:

```js
  walk(function (n) {
    var c = cs(n);
    if (c.fontSize === '13.5px' && /apple-system|BlinkMac/i.test(c.fontFamily)) tag(n, 'recordrij');
  });
```

Write-up:

```js
  walk(function (n) {
    var c = cs(n);
    if (c.fontSize === '13px' && c.color === 'rgb(61, 58, 51)') tag(n, 'write-up');
  });
```

Gutter:

```js
  var gut = [];
  walk(function (n) {
    var sig = (n.getAttribute('class') || '') + ' ' + (n.id || '') + ' ' + (n.getAttribute('aria-controls') || '');
    if (n.hasAttribute('aria-expanded') || /gutter|rail-toggle|collapse/i.test(sig)){
      var c = cs(n);
      if (c.fontSize === '15px' && /apple-system|BlinkMac|Archivo/i.test(c.fontFamily)) gut.push(n);
    }
  });
  gut.forEach(function (n) {
    if (n.hasAttribute('aria-expanded')) tag(n, 'gutter');
    else tag(n, px(n) > 40 ? 'gutter-open' : 'gutter-dicht');
  });
```

Wait: railkiezer has aria-expanded maybe? Rail selector might. If railkiezer matched here it's already tagged → walk skips fn for tagged ✓ (walk checks hasAttribute). But if railkiezer wasn't tagged earlier (no select found)... edge; accept.

Hand line:

```js
  if (!document.querySelector('[data-fix="handregel"]')){
    var hand = document.createElement('span');
    hand.setAttribute(K, 'handregel');
    hand.textContent = 'Click an airline or an airframe to follow it.';
    var aim = document.querySelector('[data-fix="aim-regel"]');
    if (aim) aim.insertAdjacentElement('afterend', hand);
    else if (rail) rail.insertAdjacentElement('afterend', hand);
    else body.appendChild(hand);
  }
```

Note: handregel display:block in CSS.

One more: the CSS for write-up padding — if write-up has padding from shorthand, padding-top/bottom:0!important overrides ✓.

Also ensure style insertion before detection — but careful: inserting <style> changes nothing until attributes set ✓.

Also potential issue: walk() starts at body — if the IIFE runs before body exists (in head), defer: wrap in DOMContentLoaded check. Add:

```js
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
```

I'll structure with init().

Departures list — concise. Also mention: all colours used are from the measured original (white on the tab comes from the original's own computed value, not the palette list); no new colours introduced.

Also mention Instrument Serif is only named, not re-loaded — per their finding the link is already there. Same for IBM Plex Mono/Archivo already on page (aim-regel proves Plex is loaded; Archivo used in decodeerregel ✓).

Write the answer: brief intro line? "No preamble" — just the code and departures. Give the code block then "Departures" section.