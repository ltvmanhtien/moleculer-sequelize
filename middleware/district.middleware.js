const { MoleculerError } = require("moleculer").Errors;
const { pick } =require("lodash");
const  District =require("../model/district.model");
const serviceName =require("../utils/service-name");

/**
 * Load store by id add to req locals.
 */
exports.load = async (ctx) => {
	try {
		const  district  =await ctx.call(`${serviceName.Province}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.province = district;
	} catch (ex) {
		throw new MoleculerError("NOT FIND PROVINCE", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const {
			name,
			province_code,
			// sort
			sort_by,
			order_by,
			skip = 0,
			limit = 100,
		}=ctx.params;
		const options = District.filterConditions({
			name,province_code
		});
		
		const count = await  ctx.call(`${serviceName.Product}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
	} catch (ex) {
		throw new MoleculerError("NOT COUNT PROVINCE", 400, "NOT_FOUND", {data:ex.message});
	}
};

/**
 * Perpare province params
 */
exports.prepareParams = async (ctx) => {
	try {
		const params = District.filterParams(ctx.params);
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		// transform body
		ctx.params = params;

	} catch (ex) {
		throw new MoleculerError("NOT Prepare Param", 400, "NOT_FOUND", {data:ex.message});
	}
};

/**
 * Perpare province update
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { district: oldModel } = ctx.locals;
		const params = District.filterParams(
			ctx.params
		);
		const dataChanged = District.getChangedProperties({
			oldModel,
			newModel: params
		});
		const paramChanged = pick(params, dataChanged);
		paramChanged.updated_by = pick(ctx.meta.user, ["id", "name"]);
		paramChanged.updated_at = new Date();
		ctx.params = paramChanged;
	} catch (ex) {
		throw new MoleculerError("NOT Prepare update", 400, "NOT_FOUND", {data:ex.message});
	}
};

