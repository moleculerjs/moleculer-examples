# Service discovery and load balancing

Companion code for the article **"Service discovery and load balancing in Node.js — without Consul or Kubernetes"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

Five live demos driven by `client.js`:

1. Three nodes hosting the same `greeter` service, round robin, zero configuration.
2. Scale down / crash (`SIGTERM` vs `SIGKILL`) / scale up with traffic running — heartbeat timeout vs graceful deregistration.
3. Strategies: `Shard` by key, and a 15-line custom `PreferZone` strategy (`prefer-zone.strategy.js`) using node metadata.
4. Discovery over plain **TCP** with UDP multicast — no message broker at all.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
bash run.sh
```
