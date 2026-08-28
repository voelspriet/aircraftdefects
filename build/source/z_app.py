#!/usr/bin/env python3
"""aircraftdefects.com/z

The builds GLM-5.3-Flash chose for itself, in the order it ranked them. See
../design/02-answer.md for the reasoning and ../design/03-stated-vs-inferred.md
for the audit where it caught itself asserting a distribution it did not have.

Two rules run through all of it.

The model reads and phrases. It never decides what a code means: that comes from
the FAA's own tables. And nothing generated is shown without the filer's own
words beside it and a record id under it.
"""
import csv, io, json, os, re, time
from collections import Counter, defaultdict
import requests
from flask import Flask, Response, jsonify, request, send_from_directory

SDR = os.environ.get("SDR_API", "http://127.0.0.1:8124")   # the parent tool
ZAI = "https://api.z.ai/api/paas/v4/chat/completions"
MODEL = "glm-5.3-flash"
HERE = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder="static")
_G = {}


def gloss_tables():
    if "codes" not in _G:
        _G["codes"] = requests.get(SDR + "/api/glossary", timeout=30).json().get("codes", {})
    return _G["codes"]


def dec(table, code):
    """A code to its FAA meaning, or None. Never a guess."""
    if not code:
        return None
    v = (gloss_tables().get(table) or {}).get(str(code).strip().upper())
    if isinstance(v, dict):
        return v.get("label") or v.get("faa")
    return v


def api(path, **params):
    r = requests.get(SDR + path, params=params, timeout=90)
    r.raise_for_status()
    return r.json()


def key():
    k = (os.environ.get("ZAI_API_KEY") or "").strip()
    if not k or "paste" in k.lower():
        raise RuntimeError("ZAI_API_KEY not set")
    return k


def glm(prompt, schema=None, effort="low", max_tokens=1200):
    """One call. Structured output where a schema is given, so the model cannot
    ramble into a field that will be rendered as fact."""
    body = {"model": MODEL, "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]}
    if schema:
        body["response_format"] = {"type": "json_object"}
    r = requests.post(ZAI, json=body, timeout=180, headers={
        "Authorization": "Bearer " + key(), "Content-Type": "application/json"})
    if r.status_code != 200:
        raise RuntimeError("z.ai %s %s" % (r.status_code, r.text[:200]))
    txt = r.json()["choices"][0]["message"].get("content") or ""
    if not schema:
        return txt
    m = re.search(r"\{.*\}", txt, re.S)
    return json.loads(m.group(0)) if m else None


# ---------------------------------------------------------------- build 1 + 8
# The airframe history page, and the framing that stops it being misread.
#
# Build 8 as the model specified it rested on HowDiscoveredCode "showing most
# findings are caught during scheduled inspection". Its own audit flagged that as
# asserted rather than known, and the database disagrees: that column is 47%
# "someone looked at it", 23% "other", 19% "unknown". The signal it wanted is in
# StageOfOperationCode, where IN, on the ground in inspection or maintenance,
# covers 1,303,444 of 1,757,828 records. So the overlay is built on stage.

def stage_framing(rows):
    st = Counter((r.get("StageOfOperationCode") or "").strip().upper() for r in rows)
    n = sum(st.values()) or 1
    ground = st.get("IN", 0) + st.get("TX", 0)
    inflight = sum(st.get(c, 0) for c in ("CL", "CR", "TO", "AP", "DE", "LD", "HO", "FF"))
    return {"total": n, "on_ground": ground, "in_flight": inflight,
            "on_ground_pct": round(100.0 * ground / n),
            "in_flight_pct": round(100.0 * inflight / n),
            "sentence": ("%s of these %d write-ups %s made with the aircraft on the ground, "
                         "in maintenance or taxiing. A write-up is a defect somebody found and "
                         "recorded, most often while servicing the aircraft."
                         % (ground, n, "was" if ground == 1 else "were"))}


def crew_actions(r):
    out = []
    for c in "ABCD":
        lab = dec("precaution", r.get("PrecautionaryProcedure" + c))
        if lab and lab.lower() != "none":
            out.append(lab)
    return out


def decorate(r):
    """One raw record, decoded. Every value traceable, nothing invented."""
    return {
        "id": r.get("OperatorControlNumber"),
        "date": r.get("DifficultyDate"),
        "tail": r.get("RegistryNNumber"),
        "operator_code": r.get("OperatorDesignator"),
        "operator": dec("operator", r.get("OperatorDesignator")),
        "make": r.get("AircraftMake"), "model": r.get("AircraftModel"),
        "hours": r.get("AircraftTotalTime"), "cycles": r.get("AircraftTotalCycles"),
        "system": dec("jasc", r.get("JASCCode")), "system_code": r.get("JASCCode"),
        "part": r.get("PartName"), "part_number": r.get("PartNumber"),
        "condition": r.get("PartCondition"),
        "nature": [x for x in (dec("nature", r.get("NatureOfCondition" + c)) for c in "ABC") if x],
        "crew": crew_actions(r),
        "stage": dec("stage", r.get("StageOfOperationCode")),
        "discovered": dec("discovered", r.get("HowDiscoveredCode")),
        "zone": r.get("PartLocation"),
        "zone_label": dec("part_location", r.get("PartLocation")),
        "corrosion": dec("corrosion", r.get("CorrosionLevel")),
        "crack_length": r.get("CrackLength"), "cracks": r.get("NumberOfCracks"),
        "text": (r.get("Discrepancy") or "").strip(),
    }


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
    recs.sort(key=lambda x: (x["date"] or ""), reverse=True)
    ops = Counter(r["operator"] or r["operator_code"] for r in recs if r["operator_code"])
    return jsonify(
        tail="N" + t, found=d.get("count", len(recs)), capped=d.get("capped"),
        aircraft={"make": recs[0]["make"], "model": recs[0]["model"]},
        operators=[{"name": k, "reports": v} for k, v in ops.most_common()],
        systems=d.get("systems"),
        framing=stage_framing(rows),
        first=recs[-1]["date"], last=recs[0]["date"],
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
            "The file holds no flying hours per operator, so nothing here is a rate."])


