const serviceName =require("../utils/service-name");
const { MoleculerError } = require("moleculer").Errors;
const Attribute =require("../model/attribute.model");
const  AttributeValue =require("../model/attribute-value.model");
const { pick } =require("lodash");
/**
 * Load product attribute add to req locals.
 */
exports.load = async (ctx) => {
	try {
		const attributeValue = await ctx.call(`${serviceName.AttributeValue}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.attributeValue = attributeValue;
	} catch (ex) {
		throw new MoleculerError("NOT FIND ATTRIBUTEVAVLUE", 400, "NOT_FOUND", {
			message:ex.message
		});
	}
};

// /**
//  * Load cache attribute add to req locals.
//  */
// exports.loadCache = async (req, res, next) => {
// 	try {
// 		const day = new Date().getDay();
// 		req.locals = req.locals ? req.locals : {};
// 		const cache = await Redis.client.get(req.originalUrl);
// 		const data = cache ? JSON.parse(cache) : null;
// 		if (data && data.expired !== day) {
// 			await Redis.client.del(req.originalUrl);
// 			data.value = null;
// 		}
// 		req.locals.includeCacheFields = {
// 			key: req.originalUrl,
// 			count: data ? data.count : 0,
// 			data: data ? data.value : null
// 		};
// 		return next();
// 	} catch (ex) {
// 		return ErrorHandler(ex, req, res, next);
// 	}
// };

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const {
			attribute_value,
			attribute_code,
			is_visible,
			keyword,
			categories,
			attributes,
		}=ctx.params;
		const options = AttributeValue.filterConditions({
			attribute_value,
			attribute_code,
			is_visible,
			keyword,
			categories,
			attributes,
		});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.totalRecords = await  ctx.call(`${serviceName.Order}.count`,{query:options});

	} catch (ex) {
		throw new MoleculerError("CAN NOT COUNT ATTRIBUTEVAVLUE", 400, "NOT_FOUND", {
			message:ex.message
		});	
	}
};

/**
 * Load attribute add to req locals.
 */
exports.prepareAttribute = async (ctx)=> {
	try {
		const attributeValue = await ctx.call(`${serviceName.Order}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.attributeValue = AttributeValue.transform(attributeValue);
		
	} catch (ex) {
		throw new MoleculerError("CAN NOT FIND ATTRIBUTEVAVLUE", 400, "NOT_FOUND", {
			message:ex.message
		});	
	}
};
/**
 * Perpare params
 */
exports.prepareParams = async (ctx) => {
	try {
		const params = AttributeValue.filterParams(ctx.params);
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		ctx.params = params;
	} catch (ex) {
		throw new MoleculerError("CAN NOT PREPARE ATTRIBUTEVAVLUE", 400, "NOT_FOUND", {
			message:ex.message
		});	
	}
};

/**
 * Perpare update
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { attributeValue: oldModel } = ctx.locals;
		const params = AttributeValue.filterParams(
			ctx.params
		);
		const dataChanged = AttributeValue.getChangedProperties({
			oldModel,
			newModel: params
		});
		const paramChanged = pick(params, dataChanged);
		paramChanged.updated_by = pick(ctx.meta.user, ["id", "name"]);
		paramChanged.updated_at = new Date();
		ctx.locals.attributeValue = paramChanged;
	} catch (ex) {
		throw new MoleculerError("CAN NOT PREPARE UPDATE ATTRIBUTEVAVLUE", 400, "NOT_FOUND", {
			message:ex.message
		});	
	}
};