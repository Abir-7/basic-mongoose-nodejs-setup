import { Types } from "mongoose";

export interface IPaymentHistory {
  userId: Types.ObjectId;

  invoiceId: string; // Stripe invoice ID
  amountPaid: number;
  currency: string;
  paymentStatus: "paid" | "failed";
  paidAt?: Date;
  receiptUrl?: string;
  createdAt?: Date;
}
