"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = void 0;
const mongoose_1 = require("mongoose");
const userProfileSchema = new mongoose_1.Schema({
    fullName: { type: String },
    nickname: { type: String },
    dateOfBirth: { type: Date },
    phone: { type: String },
    address: { type: String },
    image: { type: String },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", unique: true },
});
exports.UserProfile = (0, mongoose_1.model)("UserProfile", userProfileSchema);
