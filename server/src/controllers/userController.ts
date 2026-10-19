import type { Request, Response } from "express";
import mongoose from "mongoose";
import User, { type IUser } from "../models/user.js";
import tryCatchWrapper from "../lib/tryCatchWrapper.js";
import { sendTsRestError, sendTsRestSuccess } from "../lib/responseHandler.js";
import {
  listUsersQuerySchema, completeProfileSchema,
} from "../schemas/profile.schema.js";

// Single place that decides which user fields are safe to send to a client.
const toPublicUser = (user: IUser) => ({
  id: user._id.toString(),
  phoneNumber: user.phoneNumber,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  isPhoneVerified: user.isPhoneVerified,
  address: user.address,
});

// ---------- Any logged-in user (customer, vendor, admin) ----------

const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.session.userId);
  if (!user) {
    return sendTsRestError(res, 404, "User not found.");
  }

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Profile fetched.",
    body: { user: toPublicUser(user) },
  });
};

const updateMe = async (req: Request, res: Response): Promise<void> => {
  const data = completeProfileSchema.parse(req.body);

  // Build $set explicitly so (a) role can never be changed through this route,
  // and (b) updating one address field doesn't wipe address.location/country.
  const update: Record<string, unknown> = {};
  if (data.fullName !== undefined) update.fullName = data.fullName;
  if (data.email !== undefined) update.email = data.email;
  if (data.address) {
    for (const [key, value] of Object.entries(data.address)) {
      if (value !== undefined) update[`address.${key}`] = value;
    }
  }

  if (Object.keys(update).length === 0) {
    return sendTsRestError(res, 400, "Nothing to update.");
  }

  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!user) {
    return sendTsRestError(res, 404, "User not found.");
  }

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Profile updated.",
    body: { user: toPublicUser(user) },
  });
};

// ---------- Admin only ----------

const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, page, limit } = listUsersQuerySchema.parse(req.query);
  const filter = role ? { role } : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Users fetched.",
    body: { users: users.map(toPublicUser), page, limit, total },
  });
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Without this check, a malformed id throws a CastError and returns a 500.
  if (!mongoose.isValidObjectId(id)) {
    return sendTsRestError(res, 400, "Invalid user id.");
  }

  const user = await User.findById(id);
  if (!user) {
    return sendTsRestError(res, 404, "User not found.");
  }

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "User fetched.",
    body: { user: toPublicUser(user) },
  });
};

export const getMeController = tryCatchWrapper(getMe);
export const updateMeController = tryCatchWrapper(updateMe);
export const listUsersController = tryCatchWrapper(listUsers);
export const getUserByIdController = tryCatchWrapper(getUserById);
