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
	name: SERVICE.Role,
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService],
	// adapter:adapter1,
	// model: Stock,
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
