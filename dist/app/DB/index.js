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
const auth_interface_1 = require("../interface/auth.interface");
const user_model_1 = __importDefault(require("../modules/users/user/user.model"));
const logger_1 = __importDefault(require("../utils/serverTools/logger"));
const getHashedPassword_1 = __importDefault(require("../utils/helper/getHashedPassword"));
const userProfile_model_1 = require("../modules/users/userProfile/userProfile.model");
const superUser = {
    role: auth_interface_1.userRoles.ADMIN,
    email: config_1.appConfig.admin.email,
    password: config_1.appConfig.admin.password,
    isVerified: true,
};
const superUserProfile = {
    fullName: "Admin-1",
    email: config_1.appConfig.admin.email,
};
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    superUser.password = yield (0, getHashedPassword_1.default)(superUser.password);
    try {
        const isExistSuperAdmin = yield user_model_1.default.findOne({
            role: auth_interface_1.userRoles.ADMIN,
        }).session(session);
        if (!isExistSuperAdmin) {
            const data = yield user_model_1.default.create([superUser], { session });
            yield userProfile_model_1.UserProfile.create([Object.assign(Object.assign({}, superUserProfile), { user: data[0]._id })], {
                session,
            });
            logger_1.default.info("Admin Created");
        }
        else {
            logger_1.default.info("Admin already created");
        }
        yield session.commitTransaction();
        session.endSession();
    }
    catch (error) {
        logger_1.default.error(`Faield to create Admin.${error} `);
        yield session.abortTransaction();
        session.endSession();
        //throw error;
    }
});
exports.default = seedAdmin;
