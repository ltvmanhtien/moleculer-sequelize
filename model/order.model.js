const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class OrderModel extends Model {}

const PUBLIC_FIELDS = [
	"type",
	"note",
	"store",
	"source",
	"status",
	"order",
	"return",
	"invoice",
	"customer",
	"hashtag",
	"channel",
	"payment",
	"shipping",
	"price_book",
	"discounts",
	"payments",
	"deliveries",
	"products",
	"total_coin",
	"total_point",
	"total_quantity",
	"total_price_after_discount",
	"total_price_before_discount",
	"total_discount_value",
	"total_exchange_price",
	"total_original_price",
	"total_shipping_fee",
	"total_return_fee",
	"total_price",
	"total_paid",
	"total_unpaid",
	"is_delivery",
	"is_payment"
];

OrderModel.PRODUCT_FIELDS = [
	"id",
	"type",
	"sku",
	"name",
	"unit",
	"brand",
	"note",
	"option_id",
	"categories",
	"product_parts",
	"product_options", // topping | option (sugar, ice)
	"original_price",
	"normal_price",
	"price",
	"total_price",
	"total_quantity",
	"total_return_quantity",
	"total_option_price",
	"total_original_price",
	"total_price_before_discount"
];

OrderModel.CUSTOMER_FIELDS = [
	"id",
	"name",
	"type",
	"note",
	"phone",
	"address"
];

OrderModel.STORE_FIELDS = [
	"id",
	"name",
	"phone",
	"address"
];

OrderModel.CHANNEL_FIELDS = [
	"id",
	"name"
];

OrderModel.DISCOUNT_FIELDS = [
	"id", // mã khuyến mại
	"name", // tên khuyến mại
	"group", // nhóm khuyến mại: rank, copoun ..etc
	"type", // phương thức khuyến mại: 1 = % | 2 = tiền mặt
	"value", // giá trị khuyến mại => vnd
];

OrderModel.PAYMENT_FIELDS = [
	"name", // tên phương thức
	"method", // phương thức thanh toán
];

OrderModel.SHIPPING_FIELDS = [
	"name", // tên phương thức
	"method", // phương thức giao hàng
	"address", // địa chỉ giao hàng
];

OrderModel.PRICE_BOOK_FIELDS = [
	"id", // mã bảng giá
	"name", // tên bảng giá
];

OrderModel.Types = {
	ORDER: "order",
	RETURN: "return",
	RETAIL: "retail"
};

OrderModel.Sources = {
	WEB: "web",
	ERP: "erp",
	APP: "app"
};

OrderModel.Payments = {
	TIEN_MAT: 1,
	CHUYEN_KHOAN: 2,
	QUET_THE: 3,
	COD: 4
};

OrderModel.Deliveries = {
	GH_48H: 1,
	GH_2H: 3
};

OrderModel.Statuses = {
	DRAFT: "draft",
	PENDING: "pending",
	PROCESSING: "processing",
	CANCELLED: "cancelled",
	COMPLETED: "completed",
	FAILED: "failed"
};

OrderModel.StatusNames = {
	DRAFT: "Phiếu tạm",
	PENDING: "Chờ duyệt",
	PROCESSING: "Đang xử lý",
	CANCELLED: "Đã hủy",
	COMPLETED: "Đã hoàn thành",
	FAILED: "Không thành công"
};


/**
 * Check min or max in condition
 * @param {*} options
 * @param {*} field
 * @param {*} type
 */
