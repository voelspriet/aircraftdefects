#!/usr/bin/env python3
"""The footage block: where the trouble sits. Five real shots from v1
(aviation/gen/k_*.mp4, 2560x1440) with the live zone count as an overlay and
one sentence each; the drawing from the page opens it."""
import json, os, subprocess, urllib.request, ssl, certifi
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); GEN = os.path.expanduser('~/vibecoding/aviation/gen')
OUT = os.path.join(HERE, 'out'); K = os.path.join(HERE, 'cards'); V = os.path.join(HERE, 'voice')
DUR = json.load(open(os.path.join(V, 'durations.json')))
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2']
W, H = 2560, 1440
ZONES = [('bz_1', 'k_upper_fuselage', 'ZONE 200', 'Upper fuselage'), ('bz_2', 'k_lower_fuselage', 'ZONE 100', 'Lower fuselage'),
         ('bz_3', 'k_doors', 'ZONE 800', 'Doors'), ('bz_4', 'k_stabilisers', 'ZONE 300', 'Stabilisers'), ('bz_5', 'k_wing', 'ZONE 500', 'Left wing')]

def run(a):
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error'] + a, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1200:]); raise SystemExit(1)
def probe(p): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)

hero = json.load(urllib.request.urlopen('https://aircraftdefects.com/z/api/hero', context=ssl.create_default_context(cafile=certifi.where())))
counts = {z['code']: z['n'] for z in hero['zones']}
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=IBM+Plex+Mono&display=swap">'

with sync_playwright() as p:
    br = p.chromium.launch()
    # the drawing, lit as on the page, for the opening line
    pg = br.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
    pg.goto('https://aircraftdefects.com/', wait_until='networkidle', timeout=90000); pg.wait_for_timeout(1500)
    pg.locator('#hero svg').first.screenshot(path=os.path.join(K, 'plane.png'))
    pg.close()
    # overlays
    for key, clip, code, label in ZONES:
        html = ('<!doctype html><html><head>' + FONTS + '<style>html,body{margin:0;width:%dpx;height:%dpx;background:transparent}'
                '.c{position:absolute;left:120px;bottom:110px;padding:26px 40px 30px;background:rgba(246,244,238,.94);border-left:4px solid #b8431f}'
                '.l{font:400 64px/1.05 "Instrument Serif",serif;color:#1c1b17}.n{font:400 64px/1.05 "Instrument Serif",serif;color:#b8431f;margin-left:26px;font-variant-numeric:tabular-nums}'
                '.z{font:400 20px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;color:#6f6a62;margin-top:14px}</style></head><body>'
                '<div class="c"><span class="l">%s</span><span class="n">%s</span><div class="z">%s · REPORTS FILED, NOT A RATE</div></div></body></html>') % (W, H, label, '{:,}'.format(counts[code]), code)
        hp = os.path.join(K, 'ov_%s.html' % clip); open(hp, 'w').write(html)
        pg = br.new_page(viewport={'width': W, 'height': H}); pg.goto('file://' + hp); pg.wait_for_timeout(900)
        pg.screenshot(path=os.path.join(K, 'ov_%s.png' % clip), omit_background=True); pg.close()
    br.close()

segs = []
# opening line over the drawing
v = os.path.join(V, 'bz_0.wav'); d = DUR['bz_0'] + 0.5
run(['-loop', '1', '-t', '%.3f' % d, '-i', os.path.join(K, 'plane.png'), '-i', v, '-vf', 'scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=#f6f4ee,fps=30,format=yuv420p,fade=t=in:st=0:d=0.4' % (W, H, W, H), '-shortest'] + ENC + [os.path.join(OUT, 'z0.mp4')])
segs.append(os.path.join(OUT, 'z0.mp4'))
for key, clip, code, label in ZONES:
    src = os.path.join(GEN, clip + '.mp4'); d = max(DUR[key] + 0.6, 4.5); cl = probe(src)
    fc = ('[0:v]scale=%d:%d,fps=30,tpad=stop_mode=clone:stop_duration=%.2f,trim=0:%.3f,setpts=PTS-STARTPTS[b];'
          '[1:v]format=rgba,fade=t=in:st=0.5:d=0.5:alpha=1,fade=t=out:st=%.2f:d=0.4:alpha=1[o];[b][o]overlay=0:0[v]') % (W, H, max(0.1, d - cl + 0.5), d, d - 0.6)
    run(['-i', src, '-loop', '1', '-t', '%.3f' % d, '-i', os.path.join(K, 'ov_%s.png' % clip), '-i', os.path.join(V, key + '.wav'), '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-t', '%.3f' % d] + ENC + [os.path.join(OUT, 'z_%s.mp4' % clip)])
    segs.append(os.path.join(OUT, 'z_%s.mp4' % clip))
lst = os.path.join(OUT, 'zones_list.txt'); open(lst, 'w').write(''.join("file '%s'\n" % s for s in segs))
run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(OUT, 'zones.mp4')])
print('zones block', probe(os.path.join(OUT, 'zones.mp4')), 's')
