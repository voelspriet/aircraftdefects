"""Enumerate every option, control, button, tab and endpoint on both pages.
Not counts this time: the actual lists, so a missing option is named."""
from playwright.sync_api import sync_playwright
import json

PROBE = r"""() => {
  const q=s=>[...document.querySelectorAll(s)];
  const clean=t=>(t||"").trim().replace(/\s+/g," ");
  const sels={};
  q("select").forEach(s=>{ sels[s.id||s.name||"(naamloos)"] =
      [...s.options].map(o=>clean(o.textContent)); });
  const inputs=q("input,textarea").map(n=>({id:n.id||"", type:n.type||n.tagName.toLowerCase(),
      ph:n.placeholder||"", label:clean(n.getAttribute("aria-label"))}));
  return {
    selects: sels,
    inputs,
    buttons: [...new Set(q("button").map(b=>clean(b.innerText)).filter(Boolean))],
    tabs:    q("[role=tab],.tab").map(n=>clean(n.innerText)),
    panels:  q("[id^='p-']").map(n=>n.id),
    headings:q("h1,h2,h3,summary,.eyebrow,.groupname,.vgroup").map(n=>clean(n.innerText)).filter(Boolean),
    links:   [...new Set(q("a[href]").map(a=>clean(a.innerText)).filter(Boolean))],
    details: q("details summary").map(n=>clean(n.innerText)),
    takes:   [...new Set(q("[data-take]").map(n=>n.dataset.take.split("|")[0]))].sort(),
    aims:    [...new Set(q("[data-aim]").map(n=>n.dataset.aim.split("|")[0]))].sort(),
    api:     [...new Set(performance.getEntriesByType("resource")
                .map(e=>e.name).filter(u=>/\/api\/|\/z\//.test(u))
                .map(u=>u.replace(/^https?:\/\/[^/]+/,"").split("?")[0]))].sort(),
  };
}"""

def probe(pg,url):
    pg.goto(url, wait_until="networkidle", timeout=90000); pg.wait_for_timeout(6000)
    # open every collapsed section so its controls are in the DOM
    pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
    pg.wait_for_timeout(600)
    return pg.evaluate(PROBE)

with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1200})
    o=probe(pg,"https://aircraftdefects.com/?hero=anatomy&zone=ZONE+200")
    c=probe(pg,"https://aircraftdefects.com/z/?hero=where&zone=ZONE+200")
    b.close()
json.dump({"ouder":o,"kloon":c}, open("options.json","w"), indent=1)

def show(title, a, bl):
    miss=[x for x in a if x not in bl]
    extra=[x for x in bl if x not in a]
    print("\n%s  (ouder %d, kloon %d)" % (title, len(a), len(bl)))
    if miss:  print("   ONTBREEKT: " + ", ".join(map(str,miss))[:1000])
    if extra: print("   EXTRA:     " + ", ".join(map(str,extra))[:400])
    if not miss and not extra: print("   gelijk")

print("="*70); print("KEUZELIJSTEN")
for k,v in o["selects"].items():
    cv=c["selects"].get(k)
    if cv is None: print("\n  select #%-12s ONTBREEKT HELEMAAL (ouder heeft %d opties)"%(k,len(v)))
    else: show("  select #"+k, v, cv)
for k in c["selects"]:
    if k not in o["selects"]: print("\n  select #%s alleen in de kloon: %s"%(k,c["selects"][k][:6]))

print("\n"+"="*70); print("INVOERVELDEN")
oi=[i["id"] for i in o["inputs"] if i["id"]]; ci=[i["id"] for i in c["inputs"] if i["id"]]
show("  ids", oi, ci)
print("\n"+"="*70); print("KNOPPEN");   show("  labels", o["buttons"], c["buttons"])
print("\n"+"="*70); print("TABBLADEN"); show("  tabs", o["tabs"], c["tabs"])
print("\n"+"="*70); print("PANELEN");   show("  ids", o["panels"], c["panels"])
print("\n"+"="*70); print("KOPPEN");    show("  koppen", o["headings"], c["headings"])
print("\n"+"="*70); print("KLIKBARE SOORTEN"); show("  data-take", o["takes"], c["takes"])
print("\n"+"="*70); print("ENDPOINTS"); show("  api", o["api"], c["api"])
