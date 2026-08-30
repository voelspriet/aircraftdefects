#!/usr/bin/env python3
"""v5 composer. Each beat is a local HTML slide built from a finished state:
the real screenshot with a slow push-in, and the model's answer revealed at
the pace of the sentence. Rendered frame by frame (30 fps screenshots of the
slide at fixed times), so the timing is exact and every frame is crisp."""
import json, os, shutil, subprocess, sys
from playwright.sync_api import sync_playwright
import build
from build import HERE, K, CL, OUT, run, probe, seg, still, concat
from beats5 import V5
W, H = 2560, 1440; FPS = 30
build.VF = 'scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p' % (W, H, W, H)
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2']
ST = os.path.join(HERE, 'states'); S = json.load(open(os.path.join(ST, 'states.json')))
V = os.path.join(HERE, 'voice'); DUR = json.load(open(os.path.join(V, 'durations.json')))
SL = os.path.join(HERE, 'slides'); os.makedirs(SL, exist_ok=True)
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono&display=swap">'
CSS = ('<style>html,body{margin:0;width:%dpx;height:%dpx;background:#f6f4ee;overflow:hidden;font-family:Archivo,sans-serif;color:#1c1b17}'
       '.stage{position:absolute;inset:0;overflow:hidden}.shot{position:absolute;transform-origin:50%% 50%%}'
       '.shot img{display:block}.mask{position:absolute;background:#f6f4ee}'
       '.title{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 220px}'
       '.title .n{font:400 30px/1 "IBM Plex Mono",monospace;letter-spacing:.18em;color:#245c5a;text-transform:uppercase}'
       '.title .t{font:400 128px/1.05 "Instrument Serif",serif;margin-top:26px;max-width:1900px}.title .t b{color:#b8431f;font-weight:400}'
       '.cap{position:absolute;left:120px;bottom:96px;max-width:1500px;padding:22px 34px;background:rgba(246,244,238,.93);border-left:4px solid #245c5a;font:400 34px/1.35 "Instrument Serif",serif}'
       '.cap i{display:block;font:400 18px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;color:#245c5a;margin-bottom:10px;font-style:normal;text-transform:uppercase}'
       '</style>') % (W, H)

