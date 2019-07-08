"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
	name: "follows",
	mixins: [
		DbService("follows"),
		CacheCleanerMixin([
			"cache.clean.users",
			"cache.clean.follows",
		])
	],

	/**
	 * Default settings
	 */
	settings: {

	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Create a new following record
		 *
		 * @actions
		 *
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Object} Created following record
		 */
		add: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			async handler(ctx) {
				const { follow, user } = ctx.params;
				const item = await this.findByFollowAndUser(follow, user);
				if (item)
					throw new MoleculerClientError("User has already followed");

				return await this._create(ctx, { follow, user, createdAt: new Date() });
			}
		},

		/**
		 * Check the given 'follow' user is followed by 'user' user.
		 *
		 * @actions
		 *
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Boolean}
		 */
		has: {
			cache: {
				keys: ["article", "user"]
			},
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			async handler(ctx) {
				const item = await this.findByFollowAndUser(ctx.params.follow, ctx.params.user);
				return !!item;
			}
		},

		/**
		 * Count of following.
		 *
		 * @actions
		 *
		 * @param {String?} user - Follower username
		 * @param {String?} follow - Followee username
		 * @returns {Number}
		 */
		count: {
			cache: {
				keys: ["article", "user"]
			},
			params: {
				follow: { type: "string", optional: true },
				user: { type: "string", optional: true },
			},
			async handler(ctx) {
				let query = {};
				if (ctx.params.follow)
					query = { follow: ctx.params.follow };

				if (ctx.params.user)
					query = { user: ctx.params.user };

				return await this._count(ctx, { query });
			}
		},

		/**
		 * Delete a following record
		 *
		 * @actions
		 *
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Number} Count of removed records
		 */
		delete: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			async handler(ctx) {
				const { follow, user } = ctx.params;
				const item = await this.findByFollowAndUser(follow, user);
				if (!item)
					throw new MoleculerClientError("User has not followed yet");

				return await this._remove(ctx, { id: item._id });
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Find the first following record by 'follow' or 'user'
		 * @param {String} follow - Followee username
		 * @param {String} user - Follower username
		 */
		findByFollowAndUser(follow, user) {
			return this.adapter.findOne({ follow, user });
		},
	}
};
