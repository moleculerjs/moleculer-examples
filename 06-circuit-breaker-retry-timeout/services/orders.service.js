// services/orders.service.js — a caller that fans out to two dependencies in sequence.
// Used for the distributed-timeout and fallback demos.
module.exports = {
  name: "orders",
  actions: {
    create: {
      params: { sku: "string" },
      async handler(ctx) {
        const t0 = Date.now();
        const stock = await ctx.call("inventory.check", { sku: ctx.params.sku });
        const t1 = Date.now();
        const quote = await ctx.call("shipping.quote", { sku: ctx.params.sku });
        return { sku: ctx.params.sku, inStock: stock.inStock, shipping: quote.price, timings: { inventory: t1 - t0, shipping: Date.now() - t1 } };
      },
    },

    // A report endpoint that is expensive; the bulkhead caps how many run at once on this node.
    report: {
      bulkhead: { enabled: true, concurrency: 2, maxQueueSize: 3 },
      async handler(ctx) {
        await new Promise((r) => setTimeout(r, 300));
        return { ok: true, servedBy: this.broker.nodeID };
      },
    },
  },
};
