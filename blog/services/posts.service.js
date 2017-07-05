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
		fields: "_id title content author likes category createdAt",
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
				return Post.find({}).sort("-createdAt").limit(ctx.params.limit).skip(ctx.params.offset).lean().exec()
					.then(posts => this.transformDocuments(ctx, posts))
					.then(posts => Post.find({}).count().then(count => {
						return {
							count,
							posts
						};
					}));
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
				let filter = { category: ctx.params.category };
				return Post.find(filter).sort("-createdAt").limit(ctx.params.limit).skip(ctx.params.offset).lean().exec()
					.then(posts => this.transformDocuments(ctx, posts))
					.then(posts => Post.find(filter).count().then(count => {
						return {
							count,
							posts
						};
					}));
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
				let filter = { author: ctx.params.author };
				return Post.find(filter).sort("-createdAt").limit(ctx.params.limit).skip(ctx.params.offset).lean().exec()
					.then(posts => this.transformDocuments(ctx, posts))
					.then(posts => Post.find(filter).count().then(count => {
						return {
							count,
							posts
						};
					}));
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
						category: fake.random.arrayElement("General", "Tech", "Social", "News"),
						author: fake.random.arrayElement(authors)._id,
						likes: fake.random.number(100),
						createdAt: fakePost.created
					});
				})).then(() => {
					this.adapter.findAll({}).then(res => console.log(`Generated ${res.length} posts!`));
				});
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
