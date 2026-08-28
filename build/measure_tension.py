#!/usr/bin/env python3
"""How often does a filed code contradict the story the same person wrote?

Nobody knows, because you cannot query for it. No filter expresses "the tick box
disagrees with the paragraph". It needs something that reads both and compares,
which is the one thing a language model can do here that a database cannot.

This is a measurement, not a fact. The model's judgement is the instrument, and
the instrument is unvalidated: 200 of these need hand-labelling before the number
means anything. That check is the next job, not this one.

Sample: 200 of the 159,585 reports whose narrative runs past 400 characters and
whose stage code is a real value rather than unknown or not-reported. Deterministic,
seeded, so the same 200 come back every run.
"""
import json, os, pathlib, sys, time
from concurrent.futures import ThreadPoolExecutor
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
KEY = os.environ["ZAI_API_KEY"]
URL = "https://api.z.ai/api/paas/v4/chat/completions"
GLOSS = requests.get("https://aircraftdefects.com/api/glossary", timeout=60).json()["codes"]


def dec(t, c):
    v = (GLOSS.get(t) or {}).get(str(c or "").strip().upper())
    return (v.get("label") or v.get("faa")) if isinstance(v, dict) else v


ASK = """A mechanic filed this aircraft maintenance report. They ticked coded boxes and they
wrote a description. Sometimes the two do not agree.

Compare only what is here. Do not guess and do not be clever. A disagreement means the
coded value states something the narrative plainly contradicts, or the narrative plainly
describes something the code denies. A code being vague, or less detailed than the text,
is NOT a disagreement. Neither is a code you would personally have chosen differently.

This is a serious thing to say about someone's paperwork, so the default answer is no.

Coded values, decoded by the FAA's own tables:
%s

What the same person wrote:
%s

Return JSON only:
{"disagrees": true|false,
 "field": "<which coded field, or null>",
 "code_says": "<what the code states, or null>",
 "text_says": "<what the narrative states instead, or null>",
 "confidence": "high|low"}"""


def one(r):
    facts = {
        "Stage of operation": dec("stage", r.get("StageOfOperationCode")),
        "How discovered": dec("discovered", r.get("HowDiscoveredCode")),
        "Nature of condition": dec("nature", r.get("NatureOfConditionA")),
        "What the crew did": [x for x in (dec("precaution", r.get("PrecautionaryProcedure" + c))
                                          for c in "AB") if x and x.lower() != "none"],
        "System": dec("jasc", r.get("JASCCode")),
        "Part": r.get("PartName"), "Part condition": r.get("PartCondition"),
    }
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "high", "max_tokens": 2000,
            "messages": [{"role": "user", "content": ASK % (
                json.dumps({k: v for k, v in facts.items() if v}, ensure_ascii=False, indent=1),
                r["Discrepancy"])}]}
    for attempt in range(3):
        try:
            resp = requests.post(URL, json=body, timeout=300, headers={
                "Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            if resp.status_code != 200:
                time.sleep(3); continue
            txt = resp.json()["choices"][0]["message"].get("content") or ""
            i, j = txt.find("{"), txt.rfind("}")
            out = json.loads(txt[i:j + 1])
            out["id"] = r["OperatorControlNumber"]
            out["date"] = r["DifficultyDate"]
            out["tail"] = r["RegistryNNumber"]
            return out
        except Exception:
            time.sleep(3)
    return {"id": r["OperatorControlNumber"], "error": True}


if __name__ == "__main__":
    recs = json.load(open(HERE / "tension_sample.json"))
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        res = list(ex.map(one, recs))
    ok = [r for r in res if not r.get("error")]
    dis = [r for r in ok if r.get("disagrees")]
    high = [r for r in dis if r.get("confidence") == "high"]
    fields = {}
    for r in dis:
        fields[r.get("field") or "unnamed"] = fields.get(r.get("field") or "unnamed", 0) + 1
    summary = {
        "sampled": len(recs), "answered": len(ok), "failed": len(res) - len(ok),
        "disagreements": len(dis), "high_confidence": len(high),
        "rate_pct": round(100.0 * len(dis) / max(len(ok), 1), 1),
        "high_rate_pct": round(100.0 * len(high) / max(len(ok), 1), 1),
        "by_field": fields, "seconds": round(time.time() - t0),
        "population": 159585,
        "caveat": ("The model's judgement is the instrument and it is not yet validated. "
                   "No human has labelled these 200. Treat the rate as a reading from an "
                   "uncalibrated gauge, not as a finding."),
    }
    (HERE / "tension-results.json").write_text(json.dumps({"summary": summary, "results": res}, indent=1))
    print(json.dumps(summary, indent=1))
    for r in high[:6]:
        print("\n %s  %s\n   field: %s\n   code : %s\n   text : %s"
              % (r["id"], r["date"], r.get("field"), r.get("code_says"), r.get("text_says")))