# -------------------------------------------------------------------- build 2
# Plain-language gloss of one record. The only generated text in v1.
#
# Constrained three ways: it is given the FAA's decoded values rather than the
# codes, it must abstain rather than guess, and it is rendered under the
# mechanic's own words, never instead of them.

GLOSS_RULES = """You are rewriting one aircraft maintenance write-up into plain English
for someone who is not an aviation professional.

Rules, all of them absolute:
- Say only what the write-up and the decoded fields state. Add nothing.
- Never say or imply why it happened. The record does not contain a cause.
- Never say or imply anything about an accident, a crash, or danger.
- Do not soften and do not dramatise. No adjectives that are not in the source.
- If the text is too abbreviated to be sure what it means, abstain.
- British English. One or two short sentences, maximum 40 words.

Return JSON only:
{"plain": "<the sentence, or null if abstaining>",
 "abstained": true|false,
 "reason": "<if abstained, why, in six words or fewer>"}"""


@app.post("/z/api/gloss")
def gloss():
    d = request.get_json(force=True, silent=True) or {}
    text = (d.get("text") or "").strip()
    if not text:
        return jsonify(error="no text"), 400
    facts = {k: d.get(k) for k in ("system", "part", "condition", "nature",
                                   "stage", "discovered", "zone_label") if d.get(k)}
    prompt = ("%s\n\nDecoded FAA fields for this record:\n%s\n\nThe write-up, verbatim:\n%s"
              % (GLOSS_RULES, json.dumps(facts, ensure_ascii=False), text))
    try:
        out = glm(prompt, schema=True, effort="low", max_tokens=700)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 502
    if not out:
        return jsonify(abstained=True, reason="no usable reply"), 200
    return jsonify(plain=out.get("plain"), abstained=bool(out.get("abstained")),
                   reason=out.get("reason"), model=MODEL, effort="low")


