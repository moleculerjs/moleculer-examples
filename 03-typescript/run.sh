#!/usr/bin/env bash
# Runs the example twice: (1) TypeScript sources directly via tsx, (2) compiled JS from dist/.
# Requires NATS on localhost:4222 (docker run -d --rm --name blog-nats -p 4222:4222 nats:2).
set -euo pipefail
cd "$(dirname "$0")"
RUNNER=./node_modules/.bin/moleculer-runner

echo "== 1. type-check"
npx tsc --noEmit -p .

echo "== 2. dev: run .ts services through moleculer-runner + tsx"
node --import tsx $RUNNER --config moleculer.config.ts --mask "**/*.service.ts" services > runner-dev.log 2>&1 &
RP=$!
sleep 4
npx tsx src/client.ts
kill $RP; wait $RP 2>/dev/null || true

echo "== 3. prod: compile with tsc, run dist/ with plain node"
npx tsc -p .
node $RUNNER --config dist/moleculer.config.js dist/services > runner-prod.log 2>&1 &
RP=$!
sleep 4
node dist/src/client.js
kill $RP; wait $RP 2>/dev/null || true
echo "== done"
