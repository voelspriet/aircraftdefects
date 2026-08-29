# Two reviews, 29 August 2026

Two agents drove the original and the rebuild side by side in a browser and
reported faults, one on CSS and one on layout. Neither was allowed to fix
anything: the point was a work list, not a patch.

Thirty-four faults between them. What they found that four of my own harnesses
had not:

**The rebuild runs a different palette.** `#hero-root` redefines every token:
ink `#211d14` against `#1d1d1f`, rust `#a8431f` against `#c44b28`, paper
`#f2eee6` against `#f7f5f0`. The page paints `rgb(34,32,28)` 5,739 times where
the original paints ink. I had been correcting elements one at a time and getting
eight of eight type measurements green while the system under them was a
different one. That is also where the purple and the green came from: with the
palette wrong, something reaches for a colour that looks about right.

**There is no phone layout.** The original swaps at 390px to tappable month
chips, a zone grid and a sticky bar. The rebuild renders four desktop rails at
350px wide.

**At 390px the case sheet opens 5,693px above the viewport.** A reader taps and
nothing appears to happen.

**The month strip is clipped with no way to scroll it**: 24% hidden at 820px,
54% at 390px, where the original scales the strip to the track at every width.

**The seam and the column headers do not stick.** Through 19,000px of records the
reader has eleven unlabelled columns and no running count.

**Seven focus rings are invisible**, one of them at contrast 1.00:1: ink on ink.

Full reports: `css.md` and `layout.md`.
