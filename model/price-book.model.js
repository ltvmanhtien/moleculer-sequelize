const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");

class PriceBookModel extends Model { }

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


PriceBookModel.Types = {
	PUBLIC: "public",
	PRIVATE: "private",
	PUBLIC_WITH_WARNNING: "public_with_warnning"
};

PriceBookModel.Statuses = {
	ACTIVE: "active",
	INACTIVE: "inactive"
};

PriceBookModel.NameStatuses = {
	ACTIVE: "Kích hoạt",
	INACTIVE: "Chưa áp dụng"
};

PriceBookModel.DefaultValues = {
	id: 1000,
	name: "Bảng giá chung"
};
/**
 * Load query
 * @param {*} params
 */
function filterConditions(params) {
	const options = omitBy(params, isNil);

	if (options.types) {
		options.type = { [Op.in]: options.types.split(",") };
	}
	delete options.types;

	if (options.statuses) {
		options.status = { [Op.in]: options.statuses.split(",") };
	}
	delete options.statuses;

	if (options.keyword) {
		options.name = { [Op.iLike]: `%${options.keyword}%` };
	}
	delete options.keyword;

	return options;
}

/**
 * Transform postgres model to expose object
 */
PriceBookModel.transform = (params) => {
	const transformed = {};
	const fields = [
		"id",
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
		"is_auto_update",
		"created_at",
		"created_by",
		"updated_at",
		"updated_by"
	];
	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe date
	const dateFields = [
		"created_at",
		"updated_at"
	];
	dateFields.forEach((field) => {
		transformed[field] = moment(params[field]).unix();
	});

	return transformed;
};

/**
 * Get all changed properties
 */
PriceBookModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
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
		"is_auto_update",
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

const PriceBook={
	name:"tbl_product_prices",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		type: {
			type: DataTypes.STRING(50),
			values: values(PriceBookModel.Types),
			defaultValue: PriceBookModel.Types.PRIVATE
		},
		name: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		status: {
			type: DataTypes.STRING(25),
			values: values(PriceBookModel.Statuses),
			defaultValue: PriceBookModel.Statuses.ACTIVE
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(PriceBookModel.NameStatuses),
			defaultValue: PriceBookModel.NameStatuses.ACTIVE
		},
		applied_groups: {
			// name: 'Áp dụng cho nhóm khách hàng'
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		applied_stores: {
			// name: 'Áp dụng cho chi nhánh bán hàng'
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		applied_members: {
			// name: 'Áp dụng cho nhân viên bán hàng'
			type: DataTypes.ARRAY(DataTypes.TEXT),
			defaultValue: []
		},
		applied_condition: {
			// name: 'Điều kiện thay đổi giá hàng hoá'
			type: DataTypes.JSONB,
			defaultValue: null
		},
		applied_start_time: {
			// name: 'Ngày bắt đầu'
			type: DataTypes.DATE,
			allowNull: false
		},
		applied_stop_time: {
			// name: 'Ngày kết thúc'
			type: DataTypes.DATE,
			allowNull: false
		},

		// manager
		is_auto_create: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_auto_update: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
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
		}
	},
	filterParams : (params) => pick(params, PUBLIC_FIELDS),
	filterConditions:filterConditions,
	transform:PriceBookModel.transform,
	getChangedProperties:PriceBookModel.getChangedProperties
};
module.exports=PriceBook;