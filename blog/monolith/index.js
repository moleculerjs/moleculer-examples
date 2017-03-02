const ServiceBroker = require("moleculer").ServiceBroker;
const MemoryCacher = require("moleculer").Cachers.Memory;

const winston = require("winston");
winston.level = "debug";

const broker = new ServiceBroker({
	//cacher: MemoryCacher,
	//metrics: true,
	//statistics: true,

	logger: console,
	//logger: winston,
	logLevel: "debug",
});

if (process.env.NODE_ENV == "production")
	broker.loadServices();
else
	broker.loadServices(__dirname + "/../services");

broker.start();