"use strict";
const { Context }= require("moleculer");
const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const QueueService = require("../mixins/queue.mixin");
const Promotion = require("../model/promotion.model");
const serviceName = require("../utils/service-name");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "task-worker",
	mixins: [QueueService("redis://0.0.0.0:6379"),DbService],
	queues: {
		"promotion": [
			{
				name: "trigger_promotion",
				
				async process(job) {
					try {
						const {data}=job;
					
						await this.actions.passDataToEvent({
							eventName:"promotion.update_status",
							data:data,
							groups:["promotion"]
						});
					} catch (error) {
						throw new MoleculerError("trigger promotion not  successful", 400, "not sucessfull", {
							message:error.message
						});
					}
					//  return this.Promise.resolve("ok");
					
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
		async	startingPrmotion(ctx,payload){
			console.log("aaaaa");
		}
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
