// services/shipping.service.js — second hop in the orders chain; artificially slow via SHIPPING_LATENCY_MS.
module.exports = {
  name: "shipping",
  actions: {
    quote: {
      params: { sku: "string" },
      async handler(ctx) {
        await new Promise((r) => setTimeout(r, Number(process.env.SHIPPING_LATENCY_MS || 0)));
        return { sku: ctx.params.sku, price: 4.99, servedBy: this.broker.nodeID };
      },
    },
  },
};
