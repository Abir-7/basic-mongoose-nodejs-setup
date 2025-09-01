"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDataField = void 0;
const appError_1 = __importDefault(require("../../errors/appError"));
const parseDataField = (fieldName) => (req, res, next) => {
    try {
        if (req.body[fieldName]) {
            req.body = JSON.parse(req.body[fieldName]);
            next();
        }
        else {
            next();
        }
    }
    catch (error) {
        throw new appError_1.default(500, "Invalid JSON string");
    }
};
exports.parseDataField = parseDataField;
