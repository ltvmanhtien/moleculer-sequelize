const Banner =require("../model/banner.model");
const { pick } =require("lodash");
const { MoleculerError } = require("moleculer").Errors;
//const BannerService=require("../services/banner.service");
/**
 * Load store by id add to req locals.
 */
exports.load = async (ctx) => {
	try {
		let banner=	await ctx.call("banner.get",{id:ctx.params.id});
		//let banner=	BannerService.methods.getaa(ctx,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.banner = banner;
	} catch (ex) {
		throw new MoleculerError("NOT FIND BANNER", 404, "NOT_FOUND", ex);

	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const filterParam=Banner.filterConditions(
			ctx.params
		);
		ctx.totalRecords = await  ctx.call("banner.count",{query:filterParam});
	} catch (ex) {
		throw new MoleculerError(ex, 501, "ERR_SOMETHING", { a: 5, nodeID: "node-666" });
	}
};

/**
 * Perpare banner params
 */
exports.prepareParams = async (ctx) => {
	try {
		const params = Banner.filterParams(ctx.params);
		// params.created_by = pick(req.user, ["id", "name"]);
		// transform bodyl
		ctx.params = params;

		// return next();
	} catch (ex) {
		throw new MoleculerError("SOMTHING HAPPENDED", 400, "ERROR", ex);
	}
};

/**
 * Perpare banner update
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { banner: oldModel } = ctx.locals;
		const params = Banner.filterParams(ctx.params);

		const dataChanged = Banner.getChangedProperties({
			oldModel,
			newModel: params
		});
		// transform body
		if (dataChanged.length === 0) {
			throw new MoleculerError("Bạn chưa thay đổi gì để cập nhật!",404, "ERR_SOMETHING", { a: 5, nodeID: "node-666" });
		}
		const paramChanged = pick(params, dataChanged);
		// paramChanged.updated_at = new Date();
		ctx.body = paramChanged;
		
	} catch (ex) {
		throw new MoleculerError("Bạn chưa thay đổi gì để cập nhật!",404, "ERR_SOMETHING", { a: 5, nodeID: "node-666" });
	}
};
