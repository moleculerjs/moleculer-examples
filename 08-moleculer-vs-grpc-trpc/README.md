# Moleculer vs gRPC vs tRPC

Companion code for the article **"Moleculer vs gRPC vs tRPC: an RPC protocol is not a service layer"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

The same `products` service as **gRPC** (`grpc/`, `.proto` + @grpc/grpc-js), **tRPC** (`trpc/`, TypeScript, zod) and **Moleculer** (`moleculer/`). Then the same problems against each: a second instance, a dead instance, a slow instance, a third instance appearing — plus a throughput shape on one box.

`combined/` shows the two ways they fit together: a **tRPC gateway running on a Moleculer node** (typed browser client, cluster balancing behind it) and a **gRPC service behind a Moleculer action** (Moleculer timeout → gRPC deadline, status → error mapping).

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
bash run.sh                                   # ~2 minutes, 7 steps
npx tsc -p tsconfig.json --noEmit             # type-check the TypeScript parts
```
