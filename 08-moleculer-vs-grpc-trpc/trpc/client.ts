// trpc/client.ts — a fully typed client, built from the router's TYPE alone.
//   npx tsx client.ts get 2
//   npx tsx client.ts rr 4          → there is no load balancing: one URL, one server
//   npx tsx client.ts bench 2000
import { createTRPCClient, httpBatchLink, httpLink } from "@trpc/client";
import type { AppRouter } from "./server";

const [mode = "get", arg] = process.argv.slice(2);
const URL = process.env.URL || "http://127.0.0.1:4001";

const client = createTRPCClient<AppRouter>({
  links: [process.env.BATCH === "0" ? httpLink({ url: URL }) : httpBatchLink({ url: URL, maxItems: 100 })],
});

(async () => {
  if (mode === "get") {
    try {
      const p = await client.products.get.query({ id: Number(arg || 1) });
      //    ^? { id: number; name: string; price: number; servedBy: string } — inferred, not declared
      console.log(`  → ${JSON.stringify(p)}`);
    } catch (err: any) {
      console.log(`  → error ${err.data?.code} (HTTP ${err.data?.httpStatus}): ${err.message}`);
    }
  }

  if (mode === "rr") {
    for (let i = 0; i < Number(arg || 4); i++) {
      const p = await client.products.get.query({ id: 1 });
      console.log(`  call ${i + 1}: served by ${p.servedBy}`);
    }
  }

  if (mode === "bench") {
    const n = Number(arg || 2000);
    await client.products.get.query({ id: 1 });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) await client.products.get.query({ id: 1 });
    const ms = Date.now() - t0;
    console.log(`  tRPC over HTTP, sequential: ${n} calls in ${ms} ms (${Math.round((n / ms) * 1000)} req/s, ${(ms / n).toFixed(2)} ms/call)`);
    const t1 = Date.now();
    await Promise.all(Array.from({ length: n }, () => client.products.get.query({ id: 1 })));
    const ms2 = Date.now() - t1;
    console.log(`  tRPC over HTTP, ${n} in flight${process.env.BATCH === "0" ? "" : " (batched)"}: ${ms2} ms (${Math.round((n / ms2) * 1000)} req/s)`);
  }
})();
