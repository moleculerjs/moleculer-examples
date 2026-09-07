# Node.js microservices without Kubernetes

Companion code for the article **"Node.js microservices without Kubernetes (and without a platform team)"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

Three services (`products`, `orders`, `notifications`) whose code never changes while the deployment does:

1. **`monolith.js`** — all three services in one process, no transporter, no network.
2. **`node.js`** — the same services split into processes over NATS: `node node.js products` and `node node.js orders notifications`. `client.js` calls into the cluster and prints which node answered; `probe.js` lists the registry.
3. Start a second `node node.js products` and watch round-robin balancing kick in.
4. **`resilience.js`** — timeout, retry and circuit breaker as broker options.
5. **`gateway.js`** — an HTTP edge with `moleculer-web`, itself just another node.
6. **`docker-compose.yml`** — the whole "cluster" on one VM, no orchestrator.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
node monolith.js                      # step 1: one process
node node.js products &               # step 2: split into processes
node node.js orders notifications &
node client.js
node node.js products &               # step 3: scale one service
node client.js
node resilience.js                    # step 4
node gateway.js &                     # step 5: curl localhost:3000/api/products/1
docker compose up --build             # step 6
```
