// services/orders.service.js — lib/orders.js as a service.
// No require("./users") any more: the dependency goes through the broker, and is declared.
let counter = 0;                       // module-level state — fine in a monolith; see "What breaks" below
const orders = [];

module.exports = {
  name: "orders",
  dependencies: ["users"],             // broker waits for `users` before starting this service
  actions: {
    create: {
      params: {
        userId: { type: "number", convert: true },
        item: "string",
        amount: { type: "number", positive: true },
      },
      async handler(ctx) {
        const user = await ctx.call("users.get", { id: ctx.params.userId });
        const order = { id: ++counter, userId: user.id, item: ctx.params.item, amount: ctx.params.amount };
        orders.push(order);
        await ctx.emit("order.created", { order, user });
        return { ...order, servedBy: this.broker.nodeID, usersServedBy: user.servedBy };
      },
    },
  },
};
