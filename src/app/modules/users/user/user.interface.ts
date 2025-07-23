import { Document } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";
import { IPaymentHistory } from "../../stripe&payment/payment/payment.interface";

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
  subscription: {
    stripeCustomerId: string;
    lastPaymentHistoryId?: IPaymentHistory; // ✅ only store last payment ID
    isCancelled?: boolean;
    activeSubscriptionId?: string;
    lastPaymentDate?: Date;
    isPaymentFailed?: boolean;
  };
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
