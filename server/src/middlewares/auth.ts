import type { NextFunction, Request, Response } from "express";
import { sendTsRestError } from "../lib/responseHandler.js";
import type { UserRole } from "../models/user.js";


  declare global {
    namespace Express {
      interface Request {
        user?: { id: string; role?: UserRole };
      }
    }
  }

// Requires an active logged-in session
export const verifySession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.session || !req.session.userId) {
    sendTsRestError(
      res,
      401,
      "Unauthorized: No active session found. Please log in.",
    );
    return;
  }
  // req.user = {
  //   id: req.session.userId,
  //   role: req.session.role,
  // };
  next();
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.session?.role;
    if (!role || !roles.includes(role)) {
      return sendTsRestError(
        res,
        403,
        "You do not have permission to do this.",
      );
    }
    next();
  };

  export const requireAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.session?.userId) {
      sendTsRestError(res, 401, "Unauthorized: please log in to continue");
      return;
    }
    if (req.session.role !== "admin") {
      sendTsRestError(res, 403, "Forbidden: admin access only");
      return;
    }
    next();
  };
