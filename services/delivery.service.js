"use strict";
const DbService = require("moleculer-db");
// const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");
// const {adapterProduct} = require("../config/vars");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "greeter",
	mixins: [DbService],
	// adapter:adapterProduct,
	// model: {
	// 	name: "test11",
	// 	define: {
	// 		title: Sequelize.STRING,
	// 		content: Sequelize.TEXT,
	// 		votes: Sequelize.INTEGER,
	// 		author: Sequelize.INTEGER,
	// 		status: Sequelize.BOOLEAN
	// 	},
	// 	options: {
	// 		// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
	// 	}
	// },
	
	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		hello: {
			rest: {
				method: "GET",
				path: "/hello"
			},
			async handler() {
				return "Hello Moleculer";
			}
		},

		/**
		 * Welcome, a username
		 *
		 * @param {String} name - User name
		 */
		welcome: {
			rest: "/welcome",
			params: {
				name: "string"
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				return `Welcome, ${ctx.params.name}`;
			}
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
