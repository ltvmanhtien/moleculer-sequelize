"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const { MoleculerError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const { isNil }=require("lodash");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const Stock =require("../model/stock.model");
const StockHistory=require("../model/stock-histories.model");
const Order = require("../model/order.model");
const Product = require("../model/product.model");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Stock,
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService],
	adapter:adapter1,
	model: Stock,
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
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the quantity field.
			 *
			 * @param {Context} ctx
			 */
			create(ctx) {
				ctx.params.quantity = 0;
			}
		}
	},

	/**
	 * Actions
	 */
	actions: {
	
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
		async  updateQuantity(ctx,item) {
			console.log(item);
			try {
				await this.adapter.findOne({
					where: {
						product_id: item.id,
						store_id: item.store_id,
						product_option_id: item.option_id,
					}
				}).then(async (data) => {
					if (isNil(data)) {
						if (item.type !== Product.Types.COMBO) {
							await this.adapter.model.create({
								product_id: item.id,
								store_id: item.store_id,
								store_name: item.store_name,
								product_option_id: item.option_id,
								total_quantity: item.total_quantity
							});
							ctx.emit(
								"stock.updated",
								Object.assign(item, { total_stock_quantity: item.total_quantity }),ctx.node,ctx.name,ctx
							);
						}
						ctx.emit(
							Stock.Events.STOCK_PROVIDER_UPDATED,
							Object.assign(item, { total_stock_quantity: item.total_quantity }),ctx.node,ctx.name,ctx
						);
						ctx.emit(
							"stock.updated",
							Object.assign(item, { total_stock_quantity: item.total_quantity }),ctx.node,ctx.name,ctx
						);
					}
					return data.increment({
						total_quantity: item.total_quantity || 0,
						total_order_quantity: item.total_order_quantity || 0
					}).then(async value => {
						console.log(value);
						if (value) {
							ctx.emit(
								Stock.Events.STOCK_PROVIDER_UPDATED,
								Object.assign(item, { total_stock_quantity: +value.total_quantity }),ctx.node,ctx.name,ctx
							);
							ctx.emit(
								"stock.updated",
								Object.assign(item, { total_stock_quantity: +value.total_quantity }),ctx.node,ctx.name,ctx
							);
						}
					});
				});
			} catch (error) {
				console.log(error);
				// const logEvent = new LogEvent({
				// 	code: error.code || 500,
				// 	message: `Can update stock with id:${item.id}, store_id:${item.store_id},option_id:${item.option_id}`,
				// 	errors: error.errors,
				// 	stack: error.stack
				// });
				// await logEvent.save();
			}
		},		
		async seedDB() {
			await this.adapter.insertMany([
				{ name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704 },
				{ name: "iPhone 11 Pro", quantity: 25, price: 999 },
				{ name: "Huawei P30 Pro", quantity: 15, price: 679 },
			]);
		},
		async  bulkUpdateQuantities(ctx,products) {
			const promies = products.map((product)=>this.updateQuantity(ctx,product));
			return Promise.all(promies);
		}
	},
	events: {
		"orders.created": {
			group: "orders",
			async handler(data,node,name,ctx) {
				
				try {
					const { dataValues: order } = data;
					const { products } = order;
					const operations = [];
		
					// [WORKER] Handle event "invoice" created
					if (order.type !== Order.Types.ORDER) {
						if (
							order.status === Order.Statuses.PROCESSING ||
							order.status === Order.Statuses.COMPLETED
						) {
							products.forEach(product => {
								// nếu sản phẩm bên thứ 3 mà chưa liên kết sản phẩm hệ thống
								if (product.product_parts) {
									product.product_parts.forEach(part => {
										// if (part.type !== Product.Types.COMBO) {
										const indexOf = operations.findIndex(
											(i) => i.option_id === part.option_id
										);
										if (indexOf === -1) {
											operations.push({
												id: part.id,
												option_id: part.option_id,
												store_id: order.store.id,
												store_name: order.store.name,
												total_quantity: order.type === Order.Types.RETAIL
													? -parseFloat(part.total_quantity).toFixed(3)
													: +parseFloat(part.total_quantity).toFixed(3),
												type: part.type,
												price: product.price,
												normal_price: product.normal_price,
												original_price: product.original_price,
												partner_id: order.customer.id,
												partner_name: order.customer.name,
												transaction_id: order.id,
												transaction_code: order.code,
												event_id: order.type === Order.Types.RETAIL
													? StockHistory.EventTypes.INVOICE
													: StockHistory.EventTypes.RETURN,
												event_name: order.type === Order.Types.RETAIL
													? StockHistory.EventNames.INVOICE
													: StockHistory.EventNames.RETURN,
												total_price: order.type === Order.Types.RETAIL
													? -Math.ceil(product.total_price)
													: Math.ceil(product.total_price),
											});
										} else {
											operations[indexOf].total_quantity = order.type === Order.Types.RETAIL
												? parseFloat(operations[indexOf].total_quantity + -part.total_quantity).toFixed(3)
												: parseFloat(operations[indexOf].total_quantity + +part.total_quantity).toFixed(3);
											if (product.type === "item") {
												operations[indexOf].price = product.price;
												operations[indexOf].normal_price = product.normal_price;
												operations[indexOf].original_price = product.original_price;
											}
											// cal total_price
											if (operations[indexOf].type === "part") {
												operations[indexOf].total_price = order.type === Order.Types.RETAIL
													? -Math.ceil(+product.total_price)
													: Math.ceil(+product.total_price);
											}
											// case combo and item contain in part
											operations[indexOf].type = "item";
										}
										//
									});
								}
							});
							if (operations && operations.length) {
								await this.bulkUpdateQuantities(
									ctx,operations
								);
							}
						}
					}
				} catch (error) {
					throw new MoleculerError("error when orders create", 400, "not sucessfull", {
						message:error.data
					});
					// const logEvent = new LogEvent({
					// 	code: error.code || 500,
					// 	message: `Cannot drop quantity for store when order ${data.id} created`,
					// 	errors: error.errors,
					// 	stack: error.stack
					// });
					// await logEvent.save();
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
