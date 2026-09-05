#!/usr/bin/env bash
# Reproduces every demo in the post. Needs NATS on localhost:4222:
#   docker run -d --rm --name blog-nats -p 4222:4222 nats:2
set -euo pipefail
cd "$(dirname "$0")"
RUNNER="./node_modules/.bin/moleculer-runner"
PIDS=()

worker() { # worker <NODE_NAME> <SERVICES> [ENV=val ...]
  local name=$1 services=$2; shift 2
  env NODE_NAME="$name" SERVICES="$services" SERVICEDIR=services "$@" "$RUNNER" --config moleculer.config.js >"/tmp/06-$name.log" 2>&1 &
  PIDS+=($!)
}
stop_workers() { kill "${PIDS[@]}" 2>/dev/null || true; wait 2>/dev/null || true; PIDS=(); sleep 1; }
trap stop_workers EXIT

echo "=== 1. Retry: every 2nd inventory call fails with a retryable 503 ==="
worker app-1 orders,shipping
worker inventory-1 inventory FAIL_EVERY=2
sleep 2
echo "--- no retry policy (the default)"
node client.js retry
echo "--- RETRY=1 (retries: 3, delay: 100 ms, factor 2)"
RETRY=1 LOG_LEVEL=warn node client.js retry
stop_workers

echo
echo "=== 2. Circuit breaker: one healthy and one broken inventory node ==="
worker app-1 orders,shipping
worker inventory-good inventory
worker inventory-bad inventory FAIL_RATE=1
sleep 2
echo "--- no circuit breaker: the broken node keeps getting every 2nd call"
node client.js breaker
echo "--- CB=1: the breaker isolates inventory-bad, then we fix it and it comes back"
CB=1 node client.js breaker inventory-bad
stop_workers

echo
echo "=== 3. Timeout: a slow inventory node (3 s) and a 1 s per-call timeout ==="
worker app-1 orders,shipping
worker inventory-slow inventory LATENCY_MS=3000
sleep 2
echo "--- only the slow node exists"
node client.js timeout 1000
echo "--- a healthy node joins; RETRY=1 turns the timeout into a failover"
worker inventory-fast inventory
sleep 2
RETRY=1 node client.js timeout 1000
echo "--- RETRY=1 CB=1: timeouts count as failures, so the slow node gets cut off"
RETRY=1 CB=1 LOG_LEVEL=error node client.js timeout 1000 10
stop_workers

echo
echo "=== 4. Distributed timeout: orders → inventory (800 ms) → shipping (800 ms), 1.5 s budget ==="
worker app-1 orders,shipping SHIPPING_LATENCY_MS=800
worker inventory-1 inventory LATENCY_MS=800
sleep 2
echo "--- 3 s budget: fits"
node client.js chain 3000
echo "--- 1.5 s budget: the second hop only gets what is left"
node client.js chain 1500
echo "--- what app-1 (the orders node) logged meanwhile:"
grep "timed out" /tmp/06-app-1.log
stop_workers

echo
echo "=== 5. Fallback: inventory is down, the caller degrades instead of failing ==="
worker app-1 orders,shipping
worker inventory-1 inventory FAIL_RATE=1
sleep 2
node client.js fallback
stop_workers

echo
echo "=== 6. Bulkhead: orders.report allows 2 concurrent + 3 queued; we send 10 at once ==="
worker app-1 orders,shipping
worker inventory-1 inventory
sleep 2
node client.js bulkhead
stop_workers
