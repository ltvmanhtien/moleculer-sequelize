const { cloneDeep, findIndex, isNil, omitBy, pick } =require("lodash");
const  messages =require("../utils/messages");
const ApiGateway = require("moleculer-web");
const { MoleculerError } = require("moleculer").Errors;

const Cart =require("../model/cart.model");
const Order =require("../model/order.model");
const ProductPrice =require("../model/price-book.model");
const cartAdapter =require("../adapter/cart-adapter");

/**
 * Update Cart
 * @param {*} params
 */
exports.updateCart = async (ctx) => {
	try {
		const { order } = ctx.locals;
		const newOrder = cloneDeep(order);

		// trasnform data
		const { customer, note } = ctx.params;
		if (customer) newOrder.customer = customer;
		if (note) newOrder.note = note;
		ctx.locals.order = newOrder;
	} catch (ex) {
		throw new MoleculerError("CAN NOT UPDATE CART", 404, "NOT_FOUND", ex);
	}
};

/**
 * Add Item
 * @param {*} product
 */
exports.addItem = async (ctx) => {
	try {
		const { order } = ctx.locals;
		const { products } = order;
		const params = omitBy(ctx.params, isNil);
		const indexOf = findIndex(products, o => o.option_id === params.option_id);

		if (indexOf !== -1) {
			const item = products[indexOf];
			item.total_quantity += params.total_quantity;
			item.total_discount = 0; // Calculate price if has discount
			item.total_before_discount = Math.ceil(item.price * item.total_quantity);
			item.total_price = Math.ceil(item.total_before_discount - item.total_discount);
			products[indexOf] = cloneDeep(item);
		} else {
			products.push(
				{
					id: params.id,
					option_id: params.option_id,
					total_quantity: params.total_quantity
				}
			);
		}

		// trasnform data
		order.products = products;
		ctx.locals.order = order;
	} catch (ex) {
		throw new MoleculerError("CAN NOT ADD PRODUCT", 404, "NOT_FOUND", ex);
	}
};

/**
 * Add Item
 * @param {*} option_id
 * @param {*} total_quantity
 */
