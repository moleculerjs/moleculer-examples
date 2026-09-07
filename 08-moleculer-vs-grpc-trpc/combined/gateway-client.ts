// combined/gateway-client.ts — the same typed tRPC client as before, now the answers come from the cluster.
//   npx tsx gateway-client.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { GatewayRouter } from "./gateway";

const client = createTRPCClient<GatewayRouter>({
  links: [httpBatchLink({ url: process.env.URL || "http://127.0.0.1:4010", maxItems: 100 })],
});

(async () => {
  for (let i = 0; i < 4; i++) {
    const p = await client.products.get.query({ id: 1 });
    //    ^? { id: number; name: string; price: number; servedBy: string }
    console.log(`  call ${i + 1}: ${p.name} served by ${p.servedBy}`);
  }
  try {
    await client.products.get.query({ id: 99 });
  } catch (err: any) {
    console.log(`  id 99: ${err.data?.code} (HTTP ${err.data?.httpStatus}) — ${err.message}`);
  }
})();
