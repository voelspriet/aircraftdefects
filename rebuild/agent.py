#!/usr/bin/env python3
"""GLM with its own eyes.

Every fault of the last two days was of one kind: the model wrote code for a
page it could not look at. `.vgroup` where the page says `.vg`. A flex-basis
that became a height because the page had already set the axis. The code was
never wrong in its reasoning; it was written blind.

This gives it the browser. It writes a block, ships it, drives a real Chromium
against the live page and against the original, reads the numbers back, and
fixes itself. The loop the parent tool was built in, with the model closing it
instead of a person.

Usage: agent.py <name> <brief-file> [max-steps]
"""
import json, os, pathlib, subprocess, sys, time
import requests
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()
URL = "https://api.z.ai/api/paas/v4/chat/completions"
CLONE  = "https://aircraftdefects.com/z/"
PARENT = "https://aircraftdefects.com/"

TOOLS = [
 {"type":"function","function":{"name":"measure","description":
  "Run a JavaScript expression in a real browser against the rebuild and return "
  "what it evaluates to. The page is fully loaded first. Use it to read computed "
  "styles, element heights, class names, counts, anything the DOM knows.",
  "parameters":{"type":"object","properties":{
    "js":{"type":"string","description":"A JavaScript arrow function taking no arguments, e.g. \"()=>document.body.scrollHeight\". It must return something JSON can carry."},
    "width":{"type":"integer","description":"Viewport width in pixels. 1440 for desktop, 390 for phone. Default 1440."},
    "query":{"type":"string","description":"Optional query string to open the page with, e.g. \"?zone=ZONE+500&hero=whose\"."}},
   "required":["js"]}}},
 {"type":"function","function":{"name":"parent","description":
  "The same, against the original tool at aircraftdefects.com. Use it to read the "
  "measure you are trying to match rather than guessing it.",
  "parameters":{"type":"object","properties":{
    "js":{"type":"string"},"width":{"type":"integer"},"query":{"type":"string"}},
   "required":["js"]}}},
 {"type":"function","function":{"name":"deploy","description":
  "Splice your CSS and JavaScript into the rebuild, publish it, and return any "
  "page errors it throws. Your block replaces whatever you deployed before, so "
  "send it whole every time. Deploy as often as you like; it takes about twenty "
  "seconds.",
  "parameters":{"type":"object","properties":{
    "css":{"type":"string","description":"The stylesheet, no <style> tags."},
    "js":{"type":"string","description":"The script, no <script> tags. It runs at the end of the page inside its own IIFE."}},
   "required":["css","js"]}}},
 {"type":"function","function":{"name":"done","description":
  "Call this when the checks in the brief pass, or when you are certain you "
  "cannot make them pass, and say which.",
  "parameters":{"type":"object","properties":{
    "summary":{"type":"string","description":"What you changed and what it now measures."}},
   "required":["summary"]}}}]


