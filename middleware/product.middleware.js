const { isNil, omitBy, pick } =require("lodash");
const { MoleculerError } = require("moleculer").Errors;
// Models
const productAdapter =require("../adapter/product-adapter");
const serviceName =require("../utils/service-name");
const Product =require("../model/product.model");
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
		const  product  =await ctx.call(`${serviceName.Product}.getSkuOrId`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.product = product;
	} catch (ex) {
		throw new MoleculerError("NOT FIND PRODUCT", 404, "NOT_FOUND", ex);
	}
};
exports.loadProductOption=async(ctx)=>{
	let {product}=ctx.locals;
	let search={
		parent_id:product.id,
		is_active:true,
		
	};
	const  listProductOption  =await ctx.call(`${serviceName.ProductOption}.find`,{query:search});
	const listStock= await parseProductOption(ctx,listProductOption);
	listProductOption.map((v,i)=>{
		v.stocks=listStock[i];
	});
	product.products=listProductOption;
	console.log(listProductOption);
	ctx.locals = ctx.locals ? ctx.locals : {};
	ctx.locals.product = product;
};
exports.loadStock=async(ctx)=>{
	let {product}=ctx.locals;
	let search={
		product_id:product.id
	};
	const  stocks =await ctx.call(`${serviceName.Stock}.find`,{query:search});
	product.stocks=stocks;
	ctx.locals = ctx.locals ? ctx.locals : {};
	ctx.locals.product = product;

};
exports.count = async (ctx) => {
	try {
		const {
			skus,
			types,
			statuses,
			suppliers,
			variations,
			attributes,
			categories,
			is_visible,
			is_top_hot,
			is_include,
			is_has_discount,
			min_created_at,
			max_created_at,
			stock_value,
			stock_id,
			min_price,
			max_price,
			discount_id,
			description,
			keyword,
			note,
		}=ctx.params;
		const options = Product.filterConditions({
			skus,
			types,
			statuses,
			suppliers,
			variations,
			attributes,
			categories,
			is_visible,
			is_top_hot,
			is_has_discount,
			min_created_at,
			max_created_at,
			min_price,
			max_price,
			discount_id,
			description,
			keyword,
			note,
		});
	
		
		const count = await  ctx.call(`${serviceName.Product}.count`,{query:options});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
		
	} catch (ex) {
		console.log(ex);
		throw new MoleculerError("NOT count PRODUCT", 400, "NOT_FOUND", {data:ex.message});
	}
};

exports.sum = async (ctx) => {
	try {
		let sum={
			totalQuantity:0,
			totalOrdered:0
		};
		let {
			skus,
			types,
			statuses,
			suppliers,
			variations,
			attributes,
			categories,
			is_visible,
			is_top_hot,
			is_has_discount,
			min_created_at,
			max_created_at,
			stock_value=0,
			stock_id,
			min_price,
			max_price,
			discount_id,
			description,
			keyword,
			note,
		}=ctx.params;
		const options = Product.filterConditions({
			skus,
			types,
			statuses,
			suppliers,
			variations,
			attributes,
			categories,
			is_visible,
			is_top_hot,
			is_has_discount,
			min_created_at,
			max_created_at,
			min_price,
			max_price,
			discount_id,
			description,
			keyword,
			note,
		});
		const filterParam=Product.filterStockConditions(
			stock_value,
			stock_id,
		);
		// if (is_include) {
		const stocks=await	ctx.call(`${serviceName.Stock}.find`,{query:filterParam});
		stocks.forEach(data => {
			sum.totalQuantity += parseFloat(data.total_quantity);
			sum.totalOrdered += parseFloat(data.total_order_quantity);
		});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.sum = sum;
		// }
	} catch (ex) {
		console.log(ex);
		throw new MoleculerError("NOT FIND PRODUCT", 404, "NOT_FOUND", {data:ex.message});
	}
};

exports.filterQuery = (ctx) => {
	const params = omitBy(ctx.params, isNil);
	const includeRestrictedFields = ctx.authInfo.accessLevel === "Staff";
	params.fields = Product.includeFields(includeRestrictedFields);
	params.is_include = includeRestrictedFields;
	ctx.query = params;
};

/**
 * Load params
 */
exports.prepareParams = async (ctx) => {
	try {
		const params = Product.filterParams(ctx.params);
		// params.created_by = pick(req.user, ["id", "name"]);
		if (params.attributes) {
			params.attributes = params.attributes.map(a => Product.filterFieldParams("ATTRIBUTE", a));
		}
		if (params.variations) {
			params.variations = params.variations.map(v => Product.filterFieldParams("VARIATION", v));
		}
		if (params.categories) {
			params.categories = params.categories.map(c => Product.filterFieldParams("CATEGORY", c));
		}
		if (params.units) {
			params.units = params.units.map(u => Product.filterFieldParams("UNIT", u));
		}
		if (params.parts) {
			params.parts = await productAdapter.parseParts(ctx,params.parts);
		}
		// console.log(params.product);
		if (params.products) {
			
			params.products = await productAdapter.parseOptions(ctx,params);
		}
		// console.log(params.product);
		ctx.params = productAdapter.parseData(params);
		// return next();
	} catch (ex) {
		throw new MoleculerError("SOME THING HAPPEND", 400, "NOT_FOUND", ex);
	}
};

/**
 * Load params
 */
exports.prepareUpdate = async (ctx) => {
	try {
		const { product } = ctx.locals;
		const params = Product.filterParams(ctx.params);
		const dataChanged = Product.getChangedProperties({
			oldModel: product, newModel: params
		});
		const paramChanged = pick(
			params, dataChanged
		);
		// paramChanged.updated_by = pick(
		// 	ctx.user, ["id", "name"]
		// );
		if (paramChanged.attributes) {
			paramChanged.attributes = paramChanged.attributes.map(a => Product.filterFieldParams("ATTRIBUTE", a));
		}
		if (paramChanged.variations) {
			paramChanged.variations = paramChanged.variations.map(v => Product.filterFieldParams("VARIATION", v));
		}
		if (paramChanged.categories) {
			paramChanged.categories = paramChanged.categories.map(c => Product.filterFieldParams("CATEGORY", c));
		}
		if (paramChanged.units) {
			paramChanged.units = paramChanged.units.map(u => Product.filterFieldParams("UNIT", u));
		}
		if (paramChanged.parts) {
			paramChanged.parts = await productAdapter.parseParts(paramChanged.parts);
		}
		if (paramChanged.brand) {
			paramChanged.brand = Product.filterFieldParams("BRAND", paramChanged.brand);
		}
		ctx.params = productAdapter.parseData(
			Object.assign(pick(product, ["sku", "name", "products"]), paramChanged)
		);
	} catch (error) {
		throw new MoleculerError("NOT FIND PRODUCT", 404, "NOT_FOUND", error);
	}
};
