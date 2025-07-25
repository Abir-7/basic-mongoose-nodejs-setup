/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";
import Stripe from "stripe";
import mongoose from "mongoose";

import { appConfig } from "../../../config";
import stripe from "./stripe";
import logger from "../../../utils/serverTools/logger";

import { SubscriptionPlan } from "./stripe.model";
import User from "../../users/user/user.model";
import { PaymentHistory } from "../payment/payment.model";
import UserSubscription from "../../users/userSubscription.ts/userSubscription.model";
import { SubscriptionStatus } from "../../users/userSubscription.ts/userSubscription.interface";

const createSubscription = async (data: any) => {
  const { name, amount, interval } = data;
  if (!name || !amount || !interval) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }

  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: "usd",
    recurring: { interval, interval_count: 1 },
    product: product.id,
  });

  return await SubscriptionPlan.create({
    name,
    amount,
    interval,
    stripeProductId: product.id,
    stripePriceId: price.id,
  });
};

const updateSubscriptionPlan = async (id: string, data: any) => {
  const { name, amount, interval } = data;
  if (!name || !amount || !interval) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }

  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new AppError(404, "Plan not found");

  const newPrice = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: "usd",
    recurring: { interval },
    product: plan.stripeProductId,
  });

  await stripe.prices.update(plan.stripePriceId, { active: false });

  plan.set({ name, amount, interval, stripePriceId: newPrice.id });
  return plan.save();
};

const deleteSubscriptionPlan = async (id: string) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new AppError(404, "Plan not found");

  await stripe.products.update(plan.stripeProductId, { active: false });
  plan.isActive = false;
  await plan.save();

  return { message: "Plan deactivated" };
};

const createCheckoutSession = async ({
  userId,
  planId,
}: {
  userId: string;
  planId: string;
}) => {
  const plan = await SubscriptionPlan.findById(planId);
  const user = await User.findById(userId);

  if (!plan || !user?.email) {
    throw new AppError(400, "Invalid plan or user data");
  }

  // Check for existing subscription
  const existingSubscription = await UserSubscription.findOne({ userId });

  // If existing subscription is active, cancel it
  // if (existingSubscription?.subscriptionId) {
  //   try {
  //     await stripe.subscriptions.cancel(existingSubscription.subscriptionId);
  //   } catch (error) {
  //     console.warn("Stripe subscription cancel error:", error);
  //   }
  // }

  // Reuse existing customer ID if available, otherwise create and save
  let stripeCustomerId = existingSubscription?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
  }

  // Create a new Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: "https://4d9frmqz-4002.asse.devtunnels.ms/",
    cancel_url: "https://4d9frmqz-4002.asse.devtunnels.ms/",
    metadata: { userId, planId },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
  });

  // Save or update UserSubscription
  if (!existingSubscription) {
    await UserSubscription.create({
      userId,
      planId,
      stripeCustomerId,
      status: SubscriptionStatus.INACTIVE,
    });
  } else {
    existingSubscription.planId = planId as any;
    existingSubscription.stripeCustomerId = stripeCustomerId;
    existingSubscription.status = SubscriptionStatus.INACTIVE;
    await existingSubscription.save();
  }

  return { url: session.url };
};

export const stripeWebhook = async (rawBody: Buffer, sig: string) => {
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
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      if (!session.metadata) {
        logger.error("Session metadata is missing");
        throw new AppError(400, "Session metadata is missing");
      }

      const existingSubscription = await UserSubscription.findOne({
        userId: session.metadata.userId,
      });

      // If existing subscription is active, cancel it
      if (existingSubscription?.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(
            existingSubscription.subscriptionId
          );
        } catch (error) {
          console.warn("Stripe subscription cancel error:", error);
        }
      }

      console.log(subscription.start_date, "satart date");
      await UserSubscription.findOneAndUpdate(
        { userId: session.metadata.userId },
        {
          subscriptionId: subscription.id,
          planId: session.metadata.planId,
          status: subscription.status,
          currentPeriodStart: new Date((subscription as any).created * 1000),
          //  currentPeriodEnd: new Date((subscription as any).expires_at * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripeCustomerId: subscription.customer as string,
        },
        { upsert: true }
      );
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = await stripe.customers.retrieve(
        invoice.customer as string
      );

      await PaymentHistory.create({
        userId: (customer as any).metadata.userId as string,
        subscriptionId: (invoice as any).subscription as string,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        paymentStatus: "paid",
        paidAt: new Date(),
        receiptUrl: invoice.hosted_invoice_url,
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      const customer = await stripe.customers.retrieve(
        invoice.customer as string
      );

      await UserSubscription.findOneAndUpdate(
        { subscriptionId: (invoice as any).subscription as string },
        {
          status: SubscriptionStatus.INACTIVE, // or INACTIVE depending on your policy
        }
      );

      await PaymentHistory.create({
        userId: (customer as any).metadata.userId as string,
        subscriptionId: (invoice as any).subscription as string,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        paymentStatus: "failed",
        paidAt: new Date(),
      });
      break;
    }
    // case "customer.subscription.deleted": {
    //   const subscription = event.data.object as Stripe.Subscription;

    //   break;
    // }

    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  return { received: true };
};

const cancelUserSubscription = async (userId: string) => {
  const userSub = await UserSubscription.findOne({ userId });
  if (!userSub) throw new AppError(404, "No subscription found");

  const data = await stripe.subscriptions.update(userSub.subscriptionId, {
    cancel_at_period_end: true,
  });

  userSub.cancelAtPeriodEnd = true;
  userSub.status = SubscriptionStatus.CANCELED;
  if (data.cancel_at) {
    console.log(data.cancel_at, "end date");
    userSub.currentPeriodEnd = new Date(data.cancel_at * 1000);
  }
  await userSub.save();

  return { message: "Subscription will cancel at period end" };
};

export const StripeService = {
  createSubscription,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  stripeWebhook,
  cancelUserSubscription,
};
