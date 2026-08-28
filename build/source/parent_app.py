#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SDR Desk: the FAA Service Difficulty Reports, made searchable for reporters.

The FAA publishes no API and its own query form answers one question at a time.
This serves the same public corpus as a newsroom tool: search the engineers'
own words, follow a single tail number through years of write-ups, and see
which defect is spreading across a fleet.

Data: the yearly SDR CSVs, rebuilt by fetch_all.py. The row count is read from
the database at runtime, never written down here.
"""
import csv
import datetime
import io
import json
import os
import re

import duckdb
from flask import Flask, jsonify, request, send_from_directory, Response

DB = os.environ.get("SDR_DB", "/opt/sdr/sdr.duckdb")
# Behind nginx the /sdr/ prefix is stripped, so request.url_root points at the site
# root and every emitted permalink lands on the wrong page while returning 200.
PUBLIC_BASE = os.environ.get("SDR_PUBLIC_BASE", "").rstrip("/")
HERE = os.path.dirname(os.path.abspath(__file__))
class BadFilter(Exception):
    """A filter value that cannot be honoured. Raised rather than dropped: dropping it
    silently returned the whole corpus under a chip claiming it was filtered."""

    def __init__(self, rejected):
        self.rejected = rejected
        super().__init__("rejected filter values: %s" % rejected)


app = Flask(__name__, static_folder=os.path.join(HERE, "static"))


@app.errorhandler(BadFilter)
def _bad_filter(e):
    """Fail closed. Returning the unfiltered corpus under a chip that claims a filter
    is how a reporter ends up publishing the whole corpus as a filtered figure."""
    bad = [k for k in e.rejected if k in FILTER_ARGS]
    setting = [k for k in e.rejected if k in VIEW_ARGS]
    unknown = [k for k in e.rejected if k not in KNOWN_ARGS]
    parts = []
    if bad:
        parts.append("These values are not valid for this data: "
                     + ", ".join("%s=%s" % (k, e.rejected[k]) for k in bad))
    if setting:
        parts.append("This view has no setting "
                     + ", ".join("%s=%s" % (k, e.rejected[k]) for k in setting))
    if unknown:
        parts.append("This tool has no filter called "
                     + ", ".join(unknown)
                     + ". A link written for an older version of this page can carry a "
                       "name that no longer exists")
    return jsonify({"error": "rejected filter values",
                    "rejected": e.rejected,
                    "unknown": unknown,
                    "message": ". ".join(parts) + ", so no query was run."}), 400

# Every coded field in this data is decoded from the FAA's own lookup tables,
# published as a zip on the SDRS front page and shipped here as codes.json.
# That file is the July 2026 edition. Checked against the corpus, it resolves
# 100% of the values actually present in NatureOfCondition, PrecautionaryProcedure,
# HowDiscovered, StageOfOperation, SubmitterType, SDRType and JASCCode, with no
# unknown codes left over. Corrosion levels are not in that zip; those come from
# FAA Order 8300.12 and EASA IP 119 and are marked as such in codes.json.
# The four-letter operator designator resolves through the FAA's own
# Air Carrier/Operator cross-reference (200612OPERATOR.PDF, host now retired) merged
# with the FAA's current 121/135 operator list. Coverage is measured by operator_gap(),
# never typed here. The 2006 edition is from DECEMBER 2006,
# so a name can be stale where a carrier has since merged or been renamed:
# CALA still reads Continental, J7SA still reads Jet Solutions. Every place a
# name is shown says which edition it came from and offers a way to check the
# current owner. Newer editions and the FAA registry are behind a block that
# refuses automated requests, so this is the most recent list obtainable.
try:
    with open(os.path.join(HERE, "codes.json"), encoding="utf-8") as _f:
        CODES = json.load(_f)
except Exception:
    CODES = {}

ATA = {
    "11": "Placards and markings", "12": "Servicing", "20": "Standard practices",
    "21": "Air conditioning", "22": "Auto flight", "23": "Communications",
    "24": "Electrical power", "25": "Equipment and furnishings", "26": "Fire protection",
    "27": "Flight controls", "28": "Fuel", "29": "Hydraulic power",
    "30": "Ice and rain protection", "31": "Indicating and recording", "32": "Landing gear",
    "33": "Lights", "34": "Navigation", "35": "Oxygen", "36": "Pneumatic",
    "38": "Water and waste", "45": "Onboard maintenance system", "46": "Information systems",
    "49": "Auxiliary power unit", "51": "Structures, standard practices", "52": "Doors",
    "53": "Fuselage", "54": "Nacelles and pylons", "55": "Stabilizers", "56": "Windows",
    "57": "Wings", "61": "Propellers", "62": "Main rotor", "63": "Rotor drive",
    "64": "Tail rotor", "67": "Rotor flight control", "71": "Power plant",
    "72": "Engine (turbine/turboprop)", "73": "Engine fuel and control",
    "74": "Ignition", "75": "Engine air", "76": "Engine controls",
    "77": "Engine indicating", "78": "Exhaust", "79": "Engine oil",
    "80": "Starting", "81": "Turbines", "82": "Water injection", "85": "Fuel cell system",
}



def _c(table, code):
    """Look one code up in the FAA tables. Returns None when there is nothing to say."""
    if code is None:
        return None
    e = (CODES.get(table) or {}).get(str(code).strip())
    return e if isinstance(e, dict) else ({"label": e} if e else None)


def label(table, code, fallback=None):
    e = _c(table, code)
    return e["label"] if e else (fallback if fallback is not None else code)


def jasc(code):
    """A JASC code at full four-digit precision: 3230 is landing gear retraction,
    not merely chapter 32. Falls back to the chapter when the exact code is unlisted."""
    code = (str(code or "")).strip()
    e = _c("jasc", code)
    if e:
        return {"code": code, "label": e.get("label"), "faa": e.get("faa"),
                "chapter": code[:2], "chapter_label": ATA.get(code[:2], "")}
    return {"code": code, "label": ATA.get(code[:2], code), "faa": None,
            "chapter": code[:2], "chapter_label": ATA.get(code[:2], "")}


def decode_row(d):
    """Attach a plain-English reading of every coded field on one report."""
    d["_jasc"] = jasc(d.get("JASCCode"))
    for key, table, col in (("_stage", "stage", "StageOfOperationCode"),
                            ("_discovered", "discovered", "HowDiscoveredCode"),
                            ("_nature", "nature", "NatureOfConditionA"),
                            ("_crew", "precaution", "PrecautionaryProcedureA"),
                            ("_submitter", "submitter", "SubmitterTypeCode"),
                            ("_corrosion", "corrosion", "CorrosionLevel")):
        if col in d:
            d[key] = _c(table, d.get(col))
    if d.get("PartMake"):
        d["_part_make"] = make_name(d["PartMake"])
    if d.get("AircraftMake"):
        d["_aircraft_make"] = make_name(d["AircraftMake"])
    return d


def rows_as_dicts(c, rows):
    cols = [x[0] for x in c.description]
    return [decode_row(dict(zip(cols, r))) for r in rows]


# The date is not unique (many reports share a day), so a sort on it
# alone is not total and LIMIT/OFFSET returns a different slice on every request.
# The control number breaks the tie; it is unique and never null.
ORDER_NEWEST = "ORDER BY difficulty_dt DESC NULLS LAST, OperatorControlNumber DESC"

# A report can carry several nature and precautionary codes. The filter has always
# matched any slot; several panels read only slot A, so their figures ran low.
NATURE_SLOTS = ("A", "B", "C")
PRECAUTION_SLOTS = ("A", "B", "C", "D")


def any_slot(col, slots, codes):
    """SQL that is true when any slot holds one of these codes."""
    lst = ", ".join("'%s'" % c for c in codes)
    return "(" + " OR ".join("%s%s IN (%s)" % (col, s, lst) for s in slots) + ")"


def con():
    return duckdb.connect(DB, read_only=True)


# Every query-string name the app answers to. A name outside this set used to be
# dropped in silence, so ?year=2025 returned every row under a caption that
# said they matched the selection. Renaming a filter (precaution -> crew) turned
# every link shared before the rename into a wrong answer that looked right.
FILTER_ARGS = {"q", "operator", "make", "model", "tail", "part", "condition",
               "stage", "discovered", "nature", "crew", "enginemake", "enginemodel",
               "partmake", "zone", "jasc", "corrosion", "cracked", "minhours",
               "ata", "from", "to"}
VIEW_ARGS = {"view", "hero", "case", "aircraft", "ca", "cb", "cf",
             "limit", "offset", "a", "b", "by", "days", "field", "kind", "min", "v"}
KNOWN_ARGS = FILTER_ARGS | VIEW_ARGS

# Code-valued fields validate against the FAA's own look-up tables. Without this a
# typo returned zero reports, which reads as "this never happened" rather than
# "that is not a code".
_CODESETS = {}


def _choice(args, name, table, default):
    """A view setting the page does not offer is not a reason to answer with the
    default: the caller asked one question and would be shown another."""
    v = (args.get(name) or "").strip()
    if not v:
        return default, table[default]
    if v not in table:
        raise BadFilter({name: v})
    return v, table[v]


def _int_arg(args, name, default, lo=None, hi=None):
    """int() on a stray value raised, which came back as a blank panel and a 500."""
    raw = (args.get(name) or "").strip()
    if not raw:
        return default
    try:
        n = int(raw)
    except (TypeError, ValueError):
        raise BadFilter({name: raw})
    if lo is not None:
        n = max(n, lo)
    if hi is not None:
        n = min(n, hi)
    return n


def _codeset(name):
    if name not in _CODESETS:
        _CODESETS[name] = set(CODES.get(name, {}).keys())
    return _CODESETS[name]


def _filters(args):
    """Build the WHERE clause shared by every endpoint. Values are parameterised.
    Anything that does not parse is collected and raised, never quietly ignored."""
    where, params, rejected = [], [], {}
    for name in args.keys():
        if name not in KNOWN_ARGS:
            rejected[name] = args.get(name)
    q = (args.get("q") or "").strip()
    if q:
        # the reporter types a literal string; % and _ are SQL wildcards, so they are
        # escaped here rather than silently widening the query behind the count
        lit = q.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        where.append("lower(Discrepancy) LIKE ? ESCAPE '\\'")
        params.append("%" + lit + "%")
    for field, col in (("operator", "OperatorDesignator"), ("make", "AircraftMake"),
                       ("model", "AircraftModel"), ("tail", "RegistryNNumber"),
                       ("part", "PartName"), ("condition", "PartCondition"),
                       ("stage", "StageOfOperationCode"), ("discovered", "HowDiscoveredCode")):
        v = (args.get(field) or "").strip()
        if not v:
            continue
        codes = _codeset(field) if field in ("stage", "discovered") else None
        if codes and v.upper() not in codes:
            rejected[field] = v
            continue
        where.append("upper(%s) = ?" % col)
        params.append(v.upper())
    nature = (args.get("nature") or "").strip().upper()
    if nature and nature not in _codeset("nature"):
        rejected["nature"] = nature
    elif nature:
        where.append("(NatureOfConditionA = ? OR NatureOfConditionB = ? OR NatureOfConditionC = ?)")
        params.extend([nature] * 3)
    crew = (args.get("crew") or "").strip().upper()
    if crew and crew not in _codeset("precaution"):
        rejected["crew"] = crew
    elif crew:
        where.append("(PrecautionaryProcedureA = ? OR PrecautionaryProcedureB = ? "
                     "OR PrecautionaryProcedureC = ? OR PrecautionaryProcedureD = ?)")
        params.extend([crew] * 4)
    for field, col in (("enginemake", "EngineMake"), ("enginemodel", "EngineModel"),
                       ("partmake", "PartMake")):
        v = (args.get(field) or "").strip()
        if v:
            where.append("upper(%s) = ?" % col)
            params.append(v.upper())
    zone = (args.get("zone") or "").strip().upper()
    if zone:
        if re.match(r"^ZONE \d00$", zone):
            where.append("'ZONE ' || regexp_extract(upper(PartLocation), "
                         "'^Z(?:ONE|N) *([1-9])[0-9][0-9]', 1) || '00' = ?")
            params.append(zone)
        else:
            rejected["zone"] = zone
    jascq = (args.get("jasc") or "").strip()
    if jascq:
        if jascq.isdigit() and len(jascq) == 4:
            where.append("JASCCode = ?")
            params.append(jascq)
        else:
            rejected["jasc"] = jascq
    corr = (args.get("corrosion") or "").strip()
    if corr:
        if corr in ("1", "2", "3"):
            where.append("CorrosionLevel = ?")
            params.append(corr)
        else:
            rejected["corrosion"] = corr
    cracked = (args.get("cracked") or "").strip()
    if cracked:
        if cracked == "1":
            where.append("(NULLIF(NumberOfCracks,'') IS NOT NULL OR NULLIF(CrackLength,'') IS NOT NULL)")
        else:
            rejected["cracked"] = cracked
    minh = (args.get("minhours") or "").strip()
    if minh:
        if minh.isdigit():
            where.append("TRY_CAST(NULLIF(AircraftTotalTime,'') AS BIGINT) >= ?")
            params.append(int(minh))
        else:
            rejected["minhours"] = minh
    ata = (args.get("ata") or "").strip()
    if ata:
        where.append("substr(JASCCode, 1, 2) = ?")
        params.append(ata[:2])
    for field, op in (("from", ">="), ("to", "<=")):
        v = (args.get(field) or "").strip()
        if not v:
            continue
        ok = re.match(r"^\d{4}-\d{2}-\d{2}$", v) is not None
        if ok:
            try:
                datetime.date(*(int(x) for x in v.split("-")))
            except ValueError:
                ok = False           # 2026-13-01 parses the shape but is not a date
        if ok:
            where.append("difficulty_dt %s ?" % op)
            params.append(v)
        else:
            rejected[field] = v
    if rejected:
        raise BadFilter(rejected)
    return (" WHERE " + " AND ".join(where) if where else ""), params


ROWCOLS = ("OperatorControlNumber, DifficultyDate, OperatorDesignator, AircraftMake, "
           "AircraftModel, RegistryNNumber, JASCCode, PartName, PartMake, PartNumber, "
           "PartCondition, PartLocation, StageOfOperationCode, HowDiscoveredCode, "
           "NatureOfConditionA, NatureOfConditionB, NatureOfConditionC, "
           "PrecautionaryProcedureA, PrecautionaryProcedureB, PrecautionaryProcedureC, "
           "PrecautionaryProcedureD, SubmitterTypeCode, CorrosionLevel, "
           "NumberOfCracks, CrackLength, AircraftTotalTime, AircraftTotalCycles, Discrepancy")


@app.route("/api/search")
def api_search():
    """1. Free-text search, 2-4. filters, 13. every query is a permalink."""
    w, p = _filters(request.args)
    limit = _int_arg(request.args, "limit", 100, 1, 500)
    offset = _int_arg(request.args, "offset", 0, 0)
    c = con()
    total, undated = c.execute(
        "SELECT COUNT(*), SUM(CASE WHEN difficulty_dt IS NULL THEN 1 ELSE 0 END) "
        "FROM sdr_clean" + w, p).fetchone()
    rows = c.execute(
        ("SELECT %s FROM sdr_clean%s " + ORDER_NEWEST + " LIMIT ? OFFSET ?")
        % (ROWCOLS, w), p + [limit, offset]).fetchall()
    out = rows_as_dicts(c, rows)
    c.close()
    return jsonify({"total": total, "rows": out, "ata": ATA,
                    "undated": undated or 0, "shown": len(out), "offset": offset})


@app.route("/api/trend")
def api_trend():
    """7. Monthly trend for whatever the reporter is currently looking at."""
    w, p = _filters(request.args)
    c = con()
    rows = c.execute(
        "SELECT strftime(difficulty_dt, '%Y-%m') m, COUNT(*) n FROM sdr_clean"
        + (w + " AND" if w else " WHERE") + " difficulty_dt IS NOT NULL GROUP BY 1 ORDER BY 1", p).fetchall()
    c.close()
    return jsonify([{"month": m, "n": n} for m, n in rows])


@app.route("/api/breakdown")
def api_breakdown():
    """8. Which systems, operators, models and parts dominate this selection."""
    w, p = _filters(request.args)
    field = request.args.get("by", "ata")
    # nature and precaution live in up to four slots per report, and _filters matches
    # any of them. Counting only slot A gave a bar that disagreed with the number you
    # landed on after clicking it, which is the disagreement that reaches print.
    if field in ("crew", "nature"):
        table, slots = ("precaution", "ABCD") if field == "crew" else ("nature", "ABC")
        col = "PrecautionaryProcedure" if field == "crew" else "NatureOfCondition"
        codes = sorted((CODES.get(table) or {}).keys())
        c = con()
        sel = ", ".join("SUM(CASE WHEN %s THEN 1 ELSE 0 END)" % (
            " OR ".join("%s%s = '%s'" % (col, sfx, k) for sfx in slots)) for k in codes)
        row = c.execute("SELECT %s FROM sdr_clean%s" % (sel, w), p).fetchone()
        c.close()
        out = [{"key": k, "n": row[i], "label": label(table, k, k)}
               for i, k in enumerate(codes) if row[i]]
        out.sort(key=lambda r: -r["n"])
        return jsonify(out[:25])
    expr = {"ata": "substr(JASCCode, 1, 2)", "operator": "OperatorDesignator",
            "model": "AircraftMake || ' ' || AircraftModel", "part": "PartName",
            "condition": "PartCondition", "stage": "StageOfOperationCode",
            "jasc": "JASCCode", "nature": "NatureOfConditionA",
            "crew": "PrecautionaryProcedureA", "discovered": "HowDiscoveredCode",
            "submitter": "SubmitterTypeCode"}.get(field)
    if not expr:
        return jsonify({"error": "unknown field"}), 400
    c = con()
    allrows = c.execute(
        "SELECT %s k, COUNT(*) n FROM sdr_clean%s GROUP BY 1 HAVING k IS NOT NULL AND k <> '' "
        "ORDER BY n DESC" % (expr, w), p).fetchall()
    rows = allrows[:25]
    shown_n = sum(n for _, n in rows)
    all_n = sum(n for _, n in allrows)
    c.close()
    tbl = {"nature": "nature", "crew": "precaution", "discovered": "discovered",
           "stage": "stage", "submitter": "submitter"}.get(field)
    def lab(k):
        if field == "ata":
            return ATA.get(k, k)
        if field == "jasc":
            return jasc(k)["label"]
        return label(tbl, k, k) if tbl else k
    return jsonify({"rows": [{"key": k, "n": n, "label": lab(k)} for k, n in rows],
                    "categories": len(allrows), "shown": len(rows),
                    "reports_shown": shown_n, "reports_in_categories": all_n})


@app.route("/api/aircraft/<tail>")
def api_aircraft(tail):
    """5. One aircraft, its whole write-up history: the tail-number dossier."""
    c = con()
    rows = c.execute(
        ("SELECT %s FROM sdr_clean WHERE upper(RegistryNNumber) = ? "
         + ORDER_NEWEST + " LIMIT 500") % ROWCOLS,
        [tail.upper().lstrip("N")]).fetchall()
    dicts = rows_as_dicts(c, rows)
    systems = c.execute(
        "SELECT substr(JASCCode,1,2) k, COUNT(*) n FROM sdr_clean WHERE upper(RegistryNNumber) = ? "
        "GROUP BY 1 ORDER BY n DESC LIMIT 10", [tail.upper().lstrip("N")]).fetchall()
    c.close()
    return jsonify({"tail": tail.upper(), "count": len(dicts), "capped": len(dicts) >= 500,
                    "systems": [{"ata": k, "label": ATA.get(k, k), "n": n} for k, n in systems],
                    "rows": dicts})


@app.route("/api/repeat-offenders")
def api_repeat():
    """6. Which individual aircraft generate the most write-ups."""
    w, p = _filters(request.args)
    c = con()
    rows = c.execute(
        "SELECT RegistryNNumber, any_value(AircraftMake) mk, any_value(AircraftModel) md, "
        "any_value(OperatorDesignator) op, COUNT(*) n, "
        "COUNT(DISTINCT substr(JASCCode,1,2)) systems, "
        "min(difficulty_dt) first_seen, max(difficulty_dt) last_seen "
        "FROM sdr_clean%s GROUP BY 1 HAVING RegistryNNumber IS NOT NULL AND RegistryNNumber <> '' "
        "ORDER BY n DESC LIMIT 40" % w, p).fetchall()
    c.close()
    return jsonify([{"tail": r[0], "make": r[1], "model": r[2], "operator": r[3],
                     "n": r[4], "systems": r[5],
                     "first": str(r[6])[:10] if r[6] else "", "last": str(r[7])[:10] if r[7] else ""}
                    for r in rows])


@app.route("/api/spikes")
def api_spikes():
    """9. What rose fastest: this quarter against the one before it."""
    field, expr = _choice(request.args, "by",
        {"part": "PartName", "model": "AircraftMake || ' ' || AircraftModel",
         "operator": "OperatorDesignator", "ata": "substr(JASCCode,1,2)"}, "part")
    c = con()
    rows = c.execute("""
        WITH bounds AS (SELECT max(difficulty_dt) AS mx FROM sdr_clean),
        recent AS (SELECT %s k, COUNT(*) n FROM sdr_clean, bounds
                   WHERE difficulty_dt > mx - INTERVAL 90 DAY GROUP BY 1),
        prior AS (SELECT %s k, COUNT(*) n FROM sdr_clean, bounds
                  WHERE difficulty_dt <= mx - INTERVAL 90 DAY
                    AND difficulty_dt > mx - INTERVAL 180 DAY GROUP BY 1)
        SELECT r.k, r.n, COALESCE(p.n, 0) prev, r.n - COALESCE(p.n, 0) delta
        FROM recent r LEFT JOIN prior p USING (k)
        WHERE r.k IS NOT NULL AND r.k <> '' AND r.n >= 15
        ORDER BY delta DESC LIMIT 25""" % (expr, expr)).fetchall()
    c.close()
    return jsonify([{"key": k, "label": ATA.get(k, k) if field == "ata" else k,
                     "recent": n, "previous": prev, "delta": d} for k, n, prev, d in rows])


@app.route("/api/same-defect")
def api_same_defect():
    """10. One part number failing the same way across many different aircraft."""
    c = con()
    rows = c.execute("""
        SELECT PartNumber, any_value(PartName) nm, PartCondition,
               COUNT(*) n, COUNT(DISTINCT RegistryNNumber) aircraft,
               COUNT(DISTINCT OperatorDesignator) operators
        FROM sdr_clean
        WHERE PartNumber IS NOT NULL AND PartNumber <> '' AND PartCondition <> ''
          AND upper(PartNumber) NOT IN ('UNKNOWN', 'NONE', 'NA', 'N/A', 'UNK', 'UKNOWN')
        GROUP BY PartNumber, PartCondition
        HAVING aircraft >= 5
        ORDER BY aircraft DESC, n DESC LIMIT 40""").fetchall()
    c.close()
    return jsonify([{"part_number": r[0], "part_name": r[1], "condition": r[2],
                     "reports": r[3], "aircraft": r[4], "operators": r[5]} for r in rows])


@app.route("/api/compare")
def api_compare():
    """11. Two operators or two models, side by side on the same systems."""
    a, b = (request.args.get("a") or "").upper(), (request.args.get("b") or "").upper()
    field, col = _choice(request.args, "field",
        {"operator": "OperatorDesignator", "model": "AircraftModel",
         "make": "AircraftMake"}, "operator")
    if not a or not b:
        return jsonify({"error": "need a and b"}), 400
    c = con()
    tops, totals = {}, {}
    for side, val in (("a", a), ("b", b)):
        tops[side] = [r[0] for r in c.execute(
            "SELECT substr(JASCCode,1,2) k, COUNT(*) n FROM sdr_clean WHERE upper(%s) = ? "
            "GROUP BY 1 HAVING k <> '' ORDER BY n DESC LIMIT 12" % col, [val]).fetchall()]
        totals[side] = c.execute(
            "SELECT COUNT(*) FROM sdr_clean WHERE upper(%s) = ?" % col, [val]).fetchone()[0]
    # the union, so every row carries a real number on both sides. A blank cell was a
    # phrase standing where a figure belongs, and the reader could not tell "small"
    # from "not measured".
    union = list(dict.fromkeys(tops["a"] + tops["b"]))
    out = {}
    for side, val in (("a", a), ("b", b)):
        counts = {}
        if union:
            q = ",".join("?" * len(union))
            counts = dict(c.execute(
                "SELECT substr(JASCCode,1,2) k, COUNT(*) n FROM sdr_clean WHERE upper(%s) = ? "
                "AND substr(JASCCode,1,2) IN (%s) GROUP BY 1" % (col, q), [val] + union).fetchall())
        tot = totals[side] or 1
        out[side] = {"value": val, "total": totals[side],
                     "systems": [{"ata": k, "label": ATA.get(k, k), "n": counts.get(k, 0),
                                  "share": round(100.0 * counts.get(k, 0) / tot, 1),
                                  "in_own_top": k in tops[side]} for k in union]}
    out["order"] = union
    c.close()
    return jsonify(out)


@app.route("/api/leads")
def api_leads():
    """14. Story leads: aircraft whose write-ups cluster suddenly in the last 90 days."""
    c = con()
    rows = c.execute("""
        WITH bounds AS (SELECT max(difficulty_dt) AS mx FROM sdr_clean),
        win AS (SELECT RegistryNNumber t, difficulty_dt d, AircraftMake mk, AircraftModel md,
                       OperatorDesignator op
                FROM sdr_clean, bounds
                WHERE difficulty_dt > mx - INTERVAL 90 DAY AND RegistryNNumber <> ''),
        perday AS (SELECT t, d, COUNT(*) n FROM win GROUP BY 1, 2),
        top AS (SELECT t, topday, topn FROM (
                  SELECT t, d topday, n topn,
                         row_number() OVER (PARTITION BY t ORDER BY n DESC, d DESC) rn
                  FROM perday) WHERE rn = 1),
        recent AS (SELECT t, COUNT(*) n, any_value(mk) mk, any_value(md) md, any_value(op) op,
                          COUNT(DISTINCT d) ndays FROM win GROUP BY 1),
        hist AS (SELECT RegistryNNumber t, COUNT(*) n FROM sdr_clean, bounds
                 WHERE difficulty_dt <= mx - INTERVAL 90 DAY AND RegistryNNumber <> '' GROUP BY 1)
        SELECT r.t, r.mk, r.md, r.op, r.n recent_n, COALESCE(h.n, 0) earlier_n,
               r.ndays, tp.topday, tp.topn
        FROM recent r LEFT JOIN hist h USING (t) LEFT JOIN top tp USING (t)
        WHERE r.n >= 12 AND r.n > COALESCE(h.n, 0)
        ORDER BY r.n - COALESCE(h.n, 0) DESC LIMIT 25""").fetchall()
    c.close()
    return jsonify([{"tail": r[0], "make": r[1], "model": r[2], "operator": r[3],
                     "recent": r[4], "earlier": r[5],
                     "days_filed_on": r[6],
                     "busiest_day": str(r[7])[:10] if r[7] else "",
                     "busiest_day_n": r[8],
                     # a burst that is really one inspection visit, not a trend
                     "one_day_burst": bool(r[8] and r[4] and r[8] > r[4] / 2)}
                    for r in rows])


# Each coded column travels with a plain-English twin, so a spreadsheet opened a
# week later still says what it means. Unmapped codes fall back to the raw value
# rather than to a blank, which would silently drop those rows from a pivot.
EXPORT_CAP = 5000

EXPORT_DECODE = [("OperatorDesignator", "OperatorName", "operator"),
                 ("JASCCode", "SystemName", None),
                 ("NatureOfConditionA", "WhatWasFound", "nature"),
                 ("PrecautionaryProcedureA", "CrewAction", "precaution"),
                 ("HowDiscoveredCode", "HowDiscovered", "discovered"),
                 ("StageOfOperationCode", "StageOfFlight", "stage"),
                 ("SubmitterTypeCode", "FiledBy", "submitter"),
                 ("CorrosionLevel", "CorrosionMeaning", "corrosion"),
                 ("AircraftMake", "ManufacturerName", None),
                 ("PartMake", "PartManufacturerName", None)]


@app.route("/api/export.csv")
def api_export():
    """12. Take the current selection into a spreadsheet, decoded."""
    w, p = _filters(request.args)
    c = con()
    rows = c.execute(("SELECT %s FROM sdr_clean%s " + ORDER_NEWEST + " LIMIT %d")
                     % (ROWCOLS, w, EXPORT_CAP), p).fetchall()
    cols = [d[0] for d in c.description]
    c.close()
    idx = {name: i for i, name in enumerate(cols)}
    base = (PUBLIC_BASE or (request.url_root.rstrip("/")
            + (request.headers.get("X-Forwarded-Prefix") or "").rstrip("/"))) + "/"
    out_cols, plan = [], []
    for i, name in enumerate(cols):
        out_cols.append(name)
        plan.append(("raw", i))
        for src, twin, table in EXPORT_DECODE:
            if src == name:
                out_cols.append(twin)
                plan.append((table or ("jasc" if src == "JASCCode" else "make"), i))
    out_cols.append("CaseSheetURL")
    buf = io.StringIO()
    wr = csv.writer(buf)
    wr.writerow(out_cols)
    for r in rows:
        line = []
        for kind, i in plan:
            v = r[i]
            if kind == "raw":
                line.append(v)
            elif kind == "jasc":
                line.append(jasc(v)["label"])
            elif kind == "make":
                line.append(make_name(v))
            else:
                line.append(label(kind, (v or "").strip(), v) if v else "")
        ctrl = r[idx.get("OperatorControlNumber", 0)]
        line.append("%s?case=%s" % (base, ctrl))
        wr.writerow(line)
    slug = "-".join(filter(None, [(request.args.get(k) or "").strip().lower().replace(" ", "-")[:18]
                                  for k in ("q", "operator", "make", "model", "part", "ata", "jasc",
                                            "nature", "crew", "stage", "discovered", "corrosion",
                                            "cracked", "minhours", "from", "to")]))[:70]
    c2 = con()
    total = c2.execute("SELECT COUNT(*) FROM sdr_clean" + w, p).fetchone()[0]
    c2.close()
    capped = total > EXPORT_CAP
    fname = "sdr-%s%s.csv" % (slug or "all",
                              ("-newest%dof%d" % (EXPORT_CAP, total)) if capped else "")
    body = buf.getvalue()
    if capped:
        # a truncation a reporter cannot see is a truncation they will publish against
        body = ("# This file holds the newest %d of %d matching reports. The oldest %d are not in it. "
                "Narrow with a date range to export the rest.\n" % (EXPORT_CAP, total, total - EXPORT_CAP)) + body
    return Response(body, mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=%s" % fname,
                             "X-SDR-Total": str(total), "X-SDR-Returned": str(len(rows))})


# The vocabulary of the write-ups, built once by build_vocab.py. It is here so a
# reporter can see that "bird strike" appears 4,000 times and "birdstrike" does not,
# rather than typing a word that returns nothing and concluding it never happens.
_VOCAB = None


def _vocab():
    global _VOCAB
    if _VOCAB is None:
        try:
            with open(os.path.join(HERE, "vocab.json")) as f:
                _VOCAB = json.load(f).get("terms") or []
        except Exception:
            _VOCAB = []
    return _VOCAB


@app.route("/api/vocab")
def api_vocab():
    """Terms the mechanics actually wrote, with how many reports carry each."""
    q = (request.args.get("q") or "").strip().upper()
    limit = _int_arg(request.args, "limit", 12, 1, 60)
    terms = _vocab()
    if not q:
        return jsonify({"q": "", "rows": [{"term": t, "n": n} for t, n in terms[:limit]],
                        "total_terms": len(terms)})
    starts, holds = [], []
    for t, n in terms:
        if t.startswith(q):
            starts.append((t, n))
        elif q in t:
            holds.append((t, n))
        if len(starts) >= limit * 3:
            break
    rows = (starts + holds)[:limit]
    return jsonify({"q": q, "rows": [{"term": t, "n": n} for t, n in rows],
                    "total_terms": len(terms)})


@app.route("/api/resolve")
def api_resolve():
    """Every reading of what was typed, per kind, with a real count for each.

    There is deliberately no rule here that decides whether 2025 is a year or the
    start of a registration. Every shape rule of that sort has a counter-example
    (583 and N583 are the same aircraft; 1985 is both a plausible year and a
    plausible prefix), and a wrong guess silently answers a different question.
    So nothing is inferred: either the caller names the kind, and it is matched
    exactly for that kind alone, or every kind that matches comes back and the
    reporter picks. The kinds are the FAA's own: nothing here invents a category.
    """
    q = (request.args.get("q") or "").strip()
    kind = (request.args.get("kind") or "").strip().lower()
    KINDS = ("tail", "period", "operator", "jasc", "zone", "q")
    if kind and kind not in KINDS:
        raise BadFilter({"kind": kind})
    if not q:
        return jsonify({"q": "", "kind": kind, "readings": []})
    up = q.upper()
    want = (kind,) if kind else KINDS
    c = con()
    out = []

    def count(where, params):
        return c.execute("SELECT COUNT(*) FROM sdr_clean WHERE " + where, params).fetchone()[0]

    if "tail" in want:
        # the N is optional in what people type and absent in the column
        stem = up[1:] if up.startswith("N") else up
        if re.match(r"^[0-9A-Z]{1,6}$", stem):
            rows = c.execute(
                "SELECT upper(RegistryNNumber) t, COUNT(*) n FROM sdr_clean "
                "WHERE upper(RegistryNNumber) LIKE ? AND RegistryNNumber <> '' "
                "GROUP BY 1 ORDER BY (upper(RegistryNNumber) = ?) DESC, 2 DESC LIMIT ?",
                [stem + "%", stem, 6 if kind else 3]).fetchall()
            for t, n in rows:
                out.append({"kind": "tail", "value": t, "label": "N" + t,
                            "what": "one aircraft", "n": n})

    if "period" in want:
        # Maandnamen, ook halfgetypt: "augus" hoort August te geven, "aug 2025"
        # die ene maand. Zonder jaartal bieden we de laatste jaargangen aan waar
        # die maand meldingen in heeft, nieuwste eerst.
        MONTHS = ["january", "february", "march", "april", "may", "june", "july",
                  "august", "september", "october", "november", "december"]
        mm = re.match(r"^([a-z]{3,9})\.?[\s,]*(\d{4})?$", q.lower().strip())
        if mm:
            stem, yr = mm.group(1), mm.group(2)
            hits = [i + 1 for i, name in enumerate(MONTHS) if name.startswith(stem)]
            if len(hits) == 1:
                mo = hits[0]
                nice = MONTHS[mo - 1].capitalize()
                if yr and 1900 <= int(yr) <= 2100:
                    y = int(yr)
                    n = count("year(difficulty_dt) = ? AND month(difficulty_dt) = ?", [y, mo])
                    out.append({"kind": "period", "value": "%04d-%02d" % (y, mo),
                                "label": "%s %d" % (nice, y), "what": "that month", "n": n})
                elif not yr:
                    rows = c.execute(
                        "SELECT year(difficulty_dt) y, COUNT(*) n FROM sdr_clean "
                        "WHERE month(difficulty_dt) = ? AND difficulty_dt IS NOT NULL "
                        "GROUP BY 1 ORDER BY 1 DESC LIMIT ?", [mo, 6 if kind else 3]).fetchall()
                    for y, n in rows:
                        out.append({"kind": "period", "value": "%04d-%02d" % (y, mo),
                                    "label": "%s %d" % (nice, y), "what": "that month", "n": n})

        m = re.match(r"^(\d{4})(?:[-/](\d{1,2}))?$", q)
        if m and 1900 <= int(m.group(1)) <= 2100:
            y = int(m.group(1))
            if m.group(2) and 1 <= int(m.group(2)) <= 12:
                mo = int(m.group(2))
                n = count("year(difficulty_dt) = ? AND month(difficulty_dt) = ?", [y, mo])
                out.append({"kind": "period", "value": "%04d-%02d" % (y, mo),
                            "label": "%04d-%02d" % (y, mo), "what": "that month", "n": n})
            elif not m.group(2):
                n = count("year(difficulty_dt) = ?", [y])
                out.append({"kind": "period", "value": str(y), "label": str(y),
                            "what": "that year", "n": n})

    if "operator" in want:
        ops = CODES.get("operator") or {}
        seen = set()
        if up in ops:
            n = count("upper(OperatorDesignator) = ?", [up])
            if n:
                seen.add(up)
                out.append({"kind": "operator", "value": up,
                            "label": (ops[up].get("label") or up) + " (" + up + ")",
                            "what": "one airline", "n": n})
        if len(q) >= 3:
            hits = [(k, v.get("label") or k) for k, v in ops.items()
                    if k not in seen and up in (v.get("label") or "").upper()]
            hits = hits[:8 if kind else 4]
            for k, lab in hits:
                n = count("upper(OperatorDesignator) = ?", [k])
                if n:
                    out.append({"kind": "operator", "value": k,
                                "label": lab + " (" + k + ")",
                                "what": "one airline", "n": n})

    if "jasc" in want and re.match(r"^\d{4}$", q):
        n = count("JASCCode = ?", [q])
        if n:
            out.append({"kind": "jasc", "value": q, "label": jasc(q)["label"],
                        "what": "one system", "n": n})

    if "zone" in want:
        for code_, ent in (CODES.get("part_location") or {}).items():
            lab = ent.get("label") or ""
            if up == code_.upper() or (len(q) >= 3 and up in lab.upper()):
                n = count("'ZONE ' || " + ZONE_EXPR + " = ?", [code_])
                if n:
                    out.append({"kind": "zone", "value": code_, "label": lab,
                                "what": "part of the aircraft", "n": n})
                break

    if "q" in want:
        lit = q.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        n = count("lower(Discrepancy) LIKE ? ESCAPE '\\'", ["%" + lit + "%"])
        out.append({"kind": "q", "value": q, "label": q,
                    "what": "a word in the write-ups", "n": n})
    c.close()
    # Groups are shown strongest first, and rows are ordered inside their group. That
    # is a reading aid, not a decision: every kind that matched is still listed under
    # its own heading, and nothing is ever selected automatically on the strength of
    # this order. The word reading stays last, being the fallback rather than a kind.
    best = {}
    for r in out:
        best[r["kind"]] = max(best.get(r["kind"], 0), r["n"])
    out.sort(key=lambda r: (r["kind"] == "q", -best[r["kind"]], -r["n"], r["label"]))
    return jsonify({"q": q, "kind": kind, "readings": out})


@app.route("/api/facets")
def api_facets():
    """Values that actually occur, so a filter never returns nothing."""
    c = con()
    out = {}
    # every value that occurs, not the top 60: a picker that omits an operator the
    # data contains quietly tells the reporter that story does not exist
    for key, col in (("operators", "OperatorDesignator"), ("makes", "AircraftMake"),
                     ("conditions", "PartCondition"), ("stages", "StageOfOperationCode")):
        out[key] = [r[0] for r in c.execute(
            "SELECT %s k FROM sdr_clean WHERE %s IS NOT NULL AND %s <> '' "
            "GROUP BY 1 ORDER BY COUNT(*) DESC" % (col, col, col)).fetchall()]
    out["ata"] = [{"code": k, "label": ATA.get(k, k)} for k in sorted(ATA)]
    # How many reports each code actually has. The six coded pickers are built from
    # the FAA look-up tables, which list codes nobody has ever filed under; without
    # a count those options are dead ends that read as "this never happens".
    counts = {}
    for key, expr in (("stage", "upper(StageOfOperationCode)"),
                      ("discovered", "upper(HowDiscoveredCode)"),
                      ("corrosion", "CorrosionLevel"),
                      ("zone", "'ZONE ' || " + ZONE_EXPR)):
        counts[key] = {r[0]: r[1] for r in c.execute(
            "SELECT %s k, COUNT(*) FROM sdr_clean GROUP BY 1" % expr).fetchall() if r[0]}
    for key, cols in (("nature", ["NatureOfConditionA", "NatureOfConditionB",
                                  "NatureOfConditionC"]),
                      ("crew", ["PrecautionaryProcedureA", "PrecautionaryProcedureB",
                                "PrecautionaryProcedureC", "PrecautionaryProcedureD"])):
        # a report naming the same code in two slots counts once, as the filter does
        union = " UNION ALL ".join(
            "SELECT upper(%s) k, OperatorControlNumber r FROM sdr_clean WHERE %s <> ''" % (c2, c2)
            for c2 in cols)
        counts[key] = {r[0]: r[1] for r in c.execute(
            "SELECT k, COUNT(DISTINCT r) FROM (%s) GROUP BY 1" % union).fetchall() if r[0]}
    out["counts"] = counts
    rng = c.execute("SELECT min(difficulty_dt), max(difficulty_dt), COUNT(*) FROM sdr_clean").fetchone()
    c.close()
    out["range"] = {"from": str(rng[0])[:10], "to": str(rng[1])[:10], "total": rng[2]}
    try:
        out["opgap"] = operator_gap()
    except Exception:
        out["opgap"] = None
    # the code tables travel with /api/glossary, which the page loads once
    return jsonify(out)


# Every abbreviation a reporter meets in this data, explained once.
# Sources: the FAA field instructions for the three precautionary codes that the
# FAA itself spells out, and standard maintenance shorthand for the rest.
GLOSSARY = {
    "sdr": ("Service Difficulty Report",
            "A report an airline or mechanic must file with the FAA when they find a failure, "
            "malfunction or defect. It records something found and usually already fixed."),
    "jasc": ("JASC / ATA chapter",
             "The industry numbering for aircraft systems. Chapter 32 is landing gear, 27 is "
             "flight controls, and so on. It tells you which part of the aircraft this is about."),
    "tail": ("Tail number (N-number)",
             "The registration painted on the aircraft, unique to one airframe. Following it "
             "shows the history of a single machine rather than a type."),
    "operator": ("Operator designator",
                 "The FAA's four-letter code for the airline or company that filed the report. "
                 "It is not the IATA code you see on a ticket."),
    "total_time": ("Aircraft total time",
                   "Hours flown by this airframe since it was built. High hours on a young "
                   "aircraft means heavy use."),
    "cycles": ("Cycles",
               "One cycle is one takeoff and landing. Cycles matter more than hours for "
               "cracking and fatigue, because pressurisation stresses the structure each flight."),
    "c/a": ("C/A", "Corrective action: what the mechanic did about it."),
    "disc": ("DISC", "Discrepancy: the problem as found."),
    "inop": ("INOP", "Inoperative. The item did not work."),
    "amm": ("AMM", "Aircraft Maintenance Manual, the manufacturer's repair procedure."),
    "mel": ("MEL", "Minimum Equipment List: what may be broken and still legally fly, and for how long."),
    "r&r": ("R&R", "Removed and replaced."),
    "ops chk": ("OPS CHK", "Operational check, to confirm the fix worked."),
    "bs": ("BS", "Body station: a distance marker along the fuselage, used to locate a find."),
    "wl": ("WL", "Water line: a height marker, used with BS to pinpoint a location."),
    "p/n": ("P/N", "Part number."),
    "s/n": ("S/N", "Serial number of that individual part."),
    "eng": ("ENG", "Engine."),
    "apu": ("APU", "Auxiliary power unit: the small engine that provides power on the ground."),
    "fod": ("FOD", "Foreign object damage, for instance from debris on a runway."),
    "crew_a": ("Unscheduled landing",
               "FAA precautionary code A. The flight landed somewhere or sometime it had not planned to."),
    "crew_e": ("Engine shut down",
               "FAA precautionary code E. The crew shut an engine down in flight."),
    "crew_j": ("Fuel dumped",
               "FAA precautionary code J. Fuel was jettisoned, normally to get the weight down "
               "for an immediate landing."),
    "codes": ("The single-letter codes",
              "Stage of operation, how discovered, nature of condition and the crew's "
              "precautionary action all arrive as single letters. They are decoded here from the "
              "FAA's own lookup tables, which the FAA publishes as a zip file on the SDRS front "
              "page. Every code that occurs in this data resolves. Hover any code to see both the "
              "plain English and the FAA's own wording."),
    "operator_code_limit": ("Why the airline has no name",
                            "OPERATOR_GAP_SENTENCE"),
    "ndt": ("Instrumented inspection",
            "Borescope, dye penetrant, eddy current, magnetic particle, thermal, ultrasonic and "
            "X-ray all find damage that cannot be seen from outside. If a crack was found this "
            "way, no walk-around would have caught it."),
    "corrosion": ("Corrosion level",
                  "Level 2 means the corrosion went past what the manufacturer allows and needed "
                  "repair. Level 3 is an urgent airworthiness concern: the operator must tell the "
                  "regulator within three days and act across the fleet. Level 1 stays within "
                  "limits and is not reportable, which is why it never appears here."),
    "cycles_vs_hours": ("Cycles against hours",
                        "A short-haul aircraft racks up cycles fast and hours slowly. Since each "
                        "flight pressurises and depressurises the hull, cycles drive cracking. "
                        "Hours drive wear on things that simply run."),
    "control_number": ("Control number",
                       "The operator's own reference for the report, and the closest thing to a "
                       "citable identifier. Use it when you quote a single report."),
    "not_a_rate": ("Counts are not rates",
                   "This data counts reports, not flights. An airline that files diligently will "
                   "look worse than one that does not. Never rank operators on raw counts without "
                   "saying what the denominator is missing."),
}


CREW_WATCH = ["A", "B", "C", "E", "F", "G", "I", "J", "L", "R"]


@app.route("/api/crew-definition")
def api_crew_definition():
    """One sentence, built from the codes actually counted, so the wording can never
    drift from the arithmetic again."""
    named = [label("precaution", k, k).lower() for k in CREW_WATCH]
    return jsonify({"codes": CREW_WATCH, "items": named,
                    "sentence": "A crew action means the crew had to do one of these: "
                                + ", ".join(named[:-1]) + " or " + named[-1] + "."})


@app.route("/api/glossary")
def api_glossary():
    """Every term and every code table in one place, so nothing on the page is
    unexplained. The tables carry both the plain English and the FAA's wording."""
    # part_make and district are decoded server-side, so the browser never needs
    # them. Dropping them keeps this payload to a quarter of its size.
    codes = {k: v for k, v in CODES.items() if k not in ("part_make", "operator")}
    # only the operator codes that actually occur, so the page does not carry 2,443 of them
    try:
        c = con()
        seen = [r[0] for r in c.execute(
            "SELECT DISTINCT OperatorDesignator FROM sdr_clean WHERE OperatorDesignator <> ''").fetchall()]
        c.close()
        codes["operator"] = {k: v for k, v in (CODES.get("operator") or {}).items() if k in seen}
    except Exception:
        codes["operator"] = {}
    # the one term whose text is a measurement rather than a definition
    terms = dict(GLOSSARY)
    try:
        g = operator_gap()
        t = terms.get("operator_code_limit")
        if t:
            terms["operator_code_limit"] = (t[0], (
                "The four-letter operator designator is the one code the FAA does not publish a "
                "table for. Names here are merged from two FAA lists, a December 2006 "
                "cross-reference and the current list of certificated 121 and 135 operators. "
                "{resolved:,} of the {designators:,} designators in this data resolve to a name, "
                "covering {covered_pct}% of all reports. The rest are shown exactly as filed."
            ).format(**g))
    except Exception as e:
        app.logger.warning("operator_code_limit not substituted: %s", e)
    return jsonify({"terms": terms, "codes": codes, "ata": ATA})



