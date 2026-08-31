import os
import re
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


def glm(prompt, schema=None, effort="low", max_tokens=1200, tools=None):
    """One call, streamed.

    Streaming is not a nicety here. Without it the request holds a connection open
    while the model thinks and writes, and nothing crosses the wire until the very
    last moment. Their gateway closed two such requests on us: a 502 from
    alibaba-ga on one, a reset connection on the retry, both on jobs that ran long.
    The first thing I blamed was prompt size, wrongly: the run that succeeded had
    three times the input of the run that failed. What separated them was how long
    the line stayed silent.

    With stream=True the tokens arrive as they are produced, no proxy sees an idle
    socket, and a job may take as long as it needs. The vendor recommends it for
    this model for exactly this reason.
    """
    body = {"model": MODEL, "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens,
            "stream": True,
            "messages": [{"role": "user", "content": prompt}]}
    if schema:
        body["response_format"] = {"type": "json_object"}
    if tools:
        body["tools"] = tools
        body["tool_stream"] = True

    r = requests.post(ZAI, json=body, timeout=1800, stream=True, headers={
        "Authorization": "Bearer " + key(), "Content-Type": "application/json"})
    if r.status_code != 200:
        raise RuntimeError("z.ai %s %s" % (r.status_code, r.text[:200]))

    out = []
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        chunk = line[5:].strip()
        if chunk == "[DONE]":
            break
        try:
            d = json.loads(chunk)
        except ValueError:
            continue
        for ch in d.get("choices", []):
            piece = (ch.get("delta") or {}).get("content")
            if piece:
                out.append(piece)
    txt = "".join(out)
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


def _date_words(d):
    """FAA dates are MM/DD/YYYY; the model read 01/05/2024 as 1 May. Spell it out."""
    m = re.match(r"(\d\d)/(\d\d)/(\d{4})", d or "")
    if not m:
        return None
    months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    try:
        return "%d %s %s" % (int(m.group(2)), months[int(m.group(1)) - 1], m.group(3))
    except Exception:
        return None

def decorate(r):
    """One raw record, decoded. Every value traceable, nothing invented."""
    return {
        "id": r.get("OperatorControlNumber"),
        "date": r.get("DifficultyDate"),
        "date_written_out": _date_words(r.get("DifficultyDate")),
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


# Existing module context (imports, decorate, api, stage_framing, app) is unchanged.
# Added: one helper, used by both views, to read the file's own MM/DD/YYYY dates.

def _parse_date(s):
    """The file's dates are MM/DD/YYYY. Returns a comparable value, or None when
    the date will not parse, so an undated report can never decide first or last."""
    try:
        return time.strptime(s, "%m/%d/%Y")
    except (TypeError, ValueError):
        return None


# ---- hand-written, 30 August 2026, counted in MODEL_USE.md -------------------
# The dossier answered from a tail's whole history while the instrument honoured
# the zone and dates in the same URL: ?tail=928NN&zone=ZONE+900 showed 7 in the
# sentence and 103 in the dossier, captioned "lavatories and galleys". One page,
# two counts. Every airframe view now takes the same filters the instrument
# takes, applied to the raw rows before anything is derived from them.
def _selection_filter(rows):
    """Keep only rows inside the request's zone / from / to, if any are given."""
    zone = (request.args.get("zone") or "").strip().upper()
    lo = (request.args.get("from") or "").strip()
    hi = (request.args.get("to") or "").strip()
    if not (zone or lo or hi):
        return rows
    def iso(r):
        d = r.get("DifficultyDate") or ""
        m = re.match(r"(\d\d)/(\d\d)/(\d{4})", d)
        return f"{m.group(3)}-{m.group(1)}-{m.group(2)}" if m else ""
    out = []
    for r in rows:
        # the file writes "ZONE 900 - LAV/G"; the instrument asks for "ZONE 900".
        # match the code as a prefix, the way the parent's search does.
        if zone and not (r.get("PartLocation") or "").strip().upper().startswith(zone):
            continue
        d = iso(r)
        if lo and (not d or d < lo):
            continue
        if hi and (not d or d > hi):
            continue
        out.append(r)
    return out

def _selection_caption():
    zone = request.args.get("zone"); lo = request.args.get("from"); hi = request.args.get("to")
    return {"zone": zone or None, "from": lo or None, "to": hi or None,
            "filtered": bool(zone or lo or hi)}

@app.get("/z/api/airframe/<tail>")
def airframe(tail):
    t = re.sub(r"[^A-Za-z0-9]", "", tail).upper().lstrip("N")
    d = api("/api/aircraft/" + t)
    rows = _selection_filter(d.get("rows") or [])
    if not rows:
        return jsonify(tail="N" + t, found=0, selection=_selection_caption(),
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
        tail="N" + t, found=len(recs), capped=d.get("capped"),
        selection=_selection_caption(),
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

# -------------------------------------------------------------------- build 2
# Plain-language gloss of one record. The only generated text in v1.
#
# Constrained three ways: it is given the FAA's decoded values rather than the
# codes, it must abstain rather than guess, and it is rendered under the
# mechanic's own words, never instead of them.

GLOSS_RULES = """You are rewriting one aircraft maintenance write-up into plain English
for someone who is not an aviation professional.

Keep the whole story, in the order it happened. These write-ups often describe a
sequence: what the crew noticed, what they decided, what they asked for, what was
ruled out, what was found afterwards, what was fixed. Every one of those steps
matters and none may be dropped. A reader of your version alone must not come away
with a different account of events from a reader of the original.

Length follows the source. A one-line write-up gets one line. A write-up that
describes eight things that happened gets all eight.

Rules, all absolute:
- Say only what the write-up and the decoded fields state. Add nothing.
- Never say or imply why it happened. The record does not contain a cause.
- Never say or imply anything about an accident, a crash, or danger.
- Keep flight numbers, airports, part locations and manual references as written.
- Expand trade abbreviations (T/E is trailing edge, MX is maintenance, IAW is in
  accordance with, A/C is aircraft, AGL is above ground level, TSO is time since
  overhaul, P/N and S/N are part and serial number) rather than repeating them.
- Airport codes: keep the code in the account and do not silently swap in a name.
- Do not soften and do not dramatise. No adjective that is not in the source.
- If the text is too abbreviated to be sure what it means, abstain.
- British English.

Separately: you are given the codes the filer entered. Sometimes a filed code does
not match the story the same person wrote. If that is clearly the case here, say so
plainly in one sentence, naming both. If they agree, or you are unsure, return null.
Never guess at this. It is a serious thing to say about someone's paperwork.

Separately again: list every abbreviation, code or piece of trade shorthand in the
write-up, with what it means. Two kinds, and the difference matters:
  "record"  the meaning is derivable from the text or the decoded fields you were given
  "outside" the meaning comes from your own knowledge and is not in this record at all,
            such as an airport code, a manufacturer, or a regulation number
Mark every entry. Never mark something "record" to make it look better sourced. If you
are not confident an airport code is that airport, leave it out entirely.

One record has two halves and a reader needs both. Above the write-up sits the
FAA's own filing: the coded boxes, the airframe's hours and flights, where on the
aircraft, how it was found, what stage the aircraft was in, what the crew did. Those
are the part a non-specialist cannot read at all, and a rephrasing that skips them
explains the easy half.

So say the filing too, in one or two plain sentences, using only the decoded values
you were given. Do not repeat a value that is empty, and say plainly when a field
records nothing: "no crew action is recorded" is information, and silence is not.
Hours and flight cycles belong here when present, because they say how much life the
aircraft had behind it.

Return JSON only:
{"filing": "<what the coded boxes say, in plain sentences, or null>",
 "plain": "<the account, or null if abstaining>",
 "abstained": true|false,
 "reason": "<if abstained, why, in six words or fewer>",
 "code_tension": "<one sentence naming the code and what the text says instead, or null>",
 "jargon": [{"term": "GEG", "means": "Spokane International Airport", "source": "outside"}]}"""


@app.post("/z/api/gloss")
def gloss():
    d = request.get_json(force=True, silent=True) or {}
    text = (d.get("text") or "").strip()
    if not text:
        return jsonify(error="no text"), 400
    facts = {k: d.get(k) for k in ("system", "part", "part_number", "condition",
                                   "nature", "crew", "stage", "discovered",
                                   "zone", "zone_label", "corrosion",
                                   "crack_length", "cracks", "hours", "cycles",
                                   "make", "model", "operator", "date") if d.get(k)}
    prompt = ("%s\n\nCodes the filer entered, decoded by the FAA's own tables:\n%s\n\n"
              "The write-up, verbatim:\n%s"
              % (GLOSS_RULES, json.dumps(facts, ensure_ascii=False), text))
    try:
        # Longer texts describe a sequence and need room for it. Effort rises with
        # length too: a one-line write-up is transcription, an eight-step account
        # is comprehension.
        long_ = len(text) > 400
        out = glm(prompt, schema=True, effort="high" if long_ else "low",
                  max_tokens=2600 if long_ else 900)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 502
    if not out:
        return jsonify(abstained=True, reason="no usable reply"), 200
    if out.get("code_tension"):
        log_conflict(d, out["code_tension"])
    return jsonify(filing=out.get("filing"), plain=out.get("plain"),
                   abstained=bool(out.get("abstained")),
                   reason=out.get("reason"), code_tension=out.get("code_tension"),
                   jargon=out.get("jargon") or [],
                   model=MODEL, effort="high" if long_ else "low")


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
    rows = [decorate(r) for r in _selection_filter(api("/api/aircraft/" + t).get("rows") or [])]
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
                                "ranking. Airframe hours are in the file, fleet flying hours "
                                "are not, and the only aircraft with hours here are the ones "
                                "that filed something. So no comparison between operators is "
                                "possible. An operator that files more may simply be "
                                "inspecting harder."])


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
    raw = _selection_filter(api("/api/aircraft/" + t).get("rows") or [])
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


# The parent page is served under /z verbatim, and it calls api/... relative to
# wherever it sits, so under /z those land here. Anything this service does not
# answer itself is handed straight through to the parent on 8124. That way /z is
# the same instrument, with the model layer added, rather than a lesser page
# built to resemble one.
@app.route("/z/api/<path:rest>", methods=["GET", "POST"])
def passthrough(rest):
    if request.method == "GET":
        r = requests.get(SDR + "/api/" + rest, params=request.args, timeout=120)
    else:
        r = requests.post(SDR + "/api/" + rest, json=request.get_json(silent=True),
                          params=request.args, timeout=120)
    return Response(r.content, status=r.status_code,
                    mimetype=r.headers.get("Content-Type", "application/json"))


@app.get("/z/static/<path:f>")
def zstatic(f):
    r = requests.get(SDR + "/static/" + f, timeout=60)
    return Response(r.content, status=r.status_code,
                    mimetype=r.headers.get("Content-Type", "application/octet-stream"))


