// monolith.js — all three services in ONE process. No broker, no network, no Docker.
const { ServiceBroker } = require("moleculer");
const { Products, Orders, Notifications } = require("./services");

const broker = new ServiceBroker({ logger: { type: "Console", options: { level: "info" } } });

broker.createService(Products);
broker.createService(Orders);
broker.createService(Notifications);

broker.start()
  .then(() => broker.call("orders.create", { productId: 7, qty: 3 }))
  .then((order) => console.log("Order:", order))
  .then(() => broker.stop());