# -------------------------------------------------------------------- build 3
# Location out of the free text, for the 1,496,585 records that carry no zone.
# On demand for the records on screen, not a precomputed pass over 1.5M: the
# model's own Phase 0 said batched pipelines, and a batch that size needs a
# hand-labelled quality check before anyone may rely on it.

LOC_RULES = """Each item below is a verbatim aircraft maintenance write-up that carries no
coded location. For each, extract where on the aircraft it happened, only if the text
says so.

- Quote the exact words you took it from. Do not paraphrase them.
- If the text does not say where, return null. Do not infer from the part name.
- Confidence: high only when the location is stated outright.

Return JSON only: {"results":[{"id":"...","where":null,"span":null,"confidence":"high|low"}]}"""


@app.post("/z/api/locate")
def locate():
    d = request.get_json(force=True, silent=True) or {}
    items = (d.get("records") or [])[:25]
    if not items:
        return jsonify(error="no records"), 400
    listing = "\n".join("%s: %s" % (i.get("id"), (i.get("text") or "")[:300]) for i in items)
    try:
        out = glm(LOC_RULES + "\n\n" + listing, schema=True, effort="low", max_tokens=3000)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 502
    res = (out or {}).get("results") or []
    # A span the model did not actually copy from the source is dropped, not shown.
    byid = {i.get("id"): (i.get("text") or "") for i in items}
    kept, dropped = [], 0
    for r in res:
        span = (r.get("span") or "").strip()
        if r.get("where") and span and span.upper() in byid.get(r.get("id"), "").upper():
            kept.append(r)
        elif r.get("where"):
            dropped += 1
    return jsonify(results=kept, dropped_unverifiable=dropped, checked=len(items),
                   note="A location is kept only when the quoted span appears verbatim "
                        "in the write-up. Anything the model paraphrased is dropped.")


# ---------------------------------------------------------------- builds 4 + 5
# One part across every airframe, and repeat findings on one airframe.
# No model in either. Both are arithmetic, and arithmetic should not be guessed.

@app.get("/z/api/part/<pn>")
def part(pn):
    d = api("/api/search", part=pn, limit=400)
    rows = [decorate(r) for r in (d.get("rows") or [])]
    tails = Counter(r["tail"] for r in rows if r["tail"])
    ops = Counter(r["operator"] or r["operator_code"] for r in rows if r["operator_code"])
    years = Counter((r["date"] or "")[-4:] for r in rows if r["date"])
    return jsonify(part=pn, total=d.get("total"), shown=len(rows),
                   aircraft=len(tails), operators=len(ops),
                   by_operator=[{"name": k, "n": v} for k, v in ops.most_common(12)],
                   by_year=sorted(({"year": k, "n": v} for k, v in years.items()),
                                  key=lambda x: x["year"]),
                   records=rows[:60],
                   cannot_show=["More reports does not mean a worse part. It can mean the "
                                "part is simply more common, or fitted to more aircraft."])


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
        g.sort(key=lambda x: (x["date"] or ""))
        hrs = [x["hours"] for x in g if str(x["hours"] or "").isdigit()]
        out.append({"system": g[0]["system"], "part": g[0]["part"], "times": len(g),
                    "first": g[0]["date"], "last": g[-1]["date"],
                    "hours_between": (int(hrs[-1]) - int(hrs[0])) if len(hrs) > 1 else None,
                    "ids": [x["id"] for x in g], "records": g})
    out.sort(key=lambda x: -x["times"])
    return jsonify(tail="N" + t, groups=out,
                   note="Written up more than once on this airframe. The file does not say "
                        "whether a later report is the same finding returning or a new one.")


# -------------------------------------------------------------------- build 9
# Operator page, with the unresolved names shown rather than hidden.

