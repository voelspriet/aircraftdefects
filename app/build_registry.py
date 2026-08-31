#!/usr/bin/env python3
"""Hand-written, 31 August 2026: the FAA aircraft registry, as one small local file.

The FAA publishes its whole registry every day as ReleasableAircraft.zip. This
script downloads it (a browser User-Agent is required; curl's default gets a 403),
joins MASTER against ACFTREF for the model name, keeps the handful of fields the
case sheet shows, and writes faa_registry.sqlite next to app.py. Run it once by
hand, then weekly from cron. Nothing here guesses: every value is the FAA's own.
"""
import csv, io, os, sqlite3, sys, zipfile
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "https://registry.faa.gov/database/ReleasableAircraft.zip"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
DB = os.path.join(HERE, "faa_registry.sqlite")


def rows_of(z, name):
    with z.open(name) as f:
        # utf-8-sig: the FAA writes a byte-order mark that would otherwise
        # glue itself to the first header name and match nothing.
        r = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", errors="replace"))
        r.fieldnames = [c.strip() for c in r.fieldnames]
        for row in r:
            yield {k: (v or "").strip() for k, v in row.items() if k}


def main():
    zpath = os.path.join(HERE, "ReleasableAircraft.zip")
    if not (os.path.exists(zpath) and "--cached" in sys.argv):
        print("downloading", URL)
        with requests.get(URL, headers={"User-Agent": UA}, stream=True, timeout=300) as r:
            r.raise_for_status()
            with open(zpath + ".tmp", "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        os.replace(zpath + ".tmp", zpath)
    z = zipfile.ZipFile(zpath)
    names = {n.upper().split("/")[-1]: n for n in z.namelist()}

    ref = {}
    for row in rows_of(z, names["ACFTREF.TXT"]):
        ref[row.get("CODE", "")] = (row.get("MFR", ""), row.get("MODEL", ""))

    con = sqlite3.connect(DB + ".tmp")
    con.execute("CREATE TABLE reg (n TEXT PRIMARY KEY, owner TEXT, city TEXT, state TEXT, "
                "year TEXT, mfr TEXT, model TEXT, cert_issue TEXT, last_action TEXT)")
    con.execute("CREATE TABLE dereg (n TEXT, owner TEXT, cancel_date TEXT)")
    n_master = 0
    for row in rows_of(z, names["MASTER.TXT"]):
        n = row.get("N-NUMBER", "")
        if not n:
            continue
        mfr, model = ref.get(row.get("MFR MDL CODE", ""), ("", ""))
        con.execute("INSERT OR REPLACE INTO reg VALUES (?,?,?,?,?,?,?,?,?)",
                    (n, row.get("NAME", ""), row.get("CITY", ""), row.get("STATE", ""),
                     row.get("YEAR MFR", ""), mfr, model,
                     row.get("CERT ISSUE DATE", ""), row.get("LAST ACTION DATE", "")))
        n_master += 1
    n_dereg = 0
    for row in rows_of(z, names["DEREG.TXT"]):
        n = row.get("N-NUMBER", "")
        if not n:
            continue
        con.execute("INSERT INTO dereg VALUES (?,?,?)",
                    (n, row.get("NAME", ""), row.get("CANCEL-DATE", "")))
        n_dereg += 1
    con.execute("CREATE INDEX dereg_n ON dereg(n)")
    con.commit()
    con.close()
    os.replace(DB + ".tmp", DB)
    print("wrote %s: %d registered, %d deregistered" % (DB, n_master, n_dereg))


if __name__ == "__main__":
    main()
