"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodcreate_userSchema = void 0;
const zod_1 = require("zod");
exports.zodcreate_userSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        fullName: zod_1.z.string(),
        email: zod_1.z.string().email(),
        password: zod_1.z.string(),
    })
        .strict(),
});
