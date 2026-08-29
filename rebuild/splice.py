#!/usr/bin/env python3
"""Splice a GLM block into the page, excising declarations that would collide.

The original declares helpers with const; a function declaration of the same
name in the same scope is a SyntaxError that blanks the entire script, silently
as far as the server is concerned. Learned the expensive way on 03-rails."""
import re, sys, pathlib

def tops(src):
    """Every name a block declares at the top of a line, including the later
    declarators of a comma-separated statement. Missing those cost a round:
    `var SUG=[],SUGI=-1,sugSeq=0` declares three names, and reading only the
    first let SUG through to collide."""
    out={}
    for m in re.finditer(r"^(const|let|var|function)\s+(.+)$", src, re.M):
        kind, rest = m.group(1), m.group(2)
        if kind == "function":
            n = re.match(r"([A-Za-z_$][\w$]*)", rest)
            if n: out.setdefault(n.group(1), kind)
            continue
        depth = 0; buf = ""
        for ch in rest:
            if ch in "([{": depth += 1
            elif ch in ")]}": depth -= 1
            if ch == "," and depth == 0:
                n = re.match(r"\s*([A-Za-z_$][\w$]*)", buf)
                if n: out.setdefault(n.group(1), kind)
                buf = ""
            else:
                buf += ch
        n = re.match(r"\s*([A-Za-z_$][\w$]*)", buf)
        if n: out.setdefault(n.group(1), kind)
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


def rename_all(js, g, o, helpers, suffix):
    """Rename every top-level name in the incoming block that the page already
    uses. A const declared twice is a SyntaxError; a function declared twice is
    worse, because the later one wins in silence and only fails at the call
    site. Both are avoided by giving the newcomer its own name."""
    renamed = []
    for name in sorted(k for k in g if k in o and k not in helpers):
        new = name + suffix
        js = re.sub(r"\b%s\b" % re.escape(name), new, js)
        renamed.append("%s -> %s" % (name, new))
    return js, renamed


def splice(page, js, label):
    p=pathlib.Path(page); s=p.read_text()
    body=s.split("(function(){")[1]
    o,g=tops(body),tops(js)
    # The page's own helpers are what an incoming block was told to use, so a
    # redefinition of one of those is dropped. Everything else that collides is
    # renamed rather than dropped: two blocks may legitimately each want their
    # own setFilter, and only one of them can have the name.
    HELPERS = ("esc","num","params","opName","el")
    for k in sorted(k for k in g if k in o and k in HELPERS):
        js,ok=excise(js,k); print("   helper %-15s %s" % (k,"verwijderd" if ok else "NIET GEVONDEN"))
    js, ren = rename_all(js, tops(js), o, HELPERS, "_" + label.split("-")[0])
    for r in ren: print("   hernoemd %s" % r)
    m="\nwindow.drawInstrument=drawInstrument;\n})();"
    assert s.count(m)==1
    p.write_text(s.replace(m,"\n/* ---- %s ---- */\n"%label + js + "\n" + m))
    return 0
