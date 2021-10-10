"use strict";
const DbService = require("moleculer-db");
// const SqlAdapter = require("moleculer-db-adapter-sequelize");
const QueueService = require("moleculer-bull");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "job-worker",
	mixins: [QueueService("redis://0.0.0.0:6379")],
	methods: {
		sendEmail(payload) {
			this.createJob("mail.send","this isjob nam", payload);
			console.log(payload);
			this.getQueue("mail.send").on("completed", (jobID, progress) => {
				this.logger.info(`Job #${jobID} progress is ${progress}%`,"jobId",jobID);
			});
 
			// this.getQueue("mail.send").on("global:completed", (job, res) => {
			// 	this.logger.info(`Job #${job} completed!. Result:`, res,job);
			// });
		}
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
				this.sendEmail("vip",{hello:"chao cau"});
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
