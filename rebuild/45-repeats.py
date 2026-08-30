@app.get("/z/api/repeats/<tail>")
def repeats(tail):
    """The same system written up more than once on one airframe, with the hours
    between. Whether that is a repeat finding or two unrelated events is for a
    reader to judge, so both are shown and neither is labelled. When the hours
    between cannot be shown, the note on the group says why: either the file's
    own readings contradict each other, or the file recorded no airframe hours
    on one or more of the reports. The two reasons are different facts about
    the data, so each gets its own sentence, and hours_between stays None in
    both. A group is never dropped for either reason."""
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    rows = [decorate(r) for r in (api("/api/aircraft/" + t).get("rows") or [])]
    groups = defaultdict(list)
    for r in rows:
        k = (r["system_code"] or "") + "|" + (r["part"] or "")
        if k.strip("|"):
            groups[k].append(r)

    def hours_of(x):
        """The airframe hours as the file records them, or None when it records
        none on that report. Zero counts: it is a real reading."""
        v = x.get("hours")
        if v is None:
            return None
        s = str(v).strip()
        return int(s) if s.isdigit() else None

    out = []
    for k, g in groups.items():
        if len(g) < 2:
            continue
        dated = [r for r in g if _parse_date(r["date"])]
        undated = [r for r in g if not _parse_date(r["date"])]
        dated.sort(key=lambda x: _parse_date(x["date"]))
        g = dated + undated
        vals = []
        missing = False
        for x in g:
            v = hours_of(x)
            if v is None:
                missing = True
            else:
                vals.append(v)
        hours_between = None
        note = None
        if any(b < a for a, b in zip(vals, vals[1:])):
            # the file contradicts itself: one fact about the FAA's data
            note = ("The file's own hour readings do not agree: a later report "
                    "records fewer total airframe hours than an earlier one, so the "
                    "hours between first and last cannot be shown here.")
        elif len(vals) > 1:
            # recorded and agreeing, so the number stands, zero included
            hours_between = vals[-1] - vals[0]
        elif missing:
            # the file recorded no hours on one or more reports: another fact
            note = ("The file does not record total airframe hours on one or more "
                    "of these reports, so the hours between first and last cannot "
                    "be shown here.")
        out.append({"system": g[0]["system"], "part": g[0]["part"], "times": len(g),
                    "first": dated[0]["date"] if dated else None,
                    "last": dated[-1]["date"] if dated else None,
                    "hours_between": hours_between,
                    "ids": [x["id"] for x in g], "records": g, "note": note})
    out.sort(key=lambda x: -x["times"])
    return jsonify(tail="N" + t, groups=out,
                   note="Written up more than once on this airframe. The file does not say "
                        "whether a later report is the same finding returning or a new one.")