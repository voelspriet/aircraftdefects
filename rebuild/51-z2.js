/* ---- 51, hand-written, 30 August 2026. Counted in MODEL_USE.md. ----
   The redesign layer from the panel of twenty (docs/DESIGN-Z2.md). Five things:
   1. One streaming model-call block, <section class="mc">, used by every
      button: pending with a live clock, tokens landing as they arrive, a
      provenance line naming what was read, abstention as a result, a stop.
      role=status, aria-live=polite, the button stays in the DOM.
   2. Four live buttons on the page's own SSE endpoints: plain English on the
      specimen and every write-up; "How the trade says it" on any capitalised
      word in a write-up; "What recurs here" over the selection; "Is this the
      right slice?" beside Export.
   3. "Ask the file": a question becomes draft filter chips the reporter runs
      or discards. Nothing runs until Run is pressed.
   4. The shutter: with no selection, nothing below the instrument renders
      until "read them" or "ask more of them" is pressed. A selection opens it.
   5. Records as one line each, expanding in place.
   ------------------------------------------------------------------------ */
(function(){
  "use strict";
  var D=document;
  function q(){ return new URLSearchParams(location.search); }
  var VIEW={hero:1,view:1,case:1,aircraft:1,ca:1,cb:1,cf:1};
  function hasSelection(){ var any=false; q().forEach(function(v,k){ if(!VIEW[k]&&v) any=true; }); return any; }
  function num(n){ return (n==null?"":String(n)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function el(tag,cls,html){ var e=D.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

  /* ---------- 1. the model-call block ---------- */
  function mc(opts){
    /* opts: label, sub, url(), place(node), effortNote */
    var box=el("section","mc"); box.dataset.state="idle"; box.setAttribute("role","status"); box.setAttribute("aria-live","polite"); box.setAttribute("aria-atomic","false");
    var go=el("button","mc__go"); go.type="button"; go.innerHTML=esc(opts.label)+(opts.sub?"<b>"+esc(opts.sub)+"</b>":"");
    var meter=el("div","mc__meter"); meter.innerHTML='<span class="mc__spin" aria-hidden="true"></span><span class="mc__count">reading</span><span class="mc__clock">0.0 s</span>';
    var stop=el("button","mc__stop","Stop"); stop.type="button"; meter.appendChild(stop);
    var body=el("div","mc__body"); var prov=el("div","mc__prov");
    box.appendChild(go); box.appendChild(meter); box.appendChild(body); box.appendChild(prov);
    var es=null, t0=0, tick=null, meta=null, got="";
    function setState(s){ box.dataset.state=s; box.setAttribute("aria-busy", s==="pending"||s==="streaming" ? "true":"false"); }
    function clock(){ meter.querySelector(".mc__clock").textContent=((Date.now()-t0)/1000).toFixed(1)+" s"; }
    function finish(kind,data){
      if(tick){clearInterval(tick);tick=null;} if(es){es.close();es=null;}
      go.disabled=false;
      var read=meta?num(meta.read)+" of "+num(meta.of)+" "+(meta.what||"records"):"";
      var secs=data&&data.seconds!=null?data.seconds+" s":((Date.now()-t0)/1000).toFixed(1)+" s";
      var toks=data&&data.tokens?", "+num(data.tokens)+" tokens":"";
      if(kind==="done"){ setState("done"); prov.innerHTML='read by <b>GLM-5.3-Flash</b>, '+esc(read)+', '+esc(secs)+esc(toks)+'. Its words, not the FAA\'s. Open the records and judge it yourself.'; }
      else if(kind==="abstain"){ setState("abstain"); prov.innerHTML='<b>GLM-5.3-Flash</b> would not answer. '+esc(read)+'.'; }
      else if(kind==="cancelled"){ setState("cancelled"); prov.innerHTML='stopped by you at '+esc(secs)+'. Partial.'; }
      else { setState("error"); body.textContent="The call to GLM-5.3-Flash failed"+(data&&data.message?" ("+data.message+")":"")+". Nothing has changed on this page."; }
      var again=el("button","mc__again","Run again"); again.type="button"; again.onclick=start; prov.appendChild(again);
      try{ body.setAttribute("tabindex","-1"); body.focus({preventScroll:true}); }catch(e){}
    }
    function linkRecords(){
      /* [ABCD20260101234] -> a link that scrolls to that row if it is on the page */
      body.innerHTML=esc(got).replace(/\[([A-Z0-9]{8,24})\]/g,function(m,id){ return '<a class="rec" data-rec="'+id+'" href="#'+id+'">'+id+'</a>'; });
      body.querySelectorAll("a.rec").forEach(function(a){ a.addEventListener("click",function(e){
        var t=D.querySelector('[data-id="'+a.dataset.rec+'"], #r-'+a.dataset.rec+', tr[data-ctrl="'+a.dataset.rec+'"]');
        if(t){ e.preventDefault(); t.scrollIntoView({block:"center"}); t.classList.add("z2-ring"); setTimeout(function(){t.classList.remove("z2-ring")},1600); }
      }); });
    }
    function start(){
      var url=opts.url(); if(!url) return;
      got=""; meta=null; body.textContent=""; prov.innerHTML=""; go.disabled=true; setState("pending"); t0=Date.now();
      meter.querySelector(".mc__count").textContent="reading"; clock(); tick=setInterval(clock,100);
      try{ es=new EventSource(url); }catch(e){ finish("error",{message:"no EventSource"}); return; }
      es.addEventListener("meta",function(e){ try{ meta=JSON.parse(e.data); }catch(x){} if(meta) meter.querySelector(".mc__count").textContent="reading "+num(meta.read)+" of "+num(meta.of)+" "+(meta.what||""); });
      es.addEventListener("delta",function(e){ var s; try{ s=JSON.parse(e.data); }catch(x){ s=e.data; } if(box.dataset.state!=="streaming") setState("streaming"); got+=s; body.textContent=got; });
      es.addEventListener("abstain",function(e){ var d={}; try{ d=JSON.parse(e.data); }catch(x){} body.textContent=d.text||"The model would not say."; finish("abstain",d); });
      es.addEventListener("done",function(e){ var d={}; try{ d=JSON.parse(e.data); }catch(x){} linkRecords(); finish("done",d); });
      es.addEventListener("error",function(e){ var d={}; try{ d=JSON.parse(e.data); }catch(x){} if(box.dataset.state==="streaming"&&got){ linkRecords(); finish("done",d); } else finish("error",d); });
    }
    go.addEventListener("click",function(e){ e.stopPropagation(); start(); });
    stop.addEventListener("click",function(e){ e.stopPropagation(); finish("cancelled"); });
    return box;
  }

  /* ---------- 2. the buttons ---------- */
  function selectionQS(){ var p=q(); VIEW.hero&&p.delete("hero"); p.delete("view"); p.delete("case"); return p.toString(); }

  function plainEnglish(textNode, text){
    if(!textNode||!text||textNode.dataset.z2pe) return; textNode.dataset.z2pe="1";
    var b=mc({label:"Say it in plain English", sub:"this write-up, read by the model",
              url:function(){ return "/z/api/stream/gloss?text="+encodeURIComponent(text.slice(0,4000)); }});
    textNode.insertAdjacentElement("afterend",b);
  }

  function wordButtons(scope){
    /* every capitalised word of 4+ letters in a write-up becomes askable */
    scope.querySelectorAll(".sl, .wu-text, .wu .txt").forEach(function(n){
      if(n.dataset.z2w) return; n.dataset.z2w="1";
      n.innerHTML=n.innerHTML.replace(/\b([A-Z][A-Z\/\-]{3,})\b/g,'<span class="z2w">$1</span>');
    });
  }
  D.addEventListener("click",function(e){
    var w=e.target.closest&&e.target.closest(".z2w"); if(!w) return;
    var host=w.closest(".sl, .wu, .wu-text, .z2-body, .specimen")||w.parentElement;
    var old=host.querySelector(".mc[data-vocab]"); if(old) old.remove();
    var word=w.textContent.replace(/[^A-Z\/\-]/g,"");
    var b=mc({label:"How the trade says it: "+word, sub:"up to 60 write-ups carrying this word",
              url:function(){ return "/z/api/stream/vocab?word="+encodeURIComponent(word); }});
    b.dataset.vocab=word; host.appendChild(b); b.querySelector(".mc__go").click();
  });

  function recursButton(){
    if(D.querySelector(".mc[data-recurs]")||!hasSelection()) return;
    var cut=D.querySelector("#rr-sec .cut")||D.getElementById("rr-sec"); if(!cut) return;
    var total=(function(){ var m=(D.body.innerText||"").match(/([\d,]+) reports match your selection/); return m?parseInt(m[1].replace(/,/g,""),10):0; })();
    var n=Math.min(300,total||300);
    var b=mc({label:"What recurs here", sub:(total&&total>300?num(n)+" of "+num(total)+" write-ups, newest first, not a sample of the rest":"all "+num(n)+" write-ups in this selection"),
              url:function(){ return "/z/api/stream/recurs?"+selectionQS(); }});
    b.dataset.recurs="1"; cut.insertAdjacentElement("afterend",b);
  }

  function sliceButton(){
    if(D.querySelector(".mc[data-slice]")||!hasSelection()) return;
    var exp=[...D.querySelectorAll("a,button")].find(function(x){ return /export csv/i.test(x.innerText||""); }); if(!exp) return;
    var b=mc({label:"Is this the right slice?", sub:"the model reads your filters and 25 write-ups before you export",
              url:function(){ return "/z/api/stream/slice?"+selectionQS(); }});
    b.dataset.slice="1"; b.style.margin="8px 0 0"; (exp.closest(".actions")||exp.parentElement).insertAdjacentElement("afterend",b);
  }

  /* ---------- 3. ask the file ---------- */
  function askLine(){
    var pad=D.querySelector("#hero .ipad")||D.querySelector(".ipad"); if(!pad||pad.querySelector(".z2-ask")) return;
    var hand=pad.querySelector(".hand")||pad.querySelector(".aimwrap"); if(!hand) return;
    var wrap=el("div","z2-askwrap");
    var row=el("div","z2-ask"); row.innerHTML='<input type="text" maxlength="300" placeholder="Ask the file a question, or type words the mechanic wrote" aria-label="Ask the file"><button type="button" class="primary">Ask</button><button type="button" class="srch">Search</button>';
    wrap.appendChild(row); hand.insertAdjacentElement("afterend",wrap);
    var inp=row.querySelector("input");
    row.querySelector(".srch").onclick=function(){ var v=inp.value.trim(); if(!v) return; var p=q(); p.set("q",v); location.href=location.pathname+"?"+p.toString(); };
    inp.addEventListener("keydown",function(e){ if(e.key==="Enter"){ e.preventDefault(); row.querySelector(".primary").click(); } });
    row.querySelector(".primary").onclick=function(){
      var v=inp.value.trim(); if(!v) return;
      var old=wrap.querySelector(".z2-draft"); if(old) old.remove();
      var d=el("div","z2-draft"); d.innerHTML='<span class="lab">GLM-5.3-Flash is reading your question</span>'; wrap.appendChild(d);
      fetch("/z/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:v})}).then(function(r){return r.json()}).then(function(a){
        var f=a.filters||{}; var keys=Object.keys(f);
        var h='<span class="lab">The model read your question as</span>'+esc(a.reading||"")+'<div>';
        keys.forEach(function(k){ h+='<span class="chip"><i>'+esc(k)+'</i>'+esc(f[k])+'</span>'; });
        if(!keys.length) h+='<span class="chip">no filters</span>';
        h+='</div>';
        if(a.unmapped&&a.unmapped.length) h+='<span class="unmapped">Could not map: '+esc(a.unmapped.join(", "))+'</span>';
        if(a.cannot) h+='<span class="cannot">'+esc(a.cannot)+'</span>';
        h+='<span class="unmapped">Filters proposed by GLM-5.3-Flash. Nothing has run yet.</span>';
        h+='<div class="acts"><button type="button" class="run"'+(keys.length?"":" disabled")+'>Run this</button><button type="button" class="discard">Discard</button></div>';
        d.innerHTML=h;
        d.querySelector(".discard").onclick=function(){ d.remove(); };
        d.querySelector(".run").onclick=function(){ var p=new URLSearchParams(); keys.forEach(function(k){ p.set(k,f[k]); }); var hero=q().get("hero"); if(hero) p.set("hero",hero); location.href=location.pathname+"?"+p.toString(); };
      }).catch(function(){ d.innerHTML='<span class="lab">The model did not answer</span>Nothing has run. Try plain words in Search instead.'; });
    };
  }

  /* ---------- 4. the shutter ---------- */
  var OPEN_KEY="z2open";
  function shutter(){
    var open=hasSelection()||sessionStorage.getItem(OPEN_KEY)==="1"||location.hash.indexOf("open")>=0;
    D.body.classList.toggle("z2-shut",!open);
    var pad=D.querySelector("#hero .ipad")||D.querySelector(".ipad"); if(!pad||pad.querySelector(".z2-openers")) return;
    var o=el("div","z2-openers");
    var total=(D.body.innerText||"").match(/([\d,]{7,}) reports/); total=total?total[1]:"1,757,827";
    o.innerHTML='<b>'+total+'</b> reports. <button type="button" data-o="read">read them</button> <button type="button" data-o="ask">ask more of them</button>';
    (pad.querySelector(".margin")||pad.lastElementChild).insertAdjacentElement("afterend",o);
    o.querySelectorAll("button").forEach(function(b){ b.onclick=function(){
      sessionStorage.setItem(OPEN_KEY,"1"); D.body.classList.remove("z2-shut");
      var t=b.dataset.o==="read"?D.getElementById("rr-sec"):D.getElementById("vstrip"); if(t) t.scrollIntoView({block:"start",behavior:"smooth"});
      if(b.dataset.o==="read"){ var r=[...D.querySelectorAll("button")].find(function(x){return /Read all/.test(x.innerText)}); if(r&&!hasSelection()) r.click(); }
    }; });
  }
  function promise(){
    var pad=D.querySelector("#hero .ipad")||D.querySelector(".ipad"); if(!pad||pad.querySelector(".z2-promise")) return;
    var c=pad.querySelector("#count"); if(!c) return;
    var p=el("p","z2-promise","Every report carries a mechanic’s write-up in trade shorthand. <b>GLM-5.3-Flash</b> reads them here, live, and says what it cannot answer.");
    c.insertAdjacentElement("afterend",p);
  }

  /* ---------- 5. records as one line each ---------- */
  function rows(){
    /* the page draws each report as two rows: tr.rep (11 cells) then tr.wrote
       (the write-up). Fold each pair into one line that opens in place. */
    var tbl=D.querySelector("table.reps"); if(!tbl) return;
    D.body.classList.add("z2-rows");
    tbl.querySelectorAll("tbody tr.rep:not(.z2-done)").forEach(function(tr){
      tr.classList.add("z2-done");
      var wr=tr.nextElementSibling; if(!wr||!/\bwrote\b/.test(wr.className)) return;
      wr.classList.add("z2-done");
      var tds=tr.querySelectorAll("td"); var cell=function(i){ return (tds[i]&&tds[i].innerText||"").replace(/DOSSIER/g,"").replace(/\s+/g," ").trim(); };
      var date=cell(0).replace(/\s*N[A-Z0-9]+$/,""), op=cell(1), ac=cell(2), tail=cell(3), sys=cell(4), part=cell(5), found=cell(6), crew=cell(7), by=cell(8), stage=cell(9);
      var wu=wr.querySelector(".wu .txt")||wr.querySelector(".wu")||wr;
      var text=(wu.innerText||"").replace(/Say it in plain English|Read the whole write-up/g,"").trim();
      var len=text.length; var bar="\u258e".repeat(Math.min(4,Math.max(1,Math.ceil(len/180))));
      var ctrl=(tr.getAttribute("data-ctrl")||tr.getAttribute("data-id")||"").trim();
      var line=el("button","z2-line"); line.type="button"; line.setAttribute("aria-expanded","false");
      line.innerHTML='<time>'+esc(date)+'</time><span class="tail">'+esc(tail)+'</span><span>'+esc(op)+'</span><span>'+esc(ac)+'</span><b class="found">'+esc(part)+(found?" \u00b7 "+esc(found.toLowerCase()):"")+'</b><span class="stage">'+esc(stage.toLowerCase().slice(0,28))+'</span><i class="len" aria-label="'+len+' characters">'+bar+'</i>';
      var body=el("div","z2-body"); body.innerHTML='<div class="wu-text"></div><dl><dt>system</dt><dd>'+esc(sys)+'</dd><dt>crew did</dt><dd>'+esc(crew)+'</dd><dt>found by</dt><dd>'+esc(by)+'</dd></dl><div class="foot"></div>';
      body.querySelector(".wu-text").textContent=text;
      var foot=body.querySelector(".foot");
      var cs=tr.querySelector("button, a"); [...tr.querySelectorAll("button,a")].forEach(function(x){ var t=(x.innerText||"").trim();
        if(/case sheet/i.test(t)){ var b1=el("button",null,"Case sheet \u2192"); b1.type="button"; b1.onclick=function(e){e.stopPropagation();x.click();}; foot.appendChild(b1); }
        if(/dossier/i.test(t)){ var b2=el("button",null,"Dossier \u2192"); b2.type="button"; b2.onclick=function(e){e.stopPropagation();x.click();}; foot.appendChild(b2); } });
      var td=el("td"); td.colSpan=tds.length; td.appendChild(line); td.appendChild(body);
      var nr=el("tr","z2-r"); if(ctrl) nr.setAttribute("data-ctrl",ctrl); nr.appendChild(td);
      tr.style.display="none"; wr.style.display="none"; tr.insertAdjacentElement("beforebegin",nr);
      line.onclick=function(){ var o=nr.classList.toggle("open"); line.setAttribute("aria-expanded",o?"true":"false"); if(o){ wordButtons(body); plainEnglish(body.querySelector(".wu-text"),text); } };
    });
  }

  /* ---------- specimen: the first model call a judge sees ---------- */
  function specimen(){
    var spec=D.querySelector(".specimen"); if(!spec||spec.dataset.z2pe) return;
    var sp=spec.querySelector(".sl, .spec-text"); if(!sp) return;
    var text=sp.innerText.replace(/^“|”$/g,"").trim(); if(text.length<20) return;
    spec.dataset.z2pe="1";
    /* the specimen is itself a click target that opens the case sheet, so the
       model block sits after it, never inside it, and its button stops the
       click from reaching the specimen */
    var b=mc({label:"Say it in plain English", sub:"this write-up, read by the model, live",
              url:function(){ return "/z/api/stream/gloss?text="+encodeURIComponent(text.slice(0,4000)); }});
    b.addEventListener("click",function(e){ e.stopPropagation(); });
    spec.insertAdjacentElement("afterend",b);
  }

  var queued=false;
  function pass(){ queued=false; try{promise()}catch(e){} try{askLine()}catch(e){} try{shutter()}catch(e){} try{specimen()}catch(e){} try{rows()}catch(e){} try{recursButton()}catch(e){} try{sliceButton()}catch(e){} }
  function kick(){ if(queued) return; queued=true; requestAnimationFrame(pass); }
  new MutationObserver(kick).observe(D.documentElement,{childList:true,subtree:true});
  if(D.readyState==="loading") D.addEventListener("DOMContentLoaded",kick); else kick();
  addEventListener("load",kick);
  var st=D.createElement("style"); st.textContent=".z2-ring{outline:2px solid #245c5a !important;outline-offset:2px}"; D.head.appendChild(st);
})();
