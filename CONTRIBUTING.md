# Contributing

This is a reading desk over a public government file. The rule the whole project
serves is that a reader must be able to see the record itself, separate from
anything this site did to it, and that every derived line names its source. Most
of what follows is that rule, made practical.

## Before you open a pull request

Run the gates. There are seven, and `build/check.sh` runs all of them.

```
bash build/check.sh
```

Two of them decide whether a change can ship:

```
python3 build/verify_presentation.py     # 21 checks: does the page work
python3 build/verify_integrity.py        # 13 checks: does it tell the truth
python3 build/verify_integrity.py --selftest
```

The self-test feeds the integrity checks a site that lies in eight specific
ways and requires every one to be caught. Run it first if you have changed a
check, because a gate nobody has watched fail is a decoration.

## What a change has to respect

**The record comes first.** Any field shown to a reader leads with the value as
the FAA file holds it, character for character. Decodings, plain-English labels
and explanations sit under it and say where they came from. A row that leads
with a lookup table's wording is a bug even when the wording is correct.

**Never invent a meaning.** A code is decoded through the FAA's own tables or it
is shown as filed and marked NOT DECODED HERE. The integrity gate traces every
FAA wording on the page back to those tables and fails on anything that appears
in none of them.

**Numbers are counted, not claimed.** `build/count_provenance.py` counts the
model's share of the served code and rewrites both `MODEL_USE.md` and
`README.md`. Run it with `--check` and it exits 1 if either has drifted.

**A caveat is not a meaning.** A statement about this site's tables or limits
gets its own line. It never appears where the explanation of a code belongs.

**A check that examines nothing must fail.** Every check reports how many things
it looked at. If yours can pass on an empty sample, it is not finished.

## Style

British spelling. No em dashes or en dashes. Comments explain why a thing is the
way it is, usually by naming the fault that made it necessary, because the next
person to touch it needs the reason more than the description.

## Reporting a fault in the data

If the site says something the FAA or NTSB file does not support, that is the
most valuable issue you can open. Include the control number or NTSB case, what
the page said, and what the file says. See `SECURITY.md` for anything that
should not be public.
