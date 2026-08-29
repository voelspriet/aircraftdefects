# The API, as it actually answers

Written by reading live responses, not by inference. Four separate faults have
come from guessing a field name or a container shape, none of which threw and
none of which logged anything: a zone lookup keyed on `200` where the data says
`ZONE 200`; a facet read under `operator` where the endpoint says `operators`;
a glossary read whole where its tables are nested under `codes`; and the same
glossary's `terms` read as an array where it is a dictionary.

A field name is a fact about the data. A specification written from behaviour
will not contain one unless someone puts it there. This is that file.

## `/api/hero`

the instrument: months, zones, operators, airframes, crew, span, lag

```
{aircraft: int, corpus: int, crew: [10 x {3 keys: code, label, n…}], crew_reports: int, lag: {file_to: "2026-08-26", p95_days: int, settled_before: "2023-05-13"}, lines: [24 x "POST-FLT INSP, (1EA) OVRHD…"], months: [380 x {3 keys: all, m, n…}], no_location: int, operator_rows: [8 x {2 keys: n, o…}], …13 more}
```

## `/api/facets`

the menus. NOTE the plural keys against the singular control ids

```
{ata: [48 x {2 keys: code, label…}], conditions: [3130 x "CORRODED"], counts: {corrosion: {9 keys: 0, 1, 2…}, crew: {18 keys:  , -, A…}, discovered: {13 keys: 9, B, C…}, nature: {24 keys:  , A, B…}, stage: {17 keys: AA, AB, AG…}, zone: {10 keys: ZONE 00, ZONE 100, ZONE 200…}}, makes: [247 x "BOEING"], operators: [3946 x "SWAA"], opgap: {covered: int, covered_pct: float, designators: int, no_operator: int, no_operator_pct: float, resolved: int, sentence: "98,381 reports, 5.6% of th…", total: int}, range: {from: "1995-01-01", to: "2026-08-26", total: int}, stages: [17 x "IN"]}
```

## `/api/glossary`

three parts: codes (one table per field), terms (the trade's shorthand), ata

```
{ata: {11: "Placards and markings", 12: "Servicing", 20: "Standard practices", 21: "Air conditioning", 22: "Auto flight", 23: "Communications", 24: "Electrical power", 25: "Equipment and furnishings", 26: "Fire protection", …39 more}, codes: {_source: {5 keys: edition, jasc_titles, labels…}, corrosion: {3 keys: 1, 2, 3…}, corrosion_source: "FAA Order 8300.12 and EASA…", discovered: {14 keys: 0, 9, B…}, district: {323 keys: AC70, AC74, AC75…}, district_source: "FAA district office codes.…", jasc: {549 keys: 1100, 1210, 1220…}, nature: {24 keys: 0, A, B…}, operator: {1213 keys: 11SA, 141A, 15JA…}, …10 more}, terms: {amm: [2 x "AMM"], apu: [2 x "APU"], bs: [2 x "BS"], c/a: [2 x "C/A"], codes: [2 x "The single-letter codes"], control_number: [2 x "Control number"], corrosion: [2 x "Corrosion level"], crew_a: [2 x "Unscheduled landing"], crew_e: [2 x "Engine shut down"], …21 more}}
```

## `/api/search`

the rows

```
{ata: {11: "Placards and markings", 12: "Servicing", 20: "Standard practices", 21: "Air conditioning", 22: "Auto flight", 23: "Communications", 24: "Electrical power", 25: "Equipment and furnishings", 26: "Fire protection", …39 more}, offset: int, rows: [1 x {37 keys: AircraftMake, AircraftModel, AircraftTotalCycles…}], shown: int, total: int, undated: int}
```

## `/api/case/FDEA202608261230`

one report, 92 fields, decoded twins and the citation

```
{AircraftMake: "BOEING", AircraftModel: "777FHT", AircraftSerialNumber: "38969", AircraftTotalCycles: "9113", AircraftTotalTime: "59560", ButtLineFrom: NoneType, ButtLineFromSide: NoneType, ButtlineTo: NoneType, ButtlineToSide: NoneType, …83 more}
```

## The four traps, spelled out

```
zones[].code        'ZONE 200'      never '200'. The prefix is in the data.
facets.operators    ['SWAA', …]     plural key, plain strings, no counts, in
                                    report order. The control id is #operator.
facets.makes        ['BOEING', …]   same. conditions and stages too.
facets.counts       {field:{code:n}} counts live here, and only for coded fields.
glossary.codes      {part_location:{'ZONE 200':{label,faa}}, nature:{…}, …}
glossary.terms      {amm:['AMM','Aircraft Maintenance Manual…'], …}  a dict,
                                    not a list, and the value is a two-item array.
case fields         OperatorDesignator, AircraftMake, AircraftTotalTime,
                    AircraftTotalCycles, _submitter, _aircraft_make, _jasc,
                    _context, _cite. Not OperatorCode, Make, HoursOnAircraft.
```

## Two rules that follow from the shapes

**Where a list arrives without counts, its order is the only ordering it has.**
Sorting it by a count that is always zero throws that away, and printing
"(no reports)" beside an airline with tens of thousands is worse than printing
nothing. Do not hold such a list in an object either: JavaScript enumerates
integer-like keys first, so a part condition filed as `19681` jumps to the head
of a 3,131-entry menu.

**A code table is not always a list of valid values.** `codes.corrosion`,
`codes.nature`, `codes.precaution`, `codes.discovered`, `codes.stage` and
`codes.part_location` are closed enumerations, and a value outside them does not
belong in a picker. `codes.operator` is a name cross-reference: only 1,214 of
the 3,947 designators that occur are in it. Filtering a menu against it drops two
thirds of the airlines in the file.