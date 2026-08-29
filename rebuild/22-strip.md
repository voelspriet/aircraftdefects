Changed:

1. **#sentence** — no longer removed. A pass recreates it (hidden, empty) if absent, so `renderOnPurpose` writes to a live element and `#noRows.hidden=false` is reached; CSS keeps an empty `#sentence` at zero height instead of styling it as a headline.
2. **Tab strip** — selectors rewritten to the page's real names (`#vstrip .vg / .vglab / .vtab`, original measures: 200px right-aligned uppercase label, 4px 10px tabs). `.vgbtns` gets its `display:flex; flex:1 1 auto; margin:0; padding:0; border-bottom:0` set as inline styles from script on every pass, because the page's own inline styles beat any stylesheet rule. No aria attribute is touched.
3. **Second line** — the figure is now read from whichever state is present: `#count .fig` when filtered, else the first number in `#count`'s text (the `<strong>` state). Unfiltered the line reads "N reports, everything the FAA has published to *date*.", where the date is `range.to` from `/api/facets`, formatted but never derived.
4. **Height** — `.ipad`, rails (shut rail `186px 1fr`, one line, `padding:5px 0`, strip 12px, restbar 6px), `.aim`, `.aimat`, `.hand`, `.specimen` (2-line clamp), `.margin`, `.seam`, and the search panel's `.starter`, `.filters` (158px auto-fit grid), `.bar`, `.chips` restored to the original measures. Nothing is removed or hidden; the block creates only the hidden `#sentence` and the `.sdcut` line, both inside `<main>`. All new names are `sd`-prefixed; phone layout, case sheet, stepper and aria-labels untouched.

