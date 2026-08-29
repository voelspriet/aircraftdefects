
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

