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
		let user = fake.entity.user();
		let item = _.pick(user, ["id", "userName", "email", "name", "avatar", "dob", "password", "status"]);
		item.id = i + 1;
		item.name = `${user.firstName} ${user.lastName}`;

		rows.push(item);
	}

	return rows;
}

module.exports = {
	name: "users",

	actions: {

		list: {
			cache: true,
			handler(ctx) {
				// Clone the local list
				let users = _.cloneDeep(this.rows);
				return users;
			}
		},		

		get: {
			cache: {
				keys: ["id"]
			},

			handler(ctx) {
				return this.findByID(ctx.params.id);
			}
		}

	},

	methods: {
		findByID(id) {
			return _.cloneDeep(this.rows.find(item => item.id == id));
		}
	},

	created() {
		this.logger.debug("Generate fake data...");
		this.rows = generateFakeData(10);
	}
};