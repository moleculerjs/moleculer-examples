#!/usr/bin/env bash
# Reproduces every demo in the article. Needs NATS on localhost:4222 for all but the last one:
#   docker run -d --rm --name blog-nats -p 4222:4222 nats:2
set -uo pipefail
cd "$(dirname "$0")"
RUNNER=./node_modules/.bin/moleculer-runner
PIDS=()
worker() { env "$@" SERVICEDIR=services node $RUNNER --config moleculer.config.js >/dev/null 2>&1 & PIDS+=($!); }
cleanup() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null; done; sleep 0.5; }
trap cleanup EXIT

echo "== 1. three workers, round-robin"
worker ZONE=eu; worker ZONE=eu; worker ZONE=eu; sleep 2.5
node client.js calls 6
node client.js nodes

echo; echo "== 2. graceful stop (SIGTERM) at ~3s, crash (SIGKILL) at ~6s, new worker at ~12s"
node client.js loop 16 & CLIENT=$!
sleep 3.2; kill -TERM "${PIDS[0]}"
sleep 3;   kill -KILL "${PIDS[1]}"
sleep 6;   worker ZONE=eu
wait $CLIENT

echo; echo "== 3. Shard strategy: same name → same node"
STRATEGY=Shard node client.js calls 12

echo; echo "== 4. custom PreferZone strategy: add a us worker, call from eu / us / asia"
worker ZONE=us; sleep 2.5
node client.js nodes
STRATEGY=PreferZone ZONE=eu node client.js calls 6
STRATEGY=PreferZone ZONE=us node client.js calls 6
STRATEGY=PreferZone ZONE=asia node client.js calls 6

cleanup; PIDS=(); sleep 1
echo; echo "== 5. no NATS at all: TCP transporter with UDP discovery"
worker TRANSPORTER=TCP; worker TRANSPORTER=TCP; sleep 4
TRANSPORTER=TCP node client.js calls 4
TRANSPORTER=TCP node client.js nodes
echo "== done"
