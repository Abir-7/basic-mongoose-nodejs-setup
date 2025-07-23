import mongoose, { model } from "mongoose";
import { IPaymentHistory } from "./payment.interface";

const PaymentHistorySchema = new mongoose.Schema<IPaymentHistory>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: { type: String, required: true },
    invoiceId: { type: String, required: true },

    amountPaid: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    status: {
      type: String,
      enum: ["paid", "unpaid", "failed"],
      required: true,
    },
    paidAt: { type: Date, required: true },

    receiptUrl: { type: String },
    billingReason: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true }
);

export const PaymentHistory = model<IPaymentHistory>(
  "PaymentHistory",
  PaymentHistorySchema
);
