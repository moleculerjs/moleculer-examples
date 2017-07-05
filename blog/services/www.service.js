"use strict";

const path = require("path");
const express = require("express");
const morgan = require("morgan");
const _ = require("lodash");
const moment = require("moment");
const slugify = require("slugify");

module.exports = {
	name: "www",

	settings: {
		port: process.env.PORT || 3000,
		pageSize: 5
	},

	methods: {
		initRoutes(app) {
			app.get("/", this.getIndex);
			app.get("/post/:id/:title?", this.getPost);
		},

		getIndex(req, res) {
			const pageSize = this.settings.pageSize;
			let page = Number(req.query.page || 1);

			return Promise.resolve({ page })
				.then(data => {
					return this.broker.call("posts.findAll", { limit: pageSize, offset: (page - 1) * pageSize }).then(res => {
						data.posts = res.posts;
						data.pageCount = Math.floor(res.count / pageSize);
						return data;
					});
				})
				.then(data => {
					return this.broker.call("posts.bestOf", { limit: 5 }).then(posts => {
						data.bestOfPosts = posts;
						return data;
					});
				})

				.then(data => res.render("index", data))

				.catch(this.handleErr(res));
		},

		getPost(req, res) {
			let id = req.params.id;

			return Promise.resolve({ })
				.then(data => this.broker.call("posts.get", { id }).then(post => {
					data.post = post;
					return data;
				}))
				.then(data => {
					return this.broker.call("posts.bestOf", { limit: 5 }).then(posts => {
						data.bestOfPosts = posts;
						return data;
					});
				})

				.then(data => res.render("post", data))

				.catch(this.handleErr(res));			
		},

		handleErr(res) {
			return err => {
				this.logger.error("Request error!", err);

				res.status(err.code || 500).send(err.message);
			};
		}
	},

	created() {
		const app = express();
		const baseFolder = path.join(__dirname, "..");

		app.locals._ = _;
		app.locals.truncateContent = val => _.truncate(val, { length: 100 });
		app.locals.moment = moment;
		app.locals.slugify = slugify;

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
