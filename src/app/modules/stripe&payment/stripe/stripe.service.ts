/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";

import { SubscriptionPlan } from "./stripe.model";
import Stripe from "stripe";
import { appConfig } from "../../../config";
import User from "../../users/user/user.model";
import { PaymentHistory } from "../payment/payment.model";
import stripe from "./stripe";

/* eslint-disable @typescript-eslint/no-explicit-any */
const createSubscription = async (data: any) => {
  const { name, amount, interval } = data;
  if (!name || !amount || !interval) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }

  const product = await stripe.products.create({ name });

  const price = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: "usd",
    recurring: { interval }, // month or year
    product: product.id,
  });

  const newPlan = await SubscriptionPlan.create({
    name,
    amount,
    interval,
    stripeProductId: product.id,
    stripePriceId: price.id,
  });

  return newPlan;
};

const updateSubscriptionPlan = async (id: string, data: any) => {
  const { name, amount, interval } = data;

  if (!name || !amount || !interval) {
    throw new AppError(status.BAD_REQUEST, "Missing required fields");
  }
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new AppError(404, "Plan not found");

  // Create new Stripe price
  const newPrice = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: "usd",
    recurring: { interval },
    product: plan.stripeProductId as string,
  });

  await stripe.prices.update(plan.stripePriceId, { active: false });

  // Update local DB
  plan.name = name;
  plan.amount = amount;
  plan.interval = interval;
  plan.stripePriceId = newPrice.id;
  await plan.save();

  return plan;
};

const deleteSubscriptionPlan = async (id: string) => {
  const plan = await SubscriptionPlan.findById(id);
  if (!plan) throw new AppError(404, "Plan not found");

  // Optional: You can deactivate product in Stripe too (cannot delete)
  await stripe.products.update(plan.stripeProductId, {
    active: false,
  });

  // Soft delete
  plan.isActive = false;
  await plan.save();

  return { message: "Plan deactivated" };
};

//User part---subscription

const createCheckoutSession = async (userId: string, priceId: string) => {
  if (!priceId) throw new AppError(400, "Missing Stripe Price ID");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: { userId }, // Required for webhook
  });

  return session.url;
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
    return { success: false, message: `Invalid signature: ${err.message}` };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const user = await User.findById(userId);
        if (!user) return { success: false, message: "User not found" };

        user.subscription = {
          stripeCustomerId: customerId,
          activeSubscriptionId: subscriptionId,
          isCancelled: false,
          isPaymentFailed: false,
        };

        await user.save();
        return { success: true, message: "Subscription linked to user." };
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;

        const user = await User.findOne({
          "subscription.stripeCustomerId": customerId,
        });
        if (!user) return { success: false, message: "User not found" };

        const history = await PaymentHistory.create({
          userId: user._id,
          subscriptionId,
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: invoice.status as "paid",
          paidAt: new Date(invoice.created * 1000),
          receiptUrl: invoice.hosted_invoice_url || "",
          billingReason: invoice.billing_reason || "",
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
        });

        user.subscription.lastPaymentHistoryId = history._id as any;
        user.subscription.lastPaymentDate = new Date(invoice.created * 1000);
        user.subscription.isPaymentFailed = false;
        await user.save();

        return { success: true, message: "Payment recorded." };
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await User.findOne({
          "subscription.stripeCustomerId": customerId,
        });
        if (user) {
          user.subscription.isPaymentFailed = true;
          await user.save();
        }

        return { success: true, message: "Payment failure flagged." };
      }

      default:
        return {
          success: true,
          message: `Unhandled event type: ${event.type}`,
        };
    }
  } catch (err: any) {
    return { success: false, message: `Internal error: ${err.message}` };
  }
};

const cancelUserSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  const subscriptionId = user.subscription?.activeSubscriptionId;
  if (!subscriptionId) throw new AppError(400, "No active subscription found");

  // Cancel at period end (recommended)
  const deletedSub = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  user.subscription.isCancelled = true;
  await user.save();

  return {
    success: true,
    message: "Subscription cancellation scheduled at period end.",
    current_period_end:
      (deletedSub as any).current_period_end ??
      (deletedSub as any).data?.current_period_end,
  };
};

export const StripeService = {
  createSubscription,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  stripeWebhook,
  cancelUserSubscription,
};
