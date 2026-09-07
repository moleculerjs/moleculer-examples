# Circuit breaker, retry and timeout

Companion code for the article **"Circuit breaker, retry and timeout in Node.js microservices"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

Six live demos driven by `client.js` against a deliberately flaky `inventory` service:

1. Retry with exponential backoff (`FAIL_EVERY=2`).
2. Per-endpoint circuit breaker that opens for one bad node only, and heals (half-open → closed).
3. Timeout → `retries: 1` failover → the breaker cuts the slow node off.
4. Distributed timeout budget across three hops (`orders → inventory → shipping`).
5. `fallbackResponse`.
6. Bulkhead: 10 concurrent calls, 5 rejected with `QueueIsFullError`.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
bash run.sh
```
