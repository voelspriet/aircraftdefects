"""Three runs over parent and clone: content, geometry and layout shift.

Counting elements says the parts are there. It says nothing about whether the
page settles, or whether a caption lands under the thing it captions."""
from playwright.sync_api import sync_playwright
import json, statistics, sys

STATES = [("rust",   "?hero=anatomy",               "?hero=where"),
          ("zone",   "?hero=anatomy&zone=ZONE+200", "?hero=where&zone=ZONE+200"),
          ("crew",   "?hero=ledger&crew=A",         "?hero=forced&crew=A")]
VIEWPORTS = [(1440, 1000), (820, 1200)]

CLS = """() => new Promise(res=>{
  let v=0; try{
    new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) v+=e.value;})
      .observe({type:'layout-shift', buffered:true});
  }catch(e){}
  setTimeout(()=>res(Math.round(v*1000)/1000), 3000);
})"""

GEOM = """() => {
  const pick = s => { const n=document.querySelector(s); if(!n) return null;
    const r=n.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height),
      x:Math.round(r.x),y:Math.round(r.y)} };
  const body = document.body.getBoundingClientRect();
  return {
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    pageH: Math.round(document.documentElement.scrollHeight),
    plane: pick('svg.plane, .plane, svg'),
    rails: [...document.querySelectorAll('.rail')].map(n=>{const r=n.getBoundingClientRect();
      return n.dataset.rail+':'+Math.round(r.height)}),
    blocks: [...document.querySelectorAll('h1,h2,p.reading,.zonenote,.reading,.cut,#count,#rr-count')]
      .slice(0,12).map(n=>{const r=n.getBoundingClientRect();
        return {t:(n.innerText||'').replace(/\\s+/g,' ').trim().slice(0,45), y:Math.round(r.y), w:Math.round(r.width)}}),
  };
}"""

def run(pg, url):
    pg.goto(url, wait_until="networkidle", timeout=90000)
    cls = pg.evaluate(CLS)
    pg.wait_for_timeout(4000)
    g = pg.evaluate(GEOM); g["cls"] = cls
    return g

out={}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w,h in VIEWPORTS:
        pg = b.new_page(viewport={"width":w,"height":h})
        for name, pq, cq in STATES:
            for side, q in [("ouder", "https://aircraftdefects.com/"+pq),
                            ("kloon", "https://aircraftdefects.com/z/"+cq)]:
                runs=[run(pg,q) for _ in range(3)]
                out.setdefault("%dx%d"%(w,h),{}).setdefault(name,{})[side]=runs
        pg.close()
    b.close()
json.dump(out, open("layout.json","w"), indent=1)

for vp, states in out.items():
    print("\n" + "="*72); print("VIEWPORT " + vp)
    for name, sides in states.items():
        o, c = sides["ouder"], sides["kloon"]
        print("\n  %s" % name.upper())
        print("    %-22s ouder            kloon" % "")
        def line(lab, f):
            a=[f(r) for r in o]; b_=[f(r) for r in c]
            stab=lambda v: "stabiel" if len(set(map(str,v)))==1 else "WISSELT %s"%v
            print("    %-22s %-16s %s" % (lab, str(a[0])+(""if len(set(map(str,a)))==1 else " !"),
                                          str(b_[0])+(""if len(set(map(str,b_)))==1 else " !")))
        line("layout shift (CLS)", lambda r: r["cls"])
        line("paginahoogte", lambda r: r["pageH"])
        line("horizontaal overloop", lambda r: r["overflowX"])
        line("tekening b x h", lambda r: (r["plane"] or {}).get("w","-") and "%sx%s"%(r["plane"]["w"],r["plane"]["h"]) if r["plane"] else "GEEN")
        line("railhoogtes", lambda r: ",".join(r["rails"]))
