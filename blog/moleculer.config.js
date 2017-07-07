"use strict";

const os = require("os");

module.exports = {
	// Append hostname to nodeID. It will be unique when scale up instances in Docker
	nodeID: (process.env.NODEID ? process.env.NODEID + "-" : "") + os.hostname().toLowerCase(),
	metrics: true,
	statistics: true,
	//cacher: true
};