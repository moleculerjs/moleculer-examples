"use strict";

const { MoleculerError } = require("moleculer").Errors;
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const _ = require("lodash");
const moment = require("moment");
const slugify = require("slugify");
const Hashids = require("hashids");
const hashids = new Hashids("secret hash", 6);

function encodeObjectID(id) {
	return hashids.encodeHex(id);
}

function decodeObjectID(id) {
	return hashids.decodeHex(id);
}

module.exports = {
	name: "www",

	settings: {
		port: process.env.PORT || 3000,
		pageSize: 5
	},

	methods: {
		initRoutes(app) {
			app.get("/", this.allPosts);
			app.get("/search", this.searchPosts);
			app.get("/category/:category", this.categoryPosts);
			app.get("/author/:author", this.authorPosts);
			app.get("/post/:id/:title?", this.getPost);
		},

		allPosts(req, res) {
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
				.then(this.appendAdditionalData)
				.then(data => res.render("index", data))

				.catch(this.handleErr(res));
		},

		categoryPosts(req, res) {
			const pageSize = this.settings.pageSize;
			let page = Number(req.query.page || 1);
			let category = req.params.category;

			return Promise.resolve({ page })
				.then(data => {
					return this.broker.call("posts.categoryAll", { category, limit: pageSize, offset: (page - 1) * pageSize }).then(res => {
						data.posts = res.posts;
						data.pageCount = Math.floor(res.count / pageSize);
						return data;
					});
				})
				.then(this.appendAdditionalData)
				.then(data => res.render("index", data))

				.catch(this.handleErr(res));
		},

		authorPosts(req, res) {
			const pageSize = this.settings.pageSize;
			let page = Number(req.query.page || 1);
			let author = decodeObjectID(req.params.author);
			if (!author || author.length == 0)
				return this.handleErr(res)(this.Promise.reject(new MoleculerError("Invalid author ID", 404, "INVALID_AUTHOR_ID", { author: req.params.author })));

			return Promise.resolve({ page })
				.then(data => {
					return this.broker.call("posts.authorAll", { author: author, limit: pageSize, offset: (page - 1) * pageSize }).then(res => {
						data.posts = res.posts;
						data.pageCount = Math.floor(res.count / pageSize);
						return data;
					});
				})
				.then(this.appendAdditionalData)
				.then(data => res.render("index", data))

				.catch(this.handleErr(res));
		},

		searchPosts(req, res) {
			const pageSize = this.settings.pageSize;
			let page = Number(req.query.page || 1);

			return Promise.resolve({ page })
				.then(data => {
					return this.broker.call("posts.search", { query: req.query.query, limit: pageSize, offset: (page - 1) * pageSize }).then(res => {
						data.query = req.query.query;
						data.posts = res.posts;
						data.pageCount = Math.floor(res.count / pageSize);
						return data;
					});
				})
				.then(this.appendAdditionalData)
				.then(data => res.render("index", data))

				.catch(this.handleErr(res));
		},

		getPost(req, res) {
			let id = decodeObjectID(req.params.id);
			if (!id || id.length == 0)
				return this.handleErr(res)(this.Promise.reject(new MoleculerError("Invalid POST ID", 404, "INVALID_POST_ID", { id: req.params.id })));

			return Promise.resolve({ })
				.then(data => this.broker.call("posts.get", { id }).then(post => {
					if (!post)
						return this.Promise.reject(new MoleculerError("Post not found", 404, "NOT_FOUND_POST", { id: req.params.id }));

					data.post = post;
					data.title = post.title;
					return data;
				}))
				.then(this.appendAdditionalData)
				.then(data => res.render("post", data))

				.catch(this.handleErr(res));			
		},

		appendAdditionalData(data) {
			return this.broker.call("posts.bestOf", { limit: 5 }).then(posts => {
				data.bestOfPosts = posts;
				return data;
			});
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
		app.locals.encodeObjectID = encodeObjectID;
		app.locals.decodeObjectID = decodeObjectID;

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
