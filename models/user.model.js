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
		trim: true,
		unique: true,
		// lowercase: true,
		// required: "Please fill in an email"
	},
	avatar: {
		type: String
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
