import status from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { StripeService } from "./stripe.service";
import logger from "../../../utils/serverTools/logger";

const createSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await StripeService.createSubscription(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Plan created",
    data: result,
  });
});

const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await StripeService.updateSubscriptionPlan(
    req.params.sId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Price updated",
    data: result,
  });
});

const deleteSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await StripeService.deleteSubscriptionPlan(req.params.sId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Plan deleted",
    data: result,
  });
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const result = await StripeService.createCheckoutSession(
    req.user.userId,
    req.body.subscriptionPackageId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Subscribe to package successfull",
    data: result,
  });
});

const stripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const rawBody = req.body;
  logger.info("hit");
  const result = await StripeService.stripeWebhook(rawBody, sig);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Webhook response",
    data: result,
  });
});

const cancelUserSubscription = catchAsync(async (req, res) => {
  const result = await StripeService.cancelUserSubscription(req.params.uId);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Subscription cancellation scheduled at period end.",
    data: result,
  });
});

export const StripeController = {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  stripeWebhook,
  cancelUserSubscription,
};
