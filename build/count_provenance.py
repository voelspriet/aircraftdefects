#!/usr/bin/env python3
"""Count how much of the code this repository serves was written by the model.

    python3 build/count_provenance.py            recount and rewrite the table
    python3 build/count_provenance.py --check    report drift, change nothing,
                                                 exit 1 if the table is stale

Two pages are served, and the model's part in them is different:

    /z/rebuilt   rebuild/01-instrument.page.html
                 GLM-5.3-Flash wrote this page whole, from the written
                 specifications in rebuild/specs/, over two days. Two parts of
                 it are not the model's and are subtracted: bridge.js.bak, the
                 seam between the two halves it built separately, and the
                 *-hand.js/css blocks added later against measured faults.

    /            rebuild/z2.html and rebuild/case.html
                 hand-written. On this page the model is not the author of the
                 code, it is the reader of the file.

    app/app.py   the service, mixed. Blocks headed "# ---- hand-written" are
                 hand-written; everything else, including the nine research
                 builds the model designed and every live reading call, is the
                 model's.

Not counted, because it is not code that runs: 12,243 words of specification in
rebuild/specs/, every brief in rebuild/*.prompt.txt, and 4.35 million characters
of the model's own reasoning, all committed.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent.parent
R = HERE / "rebuild"
MODEL_PAGE = "rebuild/01-instrument.page.html"
HAND_PAGES = ["rebuild/z2.html", "rebuild/case.html"]
SEAM = "rebuild/bridge.js.bak"
SERVICE = "app/app.py"


def size(rel):
    p = HERE / rel
    return len(p.read_text()) if p.exists() else 0


def hand_blocks():
    return sorted(p for p in R.glob("*-hand.*") if p.suffix in (".js", ".css"))


def service_split():
    s = (HERE / SERVICE).read_text()
    hand, on = 0, False
    for line in s.split("\n"):
        if line.startswith("# ----"):
            on = "hand-written" in line
        if on:
            hand += len(line) + 1
    return len(s), hand


def table():
    seam = size(SEAM)
    blocks = sum(len(p.read_text()) for p in hand_blocks())
    model_page_raw = size(MODEL_PAGE)
    model_page = model_page_raw - seam - blocks
    hand_pages = sum(size(p) for p in HAND_PAGES)
    svc_total, svc_hand = service_split()
    svc_model = svc_total - svc_hand

    model = model_page + svc_model
    hand = hand_pages + svc_hand + seam + blocks
    total = model + hand
    lines = [
        "    code this repository serves   %11s characters" % f"{total:,}",
        "      GLM-5.3-Flash               %11s   %.1f%%" % (f"{model:,}", 100 * model / total),
        "      not the model's             %11s   %.1f%%" % (f"{hand:,}", 100 * hand / total),
        "",
        "        the model's page, /z/rebuilt      %9s   written whole from the specs" % f"{model_page:,}",
        "        the service, app/app.py           %9s   the model's share" % f"{svc_model:,}",
        "        the page at the root              %9s   hand-written" % f"{hand_pages:,}",
        "        the service, app/app.py           %9s   hand-written blocks" % f"{svc_hand:,}",
        "        the seam and later fixes          %9s   hand-written" % f"{seam + blocks:,}",
    ]
    return "\n".join(lines), model, total


def main():
    check = "--check" in sys.argv
    new, model, total = table()
    p = HERE / "MODEL_USE.md"
    s = p.read_text()
    m = re.search(r"    (?:served page, raw|shipped code, raw|code this repository serves)"
                  r".*?(?=\n\n[^ ])", s, re.S)
    if not m:
        sys.exit("the table is not where this script expects it in MODEL_USE.md")
    line = "%s of %s characters are the model's, %.1f%%" % (f"{model:,}", f"{total:,}", 100 * model / total)
    if m.group(0).strip() == new.strip():
        print("current: " + line); return
    if check:
        print("STALE. MODEL_USE.md says:\n%s\n\nthe repository says:\n%s" % (m.group(0), new)); sys.exit(1)
    p.write_text(s[:m.start()] + new + s[m.end():])
    print("rewritten: " + line)


if __name__ == "__main__":
    main()
