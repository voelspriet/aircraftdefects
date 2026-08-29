```css
/* ==========================================================================
   SDR Desk — appearance block, whole replacement.
   Fault numbers in the comments map to the reviewer's list.
   ========================================================================== */
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap');

/* ---- Fault "palette": the original tokens, verbatim. Nothing else defines
   ink/paper/ash/rust/line anywhere in this block. ---- */
:root{
  --ink:#1d1d1f;
  --paper:#f7f5f0;
  --ash:#756f69;
  --smoke:#6b6560;
  --rust:#c44b28;
  --rust-text:#b8431f;
  --line:#e2ded5;
  --card:#fff;
}
*{box-sizing:border-box}

/* body hard-coded to #f2eee6 before; the token now wins */
body{
  margin:0;background:var(--paper);color:var(--ink);
  font:15px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}

.wrap{max-width:1180px;margin:0 auto;padding:16px 20px 70px}          /* 23 */
.skip{position:absolute;left:-9999px;top:0;background:var(--ink);color:#fff;padding:9px 14px;z-index:200;border-radius:0 0 4px 0}
.skip:focus{left:0}

/* ---- tabs (16: matches either id spelling, tab- or vtab-) ---- */
.tabs{display:block;border-bottom:1px solid var(--line);margin:10px 0 12px;padding-bottom:6px}
.vgroup{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
.vlab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
.vrow{display:flex;gap:2px;flex-wrap:wrap;flex:1;min-width:0}
.tab{padding:8px 13px;font-size:13px;cursor:pointer;border:1px solid transparent;color:var(--smoke);background:none;border-radius:3px}
.vrow .tab{padding:4px 10px;font-size:12.5px}
.tab.on{background:var(--card);border-color:var(--line);color:var(--ink);font-weight:600}
@media(max-width:900px){.vgroup{flex-direction:column;gap:2px}.vlab{flex:none;text-align:left}}

.scope{font-size:12.5px;margin:8px 0 2px;padding:6px 10px;border-radius:4px;line-height:1.5}
.scope.follows{background:#f2f5f1;color:#3f4a3c;border:1px solid #dfe6dc}
.scope.whole{background:#f6f4ef;color:var(--smoke);border:1px solid var(--line)}
.scope.whole.warn{background:#fdf3ee;color:#7c3a1f;border:1px solid #eec9b8}
.scope:empty{display:none}

/* ---- Fault 10/12/19: every control back on the original footing ---- */
input,select,button{font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink)}
select{width:100%;max-width:179px}                                    /* 10: uniform again */
.filters select{max-width:none}
button{cursor:pointer;background:var(--ink);color:#fff;border-color:var(--ink);text-align:center}
button.ghost{background:#fff;color:var(--ink)}
button:disabled{opacity:.5;cursor:default}

.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;
  background:var(--card);border:1px solid var(--line);padding:12px;border-radius:3px}
.filters>*{min-width:0}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--smoke)}
.filters .fld input{width:100%}
/* Fault 11: the twenty synthesised uppercase labels go; From/To keep theirs.
   (If the rebuild marks those two differently, scope the :not to them.) */
.filters label.fld:not(.fld-date)>span:first-child{display:none}
.morefilters{margin:8px 0 0;border:1px solid var(--line);border-radius:4px;background:var(--card)}
.morefilters>summary{cursor:pointer;padding:9px 12px;font-size:13px;color:var(--smoke);list-style:none;user-select:none}
.morefilters>summary::-webkit-details-marker{display:none}
.morefilters>summary::before{content:"\25B8";display:inline-block;margin-right:8px;transition:transform .15s;color:var(--ash)}
.morefilters[open]>summary::before{transform:rotate(90deg)}
.morefilters.active>summary{color:var(--rust);font-weight:600}
.filters.sub{border:0;border-top:1px solid var(--line);border-radius:0;background:transparent}
/* the two colours that exist nowhere in the original */
#mfCount{color:var(--smoke)}
#copied{color:var(--smoke)}

/* Fault 20: starters back above the form, by order in a flex column */
#p-search{display:flex;flex-direction:column}
#p-search>.scope{order:-3}
#p-search>.hint{order:-2}
#starters{order:-1}
.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.starter button{background:#fff;color:var(--ink);font-size:13px}
.starter button.extra{display:none}
.starter.all button.extra{display:inline-block}
.starter button.showmore{background:none;border:1px dashed var(--line);color:var(--smoke)}
.starter.flash{animation:flashin 1.4s ease-out}
@keyframes flashin{0%{background:#f6e3d8}60%{background:#f6e3d8}100%{background:transparent}}

.chips{margin:8px 0}
.chip{display:inline-block;background:#efece5;border-radius:10px;padding:2px 9px;font-size:12px;
  color:var(--smoke);margin:0 4px 4px 0;cursor:pointer;font-family:inherit}         /* 19 */
.chip:hover{background:#e6e1d8}
.chip b{cursor:pointer;margin-left:5px}
.chip.warn{background:#fdf3ee;border-color:#eec9b8;color:#7c3a1f}
.chip.warn em{font-style:normal;opacity:.75;margin-left:5px}
#chips,#count,.count{font-family:inherit}                              /* 19 */
.count{font-size:13px;color:var(--smoke)}

.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
input.tf{width:100%;max-width:340px;margin:6px 0 10px}

/* ---- headings ---- */
h2{font-size:22px;font-family:Archivo,system-ui,sans-serif;line-height:1.22;margin:0 0 10px}
h3{font-size:12px;margin:16px 0 6px;color:var(--ash);text-transform:uppercase;letter-spacing:.06em}
.panel h1,.psub~h2{font:700 22px/1.22 Archivo,system-ui,sans-serif;margin:0 0 10px}
.lede,.psub,.lead{font-size:14px;color:var(--smoke);margin:0 0 10px;max-width:820px}
.card{background:var(--card);border:1px solid var(--line);border-radius:3px;padding:14px;margin:10px 0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.muted{color:var(--ash);font-size:12px}
.note{font-size:11.5px;line-height:1.5;margin:0 0 8px}

/* ---- Fault 15: the instrument keeps its frame ---- */
.instrument{position:relative;background:var(--paper);border:1px solid var(--line);
  border-bottom:3px solid var(--rust);border-radius:6px;margin:12px 0 0;overflow:hidden}
.instrument .ipad{padding:14px 20px 8px}
.ihead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.stamp{font:600 10.5px/1.3 Archivo,system-ui,sans-serif;letter-spacing:.18em;color:var(--ash);text-transform:uppercase}
.picker{display:flex;gap:2px;background:rgba(29,29,31,.05);border-radius:6px;padding:3px;flex:none}
.picker button{border:0;background:none;padding:4px 10px 3px;border-radius:4px;cursor:pointer;
  display:flex;flex-direction:column;align-items:flex-start;gap:1px;border-bottom:2px solid transparent}
.picker .q{font:600 10.5px/1.1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:#5c554c}
.picker .pn{font-size:9.5px;color:#5f584f}
.picker button.on{background:#fff;border-bottom-color:var(--rust)}
.picker button.on .q{color:var(--rust-text)}

/* the standing sentence, rebuilt classes mapped onto the original's rules */
.stand.rv-sentence,.sentence{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.1;
  color:var(--ink);max-width:26em;margin:7px 0 0}
.rv-count,.sentence .fig{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:500;
  font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text)}
.rv-aside,.sentence .aside{font-size:.62em;color:var(--ash)}
.sentence .broken{display:block;font-size:.5em;color:var(--rust)}
.rv-clause,.sentence .clause{border:0;background:none;padding:0;font:inherit;color:inherit;
  border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer;text-align:left}
.rv-clause:hover,.rv-clause:focus-visible{color:var(--rust);border-bottom-color:var(--rust)}

.aim{min-height:20px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;
  color:var(--rust-text);margin-top:6px;line-height:20px}
.aim .undoit{background:none;border:1px solid rgba(196,75,40,.5);color:var(--rust-text);border-radius:4px;
  padding:1px 8px;margin-left:8px;cursor:pointer;font:inherit;font-size:12px}
.hand{font:600 13px/1.4 Archivo,system-ui,sans-serif;color:var(--ink);margin-top:2px}
.hand .c{font-weight:400;color:var(--smoke)}

.aimat{display:flex;align-items:center;gap:8px;margin-top:7px;position:relative;flex-wrap:wrap}
.aimat label{font:600 10.5px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);text-transform:uppercase}
.aimat input{flex:1;max-width:340px;padding:5px 9px;font-size:13px}
.aimat button{padding:5px 11px;font-size:12px}
.aimat select{max-width:150px;font-size:12.5px;padding:5px 6px}
.aimday{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--smoke)}
.aimday input{font-size:12px;padding:2px 4px}
.aimopts{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}
.aimopts button{display:inline-flex;gap:7px;align-items:baseline;padding:4px 10px;font-size:12.5px}
.aimopts em{font-style:normal;color:var(--ash);font-size:11.5px}
.aimsug{position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:40;background:#fff;border:1px solid var(--line);
  border-radius:6px;box-shadow:0 8px 24px rgba(20,16,12,.13);max-height:290px;overflow-y:auto;min-width:430px}
.aimsug[hidden]{display:none}
.sug{display:flex;align-items:baseline;gap:9px;padding:6px 11px;cursor:pointer;border-bottom:1px solid #f2efe9}
.sug:hover,.sug.on{background:#f6f2ec}
.sug .sk{flex:0 0 132px;font:600 9.5px/1.5 Archivo,system-ui,sans-serif;letter-spacing:.07em;color:#fff;
  background:#8d857b;border-radius:3px;padding:1px 6px;text-align:center}
.sug .sl{flex:1;min-width:0;font-size:13.5px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sug b{font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--ash)}
.sughead{font:600 9.5px/1.7 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:#fff;padding:1px 11px;position:sticky;top:0;z-index:1}
.sughead.sk-operator{background:#8c4a2f}.sughead.sk-tail{background:#3f6b57}
.sughead.sk-period{background:#4a5d80}.sughead.sk-zone{background:#7a5a2e}
.sughead.sk-jasc{background:#5d4a72}.sughead.sk-q{background:#6f6a63}
@media(max-width:700px){.aimsug{min-width:0}.sug .sk{flex-basis:96px;font-size:8.5px}}

.zero{margin:8px 0 2px;padding:9px 12px;background:#fdf3ee;border:1px solid #eec9b8;border-radius:4px;
  font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}

/* ---- rails ---- */
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:186px 1fr;gap:12px;align-items:center;
  padding:5px 0;border-top:1px solid var(--line);cursor:pointer}
.rail.open{cursor:default;align-items:start;padding:7px 0 8px}
.rail .gut{min-width:0}
.rail .gut .q,.rail .gut b{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ink)}
.rail .gut .pn,.rail .gut .gs{font-size:9.5px;color:var(--ash)}
.rail .gut .val,.rail .gut .gv{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--rust-text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}          /* 8 */
.rail .track{min-width:0;position:relative}
.rail .track.two{display:grid;grid-template-columns:1fr 330px;gap:18px}

/* WHEN — fault 4: never clipped. The strip scrolls instead of shrinking. */
.rail .months{display:flex;gap:2px;align-items:flex-end;min-width:0}
.rail .mo{position:relative;flex:1 1 0;min-width:0;cursor:pointer}
.rail.open[data-rail=when] .track{overflow-x:auto;overscroll-behavior-x:contain;touch-action:pan-x}
.rail.open[data-rail=when] .months,
.rail.open[data-rail=when] .axis{min-width:max(100%,calc(var(--mw,380) * 9px))}
.rail.open[data-rail=when] .mo{flex:0 0 9px;min-width:9px}
.mo i{position:absolute;bottom:0;left:0;right:0;display:block;border-radius:1px}
.mo .ghostb{background:#d8d2c6}
.mo .selb{background:var(--rust)}
.mo:hover .ghostb,.mo.lit .ghostb{background:#c3bbac}
.mo.part .ghostb{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,var(--paper) 3px 6px)}
.mo.lit{outline:1.5px solid var(--ink);outline-offset:1px}
.mo .parth{background:repeating-linear-gradient(45deg,transparent 0 3px,var(--paper) 3px 6px);pointer-events:none}
.axis{display:flex;gap:2px;margin-top:3px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--ash)}
.axis span{flex:1;min-width:0;text-align:left}
.whenhint{font:11.5px/1.4 Archivo,system-ui,sans-serif;color:var(--ash);margin-top:3px}
.mag{position:absolute;left:0;right:0;bottom:16px;height:84px;pointer-events:none}
.magnote{position:absolute;right:0;top:-2px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  color:var(--rust-text);background:var(--paper);padding:0 4px}

/* WHERE */
.plane{width:100%;max-width:640px;height:auto}
.zone{cursor:pointer;transition:stroke .1s}
.zone:hover{stroke:var(--rust);stroke-width:2.2}
.zone.lit{stroke:var(--rust);stroke-width:2.4}
.legend{font-size:12px;display:flex;flex-direction:column;gap:1px}
.lrow{display:grid;grid-template-columns:13px 1fr auto;gap:8px;align-items:center;cursor:pointer;
  padding:1px 4px;border-radius:3px}
.lrow:hover{background:rgba(196,75,40,.08)}
.lrow i{width:12px;height:12px;border-radius:3px;border:1px solid #d8d2c6}
.lrow i.padi{background:repeating-linear-gradient(45deg,#d8d2c6 0 2px,var(--paper) 2px 4px)}
.lrow b{font-family:'IBM Plex Mono',monospace;font-weight:400;color:#5f584f}
.lsplit{border-top:1px dotted var(--ash);margin:4px 0 3px}
.zonenote{font-size:11.5px;color:#5f584f;line-height:1.45;margin-top:7px;padding-top:6px;border-top:1px solid var(--line)}

/* WHOSE and FORCED — fault 8: room for the whole label, ellipsis only as a
   last resort, never a mid-word clip */
.col .ch{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash);margin-bottom:3px}
.orow{display:grid;grid-template-columns:190px 1fr 56px;gap:8px;align-items:center;font-size:12px;
  cursor:pointer;padding:0 3px;border-radius:3px;height:17px}
.orow:hover{background:rgba(196,75,40,.08)}
.orow .on{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.orow .ob{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.orow .ob i{display:block;height:100%;background:var(--rust)}
.orow b{font-family:'IBM Plex Mono',monospace;font-weight:400;text-align:right;color:#5f584f}
.orow.more{cursor:default}
.fblock{position:relative;height:22px;background:#e8e3d8;border-radius:3px;overflow:hidden;display:flex;align-items:center}
.fblock i{position:absolute;left:0;top:0;bottom:0;background:var(--rust)}
.fblock .flab{position:relative;padding-left:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
.frows{margin-top:6px}
.fnote{font-size:11px;color:var(--ash);margin-top:4px}
.restbar{height:6px;background:#e8e3d8;border-radius:3px;overflow:hidden}
.restbar i{display:block;height:100%;background:var(--rust)}
.rail[data-rail=forced].open .fblock{margin-bottom:7px}
.rail[data-rail=when] .strip,.rail[data-rail=whose] .strip{display:flex;gap:1px;height:12px}
.strip span{background:#d8d2c6;border-radius:1px}
.strip span.sel{background:var(--rust)}
.rail:not(.open):hover .strip span{background:#c3bbac}

/* open-rail reading + specimen + margin */
.reading{margin:9px 0 0;padding:8px 12px 8px 13px;border-left:2px solid var(--rust);
  background:#faf7f3;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);max-width:74ch}
.specimen{margin-top:8px;border-top:1px solid var(--line);padding-top:6px}
.specimen .sh{font:600 10.5px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;color:var(--ash)}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;color:#403b35;
  margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.specimen.opens{cursor:pointer;border-radius:5px;margin:0 -8px;padding:4px 8px 5px}
.specimen.opens:hover{background:#f3efe8}
.opencue{color:var(--rust-text);font-weight:600;white-space:nowrap}
.spec-decoded{font:600 12.5px/1.5 Archivo,system-ui,sans-serif;color:var(--rust-text);margin:2px 0 3px}
.margin{margin-top:6px;border-top:1px solid var(--line);padding:5px 0 2px 0;
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5f584f;line-height:1.5}
.margin span{display:block}
.margin span+span{margin-top:2px}
.margin .rustnote{color:var(--rust-text)}

.seam{display:block;margin:8px 0 0 auto;height:34px;border:0;background:var(--rust);color:#fff;
  font:600 12px/1 Archivo,system-ui,sans-serif;padding:0 18px;cursor:pointer;border-radius:5px 0 0 0}
.seam:hover{background:#a83d1f}

/* ---- the seam above the results: fault 5, sticky; it must be a SIBLING of
   the horizontal scroller, as the original places .cut outside .tscroll ---- */
#results{overflow-x:visible}
#rr-scroll,.tscroll{overflow-x:auto}
#rr-scroll table,.tscroll table.reports{min-width:760px;width:100%}      /* 6 */
.cut{position:sticky;top:0;z-index:6;background:var(--paper);border-top:2px solid var(--rust);
  padding:8px 10px;display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap}
.cut .cs{font-family:'Instrument Serif',Georgia,serif;font-size:20px;line-height:1.2;color:var(--ink);flex:1 1 320px;min-width:280px}
.cut .cs .fig{font-family:'IBM Plex Mono',monospace;color:var(--rust-text);font-size:.9em}
.cut .cm{display:flex;gap:14px;align-items:baseline;flex:0 1 auto;min-width:0;flex-wrap:wrap;
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#5f584f}
.cut .cm .lit{color:var(--ink)}
.cut .cm .lit::before{content:"\2022 ";color:var(--rust)}
.cut .backup{border:0;background:none;color:var(--rust-text);cursor:pointer;font:inherit;font-size:10.5px;padding:0}
tr.spine td,tr.hdr td{position:sticky;top:0;z-index:5;background:#f2eee6;border-top:1px solid var(--rust);
  padding:4px 10px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink)}
tr.spine b{font-weight:400;color:#5f584f;margin-left:10px}
@media(max-width:900px){.cut{gap:4px}.cut .cs{font-size:16px;min-width:0;flex:1 1 100%}}

/* ---- the results table: faults 13 and 14 ---- */
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);font-size:13px}
table th{text-align:left;padding:8px 9px;border:0;border-bottom:1px solid var(--line);
  font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash);white-space:nowrap;height:auto}
table td{padding:8px 9px;border-bottom:1px solid #f0ede6;vertical-align:top;font-weight:400;
  font-family:inherit;font-size:13px}                                    /* 13/14 */
tr:hover td{background:#fbfaf7}
.c{color:var(--ink);cursor:pointer;border-bottom:1px solid transparent}
.c:hover{color:var(--rust);border-bottom-color:rgba(196,75,40,.55)}
tr:hover .c{border-bottom-color:#ddd7cc}
table.reports tr.rep td:nth-child(5) .c{color:var(--rust)}
.term{border-bottom:1px dotted #d3ccc1;cursor:help}
.c.dull{color:var(--ash)}
.c.dull:hover{color:var(--rust)}
.absent{color:var(--ash);font-style:italic}
.warnline{font-size:11.5px;color:#7c3a1f;background:#fdf3ee;border-radius:3px;padding:2px 6px;margin-top:3px;display:inline-block}
tr.anon td{color:var(--ash)}
tr.divider td{background:#faf7f1;color:var(--smoke);font-size:12px;line-height:1.5;padding:9px 12px;border-top:2px solid var(--line)}
tr.empty td{padding:26px 16px;background:#faf8f4;border-bottom:0}
tr.empty p{margin:0 0 12px;font-size:14px}
mark.hit{background:#ffe9c9;color:inherit;border-radius:2px;padding:0 1px}
button.c{border:0;background:none;padding:0;font:inherit;color:inherit;text-align:left;cursor:pointer}
table.kv{width:100%;border-collapse:collapse}
table.kv th{text-align:left;width:210px;vertical-align:top;padding:9px 12px 9px 0;font-weight:600;color:var(--ash);border-bottom:1px solid var(--line)}
table.kv td{padding:9px 0;vertical-align:top;border-bottom:1px solid var(--line)}
table.codes{width:100%;border-collapse:collapse;margin-bottom:22px}
table.codes td{padding:6px 10px 6px 0;border-bottom:1px solid var(--line);vertical-align:top}
table.codes td:first-child{width:92px}
.quote{background:#faf8f4;border-left:2px solid #e0d9cc;padding:10px 12px;border-radius:4px;
  font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.55;white-space:pre-wrap}
.srclinks{margin:0;padding-left:17px}
.srclinks li{margin:5px 0;line-height:1.5}
.srclinks a{color:var(--rust-text)}
.bardivider{grid-column:1/-1;font-size:11.5px;color:var(--smoke);border-top:1px solid var(--line);padding-top:6px;margin-top:4px;display:block}
.bars>div{display:grid;grid-template-columns:230px 1fr 78px;align-items:center;gap:8px}
.bars .k{display:flex;gap:6px;align-items:baseline;min-width:0}
.bars .k .kt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bars .t{flex:1;min-width:60px;display:block;background:#efece4;border-radius:3px}
.bars .b{display:block;height:11px;min-width:2px;background:var(--rust);opacity:.75;border-radius:2px}
.bars .n{width:auto;flex:none;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:760px){.bars>div{grid-template-columns:130px 1fr 62px}.two{grid-template-columns:1fr}}
.pill{display:inline-block;background:#efece5;border-radius:10px;padding:2px 9px;font-size:12px;color:var(--smoke);margin:0 4px 4px 0;cursor:pointer}

/* ---- the write-up band: fault 21, no fixed heights, the clamp rules ---- */
table.reports tr.rep td{border-bottom:0;padding-bottom:4px}
table.reports tr.wrote td{padding:0 0 14px;border-bottom:1px solid var(--line)}
.wu{background:#faf8f4;border-left:2px solid #e0d9cc;padding:8px 12px;cursor:pointer;position:relative}
.wu:hover{border-left-color:var(--rust)}
.wu .txt{font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.6;white-space:pre-wrap;
  color:#403b35;max-width:104ch;height:auto;max-height:none}              /* 21 */
.wu.clip .txt{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.wu.clip.long .txt{padding-bottom:4px}
.wu.clip.long::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22px;
  background:linear-gradient(180deg,rgba(250,248,244,0),#faf8f4)}
.wu-gloss{position:relative;z-index:1;margin-top:6px}
.wu-gloss button,.wu-toggle{position:relative;font-size:11.5px;padding:3px 9px;background:#fff;
  color:var(--ink);border:1px solid var(--line);border-radius:3px;cursor:pointer;z-index:1}
.wu+.wu{margin-top:6px}
.swipehint{display:none;font-size:12px;color:var(--smoke);margin:0 0 6px}
@media(max-width:1100px){.wu .txt{max-width:none}.wu.clip .txt{-webkit-line-clamp:5}
  table.reports tr.wrote .wu{position:sticky;left:0;width:calc(100vw - 44px);max-width:calc(100vw - 44px)}}
@media(max-width:900px){
  table.reports tr.rep td:first-child,table.reports th:first-child{position:sticky;left:0;z-index:2;
    background:var(--card);box-shadow:1px 0 0 var(--line)}
  table.reports tr:hover td:first-child{background:#fbfaf7}}

/* ---- faults 1 and 3: the case sheet is an overlay, always, at any width.
   Whatever element carries it renders fixed to the viewport; nothing is
   inserted into the page flow. ---- */
#case-wrap,.case-overlay{
  position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;
  overscroll-behavior:contain;align-items:flex-start;justify-content:center;
  padding:32px 16px;overflow:auto;display:none}
#case-wrap.open,.case-overlay.open{display:flex}
#case-box,.case-overlay>.case-card{
  background:#fff;max-width:min(880px,66vw);width:100%;border-radius:12px;padding:24px 28px;
  box-shadow:0 24px 60px rgba(0,0,0,.3);margin:0 auto}                    /* 1/3 */
#case-box .eyebrow-k{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.04em;color:var(--ash);margin-bottom:3px}
#case-box h2{font-size:21px;line-height:1.25}
#case-box .route{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash);margin:2px 0 10px}
#case-box .bigq{margin:0 0 14px;padding:12px 16px;background:#faf8f4;border-left:3px solid var(--rust);
  font-family:'IBM Plex Mono',monospace;font-size:15px;line-height:1.55;color:#2e2a26;white-space:pre-wrap}
#case-box .publish{background:#fdf3ee;border:1px solid #eec9b8;border-radius:5px;padding:10px 14px;
  margin:0 0 14px;font-size:12.5px;line-height:1.5}
#case-box .publish b{display:block;margin-bottom:4px;color:#7c3a1f}
#case-box .publish ul{margin:0;padding-left:17px}
/* fault 22: the action bar pins to the top of the sheet */
#case-box .case-actions,.case-actions{
  position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;
  background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid var(--line)}
#case-box .case-actions [data-copy="close"],#case-box .case-actions button:last-child{margin-left:auto}
#case-box .step{display:flex;align-items:center;gap:6px;margin-right:auto;
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--ash)}
@media(max-width:900px){#case-box{max-width:100%}}
@media(max-width:520px){#case-box table.kv th,#case-box table.kv td{display:block;width:auto;padding:6px 0;border-bottom:0}
  #case-box table.kv td{border-bottom:1px solid #eef1f4;margin-bottom:6px}}

/* ---- fault 7: focus is always visible, on paper and on ink ---- */
:is(button,[role="button"],.tab,.clause,.rv-clause,.mo,.zone,.orow,.lrow,a[href],summary):focus-visible{
  outline:2px solid var(--rust);outline-offset:2px;border-radius:2px}
.zone:focus-visible{outline:none;stroke:var(--ink);stroke-width:3;filter:drop-shadow(0 0 0 2px var(--paper))}
.mo:focus-visible,.orow:focus-visible,.lrow:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.freshness{margin:10px 0 2px;text-align:center;font-size:12px;color:var(--smoke);letter-spacing:.02em}
.credit{margin:2px 0 10px;text-align:center;font-size:12px;color:var(--smoke)}
.credit a{color:inherit;text-decoration:underline;text-underline-offset:2px}

/* ---- fault 2: the phone instrument, at 390px ---- */
@media(max-width:760px){
  .instrument{border-radius:0;margin:0 -20px;border-left:0;border-right:0}
  .instrument .ipad{padding:10px 14px 6px}
  .ihead{flex-direction:column;gap:8px}
  .stand.rv-sentence,.sentence{font-size:26px}
  .aimat input{max-width:none;flex:1 1 100%}
  .rails{gap:0}
  .rail{grid-template-columns:1fr;gap:4px;padding:8px 0;align-items:stretch}
  .rail .track.two{grid-template-columns:1fr;gap:10px}
  .rail .gut{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .rail .gut .gv{white-space:normal}
  /* months become 44px tappable columns; the strip scrolls sideways */
  .rail.open[data-rail=when] .mo{flex:0 0 44px;min-width:44px;height:64px}
  .rail.open[data-rail=when] .months{gap:3px}
  .mo i{border-radius:2px}
  .orow{grid-template-columns:1fr 52px;grid-template-areas:"n n" "b c";row-gap:2px;
    height:auto;min-height:52px;align-content:center;padding:6px 3px}
  .orow .on{grid-area:n;white-space:normal;overflow:visible;text-overflow:clip}
  .orow .ob{grid-area:b}
  .orow b{grid-area:c}
  .orow.more{min-height:44px}
  .fblock{height:26px}
  .legend .lrow{min-height:44px}
  .seam{position:static;width:100%;border-radius:0;height:44px;margin-top:8px}
  .wrap{padding:12px 14px 70px}
  .cut .cs{font-size:16px;min-width:0;flex:1 1 100%}
  .aimat button,.chipbtn{min-height:44px}
  .chipbtn{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer}
  .phpresets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
}

/* reduced motion, forced colours */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important;scroll-behavior:auto!important}
  .starter.flash{animation:none;background:#f6e3d8}
}
@media(forced-colors:active){
  .mo .ghostb,.mo .selb,.strip span,.orow .ob i,.fblock i{forced-color-adjust:none;border:1px solid CanvasText}
  .zone{stroke:CanvasText}
}
```