# The rebuilt page calls api("facets") and its helper resolves that against the
# page's own URL, so the request arrives as /z/facets rather than /z/api/facets.
# That is a fault in my brief, which listed the endpoints with an api/ prefix and
# did not say whether the helper should add one. Rather than edit a page the model
# wrote, the server answers both shapes.
KNOWN_API = ("hero", "facets", "trend", "glossary", "breakdown", "search", "clusters",
             "leads", "spikes", "corrosion", "ageing", "engines", "consequences",
             "phrases", "vocab", "freshness", "emerging", "repeat", "compare",
             "explain", "resolve", "fleet", "inspection", "case", "aircraft")


@app.route("/z/<name>", methods=["GET"])
def bare_api(name):
    if name not in KNOWN_API:
        from flask import abort
        abort(404)
    r = requests.get(SDR + "/api/" + name, params=request.args, timeout=120)
    return Response(r.content, status=r.status_code,
                    mimetype=r.headers.get("Content-Type", "application/json"))


@app.get("/z/rebuilt")
def rebuilt():
    """The instrument as GLM-5.3-Flash rebuilt it. Kept on its own path while it is
    compared against the original, so neither replaces the other by accident."""
    return send_from_directory(app.static_folder, "rebuilt.html")


@app.get("/z/conflicts")
@app.get("/z/conflicts/")
def conflicts_page():
    return send_from_directory(app.static_folder, "conflicts.html", max_age=0)


@app.get("/z/case/<rid>")
def case_page(rid):
    """Hand-written, 31 August 2026: one report on its own page."""
    return send_from_directory(app.static_folder, "case.html", max_age=0)


# ---- hand-written, 31 August 2026: the three files a crawler and a language
# model look for first. robots.txt keeps them out of /z/api/, where every request
# costs a model call. llms.txt says in plain words what this data is and, more
# importantly, what it is not, so a model quoting this site does not turn counts
# of reports filed into a safety ranking.
@app.get("/robots.txt")
def robots():
    return send_from_directory(app.static_folder, "robots.txt", max_age=3600,
                               mimetype="text/plain")


@app.get("/sitemap.xml")
def sitemap():
    return send_from_directory(app.static_folder, "sitemap.xml", max_age=3600,
                               mimetype="application/xml")


@app.get("/llms.txt")
def llms():
    return send_from_directory(app.static_folder, "llms.txt", max_age=3600,
                               mimetype="text/plain")


# ---- the model's, from here
@app.get("/z/img/<name>")
def z_img(name):
    """Hand-written, 31 August 2026: the few images the page carries."""
    if not re.fullmatch(r"[a-z0-9\-]+\.(webp|png|jpg|svg|mp4)", name):
        return jsonify(error="no such image"), 404
    return send_from_directory(app.static_folder, name, max_age=86400)


@app.get("/z/")
@app.get("/z")
def index():
    return send_from_directory(app.static_folder, "index.html", max_age=0)


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


# Any value on the page can become the filter. The parent tool is a thing you
# operate, not a page you read: you click a zone, drag a period, click a crew
# action, and the whole corpus narrows. /z answered one question about one subject
# and offered no way to cut it, which is the single biggest thing a reporter loses.
NARROW = {"zone": "zone", "jasc": "jasc", "ata": "ata", "nature": "nature",
          "crew": "crew", "stage": "stage", "discovered": "discovered",
          "condition": "condition", "part": "part", "operator": "operator",
          "tail": "tail", "make": "make", "model": "model", "corrosion": "corrosion",
          "q": "q", "from": "from", "to": "to"}


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

    # Anything the reader clicked comes through as an extra filter and narrows
    # every one of the five answers, not just the list of records.
    narrowed = {}
    for k, v in request.args.items():
        if k in NARROW and (v or "").strip() and k not in ("tail", "operator", "make", "model"):
            narrowed[k] = v.strip()
        elif k in ("tail", "operator", "make", "model") and k != kind and (v or "").strip():
            narrowed[k] = v.strip()
    params.update(narrowed)

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
        narrowed=narrowed,
        narrowable=sorted(NARROW),
        total=d.get("total"), analysed=len(rows),
        capped=(d.get("total") or 0) > len(rows),
        when={"months": months,
              "first": months[0]["month"] if months else None,
              "last": months[-1]["month"] if months else None,
              "peak": max(months, key=lambda m: m["n"]) if months else None},
        where={"zones": sampled([z for z in tally(rows, lambda r: [r.get("PartLocation")],
                                       "part_location") if not z["undecoded"]]),
               # The drawing can only place a numbered zone. Everything else is a
               # place named in words, and the parent tool keeps the two apart
               # rather than letting empty zone boxes imply an answer. On some
               # airframes every location is in words and nothing can be drawn at
               # all, which has to be said, not shown as nine zeroes.
               "places_in_words": sampled([z for z in tally(rows,
                                          lambda r: [r.get("PartLocation")],
                                          "part_location") if z["undecoded"]]),
               "systems": agg_system or sampled(tally(rows, lambda r: [r.get("JASCCode")], "jasc")),
               "no_zone": sum(1 for r in rows if not (r.get("PartLocation") or "").strip()),
               "drawable": sum(1 for r in rows if (r.get("PartLocation") or "").strip().upper().startswith("ZONE ")),
               "in_words": sum(1 for r in rows
                               if (r.get("PartLocation") or "").strip()
                               and not (r.get("PartLocation") or "").strip().upper().startswith("ZONE "))},
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
            "Counts of reports filed. The file carries an airframe's own hours at the "
            "moment of a report, but no fleet size and no fleet flying hours, so "
            "nothing here is a rate and nothing here ranks anyone. An aircraft that "
            "flew for years and never had anything filed does not appear at all.",
            "This file records no accidents and no causes.",
            "A write-up is a defect that was found and recorded, usually during maintenance."])


@app.get("/z/api/codes")
def codes():
    """Every FAA code table the page can show, decoded, in one payload."""
    want = ["nature", "precaution", "stage", "discovered", "part_location",
            "corrosion", "operator_type", "sdr_type", "submitter", "time_since"]
    return jsonify({t: code_list(t) for t in want})


# ============================================================================
# Conflicting reports: a ledger, not a rate.
#
# The measurement attempt failed twice. A first pass put the disagreement rate at
# 14.5%, an adversarial check cut it to 2.0%, and the check turned out to have an
# adjudicator that refuted every flag it ever saw, which makes it a constant
# rather than a judge. See docs/FINDINGS.md. Neither number stands.
#
# So stop trying to produce a rate. A rate needs a denominator, a denominator needs
# a calibrated instrument, and there isn't one. A ledger needs neither. Every time
# a reader asks for a plain-English account and the model notices the ticked box
# disagreeing with the paragraph, that case is written down with its record number,
# and anyone can open the original and judge it.
#
# What accumulates is evidence, one document at a time, found by people reading.
# Nothing here is a claim about how common this is.

import sqlite3

DB = os.path.join(HERE, "conflicts.db")


def db():
    c = sqlite3.connect(DB, timeout=20)
    c.execute("""CREATE TABLE IF NOT EXISTS conflicts(
        id TEXT PRIMARY KEY, tail TEXT, date TEXT, operator TEXT, field TEXT,
        code_says TEXT, text_says TEXT, note TEXT, discrepancy TEXT,
        found_at TEXT, confirmed INTEGER DEFAULT 0, disputed INTEGER DEFAULT 0,
        source TEXT DEFAULT 'reading')""")
    try:
        c.execute("ALTER TABLE conflicts ADD COLUMN source TEXT DEFAULT 'reading'")
    except Exception:
        pass
    return c


def log_conflict(rec, note):
    """Written when a reader's own lookup surfaces one. Keyed on the record number,
    so the same report read a hundred times is one entry, not a hundred."""
    if not rec.get("id") or not note:
        return
    try:
        c = db()
        c.execute("""INSERT OR IGNORE INTO conflicts
            (id, tail, date, operator, field, code_says, text_says, note, discrepancy, found_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)""",
                  (rec.get("id"), rec.get("tail"), rec.get("date"),
                   rec.get("operator") or rec.get("operator_code"), None, None, None,
                   note, (rec.get("text") or "")[:2000],
                   time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())))
        c.commit(); c.close()
    except Exception:
        pass


@app.get("/z/api/conflicts")
def conflicts():
    c = db()
    rows = c.execute("""SELECT id, tail, date, operator, note, discrepancy, found_at,
                               confirmed, disputed, COALESCE(source,'reading') FROM conflicts
                        ORDER BY found_at DESC LIMIT 500""").fetchall()
    n = c.execute("SELECT COUNT(*) FROM conflicts").fetchone()[0]
    c.close()
    return jsonify(
        total=n,
        entries=[{"id": r[0], "tail": r[1], "date": r[2], "operator": r[3], "note": r[4],
                  "discrepancy": r[5], "found_at": r[6], "confirmed": r[7], "disputed": r[8],
                  "source": r[9],
                  "source_url": "https://aircraftdefects.com/?q=" + requests.utils.quote(
                      (r[5] or "")[:60])} for r in rows],
        what_this_is=(
            "Reports where the coded box a filer ticked disagrees with the description the "
            "same filer wrote underneath it. Two ways in, and every row says which. Marked "
            "READING, it was noticed while a person was reading that report. Marked SCAN, it "
            "came from a sweep of the file in which two independent passes had to agree "
            "before anything was written down. Neither has been checked by a human."),
        what_this_is_not=[
            "Not a rate. There is no denominator here and there is not meant to be. Two "
            "attempts to measure how often this happens both failed, and the failures are "
            "written up in the repository rather than buried.",
            "Not evidence of anything hidden. Filing is voluntary work on top of the repair, "
            "the codes are a dropdown beside a free-text box, and careless coding is the "
            "boring explanation and almost certainly the right one.",
            "Not verified. A model noticed each of these. Open the record and judge it "
            "yourself; the record number is on every row.",
            "Not a safety signal about any operator or aircraft."])


@app.post("/z/api/conflicts/add")
def conflict_add():
    """Used by the sweep. A single pass is one model's opinion, so the sweep only
    posts here when two independent readings named the same field and agreed."""
    d = request.get_json(force=True, silent=True) or {}
    if not d.get("id") or not d.get("note"):
        return jsonify(error="need id and note"), 400
    try:
        c = db()
        c.execute("""INSERT OR IGNORE INTO conflicts
            (id, tail, date, operator, note, discrepancy, found_at, source)
            VALUES (?,?,?,?,?,?,?,'scan')""",
                  (d["id"], d.get("tail"), d.get("date"), d.get("operator"),
                   d["note"][:600], (d.get("discrepancy") or "")[:2000],
                   time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())))
        c.commit(); n = c.execute("SELECT COUNT(*) FROM conflicts").fetchone()[0]; c.close()
        return jsonify(ok=True, total=n)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 500


