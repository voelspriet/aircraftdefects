Let me read this properly. The user wants a rebuild of an FAA Service Difficulty Report instrument — one hero instrument with four rails (when/where/whose/forced), a picker, a sentence, aim-and-take grammar, margin notes, specimen report, and the "Read the N →" seam. They want MY implementation — not a copy — but it must belong to the same instrument: same shape, palette, restraint. Reuse the aircraft SVG paths — but the user's message says "=== the SVG paths of the aircraft it draws ===" and then... it's blank. The SVG paths section is empty. So I have to draw the aircraft myself. The instruction says "The aircraft must be the aircraft. Reuse those SVG paths." but they weren't provided. I must construct a plausible side-view aircraft SVG path myself — a recognizable airliner silhouette (side view, nose left, tail right, wing, stabilizer) with zone regions matching FAA zones: 100 (nose/lower/upper front), 200 (lower center fuselage / forward), 300 (aft fuselage & empennage? Actually FAA zones: 100 = general/forward lower half including nose; 200 = upper half forward; 300 = aft fuselage and empennage; 400 = stabilizers and vertical; 500 = left wing; 600 = right wing; 700 = cabin/upper aft; 800 = engine/nacelle pylons; 900 = landing gear doors etc.)

Actually the FAA SDR zones:
- ZONE 100: General - fuselage forward and lower half including nose
- ZONE 200: Upper half of fuselage forward
- ZONE 300: Aft fuselage and empennage (including aft bulkhead)
- ZONE 400: Stabilizers and their support structure, vertical stabilizer
- ZONE 500: Left wing (leading edge out)
- ZONE 600: Right wing
- ZONE 700: Cabin interior, upper half aft
- ZONE 800: Engines, nacelles, pylons
- ZONE 900: Landing gear, doors, wheels

The original's phone grid shows: 800,200,100 / 500,400,600 / 300,700,900 — a map ordering. So the drawing places 100 (nose lower fwd), 200 (upper fwd), 300 (aft fuselage), 400 (tail stabilizers/vertical), 500 (left wing), 600 (right wing), 700 (cabin upper aft), 800 (engines), 900 (landing gear).

I'll build an aircraft side view with SVG paths, one path per zone, shaded by counts. Since no real paths given, I'll author a clean side-view airliner silhouette composed of per-zone polygons that tile the whole shape. That's the honest approach: the zones must exactly tile the silhouette so no part is unplaced.

Let me design the aircraft in a viewBox like 0 0 720 220.

Silhouette: fuselage from x=40 to x=660, nose at left (rounded), tail cone at right rising to a vertical stabilizer. Wing (side view: near wing sweeps down-forward from center fuselage), engine nacelle under wing, horizontal stabilizer at tail.

Actually in side view, "left wing" and "right wing" can't be distinguished — typically the near wing (swept down-toward viewer bottom) is drawn as one, and far wing hidden behind fuselage. The original presumably shades the one visible wing for 500 and 600 differently? In side view you can draw two wings: the near wing below the fuselage line sweeping down-right, and the far wing as a small sliver above? Hmm. Many SDR visualizations draw side view with the visible wing split into two along its span: inner half = one zone... but the honest mapping: 500 left wing, 600 right wing — in side view, one is visible (the near one), the other mostly hidden. The original phone grid has 500 and 600 as separate cells. In the drawing, I could draw the near wing and split it lengthwise into 500 (inner/leading) and 600 (outer)? That would be dishonest labeling. Better: draw the far wing as a raised winglet/shape behind the fuselage top edge (a swept shape above the fuselage near the center, semi-transparent "behind" the fuselage), and the near wing below the belly. Left wing = near (below), right wing = far (above, partially occluded, drawn behind the fuselage so it pokes out above). That's a standard illustration trick. I'll do that: far wing (600) drawn first, then fuselage over it, then near wing (500) in front.

Zone 800 engines: nacelle under the near wing.
Zone 900: landing gear (main gear under wing root, nose gear forward).
Zone 400: horizontal + vertical stabilizer at tail. Zone 300: aft fuselage behind the wing trailing edge to the tail cone.

Let me define coordinates (viewBox 0 0 760 240):

Fuselage baseline y=120 center. Top of fuselage y=78, belly y=162 roughly. Nose tip at x=48,y=120.

Fuselage outline path: start nose tip (48,120), curve up to top (90,86) → straight top to (560,86)... then tail cone rises: from (560,86) curve up-right to tail tip (720,70)? Wait the tail cone of an airliner tapers upward toward the rear with the vertical stabilizer on top. Fuselage top slopes up slightly to tail cone tip at (724, 96)? Let me just design:

- Nose: from (44,124) curve to top-forward point (100,88).
- Fuselage top: straight from (100,88) to (500,88) — then sweeps up into tail cone: from (500,88) curve to (700,64)? No — vertical stabilizer sits on top; the fuselage tail cone tapers to a point at around (720,100) rising from belly.
- Belly: from (100,158) straight to (520,158), then taper up to tail tip (720,100).
- Nose bottom: (44,124) to (100,158).

Vertical stabilizer: polygon from (560,88) top of fuselage, sweep back-up to (690,10), forward edge down to (640,88)? Standard swept fin: leading edge from (596,88) to (668,14), top chord to (700,14)? Let me make: points (588,88) → (648,16) → (692,16) → (712,96) close along fuselage top to (588,88). Rounded-ish.

Horizontal stabilizer (side view shows one side, near one): from tail cone (640,120) sweeping right-down to (726,132)? Side-view horizontal stab appears as a small swept triangle at the tail: points (636,116) → (726,124) → (700,138) → (636,132). Hmm keep simple.

Far wing (600): drawn behind fuselage, a swept shape rising above the fuselage top around x=300–420: points (300,90) → (404,30) → (448,30) → (378,90). That looks like a wing seen from the side going up-back. With slight curve.

Near wing (500): in front of fuselage, sweeping down-back: root chord at belly from (280,150) to (400,150), tip down-back at (500,196)? Wing side view: leading edge from (300,140) sweeping to tip (486,206), trailing edge from tip back up to (416,158). Polygon: (298,142) → (486,204) → (448,208) → (390,160)? Let me be careful: side view of a swept wing pointing toward viewer-bottom-right.

Engine (800): nacelle under near wing forward of it: rounded rect / lozenge at (330..410, 176..206): path ellipse-ish with intake at left. Under-wing engines hang forward-low: nacelle from x=316 to x=402, y=168 to 208, with pylon connecting to wing.

Landing gear (900): nose gear: small strut + wheel at (150,158)-(150,196) wheel circle r=12 at (150,190); main gear: strut at (360,158) wheel at (368,196) r=13. Maybe two wheels. Draw strut as thin rect, wheel circles. These belong to zone 900.

Zones as separate paths so each can be filled/shaded by count:
- Z100: forward lower fuselage: from nose tip to x≈280 along belly, and up to... zones 100/200 split the forward fuselage into lower/upper halves at the centerline y=123? FAA: 100 = lower half of fuselage forward including nose area? Actually FAA zone 100 "General: fuselage forward and lower half including nose" — historically 100 covers the forward lower fuselage/nose; 200 upper forward. I'll split fuselage at wing center x≈340: forward section (nose to 340) split horizontally: upper = 200, lower = 100.
- Z700: cabin — upper half aft of 340 to tail cone start (~560): upper aft = 700.
- Z300: aft lower fuselage from 340 to tail tip: lower aft = 300.
- Z400: vertical + horizontal stabilizer.
- Z500: near wing. Z600: far wing. Z800: engine nacelle. Z900: gear.

Fuselage path construction: I'll build the fuselage silhouette as a path, then use clipPath to split it into 4 rectangles (upper-fwd, lower-fwd, upper-aft, lower-aft) so the zones tile perfectly. That's clean: one fuselage path, clipped four times with rects. 

Fuselage path (smooth):
M 44 122
C 52 104, 72 90, 104 88          (nose top curve)
L 512 88                            (top straight — but tail cone should start rising ~ 520)
C 600 88, 664 96, 724 106? 

Hmm, tail cone: fuselage tapers upward to a tail tip. Top edge from (512,88) curving down-slope? Actually the top line of an airliner fuselage stays level until about the rear, then the tail cone sweeps up to a point roughly at mid-height or higher, and the belly sweeps up more steeply to meet it. Tail tip around (724, 104).

So:
M 44 122
C 54 102, 78 90, 110 88
L 520 88
C 610 90, 680 96, 724 104     (top rear taper — gentle)
L 724 104 (tip)
C 690 132, 620 150, 520 158   (belly rear rising steeply to meet)
L 112 158
C 78 156, 54 140, 44 122
Z

Wait belly: from tail tip back to front: C 660 148, 600 158, 520 158 then L 112 158 then nose bottom C 76 158, 52 142, 44 122. Good. Add cockpit windows? Not needed; shading fills will cover. Maybe add a few static details: window strip? Keep restrained — the instrument shades zones; decorative windows could interfere. The original likely has just silhouette zones. I'll add subtle outline stroke only.

Split at x=340 (wing box center) and y=123 (centerline). Clip rects:
- Z200 upper fwd: x 44→340, y 60→123
- Z100 lower fwd: x 44→340, y 123→170
- Z700 upper aft: x 340→724, y 60→123
- Z300 lower aft: x 340→724, y 123→170

Hmm but Z700 "cabin upper aft" — fine.

Wing (500 near): polygon M 288 148 L 300 142 ... let me draw with slight curves:
M 292 150
L 470 208   (leading edge sweeping down-right? Actually leading edge is the forward edge = left side of the polygon when wing sweeps back)
Hmm, wing sweeps BACK (toward tail = right) and DOWN. Forward edge (leading edge) starts at root (near x=300, y=150) and goes to tip (x=470, y=204)? A swept-back wing: tip is behind (right) and below. Leading edge from root-front (300,148) to tip-front (474,202). Trailing edge from tip-rear back to root-rear (410,158)? Root chord: front (300,148) to rear (410,158) — chord ~110. Tip chord small: (474,202) to (492,206)? That makes tip at right. So polygon: (300,148) → (474,202) → (490,208) → (408,160) close. With slight curves for elegance:

M 300 147 C 350 168, 420 196, 474 203 L 492 209 C 460 210, 430 196, 404 162 ... close. Eh, keep it a clean quadrilateral with slight curve on leading edge.

Far wing (600), behind fuselage: mirrored upward, swept back: root at top of fuselage (320,90) to (404,90), tip up-back at (472,42)-(486,36)? Polygon (322,88) → (452,40) → (470,36) → (406,88). Drawn before fuselage so fuselage occludes root.

Wait — far wing on the other side would also sweep down visually... in side view the far wing appears ABOVE the fuselage (you see it rise over the top)? No — for a low-wing airliner, the far wing appears above the near fuselage? Actually for a low-wing aircraft viewed from the side, the far wing is hidden behind the fuselage except it pokes up? No: both wings are at the belly line. Near wing sweeps down toward viewer bottom... hmm, in typical side-view illustrations of a low-wing plane, the near wing is drawn below/on the fuselage sweeping down-right, and the far wing is visible above the fuselage? No — the far wing would be behind the fuselage at the same height, appearing to poke out on the far side horizontally, which in side view is just hidden. Common illustration: far wing drawn above the fuselage only for high-wing planes. For low-wing, artists often draw the far wing sweeping up-right as seen through nothing — actually many side views show only the near wing. But we need 600 placed somewhere. Alternative used by the original: maybe they split left/right along the wing's span. Since the phone grid lists both 500 and 600 as real zones, the drawing must show both. The "poke above" trick: draw far wing behind fuselage sweeping up-back — that reads as the far wing seen over the top of the fuselage, which is geometrically wrong for low-wing but visually standard in simplified diagrams (e.g., many SDR zone diagrams show it that way? The classic FAA SDR zone diagram is actually a side view plus top view). 

Better idea: make it honest with two-part wing shading: near wing divided into inner/outer? No — must label 500/600 truthfully.

I'll go with: far wing drawn behind the fuselage, sweeping up-and-back above the tail-ward top — visually reads as "the other wing, on the far side". Many instrument diagrams do exactly this. And since fuselage occludes its root, only the outer half shows above — that part genuinely is the far wing's tip. I'll add a note in the legend? The legend lists zones with counts; clicking either wing narrows to that zone. The visible tip of the far wing = zone 600. Fine. Actually, alternative: draw the far wing sweeping up-forward? No, back.

Engine (800): nacelle under near wing: pylon from wing to nacelle. Nacelle: rounded cylinder x 322→414, y 172→210 with nose cone at left. Draw as path: M 322 176 C 322 170, 330 168, 340 168 L 400 168 C 412 168, 418 176, 418 190 C 418 204, 412 212, 400 212 L 340 212 C 330 212, 322 210, 322 202 Z. Plus intake ring at front (darker). Pylon: from nacelle top (350,168) up to wing underside (356,150)? small quad (346,170)-(362,170)-(366,152)-(352,152).

Hmm wait, near wing occupies y 148–208 around x 300–490. Engine should hang below-forward of wing: place nacelle x 300–390, y 178–216, pylon connecting nacelle top to wing leading edge region. But the wing sweeps down through that area... The wing polygon at x=340 has lower edge around y≈160? Leading edge at x=340: interpolate (300,147)→(474,203): at 340, y≈153. Trailing edge (404,162)... the wing quad covers from leading edge line down-right? The quad (300,148),(474,202),(492,208),(408,160): this is a thin swept strip. The belly of fuselage is y=158; wing extends below to y~208 at tip. Engine under wing forward: nacelle around x 310–395, y 182–218 would overlap wing strip near its leading edge at x~330 (y≈153)? The wing at x=330 is at y≈151 only — the strip is between leading edge and trailing edge lines which at x=330: leading edge y≈151, and the strip's other boundary... the quad is degenerate-thin near root? Points: A(300,148) B(474,202) C(492,208) D(408,160). Edge D→A from (408,160) to (300,148). So at x=330: on A→B line y≈148+ (30/174)*54 ≈ 157; on D→A line y≈ 160 - ( (330-300)/108 )*12 ≈ 157. The quad at x=330 is essentially zero-height — it's a line. Bad. The wing needs thickness: root chord should be a real chord. Let me re-think: root chord from A(296,146) to D(420,158)? That's chord length ~124 horizontal-ish at the belly. Tip chord at B(478,204) to C(494,210)? Then quad A→B (leading edge, sweeping back-down), B→C tip chord, C→D (trailing edge going back up-left to root rear). Hmm but trailing edge from tip (494,210) up-left to (420,158) — that crosses the leading edge? Leading edge A(296,146)→B(478,204): at x=440, y≈ 146+ (144/182)*58 ≈ 192. Trailing edge C(494,210)→D(420,158): at x=440... x range 420–494, at 440 y≈ 158 + ((440-420)/74)*52 ≈ 172. So wing strip at x=440 spans y 172–192 — thickness 20. At x=350: leading y≈160, trailing edge doesn't extend there (x≥420) — region bounded by A→B and D→A: at x=350, top boundary D→A extended? D→A from (420,158) to (296,146): at 350, y≈ 146+ (54/124)*12 ≈ 151. Leading edge at 350: 146+ (54/182)*58 ≈ 163. So strip y 151–163, thickness 12. OK thickness grows toward tip — wrong direction but acceptable for stylization? Typically thickness constant-ish. Fine, it's a stylized instrument glyph, not a blueprint. Actually let me flip: make trailing edge meet root further back: D(430,160). It's fine.

Hmm, actually simpler: draw the near wing as a swept shape with reasonable curvature:

M 298 146
Q 380 178 476 202        (leading edge, curved)
L 496 210
Q 430 214 428 212? 

Let me just do polygon with slight curves; final path (I'll refine once writing code):

Wing 500: `M296 147 Q 390 180 474 203 L 494 210 Q 436 212 402 170 Z`? The closing edge from (402,170) back to (296,147) — that's the root line. Hmm (402,170) as root rear. Let me check leading edge at x=402: 146+ (106/178)*56*? leading Q curve — fine, roughly y≈183? Root rear at (402,170) would be ABOVE the leading edge at that x (183) — that inverts. Ugh.

Let me carefully construct with straight lines first, verify geometry:
A = (298,146) root LE
B = (478,206) tip LE
C = (498,212) tip TE
D = (416,162) root TE

Edges: A→B lead, B→C tip, C→D trail, D→A root.
At x=350: A→B: t=(350-298)/180=0.289, y=146+0.289*60=163.3. D→A: t=(350-298)/118=0.441, y=146+0.441*16=153. So strip 153–163. ✓.
At x=450: A→B: t=(450-298)/180=0.844, y=196.7. C→D: t=(498-450)/82=0.585, y=212-0.585*50=182.7. Strip 182.7–196.7 ✓ thickness 14.
At x=478: tip chord B(478,206)–C(498,212) ✓.
Root chord A(298,146)–D(416,162) — the root chord sits mostly ABOVE the belly (belly y=158, root chord from y146 to y162) — wing root blends into lower fuselage ✓ good, low-wing.

Wing 600 (far, behind fuselage, above): mirror-ish, swept back-up:
A' = (330,88) root LE (at top of fuselage y=88)
B' = (500,38) tip LE
C' = (518,34) tip TE
D' = (436,88) root TE
Polygon A'→B'→C'→D'. Fuselage covers y≥88 so only the part above 88 shows: from y=88 up to y=34 — a swept fin-like wing above the rear-mid fuselage. Visually reads as the far wing. OK.

Hmm — but this puts the far wing visually overlapping where the vertical stabilizer region is (fin at x 588–712). Far wing tip at x 500–518, y 34 — forward of the fin ✓ no overlap.

Engine 800: nacelle below-forward of wing: place at x 300–392, y 180–220? At x=300 wing strip is y146–157; nacelle top y=180 clears it ✓. But engine must attach via pylon to wing: pylon from nacelle top (x 330–350, y 180) up to wing underside at (x 334–354, y ~160-163). Pylon quad: (332,181) (352,181) (358,161) (340,161). Wing underside at x≈345 is D→A line: y≈ 146+ (47/118)*16 ≈ 152.4; leading edge A→B at 345: y≈ 146+ (47/180)*60 ≈ 161.7. Wing strip at x=345: y 152.4–161.7. So pylon top at y=162 meets near the strip's lower edge ✓ close enough visually (will overlap by 0–1px, fine — set pylon top y=156 to tuck under).

Nacelle path: rounded lozenge:
M 300 190 C 300 183 306 178 316 178 L 384 178 C 396 178 402 186 402 198 C 402 210 396 218 384 218 L 316 218 C 306 218 300 213 300 206 Z
Plus intake: front face darker ellipse at x=300..306? Add inner ellipse (303,198) rx4 ry18 dark. Exhaust at rear: small dark notch. Keep simple: nacelle fill + darker intake ellipse (306,198) rx 5 ry 17.

Hmm nacelle bottom y=218, wheels at y~196 for main gear — main gear at x≈368 would collide with nacelle (x 300–402, y 178–218). Move main gear behind engine: main wheels at x≈440? Under wing root rear / behind engine: strut at (452,158)→(452,192), wheel circle center (452,198) r=13. But wing strip at x=452 is y≈184–199 — the wheel overlaps the wing! In side view the main gear is at the wing root, behind the engine — wheel center typically below wing trailing edge near root. At x=452, wing strip y 182.7–196.7 — wheel at (452,198) r13 spans y 185–211 → overlaps. Move wheel to x=452, center y=204, r=12 → spans 192–216, still touches 196.7? Overlaps 4.7px with wing TE region. Slight overlap OK if gear drawn AFTER wing (in front) — main gear is on the near side, drawn in front of the near wing is actually correct visually! Near-side main gear sits inboard but appears in front. Fine: draw order: far wing → fuselage zones → fin/stab (400) → near wing → engine → gear. Gear in front of everything ✓.

Nose gear at x=150: strut (150,156)→(150,178), wheel (150,184) r=11.

Horizontal stabilizer 400: small swept surface at tail: near-side stab sweeping down-back? For side view: draw one visible stab as triangle from tail cone (660,116) to (736,128) etc. And vertical fin above. Both are zone 400. Fin polygon: 
M 584 90 C 604 62 634 28 668 14 L 700 14 C 706 40 712 72 716 98 Z — with fuselage top at y≈90–100 there. Let me set fin: leading edge from (596,92) sweeping back-up to (664,16); top chord (664,16)→(700,18); trailing edge down from (700,18) to (714,100) meeting fuselage near tail tip. Close along fuselage top from (714,100) back to (596,92). Fuselage top between x 596–714 is the taper curve y≈96–104. So fin base sits on/inside fuselage ✓ (draw fin BEFORE fuselage? If drawn before, fuselage covers base overlap — good. But then fuselage fill (zone 300/700 clip) covers fin base — fine, fin still shows above. However the fuselage taper top edge at x=700 is y≈101; fin trailing edge goes to (714,100) which is right at tail tip (724,104). OK.)

Horizontal stab: draw after fuselage: polygon M 648 118 L 734 126 L 744 134 L 664 136 Z? Slight sweep down. Hmm tail cone at x 648–744: fuselage belly at x=690: belly curve from (724,104) C 690 132... at x=690 belly y≈125. So stab at y 118–136 overlaps belly — it should appear attached at tail cone, sweeping back past the tail tip. Tail tip x=724; stab extends to x=744 beyond ✓ reads as the near stab sticking out back-down. Let me define: M 650 112 L 738 124 L 748 132 L 668 138 Z. Hmm trailing point beyond. Simplify: `M648 112 L742 126 L724 138 L660 134 Z`. I'll eyeball final numbers when writing; it's stylized.

Actually — I want the whole aircraft to look right. Let me lay out the full picture with a 760×240 viewBox, baseline ground at y≈216.

Elements (draw order):
1. Far wing (600) — above fuselage, behind.
2. Fin + horizontal stab (400) — fin behind fuselage (base tucked), stab in front? Stab overlaps tail cone; draw stab after fuselage, fill same as fin (both 400) but stab drawn over fuselage edge — visually the near stab. OK.
3. Fuselage: four clipped zone paths (100, 200, 300, 700) + outline stroke on top.
4. Near wing (500).
5. Engine (800) + pylon.
6. Gear (900): nose strut+wheel, main strut+wheel(s).

Zone fills: shade by count with the rust ramp: f = 0.10 + 0.80 * (n/mx) as in the phone code (`--f`), background ash → rust. I'll compute fill via `color-mix`? No libraries but modern CSS is fine — yet simpler to interpolate in JS between two RGB colors: pale ash `#e7e1d5`-ish and rust `#a33d1f`? The original palette: --rust (probably #a8442a-ish), --ash, --ink, --card, --line. I'll define palette:

--paper:#f2eee6; --card:#faf7f1; --ink:#191712; --ash:#8a8274; --line:#d8d0c0; --rust:#a33b1e; --rust-text:#8f3517.

Ramp for zones: mix from #e4ddcf (rest ash-light) to rust at high f. I'll write a JS lerp function mixing in linear-ish RGB.

Zone labels: each zone clickable (data-take="zone|100") and hoverable (data-aim). SVG paths need tabindex="0" role="button" for keyboard — the original uses focusin for data-aim; keyboard Enter handled for [data-take] elements. Their keydown handler: `if(t&&t.dataset&&t.dataset.take){e.preventDefault();takeFor(t.dataset.take)}` — applies to any element with data-take on Enter/Space ✓ so SVG paths with tabindex work.

Now the overall structure I must build. The prompt: "Output one HTML fragment: a <style> block and a <script> block, defining and calling drawInstrument(rootEl, rail, data) and rendering into an element with id 'hero-root'."

So I write `<style>...</style><script>...</script>` that defines drawInstrument(rootEl, rail, data) and CALLS it, rendering into #hero-root. The data comes from the API — my script must fetch it: `api/hero?hero=<rail>`, `api/facets`, `api/trend`, `api/glossary`. drawInstrument(rootEl, rail, data) is called with data — so presumably it's called after fetching. But also "calling drawInstrument" — I'll structure: 

```js
async function boot(){ ...fetch facets/trend/hero... drawInstrument(el('hero-root'), rail, heroData); }
```

But drawInstrument(rootEl, rail, data) signature takes data — so drawInstrument itself is the pure(ish) renderer, and I call it from boot after fetch, and re-call on rail change / filter change (re-fetch then call again). I'll also wire interactions inside via event delegation attached once.

Data shapes I must assume (from api docs):
- api/hero?hero=when|where|whose|forced → returns... the original expects heroData with: months[{m,n,all}], zones[{code,label,n}], no_location, other_location, operator_rows[{o,n}], swarm[{t,n}], swarm_total, crew[{code,label,n}], crew_reports, total, lines[], specimen{control,...}, leave_one_out[{drop,would_give}], lag{}. I'll design my client around a reasonable superset and be defensive: `(d.months||[])` etc. Since I'm writing both sides of the contract, I should fetch and handle whatever comes. The instructions say data comes from those endpoints; I'll write defensively with fallbacks: if a field is missing, compute from other endpoints (e.g., trend for months, facets for zones/operators).

Robust plan:
- On boot: fetch api/facets, api/trend, api/glossary in parallel; then fetch api/hero?hero=<initial rail>. Compose `heroData` = hero response normalized: months from d.months if present else derived from trend filtered by range; zones from d.zones else derived from facets (facet key "zone"); operator_rows from d.operator_rows else facets operator; swarm from d.swarm else facets tail; crew from d.crew; total from d.total else facets.range.total adjusted? Total must reflect current selection — facets returns range{from,to,total} for the selection presumably (facets "every filter value with counts, and range{from,to,total}" — with query string filters narrowing it). So total = facets range.total or hero d.total.
- Every filter in query string narrows: when user clicks a mark, I set the query param (URLSearchParams on location) and re-fetch facets+hero, then re-render. But "narrow the whole page" — the page here is just this fragment (hero-root). There's no results table in my deliverable. The seam "Read the N →" — where does it go? In the original it goes to a results table (p-search). In my standalone fragment, I can make the seam... hmm. The prompt says output the fragment that renders into #hero-root — presumably this lives in their larger page? "defining and calling drawInstrument(rootEl, rail, data) and rendering into an element with id 'hero-root'". It sounds like a self-contained piece: my script should render the instrument into #hero-root, fetching data itself. The seam could scroll to a results section if present (el('p-search')/table.reports) and otherwise... The rule: "Clicking a zone, a month, an airline, a tail or a crew action must narrow the whole page." In a standalone fragment, narrowing = updating URL query + refetching + rerendering the instrument, and if a table exists on the page, scrolling to it. I'll implement: after take, push query params into location.search (replaceState), refetch, re-render, and if `document.querySelector("table.reports")` exists, scroll to it; else the instrument itself is the whole page and re-renders narrowed. I'll also render a small "held" chips row showing active filters with × to drop — the original has clause chips on phone; desktop shows the sentence describing selection. I'll include a filter chips row inside the instrument (subtle) — the original desktop doesn't show chips but shows the sentence + margin. I'll keep chips minimal under the sentence? The original's sentence element describes the selection in words. I'll write my own sentence generator.

Given output budget (128k tokens, no prize for brevity), they want a substantial, complete implementation. Let me now plan the full feature set:

CORE STRUCTURE (desktop):
```
<div class="instrument">
  <div class="ipad">
    <div class="ihead">
      <div class="stamp">FAA SERVICE DIFFICULTY REPORTS · {range} TO {to}</div>
      <div class="picker" role="tablist"> four tabs (WHEN/WHERE/WHO/FORCED + sublabel) </div>
    </div>
    <div class="sentence">{sentenceHTML}</div>
    <div class="aim" (hover/aim line)>
    <div class="hand">gesture hint + keyboard note</div>
    <div class="zero"> (if total 0: nothing matches + drop suggestions) </div>
    <div class="rails">
      <section class="rail" data-rail="when">…</section>
      ... all four rendered; open one expanded, others as closed strips (gutter label + flat strip)
    </div>
    <div class="specimen"> one report: filing + mechanic's words </div>
    <div class="margin"> margin notes </div>
  </div>
  <button class="seam">Read the N →</button>
</div>
```

Each closed rail shows: label (WHEN — month by month) + a flat gray strip (the ash rest state) with a rust value if that dimension is currently filtered (e.g., "Sep 2025" when from/to set). Clicking a closed rail opens it (setRail). Clicking an open rail's marks takes.

RAIL WHEN:
- 380 months strip. Each month a thin vertical bar: full height = all reports that month (in this selection? The original: m.n = in-selection count, m.all = corpus count for that month). Draw as stacked: bar background (all, pale) + inner bar (n, rust-ish/dark). Actually original phone: `<i style="height:all">` and `<u style="height:n">` — n drawn as darker overlay. Desktop similar: each month cell `<button class="mo" data-aim="month|m" data-take="month|m">` with two bars. Partial last month: marked `.part` (hatched or outlined) + margin note "…covers 1 to dd…, so its bar counts dd days against dd2 in a whole one".
- Axis under: year labels every 12 months (or when year changes) — ticks with year at January, small.
- Drag to take a range: pointerdown/move/up with bracket painting + count preview in aim line; release → set from/to (first of lo month to last of hi month), refetch. Keyboard: months are buttons; arrows walk, shift extends, enter takes (single month) or takes anchor..current.
- The open track is horizontally scrollable if 380 months don't fit (min-width per month, overflow-x auto). I'll set --mw computed: months * (gap+bar). Let bar be flexible: each month flex:1 with min-width 3px; if container wide enough, spread. Simpler: give strip display:flex, each month flex:1 1 0 min-width:4px, gap 1px → 380*5=1900px min → scrollable in a ~900px track. Scroll to right end on open (newest at right). Like original: `wtr.scrollLeft=wtr.scrollWidth`.
- Closed state: flat strip (the `.strip` with `<span>` flex:1) in ash; if from/to in query, gutter value shows the taken period in rust.

RAIL WHERE (aircraft):
- SVG side view (paths above), zones shaded by n/mx ramp. Click zone → filter zone=code. Hover → aim text "ZONE 300 · N of M placed findings · click to narrow".
- Right side of track (two-column track: drawing + legend): legend list of zones with swatch, label, count — clickable rows (same data-aim/data-take), plus the pads: "no location given" (no_location) and "place named in words" (other_location) — NOT drawn on the aircraft; listed under with plain note; the rule: "Where a drawing cannot place part of the selection, say so under it, plainly, in the same size type as everything else. Never let an empty box imply zero." So under the aircraft: a line: "N reports say nothing about where on the aircraft; M name the place in words rather than a zone number — neither can be drawn here." in same size type. Also the sum check: placed = sum zones n; if placed + no_location + other_location < total, remaining = "not classified"? I'll compute remainder = total - placed - no_location - other_location and mention if >0? The original only mentions no_location/other_location. I'll include a third pad only if remainder>0: "…the rest are counted but not placed." Keep: I'll show the two pads as clickable? Clicking "no location given" — what filter? There's no filter for it in the param list. So pads are display-only (with aim text but no data-take). Original phone had data-aim="pad|nowhere" only (aim, not take) ✓. Same here: pads get data-aim only.
- Blind zones: if a zone is in the query (zone=500) the drawing shades that zone; others at 0. If selection includes filters the drawing can't place (e.g., q text), note: original marginPush "blind": "no rail draws X; that part of the selection lives only in the controls below". I'll implement railBlind(): active filter keys not represented by any rail (q, part, condition, stage, discovered, nature, jasc?, ata?, corrosion, cracked, minhours, make, model). when draws from/to; where draws zone; whose draws operator/tail; forced draws crew. Blind = others (q, operator? no...). Also if query has make/model — whose drawing shows operators only... whose could draw make/model? I'll treat make/model as blind (drawn nowhere) → margin note listing them. Actually original: "no rail draws q, part; that part of the selection lives only in the controls below". I'll add a small controls row? "the controls below" — in my fragment there are no more controls. Hmm. The original page has a filters section below (p-search). My fragment is standalone-ish. I'll make the blind note say "lives only in the link above" or provide chips. Better: I include a filter chips row (active clauses with ×) — that covers removal, and the blind note says "that part of the selection is in the link and listed as chips above the rails; no rail draws it." Let me phrase: `no rail draws ${list}; it is in the link and on the chips above`. Hmm "chips above" — I'll place a slim chips row directly under the sentence when any filter is active: `clause chips: LABEL: value ×`. That's useful and honest. The original didn't have desktop chips but had the sentence + margin; the phone had chips. I'll add a restrained chips row — it aids operability since there's no external filter panel. I think that's within "yours" while preserving grammar.

RAIL WHOSE:
- Two ladders side by side (track.two: 1fr + 330px? original had drawing+legend; here: operators 1fr, airframes 330px). Operators: top ~14 rows by n: row = label (opName) + bar (width n/mx) + count; click → operator=key. If query has operator already, that row highlighted (rust) — and if the current operator isn't in top rows, show it pinned at top with a note. Also "not ranked here; use the operator control below" — original had more-ops aim; in mine: after the 14 rows, a quiet line: `${num(total operators)} operators in the file; the tail of the list is not ranked here`. 
- Airframes: top 8 swarm (tail numbers "N123") with bars, click → tail=key. Cap note in margin: "the tail list shows the N most-reported aircraft out of M; the airline list counts every report".

RAIL FORCED:
- Top: block bar: crew_reports of total forced a crew action: one horizontal bar with rust portion + caption "N of M reports forced the crew to act" (clickable? data-take? there's no filter "crewall" — it's aim only; original had crewall aim). 
- Below: ladder of crew actions (code+label+n), excluding none? Original filtered out ["K","0","O"] on phone; desktop rail unknown. I'll include all with labels from glossary (precautionary procedures: e.g., "0"=none? K=? I'll show as returned; use label from data; skip codes with empty label? Keep all rows where label non-empty). Click → crew=code.

