/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import amqp from "amqplib";
import { appConfig } from "../config";

let connection: any = null;

export const getRabbitConnection = async () => {
  if (!connection) {
    connection = await amqp.connect(appConfig.rabbitMq.url as string);
  }
  return connection;
};
