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
		fields: "_id title content author likes createdAt",
		populates: {
			"author": {
				action: "users.model",
				params: {
					fields: "username fullName email"
				}
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
						content: fakePost.content,
						category: "General",
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
