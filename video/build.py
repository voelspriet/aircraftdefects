#!/usr/bin/env python3
"""Assemble the v2 film. Every segment is rendered to 1920x1080 30fps h264 with
48k stereo audio, then concatenated. Screen captures are fitted to their voice:
dead waits (a click until the model finished) are compressed hard, the rest is
scaled uniformly so the visual ends with the sentence."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, 'voice'); C = os.path.join(HERE, 'cap'); K = os.path.join(HERE, 'cards'); CL = os.path.join(HERE, 'clip')
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
DUR = json.load(open(os.path.join(V, 'durations.json')))
TAIL = 0.7   # air after each voice block
VF = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p'
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2']

def run(args):
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error'] + args, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:]); raise SystemExit('ffmpeg failed')
def probe(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip())
def voice(*keys, gap=0.5):
    """Concatenate voice blocks with gaps; returns (wav, duration)."""
    name = '_'.join(keys); out = os.path.join(OUT, 'v_' + name + '.wav')
    parts = []; f = ''
    for i, k in enumerate(keys):
        parts += ['-i', os.path.join(V, k + '.wav')]
    if len(keys) == 1:
        run(['-i', os.path.join(V, keys[0] + '.wav'), '-af', 'apad=pad_dur=%.2f' % TAIL, out])
    else:
        chain = ''.join('[%d]apad=pad_dur=%.2f[a%d];' % (i, gap if i < len(keys) - 1 else TAIL, i) for i in range(len(keys)))
        chain += ''.join('[a%d]' % i for i in range(len(keys))) + 'concat=n=%d:v=0:a=1[o]' % len(keys)
        run(parts + ['-filter_complex', chain, '-map', '[o]', out])
    return out, probe(out)

def still(png, dur, out, audio=None, fade=0):
    a = ['-i', audio] if audio else ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
    vf = VF + (',fade=t=in:st=0:d=%.2f' % fade if fade else '')
    run(['-loop', '1', '-t', '%.3f' % dur, '-i', png] + a + ['-t', '%.3f' % dur, '-vf', vf, '-shortest'] + ENC + [out])

def fit(src, dur, out, audio=None, zones=None, marks=None, hold_last=True, ducked=None):
    """Fit a capture to dur seconds. zones: [(from_mark, to_mark, seconds)] intervals
    to compress to a fixed length; the rest scales uniformly. Video only from src."""
    total = probe(src); pieces = []
    t = 0.0
    m = {w: s for s, w in (marks or [])}
    for a, b, secs in (zones or []):
        ta, tb = m.get(a), m.get(b)
        if ta is None or tb is None or tb <= ta: continue
        pieces.append((t, ta, None)); pieces.append((ta, tb, secs)); t = tb
    pieces.append((t, total, None))
    fixed = sum(s for _, _, s in pieces if s); free = sum(b - a for a, b, s in pieces if not s)
    scale = max(0.05, (dur - fixed) / free) if free else 1
    fc = ''; n = 0
    for a, b, s in pieces:
        if b - a < 0.05: continue
        sp = (s / (b - a)) if s else scale
        fc += '[0:v]crop=1200:675:0:0,trim=start=%.3f:end=%.3f,setpts=(PTS-STARTPTS)*%.5f[p%d];' % (a, b, sp, n); n += 1
    fc += ''.join('[p%d]' % i for i in range(n)) + 'concat=n=%d:v=1:a=0,%s,tpad=stop_mode=clone:stop_duration=2[v]' % (n, VF)
    aud = ['-i', audio] if audio else ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
    run(['-i', src] + aud + ['-filter_complex', fc, '-map', '[v]', '-map', '1:a', '-t', '%.3f' % dur] + ENC + [out])

def clipseg(src, out, level_db=0, overlay=None, ov_from=0):
    vf = VF
    inputs = ['-i', src]
    if overlay:
        inputs += ['-loop', '1', '-t', '%.3f' % probe(src), '-i', overlay]
        fc = '[0:v]%s[b];[1:v]format=rgba,fade=t=in:st=%.2f:d=0.6:alpha=1[o];[b][o]overlay=0:0:format=auto[v]' % (VF, ov_from)
        run(inputs + ['-filter_complex', fc, '-map', '[v]', '-map', '0:a', '-af', 'volume=%ddB' % level_db] + ENC + [out])
    else:
        run(inputs + ['-vf', vf, '-af', 'volume=%ddB' % level_db] + ENC + [out])

def mix_under(video_with_audio, voice_wav, out, dur, duck_db=-14):
    """Video keeps its own audio ducked under the voice."""
    run(['-i', video_with_audio, '-i', voice_wav, '-filter_complex', '[0:a]volume=%ddB[d];[d][1:a]amix=inputs=2:duration=longest:normalize=0[a]' % duck_db,
         '-map', '0:v', '-map', '[a]', '-t', '%.3f' % dur] + ENC + [out])

def concat(files, out):
    lst = os.path.join(OUT, 'list.txt'); open(lst, 'w').write(''.join("file '%s'\n" % f for f in files))
    run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out])

def seg(name):
    return os.path.join(OUT, name + '.mp4')

def build_open():
    concat([os.path.join(CL, 'A.mp4'), os.path.join(CL, 'B.mp4')], seg('open_raw'))
    clipseg(seg('open_raw'), seg('01_open'), 0, overlay=os.path.join(K, 'title.png'), ov_from=6.0)

def build_why():
    C4 = os.path.join(HERE, 'cap4')
    def part(src, start, length, out, level=None):
        """A piece of a capture or clip, video only unless level (dB) keeps its sound."""
        if level is None:
            run(['-ss', '%.3f' % start, '-t', '%.3f' % length, '-i', src, '-f', 'lavfi', '-t', '%.3f' % length, '-i', 'anullsrc=r=48000:cl=stereo', '-vf', VF, '-map', '0:v', '-map', '1:a', '-shortest'] + ENC + [out])
        else:
            run(['-ss', '%.3f' % start, '-t', '%.3f' % length, '-i', src, '-vf', VF, '-af', 'volume=%ddB' % level] + ENC + [out])
    def assemble(pieces, voice_wav, dur, out):
        concat(pieces, out + '.v.mp4')
        run(['-i', out + '.v.mp4', '-i', voice_wav, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:normalize=0[a]', '-map', '0:v', '-map', '[a]', '-t', '%.3f' % dur] + ENC + [out])
    faa1 = os.path.join(C4, 'faa.mp4'); faa2 = os.path.join(C4, 'faa2.mp4')
    m2 = {w: t for t, w in json.load(open(os.path.join(C4, 'faa2.json')))}; m1 = {w: t for t, w in json.load(open(os.path.join(C4, 'faa.json')))}
    # 2a: the photo, four seconds; the relatives; the men looking for patterns; the government's form and its rows
    v, d = voice('2a'); c_len = probe(os.path.join(CL, 'C.mp4')); b_len = probe(os.path.join(CL, 'B.mp4'))
    run(['-t', '4.0', '-i', os.path.join(K, 'photo_push.mp4'), '-f', 'lavfi', '-t', '4.0', '-i', 'anullsrc=r=48000:cl=stereo', '-vf', VF, '-map', '0:v', '-map', '1:a', '-shortest'] + ENC + [seg('02a_1')])
    clipseg(os.path.join(CL, 'B.mp4'), seg('02a_2'), -14); clipseg(os.path.join(CL, 'C.mp4'), seg('02a_3'), -14)
    rest = d - 4.0 - b_len - c_len
    part(faa2, m2['form'] - 1.0, rest, seg('02a_4'))
    assemble([seg('02a_1'), seg('02a_2'), seg('02a_3'), seg('02a_4')], v, d, seg('02a'))
    # 2b: rows of codes scrolling, then the record's own coded form
    v, d = voice('2b'); t_rows = m2['form'] - 1.0 + rest
    part(faa2, t_rows, min(m2['scrolled'] - t_rows, d * 0.55), seg('02b_1')); part(faa2, m2['detail'] - 0.5, d - min(m2['scrolled'] - t_rows, d * 0.55), seg('02b_2'))
    assemble([seg('02b_1'), seg('02b_2')], v, d, seg('02b'))
    # 2c: the red A; the FAA rows from the film; the two rows the site returns on N704AL
    v, d = voice('2c'); a_len = probe(os.path.join(CL, 'A.mp4'))
    still(os.path.join(K, 'a.png'), 4.5, seg('02c_1'), fade=0.3); clipseg(os.path.join(CL, 'A.mp4'), seg('02c_2'), -14); part(faa1, m1['results'] - 0.3, d - 4.5 - a_len, seg('02c_3'))
    assemble([seg('02c_1'), seg('02c_2'), seg('02c_3')], v, d, seg('02c'))
    v, d = voice('2d'); run(['-i', os.path.join(K, 'counter.webm'), '-i', v, '-map', '0:v', '-map', '1:a', '-t', '%.3f' % d, '-vf', 'tpad=stop_mode=clone:stop_duration=25,' + VF] + ENC + [seg('02d')])

def marks(name):
    p = os.path.join(C, name + '.json'); return json.load(open(p)) if os.path.exists(p) else []

def have(name): return os.path.exists(os.path.join(C, name + '.webm'))
def build_site():
  if have('s3'):
    v, d = voice('3a', '3b'); fit(os.path.join(C, 's3.webm'), d, seg('03'), v)
  if have('s4a'):
    v, d = voice('4a'); fit(os.path.join(C, 's4a.webm'), d, seg('04a'), v)
  if have('s4b'):
    v, d = voice('4b'); fit(os.path.join(C, 's4b.webm'), d, seg('04b'), v, zones=[('click What actually happened', 'done #case', 6.0), ('click What should we check next', 'done #case', 4.0)], marks=marks('s4b'))
  if have('s4cd'):
    # 4c and 4d share one capture: split at "rail open"
    mk = marks('s4cd'); m = {w: s for s, w in mk}; split = m.get('rail open'); total = probe(os.path.join(C, 's4cd.webm'))
    run(['-i', os.path.join(C, 's4cd.webm'), '-t', '%.3f' % split, '-c:v', 'libx264', '-crf', '18', '-an', seg('s4c_raw')])
    run(['-ss', '%.3f' % split, '-i', os.path.join(C, 's4cd.webm'), '-c:v', 'libx264', '-crf', '18', '-an', seg('s4d_raw')])
    v, d = voice('4c'); fit(seg('s4c_raw'), d, seg('04c'), v, zones=[('click read what recurs', 'done #sumMc', 7.0)], marks=mk)
    v, d = voice('4d'); fit(seg('s4d_raw'), d, seg('04d'), v)
  if have('s4e'):
    v, d = voice('4e'); fit(os.path.join(C, 's4e.webm'), d, seg('04e'), v, zones=[('click Ask', 'done #draft', 5.0)], marks=marks('s4e'))
  if have('s4f'):
    v, d = voice('4f'); fit(os.path.join(C, 's4f.webm'), d, seg('04f'), v, zones=[('click read this aircraft end to end', 'done #sumMc', 6.0)], marks=marks('s4f'))
  if have('s5'):
    mk = marks('s5'); m = {w: s for s, w in mk}; split = m.get('write-up on screen') + 2.5
    run(['-i', os.path.join(C, 's5.webm'), '-t', '%.3f' % split, '-c:v', 'libx264', '-crf', '18', '-an', seg('s5a_raw')])
    run(['-ss', '%.3f' % split, '-i', os.path.join(C, 's5.webm'), '-c:v', 'libx264', '-crf', '18', '-an', seg('s5b_raw')])
    v, d = voice('5a'); fit(seg('s5a_raw'), d, seg('05a'), v)
    v, d = voice('5b'); fit(seg('s5b_raw'), d, seg('05b'), v, zones=[('click what the NTSB found', 'done #ff', 3.0)], marks=[(s - split, w) for s, w in mk])
  if have('s6'):
    v, d = voice('6'); fit(os.path.join(C, 's6.webm'), d, seg('06'), v)
  if True:
    still(os.path.join(K, 'end.png'), 5.0, seg('07_end'), fade=0.5)

def final():
    order = ['01_open', '02a', '02b', '02c', '02d', '03', '04a', '04b', '04c', '04d', '04e', '04f', '05', '05a', '05b', '06', '07_end']
    files = [seg(n) for n in order if os.path.exists(seg(n))]
    concat(files, seg('film_raw'))
    run(['-i', seg('film_raw'), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-c:v', 'copy'] + ENC[6:] + [os.path.join(HERE, 'aircraftdefects-z.mp4')])
    print('film', probe(os.path.join(HERE, 'aircraftdefects-z.mp4')), 's, segments:', len(files))

if __name__ == '__main__':
    what = sys.argv[1:] or ['open', 'why', 'site', 'final']
    if 'open' in what: build_open()
    if 'why' in what: build_why()
    if 'site' in what: build_site()
    if 'final' in what: final()