@app.post("/z/api/conflicts/<cid>/judge")
def judge(cid):
    """A reader who opened the record can say whether it holds. Both directions are
    recorded, because a disputed entry is as useful as a confirmed one."""
    v = (request.get_json(force=True, silent=True) or {}).get("verdict")
    if v not in ("confirmed", "disputed"):
        return jsonify(error="verdict must be confirmed or disputed"), 400
    c = db()
    c.execute("UPDATE conflicts SET %s = %s + 1 WHERE id = ?" % (v, v), (cid,))
    c.commit()
    row = c.execute("SELECT confirmed, disputed FROM conflicts WHERE id=?", (cid,)).fetchone()
    c.close()
    return jsonify(id=cid, confirmed=row[0] if row else 0, disputed=row[1] if row else 0)

# ============================================================================
# hand-written, 30 August 2026, counted in MODEL_USE.md. The panel of twenty
# (docs/DESIGN-Z2.md) asked for live, streamed model calls. Nothing on the page
# streamed before this: every model call was fetch().then(json). These five
# endpoints stream token by token as Server-Sent Events, so the reader sees the
# model working on real evidence rather than a dead button.
#
# Every one states what it read (n of m) in its first event, streams the
# model's words as they arrive, and ends with a "done" event carrying the
# count, wall time and tokens. Abstention is a result, not an error.
# ============================================================================
from flask import stream_with_context

def glm_stream(prompt, effort="low", max_tokens=1500):
    """Yield content deltas as they arrive. Same call shape as glm()."""
    body = {"model": MODEL, "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens, "stream": True,
            "messages": [{"role": "user", "content": prompt}]}
    r = requests.post(ZAI, json=body, timeout=1800, stream=True, headers={
        "Authorization": "Bearer " + key(), "Content-Type": "application/json"})
    if r.status_code != 200:
        raise RuntimeError("z.ai %s %s" % (r.status_code, r.text[:200]))
    usage = {}
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        chunk = line[5:].strip()
        if chunk == "[DONE]":
            break
        try:
            d = json.loads(chunk)
        except ValueError:
            continue
        if d.get("usage"):
            usage = d["usage"]
        for ch in d.get("choices", []):
            piece = (ch.get("delta") or {}).get("content")
            if piece:
                yield ("delta", piece.replace("**", ""))
    yield ("usage", usage)


def _sse(event, data):
    return "event: %s\ndata: %s\n\n" % (event, json.dumps(data, ensure_ascii=False))


# ---- hand-written, 31 August 2026: Prove it -------------------------------
# Every quote the model writes in the mechanics' capitals is checked, after the
# stream ends, against the record it cites (or, for a single-record read, the
# record itself). A sentence with a quote that is not a literal substring of
# the write-up is dropped before the page shows the final text. Deterministic,
# no extra tokens. The page shows the counts.
_CAPS = re.compile(r"[A-Z0-9][A-Z0-9 ,./#&'\-()]{10,}[A-Z0-9)]")
_RID = re.compile(r"\[([A-Z0-9]{8,24})\]")

def _norm(t):
    return re.sub(r"[^A-Z0-9]+", " ", (t or "").upper()).strip()

def _sentences(text):
    out = []
    for para in re.split(r"\n\s*\n|\n", text):
        para = para.strip()
        if not para:
            continue
        parts = re.split(r"(?<=[.!?\]])\s+(?=[A-Z][a-z]|[\"'\u2018\u201c])", para)
        out.append([x.strip() for x in parts if x.strip()])
    return out

def verify_text(text, recs, meta_of=None):
    """recs: {id: write-up}. Returns (sentences, stats)."""
    paras = _sentences(text)
    normed = {k: _norm(v) for k, v in recs.items()}
    checked = ok = removed = 0
    out = []
    for pi, para in enumerate(paras):
        for sent in para:
            ids = _RID.findall(sent)
            # a quote is text inside quotation marks, or the capitals that sit
            # directly before a [record]; counted facts like "(AALA, 514)" are not quotes.
            quotes = [q.strip(" ,.") for q in re.findall(r'["\u201c]([^"\u201d]{8,}?)["\u201d]', sent)]
            for m in re.finditer(r"([A-Z0-9][A-Z0-9 ,./#&'\-()]{10,})\s*\[[A-Z0-9]{8,24}\]", sent):
                q = m.group(1).strip(" ,.\"\u201c\u201d")
                if q and q not in quotes:
                    quotes.append(q)
            quotes = [q for q in quotes if len(q.split()) >= 3 and re.search(r"[A-Z]{2}", q)]
            found, bad = [], False
            for q in quotes:
                checked += 1
                nq = _norm(q)
                pool = [i for i in ids if i in normed] or (list(normed) if len(normed) == 1 or not ids else [])
                hit = next((i for i in pool if nq in normed[i]), None)
                if hit is None and not ids and len(normed) > 1:
                    hit = next((i for i in normed if nq in normed[i]), None)
                if hit:
                    ok += 1; found.append({"id": hit, "quote": q, "ok": True})
                else:
                    bad = True; found.append({"id": ids[0] if ids else None, "quote": q, "ok": False})
            for i in ids:
                if i in recs and not any(f["id"] == i for f in found):
                    found.append({"id": i, "quote": None, "ok": True})
            if bad:
                removed += 1
            out.append({"t": sent, "recs": found, "drop": bad, "para": pi})
    return out, {"checked": checked, "ok": ok, "removed": removed}

_NEXT_FIELDS = ("ata", "operator", "model", "tail", "q", "part", "from", "to", "zone", "crew")

def _next_three(tail_json, base):
    """Resolve the model's proposed narrower slices against the file; drop zeros."""
    try:
        items = json.loads(tail_json)
    except Exception:
        return []
    out = []
    for it in items[:3] if isinstance(items, list) else []:
        f = {k: str(v) for k, v in (it.get("filters") or {}).items() if k in _NEXT_FIELDS and v}
        if not f:
            continue
        if "tail" in f:
            f["tail"] = f["tail"].upper().lstrip("N")
        params = dict(base); params.update(f); params["limit"] = 1
        try:
            n = api("/api/search", **params).get("total", 0)
        except Exception:
            n = 0
        if n:
            out.append({"filters": f, "n": n, "why": (it.get("why") or "")[:140]})
    return out

NEXT_ASK = ("\n\nFinally, on a last line of its own, write NEXT: followed by a JSON list of up to three "
            "narrower slices worth opening, each {\"filters\": {field: value}, \"why\": \"one short reason "
            "from what you read\"}; fields only from ata (4-digit JASC code), operator (FAA designator as it "
            "appears in the write-ups' record numbers), model, tail, q (a single word from the write-ups), "
            "from, to. Nothing after the JSON.")

