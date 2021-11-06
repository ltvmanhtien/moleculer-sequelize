const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
const PUBLIC_FIELDS = [
	"store_id",
	"store_name",
	"product_id",
	"product_option_id",
	"total_stock_quantity",
	"total_order_quantity",
	"total_quantity"
];

const Stock={
	name:"tbl_stocks",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		store_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		store_name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		product_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		product_option_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		total_quantity: {
			type: DataTypes.DECIMAL, // tổng tồn thực tế - tổng đặt hàng
			defaultValue: 0
		},
		total_order_quantity: {
			type: DataTypes.DECIMAL, // tổng tồn đặt hàng
			defaultValue: 0
		},
		total_stock_quantity: {
			type: DataTypes.DECIMAL, // tổng tồn thực tế
			defaultValue: 0
		},

		// manager
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_favorite: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_warning: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		}
	},
	/**
 * Load query
 * @param {*} params
 */
	filterConditions:(params) =>{
		const options = omitBy(params, isNil);
		return options;
	},

	/**
 * Transform postgres model to expose object
 */
	transform : (params) => {
		const transformed = {};
		transformed.id = params.store_id;
		transformed.name = params.store_name;
		transformed.product_id = params.product_id;
		transformed.product_option_id = params.product_option_id;

		// pipe decimal
		const decimalFields = [
			"total_quantity",
			"total_stock_quantity",
			"total_order_quantity",
		];
		decimalFields.forEach((field) => {
			transformed[field] = parseFloat(params[field]);
		});

		return transformed;
	},
	filterParams :(params) => pick(params, PUBLIC_FIELDS)
};
module.exports=Stock;