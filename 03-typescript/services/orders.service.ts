// services/orders.service.ts — class style: extend Service and hand it the schema.
// Handlers are ordinary methods, so `this` is the class and private helpers are just methods.
import { Service, ServiceBroker } from "moleculer";
import type { Order } from "../src/contracts";
import { call, emit, type Ctx, type EventCtx } from "../src/typed-broker";

export default class OrdersService extends Service {
  private orders: Order[] = [];

  constructor(broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "orders",
      actions: {
        create: {
          params: {
            productId: { type: "number", convert: true },
            quantity: { type: "number", min: 1, convert: true },
          },
          handler: this.create,
        },
      },
      events: {
        "order.created": this.onOrderCreated,
      },
    });
  }

  async create(ctx: Ctx<"orders.create">): Promise<Order> {
    // Typed call: action name autocompletes, params are checked, result is Product.
    const product = await call(ctx, "products.get", { id: ctx.params.productId });

    const order: Order = {
      id: `ord_${this.orders.length + 1}`,
      productId: product.id,
      quantity: ctx.params.quantity,
      total: product.price * ctx.params.quantity,
    };
    this.orders.push(order);

    await emit(ctx, "order.created", order);   // payload must be an Order
    return order;
  }

  onOrderCreated(ctx: EventCtx<"order.created">) {
    this.logger.info(`event: order ${ctx.params.id} created, total ${ctx.params.total}`);
  }
}
