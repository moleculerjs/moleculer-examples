// lib/orders.js — calls users and mailer through plain imports. Tight coupling, zero ceremony.
const users = require("./users");
const mailer = require("./mailer");

let counter = 0;
const orders = [];

exports.create = ({ userId, item, amount }) => {
  const user = users.get(userId);
  const order = { id: ++counter, userId, item, amount };
  orders.push(order);
  mailer.send(user.email, `Order #${order.id} confirmed (${item})`);
  return order;
};
