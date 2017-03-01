const ServiceBroker = require("moleculer").ServiceBroker;

const winston = require("winston");
winston.level = 'debug';

const broker = new ServiceBroker({
	logger: console, // winston,
	logLevel: "debug"
});

broker.loadServices(__dirname + "/../services");

broker.start();