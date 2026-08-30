#!/usr/bin/env python3
"""Voice for the v2 film. One mp3 per block, same speaker and direction as v1
(aviation/voice.py): gpt-4o-mini-tts, voice ash, normalised to -21.5 LUFS."""
import json, os, ssl, subprocess, sys, urllib.request, certifi
CTX = ssl.create_default_context(cafile=certifi.where())
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = [l.split('=', 1)[1].strip() for l in open(os.path.expanduser('~/.env.digging')) if l.startswith('OPENAI_API_KEY=')][0]
MODEL = 'gpt-4o-mini-tts-2025-12-15'; VOICE = 'ash'
SPEAKER = ("SPEAKER, IDENTICAL IN EVERY LINE: one man in his late forties, light British RP, mid-range voice, "
           "close to the microphone, even and level, no breathiness, no whisper, no character acting. Keep the "
           "timbre, the volume and the distance to the microphone exactly the same throughout. Do not soften, "
           "do not mutter, do not brighten. ")
BASE = (SPEAKER + "Delivery: documentary narration, first person, in the manner of a written essay read aloud. "
        "Dry and unhurried, but NOT monotone. The pitch falls at every full stop and lifts slightly at every "
        "comma. Vary the PACE and the PAUSES, not the voice. Breathe where a reader would breathe. No warmth, no sell.")
LINES = {
 "2a": "I was sitting watching Freefall on Netflix and saw people painstakingly trying to find information about defects on the Dreamliner and other Boeings. They went to a government website that lets you look up defects. I saw the URL, went there, and was furious: the database was completely unreadable.",
 "2b": "The reports are so bureaucratic that almost everything has been replaced by codes, and the codes conflict. A report will never tell you there was an issue with the landing gear. It will say ZONE 700.",
 "2c": "An emergency landing? That is just an A. But the same letter elsewhere on the form means the report came from an airline. For researchers, the database is a nightmare. I saw the father of one of the victims searching it, trying to make sense of it.",
 "2d": "It was something public, but the government presented it as ingredients on a table rather than a meal. Over 1.7 million records were there and none of it was accessible. When z.ai came with a hackathon I thought: I want to make this completely transparent, to help families and researchers.",
 "3a": "This is what I built, with GLM-5.3-Flash reading the file live. One screen. Where on the aircraft, when, who, and what it forced the crew to do. A search line that takes a question, a word, a tail number, an airline. A period line. The page opens on the last 90 days.",
 "3b": "Click anything and it becomes the selection. The thing you chose is the headline. Under it, the count, then the reports themselves.",
 "4a": "Every report carries a mechanic's write-up in trade shorthand. The model reads the whole record, the codes decoded by the FAA's own tables, and tells it in plain words. This one was read the moment it arrived; it is on screen in a second.",
 "4b": "Open any report and ask it five things. What actually happened. Was anyone in danger. What did the mechanics do. Does it say why. And what should we check next: the answer comes back as searches you can click.",
 "4c": "Over any selection, the model reads up to three hundred write-ups and says what keeps coming back that no code was designed to hold. Every quote it makes is checked, by the server, against the record it cites. A sentence whose quote is not in the record is deleted before you see it, and the page tells you how many. Click a sentence and it shows you the records it stands on.",
 "4d": "Then it suggests three narrower slices, with the real count of each. The model proposes; the file counts.",
 "4e": "Ask it what the form cannot answer, and it says so first: this file records what mechanics found and fixed, not accidents, not danger. Then it gives you the closest honest thing, most written up, never most dangerous.",
 "4f": "Pick one airframe and it tells its story from the first report to the last. Where the file goes quiet, it says the file went quiet, and it is forbidden to say why anything happened, because the file does not record causes.",
 "5a": "The aircraft from the documentary is in the file. Two reports on N704AL. The second is the door plug, in the mechanic's own words, filed the day it happened. The first was filed five days earlier: a door hard to open, aircraft grounded.",
 "5b": "The file has no context, so for this one page the model searches the web first and may only use what it found, one named source per sentence. Labelled: the web, not the file.",
 "6":  "One point seven million reports, public since 1995, readable now.",
}
SAY = {"ZONE 700": "Zone seven hundred", "N704AL": "N seven-oh-four A L", "GLM-5.3-Flash": "G L M five point three Flash",
       "z.ai": "Z dot A I", "1995": "nineteen ninety-five", "URL": "U R L", "FAA's": "F A A's", "NTSB": "N T S B"}
def tts(text, path):
    for k, v in SAY.items(): text = text.replace(k, v)
    body = json.dumps({'model': MODEL, 'voice': VOICE, 'input': text, 'instructions': BASE, 'response_format': 'mp3'}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/audio/speech', data=body,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    raw = urllib.request.urlopen(req, timeout=120, context=CTX).read()
    open(path + '.raw.mp3', 'wb').write(raw)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', path + '.raw.mp3', '-af', 'loudnorm=I=-21.5:TP=-2:LRA=7,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15',
                    '-ar', '48000', '-ac', '2', path], check=True)
    os.remove(path + '.raw.mp3')
def dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip())
if __name__ == '__main__':
    only = sys.argv[1:]
    out = {}
    for k, t in LINES.items():
        p = os.path.join(HERE, 'voice', k + '.wav')
        if (only and k not in only) or (os.path.exists(p) and not only):
            pass
        else:
            tts(t, p); print(k, 'done')
        if os.path.exists(p): out[k] = dur(p)
    json.dump(out, open(os.path.join(HERE, 'voice', 'durations.json'), 'w'), indent=1)
    print(out)