# ---------------------------------------------------------------------------
# Features 16 to 25. Each one answers a question a reporter actually asks,
# and each rests on a column whose fill rate was checked against the corpus.
# ---------------------------------------------------------------------------

@app.route("/api/fleet")
def api_fleet():
    """16. One airline flying one type: everything it has written up, and on how
    many separate airframes. Turns 'an airline had a problem' into 'this many of
    its aircraft had it'."""
    op = (request.args.get("operator") or "").strip().upper()
    model = (request.args.get("model") or "").strip().upper()
    if not op:
        return jsonify({"error": "need operator"}), 400
    w = "WHERE upper(OperatorDesignator) = ?"
    p = [op]
    if model:
        w += " AND upper(AircraftModel) = ?"
        p.append(model)
    c = con()
    tot, tails = c.execute("SELECT COUNT(*), COUNT(DISTINCT RegistryNNumber) FROM sdr_clean " + w, p).fetchone()
    systems = c.execute("SELECT JASCCode k, COUNT(*) n, COUNT(DISTINCT RegistryNNumber) a "
                        "FROM sdr_clean %s GROUP BY 1 HAVING k <> '' ORDER BY a DESC, n DESC LIMIT 20" % w, p).fetchall()
    parts = c.execute("SELECT PartName k, COUNT(*) n, COUNT(DISTINCT RegistryNNumber) a "
                      "FROM sdr_clean %s GROUP BY 1 HAVING k <> '' ORDER BY a DESC LIMIT 20" % w, p).fetchall()
    models = c.execute("SELECT AircraftMake || ' ' || AircraftModel k, COUNT(*) n, "
                       "COUNT(DISTINCT RegistryNNumber) a FROM sdr_clean %s GROUP BY 1 "
                       "ORDER BY n DESC LIMIT 20" % w, p).fetchall()
    months = c.execute("SELECT strftime(difficulty_dt, '%Y-%m') m, COUNT(*) n FROM sdr_clean "
                       + w + " AND difficulty_dt IS NOT NULL GROUP BY 1 ORDER BY 1", p).fetchall()
    c.close()
    return jsonify({"operator": op, "model": model, "reports": tot, "aircraft": tails,
                    "systems": [{"jasc": jasc(k), "reports": n, "aircraft": a} for k, n, a in systems],
                    "parts": [{"part": k, "reports": n, "aircraft": a} for k, n, a in parts],
                    "models": [{"model": k, "reports": n, "aircraft": a} for k, n, a in models],
                    "months": [{"month": m, "n": n} for m, n in months]})


