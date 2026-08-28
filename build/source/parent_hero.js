function drawHero(){
  const box=el("hero"); if(!box)return;
  /* rust is reserved for a chosen selection. At rest the corpus stands in ash, so
     the reporter can see there is nothing selected without reading a word. */
  NARROWED=[...params().keys()].some(k=>k!=="hero");
  const d=heroData;
  const openR=railOf(heroKind);
  MARGIN.length=0;
  if(!d){
    /* a dark instrument tells the reporter nothing about why. The frame stands, and
       the sentence slot says which of the three rest states this is. */
    const refused=Object.keys(UNRESOLVED).length>0;
    box.className="instrument";
    box.innerHTML=`<div class="ipad">
      <div class="ihead"><div class="stamp">FAA SERVICE DIFFICULTY REPORTS &middot; ${esc(stampRange())} TO
        ${esc(String(RANGE.to||"").toUpperCase())}</div></div>
      <div class="sentence">${refused
        ? `One value in this link is not in this data, so no search was run. There is no number on
           this page to quote.`
        : `Reading ${num(TOTAL)} reports.`}</div>
      <div class="aim"></div>
      <div class="rails">${RAILS.map(r=>`<div class="rail">${gutter(r,
        refused?"all "+num(TOTAL)+", not your query":"",false)}
        <div class="track"><div class="strip"><span style="flex:1"></span></div></div></div>`).join("")}</div>
    </div>`;
    return;
  }

  if((d.months||[]).some(m=>partialMonth(m.m)))
  {
    const to=String(RANGE.to||""), dd=+to.slice(8,10)||0;
    const [yy,mm]=[to.slice(0,4),+to.slice(5,7)];
    const inMonth=new Date(yy,mm,0).getDate();
    marginPush("part",`${MONTHS[mm]} ${yy} covers 1 to ${dd} ${MONTHS[mm]}, so its bar counts `
      +`${dd} days against ${inMonth} in a whole one`,true);
  }
  if(d.swarm_total>(d.swarm||[]).length)
    marginPush("swarmcap",`the tail list shows the ${num((d.swarm||[]).length)} most-reported aircraft out of ${num(d.swarm_total)}; the airline list counts every report`);
  marginPush("basis","counts are of reports filed, not of flights");
  const blind=railBlind();
  if(blind.length)marginPush("blind",
    `no rail draws ${blind.length===1?blind[0]:blind.slice(0,-1).join(", ")+" or "+blind.slice(-1)}; that part of the selection lives only in the controls below`);

  const picker=`<div class="picker" role="tablist" aria-label="Which rail is open">${
    RAILS.map(r=>`<button role="tab" aria-selected="${r[3]===heroKind}"
      class="${r[3]===heroKind?"on":""}" onclick="setHero('${r[3]}')">
      <span class="q">${r[3]==="ledger"?"WHAT IT FORCED":r[1]}</span><span class="pn">${r[2]}</span></button>`).join("")}</div>`;

  const hand={when:"Drag across the months to take a period.",
              where:"Click a zone on the aircraft to keep only what was found there.",
              whose:"Click an airline or an airframe to follow it.",
              forced:"Click what the crew had to do."}[openR];

  const sctl=(d.specimen&&d.specimen.control)||"";
  /* it was the only thing on the page that showed a single report and could not be
     opened; now the whole block is the way in to it */
  const spec=(d.lines&&d.lines.length)?`<div class="specimen${sctl?" opens":""}"
    ${sctl?`role="button" tabindex="0" data-case="${esc(sctl)}"
      aria-label="Open the full report ${esc(sctl)}"`:""}>
    <div class="sh">One report from this selection. First the FAA&rsquo;s own filing of it,
      then the mechanic&rsquo;s words as written.${sctl?` <span class="opencue">Click to open the
      full report &rarr;</span>`:""}</div>
    ${specLine(d.specimen)}
    <div class="sl">${jargon(d.lines[0])}</div></div>`:"";

  const zero=(d.total===0)?`<div class="zero">
    <b>Nothing matches all of these at once.</b>
    ${(d.leave_one_out||[]).slice(0,3).map(x=>`<button class="ghost"
      onclick="setFilter('${x.drop}','')">Drop ${esc(LABEL[x.drop]||x.drop)} &rarr; ${num(x.would_give)} reports</button>`).join("")}
    </div>`:"";

  if(isPhone()){ drawPhone(d,zero); paintHeld(); syncControls(); return }
  box.className="instrument";
  box.innerHTML=`
  <div class="ipad">
    <div class="ihead">
      <div class="stamp">FAA SERVICE DIFFICULTY REPORTS &middot; ${esc(stampRange())} TO ${esc(stampTo())}</div>
      ${picker}
    </div>
    <div class="sentence" id="iSentence">${sentenceHTML(d)}</div>
    <div class="aim" id="iAim"></div>
    <div class="aimat">
      <label for="iAimAt">Aim at</label>
<select id="aimKind" aria-label="What kind of thing to look for">
        <option value="period">a month or year</option>
        <option value="operator">an airline</option>
        <option value="tail">a tail number</option>
        <option value="zone">a zone</option>
        <option value="jasc">a system code</option>
        <option value="">free text search</option>
      </select>
            <input id="iAimAt" autocomplete="off" role="combobox" aria-expanded="false"
        aria-controls="aimSug" aria-autocomplete="list"
        placeholder="a month or a year, e.g. August or 2025">
      <button class="ghost" onclick="aimAtGo()">Take it</button>
      <label class="aimday" for="aimDay">or one day<input id="aimDay" type="date" aria-label="One date"></label>
      <div class="aimsug" id="aimSug" role="listbox" hidden></div>
    </div>
    <div class="hand" id="iHand">${esc(hand)}
      <span class="kbd">Keyboard: arrows walk the months, Shift and an arrow extends, Enter takes it.</span>
      <span class="c" onclick="el('morefilters').open=true;el('morefilters').scrollIntoView({behavior:'smooth',block:'center'})">Or use the filters below.</span></div>
    ${zero}
    <div class="rails">
      ${railWhen(d,openR==="when")}
      ${railWhere(d,openR==="where")}
      ${railWhose(d,openR==="whose")}
      ${railForced(d,openR==="forced")}
    </div>
    ${spec}
    <div class="margin" id="iMargin"></div>
  </div>
  <button class="seam" onclick="goResults()">${d.total?`Read the ${num(d.total)} &rarr;`:"Nothing to read yet"}</button>`;
  const blindLate=railBlind();
  if(false)marginPush("blind",
    `no rail draws ${blind.length===1?blind[0]:blind.slice(0,-1).join(", ")+" or "+blind.slice(-1)}; that part of the selection lives only in the controls below`);
  const wtr=document.querySelector(".rail.open[data-rail=when] .track");
  if(wtr&&wtr.scrollWidth>wtr.clientWidth)wtr.scrollLeft=wtr.scrollWidth;
  marginRender();
  aimAtFill();
  paintHeld();
  rove();
  paintSpines();
  syncControls();
}
async function goResults(){
  const first=!REVEALED;
  REVEALED=true;
  show("p-search");
  /* the first time, there is no table to scroll to yet: it was waiting for exactly
     this decision */
  if(first)await search(0);
  const t=document.querySelector("table.reports");
  if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-58,behavior:"smooth"});
}




