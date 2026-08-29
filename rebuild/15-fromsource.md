```html
<style>
:root{
  --ink:rgb(29,29,31);
  --rust:rgb(184,67,31);
  --margin-ink:rgb(95,88,79);
  --paper:#fff;
  --smoke:#5a6470;
  --line:rgba(29,29,31,.15);
}

/* 1 — the aim line keeps its box, always */
.aim{min-height:20px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;
  color:var(--rust);margin-top:6px;line-height:20px}
.aim .undoit{background:none;border:1px solid rgba(196,75,40,.45);color:var(--rust);
  font:inherit;cursor:pointer;padding:0 6px}

/* 2 — the tab strip does not stick */
.tabs{display:flex;gap:2px;flex-wrap:wrap;margin:12px 0 14px;border-bottom:1px solid var(--line)}
.tab{padding:8px 13px;font-size:13px;cursor:pointer;border:1px solid transparent;border-bottom:none;
  color:var(--smoke);background:none;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
.tab.on{background:var(--paper);color:var(--ink);border-color:var(--line)}

/* 3 — the overlay scrolls, not the card */
#case-wrap{display:none;position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;
  overscroll-behavior:contain;
  align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
#case-box{background:#fff;max-width:900px;width:100%;border-radius:12px;padding:24px 28px;
  box-shadow:0 24px 60px rgba(0,0,0,.3)}
table.kv{width:100%;border-collapse:collapse}
table.kv th{text-align:left;width:210px;vertical-align:top;padding:6px 10px 6px 0;
  font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;font-weight:400;color:var(--margin-ink)}
table.kv td{padding:6px 0;color:var(--ink)}

/* 5 — the type, decided once, one ink */
.stand,.rv-sentence{font-family:'Instrument Serif',Georgia,serif;font-size:34px;line-height:1.12;
  color:var(--ink);margin:0}
.count{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:31.28px;color:var(--rust)}
.aside{font-family:'Instrument Serif',Georgia,serif;font-size:21.08px;color:var(--ink)}
.hand{font-family:'Archivo',system-ui,sans-serif;font-size:13px;font-weight:600;color:var(--ink)}
.margin-note{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;color:var(--margin-ink)}
.reading{font-family:Georgia,'Times New Roman',serif;font-size:15px;color:var(--ink)}
.ladder .row{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:11.5px;color:var(--ink)}
</style>

<script>
/* 4 — the ladder prints the designator once. The menu label already ends in a
   parenthetical, so strip it before appending the one from data-take. */
function menuNameWithoutDesignator(s){
  return String(s||"").replace(/\s*\([^()]*\)\s*$/,"").trim();
}
function ladderLabel(menuLabel,take){
  const p=String(take||"").split("|");
  const des=p.length>1&&p[1]?p[1]:"";
  return menuNameWithoutDesignator(menuLabel)+(des?" ("+des+")":"");
}
document.querySelectorAll(".ladder [data-take]").forEach(function(r){
  const take=r.getAttribute("data-take")||"";
  const label=r.getAttribute("data-label")||r.getAttribute("data-menu")||r.textContent;
  r.textContent=ladderLabel(label,take);
});

/* How it opens and closes — as the reference has it */
async function openCase(id,fromPop){
  if(!id)return;
  if(!fromPop&&!caseFromLink)caseFromLink=false;
  lastFocus=document.activeElement;
  if(!fromPop){
    const u=params(); u.set("hero",heroKind); u.set("case",id);
    if(new URLSearchParams(location.search).get("case")!==id){
      history.pushState({case:id},"","?"+u.toString()); pushedCase=true;
    }
  }
  el("case-wrap").style.display="flex";
  const bx=el("case-box");
  bx.setAttribute("role","dialog"); bx.setAttribute("aria-modal","true");
  bx.setAttribute("aria-labelledby","case-title"); bx.setAttribute("tabindex","-1");
  trapFocus();
  el("case-box").innerHTML='<p class="muted">Loading.</p>';
  const d=await(await fetch("api/case/"+encodeURIComponent(id))).json();
  if(d.error){el("case-box").innerHTML='<p class="muted">This report could not be found.</p>';return}
  currentCase=d;
  setTimeout(()=>{const b=el("case-box"); if(b)b.focus()},30);
  const row=(k,v)=>v?`<tr><th>${k}</th><td>${v}</td></tr>`:"";
  const one=e=>e?`<strong>${esc(e.label)}</strong>${e.faa?`<div class="muted">FAA wording: ${esc(e.faa)}</div>`:""}${e.note?`<div class="muted">${esc(e.note)}</div>`:""}`:"";
  const many=a=>(a&&a.length)?a.map(one).join("<hr>"):'<span class="muted">none recorded</span>';
  const idx=caseFromLink?-1:CASE_ORDER.indexOf(id);
  const stepper=(idx>=0&&CASE_ORDER.length>1)?`<span class="step">
    <button class="ghost" ${idx<=0?"disabled":""} onclick="openCase('${esc(CASE_ORDER[Math.max(0,idx-1)])}')">&lsaquo;</button>
    <span>${idx+1} of ${num(CASE_ORDER.length)} loaded${LAST_TOTAL&&LAST_TOTAL>CASE_ORDER.length
      ?`, of ${num(LAST_TOTAL)} that match`:""}</span>
    <button class="ghost" ${idx>=CASE_ORDER.length-1?"disabled":""} onclick="openCase('${esc(CASE_ORDER[Math.min(CASE_ORDER.length-1,idx+1)])}')">&rsaquo;</button>
  </span>`:"";
  el("case-box").innerHTML=
    '<button class="ghost" onclick="closeCase()">Close</button>'
    +'<h2 id="case-title">'+esc(d.title||d.name||id)+'</h2>'
    +'<table class="kv"><tbody>'
    +row("Date",esc(d.date||""))
    +row("Operator",esc(d.operator||""))
    +row("Aircraft",esc(d.aircraft||""))
    +row("Narrative",esc(d.narrative||""))
    +row("Findings",many(d.events))
    +'</tbody></table>'+stepper;
}

function closeCase(){
  if(el("case-wrap").style.display!=="flex")return;
  /* navigate first, then let popstate do the hiding: hiding first made the guard
     miss and dumped the reporter back on the Search tab every time */
  /* Back only belongs here when we pushed the entry ourselves. On a colleague's
     link the previous entry is another site. */
  if(pushedCase&&new URLSearchParams(location.search).get("case")){history.back();return}
  const u=new URLSearchParams(location.search);
  if(u.get("case")){ u.delete("case"); history.replaceState(null,"","?"+u.toString()); }
  hideCase();
}

function hideCase(){
  el("case-wrap").style.display="none";
  releaseTrap();
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}

document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&document.getElementById("case-wrap").style.display==="flex")closeCase();
});
document.getElementById("case-wrap").addEventListener("click",function(e){
  if(e.target===document.getElementById("case-wrap"))closeCase();
});
</script>
```

