// services/users.service.js — lib/users.js as a service. Same data, same logic; the export became an action.
const { Errors } = require("moleculer");

const users = new Map([
  [1, { id: 1, name: "Ada", email: "ada@example.com" }],
  [2, { id: 2, name: "Linus", email: "linus@example.com" }],
]);

module.exports = {
  name: "users",
  actions: {
    get: {
      params: { id: { type: "number", convert: true } },
      handler(ctx) {
        const u = users.get(ctx.params.id);
        if (!u) throw new Errors.MoleculerClientError(`User ${ctx.params.id} not found`, 404, "USER_NOT_FOUND");
        return { ...u, servedBy: this.broker.nodeID };
      },
    },
  },
};