SPECIMEN:
- d.lines + d.specimen: render "One report from this selection..." + specLine(d.specimen) (filing facts) + first line jargon. In my data, api/hero returns lines[] and specimen{...}. I don't know exact shape; original specLine(d.specimen) and jargon(d.lines[0]) — jargon decodes FAA codes using glossary. I'll write my own specLine: if specimen is an object with fields (control, acft, date, zone, jasc...) — I'll be defensive: build facts from known keys. And jargon(line): line is a string containing FAA codes; decode using glossary tables (I fetch glossary: "every FAA code table, decoded" — shape unknown; I'll handle map-like: glossary = {part_location:{code:label}, ...} or [{table,entries}]). Defensive normalization: `function glossTable(name)` returns object code→label from whatever shape.

Hmm — since I control the client only, I must guess API shapes. The safest: normalize aggressively:

- facets: assume `{range:{from,to,total}, facets:{<key>:[{value,n,label?}...]}}` OR `{filters:[{key,values:[...]}]}`. I'll write normalizer trying both.
- trend: array [{month,n}] possibly `{rows:[...]}`.
- hero: try direct fields; fallback compute.

Given ambiguity, defensive code with multiple shape attempts is the professional move. I'll write `pick(obj, paths)` helper.

SENTENCE: generate from selection + rail:
- "Reading 1,757,828 reports." at rest (corpus total, no filters).
- With filters: sentence describing the selection: e.g., "1,204 reports filed with the FAA between Aug 1995 and Nov 2025, by United Airlines, on zone 300, where the crew had to shut an engine down." I'll compose clauses per active filter using LABEL map: q→"mentioning “x”", operator→"filed by x", tail→"on airframe N-x", zone→"found in zone x", crew→"where the crew x", month/from-to→"between x and y", jasc→"coded x", ata→"in ATA chapter x", part→"on part x", condition/stage/discovered/nature/corrosion/cracked/minhours similarly.
- Plus the "what you are looking at" per rail: at rest: "Four ways in: when it happened, where on the aircraft, whose aircraft, what it forced." Keep restrained: sentence states the count and the selection; the open rail's gutter states its question.

AIM LINE: shows hover text; default empty (or the corpus line?). Original: `.aim` empty div; hover writes aim text; keyboard focusin too; unaim on mouseout. I'll do same: `aim(html)` sets innerHTML; `unaim()` clears (back to nothing). aimHold(html) pins a message with undo. Undo via history.back()? In my fragment, pushes are history pushes; undo button uses history.back() then rerender on popstate. I'll listen to popstate → refetch+rerender. Good.

MARGIN: notes list, small rust-tinged type, id iMargin. marginPush(id,text) dedupes; marginRender() draws them in order added. Notes: partial month, swarm cap, basis ("counts are of reports filed, not of flights"), blind filters, zero-state explanation.

ZERO STATE: if total===0: `.zero` block: "Nothing matches all of these at once." + leave_one_out suggestions from hero (drop → would_give) as buttons: dropping filter k → remove param, refetch. If leave_one_out absent from API, fall back to one-click drop of each active filter (I can offer dropping any single active filter — but without would_give counts I show just "Drop X"). I'll compute candidates from active params; if hero provides leave_one_out use its counts.

