const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
class AttributeValueModel extends Model { }
const PUBLIC_FIELDS = [
	"id",
	"slug",
	"icon",
	"value",
	"content",
	"position",
	"is_visible",
	"meta_url",
	"meta_title",
	"meta_image",
	"meta_keyword",
	"meta_description",
	"attribute_code",
];
	/**
 * Converter
 * @param {*} str
 */
AttributeValueModel.convertToEn= (str) =>{
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/đ/g, "d");
	str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
	str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
	str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
	str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
	str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
	str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
	str = str.replace(/Đ/g, "D");
	str = str.toLowerCase();
	return str;
};

AttributeValueModel.filterConditions =(params) =>{
	const options = omitBy(params, isNil);
	let condition = "attr.is_active = true \n";
	if (options.keyword) {
		condition += `AND item.normalize_name ILIKE '%${options.keyword}%' \n`;
	}
	if (options.is_visible) {
		condition += `AND attr.is_visible = ${options.is_visible} \n`;
	}
	if (options.attribute_code) {
		condition += `AND attr.attribute_code = '${options.attribute_code}' \n`;
	}
	if (options.attribute_value) {
		condition += `AND attr.value ILIKE '%${options.attribute_value}%' \n`;
	}
	if (options.categories) {
		const categories = options.categories.split(",");
		categories.forEach(c => condition += `AND '${c}' = ANY (item.category_path) \n`);
	}
	if (options.attributes) {
		const attributes = options.attributes.split(",");
		attributes.forEach(a => condition += `AND '${a}' = ANY (item.attribute_path) \n`);
	}
	return condition;
};

const AttributeValue={
	name: "tbl_attribute_values",
	define: {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		slug: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		icon: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		name: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		value: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		position: {
			type: DataTypes.INTEGER,
			defaultValue: null
		},
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
		attribute_code: {
			type: DataTypes.STRING(25),
			allowNull: false
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
 * Transform postgres model to expose object
 */
	transform : (params) => {
		const transformed = {};
		const fields = [
			"id",
			"slug",
			"icon",
			"count",
			"value",
			"content",
			"position",
			"is_visible",
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description",
			"attribute_code"
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
	getChangedProperties :({ newModel, oldModel }) => {
		const changedProperties = [];
		const allChangableProperties = [
			"slug",
			"icon",
			"value",
			"content",
			"position",
			"is_visible",
			"meta_url",
			"meta_title",
			"meta_image",
			"meta_keyword",
			"meta_description"
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
	filterConditions:AttributeValueModel.filterConditions,
	filterParams :(params) => pick(params, PUBLIC_FIELDS),
	getParentPath : async (parent_id) => {
		// if (!parent_id) {
		// 	return [];
		// }
		// const parentCategory = await Category.get(parent_id);
		// const path = parentCategory.path.slice(0);
		// path.push(parentCategory.id);
		// return path;
	}
};
module.exports=AttributeValue;