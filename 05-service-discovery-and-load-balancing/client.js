// client.js — a node with no services of its own; it only calls greeter.hello.
//   node client.js calls 6         six calls, print who served each
//   node client.js loop 12         one call every 500 ms for 12 s (kill/start workers meanwhile)
//   node client.js nodes           what this node's registry currently knows
const { ServiceBroker } = require("moleculer");
const config = require("./moleculer.config");

const NAMES = ["ada", "linus", "grace", "dennis", "ken", "brian"];
const [mode = "calls", arg = "6"] = process.argv.slice(2);
const broker = new ServiceBroker({ ...config, nodeID: `client-${process.pid}` });

async function main() {
  await broker.start();
  await broker.waitForServices("greeter");

  if (mode === "calls") {
    for (let i = 0; i < Number(arg); i++) {
      const name = NAMES[i % NAMES.length];
      const res = await broker.call("greeter.hello", { name });
      console.log(`${name.padEnd(7)} → ${res.servedBy}`);
    }
  }

  if (mode === "loop") {
    const end = Date.now() + Number(arg) * 1000;
    const t0 = Date.now();
    while (Date.now() < end) {
      const t = ((Date.now() - t0) / 1000).toFixed(1).padStart(5);
      try {
        const res = await broker.call("greeter.hello", { name: "ada" }, { timeout: 2000 });
        console.log(`t=${t}s  → ${res.servedBy}`);
      } catch (err) {
        console.log(`t=${t}s  ✗ ${err.name}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (mode === "nodes") {
    const nodes = await broker.call("$node.list", { withServices: true });
    for (const n of nodes) {
      const svcs = n.services.map((s) => s.name).filter((s) => !s.startsWith("$")).join(",") || "-";
      console.log(`${n.id.padEnd(18)} available=${n.available}  zone=${n.metadata.zone}  services=${svcs}`);
    }
  }

  await broker.stop();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
