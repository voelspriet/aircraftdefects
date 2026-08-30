Let me work through this carefully. The user is giving me a very specific brief about a page I apparently can't see, but they've given me verbatim markup excerpts and measured facts. I need to produce two fenced blocks, CSS then JS, replacing my previous "43 block" whole.

Key constraints:
- Only write selectors that exist in the markup shown: `.vgroups`, `#vstrip`, `.vg`, `.vglab`, `.vgbtns`, `.vtab`, `.lrow` (with `.zone`), `.lrow .lb`, `.lrow b`, `.bar`, `.bar i`, `i` inside `.lrow`, `.phstrip`, `.phmo`, `.phmo i`, `.phmo span`, `.aim`, `#iAim`, `.ipad`, `#sdControls`, `#case-wrap`, `#case-box`, `.rr-sheet-lock`, `.gv` (mentioned as fixed previously — keep it), `.aim` hover reservation (keep), `.vtab` tap targets (keep), `html, body` background (keep).
- Keep working fixes: truncation fix on `.gv`, hover reservation on `.aim`, tap targets on `.vtab`, html/body background.

Four faults to fix:

**Fault 1: `.vglab` label runs under buttons.** `.vglab` is `white-space:nowrap` at fixed 194px (flex: 0 0 auto). The sentence runs past its box under the buttons. Fix: allow wrapping — `white-space: normal`. But `.vglab` is `flex: 0 0 auto` with width 194px — if text wraps within 194px, that's fine. But wait, the label "These ignore your selection. Each answers from all 1,757,827 reports, or from a slice you set inside the panel" is a long sentence. At 194px wide it would wrap to many lines, making the strip very tall. The strip must stay at or under 130px total height. Hmm. The text at ~10px font... 194px wide, that sentence is maybe 110 characters. At 10px font, average char ~5px, that's ~550px of text, wrapping into ~3-4 lines at 194px width. Line height maybe 14px, so ~4 lines = 56px. Buttons are 24px tall. Three `.vg` groups in a row (flex-direction: row on `.vg`, and `.vgroups` presumably contains three `.vg`... wait, computed says `.vg` is display:flex; flex-direction:row; gap:10px; flex-wrap:nowrap. So each `.vg` is a row of [label][buttons]. The three `.vg`s are presumably stacked vertically (vgroups is probably column). Total strip ≤ 130px with 3 groups: each group gets ~43px. A wrapped label of 4 lines at 12px line-height = 48px would exceed. Hmm.

Alternative: "or give the row a width that fits it". Let the label's natural text width fit — i.e., remove nowrap and let flex size it? But the measured overlap is 10x7px — the label text runs just 10px past its 194px box. Actually wait: `<b>1,757,827</b>` at (481,1255) width 50, so label box ends at 481+... the label box is 194px wide; text runs to maybe 504? Button starts at 520... hmm, they overlap by 10x7. The b element at x=481 width 50 ends at 531; button at 520 — overlap 11px. So the text overflows ~11-37px past its box.

Options: 
1. `white-space: normal` on `.vglab` — text wraps inside 194px. Height concern: strip must stay ≤130px.
2. Widen `.vglab` so the nowrap text fits — `flex: 0 0 auto; width: auto;` or set width to max-content. But `.vglab` width 194px seems deliberately fixed; if I change width to max-content, the label takes its natural width (~560px?) and the buttons shift right. That could cause horizontal overflow at 768? The strip is inside... unknown container. Risky for the "no horizontal overflow at 768" requirement. Also there are 16 buttons; at 768px, label ~550px + buttons would overflow.

Hmm. Actually maybe the labels differ per group; the quoted one is long. Let me think about heights. If `.vglab` wraps: the longest label determines group height. "These ignore your selection. Each answers from all 1,757,827 reports, or from a slice you set inside the panel" — roughly 105 chars. At font-size maybe 10px (the b is 10px tall box, 50px wide for "1,757,827" = 9 chars, so ~5.5px/char, font ~11px?). At 194px width, ~35 chars/line → 3 lines... plus more. Say 4 lines × 13px = 52px per group → 3 groups = 156px > 130. Too tall.

Hmm, but maybe the strip at ≤130px means the whole `#vstrip`. With three groups stacked, each currently ~24px (buttons) → ~92px with gaps. To fit 130px, labels can be at most ~2 lines each (2×13=26 + padding). Wrapping the full sentence into 2 lines at 194px isn't possible.

Alternative: give the row a width that fits — set `.vg { flex-wrap: nowrap }` already; set `.vglab { width: auto; flex: 0 0 auto; white-space: nowrap; }`? Then the label takes natural width. The overlap disappears. But horizontal overflow risk at 768. Where does the strip sit? It's a "tab strip, three groups" — 16 buttons. Total width at 768: three groups each ~label+buttons... If all three `.vg` are stacked vertically (vgroups column), each row is label(~naturall width) + gap + buttons. The quoted label natural width ~570px at 10-11px font. Plus 16 buttons spread across three groups... at 768px that's tight. Buttons "Fleet" 45px; 16 buttons, say avg 60px, per group ~5-6 buttons ≈ 330px + label 570 = 900px > 768. Overflow.

So neither pure wrap (too tall) nor pure nowrap-auto-width (too wide) works alone. Combination: let the label wrap but reduce the font/line-height? Or shrink the text: `font-size` smaller? Can't go too small.

Wait — re-read: "Either let it wrap inside its width, or give the row a width that fits it. The strip must stay at or under 130px in total, which the gate also checks."

Hmm, maybe the labels are shorter than I think. The quoted label is the visible text of the first `.vglab`. Let me estimate more carefully. The b "1,757,827" is 50px wide for 9 characters → ~5.6px/char average for digits at whatever font-size. Digits at font-size 11px in most fonts are ~6.1px; at 10px ~5.6px. So font ≈ 10px. The sentence: "These ignore your selection. Each answers from all 1,757,827 reports, or from a slice you set inside the panel" = let me count: "These ignore your selection." (28) " Each answers from all " (~23) "1,757,827" (9) " reports, or from a slice you set inside the panel" (~50). Total ≈ 110 chars. Mixed-case prose averages ~0.5em per char → ~5px/char → ~550px natural width. At 194px → ~2.9 → 3 lines minimum, likely 4 with word-break inefficiency. At line-height 1.2 → 12px/line → 48px. Three groups: label heights 48, ?, ? — other labels unknown but presumably similar. 3×48 + 2×gap(10) = 164px > 130. Fails.

Hmm, unless the `.vg` groups are laid out horizontally?? "computed now: .vg display:flex; flex-direction:row; gap:10px; flex-wrap:nowrap" — the .vg itself is a row (label + buttons side by side). And `.vgroups` — unknown direction. If `.vgroups` were a row, three groups side by side... at 1440 with label 194 + buttons... 3×(194+330+10) ≈ 1600 > 1440. And the fault coordinates: label at y=1255, button at y=1238 — same row. Doesn't tell us about other groups.

Actually, maybe I can make the label wrap AND shrink: `.vglab { white-space: normal; font-size: 9px; line-height: 1.15; }`? 110 chars at 9px → ~4.5px/char → 495px → 3 lines at 194px → 3×10.35 ≈ 31px per group → 3×31+20 = 113px ≤ 130. That could work but tiny text is ugly. Hmm, but honestly this is a gate-checked scenario; the grader measures strip height ≤130 and no overlap.

Alternatively: keep nowrap but give the row width that fits by shrinking... no.

Another angle: "or give the row a width that fits it" — maybe set `.vg { flex-wrap: nowrap }` (already) and let `.vglab` width be auto with nowrap, and the strip... the strip is `#vstrip` — where is it? Maybe it's inside a panel with its own width. If `.vgroups` is column and page width 1440, a 550px label + buttons per row fits at 1440 and 1024, and maybe at 768 it overflows → violating "no horizontal overflow at 768". Unless the strip is inside something scrollable... but I can't add overflow to body; a local overflow-x:auto on the strip container would be allowed? The gate says "no horizontal overflow at 768" — presumably document.scrollWidth ≤ clientWidth. An inner scroll container doesn't expand the document. Hmm, but "no text is cut off at 1440" — a scrollable strip at 1440 might cut text.

This is getting speculative. Let me reconsider: maybe wrapping is the intended fix and my height estimate is too pessimistic. Let me recompute: at 390px the phone strip exists; the vstrip is the desktop tab strip. Measured: vglab box height? Not given. b is 10px tall (50×10). Buttons 24px tall at y=1238; label text at y=1255 (baseline-ish of the b's box top?). The b at (481,1255) 50×10 — so label text sits 17px below button top; buttons are 24px, so buttons span 1238–1262; the b spans 1255–1265. They overlap vertically by 7px. So the label is vertically centered or aligned such that text baseline is low. The label box (194px) — its top? If the text is one line and the label box were, say, top-aligned with buttons... The overlap being only 7px vertically suggests the label text line is near the bottom of the button row.

OK. Let me just commit to: `.vglab { white-space: normal; }` plus control line-height, and possibly allow the label to be a bit wider. Actually — "give the row a width that fits it": another read: the ROW (.vg) width doesn't fit the label; give the row (i.e., .vg or .vgroups) a width that fits the label. Hmm, or "give the label a width that fits it": `width: max-content` but that's the overflow problem.

Wait, maybe there's a third option: shrink the nowrap overflow by reducing only slightly. The overflow is tiny — the b ends at 531, button starts at 520, overlap 11px. The text's natural width exceeds 194px by maybe 40px (text ends ~534). If I just add `padding-right` — no, that doesn't stop overflow with nowrap. If I reduce letter-spacing slightly: `letter-spacing: -0.02em` → saves ~0.2px × 110 chars = 22px. Not quite 40. Combined with `word-spacing: -1px` (~18 spaces → 18px) → total ~40px. That's hacky and fragile, and the checker "1 of 114 controls shifts" style measurement... Overlap 10×7 would need text to end before 520. Text currently ends ~531-534. Need to save ~14-15px. Letter-spacing -0.02em on 10px font = -0.2px/char × ~110 chars = 22px. That alone might do it. But this is fragile hackery; graders likely measure the b's rect vs button rect. Saving 22px moves b's end from 531 to 509 < 520. Works. But "no text is cut off" — nowrap text isn't cut, it overflows visibly (or is clipped?). Actually if it currently overlaps the buttons, it's overflowing its box visibly.

Honestly, the cleanest robust fix respecting both constraints (≤130px height, no overflow at 768+): let the label wrap, and manage height. Let me think about what the other two labels might say. We only see one. Risky either way.

Hmm, what about making the label wrap but giving it more width? `.vglab { white-space: normal; width: auto; flex: 1 1 auto; min-width: 0; }` — then the label takes remaining space next to buttons, wrapping as needed. Row width = container width. At 1440: label gets 1440 - buttons(~330) - gaps ≈ lots of width → 1-2 lines. At 768: label gets 768 - 330 - 10 ≈ 428px → 110 chars × 5px = 550px → 2 lines → 24-26px. Three groups ≈ 3×26 + 2×10 + padding ≈ 98-110px ≤ 130. 

But wait — flex: 1 1 auto changes layout: buttons would be pushed to the right edge if the container is wider than content? Only if the container has extra width and label grows. `.vg` is flex row with nowrap; if `.vg`'s width is determined by content (auto), flex-grow does nothing (no free space). If `.vg` stretches to container width (e.g., `.vgroups` is column with align-items: stretch, default), then `.vg` is full-width and flex:1 on label pushes... actually label first, buttons after; with flex:1 label, buttons go to the far right. Buttons at far right at 1440 — fine visually? The overlap certainly goes away since label box no longer overlaps buttons (flex distributes without overlap). And wrapping happens within the label's share. Height: at 768, label gets whatever's left. If buttons total is bigger than I think, label could get squeezed to 2-3 lines → still ≤ 130 total likely.

But risk: what if `.vgroups`/`.vg` current widths are content-based and my flex change makes buttons jump to the right edge of a wide panel, which is fine for the gates. Gates: strip ≤130px height, 16 vtab, 3 vglab present, no overlap (implied by fault 1 fixed — the gate presumably re-measures overlap), no cutoff at 1440, no overflow at 768/1024/1440.

Hmm wait, "no text is cut off at 1440" — that was the `.gv` truncation fix presumably (gv = some value cells). Keeping that.

Actually, let me reconsider a simpler, more conservative fix that the brief itself suggests first: "let it wrap inside its width" = `white-space: normal` keeping width 194px. Height: longest label wraps into N lines. If labels are ~110 chars → 3-4 lines at 10px font, line-height normal (~1.15-1.2 for small text) → 35-48px. Three groups → 105-144 + gaps 20 + padding. Marginal vs 130. With `line-height: 1.15` and `font-size: 10px`: 4 lines = 46px → 138+20=158. Fails possibly.

Unless... the strip's height gate: "the tab strip at or under 130px" — maybe measured as #vstrip height. Currently ~92px (3×24 + 2×10). Budget for growth: 38px, i.e., 12-13px per group → labels get roughly 1 extra line each. If each label wraps to exactly 2 lines at 194px... 110 chars at 194px width ≈ 194/5 ≈ 39 chars/line → 110/39 ≈ 2.8 → 3 lines. 3 lines × 11.5 = 34.5 vs button 24 → +10.5 per group → +31.5 total → 92+31.5+... ≈ 123.5 + gaps already counted... Actually current 92 = 3×24 + 2×10. New: 3×34.5 + 20 = 123.5 ≤ 130. Just fits! If a label needs 4 lines → 46px × 3 + 20 = 158. Fails.

Too tight to bank on. The flex:1 approach gives labels more width, fewer lines. Or combine: `white-space: normal` + `width: auto` + `flex: 1 1 auto; min-width: 0`. At 1440 in a wide panel, each label is one line probably; at 768 maybe 2-3 lines but the buttons wrap? `.vgbtns` — unknown layout; if buttons row is wider than available at 768, `.vg` row (label + buttons) with nowrap would overflow → horizontal overflow at 768! Hmm. `.vg` has flex-wrap: nowrap. If label flex-shrinks (flex: 1 1 auto, min-width 0), it can shrink, wrapping text more. Buttons `.vgbtns` — does it shrink? Buttons would need `flex-wrap: wrap` to fit. I don't know `.vgbtns` computed style. If `.vgbtns` is also flex nowrap with 5-6 buttons ≈ 330px, then at 768: label min could shrink to near 0 but text would become a tall column → height blows past 130.

Ugh. Without seeing the page, I must make reasonable choices. Let me think about what's most likely the actual page. This seems to be a generated test scenario ("gate", "rounds", measured coordinates). The gates are concrete:

1. no text cut off at 1440 (`.gv` fix retained)
2. html/body one background
3. #vstrip height ≤130, contains 16 .vtab and 3 .vglab
4. no horizontal overflow at 768/1024/1440 (document.scrollWidth ≤ clientWidth)
5. case sheet untouched
6. 380 month bars on desktop strip (don't touch .phstrip on desktop? Actually .phstrip is the phone strip "below 760px". The 380 bars are on "the desktop strip" — a different element, maybe `.strip`? No — `.strip` doesn't exist. Hmm, "380 month bars on the desktop strip" — maybe the month bars are `.bar i` inside `.lrow`? No, those are zone bars. Wait, "The phone month strip, below 760px: .phstrip with .phmo buttons" — so the desktop month strip is something else that shows 380 bars. Since `.phstrip` only shows below 760px, at ≥768 it's hidden (display:none presumably) and the desktop strip (unknown name, possibly canvas or a different container) shows 380 bars. I must not break it. Since I don't know its selector, I just don't touch month-related desktop stuff.

Wait — careful: is the desktop month strip one of the selectors I know? The known markup pieces: vgroups/vstrip, lrow zone, phstrip, aim, ipad, sdControls, gv, case-wrap/case-box/rr-sheet-lock. The 380 month bars desktop strip might be rendered in canvas or some element not named. Fine — leave alone.

7. no runtime errors.

Faults:

**Fault 1 fix**: I'll go with letting `.vglab` wrap within a flexible width: 

```css
.vg { flex-wrap: nowrap; align-items: flex-start; }
.vglab { white-space: normal; flex: 1 1 auto; width: auto; min-width: 0; line-height: 1.25; }
```

Hmm, but changing flex-grow could push buttons right in a stretched `.vg`. Is that bad? The gate checks overlap of label vs buttons. With flex layout, siblings never overlap. Safe for the fault. Height: labels get max available width. At 1440, `.vg` row: label + gap 10 + buttons. If `.vg` width is content-driven, flex-grow is inert, and label with `flex: 1 1 auto` sizes to... flex-basis auto → content size, but white-space: normal means max-content ~550px. shrink allowed. OK.

Actually wait, maybe simpler and most predictable: keep the label's fixed 194px, allow wrap, and cap the strip height concern by reducing line-height and ensuring it fits. The brief explicitly blesses either approach; the gate checks ≤130. The safest for the height gate is giving the label MORE width (fewer lines). The safest for width gate is keeping nowrap→wrap within bounds.

Compromise: `.vglab { white-space: normal; width: auto; flex: 0 1 auto; min-width: 0; max-width: 194px; }`? With flex-basis auto and shrink, at narrow widths it shrinks below 194. max-width 194 caps it at 194 so layout stays close to original. Then lines: at 194px, ~3 lines for the long label → 3×(10×1.2)=36px per group → 3×36+20 = 128 ≤ 130. Whew, right at the edge. Line-height 1.15 → 34.5×3+20 = 123.5. But font-size might be larger than 10px... b box height 10 suggests font-size ~13-14? Hmm, inline box height ≈ font-size roughly (the b's rect height 10px suggests font-size ~10px, or it's a small caps number). Actually for inline elements, getBoundingClientRect height ≈ line-height or font ascent+descent. 10px height → font-size ~10px (with line-height maybe larger but rect is the em box-ish... actually inline rect height = font's content area, roughly 1.15×font-size in some fonts... could be font-size 8-9? Unlikely). Let's say font-size 10px, line-height ~11.5-12px.

Hmm, honestly, another thought: maybe simplest is to just let the whole thing be: `white-space: normal` on `.vglab` and let the chips fall — if the checker's labels wrap to 3 lines each, total ≈ 124px ≤ 130. And "the three group labels and sixteen buttons all stay" — count preserved.

I'll do both belt and braces: allow wrap, and slightly reduce line-height, and also nudge the label wider isn't possible (fixed layout). Let me write:

```css
#vstrip .vglab { white-space: normal; line-height: 1.2; }
```

Keep width 194 fixed (flex: 0 0 auto already). This directly implements "let it wrap inside its width."

Risk: height >130 if labels are long. Alternative with width: I could also allow the label to grow a little: `width: 240px`? That changes button positions (buttons shift right 46px). At 768: currently does the strip fit? Unknown. Buttons per group ~5-6. Label 240 + buttons 330 = 580 per row; rows stacked → fits 768 easily. And 240px width → 110 chars / (240/5=48) ≈ 2.3 → 3 lines... still 3 lines. 220px→ 2.5 → 3 lines. To get 2 lines need ~275px+ (110 chars ×5.5 = 605px / 2 = 302px per line). So width 310px → 2 lines → 24px per group → total 3×24+20 = 92px. Same as before! Nice. And at 768: 310 + 330 + 10 = 650 ≤ 768. Fits! At 1440 obviously. But is `.vg` inside a container narrower than 650 at 768? Unknown — the strip could be in a sidebar. Hmm, the strip contains 16 buttons; the gate "tab strip at or under 130px" — I don't know its container width. The measured label at x=481 suggests the strip starts around x=280-480? The b at x=481... `.vglab` 194 wide → label box starts ~340? (text ends 531, box 194 → box starts 337 if text fills box... text overflows so box start = 481 - (some offset). Unknown. If the label box starts at x≈337, the strip might be in a right panel starting ~330. At 768 viewport, a panel starting at 330 with 650 width → overflow to 980 > 768. Risky!

OK here's the thing: I'm over-engineering with guesses. The brief says: "Either let it wrap inside its width, or give the row a width that fits it." Both blessed. The one that doesn't risk horizontal overflow at 768 is "let it wrap inside its width" — width stays 194, no new horizontal demands. The height gate 130 is the tension. To maximize the chance it fits: set line-height tight and font-size unchanged. If label is 3 lines: fine. If 4 lines: 4×12=48×3+20=164 fail. 

Can I hedge? `white-space: normal` + `hyphens: auto`? Doesn't reduce lines much. Reduce font-size by 1px? `.vglab { font-size: 9px; line-height: 1.2 }` → 10.8px/line; 110 chars at 4.5px/char = 495px / 194 ≈ 2.55 → 3 lines → 32.4 → total 117. If 4 lines → 43 → 149. Still fail on 4 lines.

What if I let the label take the full row and the buttons wrap below? `.vg { flex-wrap: wrap }` — then label width 100%? No, label is flex 0 0 194... The brief says "the three group labels and sixteen buttons all stay" and computed .vg shows nowrap — I could change to wrap: `.vg { flex-wrap: wrap; }` and `.vglab { white-space: normal; flex: 1 1 100%; }` → label on its own line full width, buttons below. Height: label 1-2 lines (full row width) + buttons 24. At 1440 full-row width maybe 800px → 1 line (12px) + 24 + gap = ~46 per group → 3×46+20 = 158 > 130?? Hmm no: 3 groups each (12 + 10 gap? .vg gap 10 applies between label and buttons) = 12+10+24 = 46 → ×3 = 138 + 20 (vgroups gap?) = 158. Fail. Unless line-height makes label 12px... it's 46×3. Fail.

What about label inline with buttons but wrapping, full width: `.vglab { flex: 1 1 auto; min-width: 0; white-space: normal; }`, buttons keep natural width. Row = label + buttons on same line. At 1440 (assume .vg stretches to some panel width ~800): label gets 800-330-10=460 → 550px text → 2 lines → 24px. Group height 24 (buttons) ≥ label 24 → 24? Label 2 lines = 24 ≈ buttons 24 → group 24-26. Total 3×26+20 = 98 ✓. At 768 (panel maybe 700): label gets 360 → 2 lines... 550/360 → 2 lines ✓ 24px → 98 ✓. At very narrow (not gated, phone has phstrip instead — vstrip may be hidden below 760!). Yes! "The phone month strip, below 760px" — the phone layout replaces things below 760px. The gates check overflow at 768/1024/1440 — at 768 the desktop layout applies. So the narrow case is ≥768 only. 

But the danger: if `.vg` does NOT stretch (width: max-content as flex item of a column vgroups... if vgroups is column with align-items default stretch, .vg stretches full width — good. If align-items: flex-start, .vg is content-sized → flex:1 inert → label max-content 550 nowrap? No, white-space normal → max-content 550 → total 550+330=880 → at 768 overflow!). Hmm, with flex-shrink 1 it can't shrink below... if the .vg itself is content-sized there's no constraint forcing shrink.

I keep going in circles without knowing `.vgroups`'s layout. Given the class names ("vgroups", "vg" = vertical groups?), vgroups is likely `display:flex; flex-direction:column` and each `.vg` stretches full width (align-items default stretch). That's the common pattern. Then `.vg` is full width, and currently `.vglab` has fixed 194px width + nowrap overflowing. Giving `.vglab { flex: 1 1 auto; min-width: 0; white-space: normal; }` makes it take the rest of the row. Buttons stay after it — they'd move to the right edge? No! Buttons come after the label in the row; with label flex-grow, buttons get pushed to the far right end of the row. Visually different but gates don't check button x-position, only presence and overlap and height and overflow. And "no text is cut off at 1440" — label wraps, not cut.

Hmm wait, actually there's a subtle risk: with label growing and buttons pushed right, at some width the buttons... no overlap ever with flex. Fine.

Alternatively keep it minimal: `.vglab { white-space: normal; flex: 0 1 auto; width: auto; max-width: 194px; min-width: 0; }`. If .vg stretches, label basis auto = max-content 550, but max-width 194 caps → 194, shrink allowed at narrow. Lines ≤3-4. Same height question. 

Decision: go with grow-into-row approach: label wraps within whatever the row gives it. Add `line-height: 1.25`. Height at 3 lines ≈ 37.5 vs buttons 24 → group 37.5 → total ~132? Ugh, marginal. line-height 1.2 → 36 → 128. 

Hmm, let me reconsider once more. Maybe I'm overestimating the label length. "These ignore your selection. Each answers from all 1,757,827 reports, or from a slice you set inside the panel" — count precisely:

"These ignore your selection." = T-h-e-s-e(5)+1+i-g-n-o-r-e(6)+1+y-o-u-r(4)+1+s-e-l-e-c-t-i-o-n-.(10) = 5+1+6+1+4+1+10 = 28
" Each answers from all " = 1+4+1+8+1+4+1+3+1 = 24 → wait: space(1)Each(4)space(1)answers(7)space(1)from(4)space(1)all(3)space(1) = 23
"1,757,827" = 9
" reports, or from a slice you set inside the panel" = space(1)reports,(8)space(1)or(2)space(1)from(4)space(1)a(1)space(1)slice(5)space(1)you(3)space(1)set(3)space(1)inside(6)space(1)the(3)space(1)panel(5) = 50
Total ≈ 28+23+9+50 = 110 chars. Yes ~110.

Average prose char width ≈ 0.48-0.52em. At font-size 10px → ~5px → 550px natural. Confirmed.

Given the grow approach at 768 with, say, panel width 700: label gets 700-330-10=360 → 550/360 → 2 lines. Good.

But what if the other two labels are longer? "three group labels" — the first is the "These ignore your selection..." note (a general explanation). Others might be shorter ("Answer from a slice:" etc.). Can't know. The grow approach maximizes width per label → minimizes lines. That's the best hedge for height.

Final for fault 1:
```css
.vg { align-items: center; }  /* hmm, maybe not; keep default */
.vglab { white-space: normal; flex: 1 1 auto; width: auto; min-width: 0; line-height: 1.2; }
```
Should I include `.vg { flex-wrap: nowrap; }`? Already computed nowrap; leave.

Wait, one more consideration: with flex: 1 1 auto, if the row has extra space, buttons go to right edge — at 1440 in a wide panel, buttons scattered far right. Does any gate check "16 .vtab" positions? No. Visual aesthetics: buttons at far right of each row is actually a reasonable design (label left, buttons right). Acceptable.

Also `min-width: 0` needed so it can shrink below content at 768.

Hmm, actually also consider: what if `.vglab`'s fixed width 194px comes from an inline style or a more specific rule? The brief says "computed now: .vglab flex:0 0 auto; white-space:nowrap; width 194px". My CSS must override whatever sets it. I'll write `flex: 1 1 auto !important`? Avoid !important if possible; my block is appended so it wins ties by cascade order for equal specificity. But the original might use higher specificity. I'll use `#vstrip .vglab` (id + class) for specificity 1-1-0, likely beats `.vglab` (0-1-0). Safe. Similarly `#vstrip .vg`.

**Fault 2: phone strip overflow at 390.** `.phstrip` contains 8+ `.phmo` buttons 44px wide in a non-wrapping row → document scrollWidth 698 vs 390. Fix: make the strip scroll horizontally inside its own box:

```css
.phstrip { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; flex-wrap: nowrap; }
```

"scroll it inside its own box, or wrap it, but do not drop bars and do not let the body scroll sideways." Overflow-x: auto keeps all months (scrollable). Must ensure the strip itself doesn't exceed 100% width: if `.phstrip` is a block div, width is constrained by parent; the buttons overflow because... if buttons are in normal flow (inline-flex or flex), they'd overflow the div but the div's width is 390 — then why does document scrollWidth grow to 698? Because overflow is visible, descendants paint/extend scrollable area. Setting `overflow-x: auto` on `.phstrip` contains them → scrollWidth of document returns to 390. ✓. But gates check overflow only at 768/1024/1440 (where phstrip is hidden below 760... wait, "below 760px" the phone strip shows; at 390 it shows and overflows). The fault is measured at 390. The "must still be true" list says no overflow at 768/1024/1440 — phstrip hidden there presumably (the desktop strip with 380 bars shows instead). So my fix only needs to handle ≤760.

Also add `max-width: 100%` and maybe `width: 100%`. And ensure `.phmo { flex: 0 0 auto; }` so they don't shrink weirdly — actually shrinking would drop... no, shrinking keeps them present but squished; scroll is better. I'll set `.phstrip { display: flex; flex-wrap: nowrap; overflow-x: auto; max-width: 100%; }` and `.phmo { flex: 0 0 auto; }`. But careful: if .phstrip is currently display:flex already (buttons "laid in a row"), re-declaring display:flex is harmless. If it's display:inline-flex or block with inline-block children, changing to flex is mostly harmless. I'll write conservatively:

```css
.phstrip { max-width: 100%; overflow-x: auto; overflow-y: hidden; }
.phmo { flex: 0 0 auto; }
```

The `.phmo { flex: 0 0 auto }` only matters if it's a flex container; harmless otherwise. Also add `-webkit-overflow-scrolling: touch;` optional. Also `scrollbar-width: thin`? Not needed.

Wait — but does the checker measure "the strip must keep all its months": count of .phmo buttons unchanged ✓ (we hide nothing). Also "380 month bars on the desktop strip" — desktop strip untouched ✓.

One more thing: overflow-x: auto on phstrip — if the parent of phstrip also overflows... document scrollWidth is what's gated. Containing the strip's overflow fixes document scrollWidth at 390. But is 390 gated? The fault says "at 390px: scrollWidth 698, clientWidth 390" and "At 768, 1024 and 1440 there is no horizontal overflow at all, and that is better than the parent, which breaks at 768 and doubles at 390." Hmm — "that is better than the parent, which breaks at 768" — the parent (my previous block?) breaks at 768?? Wait: "At 768, 1024 and 1440 there is no horizontal overflow at all" — describes the current page (after my last block). "and that is better than the parent, which breaks at 768 and doubles at 390" — the parent = the previous version before my block? Or the parent element? I think it means: the current state (with my last block's fixes) has no overflow at 768+, which is better than the original page which broke at 768. So requirement: keep no-overflow at 768+, AND fix 390. Good, my plan holds.

**Fault 3: one :hover moves the page.** "Look for a :hover that changes height, padding, border, font-size or display on something in the page flow." I can't see the page's hover rules. I need to guess which selector. Known interactive things: `.lrow` (role=button, tabindex) — likely has a hover that adds padding or border! `.lrow.zone` rows with bars — a hover that brightens might add `border-left` or change padding. Also `.vtab:hover`, `.phmo:hover`, `.gv`... `.lrow` is the most likely candidate for a hover that changes a box (e.g., `.lrow:hover { padding-left: 6px }` or `.lrow:hover { border ... }` or transform? transform doesn't shift layout). "worst single move 485.1px" — a single control shifts by 485px?! That's huge — suggests something like `display` change or a big element appearing, or... 485px shift of a control's position. If a hover on some element expands something above it (e.g., a details-like reveal), things below move 485px. Hmm, "One hover still moves the page... 1 of 114 controls shifts the layout, worst single move 485.1px. The parent moves nothing at all." So hovering control X causes some other element (or X itself?) to move 485px. If a :hover expands a container (e.g., `.lrow:hover .bar i { ... }` no...). 

What could move something 485px? Maybe a hover that changes `position` from static to fixed? Or reveals a hidden panel (display:none → block) pushing content. Or changes `height` of a big element.

Since I can't know, I should write defensive CSS that neutralizes layout-affecting hover on the elements I know exist. The candidates among known selectors: `.lrow`, `.vtab`, `.phmo`, `.bar i`, `.lb`, `.gv`, `.aim`. My previous block already reserved hover on `.aim`. The remaining one — since the checker says "A synthetic mouseover on every control finds no shift, so the one that remains is driven by a CSS :hover rule that changes a box". Among controls tested (114), one shifts. Which known control could have a box-changing hover? `.lrow` is role=button — very likely has `.lrow:hover` styling. A common pattern: `.lrow:hover { background: ...; padding-left: 8px }` or `.lrow:hover b { ... }`. A padding-left change on `.lrow` would shift its children but not by 485px. 485px is dramatic. What about `.lrow:hover .bar { width: ... }`? Hmm.

Alternative: the hover could be on something whose hover rule changes `height` of a tall container. E.g., `.lrow:hover` expands the row showing detail → rows below move down by 485. Or a hover that toggles `display` on a child.

Defensive strategy: for the elements I can name, force hover changes to be non-layout:

```css
.lrow:hover, .lrow:focus { padding: same as base? }
```
I don't know base padding. Better: use a technique — I can't easily neutralize unknown padding without knowing base values. 

Alternative robust approach: JS that scans stylesheets for :hover rules that change layout properties and rewrites them at runtime! That's feasible from an appended block: iterate `document.styleSheets`, read cssRules, find rules whose selectorText contains ":hover" (or :focus/:focus-visible) and whose style changes height/padding/margin/border-width/font-size/top/left/width/display/flex-basis/line-height, then override the layout-changing declarations. How to override? Can't delete individual declarations from a CSSStyleRule easily... Actually you CAN modify rule.style: `rule.style.removeProperty('padding')` — yes! CSSStyleDeclaration on a rule is live and editable. So JS: walk all stylesheet rules; for rules with :hover (and :focus-within? keep scope to :hover as the brief says) in the selector, remove layout-affecting properties (height, min-height, max-height, width, min-width, padding, margin, border-width, border-*, font-size, line-height, display, flex-basis, top, left, right, bottom — careful: top/left changes on absolutely positioned things don't shift the page but do move the element... the checker measures control rect shifts; but brief says "changes a box... height, padding, border, font-size or display on something in the page flow"). Removing those declarations from hover rules makes the hover cosmetic-only (colors, shadows, transforms remain). That's a general, honest fix "at the source" (the stylesheet), not a runtime strip of DOM.

Risk: removing `display` from a hover rule that intentionally shows a hidden submenu — but brief says make the change one that does not affect layout; the checker wants no shift. Also risk: touching stylesheets from another origin → wrap in try/catch. Also the case sheet styles — hover rules in locked sheet? Try/catch each rule access.

But wait — the brief says "Look for a :hover that changes height, padding, border, font-size or display on something in the page flow, and make the change one that does not affect layout." A targeted CSS fix would be better if I knew the selector. Since I must not invent selectors, the stylesheet-sanitizing JS is attractive: it only touches rules that actually exist. And I can be surgical: only remove layout properties from :hover rules. Should I also handle :focus-visible? The missed-selectors list mentioned `.mo:focus-visible i` was among my phantom selectors — so the page has focus-visible somewhere? Not necessarily. Keep to :hover per the brief, maybe include :focus too? The fault is specifically hover. I'll do :hover only (and mention). Hmm — but "1 of 114 controls shifts" — the checker synthesizes mouseover; a focus-triggered shift wouldn't be caught. Fault says hover. OK.

Which properties to strip from :hover rules: 
- padding, padding-top/right/bottom/left
- margin, margin-*
- height, min-height, max-height, width, min-width, max-width
- font-size, line-height
- border-width, border-top/right/bottom/left-width, border (shorthand — if shorthand sets color+width, removing whole border also removes color change; acceptable? The brief wants no layout shift; removing border shorthand kills the color effect too. Better: for border shorthand, we can't selectively keep color via removeProperty. Option: read the shorthand, re-set only the color parts: rule.style.borderColor = computed? Complicated. Simpler: replace layout props; for 'border', 'border-top' etc. shorthands, read their width component... Let me just handle: for each property in a blocklist of shorthands+longhands, remove it; then if a shorthand like 'border' was removed and it had a color, re-apply color: I can read the value before removing: e.g., value "2px solid red" → set rule.style.border = '0 solid red'? Wait, that sets border-width 0 — but base (non-hover) border-width might be 2px, so hover would set width 0 → layout shift (element shrinks 2px). Setting `border-width: 0`? Base might be 0 already. Hmm.

Better approach: instead of removing, force width-neutral values: for any border shorthand/width in a hover rule, rewrite it as `box-shadow` equivalent? Too fancy. 

Pragmatic: change border-width-affecting declarations to keep the width but... we don't know base width. The safest universal: convert border color changes: parse the shorthand value; if it contains a width, keep width only if it equals base width — can't easily know base.

Simplest robust: remove the whole border declaration from hover rules, then re-add the color as box-shadow inset? E.g., value "2px solid #abc" → remove 'border', add... can't add per-selector easily? I CAN: rule.style.setProperty('box-shadow', 'inset 0 0 0 2px #abc')? But the rule already might have box-shadow. Overwriting could clobber. 

Given this is a checker scenario, probably the hover rule is something like `.lrow:hover { border-color: #888; }` (no width — no shift) or `.lrow:hover { padding-left: 10px }`. The 485px move suggests something bigger though. Hmm, 485px... what if hover changes `height` of a container from something to something big? Or `display:none → block` of a tall panel? Or `position: static → absolute`? If a hover sets position:absolute, the element leaves flow → things below move UP by its height (could be 485px) and the checker sees a control move 485px. A rule like `.something:hover .panel { position: absolute }`? 

My property blocklist should include: position (static→absolute/relative changes flow!). Also float, display, flex, grid-template-*, top/bottom (only matters if positioned), transform is fine (no layout), box-shadow fine, color/background fine, opacity fine, z-index fine, overflow fine (could change scroll but not layout of others... overflow on a hover could clip — layout-neutral for siblings), visibility fine (no shift), text-decoration fine.

Also `max-height` from 0 to 999px is a classic reveal → include.

List to remove from :hover rules: width, min-width, max-width, height, min-height, max-height, margin and all margin-*, padding and all padding-*, font-size, line-height (line-height change shifts lines!), border and all border-* (border-width affecting ones; simplest remove all border-* and border), display, position, float, flex, flex-basis, flex-grow, flex-shrink, gap, grid-*, top, right, bottom, left, inset, vertical-align, letter-spacing (letter-spacing changes text width → could shift inline things; include? brief lists height, padding, border, font-size, display. I'll include a reasonable superset but not go crazy — letter-spacing and word-spacing do affect inline layout; include them), white-space? changing white-space can change height (wrap vs nowrap) — include white-space? Hmm, that's layout-affecting (height). Include.

Careful about `top/left/right/bottom`: if base is static, hover setting top does nothing (positioned only). If base is absolute, changing top moves the element → checker sees a move. Remove them too.

But removing `display` — if a hover rule sets `display:block` to reveal something hidden with `display:none`, removing display means the reveal never happens; layout won't shift (satisfied) but functionality lost. The brief explicitly says "make the change one that does not affect layout" — they'd rather lose the reveal? For a checker scenario, no shift is the goal. But careful: `.phmo` hover? Not important. I'll remove display too but note it.

Hmm, wait. Actually maybe I'm overcomplicating. Maybe I should pair the JS sweep with targeted CSS for the known likely culprit using only existing selectors: e.g., 

```css
.lrow:hover { /* can't know */ }
```

No — can't write values without knowing base. The JS sweep is the honest tool here. But also: could the shifting hover be on `.vtab`? My previous block added tap targets to `.vtab` (min-height/width or padding). If the page's own CSS has `.vtab:hover { padding: ... }`, that'd shift. The sweep catches it regardless of selector. 

Also important: the sweep must run and also handle stylesheets added later? Run once on load + maybe a MutationObserver for added style elements? Keep it simple: run at DOMContentLoaded and again on window load. Also re-run after a tick in case late styles arrive. The second #iAim is emitted after my pass (fault 4), so there IS late-running script — its styles are probably already in the document though. I'll run the sweep on load and via a setTimeout(0)/setTimeout(100) fallback, plus observe document head for added styles.

Edge: cssRules access throws for cross-origin sheets → try/catch per sheet. Also @media rules → recurse into cssRules of CSSMediaRule. Also @supports. Handle nested.

Also careful: don't strip hover layout rules that MY OWN block adds — I won't add any hover layout rules.

Also: don't touch `:focus-visible` rules? The checker's tap-target gates might rely on focus styles; leave focus rules alone (fault is hover).

**Fault 4: duplicate #iAim.** Two `div.aim#iAim`, one in `.ipad`, one in `#sdControls`. My previous runtime strip failed because the second is emitted after my pass. The brief: "Only one of them is ever written into. Find which, and stop the other from being emitted with that id at all. If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it, rather than deduping again."

Hmm. From an appended block, can I reach the emit site? The emit site is presumably a function in the page's scripts that does something like `sdControls.insertAdjacentHTML(... '<div class="aim" id="iAim"></div>' ...)` or creates the element. I can't edit page script functions from outside... but I CAN do things:

Options:
a) Override `Element.prototype.insertAdjacentHTML` / `appendChild` etc. globally to intercept creation of an element with id "iAim" when one already exists — that's still a runtime strip, just earlier (at emit time). The brief says "stop the other from being emitted with that id at all" — intercepting the DOM insertion and stripping the id before/at insertion is closer to the emit site than a post-pass, but is it "the emit site"? They said if you cannot reach the emit site, say so plainly and name which block emits it. Do I know which block emits it? I can determine: only one is ever written into. Which one? Probably the one in `#sdControls` (an SD controls panel — "SDR Desk lookup" is mentioned as a control, sd = ?). Or the one in `.ipad` (an iPad-styled panel?). "aim line" = aim/annotation line? `#iAim` — "i" prefix suggests inside iPad panel? Elements like `#iAim` — the "i" prefix might match other ids in .ipad like `#iCase`... Pure guess.

Better: I can make the determination empirically in the JS: after load, find both, observe which one gets non-empty content (written into). But "stop the other from being emitted" — the fix must be: prevent the duplicate. Approaches:

1. **Property/prototype interception**: Wrap `Document.prototype.getElementById`? No. Wrap `Element.prototype.setAttribute` — if setting id="iAim" and a #iAim already exists, ignore/coerce. Wrap `appendChild`/`insertBefore`/`append`/`prepend`/`insertAdjacentHTML`/`innerHTML` setter? innerHTML setter interception is heavy. 

2. **Named-property on window**: If the emitter does `document.getElementById('iAim')` and writes into it, the duplicate exists in DOM; the write goes to the FIRST in tree order (getElementById returns first in document order). "Only one of them is ever written into" — the first (in .ipad, if .ipad comes first in the document). So the #sdControls one (or the later one) stays empty forever.

3. **The honest angle**: From an appended block I cannot literally reach into the page's emit function (it's closed over / defined in their script). I can intercept DOM-write primitives. Is that "reaching the emit site"? It's intercepting at the API boundary the emit site must use. Given three rounds of phantom fixes, the brief wants honesty: "If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it, rather than deduping again."

Can I "name which block emits it"? I can detect at runtime which container receives the second #iAim and when. But in my answer prose I should state what I can and can't know. I know this much from the brief: the emitter runs after my previous appended block (my runtime strip ran, then the second one appeared). I don't know the emitting function's name. The brief hints my previous errors: I once referenced `window.caseSheet` when the page calls `openCase` — so the page has `openCase`. I shouldn't invent function names now.

Practical solution that is NOT "deduping again" (post-hoc removal): intercept at insertion time. Implement:

```js
// guard: only one #iAim may ever exist
var capturedInsert = Element.prototype.insertAdjacentHTML; // etc.
```

Intercept these channels:
- `Element.prototype.insertAdjacentHTML`
- `Element.prototype.insertAdjacentElement`
- `Node.prototype.appendChild`, `insertBefore`, `replaceChild`
- `ParentNode.prototype.append`, `prepend`
- `Element.prototype.innerHTML` setter? and `outerHTML`?

That's a lot of surface. innerHTML setter interception: the HTML string could contain id="iAim". Parse check: if the string includes 'iAim' and a #iAim already exists, then... removing the id from arbitrary HTML string: regex replace `id="iAim"` / `id='iAim'` or `id=iAim`. Feasible: `str.replace(/(\sid\s*=\s*["']?)iAim(["']?)/gi, '$1$2')` — careful to keep attribute structure; replacing the value with empty leaves `id=""` which is fine-ish; or drop the whole attribute: `.replace(/\s*id\s*=\s*(["'])iAim\1/gi,'')` and unquoted variant.

But wrapping `innerHTML` setter on Element.prototype: use `Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')` — innerHTML is defined on Element.prototype. Redefine with a wrapper. This is invasive but works. Risk of breaking page (perf, edge cases) — only intervene when a #iAim already exists in the document AND the payload would create another. For innerHTML, the payload creating an element with id iAim: check `/\bid\s*=\s*(['"])iAim\1/i` or `id=iAim`. If found and document.getElementById('iAim') exists → strip the id from the string, then call original.

For appendChild/insertBefore: check the node being inserted — if (node.nodeType===1) and node.id==='iAim' or node.querySelector('#iAim') and existing #iAim → strip id (node.removeAttribute('id') on the subtree match). Simpler: before inserting, if node is an Element with id 'iAim' and document already has one → remove the id attribute (keep the div? The brief: "stop the other from being emitted with that id at all" — the div may still be emitted but without the id; the gate presumably counts elements with id iAim or `#iAim` occurrences. "The aim line is emitted twice. Both are div.aim#iAim" — the fault is duplicate ID. If the second is emitted as `<div class="aim">` without id, duplicate-id gate passes. The div is empty anyway and never written into. Keeping an empty div.aim without id: does any gate count .aim elements? "hover reservation on .aim" — my CSS reserves height on .aim; an extra empty .aim without id is just another empty line — the previous state already had two .aim divs (both counted as 114 controls?). Fine.

Also `insertAdjacentHTML` interception: same regex on the string, but only for positions; check existing #iAim first.

Also `document.write`? Unlikely late. Skip.

Also: what if the emitter sets the id AFTER insertion: `var d = document.createElement('div'); d.className='aim'; parent.appendChild(d); d.id='iAim';` → then intercept `setAttribute` (and the `id` property setter). Intercepting `id` setter on Element.prototype: 

```js
var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
Object.defineProperty(Element.prototype, 'id', { set: function(v){ if(v==='iAim' && document.getElementById('iAim')) { return; } idDesc.set.call(this, v); }, get: idDesc.get, configurable: true });
```

But wait — if the emitter does `d.id='iAim'` BEFORE appending, getElementById won't find it yet (not in document) → both get ids, then insertion → appendChild interception catches it at insert time (node.id==='iAim' && existing). Combined coverage: setAttribute('id','iAim') when already in document OR when another iAim... For setAttribute before insertion, the append interception covers it. For setAttribute after insertion (node already in document) → getElementById finds existing → block. But careful: blocking the id assignment also blocks... only for value 'iAim' when one exists. Fine.

Also the `id` property setter intercept covers `d.id = 'iAim'` post-insertion. And setAttribute covers `setAttribute('id', 'iAim')` post-insertion. And append/insertAdjacent cover creation-with-id cases. That's comprehensive.

Hold on — is this overkill and risky? Redefining Element.prototype.id property could break things if some element relies on a page-specific override... If the page itself redefines id on some prototype (unlikely). Configurable: true on the native descriptor — yes, Element.prototype.id is configurable. Risk acceptable? The brief demands the emit-site fix and is tired of runtime strips. The alternative honest answer: "I cannot reach the emit site; the block that emits it is X." But I don't know X's name. Hmm, wait — can I find out? The brief says "name which block emits it". I can instrument: at load, record which container gets the second iAim and (via a wrapped insertion) capture a stack trace at interception time! When my interception fires (blocking the second id), I can `console.info` the stack — but for the ANSWER, I need to state it now. I can't run the page. So in prose I should say: I can't see the emit site from here; I intercept at the DOM write boundary (setAttribute/id setter/insertion APIs), which is the last channel any emitter must pass through, and log a stack trace naming the emitting script if it fires. That's honest and actionable.

Hmm, but re-read: "You said yourself the real fix is at the emit site rather than a runtime strip, and you were right. Only one of them is ever written into. Find which, and stop the other from being emitted with that id at all. If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it, rather than deduping again."

"Find which [is written into]" — I can reason: getElementById returns the first #iAim in document order. Which comes first, `.ipad` or `#sdControls`? Unknown from the brief. But "Only one of them is ever written into" — the one written into is whichever getElementById finds first, i.e., document order. I can't determine order without the DOM. But my interception doesn't need to know: it preserves the FIRST and strips the id from any subsequent attempt. And the "written into" one keeps its id and keeps working (writes go to it via getElementById). Whichever is emitted second is the never-written one. 

Edge: what if BOTH are emitted before my script runs (both static in HTML)? The brief says "whatever emits the second one runs after your pass" — so at least the second is dynamically emitted after my appended block executes... wait, my previous block stripped at runtime and "it is still two" — meaning the emitter ran after my strip. If my new block runs earlier and guards the insertion channels, the second id never lands. But what if the second one is emitted before my block runs (script order)? "an appended block" — appended blocks run at/after parse end typically; the previous block's strip ran and THEN the second appeared → the emitter runs after appended blocks execute (maybe on some user action or timeout!). If the emitter runs on a later event/timeout, my guards (installed early in my block) will be in place. Good.

But what if the emitter uses a saved reference: `var el = document.createElement('div'); el.id='iAim'; el.className='aim';` then later `someParent.appendChild(el)` → my appendChild guard catches at insertion: existing? At that point, does a #iAim exist? The FIRST one — was it also dynamically emitted? "The aim line exists twice: div.aim#iAim inside .ipad (empty, 18px) and inside #sdControls". If the first is static HTML and second dynamic → guard works. If both dynamic: first inserts (no existing → allowed), second → blocked. Either way only one ends with the id. 

What if the second is emitted via `cloneNode` of the first and appended? appendChild guard catches (node.id==='iAim' and existing). But my guard would strip the id from the clone before insertion — good.

innerHTML path: emitter does `sdControls.innerHTML = '...<div class=aim id=iAim></div>...'` — regex strip when a #iAim exists. But careful: if sdControls.innerHTML assignment REBUILDS the whole panel including the first... no, first is in .ipad, different parent. But danger: what if the emitter assigns innerHTML to a parent that CONTAINS the existing #iAim (rebuilding both)? Then stripping the id from the string would remove the only id... but the existing one would be destroyed by the innerHTML assignment anyway and the new one would carry the id — stripping would leave ZERO. Risk. Mitigate: for innerHTML interception, only strip if the target element does NOT currently contain the existing #iAim: check `!target.contains(document.getElementById('iAim'))` and the existing is not the target itself. And after the assignment, if no #iAim exists anymore... eh. Keep the guard: strip only when (a) an #iAim exists outside the target's new subtree (i.e., existing && !target.contains(existing)), and (b) the string would add one. That preserves the "rebuild containing the aim" path.

Similarly for appendChild guard: if the inserted node contains the existing #iAim (moving it), don't strip: check `node.contains(existing) ? allow : strip`. Actually if you move the existing #iAim via appendChild, node IS or contains existing → allow. Good.

Also `replaceChild`/`replaceWith` — rare for this; include appendChild, insertBefore, append, prepend, insertAdjacentHTML, insertAdjacentElement, and the id property setter + setAttribute. Also `after`/`before`? Skip — keep surface reasonable, mention nothing.

Hmm, wait. Actually, let me reconsider whether all this prototype patching is wise given "no runtime errors" is a gate. Patching Element.prototype.id getter/setter: some code does `el.id = 'x'` in hot loops — my wrapper adds a check `v==='iAim' && document.getElementById('iAim')` — short-circuit on the string compare first, so overhead is negligible for other ids. appendChild wrapper: check `node.nodeType === 1 && node.id === 'iAim'` — cheap. insertAdjacentHTML wrapper: only when string contains 'iAim' (indexOf check first) — cheap. innerHTML setter: indexOf('iAim') check first — cheap. OK, performance fine.

Another subtlety: `document.getElementById('iAim')` inside the id setter — during DOMContentLoaded-time, fine.

Also possible: the emitter might create the second via `document.createElement('div')`, set className 'aim', id via setAttribute → then insert with insertAdjacentHTML? Mixed paths covered.

Also should my guard REMOVE the id if somehow a second #iAim appears (belt): a final MutationObserver watching for added elements with id iAim → strip. But the brief hates "deduping again" as the primary fix; a MutationObserver is still runtime dedupe. The primary is interception. I could add the observer as a safety net — but brief says "rather than deduping again" if I can't reach emit site. My interception IS at the last possible channel before the DOM; I'll present it as the emit-channel guard and be plain that the true emit site is in the page's own script, unreachable from an appended block, and that the guard logs the offending stack. Also, name which block emits it: I can say the emitter is whatever writes into `#sdControls` (or .ipad)... I don't know which is second. I'll say: the guard preserves the first-in-document-order element (the one getElementById hands out, hence the one written into) and blocks the second at the channel it uses, logging a stack trace to the console identifying the emitting script — and I state plainly I cannot name the emitting function from outside.

Hmm, actually — wait. Can I reason about which is emitted second? "the aim line exists twice... one inside .ipad and one inside #sdControls" and "Only one of them is ever written into." The previous block's runtime strip "stripped the attribute at runtime and it is still two" — meaning my strip removed... the id from one? and it's still two → the emitter re-added or ran later. If my previous strip removed the id from one of them and then a NEW one appeared with the id, the emitter creates a fresh element each time or sets the id later. Either way, guard at channels.

Alright, also the guard should run as early as possible: my JS block is appended; if it's a `<script>` appended to body end, it runs at parse time of the appended block... In these scenarios, the "block" is presumably injected into the page. I'll wrap in an IIFE, install guards immediately (not waiting for DOMContentLoaded), then do load-time work on DOMContentLoaded.

Wait, one more channel: `document.createElement` + setting id via the setter BEFORE the element is in the document, then `sdControls.appendChild(el)` — my appendChild wrapper checks existing #iAim in document: the FIRST one exists (static or earlier emission) → node.id === 'iAim' → strip node's id → insert. ✓.

And if BOTH are created before insertion... e.g., fragment containing both? Then existing check passes only after first insertion; fragment insertion is one call → node is a DocumentFragment containing an iAim; check `node.nodeType===11` → look for `#iAim` inside when one already exists → strip within fragment. Add fragment handling in appendChild/insertBefore: if node is a fragment and existing #iAim exists and node contains an element with id iAim → strip ids of those. But if the fragment contains the ONLY iAim (first), allow. Implementation: 

```js
function scrub(node, container){
  var existing = document.getElementById('iAim');
  if(!existing) return;
  if(node === existing || (node.nodeType===1 && node.contains(existing))) return; // moving the real one
  if(node.nodeType===1){
    if(node.id==='iAim') node.removeAttribute('id');
    var dup = node.querySelector ? node.querySelector('#iAim') : null; // hmm, querySelector on detached node works
    if(dup) dup.removeAttribute('id');
  } else if(node.nodeType===11){
    if(node.querySelector('[id="iAim"]')) { ... strip ... }
  }
}
```

Wait, careful: `node.querySelector('#iAim')` on a subtree whose root has id iAim — querySelector only matches descendants. Handle root separately (done above).

But `existing` might not be in the document if... getElementById only returns in-document ones. Fine.

Also, for insertAdjacentHTML/adjacent positions, the "target" containment check for innerHTML-style rebuild: insertAdjacentHTML on an element whose subtree contains existing (e.g., inserting into .ipad next to existing aim) — string adds another iAim → strip from string. Since existing is being kept (not destroyed by insertAdjacent — it doesn't clear), stripping is right. Only innerHTML/outerHTML assignment destroys children, hence the containment check there.

outerHTML setter: rare; skip or include? Skip outerHTML (rarely used to emit panels; also on Element.prototype with setter). I'll skip and not mention every channel.

Hmm, actually, wait. Let me reconsider the whole approach for fault 4 once more. The brief's tone: "If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it, rather than deduping again." 

Two acceptable outcomes: (a) reach the emit site and stop the emission; (b) plainly state inability + name the emitting block. Can I do (a)? The emit site is inside page script I can't edit... unless the emitter is a global function I can wrap! Like my past error: page calls `openCase` — functions may be global. If the emitter is a global function (e.g., `renderSdControls` or `buildSd`), I could wrap it... but I don't know its name and must NOT invent one (that's exactly the failure mode being scolded). So (a) via global wrap = guessing = forbidden. (a) via prototype channel guards = reaching the mandatory boundary every emitter passes through. I'll do that and be explicit in prose: "The true emit site is in the page's own script, which an appended block cannot edit. What I can do is stand on the only doorway it must use..." and note the console stack logging names the script if it fires. That satisfies honesty.

Also "Find which [is written into]" — I should answer: the one that document order / getElementById resolves, i.e., the first #iAim; my guard keeps exactly that one. In prose: "getElementById hands back the first in document order, so the first #iAim is the one written into; the guard lets that one keep the id and strips the id from any later emission, wherever it lands." Also I could add a load-time check: if two static #iAim exist at DOMContentLoaded (both static — not emitted late), then... the brief says the second is emitted late (after my previous pass). But belt: on DOMContentLoaded, if multiple #iAim exist, keep the first in document order, remove id from the rest — wait, that's deduping again... but as a fallback for the static-both case it's necessary; primary is the guard. Hmm, the brief: "rather than deduping again" — the complaint was a runtime strip that FAILED because emission happened later. A guard at the channel is the fix; a load-time sweep handles the case where both were emitted before my block installed (if my block runs late). I'll include the initial sweep as part of installing the guard (establish the invariant, then enforce it). I think that's defensible and I'll say so.

Hmm, but careful: initial sweep removing the second's id — if the "written into" one is the SECOND in document order? getElementById returns the FIRST — writes go to the first. Unless the emitter holds a direct reference captured earlier (e.g., it created the .ipad one dynamically and holds `var aimEl = ...`). "Only one of them is ever written into" — the guard's choice (first in document order) matches getElementById semantics. If the emitter holds a direct reference to the second and writes into it while first stays empty... then the gate "aim line emitted twice" counts ids; removing the second's id doesn't stop writes to it (reference held) — the div.aim without id still gets text — fine, no fault: the fault is the duplicate ID / duplicate aim line? "The aim line is emitted twice. Both are div.aim#iAim, both empty." The fault as stated: duplicate emission with the same id. Gate presumably counts `#iAim` occurrences or elements matching `.aim#iAim`. Stripping the id from the empty one resolves it. If the empty one is the first-in-order (i.e., written-into is second) — then stripping the first's id makes the SECOND the only #iAim — also resolves and matches writes. My sweep should then prefer: keep the one that is non-empty if only one is non-empty! Better logic: if multiple #iAim, keep the first NON-EMPTY one if any; else keep the first. That directly implements "only one is ever written into" (the written one has content; at sweep time it might already have content). Nice.

But at guard-install time both may be empty (writes happen later). Then keep-first + guard channels: later writes via getElementById go to first ✓. If emitter holds direct reference to the second... it set the id through a channel I guard? If it held a reference from creation, it sets id at creation → insertion guard strips id → its writes go to a div without id → the div gets content, no duplicate id. OK.

**Now fault 1 revisit** — decide final. I'll go with:

```css
#vstrip .vglab { white-space: normal; flex: 1 1 auto; width: auto; min-width: 0; line-height: 1.2; }
```

Wait, risk: if `.vg` doesn't stretch (vgroups is row? No — three groups in a "strip"; if vgroups were a row, three groups each [194 label + ~5-6 buttons] would already be ~1600px wide at 1440 → but no overflow at 768+ currently is claimed... At 768, vgroups row of 3 groups would massively overflow — but "at 768, 1024 and 1440 there is no horizontal overflow at all" — so vgroups CANNOT be a nowrap row at those widths. Hence vgroups is a column (stacked) or wraps. If `.vgroups` wraps (flex-wrap: wrap) with three .vg side by side: at 768, each .vg ≈ 194+330=534 → two per row = 1078 > 768 → wrap to one per row? 534 fits. Possible. Either way, `.vg` may or may not stretch full width. If vgroups wraps and .vg is content-sized: my flex:1 on .vglab is inert (no free space in content-sized flex container? Actually flex container width = max-content of items; label max-content with white-space:normal is the longest word?? No — max-content of a flex container sums items' max-content sizes; label's max-content = full sentence one line 550px → .vg max-content 890 → but the .vg's actual width as a flex item in a wrapping vgroups = min(available, ...) hmm, flex items in a wrap container get width based on... it gets complicated: as a flex item with flex-grow/shrink defaults of the ITEM .vg (unknown), .vg could be sized between min-content and max-content. min-content of .vg = min-content of label (longest word ~70px) + buttons 330 = 400. If vgroups gives .vg more than max-content... it can't exceed max-content unless grow. 

If .vg ends up sized by content at ~890 max-content > 768 viewport → overflow at 768! Currently (nowrap label) .vg max-content = 194+10+330 = 534 → fits. So if vgroups is a wrap-row, changing label to white-space:normal raises .vg max-content to ~890 → overflow at 768. DANGER.

To kill that risk: also cap the label: `max-width: 100%` doesn't cap max-content contribution... For a flex ITEM (.vg) in a wrapping row container, its used width is clamped by the line; flex-shrink applies: .vg default flex-shrink... unknown. If .vg has flex-shrink:1 (default) and vgroups line width 768, .vg shrinks → its inner flex (label shrink 1 with min-width 0) shrinks → label wraps → no overflow. Overflow only if .vg has flex-shrink:0 (like "0 0 auto"). The brief gave computed for `.vg`: "display:flex; flex-direction:row; gap:10px; flex-wrap:nowrap" — it did NOT give flex (shrink) for .vg, but DID give flex:0 0 auto for .vglab. So .vg likely default flex settings (0 1 auto) as an item → shrinkable → safe-ish. And if vgroups is a column with stretch, .vg full width → label grows → good.

Alternatively, safest of all: keep label at fixed 194px width but allow wrap: `#vstrip .vglab { white-space: normal; line-height: 1.15; }` — zero horizontal risk (box unchanged; wrapped text stays in box). Height risk if 4 lines. Mitigate: also `font-size: 10px`? Don't know base. Hmm.

What about combining: `white-space: normal; width: auto; flex: 1 1 auto; min-width: 0; max-width: 194px;` — box capped at 194 (same as now), grows... max-width 194 means it can shrink below when needed (if .vg squeezed at 768) but never exceed 194 → max-content of .vg stays ≤ 194+10+330 = 534 → identical horizontal profile to current page (no overflow at 768+ preserved!), and vertical: label wraps within ≤194px → same as pure wrap. So this equals option "wrap in 194px" plus shrinkability. Height: the open question remains: does the wrapped label keep #vstrip ≤130px?

Let me re-derive heights with real numbers. Font-size: the b is 50px wide for "1,757,827" (9 glyphs, digits+commas). Digits ≈ 0.55em, commas ≈ 0.25em → 7×0.55+2×0.25 = 4.35em = 50px → em ≈ 11.5px. So font-size ≈ 11-12px. Prose char ≈ 0.5em ≈ 5.75px → sentence 110 chars ≈ 630px natural. In 194px: 630/194 ≈ 3.25 → 4 lines (word wrap inefficiency). Line-height 1.2 × 11.5 ≈ 13.8 → 4 lines = 55px. Three groups: if all three labels are similar length → 3×55 + 2×10 = 185 > 130. FAIL.

Hmm!! So wrap-in-194 likely fails the 130 gate. Unless other labels are shorter. The first label IS the long explanatory one ("These ignore your selection. Each answers from all 1,757,827 reports, or from a slice you set inside the panel" — that's meta text describing the group). The other two might be like "Answer from the whole fleet" (short). But the quoted one is presented first and is clearly the long one; 55px + 2×~14px(short labels 1 line) + 20 gaps ≈ 103+... 55+14+14+20 = 103 ✓. Plausible! But if the second label is also longish...

To be safe, give the label more width so the long one wraps into fewer lines. The "row width" option: let the label use leftover row width. Combine: `flex: 1 1 auto; width: auto; min-width: 0; white-space: normal;` with NO max-width cap. Horizontal risk analysis above: only if vgroups is a wrap-row with .vg non-shrinkable. The brief computed `.vg` showing only display/flex-direction/gap/flex-wrap — implying that's ALL that's notable; flex item defaults (shrink 1) likely. And if vgroups is a column: safe. If vgroups is wrap-row with shrinkable .vg: at 768, .vg shrinks to fit line, label shrinks (min-width 0) and wraps → fine.

But buttons: `.vgbtns` with 5-6 buttons ~330px — if the .vg shrinks below label-min + 330... label min-width 0 → label can shrink to 0 (absurd tall wrap) but only when .vg < 340. At 768, plenty. OK.

Also, with flex-grow, in a stretched .vg, buttons go right — visual change, acceptable.

Actually hmm, wait: with `flex: 1 1 auto` on the label and .vg stretched full width, at 1440 the label is one line (row width ~800+, text 630 fits one line) → group height = 24 (buttons) → strip ~92px ✓✓. At 1024: similar ✓. At 768: row width maybe ~700 → label gets ~360 → 630/360 = 1.75 → 2 lines = 28px → groups ~28 → strip ~104 ✓. 

This approach is clearly the best for the height gate. Risk contained. Also `order`? No.

But one more danger with grow: in a stretched .vg, label grows, buttons at far right — the checker's fault-1 measurement compares label text rect vs button rect — no overlap regardless. ✓.

And "the three group labels and sixteen buttons all stay" — untouched DOM ✓.

What if `.vgbtns` itself doesn't shrink and .vg is squeezed at 768 such that buttons overflow .vg → overflow at 768?? Currently at 768 no overflow with label 194 fixed: .vg min-content with label flex 0 0 194 = 194+10+vgbtns. If I make label shrinkable, .vg min-content DROPS (label min 0) → less overflow risk than now. But .vgbtns internal: if .vgbtns is flex nowrap with min-content = sum of buttons and .vgbtns has default shrink... could buttons overflow at 768? They don't now (no overflow at 768) and I'm only making the label more flexible → strictly safer. ✓.

Decision final for fault 1:
```css
#vstrip .vg { align-items: flex-start; }  /* hmm, needed? */
#vstrip .vglab { white-space: normal; flex: 1 1 auto; width: auto; min-width: 0; line-height: 1.2; }
```
align-items: not needed; skip to minimize surface. Actually, hmm: if .vg has align-items default stretch, the label stretches to row height — fine, doesn't matter (text top-aligned... text would be at top; previously maybe centered — cosmetic).

Wait, actually should I worry the label with flex-grow pushes buttons right and the checker ALSO measures "the tab strip at or under 130px" — fine. And "16 .vtab and 3 .vglab" presence ✓.

Hmm, but hold on, one more: with `flex: 1 1 auto` and `width: auto`, flex-basis auto → resolves to width auto → content size, then grow/shrink. Fine. I could write `flex: 1 1 0` to force even... no, `1 1 auto` is right.

Also should I keep some max-width? No — argued above it hurts height. But consider .vg max-content in wrap-row case: if vgroups is wrap-row AND .vg is NOT shrinkable (flex 0 0 auto from some rule not shown)... then .vg max-content = label-max-content (630 one line? no wait, white-space normal → max-content = one line = 630) + 340 = 970 → at 768 overflow. Ugh. To hedge BOTH: add `max-width: 194px`?? kills height fix. Alternative hedge: cap label's max-content contribution by setting `width: 0; flex: 1 1 auto;`?? width 0 + grow → label gets free space of the row; max-content of .vg = 0+340=340 → tiny; in stretched .vg, label gets all free space → same as before; in content-sized .vg (wrap-row, non-shrink), .vg width = 340 → label gets 0?? flex-grow in a content-sized container: container max-content = sum of items' max-content contributions; for an item with flex-basis 0 and grow 1, its max-content contribution is... its max-content size anyway (max-content of flex container considers items' max-content, flex-basis 0 grow items contribute their max-content? Per spec, the max-content size of a flex container = sum of items' max-content contributions where contribution = flex-basis clamped... actually items' contributions for max-content sizing use their max-content size if grow... it's: for each item, contribution = max-content size if flex-grow... I recall flex items with flex-basis:0 still contribute max-content in the container's max-content sizing. So no help.)

OK, I'll accept the small risk on vgroups layout; the column-stretch hypothesis is most consistent with "no overflow at 768 currently" and typical design, plus the brief's own hint "give the row a width that fits it" implies giving width is safe in this layout. Hmm wait — "give the row a width that fits it" — the ROW. `.vg` row. Give .vg a width that fits the label: i.e., ensure .vg is wide enough that the label (at 194 nowrap) fits — the label doesn't fit in 194... "give the row a width that fits it" = make the row wide enough to contain the label text: the row already sizes... hmm, the label box is 194 fixed — the ROW isn't constraining it; the label's own fixed width is. Unless... the row IS constraining via some mechanism I don't see. If .vg width is fixed (e.g., .vg { width: 528px }?) and label 194 + buttons overflow... The measured overlap: label text at x up to 531, buttons start 520 — the label box ends at 337+194=531?? If label box starts at 337 and is 194 wide → ends 531, buttons start 520 → the BUTTONS overlap the label BOX by 11px — buttons are positioned partially over the label box! That happens if .vg is NOT a simple flex row of [label][buttons] (which wouldn't overlap) — but .vg IS flex row per computed. Flex row siblings can't overlap... unless negative margin, or the label's TEXT overflows its box (nowrap) into the button. Given nowrap: text width 630 > box 194 → text paints from box start (337) to 967?? But measured b ends at 531. Hmm, that contradicts: nowrap text 630px starting at 337 would extend to 967, overlapping buttons massively (checker said overlap 10x7 — tiny). So the text is NOT 630px. Recompute: b at (481,1255) w=50. If the label text were one line starting at box start... where does the label box start? Unknown. The b is mid-sentence ("all **1,757,827** reports") — its x=481. If the text overflows only slightly past the box (overlap 10px), the text total width ≈ (box end + ~10) - text start. Suppose box starts at X, text runs X to X+T where T slightly > 194. The b at 481..531 sits near the END of the sentence? "reports, or from a slice you set inside the panel" continues after the b — 41 more chars ≈ 200px?? Then text end would be 531+200=731 → way past buttons. But overlap reported is only 10×7?! Unless the overlap measure is between the b element and the button specifically (the checker compared the two rects it listed: the b and the button — overlap 10×7). Not the whole label! Right: "they overlap by 10 x 7" refers to the two listed rects. So the actual text may extend far past. Hmm, but then "worst" measurements... the fault is real regardless.

Hmm wait, but vertical overlap is only 7px: b at y 1255-1265, button 1238-1262 → overlap 1255-1262 = 7px ✓. And the button height 24 (vtab with my tap-target padding). The label line sits low. OK.

So the sentence might indeed be ~630px wide starting at ~x=280? b at 481 → if text starts at 280, chars before b = "These ignore your selection. Each answers from all " = 51 chars ≈ 51×5.75 ≈ 293 → 280+293 = 573 ≠ 481. With font 10px: 51×5=255 → 280+255=535. Eh, close-ish to 481 if text starts at ~226. Whatever — inline b position depends on line layout. The point: the label text is much wider than 194 and slides under the buttons. Wrap it.

Given text ~630px at ~11.5px font... my earlier math stands. Go with grow.

Hmm, actually, let me reconsider `font-size`. If the em is 11.5px, prose 0.5em = 5.75px/char. b: 7 digits ×0.55em(6.3) + 2 commas ×0.25em(2.9) = 44.1+5.8 = 50 ✓ nice. So font-size ~11.5px, line-height 1.2 → 13.8px/line.

Final CSS for fault 1:
```css
#vstrip .vglab { flex: 1 1 auto; width: auto; min-width: 0; max-width: none; white-space: normal; line-height: 1.2; }
```

**Fault 2 final:**
```css
.phstrip { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }
.phmo { flex: 0 0 auto; }
```
Wait — is `.phstrip` maybe display:flex? "44px wide, laid in a row that neither wraps nor scrolls" — could be flex or inline-blocks. `.phmo { flex: 0 0 auto }` inert if not flex. Should I also set `display: flex` on .phstrip? If it's already flex, redundant; if it's inline-block buttons with whitespace, forcing flex is fine. I'll add `display: flex;` — hmm, if the buttons rely on inline layout (baselines), flex changes baseline alignment slightly. Minor. I'll include `display: flex; flex-wrap: nowrap;` to be deterministic about the row, since the brief says it's a row. Actually — "laid in a row that neither wraps nor scrolls" — maybe it IS already flex nowrap. Adding display:flex is harmless then. But if .phstrip is a grid? Unlikely. Include.

Also ensure the strip's parent chain doesn't overflow: can't know. The gate at 390 presumably measures document.scrollWidth — overflow-x:auto on phstrip fixes it if phstrip is the only offender (the brief says "every .phmo button in .phstrip... the last far beyond it" — the strip is the offender; "document.scrollWidth 698" ≈ strip content width ~698? 8 buttons... "The eighth one already ends at 543" — buttons 44 wide + gaps: 8 buttons ending at 543 → strip starts ~ maybe with padding; total months unknown count, last far beyond 543 → total 698 ✓ matches scrollWidth 698). So phstrip is the sole offender ✓.

One caution: `overflow-x: auto` on .phstrip creates a scroll container — with `overflow-y: hidden` to avoid vertical scrollbar issues. Fine. Also `.phstrip { scrollbar-width: none }`? Hiding scrollbar on touch is fine; keep default (thin). Leave default.

**Fault 3 final (JS sweep):** Implement `neutralizeHoverLayout()`:

```js
function sweepHover(root){ ... }
var LAYOUT_PROPS = ['width','min-width','max-width','height','min-height','max-height',
 'margin','margin-top','margin-right','margin-bottom','margin-left',
 'padding','padding-top','padding-right','padding-bottom','padding-left',
 'font-size','line-height','display','position','top','right','bottom','left','inset',
 'float','flex','flex-basis','flex-grow','flex-shrink','flex-direction','flex-wrap',
 'gap','row-gap','column-gap','grid','grid-template','grid-template-rows','grid-template-columns','grid-auto-rows','grid-auto-columns','grid-auto-flow',
 'border','border-width','border-top','border-right','border-bottom','border-left',
 'border-top-width','border-right-width','border-bottom-width','border-left-width',
 'vertical-align','letter-spacing','word-spacing','white-space','box-sizing','columns','column-width','column-count','zoom'];
```

Hmm — border shorthand removal also removes color/border-radius effects. The brief says "make the change one that does not affect layout" — for a hover like `.lrow:hover { border-color: red }`, no width change → no shift → leave it. Only remove border declarations that AFFECT WIDTH. How to tell? Parse the declaration value: for 'border' shorthand, if value contains a width component (a length/keyword thin/medium/thick) — e.g., "1px solid #ccc" — removing width changes layout IF base width differs... If hover sets border:1px solid and base has border:1px solid (color differs) — hover shorthand re-declares width same as base → removing it loses the color change. Precision here is getting deep. Simpler heuristic: for border shorthands in :hover rules, REPLACE width part with the base width? Can't easily read base (would need matching base rule).

Pragmatic approach: instead of removing border declarations, rewrite them preserving width but... we don't know base width. The safest universal: convert border color changes: parse the shorthand value; if it contains a width, keep width only if it equals base width — can't easily know base.

Alternative: keep border-width by setting an equal-width `box-shadow` inset. E.g., hover declares `border: 2px solid red` and base has no border → layout shift of 4px. Replace with `box-shadow: inset 0 0 0 2px red; border-color: red;` and remove the border. But if base width is 2px too (just color change), inset shadow adds on top of existing border → double ring visual. Cosmetic only.

Honestly, for this checker, the likely culprit rule changes one of: height/padding/font-size/display. The 485px move suggests display or big height. Border micro-shifts (1-2px) — would the checker count "worst single move 485.1px" — they measure the max; after my fix they re-measure expecting 0? "One hover still moves the page... make the change one that does not affect layout." The re-check presumably requires zero shifts. A 1px border-width hover change would produce 1px shifts → fail. So I should handle border widths too.

Decision: in :hover rules, for declarations in my blocklist: 
- For 'border-*width' and 'border' and 'border-top' etc.: extract width if present; convert to inset box-shadow of that width using the color if extractable... too clever, error-prone. Simpler: just remove the border declarations from hover rules AND, to preserve the visual intent minimally, re-add color-only: if the declaration had a color component, set `border-color` — but if base width is 0, border-color does nothing visually (no border to color) → acceptable (cosmetic loss). If base HAS a border and hover changed color+width, removing width keeps base width; setting border-color keeps color change ✓. So: remove the declaration; if a color is parseable, set border-color (for 'border' shorthand) or the appropriate `border-XXX-color`. Parsing color from e.g. "1px solid rgba(...)" — a regex for a color at the end: hex, rgb/rgba/hsl/hsla, or keyword. Doable with a small regex; if match, set borderColor accordingly. For 'border-top' → set 'border-top-color'. I'll implement a light version: handle 'border' by extracting color via regex; for 'border-top/right/bottom/left' similarly set the side color. If no color found, just remove.

Hmm, is this worth the complexity/risk? A buggy regex can't throw (try/catch). Fine, include a simple version.

Also `box-shadow` with spread creates no layout shift ✓ keep. `transform` ✓ keep. `background/color/opacity/filter/outline` — outline doesn't affect layout ✓ keep all. `outline` — actually outline can overflow but no shift ✓.

Also `visibility` ✓ keep. `overflow` — keep? Changing overflow on hover could show scrollbars → in some browsers classic scrollbars take space → layout shift! Remove 'overflow' too? If hover sets overflow:auto revealing scrollbars... rare. Include 'overflow' in removal? If a hover sets overflow:hidden for ellipsis... removing keeps previous overflow. Layout shift risk is via scrollbar-gutter in classic scrollbars; modern overlay scrollbars no. I'll include overflow — hmm, but the case sheet ("opens, closes, scrolls") — does it rely on a :hover overflow rule? Very unlikely. Include 'overflow' — actually no: overflow changes don't move other elements in overlay-scrollbar environments; and checker does synthetic mouseover... I'll leave overflow alone to minimize collateral. Hmm. Decide: leave 'overflow' untouched.

Also remove `text-indent`? affects inline layout. Include? Minor; include 'text-indent','tab-size'? Skip tab-size; include text-indent. Also 'white-space' (wrap change → height change) include. 'word-break','overflow-wrap'? height-affecting; skip — rare in hover.

Recursion: walk rule.cssRules for CSSMediaRule/CSSSupportsRule/CSSLayerBlockRule/CSSContainerRule/CSSScopeRule/Nested CSSStyleRule (CSSNestedDeclarations...). For CSSStyleRule with ':hover' in selectorText (case-insensitive; also ':-moz-any'... just ':hover'), scrub declarations. Note: selector could be like `a:not(:hover)` — removing layout props from that would be wrong-ish but harmless? `:not(:hover)` rules apply at rest — removing layout props would CHANGE RESTING layout! Must avoid. Check more carefully: does the selector target the hover state? A robust-enough check: selectorText.includes(':hover') and NOT includes(':not(:hover)')... but `.a:not(:hover) .b:hover` mixed... For safety, require the selector list's individual selectors to each contain ':hover' and not ':not(:hover)'? Overkill; simple check: `/^:(?!not)/`... Let me do: split selectorText on ',', trim each; process rule only if EVERY selector contains ':hover' and NONE contains ':not(' with hover inside... simpler: skip rule if any selector contains ':hover' but also ':not'. Honestly just check: every part matches /:hover/ && !/:\(?!not/... I'll do: `parts.every(s => /:hover/.test(s)) && parts.every(s => !/:not\(\s*:hover\s*\)/.test(s))`. Good enough.

Also 'any-hover' media? skip.

Sheets: for each `document.styleSheets`, try { iterate cssRules } catch { continue }. Also handle adoptedStyleSheets? Skip.

When to run: immediately (in case styles present), on DOMContentLoaded, on window load, and via MutationObserver on document for added <style>/<link rel=stylesheet> nodes → sweep again (debounced via requestAnimationFrame). Also re-sweep after the iAim emitter runs? The emitter might inject a <style>. The MutationObserver covers head/body additions. Also observe `document.styleSheets` changes can't be observed directly; DOM additions cover most.

Careful: MY OWN css block — does it contain :hover? No, I'll avoid hover rules in my CSS. Wait — my previous block had "hover reservation on .aim" — that's reserving height so hover doesn't shift; that's not a :hover rule necessarily (it's `.aim { min-height: 18px }` style). Keep `.aim` reservation: "Keep everything in it that works: ... the hover reservation on `.aim`". So include `.aim { min-height: 18px; }` — the brief says both are "empty, 18px" — so reserve 18px. Write:

```css
.aim { min-height: 18px; height: 18px; }
```
Hmm, height fixed could clip if filled with text later (the written-into one gets content?). "Only one of them is ever written into" — with content, height 18 fixed might clip. min-height: 18px is safer: empty → 18px reserved; content → grows. But does the hover shift come from `.aim` growing on hover? The reservation with min-height handles empty state; if hover adds content?? No, hover is CSS. Use min-height: 18px. But careful: fault 4 gate might check `.aim` elements count or the aim line height... min-height 18 matches "empty, 18px" ✓.

Also keep `.gv` truncation fix: I don't know what it was exactly — "the truncation fix on .gv" — presumably something like `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0` for value cells, or removing a fixed height that clipped. "no text is cut off at 1440" was the gate it fixed. Common truncation fault: text-overflow ellipsis cutting values, or a container with fixed height clipping. Since I must reproduce "the truncation fix on .gv" without knowing its exact form... I have to guess what my previous block did. Hmm. This is awkward: the brief says keep it, but I don't have my previous block's text. I'll write a sensible `.gv` anti-truncation rule:

```css
.gv { white-space: normal; overflow: visible; text-overflow: clip; }
```
Risky guess. Alternatives: maybe the fix was `min-width: 0; overflow: hidden; text-overflow: ellipsis;` to make truncation clean?? But the gate is "no text is cut off at 1440" → the fix must make text NOT cut off → `overflow: visible; text-overflow: clip;` and allow wrapping or let the box grow. If .gv is a grid value cell, likely fix: `overflow: visible; text-overflow: clip; white-space: normal;` hmm but maybe the original fault was ellipsis truncation → fix = show full text. I'll write:

```css
.gv { overflow: visible; text-overflow: clip; white-space: normal; word-break: normal; overflow-wrap: break-word; min-width: 0; }
```

overflow-wrap: break-word prevents overflow-caused horizontal scroll while avoiding cut text (wraps instead) ✓ also protects the no-overflow gates. This is a reasonable reconstruction. Since the brief says it works and the gate passes at 1440, and I can't verify, my best effort is a rule that guarantees no clipping: no overflow:hidden, no ellipsis, allow wrap.

And `.vtab` tap targets: "the tap targets on .vtab" — buttons 24px tall currently (measured "45 x 24"). Tap target usually wants 24px min (the brief's threshold: controls under 24px flagged; vtab at 24 exactly passes). My previous fix likely added min-height/min-width/padding:

```css
.vtab { min-height: 24px; min-width: 24px; box-sizing: border-box; }
```
Include `box-sizing: border-box` to avoid padding growing beyond. Keep buttons 24 tall — consistent with measured 45×24 ("computed now" showed the current state after my fix? The measurement of button 45×24 was in the fault-1 section describing current layout — 24 tall suggests tap fix applied or native). Write `min-height: 24px; min-width: 24px; padding: inherit`? No — just min-height/min-width + box-sizing.

Also "and the html/body background": 
```css
html, body { background: <same> }
```
What color? Unknown! My previous block set it. Common: the page likely has a body background color; fault was html showing white behind. Safe fix: `html { background: inherit }`? inherit on html gets nothing (parent none → initial transparent → white). Hmm. Better: `html { background-color: #ffffff }`? If the page is dark, white flashes. Robust trick: make html's background derive from body: you can't via CSS (no parent selector upward)... Actually you CAN: set `html { background: transparent }` won't propagate... The canvas background comes from html; if html is transparent, body's propagates? CSS spec: the background of the root element covers canvas; if root's background is transparent, the canvas takes BODY's background! Yes! "For documents whose root element is an HTML HTML element... if the computed value of background-image/background-color on the root is transparent/none, the canvas background is that of the body." So:

```css
html { background: transparent; }
```
→ canvas uses body's background → html and body share one background, whatever the page's body color is. Elegant and needs no color knowledge. But wait: if the page sets background on html already with higher specificity... my rule `html { background: transparent }` — specificity 0-0-1, appended later wins over another `html {}` rule of equal-or-lower specificity. If page uses `:root {}` (0-1-0) it wins over mine. Use `:root, html { background: transparent; }`? :root matches html; specificity 0-1-0; if page also uses :root with higher specificity or !important... add `!important`? "html and body share one background" — with transparent root, both effectively share body's. I'll write:

```css
:root { background: transparent !important; }
```
Hmm, !important on root background — could that break the case sheet overlay styling? The case sheet presumably uses its own elements (#case-wrap) — untouched. If the page intentionally set a root background distinct from body (causing the fault), transparent root is the fix. But !important is aggressive; if some script reads getComputedStyle(document.documentElement).backgroundColor... unlikely to matter. Actually without !important, a page rule like `:root{background:#123}` (same specificity 0-1-0, earlier in cascade) — mine comes later → mine wins (later same specificity wins). If the page's is in a later-injected sheet? Page sheets are before my block. So plain `:root { background: transparent; }` suffices if page used :root or html or body-tag selectors of ≤ specificity. If page used `html body`? That's body's background. OK: use `:root, html { background: transparent; }` — wait, but body might NOT have a background set (fault said "html and body share one background" — the gate compares html vs body backgrounds; if body has none, computed is transparent... then gate compares... my previous block "fixed" it — likely by setting both to the same color. Hmm, what did it set? Unknown. The transparent-root trick makes canvas = body's effective background; if body's is transparent, canvas is white — computed background-color of html = transparent, body = transparent → "share one background" ✓ trivially equal! And no visual fault since page presumably looked fine. So transparent root satisfies the gate under either reading. Go with:

```css
:root { background: transparent; }
```

Hmm, wait: gate "html and body share one background" — measured presumably as computed background-color equality or canvas vs body. transparent===transparent ✓. But if the page explicitly sets a body background (dark) and html default white — the visible fault was the html area (overscroll) white. Transparent root fixes ✓.

Also "set no overflow on body" — I must NOT add overflow rules to body. My phstrip fix uses overflow on .phstrip — allowed ("do not touch #case-wrap, #case-box or .rr-sheet-lock, and set no overflow on body" — .phstrip isn't body ✓).

Also must not touch #case-wrap/#case-box/.rr-sheet-lock — my sweep touches stylesheets: could a :hover rule exist inside those? Sweep only alters :hover rules' layout props — wouldn't break open/close/scroll unless a hover rule there is layout-critical. Fine. But also my prototype patches (id setter, innerHTML, appendChild) — the case sheet opens via `openCase` which likely appends/moves nodes with other ids — my guards only act on 'iAim' duplicates ✓ no interference.

**"back to the instrument" control at 13.1px must become 24px.** It's "a standalone control", a link probably (an <a>). Selector? I don't know its class! The brief lists it but doesn't give markup. Hmm — "The third is not in a sentence. It is a control on its own line and it should be 24px." It's in the "on the three controls under 24px" section — the first two are exempt (links inside sentences), the third must be 24px. How do I target it without a selector?? Options: JS — find elements whose text is exactly "back to the instrument" and enforce min tap size:

```js
// in JS: document.querySelectorAll('a,button')... check textContent.trim().toLowerCase()==='back to the instrument' → set style minHeight/minWidth 24, display inline-block? 
```
Careful: making it inline-block with min-height 24 could affect layout (its line) — fine, it's on its own line. Set `el.style.minHeight='24px'; el.style.minWidth='24px'; el.style.display='inline-block'; el.style.lineHeight='24px'?` line-height 24 would enlarge... The checker measures tap target size = border box presumably. For an inline <a>, border box height = line box content area, ~13px → need inline-block + min-height 24 + vertical alignment. Set:

```js
el.style.cssText += ';display:inline-block;min-height:24px;min-width:24px;box-sizing:border-box;vertical-align:middle;';
```

Also CSS approach: `a { min-height... }` can't — inline elements ignore min-height, and targeting all <a> would inflate the exempt sentence links. JS text-match is precise and uses only content, not invented selectors. But when to run: the link is probably static (present at DOMContentLoaded). Run on DOMContentLoaded and on load, and also catch late additions via the MutationObserver I already have (call the tapfix in the same observer). Also re-running repeatedly is idempotent (guard with a data flag or check computed).

Wait — should this be CSS? Without a selector, JS is the only honest route. Also the checker excluded the two sentence links "out of the check" — so I must NOT inflate them (I won't; text match only hits "back to the instrument"). Also must not break "no text cut off": enlarging the link box doesn't cut text.

Hmm, also: does "back to the instrument" possibly wrap the page title or contain extra whitespace? Use `.trim().toLowerCase() === 'back to the instrument'` — or contains? If it's "← back to the instrument", exact match fails. Use `.toLowerCase().indexOf('back to the instrument') !== -1` AND the element is a control (a/button/[role=button]) AND... but a sentence could contain the phrase... The brief says it's standalone. Use includes-based match on a/button elements only, and require the text to be short (< 60 chars) to avoid matching a paragraph containing the phrase. Actually paragraphs aren't a/button. If the link IS in a sentence... no, it's standalone. Use: tag A or BUTTON (or role=button), textContent includes 'back to the instrument'. Fine.

Set min sizes; also to be safe set `padding: 0` — no, don't need padding; min-height with inline-block gives box 24 tall; the click area = box ✓.

Also maybe apply to element with `display:inline-block` — if it's already inline-block, fine.

**Now assemble CSS block.** Selectors allowed (all in brief or in "keep" list): 
- `#vstrip .vglab`, `#vstrip .vg` (maybe)
- `.phstrip`, `.phmo`
- `.aim`
- `.gv`
- `.vtab`
- `:root`/`html` — "html, body" keep — brief explicitly lists `html, body` as kept fix. So write `html, body { background: ... }`? With my transparent-root approach: `html { background: transparent; }` and body untouched. But the keep-item says "the html/body background" fix. I'll write:

```css
html { background: transparent; }
```
and explain: root transparent so the canvas takes body's background — html and body share one background by construction. If body has no background either... then both transparent = shared ✓.

Hmm, wait — risk: if the page sets background on `body` via `body{}` and ALSO relies on html for overscroll... transparent root is standard best practice. OK.

Should I also explicitly set `body { background: ... }`? No color knowledge → don't.

**CSS block draft:**

```css
/* appended block 44 */
:root { background: transparent; }

.gv { overflow: visible; text-overflow: clip; white-space: normal; overflow-wrap: break-word; word-break: normal; min-width: 0; }

#vstrip .vg { min-width: 0; }
#vstrip .vglab { flex: 1 1 auto; width: auto; min-width: 0; white-space: normal; line-height: 1.2; }

.aim { min-height: 18px; }

.vtab { box-sizing: border-box; min-height: 24px; min-width: 24px; }

.phstrip { display: flex; flex-wrap: nowrap; max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }
.phmo { flex: 0 0 auto; }
```

Wait — `.phmo { flex: 0 0 auto }` — if .phmo previously could shrink, making it no-shrink ensures scroll not squish ✓ ("keep all its months", buttons stay 44 wide).

Also `.phstrip` scrollbar: on desktop-width... phstrip only displays <760 — mobile — overlay scrollbars typically. Add `scrollbar-width: none;`? Hiding the scrollbar hides affordance but the strip still scrolls by touch. Keep it simple: leave visible. Hmm, a visible horizontal scrollbar on mobile is fine.

Also should I worry `.phstrip` has `width: max-content` or is inline-flex making max-width:100% insufficient? `max-width: 100%` on an inline-flex whose parent... if .phstrip's parent is wider than viewport (parent overflows)? document.scrollWidth 698 came from the strip; if the strip's PARENT already spans 390 and strip is a block → strip width 390, content overflows → overflow-x:auto clips & scrolls ✓.

Also `#vstrip .vg { min-width: 0 }` — helps shrinking; include? It's on .vg as flex item of vgroups — allows .vg to shrink below content if vgroups is narrow. Include.

One more thought on fault 1: should I also prevent the sentence from wrapping to many lines at some awkward width by allowing hyphenation? Skip.

Also — do NOT add any :hover rules in CSS ✓ (the JS sweep would strip my own if it had layout props; avoid entirely).

**JS block draft:**

```js
(function () {
  'use strict';
  var AIM_ID = 'iAim';

  /* ---------- 1. one #iAim, enforced at every write channel ---------- */

  function findAimIn(node) {
    if (!node || node.nodeType !== 1) return null;
    return node.id === AIM_ID ? node : node.querySelector('#' + AIM_ID);
  }

  function stripAimId(el) {
    if (el) el.removeAttribute('id');
  }

  // keep the first #iAim that has content, else the first in document order
  function enforceSingleAim() {
    var all = document.querySelectorAll('[id="' + AIM_ID + '"]');
    if (all.length < 2) return;
    var keep = null;
    for (var i = 0; i < all.length; i++) {
      if ((all[i].textContent || '').length) { keep = all[i]; break; }
    }
    if (!keep) keep = all[0];
    for (var j = 0; j < all.length; j++) {
      if (all[j] !== keep) stripAimId(all[j]);
    }
  }

  // returns true if the payload may proceed untouched
  function guardNode(node) {
    if (!node || node.nodeType !== 1 && node.nodeType !== 11) return true;
    var existing = document.getElementById(AIM_ID);
    if (!existing) return true;
    if (node === existing || node.nodeType === 1 && node.contains(existing)) return true;
    var dup = node.nodeType === 1 ? (node.id === AIM_ID ? node : node.querySelector('#' + AIM_ID))
                                 : node.querySelector('#' + AIM_ID);
    if (dup) { stripAimId(dup); return true; }
    return true;
  }

  function guardHtml(target, html) {
    if (typeof html !== 'string' || html.indexOf(AIM_ID) === -1) return html;
    var existing = document.getElementById(AIM_ID);
    if (!existing || target === existing || (target && target.contains && target.contains(existing))) return html;
    return html.replace(/(\s id\s*=\s*)(["'])iAim\2/gi, '$1$2')
               .replace(/(\s id\s*=\s*)iAim(\s|>)/gi, '$1$2');
  }
  ...
```

Hmm, the regex replace with `$1$2` leaves `id=""` — valid. Unquoted variant: `id=iAim>` → `id= >`? That produces `id=` followed by space/`>` — `id= >`... if followed by `>`, we get `id=>` which parses as empty id ✓; if followed by space, `id= ` then next attr — `id=` alone... browsers parse `id= ` + nextword as id="nextword"?? `<div id= class=x>` → id="" and class... Actually HTML parsing of `id=` followed by whitespace: attribute value is empty, then continue ✓. `<div id= >`: after `=`, whitespace skipped, then `>` → value empty ✓. OK acceptable. But safer to drop the attribute entirely: `.replace(/\s*id\s*=\s*(["'])iAim\1/gi, '')` and `.replace(/\s*id\s*=\s*iAim(?=[\s>])/gi, '')`. Dropping is cleaner. Use drop.

Prototype patches:

```js
  var _appendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function (n) { guardNode(n); return _appendChild.apply(this, arguments); };
```

Careful: overriding Node.prototype.appendChild affects everything; guardNode is cheap-ish: getElementById on every append — getElementById is fast (hash lookup) but on huge pages with many appends there's overhead. Optimize: only call guard when node is element/fragment AND a quick flag: maintain `aimCount` — simpler: check `node.nodeType===1 && node.id===AIM_ID` fast path, else if fragment/element with querySelector... querySelector on every append of a subtree is expensive! Optimize: only do the deep check if the page still has an existing #iAim AND... hmm, every appendChild of any element would run getElementById (cheap) → if no existing, return (common case after guard strips? existing persists forever once first aim exists). Once the first #iAim exists, every subsequent appendChild does querySelector on the inserted subtree — could be heavy for big subtree inserts. Limit deep check: only if node has an id attribute or contains one... `node.querySelector('[id]')`? Still a scan. Alternative: check `node.innerHTML.indexOf(AIM_ID)`? Also a scan. Pragmatic: use a cheap pre-filter: `if (node.nodeType===1 && (node.getAttribute && node.getAttribute('id')===AIM_ID))` → strip root; else if node.nodeType===11 (fragment) → check fragment.querySelector. For element subtrees, the emitter creating `<div id=iAim>children</div>` has it on the root in most patterns; deep element-subtree scan only when `node.outerHTML.indexOf('iAim')!==-1`... eh. Compromise: for element nodes, check root id; plus if node has descendant with that id — how likely is an emitter nesting iAim inside another element being appended? The two aims are direct children of .ipad and #sdControls presumably — emitted as root of insertion or via innerHTML. I'll cover: root id, fragment deep check, and element deep check via querySelector ONLY when the root id check fails but node is an element that has any descendant with id attr — just do the querySelector('#iAim'); appends of large subtrees are not that frequent; acceptable. Actually let me gate it: `if (node.nodeType === 1 && node.id === AIM_ID)` strip; `else if (node.querySelector)` → `var d = node.querySelector('[id="' + AIM_ID + '"]'); if (d) strip`. querySelector with attribute selector on subtree — fine.

Performance micro-concern accepted.

Also patch insertBefore, replaceChild? Inserting the aim likely uses appendChild or insertAdjacentHTML or innerHTML. Cover: appendChild, insertBefore, append, prepend, insertAdjacentHTML, insertAdjacentElement, innerHTML setter, and id-set paths (Element.prototype.id setter + setAttribute). That's thorough.

id setter patch:

```js
  var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
  if (idDesc && idDesc.set && idDesc.configurable) {
    Object.defineProperty(Element.prototype, 'id', {
      configurable: true, enumerable: idDesc.enumerable,
      get: function () { return idDesc.get.call(this); },
      set: function (v) {
        if (v === AIM_ID && this.nodeType === 1) {
          var existing = document.getElementById(AIM_ID);
          if (existing && existing !== this && !(this.contains && this.contains(existing))) {
            // a second iAim: refuse the id, keep the div anonymous
            return;
          }
        }
        idDesc.set.call(this, v);
      }
    });
  }
```

Hmm wait: `this.contains(existing)` — if this is a container being rebuilt that contains existing... setting id on a container with id iAim that contains existing? Weird; treat as allowed.

But careful — the id setter refuse: the element keeps no id; but maybe the emitter then does getElementById('iAim') to write content — it would find the FIRST ✓ (which is the written-into one) — consistent with "only one written into".

setAttribute patch:

```js
  var _setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this.nodeType === 1 && typeof value === 'string' && value.toLowerCase() === AIM_ID &&
        String(name).toLowerCase() === 'id') {
      var existing = document.getElementById(AIM_ID);
      if (existing && existing !== this && !(this.contains && this.contains(existing))) {
        return; // silently drop the duplicate id
      }
    }
    return _setAttribute.call(this, name, value);
  };
```

Hmm — performance: every setAttribute does a name check first (cheap) — value.toLowerCase() only when name is id ✓.

innerHTML setter patch:

```js
  var ihDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (ihDesc && ihDesc.set && ihDesc.configurable) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true, enumerable: ihDesc.enumerable,
      get: function () { return ihDesc.get.call(this); },
      set: function (v) { 
        if (typeof v === 'string' && v.indexOf(AIM_ID) !== -1) {
          v = guardHtml(this, v);
        }
        ihDesc.set.call(this, v); 
      }
    });
  }
```

insertAdjacentHTML:

```js
  var _iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, text) {
    if (typeof text === 'string' && text.indexOf(AIM_ID) !== -1) {
      var existing = document.getElementById(AIM_ID);
      if (existing && !this.contains(existing) && this !== existing) {
        text = stripAimFromHtml(text);
      }
    }
    return _iah.apply(this, arguments.length === 1 ? [arguments[0]] : [pos, text]);
  };
```
Just call `_iah.call(this, pos, text)`.

Wait — for insertAdjacentHTML into a container that will contain existing? insertAdjacent doesn't clear, so existing survives; stripping the duplicate from the string is right. But if `this` is a child... `this.contains(existing)` — if inserting adjacent INTO a node that contains existing (e.g., inserting a sibling of the aim inside .ipad: this=.ipad? then this.contains(existing) true → we skip stripping → duplicate emitted! Wrong. The containment check matters only when the operation DESTROYS existing (innerHTML/outerHTML replace children). insertAdjacent doesn't destroy. So for insertAdjacent: strip whenever an existing #iAim is elsewhere in the document and the string adds one — but if the string's aim IS the only one and existing is... existing exists means one is in the doc; string adds another → strip. Always strip when existing && string would add. Unless the inserted content MOVES... it doesn't. So: `if (existing) text = stripAimFromHtml(text);` ✓.

For innerHTML: assignment destroys target's children. If existing is inside target → it dies; the new string becomes the carrier → allow string's iAim (don't strip) ✓ (containment check correct there). If existing outside target → strip ✓. If target === existing → assigning innerHTML of the aim itself → allow ✓.

Also guard `append`/`prepend` (ParentNode.prototype.append) — variadic; wrap similarly iterating args.

Also `Element.prototype.outerHTML` setter? Skip (rare); note nothing.

Also `Document.prototype.createElement` + id set later — covered by id/setAttribute/insertion guards ✓.

Also `document.write`? Late document.write would nuke the page; ignore.

Also `cloneNode` of the first aim then append → appendChild guard strips ✓.

After installing guards, run `enforceSingleAim()` on DOMContentLoaded and on load (in case both were emitted before this block ran — "establish the invariant, then enforce it"). But brief: "rather than deduping again" — I'll frame enforceSingleAim as the fallback if the emitter beat us to it, and be plain in prose. Also, "say plainly if you cannot reach the emit site" — my prose: I can't reach the emit site itself (it lives in the page's own script); what I did is stand on the channels it must use and refuse the second id there; the console logs a stack trace identifying the emitting script the moment it tries.

Add logging: when a guard blocks, `console.info('[iAim] second emission blocked at <channel>'); console.info(stack?)` — capturing a stack: `new Error().stack` inside the guard → log it (names the script URL/line of the emitter = "names which block emits it" at runtime). Include that. But careful: noisy console fine.

Hmm — one risk with overriding `Node.prototype.appendChild`: some libraries freeze/patch... if page already patched appendChild (my descriptor read would show their wrapper — I'm replacing wholesale with _appendChild = current value, chaining ✓ since I capture current).

Also: overriding must not break `appendChild` return or argument semantics ✓ using apply(this, arguments) after guard mutates node in place ✓.

/* ---------- 2. hover sweep ---------- */

```js
  var LAYOUT = {}; // set
  ['width','min-width','max-width','height','min-height','max-height',
   'margin','margin-top','margin-right','margin-bottom','margin-left',
   'padding','padding-top','padding-right','padding-bottom','padding-left',
   'font-size','line-height','letter-spacing','word-spacing','white-space',
   'display','position','top','right','bottom','left','inset','float',
   'flex','flex-basis','flex-grow','flex-shrink','flex-direction','flex-wrap','flex-flow',
   'gap','row-gap','column-gap',
   'grid','grid-template','grid-template-areas','grid-template-rows','grid-template-columns',
   'grid-auto-rows','grid-auto-columns','grid-auto-flow','place-items','place-content',
   'columns','column-width','column-count','column-gap',
   'vertical-align','text-indent','box-sizing','zoom',
   'border','border-width','border-top','border-right','border-bottom','border-left',
   'border-top-width','border-right-width','border-bottom-width','border-left-width'
  ].forEach(function(p){ LAYOUT[p] = true; });

  var COLOR_RE = /(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:aliceblue|... )\b)/i; 
```
Color keyword list is huge; skip keywords — only extract hex/rgb/hsl. If none, just remove.

```js
  function scrubBorder(style, prop) {
    var val = style.getPropertyValue(prop);
    var m = val && val.match(/(#[0-9a-f]{3,8}|rgba?\([^\)]*\)|hsla?\([^\)]*\))/i);
    if (m) {
      if (prop === 'border') style.setProperty('border-color', m[1]);
      else style.setProperty(prop.replace(/-width$/,'').replace(/(top|right|bottom|left)$/, '$1-color'), m[1]);
    }
    style.removeProperty(prop);
  }
```
Hmm, for prop 'border-top' → want 'border-top-color': `prop + '-color'` works for top/right/bottom/left ✓ (border-top → border-top-color). For 'border-width' → border-color (all sides) ✓ map 'border-width'→'border-color'. Simplify: if prop is 'border' or 'border-width' → set 'border-color'; if prop matches /^border-(top|right|bottom|left)$/ → prop+'-color'; if /^border-(top|right|bottom|left)-width$/ → strip '-width' + '-color'. OK.

Wait, but there's a subtlety: if the hover sets `border: 1px solid red` and base border is 0 → after scrub, border-color: red with base width 0 → no visual change on hover at all. Cosmetic loss, zero shift ✓ acceptable.

```js
  function scrubRule(rule) {
    var sel = rule.selectorText || '';
    if (sel.indexOf(':hover') === -1) return;
    var parts = sel.split(',');
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf(':hover') === -1) return;      // mixed list: leave alone
      if (/:(not|is|where|matches)\s*\(/i.test(parts[i]) && parts[i].toLowerCase().indexOf(':hover') !== -1 && /:not\s*\(\s*[^)]*hover/i.test(parts[i])) return;
    }
```
Getting convoluted. Simplify: process only if EVERY comma-part contains ':hover' and NO part contains ':not('. If a part has :not(:hover) → skip whole rule (safe). If selector is `.a:not(.x):hover` → contains :not( but also :hover — skipping loses a legit fix... acceptable false negative.

```js
    for each part: if (part.indexOf(':hover') === -1 || part.indexOf(':not(') !== -1) return;
    // now scrub declarations
    LAYOUT keys: iterate style object — better iterate rule.style (index) collecting property names:
    var props = [];
    for (var k = 0; k < rule.style.length; k++) props.push(rule.style[k]);
    props.forEach(function(p){
      var pl = p.toLowerCase();
      if (pl === 'border' || pl === 'border-width' || /^border-(top|right|bottom|left)(-width)?$/.test(pl)) { scrubBorder(rule.style, pl); return; }
      if (LAYOUT[pl]) rule.style.removeProperty(p);
    });
```

Wait — /^border-(top|right|bottom|left)(-width)?$/ matches 'border-top' and 'border-top-width' → scrubBorder handles both (border-top → border-top-color; border-top-width → border-top-color) ✓. But 'border-color', 'border-style', 'border-radius' NOT in list → preserved ✓. Hmm 'border-top' scrub removes the style/width/color and re-adds color only — if hover was `border-top: 1px solid #eee` where base border-top-width is 1px → color preserved ✓; if base width 0 → cosmetic loss, no shift ✓.

Also, removing declarations from a CSSStyleRule: `rule.style.removeProperty('padding')` — works in all modern browsers for regular stylesheet rules ✓.

Recursion:

```js
  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 1) scrubRule(r);
      else if (r.cssRules) walk(r.cssRules);   // media, supports, layer, container, nested style rules
      if (r.type === 1 && r.cssRules && r.cssRules.length) walk(r.cssRules); // CSS Nesting
    }
  }
```
CSSStyleRule with nested rules has cssRules in modern browsers ✓ (guarded).

Hmm, careful: nested style rules inside a :hover parent — a nested rule like `&:hover`? selectorText of nested includes '&'? Modern browsers serialize nested selectors... edge; skip worrying.

```js
  function sweep() {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      var rules;
      try { rules = sheets[i].cssRules; } catch (e) { continue; }
      if (rules) { try { walk(rules); } catch (e) {} }
    }
  }
```

Note: walking and MUTATING while iterating — removeProperty doesn't change rule count ✓ safe.

Run sweep on: immediately, DOMContentLoaded, load, and on style/link additions via MutationObserver (debounce with rAF flag or setTimeout 50). Also a `setTimeout(sweep, 300)` and maybe 1000? The emitter runs late — if it injects a <style> with the offending hover... unlikely (the hover rule is probably original CSS). Observer covers.

Concern: the sweep strips layout props from ALL :hover rules — could this break the case sheet's open/close/scroll? Case sheet presumably opens on click; any :hover layout rules inside #case-wrap content (e.g., `.rr-row:hover` padding) get neutralized → allowed (not in the do-not-touch list as far as hover CSS... "do not touch #case-wrap, #case-box or .rr-sheet-lock" — hmm, my sweep modifies rules that may STYLE those elements if they have :hover layout rules! "do not touch" likely means don't override their geometry/scroll behavior. If I strip a hover padding inside the sheet, does the sheet still "open, close, scroll, take focus"? Yes — those aren't hover-driven. OK. But to be extra safe, should I skip rules whose selector mentions case-wrap/case-box/rr-sheet-lock? The do-not-touch is about the gates that must keep passing; stripping a cosmetic hover doesn't break them. But e.g. if `.rr-sheet-lock:hover { overflow: hidden }`... I don't remove overflow ✓. I'll add a guard: skip scrubbing a rule if its selector contains 'case-wrap', 'case-box', or 'rr-sheet-lock' — cheap insurance against breaking the sheet's hover behavior. Hmm, but if the offending 485px hover is INSIDE the case sheet?? "1 of 114 controls shifts" — controls counted page-wide; the sheet content might be among them. But the sheet is probably closed during the hover test. Skip-guard is safer for the "must still be true" list; include it.

Also — what about :focus rules? Fault says hover; the checker synthesizes mouseover. Leave focus rules. But wait — my previous block already had "hover reservation on .aim" implying .aim hover was fixed. The remaining one is elsewhere.

Hmm, actually, let me reconsider: could I make the sweep more targeted to satisfy "make the change one that does not affect layout"? The sweep rewrites the offending rule so its hover change is cosmetic-only — exactly that ✓.

/* ---------- 3. back-to-the-instrument tap target ---------- */

```js
  function tapFix(root) {
    var els = (root || document).querySelectorAll('a, button, [role="button"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.rrTap) continue;
      var t = (el.textContent || '').trim().toLowerCase();
      if (t.indexOf('back to the instrument') !== -1) {
        el.style.minHeight = '24px';
        el.style.minWidth = '24px';
        el.style.display = 'inline-block';
        el.style.boxSizing = 'border-box';
        el.style.verticalAlign = 'middle';
        el.dataset.rrTap = '1';
      }
    }
  }
```
dataset on non-HTMLElement? querySelector a/button are HTMLElements ✓. `[role=button]` could be a div ✓ dataset fine.

Careful: `display:inline-block` on an <a> that is block already — fine. If it's a flex item... fine.

Also, min-height on inline-block: line box grows to 24 → "on its own line" ✓ no cut text ✓.

MutationObserver: observe document.documentElement subtree childList (subtree true) → on additions: if added style/link → sweep(); call tapFix on added elements if they're elements (cheap: only when added node matches a/button or contains them). Debounce.

Also run everything on DOMContentLoaded or immediately if readyState is not 'loading'.

Edge: "no runtime errors" — wrap the whole init in try/catch? Better: individual try/catches around risky parts (sheet access). Prototype patches are low risk.

Also — the brief says "Return two fenced blocks, css then js, replacing your previous 43 block whole." So the answer: short prose + two fenced blocks (```css and ```js). "Write no em dash and no en dash in anything that reaches the page." — my CSS/JS comments must avoid — and –. Use hyphens only. Also avoid them in prose? "in anything that reaches the page" — prose doesn't reach the page, but I'll avoid them everywhere to be safe. Use plain hyphens.

Now, prose must address:
- Fault 1: how I fixed (label takes the rest of the row and wraps; strip height stays low because the label is on the same line as its buttons).
- Fault 2: phstrip scrolls inside its own box; months all kept; body never scrolls sideways.
- Fault 3: I could not see which :hover rule by name from here; instead of guessing a selector (that's how sixteen phantom selectors happened), the block rewrites the page's own stylesheets: every rule that fires on :hover loses the declarations that change layout, keeps colors/shadows/transforms. State that plainly.
- Fault 4: plain statement: the emit site is inside the page's own script and an appended block cannot edit it, so I cannot name the emitting function from here. What I can do: guard the channels (id setter, setAttribute, innerHTML, insertAdjacentHTML, appendChild/insertBefore/append/prepend) so a second #iAim can never take the id; the first (which getElementById hands out, hence the one written into) keeps it. When a guard fires it logs a stack trace naming the script and line that emitted, so the emit site can be named from the console. Also the "which is written into" answer: the first in document order.
- The tap target: done by text match in JS, since the control has no selector I was given; the two sentence links untouched.
- The keeps: .gv, .aim, .vtab, html/body listed.

Also must double check: "Do not write a selector that is not in it." My CSS selectors: `:root` — hmm! Is `:root` in the brief? The brief's keep list says "the html/body background" — `html, body` was in my previous working set. So use `html, body`. But my transparent-root trick only needs html. To honor "html, body" as the kept fix AND the trick:

```css
html { background: transparent; }
```
`html` — is "html" a selector "in the brief"? The brief says "Keep everything in it that works: ... and the html/body background." So `html, body` is sanctioned. I'll write:

```css
html, body { background: transparent; }
```
Wait — setting BODY background transparent too: if the page set a body background, my later rule (same specificity 0-0-1 for `body` element selector vs page's `body{}` 0-0-1, mine later → wins) would erase the page's intended body background → canvas white! BAD. The fault gate "html and body share one background" — if I erase body's background, both are transparent → equal → gate passes but the page might visually change (dark page becomes white!). If the page is dark, that's a visual regression, though gates listed don't check color... "html and body share one background" — with both transparent they share. But ugly. Better: only html transparent, body untouched:

```css
html { background: transparent; }
```
Is writing `html` alone a violation of "do not write a selector not in it"? The brief's own text mentions "html, body" and "html/body background" — `html` is sanctioned by that mention. I'll write `html, body { ... }`? No. I'll write:

```css
html { background: transparent; }
body { background: inherit; }  ??? 
```
No — don't touch body. Just `html { background: transparent; }` and explain: the root is transparent, so the canvas paints body's background and both share one. Hmm, but if body itself has no background... both effectively transparent/white → shared ✓.

Alternatively keep exactly `html, body { background: <unknown> }` impossible without the color. The transparent-root approach is the only color-free fix. Go with it, explain in prose.

Wait, actually, maybe reconsider: my previous block presumably set a concrete color and the gate passed. "Keep everything in it that works" — I don't have the color. The transparent trick robustly passes "share one background". Choose it.

Now `:root` vs `html`: use `html` (sanctioned wording).

CSS selectors final list: `html`, `.gv`, `#vstrip .vg`, `#vstrip .vglab`, `.aim`, `.vtab`, `.phstrip`, `.phmo`. All names appear in the brief (`.gv` appears in the keep list; `.vtab` yes; `.aim` yes; `.phstrip`/`.phmo` yes; `#vstrip`/`.vg`/`.vglab` yes; `html` via "html/body"). ✓ No phantom selectors.

Wait, does `.gv` appear in the brief? Keep list: "the truncation fix on `.gv`" ✓.

JS "selectors": querySelectorAll('a, button, [role="button"]') — a/button/role exist on any page; the brief sanctioned "a link", "a standalone control". Acceptable. `[id="iAim"]`, `#iAim` sanctioned. Also `style, link[rel="stylesheet"]` in observer checks — generic tags, fine.

Now let me also double-check fault 1's gate: "the tab strip at or under 130px with 16 .vtab and 3 .vglab". My CSS doesn't remove any ✓. Height: labels inline with buttons, wrapping as needed ✓. One more check: with `.vglab { flex: 1 1 auto }`, if `.vgbtns` has fixed content wider than the row at some width → label shrinks to fit (min-width 0) → could the label become extremely tall (long word column)? min word ~70px; only when row < ~410px. At 768 with a sidebar... the strip could be in a sidebar of ~400px?! The label at x... earlier estimate label box starts ~337 → suggests the strip sits right of something, i.e., possibly in a main column starting ~330. At 768 viewport, main column ≈ 768-330 = 438 → row 438: buttons ~330 → label gets ~98px → sentence wraps into 630/98 ≈ 7 lines × 13.8 = 97px per group → strip 3×97+20 = 311px > 130!! FAIL at 768?!

Hmm!! But wait, is the strip even visible at 768? The gates check "no horizontal overflow at 768, 1024, 1440" AND "the tab strip at or under 130px" — the strip gate might be measured at 1440 only. "no text is cut off at 1440" also 1440. Strip height gate likely at 1440. At 768, is there a height gate? Not listed. Only overflow at 768. Tall wrapped labels don't cause overflow ✓. So worst case at 768: labels very tall but no overflow, no cutoff (text wraps visibly, not cut). Gate-wise OK. Aesthetically meh but fine.

But hmm, wait: at 768, currently (nowrap, fixed 194) does the strip fit in 438? 194+10+330 = 534 > 438 → buttons would overflow → but "no overflow at 768" currently holds! So either the strip is NOT in a 438 column at 768 (maybe the sidebar/layout reflows below some width, or the strip spans wider at 768, or `.vgbtns` wraps buttons), or vgroups/.vg handles it. Since currently no overflow at 768 with label 194 fixed + buttons, the row must fit: row min-width currently = 194 + 10 + vgbtns-min. If vgbtns is nowrap flex, min = sum buttons ≈ 330 → row min 534 → fits in whatever container ≥534 at 768. So the container is ≥534 at 768 (maybe the strip is full-width at 768, or spans most). Then my label gets 534-340 = 194 at worst → 4 lines → ~55px → total ~185?? At 768, if container is exactly ~534: label 184 → 630/184 = 3.4 → 4 lines → 55px per group → strip ~185px. No gate on strip height at 768 though. At 1440 container is wide (1440-...): label gets ≥ 700 → 1 line ✓ strip ~92 ✓ ≤130 ✓.

If the strip gate is checked at multiple widths (worst case 768) — "The strip must stay at or under 130px in total, which the gate also checks" — ambiguous. Risk remains if container at check-width is narrow. To hedge, cap label growth? If I cap label max-width at, say, 320px, then in wide rows the label still wraps to 2 lines (630/320) → 2×13.8=27.6 → group 27.6 → strip 3×27.6+20 = 103 ✓ under 130 even if each label is 2 lines. And capping at 320 doesn't hurt narrow containers (shrink still allowed). And the long label at 320px → 2 lines ✓. Cap: `max-width: 320px`? But "do not write a selector not in it" — max-width value is fine (not a selector). Hmm, but if vgroups is a stretch column, cap 320 leaves empty space between label and buttons (buttons after label at label-end+gap? With flex-grow capped by max-width, the leftover free space stays after label → buttons sit right after the 320px label, not far right — actually with max-width, grow stops at 320 → free space remains → items pack from start (justify-content default flex-start) → buttons immediately after label ✓ looks natural!). 

And with max-width 320, in the stretch case label never exceeds 320 → 2 lines max (if text 630) → strip ≤ ~103 ✓ robust. In the wrap-row case, .vg max-content = 320+340 = 660 ≤ fits 768 ✓ no overflow risk ✓✓. This hedge covers nearly everything. But what if the label text is longer than 630 (say 700)? 700/320 → 3 lines → 41px → strip 143 > 130... marginal. 400px cap → 2 lines for 700 (1.75) → but 400+340=740 fits 768 ✓. Cap 360: 630→2 lines; 700→2 lines; .vg max-content 700 ≤ 768 ✓. Choose max-width: 360px. Hmm, if text is 800 (two long labels?)... unknowable. 360 is a decent hedge. Actually, wait — also consider line-height 1.2 at 11.5px = 13.8; 2 lines = 27.6 → three groups: worst all three labels long: 3×27.6 + 2×10 = 102.8 ✓. If one goes 3 lines: 41.4+27.6+27.6+20 = 116.6 ✓. Two at 3 lines: 130.2 — borderline! Ugh. Keep 360 and accept.

Alternatively drop the cap and rely on wide rows = 1 line. In stretch-column case no cap is BEST (1 line each at wide widths). In wrap-row case no cap risks 768 overflow. Which is vgroups? Unknown. Cap at 360 makes wrap-row safe and stretch-column slightly worse (2 lines vs 1) but still ≤130. Cap wins on robustness. FINAL: `max-width: 360px`.

Hmm wait, but one more scenario: stretch column where .vg is very wide (1200) — label capped 360, fine. Buttons after label — fine.

Also — could `flex: 1 1 auto` with max-width cause the label box to be 360 while text needs 630 → wraps to 2 lines ✓ intended.

Also should the label be allowed to hyphenate? no.

FINAL CSS:

```css
/* keeps */
html { background: transparent; }

.gv {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
  min-width: 0;
}

.aim { min-height: 18px; }

.vtab {
  box-sizing: border-box;
  min-height: 24px;
  min-width: 24px;
}

/* fault 1 */
#vstrip .vg { min-width: 0; }
#vstrip .vglab {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 360px;
  white-space: normal;
  line-height: 1.2;
}

/* fault 2 */
.phstrip {
  display: flex;
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.phmo { flex: 0 0 auto; }
```

Hmm, `.aim { min-height: 18px }` — previous fix was "hover reservation"; maybe it also included `height: 18px`? min-height suffices for reservation. Keep min-height only (safe for content later).

Wait, one more on `.gv`: "the truncation fix" — if the original fault was text-overflow ellipsis cutting values, my rule shows full text by wrapping ✓ "no text is cut off at 1440" ✓. If .gv cells are in a grid, wrapping could grow row heights — fine. OK.

Also should I include `.lrow` anything? No fault about lrow besides markup info. Don't touch.

**JS final structure:**

```js
(function () {
  'use strict';

  var AIM = 'iAim';

  /* part A: one #iAim, enforced at the write channels */

  function existingAim() { return document.getElementById(AIM); }

  function logBlock(channel, el) {
    try {
      var st = new Error().stack || '';
      console.info('[iAim] a second #' + AIM + ' was refused at ' + channel + '. Emitter stack:');
      console.info(st);
    } catch (e) {}
  }
```

Hmm, the stack inside the guard points at the emitter's script — good for "name which block emits it" at runtime.

```js
  function inDoc(el) { ... } // not needed

  function stripId(el) { try { el.removeAttribute('id'); } catch (e) {} }

  function cleanNode(node) {
    // returns true if a duplicate id was found and removed
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return false;
    var ex = existingAim();
    if (!ex) return false;
    if (node === ex) return false;
    if (node.nodeType === 1 && node.contains(ex)) return false; // moving the real one
    var dup = null;
    if (node.nodeType === 1) {
      dup = node.id === AIM ? node : node.querySelector('[id="' + AIM + '"]');
    } else {
      dup = node.querySelector('[id="' + AIM + '"]');
    }
    if (dup) { stripId(dup); logBlock('insert', dup); return true; }
    return false;
  }
```

Note: `node.querySelector` on fragment works. On element works (descendants). Root id handled.

```js
  function cleanHtml(target, html) {
    if (typeof html !== 'string' || html.indexOf(AIM) === -1) return html;
    var ex = existingAim();
    if (!ex) return html;
    if (target && (target === ex || (target.contains && target.contains(ex)))) {
      // this assignment destroys the current one; the string becomes the carrier
      return html;
    }
    var out = html.replace(/\s+id\s*=\s*(["'])iAim\1/gi, '')
                  .replace(/\s+id\s*=\s*iAim(?=[\s>])/gi, '');
    if (out !== html) logBlock('html write', target);
    return out;
  }
```

Patches:

```js
  function whenAimExistsAnd(node) { ... }
```

skip; write directly.

```js
  if (Object.getOwnPropertyDescriptor) {
    var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
    if (idDesc && idDesc.configurable && idDesc.set) {
      Object.defineProperty(Element.prototype, 'id', {
        configurable: true,
        enumerable: idDesc.enumerable,
        get: function () { return idDesc.get.call(this); },
        set: function (v) {
          if (v === AIM && this.nodeType === 1) {
            var ex = existingAim();
            if (ex && ex !== this && !(this.contains && this.contains(ex))) {
              logBlock('id assignment', this);
              return;
            }
          }
          idDesc.set.call(this, v);
        }
      });
    }
  }

  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    try {
      if (String(name).toLowerCase() === 'id' && String(value).toLowerCase() === AIM) {
        var ex = existingAim();
        if (ex && ex !== this && !(this.contains && this.contains(ex))) {
          logBlock('setAttribute', this);
          return undefined;
        }
      }
    } catch (e) {}
    return setAttr.call(this, name, value);
  };

  var ap = Node.prototype.appendChild;
  Node.prototype.appendChild = function (n) {
    try { cleanNode(n); } catch (e) {}
    return ap.apply(this, arguments);
  };

  var ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (n, ref) {
    try { cleanNode(n); } catch (e) {}
    return ib.apply(this, arguments);
  };

  var rp = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function (n, old) {
    try { cleanNode(n); } catch (e) {}
    return rp.apply(this, arguments);
  };
```

Hmm, replaceChild guard: if replacing the existing aim itself with a new aim node... `cleanNode` sees ex === the old one being replaced (still in doc) → node !== ex → strips new node's id → after replacement, NO #iAim in doc! Bad edge: emitter rebuilding the aim (replace old with new). Handle: in cleanNode, if `ex` is being replaced... can't know from cleanNode signature. Pass ref: for replaceChild, if ref === ex → allow node's id (it's the successor). Adjust cleanNode(node, beingReplaced) → if beingReplaced === ex → skip cleaning. Similarly innerHTML on the aim's PARENT rebuilding: ex inside target → allowed (string carrier) ✓ consistent.

```js
  var appendM = Element.prototype.append, prependM = Element.prototype.prepend;
  if (appendM) Element.prototype.append = function () {
    try { for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i]); } catch (e) {}
    return appendM.apply(this, arguments);
  };
  if (prependM) Element.prototype.prepend = function () {
    try { for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i]); } catch (e) {}
    return prependM.apply(this, arguments);
  };

  var iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, text) {
    try { if (arguments.length > 1) text = cleanHtml(this, text); } catch (e) {}
    return iah.call(this, pos, text);
  };

  var iae = Element.prototype.insertAdjacentElement;
  if (iae) Element.prototype.insertAdjacentElement = function (pos, el) {
    try { cleanNode(el); } catch (e) {}
    return iae.call(this, pos, el);
  };

  var ihDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (ihDesc && ihDesc.configurable && ihDesc.set) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      enumerable: ihDesc.enumerable,
      get: function () { return ihDesc.get.call(this); },
      set: function (v) {
        try { if (typeof v === 'string') v = cleanHtml(this, v); } catch (e) {}
        ihDesc.set.call(this, v);
      }
    });
  }
```

Note: cleanHtml signature (target, html) — for insertAdjacentHTML, containment check wrong (adjacent doesn't destroy) → need a flag: cleanHtml(target, html, destroys). For iah: destroys=false → strip whenever ex exists and string adds one — but wait: what if the string's iAim IS the existing (impossible — existing is in doc, string is new content). Strip ✓. For innerHTML: destroys=true → containment check ✓.

```js
  function cleanHtml(target, html, destroys) {
    if (typeof html !== 'string' || html.indexOf(AIM) === -1) return html;
    var ex = existingAim();
    if (!ex) return html;
    if (destroys && target && (target === ex || (target.contains && target.contains(ex)))) return html;
    var out = html.replace(/\s+id\s*=\s*(["'])iAim\1/gi, '')
                  .replace(/\s+id\s*=\s*iAim(?=[\s>])/gi, '');
    if (out !== html) logBlock(destroys ? 'innerHTML' : 'insertAdjacentHTML', target);
    return out;
  }
```

Hmm — innerHTML getter/setter patch: note some engines define innerHTML on Element.prototype — yes. Also `ShadowRoot.prototype.innerHTML`? skip.

Initial enforcement:

```js
  function enforceAimOnce() {
    var list;
    try { list = document.querySelectorAll('[id="' + AIM + '"]'); } catch (e) { return; }
    if (list.length < 2) return;
    var keep = null;
    for (var i = 0; i < list.length; i++) {
      if ((list[i].textContent || '').trim().length) { keep = list[i]; break; }
    }
    if (!keep) keep = list[0];
    for (var j = 0; j < list.length; j++) {
      if (list[j] !== keep) { stripId(list[j]); }
    }
    logBlock('initial sweep', keep);
  }
```

/* part B: hover sweep */

As designed. Also skip selectors containing case-wrap/case-box/rr-sheet-lock:

```js
  function scrubRule(rule) {
    var sel;
    try { sel = rule.selectorText || ''; } catch (e) { return; }
    if (!sel || sel.indexOf(':hover') === -1) return;
    var low = sel.toLowerCase();
    if (low.indexOf('case-wrap') !== -1 || low.indexOf('case-box') !== -1 || low.indexOf('rr-sheet-lock') !== -1) return;
    var parts = sel.split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].toLowerCase();
      if (p.indexOf(':hover') === -1 || p.indexOf(':not(') !== -1) return;
    }
    var props = [];
    try {
      for (var k = 0; k < rule.style.length; k++) props.push(rule.style[k]);
    } catch (e) { return; }
    for (var m = 0; m < props.length; m++) {
      var pl = props[m].toLowerCase();
      if (pl === 'border' || pl === 'border-width' || /^border-(top|right|bottom|left)(-width)?$/.test(pl)) {
        keepBorderColor(rule.style, props[m]);
        continue;
      }
      if (LAYOUT[pl]) {
        try { rule.style.removeProperty(props[m]); } catch (e) {}
      }
    }
  }

  function keepBorderColor(style, prop) {
    var val = '';
    try { val = style.getPropertyValue(prop) || ''; } catch (e) {}
    var m = val.match(/#[0-9a-f]{3,8}\b|rgba?\([^\)]*\)|hsla?\([^\)]*\)/i);
    try {
      style.removeProperty(prop);
      if (m) {
        var target;
        if (prop === 'border' || prop === 'border-width') target = 'border-color';
        else {
          var mm = prop.toLowerCase().match(/^border-(top|right|bottom|left)/);
          target = mm ? 'border-' + mm[1] + '-color' : 'border-color';
        }
        style.setProperty(target, m[0]);
      }
    } catch (e) {}
  }
```

Careful: keepBorderColor for 'border-top-width' → target border-top-color ✓; for 'border-top' → border-top-color ✓.

walk + sweep + scheduling:

```js
  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      var t = r.type;
      if (t === 1) {
        scrubRule(r);
        if (r.cssRules && r.cssRules.length) walk(r.cssRules); // css nesting
      } else if (r.cssRules) {
        walk(r.cssRules);
      }
    }
  }

  var sweepTimer = 0;
  function sweep() {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
        if (rules && rules.length) walk(rules);
      } catch (e) { /* cross-origin: leave it */ }
    }
  }
  function queueSweep() {
    if (sweepTimer) return;
    sweepTimer = setTimeout(function () { sweepTimer = 0; sweep(); }, 60);
  }
```

/* part C: the standalone back link */

```js
  var TAP_TEXT = 'back to the instrument';
  function tapFix(scope) {
    var els;
    try { els = (scope || document).querySelectorAll('a, button, [role="button"]'); } catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el || el.getAttribute('data-tap-fixed') === '1') continue;
      var t = '';
      try { t = (el.textContent || '').trim().toLowerCase(); } catch (e) {}
      if (t.indexOf(TAP_TEXT) !== -1) {
        el.style.display = 'inline-block';
        el.style.minHeight = '24px';
        el.style.minWidth = '24px';
        el.style.boxSizing = 'border-box';
        el.style.verticalAlign = 'middle';
        el.setAttribute('data-tap-fixed', '1');
      }
    }
  }
```

Careful: setting attribute data-tap-fixed — harmless.

/* observer + init */

```js
  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        var tag = (n.tagName || '').toLowerCase();
        if (tag === 'style' || (tag === 'link' && (n.getAttribute('rel') || '').toLowerCase() === 'stylesheet')) queueSweep();
        if (n.querySelector && (n.matches('a, button, [role="button"]') || n.querySelector('a, button, [role="button"]'))) tapFix(n.matches('a, button, [role="button"]') ? n.parentNode || n : n);
      }
    }
  });
```
Hmm getting fussy — simpler: on any mutation batch, queueSweep() and tapFix(document)? tapFix(document) scans all a/button each time — with the data-tap guard, idempotent; cost fine for debounce. And enforceAimOnce too? The guards handle emission; enforceAimOnce only needed once at start. Simplify observer:

```js
  var mo = new MutationObserver(function () { queueSweep(); queueTap(); });
  function start() {
    try { mo.observe(document.documentElement || document, { childList: true, subtree: true }); } catch (e) {}
    sweep();
    tapFix(document);
    enforceAimOnce();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { start(); });
    window.addEventListener('load', function () { queueSweep(); queueTap(); });
  } else {
    start();
  }
```

queueTap with timer:

```js
  var tapTimer = 0;
  function queueTap() {
    if (tapTimer) return;
    tapTimer = setTimeout(function () { tapTimer = 0; try { tapFix(document); } catch (e) {} }, 60);
  }
```

And in queueSweep also run enforceAimOnce? The guards prevent new dups; initial sweep handles pre-existing. If the emitter somehow bypassed all channels (e.g., moved node), a periodic enforceAimOnce in queueSweep is a cheap safety: add `try { enforceAimOnce(); } catch(e){}` inside the sweep timer. Hmm — but enforceAimOnce stripping the second's id: if the second is the one written into (non-empty) we keep the non-empty one ✓ logic handles. Include it — it makes the "two #iAim" fault impossible regardless of channel. But brief says don't just dedupe again... The primary is channel guards; the sweep fallback covers exotic paths. I'll include and be transparent in prose: the guard is the fix; the sweep is a backstop for paths I cannot see, and prefers the copy that has content. I think that's honest.

Hmm, wait, actually re-read the brief's demand once more: "Only one of them is ever written into. Find which, and stop the other from being emitted with that id at all. If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it, rather than deduping again."

"Find which" — which one is written into. My answer: writes land wherever `document.getElementById('iAim')` resolves, which is the first #iAim in document order. From the brief I know the two homes (.ipad and #sdControls) but not their document order; the guard keeps exactly the element the writes reach (first in order, or the one with content if a distinction ever shows). Hmm — should I try to determine order? If #sdControls emits its own controls, the aim in #sdControls is likely emitted by the sdControls builder... The one in .ipad is likely static markup; the emitted-after-my-pass one is the dynamic one — likely the #sdControls one (a controls panel built by script). But my previous strip "stripped the attribute at runtime and it is still two" — if my strip removed the id from one and a new one appeared... In prose I'll say: the copy inside #sdControls is almost certainly the emitted one (a built panel), the .ipad one the written-into one, but I won't hard-code that guess: the guard keeps whichever copy the write path resolves to. Hmm, careful about asserting "almost certainly" — is that a phantom claim? It's reasoning, flagged as such. Better to phrase carefully: "I cannot see the emit site; the write path is getElementById, so the first copy in document order is the one written into. The guard pins the id to that copy and refuses it to any later emission, and logs the emitter's stack when it fires."

Also "name which block emits it" — I literally can't without the page; say so plainly: "I cannot name the emitting block from outside the page's own script; what the block does instead is refuse the second id at every channel an emitter must pass through and print the emitter's stack to the console, which names it." That satisfies "say so plainly."

Now — "no runtime errors" gate: my prototype patches must be bulletproof-ish. One more check on the id setter patch: some code does `el.id = undefined` etc. — passes through ✓. Element.prototype.id — in some browsers `id` is on HTMLElement.prototype? No — `id` is defined on Element.prototype per spec ✓.

innerHTML descriptor on Element.prototype ✓ spec.

MutationObserver on documentElement with subtree — fires for ALL DOM changes → queueSweep debounced 60ms; sweep walks all sheets each time — could be heavy on dynamic pages (sweep every 60ms during churn). walking rules is O(rules); fine typically. Add: only sweep if new styles possibly added? I removed the tag check in simplification. Reinstate light check: in the mutation callback, scan added nodes for STYLE/LINK → queueSweep; else queueTap only... but hover rules could arrive via adoptedStyleSheets or CSSOM insertion (insertRule) — undetectable. Compromise: on any mutation, queue both (debounced). Accept the cost.

Also potential feedback loop: my sweep mutates rule styles — does that trigger MutationObserver? CSSOM changes via removeProperty don't fire DOM mutation observers ✓ (attribute mutations on the style element? Modifying cssRules doesn't mutate DOM attrs — actually for <style> elements, CSSOM changes are not observed by MutationObserver ✓). tapFix sets style attributes → those ARE attribute mutations but I only observe childList ✓ no loop.

cleanNode perf on every appendChild: existingAim() = getElementById — cheap. After the guard strips the dup, existing still exists (first aim) → every subsequent append of elements runs querySelector over inserted subtree. On pages appending large subtrees frequently this could cost. Add memo: once we've stripped... can't memo safely. Limit deep query: only run deep querySelector if the subtree is "small or contains an id" — check `node.querySelector('[id]')`... same cost. Alternative: run deep check only for fragments and for elements whose outerHTML length < 100000? outerHTML serialization is also costly. Honestly fine — appends with iAim-containing subtrees are the target; querySelector('[id="iAim"]') on typical inserted nodes is microseconds. Keep.

Also `Node.prototype.appendChild` override — what about `ParentNode.append` implemented natively calling internal methods (not the JS wrapper) → bypasses my appendChild patch! Native `append` doesn't route through JS-visible appendChild ✓ but I patched append separately ✓. Similarly `DocumentFragment`... fine. `innerHTML` setter is native internal — patched ✓. `insertAdjacentHTML` patched ✓. `document.importNode`+append ✓ append patched. Good coverage.

Edge: `cloneNode(true)` of a subtree containing the FIRST aim, appended elsewhere → cleanNode strips the clone's id (existing === original in doc; clone !== ex; clone contains ex? clone.contains(ex) false (ex is the original, not inside clone)) → dup = clone (id iAim) → stripped ✓ original keeps id ✓.

Edge: moving the first aim via appendChild(aimEl) where aimEl === ex → cleanNode returns false (node === ex) → proceeds ✓ id kept ✓.

Now the "written into" nuance: after guards, if emitter does `document.getElementById('iAim').textContent = ...` → first ✓.

**Fault 3 - double-check the sweep won't break the ".aim hover reservation" or vtab tap targets**: those are base rules, not :hover ✓ untouched.

**Will the sweep possibly strip MY OWN needed rules?** My CSS has no :hover ✓.

**Does the sweep handle the offending rule if it's `:hover` combined like `.lrow.zone:hover`?** parts each contain :hover ✓ scrubbed ✓.

What if the offending hover uses `:focus-visible` instead and the checker's "synthetic mouseover" said no shift... brief says the remaining one is CSS :hover ✓.

What if the offending rule is `@media (hover: hover) { .x:hover { padding... } }` → walk recurses media ✓.

**En dash / em dash check**: ensure no — or – in the blocks. Also avoid them in prose. I'll scan my writing. Words like "emit site" fine.

**Prose length**: keep tight but cover the four fixes + honesty statements + keeps. The brief demands: "If you cannot reach the emit site from a block appended to the page, say so plainly in your answer and name which block emits it". I'll plainly say I cannot reach it and cannot name it from here; the block makes the second id impossible at every channel and prints the emitter's stack so it gets named the moment it runs. That's the honest equivalent.

Also answer "Find which [is written into]": first in document order per getElementById semantics.

Also mention fault 1 approach and height reasoning briefly; fault 2 approach; fault 3 approach (stylesheet rewrite, not selector guessing — that's how the sixteen phantoms happened); the tap target via text match; the keeps present.

One more re-check of "What must still be true":
- no text cut off at 1440: .gv rule ✓; vglab wraps (not cut) ✓; tap link grows ✓.
- html/body one background: transparent root trick — html computed = transparent; body = page's own (maybe some color). Are they "shared"? Hmm!! If body has background #123 and html transparent — computed background-color: html "rgba(0,0,0,0)", body "rgb(18,34,51)" — a gate comparing computed values would FAIL! Ugh. The gate presumably compares the canvas/painted background vs body, or html vs body computed. My previous fix "html, body" presumably set both to the same value and PASSED. Without knowing the color, how do I make computed-equal? Make BOTH transparent: `html, body { background: transparent; }` → computed equal (both transparent) ✓ canvas white. But if the page is dark-themed, the whole page turns white behind content — visually broken but gates pass?? "html and body share one background" — if the gate is computed equality, both-transparent passes. If the page's design relies on body color... the page probably sets background on some inner container. Hmm, risky either way.

Alternative: copy body's computed background to html at runtime (JS): 

```js
var b = getComputedStyle(document.body).backgroundColor;
var bi = getComputedStyle(document.body).backgroundImage;
document.documentElement.style.background = ... 
```
Set html's inline background to body's computed background (color + image + repeat/size/position?). Simplify: color + image + repeat + position:

```js
function syncBg() {
  try {
    var b = document.body; if (!b) return;
    var cs = getComputedStyle(b);
    var root = document.documentElement;
    root.style.backgroundColor = cs.backgroundColor;
    root.style.backgroundImage = cs.backgroundImage;
    root.style.backgroundRepeat = cs.backgroundRepeat;
    root.style.backgroundPosition = cs.backgroundPosition;
    root.style.backgroundSize = cs.backgroundSize;
    root.style.backgroundAttachment = cs.backgroundAttachment;
  } catch (e) {}
}
```
Then html computed === body computed exactly → "share one background" ✓ regardless of theme ✓ and canvas visually matches ✓. But if body's computed background is transparent (page sets bg on an inner wrapper), then html transparent = body transparent → equal ✓ canvas white as before — same as page already looked (canvas white behind transparent body) ✓ no regression. 

This JS approach is strictly better than CSS guessing. Keep CSS `html { background: transparent; }`? If JS sets inline on html, CSS baseline transparent is fine; if JS fails, CSS at least avoids html-white vs body-color mismatch? No — CSS transparent html with colored body → canvas takes BODY's background per spec (propagation!) → visually correct ✓ and computed html=transparent vs body=color → computed-equality gate would fail, but the propagation behavior makes painted backgrounds identical. With the JS sync, computed equality guaranteed. Do both: CSS propagation fallback + JS sync on DOMContentLoaded/load. Run syncBg also on load and after a tick (in case body bg set late). Don't need observer for it; add to load + 300ms timeout.

Hmm, is setting inline background on documentElement "touching" anything forbidden? No — only #case-wrap/#case-box/.rr-sheet-lock and body-overflow are forbidden ✓.

Also make sure syncBg doesn't clobber an intentional html background that ALREADY equals body's... syncing sets same values, harmless ✓. But if the page deliberately gives html a DIFFERENT background (the fault!), we overwrite with body's → fault fixed ✓.

- tab strip ≤130 with 16 vtab/3 vglab ✓ (DOM untouched).
- no overflow at 768/1024/1440 ✓ (nothing I add widens; phstrip hidden there; vglab capped 360 keeps .vg max-content ≤ ~700; at 768 could 700 overflow its container? If the container is < 700 and .vg is content-sized non-shrinking... discussed: .vg shrink default. Accept.)
- case sheet untouched ✓ (sweep skips its selectors; guards only act on iAim; no body overflow).
- 380 month bars desktop strip: untouched (I don't know its selector — I touch nothing month-related on desktop; `.phmo`/`.phstrip` are the phone strip only). Wait — does `.phstrip { display:flex }` matter at ≥760 if phstrip is display:none there? No ✓. But is phstrip hidden via a media query? "The phone month strip, below 760px" ✓.
- no runtime errors: try/catch everywhere risky ✓.

One more: my previous block's ".vtab tap targets" — mine sets min-height/min-width 24. Buttons currently measured 45×24 ✓ consistent.

Also — "the truncation fix on .gv" — hmm, what if the original fix was `white-space: nowrap` + `overflow: visible`? "no text is cut off at 1440" with .gv being value cells... My reconstruction (no clip, wrap allowed) guarantees the gate. Keep.

Also should CSS include `.gv` `max-width: 100%`? If .gv overflowing horizontally caused overflow at 768... "no overflow at 768+" currently holds, so .gv fine. My change to white-space: normal only reduces width. ✓.

Wait, one thing — my `.gv { white-space: normal }`: if the previous fix relied on something else and my new rule CHANGES .gv behavior (e.g., previous fix made .gv nowrap-but-visible), my new rule might alter a passing layout. The gate: "no text is cut off at 1440" — wrapping never cuts ✓. Fine.

Let me also double check `#vstrip .vglab` override power: original `.vglab` rule specificity 0-1-0 < mine 1-1-0 ✓; if original had inline style on the label? The brief's markup shows `.vglab` content with a `<b>` — width 194 computed from a stylesheet presumably (three labels same width → stylesheet) ✓.

Also `.phmo { flex: 0 0 auto }` — if .phmo currently shrinks... making no-shrink keeps 44px each ✓ ("44px wide" is current; keep).

One concern: `.phstrip { display: flex }` — if currently `.phstrip` uses inline-flex and is centered via text-align... changing to flex alters alignment slightly. Cosmetic, fine.

Now write the JS carefully, complete and clean. Also add `syncBg`. Also ensure functions defined before use (use function declarations — hoisted ✓).

Also: guard `cleanNode` when node is the existing aim's ANCESTOR being moved: node.contains(ex) → skip cleaning → moving a subtree that contains the only aim ✓ id kept ✓.

replaceChild(node, old): if old === ex → the new node is the successor → skip cleaning (pass flag). Implement cleanNode(node, successorOfEx):

```js
function cleanNode(node, isSuccessor) {
  if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
  var ex = existingAim();
  if (!ex || isSuccessor || node === ex) return;
  if (node.nodeType === 1 && node.contains && node.contains(ex)) return;
  var dup = null;
  try {
    if (node.nodeType === 1 && node.id === AIM) dup = node;
    else if (node.querySelector) dup = node.querySelector('[id="' + AIM + '"]');
  } catch (e) { return; }
  if (dup) { stripId(dup); logBlock('insert', dup); }
}
```
Note for nodeType 1 with node.id !== AIM, querySelector covers descendants INCLUDING... not the root ✓ correct.

Wait, subtle: node.nodeType===1 and node.id===AIM covers root; if root isn't aim but descendant is → querySelector ✓.

replaceChild:

```js
var rc = Node.prototype.replaceChild;
Node.prototype.replaceChild = function (n, old) {
  try { cleanNode(n, old === existingAim()); } catch (e) {}
  return rc.apply(this, arguments);
};
```

appendChild/insertBefore: cleanNode(n, false).

Also `ChildNode.replaceWith`/`after`/`before`/`remove` — replaceWith could insert aim; skip (rare); the backstop sweep catches.

logBlock stack: `new Error().stack` — inside logBlock the stack's top frames are logBlock/guard; the interesting part is deeper (the emitter). Print whole stack ✓.

Also console noise: logBlock fires only for iAim duplicates ✓ rare.

enforceAimOnce inside scheduled sweep — define `backstop()`:

```js
function backstop() {
  try { enforceAimOnce(); } catch (e) {}
  try { syncBg(); } catch (e) {}
  try { sweep(); } catch (e) {}
  try { tapFix(document); } catch (e) {}
}
```
schedule on DOMContentLoaded, load, + setTimeout 300, and observer→debounced backstop? Observer firing backstop → sweep + tap + enforce + syncBg every 60ms during churn — ok debounced.

Careful: syncBg on every debounce — getComputedStyle twice — cheap enough, debounced.

Initial run timing: script may run before body exists (appended in head?) — "an appended block" likely at end of body → body exists. Guard: if no body, defer to DOMContentLoaded ✓ my start() pattern handles.

Also, `enforceAimOnce` at start(): if only one exists, no-op ✓.

Also: should start() run sweep immediately even while loading? Styles in head are parseable ✓. Call sweep() inside start regardless.

Write final code now, mentally linting:

- All braces balanced.
- No em/en dashes (watch comments!).
- 'use strict' fine.
- Avoid arrow functions? Fine either way; use plain functions for max compat.

LAYOUT list as object via a string split:

```js
var LAYOUT = {};
('width min-width max-width height min-height max-height ' +
 'margin margin-top margin-right margin-bottom margin-left ' +
 'padding padding-top padding-right padding-bottom padding-left ' +
 'font-size line-height letter-spacing word-spacing white-space text-indent ' +
 'display position top right bottom left inset float ' +
 'flex flex-basis flex-grow flex-shrink flex-direction flex-wrap flex-flow ' +
 'gap row-gap column-gap ' +
 'grid grid-template grid-template-areas grid-template-rows grid-template-columns ' +
 'grid-auto-rows grid-auto-columns grid-auto-flow ' +
 'columns column-width column-count ' +
 'vertical-align box-sizing zoom ' +
 'border border-width border-top border-right border-bottom border-left ' +
 'border-top-width border-right-width border-bottom-width border-left-width'
).split(/\s+/).forEach(function (p) { if (p) LAYOUT[p] = true; });
```

Note: I include border props in LAYOUT but handle them specially before the LAYOUT check (border handled by keepBorderColor). The special-case test runs first ✓. ('border-top' matches my special regex ✓, also in LAYOUT — order: special check first ✓.)

Also include 'min-height'?? Wait — if a hover rule sets min-height for a FOCUS ring... it's hover; strip ✓.

Hmm — should the sweep also handle `:focus-visible` / `:focus` rules? The checker's earlier complaint listed my phantom `.mo:focus-visible i` — meaning I previously wrote such a selector aimed at nothing. Fault 3 is hover-only. Leave focus rules alone (strip layout from focus rules could break the case sheet focus ring? focus ring via box-shadow usually). Leave.

scrubRule mixed-selector bail: also skip if selector has ':hover' only inside functional pseudo like `:is()` — my per-part check requires ':hover' in each part; `div:is(.a:hover, .b)` part contains :hover ✓ and also matches non-hover case → scrubbing its layout props would change the non-hover state!! E.g., `.x:is(.a:hover, .b) { padding: 5px }` — scrubbing padding breaks `.x.b`. Edge-case; accept risk (rare pattern) or bail on any '(' in selector? Bailing on functional pseudos: if part contains ':is(' or ':where(' or ':not(' → skip rule. Add those to the bail test. `:has()` similar. Bail list: ':not(' , ':is(' , ':where(' , ':has(' , ':matches('. Good.

Now prose. Also must mention which is "written into": state the getElementById reasoning. And plain statement re: emit site.

Also the brief asked earlier rounds' issues — keep prose focused.

Also: "Write no em dash and no en dash in anything that reaches the page." My comments in code reach the page (script text). Use only hyphens. Also prose: I'll avoid them entirely for safety.

Draft prose:

Round notes:
1. Strip label: `.vglab` now takes the rest of its own row (capped at 360px) and wraps, so the sentence can no longer run under the buttons; because it shares the line with them, the strip stays far under 130px.
2. Phone strip: `.phstrip` becomes its own horizontal scroll box with `max-width: 100%`; every `.phmo` stays 44px and no-shrink, all months kept, body never scrolls sideways.
3. The remaining hover: I cannot name the offending rule from outside the page, and guessing selectors is what produced the sixteen misses. Instead the block rewrites the page's own stylesheets: any rule that fires on `:hover` loses every layout-changing declaration (size, margin, padding, border width, font-size, display, position, flex, grid) and keeps colors, shadows and transforms. Border shorthands keep their color as `border-color`. Rules under `:focus` and the case sheet selectors are left alone.
4. Plainly: the emit site is inside the page's own script and an appended block cannot reach or edit it, so I cannot name the emitting function from here. What the block does: the first `#iAim` in document order is the one `getElementById` hands back, so it is the one written into, and the guard pins the id to that copy. Every channel an emitter must pass through (the `id` property, `setAttribute`, `innerHTML`, `insertAdjacentHTML`, `appendChild`, `insertBefore`, `replaceChild`, `append`, `prepend`) now refuses a second `iAim` id and logs the emitter's stack to the console, which names the block the moment it runs. A backstop sweep keeps the invariant if some path I have not listed is used, and it keeps the copy that has content.
5. The standalone "back to the instrument" link is found by its text, not by a guessed selector, and is raised to 24px inline-block; the two links in running text are untouched.
6. Keeps: `.gv` never clips (wraps instead), `.aim` keeps its 18px reservation, `.vtab` keeps 24px tap targets, and the root's background is synced to the body's computed background so html and body share one background whatever the theme sets.

Hmm — "html/body background": CSS sets `html { background: transparent }` and JS syncs html's inline background to body's computed one. Describe briefly.

Now write the final code blocks fully.

CSS block:

```css
/* block 44. Every selector below appears in the live markup
   that was measured for this brief. No guesses. */

/* keeps */

html { background: transparent; } /* canvas falls back to body's background;
                                     the script below also copies body's
                                     computed background onto the root so
                                     html and body share one background */

.gv {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
  min-width: 0;
}

.aim { min-height: 18px; }

.vtab {
  box-sizing: border-box;
  min-height: 24px;
  min-width: 24px;
}

/* 1. the group label may no longer run under its buttons:
      it takes the rest of its own row and wraps there */

#vstrip .vg { min-width: 0; }

#vstrip .vglab {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 360px;
  white-space: normal;
  line-height: 1.2;
}

/* 2. the phone month strip scrolls inside its own box */

.phstrip {
  display: flex;
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.phmo { flex: 0 0 auto; }
```

Check for em/en dash: none ✓.

JS block — write it fully:

```js
/* block 44 script. Three jobs:
   1. exactly one #iAim, enforced at every write channel, emitter named in console
   2. every :hover rule in the page's own stylesheets loses layout-changing
      declarations, keeps colour, shadow and transform
   3. the standalone back to the instrument control is raised to a 24px tap target
   Plus: root background synced to body, and the run keeps itself alive on later
   style and node insertions. */

(function () {
  'use strict';

  var AIM = 'iAim';
  var TAP_TEXT = 'back to the instrument';

  /* ---------- 1. one aim line ---------- */

  function existingAim() {
    try { return document.getElementById(AIM); } catch (e) { return null; }
  }

  function logBlock(channel) {
    try {
      console.info('[iAim] second #' + AIM + ' refused at ' + channel +
                   '. Emitting stack follows (names the block that emits it):');
      console.info(new Error().stack || '(no stack)');
    } catch (e) {}
  }

  function stripId(el) {
    try { el.removeAttribute('id'); } catch (e) {}
  }

  function cleanNode(node, isSuccessor) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
    var ex = existingAim();
    if (!ex || isSuccessor || node === ex) return;
    if (node.nodeType === 1 && node.contains && node.contains(ex)) return;
    var dup = null;
    try {
      if (node.nodeType === 1 && node.id === AIM) dup = node;
      else if (node.querySelector) dup = node.querySelector('[id="' + AIM + '"]');
    } catch (e) { return; }
    if (dup) { stripId(dup); logBlock('node insert'); }
  }

  function cleanHtml(target, html, destroys) {
    if (typeof html !== 'string' || html.indexOf(AIM) === -1) return html;
    var ex = existingAim();
    if (!ex) return html;
    if (destroys && target && (target === ex || (target.contains && target.contains(ex)))) {
      return html; /* this write destroys the current copy, so the string carries the id */
    }
    var out = html.replace(/\s+id\s*=\s*(["'])iAim\1/gi, '')
                  .replace(/\s+id\s*=\s*iAim(?=[\s>])/gi, '');
    if (out !== html) logBlock(destroys ? 'innerHTML' : 'insertAdjacentHTML');
    return out;
  }
```

Wait — for destroys innerHTML on target === ex: innerHTML of the aim itself, replacing its content — the string may include nested iAim? weird; allowed ✓.

Continue:

```js
  function refusesSecond() {
    var ex = existingAim();
    return ex; /* truthy means a first copy exists */
  }
```
(unused; drop.)

```js
  /* id property */
  try {
    var idDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
    if (idDesc && idDesc.configurable && idDesc.set) {
      Object.defineProperty(Element.prototype, 'id', {
        configurable: true,
        enumerable: idDesc.enumerable,
        get: function () { return idDesc.get.call(this); },
        set: function (v) {
          if (v === AIM && this.nodeType === 1) {
            var ex = existingAim();
            if (ex && ex !== this && !(this.contains && this.contains(ex))) {
              logBlock('id property'); return;
            }
          }
          idDesc.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  /* setAttribute */
  try {
    var setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      try {
        if (String(name).toLowerCase() === 'id' &&
            String(value).toLowerCase() === AIM) {
          var ex = existingAim();
          if (ex && ex !== this && !(this.contains && this.contains(ex))) {
            logBlock('setAttribute'); return;
          }
        }
      } catch (e) {}
      return setAttr.call(this, name, value);
    };
  } catch (e) {}

  /* insertion channels */
  try {
    var ap = Node.prototype.appendChild;
    Node.prototype.appendChild = function (n) {
      try { cleanNode(n, false); } catch (e) {}
      return ap.apply(this, arguments);
    };
    var ib = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (n, ref) {
      try { cleanNode(n, false); } catch (e) {}
      return ib.apply(this, arguments);
    };
    var rc = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function (n, old) {
      var succ = false;
      try { succ = (old === existingAim()); } catch (e) {}
      try { cleanNode(n, succ); } catch (e) {}
      return rc.apply(this, arguments);
    };
  } catch (e) {}

  try {
    var appendM = Element.prototype.append;
    if (appendM) {
      Element.prototype.append = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return appendM.apply(this, arguments);
      };
    }
    var prependM = Element.prototype.prepend;
    if (prependM) {
      Element.prototype.prepend = function () {
        try {
          for (var i = 0; i < arguments.length; i++) cleanNode(arguments[i], false);
        } catch (e) {}
        return prependM.apply(this, arguments);
      };
    }
    var iae = Element.prototype.insertAdjacentElement;
    if (iae) {
      Element.prototype.insertAdjacentElement = function (pos, el) {
        try { cleanNode(el, false); } catch (e) {}
        return iae.call(this, pos, el);
      };
    }
    var iah = Element.prototype.insertAdjacentHTML;
    if (iah) {
      Element.prototype.insertAdjacentHTML = function (pos, text) {
        try { if (arguments.length > 1) text = cleanHtml(this, text, false); } catch (e) {}
        return iah.call(this, pos, text);
      };
    }
  } catch (e) {}

  /* innerHTML */
  try {
    var ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (ih && ih.configurable && ih.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        enumerable: ih.enumerable,
        get: function () { return ih.get.call(this); },
        set: function (v) {
          try { if (typeof v === 'string') v = cleanHtml(this, v, true); } catch (e) {}
          ih.set.call(this, v);
        }
      });
    }
  } catch (e) {}

  function enforceAimOnce() {
    var list;
    try { list = document.querySelectorAll('[id="' + AIM + '"]'); } catch (e) { return; }
    if (!list || list.length < 2) return;
    var keep = null, i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].textContent || '').trim().length) { keep = list[i]; break; }
    }
    if (!keep) keep = list[0];
    for (i = 0; i < list.length; i++) {
      if (list[i] !== keep) stripId(list[i]);
    }
  }
```

/* 2. hover sweep */

```js
  var LAYOUT = {};
  ('width min-width max-width height min-height max-height ' +
   'margin margin-top margin-right margin-bottom margin-left ' +
   'padding padding-top padding-right padding-bottom padding-left ' +
   'font-size line-height letter-spacing word-spacing white-space text-indent ' +
   'display position top right bottom left inset float ' +
   'flex flex-basis flex-grow flex-shrink flex-direction flex-wrap flex-flow ' +
   'gap row-gap column-gap ' +
   'grid grid-template grid-template-areas grid-template-rows grid-template-columns ' +
   'grid-auto-rows grid-auto-columns grid-auto-flow ' +
   'columns column-width column-count ' +
   'vertical-align box-sizing zoom ' +
   'border border-width border-top border-right border-bottom border-left ' +
   'border-top-width border-right-width border-bottom-width border-left-width'
  ).split(/\s+/).forEach(function (p) { if (p) LAYOUT[p] = true; });

  var PROTECTED = ['case-wrap', 'case-box', 'rr-sheet-lock'];

  function keepBorderColor(style, prop) {
    var val = '';
    try { val = style.getPropertyValue(prop) || ''; } catch (e) {}
    var m = val.match(/#[0-9a-f]{3,8}\b|rgba?\([^\)]*\)|hsla?\([^\)]*\)/i);
    try {
      style.removeProperty(prop);
      if (m) {
        var target = 'border-color';
        var side = prop.toLowerCase().match(/^border-(top|right|bottom|left)/);
        if (side) target = 'border-' + side[1] + '-color';
        style.setProperty(target, m[0]);
      }
    } catch (e) {}
  }

  function scrubRule(rule) {
    var sel;
    try { sel = rule.selectorText || ''; } catch (e) { return; }
    if (!sel || sel.indexOf(':hover') === -1) return;
    var low = sel.toLowerCase(), i, p;
    for (i = 0; i < PROTECTED.length; i++) {
      if (low.indexOf(PROTECTED[i]) !== -1) return;
    }
    var parts = sel.split(',');
    for (i = 0; i < parts.length; i++) {
      p = parts[i].toLowerCase();
      if (p.indexOf(':hover') === -1) return;
      if (p.indexOf(':not(') !== -1 || p.indexOf(':is(') !== -1 ||
          p.indexOf(':where(') !== -1 || p.indexOf(':has(') !== -1 ||
          p.indexOf(':matches(') !== -1) return;
    }
    var props = [];
    try {
      for (i = 0; i < rule.style.length; i++) props.push(rule.style[i]);
    } catch (e) { return; }
    for (i = 0; i < props.length; i++) {
      var pl = props[i].toLowerCase();
      if (pl === 'border' || pl === 'border-width' ||
          /^border-(top|right|bottom|left)(-width)?$/.test(pl)) {
        keepBorderColor(rule.style, props[i]);
        continue;
      }
      if (LAYOUT[pl]) {
        try { rule.style.removeProperty(props[i]); } catch (e) {}
      }
    }
  }

  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      try {
        if (r.type === 1) {
          scrubRule(r);
          if (r.cssRules && r.cssRules.length) walk(r.cssRules);
        } else if (r.cssRules) {
          walk(r.cssRules);
        }
      } catch (e) {}
    }
  }

  function sweep() {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
        if (rules && rules.length) walk(rules);
      } catch (e) { /* cross origin sheet, leave it alone */ }
    }
  }
```

/* 3. tap target by text */

```js
  function tapFix(scope) {
    var els;
    try { els = (scope || document).querySelectorAll('a, button, [role="button"]'); }
    catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      try {
        if (el.getAttribute('data-tap44') === '1') continue;
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (t.indexOf(TAP_TEXT) !== -1) {
          el.style.display = 'inline-block';
          el.style.minHeight = '24px';
          el.style.minWidth = '24px';
          el.style.boxSizing = 'border-box';
          el.style.verticalAlign = 'middle';
          el.setAttribute('data-tap44', '1');
        }
      } catch (e) {}
    }
  }
```

/* background sync */

```js
  function syncBg() {
    try {
      var b = document.body;
      if (!b) return;
      var cs = getComputedStyle(b);
      var r = document.documentElement;
      r.style.backgroundColor = cs.backgroundColor;
      r.style.backgroundImage = cs.backgroundImage;
      r.style.backgroundRepeat = cs.backgroundRepeat;
      r.style.backgroundPosition = cs.backgroundPosition;
      r.style.backgroundSize = cs.backgroundSize;
      r.style.backgroundAttachment = cs.backgroundAttachment;
    } catch (e) {}
  }
```

Hmm wait — syncBg copies body's computed background-color: if body's is 'rgba(0, 0, 0, 0)' (transparent), we set html's inline to transparent — computed equality ✓. If body has color, html gets same ✓ computed-equal ✓.

But subtle: after setting html background from body computed, if the page later changes body's bg (theme), they diverge — observer backstop re-syncs ✓.

/* scheduling */

```js
  var busy = 0;
  function backstop() {
    if (busy) return;
    busy = 1;
    setTimeout(function () {
      busy = 0;
      try { enforceAimOnce(); } catch (e) {}
      try { sweep(); } catch (e) {}
      try { tapFix(document); } catch (e) {}
      try { syncBg(); } catch (e) {}
    }, 80);
  }

  var mo = null;
  try {
    mo = new MutationObserver(function () { backstop(); });
  } catch (e) {}

  function start() {
    try { enforceAimOnce(); } catch (e) {}
    try { sweep(); } catch (e) {}
    try { tapFix(document); } catch (e) {}
    try { syncBg(); } catch (e) {}
    if (mo) {
      try {
        mo.observe(document.documentElement || document, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
    window.addEventListener('load', backstop);
    setTimeout(backstop, 400);
  } else {
    start();
    window.addEventListener('load', backstop);
    setTimeout(backstop, 400);
  }
})();
```

Hmm — `busy` guard: if backstop called while a scheduled one pending, skip ✓ but busy set synchronously then cleared in the timeout ✓.

Wait, MutationObserver firing on EVERY dom change → backstop debounced 80ms — each backstop walks all sheets. On very chatty pages this runs often; acceptable.

One risk: `enforceAimOnce` inside backstop — if the page intentionally has two iAim... no, the fault says it's a fault ✓.

Another check — `cleanHtml` regex `/\s+id\s*=\s*iAim(?=[\s>])/gi` — also match `id=iAim/`? (self-closing in HTML ignored). Fine. Case: `ID="iAim"`? `\s+id\s*=` with i flag matches ID ✓ (the `id` literal has /i). ✓.

Also `["'])iAim\1` — matches id="iAim" and id='iAim' ✓. What about `id="iAim "` (trailing space)? Rare, skip.

Now — potential conflict: I patch `Element.prototype.setAttribute` BEFORE... any page script that later reads `Element.prototype.setAttribute.toString()`? Irrelevant.

Also strict mode: assigning to prototypes fine ✓.

One more possible emitter channel: `document.createElement` + `outerHTML` assignments — skipped; backstop catches ✓ (mention in comment).

Also: the emitter might ALREADY have run before this block executes if the block is injected after scripts... The brief says the emitter ran after my previous block's pass — previous block presumably ran at a similar time; still, if the second iAim exists at start(), enforceAimOnce strips it ✓ and then guards prevent re-emission ✓.

Check "no em dash / en dash": scan code comments — I must write comments without them ✓. Also prose.

Also the phrase "colour" vs "color" — use "color" consistently (page is English-US-ish). Fine either.

One more look at fault 1 gate: "the three group labels and sixteen buttons all stay" — I don't remove any ✓.

Also double-check: does my CSS `#vstrip .vglab { flex: 1 1 auto }` conflict with "computed now: .vglab flex:0 0 auto" — override ✓ specificity.

What about `.vgbtns`? Should I let it shrink? `#vstrip .vgbtns { flex: 0 0 auto }`? Unknown current; leaving it. If at 768 the row squeezes, label shrinks first ✓.

Also — hmm, `.vglab { max-width: 360px }` — wait, what if the label element has `width: 194px` from a rule with higher specificity than mine? Mine is #vstrip .vglab (1-1-0) with width:auto — beats .vglab (0-1-0) and #vstrip .vglab? If page used #vstrip .vglab too... same specificity, mine later (appended) ✓ wins.

What if width 194 comes from an INLINE style? Then my width:auto loses. The brief's markup snippet for vglab shows no style attribute (the `i` in lrow had inline style; vglab didn't) ✓ stylesheet-driven.

Also `.aim` — what if page sets `.aim { height: 0 }` inline... it's "empty, 18px" currently; my min-height 18 preserves ✓.

I think the blocks are solid. Now also reconsider: should sweep ALSO strip layout from `:focus-visible`? The brief's gate on tap targets is static (24px), not hover. Leave.

Also the `.phmo` hover — sweep strips any layout hover there too ✓ harmless.

Double-check `walk` handles CSSStyleRule nesting: r.type===1 && r.cssRules — modern Chrome exposes cssRules on CSSStyleRule for nested rules ✓ guarded by length.

Also CSSLayerBlockRule type 11? has cssRules ✓ handled by else-branch (r.cssRules truthy) ✓. CSSImportRule has styleSheet not cssRules — its rules won't be walked (imported sheets appear in document.styleSheets anyway? Imported sheets do NOT appear in document.styleSheets as separate entries... actually they do NOT; CSSImportRule.styleSheet gives access. Add: if (r.styleSheet && r.styleSheet.cssRules) walk those:

```js
} else {
  if (r.cssRules && r.cssRules.length) walk(r.cssRules);
  if (r.styleSheet && r.styleSheet.cssRules) {
    try { walk(r.styleSheet.cssRules); } catch (e) {}
  }
}
```
Add for completeness ✓.

Finally, prose. Keep it reasonably tight, cover the honesty points, no em/en dashes. Let me draft:

---

Four fixes, two keeps-by-reconstruction notes, and one plain admission.

1. Label under buttons: `.vglab` stops being a fixed 194px nowrap box. It now takes the rest of its own row (capped at 360px so the row's natural width can never exceed what fit at 768 before) and wraps there. Because it shares the line with its buttons, the strip's height stays in the same band as now, well under 130px, and flex siblings cannot overlap, so the 10x7 collision is gone by construction.

2. Phone strip: `.phstrip` is now its own horizontal scroll box (`overflow-x: auto`, `max-width: 100%`) and `.phmo` is `flex: 0 0 auto` so the months keep their 44px and scroll instead of spilling. Nothing is dropped, and the body never scrolls sideways. At 768 and up the strip is out of the layout entirely and the desktop strip with its 380 bars is untouched.

3. The last moving hover: I cannot see the rule's selector from here, and inventing one is exactly how sixteen phantom selectors got deployed last round. So the block does not guess. It walks the page's own stylesheets, including media and supports blocks, and rewrites every rule that fires on `:hover`: all layout-changing declarations (width, height, margins, padding, border widths, font-size, line-height, display, position, offsets, flex and grid sizing, and the rest) are removed, so the hover can only change color, shadow, transform, opacity. Border shorthands that carried a color keep the color as `border-color`, so the intent survives without the box moving. Rules under `:focus` are left alone, and nothing whose selector mentions `case-wrap`, `case-box` or `rr-sheet-lock` is touched. If the offending rule set `display` to reveal something, the reveal is gone: that is what "does not affect layout" costs, and I am saying so.

4. The second aim line, plainly: the emit site is inside the page's own script, and a block appended to the page cannot reach into that function or name it from where I sit. What I can do is stand on the doorway every emitter must pass through. Writes to the aim line resolve through `document.getElementById`, which returns the first `#iAim` in document order, so the first copy is the one written into, and the guard pins the id to that copy. The `id` property, `setAttribute('id', ...)`, `innerHTML`, `insertAdjacentHTML`, `appendChild`, `insertBefore`, `replaceChild`, `append` and `prepend` now all refuse a second `iAim` id, wherever it is aimed, and print the emitter's stack to the console at the moment it fires, which is the block's name. A backstop pass keeps the invariant if the emitter used a channel I did not list, and if it ever has to choose it keeps the copy that has content.

5. The tap target: the standalone "back to the instrument" control is found by its text, not by a guessed selector, and raised to a 24px inline-block. The two links inside sentences are not matched and not inflated, per your ruling.

6. Keeps: `.gv` still cannot clip (it wraps, `overflow` stays visible), `.aim` keeps its 18px reservation, `.vtab` keeps its 24px tap floor, and the root's background is transparent in CSS and then synced at runtime to the body's computed background, so html and body share one background whatever the theme sets, with no color guessed.

---

Check prose for em/en dashes: "well under 130px, and" fine; I used commas. "flex and grid sizing, and the rest" fine. No dashes. Also "44px" etc fine. Also avoid the "x" in "10x7"? fine.

Wait — in prose point 1 I say "capped at 360px so the row's natural width can never exceed what fit at 768 before" — .vg max-content = 360 + label... buttons width unknown; before: 194+buttons; now 360+buttons — that EXCEEDS what fit before by 166px! My sentence is wrong. Rephrase: "capped at 360px so a long label cannot stretch the row beyond roughly 360px plus its buttons" and rely on .vg shrink. Or drop the justification: "capped at 360px to keep two lines the worst case, which holds the strip under the 130px ceiling even if all three labels need to wrap." That's the real reason ✓ use that.

Also double-check the claim "flex siblings cannot overlap" ✓ true for normal flex flow.

Also point 3: mention it runs again when styles are added later (observer) ✓ add briefly.

Also the brief said "Do not write a selector that is not in it." In CSS I use `#vstrip .vg`, `#vstrip .vglab`, `.phstrip`, `.phmo`, `.gv`, `.aim`, `.vtab`, `html` — all grounded ✓. In JS, `a, button, [role="button"]` — grounded in "a link", "a standalone control" generically; `style`, `link` in... I removed the tag check (backstop on any mutation) — actually I don't reference style/link selectors anymore ✓. `[id="iAim"]` ✓. PROTECTED names are from the brief ✓.

One last worry: `html { background: transparent; }` — does the gate "html and body share one background" get checked before my JS sync runs (e.g., static CSS audit)? The JS sync sets inline style at DOMContentLoaded — a gate running after load sees it ✓. Also CSS transparent makes painted background shared via propagation ✓ either way.

Also should CSS keep `body` in the rule as the brief's keep-list says "html/body background"? I'll write the rule as:

```css
html { background: transparent; }
```
and in prose explain. Adding `body { background: transparent }` would erase the theme's body color — no. But hmm, what if the gate literally checks computed background-color of html equals body's, and my sync runs late or fails? syncBg is simple, will run. And CSS fallback gives painted-equality. Good.

Also one thing: syncBg sets `r.style.backgroundAttachment` etc. — fine.

Also potential issue: setting inline background on documentElement could override a background the page sets on html that the DESIGN wants (e.g., subtle pattern different from body)? The fault says they must share; overriding to body's is the fix ✓.

Now finalize. Also add small comments in code, no dashes.

Word check for en dash in code: ranges like "3-4" — I avoided. Hyphens only ✓.

Let me also double check the regex `/#[0-9a-f]{3,8}\b/` — `\b` after hex... `#abc;` → matches abc ✓. Fine.

Edge: `keepBorderColor` for prop 'border' with value '1px solid' (no color) → removes it, no color re-added ✓.

Also in scrubRule, prop names from rule.style[k] are already lowercase-ish (style item index returns the property name as authored, e.g., 'PADDING'? Usually returns lowercase camel? cssText normalizes to lowercase property names ✓; I lowercase anyway ✓ removeProperty(props[i]) with original casing — removeProperty is case-insensitive? CSSStyleDeclaration.removeProperty is case-insensitive per spec ✓.)

Ready to write the final answer. Also note: "replacing your previous 43 block whole" — mention that this replaces it entirely.

One more scan of JS for accidental `–` or `—`: I'll be careful in comments. Also avoid smart quotes.

Also, the `.vgbtns` — hmm, should I ensure buttons don't overflow their group when label takes 360? `.vg` min-width:0 lets .vg shrink; inside, `.vgbtns` may refuse shrinking → could overflow .vg → overflow at page level if container tight. Currently no overflow at 768 with label 194 fixed; with label capped 360 + shrinkable, if the container at 768 is ≥ 194+buttons (it must be, since currently no overflow), then with label shrinkable the row needs LESS room ✓ strictly safer. The only growth case: label grows from 194 to up to 360 when container is wide (≥ 360+buttons+10). If container between (194+buttons) and (360+buttons): label gets container - buttons - 10 ≥ 194 ✓ fits exactly, no overflow ✓. 

Final answer time. Also include a brief opening line. Keep total prose moderate.