#!/usr/bin/env python3
"""Screen captures for the v2 film. One recording per shot, 1920x1080, a drawn
cursor that glides to each target, smooth scrolls, and a log of when each
event happened inside the recording so the cut can be placed on it."""
import json, os, shutil, sys, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cap')
BASE = 'https://aircraftdefects.com'
W, H = 1200, 675
RW, RH = 1920, 1080

CURSOR_JS = """
(function(){if(document.getElementById('fx-cursor'))return;var c=document.createElement('div');c.id='fx-cursor';
c.style.cssText='position:fixed;left:-50px;top:-50px;width:22px;height:30px;z-index:2147483647;pointer-events:none;transition:left .55s cubic-bezier(.2,.7,.3,1),top .55s cubic-bezier(.2,.7,.3,1)';
c.innerHTML='<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2l16 13-7 1 4 9-3 1-4-9-6 5z" fill="#1c1b17" stroke="#fff" stroke-width="1.5"/></svg>';
document.documentElement.appendChild(c);
document.documentElement.style.scrollBehavior='smooth';})();
"""

class Shot:
    def __init__(self, pw, name):
        self.name = name
        self.ctx = pw.chromium.launch().new_context(viewport={'width': W, 'height': H}, record_video_dir=OUT,
                                                   record_video_size={'width': RW, 'height': RH})
        self.pg = self.ctx.new_page()
        self.pg.add_init_script(CURSOR_JS)
        self.t0 = time.time(); self.log = []
    def mark(self, what):
        self.log.append((round(time.time() - self.t0, 2), what)); print('  %6.2f %s' % (self.log[-1][0], what))
    def goto(self, path, wait='#h1'):
        self.pg.goto(BASE + path, wait_until='networkidle', timeout=120000)
        self.pg.evaluate(CURSOR_JS)
        if wait: self.pg.wait_for_selector(wait, timeout=60000)
        self.mark('loaded ' + path)
    def hold(self, s): self.pg.wait_for_timeout(int(s * 1000))
    def scroll_to(self, sel, offset=-120, hold=1.2):
        self.pg.evaluate("(a)=>{var e=document.querySelector(a[0]);if(e){window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+a[1],behavior:'smooth'})}}", [sel, offset])
        self.hold(hold); self.mark('scroll ' + sel)
    def scroll_by(self, px, hold=1.0):
        self.pg.evaluate("(y)=>window.scrollBy({top:y,behavior:'smooth'})", px); self.hold(hold)
    def move(self, sel, nth=0):
        el = self.pg.locator(sel).nth(nth)
        self.pg.evaluate("(a)=>{var e=document.querySelectorAll(a[0])[a[1]];if(!e)return;var r=e.getBoundingClientRect();if(r.top<90||r.bottom>window.innerHeight-60){window.scrollBy({top:r.top-window.innerHeight/2,behavior:'smooth'})}}", [sel, nth]); self.hold(0.9)
        b = el.bounding_box()
        x, y = b['x'] + min(b['width'] / 2, 160), b['y'] + b['height'] / 2
        self.pg.evaluate("(p)=>{var c=document.getElementById('fx-cursor');c.style.left=p[0]+'px';c.style.top=p[1]+'px'}", [x, y])
        self.hold(0.7); return el, x, y
    def click(self, sel, nth=0, what=None, js=False):
        el, x, y = self.move(sel, nth)
        if js: el.dispatch_event('click')
        else: self.pg.mouse.click(x, y)
        self.mark('click ' + (what or sel)); self.hold(0.3)
    def wait_done(self, scope, timeout=240000):
        self.pg.wait_for_selector(scope + ' .mc[data-state="done"], ' + scope + ' .mc[data-state="abstain"], ' + scope + ' .mc[data-state="error"]', state='attached', timeout=timeout)
        self.mark('done ' + scope)
    def type_into(self, sel, text):
        self.click(sel, what='focus ' + sel)
        for ch in text:
            self.pg.keyboard.type(ch); self.hold(0.05)
        self.mark('typed ' + text)
    def close(self):
        self.pg.wait_for_timeout(600)
        vid = self.pg.video.path()
        self.ctx.close()
        dst = os.path.join(OUT, self.name + '.webm')
        shutil.move(vid, dst)
        json.dump(self.log, open(os.path.join(OUT, self.name + '.json'), 'w'), indent=1)
        print('->', dst)

