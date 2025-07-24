import { Router } from "express";
import { StripeController } from "./stripe.controller";
import { auth } from "../../../middleware/auth/auth";

const router = Router();
//user--------------------
router.post("/subscribe", auth("USER"), StripeController.createCheckoutSession);
router.post("/cencel-subscribtion", StripeController.cancelUserSubscription);
//admin--------------------
router.post("/create", StripeController.createSubscriptionPlan);
router.patch("/:sId", StripeController.updateSubscriptionPlan);
router.delete("/:sId", StripeController.deleteSubscriptionPlan);
export const StripeRouter = router;
