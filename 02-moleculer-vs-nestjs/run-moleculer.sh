#!/bin/bash
cd "$(dirname "$0")/moleculer"
setsid node products.service.js > /tmp/mp1.log 2>&1 & P1=$!
setsid node products.service.js > /tmp/mp2.log 2>&1 & P2=$!
PORT=${PORT:-3000} setsid node gateway.js > /tmp/mg.log 2>&1 & P3=$!
sleep 4
for i in 1 2 3 4; do curl -s localhost:${PORT:-3000}/products/$i; echo; done
echo "--- bad input:"
curl -s localhost:${PORT:-3000}/products/abc; echo
echo "--- products service stopped:"
kill -- -$P1 -$P2; sleep 1
time curl -s localhost:${PORT:-3000}/products/5; echo
kill -- -$P3