@app.route("/api/corrosion")
def api_corrosion():
    """17. Corrosion and cracking, the slow structural story. Level 3 is the rare
    one: it obliges the operator to tell the regulator within three days and to
    act across the fleet."""
    c = con()
    lv = c.execute("SELECT CorrosionLevel k, COUNT(*) n, COUNT(DISTINCT RegistryNNumber) a "
                   "FROM sdr_clean WHERE CorrosionLevel <> '' GROUP BY 1 ORDER BY 1").fetchall()
    worst = c.execute(("SELECT %s FROM sdr_clean WHERE CorrosionLevel = '3' "
                       + ORDER_NEWEST + " LIMIT 60") % ROWCOLS).fetchall()
    worst = rows_as_dicts(c, worst)
    bymodel = c.execute("SELECT AircraftMake || ' ' || AircraftModel k, COUNT(*) n, "
                        "COUNT(DISTINCT RegistryNNumber) a FROM sdr_clean WHERE CorrosionLevel <> '' "
                        "GROUP BY 1 ORDER BY n DESC LIMIT 20").fetchall()
    byop = c.execute("SELECT OperatorDesignator k, COUNT(*) n, COUNT(DISTINCT RegistryNNumber) a "
                     "FROM sdr_clean WHERE CorrosionLevel <> '' AND k <> '' "
                     "GROUP BY 1 ORDER BY n DESC LIMIT 20").fetchall()
    cracks = c.execute("""
        SELECT AircraftMake || ' ' || AircraftModel k, COUNT(*) n,
               SUM(TRY_CAST(NULLIF(NumberOfCracks,'') AS BIGINT)) total_cracks,
               MAX(TRY_CAST(NULLIF(CrackLength,'') AS DOUBLE)) longest
        FROM sdr_clean
        WHERE NULLIF(NumberOfCracks,'') IS NOT NULL OR NULLIF(CrackLength,'') IS NOT NULL
        GROUP BY 1 ORDER BY n DESC LIMIT 20""").fetchall()
    c.close()
    return jsonify({
        "levels": [{"level": k, "meaning": _c("corrosion", k), "reports": n, "aircraft": a} for k, n, a in lv],
        "level3": worst,
        "by_model": [{"model": k, "reports": n, "aircraft": a} for k, n, a in bymodel],
        "by_operator": [{"operator": k, "reports": n, "aircraft": a} for k, n, a in byop],
        "cracks_by_model": [{"model": k, "reports": n, "cracks": t, "longest_inches": l}
                            for k, n, t, l in cracks]})


