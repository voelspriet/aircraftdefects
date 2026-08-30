#!/usr/bin/env python3
"""One place that says what the page is made of, in order.

Blocks kept replacing each other because each splice was hand-written. This
lists them once: the base, then every block the model has written, then the CSS
last so it wins over the stylesheet the instrument injects at runtime."""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from extract import parts

HERE = pathlib.Path(__file__).parent
BASE   = HERE / "bridge.js.bak"          # the bridge, hand-written, joins the halves
JS     = [("17-merge.js",   "17: the instrument's setting"),
          ("19-phone.js",   "19: the phone, the stepper, the ids"),
          ("20-overlay.js", "20: the overlay, the rails, the labels"),
          ("41-dom.js",     "41: the disagreements, and the way in"),
          (("10-guidance.md", "js"), "10: how to read each panel")]
CSS    = ["18-css.css", "41-css.css"]

out = BASE.read_text()
for item, label in JS:
    if isinstance(item, tuple):
        body = parts(str(HERE / item[0]))[2]
    else:
        body = (HERE / item).read_text()
    if body.strip():
        out += "\n/* ---- %s, written by the model ---- */\n" % label + body + "\n"
for name in CSS:
    css = (HERE / name).read_text()
    out += ("\n(function(){var s=document.createElement('style');s.id='sdr-css-%s';"
            "s.textContent=`" % name.split('-')[0]
            + css.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
            + "`;document.head.appendChild(s);})();\n")
(HERE / "bridge.js").write_text(out)
print("bridge.js: %d tekens uit %d blokken" % (len(out), len(JS) + len(CSS) + 1))
