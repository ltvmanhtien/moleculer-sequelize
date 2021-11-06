/* eslint-disable no-param-reassign */
const { cloneDeep, isNil } =require("lodash");
const  ProductPrice =require("../model/product-price.model");

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

function parseData(data) {
	const params = cloneDeep(data);

	if (!data.price_books) {
		params.price_book_path = [
			`${ProductPrice.DefaultValues.id}`
		];
		params.price_books = [
			Object.assign(
				ProductPrice.DefaultValues,
				{ price: params.price, normal_price: params.price }
			)
		];
	}

	if (data.price_books && data.price_books.length) {
		const indexOf = params.price_books.findIndex((i) => i.id === 1);
		if (indexOf !== -1) params.price_books[indexOf].price = params.params.price;
	}

	if (!isNil(params.name)) {
		params.name_path = params.name.split(" ");
		params.normalize_name = convertToEn(`${params.name} - ${params.sku}`);
	}

	return params;
}

module.exports ={
	parseData
};
