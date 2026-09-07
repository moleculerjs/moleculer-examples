// client.js — a broker with no services of its own; it just calls into the cluster.
const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker({
  nodeID: "client",
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  logger: false,
});

broker.start()
  .then(() => broker.waitForServices(["orders"]))
  .then(async () => {
    for (let i = 1; i <= 4; i++) {
      const order = await broker.call("orders.create", { productId: i, qty: 2 });
      console.log(`order ${order.id} → total ${order.total}, product served by ${order.product.servedBy}`);
    }
    // Built-in introspection: which nodes are online and what do they host?
    const nodes = await broker.call("$node.list", { withServices: true });
    for (const n of nodes) console.log(`node ${n.id}: ${n.services.map((s) => s.name).filter((s) => s !== "$node").join(", ")}`);
  })
  .then(() => broker.stop());
