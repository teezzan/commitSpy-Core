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
	adapter: new MongooseAdapter(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }),
	model: Project,

	/**
	 * Default settings
	 */
	settings: {
		/** REST Basepath */
		rest: "/project",
		cors: {
			origin: "*",
			methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
			allowedHeaders: [],
			exposedHeaders: [],
			credentials: false,
			maxAge: 3600
		},

		/** Public fields */
		fields: ["_id", "title", "git_id", "setMinCommit", "maxTime", "author", "trigger", "alarmType", "weeklyCommits", "billing", "rawCommits"],

		/** Validator schema for entity */
		entityValidator: {
			title: { type: "string", min: 2 },
			git_id: { type: "string", min: 2 },
			setMinCommit: { type: "number", optional: true },
			maxTime: { type: "number", optional: true },
			author: { type: "string", optional: true },
			trigger: { type: "string", optional: true },
			alarmType: { type: "number", optional: true },
			billing: { type: "boolean", optional: true },
			weeklyCommits: { type: "array", optional: true },
			commitBills: { type: "array", optional: true },

		},

		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["_id", "username", "email", "twitter"]
				}
			}
		},
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
			rest: "POST /",
			params: {
				project: { type: "object" }
			},
			async handler(ctx) {
				let entity = ctx.params.project;
				// console.log(entity);
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
			rest: "PUT /",
			params: {
				project: {
					type: "object", props: {
						_id: { type: "string", min: 2 },
						title: { type: "string", min: 2, optional: true },
						setMinCommit: { type: "number", optional: true },
						maxTime: { type: "number", optional: true },
						alarmType: { type: "number", optional: true },
						billing: { type: "boolean", optional: true }
					}
				}
			},
			async handler(ctx) {
				const newData = ctx.params.project;
				const repo = await this.adapter.findOne({ _id: newData._id });

				if (repo && repo.author.toString() !== ctx.meta.user1._id.toString())
					throw new MoleculerClientError("UnAuthorized", 422, "", [{ field: "Auth", message: "failed" }]);

				if (repo) {

					if (newData.title) {
						const found = await this.adapter.findOne({ title: newData.title });
						if (found)
							throw new MoleculerClientError("Repo exist!", 422, "", [{ field: "title", message: " exist" }]);
					}

					newData.updatedAt = new Date();
					//check new data values
					if (newData.alarmType && newData.alarmType > 2) {
						newData.alarmType = 0
					}
					if (newData.maxTime && newData.maxTime < 0) {
						throw new MoleculerClientError("Error!", 422, "", [{ field: "maxTime", message: " should be positive" }]);

					}
					if (newData.setMinCommit && newData.setMinCommit < 0) {
						throw new MoleculerClientError("Error!", 422, "", [{ field: "setMinCommit", message: " should be positive" }]);

					}
					if (newData.author) {
						throw new MoleculerClientError("Error!", 422, "", [{ field: "author", message: " unchangable" }]);
					}
					if (newData.billing && typeof (newData.billing) !== 'boolean') {
						throw new MoleculerClientError("Error!", 422, "", [{ field: "billing", message: " not boolean" }]);

					}
					if (newData.weeklyCommits || newData.commitBills) {
						throw new MoleculerClientError("Error!", 422, "", [{ field: "UnAuthorized", message: " UnAuthorized changes" }]);

					}
					if (newData.maxTime !== repo.maxTime) {
						newData.trigger = Date.now() + newData.maxTime;
					} else {
						newData.trigger = repo.trigger
					}

					const update = {
						"$set": newData
					};
					const doc = await this.adapter.updateById(newData._id, update);

					const project = await this.transformDocuments(ctx, {}, doc);
					const json = await this.transformEntity(project);
					await this.entityChanged("updated", json, ctx);
					return json;
				}
				else {
					throw new MoleculerClientError("Repo not found!", 422, "", [{ field: "_id", message: " does not exist" }]);
				}
			}
		},
		getUserProject: {
			auth: "required",
			rest: "GET /userprojects",

			async handler(ctx) {
				try {
					// console.log(ctx.meta.user1)filters = { author: ctx.meta.user1._id }
					const doc = await this.adapter.find({ query: { author: ctx.meta.user1._id } });
					// console.log(doc)
					//compute
					const project = await this.transformDocuments(ctx, {}, doc);
					const json = await this.transformEntity(project);
					await this.entityChanged("found", json, ctx);
					return json;
				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("invalid ID!", 422, "", [{ field: "_id", message: " does not exist" }]);

				}
			}
		},
		updateProjectCommit: {
			rest: "POST /hook",
			params: {
				githook: { type: "object" }
			},
			async handler(ctx) {
				let entity = ctx.params.githook;
				try {
					let user = await ctx.call("users.getbygitID", { id: String(entity.sender.id) });
					if (user) {
						let doc = await this.adapter.find({ query: { author: user._id, git_id: String(entity.repository.id) } });
						doc = doc[0];
						if (doc) {
							let no_commit = 0
							for (let i = 0; i < entity.commits.length; i++) {
								if (entity.commits[i].author.username == entity.sender.login) {
									no_commit = no_commit + 1;
								}
							}
							var wkyr = this.getWeekyear();
							let cursor = doc.weeklyCommits.findIndex(x => x.week == wkyr.week && x.year == wkyr.year)
							// push commit into dump
							doc.rawCommits.push({ date: Date.now(), numberOfCommit: no_commit })

							if (cursor == -1) {
								//create
								let temp = { week: wkyr.week, year: wkyr.year, totalCommit: no_commit }
								doc.weeklyCommits.push(temp);

							} else {
								let prevreading = doc.weeklyCommits[cursor].totalCommit;
								doc.weeklyCommits[cursor].totalCommit = doc.weeklyCommits[cursor].totalCommit + no_commit;

							}
							//update Trigger here
							let cur_total = this.extractCommits(docs.rawCommits, docs.trigger - maxTime);
							if (cur_total - no_commit <= doc.setMinCommit && cur_total >= doc.setMinCommit) {
								doc.trigger = new Date(doc.trigger).getTime() + doc.maxTime;
							}


							//"trigger": "2020-08-29T20:59:55.029Z",
							doc.updatedAt = new Date();
							let update = {
								"$set": doc
							};
							let docc = await this.adapter.updateById(doc._id, update);
							if (docc) {
								// console.log("success ", docc);
								//cleanup
							}
							return docc

						} else {
							throw new MoleculerClientError("invalid project", 422, "", [{ field: "project", message: " does not exist" }]);

						}

					} else {
						throw new MoleculerClientError("invalid User", 422, "", [{ field: "user", message: " does not exist" }]);

					}
				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("invalid ID!", 422, "", [{ field: "_id", message: " does not exist" }]);

				}
			}
		},
		list: {
			rest: "GET /projects",
			auth: "required"
		},

		get: {
			rest: "GET /projects/:id",
			auth: "required"
		},
		projectAlert: {
			rest: "GET /checkalert",

			async handler(ctx) {
				try {
					let dueprojects = await ctx.call("project.find", { query: { trigger: { $lt: Date.now() } }, populate: ["author"] })
					let notify = [];
					let billnotify = [];
					if (dueprojects.length !== 0) {
						for (let i = 0; i < dueprojects.length; i++) {
							let proj = dueprojects[i];
							var wkyr = this.getWeekyear();
							let cursor = proj.weeklyCommits.findIndex(x => x.week == wkyr.week && x.year == wkyr.year);
							let temp_payload = {
								author: proj.author,
								alarmType: proj.alarmType,
								_id: proj._id,
								maxTime: proj.maxTime,
								setMinCommit: proj.setMinCommit,
								title: proj.title,
								weekCommits: cursor >= 0 ? proj.weeklyCommits[cursor].totalCommit : 0
							}
							if (proj.billing) {
								billnotify.push(temp_payload)
							} else {
								notify.push(temp_payload)
							}
						}
						//send to notification service. print here
						let paidnotification = await ctx.call("notification.sendPaidAlert", { projects: billnotify });
						//call payment service.
						let unpaidnotification = await ctx.call("notification.sendAlert", { projects: notify });
						// return notification
					}
					return { notify, billnotify }

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		projectWarning: {
			rest: "GET /checkwarn",

			async handler(ctx) {
				try {
					let dueprojects = await ctx.call("project.find", { query: { trigger: { $lt: Date.now() + (60 * 60 * 24 * 1000), $gt: Date.now() } }, populate: ["author"] })
					let notify = [];
					if (dueprojects.length !== 0) {
						for (let i = 0; i < dueprojects.length; i++) {
							let proj = dueprojects[i];
							var wkyr = this.getWeekyear();
							let cursor = proj.weeklyCommits.findIndex(x => x.week == wkyr.week && x.year == wkyr.year);
							let temp_payload = {
								author: proj.author,
								alarmType: proj.alarmType,
								_id: proj._id,
								trigger: proj.trigger,
								setMinCommit: proj.setMinCommit,
								title: proj.title,
								weekCommits: cursor >= 0 ? proj.weeklyCommits[cursor].totalCommit : 0
							}
							notify.push(temp_payload)

						}
						//send to warning notification service. print here
						// console.log(notify)
						let notification = await ctx.call("notification.sendWarning", { projects: notify });
						return notification
					}
					return { notify }

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		clearAlert: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {
				try {
					let entity = ctx.params.projects;
					for (let i = 0; i < entity.length; i++) {
						let project = entity[i];
						// console.log(project.title)
						let updated = await this.adapter.updateById(project._id, {
							$set: {
								trigger: Date.now() + project.maxTime,
								// sessionCommit = 0,
								updatedAt: new Date()
							}//add the amount...
						})

					}
					console.log("Alert Cleared")
					return { status: "success" }


				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " Update Failure" }]);

				}
			}
		},
		addDeductHistory: {
			params: {
				payload: { type: "object" }
			},
			async handler(ctx) {
				try {
					const payload = ctx.params.payload;
					let project = this.adapter.updateById(payload._id, {
						$set: {
							updatedAt: new Date()
						},
						$push: {
							commitBills: {
								amount: payload.amount,
								date: new Date()
							}
						}
					});
					return project
				} catch (err) {
					console.log(err);
					throw new MoleculerClientError("Internal Error!", 500, "", [{ field: "Failure", message: " Internal Failure" }]);
				}
			}
		},


		// update: {
		// 	rest: "PUT /projects/:id",
		// 	auth: "required"
		// },

		remove: {
			rest: "DELETE /projects/:id",
			auth: "required",
			async handler(ctx) { }

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

			return { project };
		},

		/**
		 * extract Commit from dump
		 *
		 * @param {Object} project
		 */
		extractCommits(dump, prev) {
			let total = 0;
			let list = dump.filter(commit => {
				return commit.date >= prev && commit.date < Date.now();

			});
			for (let i = 0; i < list.length; i++) {
				total += list[i].numberOfCommit
			}
			return total;
		},

		/**
		 * Transform returned user entity as profile.
		 *
		 * @param {Context} ctx
		 * @param {Object} user
		 * @param {Object?} loggedInUser
		 */
		async transformProfile(ctx, project) {

			return { project: project };
		},
		/**
		 * Returns the week number for this date.  dowOffset is the day of week the week
		 * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
		 * the week returned is the ISO 8601 week number.
		 * @param int dowOffset
		 * @return int
		 */
		getWeekyear() {
			Date.prototype.getWeek = function (dowOffset) {
				/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

				dowOffset = typeof (dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
				var newYear = new Date(this.getFullYear(), 0, 1);
				var day = newYear.getDay() - dowOffset; //the day of week the year begins on
				day = (day >= 0 ? day : day + 7);
				var daynum = Math.floor((this.getTime() - newYear.getTime() -
					(this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
				var weeknum;
				//if the year starts before the middle of a week
				if (day < 4) {
					weeknum = Math.floor((daynum + day - 1) / 7) + 1;
					if (weeknum > 52) {
						nYear = new Date(this.getFullYear() + 1, 0, 1);
						nday = nYear.getDay() - dowOffset;
						nday = nday >= 0 ? nday : nday + 7;
						/*if the next year starts before the middle of
						  the week, it is week #1 of that year*/
						weeknum = nday < 4 ? 1 : 53;
					}
				}
				else {
					weeknum = Math.floor((daynum + day - 1) / 7);
				}
				return weeknum;
			}
			var out = {};
			var mydate = new Date();
			out.week = mydate.getWeek()
			out.year = mydate.getFullYear()
			return out;
		}
	}
};
