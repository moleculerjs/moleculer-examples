// node.js — start ONE process that hosts the services named on the command line.
//   node node.js products
//   node node.js orders notifications
// Same service code as before. The only new thing is the transporter.
const { ServiceBroker } = require("moleculer");
const all = require("./services");

const broker = new ServiceBroker({
  nodeID: `${process.argv.slice(2).join("+")}-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  logger: { type: "Console", options: { level: "info" } },
});

for (const name of process.argv.slice(2)) {
  const schema = Object.values(all).find((s) => s.name === name);
  if (!schema) throw new Error(`Unknown service: ${name}`);
  broker.createService(schema);
}

broker.start();
