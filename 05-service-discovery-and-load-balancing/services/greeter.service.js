// services/greeter.service.js — the only service in this article.
// Every response says which node served it, so load balancing is visible.
module.exports = {
  name: "greeter",
  actions: {
    hello: {
      params: { name: "string" },
      handler(ctx) {
        return { hello: ctx.params.name, servedBy: this.broker.nodeID };
      },
    },
  },
};
