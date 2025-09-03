"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
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
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_interface_1 = require("../../../interface/auth.interface");
const user_schema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    role: {
        type: String,
        required: true,
        enum: auth_interface_1.user_role, // adjust roles according to TUserRole
    },
    password: {
        type: String,
        required: true,
    },
    authentication: {
        expires_at: {
            type: Date,
            default: null,
        },
        otp: {
            type: Number,
            default: null,
        },
        token: {
            type: String,
            default: null,
        },
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    need_to_reset_password: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
user_schema.methods.comparePassword = function (entered_password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcryptjs_1.default.compare(entered_password, this.password);
        }
        catch (error) {
            throw new Error("Error comparing password");
        }
    });
};
const User = (0, mongoose_1.model)("USER", user_schema);
exports.default = User;
