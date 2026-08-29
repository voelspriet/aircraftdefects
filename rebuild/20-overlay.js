
(function(){
if (window.__sdrReviewFix) return; window.__sdrReviewFix = true;

var sdrPhoneMQ = window.matchMedia("(max-width:760px)");
var sdrMark    = ".case-actions,.bigq,table.kv,[data-copy],.publish,.route,#case-title";
var sdrWrap    = null, sdrBox = null, sdrLastFocus = null,
    sdrPushed  = false, sdrSig = null;

var sdrCss = [
"#case-wrap{position:fixed;inset:0;background:rgba(12,16,22,.72);z-index:60;overscroll-behavior:contain;display:none;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}",
"#case-wrap[data-sdr-open='1']{display:flex}",
"#case-wrap #case-box{box-sizing:border-box;background:#fff;width:100%;max-width:min(880px,66vw);margin:0;border-radius:12px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.3)}",
"@media(max-width:900px){#case-wrap #case-box{max-width:100%}}",
"#case-wrap #case-box .bar.case-actions{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;margin:-24px -28px 14px;padding:10px 28px;border-bottom:1px solid #e2ded5}",
"#case-wrap #case-box .case-actions button:last-child{margin-left:auto}"
].join("\n");

/* 1. below 760px the phone renderer owns the instrument: take the desktop rails
      back out of the DOM, whatever redraw leaked them back in */
function sdrStripRails(){
  if (!sdrPhoneMQ.matches) return;
  document.querySelectorAll("#hero .rail, .instrument .rail").forEach(function(n){
    n.parentNode && n.parentNode.removeChild(n);
  });
}

/* 3. the nine selects the rebuild shipped unlabelled; set only what is missing */
var sdrLabels = {operator:"Operator", make:"Manufacturer", ata:"Aircraft system",
  nature:"What was found", crew:"What the crew did", condition:"Part condition",
  discovered:"How it was found", stage:"Stage of flight", zone:"Zone on the aircraft"};
function sdrFixLabels(){
  for (var id in sdrLabels){
    var e = document.getElementById(id);
    if (e && !e.getAttribute("aria-label")) e.setAttribute("aria-label", sdrLabels[id]);
  }
}

/* 2. the case sheet is a dialog: a fixed overlay owns the scroll, the card sits
      inside it, and the action bar sticks to the top of that overlay */
function sdrEnsureWrap(){
  sdrWrap = document.getElementById("case-wrap");
  if (!sdrWrap){ sdrWrap = document.createElement("div"); sdrWrap.id = "case-wrap"; document.body.appendChild(sdrWrap); }
  sdrBox = document.getElementById("case-box");
  if (!sdrBox){ sdrBox = document.createElement("div"); sdrBox.id = "case-box"; sdrWrap.appendChild(sdrBox); }
  else if (sdrBox.parentElement !== sdrWrap) sdrWrap.appendChild(sdrBox);
  sdrAdoptLoose();
}
/* if the rebuild rendered a sheet with no #case-box at all, lift the whole card
   into the overlay instead of leaving it growing the page */
function sdrAdoptLoose(){
  if (sdrBox.firstElementChild) return;
  var bar = document.querySelector(".case-actions");
  if (!bar || sdrWrap.contains(bar)) return;
  var anc = bar.parentElement, guard = 0;
  while (anc && anc !== document.body && guard++ < 10 &&
         !(anc.querySelector(".bigq") && anc.querySelector("table.kv")))
    anc = anc.parentElement;
  if (!anc || anc === document.body || anc === sdrWrap) return;
  var res = document.getElementById("results");
  if (res && anc.contains(res)) return;
  var frag = document.createDocumentFragment();
  while (anc.firstChild) frag.appendChild(anc.firstChild);
  sdrBox.appendChild(frag);
  anc.parentNode.removeChild(anc);
}
function sdrIsOpen(){ return !!(sdrWrap && sdrWrap.getAttribute("data-sdr-open") === "1"); }
function sdrSetOpen(on){
  if (!sdrWrap) return;
  sdrWrap.setAttribute("data-sdr-open", on ? "1" : "0");
  sdrWrap.style.display = on ? "flex" : "none";
  if (on) sdrWrap.scrollTop = 0;
}
function sdrInert(on){
  Array.prototype.forEach.call(document.body.children, function(n){
    if (n === sdrWrap || /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(n.tagName)) return;
    if (on){
      if (!n.hasAttribute("data-sdr-inert")){
        n.setAttribute("data-sdr-inert", "1");
        if ("inert" in n) n.inert = true; else n.setAttribute("inert", "");
      }
    } else if (n.hasAttribute("data-sdr-inert")){
      n.removeAttribute("data-sdr-inert");
      if ("inert" in n) n.inert = false; else n.removeAttribute("inert");
    }
  });
}
function sdrOpenSheet(){
  sdrLastFocus = document.activeElement;
  sdrBox.setAttribute("role", "dialog");
  sdrBox.setAttribute("aria-modal", "true");
  sdrBox.setAttribute("tabindex", "-1");
  if (sdrBox.querySelector("#case-title")) sdrBox.setAttribute("aria-labelledby", "case-title");
  else { sdrBox.removeAttribute("aria-labelledby"); sdrBox.setAttribute("aria-label", "Case sheet"); }
  sdrSetOpen(true);
  sdrInert(true);
  setTimeout(function(){ try { sdrBox.focus(); } catch(e){} }, 30);
  /* Back closes the sheet, as in the reference; push only if the rebuild has not */
  var u = new URLSearchParams(location.search);
  if (!u.get("case")){
    var m = ((sdrBox.querySelector(".eyebrow-k") || {}).textContent || "").match(/Report\s+(\S+)/);
    if (m){ u.set("case", m[1]);
      try { history.pushState({sdrCase:m[1]}, "", "?" + u.toString()); sdrPushed = true; } catch(e){} }
  }
}
function sdrCloseSheet(fromPop){
  if (!sdrIsOpen()) return;
  sdrSetOpen(false);
  sdrInert(false);
  var lf = sdrLastFocus; sdrLastFocus = null;
  if (lf && lf.focus && document.contains(lf)) try { lf.focus(); } catch(e){}
  if (!fromPop && sdrPushed){ sdrPushed = false; history.back(); }
}
function sdrEnsureClose(){
  var bar = sdrBox.querySelector(".case-actions"); if (!bar) return;
  var has = Array.prototype.some.call(bar.querySelectorAll("button"),
    function(b){ return /close/i.test(b.textContent || ""); });
  if (!has){
    var b = document.createElement("button");
    b.type = "button"; b.className = "ghost"; b.textContent = "Close";
    b.addEventListener("click", function(){ sdrCloseSheet(false); });
    bar.appendChild(b);
  }
}
/* the sheet opens when its content lands in #case-box and closes when that box
   is emptied again, so the rebuild's own render/close calls keep working */
function sdrPoll(){
  sdrEnsureWrap();
  var marked = sdrBox.querySelector(sdrMark);
  var s = ((sdrBox.querySelector(".eyebrow-k") || {}).textContent || "") + "|" + (marked ? 1 : 0);
  if (marked){
    if (!sdrIsOpen()){ sdrSig = s; sdrOpenSheet(); }
    else if (s !== sdrSig){ sdrSig = s; sdrSetOpen(true); try { sdrBox.focus(); } catch(e){} }
    sdrEnsureClose();
  } else if (sdrIsOpen() && !(sdrBox.firstElementChild || (sdrBox.textContent || "").trim())){
    sdrSig = null; sdrCloseSheet(true);
  }
}

/* the four ways out: Escape, the Close button, the scrim, and Back */
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && sdrIsOpen()) sdrCloseSheet(false);
});
document.addEventListener("click", function(e){
  if (!sdrIsOpen()) return;
  if (e.target === sdrWrap){ sdrCloseSheet(false); return; }
  var b = e.target && e.target.closest ? e.target.closest("#case-box button") : null;
  if (b && /^close$/i.test((b.textContent || "").trim())){ e.preventDefault(); sdrCloseSheet(false); }
});
window.addEventListener("popstate", function(){ if (sdrIsOpen()) sdrCloseSheet(true); });
/* focus stays inside the dialog while it is up */
document.addEventListener("keydown", function(e){
  if (e.key !== "Tab" || !sdrIsOpen()) return;
  var f = Array.prototype.filter.call(
    sdrBox.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),
    function(x){ return x.offsetParent !== null; });
  if (!f.length){ e.preventDefault(); sdrBox.focus(); return; }
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last ||
                           !sdrBox.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
});

function sdrInit(){
  var st = document.createElement("style");
  st.textContent = sdrCss;
  document.head.appendChild(st);
  sdrEnsureWrap(); sdrStripRails(); sdrFixLabels(); sdrPoll();
  if (sdrPhoneMQ.addEventListener)
    sdrPhoneMQ.addEventListener("change", function(ev){ if (ev.matches) sdrStripRails(); });
  new MutationObserver(function(){ sdrStripRails(); sdrFixLabels(); sdrPoll(); })
    .observe(document.body, {childList:true, subtree:true});
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sdrInit);
else sdrInit();
window.addEventListener("load", function(){ sdrStripRails(); sdrFixLabels(); sdrPoll(); });
})();

