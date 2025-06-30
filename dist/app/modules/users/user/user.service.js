"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const userProfile_model_1 = require("../userProfile/userProfile.model");
const getMyData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userProfile_model_1.UserProfile.findOne({ user: userId }).populate("user");
    return user;
});
exports.UserService = {
    getMyData,
};
