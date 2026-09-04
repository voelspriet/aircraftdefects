#!/usr/bin/env python3
"""Fill the blind labelling queue in conflicts.db. Run on the server:

    python3 build/make_label_set.py            # every ledger entry + as many controls
    python3 build/make_label_set.py --controls 100

Controls are unflagged reports drawn from the same 35 searches the sweep reads
(build/scan_conflicts.py), years 2025 and 2026, write-up at least 60 characters,
so recall is measured within the sweep's reach and the page says so. The queue
is shuffled with a fixed seed and stores each record's full JSON so the page can
show the decoded codes without touching the file again. Safe to rerun: it never
replaces an existing queue row, so labels already given keep their report."""
import json, os, random, sqlite3, sys, urllib.request

DB = os.environ.get("CONFLICTS_DB", "/opt/sdrz/conflicts.db")
BASE = os.environ.get("BASE", "http://127.0.0.1:8211")   # /z/api/* here
SDR = os.environ.get("SDR_API", "http://127.0.0.1:8124")  # /api/* is the parent tool
QUERIES = ["DECLARED+EMERGENCY","DIVERTED","RETURNED+TO+THE+GATE","AIR+TURNBACK",
           "SMOKE+IN+THE+CABIN","EVACUAT","RETURNED+TO+FIELD","EMERGENCY+DESCENT",
           "RAPID+DECOMPRESSION","LOSS+OF+PRESSURIZATION","OXYGEN+MASKS",
           "ENGINE+SHUTDOWN","SHUT+DOWN+THE+ENGINE","IFSD","FLAMEOUT",
           "FIRE+WARNING","ENGINE+FIRE","BURNING+ODOR","BURNING+SMELL","FUMES",
           "ABORTED+TAKEOFF","REJECTED+TAKEOFF","HIGH+SPEED+ABORT","GO+AROUND",
           "DEPARTED+THE+AIRCRAFT","SEPARATED+IN+FLIGHT","FOD+FOUND",
           "PRECAUTIONARY+LANDING","UNSCHEDULED+LANDING","LANDED+OVERWEIGHT",
           "FUEL+DUMP","DUMPED+FUEL","EXTINGUISHER+DISCHARGED","MAYDAY","PAN+PAN"]

def get(url):
    return json.load(urllib.request.urlopen(url, timeout=60))

def main():
    want = int(sys.argv[sys.argv.index("--controls") + 1]) if "--controls" in sys.argv else None
    c = sqlite3.connect(DB, timeout=20)
    c.execute("CREATE TABLE IF NOT EXISTS label_queue(pos INTEGER PRIMARY KEY, id TEXT UNIQUE, rec TEXT, flagged INTEGER)")
    ledger = [r[0] for r in c.execute("SELECT id FROM conflicts").fetchall()]
    have = {r[0] for r in c.execute("SELECT id FROM label_queue").fetchall()}
    print("ledger", len(ledger), "already queued", len(have))
    pool = []
    seen = set(ledger)
    for y in (2026, 2025):
        for q in QUERIES:
            for r in (get(SDR + "/api/search?q=%s&from=%d-01-01&to=%d-12-31&limit=40" % (q, y, y)).get("rows") or []):
                i = r.get("OperatorControlNumber"); t = (r.get("Discrepancy") or "").strip()
                if i and i not in seen and len(t) >= 60:
                    seen.add(i); pool.append(i)
    print("control pool", len(pool))
    rnd = random.Random(5)
    rnd.shuffle(pool)
    n_controls = want if want is not None else len(ledger)
    ids = [(i, 1) for i in ledger] + [(i, 0) for i in pool[:n_controls]]
    rnd.shuffle(ids)
    pos = (c.execute("SELECT MAX(pos) FROM label_queue").fetchone()[0] or 0)
    added = 0
    for i, flagged in ids:
        if i in have:
            continue
        try:
            rec = get(SDR + "/api/case/" + i)
        except Exception as e:
            print("skip", i, e); continue
        if not rec.get("OperatorControlNumber"):
            continue
        pos += 1
        c.execute("INSERT OR IGNORE INTO label_queue(pos, id, rec, flagged) VALUES (?,?,?,?)",
                  (pos, i, json.dumps(rec), flagged))
        added += 1
    c.commit()
    tot = c.execute("SELECT COUNT(*), SUM(flagged) FROM label_queue").fetchone()
    print("added", added, "queue", tot[0], "of which flagged", tot[1])
    c.close()

if __name__ == "__main__":
    main()
