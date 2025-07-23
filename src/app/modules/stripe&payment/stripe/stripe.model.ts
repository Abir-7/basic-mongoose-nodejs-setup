import { Schema, model, Document } from "mongoose";
import { BILLING_INTERVALS, BillingInterval } from "./stripe";

export interface ISubscriptionPlan extends Document {
  name: string;
  amount: number; // in dollars
  interval: BillingInterval;
  stripeProductId: string;
  stripePriceId: string;
  isActive: boolean;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  interval: { type: String, enum: BILLING_INTERVALS, required: true },
  stripeProductId: { type: String, required: true },
  stripePriceId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export const SubscriptionPlan = model<ISubscriptionPlan>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);
