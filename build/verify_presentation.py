#!/usr/bin/env python3
"""Drive the page and check what briefs 42 and 43 say must be true afterwards.

Every fault these briefs describe fails in silence. There are no console errors on
either page, the server answers correctly for all of them, and a check that reads
the DOM once passes them all. The only thing that sees them is a browser being
driven: a click that lands, a hover that moves nothing, a number that prints in
full.

    python3 build/verify_presentation.py                      # the live /z
    python3 build/verify_presentation.py --url http://...     # a local build
    python3 build/verify_presentation.py --parent             # the parent, as a control

Exit 0 when every check passes. Exit 1 otherwise, naming what failed.

Four traps are already accounted for here, each of which cost a wrong answer on
30 August:

  - both pages mutate 1-3 times a second at rest, so "the DOM changed" is not
    evidence that a click did anything. The dead-control check measures a
    specific consequence instead.
  - 900ms is too short a wait: the Patterns tab looks dead at 900ms and works at
    three seconds.
  - a handler whose only effect is window.scrollTo produces no mutation, no
    request and no navigation. Scroll position is measured too.
  - a submit control clicked with an empty field is meant to do nothing.
"""
import sys, json
from playwright.sync_api import sync_playwright

Z = "https://aircraftdefects.com/z/"
PARENT = "https://aircraftdefects.com/"


class Checks:
    def __init__(self):
        self.rows = []

    def add(self, name, ok, detail=""):
        self.rows.append((name, bool(ok), detail))

    def report(self):
        width = max(len(n) for n, _, _ in self.rows)
        failed = 0
        for name, ok, detail in self.rows:
            mark = "pass" if ok else "FAIL"
            if not ok:
                failed += 1
            print(f"  {mark}  {name.ljust(width)}   {detail}")
        print()
        if failed:
            print(f"{failed} of {len(self.rows)} checks failed.")
        else:
            print(f"all {len(self.rows)} checks pass.")
        return 1 if failed else 0


