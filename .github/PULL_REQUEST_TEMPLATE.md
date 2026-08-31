**What this changes, and why**

Name the fault it fixes, not only the change it makes.

**How you know it works**

Paste what you measured. Timings, counts, before and after. The commit messages
in this repository do the same.

**Gates**

- [ ] `python3 build/verify_presentation.py` passes
- [ ] `python3 build/verify_integrity.py` passes
- [ ] `python3 build/verify_integrity.py --selftest` catches every planted lie
- [ ] `python3 build/count_provenance.py --check` is clean, or the counts were rewritten

If you changed a check rather than the site, say what you made it catch, and
show it failing before it passes.

**The rule**

- [ ] Every field shown to a reader still leads with the record as filed
- [ ] Nothing new invents a meaning: codes are decoded through the FAA's own tables or shown as filed
- [ ] No caveat about this site is printed where the meaning of a code belongs
