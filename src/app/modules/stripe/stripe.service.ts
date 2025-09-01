/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable arrow-body-style */
import Stripe from "stripe";
import { appConfig } from "../../config";
import logger from "../../utils/serverTools/logger";
import stripe from "./stripe";

const stripeWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      appConfig.payment.stripe.webhook as string
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed:${err}`);
    throw new Error("Webhook signature verification failed.");
  }
  logger.info(event.type);
  //use switch event type
};

const createPaymentIntent = async ({
  amount,
  currency,
  customerId,
}: {
  amount: number;
  currency: string;
  customerId?: string;
}) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true }, // ✅ handles cards, wallets, etc.
  });
};

export const StripeService = { stripeWebhook, createPaymentIntent };
