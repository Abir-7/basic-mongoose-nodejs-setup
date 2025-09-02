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
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const user_service_1 = require("./user.service");
const send_response_1 = __importDefault(require("../../../utils/serverTools/send_response"));
const catch_async_1 = __importDefault(require("../../../utils/serverTools/catch_async"));
const get_my_data = (0, catch_async_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.get_my_data(req.user.user_id);
    (0, send_response_1.default)(res, {
        success: true,
        status_code: http_status_1.default.OK,
        message: "User data is fetched successfully",
        data: result,
    });
}));
exports.UserController = {
    get_my_data,
};
