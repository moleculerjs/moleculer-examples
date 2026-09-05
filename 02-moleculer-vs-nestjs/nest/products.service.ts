// nest/products.service.ts — a NestJS "microservice": a NATS listener with message patterns.
import "reflect-metadata";
import { Controller, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { MessagePattern, Payload, Transport, MicroserviceOptions } from "@nestjs/microservices";

@Controller()
class ProductsController {
  @MessagePattern("products.get")
  get(@Payload() data: { id: number }) {
    return { id: data.id, name: `Product #${data.id}`, price: 42, servedBy: `products-${process.pid}` };
  }
}

@Module({ controllers: [ProductsController] })
class ProductsModule {}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ProductsModule, {
    transport: Transport.NATS,
    options: { servers: ["nats://localhost:4222"], queue: "products" }, // queue group = load balancing
  });
  await app.listen();
  console.log(`products microservice up (pid ${process.pid})`);
}
bootstrap();