addEventListener("resize",()=>{clearTimeout(window._ph);window._ph=setTimeout(drawHero,180)});
/* ---- the phone: the same marks, a different instrument ----------------------
   Below 760px the instrument stops being a picture you point at and becomes a
   sentence you build one clause at a time, with every clause answered on the spot.
   It renders from the same heroData mark objects and the same number formatter as
   the rails, so the two paths cannot drift. */
const isPhone=()=>window.matchMedia("(max-width:760px)").matches;
let phTap=null;

function phSection(id,q,pn,body,clause){
  const done=!!clause;
  return `<section class="ph ${done?"done":""}" data-ph="${id}">
    <button class="phhead" onclick="phToggle('${id}')">
      <span class="phq">${q}</span>
      ${done?`<span class="phclause">${clause}</span>`:`<span class="phpn">${pn}</span>`}
      <span class="phchev">&#8964;</span></button>
    <div class="phbody">${body}</div>
    <div class="phcard" data-card="${id}"></div></section>`;
}
function phMonths(d){
  const ms=d.months||[], cmax=Math.max(1,...ms.map(m=>m.all));
  const presets=[["all reports",""],["this year","Y"],["last 12 months","12"],["last 90 days","90"]];
  return `<div class="phpresets">${presets.map(([lab,k])=>
    `<button class="chipbtn" onclick="phPreset('${k}')">${lab}</button>`).join("")}</div>
  <div class="phstrip" role="group" aria-label="Months">${ms.map(m=>
    `<button class="phmo${partialMonth(m.m)?" part":""}" data-take="month|${esc(m.m)}"
       aria-label="${esc(monthName(m.m))}, ${num(m.n)} reports">
       <i style="height:${((m.all/cmax)*44).toFixed(1)}px"></i>
       ${m.n?`<u style="height:${((m.n/cmax)*44).toFixed(1)}px"></u>`:""}
       <span>${m.m.slice(5)}</span></button>`).join("")}</div>
  <div class="phhint">Tap the first month, then the last, to take a range.</div>`;
}
function phZones(d){
  const zs=d.zones||[], mx=Math.max(1,...zs.map(z=>z.n));
  const by={}; zs.forEach(z=>by[z.code]=z);
  const grid=[["ZONE 800","ZONE 200","ZONE 100"],
              ["ZONE 500","ZONE 400","ZONE 600"],
              ["ZONE 300","ZONE 700","ZONE 900"]];
  const cell=c=>{const z=by[c]||{label:c,n:0};
    return `<button class="phcell" data-take="zone|${c}"
      style="--f:${(0.10+0.80*(z.n/mx)).toFixed(3)}">
      <span>${esc(z.label)}</span><b>${num(z.n)}</b></button>`};
  return `<div class="phkey" aria-hidden="true"></div>
    <div class="phmap">${grid.flat().map(cell).join("")}</div>
    <div class="phmap pads">
      <button class="phcell pad" data-aim="pad|nowhere"><span>no location given</span>
        <b>${num(d.no_location||0)}</b></button>
      <button class="phcell pad" data-aim="pad|outside"><span>place named in words, not as a zone</span>
        <b>${num(d.other_location||0)}</b></button></div>`;
}
function phLadder(rows,takeKind){
  const mx=Math.max(1,...rows.map(r=>r.n));
  return `<div class="phladder">${rows.map(r=>
    `<button class="phrow" data-take="${takeKind}|${esc(r.key)}">
      <span class="pn2">${esc(r.label)}</span>
      <span class="pb"><i style="width:${(r.n/mx*100).toFixed(1)}%"></i></span>
      <b>${num(r.n)}</b></button>`).join("")}</div>`;
}
function drawPhone(d,zeroBlock){
  const box=el("hero");
  const p=params();
  const opRows=(d.operator_rows||[]).map(r=>({key:r.o,label:opName(r.o),n:r.n}));
  const acRows=(d.swarm||[]).slice(0,8).map(a=>({key:a.t,label:"N"+a.t,n:a.n}));
  const crewRows=(d.crew||[]).filter(x=>!["K","0","O"].includes(x.code))
    .slice(0,8).map(x=>({key:x.code,label:x.label,n:x.n}));
  const per=periodClause();
  box.className="instrument phone";
  box.innerHTML=`
  <div class="phbar" id="phBar">
    <div class="phcount"><b>${num(d.total)}</b> ${d.total===1?"report":"reports"}</div>
    <div class="phchips">${[...p].filter(([k])=>k!=="hero").map(([k,v])=>
      `<span class="chip">${esc(LABEL[k]||k)}: ${clauseText(k,v)||esc(v)}
        <b onclick="setFilter('${k}','')">&times;</b></span>`).join("")||
      '<span class="ash">nothing filtered yet</span>'}</div>
    ${zeroBlock||""}
    <div class="phacts">
      <button class="ghost" onclick="phSheet(true)">All filters
        <i class="badge">${[...p].filter(([k])=>k!=="hero").length}</i></button>
      <button class="ghost" onclick="scrollTo({top:0,behavior:'smooth'})">&uarr; back</button>
    </div>
  </div>
  <div class="phsections">
    ${phSection("when","WHEN","month by month",phMonths(d),per?esc(per):"")}
    ${phSection("where","WHERE","on the aircraft",phZones(d),p.get("zone")?esc(code("part_location",p.get("zone"))):"")}
    ${phSection("whose","WHO","airline and tail",
      `<div class="phsub">Airlines</div>${phLadder(opRows,"operator")}
       <div class="phsub">Aircraft</div>${phLadder(acRows,"tail")}`,
      p.get("operator")?esc(opName(p.get("operator"))):(p.get("tail")?"N"+esc(p.get("tail")):""))}
    ${phSection("forced","WHAT IT FORCED","what the crew did",
      `<div class="phblock"><i style="width:${(d.total?d.crew_reports/d.total*100:0).toFixed(1)}%"></i>
        <span>${num(d.crew_reports||0)} of ${num(d.total)} forced a crew action</span></div>
       ${phLadder(crewRows,"crew")}`,
      p.get("crew")?esc(code("precaution",p.get("crew"))):"")}
  </div>
  <div class="phextra">
    <div class="aimat">
      <label for="iAimAt">Aim at</label>
<select id="aimKind" aria-label="What kind of thing to look for">
        <option value="period">a month or year</option>
        <option value="operator">an airline</option>
        <option value="tail">a tail number</option>
        <option value="zone">a zone</option>
        <option value="jasc">a system code</option>
        <option value="">free text search</option>
      </select>
            <input id="iAimAt" autocomplete="off" role="combobox" aria-expanded="false"
        aria-controls="aimSug" aria-autocomplete="list"
        placeholder="a month or a year, e.g. August or 2025">
      <div class="aimsug" id="aimSug" role="listbox" hidden></div>
      <button class="ghost" onclick="aimAtGo()">Take it</button>
      <label class="aimday" for="aimDay">or one day<input id="aimDay" type="date" aria-label="One date"></label>
    </div>
    <div class="aim" id="iAim"></div>
    ${(d.lines&&d.lines.length)?`<div class="specimen${(d.specimen&&d.specimen.control)?" opens":""}"
      ${(d.specimen&&d.specimen.control)?`role="button" tabindex="0"
        data-case="${esc(d.specimen.control)}" aria-label="Open the full report"`:""}>
      <div class="sh">One report from this selection. First the FAA&rsquo;s own filing of it,
        then the mechanic&rsquo;s words as written.${(d.specimen&&d.specimen.control)
        ?` <span class="opencue">Tap to open it &rarr;</span>`:""}</div>
      ${specLine(d.specimen)}
      <div class="sl">${jargon(d.lines[0])}</div></div>`:""}
  </div>
  <div class="margin" id="iMargin"></div>
  <button class="seam" onclick="goResults()">${d.total?`Read the ${num(d.total)} &rarr;`:"No report to read"}</button>
  <div class="phsheet" id="phSheet" hidden></div>`;
  const wtr=document.querySelector(".rail.open[data-rail=when] .track");
  if(wtr&&wtr.scrollWidth>wtr.clientWidth)wtr.scrollLeft=wtr.scrollWidth;
  marginRender();
  aimAtFill();
  phCards(d);
}
function phCards(d){
  /* after every clause the count, the caveat and one real report render right under
     the section, so the evidence is never 1,700px away from the number */
  const line=(d.lines&&d.lines[0])||"";
  document.querySelectorAll(".phcard").forEach(c=>{
    const done=c.parentElement.classList.contains("done");
    c.innerHTML=(done&&d.total)?`<div class="pcard"><b>${num(d.total)} reports now.</b>
      <div class="pq">${jargon(line)}</div>
      <button class="ghost" onclick="goResults()">Read them &rarr;</button></div>`:"";
  });
}
function phToggle(id){
  const sec=document.querySelector(`[data-ph="${id}"]`); if(!sec)return;
  sec.classList.toggle("shut");
}
function phPreset(k){
  const to=RANGE.to, from=RANGE.from;
  if(!k){ el("from").value=""; el("to").value=""; }
  else{
    const d2=new Date(to);
    if(k==="Y"){ el("from").value=to.slice(0,4)+"-01-01"; el("to").value=to; }
    else{ const back=new Date(d2); back.setDate(back.getDate()-(k==="90"?90:365));
          el("from").value=back.toISOString().slice(0,10); el("to").value=to; }
  }
  search(0);
}
function phSheet(open){
  const sh=el("phSheet"); if(!sh)return;
  if(open){
    sh.hidden=false;
    sh.innerHTML=`<div class="phsheetin"><div class="phsheethead">
      <b>All fifteen filters</b>
      <button class="ghost" onclick="phSheet(false)">Done</button></div>
      <p class="muted">Nothing is hidden here that the instrument can do; this is the other route to
      the same selection.</p>
      <button class="ghost" onclick="phSheet(false);el('morefilters').open=true;
        el('p-search').scrollIntoView({behavior:'smooth'})">Open the controls</button></div>`;
  }else sh.hidden=true;
}
/* first tap aims, second takes: the phone reporter gets inspect-then-commit too */
document.addEventListener("click",e=>{
  if(!isPhone())return;
  if(e.target.closest&&e.target.closest("#phPill"))return;   /* the pill owns its own tap */
  const t=e.target.closest&&e.target.closest("[data-take]");
  if(!t){ phTap=null; const old=el("phPill"); if(old)old.remove(); return }
  if(phTap!==t.dataset.take){
    e.preventDefault(); e.stopPropagation();
    phTap=t.dataset.take;
    const txt=(aimTextFor(t.dataset.take)||"").replace(/click to /g,"");
    aim(txt||"");
    const pill=el("phPill")||Object.assign(document.body.appendChild(document.createElement("button")),
      {id:"phPill",className:"phpill"});
    pill.innerHTML=(txt||"this mark")+' <span class="go">take it &rarr;</span>';
    pill.onclick=()=>{ takeFor(phTap); phTap=null; pill.remove() };
    pill.style.display="block";
  }
},true);
addEventListener("scroll",()=>{ const p2=el("phPill"); if(p2)p2.remove(); phTap=null; },{passive:true});

