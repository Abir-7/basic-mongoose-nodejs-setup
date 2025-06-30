"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../modules/users/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const userProfile_route_1 = require("../modules/users/userProfile/userProfile.route");
const router = (0, express_1.Router)();
const apiRoutes = [
    { path: "/user", route: user_route_1.UserRoute },
    { path: "/user", route: userProfile_route_1.UserProfileRoute },
    { path: "/auth", route: auth_route_1.AuthRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
