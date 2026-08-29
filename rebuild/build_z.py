#!/usr/bin/env python3
"""Build both pages from the one instrument, so /z cannot fall behind /z/rebuilt.

They drifted for half a day: /z carried the instrument as it stood before the
rails were rebuilt, so it still showed a specimen as raw keys and gutters with
no values. Same source now, one command."""
import pathlib, re, subprocess, sys

HERE = pathlib.Path(__file__).parent
page = (HERE / "01-instrument.page.html").read_text()

css = re.search(r"<style>\n(/\* -+\n   the instrument's clothes.*?)</style>", page, re.S).group(1)
js  = re.search(r"<script>\n(\(function\(\)\{\n\"use strict\";.*)</script>", page, re.S).group(1)
MOUNT = '<div id="hero-root"><div id="hero"></div></div>'

# The mount has to precede the script: the instrument boots at parse time with no
# readyState guard, and an element declared after it simply is not there yet.
host = (HERE / "z-host.html").read_text()
assert host.count(MOUNT) == 1 and host.index(MOUNT) < host.index("<!--INSTRUMENT-JS-->")
out = host.replace("<!--INSTRUMENT-CSS-->", "<style>\n"+css+"</style>")
out = out.replace("<!--INSTRUMENT-JS-->", "<script>\n"+js+"</script>")
(HERE / "z-built.html").write_text(out)

for local, remote in [("01-instrument.page.html", "rebuilt.html"), ("z-built.html", "index.html")]:
    subprocess.run(["scp", "-q", str(HERE/local),
                    "root@148.251.82.253:/opt/sdrz/static/"+remote], check=True)
    print("  %-26s -> /opt/sdrz/static/%s" % (local, remote))
