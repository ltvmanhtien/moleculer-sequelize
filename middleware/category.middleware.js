// import { Op } from "sequelize";

const serviceName= require("../utils/service-name");
const { MoleculerError } = require("moleculer").Errors;
const Category =require("../model/category.model");
const { Op }=require("sequelize");
/**
 * Load category by id add to req locals.
 */
exports.load = async (ctx) => {
	try {
		ctx.locals = {};
		let category=	await ctx.call(`${serviceName.Category}.get`,{id:ctx.params.id});
		ctx.locals.category = category;
		
	} catch (ex) {
		throw new MoleculerError("NOT FIND BANNER", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const {options}=ctx.params;
		delete options.is_include;
		delete options.stock_id;
		delete options.skip;
		delete options.limit;
		delete options.order_by;
		delete options.sort_by;
		const filterParam=Category.filterConditions(
			ctx.params
		);
		ctx.totalRecords = await  ctx.call(`${serviceName.Category}.count`,{query:filterParam});
		
	} catch (ex) {
		throw new MoleculerError("COUNT HAPPEND PROBLEM", 400, "COUNT HAPPEND PROBLEM", ex);
	}
};

/**
 * Check delete category
 */
exports.checkCate = async (ctx) => {
	try {
		const { category } = ctx.locals;
		let query={
			where: {
				normalize_categories: {
					[Op.overlap]: [category.id]
				}
			}
		};
		const itemExist  =await ctx.call(`${serviceName.Category}.findOne`,query);
		
		if (itemExist) {
			throw new MoleculerError("Không thể xóa danh mục đang có sản phẩm!", 400, "Không thể xóa danh mục đang có sản phẩm!",
				{
					status:400,
					message:"Không thể xóa danh mục đang có sản phẩm!"
				});
			
		}
	} catch (ex) {
		throw new MoleculerError("SOMETHING HAPPEND", 400, "SOMETHING PROBLEM", ex);
	}
};