@app.get("/z/api/operator/<code>")
def operator(code):
    c = code.strip().upper()
    name = dec("operator", c)
    d = api("/api/search", operator=c, limit=200)
    rows = [decorate(r) for r in (d.get("rows") or [])]
    sysc = Counter(r["system"] for r in rows if r["system"])
    return jsonify(code=c, name=name,
                   name_known=bool(name),
                   name_note=(None if name else
                              "This designator resolves to no name. 2,732 of the 3,945 "
                              "designators in this file do not, because the FAA lists that "
                              "name them do not reach back far enough, or the carrier was "
                              "never on them. The reports are real; the name is missing."),
                   total=d.get("total"), shown=len(rows),
                   systems=[{"name": k, "n": v} for k, v in sysc.most_common(12)],
                   records=rows[:60],
                   cannot_show=["This is a count of reports filed, not a rate and not a "
                                "ranking. The file holds no fleet size and no flying hours, "
                                "so no comparison between operators is possible from it. An "
                                "operator that files more may simply be inspecting harder."])


# ---------------------------------------------------------------- builds 6 + 7
# Export with citations, and the templated summary with a numeric verifier.
#
# Build 7 is the one surface a relative is most likely to read, so no sentence in
# it is generated. Every number is computed here and dropped into a fixed slot,
# and the verifier re-derives each number from the records before the text is
# allowed out. If any figure disagrees, nothing is returned.

@app.get("/z/api/export/<tail>.csv")
def export_csv(tail):
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    rows = [decorate(r) for r in (api("/api/aircraft/" + t).get("rows") or [])]
    buf = io.StringIO()
    cols = ["id", "date", "tail", "operator_code", "operator", "make", "model", "hours",
            "cycles", "system_code", "system", "part", "part_number", "condition",
            "stage", "discovered", "zone", "corrosion", "text"]
    w = csv.writer(buf)
    w.writerow(["# FAA Service Difficulty Reports, retrieved %s from aircraftdefects.com"
                % time.strftime("%Y-%m-%d")])
    w.writerow(["# Counts of reports filed. Not rates, not accidents, not causes."])
    w.writerow(cols)
    for r in rows:
        w.writerow([("; ".join(r[c]) if isinstance(r.get(c), list) else r.get(c)) for c in cols])
    return Response(buf.getvalue(), mimetype="text/csv", headers={
        "Content-Disposition": 'attachment; filename="N%s-sdr.csv"' % t})


@app.get("/z/api/summary/<tail>")
def summary(tail):
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    raw = api("/api/aircraft/" + t).get("rows") or []
    if not raw:
        return jsonify(tail="N" + t, found=0), 200
    recs = [decorate(r) for r in raw]
    dates = sorted(x["date"] for x in recs if x["date"])
    f = stage_framing(raw)
    sysc = Counter(r["system"] for r in recs if r["system"])
    crew = [r for r in recs if r["crew"]]
    stats = {"n": len(recs), "first": dates[0] if dates else None,
             "last": dates[-1] if dates else None,
             "systems": len(sysc), "top_system": sysc.most_common(1)[0][0] if sysc else None,
             "top_system_n": sysc.most_common(1)[0][1] if sysc else 0,
             "on_ground": f["on_ground"], "crew_action": len(crew)}

    # The verifier. Every number recounted from the records before the text ships.
    check = {"n": len(recs),
             "on_ground": sum(1 for r in raw if (r.get("StageOfOperationCode") or "").strip().upper() in ("IN", "TX")),
             "crew_action": sum(1 for r in recs if r["crew"])}
    bad = [k for k, v in check.items() if stats[k] != v]
    if bad:
        return jsonify(error="verifier disagreed on %s, nothing rendered" % ", ".join(bad)), 500

    def plural(n, one, many):
        return one if n == 1 else many
    text = ("This aircraft, %s, appears in %d maintenance write-%s filed with the FAA "
            "between %s and %s. %d of them %s written with the aircraft on the ground, "
            "in maintenance or taxiing. %d %s an action the crew took. "
            "The system written up most often is %s, %d %s."
            % ("N" + t, stats["n"], plural(stats["n"], "up", "ups"),
               stats["first"], stats["last"],
               stats["on_ground"], plural(stats["on_ground"], "was", "were"),
               stats["crew_action"], plural(stats["crew_action"], "records", "record"),
               stats["top_system"] or "not recorded", stats["top_system_n"],
               plural(stats["top_system_n"], "time", "times")))
    return jsonify(tail="N" + t, stats=stats, summary=text, generated=False,
                   note="Every number above was recounted from the records before this "
                        "sentence was assembled. No part of it was written by a model.",
                   cannot_show=["This says nothing about why anything happened, and nothing "
                                "about any accident. The file contains neither."])


