import status from "http-status";
import send_response from "../../utils/serverTools/send_response";
import catch_async from "../../utils/serverTools/catch_async";
import { StripeService } from "./stripe.service";

const stripeWebhook = catch_async(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const rawBody = req.body;

  const result = await StripeService.stripeWebhook(rawBody, sig);

  send_response(res, {
    success: true,
    statusCode: status.OK,
    message: "Webhook action successfull",
    data: result,
  });
});

const createPaymentIntent = catch_async(async (req, res) => {
  const { amount, currency } = req.body;

  const result = await StripeService.createPaymentIntent({
    amount,
    currency,
    customerId: req.user.user_id,
  });

  send_response(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment intent created successfully",
    data: result,
  });
});

export const StripeController = { stripeWebhook, createPaymentIntent };
