"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const {pick}=require("lodash");
const Sequelize = require("sequelize");
const {adapter1} = require("../config/vars");
const SERVICE =require("../utils/service-name");
const Store=require("../model/store.model");
const Permissions =require("../utils/Permissions");
const messages =require("../utils/messages");
const middleware =require("../middleware/store.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Store,
	mixins: [DbService],
	adapter:adapter1,
	model:Store,
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
			// Define a global hook for all actions
			// The hook will call the `resolveLoggedUser` method.
			// Define multiple hooks
			updated: [
				middleware.load,
			],
			// created: [
			// 	// authorize([Permissions.BANNER_CREATE]),
			// 	 middleware.prepareParams
			// ],
			// geted:[
			// 	middleware.count
			// ],
			get1:[
				middleware.load,
			],
			deleted:[
				middleware.load,
			]
		},
	},

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
			auth: "required",
			authen: [Permissions.STORE_CREATE],
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				console.log(ctx.meta.user);
				entity.created_by=pick(ctx.meta.user,["id","name"]);
				try {
					let result=await ctx.call(`${SERVICE.Store}.create`,entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Store.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create store not successful", 400, "ERROR", error);
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
			authen: [Permissions.STORE_UPDATE],
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { store: oldModel } = ctx.locals;
					const dataChanged = Store.getChangedProperties({
						oldModel: oldModel,
						newModel: ctx.params
					});
					const operations = pick(ctx.params, dataChanged);
					operations.updated_at = new Date();
					let entity=operations;
					console.log(entity,ctx.params);
					let result=	await this.adapter.model.update(entity,{where:{id:ctx.params.id}});			
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
			authen: [Permissions.STORE_GET],
			rest: {
				method: "GET",
				path: "/"
			},
			// params: listValidation,
			async handler(ctx) {
				try {
					const filterParam=Store.filterConditions(
						ctx.params
					);
					const search={
						// search:"home_v1_popup",
						// searchFields:["type"],
						query:filterParam
					};
					let store=await this.adapter.find(search);
					return ({
						code:0,
						data:store.map(Store.transform)
					});
				} catch (ex) {
					throw new MoleculerError("list not successful", 400, "not sucessfull", ex);
						
				}
			}
		},
		get1:{
			auth: "required",
			authen: [Permissions.STORE_GET],
			rest: {
				method: "GET",
				path: "/:id"
			},
			async handler(ctx){
				try {
					return ({
						code:0,
						data:Store.transform(ctx.locals.store)
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
					const { store } = ctx.locals;
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					await this.adapter.model.update(entity,{where:{id:ctx.params.id}});
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Delete not successful", 400, "not sucessfull", ex);
				}
					
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Loading sample data to the collection.
		 * It is called in the DB.mixin after the database
		 * connection establishing & the collection is empty.
		 */
		async seedDB() {
			await this.adapter.insertMany([
				{ name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704 },
				{ name: "iPhone 11 Pro", quantity: 25, price: 999 },
				{ name: "Huawei P30 Pro", quantity: 15, price: 679 },
			]);
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
