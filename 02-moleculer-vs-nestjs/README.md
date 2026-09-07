# Moleculer vs NestJS

Companion code for the article **"Moleculer vs NestJS: which one, and when"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

The same `products` service twice — as a NestJS microservice with a NestJS HTTP gateway (`nest/`), and as a Moleculer service with a `moleculer-web` gateway (`moleculer/`). Two copies of each, then the service processes are stopped while the gateway keeps running, to show what each framework does about discovery, balancing and a missing service out of the box.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
PORT=3000 bash run-nest.sh
PORT=3000 bash run-moleculer.sh
```

Both scripts start two service instances and a gateway, hit the gateway four times, stop the services and call once more.
