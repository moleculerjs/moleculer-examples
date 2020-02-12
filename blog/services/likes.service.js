"use strict";

const _ = require("lodash");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Like = require("../models/like.model");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const Fakerator = require("fakerator");
const fake = new Fakerator();

module.exports = {
	name: "likes",
	mixins: [DbService, CacheCleaner(["users", "posts"])],
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog", { useNewUrlParser: true, useUnifiedTopology: true }),
	model: Like,

	settings: {
		fields: ["user", "post"],
		populates: {
			"user": {
				action: "users.get",
				params: {
					fields: ["_id", "username", "fullName", "avatar"]
				}
			}
		}
	},

	methods: {
		async seedDB() {
			this.logger.info("Seed Likes DB...");

			try {
				await this.waitForServices(["posts", "users"]);

				let {users, posts} = await this.broker.mcall({
					users: { action: "users.find" },
					posts: { action: "posts.find" }
				});

				if (users.length == 0 || posts.length == 0) {
					this.logger.info("Waiting for `users` & 'posts' seed...");
					setTimeout(this.seedDB, 1000);
					return;
				}

				let promises = [];

				users.forEach(user => {
					let c = fake.random.number(8, 15);
					let postIDs = fake.utimes(fake.random.arrayElement, c, posts).map(post => post._id);
					promises.push(this.adapter.insertMany(postIDs.map(postID => {
						return {
							user: user._id,
							post: postID
						};
					})));
				});

				await this.Promise.all(promises);
				const count = await this.adapter.count();

				this.logger.info(`Generated ${count} likes!`);

				return this.clearCache();

			} catch (error) {
				if (error.name == "ServiceNotFoundError") {
					this.logger.info("Waiting for `users` & `posts` service...");
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
