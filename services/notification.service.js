"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
// const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
module.exports = {
	name: "notification",
	mixins: [

	],

	/**
	 * Default settings
	 */
	settings: {
		/** REST Basepath */
		rest: "/",

		// /** Public fields */
		// fields: ["_id", "title", "git_id", "setMinCommit", "maxTime", "author", "trigger", "alarmType", "weeklyCommits", "billing"],

		/** Validator schema for entity */
		entityValidator: {
			author: { type: "object" },
			alarmType: { type: "number" },
			_id: { type: "string" },
			trigger: { type: "string", optional: true },
			maxTime: { type: "number", optional: true },
			setMinCommit: { type: "number" },
			title: { type: "string", min: 2 },
			weeklyCommits: { type: "number" },
		}
	},

	/**
	 * Actions
	 */
	actions: {

		sendPaidAlert: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {
				let mailpayload = [];

				try {
					console.log("sending paid alert")
					let entity = ctx.params.projects;
					for (let i = 0; i < entity.length; i++) {
						let project = entity[i];
						if (project.alarmType == 1) {

							// this.sendTwit({ handle: project.author.twitter, weekCommits: project.weekCommits, setMinCommit: project.setMinCommit });
							//so-so and so will be glad for your donations in Tweets.
						}
						//compose mail
						let html = await this.composeMailPaid({ author: project.author, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits, title: project.title })
						let msg = {
							to: `${project.author.email}`,
							from: 'taiwo@skrypt.com.ng',
							subject: 'You Just Missed Your Commit Goals.',
							text: 'and a charity thanks you.',
							html
						};
						mailpayload.push(msg);

					}
					// console.log(mailpayload);
					sgMail.send(mailpayload)
						.then(res => {
							console.log("Success  sending Paid alert=>")
							// console.log(res)
							//call action to clear trigger
							let clear = ctx.call("project.clearAlert", { projects: entity });
							//call action to deduct money and move to another account where we then split and distribute accordingly
							let deducted = ctx.call("payment.deductAlert", { projects: entity });
							return { status: "successs", mailpayload }
						})
						.catch(err => {
							console.log("error")
							console.log(err.response.body.errors)
						})

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		sendAlert: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {
				let mailpayload = [];
				try {
					console.log("sending unpaid alert")

					let entity = ctx.params.projects;
					for (let i = 0; i < entity.length; i++) {
						let project = entity[i];
						if (project.alarmType == 1) {

							// this.sendTwit({ handle: project.author.twitter, weekCommits: project.weekCommits, setMinCommit: project.setMinCommit });
							//so-so and so will be glad for your donations in Tweets.
						}
						//compose mail
						let html = await this.composeMailUnPaid({ author: project.author, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits, title: project.title })
						let msg = {
							to: `${project.author.email}`,
							from: 'taiwo@skrypt.com.ng',
							subject: 'You Just Missed Your Commit Goals.',
							text: 'and you can do better.',
							html
						};
						mailpayload.push(msg);

					}
					// console.log(mailpayload);
					sgMail.send(mailpayload).then(res => {
						console.log("Success sending unpaid =>")
						// console.log(res)
						//call action to clear trigger
						let clear = ctx.call("project.clearAlert", { projects: entity });
						return { status: "successs", mailpayload }
					})
						.catch(err => {
							console.log("error")
							console.log(err.response.body.errors)
						})

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		sendWarning: {
			params: {
				projects: { type: "array" }
			},
			async handler(ctx) {
				let mailpayload = [];
				try {
					let entity = ctx.params.projects;
					for (let i = 0; i < entity.length; i++) {
						let project = entity[i];
						if (project.alarmType == 1) {
							// this.sendTwit({ handle: project.author.twitter, weekCommits: project.weekCommits, setMinCommit: project.setMinCommit });
						}
						//compose mail
						let html = await this.composeMail({ author: project.author, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
						let msg = {
							to: `${project.author.email}`,
							from: 'taiwo@skrypt.com.ng',
							subject: 'Warning! Just A Little More To Go.',
							text: 'and you will reach your goals',
							html
						};
						mailpayload.push(msg);

					}
					// console.log(mailpayload);
					sgMail.send(mailpayload).then(res => {
						console.log("Success =>")
						// console.log(res)
						return { status: "successs", mailpayload }
					})
						.catch(err => {
							console.log("error")
							console.log(err.response.body.errors)
						})

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		sendPassMsg: {
			params: {
				user: { type: "object" }
			},
			async handler(ctx) {
				try {
					let entity = ctx.params.user;
					console.log(user);
					//compose mail
					let html = await this.composePassMail({ username: entity.username, url: entity.url });
					let msg = {
						to: `${entity.email}`,
						from: 'taiwo@skrypt.com.ng',
						subject: 'Password Reset',
						text: 'Confirmation.',
						html
					};
					sgMail.send([msg]).then(res => {
						console.log("Success =>");
						return { status: "successs", msg }
					})
						.catch(err => {
							console.log("error")
							console.log(err.response.body.errors)
						})

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		sendTwit: {
			params: {
				payload: { type: "object" }
			},
			async handler(ctx) {
				try {
					console.log("sent twitt");
				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Notifier Error!", 422, "", [{ field: "Failure", message: " Internal Failure" }]);

				}
			}
		}
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
		composeMail(payload) {

			let mailbody = ` <p> Hello ${payload.author.username},</p>
					<p>This is to notify you that you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commit goal for repository ${payload.title}. Please endeavour to push your codes
					 and write more if you haven't already.
					</p>
					<p> Happy Coding.
					</p>
					<p>Taiwo
					</p>`;
			return mailbody
		},
		composePassMail(payload) {

			let mailbody = ` <p> Hello ${payload.username},</p>
					<p>You have requested to change your password. To continue click the button below.
					</p>
					<button onclick="window.location.href='${payload.url}';">Reset Password</button>
					<p> If you did not request this, please ignore. Thank You
					</p>
					<p>Taiwo
					</p>`;
			return mailbody
		},
		composeMailPaid(payload) {

			let mailbody = ` <p> Hello ${payload.author.username},</p>
					<p>This is to notify you that you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commit goal for repository ${payload.title} and have missed the deadline. There is time to makeup next week.
					I hope you do better.
					</p>

					<p> By the way, Dig A Well initiative says Thank You for your Donation. I am glad you're making the world a better place.
					</p>
					<p>Best Regards,</p>
					<p>Taiwo
					</p>`;
			return mailbody
		},
		composeMailUnPaid(payload) {

			let mailbody = ` <p> Hello ${payload.author.username},</p>
					<p>This is to notify you that you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commit goal for repository ${payload.title} and have missed the deadline. There is time to makeup next week.
					I hope you do better.
					</p>

					<p>Best Regards,</p>
					<p>Taiwo
					</p>`;
			return mailbody
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
