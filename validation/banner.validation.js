const Banner =require("../model/banner.model");
const  { values } =require ("lodash");
module.exports = {
	listValidation: {
		// pagging
		skip: {
			type:"string",
			min:0,
			optional:true
		},
		limit:{
			type:"string",
			min:0,
			max:10000,
			optional:true
		},
		sort_by: {
			type:"string",
			enum:[ 
				"created_at",
				"updated_at"
			],
			optional:true
		},
		order_by: {
			type:"string",
			enum:[ 
				"asc",
				"desc"
			],
			optional:true
		},
		// search
		types: {
			type:"string",
			trim:true,
			optional:true
			
		}
	},
	createValidation:{
		url: {
			type:"string",
			max:255,
			trim:true
		},
		type: 
	{
		type:"string",
		enum:values(Banner.Types),
		trim:true,
		optional: true
	},
	
		title: {
			type:"string",
			max:255,
			trim:true,
			optional:true,
			empty:true
		},
		content: {
			type:"string",
			max:255,
			trim:true,
			optional:true,
			empty:true
		},
		position: {
			type:"number",
			integer:true,
			convert:true,
			optional:true,
			default:0
		},
		image_url:{
			type:"string",
			max:255,
			trim:true,
			empty:true
		},
		mobile_url:{
			type:"string",
			max:255,
			trim:true,
			empty:true
		},
		is_visible: {
			type:"boolean",
			default:true,
			empty:true
		},
	},
	updateValidation:{
		url: {
			type:"string",
			max:255,
			trim:true,
			optional: true
		},
		type: 
		{
			type:"string",
			enum:values(Banner.Types),
			trim:true,
			optional: true
		},
		
		title: {
			type:"string",
			max:255,
			trim:true,
			optional:true,
			empty:true
		},
		content: {
			type:"string",
			max:255,
			trim:true,
			optional:true,
			empty:true
		},
		position: {
			type:"number",
			integer:true,
			convert:true,
			optional:true,
		},
		image_url:{
			type:"string",
			max:255,
			trim:true,
			empty:true,
			optional: true
		},
		mobile_url:{
			type:"string",
			max:255,
			trim:true,
			empty:true,
			optional: true
		},
		is_visible: {
			type:"boolean",
			empty:true,
			optional: true
		},
	}
};