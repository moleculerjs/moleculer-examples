// combined/inventory.service.js — a Moleculer service that is a thin wrapper around a gRPC client.
// Everything else in the cluster calls `inventory.check` and gets discovery, retry and the circuit
// breaker for free; only this file knows that gRPC exists.
const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Errors } = require("moleculer");

const pkg = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(__dirname, "inventory.proto"), { keepCase: true, defaults: true })).inventory;

module.exports = {
  name: "inventory",
  settings: { grpcAddress: process.env.INVENTORY_GRPC || "127.0.0.1:50060" },

  actions: {
    check: {
      params: { sku: "string" },
      handler(ctx) {
        return new Promise((resolve, reject) => {
          // Turn the Moleculer timeout budget into a gRPC deadline, so the remote side stops too.
          const opts = ctx.options.timeout > 0 ? { deadline: Date.now() + ctx.options.timeout } : {};
          this.client.Check({ sku: ctx.params.sku }, opts, (err, res) => (err ? reject(this.mapError(err, ctx)) : resolve({ sku: res.sku, inStock: res.in_stock, warehouse: res.warehouse })));
        });
      },
    },
  },

  methods: {
    // gRPC status → Moleculer error, so callers see the same error shapes as from any other service
    mapError(err, ctx) {
      switch (err.code) {
        case grpc.status.NOT_FOUND:
          return new Errors.MoleculerClientError(err.details, 404, "NOT_FOUND", { sku: ctx.params.sku });
        case grpc.status.DEADLINE_EXCEEDED:
          this.logger.warn(`gRPC deadline hit for sku ${ctx.params.sku} (budget was ${ctx.options.timeout} ms)`);
          return new Errors.RequestTimeoutError({ action: "inventory.check (gRPC)", nodeID: this.settings.grpcAddress });
        case grpc.status.UNAVAILABLE:
          return new Errors.MoleculerRetryableError(`inventory gRPC backend unavailable: ${err.details}`, 503, "UNAVAILABLE");
        default:
          return new Errors.MoleculerError(err.details || err.message, 500, `GRPC_${grpc.status[err.code]}`);
      }
    },
  },

  created() {
    this.client = new pkg.Inventory(this.settings.grpcAddress, grpc.credentials.createInsecure());
  },
  stopped() {
    this.client.close();
  },
};
