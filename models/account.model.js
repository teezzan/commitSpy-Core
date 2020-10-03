"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let AccountSchema = new Schema({
	name: {
		type: String,
		trim: true,
		required: "Please fill in title",
		unique: true
	},
	unit: {
		type: String,
		"default": "$"
	},
	totalIngress: {
		type: Number,
		"default": 0
	},
	totalEgress: {
		type: Number,
		"default": 0
	},
	ingress: [{
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: "Please fill in an author ID",
		},
		amount: Number,
		date: Date,
	}],
	egress: [{
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: "Please fill in an author ID",
		},
		amount: Number,
		date: Date,
	}],
}, {
	timestamps: true
});


module.exports = mongoose.model("Account", AccountSchema);
