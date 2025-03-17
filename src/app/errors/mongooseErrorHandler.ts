/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// middlewares/mongooseErrorHandler.ts
import mongoose from "mongoose";

export const handleMongooseError = (err: any) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errors: any = [];

  // Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Mongoose Cast Error (invalid ObjectId format)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    errors = [
      {
        field: err.path,
        message: `Invalid value for ${err.path}`,
      },
    ];
  }

  // Mongoose Duplicate Key Error (e.g., unique constraint violation)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate key error: ${Object.keys(err.keyValue).join(", ")}`;
    errors = [
      {
        field: "",
        message: `Duplicate key error: ${Object.keys(err.keyValue).join(", ")}`,
      },
    ];
  }

  return { statusCode, message, errors };
};