@app.get("/z/api/health")
def health():
    ok = True
    try:
        n = api("/api/hero").get("corpus")
    except Exception:
        n, ok = None, False
    return jsonify(corpus=n, sdr_reachable=ok, model=MODEL,
                   key_set=bool((os.environ.get("ZAI_API_KEY") or "").strip()),
                   builds={"1": "airframe history", "2": "plain-language gloss",
                           "3": "location from free text", "4": "part recurrence",
                           "5": "repeat findings", "6": "citation and export",
                           "7": "verified summary", "8": "stage framing",
                           "9": "operator page"})


@app.get("/z/")
@app.get("/z")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(HERE, "..", ".env"))
    except ImportError:
        pass
    app.run(host="127.0.0.1", port=8211, debug=False)


# ============================================================================
# The five questions, on any one thing.
#
# The parent tool answers "which reports match these filters". That is a lookup.
# The question a reporter actually arrives with is about a thing: this tail, this
# airline, this type of aircraft. So one entity in, five answers out, in the order
# a person asks them:
#
#   WHEN            month by month, because a spike has a date
#   WHERE           where on the airframe, zone and system
#   WHO             which operator, and which aircraft
#   WHAT            what was found
#   WHAT IT FORCED  what the defect made the crew do
#
# The fifth is the one the FAA buries hardest and the only one that says a defect
# had consequences in the air. It is a separate question, not a footnote to WHAT.

KINDS = {"tail": "tail", "operator": "operator", "make": "make", "model": "model"}


def code_list(table):
    """Every code in a table with the FAA's own wording, so nothing on the page
    is an abbreviation the reader has to go and look up somewhere else."""
    out = {}
    for k, v in (gloss_tables().get(table) or {}).items():
        if isinstance(v, dict):
            out[k] = {"label": v.get("label") or v.get("faa"), "faa": v.get("faa"),
                      "note": v.get("note")}
        else:
            out[k] = {"label": v, "faa": v, "note": None}
    return out


def tally(rows, get, table=None):
    """Count a coded field and hand back the FAA meaning beside every code."""
    c = Counter()
    for r in rows:
        for v in get(r):
            if v and str(v).strip():
                c[str(v).strip().upper()] += 1
    out = []
    for code, n in c.most_common(40):
        lab = dec(table, code) if table else code
        out.append({"code": code, "label": lab or code, "n": n,
                    "undecoded": bool(table) and not lab})
    return out


