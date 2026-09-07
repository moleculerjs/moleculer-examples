// services/support.service.js — consumes the dead-letter queue (CHANNELS=1 only).
// A message lands here after the mailer failed it maxRetries times.
const { log } = require("./log");

module.exports = {
  name: "support",

  channels: {
    FAILED_MESSAGES: {
      context: true, // ctx.headers carries the error info the adapter attached (x-error-*)
      async handler(ctx) {
        log(this, `[dead-letter] order #${ctx.params.id} — ${ctx.headers["x-error-name"]}: ${ctx.headers["x-error-message"]}`);
      },
    },
  },
};
