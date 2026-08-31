#!/usr/bin/env python3
"""The teaser, personal and fast: sixteen scenes in about seventy seconds."""
import json, os
import build
from build import HERE, K, CL, OUT, run, probe, seg, concat
W,H=2560,1440
build.VF='scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=#f6f4ee,fps=30,format=yuv420p'%(W,H,W,H)
VF=build.VF
ENC=['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2']
V=os.path.join(HERE,'voice'); D=json.load(open(os.path.join(V,'durations.json')))
C4=os.path.join(HERE,'cap4'); SL=os.path.join(HERE,'slides'); ST=os.path.join(HERE,'states')
def piece(src,start,d,out,keep_audio=False):
    a=[] if keep_audio else ['-an']
    run(['-ss','%.3f'%start,'-t','%.3f'%d,'-i',src,'-vf',VF]+a+ENC[:8]+([] if keep_audio else [])+([out] if not keep_audio else []))
    if keep_audio: run(['-ss','%.3f'%start,'-t','%.3f'%d,'-i',src,'-vf',VF]+ENC+[out])
    return out
def still(png,d,out,fade=0.0,zoom=False):
    vf=VF+(',fade=t=in:st=0:d=%.2f'%fade if fade else '')
    run(['-loop','1','-t','%.3f'%d,'-i',png,'-vf',vf,'-an']+ENC[:8]+[out]); return out
g=0.25
L={k:D[k] for k in ['p1','p2','p3','p4','p5','p6','p7']}
S={k:L[k]+g for k in L}
plan=[]  # (name, maker) in order; section lengths enforced
def sec(voice, pieces):
    tot=S[voice]; got=sum(p[1] for p in pieces); assert abs(got-tot)<0.05, (voice,got,tot)
    plan.append((voice,pieces))
A=os.path.join(CL,'A.mp4');B=os.path.join(CL,'B.mp4');C=os.path.join(CL,'C.mp4')
s=S['p1']; sec('p1',[(('clip',B,0.0),2.3),(('clip',B,2.15),2.1),(('clip',C,0.0),2.2),(('clip',A,0.0),s-6.6)])
s=S['p2']; sec('p2',[(('cap',os.path.join(C4,'faa2.mp4'),1.0),3.0),(('cap',os.path.join(C4,'faa2.mp4'),9.5),4.5),(('cap',os.path.join(C4,'faa2.mp4'),25.0),3.4),(('still',os.path.join(K,'a.png'),0.2),s-10.9)])
s=S['p3']; sec('p3',[(('cap',os.path.join(K,'counter.webm'),0.5),5.0),(('cap',os.path.join(K,'photo_push.mp4'),0.0),3.4),(('still',os.path.join(ST,'front.png'),0.0),s-8.4)])
s=S['p4']; t=s/3; sec('p4',[(('cap',os.path.join(OUT,'z_k_upper_fuselage.mp4'),0.6),t),(('cap',os.path.join(OUT,'z_k_doors.mp4'),0.6),t),(('cap',os.path.join(OUT,'z_k_wing.mp4'),0.6),s-2*t)])
s=S['p5']; sec('p5',[(('cap',os.path.join(SL,'s_c1a.mp4'),0.0),7.0),(('cap',os.path.join(SL,'s_c2a.mp4'),0.0),s-7.0)])
s=S['p6']; sec('p6',[(('cap',os.path.join(SL,'s_c3b.mp4'),0.0),s)])
s=S['p7']; sec('p7',[(('still',os.path.join(ST,'freefall_rows.png'),0.0),3.4),(('still',os.path.join(K,'end.png'),0.3),s-3.4)])
vids=[];i=0
for voice,pieces in plan:
    for (kind,src,arg),d in pieces:
        o=seg('tz%02d'%i); i+=1
        if kind=='still': still(src,d,o,fade=arg)
        else: piece(src,arg,d,o)
        vids.append(o)
concat(vids,seg('tz_v')); total=probe(seg('tz_v'))
# soundtrack: the film's own audio under p1, then the voices in sequence
ins=['-f','lavfi','-t','%.3f'%total,'-i','anullsrc=r=48000:cl=stereo']; fc=''; lab=''; n=1
# film audio: B(0-4.4)+C, ducked
run(['-i',B,'-i',C,'-filter_complex','[0:a][1:a]concat=n=2:v=0:a=1,volume=-11dB[a]','-map','[a]',os.path.join(OUT,'tz_film.wav')])
ins+=['-i',os.path.join(OUT,'tz_film.wav')]; fc+='[1]adelay=0|0[d0];'; lab+='[d0]'
t=0.0
for j,(voice,pieces) in enumerate(plan):
    ins+=['-i',os.path.join(V,voice+'.wav')]; ms=int((t+0.15)*1000)
    fc+='[%d]adelay=%d|%d[d%d];'%(j+2,ms,ms,j+1); lab+='[d%d]'%(j+1)
    t+=S[voice]
fc+='[0]'+lab+'amix=inputs=%d:duration=first:normalize=0[a]'%(len(plan)+2)
run(ins+['-filter_complex',fc,'-map','[a]',os.path.join(OUT,'tz_a.wav')])
run(['-i',seg('tz_v'),'-i',os.path.join(OUT,'tz_a.wav'),'-map','0:v','-map','1:a','-c:v','copy']+ENC[6:]+[seg('tz_raw')])
final=os.path.join(HERE,'aircraftdefects-60.mp4')
run(['-i',seg('tz_raw'),'-af','loudnorm=I=-17:TP=-1.5:LRA=9','-c:v','copy']+ENC[6:]+[final])
print('teaser v2',probe(final),'s,',len(vids),'scenes')
