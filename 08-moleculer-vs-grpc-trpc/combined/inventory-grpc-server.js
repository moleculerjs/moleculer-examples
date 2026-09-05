// combined/inventory-grpc-server.js — the "foreign" gRPC service. It is Node here only so the demo
// runs in one repo; nothing in the Moleculer side depends on that.
//   node inventory-grpc-server.js           (PORT=50060, SLOW_MS to simulate latency)
const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const pkg = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(__dirname, "inventory.proto"), { keepCase: true, defaults: true })).inventory;
const STOCK = { "SKU-1": 42, "SKU-2": 0 };
const SLOW_MS = Number(process.env.SLOW_MS || 0);

const server = new grpc.Server();
server.addService(pkg.Inventory.service, {
  Check(call, callback) {
    const { sku } = call.request;
    const reply = () =>
      sku in STOCK
        ? callback(null, { sku, in_stock: STOCK[sku], warehouse: "WH-EU-1" })
        : callback({ code: grpc.status.NOT_FOUND, details: `unknown sku ${sku}` });
    SLOW_MS ? setTimeout(reply, SLOW_MS) : reply();
  },
});
const PORT = process.env.PORT || 50060;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => console.log(`[inventory-grpc] gRPC inventory server on :${PORT}`));
