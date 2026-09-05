// combined/inventory-client.js — any cluster member calls inventory.check like a normal action.
//   node inventory-client.js
const { ServiceBroker } = require("moleculer");
const config = require("../moleculer/moleculer.config.js");

const broker = new ServiceBroker({ ...config, nodeID: `client-${process.pid}` });
const show = async (params, opts, label) => {
  const t0 = Date.now();
  try {
    console.log(`  ${label}: ${JSON.stringify(await broker.call("inventory.check", params, opts))} (${Date.now() - t0} ms)`);
  } catch (err) {
    console.log(`  ${label}: ${err.name} (${err.code} ${err.type}) — ${err.message} (${Date.now() - t0} ms)`);
  }
};

(async () => {
  await broker.start();
  await broker.waitForServices("inventory", 15000);
  await show({ sku: "SKU-1" }, {}, "SKU-1");
  await show({ sku: "SKU-9" }, {}, "SKU-9");
  await show({ sku: "SKU-1" }, { timeout: 150 }, "SKU-1, timeout 150 ms vs a slow backend");
  await broker.stop();
})();
