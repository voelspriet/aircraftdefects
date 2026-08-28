#!/usr/bin/env python3
"""What would it cost to put all 1,757,828 reports through the model?

The interesting claim is not four examples. It is that every report in the file
can be read, restated and checked, which has never been possible. That claim needs
a number, and the number has to be measured rather than guessed.

So: 30 reports, metered, with the real prompt the tool uses. Then extrapolate and
say plainly what the extrapolation assumes.
"""
import json, os, pathlib, statistics, time
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

RULES = """Restate this aircraft maintenance write-up in plain English, keeping every step
in the order it happened. Say only what the write-up and the decoded fields state. Never
say why it happened. If the shorthand is unreadable, abstain.

Separately, if a coded value plainly contradicts the narrative, say so in one sentence.
Default to null. Never guess.

Return JSON only:
{"plain": "<or null>", "abstained": true|false,
 "code_tension": "<or null>"}"""


def one(r):
    facts = {"Stage": dec("stage", r.get("StageOfOperationCode")),
             "How discovered": dec("discovered", r.get("HowDiscoveredCode")),
             "Nature": dec("nature", r.get("NatureOfConditionA")),
             "System": dec("jasc", r.get("JASCCode")), "Part": r.get("PartName"),
             "Part condition": r.get("PartCondition")}
    text = r["Discrepancy"]
    effort = "high" if len(text) > 400 else "low"
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": 2600 if effort == "high" else 900,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": "%s\n\nCoded values:\n%s\n\nWrite-up:\n%s"
                          % (RULES, json.dumps({k: v for k, v in facts.items() if v}), text)}]}
    t0 = time.time()
    try:
        resp = requests.post(URL, json=body, timeout=300, headers={
            "Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
        if resp.status_code != 200:
            return None
        u = resp.json().get("usage", {})
        return {"effort": effort, "chars": len(text), "seconds": round(time.time() - t0, 1),
                "prompt": u.get("prompt_tokens", 0), "completion": u.get("completion_tokens", 0),
                "total": u.get("total_tokens", 0)}
    except Exception:
        return None


if __name__ == "__main__":
    recs = json.load(open(HERE / "tension_sample.json"))[:30]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        res = [r for r in ex.map(one, recs) if r]
    wall = time.time() - t0

    tot = sum(r["total"] for r in res)
    per = tot / len(res)
    CORPUS = 1_757_828
    # These 30 are drawn from the long-narrative sample, so they are the expensive
    # end of the file. Most reports are short and run at low effort, so the true
    # average is below this. Stated as an upper bound rather than a forecast.
    out = {
        "measured_reports": len(res),
        "wall_seconds": round(wall, 1),
        "concurrency": 6,
        "seconds_per_report_at_6": round(wall / len(res), 2),
        "tokens_total": tot,
        "tokens_per_report_mean": round(per),
        "tokens_per_report_median": statistics.median(r["total"] for r in res),
        "prompt_share_pct": round(100 * sum(r["prompt"] for r in res) / tot, 1),
        "corpus": CORPUS,
        "corpus_tokens_upper_bound": round(per * CORPUS),
        "corpus_days_at_6_concurrent": round(wall / len(res) * CORPUS / 86400, 1),
        "corpus_days_at_60_concurrent": round(wall / len(res) * CORPUS / 10 / 86400, 1),
        "caveat": ("Measured on 30 reports drawn from the long-narrative sample, which is "
                   "the expensive end of the file: every one ran at high reasoning effort. "
                   "Most reports are short and run at low. This is an upper bound, not a "
                   "forecast."),
    }
    (HERE / "cost-at-scale.json").write_text(json.dumps({"summary": out, "runs": res}, indent=1))
    print(json.dumps(out, indent=1))
