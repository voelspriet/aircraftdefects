"""Open every tab on both pages and compare what the panel actually says.
Controls being present is not the same as the panel answering."""
from playwright.sync_api import sync_playwright
import json, re

def walk(pg, url):
    pg.goto(url, wait_until="networkidle", timeout=90000); pg.wait_for_timeout(5000)
    n = pg.evaluate("document.querySelectorAll('[role=tab],.tab').length")
    out = []
    for i in range(n):
        lab = pg.evaluate("i=>{const t=[...document.querySelectorAll('[role=tab],.tab')][i];"
                          "if(!t)return null; t.click(); return (t.innerText||'').replace(/\\s+/g,' ').trim()}", i)
        if not lab: continue
        pg.wait_for_timeout(3200)
        d = pg.evaluate("""()=>{const v=[...document.querySelectorAll("[id^='p-']")]
             .filter(n=>n.offsetParent&&!/-body$/.test(n.id));
           const p=v[v.length-1]; if(!p) return null;
           const t=(p.innerText||'').replace(/\\s+/g,' ').trim();
           return {len:t.length, rows:p.querySelectorAll('tr,li,.row,.bar,.lrow,.orow').length,
                   nums:(t.match(/\\d[\\d,]{2,}/g)||[]).length, head:t.slice(0,90)}}""")
        out.append((lab, d))
    return out

with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1200})
    o=walk(pg,"https://aircraftdefects.com/")
    c=walk(pg,"https://aircraftdefects.com/z/")
    b.close()

cm={l:d for l,d in c}
print("%-26s %-22s %s" % ("TABBLAD","OUDER (tekens/rijen/getallen)","KLOON"))
for lab,d in o:
    e=cm.get(lab)
    f=lambda x: "-" if not x else "%5d / %3d / %3d" % (x["len"],x["rows"],x["nums"])
    flag=""
    if e and d and (e["nums"]==0 and d["nums"]>0): flag="  << GEEN CIJFERS"
    elif e and d and e["len"]<d["len"]*0.25: flag="  << VEEL KORTER"
    print("%-26s %-22s %s%s" % (lab[:26], f(d), f(e), flag))
