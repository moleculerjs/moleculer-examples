#!/bin/bash
# Starts 2 products microservices + gateway, hits the gateway, then stops everything.
cd "$(dirname "$0")"
setsid npx tsx nest/products.service.ts > /tmp/np1.log 2>&1 & P1=$!
setsid npx tsx nest/products.service.ts > /tmp/np2.log 2>&1 & P2=$!
PORT=${PORT:-3000} setsid npx tsx nest/gateway.ts > /tmp/ng.log 2>&1 & P3=$!
sleep 8
for i in 1 2 3 4; do curl -s localhost:${PORT:-3000}/products/$i; echo; done
echo "--- products service stopped:"
kill -- -$P1 -$P2; sleep 1
time curl -s localhost:${PORT:-3000}/products/5; echo
kill -- -$P3
