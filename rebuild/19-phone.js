
/* ---------- rv: scoped helpers (no name collides with the page) ---------- */
function rvQ(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function rvEsc(s){
  if(typeof esc==='function'){try{return esc(s)}catch(e){}}
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}
function rvNum(n){
  if(typeof num==='function'){try{return num(n)}catch(e){}}
  n=Number(n);return isFinite(n)?n.toLocaleString('en'):String(n);
}
function rvEl(id){
  if(typeof el==='function'){try{return el(id)}catch(e){}}
  return document.getElementById(id);
}
/* guarded reads of the page's own closure helpers (TDZ-safe) */
function rvOpLbl(o){try{if(typeof opName==='function'){var s=opName(o);if(s)return s}}catch(e){}return o||''}
function rvMonName(m){try{if(typeof monthName==='function')return monthName(m)}catch(e){}
  var M=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var p=String(m||'').split('-');return (M[+p[1]]||m||'')+(p[0]?' '+p[0]:'');}
function rvPartMonth(m){try{if(typeof partialMonth==='function')return !!partialMonth(m)}catch(e){}return false}
function rvTakeFilter(f,v,l){try{if(typeof takeFilter==='function'){takeFilter(f,v,l||'');return true}}catch(e){}return false}
function rvSetFilter(f,v){try{if(typeof setFilter==='function'){setFilter(f,v);return true}}catch(e){}return false}
function rvSearch(){try{if(typeof search==='function'){search(0);return true}}catch(e){}return false}
function rvGoResults(){try{if(typeof goResults==='function'){goResults();return true}}catch(e){}return false}
var RV_={mode:null,deskLen:-1,phTap:null,phFrom:null,harvesting:false,phFails:0,phDisabled:false,
         t:null,inited:false,caseSession:null,caseDir:0};

/* ---------- rv: the phone stylesheet (injected once, all scoped) ---------- */
function rvCss(){
  if(rvEl('rvPhoneCss'))return;
  var s=document.createElement('style');s.id='rvPhoneCss';s.type='text/css';
  s.textContent=[
'#hero.phone{border-radius:0;margin:0 -20px;border-left:0;border-right:0;background:var(--paper,#f7f5f0)}',
'#hero.phone .rv-desk{display:none!important}',
'#hero.phone .rv-ph{display:block}',
'#hero.phone .phbar{position:sticky;top:0;z-index:20;background:var(--paper,#f7f5f0);border-bottom:1px solid var(--line,#e2ded5);padding:8px 14px;display:flex;flex-direction:column;gap:5px}',
'#hero.phone .phcount{font-family:"Instrument Serif",Georgia,serif;font-size:22px;line-height:1;color:var(--ink,#1d1d1f)}',
'#hero.phone .phcount b{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:20px;color:#b8431f;font-weight:500}',
'#hero.phone .phchips{display:flex;gap:5px;flex-wrap:wrap;font-size:11.5px}',
'#hero.phone .phchips .chip{cursor:pointer;border:0;background:#efece5;border-radius:10px;padding:3px 9px;font-size:11.5px;color:#5f584f;font-family:inherit;display:inline-block}',
'#hero.phone .phchips .chip b{margin-left:3px}',
'#hero.phone .phchips .rv-none{color:var(--ash,#6b6560)}',
'#hero.phone .phacts{display:flex;gap:8px}',
'#hero.phone .phacts .ghost{flex:1;min-height:38px;font-size:12.5px;font-family:inherit}',
'#hero.phone .phacts .badge{font-style:normal;background:#c44b28;color:#fff;border-radius:9px;padding:0 6px;margin-left:5px;font-size:11px}',
'#hero.phone .ph{border-top:1px solid var(--line,#e2ded5)}',
'#hero.phone .phhead{width:100%;display:flex;align-items:baseline;gap:8px;background:none;color:inherit;border:0;padding:11px 14px;min-height:44px;text-align:left;cursor:pointer;font-family:inherit}',
'#hero.phone .phq{font:600 11px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:inherit}',
'#hero.phone .phpn{font-size:11px;color:var(--ash,#6b6560)}',
'#hero.phone .phclause{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;color:#b8431f;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#hero.phone .phchev{margin-left:auto;color:var(--ash,#6b6560)}',
'#hero.phone .ph.shut .phbody{display:none}',
'#hero.phone .phbody{padding:0 14px 10px}',
'#hero.phone .phpresets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
'#hero.phone .chipbtn{border:1px solid var(--line,#e2ded5);background:#fff;color:var(--ink,#1d1d1f);border-radius:999px;padding:6px 14px;font-size:12px;min-height:44px;cursor:pointer;font-family:inherit}',
'#hero.phone .phstrip{display:flex;gap:3px;overflow-x:auto;touch-action:pan-x;padding-bottom:4px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}',
'#hero.phone .phmo{flex:none;width:44px;min-height:44px;border:0;background:none;color:var(--ink,#1d1d1f);padding:0;position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;cursor:pointer;font-family:inherit}',
'#hero.phone .phmo i{display:block;width:22px;background:#d8d2c6;border-radius:1px}',
'#hero.phone .phmo span{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:9.5px;color:var(--ash,#6b6560);margin-top:2px}',
'#hero.phone .phmo.part i{background:repeating-linear-gradient(45deg,#d8d2c6 0 3px,#f7f5f0 3px 6px)}',
'#hero.phone .phmo.lit i{background:#c44b28}',
'#hero.phone .phmo.lit{outline:1.5px solid currentColor;outline-offset:1px}',
'#hero.phone .phhint{font-size:11.5px;color:var(--smoke,#6b6560);margin-top:4px}',
'#hero.phone .phmap{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
'#hero.phone .phmap.pads{grid-template-columns:1fr 1fr;margin-top:6px}',
'#hero.phone .phcell{min-height:64px;width:100%;border:1px solid var(--line,#e2ded5);color:var(--ink,#1d1d1f);border-radius:5px;cursor:pointer;background:rgba(196,75,40,var(--f,.1));display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:7px 9px;gap:2px;text-align:left;font-family:inherit}',
'#hero.phone .phcell span{font-size:11.5px;line-height:1.25}',
'#hero.phone .phcell b{font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:400;font-size:12px;color:#5f584f}',
'#hero.phone .phcell.pad{background:repeating-linear-gradient(45deg,#efeae0 0 4px,#f7f5f0 4px 8px)}',
'#hero.phone .phcell.lit,#hero.phone .phrow.lit{outline:2px solid var(--ink,#1d1d1f);outline-offset:1px}',
'#hero.phone .phsub{font:600 10.5px/1 Archivo,system-ui,sans-serif;letter-spacing:.1em;color:var(--ash,#6b6560);margin:8px 0 4px}',
'#hero.phone .phladder{display:flex;flex-direction:column;gap:2px}',
'#hero.phone .phrow{display:grid;grid-template-columns:1fr 52px;grid-template-areas:"n n" "b c";row-gap:2px;min-height:52px;align-content:center;border:0;background:none;color:var(--ink,#1d1d1f);padding:0 2px;cursor:pointer;text-align:left;font-family:inherit;width:100%}',
'#hero.phone .phrow .pn2{grid-area:n;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#hero.phone .phrow .pb{grid-area:b;height:7px;background:#e8e3d8;border-radius:4px;overflow:hidden}',
'#hero.phone .phrow .pb i{display:block;height:100%;background:#c44b28}',
'#hero.phone .phrow b{grid-area:c;font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:400;text-align:right;font-size:12px;color:#5f584f}',
'#hero.phone .phblock{position:relative;height:26px;background:#e8e3d8;border-radius:4px;overflow:hidden;display:flex;align-items:center;margin-bottom:8px}',
'#hero.phone .phblock i{position:absolute;left:0;top:0;bottom:0;background:#c44b28}',
'#hero.phone .phblock span{position:relative;padding-left:9px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px}',
'#hero.phone .specimen{margin:10px 14px 0;border-top:1px solid var(--line,#e2ded5);padding-top:6px}',
'#hero.phone .margin{margin:10px 14px 0;border-top:1px solid var(--line,#e2ded5);padding-top:6px}',
'#hero.phone .seam{display:block;width:100%;height:44px;border:0;background:#c44b28;color:#fff;font:600 12px/1 Archivo,system-ui,sans-serif;cursor:pointer;border-radius:0;margin-top:10px}',
'#hero.phone .seam:hover{background:#a83d1f}',
'#rvPhPill{position:fixed;left:12px;right:12px;bottom:12px;z-index:90;min-height:52px;border:0;border-radius:10px;background:var(--ink,#1d1d1f);color:#fff;font-size:13px;font-family:inherit;padding:10px 14px;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.32);cursor:pointer}',
'#rvPhPill[hidden]{display:none}',
'#rvPhPill .go{display:block;color:#ffb08a;font-weight:600;margin-top:3px}',
'.panel h1{font:700 21px/1.25 Archivo,system-ui,sans-serif;margin:0 0 8px;color:inherit}',
'@media(max-width:479px){#hero.phone .specimen{display:none}}'
  ].join('\n');
  document.head.appendChild(s);
}

/* ---------- rv: model building (page data first, DOM marks second) ---------- */
function rvEmptyModel(){return {total:0,months:[],zones:[],ops:[],tails:[],crew:[],
  pads:{nowhere:0,outside:0},crewN:0};}
function rvCountOf(t){
  var m=/([\d][\d,]*)\s*reports?/i.exec(t||'');
  if(m)return Number(m[1].replace(/,/g,''));
  var all=String(t||'').match(/\d[\d,]*/g);
  return all?Number(all[all.length-1].replace(/,/g,'')):0;
}
function rvZoneLabel(lab,key){
  var s=String(lab||'').replace(/,?\s*[\d,]+\s+reports?.*$/i,'').trim();
  return s||key;
}
function rvModelFromData(d){
  if(!d)return null;
  var m=rvEmptyModel();
  m.total=Number(d.total)||0;
  m.crewN=Number(d.crew_reports)||0;
  (d.months||[]).forEach(function(x){if(x&&x.m)m.months.push(
    {key:x.m,n:Number(x.n)||0,label:rvMonName(x.m),part:rvPartMonth(x.m)});});
  (d.zones||[]).forEach(function(z){if(z&&z.code)m.zones.push(
    {key:z.code,label:z.label||z.code,n:Number(z.n)||0});});
  (d.operator_rows||[]).forEach(function(r){if(r&&r.o)m.ops.push(
    {key:r.o,label:rvOpLbl(r.o),n:Number(r.n)||0});});
  (d.swarm||[]).slice(0,8).forEach(function(a){if(a&&a.t)m.tails.push(
    {key:a.t,label:'N'+a.t,n:Number(a.n)||0});});
  (d.crew||[]).forEach(function(c){if(!c)return;
    if(['K','0','O'].indexOf(String(c.code))>=0)return;
    m.crew.push({key:c.code,label:c.label||c.code,n:Number(c.n)||0});});
  m.crew.sort(function(a,b){return b.n-a.n});m.crew=m.crew.slice(0,8);
  m.pads.nowhere=Number(d.no_location)||0;
  m.pads.outside=Number(d.other_location)||0;
  return m;
}
function rvModelFromDOM(scope){
  var m=rvEmptyModel(),seen={};
  rvQ('[data-aim^="month|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-aim')||'').slice(6);
    if(!k||seen['m'+k])return;seen['m'+k]=1;
    var lab=e.getAttribute('aria-label')||e.getAttribute('title')||'';
    m.months.push({key:k,n:rvCountOf(lab),label:rvMonName(k),
      part:/part month|still filling/i.test(lab)});
  });
  var zs={};
  rvQ('[data-take^="zone|"],[data-aim^="zone|"]',scope).forEach(function(e){
    var spec=e.getAttribute('data-take')||e.getAttribute('data-aim')||'';
    var k=spec.slice(5);if(!k||zs[k])return;zs[k]=1;
    if(/^ZONE\s*0+$/i.test(k))return;
    var lab=e.getAttribute('aria-label')||e.getAttribute('title')||'';
    m.zones.push({key:k,label:rvZoneLabel(lab,k),n:rvCountOf(lab)});
  });
  var os={};
  rvQ('[data-take^="operator|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(9);
    if(!k||os[k])return;os[k]=1;
    var lEl=e.querySelector('.rv-lname')||e.querySelector('.on');
    var nEl=e.querySelector('b');
    m.ops.push({key:k,label:(lEl?lEl.textContent:e.textContent)
      .replace(/\s*\([A-Z0-9]{2,4}\)\s*$/,'').trim(),n:nEl?rvCountOf(nEl.textContent):0});
  });
  var ts={};
  rvQ('[data-take^="tail|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(5);
    if(!k||ts[k])return;ts[k]=1;
    var nEl=e.querySelector('b');
    m.tails.push({key:k,label:'N'+k,n:nEl?rvCountOf(nEl.textContent):0});
  });
  var cs={};
  rvQ('[data-take^="crew|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-take')||'').slice(5);
    if(!k||cs[k])return;cs[k]=1;
    var lEl=e.querySelector('.on');var nEl=e.querySelector('b');
    m.crew.push({key:k,label:(lEl?lEl.textContent:e.textContent).trim(),
      n:nEl?rvCountOf(nEl.textContent):0});
  });
  var fb=scope.querySelector('.fblock,[data-aim="crewall"]');
  if(fb){var mm=/([\d,]+)\s*of\s*([\d,]+)/.exec((fb.querySelector('.flab')||fb).textContent||'');
    if(mm){m.crewN=Number(mm[1].replace(/,/g,''));
      if(!m.total)m.total=Number(mm[2].replace(/,/g,''));}}
  rvQ('[data-aim^="pad|"]',scope).forEach(function(e){
    var k=(e.getAttribute('data-aim')||'').slice(4);
    var n=rvCountOf(e.getAttribute('aria-label')||e.textContent||'');
    if(k==='nowhere')m.pads.nowhere=n;if(k==='outside')m.pads.outside=n;
  });
  var rc=scope.querySelector('.rv-count');if(rc)m.total=rvCountOf(rc.textContent)||m.total;
  return m;
}
function rvMergeInto(base,add){
  if(!add)return base;
  ['months','zones','ops','tails','crew'].forEach(function(fld){
    var have={};base[fld].forEach(function(x){have[x.key]=1});
    (add[fld]||[]).forEach(function(x){if(!have[x.key])base[fld].push(x)});
  });
  if(!base.total&&add.total)base.total=add.total;
  if(!base.crewN&&add.crewN)base.crewN=add.crewN;
  if(!base.pads.nowhere&&add.pads.nowhere)base.pads.nowhere=add.pads.nowhere;
  if(!base.pads.outside&&add.pads.outside)base.pads.outside=add.pads.outside;
  return base;
}
/* one rail is open on the desktop instrument; walk the picker to harvest the rest */
function rvHarvestAll(hero,m){
  if(m.months.length&&m.zones.length&&(m.crew.length||m.crewN))return m;
  var btns=rvQ('.picker [data-pick]',hero);
  if(!btns.length)return m;
  var orig=null;
  btns.forEach(function(b){if(b.getAttribute('aria-selected')==='true')orig=b;});
  var origKind=orig?orig.getAttribute('data-pick'):null;
  btns.forEach(function(b){try{b.click()}catch(e){}
    rvMergeInto(m,rvModelFromDOM(hero));});
  var back=null;
  btns.forEach(function(b){if(b.getAttribute('data-pick')===origKind)back=b;});
  try{(back||orig||btns[0]).click()}catch(e){}
  return m;
}
function rvCollectModel(hero){
  var m=rvEmptyModel(),d=null;
  try{d=(typeof heroData==='undefined')?null:heroData}catch(e){d=null}
  if(d)rvMergeInto(m,rvModelFromData(d));
  rvMergeInto(m,rvModelFromDOM(hero));
  RV_.harvesting=true;
  try{rvHarvestAll(hero,m)}finally{RV_.harvesting=false}
  rvMergeInto(m,rvModelFromDOM(hero));
  m.months.sort(function(a,b){return a.key<b.key?-1:a.key>b.key?1:0});
  m.ops.sort(function(a,b){return b.n-a.n});
  m.tails.sort(function(a,b){return b.n-a.n});
  m.crew.sort(function(a,b){return b.n-a.n});
  return m;
}

