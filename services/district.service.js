"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const { adapter1 } = require("../config/vars");
const SERVICE = require("../utils/service-name");
const District =require("../model/district.model");
const permissions = require("../utils/Permissions");
const middleware = require("../middleware/district.middleware");
const messages = require("../utils/messages");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.District,
	mixins: [DbService],
	adapter: adapter1,
	model:District ,
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
			authen: [permissions.DISTRICT_CREATE],
			async handler(ctx) {
				let entity = ctx.params;
				try {
					let result = await ctx.call(`${SERVICE.District}.create`, entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: District.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create district not successful", 400, "ERROR", {
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
					const { district } = ctx.locals;
					let entity = ctx.params;
					// console.log(ctx.params);
					await this.adapter.model.update(entity,{where:{id:district.id}});
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
					const { district } = ctx.locals;
					let entity={
						is_active: false,
					};
					await this.adapter.model.update(entity,{where:{id:district.id}});
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
						data:District.transform(ctx.locals.district)
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

					
					const {
						name,
						province_code,
						// sort
						sort_by,
						order_by,
						skip = 0,
						limit = 100,
					} = ctx.params;
					const options = District.filterConditions({
						name,province_code
					});
					
					//const sort = District.sortConditions({ sort_by, order_by });
					let result = await this.adapter.model.findAll({
						where: options,
						//order: [sort],
						offset: skip,
						limit: limit
					});
					return ({
						code: 0,
						data: result
					});
				} catch (error) {
					throw new MoleculerError("Get province not successful", 400, "ERROR", {
						message:error.message
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
