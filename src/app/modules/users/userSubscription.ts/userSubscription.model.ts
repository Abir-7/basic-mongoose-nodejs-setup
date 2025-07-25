import { Schema, model } from "mongoose";
import {
  IUserSubscription,
  SubscriptionStatus,
} from "./userSubscription.interface";
const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    stripeCustomerId: { type: String },
    subscriptionId: { type: String },
    planId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "SubscriptionPlan",
    },

    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      required: true,
      default: SubscriptionStatus.INACTIVE,
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const UserSubscription = model<IUserSubscription>(
  "UserSubscription",
  userSubscriptionSchema
);

export default UserSubscription;
