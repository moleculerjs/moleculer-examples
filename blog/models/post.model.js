"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let PostSchema = new Schema({
	title: {
		type: String,
		trim: true
	},
	content: {
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
