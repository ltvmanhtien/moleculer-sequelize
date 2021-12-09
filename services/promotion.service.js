"use strict";

const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const {Op} = require("sequelize");
const { pick,includes,differenceWith,cloneDeep }=require("lodash");
const {adapter1} = require("../config/vars");
const Promotion = require("../model/promotion.model");
const SERVICE =require("../utils/service-name");
const messages = require("../utils/messages");
const permissions = require("../utils/Permissions");
const middleware =require("../middleware/promotion.middleware");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name:SERVICE.Promotion,
	mixins: [DbService],
	adapter:adapter1,
	model: Promotion,
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
			created:[
				middleware.checkTimeCreate,
				middleware.prepareCreate,
				middleware.checkDuplicate
			],
			updated:[
				middleware.load,
				middleware.prepareReplace,
				middleware.checkDuplicate,
				middleware.prepareUpdate,
			],
			geted:[
				middleware.count,
			],
			get1:[
				middleware.load,
			],
			active:[
				middleware.load,
			],
			finish:[
				middleware.load,
			],
			canncel:[
				middleware.load,
			],
			block:[
				middleware.load,
			]
			
		},
		after:{
			created:[
				async	function afterCreated(ctx){
					const {id}=ctx.params;
					await	this.adapter.model.update({code:`PR00000${id}`},{where:{id:id}});
					return ({
						code:0,
						message:messages.CREATE_SUCCESS,
						data:Promotion.transform(ctx.params)
					});
				}
			],
			updated:[
				function afterUpdated(ctx) {

				}
			]
		}
	},

	/**
	 * Actions
	 */
	actions: {
		created:{
			rest: {
				method: "POST",
				path: "/"
			},
			auth:"required",
			authen:[permissions.PROMOTION_CREATE],
			async handler(ctx){
				let entity=ctx.params;
				try {
					let result=await ctx.call(`${SERVICE.Promotion}.create`,entity);
					ctx.params=result;
				
				} catch (error) {
					console.log(error);
					throw new MoleculerError("Create promotion not successful", 400, "ERROR", {
						data:error.message
					});
				}
			}
		},
		updated:{
			rest: {
				method: "PUT",
				path: "/:id"
			},
			auth:"required",
			authen:[permissions.PROMOTION_UPDATE],
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const { promotion } = ctx.locals;
					let entity=ctx.params;
					await this.adapter.model.update(entity,{where:{id:promotion.id}});
					return ({
						code: 0,
						message: messages.UPDATE_SUCCESS
					});
				} catch (ex) {
					throw new MoleculerError("Update not successful", 400, "not sucessfull", {
						message:ex.message
					});
				}
				
			}
		},
		checkDuplicate:{
			async handler(ctx){
				const {promotion:params}=ctx.params;
				const duplicates = [];
				const promise = [];
				params.products.map((p) => {
					promise.push(
						this.adapter.model.findAll({
							where: {
								status: {
									[Op.notIn]: [
										Promotion.Statuses.FINISHED,
										Promotion.Statuses.CANCELLED
									]
								},
								applied_start_time: {
									[Op.lte]: params.applied_stop_time
								},
								applied_stop_time: {
									[Op.gte]: params.applied_start_time
								},
								products: {
									[Op.contains]: [{ id: p.id }]
								},
								id: {
									[Op.ne]: params.promotion_id || 0
								}
							}
						})
					);
				});
				await Promise.all(
					promise
				).then((data) => {
					console.log("data",data);
				
					data.forEach((promotions) => {
						if (promotions.length > 0) {
							promotions.forEach(promotion => {
								promotion.products.forEach(item => {
									const indexOf = params.products.findIndex(
										(i) => i.option_id === item.option_id
									);
									if (indexOf !== -1) {
										const index = duplicates.findIndex(
											(i) => i.option_id === item.option_id
										);
										if (index === -1) {
											duplicates.push(
												params.products[indexOf]
											);
										}
									}
								});
							});
						}
					});
					
					// if (duplicates.length) {
					// 	throw new MoleculerError("Duplicate product in promtion ", 400, "duplication promotion", {
					// 		message:"Sản phẩm đã tồn tại trong 1 trình khuyến mãi có cùng khoảng thời gian"
					// 	});
					// }
				});
				
				return duplicates;
			}
		},
		cancel:{
			rest: {
				method: "POST",
				path: "/:id/cancel"
			},
			auth:"required",
			authen:[permissions.PROMOTION_UPDATE],
			async handler(ctx){
				const { promotion } = ctx.locals;
				const entity={
					status: Promotion.Statuses.CANCELLED,
					status_name: Promotion.NameStatuses.CANCELLED,
					updated_by: pick(ctx.meta.user, ["id", "name"]),
					updated_at: new Date()
				};
				await this.adapter.model.update(entity,{where:{id:promotion.id}});
				return ({
					code: 0,
					message: messages.UPDATE_SUCCESS
				});
			}
		},
		finish:{
			rest: {
				method: "POST",
				path: "/:id/finish"
			},
			auth:"required",
			authen:[permissions.PROMOTION_UPDATE],
			async handler(ctx){
				const { promotion } = ctx.locals;
				const entity={
					status: Promotion.Statuses.FINISHED,
					status_name: Promotion.NameStatuses.FINISHED,
					updated_by: pick(ctx.meta.user, ["id", "name"]),
					updated_at: new Date()
				};
				let result=	await this.adapter.model.update(entity,{where:{id:promotion.id}});
				return ({
					code: 0,
					data:Promotion.transform(result),
					message: messages.UPDATE_SUCCESS
				});
			}
		},
		active:{
			rest: {
				method: "POST",
				path: "/:id/active"
			},
			auth:"required",
			authen:[permissions.PROMOTION_UPDATE],
			async handler(ctx){
				const { promotion } = ctx.locals;
				const entity={
					status: Promotion.Statuses.STARTING,
					status_name: Promotion.NameStatuses.STARTING,
					updated_by: pick(ctx.meta.user, ["id", "name"]),
					updated_at: new Date()
				};
				const result=	await this.adapter.model.update(entity,{where:{id:promotion.id} ,returning:true});
				console.log();
				return ({
					code: 0,
					data:Promotion.transform(result[1][0]),
					message: "Đã kích hoạt chương trình khuyến mại"
				});
			}
		},
		block:{
			rest: {
				method: "POST",
				path: "/:id/block"
			},
			auth:"required",
			authen:[permissions.PROMOTION_UPDATE],
			async handler(ctx){
				const { promotion } = ctx.locals;
				const entity={
					status: Promotion.Statuses.STOPPING,
					status_name: Promotion.NameStatuses.STOPPING,
					updated_by: pick(ctx.meta.user, ["id", "name"]),
					updated_at: new Date()
				};
				const result=	await this.adapter.model.update(entity,{where:{id:promotion.id}});
				return ({
					code: 0,
					data:Promotion.transform(result),
					message: "Đã tạm dừng chương trình khuyến mại"
				});
			}
		},
		geted:{
			rest: {
				method: "GET",
				path: "/"
			},
			auth:"required",
			authen:[permissions.PROMOTION_VIEW],
			async handler (ctx){
				try {
					const {
						type,
						code,
						keyword,
						is_visible,
						is_active,
						product_sku,
						product_name,
						min_created_at,
						max_created_at,
						min_start_time,
						max_start_time,
						statuses,
						sort_by,
						order_by,
						skip = 0,
						limit = 20,
					}=ctx.params;
					const options = Promotion.filterConditions({
						type,
						code,
						keyword,
						is_visible,
						is_active,
						product_sku,
						product_name,
						min_created_at,
						max_created_at,
						min_start_time,
						max_start_time,
						statuses
					});
					const sorts = Promotion.sortConditions({
						sort_by,
						order_by
					});
					let result = await this.adapter.model.findAll({
						where: options,
						order: [sorts],
						offset: skip,
						limit: limit
					});
					return ({
						code:0,
						count:ctx.locals.count,
						data: result.map((v)=>Promotion.transform(v))
					});
				} catch (ex) {
					throw new MoleculerError("can not get promotion successful", 400, "not sucessfull", {
						message:ex.message
					});
				}
			}
		},
		get1:{
			rest: {
				method: "GET",
				path: "/:id"
			},
			auth:"required",
			authen:[permissions.PROMOTION_VIEW],
			async handler(ctx){
				try {
					return ({
						code:0,
						data:Promotion.transform(ctx.locals.promotion)
					});
				} catch (ex) {
					throw new MoleculerError("can not get promotion successful", 400, "not sucessfull", {
						message:ex.message
					});
				}
			}
		}
		
	},

	/**
	 * Methods
	 */
	methods: {
		
	},
	events: {
		"promotion.update_status":{
			async handler(data) {
				try {
					let entity={};
					if(data.type===Promotion.Statuses.STARTING){
						entity={
							status: Promotion.Statuses.STARTING,
							status_name: Promotion.NameStatuses.STARTING,
							updated_by:{
								id:0,
								name:"automatic",
							},
							updated_at: new Date()
						};
					}else{
						entity={
							status: Promotion.Statuses.FINISHED,
							status_name: Promotion.NameStatuses.FINISHED,
							updated_by:{
								id:0,
								name:"automatic",
							},
							updated_at: new Date()
						};
					}
					const result=	await this.adapter.model.update(entity,{where:{id:data.id} ,returning:true});
					// call event promotion
					this.broker.emit("promotion.update",result[1][0]);
		
				} catch (error) {
					throw new MoleculerError("event update status not success", 400, "not sucessfull", {
						message:error.message
					});
				}
			}
		},
		"promotion.update":{
			group:"promotion",
			async handler(data) {
				const { dataValues: promotion, _previousDataValues: oldEvent } = data;
				const products = promotion.products;
				const changed = data.changed();
				if (
					includes(changed, "products") &&
					promotion.status === Promotion.Statuses.STARTING
				) {
					const removed = differenceWith(
						oldEvent.products || [],
						products,
						(x, y) => x.option_id === y.option_id
					);
					if (removed.length > 0) {
						const operations = oldEvent.products.map(item => {
							const element = cloneDeep(item);
							element.id = item.id;
							element.option_id = item.option_id;
							element.price = item.normal_price;
							element.discount = null;
							return element;
						});
						this.broker.emit("product.update_promotion",operations);
						this.broker.emit("product_option.update_promotion",operations);
						// event product option
						// await bulkUpdateProduct(
						// 	operations
						// );
					}
				}
				if (promotion.status === Promotion.Statuses.STARTING) {
					const operations = products.map(item => {
						const element = cloneDeep(item);
						element.original_price = item.original_price;
						element.normal_price = item.normal_price;
						element.price = item.price;
						element.discount = {
							id: promotion.id,
							name: promotion.name,
							rate: item.discount_rate,
							value: item.discount_value
						};
						element.option_id = item.option_id;
						element.id = item.id;
						return element;
					});
					this.broker.emit("product.update_promotion",operations);
					this.broker.emit("product_option.update_promotion",operations);
					// await bulkUpdateProduct(
					// 		operations
					// );
				}
				// [WORKER] Handler event promotion stop
				if (
					promotion.status === Promotion.Statuses.STOPPING ||
						promotion.status === Promotion.Statuses.FINISHED
				) {
					const operations = products.map(item => {
						const element = cloneDeep(item);
						element.option_id = item.option_id;
						element.id = item.id;
						element.discount = null;
						element.price = item.normal_price;
						return element;
					});
					this.broker.emit("product.update_promotion",operations);
					this.broker.emit("product_option.update_promotion",operations);
					// await bulkUpdateProduct(
					// 		operations
					// );
				}
				
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
