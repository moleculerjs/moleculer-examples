// services/mailer.service.js — a subscriber. Run two instances to see balanced vs broadcast delivery.
const { log } = require("./log");

const FAIL_ORDER = Number(process.env.FAIL_ORDER || 0); // this order ID makes the handler throw

module.exports = {
  name: "mailer",

  events: {
    "order.created": {
      // event payloads can be validated like action params (same fastest-validator schema)
      params: { id: "number", sku: "string", total: "number" },
      async handler(ctx) {
        const { id, sku } = ctx.params;
        log(this, `order.created #${id} (${sku}) — requestID ${ctx.requestID.slice(0, 8)}, meta.user ${ctx.meta.user}, level ${ctx.level}`);
        if (id === FAIL_ORDER) throw new Error(`SMTP is down, could not mail order #${id}`);
        // events can chain: the context carries the same requestID one level deeper
        await ctx.emit("email.sent", { orderId: id, to: `${ctx.meta.user}@example.com` });
      },
    },

    "order.cancelled"(ctx) {
      log(this, `order.cancelled #${ctx.params.id} — dropping queued emails for it`);
    },
  },

  // Only active when the @moleculer/channels middleware is registered (CHANNELS=1).
  // The handler gets the raw payload — no Moleculer context — because the message may have
  // been produced by anything that can write to the stream.
  channels: {
    "order.created": {
      async handler(payload) {
        log(this, `[channel] order.created #${payload.id} (${payload.sku})`);
        if (payload.id === FAIL_ORDER) throw new Error(`SMTP is down, could not mail order #${payload.id}`);
      },
    },
  },
};
