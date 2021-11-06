"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");

const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const Product =require("../model/product.model");
const messages =require("../utils/messages");
const middleware =require("../middleware/product.middleware");
const permissions =require("../utils/Permissions");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Product,
	mixins: [DbService],
	adapter:adapter1,
	model: Product,
	/**
	 * Settings
	 */
	settings: {
		populates: {
			// "products": "users.get",
			"products": {
				action: `${SERVICE.ProductOption}.get`,
				params: {
					fields: "id sku"
				}
			},
			"stocks": {
				action: `${SERVICE.Stock}.get`,
				params: {
					fields: "product_id total_quantity"
				}
			},
		}
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
			rest: {
				method: "POST",
				path: "/"
			},
			auth:"required",
			authen:[permissions.PRODUCT_CREATE],
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				console.log(entity);
				try {
					let result=await ctx.call(`${SERVICE.Product}.create`,entity);
					ctx.params.id=result.id;
					ctx.result=result;
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create Product not successful", 400, "ERROR", error);
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
					const { product } = ctx.locals;
					let entity=ctx.params;
					await this.adapter.model.update(entity,{where:{id:product.id}});
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
			// auth:"required",
			// params: listValidation,
			async handler(ctx) {
				try {
					const {
						skus,
						types,
						fields,
						statuses,
						suppliers,
						variations,
						attributes,
						categories,
						is_include,
						is_visible,
						is_top_hot,
						is_has_discount,
						min_created_at,
						max_created_at,
						stock_value,
						stock_id,
						min_price,
						max_price,
						discount_id,
						description,
						keyword,
						note,
						limit,
						skip
					}=ctx.params;
					const filterParam=Product.filterConditions(
						skus,
						types,
						fields,
						statuses,
						suppliers,
						variations,
						attributes,
						categories,
						is_include,
						is_visible,
						is_top_hot,
						is_has_discount,
						min_created_at,
						max_created_at,
						stock_value,
						stock_id,
						min_price,
						max_price,
						discount_id,
						description,
						keyword,
						note,
					);
					const search={
						// search:"home_v1_popup",
						// searchFields:["type"],
						
						query:filterParam,
						offset:skip,
						limit:limit,
						sort:{id:"desc"}
					};
				
					// let result =ctx.call(`${SERVICE.Product}.find`)
					// 	.then(async(value)=>{
							
					// 	 return await this.parseFindStock(ctx,value);
						
					// 	});
					let result=await this.adapter.find(search)
						.then(async(value)=>{
							
							return await this.parseFindStock(ctx,value);
					
						});
					
					return ({
						code: 0,
						count: ctx.locals.count,
						sum:ctx.locals.sum,
						data:result
						// sum:{
						// 	"total_quantity": 78228,
						// 	"total_order_quantity": 0
						// },
						//data: result.map(s => Product.transform(s))
					});
				} catch (ex) {
					console.log(ex);
					throw new MoleculerError("get not successful", 400, "not sucessfull", {
						data:ex.message
					});
					
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
						data:Product.transform(ctx.locals.product)
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
			auth:"required",
			authen:[permissions.PRODUCT_DELETE],
			async handler(ctx){
				try {
					const { product } = ctx.locals;
					
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					let result=	await this.adapter.model.update(entity,{where:{id:product.id}});	
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("delete not successful", 400, "not sucessfull", ex);
				}
				
			}
		},
		block:{
			rest: {
				method: "PATCH",
				path: "/:id/block"
			},
			async handler(ctx){
				try {
					const { product } = ctx.locals;
					const {status}=ctx.params;
					let entity={
						status: "status",
						updated_at: new Date()
					};
					let result=	await this.adapter.model.update(entity,{where:{id:product.id}});	
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("block or unblock not successful", 400, "not sucessfull", ex);
				}
			}
		}
	},
    
	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			created:[
				middleware.prepareParams,
			],
			updated:[
				middleware.load,
				middleware.prepareUpdate,
			],
			get1:[
				middleware.load,
				middleware.loadProductOption,
				middleware.loadStock,
			],
			geted:[
				middleware.sum,
				middleware.count
			],
			deleted:[
				middleware.load,
			]
		},
		after:{
			created: [
				function afterCreated(ctx) {
					ctx.emit(`${SERVICE.Product}.created`,ctx.params);
			
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Product.transform(ctx.result)
					});
			
				}
			],
			deleted:[
				function afterDeleted(ctx) {
					ctx.emit(`${SERVICE.Product}.deleted`,ctx.locals.product);
			
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
			
				}
			]
		}
	},
	/**
	 * Methods
	 */
	methods: {
		parseFindStock(ctx, entities) {
			return Promise.all(entities.map(item => this.findStock(ctx, item)));		
		},
		async findStock(ctx, entity) {
			let stock= await ctx.call(`${SERVICE.Stock}.find`,{query:{product_id:entity.id}});
			entity.dataValues.stocks=stock;
			return entity;
		}
	},
	events: {
		"Product.hello": {
			// Register handler to the "other" group instead of "payment" group.
			group: "Product",
			handler(payload) {
				console.log("product  receive event from Product");
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
