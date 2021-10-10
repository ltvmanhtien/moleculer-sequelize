



const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
exports.urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
exports.adapter1 = new SqlAdapter(urlProduct);
exports.connnectProduct = new Sequelize(
	urlProduct,
	{
		dialect: "postgres"
	}
);