/* ---- the typed route to any mark -------------------------------------------
   Everything the pointer can reach, reachable by typing its name. This is the only
   practical route for voice control, switch access and 200% zoom, and it is also
   the fastest route to one of 900 airframes or 309 operators. */
function aimTargets(){
  const d=heroData; if(!d)return [];
  const out=[];
  (d.months||[]).forEach(m=>out.push({label:monthName(m.m),take:"month|"+m.m,n:m.n}));
  (d.zones||[]).forEach(z=>out.push({label:z.label,take:"zone|"+z.code,n:z.n}));
  (d.crew||[]).forEach(c=>out.push({label:c.label,take:"crew|"+c.code,n:c.n}));
  (d.operator_rows||[]).forEach(r=>out.push({label:opName(r.o),take:"operator|"+r.o,n:r.n}));
  (d.swarm||[]).forEach(a=>out.push({label:"N"+a.t,take:"tail|"+a.t,n:a.n}));
  return out;
}
function aimAtFill(){
  const dl=el("iAimList"); if(!dl)return;
  dl.innerHTML=aimTargets().slice(0,600)
    .map(t=>`<option value="${esc(t.label)}">${num(t.n)} reports</option>`).join("");
}
/* The box accepts five different kinds of thing. Collapsing them into one text
   field hid that a month, a zone, an airline and a tail are structured filters with
   the FAA's own definitions behind them, and left "any word" looking like the only
   option. The list names the kind and the size before you commit to one. */