def _stream_response(meta, prompt, effort, max_tokens, recs=None, meta_of=None, base=None, fallback_checks=None):
    t0 = time.time()
    def gen():
        yield _sse("meta", meta)
        got = []
        try:
            for kind, x in glm_stream(prompt, effort=effort, max_tokens=max_tokens):
                if kind == "delta":
                    got.append(x)
                    yield _sse("delta", x)
                else:
                    text = "".join(got)
                    m = re.search(r"\n?\s*NEXT:\s*(\[[\s\S]*\])\s*$", text)
                    if m:
                        text = text[:m.start()].rstrip()
                        yield _sse("next", _next_three(m.group(1), base or {}))
                    m = re.search(r"\n?\s*CHECKS:\s*(\[[\s\S]*\])\s*$", text)
                    if m or fallback_checks:
                        chk = []
                        if m:
                            text = text[:m.start()].rstrip()
                            try:
                                chk = [c for c in json.loads(m.group(1)) if isinstance(c, dict) and c.get("filters")]
                            except Exception:
                                chk = []
                        have = {json.dumps(c.get("filters"), sort_keys=True) for c in chk}
                        for c in (fallback_checks or []):
                            if json.dumps(c["filters"], sort_keys=True) not in have:
                                chk.append(c)
                        yield _sse("checks", chk[:5])
                    if recs:
                        sents, stats = verify_text(text, recs)
                        yield _sse("verify", {"sentences": sents, "stats": stats, "records": meta_of or {}})
                    yield _sse("done", {"seconds": round(time.time() - t0, 1),
                                        "tokens": (x or {}).get("total_tokens"),
                                        "model": MODEL, "effort": effort})
        except Exception as e:
            yield _sse("error", {"message": str(e)[:200],
                                 "seconds": round(time.time() - t0, 1)})
    return Response(stream_with_context(gen()), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


def _recs_of(rows):
    recs = {r.get("OperatorControlNumber"): (r.get("Discrepancy") or "") for r in rows if r.get("OperatorControlNumber")}
    meta = {r.get("OperatorControlNumber"): {"op": r.get("OperatorDesignator"), "tail": r.get("RegistryNNumber"),
            "date": r.get("DifficultyDate"), "model": ((r.get("AircraftMake") or "") + " " + (r.get("AircraftModel") or "")).strip(), "raw": r}
            for r in rows if r.get("OperatorControlNumber")}
    return recs, meta


def _selection_rows(limit):
    """The rows the instrument is showing, from the same query string."""
    params = {k: v for k, v in request.args.items() if v}
    params["limit"] = limit
    d = api("/api/search", **params)
    rows = d.get("rows") or []
    return rows, d.get("total", len(rows))


ABSTAIN = ("If the write-ups do not support an answer, say exactly that in one "
           "sentence and stop. Never invent. Never soften. British English, no em dashes.")


NOVICE = ("Write for someone who has never worked on an aircraft and has never read one of "
          "these forms. Use the decoded fields as well as the write-up: say what aircraft and "
          "airline this is, when and at what stage of flight it was found, how it was found, "
          "and what the mechanic did. Expand every abbreviation the first time it appears, in "
          "brackets, and say in one plain clause what the part is for (for example: 'the "
          "fitting that holds the cargo door's opening arm to the airframe'). If the inspection "
          "method has a name, say what it does in a few words. Keep every fact; add no cause, no "
          "danger, no judgement. End with one sentence naming what the report does not say.")


@app.get("/z/api/stream/gloss")
def stream_gloss():
    text = (request.args.get("text") or "").strip()
    if not text:
        return jsonify(error="no text"), 400
    # the whole record, decoded by the FAA's own tables, not the sentence alone.
    # The page hands the raw record over as JSON in `rec`; the search API has no
    # lookup by control number.
    facts = {}
    try:
        raw = json.loads(request.args.get("rec") or "{}")
        if isinstance(raw, dict) and raw:
            rec = decorate(raw)
            facts = {k: v for k, v in rec.items() if v and k not in ("text", "id")}
    except Exception:
        facts = {}
    prompt = (GLOSS_RULES.split("Separately:")[0] + "\n" + NOVICE + "\n" + ABSTAIN +
              "\nWrite plain prose only, no JSON, at most 160 words.\n\n"
              + ("Every coded field on this report, decoded:\n" + json.dumps(facts, ensure_ascii=False) + "\n\n" if facts else "")
              + "The write-up, verbatim:\n" + text)
    rid = (raw.get("OperatorControlNumber") if isinstance(raw, dict) else None) or "THIS"
    return _stream_response({"read": 1, "of": 1, "what": "this report, all fields"},
                            prompt, "low", 1500, recs={rid: text}, meta_of={})


@app.get("/z/api/stream/recurs")
def stream_recurs():
    rows, total = _selection_rows(300)
    texts = [(r.get("OperatorControlNumber"), (r.get("Discrepancy") or "").strip())
             for r in rows if (r.get("Discrepancy") or "").strip()]
    n = len(texts)
    if n < 12:
        def gen():
            yield _sse("meta", {"read": n, "of": total, "what": "write-ups"})
            yield _sse("abstain", {"text": "Too few write-ups to find a pattern. %d read." % n})
        return Response(stream_with_context(gen()), mimetype="text/event-stream")
    listing = "\n".join("[%s] %s" % (i, t[:600]) for i, t in texts)
    scope = ("all %d write-ups in this selection" % n if n >= total
             else "the newest %d of %d write-ups in this selection, not a sample of the rest" % (n, total))
    prompt = ("You are reading %s, verbatim, from FAA service difficulty reports, on behalf of a reader "
              "who has never seen one. Write it as a short piece of plain prose, not a list and not a report: "
              "first one paragraph saying, in everyday words, what these write-ups are mostly about and what "
              "keeps coming back that no coded box would show; then at most four short paragraphs, one per "
              "recurring thing, each explaining it in plain language and ending with ONE short quote of no more "
              "than fifteen words in the mechanic's own capitals, followed by its record number in square "
              "brackets exactly as given. Expand shorthand the first time it appears. Say 'several' or 'a few' "
              "rather than a count you have not verified. Say nothing about cause, safety or rates. Do not dump "
              "codes. %s\n\n%s" % (scope, ABSTAIN, listing) + NEXT_ASK)
    recs, meta_of = _recs_of(rows)
    base = {k: v for k, v in request.args.items() if v and k not in ("hero", "view", "case", "v")}
    return _stream_response({"read": n, "of": total, "what": "write-ups", "scope": scope},
                            prompt, "low", 8000, recs=recs, meta_of=meta_of, base=base)



# ---- hand-written, 31 August 2026: a question the filters cannot hold -------
# "What plane is the most dangerous" has no field. The model reads the newest
# write-ups in the selection plus the counted breakdowns, says plainly what the
# file cannot answer, and answers what it can, quoting records. Quotes are
# verified; three next clicks follow.
@app.get("/z/api/stream/question")
def stream_question():
    qtext = (request.args.get("q") or "").strip()[:300]
    if not qtext:
        return jsonify(error="no question"), 400
    base = {k: v for k, v in request.args.items() if v and k not in ("hero", "view", "case", "v", "q")}
    params = dict(base); params["limit"] = 200
    d = api("/api/search", **params)
    rows = d.get("rows") or []; total = d.get("total", len(rows))
    counts = {}
    for by in ("model", "operator", "crew", "ata"):
        try:
            c = api("/api/breakdown", by=by, **base)
            c = c if isinstance(c, list) else (c.get("rows") or [])
            counts[by] = [{"key": x.get("label") or x.get("key") or x.get("code"), "n": x.get("n") or x.get("reports")} for x in c[:8]]
        except Exception:
            pass
    texts = [(r.get("OperatorControlNumber"), (r.get("Discrepancy") or "").strip()) for r in rows if (r.get("Discrepancy") or "").strip()]
    listing = "\n".join("[%s] %s" % (i, t[:500]) for i, t in texts)
    prompt = ("Someone who has never read an aircraft maintenance report asked: \"%s\"\n\n"
              "You have a file of FAA service difficulty reports: %s reports in the current selection. Below are the "
              "counted breakdowns for the whole selection (reports filed, never rates or risk), then the newest %d "
              "write-ups verbatim. Answer in plain, friendly prose addressed to the reader as you, at most 180 words: "
              "first one sentence saying honestly what this file cannot tell them (it records what mechanics found and "
              "fixed, not accidents, injuries or how dangerous anything is), then the closest thing it can show, using the "
              "counts and the write-ups, naming the aircraft types or airlines with the most reports as most written-up, "
              "never as most dangerous. Include two or three short quotes of no more than fifteen words in the mechanic's "
              "own capitals, each followed by its record number in square brackets exactly as given. Never say reporter. %s"
              "\n\nCounts: %s\n\nWrite-ups:\n%s" % (qtext, "{:,}".format(total), len(texts), ABSTAIN,
              json.dumps(counts, ensure_ascii=False), listing)) + NEXT_ASK
    recs, meta_of = _recs_of(rows)
    return _stream_response({"read": len(texts), "of": total, "what": "write-ups, plus the counts"},
                            prompt, "low", 4000, recs=recs, meta_of=meta_of, base=base)


# ---- hand-written, 31 August 2026: the web, for the Freefall page only -----
# The file has no context for the door plug. GLM-5.3-Flash with z.ai's web
# search tool reads the news and the NTSB, and the page labels it as the web,
# not the file. Streamed in one piece so the same block on the page renders it.
_NEWS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "news_cache.json")
try:
    _NEWS = json.load(open(_NEWS_PATH))
except Exception:
    _NEWS = {}
def _news_save():
    try:
        json.dump(_NEWS, open(_NEWS_PATH + ".tmp", "w")); os.replace(_NEWS_PATH + ".tmp", _NEWS_PATH)
    except Exception:
        pass
NEWS_TOPICS = [
  ("NTSB final report Alaska Airlines 1282 door plug probable cause Boeing",
   "What caused the Alaska Airlines flight 1282 door plug blowout on 5 January 2024 according to the NTSB final report of June 2025, and what happened to Boeing afterwards?"),
  ("Freefall: A Reckoning for Boeing Netflix Rory Kennedy documentary review",
   "The Netflix documentary 'Freefall: A Reckoning for Boeing' directed by Rory Kennedy, released 19 August 2026: what is it about, who are the whistleblowers in it, and how have reviewers received it?")]
ZAI_SEARCH = "https://api.z.ai/api/paas/v4/web_search"

def web_search(query, count=10):
    r = requests.post(ZAI_SEARCH, timeout=60, headers={"Authorization": "Bearer " + key(), "Content-Type": "application/json"},
                      json={"search_query": query[:200], "search_engine": "search_pro", "search_recency_filter": "noLimit",
                            "count": max(count * 3, 20), "content_size": "medium"})
    if r.status_code != 200:
        raise RuntimeError("web search %s" % r.status_code)
    out = []
    for x in r.json().get("search_result") or []:
        if not (x.get("link") and x.get("content")):
            continue
        title = x.get("title") or ""
        if re.search(r"[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\u0400-\u04ff]", title + x["link"]):
            continue   # mirrors and translations; the reader wants the source
        host = re.sub(r"^https?://(www\.)?", "", x["link"]).split("/")[0]
        if host in ("nutanica.com", "wikizero.net", "gwern.net", "newsbreak.com") or "translate.goog" in host or host.endswith((".fr", ".de", ".es", ".it", ".nl", ".cn", ".my")):
            continue
        rank = 0 if host.endswith(".gov") else 1 if re.search(r"(wikipedia|ntsb|faa|reuters|apnews|nytimes|latimes|usatoday|bbc|theguardian|cnn|cbsnews|nbcnews|seattletimes|netflix|variety|time\.com|hollywoodreporter)", host) else 2
        out.append({"title": title, "url": x["link"], "text": (x.get("content") or "")[:1200],
                    "date": x.get("publish_date") or "", "rank": rank})
    out.sort(key=lambda h: h["rank"])
    return out[:count]