@app.route("/api/ageing")
def api_ageing():
    """18. Do the old airframes break differently? Groups reports by hours flown
    and by takeoff-and-landing cycles, then shows which systems dominate each band.
    Cycles matter more than hours for cracking, because each flight pressurises
    and depressurises the hull."""
    band, col = _choice(request.args, "by",
        {"hours": "AircraftTotalTime", "cycles": "AircraftTotalCycles"}, "hours")
    edges = [0, 5000, 15000, 30000, 50000, 75000, 100000]
    c = con()
    out = []
    for i, lo in enumerate(edges):
        hi = edges[i + 1] if i + 1 < len(edges) else None
        cond = "TRY_CAST(NULLIF(%s,'') AS BIGINT) >= %d" % (col, lo)
        if hi:
            cond += " AND TRY_CAST(NULLIF(%s,'') AS BIGINT) < %d" % (col, hi)
        n, a = c.execute("SELECT COUNT(*), COUNT(DISTINCT RegistryNNumber) FROM sdr_clean WHERE " + cond).fetchone()
        if not n:
            continue
        sysrows = c.execute("SELECT JASCCode k, COUNT(*) x FROM sdr_clean WHERE %s AND k <> '' "
                            "GROUP BY 1 ORDER BY x DESC LIMIT 5" % cond).fetchall()
        corr = c.execute("SELECT COUNT(*) FROM sdr_clean WHERE %s AND CorrosionLevel <> ''" % cond).fetchone()[0]
        out.append({"from": lo, "to": hi, "reports": n, "aircraft": a,
                    "corrosion_reports": corr,
                    "corrosion_share": round(100.0 * corr / n, 1),
                    "top_systems": [{"jasc": jasc(k), "n": x} for k, x in sysrows]})
    c.close()
    return jsonify({"measure": "cycles" if band == "cycles" else "hours", "bands": out})


