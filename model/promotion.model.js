const {Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,includes,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class PromotionModel extends Model { }
const PUBLIC_FIELDS = [
	"code",
	"name",
	"type",
	"status",
	"content",
	"position",
	"products",
	"thumbnail_url",
	"applied_stop_time",
	"applied_start_time",
	"applied_discount_type",
	"applied_discount_condition"
];

const CONDITION_FIELDS = [
	"min_quantity",
	"max_quantity",
	"discount_type",
	"discount_rate",
	"discount_value"
];

const PRODUCT_FIELDS = [
	"id",
	"name",
	"position",
	"option_id",
	"thumbnail_url",
	"min_quantity",
	"max_quantity",
	"discount_rate",
	"discount_value",
	"original_price",
	"normal_price",
	"price"
];

PromotionModel.Types = {
	COMBO_DEAL: "combo_deal",
	FLASH_DEAL: "flash_deal",
	HOT_DEAL: "hot_deal"
};

PromotionModel.Statuses = {
	DRAF: "darf",
	PENDING: "pending",
	STARTING: "starting",
	STOPPING: "stopping",
	FINISHED: "finished",
	FAILURED: "failured",
	CANCELLED: "cancelled"
};

PromotionModel.NameStatuses = {
	DRAF: "Lưu tạm",
	PENDING: "Sắp diễn ra",
	STARTING: "Đang diễn ra",
	STOPPING: "Đang tạm dừng",
	FINISHED: "Đã kết thúc",
	FAILURED: "Đã gặp sự cố",
	CANCELLED: "Đã huỷ"
};

PromotionModel.DiscountTypes = {
	DISCOUNT_CASH: "discount_by_cash",
	DISCOUNT_OTHER: "discount_by_other",
	DISCOUNT_PERCENT: "discount_by_percent"
};
/**
 * Check min or max in condition
 * @param {*} options
 * @param {*} field
 * @param {*} type
 */
function checkMinMaxOfConditionFields(options, field, type) {
	console.log(field, type);
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
	// console.log(options[`max_${field}`]);
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

	if (options.type) {
		options.type = {
			[Op.like]: `${options.type}`
		};
	}

	if (options.keyword) {
		options[Op.or] = [
			{
				code: { [Op.iLike]: `%${options.keyword}%` }
			},
			{
				name: { [Op.iLike]: `%${options.keyword}%` }
			}
		];
	}
	delete options.keyword;

	if (options.product_sku) {
		options.products = {
			[Op.contains]: [
				{
					sku: options.product_sku
				}
			]
		};
	}
	delete options.product_sku;

	if (options.product_name) {
		options.products = {
			[Op.contains]: [
				{
					name: options.product_name
				}
			]
		};
	}
	delete options.product_name;

	if (options.min_start_time) {
		options.applied_stop_time = {
			[Op.gte]: options.min_start_time
		};
	}
	delete options.min_start_time;

	if (options.max_start_time) {
		options.applied_start_time = {
			[Op.lte]: options.max_start_time
		};
	}
	delete options.max_start_time;

	if (options.statuses) {
		options.status = {
			[Op.in]: options.statuses.split(",")
		};
	}
	delete options.statuses;

	// date filters
	checkMinMaxOfConditionFields(options, "created_at", "Date");

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
		case "name":
			sort = ["name", order_by];
			break;
		case "position":
			sort = ["position", order_by];
			break;
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
PromotionModel.transform = (params, includeRestrictedFields = true) => {
	const transformed = {};
	const fields = [
		"id",
		"code",
		"name",
		"content",
		"thumbnail_url",
		"applied_stop_time",
		"applied_start_time"
	];

	if (includeRestrictedFields) {
		const privateFields = [
			"type",
			"status",
			"products",
			"position",
			"status_name",
			"applied_discount_condition",
			"applied_discount_type",
			"total_product_quantity",
			"total_click_quantity",
			"total_order_quantity",
			"total_revenue",
			"total_price",
			"created_by",
			"created_at",
			"updated_at",
			"updated_by",
		];
		fields.push(...privateFields);
	}

	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe date
	const dateFields = [
		"created_at",
		"updated_at",
		"applied_stop_time",
		"applied_start_time"
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
PromotionModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		"name",
		"content",
		"position",
		"products",
		"thumbnail_url",
		"applied_stop_time",
		"applied_start_time",
		"applied_discount_type",
		"applied_discount_condition",
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

const Promotion={
	name:"tbl_promotions",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		type: {
			// name: 'Lọai hình khuyến mãi'
			type: DataTypes.STRING(255),
			values: values(PromotionModel.Types),
			allowNull: false
		},
		code: {
			type: DataTypes.STRING(25),
			defaultValue: null
		},
		name: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		position: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		status: {
			type: DataTypes.STRING(10),
			values: values(PromotionModel.Statuses),
			defaultValue: PromotionModel.Statuses.PENDING
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(PromotionModel.NameStatuses),
			defaultValue: PromotionModel.NameStatuses.PENDING
		},
		products: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		thumbnail_url: {
			// name: 'Hình ảnh quảng cáo'
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		applied_start_time: {
			// name: 'Thời gian bắt đầu'
			type: DataTypes.DATE,
			allowNull: false
		},
		applied_stop_time: {
			// name: 'Thời gian kết thúc'
			type: DataTypes.DATE,
			allowNull: false
		},
		applied_discount_type: {
			// name: 'Loại khuyến mại'
			type: DataTypes.STRING(50),
			values: values(PromotionModel.DiscountTypes),
			defaultValue: PromotionModel.DiscountTypes.DISCOUNT_PERCENT
		},
		applied_discount_condition: {
			// name: 'Điều kiện khuyến mại'
			type: DataTypes.JSONB,
			allowNull: true
		},
		total_product_quantity: {
			// name: 'Tổng số mặt hàng khuyến mại'
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_click_quantity: {
			// name: 'Tổng số lượt click vào sản phẩm có khuyến mại'
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_order_quantity: {
			// name: 'Tổng số đơn hàng có chương trình khuyến mại'
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_revenue: {
			// name: 'Tổng số doanh thu đạt được (giá bán * số lượt mua)'
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_price: {
			// name: 'Tổng số tiền đã chi (giá vốn - giá khuyến mại * số lượt mua)'
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
			defaultValue: null
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		updated_by: {
			type: DataTypes.JSONB,
			defaultValue: null
		},
		cancelled_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		cancelled_by: {
			type: DataTypes.JSONB,
			defaultValue: null
		}
	},
	NameStatuses:PromotionModel.NameStatuses,
	Statuses:PromotionModel.Statuses,
	filterConditions:filterConditions,
	transform:PromotionModel.transform,
	getChangedProperties:PromotionModel.getChangedProperties,
	sortConditions:sortConditions,
	filterParams : (collum, params) => {
		if (collum === "PRODUCT") {
			return pick(params, PRODUCT_FIELDS);
		}
		if (collum === "CONDITION") {
			return pick(params, CONDITION_FIELDS);
		}
		return pick(params, PUBLIC_FIELDS);
	}

};
module.exports=Promotion;
