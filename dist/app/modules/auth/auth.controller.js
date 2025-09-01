"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const auth_service_1 = require("./auth.service");
const config_1 = require("../../config");
const catch_async_1 = __importDefault(require("../../utils/serverTools/catch_async"));
const send_response_1 = __importDefault(require("../../utils/serverTools/send_response"));
const create_user = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.body;
    const result = yield auth_service_1.AuthService.create_user(userData);
    (0, send_response_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User successfully created.Check your email for code.",
        data: result,
    });
}));
const user_login = (0, catch_async_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.user_login(req.body);
    res.cookie("refreshToken", result.refresh_token, {
        secure: config_1.appConfig.server.node_env === "production",
        httpOnly: true,
    });
    (0, send_response_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User login successfull",
        data: result,
    });
}));
const verify_user = (0, catch_async_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const result = yield auth_service_1.AuthService.verify_user(email, Number(otp));
    (0, send_response_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Email successfully verified.",
        data: result,
    });
}));
const forgot_password_request = (0, catch_async_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthService.forgot_password_request(email);
    (0, send_response_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "A verification code is sent to your email.",
        data: result,
    });
}));
const reset_password = (0, catch_async_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenWithBearer = req.headers.authorization;
    const token = tokenWithBearer.split(" ")[1];
    const result = yield auth_service_1.AuthService.reset_password(token, req.body);
    (0, send_response_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Password reset successfully",
        data: result,
    });
}));
const get_new_access_token = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const result = yield auth_service_1.AuthService.get_new_access_token(refreshToken);
    (0, send_response_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "New access-token is created.",
    });
}));
const update_password = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.user;
    const result = yield auth_service_1.AuthService.update_password(user_id, req.body);
    (0, send_response_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Password successfully updated",
    });
}));
const re_send_otp = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthService.re_send_otp(email);
    (0, send_response_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Verification Code send successfully",
    });
}));
exports.AuthController = {
    create_user,
    verify_user,
    forgot_password_request,
    reset_password,
    user_login,
    get_new_access_token,
    update_password,
    re_send_otp,
};
