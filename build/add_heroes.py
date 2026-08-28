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

ASK = """You wrote the /z page below. It works, and it does not look like the tool it
belongs to, because it took the four rails and left the drawings behind.

=== the page you wrote, currently live at aircraftdefects.com/z ===
%s

=== drawHero() and its helpers, from the parent tool, verbatim ===
%s

=== the hero CSS from the parent ===
%s

=== the /z backend you are drawing from ===
%s

The parent already answers the same four questions and draws each one:

  when    WHEN     month by month      horizon
  where   WHERE    on the aircraft     anatomy
  whose   WHO      airline and tail    swarm
  forced  FORCED   what the crew did   ledger

Carry those four drawings into /z. Not new ones. The same shapes, the same
palette, the same restraint, so a reader moving between the two pages does not
feel they have changed tool.

Four things I want:

1. The visual sits at the top, above the five text sections, the way the parent
   opens on the aircraft.
2. The reader can choose which of the four to look at, and the choice is visible.
   Default to anatomy, as the parent does.
3. The drawing answers for whatever the reader asked about: a tail number, an
   airline, or an aircraft type. Not for the whole corpus.
4. Where a drawing can only place part of the selection, say so under it in the
   same size type, exactly as the parent does with the zone counts.

The /z data comes from /z/api/entity, whose shape you can see in the backend. It
gives you when.months, where.zones, where.systems, who.operators, who.aircraft,
who.types, what.nature, what.stage, forced.actions and forced.none, and each
block carries "complete" and "counted" so you can tell a full aggregate from a
sample of 400. That distinction has to stay visible.

Keep everything the page already does. The five sections, the plain-English
button, the abbreviation table, the code-disagreement notice.

Output the complete static/index.html and nothing else."""


def go():
    prompt = ASK % (read("z_page_current.html"), read("parent_hero.js"),
                    read("parent_hero.css"), read("z_app.py"))
    print("sending %s chars (~%s tokens)" % (format(len(prompt), ","), format(len(prompt)//4, ",")))
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "max", "max_tokens": 90000,
            "messages": [{"role": "user", "content": prompt}]}
    t0 = time.time()
    r = requests.post("https://api.z.ai/api/paas/v4/chat/completions", json=body, timeout=5400,
                      headers={"Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
                               "Content-Type": "application/json"})
    if r.status_code != 200:
        print("FAILED", r.status_code, r.text[:400]); return
    m = r.json()["choices"][0]["message"]
    (HERE / "page-with-heroes.md").write_text(m.get("content") or "")
    if m.get("reasoning_content"):
        (HERE / "page-with-heroes.reasoning.md").write_text(m["reasoning_content"])
    (HERE / "page-with-heroes.meta.json").write_text(json.dumps(
        {"seconds": round(time.time()-t0, 1), "usage": r.json().get("usage", {})}, indent=2))
    print("%.0fs, %s chars back" % (time.time()-t0, format(len(m.get("content") or ""), ",")))


if __name__ == "__main__":
    go()
