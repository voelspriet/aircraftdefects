#!/usr/bin/env python3
"""v5.1: one continuous video for the chapters with a single soundtrack, so
sync cannot drift. Order: open, why, the footage block, the bridge, the
chapters, the close card."""
import json, os, subprocess
from playwright.sync_api import sync_playwright
import build, slides5
from build import HERE, K, OUT, run, probe, seg, still, concat
from slides5 import PLAN, DUR, SL, V, W, H, ENC, slide_html, mask_fix, render
from beats5 import V5

# make sure every slide video exists (hb is new)
PLAN['hb'] = dict(PLAN.get('h1', {'state': 'front', 'zoom': (1.0, 1.05)}))
keys = [k for k, _ in V5 if k in PLAN]
if 'hb' not in keys: keys.insert(0, 'hb')
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page(viewport={'width': W, 'height': H})
    for key in keys:
        vpath = os.path.join(SL, 's_' + key + '.mp4')
        if os.path.exists(vpath): continue
        spec = dict(PLAN[key]); t = DUR[key] + (0.5 if 'title' in spec else 0.7)
        if 'state' in spec and spec.get('focus') and not slides5.S[spec['state']].get(spec['focus']): spec.pop('focus')
        render('s_' + key, mask_fix(slide_html(spec, t)), t, pg); print('rendered', key)
    br.close()

# part B: chapters as one video + one soundtrack
order = ['hb' if k == 'h1' else k for k in keys]
vids = [os.path.join(SL, 's_' + k + '.mp4') for k in order]
durs = [probe(v) for v in vids]
lst = os.path.join(OUT, 'b_list.txt'); open(lst, 'w').write(''.join("file '%s'\n" % v for v in vids))
run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(OUT, 'B_video.mp4')])
total = probe(os.path.join(OUT, 'B_video.mp4'))
ins = ['-f', 'lavfi', '-t', '%.3f' % total, '-i', 'anullsrc=r=48000:cl=stereo']; fc = ''; labels = ''
t = 0.0
for i, k in enumerate(order):
    ins += ['-i', os.path.join(V, k + '.wav')]
    ms = int((t + 0.15) * 1000)
    fc += '[%d]adelay=%d|%d[d%d];' % (i + 1, ms, ms, i); labels += '[d%d]' % i
    t += durs[i]
fc += '[0]' + labels + 'amix=inputs=%d:duration=first:normalize=0[a]' % (len(order) + 1)
run(ins + ['-filter_complex', fc, '-map', '[a]', os.path.join(OUT, 'B_audio.wav')])
run(['-i', os.path.join(OUT, 'B_video.mp4'), '-i', os.path.join(OUT, 'B_audio.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy'] + ENC[6:] + [seg('B')])
print('chapters %.1f s, %d slides' % (total, len(order)))

# whole film
still(os.path.join(K, 'end.png'), 5.0, seg('07_end'), fade=0.5)
parts = [seg('01_open'), seg('02a'), seg('02b'), seg('02c'), seg('02d'), os.path.join(OUT, 'zones.mp4'), seg('B'), seg('07_end')]
concat(parts, seg('film51_raw'))
final = os.path.join(HERE, 'aircraftdefects-v5.mp4')
run(['-i', seg('film51_raw'), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-c:v', 'copy'] + ENC[6:] + [final])
print('film', probe(final))
