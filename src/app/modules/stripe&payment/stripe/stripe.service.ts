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

const createSubscription = async (data: any) => {
  const { name, amount, interval } = data;
  if (!name || !amount || !interval) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }

  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: "usd",
    recurring: { interval },
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

const createCheckoutSession = async (
  userId: string,
  subscriptionPackageId: string
): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  const plan = await SubscriptionPlan.findById(subscriptionPackageId);
  if (!plan || !plan.stripePriceId)
    throw new AppError(404, "Subscription plan not found");

  // Check if user already subscribed to this package and subscription is active (not cancelled and period not ended)
  const currentSub = user.subscription;
  const now = new Date();

  if (
    currentSub &&
    currentSub.packageId?.toString() === subscriptionPackageId &&
    !currentSub.isCancelled &&
    currentSub.currentPeriodEnd > now
  ) {
    throw new AppError(400, "User already subscribed to this package.");
  }

  // Create Stripe customer if missing
  let stripeCustomerId = currentSub?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: String(user._id) },
    });
    stripeCustomerId = customer.id;

    if (!user.subscription) user.subscription = {} as any;
    user.subscription.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  // Create Checkout Session for subscription purchase
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: "http://157.245.9.24:5001/",
    cancel_url: "http://157.245.9.24:5001/",
    metadata: {
      subscriptionPackageId,
    },
  });

  return session.url!;
};

const changeSubscriptionPlan = async (
  userId: string,
  subscriptionPackageId: string
) => {
  // Find user and new plan
  const user = await User.findById(userId);
  if (!user || !user.subscription)
    throw new AppError(404, "User or subscription not found");

  const newPlan = await SubscriptionPlan.findById(subscriptionPackageId);
  if (!newPlan || !newPlan.stripePriceId)
    throw new AppError(404, "Subscription plan not found");

  // Retrieve current Stripe subscription
  const subscription = await stripe.subscriptions.retrieve(
    user.subscription.activeSubscriptionId
  );
  if (!subscription) throw new AppError(404, "Stripe subscription not found");

  // Get subscription item ID (assume single item)
  const subscriptionItemId = subscription.items.data[0].id;

  // Update subscription item to new price
  await stripe.subscriptionItems.update(subscriptionItemId, {
    price: newPlan.stripePriceId,
  });

  // Optional: You can handle proration behavior by adding proration_behavior param

  // Update user's subscription info in DB
  user.subscription.packageId = newPlan._id as any;
  user.subscription.priceId = newPlan.stripePriceId;
  user.subscription.isCancelled = false;
  user.subscription.currentPeriodEnd = new Date(
    (subscription as any).current_period_end * 1000
  );

  await user.save();

  return user.subscription;
};
const stripeWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      appConfig.payment.stripe.webhook as string
    );
  } catch (err: any) {
    logger.error("❌ Stripe webhook signature verification failed", err);
    throw new AppError(400, "Invalid Stripe webhook signature");
  }

  const data = event.data.object;

  switch (event.type) {
    case "invoice.paid": {
      const invoice = data as Stripe.Invoice;

      const subscription = await stripe.subscriptions.retrieve(
        (invoice as any).subscription as string
      );

      const subscriptionPackageId = subscription.metadata.subscriptionPackageId;

      // Find user by Stripe customer ID
      const user = await User.findOne({
        "subscription.stripeCustomerId": invoice.customer,
      });
      console.log(user);
      if (!user || !user.subscription) break;

      // Save payment history
      const payment = new PaymentHistory({
        userId: user._id,
        subscriptionId: subscriptionPackageId,
        stripePaymentIntentId: (invoice as any).payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      });
      await payment.save();

      // Update user subscription period and status
      user.subscription.currentPeriodEnd = new Date(
        (invoice as any).current_period_end * 1000
      );
      user.subscription.isCancelled = false;
      await user.save();

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = data as Stripe.Subscription;
      const user = await User.findOne({
        "subscription.activeSubscriptionId": subscription.id,
      });
      if (!user || !user.subscription) break;

      // Mark subscription as cancelled and clear activeSubscriptionId
      user.subscription.isCancelled = true;
      user.subscription.activeSubscriptionId = "";
      await user.save();

      break;
    }

    case "customer.subscription.updated": {
      const subscription = data as Stripe.Subscription;
      const user = await User.findOne({
        "subscription.activeSubscriptionId": subscription.id,
      });
      if (!user || !user.subscription) break;

      user.subscription.currentPeriodEnd = new Date(
        (subscription as any).current_period_end * 1000
      );
      user.subscription.isCancelled =
        subscription.cancel_at_period_end || false;
      await user.save();

      break;
    }

    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  return { received: true };
};

const cancelUserSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.subscription)
    throw new AppError(404, "User or subscription not found");

  const subscriptionId = user.subscription.activeSubscriptionId;
  if (!subscriptionId) throw new AppError(400, "Active subscription not found");

  // Cancel subscription at period end
  const canceledSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      cancel_at_period_end: true,
    }
  );

  // Update user subscription info in DB
  user.subscription.isCancelled = true;
  user.subscription.currentPeriodEnd = new Date(
    (canceledSubscription as any).current_period_end * 1000
  );

  await user.save();

  return canceledSubscription;
};

export const StripeService = {
  createSubscription,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  stripeWebhook,
  cancelUserSubscription,
};
