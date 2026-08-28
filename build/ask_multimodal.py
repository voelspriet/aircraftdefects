#!/usr/bin/env python3
"""Prewash again, this time on the part of the model nothing here uses yet.

Everything built so far treats GLM-5.3-Flash as a very good reader of text. Its
vendor documentation says the input is video, image, text and file, and that the
visual capability is built into the loop rather than bolted on. None of that is
being used, and the short line below does not suggest what it should be used for.

Same method: the human types one short sentence asking for a prompt. The model
writes the prompt. Then execute prompt. Then stated versus inferred.
"""
import json, os, pathlib, sys, time
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
URL = "https://api.z.ai/api/paas/v4/chat/completions"

SOURCE = """
SOURCE MATERIAL

Dataset: FAA Service Difficulty Reports, 1995 to present. 1,757,828 records,
54,634 aircraft by tail number, 3,945 operator designators. Filed by mechanics
when a component fails, malfunctions or is found defective. Public, no auth.

76 columns. Coded fields resolve against FAA lookup tables. Discrepancy is free
text written by the filer, present in most records, in trade shorthand.

What is already built on it, all text only:
- Filtered search over coded fields, full text search over Discrepancy.
- Four drawn views of a selection: month by month; a side view of an aircraft
  shaded by how often each zone is written up; airline and tail; what the crew
  was forced to do.
- Per record, a plain-English account of the write-up, produced by GLM-5.3-Flash,
  which may abstain, and which lists every abbreviation with whether the meaning
  came from the record or from the model's own knowledge.
- A notice when a coded field contradicts the same filer's narrative. Measured on
  200 long reports: 29 flagged, calibration in progress.
- A separate tool that reads a photographed FAA form and decodes the boxes.

What the dataset does not contain: fleet size, fleet flying hours, cause of a
defect, accident records, any image, any drawing, any attachment.

Documented capabilities of GLM-5.3-Flash, from the vendor:
- Input: video, image, text, file. Output: text.
- Context 1,000,000 tokens. Maximum output 128,000 tokens.
- 320B parameters, 18B active. Sparse and linear attention: attention compute and
  KV cache reduced 3.01x and 4.44x versus GLM-5.3, so long context is cheap.
- Vendor states visual capability is inside the working loop: the model observes
  interfaces, rendered results and interaction feedback, and coordinates tasks
  across code, browsers and GUIs.
- Reasoning always on, at low, high or max. Function calling. Structured output
  to JSON schema. Context caching. Streaming and tool streaming.

Users: investigative journalists; researchers and safety analysts; relatives of
people who died in aviation accidents.
"""

PREWASH = "Give me a prompt to work out what the visual and file capabilities could do here."
GROUND = ("Take your previous answer and mark each sentence as either stated in the source "
          "material or inferred by you. For anything inferred, say it is not established by "
          "the source.")


def turn(name, msgs, mx=20000):
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "max", "max_tokens": mx, "messages": msgs}
    t0 = time.time()
    r = requests.post(URL, json=body, timeout=3600, headers={
        "Authorization": "Bearer " + os.environ["ZAI_API_KEY"], "Content-Type": "application/json"})
    if r.status_code != 200:
        print("  %s FAILED %s %s" % (name, r.status_code, r.text[:250])); return None
    m = r.json()["choices"][0]["message"]
    txt = m.get("content") or ""
    (HERE / (name + ".md")).write_text(txt)
    if m.get("reasoning_content"):
        (HERE / (name + ".reasoning.md")).write_text(m["reasoning_content"])
    print("  %-34s %6.1fs  %6d chars" % (name, time.time() - t0, len(txt)))
    return txt


if __name__ == "__main__":
    msgs = [{"role": "user", "content": SOURCE + "\n\n" + PREWASH}]
    print("STEP 1  the model writes the prompt")
    p = turn("mm-01-prompt-the-model-wrote", msgs)
    if not p: sys.exit(1)
    msgs += [{"role": "assistant", "content": p}, {"role": "user", "content": "execute prompt"}]
    print("STEP 2  execute prompt")
    a = turn("mm-02-answer", msgs)
    if not a: sys.exit(1)
    msgs += [{"role": "assistant", "content": a}, {"role": "user", "content": GROUND}]
    print("STEP 3  stated versus inferred")
    turn("mm-03-stated-vs-inferred", msgs)
    print("\nwritten to build/")
