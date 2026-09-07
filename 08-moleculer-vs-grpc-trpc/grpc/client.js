// grpc/client.js — calls the gRPC products service.
//   node client.js get 2               → one address, one call
//   node client.js rr 6                → client-side round robin over two addresses
//   node client.js deadline 2          → 300 ms deadline against a slow server
//   node client.js retry 3             → retryPolicy from the service config
//   node client.js bench 2000          → sequential unary calls
const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const pkg = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, "products.proto"), { keepCase: true, longs: Number, defaults: true })
).products;

const [mode = "get", arg] = process.argv.slice(2);
const ADDRS = process.env.ADDRS || "127.0.0.1:50051,127.0.0.1:50052";

// Client-side load balancing: gRPC needs a resolver that yields several addresses (DNS, xDS, or a
// static "ipv4:" list) and a service config that picks round_robin instead of the default pick_first.
const serviceConfig = {
  loadBalancingConfig: [{ round_robin: {} }],
  methodConfig: [
    {
      name: [{ service: "products.Products" }],
      retryPolicy: {
        maxAttempts: 3,
        initialBackoff: "0.1s",
        maxBackoff: "1s",
        backoffMultiplier: 2,
        retryableStatusCodes: ["UNAVAILABLE"],
      },
    },
  ],
};

const target = mode === "get" || mode === "deadline" || mode === "bench" ? ADDRS.split(",")[0] : `ipv4:${ADDRS}`;
const client = new pkg.Products(target, grpc.credentials.createInsecure(), {
  "grpc.service_config": JSON.stringify(serviceConfig),
  "grpc.enable_retries": 1,
});

const get = (id, opts = {}) =>
  new Promise((resolve, reject) => client.Get({ id }, opts, (err, res) => (err ? reject(err) : resolve(res))));

(async () => {
  if (mode === "get") {
    try {
      const p = await get(Number(arg || 1));
      console.log(`  → ${JSON.stringify(p)}`);
    } catch (err) {
      console.log(`  → error code ${err.code} ${grpc.status[err.code]}: ${err.details}`);
    }
  }

  if (mode === "rr") {
    for (let i = 0; i < Number(arg || 6); i++) {
      try {
        const p = await get(1);
        console.log(`  call ${i + 1}: served by ${p.served_by}`);
      } catch (err) {
        console.log(`  call ${i + 1}: ${grpc.status[err.code]} — ${err.details}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (mode === "deadline") {
    const t0 = Date.now();
    try {
      const p = await get(Number(arg || 1), { deadline: Date.now() + 300 });
      console.log(`  → ${p.served_by} answered in ${Date.now() - t0} ms`);
    } catch (err) {
      console.log(`  → ${grpc.status[err.code]} after ${Date.now() - t0} ms — ${err.details}`);
    }
  }

  if (mode === "retry") {
    // both instances are listed; the retryPolicy above re-sends UNAVAILABLE calls
    for (let i = 0; i < Number(arg || 3); i++) {
      const t0 = Date.now();
      try {
        const p = await get(1);
        console.log(`  call ${i + 1}: served by ${p.served_by} (${Date.now() - t0} ms)`);
      } catch (err) {
        console.log(`  call ${i + 1}: ${grpc.status[err.code]} after ${Date.now() - t0} ms — ${err.details}`);
      }
    }
  }

  if (mode === "bench") {
    const n = Number(arg || 2000);
    await get(1); // warm up the connection
    const t0 = Date.now();
    for (let i = 0; i < n; i++) await get(1);
    const ms = Date.now() - t0;
    console.log(`  gRPC unary, sequential: ${n} calls in ${ms} ms (${Math.round((n / ms) * 1000)} req/s, ${(ms / n).toFixed(2)} ms/call)`);
    const t1 = Date.now();
    await Promise.all(Array.from({ length: n }, () => get(1)));
    const ms2 = Date.now() - t1;
    console.log(`  gRPC unary, ${n} in flight: ${ms2} ms (${Math.round((n / ms2) * 1000)} req/s)`);
  }

  client.close();
})().catch((err) => { console.error(err); process.exit(1); });
