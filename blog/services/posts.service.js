"use strict";

const _ = require("lodash");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Post = require("../models/post.model");
const Fakerator = require("fakerator");
const fake = new Fakerator();

module.exports = {
	name: "posts",
	mixins: [DbService],
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog"),
	model: Post,

	settings: {
		fields: ["_id", "title", "content", "author", "likes", "category", "coverPhoto", "createdAt"],
		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["_id", "username", "fullName", "avatar"]
				}
			}
		},
		pageSize: 5
	},

	actions: {
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
