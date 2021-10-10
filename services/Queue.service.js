"use strict";
const DbService = require("moleculer-db");
// const SqlAdapter = require("moleculer-db-adapter-sequelize");
const QueueService = require("moleculer-bull");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "task-worker",
	mixins: [QueueService("redis://0.0.0.0:6379")],
	queues: {
		"mail.send": [
			{
				name: "this isjob nam",
				
				process(job) {
					this.logger.info("New important job received!", job.data);
					// Send email a vip way here.
					let tien="hi chao cau";		
					return this.Promise.resolve(tien);
					
				}
			},
			{
				name: "normal",
				process(job) {
					this.logger.info("New normal job received!", job.data);
					return this.Promise.resolve({ "info": "Process success." });
				}
			}
		]
	},
	
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
