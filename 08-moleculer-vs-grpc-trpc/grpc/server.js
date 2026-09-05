// grpc/server.js — the products service as a gRPC server (@grpc/grpc-js, proto loaded at runtime).
// Run two of them:  PORT=50051 node server.js   and   PORT=50052 node server.js
const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { PRODUCTS, NAME } = require("../data");

const pkg = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, "products.proto"), { keepCase: true, longs: Number, defaults: true })
).products;

const PORT = process.env.PORT || "50051";
const SLOW_MS = Number(process.env.SLOW_MS || 0); // simulate a slow instance

const server = new grpc.Server();
server.addService(pkg.Products.service, {
  Get(call, callback) {
    const product = PRODUCTS.find((p) => p.id === call.request.id);
    if (!product) return callback({ code: grpc.status.NOT_FOUND, message: `product ${call.request.id} not found` });
    const reply = () => callback(null, { ...product, served_by: NAME });
    SLOW_MS ? setTimeout(reply, SLOW_MS) : reply();
  },
  List(call, callback) {
    callback(null, { items: PRODUCTS.slice(0, call.request.limit || 10).map((p) => ({ ...p, served_by: NAME })) });
  },
});

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) throw err;
  console.log(`[${NAME}] gRPC products server on :${PORT}`);
});
