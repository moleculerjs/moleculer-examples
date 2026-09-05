# Event-driven architecture: pub/sub with NATS, Kafka and Redis

Companion code for the article **"Event-driven architecture in Node.js: pub/sub with NATS, Kafka and Redis"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

- `emit` (balanced, one instance per consumer group) vs `broadcast` (every instance), with two `mailer` copies.
- Request context (`requestID`, `meta`) carried through three hops of events.
- Emitting to one group only; payload validation on the subscriber side.
- The **same code** on NATS, Redis and Kafka transporters, 2000 events each.
- What happens when a subscriber is down (at-most-once) and the fix: durable **channels** (`@moleculer/channels`, Redis Streams) with retries and a dead-letter stream.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats  -p 4222:4222 nats:2
docker run -d --rm --name redis -p 6379:6379 redis:7
docker run -d --rm --name kafka -p 9092:9092 apache/kafka:3.9.0
```

```bash
npm install
bash run.sh                                   # REDIS_URL=redis://localhost:6380 bash run.sh if 6379 is taken
```