REFUSED STATE (no data / unfetchable or unresolved param): if hero fetch fails or returns total undefined... Original `if(!d)` frame with sentence "One value in this link is not in this data..." — that's when API says refused (UNRESOLVED non-empty). I'll implement: if fetch fails → frame with "could not reach the file just now" + retry button. If API signals unresolved (I'll detect: hero response has `refused`/`unresolved` field or facets missing) → frame: "One value in this link is not in this data, so no search was run. There is no number on this page to quote." Keep that discipline.

REFUSED STATE (no data / unfetchable or unresolved param): Also keep — hmm I already covered this above; continuing: The picker: four tabs with question label + count? Original: `<span class="q">` = WHAT IT FORCED or r[1] (WHEN etc.), `<span class="pn">` r[2] = "month by month" etc. I'll do same: q = WHEN/WHERE/WHO/WHAT IT FORCED; pn = month by month / on the aircraft / airline and tail / what the crew did.

PHONES: I should handle narrow screens — the original has drawPhone. "Build all four rails, properly." Budget allows a phone path. I'll implement a compact responsive treatment instead of a full separate phone instrument? The original's philosophy: below 760px becomes a sentence built clause by clause. That's a lot of extra code but I have budget. However, risk: complexity bugs. I'll do a middle path: same DOM, CSS reflow: rails stack, aircraft scales (SVG is responsive), ladders full width, picker wraps, when-strip remains scrollable horizontally (touch scroll works), tap-aim-then-take pill for months/zones/ladders (first tap aims, second tap takes — via the phTap pattern). Actually implementing the two-tap pill globally: for touch devices, first tap on data-take shows pill, second tap takes. The original does exactly that on phone for data-take elements (except the pill). I'll implement it: pointer:coarse detection. This gives touch users inspect-then-commit. And CSS: media ≤760px: grid single column, head wraps, track.two → 1fr, specimen stacks, hand hidden maybe.

Also aim on touch: focusin fires on tap for buttons? Tap gives focus (mostly). The pill approach covers it.

Let me now write the drag logic for the when rail:
- months strip: `.months` contains `.mo` buttons in a scrollable `.track`. Since buttons, pointerdown on button then move — need touch-action:none on strip and pointer capture on strip (original setPointerCapture on track). Prevent button click default? On release we take period; also suppress the click that would follow (button click would fire heroMonth single). Original handles: pointerdown → preventDefault, dragFrom=monthAt; pointerup → takePeriod. A click event still fires after pointerup on the button... In original, data-take click handler on document would call takeFor → heroMonth → narrowing to single month, overriding takePeriod's range? Order: pointerup then click. takePeriod sets from/to and search(0). Then click fires takeFor(month) → heroMonth sets from/to to single month! That would break drag. Unless pointerdown preventDefault suppresses click? preventDefault on pointerdown does NOT suppress click. Hmm — original: `document.addEventListener("pointerdown",e=>{...e.preventDefault();dragFrom=monthAt(...)...})`. Then click on `.mo`... the `.mo` elements have data-take="month|m"? In the original, months presumably have data-aim="month|m" and maybe data-take too. If pointerup fires after drag, takePeriod runs; then click fires takeFor → heroMonth single month. That contradicts. Maybe original months only have data-aim (aim on hover) and NOT data-take; single-month take happens via click? Their keyboard Enter on `.mo` does heroMonth. So maybe .mo has data-aim only, and desktop single-month narrowing is only via keyboard?? But then clicking a month (no drag, down+up same month) → takePeriod(m,m) = single month ✓. So .mo needs NO click handler at all: pointer down/up covers both drag and plain click. And keyboard Enter handled separately. Clever. And the generic [data-take] click handler ignores them. I'll do the same: months get data-aim only; pointerdown/up logic handles take; keyboard arrows/enter for accessibility. But wait — the generic click handler for [data-take] exists and months aren't data-take → fine. Touch: tap month → pointerdown/up → takePeriod immediately (original relied on pointer events; phone had its own drawPhone with tap-first-tap-last pill for data-take... months in phone used data-take="month|m" with phTap pill). For coarse pointers on desktop layout, immediate take on tap is acceptable-ish, but inspect-then-commit is the ethos. I'll add: if coarse pointer, month tap → pill (aim + "take it") instead of immediate take: implement in pointerup: if coarse → showPill(spec) else takePeriod. Good.

Pointer capture: attach listeners to strip: on pointerdown, strip.setPointerCapture(e.pointerId); move/up handled on strip (captured) — simpler than document-level. But original used document-level with capture on track. I'll bind on the strip itself: pointerdown → capture; pointermove → update; pointerup → take; pointercancel → clear.

monthAt: compute index by x within strip: month width = strip scrollWidth/months.length — but with flex and gaps, use each cell's rect: find via `Math.floor((x)/(w/ms.length))` like original (they used uniform width). I'll use uniform width assumption: `(r.width/ms.length)` where r = strip's content rect? With overflow scroll, getBoundingClientRect of strip is viewport of visible part; months scrolled — need scrollLeft offset: x_client - r.left + strip.scrollLeft. Original ignored scrollLeft?? Their monthAt: `const r=track.getBoundingClientRect(); x=clamp(ev.clientX-r.left,0,r.width-1); ms[Math.floor(x/(r.width/ms.length))]`. If track scrolls, r.width is the visible width but months are wider → wrong. Hmm, but maybe their track never scrolls (they set scrollLeft but months fit?). Whatever — mine must be correct: use `track.scrollLeft + (clientX - r.left)`, clamp to content width = track.scrollWidth, index = floor(x/(scrollWidth/ms.length)). ✓

Bracket painting: add .inband to months between lo..hi; aim shows "Mar 2022 to Aug 2022 · N reports · release to take it". N = sum of n in band (selection counts).

After take: set from/to params: from = lo+"-01", to = hi + last-day. Update URL (history.pushState so undo works), refetch hero+facets, rerender. aimHold: `narrowed to Mar 2022 to Aug 2022. undo`.

URL handling: I keep a `state` of params: read from location.search at boot; write via setParam(k,v) → build URLSearchParams, pushState, then refresh(). Chips read same params.

KEYBOARD for months: `.mo` elements tabindex 0? 380 tab stops is bad — original made them focusable via arrows only? Their keydown checks `t.classList.contains("mo")` with ArrowLeft etc. — requires focus on a .mo, so they are tabbable (tabindex on each?). Better a11y: make the strip a single roving-tabstop: first month tabindex 0, others -1, arrows move focus. I'll implement roving: on arrow, focus next (even if -1, focus works programmatically). Set tabindex=0 only on... simpler: tabindex="-1" on all, but then keyboard users can't reach. I'll set tabindex="0" on months?? 380 stops — bad. Compromise: strip container tabindex=0; keydown on container: arrows move a virtual caret with roving focus: focus the month element directly (they have tabindex=-1, focusable programmatically). On focus, month shows aim. Enter takes. That gives one tab stop. I'll do: container.keydown: if Arrow*, e.preventDefault; target month = current focused or last; focus it (tabindex -1 ok). If none focused yet, focus last month. Shift extends anchor. Enter/Space takes. Also rove() — original had rove() probably for roving tabindex. I'll name mine `roveMonths()`.

Also zonal SVG paths: tabindex=0 each (9 zones) — fine, few. Ladder rows: buttons ✓ natively focusable.

FOCUS STYLES: visible outline: 2px solid ink offset. Ensure `.mo:focus-visible` outline.

Now the "hand" line: per-rail gesture hint:
when: "Drag across the months to take a period." + kbd note.
where: "Click a zone on the aircraft to keep only what was found there."
whose: "Click an airline or an airframe to follow it."
forced: "Click what the crew had to do."
Plus "Or use the chips above." maybe. Keep as original: a `.c` link scrolling to filters — I don't have filters below; I'll change to: "Every value in this rail can also be reached by typing — use the Aim at box." But I decided to drop the Aim-at box. Hmm — the original's Aim at box is a major accessibility feature ("Everything the pointer can reach, reachable by typing"). I have budget. Should I include it? The prompt says "Write your own implementation... Build all four rails, properly." The aim box is beyond rails but it's part of the instrument's soul. I'll include a trimmed version: input + kind select, resolve endpoint, takeReading with disambiguation. That's another ~150 lines. With 128k budget, yes, include it — it strengthens "operable instrument". Let me include: select (period/operator/tail/zone/jasc/q) + input + suggestions (api/resolve) grouped by kind, keyboard nav, Enter/mousedown take, plus free-text handoff to q param (which narrows everything — I can apply q as a param directly! handOff sets q param and refetches; no external table needed). And aimDay? A single-day date input — original had it; it maps from/to to that day. I'll include a compact "or one day" date input. OK.

Wait — scope check: the deliverable is "a <style> block and a <script> block". It must run standalone in a host page with #hero-root. I'll write one big script, organized in sections with comments in the original's voice (lowercase-start commentary explaining why). The original's comments are a discipline: "rust is reserved for a chosen selection..." I'll write my own comments in that voice — sparse, reasoned, explaining why not what.

Fonts: Archivo, Instrument Serif, IBM Plex Mono — load via Google Fonts <link>? Output is a fragment (style+script) — I can @import in the style block. I'll @import fonts in CSS (works in a <style> block).

Palette variables (mine, matching spirit):
```
--paper:#efe9dd; --card:#f7f3ea; --ink:#1c1913; --ash:#8b8271; --line:#d9d0bd;
--rust:#a63c1b; --rust-text:#96351a; --ramp0:#e6dfcf; (rest tone)
```
Original background likely #f2eee6-ish (tr.spine background #f2eee6). I'll use --paper:#f2eee6, --card:#f9f6ef, ink near-black #201c14, ash #8c8474, line #dcd4c2, rust #a8431f, rust-text #93380f? Keep close.

Numbers: IBM Plex Mono for counts (num()). num = n.toLocaleString("en").

esc(): escape HTML.

Let me define ramp: function rampColor(f) mixing between rest `#e3dccb` and rust `#a8431f`? For zone fills I want readable range: low = slightly darker than paper (visible but quiet), high = strong rust. mix(c0,c1,f) with f=0.10+0.80*(n/mx). Also selected zone (already in filter) gets stroke rust + its fill at max? The current zone filter: zone param set → that zone path gets class "taken" (stroke rust 2.6). Others' fills show counts in narrowed data (which would be 0 for others if exclusive). Fine.

Aircraft stroke: ink thin (1) around silhouette: I'll stroke each zone path lightly (line color) + an outline path over all (fuselage+parts) with ink 1.2, fill none. Simpler: give each path stroke:var(--line)? Then boundaries between adjacent zones (clipped rects) would show internal borders — actually good: zone boundaries visible? Original shading probably seamless within fuselage halves. Internal borders between 100/200 (centerline) and 200/700 (wing box line) are real FAA zone boundaries — showing them is honest. I'll stroke zone paths with `#00000022`? Hmm. Let me: fuselage halves clipped — internal edges get hairline stroke via each path stroke: rgba ink .18. Outer silhouette: separate `<path class="hull" d=fuselagePath stroke ink 1.4 fill none/>` plus wing/fin outlines drawn as part of their zone paths with stroke ink .9? If zone path has stroke, outer edge gets it ✓ but internal clipped edges too. Compromise: zones stroke none; overlay silhouette outline path (fuselage) stroke ink; wings/fin/gear paths get their own stroke ink 1. I'll give each non-clipped zone path (wings, fin, stab, nacelle, gear) stroke ink 1 and the clipped fuselage zone paths stroke none, plus one hull outline on top. 

Now datum: no_location/other_location — hero fields; if absent, try facets facet "zone" containing special values? Skip gracefully: if undefined, omit pads but then placed sum vs total mismatch — add third note computed: unplaced = total - placedSum - noL - othL (if any of these present); if unplaced>0 add "…and U more are not classified into a zone at all." Compute after normalizing.

Whose: operator_rows [{o,n}] (o = operator code/id?). opName(o) — maybe name included; if rows have label/name use it, else look up facets labels, else show raw. swarm [{t,n}] tails.

Crew: [{code,label,n}] ✓ from hero. crew_reports number.

Months: hero.months [{m:"1995-04", n, all}]; fallback: derive from trend (all) — but n (in-selection) unavailable → then use trend n as all and n=all when no date filters; when date filters active, from/to just window the strip (months outside range shown but 0? Actually if from/to narrow, months array from hero would cover range only). My months normalization: if d.months present use it (n = n??d??). If missing: build from trend rows: m=month, all=n, n = (no date filters? n : windowed count unknown → set n=all and note?) I'll set n = all (display shows full bars) — acceptable fallback. partialMonth(m): m equals to-month and RANGE.to day < last day.

Range: from facets.range.from/to (corpus coverage) — RANGE for clamping and stamp. stampRange: "1 MAR 1995" pretty; stampTo: RANGE.to uppercased pretty.

Filters mapping to rails for blind detection:
- when draws: from,to
- where draws: zone
- whose draws: operator, tail
- forced draws: crew
- everything else blind: q, make, model, part, condition, stage, discovered, nature, jasc, ata, corrosion, cracked, minhours.
jasc drawn? forced rail shows crew actions, not jasc. jasc blind ✓ (system codes not drawn). Could add ATA mini-ladder in forced? The prompt's four rails don't include jasc. Keep blind note.

LABEL map (for chips + drop suggestions): q:"words", operator:"airline", tail:"airframe", zone:"zone", crew:"crew action", jasc:"system code", ata:"ATA", part:"part", condition:"condition", stage:"stage", discovered:"discovered", nature:"nature", corrosion:"corrosion", cracked:"cracked", make:"make", model:"model", minhours:"hours", from:"from", to:"to".

clauseText(k,v): humanize value via glossary (e.g., zone 300 → "ZONE 300 — AFT FUSELAGE"? glossary decode; crew code → label from crew rows or glossary precaution; jasc → glossary jasc label; operator → name).

Glossary normalization: try shapes: `{tables:{precaution:{...}}}` or `{precaution:[{code,label}]}` or array of {table,name,entries/rows}. I'll write `glossInit(data)` building GLOSS = {tableName: Map(code→label)} with heuristics over keys: for each property, if object of code→label pairs, index it. Then lookup tries several table names: zone→["part_location","zone"], crew→["precautionary","precaution","crew"], jasc→["jasc","jasc_code","specimen_cond"], etc. Defensive.

specimen: d.specimen could be {control, acft, date, ...} plus d.lines array of strings (mechanic's lines). specLine: render a mono line: `N-number · date · zone · control` from whatever fields exist. jargon(line): replace FAA codes in the text using glossary? Original "the mechanic's words as written" + jargon() probably renders the raw line with code expansions on hover/titles. I'll implement jargon(line): if line is object → assemble; if string → escape and wrap recognized codes with `<abbr title="decoded">`? Simpler: return esc(line) with codes expanded in a `<span class="jx" title>`. I'll do: find tokens matching /\b\d{4}\b|\b[A-Z0-9]{2,6}\b/ — too noisy. Keep: return esc(line) — the words as written — and add a `.f` facts row from specimen fields. That satisfies "first the FAA's own filing of it, then the mechanic's words as written": filing = facts grid (control no., date, aircraft, zone, ATA), then the line text in serif italic? Original `.sl` styling: mechanic's words — I'll set Instrument Serif, larger, quotes.

Specimen click → opens full report: data-case → I have no report page; I'll make the opens cue only if a case page exists: skip role=button; no click (honest: no route → no cue). Or link to `?control=` — not in API list. I'll render without opencue. Fine.

SEAM: "Read the 1,204 →" — where? In standalone: if there's a results table (table.reports) scroll; else... the seam must still exist as the exit of the instrument. In my page there's nothing else. Hmm. "Rendering into an element with id hero-root" — likely embedded in their page that may have a table. I'll implement goResults(): if a table.reports exists → scroll to it; else if element with id "p-search" exists → scroll; else the seam is honest: it can't go anywhere — then what? Maybe the seam could toggle an inline results view?! That's scope creep but "the whole page narrows" — maybe my fragment IS the whole page and reading results requires a table. I could implement a minimal results table fetched from... no results endpoint listed (api list: hero, facets, trend, breakdown, glossary — no search endpoint!). So results table isn't buildable from given endpoints. The original's page had one (search()). Given endpoints, I cannot fetch reports. So the seam: keep it, and goResults() scrolls to table.reports if present, else scrolls to the sentence/... Actually better: make the seam do the honest thing: if no table exists, it stays as the affordance that copies the link? Hmm. Alternative: seam label "Read the N →" and if there's no destination, render seam only when destination exists. That respects "never imply". I'll detect destination at render: hasTable = !!document.querySelector("table.reports"); if none, render a quiet line instead: "The reports themselves live in the file's search, which this instrument sits above." — no, don't over-explain. Decision: if no table.reports in DOM, omit the seam entirely (the instrument is the page). If present, seam scrolls. Clean.

Breakdown endpoint: "the ATA systems of a selection, with true totals" — used for...? I could add an ATA strip in the margin? The four rails don't include ATA. I could use breakdown to add a fifth quiet line under forced? Not required. Skip — but hmm, "Take the room you need" — maybe add ATA as a small secondary ladder inside forced rail? The rail is "what the crew did" — ATA is the system, different question. I'll skip breakdown to keep the instrument's grammar tight. Actually — wait. Maybe use it: the where rail's legend could offer ATA? No. Skip. (Endpoints listed are available, not all mandatory.)

Now, sentence composition. At rest (no filters): "Reading 1,757,828 reports." Then a second sentence in same element? Original sentence element contains sentenceHTML(d) — maybe includes "The four rails below are four ways into the same number." I'll write:

- rest: `Reading ${num(total)} reports.` + `<span class="s2">Four ways in below: when it happened, where on the aircraft, whose it was, what it forced.</span>`? The original keeps the sentence to the count. I'll add rail-specific second clause: "The open rail is WHEN — month by month." Hmm the picker already says that. Keep sentence = count + selection clauses only. Discipline.

Selection clauses: 
- period: from/to: "filed between {pretty(from)} and {pretty(to)}" (or "on {day}" if equal, or "in {month}").
- operator: "filed by {name}"
- tail: "on airframe N{tail}"
- zone: "found in {zone label}"
- crew: "where the crew {crew label lowercase}"
- q: "mentioning “{q}”"
- jasc/ata/part/condition/stage/discovered/nature/corrosion/cracked/make/model/minhours: "{label} {value}" composed: e.g. "system code 3230", "part number …". I'll join clauses with ", " and end period. If total===0 sentence stays (count 0) + zero block shows.

Aim line default content: maybe show current rail's open hint? Original `.aim` empty until hover. Keep empty (height reserved).

Let me also implement `rove()` — roving tabindex for months: first render sets tabindex 0 on middle? I'll set tabindex=0 on the LAST month (newest) since strip scrolled right; arrows move; focus moves; container monitors. Implement: months are `<button tabindex="-1">` except one with tabindex="0" (the anchor = the month nearest the visible right edge = last). roveMonths(): on focus of a .mo, set its tabindex 0 and previous anchor -1.

Keyboard on container: because focus is inside buttons, keydown target is the button (or container if none focused). Handle both.

Enter on month with kbAnchor: takePeriod(anchor..current) else heroMonth(m).

paintBracket on shift-arrow ✓.

Phone (coarse) month tap → pill: implement pill as fixed bottom-center button "Mar 2022 · 12,004 reports — take it →" onclick takePeriod. Pill for any data-take element (zones, ladders) and for months via pointerup path. Also scroll removes pill.

Now URL/refetch flow:
```
async function refresh(pushUrl){ 
  buildQS(); if(push)history.pushState(...);
  const [facets, hero] = await Promise.all([api('facets'), api('hero?hero='+rail)]);
  normalize(); drawInstrument(root, rail, heroData);
}
```
But drawInstrument(rootEl, rail, data) signature must be that. So drawInstrument is sync render from data; boot/refresh fetch then call. Rail switch: fetch hero for new rail then drawInstrument(root, newRail, data). Filtering: set params → fetch facets+hero → drawInstrument(root, rail, data).

Also I should call drawInstrument once at boot and it should also be robust if data partially missing.

Let me also implement loading state: while refetching, dim instrument (class "busy") and keep old render; aim line "reading…"? Keep subtle: opacity .6 on .ipad during fetch + aim "Reading the file…". Prevent double-take during fetch via `inflight` guard? Allow but sequence guard: token.

Edge: 380 months × buttons — fine.

Whitespace/typography:
- .instrument: paper bg; centered max-width 1060px; border 1px line; card inside? Original: .ipad = the padded panel, .stamp small mono caps, .sentence Instrument Serif ~30px, .aim mono 12.5px ash line, rails 110px gutters, strip bars ~18px tall closed, open when-rail months ~64px tall. Picker tabs: text buttons uppercase with pn sub.
- .seam: full-width button under the ipad: mono, rust text, top border.

Let me now write CSS carefully (this is the "belonging" part):

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap');

#hero-root{...}
.instrument{max-width:1080px;margin:0 auto;padding:22px 18px 30px;font-family:Archivo,...;color:var(--ink);background:var(--paper)}
.ipad{background:var(--card);border:1px solid var(--line);padding:20px 22px 14px}
.ihead{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px}
.stamp{font:500 10.5px/1.4 'IBM Plex Mono',monospace;letter-spacing:.14em;color:var(--ash)}
.picker{display:flex;gap:2px}
.picker button{appearance:none;background:none;border:1px solid transparent;padding:7px 10px 6px;cursor:pointer;text-align:left;font-family:inherit}
.picker button .q{display:block;font:700 10.5px/1 Archivo;letter-spacing:.1em;color:var(--ash)}
.picker button .pn{display:block;font:400 9.5px/1.6 'IBM Plex Mono';color:var(--ash)}
.picker button.on{border-color:var(--line);background:var(--paper)}
.picker button.on .q{color:var(--rust-text)}
.sentence{font:400 30px/1.25 'Instrument Serif',serif;margin:16px 0 4px;max-width:46ch}
.sentence b{font-weight:400;color:var(--rust-text);font-variant-numeric:...}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px}
.chip{font:400 11px 'IBM Plex Mono';border:1px solid var(--line);background:var(--paper);padding:3px 7px;border-radius:2px;color:#5f584f}
.chip b{cursor:pointer;color:var(--ash);padding-left:6px} .chip b:hover{color:var(--rust)}
.aim{min-height:20px;font:400 12.5px/1.5 'IBM Plex Mono';color:#5f584f;margin:6px 0 0}
.aim .undoit{...ghost}
.aimat{...}
.hand{font-size:11px;color:var(--ash);margin:8px 0 0}
.hand .kbd{display:block;font:400 10.5px 'IBM Plex Mono';color:#a39a87}
.rails{margin-top:14px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:110px 1fr;gap:14px;align-items:start;padding:5px 0;border-top:1px solid var(--line)? }
```
Hmm original closed rails have subtle separation. I'll give .rail + .rail border-top: 1px solid color-mix? Use `border-top:1px solid #e7e0d0` on rails except first? Actually give each .rail border-top:1px solid var(--line) except .rail:first-child none.

Closed rail: `.rail:not(.open){cursor:pointer;grid-template-columns:150px 1fr;align-items:center;padding:7px 0}` with `.gut.rest` label + `.strip` (height 14px, ash #ddd5c3, span rust if filtered). Hover: strip darkens.

Open rail gutter: q (question, 11px caps), pn (sub), val (current filter value in rust mono).

.rail.open{padding:8px 0 10px}

When open: `.track{overflow-x:auto}` `.months{display:flex;align-items:flex-end;gap:1px;min-width:100%;height:64px;touch-action:none}` `.mo{flex:1 0 3px;position:relative;background:none;border:0;padding:0;cursor:pointer;height:100%}` bars: `.mo i{position:absolute;bottom:0;left:0;right:0;background:#d7cdb8}` (all) `.mo u{position:absolute;bottom:0;left:0;right:0;background:var(--ink)}`? Wait: two bars — "all" pale, "n" (in selection) darker overlay from bottom. If n<all, the u bar sits at bottom same base... overlaying from same bottom means u covers lower part of i, not proportional comparison. Better: u height proportional within i? The original phone: `<i style="height:allpx">` and `<u style="height:npx">` both absolutely at bottom — so u overlays bottom portion of i. Visual: full month bar pale; the bottom part (up to n height) dark. Since n ≤ all, dark region = bottom n% — reads as "how much of this month remains in the selection". Good, do same: i bottom:0 height all%; u bottom:0 height n% with rust/ink color. When no date filters, n=all → fully dark? At rest every month n=all → whole strip ink-dark. Hmm at rest original: "the corpus stands in ash" — rust reserved for selection. So at rest bars should be ash/pale with NO dark overlay (n==all → skip u or make u same pale). Their phone code renders u only if m.n — and maybe styled same pale so invisible. I'll render u only when n<all, colored rust-text? "rust is reserved for a chosen selection" — the in-selection bar IS the selection → rust. So u = rust (#a8431f at .85). And months with n=0 but all>0: show tiny ash tick? show i pale only. Months with all=0: nothing (empty) — plus axis continues.

.inband bracket: months in drag band get `outline`/background tint: `.mo.inband i{background:#c9bda2}` or add top caret. I'll do `.mo.inband{background:#ece4d2;border-radius:1px}` plus the aim text. Also `.mo.part u` gets hatched? Mark partial month: dashed top edge: `.mo.part::after{content:"";position:absolute;top:0;left:0;right:0;border-top:1px dashed var(--ash)}` and margin note explains. Good.

Axis: `.axis{display:flex;position:relative;height:14px;margin-top:3px;min-width:100%}` year ticks absolutely positioned at month index position: left = (idx+0.5)/N*100% — but with scrolling and min-width, percentage works if axis min-width matches months min-width. Both in same scroll container: wrap `.months+.axis` inside `.scroll` div. I'll structure: `<div class="track"><div class="scroll"><div class="months">…</div><div class="axis">ticks</div></div></div>`. Ticks: `<span style="left:X%">1995</span>` at each January (or every 24 months if dense: if N>200, label every 10 years? 380 months ≈ 31.6 years — label every January would be 32 ticks, too dense. Label every year where (N/years) spacing < 34px → choose step = ceil(34px / pxPerMonth). pxPerMonth = scrollWidth/N... compute after render via JS? Simpler: step in months = 12*ceil(34/(12*barMinWidth))... I'll compute in JS after mount: labelStep = Math.max(12, 12*Math.ceil(34/( (scrollWidth-0)/N *12 )))... Let me just: after render, measure monthEl width, choose yearStep = Math.max(1, Math.ceil(36/(w*12))), then place ticks for Januaries where (year - firstYear) % yearStep === 0. Recompute on open. Fine — small function `axisTicks()`.

Whose ladders: `.ladder{display:flex;flex-direction:column;gap:2px}` `.lrow{display:grid;grid-template-columns:minmax(90px,160px) 1fr 64px;gap:8px;align-items:baseline;background:none;border:0;padding:3px 4px;cursor:pointer;text-align:left;font-family:inherit}` `.lrow .lb{font-size:12px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}` `.lrow .bar{height:9px;background:#ddd3bd;position:relative}` `.lrow .bar i{position:absolute;inset:0 auto 0 0;background:#b3a88d?}` Hmm — bar fill: pale-dark for count magnitude; taken row: rust. "rust is reserved for a chosen selection": the currently-filtered operator/tail row → rust bar + rust label. Others: neutral fill `#c9bfa8`. Count: mono 11px right-aligned.
Row hover: background #f1ead9.

Forced block: `.fblock .big{height:22px;background:#ddd3bd;position:relative}` fill rust width crew_reports/total %. Caption mono. Then ladder of crew actions same as whose ladder.

Where rail: `.track.two{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px}` left: SVG (responsive width 100%), right: legend `.zl{...}` rows: swatch 12×12, label 12px, count mono. Pads + unplaced note under the aircraft inside left column: `.zonenote{font-size:12px;color:#5f584f;...}` — same size type as legend ✓ (the rule: same size type as everything else — I'll use 12px like the rest of the small type, not tiny).

Margin: `.margin{margin-top:14px;border-top:1px solid var(--line);padding-top:9px;display:flex;flex-direction:column;gap:4px}` `.margin .mn{font:400 11.5px/1.5 'IBM Plex Mono';color:#6b6353}` with rustnote class for the partial-month (original had `.rustnote` colored rust-text). I'll mark the partial-month + basis notes normal; keep `.mn.warn{color:var(--rust-text)}` for refused-ish.

Specimen: `.specimen{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}` `.sh{font:500 10.5px Archivo;letter-spacing:.06em;color:var(--ash);text-transform:uppercase}` `.sf{display:flex;gap:14px;flex-wrap:wrap;font:400 11px 'IBM Plex Mono';color:#6b6353;margin-top:6px}` `.sl{font:400 19px/1.45 'Instrument Serif';margin-top:8px;max-width:70ch}` with hanging quote.

Zero: `.zero{margin:12px 0 0;border:1px dashed var(--line);padding:10px 12px}` `.zero b{font:600 12px Archivo}` `.zero .ghost{...}`.

Ghost buttons: `.ghost{font:500 11px Archivo;background:none;border:1px solid var(--line);padding:4px 9px;cursor:pointer;color:#5f584f;border-radius:2px}` hover: border rust color rust.

Aim-at: `.aimat{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;position:relative}` select+input mono 12px, suggestions dropdown absolute card with `.sug` rows (label, what, count) and `.sughead` tiny caps per kind.

Seam: `.seam{display:block;width:100%;border:0;border-top:1px solid var(--line);background:none;padding:12px 0 2px;font:500 13px 'IBM Plex Mono';color:var(--rust-text);cursor:pointer;letter-spacing:.04em}` hover: color darker + arrow shift.

Phone media (≤760px): rails grid 1fr; gutter horizontal; track.two 1fr; sentence 24px; picker wrap; aimat wraps; hide .kbd maybe.

Pill: `.phpill{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:50;background:var(--ink);color:var(--paper);font:500 12px 'IBM Plex Mono';padding:9px 14px;border:0;border-radius:3px;cursor:pointer}` `.phpill .go{color:#f0b39a}`.

Focus visible: `:focus-visible{outline:2px solid var(--ink);outline-offset:1px}` and `.mo:focus-visible{outline:1px solid var(--rust);outline-offset:0;background:#eee5d0}`.

Now the JS. Let me draft the whole script structure:

```js
(() => {
"use strict";
/* ---------- the small tools ---------- */
const el=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>Number(n||0).toLocaleString("en-US");
const MONTHS=[...]; monthName(m);
const MONTHS3=["Jan",...]; prettyDate(d) → "3 Mar 2025"? Use `d MRI yyyy` mono uppercase for stamp.
```

prettyDate(iso): if !iso return ""; parse y-m-d; return `${+dd} ${MON3[mm]} ${yy}`.
monthName("1995-04") → "April 1995".
lastDay(y,m).

/* ---------- state ---------- */
```
let ROOT=null, RAIL="when", HERO=null, FACETS=null, GLOSS={}, RANGE={from:"",to:""}, TOTAL=0, CORPUS=0;
let ANCHOR=null, DRAG=null, SUGSEQ=0, SUG=[], SUGI=-1, BUSY=0;
```

params(): new URLSearchParams(location.search). 
paramKeys→filters: list FILTER_KEYS=["q","operator","make","model","tail","part","condition","stage","discovered","nature","crew","jasc","ata","zone","corrosion","cracked","minhours","from","to"].

api(path): fetch(path+(path.includes("?")?"&":"?")+filterQS()) — wait: facets/trend/hero all must receive the filter query string ("Any filter in the query string narrows all of it"). The filters live in OUR page's query string; endpoints on same host — do they read location query themselves? "Any filter in the query string narrows all of it" — ambiguous, but safest: I append the current filter params to API calls explicitly. So api(p) merges FILTER params into p's query. ✓ Also "hero=<rail>" included for hero.

```
async function api(p){
  const u=new URL(p, location.href);
  const qs=new URLSearchParams(location.search);
  FILTER_KEYS.forEach(k=>{ if(qs.has(k)) u.searchParams.set(k,qs.get(k)); });
  const r=await fetch(u,{headers:{accept:"application/json"}});
  if(!r.ok) throw new Error("http "+r.status);
  return r.json();
}
```

Normalization:

```
function facetsRange(f){ 
  const r=(f&&(f.range||f.coverage))||{};
  return {from:r.from||r.min||"", to:r.to||r.max||"", total:+(r.total||r.n||0)||0};
}
function facetList(f,key){ // returns [{value,label?,n}]
  if(!f) return [];
  const fc=f.facets||f.filters||f;
  let a=fc[key]||fc[key+"s"];
  if(a&&a.values) a=a.values;
  if(Array.isArray(a)) return a.map(x=> typeof x==="object"? {value:String(x.value??x.key??x.code??x.term??""), n:+(x.n??x.count??0), label:x.label||x.name||undefined} : {value:String(x),n:0});
  if(a&&typeof a==="object") return Object.entries(a).map(([value,n])=>({value,n:+n}));
  return [];
}
```

trend normalize: array or {rows|months|trend}. items {month|m|date, n|count}.

hero normalize in `composeHero(raw)`:
```
const total = num from raw.total ?? facets range total ?? sum months n;
months: raw.months? normalize {m,n,all} : derive from TREND within [min visible]... months for the strip should be the corpus months (the whole 380) regardless of selection — showing the corpus timeline with selection overlay (m.all) — YES: the strip shows corpus months; n = selection count per month. So months always from TREND (corpus), and hero.months (selection n) merged by m. If hero.months absent, n = (no from/to filters ? all : 0 unknown) — I'd rather not fake. If hero provides months with all, trust it entirely. Else trend gives all; n: if no date filter, n=all; if date filter active but hero gave no months → n = all for months within window? That's wrong-ish but the window is exactly the filter, so months inside window have n=?? can't know (other filters too). Then display u only when hero provided data. To keep honest: if selection-per-month unknown, show corpus bars only and add margin note? Over-engineering. Assume hero.months exists (the original clearly relies on it: m.n, m.all). Fallback: trend → m.all, and n=all (rest state) since if we can't compute selection-by-month we're probably at rest. Accept.
zones: raw.zones ? normalize {code,label,n} : from facets zone with labels from gloss.
no_location: raw.no_location ?? (facets zone special values? skip → undefined).
other_location: raw.other_location ?? undefined.
operator_rows: raw.operator_rows ? {o,n} : facets.operator top 14.
opCount: raw.operators ?? facets.operator.length.
swarm: raw.swarm ? {t,n} : facets.tail top 8. swarm_total: raw.swarm_total ?? tails length.
crew: raw.crew ? filter label non-empty : facets.crew with gloss labels.
crew_reports: raw.crew_reports ?? (crew sum? no — crew_reports is distinct count of reports with any crew action; if absent, sum crew n? crew rows may overlap per report? Assume sum≈; but crew codes are single-valued presumably → sum works as approximation; mark note? I'll use raw if present else sum.)
lines: raw.lines (array of strings or objects). specimen: raw.specimen.
leave_one_out: raw.leave_one_out.
refused: raw.refused || raw.unresolved (array/object non-empty) → frame state.
```

Also CORPUS total for the rest sentence: at rest total = corpus (facets.range.total with no filters = corpus total). ✓.

GLOSS init: 
```
function glossInit(g){
  GLOSS={};
  if(!g) return;
  const eat=(name,obj)=>{ if(!obj)return; const m=new Map();
    if(Array.isArray(obj)) obj.forEach(x=>{ const c=String(x.code??x.value??x.key??""), l=x.label??x.name??x.title??x.text; if(c) m.set(c,String(l??c)); });
    else Object.entries(obj).forEach(([c,l])=>m.set(String(c), typeof l==="string"?l:(l&&(l.label||l.name))||c));
    if(m.size) GLOSS[name.toLowerCase()]=m; };
  if(Array.isArray(g)) g.forEach(t=>eat(t.table||t.name||t.id, t.entries||t.rows||t.values||t.codes));
  else Object.entries(g).forEach(([k,v])=>{ if(v&&(v.entries||v.rows||v.values)) eat(k,v.entries||v.rows||v.values); else if(typeof v==="object") eat(k,v); });
}
function gLook(names,code){ for(const nm of names){ const m=GLOSS[nm]; if(m&&m.has(String(code))) return m.get(String(code)); } return null; }
```

zoneLabel(code): gLook(["part_location","zone","zones","location"],code) || "ZONE "+code.
crewLabel(code): from hero crew rows first, else gLook(["precautionary","precaution","crew","precautionary_procedure"]).
jascLabel similar ["jasc","jasc_code","system"].
opName(o): rows have label? facets operator entries may have label; else GLOSS operator; else String(o).

Now rendering functions. drawInstrument(rootEl, rail, data):

```
function drawInstrument(rootEl, rail, data){
  ROOT=rootEl; RAIL=RAILS.some(r=>r[0]===rail)?rail:"when";
  HERO=data||null;
  if(!rootEl) return;
  if(REFUSED or !data with total undefined) { drawFrame(); bind(); return; }
  computeRanges(); pushMargins();
  rootEl.className="instrument-host";
  rootEl.innerHTML = ipadHTML();
  renderRail(); // fill open rail body
  renderMargin(); aimReset(); bindOnce? 
}
```

I'll separate static delegation (bound once at boot) vs per-render DOM work (axis ticks, scroll right, roving).

Rails list:
```
const RAILS=[
 ["when","WHEN","month by month", drawn: from,to],
 ["where","WHERE","on the aircraft"],
 ["whose","WHO","airline and tail"],
 ["forced","FORCED","what the crew did"],
];
```

ipadHTML():
- head: stamp: `FAA SERVICE DIFFICULTY REPORTS · {pretty(RANGE.from)} TO {pretty(RANGE.to).toUpperCase()}` — actually stampRange: "1 MAR 1995 TO 20 AUG 2025" mono caps.
- picker tabs.
- sentence.
- chips (if any filter).
- aim line div#aimLine.
- aimat block (select, input, take button, day).
- hand line per open rail.
- zero block if total===0.
- rails container: four sections; each closed shows rest gutter+strip; open one gets full body.
- specimen if lines.
- margin.
- seam if destination table exists.

renderRail(open): builds body per rail:

WHEN body:
```
<div class="track"><div class="scrollw">
 <div class="months" id="months" role="listbox"? 
```
Hmm months: group of buttons with aria-label per month. Use role="application"? Keep simple: each .mo is <button type="button" tabindex="-1" aria-label="April 1995, 12,004 reports in selection of 20,112" data-aim="month|m"> with inner i/u.
Axis below.
Closed when rail: `<div class="strip"><span style="flex:1"></span></div>` + if from/to: gutter val shows "Mar 2022 – Aug 2022" rust. Closed click → setRail("when").

Note: closed rails clickable: whole .rail (not open) is a button? Use onclick on the section: setRail. But it contains no interactive children when closed (except strip). Add cursor:pointer, aria: make the gutter a <button class="gutrest">? I'll wrap closed gutter content in a button for a11y: `<button class="restbtn">WHEN · month by month</button>` plus strip div also clickable (same handler). Fine: put onclick on section, and keyboard: the inner button.

WHERE body:
```
<div class="track two">
  <div class="draw">
    <svg viewBox="0 0 760 240" class="ac" role="group" aria-label="Aircraft zones">
      <g> far wing path (zone 600) </g>
      fin, stab (400)
      fuselage 4 clipped zones
      hull outline
      near wing (500)
      nacelle (800)
      gear (900)
    </svg>
    <div class="zonenote">{unplaced notes: no location, words-not-zones, remainder}</div>
  </div>
  <div class="zl">
    rows for zones sorted desc: swatch(bg=ramp(f)) label count, data-aim data-take zone|code, tabindex 0, role button? use <button>.
    taken row class.
  </div>
</div>
```
The SVG paths: each zone path gets class "zone", data-aim="zone|100" data-take="zone|100", tabindex="0", aria-label "ZONE 100, nose and forward lower fuselage, N reports". Fill computed. Also `<clipPath id="hullc"><path d=fuselage/></clipPath>` and 4 rects clipped. IDs must be unique-ish — prefix "ac". Since only one instance, fine.

Aircraft paths — finalize coordinates now (viewBox 0 0 760 240):

fuselage:
```
M 46 122
C 56 101, 80 89, 112 88
L 508 88
C 596 90, 668 96, 722 104
C 688 130, 624 150, 528 157
C 500 159, 300 159, 114 158
C 80 157, 56 141, 46 122
Z
```
Wait belly should be fairly straight y≈158 from x≈120 to x≈520 then rise. Let me write belly as: after tail tip (722,104): C 690 128, 640 146, 560 154 then C 480 159, 200 159, 116 158 then C 82 157, 56 142, 46 122 Z. Hmm C commands: `C c1x c1y, c2x c2y, x y`. From (722,104): C 690 126, 640 146, 556 154 → smooth. Then from (556,154): C 470 158.5, 220 159, 116 158? That's one cubic with control points making near-straight. Then C 82 157, 56 142, 46 122. OK. I'll fine-tune mentally: top line at y=88 from 112 to 508; tail region top rises? No — top goes from (508,88) to tail tip (722,104): descending slightly (going down toward tail tip at y=104 — tail tip LOWER than top line ✓ since tail cone tapers to point around mid-height (122)). y=104 is between 88 and 122 ✓.

Fin (400a): `M 596 96 C 616 66, 646 32, 682 16 L 712 16 C 716 46, 719 76, 721 99 Z` — base from (596,96) to (721,99) closing straight — sits within fuselage top (y 88–104 region: at x=596 top≈89? top curve from 508→722 at x=596: y≈90; base y=96 is INSIDE fuselage ✓ hidden base OK but fin drawn BEFORE fuselage → fuselage covers base ✓. Draw fin before fuselage zones.

Far wing (600): `M 322 92 C 372 72, 430 50, 494 36 L 512 33 C 514 40, 515 44, 515 47 C 458 60, 400 76, 448? ` no — simple quad with curve:
`M 324 90 C 380 72, 444 52, 502 38 L 518 42 C 470 60, 412 76, 442 88 Z` messy. Just polygon:
`M 324 90 L 500 36 L 520 40 L 440 90 Z` — tip chord from (500,36) to (520,40) ✓ trailing edge from (520,40) to (440,90) root TE. Root from (324,90) to (440,90) along top edge — covered by fuselage below y≥88.. wait fuselage top is y=88; points at y=90 are inside ✓. The visible part: from y=88 up — the wing pokes above fuselage between roughly x 350–520. Sweeps back ✓. Slight curve: use Q: `M 324 90 Q 400 62 500 36 L 520 40 Q 470 64 440 90 Z` — leading edge curve bows down (concave up?) Q control (400,62): from (324,90) to (500,36) control near line → slight bow. Fine.

Near wing (500): `M 298 148 Q 390 176 476 204 L 496 211 Q 434 214 416 162 Z`? Trailing edge should go from tip TE (496,211) back up-left to root TE (416,162)? Wait root TE should be at the fuselage belly (y≈158) not 162 — 162 is 4 below belly: slightly overlapping fuselage — good (root tucked). But is (416,162) to the LEFT of leading edge at that height? Leading edge Q at x=416: t≈(416-298)/178≈0.663 → y ≈ quad from 148 with control (390,176): y(t) = (1-t)²*148 + 2t(1-t)*176 + t²*204 = 0.1136*148 + 0.447*176 + 0.4396*204 = 16.8+78.7+89.7 = 185.2. So at x≈416, leading edge y≈185. Root TE at (416,162) is ABOVE the leading edge → the polygon self-intersects! Root chord must run from root LE (298,148) to root TE, both near belly y≈150-160, with LE more forward (smaller x). Root: LE (298,150), TE (430,158)? Then leading edge goes (298,150) → tip (476,204): at x=430, LE y≈ 148+ (132/178)*56≈189. Trailing edge from tip TE (496,211) to root TE (430,158): at x=430 y=158 ✓ above LE(189) ✓ so polygon: A(298,150) → LE → B(476,204) → tip → C(496,211) → TE back → D(430,158) → close D→A along belly (from (430,158) to (298,150)) — passes under fuselage belly line y≈158? Belly at y≈158–159, root chord y 150–158 slightly INSIDE fuselage ✓ tucked. Good: wing root overlaps belly, drawn after fuselage → sits on top, looks attached. ✓

Path: `M 298 150 Q 392 178 476 204 L 496 211 Q 462 194 430 158 Z`? Closing from C back to A: `Q 462 194 430 158` then `L 298 150`? Z closes to start. Let me write: `M 298 150 Q 392 178 476 204 L 496 211 Q 460 192 430 158 L 298 150 Z`. Hmm the trailing edge curve Q from (496,211) control (460,192) to (430,158): passes... fine, slight curve. Thickness check at x=450: LE y≈148+? LE at x=450: t=(450-298)/178=0.854 → y=0.0213*150+0.249*178+0.729*204 = 3.2+44.3+148.7=196.2. TE at x=450: curve from (496,211) to (430,158) — parametrize roughly linear: y≈158+ (496-450)/66*(211-158)=158+0.697*53≈195. Thickness ~1?? That's degenerate! TE from (496,211) to (430,158): at x=450, y = 158 + ((450-430)/66)*53 = 158+16=174?? Wait direction: TE goes from tip (496,211) to root (430,158). At x=450 (between 430 and 496): fraction from root = (450-430)/66=0.303 → y = 158 + 0.303*(211-158) = 158+16.1 = 174. LE at x=450 = 196. So LE (196) is BELOW TE (174)?! The wing strip between them y 174–196 at x=450 — OK thickness 22 — but which edge is "leading"? LE at larger y (lower) than TE at same x — because wing sweeps back-down, at a given x the leading edge is the lower-left boundary... In a swept-down wing, moving along x: the strip is bounded above by trailing edge and below by leading edge. Yes! At x=450, upper boundary y=174 (TE), lower y=196 (LE) ✓ thickness 22. At x=350: LE y = 0.764²? t=(350-298)/178=0.292: y=0.501*150+0.413*178+0.0853*204=75.2+73.5+17.4=166.1. TE doesn't reach x<430; upper boundary near root is the closing line D→A from (430,158) to (298,150): at x=350: y=150+ (52/132)*8 ≈ 153.1. Strip y 153–166 ✓ thickness 13. Tip chord (476,204)-(496,211) ✓. 

Wing fill ok. The wing visually: root chord 132px at belly, sweeping to tip at (476–496, 204–211) — down-back ✓ length ~200px. Good.

Engine nacelle: under wing forward: nacelle x 296–388, y 182–222: `M 296 196 C 296 187, 303 182, 314 182 L 372 182 C 384 182, 390 189, 390 201 C 390 213, 384 220, 372 220 L 314 220 C 303 220, 296 215, 296 206 Z` intake ellipse: `<ellipse cx="301" cy="201" rx="4.5" ry="17">` darker. Hmm nacelle top y=182; wing LE at x=340: y≈170? LE t=(340-298)/178=0.236: y=0.583*150+0.361*178+0.0557*204=87.4+64.3+11.4=163. Wing lower boundary at x=340 is LE y=163; nacelle top 182 → gap 19px — pylon connects: pylon quad `M 318 183 L 336 183 L 342 163 L 326 163 Z` — wait pylon should attach under wing: wing at x≈326–342, lower boundary y≈160–165. Pylon top y=163 ✓ overlaps. But visually pylon crosses nothing else ✓. However nacelle at x 296–390 overlaps wing region? Wing at x=370: LE y≈ t=(72/178)=0.404 → y=0.355*150+0.482*178+0.163*204=53.2+85.8+33.3=172.3; nacelle top 182 below ✓. Nacelle bottom y=220, ground at 224? Wheels: nose wheel center (150,190) r11 → bottom 201. Main wheel center (446,206) r12 → bottom 218. Ground line — draw a faint baseline? Original probably no ground line. Skip ground line; gear struts: nose `M 150 158 L 150 182` stroke width 4 + wheel circle. Main: strut from (446,158) to (446,196): but wing occupies (446: TE 174 upper? At x=446 strip y≈173–195) — strut drawn AFTER wing → in front, ok visually as near-side gear. Wheel (446,207) r12. Hmm main gear forward of TE at x=446 is under wing mid — real mains are slightly behind engine, under wing root rear ~x 430-460 ✓ fine.

Wheels: add hub: circle r4 fill paper.

Fin trailing edge to (721,99): fuselage top at x=721 ≈ 103.8; fin base at 99 slightly above top line? Top curve from (508,88) C(596,90)(668,96) to (722,104): at x=700, y≈101. Fin base endpoint (721,99) is ABOVE fuselage top (101)? 99 < 101 means higher ✓ slightly floating. To tuck, extend fin edges down to y=106: fin: `M 594 98 C 614 66, 646 32, 682 16 L 712 16 C 716 48, 720 78, 723 106 Z` base closing line from (723,106) to (594,98) — passes through fuselage interior (top y≈90–104 there... at x=650 top≈93; base line at x=650 y≈101 → below top ✓ inside). Good, fin drawn before fuselage.

Horizontal stab (400): drawn AFTER fuselage: `M 640 112 L 726 122 L 748 132 L 700 136 Z`? Check against tail: fuselage at x=640: belly y≈? Belly curve (722,104) C(690,126)(640,146)(556,154): at x=640, y≈146. Top at x=640 ≈ 95. So fuselage spans 95–146 at x=640. Stab at y 112–136 overlaps fuselage there — should stick out BEHIND tail: tail tip x=722. Stab x from 640 (root, hidden inside fuselage silhouette? It would draw over the fuselage fill — visible as a shape ON the tail cone. Hmm. For side view, the near horizontal stab IS drawn over the tail cone — standard illustrations show the near stab overlapping tail. Yes OK: stab as swept quad from root (640,118) extending back-beyond tail tip to (750,130): `M 642 116 L 736 126 L 752 134 L 668 138 Z`? Let me check it doesn't look weird: trailing point (752,134) beyond tail tip (722,104) — sticks out back-right-down ✓ reads as stab. And bottom edge from (752,134) back to (668,138) then close to (642,116). Hmm shape: quad (642,116),(736,126),(752,134),(668,138): LE from (642,116) to (736,126); tip (736,126)-(752,134); TE (752,134)-(668,138); root (668,138)-(642,116). Plausible swept stab pointing back-down. ✓ 

But wait, stab drawn after fuselage with fill = ramp(400 count) — the same fill as fin. Both zones labeled 400 ✓. Their outline stroke ink.

Also draw engine BEFORE near wing? Pylon attaches to wing — draw nacelle+pylon first, then wing over pylon top? Pylon top tucked under wing: draw pylon then wing → wing covers pylon top edge ✓. Order: far wing → fin → stab? stab after fuselage. Order list:
1. far wing 600
2. fin 400
3. fuselage zones (100,200,300,700) via clip
4. hull outline
5. stab 400 (over tail cone)
6. near wing 500
7. pylon+nacelle 800 (pylon under wing? pylon drawn AFTER wing would overlay wing... pylon top must tuck UNDER wing → draw pylon BEFORE wing. But nacelle after? Nacelle doesn't overlap wing. Draw group: pylon, nacelle, then wing covers pylon top — but wing already drawn... Reorder: pylon (before wing) then wing then nacelle. Pylon y top 163 → wing lower boundary at x 326–342 ≈ y 161–166 covers pylon top ✓.
8. gear 900 (front-most).

Hmm wait — also far wing drawn first gets covered by fuselage where overlapping (root) ✓ visible part above fuselage ✓.

Zone fills where zones have zero count but corpus has counts? The ramp uses selection counts (n) over max selection zone count — at rest n = corpus counts ✓ shading meaningful at rest. With a selection, relative shading across zones ✓. If hero.zones missing → use facets zone counts as n. mx = max(1, max n). f = 0.10+0.80*n/mx. fill = mix(#e2dac6, #a8431f, f)? At f=0.10: light warm gray ✓ at rest low zones pale. Note: at rest, min zone might be ~0 → palest; max → strong rust. Nice.

Zero-count zone: f=0.10 → pale — but must not "imply zero" falsely when it's actually unknown/unsampled? Counts are real. OK. Zones not in data at all (missing key): treat n=0.

Unplaced note text: 
```
const placed=sum zones n; const unNo=d.no_location, unOth=d.other_location;
parts: `${num(unNo)} reports say nothing about where on the aircraft it was` (unNo>0)
`${num(unOth)} name the place in words, not as a zone number`
remaining = total - placed - unNo - unOth (if all known and >0): `${num(rem)} are counted but not placed at all`
join: "Neither kind can be drawn on the aircraft." — write as: 
`<span class="f">The drawing places ${num(placed)} of ${num(total)} findings. ${clauses}</span>`
```
Wait "in the same size type as everything else" ✓ 12px.

Legend rows clickable; the two pads NOT clickable but have aim text (data-aim="pad|nowhere" — my aimTextFor handles pad). 

WHOSE body:
```
<div class="track two">
  <div class="ladcol">
    <div class="lhead">Airlines · ${num(opCount)} in the file</div>
    rows top 14 operator
    <div class="lmore">the tail of the list is not ranked here; aim at an airline by name above</div>? 
  </div>
  <div class="ladcol">
    <div class="lhead">Aircraft · most reported</div>
    rows top 8 tails
  </div>
</div>
```
Row: `<button class="lrow" data-aim="operator|k" data-take="operator|k"><span class="lb">name</span><span class="bar"><i style="width:x%"></i></span><b class="ct">12,004</b></button>`.
If current param operator==k: class "taken". If taken operator not in top rows: prepend pinned row with note "(your selection)". Same for tail.

Data fallback: operator_rows → facets.operator [{value,n,label}] top 14 sorted desc (assume facets sorted; sort anyway). label: e.label || gLook(["operator","airline","carrier"]) || value. opName cached.

Forced body:
```
<div class="fblock" data-aim="crewall">
  <div class="big"><i style="width:%"></i></div>
  <div class="fcap">${num(crew_reports)} of ${num(total)} reports forced the crew to act</div>
</div>
<div class="ladder">rows crew (exclude codes with no label? include all, label fallback "code "+code; exclude ["K","0","O"]? The original excluded those on phone (K = ? maybe non-actions). I'll include all rows but sort desc, cap 12, if more: quiet note.
```
crew rows: label from d.crew or gloss. n bar. data-take crew|code.

Now margins computation each render:
```
MARGINS=[];
if(partialLastMonth) push({id:"part", warn:true, text:`${MONTHS[mm]} ${yy} covers 1 to ${dd} ${MON3}, so its bar counts ${dd} days against ${inMonth} in a whole one`})
if(swarm_total>swarm.length) push({id:"swarmcap", text:`the aircraft ladder shows the ${num(len)} most-reported airframes out of ${num(total)}; the airline ladder counts every report`})
push({id:"basis", text:"counts are of reports filed, not of flights"})
blind = blindKeys(); if(blind.length) push({id:"blind", text:`no rail draws ${list}; it lives in the link above and on the chips`})
```
Wait "in the link above" — chips row is above rails ✓. Phrase: `no rail draws ${list}; that part of the selection is on the chips above and in the page address`.

renderMargin: if none → hide.

Aim system:
```
function aim(html){ const a=el("aimLine"); if(a) a.innerHTML=html||""; }
function unaim(){ aim("") }
function aimHold(html){ aim(html) } // same slot; persists until next aim/unaim — original had hold until change. I'll keep until next hover or render.
```
Delegation (bound once):
- mouseover [data-aim] → aim(aimTextFor)
- focusin [data-aim] → aim
- mouseout [data-aim] → unaim
- click [data-take] → takeFor
- click .clause[data-drop] chips → drop
keydown for months & take elements.
pointer drag for months strip.
scroll → clear pill.

aimTextFor(spec):
- month|m: `${monthName} · ${num(n)} of ${num(all)} reports · drag or click to take` — original: "click to narrow to this month" (drag covers ranges). Use: `${monthName(m)} · ${num(n)} reports · click to take one month, drag for a period`.
- zone|code: `${zoneLabel(code)} · ${num(n)} of ${num(placed)} placed findings · click to keep only this zone`
- pad|nowhere / pad|outside: as original phrasing.
- operator: `${opName} · ${num(n)} reports · click to follow this airline`
- tail: `N${tail} · ${num(n)} reports · click to follow this one airframe`
- crew|code: `${label} · ${num(n)} reports · click to keep only this`
- crewall: `${num(crew_reports)} of ${num(total)} reports forced the crew to act`
- railclosures for closed rails? hovering closed rail: aim "open WHEN — month by month". Add data-aim on closed gutter: aim text `open the ${q} rail — ${pn}`. Eh, buttons labeled fine; skip.

takeFor(spec): switch kind:
- month → monthTake(m) (single month period)
- zone → setFilter("zone", code) with hold message `${label} — kept only what was found in zone ${code}. undo`
- operator/tail/crew similarly.
Hold messages include `<button class="undoit" data-undo>undo</button>` — click → history.back() (popstate → refresh). Implement undoit click delegation: `if(t.closest(".undoit")){history.back();return}`.

setFilter(k,v): params → if v set else delete; pushHistory; refresh().

refresh(): token guard:
```
let SEQ=0;
async function refresh(){
  const mine=++SEQ;
  setBusy(true);
  try{
    const [f,h]=await Promise.all([api("facets"),api("hero?hero="+RAIL)]);
    if(mine!==SEQ)return;
    FACETS=f; composeHero(h);
    drawInstrument(ROOT,RAIL,HERO);
  }catch(e){ if(mine===SEQ) drawFault(e); }
  finally{ if(mine===SEQ) setBusy(false) }
}
```

Rail switch: setRail(r): RAIL=r; pushState? Rail choice in URL as ?hero=rail (original had hero param). I'll include hero param in URL: params().get("hero"). On setRail: update URL (replaceState? push — so back returns to previous rail ✓ push). refresh().

popstate → read params, RAIL=..., refresh() (no push).

Boot:
```
async function boot(){
  ROOT=el("hero-root"); if(!ROOT) return;
  bindGlobal();
  RAIL=(new URLSearchParams(location.search).get("hero")||"when");
  drawInstrument(ROOT, RAIL, null); // frame with "Reading the file…" ? The original had no-data frame for refused; for loading I'll render frame with "Opening the file…" then refresh replaces.
  await refresh();
}
boot();
```
Hmm drawInstrument(root,rail,data) with data null → frame state "reading the file…". That doubles as loading ✓.

frame state HTML:
```
ipad with stamp + sentence ("Reading the file…" / refused text) + rails closed ash strips (RAILS map, like original's refused frame) 
```
Refused detection: HERO && (HERO.refused || (HERO.unresolved&&len)) → frame with the honest sentence: "One value in this link is not in this data, so no search was run. There is no number on this page to quote." + strips with gutter text "all N, not your query"? Original: gutter(r, refused?"all "+num(TOTAL)+", not your query":"",false). Keep similar: gutter val shows `all ${num(TOTAL)}, not your query` rust. TOTAL from facets? If refused, facets may still give corpus total — use FACETS range total.

Fault state (fetch error): frame + sentence "The file did not answer just now." + a retry ghost button (onclick refresh()).

Zero state: total===0 && hero ok → sentence "0 reports." → zero block with drop suggestions:
```
candidates = HERO.leave_one_out?.slice(0,3) → buttons `Drop ${LABEL[drop]} → ${num(would_give)} reports`
else active filter keys (non-date?) each → `Drop ${LABEL[k]}`.
```
Plus margin note: "an empty file is an answer; zero here means no report matches all of these at once, not that nothing happened" — maybe skip, zero block covers.

Sentence when total 0: "Nothing matches all of these at once." as sentence? Original sentence showed count? Keep sentence: `0 reports match. <span class=s2>…</span>` plus zero block. I'll make sentence: `No report matches all of these at once.` and zero block offers drops. But leave num(0) visible? "There is no number to quote" discipline applies to refused; zero is a real 0. Sentence: "0 reports match everything at once." then zero block. OK.

Chips: for each active filter k: `<span class="chip" data-aim="chip|k"><span class="cl">${LABEL[k]}</span> ${clauseText(k,v)} <b data-drop="${k}" title="drop">×</b></span>`. clauseText uses glossary/values (zone→zoneLabel, crew→crewLabel, operator→opName, jasc→jascLabel, from/to→pretty dates, q→“…”). Also a chip for hero param? No — hero is not a filter.

Aim-at implementation (trimmed but real):

```
const AIMKINDS=[["period","a month or year"],["operator","an airline"],["tail","a tail number"],["zone","a zone"],["jasc","a system code"],["","free text"]];
```
select#aimKind, input#aimAt (role combobox, aria-controls aimSug, aria-expanded), button Take it, date input or one day.
- input event (debounce 220ms): v.len>=2 → sugFetch(v): if kind==="" → api("api/vocab?q=...")? vocab endpoint not in list! Endpoints: hero, facets, trend, breakdown, glossary. No resolve/vocab listed. The original used api/resolve and api/vocab — but the DATA section here lists only five endpoints. So resolve/vocab may not exist. Then the Aim at box can only work locally: build targets from available data: aimTargets() from HERO (months, zones, crew, operator_rows, swarm) — the original had aimTargets() for the datalist! And for free text — no endpoint to resolve... but q as a filter param works server-side (any filter narrows) — so free text: just set q=v and refetch — the count that comes back IS the answer ("no report says this" shows as zero + zero block). 

So Aim at, local edition:
- suggestions from aimTargets() (label, kind, take, n) filtered by substring; grouped by KINDLAB; keyboard nav; Enter/mousedown takes via takeFor(take) (all takes are rail takes!). period targets: month → takeFor("month|m") sets from/to ✓ so "period" kind = months.
- free text: kind "" → no suggestions (or suggest q? skip) → Take it: setFilter("q", v) with hold `searched the write-ups for “v”`. If result 0, zero block offers drops ✓ honest.
- other kinds typed text not in list: on Take: try match targets by exact/case-insensitive; if none: aim(`no ${kindlab} called “v” is ranked here...`) hmm for operator/tail we only have top rows; a reporter typing "UAL" or full tail not in top-8 — the original resolved via API. Without resolve API, I should still attempt: setFilter directly (operator=RAW) and let the server decide — if zero, zero block + chips allow undo ✓ THAT is honest operability: take the text as the filter and show what comes back. For tail: uppercase strip N prefix. For zone/jasc: only take if in targets/gloss, else message. For operator/tail: pass through as filter with hold message "took UAL as the airline — 0 reports means none in this file" — hmm but hold message claims success before count known. Better: after refresh, if total===0 the zero block speaks. The hold: `took “X” as an airline.` fine.
- period kind: parse "August 2025" / "2025" / "aug 2025"? Local parse: match month names + year; or 4-digit year → from Jan 01 to Dec 31 (clamped to RANGE); "2025-08" etc. Also bare month name → most recent occurrence? Ambiguous — message asking for year? I'll accept month+year or year; month alone → latest year containing that month within RANGE. Implement parsePeriod(v) returning {lo,hi,label} or null.

This keeps the typed route real without inventing endpoints. Also keep datalist? I'll use my own suggestion box (role listbox) — richer.

Keyboard nav in suggestions: as original (SUGI, ArrowUp/Down, Enter takes, Escape closes). mousedown on .sug takes. Click outside closes.

One-day input: change → set from=to=day, push, refresh, hold `took ${pretty(d)}, one day. undo`.

Now the when-drag & keyboard:

```
function monthIdxFromEvent(ev){
  const wrap=el("months"); if(!wrap) return -1;
  const r=wrap.getBoundingClientRect();
  const N=(HERO.months||[]).length; if(!N) return -1;
  const x=Math.min(Math.max(ev.clientX-r.left+wrap.scrollLeft? 
```
wait — wrap has the flex; the SCROLL container is .track (overflow auto). months width = content. Use track: `const track=el("whenTrack")` with overflow-x. x = clientX - trackRect.left + track.scrollLeft; contentW = track.scrollWidth; idx = clamp(floor(x/(contentW/N)),0,N-1). ✓

Drag state DRAG={a:idx}; pointerdown on months (track): e.preventDefault (avoid text select), capture on track, DRAG, paintBand(a,a). move: idx → paintBand. up: lo/hi indices → monthsTake(lo,hi) — coarse: pill. cancel: clear.

paintBand(i,j): clear .inband; mark; aim(`${monthName(lo)} to ${monthName(hi)} · ${num(sumN)} reports · release to take it`).

monthsTake(i,j): lo=min m, hi=max m; from=lo-01, to=hi-lastday; pushURL; refresh; hold `narrowed to X to Y. undo` — wait same month: `narrowed to April 1998.` else `narrowed to April 1998 to July 1998.`.

Keyboard: container#months keydown (delegated): target .mo or container. Implement:
```
document keydown: if(e.target.closest("#months")){
  const mos=[...el("months").querySelectorAll(".mo")];
  let i=mos.indexOf(e.target);
  if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
    e.preventDefault();
    if(i<0)i=mos.length-1;
    const j= key==='ArrowLeft'?Math.max(0,i-1): ArrowRight? Math.min(len-1,i+1): Home?0:len-1;
    if(e.shiftKey&&ANCHOR==null)ANCHOR=i; if(!e.shiftKey)ANCHOR=null;
    mos[j].focus(); paintBand(anchorIdx,j);
  } else if(e.key==="Enter"||e.key===" "){
    e.preventDefault(); if(i<0)i=mos.length-1;
    if(ANCHOR!=null){ monthsTake(ANCHOR,i); ANCHOR=null; } else monthsTake(i,i);
  }
}
```
focusin on .mo: set tabindex roving + aim text. rove: on focus: previous tabindex-0 → -1; this → 0.

For [data-take] Enter: my generic click delegation handles click; keyboard Enter on button fires click naturally ✓ no extra needed (buttons). SVG paths with tabindex: Enter doesn't fire click — add keydown: if(e.key Enter/Space && target.matches(".zone")) takeFor. ✓

Closed rail open: click delegation: `const r=e.target.closest(".rail:not(.open)")` → setRail(r.dataset.rail). Also its inner button.

Picker: click → setRail.

Now composeHero details:

```
function composeHero(raw){
  raw=raw||{};
  HERO={};
  HERO.refused = !!(raw.refused || (raw.unresolved&&(Array.isArray(raw.unresolved)?raw.unresolved.length:Object.keys(raw.unresolved).length)));
  const fr=RANGE_TOT from FACETS;
  RANGE = {from: raw.range?.from || fr.from || "", to: raw.range?.to || fr.to || ""};
  TOTAL = pickN(raw.total, fr.total);
  // months
  let ms = normMonths(raw.months);
  const tr = TREND (fetched once per corpus state — but trend endpoint with filters returns narrowed? "api/trend [{month,n}] every month" — every month = corpus-wide; with filters appended it might narrow; I call api() which appends filters — if it narrows, then trend rows = selection per month = n! and all unknown. Hmm. I need both all (corpus) and n (selection). Fetch trend TWICE: once without filters (corpus all) at boot, cached; per refresh: trend WITH filters → n by month. That's clean!
```
Yes: TREND_ALL cached at boot (no filters — call fetch directly with no filter params). Per refresh: TREND_SEL = api("trend") with filters → per-month selection counts. Then months = merge(TREND_ALL, TREND_SEL): m, all, n. If hero.months provided use it, else merged. 

But careful: trend without filters = whole corpus 380 months ✓. TREND_SEL with date filters → only months in window? Server may return all months with zeros or only window — merge by m, missing → 0. But if other filters active, months outside window are 0 anyway. ✓ n missing → 0.

Hmm wait: if hero endpoint already gives months with n and all, use directly. I'll prefer raw.months when present.

zones: raw.zones || from FACETS zone facet. labels: gloss or raw. Also include zero-count zones from the fixed 9 list so the drawing never has a "missing implies nothing" zone: ensure all 9 codes present: ZONES = [100..900].map(code => existing || {code,label:zoneLabel(code),n:0}).

no_location/other_location: raw fields else undefined.

operator_rows: raw.operator_rows || FACETS.operator sorted desc slice 14 (keep full count opCount=facets length or raw.operators).
swarm: raw.swarm || FACETS.tail sorted slice 8; swarm_total raw.swarm_total || FACETS.tail length.
crew: raw.crew (filter out empty labels? keep all with n>0) || FACETS.crew w/ gloss labels.
crew_reports: pickN(raw.crew_reports, sum crew n? — no: sum of crew n counts reports having crew action rows... approx; use raw only; if absent but crew present, sum. note? skip note.)
lines: raw.lines (array of strings or objects). specimen: raw.specimen.
leave_one_out: raw.leave_one_out.

Also raw.corpus for CORPUS total.

Now — the refused state: if HERO.refused → frame. TOTAL for frame = corpus total (TREND_ALL sum or facets range total — facets with filters might error? If a param value is invalid, facets may still respond with corpus. I'll use cached CORPUS from boot's trend sum.)

At boot, before any filters, CORPUS = facets total (no filters) — store. Frame uses CORPUS.

The seam: rendered only when `document.querySelector("table.reports")` exists (checked at render time). goResults(): scroll to it smoothly (offset 58).

Busy: `.ipad.busy{opacity:.55}` transition.

Now write sentenceHTML():
```
function sentenceHTML(){
  const p=params(); const cls=[];
  if(p.get("from")||p.get("to")) cls.push(periodClause());
  if(q) cls.push(`mentioning ${q}`)
  operator: `filed by ${opName(v)}`
  tail: `on airframe N${v}`
  zone: `found in ${zoneLabel(v).toLowerCase()}`
  crew: `where the crew had to ${crewLabel(v).toLowerCase()}`? crew labels like "SHUT DOWN ENGINE" — "where the crew ${label.toLowerCase()}" might read odd for some labels; use `where the crew action was ${label}`? Keep simple: `where the crew ${label.toLowerCase()}`.
  jasc: `coded ${v} — ${jascLabel(v)}`? "in ATA"? jasc label: `with system code ${v}`
  others: `${LABEL[k]} ${v}` — part: `on part ${v}`, condition `with condition ${v}`... I'll have a per-key template map with fallback `${LABEL[k]}: ${v}`.
  const base = TOTAL===0 ? `No report matches.` : `Reading ${num(TOTAL)} report${TOTAL===1?"":"s"}.`;
  return `<b>${esc?}` hmm b holds the number in rust. Compose: `<span class="cnum">${num(TOTAL)}</span> reports` — sentence serif with count in rust-text.
  Actually: if no clauses: `Reading ${num(TOTAL)} reports.` else `${num(TOTAL)} reports — ${clauses.join(", ")}.` with count wrapped span.
}
```
Style: `.sentence .cn{color:var(--rust-text)}`.

periodClause(): from&to: if same day → `on ${pretty(from)}`; if same month → `in ${monthName(from.slice(0,7))}`; else `filed ${pretty(from)} to ${pretty(to)}`.

Hand lines:
```
const HAND={
 when:"Drag across the months to take a period.",
 where:"Click a zone on the aircraft to keep only what was found there.",
 whose:"Click an airline or an airframe to follow it.",
 forced:"Click what the crew had to do."};
kbd line: "Keyboard: tab to a rail, arrows walk the months, Shift and an arrow extends, Enter takes it."
plus: coarse: "Touch: tap a mark to see it, tap again to take it."
```

Aim text on closed strips? skip.

CSS for .mo u rust: `#a8431f`. But "rust reserved for selection": at rest n==all → no u → strip fully ash pale... but then at rest the when strip shows pale bars (corpus) ✓ and the moment you filter, rust overlays ✓. Also the taken zone stroke rust ✓, taken ladder row rust bar ✓.

Closed strips: `.strip{height:14px;background:#e0d8c4;display:flex;overflow:hidden}` span flex 1; if that dimension filtered → inner span rust: I'll render `<span style="flex:1"></span>` and when filtered add `<span class="held" style="flex:X"></span>`? Original just ash strip; the gutter val shows the taken value in rust. Keep: strip plain; gutter val rust text. ✓ But "rust is reserved for a chosen selection... the reporter can see there is nothing selected" — the val shows it. Good.

Gutter (open): 
```
<div class="gut">
  <div class="q">WHEN</div>
  <div class="pn">month by month</div>
  <div class="val">${heldValue or ""}</div>
</div>
```
heldValue: when: "Mar 2022 – Aug 2022"; where: zone label; whose: operator/tail; forced: crew label. rust color, mono 10.5px, ellipsis.

Aircraft SVG — also add `<title>` inside each zone path for native tooltip? aria-label suffices; add <title> cheap: include.

Also zone paths: `pointer-events:all`? fills have pointer events by default ✓ gear struts thin — wheel circles clickable ✓.

Check zone 700 visibility: upper aft fuselage — includes cabin windows area ✓. 300 lower aft ✓. 400 fin+stab ✓. 800 nacelle ✓ (one engine drawn = both? "engines" — drawing one nacelle represents zone 800 ✓ note not needed).

Now — the phone/coarse pill. Implementation:
```
const COARSE=matchMedia("(pointer:coarse)");
let PILL=null, PILLSPEC=null;
function pillFor(spec,txt){
  killPill();
  PILL=document.createElement("button"); PILL.className="phpill"; PILL.type="button";
  PILL.innerHTML=esc? txt+' <span class="go">take it →</span>';
  PILL.onclick=()=>{ killPill(); takeFor(spec); };
  document.body.appendChild(PILL); PILLSPEC=spec;
}
scroll listener killPill.
```
Trigger points: generic click handler on [data-take]: if COARSE.matches → pillFor instead of takeFor (return). Months pointerup: if COARSE → pillFor("month|"+m, aimtext). Keyboard never pill.

Careful: pill button itself must not be caught by the [data-take] delegation (it isn't). Also the click that spawns pill — subsequent click on same element would re-spawn; fine.

But wait: on coarse, click on ladder rows → pill ✓ second tap on pill takes ✓. Zones same ✓.

Drag on touch: months strip touch-action:none prevents scroll while dragging — on phone that blocks vertical scroll when starting on months! Original set touch-action:none on desktop selector `.rail.open[data-rail=when] .months` (not phone since phone used tap-tap). Mine: only set touch-action:none when NOT coarse: via matchMedia in JS adding class, or CSS `@media (pointer:fine){ .months{touch-action:none} }` ✓ do that in CSS.

popstate: window.addEventListener("popstate",()=>{ RAIL=params().get("hero")||RAIL; refresh(false) }).

resize: debounce → if open rail is when: recompute axis ticks (percent-based, actually no need) — skip mostly; CSS handles. I'll still re-run axis tick density? Percent positions don't change with width; density threshold does. Minor: recompute on resize debounced 180ms → axisTicks(). OK include.

showChange? Not needed.

Undo button: `<button class="undoit">undo</button>` inside aim; delegation: click .undoit → history.back(). Since each take pushed state, back returns prior URL → popstate → refresh ✓. Edge: if user took multiple steps, back undoes one ✓.

Also initial load: replaceState to normalize? Leave URL as-is; reads params.

Let me also handle `minhours` etc. in chips: LABEL map includes them.

blindKeys(): FILTER_KEYS minus drawn keys [from,to,zone,operator,tail,crew] present in params.

Now count output size: CSS ~350 lines, JS ~700+ lines. That's fine.

Let me make sure of one more requirement: "defining and calling drawInstrument(rootEl, rail, data) and rendering into an element with id 'hero-root'". So the function must exist with exactly that signature and be CALLED (at least once) with data. My boot calls drawInstrument(ROOT, RAIL, HERO) after fetch ✓ and also once with null for the loading frame — is calling with null data violating? It renders a frame; acceptable and useful. Hmm — "calling drawInstrument(rootEl, rail, data)" — I'll ensure the boot path calls it properly with fetched data. Also expose window.drawInstrument = drawInstrument (so host can call it). ✓

Also: "No prose before or after, no explanation. Code only." — output ONLY the style+script blocks. Comments inside code are fine (and in the original's voice — lowercase, reasoned). The instruction says code only; comments are part of code. I'll include meaningful comments in the original's disciplined voice but mine.

Also — the instrument must include the aim line default? Original `.aim` empty. Keep empty min-height.

Double-check rail closed click vs data-take inside: closed rails contain no takes ✓.

One more: months strip needs aria-label on container: role="group" aria-label="Months, 1995 to 2025".

Partial month: last month if RANGE.to day < last day of that month → class part + margin. Compute: to = params from? RANGE.to (corpus coverage to). partialMonth(m): m === RANGE.to?.slice(0,7) && +day < lastDay. Only mark if m is the to-month. ✓

Also when-strip scroll start: after render, track.scrollLeft = track.scrollWidth ✓.

Zero reports + when rail: months n=0 everywhere → strip shows all pale bars (corpus) with no rust ✓ good, shows "nothing here" honestly.

Whose at zero: operator facets may be empty → ladders empty → show note "no airline and no airframe survives this selection" instead of empty boxes ✓ IMPORTANT rule (never imply zero with empty). Add per-ladder empty note. Where legend zero counts visible with numbers 0 ✓. When: bars all pale ✓.

Specimen at zero: hero.lines likely absent → skip ✓.

Now, glossary lookup for operator names — facets operator facet values might be codes; labels included presumably. Fine.

Aircraft SVG final check — let me re-verify the fin vs far-wing overlap: far wing tip x 500–520 y 33–47; fin starts x 594 ✓ gap ok.

Nacelle x 296–390 y 182–220; near wing at x 296–390: lower boundary (LE) y≈150–175... at x=390: t=(92/178)=0.517 → LE y=0.233*150+0.499*178+0.267*204=35+88.8+54.5=178.3. Nacelle top 182 → clears by 3.7 ✓. Pylon x 318–342 top y 163: wing LE at x=318: t=0.112 → y=0.789*150+0.199*178+0.0126*204 = 118.3+35.4+2.6=156.3; hmm LE at 318 ≈ 156, at 342: t=0.247 → y≈0.568*150+0.372*178+0.061*204=85.2+66.2+12.4=163.8. Wing lower edge ~156–164 across pylon top x-range; pylon top y=163 → covered at x=342 (163.8) but at x=318 wing edge 156 < 163 → pylon top visible below wing edge by 7px — gap! Set pylon top y=150 (tucks well under wing interior — wing spans ~150–166 at x 318). Pylon: M 318 184 L 336 184 L 344 150 L 324 150 Z → covered by wing ✓ (drawn before wing). ✓

Main gear strut x=446: wing spans y≈173–196 at x=446 — strut from y=196? Strut should emerge from wing underside: strut line from (446,190) to (446,206)?? If drawn after wing, strut over wing from 190 — visually strut in front of wing ✓ fine (near-side gear). Wheel (446,207) r12 → top 195 overlaps wing TE region (196) barely ✓ ok. Hmm actually let me place main gear slightly behind wing TE root: x=452; wheel center (452,206).

Nose gear strut (150,158)-(150,180), wheel (150,190) r11, hub r3.5.

Engine exhaust: skip. Nacelle intake ellipse fill dark ink-ish (#3a3428).

Also add a subtle pylon for... no second engine (only one drawn; fine, it's a glyph).

Wing 600 far — visible sliver between y 33–88 x~350–520: looks like a wing above fuselage — good enough with label in legend "ZONE 600 — right wing (the far one)". Legend labels come from glossary; append "(far side)"? Leave gloss label.

Zone label descriptions (fallback if no glossary): 
100 "nose and forward lower fuselage"
200 "forward upper fuselage"
300 "aft lower fuselage"
400 "tail: fin and stabilizers"
500 "left wing — near side"
600 "right wing — far side"
700 "aft upper fuselage, cabin"
800 "engines and pylons"
900 "landing gear"
Used for aria-labels + fallback legend. If glossary provides, use gloss but maybe still keep my descriptive fallback when gloss missing.

Wait — should legend show glossary label or my descriptive? Gloss authoritative; use gloss ?? descriptive; prefix "ZONE n".

Title/aria on zones: `ZONE 100 — nose and forward lower fuselage — 12,004 reports`.

Edge: SVG zone click → also generic mousedown? fine.

Now the aim-at select options & parsePeriod:

```
function parsePeriod(v){
  v=v.trim().toLowerCase();
  let m;
  if(m=v.match(/^(\d{4})$/)) return {lo:`${m[1]}-01-01`, hi:`${m[1]}-12-31`, label:m[1]};
  if(m=v.match(/^(\d{4})-(\d{1,2})$/)){ const y=m[1],mo=+m[2]; if(mo<1||mo>12)return null;
    return {lo:`${y}-${pad(mo)}-01`, hi:`${y}-${pad(mo)}-${lastDay(y,mo)}`, label:`${MONTHS[mo]} ${y}`}; }
  const my=v.match(/^([a-z]{3,9})\.?\s*,?\s*(\d{4})$/);
  const mi=MONTH_KEYS index...
  month alone: find all months in TREND_ALL with that name → take latest year → lo/hi that month.
}
```
clamp to RANGE like original takeReading ✓ (only when overlapping; else leave as asked → zero result honest).

takeReading equivalent: `aimTake(o)`: switch o.kind: period → set from/to (clamped), push, refresh, hold; operator/tail/zone/crew → setFilter. Free text: q.

Suggestion targets: from HERO months (kind period, label monthName, take month|m, n), zones, crew, operator rows (all? only top 14 — aim box for operators limited to ranked ones; note in sughead? The original had 309 operators via API. Mine limited: if user types unmatched operator, "Take it" passes it through as filter anyway ✓ covers the rest.)

Filter matching: label.toLowerCase().includes(query) — cap 40 results grouped. Order groups: period, operator, tail, zone, jasc? No jasc targets (no data) — jasc kind: no local targets; typing 3230 + Take → setFilter("jasc","3230") pass-through ✓ (message if zero comes from zero block). Same zone pass-through.

aria: input role combobox expanded state, listbox with options (role option, aria-selected). Keep as original-ish.

Now also "hand" for coarse: swap kbd text via CSS media (pointer:coarse) show touch line instead: render both spans with classes .kb-fine/.kb-coarse and CSS display toggling ✓ neat.

Also add `aria-live="polite"` on aim line (announcements) ✓ and on sentence? aim is the announcer.

ROVE: months tabindex: I'll give first render tabindex="0" to the LAST month; focusin handler moves it. Others -1.

Let me write the aircraft paths as JS constants (cleaner to inject + reuse) — define once:

```
const AC={
 hull:"M46 122 C56 101 80 89 112 88 L508 88 C596 90 668 96 722 104 C690 128 640 146 556 154 C470 158 220 159 116 158 C82 157 56 142 46 122 Z",
 fin:"M594 98 C614 66 646 32 682 16 L712 16 C716 48 720 78 723 106 Z",
 fw:"M324 90 Q400 62 500 36 L520 40 Q470 64 440 90 Z",
 nw:"M298 150 Q392 178 476 204 L496 211 Q460 192 430 158 L298 150 Z",
 stab:"M642 116 L736 126 L752 134 L668 138 Z",
 pylon:"M318 184 L336 184 L344 150 L324 150 Z",
 nac:"M296 196 C296 187 303 182 314 182 L372 182 C384 182 390 189 390 201 C390 213 384 220 372 220 L314 220 C303 220 296 215 296 206 Z",
};
```
Wait hull belly: from tail tip (722,104) I wrote C690 128 640 146 556 154 — one cubic to (556,154) ✓ then C470 158 220 159 116 158 — hmm that cubic from (556,154) with controls (470,158),(220,159) to (116,158): near-flat ✓ then C82 157 56 142 46 122 to nose tip ✓ close. Top: L508 88 then C596 90 668 96 722 104 ✓.

Check nose: from (46,122) C56 101 80 89 112 88 ✓ rounded nose. Bottom nose C82 157 56 142 46 122 ✓.

Fuselage split x at 340: rects: 200: x46 y60 w294 h63 (y60–123); 100: x46 y123 w294 h60 (123–183 covers to 159+); 700: x340 y60 w384 h63; 300: x340 y123 w384 h60. Clip path = hull.

Gear: 
```
nose strut: <path d="M150 156 L150 181" stroke ink 4>
nose wheel: <circle cx=150 cy=190 r=11>
main strut: <path d="M452 188 L452 208"? 
```
main wheel (452,206) r12, strut from wing (452,192)→(452,206)? Wheel covers 194–218; strut 186–200 mostly hidden behind wheel — draw strut M452 186 L452 202 width 4, then wheel over. ✓

Intake: ellipse cx=302 cy=201 rx=4 ry=17 fill #2e2a20.
Exhaust: small rect at nacelle rear? skip.

Also add wing 500 zone includes... engine belongs 800 ✓ separate.

Wing trailing edge root at (430,158) — wing TE crosses belly line into fuselage slightly ✓ tucked.

Also: does the far wing (600) at x 440–520 y 36–90 overlap fin base (594+)? no ✓. Overlap with hull top curve? hull top y=88 at x≤508 then rises to 104 — far wing root points at y=90 (x 324..440) — hull top at those x = 88 → wing root at 90 is 2px INSIDE hull → covered ✓ visible above 88 only.

Stab (642,116)-(752,134): does it overlap fin TE (down to (723,106))? Stab top edge y≈116–126 below fin base ✓.

Gear wheels vs nacelle: nacelle x 296–390; main wheel x 452 ✓ clear.

One more piece: zone "900" drawing = struts+wheel circles; clicking tiny circles hard — make an invisible wider hit rect over gear area: `<rect x=132 y=150 width=36 height=76 class="zone" fill="transparent">`? But fill transparent with pointer-events fill... set fill="rgba(0,0,0,0)" pointer-events="all". Hmm — but then zone 900 has both hit rect AND wheels; simplest: add transparent hit path for 900 covering both gear: `M136 152 h28 v72 h-28 Z` and `M436 152 h30 v72 h-30 Z` two rects, both data-take zone|900, fill transparent. The visible wheels/struts get class "zink" (ink) not interactive. ✓ Also nacelle hit = nacelle path itself ✓.

Legend swatch for 900 — fine.

Now margin "blind" phrasing: e.g. `no rail draws words, part, condition; that part of the selection is on the chips above and in the page address` — hmm original said "lives only in the controls below". Mine: "sits in the link above" — the chips ARE in the instrument. Phrase: `no rail draws ${list}; that part of the selection lives on the chips above`. ✓

Let me now also double-check the "hand" kbd copy mentions chips? fine.

Time to also decide: do closed rails get data-aim hover text? Add title attr maybe. Skip.

Sentence second part: I'll also append the open-rail question in the sentence? No — picker does that. Keep sentence pure.

Also the ORIGINAL has `.aimat` with "Take it" button + one-day. Mine same layout.

Potential pitfall: `el("hero-root")` may contain whitespace; set className and innerHTML replaces content ✓.

Also multiple drawInstrument calls re-bind? bindGlobal once via flag.

Let me write the final code now, carefully, in order: style, script. I'll aim for clean, well-commented, working vanilla JS. Watch for template literal nesting and quoting (onclick handlers with args: use data-* + delegation everywhere — NO inline onclick; cleaner).

Also the top stamp: `FAA SERVICE DIFFICULTY REPORTS · ${pretty(RANGE.from).toUpperCase()} TO ${pretty(RANGE.to).toUpperCase()}`.

Let me write out month arrays:
MONTHS full names index 1-12; MON3 = ["JAN",...]. monthName("1995-04") → "April 1995".

pad(n)=String(n).padStart(2,"0").

lastDay(y,m)=new Date(y,m,0).getDate().

partialMonth(m): const to=RANGE.to||""; const mm=to.slice(0,7); if(m!==mm)return false; const dd=+to.slice(8,10)||0; return dd>0 && dd<lastDay(+to.slice(0,4),+to.slice(5,7)).

Months derive: 
```
function buildMonths(){
  const sel=new Map((TREND_SEL||[]).map(r=>[r.month,+r.n]));
  const all=new Map((TREND_ALL||[]).map(r=>[r.month,+r.n]));
  if(HERO.months&&HERO.months.length) return HERO.months.map(m=>({m:m.m,n:+(m.n??0),all:+(m.all??m.n??0)}));
  const keys=[...all.keys()].sort(); if(!keys.length)keys.push(...sel.keys());
  return keys.sort().map(k=>({m:k,all:all.get(k)||0,n:sel.has(k)?sel.get(k):( (isActive("from")||isActive("to"))?0:(all.get(k)||0) )}));
}
```
Hmm TREND_SEL might include months outside? fine.

isActive(k)=params().has(k).

TREND_ALL fetched once at boot without filters: direct fetch("api/trend") raw (no filter merge!). TREND_SEL via api() (filters). normalize: array | {rows|months|data|trend}.

Also CORPUS = sum TREND_ALL n (fallback facets total).

Zone ensure 9: 
```
const ZONE_ORDER=["100","200","300","400","500","600","700","800","900"];
const ZONE_DESC={100:"nose and forward lower fuselage",...};
function buildZones(){ const by=new Map((HERO.zones||facetVals("zone")).map(z=>[String(z.code??z.value),{code:String(...),label:z.label,n:+(z.n??0)}]));
 return ZONE_ORDER.map(c=>by.get(c)||{code:c,label:zoneLabel(c),n:0}); }
```
zoneLabel(c)= gLook(...) || `ZONE ${c} — ${ZONE_DESC[c]}`? Legend shows "ZONE 100" + desc separately. I'll keep label = gloss short label or `ZONE ${c}`, and desc for aria/title. Legend row: `<span class="zl-q">ZONE 300</span><span class="zl-d">aft lower fuselage</span>`. Compact.

wheresvg zone title: `${zoneLabel}` full.

OK — crew rows: exclude codes with n=0? Show rows n>0 sorted desc top 12; if none: note. crew_reports fallback sum.

leave_one_out fallback candidates: active filter keys (excluding from/to? dropping from/to also valid). Build from chips keys, up to 3, buttons "Drop airline: United ×" with just label.

Wait, zero block in original: `Drop ${LABEL} → N reports` with would_give. Mine uses HERO.leave_one_out when present.

Fault drawing: drawFrame("The file did not answer just now. ", retry button). retry: ghost button data-retry → delegation refresh().

Busy: setBusy(b): ROOT.classList.toggle("busy") — CSS .instrument-host.busy .ipad{opacity:.55;pointer-events:none}? pointer-events none prevents interaction during 300ms fetch — ok but might feel laggy; keep opacity only + aim "reading…"? Keep opacity+PE none simple. Hmm PE none also kills the aim line hover; fine during fetch.

Also disable double pushState races: SEQ guard ✓.

Now — writing aimHold messages with undo:
`narrowed to ${monthName(lo)}${lo===hi?"":" to "+monthName(hi)}. <button class="undoit" type="button">undo</button>`
`kept only what was found in ${zone label}. undo`
`following ${opName}. undo` / `following N${tail}. undo`
`kept only reports where the crew ${label}. undo`
`searched the write-ups for “${q}”. undo`
`took ${pretty(d)}, one day. undo`

All pushes via applyFilters(mut) which clones params, mutates, pushState, refresh.

Edge: setRail pushes too (hero param). Undo of rail switch works ✓.

Also on refresh success, aim persists? aimHold message would be wiped by re-render — drawInstrument rewrites DOM including aim div; so hold AFTER refresh completes (refresh calls drawInstrument then I need pending hold). Implement `PENDING_HOLD` string; refresh: after draw, if PENDING_HOLD { aim(PENDING_HOLD); PENDING_HOLD=null }. takeFor sets PENDING_HOLD then applyFilters→refresh ✓. Drag take same. 

Also chips re-render each draw ✓.

Initial "Reading the file…" frame: drawInstrument(root, rail, null) → frame with sentence "Opening the file…" and strips. Then real draw. Also handle drawInstrument called with data lacking total → treat as refused frame? If HERO.refused → refused frame. If !data → loading frame.

Also — I realize the when-rail months bar heights: strip height 64px; i height = all/cmax*100% ; u height = n/cmax*100%? If u proportional to same cmax, u ≤ i always ✓ overlay bottom. Good: heights in % of strip. cmax=max all (1 floor). Months with all=0 → nothing (empty slot, keeps spacing).

Axis ticks: position by index: left = (i + 0.5)/N*100% where i index of January months chosen by step. Tick label year below small mono ash; also tick line? tiny 1px mark. Implement axisTicks(): N=months.length; monthW = track.scrollWidth/N; step = Math.max(12, 12*Math.ceil(40/monthW/12))? Let me: yearsVisible ≈ N/12; want labels ≥ 44px apart: labelEvery = Math.max(1, Math.ceil(44/(monthW*12))) years. Ticks at months m where m endsWith "-01" and (year-firstYear)%labelEvery===0. Render spans.

The axis lives inside scroll content: `<div class="axis" style="width:100%">` inside .scrollw whose min-width = months min-width... Structure:
```
<div class="track" id="whenTrack">
  <div class="scrollw">
    <div class="months" id="months">…380 buttons…</div>
    <div class="axis" id="whenAxis"></div>
  </div>
</div>
```
.scrollw{min-width:100%;width:max-content} so it sizes to months content; months{display:flex;gap:1px;width:max-content? } months width: 380*4+379 = ~1899px min. Each .mo{width:4px} fixed → width max-content. Then track scrolls ✓. On wide screens (container ~1000px) still scrolls (1899>1000) — original scrolled too ("Drag across the months", strip scrollable, scrollLeft to end). ✓ monthW≈4+1px.

Set .mo width 4px? On hi-dpi fine. Bars inside absolute bottom.

Hmm 380 buttons * 2 spans fine.

paintBand: n=document.querySelectorAll(".mo") order equals months order ✓ band by index.

monthsTake uses HERO.months[i].m.

Wheel horizontal scroll on track: default shift+wheel; fine.

Now compose full HTML for rails:

```
function railShellHTML(){
 return RAILS.map(([id,q,pn])=>{
   const open=id===RAIL;
   if(!open){
     const val=heldFor(id);
     return `<section class="rail closed" data-rail="${id}">
       <div class="gut rest"><button type="button" class="restbtn" data-aim="openrail|${id}">
         <span class="q">${q}</span><span class="pn">${pn}</span>${val?`<span class="val">${esc(val)}</span>`:""}</button></div>
       <div class="strip"><span style="flex:1"></span></div></section>`;
   }
   return `<section class="rail open" data-rail="${id}">
     <div class="gut"><div class="q">${q}</div><div class="pn">${pn}</div>${val?`<div class="val">${esc(val)}</div>`:""}</div>
     <div class="track" id="track-${id}">${railBody(id)}</div></section>`;
 }).join("");
}
```
restbtn styling: unstyled button, text-align left, two lines (q over pn). val inline rust.

aimTextFor("openrail|when") → `open the WHEN rail — month by month`. Nice touch.

heldFor(id): from params: when→period text; where→zone label; whose→operator?N tail; forced→crew label.

railBody: when/where/whose/forced builders (async none — sync from HERO).

Forced "crewall" block: `<button class="fblock" data-aim="crewall"?>` clicking crewall does nothing (no filter) → make it a div with data-aim only ✓.

Whose ladder more note: after op rows: `<div class="lmore">${num(opCount)} operators in the file; ranked here are the ${num(rows.length)} most reported. Any airline can be taken by name in the Aim-at box above.</div>` — honest about partial ranking ✓. Swarm cap margin note ✓.

Let me also compute placed sum for zone aim text: sum of ZONES n.

Where legend row markup:
```
<button class="zlrow${taken}" data-aim="zone|c" data-take="zone|c">
 <i class="sw" style="background:${fill}"></i>
 <span class="zlq">ZONE ${c}</span>
 <span class="zld">${desc}</span>
 <b>${num(n)}</b></button>
```
grid columns: 14px auto 1fr auto.

SVG assembly:
```
function acSVG(){
 const mx=Math.max(1,...ZONES.map(z=>z.n));
 const fill=c=>ramp((ZONES.find(z=>z.code===c)||{n:0}).n/mx);
 const taken=params().get("zone");
 const zp=(c,d,extra)=>`<path class="zone" d="${d}" fill="${fill(c)}" data-take="zone|${c}" data-aim="zone|${c}" tabindex="0" role="button" aria-label="${esc(zoneAria(c))}">${taken===c?`<title>…`? no. 
```
Just: `<path class="zone${taken===c?" taken":""}" d="${d}" fill="${fill(c)}" data-take="zone|${c}" data-aim="zone|${c}" tabindex="0" role="button" aria-label="${esc(zoneAria(c))}"><title>${esc(zoneAria(c))}</title></path>`.

Full svg:
```
<svg class="ac" viewBox="0 0 760 244" role="group" aria-label="Side view of an aircraft, shaded by how often each zone is written up">
 <defs><clipPath id="acHull"><path d="${AC.hull}"/></clipPath></defs>
 ${zp("600",AC.fw)}
 ${zp("400",AC.fin)}
 <g clip-path="url(#acHull)">
   <rect x="46" y="60" width="294" height="63" fill="${fill("200")}" data-take? 
```
Problem: rect clipped can't carry data-aim click outside clip? Rect is clipped visually; pointer events apply to visible clipped area ✓ pointer-events on clipped rect works on visible region ✓. But rect needs class zone + handlers ✓. Give rects class "zone zrect".

```
   <rect class="zone${...}" x="46" y="60" width="294" height="64" fill="${fill("200")}" data-take="zone|200" .../>
   <rect ... 100: x46 y124 w294 h62
   <rect ... 700: x340 y60 w384 h64
   <rect ... 300: x340 y124 w384 h62
 </g>
 <path class="hull" d="${AC.hull}"/>
 ${zp("400",AC.stab)}
 <path class="pylon" d="${AC.pylon}" fill="${fill("800")}"/>
 ${zp("500",AC.nw)}
 <g> nacelle path fill 800 + intake ellipse </g>
 gear ink shapes + hit rects for 900
</svg>
```
Wait nacelle fill uses 800 fill: `<path class="zone" d=AC.nac fill=fill("800") data-take=zone|800 .../>` plus intake ellipse (non-interactive pointer-events:none). Pylon: same fill 800 but non-interactive (pointer-events none) — else hovering pylon aims zone 800 weirdly? Actually fine to make pylon part of 800 interactive too — it IS zone 800. Keep it a .zone with same data. OK simpler: pylon interactive as 800.

Order revised: fw(600), fin(400), rects(100/200/300/700), hull outline, stab(400), pylon(800), nw(500), nac(800)+intake, gear(900 visible ink + hit rects). Wait pylon before nw ✓ (nw covers pylon top). Nacelle after nw fine (no overlap). Gear last ✓.

Hit rects for 900: `<path class="zone hit" d="M134 150 h32 v78 h-32 Z M436 152 h32 v72 h-32 Z" fill="transparent" data-take="zone|900" .../>` — multi-subpath fill transparent pointer-events all? fill="transparent" receives events with pointer-events:fill? default pointer-events visiblePainted → fill transparent counts as painted? "visiblePainted: fill if fill not none" — transparent IS a paint ✓ works. Add CSS .zone.hit{pointer-events:all}.

Visible gear ink: `<g class="gear" stroke="ink" ...>` struts as stroked paths + circles fill ramp(900) with ink stroke ✓ so wheels show shading.

Also hull stroke: `fill:none;stroke:var(--ink);stroke-width:1.6`. Zone paths stroke: none. fw/fin/nw/stab/nac get stroke ink 1.1? If zone path has stroke, it outlines — good: give .zone.ac-path stroke... but rects clipped would show internal border lines at splits — those are real zone boundaries; give rects stroke: rgba(28,25,19,.25) — subtle boundaries ✓. I'll set .zone{stroke:rgba(28,25,19,.28);stroke-width:1} globally, hull stronger on top. But fw/fin roots get stroke at hidden edges — hidden anyway (covered). Stab/fin outlines ✓.

Zone focus ring: .zone:focus-visible{stroke:var(--ink);stroke-width:2.5;outline:none} ✓ (like original).

Inband on months ✓.

Also zone hover: .zone:hover{stroke:var(--ink);stroke-width:2}? original used rust hover: `.zone:hover{stroke:var(--rust);stroke-width:2.2}`. Use rust ✓. taken: rust 2.6 ✓.

Now the ramp function:
```
function hexMix(a,b,t){ // a,b hex
 const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
 const r=..., g=..., b2=...; linear interp per channel, round.
 return "#"+...}
const RAMP_LO="#e6ddc7", RAMP_HI="#a8431f";
ramp(f)=hexMix(RAMP_LO,RAMP_HI,Math.min(1,Math.max(0,f)));
```
Zone fill f=0.10+0.80*(n/mx).

Legend swatch same fill ✓.

OK — one more consideration: the host page might already have styles/fonts; I scope everything under `#hero-root` selectors to avoid collisions: prefix all CSS with `#hero-root` (e.g. `#hero-root .rail{...}`), and base font on #hero-root. Also class names generic ("chip","stamp") → scoping prevents clashes ✓. Pill appended to body — style .phpill standalone (unique name) ✓. Also CSS custom props declared on #hero-root.

Fonts: @import at top of style block.

Edge: multiple instances? Single ✓ (module-level state fine).

Let me also keep "whose" rail id: RAILS ids: when/where/whose/forced; picker labels: WHEN/month by month; WHERE/on the aircraft; WHO/airline and tail; FORCED/what the crew did. Note original picker q for forced = "WHAT IT FORCED". I'll use q text: WHEN/WHERE/WHO/WHAT IT FORCED with pn under.

Also the hand per rail uses openR: forced→"Click what the crew had to do."

Alright, also implement `clauseText` for chips: 
```
function clauseText(k,v){
 if(k==="from"||k==="to")return prettyDate(v);
 if(k==="zone")return zoneLabel(v);
 if(k==="operator")return opName(v);
 if(k==="tail")return "N"+v;
 if(k==="crew")return crewLabel(v);
 if(k==="jasc")return jascLabel(v)?`${v} ${jascLabel(v)}`:v;
 if(k==="q")return `“${v}”`;
 return v;
}
```
Sentence clause per key:
```
const CLAUSE={
 from:v=>`filed from ${prettyDate(v)}`,
 to:v=>`through ${prettyDate(v)}`,   // hmm better combined period clause
 ...
}
```
Simplify: build period clause once from from+to; others individually:
operator: `filed by ${opName(v)}`
tail: `on airframe N${v}`
zone: `found in ${zoneLabelShort(v)}`
crew: `where the crew ${crewLabel(v).toLowerCase()}`
jasc: `on system code ${v}`
ata: `in ATA chapter ${v}`
part: `on part ${v}`
condition: `with condition ${v}`
stage: `at stage ${v}`
discovered: `discovered ${v}`
nature: `nature ${v}`
corrosion: `with corrosion noted`
cracked: `with cracking noted`
make/model: `make ${v}` / `model ${v}`
minhours: `at ${v} hours or fewer`? minhours semantics unknown — "at least ${v} hours"? ambiguous: phrase `hours ${v}`. I'll do `with ${LABEL[k]} ${v}` fallback: `LABEL: value`.
q: `mentioning “${v}”`

periodClause(): both present: same month → `in ${monthName(y-m)}`; same day → `on ${pretty}`; else `filed ${pretty(from)} to ${pretty(to)}`; only from: `filed from ${pretty}`; only to: `filed through ${pretty}`.

Alright. Also LABEL:
```
const LABEL={q:"words",operator:"airline",make:"make",model:"model",tail:"airframe",part:"part",condition:"condition",stage:"stage",discovered:"discovered",nature:"nature",crew:"crew action",jasc:"system code",ata:"ATA chapter",zone:"zone",corrosion:"corrosion",cracked:"cracking",minhours:"hours",from:"from",to:"to"};
```

Blind list uses LABEL names.

Now writing everything. Also remember: no inline onclick; all delegation. All buttons type="button".

Time check on tokens: plan ~1000 lines total; well within budget. Let me write it.

Also don't forget: `document.title` untouched. No console spam. Wrap in IIFE. "use strict".

Potential null issues: HERO null guards in aimTextFor etc.

Write CSS now mentally then final:

Also `.rail .track.two` used by where & whose ✓.

Phone media ≤760: 
```
#hero-root .rail{grid-template-columns:1fr;gap:6px}
#hero-root .track.two{grid-template-columns:1fr}
#hero-root .sentence{font-size:24px}
#hero-root .picker{width:100%} buttons flex 1
#hero-root .aimat children wrap
#hero-root .restbtn{...}
#hero-root .kbd-fine{display:none} etc within coarse media? Use two media: (pointer:coarse) show .kb-coarse hide .kb-fine.
```
Hand line: `<span class="kb-fine">Keyboard: …</span><span class="kb-coarse">Touch: tap a mark to look at it, then tap “take it”.</span>` with CSS defaults: .kb-coarse{display:none} @media(pointer:coarse){.kb-fine{display:none}.kb-coarse{display:inline}}.

Pill visible only coarse anyway (only spawned on coarse).

Let me also ensure focusin delegation for data-aim includes SVG paths (focusin works with tabindex) ✓.

Month focus rove: on focusin .mo: aim + set tabindex. 

monthsTake via pill on coarse: pill spec "monthrange|lo|hi"? My takeFor handles kinds; add kind "period" spec: takeFor("period|lo|hi") → monthsTake(lo,hi). ✓ For pill on months: pillFor(`period|${lo}|${hi}`, `${monthName lo} to ${monthName hi} · ${num(n)} reports`). And single tap month on coarse: also period|i|i pill ✓ so touch never immediately narrows ✓ consistent inspect-then-commit.

Generic data-take click on coarse: e.preventDefault+stopPropagation? Not needed; just pillFor and return (no navigation anyway). But ALSO ensure the same tap doesn't ALSO trigger focusin aim — fine it does, harmless.

Scroll listener: killPill ✓ passive.

Resize: debounce 180 → axisTicks() if when open.

popstate → sync.

Also history push URL: keep other params (non-filter keys preserved? e.g. hero). applyFilters(fn): 
```
const p=new URLSearchParams(location.search);
fn(p);
history.pushState({},"", location.pathname+"?"+p.toString()? keep hash);
refresh();
```
p.toString may be empty → location.pathname + (s?"?"+s:"").

setRail(r): if r===RAIL return; applyFilters(p=>p.set("hero",r)) then RAIL set in refresh from params? Simpler: set RAIL=r before refresh; refresh fetches hero?hero=RAIL ✓. In popstate: RAIL = params.get("hero")||RAIL.

Also hero param default when absent: don't add until user switches ✓.

drawInstrument signature: (rootEl, rail, data). It sets ROOT, RAIL (validate), HERO=data, renders. refresh passes (ROOT, RAIL, HERO) ✓ host could call too.

Also expose: window.drawInstrument=drawInstrument.

One subtlety: drawInstrument called by host with data not fetched by me — composeHero should run? The signature says data. I'll have drawInstrument accept raw data and internally normalize (composeHero mutates HERO global). For host-supplied data lacking facets — normalization guards with optional TREND. OK: drawInstrument(rootEl, rail, data){ ROOT=...; RAIL=...; composeHero(data); render... } and boot calls after fetching. Loading frame: drawInstrument(root, rail, null) → composeHero(null) → HERO={} → loadingFrame since no total? Distinguish: data===null → loading frame; data&&refused → refused frame; else full. But composeHero(null) sets HERO={} — I'll set a flag LOADING when data null.

Hmm careful: refused needs TOTAL → CORPUS from cached TREND_ALL (boot fetched) ✓.

Boot sequence:
```
async function boot(){
 ROOT=el("hero-root"); if(!ROOT)return;
 bindGlobal();
 RAIL=params().get("hero")||"when";
 drawInstrument(ROOT,RAIL,null);           // the frame stands while the file is read
 try{
   TREND_ALL=await plainFetch("api/trend");  // corpus months, untouched by any filter
 }catch(e){ TREND_ALL=[]; }
 await refresh();
}
```
refresh catches its own errors → fault frame. If plainFetch failed & refresh fails → fault ✓.

plainFetch: raw fetch json no filter merge.

In refresh: fetch facets + trend(sel) + hero in parallel (three calls) — all filtered. composeHero uses TREND_ALL merge.

Also cache TREND_SEL? no.

composeHero(raw):
```
function composeHero(raw){
  raw=raw||{};
  const f=FACETS||{};
  const r0=(raw.range)||(f.range)||{};
  RANGE={from:r0.from||r0.min||"",to:r0.to||r0.max||""};
  const ftotal=+( (f.range&&(f.range.total||f.range.n)) || 0 );
  const t=raw.total;
  TOTAL = (t==null? (ftotal|| sumMonths()) : +t) || 0;
  ...
}
```
sumMonths fallback: TREND_SEL sum or TREND_ALL sum if no filters... whatever guarded.

CORPUS computed at boot after TREND_ALL: CORPUS = sum TREND_ALL n || facets total at rest. Set inside refresh after facets: if no filters active → CORPUS=TOTAL||CORPUS.

Also store HERO fields as computed: HERO.months=buildMonths(); HERO.zones=buildZones(); HERO.no_location=raw.no_location; HERO.other_location=raw.other_location; HERO.ops=...; HERO.swarm=...; HERO.crew=...; HERO.crew_reports=...; HERO.lines=raw.lines; HERO.specimen=raw.specimen; HERO.loo=raw.leave_one_out; HERO.refused=...; HERO.corpus=raw.corpus||CORPUS.

render uses HERO.

Specimen specLine: facts from specimen object keys: control, date, acft/ac, tail, zone, jasc, ata, part... I'll render generic: iterate allowed keys with LABEL-ish names:
```
const SKEYS=[["control","control"],["date","date"],["tail","airframe"],["acft","aircraft"],["zone","zone"],["jasc","system"],["ata","ATA"],["part","part"],["operator","airline"]];
facts = SKEYS.filter(([k])=>spec&&spec[k]!=null&&spec[k]!=="").map(([k,l])=>`<span><i>${l}</i> ${esc(k==="tail"?"N"+spec[k]: k==="zone"? zoneLabel(spec[k]) : spec[k])}</span>`)
```
And lines[0]: string → esc; object → try .text||.narrative||JSON pick. jargon: esc + maybe gloss codes; keep esc only (words as written).

specimen heading: "One report from this selection. First the FAA's own filing of it, then the mechanic's words as written." ✓ (no open cue since no route).

Zero block: as planned.

Margin render: `<div class="mn${warn?" warn":""}">${text}</div>`; only show block if MARGINS.length.

Margin building in draw: build margins array each render (fresh) then render.

Order: part, swarmcap, basis, blind.

Where unplaced note is in zonenote (not margin) ✓ per original ("said underneath" the drawing).

Aim text for "openrail": `open the ${q} rail — ${pn}`.

Also add data-aim to fblock: `crewall` → text.

I think I'm ready to write. Also small: `.restbtn` is a button containing spans; CSS reset.

One more: "the seam" only when table exists:
```
const hasTable=()=>!!document.querySelector("table.reports");
seam HTML conditional; goResults(): const t=document.querySelector("table.reports"); if(t)scrollTo top-58 smooth.
```
If no table: no seam — but then the instrument has no exit; acceptable (it's the whole page). Hmm — maybe ALWAYS render seam but when no table, clicking copies... no. Omit. Actually wait — maybe include the seam anyway scrolling to bottom? Dishonest affordance. Omit when no destination. ✓

Also add `aria-current` on picker tab.

Let me now write the code. I'll be careful with:
- template literals inside template literals (avoid nesting problems by building small functions).
- ids unique: aimLine, aimKind, aimAt, aimDay, aimSug, whenTrack, months, whenAxis, marginBox, iSentence.

Delegated events (bindGlobal once):
1. document mouseover [data-aim] → aim
2. document focusin [data-aim] → aim(+rove if .mo)
3. document mouseout [data-aim] → unaim (only when leaving element: e.target check)
4. click: .undoit → back; [data-take] → coarse? pill : takeFor; .rail.closed → setRail; .picker button[data-rail] → setRail; [data-drop] chips b → drop; [data-retry] → refresh; .seam → goResults
5. keydown: months nav; .zone Enter/Space → takeFor; Escape → sugClose
6. pointerdown/move/up on #whenTrack (delegate via closest since track re-created): pointerdown → closest("#whenTrack")? Months drag: bind pointerdown delegated: if e.target.closest("#months") → start drag; move/up on window (since capture set on track? I'll setPointerCapture on the track element then listen pointermove/up on it? Delegated window listeners simpler: window pointermove: if DRAG → update; window pointerup: if DRAG → finish. Capture not needed with window listeners; but text selection during drag: preventDefault on pointerdown + user-select none on months ✓.
7. input #aimAt → sug; keydown #aimAt → nav; mousedown #aimSug .sug → take; document mousedown outside .aimat → sugClose.
8. change #aimKind → placeholder + resugar; change #aimDay → take day.
9. popstate; scroll (killPill); resize (axisTicks debounce).

aim placeholder by kind: AIMPH map ✓.

sugTargets(): from HERO: months→{kind:"period",label:monthName,apply:"period|m",n}; zones; crew; ops; tails. Cache per render (SUGSRC built in draw).

sugFetch(v): filter SUGSRC label lowercase includes v (limit 30, keep group order). Free-text kind (""): no list — show nothing; Enter/Take → q pass-through. Note in UI: placeholder says "any words the mechanic wrote". Under input maybe hint. ok.

takeSug(o): apply by kind: period → takeFor("month|m") (sets month); others → takeFor(o.apply) where apply="zone|100" etc. So SUGSRC entries carry apply specs. ✓ keyboard Enter on .sug handled via mousedown? Also click.

For "Take it" button (aimAtGo): 
```
kind=select.value; v=input.value.trim(); if(!v)return;
if(!kind){ setFilter("q",v) with hold `searched the write-ups for “v”. undo`; return }
if(kind==="period"){ const pr=parsePeriod(v); if(!pr){aim(`I can't read “${v}” as a month or a year. Try “August 2025” or “2025”.`);return} applyPeriod(pr) }
else { setFilter(kind, normalize(kind,v)) with hold `took “v” as ${LABEL[kind]}. undo` }
```
normalize: tail→strip leading N & uppercase; operator→as typed; zone/jasc→ digits only? pass as typed.
If result zero → zero block appears ✓ honest.

applyPeriod: clamp to RANGE when overlapping; set from/to; hold `narrowed to X to Y. undo`.

parsePeriod month-name-only: search TREND_ALL months whose MONTHS[+m.slice(5,6)] matches name (case-insensitive, 3+ letters prefix match); take the latest; lo/hi that month; label monthName.

OK. Also aimDay change: set from=to=day; hold.

Now writing the final answer. Also remember: `#hero-root` may not exist at script exec if script in head — my script block placed after? The host renders fragment into a page where #hero-root exists before script (they said "rendering into an element with id hero-root"). I'll still defer: run boot on DOMContentLoaded if not ready: `if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();`.

Also define drawInstrument BEFORE call ✓.

Let me draft the whole file now (final output). I'll write it as one continuous fragment. Also include generous but purposeful comments in the original voice.

CSS details — write carefully:

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap');

#hero-root{
  --paper:#f2eee6; --card:#f9f6ee; --ink:#211d14; --ash:#8c8474;
  --line:#dcd3bf; --faint:#e8e1d0; --rust:#a8431f; --rust-text:#8f3517;
  --rest:#e3dbc6; --held:#c9bda0;
  font-family:Archivo,"Archivo",system-ui,sans-serif; color:var(--ink);
  background:var(--paper); margin:0;
}
#hero-root *,#hero-root *::before,#hero-root *::after{box-sizing:border-box}
#hero-root button{font-family:inherit;color:inherit}
#hero-root :focus{outline:none}
#hero-root :focus-visible{outline:2px solid var(--ink);outline-offset:1px}
.instrument{max-width:1080px;margin:0 auto;padding:26px 18px 34px}
.ipad{background:var(--card);border:1px solid var(--line);padding:20px 22px 16px;transition:opacity .15s}
.ipad.busy{opacity:.55;pointer-events:none}
.ihead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:11px}
.stamp{font:500 10.5px/1.5 "IBM Plex Mono",monospace;letter-spacing:.13em;color:var(--ash)}
.picker{display:flex;flex-wrap:wrap;gap:2px}
.picker button{appearance:none;background:none;border:1px solid transparent;padding:6px 10px 5px;cursor:pointer;text-align:left}
.picker button .q{display:block;font:700 10.5px/1.3 Archivo,sans-serif;letter-spacing:.1em;color:var(--ash)}
.picker button .pn{display:block;font:400 9.5px/1.5 "IBM Plex Mono",monospace;color:var(--ash)}
.picker button:hover .q{color:var(--ink)}
.picker button.on{border-color:var(--line);background:var(--paper)}
.picker button.on .q{color:var(--rust-text)}
.sentence{font:400 30px/1.28 "Instrument Serif",serif;margin:18px 0 2px;max-width:52ch}
.sentence .cn{color:var(--rust-text)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chip{display:inline-flex;align-items:baseline;gap:6px;font:400 11px/1.4 "IBM Plex Mono",monospace;border:1px solid var(--line);background:var(--paper);padding:3px 8px;color:#5f584f}
.chip .cl{color:var(--ash);letter-spacing:.05em}
.chip b{cursor:pointer;font-weight:400;padding:0 1px;color:var(--ash)}
.chip b:hover{color:var(--rust-text)}
.aim{min-height:21px;margin-top:9px;font:400 12.5px/1.5 "IBM Plex Mono",monospace;color:#5f584f}
.aim:empty{margin-top:0}
.aim .undoit, .undoit{...}
```
undoit style: underline mono: `.undoit{appearance:none;background:none;border:0;border-bottom:1px solid var(--rust-text);color:var(--rust-text);font:400 12px "IBM Plex Mono";cursor:pointer;padding:0 0 1px;margin-left:8px}`.

aimat:
```
.aimat{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px;position:relative}
.aimat label{font:600 10px/1 Archivo;letter-spacing:.09em;color:var(--ash)}
.aimat select,.aimat input[type=text]... use ids: 
#aimKind,#aimAt{font:400 12px/1.3 "IBM Plex Mono";background:var(--paper);border:1px solid var(--line);color:var(--ink);padding:6px 8px;border-radius:2px}
#aimAt{min-width:300px;flex:1}
#aimDay{font:400 11px "IBM Plex Mono";border:1px solid var(--line);background:var(--paper);color:#5f584f;padding:5px 6px;border-radius:2px}
.aimsug{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;background:var(--card);border:1px solid var(--line);box-shadow:0 6px 18px rgba(33,26,12,.12);max-height:340px;overflow:auto}
.sughead{font:700 9px/1 Archivo;letter-spacing:.12em;color:var(--ash);padding:8px 10px 3px;border-top:1px solid var(--faint)}
.sughead:first-child{border-top:0}
.sug{display:flex;gap:10px;align-items:baseline;padding:5px 10px;cursor:pointer}
.sug:hover,.sug.on{background:var(--paper)}
.sug .sl{font-size:12px}
.sug .sw{flex:1;font:400 10.5px "IBM Plex Mono";color:var(--ash);text-align:right? hmm
```
sug row: label left, what middle gray, count right mono. `.sug .sw{flex:1;text-align:right;font-size:10.5px;color:var(--ash)}` `.sug b{font:500 11px "IBM Plex Mono";color:var(--rust-text);min-width:52px;text-align:right}`.

hand: `.hand{margin-top:9px;font-size:11px;color:var(--ash)} .hand .kbd,.kb-fine,.kb-coarse{font:400 10.5px/1.6 "IBM Plex Mono";color:#a89f8c;display:block}`.

zero: `.zero{margin-top:12px;border:1px dashed var(--line);background:var(--paper);padding:10px 12px} .zero b{font:600 12.5px Archivo} .zero .zg{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}`.

ghost: `.ghost{appearance:none;background:none;border:1px solid var(--line);color:#5f584f;font:500 11px/1.2 Archivo;padding:5px 10px;border-radius:2px;cursor:pointer} .ghost:hover{border-color:var(--rust);color:var(--rust-text)}`.

rails: `.rails{margin-top:14px;display:flex;flex-direction:column}
.rail{display:grid;grid-template-columns:118px minmax(0,1fr);gap:16px;align-items:start;padding:7px 0;border-top:1px solid var(--faint)}
.rail:first-child{border-top:0}
.rail.closed{cursor:pointer;align-items:center;padding:8px 0}
.rail.closed:hover .strip{background:var(--held)}
.restbtn{appearance:none;background:none;border:0;padding:0;cursor:pointer;text-align:left;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;width:100%}
.restbtn .q{font:700 11px/1 Archivo;letter-spacing:.08em}
.restbtn .pn{font:400 9.5px "IBM Plex Mono";color:var(--ash)}
.restbtn .val{font:400 10.5px "IBM Plex Mono";color:var(--rust-text)}
.rail.closed .strip{height:13px;background:var(--rest);display:flex;overflow:hidden;transition:background .12s}
.rail.open{padding:9px 0 12px}
.gut .q{font:700 11px/1.3 Archivo;letter-spacing:.08em}
.gut .pn{font:400 9.5px/1.6 "IBM Plex Mono";color:var(--ash)}
.gut .val{font:400 10.5px/1.5 "IBM Plex Mono";color:var(--rust-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:118px}
.track{min-width:0;position:relative}
.track.two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,1fr);gap:22px}`
```
Hmm where: drawing 1.25fr, legend 1fr; whose: ops ladder wider, tails narrower: use `.track.two.wside{grid-template-columns:minmax(0,1fr) 330px}`. I'll add variant class per rail: where→"two drawside", whose→"two wside".

when:
```
#whenTrack{overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}
.scrollw{width:max-content;min-width:100%}
.months{display:flex;align-items:flex-end;gap:1px;height:66px;user-select:none;-webkit-user-select:none}
@media(pointer:fine){.months{touch-action:none}}
.mo{position:relative;flex:0 0 4px;width:4px;height:100%;background:none;border:0;padding:0;cursor:pointer}
.mo i{position:absolute;bottom:0;left:0;right:0;background:var(--rest)}
.mo u{position:absolute;bottom:0;left:0;right:0;background:var(--rust);opacity:.85;text-decoration:none}
.mo:hover i,.mo:focus-visible i{background:var(--held)}
.mo.inband i{background:#cbbd9c}
.mo.part::after{content:"";position:absolute;top:0;left:-1px;right:-1px;border-top:1px dashed var(--ash)}
.mo:focus-visible{outline:none}
.mo:focus-visible i{background:var(--ink)}
.axis{position:relative;height:16px;margin-top:4px}
.axis span{position:absolute;top:0;transform:translateX(-50%);font:400 9.5px "IBM Plex Mono";color:var(--ash)}
.axis span::before{content:"";position:absolute;left:50%;top:-4px;width:1px;height:3px;background:var(--ash)}
```
Wait ::before above text = tick ✓.

Months with all=0: still slot (flex 0 0 4px) but no bars ✓.

where:
```
.ac{width:100%;height:auto;display:block}
.zone{stroke:rgba(33,28,17,.30);stroke-width:1;cursor:pointer;transition:stroke .1s}
.zone:hover,.zone:focus-visible{stroke:var(--rust);stroke-width:2.2;outline:none}
.zone.taken{stroke:var(--rust);stroke-width:2.6}
.hull{fill:none;stroke:var(--ink);stroke-width:1.5;pointer-events:none}
.gear path,.gear circle{pointer-events:none}
.zonenote{font-size:12px;line-height:1.55;color:#5f584f;margin-top:8px;max-width:60ch}
.zonenote .sep{color:var(--ash);padding:0 4px}
.zl{display:flex;flex-direction:column;gap:1px}
.zlrow{appearance:none;background:none;border:0;display:grid;grid-template-columns:14px 64px minmax(0,1fr) 62px;gap:8px;align-items:center;padding:4px 6px;cursor:pointer;text-align:left}
.zlrow:hover{background:var(--paper)}
.zlrow .swz{width:13px;height:13px;border:1px solid rgba(33,28,17,.35)}
.zlrow .zlq{font:700 10px/1.2 Archivo;letter-spacing:.07em}
.zlrow .zld{font-size:11.5px;color:#5f584f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zlrow b{font:500 11px "IBM Plex Mono";text-align:right;color:var(--ink)}
.zlrow.taken .zlq,.zlrow.taken b{color:var(--rust-text)}
.zlrow.taken .swz{border-color:var(--rust)}
```

ladders:
```
.lhead{font:700 9.5px/1 Archivo;letter-spacing:.11em;color:var(--ash);margin-bottom:6px}
.ladder{display:flex;flex-direction:column;gap:1px}
.lrow{appearance:none;background:none;border:0;display:grid;grid-template-columns:minmax(96px,190px) minmax(0,1fr) 64px;gap:10px;align-items:center;padding:3px 6px;cursor:pointer;text-align:left}
.lrow:hover{background:var(--paper)}
.lrow .lb{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lrow .bar{height:9px;background:var(--rest);position:relative}
.lrow .bar i{position:absolute;top:0;bottom:0;left:0;background:var(--held)}
.lrow b{font:400 11px "IBM Plex Mono";text-align:right;color:#5f584f}
.lrow.taken .lb{color:var(--rust-text)}
.lrow.taken .bar i{background:var(--rust)}
.lmore{font:400 10.5px/1.6 "IBM Plex Mono";color:#a89f8c;margin-top:7px}
```

forced:
```
.fblock{margin-bottom:10px}
.fblock .big{height:20px;background:var(--rest);position:relative}
.fblock .big i{position:absolute;top:0;bottom:0;left:0;background:var(--rust);opacity:.85}
.fblock .fcap{font:400 11px/1.6 "IBM Plex Mono";color:#5f584f;margin-top:5px}
```

specimen:
```
.specimen{margin-top:14px;border-top:1px solid var(--faint);padding-top:10px}
.specimen .sh{font:600 10px/1.4 Archivo;letter-spacing:.09em;color:var(--ash)}
.sf{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:7px}
.sf span{font:400 10.5px/1.5 "IBM Plex Mono";color:#5f584f}
.sf span i{font-style:normal;color:var(--ash);letter-spacing:.05em;margin-right:5px}
.sl{font:400 19px/1.5 "Instrument Serif",serif;margin-top:9px;max-width:74ch}
.sl::before{content:"“";color:var(--ash)} .sl::after{content:"”";color:var(--ash)}
```

margin:
```
.margin{margin-top:14px;border-top:1px solid var(--faint);padding-top:9px;display:flex;flex-direction:column;gap:4px}
.margin:empty{display:none}
.mn{font:400 11px/1.6 "IBM Plex Mono";color:#6d6553}
.mn.warn{color:var(--rust-text)}
```

seam:
```
.seam{display:block;width:100%;appearance:none;background:none;border:0;border-top:1px solid var(--line);margin-top:2px;padding:13px 2px 2px;font:500 13px/1.4 "IBM Plex Mono";letter-spacing:.03em;color:var(--rust-text);cursor:pointer;text-align:left}
.seam:hover{color:var(--ink)}
```
Hmm seam spans the ipad width: place inside .instrument after .ipad ✓.

phpill:
```
.phpill{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:80;appearance:none;border:0;background:var(--ink);color:var(--paper);font:500 12px/1 "IBM Plex Mono";padding:11px 15px;border-radius:3px;cursor:pointer;box-shadow:0 6px 20px rgba(20,15,6,.3)}
.phpill .go{color:#f0b294;margin-left:6px}
```

fault frame retry ghost ✓.

media ≤760:
```
@media(max-width:760px){
 .instrument{padding:14px 10px 24px}
 .ipad{padding:14px 12px 12px}
 .sentence{font-size:23px}
 .ihead{flex-direction:column;align-items:stretch}
 .rail{grid-template-columns:1fr;gap:7px}
 .gut .val{max-width:none}
 .track.two,.track.two.wside{grid-template-columns:1fr;gap:16px}
 #aimAt{min-width:0;width:100%;flex:1 1 100%}
 .lrow{grid-template-columns:minmax(72px,40vw) minmax(0,1fr) 56px;gap:6px}
}
@media(pointer:coarse){ .kb-fine{display:none} } 
.kb-coarse{display:none}
@media(pointer:coarse){ .kb-coarse{display:inline} .kb-fine{display:none} }
```
Careful: .kb-coarse default display:none then coarse inline ✓.

Hmm: `.aimat label.aimday` inline label wrapping input: `.aimday{display:inline-flex;align-items:center;gap:6px;font:600 10px Archivo;letter-spacing:.09em;color:var(--ash)}`.

Now JS final. Let me write functions fully; mind correctness.

Also monthsTake hold: use PENDING_HOLD.

Generic click delegation order matters: check .undoit first, then [data-drop] (chip ×) before [data-take]? chip × has data-drop on <b> — not data-take ✓ no conflict. .rail.closed click — closed rail contains restbtn (data-aim) only ✓. picker buttons: class .pkb data-rail.

Careful: clicking picker shouldn't also hit .rail (not inside) ✓.

takeFor:
```
function takeFor(spec){
  const [kind,arg1,arg2]=spec.split("|");
  const d=HERO||{};
  if(kind==="period"){ monthsTakeIdx(+arg1,+arg2); return }   // indices
  if(kind==="month"){ monthTake(arg1); return }
  if(kind==="zone"){ const z=(d.zones||[]).find(x=>x.code===arg1);
    setFilter("zone",arg1,`kept only what was found in ${esc(zoneLabel(arg1)).toLowerCase? }`)}
  ...
}
```
zoneLabel returns like "ZONE 300 — aft lower fuselage" — hold: `kept only ZONE 300. undo` simpler: use zoneLabelShort: `ZONE 300`. hold: `kept only ${zoneLabel(c)}. undo` fine (label short).

monthTake(m): compute from/to, applyDates(lo,hi,label).

monthsTakeIdx(i,j): from HERO.months.

applyDates(lo,hi,holdHTML): p set from/to; PENDING_HOLD; push; refresh.

setFilter(k,v,hold): p.set(k,v) or delete if !v; PENDING_HOLD=hold; push; refresh.

dropFilter(k): p.delete(k); PENDING_HOLD=`dropped ${LABEL[k]||k}. undo`; push; refresh.

goResults ✓.

Aim text functions need HERO — guard nulls.

Now sentence count element: `<span class="cn">${num(TOTAL)}</span> ${TOTAL===1?"report":"reports"}`.

Full sentence: if no clauses: `Reading <span class=cn>…</span>.` else `<span class=cn>…</span> reports — ${clauses.join(", ")}.` Wait zero: `No report matches everything at once.` plus clauses list? Keep: TOTAL===0 → sentence `Nothing matches all of these at once.` and clauses echoed in chips anyway + zero block. If clauses and TOTAL>0: `<span class=cn>N</span> reports — ${clauses.join("; ")}.`

Hmm "Reading N reports." original phrasing at rest — keep exactly at rest: `Reading ${num} reports.` ✓.

Chips only when clauses exist.

Zero block leaves: from HERO.loo entries {drop,would_give}: `Drop ${LABEL[drop]||drop} → ${num(wg)} reports`. fallback: active keys (first 3, prefer non-date): `Drop ${LABEL[k]}`.

Margin partial month: need last month + RANGE.to: compute in draw.

Swarm cap: HERO.swarm_total>len.

Blind: blindKeys() = FILTER_KEYS.filter(k=>p.has(k) && !DRAWN.has(k)) where DRAWN=new Set([from,to,zone,operator,tail,crew]).

Note: chips row exists so blind note: `no rail draws ${list}; that part of the selection lives on the chips above`.

Where unplaced note build:
```
const placed=ZONES.reduce((s,z)=>s+z.n,0);
const nl=HERO.no_location, ol=HERO.other_location;
const bits=[];
if(nl!=null&&nl>0)bits.push(`${num(nl)} reports say nothing about where on the aircraft it was`);
if(ol!=null&&ol>0)bits.push(`${num(ol)} name the place in words, not as a zone number`);
let rem=null;
if(nl!=null&&ol!=null){ rem=TOTAL-placed-(+nl)-(+ol); if(rem<0)rem=0 }
if(rem)bits.push(`${num(rem)} more are counted but placed nowhere at all`);
note = `The drawing places ${num(placed)} of ${num(TOTAL)} findings.` + (bits.length? " "+bits.join("; ")+".":"")
```
If TOTAL===0: placed 0 → "The drawing places 0 of 0 findings." fine.

whose pinning: if p.operator set and not in rows: rows.unshift({key,label:opName,n:HERO? unknown count — hero op rows only top; pinned row count unknown → show label + "your selection" instead of count? Show count if we can: not available → put em dash and note. I'll render pinned row with b="—" and title? Hmm — count IS knowable? facets operator list may include it if facets returns ALL operators (facets = "every filter value with counts") → yes! facets operator has every operator → find current one there ✓. Similarly tail. Use facets for pinned counts. If facets missing → "—".

Same for where legend: if zone param set, that zone row from ZONES (built from facets/hero) ✓ already there.

Whose opName: label from facet entry or gloss or raw value.

Also opCount = facets.operator.length || raw.operators || rows.length.

OK writing now for real. I'll keep code tight but complete. Also add try/catch around JSON parse.

One more detail — api() URL building: `new URL(p, location.href)` — if p="api/hero?hero=when" relative resolves ✓. Merge filter params (don't overwrite existing hero). ✓ plainFetch same minus merge.

Also — server might expect filters as separate query params exactly as names ✓ we pass through.

Also FILTER_KEYS includes from/to ✓ appended to API calls — narrowing server-side ✓.

Potential issue: appending filters to trend-all? No, TREND_ALL plain ✓.

Let me also compute sumN for band preview: sum over HERO.months[i].n between lo..hi ✓.

Roving tabindex initial: last month index. In renderWhen: after injecting, set `mos[mos.length-1].tabIndex=0`.

focusin handler: if(t.classList.contains("mo")){ rove: prev? track via variable MO_ROVE; set }.

Also keyboard nav when focus is on .mo: target is the button; my delegated keydown: `const mo=e.target.closest("#months .mo")` — ArrowLeft etc: focus sibling: mos = container children; j computed; mos[j].focus(). Shift+arrow: ANCHOR.

Also PageUp/Down jump 12? skip.

Enter/space on .mo: if ANCHOR!=null monthsTakeIdx(ANCHOR,i) else monthsTakeIdx(i,i); ANCHOR=null.

paintBandIdx(i,j): lo,hi idx; iterate mos set inband; aim text with month names + sum n (HERO.months slice). When shift-nav, ANCHOR fixed.

Clear band on: pointerup take → after take, re-render clears anyway; on unaim? keep band until take/cancel. On pointerleave track? cancel on pointercancel + Escape clears band: add Escape handler: clearBand + DRAG=null.

DRAG flow:
```
let DRAG=null;
document.addEventListener("pointerdown",e=>{
  const m=e.target.closest&&e.target.closest("#months .mo");
  const wrap=el("months"); if(!m||!wrap)return;
  if(!COARSE.matches){ e.preventDefault(); }
  const i=idxOf(m); DRAG={a:i,b:i,moved:false};
  paintBandIdx(i,i);
});
document.addEventListener("pointermove",e=>{
  if(!DRAG)return;
  const i=monthIdxAt(e.clientX); if(i<0)return;
  if(i!==DRAG.b){DRAG.b=i;DRAG.moved=true;paintBandIdx(DRAG.a,i)}
});
document.addEventListener("pointerup",e=>{
  if(!DRAG)return;
  const {a,b}=DRAG; DRAG=null;
  const lo=Math.min(a,b),hi=Math.max(a,b);
  if(COARSE.matches){ pillFor(`period|${lo}|${hi}`, bandText(lo,hi)+" — release: tap to take"); clearBand(); }
  else { PENDING_HOLD=... monthsTakeIdx(lo,hi) }  → monthsTakeIdx sets hold itself; just call it.
});
pointercancel → DRAG=null; clearBand.
```
monthIdxAt(clientX): track=el("whenTrack"); r=track.getBoundingClientRect(); x=clientX-r.left+track.scrollLeft; N=months len; w=track.scrollWidth; idx=clamp(floor(x/(w/N)),0,N-1).

bandText(lo,hi): `${monthName(loM)}${lo===hi?"":" to "+monthName(hiM)} · ${num(sum)} reports`.

monthsTakeIdx(lo,hi): m1=months[lo].m, m2=months[hi].m; if lo>hi swap; from=`${m1}-01`; to=`${m2}-${lastDay}`; hold `narrowed to ${monthName(m1)}${m1===m2?"":" to "+monthName(m2)}. <button undo>`; applyDates.

pillFor months coarse: pill take → monthsTakeIdx(lo,hi) ✓.

clearBand(): mos remove inband.

Also on unaim, band persists until commit/cancel — ok.

Zones keyboard: keydown delegated: if(e.key==="Enter"||" ")&&e.target.classList?.contains("zone") → takeFor(dataset.take), preventDefault.

Suggestion box behaviors — write carefully but compact.

parsePeriod: implement month name matching: build lookup: for each trend month key "1995-04": name=MONTHS[+mm].toLowerCase(). If input matches name (startsWith, min 3 chars) + optional year. Cases:
- "august 2025" / "aug 2025"
- "august" → latest occurrence
- "2025" / "2025-08"
Return {lo,hi,label} clamped later.

clampPeriod(lo,hi): if RANGE.from&&RANGE.to: clo=max(lo,RANGE.from)... as string compare works ISO ✓; if clo<=chi use clamped else leave (returns nothing → honest zero).

Also takeFor month (from aim sug "period|m"): treat as monthTake(m): from/to that month (no clamp needed — within file presumably; clamp anyway via applyDates? months come from data ✓ skip clamp).

aimDay: input type=date change.

I think the design is complete. Now write it all out. Length estimate ~850 lines. Go.

While writing markup strings, keep them readable with indentation inside template literals (whitespace in HTML fine).

Also: define HTML-escaping of attribute values (esc used for dynamic).

Also add `<noscript>`? Not needed.

Let me write drawFrame(kind): 
```
function drawFrame(kind){
  const refused=kind==="refused", fault=kind==="fault";
  ROOT.className="instrument-host";
  ROOT.innerHTML=`<div class="instrument"><div class="ipad">
    <div class="ihead"><div class="stamp">${stampText()}</div></div>
    <div class="sentence">${refused?`One value in this link is not in this data, so no search was run. There is no number on this page to quote.`:fault?`The file did not answer just now. Nothing on this page is a number you can quote yet. <button class="ghost" data-retry type="button">Read it again</button>`:`Opening the file…`}</div>
    <div class="rails">${RAILS.map(r=>`<section class="rail closed" data-rail="${r[0]}"><div class="gut rest"><button type="button" class="restbtn" tabindex="-1"><span class="q">${r[1]}</span><span class="pn">${r[2]}</span></button></div><div class="strip"><span style="flex:1"></span></div></section>`).join("")}</div>
    <div class="margin"></div>
  </div></div>`;
}
```
refused gutter val: `all ${num(CORPUS)}, not your query` — add for refused: inside restbtn add `<span class="val">…</span>` ✓.

stampText(): if RANGE known: `FAA SERVICE DIFFICULTY REPORTS · ${pretty(RANGE.from).toUpperCase()} TO ${pretty(RANGE.to).toUpperCase()}` else just `FAA SERVICE DIFFICULTY REPORTS`.

drawInstrument main flow:
```
function drawInstrument(rootEl,rail,data){
  if(!rootEl)return;
  ROOT=rootEl;
  if(RAILS.some(r=>r[0]===rail))RAIL=rail;
  LOADING=(data==null);
  composeHero(data);
  if(LOADING){drawFrame("loading");return}
  if(HERO.refused){drawFrame("refused");return}
  MARGINS.length=0; buildMargins();
  ROOT.innerHTML=shellHTML();
  renderWhenExtras();   // rove init, scroll right, axis ticks
  renderMargin();
  if(PENDING_HOLD){aim(PENDING_HOLD);PENDING_HOLD=null}
}
```
PENDING_HOLD consumed after innerHTML (aim div exists) ✓ refresh sets after draw ✓.

shellHTML(): assembles ipad + seam; includes rails via railShellHTML with open body built from HERO.

Note when months render — HERO.months used directly.

buildMargins(): uses HERO.months last, swarm, blind.

Check partial: last month may not equal to-month if months array is full corpus — partial marks the month matching RANGE.to month ✓ find by m===toMonth.

Also if from/to filter active: months outside window n=0 (u absent) ✓ automatically from TREND_SEL (empty months) — TREND_SEL may return only windowed months; merge gives 0 for outside ✓.

But careful: TREND_SEL with NO filters equals corpus → n=all → u absent (n===all → skip u) — render u only when n<all ✓.

Where draws when hero.zones missing: facets zone facet — with filters, facets returns narrowed counts ✓ good.

Now — write aimTextFor with all kinds:
```
function aimTextFor(spec){
  const d=HERO; if(!d)return "";
  const [kind,a,b]=spec.split("|");
  if(kind==="month"){ const m=(d.months||[]).find(x=>x.m===a); if(!m)return "";
    return `${esc(monthName(a))} · ${num(m.n)} of ${num(m.all)} reports · click to take one month, drag for a period`; }
  if(kind==="period"){ const lo=Math.min(+a,+b),hi=Math.max(+a,+b); return bandText(lo,hi)+" · release to take it"; }
  if(kind==="zone"){ const z=(d.zones||[]).find(x=>x.code===a); const placed=(d.zones||[]).reduce((s,x)=>s+x.n,0);
    return `${esc(zoneLabel(a))} · ${num(z?z.n:0)} of ${num(placed)} placed findings · click to keep only this zone`; }
  if(kind==="pad") return a==="nowhere" ? `${num(d.no_location||0)} reports say nothing about where on the aircraft it was, so they cannot be drawn` : `${num(d.other_location||0)} reports name the place in words rather than with a zone number, so they cannot be drawn`;
  if(kind==="operator")return `${esc(opName(a))} · ${num(opCountOf(a))} reports · click to follow this airline`;
  if(kind==="tail")return `N${esc(a)} · ${num(tailCountOf(a))} reports · click to follow this one airframe`;
  if(kind==="crew"){ const c=(d.crew||[]).find(x=>x.code===a); return `${esc(crewLabel(a))} · ${num(c?c.n:0)} reports · click to keep only this`; }
  if(kind==="crewall")return `${num(d.crew_reports||0)} of ${num(TOTAL)} reports forced the crew to act`;
  if(kind==="openrail"){const r=RAILS.find(x=>x[0]===a);return r?`open the ${r[1]} rail — ${r[2]}`:""}
  return "";
}
```
opCountOf/tailCountOf: search ops/swarm arrays else facets.

Fine. Writing final code now. Also remember label mono dot separators: use `&middot;` in HTML — esc then concatenate: aim strings contain "·" directly fine (UTF-8).

Undo history edge: if user landed with filters already in URL, first take pushes → back returns to landing ✓.

Alright — also `window.addEventListener("popstate",...)`.

Also guard: chips × click inside chip with data-aim (hover) — fine.

Also number TOTAL===1 singular ✓.

Final check of "must narrow the whole page": after take, refresh re-renders instrument AND if host page reacts to URL (their search table reads location.search) — I also dispatch a custom event "hero:change" after refresh so host can listen? Cheap addition: `window.dispatchEvent(new CustomEvent("sdr:filters",{detail:{params:...}}))` — harmless, helpful. Include quietly.

Also if a table.reports exists AND host has its own search()? Not my concern; event covers it.

Write it.

Let me count IDs used: aimLine? I'll id "aimLine". months container id "months". track id "whenTrack". axis id "whenAxis". margin id "iMargin". aimKind, aimAt, aimDay, aimSug.

Suggestion markup rows: `.sug` with data-i.

Also add keyboard: input ArrowDown opens? Only when SUG non-empty ✓ as original.

Escape: sugClose + clearBand.

Alright — also the "hand" copy per rail + generic kbd.

Also picker aria: role="tablist", buttons role="tab" aria-selected.

Months container: role="listbox"? They're buttons — use role="group" + aria-label. Buttons have aria-label each ✓.

Zones: role="button" on paths — ok with tabindex 0.

Ladder/zl rows: real buttons ✓.

Time to write final. I'll aim for clarity and correctness over micro-optimizations. Ensure no stray backticks inside template literals (use &ldquo; entities or escaped quotes — using “ ” unicode chars directly is fine).

In hold messages I use typographic quotes — fine.

One risk: `composeHero` referencing FACETS before first facets fetch when host calls drawInstrument directly with data — guards everywhere (facetVals returns []).

Also `renderWhenExtras`: 
```
const track=el("whenTrack"); if(track){track.scrollLeft=track.scrollWidth}
axisTicks();
```
axisTicks(): N=months.length; if(!N)return; const track=el("whenTrack"); const w=track?track.scrollWidth:0; if(!w)return; const per=w/N; const every=Math.max(1,Math.ceil(46/(per*12))); const first=+months[0].m.slice(0,4); spans: months.forEach((m,i)=>{ if(m.m.endsWith("-01")){const y=+m.m.slice(0,4); if((y-first)%every===0) push span left=((i+0.5)/N*100)+"%" text y}}).
Set innerHTML.

Resize: debounce → axisTicks().

Edge: track.scrollWidth inside max-content child — the scrollw width = months width ✓ axis spans percentage of scrollw ✓ since axis inside scrollw with width 100% of scrollw which equals months width ✓.

months width: 380*(4)+379*1 = 1899px. gap 1 between → total = 380*4 + 379*1 = 1899. ✓ scrollWidth 1899.

On narrow phone, same scroll ✓ touch scroll unless pointer fine... @media(pointer:fine) touch-action none — phones are coarse → touch-action stays auto → vertical scroll OK but horizontal drag on strip would scroll natively while ALSO triggering my pointer drag → conflict: on coarse I use tap-tap pill, no drag — but pointerdown starts DRAG on coarse too! My pointerdown always paints band... On coarse, pointermove during native scroll is fine (scrolling cancels pointer events? pointercancel fires on scroll start ✓ → DRAG cleared ✓). Tap without move → pointerup → pill ✓. Good: coarse path never takes immediately ✓.

But desktop fine pointer: touch-action none prevents panning; drag works ✓; horizontal scroll of strip via wheel/shift? With touch-action:none only touch panning blocked; mouse wheel horizontal works (shift+wheel) and scrollbar visible (scrollbar-width:thin) ✓.

Hmm: pointerdown preventDefault on desktop prevents button focus — acceptable (aim via mouseover).

Also suppress the 1px click-through after drag on desktop: since months are buttons WITHOUT click handlers, pointerup does the take; no click conflict ✓ (I never bind click on .mo). But generic [data-take] delegation: .mo has no data-take ✓.

Wait — do .mo need data-aim only: yes data-aim="month|m" ✓ hover aim; focus aim ✓.

Also when strip: initial scroll to right end (newest) — but drag coordinates use scrollLeft ✓ handled.

OK writing now — FINAL. I'll produce the code block. Watch: the output must be ONLY the style+script blocks. I'll output:

<style>…</style>
<script>…</script>

Let me carefully write the JS in one pass with attention to syntax.

Also small: `el()` helper: document.getElementById.

Also FILTER_KEYS order for chips: fixed list order.

Also chips include hero param? no.

Write buildZones with facets fallback: facetVals("zone") items {value,n,label} → map code=value.

facetVals(key): 
```
function facetVals(key){
  const f=FACETS; if(!f)return [];
  const src=(f.facets||f.filters||f);
  let a=src&&src[key];
  if(a&&a.values)a=a.values; if(a&&a.buckets)a=a.buckets;
  if(Array.isArray(a))return a.map(x=>typeof x==="object"?{value:String(x.value??x.key??x.code??x.term??x.name??""),n:+(x.n??x.count??x.doc_count??0),label:x.label??x.name}:null).filter(Boolean);
  if(a&&typeof a==="object")return Object.entries(a).map(([value,v])=>({value,n:+(typeof v==="number"?v:(v&&v.n)||0),label:typeof v==="object"&&v?v.label:undefined}));
  return [];
}
```

buildOps(): HERO.operator_rows? normalize {key,label,n} : facetVals("operator").map({key:value,label,n}) sorted desc; cap? keep all (for pin lookup) but render top 14.
buildSwarm similar from "tail".
buildCrew(): HERO.crew || facetVals("crew") with labels crewLabel.

crewLabel(code): HERO crew entry label || gLook(["precautionary_procedure","precautionary","precaution","crew"]) || "code "+code.

jascLabel similar ["jasc","jasc_code","system","ata"]... ata separate gLook(["ata","ata_chapter"]).

zoneLabel(code): gLook(["part_location","zone","location"]) || "ZONE "+code; plus ZONE_DESC for aria fallback: label = gloss || `ZONE ${code}`; aria = `${label}${desc? " — "+desc:""} — ${num(n)} reports`.

opName(key): ops entry label || gLook(["operator","airline","carrier"]) || String(key).

Now let me finally write everything. I'll be disciplined about closing braces. Also `const COARSE=window.matchMedia("(pointer:coarse)")`.

Also `sum(arr)` helper.

Also careful: HERO.months built from TREND merges — hero may supply months even when refused? irrelevant.

Also at boot drawFrame("loading") before TREND_ALL fetched — composeHero(null) with FACETS null: RANGE empty → stampText without range ✓.

drawFrame uses MARGINS? no.

Also refused detection: raw.refused truthy or raw.unresolved length. Also maybe hero returns {error:...} → treat as fault? If hero fetch threw → fault ✓ via refresh catch. If returns refused flag → refused ✓.

After refused, chips still needed? Refused frame: chips row? The refused state says no search run; chips would help remove the bad value! Original refused frame has no chips but gutter says "not your query". I'll add chips to refused frame too — wait original didn't. Keep faithful: no chips; but the user is stuck (can't remove bad param without chips!). Original relied on page filters below. Mine must offer escape: add one ghost row in refused frame: active chips with × (so they can clear). I'll include chips block in refused frame — justified: otherwise dead end. ✓

OK writing final code.

def shellHTML structure:

```
`<div class="instrument">
  <div class="ipad${BUSY?" busy":""}" id="ipad">
    <div class="ihead">
      <div class="stamp">${esc(stampText())}</div>
      <div class="picker" role="tablist" aria-label="Which rail is open">${RAILS.map(([id,q,pn])=>
        `<button type="button" role="tab" aria-selected="${id===RAIL}" class="${id===RAIL?"on":""}" data-rail="${id}"><span class="q">${id==="forced"?"WHAT IT FORCED":q}</span><span class="pn">${pn}</span></button>`).join("")}</div>
    </div>
    <div class="sentence" id="iSentence">${sentenceHTML()}</div>
    ${chipsHTML()}
    <div class="aim" id="aimLine" aria-live="polite"></div>
    <div class="aimat">
      <label for="aimKind">Aim at</label>
      <select id="aimKind" aria-label="What kind of thing to look for">${AIMKINDS.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select>
      <input id="aimAt" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="aimSug" aria-autocomplete="list" placeholder="a month or a year, e.g. August or 2025">
      <button class="ghost" type="button" id="aimGo">Take it</button>
      <label class="aimday" for="aimDay">or one day<input id="aimDay" type="date" aria-label="One date"></label>
      <div class="aimsug" id="aimSug" role="listbox" hidden></div>
    </div>
    <div class="hand" id="iHand">${HAND[RAIL]||""}
      <span class="kbd kb-fine">Keyboard: tab to the open rail, arrows walk the months, Shift and an arrow extends, Enter takes it.</span>
      <span class="kb-coarse">Touch: tap a mark to look at it, then tap “take it”.</span></div>
    ${zeroHTML()}
    <div class="rails">${railShellHTML()}</div>
    ${specimenHTML()}
    <div class="margin" id="iMargin"></div>
  </div>
  ${seamHTML()}
</div>`
```

railShellHTML closed sections: include data-aim on restbtn.

Render margin: fill #iMargin.

Then when extras + SUGSRC build.

SUGSRC build (in draw): 
```
SUGSRC=[];
(HERO.months||[]).forEach(m=>SUGSRC.push({kind:"period",label:monthName(m.m),take:"month|"+m.m,n:m.n}));
(HERO.zones||[]).forEach(z=>SUGSRC.push({kind:"zone",label:zoneLabel(z.code),take:"zone|"+z.code,n:z.n}));
(HERO.crew||[]).forEach(c=>SUGSRC.push({kind:"crew",label:c.label,take:"crew|"+c.code,n:c.n}));
(HERO.ops||[]).forEach(o=>SUGSRC.push({kind:"operator",label:o.label||opName(o.key),take:"operator|"+o.key,n:o.n}));
(HERO.swarm||[]).forEach(a=>SUGSRC.push({kind:"tail",label:"N"+a.key,take:"tail|"+a.key,n:a.n}));
```

sugQuery(v): matches=SUGSRC.filter(label includes) cap 40; grouped paint.

takeSug(o): sugClose; takeFor(o.take) with hold set inside takeFor paths (monthTake etc. define holds) ✓ make takeFor always set hold messages:
- month: `narrowed to ${monthName}. undo`
- zone/operator/tail/crew: holds as above.
So takeFor centralizes holds; drag path calls monthsTakeIdx directly which sets its own ✓.

setFilter signature: setFilter(k,v,holdHTML).

takeFor:
```
function takeFor(spec){
  const parts=spec.split("|"); const kind=parts[0];
  if(kind==="month"){ monthTake(parts[1]); return }
  if(kind==="period"){ monthsTakeIdx(+parts[1],+parts[2]); return }
  if(kind==="zone"){ const z=(HERO.zones||[]).find(x=>x.code===parts[1]);
    setFilter("zone",parts[1],`kept only what was found in ${esc(zoneLabel(parts[1]))}. <button class="undoit" type="button">undo</button>`); return }
  if(kind==="operator"){ setFilter("operator",parts[1],`following ${esc(opName(parts[1]))}. <button...>undo</button>`); return }
  if(kind==="tail"){ setFilter("tail",parts[1],`following N${esc(parts[1])}. undo…`); return }
  if(kind==="crew"){ setFilter("crew",parts[1],`kept only reports where the crew ${esc(crewLabel(parts[1])).toLowerCase()}. undo…`); return }
}
```

monthTake(m): 
```
const [y,mo]=m.split("-").map(Number);
const last=lastDay(y,mo);
applyDates(`${m}-01`,`${m}-${pad2(last)}`,`narrowed to ${esc(monthName(m))}. undo`)
```

monthsTakeIdx(lo,hi): guard months; if lo>hi swap; m1=..., m2=...; from/to; hold `narrowed to A to B. undo`.

applyDates(from,to,hold): p=new URLSearchParams(location.search); p.set("from",from); p.set("to",to); PENDING_HOLD=hold; pushGo(p).

pushGo(p): const s=p.toString(); history.pushState({}, "", location.pathname+(s?"?"+s:"")); refresh(); dispatch later after refresh success? dispatch inside refresh success ✓.

dropParam(k,hold): p.delete(k); PENDING_HOLD=hold||`dropped ${LABEL[k]||k}. undo…`; pushGo.

aimGo click: as planned.

Also chip data-drop click: dropParam(k).

zeroHTML: 
```
if(TOTAL!==0)return "";
const loo=HERO.loo||[];
const cands=loo.slice(0,3).map(x=>`<button class="ghost" type="button" data-drop="${esc(x.drop)}">Drop ${esc(LABEL[x.drop]||x.drop)} &rarr; ${num(x.would_give)} reports</button>`);
if(!cands.length){ active().slice(0,3).forEach(k=>cands.push(`<button class="ghost" data-drop="${esc(k)}" type="button">Drop ${esc(LABEL[k]||k)}</button>`)) }
return `<div class="zero"><b>Nothing matches all of these at once.</b>${cands.length?`<div class="zg">${cands.join("")}</div>`:""}</div>`;
```
active(): FILTER_KEYS filter has.

specimenHTML: guarded.

seamHTML: hasTable? `<button class="seam" type="button" id="seamGo">Read the ${num(TOTAL)} &rarr;</button>` (total? else "Nothing to read yet") : "".

Wait seam with 0: "Nothing to read yet" — only if table exists... if total 0, seam "Nothing to read yet" still scrolls to table. Keep original behavior.

goResults(): t=table.reports; scrollTo top-58.

chipsHTML: active keys map; each `<span class="chip" data-aim="chip|k|v">`? aim for chips: skip aim (no handler for chip kind → aimTextFor returns "" → hover does nothing since aim only set when txt truthy ✓ guard `if(txt)`).

Margin render: MARGINS items {text,warn}.

buildMargins(): 
```
const to=RANGE.to||"";
if(to){ const tm=to.slice(0,7); const dd=+to.slice(8,10)||0;
  if(HERO.months.some(x=>x.m===tm) && dd && dd<lastDay(+to.slice(0,4),+to.slice(5,7))){
    MARGINS.push({warn:true,text:`${MONTHS[+to.slice(5,7)]} ${to.slice(0,4)} covers 1 to ${dd} ${MONTHS[+to.slice(5,7)]}, so its bar counts ${dd} days against ${lastDay(+to.slice(0,4),+to.slice(5,7))} in a whole one`}) } }
if((HERO.swarm_total||0)>HERO.swarm.length) MARGINS.push({text:`the aircraft ladder shows the ${num(HERO.swarm.length)} most-reported airframes out of ${num(HERO.swarm_total)}; the airline ladder counts every report`});
MARGINS.push({text:"counts are of reports filed, not of flights"});
const blind=blindKeys(); if(blind.length)MARGINS.push({text:`no rail draws ${blind.map(k=>LABEL[k]||k).join(", ")}; that part of the selection lives on the chips above`});
```

renderWhen closed val heldFor:
```
function heldFor(id){
 const p=params();
 if(id==="when"){ if(p.get("from")&&p.get("to")) return periodShort(); }
 if(id==="where"){ const z=p.get("zone"); if(z)return zoneLabel(z); }
 if(id==="whose"){ const o=p.get("operator"),t=p.get("tail"); return [o?opName(o):"",t?"N"+t:""].filter(Boolean).join(" · ") }
 if(id==="forced"){ const c=p.get("crew"); if(c)return crewLabel(c); }
 return "";
}
```
periodShort(): from/to same month → monthName; else `${monthName(from.slice(0,7))} – ${monthName(to.slice(0,7))}`.

Sentence clauses: periodClause etc as planned.

OK — I'm confident. Write the final artifact. Also keep an eye: avoid `<` inside JS strings causing HTML parse issues? Inside <script>, the sequence `</script>` must not appear — my template literals contain `</div>` etc — safe; only literal "</script>" forbidden ✓ avoid. Also avoid `<!--`. ✓

Also `document.write` none.

Also one more: `.rail.closed` click delegation: `e.target.closest(".rail.closed")` → setRail(dataset.rail) ✓ restbtn inside triggers same ✓.

Picker click: `e.target.closest(".picker button")` → setRail(btn.dataset.rail).

setRail(r): if(!RAILS.some)||r===RAIL return; RAIL=r; const p=params(); p.set("hero",r); PENDING_HOLD=null; pushGo(p) — pushGo triggers refresh which draws ✓.

popstate: RAIL=params().get("hero")||RAIL; refresh().

refresh(): also updates picker? full redraw ✓.

Also during refresh BUSY visual: refresh sets busy before fetch: el("ipad")?.classList.add("busy") — but drawFrame has no ipad id... fine guard. Implement setBusy(b){const i=el("ipad"); if(i)i.classList.toggle("busy",b)}.

Dispatch event after successful refresh: `window.dispatchEvent(new CustomEvent("sdr:change",{detail:{params:Object.fromEntries(params()),total:TOTAL,rail:RAIL}}))`.

Also after refresh, restore aim? cleared ✓.

aimGo: also if kind==="" and input empty → return.

sugClose on outside mousedown: if(!e.target.closest(".aimat")) sugClose ✓.

sug keyboard on #aimAt keydown: if SUG.length: ArrowDown/Up cycle paint; Enter: if SUGI>=0 take else default (form none → run aimGo? Enter with no selection: treat as Take it: e.preventDefault(); aimGoGo()). Original: Enter only when SUGI>=0 else... they had button; I'll call aimGoGo on Enter when no highlight ✓ nice.

Escape: sugClose.

paintSug(): rows; highlight class; aria-expanded true; when empty → close.

sug mousedown: row → take (o.n or any? allow zero? take anyway — a zero take is an answer). Original blocked zero rows in suggestions; mine: allow but display n; blocking zero hides "this year holds none" — my list comes from data with counts; include zero-count entries? SUGSRC entries with n=0 (months with 0) — allow, they're informative. Fine.

Also number formatting in sug rows: `<b>${num(n)}</b>`.

aimKind change: placeholder + if input has text re-run sug.

AIMPH placeholder map ✓.

Also aimDay min/max? leave.

parsePeriod month-name index: build MONTH_LO: MONTHS lowercased slice? match first 3+ letters: name.startsWith(q3).

Implementation:
```
function parsePeriod(v){
  v=v.trim().toLowerCase().replace(/\./g,"");
  let m;
  if((m=v.match(/^(\d{4})$/)))return mk(m[1]+"-01",m[1]+"-12",m[1]);
  if((m=v.match(/^(\d{4})-(\d{1,2})$/))){const y=m[1],mo=+m[2];if(mo<1||mo>12)return null;return mk(`${y}-${pad2(mo)}`,`${y}-${pad2(mo)}`,`${MONTHS[mo]} ${y}`)}
  const mm=v.match(/^([a-z]{3,})\s*,?\s*(\d{4})$/)||v.match(/^(\d{4})\s+([a-z]{3,})$/);
  if(mm){let name=mth, yr...; determine order}
  // month alone: latest occurrence in the file
  const mi=monthIndexFromName(v);
  if(mi){ let best=null; (TREND_ALL||[]).forEach(r=>{ if(+r.month.slice(5,7)===mi&&(!best||r.month>best))best=r.month });
    if(best){const y=best.slice(0,4);return mk(`${best}-01`,`${best}`,`${MONTHS[mi]} ${y}`)} }
  return null;
}
```
mk(loM,hiM,label): hi month → to date = lastDay. Handle two-pattern match: if mm[0] is letters → name=mm[1],year=mm[2]; else name=mm[2],year=mm[1]. Validate name via monthIndexFromName.

monthIndexFromName(s): s=s.toLowerCase(); for i 1..12: n=MONTHS[i].toLowerCase(); if(s===n||n.startsWith(s)&&s.length>=3)return i; return 0.

Good.

Now finally write. Also define pad2.

Also prettyDate: input "2025-08-20" → "20 AUG 2025" (stamp uses uppercase; sentence uses title case "20 Aug 2025"): make prettyDate return "20 Aug 2025"; stamp uppercases via CSS text-transform? stamp is mono caps letterspacing — CSS text-transform:uppercase on .stamp ✓ then prettyDate natural case.

stampText: `FAA SERVICE DIFFICULTY REPORTS · ${prettyDate(RANGE.from)} to ${prettyDate(RANGE.to)}` with CSS uppercase → "…· 1 MAR 1995 TO 20 AUG 2025" ✓ nice. Use "TO" word: original: `RANGE FROM TO RANGE.TO`. Use `· ${pretty(from)} to ${pretty(to)}` CSS uppercases ✓.

Alright, final write-out. I'll include modest comments. Let me produce.

(Also double check .rail grid closed: I set .rail.closed same grid 118px 1fr with rest button in col1 and strip col2 ✓ align-items:center.)

Whose rail body:
```
function bodyWhose(){
 const p=params(); const ops=HERO.ops||[]; const top=ops.slice(0,14);
 const oc=HERO.op_count||ops.length;
 const cur=p.get("operator");
 let rows=top.map(o=>opRow(o,cur===o.key));
 if(cur&&!top.some(o=>o.key===cur)){const f=ops.find(o=>o.key===cur);rows.unshift(opRow({key:cur,label:opName(cur),n:f?f.n:0},true,true))}
 const sw=HERO.swarm||[]; const curt=p.get("tail"); let srows=sw.slice(0,8).map(a=>tailRow(a,curt===a.key));
 if(curt&&!sw.some(a=>a.key===curt)){const f=sw.find(a=>a.key===curt);srows.unshift(tailRow({key:curt,label:"N"+curt,n:f?f.n:0},true,true))}
 return `<div class="track two wside">
   <div><div class="lhead">AIRLINES · ${num(oc)} IN THE FILE</div>
     <div class="ladder">${rows.join("")||emptyLadder("no airline survives this selection")}</div>
     <div class="lmore">${oc>top.length?`ranked here are the ${num(top.length)} most reported of ${num(oc)}; any other airline can be taken by name in the Aim-at box above`:""}</div></div>
   <div><div class="lhead">AIRCRAFT · MOST REPORTED</div>
     <div class="ladder">${srows.join("")||emptyLadder("no airframe survives this selection")}</div></div>
 </div>`;
}
```
opRow(o,taken): `<button type="button" class="lrow${taken?" taken":""}" data-aim="operator|${esc(o.key)}" data-take="operator|${esc(o.key)}"><span class="lb">${esc(o.label||opName(o.key))}</span><span class="bar"><i style="width:${w}%"></i></span><b>${num(o.n)}</b></button>` — width vs max of displayed rows (mx over top rows ∪ pinned). pinned unknown n=0 → width 0 bar empty + label "your selection"? If n unknown render b as "—" and no bar. Handle: if(o.pinned&&o.n===0) b text "—", bar width 0. Add title attr? fine.

emptyLadder(msg): `<div class="lmore">${esc(msg)}</div>`.

Forced body:
```
const cr=HERO.crew_reports||0; const pct=TOTAL?Math.min(100,cr/TOTAL*100):0;
const crew=(HERO.crew||[]).filter(c=>c.n>0).sort desc slice 12;
mx=max n;
rows...
`<div>
  <div class="fblock" data-aim="crewall"><div class="big"><i style="width:${pct}%"></i></div>
    <div class="fcap">${num(cr)} of ${num(TOTAL)} reports forced the crew to act</div></div>
  <div class="ladder">${rows.join("")||emptyLadder("no crew action survives this selection")}</div>
  ${(HERO.crew||[]).length>12?`<div class="lmore">the tail of the crew list is not ranked here</div>`:""}</div>`
```
crewRow same shape with data-take crew|code; label = c.label || crewLabel(code).

Where body:
```
function bodyWhere(){
 const taken=params().get("zone");
 return `<div class="track two drawside"><div>
   ${acSVG(taken)}
   <div class="zonenote">${zonenoteHTML()}</div></div>
  <div class="zl">${(HERO.zones||[]).map(z=>zlRow(z,z.code===taken)).join("")}</div></div>`;
}
```
zlRow swatch bg rampFill(z.code).

When body:
```
`<div class="track" id="whenTrack"><div class="scrollw">
  <div class="months" id="months" role="group" aria-label="Months from ${monthName(first)} to ${monthName(last)}">${HERO.months.map(moBtn).join("")}</div>
  <div class="axis" id="whenAxis"></div></div></div>`
```
moBtn(m,i): const cmax=... compute pre; heights: all=m.all/cmax*100, n=m.n/cmax*100; `<button type="button" class="mo${partial?" part":""}" tabindex="-1" data-aim="month|${m.m}" aria-label="${esc(monthName(m.m))}, ${num(m.n)} reports in this selection of ${num(m.all)}">${m.all?`<i style="height:${hAll}%"></i>`:""}${m.n&&m.n<m.all?`<u style="height:${hSel}%"></i>`... careful u closing.`}</button>` — u only when n<all ✓.

OK writing final answer now. Keep it complete and careful. Estimate ~900 lines. 

One more sanity: drawInstrument validates rail: if unknown rail passed use "when" ✓.

Also remember `LOADING` frame shouldn't include picker? Original loading state is the no-data frame — include picker? It had rails strips only + stamp + sentence. Mine same; picker absent ✓ (drawFrame).

In refused frame include chips (escape hatch) ✓.

Edge: drawFrame margins empty.

Go. Also final: define `let BUSY=false` used only via class; fine to drop variable, use DOM.

Writing the code — attention to every closing bracket. I'll mentally lint as I go.

Additional check — `params()` returns fresh URLSearchParams each call ✓.

`active()` helper: FILTER_KEYS.filter(k=>params().has(k)).

blindKeys(): DRAWN set; blind=active().filter(k=>!DRAWN.has(k)).

DRAWN=new Set(["from","to","zone","operator","tail","crew"]).

sentenceHTML():
```
function sentenceHTML(){
  const cls=selectionClauses();
  const n=num(TOTAL);
  if(TOTAL===0)return `Nothing matches all of these at once.`;
  if(!cls.length)return `Reading <span class="cn">${n}</span> reports.`;
  return `<span class="cn">${n}</span> reports — ${cls.join(", ")}.`;
}
```
Singular: if TOTAL===1 && cls.length → "1 report — …" handle: word = TOTAL===1?"report":"reports". Use in both branches: `Reading <span..>N</span> report${s}.` and `<span>N</span> report${s} — …`.

selectionClauses(): array strings (escaped content esc'd).

Let me write clause builders:
```
function selectionClauses(){
  const p=params(); const out=[];
  const per=periodClause(p); if(per)out.push(per);
  if(p.get("q"))out.push(`mentioning &ldquo;${esc(p.get("q"))}&rdquo;`);
  if(p.get("operator"))out.push(`filed by ${esc(opName(p.get("operator")))}`);
  if(p.get("tail"))out.push(`on airframe N${esc(p.get("tail"))}`);
  if(p.get("zone"))out.push(`found in ${esc(zoneLabel(p.get("zone")))}`);
  if(p.get("crew"))out.push(`where the crew ${esc(crewLabel(p.get("crew"))).toLowerCase()}`);
  if(p.get("jasc"))out.push(`on system code ${esc(p.get("jasc"))}`);
  if(p.get("ata"))out.push(`in ATA chapter ${esc(p.get("ata"))}`);
  if(p.get("part"))out.push(`on part ${esc(p.get("part"))}`);
  if(p.get("condition"))out.push(`with condition ${esc(p.get("condition"))}`);
  if(p.get("stage"))out.push(`at stage ${esc(p.get("stage"))}`);
  if(p.get("discovered"))out.push(`discovered ${esc(p.get("discovered"))}`);
  if(p.get("nature"))out.push(`of nature ${esc(p.get("nature"))}`);
  if(p.get("corrosion"))out.push(`with corrosion noted`);
  if(p.get("cracked"))out.push(`with cracking noted`);
  if(p.get("make"))out.push(`on aircraft of make ${esc(p.get("make"))}`);
  if(p.get("model"))out.push(`of model ${esc(p.get("model"))}`);
  if(p.get("minhours"))out.push(`at ${esc(p.get("minhours"))} hours`);
  return out;
}
```
periodClause(p): from,to values; if both: f=from,t=to; if f===t → `on ${prettyDate(f)}`; if same month → `in ${monthName(f.slice(0,7))}`; else `filed ${prettyDate(f)} to ${prettyDate(t)}`. only from → `filed from ${prettyDate(f)}`; only to → `filed through ${prettyDate(t)}`.

Good. Compose now. For attr values in data-take with quotes — esc handles double quotes ✓ values are simple codes anyway.

Final: write everything. Also `window.drawInstrument=drawInstrument;` exposure.

Also: after innerHTML, if RAIL==="when" call whenExtras; also `renderMargin()`; also build SUGSRC; also aimReset (aim("")). Also set placeholder.

Also `aimPlaceholder()` on draw.

I'll write it all now in the answer. Also make sure `<style>` has no `#hero-root` missing prefixes (pill excepted).

Also last check of drag band aim text: bandText defined before use.

Also the `HAND` map for whose: "Click an airline or an airframe to follow it." forced: "Click what the crew had to do." where: "Click a zone on the aircraft to keep only what was found there." when: "Drag across the months to take a period." ✓

Counting done — produce output.