const KINDLAB={period:"MONTH OR YEAR",zone:"ZONE",operator:"AIRLINE",tail:"TAIL",
               jasc:"SYSTEM",q:"WORD IN THE WRITE-UPS"};
let SUG=[], SUGI=-1, sugTimer=null, sugSeq=0, LAST_WORD=null;
function sugClose(){
  const box=el("aimSug"); if(!box)return;
  box.hidden=true; box.innerHTML=""; SUG=[]; SUGI=-1;
  const i=el("iAimAt"); if(i)i.setAttribute("aria-expanded","false");
}
function sugPaint(){
  const box=el("aimSug"); if(!box)return;
  if(!SUG.length){sugClose();return}
  /* grouped under a heading per kind: a year must not be buried under three
     registrations that merely start with the same digits */
  let last=null;
  box.innerHTML=SUG.map((o,i)=>{
    const head=(o.kind!==last)?`<div class="sughead sk-${esc(o.kind)}">${
      esc(KINDLAB[o.kind]||o.kind)}</div>`:"";
    last=o.kind;
    return head+`<div class="sug${i===SUGI?" on":""}${o.n?"":" nought"}" role="option"
      aria-selected="${i===SUGI}" data-i="${i}" ${o.n?"":'aria-disabled="true"'}>
      <span class="sl">${esc(o.label)}</span>
      <span class="sw">${o.n?esc(o.what):"no report in this file"}</span>
      <b>${num(o.n)}</b></div>`;
  }).join("");
  box.hidden=false;
  el("iAimAt").setAttribute("aria-expanded","true");
}
/* Een losse dag komt uit de kalender, niet uit een tikfout in twee datumvakken.
   Van en tot worden allebei op die dag gezet, dus je ziet precies die ene dag. */
