import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import tryCatchWrapper from "../lib/tryCatchWrapper.js";
import { sendTsRestError, sendTsRestSuccess } from "../lib/responseHandler.js";
import { env } from "../config/keys.js";
import { loginSchema, RegisterSchema } from "../schemas/auth.schema.js";

const register = async (req: Request, res: Response): Promise<void> => {
  const validatedData = RegisterSchema.parse(req.body);

  const phoneExists = await User.findOne({
    phoneNumber: validatedData.phoneNumber,
  });

  if (phoneExists) {
    return sendTsRestError(res, 400, "Phone number is already registered.");
  }

  if (validatedData.email) {
    const emailExists = await User.findOne({
      email: validatedData.email,
    });

    if (emailExists) {
      return sendTsRestError(res, 400, "Email is already registered.");
    }
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  const newUser = await User.create({
    role: validatedData.role,
    phoneNumber: validatedData.phoneNumber,
    email: validatedData.email,
    fullName: validatedData.fullName,
    password: hashedPassword,
  });

  return sendTsRestSuccess(res, 201, {
    success: true,
    message: "User registered successfully.",
    body: {
      id: newUser._id.toString(),
      phoneNumber: newUser.phoneNumber,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    },
  });
};

const login = async (req: Request, res: Response): Promise<void> => {
  const validatedData = loginSchema.parse(req.body);
  const user = await User.findOne({
    phoneNumber: validatedData.phoneNumber,
  }).select("+password");

  if (!user) {
    return sendTsRestError(res, 401, "Invalid phone number or password.");
  }

  const passwordValid = await bcrypt.compare(
    validatedData.password,
    user.password,
  );

  if (!passwordValid) {
    return sendTsRestError(res, 401, "Invalid phone number or password.");
  }

  const isVendorRoute = req.originalUrl.includes("vendor");
  const expectedRole = isVendorRoute ? "vendor" : "customer";

  if (user.role !== expectedRole) {
    return sendTsRestError(
      res,
      403,
      `Access denied. This endpoint is strictly for ${expectedRole} accounts.`,
    );
  }

  req.session.userId = user._id.toString();
  req.session.role = user.role;

  return sendTsRestSuccess(res, 200, {
    success: true,
    message: "Login successful.",
    body: {
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    },
  });
};

const logout = async (req: Request, res: Response): Promise<void> => {
  if (!req.session || !req.session.userId) {
    return sendTsRestSuccess(res, 200, {
      success: true,
      message: "Already logged out.",
      body: null,
    });
  }

  // Destroy the session row inside your MongoDB collection store
  req.session.destroy((err) => {
    if (err) {
      return sendTsRestError(
        res,
        500,
        "Failed to clear session. Please try again.",
      );
    }

    // Clear the connect.sid session cookie from Thunder Client or the browser
    res.clearCookie("connect.sid", {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    });

    return sendTsRestSuccess(res, 200, {
      success: true,
      message: "Logged out successfully.",
      body: null,
    });
  });
};

export const registerController = tryCatchWrapper(register);
export const loginController = tryCatchWrapper(login);
export const logoutController = tryCatchWrapper(logout);