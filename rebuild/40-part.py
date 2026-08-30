@app.get("/z/api/part/<pn>")
def part(pn):
    from flask import request
    pn = (pn or "").strip()
    # The file behind this page cannot be searched by part number: only the
    # part NAME is searchable. The reader clicked the number, so the number
    # is what the dossier is addressed by; the name, taken from the same case
    # record the reader came from, is what the file can actually answer.
    name = (request.args.get("name") or "").strip()
    condition = (request.args.get("condition") or "").strip()

    total = None
    rows = []
    if name:
        d = api("/api/search", part=name, limit=400)
        rows = [decorate(r) for r in (d.get("rows") or [])]
        total = d.get("total")

    tails = Counter(r["tail"] for r in rows if r["tail"])
    ops = Counter(r["operator"] or r["operator_code"] for r in rows if r["operator_code"])
    years = Counter((r["date"] or "")[-4:] for r in rows if r["date"])

    # The forty most-written-up part numbers are the one place the file speaks
    # about part numbers directly. If this number is among them, its real
    # fleet-wide figures are shown; if not, that is said, never faked.
    sd = None
    if pn:
        try:
            sdraw = api("/api/same-defect")
            sdrows = sdraw.get("rows") if isinstance(sdraw, dict) else sdraw
        except Exception:
            sdrows = []
        for r in (sdrows or []):
            if str((r or {}).get("part_number") or "").strip() == pn:
                sd = {"part_number": pn,
                      "part_name": r.get("part_name") or (name or None),
                      "condition": r.get("condition") or (condition or None),
                      "reports": r.get("reports"),
                      "aircraft": r.get("aircraft"),
                      "operators": r.get("operators")}
                break

    cannot_show = ["More reports does not mean a worse part. It can mean the "
                   "part is simply more common, or fitted to more aircraft."]
    if name:
        cannot_show.append(
            'This file cannot be searched by part number, so every figure here '
            'counts the reports that name the part "%s" by name, which will '
            'include other part numbers of the same kind of part.' % name)
    else:
        cannot_show.append(
            "This file cannot be searched by part number, so no count of "
            "reports is shown for the part number itself.")

    return jsonify(part_number=pn or None, part_name=name or None,
                   condition=condition or None,
                   total=total, shown=len(rows),
                   aircraft=len(tails), operators=len(ops),
                   by_operator=[{"name": k, "n": v} for k, v in ops.most_common(12)],
                   by_year=sorted(({"year": k, "n": v} for k, v in years.items()),
                                  key=lambda x: x["year"]),
                   records=rows[:60],
                   same_defect=sd,
                   cannot_show=cannot_show)