The user wants a single fenced CSS block replacing their previous "43b block". Context: there's a `#vstrip.vgroups .vglab` rule with specificity (1 id, 2 classes) that beats their `#vstrip .vglab` (1 id, 1 class). Need to match/beat without !important.

Fixes:
1. Label wraps at 1440, no overlap with buttons: need selector with specificity ≥ #vstrip.vgroups .vglab. Use `#vstrip.vgroups .vglab` itself (same specificity, but order matters — "another block on the page declares" it; if our block comes later in cascade, equal specificity wins by order. But safer to exceed: use `#vstrip.vgroups .vg .vglab` or `.vgroups .vg[data-grp] .vglab`... Actually the user says "Write your selectors to match or beat `#vstrip.vgroups .vglab`." Matching works only if our block comes after. They said "replacing your 43b block" — presumably their block loads after? Risky. Better to beat: `.vgroups#vstrip .vg .vglab` = 1 id, 2 classes... `.vgroups#vstrip .vg .vglab` has id + 3 classes (vgroups, vg, vglab) — beats it. Or `#vstrip.vgroups div.vg .vglab`. Let me use `#vstrip.vgroups .vg .vglab` — that's 1 id, 3 classes, beats 1 id + 2 classes.

2. Mobile: below phone breakpoint, stack label above buttons, buttons wrap. Media query at e.g. max-width: 767px (they say no overflow at 768 must stay). At 768 and up, keep side-by-side but ensure fit. Actually at 390 they want stacked. Use `@media (max-width: 767px)` — but 768 must have no overflow, so breakpoint below 768.

Also need .vgbtns buttons wrapping inside own box at mobile: `.vgbtns { flex-wrap: wrap; }` and `.vtab` min-width. Buttons are 112px wide at mobile — they should shrink or wrap. Let buttons be flex: 1 1 auto with min-width, or allow wrap with flexible widths.

Also `.vg` at mobile: flex-direction: column. Need to override the base `.vg` flex row. The base rule for .vg might also have high specificity? We don't know; write with sufficient specificity: `#vstrip.vgroups .vg` inside media query, or match what exists. Safe: `#vstrip.vgroups .vg { flex-direction: column; ... }`.

Also ensure no horizontal overflow at 768/1024/1440: label wraps, min-width:0 on flex children, `.vgbtns { min-width: 0; flex-wrap: wrap }` maybe everywhere to be safe. At 768 currently no overflow, but adding wrap doesn't hurt.

Tab strip ≤130px tall at 1440 with three groups. If labels wrap to two lines they might get taller. Label max-width 360px, font 9.5px — sentence wraps to maybe 2 lines. Keep flex:1 1 auto so row height fits; buttons 24px. Total under 130 should be fine.

Constraints: no rule for #case-wrap, #case-box, .rr-sheet-lock; no overflow on body. No em/en dash. Keep everything else (they said "Nothing else changes" — return only the block).

Also "380 month bars on the desktop strip" — that's from other CSS, don't touch. "every control 24px tall" — keep min-height 24px on .vtab presumably already in their block; keep it.

Write the block. Include their previously fixed rules? They say "replacing your 43b block" — the block contained the #vstrip .vglab rule. I should return a whole CSS block covering vstrip fixes. Include:

```css
/* vstrip label + mobile shape */

/* beats #vstrip.vgroups .vglab on specificity, no !important */
#vstrip.vgroups .vg .vglab {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 360px;
  white-space: normal;
  line-height: 1.2;
  overflow-wrap: break-word;
  align-self: center;
}

#vstrip.vgroups .vg .vglab b { font-weight: 700; }

/* buttons row: shrink and wrap inside its own box */
#vstrip.vgroups .vg .vgbtns {
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: wrap;
  row-gap: 2px;
}

#vstrip.vgroups .vg .vgbtns .vtab,
#vstrip.vgroups .vgbtns .vtab {
  flex: 0 1 auto;
  min-width: 0;
  min-height: 24px;
  height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Hmm, ellipsis could cut text — "no text is cut off at 1440". Better: flex: 1 0 auto? At 1440 buttons should be fine. Let buttons keep natural width but allow the row to wrap. overflow hidden with ellipsis risks cut text. At 1440 with 16 buttons wrapping into two rows, still under 130px? Buttons 24px tall, rows: maybe 2 rows = 50px + labels. Fine. But "no text cut off at 1440" — allow buttons natural size, wrap. Remove overflow hidden.

At 1440: .vg row = label (up to 360) + buttons wrapping. 16 buttons across 3 groups... each group maybe 5-6 buttons. Fine.

Media query for phone:

```css
@media (max-width: 767px) {
  #vstrip.vgroups .vg {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex-wrap: nowrap;
  }
  #vstrip.vgroups .vg .vglab {
    max-width: none;
    width: auto;
  }
  #vstrip.vgroups .vg .vgbtns {
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }
  #vstrip.vgroups .vg .vgbtns .vtab {
    flex: 1 1 auto;
    min-height: 24px;
  }
  #vstrip { max-width: 100%; }
}
```

Also guard .vgroups width on desktop: `#vstrip.vgroups { max-width: 100%; min-width: 0; }` and `.vg { min-width: 0 }`.

At 768 currently no overflow, and we're not changing ≥768 except label wrap, so keep it. But wait: at 768 the buttons row could overflow if label takes 360 and buttons don't shrink. Give .vgbtns flex: 0 1 auto and min-width: 0 plus flex-wrap: wrap at all widths — that preserves 768+ no overflow.

Also "no horizontal overflow" — add `#vstrip.vgroups { max-width: 100%; overflow: hidden; }`? overflow:hidden on vstrip could clip buttons at phone if wrapping fails. With wrap it shouldn't. But safer to not use overflow hidden... Actually to guarantee no scrollWidth overflow, wrapping should suffice. I'll set box-sizing and max-width.

The strip must stay ≤130px at 1440. Labels wrapping to 2 lines: line-height 1.2 × 9.5px ≈ 11.4px per line, 2-3 lines ≈ 34px, buttons 24px + gaps. Fine.

Also they mentioned role=tab and 16 .vtab — markup, not CSS.

Emit only the fenced css block. No em/en dash — check comments.

Selector specificity check: `#vstrip.vgroups .vg .vglab` = (1,3,1)? Classes: vgroups, vg, vglab → 1 id, 3 class, elements 0. Opponent: 1 id, 2 class. We win.

For `.vgbtns` and `.vtab` rules, opponent didn't declare those, but base rules might. Use elevated specificity anyway to be safe.

Also make sure label doesn't shrink too much pushing buttons: at 1440 group width fine.

One more: hover shifts nothing — no hover rules added, fine. Background — untouched.

Write it.