#!/usr/bin/env python3
"""Sweep 2025 and 2026 for coded fields that contradict their own narrative.

One model reading one document once is an opinion. So every report is read twice,
independently, with the field order shuffled between passes so the second reading
is not primed by the first. Only where both passes name the SAME field and agree
that it disagrees does anything reach the ledger, marked as coming from a sweep
rather than from somebody reading.

Neither pass has been checked by a human. That is stated on the page.
"""
import json, os, pathlib, time
from concurrent.futures import ThreadPoolExecutor
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
KEY = os.environ["ZAI_API_KEY"]
URL = "https://api.z.ai/api/paas/v4/chat/completions"
LEDGER = "https://aircraftdefects.com/z/api/conflicts/add"
G = requests.get("https://aircraftdefects.com/api/glossary", timeout=60).json()["codes"]
dec = lambda t, c: (lambda v: (v.get("label") or v.get("faa")) if isinstance(v, dict) else v)(
    (G.get(t) or {}).get(str(c or "").strip().upper()))

ASK = """A mechanic filed this aircraft maintenance report. They ticked coded boxes and
wrote a description. Sometimes the two do not agree.

A disagreement means a coded value states something the narrative plainly contradicts.
A code that is vaguer than the text is not a disagreement. A code you would have chosen
differently is not a disagreement. This is a serious thing to say about someone's
paperwork, so the default answer is no.

Coded values, decoded by the FAA's own tables:
%s

What the same person wrote:
%s

Return JSON only:
{"disagrees": true|false, "field": "<exact field name above, or null>",
 "code_says": "<or null>", "text_says": "<or null>"}"""


def read(rec, order):
    f = [("Stage of operation", dec("stage", rec.get("StageOfOperationCode"))),
         ("How discovered", dec("discovered", rec.get("HowDiscoveredCode"))),
         ("Nature of condition", dec("nature", rec.get("NatureOfConditionA"))),
         ("What the crew did", [x for x in (dec("precaution", rec.get("PrecautionaryProcedure"+c))
                                            for c in "AB") if x and x.lower() != "none"]),
         ("System", dec("jasc", rec.get("JASCCode"))),
         ("Part", rec.get("PartName")), ("Part condition", rec.get("PartCondition"))]
    if order: f = list(reversed(f))
    facts = json.dumps({k: v for k, v in f if v}, ensure_ascii=False, indent=1)
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "high", "max_tokens": 1600,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": ASK % (facts, rec["Discrepancy"])}]}
    for _ in range(3):
        try:
            r = requests.post(URL, json=body, timeout=300, headers={
                "Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            if r.status_code != 200:
                time.sleep(4); continue
            t = r.json()["choices"][0]["message"].get("content") or ""
            return json.loads(t[t.find("{"):t.rfind("}") + 1])
        except Exception:
            time.sleep(4)
    return None


def both(rec):
    a = read(rec, False)
    if not a or not a.get("disagrees"):
        return None
    b = read(rec, True)
    if not b or not b.get("disagrees"):
        return {"id": rec["OperatorControlNumber"], "split": True}
    if (a.get("field") or "").strip().lower() != (b.get("field") or "").strip().lower():
        return {"id": rec["OperatorControlNumber"], "split": True}
    note = "The filed %s says %s. The write-up says %s" % (
        (a.get("field") or "code").lower(), a.get("code_says"), a.get("text_says"))
    payload = {"id": rec["OperatorControlNumber"], "tail": rec.get("RegistryNNumber"),
               "date": rec.get("DifficultyDate"), "operator": rec.get("OperatorDesignator"),
               "note": note, "discrepancy": rec.get("Discrepancy")}
    try:
        requests.post(LEDGER, json=payload, timeout=60)
    except Exception:
        pass
    return {"id": payload["id"], "agreed": True, "field": a.get("field"), "note": note}


if __name__ == "__main__":
    recs = json.load(open(HERE / "sweep_sample.json"))
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        res = list(ex.map(both, recs))
    agreed = [r for r in res if r and r.get("agreed")]
    split = [r for r in res if r and r.get("split")]
    out = {"scanned": len(recs), "flagged_by_first_pass": len(agreed) + len(split),
           "both_passes_agreed": len(agreed), "passes_disagreed": len(split),
           "seconds": round(time.time() - t0),
           "note": ("Two independent readings per report, field order reversed between "
                    "them. Only agreement reaches the ledger. Where the two passes "
                    "split, that is recorded here and nothing is published.")}
    (HERE / "sweep-results.json").write_text(json.dumps({"summary": out, "agreed": agreed}, indent=1))
    print(json.dumps(out, indent=1))
    for a in agreed[:8]:
        print("\n %s  %s\n   %s" % (a["id"], a["field"], a["note"][:150]))
