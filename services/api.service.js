"use strict";

const ApiGateway = require("moleculer-web");
const SERVICE=require("../utils/service-name");
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
	settings: {
		// Exposed port
		port: process.env.PORT_API || 3000,
		cors: {
			origin: "*",
			methods: ["GET", "OPTIONS", "POST","PATCH","PUT", "DELETE"],
			allowedHeaders: "*",
			//exposedHeaders: "*",
			credentials: true,
			maxAge: null
		},
		// Exposed IP
		ip: "0.0.0.0",

		// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
		use: [],

		routes: [
			{
				path: "/api/v1",

				whitelist: [
					"**"
				],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: true,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: true,

				// The auto-alias feature allows you to declare your route alias directly in your services.
				// The gateway will dynamically build the full routes from service schema.
				autoAliases: true,

				aliases: {
					"POST /banners": `${SERVICE.Banner}.created`,
					"PUT /banners/:id": `${SERVICE.Banner}.updated`,
					// "GET /banners": `${SERVICE.Banner}.geted`,

					"GET /banners/:id": `${SERVICE.Banner}.get1`,
					"DELETE /banners/:id": `${SERVICE.Banner}.deleted`,

					"POST /products": `${SERVICE.Product}.created`,
					"PUT /products/:id": `${SERVICE.Product}.updated`,
					"PATCH /products/:id/block": `${SERVICE.Product}.block`,
					"DELETE /products/:id": `${SERVICE.Product}.deleted`,
					
					"GET /product-options/:id": `${SERVICE.ProductOption}.get1`,
					"POST /product-options": `${SERVICE.ProductOption}.created`,
					"PUT /product-options/:id": `${SERVICE.ProductOption}.updated`,
					"DELETE /product-options/:id": `${SERVICE.ProductOption}.deleted`,
					"GET /product-options": `${SERVICE.ProductOption}.geted`,
					// "POST /product-options": `${SERVICE.ProductOption}.created`,

					"POST /categories": `${SERVICE.Category}.created`,
					"PUT /categories/:id": `${SERVICE.Category}.updated`,
					"GET /categories/:id": `${SERVICE.Category}.get1`,
					"DELETE /categories/:id": `${SERVICE.Category}.deleted`,

					"POST /users": `${SERVICE.User}.created`,
					"PUT /users/:id": `${SERVICE.User}.updated`,
					"GET /users": `${SERVICE.User}.geted`,
					"GET /users/:id": `${SERVICE.User}.get1`,
					"DELETE /users/:id": `${SERVICE.User}.deleted`,
					
					"POST /stores": `${SERVICE.Store}.created`,
					"PUT /stores/:id": `${SERVICE.Store}.updated`,
					"GET /stores": `${SERVICE.Store}.geted`,
					"GET /stores/:id": `${SERVICE.Store}.get1`,
					"DELETE /stores/:id": `${SERVICE.Store}.deleted`,

					"POST /orders": `${SERVICE.Order}.created`,
					"POST /orders/:id/complete": `${SERVICE.Order}.completed`,
					"PATCH /orders/:id": `${SERVICE.Order}.updated`,
					"GET /orders": `${SERVICE.Order}.geted`,
					"DELETE /orders/:id": `${SERVICE.Order}.deleted`,


					"POST /price-books": `${SERVICE.PriceBook}.created`,
					"PUT /price-books/:id": `${SERVICE.PriceBook}.updated`,
					"GET /price-books": `${SERVICE.PriceBook}.geted`,
					"DELETE /price-books/:id": `${SERVICE.PriceBook}.deleted`,

					"GET /stock-histories": `${SERVICE.StockHistory}.geted`,

					
					"POST /attribute-values": `${SERVICE.AttributeValue}.created`,
					"PUT /attribute-values/:id": `${SERVICE.AttributeValue}.updated`,
					"GET /attribute-values/:id": `${SERVICE.AttributeValue}.get1`,
					"DELETE /attribute-values/:id": `${SERVICE.AttributeValue}.deleted`,

					"POST /provinces":`${SERVICE.Province}.created`,
					"PUT /provinces/:id":`${SERVICE.Province}.updated`,
					"DELETE /provinces/:id":`${SERVICE.Province}.deleted`,
					
					"POST /districts":`${SERVICE.District}.created`,
					"PUT /districts/:id":`${SERVICE.District}.updated`,
					"DELETE /districts/:id":`${SERVICE.District}.deleted`,

					"POST /wards":`${SERVICE.Ward}.created`,
					"PUT /wards/:id":`${SERVICE.Ward}.updated`,
					"DELETE /wards/:id":`${SERVICE.Ward}.deleted`,

					"POST /promotions":`${SERVICE.Promotion}.created`,
					"PUT /promotions/:id":`${SERVICE.Promotion}.updated`,
					"DELETE /promotions/:id":`${SERVICE.Promotion}.deleted`,
					"POST /promotions/:id/finish":`${SERVICE.Promotion}.finish`,
					"POST /promotions/:id/block":`${SERVICE.Promotion}.block`,
					"POST /promotions/:id/active":`${SERVICE.Promotion}.active`,
					"POST /promotions/:id/cancel":`${SERVICE.Promotion}.cancel`,
					// "POST /users/register": `${SERVICE.User}.register`,
					// "PUT /users/:id": `${SERVICE.User}.updated`,
					// "GET /users": `${SERVICE.User}.geted`,
					// "GET /users/:id": `${SERVICE.User}.get1`,
					// "DELETE /users/:id": `${SERVICE.User}.deleted`,
				},

				/** 
				 * Before call hook. You can check the request.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				 * 
				 * 
				 * */
				onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				},

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callingOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: "25MB"
					},
					urlencoded: {
						extended: true,
						limit: "25MB"
					}
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true
			},
			{
				path: "/api/v1",

				whitelist: [
					"**"
				],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: false,

				// // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: false,

				// The auto-alias feature allows you to declare your route alias directly in your services.
				// The gateway will dynamically build the full routes from service schema.
				autoAliases: true,

				aliases: {
					"GET /banners": `${SERVICE.Banner}.geted`,

					"GET /products": `${SERVICE.Product}.geted`,
					"GET /products/:id": `${SERVICE.Product}.get1`,
					
					"GET /provinces":`${SERVICE.Province}.geted`,
					"GET /provinces/:id":`${SERVICE.Province}.get1`,

					"GET /districts":`${SERVICE.District}.geted`,
					"GET /districts/:id":`${SERVICE.District}.get1`,

					"GET /wards":`${SERVICE.District}.geted`,
					"GET /wards/:id":`${SERVICE.District}.get1`,

					"GET /categories": `${SERVICE.Category}.geted`,

					"GET /orders/:id": `${SERVICE.Order}.get1`,

					"POST /users/register": `${SERVICE.User}.register`,
					
					"POST /auth/login-token": `${SERVICE.Auth}.login`,

					"GET /attribute-values":`${SERVICE.AttributeValue}.geted`,

					"GET /promotions":`${SERVICE.Promotion}.geted`,
					"GET /promotions/:id":`${SERVICE.Promotion}.get1`,
					
					"POST /job/promotion/add":"job-worker.addPromotion",
					"GET /job/welcome1":"job-worker.welcome1"
				},

				/** 
				 * Before call hook. You can check the request.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				 * 
				onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				}, */

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callingOptions: {},

				bodyParsers: {
					json: true,
					urlencoded: {
						extended: true,
						limit: "25MB"
					}
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "retrict", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true
			}
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,


		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {}
		}
	},

	methods: {
		/**
		 * Authenticate the request. It check the `Authorization` token value in the request header.
		 * Check the token value & resolve the user by the token.
		 * The resolved user will be available in `ctx.meta.user`
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authenticate(ctx, route, req) {
			// Read the token from header
			const token = req.headers["authorization"];

			if (token && token.startsWith("Bearer")) {


				// Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
				const decode = await ctx.call(`${SERVICE.Auth}.verifyToken`, { token });
				if (decode) {
					// console.log(decode);
					req.body.user = decode;
					
				}
				else {
					// Invalid token
					throw new ApiGateway.Errors.ForbiddenError(ApiGateway.Errors.ERR_INVALID_TOKEN);
				}

			} else {
				// No token. Throw an error or do nothing if anonymous access is allowed.
				throw new ApiGateway.Errors.ForbiddenError(ApiGateway.Errors.ERR_NO_TOKEN);
				// return null;
			}
		},

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authorize(ctx, route, req) {
			// Get the authenticated user.
			const user = req.body.user;
			user.id=user.sub;
			if (req.$action.auth !== "required" && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
			
			ctx.meta.user = user;
			let userGet=await ctx.call(`${SERVICE.User}.get`,{id:user.sub});
			let listPermission=userGet.permissions;
			let requirePermission=req.$action.authen;
			if (!requirePermission){
				requirePermission=[];
			}

			// check
			let checker=false;
			if(requirePermission.every(r => listPermission.includes(r))){
				checker=true;
			}else{
				checker=false;
			}
			// check admin
			if(userGet.role &&userGet.role.name==="System admin"){
				checker=true;
				console.log("admin");
			}
			console.log("dasdasd",checker);
			if (!req.$action.authen || !checker) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
		}
	}
};
