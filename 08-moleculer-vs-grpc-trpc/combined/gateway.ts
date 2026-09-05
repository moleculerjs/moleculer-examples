// combined/gateway.ts — tRPC in front of a Moleculer cluster.
// The browser gets end-to-end types; the procedures don't implement anything, they call the cluster.
//   npx tsx gateway.ts            (needs products-1 / products-2 running on the same transporter)
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { ServiceBroker, type BrokerOptions } from "moleculer";
import config from "../moleculer/moleculer.config.js";

// This node runs no services of its own — it is a client of the cluster, like the CLI client.
// The cast: the "nats://…" string form of `transporter` is not in BrokerOptions (see post 3).
const broker = new ServiceBroker({ ...(config as BrokerOptions), nodeID: process.env.NODE_NAME || "trpc-gateway" });

// What the Moleculer action returns. Declared here because broker.call() is untyped (see post 3).
type Product = { id: number; name: string; price: number; servedBy: string };

const t = initTRPC.create();

const toTRPCError = (err: any) =>
  err?.code === 404
    ? new TRPCError({ code: "NOT_FOUND", message: err.message })
    : err?.code === 504
      ? new TRPCError({ code: "TIMEOUT", message: err.message })
      : new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message ?? String(err) });

export const gatewayRouter = t.router({
  products: t.router({
    get: t.procedure
      .input(z.object({ id: z.number().int() }))
      .query(({ input }) => broker.call<Product, { id: number }>("products.get", input).catch((e) => { throw toTRPCError(e); })),
    list: t.procedure
      .input(z.object({ limit: z.number().int().default(10) }))
      .query(({ input }) => broker.call<Product[], { limit: number }>("products.list", input)),
  }),
});
export type GatewayRouter = typeof gatewayRouter;

const PORT = Number(process.env.PORT || 4010);
broker.start().then(async () => {
  await broker.waitForServices("products", 15000);
  createHTTPServer({ router: gatewayRouter }).listen(PORT);
  console.log(`[${broker.nodeID}] tRPC gateway on :${PORT}, backed by ${broker.registry.getActionEndpoints("products.get")!.endpoints.map((e) => e.id).join(", ")}`);
});
