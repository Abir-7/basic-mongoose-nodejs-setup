"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../modules/users/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const user_profile_route_1 = require("../modules/users/user_profile/user_profile.route");
const stripe_route_1 = require("../modules/stripe/stripe.route");
const router = (0, express_1.Router)();
const api_routes = [
    { path: "/user", route: user_route_1.UserRoute },
    { path: "/user", route: user_profile_route_1.UserProfileRoute },
    { path: "/auth", route: auth_route_1.AuthRoute },
    { path: "/stripe", route: stripe_route_1.StripeRoute },
];
api_routes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
