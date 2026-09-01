#!/usr/bin/env python3
"""Bring the published size of the file in line with the file.

    python3 build/refresh_corpus.py            rewrite every mention
    python3 build/refresh_corpus.py --check    report drift, change nothing, exit 1

The FAA publishes three times a day and this site refreshes with it, so the total
moves. On 1 September 2026 it went from 1,757,827 to 1,758,134 overnight, and two
gates failed a site that was adding up perfectly, because they held a number a
developer had typed a week earlier. The page itself was never wrong: it counts.
Only the prose around it, and the checks, held a copy.

A number in prose that is copied by hand rots. This makes it a build step, so the
only number anyone edits is the one the file reports.

The meta description, the JSON-LD, llms.txt and the README all say it, and so
does the GitHub repository description, which lives outside this repository and
is printed at the end for you to paste.
"""
import json, re, ssl, sys, urllib.request, pathlib, datetime

import certifi

HERE = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://aircraftdefects.com"
CTX = ssl.create_default_context(cafile=certifi.where())

# Every file that states the size of the file to a reader.
FILES = ["rebuild/z2.html", "app/static/llms.txt", "app/static/robots.txt",
         "README.md", "SUBMISSION_FORM.md", "SUBMISSION_DESCRIPTION.md"]

NUM = re.compile(r"\b1,7[0-9]{2},[0-9]{3}\b")
# "to 26 August 2026", "through 26 August 2026", "published on 26 August 2026"
DATE = re.compile(r"\b([1-9]|[12][0-9]|3[01]) (January|February|March|April|May|June|"
                  r"July|August|September|October|November|December) 20[0-9]{2}\b")
ISO = re.compile(r"\b20[0-9]{2}-[0-9]{2}-[0-9]{2}\b")


def live():
    with urllib.request.urlopen(SITE + "/z/api/search?limit=1", timeout=60, context=CTX) as r:
        total = json.load(r)["total"]
    with urllib.request.urlopen(SITE + "/z/api/freshness", timeout=60, context=CTX) as r:
        fresh = json.load(r)
    last = (fresh.get("newest_report") or "")[:10]
    return total, last


def words(iso):
    try:
        d = datetime.date.fromisoformat(iso)
    except Exception:
        return None
    return "%d %s %d" % (d.day, d.strftime("%B"), d.year)


def main():
    check = "--check" in sys.argv
    total, last = live()
    pretty, spoken = "{:,}".format(total), words(last)
    print("the file holds %s reports, latest %s" % (pretty, last or "unknown"))

    stale, changed = [], []
    for rel in FILES:
        p = HERE / rel
        if not p.exists():
            continue
        s = p.read_text()
        new = NUM.sub(pretty, s)
        # A date stated beside the count is part of the same claim, so it moves
        # with it. Only the ones that name the end of the covered period.
        if spoken:
            # Only the date that ends the covered period, and only where it is
            # anchored to the start of it. A looser rule matching any "and <date>"
            # would have rewritten "5 January 2024", the door-plug blow-out, into
            # today. A refresher that edits the facts it passes on its way to the
            # metadata is worse than a stale number.
            for lead in (r"1 January 1995 (?:and|to|through) ",
                         r"1995 to ", r"published to ", r"up to ", r"as of "):
                new = re.sub(r"(%s)%s" % (lead, DATE.pattern),
                             lambda m: m.group(1) + spoken, new)
        if last:
            new = re.sub(r"(1995-01-01/)" + ISO.pattern, r"\g<1>" + last, new)
            new = re.sub(r"(to |through )20[0-9]{2}-[0-9]{2}-[0-9]{2}\b",
                         lambda m: m.group(1) + last, new)
        if new == s:
            continue
        if check:
            stale.append(rel)
            continue
        p.write_text(new)
        changed.append(rel)

    if check and stale:
        print("STALE:\n  " + "\n  ".join(stale))
        print("\nrun without --check to bring them in line")
        return 1
    if check:
        print("every published number matches the file")
        return 0
    print("rewritten: " + (", ".join(changed) if changed else "nothing to change"))
    print("\nthe GitHub repository description lives outside this repository. If it\n"
          "states a number, it is now: %s" % pretty)
    return 0


if __name__ == "__main__":
    sys.exit(main())
