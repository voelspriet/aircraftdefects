#!/bin/bash
# Hand-written, 31 August 2026. Monthly refresh of the NTSB accident file.
#
# The NTSB republishes its whole aviation database once a month. build_ntsb.py
# downloads it, rebuilds the sqlite beside the live one and swaps at the end, so
# the service never reads a half-written file.
#
# Two things the script cannot do for itself and this wrapper does:
#   the service caches /z/api/both for six hours, and that cache is in memory,
#   so a rebuild is invisible until the workers are restarted;
#   and a run that fails should leave yesterday's database alone and say so,
#   rather than half-replacing it.
set -u
LOG=/var/log/ntsb_refresh.log
cd /opt/sdrz || exit 1

echo "=== $(date -u '+%Y-%m-%d %H:%M UTC') ===" >> "$LOG"
if /usr/bin/python3 /opt/sdrz/build_ntsb.py >> "$LOG" 2>&1; then
    /usr/bin/systemctl restart sdrz
    sleep 5
    n=$(/usr/bin/curl -s --max-time 60 https://aircraftdefects.com/z/api/plane/N803NW \
        | /usr/bin/python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("ntsb") or []))' 2>/dev/null)
    echo "restarted; N803NW returns ${n:-?} NTSB cases" >> "$LOG"
else
    echo "FAILED, kept the previous database" >> "$LOG"
fi
