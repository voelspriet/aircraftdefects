#!/usr/bin/env python3
"""Sentence-level voice pieces, so each sentence can start on the screen action it describes."""
import json, os
from voice import tts, dur, HERE
PARTS = {
 "4b_1": "Open any report and ask it five things.",
 "4b_2": "What actually happened. Was anyone in danger. What did the mechanics do. Does it say why.",
 "4b_3": "And what should we check next: the answer comes back as searches you can click.",
 "4c_1": "Over any selection, the model reads up to three hundred write-ups and says what keeps coming back that no code was designed to hold.",
 "4c_2": "Every quote it makes is checked, by the server, against the record it cites. A sentence whose quote is not in the record is deleted before you see it, and the page tells you how many.",
 "4c_3": "Click a sentence and it shows you the records it stands on.",
 "4e_1": "Ask it what the form cannot answer, and it says so first: this file records what mechanics found and fixed, not accidents, not danger.",
 "4e_2": "Then it gives you the closest honest thing, most written up, never most dangerous.",
 "4f_1": "Pick one airframe and it tells its story from the first report to the last.",
 "4f_2": "Where the file goes quiet, it says the file went quiet, and it is forbidden to say why anything happened, because the file does not record causes.",
 "5a_1": "The aircraft from the documentary is in the file. Two reports on N704AL.",
 "5a_2": "The second is the door plug, in the mechanic's own words, filed the day it happened.",
 "5a_3": "The first was filed five days earlier: a door hard to open, aircraft grounded.",
 "3a_1": "This is what I built, with GLM-5.3-Flash reading the file live. One screen. Where on the aircraft, when, who, and what it forced the crew to do.",
 "3a_2": "A search line that takes a question, a word, a tail number, an airline. A period line. The page opens on the last 90 days.",
}
if __name__ == '__main__':
    out = {}
    for k, t in PARTS.items():
        p = os.path.join(HERE, 'voice', k + '.wav')
        if not os.path.exists(p): tts(t, p); print(k, 'done')
        out[k] = dur(p)
    d = json.load(open(os.path.join(HERE, 'voice', 'durations.json'))); d.update(out)
    json.dump(d, open(os.path.join(HERE, 'voice', 'durations.json'), 'w'), indent=1); print(out)
