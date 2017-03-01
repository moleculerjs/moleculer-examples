let _ = require("lodash");
let express = require("express");
let { Context } = require("moleculer");
const Promise = require("bluebird");

module.exports = function() {
	return {
		name: "api",
		settings: {
			port: 3000
		},
		
		created() {
			this.app = express();
			this.logger.info("API gateway created!");
		},

		started() {
			this.app.use("/api", (req, res) => {
				this.logger.debug(`${req.method.toUpperCase()} ${req.url}`);
				const url = req.url.slice(1);
				const actionName = url.replace(/~/, "$").replace(/\//g, ".");
				const params = _.defaults({}, req.query, req.params, req.body);

				this.logger.info(`Call '${actionName}' action with params:`, params);

				return this.broker.call(actionName, params).then(data => {
					res.json(data);
				})
				.catch(err => {
					this.logger.error(err);
					res.status(err.code || 500).send("Error: " + err.message);				
				});
			});

			this.logger.debug("--------------------------------------------------");

			this.app.listen(this.settings.port, err => {
				if (err) 
					return this.logger.error("Web server listen error!", err);

				this.logger.info("");
				this.logger.info(`Web server:  http://localhost:${this.settings.port}/`);
				this.logger.info(`API gateway: http://localhost:${this.settings.port}/api`);
				this.logger.info("");
			});
		},

		stopped() {
			this.app.close();
		}
	};
};