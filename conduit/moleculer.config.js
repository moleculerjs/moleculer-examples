"use strict";

module.exports = {
	namespace: "conduit",
	//transporter: "TCP",
	logger: true,
	logLevel: "info",
	cacher: {
		type: "memory",
		options: {
			maxParamsLength: 100
		}
	},
	metrics: false,

	tracing: {
		enabled: true,
		exporter: [
			{
				type: "Console",
				options: {
					width: 100,
					colors: true,
				}
			}
		]
	},

	validator: true
};
