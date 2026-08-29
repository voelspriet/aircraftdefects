"""Does the page tell the truth?

Five harnesses count, read, enumerate and measure. All five were green while the
page said "no operator named" on every row of data that names an operator, said
it held reports to 31 August when the file ends on the 26th, and ranked airlines
by how often they file under a heading about what crews did.

None of those is a missing part or a wrong pixel. Each is a statement that is not
true, and a statement is checkable: take every figure the page prints, and every
assertion it makes, and put it back to the data.
"""
from playwright.sync_api import sync_playwright
import json, re, urllib.request, ssl, certifi

CTX = ssl.create_default_context(cafile=certifi.where())
def api(path):
    with urllib.request.urlopen("https://aircraftdefects.com"+path, context=CTX, timeout=90) as r:
        return json.load(r)

STATES = [("alles",          ""),
          ("zone 500",       "?zone=ZONE%20500"),
          ("zone 200 + CALA","?zone=ZONE%20200&operator=CALA"),
          ("december 2025",  "?zone=ZONE%20500&from=2025-12-01&to=2025-12-31")]

def numbers(txt):
    """every figure the page prints, as an integer"""
    out=set()
    for m in re.finditer(r"\b\d{1,3}(?:,\d{3})+\b|\b\d+\b", txt):
        v=m.group(0).replace(",","")
        if v.isdigit(): out.add(int(v))
    return out

def truths(state_q):
    """every figure the data supports for this selection"""
    h = api("/api/hero"+state_q)
    s = api("/api/search"+(state_q+"&" if state_q else "?")+"limit=100")
    t = set()
    for k in ("total","corpus","aircraft","operators","crew_reports","unzoned",
              "no_location","other_location","swarm_total","reports_without_tail"):
        if isinstance(h.get(k), int): t.add(h[k])
    for z in h.get("zones",[]): t.add(z["n"])
    for c in h.get("crew",[]):  t.add(c["n"])
    for m in h.get("months",[]): t.add(m["n"]); t.add(m["all"])
    for o in h.get("operator_rows",[]): t.add(o["n"])
    for a in h.get("swarm",[]): t.add(a["n"])
    if isinstance(s.get("total"), int): t.add(s["total"])
    if isinstance(s.get("undated"), int): t.add(s["undated"])
    # every figure a row itself carries is printed on the page and is data:
    # airframe hours, cycles, crack counts and lengths, control numbers
    for r in s.get("rows", []):
        for k in ("AircraftTotalTime","AircraftTotalCycles","NumberOfCracks","CrackLength"):
            v=str(r.get(k) or "").strip().replace(",","")
            if v.replace(".","",1).isdigit():
                t.add(int(float(v)))
    t.add(len(h.get("months",[])))
    sp=h.get("span") or {}
    for k in ("days","dated"):
        if isinstance(sp.get(k), int): t.add(sp[k])
    lag=h.get("lag") or {}
    if isinstance(lag.get("p95_days"), int): t.add(lag["p95_days"])
    return t, h

with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1200})
    for name, q in STATES:
        supported, hero = truths(q)
        pg.goto("https://aircraftdefects.com/z/"+q, wait_until="networkidle", timeout=90000)
        pg.wait_for_timeout(9000)
        txt = pg.inner_text("body")
        printed = numbers(txt)
        # a year is not a claim about the data, and the panels that ignore the
        # selection quote whole-file figures on purpose, so both are allowed
        whole,_ = truths("")
        big = {n for n in printed
               if n >= 1000 and not (1900 <= n <= 2100) and n not in whole}
        unsupported = sorted(n for n in big if n not in supported)

        print("\n" + "="*66); print(name.upper())
        print("  cijfers op de pagina: %d, waarvan groot: %d" % (len(printed), len(big)))
        if unsupported:
            print("  NIET TERUG TE VINDEN IN DE DATA: %s" % ", ".join(f"{n:,}" for n in unsupported[:12]))
        else:
            print("  elk groot getal komt terug in het antwoord van de API")

        # named assertions, each checked against the data
        rows = api("/api/search"+(q+"&" if q else "?")+"limit=100").get("rows",[])
        blank = sum(1 for r in rows if not (r.get("OperatorDesignator") or "").strip())
        said  = txt.count("no operator named")
        if said > blank:
            print("  ZEGT %d keer 'no operator named' waar de data er %d blanco heeft" % (said, blank))
        end = (hero.get("lag") or {}).get("file_to")
        if end:
            d,mo,y = end.split("-")[2], int(end.split("-")[1]), end.split("-")[0]
            MON=["","January","February","March","April","May","June","July",
                 "August","September","October","November","December"]
            want = "%d %s %s" % (int(d), MON[mo], y)
            if "everything the FAA has published to" in txt and want not in txt:
                m=re.search(r"everything the FAA has published to ([^.]+)", txt)
                print("  ZEGT gepubliceerd tot %r, het bestand eindigt %r" % (m.group(1) if m else "?", want))
    b.close()
