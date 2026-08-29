# The page's own DOM, as it actually renders

Selectors were invented twice in one round: [data-ladder], [data-name-cell],
[data-zone-sentence], none of which exist. The same class of fault as guessing a
field name, and with the same result: code that runs, throws nothing, and does
nothing. This is what the markup is, taken from the live page.

## instrument

```html
<div id="hero"><div class="ihead"><div class="stamp">FAA Service Difficulty Reports · 1 JAN 1995 TO 26 AUG 2026</div><div class="picker" role="tablist" aria-label="Which rail is open"><button type="button" role="tab" data-pick="when" aria-selected="false" tabindex="-1"><span class="q">WHEN</span><span class="pn">month by month</span></button><button type="button" role="tab" data-pick="where" aria-selected="false" tabindex="-1"><span class="q">WHERE</span><span class="pn">on the aircraft</span></button><button type="button" role="tab" data-pick="whose" aria-selected="true" tabindex="0"><span class="q">WHO</span><span class="pn">airline and tail</span></button><button type="button" role="tab" data-pick="forced" aria-selected="false" tabindex="-1"><span class="q">WHAT IT FORCED</span><span class="pn">what the crew did</span></button></div></div><p class="stand rv-sentence" data-rv="1"><span …
```

## sentence

```html
<p class="stand rv-sentence" data-rv="1"><span class="rv-count">145 reports</span>, <button class="rv-clause" type="button">Left wing (10,954)</button>, <button class="rv-clause" type="button">December 2025</button>. <span class="rv-aside">1,757,682 set aside.</span></p>
```

## railWho

```html
<div class="rail open" data-rail="whose"><div class="gut"><b>WHO</b><span class="gs">airline and tail</span><span class="gv">89 aircraft</span></div><div class="track two"><div class="col"><div class="ch">Operators</div><div class="orow" data-aim="op|SWAA" data-take="operator|SWAA" tabindex="0" role="button"><span class="on" data-rv-named="1"><span class="rv-lname">Southwest Airlines Co (SWAA)</span><span class="rv-lcode" data-rv-named="1"><span class="rv-lname">Southwest Airlines Co (SWAA)</span><span class="rv-lcode">SWAA</span></span></span><span class="ob"><i style="width:100.0%"></i></span><b>57</b></div><div class="orow" data-aim="op|DALA" data-take="operator|DALA" tabindex="0" role="button"><span class="on" data-rv-named="1"><span class="rv-lname">Delta Air Lines Inc (DALA)</span><span class="rv-lcode" data-rv-named="1"><span class="rv-lname">Delta Air Lines Inc (DALA)</span><span …
```

## orow

```html
<div class="orow" data-aim="op|SWAA" data-take="operator|SWAA" tabindex="0" role="button"><span class="on" data-rv-named="1"><span class="rv-lname">Southwest Airlines Co (SWAA)</span><span class="rv-lcode" data-rv-named="1"><span class="rv-lname">Southwest Airlines Co (SWAA)</span><span class="rv-lcode">SWAA</span></span></span><span class="ob"><i style="width:100.0%"></i></span><b>57</b></div>
```

## margin

```html
<div class="margin"><span>counts are of reports filed, not of flights</span></div>
```

## specimen

```html
<div class="specimen opens" role="button" tabindex="0" data-case="U2RA2025123100028" aria-label="Open the full report U2RA2025123100028"><div class="sh">One report from this selection. First the FAA’s own filing of it, then the mechanic’s words as written. <span class="opencue">Click to open the full report →</span></div><div class="spec-decoded">Boeing 7474HAF · Wing Main, Frame Structure · Wedge …
```

## recordRow

```html
<tr class="hdr" role="row"><th role="columnheader">Date</th><th role="columnheader">Operator</th><th role="columnheader">Aircraft</th><th role="columnheader">Tail</th><th role="columnheader">System</th><th role="columnheader">Part</th><th role="columnheader">What was found</th><th role="columnheader">Crew did</th><th role="columnheader">Found by</th><th role="columnheader">Stage</th><th aria-label="Case sheet" role="columnheader"></th></tr>
```

## writeup

```html
<div class="wu clip" onclick="rrWuToggle(this)" tabindex="-1" role="button"><div class="txt" id="wu-txt-1"><span>DURING SHEDULED C-CHECK VISIT, FOUND LT WINGLET T/E WEDGE LIGHTNING STRIKE DAMAGE. REPAIR HAS BEEN C/W IAW EO 25197-2.</span></div><div class="wu-gloss"><button type="button" data-rv-moved="1">Say it in plain English</button></div></div>
```

## panel

```html
<section id="p-leads" class="panel" hidden="" role="tabpanel" aria-labelledby="vtab-p-leads"><div class="scope" data-scope="p-leads"></div><h2>Story leads</h2><p class="psub">Angles worth checking, computed on everything the FAA has published.</p><div class="pbody" id="p-leads-body"></div></section>
```

## panelBody

```html
<div class="pbody" id="p-leads-body"></div>
```
