#!/usr/bin/env python3
"""GLM rebuilds the instrument, one piece at a time.

Not a proxy to the original and not a copy of it: every line is written by
glm-5.3-flash. The original goes in as reference, because the brief is to belong
to it, and the model decides how. Each piece is spliced, driven in a browser, and
corrected by asking again with what broke. That is the loop the article describes,
with a machine in the middle instead of a person.

Usage: ask.py <piece-name> <spec-file>
"""
import json, os, pathlib, sys, time
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
URL = "https://api.z.ai/api/paas/v4/chat/completions"


def ask(name, prompt, effort="max", max_tokens=128000):
    """Everything the model is allowed to have: 128,000 output tokens, which is the
    documented maximum, at max reasoning effort.

    It was throttled before out of caution after two gateway failures, and that was
    the wrong lesson: those were silent sockets on non-streaming requests, fixed by
    streaming. The one real failure was a 40,000 budget spent entirely on thinking,
    918 seconds and not one character written, with no error because nothing had
    gone wrong. max_tokens covers the reasoning and the writing together, so a
    small budget on a large brief buys thought nobody ever reads.

    The reasoning trace is kept separately, so the split between thinking and
    writing is visible rather than inferred."""
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens, "stream": True,
            "messages": [{"role": "user", "content": prompt}]}
    t0 = time.time(); out = []; reasoning = []; last = t0
    for attempt in range(4):
        r = requests.post(URL, json=body, timeout=5400, stream=True, headers={
            "Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
            "Content-Type": "application/json"})
        if r.status_code != 200:
            print("  attempt %d: %s" % (attempt + 1, r.status_code), flush=True)
            time.sleep(25 + attempt * 20); continue
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            c = line[5:].strip()
            if c == "[DONE]":
                break
            try:
                d = json.loads(c)
            except ValueError:
                continue
            for ch in d.get("choices", []):
                delta = ch.get("delta") or {}
                think = delta.get("reasoning_content")
                if think:
                    reasoning.append(think)
                piece = delta.get("content")
                if piece:
                    out.append(piece)
            if time.time() - last > 30:
                print("    %6.0fs  thinking %s, writing %s" %
                      (time.time()-t0, format(sum(map(len, reasoning)), ","),
                       format(sum(map(len, out)), ",")), flush=True)
                last = time.time()
        break
    txt = "".join(out)
    (HERE / (name + ".md")).write_text(txt)
    if reasoning:
        (HERE / (name + ".reasoning.md")).write_text("".join(reasoning))
    (HERE / (name + ".prompt.txt")).write_text(prompt)
    print("  %s: %.0fs, thought %s chars, wrote %s chars"
          % (name, time.time()-t0, format(sum(map(len, reasoning)), ","), format(len(txt), ",")))
    return txt


if __name__ == "__main__":
    name = sys.argv[1]
    spec = pathlib.Path(sys.argv[2]).read_text()
    ask(name, spec)
