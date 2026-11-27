#!/usr/bin/env bash
# Usage: scripts/tdd-step.sh <feature> <red|green|refactor> "<commit message>" <test file>
# Runs the test file for real, saves the raw output, then commits. Failures are recorded, not hidden.
set -u
feature="$1"; stage="$2"; msg="$3"; testfile="$4"
root="$(cd "$(dirname "$0")/.." && pwd)"
log="$root/evidence/tdd/${feature}-${stage}.log"
( cd "$root/backend" && { echo "# $(date -u +%FT%TZ) feature=$feature stage=$stage"; echo "# cmd: npx vitest run $testfile"; npx vitest run "$testfile" 2>&1; echo "# exit code: ${PIPESTATUS[0]}"; } > "$log" )
tail -n 12 "$log"
cd "$root" && git add -A && git commit -q -m "tdd($feature): $stage - $msg" && git log --oneline -1
