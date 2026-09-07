// services/inventory.service.js — a dependency we can break on purpose.
// `configure` sets how this *instance* misbehaves (each node keeps its own knobs),
// so one node can be healthy while another one is slow or failing.
const { Errors } = require("moleculer");

module.exports = {
  name: "inventory",

  created() {
    this.knobs = {
      failRate: Number(process.env.FAIL_RATE || 0), // 0..1 — share of calls that throw
      latency: Number(process.env.LATENCY_MS || 0), // ms — artificial slowness
      failEvery: Number(process.env.FAIL_EVERY || 0), // e.g. 2 = every 2nd call fails (deterministic)
    };
    this.calls = 0;
  },

  actions: {
    check: {
      params: { sku: "string" },
      async handler(ctx) {
        this.calls++;
        const { failRate, latency, failEvery } = this.knobs;
        if (latency) await new Promise((r) => setTimeout(r, latency));
        const fail = (failEvery && this.calls % failEvery === 0) || Math.random() < failRate;
        if (fail) {
          // 503 + retryable: "try again, it might work" — the retry policy and circuit breaker both key off this
          throw new Errors.MoleculerRetryableError("inventory database unavailable", 503, "DB_UNAVAILABLE");
        }
        return { sku: ctx.params.sku, inStock: 42, servedBy: this.broker.nodeID };
      },
    },

    configure: {
      params: { failRate: { type: "number", optional: true }, latency: { type: "number", optional: true }, failEvery: { type: "number", optional: true } },
      handler(ctx) {
        Object.assign(this.knobs, ctx.params);
        this.logger.warn(`knobs → ${JSON.stringify(this.knobs)}`);
        return this.knobs;
      },
    },
  },
};
