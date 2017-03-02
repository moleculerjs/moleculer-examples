/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const _ 		= require("lodash");
const fake 		= require("fakerator")();

function generateFakeData(count) {
	let rows = [];

	for(let i = 0; i < count; i++) {
		let item = fake.entity.post();
		item.id = i + 1;
		item.author = fake.random.number(1, 10);

		rows.push(item);
	}

	return rows;
}

module.exports = {
	name: "posts",

	actions: {

		list: {
			cache: true,
			description: "List all posts. Parameters: `limit`, `offset`, `sort`",
			handler(ctx) {
				
				// Clone the local list
				let posts = _.cloneDeep(this.rows);

				// Resolve authors
				let authorPromises = posts.map(post => {
					return ctx.call("users.get", { id: post.author}).then(user => post.author = _.pick(user, ["id", "userName", "email", "name", "avatar"]));
				});

				return Promise.all(authorPromises).then(() => {
					return posts;
				});
			}
		},


		get: {
			cache: {
				keys: ["id"]
			},
			description: "Get a detailed post item by ID. Parameters: `id`",

			handler(ctx) {
				return this.findByID(ctx.params.id);
			}
		},

		create: {
			description: "Create a post. Parameters: `title`, `content`, `author`",
			handler(ctx) {
				this.rows.push(ctx.params);

				this.clearCache();

				return ctx.params;
			}
		},

		update: {
			description: "Update a post. Parameters: `id`, `title`, `content`, `author`",
			handler(ctx) {

				this.clearCache();
			}
		},

		remove: {
			description: "Remove a post. Parameters: `id`",
			handler(ctx) {

				this.clearCache();
			}
		}

	},

	methods: {
		findByID(id) {
			return _.cloneDeep(this.rows.find(item => item.id == id));
		},

		clearCache() {
			this.broker.emitLocal("cache.clean", this.name + ".*");
		}
	},

	created() {
		this.logger.debug("Generate fake data...");
		this.rows = generateFakeData(1);
	}
};