exports.updateItem = async (ctx, res, next) => {
	try {
		const { order } = ctx.locals;
		const { products } = order;
		const { total_quantity } = ctx.params;
		const indexOf = findIndex(
			products, o => o.option_id === parseInt(ctx.params.id, 0)
		);
		if (indexOf !== -1) {
			const item = products[indexOf];
			item.total_quantity = total_quantity;
			products[indexOf] = cloneDeep(item);
		} else {
			throw new MoleculerError(`Không tìm thấy sản phẩm: ${ctx.params.id}`, 404, "NOT_FOUND", {
				message:`Không tìm thấy sản phẩm: ${ctx.params.id}`
			});
		}
		// trasnform data
		order.products = products;
		ctx.locals.order = order;
		return next();
	} catch (ex) {
		throw new MoleculerError("CAN NOT UPDATE PRODUCT", 404, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Remove Item
 * @param {*} id
 */
exports.removeItem = async (ctx) => {
	try {
		const { order } = ctx.locals;
		const { products } = order;
		const indexOf = findIndex(
			products, o => o.option_id === parseInt(ctx.params.id, 0)
		);
		if (indexOf !== -1) {
			products.splice(indexOf, 1);
		} else {
			throw new MoleculerError(`Không tìm thấy sản phẩm: ${ctx.params.id}`, 404, "NOT_FOUND", {
				message:`Không tìm thấy sản phẩm: ${ctx.params.id}`
			});
		}

		// trasnform data
		order.products = products;
		ctx.locals.order = order;
	} catch (ex) {
		throw new MoleculerError("CAN NOT REMOVE PRODUCT", 404, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Add Payment
 * @param {*} payment
 */
exports.addPayment = async (ctx) => {
	try {
		// transform data
		const { order } = ctx.locals;
		const { payments } = ctx.params;
		order.payments = payments;
		ctx.locals.order = order;
	} catch (ex) {
		throw new MoleculerError("CAN NOT ADD PAYMENT", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Update Payment Method
 * @param {*} payment
 */
exports.updatePaymentMethod = async (ctx, res, next) => {
	try {
		// transform data
		const { order } = ctx.locals;
		const { payment } = ctx.params;
		order.payment = payment;
		ctx.locals.order = order;
	} catch (ex) {
		throw new MoleculerError("CAN NOT ADD PAYMENT METHOD", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Update shipping Method
 * @param {*} shipping_method
 */
exports.updateShippingMethod = async (ctx) => {
	try {
		// transform data
		const { order } = ctx.locals;
		const { shipping } = ctx.params;
		order.shipping = shipping;
		ctx.locals.order = order;
	} catch (ex) {
		throw new MoleculerError("CAN NOT ADD SHIPPING METHOD", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Perpare cart params
 */
exports.prepareCart = async (ctx) => {
	try {
		const params = ctx.locals.order;
		params.device_id = ctx.headers["user-agent"];
		params.client_id = ctx.headers["x-consumer-custom-id"];

		// Transform items
		if (params.products && params.products.length) {
			params.products = await cartAdapter.parseItems(params.products);
		}

		if (ctx.user) {
			params.created_by = pick(ctx.user, ["id", "name"]);
			params.customer = pick(ctx.user, ["id", "name", "phone", "address"]);
		}

		if (!params.customer && params.shipping.address) {
			const { address } = params.shipping;
			params.created_by = { id: 0, name: address.name };
			params.customer = { id: 0, name: address.name, phone: address.phone };
		}

		// Calculate price
		const returnAmount = await cartAdapter.calTotalPrice(params);
		params.total_price_before_discount = returnAmount.total_price_before_discount;
		params.total_price_after_discount = returnAmount.total_price_after_discount;
		params.total_discount_value = returnAmount.total_discount_value;
		params.total_original_price = returnAmount.total_original_price;
		params.total_shipping_fee = returnAmount.total_shipping_fee;
		params.total_quantity = returnAmount.total_quantity;
		params.total_price = returnAmount.total_price;
		params.total_point = returnAmount.total_point;
		params.total_paid = returnAmount.total_paid;
		params.total_unpaid = returnAmount.total_unpaid;

		// transform params
		ctx.locals.order = params;
	} catch (error) {
		throw new MoleculerError("CAN NOT PREPARE CART", 400, "NOT_FOUND", {
			message:error.message
		});
	}
};

/**
 * Perpare cart params
 */
exports.prepareConfirm = async (ctx, res, next) => {
	try {
		const params = Order.filterParams(ctx.params);
		params.type = Order.Types.ORDER;
		params.status = Order.Statuses.DRAFT;
		params.status_name = Order.StatusNames.DRAFT;
		params.price_book = ProductPrice.DefaultValues;
		params.channel = { id: 1, name: "Bán trực tiếp" };
		params.store = { id: 1, name: "Coco online", phone: "0988888290" };

		// Transform items
		if (params.products && params.products.length) {
			params.products = await cartAdapter.parseItems(params.products);
			const productPath = params.products.map(p => `${p.sku}:${p.name}`);
			params.normalize_product = productPath.join(" - ");
		}

		if (ctx.user) {
			params.created_by = pick(ctx.user, ["id", "name"]);
			params.customer = pick(ctx.user, ["id", "name", "phone", "address"]);
		}

		if (!params.customer && params.shipping.address) {
			const { address } = params.shipping;
			params.created_by = { id: 0, name: address.name };
			params.customer = { id: 0, name: address.name, phone: address.phone };
		}

		// Calculate price
		const returnAmount = await cartAdapter.calTotalPrice(params);
		params.total_price_before_discount = returnAmount.total_price_before_discount;
		params.total_price_after_discount = returnAmount.total_price_after_discount;
		params.total_discount_value = returnAmount.total_discount_value;
		params.total_original_price = returnAmount.total_original_price;
		params.total_shipping_fee = returnAmount.total_shipping_fee;
		params.total_quantity = returnAmount.total_quantity;
		params.total_price = returnAmount.total_price;
		params.total_point = returnAmount.total_point;
		params.total_paid = returnAmount.total_paid;
		params.total_unpaid = returnAmount.total_unpaid;

		// transform params
		ctx.locals.order = params;
		return next();
	} catch (error) {
		throw new MoleculerError("CAN NOT PREPARE CONFIRM", 400, "NOT_FOUND", {
			message:error.message
		});
	}
};

/**
 * Reset cart to default
 */
exports.renewStatus = async (ctx, res, next) => {
	try {
		const { clientId } = ctx.authInfo;
		if (isNil(clientId)) {
			throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
		}
		await Cart.update(
			{
				status: Cart.Statuses.CONFIRMED,
				status_name: Cart.NameStatuses.CONFIRMED
			},
			{
				where: {
					client_id: clientId,
					status: Cart.Statuses.PICKING
				}
			}
		);
		return next();
	} catch (error) {
		throw new MoleculerError("CAN NOT RENEW STATUS", 400, "NOT_FOUND", {
			message:error.message
		});
	}
};

/**
 * Check duplicate clientId.
 */
exports.checkDuplicate = async (ctx) => {
	try {
		const { clientId } = ctx.authInfo;
		if (isNil(clientId)) {
			throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
		}
		await Cart.checkDuplicate(clientId);

	} catch (error) {
		throw new MoleculerError("CAN NOT CHECK DUPLICATE", 400, "NOT_FOUND", {
			message:error.message
		});
	}
};

/**
 * Check confirm cart.
 */
exports.checkConfirm = async (ctx, res, next) => {
	try {
		const order = ctx.params;
		if (
			order.products &&
            order.products.length === 0
		) {
			throw new MoleculerError("Giỏ hàng của bạn chưa có sản phẩm nào được chọn", 400, "NOT_FOUND", {
				message: "Giỏ hàng của bạn chưa có sản phẩm nào được chọn"
			});
		}
		if (
			order.shipping &&
            !order.shipping.address
		) {
			throw new MoleculerError("Vui lòng chọn thông tin nhận hàng của bạn", 400, "NOT_FOUND", {
				message: "Vui lòng chọn thông tin nhận hàng của bạn"
			});
		}
		return next();
	} catch (error) {
		throw new MoleculerError("CAN NOT CHECK CONFIRM", 400, "NOT_FOUND", {
			message:error.message
		});
	}
};

/**
 * Load cart by client_id add to ctx locals.
 */
exports.load = async (ctx, res, next) => {
	try {
		const { clientId } = ctx.authInfo;
		const deviceId = ctx.headers["user-agent"];

		// validate consumer
		if (isNil(clientId)) {
			throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
		}

		// load or generate order
		let order = await Cart.get(
			clientId
		);
		if (isNil(order)) {
			order = await Cart.create({
				shipping: {
					name: Cart.NameShipMethods[1],
					method: Cart.ShipMethods.GH_48H,
					address: null
				},
				payment: {
					name: Cart.NamePaymentMethods[1],
					method: Cart.PaymentMethods.TIEN_MAT
				},
				device_id: deviceId,
				client_id: clientId
			});
		}

		// next ctxuest with new data
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.order = Cart.transform(order);
		return next();
	} catch (error) {
		throw new MoleculerError("CAN NOT LOAD ", 400, "NOT_FOUND", {
			message: error.message
		});
	}
};
