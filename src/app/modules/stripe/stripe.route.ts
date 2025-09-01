import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { StripeController } from "./stripe.controller";

const router = Router();

router.post(
  "/create-payment-intent",
  auth("USER"),
  StripeController.createPaymentIntent
);

export const StripeRoute = router;
