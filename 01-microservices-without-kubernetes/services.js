// services.js — the business logic. It never changes between "one process" and "many processes".

const Products = {
  name: "products",
  actions: {
    get: {
      params: { id: { type: "number", convert: true } }, // convert: URL params arrive as strings
      handler(ctx) {
        return { id: ctx.params.id, name: `Product #${ctx.params.id}`, price: 42, servedBy: this.broker.nodeID };
      },
    },
  },
};

const Orders = {
  name: "orders",
  actions: {
    create: {
      params: { productId: "number", qty: "number" },
      async handler(ctx) {
        // Looks like a local function call — may be a network hop. The framework decides.
        const product = await ctx.call("products.get", { id: ctx.params.productId });
        const order = { id: Date.now(), product, qty: ctx.params.qty, total: product.price * ctx.params.qty };
        // Publish an event. Whoever cares subscribes.
        await ctx.emit("order.created", order);
        return order;
      },
    },
  },
};

const Notifications = {
  name: "notifications",
  events: {
    "order.created"(ctx) {
      this.logger.info(`Email sent: order ${ctx.params.id}, total ${ctx.params.total} (from ${ctx.nodeID})`);
    },
  },
};

module.exports = { Products, Orders, Notifications };
