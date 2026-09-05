// moleculer/products.service.js — the products service as a Moleculer service.
// Run two of them:  NODE_NAME=products-1 node node.js   and   NODE_NAME=products-2 node node.js
const { Errors } = require("moleculer");
const { PRODUCTS, NAME } = require("../data");

const SLOW_MS = Number(process.env.SLOW_MS || 0); // simulate a slow instance

module.exports = {
  name: "products",

  actions: {
    get: {
      params: { id: "number|integer|convert" }, // fastest-validator schema — same idea as zod / proto types
      async handler(ctx) {
        const product = PRODUCTS.find((p) => p.id === ctx.params.id);
        if (!product) throw new Errors.MoleculerClientError(`product ${ctx.params.id} not found`, 404, "NOT_FOUND", { id: ctx.params.id });
        if (SLOW_MS) await new Promise((r) => setTimeout(r, SLOW_MS));
        return { ...product, servedBy: NAME };
      },
    },
    list: {
      params: { limit: { type: "number", integer: true, default: 10 } },
      handler(ctx) {
        return PRODUCTS.slice(0, ctx.params.limit).map((p) => ({ ...p, servedBy: NAME }));
      },
    },
  },
};
