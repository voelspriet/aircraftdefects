#!/usr/bin/env python3
"""Build both pages from the one instrument, so /z cannot fall behind /z/rebuilt.

They drifted for half a day: /z carried the instrument as it stood before the
rails were rebuilt, so it still showed a specimen as raw keys and gutters with
no values. Same source now, one command."""
import pathlib, re, subprocess, sys

HERE = pathlib.Path(__file__).parent
page = (HERE / "01-instrument.page.html").read_text()

# Every style block, not only the instrument's own. The desk's CSS is appended
# to the same element by the splice, and matching one comment banner copied
# the first half of it: /z had the table markup and none of its rules, so the
# table overflowed the page while /z/rebuilt was fine.
css = "\n".join(re.findall(r"<style>(.*?)</style>", page, re.S))
js  = re.search(r"<script>\n(\(function\(\)\{\n\"use strict\";.*)</script>", page, re.S).group(1)
MOUNT = '<div id="hero-root"><div id="hero"></div></div>'

# The desk below the instrument is markup, not only script: the controls, the
# starter questions and the table shell. Copying css and js alone left /z with a
# working instrument and no filters at all, which is exactly the drift this file
# exists to prevent.
a = page.index(MOUNT) + len(MOUNT)
b_ = page.index("<script>", a)
desk = page[a:b_].strip()

# The mount has to precede the script: the instrument boots at parse time with no
# readyState guard, and an element declared after it simply is not there yet.
host = (HERE / "z-host.html").read_text()
assert host.count(MOUNT) == 1 and host.index(MOUNT) < host.index("<!--INSTRUMENT-JS-->")
out = host.replace(MOUNT, MOUNT + "\n" + desk)
out = out.replace("<!--INSTRUMENT-CSS-->", "<style>\n"+css+"</style>")
out = out.replace("<!--INSTRUMENT-JS-->", "<script>\n"+js+"</script>")
(HERE / "z-built.html").write_text(out)

for local, remote in [("01-instrument.page.html", "rebuilt.html"), ("z-built.html", "index.html")]:
    subprocess.run(["scp", "-q", str(HERE/local),
                    "root@148.251.82.253:/opt/sdrz/static/"+remote], check=True)
    print("  %-26s -> /opt/sdrz/static/%s" % (local, remote))
