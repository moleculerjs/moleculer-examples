"use strict";

const os = require("os");

module.exports = {
	nodeID: (process.env.NODEID ? process.env.NODEID + "-" : "") + os.hostname().toLowerCase(),
	metrics: true,
	statistics: true
};