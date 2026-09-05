// app.js — the "before" picture: one Express process, modules wired by require().
const express = require("express");
const users = require("./lib/users");
const orders = require("./lib/orders");

const app = express();
app.use(express.json());

app.get("/users/:id", (req, res) => res.json(users.get(Number(req.params.id))));
app.post("/orders", (req, res) => {
  const userId = Number(req.header("x-user-id"));
  res.status(201).json(orders.create({ userId, ...req.body }));
});

app.listen(process.env.PORT || 3000, () => console.log("monolith on", process.env.PORT || 3000));
