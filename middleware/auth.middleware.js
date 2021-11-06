import User from "../../common/models/user.model";

const httpStatus = require("http-status");
const jsonwentoken = require("jsonwebtoken");
const APIError = require("./ApiError");

const ConsumerGroups = {
	/** Service group with all permissions */
	SERVICE: "service",
	/** Staff group with RBAC permissions */
	STAFF: "staff",
	/** User group with all permissions if granted */
	USER: "user",
	/** Guest group */
	GUEST: "guest"
};

/**
 * Configuration for authentication module
 * @type {Object}
 */
const Configs = {
	/** Default permission for user */
	PERMISSION_USER: "user",

	/** Default permission for staff */
	PERMISSION_LOGGED_IN: "staff",

	/** Default permission for all provider */
	PERMISSION_ADMINISTRATOR: "administrator",

	/** Custom header name */
	HEADER_NAME: "Authorization",

	/** Include scheme in header */
	HEADER_INCLUDE_SCHEME: true,

	getStaffPermissions: async (staffId) => {
		console.log("staffId", staffId);
		const user = await User.get(staffId);
		console.log("as", user);
		return user.permissions;
	}
};

const HEADER_REGEX = /(\S+)\s+(\S+)/;

/**
 * Get authentication infomation from auth header
 *
 * @param {*} headerValue
 * @returns {Object}
 */
function parseAuthHeader(headerValue) {
	if (typeof headerValue !== "string") {
		return null;
	}
	if (Configs.HEADER_INCLUDE_SCHEME) {
		const matches = headerValue.match(HEADER_REGEX);
		return (
			matches && { scheme: matches[1].trim(), value: matches[2].trim() }
		);
	}
	return {
		scheme: "Bearer",
		value: headerValue.trim()
	};
}

/**
 * Get User info from jwt payload
 *
 * @param {Object} jwtPayload
 * @returns {Object}
 */
function getUserFromJwtPayload(jwtPayload) {
	const user = {
		id: jwtPayload.sub,
		name: jwtPayload.name,
		phone: jwtPayload.phone,
		email: jwtPayload.email,
		avatar: jwtPayload.avatar,
		group: jwtPayload.group
	};
	return user;
}

/**
 * Check if staff have all requested permission in jwt payload
 *
 * @param {Request} req
 * @param {Array}  requestedPermissions
 *
 * @returns {Boolean}
 */
function checkStaffPermission(req, requestedPermissions) {
	// not allow when permissions null
	if (requestedPermissions.length === 0) {
		return false;
	}

	// check special requested permissions (LoggedIn)
	if (requestedPermissions.includes(Configs.PERMISSION_LOGGED_IN)) {
		return true;
	}

	// check service permissions
	const { permissions } = req.user;
	if (!Array.isArray(permissions) || permissions.length === 0) {
		return false;
	}

	// check special permission (administrator))
	if (permissions.includes(Configs.PERMISSION_ADMINISTRATOR)) {
		return true;
	}

	const deniedPermissions = requestedPermissions.filter(
		(permission) => !permissions.includes(permission)
	);
	return deniedPermissions.length === 0;
}

/**
 * Get JWT payload from authorization header
 *
 * @param {Request} req
 */
const getTokenInfo = (req) => {
	let jwt = req.get(Configs.HEADER_NAME);
	if (!jwt) {
		return null;
	}
	jwt = parseAuthHeader(jwt);
	if (jwt === null) {
		return null;
	}
	jwt.payload = jsonwentoken.decode(jwt.value, { json: true });
	return jwt;
};

/**
 * Get authentication info from group
 *
 * @param {Request} req
 */
const getAuthInfo = (req) => {
	// console.log(req.headers);
	const { user } = req;
	const isAnonymous = (req.get("X-Anonymous-Consumer") || "false") === "true";
	const consumerGroups = user ? [user.group] : [];
	// Check accessLevel
	let accessLevel = ConsumerGroups.GUEST;
	console.log("consumerGroups", consumerGroups);
	const allAccessLevels = Object.values(ConsumerGroups);
	for (let index = 0; index < allAccessLevels.length; index += 1) {
		if (consumerGroups.includes(allAccessLevels[index])) {
			accessLevel = allAccessLevels[index];
			break;
		}
	}

	return {
		client: req.get("X-Consumer-Username") || null,
		clientId: req.get("X-Consumer-Custom-Id") || null,
		consumerId: req.get("X-Consumer-ID") || null,
		isAnonymous,
		accessLevel
	};
};

