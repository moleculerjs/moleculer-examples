// prefer-zone.strategy.js — a custom load-balancing strategy in ~15 lines.
// Picks an instance in the caller's own zone when one is alive; falls back to any instance.
const { Strategies } = require("moleculer");

class PreferZoneStrategy extends Strategies.Base {
  constructor(registry, broker, opts) {
    super(registry, broker, opts);
    this.zone = broker.metadata.zone;
    this.fallback = new Strategies.RoundRobin(registry, broker, opts);
  }

  select(endpoints, ctx) {
    const local = endpoints.filter((ep) => ep.node.metadata?.zone === this.zone);
    return this.fallback.select(local.length ? local : endpoints, ctx);
  }
}

module.exports = PreferZoneStrategy;
