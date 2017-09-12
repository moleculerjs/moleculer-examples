"use strict";

const _ = require("lodash");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Like = require("../models/like.model");
const Fakerator = require("fakerator");
const fake = new Fakerator();

module.exports = {
	name: "likes",
	mixins: [DbService],
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog"),
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
		seedDB() {
			this.logger.info("Seed Likes DB...");

			return this.waitForServices(["posts", "users"])
				.then(() => this.broker.mcall({
					users: { action: "users.find" },
					posts: { action: "posts.find" }
				}))
				.then(({ users, posts }) => {
					if (users.length == 0 || posts.length == 0) {
						this.logger.info("Waiting for `users` & 'posts' seed...");
						setTimeout(this.seedDB, 1000);
						return;
					}

					let promises = [];

					users.forEach(user => {
						let c = fake.random.number(8, 15);
						let postIDs = fake.utimes(fake.random.arrayElement, c, posts).map(post => post._id);
						promises.push(this.createMany(null, postIDs.map(postID => {
							return {
								user: user._id,
								post: postID
							};
						})));
					});

					return this.Promise.all(promises)
						.then(() => this.count())
						.then(count => this.logger.info(`Generated ${count} likes!`));

				})
				.catch(err => {
					if (err.name == "ServiceNotFoundError") {
						this.logger.info("Waiting for `users` & `posts` service...");
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
