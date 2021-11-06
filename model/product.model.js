const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,includes,isEqual} =require("lodash");
const  moment =require("moment-timezone");
const ProductOption =require("./product-option.model");
const Stock =require("./stock.model");
class ProductModel extends Model { }


ProductModel.Types = {
	ITEM: "item", // hàng hoá
	PART: "part", // nguyên liệu thô
	COMBO: "combo", // combo đóng gói
	SERVICE: "service", // dịch vụ
};

ProductModel.Statuses = {
	ACTIVE: "active",
	INACTIVE: "inactive"
};

ProductModel.NameStatuses = {
	ACTIVE: "Đang hoạt động",
	INACTIVE: "Ngừng hoạt động"
};
ProductModel.convertToEn=(str) =>{
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
/**
* Check min or max in condition
* @param {*} options
* @param {*} field
* @param {*} type
*/
ProductModel.checkMinMaxOfConditionFields=(options, field, type = "Number")=> {
	let _min = null;
	let _max = null;

	// Transform min max
	if (type === "Date") {
		_min = new Date(options[`min_${field}`]);
		_min.setHours(0, 0, 0, 0);

		_max = new Date(options[`max_${field}`]);
		_max.setHours(23, 59, 59, 999);
	} else {
		_min = parseFloat(options[`min_${field}`]);
		_max = parseFloat(options[`max_${field}`]);
	}

	// Transform condition
	if (
		!isNil(options[`min_${field}`]) ||
	!isNil(options[`max_${field}`])
	) {
		if (
			options[`min_${field}`] &&
		!options[`max_${field}`]
		) {
			options[field] = {
				[Op.gte]: _min
			};
		} else if (
			!options[`min_${field}`] &&
		options[`max_${field}`]
		) {
			options[field] = {
				[Op.lte]: _max
			};
		} else {
			options[field] = {
				[Op.gte]: _min || 0,
				[Op.lte]: _max || 0
			};
		}
	}

	// Remove first condition
	delete options[`max_${field}`];
	delete options[`min_${field}`];
};
ProductModel.sortConditions=({ sort_by, order_by })=> {
	let sort = null;
	switch (sort_by) {
		case "created_at":
			sort = ["created_at", order_by];
			break;
		case "updated_at":
			sort = ["updated_at", order_by];
			break;
		case "total_quantity":
			sort = [{ model: Stock, as: "stocks" }, "total_quantity", order_by];
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
};
ProductModel.filterConditions=(params) =>{
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

	if (options.suppliers) {
		options.supplier_path = { [Op.overlap]: options.suppliers.split(",") };
	}
	delete options.suppliers;

	if (options.variations) {
		options.variation_path = { [Op.overlap]: options.variations.split(",") };
	}
	delete options.variations;

	if (options.attributes) {
		options.attribute_path = { [Op.contains]: options.attributes.split(",") };
	}
	delete options.attributes;

	if (options.categories) {
		options.category_path = { [Op.overlap]: options.categories.split(",") };
	}
	delete options.categories;

	if (options.description) {
		options.description = { [Op.iLike]: `%${options.description}%` };
	}

	if (options.note) {
		options.note = { [Op.iLike]: `%${options.note}%` };
	}

	if (options.keyword) {
		const name = this.convertToEn(options.keyword);
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

	if (options.discount_id) {
		options["discount.id"] = options.discount_id;
	}
	delete options.discount_id;

	if (options.is_has_discount) {
		options.discount = { [Op.ne]: null };
	}
	delete options.is_has_discount;

	// Min Max Filter
	ProductModel.checkMinMaxOfConditionFields(options, "price", "Number");
	ProductModel.checkMinMaxOfConditionFields(options, "created_at", "Date");

	return options;
};
ProductModel.filterStockConditions=(params)=> {
	const options = omitBy(params, isNil);

	if (params.stock_value === 0) {
		options.is_active = true;
	}

	if (params.stock_value === 1) {
		options.total_quantity = {
			[Op.lt]: { [Op.col]: "product.stock_min" }
		};
	}

	if (params.stock_value === 2) {
		options.total_quantity = {
			[Op.gt]: { [Op.col]: "product.stock_max" }
		};
	}

	if (params.stock_value === 3) {
		options.total_quantity = {
			[Op.gt]: 0
		};
	}

	if (params.stock_value === 4) {
		options.total_quantity = {
			[Op.lte]: 0
		};
	}

	if (params.stock_id) {
		options.store_id = params.stock_id;
	}
	delete options.stock_id;
	delete options.stock_value;

	return options;
};

const PUBLIC_FIELDS = [
	"sku",
	"slug",
	"type",
	"name",
	"brand",
	"barcode",
	"hashtag",
	"document",
	"position",
	"description",
	"thumbnail_url",
	"short_name",
	"video_url",

	// stock
	"unit",
	"weight",
	"stock_min",
	"stock_max",
	"stock_address",
	"original_price",
	"normal_price",
	"discount",
	"price",

	// extra
	"variations",
	"attributes",
	"categories",
	"products",
	"units",
	"parts",

	// seo
	"meta_url",
	"meta_title",
	"meta_image",
	"meta_keyword",
	"meta_description",

	// config
	"is_visible",
	"is_top_hot"
];


const EXCLUDE_FIELDS = [
	// stock
	"unit",
	"weight",
	"stock_min",
	"stock_max",
	"stock_address",
	"original_price",

	// attribute
	"document",
	"description",
	"variations",
	"attributes",
	"categories",
	"units",
	"parts",
];

const LIST_PUBLIC_FIELDS = [
	"id",
	"sku",
	"slug",
	"type",
	"name",
	"brand",
	"barcode",
	"hashtag",
	"position",
	"status",
	"status_name",
	"thumbnail_url",
	"short_name",
	"video_url",

	// stock
	"unit",
	"weight",
	"stock_min",
	"stock_max",
	"stock_address",
	"original_price",
	"normal_price",
	"discount",
	"price",

	// attribute
	"variations",
	"attributes",
	"categories",
	"units",
	"parts",

	// metric
	"view_count",
	"order_count",
	"return_count",
	"rating_count",
	"rating_average",
	"comment_count",
	"favourite_count",

	// manager
	"is_active",
	"is_warning",
	"is_top_hot",
	"is_visible",
	"created_at",
	"created_by",
	"updated_at",
	"updated_by"
];

const BRAND_FIELDS = [
	"id",
	"name",
	"slug"
];

const UNIT_FIELDS = [
	"name",
	"quantity",
	"original_price"
];

const PART_FIELDS = [
	"id",
	"name",
	"price",
	"options",
	"option_id",
	"normal_price",
	"original_price",
	"thumbnail_url"
];

const CATEGORY_FIELDS = [
	"id",
	"name",
	"slug"
];

const VARIATION_FIELDS = [
	"name",
	"values"
];

const ATTRIBUTE_FIELDS = [
	"id",
	"name",
	"value"
];

const DISCOUNT_FIELDS = [
	"id",
	"name",
	"rate",
	"value"
];
const Product={
	name:"tbl_products",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		sku: {
			type: DataTypes.STRING(50),
			unique: true,
			allowNull: false
		},
		slug: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		type: {
			type: DataTypes.STRING(10),
			values: values(ProductModel.Types),
			defaultValue: ProductModel.Types.ITEM
		},
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		brand: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		barcode: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		hashtag: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: []
		},
		document: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		position: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
		description: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		video_url: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		short_name: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		thumbnail_url: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		unit: {
			type: DataTypes.STRING(20),
			defaultValue: null
		},
		weight: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		stock_min: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		stock_max: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		stock_address: {
			type: DataTypes.STRING(255),
			defaultValue: ""
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
			defaultValue: null
		},
		price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},

		// extra
		status: {
			type: DataTypes.STRING(10),
			values: values(ProductModel.Statuses),
			defaultValue: ProductModel.Statuses.ACTIVE
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(ProductModel.NameStatuses),
			defaultValue: ProductModel.NameStatuses.ACTIVE
		},
		suppliers: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		variations: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		attributes: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		categories: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		units: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		parts: {
			type: DataTypes.JSONB,
			defaultValue: []
		},

		// seo
		meta_url: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_title: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_image: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_keyword: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_description: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},

		// filter
		name_path: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		supplier_path: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		category_path: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		attribute_path: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		variation_path: {
			type: DataTypes.ARRAY(DataTypes.TEXT),
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
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		comment_count: {
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
		is_warning: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_top_hot: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_visible: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		ip_address: {
			type: DataTypes.STRING(12),
			defaultValue: "unkown"
		},
		device_id: {
			type: DataTypes.STRING(255),
			defaultValue: "unkown"
		},
		purchased_at: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		
		created_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		
		updated_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
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
	convertToEn:ProductModel.convertToEn,
	checkMinMaxOfConditionFields:ProductModel.checkMinMaxOfConditionFields,
	sortConditions:ProductModel.sortConditions,
	filterConditions:ProductModel.filterConditions,
	filterStockConditions:ProductModel.filterStockConditions,
	transform : (params, includeRestrictedFields = true) => {
		const transformed = {};
		const fields = [
			"id",
			"sku",
			"slug",
			"type",
			"name",
			"brand",
			"price",
			"weight",
			"barcode",
			"hashtag",
			"discount",
			"position",
			"video_url",
			"short_name",
			"normal_price",
			"thumbnail_url",
			"description",
			"document",
	
			// attribute
			"variations",
			"attributes",
			"categories",
			"products",
			"stocks",
			"parts",
	
			// seo
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description",
	
			// metric
			"view_count",
			"order_count",
			"return_count",
			"rating_count",
			"rating_average",
			"comment_count",
			"favourite_count",
	
			// config
			"is_visible",
			"is_top_hot",
	
			// manager
			"purchased_at",
			"created_by",
			"created_at",
			"updated_at",
			"updated_by"
		];
		if (includeRestrictedFields) {
			const privateFields = [
				// stock
				"unit",
				"stock_min",
				"stock_max",
				"stock_address",
				"original_price",
				"suppliers",
				"units",
	
				// info
				"status_name",
				"status"
			];
			fields.push(...privateFields);
		}
		fields.forEach((field) => {
			if (params[field] && field === "products") {
				transformed[field] = params[field].map(p => ProductOption.transform(p));
			} else if (params[field] && field === "stocks") {
				transformed[field] = params[field].map(p => Stock.transform(p));
			} else {
				transformed[field] = params[field];
			}
		});
	
		// pipe decimal
		const decimalFields = [
			"stock_min",
			"stock_max",
			"original_price",
			"normal_price",
			"price",
		];
		decimalFields.forEach((field) => {
			if (params[field]) {
				transformed[field] = parseInt(params[field], 0);
			} else {
				transformed[field] = 0;
			}
		});
	
		// pipe date
		const dateFields = [
			"purchased_at",
			"created_at",
			"updated_at"
		];
		dateFields.forEach((field) => {
			if (params[field]) {
				transformed[field] = moment(params[field]).unix();
			} else {
				transformed[field] = null;
			}
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
			"slug",
			"type",
			"name",
			"brand",
			"barcode",
			"hashtag",
			"document",
			"position",
			"description",
			"video_url",
			"short_name",
			"thumbnail_url",
			"original_price",
			"normal_price",
			"price",
	
			// seo
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description",
	
			// properties
			"variations",
			"attributes",
			"categories",
			"units",
			"parts",
	
			// config
			"is_top_hot",
			"is_visible",
	
			// stock
			"unit",
			"weight",
			"stock_min",
			"stock_max",
			"stock_address",
		];
		if (!oldModel) {
			return allChangableProperties;
		}
	
		allChangableProperties.forEach((field) => {
			if (!isEqual(newModel[field], oldModel[field])) {
				changedProperties.push(field);
			}
		});
	
		return changedProperties;
	},
	/**
 * List
 *
 * @param {number} skip - Number of records to be skipped.
 * @param {number} limit - Limit number of records to be returned.
 * @returns {Promise<Store[]>}
 */
	list : async ({
		skus,
		types,
		fields,
		statuses,
		suppliers,
		variations,
		attributes,
		categories,
		is_include,
		is_visible,
		is_top_hot,
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

		// sort condition
		skip = 0,
		limit = 20,
		order_by = "desc",
		sort_by = "created_at",
	}) => {
		const options = this.filterConditions({
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
		const sorts = this.sortConditions({
			sort_by,
			order_by
		});
		const stockOptions = this.filterStockConditions({
			stock_value,
			stock_id
		});
		return Product.findAll({
			where: options,
			include: is_include
				? [
					{
						model: ProductOption,
						where: { is_active: true },
						required: true,
						as: "products"
					},
					{
						model: Stock,
						as: "stocks",
						where: stockOptions,
						required: !isNil(stock_value)
					}
				]
				: null,
			attributes: fields,
			order: [sorts],
			offset: skip,
			limit: limit
		});
	},

	filterParams : (params) => pick(params, PUBLIC_FIELDS),

	/**
 * Include only allowed fields from product
 *
 * @param {Boolean} includeRestrictedFields
 */
	includeFields : (includeRestrictedFields = true) => {
		let params = LIST_PUBLIC_FIELDS;
		if (!includeRestrictedFields) {
			params = params.filter(
				field => !includes(EXCLUDE_FIELDS, field)
			);
		}
		return params;
	},

	/**
 * Filter only allowed fields from collum
 *
 * @param {String} collum
 * @param {Object} params
 */
	filterFieldParams : (collum, params) => {
		if (collum === "VARIATION") {
			return pick(params, VARIATION_FIELDS);
		}
		if (collum === "ATTRIBUTE") {
			return pick(params, ATTRIBUTE_FIELDS);
		}
		if (collum === "CATEGORY") {
			return pick(params, CATEGORY_FIELDS);
		}
		if (collum === "DISCOUNT") {
			return pick(params, DISCOUNT_FIELDS);
		}
		if (collum === "BRAND") {
			return pick(params, BRAND_FIELDS);
		}
		if (collum === "UNIT") {
			return pick(params, UNIT_FIELDS);
		}
		if (collum === "PART") {
			return pick(params, PART_FIELDS);
		}
		return null;
	}
};
module.exports=Product;