def slide_html(spec, t_total):
    """spec: {'state': key, 'focus': box key or None, 'zoom': (from,to), 'reveal': box key or None, 'caption': str, 'title': (n,t)}"""
    if 'title' in spec:
        n, t = spec['title']
        return '<!doctype html><html><head>' + FONTS + CSS + '</head><body><div class="title"><div class="n">' + n + '</div><div class="t">' + t + '</div></div><script>function at(t){}</script></body></html>'
    st = S[spec['state']]; img = 'file://' + os.path.join(ST, spec['state'] + '.png')
    iw, ih = st['w'] * 2, st['h'] * 2               # the png is 2x
    # fit: scale so the shot fills the width with a margin, cap by height
    fit = min((W - 160) / iw, (H - 120) / ih); z0, z1 = spec.get('zoom', (1.0, 1.06))
    box = st.get(spec.get('focus') or '', None) if spec.get('focus') else None
    # centre of interest in image px
    if box: cx, cy = (box['x'] + box['w'] / 2) * 2, (box['y'] + box['h'] / 2) * 2
    else: cx, cy = iw / 2, min(ih / 2, (H / 2) / fit)
    if spec.get('focus'):
        # the focus box should fill most of the frame; never upscale the 2x png beyond 1.6
        fit = min(1.6, (W * 0.82) / (box['w'] * 2), (H * 0.84) / max(box['h'] * 2, 300)) * spec.get('focus_zoom', 1.0) / 1.0
        fit = min(fit, 1.6)
    else:
        fit = min(1.3, fit)
    dw, dh = iw * fit, ih * fit
    left, top = W / 2 - cx * fit, H / 2 - cy * fit
    left = min(80, max(W - dw - 80, left)) if dw > W - 160 else (W - dw) / 2
    top = min(60, max(H - dh - 60, top)) if dh > H - 120 else max(60, (H - dh) / 2)
    ox, oy = (cx * fit) / dw * 100, (cy * fit) / dh * 100
    mask = ''
    if spec.get('reveal') and st.get(spec['reveal']):
        r = st[spec['reveal']]; mx, my, mw, mh = r['x'] * 2 * fit, r['y'] * 2 * fit, r['w'] * 2 * fit, r['h'] * 2 * fit
        mask = '<div class="mask" id="mask" style="left:%.1fpx;top:%.1fpx;width:%.1fpx;height:%.1fpx"></div>' % (mx, my, mw, mh)
    cap = ('<div class="cap"><i>%s</i>%s</div>' % (spec.get('cap_label', 'GLM-5.3-Flash'), spec['caption'])) if spec.get('caption') else ''
    head = '<!doctype html><html><head>' + FONTS + CSS + '</head><body>'
    return head + ('<div class="stage"><div class="shot" id="shot" style="left:%.1fpx;top:%.1fpx;width:%.1fpx;height:%.1fpx;transform-origin:%.1f%% %.1f%%">'
            '<img src="%s" style="width:%.1fpx;height:%.1fpx">%s</div>%s</div>'
            '<script>var T=%.3f,Z0=%.3f,Z1=%.3f;function at(t){var p=Math.min(1,t/T);var e=1-Math.pow(1-p,2);document.getElementById("shot").style.transform="scale("+(Z0+(Z1-Z0)*e)+")";var m=document.getElementById("mask");if(m){var r=Math.min(1,Math.max(0,(t-0.4)/Math.max(0.5,T-1.2)));m.style.top=(m.dataset.y0||(m.dataset.y0=parseFloat(m.style.top)))*1+r*m.dataset.h+"px";}}'
            'window.addEventListener("load",function(){var m=document.getElementById("mask");if(m){m.dataset.h=parseFloat(m.style.height);}at(0)});</script></body></html>') % (left, top, dw, dh, ox, oy, img, dw, dh, mask, cap, t_total, z0, z1)

def render(name, html, t_total, pw_page):
    """Frame-exact: screenshot the slide at each 1/30 s."""
    d = os.path.join(SL, name); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    path = os.path.join(SL, name + '.html'); open(path, 'w').write(html)
    pw_page.goto('file://' + path); pw_page.wait_for_timeout(900)
    n = int(t_total * FPS) + 1
    for i in range(n):
        pw_page.evaluate("at(%f)" % (i / FPS)); pw_page.screenshot(path=os.path.join(d, 'f%05d.png' % i))
    out = os.path.join(SL, name + '.mp4')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS), '-i', os.path.join(d, 'f%05d.png'), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', out], check=True)
    shutil.rmtree(d, ignore_errors=True); return out

# ---- the slide plan: voice key -> slide spec
def mask_fix(html):
    # the mask must shrink from the bottom: keep its bottom edge fixed by moving top and reducing height
    return html.replace('m.style.top=(m.dataset.y0||(m.dataset.y0=parseFloat(m.style.top)))*1+r*m.dataset.h+"px";', 'm.style.top=(parseFloat(m.dataset.y0||(m.dataset.y0=m.style.top))+r*m.dataset.h)+"px";m.style.height=(m.dataset.h*(1-r))+"px";')