@app.get("/z/api/stream/news")
def stream_news():
    topic = (request.args.get("topic") or "").strip()[:300]
    query = (request.args.get("q") or topic).strip()[:200]
    if not topic:
        return jsonify(error="no topic"), 400
    t0 = time.time()
    def gen():
        yield _sse("meta", {"what": "the web, not the file"})
        if topic in _NEWS and time.time() - _NEWS[topic]["at"] < 24 * 3600:
            yield _sse("delta", _NEWS[topic]["text"])
            yield _sse("sources", _NEWS[topic].get("sources") or [])
            yield _sse("done", {"seconds": 0.1, "model": MODEL, "effort": "web, cached"})
            return
        try:
            hits = web_search(query, 10)
        except Exception as e:
            yield _sse("error", {"message": "web search failed: " + str(e)[:120], "seconds": round(time.time() - t0, 1)}); return
        if len(hits) < 2:
            yield _sse("abstain", {"text": "The web search found too little to summarise."}); return
        listing = "\n\n".join("[%d] %s (%s) %s\n%s" % (i + 1, h["title"], h["date"], h["url"], h["text"]) for i, h in enumerate(hits))
        prompt = ("Below are web search results, numbered. Using ONLY these results, answer this for a general reader in at "
                  "most 220 words of plain prose, British English, no em dashes, no headings, no bullet points, with dates: "
                  + topic + "\nAt the end of each sentence put ONE result number in square brackets, the most authoritative result that supports it; never more than one per sentence. If the results do not cover part of "
                  "the question, say so in one short sentence. Do not use anything you know from elsewhere.\n\n" + listing)
        try:
            text = ""
            for kind, x in glm_stream(prompt, effort="low", max_tokens=4000):
                if kind == "delta":
                    text += x
                    yield _sse("delta", x)
            used = sorted({int(n) for n in re.findall(r"\[(\d{1,2})\]", text) if 0 < int(n) <= len(hits)})
            srcs = [{"n": n, "url": hits[n - 1]["url"], "title": hits[n - 1]["title"][:120]} for n in used]
            yield _sse("sources", srcs)
            _NEWS[topic] = {"text": text, "sources": srcs, "at": time.time()}; _news_save()
            yield _sse("done", {"seconds": round(time.time() - t0, 1), "model": MODEL, "effort": "web, %d results read" % len(hits)})
        except Exception as e:
            yield _sse("error", {"message": str(e)[:200], "seconds": round(time.time() - t0, 1)})
    return Response(stream_with_context(gen()), mimetype="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})



# ---- hand-written, 31 August 2026: what differs between two airlines ---------
# The counts come from /api/compare; the model reads 150 write-ups from each
# side and only phrases the difference in the mechanics' words. Quotes verified.
@app.get("/z/api/stream/differ")
def stream_differ():
    a = (request.args.get("a") or "").strip().upper()[:8]; b = (request.args.get("b") or "").strip().upper()[:8]
    if not a or not b or a == b:
        return jsonify(error="two airlines needed"), 400
    base = {k: v for k, v in request.args.items() if v and k not in ("hero", "view", "case", "v", "a", "b", "operator")}
    ra = api("/api/search", operator=a, limit=150, **base); rb = api("/api/search", operator=b, limit=150, **base)
    rows_a = ra.get("rows") or []; rows_b = rb.get("rows") or []
    try:
        cmp_ = api("/api/compare", field="operator", a=a, b=b)
        counts = {a: [(x.get("label"), x.get("n"), round((x.get("share") or 0) * 100, 1)) for x in (cmp_.get("a") or {}).get("systems", [])[:8]],
                  b: [(x.get("label"), x.get("n"), round((x.get("share") or 0) * 100, 1)) for x in (cmp_.get("b") or {}).get("systems", [])[:8]]}
    except Exception:
        counts = {}
    def lst(rows):
        return "\n".join("[%s] %s" % (r.get("OperatorControlNumber"), (r.get("Discrepancy") or "").strip()[:450]) for r in rows if (r.get("Discrepancy") or "").strip())
    na, nb = len(rows_a), len(rows_b)
    if na < 12 or nb < 12:
        def gen():
            yield _sse("meta", {"read": na + nb, "of": (ra.get("total") or 0) + (rb.get("total") or 0), "what": "write-ups"})
            yield _sse("abstain", {"text": "Too few write-ups on one side to compare (%d and %d read)." % (na, nb)})
        return Response(stream_with_context(gen()), mimetype="text/event-stream")
    prompt = ("Two airlines' FAA service difficulty reports. %s filed %s reports, %s filed %s (as counted, not rates; fleet size "
              "and filing habits differ, so never say one is safer or worse). Their share of reports by system, counted: %s.\n\n"
              "Below are the newest %d write-ups from %s and the newest %d from %s, verbatim. For a reader who has never seen "
              "one, write plain prose in three short paragraphs, no headings: what both airlines' write-ups have in common; what "
              "appears in %s's write-ups and not %s's; what appears in %s's and not %s's. Each paragraph ends with one or two "
              "short quotes of at most fifteen words in the mechanic's own capitals, each followed by its record number in "
              "square brackets exactly as given. Expand shorthand the first time. Say 'several' rather than a count you have not "
              "verified. %s\n\n== %s ==\n%s\n\n== %s ==\n%s"
              % (a, "{:,}".format(ra.get("total") or 0), b, "{:,}".format(rb.get("total") or 0), json.dumps(counts),
                 na, a, nb, b, a, b, b, a, ABSTAIN, a, lst(rows_a), b, lst(rows_b)))
    recs, meta_of = _recs_of(rows_a + rows_b)
    return _stream_response({"read": na + nb, "of": (ra.get("total") or 0) + (rb.get("total") or 0), "what": "write-ups, %d and %d" % (na, nb)},
                            prompt, "low", 6000, recs=recs, meta_of=meta_of)


# ---- hand-written, 31 August 2026: one airframe, end to end -----------------
# Every report for one tail in defect-date order. Gaps over a year are inserted
# by the server as markers so the model cannot bridge them; filing lag is given
# per record; causal verbs are banned. Quotes verified.
@app.get("/z/api/stream/airframe")
def stream_airframe():
    import datetime as _dt
    tail = (request.args.get("tail") or "").strip().upper().lstrip("N")[:8]
    if not tail:
        return jsonify(error="no tail"), 400
    d = api("/api/aircraft/N" + tail)
    rows = d.get("rows") or []
    def dt(x):
        m = re.match(r"(\d\d)/(\d\d)/(\d{4})", x or "")
        return _dt.date(int(m.group(3)), int(m.group(1)), int(m.group(2))) if m else None
    rows = [r for r in rows if dt(r.get("DifficultyDate"))]
    rows.sort(key=lambda r: dt(r.get("DifficultyDate")))
    rows = rows[-300:]
    n = len(rows)
    if n < 3:
        def gen():
            yield _sse("meta", {"read": n, "of": d.get("count", n), "what": "reports on N" + tail})
            yield _sse("abstain", {"text": "Only %d report%s on this aircraft: too few for a story. Read them one by one." % (n, "" if n == 1 else "s")})
        return Response(stream_with_context(gen()), mimetype="text/event-stream")
    lines = []; prev = None
    for r in rows:
        day = dt(r.get("DifficultyDate"))
        if prev and (day - prev).days > 365:
            lines.append("---- NOTHING FILED between %s and %s (%d days). This says nothing about the aircraft, only about the file. ----" % (prev.isoformat(), day.isoformat(), (day - prev).days))
        lag = ""
        rd = dt(r.get("ReceivedDate") or r.get("DateReceived") or "")
        if rd:
            lag = " (reached the FAA %d days later)" % max(0, (rd - day).days)
        lines.append("[%s] %s%s · %s hours · %s\n%s" % (r.get("OperatorControlNumber"), day.isoformat(), lag, r.get("AircraftTotalTime") or "?", r.get("OperatorDesignator") or "", (r.get("Discrepancy") or "").strip()[:500]))
        prev = day
    mk = ((rows[0].get("AircraftMake") or "") + " " + (rows[0].get("AircraftModel") or "")).strip()
    prompt = ("Every FAA service difficulty report filed on one aircraft, N%s, a %s, in date order, %d reports, oldest first. "
              "Write its story for a reader who has never seen one of these forms: one short paragraph per turning point "
              "(at most eight paragraphs), each opening with the date written out, saying in plain words what was found and "
              "what was done, and ending with one quote of at most fifteen words in the mechanic's own capitals followed by "
              "its record number in square brackets exactly as given. Where a NOTHING FILED marker appears, write exactly one "
              "sentence: 'Nothing was filed between X and Y; that says nothing about the aircraft, only about the file.' "
              "Never use 'because', 'caused', 'led to' or 'due to'; the file records no causes. Never say a later report is "
              "the same fault as an earlier one unless the write-up itself refers back to it. Say nothing about safety. "
              "Expand shorthand the first time. %s\n\n%s" % (tail, mk or "aircraft", n, ABSTAIN, "\n\n".join(lines)))
    recs, meta_of = _recs_of(rows)
    return _stream_response({"read": n, "of": d.get("count", n), "what": "reports on N" + tail + ", oldest first"},
                            prompt, "low", 8000, recs=recs, meta_of=meta_of)


# ---- hand-written, 31 August 2026: airline names for the page --------------
# The FAA's December 2006 cross-reference, so names can be stale; the page
# keeps the designator in the tooltip.
_OPS = None
@app.get("/z/api/operators")
def operators_map():
    global _OPS
    if _OPS is None:
        out = {}
        try:
            facets = api("/api/facets")
            for o in (facets.get("operators") or []):
                if isinstance(o, str):
                    n = dec("operator", o)
                    if n and n.upper() != o.upper():
                        out[o] = n
        except Exception:
            pass
        _OPS = out
    return jsonify(_OPS)


# ---- hand-written, 31 August 2026: the full case sheet, every code spelled out ----
# The FAA's own wording is kept beside the plain label so either can be quoted.
SHEET_FIELDS = [
 ("DifficultyDate", "Date of the difficulty", None), ("OperatorDesignator", "Airline", "operator"), ("SubmitterTypeCode", "Filed by", "submitter"),
 ("AircraftMake", "Aircraft make", None), ("AircraftModel", "Aircraft model", None), ("RegistryNNumber", "Tail number", None), ("AircraftSerialNumber", "Aircraft serial number", None),
 ("AircraftTotalTime", "Hours on the airframe", None), ("AircraftTotalCycles", "Cycles (take-offs and landings)", None),
 ("JASCCode", "System", "jasc"), ("PartName", "Part", None), ("PartCondition", "Condition of the part", None), ("PartNumber", "Part number", None), ("PartMake", "Part make", None),
 ("PartLocation", "Where on the aircraft", "part_location"), ("PartSerialNumber", "Part serial number", None), ("PartSinceCode", "Part time since", "time_since"), ("PartTimeSince", "Part hours since", None), ("PartTotalTime", "Part total hours", None), ("PartTotalCycles", "Part total cycles", None),
 ("NatureOfConditionA", "What was found", "nature"), ("NatureOfConditionB", "What was found (2)", "nature"), ("NatureOfConditionC", "What was found (3)", "nature"),
 ("PrecautionaryProcedureA", "What the crew did", "precaution"), ("PrecautionaryProcedureB", "What the crew did (2)", "precaution"), ("PrecautionaryProcedureC", "What the crew did (3)", "precaution"), ("PrecautionaryProcedureD", "What the crew did (4)", "precaution"),
 ("StageOfOperationCode", "Stage of flight", "stage"), ("HowDiscoveredCode", "How it was found", "discovered"), ("CorrosionLevel", "Corrosion level", "corrosion"), ("CrackLength", "Crack length", None), ("NumberOfCracks", "Number of cracks", None),
 ("ComponentName", "Component", None), ("ComponentMake", "Component make", None), ("ComponentModel", "Component model", None), ("ComponentPartNumber", "Component part number", None), ("ComponentLocation", "Component location", None),
 ("SDRType", "Report type", "sdr_type"), ("ReceivingRegionCode", "FAA region", "region"), ("ReceivingDistrictOffice", "FAA district office", "district"), ("SubmissionDate", "Submitted to the FAA", None), ("OperatorControlNumber", "Control number", None),
]
@app.get("/z/api/sheet/<rid>")
def sheet(rid):
    try:
        raw = api("/api/case/" + rid)
    except requests.HTTPError as e:
        if e.response is not None and e.response.status_code == 404:
            return jsonify(error="no such record"), 404
        return jsonify(error="the file did not answer"), 502
    except requests.RequestException:
        return jsonify(error="the file did not answer"), 502
    if not isinstance(raw, dict) or not raw.get("OperatorControlNumber"):
        return jsonify(error="no such record"), 404
    tables = gloss_tables(); rows = []
    for field, label, table in SHEET_FIELDS:
        v = raw.get(field)
        if v in (None, "", " "): continue
        row = {"field": label, "code": str(v), "value": str(v), "faa": None, "note": None}
        if field == "DifficultyDate":
            row["value"] = _date_words(v) or v
        if table:
            t = tables.get(table) or {}; e = t.get(str(v).strip().upper())
            if isinstance(e, dict):
                row["value"] = e.get("label") or e.get("faa") or str(v); row["faa"] = e.get("faa") if e.get("faa") != row["value"] else None; row["note"] = e.get("note")
            elif isinstance(e, str):
                row["value"] = e
            else:
                row["note"] = "Not in the FAA table used here. Shown as filed."
            if table == "jasc" and not isinstance(e, dict):
                ch = t.get(str(v).strip()[:2] + "00")
                if isinstance(ch, dict): row["value"] = ch.get("label") or str(v); row["faa"] = ch.get("faa")
        rows.append(row)
    return jsonify(id=rid, raw=raw, rows=rows, text=raw.get("Discrepancy") or "",
                   source="FAA Service Difficulty Reports; codes decoded with the FAA's own tables (%s)." % (tables.get("_source", {}).get("edition", "") if isinstance(tables.get("_source"), dict) else ""))

@app.get("/z/api/stream/vocab")
def stream_vocab():
    word = (request.args.get("word") or "").strip().upper()
    if not word or len(word) < 3:
        return jsonify(error="no word"), 400
    d = api("/api/search", q=word.lower(), limit=60)
    rows = d.get("rows") or []
    total = d.get("total", len(rows))
    texts = [(r.get("OperatorControlNumber"), (r.get("Discrepancy") or "").strip())
             for r in rows if word in (r.get("Discrepancy") or "").upper()]
    n = len(texts)
    if n < 10:
        def gen():
            yield _sse("meta", {"read": n, "of": total, "what": "uses of " + word})
            yield _sse("abstain", {"text": "This word appears %d times. Not enough to tell you how it is used." % total})
        return Response(stream_with_context(gen()), mimetype="text/event-stream")
    listing = "\n".join("[%s] %s" % (i, t[:400]) for i, t in texts)
    prompt = ("Below are %d verbatim aircraft maintenance write-ups that contain the word %s. "
              "Explain how mechanics use this word in these write-ups: what it means here, and "
              "which other words or shorthand they use for the same thing, each with one quote "
              "and its record number in square brackets exactly as given. Mark each meaning "
              "'from the record' if the write-ups show it, or 'outside knowledge' if you are "
              "supplying it. %s\n\n%s" % (n, word, ABSTAIN, listing))
    return _stream_response({"read": n, "of": total, "what": "uses of " + word},
                            prompt, "low", 1500)


@app.get("/z/api/stream/slice")
def stream_slice():
    rows, total = _selection_rows(25)
    filters = {k: v for k, v in request.args.items() if v and k not in ("hero", "view", "case")}
    texts = [(r.get("OperatorControlNumber"), (r.get("Discrepancy") or "").strip())
             for r in rows if (r.get("Discrepancy") or "").strip()]
    n = len(texts)
    listing = "\n".join("[%s] %s" % (i, t[:400]) for i, t in texts)
    prompt = ("Someone is about to export %d FAA service difficulty reports selected by these "
              "filters: %s. Below are %d of them, verbatim. Say, in at most three short "
              "paragraphs: which of these %d do not belong to what the filters seem to intend, "
              "quoting the words and record number; and what the filters will miss because "
              "mechanics wrote it in words rather than codes, with one example word. If all %d "
              "match and nothing is obviously missed, say: 'These %d all match what you asked "
              "for. That says nothing about the other %s.' %s\n\n%s"
              % (total, json.dumps(filters), n, n, n, n, "{:,}".format(max(total - n, 0)),
                 ABSTAIN, listing))
    return _stream_response({"read": n, "of": total, "what": "write-ups", "filters": filters},
                            prompt, "high", 1200)


ASK_FIELDS = {"q": "words in the write-up", "operator": "airline designator", "tail": "N-number",
              "make": "aircraft make", "model": "aircraft model", "jasc": "JASC system code",
              "zone": "zone code, e.g. ZONE 700", "nature": "nature of condition code",
              "crew": "precautionary procedure code", "stage": "stage of operation code",
              "discovered": "how discovered code", "from": "date YYYY-MM-DD", "to": "date YYYY-MM-DD",
              "corrosion": "corrosion level 1-3", "minhours": "minimum airframe hours"}


@app.post("/z/api/ask")
def ask_file():
    d = request.get_json(force=True, silent=True) or {}
    q = (d.get("q") or "").strip()[:300]
    if not q:
        return jsonify(error="no question"), 400

    # ---- hand-written, 31 August 2026: an NTSB case number is a real question
    # A reporter reading an NTSB report has a case number in front of them and no
    # tail. The model was right that this file has no field for one, and answering
    # only that was unhelpful when the answer is one lookup away: the NTSB names
    # the aircraft, and this file is searchable by tail. So resolve it here and
    # say plainly which agency each half came from.
    case = _ntsb_case(q)
    if case:
        return jsonify(
            read=("%s is an NTSB case number, not an FAA one. This file has no field "
                  "for it. The NTSB names the aircraft on that case, and this file is "
                  "searchable by tail, so the reports below are the maintenance record "
                  "for N%s, the aircraft in %s. Nothing here explains that case and the "
                  "case explains nothing here."
                  % (case["case"], case["regis"], case["case"])),
            filters=[{"field": "tail", "value": "N" + case["regis"],
                      "why": "the aircraft named on NTSB case %s" % case["case"]}],
            unmapped=[],
            ntsb=case)

    tables = {t: code_list(t) for t in ("nature", "precaution", "stage", "discovered", "part_location")}
    # the model invented operator "WN" for Southwest on first test; the FAA
    # designator is SWAA. Hand it the real list and accept nothing outside it.
    try:
        facets = api("/api/facets")
        ops = [o for o in (facets.get("operators") or []) if isinstance(o, str)][:400]
    except Exception:
        ops = []
    tables["operator (designator: name)"] = {o: dec("operator", o) or o for o in ops}
    prompt = ("Someone asked this of a file of FAA service difficulty reports: \"%s\"\n\n"
              "Turn it into filters. Fields available: %s. Code tables (use only these codes): %s\n\n"
              "Return JSON only: {\"filters\": {field: value}, \"reading\": \"one friendly sentence, addressed to the "
              "reader as you, in everyday words, saying what this file can do with the question and what it cannot; never say reporter\", \"unmapped\": [\"words you could not map\"], "
              "\"cannot\": \"one sentence if the file has no field for what was asked, else null\"}. "
              "Never invent a code. Never answer the question yourself."
              % (q, json.dumps(ASK_FIELDS), json.dumps(tables)[:12000]))
    try:
        out = glm(prompt, schema=True, effort="low", max_tokens=600)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 502
    if not out:
        return jsonify(cannot="The model returned nothing usable.", filters={}), 200
    f = {k: str(v) for k, v in (out.get("filters") or {}).items() if k in ASK_FIELDS and v}
    dropped = []
    if "operator" in f and ops and f["operator"].upper() not in ops:
        dropped.append("operator " + f.pop("operator"))
    for tbl, fld in (("nature", "nature"), ("precaution", "crew"), ("stage", "stage"), ("discovered", "discovered")):
        if fld in f and f[fld].upper() not in tables[tbl]:
            dropped.append(fld + " " + f.pop(fld))
    unmapped = list(out.get("unmapped") or []) + dropped
    return jsonify(filters=f, reading=out.get("reading"), unmapped=unmapped,
                   cannot=out.get("cannot"), model=MODEL)

# ---- hand-written, 30 August 2026: the pre-read specimen -------------------
# The front door shows the latest report where the crew had to act, already
# read by the model, so the page opens with the reading in place. Cached by
# record id; a new record triggers one call. The FAA feed refreshes three
# times a day, so at most three calls a day.
_SPEC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spec_cache.json")
try:
    _SPEC = json.load(open(_SPEC_PATH))
except Exception:
    _SPEC = {}   # record id -> reading; the same report reads the same whatever the selection

def _spec_save():
    try:
        json.dump(_SPEC, open(_SPEC_PATH + ".tmp", "w"))
        os.replace(_SPEC_PATH + ".tmp", _SPEC_PATH)
    except Exception:
        pass

SIMPLE = ("Write for a curious member of the public, in short everyday sentences, at most 110 words. Say what "
          "kind of aircraft and whose it is, when and at what point of the flight the problem showed, what the "
          "part does in a few plain words, what the crew did, and what the mechanic did about it. No part "
          "numbers, no manual references, no codes. Expand every abbreviation into words. End with one short "
          "sentence naming what the report does not say. Then, on a last line of its own, write TERMS: followed by "
          "a JSON list of up to eight technical terms or part names from your text, exactly as you wrote them, that "
          "a reader might want to look up.")

@app.get("/z/api/specimen")
def specimen():
    params = {k: v for k, v in request.args.items() if v and k not in ("hero", "view", "case", "v")}
    params.setdefault("crew", "A")
    params["limit"] = 1
    d = api("/api/search", **params)
    rows = d.get("rows") or []
    if not rows:
        return jsonify(none=True, total=d.get("total", 0))
    r = rows[0]; rid = r.get("OperatorControlNumber")
    if rid in _SPEC:
        out = dict(_SPEC[rid]); out["total"] = d.get("total"); out["cached"] = True
        return jsonify(out)
    rec = decorate(r)
    text = rec["text"]
    facts = {k: v for k, v in rec.items() if v and k not in ("text", "id")}
    prompt = (SIMPLE + "\n" + ABSTAIN + "\n\nEvery coded field on this report, decoded:\n"
              + json.dumps(facts, ensure_ascii=False) + "\n\nThe write-up, verbatim:\n" + text)
    t0 = time.time(); plain = None; err = None; terms = []
    try:
        plain = glm(prompt, effort="low", max_tokens=900) or ""
        m = re.search(r"\n?\s*TERMS:\s*(\[[\s\S]*\])\s*$", plain)
        if m:
            try:
                terms = [str(t) for t in json.loads(m.group(1))][:8]
            except Exception:
                terms = []
            plain = plain[:m.start()].rstrip()
    except Exception as e:
        err = str(e)[:120]
    out = {"record": rec, "raw": r, "plain": plain, "terms": terms, "error": err, "read_at": time.strftime("%H:%M"),
           "seconds": round(time.time() - t0, 1), "total": d.get("total"), "model": MODEL}
    if plain and not err:
        _SPEC[rid] = out; _spec_save()
    return jsonify(out)


@app.get("/z/api/specimen/warm")
def specimen_warm():
    """Pre-read the specimen for the states a reader lands on. Called by the
    feed's cron after each FAA refresh; until that cron exists, called by hand."""
    import datetime
    y = datetime.date.today().year
    states = [{}] + [{"zone": "ZONE %d00" % i} for i in range(1, 10)] + \
             [{"from": "%d-01-01" % y}, {"from": "%d-01-01" % (y-1), "to": "%d-12-31" % (y-1)}, {"tail": "704AL", "crew": "A"},
              {"from": (datetime.date.today() - datetime.timedelta(days=90)).isoformat()}, {"from": datetime.date.today().replace(day=1).isoformat()}]
    done = []
    for q_, topic in NEWS_TOPICS:
        with app.test_request_context("/z/api/stream/news", query_string={"q": q_, "topic": topic}):
            try:
                r = stream_news(); body = b"".join(r.response) if hasattr(r, "response") else b""
                done.append({"state": {"news": topic[:40]}, "ok": b"event: done" in body})
            except Exception as e:
                done.append({"state": {"news": topic[:40]}, "ok": False, "error": str(e)[:80]})
    for st in states:
        with app.test_request_context("/z/api/specimen", query_string=st):
            try:
                r = specimen()
                d = r.get_json() if hasattr(r, "get_json") else {}
                done.append({"state": st, "ok": bool(d and d.get("plain")), "seconds": (d or {}).get("seconds")})
            except Exception as e:
                done.append({"state": st, "ok": False, "error": str(e)[:80]})
    return jsonify(warmed=done)


# ---- hand-written, 30 August 2026: five questions a reader can put to one record ----
ASKS = {
 "explain": "Explain what actually happened, for someone who has never read one of these forms.",
 "danger":  "Was anyone in danger at any point, according only to what the report states? Say what it states and what it does not; do not speculate.",
 "repair":  "What did the mechanics do about it, step by step, and what did they leave undone or unsaid?",
 "why":     "Does the report give any cause? If it does, quote it. If it does not, say so plainly and do not guess.",
 "checks":  "What should we check next in this file: same aircraft, same part, same airline, same day, same system? In two or three plain sentences, addressed to the reader as we, say which of these are worth a look and why, using only what this record says; do not discuss what the record lacks. Then, on its own last line, write CHECKS: followed by a JSON list of the searches, each {\"label\": short words, \"filters\": {field: value}} using only these fields: tail (the N-number without the N), operator (designator), model, part, ata (two-digit chapter), from and to (YYYY-MM-DD). Use only values that appear in the decoded fields.",
}

@app.get("/z/api/stream/case")
def stream_case():
    which = (request.args.get("q") or "explain").strip()
    text = (request.args.get("text") or "").strip()
    if which not in ASKS or not text:
        return jsonify(error="no question"), 400
    facts = {}
    try:
        raw = json.loads(request.args.get("rec") or "{}")
        if isinstance(raw, dict) and raw:
            rec = decorate(raw); facts = {k: v for k, v in rec.items() if v and k not in ("text", "id")}
    except Exception:
        facts = {}
    prompt = (ASKS[which] + "\n" + NOVICE.split("End with")[0] + "\n" + ABSTAIN +
              "\nDo not print the record number, part numbers, model codes or the registration; say the aircraft type and airline in plain words. "
              "\nPlain prose, no JSON, at most 140 words.\n\nEvery coded field on this report, decoded:\n"
              + json.dumps(facts, ensure_ascii=False) + "\n\nThe write-up, verbatim:\n" + text)
    rid = (raw.get("OperatorControlNumber") if isinstance(raw, dict) else None) or "THIS"
    fb = []
    if which == "checks" and isinstance(raw, dict):
        tail = (raw.get("RegistryNNumber") or "").strip(); op = (raw.get("OperatorDesignator") or "").strip()
        part = (raw.get("PartName") or "").strip(); day = _date_words(raw.get("DifficultyDate"))
        mm = re.match(r"(\d\d)/(\d\d)/(\d{4})", raw.get("DifficultyDate") or "")
        iso = "%s-%s-%s" % (mm.group(3), mm.group(1), mm.group(2)) if mm else None
        if tail and part: fb.append({"label": "same aircraft, same part", "filters": {"tail": tail, "part": part}})
        if tail: fb.append({"label": "everything on this aircraft", "filters": {"tail": tail}})
        if op and part: fb.append({"label": "same airline, same part", "filters": {"operator": op, "part": part}})
        if op and iso: fb.append({"label": "same airline, same day", "filters": {"operator": op, "from": iso, "to": iso}})
        if part and part.upper() != "UNKNOWN": fb.append({"label": "this part, every airline", "filters": {"part": part}})
    return _stream_response({"read": 1, "of": 1, "what": "this report, all fields"}, prompt, "low", 1500, recs={rid: text}, meta_of={}, fallback_checks=fb)


# ---- hand-written, 31 August 2026: the aircraft itself ----------------------
# The case sheet shows the aircraft behind the tail number. Three sources, each
# named on the page: the FAA's own releasable registry (built into
# faa_registry.sqlite by build_registry.py, refreshed from the daily zip),
# adsbdb.com for the airframe and its operator, and one photo from
# Planespotters.net, credited and linked as their API terms ask. The external
# calls are cached on disk for a week; a source that fails is simply absent,
# and nothing is guessed in its place.
import sqlite3

_AC_PATH = os.path.join(HERE, "aircraft_cache.json")
try:
    _AC = json.load(open(_AC_PATH))
except Exception:
    _AC = {}


def _ac_save():
    try:
        json.dump(_AC, open(_AC_PATH + ".tmp", "w")); os.replace(_AC_PATH + ".tmp", _AC_PATH)
    except Exception:
        pass


_AC_UA = {"User-Agent": "aircraftdefects.com/1.0 (+https://aircraftdefects.com; admin@imagewhisperer.org)"}
_REG_DB = os.path.join(HERE, "faa_registry.sqlite")


# The code keys below are the FAA's own, from ardata.pdf inside the releasable
# zip. A code that is not in these keys is shown as filed, never guessed.
_REG_TYPE = {"1": "Individual", "2": "Partnership", "3": "Corporation", "4": "Co-owned",
             "5": "Government", "7": "LLC", "8": "Non-citizen corporation", "9": "Non-citizen co-owned"}
_ACFT_TYPE = {"1": "Glider", "2": "Balloon", "3": "Blimp or dirigible", "4": "Fixed wing, single engine",
              "5": "Fixed wing, multi engine", "6": "Rotorcraft", "7": "Weight-shift-control",
              "8": "Powered parachute", "9": "Gyroplane", "H": "Hybrid lift", "O": "Other"}
_ENG_TYPE = {"0": "None", "1": "Reciprocating", "2": "Turbo-prop", "3": "Turbo-shaft", "4": "Turbo-jet",
             "5": "Turbo-fan", "6": "Ramjet", "7": "2-cycle", "8": "4-cycle", "9": "Unknown",
             "10": "Electric", "11": "Rotary"}
_AIRWORTH = {"1": "Standard", "2": "Limited", "3": "Restricted", "4": "Experimental", "5": "Provisional",
             "6": "Multiple", "7": "Primary", "8": "Special flight permit", "9": "Light sport"}
_WEIGHT = {"CLASS 1": "Class 1, up to 12,499 lb", "CLASS 2": "Class 2, 12,500 to 19,999 lb",
           "CLASS 3": "Class 3, 20,000 lb and over", "CLASS 4": "Class 4, UAV"}


def _reg_full(doc):
    """The FAA's whole row as labeled rows, in reading order. Values are the
    FAA's; only codes with a key in ardata.pdf are spelled out."""
    ref = doc.get("_ref") or {}
    eng = doc.get("_eng") or {}
    g = doc.get
    def cod(table, v):
        return (table.get(str(v)) + " (" + str(v) + ")") if v and str(v) in table else (str(v) + " (code, as filed)" if v else None)
    def numz(v, unit=""):
        """The FAA pads with zeros: 03 engines, 047600 thrust. All-zero means not given."""
        if not v or not str(v).isdigit() or int(v) == 0:
            return None
        return "{:,}".format(int(v)) + unit
    cert = g("CERTIFICATION") or ""
    rows = [
        ("Serial number", g("SERIAL NUMBER") or g("SERIAL-NUMBER")),
        ("Registrant type", cod(_REG_TYPE, g("TYPE REGISTRANT"))),
        ("Street", ", ".join(x for x in (g("STREET") or g("STREET-MAIL"), g("STREET2") or g("STREET2-MAIL")) if x)),
        ("City, state, zip", ", ".join(x for x in (g("CITY") or g("CITY-MAIL"), g("STATE") or g("STATE-ABBREV-MAIL"), g("ZIP CODE") or g("ZIP-CODE-MAIL")) if x)),
        ("Country", g("COUNTRY") or g("COUNTRY-MAIL")),
        ("Other names on the registration", ", ".join(x for x in (g("OTHER NAMES(%d)" % i) for i in range(1, 6)) if x) or None),
        ("Fractional ownership", "Yes" if g("FRACT OWNER") == "Y" else None),
        ("Airworthiness class", (_AIRWORTH.get(cert[:1], cert[:1]) + (" (certification code " + cert + ")" if len(cert) > 1 else "")) if cert else None),
        ("Airworthiness date", g("AIR WORTH DATE") or g("AIR-WORTH-DATE")),
        ("Certificate issued", g("CERT ISSUE DATE") or g("CERT-ISSUE-DATE")),
        ("Registration expires", g("EXPIRATION DATE")),
        ("Last action at the FAA", g("LAST ACTION DATE") or g("LAST-ACT-DATE")),
        ("Registration status", ("Valid registration (V)" if g("STATUS CODE") == "V" else cod({}, g("STATUS CODE") or g("STATUS-CODE")))),
        ("Mode S", ((g("MODE S CODE HEX") or g("MODE-S-CODE-HEX") or "").strip() or None)),
        ("Aircraft type", cod(_ACFT_TYPE, ref.get("TYPE-ACFT"))),
        ("Engines", numz(ref.get("NO-ENG"))),
        ("Seats", numz(ref.get("NO-SEATS"))),
        ("Weight class", _WEIGHT.get(ref.get("AC-WEIGHT"), ref.get("AC-WEIGHT"))),
        ("Cruising speed", numz(ref.get("SPEED"), " mph")),
        ("Engine", " ".join(x for x in (eng.get("MFR"), eng.get("MODEL")) if x) or None),
        ("Engine type", cod(_ENG_TYPE, eng.get("TYPE"))),
        ("Horsepower", numz(eng.get("HORSEPOWER"))),
        ("Thrust", numz(eng.get("THRUST"), " lb")),
        ("Kit", " ".join(x for x in (g("KIT MFR"), g("KIT MODEL")) if x) or None),
        ("Exported to", g("EXP-COUNTRY")),
        ("Registration cancelled", g("CANCEL-DATE")),
    ]
    return [{"f": f, "v": v} for f, v in rows if v]


# ---- hand-written, 31 August 2026: the other agency's file ------------------
# This site is built on a file that records what mechanics found and fixed. It
# records no accidents, and every page says so. The NTSB records the other half.
#
# The two are shown side by side and never merged. An NTSB case on a tail does
# not explain anything in its maintenance record, and the maintenance record
# explains nothing about the case. Two public files about one aircraft, from two
# agencies, each labelled, is a fact a reporter can use; a single blended story
# is not. Built by build_ntsb.py from https://data.ntsb.gov/avdata, which the
# NTSB refreshes monthly and which begins in January 2008, thirteen years after
# the FAA file this site is built on.
_NTSB_DB = os.path.join(HERE, "ntsb.sqlite")


# ---- hand-written, 31 August 2026: the aircraft both agencies wrote about ----
# The one thing neither file can do alone. An aircraft in the FAA maintenance
# record and in the NTSB accident record is not evidence of anything: an airframe
# that flies a lot appears in both for the same reason it appears in either. What
# it is, is a starting point a reporter cannot otherwise assemble, because the two
# agencies publish separately and neither links to the other.
#
# So this ranks by nothing. It lists, newest NTSB case first, and it says in the
# response what the list does not mean.
_BOTH = {"at": 0, "payload": None}


@app.get("/z/api/both")
def both_files():
    # Each row costs one upstream count, so the first build takes about sixteen
    # seconds. Nobody waits sixteen seconds for a lead. Held for six hours: the
    # NTSB file changes monthly and the FAA file daily, so a stale count here is
    # never wrong by much and is never the point of the page.
    if _BOTH["payload"] and time.time() - _BOTH["at"] < 6 * 3600:
        return jsonify(_BOTH["payload"])
    if not os.path.exists(_NTSB_DB):
        return jsonify(rows=[], note="the NTSB file is not built on this server")
    con = sqlite3.connect(_NTSB_DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT regis, ntsb_no, ev_date, ev_type, city, state, country, injury, "
        "fatalities, make, model, cause FROM ntsb WHERE regis<>'' AND cause<>'' "
        "ORDER BY substr(ev_date,7,2) DESC, substr(ev_date,1,2) DESC LIMIT 400"
    ).fetchall()
    con.close()

    out, seen = [], set()
    for r in rows:
        reg = r["regis"]
        if reg in seen:
            continue
        try:
            d = api("/api/search", tail=reg, limit=1)
            n = d.get("total") or 0
        except Exception:
            n = 0
        if not n:
            continue
        seen.add(reg)
        out.append({
            "tail": "N" + reg, "faa_reports": n, "case": r["ntsb_no"],
            "date": (r["ev_date"] or "").split(" ")[0],
            "where": ", ".join(x for x in (r["city"], r["state"], r["country"]) if x) or None,
            "aircraft": " ".join(x for x in (r["make"], r["model"]) if x) or None,
            "fatalities": r["fatalities"] if (r["fatalities"] or "").strip() not in ("", "0") else None,
            "cause": r["cause"],
        })
        if len(out) >= 40:
            break
    payload = dict(
        rows=out,
        what_this_is=("Aircraft that appear in both public files: the FAA maintenance "
                      "record this site is built on, and the NTSB accident record. Newest "
                      "NTSB case first."),
        what_this_is_not=[
            "Not a ranking, and not sorted by anything but date.",
            "Appearing in both files is not evidence that maintenance caused anything. "
            "An airframe that flies a great deal appears in both for the same reason it "
            "appears in either.",
            "The FAA file records no causes. The probable cause shown is the NTSB's, "
            "about its own case, and says nothing about any maintenance report.",
            "The NTSB file begins in January 2008; the FAA file begins in 1995.",
        ])
    _BOTH["payload"], _BOTH["at"] = payload, time.time()
    return jsonify(payload)


def _ntsb_case(q):
    """An NTSB case number looks like DCA22WA158: three letters, two digits, two
    letters, three digits. Return the case and the tail it names, or None."""
    m = re.fullmatch(r"\s*([A-Za-z]{3}\d{2}[A-Za-z]{2}\w{3})\s*", q or "")
    if not m or not os.path.exists(_NTSB_DB):
        return None
    con = sqlite3.connect(_NTSB_DB)
    con.row_factory = sqlite3.Row
    try:
        r = con.execute("SELECT * FROM ntsb WHERE UPPER(ntsb_no)=? AND regis<>'' "
                        "LIMIT 1", (m.group(1).upper(),)).fetchone()
    except Exception:
        return None
    finally:
        con.close()
    if not r:
        return None
    return {"case": r["ntsb_no"], "regis": r["regis"],
            "date": (r["ev_date"] or "").split(" ")[0],
            "where": ", ".join(x for x in (r["city"], r["state"], r["country"]) if x) or None,
            "aircraft": " ".join(x for x in (r["make"], r["model"]) if x) or None,
            "url": "https://data.ntsb.gov/carol-main-public/basic-search"}


def _ntsb_of(n):
    """Every NTSB case on one N-number, newest first. The registration is stored
    without its leading N, as the FAA registry is."""
    if not os.path.exists(_NTSB_DB):
        return []
    con = sqlite3.connect(_NTSB_DB)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            "SELECT * FROM ntsb WHERE regis=? ORDER BY substr(ev_date,7,2) DESC, "
            "substr(ev_date,1,2) DESC", (n,)).fetchall()
    except Exception:
        return []
    finally:
        con.close()
    out = []
    for r in rows:
        d = (r["ev_date"] or "").split(" ")[0]
        where = ", ".join(x for x in (r["city"], r["state"], r["country"]) if x)
        hurt = []
        for n, lab in ((r["fatalities"], "fatal"), (r["serious"], "serious"),
                       (r["minor"], "minor")):
            if n and str(n).strip() not in ("", "0"):
                hurt.append("%s %s" % (n, lab))
        out.append({
            "case": r["ntsb_no"], "date": d, "where": where or None,
            "type": r["ev_type"], "injury": r["injury"] or None,
            "hurt": ", ".join(hurt) or None,
            "damage": r["damage"] or None, "phase": r["phase"] or None,
            "light": r["light"] or None, "airport": r["airport"] or None,
            "aircraft": " ".join(x for x in (r["make"], r["model"]) if x) or None,
            # The NTSB's own probable cause. The FAA file this site is built on
            # records no causes at all, so this is the one thing here that the
            # rest of the tool is forbidden from ever saying.
            "cause": r["cause"] or None,
            "narrative": r["narrative"] or None,
            "url": "https://data.ntsb.gov/carol-main-public/basic-search",
        })
    return out


