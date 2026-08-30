#!/usr/bin/env python3
"""Sweep 2025 and 2026 for reports where the coded boxes disagree with the
write-up. Two independent model passes per record; only when both name the
same field is anything posted, marked source=scan, per the standing rule."""
import json, os, ssl, sys, time, urllib.request, certifi
CTX = ssl.create_default_context(cafile=certifi.where())
ZAI = "https://api.z.ai/api/paas/v4/chat/completions"
KEY = [l.split('=',1)[1].strip() for l in open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','.env')) if l.startswith('ZAI_API_KEY=')][0]
BASE = "https://aircraftdefects.com"

def get(path):
    return json.load(urllib.request.urlopen(BASE+path, context=CTX, timeout=60))
def post(path, body):
    req = urllib.request.Request(BASE+path, data=json.dumps(body).encode(), headers={'Content-Type':'application/json'})
    return json.load(urllib.request.urlopen(req, context=CTX, timeout=60))
def glm(prompt):
    body={"model":"glm-5.3-flash","temperature":1,"top_p":0.95,"reasoning_effort":"low","max_tokens":900,
          "thinking":{"type":"enabled","clear_thinking":False},
          "messages":[{"role":"user","content":prompt}],"response_format":{"type":"json_object"}}
    req=urllib.request.Request(ZAI,data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    d=json.load(urllib.request.urlopen(req,context=CTX,timeout=180))
    txt=d["choices"][0]["message"]["content"]
    return json.loads(txt)

CREW={"A":"unscheduled landing","B":"emergency descent","C":"aborted take-off","D":"aborted approach","E":"engine shutdown in flight","F":"fire extinguisher fired","G":"oxygen masks dropped","I":"cabin lost pressure","J":"fuel dumped","K":"none, the crew took no listed action","L":"aborted approach","O":"other","R":"autorotation"}
NATURE={"B":"smoke, fumes, odour or sparks","D":"in-flight separation","F":"fire or burning","L":"fluid loss","Y":"engine stoppage or flameout"}

PROMPT=("You are checking one FAA service difficulty report for INTERNAL disagreement between its coded boxes and the "
        "mechanic's write-up. Codes on this report: crew action = %s (%s); nature codes = %s. The write-up, verbatim:\n%s\n\n"
        "Does the write-up clearly state something the codes contradict, or clearly contradict what a code asserts? "
        "Only a plain, quotable contradiction counts (for example the text says the flight diverted or declared an "
        "emergency while the crew code says none; or the text says smoke while no smoke nature code is set; or a code "
        "asserts an action the text says did not happen). Missing detail is NOT a conflict. Answer JSON only: "
        "{\"conflict\": true|false, \"field\": \"crew action\"|\"nature\"|null, \"code_says\": \"...\", "
        "\"text_says\": \"a verbatim quote of at most 15 words\", \"note\": \"one sentence naming the disagreement\"}")

def crew_str(r):
    ks=[r.get("PrecautionaryProcedure"+x) for x in "ABCD"]
    ks=[k for k in ks if k and k.strip() and k not in ("0",)]
    return ",".join(ks) or "K", "; ".join(CREW.get(k,k) for k in ks) or CREW["K"]
def nat_str(r):
    ks=[r.get("NatureOfCondition"+x) for x in "ABC"]
    ks=[k for k in ks if k and k.strip()]
    return ",".join("%s (%s)"%(k,NATURE.get(k,"other")) for k in ks) or "none set"

def candidates(year, per=40):
    out=[]
    for qq in ["DECLARED+EMERGENCY","DIVERTED","RETURNED+TO+THE+GATE","AIR+TURNBACK","SMOKE+IN+THE+CABIN","EVACUAT"]:
        d=get("/api/search?q=%s&from=%d-01-01&to=%d-12-31&limit=%d"%(qq,year,year,per))
        out+= d.get("rows") or []
    seen=set(); uniq=[]
    for r in out:
        i=r.get("OperatorControlNumber")
        if i and i not in seen: seen.add(i); uniq.append(r)
    return uniq

def scan(year, cap):
    found=0; done=0
    have={e["id"] for e in get("/z/api/conflicts")["entries"]}
    for r in candidates(year):
        if done>=cap: break
        rid=r.get("OperatorControlNumber"); text=(r.get("Discrepancy") or "").strip()
        if not text or len(text)<60 or rid in have: continue
        done+=1
        ck,cl=crew_str(r); ns=nat_str(r)
        p=PROMPT%(ck,cl,ns,text[:1600])
        try:
            a=glm(p); b=glm(p)
        except Exception as e:
            print(rid,"model error",str(e)[:80]); continue
        if a.get("conflict") and b.get("conflict") and (a.get("field")==b.get("field")) and a.get("field"):
            q=(a.get("text_says") or "").strip().strip('"')
            if q and q.upper() not in text.upper():
                print(rid,"quote not literal, dropped"); continue
            note="%s: code says %s; the write-up says \"%s\". %s"%(a["field"],a.get("code_says") or cl,q,a.get("note") or "")
            m=(r.get("DifficultyDate") or "")
            post("/z/api/conflicts/add",{"id":rid,"tail":r.get("RegistryNNumber"),"date":m,"operator":r.get("OperatorDesignator"),"note":note[:590],"discrepancy":text[:1900]})
            found+=1; print("FOUND",rid,m,note[:110])
        else:
            print(rid,"ok" if not (a.get("conflict") or b.get("conflict")) else "passes disagreed, dropped")
    print(year,"checked",done,"found",found)

if __name__=="__main__":
    cap=int(sys.argv[1]) if sys.argv[1:] else 60
    for y in (2026,2025): scan(y,cap)
