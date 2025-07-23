import { Router } from "express";
import { StripeController } from "./stripe.controller";

const router = Router();
//user--------------------
router.post("/subscribe", StripeController.createCheckoutSession);
router.post("/cencel-subscribtion", StripeController.cancelUserSubscription);
//admin--------------------
router.post("/create", StripeController.createSubscriptionPlan);
router.patch("/:sId", StripeController.updateSubscriptionPlan);
router.delete("/:sId", StripeController.deleteSubscriptionPlan);
export const StripeRouter = router;
