#!/usr/bin/env python3
"""Beats, recorded in real time through Chrome's screencast (lossless PNG frames, so the picture stays crisp). For every sentence the camera frames the
element the sentence is about: the page is scrolled so the element sits at the
centre, then scaled around it (CSS transform, animated), and released before
the next move. The voice for a beat starts at the mark written when the
element is framed. Dead waits (a click until the model finishes) are marked so
the build can compress them."""
import base64, json, os, shutil, subprocess, sys, time
from playwright.sync_api import sync_playwright
from beats import BEATS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cap4'); os.makedirs(OUT, exist_ok=True)
BASE = 'https://aircraftdefects.com'
W, H = 1200, 675          # page viewport
RW, RH = 2400, 1350       # recording, 2x
DUR = json.load(open(os.path.join(HERE, 'voice', 'durations.json')))

CURSOR_JS = """
(function(){if(document.getElementById('fx-cursor'))return;var c=document.createElement('div');c.id='fx-cursor';
c.style.cssText='position:fixed;left:-50px;top:-50px;width:22px;height:30px;z-index:2147483647;pointer-events:none;transition:left .55s cubic-bezier(.2,.7,.3,1),top .55s cubic-bezier(.2,.7,.3,1)';
c.innerHTML='<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2l16 13-7 1 4 9-3 1-4-9-6 5z" fill="#1c1b17" stroke="#fff" stroke-width="1.5"/></svg>';
document.documentElement.appendChild(c);
document.documentElement.style.scrollBehavior='smooth';document.documentElement.style.zoom='2';
if(document.body)document.body.style.transition='transform .7s cubic-bezier(.3,.6,.2,1)';
document.addEventListener('DOMContentLoaded',function(){document.body.style.transition='transform .7s cubic-bezier(.3,.6,.2,1)'});})();
"""
SETUP_JS = "document.documentElement.style.zoom='2';document.documentElement.style.scrollBehavior='smooth';document.body.style.transition='transform .7s cubic-bezier(.3,.6,.2,1)';"

