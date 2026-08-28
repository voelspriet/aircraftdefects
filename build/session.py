#!/usr/bin/env python3
"""The build session, run the way the article describes it.

It starts with the same question Henk asked on day one, verbatim, and continues
one turn at a time. Every turn is written to build/ with its reasoning trace, so
the record of how the tool was designed is the tool's own history rather than a
retelling of it.

Nothing here is a long prompt written by a human. Each turn is a short, plain
sentence, and the model does the thinking.
"""
import json, os, pathlib, sys, time
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()

URL = "https://api.z.ai/api/paas/v4/chat/completions"
MODEL = "glm-5.3-flash"
STATE = HERE / "_conversation.json"

# The published account of how the first version was built. Given as context so
# the model knows what already exists and does not propose it again.
ARTICLE = (HERE / "article.txt").read_text()[:60000]

OPENING = """Here is a published account of a tool I built on the FAA Service
Difficulty Report database, and what happened while building it.

---
%s
---

The database is live at aircraftdefects.com with a public JSON API, no auth:
/api/search (filters: q, operator, make, model, tail, part, condition, stage,
discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours, from,
to, limit, offset), /api/hero, /api/glossary, /api/facets, /api/clusters,
/api/trend, /api/ageing, /api/engines, /api/corrosion, /api/leads, /api/spikes,
/api/phrases, /api/aircraft/<tail>. Records carry OperatorControlNumber as an id.
It now holds 1,757,828 reports from 1995, on 54,634 aircraft.

Now, my first question again, the one I opened with:

Can I use the FAA database to answer the questions when where what who?"""


def turn(name, user_text, effort="max", max_tokens=16000):
    msgs = json.loads(STATE.read_text()) if STATE.exists() else []
    msgs.append({"role": "user", "content": user_text})
    body = {"model": MODEL, "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens, "messages": msgs}
    t0 = time.time()
    r = requests.post(URL, json=body, timeout=1800, headers={
        "Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
        "Content-Type": "application/json"})
    if r.status_code != 200:
        print("  %s FAILED %s %s" % (name, r.status_code, r.text[:300])); return None
    m = r.json()["choices"][0]["message"]
    text = m.get("content") or ""
    (HERE / (name + ".md")).write_text(text)
    if m.get("reasoning_content"):
        (HERE / (name + ".reasoning.md")).write_text(m["reasoning_content"])
    (HERE / (name + ".asked.txt")).write_text(user_text)
    msgs.append({"role": "assistant", "content": text})
    STATE.write_text(json.dumps(msgs))
    print("  %-30s %6.1fs  %6d chars" % (name, time.time() - t0, len(text)))
    return text


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        STATE.unlink(missing_ok=True); print("conversation reset")
    name = sys.argv[1] if len(sys.argv) > 1 else "01-when-where-what-who"
    text = OPENING % ARTICLE if name == "01-when-where-what-who" else sys.stdin.read()
    out = turn(name, text)
    if out:
        print("\n" + out[:4000])
