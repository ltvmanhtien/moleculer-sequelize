"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const {adapter1} = require("../config/vars");
const PriceBook =require("../model/price-book.model");
const messages = require("../utils/messages");
const Permissions = require("../utils/Permissions");
const SERVICE =require("../utils/service-name");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.PriceBook,
	mixins: [DbService],
	adapter:adapter1,
	model: PriceBook,
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
		
		}
	},

	/**
	 * Actions
	 */
	actions: {
		created:{
			auth:"required",
			authen:[Permissions.PRICE_CREATE],
			rest: {
				method: "POST",
				path: "/"
			},
			async handler (ctx){
				let entity=ctx.params;
				try {
					let result=await ctx.call(`${SERVICE.PriceBook}.create`,entity);
					return ({
						code:0,
						message:messages.CREATE_SUCCESS,
						data:PriceBook.transform(result)
					});
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create Product Option not successful", 400, "ERROR", {
						data:error.message
					});
				}
			}
		},
		geted:{
			auth:"required",
			authen:[Permissions.PRICE_VIEW],
			rest: {
				method: "GET",
				path: "/"
			},
			async handler(ctx) {
				const {
					keyword,
					types,
					statuses,
				
					// sort condition
					skip = 0,
					limit = 50,
					sort_by = "desc",
					order_by = "created_at",
				} = ctx.params;
				const filterParam= PriceBook.filterConditions({
					keyword,
					types,
					statuses,
				});
				
				const search={		
					query:filterParam,
					offset:skip,
					limit:limit,
					sort:{created_at:"desc"}
				};
				let result=await this.adapter.find(search);
				return ({
					code: 0,
					count: ctx.locals.count,
					data:result.map((x)=>PriceBook.transform(x,true))
					
				});
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
		
	},
	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
