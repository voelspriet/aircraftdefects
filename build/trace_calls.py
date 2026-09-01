#!/usr/bin/env python3
"""What every page asks the file for, when, and what it is waiting on.

    python3 build/trace_calls.py                 the live site
    python3 build/trace_calls.py --url http://…  a local build

The question this answers is not "is the database fast". It is not: a grouped
count over the whole file runs in 16ms on the server, while the same call from a
browser takes about 80ms on a warm connection, so four fifths of every call is
the trip to Falkenstein. When the page feels slow it is because it made too many
trips, or made them one after another when it could have made them at once.

So this measures the shape of the waiting, not the speed of the answering. For
each page it prints every call on a timeline, then names the critical path: the
chain of calls where each one starts only after the previous finished. A call on
that chain which does not use the previous answer is pure waiting, and that is
what to go and fix.

Two were found this way on 1 September:

  the system counts started 4ms after the hero call returned, having waited
  211ms for an answer they never read
  the first page of records did the same, for a total it only needed to print a
  label under the table

Both are now requested the moment the script is read.
"""
import sys, time, json, urllib.parse

BASE = "https://aircraftdefects.com"

PAGES = [
    ("the landing page", "/"),
    ("a system selected", "/?ata=55"),
    ("an airline selected", "/?operator=SWAA"),
    ("one airframe", "/?tail=617FE"),
    ("a lead: story leads", "/#view=leads"),
    ("a lead: in both files", "/#view=both"),
    ("a case sheet", "/case/DALA2026082604844"),
]

# What each call genuinely needs before it can be made. Read out of the page's
# own code, not guessed: a call needs an earlier answer only when its URL or its
# body is built from that answer.
NEEDS = {
    "/z/api/hero": "nothing, it is the first question",
    "/z/api/facets": "nothing",
    "/z/api/operators": "nothing, it is the airline-name map",
    "/z/api/specimen": "nothing, it is keyed on the selection",
    "/api/breakdown": "nothing, it is keyed on the selection",
    "/api/search": "nothing for the first page; later pages need the offset",
    "/api/leads": "nothing",
    "/z/api/both": "nothing",
    "/z/api/sheet": "nothing, it is keyed on the control number",
    "/z/api/case": "nothing",
    "/z/api/plane": "the case, for the tail and the serial it sends",
    "/api/aircraft": "the case, for the tail",
}


def kind(url):
    # urlparse, not a split on ".com". The local mode this file documents uses
    # http://127.0.0.1:8211, which contains no ".com", so every path stayed a
    # full absolute URL, matched no entry below, and printed as "unknown" in the
    # one column the tool exists for.
    path = urllib.parse.urlparse(url).path
    for k in NEEDS:
        if path.startswith(k):
            return k
    return path


def run(base):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        br = p.chromium.launch()
        for label, path in PAGES:
            ctx = br.new_context(viewport={"width": 1440, "height": 1000})
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)[:60]))
            pg.goto(base + path, wait_until="networkidle", timeout=120000)
            pg.wait_for_timeout(3500)
            calls = pg.evaluate("""()=>performance.getEntriesByType('resource')
                .filter(e=>/\\/api\\//.test(e.name))
                .map(e=>({u:e.name, s:Math.round(e.startTime), d:Math.round(e.duration)}))
                .sort((a,b)=>a.s-b.s)""")
            nav = pg.evaluate("""()=>{const n=performance.getEntriesByType('navigation')[0];
                const p=performance.getEntriesByType('paint')
                  .find(x=>x.name==='first-contentful-paint');
                return {html:Math.round(n.responseEnd), paint:Math.round(p?p.startTime:0)}}""")
            ctx.close()

            print("\n%s   %s" % (label.upper(), path))
            print("   html %dms, first paint %dms, %d calls"
                  % (nav["html"], nav["paint"], len(calls)))
            if not calls:
                print("   no calls")
                continue
            end = max(c["s"] + c["d"] for c in calls)
            for c in calls:
                k = kind(c["u"])
                # Anything that started within 30ms of an earlier call finishing,
                # and after it, was plausibly waiting for it.
                # Sorted by when each FINISHED, not when it started. calls is
                # in start order, so taking the last of these picked whichever
                # candidate began latest, which is not the one this call was
                # waiting on: a long call starting early can finish after a
                # short one that started later.
                waited = sorted([o for o in calls
                                 if o is not c and 0 <= c["s"] - (o["s"] + o["d"]) < 30],
                                key=lambda o: o["s"] + o["d"])
                mark = ""
                if waited:
                    on = kind(waited[-1]["u"])
                    need = NEEDS.get(k, "unknown")
                    mark = ("   <- started when %s finished; it needs %s"
                            % (on.split("/")[-1], need))
                bar = " " * int(c["s"] / 25) + "#" * max(1, int(c["d"] / 25))
                print("   %5dms +%4dms  %-26s %s%s"
                      % (c["s"], c["d"], k, bar, mark))
            print("   last answer in at %dms%s"
                  % (end, ("   errors: " + "; ".join(errs)) if errs else ""))
    return 0


if __name__ == "__main__":
    base = BASE
    for i, a in enumerate(sys.argv):
        if a == "--url" and i + 1 < len(sys.argv):
            base = sys.argv[i + 1].rstrip("/")
    print("\nreading %s\n" % base)
    sys.exit(run(base))
