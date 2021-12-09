"use strict";
const DbService = require("moleculer-db");
//const SequelizeDbAdapter =require("../mixins/db.sequelize");
//const { authorize } =require("auth-adapter");
// Sequelize = require("sequelize");
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
		// field return 
		// fields: ["_id", "url", "type", "title", "content", "position", "image_url", "mobile_url", "view_count", "click_count", "is_active", "is_visible", "created_at", "created_by"]
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
			auth: "required",
			authen: [Permissions.BANNER_UPDATE],
			rest: {
				method: "GET",
				path: "/"
			},
			params: listValidation,
			async handler(ctx) {
				try {
					const {
						types,
						is_visible
					}=ctx.params;
					const options = Banner.filterConditions({
						types,
						is_visible
					});
					const search={
						// search:"home_v1_popup",
						// searchFields:["type"],
						query:options
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
						data:Banner.transform(ctx.locals.banner)
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
					const { banner } = ctx.locals;
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
			],
			get1:[
				middleware.load,
			],
			deleted:[
				middleware.load,
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
		async getaa(ctx,{id}){
			console.log("aaa");
			let {dataValues}=await this.adapter.findOne({id});
			ctx.locals = ctx.locals ? ctx.locals : {};
			ctx.locals.banner = dataValues;
		}
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
