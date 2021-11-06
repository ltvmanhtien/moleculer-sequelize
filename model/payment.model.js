const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class PaymentModel extends Model {}

const PUBLIC_FIELDS = [
	"type",
	"note",
	"value",
	"card",
	"store",
	"group",
	"order",
	"partner",
	"method",
	"status",
	"status_name",
	"transaction_code",
	"transaction_type",
	"is_visible",
	"is_auto"
];

const PROVIDER_FIELDS = [
	"id",
	"payload" // respone từ các bên cung cấp trả về
];

const ORDER_FIELDS = [
	"id",
	"code",
	"total_paid",
	"total_price"
];

const PARTNER_FIELDS = [
	"id",
	"name",
	"phone",
	"address"
];

const STORE_FIELDS = [
	"id",
	"name",
	"phone",
	"address"
];

const CARD_FIELDS = [
	"ccv",
	"name",
	"bank",
	"number"
];

const VOUCHER_FIELDS = [
	"id",
	"code",
	"name",
];

PaymentModel.Types = {
	PHIEU_THU: 1,
	PHIEU_CHI: 2
};

PaymentModel.Methods = {
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

PaymentModel.NameMethods = {
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

PaymentModel.Statuses = {
	PENDING: "pending",
	COMPLETED: "completed",
	TRANSFORMED: "transformed",
	CANCELLED: "cancelled"
};

PaymentModel.NameStatuses = {
	PENDING: "Đang chờ duyệt",
	COMPLETED: "Đã thanh toán",
	TRANSFORMED: "Chuyển tạm ứng",
	CANCELLED: "Đã huỷ",
};

PaymentModel.Providers = {
	ONEPAY: "one_pay",
	VNPAY: "vn_pay",
	MOMO: "momo"
};


PaymentModel.TransactionTypes = {
	OTHER: "other",
	ORDER: "order",
	DELIVERY: "delivery",
	TRANSFER: "transfer"
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
function filterConditions(params) {
	const options = omitBy(params, isNil);
	options.is_active = true;

	if (options.types) {
		options.type = { [Op.in]: options.types.split(",") };
	}
	delete options.types;

	if (options.stores) {
		options["store.id"] = { [Op.in]: options.stores.split(",") };
	}
	delete options.stores;

	if (options.staffs) {
		options["created_by.id"] = { [Op.in]: options.staffs.split(",") };
	}
	delete options.staffs;

	if (options.groups) {
		options["group.id"] = { [Op.in]: options.groups.split(",") };
	}
	delete options.groups;

	if (options.statuses) {
		options.status = { [Op.in]: options.statuses.split(",") };
	}
	delete options.statuses;

	if (options.partners) {
		options["partner.id"] = { [Op.in]: options.partners.split(",") };
	}
	delete options.partners;

	if (options.card) {
		options["card.number"] = options.card;
	}
	delete options.card;

	if (options.note) {
		options.note = { [Op.iLike]: `%${options.note}%` };
	}

	if (options.code) {
		options.code = { [Op.iLike]: `%${options.code}%` };
	}

	if (options.transaction_code) {
		options.transaction_code = { [Op.iLike]: `%${options.transaction_code}%` };
	}

	// Min Max Filter
	checkMinMaxOfConditionFields(options, "created_at", "Date");

	return options;
}

/**
 * Transform postgres model to expose object
 */
PaymentModel.transform = (params) => {
	const transformed = {};
	const fields = [
		"id",
		"code",
		"type",
		"note",
		"value",
		"card",
		"store",
		"group",
		"order",
		"voucher",
		"partner",
		"provider",
		"method",
		"method_name",
		"status",
		"status_name",
		"transaction_code",
		"transaction_type",
		"created_by",
		"created_at",
		"updated_by",
		"updated_at",
		"cancelled_by",
		"cancelled_at",
		"is_visible",
		"is_auto"
	];
	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe decimal
	const decimalFields = [
		"value"
	];
	decimalFields.forEach((field) => {
		transformed[field] = parseInt(params[field], 0);
	});

	// pipe date
	const dateFields = [
		"created_at",
		"updated_at",
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
PaymentModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		"note",
		"type",
		"card",
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
};

/**
 * Generate code
 *
 * @public
 */
Payment.generateCode = async () => {
	const idRule = "TTHD";
	const payment = await Payment.findOne({
		order: [["id", "desc"]]
	});
	if (payment) {
		const code = payment.code;
		const codeIndex = code.substring(4, code.length);
		const nextCode = parseInt(codeIndex, 10) + 1;
		const newCode = (`${idRule}0000000${nextCode}`).slice(-8);
		return `${idRule}${newCode}`;
	}
	return `${idRule}00000001`;
};

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterParams = (params) => pick(params, PUBLIC_FIELDS);

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterProviderParams = (params) => pick(params, PROVIDER_FIELDS);

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterPartnerParams = (params) => pick(params, PARTNER_FIELDS);

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterStoreParams = (params) => pick(params, STORE_FIELDS);

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterCardParams = (params) => pick(params, CARD_FIELDS);

/**
 * Filter only allowed fields from payment
 *
 * @param {Object} params
 */
Payment.filterOrderParams = (params) => pick(params, ORDER_FIELDS);

/**
 * Filter only allowed fields from voucher
 *
 * @param {Object} params
 */
Payment.filterVoucherParams = (params) => pick(params, VOUCHER_FIELDS);

const Payment ={
	name:"tbl_payments",
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
			type: DataTypes.INTEGER,
			values: values(PaymentModel.Types),
			defaultValue: PaymentModel.Types.PHIEU_THU
		},
		note: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		value: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		card: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		store: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		group: {
			type: DataTypes.JSONB,
			defaultValue: null // nhóm phiếu thu | chi
		},
		partner: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		order: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		provider: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		voucher: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		method: {
			type: DataTypes.INTEGER,
			defaultValue: PaymentModel.Methods.TIEN_MAT
		},
		method_name: {
			type: DataTypes.STRING(50),
			defaultValue: PaymentModel.NameMethods[PaymentModel.Methods.TIEN_MAT]
		},
		status: {
			type: DataTypes.STRING(25),
			values: values(PaymentModel.Statuses),
			defaultValue: PaymentModel.Statuses.PENDING
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(PaymentModel.NameStatuses),
			defaultValue: PaymentModel.NameStatuses.PENDING
		},
		transaction_code: {
			type: DataTypes.STRING(50),
			defaultValue: null
		},
		transaction_type: {
			type: DataTypes.STRING(10),
			defaultValue: PaymentModel.TransactionTypes.OTHER
		},


		// manager
		is_auto: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_visible: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_warning: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
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
		}
		
	},
	filterConditions:filterConditions,
	transform:PaymentModel.transform,
	getChangedProperties:PaymentModel.getChangedProperties,
	generateCode : async () => {
		const idRule = "TTHD";
		const payment = await Payment.findOne({
			order: [["id", "desc"]]
		});
		if (payment) {
			const code = payment.code;
			const codeIndex = code.substring(4, code.length);
			const nextCode = parseInt(codeIndex, 10) + 1;
			const newCode = (`${idRule}0000000${nextCode}`).slice(-8);
			return `${idRule}${newCode}`;
		}
		return `${idRule}00000001`;
	},
	filterParams : (params) => pick(params, PUBLIC_FIELDS),
	filterProviderParams :(params) => pick(params, PROVIDER_FIELDS),
	filterPartnerParams : (params) => pick(params, PARTNER_FIELDS),
	filterStoreParams : (params) => pick(params, STORE_FIELDS),
	filterCardParams : (params) => pick(params, CARD_FIELDS),
	filterOrderParams : (params) => pick(params, ORDER_FIELDS),
	filterVoucherParams :(params) => pick(params, VOUCHER_FIELDS)
};