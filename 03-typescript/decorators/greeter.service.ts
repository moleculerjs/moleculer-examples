// decorators/greeter.service.ts — community package moleculer-decorators (class + decorators style).
import { ServiceBroker, Context, Service as MoleculerService } from "moleculer";
import { Service, Action, Event, Method } from "moleculer-decorators";

@Service({ name: "greeter", settings: { greeting: "Hello" } })
class GreeterService extends MoleculerService<{ greeting: string }> {
  @Action({ params: { name: "string" } })
  hello(ctx: Context<{ name: string }>) {
    return this.format(ctx.params.name);
  }

  @Method
  format(name: string) {
    return `${this.settings.greeting}, ${name}!`;
  }

  @Event()
  "user.signup"(ctx: Context<{ name: string }>) {
    this.logger.info(`welcome mail to ${ctx.params.name}`);
  }
}

const broker = new ServiceBroker({ logger: false });
broker.createService(GreeterService);
broker.start()
  .then(() => broker.call("greeter.hello", { name: "Ada" }))
  .then(res => { console.log(res); return broker.stop(); });
