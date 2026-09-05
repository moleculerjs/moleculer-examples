#!/usr/bin/env bash
# Reproduces every demo in the post. Needs three brokers on localhost:
#   docker run -d --rm --name blog-nats  -p 4222:4222 nats:2
#   docker run -d --rm --name blog-redis -p 6379:6379 redis:7
#   docker run -d --rm --name blog-kafka -p 9092:9092 apache/kafka:3.9.0
set -euo pipefail
cd "$(dirname "$0")"
RUNNER="./node_modules/.bin/moleculer-runner"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
KAFKA_URL="${KAFKA_URL:-kafka://localhost:9092}"
PIDS=()
rm -f /tmp/07-*.log

worker() { # worker <NODE_NAME> <SERVICES> [ENV=val ...]
  local name=$1 services=$2; shift 2
  env NODE_NAME="$name" SERVICES="$services" SERVICEDIR=services "$@" "$RUNNER" --config moleculer.config.js >>"/tmp/07-$name.log" 2>&1 &
  PIDS+=($!)
}
stop_workers() { kill "${PIDS[@]}" 2>/dev/null || true; wait 2>/dev/null || true; PIDS=(); sleep 1; }
trap stop_workers EXIT
merged() { cat /tmp/07-*.log | grep -a "^20" | sort | cut -d' ' -f2- || true; } # service log lines of every node, in time order
clear_logs() { for f in /tmp/07-*.log; do [ -e "$f" ] && : >"$f"; done; true; } # truncate in place (workers append)

echo "=== 1. emit vs broadcast: one orders node, two mailer instances, one analytics ==="
clear_logs
worker app-1 orders
worker mailer-1 mailer
worker mailer-2 mailer
worker analytics-1 analytics
sleep 2.5
echo "--- 4× orders.create (each one emits order.created)"
node client.js create 4
echo "--- orders.cancel #2 (broadcasts order.cancelled)"
node client.js cancel 2
echo "--- what the nodes logged:"
merged

echo
echo "=== 2. Event groups: emit only to the mailer group ==="
clear_logs
node client.js emit-to-group
sleep 0.5
merged

echo
echo "=== 3. Event payload validation ==="
clear_logs
node client.js bad-emit
sleep 0.5
merged
echo "--- and on the mailer node that rejected it:"
grep -ah -A1 "ValidationError" /tmp/07-mailer-*.log | head -2
grep -ah "message:" /tmp/07-mailer-*.log | head -1
stop_workers

echo
echo "=== 4. Same code, three transporters: 2 000 events, one emitter node → one subscriber node ==="
for T in nats://localhost:4222 "$REDIS_URL" "$KAFKA_URL"; do
  echo "--- TRANSPORTER=${T%%:*}"
  worker bench-1 bench TRANSPORTER="$T"
  sleep 6 # Kafka needs a few seconds to create the topics
  TRANSPORTER="$T" LOG_LEVEL=error node client.js bench 2000
  TRANSPORTER="$T" LOG_LEVEL=error AWAIT=0 node client.js bench 2000
  stop_workers
done

echo
echo "=== 5. What happens when the subscriber is down ==="
clear_logs
echo "--- events: orders runs, mailer is NOT running; create 2 orders, then start the mailer"
worker app-1 orders
sleep 2
node client.js create 2
worker mailer-1 mailer
sleep 3
echo "--- mailer log:"
grep -ah "order.created" /tmp/07-mailer-1.log || echo "(nothing — the two events were delivered to nobody and are gone)"
stop_workers

echo
echo "--- channels (CHANNELS=1, Redis Streams): same scenario"
clear_logs
redis-cli -u "$REDIS_URL" DEL order.created FAILED_MESSAGES >/dev/null
worker mailer-1 mailer CHANNELS=1 FAIL_ORDER=3   # first start creates the consumer group…
worker support-1 support CHANNELS=1
sleep 3
kill "${PIDS[0]}"; sleep 1                        # …then the mailer "crashes"
echo "mailer-1 stopped"
worker app-1 orders CHANNELS=1
sleep 2
CHANNELS=1 node client.js create 2
echo "messages waiting in the stream: $(redis-cli -u "$REDIS_URL" XLEN order.created)"
worker mailer-1 mailer CHANNELS=1 FAIL_ORDER=3
sleep 3
echo "--- order #3 makes the mailer throw: retries, then dead-letter"
CHANNELS=1 node client.js create 1
sleep 8
merged
grep -ah "Moved message" /tmp/07-mailer-1.log | cut -d' ' -f2-
stop_workers
