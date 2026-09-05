// services/bench.service.js — measures event delivery latency on whatever transporter is configured.
// The emitter stamps Date.now() into each event; this node records the difference on arrival
// (same machine, same clock). bench.stats returns the percentiles.
module.exports = {
  name: "bench",

  created() {
    this.lat = [];
  },

  events: {
    "bench.tick"(ctx) {
      this.lat.push(Date.now() - ctx.params.t);
    },
  },

  actions: {
    reset() {
      this.lat = [];
    },
    stats() {
      const s = [...this.lat].sort((a, b) => a - b);
      const p = (q) => s[Math.min(s.length - 1, Math.floor(s.length * q))];
      return { received: s.length, p50: p(0.5), p99: p(0.99), max: s[s.length - 1] };
    },
  },
};
