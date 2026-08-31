#!/bin/bash
# Every harness, one command. Run after every splice, before every claim.
#
# The rule this exists to enforce: a surface is finished when it survives the
# count, says the right thing, looks like the same tool, and tells the truth.
# Four different questions, four different harnesses, and the fourth was added
# after three false statements reached the live page while the first three were
# all green.
set -u
cd "$(dirname "$0")"
echo "=== 1. onderdelen: staat het er? ==="        ; python3 parity_diff.py    2>&1 | tail -20
echo; echo "=== 2. opties: is het te bedienen? ===" ; python3 parity_options.py 2>&1 | tail -14
echo; echo "=== 3. panelen: zeggen ze iets? ==="    ; python3 parity_panels.py  2>&1 | tail -14
echo; echo "=== 4. beweringen: is het waar? ==="    ; python3 parity_claims.py  2>&1 | tail -20
echo; echo "=== 5. layout: beweegt er iets? ==="    ; python3 parity_rails.py   2>&1 | tail -14
echo; echo "=== 6. presentatie: werkt het? ==="     ; python3 verify_presentation.py 2>&1 | tail -6
# The seventh asks the question the other six cannot: is what the page says true
# of the file it is built on. Its own self-test runs first, because a gate that
# has never been watched fail is a decoration.
echo; echo "=== 7. integriteit: klopt het? ==="     ; python3 verify_integrity.py --selftest 2>&1 | tail -4
echo                                                ; python3 verify_integrity.py --n 60 2>&1 | tail -16
