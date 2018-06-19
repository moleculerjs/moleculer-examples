"use strict";

module.exports = {
	logger: true,
	logLevel: "info",
	logFormatter: "short",
	cacher: {
		type: "memory",
		options: {
			maxParamsLength: 100
		}
	},
	metrics: true
};
