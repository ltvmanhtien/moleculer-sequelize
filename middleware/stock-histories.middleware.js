const { MoleculerError } = require("moleculer").Errors;
const serviceName =require("../utils/service-name");
const StockHistory =require("../model/stock-histories.model");
/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const {
			store_id,
			product_id,
			product_option_id
		}=ctx.params;
		const options = StockHistory.filterConditions({
			store_id,
			product_id,
			product_option_id,
		});
		const count = await  ctx.call(`${serviceName.StockHistory}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
	} catch (ex) {
		throw new MoleculerError("COUNT STOCK HISTORIES FAIL", 404, "NOT_FOUND", {
			message:ex.message
		});
	}
};
