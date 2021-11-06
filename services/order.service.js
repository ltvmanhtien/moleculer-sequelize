"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const {Sequelize,Op} = require("sequelize");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const Order =require("../model/order.model");
const { MoleculerError } = require("moleculer").Errors;
const permissions =require("../utils/Permissions");
const middleware =require("../middleware/order.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Order,
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService],
	adapter:adapter1,
	model: Order,
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
			created:[middleware.prepareOrder]
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
			auth:"required",
			authen:[permissions.ORDER_CREATE],
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				
				try {
					let result=await ctx.call(`${SERVICE.Order}.create`,entity);
					ctx.params.id=result.id;
					ctx.result=result;
				} catch (error) {
					throw new MoleculerError("Create order not successful", 400, "ERROR", error);
				}

			}
		},
		checkOrderHandler:{
			async handler(ctx) {
				console.log(ctx.params);
				let order=await this.checkOrder(ctx);
				return order;
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		async checkOrder(ctx){
			const order = await this.adapter.model.findOne({
				where: {
					id: ctx.params.id,
					status: { [Op.ne]: Order.Statuses.COMPLETED }
				}
			});
			if (!order) {
				throw new MoleculerError("Đơn hàng này đã xử lí trước đó rồi ", 400, "ERROR", {
					message:"Đơn hàng này đã xử lí trước đó rồi "
				});	
			}
			return order;
		}
	},
	events: {
		
	},
	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
