// moleculer.config.ts — broker options for moleculer-runner (it accepts .ts when a TS loader is registered).
import type { BrokerOptions } from "moleculer";

const config: BrokerOptions = {
  nodeID: `node-${process.pid}`,
  // The typed form. (The "nats://…" string shorthand works at runtime but is not in BrokerOptions' type.)
  transporter: { type: "NATS", options: { url: process.env.TRANSPORTER ?? "nats://localhost:4222" } },
  logger: { type: "Console", options: { formatter: "short" } },
  requestTimeout: 2000,
};

export default config;