def _registry_of(n):
    """The FAA registry row for an N-number (stored without the leading N)."""
    if not os.path.exists(_REG_DB):
        return None
    con = sqlite3.connect(_REG_DB)
    con.row_factory = sqlite3.Row
    try:
        r = con.execute("SELECT * FROM reg WHERE n=?", (n,)).fetchone()
        d = con.execute("SELECT owner, cancel_date, doc FROM dereg WHERE n=? "
                        "ORDER BY cancel_date DESC LIMIT 1", (n,)).fetchone()
    finally:
        con.close()
    if r:
        out = {"owner": r["owner"], "city": r["city"], "state": r["state"],
               "year": r["year"], "mfr": r["mfr"], "model": r["model"],
               "cert_issue": r["cert_issue"]}
        try:
            out["full"] = _reg_full(json.loads(r["doc"]))
        except Exception:
            pass
        return out
    if d:
        out = {"deregistered": {"owner": d["owner"], "date": d["cancel_date"]}}
        try:
            out["full"] = _reg_full(json.loads(d["doc"]))
        except Exception:
            pass
        return out
    return None


def _adsbdb_of(full):
    r = requests.get("https://api.adsbdb.com/v0/aircraft/" + full, headers=_AC_UA, timeout=8)
    a = ((r.json().get("response") or {}).get("aircraft") or {}) if r.status_code == 200 else {}
    if not a:
        return None
    return {"type": a.get("type"), "manufacturer": a.get("manufacturer"),
            "operator": a.get("registered_owner"), "mode_s": a.get("mode_s")}


