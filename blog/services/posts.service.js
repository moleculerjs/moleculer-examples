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
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog", { useNewUrlParser: true, useUnifiedTopology: true }),
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
		async seedDB() {
			try {
				this.logger.info("Seed Posts collection...");
				await this.waitForServices(["users"]);

				let users = await this.broker.call("users.find");

				let authors = users.filter(u => u.author);

				if (authors.length == 0) {
					this.logger.info("Waiting for `users` seed...");
					setTimeout(this.seedDB, 1000);
					return;
				}

				// Create fake posts
				let posts = await this.adapter.insertMany(_.times(20, () => {
					let fakePost = fake.entity.post();
					return {
						title: fakePost.title,
						content: fake.times(fake.lorem.paragraph, 10).join("\r\n"),
						category: fake.random.arrayElement(["General", "Tech", "Social", "News"]),
						author: fake.random.arrayElement(authors)._id,
						coverPhoto: fake.random.number(1, 20) + ".jpg",
						createdAt: fakePost.created
					};
				}));

				this.logger.info(`Generated ${posts.length} posts!`);
				return this.clearCache();
			} catch (error) {
				if (error.name == "ServiceNotFoundError") {
					this.logger.info("Waiting for `users` service...");
					setTimeout(this.seedDB, 1000);
					return;
				} else
					throw error;
			}
		}
	},

	async afterConnected() {
		const count = await this.adapter.count();
		if (count == 0) {
			return this.seedDB();
		}
	}

};
