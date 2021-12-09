"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const { adapter1 } = require("../config/vars");
const Province = require("../model/province.model");
const messages = require("../utils/messages");
const SERVICE = require("../utils/service-name");
const middleware = require("../middleware/province.middleware");
const permissions = require("../utils/Permissions");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Province,
	mixins: [DbService],
	adapter: adapter1,
	model: Province,
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
			created: [
				middleware.prepareParams,
			],
			updated:[
				middleware.load,
				middleware.prepareUpdate
			],
			get1:[
				middleware.load
			],
			deleted:[
				middleware.load
			]
		}
	},

	/**
     * Actions
     */
	actions: {
		created: {
			rest: {
				method: "POST",
				path: "/"
			},
			auth: "required",
			authen: [permissions.PROVINCE_CREATE],
			async handler(ctx) {
				let entity = ctx.params;
				try {
					let result = await ctx.call(`${SERVICE.Province}.create`, entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Province.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create provinces not successful", 400, "ERROR", {
						data: error.message
					});
				}
			}
		},
		updated: {
			rest: {
				method: "PUT",
				path: "/:id"
			},
			auth: "required",
			authen: [permissions.PROVINCE_UPDATE],
			async handler(ctx) {
				try {
					const { province } = ctx.locals;
					let entity = ctx.params;
					// console.log(ctx.params);
					await this.adapter.model.update(entity,{where:{id:province.id}});
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
		},
		deleted: {
			rest: {
				method: "DELETE",
				path: "/:id"
			},
			auth: "required",
			authen: [permissions.PROVINCE_DELETE],
			async handler(ctx) {
				try {
					const { province } = ctx.locals;
					let entity={
						is_active: false,
					};
					await this.adapter.model.update(entity,{where:{id:province.id}});
					return ({
						code: 0,
						message: messages.REMOVE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", {
						message:ex.message
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
						data:Province.transform(ctx.locals.province)
					});
				} catch (ex) {
					throw new MoleculerError("get not successful", 400, "not sucessfull", {
						message:ex.message
					});
				}
			}
		},
		geted: {
			rest: {
				method: "GET",
				path: "/"
			},
			async handler(ctx) {
				try {

					console.log("aaaa", ctx.params);
					const {
						name,
						// sort
						sort_by,
						order_by,
						skip = 0,
						limit = 100,
					} = ctx.params;
					const options = Province.filterConditions({
						name
					});
					const sort = Province.sortConditions({ sort_by, order_by });
					let result = await this.adapter.model.findAll({
						where: options,
						order: [sort],
						offset: skip,
						limit: limit
					});
					return ({
						code: 0,
						data: result
					});
				} catch (error) {
					throw new MoleculerError("Create Product not successful", 400, "ERROR", error);
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