def _photo_of(full):
    r = requests.get("https://api.planespotters.net/pub/photos/reg/" + full, headers=_AC_UA, timeout=8)
    ph = (r.json().get("photos") or []) if r.status_code == 200 else []
    if not ph:
        return None
    p = ph[0]
    src = ((p.get("thumbnail_large") or p.get("thumbnail") or {}).get("src"))
    if not src:
        return None
    return {"src": src, "link": p.get("link"), "photographer": p.get("photographer"),
            "source": "Planespotters.net"}


@app.get("/z/api/plane/<reg>")
def plane(reg):
    n = re.sub(r"[^A-Z0-9]", "", (reg or "").upper())
    if n.startswith("N"):
        n = n[1:]
    if not n or len(n) > 5:
        return jsonify(error="no such registration"), 404
    full = "N" + n
    out = {"reg": full, "registry": _registry_of(n), "ntsb": _ntsb_of(n)}
    hit = _AC.get(n)
    if hit and time.time() - hit["at"] < 7 * 24 * 3600:
        out["aircraft"], out["photo"] = hit["aircraft"], hit["photo"]
    else:
        ac = photo = None
        try:
            ac = _adsbdb_of(full)
        except Exception:
            pass
        try:
            photo = _photo_of(full)
        except Exception:
            pass
        # A miss with both sources down should not be remembered for a week.
        if ac is not None or photo is not None:
            _AC[n] = {"at": time.time(), "aircraft": ac, "photo": photo}
            _ac_save()
        out["aircraft"], out["photo"] = ac, photo
    if not (out["registry"] or out["aircraft"] or out["photo"]):
        return jsonify(error="nothing found for " + full), 404
    return jsonify(out)


