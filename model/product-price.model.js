const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");

class ProductPriceModel extends Model { }

const PUBLIC_FIELDS = [
	"type",
	"name",
	"status",
	"status_name",
	"applied_groups",
	"applied_stores",
	"applied_members",
	"applied_condition",
	"applied_start_time",
	"applied_stop_time",
	"is_auto_create",
	"is_auto_update"
];


ProductPriceModel.Types = {
	PUBLIC: "public",
	PRIVATE: "private",
	PUBLIC_WITH_WARNNING: "public_with_warnning"
};

ProductPriceModel.Statuses = {
	ACTIVE: "active",
	INACTIVE: "inactive"
};

ProductPriceModel.NameStatuses = {
	ACTIVE: "Kích hoạt",
	INACTIVE: "Chưa áp dụng"
};

ProductPriceModel.DefaultValues = {
	id: 1000,
	name: "Bảng giá chung"
};

const ProductPrice={
	name:"tbl_product_prices",
	define:{},
	DefaultValues:ProductPriceModel.DefaultValues,
};
module.exports=ProductPrice;