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
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const getRelativeFilePath_1 = require("../../../middleware/fileUpload/getRelativeFilePath");
const user_model_1 = __importDefault(require("../user/user.model"));
const unlinkFiles_1 = __importDefault(require("../../../middleware/fileUpload/unlinkFiles"));
const userProfile_model_1 = require("./userProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const updateProfileImage = (path, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: email });
    const image = (0, getRelativeFilePath_1.getRelativePath)(path);
    if (!image) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Image not found.");
    }
    if (!user) {
        (0, unlinkFiles_1.default)(image);
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const updated = yield userProfile_model_1.UserProfile.findOneAndUpdate({ user: user._id }, { image }, { new: true });
    if (!updated) {
        (0, unlinkFiles_1.default)(image);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update image.");
    }
    return updated;
});
const updateProfileData = (userdata, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const data = (0, removeFalsyField_1.removeFalsyFields)(userdata);
    const updated = yield userProfile_model_1.UserProfile.findOneAndUpdate({ user: user._id }, data, {
        new: true,
    });
    if (!updated) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update user info.");
    }
    return updated;
});
exports.UserProfileService = { updateProfileData, updateProfileImage };
