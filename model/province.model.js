
const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,includes,isEqual} =require("lodash");
const  moment =require("moment-timezone");

class ProvincesModel extends Model { }

const PUBLIC_FIELDS = [
	"name",
	"code",
	"providers",
	"province_code"
];
/**
 * Load query
 * @param {*} params
 */
function filterConditions(params) {
	const options = omitBy(params, isNil);
	options.is_active = true;

	// TODO: load condition
	if (options.name) {
		options.name = {
			[Op.iLike]: `%${options.name}%`
		};
	}

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
ProvincesModel.transform = (params) => {
	const transformed = {};
	const fields = [
		"id",
		"name",
		"code",
		"providers"
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
ProvincesModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		"code",
		"name",
		"providers"
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
const Provinces={
	name:"tbl_provinces",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		code: {
			type: DataTypes.STRING(100),
			allowNull: false
		},

		// 3RD Location
		providers: {
			type: DataTypes.ARRAY(DataTypes.JSONB),
			defaultValue: []
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
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		created_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		}
	},
	
	filterConditions:filterConditions,
	sortConditions:sortConditions,
	transform:ProvincesModel.transform,
	getChangedProperties:ProvincesModel.getChangedProperties,
	filterParams: (params) => pick(params, PUBLIC_FIELDS)
	
};
module.exports=Provinces;