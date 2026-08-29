#!/usr/bin/env python3
"""Ask GLM to put the parent tool's four visualisations into /z.

The parent already answers WHEN, WHERE, WHO and FORCED, and it draws each one:
horizon, anatomy, swarm, ledger. The /z page took the four labels and left the
drawings behind, which is why it does not look like the tool it belongs to.

So the drawing code goes in with the page it has to live in, and it is asked to
carry them across rather than invent something new.
"""
import json, os, pathlib, time, requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
S = HERE / "source"
read = lambda n: (S / n).read_text(encoding="utf-8", errors="replace")

ASK = """Here is drawHero() from aircraftdefects.com, verbatim, with its CSS.

=== drawHero() and helpers ===
%s

=== the hero CSS ===
%s

=== the data shape it must draw from ===
The /z page fetches /z/api/entity?kind=tail|operator|make&v=...  It returns:
  when.months     [{month:"1995-04", n:1}, ...] every month in the selection
  where.zones     {complete:bool, counted:int, rows:[{code:"ZONE 200",label,n}]}
  where.systems   same shape, ATA chapters
  who.operators   same shape, {code:"SWAA",label:"Southwest Airlines Co",n}
  who.aircraft    same shape, tail numbers
  who.types       same shape, "BOEING 7378H4"
  what.nature     same shape
  forced.actions  [{label:"Unscheduled landing", n:38}]
  forced.none     int
  framing.on_ground, framing.total

Do NOT rewrite any page. Write ONE self-contained JavaScript module I can paste
into an existing page, exporting a single function:

    function drawZHero(box, kind, data)

where box is a DOM element, kind is one of "horizon", "anatomy", "swarm" or
"ledger", and data is the object above. It draws that hero into that box, for the
selection, in the parent tool's own shapes and palette. Include the CSS it needs as
a string constant the module injects once.

Four rules:
- The same shapes as the parent, not new ones. Reuse its SVG paths for the aircraft.
- Where a hero can only place part of the selection, write that underneath it, in
  the same size type, exactly as the parent does.
- Where a block carries complete:false, say the count is from the sample read.
- No libraries, no build step, vanilla JS.

Output the module and nothing else. Keep it under 900 lines."""


def go():
    prompt = ASK % (read("parent_hero.js"), read("parent_hero.css"))
    print("sending %s chars (~%s tokens)" % (format(len(prompt), ","), format(len(prompt)//4, ",")))
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            # 90,000 came back as a 502 from their gateway, not from the model. 48,000 is
            # comfortably more than the 41.5KB page it wrote last time and appears to
            # sit inside whatever the gateway will hold open.
            "reasoning_effort": "high", "max_tokens": 32000,
            "messages": [{"role": "user", "content": prompt}]}
    t0 = time.time()
    r = None
    for attempt in range(3):
        r = requests.post("https://api.z.ai/api/paas/v4/chat/completions", json=body, timeout=5400,
                          headers={"Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
                                   "Content-Type": "application/json"})
        if r.status_code == 200:
            break
        print("  attempt %d: %s, retrying" % (attempt + 1, r.status_code))
        time.sleep(20)
    if r.status_code != 200:
        print("FAILED", r.status_code, r.text[:400]); return
    m = r.json()["choices"][0]["message"]
    (HERE / "hero-module.md").write_text(m.get("content") or "")
    if m.get("reasoning_content"):
        (HERE / "hero-module.reasoning.md").write_text(m["reasoning_content"])
    (HERE / "hero-module.meta.json").write_text(json.dumps(
        {"seconds": round(time.time()-t0, 1), "usage": r.json().get("usage", {})}, indent=2))
    print("%.0fs, %s chars back" % (time.time()-t0, format(len(m.get("content") or ""), ",")))


if __name__ == "__main__":
    go()
