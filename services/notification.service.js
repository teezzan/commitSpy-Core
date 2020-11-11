"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
var Twit = require('twit');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let T = new Twit({
	access_token: process.env.ACCESS_TOKEN, //|| config.access_token,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET, //|| config.access_token_secret,
	consumer_key: process.env.CONSUMER_KEY, //|| config.consumer_key,
	consumer_secret: process.env.CONSUMER_SECRET //|| config.consumer_secret
});

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
						if (project.alarmType == 1 && project.author.twitter) {
							let tweet = await this.composeTweetPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let out = await this.postStatus(tweet);
						}
						else if (project.alarmType == 2 && project.author.twitter) {
							let text = await this.composeTweetPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })

							const obj = {
								screen_name: project.author.twitter,
								text
							};
							setTimeout(() => {
								T.post("direct_messages/new", obj)
									.catch(err => {
										console.error("error", err.stack);
									})
									.then(result => {
										console.log(`Message sent successfully 💪💪`);
									});
							}, 50);
						}
						else if (project.alarmType == 0) {
							//compose mail
							let html = await this.composeMailPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let msg = {
								to: `${project.author.email}`,
								from: '"CommitSpy" <noreply@commitspy.com>',
								subject: 'You Just Missed Your Commit Goals',
								text: 'and a donation has been made on your behalf.',
								html
							};
							await ctx.call("mail.send", msg)
							mailpayload.push(msg);
						}


					}
					let clear = ctx.call("project.clearAlert", { projects: entity });
					//call action to deduct money and move to another account where we then split and distribute accordingly
					let deducted = ctx.call("payment.deductAlert", { projects: entity });
					return { status: "successs", mailpayload }

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
						if (project.alarmType == 1 && project.author.twitter) {
							let tweet = await this.composeTweetUnPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let out = await this.postStatus(tweet);
						}
						else if (project.alarmType == 2 && project.author.twitter) {
							let text = await this.composeTweetUnPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })

							const obj = {
								screen_name: project.author.twitter,
								text
							};
							setTimeout(() => {
								T.post("direct_messages/new", obj)
									.catch(err => {
										console.error("error", err.stack);
									})
									.then(result => {
										console.log(`Message sent successfully 💪💪`);
									});
							}, 50);
						}
						else if (project.alarmType == 0) {
							//compose mail
							let html = await this.composeMailUnPaid({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let msg = {
								to: `${project.author.email}`,
								from: '"CommitSpy" <noreply@commitspy.com>',
								subject: 'You Just Missed Your Commit Goals',
								text: 'do better.',
								html
							};
							await ctx.call("mail.send", msg)
							mailpayload.push(msg);
						}

					}
					console.log("clearing alert temporarily");
					let clear = ctx.call("project.clearAlert", { projects: entity });

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
						if (project.alarmType == 1 && project.author.twitter) {
							let tweet = await this.composeTweetAlert({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let out = await this.postStatus(tweet);
						}
						else if (project.alarmType == 2 && project.author.twitter) {
							let text = await this.composeTweetAlert({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })

							const obj = {
								screen_name: project.author.twitter,
								text
							};
							setTimeout(() => {
								T.post("direct_messages/new", obj)
									.catch(err => {
										console.error("error", err.stack);
									})
									.then(result => {
										console.log(`Message sent successfully 💪💪`);
									});
							}, 50);
						}
						else if (project.alarmType == 0) {
							//compose mail
							let html = await this.composeMail({ author: project.author, title: project.title, setMinCommit: project.setMinCommit, weekCommits: project.weekCommits })
							let msg = {
								to: `${project.author.email}`,
								from: '"CommitSpy" <noreply@commitspy.com>',
								subject: 'Warning! Just A Little More To Go.',
								text: 'and you will reach your goals',
								html
							};
							await ctx.call("mail.send", msg)
							mailpayload.push(msg);
						}

					}

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
					console.log(entity);
					//compose mail
					let html = await this.composePassMail({ username: entity.username, url: entity.url });
					let msg = {
						to: `${entity.email}`,
						from: '"CommitSpy" <noreply@commitspy.com>',
						subject: 'Password Reset',
						text: 'Confirmation.',
						html
					};
					ctx.call("mail.send", msg).then(x => { return { status: "successs", msg } })

				}
				catch (err) {
					console.log(err)
					throw new MoleculerClientError("Scheduler Error!", 422, "", [{ field: "Failure", message: " dInternal Failure" }]);

				}
			}
		},
		test: {
			auth: "required",
			rest: "GET /test",

			async handler(ctx) {
				try {
					let author = ctx.meta.user1;
					let text = "Hellow tee. How far . we just dey test ni o  💪💪💪💪"
					const obj = {
						id: "944356459676135424",
						text
					};
					setTimeout(() => {
						T.post("direct_messages/new", obj)
							.catch(err => {
								console.error("error", err.stack);
							})
							.then(result => {
								console.log(`Message sent successfully  💪💪`);
							});
					}, 50);

					return { status: true };
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
					<a href="${payload.url}"><button>Reset Password</button></a>
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
		composeTweetAlert(payload) {

			let mailbody = `  Hello ${payload.author.twitter}, you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commit goal for repository ${payload.title}. Please endeavour to push your codes
					 and write more if you haven't already. Happy Coding.
					`;
			return mailbody
		},
		composeTweetPaid(payload) {

			let mailbody = ` Hello @${payload.author.twitter},
					you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commitS goal for repo ${payload.title} and have missed the deadline.
					BTW, Thank You for your KIND Donation.
					`;
			return mailbody
		},
		composeTweetUnPaid(payload) {

			let mailbody = ` Hello @${payload.author.twitter},
					you are ${payload.setMinCommit - payload.weekCommits} commits shy of your
					${payload.setMinCommit} commitS goal for repo ${payload.title} and have missed the deadline.
					`;
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
		},
		async postImage(filePath, status) {
			T.postMediaChunked({ file_path: filePath, media_category: 'image/png' }, function (err, data, response) {
				console.log(data)
				var mediaIdStr = data.media_id_string
				var altText = "commit Alert."
				var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
				console.log('success 1');
				setTimeout(() => {
					T.post('media/metadata/create', meta_params, function (err, data, response) {
						if (!err) {
							// now we can reference the media and post a tweet (media will attach to the tweet)
							var params = { status, media_ids: [mediaIdStr] }
							console.log('success 2');
							T.post('statuses/update', params, function (err, data, response) {
								if (data.errors.length !== 0) {
									console.log("retrying");
								} else {
									console.log("success 3")
								}
							})

						} else {
							console.log(err);
						}
					})
				}, 2000);

			})

		},
		async postStatus(status) {
			T.post('statuses/update', { status }, function (err, data, response) {
				console.log(data);
				return true
			})
		}

	}
};
