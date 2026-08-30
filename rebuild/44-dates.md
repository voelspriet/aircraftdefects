```python
# ---------------------------------------------------------------------------
# Date handling for the two service views.
#
# Both views used to order MM/DD/YYYY strings, which made the earliest date
# whatever begins "01/" and the latest whatever begins "12/", whatever the
# year, and produced backwards ranges and negative durations. Parse each date
# once, order by the parsed value everywhere first and last are derived, and
# keep printing the date in the file's own MM/DD/YYYY so nothing else on the
# page changes shape. A record whose date will not parse must not silently
# sort to one end: it is left out of the first and last calculation and kept
# in the records it belongs to, because dropping a report is worse than not
# dating it.
# ---------------------------------------------------------------------------

from datetime import datetime


def _parse_mdy(value):
    """Parse the file's MM/DD/YYYY date. None when it will not parse."""
    try:
        return datetime.strptime((value or "").strip(), "%m/%d/%Y").date()
    except (TypeError, ValueError):
        return None


def _hours(value):
    """Airframe hours as a number, or None when the file gives none."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _fmt_hours(h):
    if h is None:
        return "unknown"
    if float(h).is_integer():
        return str(int(h))
    return ("%f" % h).rstrip("0").rstrip(".")


def _rid(record):
    return record.get("id") or record.get("report_id") or "record"


def _tail_records(tail):
    tail = (tail or "").strip().upper()
    return [r for r in RECORDS if (r.get("tail") or "").strip().upper() == tail]


@app.get("/z/api/airframe/<tail>")
def api_airframe(tail):
    recs = _tail_records(tail)

    # Parse each date once. A record whose date will not parse stays in the
    # records array but takes no part in first or last.
    ordered = []
    for r in recs:
        d = _parse_mdy(r.get("date"))
        if d is not None:
            ordered.append((d, r))
    ordered.sort(key=lambda pair: pair[0])

    return jsonify({
        "tail": (tail or "").strip().upper(),
        "count": len(recs),
        "first": ordered[0][1].get("date") if ordered else None,
        "last": ordered[-1][1].get("date") if ordered else None,
        "records": recs,
    })


@app.get("/z/api/repeats/<tail>")
def api_repeats(tail):
    recs = _tail_records(tail)

    # Group in file order, parsing each date once. Same rule as the airframe
    # view: a record that will not parse is counted with its group and kept
    # out of first, last, and hours, never dropped.
    groups = {}
    for r in recs:
        key = (r.get("item") or "UNSPECIFIED").strip()
        groups.setdefault(key, []).append((r, _parse_mdy(r.get("date"))))

    out = []
    for key, members in groups.items():
        dated = sorted((m for m in members if m[1] is not None), key=lambda m: m[1])

        first = dated[0][0] if dated else None
        last = dated[-1][0] if dated else None

        hours_between = None
        hid_between = False
        if first is not None and last is not None:
            h1 = _hours(first.get("hours"))
            h2 = _hours(last.get("hours"))
            if h1 is not None and h2 is not None:
                if h2 >= h1:
                    hours_between = h2 - h1
                else:
                    # Correctly dated, and the file still runs the hours
                    # backwards between the first and last records. That is
                    # the file disagreeing with itself, not an arithmetic
                    # error, so say so instead of printing a negative.
                    hid_between = True

        # Adjacent records in date order can disagree even when the group's
        # ends do not, for example a supplemental report that restates an
        # earlier one. Name each pair so a reader can look.
        disagreements = []
        for (ra, _), (rb, _) in zip(dated, dated[1:]):
            ha = _hours(ra.get("hours"))
            hb = _hours(rb.get("hours"))
            if ha is not None and hb is not None and hb < ha:
                disagreements.append((ra, rb, ha, hb))

        hours_note = None
        if disagreements:
            phrases = [
                "%s at %s hours and %s at %s hours" % (
                    _rid(ra), _fmt_hours(ha), _rid(rb), _fmt_hours(hb))
                for ra, rb, ha, hb in disagreements
            ]
            hours_note = ("the file gives two hour readings that do not agree: "
                          + "; ".join(phrases))
            if hid_between:
                hours_note += ", so no hours_between is shown for this group"

        entry = {
            "item": key,
            "count": len(members),
            "first": first.get("date") if first else None,
            "last": last.get("date") if last else None,
            "hours_between": hours_between,
        }
        if hours_note:
            entry["hours_note"] = hours_note
        out.append(entry)

    out.sort(key=lambda g: (-g["count"], g["item"]))

    return jsonify({"tail": (tail or "").strip().upper(), "groups": out})
```