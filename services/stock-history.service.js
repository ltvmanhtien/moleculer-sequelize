"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const {Sequelize,Op} = require("sequelize");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const StockHistory =require("../model/stock-histories.model");
const serviceName = require("../utils/service-name");
const Permissions = require("../utils/Permissions");
const middlewares =require("../middleware/stock-histories.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.StockHistory,
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService],
	adapter:adapter1,
	model: StockHistory,
	/**
	 * Settings
	 */
	settings: {
		
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before:{
			geted:[middlewares.count]
		}
	},

	/**
	 * Actions
	 */
	actions: {
		geted:{
			auth:"required",
			authen:[Permissions.LOGGED_IN],
			rest: {
				method: "GET",
				path: "/"
			},
			async handler(ctx){
				const {
					store_id,
					product_id,
					product_option_id,
					skip,
					limit
				}=ctx.params;
				const options = StockHistory.filterConditions({
					store_id,
					product_id,
					product_option_id,
				});
				const search={
					// search:"home_v1_popup",
					// searchFields:["type"],
					query:options,
					offset:skip,
					limit:limit,
					sort:{id:"desc"}
				};
				let result=await this.adapter.find(search);
				return (
					{
						code:0,
						count: ctx.locals.count,
						data:result.map(s => StockHistory.transform(s))
					}
				);
			}
		}
	
	},

	/**
	 * Methods
	 */
	methods: {
		/**
 * Replace item stock
 * @param {*} item
 */
		async  replaceHistory(ctx,item) {
			await this.adapter.findOne({
				where: {
					store_id: item.store_id,
					product_option_id: item.option_id,
					transaction_id: item.transaction_id,
					transaction_code: item.transaction_code,
				}
			}).then((data) => {
				if (data) {
					return this.adapter.model.increment(
						{
							total_final_quantity: -Math.ceil(data.total_quantity)
						},
						{
							where: {
								is_active: true,
								id: { [Op.gt]: data ? data.id : 0 },
								product_option_id: item.option_id,
								store_id: item.store_id
							}
						}
					);
				}
				return null;
			});
		},
		
		/**
 * Bulk update item
 * @param {*} item
 */
		async updateHistories(ctx,item) {
			if (item.is_removed) {
				return this.adapter.model.update(
					{
						is_active: false,
						updated_at: new Date()
					},
					{
						where: {
							is_active: true,
							product_option_id: item.option_id,
							transaction_id: item.transaction_id,
							transaction_code: item.transaction_code,
						},
						individualHooks: true
					}
				);
			}

			if (item.is_updated) {
				return this.adapter.findOne(
					{
						where: {
							is_active: true,
							store_id: item.store_id,
							product_option_id: item.option_id,
							transaction_id: item.transaction_id,
							transaction_code: item.transaction_code,
						}
					}
				).then(value => {
					if (value) {
						return value.increment(
							{
								total_quantity: item.total_quantity,
								total_final_quantity: item.total_quantity,
							}
						);
					}
					return null;
				}).then(value => {
					if (value) {
						ctx.emit(
							StockHistory.Events.STOCK_HISTORY_UPDATED, value
						);
					}
				});
			}

			// add history
			const operation = {
				event_id: item.event_id,
				event_name: item.event_name,
				store_id: item.store_id,
				store_name: item.store_name,
				partner_id: item.partner_id,
				partner_name: item.partner_name,
				product_id: item.id,
				product_option_id: item.option_id,
				product_type: item.type,
				product_price: item.price,
				product_normal_price: item.normal_price,
				product_original_price: item.original_price,
				transaction_id: item.transaction_id,
				transaction_code: item.transaction_code,
				total_quantity: item.total_quantity,
				total_price: item.total_price,
				total_current_quantity: item
					? +parseFloat(item.total_stock_quantity - item.total_quantity).toFixed(3)
					: 0,
				total_final_quantity: item
					? parseFloat(item.total_stock_quantity)
					: item.total_quantity,
			};
			await this.adapter.model.create(
				operation
			);
			return true;
		}
	},
	events: {
		"stock.updated":{
			group:"stocks",
			async handler(data,node,name,ctx) {
				try {
					// WORKER: Update data
					if (data.transaction_id) {
						await this.updateHistories(
							ctx,data
						);
					}
		
					// WORKER: Replace data
					if (data.is_removed && data.transaction_id) {
						await this.replaceHistory(
							ctx,data
						);
					}
				} catch (error) {
					console.log(error);
					// const logEvent = new LogEvent({
					// 	code: error.code || 500,
					// 	message: `Cannot add stock history when product_option_id: ${data.option_id}, transaction_code: ${data.transaction_code}`,
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
