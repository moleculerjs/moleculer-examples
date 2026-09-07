// moleculer/node.js — one service node (same as `moleculer-runner`, kept explicit for the post)
const { ServiceBroker } = require("moleculer");
const broker = new ServiceBroker(require("./moleculer.config.js"));
broker.createService(require("./products.service.js"));
broker.start().then(() => console.log(`[${broker.nodeID}] Moleculer products node up (${broker.options.transporter})`));
