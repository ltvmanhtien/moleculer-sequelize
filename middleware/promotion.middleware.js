const {pick} =require("lodash");
const Promotion =require("../model/promotion.model");
const { MoleculerError } = require("moleculer").Errors;
// Models

const serviceName =require("../utils/service-name");
/**
 * Load order by id appendd to locals.
 */
exports.load = async (ctx) => {
	try {
		const  promotion  =await ctx.call(`${serviceName.Promotion}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.promotion = promotion;
	} catch (ex) {
		throw new MoleculerError("NOT FIND Promotion", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
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
			statuses
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
		const count = await  ctx.call(`${serviceName.Promotion}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
		
	} catch (ex) {
		console.log(ex);
		throw new MoleculerError("NOT COUNT PROMOTION", 400, "NOT_FOUND", {data:ex.message});
	}
};

/**
 * Perpare Promotion params
 */
exports.prepareCreate = async (ctx) => {
	try {
		const params = Promotion.filterParams("PUBLIC_FIELDS", ctx.params);
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		// params.device_id = ctx.headers["user-agent"];

		if (params.products) {
			params.products = params.products.map(p => Promotion.filterParams("PRODUCT", p));
		}

		if (params.applied_discount_condition) {
			params.applied_discount_condition = Promotion.filterParams("CONDITION", params.applied_discount_condition);
		}

		ctx.params = params;
	} catch (ex) {
		throw new MoleculerError("NOT PREPARE PROMOTION", 400, "NOT_FOUND", ex);
	}
};

/**
 * Perpare Promotion update
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { promotion: oldModel } = ctx.locals;
		const params = Promotion.filterParams(
			"PUBLIC_FIELD", ctx.params
		);
		const dataChanged = Promotion.getChangedProperties({
			oldModel,
			newModel: params
		});
		const paramChanged = pick(params, dataChanged);
		paramChanged.updated_by = pick(ctx.meta.user, ["id", "name"]);
		paramChanged.updated_at = new Date();
		ctx.body = paramChanged;
	} catch (ex) {
		throw new MoleculerError("NOT PREPARE UPDATE PROMOTION", 400, "NOT_FOUND", ex);
	}
};

/**
 * Perpare Promotion update
 */
exports.prepareReplace = async (ctx) => {
	try {
		const { promotion } = ctx.locals;
		console.log(promotion);
		if (promotion.status === Promotion.Statuses.FINISHED) {
			throw new MoleculerError("Kh??ng th??? x??? l?? ch????ng tr??nh khuy???n m??i ???? k???t th??c", 400, "NOT_FOUND", {
				message:"Kh??ng th??? x??? l?? ch????ng tr??nh khuy???n m??i ???? k???t th??c"
			});
			
		}
	} catch (ex) {
		throw new MoleculerError("NOT PREPARE REPLACE PROMOTION", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Check duplicate Promotion
 */
exports.checkDuplicate = async (ctx) => {
	try {
		ctx.params.promotion_id = ctx.params.id;
		const duplicate=	await ctx.call(`${serviceName.Promotion}.checkDuplicate`,{promotion:ctx.params});
		if(duplicate.length>0){
			throw new MoleculerError("Duplicate product in promtion ", 400, "duplication promotion", {
				message:"S???n ph???m ???? t???n t???i trong 1 tr??nh khuy???n m??i c?? c??ng kho???ng th???i gian"
			});
		}
	} catch (ex) {
		throw new MoleculerError("NOT PREPARE REPLACE PROMOTION", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Check time create Promotion
 */
exports.checkTimeCreate = async (ctx) => {
	// console.log(new Date(ctx.params.applied_start_time).getTime());
	const getStartTime = Math.round(new Date(ctx.params.applied_start_time).getTime() + (1000 * 60 * 60));

	try {
		if (new Date(ctx.params.applied_stop_time).getTime() < getStartTime && ctx.params.type === "combo_deal") {
			throw new MoleculerError(
				"Ch????ng tr??nh ph???i k??o d??i ??t nh???t l?? 1h k??? t??? khi b???t ?????u", 400, "NOT_FOUND", {
					message:"Ch????ng tr??nh ph???i k??o d??i ??t nh???t l?? 1h k??? t??? khi b???t ?????u"
				}
			);
		}
		
	} catch (ex) {
		throw new MoleculerError("NOT PREPARE REPLACE PROMOTION", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

/**
 * Perpare check time promotion update
 */
exports.checkTimeUpdate = async (ctx) => {
	try {
		const { promotion } = ctx.locals;
		const getStartTime = Math.round(ctx.params.applied_start_time.getTime() + (1000 * 60 * 60));

		// console.log(promotion.applied_stop_time.getTime(), req.body.applied_stop_time.getTime());
		if (
			promotion.status === Promotion.Statuses.STARTING &&
            promotion.applied_stop_time.getTime() < Date.now()
		) {
			throw new MoleculerError(
				"Th???i gian k???t th??c ch????ng tr??nh ch??? c?? th??? ???????c thay ?????i th??nh th???i gian mu???n h??n.", 400, "NOT_FOUND", {
					message:"Th???i gian k???t th??c ch????ng tr??nh ch??? c?? th??? ???????c thay ?????i th??nh th???i gian mu???n h??n."
				}
			);
		}
		if (ctx.params.applied_stop_time.getTime() < getStartTime) {
			throw new MoleculerError(
				"Ch????ng tr??nh ph???i k??o d??i ??t nh???t l?? 1h k??? t??? khi b???t ?????u", 400, "NOT_FOUND", {
					message:"Ch????ng tr??nh ph???i k??o d??i ??t nh???t l?? 1h k??? t??? khi b???t ?????u"
				}
			);
			
		}
	} catch (ex) {
		throw new MoleculerError("SOMETHING ERROR", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};
