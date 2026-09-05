// gateway.js — HTTP edge. It is just another node in the cluster; it owns no business logic.
const { ServiceBroker } = require("moleculer");
const ApiGateway = require("moleculer-web");

const broker = new ServiceBroker({
  nodeID: `gateway-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  logger: { type: "Console", options: { level: "warn" } },
});

broker.createService({
  name: "api",
  mixins: [ApiGateway],
  settings: {
    port: process.env.PORT || 3000,
    routes: [{
      path: "/api",
      // Only expose what you list here; everything else stays internal to the cluster.
      whitelist: ["products.get", "orders.create"],
      aliases: {
        "GET /products/:id": "products.get",
        "POST /orders": "orders.create",
      },
      bodyParsers: { json: true },
    }],
  },
});

broker.start().then(() => console.log(`Gateway listening on http://localhost:${process.env.PORT || 3000}/api`));
