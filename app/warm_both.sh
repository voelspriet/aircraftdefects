#!/bin/bash
# Rebuilds the both-files answer before its six-hour cache expires, so a reader
# never pays for the build. One call: the endpoint writes the file itself.
/usr/bin/curl -s -o /dev/null --max-time 120 https://aircraftdefects.com/z/api/both?rebuild=1
