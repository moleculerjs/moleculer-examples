// nest/gateway.ts — a NestJS HTTP app that calls the products microservice over NATS.
import "reflect-metadata";
import { Controller, Get, Module, Param, ParseIntPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ClientsModule, ClientProxy, Transport } from "@nestjs/microservices";
import { Inject } from "@nestjs/common";
import { firstValueFrom, timeout } from "rxjs";

@Controller("products")
class ProductsGatewayController {
  constructor(@Inject("PRODUCTS") private readonly client: ClientProxy) {}

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    // send() returns an Observable; you add timeouts/retries yourself.
    return firstValueFrom(this.client.send("products.get", { id }).pipe(timeout(2000)));
  }
}

@Module({
  imports: [
    ClientsModule.register([
      { name: "PRODUCTS", transport: Transport.NATS, options: { servers: ["nats://localhost:4222"] } },
    ]),
  ],
  controllers: [ProductsGatewayController],
})
class GatewayModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, { logger: ["error", "warn"] });
  await app.listen(process.env.PORT || 3000);
  console.log(`gateway on http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();
