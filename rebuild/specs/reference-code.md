# The reference's own code for what is broken

Taken from the original, verbatim. Where the rebuild differs from this, this is
what it should be.

## The aim line always keeps its box

```css
.aim{min-height:20px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;
  color:var(--rust);margin-top:6px;line-height:20px}
.aim .undoit{background:none;border:1px solid rgba(196,75,4
```

It is `min-height`, never `display:none`. The rebuild hides it when it is empty,
so the whole page below it jumps 21px up and back every time a hover writes into
it or clears it. That is the flicker.

## The tab strip does not stick

```css
.tabs{display:flex;gap:2px;flex-wrap:wrap;margin:12px 0 14px;border-bottom:1px solid var(--line)}
.tab{padding:8px 13px;font-size:13px;cursor:pointer;border:1px solid transparent;border-bottom:none;color:var(--smoke);background:none}
.tab.on{background:var(--c
```

No position, no top, no z-index. The rebuild makes it `position:sticky; top:44px`
and it is 231px tall, so a third of the screen is a bar the text runs under.

## The case sheet: the overlay scrolls, not the card

```css
#case-wrap{display:none;position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;
  overscroll-behavior:contain;
  align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
#case-box{background:#fff;max-width:900px;width:100%;border-radius:12px;padding:24px 28px;
  box-shadow:0 24px 60px rgba(0,0,0,.3)}
table.kv{width:100%;border-collapse:collapse}
table.kv th{text-align:left;width:210px;v
```

`#case-wrap` is the full-screen overlay and it is what scrolls, with the card
centred inside it at a maximum of 900px. The rebuild puts the card itself at
fixed 1440x900, so there is no overlay to scroll and the card cannot grow.

## How it opens and closes

```js
function openCase(id,fromPop){
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
    <button class="ghost" ${idx>=CASE_ORDER.length-1?"disabled":""} onclick="openCase('${esc(CASE_ORDER[Math.min(CASE_ORDER.length-1,idx+1)])}')">&rsa
```

```js
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
```

```js
function hideCase(){
  el("case-wrap").style.display="none";
  releaseTrap();
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
```
