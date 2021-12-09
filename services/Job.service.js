"use strict";
const moment = require("moment-timezone");
const {cloneDeep}=require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const QueueService = require("../mixins/queue.mixin");
const Promotion = require("../model/promotion.model");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "job-worker",
	mixins: [QueueService("redis://0.0.0.0:6379")],
	methods: {
		async addPromotionToQueue(payload) {
			const starting_job = await this.getQueue("promotion")
				.getJob(`promotion_starting_${payload.id}`)
				.then(function (job) {
					if (job) {
						return job;
					}
				});
			if (starting_job) {
				starting_job.remove();
				console.log("remove starting job ok");
			}
			const finish_job = await this.getQueue("promotion")
				.getJob(`promotion_finish_${payload.id}`)
				.then(function (job) {
					if (job) {
						return job;
					}
				});
			if (finish_job) {
				finish_job.remove();
				console.log("remove finish job ok");
			}
			const delay_starting = Math.round((moment(payload.applied_start_time).unix() * 1000 - moment(new Date()).unix() * 1000) / 1000);
			const delay_finish = Math.round((moment(payload.applied_stop_time).unix() * 1000 - moment(new Date()).unix() * 1000) / 1000);
			let payload_starting=cloneDeep(payload);
			let payload_finish=payload;
			payload_starting.type ="starting";
			payload_finish.type = Promotion.Statuses.FINISHED;
			this.createJob("promotion", "trigger_promotion", payload_starting, {
				delay: delay_starting > 0 ? delay_starting : 0,
				jobId: `promotion_starting_${payload.id}`,
				//removeOnComplete: true
			});
		
			this.createJob("promotion", "trigger_promotion", payload_finish, {
				delay: delay_finish > 0 ? delay_finish : 0,
				jobId: `promotion_finish_${payload.id}`,
				//removeOnComplete: true
			});
			console.log("add job again");

			// this.getQueue("test_a_job").on("completed", (jobID, progress) => {
			// 	this.logger.info(`Job #${jobID} progress is ${progress}%`,"jobId",jobID);
			// });
		},
		async removeJobStaring(payload) {
			console.log(payload);
		},
		async removeJobFinish(payload) {
			console.log(payload);
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
		addPromotion: {
			rest: "/job/prmotion/add",
			method: "POST",
			params: {
				id: {
					type: "number" || "string"
				},
				applied_start_time: {
					type: "string"
				},
				applied_stop_time: {
					type: "string"
				},
				type: {
					type: "string"
				}
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { applied_start_time, applied_stop_time, id, type } = ctx.params;
					this.addPromotionToQueue({
						applied_start_time,
						applied_stop_time,
						id,
						type
					});
					return {
						code: 0,
						message: "add queue prommotion successful"
					};
				} catch (error) {
					throw new MoleculerError("Can not add queue in prmotion", 400, "NOT_FOUND", {
						message: error.message
					});
				}
			}
		},
		removePromove: {
			rest: {
				rest: "/job/prmotion/remove",
				method: "POST",
			},
			params: {
				id: {
					type: "number" || "string"
				},
				applied_start_time: {
					type: "string"
				},
				applied_stop_time: {
					type: "string"
				},
				type: {
					type: "string"
				}
			},
			async handler(ctx) {
				try {
					const { applied_start_time, applied_stop_time, id, type } = ctx.params;
					if (type === Promotion.Statuses.STARTING) {
						this.removeJobStaring({
							applied_start_time,
							applied_stop_time,
							id,
							type
						});
					} else {
						this.removeJobFinish({
							applied_start_time,
							applied_stop_time,
							id,
							type
						});
					}
				}
				catch (error) {
					throw new MoleculerError("Can not remove queue in prmotion", 400, "NOT_FOUND", {
						message: error.message
					});
				}
			}
		},
		welcome1: {
			rest: "/welcome1",
			/** @param {Context} ctx  */
			async handler(ctx) {
				this.testRemove("vip");
				return `Welcome, ${ctx.params.name}`;
			}
		},
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
