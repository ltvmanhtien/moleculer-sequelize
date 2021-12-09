"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const {pick}=require("lodash");
const {adapter1} = require("../config/vars");
const AttributeValue =require("../model/attribute-value.model");
const { MoleculerError } = require("moleculer").Errors;
const messages = require("../utils/messages");
const SERVICE =require("../utils/service-name");
const Permissions = require("../utils/Permissions");
const middleware= require("../middleware/attribute-value.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.AttributeValue,
	mixins: [DbService],
	adapter:adapter1,
	model: AttributeValue,
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
				middleware.prepareParams
			],
			updated: [
				middleware.load,
				middleware.prepareUpdate
			],
			deleted: [
				middleware.load,
			],
			get1: [
				middleware.load,
			],
		}
	},

	/**
	 * Actions
	 */
	actions: {
		created:{
			rest:{
				method: "POST",
				path: "/"
			},
			auth:"required",
			authen:[Permissions.ATTRIBUTE_VALUE_CREATE],
			async handler(ctx){
				console.log("aaaaaa");
				let entity=ctx.params;
				try {
					let result=await ctx.call(`${SERVICE.AttributeValue}.create`,entity);
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: AttributeValue.transform(result)
					});
				} catch (error) {
					throw new MoleculerError("Create attribute value not successful", 400, "ERROR", {
						message: error.message
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
			authen:[Permissions.ATTRIBUTE_VALUE_UPDATE],
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { attributeValue } = ctx.locals;
					await this.adapter.model.update(attributeValue,{where:{id:ctx.params.id}});		
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
				}
					
			}
		},
		deleted: {
			rest: {
				method: "DELELTE",
				path: "/:id"
			},
			auth:"required",
			authen:[Permissions.ATTRIBUTE_VALUE_DELETE],
			// params: updateValidation,
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					let entity={
						is_active: false,
						updated_at: new Date()
					};
					this.adapter.model.update(entity,{where:{id:ctx.params.id}});
					
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", ex);
				}
					
			}
		},
		get1:{
			rest:{
				method: "GET",
				path: "/:id",
			},
			auth:"required",
			authen:[Permissions.ATTRIBUTE_VALUE_VIEW],
			
			async handler(ctx){
				try {
					return ({
						code:0,
						data:AttributeValue.transform(ctx.locals.attributeValue)
					});
				} catch (ex) {
					throw new MoleculerError("get not successful", 400, "not sucessfull", ex);
				}
			}
		},
		geted:{
			rest: {
				method: "GET",
				path: "/"
			},
			cache: {
				ttl:10
			},
			async handler(ctx){
				let order="attr.position ASC";
				let {
					attribute_value,
					attribute_code,
					is_visible,
					keyword,
					categories,
					attributes,
					order_by,
					
					sort_by,
					skip,
					limit
				}=ctx.params;
				
				if (sort_by) order = `attr.${sort_by} ${order_by || "DESC"}`;
				const options = AttributeValue.filterConditions({
					attribute_value,
					attribute_code,
					is_visible,
					keyword,
					categories,
					attributes,
				});
				const search={
					// search:"home_v1_popup",
					// searchFields:["type"],
					query:options
				};
				let result=await this.adapter.db.query(`
				SELECT
                attr.id,
                attr.slug,
                attr.icon,
                attr.count,
                attr.name,
                attr.value,
                attr.position,
                attr.attribute_code,
                attr.created_at,
                attr.updated_at
				FROM tbl_attribute_values as attr
				WHERE  ${options}
				GROUP BY attr.id
				ORDER BY ${order}
				OFFSET ${skip}
				LIMIT ${limit}
				`);
				return ({
					code: 0,
					count: ctx.totalRecords,
					data: result[1].rows.map(s => AttributeValue.transform(s))
				});
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
