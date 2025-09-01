"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonWebToken = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_decode_1 = require("jwt-decode");
const verify_jwt = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new Error(error);
    }
};
const generate_token = (payload, secret, expiresIn) => {
    try {
        const token = jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn,
        });
        return token;
    }
    catch (error) {
        throw new Error(error);
    }
};
const decode_token = (token) => {
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        return decoded;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.JsonWebToken = {
    verify_jwt,
    generate_token,
    decode_token,
};
