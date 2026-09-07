// src/client.ts — a caller process using the typed wrapper.
import { ServiceBroker } from "moleculer";
import { call } from "./typed-broker";

const broker = new ServiceBroker({
  nodeID: `client-${process.pid}`,
  // The typed form. (The "nats://…" string shorthand works at runtime but is not in BrokerOptions' type.)
  transporter: { type: "NATS", options: { url: process.env.TRANSPORTER ?? "nats://localhost:4222" } },
  logger: false,
});

async function main() {
  await broker.start();
  await broker.waitForServices(["products", "orders"]);

  const product = await call(broker, "products.get", { id: 2 });
  console.log("product:", product.name, product.price);        // product is typed as Product

  const order = await call(broker, "orders.create", { productId: 2, quantity: 3 });
  console.log("order:", order.id, "total", order.total);       // order is typed as Order

  // Runtime validation still guards the wire: force a bad payload past the compiler.
  try {
    await call(broker, "products.get", { id: "two" as unknown as number });
  } catch (err: any) {
    console.log("rejected:", err.name, "-", err.data?.[0]?.message);
  }

  await broker.stop();
}
main();
