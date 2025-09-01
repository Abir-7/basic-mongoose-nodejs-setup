import { Response } from "express";

interface IMeta {
  totalItem: number;
  totalPage: number;
  limit: number;
  page: number;
}

interface IResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  meta?: IMeta;
}

const send_response = <T>(res: Response, data: IResponse<T>): void => {
  res.status(data.statusCode).send({
    success: data.success,
    message: data.message,
    statusCode: data.statusCode,
    data: data.data,
    meta: data.meta,
  });
};

export default send_response;
