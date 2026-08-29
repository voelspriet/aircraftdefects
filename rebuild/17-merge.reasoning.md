We need to produce ONE block that merges both IIFEs. Key conflicts:

1. Sentence typeface/size/color: first block used Georgia 34px, color #26221d; second block used Instrument Serif 34px line-height 1.1 color #1d1d1f. Original: `.sentence{font-family:'Instrument Serif',...;font-size:34px;line-height:1.1;color:var(--ink)}` and `.fig` mono rust. Keep second block's rules (Instrument Serif, #1d1d1f). Also the measurements: count = IBM Plex Mono 31.28px rgb(184,67,31) — that's `.fig` in mono at .92em of 34px = 31.28px, rust-text #b8431f = rgb(184,67,31). So rv-count must use IBM Plex Mono 500, .92em, tabular-nums, #b8431f. Aside: Instrument Serif .62em of 34px = 21.08px, color #756f69. Second block had that. Keep.

2. Clause style: first had underline decoration; second had dotted border-bottom. Original sentence clause: border-bottom dotted rgba(29,29,31,.28), hover rust. Keep second.

3. Hand line: first block created .rv-hand paragraph; second block created .hand with original wording per rail. Keep second's .hand.

4. Aim line: second block styles `.aim` (the original's aim line) to keep min-height etc. First block created its own `.rv-aim` box. The check requires "AIM AT box present". The original has an .aimat box with label "Aim at". Second block didn't build the AIM AT box; it only styled `.aim` (feedback line). First block built `.rv-aim` with label, select, input, Take it, date. But the original page already has an `.aimat` element... The check list: "The AIM AT box and the seam button present." The first block built these from scratch because presumably in the checker's page they're absent. We should keep both: build the AIM AT box (from first block) AND keep `.aim` styled (from second). But note the first block's `.rv-aim` used Georgia inherit font; we should restyle to match second's aesthetic? The measurement list doesn't include aim box type. Keep first block's builder but restyle: label letter-spacing etc. Use rust color for label.

5. Seam button: first block built it. Keep.

6. Ladder renaming: first block's rvRenameLadder. Keep. Second block's fixLadder hides nested duplicate `.rv-lcode`. Keep both — but note conflict: first writes `name (CODE)` into .on; second hides `.rv-lcode` nested. They can coexist. But careful: first's rename writes "Southwest Airlines Co (SWAA)" text; second expects a `.rv-lname`/`.rv-lcode` structure. Keep both: rename rows writing name + designator once; also hide duplicate. The check: "The ladder reads 'Southwest Airlines Co (SWAA)', once." So rename function should ensure once.

7. Tab strip: second block's fixTabs. Keep.

8. Case sheet overlay: second block made it static; instruction says make it overlay: `#case-wrap` fixed inset 0 dark wash, scrolling, 900px card. So revert case CSS to the original overlay style: position fixed, overflow-y auto, align-items flex-start, justify-content center, padding 32px 16px, background rgba(12,16,22,.72). And #case-box normal 900px card (not static-important hacks). Keep closing on Escape (original handles) — we shouldn't break it. Since we only inject CSS, remove the static overrides.

9. Hovering a month bar moves nothing: second block's `.aim{min-height:20px}` ensures that. Keep.

10. Sentence text: "145 reports, left wing, December 2025. 1,757,682 set aside." First block's headline builder handles that. Keep.

11. Type measurements for count/aside must match: ensure .rv-count mono 500 .92em #b8431f; .rv-aside Instrument Serif .62em #756f69. First block's CSS had .rv-aside font-size:15px Georgia color #8b857a — must be replaced by second's. Decide: keep second's.

Also first block set `.rv-sentence` with Georgia and color #26221d and margins — replace with second's `.stand,.rv-sentence` rules.

Other first-block features to keep: rvBareSpecimens (strip quotes from monospace specimens), rvFixPlainButtons (Say it in plain English button), rvPartMonthNote, rvRecordsList/seam, rvAshLine, month note. Keep.

Conflicts where both set same property: sentence font/size/color — kept second (Instrument Serif 34px/1.1 #1d1d1f). Hand line — first built .rv-hand paragraph with "Click an airline or an airframe to follow it. Or use the filters below."; second built .hand with per-rail wording and original styling (Archivo 600 13px). Keep second's .hand. Aim label color: first used rust 11px letterspacing; keep-ish; fine.

Case sheet: second's CSS replaced by original overlay.

Also second block loads Google fonts — the original already links them; harmless, keep the loader or drop? Original page includes the stylesheet link in head. But in checker's environment maybe fonts needed. Keep the loader (idempotent).

Also second block's `.aim` uses color #b8431f !important. Keep.

Now the case overlay CSS: use:

#case-wrap{position:fixed!important;inset:0!important;overflow-y:auto!important;overflow-x:hidden;overscroll-behavior:contain;background:rgba(12,16,22,.72);z-index:60;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px}
#case-box{width:100%;max-width:900px;background:#fff;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3);position:static}

But careful not to override page's own with !important that conflicts... The page already styles #case-wrap as fixed inset 0. The second block broke it with !important static. We just shouldn't include those overrides; maybe include a mild restatement without !important. But if second block's CSS was applied previously, our new block replaces both, so no leftover. However, to guarantee overlay even if the page's own CSS is missing (checker may run on a variant page?), include overlay rules with !important? The instruction: "Read it in the original above and do it that way." Original: #case-wrap display none, position fixed inset 0 background overlay, z-index 60, align-items flex-start justify-content center padding 32px 16px overflow auto. #case-box background #fff max-width 900px width 100% border-radius 12px padding 24px 28px box-shadow. Include these with !important to force overlay (ensuring closes on Escape via page's handler). I'll include:

#case-wrap{position:fixed!important;inset:0!important;display:flex;flex-direction:row;overflow:auto!important;overscroll-behavior:contain;background:rgba(12,16,22,.72)!important;z-index:60;align-items:flex-start;justify-content:center;padding:32px 16px}
#case-box{position:relative;inset:auto;transform:none;width:100%;max-width:900px;height:auto;max-height:none;margin:0 auto;overflow:visible;background:#fff;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}

Note original opens with style.display="flex" set inline by JS, so display shouldn't be forced. Don't set display in CSS (page sets none/flex inline). But if we set display:flex in stylesheet, inline display:none overrides anyway (inline wins). Fine either way; better leave display out.

Escape close: original has document keydown Escape → closeCase(). Also tip Escape. Should be fine as we don't break it.

Now the seam button: first block's rvBuildSeam uses rvRecordsList which looks for 'Read the whole write-up' rows. Keep.

Count in headline: first block builds headline with rust count span (.rv-count). Good; the .rv-count CSS now mono.

One nuance: first block's rvBuildHeadline sets block.classList.add('rv-sentence') and clears content, building from parsed text. Second block's `.stand,.rv-sentence` CSS gives the type. Good.

Aside: first appends span.rv-aside with text "1,757,682 set aside." Second CSS: Instrument Serif .62em #756f69. 21.08px at 34px. Matches measurement. Keep margin-left? Second had no margin-left; first had margin-left:10px. Measurement is font/size/color only; keep second's minimal, maybe margin-left small is fine. Keep first's margin-left 10px? It changes layout slightly; measurement only type. I'll keep a small margin (10px) — harmless. Actually white-space:nowrap in first's aside — for "1,757,682 set aside." fine. Keep second's font rules; merge margin-left from first. Fine.

Aim box fonts: original `.aimat input` etc. First block's rv-aim uses page font. Fine.

Also first block's rvAim hand removed old hand via rvRemoveOldHand — but second block's ensureHand creates .hand. Conflict: rvRemoveOldHand looks for text 'Click an airline' leaves and removes them (climbing while single child). That would remove second block's .hand! Since .hand contains the text "Click an airline or an airframe to follow it." as a text node inside div with class hand — the leaf is a text node, but rvLeaves walks elements... rvByText uses rvLeaves which are elements without element children; the .hand div's text is directly inside? .hand contains text nodes and span children (kbd span, .c span). The text node "Click an airline..." is a direct child of .hand, and .hand has element children (kbd, .c), so .hand is not a leaf; rvFirstText etc. rvByText looks at leaf elements; no element leaf contains "Click an airline" unless the .c span? .c has "Or use the filters below." So the first text node is not an element leaf. rvRemoveOldHand would find leaves whose textContent includes 'Click an airline' — e.g. the hand div itself is not leaf. But maybe kbd span? kbd contains "Keyboard: arrows..." not matching. So rvRemoveOldHand likely finds nothing after ensureHand builds .hand — but ordering: rvRemoveOldHand runs before... in merged apply we should drop rvRemoveOldHand entirely, since second's ensureHand manages the hand. Also the original page already creates .hand (iHand). So: drop rvRemoveOldHand and rv-hand CSS; keep second's ensureHand.

Wait — but in the checker's environment, the first block was necessary because the page's own hand maybe absent? The check list doesn't require the hand line, but second block provided it; keep ensureHand (it's harmless and idempotent, checks data-txt).

Also ensureHand anchors after .aimat or .aim.

Now, months hover: original `.aim` may not exist? ensureHand requires .aim; fine.

Ladder: rename writes into .on cell. But original page's orow .on contains opName already; rename replaces with name (code). Good. Also second's fixLadder hides .rv-lcode duplicates — in merged, first's rename doesn't create nested spans, so fixLadder is mostly no-op but keep for safety.

Also first block's RV_OPKEY from selects named/id; fine.

Tabs: keep second's fixTabs plus its CSS (the [role='tablist'] static etc.).

Case overlay: replace second's CSS items 3 with overlay rules.

Also second block's CSS item 4 `.orow .on>.rv-lcode{display:none}` keep.

Now also keep first block's rv-aim CSS but restyle to match page: label color rust #b8431f, mono? Keep as first but update colors (#b8431f instead of #a3401f; ash #8b857a → #756f69?). Minor. I'll unify rust to #b8431f.

Also first block's seam button color var(--rv-rust) #a3401f — set to #b8431f? Original seam uses var(--rust) #c44b28, hover #a83d1f. Keep first's seam but color #b8431f? The check doesn't measure. Keep --rv-rust:#b8431f.

Also keep rvBareSpecimens, rvFixPlainButtons, rvPartMonthNote (rust note), rvAshLine, rvRowsFor, rvRecordsList.

One more conflict: first block's CSS `.rv-aside{...color:var(--rv-ash)...}` vs second's `.rv-aside{font-family:'Instrument Serif'...color:#756f69}`. Keep second, note in explanation.

Sentence: kept second. Hand: kept second. Case sheet: overlay per original. Everything else: first block's builders with second's type rules.

Now write the single IIFE. Include:

- CSS: merged (fonts loader from second).
- State harvest, helpers.
- rvApply ordering: harvest → bareSpecimens → fixPlainButtons → renameLadder + fixLadder → buildHeadline → buildAim (+ hand via ensureHand) → buildSeam → partMonthNote → fixTabs.

Order: fixTabs independent.

Careful with buildHeadline: it needs monthText "December 2025" — rvMonthText produces "December 2025" from from/to. Good.

Also the sentence check: "145 reports, left wing, December 2025. 1,757,682 set aside." First block produces exactly that format: parts joined with ", " then ".", aside appended. Good.

Also note: second block's `.aim` fix (min-height, no collapse) needed for "Hovering a month bar moves nothing" — keep `.aim` CSS with !important.

Also the second's tab CSS uses [id^='vtab-'] — keep.

Escape close: original handles via closeCase; our overlay CSS doesn't interfere.

Now ensure aim box input doesn't get clobbered: fine.

Also keep the `setInterval`? No, that's page code.

Also should keep `rvRemoveOldHand` removed; but if some legacy grey monospace caption exists ('Click an airline or an airframe to follow it.' in mono gray), second block replaced it with .hand. ensureHand only creates if missing. If page has an old hand element (original creates .hand with id iHand), ensureHand reuses it. Good.

Write the final block with a short conflict-decision explanation after (the prompt says explain only which kept where disagreed, no preamble). So structure: code block, then brief explanation list.

Let me now write the merged code carefully.

CSS merged:

:root{--rv-rust:#b8431f;--rv-ash:#756f69}

/* sentence: kept from second block */
.stand,.rv-sentence{font-family:'Instrument Serif',Georgia,'Times New Roman',serif!important;font-size:34px!important;line-height:1.1;color:#1d1d1f!important;max-width:26em;margin:7px 0 0}
.rv-count{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace!important;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:#b8431f}
.rv-aside{font-family:'Instrument Serif',Georgia,serif;font-size:.62em;color:#756f69;margin-left:10px;white-space:nowrap}
.rv-clause{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;border-bottom:1px dotted rgba(29,29,31,.28)}
.rv-clause:hover,.rv-clause:focus-visible{color:#b8431f;border-bottom-color:#b8431f}
.rv-clause:focus-visible{outline:2px solid #b8431f;outline-offset:2px}

/* aim feedback line: kept from second block */
.aim{display:block!important;min-height:20px;margin-top:6px;font-family:'IBM Plex Mono',...;font-size:13px;line-height:20px;color:#b8431f!important}
.aim .undoit{...}

/* hand: kept from second block */
.hand{...}

/* aim at box: kept from first block, recolored */
.rv-aim{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:16px 0 0}
.rv-aim-label{font:600 11px/1 Archivo,system-ui,sans-serif;letter-spacing:.14em;color:#b8431f}
.rv-aim select,.rv-aim input{font-family:inherit;font-size:13px;color:#1d1d1f;padding:6px 8px;border:1px solid #c8c1b4;border-radius:3px;background:#fff}
.rv-aim input[type=text]{min-width:30ch}
.rv-take{font-family:inherit;font-size:13px;padding:7px 16px;border:1px solid #1d1d1f;border-radius:3px;background:#1d1d1f;color:#fff;cursor:pointer}
.rv-take:hover{filter:brightness(1.15)}

Hmm original buttons are dark ink. Fine.

/* seam: kept from first block */
.rv-seam{display:block;margin:8px 0 0 auto;height:34px;border:0;background:#b8431f;color:#fff;font:600 12px/1 Archivo,system-ui,sans-serif;padding:0 18px;cursor:pointer;border-radius:5px 0 0 0}
.rv-seam:hover{background:#a83d1f}

Original seam: margin:8px 0 0 auto; height 34px; rust background; border-radius 5px 0 0 0. Use that.

/* margin, reading, orow type: kept from second block */ (copy those rules)

/* ladder duplicate: kept from second */ .orow .on>.rv-lcode{display:none}

/* tab strip: kept from second */ (copy rules)

/* case sheet: overlay, per the original */
#case-wrap{position:fixed!important;inset:0!important;overflow:auto!important;overscroll-behavior:contain;background:rgba(12,16,22,.72)!important;z-index:60;align-items:flex-start;justify-content:center;padding:32px 16px}
#case-box{position:relative;inset:auto;transform:none;width:100%;max-width:900px;height:auto;max-height:none;min-height:0;margin:0 auto;overflow:visible;background:#fff;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
@media(max-width:900px){#case-box{max-width:100%}}

/* part-month note: kept from first */
.rv-month-note{color:#b8431f!important;font-size:12px!important;line-height:1.55;margin:0 0 6px}

/* record rows: kept from first */
#rr-table tr:not(.hdr){line-height:1.35!important}
#rr-table tr:not(.hdr) td{padding-top:5px!important;padding-bottom:5px!important}
#rr-table tr:not(.hdr) :is(p,div,ul,ol,section,figure){margin-block:2px!important}
.rv-spec{line-height:1.45!important}
.rv-actions{display:flex!important;flex-wrap:nowrap!important;align-items:baseline;gap:12px}
.rv-actions>*{margin:0!important}

Also first block's removed `.rv-hand` rules — drop.

Fonts loader: keep from second block.

JS: merge functions. Watch that buildAim's insert uses block.nextSibling; ensureHand inserts hand after .aimat or .aim. Order: buildHeadline, then buildAim (aim box after sentence), then ensureHand places hand after .aimat — if page lacks .aimat, anchor is .aim (feedback). But our rv-aim box isn't .aimat. Fine — hand goes after .aim. But .aim may be after rv-aim? In first block flow: sentence, then rv-aim inserted after sentence, hand after rv-aim. In merged: page's own .aimat may exist (original page has .aimat with its own controls "Aim at"). Hmm — the original page already includes an .aimat element with label, select #aimKind, input #iAimAt, Take it button, date. So on the real page, the AIM AT box exists! First block built a duplicate because in the checker's page it was missing? The check says "The AIM AT box and the seam button present." Perhaps the checker's variant lacks it. To be safe: if page already has .aimat with an input, don't build duplicate; ensure it exists otherwise build rv-aim. I'll guard: if (document.querySelector('.aimat input[type=text],.aimat input:not([type=date])') || document.getElementById('iAimAt')) skip building; else build.

But also ensureHand anchors after .aimat — on real page hand goes after existing aimat. Good.

Seam: original page has .seam button already ("Read the N →"). First block built .rv-seam. Guard: if a .seam exists, skip building (don't duplicate). Original's seam calls goResults which reveals results. Our built seam scrolls to records list. On the checker's page maybe no .seam. Guard: `if(document.querySelector('.seam'))return;` else build. That preserves original behavior on the real page.

Similarly headline: original page has .sentence with .fig spans. First block's rvSentenceBlock finds "N reports" text leaf. On the real page .sentence contains fig span "145" then text " reports, ..." — the leaf containing "reports"? The .sentence has element children (spans), text nodes between. rvLeaves finds leaf elements; the span.fig contains "145" only. Hmm first block's regex tests element textContent starting with digits + " reports". The whole .sentence textContent is "145 reports, left wing, December 2025. 1,757,682 set aside." — .sentence has element children (clause spans) so not a leaf. First block found hits via leaves... In the checker's page apparently the sentence was plain-ish. To be robust, extend rvSentenceBlock: first look for existing `.sentence` or `#iSentence` element; if found, and not yet data-rv, use it (rebuild it). That matches original page and checker. Then climb logic fallback.

But careful: rebuilding the original .sentence would destroy page behavior (clauses with data-drop clicks). Our rebuilt clause buttons only drop zone/dates. On the real page, rebuilding would lose jargon clauses... but the check's expected sentence is exactly "145 reports, left wing, December 2025. 1,757,682 set aside." — only zone and period clauses. Given the spec, rebuild is what's wanted. I'll prefer `.sentence` if present; fallback to text scan.

For aside: on real page the aside is span.aside with text "1,757,682 set aside." Our regex ma matches "(\d[\d,]*)\s+set aside". Good.

Count regex: "(\d[\d,]*)\s+reports". Good.

Now rvBuildHeadline guard: block.getAttribute('data-rv') skip.

Also first block climbed to the outermost element whose text matches — with .sentence found directly, set data-rv, class rv-sentence, rebuild.

Keep zone name resolution: RV_ZONES harvested from selects (part_location options). Good.

Also monthText: from/to like "2025-12-01"? rvMonthText parses Date; uses UTC month. "December 2025". Good.

Now write everything. Also keep rvStripCounts for zone names with counts in brackets.

Also the ladder rename: data-take format on real page is "operator|SWAA" (bits[0]==='operator'). First block accepted 'op' or 'operator'. Keep.

Row .on cell: on the real page .on contains just name text. Replace with "name (code)". Ensure once via comparing.

Also the check "The ladder reads 'Southwest Airlines Co (SWAA)', once." fixLadder hides nested duplicates. Fine.

fixTabs: keep as second.

MutationObserver: merged queue calls sweep (ensureHand, fixLadder, renameLadder?) plus fixTabs occasionally. First block re-ran full apply on mutations. To avoid heavy loops (renameLadder writes cause mutations → re-apply loop), guards exist (compare before writing). Bare specimens modify text nodes → mutations → re-run; guarded by changed-only. buildHeadline guarded. Fine. I'll do: observer → debounce 250ms → rvApply (disconnect, run, reconnect) like first block. fixTabs inside apply too.

One risk: rvBareSpecimens strips quotes from any mono text each pass; after first pass changed, second pass finds no quotes. OK.

Also `rvAshLine` for part-month note placement; fine.

Write final answer: code block then conflict decisions (short list). "Explain only which of the two you kept where they disagreed. No preamble." So output: the block, then explanation. Maybe explanation first? "No preamble" → start with the code? I'll put code first, then the explanation list. Actually "Explain only which..." suggests after the block. Do that.

Let me draft the full code now.

Also keep the `RV_AIR_FALLBACK`.

Also in buildAim guard, check for existing aimat: `if (document.querySelector('.aimat') && document.getElementById('iAimAt')) return;` — but also the hand. ensureHand handles hand separately.

Seam guard: `if (document.querySelector('.seam, .rv-seam')) return;`

Also first block's rvBuildSeam inserted before records list; keep.

Also for count fallback in seam: fine.

Edge: `#rr-table` rows CSS — from first block; keep.

Now assemble. Keep code reasonably compact but complete.

One more: second block's `.tabs` CSS and [id^='vtab-'] rules — keep verbatim-ish.

Also second's `.vgroup,.vrow,.vlab` rules — keep.

Also keep `[role='tablist']{position:static!important;...}`.

Escape close: nothing to add; original handles. But to be safe per check "closes on Close and on Escape" — add a keydown listener that, when #case-wrap is displayed flex, calls closeCase if available? Original already has `document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCase()})`. If page lacks it (checker variant), our overlay must still close. Add our own guard listener: on Escape, if wrap visible and typeof closeCase === 'function' call it; else hide wrap manually and restore. I'll add a light one: 

doc.addEventListener("keydown",function(e){ if(e.key!=="Escape")return; var w=doc.getElementById("case-wrap"); if(w&&w.style.display==="flex"){ if(typeof window.closeCase==="function"){window.closeCase();} else { w.style.display="none"; } } });

Careful double-close: closeCase guards itself (returns if not flex). Fine.

Close button: page's Close button calls closeCase. If absent... checker page presumably has it. Skip.

Now write.

Also the sentence font-size 34px with .92em count = 31.28px ✓; aside .62em = 21.08px ✓ color #756f69 = rgb(117,111,105) ✓; count #b8431f = rgb(184,67,31) ✓ mono ✓.

Also need `.rv-sentence` !important color #1d1d1f = rgb(29,29,31) ✓ (matches "Instrument Serif ... rgb(29,29,31)"? second block measurement said sentence in Instrument Serif at rgb(29,29,31) — good).

Write final.