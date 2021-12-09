const {Sequelize,Model,Op,DataTypes} = require("sequelize");
const {pick,omitBy,isNil,values,isUndefined,isEqual,includes} =require("lodash");
const  moment =require("moment-timezone");
class StoreModel extends Model {}
const PUBLIC_FIELDS = [
	"name",
	"phone",
	"email",
	"avatar",
	"address",
	"description",
	"province",
	"district",
	"ward"
];
StoreModel.StatusesName = {
	ACTIVE: "Đang hoạt động",
	INACTIVE: "Ngừng hoạt động",
	BANNED: "Đã khóa"
};
StoreModel.Statuses = {
	INACTIVE: "inactive",
	ACTIVE: "active",
	BANNED: "banned"
};

StoreModel.filterConditions=(params)=>{
	const options = omitBy(params, isNil);
	if(params.keyword){
		options.name={ [Op.iLike]: `%${options.note}%` };
	}
	delete options.keyword;
	return options;
};
StoreModel.transform = (model) => {
	const transformed = {};
	const fields = [
		// attribute
		"id",
		"name",
		"phone",
		"email",
		"avatar",
		"address",
		"description",
		"province",
		"district",
		"ward"
	];

	fields.forEach((field) => {
		transformed[field] = model[field];
	});
	transformed.created_at = moment(model.created_at).unix();
	transformed.updated_at = moment(model.updated_at).unix();

	return transformed;
},

StoreModel.getChangedProperties = ({ newModel, oldModel }) => {
	const changedProperties = [];
	const allChangableProperties = [
		"name",
		"phone",
		"email",
		"avatar",
		"address",
		"description",
		"province",
		"district",
		"ward"
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
};

const Store={
	name:"tbl_stores",
	define:{
		name: {
			type: DataTypes.STRING(155),
			allowNull: false
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
		address:{
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		description:{
			type: DataTypes.STRING(255),
			defaultValue: null
		},
		condinate:{
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
		status:{
			type:DataTypes.STRING(50),
			defaultValue: StoreModel.Statuses.ACTIVE
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		is_visible: {
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
		created_by: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {
				id: null,
				name: null
			}
		}
	},
	transform:StoreModel.transform,
	getChangedProperties:StoreModel.getChangedProperties,
	filterConditions:(params) =>{
		const options = omitBy(params, isNil);
		return options;
	},
	filterParams :(params) => pick(params, PUBLIC_FIELDS)
};
module.exports=Store;