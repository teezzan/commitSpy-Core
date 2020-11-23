"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let UserSchema = new Schema({
	username: {
		type: String,
		unique: true,
		index: true,
		lowercase: true,
		required: "Please fill in a username",
		trim: true
	},
	git_id: {
		type: String,
		unique: true
	},
	git_token: {
		type: String,
	},
	password: {
		type: String,
		required: "Please fill in a password"
	},
	fullName: {
		type: String,
		trim: true,
		"default": ""
	},
	email: {
		type: String,
		trim: true,
		unique: true,
		index: true,
		lowercase: true,
		required: "Please fill in an email"
	},
	twitter: {
		type: String,
	},
	avatar: {
		type: String
	},
	wallet: {
		type: Number,
		"default": 20
	},
	streak: {
		type: Number,
		"default": 0
	},
	longest_streak: {
		type: Number,
		"default": 0
	},
	total_hits: {
		type: Number,
		"default": 0
	}
}, {
	timestamps: true
});

// // Add full-text search index
// UserSchema.index({
// 	//"$**": "text"
// 	"fullName": "text",
// 	"username": "text"
// });

module.exports = mongoose.model("User", UserSchema);
