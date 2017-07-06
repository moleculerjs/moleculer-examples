"use strict";

const _ = require("lodash");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Post = require("../models/post.model");
const Fakerator = require("fakerator");
const fake = new Fakerator();

module.exports = {
	name: "posts",
	mixins: DbService,
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog"),
	model: Post,

	settings: {
		fields: "_id title content author likes category coverPhoto createdAt",
		populates: {
			"author": {
				action: "users.model",
				params: {
					fields: "_id username fullName email avatar"
				}
			}
		}
	},

	actions: {
		findAll: {
			cache: true,
			params: {
				limit: { type: "number", positive: true, integer: true },
				offset: { type: "number", gt: 0, integer: true }
			},
			handler(ctx) {
				return this.listPosts(ctx, {}, "-createdAt");
			}
		},

		categoryAll: {
			cache: true,
			params: {
				category: { type: "string" },
				limit: { type: "number", positive: true, integer: true },
				offset: { type: "number", gt: 0, integer: true }
			},
			handler(ctx) {
				return this.listPosts(ctx, { category: ctx.params.category }, "-createdAt");
			}
		},

		authorAll: {
			cache: true,
			params: {
				author: { type: "string" },
				limit: { type: "number", positive: true, integer: true },
				offset: { type: "number", gt: 0, integer: true }
			},
			handler(ctx) {
				return this.listPosts(ctx, { author: ctx.params.author }, "-createdAt");
			}
		},

		search: {
			cache: true,
			params: {
				query: { type: "string" },
				limit: { type: "number", positive: true, integer: true },
				offset: { type: "number", gt: 0, integer: true }
			},
			handler(ctx) {
				let q = Post.find({});

				// Full-text search
				q.find({
					$text: {
						$search: ctx.params.query
					}
				});
				q._fields = {
					_score: {
						$meta: "textScore"
					}
				};
				// Sort by score
				q.sort({
					_score: {
						$meta: "textScore"
					}
				});

				return q.limit(ctx.params.limit).skip(ctx.params.offset).lean().exec()
					.then(posts => this.transformDocuments(ctx, posts))
					.then(posts => q.count().then(count => {
						return {
							count,
							posts
						};
					}));
			}
		},

		bestOf: {
			cache: true,
			params: {
				limit: { type: "number", positive: true, integer: true }
			},
			handler(ctx) {
				return Post.find({}).sort("-likes").limit(ctx.params.limit).lean().exec()
					.then(posts => this.transformDocuments(ctx, posts));
			}
		}
	},

	methods: {
		listPosts(ctx, filter, sort) {
			return Post.find(filter || {}).sort(sort || "-createdAt").limit(ctx.params.limit).skip(ctx.params.offset).lean().exec()
				.then(posts => this.transformDocuments(ctx, posts))
				.then(posts => Post.find({}).count().then(count => {
					return {
						count,
						posts
					};
				}));
		},

		seedDB() {
			this.logger.info("Seed Posts collection...");
			return this.broker.call("users.find").then(users => {
				if (users.length == 0) {
					this.logger.info("Waiting for `users` seed...");
					setTimeout(this.seedDB, 1000);
					return;
				}

				let authors = users.filter(u => u.author);

				// Create fake posts
				return Promise.all(_.times(20, () => {
					let fakePost = fake.entity.post();
					return this.adapter.insert({
						title: fakePost.title,
						content: fake.times(fake.lorem.paragraph, 10).join("\r\n"),
						category: fake.random.arrayElement(["General", "Tech", "Social", "News"]),
						author: fake.random.arrayElement(authors)._id,
						likes: fake.random.number(100),
						coverPhoto: fake.random.number(1, 20) + ".jpg",
						createdAt: fakePost.created
					});
				}))
					.then(() => this.count())
					.then(count => console.log(`Generated ${count} posts!`));

			}).catch(err => {
				if (err.name == "ServiceNotFoundError") {
					this.logger.info("Waiting for `users` service...");
					setTimeout(this.seedDB, 1000);
					return;
				} else
					return Promise.reject(err);
			});

		}
	},

	afterConnected() {
		return this.count().then(count => {
			if (count == 0) {
				this.seedDB();
			}
		});
	}

};
