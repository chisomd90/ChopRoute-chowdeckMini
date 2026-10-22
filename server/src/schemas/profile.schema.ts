import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().default("Lagos"),
  state: z.string().default("Lagos"),
  zipCode: z.string().optional(),
});

// Customer/rider profile completion - filled in after OTP verification,
// not at signup, per the low-friction onboarding design.
export const completeProfileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  address: addressSchema,
});

export const listUsersQuerySchema = z.object({
  role: z.enum(["customer", "vendor", "admin"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type listUsersQuery = z.infer<typeof listUsersQuerySchema>;