/**
 * Load auth info to request
 *
 * @param {Request} req
 */
const loadInfo = async (req) => {
	let user = null;
	let tokenInfo = getTokenInfo(req);
	if (tokenInfo === null || !tokenInfo.payload) {
		tokenInfo = null;
	} else {
		user = getUserFromJwtPayload(tokenInfo.payload);
	}
	req.user = user;
	req.tokenInfo = tokenInfo;
	req.authInfo = getAuthInfo(req);

	console.log(user);
	// load permission for staff
	if (req.authInfo.accessLevel === ConsumerGroups.STAFF && user !== null) {
		req.user.permissions = await Configs.getStaffPermissions(
			user.id
		);
	}
	console.log("req.authInfo", req.authInfo);
	console.log("user1", req.user);
};

/**
 * Check user has required permission
 *
 * @param {Request} req
 * @param {Array} permissions
 * @param {Function} additionalCheck
 */
const checkPermission = async (req, permissions, additionalCheck) => {
	const apiError = new APIError({
		message: "Unauthorized",
		status: httpStatus.UNAUTHORIZED,
		stack: undefined
	});
	console.log("permission", permissions);
	/** service permission required */
	const permissionsToCheck = Array.isArray(permissions)
		? permissions.slice(0)
		: [];
	console.log("permissionsToCheck", permissionsToCheck);
	// allow if require no permission
	if (permissionsToCheck.length === 0) {
		return null;
	}

	// get user permission userPermissionIndex in permission array
	const userPermissionIndex = permissionsToCheck.indexOf(
		Configs.PERMISSION_USER
	);
	console.log("userPermissionIndex", userPermissionIndex);
	console.log("accessleveol", req.authInfo);
	switch (req.authInfo.accessLevel) {
		case ConsumerGroups.SERVICE:
			// allow all access with service level
			return null;
		case ConsumerGroups.STAFF:
			// remove user permission
			if (userPermissionIndex !== -1) {
				permissionsToCheck.splice(userPermissionIndex, 1);
			}
			if (!checkStaffPermission(req, permissionsToCheck)) {
				apiError.status = httpStatus.FORBIDDEN;
				apiError.message = "Forbidden";
				return apiError;
			}
			break;
		case ConsumerGroups.USER:
			if (permissionsToCheck.indexOf(Configs.PERMISSION_USER) === -1) {
				apiError.status = httpStatus.FORBIDDEN;
				apiError.message = "Forbidden";
				return apiError;
			}
			break;
		default:
			// reject guest access
			return apiError;
	}

	// check permission by additionalCheck (only user and staff)
	if (additionalCheck && !(await additionalCheck(req))) {
		apiError.status = httpStatus.FORBIDDEN;
		apiError.message = "Forbidden";
		return apiError;
	}
	return null;
};

/**
 * Handle JWT token
 *
 * @param {Request}     req
 * @param {Response}    res
 * @param {Function}    next
 * @param {Array}       permissions user-config permission
 * @param {Function}    additionalCheck additional checking function
 */
const handleJWT = async (
	req,
	res,
	next,
	permissions,
	additionalCheck = null,
	includeCheckPermission = true
) => {
	// Load auth info to request
	await loadInfo(req);

	if (!includeCheckPermission) {
		return next();
	}
	// check user permission
	const permissionCheckResult = await checkPermission(
		req,
		permissions,
		additionalCheck
	);
	console.log("end", permissionCheckResult);
	if (permissionCheckResult) {
		// Throw permission error
		return next(permissionCheckResult);
	}
	return next();
};

/**
 * Authenticate middleware with express
 *
 * @param {Array}    permissions
 * @param {Function} additionalCheck
 * @param {Boolean} includeCheckPermission
 */
const authorize = (permissions, additionalCheck, includeCheckPermission) => (
	req,
	res,
	next
) =>
	handleJWT(
		req,
		res,
		next,
		permissions,
		additionalCheck,
		includeCheckPermission
	);

module.exports = {
	ConsumerGroups,
	Configs,
	getAuthInfo,
	getTokenInfo,
	authorize,
	checkStaffPermission
};
