const _ = require("lodash");
const path = require("path");
const chalk = require("chalk");
const express = require("express");
const bodyParser = require("body-parser");
const url = require("url");

const { Context } = require("moleculer");
const Promise = require("bluebird");

module.exports = function() {
	return {
		name: "api",

		// API gateway settings
		settings: {
			port: process.env.PORT || 4000
		},
		
		created() {
			// Create an Express application
			this.app = express();

			// Add middlewares
			this.app.use(bodyParser.urlencoded({
				extended: true
			}));
			this.app.use(bodyParser.json());

			this.app.use(express["static"](path.join(__dirname, "..", "assets")));

			this.app.set("etag", true);
		},

		started() {
			// Register handler for requests
			this.app.use("/api", (req, res) => {
				this.logger.debug(`${req.method.toUpperCase()} ${req.url}`);
				const { pathname } = url.parse(req.url);

				const actionName = pathname.slice(1).replace(/~/, "$").replace(/\//g, ".");
				if (actionName) {
					const params = _.defaults({}, req.query, req.params, req.body);

					this.logger.info(`Call '${actionName}' action with params:`, params);

					return this.broker.call(actionName, params)
						.then(data => {
							res.json(data);
						})
						.catch(err => {
							this.logger.error(err);
							res.status(err.code || 500).send("Error: " + err.message);				
						});

				} else {
					res.sendStatus(404);
				}
			});

			this.logger.debug("--------------------------------------------------");

			// Start HTTP server
			this.app.listen(this.settings.port, err => {
				if (err) 
					return this.logger.error("Web server listen error!", err);

				// Print some info
				this.logger.info("");
				this.logger.info("Web server:  " + chalk.white.bold(`http://localhost:${this.settings.port}/`));
				this.logger.info("API gateway: " + chalk.white.bold(`http://localhost:${this.settings.port}/api`));
				this.logger.info("");
				this.logger.debug("Available actions:");
				this.logger.debug("==================");
				this.logger.debug("");

				// Print list of registered actions
				const actions = this.broker.getLocalActionList();
				Object.keys(actions).forEach(key => {
					let action = actions[key];
					let line = [chalk.bold.green(_.padEnd(key, 20))];
					if (action.description)
						line.push(" - " + action.description);
					this.logger.debug("    " + line.join(""));
				});

				this.logger.debug("");
				this.logger.debug("--------------------------------------------------");
				this.logger.debug("");
			});
		},

		stopped() {
			//this.app.close();
		}
	};
};