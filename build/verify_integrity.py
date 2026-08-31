#!/usr/bin/env python3
"""Does the site tell the truth about the file it is built on?

The presentation gate next door asks whether the page works. This one asks
whether it is honest, which is a different question and the one that matters
for a tool people will quote. It compares what a reader sees against what the
FAA and NTSB files actually hold, record by record, and fails on any gap.

    python3 build/verify_integrity.py               # the live site
    python3 build/verify_integrity.py --n 60        # a larger sample
    python3 build/verify_integrity.py --url http://127.0.0.1:8211

Exit 0 when every check passes, 1 otherwise.

The rule every check serves: a reader must be able to see the record itself,
separate from anything this site did to it, and every derived line must be
traceable to a named source. Three faults found by hand on 31 August are what
this file exists to catch automatically from now on:

  - a row led with FLUID LOSS, which is a lookup table's wording for a field the
    file stores as the letter K. The decoding sat where the source belongs.
  - "Not in the FAA table used here", a statement about this site's tables, was
    printed under the heading WHAT IT MEANS.
  - a 2002 Boeing 717 report carried a registry block describing an Air Tractor
    crop-duster, because the registration had been reissued in between.

A check that examines nothing must fail, never pass quietly. Every check below
reports how many things it looked at.
"""
import sys, json, re, ssl, urllib.request, urllib.error, urllib.parse, collections
import concurrent.futures as cf

import certifi

SITE = "https://aircraftdefects.com"
CORPUS = 1757827
CTX = ssl.create_default_context(cafile=certifi.where())


def get(url):
    with urllib.request.urlopen(url, timeout=120, context=CTX) as r:
        return json.load(r)


class Checks:
    def __init__(self):
        self.rows = []

    def add(self, name, ok, detail=""):
        self.rows.append((name, bool(ok), detail))

    def report(self):
        w = max(len(n) for n, _, _ in self.rows)
        bad = 0
        for name, ok, detail in self.rows:
            if not ok:
                bad += 1
            print("  %s  %s   %s" % ("pass" if ok else "FAIL", name.ljust(w), detail))
        print()
        print(("%d of %d checks failed." % (bad, len(self.rows))) if bad
              else ("all %d checks pass." % len(self.rows)))
        return 1 if bad else 0


# Spread across the file, not the newest page of it. The first version of this
# took the most recent records and every one of them matched today's registry,
# so the checks that exist for reissued registrations and stale owners examined
# nothing and passed. The years below reach back to the start of the file, where
# a tail number has had thirty years to move to another airframe.
YEARS = (1996, 2001, 2004, 2009, 2012, 2016, 2019, 2023)


