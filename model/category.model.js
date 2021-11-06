
const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,includes,isEqual} =require("lodash");
const  moment =require("moment-timezone");

class CategoryModel extends Model { }

const PUBLIC_FIELDS = [
	"name",
	"slug",
	"logo",
	"group",
	"image",
	"content",
	"position",

	// social seo
	"meta_url",
	"meta_title",
	"meta_image",
	"meta_keyword",
	"meta_description",

	// config
	"path",
	"parent_id",
	"is_visible",
	"is_home_visible",
];

CategoryModel.Groups = {
	ITEM: "item",
	PART: "part"
};

const Category={
	name:"tbl_categories",
	define:{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		slug: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		logo: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		group: {
			type: DataTypes.STRING(20),
			defaultValue: CategoryModel.Groups.ITEM
		},
		image: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		content: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		path: {
			type: DataTypes.ARRAY(DataTypes.INTEGER),
			defaultValue: []
		},
		position: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		parent_id: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
		normalize_path: {
			type: DataTypes.STRING(255),
			defaultValue: ""
		},

		// seo
		meta_url: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_title: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_image: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_keyword: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		meta_description: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},

		// manager
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_visible: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_home_visible: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		created_by: {
			type: DataTypes.JSONB,
			defaultValue: null // id | name
		},
		// created_at: {
		// 	type: DataTypes.DATE,
		// 	defaultValue: DataTypes.NOW
		// },
		// updated_at: {
		// 	type: DataTypes.DATE,
		// 	defaultValue: DataTypes.NOW
		// }
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
	filterConditions:(params) =>{
		const options = omitBy(params, isNil);
		console.log(options);
		// TODO: load condition
		const { id, keyword, nested } = options;

		if (id && nested) {
			options[Op.or] = [
				{ id: id },
				// { path: id }
				{
					path: {
						[Op.contains]: [id]
					}
				}
			];
		}
		delete options.id;
		delete options.nested;

		if (keyword) {
			// set keyword option
			options.name = {
				[Op.iLike]: `%${keyword}%`
			};
		}
		delete options.keyword;

		return options;
	},

	/**
 * Load sort query
 * @param {*} sort_by
 * @param {*} order_by
 */
	sortConditions:({ sort_by, order_by })=> {
		let sort = null;
		switch (sort_by) {
			case "name":
				sort = [
					["name", order_by]
				];
				break;
			case "created_at":
				sort = [
					["created_at", order_by]
				];
				break;
			case "updated_at":
				sort = [
					["updated_at", order_by]
				];
				break;
			default:
				sort = [
					["created_at", "ASC"]
				];
				break;
		}
		sort.push(["normalize_path", "ASC"]);
		sort.push(["position", "ASC"]);
		return sort;
	},

	/**
 * Transform postgres model to expose object
 * @param {*} model
 */
	transform : (model) => {
		const transformed = {};
		const fields = [
			// attribute
			"id",
			"name",
			"path",
			"slug",
			"logo",
			"group",
			"image",
			"content",
			"position",
			"parent_id",
			"is_visible",
			"is_home_visible",

			// social seo
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description",

			// manager
			"is_active",
			"created_by"
		];

		fields.forEach((field) => {
			transformed[field] = model[field];
		});

		// add additional field
		transformed.children = [];

		transformed.created_at = moment(model.created_at).unix();
		transformed.updated_at = moment(model.updated_at).unix();

		return transformed;
	},

	/**
 * Get all changed properties
 */
	getChangedProperties : ({ newModel, oldModel }) => {
		const changedProperties = [];
		const allChangableProperties = [
			"name",
			"slug",
			"logo",
			"image",
			"content",
			"position",
			"is_visible",
			"is_home_visible",

			// social seo
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description",
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
	}
};
module.exports=Category;