#!/usr/bin/env python3
"""Count what of the shipped code is the model's and what is hand-written.

The share moves whenever either half grows, and it was quoted in four documents
at once, so three of them were wrong within a day. It is quoted in one document
now, MODEL_USE.md, and counted here.

    python3 build/count_provenance.py            recount and rewrite the table
    python3 build/count_provenance.py --check    report drift, change nothing,
                                                 exit 1 if the table is stale

What ships, and who wrote it:

    rebuild/z2.html    the page a visitor lands on          hand-written
    rebuild/case.html  one report on its own page           hand-written
    app/app.py         the service: the file's API, the      mixed. Blocks headed
                       model calls, the quote verifier       "# ---- hand-written"
                                                             are hand-written,
                                                             the rest is the model's

The earlier page, which the model wrote whole from the specifications in
rebuild/specs/, is kept in the repository but not served, so it is not counted
here. Counting it would flatter the number by measuring something nobody visits.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent.parent
HAND_PAGES = ["rebuild/z2.html", "rebuild/case.html"]
SERVICE = "app/app.py"


def service_split():
    """The service is marked in the source: a block headed '# ---- hand-written'
    runs until the next '# ----' banner. Anything else is the model's."""
    s = (HERE / SERVICE).read_text()
    hand, on = 0, False
    for line in s.split("\n"):
        if line.startswith("# ----"):
            on = "hand-written" in line
        if on:
            hand += len(line) + 1
    return len(s), hand


def table():
    rows, hand = [], 0
    for p in HAND_PAGES:
        n = len((HERE / p).read_text())
        hand += n
        rows.append("        %-22s %9s   hand-written" % (p, f"{n:,}"))
    total_service, hand_service = service_split()
    hand += hand_service
    model = total_service - hand_service
    rows.append("        %-22s %9s   of which %s hand-written, %s the model's"
                % (SERVICE, f"{total_service:,}", f"{hand_service:,}", f"{model:,}"))
    total = sum(len((HERE / p).read_text()) for p in HAND_PAGES) + total_service
    head = [
        "    shipped code, raw          %11s characters" % f"{total:,}",
        "      the model's              %11s   %.1f%%" % (f"{model:,}", 100 * model / total),
        "      hand-written             %11s   %.1f%%" % (f"{hand:,}", 100 * hand / total),
    ]
    return "\n".join(head + rows), model, hand, total


def main():
    check = "--check" in sys.argv
    new, model, hand, total = table()
    p = HERE / "MODEL_USE.md"
    s = p.read_text()
    m = re.search(r"    (?:served page|shipped code), raw.*?(?=\n\n)", s, re.S)
    if not m:
        sys.exit("the table is not where this script expects it in MODEL_USE.md")
    same = m.group(0).strip() == new.strip()
    line = "%s of %s characters are the model's, %.1f%%" % (f"{model:,}", f"{total:,}", 100 * model / total)
    if same:
        print("current: " + line)
        return
    if check:
        print("STALE. MODEL_USE.md says:\n%s\n\nthe repository says:\n%s" % (m.group(0), new))
        sys.exit(1)
    p.write_text(s[:m.start()] + new + s[m.end():])
    print("rewritten: " + line)


if __name__ == "__main__":
    main()
