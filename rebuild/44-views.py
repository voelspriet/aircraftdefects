# Existing module context (imports, decorate, api, stage_framing, app) is unchanged.
# Added: one helper, used by both views, to read the file's own MM/DD/YYYY dates.

def _parse_date(s):
    """The file's dates are MM/DD/YYYY. Returns a comparable value, or None when
    the date will not parse, so an undated report can never decide first or last."""
    try:
        return time.strptime(s, "%m/%d/%Y")
    except (TypeError, ValueError):
        return None


@app.get("/z/api/airframe/<tail>")
def airframe(tail):
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    d = api("/api/aircraft/" + t)
    rows = d.get("rows") or []
    if not rows:
        return jsonify(tail="N" + t, found=0,
                       note="No reports in this file name that tail number. That is not "
                            "evidence about the aircraft. It may never have been registered "
                            "in the United States, or nothing was ever filed."), 200
    recs = [decorate(r) for r in rows]
    dated = [r for r in recs if _parse_date(r["date"])]
    undated = [r for r in recs if not _parse_date(r["date"])]
    dated.sort(key=lambda x: _parse_date(x["date"]), reverse=True)
    recs = dated + undated
    ops = Counter(r["operator"] or r["operator_code"] for r in recs if r["operator_code"])
    return jsonify(
        tail="N" + t, found=d.get("count", len(recs)), capped=d.get("capped"),
        aircraft={"make": recs[0]["make"], "model": recs[0]["model"]},
        operators=[{"name": k, "reports": v} for k, v in ops.most_common()],
        systems=d.get("systems"),
        framing=stage_framing(rows),
        first=dated[-1]["date"] if dated else None,
        last=dated[0]["date"] if dated else None,
        records=recs,
        citation={"source": "FAA Service Difficulty Reports",
                  "url": "https://aircraftdefects.com/?tail=" + t,
                  "retrieved": time.strftime("%Y-%m-%d"),
                  "record_ids": [r["id"] for r in recs[:200]]},
        cannot_show=[
            "This file records no accidents and no causes.",
            "A write-up is a defect that was found and recorded, usually during maintenance.",
            "A long list is not evidence of an unsafe aircraft, and a short one is not "
            "evidence of a safe one.",
            "The file records an airframe's own total hours at the moment of a report, in "
            "79% of records, but never how many hours a fleet flew. So the hours "
            "between two write-ups on one aircraft can be measured, and no count "
            "here can be turned into a rate."])


@app.get("/z/api/repeats/<tail>")
def repeats(tail):
    """The same system written up more than once on one airframe, with the hours
    between. Whether that is a repeat finding or two unrelated events is for a
    reader to judge, so both are shown and neither is labelled."""
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    rows = [decorate(r) for r in (api("/api/aircraft/" + t).get("rows") or [])]
    groups = defaultdict(list)
    for r in rows:
        k = (r["system_code"] or "") + "|" + (r["part"] or "")
        if k.strip("|"):
            groups[k].append(r)
    out = []
    for k, g in groups.items():
        if len(g) < 2:
            continue
        dated = [r for r in g if _parse_date(r["date"])]
        undated = [r for r in g if not _parse_date(r["date"])]
        dated.sort(key=lambda x: _parse_date(x["date"]))
        g = dated + undated
        vals = [int(str(x["hours"])) for x in g if str(x["hours"] or "").isdigit()]
        hours_between = (vals[-1] - vals[0]) if len(vals) > 1 else None
        note = None
        if len(vals) > 1 and vals[-1] < vals[0]:
            hours_between = None
        if any(b < a for a, b in zip(vals, vals[1:])):
            note = ("The file's own hour readings do not agree: a later report "
                    "records fewer total airframe hours than an earlier one, so the "
                    "hours between first and last cannot be shown here.")
        out.append({"system": g[0]["system"], "part": g[0]["part"], "times": len(g),
                    "first": dated[0]["date"] if dated else None,
                    "last": dated[-1]["date"] if dated else None,
                    "hours_between": hours_between,
                    "ids": [x["id"] for x in g], "records": g, "note": note})
    out.sort(key=lambda x: -x["times"])
    return jsonify(tail="N" + t, groups=out,
                   note="Written up more than once on this airframe. The file does not say "
                        "whether a later report is the same finding returning or a new one.")