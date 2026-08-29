#!/usr/bin/env python3
"""Splice a GLM block into the page, excising declarations that would collide.

The original declares helpers with const; a function declaration of the same
name in the same scope is a SyntaxError that blanks the entire script, silently
as far as the server is concerned. Learned the expensive way on 03-rails."""
import re, sys, pathlib

def tops(src):
    out={}
    for m in re.finditer(r"^(const|let|var|function)\s+([A-Za-z_$][\w$]*)", src, re.M):
        out.setdefault(m.group(2), m.group(1))
    return out

def excise(src, name):
    m = re.search(r"^function\s+%s\s*\(" % re.escape(name), src, re.M)
    if not m: return src, False
    i = src.index("{", m.end()-1); depth=0
    for j in range(i, len(src)):
        if src[j]=="{": depth+=1
        elif src[j]=="}":
            depth-=1
            if depth==0:
                return src[:m.start()] + "/* %s: already declared as a const above */\n" % name + src[j+1:], True
    return src, False

def rename_soft(js, page_body, suffix):
    """A function declared twice in one scope is not an error: the later one wins.
    Two blocks written without knowledge of each other collided on pct(), which
    means one signature silently replacing another and a rail quietly refusing to
    open, with nothing in the console. Rename the incoming one instead."""
    o = tops(page_body); renamed=[]
    for name, kind in tops(js).items():
        if kind=="function" and o.get(name)=="function":
            new = name + suffix
            js = re.sub(r"\b%s\b" % re.escape(name), new, js)
            renamed.append("%s -> %s" % (name, new))
    return js, renamed


def splice(page, js, label):
    p=pathlib.Path(page); s=p.read_text()
    body=s.split("(function(){")[1]
    o,g=tops(body),tops(js)
    fatal=[k for k in g if k in o and (o[k] in ("const","let") or g[k] in ("const","let"))]
    for k in sorted(fatal):
        js,ok=excise(js,k); print("   hard  %-16s %s" % (k,"verwijderd" if ok else "HANDMATIG"))
    js, soft = rename_soft(js, body, "_" + label.split("-")[0])
    for r in soft: print("   zacht %s" % r)
    m="\nwindow.drawInstrument=drawInstrument;\n})();"
    assert s.count(m)==1
    p.write_text(s.replace(m,"\n/* ---- %s ---- */\n"%label + js + "\n" + m))
    return len(fatal)
