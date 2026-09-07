// client.js — one mode per demo. Its own broker joins the cluster and pokes the workers.
const { ServiceBroker } = require("moleculer");
const config = require("./moleculer.config.js");

const mode = process.argv[2] || "create";
const arg = process.argv[3];
const broker = new ServiceBroker({ ...config, nodeID: process.env.NODE_NAME || `client-${process.pid}` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const modes = {
  // N orders; meta.user rides along the call and into every event handler it triggers
  async create() {
    for (let i = 0; i < Number(arg || 1); i++) {
      const order = await broker.call("orders.create", { sku: `SKU-${i + 1}`, qty: 2 }, { meta: { user: "alice" } });
      console.log(`  → orders.create returned #${order.id}`);
      await sleep(50);
    }
  },

  async cancel() {
    await broker.call("orders.cancel", { id: Number(arg || 1) });
    console.log(`  → orders.cancel #${arg || 1} done`);
  },

  // emit straight from the client, only to the "mailer" group — analytics does not get it
  async "emit-to-group"() {
    await broker.emit("order.created", { id: 99, sku: "SKU-99", total: 0 }, ["mailer"]);
    console.log("  → emitted order.created to groups [mailer] only");
  },

  // a payload that fails the mailer's params schema
  async "bad-emit"() {
    await broker.emit("order.created", { id: "oops" });
    console.log('  → emitted order.created with { id: "oops" }');
  },

  // fire N bench.tick events as fast as possible, then ask the bench node what arrived
  async bench() {
    const n = Number(arg || 2000);
    await broker.call("bench.reset");
    const awaitEach = process.env.AWAIT !== "0"; // AWAIT=0: fire them all, then wait for the promises
    const t0 = Date.now();
    const pending = [];
    for (let i = 0; i < n; i++) {
      const p = broker.emit("bench.tick", { i, t: Date.now() });
      if (awaitEach) await p; else pending.push(p);
    }
    await Promise.all(pending);
    const emitMs = Date.now() - t0;
    await sleep(1500);
    const s = await broker.call("bench.stats");
    console.log(`  ${awaitEach ? "awaited each emit" : "fire-and-forget"}: ${n} events in ${emitMs} ms (${Math.round((n / emitMs) * 1000)} events/s) — received ${s.received}, latency p50 ${s.p50} ms, p99 ${s.p99} ms, max ${s.max} ms`);
  },
};

(async () => {
  await broker.start();
  const need = mode === "bench" ? ["bench"] : ["orders"];
  await broker.waitForServices(need, 15000);
  await modes[mode]();
  await sleep(300); // let the last event leave the socket before the broker stops
  await broker.stop();
})().catch((err) => { console.error(err); process.exit(1); });
