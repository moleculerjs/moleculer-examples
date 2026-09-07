# Moleculer with TypeScript

Companion code for the article **"Using Moleculer with TypeScript"** (Moleculer blog). Every snippet and output in the article comes from this directory; `run.sh` (where present) reproduces all of it.

## What it shows

- `src/contracts.ts` — one shared contract file (params + return types) that both services and callers import.
- `services/` — `products` and `orders` in **schema style** (plain objects, typed with the contract).
- `decorators/` — the same thing in **class style** with the community `moleculer-decorators` package.
- `src/typed-broker.ts` + `src/client.ts` — a typed caller (`broker.call<Return, Params>` derived from the contract).
- `run.sh` — type-checks, runs the `.ts` sources through `moleculer-runner` + `tsx`, then compiles to `dist/` and runs the JS.

## Run it

Node.js 22+.

```bash
docker run -d --rm --name nats -p 4222:4222 nats:2
```

```bash
npm install
bash run.sh
```
