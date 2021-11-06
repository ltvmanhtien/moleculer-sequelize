/* eslint-disable no-param-reassign */
const  { cloneDeep, isNil } =require("lodash");
const { MoleculerError } = require("moleculer").Errors;
// Models
const Product =require("../model/product.model");
//import ProductPrice from '../model/product-price.model';
const  ProductOption =require("../model/product-option.model");
const serviceName =require("../utils/service-name");

/**
 * Converter
 * @param {*} str
 */
function convertToEn(str) {
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/đ/g, "d");
	str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
	str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
	str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
	str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
	str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
	str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
	str = str.replace(/Đ/g, "D");
	str = str.toLowerCase();
	return str;
}

/**
 * Get Part
 * @param {*} part
 */
async function getPart(ctx,part) {
	const returnPart = {
		id: part.id,
		sku: null,
		type: null,
		name: null,
		unit: null,
		brand: null,
		price: 0,
		normal_price: 0,
		original_price: 0,
		options: part.options,
		option_id: part.option_id,
		thumbnail_url: null,
	};
	const product = await ctx.call(`${serviceName.Product}.get`,{id:part.id});
	returnPart.sku = product.sku;
	returnPart.type = product.type;
	returnPart.name = product.name;
	returnPart.unit = product.unit;
	returnPart.price = product.price;
	returnPart.normal_price = product.normal_price;
	returnPart.original_price = product.original_price;
	returnPart.thumbnail_url = product.thumbnail_url;
	return returnPart;
}

function parseParts(ctx,parts) {
	const promise = parts.map((part)=>getPart(ctx,part));
	return Promise.all(promise);
}

/**
 * Get Option
 * @param {*} option
 */
async function getOption(ctx,option) {
	// Trasnform data
	const data = ProductOption.filterParams(option);
	data.normalize_name = convertToEn(`${data.name} - ${data.sku}`);
	data.name_path = data.name.split(" ");

	// Check duplicate
	if (data && data.sku) {
		console.log(option);
		let result =await ctx.call(`${serviceName.ProductOption}.checkDuplicateSku`,{
			id: option.id,
			sku: option.sku,
		});
		if(result){
			throw new MoleculerError("Sku have adready exist", 400, "NOT_FOUND", {data:"Sku have already exist"});	
		}
	}

	return data;
}

function parseOptions(ctx,data) {

	let operations = [];
	if (data.products && data.products.length) {
		const promise = data.products.map((el)=>getOption(ctx,el));
		operations = Promise.all(promise);
	} else {
		operations = [
			{
				sku: data.sku,
				name: data.name,
				images: [],
				barcode: data.barcode,
				indexes: [],
				option_name: "DEFAULT",
				name_path: data.name.split(" "),
				price: data.price,
				normal_price: data.normal_price,
				original_price: data.original_price,
				// price_book_path: [`${ProductPrice.DefaultValues.id}`],
				normalize_name: convertToEn(`${data.name} - ${data.sku}`),
				// price_books: [Object.assign(ProductPrice.DefaultValues, { price: data.price, normal_price: data.normal_price })]
			}
		];
	}
	return operations;
}

function parseData(data) {
	const params = cloneDeep(
		data
	);
	if (!isNil(data.name)) {
		params.name_path = data.name.split(" ");
		params.normalize_name = convertToEn(`${data.name} - ${data.sku}`);
		params.slug = convertToEn(`${data.name.split(" ").join("-")}-i.${data.sku}`);
	}
	if (!isNil(data.categories)) {
		params.category_path = data.categories.map(c => c.id);
		params.normalize_category = params.category_path.join(",");
	}
	if (!isNil(data.attributes)) {
		const attributePath = [];
		data.attributes.forEach(a => attributePath.push(`${a.id}:${a.value.id}`));
		params.normalize_attribute = attributePath.join(",");
		params.attribute_path = attributePath;
	}
	if (!isNil(data.variations)) {
		const variationPath = [];
		data.variations.forEach(v => v.values.map(value => variationPath.push(value)));
		params.normalize_variation = variationPath.join(",");
		params.variation_path = variationPath;
	}
	if (!isNil(data.products)) {
		data.products.forEach(item => {
			params.normalize_name += `- ${item.sku}:${item.option_name}`;
		});
	}
	return params;
}

module.exports ={
	parseData,
	parseParts,
	parseOptions
};
