"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
//const SqlAdapter = require("moleculer-db-adapter-sequelize");
//const Sequelize = require("sequelize");
const { pick,defaults}=require("lodash");
const {adapter1} = require("../config/vars");
const Category = require("../model/category.model");
// const ProductOption =require("../model/product.model");
const SERVICE =require("../utils/service-name");
const messages =require("../utils/messages");
const middleware =require("../middleware/category.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name:SERVICE.Category,
	mixins: [DbService],
	adapter:adapter1,
	model: Category,
	/**
	 * Settings
	 */
	settings: {
	
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
			authen: ["SHOPOWNER", "ADMIN", "SUPERADMIN"],
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				try {
					let result=await ctx.call("categories.create",entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Category.transform(result)
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
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { category: oldModel } = ctx.locals;
					const dataChanged = Category.getChangedProperties({
						oldModel: oldModel,
						newModel: ctx.params
					});
					const operations = pick(ctx.params, dataChanged);
					operations.updated_at = new Date();
					let entity=operations;
					
					let result=	await this.adapter.updateById(ctx.params.id,entity);			
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
			// authen: ["SHOPOWNER", "ADMIN", "SUPERADMIN"],
			rest: {
				method: "GET",
				path: "/"
			},
			// params: listValidation,
			async handler(ctx) {
				try {
					const {options}=ctx.params;
					const filterParam=Category.filterConditions(
						options
					);
					console.log(options);
					const search={
						query:filterParam
					};
					let categories=await this.adapter.find(search);

					// transform nested category
					const { nested, slug = null } = ctx.params;
					let transformedCategories = categories.map((category) =>
						Category.transform(category)
					);
					if (nested) {
						if (slug && categories.length === 1) {
							categories = await Category.list({
								nested,
								id: categories[0].id
							});
						}
						transformedCategories = this.convertToNestedCategory(
							categories.map((category) => Category.transform(category)),
							null
						);
					}
			
					return ({
						data: transformedCategories
					});
				} catch (ex) {
					console.log(ex);
					throw new MoleculerError("list not successful", 400, "not sucessfull", {
						data:ex.message
					});
						
				}
			}
		},
		get1:{
			auth: "required",
			authen: ["SHOPOWNER", "ADMIN", "SUPERADMIN"],
			rest: {
				method: "GET",
				path: "/:id"
			},
			async handler(ctx){
				try {
					return ({
						code:0,
						data:Category.transform(ctx.locals.category)
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
					const { category } = ctx.locals;
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					await this.adapter.updateById(ctx.params.id,entity);
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
		/**
		 * Loading sample data to the collection.
		 * It is called in the DB.mixin after the database
		 * connection establishing & the collection is empty.
		 */
		convertToNestedCategory(arr, rootParent = null) {
			const nodes = {};
			return arr.filter((obj) => {
				const currentId = obj.id;
				let { parent_id } = obj;
				const isRootParent = currentId === rootParent;
		
				nodes[currentId] = defaults(obj, nodes[currentId], {
					children: []
				});
				parent_id =
					parent_id &&
					(nodes[parent_id] = nodes[parent_id] || {
						children: []
					}).children.push(obj);
		
				return !parent_id || isRootParent;
			});
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