class Shot:
    def __init__(self, pw, name):
        self.name = name
        self.ctx = pw.chromium.launch().new_context(viewport={'width': RW, 'height': RH}, device_scale_factor=1)
        self.pg = self.ctx.new_page(); self.pg.add_init_script(CURSOR_JS)
        self.dir = os.path.join(OUT, name + '_frames'); shutil.rmtree(self.dir, ignore_errors=True); os.makedirs(self.dir)
        self.frames = []; self.t0 = time.time(); self.log = []
        self.cdp = self.ctx.new_cdp_session(self.pg)
        def on_frame(ev):
            t = time.time() - self.t0; i = len(self.frames)
            open(os.path.join(self.dir, 'f%05d.png' % i), 'wb').write(base64.b64decode(ev['data'])); self.frames.append(t)
            try: self.cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
            except Exception: pass
        self.cdp.on('Page.screencastFrame', on_frame)
        self.cdp.send('Page.startScreencast', {'format': 'png', 'maxWidth': RW, 'maxHeight': RH, 'everyNthFrame': 1})
    def mark(self, what):
        self.log.append((round(time.time() - self.t0, 2), what)); print('  %6.2f %s' % (self.log[-1][0], what))
    def hold(self, s): self.pg.wait_for_timeout(int(max(0, s) * 1000))
    def goto(self, path, wait):
        self.pg.goto(BASE + path, wait_until='networkidle', timeout=120000); self.pg.evaluate(CURSOR_JS); self.pg.evaluate(SETUP_JS)
        try: self.cdp.send('Page.startScreencast', {'format': 'png', 'maxWidth': RW, 'maxHeight': RH, 'everyNthFrame': 1})
        except Exception: pass
        self.pg.wait_for_selector(wait, timeout=60000); self.hold(0.8)
    def settle(self):
        self.pg.evaluate(CURSOR_JS); self.pg.evaluate(SETUP_JS); self.hold(0.3)
        try: self.cdp.send('Page.startScreencast', {'format': 'png', 'maxWidth': RW, 'maxHeight': RH, 'everyNthFrame': 1})
        except Exception: pass
    # ---- camera ----
    def unzoom(self, hold=0.8):
        self.pg.evaluate("document.body.style.transform='scale(1)'"); self.hold(hold)
    def centre(self, sel, nth=0, hold=0.55):
        self.pg.evaluate("(a)=>{var e=document.querySelectorAll(a[0])[a[1]];if(e)e.scrollIntoView({block:'center',behavior:'smooth'})}", [sel, nth]); self.hold(hold)
    def zoom(self, sel, scale=1.6, nth=0, hold=0.75):
        """Scroll the element to the centre, then scale the page around it."""
        self.unzoom(0.75); self.centre(sel, nth)
        self.pg.evaluate("(a)=>{var e=document.querySelectorAll(a[0])[a[1]];if(!e)return;var r=e.getBoundingClientRect();var z=parseFloat(document.documentElement.style.zoom||1);var vw=window.innerWidth,vh=window.innerHeight;var cx=r.left+Math.min(r.width,900)/2,cy=r.top+Math.min(r.height,vh*0.8)/2;var b=document.body.getBoundingClientRect();var ox=(cx-b.left)/z,oy=(cy-b.top)/z;var dx=(vw/2-cx)/z,dy=(vh/2-cy)/z;document.body.style.transformOrigin=ox+'px '+oy+'px';document.body.style.transform='translate('+dx+'px,'+dy+'px) scale('+a[2]+')'}", [sel, nth, scale])
        self.hold(hold)
    def cursor_to(self, sel, nth=0, hold=0.7):
        r = self.pg.evaluate("(a)=>{var e=document.querySelectorAll(a[0])[a[1]];if(!e)return null;var r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}", [sel, nth])
        if not r: return None
        x, y = r[0] + min(r[2] / 2, 280), r[1] + r[3] / 2      # device px
        self.pg.evaluate("(p)=>{var c=document.getElementById('fx-cursor');c.style.left=(p[0]/2)+'px';c.style.top=(p[1]/2)+'px'}", [x, y]); self.hold(hold); return x, y
    def click(self, sel, nth=0, what=None, js=False):
        self.centre(sel, nth, 0.8); p = self.cursor_to(sel, nth)
        if js or not p: self.pg.locator(sel).nth(nth).dispatch_event('click')
        else: self.pg.mouse.click(*p)
        self.mark('click ' + (what or sel)); self.hold(0.3)
    def wait_done(self, scope, count=1, timeout=300000):
        self.mark('wait ' + scope)
        self.pg.wait_for_function("(a)=>document.querySelectorAll(a[0]+' .mc[data-state=\"done\"], '+a[0]+' .mc[data-state=\"abstain\"]').length>=a[1]", arg=[scope, count], timeout=timeout)
        self.mark('done ' + scope)
    def beat(self, key):
        """The element is framed: the voice starts here and the frame holds for it."""
        self.mark('beat ' + key); self.hold(DUR[key] + 0.15)
    def close(self):
        self.unzoom(0.6); self.hold(0.5); end = time.time() - self.t0
        try: self.cdp.send('Page.stopScreencast')
        except Exception: pass
        self.ctx.close()
        # variable-rate frames to a constant 30 fps file, lossless-ish
        lst = os.path.join(self.dir, 'list.txt')
        with open(lst, 'w') as f:
            for i, t in enumerate(self.frames):
                nxt = self.frames[i + 1] if i + 1 < len(self.frames) else end
                f.write("file 'f%05d.png'\nduration %.4f\n" % (i, max(0.001, nxt - t)))
            if self.frames: f.write("file 'f%05d.png'\n" % (len(self.frames) - 1))
        out = os.path.join(OUT, self.name + '.mp4')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', out], check=True)
        shutil.rmtree(self.dir, ignore_errors=True)
        json.dump(self.log, open(os.path.join(OUT, self.name + '.json'), 'w'), indent=1); print('->', self.name, '%d frames' % len(self.frames))

def s3(pw):
    s = Shot(pw, 's3'); s.goto('/', '#spec .model'); s.beat('b3_1')
    s.zoom('#railsTop', 1.5); s.beat('b3_2')
    s.zoom('#qin', 1.7); s.cursor_to('#qin'); s.beat('b3_3')
    s.zoom('#period', 1.7); s.beat('b3_4')
    s.zoom('#whenBig', 1.6); s.beat('b3_5')
    s.unzoom(); s.centre('#hero svg'); s.cursor_to('#hero [data-z="ZONE 700"]'); s.hold(0.4)
    s.pg.locator('#hero [data-z="ZONE 700"]').dispatch_event('click'); s.mark('click landing gear')
    s.pg.wait_for_selector('#sum .bigsel', timeout=60000); s.settle(); s.hold(0.6); s.beat('b3_6')
    s.zoom('#sum .bigsel', 1.5); s.beat('b3_7')
    s.zoom('#facts', 1.25); s.hold(0.3); s.beat('b3_8'); s.unzoom(0.4); s.centre('#recs', 0, 1.2); s.hold(0.6)
    s.zoom('#leads', 1.05); s.beat('b3_9'); s.close()

def s4a(pw):
    s = Shot(pw, 's4a'); s.goto('/', '#spec .model')
    s.zoom('#spec .raw', 1.5); s.beat('b4a_1')
    s.zoom('#spec .model', 1.3); s.beat('b4a_2')
    s.zoom('#spec .model .prov', 1.7); s.beat('b4a_3'); s.close()

