import { sendEmail } from "../../../utils/sendEmail";
import logger from "../../../utils/serverTools/logger";
import { EmailJob } from "../types";

export const handleEmailJob = async (data: EmailJob) => {
  try {
    await sendEmail(data.to, data.subject, data.text);
    logger.info("📧 Sending email to------", data.to);
  } catch (error) {
    logger.error(error);
  }
};
