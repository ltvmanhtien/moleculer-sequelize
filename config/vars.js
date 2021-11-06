



const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
exports.urlProduct = "postgres://admin:admin@127.0.0.1:5432/moleculer";
exports.adapter1 = new SqlAdapter("moleculer","admin","admin",{
	host:"localhost",
	dialect:"postgres",
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
exports.config={
	secretKey:"development",
	secretKeyToRefreshToken:"3002",
	expToken:60*60,
	expRefreshToken:60*60*2
};
