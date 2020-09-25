"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
// const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Account = require("../models/account.model");
module.exports = {
	name: "payment",
	mixins: [
		DbService
	],
	adapter: new MongooseAdapter(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }),
	model: Account,
	async started() {

		try {
			let account = await this.adapter.findOne({ name: 'Main' });
			if (account) {
				console.log("Exists. Starting Up Normally");
			} else {
				account = await this.adapter.insert({ name: "Main" });
			}
		} catch (err) {
			console.log(err)
		}
	},


	/**
	 * Default settings
	 */
	settings: {
		/** REST Basepath */
		rest: "/payment",
	},

	/**
	 * Actions
	 */
	actions: {

		deductAlert: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {

				try {
					console.log("deducting");
					const account = await this.adapter.findOne({ name: 'Main' });

					let entity = ctx.params.projects;
					for (let i = 0; i < entity.length; i++) {
						let project = entity[i];
						//update project
						let res = await ctx.call("project.addDeductHistory", { payload: { _id: project._id, amount: 1 } })
						let user = await ctx.call("users.deductWallet", { payload: { _id: project.author._id, cost: 1 } });

						let updated = await this.adapter.updateById(account._id, {
							$set: {
								updatedAt: new Date()
							},
							$push: {
								egress: {
									amount: 1,
									date: new Date(),
									author: project.author._id
								}
							},
							$inc: {
								totalEgress: 1
							}
						});
					}
				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Payment Error!", 500, "", [{ field: "Failure", message: " Internal Failure" }]);

				}
			}
		},
		acceptPayment: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {

				try {

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Payment Error!", 500, "", [{ field: "Failure", message: " Internal Failure" }]);

				}
			}
		},
		test: {
			rest: "GET /test",

			async handler(ctx) {
				try {
					return "res"
				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
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
