import Stripe from "stripe";
import { appConfig } from "../../../config";

export const BILLING_INTERVALS = ["day", "week", "month", "year"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

const stripe = new Stripe(appConfig.payment.stripe.secret_key as string, {
  apiVersion: "2025-06-30.basil",
});

export default stripe;