def s4b(pw):
    s = Shot(pw, 's4b'); s.goto('/?q=RADIO+ALTIMETER&from=2000-01-24&to=2000-01-24', '#recs tr.rec')
    s.click('#recs tr.rec', what='record row'); s.hold(0.8); s.zoom('#caseMc', 1.3); s.beat('b4b_1')
    s.unzoom(0.5); s.click('#case .mc__go', 0, 'What actually happened'); s.zoom('#case .mc', 1.35, 0); s.mark('beat b4b_2'); s.wait_done('#case'); s.hold(max(0.5, DUR['b4b_2'] - 1))
    s.zoom('#case .mc__go', 1.4, 2); s.beat('b4b_3')
    s.unzoom(0.5); s.click('#case .mc__go', 4, 'What should we check next'); s.wait_done('#case', 2); s.zoom('#case .pick', 1.5); s.beat('b4b_4'); s.close()

def s4c(pw):
    s = Shot(pw, 's4c'); s.goto('/?from=2026-06-01&zone=ZONE+700', '#sumMc .mc__go')
    s.zoom('#sumMc .mc__go', 1.5); s.cursor_to('#sumMc .mc__go'); s.beat('b4c_1')
    s.unzoom(0.5); s.click('#sumMc .mc__go', 0, 'read what recurs'); s.wait_done('#sumMc'); s.zoom('#sumMc .out', 1.2); s.beat('b4c_2')
    s.zoom('#sumMc .out .s.has', 1.6); s.beat('b4c_3')
    s.zoom('#sumMc .prov', 1.7); s.beat('b4c_4')
    s.unzoom(0.5); s.click('#sumMc .s.has', 0, 'a sentence'); s.hold(0.4); s.zoom('#sumMc .rail', 1.5); s.beat('b4c_5')
    s.zoom('#sumMc .next', 1.35); s.beat('b4d_1'); s.close()

def s4e(pw):
    s = Shot(pw, 's4e'); s.goto('/', '#qin')
    s.click('#qin', what='focus');
    for ch in 'what plane is the most dangerous': s.pg.keyboard.type(ch); s.hold(0.05)
    s.zoom('#qin', 1.6); s.beat('b4e_1')
    s.unzoom(0.5); s.click('#askBtn', what='Ask'); s.mark('wait #draft'); s.pg.wait_for_selector('#draft .mc', state='attached', timeout=60000); s.pg.wait_for_function("document.querySelectorAll('#draft .mc[data-state=\"done\"], #draft .mc[data-state=\"abstain\"]').length>=1", timeout=300000); s.mark('done #draft')
    s.zoom('#draft .out', 1.25); s.beat('b4e_2')
    s.zoom('#draft .next', 1.4); s.beat('b4e_3'); s.close()

def s4f(pw):
    s = Shot(pw, 's4f'); s.goto('/?tail=583UP', '#sumMc .mc__go')
    s.zoom('#sum .bigsel', 1.4); s.beat('b4f_1')
    s.unzoom(0.5); s.click('#sumMc .mc__go', 0, 'read this aircraft end to end'); s.wait_done('#sumMc')
    s.zoom('#sumMc .out', 1.2); s.hold(1.0)
    ok = s.pg.evaluate("(function(){var sp=[...document.querySelectorAll('#sumMc .out .s')].find(x=>/Nothing was filed/i.test(x.textContent));if(sp){sp.id='fx-gap';return true}return false})()")
    if ok: s.zoom('#fx-gap', 1.6)
    s.beat('b4f_2')
    s.zoom('#sumMc .prov', 1.5); s.beat('b4f_3'); s.close()

def s5(pw):
    s = Shot(pw, 's5'); s.goto('/', '#h1'); s.click('.rail.nf', what='NETFLIX cell'); s.pg.wait_for_selector('#ff tr.rec.key', timeout=60000); s.settle(); s.hold(0.8)
    s.zoom('#hero .why img', 1.15); s.beat('b5_1')
    s.zoom('#ff .tblwrap', 1.35, 0); s.beat('b5_2')
    s.unzoom(0.5); s.click('#ff tr.rec.key', 0, 'the door plug row'); s.hold(0.8); s.zoom('#case .raw', 1.4); s.beat('b5_3')
    s.zoom('#ff tr.rec', 1.6, 0); s.beat('b5_4')
    s.unzoom(0.5); s.click('#ff .mc__go', 0, 'what the NTSB found'); s.wait_done('#ff'); s.zoom('#ff .out', 1.2); s.beat('b5_5')
    s.zoom('#ff .srcs', 1.4); s.beat('b5_6'); s.close()

def s6(pw):
    s = Shot(pw, 's6'); s.goto('/', '#spec .model'); s.zoom('#h1', 1.3); s.beat('b6_1'); s.close()

SHOTS = {'s3': s3, 's4a': s4a, 's4b': s4b, 's4c': s4c, 's4e': s4e, 's4f': s4f, 's5': s5, 's6': s6}
if __name__ == '__main__':
    only = sys.argv[1:] or list(SHOTS)
    with sync_playwright() as pw:
        for k in only:
            print('==', k)
            try: SHOTS[k](pw)
            except Exception as e: print('FAILED', k, str(e)[:400])
