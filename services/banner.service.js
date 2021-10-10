"use strict";
const DbService = require("moleculer-db");
const { authorize } =require("auth-adapter");
const Sequelize = require("sequelize");
const {adapter1} = require("../config/vars");
const Banner =require("../model/banner.model");
const { createValidation,updateValidation,listValidation } =require("../validation/banner.validation");
const middleware =require("../middleware/banner.middleware");
const { MoleculerError } = require("moleculer").Errors;
const Permissions =require("../utils/Permissions");
const messages =require("../utils/messages");
const SERVICE =require("../utils/service-name");
//const Banner =require("../models/banner.model");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name:SERVICE.Banner,
	mixins: [DbService],
	adapter:adapter1,
	model: Banner,

	
	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		created: {
			rest: {
				method: "POST",
				path: "/"
			},
			params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				try {
					let result=await ctx.call("banner.create",entity);
					console.log("result aaa");
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Banner.transform(result)
					});
				} catch (error) {
					throw new MoleculerError("Create banner not successful", 400, "ERROR", error);
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
			params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { banner } = ctx.locals;
					let entity=ctx.body;
					console.log(entity);
					// console.log(ctx.params);
					this.adapter.updateById(ctx.params.id,entity);
					//let result= await ctx.call("banner.update",{where:{id:ctx.params.id}},entity);
					// banner.update(entity)
					// 	.then(result=>{
					// 		console.log(result);
					// 	})
					// ;
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
			params: listValidation,
			async handler(ctx) {
				try {
					const filterParam=Banner.filterConditions(
						ctx.params
					);
					console.log(filterParam);
					const search={
						// search:"home_v1_popup",
						// searchFields:["type"],
						query:filterParam
					};
					let result=await this.adapter.find(search);
					return ({
						code: 0,
						count: ctx.totalRecords,
						data: result.map(s => Banner.transform(s))
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
					
				}
			}
		}
	},

	
	hooks:{
		before: {
			// Define a global hook for all actions
			// The hook will call the `resolveLoggedUser` method.
			// Define multiple hooks
			updated: [
				middleware.load,
				middleware.prepareUpdate
			],
			created: [
				// authorize([Permissions.BANNER_CREATE]),
				 middleware.prepareParams
			],
			geted:[
				middleware.count
			]
		},
		
		after: {
			// Define a global hook for all actions
			// The hook will call the `resolveLoggedUser` method.
			"*": "hello",

			// Define multiple hooks
			hello: [
				function test(ctx) {
					console.log("hook after call method",ctx.params);
					ctx.emit("banner.hello");
				},
			],
			welcome: [
				function test(ctx) {
					console.log("hook after call method",ctx.params);
					ctx.emit("banner.welcome");
				},
			],
		}
	},
	/**
	 * Methods
	 */
	methods: {

	},
	/**
	 * Service created lifecycle event handler
	 */
	created() {
		console.log("create");
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		console.log("start run");
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