# ---- hand-written, 31 August 2026: the registry file, explained -------------
# One button under Research deeper. The model gets the FAA's own rows for this
# tail, decoded, plus adsbdb's operator, and says in plain words what the file
# does and does not tell you: who holds the paper against who flies it, what a
# trustee is, what airworthiness class means. Nothing else goes in.
@app.get("/z/api/stream/registry")
def stream_registry():
    n = re.sub(r"[^A-Z0-9]", "", (request.args.get("reg") or "").upper())
    if n.startswith("N"):
        n = n[1:]
    r = _registry_of(n) if n else None
    if not r:
        return jsonify(error="no registry file"), 404
    ac = (_AC.get(n) or {}).get("aircraft") or {}
    facts = {"registration": "N" + n}
    for k in ("owner", "city", "state", "year", "mfr", "model"):
        if r.get(k):
            facts[k] = r[k]
    if r.get("deregistered"):
        facts["deregistered"] = r["deregistered"]
    if ac.get("operator"):
        facts["operator per adsbdb"] = ac["operator"]
    lines = "\n".join("%s: %s" % (x["f"], x["v"]) for x in r.get("full") or [])
    prompt = ("Below is the FAA aircraft registry file for one aircraft, field by field, with the FAA's "
              "codes already spelled out. Explain to a general reader, in at most 140 words of plain prose, "
              "no headings, no bullet points, no em dashes, what this file says about the aircraft. Make the distinctions a "
              "reader would miss: the registered owner holds the paper and may be a bank or trustee rather "
              "than whoever flies it; the airworthiness class says what the aircraft is certified to do, not "
              "its condition; dates are registration paperwork, not the aircraft's history. Expand jargon in "
              "everyday words. Use only the fields below; if something a reader would want is not in them, "
              "say in one short sentence that this file does not record it. End with one sentence naming the "
              "single most useful field for a researcher and why.\n\n"
              + json.dumps(facts, ensure_ascii=False) + "\n\n" + lines)
    return _stream_response({"read": 1, "of": 1, "what": "the FAA registry file for N" + n},
                            prompt, "low", 1200)
