// services/products.service.ts — schema style, the idiomatic Moleculer form, in TypeScript.
import type { ServiceSchema, Context } from "moleculer";
import type { Product, Meta } from "../src/contracts";

// Typed settings and methods. Passing them as generics makes `this.settings.x`
// and `this.findOrFail(...)` type-checked inside handlers.
interface Settings {
  currency: string;
}

interface Methods {
  findOrFail(id: number): Product;
}

const catalogue: Product[] = [
  { id: 1, name: "Keyboard", price: 79 },
  { id: 2, name: "Monitor", price: 329 },
  { id: 3, name: "Cable", price: 9 },
];

const ProductsService: ServiceSchema<Settings, Methods> = {
  name: "products",

  settings: { currency: "EUR" },

  actions: {
    get: {
      // Runtime validation (fastest-validator) — the compiler cannot check what arrives over the wire.
      params: { id: { type: "number", convert: true } },
      handler(ctx: Context<{ id: number }, Meta>): Product {
        this.logger.info(`get #${ctx.params.id} for user ${ctx.meta.userId ?? "anonymous"}`);
        return this.findOrFail(ctx.params.id);   // typed via Methods
      },
    },

    list: {
      params: { limit: { type: "number", optional: true, convert: true } },
      handler(ctx: Context<{ limit?: number }, Meta>): Product[] {
        return catalogue.slice(0, ctx.params.limit ?? catalogue.length);
      },
    },
  },

  methods: {
    findOrFail(id) {
      const p = catalogue.find(p => p.id === id);
      if (!p) throw new Error(`Product ${id} not found`);
      return p;
    },
  },

  started() {
    this.logger.info(`products up, prices in ${this.settings.currency}`);   // typed via Settings
  },
};

export default ProductsService;
