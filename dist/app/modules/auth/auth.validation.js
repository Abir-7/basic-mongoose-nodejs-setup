"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodcreate_userSchema = void 0;
const zod_1 = require("zod");
const auth_interface_1 = require("../../interface/auth.interface");
exports.zodcreate_userSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        full_name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
        role: zod_1.z.enum([...auth_interface_1.user_role]),
    })
        .strict(),
});
