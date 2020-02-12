"use strict";

const path = require("path");
const mkdir = require("mkdirp").sync;

const DbService = require("moleculer-db");

module.exports = function (collection) {
	if (process.env.MONGO_URI) {
		// Mongo adapter
		const MongoAdapter = require("moleculer-db-adapter-mongo");

		return {
			mixins: [DbService],
			adapter: new MongoAdapter(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }),
			collection
		};
	}

	// --- NeDB fallback DB adapter

	// Create data folder
	mkdir(path.resolve("./data"));

	return {
		mixins: [DbService],
		adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` }),

		methods: {
			async entityChanged(type, json, ctx) {
				await this.clearCache();
				const eventName = `${this.name}.entity.${type}`;
				this.broker.emit(eventName, { meta: ctx.meta, entity: json });
			}
		}
	};
};
