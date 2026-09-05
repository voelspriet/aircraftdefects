# todoaircraft.md

## Investigation reports next to SDRs (idea from AeroInside SafetyScan Pro, 3 Sep 2026)

Reference: https://www.aeroinside.com/safety-scan/pro

What SafetyScan Pro does: aggregates published accident and incident investigation
reports from national boards (NTSB, AAIB, TSB, ATSB, BFU, BEA, SUST, SHK, SHT, TAIC),
saved searches, follow open investigations, email and intranet feeds. Monitoring product
for operators and MROs. No public pricing, demo on request.

Our angle: their unit is the investigation report (months or years after the event).
Our unit is the Service Difficulty Report (days after the event). Join the two on
registration + date. "This aircraft had N defect reports in the two years before the
accident" is a story nobody else can produce.

### Source check (curl from the Mac, 3 Sep 2026)

| Board | Result |
|---|---|
| AAIB (UK) | https://www.gov.uk/aaib-reports.atom works, titles carry type + registration |
| NTSB (US) | https://data.ntsb.gov/avdata/ works: avall.zip full db + monthly update zips |
| TSB (Canada) | 502 on https://www.tsb.gc.ca/eng/stats/aviation/data-6.html, retry from server |
| ATSB (Australia) | timeout, probably Cloudflare, needs browser-style fetch |
| NTSB CAROL API | https://data.ntsb.gov/carol-main-public/api/Query/Main exists, POST-only, not probed |

European boards (BFU, BEA, SUST, SHK, SHT): HTML lists + PDFs, scrape jobs like the
FAA registry build.

### Build order

1. Ingest NTSB avall.zip + AAIB atom feed into a second DuckDB table keyed on
   registration and date, next to /opt/sdr/sdr_full.duckdb on Hetzner.
2. "Investigations" block in the aircraft panel on the case sheet: reports on that
   tail number with link to the source PDF.
3. Reverse link: on an investigation, show the SDR timeline for that registration
   before the event date. This is the differentiator.
4. Later: saved searches + daily email digest. Mail must go out from
   @imagewhisperer.org (DMARC), not digitaldigging.org.
5. Weekly cron for the ingest alongside the FAA registry refresh.

Skip: intranet embed feeds, per-team logins (enterprise packaging, not needed for a
journalism tool).

Open: which boards to start with. Suggest NTSB + AAIB first.
