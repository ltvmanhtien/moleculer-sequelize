const { pick } =require("lodash");
const Moment =require("moment-timezone");
const JWT =require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;
// import { handler as ErrorHandler } from "./error";
const  User =require("../model/user.model");
const serviceName = require("../utils/service-name");

exports.getUserByPhoneOrEmail = async ({ ctx,phone, email, validate = false }) => {
	
	let user = null;
	if (phone) {
		user = await User.findOne({
			where: {
				is_active: true,
				phone: phone
			}
		});
	}
	if (email) {
		user = await User.findOne({
			where: {
				is_active: true,
				email: email,
			}
		});
	}
	if (!user) {
		throw new MoleculerError("Tài khoản chưa được kích hoạt!", 400, "Tài khoản chưa được kích hoạt!", {
			status:404,
			message: "Không tìm thấy tài khoản này!"
		});
	}
	if (validate) {
		if (user.status === User.Statuses.INACTIVE) {
			throw new MoleculerError("Tài khoản chưa được kích hoạt!", 400, "Tài khoản chưa được kích hoạt!", {
				message: "Tài khoản chưa được kích hoạt!",
				status: 401
			});
		}
		if (user.status === User.Statuses.BANNED) {
			throw new MoleculerError("Tài khoản chưa được kích hoạt!", 400, "Tài khoản chưa được kích hoạt!", {
				message: "Tài khoản đã bị khoá!",
				status: 401
			});
		}
	}
	return user;
	
};
/**
 * Load item by id add to req locals.
 */
exports.load = async (ctx) => {
	try {
		const user = await ctx.call(`${serviceName.User}.get`,{id:ctx.params.id});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.user = user;
	} catch (ex) {
		throw new MoleculerError("NOT FIND USER", 404, "NOT_FOUND", ex);
	}
};

/**
 * Load count for filter.
 */
exports.count = async (ctx) => {
	try {
		const {
			roles,
			types,
			groups,
			stores,
			provinces,
			staffs,
			genders,
			statuses,
			services,
			keyword,
			min_created_at,
			max_created_at,
			min_last_purchase,
			max_last_purchase,
			min_total_order_price,
			max_total_order_price,
			min_total_invoice_price,
			max_total_invoice_price,
			min_total_point,
			max_total_point,
			min_total_debt,
			max_total_debt,
		
			// sort condition
			skip = 0,
			limit = 20,
			sort_by = "desc",
			order_by = "created_at",
		}=ctx.params;
		const filterParam=User.filterConditions(
			roles,
			types,
			groups,
			stores,
			provinces,
			staffs,
			genders,
			statuses,
			services,
			keyword,
			min_created_at,
			max_created_at,
			min_last_purchase,
			max_last_purchase,
			min_total_order_price,
			max_total_order_price,
			min_total_invoice_price,
			max_total_invoice_price,
			min_total_point,
			max_total_point,
			min_total_debt,
			max_total_debt,
		
		);
		const count = await  ctx.call(`${serviceName.User}.count`,{query:filterParam});
		ctx.locals = ctx.locals ? ctx.locals : {};
		ctx.locals.count = count;
	} catch (ex) {
		throw new MoleculerError(ex, 501, "ERR_SOMETHING", { message:ex.message });
	}
};

/**
 * Load item by id add to req locals.
 */
exports.checkEmail = async (ctx) => {
	try {
		const user = await ctx.call(`${serviceName.User}.getUserByEmail`,{email:ctx.params.email});
		console.log("aa",user);
		// User.findOne({ email: req.body.email });
		if (user) {
			throw new MoleculerError("EMAIL EXIST", 400, "EMAIL EXIST", { message: "email have aldready exist", code:400 });
			//return res.status(400).json({ message: "email have aldready exist" });
		}
	} catch (ex) {
		throw new MoleculerError("EMAIL EXIST", 400, "EMAIL EXIST", { message: "somthing happend", code:400 });
	}
};
exports.loadUser = async (ctx) => {
	try {
		//const user = await User.findOne({ email: req.body.email });
		const user = await ctx.call(`${serviceName.User}.getUserByEmail`,{email:ctx.params.email});
		console.log(user);
		if (!user) {
			throw new MoleculerError("EMAIL NOT EXIST", 400, "EMAIL NOT EXIST", { message: "email or password not correct", code:400 });
		}
		ctx.locals = {
			user
		};
	} catch (ex) {
		throw new MoleculerError(ex, 501, "ERR_SOMETHING", { message:"err_something" });
	}
};
exports.checkPassword = async (req, res, next) => {
	const { user } = req.locals;
	const isCheck = await user.passwordMatch(req.body.password);
	if (!isCheck) {
		return res.status(400).json({ message: "email or password incorrect" });
	}
	return next();
};
exports.genarateToken = async (req, res, next) => {
	let user = null;
	user = pick(req.locals.user, ["name", "avatar", "email", "phone", "group"]);
	user.sub = req.locals.user._id;

	req.locals = {
		user
	};
	const inforToken = {};

	inforToken.token = JWT.sign(user, process.env.NODE_ENV || "development", { expiresIn: 60 * 60 });
	inforToken.refresToken = JWT.sign(user, process.env.PORT || "3002", { expiresIn: 60 * 60 * 100 });
	inforToken.expTime = Moment.tz(new Date(), "Asia/Ho_Chi_Minh").unix();
	inforToken.expRefreshTime = Moment.tz(new Date(), "Asia/Ho_Chi_Minh").unix();
	req.locals.token = inforToken;
	return next();
};
// exports.loginFacebook= async (req,res,next)=>{

// }
