"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.json_web_token = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_decode_1 = require("jwt-decode");
const verify_jwt_token = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new Error(error);
    }
};
const generate_jwt_token = (payload, secret, expires_in) => {
    try {
        const token = jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: expires_in,
        });
        return token;
    }
    catch (error) {
        throw new Error(error);
    }
};
const decode_jwt_token = (token) => {
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        return decoded;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.json_web_token = {
    verify_jwt_token,
    generate_jwt_token,
    decode_jwt_token,
};
