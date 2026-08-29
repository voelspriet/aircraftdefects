"""Pull the blocks out of a model answer by its fences, never by line number.

Patching a file shifts every index after it, and a slice taken by number then
cuts the code in half. The failure is 'Unexpected end of input' and it costs a
round every time."""
import re, pathlib

def fences(md):
    out=[]; lines=pathlib.Path(md).read_text().splitlines(); i=0
    while i < len(lines):
        m = re.match(r"^```(\w*)\s*$", lines[i])
        if m:
            lang = m.group(1); j = i+1
            while j < len(lines) and not re.match(r"^```\s*$", lines[j]): j += 1
            out.append((lang, "\n".join(lines[i+1:j]))); i = j
        i += 1
    return out

def parts(md):
    """Returns (markup, css, js) whatever the model wrapped them in."""
    html=css=js=""
    for lang, body in fences(md):
        if lang == "css": css += body + "\n"; continue
        if lang in ("js","javascript"): js += body + "\n"; continue
        # an html fence may carry <style> and <script> inside it
        s = re.search(r"<style>(.*?)</style>", body, re.S)
        if s: css += s.group(1) + "\n"
        t = re.search(r"<script>(.*?)</script>", body, re.S)
        if t: js += t.group(1) + "\n"
        rest = re.sub(r"<style>.*?</style>|<script>.*?</script>", "", body, flags=re.S)
        rest = "\n".join(l for l in rest.splitlines() if l.strip())
        if rest.strip(): html += rest + "\n"
    return html, css, js
