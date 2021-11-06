"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const {adapter1} = require("../config/vars");
const messages =require("../utils/messages");
const SERVICE =require("../utils/service-name");
const User=require("../model/user.model");
const middleware =require("../middleware/user.middleware");
const bcrypt=require("bcryptjs");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.User,
	mixins: [DbService],
	adapter:adapter1,
	model: User,
	/**
	 * Settings
	 */
	settings: {
		
	},

	/**
	 * Actions
	 */
	actions: {
		register: {
			rest: {
				method: "POST",
				path: "/register"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				try {
					entity.password= await this.parsePassword(entity.password);
					console.log(entity);
					let result=await ctx.call(`${SERVICE.User}.create`,entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: User.transform(result)
					});
				} catch (error) {
					
					throw new MoleculerError("Create User not successful", 400, "ERROR", error);
				}

			}
		},
		getUserByEmail:{
			async handler(ctx){
				try {
					return await this.adapter.findOne({where:{email:ctx.params.email}});
				} catch (error) {
					throw new MoleculerError("get User not successful", 400, "ERROR", error);
				}
			}
		},
		created: {
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				console.log(entity);
				try {
					let result=await ctx.call(`${SERVICE.User}.create`,entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: User.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create User not successful", 400, "ERROR", error);
				}

			}
		},

		/**
		 * update
		 */
		updated: {
			rest: {
				method: "PUT",
				path: "/:id"
			},
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { User } = ctx.locals;
					let entity=ctx.params;
					// console.log(ctx.params);
					await this.adapter.updateById(ctx.params.id,entity);
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
				}
				
			}
		},
		/**
		 * 
		 */
		geted:{
			rest: {
				method: "GET",
				path: "/"
			},
			// params: listValidation,
			async handler(ctx) {
				try {
					const filterParam=User.filterConditions(
						ctx.params
					);
					const search={
						// search:"home_v1_popup",
						// searchFields:["type"],
						query:filterParam
					};
					let result=await this.adapter.find(search);
					return ({
						code: 0,
						count: ctx.totalRecords,
						data: result.map(s => User.transform(s))
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
					
				}
			}
		},
		get1:{
			rest: {
				method: "GET",
				path: "/:id"
			},
			async handler(ctx){
				try {
				
					return ({
						code:0,
						data:User.transform(ctx.locals.User)
					});
				} catch (ex) {
					throw new MoleculerError("get not successful", 400, "not sucessfull", ex);
				}
			}
		},
		deleted:{
			rest: {
				method: "DELETE",
				path: "/:id"
			},
			async handler(ctx){
				try {
					const { User } = ctx.locals;
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					this.adapter.updateById(ctx.params.id,entity);
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
				}
				
			}
		}
	},


	hooks: {
		before: {
			register:[
				middleware.checkEmail
			],
			// created:[
			// 	// middleware.prepareParams,
			// ],
			updated:[
				middleware.load,
				middleware.prepareUpdate,
			],
			get1:[
				middleware.load,
				middleware.loadProductOption
			],
			geted:[
				middleware.sum,
				middleware.count
			],
			deleted:[
				middleware.load,
			]
		},
		// after:{
		// 	register:[
		// 		parsePassword(ctx){

		// 		}
		// 	]
		// }
	},

	/**
	 * Methods
	 */
	methods: {
		
		async parsePassword(password) {
			const salt = await bcrypt.genSalt(10);
			const passwordHash = await bcrypt.hash(password, salt);
			return passwordHash;
		}
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
