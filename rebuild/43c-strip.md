```css
/* ============================================================
   vstrip: label wrap + mobile stack, replaces the 43b block
   Selector weight: #vstrip.vgroups .vg .vglab is 1 id + 3
   classes, which beats the other block's 1 id + 2 classes,
   so no !important is needed anywhere in here.
   ============================================================ */

/* --- the strip itself never widens its parent --- */
#vstrip.vgroups {
  max-width: 100%;
  min-width: 0;
}

/* --- each group can shrink, children may wrap --- */
#vstrip.vgroups .vg {
  min-width: 0;
  max-width: 100%;
}

/* --- label: beats #vstrip.vgroups .vglab on specificity --- */
#vstrip.vgroups .vg .vglab {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  max-width: 360px;
  white-space: normal;
  overflow-wrap: break-word;
  line-height: 1.2;
  align-self: center;
}

#vstrip.vgroups .vg .vglab b {
  font-weight: 700;
}

/* --- button row: shrinks first, wraps inside its own box --- */
#vstrip.vgroups .vg .vgbtns {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
  row-gap: 2px;
}

/* --- buttons keep 24px height, natural width, never clipped --- */
#vstrip.vgroups .vg .vgbtns .vtab {
  flex: 0 1 auto;
  min-width: 0;
  min-height: 24px;
  height: 24px;
  white-space: nowrap;
}

/* ============================================================
   Phone shape: below 768 the label sits above its buttons,
   the buttons wrap inside their own box, nothing leaves 390.
   768 and up keep the side by side row above, unchanged.
   ============================================================ */
@media (max-width: 767px) {
  #vstrip.vgroups .vg {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  #vstrip.vgroups .vg .vglab {
    max-width: none;
    width: auto;
    flex: 0 0 auto;
  }

  #vstrip.vgroups .vg .vgbtns {
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }

  #vstrip.vgroups .vg .vgbtns .vtab {
    flex: 1 1 auto;
    min-height: 24px;
    height: 24px;
  }
}
```