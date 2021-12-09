const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class AttributeModel extends Model { }

const PUBLIC_FIELDS = [
	"code",
	"icon",
	"type",
	"name",
	"group",
	"require",
	"is_visible"
];

AttributeModel.Groups = {
	ITEM: "item",
	USER: "user",
	ORDER: "order",
};

AttributeModel.Types = {
	TEXT: "text",
	DATE: "date",
	ARRAY: "array",
	NUMBER: "number",
	OBJECT: "object",
};
const Attribute={
	name:"tbl_attributes",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		code: {
			type: DataTypes.STRING(25),
			allowNull: false
		},
		icon: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		type: {
			type: DataTypes.STRING(20),
			values: values(AttributeModel.Types),
			defaultValue: AttributeModel.Types.TEXT
		},
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
		},
		group: {
			type: DataTypes.STRING(20),
			values: values(AttributeModel.Groups),
			defaultValue: AttributeModel.Groups.ITEM
		},
		require: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},

		// manager
		is_visible: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
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
			defaultValue: null
		}
	},
	options: {
		// Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
	},
	Events : {
		// BANNER_CREATED: `${serviceName}.banner.created`,
		// BANNER_UPDATED: `${serviceName}.banner.updated`,
		// BANNER_DELETED: `${serviceName}.banner.deleted`,
	},
	/**
 * Load query
 * @param {*} params
 */
	filterConditions:(params)=> {
		const options = omitBy(params, isNil);
		options.is_active = true;

		// TODO: load condition
		if (options.name) {
			options.name = {
				[Op.iLike]: `%${options.name}%`
			};
		}

		return options;
	},

	/**
 * Load sort query
 * @param {*} sort_by
 * @param {*} order_by
 */
	sortConditions:({ sort_by, order_by }) =>{
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
	},

	/**
 * Transform postgres model to expose object
 */
	transform : (params) => {
		const transformed = {};
		const fields = [
			"id",
			"code",
			"icon",
			"type",
			"name",
			"group",
			"require",
			"is_visible",
			"is_active",
			"created_by"
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
	},

	/**
 * Get all changed properties
 */
	getChangedProperties : ({ newModel, oldModel }) => {
		const changedProperties = [];
		const allChangableProperties = [
			"code",
			"icon",
			"type",
			"name",
			"group",
			"require",
			"is_visible"
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
	},
	filterParams : (params) => pick(params, PUBLIC_FIELDS)
};
module.exports=Attribute;