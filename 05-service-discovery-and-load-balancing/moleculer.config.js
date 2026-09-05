// moleculer.config.js — shared by every worker (moleculer-runner) and by client.js.
// Everything the article varies is an environment variable, the service code never changes.
const PreferZoneStrategy = require("./prefer-zone.strategy");

// Built-in strategies are picked by name; a custom one is passed as a class.
const strategy = process.env.STRATEGY === "PreferZone" ? PreferZoneStrategy : process.env.STRATEGY || "RoundRobin";

module.exports = {
  nodeID: `${process.env.NODE_PREFIX || "worker"}-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  metadata: { zone: process.env.ZONE || "eu" }, // free-form node metadata, visible to every other node
  registry: {
    strategy,
    strategyOptions: { shardKey: "name" }, // only Shard reads this: route by ctx.params.name
    preferLocal: true,
  },
  heartbeatInterval: 2, // seconds; default 10
  heartbeatTimeout: 6, // seconds; default 30 — shortened so the crash demo fits in a terminal
  logger: { type: "Console", options: { level: process.env.LOG_LEVEL || "warn", formatter: "short" } },
};
