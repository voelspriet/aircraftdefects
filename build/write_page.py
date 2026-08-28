#!/usr/bin/env python3
"""Give GLM the real source of the parent tool and ask it to write the /z page.

85,000 tokens of working code goes in: the parent Flask app, its 219KB single-page
front end, and the /z backend it is writing against. That is what the 1M window is
for. It is not asked to imagine the house style, it is shown it.
"""
import json, os, pathlib, time, requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
S = HERE / "source"
read = lambda n: (S / n).read_text(encoding="utf-8", errors="replace")

ASK = """Here is the complete working source of aircraftdefects.com.

=== parent app.py (Flask, serves the whole tool) ===
%s

=== parent static/index.html (the entire front end) ===
%s

=== the new backend you are writing a page for, /z ===
%s

Read the parent front end properly. Its voice, its restraint, the way it says what
it cannot show in the same size type as everything else: that is the house style
and the new page has to belong to it.

What I want on /z, and it is a different question from the parent tool.

The parent answers "which reports match these filters". That is a lookup. I want
one thing in, and five answers out, in the order a reporter actually asks them:

  WHEN            month by month, over the whole span
  WHERE           where on the aircraft
  WHO             which airline, which aircraft
  WHAT            what was found
  WHAT IT FORCED  what the defect made the crew do

The fifth is the one that matters most and the one the FAA buries hardest. It is
its own question, not a footnote under WHAT.

The one thing can be a tail number, an airline, or an aircraft type. Same five
answers each time.

Every FAA code on the page must be explained where it appears. Nobody should have
to go and look up what B or IN or ZONE 700 means. The codes and their meanings are
in /z/api/codes and in the record fields already.

Some counts are complete and some are from a sample of 400. The endpoint marks
which is which with a "complete" flag and a "counted" number. That difference has
to be visible on the page, not smoothed over.

Write the complete static/index.html for /z. Single file, no build step, no
libraries, vanilla JS, same fonts and palette as the parent. Endpoints available:
/z/api/entity?kind=tail|operator|make&v=...&model=..., /z/api/gloss (POST a record,
returns a plain-English line or an abstention), /z/api/codes, /z/api/summary/<tail>,
/z/api/repeats/<tail>, /z/api/export/<tail>.csv.

Keep the "Say this in plain English" button on individual records. That is the
best thing on the page.

Output the file and nothing else."""


def go():
    prompt = ASK % (read("parent_app.py"), read("parent_index.html"), read("z_app.py"))
    print("sending %s chars (~%s tokens)" % (format(len(prompt), ","), format(len(prompt)//4, ",")))
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "max", "max_tokens": 64000,
            "messages": [{"role": "user", "content": prompt}]}
    t0 = time.time()
    r = requests.post("https://api.z.ai/api/paas/v4/chat/completions", json=body, timeout=3600,
                      headers={"Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
                               "Content-Type": "application/json"})
    if r.status_code != 200:
        print("FAILED", r.status_code, r.text[:400]); return
    m = r.json()["choices"][0]["message"]
    txt = m.get("content") or ""
    (HERE / "page-glm-wrote.md").write_text(txt)
    if m.get("reasoning_content"):
        (HERE / "page-glm-wrote.reasoning.md").write_text(m["reasoning_content"])
    (HERE / "page-glm-wrote.meta.json").write_text(json.dumps(
        {"seconds": round(time.time()-t0, 1), "usage": r.json().get("usage", {}),
         "prompt_chars": len(prompt)}, indent=2))
    print("%.0fs, %s chars back, usage %s" % (time.time()-t0, format(len(txt), ","),
                                              r.json().get("usage", {})))


if __name__ == "__main__":
    go()
