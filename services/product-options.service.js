"use strict";

const DbService = require("moleculer-db");
const {isNil}=require("lodash");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const  {Sequelize,Op}= require("sequelize");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const ProductOption =require("../model/product-option.model");
const { MoleculerError } = require("moleculer").Errors;
const permissions =require("../utils/Permissions");
const Product=require("../model/product.model");
const ProductPrice=require("../model/product-price.model");
const middlewares =require("../middleware/product-option.middleware");
const messages = require("../utils/messages");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.ProductOption,
	mixins: [DbService],
	adapter:adapter1,
	model: ProductOption,
	/**
	 * Settings
	 */
	settings: {
		populates:{
			stock:{
				action:"stocks.get",
				params:{
					fields: [ "total_quantity"]
				}
			},
			// stock(ids, products, rule, ctx) {	
			// 	return this.Promise.all(
			// 		products.map(product => ctx.call("stocks.get", { id: product.stock }))
			// 	);
			
			// }
			
		}
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			get1:[
				middlewares.load,	
			],
			created:[
				middlewares.checkDuplicate,
				middlewares.prepareParams,
			],
			updated:[
				middlewares.load,	
				middlewares.prepareUpdate
			],
			deleted:[
				middlewares.load,
				middlewares.prepareRemove
			]
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
				try {
					let result=await ctx.call(`${SERVICE.ProductOption}.create`,entity);
					return ({
						code:0,
						message:messages.CREATE_SUCCESS,
						data:ProductOption.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create Product Option not successful", 400, "ERROR", {
						data:error.message
					});
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
			auth:"required",
			authen:[permissions.PRODUCT_UPDATE],
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { productOption } = ctx.locals;
					let entity=ctx.params;
					await this.adapter.model.update(entity,{where:{id:productOption.id}});
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
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
		checkDuplicateSku: {
			// rest: "GET /test",
			params: {
				id: "number|optional",
				sku: "string"
			},
			async handler(ctx) {
				const {id,sku}=ctx.params;
				const operation = {
					sku
				};
				if (id) {
					operation.id = {
						[Op.ne]: id
					};
				}
				const option = await this.adapter.findOne({
					where: operation
				});
				// if (option) {
				// 	return new MoleculerError(`Mã hàng: ${sku} đã tồn tại trong hệ thống`, 400, "not sucessfull", {
				// 		message:`Mã hàng: ${sku} đã tồn tại trong hệ thống`
				// 	});
					
				// }
				return option;
				
			},
		},
		get1:{
			rest: {
				method: "GET",
				path: "/:id"
			},
			auth:"required",
			authen:[permissions.PRODUCT_VIEW],
			async handler(ctx){
				try {
					return ({
						code:0,
						data:ProductOption.transform(ctx.locals.productOption)
					});
				} catch (ex) {
					throw new MoleculerError("get not successful", 400, "not sucessfull", {
						data:ex.message
					});
				}
			}
		},
		
		
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
		"products.created": {
			// Register handler to the "other" group instead of "payment" group.
			group: "products",
			async handler(data) {
				try {
					const price = ProductPrice.DefaultValues;
					const operations = data.products.map((product, index) => {
						const element = ProductOption.filterParams(product);
						element.type = data.type;
						element.unit = data.unit;
						element.units = data.units;
						element.parent_id = data.id;
						element.is_default = index === 0;
						element.category_path = data.category_path;
						element.attribute_path = data.attribute_path;
						element.price_book_path = [`${price.id}`];
						element.normalize_category = data.normalize_category;
						element.normalize_attribute = data.normalize_attribute;
						element.normalize_variation = data.normalize_variation;
						element.price_books = [Object.assign(price, { price: product.price, normal_price: product.price })];
						element.original_price = isNil(product.original_price) ? data.original_price : product.original_price;
						element.normal_price = isNil(product.normal_price) ? data.normal_price : product.normal_price;
						element.price = isNil(product.price) ? data.price : product.price;
						return element;
					});
		
					await this.adapter.insertMany(
						operations
					);
				} catch (error) {
					this.logger.info({
						code: error.code || 500,
						message: `Cannot add list product option to parent: ${data.id}`,
						errors: error.errors,
						stack: error.stack
					});

				}
			}
		},
		"products.updated":{
			group: "products",
			async handler(data) {
				try {
					const { dataValues: parent } = data;
					const operation = {
						type: parent.type,
						unit: parent.unit,
						brand: parent.brand,
						units: parent.units,
						status: parent.status,
						status_name: parent.status_name,
						is_active: parent.is_active,
						category_path: parent.category_path,
						attribute_path: parent.attribute_path,
						normalize_category: parent.normalize_category,
						normalize_attribute: parent.normalize_attribute,
						normalize_variation: parent.normalize_variation
					};
					if (data.type === Product.Types.PART) {
						operation.name = data.name;
						operation.price = data.price;
						operation.normal_price = data.normal_price;
						operation.original_price = data.original_price;
					}
		
					// [WORKER] Update item child
					await ProductOption.update(
						operation,
						{
							where: {
								is_active: true,
								parent_id: parent.id
							}
						}
					);
				} catch (error) {
					this.logger.info({
						code: error.code || 500,
						message: `Cannot add list product option to parent: ${data.id}`,
						errors: error.errors,
						stack: error.stack
					});
				}
			}
		},
		"products.deleted":{
			group: "products",
			async handler(data) {
				try {
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					await 	this.adapter.updateMany({parent_id:data.id},entity);
				} catch (error) {
					this.logger.info({
						code: error.code || 500,
						message: `Cannot remove list product option to parent: ${data.id}`,
						errors: error.errors,
						stack: error.stack
					});
				}
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
