import Sequelize from "sequelize";
import bluebird from "bluebird";
import { postgres, env } from "../config/vars";

Sequelize.Promise = bluebird;

const defaultErrorHandler = (err) => {
	console.log(`Connection to Postgres error: ${err}`);
};

const app = {
	sequelize: new Sequelize(
		postgres.uri,
		{
			dialect: "postgres"
		}
	),
	connect(errorHandler = defaultErrorHandler) {
		this.sequelize.authenticate()
			.then(() => {
				console.log("Postgres connection established!");
				if (env === "1") {
					this.sequelize.sync({
						alter: true,
						logging: true
					});
				}
			}).catch(error => {
				errorHandler(error);
			});
		return this.sequelize;
	},
	disconnect() {
		// close connection
		console.log("Closing postgres connection!");
		this.sequelize.close();
	}
};

export default app;
