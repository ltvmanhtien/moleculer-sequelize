// import { serviceName } from "../../config/vars";
const serviceName="cocolux_product_service";

module.exports={
	// Service Permission
	USER: "user",
	LOGGED_IN: "staff",

	// For Product Route
	PRODUCT_VIEW: `${serviceName}_product_view`,
	PRODUCT_CREATE: `${serviceName}_product_create`,
	PRODUCT_UPDATE: `${serviceName}_product_update`,
	PRODUCT_DELETE: `${serviceName}_product_delete`,

	// For Category Route
	CATEGORY_VIEW: `${serviceName}_category_view`,
	CATEGORY_CREATE: `${serviceName}_category_create`,
	CATEGORY_UPDATE: `${serviceName}_category_update`,
	CATEGORY_DELETE: `${serviceName}_category_delete`,

	// For Order Route
	ORDER_VIEW: `${serviceName}_order_view`,
	ORDER_CREATE: `${serviceName}_order_create`,
	ORDER_UPDATE: `${serviceName}_order_update`,

	// For Import Route
	IMPORT_VIEW: `${serviceName}_import_view`,
	IMPORT_CREATE: `${serviceName}_import_create`,
	IMPORT_UPDATE: `${serviceName}_import_update`,
	IMPORT_DELETE: `${serviceName}_import_delete`,

	// For Export Route
	EXPORT_VIEW: `${serviceName}_export_view`,
	EXPORT_CREATE: `${serviceName}_export_create`,
	EXPORT_UPDATE: `${serviceName}_export_update`,
	EXPORT_DELETE: `${serviceName}_export_delete`,

	// For Stock Take Route
	STOCK_TAKE_VIEW: `${serviceName}_stock_take_view`,
	STOCK_TAKE_CREATE: `${serviceName}_stock_take_create`,
	STOCK_TAKE_UPDATE: `${serviceName}_stock_take_update`,
	STOCK_TAKE_DELETE: `${serviceName}_stock_take_delete`,

	// For Province Route
	PROVINCE_VIEW: `${serviceName}_province_view`,
	PROVINCE_CREATE: `${serviceName}_province_create`,
	PROVINCE_UPDATE: `${serviceName}_province_update`,
	PROVINCE_DELETE: `${serviceName}_province_delete`,

	// For District Route
	DISTRICT_VIEW: `${serviceName}_district_view`,
	DISTRICT_CREATE: `${serviceName}_district_create`,
	DISTRICT_UPDATE: `${serviceName}_district_update`,
	DISTRICT_DELETE: `${serviceName}_district_delete`,

	// For Ward Route
	WARD_VIEW: `${serviceName}_ward_view`,
	WARD_CREATE: `${serviceName}_ward_create`,
	WARD_UPDATE: `${serviceName}_ward_update`,
	WARD_DELETE: `${serviceName}_ward_delete`,

	// For Banner Route
	BANNER_VIEW: `${serviceName}_banner_view`,
	BANNER_CREATE: `${serviceName}_banner_create`,
	BANNER_UPDATE: `${serviceName}_banner_update`,
	BANNER_DELETE: `${serviceName}_banner_delete`,

	// For Banner Route
	VOUCHER_VIEW: `${serviceName}_voucher_view`,
	VOUCHER_CREATE: `${serviceName}_voucher_create`,
	VOUCHER_UPDATE: `${serviceName}_voucher_update`,
	VOUCHER_DELETE: `${serviceName}_voucher_delete`,

	// For Payment Route
	PAYMENT_VIEW: `${serviceName}_payment_view`,
	PAYMENT_CREATE: `${serviceName}_payment_create`,
	PAYMENT_UPDATE: `${serviceName}_payment_update`,
	PAYMENT_DELETE: `${serviceName}_payment_delete`,

	// For price book Route
	PRICE_VIEW: `${serviceName}_price_view`,
	PRICE_CREATE: `${serviceName}_price_create`,
	PRICE_UPDATE: `${serviceName}_price_update`,
	PRICE_DELETE: `${serviceName}_price_delete`,

	// For Delivery Route
	DELIVERY_VIEW: `${serviceName}_delivery_view`,
	DELIVERY_CREATE: `${serviceName}_delivery_create`,
	DELIVERY_UPDATE: `${serviceName}_delivery_update`,
	DELIVERY_DELETE: `${serviceName}_delivery_delete`,

	// For Delivery Route
	DELIVERY_PAYMENT_VIEW: `${serviceName}_delivery_payment_view`,
	DELIVERY_PAYMENT_CREATE: `${serviceName}_delivery_payment_create`,
	DELIVERY_PAYMENT_UPDATE: `${serviceName}_delivery_payment_update`,
	DELIVERY_PAYMENT_DELETE: `${serviceName}_delivery_payment_delete`,

	// For Research Route
	RESEARCH_VIEW: `${serviceName}_research_view`,
	RESEARCH_CREATE: `${serviceName}_research_create`,
	RESEARCH_UPDATE: `${serviceName}_research_update`,
	RESEARCH_DELETE: `${serviceName}_research_delete`,

	// For Production Route
	PRODUCTION_VIEW: `${serviceName}_production_view`,
	PRODUCTION_CREATE: `${serviceName}_production_create`,
	PRODUCTION_UPDATE: `${serviceName}_production_update`,
	PRODUCTION_DELETE: `${serviceName}_production_delete`,

	// For Promotion Route
	PROMOTION_VIEW: `${serviceName}_promotion_view`,
	PROMOTION_CREATE: `${serviceName}_promotion_create`,
	PROMOTION_UPDATE: `${serviceName}_promotion_update`
};
