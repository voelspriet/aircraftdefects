"""The four rails, side by side, and anything that will not sit still.

A jitter is not a look, it is geometry changing after the page has loaded. This
samples every element's box at 2, 4, 6, 9 and 12 seconds and reports what moved,
then screenshots both pages in the same state for the eye."""
from playwright.sync_api import sync_playwright
import json

STATES = [("WANNEER","?hero=horizon","?hero=when"),
          ("WAAR",   "?hero=anatomy","?hero=where"),
          ("WIE",    "?hero=swarm",  "?hero=whose"),
          ("WAT",    "?hero=ledger", "?hero=forced")]
FILT = "&zone=ZONE+500&from=2025-12-01&to=2025-12-31"

GEOM = """() => {
  const out = {};
  const pick = "h1,h2,.stamp,.stand,.sentence,#iSentence,.aim,.picker,.picker button," +
    ".rail,.gut,.track,.months,.mo,.strip,.orow,.lrow,.fblock,.reading,.margin,.specimen," +
    "svg.plane,.plane,.legend,.hint,.axis";
  document.querySelectorAll(pick).forEach((n,i) => {
    const r = n.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return;
    const key = (n.tagName + "." + String(n.className || "").split(" ")[0] +
                 (n.dataset && n.dataset.rail ? "[" + n.dataset.rail + "]" : "")) + "#" + i;
    out[key] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
  });
  out["__count__"] = [document.querySelectorAll(pick).length,0,0,0];
  out["__pageH__"] = [Math.round(document.documentElement.scrollHeight),0,0,0];
  return out;
}"""

def sample(pg, url):
    pg.goto(url, wait_until="domcontentloaded", timeout=90000)
    shots = []
    for ms in (2000, 2000, 2000, 3000, 3000):
        pg.wait_for_timeout(ms)
        shots.append(pg.evaluate(GEOM))
    return shots

def moved(shots):
    """keys whose box changes between the last three samples: settled pages do not move"""
    late = shots[2:]
    keys = set().union(*[set(s) for s in late])
    out = []
    for k in keys:
        vals = [tuple(s.get(k, ())) for s in late]
        if len(set(vals)) > 1:
            out.append((k, vals))
    return out

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width":1440,"height":1300})
    for name, pq, cq in STATES:
        print("\n" + "="*70); print(name)
        for side, base, q in [("ouder","https://aircraftdefects.com/",pq),
                              ("kloon","https://aircraftdefects.com/z/",cq)]:
            shots = sample(pg, base + q + FILT)
            mv = moved(shots)
            print("  %-6s elementen=%-4d paginahoogte=%-6d beweegt na laden: %d"
                  % (side, shots[-1]["__count__"][0], shots[-1]["__pageH__"][0], len(mv)))
            for k, vals in mv[:6]:
                print("      %-34s %s" % (k[:34], " -> ".join(str(v) for v in vals)))
            pg.screenshot(path="rail-%s-%s.png" % (name.lower(), side),
                          clip={"x":0,"y":0,"width":1440,"height":760})
    b.close()
