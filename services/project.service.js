"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Project = require("../models/project.model");
// const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
	name: "project",
	mixins: [
		DbService
	],
	adapter: new MongooseAdapter(/*process.env.MONGO_URI ||*/"mongodb://localhost:27017/msv", { useNewUrlParser: true, useUnifiedTopology: true }),
	model: Project,

	/**
	 * Default settings
	 */
	settings: {
		/** REST Basepath */
		rest: "/",

		/** Public fields */
		fields: ["_id", "title", "setMinCommit", "maxTime", "author", "trigger", "alarmType", "weeklyCommits", "billing"],

		/** Validator schema for entity */
		entityValidator: {
			title: { type: "string", min: 2 },
			setMinCommit: { type: "number", optional: true },
			maxTime: { type: "number", optional: true },
			author: { type: "string", optional: true },
			trigger: { type: "string", optional: true },
			alarmType: { type: "number", optional: true },
			billing: { type: "boolean", optional: true },
			weeklyCommits: { type: "array", optional: true },
			commitBills: { type: "array", optional: true },

		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Create a new Project
		 *
		 * @actions
		 * @param {Object} project - Project entity
		 *
		 * @returns {Object} Created entity
		 */
		create: {
			auth: "required",
			rest: "POST /project",
			params: {
				project: { type: "object" }
			},
			async handler(ctx) {
				let entity = ctx.params.project;
				console.log(entity);
				await this.validateEntity(entity);
				if (entity.title) {
					const found = await this.adapter.findOne({ title: entity.title });
					if (found)
						throw new MoleculerClientError("Title exist!", 422, "", [{ field: "title", message: "is exist" }]);
				}
				//

				entity.author = ctx.meta.user1._id;
				entity.createdAt = new Date();
				if (entity.alarmType && entity.alarmType > 2) {
					entity.alarmType = 0
				}
				if (entity.maxTime && entity.maxTime < 0) {
					entity.alarmType = 60 * 60 * 24 * 1000 * 7
				}
				if (entity.setMinCommit && entity.setMinCommit < 0) {
					entity.setMinCommit = 24
				}
				const doc = await this.adapter.insert(entity);
				const project = await this.transformDocuments(ctx, {}, doc);
				const json = await this.transformEntity(project);
				await this.entityChanged("created", json, ctx);
				return json;
			}
		},

		/**
		 * Update current user entity.
		 * Auth is required!
		 *
		 * @actions
		 *
		 * @param {Object} user - Modified fields
		 * @returns {Object} User entity
		 */
		updateProject: {
			auth: "required",
			rest: "PUT /user",
			params: {
				user: {
					type: "object", props: {
						username: { type: "string", min: 2, optional: true, pattern: /^[a-zA-Z0-9]+$/ },
						password: { type: "string", min: 6, optional: true },
						email: { type: "email", optional: true },
						avatar: { type: "string", optional: true },
						twitter: { type: "string", optional: true },
					}
				}
			},
			async handler(ctx) {
				const newData = ctx.params.user;
				if (newData.username) {
					const found = await this.adapter.findOne({ username: newData.username });
					if (found && found._id.toString() !== ctx.meta.user1._id.toString())
						throw new MoleculerClientError("Username is exist!", 422, "", [{ field: "username", message: "is exist" }]);
				}

				if (newData.email) {
					const found = await this.adapter.findOne({ email: newData.email });
					if (found && found._id.toString() !== ctx.meta.user1._id.toString())
						throw new MoleculerClientError("Email is exist!", 422, "", [{ field: "email", message: "is exist" }]);
				}
				newData.updatedAt = new Date();
				const update = {
					"$set": newData
				};
				const doc = await this.adapter.updateById(ctx.meta.user1._id, update);

				const user = await this.transformDocuments(ctx, {}, doc);
				const json = await this.transformEntity(user, true, ctx.meta.token);
				await this.entityChanged("updated", json, ctx);
				return json;
			}
		},

		list: {
			rest: "GET /projects"
		},

		get: {
			rest: "GET /projects/:id"
		},

		update: {
			rest: "PUT /projects/:id"
		},

		remove: {
			rest: "DELETE /projects/:id"
		},


	},

	/**
	 * Methods
	 */
	methods: {


		/**
		 * Transform returned user entity. Generate JWT token if neccessary.
		 *
		 * @param {Object} project
		 */
		transformEntity(project) {
			// if (user) {
			// 	user.avatar = user.avatar || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";

			// 	if (withToken)
			// 		user.token = token || this.generateJWT(user);
			// }

			return { project };
		},

		/**
		 * Transform returned user entity as profile.
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 * @param {Object?} loggedInUser
		 */
		async transformProfile(ctx, project) {
			//user.image = user.image || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
			// user.avatar = user.avatar || "https://static.productionready.io/images/smiley-cyrus.jpg";


			return { project: project };
		}
	}
};
