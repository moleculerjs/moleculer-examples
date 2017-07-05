"use strict";

//const ApiGatewayService = require("moleculer-web");
const path 		= require("path");
const express 	= require("express");
const morgan 	= require("morgan");
const _ 		= require("lodash");
const moment 	= require("moment");

module.exports = {
	name: "www",

	settings: {
		port: process.env.PORT || 3000
	},

	methods: {
		initRoutes(app) {
			app.get("/", this.getIndex);
		},

		getIndex(req, res) {
			this.broker.call("posts.findAll")
				.then(posts => {
					let data = {
						posts
					};

					return data;
				})
				.then(data => res.render("index", data));
		}
	},

	created() {
		const app = express();
		const baseFolder = path.join(__dirname, ".."); 

		app.locals._ = _;
		app.locals.truncateContent = val => _.truncate(val, { length: 100 });
		app.locals.moment = moment;

		app.use(express["static"](path.join(baseFolder, "public")));

		app.set("etag", true);
		app.enable("trust proxy");

		// Init morgan
		let stream = require("stream");
		let lmStream = new stream.Stream();

		lmStream.writable = true;
		lmStream.write = data => this.logger.info(data);

		app.use(morgan("dev", {
			stream: lmStream
		}));		

		// Set view folder
		app.set("views", path.join(baseFolder, "views"));
		app.set("view engine", "pug");

		this.initRoutes(app);		

		this.app = app;
	},

	started() {
		this.app.listen(Number(this.settings.port), err => {
			if (err)
				return this.broker.fatal(err);

			this.logger.info(`WWW server started on port ${this.settings.PORT}`);
		});

	},

	stopped() {
		if (this.app.listening) {
			this.app.close(err => {
				if (err) 
					return this.logger.error("WWW server close error!", err);

				this.logger.info("WWW server stopped!");			
			});
		}
	}
};
