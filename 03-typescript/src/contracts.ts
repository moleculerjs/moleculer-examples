// src/contracts.ts — shared types for the actions in this system.
// Moleculer does not generate these; you write them once and import them
// on both sides (service handler + caller), which is where the type safety comes from.

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  productId: number;
  quantity: number;
  total: number;
}

/** Action name → { params, result }. One place to look up what an action takes and returns. */
export interface Actions {
  "products.get": { params: { id: number }; result: Product };
  "products.list": { params: { limit?: number }; result: Product[] };
  "orders.create": { params: { productId: number; quantity: number }; result: Order };
}

/** Events and their payloads. */
export interface Events {
  "order.created": Order;
}

/** What every request carries in ctx.meta (set by the gateway, read by services). */
export interface Meta {
  userId?: string;
}
