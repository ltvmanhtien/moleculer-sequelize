"use strict";

const DbService = require("moleculer-db");
const {Op} = require("sequelize");
const SERVICE =require("../utils/service-name");
const {adapter1} = require("../config/vars");
const Order =require("../model/order.model");
const { MoleculerError } = require("moleculer").Errors;
const permissions =require("../utils/Permissions");
const middleware =require("../middleware/order.middleware");
const messages = require("../utils/messages");
const {cloneDeep,pick} = require("lodash");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: SERVICE.Order,
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbService],
	adapter:adapter1,
	model: Order,
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
			created:[middleware.prepareOrder],
			updated:[
				middleware.load,
				middleware.prepareUpdate
			],
			geted:[
				middleware.count,
				middleware.sum,
			],
			get1:[
				middleware.load
			],
			completed:[
				middleware.load,
				middleware.prepareComplete
			]
		},
		after:{
			created:[
				function afterCreated(ctx) {
					ctx.emit(`${SERVICE.Order}.create`,ctx.params,ctx.node,ctx.name,ctx); 
					return ({
						code: 0,
						message: messages.CREATE_SUCCESS,
						data: Order.transform(ctx.result)
					});
			
				}
			]
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		created: {
			auth:"required",
			authen:[permissions.ORDER_CREATE],
			rest: {
				method: "POST",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				
				try {
					let result=await ctx.call(`${SERVICE.Order}.create`,entity);
					ctx.params.id=result.id;
					ctx.result=result;
				} catch (error) {
					throw new MoleculerError("Create order not successful", 400, "ERROR", error);
				}

			}
		},
		updated:{
			auth:"required",
			authen:[permissions.ORDER_UPDATE],
			rest: {
				method: "PUT",
				path: "/"
			},
			// params: createValidation,
			async handler(ctx) {
				let entity=ctx.params;
				const {order}=ctx.locals;
				try {
					await this.adapter.model.update(entity,{where:{id:order.id}});	
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (error) {
					throw new MoleculerError("update order not successful", 400, "ERROR", error);
				}

			}
		},
		geted:{
			auth:"required",
			authen:[permissions.ORDER_VIEW],
			rest: {
				method: "GET",
				path: "/"
			},
			async handler(ctx) {
				const {
					code,
					note,
					hashtag,
					customer,
					receiver,
					is_match,
					order_id,
					user_code,
					date_type,
					order_code,
					return_code,
					delivery_code,
					product_sku,
					product_name,
					product_note,
					min_created_at,
					max_created_at,
					payment_methods,
					shipping_methods,
					statuses,
					channels,
					sources,
					staffs,
					types,
					stores,
					// sort
					sort_by,
					order_by,
					skip = 0,
					limit = 20,
				} = ctx.params;
				const filterParam= Order.filterConditions({
					code,
					note,
					hashtag,
					customer,
					receiver,
					is_match,
					order_id,
					user_code,
					date_type,
					order_code,
					return_code,
					delivery_code,
					product_sku,
					product_name,
					product_note,
					min_created_at,
					max_created_at,
					payment_methods,
					shipping_methods,
					statuses,
					channels,
					sources,
					staffs,
					types,
					stores,
				});
				const sort = Order.sortConditions({
					sort_by,
					order_by
				});
				const search={		
					query:filterParam,
					offset:skip,
					limit:limit,
					sort:{id:"desc"}
				};
				let result=await this.adapter.find(search);
				return ({
					code: 0,
					count: ctx.locals.totalRecords,
					sum:ctx.locals.sum,
					data:result.map((x)=>Order.transform(x,true))
					
				});
			}
		},
		get1:{
			rest: {
				method: "GET",
				path: "/:id"
			},
			async handler(ctx) {
				try {
					return ({
						code:0,
						data:Order.transform(ctx.locals.order)
					});
				} catch (ex) {
					throw new MoleculerError("get not successful", 400, "not sucessfull", {
						code:400,
						message:ex.message
					});
				}
			}
		},
		completed:{
			rest: {
				method: "PUT",
				path: "/:id/complete"
			},
			async handler(ctx){
				try {
					const { order } = ctx.locals;
					return this.adapter.model.update({
						updated_at: new Date(),
						completed_at: new Date(),
						status: Order.Statuses.COMPLETED,
						status_name: Order.StatusNames.COMPLETED,
						completed_by: pick(ctx.meta.user, ["id", "name"]),
					},
					{ where:{ 
						id: order.id,
						is_active: true 
					}
					})
						.then(()=>{
							return({
								code: 0,
								message: messages.UPDATE_SUCCESS
							});
						});
				} catch (error) {
					throw new MoleculerError("completed not successful", 400, "not sucessfull", {
						code:400,
						message:error.message
					});	
				}
			}
		},
		checkOrderHandler:{
			async handler(ctx) {
				console.log(ctx.params);
				let order=await this.checkOrder(ctx);
				return order;
			}
		},
		sum:{
			async handler(ctx) {
				const {attribute,options}=ctx.params;
				return await this.adapter.model.sum(attribute,{where:options});
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		async checkOrder(ctx){
			const order = await this.adapter.model.findOne({
				where: {
					id: ctx.params.id,
					status: { [Op.ne]: Order.Statuses.COMPLETED }
				}
			});
			if (!order) {
				throw new MoleculerError("Đơn hàng này đã xử lí trước đó rồi ", 400, "ERROR", {
					message:"Đơn hàng này đã xử lí trước đó rồi "
				});	
			}
			return order;
		},
		eventCustom(ctx){
			
		}
	},
	events: {
		"orders.create":{
			group: "orders",
			async handler(data,node,name,ctx) {
				// let data=ctx.params;
				let update= await this.adapter.model.update(
					{code:`HD0000${data.id}`},
					{where:{id:data.id},
						returning: true
					}
				);	
				const operation = cloneDeep(
					update[1][0]
				);
				
				ctx.emit(`${SERVICE.Order}.created`, operation,ctx.node,ctx.name,ctx);

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
