import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const vendorProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short").max(80),
  description: z.string().trim().max(500).optional(),
  address: z.object({
    street: z.string().trim().min(1, "Street is required"),
    city: z.string().trim().min(1).default("Lagos"),
    state: z.string().trim().min(1).default("Lagos"),
  }),
  // The frontend gets these from a map pin or the browser's Geolocation API.
  // Swap for server-side geocoding of the street address later if you prefer.
  location: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});

const menuItemFields = {
  name: z.string().trim().min(1, "Item name is required").max(80),
  // coerce: HTML form inputs send "150000" as a string
  priceKobo: z.coerce
    .number()
    .int()
    .positive("Price must be a positive whole number"),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(300).optional(),
};

// Add one or many items in a single request (the onboarding menu form sends several).
export const addMenuItemsSchema = z.object({
  items: z
    .array(z.object(menuItemFields))
    .min(1, "Add at least one item")
    .max(100),
});

// Only these fields can ever be changed on an item. Anything else in the
// body (like "vendor") is stripped by zod, so it can't be overwritten.
export const updateMenuItemSchema = z
  .object({ ...menuItemFields, isAvailable: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const itemIdParamSchema = z.object({ itemId: objectId });

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
export type AddMenuItemsInput = z.infer<typeof addMenuItemsSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

// Document upload isn't built yet, so for now a vendor gives a business
// registration number (e.g. CAC) and an optional note, and an admin checks by hand.
export const verificationRequestSchema = z.object({
  registrationNumber: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
});

export type VerificationRequestInput = z.infer<
  typeof verificationRequestSchema
>;
