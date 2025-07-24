import { Types } from "mongoose";

export interface IUserSubscription {
  userId: Types.ObjectId;
  subscriptionId: string; // Stripe subscription ID
  planId: Types.ObjectId; // Reference to your SubscriptionPlan
  status: SubscriptionStatus; // active, trialing, canceled, incomplete, etc.
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive", // includes canceled, unpaid, expired, etc.
  TRIAL = "trial",
}
