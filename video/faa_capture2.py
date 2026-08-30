#!/usr/bin/env python3
"""The government's own site, recorded as it is: the query form, the two rows on N704AL,
a wider query on the 737-9 in January 2024, and one record's coded detail."""
import base64, os, shutil, subprocess, time
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'cap4'); RW, RH = 2400, 1350
class Rec:
    def __init__(self, pw, name):
        self.name = name; self.ctx = pw.chromium.launch().new_context(viewport={'width': RW, 'height': RH}); self.pg = self.ctx.new_page()
        self.dir = os.path.join(OUT, name + '_frames'); shutil.rmtree(self.dir, ignore_errors=True); os.makedirs(self.dir); self.frames = []; self.t0 = time.time(); self.log = []
        self.cdp = self.ctx.new_cdp_session(self.pg)
        def on_frame(ev):
            open(os.path.join(self.dir, 'f%05d.png' % len(self.frames)), 'wb').write(base64.b64decode(ev['data'])); self.frames.append(time.time() - self.t0)
            try: self.cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
            except Exception: pass
        self.cdp.on('Page.screencastFrame', on_frame); self.start()
    def start(self):
        try: self.cdp.send('Page.startScreencast', {'format': 'png', 'maxWidth': RW, 'maxHeight': RH, 'everyNthFrame': 1})
        except Exception: pass
    def mark(self, w): self.log.append((round(time.time() - self.t0, 2), w)); print('  %6.2f %s' % (self.log[-1][0], w))
    def hold(self, s): self.pg.wait_for_timeout(int(s * 1000))
    def zoom2(self):
        for _ in range(8):
            try: self.pg.evaluate("document.documentElement.style.zoom='2';document.documentElement.style.scrollBehavior='smooth'"); return
            except Exception: self.hold(0.8)
    def close(self):
        end = time.time() - self.t0
        try: self.cdp.send('Page.stopScreencast')
        except Exception: pass
        self.ctx.close(); lst = os.path.join(self.dir, 'list.txt')
        with open(lst, 'w') as f:
            for i, t in enumerate(self.frames):
                nxt = self.frames[i + 1] if i + 1 < len(self.frames) else end; f.write("file 'f%05d.png'\nduration %.4f\n" % (i, max(0.001, nxt - t)))
            if self.frames: f.write("file 'f%05d.png'\n" % (len(self.frames) - 1))
        out = os.path.join(OUT, self.name + '.mp4')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', out], check=True)
        shutil.rmtree(self.dir, ignore_errors=True); print('->', out, len(self.frames), 'frames'); return out
P = 'ctl00_pageContentPlaceHolder_'
with sync_playwright() as pw:
    r = Rec(pw, 'faa2')
    r.pg.goto('https://sdrs.faa.gov/Query.aspx', wait_until='domcontentloaded', timeout=60000); r.zoom2(); r.start(); r.hold(1.5); r.mark('form')
    r.pg.fill('#' + P + 'tbAircraftManufacturer', 'BOEING'); r.hold(0.3)
    r.pg.fill('#' + P + 'tbDifficultyDateFrom', '01/02/2024'); r.pg.fill('#' + P + 'tbDifficultyDateTo', '01/09/2024'); r.hold(0.6); r.mark('filled')
    r.pg.click('#' + P + 'btnQuery')
    try: r.pg.wait_for_load_state('networkidle', timeout=90000)
    except Exception: pass
    r.hold(1.5); r.zoom2(); r.start(); r.hold(1.2); r.mark('results')
    try: print('rows', r.pg.evaluate("document.querySelectorAll('table tr').length"), r.pg.evaluate("(document.body.innerText.match(/returned [0-9,]+ records/)||[''])[0]"), r.pg.url)
    except Exception as e: print('rows?', str(e)[:80])
    for k in range(14):
        try: r.pg.evaluate("window.scrollBy({top:520,behavior:'smooth'})")
        except Exception: pass
        r.hold(0.9)
    r.mark('scrolled')
    link = r.pg.locator('a:has-text("ASAA2024010547162")').first
    if link.count() == 0:
        r.pg.goto('https://sdrs.faa.gov/Query.aspx', wait_until='domcontentloaded', timeout=60000); r.zoom2(); r.start(); r.hold(0.8)
        r.pg.fill('#' + P + 'tbRegistrationNumber', '704AL'); r.pg.click('#' + P + 'btnQuery')
        try: r.pg.wait_for_load_state('networkidle', timeout=60000)
        except Exception: pass
        r.hold(1.0); r.zoom2(); r.start(); r.hold(1.2); r.mark('n704al')
        link = r.pg.locator('a:has-text("ASAA2024010547162")').first
    link.scroll_into_view_if_needed(); r.hold(0.8); link.click()
    try: r.pg.wait_for_load_state('networkidle', timeout=60000)
    except Exception: pass
    r.hold(1.0); r.zoom2(); r.start(); r.hold(1.5); r.mark('detail')
    r.pg.screenshot(path=os.path.join(OUT, 'faa_detail.png'))
    for k in range(6):
        try: r.pg.evaluate("window.scrollBy({top:400,behavior:'smooth'})")
        except Exception: pass
        r.hold(1.3)
    r.mark('end'); out = r.close()
    import json; json.dump(r.log, open(os.path.join(OUT, 'faa2.json'), 'w'))
