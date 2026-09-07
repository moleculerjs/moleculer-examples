// trpc/server.ts — the products service as a tRPC router over plain HTTP.
// Run two of them:  PORT=4001 npx tsx server.ts   and   PORT=4002 npx tsx server.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { PRODUCTS, NAME } from "../data";

const t = initTRPC.create();

export const appRouter = t.router({
  products: t.router({
    get: t.procedure
      .input(z.object({ id: z.number().int() }))
      .query(({ input }) => {
        const product = PRODUCTS.find((p) => p.id === input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `product ${input.id} not found` });
        return { ...product, servedBy: NAME };
      }),
    list: t.procedure
      .input(z.object({ limit: z.number().int().default(10) }))
      .query(({ input }) => PRODUCTS.slice(0, input.limit).map((p) => ({ ...p, servedBy: NAME }))),
  }),
});

// The client imports this TYPE only — no code, no schema file, no codegen.
export type AppRouter = typeof appRouter;

const PORT = Number(process.env.PORT || 4001);
createHTTPServer({ router: appRouter }).listen(PORT);
console.log(`[${NAME}] tRPC products server on :${PORT}`);
