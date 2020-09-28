"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ProjectSchema = new Schema({
	title: {
		type: String,
		trim: true,
		required: "Please fill in title"
	},
	git_id: {
		type: String,
		trim: true,
		"default": "0"
	},
	setMinCommit: {
		type: Number,
		"default": 15
	},
	maxTime: {
		type: Number,
		"default": 60 * 60 * 24 * 1000 * 7
	},
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: "Please fill in an author ID",
	},
	trigger: {
		type: Date,
		"default": Date.now() + 60 * 60 * 24 * 1000 * 7
	},
	alarmType: {
		type: Number,
		"default": 0
	},
	billing: {
		type: Boolean,
		"default": false
	},
	weeklyCommits: [{
		week: Number,
		year: Number,
		totalCommit: Number
	}],
	rawCommits: [{
		date: Date,
		numberOfCommit: Number,
	}],
	remainCommit: {
		type: Number,
		"default": 0
	},
	commitBills: [{
		amount: Number,
		date: Date,
	}],
}, {
	timestamps: true
});

// // Add full-text search index
// PostSchema.index({
// 	//"$**": "text"
// 	"title": "text",
// 	"content": "text"
// });

module.exports = mongoose.model("Project", ProjectSchema);
