/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { IAuthData } from "../../interface/auth.interface";
import { jwtDecode } from "jwt-decode";
const verify_jwt = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as IAuthData;
  } catch (error: any) {
    throw new Error(error);
  }
};

const generate_token = (payload: object, secret: string, expiresIn: any) => {
  try {
    const token = jwt.sign(payload, secret, {
      expiresIn,
    });
    return token;
  } catch (error: any) {
    throw new Error(error);
  }
};
const decode_token = (token: string) => {
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const JsonWebToken = {
  verify_jwt,
  generate_token,
  decode_token,
};
