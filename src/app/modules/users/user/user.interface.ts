import { Document, Types } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";

export interface IBaseUser {
  email: string;
  role: TUserRole;
  password: string;
  authentication: {
    expDate: Date;
    otp: number;
    token: string;
  };
  isVerified: boolean;
  needToResetPass: boolean;
  subscription: IUserSubscription;
}

interface IUserSubscription {
  stripeCustomerId: string;
  activeSubscriptionId: string;
  packageId: Types.ObjectId; // subscription plan id ref
  priceId: string; // current price id
  isCancelled: boolean;
  currentPeriodEnd: Date;
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
