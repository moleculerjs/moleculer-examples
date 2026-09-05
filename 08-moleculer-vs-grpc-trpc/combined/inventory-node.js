// combined/inventory-node.js — a Moleculer node that hosts the gRPC-wrapping inventory service.
//   node inventory-node.js
const { ServiceBroker } = require("moleculer");
const config = require("../moleculer/moleculer.config.js");

const broker = new ServiceBroker({ ...config, nodeID: process.env.NODE_NAME || "inventory-1" });
broker.createService(require("./inventory.service.js"));
broker.start().then(() => console.log(`[${broker.nodeID}] inventory (gRPC-backed) Moleculer node up`));