What changed:

- **Aim line.** `display:none` removed; it is `min-height:20px` with `line-height:20px`, so it holds its 20px box empty and nothing under it moves on hover.
- **Tab strip.** Every `position:sticky`, `top`, `z-index` and `height` removed. It is a plain flex row over a bottom border and is its natural ~104px.
- **Case sheet.** `#case-box`'s `position:fixed` and 1440x900 are gone. `#case-wrap` is the full-screen scrolling overlay with 32px of top padding; the card is `width:100%; max-width:900px` inside it, so the whole sheet scrolls and the last line is reachable.
- **Close paths.** `closeCase`/`hideCase` restored to the reference order — navigate first, hide via `hideCase` — plus an Escape listener and a click-on-backdrop close, both guarded so double-firing is harmless.
- **Ladder.** Rows are labelled through `ladderLabel`, which strips one trailing parenthetical from the menu label before appending the designator from `data-take="operator|SWAA"`, and a pass fixes any rows already in the DOM. "Southwest Airlines Co (SWAA)" now appears once.
- **Type, decided once.** The `.rv-sentence{Georgia}` rule is deleted; the element keeps Instrument Serif 34px through `.stand`. The ink is `rgb(29,29,31)` on every text role — the brown `rgb(33,29,20)`/`rgb(38,34,29)` casts are gone, the purple on the aim line is `rgb(184,67,31)`, the margin note is `rgb(95,88,79)`, and the hand line (Archivo 13px w600) exists again. Count and aside keep their correct measured values; ladder rows are system-ui 11.5px, reading is Georgia 15px.
- Everything previously working — the `.undoit` button, `.tab.on`, `table.kv` — is restated in full rather than dropped.