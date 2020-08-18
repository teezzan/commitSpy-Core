"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ProjectSchema = new Schema({
	title: {
		type: String,
		trim: true,
		required: "Please fill in title"
	},
	setMinCommit: {
		type: Number
	},
	maxDroughtTime: {
		type: Number
	},
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: "Please fill in an author ID",
	},
	trigger: {
		type: Date
	},
	alarmType: {
		type: Number
	},
	weeklyCommits: [{
		week: Number,
		year: Number,
		totalCommit: Number
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
