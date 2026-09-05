// moleculer/gateway.js — HTTP edge, mapping a route to the action.
const { ServiceBroker } = require("moleculer");
const ApiGateway = require("moleculer-web");

const broker = new ServiceBroker({
  nodeID: `gateway-${process.pid}`,
  transporter: "nats://localhost:4222",
  logger: false,
  requestTimeout: 2000,                       // global; NestJS needs rxjs timeout() per call
});

broker.createService({
  name: "api",
  mixins: [ApiGateway],
  settings: {
    port: process.env.PORT || 3000,
    routes: [{ path: "/", aliases: { "GET /products/:id": "products.get" } }],
  },
});

broker.start().then(() => console.log(`gateway on http://localhost:${process.env.PORT || 3000}`));