What changed, fault by fault:

- **Palette** — the token block is the original's verbatim; `body` reads `var(--paper)` instead of `#f2eee6`; the purple More-filters counter and green "copied" text are pinned to `--smoke`. Every `rgb(34,32,28)`/`rgb(33,29,20)` paint disappears once nothing else defines those colours — delete any remaining hard-coded hexes in the rebuild's own rules, they are now dead.
- **2 — phone at 390px**: a full ≤760px block: rails stack, months become 44px scrollable columns, `.orow` goes two-line like the original's `.phrow`, the seam goes full-width, everything tappable is ≥44px.
- **1 & 3 — case sheet**: `#case-wrap` (or whatever container carries the sheet) is `position:fixed; inset:0` with the original scrim, opened by `.open`; the card is capped at `min(880px,66vw)`. Nothing is inserted into the flow, so it opens in view at every width. **One JS line is still needed**: create/wrap the sheet in `#case-wrap` (append it to `body`) and toggle `.open` in `openCase()`/`closeCase()`, as the original does.
- **4 — month strip**: `overflow-x:auto` on the open WHEN track, `--mw`-driven `min-width`, 9px floor per bar, so 380 bars scroll instead of clipping.
- **5 — seam and headers**: `.cut` is sticky at `top:0` and must be a **sibling** of `#rr-scroll`, not inside it (the original places `.cut` outside `.tscroll` for exactly this reason — one-line markup move if it currently sits inside). `tr.hdr`/`tr.spine` get the rust top rule and sticky `top:0`.
- **6** — `.wrap` back to 1180 and the table's `min-width:760px; width:100%`, so the Case-sheet button is inside the viewport at 1100.
- **7** — one global `:focus-visible` ring in `--rust` (ink for rails/zones), and buttons are `#fff` on `--ink`, so "Take it" is no longer a dark rectangle.
- **8** — `.orow` label column 190px with real ellipsis; the open gutter value ellipsises too; at 390px labels wrap onto their own row instead of clipping.
- **9 — stepper**: CSS cannot reach this. In the sheet render, compute `idx = CASE_ORDER.indexOf(id)` fresh each time and print `idx+1 of CASE_ORDER.length`; disable the previous arrow when `idx<=0`.
- **10–14, 19, 21** — controls, buttons, table cells, `th`, chips and count restored to the original's face, size, colour and border; the synthesised filter labels hidden; write-up fixed heights removed in favour of the 3-line clamp.
- **15, 20, 23, 25** — instrument frame restored, starters reordered above the form via flex order, column back to 1180px; height returns to the original's range as a consequence.
- **16, 17, 18, 24** — these are DOM, not appearance, and need three one-liners: restore `id="tab-p-search"` (CSS now matches either spelling meanwhile), make the panel headings `h1`, use `×` and ISO dates in chips, and re-add the `aria-label`s the rebuild dropped.