def run(url, is_parent=False):
    c = Checks()
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(viewport={"width": 1440, "height": 900})
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
        pg.on("console", lambda m: errs.append("console: " + m.text[:140])
              if m.type == "error" else None)
        pg.goto(url, wait_until="networkidle", timeout=90000)
        pg.wait_for_timeout(3000)

        # ---- 43: nothing is ellipsised -------------------------------------
        ell = pg.evaluate("""()=>[...document.querySelectorAll('*')].filter(e=>{
            try{const s=getComputedStyle(e);
              return s.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1&&e.clientWidth>0}
            catch(x){return false}})
          .map(e=>({t:(e.innerText||'').trim().slice(0,40),c:e.clientWidth,s:e.scrollWidth}))""")
        c.add("no text is cut off at 1440px", not ell,
              "" if not ell else "; ".join(f"{e['t']!r} {e['c']}px box / {e['s']}px text" for e in ell[:3]))

        # ---- 43: no text overlaps a button ---------------------------------
        ov = pg.evaluate("""()=>{const t=[...document.querySelectorAll('body *')]
            .filter(e=>e.children.length===0&&(e.innerText||'').trim());
          const out=[];
          for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){
            const a=t[i].getBoundingClientRect(),b=t[j].getBoundingClientRect();
            if(!a.width||!b.width)continue;
            if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2)
              out.push(((t[i].innerText||'').trim().slice(0,24))+' over '+((t[j].innerText||'').trim().slice(0,24)));}
          return out.slice(0,4);}""")
        c.add("no text overlaps another element", not ov, "; ".join(ov))

        # ---- 43: hovering moves nothing ------------------------------------
        # Positions are taken document-relative, not viewport-relative. A
        # getBoundingClientRect() comparison counts any scroll as every element
        # moving at once, which reported a phantom 485px shift on 30 August: the
        # page had scrolled between samples and nothing had reflowed at all.
        pg.evaluate("""()=>{window.__r=[...document.querySelectorAll('h1,h2,p,div,span,button,a,b')]
            .filter(e=>{const r=e.getBoundingClientRect();return r.width>20&&r.height>6}).slice(0,900);
          window.__s=()=>{const sx=window.scrollX,sy=window.scrollY;
            return window.__r.map(e=>{const r=e.getBoundingClientRect();
              return [r.left+sx,r.top+sy]});};}""")
        shifted, worst = 0, 0.0
        targets = pg.evaluate("""()=>{const out=[];const seen=new Set();
            const cand=new Set([...document.querySelectorAll('a,button,[data-take],[data-aim],[role=tab]')]);
            document.querySelectorAll('*').forEach(e=>{try{if(getComputedStyle(e).cursor==='pointer')cand.add(e)}catch(x){}});
            let i=0;
            cand.forEach(el=>{const r=el.getBoundingClientRect();
              if(!(r.width>0&&r.height>0)||r.top<0||r.top>2400)return;
              const k=el.tagName+'|'+((el.className||'').toString())+'|'+(el.innerText||'').trim().slice(0,12);
              if(seen.has(k))return;seen.add(k);
              out.push([Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)]);i++;});
            return out.slice(0,140);}""")
        base = pg.evaluate("window.__s()")
        for x, y in targets:
            try:
                pg.evaluate("window.scrollTo(0,0)")
                pg.wait_for_timeout(60)
                pg.mouse.move(x, y)
                pg.wait_for_timeout(200)
                after = pg.evaluate("window.__s()")
                # Count only OTHER nodes moving. A control restyling itself on
                # hover (a border, an underline) is not a layout shift, and
                # counting it reported a phantom 485px on 30 August that did not
                # reproduce in isolation. A reflow moves its neighbours; require
                # at least two nodes so one element's own hover style cannot
                # fail the check.
                moved = [max(abs(a[0] - b[0]), abs(a[1] - b[1]))
                         for a, b in zip(base, after)
                         if max(abs(a[0] - b[0]), abs(a[1] - b[1])) > 1.5]
                if len(moved) >= 2:
                    shifted += 1
                    worst = max(worst, max(moved))
                pg.mouse.move(3, 3)
                pg.wait_for_timeout(140)
                base = pg.evaluate("window.__s()")
            except Exception:
                pass
        c.add("hovering shifts no layout", shifted == 0,
              f"{shifted} of {len(targets)} controls shift the page, worst {worst:.1f}px")

        # ---- 42: the case sheet ---------------------------------------------
        link = pg.locator("text=Click to open the full report").first
        if link.count() == 0:
            c.add("case sheet reachable", False, "no 'open the full report' link found")
        else:
            link.click()
            pg.wait_for_timeout(3000)
            inert = pg.evaluate("""()=>[...document.querySelectorAll('[inert]')]
                .map(e=>e.tagName+(e.id?'#'+e.id:''))""")
            sheet_inert = pg.evaluate("""()=>{const b=document.getElementById('case-box');
                if(!b)return 'no #case-box';let e=b;
                while(e){if(e.inert)return e.tagName+(e.id?'#'+e.id:'');e=e.parentElement}
                return null;}""")
            c.add("the sheet itself is not inert", sheet_inert is None,
                  f"inert ancestor: {sheet_inert}" if sheet_inert else f"[inert]={len(inert)} elements, none containing the sheet")
            c.add("the page behind IS inert", any("MAIN" in i for i in inert),
                  "MAIN.wrap must be inert while the sheet is open")

            # inert was only half of what the page sets. setSiblings also writes
            # aria-hidden="true", and a repair that clears one and not the other
            # leaves a sheet that is fully operable by mouse and invisible to
            # every screen reader, with role="dialog" aria-modal="true" inside it.
            # Every visual check on this page would pass. This one would not.
            aria = pg.evaluate("""()=>{const w=document.getElementById('case-wrap'),
                  b=document.getElementById('case-box'),m=document.querySelector('main');
                return {wrap:w&&w.getAttribute('aria-hidden'), box:b&&b.getAttribute('aria-hidden'),
                        main:m&&m.getAttribute('aria-hidden')};}""")
            c.add("the sheet is not aria-hidden",
                  aria.get("wrap") is None and aria.get("box") is None,
                  f"case-wrap aria-hidden={aria.get('wrap')}, case-box aria-hidden={aria.get('box')}")
            c.add("the page behind IS aria-hidden", aria.get("main") == "true",
                  f"main aria-hidden={aria.get('main')}")

            hit = pg.evaluate("""()=>{const b=[...document.querySelectorAll('#case-box button')]
                  .find(x=>/close/i.test(x.innerText));
                if(!b)return 'no Close button';
                const r=b.getBoundingClientRect();
                const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
                return h===b?null:(h?h.tagName:'null');}""")
            c.add("Close is the topmost element at its own centre", hit is None,
                  f"elementFromPoint returns {hit}" if hit else "")

            focus_in = pg.evaluate("""()=>{const b=document.getElementById('case-box');
                return !!(b&&b.contains(document.activeElement));}""")
            c.add("opening moves focus into the sheet", focus_in)

            wrap = pg.evaluate("""()=>{const w=document.getElementById('case-wrap');
                return w?{sh:w.scrollHeight,ch:w.clientHeight,st:w.scrollTop}:null}""")
            if wrap and wrap["sh"] > wrap["ch"] + 2:
                y0 = pg.evaluate("window.scrollY")
                pg.mouse.move(720, 450)
                pg.mouse.wheel(0, 500)
                pg.wait_for_timeout(900)
                st = pg.evaluate("()=>document.getElementById('case-wrap').scrollTop")
                y1 = pg.evaluate("window.scrollY")
                c.add("the wheel scrolls the sheet, not the page", st > 0 and y1 == y0,
                      f"case-wrap.scrollTop {st}, window.scrollY {y0}->{y1}")
            else:
                c.add("the wheel scrolls the sheet, not the page", True, "sheet fits, nothing to scroll")

            pg.keyboard.press("Escape")
            pg.wait_for_timeout(1200)
            closed = pg.evaluate("""()=>{const b=document.getElementById('case-box');
                return !b||getComputedStyle(b).display==='none'||!b.classList.contains('open');}""")
            c.add("Escape closes the sheet", closed)
            if not closed:
                pg.evaluate("""()=>{const b=[...document.querySelectorAll('#case-box button')]
                    .find(x=>/close/i.test(x.innerText));if(b)b.click()}""")
                pg.wait_for_timeout(1000)
            left = pg.evaluate("()=>document.querySelectorAll('[inert]').length")
            c.add("closing clears every inert flag", left == 0, f"{left} still inert")

        # ---- 43: focus ring, duplicate ids, backgrounds ---------------------
        pg.goto(url, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(2500)
        ring = pg.evaluate("""()=>{const m=document.querySelector('.mo');if(!m)return 'no .mo';
            m.classList.add('__probe');const s=getComputedStyle(m);m.classList.remove('__probe');
            return null;}""")
        outline = pg.evaluate("""()=>{const s=[...document.styleSheets];let found=null;
            for(const sh of s){let rs;try{rs=sh.cssRules}catch(e){continue}
              for(const r of rs||[]){if(r.selectorText&&/\\.mo:focus-visible/.test(r.selectorText))
                found=r.style.outline||r.style.outlineWidth||found;}}
            return found;}""")
        c.add(".mo:focus-visible keeps a ring",
              bool(outline) and outline not in ("none", "0", "0px"),
              f"outline: {outline!r}")

        dupes = pg.evaluate("""()=>{const seen={},d=[];
            document.querySelectorAll('[id]').forEach(e=>{seen[e.id]=(seen[e.id]||0)+1});
            for(const k in seen)if(seen[k]>1)d.push(k+' x'+seen[k]);return d;}""")
        c.add("no duplicate ids", not dupes, ", ".join(dupes))

        # The fault was two different paper colours both painted: html #f2eee6
        # against body #f7f5f0. A transparent root is the correct idiom, not a
        # failure - the body's background propagates to the canvas and the reader
        # sees one colour. So accept transparent; reject two opaque colours that
        # disagree. Requiring literal equality would have failed the right fix.
        bg = pg.evaluate("""()=>[getComputedStyle(document.documentElement).backgroundColor,
                               getComputedStyle(document.body).backgroundColor]""")
        transparent = bg[0] in ("rgba(0, 0, 0, 0)", "transparent")
        c.add("the page shows one background colour", transparent or bg[0] == bg[1],
              f"html {bg[0]} vs body {bg[1]}" + ("  (root transparent, body propagates)" if transparent else ""))

        # ---- widths ---------------------------------------------------------
        for w in (1440, 1024, 768, 390):
            ctx2 = br.new_context(viewport={"width": w, "height": 900})
            p2 = ctx2.new_page()
            p2.goto(url, wait_until="networkidle", timeout=60000)
            p2.wait_for_timeout(2000)
            over = p2.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
            c.add(f"no sideways scroll at {w}px", over <= 0, f"{over}px of overflow")
            ctx2.close()

        # ---- controls that fail silently ------------------------------------
        # A link inside a running sentence is exempt, as WCAG 2.5.8 exempts it:
        # a 24px hit box around three words of prose either breaks the line or is
        # faked with padding and negative margins. The model asked this question
        # in its answer to brief 43 instead of quietly inflating them, and it was
        # the right question. A control on its own line has no such excuse.
        # Measured on a freshly loaded page. Run after the hover sweep this
        # reported 19, then 3, then 0 on a page that changed once: the sweep
        # leaves state behind and the check was reading it.
        pg.goto(url, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(2500)
        tiny = pg.evaluate("""()=>[...document.querySelectorAll('a[href],button,[role=tab]')]
            .filter(e=>{
              const p=e.parentElement; if(!p)return true;
              const inSentence = /^(P|LI|SPAN|SMALL|EM|STRONG|LABEL)$/.test(p.tagName)
                && (p.innerText||'').trim().length > (e.innerText||'').trim().length + 20;
              return !inSentence;})
            .map(e=>({t:(e.innerText||'').trim().slice(0,18),h:+e.getBoundingClientRect().height.toFixed(1)}))
            .filter(o=>o.h>0&&o.h<24)""")
        c.add("every control is at least 24px tall", not tiny,
              f"{len(tiny)} under 24px, e.g. " + ", ".join(f"{o['t']!r} {o['h']}px" for o in tiny[:3]) if tiny else "")

        c.add("no runtime errors", not errs, "; ".join(errs[:2]))
        br.close()
    return c.report()


if __name__ == "__main__":
    url = PARENT if "--parent" in sys.argv else Z
    for i, a in enumerate(sys.argv):
        if a == "--url" and i + 1 < len(sys.argv):
            url = sys.argv[i + 1]
    print(f"\ndriving {url}\n")
    sys.exit(run(url, is_parent="--parent" in sys.argv))
