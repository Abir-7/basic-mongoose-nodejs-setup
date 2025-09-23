/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
//--------------------------- user in auth

import status from "http-status";
import AppError from "../../errors/AppError";

export const validate_otp = (provided_otp: string, stored_otp: string) => {
  if (!stored_otp) {
    throw new AppError(status.BAD_REQUEST, "OTP expired or not found.");
  }

  if (Number(provided_otp) !== Number(stored_otp)) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP.");
  }
};
