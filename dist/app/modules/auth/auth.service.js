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
exports.AuthService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const user_profile_model_1 = require("../users/user_profile/user_profile.model");
const get_expiry_time_1 = __importDefault(require("../../utils/helper/get_expiry_time"));
const get_otp_1 = __importDefault(require("../../utils/helper/get_otp"));
const get_hashed_password_1 = __importDefault(require("../../utils/helper/get_hashed_password"));
const config_1 = require("../../config");
const mongoose_1 = __importDefault(require("mongoose"));
const publisher_1 = require("../../lib/rabbitMq/publisher");
const jwt_1 = require("../../utils/jwt/jwt");
const generate_token_1 = require("../../helperFunction/general/generate_token");
const validate_otp_1 = require("../../helperFunction/general/validate_otp");
const expires_at = (0, get_expiry_time_1.default)(10);
const create_user = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const isExist = yield user_model_1.default.findOne({ email: data.email }).session(session);
        if (isExist && isExist.is_verified === true) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User already exist");
        }
        if (isExist && isExist.is_verified === false) {
            yield user_model_1.default.findOneAndDelete({ _id: isExist._id }).session(session);
            yield user_profile_model_1.UserProfile.findOneAndDelete({ user: isExist._id }).session(session);
        }
        const hashedPassword = yield (0, get_hashed_password_1.default)(data.password);
        const otp = (0, get_otp_1.default)(4);
        const user_data = {
            email: data.email,
            password: hashedPassword,
            authentication: { otp, expires_at },
        };
        const created_user = yield user_model_1.default.create([Object.assign(Object.assign({}, user_data), { role: data.role })], {
            session,
        });
        const user_profile_data = {
            full_name: data.full_name,
            user: created_user[0]._id,
        };
        yield user_profile_model_1.UserProfile.create([user_profile_data], { session });
        yield (0, publisher_1.publish_job)("emailQueue", {
            to: data.email,
            subject: "Email Verification Code",
            body: otp.toString(),
        });
        yield session.commitTransaction();
        session.endSession();
        return {
            email: created_user[0].email,
            is_verified: created_user[0].is_verified,
            user_id: created_user[0]._id,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const user_login = (login_data) => __awaiter(void 0, void 0, void 0, function* () {
    // Select only needed fields + password
    const user = yield user_model_1.default.findOne({ email: login_data.email })
        .select("email role password is_verified")
        .lean(); // returns plain JS object, faster than Mongoose doc
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your email");
    }
    if (!user.is_verified) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please verify your email.");
    }
    // Use the model instance to compare password
    const user_doc = yield user_model_1.default.findById(user._id).select("+password"); // only for comparePassword
    const is_pass_match = yield user_doc.comparePassword(login_data.password);
    if (!is_pass_match) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your password.");
    }
    const jwt_payload = {
        user_email: user.email,
        user_id: user._id.toString(),
        user_role: user.role,
    };
    const { access_token, refresh_token, access_token_valid_till, refresh_token_valid_till, } = (0, generate_token_1.generate_tokens)(jwt_payload);
    return {
        access_token,
        refresh_token,
        access_token_valid_till,
        refresh_token_valid_till,
        user_id: user._id.toString(),
        email: user.email,
        role: user.role,
    };
});
const verify_email = (user_id, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP is required. Check your email.");
    }
    const user = yield user_model_1.default.findOne({ _id: user_id });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found.");
    }
    (0, validate_otp_1.validate_otp)(otp.toString(), user.authentication);
    user.authentication.otp = null;
    user.authentication.expires_at = null;
    user.is_verified = true;
    const updated_user = yield user.save();
    const jwtPayload = {
        user_email: user.email,
        user_id: user._id,
        user_role: user.role,
    };
    const { access_token, refresh_token, access_token_valid_till, refresh_token_valid_till, } = (0, generate_token_1.generate_tokens)(jwtPayload);
    return {
        user_id: updated_user._id.toString(),
        email: updated_user.email,
        is_verified: updated_user.is_verified,
        access_token,
        refresh_token,
        access_token_valid_till,
        refresh_token_valid_till,
    };
});
const verify_reset = (user_id, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Give the Code. Check your email.");
    }
    const user = yield user_model_1.default.findOne({ _id: user_id });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    (0, validate_otp_1.validate_otp)(otp.toString(), user.authentication);
    const token = jwt_1.json_web_token.generate_jwt_token({ user_email: user.email, user_id: user._id }, config_1.app_config.jwt.jwt_access_secret, "10m");
    const updated_user = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
        "authentication.otp": null,
        "authentication.expires_at": expires_at,
        need_to_reset_password: true,
        "authentication.token": token,
    }, { new: true });
    return {
        user_id: updated_user === null || updated_user === void 0 ? void 0 : updated_user._id,
        email: updated_user === null || updated_user === void 0 ? void 0 : updated_user.email,
        need_to_reset_password: updated_user === null || updated_user === void 0 ? void 0 : updated_user.need_to_reset_password,
        token: token,
    };
});
const forgot_password_request = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Email not found.");
    }
    const otp = (0, get_otp_1.default)(4);
    const data = {
        otp: otp,
        expires_at: expires_at,
        need_to_reset_password: false,
        token: null,
    };
    yield (0, publisher_1.publish_job)("emailQueue", {
        to: email,
        subject: "Reset Password Verification Code",
        body: otp.toString(),
    });
    yield user_model_1.default.findOneAndUpdate({ email }, { authentication: data }, { new: true });
    return { email: user.email, user_id: user._id };
});
const reset_password = (token, user_data) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password } = user_data;
    if (!token) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not allowed to reset password.");
    }
    const user = yield user_model_1.default.findOne({ "authentication.token": token });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found.");
    }
    const current_date = new Date();
    const expiration_date = new Date(user.authentication.expires_at);
    if (current_date > expiration_date) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Token expired.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and confirm password doesn't match!");
    }
    const decoded = jwt_1.json_web_token.verify_jwt_token(token, config_1.app_config.jwt.jwt_access_secret);
    console.log(decoded, token);
    const hashed_password = yield (0, get_hashed_password_1.default)(new_password);
    const update_data = yield user_model_1.default.findOneAndUpdate({ email: decoded.user_email }, {
        password: hashed_password,
        authentication: { otp: null, token: null, expires_at: null },
        need_to_reset_password: false,
    }, { new: true });
    if (!update_data) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to reset password. Try again.");
    }
    return { email: update_data === null || update_data === void 0 ? void 0 : update_data.email, user_id: user._id };
});
const get_new_access_token = (refresh_token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!refresh_token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token not found.");
    }
    const decoded = jwt_1.json_web_token.verify_jwt_token(refresh_token, config_1.app_config.jwt.jwt_refresh_secret);
    const { user_email, user_id, user_role } = decoded;
    if (user_email && user_id && user_role) {
        const jwt_payload = {
            user_email,
            user_id,
            user_role,
        };
        const access_token = jwt_1.json_web_token.generate_jwt_token(jwt_payload, config_1.app_config.jwt.jwt_access_secret, config_1.app_config.jwt.jwt_access_expire);
        return { access_token };
    }
    else {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are unauthorized.");
    }
});
const update_password = (user_id, pass_data) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password, old_password } = pass_data;
    const user = yield user_model_1.default.findById(user_id).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const is_pass_match = yield user.comparePassword(old_password);
    if (!is_pass_match) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Old password not matched.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hashed_password = yield (0, get_hashed_password_1.default)(new_password);
    if (!hashed_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update password. Try again.");
    }
    user.password = hashed_password;
    yield user.save();
    return { email: user.email, user_id: user._id };
});
const re_send_otp = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Step 1: Find user
    const user_data = yield user_model_1.default.findById(user_id).select("email authentication.otp");
    if (!user_data) {
        throw new AppError_1.default(404, "User not found.");
    }
    // Step 2: Validate existing OTP
    if (!((_a = user_data.authentication) === null || _a === void 0 ? void 0 : _a.otp)) {
        throw new AppError_1.default(400, "No expired code found.");
    }
    // Step 3: Generate new OTP
    const otp = (0, get_otp_1.default)(4);
    // Step 4: Update OTP + expiry
    user_data.authentication.otp = otp;
    user_data.authentication.expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    yield user_data.save();
    // Step 5: Send email async job
    yield (0, publisher_1.publish_job)("emailQueue", {
        to: user_data.email,
        subject: "Verification Code",
        body: otp.toString(),
    });
    return { message: "Verification code sent." };
});
exports.AuthService = {
    create_user,
    user_login,
    verify_email,
    forgot_password_request,
    reset_password,
    get_new_access_token,
    update_password,
    re_send_otp,
    verify_reset,
};
