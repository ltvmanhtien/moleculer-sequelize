const { Sequelize, Model, Op, DataTypes } = require("sequelize");
const { pick, omitBy, isNil, values, includes, isEqual } = require("lodash");
const moment = require("moment-timezone");

class CartModel extends Model { }
const PUBLIC_FIELDS = [
	"note",
	"store",
	"payment",
	"shipping",
	"customer",
	"products",
	"payments",
	"deliveries",

	// amount
	"total_coin",
	"total_point",
	"total_quantity",
	"total_return_quantity",
	"total_price_before_discount",
	"total_price_after_discount",
	"total_discount_value",
	"total_exchange_price",
	"total_shipping_fee",
	"total_return_fee",
	"total_price",
	"total_paid",
	"total_unpaid"
];

CartModel.Statuses = {
	PICKING: "picking",
	PENDING: "pending",
	CANCELLED: "cancelled",
	CONFIRMED: "confirmed",
	FAILURED: "failured"
};

CartModel.NameStatuses = {
	PICKING: "Đang mua",
	PENDING: "Đang xử lý",
	CANCELLED: "Đã huỷ",
	CONFIRMED: "Đã duyệt",
	FAILURED: "Đơn lỗi"
};

CartModel.PaymentMethods = {
	TIEN_MAT: 1,
	CHUYEN_KHOAN: 2,
	QUET_THE: 3,
	VISA: 4,
	ONE_PAY: 5,
	MOMO: 6,
	VNPAY: 7,
	VOUCHER: 8,
	POINT: 9
};

CartModel.NamePaymentMethods = {
	1: "Tiền mặt",
	2: "Chuyển khoản",
	3: "Quẹt Thẻ",
	4: "Visa",
	5: "One Pay",
	6: "Momo",
	7: "VNPAY",
	8: "Voucher",
	9: "Điểm"
};

CartModel.ShipMethods = {
	GH_48H: 1,
	STORE: 2,
	COD_2H: 3
};

CartModel.NameShipMethods = {
	1: "Giao hàng 48h",
	2: "Tự đến lấy",
	3: "Giao hàng 2h"
};

CartModel.Sources = {
	WEB: "web",
	APP: "app"
};
/**
 * Load query
 * @param {*} params
 */
function filterConditions(params) {
	const options = omitBy(params, isNil);

	if (options.stores) {
		options["store.id"] = {
			[Op.in]: options.stores.split(",")
		};
	}
	delete options.stores;

	if (options.statuses) {
		options.status = {
			[Op.in]: options.statuses.split(",")
		};
	}
	delete options.statuses;

	return options;
}

/**
* Load sort query
* @param {*} sort_by
* @param {*} order_by
*/
function sortConditions({ sort_by, order_by }) {
	let sort = null;
	switch (sort_by) {
		case "created_at":
			sort = ["created_at", order_by];
			break;
		case "updated_at":
			sort = ["updated_at", order_by];
			break;
		default: sort = ["created_at", "DESC"];
			break;
	}
	return sort;
}

/**
* Transform postgres model to expose object
*/
CartModel.transform = (params, includeRestrictedFields = false) => {
	const transformed = {};
	const fields = [
		"id",
		"code",
		"type",
		"note",
		"payment",
		"shipping",
		"products",
		"payments",
		"deliveries"
	];

	// check private
	if (includeRestrictedFields) {
		const privateFields = [
			"store",
			"source",
			"customer",
			"status",
			"status_name",
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
		fields.push(...privateFields);
	}

	// trasnform
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
*
* @public
* @param {Object} data newModel || oleModel
*/
CartModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		// attributes
		"note",
		"payment",
		"shipping",
		"customer",
		"products",
		"payments",
		"deliveries",

		// amount
		"total_coin",
		"total_point",
		"total_quantity",
		"total_return_quantity",
		"total_price_before_discount",
		"total_price_after_discount",
		"total_discount_value",
		"total_exchange_price",
		"total_shipping_fee",
		"total_return_fee",
		"total_price",
		"total_paid",
		"total_unpaid"
	];

	// get all changable properties
	Object.keys(newModel).forEach((field) => {
		if (includes(allChangableProperties, field)) {
			changedProperties.push(field);
		}
	});

	// get data changed
	const dataChanged = [];
	changedProperties.forEach(field => {
		if (!isEqual(newModel[field], oldModel[field])) {
			dataChanged.push(field);
		}
	});
	return dataChanged;
};


const Cart = {
	name: "tbl_carts",
	define: {
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
			defaultValue: "order"
		},
		note: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		store: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		source: {
			type: DataTypes.STRING(50),
			values: values(CartModel.Sources),
			defaultValue: CartModel.Sources.ERP
		},
		customer: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		hashtag: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		channel: {
			type: DataTypes.JSONB,
			defaultValue: null
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
			values: values(CartModel.Statuses),
			defaultValue: CartModel.Statuses.PICKING
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(CartModel.Statuses),
			defaultValue: CartModel.NameStatuses.PICKING
		},
		payments: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		deliveries: {
			type: DataTypes.JSONB,
			defaultValue: []
		},
		discounts: {
			type: DataTypes.JSONB,
			defaultValue: []
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

		// manager
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_warning: {
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
	Statuses:CartModel.Statuses,
	PaymentMethods:CartModel.PaymentMethods,
	ShipMethods:CartModel.ShipMethods,
	Sources:CartModel.Sources,
	NameStatuses:CartModel.NameStatuses,
	filterConditions:filterConditions,
	sortConditions:sortConditions,
	transform:CartModel.transform,
	getChangedProperties:CartModel.getChangedProperties,
	filterParams :(params) => pick(params, PUBLIC_FIELDS)
};
module.exports=Cart;