PLAN = {
 'h1': {'state': 'front', 'zoom': (1.0, 1.05)},
 'h2': {'state': 'rails', 'focus_zoom': 1.0, 'zoom': (1.0, 1.04)},
 'c1t': {'title': ('Chapter one', 'Say it in <b>plain English</b>')},
 'c1a': {'state': 'specimen', 'focus': 'out', 'focus_zoom': 1.2, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'c1b': {'state': 'specimen', 'focus': 'raw', 'focus_zoom': 1.2, 'zoom': (1.0, 1.04)},
 'c2t': {'title': ('Chapter two', 'Five questions on <b>any report</b>')},
 'c2a': {'state': 'case_answer', 'focus': 'out', 'focus_zoom': 1.1, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'c2b': {'state': 'case_checks', 'focus': 'out', 'focus_zoom': 1.1, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'c3t': {'title': ('Chapter three', 'What recurs, and <b>prove it</b>')},
 'c3a': {'state': 'recurs', 'focus': 'out', 'focus_zoom': 1.0, 'reveal': 'out', 'zoom': (1.0, 1.02)},
 'c3b': {'state': 'recurs', 'focus': 'prov', 'focus_zoom': 1.6, 'zoom': (1.0, 1.05)},
 'c3c': {'state': 'recurs_rail', 'focus': 'rail', 'focus_zoom': 1.4, 'zoom': (1.0, 1.04)},
 'c3d': {'state': 'next', 'focus_zoom': 1.0, 'zoom': (1.0, 1.04)},
 'c4t': {'title': ('Chapter four', 'A question the form <b>cannot hold</b>')},
 'c4a': {'state': 'question', 'focus': 'out', 'focus_zoom': 1.05, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'c4b': {'state': 'question', 'focus': 'next', 'focus_zoom': 1.3, 'zoom': (1.0, 1.04)},
 'c5t': {'title': ('Chapter five', 'One aircraft, <b>end to end</b>')},
 'c5a': {'state': 'airframe', 'focus': 'out', 'focus_zoom': 1.0, 'reveal': 'out', 'zoom': (1.0, 1.02)},
 'c5b': {'state': 'airframe', 'focus': 'gap', 'focus_zoom': 1.6, 'zoom': (1.0, 1.05)},
 'c6t': {'title': ('Chapter six', 'Two airlines, <b>what differs</b>')},
 'c6a': {'state': 'differ', 'focus': 'out', 'focus_zoom': 1.0, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'c7t': {'title': ('Chapter seven', 'The aircraft <b>from the film</b>')},
 'c7a': {'state': 'freefall_rows', 'focus': 'key', 'focus_zoom': 1.3, 'zoom': (1.0, 1.04)},
 'c7b': {'state': 'web', 'focus': 'out', 'focus_zoom': 1.0, 'reveal': 'out', 'zoom': (1.0, 1.03)},
 'cl1': {'state': 'heading', 'focus': 'big', 'focus_zoom': 1.2, 'zoom': (1.0, 1.05)},
 'cl2': {'state': 'front', 'zoom': (1.02, 1.0)},
}

def main():
    order = []
    build.build_open(); build.build_why(); order += [seg('01_open'), seg('02a'), seg('02b'), seg('02c'), seg('02d')]
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page(viewport={'width': W, 'height': H})
        for key, _ in V5:
            if key not in PLAN: continue
            spec = PLAN[key]; t = DUR[key] + (0.5 if 'title' in spec else 0.7)
            if 'state' in spec and spec['state'] not in S: print('missing state', spec['state'], 'for', key); continue
            if 'state' in spec and spec.get('focus') and not S[spec['state']].get(spec['focus']): spec = dict(spec); spec.pop('focus')
            html = mask_fix(slide_html(spec, t)); v = render('s_' + key, html, t, pg)
            out = seg('05_' + key); run(['-i', v, '-i', os.path.join(V, key + '.wav'), '-map', '0:v', '-map', '1:a', '-t', '%.3f' % t] + ENC + [out]); order.append(out); print(key, round(t, 1))
        br.close()
    still(os.path.join(K, 'end.png'), 5.0, seg('07_end'), fade=0.5); order.append(seg('07_end'))
    concat(order, seg('film5_raw'))
    final = os.path.join(HERE, 'aircraftdefects-v5.mp4')
    run(['-i', seg('film5_raw'), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-c:v', 'copy'] + ENC[6:] + [final]); print('film', probe(final))

if __name__ == '__main__':
    main()