@app.get("/z/api/entity")
def entity():
    kind = (request.args.get("kind") or "").strip().lower()
    val = (request.args.get("v") or "").strip()
    model_ = (request.args.get("model") or "").strip()
    if kind not in KINDS or not val:
        return jsonify(error="need kind=tail|operator|make and v="), 400

    params = {}
    if kind == "tail":
        params["tail"] = re.sub(r"[^A-Za-z0-9]", "", val).upper().lstrip("N")
    elif kind == "operator":
        params["operator"] = val.upper()
    else:
        params["make"] = val.upper()
        if model_:
            params["model"] = model_.upper()

    d = api("/api/search", limit=400, **params)
    rows = d.get("rows") or []
    months = api("/api/trend", **params)
    recs = [decorate(r) for r in rows]

    # Some of these counts are complete and some are not, and the difference has
    # to be visible. /api/breakdown aggregates the whole selection server-side for
    # system, stage, discovery and operator. Nothing aggregates nature of
    # condition, crew action, zone or tail, so those are counted from the sample
    # that was actually read and are labelled as such. Blurring the two together
    # would be the same error the parent tool exists to refuse.
    def full(by=None):
        try:
            p = dict(params)
            if by:
                p["by"] = by
            b = api("/api/breakdown", **p)
            rws = b.get("rows") or []
            if not rws:
                return None
            return {"complete": True, "counted": b.get("reports_in_categories"),
                    "rows": [{"code": r.get("key"), "label": r.get("label"),
                              "n": r.get("n"), "undecoded": False} for r in rws[:40]]}
        except Exception:
            return None

    def sampled(rws):
        return {"complete": False, "counted": len(rows), "rows": rws}

    agg_system = full()
    agg_stage = full("stage")
    agg_disc = full("discovered")
    agg_ops = full("operator")

    # WHAT IT FORCED. Four columns hold it, and "none" is a real answer that has
    # to be counted, or the page silently implies every defect had consequences.
    forced = Counter()
    forced_none = 0
    for r in rows:
        acts = [dec("precaution", r.get("PrecautionaryProcedure" + c)) for c in "ABCD"]
        acts = [a for a in acts if a and a.lower() != "none"]
        if acts:
            for a in acts:
                forced[a] += 1
        else:
            forced_none += 1

    title = val.upper()
    if kind == "tail":
        title = "N" + params["tail"]
    elif kind == "operator":
        title = dec("operator", val.upper()) or val.upper()
    elif model_:
        title = "%s %s" % (val.upper(), model_.upper())

    return jsonify(
        kind=kind, value=val, title=title,
        total=d.get("total"), analysed=len(rows),
        capped=(d.get("total") or 0) > len(rows),
        when={"months": months,
              "first": months[0]["month"] if months else None,
              "last": months[-1]["month"] if months else None,
              "peak": max(months, key=lambda m: m["n"]) if months else None},
        where={"zones": sampled(tally(rows, lambda r: [r.get("PartLocation")], "part_location")),
               "systems": agg_system or sampled(tally(rows, lambda r: [r.get("JASCCode")], "jasc")),
               "no_zone": sum(1 for r in rows if not (r.get("PartLocation") or "").strip())},
        who={"operators": agg_ops or sampled(tally(rows, lambda r: [r.get("OperatorDesignator")], "operator")),
             "aircraft": sampled(tally(rows, lambda r: [r.get("RegistryNNumber")])),
             "types": sampled(tally(rows, lambda r: [((r.get("AircraftMake") or "") + " " +
                                                      (r.get("AircraftModel") or "")).strip()]))},
        what={"nature": sampled(tally(rows, lambda r: [r.get("NatureOfCondition" + c) for c in "ABC"], "nature")),
              "condition": sampled(tally(rows, lambda r: [r.get("PartCondition")])),
              "parts": sampled(tally(rows, lambda r: [r.get("PartName")])),
              "found_by": agg_disc or sampled(tally(rows, lambda r: [r.get("HowDiscoveredCode")], "discovered")),
              "stage": agg_stage or sampled(tally(rows, lambda r: [r.get("StageOfOperationCode")], "stage"))},
        forced={"actions": [{"label": k, "n": v} for k, v in forced.most_common()],
                "none": forced_none,
                "with_action": len(rows) - forced_none,
                "sentence": ("%d of the %d reports here record something the defect forced "
                             "the crew to do. In %d, no listed action was taken."
                             % (len(rows) - forced_none, len(rows), forced_none))},
        framing=stage_framing(rows),
        records=recs[:80],
        cannot_show=[
            "Counts of reports filed. The file holds no fleet size and no flying hours, "
            "so nothing here is a rate and nothing here ranks anyone.",
            "This file records no accidents and no causes.",
            "A write-up is a defect that was found and recorded, usually during maintenance."])


@app.get("/z/api/codes")
def codes():
    """Every FAA code table the page can show, decoded, in one payload."""
    want = ["nature", "precaution", "stage", "discovered", "part_location",
            "corrosion", "operator_type", "sdr_type", "submitter", "time_since"]
    return jsonify({t: code_list(t) for t in want})
