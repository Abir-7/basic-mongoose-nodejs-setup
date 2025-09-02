"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const http_1 = __importDefault(require("http"));
const global_error_handler_1 = require("./app/middleware/global_error_handler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const no_route_found_1 = require("./app/utils/serverTools/no_route_found");
const rate_limit_1 = require("./app/utils/serverTools/rate_limit");
const stripe_controller_1 = require("./app/modules/stripe/stripe.controller");
const app = (0, express_1.default)();
const cors_options = {
    origin: ["*"], // need to add real http link like "https://yourdomain.com", "http://localhost:3000"
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
};
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use((0, compression_1.default)());
app.use((0, cors_1.default)(cors_options));
app.use((0, cookie_parser_1.default)());
app.set("trust proxy", true);
app.use("/api/stripe/webhook", express_1.default.raw({ type: "application/json" }), stripe_controller_1.StripeController.stripe_webhook);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rate_limit_1.limiter);
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hello World! This app name is TEST");
});
app.use(express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use(global_error_handler_1.global_error_handler);
app.use(no_route_found_1.no_route_found);
const server = http_1.default.createServer(app);
exports.default = server;
