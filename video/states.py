#!/usr/bin/env python3
"""v5: the film is composed from finished states, not from a live recording.
For every beat: one 2x screenshot of the element (with padding), the model's
text where there is one, and the box of the answer area inside the shot so the
slide can reveal it at the pace of the voice."""
import json, os, sys, time
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'states'); os.makedirs(OUT, exist_ok=True)
BASE = 'https://aircraftdefects.com'
PAD = 28

def shot(pg, sel, name, nth=0, pad=PAD, wait=0.6):
    el = pg.locator(sel).nth(nth); el.scroll_into_view_if_needed(); pg.wait_for_timeout(int(wait * 1000))
    b = el.bounding_box(); x0, y0 = max(0, b['x'] - pad), max(0, b['y'] - pad)
    W, H = pg.viewport_size['width'], pg.viewport_size['height']
    w, h = min(W - x0, b['width'] + 2 * pad), min(H - y0, b['height'] + 2 * pad)
    pg.screenshot(path=os.path.join(OUT, name + '.png'), clip={'x': x0, 'y': y0, 'width': w, 'height': h})
    return {'x0': x0, 'y0': y0, 'w': w, 'h': h}

def rel(pg, sel, clip, nth=0):
    """Box of a sub-element relative to the clip, in CSS px."""
    b = pg.locator(sel).nth(nth).bounding_box()
    if not b: return None
    return {'x': b['x'] - clip['x0'], 'y': b['y'] - clip['y0'], 'w': b['width'], 'h': b['height']}

def wait_done(pg, scope, count=1, timeout=300000):
    pg.wait_for_function("(a)=>document.querySelectorAll(a[0]+' .mc[data-state=\"done\"], '+a[0]+' .mc[data-state=\"abstain\"], '+a[0]+' .mc[data-state=\"error\"]').length>=a[1]", arg=[scope, count], timeout=timeout)

def page(br, w=1280, h=800):
    return br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)

def goto(pg, path, wait):
    pg.goto(BASE + path, wait_until='networkidle', timeout=120000); pg.wait_for_selector(wait, timeout=60000); pg.wait_for_timeout(800)

SP = os.path.join(OUT, 'states.json')
S = json.load(open(SP)) if os.path.exists(SP) else {}
def save(): json.dump(S, open(SP, 'w'), indent=1)
def block(name, fn):
    if name in S: print('have', name); return
    try: fn(); save(); print('ok', name)
    except Exception as e: print('FAILED', name, str(e)[:200])
