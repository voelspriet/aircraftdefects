# The reference, measured

Written by driving the original at 1440px with zone ZONE 500 and December 2025,
and reading the computed style of each element rather than guessing at it. Where
the rebuild differs from a line here, the line is what it should be.

| element | selector | type | colour | height |
|---|---|---|---|---|
| de staande zin | `.sentence, .stand, #iSentence` | Instrument Serif 34px/37.4px 400 | rgb(29, 29, 31) | 37px |
| een clausule erin | `.clause` | Instrument Serif 34px/37.4px 400 | rgb(29, 29, 31) | 46px |
| het getal erin | `.fig` | IBM Plex Mono 31.28px/34.408px 500 | rgb(184, 67, 31) | 41px |
| de aside | `.aside` | Instrument Serif 21.08px/23.188px 400 | rgb(117, 111, 105) | 28px |
| de railkiezer | `.picker` | -apple-system 15px/23.25px 400 | rgb(29, 29, 31) | 42px |
| een tab | `.picker button` | -apple-system 15px/23.25px 400 | rgb(255, 255, 255) | 36px |
| de aim-regel | `.aim, #iAim` | IBM Plex Mono 13px/20px 400 | rgb(184, 67, 31) | 20px |
| de handregel | `.hand, #iHand` | Archivo 13px/18.2px 600 | rgb(29, 29, 31) | 18px |
| de gutter, open | `.rail.open .gut` | -apple-system 15px/23.25px 400 | rgb(29, 29, 31) | 46px |
| de gutter, dicht | `.rail:not(.open) .gut` | -apple-system 15px/23.25px 400 | rgb(29, 29, 31) | 16px |
| een ladderrij | `.orow` | -apple-system 11.5px/17.825px 400 | rgb(29, 29, 31) | 14px |
| de leesalinea | `.reading` | Georgia 15px/22.5px 400 | rgb(29, 29, 31) | 61px |
| de marge | `.margin, #iMargin` | IBM Plex Mono 11.5px/17.25px 400 | rgb(95, 88, 79) | 45px |
| het specimen | `.specimen` | -apple-system 15px/23.25px 400 | rgb(29, 29, 31) | 64px |
| de decodeerregel | `.spec-decoded` | Archivo 12.5px/18.75px 600 | rgb(184, 67, 31) | 19px |
| de naadknop | `.seam, .readall, .bigread` | Archivo 12px/12px 600 | rgb(255, 255, 255) | 34px |
| een recordrij | `table.reports tr.rep` | -apple-system 13px/20.15px 400 | rgb(29, 29, 31) | 72px |
| de write-up | `.wu` | -apple-system 13px/20.15px 400 | rgb(29, 29, 31) | 56px |
| een cel erin | `table.reports tr.rep td` | -apple-system 13px/20.15px 400 | rgb(29, 29, 31) | 72px |

## What each one says here

- **de staande zin** — 145 reports, left wing, December 2025. 1,757,682 set aside.
- **een clausule erin** — left wing
- **het getal erin** — 145
- **de aside** — 1,757,682 set aside.
- **de railkiezer** — WHEN month by month WHERE on the aircraft WHO airline and tail WHAT IT
- **een tab** — WHEN month by month
- **de handregel** — Click an airline or an airframe to follow it. Or use the filters below
- **de gutter, open** — WHO airline and tail 89 aircraft
- **de gutter, dicht** — WHEN December 2025
- **een ladderrij** — Southwest Airlines Co 57
- **de leesalinea** — Eight operators file 84.8% of what is here; the other 13 share the res
- **de marge** — August 2026 covers 1 to 26 August, so its bar counts 26 days against 3
- **het specimen** — One report from this selection. First the FAA’s own filing of it, then
- **de decodeerregel** — Boeing 7474HAF · Wing Main, Frame Structure · Wedge · Someone looked a
- **de naadknop** — Read the 145 →
- **een recordrij** — 31 Dec 2025 N663CA Murray Air Inc BOEING 7474HAF N663CA Wing Main, Fra
- **de write-up** — DURING SHEDULED C-CHECK VISIT, FOUND LT WINGLET T/E WEDGE LIGHTNING ST
- **een cel erin** — 31 Dec 2025 N663CA

## The instrument's own markup

```html
<div id="hero" class="instrument"> <div class="ipad"> <div class="ihead"> <div class="stamp">FAA SERVICE DIFFICULTY REPORTS · 1 JAN 1995 TO 26 AUG 2026</div> <div class="picker" role="tablist" aria-label="Which rail is open"><button role="tab" aria-selected="false" class="" onclick="setHero('horizon')" tabindex="-1"> <span class="q">WHEN</span><span class="pn">month by month</span></button><button role="tab" aria-selected="false" class="" onclick="setHero('anatomy')" tabindex="-1"> <span class="q">WHERE</span><span class="pn">on the aircraft</span></button><button role="tab" aria-selected="true" class="on" onclick="setHero('swarm')" tabindex="0"> <span class="q">WHO</span><span class="pn">airline and tail</span></button><button role="tab" aria-selected="false" class="" onclick="setHero('ledger')" tabindex="-1"> <span class="q">WHAT IT FORCED</span><span class="pn">what the crew did</span></button></div> </div> <div class="sentence" id="iSentence"><b class="fig">145</b> reports, <span class="clause" tabindex="0" data-drop="zone" data-aim="drop-zone">left wing</span>, <span class="clause" tabindex="0" data-drop="from|to" data-aim="drop-period">December 2025</span>. <span class="aside">1,757,682 set aside.</span></div> <div class="aim" id="iAim"></div> <div class="aimat"> <label for="iAimAt">Aim at</label> <select id="aimKind" aria-label="What kind of thing to look for"> <option value="period">a month or year</option> <option value="operator">an airline</option> <option value="tail">a tail number</option> <option value="zone">a zone</option> <option value="jasc">a system code</option> <option value="">free text search</option> </select> <input id="iAimAt" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="aimSug" aria-autocomplete="list" placeholder="a month or a year, e.g. August or 2025"> <button class="ghost" onclick="aimAtGo()">Take it</button> <label class="aimday" for="aimDay">or one day<input id="aimDay" type="date" aria-label="One date"></label> <div class="aimsug" id="aimSug" role="listbox" hidden=""></div> </div> <div class="hand" id="iHand">Click an airline or an airframe to follow it. <span class="kbd">Keyboard: arrows walk the months, Shift and an arrow extends, Enter takes it.</span> <span class="c" onclick="el('morefilters').open=true;el('morefilters').scrollIntoView({behavior:'smooth',block:'center'})" tabindex="0" role="button">Or use the filters below.</span></div> <div class="rails"> <div class="rail " data-rail="when" onclick="setHero('horizon')" tabindex="0" role="button"><div class="gut rest"><span class="q">WHEN</
```