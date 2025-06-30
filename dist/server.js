"use strict";
/* eslint-disable no-console */
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
const app_1 = __importDefault(require("./app"));
const config_1 = require("./app/config");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./app/utils/serverTools/logger"));
const DB_1 = __importDefault(require("./app/DB"));
const consumer_1 = require("./app/rabbitMq/jobs/consumer");
process.on("uncaughtException", (err) => {
    logger_1.default.error("Uncaught exception:", err);
    process.exit(1);
});
process.on("unhandledRejection", (err) => {
    logger_1.default.error("Unhandled promise rejection:", err);
    process.exit(1);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(config_1.appConfig.database.dataBase_uri);
    logger_1.default.info("MongoDB connected");
    yield (0, consumer_1.startJobConsumer)();
    yield (0, DB_1.default)();
    // Wait up to 15 minutes for request to finish uploading //
    app_1.default.setTimeout(15 * 60 * 1000);
    //------------------------//
    app_1.default.listen(Number(config_1.appConfig.server.port), config_1.appConfig.server.ip, () => {
        logger_1.default.info(`Example app listening on port ${config_1.appConfig.server.port} & ip:${config_1.appConfig.server.ip}`);
    });
});
main().catch((err) => logger_1.default.error("Error connecting to MongoDB:", err));
// import cluster from "cluster";
// import os from "os";
// import dotenv from "dotenv";
// dotenv.config();
// import mongoose from "mongoose";
// import server from "./app";
// import { appConfig } from "./app/config";
// import logger from "./app/utils/serverTools/logger";
// import seedAdmin from "./app/DB";
// const numCPUs = os.cpus().length;
// if (cluster.isPrimary) {
//   logger.info(`Primary process ${process.pid} is running`);
//   logger.info(`Forking ${numCPUs} workers...`);
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }
//   cluster.on("exit", (worker, code, signal) => {
//     logger.error(
//       `Worker ${worker.process.pid} died with code ${code} (${signal}). Restarting...`
//     );
//     cluster.fork();
//   });
//   // Optional: handle signals for graceful shutdown on primary
//   process.on("SIGINT", () => {
//     logger.info("SIGINT received, shutting down primary...");
//     process.exit(0);
//   });
//   process.on("SIGTERM", () => {
//     logger.info("SIGTERM received, shutting down primary...");
//     process.exit(0);
//   });
// } else {
//   // Worker process
//   process.on("uncaughtException", (err) => {
//     logger.error(`Uncaught exception (worker ${process.pid}):`, err);
//     process.exit(1);
//   });
//   process.on("unhandledRejection", (err) => {
//     logger.error(`Unhandled rejection (worker ${process.pid}):`, err);
//     process.exit(1);
//   });
//   const main = async () => {
//     const mongoUri = appConfig.database.dataBase_uri as string;
//     if (!mongoUri) {
//       logger.error("MongoDB connection URI is not defined!");
//       process.exit(1);
//     }
//     await mongoose.connect(mongoUri);
//     logger.info(`MongoDB connected (worker ${process.pid})`);
//     await seedAdmin();
//     // Increase server timeout for long uploads (15 minutes)
//     server.setTimeout(15 * 60 * 1000);
//     const port = Number(appConfig.server.port) || 3000;
//     const ip = appConfig.server.ip || "0.0.0.0";
//     server.listen(port, ip, () => {
//       logger.info(`Worker ${process.pid} listening on ${ip}:${port}`);
//     });
//   };
//   main().catch((err) => {
//     logger.error(`Error starting server (worker ${process.pid}):`, err);
//     process.exit(1);
//   });
// }
