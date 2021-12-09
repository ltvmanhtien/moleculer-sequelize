
const serviceName =require("../utils/service-name");
const { MoleculerError } = require("moleculer").Errors;
const Order =require("../model/order.model");
const { pick ,omitBy,isNil} =require("lodash");
const orderAdapter =require("../adapter/order-adapter");
/**
 * Load order by id appendd to locals.
 */
exports.load = async (ctx) => {
	try {
		const order = await ctx.call(`${serviceName.Order}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.order = order;
		
	} catch (ex) {
		throw new MoleculerError("NOT FIND ORDER", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load total order appendd to locals.
 */
exports.count = async (ctx) => {

	try {
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
		} = ctx.params;
		const filterParam=Order.filterConditions(
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
		);
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.totalRecords = await  ctx.call(`${serviceName.Order}.count`,{query:filterParam});
	} catch (ex) {
		throw new MoleculerError(ex, 501, "ERR_SOMETHING", {
			data:ex.message
		});
	}
};

/**
 * Load sum for filter.
 */
exports.sum = async (ctx) => {
	try {
	
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
		} = ctx.params;
		const options = Order.filterConditions({
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
		const total_quantity = await ctx.call(`${serviceName.Order}.sum`,
			{
				attribute:"total_quantity",
				options:options
			}
		);
		console.log("total_quantity",total_quantity);
		const total_paid = await ctx.call(`${serviceName.Order}.sum`,
			{	
				attribute:"total_paid",
				options:options
			}
		);
		const total_unpaid = await ctx.call(`${serviceName.Order}.sum`,
			{
				attribute:"total_unpaid",
				options:options 
			}
		);
		const total_discount_value = await ctx.call(`${serviceName.Order}.sum`,
			{
				attribute:"total_discount_value",
				options:options 
			}
		);
		const total_price_before_discount = await ctx.call(`${serviceName.Order}.sum`,
			{
				attribute:"total_price_before_discount",
				options:options 
			}
		);
		const total_price = await ctx.call(`${serviceName.Order}.sum`,
			{   
				attribute:"total_price",
				options:options 
			}
		);
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.sum={
			total_paid,
			total_price,
			total_unpaid,
			total_quantity,
			total_discount_value,
			total_price_before_discount
		};
		
	} catch (ex) {
		throw new MoleculerError(ex, 501, "ERR_SOMETHING", {
			data:ex.message
		});
	}
};

// /**
//  * Pick params append to req
//  */
// exports.filterQuery = (ctx) => {
// 	const params = omitBy(ctx.params, isNil);
// 	const includeRestrictedFields = req.authInfo.accessLevel === ConsumerGroups.STAFF;
// 	params.user_code = includeRestrictedFields ? params.user_code : req.user.id;
// 	req.query = params;
// 	next();
// };

/**
 * Perpare order params
 */
exports.prepareOrder = async (ctx) => {
	try {
		// console.log(ctx);
		const params = Order.filterParams(ctx.params);
		// params.device_id = ctx.headers["user-agent"];
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		if (params.order && params.order.id) {
			await ctx.call(`${serviceName.Order}.checkOrderHandler`,{id:params.order.id});
		}
		if (params.status) {
			params.status_name = Order.StatusNames[
				params.status.toUpperCase()
			];
		}
		if (params.status === Order.Statuses.PROCESSING) {
			params.confirmed_by = pick(ctx.user, ["id", "name"]);
			params.confirmed_at = new Date();
		}
		if (params.status === Order.Statuses.COMPLETED) {
			params.completed_by = pick(ctx.user, ["id", "name"]);
			params.completed_at = new Date();
		}
		if (params.products && params.products.length) {
			params.products = await orderAdapter.parseItems(ctx,params.products);
			const productPath = params.products.map(p => `${p.sku}:${p.name}`);
			params.normalize_product = productPath.join(" - ");
		}
		if (params.store) {
			params.store = pick(params.store, Order.STORE_FIELDS);
		}
		if (params.channel) {
			params.channel = pick(params.channel, Order.CHANNEL_FIELDS);
		}
		if (params.payment) {
			params.payment = pick(params.payment, Order.PAYMENT_FIELDS);
		}
		if (params.shipping) {
			params.shipping = pick(params.shipping, Order.SHIPPING_FIELDS);
		}
		if (params.price_book) {
			params.price_book = pick(params.price_book, Order.PRICE_BOOK_FIELDS);
		}
		if (!params.customer) {
			params.customer = {
				id:0,
				name:"Khách lẻ",
				phone:"0123456789",
				address:null,
				note:null,
			};
		}
		if (params.customer) {
			params.customer = pick(
				params.customer,
				Order.CUSTOMER_FIELDS
			);
		}
		const returnAmount = await orderAdapter.calTotalPrice(params);
		params.total_quantity = returnAmount.total_quantity;
		params.total_price_before_discount = returnAmount.total_price_before_discount;
		params.total_price_after_discount = returnAmount.total_price_after_discount;
		params.total_discount_value = returnAmount.total_discount_value;
		params.total_original_price = returnAmount.total_original_price;
		params.total_price = returnAmount.total_price;
		params.total_point = returnAmount.total_point;
		params.total_paid = returnAmount.total_paid;
		params.total_unpaid = returnAmount.total_unpaid;
		ctx.params = params;
		
	} catch (ex) {
		throw new MoleculerError(ex, 400, "ERR_SOMETHING", {
			data:ex.message
		});
	}
};

/**
 * Perpare order update
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { order: oldModel } = ctx.locals;
		const params = Order.filterParams(ctx.params);
		const dataChanged = Order.getChangedProperties({ oldModel, newModel: params });
		const paramChanged = pick(params, dataChanged);
		paramChanged.updated_by = pick(ctx.meta.user, ["id", "name"]);
		paramChanged.updated_at = new Date();
		// paramChanged.id=oldModel.id;
		ctx.params = paramChanged;
	} catch (ex) {
		throw new MoleculerError(ex, 400, "ERR_SOMETHING", ex);
	}
};

/**
 * Prepare replace order
 */
exports.prepareReplace = async (ctx, res, next) => {
	try {
		const { order } = ctx.locals;
		if (order.status === Order.Statuses.COMPLETED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã hoàn thành"
			});
		
		}
		if (order.status === Order.Statuses.CANCELLED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã huỷ"
			});
		
		}
		return next();
	} catch (ex) {
		throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
			message: ex.message
		});
	}
};

/**
 * Prepare confirm order
 */
exports.prepareConfirm = async (ctx, res, next) => {
	try {
		const { order } = ctx.locals;
		if (order.status === Order.Statuses.COMPLETED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã hoàn thành"
			});
		}
		if (order.status === Order.Statuses.CANCELLED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã huỷ"
			});
		}
		return next();
	} catch (ex) {
		throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
			message: ex.message
		});
	}
};

/**
 * Prepare confirm order
 */
exports.prepareComplete = async (ctx, res, next) => {
	try {
		const { order } = ctx.locals;
		if (order.status === Order.Statuses.DRAFT) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng chưa được duyệt"
			});
		}
		if (order.status === Order.Statuses.COMPLETED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã hoàn thành"
			});
		}
		if (order.status === Order.Statuses.CANCELLED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Không thể xử lý đơn hàng đã huỷ"
			});
		}
		return next();
	} catch (ex) {
		throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
			message: ex.message
		});
	}
};

/**
 * Prepare cancel order
 */
exports.prepareCancel = async (ctx, res, next) => {
	try {
		const { order } = ctx.locals;
		if (order.status === Order.Statuses.CANCELLED) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Đơn hàng này đã bị hủy trước đó!"
			});

		}
		const returnCount = await Order.count({
			where: {
				"invoice.id": order.id,
				"invoice.code": order.code,
				status: Order.Statuses.COMPLETED,
				type: Order.Types.RETURN
			}
		});
		if (returnCount > 0) {
			throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
				message: "Bạn cần huỷ phiếu trả hàng trước khi huỷ hoá đơn"
			});
		
		}
		return next();
	} catch (ex) {
		throw new MoleculerError("ERROR", 400, "ERR_SOMETHING", {
			message: ex.message
		});
	}
};
