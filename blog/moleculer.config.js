"use strict";

const os = require("os");

module.exports = {
	// Append hostname to nodeID. It will be unique when scale up instances in Docker
	nodeID: (process.env.NODEID ? process.env.NODEID + "-" : "") + os.hostname().toLowerCase(),
	metrics: false,
	cacher: true,
	tracing: {
		enabled: true,
		exporter: {
			type: "Console", // Console exporter is only for development!
			options: {
				// Custom logger
				logger: null,
				// Using colors
				colors: true,
				// Width of row
				width: 100,
				// Gauge width in the row
				gaugeWidth: 40
			}
		}
	},

	errorHandler(err, info) {
		this.logger.warn("Log the error:", err);
		throw err; // Throw further
	}
};
