"""Walk every tab on both pages and collect what each panel actually offers.

The first options run measured only the panel that happens to be open, and
reported nine menus as missing that a click would have built. A harness that
does not open the drawers cannot say what is in them."""
from playwright.sync_api import sync_playwright
import json

def walk(pg, url):
    pg.goto(url, wait_until="networkidle", timeout=90000); pg.wait_for_timeout(5000)
    tabs = pg.evaluate("""[...document.querySelectorAll('[role=tab],.tab')]
        .map((n,i)=>({i, t:(n.innerText||'').replace(/\\s+/g,' ').trim()}))""")
    seen = {}
    for t in tabs:
        try:
            pg.evaluate("i=>{const n=[...document.querySelectorAll('[role=tab],.tab')][i]; n&&n.click()}", t["i"])
            pg.wait_for_timeout(2600)
        except Exception:
            pass
        for sid, opts in pg.evaluate("""()=>{const o={};
            document.querySelectorAll('select').forEach(s=>{ if(s.id)
              o[s.id]=[...s.options].map(x=>x.textContent.trim()); }); return o}""").items():
            if sid not in seen or len(opts) > len(seen[sid]):
                seen[sid] = opts
    return {"tabs":[t["t"] for t in tabs], "selects":seen}

with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1200})
    o=walk(pg,"https://aircraftdefects.com/")
    c=walk(pg,"https://aircraftdefects.com/z/")
    b.close()
json.dump({"ouder":o,"kloon":c}, open("panels.json","w"), indent=1)

print("tabbladen   ouder %d, kloon %d" % (len(o["tabs"]), len(c["tabs"])))
mt=[t for t in o["tabs"] if t not in c["tabs"]]
if mt: print("  ontbrekende tabs:", mt)
print("keuzelijsten ouder %d, kloon %d" % (len(o["selects"]), len(c["selects"])))
print("opties       ouder %d, kloon %d" % (sum(len(v) for v in o["selects"].values()),
                                           sum(len(v) for v in c["selects"].values())))
print()
for k in sorted(set(o["selects"]) | set(c["selects"])):
    a, bb = o["selects"].get(k), c["selects"].get(k)
    if a is None: print("  #%-11s alleen in de kloon (%d)" % (k, len(bb)))
    elif bb is None: print("  #%-11s ONTBREEKT   ouder heeft %d" % (k, len(a)))
    elif a == bb: print("  #%-11s gelijk (%d)" % (k, len(a)))
    else:
        print("  #%-11s ouder %-5d kloon %-5d" % (k, len(a), len(bb)))
        miss=[x for x in a if x not in bb][:4]
        if miss: print("      ontbreekt bv.: %s" % ", ".join(miss))
