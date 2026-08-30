"""One sentence, one thing on screen. Shared by capture3.py (records the beats in
real time, camera on the element named) and build3.py (places each sentence at
the moment its beat is framed)."""
BEATS = {
 'zones': [
  ('bz_0', "Where does the trouble sit? The file says, when a mechanic ticked a zone."),
  ('bz_1', "Eighty-four thousand reports on the upper fuselage: the cabin, the floor, the seat tracks."),
  ('bz_2', "Sixty-one thousand below the floor, in the belly and the holds."),
  ('bz_3', "Twenty-three thousand on the doors."),
  ('bz_4', "Nine thousand on the tail."),
  ('bz_5', "Eleven thousand on the left wing alone."),
 ],
 's3': [
  ('b3_1', "This is what I built, with GLM-5.3-Flash reading the file live. One screen."),
  ('b3_2', "Where on the aircraft, when, who, and what it forced the crew to do."),
  ('b3_3', "A search line that takes a question, a word, a tail number, an airline."),
  ('b3_4', "A period line."),
  ('b3_5', "The page opens on the last 90 days."),
  ('b3_6', "Click anything and it becomes the selection."),
  ('b3_7', "The thing you chose is the headline."),
  ('b3_8', "Under it, the count, then the reports themselves."),
  ('b3_9', "And sixteen leads under the fold. Each one becomes the main screen when you click it."),
 ],
 's4a': [
  ('b4a_1', "Every report carries a mechanic's write-up in trade shorthand."),
  ('b4a_2', "The model reads the whole record, the codes decoded by the FAA's own tables, and tells it in plain words."),
  ('b4a_3', "This one was read the moment it arrived; it is on screen in a second."),
 ],
 's4b': [
  ('b4b_1', "Open any report and ask it five things."),
  ('b4b_2', "What actually happened."),
  ('b4b_3', "Was anyone in danger. What did the mechanics do. Does it say why."),
  ('b4b_4', "And what should we check next: the answer comes back as searches you can click."),
 ],
 's4c': [
  ('b4c_1', "Over any selection, the model reads up to three hundred write-ups,"),
  ('b4c_2', "and says what keeps coming back that no code was designed to hold."),
  ('b4c_3', "Every quote it makes is checked, by the server, against the record it cites."),
  ('b4c_4', "A sentence whose quote is not in the record is deleted before you see it, and the page tells you how many."),
  ('b4c_5', "Click a sentence and it shows you the records it stands on."),
  ('b4d_1', "Then it suggests three narrower slices, with the real count of each. The model proposes; the file counts."),
 ],
 's4e': [
  ('b4e_1', "Ask it what the form cannot answer,"),
  ('b4e_2', "and it says so first: this file records what mechanics found and fixed, not accidents, not danger."),
  ('b4e_3', "Then it gives you the closest honest thing, most written up, never most dangerous."),
 ],
 's4f': [
  ('b4f_1', "Pick one airframe and it tells its story from the first report to the last."),
  ('b4f_2', "Where the file goes quiet, it says the file went quiet,"),
  ('b4f_3', "and it is forbidden to say why anything happened, because the file does not record causes."),
 ],
 's5': [
  ('b5_1', "The aircraft from the documentary is in the file."),
  ('b5_2', "Two reports on N704AL."),
  ('b5_3', "The second is the door plug, in the mechanic's own words, filed the day it happened."),
  ('b5_4', "The first was filed five days earlier: a door hard to open, aircraft grounded."),
  ('b5_5', "The file has no context, so for this one page the model searches the web first and may only use what it found,"),
  ('b5_6', "one named source per sentence. Labelled: the web, not the file."),
 ],
 's6': [
  ('b6_1', "One point seven million reports, public since 1995, readable now."),
 ],
}
ALL = {k: t for shot in BEATS.values() for k, t in shot}
