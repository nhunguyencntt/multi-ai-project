#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://127.0.0.1:3000/}"
CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$URL")"
if [[ "$CODE" =~ ^2|^3 ]]; then echo "OK $CODE $URL"; exit 0; fi
echo "FAIL $CODE $URL" >&2; exit 1
