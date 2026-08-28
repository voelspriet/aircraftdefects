#!/usr/bin/env python3
"""Calibrate the instrument before anyone quotes the number.

The 14.5% came from one model reading one report and deciding. That is a claim
about someone's paperwork made by a machine with no second opinion, so it cannot
be published as it stands.

This is the check. Every one of the 29 flagged reports is put to three independent
adjudicators, each with a different job, each told to look for a reason the flag is
WRONG rather than to agree with it. A flag survives only if at least two of three
cannot break it.

It also re-reads 40 of the reports that were NOT flagged, looking for
disagreements the first pass missed. Precision without recall is half a gauge.
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
GLOSS = requests.get("https://aircraftdefects.com/api/glossary", timeout=60).json()["codes"]
dec = lambda t, c: (lambda v: (v.get("label") or v.get("faa")) if isinstance(v, dict) else v)(
    (GLOSS.get(t) or {}).get(str(c or "").strip().upper()))

LENSES = {
 "literal": """Read only what is on the page. Does the coded value state something the
narrative flatly contradicts? A code that is vaguer than the text is not a contradiction.
A code you would have chosen differently is not a contradiction.""",
 "charitable": """Assume the filer was competent and had a reason. Is there any reading of
the coded value under which it is defensible given the narrative? FAA code definitions are
broad and often cover more than their short label suggests. If a defensible reading exists,
the flag fails.""",
 "sequence": """Maintenance narratives describe events in order and a code may refer to a
different moment than the reader assumes. Stage of operation may record when the defect was
reported rather than when it began. How discovered may record the formal route rather than
who first noticed. Does the flag depend on assuming the wrong moment?""",
}

ASK = """A machine flagged this aircraft maintenance report as having a coded field that
contradicts its own written description. Your job is to try to REFUTE that flag.

%s

The flag:
  field: %s
  the code says: %s
  the text says instead: %s

The coded values, decoded by the FAA's own tables:
%s

What the filer wrote:
%s

Default to refuting. A flag should survive only if the contradiction is plain on the face
of the document.

Return JSON only:
{"flag_holds": true|false, "why": "<one sentence>"}"""

MISS = """Read this aircraft maintenance report. The filer ticked coded boxes and wrote a
description. Does any coded value state something the narrative flatly contradicts?

A code that is vaguer than the text is not a contradiction. A code you would have chosen
differently is not a contradiction. The default answer is no.

Coded values, decoded by the FAA's own tables:
%s

What the filer wrote:
%s

Return JSON only: {"disagrees": true|false, "field": "<or null>", "why": "<one sentence>"}"""


def call(prompt, effort="high", mx=1500):
    for _ in range(3):
        try:
            r = requests.post(URL, json={
                "model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
                "thinking": {"type": "enabled", "clear_thinking": False},
                "reasoning_effort": effort, "max_tokens": mx,
                "messages": [{"role": "user", "content": prompt}]}, timeout=300,
                headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            if r.status_code != 200:
                time.sleep(3); continue
            t = r.json()["choices"][0]["message"].get("content") or ""
            return json.loads(t[t.find("{"):t.rfind("}") + 1])
        except Exception:
            time.sleep(3)
    return None


def facts_of(r):
    f = {"Stage of operation": dec("stage", r.get("StageOfOperationCode")),
         "How discovered": dec("discovered", r.get("HowDiscoveredCode")),
         "Nature of condition": dec("nature", r.get("NatureOfConditionA")),
         "What the crew did": [x for x in (dec("precaution", r.get("PrecautionaryProcedure" + c))
                                           for c in "AB") if x and x.lower() != "none"],
         "System": dec("jasc", r.get("JASCCode")), "Part": r.get("PartName"),
         "Part condition": r.get("PartCondition")}
    return json.dumps({k: v for k, v in f.items() if v}, ensure_ascii=False, indent=1)


def adjudicate(job):
    rec, flag = job
    votes = {}
    for name, lens in LENSES.items():
        out = call(ASK % (lens, flag.get("field"), flag.get("code_says"),
                          flag.get("text_says"), facts_of(rec), rec["Discrepancy"]))
        votes[name] = (out or {}).get("flag_holds")
    held = sum(1 for v in votes.values() if v is True)
    return {"id": rec["OperatorControlNumber"], "field": flag.get("field"),
            "votes": votes, "held": held, "survives": held >= 2,
            "code_says": flag.get("code_says"), "text_says": flag.get("text_says")}


def recheck(rec):
    out = call(MISS % (facts_of(rec), rec["Discrepancy"]))
    return {"id": rec["OperatorControlNumber"], "missed": bool((out or {}).get("disagrees")),
            "field": (out or {}).get("field"), "why": (out or {}).get("why")}


if __name__ == "__main__":
    sample = {r["OperatorControlNumber"]: r for r in json.load(open(HERE / "tension_sample.json"))}
    first = json.load(open(HERE / "tension-results.json"))["results"]
    flagged = [r for r in first if r.get("disagrees")]
    clean = [r for r in first if not r.get("disagrees") and not r.get("error")][:40]

    print("adjudicating %d flags, three lenses each" % len(flagged))
    with ThreadPoolExecutor(max_workers=6) as ex:
        adj = list(ex.map(adjudicate, [(sample[r["id"]], r) for r in flagged if r["id"] in sample]))
    print("re-reading %d unflagged reports for misses" % len(clean))
    with ThreadPoolExecutor(max_workers=6) as ex:
        miss = list(ex.map(recheck, [sample[r["id"]] for r in clean if r["id"] in sample]))

    survived = [a for a in adj if a["survives"]]
    unanimous = [a for a in adj if a["held"] == 3]
    missed = [m for m in miss if m["missed"]]
    n_ans = len(first)
    out = {"flags_tested": len(adj), "survived": len(survived), "unanimous": len(unanimous),
           "precision_pct": round(100.0 * len(survived) / max(len(adj), 1), 1),
           "unflagged_rechecked": len(miss), "missed_on_recheck": len(missed),
           "first_pass_rate_pct": round(100.0 * len(flagged) / n_ans, 1),
           "calibrated_rate_pct": round(100.0 * len(survived) / n_ans, 1),
           "note": ("Each flag was put to three adjudicators told to refute it. A flag "
                    "survives on two of three. The unflagged recheck estimates what the "
                    "first pass missed.")}
    (HERE / "validation-results.json").write_text(json.dumps(
        {"summary": out, "adjudicated": adj, "recheck": miss}, indent=1))
    print(json.dumps(out, indent=1))
    for a in adj:
        if not a["survives"]:
            print("\n REFUTED %s (%s)  held %d/3" % (a["id"], a["field"], a["held"]))
            for k, v in a["votes"].items():
                print("   %-11s %s" % (k, v))