def sample_ids(site, n):
    """Control numbers to work on. Taken from the site's own search, so these
    are real records, and taken across three decades rather than from one week."""
    ids, per = [], max(2, n // (len(YEARS) + 1))
    for y in YEARS:
        try:
            d = get("%s/z/api/search?from=%d-01-01&to=%d-12-31&limit=%d"
                    % (site, y, y, per))
        except Exception:
            continue
        ids += [r["OperatorControlNumber"] for r in (d.get("rows") or [])
                if r.get("OperatorControlNumber")]
    d = get("%s/z/api/search?limit=%d" % (site, per))
    ids += [r["OperatorControlNumber"] for r in (d.get("rows") or [])
            if r.get("OperatorControlNumber")]
    seen, out = set(), []
    for i in ids:
        if i not in seen:
            seen.add(i); out.append(i)
    return out[:n]


def serial_key(v):
    v = "".join(ch for ch in str(v or "").upper() if ch.isalnum())
    return v.lstrip("0") or v


def run(site, n, skip_browser=False):
    c = Checks()
    ids = sample_ids(site, n)
    c.add("the sample is real records", len(ids) >= 20,
          "%d control numbers" % len(ids))
    if len(ids) < 20:
        return c.report()

    def fetch(i):
        try:
            return i, get("%s/z/api/sheet/%s" % (site, urllib.parse.quote(i)))
        except Exception as e:
            return i, {"error": str(e)[:60]}

    with cf.ThreadPoolExecutor(8) as ex:
        sheets = dict(ex.map(fetch, ids))
    good = {i: s for i, s in sheets.items() if s.get("rows")}
    c.add("every sampled record answers", len(good) == len(ids),
          "%d of %d" % (len(good), len(ids)))

    # ---- 1. the first line of a row is the file, character for character -----
    # The row's "filed" value must equal the raw FAA field it came from. Not a
    # formatted date, not a decoded label, not a trimmed string. This is the
    # check that would have caught FLUID LOSS standing where K belongs.
    FIELD_OF = {}
    for i, s in good.items():
        raw = s.get("raw") or {}
        for r in s["rows"]:
            FIELD_OF.setdefault(r["field"], set()).add(i)
    drift, looked = [], 0
    for i, s in good.items():
        raw = s.get("raw") or {}
        by_value = collections.Counter(str(v).strip() for v in raw.values()
                                       if v not in (None, "", " "))
        for r in s["rows"]:
            looked += 1
            filed = r.get("filed")
            if filed is None:
                drift.append("%s %s: no filed value at all" % (i, r["field"]))
            elif not by_value.get(str(filed).strip()):
                drift.append("%s %s: shows %r, which is in no field of the record"
                             % (i, r["field"], str(filed)[:24]))
    c.add("every row leads with a value the record actually holds",
          looked > 0 and not drift,
          "; ".join(drift[:3]) if drift else "%d rows over %d records" % (looked, len(good)))

    # ---- 2. a decoding is never the leading value ---------------------------
    # Where a row carries the FAA table's wording, that wording must NOT be what
    # leads the row. Same fault as above, stated the other way round, because a
    # future edit could reintroduce it by swapping two variables.
    swapped = ["%s %s" % (i, r["field"])
               for i, s in good.items() for r in s["rows"]
               if r.get("faa") and str(r["faa"]).strip() == str(r.get("filed") or "").strip()
               and str(r["faa"]).strip() != str(r.get("code") or "").strip()]
    c.add("no row leads with a decoding instead of the record",
          not swapped, "; ".join(swapped[:3]))

    # ---- 3. decodings come from the FAA's tables, never from nowhere --------
    # Every "the FAA's table calls this" must match the FAA's own glossary entry
    # for that exact code. A wording that appears nowhere in the tables would be
    # this tool inventing a meaning, which is the worst thing it could do.
    gloss = get("%s/api/glossary" % site).get("codes", {})
    known = set()
    for table, entries in gloss.items():
        if not isinstance(entries, dict):   # the glossary carries a _source string too
            continue
        for code, e in entries.items():
            if isinstance(e, dict):
                for k in ("faa", "label"):
                    if e.get(k):
                        known.add(str(e[k]).strip())
            elif isinstance(e, str):
                known.add(e.strip())
    invented, checked = [], 0
    for i, s in good.items():
        for r in s["rows"]:
            for k in ("faa",):
                if r.get(k):
                    checked += 1
                    if str(r[k]).strip() not in known:
                        invented.append("%s %s: %r is in no FAA table"
                                        % (i, r["field"], str(r[k])[:40]))
    c.add("every FAA wording shown is in the FAA's own tables",
          checked > 0 and not invented,
          "; ".join(invented[:3]) if invented else "%d decodings traced" % checked)

    # ---- 4. a note about our tables is never dressed as meaning -------------
    # "Not in the FAA table used here" is a statement about this site. It has
    # its own field and must never appear as the explanation of a code.
    dressed = ["%s %s" % (i, r["field"])
               for i, s in good.items() for r in s["rows"]
               if re.search(r"not in the faa table|shown as filed", str(r.get("note") or ""), re.I)]
    c.add("no caveat about this site is printed as meaning",
          not dressed, "; ".join(dressed[:3]))

    # ---- 5. the mechanic's words are quoted, not paraphrased ----------------
    # The page's quote must be the Discrepancy field exactly. A summary standing
    # in for a quote is the failure that would let a reporter misquote a source.
    off, q = [], 0
    for i, s in good.items():
        raw = s.get("raw") or {}
        want = (raw.get("Discrepancy") or "").strip()
        if not want:
            continue
        q += 1
        if (s.get("text") or "").strip() != want:
            off.append(i)
    c.add("the quoted words are the mechanic's, unchanged",
          q > 0 and not off, "; ".join(off[:3]) if off else "%d quotes compared" % q)

    # ---- 6. the whole file is one number, and it holds under a filter -------
    tot = get("%s/z/api/search?limit=1" % site).get("total")
    sums, sum_bad = 0, []
    for qs in ("operator=SWAA", "zone=ZONE+700", "tail=617FE", "ata=53"):
        try:
            d = get("%s/z/api/search?%s&limit=1" % (site, qs))
        except Exception:
            sum_bad.append("%s: would not answer" % qs); continue
        sums += 1
        sel = d.get("total")
        if not isinstance(sel, int) or sel > CORPUS:
            sum_bad.append("%s: selection %r is not inside the file" % (qs, sel))
    c.add("the file is %s reports and every selection sits inside it" % f"{CORPUS:,}",
          tot == CORPUS and sums > 0 and not sum_bad,
          "; ".join(sum_bad[:2]) if sum_bad else "corpus %s, %d selections checked"
          % (f"{tot:,}" if isinstance(tot, int) else tot, sums))

    # ---- 7. the NTSB join is on the airframe, and says which ---------------
    # Every case returned for a tail must carry that tail. A case marked
    # confirmed must have serials that genuinely agree; one marked differs must
    # genuinely differ. A verdict that does not follow from the data is a lie
    # the reader has no way of catching.
    tails = {}
    for i, s in good.items():
        raw = s.get("raw") or {}
        t = (raw.get("RegistryNNumber") or "").strip()
        if t and t not in tails:
            tails[t] = (raw.get("AircraftSerialNumber") or "").strip()
        if len(tails) >= 12:
            break
    join_bad, cases, gone = [], 0, 0
    for t, rep in tails.items():
        try:
            d = get("%s/z/api/plane/N%s%s" % (site, urllib.parse.quote(t),
                                              "?serial=" + urllib.parse.quote(rep) if rep else ""))
        except urllib.error.HTTPError as e:
            # 404 is an answer, and the right one. A tail from a 1990s report is
            # often gone from today's registry with no NTSB case to its name, and
            # saying "nothing found" is more honest than inventing a record. Only
            # a server that breaks counts against the site here.
            if e.code == 404:
                gone += 1
                continue
            join_bad.append("N%s: HTTP %d" % (t, e.code)); continue
        except Exception as e:
            join_bad.append("N%s: %s" % (t, str(e)[:40])); continue
        for x in (d.get("ntsb") or []):
            cases += 1
            v, ns, basis = x.get("airframe"), x.get("serial"), x.get("compared_with")
            if v == "confirmed" and ns and basis and not (
                    serial_key(ns) == serial_key(basis)
                    or serial_key(ns) in serial_key(basis)
                    or serial_key(basis) in serial_key(ns)):
                join_bad.append("N%s %s: called confirmed on %s vs %s"
                                % (t, x.get("case"), ns, basis))
            if v == "differs" and (not ns or not basis
                                   or serial_key(ns) == serial_key(basis)):
                join_bad.append("N%s %s: called differs on %s vs %s"
                                % (t, x.get("case"), ns, basis))
            if v == "confirmed" and not (ns and basis):
                join_bad.append("N%s %s: confirmed without two serials" % (t, x.get("case")))
    c.add("every NTSB verdict follows from the two serials",
          not join_bad, "; ".join(join_bad[:3]) if join_bad
          else "%d cases over %d tails, %d tails no longer on the registry"
               % (cases, len(tails), gone))

    # ---- 8. the registry block admits when it is a different aircraft -------
    # The registry answers for whoever holds the tail today. On an old report
    # that is often another machine, and the page must say so rather than print
    # a crop-duster under a Boeing report.
    mism, seen = [], 0
    for i, s in list(good.items()):
        raw = s.get("raw") or {}
        t = (raw.get("RegistryNNumber") or "").strip()
        rep = (raw.get("AircraftSerialNumber") or "").strip()
        if not (t and rep):
            continue
        try:
            d = get("%s/z/api/plane/N%s" % (site, urllib.parse.quote(t)))
        except Exception:
            continue
        reg = ((d.get("registry") or {}).get("full") or [])
        got = next((f.get("v") for f in reg if f.get("f") == "Serial number"), None)
        if not got:
            continue
        seen += 1
        if serial_key(got) != serial_key(rep):
            mism.append((i, t, rep, got))
        if seen >= 25:
            break
    c.add("a registry that names another airframe is detectable",
          seen > 0,
          "%d reports compared, %d name a different airframe than the registry holds today"
          % (seen, len(mism)))
    # Detecting it is half the job. The page has to say it, in the reader's
    # sight, or the block below a 2002 Boeing report still shows a crop-duster
    # and the reader has no way to know. Checked in the browser section below.
    c.mismatched = mism[:4]

    # ---- 9. the model's own words invent no numbers -------------------------
    # The explanations under WHAT IT MEANS were written by a model. It was told
    # to invent no fact, number or threshold. This is where that is enforced
    # rather than trusted.
    try:
        notes = json.load(open("app/code_notes.json"))
    except Exception:
        notes = {}
    numeric = [(t, k, v) for t in notes for k, v in notes[t].items()
               if re.search(r"\b\d[\d,\.]*\b", v)]
    dashes = [(t, k) for t in notes for k, v in notes[t].items() if "—" in v or "–" in v]
    total_notes = sum(len(v) for v in notes.values())
    c.add("the written explanations state no number of their own",
          total_notes > 0 and not numeric and not dashes,
          ("%d with a number, %d with a dash" % (len(numeric), len(dashes)))
          if (numeric or dashes) else "%d explanations read" % total_notes)

    if skip_browser:
        return c.report()

    # ---- 10. the page shows what the endpoint says -------------------------
    # Everything above trusts the JSON. This one opens a browser, because a page
    # can render something other than what it fetched, and that is exactly the
    # class of fault the presentation gate was blind to for a week.
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        c.add("the rendered page agrees with the endpoint", False,
              "playwright is not installed, so this examined nothing")
        return c.report()

    page_bad, rendered = [], 0
    pick = [i for i in list(good)[:6]]
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1440, "height": 1100})
        for i in pick:
            pg.goto("%s/case/%s" % (site, urllib.parse.quote(i)),
                    wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(4000)
            shown = pg.evaluate("""()=>{const o={};
                document.querySelectorAll('table.sheet tr').forEach(tr=>{
                  if(tr.children.length<2)return;
                  const b=tr.children[1].querySelector('b');
                  if(b)o[tr.children[0].innerText.trim().toLowerCase()]=b.innerText.trim();});
                return o;}""")
            if not shown:
                page_bad.append("%s: no sheet rendered" % i); continue
            for r in good[i]["rows"]:
                k = r["field"].strip().lower()
                if k in shown:
                    rendered += 1
                    if shown[k] != str(r.get("filed") or "").strip():
                        page_bad.append("%s %s: page shows %r, endpoint filed %r"
                                        % (i, r["field"], shown[k][:20],
                                           str(r.get("filed"))[:20]))
            # Normalise BOTH sides. Comparing a normalised page against an
            # unnormalised field failed two records on the first run of this
            # file, over a double space inside "COMPARTMENT.  EXISTING". The
            # words were on the page; the check was wrong. A gate that cries
            # wolf gets switched off, so this had to be fixed here rather than
            # loosened into a substring-of-a-substring test.
            quote = " ".join(pg.evaluate("()=>document.body.innerText").split())
            want = " ".join(((good[i].get("raw") or {}).get("Discrepancy") or "").split())
            if want and want not in quote:
                page_bad.append("%s: the mechanic's words are not on the page" % i)
        # The reports whose registry names another airframe: the page must say so
        # where the reader is looking, not leave the contradiction to be noticed.
        silent = []
        for i, t, rep, got in getattr(c, "mismatched", []):
            pg.goto("%s/case/%s" % (site, urllib.parse.quote(i)),
                    wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(6000)
            said = pg.evaluate("""()=>/not the aircraft in the report/i
                .test(document.body.innerText)""")
            if not said:
                silent.append("%s: report serial %s, registry %s, page says nothing"
                              % (i, rep, got))
        br.close()
    c.add("a report whose registry holds another airframe says so on the page",
          not silent,
          "; ".join(silent[:2]) if silent
          else "%d such reports checked" % len(getattr(c, "mismatched", [])))
    c.add("the rendered page agrees with the endpoint",
          rendered > 0 and not page_bad,
          "; ".join(page_bad[:2]) if page_bad
          else "%d rows over %d pages" % (rendered, len(pick)))

    return c.report()


# ---- the device that checks the device ------------------------------------
# A gate nobody has watched fail is a decoration. This feeds the checks above a
# site that lies in seven specific ways, each one a fault that actually reached
# production here or came within one edit of it, and requires every one to be
# caught. It runs against no network: `get` is replaced for the duration.

LIES = {
 "leads with a decoding":
   "a row whose first line is FLUID LOSS, the lookup table's wording, where the "
   "record holds the letter K",
 "invented wording":
   "an FAA wording that appears in none of the FAA's tables",
 "caveat as meaning":
   "'Not in the FAA table used here' printed as the meaning of a code",
 "paraphrased quote":
   "a tidied-up version of the mechanic's sentence in place of his words",
 "wrong corpus":
   "a whole-file total that is not the number the site publishes",
 "selection outside the file":
   "a filtered total larger than the file it is drawn from",
 "verdict that does not follow":
   "an NTSB case called confirmed while the two serials disagree",
}


def selftest():
    fake_ids = ["FAKE%03d" % i for i in range(1, 41)]
    raw = {"OperatorControlNumber": "FAKE001",
           "Discrepancy": "CRACK FOUND IN THE AFT PRESSURE BULKHEAD.",
           "NatureOfConditionA": "K", "RegistryNNumber": "999ZZ",
           "AircraftSerialNumber": "1"}
    rows = [
      # leads with the decoding, carries the caveat as meaning
      {"field": "What was found", "filed": "FLUID LOSS", "code": "K",
       "faa": "FLUID LOSS", "value": "Fluid loss",
       "note": "Not in the FAA table used here. Shown as filed.", "undecoded": None},
      # an FAA wording from nowhere
      {"field": "Stage of flight", "filed": "K", "code": "K",
       "faa": "WORDING THAT IS IN NO FAA TABLE", "value": "x",
       "note": None, "undecoded": None},
    ]
    sheet = {"id": "FAKE001", "raw": raw, "rows": rows,
             "text": "A crack was found in the rear bulkhead."}   # paraphrased

    def fake_get(url):
        if "/api/glossary" in url:
            return {"codes": {"nature": {"K": {"faa": "FLUID LOSS", "label": "Fluid loss"}}}}
        if "/z/api/search" in url:
            return {"total": CORPUS + 1,                       # wrong corpus
                    "rows": [{"OperatorControlNumber": i} for i in fake_ids]} \
                   if "limit=1" not in url else {"total": CORPUS * 2}
        if "/z/api/sheet/" in url:
            return sheet
        if "/z/api/plane/" in url:
            return {"registry": {"full": [{"f": "Serial number", "v": "1"}]},
                    "ntsb": [{"case": "AAA00XX000", "airframe": "confirmed",
                              "serial": "999", "compared_with": "1"}]}
        raise RuntimeError("the self-test asked for " + url)

    global get
    real, get = get, fake_get
    try:
        c = Checks()
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            run("http://self.test", 40, skip_browser=True)
        out = buf.getvalue()
    finally:
        get = real
    failed = [ln for ln in out.splitlines() if ln.strip().startswith("FAIL")]
    caught = {
      "leads with a decoding": "leads with a value the record actually holds",
      "invented wording": "FAA wording shown is in the FAA's own tables",
      "caveat as meaning": "caveat about this site is printed as meaning",
      "paraphrased quote": "quoted words are the mechanic's, unchanged",
      "wrong corpus": "reports and every selection sits inside it",
      "selection outside the file": "reports and every selection sits inside it",
      "verdict that does not follow": "NTSB verdict follows from the two serials",
    }
    print("\nself-test: a site that lies in %d ways\n" % len(LIES))
    missed = 0
    for lie, needle in caught.items():
        hit = any(needle in ln for ln in failed)
        if not hit:
            missed += 1
        print("  %s  %-28s %s" % ("caught" if hit else "MISSED", lie, LIES[lie]))
    print()
    if missed:
        print("%d of %d lies went through. The gate is not a gate." % (missed, len(caught)))
    else:
        print("every lie was caught. The checks can fail, so a pass means something.")
    return 1 if missed else 0


if __name__ == "__main__":
    site, n = SITE, 40
    for i, a in enumerate(sys.argv):
        if a == "--url" and i + 1 < len(sys.argv):
            site = sys.argv[i + 1].rstrip("/")
        if a == "--n" and i + 1 < len(sys.argv):
            n = int(sys.argv[i + 1])
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    print("\nreading %s, %d records\n" % (site, n))
    sys.exit(run(site, n))
