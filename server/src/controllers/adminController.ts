import type { Request, Response } from "express";
import mongoose from "mongoose";
import Vendor, { type IVendor } from "../models/vendor.js";
import MenuItem from "../models/menuItem.js";
import User, { type IUser } from "../models/user.js";
import tryCatchWrapper from "../lib/tryCatchWrapper.js";
import { sendTsRestError, sendTsRestSuccess } from "../lib/responseHandler.js";
import logger from "../config/logger.js";
import {
  listVendorsQuerySchema,
  vendorIdParamSchema,
  verificationDecisionSchema,
} from "../schemas/admin.schema.js";
import {
  listUsersQuerySchema,
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

// ---------- helpers ----------

const toAdminVendor = (v: IVendor, owner?: IUser | null) => ({
  id: v._id.toString(),
  businessName: v.businessName,
  description: v.description,
  address: {
    street: v.address.street,
    city: v.address.city,
    state: v.address.state,
    coordinates: v.address.location.coordinates,
  },
  verificationTier: v.verificationTier,
  storefrontStatus: v.storefrontStatus,
  orderLimitPerDay: v.orderLimitPerDay,
  verification: {
    registrationNumber: v.verification?.registrationNumber,
    note: v.verification?.note,
    submittedAt: v.verification?.submittedAt,
    reviewedAt: v.verification?.reviewedAt,
    reviewedBy: v.verification?.reviewedBy?.toString(),
    decisionNote: v.verification?.decisionNote,
  },
  owner: owner
    ? {
        id: owner._id.toString(),
        phoneNumber: owner.phoneNumber,
        fullName: owner.fullName,
        isPhoneVerified: owner.isPhoneVerified,
      }
    : null,
  createdAt: v.createdAt,
});

// ---------- handlers ----------

const listVendors = async (req: Request, res: Response): Promise<void> => {
  const { verificationTier, storefrontStatus, page, limit } =
    listVendorsQuerySchema.parse(req.query);

  const filter: Record<string, string> = {};
  if (verificationTier) filter.verificationTier = verificationTier;
  if (storefrontStatus) filter.storefrontStatus = storefrontStatus;

  // The review queue shows the oldest request first; everything else, newest first.
  const sort: Record<string, 1 | -1> =
    verificationTier === "pending"
      ? { "verification.submittedAt": 1 }
      : { createdAt: -1 };

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Vendor.countDocuments(filter),
  ]);

  const owners = await User.find({ _id: { $in: vendors.map((v) => v.owner) } });
  const ownerById = new Map(owners.map((u) => [u._id.toString(), u]));

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Vendors fetched.",
    body: {
      vendors: vendors.map((v) =>
        toAdminVendor(v, ownerById.get(v.owner.toString())),
      ),
      page,
      limit,
      total,
    },
  });
};

const getVendor = async (req: Request, res: Response): Promise<void> => {
  const { vendorId } = vendorIdParamSchema.parse(req.params);

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) return sendTsRestError(res, 404, "Vendor not found.");

  const [owner, menuItemCount] = await Promise.all([
    User.findById(vendor.owner),
    MenuItem.countDocuments({ vendor: vendor._id }),
  ]);

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Vendor fetched.",
    body: { vendor: toAdminVendor(vendor, owner), menuItemCount },
  });
};

const decideVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { vendorId } = vendorIdParamSchema.parse(req.params);
  const data = verificationDecisionSchema.parse(req.body);
  const adminId = req.session.userId as string;

  // Dot paths keep the vendor's submitted details intact. The tier filter
  // makes the decision atomic: if two admins act at once, only one matches.
  const set: Record<string, unknown> = {
    "verification.reviewedAt": new Date(),
    "verification.reviewedBy": adminId,
  };
  if (data.note) set["verification.decisionNote"] = data.note;

  if (data.decision === "approve") {
    set.verificationTier = "verified";
    set.orderLimitPerDay = data.orderLimitPerDay;
  } else {
    set.verificationTier = "unverified"; // vendor can fix the issue and resubmit
  }

  const vendor = await Vendor.findOneAndUpdate(
    { _id: vendorId, verificationTier: "pending" },
    { $set: set },
    { new: true },
  );

  if (!vendor) {
    const exists = await Vendor.exists({ _id: vendorId });
    return exists
      ? sendTsRestError(
          res,
          409,
          "This vendor has no pending verification request.",
        )
      : sendTsRestError(res, 404, "Vendor not found.");
  }

  logger.info(
    { vendorId, adminId, decision: data.decision },
    "Vendor verification decided",
  );

  const owner = await User.findById(vendor.owner);
  return sendTsRestSuccess(res, 200, {
    success: true,
    message:
      data.decision === "approve"
        ? "Vendor verified."
        : "Verification rejected.",
    body: { vendor: toAdminVendor(vendor, owner) },
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


export const listVendorsController = tryCatchWrapper(listVendors);
export const getVendorController = tryCatchWrapper(getVendor);
export const decideVerificationController = tryCatchWrapper(decideVerification);
export const listUsersController = tryCatchWrapper(listUsers);
export const getUserByIdController = tryCatchWrapper(getUserById);