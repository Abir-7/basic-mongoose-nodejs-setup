import { IBaseUser } from "../../users/user/user.interface";

export interface IPaymentHistory {
  _id?: string;
  userId: IBaseUser;
  subscriptionId: string;
  invoiceId: string;

  amountPaid: number;
  currency: string;

  status: "paid" | "unpaid" | "failed";
  paidAt: Date;

  receiptUrl?: string;
  billingReason?: string;
  periodStart?: Date;
  periodEnd?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
