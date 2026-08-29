**CSS — one block, replacing the type block:**

```css
/* One decision for the sentence: both classes it carries get the same face,
   so neither block can out-vote the other. */
.stand,
.rv-sentence {
  font-family: "Instrument Serif", Georgia, "Iowan Old Style", "Times New Roman", serif;
  font-size: 34px;
  color: rgb(29, 29, 31);
}

/* The count: monospace inside the serif sentence, rust — a measurement,
   not prose. */
.rv-count {
  font-family: "IBM Plex Mono", monospace;
  font-size: 31.28px;
  font-weight: 500;
  color: rgb(184, 67, 31);
}

.rv-aside {
  font-family: "Instrument Serif", Georgia, serif;
  font-size: 21.08px;
  color: rgb(117, 111, 105);
}

/* The aim line: rust, not purple. It names what is selected. */
.rv-aim {
  font-family: "IBM Plex Mono", monospace;
  font-size: 13px;
  color: rgb(184, 67, 31);
}

.rv-hand {
  font-family: Archivo, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: rgb(29, 29, 31);
}

.rv-margin {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11.5px;
  color: rgb(95, 88, 79);
}

/* The reading block alone stays Georgia — it is the one place the
   fallback face is the chosen face. */
.rv-reading {
  font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  font-size: 15px;
  color: rgb(29, 29, 31);
}

.rv-ladder-row {
  font-family: system-ui, sans-serif;
  font-size: 11.5px;
  color: rgb(29, 29, 31);
}
```

**Font link — add the missing family to the existing stylesheet request:**

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap">
```

**Ladder label — strip the menu label's trailing designator before appending the row's own:**

```js
function ladderLabel(menuLabel, take) {
  const bare = menuLabel.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return `${bare} (${take})`;
}
// row.textContent = ladderLabel(menuLabel, row.dataset.take);
```

What changed:

- **Instrument Serif is now actually requested.** The existing font link only fetched Archivo and IBM Plex Mono; the family named in the CSS was never downloaded, so everything fell to Georgia. One link, all three families, added to the existing request rather than a second round-trip.
- **The fight is over.** `.stand` and `.rv-sentence` are now the same selector list in one rule with one decision — Instrument Serif 34px. There is no Georgia rule left on the sentence to win.
- **The count reads as a measurement**: IBM Plex Mono at weight 500, rust, breaking out of the surrounding serif on purpose.
- **The aim line is rust.** rgb(93,74,114) was a colour nothing else on the page used; the line that says what you are pointing at now uses the selection colour, like the count.
- **Georgia survives in exactly one place** — the reading block — where it is the chosen face, not a fallback.
- **The ladder no longer doubles the designator.** The menu label ends in `(SWAA)`, and the row appended `(SWAA)` again. The label's trailing parenthetical is stripped, then the designator is added once from the row's own `data-take`.

No wording, no figures, no layout touched.