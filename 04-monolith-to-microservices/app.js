// app.js — the same Express app, now with a broker inside. Routes call services instead of modules.
//   Stage 1 (local bus):  node app.js                      → all services in this process, no transporter
//   Stage 2 (hybrid):     SERVICES=users,orders node app.js → only these here; the rest reachable over NATS
const express = require("express");
const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker({
  nodeID: `app-${process.pid}`,
  transporter: process.env.TRANSPORTER || null,     // null = local bus, in-process only
  logger: { type: "Console", options: { level: "info", formatter: "short" } },
});

const wanted = process.env.SERVICES === undefined ? ["users", "orders", "mailer"] : process.env.SERVICES.split(",").filter(Boolean);
for (const name of wanted) broker.createService(require(`./services/${name}.service.js`));

const app = express();
app.use(express.json());

app.get("/users/:id", async (req, res, next) => {
  try { res.json(await broker.call("users.get", { id: req.params.id })); } catch (e) { next(e); }
});
app.post("/orders", async (req, res, next) => {
  try {
    const userId = Number(req.header("x-user-id"));
    res.status(201).json(await broker.call("orders.create", { userId, ...req.body }));
  } catch (e) { next(e); }
});
app.use((err, req, res, next) => res.status(err.code || 500).json({ error: err.name, message: err.message }));

broker.start().then(() => {
  app.listen(process.env.PORT || 3000, () => broker.logger.info(`HTTP on ${process.env.PORT || 3000}`));
});