@app.route("/api/engines")
def api_engines():
    """19. The engine view. Only 3% of reports name the engine, so this is a
    small, honest sample rather than a fleet-wide rate, and it says so."""
    c = con()
    tot = c.execute("SELECT COUNT(*) FROM sdr_clean").fetchone()[0]
    named = c.execute("SELECT COUNT(*) FROM sdr_clean WHERE EngineModel <> ''").fetchone()[0]
    rows = c.execute("""
        SELECT EngineMake mk, EngineModel md, COUNT(*) n,
               COUNT(DISTINCT RegistryNNumber) a,
               SUM(CASE WHEN PrecautionaryProcedureA = 'E' OR PrecautionaryProcedureB = 'E'
                        OR PrecautionaryProcedureC = 'E' OR PrecautionaryProcedureD = 'E'
                        THEN 1 ELSE 0 END) shutdowns,
               SUM(CASE WHEN NatureOfConditionA IN ('X','Y') OR NatureOfConditionB IN ('X','Y') OR NatureOfConditionC IN ('X','Y') THEN 1 ELSE 0 END) flameout_or_stop
        FROM sdr_clean WHERE EngineModel <> '' GROUP BY 1, 2 ORDER BY n DESC LIMIT 40""").fetchall()
    c.close()
    return jsonify({"reports_naming_an_engine": named, "total_reports": tot,
                    "caveat": "Only %.1f%% of reports name an engine, so these are counts within "
                              "that subset, not failure rates per engine in service."
                              % (100.0 * named / tot),
                    "rows": [{"make": mk, "make_name": make_name(mk), "model": md,
                              "reports": n, "aircraft": a, "inflight_shutdowns": sd,
                              "flameout_or_stoppage": fs} for mk, md, n, a, sd, fs in rows]})


@app.route("/api/emerging")
def api_emerging():
    """20. Early warning: parts and systems being written up now that barely
    appeared before. A defect that is new is more interesting than one that is big."""
    field, expr = _choice(request.args, "by",
        {"part": "PartName", "jasc": "JASCCode",
         "condition": "PartCondition", "partnumber": "PartNumber"}, "part")
    days = _int_arg(request.args, "days", 120, 1, 400)
    c = con()
    rows = c.execute("""
        WITH bounds AS (SELECT max(difficulty_dt) mx FROM sdr_clean),
        now_ AS (SELECT %s k, COUNT(*) n, COUNT(DISTINCT RegistryNNumber) a,
                        COUNT(DISTINCT OperatorDesignator) o
                 FROM sdr_clean, bounds WHERE difficulty_dt > mx - INTERVAL %d DAY GROUP BY 1),
        before_ AS (SELECT %s k, COUNT(*) n FROM sdr_clean, bounds
                    WHERE difficulty_dt <= mx - INTERVAL %d DAY GROUP BY 1)
        SELECT n.k, n.n, COALESCE(b.n, 0) earlier, n.a, n.o
        FROM now_ n LEFT JOIN before_ b USING (k)
        WHERE n.k IS NOT NULL AND n.k <> '' AND n.n >= 5 AND COALESCE(b.n, 0) <= n.n / 4
        ORDER BY n.n DESC LIMIT 30""" % (expr, days, expr, days)).fetchall()
    c.close()
    return jsonify({"window_days": days, "by": field,
                    "rows": [{"key": k, "label": jasc(k)["label"] if field == "jasc" else k,
                              "recent": n, "earlier": e, "aircraft": a, "operators": o}
                             for k, n, e, a, o in rows]})


