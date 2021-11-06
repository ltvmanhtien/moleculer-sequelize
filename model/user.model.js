const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const Permissions=require("../utils/Permissions");
const PUBLIC_FIELDS = [
	"url",
	"type",
	"title",
	"content",
	"position",
	"image_url",
	"mobile_url",
	"is_visible"
];
class UserModel extends Model { }
UserModel.Genders = {
	MALE: "male",
	FEMALE: "female"
};
UserModel.Types = {
	STAFF: "staff",
	COMPANY: "company",
	INDIVIDUAL: "individual"
};

UserModel.Statuses = {
	INACTIVE: "inactive",
	ACTIVE: "active",
	BANNED: "banned"
};
UserModel.StatusesName = {
	ACTIVE: "Đang hoạt động",
	INACTIVE: "Ngừng hoạt động",
	BANNED: "Đã khóa"
};
UserModel.Services = {
	USER: "user",
	STAFF: "staff",
	SERVICE: "service"
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
	}
	if (type === "Number") {
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
UserModel.filterConditions=(params) =>{
	const options = omitBy(params, isNil);
	options.is_active = true;

	if (options.types) {
		options.type = { [Op.in]: options.types.split(",") };
	}
	delete options.types;

	if (options.roles) {
		options["role.id"] = { [Op.in]: options.roles.split(",") };
	}
	delete options.roles;

	if (options.groups) {
		options["group.id"] = { [Op.in]: options.groups.split(",") };
	}
	delete options.groups;

	if (options.statuses) {
		options.status = { [Op.in]: options.statuses.split(",") };
	}
	delete options.statuses;

	if (options.services) {
		options.service = { [Op.in]: options.services.split(",") };
	}
	delete options.services;

	if (options.genders) {
		options.gender = { [Op.in]: options.genders.split(",") };
	}
	delete options.genders;

	if (options.staffs) {
		options["created_by.id"] = { [Op.in]: options.staffs.split(",") };
	}
	delete options.staffs;

	if (options.stores) {
		options.store_path = { [Op.overlap]: options.stores.split(",") };
	}
	delete options.stores;

	if (options.provinces) {
		options["province.id"] = { [Op.in]: options.provinces.split(",") };
	}
	delete options.provinces;

	if (options.keyword) {
		options.normalize_name = { [Op.iLike]: `%${options.keyword}%` };
	}
	delete options.keyword;

	// Date Filter
	checkMinMaxOfConditionFields(options, "created_at", "Date");
	checkMinMaxOfConditionFields(options, "last_purchase", "Date");

	// Number Filter
	checkMinMaxOfConditionFields(options, "total_debt", "Number");
	checkMinMaxOfConditionFields(options, "total_point", "Number");
	checkMinMaxOfConditionFields(options, "total_order_price", "Number");
	checkMinMaxOfConditionFields(options, "total_invoice_price", "Number");

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
		case "created_at":
			sort = ["created_at", order_by];
			break;
		case "updated_at":
			sort = ["updated_at", order_by];
			break;
		case "total_debt":
			sort = ["total_debt", order_by];
			break;
		case "total_point":
			sort = ["total_point", order_by];
			break;
		case "total_purchase":
			sort = ["total_purchase", order_by];
			break;
		case "total_invoice_price":
			sort = ["total_invoice_price", order_by];
			break;
		case "total_return_price":
			sort = ["total_return_price", order_by];
			break;
		default: sort = ["created_at", "DESC"];
			break;
	}
	return sort;
}

/**
 * Transform postgres model to expose object
 */
UserModel.transform = (params, includeRestrictedFields = true) => {
	const transformed = {};
	const fields = [
		"id",
		"name",
		"note",
		"phone",
		"email",
		"avatar",
		"cover",
		"gender",
		"birthday",
		"barcode",
		"tax_code",
		"company",
		"country",
		"address",
		"province",
		"district",
		"ward",

		// manager
		"is_active",
		"is_verified_phone",
		"is_verified_email",
		"is_verified_password"
	];
	if (includeRestrictedFields) {
		const privateFiles = [
			"type",
			"role",
			"group",
			"stores",
			"status",
			"status_name",
			"permissions",
			"created_by"
		];
		fields.push(...privateFiles);
	}
	fields.forEach((field) => {
		transformed[field] = params[field];
	});

	// pipe decimal
	const decimalFields = [
		"total_debt",
		"total_order_price",
		"total_invoice_price",
		"total_return_price",
		"total_purchase",
		"total_point",
	];
	decimalFields.forEach((field) => {
		transformed[field] = parseInt(params[field], 0);
	});

	// pipe date
	const dateFields = [
		"birthday",
		"created_at",
		"updated_at",
		"last_purchase"
	];
	dateFields.forEach((field) => {
		transformed[field] = moment(params[field]).unix();
	});

	return transformed;
};

