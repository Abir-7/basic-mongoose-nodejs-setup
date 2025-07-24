import { model, Schema } from "mongoose";
import { IPaymentHistory } from "./payment.interface";

const paymentHistorySchema = new Schema<IPaymentHistory>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  stripePaymentIntentId: { type: String, required: true },
  amount: { type: Number, required: true }, // cents
  currency: { type: String, required: true },
  paidAt: { type: Date, required: true },
});

export const PaymentHistory = model<IPaymentHistory>(
  "PaymentHistory",
  paymentHistorySchema
);