class Eyes:
    """One browser, held open, because launching Chromium per call costs more
    than every measurement in a round put together."""
    def __init__(self):
        self.p = sync_playwright().start()
        self.b = self.p.chromium.launch()

    def run(self, url, js, width=1440, query=""):
        pg = self.b.new_page(viewport={"width": int(width or 1440), "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        try:
            pg.goto(url + (query or ""), wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(6000)
            val = pg.evaluate(js)
        except Exception as e:
            val = {"error": str(e)[:300]}
        finally:
            pg.close()
        out = {"value": val}
        if errs:
            out["pageErrors"] = errs[:5]
        return out

    def close(self):
        self.b.close(); self.p.stop()


def deploy(name, css, js):
    (HERE / (name + "-css.css")).write_text(css or "")
    (HERE / (name + "-dom.js")).write_text(js or "")
    bl = HERE / "build_all.py"; s = bl.read_text()
    """One agent block on the page at a time: an earlier run's block would
    otherwise keep shipping underneath this one and the two would argue."""
    import re as _re
    s = _re.sub(r'\n *\("\d+-dom\.js",\s+"\d+: written with its own eyes"\),', "", s)
    s = _re.sub(r'CSS    = \[([^\]]*)\]',
                lambda m: 'CSS    = [%s]' % ", ".join(
                    x for x in [y.strip() for y in m.group(1).split(",")]
                    if x and not _re.match(r'"\d+-css\.css"', x)), s, count=1)
    tag = '("%s-dom.js"' % name
    if tag not in s:
        s = s.replace('          (("10-guidance.md", "js")',
                      '          ("%s-dom.js",     "%s: written with its own eyes"),\n          (("10-guidance.md", "js")' % (name, name))
        s = s.replace(']\nCSS', ']\nCSS')  # no-op, keeps the shape readable
        import re
        s = re.sub(r'CSS    = \[([^\]]*)\]',
                   lambda m: 'CSS    = [%s, "%s-css.css"]' % (m.group(1), name), s, count=1)
        bl.write_text(s)
    r1 = subprocess.run([sys.executable, "build_all.py"], cwd=HERE, capture_output=True, text=True)
    if r1.returncode:
        return {"ok": False, "where": "build", "error": r1.stderr[-800:]}
    r2 = subprocess.run(["node", "--check", "bridge.js"], cwd=HERE, capture_output=True, text=True)
    if r2.returncode:
        return {"ok": False, "where": "syntax", "error": (r2.stderr or r2.stdout)[-800:]}
    r3 = subprocess.run(["bash", "respice.sh"], cwd=HERE, capture_output=True, text=True)
    if r3.returncode:
        return {"ok": False, "where": "publish", "error": r3.stderr[-800:]}
    return {"ok": True, "note": "published to " + CLONE}


def stream(body):
    """Streaming, because a silent socket is what the two gateway 502s were."""
    text = []; think = 0; calls = {}
    for attempt in range(4):
        r = requests.post(URL, json=body, timeout=5400, stream=True, headers={
            "Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
            "Content-Type": "application/json"})
        if r.status_code != 200:
            print("   %s, opnieuw" % r.status_code, flush=True)
            time.sleep(20 + attempt * 20); continue
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"): continue
            c = line[5:].strip()
            if c == "[DONE]": break
            try: d = json.loads(c)
            except ValueError: continue
            for ch in d.get("choices", []):
                delta = ch.get("delta") or {}
                if delta.get("reasoning_content"): think += len(delta["reasoning_content"])
                if delta.get("content"): text.append(delta["content"])
                for tc in (delta.get("tool_calls") or []):
                    i = tc.get("index", 0)
                    slot = calls.setdefault(i, {"id": "", "name": "", "args": ""})
                    if tc.get("id"): slot["id"] = tc["id"]
                    fn = tc.get("function") or {}
                    if fn.get("name"): slot["name"] = fn["name"]
                    if fn.get("arguments"): slot["args"] += fn["arguments"]
        return "".join(text), [calls[k] for k in sorted(calls)], think
    return "", [], think


def main():
    name, brief = sys.argv[1], sys.argv[2]
    steps = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    msgs = [{"role": "user", "content": pathlib.Path(brief).read_text()}]
    eyes = Eyes(); t0 = time.time()
    try:
        for step in range(steps):
            body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
                    "thinking": {"type": "enabled", "clear_thinking": False},
                    "reasoning_effort": "high", "max_tokens": 96000, "stream": True,
                    "tools": TOOLS, "messages": msgs}
            text, calls, think = stream(body)
            print("[%4ds] stap %d: dacht %d, schreef %d, %d tool-calls"
                  % (time.time() - t0, step + 1, think, len(text), len(calls)), flush=True)
            msgs.append({"role": "assistant", "content": text,
                         "tool_calls": [{"id": c["id"], "type": "function",
                                         "function": {"name": c["name"], "arguments": c["args"]}}
                                        for c in calls]} if calls else
                        {"role": "assistant", "content": text})
            if not calls:
                print(text[-1500:]); break
            for c in calls:
                try: a = json.loads(c["args"] or "{}")
                except ValueError: a = {}
                if c["name"] == "measure":
                    res = eyes.run(CLONE, a.get("js", "()=>null"), a.get("width", 1440), a.get("query", ""))
                elif c["name"] == "parent":
                    res = eyes.run(PARENT, a.get("js", "()=>null"), a.get("width", 1440), a.get("query", ""))
                elif c["name"] == "deploy":
                    res = deploy(name, a.get("css", ""), a.get("js", ""))
                elif c["name"] == "done":
                    print("KLAAR:", a.get("summary", "")); return
                else:
                    res = {"error": "no such tool"}
                short = json.dumps(res)[:4000]
                print("   %-8s %s" % (c["name"], short[:160]), flush=True)
                msgs.append({"role": "tool", "tool_call_id": c["id"], "content": short})
    finally:
        eyes.close()
        pathlib.Path(HERE / (name + ".transcript.json")).write_text(json.dumps(msgs, indent=1)[:2000000])


if __name__ == "__main__":
    main()
