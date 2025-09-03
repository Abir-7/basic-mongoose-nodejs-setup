"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoute = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../../middleware/auth/auth");
const router = (0, express_1.Router)();
router.get("/me", (0, auth_1.auth)("PARENT", "ADMIN"), user_controller_1.UserController.get_my_data);
exports.UserRoute = router;
