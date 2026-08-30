#!/usr/bin/env python3
"""Film v4 at 2560x1440, crisp: shots from cap4 (screencast PNG frames). Site shots come from cap3 (beats recorded in real
time); each sentence starts at the mark written when its element was framed;
the only thing cut is the model's waiting time between a click and its answer."""
import json, os, subprocess, sys
import build
from build import HERE, V, K, CL, OUT, ENC, run, probe, seg, still, concat, final

W, H = 2560, 1440
build.VF = 'scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p' % (W, H, W, H)
VF = build.VF
C3 = os.path.join(HERE, 'cap4')
DEAD = 2.5   # seconds a wait is shown for

def marks(name):
    return json.load(open(os.path.join(C3, name + '.json')))

def timeline(mk, total):
    """Return (pieces, f) where pieces are (start, end, speed) and f maps an
    original time to the compressed time."""
    pieces = []; t = 0.0; waits = []
    pend = None
    for s, w in mk:
        if w.startswith('wait '): pend = s
        elif w.startswith('done ') and pend is not None:
            if s - pend > DEAD + 0.5: waits.append((pend, s))
            pend = None
    for a, b in waits:
        pieces.append((t, a, 1.0)); pieces.append((a, b, DEAD / (b - a))); t = b
    pieces.append((t, total, 1.0))
    def f(x):
        out = 0.0
        for a, b, sp in pieces:
            if x <= a: break
            out += (min(x, b) - a) * sp
        return out
    return pieces, f

def shot(name):
    src = os.path.join(C3, name + '.mp4'); mk = marks(name); total = probe(src)
    pieces, f = timeline(mk, total)
    # video
    fc = ''; n = 0
    for a, b, sp in pieces:
        if b - a < 0.04: continue
        fc += '[0:v]trim=start=%.3f:end=%.3f,setpts=(PTS-STARTPTS)*%.5f[p%d];' % (a, b, sp, n); n += 1
    fc += ''.join('[p%d]' % i for i in range(n)) + 'concat=n=%d:v=1:a=0,%s[v]' % (n, VF)
    vout = os.path.join(OUT, name + '_v.mp4')
    run(['-i', src, '-filter_complex', fc, '-map', '[v]', '-an'] + ENC[:8] + [vout])
    length = probe(vout)
    # voice: each beat placed at f(mark)
    beats = [(f(s), w.split()[1]) for s, w in mk if w.startswith('beat ')]
    ins = ['-f', 'lavfi', '-t', '%.3f' % length, '-i', 'anullsrc=r=48000:cl=stereo']
    fc = ''; labels = ''
    for i, (t, k) in enumerate(beats):
        ins += ['-i', os.path.join(V, k + '.wav')]
        fc += '[%d]adelay=%d|%d[d%d];' % (i + 1, int(t * 1000), int(t * 1000), i); labels += '[d%d]' % i
    fc += '[0]' + labels + 'amix=inputs=%d:duration=first:normalize=0[a]' % (len(beats) + 1)
    aout = os.path.join(OUT, name + '_a.wav'); run(ins + ['-filter_complex', fc, '-map', '[a]', aout])
    out = seg(name); run(['-i', vout, '-i', aout, '-map', '0:v', '-map', '1:a', '-t', '%.3f' % length] + ENC + [out])
    print('  %s: %.1fs (was %.1fs), beats at %s' % (name, length, total, ', '.join('%.0f' % t for t, _ in beats)))
    return out

def main():
    build.build_open(); build.build_why()
    order = ['01_open', '02a', '02b', '02c', '02d', 'zones']
    for name in ['s3', 's4a', 's4b', 's4c', 's4e', 's4f', 's5', 's6']:
        shot(name); order.append(name)
    still(os.path.join(K, 'end.png'), 5.0, seg('07_end'), fade=0.5); order.append('07_end')
    concat([seg(n) for n in order], seg('film_raw'))
    out = os.path.join(HERE, 'aircraftdefects-z.mp4')
    run(['-i', seg('film_raw'), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-c:v', 'copy'] + ENC[6:] + [out])
    print('film', probe(out), 's')

if __name__ == '__main__':
    main()
