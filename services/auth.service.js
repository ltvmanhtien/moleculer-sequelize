"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const {pick}=require("lodash");
const {adapter1} = require("../config/vars");
const SERVICE =require("../utils/service-name");
const JWT = require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const {config}=require("../config/vars");
const middleware =require("../middleware/user.middleware");
const Moment =require("moment-timezone");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Auth,
	mixins: [DbService],
	// adapter:adapter1,
	// model: ProductOption,
	/**
	 * Settings
	 */
	settings: {
	
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			login:[
				middleware.loadUser
			]
		}
	},

	/**
	 * Actions
	 */
	actions: {
		login:{
			async handler(ctx){
				const {user}=ctx.locals;
				const {password}=ctx.params;
				const isMatch = await bcrypt.compare(password, user.password);
				if (!isMatch) {
					return ({ msg: "password not correct" });
				}
				const token = await this.generateToken(user, config.expToken);
				// const refreshToken = await this.generateRefreshToken(user, config.expRefreshToken);
				return ({ token, user: user });
			}
		},
		verifyToken: {
			handler(ctx) {
				let { key, token } = ctx.params;
				if (!ctx.params.key) {
					key = config.secretKey;
				}
				
				token = token.split(" ")[1];

				return new this.Promise((resolve, reject) => {
					JWT.verify(token, config.secretKey, (err, decoded) => {
						if (err) {
							return reject(err);
						}
						resolve(decoded);
					});
				})
					.then(decoded => {
						return decoded;
					});
			}

		},
	},

	/**
	 * Methods
	 */
	methods: {
		generateToken(user, exp) {
			let id=user.id;
			user = pick(user, ["name", "avatar", "email", "phone", "group"]);
			user.sub = id;
			console.log(user);
			// req.locals = {
			// 	user
			// };
			const inforToken = {};

			inforToken.token = JWT.sign(user, process.env.NODE_ENV || "development", { expiresIn: 60 * 60*1000 });
			inforToken.refresToken = JWT.sign(user, process.env.PORT || "3002", { expiresIn: 60 * 60 * 100 });
			inforToken.expTime = Moment.tz(new Date(), "Asia/Ho_Chi_Minh").unix();
			inforToken.expRefreshTime = Moment.tz(new Date(), "Asia/Ho_Chi_Minh").unix();
			return inforToken;
		},
		generateRefreshToken(user, exp) {
			console.log(exp);
			if (!exp) {
				exp = +Math.floor(Date.now()) + (60 * 60 * 1000);

			}
			return (
				JWT.sign({
					iss: "xoaycodeeasy",
					sub: user,
					iat: new Date().getTime(), // current time
					exp: exp, //Math.floor(Date.now() / 1000) + (60*60*12) 1h =60*60
				},
				config.secretKeyToRefreshToken
				)
			);
		},
	},
	events: {
		"banner.hello": {
			// Register handler to the "other" group instead of "payment" group.
			group: "banner",
			handler(payload) {
				console.log("product  receive event from banner");
			}
		}
	},
	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
