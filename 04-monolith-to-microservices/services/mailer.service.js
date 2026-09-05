// services/mailer.service.js — lib/mailer.js as a service. Instead of being called, it reacts to an event.
module.exports = {
  name: "mailer",
  events: {
    "order.created"(ctx) {
      const { order, user } = ctx.params;
      this.logger.info(`→ ${user.email}: Order #${order.id} confirmed (${order.item})`);
    },
  },
};
