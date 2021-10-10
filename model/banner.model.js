const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual} =require("lodash");
const  moment =require("moment-timezone");
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
class BannerModel extends Model { }
BannerModel.Types={
	HOME_V1_POPUP: "home_v1_popup",
	HOME_V1_SLIDER: "home_v1_slider",
	HOME_V1_SUB_BANNER: "home_v1_sub_banner",
	
	HOME_V1_PRIMARY_BANNER_1: "home_v1_primary_banner_1",
	HOME_V1_PRIMARY_BANNER_2: "home_v1_primary_banner_2",
	
	HOME_V1_CATEGORY_HOME_BANNER_1: "home_v1_category_home_banner_1",
	HOME_V1_CATEGORY_HOME_BANNER_2: "home_v1_category_home_banner_2",
	HOME_V1_CATEGORY_HOME_BANNER_3: "home_v1_category_home_banner_3",
	HOME_V1_CATEGORY_HOME_BANNER_4: "home_v1_category_home_banner_4",
	HOME_V1_CATEGORY_HOME_BANNER_5: "home_v1_category_home_banner_5",
	
	HOME_V1_SLIDER_MOBILE: "home_v1_slider_mobile",
	HOME_V1_CATEGORY_MOBILE_BANNER_1: "home_v1_category_mobile_banner_1",
	HOME_V1_CATEGORY_MOBILE_BANNER_2: "home_v1_category_mobile_banner_2",
	HOME_V1_CATEGORY_MOBILE_BANNER_3: "home_v1_category_mobile_banner_3",
	
	FLASH_SALE_DETAIL_BANNER: "flash_sale_detail_banner",
	HOT_DEAL_DETAIL_BANNER: "hot_deal_detail_banner",
	PRODUCT_DETAIL_BANNER: "product_detail_banner"
};
const Banner={
	name: "tbl_banners",
	Types : BannerModel.Types,
	define: {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		url: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		type: {
			type: DataTypes.STRING(155),
			values: values(BannerModel.Types),
			defaultValue: BannerModel.Types.HOME_V1_POPUP
		},
		title: {
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		content: {
			type: DataTypes.TEXT,
			defaultValue: null
		},
		position: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		image_url: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		mobile_url: {
			type: DataTypes.STRING(255),
			allowNull: false
		},

		// metric
		view_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		click_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0
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
		if (options.types) {
			options.type = {
				[Op.in]: options.types.split(",")
			};
		}
		if(options.keyword){
			options.title= {
				[Op.iLike]:options.keyword
			};
		}
		delete options.keyword;
		delete options.types;

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
	transform :(params) => {
		const transformed = {};
		const fields = [
			"id",
			"url",
			"type",
			"title",
			"content",
			"position",
			"image_url",
			"mobile_url",
			"view_count",
			"click_count",
			"is_active",
			"is_visible",
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
	getChangedProperties : ({ newModel, oldModel }) => {
		const changedProperties = [];
		const allChangableProperties = [
			"url",
			"type",
			"title",
			"content",
			"position",
			"image_url",
			"mobile_url",
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
module.exports=Banner;
// const Banner = Sequelize.define("banner", {
// 	title: Sequelize.STRING,
// 	content: Sequelize.TEXT,
// 	votes: Sequelize.INTEGER,
// 	author: Sequelize.INTEGER,
// 	status: Sequelize.BOOLEAN},
// {
// 	// Other model options go here
// });
// exports.Banner;