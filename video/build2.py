#!/usr/bin/env python3
"""Site segments, v2: each sentence starts on the screen action it describes.
A shot is cut into pieces at anchor marks; each piece keeps its own pace
(dead waits between a click and the model's answer are compressed to a few
seconds), and is held on its last frame if its sentences run longer. The voice
for a piece starts exactly at the piece's first frame."""
import json, os, subprocess, sys
from build import HERE, C, V, K, OUT, VF, ENC, run, probe, seg, still, concat, marks, have, final

def vdur(k): return probe(os.path.join(V, k + '.wav'))

def piece_audio(keys, length, out, gap=0.35):
    """Sentences back to back from t=0, padded or cut to length."""
    if not keys:
        run(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '%.3f' % length, out]); return
    ins = sum([['-i', os.path.join(V, k + '.wav')] for k in keys], [])
    fc = ''.join('[%d]apad=pad_dur=%.2f[a%d];' % (i, gap, i) for i in range(len(keys))) + ''.join('[a%d]' % i for i in range(len(keys))) + 'concat=n=%d:v=0:a=1,apad=whole_dur=%.3f,atrim=0:%.3f[o]' % (len(keys), length, length)
    run(ins + ['-filter_complex', fc, '-map', '[o]', out])

def piece_video(src, a, b, length, out, dead=None):
    """Video from a to b; dead=(da, db, secs) compresses one interval; hold the last frame to length."""
    parts = []
    if dead and dead[0] is not None and dead[1] and dead[1] > dead[0]:
        parts = [(a, dead[0], 1.0), (dead[0], dead[1], dead[2] / (dead[1] - dead[0])), (dead[1], b, 1.0)]
    else:
        parts = [(a, b, 1.0)]
    fc = ''; n = 0
    for x, y, sp in parts:
        if y - x < 0.04: continue
        fc += '[0:v]crop=1200:675:0:0,trim=start=%.3f:end=%.3f,setpts=(PTS-STARTPTS)*%.5f[p%d];' % (x, y, sp, n); n += 1
    fc += ''.join('[p%d]' % i for i in range(n)) + 'concat=n=%d:v=1:a=0,%s,tpad=stop_mode=clone:stop_duration=%.2f,trim=0:%.3f[v]' % (n, VF, max(0.1, length + 1), length)
    run(['-i', src, '-filter_complex', fc, '-map', '[v]', '-an', '-t', '%.3f' % length] + ENC[:8] + [out])

def shot(name, src, anchors, dead_zones=None, tail=0.8, min_len=None):
    """anchors: list of (mark or seconds, [voice keys]); the first anchor is the start.
    dead_zones: {piece_index: (from_mark, to_mark, secs)}."""
    mk = marks(name); m = {w: s for s, w in mk}; total = probe(src)
    def at(x): return x if isinstance(x, (int, float)) else m[x]
    times = [at(a) for a, _ in anchors] + [total]
    files = []
    for i, (a, keys) in enumerate(anchors):
        t0, t1 = times[i], times[i + 1]
        dz = (dead_zones or {}).get(i)
        dead = (m.get(dz[0]), m.get(dz[1]), dz[2]) if dz else None
        nat = t1 - t0 - ((dead[1] - dead[0] - dead[2]) if dead and dead[0] is not None and dead[1] else 0)
        need = sum(vdur(k) for k in keys) + 0.35 * max(0, len(keys) - 1) + (tail if i == len(anchors) - 1 else 0.25)
        length = max(nat, need) if keys else nat
        if i == len(anchors) - 1 and min_len: length = max(length, min_len)
        pv = os.path.join(OUT, '%s_p%d_v.mp4' % (name, i)); pa = os.path.join(OUT, '%s_p%d_a.wav' % (name, i)); pm = os.path.join(OUT, '%s_p%d.mp4' % (name, i))
        piece_video(src, t0, t1, length, pv, dead); piece_audio(keys, length, pa)
        run(['-i', pv, '-i', pa, '-map', '0:v', '-map', '1:a', '-t', '%.3f' % length] + ENC + [pm]); files.append(pm)
        print('  %s piece %d: %.1fs video, %.1fs voice -> %.1fs' % (name, i, t1 - t0, need, length))
    return files

def build():
    out = {}
    out['03'] = shot('s3', os.path.join(C, 's3.webm'), [(0, ['3a_1', '3a_2']), ('click landing gear', ['3b'])])
    out['04a'] = shot('s4a', os.path.join(C, 's4a.webm'), [(0, ['4a'])])
    out['04b'] = shot('s4b', os.path.join(C, 's4b.webm'), [(0, ['4b_1']), ('click What actually happened', ['4b_2']), ('click What should we check next', ['4b_3'])],
                      dead_zones={1: ('click What actually happened', 'done #case', 3.0), 2: ('click What should we check next', 'done #case', 3.0)})
    mk = marks('s4cd'); m = {w: s for s, w in mk}
    out['04c'] = shot('s4cd', os.path.join(C, 's4cd.webm'), [(0, ['4c_1']), ('done #sumMc', ['4c_2']), ('click a sentence', ['4c_3']), ('scroll #sumMc .next', ['4d'])],
                      dead_zones={0: ('click read what recurs', 'done #sumMc', 6.0)})
    out['04e'] = shot('s4e', os.path.join(C, 's4e.webm'), [(0, ['4e_1']), ('done #draft', ['4e_2'])], dead_zones={0: ('click Ask', 'done #draft', 4.0)})
    out['04f'] = shot('s4f', os.path.join(C, 's4f.webm'), [(0, ['4f_1']), ('done #sumMc', ['4f_2'])], dead_zones={0: ('click read this aircraft end to end', 'done #sumMc', 4.0)})
    out['05'] = shot('s5', os.path.join(C, 's5.webm'), [(0, ['5a_1']), ('click the door plug row', ['5a_2']), ('write-up on screen', ['5a_3']), ('click what the NTSB found', ['5b'])])
    out['06'] = shot('s6', os.path.join(C, 's6.webm'), [(0, ['6'])])
    for k, files in out.items():
        concat(files, seg(k))
    for stale in ['04d', '05a', '05b']:
        p = seg(stale)
        if os.path.exists(p): os.remove(p)
    still(os.path.join(K, 'end.png'), 5.0, seg('07_end'), fade=0.5)

if __name__ == '__main__':
    build(); final()