function checkMinMaxOfConditionFields(options, field, type = "Number") {
	let _min = null;
	let _max = null;

	// Transform min max
	if (type === "Date") {
		_min = new Date(options[`min_${field}`]);
		_min.setHours(0, 0, 0, 0);

		_max = new Date(options[`max_${field}`]);
		_max.setHours(23, 59, 59, 999);
	} else if (type === "Time") {
		_min = new Date(options[`min_${field}`]);
		_min = _min.setHours(_min.getHours(), _min.getMinutes(), 0, 0);

		_max = new Date(options[`max_${field}`]);
		_max = _max.setHours(_max.getHours(), _max.getMinutes(), 59, 999);
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
}

/**
 * Load query
 * @param {*} params
 */
OrderModel.filterConditions=(params) =>{
	const options = omitBy(params, isNil);
	if (options.types) {
		options.type = {
			[Op.in]: options.types.split(",")
		};
	}
	delete options.types;

	if (options.stores) {
		options["store.id"] = {
			[Op.in]: options.stores.split(",")
		};
	}
	delete options.stores;

	if (options.staffs) {
		options["created_by.id"] = {
			[Op.in]: options.staffs.split(",")
		};
	}
	delete options.staffs;

	if (options.sources) {
		options.source = {
			[Op.in]: options.sources.split(",")
		};
	}
	delete options.sources;

	if (options.statuses) {
		options.status = {
			[Op.in]: options.statuses.split(",")
		};
	}
	delete options.statuses;

	if (options.channels) {
		options["channel.id"] = {
			[Op.in]: options.channels.split(",")
		};
	}
	delete options.channels;

	if (options.payment_methods) {
		options["payment.method"] = {
			[Op.in]: options.payment_methods.split(",")
		};
	}
	delete options.payment_methods;

	if (options.shipping_methods) {
		options["shipping.method"] = {
			[Op.in]: options.shipping_methods.split(",")
		};
	}
	delete options.shipping_methods;

	// fulltext search
	if (options.code) {
		options.code = {
			[Op.iLike]: `%${options.code}%`
		};
	}

	if (options.note) {
		options.note = {
			[Op.iLike]: `%${options.note}%`
		};
	}

	if (options.hashtag) {
		options.hashtag = {
			[Op.iLike]: `%${options.hashtag}%`
		};
	}

	// if (options.is_match === true) {
	// 	options.total_return_quantity = {
	// 		[Op.eq]: sequelize.col("total_quantity")
	// 	};
	// }

	// if (options.is_match === false) {
	// 	options.total_return_quantity = {
	// 		[Op.ne]: sequelize.col("total_quantity")
	// 	};
	// }
	// delete options.is_match;

	if (options.user_code) {
		options["customer.id"] = options.user_code;
	}
	delete options.user_code;

	if (options.order_id) {
		options.id = options.order_id;
	}
	delete options.order_id;

	if (options.order_code) {
		options.code = options.order_code;
	}
	delete options.order_code;

	if (options.product_sku) {
		options.normalize_product = {
			[Op.iLike]: `%${options.product_sku}%`
		};
	}
	delete options.product_sku;

	if (options.product_name) {
		options.normalize_product = {
			[Op.iLike]: `%${options.product_name}%`
		};
	}
	delete options.product_name;

	if (options.customer) {
		options[Op.or] = [
			{
				"customer.name": {
					[Op.iLike]: `%${options.customer}%`
				}
			},
			{
				"customer.phone": {
					[Op.iLike]: `%${options.customer}%`
				}
			}
		];
	}
	delete options.customer;

	if (options.receiver) {
		options[Op.or] = [
			{
				"shipping.address.name": {
					[Op.iLike]: `%${options.receiver}%`
				}
			},
			{
				"shipping.address.phone": {
					[Op.iLike]: `%${options.receiver}%`
				}
			}
		];
	}
	delete options.receiver;

	// date filters
	checkMinMaxOfConditionFields(
		options,
		"created_at",
		options.date_type || "Date"
	);
	delete options.date_type;

	return options;
};

/**
 * Load sort query
 * @param {*} sort_by
 * @param {*} order_by
 */
function sortConditions({ sort_by, order_by }) {
	let sort = null;
	switch (sort_by) {
		case "code":
			sort = ["code", order_by];
			break;
		case "note":
			sort = ["note", order_by];
			break;
		case "hashtag":
			sort = ["hashtag", order_by];
			break;
		case "created_at":
			sort = ["created_at", order_by];
			break;
		case "updated_at":
			sort = ["updated_at", order_by];
			break;
		case "total_price":
			sort = ["total_price", order_by];
			break;
		case "total_paid":
			sort = ["total_paid", order_by];
			break;
		case "total_unpaid":
			sort = ["total_unpaid", order_by];
			break;
		case "total_coin":
			sort = ["total_coin", order_by];
			break;
		case "total_point":
			sort = ["total_point", order_by];
			break;
		case "total_quantity":
			sort = ["total_quantity", order_by];
			break;
		case "total_price_after_discount":
			sort = ["total_price_after_discount", order_by];
			break;
		case "total_price_before_discount":
			sort = ["total_price_before_discount", order_by];
			break;
		case "total_discount_value":
			sort = ["total_discount_value", order_by];
			break;
		default: sort = ["id", "DESC"];
			break;
	}
	return sort;
}

/**
 * Load include field
 * @param {*} includes
 */
// function includeConditions(fields = []) {
// 	const operations = [];
// 	if (fields.find(f => f === "payments")) {
// 		operations.push({
// 			model: Payment,
// 			as: "payments",
// 			required: false
// 		});
// 	}
// 	if (fields.find(f => f === "deliveries")) {
// 		operations.push(
// 			{
// 				model: Delivery,
// 				as: "deliveries",
// 				required: false
// 			});
// 	}
// 	return operations;
// }

/**
 * Transform postgres model to expose object
 */
OrderModel.transform = (params, includeRestrictedFields = true) => {
	const transformed = {};
	const fields = [
		"id",
		"code",
		"type",
		"note",
		"status",
		"status_name",
		"channel",
		"payment",
		"shipping",
		"price_book",
		"discounts",
		"products",
		"payments",
		"deliveries",
		"is_delivery",
		"is_favorite",
		"is_warning",
		"created_by",
		"created_at",
		"updated_at",
		"updated_by",
		"confirmed_by",
		"confirmed_at",
		"completed_by",
		"completed_at",
		"cancelled_by",
		"cancelled_at"
	];

	if (includeRestrictedFields) {
		const privateFields = [
			"store",
			"order",
			"return",
			"invoice",
			"source",
			"hashtag",
			"customer"
		];
		fields.push(...privateFields);
	}

	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe decimal
	const decimalFields = [
		"total_coin",
		"total_point",
		"total_quantity",
		"total_return_quantity",
		"total_price_before_discount",
		"total_price_after_discount",
		"total_discount_value",
		"total_exchange_price",
		"total_original_price",
		"total_shipping_fee",
		"total_return_fee",
		"total_price",
		"total_paid",
		"total_unpaid"
	];
	decimalFields.forEach((field) => {
		transformed[field] = parseInt(params[field], 0);
	});

	// pipe date
	const dateFields = [
		"created_at",
		"updated_at",
		"confirmed_at",
		"completed_at",
		"cancelled_at"
	];
	dateFields.forEach((field) => {
		if (params[field]) {
			transformed[field] = moment(params[field]).unix();
		} else {
			transformed[field] = null;
		}
	});

	return transformed;
};

/**
 * Get all changed properties
 */
OrderModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		"note",
		"store",
		"hashtag",
		"is_warning",
		"is_favorite"
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
};

