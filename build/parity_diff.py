"""Drive parent and clone through the same states and compare what each one has.
Counts and strings, not prose. A missing feature must show up as a number."""
from playwright.sync_api import sync_playwright
import json, sys

PROBE = """() => {
  const q=(s)=>[...document.querySelectorAll(s)];
  const txt=(s)=>{const n=document.querySelector(s);return n?n.innerText.trim().replace(/\\s+/g," "):null};
  return {
    rails:        q(".rail").map(n=>n.dataset.rail),
    railOpen:     q(".rail.open").map(n=>n.dataset.rail),
    zoneMarks:    q("[data-take^='zone|']").length,
    monthMarks:   q(".mo").length,
    opMarks:      q("[data-take^='operator|']").length,
    tailMarks:    q("[data-take^='tail|']").length,
    crewMarks:    q("[data-take^='crew|']").length,
    takeKinds:    [...new Set(q("[data-take]").map(n=>n.dataset.take.split("|")[0]))].sort(),
    aimKinds:     [...new Set(q("[data-aim]").map(n=>n.dataset.aim.split("|")[0]))].sort(),
    tabs:         q("[role=tab], .tab").map(n=>n.innerText.trim().replace(/\\s+/g," ")),
    panels:       q("[id^='p-']").map(n=>n.id),
    filterFields: ["q","operator","make","model","part","ata","jasc","nature","crew","condition",
                   "stage","zone","tail","discovered","corrosion","cracked","minhours","from","to"]
                  .filter(k=>document.getElementById(k)),
    /* the rebuild puts its expander beside the strip, not inside it, and calls
       its pager rr-morebtn. Counting only the reference's own ids reported a
       missing control where there is one, which is a false fault. */
    starters:     q("#starters button, #starterToggle").length,
    chips:        q(".chip").length,
    reportRows:   q("table.reports tr.rep").length,
    writeUps:     q(".wu").length,
    caseBtns:     q("[onclick^='openCase'], [data-case]").length,
    spineRows:    q("tr.spine").length,
    exportBtn:    !!document.querySelector("[onclick*=exportCsv], #exportBtn"),
    copyBtn:      !!document.querySelector("[onclick*=copyLink], #copyBtn"),
    moreBtn:      !!(document.getElementById("more") || document.getElementById("rr-morebtn")),
    seamBtn:      !!q("button").find(b=>/Read the |Read all /.test(b.innerText)),
    aimAt:        !!document.getElementById("iAimAt")||!!document.getElementById("aimAt"),
    aimKindOpts:  (document.getElementById("aimKind")||{}).length||0,
    specimen:     txt(".specimen, .spec, [class*=specimen]"),
    reading:      q(".reading").map(n=>n.innerText.trim().replace(/\\s+/g," ").slice(0,150)),
    gutters:      q(".gut").map(n=>n.innerText.trim().replace(/\\s+/g," ")),
    sentence:     txt("#iSentence, .sentence, #sentence"),
    margin:       txt("#iMargin, .margin"),
    count:        txt("#count"),
    glossaryTerms:q(".term").length,
  };
}"""

def probe(pg, url):
    pg.goto(url, wait_until="networkidle", timeout=90000); pg.wait_for_timeout(5500)
    return pg.evaluate(PROBE)

# the two pages name the rails differently in the URL: the parent uses the hero
# key (anatomy, swarm, ledger), the clone uses the rail id. A parent link does
# not open the right rail on the clone. Recorded, and probed in each dialect.
STATES = [("rust",            "?hero=anatomy",              "?hero=where"),
          ("zone gekozen",    "?hero=anatomy&zone=ZONE+200","?hero=where&zone=ZONE+200"),
          ("wie",             "?hero=swarm",                "?hero=whose"),
          ("wat het afdwong", "?hero=ledger",               "?hero=forced"),
          ("wanneer",         "?hero=horizon",              "?hero=when")]

with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1100})
    out={}
    for name,pq,cq in STATES:
        out[name]={"ouder":probe(pg,"https://aircraftdefects.com/"+pq),
                   "kloon":probe(pg,"https://aircraftdefects.com/z/"+cq)}
    b.close()
json.dump(out, open("diff.json","w"), indent=1)

for state,d in out.items():
    print("\n" + "="*66); print(state.upper())
    p,c = d["ouder"], d["kloon"]
    for k in p:
        a,bb = p[k], c[k]
        if a==bb: continue
        f=lambda v: (str(v)[:78]+"…") if len(str(v))>78 else str(v)
        print("  %-14s ouder %s" % (k, f(a)))
        print("  %-14s kloon %s" % ("", f(bb)))
