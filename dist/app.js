"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const http_1 = __importDefault(require("http"));
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const noRouteFound_1 = require("./app/utils/serverTools/noRouteFound");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const compression_1 = __importDefault(require("compression"));
const rateLimite_1 = require("./app/utils/serverTools/rateLimite");
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
const corsOption = {
    origin: ["*"], // need to add real htp link like "https://yourdomain.com", "http://localhost:3000"
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
};
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use((0, compression_1.default)());
app.use((0, cors_1.default)(corsOption));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimite_1.limiter);
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hello World! This app name is TEST");
});
app.use(express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(noRouteFound_1.noRouteFound);
const server = http_1.default.createServer(app);
exports.default = server;
