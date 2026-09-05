// client.js — one mode per demo. Runs its own broker (no services), joins the NATS cluster
// and calls the workers. Uses the same moleculer.config.js as the workers, so RETRY=1 / CB=1 /
// REQUEST_TIMEOUT_MS apply to *this* node — retries and circuit breakers live on the caller.
const { ServiceBroker, Errors } = require("moleculer");
const config = require("./moleculer.config.js");

const mode = process.argv[2] || "retry";
const arg = process.argv[3];
const broker = new ServiceBroker({ ...config, nodeID: process.env.NODE_NAME || `client-${process.pid}` });

// The circuit breaker announces its state changes as broker events — worth logging in real systems too.
broker.createService({
  name: "cb-watcher",
  events: {
    "$circuit-breaker.opened"(ctx) { console.log(`  🔴 circuit OPENED   for ${ctx.params.action} on ${ctx.params.nodeID} (${ctx.params.failures}/${ctx.params.count} failed)`); },
    "$circuit-breaker.half-opened"(ctx) { console.log(`  🟡 circuit HALF-OPEN for ${ctx.params.action} on ${ctx.params.nodeID} — one probe call allowed`); },
    "$circuit-breaker.closed"(ctx) { console.log(`  🟢 circuit CLOSED   for ${ctx.params.action} on ${ctx.params.nodeID} — back in rotation`); },
  },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// err.nodeID = the node that threw it (set when the error travelled over the transporter);
// err.data.nodeID = the node the call was addressed to (timeouts are raised locally, so only this is set)
const errName = (err) => {
  const from = err.nodeID || err.data?.nodeID;
  return `${err.name}${err.code ? ` (${err.code})` : ""}${from ? ` @${from}` : ""}`;
};

async function callAndPrint(action, params, opts = {}, label = "") {
  const t0 = Date.now();
  try {
    const res = await broker.call(action, params, opts);
    const parts = [label.trim(), res.servedBy, res.inStock !== undefined && `inStock=${res.inStock}`, res.timings && `timings=${JSON.stringify(res.timings)}`].filter(Boolean);
    console.log(`  ✓ ${parts.join(" ")} (${Date.now() - t0} ms)`);
    return res;
  } catch (err) {
    console.log(`  ✗ ${label}${errName(err)}: ${err.message} (${Date.now() - t0} ms)`);
    return null;
  }
}

const modes = {
  // 10 calls; with FAIL_EVERY=2 on the worker, every 2nd call throws a retryable 503.
  async retry() {
    for (let i = 1; i <= 10; i++) await callAndPrint("inventory.check", { sku: `SKU-${i}` });
  },

  // Round-robin over a healthy and a broken inventory node; watch the breaker isolate the bad one.
  // Then (if a node ID is given) heal that node at runtime with a targeted call and watch the
  // breaker go half-open → closed. Breaker state lives in the *caller*, so this is one process.
  async breaker() {
    let i = 0;
    const call = async () => callAndPrint("inventory.check", { sku: `SKU-${++i}` }, {}, `#${String(i).padStart(2)} `);
    for (let n = 0; n < 12; n++) { await call(); await sleep(150); }
    if (!arg) return;
    console.log(`  → inventory.configure on ${arg}: failRate=0 (the node is "fixed")`);
    await broker.call("inventory.configure", { failRate: 0 }, { nodeID: arg });
    for (let n = 0; n < 12; n++) { await call(); await sleep(600); }
  },

  // Per-call timeout against a slow node. Whether the error is retried depends on RETRY.
  async timeout() {
    const timeout = Number(arg || 1000);
    const count = Number(process.argv[4] || 4);
    for (let i = 1; i <= count; i++) await callAndPrint("inventory.check", { sku: `SKU-${i}` }, { timeout }, `#${i} timeout=${timeout} `);
  },

  // The orders → inventory → shipping chain with a single top-level timeout budget.
  async chain() {
    const timeout = Number(arg || 1500);
    await callAndPrint("orders.create", { sku: "SKU-1" }, { timeout }, `orders.create timeout=${timeout} → `);
  },

  // Fallback value when the dependency is unreachable/broken.
  async fallback() {
    const res = await broker.call("inventory.check", { sku: "SKU-1" }, {
      fallbackResponse: (ctx, err) => {
        console.log(`  ↩ fallback used because: ${errName(err)}`);
        return { sku: ctx.params.sku, inStock: null, stale: true };
      },
    });
    console.log("  result:", res);
  },

  // 10 parallel calls to a bulkheaded action (concurrency 2, queue 3): 5 run, 5 are rejected immediately.
  async bulkhead() {
    const t0 = Date.now();
    const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => broker.call("orders.report", { i })));
    results.forEach((r, i) => {
      const t = Date.now() - t0;
      if (r.status === "fulfilled") console.log(`  ✓ #${i} ok`);
      else console.log(`  ✗ #${i} ${errName(r.reason)}: ${r.reason.message}`);
    });
    console.log(`  total ${Date.now() - t0} ms`);
  },
};

(async () => {
  await broker.start();
  await broker.waitForServices(["inventory", "orders", "shipping"], 5000);
  await modes[mode]();
  await broker.stop();
})().catch((err) => { console.error(err); process.exit(1); });
