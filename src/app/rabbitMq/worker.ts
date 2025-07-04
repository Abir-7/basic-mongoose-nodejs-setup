import { sendEmail } from "../utils/sendEmail";
import { consumeQueue } from "./consumer";

// Existing email job
consumeQueue("emailQueue", async (job) => {
  const { to, subject, body } = job;
  await sendEmail(to, subject, body); //---> your function that need to perform in background.
});

// new job below
