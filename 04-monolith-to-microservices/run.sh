#!/usr/bin/env bash
# Reproduces every stage of the article. Needs NATS on localhost:4222 for stages 2+.
#   docker run -d --rm --name blog-nats -p 4222:4222 nats:2
set -uo pipefail
cd "$(dirname "$0")"
export PORT=${PORT:-3000}
RUNNER=./node_modules/.bin/moleculer-runner
NATS=nats://localhost:4222
PIDS=()
cleanup() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null; done; sleep 0.5; }
trap cleanup EXIT
hit() {
  curl -s localhost:$PORT/users/1; echo
  curl -s -X POST localhost:$PORT/orders -H 'content-type: application/json' -H 'x-user-id: 2' -d '{"item":"Monitor","amount":329}'; echo
}

echo "== stage 0: the Express monolith"
node 00-before/app.js > stage0.log 2>&1 & PIDS+=($!); sleep 1
hit
kill ${PIDS[-1]}; unset 'PIDS[-1]'

echo; echo "== stage 1: broker inside the monolith, local bus (no transporter)"
node app.js > stage1.log 2>&1 & PIDS+=($!); sleep 3
hit
kill ${PIDS[-1]}; unset 'PIDS[-1]'

echo; echo "== stage 2: extract mailer to its own process; users+orders stay in the app"
TRANSPORTER=$NATS SERVICEDIR=services SERVICES=mailer node $RUNNER --config moleculer.config.js > stage2-mailer.log 2>&1 & PIDS+=($!)
TRANSPORTER=$NATS SERVICES=users,orders node app.js > stage2-app.log 2>&1 & PIDS+=($!); sleep 3
hit
grep MAILER stage2-mailer.log | grep "→"
kill ${PIDS[-1]} ${PIDS[-2]}; unset 'PIDS[-1]'; unset 'PIDS[-1]'; sleep 1

echo; echo "== stage 3: users out too; two orders instances behind the app"
TRANSPORTER=$NATS SERVICEDIR=services SERVICES=mailer node $RUNNER --config moleculer.config.js > stage3-mailer.log 2>&1 & PIDS+=($!)
TRANSPORTER=$NATS SERVICEDIR=services SERVICES=users  node $RUNNER --config moleculer.config.js  > stage3-users.log 2>&1 & PIDS+=($!)
TRANSPORTER=$NATS SERVICEDIR=services SERVICES=orders node $RUNNER --config moleculer.config.js > stage3-orders-a.log 2>&1 & PIDS+=($!)
TRANSPORTER=$NATS SERVICEDIR=services SERVICES=orders node $RUNNER --config moleculer.config.js > stage3-orders-b.log 2>&1 & PIDS+=($!)
TRANSPORTER=$NATS SERVICES= node app.js > stage3-app.log 2>&1 & PIDS+=($!); sleep 4
for i in 1 2 3 4; do
  curl -s -X POST localhost:$PORT/orders -H 'content-type: application/json' -H 'x-user-id: 1' -d '{"item":"Cable","amount":9}'; echo
done
echo "== done"