```html
<style>
/* fault 1: #sentence stays in the DOM; empty, it costs no height */
#sentence:empty{display:none;margin:0;padding:0;border:0}

/* fault 3: the standing sentence lives in #count */
#count.sdcount{font:400 34px/1.1 'Instrument Serif',Georgia,serif;color:var(--ink,#1d1d1f);max-width:26em;margin:7px 0 0}
#count.sdcount .fig,#count.sdcount b.fig{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-weight:500;font-size:.92em;font-variant-numeric:tabular-nums;color:var(--rust-text,#b8431f)}
#count.sdcount .aside{font-size:.62em;color:var(--ash,#756f69)}
#count.sdcount .clause{border-bottom:1px dotted rgba(29,29,31,.28);cursor:pointer}
#count.sdcount .clause:hover,#count.sdcount .clause:focus-visible{color:var(--rust,#c44b28);border-bottom-color:var(--rust,#c44b28)}

.sdcut{display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap;
  position:sticky;top:0;z-index:6;background:var(--paper,#f7f5f0);
  border-top:2px solid var(--rust,#c44b28);padding:8px 10px}
.sdcut .sdcs{font:400 20px/1.2 'Instrument Serif',Georgia,serif;color:var(--ink,#1d1d1f);
  flex:1 1 320px;min-width:280px}
.sdcut .sdcs .fig{font-family:'IBM Plex Mono',monospace;color:var(--rust-text,#b8431f);font-size:.9em}
@media(max-width:900px){.sdcut{gap:4px}.sdcut .sdcs{font-size:16px;min-width:0;flex:1 1 100%}}

/* fault 2: grouped strip, original measures. .vgbtns needs script, not CSS. */
#vstrip.vgroups{display:block;border-bottom:1px solid var(--line,#e2ded5);margin:10px 0 12px;padding-bottom:6px}
#vstrip .vg{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
#vstrip .vglab{flex:0 0 200px;font:600 10px/1.35 Archivo,system-ui,sans-serif;letter-spacing:.06em;
  text-transform:uppercase;color:#57514a;text-align:right;white-space:nowrap}
#vstrip .vtab{padding:4px 10px;font-size:12.5px;border-radius:3px;border:1px solid transparent;
  background:none;color:var(--smoke,#6b6560);cursor:pointer}
#vstrip .vtab.on{background:var(--card,#fff);border-color:var(--line,#e2ded5);
  color:var(--ink,#1d1d1f);font-weight:600}
@media(max-width:900px){#vstrip .vg{flex-direction:column;gap:2px}
  #vstrip .vglab{flex:none;text-align:left;white-space:normal}}

/* fault 4: instrument measures, as the original */
.ipad{padding:14px 20px 8px}
.rails{margin-top:9px;display:flex;flex-direction:column;gap:2px}
.rail{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start;
  padding:5px 0;border-top:1px solid var(--line,#e2ded5)}
.rail.open{padding:7px 0 8px}
.rail:not(.open){grid-template-columns:186px 1fr;align-items:center;padding:5px 0}
.rail .gut.rest{display:flex;align-items:baseline;gap:8px}
.rail .gut.rest .q{font:600 11px/1.2 Archivo,system-ui,sans-serif;letter-spacing:.08em;
  color:var(--ink,#1d1d1f)}
.rail .gut.rest .val,.rail .gut .val{font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  color:var(--rust-text,#b8431f)}
.rail .gut .val{margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.strip{display:flex;gap:1px;height:12px}
.restbar{height:6px}
.aim{min-height:20px;font-family:'IBM Plex Mono',monospace;font-size:13px;
  color:var(--rust-text,#b8431f);margin-top:6px;line-height:20px}
.hand{font:600 13px/1.4 Archivo,system-ui,sans-serif;color:var(--ink,#1d1d1f);margin-top:2px}
.aimat{display:flex;align-items:center;gap:8px;margin-top:7px}
.aimat input{flex:1;max-width:340px;padding:5px 9px;font-size:13px}
.aimat select{font-size:12.5px;padding:5px 6px;max-width:150px}
.aimat button{padding:5px 11px;font-size:12px}
.specimen{margin-top:8px;border-top:1px solid var(--line,#e2ded5);padding-top:6px}
.specimen .sl{font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.5;margin-top:3px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.margin{margin-top:6px;border-top:1px solid var(--line,#e2ded5);padding:5px 0 2px;
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5f584f;line-height:1.5}
.seam{display:block;margin:8px 0 0 auto;height:34px}

/* fault 4: search panel measures, as the original */
.starter{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px;
  background:var(--card,#fff);border:1px solid var(--line,#e2ded5);padding:12px;border-radius:3px}
.filters .fld{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--ash,#756f69)}
.filters .fld input{width:100%}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
.chips{margin:8px 0}
</style>
<script>
(function(){
  function sdEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

  /* fault 1: renderOnPurpose writes to #sentence. It exists, empty, always. */
  function sdKeepSentence(){
    var s=document.getElementById("sentence");
    if(!s){
      s=document.createElement("div"); s.id="sentence"; s.hidden=true;
      var host=document.getElementById("count");
      if(host&&host.parentNode)host.parentNode.insertBefore(s,host);
      else document.body.appendChild(s);
    }
  }

  /* fault 2: the page sets inline styles on .vgbtns; only inline beats inline */
  function sdStrip(){
    var b=document.querySelectorAll("#vstrip .vgbtns");
    for(var i=0;i<b.length;i++){
      var s=b[i].style;
      s.display="flex"; s.flexWrap="wrap"; s.gap="2px"; s.flex="1 1 auto";
      s.minWidth="0"; s.alignItems="baseline";
      s.borderBottom="0"; s.margin="0"; s.padding="0";
    }
  }

  /* fault 3: the second line reads whichever element carries the figure */
  var sdPubTo="";
  function sdFig(){
    var c=document.getElementById("count"); if(!c)return "";
    var f=c.querySelector(".fig"); if(f)return f.textContent.trim();
    var m=(c.textContent||"").match(/[\d][\d,]*/);
    return m?m[0]:"";
  }
  /* formats the API's own range.to; never derives a date from it */
  function sdPretty(iso){
    var M=["","January","February","March","April","May","June","July","August",
           "September","October","November","December"];
    var p=String(iso||"").split("-");
    return p.length===3?(+p[2])+" "+M[+p[1]]+" "+p[0]:String(iso||"");
  }
  function sdLine(){
    var c=document.getElementById("count"); if(!c)return;
    var fig=sdFig(); if(!fig)return;
    var cls=[].map.call(c.querySelectorAll(".clause"),function(x){return x.textContent.trim()});
    var txt=cls.length
      ? fig+" reports, "+cls.join(", ")+"."
      : fig+" reports, everything the FAA has published to "
        +(sdPubTo?sdPretty(sdPubTo):"the newest report in the file")+".";
    var t=document.querySelector("section.panel.on table.reps")||document.querySelector("table.reps");
    if(!t)return;
    var cut=t.parentNode.querySelector(".sdcut");
    if(!cut){
      cut=document.createElement("div"); cut.className="sdcut";
      t.parentNode.insertBefore(cut,t);
    }
    if(cut.getAttribute("data-sd")!==txt){
      cut.setAttribute("data-sd",txt);
      cut.innerHTML='<span class="sdcs">'+sdEsc(txt)+"</span>";
    }
  }
  function sdPub(){
    try{
      fetch("api/facets").then(function(r){return r.json()}).then(function(d){
        var to=d&&d.range&&d.range.to;
        if(to&&to!==sdPubTo){sdPubTo=to;sdLine();}
      }).catch(function(){});
    }catch(e){}
  }

  var sdT=null;
  function sdPass(){ sdKeepSentence(); sdStrip(); sdLine(); }
  new MutationObserver(function(){clearTimeout(sdT);sdT=setTimeout(sdPass,50);})
    .observe(document.body,{childList:true,subtree:true});
  sdPass();
  sdPub();
})();
</script>
```