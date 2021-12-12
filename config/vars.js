
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
exports.urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
const DB_NAME = process.env.NODE_ENV !== "development" ? process.env.DB_NAME : "moleculer";
const HOST_DB = process.env.NODE_ENV !== "development" ? process.env.HOST_DB : "localhost";
const DB_USER = process.env.NODE_ENV !== "development" ? process.env.DB_USER : "admin";
const DB_PASS = process.env.NODE_ENV !== "development" ? process.env.DB_PASS : "admin";
exports.adapter1 = new SqlAdapter(DB_NAME || "moleculer", DB_USER || "admin", DB_PASS || "admin", {
	host: HOST_DB,
	dialect: "postgres",
	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},
	define: {
		timestamps: false
	},
});

exports.connnectProduct = new Sequelize(
	urlProduct,
	{
		dialect: "postgres",

	}
);
exports.config = {
	secretKey: "development",
	secretKeyToRefreshToken: "3002",
	expToken: 60 * 60,
	expRefreshToken: 60 * 60 * 2
};
