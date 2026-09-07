// moleculer.config.js — shared by every node in the demos.
// TRANSPORTER picks the message broker; nothing else changes between NATS, Redis and Kafka.
// CHANNELS=1 adds @moleculer/channels (durable messages over Redis Streams) for the last demo.
const { Middleware: ChannelsMiddleware } = require("@moleculer/channels");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

module.exports = {
  nodeID: process.env.NODE_NAME || `node-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",
  // e.g. "redis://localhost:6379"  or  "kafka://localhost:9092"

  logger: { type: "Console", options: { level: process.env.LOG_LEVEL || "warn", formatter: "short" } },

  middlewares:
    process.env.CHANNELS === "1"
      ? [
          ChannelsMiddleware({
            adapter: {
              type: "Redis",
              options: {
                maxRetries: 3, // then dead-letter (or drop, if dead-lettering is off)
                deadLettering: { enabled: true, queueName: "FAILED_MESSAGES" },
                redis: {
                  url: REDIS_URL,
                  consumerOptions: {
                    minIdleTime: 1000, // an unacked message is retried after 1 s (default: 1 hour)
                    claimInterval: 200,
                    processingAttemptsInterval: 500,
                  },
                },
              },
            },
          }),
        ]
      : [],
};