def s3(pw):
    s = Shot(pw, 's3'); s.goto('/z/', '#spec .model'); s.hold(2.5)
    s.scroll_by(260, 1.6); s.scroll_by(300, 1.6); s.scroll_by(-560, 1.4)
    s.click('#hero [data-z="ZONE 700"]', what='landing gear', js=True)
    s.pg.wait_for_load_state('networkidle'); s.pg.wait_for_selector('#sum .bigsel', timeout=60000); s.pg.evaluate(CURSOR_JS); s.hold(4.5); s.mark('heading in view'); s.close()

def s4a(pw):
    s = Shot(pw, 's4a'); s.goto('/z/', '#spec .model'); s.scroll_to('#spec', -60, 1.5); s.hold(1.0)
    s.move('#spec a.px'); s.hold(1.0); s.scroll_by(360, 1.5); s.hold(2.5); s.close()

def s4b(pw):
    s = Shot(pw, 's4b'); s.goto('/z/?q=RADIO+ALTIMETER&from=2000-01-24&to=2000-01-24', '#recs tr.rec')
    s.scroll_to('#recs', -160, 1.2); s.click('#recs tr.rec', what='record row'); s.hold(0.8)
    s.scroll_to('#case', -40, 1.0); s.click('#case .mc__go', 0, 'What actually happened'); s.wait_done('#case'); s.hold(2.0)
    s.scroll_to('#case .mc:nth-of-type(5), #case .mc', -300, 0.8)
    s.click('#case .mc__go', 4, 'What should we check next'); s.wait_done('#case'); s.hold(1.0)
    s.move('#case .pick button'); s.hold(2.5); s.close()

def s4cd(pw):
    s = Shot(pw, 's4cd'); s.goto('/z/?from=2026-06-01&zone=ZONE+700', '#sumMc .mc__go')
    s.scroll_to('#sumMc', -140, 1.2); s.click('#sumMc .mc__go', 0, 'read what recurs'); s.wait_done('#sumMc'); s.hold(1.5)
    s.scroll_to('#sumMc .prov', -700, 1.2); s.hold(1.5)
    s.click('#sumMc .s.has', 0, 'a sentence'); s.hold(3.5); s.mark('rail open')
    s.scroll_to('#sumMc .next', -420, 1.2); s.move('#sumMc .next button'); s.hold(3.0); s.mark('next three'); s.close()

def s4e(pw):
    s = Shot(pw, 's4e'); s.goto('/z/', '#qin')
    s.type_into('#qin', 'what plane is the most dangerous'); s.click('#askBtn', what='Ask')
    s.pg.wait_for_selector('#draft .mc', state='attached', timeout=60000); s.wait_done('#draft'); s.scroll_to('#draft', -80, 1.0); s.hold(3.0); s.scroll_by(300, 1.5); s.hold(2.0); s.close()

def s4f(pw):
    s = Shot(pw, 's4f'); s.goto('/z/?tail=583UP', '#sumMc .mc__go')
    s.scroll_to('#sumMc', -140, 1.2); s.click('#sumMc .mc__go', 0, 'read this aircraft end to end'); s.wait_done('#sumMc'); s.hold(1.0)
    s.scroll_to('#sumMc .mc[data-state="done"] .out', -100, 1.2); s.scroll_by(500, 2.0); s.scroll_by(500, 2.0); s.hold(1.5); s.close()

def s5(pw):
    s = Shot(pw, 's5'); s.goto('/z/', '#h1'); s.click('.rail.nf', what='NETFLIX cell')
    s.pg.wait_for_selector('#ff tr.rec.key', timeout=60000); s.pg.evaluate(CURSOR_JS); s.hold(2.0)
    s.scroll_to('#hero .why', -60, 1.4); s.hold(1.5); s.scroll_to('#ff tr.rec.key', -300, 1.4)
    s.click('#ff tr.rec.key', 0, 'the door plug row'); s.hold(0.8); s.scroll_to('#case', -40, 1.2); s.hold(3.0); s.mark('write-up on screen')
    s.scroll_to('#ff .mc__go', -200, 1.2); s.click('#ff .mc__go', 0, 'what the NTSB found'); s.wait_done('#ff'); s.hold(1.0)
    s.scroll_by(420, 1.5); s.hold(3.0); s.close()

def s6(pw):
    s = Shot(pw, 's6'); s.goto('/z/', '#spec .model'); s.hold(3.0); s.scroll_by(120, 2.0); s.hold(2.0); s.close()

SHOTS = {'s3': s3, 's4a': s4a, 's4b': s4b, 's4cd': s4cd, 's4e': s4e, 's4f': s4f, 's5': s5, 's6': s6}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or list(SHOTS)
    with sync_playwright() as pw:
        for k in only:
            print('==', k)
            try:
                SHOTS[k](pw)
            except Exception as e:
                print('FAILED', k, str(e)[:300])
