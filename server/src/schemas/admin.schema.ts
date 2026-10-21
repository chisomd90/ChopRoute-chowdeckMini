import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const vendorIdParamSchema = z.object({ vendorId: objectId });

export const listVendorsQuerySchema = z.object({
  verificationTier: z.enum(["unverified", "pending", "verified"]).optional(),
  storefrontStatus: z.enum(["editing", "live"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// A rejection must come with a reason: the vendor has no other way to learn
// what to fix before resubmitting.
export const verificationDecisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
    note: z.string().trim().max(500).optional(),
    orderLimitPerDay: z.coerce.number().int().positive().max(1000).default(50),
  }),
  z.object({
    decision: z.literal("reject"),
    note: z
      .string()
      .trim()
      .min(3, "Give the vendor a reason for the rejection")
      .max(500),
  }),
]);

export type ListVendorsQuery = z.infer<typeof listVendorsQuerySchema>;
export type VerificationDecisionInput = z.infer<
  typeof verificationDecisionSchema
>;
