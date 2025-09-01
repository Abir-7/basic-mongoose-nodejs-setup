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
exports.UserProfileService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = __importDefault(require("../../../errors/appError"));
const getRelativeFilePath_1 = require("../../../middleware/fileUpload/getRelativeFilePath");
const user_model_1 = __importDefault(require("../user/user.model"));
const unlinkFiles_1 = __importDefault(require("../../../middleware/fileUpload/unlinkFiles"));
const userProfile_model_1 = require("./userProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const update_profile_image = (path, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: email });
    const image = (0, getRelativeFilePath_1.get_relative_path)(path);
    if (!image) {
        throw new appError_1.default(http_status_1.default.NOT_FOUND, "Image not found.");
    }
    if (!user) {
        (0, unlinkFiles_1.default)(image);
        throw new appError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const user_profile = yield userProfile_model_1.UserProfile.findOne({ user: user.id });
    if (!user_profile) {
        (0, unlinkFiles_1.default)(image);
        throw new appError_1.default(http_status_1.default.NOT_FOUND, "User profile not found.");
    }
    user_profile.image = image;
    const saved_data = yield user_profile.save();
    if (!saved_data) {
        (0, unlinkFiles_1.default)(image);
        throw new appError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update image.");
    }
    if (user_profile && user_profile.image) {
        (0, unlinkFiles_1.default)(user_profile.image);
    }
    return saved_data;
});
const update_profile_data = (userdata, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: email });
    if (!user) {
        throw new appError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const data = (0, removeFalsyField_1.removeFalsyFields)(userdata);
    const updated = yield userProfile_model_1.UserProfile.findOneAndUpdate({ user: user._id }, data, {
        new: true,
    });
    if (!updated) {
        throw new appError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update user info.");
    }
    return updated;
});
exports.UserProfileService = { update_profile_data, update_profile_image };
