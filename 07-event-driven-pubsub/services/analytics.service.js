// services/analytics.service.js — a second subscriber, with a wildcard. It gets every order.* event
// (its own copy — balancing is per service, not per cluster) plus the chained email.sent.
const { log } = require("./log");

module.exports = {
  name: "analytics",

  events: {
    "order.*"(ctx) {
      log(this, `${ctx.eventName} #${ctx.params.id} — ${ctx.eventType} from ${ctx.nodeID}, level ${ctx.level}`);
    },
    "email.sent"(ctx) {
      log(this, `email.sent for #${ctx.params.orderId} to ${ctx.params.to} — requestID ${ctx.requestID.slice(0, 8)}, level ${ctx.level}`);
    },
  },
};