@app.route("/api/clusters")
def api_clusters():
    """21. Same airline, same system, same day, several different aircraft. That
    pattern points at a fleet-wide cause rather than one unlucky machine."""
    minac = _int_arg(request.args, "min", 3, 2, 50)
    c = con()
    rows = c.execute("""
        WITH cl AS (
          SELECT OperatorDesignator op, JASCCode k, difficulty_dt d,
                 COUNT(DISTINCT RegistryNNumber) a, COUNT(*) n,
                 string_agg(DISTINCT RegistryNNumber, ', ') tails,
                 any_value(PartName) part
          FROM sdr_clean
          WHERE difficulty_dt IS NOT NULL AND OperatorDesignator <> '' AND JASCCode <> ''
            AND RegistryNNumber <> ''
          GROUP BY 1, 2, 3 HAVING a >= ?),
        rep AS (SELECT op, k, COUNT(*) ndays FROM cl GROUP BY 1, 2)
        SELECT cl.op, cl.k, cl.d, cl.a, cl.n, cl.tails, cl.part, rep.ndays
        FROM cl JOIN rep USING (op, k)
        ORDER BY cl.a DESC, cl.d DESC LIMIT 80""", [minac]).fetchall()
    c.close()
    return jsonify({
        "caveat": "A big cluster is not automatically an incident. When the same airline clusters on "
                  "the same system on many separate days, you are usually looking at a scheduled "
                  "inspection working through the fleet. The 'other days like this' column is there "
                  "to tell the two apart: a low number is the interesting case.",
        "rows": [{"operator": op, "jasc": jasc(k), "date": str(d)[:10], "aircraft": a,
                  "reports": n, "tails": t, "example_part": pt, "other_days_like_this": nd - 1,
                  "looks_routine": nd >= 5}
                 for op, k, d, a, n, t, pt, nd in rows]})


STOP = set("""the a an and or of to in on for with at by from is was were be been being it its this that
these those as not no but if then than so out up off into over under after before during
which when where who whom whose what how why all any both each few more most other some such
only own same too very can will just should now aircraft was were found during per due had has have
c/a disc ops chk iaw removed replaced installed checked check normal report reported reports
left right fwd aft upper lower one two three number nbr ref p/n s/n mm ea""".split())


@app.route("/api/phrases")
def api_phrases():
    """22. What words dominate the selection you are looking at, compared with the
    corpus as a whole. Reads the engineers' own vocabulary back to you, so you can
    search for the term the trade actually uses."""
    w, p = _filters(request.args)
    if not w:
        return jsonify({"error": "narrow the selection first"}), 400
    c = con()
    sel_n = c.execute("SELECT COUNT(*) FROM sdr_clean" + w, p).fetchone()[0]
    if not sel_n:
        c.close()
        return jsonify({"selection": 0, "rows": []})
    tot_n = c.execute("SELECT COUNT(*) FROM sdr_clean").fetchone()[0]
    sel = c.execute("""
        SELECT word, COUNT(*) n FROM (
          SELECT unnest(regexp_split_to_array(lower(Discrepancy), '[^a-z0-9/&]+')) word
          FROM sdr_clean %s) WHERE length(word) >= 3 GROUP BY 1 ORDER BY n DESC LIMIT 400""" % w,
        p).fetchall()
    words = [x[0] for x in sel if x[0] not in STOP][:120]
    out = []
    if words:
        # count REPORTS containing the word, not occurrences of it, so the row equals
        # the number the reader lands on when they click it
        selc = ", ".join("SUM(CASE WHEN lower(Discrepancy) LIKE '%%'||?||'%%' THEN 1 ELSE 0 END)"
                         for _ in words)
        srow = c.execute("SELECT %s FROM sdr_clean%s" % (selc, w), words + p).fetchone()
        brow = c.execute("SELECT %s FROM sdr_clean" % selc, words).fetchone()
        for i, wd in enumerate(words):
            here, corpus_n = srow[i], brow[i]
            if not here:
                continue
            a = here / sel_n
            b = max(corpus_n, 1) / tot_n
            out.append({"word": wd, "in_selection": here, "corpus": corpus_n,
                        "lift": round(a / b, 1)})
        out.sort(key=lambda r: (-r["lift"], -r["in_selection"]))
    c.close()
    return jsonify({"selection": sel_n, "corpus": tot_n, "rows": out[:40]})


