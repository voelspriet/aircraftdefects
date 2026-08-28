#!/usr/bin/env python3
"""Prewash session with GLM-5.3-Flash. Every turn recorded verbatim.

The method, which is the point of this file:

  1. The human types a SHORT, targeted line asking for a prompt. Not a plan, not
     an answer, and never the long prompt itself.
  2. The model writes the prompt.
  3. The human reads it, then says: execute prompt.
  4. The human then makes it mark which sentences are stated by the source and
     which it inferred.

Writing the long prompt yourself defeats it. A detailed prompt carries your
assumptions in its adjectives, and the model answers the question you framed
rather than the one the material supports. Handing it a short line and the raw
material makes it frame the question, and the framing becomes an artefact you
can read and disagree with.

The source material below is deliberately flat: counts, schema, constraints. No
adjectives, no ranking, no hint about what would be interesting.
"""
import json, os, pathlib, sys, time
import requests

HERE = pathlib.Path(__file__).parent
for line in (HERE.parent / ".env").read_text().splitlines():
    if line.startswith("ZAI_API_KEY="):
        os.environ["ZAI_API_KEY"] = line.split("=", 1)[1].strip()

URL = "https://api.z.ai/api/paas/v4/chat/completions"
MODEL = "glm-5.3-flash"

SOURCE = """
SOURCE MATERIAL

Dataset: FAA Service Difficulty Reports, published by the FAA, 1995 to present.
Held at aircraftdefects.com. 1,757,828 records. 54,634 aircraft by tail number.
3,945 operator designators, of which 1,213 resolve to a name from FAA lists.

A record is filed by a mechanic or operator when a component fails, malfunctions
or is found defective.

Columns, 76 in total. Those with values in most records:
  DifficultyDate, SubmissionDate, OperatorDesignator, RegistryNNumber,
  AircraftMake, AircraftModel, AircraftSerialNumber, AircraftTotalTime,
  AircraftTotalCycles, EngineMake, EngineModel, JASCCode, PartName, PartNumber,
  PartCondition, PartLocation, NatureOfConditionA, NatureOfConditionB,
  NatureOfConditionC, PrecautionaryProcedureA, PrecautionaryProcedureB,
  PrecautionaryProcedureC, PrecautionaryProcedureD, StageOfOperationCode,
  HowDiscoveredCode, ReceivingRegionCode, ReceivingDistrictOffice,
  CorrosionLevel, CrackLength, NumberOfCracks, FuselageStationFrom,
  FuselageStationTo, WingStationFrom, WingStationTo, Discrepancy.

Discrepancy is free text written by the person filing. Present in most records.
Three verbatim examples:
  RH MAIN FLAP CARRIAGE NR 2 HAS PITTING IN BOLT HOLE FOR O/B UPPER RUB PAD
  THE PAWL BEHIND THE CREW ENTRY DOOR EXTERNAL HANDLE IS WORN
  CABIN SEAT TRACK FOUND CORROSION AT FR73-FR77

Coded fields resolve against FAA lookup tables published by the FAA.
Codes not present in those tables are displayed as the code.

Counts of the coded crew action field, whole dataset:
  unscheduled landing 112,189; aborted take-off 20,438; engine shut down in
  flight 14,703; emergency descent 8,620; aborted approach 3,902; fire
  extinguisher fired 2,747; fuel dumped 1,531; oxygen masks dropped 1,168;
  cabin lost pressure 326; autorotation 130.

Location: 196,663 records carry a numbered zone. 1,496,585 state a location in
the free text only. 64,580 state no location.

Existing interface: filtered search over the coded fields and full-text search
over Discrepancy. Filters: q, operator, make, model, tail, part, condition,
stage, discovered, nature, crew, jasc, ata, zone, corrosion, cracked, minhours,
from, to. JSON API, no authentication.

The dataset does not contain fleet size or flying hours.
The dataset does not contain the cause of a defect.
The dataset does not record accidents.

Intended users: investigative journalists; researchers and safety analysts;
relatives of people who died in aviation accidents.

Model available to build on: GLM-5.3-Flash. Vendor documentation states: input
of video, image, text and file; text output; 1,000,000 token context window;
128,000 token maximum output; 320B parameters with 18B active; sparse and linear
attention reducing attention computation 3.01x and KV cache 4.44x versus
GLM-5.3; reasoning always enabled at low, high or max; function calling;
structured output to JSON schema; context caching; streaming and tool streaming.
"""

# The Prewash line. Short, targeted, asks for a prompt and nothing else.
PREWASH = "Give me a prompt to work out what to build on this dataset for these users."

# Between the model writing the prompt and running it, the human answers the one
# question the model refused to answer for itself. See docs/DECISIONS.md.
DECISION = (
    "Before you execute it, one decision is made for you, because it is not yours: "
    "relatives of victims MAY look up a specific tail number and see that airframe's "
    "history. It is public record, and a tool that withholds public records from the "
    "people most affected has appointed itself a gatekeeper. So do not spend Phase 1 "
    "on whether to show it. Spend it on how it is framed, given that a write-up is a "
    "defect that was caught, that the dataset records no accidents and no causes, and "
    "that absence of reports is not evidence of a safe aircraft."
)

EXECUTE = DECISION + "\n\nexecute prompt"

GROUND = ("Take your previous answer and mark each sentence as either stated in the source "
          "material or inferred by you. For anything inferred, say it is not established by "
          "the source.")


def turn(name, messages, effort="max", max_tokens=16000):
    body = {"model": MODEL, "temperature": 1, "top_p": 0.95,
            "thinking": {"type": "enabled", "clear_thinking": False},
            "reasoning_effort": effort, "max_tokens": max_tokens,
            "messages": messages}
    t0 = time.time()
    r = requests.post(URL, json=body, timeout=1800, headers={
        "Authorization": "Bearer " + os.environ["ZAI_API_KEY"],
        "Content-Type": "application/json"})
    took = time.time() - t0
    if r.status_code != 200:
        print("  %s FAILED %s %s" % (name, r.status_code, r.text[:400]))
        return None
    m = r.json()["choices"][0]["message"]
    text = m.get("content") or ""
    (HERE / (name + ".md")).write_text(text)
    if m.get("reasoning_content"):
        (HERE / (name + ".reasoning.md")).write_text(m["reasoning_content"])
    (HERE / (name + ".meta.json")).write_text(json.dumps({
        "model": MODEL, "effort": effort, "seconds": round(took, 1),
        "usage": r.json().get("usage", {}),
        "sent": messages[-1]["content"][:2000]}, indent=2))
    print("  %-26s %6.1fs  %6d chars" % (name, took, len(text)))
    return text


if __name__ == "__main__":
    msgs = [{"role": "user", "content": SOURCE + "\n\n" + PREWASH}]

    print("STEP 1  prewash: the model writes the prompt")
    written = turn("01-prompt-the-model-wrote", msgs)
    if not written:
        sys.exit(1)
    msgs.append({"role": "assistant", "content": written})

    print("STEP 2  execute prompt")
    msgs.append({"role": "user", "content": EXECUTE})
    answer = turn("02-answer", msgs)
    if not answer:
        sys.exit(1)
    msgs.append({"role": "assistant", "content": answer})

    print("STEP 3  grounding check: stated vs inferred")
    msgs.append({"role": "user", "content": GROUND})
    turn("03-stated-vs-inferred", msgs)

    print("\nAll turns written to design/")