/* ---------- rv: the phone renderer ---------- */
function rvSection(id,q,pn,bodyHtml,clause){
  var sec=document.createElement('section');sec.className='ph';
  sec.setAttribute('data-rv-ph',id);
  var head=document.createElement('button');head.type='button';head.className='phhead';
  head.innerHTML='<span class="phq">'+q+'</span>'+
    (clause?'<span class="phclause">'+rvEsc(clause)+'</span>'
           :'<span class="phpn">'+pn+'</span>')+
    '<span class="phchev">&#8964;</span>';
  head.addEventListener('click',function(){sec.classList.toggle('shut')});
  var bd=document.createElement('div');bd.className='phbody';bd.innerHTML=bodyHtml;
  sec.appendChild(head);sec.appendChild(bd);
  return sec;
}
function rvLadder(rows,field){
  var mx=1;rows.forEach(function(r){if(r.n>mx)mx=r.n});
  return '<div class="phladder">'+rows.map(function(r){
    return '<button type="button" class="phrow" data-rv-take="'+field+'|'+rvEsc(r.key)+
      '" aria-label="'+rvEsc(r.label)+', '+rvNum(r.n)+' reports">'+
      '<span class="pn2">'+rvEsc(r.label)+'</span>'+
      '<span class="pb"><i style="width:'+(r.n/mx*100).toFixed(1)+'%"></i></span>'+
      '<b>'+rvNum(r.n)+'</b></button>';
  }).join('')+'</div>';
}
function rvCurLabel(field,model){
  var e=rvEl(field);var v=e?String(e.value||'').trim():'';
  if(!v)return '';
  var list=field==='operator'?model.ops:field==='zone'?model.zones:
           field==='crew'?model.crew:model.tails;
  for(var i=0;i<list.length;i++)if(String(list[i].key)===v)return list[i].label;
  return v;
}
function rvPeriodText(){
  var f=rvEl('from'),t=rvEl('to');
  if(!f||!t){var ds=rvQ('input[type="date"]');f=ds[0];t=ds[1];}
  var a=f&&f.value,b=t&&t.value;
  if(!a&&!b){
    var cl=null;
    rvQ('.rv-clause').some(function(c){
      var tx=c.textContent||'';
      if(/(January|February|March|April|May|June|July|August|September|October|November|December|\d{4})/.test(tx)){cl=tx;return true}
      return false;});
    return cl?cl.trim():'';
  }
  var MF=['','January','February','March','April','May','June','July','August','September','October','November','December'];
  var MS=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var fmt=function(iso){var p=iso.split('-');return (+p[2])+' '+MS[+p[1]]+' '+p[0]};
  if(a&&b){
    if(a.slice(0,7)===b.slice(0,7)&&a.slice(8)==='01'){
      var last=new Date(+a.slice(0,4),+a.slice(5,7),0).getDate();
      if(+b.slice(8)===last)return MF[+a.slice(5,7)]+' '+a.slice(0,4);
      return '1 to '+(+b.slice(8))+' '+MF[+a.slice(5,7)]+' '+a.slice(0,4);
    }
    if(a.slice(0,7)===b.slice(0,7))return fmt(a)+' to '+fmt(b);
    return fmt(a)+' to '+fmt(b);
  }
  return a?('from '+fmt(a)):('up to '+fmt(b));
}
function rvBounds(){
  var f=rvEl('from'),t=rvEl('to');
  if(!f||!t){var ds=rvQ('input[type="date"]');f=ds[0];t=ds[1];}
  return (f&&t)?{f:f,t:t}:null;
}
function rvPreset(k){
  var b=rvBounds();if(!b)return;
  var to=b.t.max||b.t.value||'';if(!to)return;
  if(!k){b.f.value='';b.t.value='';}
  else if(k==='Y'){var v=to.slice(0,4)+'-01-01';
    if(b.f.min&&v<b.f.min)v=b.f.min;b.f.value=v;b.t.value=to;}
  else{var days=k==='90'?90:365;
    var d=new Date(to+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-days);
    var v2=d.toISOString().slice(0,10);
    if(b.f.min&&v2<b.f.min)v2=b.f.min;b.f.value=v2;b.t.value=to;}
  [b.f,b.t].forEach(function(x){if(x)x.dispatchEvent(new Event('change',{bubbles:true}))});
  rvSearch();
}
function rvTakePeriod(a,b){
  var lo=a<b?a:b,hi=a<b?b:a;
  var bd=rvBounds();if(!bd)return;
  var last=new Date(+hi.split('-')[0],+hi.split('-')[1],0).getDate();
  var hiFull=hi+'-'+String(last).padStart(2,'0');
  var loFull=lo+'-01';
  if(bd.f.min&&loFull<bd.f.min)loFull=bd.f.min;
  if(bd.t.max&&hiFull>bd.t.max)hiFull=bd.t.max;
  bd.f.value=loFull;bd.t.value=hiFull;
  [bd.f,bd.t].forEach(function(x){if(x)x.dispatchEvent(new Event('change',{bubbles:true}))});
  rvSearch();
  rvPhShow('Taken: '+rvMonName(lo)+(lo===hi?'':' to '+rvMonName(hi)),'');
  clearTimeout(RV_.flashT);RV_.flashT=setTimeout(rvPhClear,2500);
}
function rvPhShow(text,go){
  var p=rvEl('rvPhPill');
  if(!p){p=document.createElement('button');p.type='button';p.id='rvPhPill';
    p.setAttribute('aria-live','polite');document.body.appendChild(p);
    p.addEventListener('click',function(e){e.stopPropagation();rvPhCommit();});}
  p.innerHTML=rvEsc(text)+'<span class="go">'+(go||'take it &rarr;')+'</span>';
  p.hidden=false;
}
function rvPhClear(){
  RV_.phTap=null;RV_.phFrom=null;
  rvQ('[data-rv-take].lit,[data-rv-month].lit').forEach(function(x){x.classList.remove('lit')});
  var p=rvEl('rvPhPill');if(p)p.hidden=true;
}
function rvPhCommit(){
  var spec=RV_.phTap;rvPhClear();
  if(!spec)return;
  var i=spec.indexOf('|'),field=spec.slice(0,i),val=spec.slice(i+1);
  if(rvTakeFilter(field,val))return;
  if(rvSetFilter(field,val))return;
  var c=rvEl(field);
  if(c){c.value=val;c.dispatchEvent(new Event('change',{bubbles:true}));rvSearch();return;}
  var desk=document.querySelector('#hero > .rv-desk');
  if(desk){var mk=desk.querySelector('[data-take="'+spec+'"]');if(mk)try{mk.click()}catch(e){}}
}
function rvBuildPhoneDOM(ph,desk,model){
  ph.innerHTML='';
  var count=model.total||0;
  var clauses=rvQ('.rv-clause',desk);
  var chips='';
  clauses.forEach(function(c){
    var txt=(c.textContent||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
    if(txt)chips+='<button type="button" class="chip rv-chip">'+rvEsc(txt)+
      '&nbsp;<b aria-hidden="true">&times;</b></button>';
  });
  var bar=document.createElement('div');bar.className='phbar';
  bar.innerHTML='<div class="phcount"><b>'+rvNum(count)+'</b> '+(count===1?'report':'reports')+'</div>'+
    '<div class="phchips">'+(chips||'<span class="rv-none">nothing filtered yet</span>')+'</div>'+
    '<div class="phacts">'+
    '<button type="button" class="ghost rv-af">All filters'+
    (clauses.length?' <i class="badge">'+clauses.length+'</i>':'')+'</button>'+
    '<button type="button" class="ghost rv-top">&uarr; back</button></div>';
  rvQ('.rv-chip',bar).forEach(function(ch,i){
    ch.addEventListener('click',function(ev){ev.stopPropagation();
      var c=clauses[i];if(c)try{c.click()}catch(e){}});});
  bar.querySelector('.rv-af').addEventListener('click',function(){
    try{var d=rvEl('morefilters');if(d)d.open=true}catch(e){}
    var t=rvEl('p-search')||document.querySelector('.filters,.morefilters');
    if(t&&t.scrollIntoView)try{t.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  });
  bar.querySelector('.rv-top').addEventListener('click',function(){
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}});
  ph.appendChild(bar);

  /* WHEN */
  var wb='',bd2=rvBounds();
  if(bd2){
    wb+='<div class="phpresets">'+
      [['all reports',''],['this year','Y'],['last 12 months','12'],['last 90 days','90']]
      .map(function(p){return '<button type="button" class="chipbtn" data-rv-preset="'+p[1]+'">'+p[0]+'</button>'})
      .join('')+'</div>';
  }
  if(model.months.length){
    var mx=1;model.months.forEach(function(x){if(x.n>mx)mx=x.n});
    wb+='<div class="phstrip" role="group" aria-label="Months, swipe sideways">';
    model.months.forEach(function(x){
      var h=Math.max(2,Math.round(x.n/mx*30));
      wb+='<button type="button" class="phmo'+(x.part?' part':'')+
        '" data-rv-month="'+rvEsc(x.key)+'" aria-label="'+rvEsc(x.label)+', '+
        rvNum(x.n)+' reports'+(x.part?', a part month':'')+'">'+
        '<i style="height:'+h+'px"></i><span>'+rvEsc(x.key.slice(5))+'</span></button>';
    });
    wb+='</div><div class="phhint">Tap the first month, then the last, to take a range.</div>';
  }else wb+='<p class="phhint">No month strip available.</p>';
  ph.appendChild(rvSection('when','WHEN','month by month',wb,rvPeriodText()));

  /* WHERE */
  var zby={},zmx=1;
  model.zones.forEach(function(z){
    var num=(/(\d00)/.exec(z.key)||[])[1]||z.key;
    zby[num]=z;if(z.n>zmx)zmx=z.n;});
  var ZN={100:'Lower fuselage',200:'Upper fuselage',300:'Empennage',
    400:'Engine nacelles and pylons',500:'Left wing',600:'Right wing',
    700:'Landing gear',800:'Doors',900:'Lavatories and galleys'};
  var zb='<div class="phmap">';
  [['800','200','100'],['500','400','600'],['300','700','900']].forEach(function(row){
    row.forEach(function(num){
      var z=zby[num],lab=z?z.label:(ZN[num]||('Zone '+num)),n=z?z.n:0;
      var key=z?z.key:('ZONE '+num);
      var f=(0.10+0.80*(n/zmx)).toFixed(3);
      zb+='<button type="button" class="phcell" data-rv-take="zone|'+rvEsc(key)+
        '" style="--f:'+f+'" aria-label="'+rvEsc(lab)+', '+rvNum(n)+' reports">'+
        '<span>'+rvEsc(lab)+'</span><b>'+rvNum(n)+'</b></button>';
    });});
  zb+='</div><div class="phmap pads">'+
    '<div class="phcell pad"><span>no location given</span><b>'+rvNum(model.pads.nowhere||0)+'</b></div>'+
    '<div class="phcell pad"><span>place named in words, not as a zone</span><b>'+rvNum(model.pads.outside||0)+'</b></div></div>';
  ph.appendChild(rvSection('where','WHERE','on the aircraft',zb,rvCurLabel('zone',model)));

  /* WHO */
  var whb='';
  if(model.ops.length)whb+='<div class="phsub">Airlines</div>'+rvLadder(model.ops,'operator');
  if(model.tails.length)whb+='<div class="phsub">Aircraft</div>'+rvLadder(model.tails,'tail');
  if(!whb)whb='<p class="phhint">No airlines or aircraft to list.</p>';
  var whoClause=rvCurLabel('operator',model);
  if(!whoClause){var ti=rvEl('tail');if(ti&&ti.value)whoClause='N'+ti.value;}
  ph.appendChild(rvSection('whose','WHO','airline and tail',whb,whoClause));

  /* FORCED */
  var fb2='',tot=model.total||0;
  if(model.crewN&&tot){
    fb2+='<div class="phblock"><i style="width:'+(model.crewN/tot*100).toFixed(1)+
      '%"></i><span>'+rvNum(model.crewN)+' of '+rvNum(tot)+' forced a crew action</span></div>';}
  if(model.crew.length)fb2+=rvLadder(model.crew,'crew');
  var fSec=rvSection('forced','WHAT IT FORCED','what the crew did',
    fb2||'<p class="phhint">No crew actions recorded here.</p>',rvCurLabel('crew',model));
  if(!model.crewN&&!model.crew.length)fSec.classList.add('shut');
  ph.appendChild(fSec);

  /* evidence, margin, seam: carried over from the desktop render */
  if(desk){
    var sp=desk.querySelector('.specimen');if(sp)ph.appendChild(sp.cloneNode(true));
    var mg=desk.querySelector('.margin');if(mg)ph.appendChild(mg.cloneNode(true));
    var sm=desk.querySelector('.seam');if(sm)ph.appendChild(sm.cloneNode(true));
  }
}

/* ---------- rv: phone / desktop switch ---------- */
function rvIsPhone(){
  try{return window.matchMedia('(max-width:760px)').matches}
  catch(e){return window.innerWidth<=760}
}
function rvApply(){
  var hero=rvEl('hero');if(!hero||RV_.harvesting||RV_.phDisabled)return;
  var desk=hero.querySelector(':scope > .rv-desk');
  var mine=hero.querySelector(':scope > .rv-ph');
  if(!rvIsPhone()){
    if(RV_.mode==='phone'||desk||mine){
      var p=rvEl('rvPhPill');if(p)p.hidden=true;
      if(desk){
        var frag=document.createDocumentFragment();
        while(desk.firstChild)frag.appendChild(desk.firstChild);
        hero.innerHTML='';hero.appendChild(frag);
      }
      hero.classList.remove('phone');
      RV_.mode='desktop';RV_.phTap=null;RV_.phFrom=null;RV_.deskLen=-1;
    }
    return;
  }
  if(mine&&desk&&RV_.mode==='phone')return;   /* ours, unchanged */
  RV_.mode='phone';
  try{
    var model=rvCollectModel(hero);
    desk=document.createElement('div');desk.className='rv-desk';
    while(hero.firstChild)desk.appendChild(hero.firstChild);
    var ph=document.createElement('div');ph.className='rv-ph';
    hero.appendChild(desk);hero.appendChild(ph);
    rvBuildPhoneDOM(ph,desk,model);
    hero.classList.add('phone');
    RV_.deskLen=desk.innerHTML.length;RV_.phFails=0;
  }catch(e){
    /* leave the desktop instrument standing rather than half a phone */
    var d2=hero.querySelector(':scope > .rv-desk'),p2=hero.querySelector(':scope > .rv-ph');
    if(p2)p2.remove();
    if(d2){while(d2.firstChild)hero.appendChild(d2.firstChild);d2.remove();}
    hero.classList.remove('phone');
    RV_.mode=null;RV_.deskLen=-1;
    if(++RV_.phFails>2)RV_.phDisabled=true;
  }
}

/* ---------- rv: gesture handling for the phone marks ---------- */
document.addEventListener('click',function(e){
  if(RV_.mode!=='phone')return;
  var t=e.target.closest?e.target.closest('[data-rv-take]'):null;
  if(t){
    e.preventDefault();e.stopPropagation();
    var spec=t.getAttribute('data-rv-take');
    if(RV_.phTap===spec){rvPhCommit();return;}
    rvQ('[data-rv-take].lit').forEach(function(x){x.classList.remove('lit')});
    RV_.phTap=spec;t.classList.add('lit');
    var lab=t.getAttribute('aria-label')||'this mark';
    rvPhShow(lab.replace(/,?\s*[\d,]+\s+reports?/i,''),'take it \u2192');
    return;
  }
  var mo=e.target.closest?e.target.closest('[data-rv-month]'):null;
  if(mo){
    e.preventDefault();e.stopPropagation();
    var k=mo.getAttribute('data-rv-month');
    if(!RV_.phFrom){
      RV_.phFrom=k;mo.classList.add('lit');
      rvPhShow((mo.getAttribute('aria-label')||rvMonName(k)).replace(/,?\s*[\d,]+\s+reports?/i,''),
        'now tap the last month');
    }else{
      var a=RV_.phFrom;RV_.phFrom=null;
      rvQ('[data-rv-month].lit').forEach(function(x){x.classList.remove('lit')});
      rvTakePeriod(a,k);
    }
    return;
  }
  var pr=e.target.closest?e.target.closest('[data-rv-preset]'):null;
  if(pr){e.preventDefault();rvPreset(pr.getAttribute('data-rv-preset'));return;}
  if((RV_.phTap||RV_.phFrom)&&!e.target.closest('#rvPhPill'))rvPhClear();
},true);
window.addEventListener('scroll',function(){
  if(RV_.phTap||RV_.phFrom)rvPhClear();
},{passive:true});

/* ---------- rv: case sheet stepper ---------- */
function rvFindStepperLabel(box){
  var cands=rvQ('span,div,p,b',box).filter(function(e){
    if(e.querySelector('button'))return false;
    var t=(e.textContent||'').trim();
    return /of\s+[\d,]+\s+that\s+match/i.test(t)
        || /of\s+[\d,]+\s+loaded/i.test(t)
        || /^[\d,]+\s+of\s+[\d,]+$/i.test(t);
  });
  for(var i=0;i<cands.length;i++){
    var p=cands[i].parentElement;
    if(p&&(p.textContent.indexOf('\u2039')>=0||p.textContent.indexOf('\u203a')>=0))return cands[i];
  }
  return cands[0]||null;
}
function rvCaseOrder(){
  var res=rvEl('results'),ids=[],seen={};
  var push=function(id){id=String(id||'').trim();if(id&&!seen[id]){seen[id]=1;ids.push(id);}};
  if(res){
    rvQ('[data-case]',res).forEach(function(e){push(e.getAttribute('data-case'))});
    rvQ('[onclick]',res).forEach(function(e){
      var oc=e.getAttribute('onclick')||'';
      if(/case/i.test(oc)){var m=/['"]([A-Za-z0-9\-_]{6,})['"]/.exec(oc);if(m)push(m[1]);}
    });
  }
  return ids;
}
function rvStepperButtons(lab){
  var holder=lab.parentElement,btns=holder?rvQ('button',holder):[];
  if(btns.length<2&&holder&&holder.parentElement){holder=holder.parentElement;btns=rvQ('button',holder);}
  var prev=null,next=null;
  btns.forEach(function(b){var t=b.textContent||'';
    if(t.indexOf('\u2039')>=0)prev=prev||b;
    if(t.indexOf('\u203a')>=0)next=next||b;});
  if(!prev&&!next&&btns.length===2){prev=btns[0];next=btns[1];}
  return {prev:prev,next:next};
}
function rvFixStepper(){
  var box=rvEl('case-box');if(!box)return;
  if(!(box.offsetHeight>0)){RV_.caseSession=null;return;}
  var lab=rvFindStepperLabel(box);if(!lab)return;
  var txt0=(lab.textContent||'').trim();
  var sess=RV_.caseSession;
  if(!sess)sess=RV_.caseSession={pool:0,match:0,base:null};
  var order=rvCaseOrder(),loaded;
  if(order.length)loaded=order.length;
  else{
    if(!sess.pool){var mp=/of\s+([\d,]+)\s+loaded/i.exec(txt0);
      if(mp)sess.pool=Number(mp[1].replace(/,/g,''));}
    loaded=sess.pool||0;
  }
  var mm=/of\s+([\d,]+)\s+that\s+match/i.exec(txt0);
  if(mm)sess.match=Number(mm[1].replace(/,/g,''));
  else{try{if(typeof LAST_TOTAL!=='undefined'&&LAST_TOTAL&&LAST_TOTAL>loaded&&!sess.match)sess.match=LAST_TOTAL}catch(e){}}
  var cur='';try{cur=new URLSearchParams(location.search).get('case')||''}catch(e){}
  var idx=cur?order.indexOf(cur):-1;
  if(idx>=0){sess.base=idx;RV_.caseDir=0;}
  else{
    if(sess.base==null){var mi=/^\s*(\d+)\s+of/.exec(txt0);
      sess.base=mi?Number(mi[1])-1:0;}
    idx=sess.base+(RV_.caseDir||0);
    if(idx<0)idx=0;
    if(loaded&&idx>loaded-1)idx=loaded-1;
    sess.base=idx;RV_.caseDir=0;
  }
  var txt=rvNum(idx+1)+' of '+rvNum(loaded||1)+' loaded'+
    (sess.match&&sess.match>loaded?', of '+rvNum(sess.match)+' that match':'');
  if(lab.textContent!==txt)lab.textContent=txt;
  var b=rvStepperButtons(lab);
  if(b.prev)b.prev.disabled=idx<=0;
  if(b.next)b.next.disabled=loaded?idx>=loaded-1:false;
}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('#case-box button');if(!b)return;
  var t=b.textContent||'';
  if(t.indexOf('\u2039')>=0)RV_.caseDir=-1;
  else if(t.indexOf('\u203a')>=0)RV_.caseDir=1;
},true);

/* ---------- rv: tab ids, panel h1s, select aria-labels ---------- */
function rvFixTabs(){
  rvQ('[id^="vtab-"]').forEach(function(t){t.id='tab-'+t.id.slice(5);});
  rvQ('[aria-labelledby]').forEach(function(e){
    var v=e.getAttribute('aria-labelledby')||'';
    if(v.indexOf('vtab-')>=0)e.setAttribute('aria-labelledby',v.replace(/vtab-/g,'tab-'));
  });
  rvQ('[aria-controls^="vtab-"]').forEach(function(e){
    e.setAttribute('aria-controls',e.getAttribute('aria-controls').replace('vtab-','tab-'));
  });
}
var RV_H1={
  'p-fleet':'One airline, one type','p-emerging':'Defects that are new',
  'p-clusters':'Same airline, same system, same day','p-structure':'Corrosion and cracks',
  'p-age':'Do old airframes break differently?','p-engines':'Engines',
  'p-consequences':'What the crew actually had to do','p-found':'How was it found?'
};
function rvFixH1(){
  Object.keys(RV_H1).forEach(function(pid){
    var p=rvEl(pid);if(!p||p.querySelector('h1'))return;
    var h2=null;
    [].some.call(p.children,function(c){if(c.tagName==='H2'){h2=c;return true}return false});
    if(h2){
      var h1=document.createElement('h1');h1.className=h2.className||'';
      h1.innerHTML=h2.innerHTML;h2.parentNode.replaceChild(h1,h2);
    }else{
      var hb=document.createElement('hb');/*never*/
      var h=document.createElement('h1');h.textContent=RV_H1[pid];
      var anchor=p.querySelector('.psub,.lead');
      if(anchor)anchor.parentNode.insertBefore(h,anchor);
      else{var sc=p.querySelector('.scope');
        if(sc)sc.parentNode.insertBefore(h,sc.nextSibling);
        else p.insertBefore(h,p.firstChild);}
    }
  });
}
var RV_ARIA={operator:'Operator',make:'Manufacturer',ata:'Aircraft system',
  nature:'What was found',crew:'What the crew did',condition:'Part condition',
  discovered:'How it was found',stage:'Stage of flight',zone:'Zone on the aircraft',
  corrosion:'Corrosion level',cracked:'Cracking recorded',minhours:'Airframe age',
  aimKind:'What kind of thing to look for'};
function rvFixAria(){
  Object.keys(RV_ARIA).forEach(function(id){
    var e=rvEl(id);if(e&&!e.getAttribute('aria-label'))e.setAttribute('aria-label',RV_ARIA[id]);});
  var d=rvEl('aimDay');
  if(!d)rvQ('input[type="date"]').some(function(x){
    if(x.closest('.aimat,.aimday')){d=x;return true}return false;});
  if(d&&!d.getAttribute('aria-label'))d.setAttribute('aria-label','One date');
  rvQ('select').forEach(function(s){
    if(s.getAttribute('aria-label'))return;
    if(s.closest('.picker')||s.closest('#hero'))return;
    var t=(s.options&&s.options[0]?s.options[0].textContent:'').trim();
    t=t.replace(/^Any(thing)?\s+/i,'').replace(/^Pick an?\s+/i,'').trim();
    if(t)s.setAttribute('aria-label',t.charAt(0).toUpperCase()+t.slice(1));
  });
}

/* ---------- rv: runner ---------- */
function rvRun(){
  rvFixTabs();rvFixAria();rvFixH1();rvApply();rvFixStepper();
}
function rvSchedule(){
  if(RV_.t)clearTimeout(RV_.t);
  RV_.t=setTimeout(rvRun,60);
}
function rvInit(){
  if(RV_.inited)return;RV_.inited=true;
  rvCss();
  try{new MutationObserver(rvSchedule).observe(document.body,
    {childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});}catch(e){}
  window.addEventListener('resize',rvSchedule);
  try{var mq=window.matchMedia('(max-width:760px)');
    if(mq){if(mq.addEventListener)mq.addEventListener('change',rvSchedule);
      else if(mq.addListener)mq.addListener(rvSchedule);}}catch(e){}
  rvRun();
}
if(document.body)rvInit();
else document.addEventListener('DOMContentLoaded',rvInit);