/**
 * Generate code
 *
 * @public
 */
OrderModel.generateCode = async (type) => {
	let idRule = "HD";
	switch (type) {
		case Order.Types.RETAIL: idRule = "HD"; break;
		case Order.Types.RETURN: idRule = "TH"; break;
		case Order.Types.ORDER: idRule = "DH"; break;
		default: idRule = "HD"; break;
	}
	const order = await Order.findOne({
		where: {
			type: type,
			code: { [Op.notILike]: "HDD_TH%" }
		},
		order: [
			["id", "desc"]
		]
	});
	if (order) {
		const code = order.code;
		const orderIndex = code.substring(2, code.length);
		const nextCode = parseInt(orderIndex, 10) + 1;
		const newCode = (`${idRule}0000000${nextCode}`).slice(-8);
		return `${idRule}${newCode}`;
	}
	return `${idRule}00000001`;
};

const Order={
	name:"tbl_orders",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		code: {
			type: DataTypes.STRING(24),
			defaultValue: null
		},
		type: {
			type: DataTypes.STRING(10),
			values: values(OrderModel.Types),
			defaultValue: OrderModel.Types.RETAIL
		},
		note: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		store: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		source: {
			type: DataTypes.STRING(50),
			values: values(OrderModel.Sources),
			defaultValue: OrderModel.Sources.ERP
		},
		order: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		return: {
			type: DataTypes.JSONB,
			defaultValue: null // total | data
		},
		invoice: {
			type: DataTypes.JSONB,
			defaultValue: null // id | code
		},
		customer: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		hashtag: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		channel: {
			type: DataTypes.JSONB,
			allowNull: false // id | name
		},
		payment: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		shipping: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		price_book: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		status: {
			type: DataTypes.STRING(25),
			values: values(OrderModel.Statuses),
			defaultValue: OrderModel.Statuses.COMPLETED
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(OrderModel.Statuses),
			defaultValue: OrderModel.StatusNames.COMPLETED
		},
		discounts: {
			type: DataTypes.JSONB,
			defaultValue: [] // id | name | group | type | value
		},
		products: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		total_coin: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_point: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_quantity: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_return_quantity: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_price_before_discount: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_price_after_discount: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_discount_value: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_exchange_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_original_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_shipping_fee: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_return_fee: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_paid: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_unpaid: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},

		// filter box
		normalize_receiver: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_customer: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_product: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		normalize_discount: {
			type: DataTypes.TEXT,
			defaultValue: null
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
		is_payment: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_delivery: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_favorite: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		client_id: {
			type: DataTypes.STRING(255),
			defaultValue: "unkown"
		},
		device_id: {
			type: DataTypes.STRING(255),
			defaultValue: "unkown"
		},
		ip_address: {
			type: DataTypes.STRING(12),
			defaultValue: "unkown"
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		created_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		updated_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		cancelled_at: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		cancelled_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		confirmed_at: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		confirmed_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		completed_at: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		completed_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		}
		
	},
	Types:OrderModel.Types,
	CUSTOMER_FIELDS:OrderModel.CUSTOMER_FIELDS,
	CHANNEL_FIELDS:OrderModel.CHANNEL_FIELDS,
	PAYMENT_FIELDS:OrderModel.PAYMENT_FIELDS,
	SHIPPING_FIELDS:OrderModel.SHIPPING_FIELDS,
	PRICE_BOOK_FIELDS:OrderModel.PRICE_BOOK_FIELDS,
	STORE_FIELDS:OrderModel.STORE_FIELDS,
	StatusNames:OrderModel.StatusNames,
	Statuses:OrderModel.Statuses,
	sortConditions:sortConditions,
	filterConditions:OrderModel.filterConditions,
	getChangedProperties:OrderModel.getChangedProperties,
	transform:OrderModel.transform,
	generateCode: OrderModel.generateCode,
	filterParams : (params) => pick(params, PUBLIC_FIELDS)
};

module.exports=Order;