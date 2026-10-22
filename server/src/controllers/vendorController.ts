import type { Request, Response } from "express";
import Vendor, { type IVendor } from "../models/vendor.js";
import MenuItem, { type IMenuItem } from "../models/menuItem.js";
import tryCatchWrapper from "../lib/tryCatchWrapper.js";
import { sendTsRestError, sendTsRestSuccess } from "../lib/responseHandler.js";
import {
  addMenuItemsSchema,
  itemIdParamSchema,
  updateMenuItemSchema,
  vendorProfileSchema,
  verificationRequestSchema,
} from "../schemas/vendor.schema.js";

// ---------- helpers ----------

const NO_PROFILE = "Create your business profile first.";

const toPublicVendor = (v: IVendor) => ({
  id: v._id.toString(),
  businessName: v.businessName,
  description: v.description,
  photoUrl: v.photoUrl,
  address: {
    street: v.address.street,
    city: v.address.city,
    state: v.address.state,
    coordinates: v.address.location.coordinates,
  },
  verificationTier: v.verificationTier,
  storefrontStatus: v.storefrontStatus,
  orderLimitPerDay: v.orderLimitPerDay,
  // decisionNote is how a vendor learns why a request was rejected.
  verification: {
    registrationNumber: v.verification?.registrationNumber,
    submittedAt: v.verification?.submittedAt,
    reviewedAt: v.verification?.reviewedAt,
    decisionNote: v.verification?.decisionNote,
  },
});

const toPublicItem = (item: IMenuItem) => ({
  id: item._id.toString(),
  name: item.name,
  priceKobo: item.priceKobo,
  category: item.category,
  description: item.description,
  isAvailable: item.isAvailable,
});

// verifySession guarantees the session user exists on every route below.
const findMyVendor = (req: Request) =>
  Vendor.findOne({ owner: req.session.userId as string });

// ---------- profile ----------

const getMyVendor = async (req: Request, res: Response): Promise<void> => {
  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Business profile fetched.",
    body: { vendor: toPublicVendor(vendor) },
  });
};

// PUT = create the profile if it doesn't exist, otherwise replace it.
const upsertProfile = async (req: Request, res: Response): Promise<void> => {
  const data = vendorProfileSchema.parse(req.body);

  const existing = await findMyVendor(req);
  const vendor =
    existing ?? new Vendor({ owner: req.session.userId as string });

  vendor.set({
    businessName: data.businessName,
    description: data.description,
    address: {
      street: data.address.street,
      city: data.address.city,
      state: data.address.state,
      location: {
        type: "Point",
        coordinates: [data.location.lng, data.location.lat],
      },
    },
  });
  await vendor.save();

  return sendTsRestSuccess(res, existing ? 200 : 201, {
    success: true,
    message: existing
      ? "Business profile updated."
      : "Business profile created.",
    body: { vendor: toPublicVendor(vendor) },
  });
};

// ---------- menu ----------

const getMyMenu = async (req: Request, res: Response): Promise<void> => {
  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  const items = await MenuItem.find({ vendor: vendor._id }).sort({
    createdAt: 1,
  });

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Menu fetched.",
    body: { items: items.map(toPublicItem) },
  });
};

const addMenuItems = async (req: Request, res: Response): Promise<void> => {
  const { items } = addMenuItemsSchema.parse(req.body);

  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  const created: IMenuItem[] = await MenuItem.insertMany(
    items.map((item) => ({ ...item, vendor: vendor._id })),
  );

  return sendTsRestSuccess(res, 201, {
    success: true,
    message: `${created.length} menu item(s) added.`,
    body: { items: created.map(toPublicItem) },
  });
};

const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  const { itemId } = itemIdParamSchema.parse(req.params);
  const data = updateMenuItemSchema.parse(req.body);

  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  // Filtering on vendor as well as _id is what stops one vendor from
  // editing another vendor's items by guessing ids.
  const item = await MenuItem.findOneAndUpdate(
    { _id: itemId, vendor: vendor._id },
    { $set: data },
    { new: true, runValidators: true },
  );
  if (!item) return sendTsRestError(res, 404, "Menu item not found.");

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Menu item updated.",
    body: { item: toPublicItem(item) },
  });
};

const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  const { itemId } = itemIdParamSchema.parse(req.params);

  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  const item = await MenuItem.findOneAndDelete({
    _id: itemId,
    vendor: vendor._id,
  });
  if (!item) return sendTsRestError(res, 404, "Menu item not found.");

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Menu item deleted.",
    body: { id: itemId },
  });
};

// ---------- go live ----------

const goLive = async (req: Request, res: Response): Promise<void> => {
  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  if (vendor.storefrontStatus === "live") {
    return sendTsRestError(res, 409, "Your storefront is already live.");
  }

  const hasItem = await MenuItem.exists({
    vendor: vendor._id,
    isAvailable: true,
  });
  if (!hasItem) {
    return sendTsRestError(
      res,
      400,
      "Add at least one available menu item before going live.",
    );
  }

  vendor.storefrontStatus = "live";
  await vendor.save();

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Your storefront is live.",
    body: { vendor: toPublicVendor(vendor) },
  });
};

// ---------- verification ----------

// The vendor asks to be verified; an admin decides (see adminController).
// A vendor can go live while unverified. Verification only raises their trust tier and order limit.
const requestVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const data = verificationRequestSchema.parse(req.body ?? {});

  const vendor = await findMyVendor(req);
  if (!vendor) return sendTsRestError(res, 404, NO_PROFILE);

  if (vendor.verificationTier === "verified") {
    return sendTsRestError(res, 409, "Your business is already verified.");
  }
  if (vendor.verificationTier === "pending") {
    return sendTsRestError(
      res,
      409,
      "Your verification request is already under review.",
    );
  }

  vendor.verificationTier = "pending";
  // Replacing the whole subdocument also clears any earlier rejection's
  // reviewedAt / decisionNote when the vendor resubmits.
  vendor.set("verification", {
    registrationNumber: data.registrationNumber,
    note: data.note,
    submittedAt: new Date(),
  });
  await vendor.save();

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Verification request submitted.",
    body: { vendor: toPublicVendor(vendor) },
  });
};

export const getMyVendorController = tryCatchWrapper(getMyVendor);
export const requestVerificationController =
  tryCatchWrapper(requestVerification);
export const upsertProfileController = tryCatchWrapper(upsertProfile);
export const getMyMenuController = tryCatchWrapper(getMyMenu);
export const addMenuItemsController = tryCatchWrapper(addMenuItems);
export const updateMenuItemController = tryCatchWrapper(updateMenuItem);
export const deleteMenuItemController = tryCatchWrapper(deleteMenuItem);
export const goLiveController = tryCatchWrapper(goLive);
