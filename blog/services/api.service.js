/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const ApiGatewayService = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGatewayService],

	settings: {
		PORT: 3001,
		routes: [
			{
				path: "/api",

				whitelist: [
					"**"
				],

				aliases: {
					"REST posts": "posts"
				}
			}
		],

		assets: {
			folder: "./www"
		}

	}		
};