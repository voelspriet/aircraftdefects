#!/usr/bin/env python3
"""The one-minute teaser: the film, the wall of codes, the tear-down, the model reading, the check, the plane from the film."""
import json, os, subprocess
import build
from build import HERE, K, CL, OUT, run, probe, seg, concat
W,H=2560,1440
build.VF='scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=#f6f4ee,fps=30,format=yuv420p'%(W,H,W,H)
VF=build.VF
ENC=['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2']
V=os.path.join(HERE,'voice'); D=json.load(open(os.path.join(V,'durations.json')))
C4=os.path.join(HERE,'cap4'); SL=os.path.join(HERE,'slides'); ST=os.path.join(HERE,'states')

def vid(out, cmd): run(cmd+ENC[:8]+[out]); return out
segs=[]
def still(png,d,out,fade=0.0):
    run(['-loop','1','-t','%.3f'%d,'-i',png,'-vf',VF+(',fade=t=in:st=0:d=%.2f'%fade if fade else ''),'-an']+ENC[:8]+[out]); return out
def piece(src,start,d,out):
    run(['-ss','%.3f'%start,'-t','%.3f'%d,'-i',src,'-vf',VF,'-an']+ENC[:8]+[out]); return out

# s1: the film, loud (keeps its own audio; handled separately)
run(['-i',os.path.join(CL,'B.mp4'),'-i',os.path.join(CL,'C.mp4'),'-filter_complex','[0:v]%s[v0];[1:v]%s[v1];[v0][v1]concat=n=2:v=1:a=0[v];[0:a][1:a]concat=n=2:v=0:a=1[a]'%(VF,VF),'-map','[v]','-map','[a]']+ENC+[seg('c1_open')])
open_d=probe(seg('c1_open'))
# voice-backed pieces: (voice, videomaker)
plan=[]
d=D['t1']+0.5; plan.append(('t1', piece(os.path.join(C4,'faa2.mp4'),1.0,d,seg('c2_faa')), d))
d=D['t2']+0.5; a=still(os.path.join(K,'a.png'),4.0,seg('c3a'),fade=0.3); c=piece(os.path.join(K,'counter.webm'),0.5,d-4.0,seg('c3b')); concat([a,c],seg('c3')); plan.append(('t2',seg('c3'),d))
d=D['t3']+0.5; z1=piece(os.path.join(OUT,'z_k_upper_fuselage.mp4'),0.5,d/2,seg('c4a')); z2=piece(os.path.join(OUT,'z_k_wing.mp4'),0.5,d-d/2,seg('c4b')); concat([z1,z2],seg('c4')); plan.append(('t3',seg('c4'),d))
d=D['t4']+0.5; plan.append(('t4', piece(os.path.join(SL,'s_c1a.mp4'),0,d,seg('c5')), d))
d=D['t5']+0.5; plan.append(('t5', piece(os.path.join(SL,'s_c3b.mp4'),0,d,seg('c6')), d))
d=D['t6']+0.7; f=still(os.path.join(ST,'freefall_rows.png'),3.5,seg('c7a')); e=still(os.path.join(K,'end.png'),d-3.5,seg('c7b'),fade=0.4); concat([f,e],seg('c7')); plan.append(('t6',seg('c7'),d))
# one video track for the voiced part
concat([p[1] for p in plan],seg('c_body_v'))
total=probe(seg('c_body_v'))
ins=['-f','lavfi','-t','%.3f'%total,'-i','anullsrc=r=48000:cl=stereo']; fc=''; lab=''
t=0.0
for i,(k,_,d) in enumerate(plan):
    ins+=['-i',os.path.join(V,k+'.wav')]; ms=int((t+0.1)*1000)
    fc+='[%d]adelay=%d|%d[d%d];'%(i+1,ms,ms,i); lab+='[d%d]'%i; t+=d
fc+='[0]'+lab+'amix=inputs=%d:duration=first:normalize=0[a]'%(len(plan)+1)
run(ins+['-filter_complex',fc,'-map','[a]',os.path.join(OUT,'c_body_a.wav')])
run(['-i',seg('c_body_v'),'-i',os.path.join(OUT,'c_body_a.wav'),'-map','0:v','-map','1:a','-c:v','copy']+ENC[6:]+[seg('c_body')])
concat([seg('c1_open'),seg('c_body')],seg('cut_raw'))
final=os.path.join(HERE,'aircraftdefects-60.mp4')
run(['-i',seg('cut_raw'),'-af','loudnorm=I=-17:TP=-1.5:LRA=9','-c:v','copy']+ENC[6:]+[final])
print('teaser',probe(final),'s (open %.1f)'%open_d)
