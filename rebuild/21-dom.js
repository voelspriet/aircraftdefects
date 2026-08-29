/* ---- sdfix: markup fixes that must survive every redraw ------------------- */
function sdfixDom(){
  /* fault 2: the landing card is gone; the rails explain themselves */
  document.querySelectorAll('.card.land').forEach(n=>n.remove());
  /* fault 1: the empty sentence div the type rules were landing on */
  const dead=document.getElementById('sentence');
  if(dead && !dead.textContent.trim()) dead.remove();
  /* fault 1: the second line — sentence and match count are two jobs */
  const c=document.getElementById('count'); if(!c) return;
  const host=c.parentElement; if(!host) return;
  let sub=host.querySelector(':scope > .sdfix-match');
  if(!sub){
    sub=document.createElement('p');
    sub.className='sdfix-match';
    host.insertBefore(sub,c.nextSibling);
  }
  const fig=c.querySelector('.fig');
  const n=fig?fig.textContent.trim():'';
  const filtered=!!c.querySelector('.clause');
  sub.innerHTML=filtered
    ? '<b>'+esc(n)+'</b> '+(n==='1'?'report matches':'reports match')+' your selection'
    : '<b>'+esc(n)+'</b> reports, nothing filtered yet';
}
let sdfixQueued=false;
new MutationObserver(()=>{
  if(sdfixQueued)return; sdfixQueued=true;
  requestAnimationFrame(()=>{sdfixQueued=false;sdfixDom();});
}).observe(document.body,{childList:true,subtree:true});
sdfixDom();
