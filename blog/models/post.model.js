"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let PostSchema = new Schema({
	title: {
		type: String,
		trim: true,
		required: "Please fill in title"
	},
	content: {
		type: String,
		trim: true
	},
	coverPhoto: {
		type: String
	},
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: "Please fill in an author ID",
	},
	category: {
		type: String,
		trim: true
	}
}, {
	timestamps: true
});

// Add full-text search index
PostSchema.index({
	//"$**": "text"
	"title": "text",
	"content": "text"
});

module.exports = mongoose.model("Post", PostSchema);
