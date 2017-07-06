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
	author: {
		type: Boolean,
		"default": false
	},
	avatar: {
		type: String
	}
}, {
	timestamps: true
});

// Add full-text search index
UserSchema.index({
	//"$**": "text"
	"fullName": "text",
	"username": "text"
});

module.exports = mongoose.model("User", UserSchema);
