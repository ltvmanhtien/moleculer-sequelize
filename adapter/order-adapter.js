const serviceName = require("../utils/service-name");

const Product =require("../model/product.model");
const ProductOption =require("../model/product-option.model");


async function getItem(ctx,item) {
	const returnOption = {
		id: item.id,
		type: null,
		sku: null,
		name: null,
		note: null,
		unit: null,
		brand: null,
		thumbnail_url: null,
		categories: null,
		product_parts: [],
		discount: item.discount,
		option_id: item.option_id,
		option_name: null,
		weight: 0,
		price: 0,
		normal_price: 0,
		original_price: 0,
		total_price: 0,
		total_original_price: 0,
		total_price_before_discount: 0,
		total_discount_value: 0,
		total_quantity: item.total_quantity,
		total_return_quantity: 0
	};
	if (item.option_id) {
		
		const product =await ctx.call(`${serviceName.ProductOption}.get`,{id:item.option_id});
		console.log("productaaa",product);
		returnOption.sku = product.sku;
		returnOption.name = product.name;
		returnOption.note = product.note || item.note;
		returnOption.option_name = product.option_name;
		returnOption.price = Math.ceil(item.price || product.price);
		returnOption.normal_price = Math.ceil(product.normal_price);
		returnOption.original_price = Math.ceil(product.original_price);
	}
	if (item.id) {
		
		const product =await ctx.call(`${serviceName.Product}.get`,{id:item.id});
		console.log("product",product);
		returnOption.type = product.type;
		returnOption.unit = product.unit;
		returnOption.weight = +product.weight;
		returnOption.brand = product.brand;
		returnOption.categories = product.categories;
		returnOption.thumbnail_url = product.thumbnail_url;

		if (
			product.parts &&
            product.parts.length &&
            returnOption.type === Product.Types.COMBO
		) {
			product.parts.forEach(part => {
				const option = part.options.find(
					o => o.name === returnOption.option_name
				);
				returnOption.product_parts.push({
					id: part.id,
					type: Product.Types.PART,
					name: part.name,
					option_id: part.option_id,
					product_id: returnOption.id,
					product_option_id: returnOption.option_id,
					product_price: part.price,
					product_normal_price: part.normal_price,
					product_original_price: part.original_price,
					total_quantity: Math.ceil(option.quantity * returnOption.total_quantity),
					total_price: Math.ceil(part.price * (option.quantity * returnOption.total_quantity)) || 0
				});
			});
		}
		if (
			returnOption.type === Product.Types.ITEM ||
            returnOption.type === Product.Types.COMBO
		) {
			returnOption.product_parts.push({
				id: returnOption.id,
				type: returnOption.type,
				name: returnOption.name,
				option_id: returnOption.option_id,
				product_id: returnOption.id,
				product_option_id: returnOption.option_id,
				product_price: returnOption.price,
				product_normal_price: returnOption.normal_price,
				product_original_price: returnOption.original_price,
				total_quantity: returnOption.total_quantity,
				total_price: returnOption.total_price
			});
		}
	}
	if (item.discount && item.discount.value) {
		returnOption.price = Math.ceil(
			returnOption.normal_price - item.discount.value
		);
	}
	returnOption.total_price = Math.ceil(
		item.total_quantity * returnOption.price
	);
	returnOption.total_original_price = Math.ceil(
		item.total_quantity * returnOption.original_price
	);
	returnOption.total_price_before_discount = Math.ceil(
		item.total_quantity * returnOption.normal_price
	);
	returnOption.total_discount_value = Math.ceil(
		returnOption.total_price_before_discount - returnOption.total_price
	);
	return returnOption;
}

/**
 * Parse item to import item
 * @param {*} items
 */
async function parseItems(ctx,items) {
	const promises = items.map((item)=>getItem(ctx,item));
	return Promise.all(promises);
}


/**
 * Calculate amount
 * @param {*} data
 */
async function calTotalPrice(data) {
	const returnAmount = {
		total_quantity: 0,
		total_point: 0,
		total_price_before_discount: 0,
		total_price_after_discount: 0,
		total_discount_value: 0,
		total_original_price: 0,
		total_price: 0,
		total_paid: 0,
		total_unpaid: 0
	};
	if (data.products && data.products.length) {
		data.products.forEach((product) => {
			returnAmount.total_quantity += Math.ceil(product.total_quantity);
			returnAmount.total_price_after_discount += Math.ceil(product.total_price);
			returnAmount.total_original_price += Math.ceil(product.total_original_price);
			returnAmount.total_price_before_discount += Math.ceil(product.total_price);
		});
	}
	if (data.discounts && data.discounts.length) {
		data.discounts.forEach((discount) => {
			// percent discount
			if (discount.type === 1) {
				returnAmount.total_price_after_discount *= [(100 - discount.value) / 100];
			}

			// cash discount
			if (discount.type === 2) {
				returnAmount.total_price_after_discount -= discount.value;
			}
		});
	}
	if (data.payments && data.payments.length) {
		data.payments.forEach((payment) => {
			returnAmount.total_paid += payment.value;
		});
	}
	// calculate loyalty = 3%
	if (
		data.type === "retail" &&
        data.customer.type === "individual"
	) {
		returnAmount.total_point = parseInt(
			returnAmount.total_price_after_discount * (1 / 100), 0
		);
	}
	returnAmount.total_discount_value = Math.ceil(
		returnAmount.total_price_before_discount - returnAmount.total_price_after_discount
	);
	returnAmount.total_price_after_discount = Math.ceil(
		returnAmount.total_price_after_discount + data.total_shipping_fee
	);
	if (data.type === "return") {
		returnAmount.total_price_after_discount = data.total_return_fee < returnAmount.total_price_after_discount
			? Math.ceil(returnAmount.total_price_after_discount - data.total_return_fee)
			: 0;
	}
	returnAmount.total_price = data.total_exchange_price < returnAmount.total_price_after_discount
		? Math.ceil(returnAmount.total_price_after_discount - data.total_exchange_price)
		: 0;
	returnAmount.total_unpaid = returnAmount.total_price >= returnAmount.total_paid
		? returnAmount.total_price - returnAmount.total_paid
		: 0;
	return returnAmount;
}


module.exports ={
	parseItems,
	calTotalPrice
};