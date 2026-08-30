#!/usr/bin/env python3
"""Catch the CSS collisions that fail in silence, the way splice.py catches the JS ones.

splice.py exists because two blocks written without knowledge of each other
collided on pct(), "which means one signature silently replacing another and a
rail quietly refusing to open, with nothing in the console." The same thing
happens in CSS and nothing was watching for it.

Measured on the built page, 30 August 2026: sixteen selectors were declared in
two different style blocks with conflicting declarations. `.mo i` took its colour
from one block and its opacity from the other, so the month strip rendered
rgba(117,111,105,.557) at opacity .85 where the parent renders rgb(216,210,198)
at opacity 1 - a combination neither block asked for. Of the 71 strings that
appear exactly once on both pages, only nine rendered identically.

There is no error for this. The later block simply wins, and it wins by position
rather than by intent.

    python3 rebuild/splice_css.py z-built.html          # report, exit 1 on a real conflict
    python3 rebuild/splice_css.py z-built.html --list   # every duplicated selector
    python3 rebuild/splice_css.py a.css b.css --prefix zz-   # namespace b's classes

A collision is only reported when two blocks set the SAME property to a
DIFFERENT value under the SAME at-rule context. Two blocks that both style
`.wu`, one at top level and one inside `@media(max-width:1100px)`, are not in
conflict, and an early version of this check called them one. Nor are two blocks
that set different properties on the same selector.
"""
import re, sys, pathlib, collections

# ----------------------------------------------------------------- parsing

def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def rules(css, block_id):
    """Yield (context, selector, {prop: value}) for every declaration block.

    `context` is the @media/@supports chain the rule sits inside, so that a rule
    under a media query is never compared against one at top level.
    """
    css = strip_comments(css)
    stack, i, n = [], 0, len(css)
    while i < n:
        brace = css.find("{", i)
        if brace == -1:
            break
        close = css.find("}", i)
        if close != -1 and close < brace:          # end of an at-rule body
            if stack:
                stack.pop()
            i = close + 1
            continue

        head = css[i:brace].strip()
        if head.startswith("@"):
            at = re.sub(r"\s+", " ", head)
            if re.match(r"@(media|supports|container|layer|scope)\b", at):
                stack.append(at)
                i = brace + 1
                continue
            # @keyframes, @font-face and friends: skip the whole body
            depth, j = 1, brace + 1
            while j < n and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            i = j
            continue

        end = css.find("}", brace)
        if end == -1:
            break
        body = css[brace + 1:end]
        decls = {}
        for part in body.split(";"):
            if ":" not in part:
                continue
            prop, _, val = part.partition(":")
            prop = prop.strip().lower()
            val = re.sub(r"\s+", " ", val.strip())
            if prop and val:
                decls[prop] = val
        ctx = " ".join(stack)
        for sel in head.split(","):
            sel = re.sub(r"\s+", " ", sel.strip())
            if sel:
                yield ctx, sel, decls, block_id
        i = end + 1


def blocks_from_html(path):
    html = pathlib.Path(path).read_text(errors="replace")
    return re.findall(r"<style[^>]*>(.*?)</style>", html, flags=re.S | re.I)


def load(path):
    p = pathlib.Path(path)
    if p.suffix.lower() in (".html", ".htm"):
        return blocks_from_html(p)
    return [p.read_text(errors="replace")]

# ----------------------------------------------------------------- checking

def collisions(sources):
    """sources: list of (label, css). Returns real conflicts and all duplicates."""
    seen = collections.defaultdict(list)          # (ctx, sel) -> [(label, decls)]
    for label, css in sources:
        for ctx, sel, decls, _ in rules(css, label):
            seen[(ctx, sel)].append((label, decls))

    conflicts, duplicates = [], []
    for (ctx, sel), entries in seen.items():
        labels = {lab for lab, _ in entries}
        if len(labels) < 2:
            continue
        duplicates.append((ctx, sel, sorted(labels)))
        # a real conflict: same property, different value, different blocks
        by_prop = collections.defaultdict(set)
        owner = collections.defaultdict(set)
        for lab, decls in entries:
            for prop, val in decls.items():
                by_prop[prop].add(val)
                owner[prop].add(lab)
        clash = {p: sorted(v) for p, v in by_prop.items()
                 if len(v) > 1 and len(owner[p]) > 1}
        if clash:
            conflicts.append((ctx, sel, sorted(labels), clash))
    return conflicts, duplicates

# ----------------------------------------------------------------- namespacing

def prefix_classes(css, prefix, skip=()):
    """Prefix every class name in `css`, so an incoming block cannot claim a name
    an earlier block already means something else by. Leave `skip` alone: the
    shared design-token classes that are meant to be common."""
    skip = set(skip)

    def sub(m):
        name = m.group(1)
        return "." + name if name in skip else "." + prefix + name

    return re.sub(r"\.(-?[_a-zA-Z][\w-]*)", sub, css)

# ----------------------------------------------------------------- cli

def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    flags = {a for a in argv[1:] if a.startswith("--")}
    prefix = next((a.split("=", 1)[1] for a in flags if a.startswith("--prefix=")), None)
    if not prefix and "--prefix" in " ".join(flags):
        prefix = None

    if not args:
        print(__doc__)
        return 2

    if prefix:
        css = pathlib.Path(args[-1]).read_text(errors="replace")
        sys.stdout.write(prefix_classes(css, prefix))
        return 0

    sources = []
    for path in args:
        for i, css in enumerate(load(path)):
            sources.append((f"{pathlib.Path(path).name}[{i}]", css))

    conflicts, duplicates = collisions(sources)

    print(f"{len(sources)} style blocks: " +
          ", ".join(f"{lab} {len(css):,} chars" for lab, css in sources))
    print(f"{len(duplicates)} selectors declared in more than one block, "
          f"{len(conflicts)} of them in genuine conflict\n")

    if "--list" in flags:
        for ctx, sel, labs in sorted(duplicates):
            where = f"  under {ctx}" if ctx else ""
            print(f"  {sel!r} in {', '.join(labs)}{where}")
        print()

    for ctx, sel, labs, clash in sorted(conflicts, key=lambda c: -len(c[3])):
        where = f"  under {ctx}" if ctx else ""
        print(f"CONFLICT  {sel!r}  ({', '.join(labs)}){where}")
        for prop, vals in sorted(clash.items()):
            print(f"    {prop}: " + "   vs   ".join(vals))
        print()

    if conflicts:
        print(f"{len(conflicts)} conflicting selectors. The later block wins each one, "
              f"by position rather than by intent.")
        return 1
    print("No two blocks set the same property to a different value.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
