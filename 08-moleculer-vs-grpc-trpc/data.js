// data.js — shared fixture for all three implementations
exports.PRODUCTS = [
  { id: 1, name: "Keyboard", price: 49.9 },
  { id: 2, name: "Mouse", price: 19.9 },
  { id: 3, name: "Monitor", price: 219.0 },
];

// instance name: NODE_NAME if set, otherwise derived from the port
exports.NAME = process.env.NODE_NAME || `products-${process.env.PORT || process.pid}`;
