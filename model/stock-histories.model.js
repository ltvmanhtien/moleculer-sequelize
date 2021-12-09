const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class StockHistoryModel extends Model {}
const PUBLIC_FIELDS = [
	"event_id",
	"event_name",
	"store_id",
	"store_name",
	"partner_id",
	"partner_name",
	"product_id",
	"product_option_id",
	"product_type",
	"product_price",
	"product_normal_price",
	"product_original_price",
	"total_current_quantity",
	"total_final_quantity",
	"total_quantity",
	"total_price"
];

StockHistoryModel.EventTypes = {
	INVOICE: "invoice",
	ORDER: "order",
	RETURN: "return",
	IMPORT: "import",
	EXPORT: "export",
	TRANSFER: "transfer",
	STOCK_TAKE: "stock_take",
	PRODUCTION: "production",
};

StockHistoryModel.EventNames = {
	INVOICE: "Bán hàng",
	ORDER: "Đặt hàng",
	RETURN: "Trả hàng",
	IMPORT: "Nhập hàng",
	EXPORT: "Xuất huỷ",
	TRANSFER: "Chuyển hàng",
	STOCK_TAKE: "Kiểm hàng",
	PRODUCTION: "Sản xuất",
};
/**
 * Transform postgres model to expose object
 */
StockHistoryModel.transform = (params) => {
	const transformed = {};
	const fields = [
		"id",
		"event_id",
		"event_name",
		"store_id",
		"store_name",
		"partner_id",
		"partner_name",
		"product_id",
		"product_type",
		"product_price",
		"product_normal_price",
		"product_original_price",
		"transaction_id",
		"transaction_code",
		"total_final_quantity",
		"total_current_quantity",
		"total_quantity",
		"total_price",
		"created_at",
		"created_by",
	];
	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe decimal
	const dateFields = [
		"created_at",
		"updated_at"
	];
	dateFields.forEach((field) => {
		transformed[field] = moment(params[field]).unix();
	});


	// pipe decimal
	const decimalFields = [
		"product_price",
		"product_normal_price",
		"product_original_price",
		"total_final_quantity",
		"total_quantity"
	];
	decimalFields.forEach((field) => {
		transformed[field] = parseFloat(params[field]);
	});

	return transformed;
};


/**
 * Load query
 * @param {*} params
 */
StockHistoryModel.filterConditions=(params) =>{
	const options = omitBy(params, isNil);
	options.is_active = true;
	return options;
};

/**
 * Filter only allowed fields from stock log
 *
 * @param {Object} params
 */
StockHistoryModel.filterParams = (params) => pick(params, PUBLIC_FIELDS);
const StockHistory={
	name:"tbl_stock_histories",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		event_id: {
			type: DataTypes.STRING(20),
			values: values(StockHistoryModel.EventTypes),
			defaultValue: null
		},
		event_name: {
			type: DataTypes.STRING(100),
			values: values(StockHistoryModel.EventNames),
			defaultValue: null
		},
		store_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		store_name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		partner_id: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
		partner_name: {
			type: DataTypes.STRING(155),
			defaultValue: null
		},
		product_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		product_option_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		product_type: {
			type: DataTypes.STRING(10),
			defaultValue: "item"
		},
		product_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		product_normal_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		product_original_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		transaction_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		transaction_code: {
			type: DataTypes.STRING(24),
			allowNull: false
		},
		total_current_quantity: {
			type: DataTypes.DECIMAL, // tổng tồn cuối cùng
			defaultValue: 0
		},
		total_final_quantity: {
			type: DataTypes.DECIMAL, // tổng tồn cuối cùng
			defaultValue: 0
		},
		total_quantity: {
			type: DataTypes.DECIMAL, // tổng số lượng thay đổi
			defaultValue: 0
		},
		total_price: {
			type: DataTypes.DECIMAL, // tổng giá trị
			defaultValue: 0
		},

		// manager
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
	},
	filterConditions:StockHistoryModel.filterConditions,
	transform: StockHistoryModel.transform,
	filterParams:StockHistoryModel.filterParams,
	EventTypes:StockHistoryModel.EventTypes,
	EventNames:StockHistoryModel.EventNames
};
module.exports=StockHistory;