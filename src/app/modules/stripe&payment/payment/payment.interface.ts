import { Types } from "mongoose";

export interface IPaymentHistory {
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  paidAt: Date;
}
