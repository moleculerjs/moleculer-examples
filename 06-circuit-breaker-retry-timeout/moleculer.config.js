// moleculer.config.js — shared by every node. The resilience features are switched on with
// env vars so each demo can show the "before" and the "after" with the same code.
module.exports = {
  nodeID: process.env.NODE_NAME || `node-${process.pid}`,
  transporter: process.env.TRANSPORTER || "nats://localhost:4222",

  requestTimeout: Number(process.env.REQUEST_TIMEOUT_MS || 0), // 0 = no timeout (the default!)

  retryPolicy: {
    enabled: process.env.RETRY === "1",
    retries: 3,
    delay: 100, // first wait; then ×factor, capped at maxDelay
    maxDelay: 1000,
    factor: 2,
    check: (err) => err && !!err.retryable, // only errors that say "try again" — never a 4xx
  },

  circuitBreaker: {
    enabled: process.env.CB === "1",
    threshold: 0.5, // open when ≥ 50 % of the last window failed…
    minRequestCount: 5, // …but only after at least 5 calls (default 20)
    windowTime: 60, // seconds the counters are kept
    halfOpenTime: 5 * 1000, // ms until a single probe call is let through (default 10 s)
    check: (err) => err && err.code >= 500, // what counts as a failure
  },

  logger: { type: "Console", options: { level: process.env.LOG_LEVEL || "warn", formatter: "short" } },
};
