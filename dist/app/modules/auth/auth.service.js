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
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const jwt_1 = require("../../utils/jwt/jwt");
const user_profile_model_1 = require("../users/user_profile/user_profile.model");
const get_expiry_time_1 = __importDefault(require("../../utils/helper/get_expiry_time"));
const get_otp_1 = __importDefault(require("../../utils/helper/get_otp"));
const send_email_1 = require("../../utils/send_email");
const get_hashed_password_1 = __importDefault(require("../../utils/helper/get_hashed_password"));
const config_1 = require("../../config");
const mongoose_1 = __importDefault(require("mongoose"));
const is_time_expire_1 = require("../../utils/helper/is_time_expire");
const publisher_1 = require("../../lib/rabbitMq/publisher");
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
        const expDate = (0, get_expiry_time_1.default)(10);
        const userData = {
            email: data.email,
            password: hashedPassword,
            authentication: { otp, exp_date: expDate },
        };
        const createdUser = yield user_model_1.default.create([Object.assign(Object.assign({}, userData), { role: "USER" })], {
            session,
        });
        const userProfileData = {
            full_name: data.full_name,
            user: createdUser[0]._id,
        };
        yield user_profile_model_1.UserProfile.create([userProfileData], { session });
        yield (0, publisher_1.publishJob)("emailQueue", {
            to: data.email,
            subject: "Email Verification Code",
            body: otp.toString(),
        });
        yield session.commitTransaction();
        session.endSession();
        return {
            email: createdUser[0].email,
            is_verified: createdUser[0].is_verified,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const user_login = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.default.findOne({ email: loginData.email }).select("+password");
    if (!userData) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your email");
    }
    if (userData.is_verified === false) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please verify your email.");
    }
    const isPassMatch = yield userData.comparePassword(loginData.password);
    if (!isPassMatch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your password.");
    }
    const jwtPayload = {
        user_email: userData.email,
        user_id: userData._id,
        user_role: userData.role,
    };
    const accessToken = jwt_1.JsonWebToken.generate_token(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_expire);
    const refreshToken = jwt_1.JsonWebToken.generate_token(jwtPayload, config_1.appConfig.jwt.jwt_refresh_secret, config_1.appConfig.jwt.jwt_refresh_expire);
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: userData._id,
        email: userData.email,
    };
});
const verify_user = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Give the Code. Check your email.");
    }
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const expirationDate = user.authentication.exp_date;
    if ((0, is_time_expire_1.is_time_expired)(expirationDate)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code time expired.");
    }
    if (otp !== user.authentication.otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code not matched.");
    }
    let updatedUser;
    let token = null;
    if (user.is_verified) {
        token = jwt_1.JsonWebToken.generate_token({ userEmail: user.email }, config_1.appConfig.jwt.jwt_access_secret, "10m");
        const exp_date = (0, get_expiry_time_1.default)(10);
        updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
            "authentication.otp": null,
            "authentication.exp_date": exp_date,
            need_to_reset_password: true,
            "authentication.token": token,
        }, { new: true });
    }
    else {
        updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
            "authentication.otp": null,
            "authentication.exp_date": null,
            is_verified: true,
        }, { new: true });
    }
    return {
        user_id: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id,
        email: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email,
        is_verified: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.is_verified,
        need_to_reset_password: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.need_to_reset_password,
        token: token,
    };
});
const forgot_password_request = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Email not found.");
    }
    const otp = (0, get_otp_1.default)(4);
    const exp_date = (0, get_expiry_time_1.default)(10);
    const data = {
        otp: otp,
        exp_date: exp_date,
        need_to_reset_password: false,
        token: null,
    };
    yield (0, publisher_1.publishJob)("emailQueue", {
        to: email,
        subject: "Reset Password Verification Code",
        body: otp.toString(),
    });
    yield user_model_1.default.findOneAndUpdate({ email }, { authentication: data }, { new: true });
    return { email: user.email };
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
    const currentDate = new Date();
    const expirationDate = new Date(user.authentication.exp_date);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Token expired.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const decode = jwt_1.JsonWebToken.verify_jwt(token, config_1.appConfig.jwt.jwt_access_secret);
    const hassedPassword = yield (0, get_hashed_password_1.default)(new_password);
    const updateData = yield user_model_1.default.findOneAndUpdate({ email: decode.user_email }, {
        password: hassedPassword,
        authentication: { otp: null, token: null, exp_date: null },
        need_to_reset_password: false,
    }, { new: true });
    if (!updateData) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to reset password. Try again.");
    }
    return { email: updateData === null || updateData === void 0 ? void 0 : updateData.email, user_id: user._id };
});
const get_new_access_token = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!refreshToken) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token not found.");
    }
    const decode = jwt_1.JsonWebToken.verify_jwt(refreshToken, config_1.appConfig.jwt.jwt_refresh_secret);
    const { user_email, user_id, user_role } = decode;
    if (user_email && user_id && user_role) {
        const jwtPayload = {
            user_email: user_email,
            user_id: user_id,
            user_role: user_role,
        };
        const accessToken = jwt_1.JsonWebToken.generate_token(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_expire);
        return { accessToken };
    }
    else {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are unauthorized.");
    }
});
const update_password = (userId, passData) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password, old_password } = passData;
    const user = yield user_model_1.default.findById(userId).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const isPassMatch = yield user.comparePassword(old_password);
    if (!isPassMatch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Old password not matched.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hassedPassword = yield (0, get_hashed_password_1.default)(new_password);
    if (!hassedPassword) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update password. Try again.");
    }
    user.password = hassedPassword;
    yield user.save();
    return { user: user.email, message: "Password successfully updated." };
});
const re_send_otp = (userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.default.findOne({ email: userEmail });
    if (!(userData === null || userData === void 0 ? void 0 : userData.authentication.otp)) {
        throw new AppError_1.default(500, "Don't find any expired code");
    }
    const OTP = (0, get_otp_1.default)(4);
    const updateUser = yield user_model_1.default.findOneAndUpdate({ email: userEmail }, {
        $set: {
            "authentication.otp": OTP,
            "authentication.expDate": new Date(Date.now() + 10 * 60 * 1000), //10min
        },
    }, { new: true });
    if (!updateUser) {
        throw new AppError_1.default(500, "Failed to Send. Try Again!");
    }
    yield (0, send_email_1.send_email)(userEmail, "Verification Code", `CODE: ${OTP}`);
    return { message: "Verification code send." };
});
exports.AuthService = {
    create_user,
    user_login,
    verify_user,
    forgot_password_request,
    reset_password,
    get_new_access_token,
    update_password,
    re_send_otp,
};
