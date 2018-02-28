"use strict";

const _ = require("lodash");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Post = require("../models/post.model");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const Fakerator = require("fakerator");
const fake = new Fakerator();

module.exports = {
	name: "posts",
	mixins: [DbService, CacheCleaner(["users", "likes"])],
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog"),
	model: Post,

	settings: {
		fields: ["_id", "title", "content", "author", "likes", "likers", "category", "coverPhoto", "createdAt"],
		populates: {
			author: {
				action: "users.get",
				params: {
					fields: ["_id", "username", "fullName", "avatar"]
				}
			},
			likes(ids, docs, rule, ctx) {
				return this.Promise.all(docs.map(doc => ctx.call("likes.count", { query: { post: doc._id } }).then(count => doc.likes = count)));
			},
			likers: {
				action: "likes.findByPost",
				params: {
					populate: ["user"],
					limit: 5
				}
			}
		},
		pageSize: 5
	},

	actions: {

		like(ctx) {

		},

		unlike(ctx) {

		}

	},

	methods: {
		seedDB() {
			this.logger.info("Seed Posts collection...");
			return this.waitForServices(["users"])
				.then(() => this.broker.call("users.find"))
				.then(users => {
					if (users.length == 0) {
						this.logger.info("Waiting for `users` seed...");
						setTimeout(this.seedDB, 1000);
						return;
					}

					let authors = users.filter(u => u.author);

					// Create fake posts
					return this.adapter.insertMany(_.times(20, () => {
						let fakePost = fake.entity.post();
						return {
							title: fakePost.title,
							content: fake.times(fake.lorem.paragraph, 10).join("\r\n"),
							category: fake.random.arrayElement(["General", "Tech", "Social", "News"]),
							author: fake.random.arrayElement(authors)._id,
							coverPhoto: fake.random.number(1, 20) + ".jpg",
							createdAt: fakePost.created
						};
					})).then(posts => {
						this.logger.info(`Generated ${posts.length} posts!`);
						this.clearCache();
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
		return this.adapter.count().then(count => {
			if (count == 0) {
				this.seedDB();
			}
		});
	}

};
