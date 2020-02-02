"use strict";

const { ForbiddenError } = require("moleculer-web").Errors;
const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
	name: "comments",
	mixins: [
		DbService("comments"),
		CacheCleanerMixin([
			"cache.clean.comments",
			"cache.clean.users",
			"cache.clean.follows",
			"cache.clean.articles",
		])
	],
	/**
	 * Default settings
	 */
	settings: {
		fields: ["_id", "author", "article", "body", "createdAt", "updatedAt"],
		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["_id", "username", "bio", "image"]
				}
			}
		},
		entityValidator: {
			article: { type: "string" },
			body: { type: "string", min: 1 },
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Create a comment.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} article - Article ID
		 * @param {Object} comment - Comment entity
		 *
		 * @returns {Object} Created comment entity
		 */
		create: {
			auth: "required",
			params: {
				article: { type: "string" },
				comment: { type: "object" }
			},
			async handler(ctx) {
				let entity = ctx.params.comment;
				entity.article = ctx.params.article;
				entity.author = ctx.meta.user._id.toString();

				await this.validateEntity(entity);

				entity.createdAt = new Date();
				entity.updatedAt = new Date();

				const doc = await this.adapter.insert(entity);
				let json = await this.transformDocuments(ctx, { populate: ["author"] }, doc);
				json = await this.transformResult(ctx, json, ctx.meta.user);
				await this.entityChanged("created", json, ctx);
				return json;
			}
		},

		/**
		 * Update a comment.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Comment ID
		 * @param {Object} comment - Comment modified fields
		 *
		 * @returns {Object} Updated comment entity
		 */
		update: {
			auth: "required",
			params: {
				id: { type: "string" },
				comment: { type: "object", props: {
					body: { type: "string", min: 1 },
				} }
			},
			async handler(ctx) {
				let newData = ctx.params.comment;
				newData.updatedAt = new Date();

				const comment = await this.getById(ctx.params.id);
				if (comment.author !== ctx.meta.user._id.toString())
					throw new ForbiddenError();

				const update = {
					"$set": newData
				};

				const doc = await this.adapter.updateById(ctx.params.id, update);
				const entity = await this.transformDocuments(ctx, { populate: ["author"] }, doc);
				const json = await this.transformResult(ctx, entity, ctx.meta.user);
				await this.entityChanged("updated", json, ctx);
				return json;
			}
		},

		/**
		 * List of comments by article.
		 *
		 * @actions
		 * @param {String} article - Article ID
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 *
		 * @returns {Object} List of comments
		 */
		list: {
			cache: {
				keys: ["#userID", "article", "limit", "offset"]
			},
			params: {
				article: { type: "string" },
				limit: { type: "number", optional: true, convert: true },
				offset: { type: "number", optional: true, convert: true },
			},
			async handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;

				let params = {
					limit,
					offset,
					sort: ["-createdAt"],
					populate: ["author"],
					query: {
						article: ctx.params.article
					}
				};
				let countParams;

				countParams = Object.assign({}, params);
				// Remove pagination params
				if (countParams && countParams.limit)
					countParams.limit = null;
				if (countParams && countParams.offset)
					countParams.offset = null;

				const res = await this.Promise.all([
					// Get rows
					this.adapter.find(params),

					// Get count of all rows
					this.adapter.count(countParams)

				]);

				const docs = await this.transformDocuments(ctx, params, res[0]);
				const r = await this.transformResult(ctx, docs, ctx.meta.user);
				r.commentsCount = res[1];
				return r;
			}
		},

		/**
		 * Remove a comment
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Comment ID
		 *
		 * @returns {Number} Count of removed comments
		 */
		remove: {
			auth: "required",
			params: {
				id: { type: "any" }
			},
			async handler(ctx) {
				const comment = await this.getById(ctx.params.id);
				if (comment.author !== ctx.meta.user._id.toString())
					throw new ForbiddenError();

				const json = await this.adapter.removeById(ctx.params.id);
				await this.entityChanged("removed", json, ctx);
				return json;
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Transform the result entities to follow the RealWorld API spec
		 *
		 * @param {Context} ctx
		 * @param {Array} entities
		 * @param {Object} user - Logged in user
		 */
		async transformResult(ctx, entities, user) {
			if (Array.isArray(entities)) {
				const comments = await this.Promise.all(entities.map(item => this.transformEntity(ctx, item, user)));
				return { comments };
			} else {
				const comment = await this.transformEntity(ctx, entities, user);
				return { comment };
			}
		},

		/**
		 * Transform a result entity to follow the RealWorld API spec
		 *
		 * @param {Context} ctx
		 * @param {Object} entity
		 * @param {Object} user - Logged in user
		 */
		async transformEntity(ctx, entity, loggedInUser) {
			if (!entity) return this.Promise.resolve();

			entity.id = entity._id;

			if (loggedInUser) {
				const res = await ctx.call("follows.has", { user: loggedInUser._id.toString(), follow: entity.author._id });
				entity.author.following = res;
				return entity;
			}

			entity.author.following = false;

			return entity;
		}
	}
};