/* De hint in het vak volgt de gekozen categorie, anders belooft hij dingen die
   in deze stand niet gevonden worden. */
const AIMPH={period:"a month or a year, e.g. August or 2025",
  operator:"an airline, e.g. United or UAL", tail:"a tail number, e.g. N583",
  zone:"a zone, e.g. 300", jasc:"a system code, e.g. 3230",
  "":"any words the mechanic wrote, e.g. bird strike"};
function aimPlaceholder(){
  const k=(el("aimKind")&&el("aimKind").value)||"";
  const i=el("iAimAt"); if(i)i.placeholder=AIMPH[k]||"";
}
document.addEventListener("change",e=>{
  if(e.target&&e.target.id==="aimKind")aimPlaceholder();
});
setInterval(aimPlaceholder,600);
document.addEventListener("change",e=>{
  if(!e.target||e.target.id!=="aimDay")return;
  const d=e.target.value; if(!d)return;
  el("from").value=d; el("to").value=d;
  show("p-search"); search(0); showChange();
  if(typeof aimHold==="function")aimHold(`took ${esc(d)}, one day.
    <button class="undoit" onclick="history.back();unaim()">undo</button>`);
});
async function sugFetch(v){
  const mine=++sugSeq;
  try{
    const k=(el("aimKind")&&el("aimKind").value)||"";
    if(!k){
      const rv=await(await fetch("api/vocab?q="+encodeURIComponent(v)+"&limit=10")).json();
      if(mine!==sugSeq)return;
      SUG=(rv.rows||[]).map(row=>({kind:"q",value:String(row.term||"").toLowerCase(),
        label:String(row.term||"").toLowerCase(),what:"a word in the write-ups",n:row.n||0}));
      LAST_WORD=null; SUGI=-1; sugPaint(); return;
    }
    const r=await(await fetch("api/resolve?q="+encodeURIComponent(v)
      +(k?"&kind="+encodeURIComponent(k):""))).json();
    if(mine!==sugSeq)return;                  /* an older keystroke, dropped */
    /* the word reading is deliberately not offered here: this box is for the
       categories the FAA defines. Free text has its own field below.
       Zero-count rows are dropped while browsing, because a suggestion list should
       not offer dead ends. But once a kind has been asked for by name, "that year
       holds no reports" is the answer, and hiding it leaves an empty box instead. */
    const kk=(el("aimKind")&&el("aimKind").value)||"";
    SUG=(r.readings||[]).filter(x=>x.kind!=="q"&&(x.n>0||kk));
    LAST_WORD=(r.readings||[]).find(x=>x.kind==="q")||null;
    SUGI=-1; sugPaint();
  }catch(e){ if(mine===sugSeq)sugClose(); }
}
document.addEventListener("change",e=>{
  if(!e.target.closest||!e.target.closest("#aimKind"))return;
  const v=(el("iAimAt")&&el("iAimAt").value||"").trim();
  if(v.length>=2)sugFetch(v); else sugClose();
});
document.addEventListener("input",e=>{
  if(!e.target.closest||!e.target.closest("#iAimAt"))return;
  const v=e.target.value.trim();
  clearTimeout(sugTimer);
  if(v.length<2){sugClose();return}
  sugTimer=setTimeout(()=>sugFetch(v),220);
});
document.addEventListener("keydown",e=>{
  if(!e.target.closest||!e.target.closest("#iAimAt"))return;
  if(!SUG.length)return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){
    e.preventDefault();
    SUGI=e.key==="ArrowDown"?Math.min(SUG.length-1,SUGI+1):Math.max(-1,SUGI-1);
    sugPaint();
  } else if(e.key==="Enter"&&SUGI>=0){
    e.preventDefault(); const o=SUG[SUGI]; sugClose(); takeReading(o);
  } else if(e.key==="Escape"){ sugClose(); }
});
document.addEventListener("mousedown",e=>{
  const row=e.target.closest&&e.target.closest("#aimSug .sug");
  if(row){ e.preventDefault(); const o=SUG[+row.dataset.i];
    if(!o||!o.n)return;                       /* nothing to take: it holds no reports */
    sugClose(); takeReading(o); return; }
  if(!e.target.closest||!e.target.closest(".aimat"))sugClose();
});
async function aimAtGo(){
  const raw=(el("iAimAt")&&el("iAimAt").value||"").trim();
  if(!raw)return;
  if(!((el("aimKind")&&el("aimKind").value)||"")){ handOff(); return; }
  aim(`reading &ldquo;${esc(raw)}&rdquo;&hellip;`);
  let r;
  try{ r=await(await fetch("api/resolve?q="+encodeURIComponent(raw))).json(); }
  catch(e){ aim("could not check that word just now."); return; }
  /* a reading nothing matches is not a reading; the word itself always stays on the
     list, even at zero, because "no report says this" is an answer too */
  const opts=(r.readings||[]).filter(x=>x.kind!=="q"&&x.n>0);
  const word=(r.readings||[]).find(x=>x.kind==="q");
  const empties=(r.readings||[]).filter(x=>x.kind!=="q"&&!x.n);
  if(!opts.length&&empties.length){
    /* the shape is right and the category is real; the file simply holds nothing
       there. Saying "no such category" would have been false. */
    const e0=empties[0];
    aim(`${esc(e0.label)} is a valid ${esc(KINDLAB[e0.kind]||e0.kind).toLowerCase()},
      but this file holds no report for it. It runs from ${esc(prettyDate(RANGE.from))}
      to ${esc(prettyDate(RANGE.to))}.`);
    return;
  }
  if(!opts.length){
    /* it used to search the write-ups without being asked, which quietly turned a
       category question into a text one. It offers instead. */
    aim(`no month, zone, airline, tail or system is called &ldquo;${esc(raw)}&rdquo;.
      ${word&&word.n?`<span class="aimopts"><button class="ghost" onclick="handOff()">
        Search the write-ups for &ldquo;${esc(raw)}&rdquo; instead <b>${num(word.n)}</b>
        </button></span>`
      :`No mechanic wrote that word either.`}`);
    return;
  }
  if(opts.length===1){ takeReading(opts[0]); return; }
  /* more than one real reading: DELTA is an airline and a word a mechanic writes.
     Picking one silently is how the wrong number reaches print. */
  AIM_OPTS=opts;
  aim(`&ldquo;${esc(raw)}&rdquo; could mean more than one thing here. Which do you want?
    <span class="aimopts">${opts.map((o,i)=>
      `<button class="ghost" onclick="takeReading(AIM_OPTS[${i}])">
        ${esc(o.label)} <em>${esc(o.what)}</em> <b>${num(o.n)}</b></button>`).join("")}</span>`);
}
let AIM_OPTS=[];
/* the handover to free text: it fills the field that owns it, scrolls it into view
   and runs the search, so the reporter can see which box answered */
