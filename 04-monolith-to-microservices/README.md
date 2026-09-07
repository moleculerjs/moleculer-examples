# From a modular monolith to microservices

Companion code for the article **"From a modular monolith to microservices without a rewrite"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

`00-before/` is a plain Express app with `users`, `orders` and `mailer` modules. The three stages of the migration:

1. **Stage 1** — module boundaries become Moleculer service boundaries, still one process (`transporter: null`).
2. **Stage 2** — extract only `mailer` into its own process (`moleculer-runner` with `SERVICES`); `users → orders` stays in-process thanks to `preferLocal`.
3. **Stage 3** — split the rest and run two `orders` instances — which exposes the module-level counter that only worked in one process.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
bash run.sh
```
