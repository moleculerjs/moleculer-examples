// moleculer.config.js — for services that run OUTSIDE the app process, via moleculer-runner.
module.exports = {
  nodeID: `svc-${process.env.SERVICES || "all"}-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  logger: { type: "Console", options: { level: "info", formatter: "short" } },
};
