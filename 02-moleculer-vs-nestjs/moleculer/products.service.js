// moleculer/products.service.js — the same service in Moleculer.
const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker({
  nodeID: `products-${process.pid}`,
  transporter: "nats://localhost:4222",
  logger: false,
});

broker.createService({
  name: "products",
  actions: {
    get: {
      params: { id: { type: "number", convert: true } },   // validation is part of the action
      handler(ctx) {
        return { id: ctx.params.id, name: `Product #${ctx.params.id}`, price: 42, servedBy: this.broker.nodeID };
      },
    },
  },
});

broker.start().then(() => console.log(`products service up (${broker.nodeID})`));
