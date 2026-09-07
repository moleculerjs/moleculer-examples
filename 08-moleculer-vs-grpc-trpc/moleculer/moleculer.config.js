// moleculer/moleculer.config.js — shared by the service nodes and the client
module.exports = {
  nodeID: process.env.NODE_NAME || `node-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222", // or "TCP" — no broker at all
  logger: { type: "Console", options: { level: process.env.LOG_LEVEL || "warn", formatter: "short" } },
  heartbeatInterval: 2,
  heartbeatTimeout: 6,
  requestTimeout: 300, // like a gRPC deadline, but a broker-wide default; per-call override: broker.call(…, { timeout })
  retryPolicy: {
    enabled: true, // the policy must be enabled here for a per-call `retries` to have any effect
    retries: 0, // …but by default we don't retry; the demo passes { retries: 1 } per call
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: (err) => err && !!err.retryable, // timeouts and "service unavailable" are; a 404 is not
  },
  circuitBreaker: {
    enabled: true,
    threshold: 0.5, // open when ≥ 50 % of the calls in the window failed…
    minRequestCount: 3, // …after at least 3 calls (default 20)
    windowTime: 60,
    halfOpenTime: 5000, // ms until a probe call is let through again
    check: (err) => err && err.code >= 500,
  },
};
