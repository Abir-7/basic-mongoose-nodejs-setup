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
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const user_model_1 = __importDefault(require("../modules/users/user/user.model"));
const logger_1 = __importDefault(require("../utils/serverTools/logger"));
const get_hashed_password_1 = __importDefault(require("../utils/helper/get_hashed_password"));
const user_profile_model_1 = require("../modules/users/user_profile/user_profile.model");
const auth_interface_1 = require("../interface/auth.interface");
const super_user = {
    role: auth_interface_1.user_roles.ADMIN,
    email: config_1.appConfig.admin.email,
    password: config_1.appConfig.admin.password,
    is_verified: true,
};
const super_user_profile = {
    full_name: "Admin-1",
    email: config_1.appConfig.admin.email,
};
const seed_admin = () => __awaiter(void 0, void 0, void 0, function* () {
    const is_exist_super_admin = yield user_model_1.default.findOne({
        role: auth_interface_1.user_roles.ADMIN,
    });
    if (is_exist_super_admin) {
        logger_1.default.info("Admin already created");
        return;
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        super_user.password = yield (0, get_hashed_password_1.default)(super_user.password);
        const data = yield user_model_1.default.create([super_user], { session });
        yield user_profile_model_1.UserProfile.create([Object.assign(Object.assign({}, super_user_profile), { user: data[0]._id })], {
            session,
        });
        yield session.commitTransaction();
        logger_1.default.info("Admin Created");
    }
    catch (error) {
        yield session.abortTransaction();
        logger_1.default.error(`Failed to create Admin. ${error} `);
    }
    finally {
        session.endSession();
    }
});
exports.default = seed_admin;
