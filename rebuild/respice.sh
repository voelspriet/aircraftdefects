#!/bin/bash
# one command from the model's answers to both live pages
cd "$(dirname "$0")"
cp 01-instrument.page.html.bak-05 01-instrument.page.html
python3 - <<'PY'
import pathlib, sys; sys.path.insert(0,".")
import splice, extract
page=pathlib.Path("01-instrument.page.html"); s=page.read_text()
mount='<div id="hero-root"><div id="hero"></div></div>'
B=[(f,*extract.parts(f)) for f in ["06-controls.md","07-rows.md"]]
s=s.replace(mount, mount+"\n"+"\n".join(h for _,h,_,_ in B))
i=s.rindex("</style>"); s=s[:i]+"\n"+"\n".join(c for _,_,c,_ in B)+"\n"+s[i:]
page.write_text(s)
for f,_,_,j in B: splice.splice(str(page), j, f.replace(".md",""))
m="\nwindow.drawInstrument=drawInstrument;\n})();"
s=page.read_text(); page.write_text(s.replace(m,"\n"+pathlib.Path("bridge.js").read_text()+m))
PY
python3 build_z.py
