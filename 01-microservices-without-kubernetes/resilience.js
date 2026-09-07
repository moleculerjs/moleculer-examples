// resilience.js — timeout, retry and circuit breaker are broker options, not extra libraries.
const { ServiceBroker, Errors } = require("moleculer");

const broker = new ServiceBroker({
  logger: false,
  requestTimeout: 500,                    // ms; a hanging call becomes a RequestTimeoutError
  retryPolicy: { enabled: true, retries: 2, delay: 50, factor: 2 },
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,                       // open when >50% of calls fail...
    minRequestCount: 5,                   // ...after at least 5 calls
    windowTime: 60,                       // seconds
    halfOpenTime: 5_000,                  // ms until we probe again
  },
});

let calls = 0;
broker.createService({
  name: "payments",
  actions: {
    charge: {
      retryPolicy: { enabled: false },     // retries make no sense for a non-idempotent charge
      handler() {
        calls++;
        throw new Errors.MoleculerError("gateway down", 503); // 5xx errors count against the breaker
      },
    },
    fallbackDemo: {
      fallback: () => ({ cached: true }),  // return this instead of throwing
      handler() { throw new Errors.MoleculerError("nope", 500); },
    },
  },
});

broker.start().then(async () => {
  for (let i = 1; i <= 8; i++) {
    try { await broker.call("payments.charge", { amount: 10 }); }
    catch (err) { console.log(`call ${i}: ${err.name} (${err.message})`); }
  }
  console.log("handler actually ran:", calls, "times");
  console.log("fallback:", await broker.call("payments.fallbackDemo"));
  await broker.stop();
});
