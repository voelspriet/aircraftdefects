#!/usr/bin/env python3
"""Let the model do the parity check with its eyes.

Vendor: GLM-5.3-Flash "observes interfaces, rendered results and interaction
feedback", and the documented workflow is to compare a render against a reference
and work off the differences. That is exactly this job, so it is done that way
rather than by me reading two pages and making a list.

Three screenshots of the parent tool, one of /z, and one question.
"""
import base64, json, os, pathlib, time
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()

img = lambda n: {"type": "image_url", "image_url": {"url": "data:image/png;base64," +
                 base64.b64encode((HERE / n).read_bytes()).decode()}}

ASK = """The first three images are aircraftdefects.com, one screenshot per rail:
WHERE on the aircraft, WHEN month by month, and FORCED what the crew did.

The fourth image is a second tool at aircraftdefects.com/z, which is meant to belong
to the same instrument and answer the same five questions about one chosen thing.

Compare them as a reader would.

List what the first tool lets a person DO that the second does not. Interactions,
not decoration: things you can click, drag, take, filter, export, or follow. For
each one, say where it is in the first image and what is missing in the fourth.

Then list anything in the fourth that breaks the first one's discipline, in
wording, restraint, or how it states what it cannot show.

Rank by what a working journalist loses most by not having. Be specific and short.
No praise, no summary of what is already fine."""


def go():
    msgs = [{"role": "user", "content": [
        {"type": "text", "text": ASK},
        img("parent-anatomy.png"), img("parent-horizon.png"),
        img("parent-forced.png"), img("z-top.png")]}]
    body = {"model": "glm-5.3-flash", "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": "high", "max_tokens": 16000, "stream": True,
            "messages": msgs}
    t0 = time.time(); out = []
    # 1305 is "temporarily overloaded" and it means try again, not give up. Four
    # images at high effort is a heavy request and it will sometimes bounce.
    r = None
    for attempt in range(6):
        r = requests.post("https://api.z.ai/api/paas/v4/chat/completions", json=body,
                          timeout=3600, stream=True, headers={
                              "Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
                              "Content-Type": "application/json"})
        if r.status_code == 200:
            break
        print("  attempt %d: %s, waiting" % (attempt + 1, r.status_code), flush=True)
        time.sleep(30 + attempt * 20)
    if r.status_code != 200:
        print("FAILED", r.status_code, r.text[:300]); return
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
            piece = (ch.get("delta") or {}).get("content")
            if piece:
                out.append(piece)
    txt = "".join(out)
    (HERE / "visual-parity.md").write_text(txt)
    print("%.0fs, %s chars" % (time.time() - t0, format(len(txt), ",")))
    print(txt[:3000])


if __name__ == "__main__":
    go()
