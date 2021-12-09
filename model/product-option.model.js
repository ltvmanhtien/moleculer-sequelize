const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const Stock =require("./stock.model");
const  moment =require("moment-timezone");

class ProductOptionModel extends Model { }

/**
 * Converter
 * @param {*} str
 */
ProductOptionModel.convertToEn=(str) =>{
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
};
const PUBLIC_FIELDS = [
	"sku",
	"name",
	"units",
	"images",
	"barcode",
	"options",
	"indexes",
	"parent_id",
	"is_default",
	"option_name",
	"price_books",
	"original_price",
	"normal_price",
	"price",

	// filter
	"name_path",
	"category_path",
	"attribute_path",
	"price_book_path",
	"normalize_name",
	"normalize_category",
	"normalize_attribute",
	"normalize_variation",
];

const ProductOption={
	name:"product_options",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		sku: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		type: {
			type: DataTypes.STRING(10),
			defaultValue: "item"
		},
		unit: {
			type: DataTypes.STRING(20),
			defaultValue: null
		},
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		brand: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		units: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		images: {
			type: DataTypes.ARRAY(DataTypes.STRING(255)),
			defaultValue: []
		},
		barcode: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		parent_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		options: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		indexes: {
			type: DataTypes.ARRAY(DataTypes.INTEGER),
			defaultValue: []
		},
		status: {
			type: DataTypes.STRING(10),
			defaultValue: "active"
		},
		status_name: {
			type: DataTypes.STRING(50),
			defaultValue: "Đang hoạt động"
		},
		option_name: {
			type: DataTypes.STRING(155),
			defaultValue: "Mặc định"
		},
		price_books: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		original_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		normal_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		discount: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name | rate | value
		},
		price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		stock:{
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		// filter
		name_path: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		category_path: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		attribute_path: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		price_book_path: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		normalize_name: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_category: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_attribute: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_variation: {
			type: DataTypes.TEXT,
			defaultValue: null
		},

		// metric
		view_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		order_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		return_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		rating_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		rating_average: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		favourite_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},

		// manager
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_default: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_warning: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		purchased_at: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		created_by: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		updated_by: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: () => new Date()
		},
		updatedAt:{
			type: DataTypes.DATE,
			defaultValue: () => new Date()
		}
    
	},
	options: {
		// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
	},
	Events : {
		// BANNER_CREATED: `${serviceName}.banner.created`,
		// BANNER_UPDATED: `${serviceName}.banner.updated`,
		// BANNER_DELETED: `${serviceName}.banner.deleted`,
	},



	/**
 * Load query
 * @param {*} params
 */
	filterConditions:(params)=> {
		const options = omitBy(params, isNil);
		options.is_active = true;

		if (options.skus) {
			options.sku = { [Op.in]: options.skus.split(",") };
		}
		delete options.skus;

		if (options.types) {
			options.type = { [Op.in]: options.types.split(",") };
		}
		delete options.types;

		if (options.statuses) {
			options.status = { [Op.in]: options.statuses.split(",") };
		}
		delete options.statuses;

		if (options.attributes) {
			options.attribute_path = { [Op.contains]: options.attributes.split(",") };
		}
		delete options.attributes;

		if (options.categories) {
			options.category_path = { [Op.overlap]: options.categories.split(",") };
		}
		delete options.categories;

		if (options.price_books) {
			options.price_book_path = { [Op.overlap]: options.price_books.split(",") };
		}
		delete options.price_books;

		if (options.product_sku) {
			options.sku = { [Op.iLike]: `%${options.product_sku}%` };
		}
		delete options.product_sku;

		if (options.product_name) {
			const name = ProductOptionModel.convertToEn(options.product_name);
			options.name_path = { [Op.contains]: name.split(" ") };
		}
		delete options.product_name;

		if (options.keyword) {
			const name = ProductOptionModel.convertToEn(options.keyword);
			const data = name.split(" ");
			const operations = [];
			data.forEach(value => {
				operations.push({
					normalize_name: { [Op.iLike]: `%${value}%` }
				});
			});
			options[Op.and] = operations;
		}
		delete options.keyword;

		if (options.child_id) {
			options.id = options.child_id;
		}
		delete options.child_id;

		return options;
	},

	/**
 * Load sort query
 * @param {*} sort_by
 * @param {*} order_by
 */
	sortConditions:({ sort_by, order_by })=> {
		let sort = null;
		switch (sort_by) {
			case "created_at":
				sort = ["created_at", order_by];
				break;
			case "updated_at":
				sort = ["updated_at", order_by];
				break;
			case "view_count":
				sort = ["view_count", order_by];
				break;
			case "order_count":
				sort = ["order_count", order_by];
				break;
			case "return_count":
				sort = ["return_count", order_by];
				break;
			case "rating_count":
				sort = ["rating_count", order_by];
				break;
			case "rating_average":
				sort = ["rating_average", order_by];
				break;
			case "favourite_count":
				sort = ["favourite_count", order_by];
				break;
			case "position":
				sort = ["position", order_by];
				break;
			case "price":
				sort = ["price", order_by];
				break;
			case "name":
				sort = ["name", order_by];
				break;
			case "sku":
				sort = ["sku", order_by];
				break;
			default: sort = ["created_at", "DESC"];
				break;
		}
		return sort;
	},

	/**
 * Transform postgres model to expose object
 */
	transform : (params) => {
		const transformed = {};
		const fields = [
			"id",
			"sku",
			"unit",
			"type",
			"name",
			"brand",
			"units",
			"images",
			"barcode",
			"stocks",
			"options",
			"indexes",
			"parent_id",
			"is_default",
			"option_name",
			"price_books",
			"original_price",
			"normal_price",
			"discount",
			"price",
		];
		fields.forEach((field) => {
			if (params[field] && field === "stocks") {
				transformed[field] = params[field].map(p => Stock.transform(p));
			} else {
				transformed[field] = params[field];
			}
		});

		// pipe decimal
		const decimalFields = [
			"original_price",
			"normal_price",
			"price"
		];
		decimalFields.forEach((field) => {
			transformed[field] = parseInt(params[field], 0);
		});

		// pipe date
		const dateFields = [
			"purchased_at",
			"created_at",
			"updated_at"
		];
		dateFields.forEach((field) => {
			transformed[field] = moment(params[field]).unix();
		});

		return transformed;
	},

	/**
 * Get all changed properties
 */
	getChangedProperties : ({ newModel, oldModel }) => {
		const changedProperties = [];
		const allChangableProperties = [
			"sku",
			"name",
			"units",
			"images",
			"barcode",
			"option_name",
			"price_books",
			"original_price",
			"normal_price",
			"price"
		];
		if (!oldModel) {
			return allChangableProperties;
		}

		allChangableProperties.forEach((field) => {
			if (
				!isUndefined(newModel[field]) &&
            !isEqual(newModel[field], oldModel[field])
			) {
				changedProperties.push(field);
			}
		});

		return changedProperties;
	},
	filterParams : (params) => pick(params, PUBLIC_FIELDS),
};
module.exports=ProductOption;