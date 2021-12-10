"use strict";

const DbService = require("moleculer-db");
const {adapter1} = require("../config/vars");
const Cart =require("../model/cart.model");
const { MoleculerError } = require("moleculer").Errors;
const Permissions =require("../utils/Permissions");
const messages =require("../utils/messages");
const SERVICE =require("../utils/service-name");
const serviceName =require("../utils/service-name");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Cart,
	mixins: [DbService],
	// adapter:adapter1,
	// model: ProductOption,
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
		created:{
			auth: "required",
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				try {
					let result=await ctx.call(`${serviceName.Cart}.create`,entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Cart.transform(result)
					});
				} catch (error) {
					throw new MoleculerError("Create banner not successful", 400, "ERROR", error);
				}
	
			}
		},
		updated:{
			rest: {
				method: "PUT",
				path: "/:id"
			},
			async handler(ctx) {
				try {
					const { order } = ctx.locals;
					let entity = ctx.params;
					// console.log(ctx.params);
					await this.adapter.model.update(
						entity,
						{
							where:{
								status: Cart.Statuses.PICKING,
								client_id: ctx.meta.headers["x-consumer-custom-id"]
							}
						});
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", {
						message:ex.message
					});
				}
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
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
