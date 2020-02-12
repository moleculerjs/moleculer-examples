"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const { ForbiddenError } = require("moleculer-web").Errors;

const _ = require("lodash");
const slug = require("slug");
const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
	name: "articles",
	mixins: [
		DbService("articles"),
		CacheCleanerMixin([
			"cache.clean.articles",
			"cache.clean.users",
			"cache.clean.comments",
			"cache.clean.follows",
			"cache.clean.favorites",
		])
	],

	/**
	 * Default settings
	 */
	settings: {
		rest: "articles/",

		fields: ["_id", "title", "slug", "description", "body", "tagList", "createdAt", "updatedAt", "favorited", "favoritesCount", "author", "comments"],

		// Populates
		populates: {
			author: {
				action: "users.get",
				params: {
					fields: ["username", "bio", "image"]
				}
			},
			comments: {
				action: "comments.get",
				params: {
					fields: ["_id", "body", "author"],
					populates: ["author"]
				}
			},
			async favorited(ids, articles, rule, ctx) {
				if (ctx.meta.user)
					return this.Promise.all(articles.map(async article => article.favorited = await ctx.call("favorites.has", { article: article._id.toString(), user: ctx.meta.user._id.toString() })));
				else {
					articles.forEach(article => article.favorited = false);
				}
			},
			async favoritesCount(ids, articles, rule, ctx) {
				return this.Promise.all(articles.map(async article => article.favoritesCount = await ctx.call("favorites.count", { article: article._id.toString() })));
			}
		},

		// Validation schema for new entities
		entityValidator: {
			title: { type: "string", min: 1 },
			description: { type: "string", min: 1 },
			body: { type: "string", min: 1 },
			tagList: { type: "array", items: "string", optional: true },
		}
	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Create a new article.
		 * Auth is required!
		 *
		 * @actions
		 * @param {Object} article - Article entity
		 *
		 * @returns {Object} Created entity
		 */
		create: {
			auth: "required",
			rest: "POST /",
			params: {
				article: { type: "object" }
			},
			async handler(ctx) {
				let entity = ctx.params.article;
				await this.validateEntity(entity);

				entity.slug = slug(entity.title, { lower: true }) + "-" + (Math.random() * Math.pow(36, 6) | 0).toString(36);
				entity.author = ctx.meta.user._id.toString();
				entity.createdAt = new Date();
				entity.updatedAt = new Date();

				const doc = await this.adapter.insert(entity);
				let json = await this.transformDocuments(ctx, { populate: ["author", "favorited", "favoritesCount"] }, doc);
				json = await this.transformResult(ctx, json, ctx.meta.user);
				await this.entityChanged("created", json, ctx);
				return json;
			}
		},

		/**
		 * Update an article.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Article ID
		 * @param {Object} article - Article modified fields
		 *
		 * @returns {Object} Updated entity
		 */
		update: {
			auth: "required",
			rest: "PUT /:id",
			params: {
				id: { type: "string" },
				article: { type: "object", props: {
					title: { type: "string", min: 1, optional: true },
					description: { type: "string", min: 1, optional: true },
					body: { type: "string", min: 1, optional: true },
					tagList: { type: "array", items: "string", optional: true },
				} }
			},
			async handler(ctx) {
				let newData = ctx.params.article;
				newData.updatedAt = new Date();
				// the 'id' is the slug
				const article = await this.findBySlug(ctx.params.id);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				if (article.author !== ctx.meta.user._id.toString())
					throw new ForbiddenError();

				const update = {
					"$set": newData
				};

				const doc = await this.adapter.updateById(article._id, update);
				const entity = await this.transformDocuments(ctx, { populate: ["author", "favorited", "favoritesCount"] }, doc);
				const json = await this.transformResult(ctx, entity, ctx.meta.user);
				this.entityChanged("updated", json, ctx);
				return json;
			}
		},

		/**
		 * List articles with pagination.
		 *
		 * @actions
		 * @param {String} tag - Filter for 'tag'
		 * @param {String} author - Filter for author ID
		 * @param {String} favorited - Filter for favorited author
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 *
		 * @returns {Object} List of articles
		 */
		list: {
			cache: {
				keys: ["#userID", "tag", "author", "favorited", "limit", "offset"]
			},
			rest: "GET /",
			params: {
				tag: { type: "string", optional: true },
				author: { type: "string", optional: true },
				favorited: { type: "string", optional: true },
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
					populate: ["author", "favorited", "favoritesCount"],
					query: {}
				};
				let countParams;

				if (ctx.params.tag)
					params.query.tagList = { "$in" : [ctx.params.tag] };

				/*
				if (ctx.params.author) {
					const users = await ctx.call("users.find", { query: { username: ctx.params.author } });
					if (users.length == 0)
						throw new MoleculerClientError("Author not found");

					params.query.author = users[0]._id;
				}
				if (ctx.params.favorited) {
					const users = await ctx.call("users.find", { query: { username: ctx.params.favorited } });
					if (users.length == 0)
						throw new MoleculerClientError("Author not found");

					const list = await ctx.call("favorites.find", { fields: ["article"], query: { user: users[0]._id } });
					params.query._id = { $in: list.map(o => o.article) };
				}
				*/

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
				r.articlesCount = res[1];
				return r;
			}
		},

		/**
		 * List articles from followed authors.
		 * Auth is required!
		 *
		 * @actions
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 *
		 * @returns {Object} List of articles
		 */
		feed: {
			auth: "required",
			cache: {
				keys: ["#userID", "limit", "offset"]
			},
			rest: "GET /feed",
			params: {
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
					populate: ["author", "favorited", "favoritesCount"],
					query: {}
				};
				let countParams;

				const list = await ctx.call("follows.find", { fields: ["follow"], query: { user: ctx.meta.user._id.toString() } });
				const authors = _.uniq(_.compact(_.flattenDeep(list.map(o => o.follow))));
				params.query.author = { "$in" : authors };

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
				r.articlesCount = res[1];
				return r;
			}
		},

		/**
		 * Get an article by slug
		 *
		 * @actions
		 * @param {String} id - Article slug
		 *
		 * @returns {Object} Article entity
		 */
		get: {
			cache: {
				keys: ["#userID", "id"]
			},
			rest: "GET /:id",
			params: {
				id: { type: "string" }
			},
			async handler(ctx) {
				const entity = await this.findBySlug(ctx.params.id);
				if (!entity)
					throw new MoleculerClientError("Article not found!", 404);

				const doc = await this.transformDocuments(ctx, { populate: ["author", "favorited", "favoritesCount"] }, entity);
				return await this.transformResult(ctx, doc, ctx.meta.user);
			}
		},

		/**
		 * Remove an article by slug
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Article slug
		 *
		 * @returns {Number} Count of removed articles
		 */
		remove: {
			auth: "required",
			rest: "DELETE /:id",
			params: {
				id: { type: "any" }
			},
			async handler(ctx) {
				const entity = await this.findBySlug(ctx.params.id);
				if (!entity)
					throw new MoleculerClientError("Article not found!", 404);

				if (entity.author !== ctx.meta.user._id.toString())
					throw new ForbiddenError();

				// Remove favorite entities
				await ctx.call("favorites.removeByArticle", { article: entity._id });

				// Remove article entity
				const res = await this.adapter.removeById(entity._id);
				await this.entityChanged("removed", res, ctx);

				return res;
			}
		},

		/**
		 * Favorite an article
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Article slug
		 *
		 * @returns {Object} Updated article
		 */
		favorite: {
			auth: "required",
			rest: "POST /:slug/favorite",
			params: {
				slug: { type: "string" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				await ctx.call("favorites.add", { article: article._id.toString(), user: ctx.meta.user._id.toString() });
				const entity = await this.transformDocuments(ctx, { populate: ["author", "favorited", "favoritesCount"] }, article);
				return await this.transformResult(ctx, entity, ctx.meta.user);
			}
		},

		/**
		 * Unfavorite an article
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} id - Article slug
		 *
		 * @returns {Object} Updated article
		 */
		unfavorite: {
			auth: "required",
			rest: "DELETE /:slug/favorite",
			params: {
				slug: { type: "string" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				await ctx.call("favorites.delete", { article: article._id.toString(), user: ctx.meta.user._id.toString() });
				const entity = await this.transformDocuments(ctx, { populate: ["author", "favorited", "favoritesCount"] }, article);
				return await this.transformResult(ctx, entity, ctx.meta.user);
			}
		},

		/**
		 * Get list of available tags
		 *
		 * @returns {Object} Tag list
		 */
		tags: {
			rest: {
				method: "GET",
				fullPath: "/api/tags",
			},
			cache: {
				keys: []
			},
			async handler() {
				const list = await this.adapter.find({ fields: ["tagList"], sort: ["createdAt"] });
				return {
					tags: _.uniq(_.compact(_.flattenDeep(list.map(o => o.tagList))))
				};
			}
		},

		/**
		 * Get all comments of an article.
		 *
		 * @actions
		 * @param {String} slug - Article slug
		 *
		 * @returns {Object} Comment list
		 *
		 */
		comments: {
			cache: {
				keys: ["#userID", "slug"]
			},
			rest: "GET /:slug/comments",
			params: {
				slug: { type: "string" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				return await ctx.call("comments.list", { article: article._id.toString() });
			}
		},

		/**
		 * Add a new comment to an article.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} slug - Article slug
		 * @param {Object} comment - Comment fields
		 *
		 * @returns {Object} Comment entity
		 */
		addComment: {
			auth: "required",
			rest: "POST /:slug/comments",
			params: {
				slug: { type: "string" },
				comment: { type: "object" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				return await ctx.call("comments.create", { article: article._id.toString(), comment: ctx.params.comment });
			}
		},

		/**
		 * Update a comment.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} slug - Article slug
		 * @param {String} commentID - Comment ID
		 * @param {Object} comment - Comment fields
		 *
		 * @returns {Object} Comment entity
		 */
		updateComment: {
			auth: "required",
			rest: "PUT /:slug/comments/:commentID",
			params: {
				slug: { type: "string" },
				commentID: { type: "string" },
				comment: { type: "object" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				return await ctx.call("comments.update", { id: ctx.params.commentID, comment: ctx.params.comment });
			}
		},

		/**
		 * Remove a comment.
		 * Auth is required!
		 *
		 * @actions
		 * @param {String} slug - Article slug
		 * @param {String} commentID - Comment ID
		 *
		 * @returns {Number} Count of removed comment
		 */
		removeComment: {
			auth: "required",
			rest: "DELETE /:slug/comments/:commentID",
			params: {
				slug: { type: "string" },
				commentID: { type: "string" }
			},
			async handler(ctx) {
				const article = await this.findBySlug(ctx.params.slug);
				if (!article)
					throw new MoleculerClientError("Article not found", 404);

				return await ctx.call("comments.remove", { id: ctx.params.commentID });
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Find an article by slug
		 *
		 * @param {String} slug - Article slug
		 *
		 * @results {Object} Promise<Article
		 */
		findBySlug(slug) {
			return this.adapter.findOne({ slug });
		},

		/**
		 * Transform the result entities to follow the RealWorld API spec
		 *
		 * @param {Context} ctx
		 * @param {Array} entities
		 * @param {Object} user - Logged in user
		 */
		async transformResult(ctx, entities, user) {
			if (Array.isArray(entities)) {
				const articles = await this.Promise.all(entities.map(item => this.transformEntity(ctx, item, user)));
				return {
					articles
				};
			} else {
				const article = await this.transformEntity(ctx, entities, user);
				return { article };
			}
		},

		/**
		 * Transform a result entity to follow the RealWorld API spec
		 *
		 * @param {Context} ctx
		 * @param {Object} entity
		 * @param {Object} user - Logged in user
		 */
		async transformEntity(ctx, entity, user) {
			if (!entity) return null;

			return entity;
		}
	}
};
