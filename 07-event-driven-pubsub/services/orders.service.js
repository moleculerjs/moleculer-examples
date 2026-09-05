// services/orders.service.js — the producer. Creating an order emits "order.created";
// cancelling one broadcasts "order.cancelled". With CHANNELS=1 the "created" message goes
// through a durable channel (Redis Streams) instead of the fire-and-forget event bus.
const { log } = require("./log");

module.exports = {
  name: "orders",

  created() {
    this.seq = 0;
  },

  actions: {
    create: {
      params: { sku: "string", qty: { type: "number", default: 1 } },
      async handler(ctx) {
        const order = { id: ++this.seq, sku: ctx.params.sku, qty: ctx.params.qty, total: ctx.params.qty * 10 };
        log(this, `orders.create #${order.id} (${order.sku}) — requestID ${ctx.requestID.slice(0, 8)}, level ${ctx.level}`);

        if (process.env.CHANNELS === "1") {
          // durable: stored in the stream until a consumer acknowledges it
          await this.broker.sendToChannel("order.created", order);
        } else {
          // event: delivered to ONE instance of every subscriber service that is online right now
          await ctx.emit("order.created", order);
        }
        return order;
      },
    },

    cancel: {
      params: { id: "number" },
      async handler(ctx) {
        // broadcast: delivered to EVERY instance of every subscriber service
        await ctx.broadcast("order.cancelled", { id: ctx.params.id });
        return { id: ctx.params.id, cancelled: true };
      },
    },
  },
};
