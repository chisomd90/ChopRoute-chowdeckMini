import { z } from "zod";

// Broad regex supporting international and local phone structures
const phoneRegex =
  /^([+]?[\s0-9]{1,4})?[-.\s]?(?:[0-9]{1,3})?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/;

export const RegisterSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  email: z.email("Invalid email address format").optional(),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .optional(),
});

export const loginSchema = z.object({
  phoneNumber: z.string().trim().min(1, "Phone number is required"),

  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});


export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