/**
 * Get all changed properties
 */
UserModel.getChangedProperties = ({ newModel, oldModel }, includeRestrictedFields = true) => {
	const changedProperties = [];
	const allChangableProperties = [
		"name",
		"note",
		"phone",
		"email",
		"avatar",
		"cover",
		"gender",
		"birthday",
		"barcode",
		"tax_code",
		"company",
		"country",
		"address",
		"province",
		"district",
		"ward",
	];
	if (includeRestrictedFields) {
		const privateFiles = [
			"type",
			"role",
			"group",
			"stores",
			"status",
			"permissions"
		];
		allChangableProperties.push(...privateFiles);
	}
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


const User={
	name:"tbl_users",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		type: {
			type: DataTypes.STRING(10),
			defaultValue: UserModel.Types.INDIVIDUAL
		},
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		note: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		phone: {
			type: DataTypes.STRING(20),
			defaultValue: null
		},
		email: {
			type: DataTypes.STRING(255),
			validate: { isEmail: true },
			defaultValue: null
		},
		avatar: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		cover: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		birthday: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		barcode: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		gender: {
			type: DataTypes.STRING(50),
			values: values(UserModel.Genders),
			defaultValue: UserModel.Genders.FEMALE
		},
		tax_code: {
			type: DataTypes.STRING(25),
			defaultValue: null
		},
		company: {
			type: DataTypes.STRING(100),
			defaultValue: null
		},
		country: {
			type: DataTypes.STRING(3),
			defaultValue: "vn"
		},
		language: {
			type: DataTypes.STRING(3),
			default: "vi"
		},
		timezone: {
			type: DataTypes.INTEGER,
			default: 7
		},
		address: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		province: {
			type: DataTypes.JSONB,
			defaultValue: null // id || name
		},
		district: {
			type: DataTypes.JSONB,
			defaultValue: null // id || name
		},
		ward: {
			type: DataTypes.JSONB,
			defaultValue: null // id || name
		},
		role: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		group: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		status: {
			type: DataTypes.STRING(50),
			values: values(UserModel.Statuses),
			defaultValue: UserModel.Statuses.INACTIVE
		},
		status_name: {
			type: DataTypes.STRING(50),
			values: values(UserModel.StatusesName),
			defaultValue: UserModel.StatusesName.INACTIVE
		},
		stores: {
			type: DataTypes.JSONB,
			defaultValue: [] // id, name, phone, address
		},
		service: {
			type: DataTypes.STRING(50),
			values: values(UserModel.Services),
			defaultValue: UserModel.Services.USER
		},
		password: {
			type: DataTypes.STRING(255),
			defaultValue: () => uuidv4()
		},
		permissions: {
			type: DataTypes.ARRAY(DataTypes.STRING(155)),
			defaultValue: [Permissions.USER]
		},

		// third party account
		apple: {
			type: DataTypes.JSONB,
			defaultValue: {
				id: null,
				email: null,
				name: null,
				avatar: null,
			}
		},
		facebook: {
			type: DataTypes.JSONB,
			defaultValue: {
				id: null,
				email: null,
				name: null,
				avatar: null,
			}
		},
		google: {
			type: DataTypes.JSONB,
			defaultValue: {
				id: null,
				email: null,
				name: null,
				avatar: null,
			}
		},

		// filter group
		store_path: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: null
		},
		normalize_name: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		normalize_dob: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
		normalize_mob: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},

		// metric
		total_debt: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_order_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_invoice_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_return_price: {
			type: DataTypes.DECIMAL,
			defaultValue: 0
		},
		total_point: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		total_purchase: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		last_purchase: {
			type: DataTypes.DATE,
			defaultValue: null
		},

		// config
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		device_id: {
			type: DataTypes.STRING(255),
			defaultValue: "unkown"
		},
		ip_address: {
			type: DataTypes.STRING(12),
			defaultValue: "unkown"
		},
		is_verified_phone: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_verified_email: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		is_verified_password: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: () => new Date()
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: () => new Date()
		},
		created_by: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {
				id: null,
				name: null
			}
		},
		
	},
	options: {
		// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
	},
	filterConditions:UserModel.filterConditions,
	transform:UserModel.transform,
	getChangedProperties:UserModel.getChangedProperties
};
module.exports=User;