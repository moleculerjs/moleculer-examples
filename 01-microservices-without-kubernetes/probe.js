const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker({ nodeID: "probe", transporter: "nats://localhost:4222", logger: false });
broker.start().then(async () => {
  const nodes = await broker.call("$node.list", { withServices: true });
  console.log(JSON.stringify(nodes.map(n => ({ id: n.id, services: n.services?.map(s => s.name) })), null, 0));
  const svcs = await broker.call("$node.services", { onlyAvailable: true });
  console.log(svcs.map(s => `${s.name}@${s.nodes?.join("|")}`).join("\n"));
  await broker.stop();
});
