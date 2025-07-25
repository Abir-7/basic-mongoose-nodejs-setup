import { model, Schema } from "mongoose";
import { IPaymentHistory } from "./payment.interface";

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invoiceId: { type: String, required: true },
    amountPaid: { type: Number, required: true }, // in cents
    currency: { type: String, default: "usd" },
    paymentStatus: { type: String, enum: ["paid", "failed"], required: true },
    paidAt: { type: Date },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export const PaymentHistory = model<IPaymentHistory>(
  "PaymentHistory",
  PaymentHistorySchema
);