@app.route("/api/case/<path:control>")
def api_case(control):
    """23. One report, fully decoded, in a form you can quote and cite. Every code
    is spelled out and the FAA's own wording is carried alongside."""
    c = con()
    rows = c.execute("SELECT * FROM sdr_clean WHERE OperatorControlNumber = ? LIMIT 1", [control.strip()]).fetchall()
    if not rows:
        c.close()
        return jsonify({"error": "not found"}), 404
    cols = [x[0] for x in c.description]
    d = dict(zip(cols, rows[0]))
    tail = d.get("RegistryNNumber") or ""
    same_tail = c.execute("SELECT COUNT(*) FROM sdr_clean WHERE RegistryNNumber = ? AND RegistryNNumber <> ''",
                          [tail]).fetchone()[0]
    pn = (d.get("PartNumber") or "").strip()
    same_part = 0 if (not pn or pn.upper() in ("UNKNOWN", "NONE", "NA", "N/A", "UNK", "UKNOWN")) \
        else c.execute("SELECT COUNT(*) FROM sdr_clean WHERE PartNumber = ?", [pn]).fetchone()[0]
    c.close()
    decode_row(d)
    crew = [x for x in (_c("precaution", d.get("PrecautionaryProcedure" + s)) for s in "ABCD") if x]
    nature = [x for x in (_c("nature", d.get("NatureOfCondition" + s)) for s in "ABC") if x]
    d["_crew_all"] = [x for x in crew if x.get("faa") not in ("NONE", "NOT AVAILABLE")]
    d["_nature_all"] = [x for x in nature if x.get("faa") != "NOT AVAILABLE"]
    d["_context"] = {"reports_on_this_tail": same_tail, "reports_on_this_part_number": same_part}
    MONF = ["", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"]

    def _dm(us):
        p2 = (us or "").split("/")
        return "%d %s %s" % (int(p2[1]), MONF[int(p2[0])], p2[2]) if len(p2) == 3 else (us or "")

    def _di(iso):
        p2 = (iso or "")[:10].split("-")
        return "%d %s %s" % (int(p2[2]), MONF[int(p2[1])], p2[0]) if len(p2) == 3 else ""

    diff = _dm(d.get("DifficultyDate"))
    filed = _di(d.get("SubmissionDate"))
    # the difficulty date is when it happened; the submission date is when it was
    # filed. Printing the first under the word "filed" put a wrong date in a citation.
    d["_cite"] = ("FAA Service Difficulty Report %s. Difficulty dated %s%s. Source: FAA Service "
                  "Difficulty Reporting System, https://sdrs.faa.gov"
                  % (control, diff, (", filed with the FAA " + filed) if filed else ""))
    if PUBLIC_BASE:
        d["_permalink"] = "%s/?case=%s" % (PUBLIC_BASE, control)
    return jsonify(d)


@app.route("/api/consequences")
def api_consequences():
    """24. Not what broke, but what the crew had to do about it: engine shut down
    in flight, cabin depressurised, oxygen masks dropped, take-off aborted.
    Ranked by operator or by type, because that is the comparison readers grasp."""
    by, col = _choice(request.args, "by",
        {"operator": "OperatorDesignator", "model": "AircraftMake || ' ' || AircraftModel",
         "make": "AircraftMake"}, "operator")
    watch = ["A", "B", "C", "E", "F", "G", "I", "J", "L", "R"]
    anyexpr = " OR ".join("PrecautionaryProcedure%s IN (%s)" % (s, ",".join("'%s'" % x for x in watch))
                          for s in "ABCD")
    sel = ", ".join(
        "SUM(CASE WHEN PrecautionaryProcedureA='{0}' OR PrecautionaryProcedureB='{0}' "
        "OR PrecautionaryProcedureC='{0}' OR PrecautionaryProcedureD='{0}' THEN 1 ELSE 0 END) c_{0}".format(x)
        for x in watch)
    c = con()
    rows = c.execute(
        "SELECT %s k, COUNT(*) total, SUM(CASE WHEN %s THEN 1 ELSE 0 END) acted, %s "
        "FROM sdr_clean GROUP BY 1 HAVING k IS NOT NULL AND k <> '' AND total >= 200 "
        "ORDER BY acted DESC LIMIT 30" % (col, anyexpr, sel)).fetchall()
    c.close()
    out = []
    for r in rows:
        k, total, acted = r[0], r[1], r[2]
        out.append({"key": k, "reports": total, "with_crew_action": acted,
                    "share": round(100.0 * acted / total, 2),
                    "actions": [{"code": x, "label": label("precaution", x, x), "n": r[3 + i]}
                                for i, x in enumerate(watch) if r[3 + i]]})
    return jsonify({"by": by, "note": "A share is per report filed, not per flight. An airline that "
                                      "files more reports is not necessarily less safe.", "rows": out})


@app.route("/api/inspection-method")
def api_inspection():
    """25. How was it found? A crack found by eddy current or X-ray was invisible
    from outside; one found by eye was not. Splitting a system's findings by
    method tells you whether trouble is being caught early or spotted late."""
    w, p = _filters(request.args)
    c = con()
    tot = c.execute("SELECT COUNT(*) FROM sdr_clean" + w, p).fetchone()[0]
    rows = c.execute("SELECT HowDiscoveredCode k, COUNT(*) n FROM sdr_clean%s "
                     "GROUP BY 1 ORDER BY n DESC" % w, p).fetchall()
    NDT = {"B", "D", "E", "M", "T", "U", "X"}
    bysys = c.execute("""
        SELECT JASCCode k, COUNT(*) n,
               SUM(CASE WHEN HowDiscoveredCode IN ('B','D','E','M','T','U','X') THEN 1 ELSE 0 END) ndt
        FROM sdr_clean%s GROUP BY 1 HAVING k <> '' AND n >= 100
        ORDER BY ndt * 1.0 / n DESC LIMIT 20""" % w, p).fetchall()
    c.close()
    return jsonify({
        "total": tot,
        "methods": [{"code": k, "meaning": _c("discovered", k), "n": n,
                     "instrumented": k in NDT} for k, n in rows],
        "instrumented_total": sum(n for k, n in rows if k in NDT),
        "explainer": "Instrumented methods (borescope, dye penetrant, eddy current, magnetic "
                     "particle, thermal, ultrasonic, X-ray) find damage that cannot be seen from "
                     "outside. A high share means the damage was hidden.",
        "systems_most_instrumented": [{"jasc": jasc(k), "reports": n, "instrumented": d,
                                       "share": round(100.0 * d / n, 1)} for k, n, d in bysys]})




def make_name(code):
    """The manufacturer in a form a reader recognises. The FAA's registered name is
    correct but often unwieldy: "GROUP ECONOMIQUE AIRBUS INDUSTRIE", "CANADAIR LTD
    SUB GENERAL DYNAMICS". When the filed code appears as a whole word inside that
    name, the code is the name people use, so it wins. Otherwise the registered
    name is trimmed at the corporate tail. The full string stays in the explanation."""
    code = (code or "").strip().upper()
    if not code:
        return ""
    e = _c("part_make", code)
    if not e:
        return code.title()
    full = (e.get("label") or code).strip()
    if len(code) >= 4 and re.search(r"\b%s\b" % re.escape(code), full):
        return code.title()
    trimmed = re.split(r"\s+(?:SUB|DIV|DBA|A/C|AIRCRAFT CO)\b", full)[0].strip()
    return (trimmed or full).title()


def _readable_model(make, model):
    """Insert the dash a reader expects: 7378H4 becomes 737-8H4, A320214 becomes
    A320-214. Deliberately stops there. The series a suffix implies is ambiguous
    in this data (7378 is a MAX 8, 7378H4 is a 737-800), so it is never guessed."""
    m = (model or "").strip().upper()
    if not m:
        return ""
    if re.match(r"^7[0-9]7", m) and len(m) > 3:
        return m[:3] + "-" + m[3:]
    if re.match(r"^A3[0-9]{2}", m) and len(m) > 4:
        return m[:4] + "-" + m[4:]
    if re.match(r"^CL6[0-9]{2}", m) and len(m) > 5:
        return m[:5] + "-" + m[5:]
    return m


@app.route("/api/explain")
def api_explain():
    """Everything behind one value in the table, for the panel that opens on hover.
    Counts are computed here rather than shipped with every row, and the browser
    caches each answer, so a table of 100 reports costs a handful of queries."""
    kind = (request.args.get("kind") or "").strip()
    v = (request.args.get("v") or "").strip()
    v2 = (request.args.get("v2") or "").strip()
    if not kind or not v:
        return jsonify({"error": "need kind and v"}), 400
    c = con()
    out = {"kind": kind, "value": v}
    try:
        if kind == "operator":
            e = _c("operator", v.upper())
            out["title"] = e["label"] if e else v.upper()
            out["subtitle"] = "FAA operator designator " + v.upper()
            out["source"] = ("Name from the FAA's Air Carrier/Operator cross-reference, "
                             "December 2006 edition. Check current ownership before you publish: "
                             "carriers merge and rename, and this list still has Continental and "
                             "Jet Solutions under their old names.") if e else                             ("This code is not in the FAA's 2006 cross-reference, which is the most "
                             "recent list obtainable. The operator is almost certainly certificated "
                             "after 2006.")
            n, ac, first, last = c.execute(
                "SELECT COUNT(*), COUNT(DISTINCT RegistryNNumber), min(difficulty_dt), max(difficulty_dt) "
                "FROM sdr_clean WHERE upper(OperatorDesignator) = ?", [v.upper()]).fetchone()
            types = c.execute(
                "SELECT AircraftMake || ' ' || AircraftModel k, COUNT(*) n FROM sdr_clean "
                "WHERE upper(OperatorDesignator) = ? GROUP BY 1 ORDER BY n DESC LIMIT 4",
                [v.upper()]).fetchall()
            out["facts"] = [("Reports here", "{:,}".format(n)),
                            ("Separate aircraft", "{:,}".format(ac)),
                            ("First and last", "%s to %s" % (str(first)[:10], str(last)[:10]))]
            out["list"] = [{"label": k, "n": x} for k, x in types]
            out["list_title"] = "Types it files on"

        elif kind == "aircraft":
            mk = _c("part_make", v.upper())
            out["title"] = make_name(v) + " " + _readable_model(v, v2)
            out["subtitle"] = "Filed as %s %s%s" % (
                v.upper(), v2.upper(),
                (". FAA register: " + mk["label"]) if mk and mk["label"].upper() != make_name(v).upper() else "")
            out["source"] = ("Manufacturer name from the FAA's own manufacturer table. The model is "
                             "shown as the operator filed it, with a dash inserted where the reader "
                             "expects one. The FAA publishes no plain-language name for these model "
                             "codes, and the series a suffix implies is ambiguous, so it is not guessed.")
            n, ac = c.execute("SELECT COUNT(*), COUNT(DISTINCT RegistryNNumber) FROM sdr_clean "
                              "WHERE upper(AircraftMake) = ? AND upper(AircraftModel) = ?",
                              [v.upper(), v2.upper()]).fetchone()
            sysrows = c.execute(
                "SELECT JASCCode k, COUNT(*) n FROM sdr_clean WHERE upper(AircraftMake) = ? "
                "AND upper(AircraftModel) = ? AND k <> '' GROUP BY 1 ORDER BY n DESC LIMIT 4",
                [v.upper(), v2.upper()]).fetchall()
            out["facts"] = [("Reports on this type", "{:,}".format(n)),
                            ("Separate aircraft", "{:,}".format(ac))]
            out["list"] = [{"label": jasc(k)["label"], "n": x} for k, x in sysrows]
            out["list_title"] = "What goes wrong on it most"

        elif kind == "tail":
            tail = v.upper().lstrip("N")
            row = c.execute(
                "SELECT any_value(AircraftMake), any_value(AircraftModel), any_value(OperatorDesignator), "
                "COUNT(*), min(difficulty_dt), max(difficulty_dt), "
                "max(TRY_CAST(NULLIF(AircraftTotalTime,'') AS BIGINT)), "
                "max(TRY_CAST(NULLIF(AircraftTotalCycles,'') AS BIGINT)) "
                "FROM sdr_clean WHERE upper(RegistryNNumber) = ?", [tail]).fetchone()
            mk, md, op, n, first, last, hrs, cyc = row
            opn = _c("operator", (op or "").upper())
            out["title"] = "N" + tail
            out["subtitle"] = "%s %s%s" % (make_name(mk),
                                           _readable_model(mk, md),
                                           (", " + opn["label"]) if opn else "")
            out["facts"] = [("Reports on this airframe", "{:,}".format(n)),
                            ("First and last", "%s to %s" % (str(first)[:10], str(last)[:10]))]
            if hrs: out["facts"].append(("Hours flown", "{:,}".format(hrs)))
            if cyc: out["facts"].append(("Takeoffs and landings", "{:,}".format(cyc)))
            out["source"] = ("The tail number is the registration painted on this one airframe. "
                             "Following it shows the history of a single machine rather than a type.")

        elif kind == "part":
            n, ac, ops_ = c.execute(
                "SELECT COUNT(*), COUNT(DISTINCT RegistryNNumber), COUNT(DISTINCT OperatorDesignator) "
                "FROM sdr_clean WHERE upper(PartName) = ?", [v.upper()]).fetchone()
            conds = c.execute("SELECT PartCondition k, COUNT(*) n FROM sdr_clean WHERE upper(PartName) = ? "
                              "AND k <> '' GROUP BY 1 ORDER BY n DESC LIMIT 5", [v.upper()]).fetchall()
            out["title"] = v.upper()
            out["subtitle"] = "Part, as named by the mechanic"
            if v2:
                mk = _c("part_make", v2.upper())
                out["subtitle"] += " &middot; made by " + (mk["label"] if mk else v2.upper())
            out["facts"] = [("Reports naming this part", "{:,}".format(n)),
                            ("Separate aircraft", "{:,}".format(ac)),
                            ("Airlines reporting it", "{:,}".format(ops_))]
            out["list"] = [{"label": k, "n": x} for k, x in conds]
            out["list_title"] = "How it is usually found"
            out["source"] = ("Part names come from a fixed FAA list of 2,033 names, so they are "
                             "consistent across airlines and worth filtering on.")
        else:
            c.close()
            return jsonify({"error": "unknown kind"}), 400
    finally:
        try: c.close()
        except Exception: pass
    return jsonify(out)



# ---------------------------------------------------------------------------
# The hero: one query set that feeds all four visual treatments of whatever the
# reporter has currently filtered. Everything here is the real selection, so a
# hero can never show a number the table below it disagrees with.
# ---------------------------------------------------------------------------

ZONE_EXPR = "regexp_extract(upper(PartLocation), '^Z(?:ONE|N) *([1-9])[0-9][0-9]', 1) || '00'"

SWARM_CAP = 900
_CORPUS_MONTHS = {}   # the whole-corpus monthly series never changes between rebuilds
_CORPUS_N = None      # row count of the live database, read once, never typed in


_OPGAP = None


def operator_gap():
    """How many reports name no operator, and how many designators resolve.

    These were typed into the page once, measured against a three-year file, and
    were still there when the file reached twenty-six years: 3,076 and 98.7% both
    described a corpus that no longer existed. Measured here instead, so the
    sentence the reader sees cannot drift away from the data underneath it."""
    global _OPGAP
    if _OPGAP is None:
        c = con()
        try:
            tot = c.execute("SELECT COUNT(*) FROM sdr_clean").fetchone()[0]
            rows = c.execute("""SELECT upper(trim(OperatorDesignator)) o, COUNT(*) n
                                FROM sdr_clean
                                WHERE OperatorDesignator IS NOT NULL
                                  AND trim(OperatorDesignator) <> ''
                                GROUP BY 1""").fetchall()
        finally:
            c.close()
        table = _codeset("operator")
        with_op = sum(n for _, n in rows)
        res = [(o, n) for o, n in rows if o in table]
        blank = tot - with_op
        _OPGAP = {
            "total": tot,
            "no_operator": blank,
            "no_operator_pct": round(100.0 * blank / tot, 1) if tot else 0,
            "designators": len(rows),
            "resolved": len(res),
            "covered": sum(n for _, n in res),
            "covered_pct": round(100.0 * sum(n for _, n in res) / tot, 1) if tot else 0,
        }
        _OPGAP["sentence"] = (
            "{no_operator:,} reports, {no_operator_pct}% of the file, name no operator. "
            "The filers who leave it blank are usually not the operator: repair stations and "
            "individual mechanics working on someone else's aircraft. The aircraft is still "
            "identified by its tail number."
        ).format(**_OPGAP)
    return _OPGAP


def corpus_n():
    """The size of the corpus, asked of the database rather than remembered.
    A literal here was wrong for months after the file grew from three years to
    twenty-six: the page said 170,201 while the database held 1.5 million."""
    global _CORPUS_N
    if _CORPUS_N is None:
        c = con()
        try:
            _CORPUS_N = c.execute("SELECT COUNT(*) FROM sdr_clean").fetchone()[0]
        finally:
            c.close()
    return _CORPUS_N

_ZONE_ORDER = ["ZONE 200", "ZONE 100", "ZONE 800", "ZONE 300", "ZONE 500",
               "ZONE 600", "ZONE 400", "ZONE 700", "ZONE 900"]


def _selection_title(args):
    """Say in words what the reporter is looking at, so the hero can headline it."""
    bits = []
    op = (args.get("operator") or "").strip().upper()
    stale = False
    if op:
        e = _c("operator", op)
        bits.append(("%s (%s)" % (e["label"], op)) if e else op)
        stale = bool(e)
    jc = (args.get("jasc") or "").strip()
    if jc:
        bits.append(jasc(jc)["label"])
    elif (args.get("ata") or "").strip():
        a = args.get("ata").strip()[:2]
        bits.append(ATA.get(a, "Chapter " + a))
    z = (args.get("zone") or "").strip().upper()
    if z:
        bits.append(label("part_location", z, z))
    for field, table in (("nature", "nature"), ("crew", "precaution"),
                         ("discovered", "discovered"), ("stage", "stage"),
                         ("corrosion", "corrosion")):
        v = (args.get(field) or "").strip().upper()
        if v:
            bits.append(label(table, v, v))
    for field in ("make", "model", "tail", "part", "condition"):
        v = (args.get(field) or "").strip()
        if v:
            bits.append(v)
    MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    def _pretty(d):
        try:
            y, m, dd = (int(x) for x in d.split("-"))
            return "%d %s %d" % (dd, MON[m], y)
        except Exception:
            return d

    f, t = (args.get("from") or "").strip(), (args.get("to") or "").strip()
    if f and t:
        # one month exactly, named as a month rather than as two dates
        if f[:7] == t[:7] and f[8:] == "01":
            y, m = int(f[:4]), int(f[5:7])
            bits.append("%s %d" % (MON[m], y))
        else:
            bits.append("%s to %s" % (_pretty(f), _pretty(t)))
    elif f:
        bits.append("from %s" % _pretty(f))
    elif t:
        bits.append("up to %s" % _pretty(t))
    q = (args.get("q") or "").strip()
    if q:
        bits.append('"%s"' % q)
    if (args.get("cracked") or "") == "1":
        bits.append("cracking recorded")
    mh = (args.get("minhours") or "").strip()
    if mh.isdigit():
        bits.append("%s hours or more" % "{:,}".format(int(mh)))
    if not bits:
        return "Every report", "all %s, nothing filtered yet" % "{:,}".format(corpus_n())
    rest = bits[1:]
    if stale:
        rest.insert(0, "name as filed, FAA 2006 list")
    return bits[0], " &middot; ".join(rest)


_LAG = {}


def _lag():
    """A report reaches the FAA days to months after the difficulty it describes, so
    the newest months in the file are still filling up. Without this the chart shows
    a fall that is only the post arriving late, which is a story that is not there."""
    if not _LAG:
        c = con()
        row = c.execute(
            "SELECT quantile_cont(datediff('day', difficulty_dt, "
            "  TRY_CAST(SubmissionDate AS DATE)), 0.95), max(difficulty_dt) "
            "FROM sdr_clean WHERE difficulty_dt IS NOT NULL "
            "  AND datediff('day', difficulty_dt, TRY_CAST(SubmissionDate AS DATE)) >= 0"
        ).fetchone()
        c.close()
        p95 = int(row[0] or 0)
        last = row[1]
        # a month counts as settled once 95% of what it will hold has had time to arrive
        cutoff = (last - datetime.timedelta(days=p95)).date() if last else None
        _LAG.update({"p95_days": p95, "file_to": str(last)[:10] if last else None,
                     "settled_before": str(cutoff) if cutoff else None})
    return dict(_LAG)


@app.route("/api/hero")
def api_hero():
    """Feeds all four rails of the instrument from one selection."""
    global _CORPUS_MONTHS
    w, p = _filters(request.args)
    c = con()
    corpus = c.execute("SELECT COUNT(*) FROM sdr_clean").fetchone()[0]
    total, aircraft, operators, no_tail = c.execute(
        "SELECT COUNT(*), COUNT(DISTINCT NULLIF(RegistryNNumber,'')), "
        "COUNT(DISTINCT NULLIF(OperatorDesignator,'')), "
        "SUM(CASE WHEN NULLIF(RegistryNNumber,'') IS NULL THEN 1 ELSE 0 END) "
        "FROM sdr_clean" + w, p).fetchone()
    title, subtitle = _selection_title(request.args)
    out_lag = _lag()
    # the real span of what is selected, so a rate is counted against the days the
    # reports actually cover rather than against the whole file
    d0, d1, dated = c.execute(
        "SELECT min(difficulty_dt), max(difficulty_dt), COUNT(difficulty_dt) "
        "FROM sdr_clean" + w, p).fetchone()
    span = None
    if d0 and d1:
        span = {"from": str(d0)[:10], "to": str(d1)[:10],
                "days": (d1.date() - d0.date()).days + 1, "dated": dated}
    out = {"title": title, "subtitle": subtitle, "total": total, "aircraft": aircraft,
           "operators": operators, "corpus": corpus, "reports_without_tail": no_tail,
           "span": span, "lag": out_lag,
           "share": round(100.0 * total / corpus, 2) if corpus else 0}
    if not total:
        # nothing matched: work out which one constraint is responsible, by dropping
        # each in turn. That is the only question the reporter has at this moment.
        loo = []
        for k in list(request.args.keys()):
            if k in ("hero", "view", "aircraft", "case", "limit", "offset", "cf", "ca", "cb"):
                continue
            trimmed = {kk: vv for kk, vv in request.args.items() if kk != k}
            try:
                w2, p2 = _filters(trimmed)
            except BadFilter:
                continue
            n = c.execute("SELECT COUNT(*) FROM sdr_clean" + w2, p2).fetchone()[0]
            if n:
                loo.append({"drop": k, "value": request.args.get(k), "would_give": n})
        loo.sort(key=lambda r: -r["would_give"])
        if not _CORPUS_MONTHS:
            _CORPUS_MONTHS = dict(c.execute(
                "SELECT strftime(difficulty_dt, '%Y-%m') m, COUNT(*) n FROM sdr_clean "
                "WHERE difficulty_dt IS NOT NULL GROUP BY 1").fetchall())
        ghost = [{"m": m, "n": 0, "all": _CORPUS_MONTHS[m]} for m in sorted(_CORPUS_MONTHS)]
        zghost = [{"code": z, "label": label("part_location", z, z), "n": 0} for z in _ZONE_ORDER]
        c.close()
        return jsonify(out | {"months": ghost, "zones": zghost, "swarm": [], "crew": [],
                              "lines": [], "unzoned": 0, "no_location": 0, "other_location": 0,
                              "swarm_total": 0, "crew_reports": 0, "leave_one_out": loo})

    # month by month, the selection against the corpus behind it
    if not _CORPUS_MONTHS:
        _CORPUS_MONTHS = dict(c.execute(
            "SELECT strftime(difficulty_dt, '%Y-%m') m, COUNT(*) n FROM sdr_clean "
            "WHERE difficulty_dt IS NOT NULL GROUP BY 1").fetchall())
    allm = _CORPUS_MONTHS
    selm = dict(c.execute(
        "SELECT strftime(difficulty_dt, '%Y-%m') m, COUNT(*) n FROM sdr_clean"
        + (w + " AND" if w else " WHERE") + " difficulty_dt IS NOT NULL GROUP BY 1", p).fetchall())
    out["months"] = [{"m": m, "n": selm.get(m, 0), "all": allm[m]} for m in sorted(allm)]

    # where on the airframe, for the zones the FAA actually codes
    zrows = dict(c.execute(
        "SELECT 'ZONE ' || %s k, COUNT(*) n FROM sdr_clean%s "
        "GROUP BY 1 HAVING k <> 'ZONE 00'" % (ZONE_EXPR, w), p).fetchall())
    nowhere = c.execute(
        "SELECT COUNT(*) FROM sdr_clean" + (w + " AND" if w else " WHERE") +
        " (NULLIF(trim(PartLocation),'') IS NULL OR upper(trim(PartLocation)) "
        "IN ('NONE','UNKNOWN','N/A','NA','UNK'))", p).fetchone()[0]
    out["zones"] = [{"code": z, "label": label("part_location", z, z), "n": zrows.get(z, 0)}
                    for z in _ZONE_ORDER]
    placed = sum(zrows.get(z, 0) for z in _ZONE_ORDER)
    out["unzoned"] = total - placed
    out["no_location"] = nowhere
    out["other_location"] = total - placed - nowhere

    # one dot per airframe
    sw = c.execute(
        "SELECT RegistryNNumber t, any_value(OperatorDesignator) o, COUNT(*) n FROM sdr_clean" +
        (w + " AND" if w else " WHERE") + " RegistryNNumber <> '' "
        "GROUP BY 1 ORDER BY n DESC, t LIMIT ?", p + [SWARM_CAP]).fetchall()
    out["swarm"] = [{"t": t, "o": o, "op": label("operator", (o or "").strip(), o or ""), "n": n}
                    for t, o, n in sw]
    out["swarm_total"] = aircraft
    # operators counted from the operators, never from the capped airframe list
    out["operator_rows"] = [{"o": o, "n": n} for o, n in c.execute(
        "SELECT OperatorDesignator o, COUNT(*) n FROM sdr_clean" +
        (w + " AND" if w else " WHERE") + " OperatorDesignator <> '' "
        "GROUP BY 1 ORDER BY n DESC, o LIMIT 8", p).fetchall()]

    # what the crew was forced to do
    watch = ["A", "B", "C", "E", "F", "G", "I", "J", "L", "R"]
    sel = ", ".join(
        "SUM(CASE WHEN PrecautionaryProcedureA='{0}' OR PrecautionaryProcedureB='{0}' "
        "OR PrecautionaryProcedureC='{0}' OR PrecautionaryProcedureD='{0}' THEN 1 ELSE 0 END)".format(x)
        for x in watch)
    row = c.execute("SELECT %s FROM sdr_clean%s" % (sel, w), p).fetchone()
    out["crew"] = [{"code": x, "label": label("precaution", x, x), "n": row[i]}
                   for i, x in enumerate(watch) if row[i]]
    out["crew"].sort(key=lambda r: -r["n"])
    # a report can carry up to four precautionary codes, so summing the per-code
    # counts double-counts reports. This is the distinct number of reports.
    anyexpr = " OR ".join("PrecautionaryProcedure%s IN (%s)" % (sfx, ",".join("'%s'" % x for x in watch))
                          for sfx in "ABCD")
    out["crew_reports"] = c.execute(
        "SELECT COUNT(*) FROM sdr_clean" + (w + " AND (" if w else " WHERE (") + anyexpr + ")",
        p).fetchone()[0]

    # the mechanics' own sentences, for the treatment that uses them as texture
    lines = c.execute(
        "SELECT Discrepancy, AircraftMake, AircraftModel, JASCCode, PartName, "
        "       PartCondition, StageOfOperationCode, HowDiscoveredCode, difficulty_dt, "
        "       OperatorControlNumber "
        "FROM sdr_clean" +
        (w + " AND" if w else " WHERE") + " length(Discrepancy) BETWEEN 60 AND 150 "
        + ORDER_NEWEST + " LIMIT 24", p).fetchall()
    out["lines"] = [re.sub(r"\s+", " ", (r[0] or "")).strip() for r in lines]
    # the same report said in the FAA's own words, so the shorthand above is not the
    # only thing on offer. Every part of this is a lookup, not an interpretation.
    if lines:
        r = lines[0]
        ctrl0 = r[9]
        out["specimen"] = {
            "text": out["lines"][0],
            "control": ctrl0,
            "aircraft": (" ".join(x for x in (make_name(r[1]), r[2]) if x)).strip(),
            "system": jasc(r[3])["label"],
            "part": (r[4] or "").strip().title(),
            "condition": label("condition", (r[5] or "").strip(), "") if r[5] else "",
            "stage": label("stage", (r[6] or "").strip().upper(), "") if r[6] else "",
            "found": label("discovered", (r[7] or "").strip().upper(), "") if r[7] else "",
            "date": str(r[8])[:10] if r[8] else "",
        }
    c.close()
    return jsonify(out)


@app.route("/api/freshness")
def api_freshness():
    """Twee data die makkelijk verward worden: wanneer wij voor het laatst bij de
    FAA hebben gekeken, en tot welke dag de meldingen zelf lopen. De FAA loopt
    doorgaans een paar dagen achter, dus die tweede is altijd ouder."""
    try:
        c = con()
        try:
            refreshed, newest, rows = c.execute(
                "SELECT refreshed_at, newest_report, rows FROM meta "
                "ORDER BY refreshed_at DESC LIMIT 1").fetchone()
        except Exception:
            # Database van voor de dagelijkse verversing: dan is alleen de
            # nieuwste melding bekend en zeggen we niets over het ophaalmoment.
            refreshed = None
            newest, rows = c.execute(
                "SELECT max(difficulty_dt), COUNT(*) FROM sdr_clean").fetchone()
        c.close()
        return jsonify({
            "refreshed_at": refreshed.isoformat() + "Z" if refreshed else None,
            "newest_report": str(newest)[:10] if newest else None,
            "rows": rows,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/healthz")
def healthz():
    try:
        c = con(); n = c.execute("SELECT COUNT(*) FROM sdr").fetchone()[0]; c.close()
        return jsonify({"ok": True, "rows": n})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8124, debug=False)
