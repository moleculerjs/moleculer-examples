"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let LikeSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: "Please fill in a user ID",
	},
	post: {
		type: Schema.Types.ObjectId,
		ref: "Post",
		required: "Please fill in a post ID",
	}
}, {
	timestamps: true
});

// Add index
LikeSchema.index({user: 1, post: 1}, {unique: true});

module.exports = mongoose.model("Like", LikeSchema);
