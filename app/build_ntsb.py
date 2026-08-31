#!/usr/bin/env python3
"""Hand-written, 31 August 2026: the NTSB accident file, as one small local table.

The FAA file this site is built on records what mechanics found and fixed. It
records no accidents, and the whole tool is careful to say so. The NTSB records
the other half: the accidents and incidents it investigated, with its own case
number and its own findings.

Keeping them apart matters. A tail number appearing here does not explain
anything in the maintenance file, and the maintenance file explains nothing here.
Two public records about one aircraft, from two agencies, shown side by side and
labelled, is a fact a reporter can use. Joining them into a single narrative is
not, and this script does not attempt it.

The NTSB publishes its whole aviation database as one Access file, refreshed
monthly:

    https://data.ntsb.gov/avdata                     the index
    .../DownloadFile?fileID=C:\\avdata\\avall.zip      95MB, holding a 555MB .mdb

Reading .mdb needs mdbtools (brew install mdbtools; apt install mdbtools). This
script downloads the zip, exports the two tables it needs, joins them on ev_id,
keeps only what a case page shows, and writes ntsb.sqlite next to app.py.

Run it once by hand, then monthly from cron. Nothing here is inferred: every
value is the NTSB's own, and the case number is kept so a reader can look it up.
"""
import csv, io, os, sqlite3, subprocess, sys, tempfile, zipfile
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
URL = ("https://data.ntsb.gov/avdata/FileDirectory/DownloadFile"
       "?fileID=C%3A%5Cavdata%5Cavall.zip")
DB = os.path.join(HERE, "ntsb.sqlite")
# The NTSB's own words are the point. narr_cause is its probable cause, which is
# the one thing the FAA file can never carry: that file records what was found and
# fixed and says nothing about why. narr_accf is the factual narrative, median 947
# characters, occasionally 36,000, so it is stored whole and shown clipped.


def export(mdb, table):
    out = subprocess.run(["mdb-export", mdb, table], capture_output=True, text=True)
    if out.returncode:
        sys.exit("mdb-export failed on %s: is mdbtools installed?" % table)
    return list(csv.DictReader(io.StringIO(out.stdout)))


def main():
    if not subprocess.run(["which", "mdb-export"], capture_output=True).stdout:
        sys.exit("mdbtools is not installed. brew install mdbtools")
    with tempfile.TemporaryDirectory() as tmp:
        z = os.path.join(tmp, "avall.zip")
        print("downloading the NTSB file, about 95MB")
        with requests.get(URL, stream=True, timeout=900) as r:
            r.raise_for_status()
            with open(z, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        zipfile.ZipFile(z).extractall(tmp)
        mdb = os.path.join(tmp, "avall.mdb")
        print("reading events and aircraft")
        events = {e["ev_id"]: e for e in export(mdb, "events")}
        aircraft = export(mdb, "aircraft")
        narr = {}
        for n in export(mdb, "narratives"):
            narr.setdefault(n["ev_id"], n)

    if os.path.exists(DB):
        os.remove(DB)
    c = sqlite3.connect(DB)
    c.execute("""CREATE TABLE ntsb(
        regis TEXT, ntsb_no TEXT, ev_type TEXT, ev_date TEXT, city TEXT,
        state TEXT, country TEXT, injury TEXT, fatalities TEXT, serious TEXT,
        minor TEXT, make TEXT, model TEXT, damage TEXT, phase TEXT, light TEXT,
        airport TEXT, cause TEXT, narrative TEXT)""")
    n = 0
    for a in aircraft:
        reg = (a.get("regis_no") or "").strip().upper().lstrip("N")
        e = events.get(a.get("ev_id"))
        if not reg or not e:
            continue
        nr = narr.get(a.get("ev_id")) or {}
        c.execute("INSERT INTO ntsb VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                  (reg, e.get("ntsb_no"), e.get("ev_type"), e.get("ev_date"),
                   e.get("ev_city"), e.get("ev_state"), e.get("ev_country"),
                   e.get("ev_highest_injury"), e.get("inj_tot_f"),
                   e.get("inj_tot_s"), e.get("inj_tot_m"),
                   a.get("acft_make"), a.get("acft_model"), a.get("damage"),
                   a.get("phase_flt_spec"), e.get("light_cond"), e.get("apt_name"),
                   (nr.get("narr_cause") or "").strip(),
                   (nr.get("narr_accf") or "").strip()))
        n += 1
    c.execute("CREATE INDEX ntsb_regis ON ntsb(regis)")
    c.commit()
    rows = c.execute("SELECT COUNT(*), COUNT(DISTINCT regis) FROM ntsb").fetchone()
    c.close()
    print("wrote %s: %s rows on %s aircraft" % (DB, f"{rows[0]:,}", f"{rows[1]:,}"))


if __name__ == "__main__":
    main()
