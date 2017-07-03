/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const os = require("os");
const ServiceBroker = require("moleculer").ServiceBroker;
const Cachers = require("moleculer").Cachers;
const Transporters = require("moleculer").Transporters;

function getCacher() {
	switch(process.env.MOL_CACHER) {
	case "memory": return new Cachers.Memory();
	case "redis": return new Cachers.Redis(process.env.MOL_REDIS_URI);
	}
}

function getTransporter() {
	switch(process.env.MOL_TRANSPORTER) {
	case "nats": return new Transporters.NATS(process.env.MOL_NATS_URI);
	case "mqtt": return new Transporters.MQTT(process.env.MOL_MQTT_URI);
	}
}

// Get cacher
let cacher = getCacher();

// Get transporter
let transporter = getTransporter();

// Create broker
const broker = new ServiceBroker({
	nodeID: process.env.MOL_NODE_ID + "-" + os.hostname().toLowerCase(),

	cacher,
	transporter,
	
	metrics: process.env.MOL_METRICS,
	statistics: process.env.MOL_STATISTICS,

	logger: console,
	//logger: winston,
	logLevel: process.env.MOL_LOGLEVEL || "info",
});

// Load services
let serviceList;
if (process.env.MOL_SERVICES)
	serviceList = process.env.MOL_SERVICES.split(",");

broker.loadServices("./services", serviceList);

broker.start();