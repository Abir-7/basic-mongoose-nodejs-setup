/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { appConfig } from "../config";
import { userRoles } from "../interface/auth.interface";

import User from "../modules/users/user/user.model";
import logger from "../utils/serverTools/logger";
import getHashedPassword from "../utils/helper/getHashedPassword";
import { UserProfile } from "../modules/users/userProfile/userProfile.model";

const superUser = {
  role: userRoles.ADMIN,
  email: appConfig.admin.email,
  password: appConfig.admin.password,
  isVerified: true,
};

const superUserProfile = {
  fullName: "Admin-1",
  email: appConfig.admin.email,
};

const seedAdmin = async (): Promise<void> => {
  const isExistSuperAdmin = await User.findOne({
    role: userRoles.ADMIN,
  });

  if (isExistSuperAdmin) {
    logger.info("Admin already created");
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    superUser.password = await getHashedPassword(superUser.password as string);

    const data = await User.create([superUser], { session });
    await UserProfile.create([{ ...superUserProfile, user: data[0]._id }], {
      session,
    });

    await session.commitTransaction();
    logger.info("Admin Created");
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`Failed to create Admin. ${error} `);
  } finally {
    session.endSession();
  }
};

export default seedAdmin;