with sync_playwright() as p:
    br = p.chromium.launch()
    def _front():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/', '#spec .model')
        S['front'] = shot(pg, '.wrap', 'front', pad=0); S['rails'] = shot(pg, '#railsTop', 'rails')
        S['desk'] = shot(pg, '.desk', 'desk') if pg.locator('.desk').count() else shot(pg, '#qin', 'desk', pad=60)
        S['period'] = shot(pg, '#period', 'period'); S['plane'] = shot(pg, '#hero', 'plane', pad=10)

        c = shot(pg, '#spec', 'specimen', pad=16); c['out'] = rel(pg, '#spec .model', c); c['raw'] = rel(pg, '#spec .raw', c); c['text'] = pg.locator('#spec .model p').first.inner_text(); S['specimen'] = c
        pg.close()
    block('front', _front)
    def _selection():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/?from=2026-06-01&zone=ZONE+700', '#recs tr.rec')
        S['heading'] = shot(pg, '#sum', 'heading', pad=16); S['heading']['big'] = rel(pg, '#sum .bigsel', S['heading']); S['heading']['recs'] = rel(pg, '#recs', S['heading'])

        pg.locator('#sumMc .mc__go').first.click(); wait_done(pg, '#sumMc'); pg.wait_for_timeout(600)
        c = shot(pg, '#sumMc .mc', 'recurs', pad=12); c['out'] = rel(pg, '#sumMc .out', c); c['prov'] = rel(pg, '#sumMc .prov', c); c['text'] = pg.locator('#sumMc .out').inner_text(); c['prov_text'] = pg.locator('#sumMc .prov').inner_text(); S['recurs'] = c
        if pg.locator('#sumMc .s.has').count():
            pg.locator('#sumMc .s.has').first.click(); pg.wait_for_timeout(500)
            c = shot(pg, '#sumMc .mc', 'recurs_rail', pad=12); c['rail'] = rel(pg, '#sumMc .rail', c); c['sent'] = rel(pg, '#sumMc .s.has', c); S['recurs_rail'] = c
        if pg.locator('#sumMc .next').count():
            c = shot(pg, '#sumMc .next', 'next', pad=20); c['cards'] = [rel(pg, '#sumMc .next button', c, i) for i in range(pg.locator('#sumMc .next button').count())]; c['text'] = pg.locator('#sumMc .next').inner_text(); S['next'] = c
        pg.close()
    block('selection', _selection)
    def _case():
        pg = None

        pg = page(br, 1280, 900); goto(pg, '/case/USAASB00020', '#mc .mc__go')
        S['case_top'] = shot(pg, '.wrap', 'case_top', pad=0)
        c = shot(pg, '#mc', 'case_questions', pad=12); c['buttons'] = [rel(pg, '#mc .mc__go', c, i) for i in range(5)]; S['case_questions'] = c
        pg.locator('#mc .mc__go').nth(0).click(); wait_done(pg, '#mc', 1); pg.wait_for_timeout(500)
        c = shot(pg, '#mc .mc', 'case_answer', nth=0, pad=12); c['out'] = rel(pg, '#mc .mc .out', c, 0); c['text'] = pg.locator('#mc .mc .out').nth(0).inner_text(); S['case_answer'] = c
        pg.locator('#mc .mc__go').nth(4).click(); wait_done(pg, '#mc', 2); pg.wait_for_timeout(500)
        c = shot(pg, '#mc .mc', 'case_checks', nth=4, pad=12); c['out'] = rel(pg, '#mc .mc .out', c, 4); c['text'] = pg.locator('#mc .mc .out').nth(4).inner_text(); c['picks'] = rel(pg, '#mc .mc .out .pick', c, 4) if pg.locator('#mc .mc .out .pick').count() else None; S['case_checks'] = c
        pg.close()
    block('case', _case)
    def _question():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/', '#qin')
        pg.fill('#qin', 'what plane is the most dangerous'); pg.wait_for_timeout(300); S['question_typed'] = shot(pg, '.desk', 'question_typed', pad=20) if pg.locator('.desk').count() else shot(pg, '#qin', 'question_typed', pad=60)
        pg.click('#askBtn'); pg.wait_for_selector('#draft .mc', state='attached', timeout=90000); wait_done(pg, '#draft'); pg.wait_for_timeout(600)
        c = shot(pg, '#draft', 'question', pad=12); c['out'] = rel(pg, '#draft .out', c); c['next'] = rel(pg, '#draft .next', c) if pg.locator('#draft .next').count() else None; c['text'] = pg.locator('#draft .out').inner_text(); c['reading'] = pg.locator('#draft .draft').inner_text()[:400]; S['question'] = c
        pg.close()
    block('question', _question)
    def _airframe():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/?tail=583UP', '#sumMc .mc__go')
        S['airframe_head'] = shot(pg, '#sum', 'airframe_head', pad=16); S['airframe_head']['big'] = rel(pg, '#sum .bigsel', S['airframe_head'])
        pg.locator('#sumMc .mc__go').first.click(); wait_done(pg, '#sumMc'); pg.wait_for_timeout(600)
        c = shot(pg, '#sumMc .mc', 'airframe', pad=12); c['out'] = rel(pg, '#sumMc .out', c); c['text'] = pg.locator('#sumMc .out').inner_text(); c['prov_text'] = pg.locator('#sumMc .prov').inner_text()
        gap = pg.evaluate("(function(){var sp=[...document.querySelectorAll('#sumMc .out .s')].find(x=>/Nothing was filed/i.test(x.textContent));if(!sp)return null;var r=sp.getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
        c['gap'] = {'x': gap[0] - c['x0'], 'y': gap[1] - c['y0'], 'w': gap[2], 'h': gap[3]} if gap else None; S['airframe'] = c
        pg.close()
    block('airframe', _airframe)
    def _differ():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/?from=2026-06-01#view=compare', '#pb .mc__go')
        S['compare_table'] = shot(pg, '#pb table', 'compare_table', pad=12)
        pg.locator('#pb .mc__go').first.click(); wait_done(pg, '#pb'); pg.wait_for_timeout(600)
        c = shot(pg, '#pb .mc', 'differ', pad=12); c['out'] = rel(pg, '#pb .out', c); c['text'] = pg.locator('#pb .out').inner_text(); c['prov_text'] = pg.locator('#pb .prov').inner_text(); S['differ'] = c
        pg.close()
    block('differ', _differ)
    def _web():
        pg = None

        pg = page(br, 1280, 860); goto(pg, '/#view=freefall', '#ff tr.rec.key')
        S['freefall_rows'] = shot(pg, '#ff .tblwrap', 'freefall_rows', pad=12, nth=0); S['freefall_rows']['key'] = rel(pg, '#ff tr.rec.key', S['freefall_rows'])
        pg.locator('#ff .mc__go').first.click(); wait_done(pg, '#ff'); pg.wait_for_timeout(600)
        c = shot(pg, '#ff .mc', 'web', nth=0, pad=12); c['out'] = rel(pg, '#ff .out', c); c['srcs'] = rel(pg, '#ff .srcs', c) if pg.locator('#ff .srcs').count() else None; c['text'] = pg.locator('#ff .out').inner_text(); S['web'] = c
        pg.close()
    block('web', _web)
    br.close()
save()
print({k: (round(v['w']), round(v['h'])) for k, v in S.items()})
