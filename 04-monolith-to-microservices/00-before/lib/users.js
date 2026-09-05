// lib/users.js — a module in the monolith. Other modules require() it directly.
const users = new Map([
  [1, { id: 1, name: "Ada", email: "ada@example.com" }],
  [2, { id: 2, name: "Linus", email: "linus@example.com" }],
]);

exports.get = (id) => {
  const u = users.get(id);
  if (!u) throw new Error(`User ${id} not found`);
  return u;
};
