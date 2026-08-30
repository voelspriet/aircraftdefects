#!/usr/bin/env python3
"""Recount what on the page is the model's and what is not, and rewrite the table.

The share moves every time a fault is fixed by hand: 1.9% on the morning of 30
August, 2.6% by midday, 4.5% by the evening. A number that moves and is quoted in
five documents will be wrong in four of them within a day, so it is quoted in one
document and counted by this script.

    python3 build/count_provenance.py            recount and rewrite MODEL_USE.md
    python3 build/count_provenance.py --check    report drift, change nothing,
                                                 exit 1 if the table is stale

A hand-written block is any file named *-hand.* in rebuild/, plus bridge.js.bak,
which is the seam between the two halves the model built separately. Everything
else that reaches the page came back from the model.
"""
import pathlib, re, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent.parent
URL = "https://aircraftdefects.com/z/"


def hand_files():
    r = HERE / "rebuild"
    out = sorted(p for p in r.glob("*-hand.*") if p.suffix in (".js", ".css"))
    seam = r / "bridge.js.bak"
    return ([seam] if seam.exists() else []) + out


def served_size():
    p = subprocess.run(["curl", "-s", URL], capture_output=True, text=True)
    if p.returncode or not p.stdout:
        sys.exit("could not read %s, so nothing was counted" % URL)
    return len(p.stdout)


def table():
    files = hand_files()
    hand = sum(len(f.read_text()) for f in files)
    served = served_size()
    model = served - hand
    lines = [
        "    served page, raw            %11s characters" % f"{served:,}",
        "      model-written             %11s   %.1f%%" % (f"{model:,}", 100 * model / served),
        "      hand-written              %11s   %.1f%%" % (f"{hand:,}", 100 * hand / served),
    ]
    for f in files:
        lines.append("        rebuild/%-24s %9s" % (f.name, f"{len(f.read_text()):,}"))
    return "\n".join(lines), hand, served


def main():
    check = "--check" in sys.argv
    new, hand, served = table()
    p = HERE / "MODEL_USE.md"
    s = p.read_text()
    m = re.search(r"    served page, raw.*?(?=\n\n)", s, re.S)
    if not m:
        sys.exit("the table is not where this script expects it in MODEL_USE.md")
    if m.group(0).strip() == new.strip():
        print("current: %s of %s hand-written, %.1f%%" % (f"{hand:,}", f"{served:,}", 100 * hand / served))
        return
    if check:
        print("STALE. MODEL_USE.md says:\n%s\n\nthe repository says:\n%s" % (m.group(0), new))
        sys.exit(1)
    p.write_text(s[:m.start()] + new + s[m.end():])
    print("rewritten: %s of %s hand-written, %.1f%%" % (f"{hand:,}", f"{served:,}", 100 * hand / served))


if __name__ == "__main__":
    main()
