#!/usr/bin/env bash
# Retry package installs with exponential backoff.
# Handles transient registry failures (429 rate limits, 5xx, network resets).
#
# Usage:
#   ./scripts/install-retry.sh                  # auto-detect bun, fallback to npm
#   PKG_MANAGER=npm ./scripts/install-retry.sh  # force npm
#   ./scripts/install-retry.sh add lodash       # pass through extra args
#
# Env vars:
#   MAX_ATTEMPTS  (default 5)
#   BASE_DELAY    (default 2 seconds)
#   MAX_DELAY     (default 60 seconds)

set -uo pipefail

MAX_ATTEMPTS="${MAX_ATTEMPTS:-5}"
BASE_DELAY="${BASE_DELAY:-2}"
MAX_DELAY="${MAX_DELAY:-60}"

if [ -n "${PKG_MANAGER:-}" ]; then
  PM="$PKG_MANAGER"
elif command -v bun >/dev/null 2>&1; then
  PM="bun"
else
  PM="npm"
fi

if [ "$#" -gt 0 ]; then
  ARGS=("$@")
else
  ARGS=("install")
fi

LOG_FILE="$(mktemp -t install-retry.XXXXXX.log)"
trap 'rm -f "$LOG_FILE"' EXIT

attempt=1
delay="$BASE_DELAY"

while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "==> [$PM ${ARGS[*]}] attempt $attempt/$MAX_ATTEMPTS"

  if "$PM" "${ARGS[@]}" 2>&1 | tee "$LOG_FILE"; then
    echo "==> Install succeeded on attempt $attempt"
    exit 0
  fi

  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "==> Install failed after $MAX_ATTEMPTS attempts" >&2
    exit 1
  fi

  # Only back off + retry on transient registry/network failures.
  if grep -Eqi '429|too many requests|rate.?limit|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|502|503|504|ERR_SOCKET_TIMEOUT|FetchError' "$LOG_FILE"; then
    # Full jitter: sleep a random amount in [0, delay].
    jitter=$(( (RANDOM % (delay * 1000 + 1)) ))
    sleep_for=$(awk -v ms="$jitter" 'BEGIN { printf "%.2f", ms/1000 }')
    echo "==> Transient registry error detected. Backing off ${sleep_for}s (window ${delay}s)..."
    sleep "$sleep_for"
    delay=$(( delay * 2 ))
    [ "$delay" -gt "$MAX_DELAY" ] && delay="$MAX_DELAY"
    attempt=$(( attempt + 1 ))
    continue
  fi

  echo "==> Non-transient install failure; not retrying." >&2
  exit 1
done

exit 1