function handOff(){
  const raw=(el("iAimAt")&&el("iAimAt").value||"").trim(); if(!raw)return;
  sugClose(); el("iAimAt").value="";
  el("q").value=raw;
  show("p-search"); search(0); showChange();
  const f=el("q");
  f.scrollIntoView({behavior:"smooth",block:"center"});
  f.classList.add("flash"); setTimeout(()=>f.classList.remove("flash"),1400);
  aimHold(`searched the write-ups for &ldquo;${esc(raw)}&rdquo;, not a category.
    <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
function takeReading(o){
  sugClose();
  if(o.kind==="q"){ el("iAimAt").value=o.value; handOff(); return; }
  el("iAimAt").value="";
  if(o.kind==="period"){
    const v=o.value;
    /* A year in progress does not run to 31 December. Taking 2026 used to caption
       the selection "1 Jan 2026 to 31 Dec 2026" over a count that stopped at the
       newest report, promising four months of data that do not exist yet. Both
       ends are held inside the range the file actually covers. */
    let lo,hi;
    if(v.length===4){ lo=v+"-01-01"; hi=v+"-12-31"; }
    else{ const [y,mo]=v.split("-").map(Number);
          lo=`${v}-01`; hi=`${v}-${String(new Date(y,mo,0).getDate()).padStart(2,"0")}`; }
    if(RANGE&&RANGE.from&&RANGE.to){
      const clo=lo<RANGE.from?RANGE.from:lo, chi=hi>RANGE.to?RANGE.to:hi;
      /* Clamp only where the period and the file actually overlap. A period that
         lies wholly outside, December 2026 asked in August, would otherwise come
         back as "1 Dec 2026 to 20 Aug 2026": a range running backwards. Left as
         asked, it returns nothing and says so. */
      if(clo<=chi){ lo=clo; hi=chi; }
    }
    el("from").value=lo; el("to").value=hi;
    show("p-search"); search(0); showChange();
  } else {
    setFilter(o.kind==="tail"?"tail":o.kind, o.value);
  }
  aimHold(`took ${esc(o.label)}, ${esc(o.what)}, ${num(o.n)} reports.
    <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}


/* ---- drag a period out of the timeline -------------------------------------
   The signature gesture of the instrument: the reporter takes a period by pulling
   it out of the months rather than filling in two date fields. Touch has no drag,
   so there it is tap-first, tap-last; the keyboard walks the caret and Shift
   extends. All three paths end in the same two values. */
let dragFrom=null;
function monthAt(ev,track){
  const ms=(heroData&&heroData.months)||[]; if(!ms.length)return null;
  const r=track.getBoundingClientRect();
  const x=Math.min(Math.max(ev.clientX-r.left,0),r.width-1);
  return ms[Math.min(ms.length-1,Math.floor(x/(r.width/ms.length)))].m;
}
function paintBracket(a,b){
  const box=el("hero"); if(!box)return;
  const lo=a<b?a:b, hi=a<b?b:a;
  box.querySelectorAll(".mo").forEach(n=>{
    const m=(n.dataset.aim||"").split("|")[1];
    n.classList.toggle("inband",!!m&&m>=lo&&m<=hi);
  });
  const n=((heroData&&heroData.months)||[]).filter(x=>x.m>=lo&&x.m<=hi)
    .reduce((s,x)=>s+x.n,0);
  aim(`${esc(monthName(lo))} to ${esc(monthName(hi))} &middot; ${num(n)} reports &middot; release to take it`);
}
function takePeriod(a,b){
  const lo=a<b?a:b, hi=a<b?b:a;
  const [y,mo]=hi.split("-").map(Number);
  const last=new Date(y,mo,0).getDate();
  el("from").value=`${lo}-01`; el("to").value=`${hi}-${String(last).padStart(2,"0")}`;
  show("p-search"); search(0); showChange();
  aimHold(`narrowed to ${esc(monthName(lo))}${lo===hi?"":" to "+esc(monthName(hi))}.
    <button class="undoit" onclick="history.back();unaim()">undo</button>`);
}
document.addEventListener("pointerdown",e=>{
  const track=e.target.closest&&e.target.closest(".rail.open[data-rail=when] .months");
  if(!track)return;
  e.preventDefault();
  dragFrom=monthAt(e,track);
  if(dragFrom)paintBracket(dragFrom,dragFrom);
  track.setPointerCapture&&track.setPointerCapture(e.pointerId);
});
document.addEventListener("pointermove",e=>{
  if(!dragFrom)return;
  const track=document.querySelector(".rail.open[data-rail=when] .months"); if(!track)return;
  const m=monthAt(e,track); if(m)paintBracket(dragFrom,m);
});
document.addEventListener("pointerup",e=>{
  if(!dragFrom)return;
  const track=document.querySelector(".rail.open[data-rail=when] .months");
  const m=track?monthAt(e,track):dragFrom;
  const a=dragFrom; dragFrom=null;
  takePeriod(a,m||a);
});

/* ---- aim and take: one grammar for every mark ----------------------------- */
function aimTextFor(spec){
  const d=heroData; if(!d)return "";
  const [kind,key]=spec.split("|");
  if(kind==="month"){
    const m=(d.months||[]).find(x=>x.m===key); if(!m)return "";
    return `${esc(monthName(key))} &middot; ${num(m.n)} reports &middot; click to narrow to this month`;
  }
  if(kind==="zone"){
    const z=(d.zones||[]).find(x=>x.code===key); if(!z)return "";
    const placed=(d.zones||[]).reduce((a,x)=>a+x.n,0);
    return `${esc(z.label)} &middot; ${num(z.n)} of ${num(placed)} placed findings &middot; click to narrow`;
  }
  if(kind==="pad"){
    const n=key==="nowhere"?d.no_location:d.other_location;
    return `${num(n)} reports ${key==="nowhere"?"say nothing about where on the aircraft it was":"describe the place in words rather than with an FAA zone number"}, so they cannot be drawn on the aircraft`;
  }
  if(kind==="operator")return `${esc(opName(key))} &middot; click to follow this operator`;
  if(kind==="tail")return `N${esc(key)} &middot; click to follow this one airframe`;
  if(kind==="crew"){
    const cx=(d.crew||[]).find(x=>x.code===key); if(!cx)return "";
    return `${esc(cx.label)} &middot; ${num(cx.n)} reports &middot; click to narrow`;
  }
  if(kind==="crewall")return `${num(d.crew_reports||0)} of ${num(d.total)} reports forced the crew to act`;
  if(kind==="more-ops")return `not ranked here; use the operator control below to reach any of the 309`;
  if(kind==="more-tails")return `not ranked here; type a tail number in the controls below`;
  if(kind.startsWith("drop-"))return `click to drop this constraint`;
  return "";
}
function takeFor(spec){
  const [kind,key]=spec.split("|");
  const d=heroData;
  if(kind==="month"){ heroMonth(key); return }
  if(kind==="zone"){ const z=(d.zones||[]).find(x=>x.code===key);
    takeFilter("zone",key,z?z.label:key); return }
  if(kind==="operator"){ takeFilter("operator",key,opName(key)); return }
  if(kind==="tail"){ takeFilter("tail",key,"N"+key); return }
  if(kind==="crew"){ const cx=(d.crew||[]).find(x=>x.code===key);
    takeFilter("crew",key,cx?cx.label:key); return }
}
function heroMonth(m){
  if(!m)return;
  const [y,mo]=m.split("-").map(Number);
  const last=new Date(y,mo,0).getDate();
  el("from").value=`${m}-01`; el("to").value=`${m}-${String(last).padStart(2,"0")}`;
  show("p-search"); search(0); showChange();
  aimHold(`narrowed to ${esc(monthName(m))}. <button class="undoit"
    onclick="history.back();unaim()">undo</button>`);
}
const MONTHS=["","January","February","March","April","May","June","July","August",
              "September","October","November","December"];
function monthName(m){const [y,mo]=String(m).split("-");return `${MONTHS[+mo]||m} ${y}`}

document.addEventListener("mouseover",e=>{
  const t=e.target.closest&&e.target.closest("[data-aim]");
  if(!t)return;
  const txt=aimTextFor(t.dataset.aim);
  if(txt)aim(txt);
});
document.addEventListener("focusin",e=>{
  const t=e.target.closest&&e.target.closest("[data-aim]");
  if(t){const txt=aimTextFor(t.dataset.aim); if(txt)aim(txt)}
});
document.addEventListener("mouseout",e=>{
  if(e.target.closest&&e.target.closest("[data-aim]"))unaim();
});
document.addEventListener("click",e=>{
  const t=e.target.closest&&e.target.closest("[data-take]");
  if(t){ takeFor(t.dataset.take); return }
  const c=e.target.closest&&e.target.closest(".clause[data-drop]");
  if(c){ c.dataset.drop.split("|").forEach(k=>{const x=el(k); if(x)x.value=""}); search(0); }
});
/* the keyboard must reach every gesture the pointer has, including the drag:
   arrows walk the caret, Shift extends, Enter takes what is under it */
let kbAnchor=null;
document.addEventListener("keydown",e=>{
  const t=e.target;
  const isMonth=t&&t.classList&&t.classList.contains("mo");
  if(isMonth&&["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
    e.preventDefault();
    const all=[...document.querySelectorAll(".rail.open .mo")];
    const i=all.indexOf(t);
    const j=e.key==="ArrowLeft"?Math.max(0,i-1)
          :e.key==="ArrowRight"?Math.min(all.length-1,i+1)
          :e.key==="Home"?0:all.length-1;
    if(e.shiftKey&&kbAnchor===null)kbAnchor=i;
    if(!e.shiftKey)kbAnchor=null;
    all[j].focus();                       /* focus first, or focusin overwrites the bracket */
    if(e.shiftKey)paintBracket((all[kbAnchor].dataset.aim||"").split("|")[1],
                               (all[j].dataset.aim||"").split("|")[1]);
    return;
  }
  if(e.key!=="Enter"&&e.key!==" ")return;
  if(isMonth){
    e.preventDefault();
    const m=(t.dataset.aim||"").split("|")[1];
    if(kbAnchor!==null){
      const all=[...document.querySelectorAll(".rail.open .mo")];
      takePeriod((all[kbAnchor].dataset.aim||"").split("|")[1], m); kbAnchor=null;
    } else heroMonth(m);
    return;
  }
  if(t&&t.dataset&&t.dataset.take){ e.preventDefault(); takeFor(t.dataset.take) }
});

/* pointing at a row of evidence lights where it sits in the instrument */
function heroMark(row){
  const box=el("hero"); if(!box)return;
  box.querySelectorAll(".lit").forEach(x=>x.classList.remove("lit"));
  document.querySelectorAll("tr.spine.lit").forEach(x=>x.classList.remove("lit"));
  if(!row)return;
  const m=row.dataset.month, z=row.dataset.zone;
  if(m){const e2=box.querySelector(`[data-aim="month|${m}"]`); if(e2)e2.classList.add("lit");
        document.querySelectorAll(`tr.spine[data-spine="${m}"]`).forEach(x=>x.classList.add("lit"))}
  if(z){box.querySelectorAll(`[data-aim="zone|${z}"]`).forEach(x=>x.classList.add("lit"))}
}
document.addEventListener("mouseover",e=>{
  const r=e.target.closest&&e.target.closest("table.reports tr[data-month]");
  if(r)heroMark(r);
});
document.addEventListener("mouseleave",e=>{
  if(e.target.closest&&e.target.closest("table.reports")){heroMark(null)}
},true);

/* Hover anything in the table and the panel explains it. Answers are cached, so
   a table of 100 reports costs a handful of requests, not one per hover. */
const XCACHE=new Map(); let xTimer=null, xOver=false, xKey=null;
function xHide(force){ if(xOver&&!force)return; el("tip").style.display="none"; xKey=null; }
/* Anchored to the element, not the cursor: a panel that follows the mouse can never
   be reached, and one placed below mid-screen falls off the bottom. */
let xAnchor=null, xDid=null;
function xPlace(target){
  const t=el("tip"); const el0=target||xAnchor; if(!el0)return;
  const r=el0.getBoundingClientRect(), h=t.offsetHeight||340;
  t.style.left=Math.max(8,Math.min(r.right+12,window.innerWidth-(t.offsetWidth||352)-12))+"px";
  t.style.top=Math.max(8,Math.min(r.top,window.innerHeight-h-8))+"px";
}
function xRender(d){
  if(d.error){el("tip").innerHTML='<b>No explanation available</b>';return}
  const facts=(d.facts||[]).map(([k,v])=>`<div class="f"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
  const list=(d.list||[]).length?`<div class="lt">${esc(d.list_title||"")}</div>`+
    d.list.map(i=>`<div class="f"><span>${esc(i.label)}</span><b>${Number(i.n).toLocaleString("en")}</b></div>`).join(""):"";