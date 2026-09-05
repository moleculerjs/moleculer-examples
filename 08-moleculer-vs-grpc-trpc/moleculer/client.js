// moleculer/client.js — a throwaway broker that joins the cluster and calls products.*
//   node client.js get 2
//   node client.js rr 6          → registry round-robin, no addresses configured anywhere
//   node client.js nodes         → what the registry knows right now
//   node client.js timeout       → requestTimeout, then retry to another instance, then circuit breaker
//   node client.js bench 2000
const { ServiceBroker } = require("moleculer");
const config = require("./moleculer.config.js");

const [mode = "get", arg] = process.argv.slice(2);
const broker = new ServiceBroker({ ...config, nodeID: process.env.NODE_NAME || `client-${process.pid}` });
broker.createService({
  name: "watcher",
  events: {
    "$circuit-breaker.opened"(ctx) { console.log(`  🔴 circuit OPENED for ${ctx.params.action} on ${ctx.params.nodeID} (${ctx.params.failures}/${ctx.params.count} failed)`); },
    "$circuit-breaker.half-opened"(ctx) { console.log(`  🟡 circuit half-open for ${ctx.params.action} on ${ctx.params.nodeID}`); },
    "$circuit-breaker.closed"(ctx) { console.log(`  🟢 circuit CLOSED for ${ctx.params.action} on ${ctx.params.nodeID}`); },
  },
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const modes = {
  async get() {
    try {
      const p = await broker.call("products.get", { id: Number(arg || 1) });
      console.log(`  → ${JSON.stringify(p)}`);
    } catch (err) {
      console.log(`  → error ${err.name} (${err.code} ${err.type}): ${err.message}`);
    }
  },

  async rr() {
    for (let i = 0; i < Number(arg || 6); i++) {
      try {
        const p = await broker.call("products.get", { id: 1 });
        console.log(`  call ${i + 1}: served by ${p.servedBy}`);
      } catch (err) {
        console.log(`  call ${i + 1}: ${err.name} — ${err.message}`);
      }
      await sleep(100);
    }
  },

  async nodes() {
    const eps = broker.registry.getActionEndpoints("products.get");
    console.log(`  products.get endpoints: ${eps ? eps.endpoints.filter((e) => e.isAvailable).map((e) => e.id).join(", ") : "none"}`);
  },

  async timeout() {
    const call = (opts, label) => async () => {
      const t0 = Date.now();
      try {
        const p = await broker.call("products.get", { id: 1 }, opts);
        console.log(`  ${label}: served by ${p.servedBy} in ${Date.now() - t0} ms`);
      } catch (err) {
        console.log(`  ${label}: ${err.name} after ${Date.now() - t0} ms — ${err.message}${err.data?.nodeID ? ` (node ${err.data.nodeID})` : ""}`);
      }
    };
    console.log("--- plain calls, 300 ms requestTimeout, one instance is slow:");
    for (let i = 1; i <= 4; i++) await call({}, `call ${i}`)();
    console.log("--- same, with retries: 1 → the retry goes to another instance, and the breaker counts the timeouts:");
    for (let i = 1; i <= 4; i++) await call({ retries: 1 }, `call ${i}`)();
    console.log("--- the circuit is open for the slow endpoint; plain calls again:");
    for (let i = 1; i <= 4; i++) await call({}, `call ${i}`)();
    const eps = broker.registry.getActionEndpoints("products.get");
    console.log(`  endpoint state: ${eps.endpoints.map((e) => `${e.id}=${e.state}`).join(", ")}`);
  },

  async bench() {
    const n = Number(arg || 2000);
    await broker.call("products.get", { id: 1 });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) await broker.call("products.get", { id: 1 });
    const ms = Date.now() - t0;
    const label = `Moleculer over ${String(broker.options.transporter).split(":")[0]}`;
    console.log(`  ${label}, sequential: ${n} calls in ${ms} ms (${Math.round((n / ms) * 1000)} req/s, ${(ms / n).toFixed(2)} ms/call)`);
    const t1 = Date.now();
    // The 300 ms requestTimeout is for the failure demos; 2000 queued calls on a busy box can legitimately take longer.
    await Promise.all(Array.from({ length: n }, () => broker.call("products.get", { id: 1 }, { timeout: 10000 })));
    const ms2 = Date.now() - t1;
    console.log(`  ${label}, ${n} in flight: ${ms2} ms (${Math.round((n / ms2) * 1000)} req/s)`);
  },
};

(async () => {
  await broker.start();
  await broker.waitForServices("products", 15000);
  await modes[mode]();
  await broker.stop();
})().catch((err) => { console.error(err); process.exit(1); });
