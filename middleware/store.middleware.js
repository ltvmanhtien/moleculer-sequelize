// import { Op } from "sequelize";

const serviceName= require("../utils/service-name");
const { MoleculerError } = require("moleculer").Errors;
const Store =require("../model/stock.model");
const { Op }=require("sequelize");
/**
 * Load Store by id add to req locals.
 */
exports.load = async (ctx) => {
	try {
		ctx.locals = {};
		let store=	await ctx.call(`${serviceName.Store}.get`,{id:ctx.params.id});
		ctx.locals.store = store;
		
	} catch (ex) {
		throw new MoleculerError("NOT FIND STORE", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const filterParam=Store.filterConditions(
			ctx.params
		);
		ctx.totalRecords = await  ctx.call(`${serviceName.Store}.count`,{query:filterParam});
		
	} catch (ex) {
		throw new MoleculerError("COUNT HAPPEND PROBLEM", 400, "COUNT HAPPEND PROBLEM", ex);
	}
};

