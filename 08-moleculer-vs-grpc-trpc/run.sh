#!/usr/bin/env bash
# Reproduces every demo in the post: the same products service as gRPC, tRPC and Moleculer,
# then two instances / one dies / one is slow / a third one appears, a quick throughput shape,
# and the two "combine them" setups. Needs NATS on localhost for the Moleculer parts:
#   docker run -d --rm --name blog-nats -p 4222:4222 nats:2
set -euo pipefail
cd "$(dirname "$0")"
TSX="$(pwd)/node_modules/.bin/tsx"
declare -A PID=()
rm -f /tmp/08-*.log

start() { # start <name> <dir> <cmd...>   (env assignments allowed before the command)
  local name=$1 dir=$2; shift 2
  (cd "$dir" && exec env "$@") >"/tmp/08-$name.log" 2>&1 &
  PID[$name]=$!
}
stop() { for n in "$@"; do kill "${PID[$n]}" 2>/dev/null || true; unset "PID[$n]"; done; sleep 1.5; }
stop_all() { kill "${PID[@]}" 2>/dev/null || true; wait 2>/dev/null || true; PID=(); }
trap stop_all EXIT
grpc() { (cd grpc && node client.js "$@"); }
trpc() { (cd trpc && "$TSX" client.ts "$@"); }
mol() { (cd moleculer && node client.js "$@" 2>&1 | grep -v '^\['); }

echo "=== 1. The same service three times ==="
start grpc-1 grpc PORT=50051 NODE_NAME=products-1 node server.js
start trpc-1 trpc PORT=4001 NODE_NAME=products-1 "$TSX" server.ts
start mol-1 moleculer NODE_NAME=products-1 node node.js
sleep 4
for impl in grpc trpc mol; do
  echo "--- $impl: get 2, then get 99"
  $impl get 2
  $impl get 99
done

echo
echo "=== 2. A second instance: who balances? ==="
start grpc-2 grpc PORT=50052 NODE_NAME=products-2 node server.js
start trpc-2 trpc PORT=4002 NODE_NAME=products-2 "$TSX" server.ts
start mol-2 moleculer NODE_NAME=products-2 node node.js
sleep 4
echo "--- gRPC: ipv4:127.0.0.1:50051,127.0.0.1:50052 + round_robin service config"
grpc rr 4
echo "--- tRPC: one URL — the second server on :4002 is simply never called"
trpc rr 4
echo "--- Moleculer: nothing configured, the registry knows both nodes"
mol nodes
mol rr 4

echo
echo "=== 3. Instance 2 goes away ==="
stop grpc-2 trpc-2 mol-2
echo "--- gRPC: the closed connection drops out of round_robin; the static list still names it"
grpc rr 4
echo "--- Moleculer: the node left the registry"
mol nodes
mol rr 4

echo
echo "=== 4. Instance 2 comes back slow (800 ms) ==="
start grpc-2 grpc PORT=50052 NODE_NAME=products-2 SLOW_MS=800 node server.js
start mol-2 moleculer NODE_NAME=products-2 SLOW_MS=800 node node.js
sleep 4
echo "--- gRPC: deadline 300 ms against the slow server"
ADDRS=127.0.0.1:50052,127.0.0.1:50051 grpc deadline 1
echo "--- gRPC: round robin keeps sending every second call to the slow instance (no retry: DEADLINE_EXCEEDED is not UNAVAILABLE)"
grpc rr 4
echo "--- Moleculer: requestTimeout 300 ms, then retries: 1, then the circuit breaker"
mol timeout
stop grpc-2 mol-2

echo
echo "=== 5. A third instance appears (instance 2 is gone again) ==="
start grpc-3 grpc PORT=50053 NODE_NAME=products-3 node server.js
start mol-3 moleculer NODE_NAME=products-3 node node.js
sleep 4
echo "--- gRPC: the client's address list is static — :50053 is never used"
grpc rr 4
echo "--- Moleculer: a new node in the registry, no client change"
mol nodes
mol rr 4
stop grpc-3 mol-3

echo
echo "=== 6. Throughput shape (one box, loopback, one instance each) ==="
grpc bench 2000
trpc bench 2000
BATCH=0 trpc bench 2000
mol bench 2000
start mol-tcp moleculer NODE_NAME=products-tcp-1 TRANSPORTER=TCP node node.js
sleep 5
TRANSPORTER=TCP mol bench 2000
stop mol-tcp

echo
echo "=== 7a. tRPC in front of a Moleculer cluster ==="
start mol-2 moleculer NODE_NAME=products-2 node node.js
start gateway combined PORT=4010 "$TSX" gateway.ts
sleep 5
grep -v '^\[[0-9]' /tmp/08-gateway.log || true
(cd combined && "$TSX" gateway-client.ts)

echo
echo "=== 7b. A gRPC service behind a Moleculer action ==="
start inv-grpc combined PORT=50060 SLOW_MS=200 node inventory-grpc-server.js
start inv-node combined node inventory-node.js
sleep 4
(cd combined && node inventory-client.js 2>&1 | grep -v '^\[')
echo "--- inventory-1 log:"
grep WARN /tmp/08-inv-node.log || true
