"use strict";

const DbService = require("moleculer-db");
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const Stock =require("../model/stock.model");
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
		async seedDB() {
			await this.adapter.insertMany([
				{ name: "Samsung Galaxy S10 Plus", quantity: 10, price: 704 },
				{ name: "iPhone 11 Pro", quantity: 25, price: 999 },
				{ name: "Huawei P30 Pro", quantity: 15, price: 679 },
			]);
		}
	},
	events: {
		"banner.hello": {
			// Register handler to the "other" group instead of "payment" group.
			group: "banner",
			handler(payload) {
				console.log("product  receive event from banner");
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
