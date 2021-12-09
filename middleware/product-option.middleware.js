const { isNil, omitBy, pick } =require("lodash");
const { MoleculerError } = require("moleculer").Errors;
// Models
const productOptionAdapter =require("../adapter/product-option-adapter");
const serviceName =require("../utils/service-name");
const ProductOption =require("../model/product-option.model");
const Stock= require("../model/stock.model");

async function getProductOptionStock (ctx,product){
	return ctx.call(`${serviceName.Stock}.find`,{query:{id:product.stock}});
}

async function parseProductOption(ctx,products){
	return Promise.all(products.map((product)=>getProductOptionStock(ctx,product)));
}
/**
 * Load product and append to req.
 * @public
 */

exports.load = async (ctx) => {
	try {
		const  productOption  =await ctx.call(`${serviceName.ProductOption}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.productOption = productOption;
	} catch (ex) {
		throw new MoleculerError("NOT FIND PRODUCT Option", 404, "NOT_FOUND", {
			data:ex.message
		});
	}
};

exports.filterQuery = (req, res, next) => {
	// TODO:: pick public param for user | staff
	next();
};
exports.count = async (ctx) => {
	try {
		const {
			sku,
			keyword,
			child_id,
			parent_id,
			product_sku,
			product_name,
			price_books,
			attributes,
			categories,
			statuses,
			brands,
			types,
			skus,
		}=ctx.params;
	
		
		const options = ProductOption.filterConditions({
			sku,
			keyword,
			child_id,
			parent_id,
			product_sku,
			product_name,
			price_books,
			attributes,
			categories,
			statuses,
			brands,
			types,
			skus,
		});
		const count = await  ctx.call(`${serviceName.ProductOption}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
		
	} catch (ex) {
		console.log(ex);
		throw new MoleculerError("NOT COUNT PRODUCT OPTIONS", 400, "NOT_FOUND", {data:ex.message});
	}
};

exports.prepareListSku = (ctx) => {
	ctx.query = pick(
		ctx.body,
		["skip", "limit", "skus"]
	);
	
};
/**
 * Load params
 */
exports.prepareParams = async (ctx) => {
	try {
		const params = ProductOption.filterParams(ctx.params);
		params.created_by = pick(ctx.meta.user, ["id", "name"]);
		ctx.params = productOptionAdapter.parseData(params);
	} catch (ex) {
		throw new MoleculerError("Prepare param not successfull", 400, "NOT_FOUND", {data:ex.message});
	}
};
exports.checkDuplicate=async(ctx)=>{
	try {
		let result=await ctx.call(`${serviceName.ProductOption}.checkDuplicateSku`,{id:ctx.params.id,sku:ctx.params.sku});
		if(result){
			throw new MoleculerError("Sku have adready exist", 400, "NOT_FOUND", {data:"Sku have already exist"});	
		}
	} catch (ex) {
		console.log(ex);
		throw new MoleculerError("Something erorr", 400, "NOT_FOUND", {data:ex.message});
	}
};

/**
 * Load params
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { productOption } = ctx.locals;
		const params = ProductOption.filterParams(
			ctx.params
		);
		const dataChanged = ProductOption.getChangedProperties({
			oldModel: productOption,
			newModel: params
		});
		const paramChanged = pick(
			params, dataChanged
		);
		paramChanged.updated_by = pick(
			ctx.meta.user, ["id", "name"]
		);
		ctx.params = productOptionAdapter.parseData(
			Object.assign(
				pick(productOption, ["sku", "name"]),
				paramChanged
			)
		);
	} catch (ex) {
		throw new MoleculerError("Something erorr", 400, "NOT_FOUND", {data:ex.message});
	}
};

/**
 * Check prepare remove product option
 */
exports.prepareRemove = async (ctx) => {
	try {
		const { productOption } = ctx.locals;
		console.log(productOption);
		if (productOption.is_default) {
          
			throw new MoleculerError("Bạn không thể xóa sản phẩm mặc định: ${productOption.id}", 400, "NOT_FOUND", 
				{data:`Bạn không thể xóa sản phẩm mặc định: ${productOption.id}`});
		}
		
	} catch (ex) {
		throw new MoleculerError("Something erorr", 400, "NOT_FOUND", {data:ex.message});
	}
};