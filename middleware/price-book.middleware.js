const  { pick } =require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const serviceName =require("../utils/service-name");
// Models
const PriceBook =require("../model/price-book.model"); 

/**
 * Load product and append to req.
 * @public
 */
exports.load = async (ctx) => {
	try {
		const priceBook = await ctx.call(`${serviceName.PriceBook}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.price = priceBook;
	} catch (ex) {
		throw new MoleculerError("Not find price book ", 404, "NOT_FOUND", {
			data:ex.message
		});
	}
};

/**
 * Count list record and append to req
 * @public
 */
exports.count = async (ctx) => {
	try {
		const {
			keyword,
			types,
			statuses,
		}=ctx.params;
		const options = PriceBook.filterConditions({
			keyword,
			types,
			statuses,
		});
		const count = await  ctx.call(`${serviceName.PriceBook}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
		
	} catch (error) {
		throw new MoleculerError("Not count price book ", 404, "NOT_FOUND", {
			data:error.message
		});
	}
};

/**
 * Filter Query
 * @public
 */
exports.filterQuery = (req, res, next) => {
	// TODO:: pick public param for user | staff
	next();
};

/**
 * Load create
 * @public
 */
exports.prepareCreate = async (ctx) => {
	try {
		const params = PriceBook.filterParams(ctx.params);
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		ctx.params = params;
	} catch (error) {
		throw new MoleculerError("Not prepare price book ", 400, "NOT_FOUND", {
			data:error.message
		});
	}
};

/**
 * Load update
 * @public
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { product } = ctx.locals;
		const params = PriceBook.filterParams(
			ctx.params
		);
		const dataChanged = PriceBook.getChangedProperties({
			oldModel: product,
			newModel: params
		});
		const paramChanged = pick(
			params,
			dataChanged
		);
		paramChanged.updated_by = pick(
			ctx.meta.user,
			["id", "name"]
		);
		ctx.params = paramChanged;
	} catch (error) {
		throw new MoleculerError("Not prepare update price book ", 404, "NOT_FOUND", {
			data:error.message
		});
	}
};
