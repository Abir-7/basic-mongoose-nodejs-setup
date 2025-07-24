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
) => {};

const changeSubscriptionPlan = async (
  userId: string,
  subscriptionPackageId: string
) => {};
const stripeWebhook = async (rawBody: Buffer, sig: string) => {};

const cancelUserSubscription = async (userId: string) => {};

export const StripeService = {
  createSubscription,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  stripeWebhook,
  cancelUserSubscription,
};
