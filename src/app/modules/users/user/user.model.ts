/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { model, Schema } from "mongoose";
import { IUser } from "./user.interface";
import { userRole } from "../../../interface/auth.interface";

import bcrypt from "bcryptjs";
const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: userRole, default: "USER" },

  authentication: {
    expDate: { type: Date, default: null },
    otp: { type: Number, default: null },
    token: { type: String, default: null },
  },

  isVerified: { type: Boolean, default: false },
  needToResetPass: { type: Boolean, default: false },

  subscription: {
    stripeCustomerId: { type: String, required: true },
    activeSubscriptionId: { type: String, required: true },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    priceId: { type: String, required: true },
    isCancelled: { type: Boolean, default: false },
    currentPeriodEnd: { type: Date, required: true },
  },
});
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error("Error comparing password");
  }
};

const User = model<IUser>("User", userSchema);

export default User;
