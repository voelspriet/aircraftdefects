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
        site = url.split("/z/")[0].rstrip("/")
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
        # getBoundingClientRect() on an inline element that wraps returns the
        # union of its line boxes. A link running over three lines therefore
        # reports a rectangle spanning the whole column, and every neighbour on
        # those lines reads as an overlap. That is what failed here on 31 August:
        # "hover flight over attitude and heading reference", two links in one
        # paragraph that do not touch. getClientRects() returns one box per line,
        # which is what a reader actually sees.
        ov = pg.evaluate("""()=>{const t=[...document.querySelectorAll('body *')]
            .filter(e=>e.children.length===0&&(e.innerText||'').trim());
          const boxes=t.map(e=>[...e.getClientRects()].filter(r=>r.width>0&&r.height>0));
          const out=[];
          for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){
            let hit=false;
            for(const a of boxes[i]){for(const b of boxes[j]){
              if(a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2){hit=true;break}}
              if(hit)break}
            if(hit)out.push(((t[i].innerText||'').trim().slice(0,24))+' over '+((t[j].innerText||'').trim().slice(0,24)));}
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

        # ---- 42: the report a record opens ----------------------------------
        # This block used to click "Click to open the full report" and then test
        # inert, aria-hidden, focus, wheel and Escape on an in-page #case-box.
        # The sheet became a page of its own at /case/<control number>, so from
        # then on every one of those checks was testing markup the site no longer
        # has: eight sub-checks that could only fail, on a site that worked. The
        # promise is unchanged and is tested where it now lives. A record in a
        # selection opens its own report, the report names the record it came
        # from, and it offers the way back.
        sheet_faults = []
        pg.goto(f"{site}/z/?tail=617FE", wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(5000)
        rec = pg.locator("tr.rec[data-case]").first
        if rec.count() == 0:
            sheet_faults.append("a tail selection lists no records to open")
        else:
            cid = rec.get_attribute("data-case")
            rec.click()
            pg.wait_for_timeout(5000)
            if "/case/" not in pg.url:
                sheet_faults.append("clicking a record opened nothing")
            body = pg.evaluate("()=>document.body.innerText||''")
            if cid and cid not in body:
                sheet_faults.append(f"the report does not name {cid}")
            if not pg.evaluate("""()=>[...document.querySelectorAll('a')]
                  .some(a=>/back to your selection/i.test(a.innerText||''))"""):
                sheet_faults.append("no way back to the selection")
        c.add("a record opens its own report", not sheet_faults,
              "; ".join(sheet_faults) if sheet_faults
              else "a record on N617FE opened, named itself and offered the way back")

        # ---- 43: focus ring, duplicate ids, backgrounds ---------------------
        pg.goto(url, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(2500)
        # This read .mo:focus-visible out of the stylesheet. There is no .mo on
        # the page any more, so the rule was absent and the check failed while
        # every control on the page was in fact keeping its ring. Tab through the
        # first controls and measure what the browser actually paints: an outline
        # of style auto, or any outline with width, or a focus shadow.
        no_ring = []
        for _ in range(10):
            pg.keyboard.press("Tab")
            st = pg.evaluate("""()=>{const a=document.activeElement;
                if(!a||a===document.body)return null;const s=getComputedStyle(a);
                return {who:(a.innerText||a.getAttribute('aria-label')||a.tagName).trim().slice(0,20),
                        style:s.outlineStyle, width:parseFloat(s.outlineWidth)||0, shadow:s.boxShadow};}""")
            if not st:
                continue
            visible = (st["style"] == "auto" or (st["style"] != "none" and st["width"] >= 1)
                       or (st["shadow"] and st["shadow"] != "none"))
            if not visible:
                no_ring.append(st["who"])
        c.add("focused controls keep a visible ring", not no_ring,
              "no ring on: " + ", ".join(no_ring[:3]) if no_ring else "10 controls tabbed")

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
        # Run on three pages, not one. Landing-page-only was how "×", "clear all,
        # back to the start" and "Show 25 more" stayed 14 to 20px unnoticed: they
        # exist only once a selection does. The back link on a view was worse, at
        # 16px with no styling at all, because its rule read ".view .back" and the
        # link is appended beside div.view, not inside it.
        tiny = []
        for _page in ("/z/", "/z/?tail=617FE", "/z/#view=both"):
            pg.goto(f"{site}{_page}", wait_until="networkidle", timeout=60000)
            pg.wait_for_timeout(3500)
            tiny += pg.evaluate("""()=>[...document.querySelectorAll('a[href],button,[role=tab]')]
            .filter(e=>{
              const p=e.parentElement; if(!p)return true;
              const inSentence = /^(P|LI|SPAN|SMALL|EM|STRONG|LABEL)$/.test(p.tagName)
                && (p.innerText||'').trim().length > (e.innerText||'').trim().length + 20;
              return !inSentence;})
            .map(e=>({t:(e.innerText||'').trim().slice(0,18),h:+e.getBoundingClientRect().height.toFixed(1)}))
            .filter(o=>o.h>0&&o.h<24)""")
        c.add("every control is at least 24px tall", not tiny,
              f"{len(tiny)} under 24px, e.g. " + ", ".join(f"{o['t']!r} {o['h']}px" for o in tiny[:3]) if tiny else "")

        # ---- 44: numbers the page publishes ---------------------------------
        # A range that runs backwards is the one thing the project's own
        # specification names as unprintable, and the airframe page printed one
        # for every multi-year tail: the dates are MM/DD/YYYY and were ordered as
        # strings, so the earliest was whatever began "01/". Screen-equals-endpoint
        # could not see it, because the endpoint was wrong too.
        import datetime as _dt
        def _d(s):
            try: return _dt.datetime.strptime(s, "%m/%d/%Y")
            except Exception: return None
        bad_range, bad_hours = [], []
        for _t in ("N617FE", "N373UP", "N842FD"):
            a = pg.evaluate("t=>fetch('api/airframe/'+t).then(r=>r.json())", _t)
            f, l = _d(a.get("first") or ""), _d(a.get("last") or "")
            if f and l and f > l:
                bad_range.append(f"{_t} {a['first']} -> {a['last']}")
            rp = pg.evaluate("t=>fetch('api/repeats/'+t).then(r=>r.json())", _t)
            for g in (rp.get("groups") or []):
                h = g.get("hours_between")
                if isinstance(h, (int, float)) and h < 0:
                    bad_hours.append(f"{_t} {g.get('part')} {h}")
        c.add("no published range runs backwards", not bad_range, "; ".join(bad_range[:3]))
        c.add("no published duration is negative", not bad_hours, "; ".join(bad_hours[:3]))

        # --- 44: dates ordered as dates, not as strings ---------------------
        # Found on 30 August: /z/api/airframe sorted MM/DD/YYYY as text, so the
        # smallest was whatever began 01/ and the largest whatever began 12/,
        # whatever the year. N617FE printed "first filed 01/04/2002 · last filed
        # 12/24/2001" against a true span of 11 Dec 1995 to 26 Aug 2026, and the
        # repeat rows carried durations like -13,716 hours. Five of five airframes
        # were backwards; 16 of 109 repeat rows were negative. The screen matched
        # the endpoint character for character, so only the records the same
        # response carries could show it.
        # urllib over https fails on this machine without an explicit certifi
        # context: CERTIFICATE_VERIFY_FAILED, unable to get local issuer. It
        # raises per request, so a bare try/except makes every airframe skip and
        # the check passes having examined nothing.
        import json as _json, datetime as _dt, urllib.request as _rq
        import ssl as _ssl, certifi as _certifi
        _ctx = _ssl.create_default_context(cafile=_certifi.where())
        backwards, wrong, checked = [], [], 0
        for tail in ("N617FE", "N373UP", "N842FD", "N947FD", "N360FE"):
            try:
                with _rq.urlopen(f"{site}/z/api/airframe/{tail}", timeout=30, context=_ctx) as r:
                    d = _json.load(r)
            except Exception:
                continue
            f, l = d.get("first"), d.get("last")
            def _p(s):
                try: return _dt.datetime.strptime(s, "%m/%d/%Y")
                except Exception: return None
            ds = [x for x in (_p(r.get("date")) for r in d.get("records", [])) if x]
            if not (f and l and ds):
                continue
            checked += 1
            pf, pl = _p(f), _p(l)
            if pf and pl and pf > pl:
                backwards.append(f"{tail} {f} -> {l}")
            if pf != min(ds) or pl != max(ds):
                wrong.append(f"{tail} shows {f}->{l}, true {min(ds):%m/%d/%Y}->{max(ds):%m/%d/%Y}")
        # A check that examined nothing must fail. Passing on checked==0 is the
        # false pass this gate exists to prevent, and it happened here first.
        c.add("no date range runs backwards", checked > 0 and not backwards,
              (f"{len(backwards)}/{checked} airframes: " + "; ".join(backwards[:3])) if backwards
              else (f"{checked} airframes checked" if checked else "EXAMINED NOTHING"))
        c.add("the date range matches the records", checked > 0 and not wrong,
              "; ".join(wrong[:2]) if wrong
              else (f"{checked} airframes checked" if checked else "EXAMINED NOTHING"))

        # "· hours between first and last" was on the airframe page when this
        # check was written and is not printed anywhere now, so from then on the
        # check examined nothing and failed itself by its own rule, which was the
        # right behaviour: a check with no subject must not pass quietly. The
        # fault it guarded, a number that does not print, is guarded here instead
        # across the pages that publish numbers. NaN, undefined, null and a bare
        # ellipsis where a figure belongs are all the same bug to a reader.
        blank_numbers = []
        for _page in ("/z/", "/z/?tail=617FE", "/z/?operator=SWAA", "/z/#view=both"):
            try:
                pg.goto(f"{site}{_page}", wait_until="networkidle", timeout=60000)
                pg.wait_for_timeout(4000)
            except Exception:
                blank_numbers.append(f"{_page}: would not load"); continue
            bad = pg.evaluate("""()=>{const t=document.body.innerText||'';
                const out=[];
                (t.match(/[^\\n]{0,30}\\b(NaN|undefined|null)\\b[^\\n]{0,20}/g)||[]).forEach(m=>out.push(m.trim()));
                (t.match(/(…|\\.\\.\\.)\\s*(reports|aircraft|records)\\b/g)||[]).forEach(m=>out.push(m.trim()));
                return [...new Set(out)].slice(0,3);}""")
            blank_numbers += [f"{_page}: {b}" for b in bad]
        c.add("no number prints as NaN, undefined or an ellipsis",
              not blank_numbers, "; ".join(blank_numbers[:3]) if blank_numbers
              else "4 pages read")

        # --- filtered pages -------------------------------------------------
        # Everything above this ran on the landing page, where the group label is
        # correct. On a filtered page it is not: with operator=SWAA it printed
        # "EACH ANSWERS FROM ALL 244,532 REPORTS", which is Southwest's filtered
        # total, inside a sentence promising it ignores the selection. With a zone
        # filter the number was a literal ellipsis. A harness that only ever loads
        # one URL cannot see either.
        # The page carried a label reading "EACH ANSWERS FROM ALL n REPORTS", and
        # under a filter it printed the filtered total inside a sentence promising
        # it ignored the filter. That label and its .vglab class are gone. The
        # sentence that replaced it makes the same promise in a form that can be
        # checked by arithmetic: "n reports, where on the aircraft they were
        # found. m set aside." Those two numbers must always sum to the whole
        # file, whatever is selected. If a filtered total ever leaks into the
        # second half, the sum stops matching and this says so.
        CORPUS_N = 1757827
        import re as _re
        sum_faults = []
        for _q, _name in (("?operator=SWAA", "airline"), ("?zone=ZONE+700", "zone"),
                          ("?tail=617FE", "tail")):
            try:
                pg.goto(f"{site}/z/{_q}", wait_until="networkidle", timeout=60000)
                pg.wait_for_timeout(4500)
            except Exception:
                sum_faults.append(f"{_name}: page would not load"); continue
            h1 = pg.evaluate("()=>{const h=document.querySelector('h1');return h?(h.innerText||''):''}")
            sel_m = _re.search(r"([\d,]+) reports", h1)
            set_m = _re.search(r"([\d,]+) set aside", h1)
            if not (sel_m and set_m):
                sum_faults.append(f"{_name}: the standing sentence is missing a number")
                continue
            a = int(sel_m.group(1).replace(",", "")); b = int(set_m.group(1).replace(",", ""))
            if a + b != CORPUS_N:
                sum_faults.append(f"{_name}: {a:,} + {b:,} = {a + b:,}, not {CORPUS_N:,}")
        c.add("the standing sentence still adds up to the whole file",
              not sum_faults, "; ".join(sum_faults) if sum_faults
              else "airline, zone and tail selections add up")

        # --- the state a CLICK produces ---------------------------------------
        # Every check above loads a URL and inspects the result. None of them
        # clicked something and then looked at what a reader sees. Henk found in
        # five minutes what 27 of them missed: clicking a zone leaves "No rows
        # yet, on purpose" on screen while the results load underneath, so nine
        # working features read as dead. Loading the same URL fresh is clean, so
        # only a click can find it.
        click_faults = []
        # The legend rows this clicked, class .lrow, named zones in words. The
        # page groups by ATA system now and the rows are bars carrying data-k=ata,
        # so the old selector matched nothing and reported three missing rows on a
        # page where all three work. Same test, current markup: click a bar and a
        # reader must end up with a smaller selection that says so, never an empty
        # state sitting over results that did load.
        pg.goto(f"{site}/z/", wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(3500)
        bars = pg.evaluate("""()=>[...document.querySelectorAll('[data-k=ata][data-v]')]
            .slice(0,3).map(e=>[e.dataset.v,(e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,24)])""")
        if len(bars) < 3:
            click_faults.append(f"only {len(bars)} system bars on the page")
        for _v, _label in bars:
            try:
                pg.goto(f"{site}/z/", wait_until="networkidle", timeout=60000)
                pg.wait_for_timeout(3000)
                bar = pg.locator(f"[data-k=ata][data-v='{_v}']").first
                bar.scroll_into_view_if_needed(timeout=5000)
                bar.click(timeout=6000)
                pg.wait_for_timeout(4000)
            except Exception:
                click_faults.append(f"{_label}: click failed"); continue
            st = pg.evaluate("""()=>{const h=document.querySelector('h1');
                const t=(h&&h.innerText)||'';const m=t.match(/([\\d,]+) reports/);
                const empty=[...document.querySelectorAll('p,div')].find(e=>
                  /no rows yet|nothing chosen yet/i.test(e.innerText||'')
                  && e.getClientRects().length);
                return {n:m?m[1]:null, rows:document.querySelectorAll('tr.rec').length,
                        empty:empty?(empty.innerText||'').trim().slice(0,40):null};}""")
            if not st["n"]:
                click_faults.append(f"{_label}: click produced no count")
            elif st["empty"] and st["rows"]:
                click_faults.append(f"{_label}: says '{st['empty']}' while showing {st['rows']} records")
        c.add("clicking a system does not show a false empty state",
              not click_faults, "; ".join(click_faults[:3]) if click_faults
              else f"{len(bars)} systems clicked")

        # A sticky bar must not lie across a control the reader can press.
        over = pg.evaluate("""()=>{const out=[];
            document.querySelectorAll('*').forEach(s=>{
              let cs; try{cs=getComputedStyle(s)}catch(e){return}
              if(cs.position!=='sticky'&&cs.position!=='fixed')return;
              const b=s.getBoundingClientRect(); if(b.height<8||b.width<40)return;
              if(b.top<0||b.top>innerHeight)return;   // not on screen: cannot cover anything
              document.querySelectorAll('button,a[href],input,select').forEach(c=>{
                if(s.contains(c)||c.contains(s))return;
                const r=c.getBoundingClientRect(); if(!(r.width>0&&r.height>0))return;
                if(!((c.innerText||c.value||'').trim()))return;  // an unlabelled hit box is not a control a reader sees
                if(r.left<b.right-2&&b.left<r.right-2&&r.top<b.bottom-2&&b.top<r.bottom-2)
                  out.push(((s.className||'').toString().split(' ')[0]||s.tagName.toLowerCase())
                           +' lies across "'+((c.innerText||c.value||'').trim().slice(0,26))+'"');});});
            return [...new Set(out)].slice(0,4);}""")
        c.add("no sticky bar lies across a control", not over, "; ".join(over))

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
